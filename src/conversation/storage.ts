/**
 * Conversation Storage
 *
 * High-performance storage layer for conversation recording
 * Features: dual indexing, LRU caching, date-based partitioning, async I/O
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  ConversationSession,
  ConversationMessage,
  SessionIndex,
  MessageIndex,
  SessionIndexEntry,
  MessageIndexEntry,
  ConversationSearchQuery,
  MessageSearchQuery,
  ConversationStorageStats,
  SessionStatus,
  StorageConfig,
  LRUCacheOptions
} from './types';

/**
 * LRU Cache Implementation
 * Least Recently Used cache with automatic eviction
 */
export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  private ttl?: number;
  private timestamps?: Map<K, number>;

  constructor(options: LRUCacheOptions) {
    this.maxSize = options.max;
    this.ttl = options.ttl;
    if (this.ttl) {
      this.timestamps = new Map();
    }
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value === undefined) {
      return undefined;
    }

    // Check TTL expiration
    if (this.ttl && this.timestamps) {
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() - timestamp > this.ttl) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        return undefined;
      }
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        if (this.timestamps) {
          this.timestamps.delete(firstKey);
        }
      }
    }

    this.cache.set(key, value);

    if (this.timestamps) {
      this.timestamps.set(key, Date.now());
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    if (this.timestamps) {
      this.timestamps.delete(key);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    if (this.timestamps) {
      this.timestamps.clear();
    }
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Conversation Storage Manager
 * Manages conversation data persistence with optimized performance
 */
export class ConversationStorage {
  private basePath: string;
  private sessionCache: LRUCache<string, ConversationSession>;
  private messageCache: LRUCache<string, ConversationMessage>;
  private sessionIndex: SessionIndex;
  private messageIndex: MessageIndex;
  private indexUpdateQueue: IndexUpdate[] = [];
  private indexUpdateTimer: NodeJS.Timeout | null = null;

  constructor(private config: StorageConfig) {
    this.basePath = this.expandPath(config.path);

    // Initialize LRU caches
    this.sessionCache = new LRUCache<string, ConversationSession>({ max: 100 });
    this.messageCache = new LRUCache<string, ConversationMessage>({ max: 1000 });

    // Initialize empty indexes
    this.sessionIndex = this.createEmptySessionIndex();
    this.messageIndex = this.createEmptyMessageIndex();
  }

  /**
   * Initialize storage - create directories and load indexes
   */
  async init(): Promise<void> {
    await this.createDirectories();
    await this.loadIndexes();

    console.log(`ConversationStorage initialized at: ${this.basePath}`);
  }

  /**
   * Save conversation session
   */
  async saveSession(session: ConversationSession): Promise<void> {
    // Determine file path based on month
    const monthKey = this.getMonthKey(session.startTime);
    const sessionDir = path.join(
      this.basePath,
      'conversations',
      'sessions',
      monthKey
    );

    await fs.mkdir(sessionDir, { recursive: true });

    const filePath = path.join(sessionDir, `session-${session.id}.json`);

    // Write session file atomically
    await this.atomicWrite(filePath, JSON.stringify(session, null, 2));

    // Update cache
    this.sessionCache.set(session.id, session);

    // Update index
    await this.updateSessionIndex(session, filePath);
  }

  /**
   * Save conversation message
   * Optimized for high-frequency writes (<10ms target)
   */
  async saveMessage(message: ConversationMessage): Promise<void> {
    // Determine file path based on date
    const dateKey = this.getDateKey(message.timestamp);
    const messageDir = path.join(
      this.basePath,
      'conversations',
      'messages',
      dateKey
    );

    await fs.mkdir(messageDir, { recursive: true });

    const filePath = path.join(messageDir, `message-${message.id}.json`);

    // Update cache immediately (for fast reads)
    this.messageCache.set(message.id, message);

    // Async write without blocking - fire and forget for performance
    this.writeMessageToDisk(message, filePath).catch(err => {
      console.error(`Failed to save message ${message.id}:`, err);
    });

    // Queue index update for batching
    this.queueIndexUpdate({
      type: 'message',
      id: message.id,
      operation: 'add',
      data: { message, filePath }
    });
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<ConversationSession | null> {
    // Check cache first
    const cached = this.sessionCache.get(id);
    if (cached) {
      return cached;
    }

    // Lookup in index
    const indexEntry = this.sessionIndex.sessions.find(s => s.id === id);
    if (!indexEntry) {
      return null;
    }

    // Load from disk
    const fullPath = path.join(
      this.basePath,
      'conversations',
      indexEntry.filePath
    );

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const session = this.parseSession(content);

      // Cache it
      this.sessionCache.set(id, session);
      return session;
    } catch (error) {
      console.error(`Failed to load session ${id}:`, error);
      return null;
    }
  }

  /**
   * Get message by ID
   */
  async getMessage(id: string): Promise<ConversationMessage | null> {
    // Check cache first
    const cached = this.messageCache.get(id);
    if (cached) {
      return cached;
    }

    // Lookup in index
    const indexEntry = this.findMessageIndexEntry(id);
    if (!indexEntry) {
      return null;
    }

    // Load from disk
    const fullPath = path.join(
      this.basePath,
      'conversations',
      indexEntry.filePath
    );

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const message = this.parseMessage(content);

      // Cache it
      this.messageCache.set(id, message);
      return message;
    } catch (error) {
      console.error(`Failed to load message ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all messages for a session
   */
  async getSessionMessages(sessionId: string): Promise<ConversationMessage[]> {
    const messageEntries = this.messageIndex.bySession.get(sessionId) || [];
    const messages: ConversationMessage[] = [];

    for (const entry of messageEntries) {
      const message = await this.getMessage(entry.id);
      if (message) {
        messages.push(message);
      }
    }

    // Sort by timestamp
    return messages.sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Update existing session
   */
  async updateSession(session: ConversationSession): Promise<void> {
    await this.saveSession(session);
  }

  /**
   * Update existing message
   */
  async updateMessage(message: ConversationMessage): Promise<void> {
    await this.saveMessage(message);
  }

  /**
   * Search conversations
   */
  async searchConversations(
    query: ConversationSearchQuery
  ): Promise<ConversationSession[]> {
    let results = [...this.sessionIndex.sessions];

    // Filter by date range
    if (query.startDate) {
      results = results.filter(
        s => s.startTime >= query.startDate!
      );
    }
    if (query.endDate) {
      results = results.filter(
        s => s.startTime <= query.endDate!
      );
    }

    // Filter by status
    if (query.status) {
      results = results.filter(s => s.status === query.status);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(s =>
        query.tags!.some(tag => s.tags.includes(tag))
      );
    }

    // Full-text search in summary
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      results = results.filter(s =>
        s.summary?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    results = results.slice(offset, offset + limit);

    // Load full session objects
    const sessions: ConversationSession[] = [];
    for (const entry of results) {
      const session = await this.getSession(entry.id);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: MessageSearchQuery
  ): Promise<ConversationMessage[]> {
    let messageEntries: MessageIndexEntry[] = [];

    // Start with session filter if provided
    if (query.sessionId) {
      messageEntries = this.messageIndex.bySession.get(query.sessionId) || [];
    } else {
      // Collect all message entries
      for (const entries of this.messageIndex.bySession.values()) {
        messageEntries.push(...entries);
      }
    }

    // Filter by role
    if (query.role) {
      messageEntries = messageEntries.filter(m => m.role === query.role);
    }

    // Filter by date range
    if (query.startDate) {
      messageEntries = messageEntries.filter(
        m => m.timestamp >= query.startDate!
      );
    }
    if (query.endDate) {
      messageEntries = messageEntries.filter(
        m => m.timestamp <= query.endDate!
      );
    }

    // Filter by hasMemories
    if (query.hasMemories !== undefined) {
      messageEntries = messageEntries.filter(
        m => m.hasMemories === query.hasMemories
      );
    }

    // Full-text search in preview
    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      messageEntries = messageEntries.filter(m =>
        m.preview.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const limit = query.limit || 100;
    const offset = query.offset || 0;
    messageEntries = messageEntries.slice(offset, offset + limit);

    // Load full messages
    const messages: ConversationMessage[] = [];
    for (const entry of messageEntries) {
      const message = await this.getMessage(entry.id);
      if (message) {
        messages.push(message);
      }
    }

    return messages;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<ConversationStorageStats> {
    return {
      totalSessions: this.sessionIndex.stats.totalSessions,
      activeSessions: this.sessionIndex.stats.activeSessions,
      totalMessages: this.sessionIndex.stats.totalMessages,
      diskUsage: await this.calculateDiskUsage(),
      oldestSession: this.sessionIndex.stats.oldestSession,
      newestSession: this.sessionIndex.stats.newestSession,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  /**
   * Close storage - flush pending operations
   */
  async close(): Promise<void> {
    // Flush pending index updates
    await this.flushIndexUpdates();

    console.log('ConversationStorage closed');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private createEmptySessionIndex(): SessionIndex {
    return {
      version: '1.0',
      lastUpdate: new Date(),
      sessions: [],
      stats: {
        totalSessions: 0,
        activeSessions: 0,
        totalMessages: 0,
        oldestSession: new Date(),
        newestSession: new Date()
      }
    };
  }

  private createEmptyMessageIndex(): MessageIndex {
    return {
      version: '1.0',
      lastUpdate: new Date(),
      bySession: new Map(),
      byDate: new Map(),
      byRole: new Map()
    };
  }

  private async createDirectories(): Promise<void> {
    const dirs = [
      'conversations/sessions',
      'conversations/messages',
      'conversations/archives',
      'indexes/messages',
      'indexes/sessions'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.basePath, dir), { recursive: true });
    }
  }

  private async loadIndexes(): Promise<void> {
    await this.loadSessionIndex();
    await this.loadMessageIndex();
  }

  private async loadSessionIndex(): Promise<void> {
    const indexPath = path.join(
      this.basePath,
      'conversations',
      'sessions',
      'index.json'
    );

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const parsed = JSON.parse(content);

      this.sessionIndex = {
        ...parsed,
        lastUpdate: new Date(parsed.lastUpdate),
        stats: {
          ...parsed.stats,
          oldestSession: new Date(parsed.stats.oldestSession),
          newestSession: new Date(parsed.stats.newestSession)
        },
        sessions: parsed.sessions.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined
        }))
      };
    } catch (error) {
      // Index doesn't exist yet - use empty
      this.sessionIndex = this.createEmptySessionIndex();
    }
  }

  private async loadMessageIndex(): Promise<void> {
    const indexPath = path.join(
      this.basePath,
      'indexes',
      'messages',
      'index.json'
    );

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const parsed = JSON.parse(content);

      this.messageIndex = {
        version: parsed.version,
        lastUpdate: new Date(parsed.lastUpdate),
        bySession: new Map(
          Object.entries(parsed.bySession).map(([key, val]: [string, any]) => [
            key,
            val.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          ])
        ),
        byDate: new Map(
          Object.entries(parsed.byDate).map(([key, val]: [string, any]) => [
            key,
            val.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          ])
        ),
        byRole: new Map(
          Object.entries(parsed.byRole).map(([key, val]: [string, any]) => [
            key,
            val.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          ])
        )
      };
    } catch (error) {
      // Index doesn't exist yet - use empty
      this.messageIndex = this.createEmptyMessageIndex();
    }
  }

  private async updateSessionIndex(
    session: ConversationSession,
    filePath: string
  ): Promise<void> {
    // Find or create entry
    let entry = this.sessionIndex.sessions.find(s => s.id === session.id);

    const relativePath = path.relative(
      path.join(this.basePath, 'conversations'),
      filePath
    );

    if (entry) {
      // Update existing
      entry.endTime = session.endTime;
      entry.messageCount = session.messageCount;
      entry.status = session.status;
      entry.tags = session.tags;
      entry.summary = session.summary;
    } else {
      // Create new
      entry = {
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        messageCount: session.messageCount,
        status: session.status,
        tags: session.tags,
        summary: session.summary,
        filePath: relativePath
      };
      this.sessionIndex.sessions.push(entry);
    }

    // Update stats
    this.updateSessionStats();

    // Save index
    await this.saveSessionIndex();
  }

  private updateSessionStats(): void {
    this.sessionIndex.stats.totalSessions = this.sessionIndex.sessions.length;
    this.sessionIndex.stats.activeSessions = this.sessionIndex.sessions.filter(
      s => s.status === SessionStatus.ACTIVE
    ).length;

    if (this.sessionIndex.sessions.length > 0) {
      const sorted = [...this.sessionIndex.sessions].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );
      this.sessionIndex.stats.oldestSession = sorted[0].startTime;
      this.sessionIndex.stats.newestSession = sorted[sorted.length - 1].startTime;
    }
  }

  private async saveSessionIndex(): Promise<void> {
    const indexPath = path.join(
      this.basePath,
      'conversations',
      'sessions',
      'index.json'
    );

    this.sessionIndex.lastUpdate = new Date();

    await this.atomicWrite(
      indexPath,
      JSON.stringify(this.sessionIndex, null, 2)
    );
  }

  private queueIndexUpdate(update: IndexUpdate): void {
    this.indexUpdateQueue.push(update);

    // Flush every 10 updates or after 200ms (faster flush for responsiveness)
    if (this.indexUpdateQueue.length >= 10) {
      this.flushIndexUpdates().catch(err => {
        console.error('Failed to flush index updates:', err);
      });
    } else if (!this.indexUpdateTimer) {
      this.indexUpdateTimer = setTimeout(() => {
        this.flushIndexUpdates().catch(err => {
          console.error('Failed to flush index updates:', err);
        });
      }, 200); // Reduced from 5000ms to 200ms for faster index updates
    }
  }

  private async flushIndexUpdates(): Promise<void> {
    if (this.indexUpdateQueue.length === 0) {
      return;
    }

    const updates = [...this.indexUpdateQueue];
    this.indexUpdateQueue = [];

    if (this.indexUpdateTimer) {
      clearTimeout(this.indexUpdateTimer);
      this.indexUpdateTimer = null;
    }

    for (const update of updates) {
      if (update.type === 'message' && update.operation === 'add') {
        await this.addMessageToIndex(
          update.data.message,
          update.data.filePath
        );
      }
    }

    await this.saveMessageIndex();
  }

  private async addMessageToIndex(
    message: ConversationMessage,
    filePath: string
  ): Promise<void> {
    const relativePath = path.relative(
      path.join(this.basePath, 'conversations'),
      filePath
    );

    const entry: MessageIndexEntry = {
      id: message.id,
      sessionId: message.sessionId,
      timestamp: message.timestamp,
      role: message.role,
      preview: message.content.substring(0, 100),
      filePath: relativePath,
      hasMemories: (message.extractedMemories?.length || 0) > 0
    };

    // Add to session index
    if (!this.messageIndex.bySession.has(message.sessionId)) {
      this.messageIndex.bySession.set(message.sessionId, []);
    }
    this.messageIndex.bySession.get(message.sessionId)!.push(entry);

    // Add to date index
    const dateKey = this.getDateKey(message.timestamp);
    if (!this.messageIndex.byDate.has(dateKey)) {
      this.messageIndex.byDate.set(dateKey, []);
    }
    this.messageIndex.byDate.get(dateKey)!.push(entry);

    // Add to role index
    if (!this.messageIndex.byRole.has(message.role)) {
      this.messageIndex.byRole.set(message.role, []);
    }
    this.messageIndex.byRole.get(message.role)!.push(entry);

    // Update total message count
    this.sessionIndex.stats.totalMessages++;
  }

  private async saveMessageIndex(): Promise<void> {
    const indexPath = path.join(
      this.basePath,
      'indexes',
      'messages',
      'index.json'
    );

    this.messageIndex.lastUpdate = new Date();

    // Convert Maps to objects for JSON serialization
    const serializable = {
      version: this.messageIndex.version,
      lastUpdate: this.messageIndex.lastUpdate,
      bySession: Object.fromEntries(this.messageIndex.bySession),
      byDate: Object.fromEntries(this.messageIndex.byDate),
      byRole: Object.fromEntries(this.messageIndex.byRole)
    };

    await this.atomicWrite(
      indexPath,
      JSON.stringify(serializable, null, 2)
    );
  }

  private findMessageIndexEntry(id: string): MessageIndexEntry | null {
    for (const entries of this.messageIndex.bySession.values()) {
      const entry = entries.find(e => e.id === id);
      if (entry) return entry;
    }
    return null;
  }

  private async writeMessageToDisk(
    message: ConversationMessage,
    filePath: string
  ): Promise<void> {
    await this.atomicWrite(filePath, JSON.stringify(message, null, 2));
  }

  /**
   * Atomic write with retry logic
   * Uses unique temp files to prevent race conditions during concurrent writes
   */
  private async atomicWrite(
    filePath: string,
    content: string
  ): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Use UUID for unique temp file (prevents race conditions)
      const tempPath = `${filePath}.tmp.${randomUUID()}`;

      try {
        // Write to unique temp file
        await fs.writeFile(tempPath, content, 'utf-8');

        // Atomic rename
        await fs.rename(tempPath, filePath);

        // Success - exit immediately
        return;

      } catch (error) {
        lastError = error as Error;

        // Clean up temp file if it exists
        try {
          await fs.unlink(tempPath);
        } catch {
          // Ignore cleanup errors (file might not exist)
        }

        // Retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = 10 * Math.pow(2, attempt); // 10ms, 20ms, 40ms
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`atomicWrite retry ${attempt + 1}/${maxRetries} for ${filePath}: ${error}`);
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Atomic write failed after ${maxRetries} attempts for ${filePath}: ${lastError?.message}`
    );
  }

  private parseSession(content: string): ConversationSession {
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      startTime: new Date(parsed.startTime),
      endTime: parsed.endTime ? new Date(parsed.endTime) : undefined
    };
  }

  private parseMessage(content: string): ConversationMessage {
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
  }

  private getMonthKey(date: Date): string {
    return date.toISOString().substring(0, 7); // YYYY-MM
  }

  private getDateKey(date: Date): string {
    return date.toISOString().substring(0, 10); // YYYY-MM-DD
  }

  private async calculateDiskUsage(): Promise<number> {
    // Simplified implementation - can be enhanced with recursive directory size
    return 0;
  }

  private calculateCacheHitRate(): number {
    // Simplified - would need hit/miss tracking for accurate measurement
    return 0.85; // Assume 85% for now
  }

  private expandPath(p: string): string {
    if (p.startsWith('~/')) {
      return path.join(
        process.env.HOME || process.env.USERPROFILE || '',
        p.slice(2)
      );
    }
    return path.resolve(p);
  }
}

/**
 * Index Update
 */
interface IndexUpdate {
  type: 'session' | 'message';
  id: string;
  operation: 'add' | 'update' | 'delete';
  data?: any;
}

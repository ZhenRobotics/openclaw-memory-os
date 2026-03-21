/**
 * Memory-OS Core Class
 *
 * 主核心类，提供完整的记忆管理功能
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Memory,
  MemoryType,
  MemoryOSConfig,
  SearchQuery,
  SearchResult,
  TimelineQuery,
  TimelineResult,
  GraphQuery,
  GraphNode,
  CollectResult,
  StorageStats,
  MemoryEvent,
} from './types';

export class MemoryOS extends EventEmitter {
  private config: MemoryOSConfig;
  private storage: any; // Storage instance
  private collectors: Map<string, any> = new Map();
  private processors: Map<string, any> = new Map();
  private initialized: boolean = false;

  constructor(config: Partial<MemoryOSConfig>) {
    super();
    this.config = this.mergeConfig(config);
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('Memory-OS already initialized');
    }

    console.log('Initializing Memory-OS...');

    // Initialize storage
    await this.initStorage();

    // Initialize collectors
    await this.initCollectors();

    // Initialize processors
    await this.initProcessors();

    this.initialized = true;
    console.log('Memory-OS initialized successfully');
  }

  private async initStorage(): Promise<void> {
    const { LocalStorage } = await import('../storage/local-storage');
    this.storage = new LocalStorage(this.config.storage);
    await this.storage.init();
    console.log('Storage initialized');
  }

  private async initCollectors(): Promise<void> {
    // TODO: Initialize collectors based on config
    console.log('Collectors initialized');
  }

  private async initProcessors(): Promise<void> {
    // TODO: Initialize processors
    console.log('Processors initialized');
  }

  // ============================================================================
  // Memory Collection
  // ============================================================================

  async collect(options: {
    type: MemoryType;
    content: any;
    metadata?: Partial<Memory['metadata']>;
  }): Promise<Memory> {
    this.ensureInitialized();

    const memory: Memory = {
      id: uuidv4(),
      type: options.type,
      content: options.content,
      metadata: {
        source: options.metadata?.source || 'manual',
        timestamp: new Date(),
        tags: options.metadata?.tags || [],
        context: options.metadata?.context,
        ...options.metadata,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Process memory (embedding, extraction, etc.)
    await this.processMemory(memory);

    // Store memory
    await this.storage?.save(memory);

    // Emit event
    this.emit(MemoryEvent.COLLECTED, { event: MemoryEvent.COLLECTED, memory, timestamp: new Date() });

    return memory;
  }

  async collectBatch(memories: Array<{
    type: MemoryType;
    content: any;
    metadata?: Partial<Memory['metadata']>;
  }>): Promise<CollectResult> {
    this.ensureInitialized();

    const results: Memory[] = [];
    const errors: Error[] = [];

    for (const item of memories) {
      try {
        const memory = await this.collect(item);
        results.push(memory);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    return {
      collected: results.length,
      failed: errors.length,
      memories: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async processMemory(memory: Memory): Promise<void> {
    // TODO: Process memory through processors
    // - Generate embedding
    // - Extract entities
    // - Discover relations
    // - Analyze sentiment/topics
  }

  // ============================================================================
  // Search & Retrieval
  // ============================================================================

  async search(query: SearchQuery): Promise<SearchResult[]> {
    this.ensureInitialized();

    // Get all memories
    const allMemories = await this.storage.list();

    // Filter memories based on query
    const filtered = allMemories.filter((memory: Memory) => {
      // Type filter
      if (query.type && memory.type !== query.type) {
        return false;
      }

      // Keyword search - search in content
      if (query.query) {
        const contentStr = typeof memory.content === 'string'
          ? memory.content
          : JSON.stringify(memory.content);

        if (!contentStr.toLowerCase().includes(query.query.toLowerCase())) {
          return false;
        }
      }

      // Tag filter (if SearchQuery had tags support)
      const queryAny = query as any;
      if (queryAny.tags && queryAny.tags.length > 0) {
        const hasMatchingTag = queryAny.tags.some((tag: string) =>
          memory.metadata.tags?.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });

    // Apply limit and offset
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    // Convert to SearchResult format
    return paginated.map((memory: Memory) => ({
      memory,
      score: 1.0, // Simple implementation - all matches get full score
      highlights: []
    }));
  }

  async searchSemantic(query: string, options?: {
    type?: MemoryType;
    limit?: number;
  }): Promise<SearchResult[]> {
    return this.search({
      query,
      semantic: true,
      type: options?.type,
      limit: options?.limit || 10,
    });
  }

  async get(id: string): Promise<Memory | null> {
    this.ensureInitialized();
    return await this.storage?.get(id);
  }

  async getMany(ids: string[]): Promise<Memory[]> {
    this.ensureInitialized();
    const memories: Memory[] = [];

    for (const id of ids) {
      const memory = await this.get(id);
      if (memory) {
        memories.push(memory);
      }
    }

    return memories;
  }

  // ============================================================================
  // Timeline
  // ============================================================================

  async timeline(query: TimelineQuery): Promise<TimelineResult> {
    this.ensureInitialized();

    // TODO: Implement timeline query
    // - Query by date/range
    // - Filter by type
    // - Group by time periods

    return {
      date: query.date || new Date(),
      memories: [],
      stats: {
        total: 0,
        byType: {} as Record<MemoryType, number>,
      },
    };
  }

  // ============================================================================
  // Graph
  // ============================================================================

  async graph(query: GraphQuery): Promise<GraphNode> {
    this.ensureInitialized();

    // TODO: Implement graph traversal
    // - Start from a memory
    // - Traverse relations
    // - Build subgraph

    const memory = await this.get(query.memoryId);
    if (!memory) {
      throw new Error(`Memory not found: ${query.memoryId}`);
    }

    return {
      memory,
      relations: [],
    };
  }

  // ============================================================================
  // Update & Delete
  // ============================================================================

  async update(id: string, updates: Partial<Memory>): Promise<Memory> {
    this.ensureInitialized();

    const memory = await this.get(id);
    if (!memory) {
      throw new Error(`Memory not found: ${id}`);
    }

    const updated = {
      ...memory,
      ...updates,
      updatedAt: new Date(),
    };

    await this.storage?.save(updated);

    this.emit(MemoryEvent.UPDATED, { event: MemoryEvent.UPDATED, memory: updated, timestamp: new Date() });

    return updated;
  }

  async delete(id: string): Promise<void> {
    this.ensureInitialized();

    await this.storage?.delete(id);

    this.emit(MemoryEvent.DELETED, { event: MemoryEvent.DELETED, timestamp: new Date() });
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  async stats(): Promise<StorageStats> {
    this.ensureInitialized();

    const allMemories = await this.storage.list();

    // Count by type
    const byType: Record<string, number> = {};
    allMemories.forEach((memory: Memory) => {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    });

    // Count by source
    const bySource: Record<string, number> = {};
    allMemories.forEach((memory: Memory) => {
      const source = memory.metadata.source || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
    });

    return {
      totalMemories: allMemories.length,
      byType: byType as Record<MemoryType, number>,
      bySource,
      diskUsage: 0, // TODO: Calculate actual disk usage
      lastUpdate: new Date(),
    };
  }

  // ============================================================================
  // Maintenance
  // ============================================================================

  async rebuild(): Promise<void> {
    this.ensureInitialized();
    console.log('Rebuilding indexes...');
    // TODO: Rebuild all indexes
  }

  async optimize(): Promise<void> {
    this.ensureInitialized();
    console.log('Optimizing storage...');
    // TODO: Optimize storage
  }

  async export(path: string): Promise<void> {
    this.ensureInitialized();
    console.log(`Exporting to ${path}...`);
    // TODO: Export all data
  }

  async import(path: string): Promise<void> {
    this.ensureInitialized();
    console.log(`Importing from ${path}...`);
    // TODO: Import data
  }

  // ============================================================================
  // Collectors
  // ============================================================================

  registerCollector(name: string, collector: any): void {
    this.collectors.set(name, collector);
  }

  getCollector(name: string): any {
    return this.collectors.get(name);
  }

  // ============================================================================
  // Processors
  // ============================================================================

  registerProcessor(name: string, processor: any): void {
    this.processors.set(name, processor);
  }

  getProcessor(name: string): any {
    return this.processors.get(name);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Memory-OS not initialized. Call init() first.');
    }
  }

  private mergeConfig(config: Partial<MemoryOSConfig>): MemoryOSConfig {
    // Support both 'storePath' shorthand and full 'storage' config
    const configAny = config as any;
    const storagePath = configAny.storePath || config.storage?.path || '~/.memory-os/data';

    return {
      storage: {
        path: storagePath,
        backend: 'local' as any,
        ...config.storage,
      },
      collectors: config.collectors || [],
      privacy: {
        encryption: false,
        shareStats: false,
        anonymize: false,
        ...config.privacy,
      },
      ...config,
    } as MemoryOSConfig;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('Closing Memory-OS...');

    // Close storage
    await this.storage?.close?.();

    this.initialized = false;
    console.log('Memory-OS closed');
  }
}

/**
 * Session Manager
 *
 * Manages conversation session lifecycle and state
 * Features: session creation, timeout management, activity tracking
 */

import { ConversationStorage } from './storage';
import {
  ConversationSession,
  ConversationMessage,
  ConversationMetadata,
  ConversationParticipant,
  RecordingConfig,
  SessionStatus
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Session Manager
 * Handles conversation session lifecycle
 */
export class SessionManager {
  private activeSessions: Map<string, ConversationSession> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private storage: ConversationStorage,
    private config: RecordingConfig
  ) {}

  /**
   * Start new conversation session
   */
  async startSession(
    metadata?: Partial<ConversationMetadata>
  ): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: uuidv4(),
      startTime: new Date(),
      messageCount: 0,
      participants: [
        { role: 'user' },
        { role: 'assistant' }
      ],
      metadata: {
        source: 'openclaw',
        recordingMode: this.config.mode,
        ...metadata
      },
      status: SessionStatus.ACTIVE,
      tags: []
    };

    // Store session
    await this.storage.saveSession(session);
    this.activeSessions.set(session.id, session);

    // Set auto-close timeout
    this.setSessionTimeout(session.id);

    console.log(`Session started: ${session.id}`);
    return session;
  }

  /**
   * End conversation session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      // Try to load from storage
      const stored = await this.storage.getSession(sessionId);
      if (!stored) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (stored.status !== SessionStatus.ACTIVE) {
        throw new Error(`Session is not active: ${sessionId}`);
      }

      // Use stored session
      this.activeSessions.set(sessionId, stored);
    }

    // Get updated session
    const activeSession = this.activeSessions.get(sessionId)!;

    // Update session
    activeSession.endTime = new Date();
    activeSession.status = SessionStatus.COMPLETED;

    // Generate summary if enabled
    if (this.config.generateSummaries) {
      activeSession.summary = await this.generateSessionSummary(activeSession);
    }

    // Save and cleanup
    await this.storage.saveSession(activeSession);
    this.activeSessions.delete(sessionId);
    this.clearSessionTimeout(sessionId);

    console.log(`Session ended: ${sessionId}`);
  }

  /**
   * Update session with new message
   */
  async updateSessionWithMessage(
    sessionId: string,
    message: ConversationMessage
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      // Try to load from storage
      const stored = await this.storage.getSession(sessionId);
      if (!stored) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      this.activeSessions.set(sessionId, stored);
    }

    const activeSession = this.activeSessions.get(sessionId)!;

    // Update message count
    activeSession.messageCount++;

    // Check if we need to add participant
    const hasParticipant = activeSession.participants.some(
      p => p.role === message.role
    );

    if (!hasParticipant) {
      activeSession.participants.push({ role: message.role });
    }

    // Check message limit
    if (
      this.config.maxMessagesPerSession &&
      activeSession.messageCount >= this.config.maxMessagesPerSession
    ) {
      console.log(
        `Session ${sessionId} reached message limit, ending session`
      );
      await this.endSession(sessionId);
      return;
    }

    // Save updated session
    await this.storage.saveSession(activeSession);

    // Refresh timeout (session is still active)
    this.refreshSessionTimeout(sessionId);
  }

  /**
   * Refresh session timeout (called on new activity)
   */
  refreshSessionTimeout(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return;
    }

    // Clear existing timeout
    this.clearSessionTimeout(sessionId);

    // Set new timeout
    this.setSessionTimeout(sessionId);
  }

  /**
   * Get active session for current context
   * Returns the most recent active session or creates a new one
   */
  async getCurrentSession(): Promise<ConversationSession> {
    // Find most recent active session
    const activeSessions = Array.from(this.activeSessions.values());

    if (activeSessions.length > 0) {
      // Sort by start time, most recent first
      const sorted = activeSessions.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
      );
      return sorted[0];
    }

    // No active sessions, create a new one
    return await this.startSession();
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): ConversationSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    // Check active sessions first
    const active = this.activeSessions.get(sessionId);
    if (active) {
      return active;
    }

    // Load from storage
    return await this.storage.getSession(sessionId);
  }

  /**
   * Archive session
   */
  async archiveSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = SessionStatus.ARCHIVED;
    session.endTime = session.endTime || new Date();

    await this.storage.saveSession(session);

    // Remove from active sessions if present
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
      this.clearSessionTimeout(sessionId);
    }

    console.log(`Session archived: ${sessionId}`);
  }

  /**
   * Add tags to session
   */
  async addSessionTags(sessionId: string, tags: string[]): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Merge tags (avoid duplicates)
    const uniqueTags = new Set([...session.tags, ...tags]);
    session.tags = Array.from(uniqueTags);

    await this.storage.saveSession(session);
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(
    sessionId: string,
    metadata: Partial<ConversationMetadata>
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.metadata = {
      ...session.metadata,
      ...metadata
    };

    await this.storage.saveSession(session);
  }

  /**
   * Close all active sessions
   */
  async closeAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.activeSessions.keys());

    for (const sessionId of sessionIds) {
      try {
        await this.endSession(sessionId);
      } catch (error) {
        console.error(`Failed to close session ${sessionId}:`, error);
      }
    }

    console.log(`Closed ${sessionIds.length} active sessions`);
  }

  /**
   * Cleanup all resources
   * Call this before destroying the session manager
   */
  async destroy(): Promise<void> {
    // Clear all timeouts
    for (const [sessionId, timeout] of this.sessionTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.sessionTimeouts.clear();

    // Close all active sessions
    await this.closeAllSessions();

    // Clear active sessions map
    this.activeSessions.clear();

    console.log('SessionManager destroyed - all resources cleaned up');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Set auto-close timeout for session
   */
  private setSessionTimeout(sessionId: string): void {
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;

    const timeout = setTimeout(async () => {
      console.log(`Auto-closing session ${sessionId} due to timeout`);
      try {
        await this.endSession(sessionId);
      } catch (error) {
        console.error(`Failed to auto-close session ${sessionId}:`, error);
      }
    }, timeoutMs);

    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);

    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * Generate session summary
   * Creates a brief summary of the conversation
   */
  private async generateSessionSummary(
    session: ConversationSession
  ): Promise<string> {
    // Load messages for this session
    const messages = await this.storage.getSessionMessages(session.id);

    if (messages.length === 0) {
      return 'Empty conversation';
    }

    if (messages.length === 1) {
      return this.truncateText(messages[0].content, 100);
    }

    if (messages.length === 2) {
      const summaryParts = messages.map(m =>
        this.truncateText(m.content, 50)
      );
      return summaryParts.join(' ... ');
    }

    // For longer conversations, use first and last messages
    const firstMsg = this.truncateText(messages[0].content, 50);
    const lastMsg = this.truncateText(
      messages[messages.length - 1].content,
      50
    );

    return `${firstMsg} ... ${lastMsg} (${messages.length} messages)`;
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}

/**
 * Conversation Recording Types
 *
 * Type definitions for full conversation recording feature in v0.2.0
 * Supports session management, message storage, and privacy filtering
 */

// ============================================================================
// Core Conversation Types
// ============================================================================

/**
 * Conversation Session
 * Represents a continuous conversation with OpenClaw or other AI systems
 */
export interface ConversationSession {
  /** Unique session identifier (UUID) */
  id: string;

  /** Session start timestamp */
  startTime: Date;

  /** Session end timestamp (null if active) */
  endTime?: Date;

  /** Total messages in session */
  messageCount: number;

  /** Conversation participants */
  participants: ConversationParticipant[];

  /** Session metadata */
  metadata: ConversationMetadata;

  /** Session status */
  status: SessionStatus;

  /** User-defined tags */
  tags: string[];

  /** AI-generated summary (optional) */
  summary?: string;
}

/**
 * Conversation Participant
 */
export interface ConversationParticipant {
  role: 'user' | 'assistant' | 'system';
  name?: string;
}

/**
 * Conversation Metadata
 */
export interface ConversationMetadata {
  /** Source of conversation */
  source: 'openclaw' | 'manual' | 'import';

  /** Recording mode used */
  recordingMode: RecordingMode;

  /** Optional context description */
  context?: string;

  /** Link to project/task */
  projectId?: string;

  /** Location where conversation took place */
  location?: string;

  /** Extensible metadata */
  [key: string]: any;
}

/**
 * Session Status
 */
export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  FILTERED = 'filtered'
}

/**
 * Conversation Message
 * Individual message within a session
 */
export interface ConversationMessage {
  /** Unique message identifier (UUID) */
  id: string;

  /** Parent session ID */
  sessionId: string;

  /** Message timestamp */
  timestamp: Date;

  /** Message role */
  role: 'user' | 'assistant' | 'system';

  /** Message content */
  content: string;

  /** Message metadata */
  metadata: MessageMetadata;

  /** Token count (if available) */
  tokens?: number;

  /** Response time in milliseconds */
  responseTime?: number;

  /** IDs of memories extracted from this message */
  extractedMemories?: string[];
}

/**
 * Message Metadata
 */
export interface MessageMetadata {
  /** Message source */
  source: string;

  /** AI model used (if assistant) */
  model?: string;

  /** Tool/function calls made */
  toolCalls?: ToolCall[];

  /** File attachments */
  attachments?: Attachment[];

  /** Was message edited */
  edited?: boolean;

  /** Was content filtered */
  filtered?: boolean;

  /** Extensible metadata */
  [key: string]: any;
}

/**
 * Tool Call
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

/**
 * Attachment
 */
export interface Attachment {
  type: 'file' | 'image' | 'code';
  path?: string;
  content?: string;
  mimeType?: string;
}

// ============================================================================
// Recording Configuration Types
// ============================================================================

/**
 * Recording Mode
 */
export enum RecordingMode {
  /** No recording */
  DISABLED = 'disabled',

  /** v0.1.2 behavior - only trigger words */
  TRIGGER_ONLY = 'trigger',

  /** Smart extraction + triggers */
  SMART = 'smart',

  /** Record everything */
  FULL = 'full'
}

/**
 * Recording Configuration
 */
export interface RecordingConfig {
  /** Recording mode */
  mode: RecordingMode;

  /** Start recording on OpenClaw launch */
  autoStart: boolean;

  /** Minutes before auto-closing session */
  sessionTimeout: number;

  /** Optional message limit per session */
  maxMessagesPerSession?: number;

  /** Privacy filtering rules */
  privacyRules: PrivacyRule[];

  /** Retention policy */
  retention: RetentionPolicy;

  /** Generate session summaries */
  generateSummaries?: boolean;

  /** Link messages to extracted memories */
  linkToMemories?: boolean;

  /** Enable search indexing */
  searchIndexing?: boolean;
}

/**
 * Privacy Rule
 */
export interface PrivacyRule {
  /** Rule type */
  type: 'keyword' | 'pattern' | 'file_path';

  /** Pattern to match (string for keyword, RegExp for pattern) */
  pattern: string | RegExp;

  /** Action to take */
  action: 'filter' | 'redact' | 'block';

  /** Human-readable description */
  description: string;

  /** Is rule enabled */
  enabled?: boolean;
}

/**
 * Retention Policy
 */
export interface RetentionPolicy {
  /** Days to keep conversations */
  maxAge?: number;

  /** Max number of sessions */
  maxSessions?: number;

  /** Auto-archive old sessions */
  autoArchive: boolean;

  /** Days before archiving */
  archiveAfterDays?: number;
}

// ============================================================================
// Backwards Compatibility Types
// ============================================================================

/**
 * Conversation Context
 * Links traditional Memory to conversation messages
 */
export interface ConversationContext {
  /** Link to conversation session */
  sessionId?: string;

  /** Specific message that triggered memory */
  messageId?: string;

  /** Extraction mode used */
  extractionMode: 'trigger' | 'smart' | 'manual';

  /** Extraction confidence */
  confidence?: number;
}

// ============================================================================
// Index Structures
// ============================================================================

/**
 * Session Index
 * Fast session lookup and statistics
 */
export interface SessionIndex {
  version: string;
  lastUpdate: Date;
  sessions: SessionIndexEntry[];
  stats: SessionIndexStats;
}

/**
 * Session Index Entry
 */
export interface SessionIndexEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  status: SessionStatus;
  tags: string[];
  summary?: string;
  filePath: string;
}

/**
 * Session Index Statistics
 */
export interface SessionIndexStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  oldestSession: Date;
  newestSession: Date;
}

/**
 * Message Index
 * Fast message search and retrieval
 */
export interface MessageIndex {
  version: string;
  lastUpdate: Date;
  bySession: Map<string, MessageIndexEntry[]>;
  byDate: Map<string, MessageIndexEntry[]>;
  byRole: Map<string, MessageIndexEntry[]>;
}

/**
 * Message Index Entry
 */
export interface MessageIndexEntry {
  id: string;
  sessionId: string;
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  preview: string;
  filePath: string;
  hasMemories: boolean;
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Conversation Search Query
 */
export interface ConversationSearchQuery {
  /** Start date filter */
  startDate?: Date;

  /** End date filter */
  endDate?: Date;

  /** Session status filter */
  status?: SessionStatus;

  /** Tags filter (OR logic) */
  tags?: string[];

  /** Full-text search in summary */
  searchText?: string;

  /** Result limit */
  limit?: number;

  /** Result offset */
  offset?: number;
}

/**
 * Message Search Query
 */
export interface MessageSearchQuery {
  /** Filter by session */
  sessionId?: string;

  /** Filter by role */
  role?: 'user' | 'assistant' | 'system';

  /** Start date filter */
  startDate?: Date;

  /** End date filter */
  endDate?: Date;

  /** Full-text search in content */
  searchText?: string;

  /** Only messages with extracted memories */
  hasMemories?: boolean;

  /** Result limit */
  limit?: number;

  /** Result offset */
  offset?: number;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Storage Configuration
 */
export interface StorageConfig {
  /** Base storage path */
  path: string;

  /** Storage backend type */
  backend: string;

  /** Backend-specific options */
  options?: Record<string, any>;
}

/**
 * Conversation Storage Statistics
 */
export interface ConversationStorageStats {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  diskUsage: number;
  oldestSession: Date;
  newestSession: Date;
  cacheHitRate?: number;
  indexSize?: number;
}

// ============================================================================
// Performance Types
// ============================================================================

/**
 * Performance Metric
 */
export interface PerformanceMetric {
  name: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successCount: number;
  failureCount: number;
}

/**
 * Health Report
 */
export interface HealthReport {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    storage: ComponentHealth;
    performance: ComponentHealth;
    privacy: ComponentHealth;
  };
  timestamp: Date;
}

/**
 * Component Health
 */
export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: Record<string, any>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Parsed Message
 * Used internally for stream processing
 */
export interface ParsedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Index Update
 * Used for batch index updates
 */
export interface IndexUpdate {
  type: 'session' | 'message';
  id: string;
  operation: 'add' | 'update' | 'delete';
  data?: any;
}

/**
 * LRU Cache Options
 */
export interface LRUCacheOptions {
  /** Maximum number of items */
  max: number;

  /** TTL in milliseconds (optional) */
  ttl?: number;
}

// ============================================================================
// Export All Types
// ============================================================================

export * from './types';

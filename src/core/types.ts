/**
 * Memory-OS Core Types
 *
 * 核心类型定义
 */

// ============================================================================
// Memory Types
// ============================================================================

export enum MemoryType {
  TEXT = 'text',
  CODE = 'code',
  CHAT = 'chat',
  FILE = 'file',
  MEDIA = 'media',
  ACTIVITY = 'activity',
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: any;
  metadata: MemoryMetadata;
  embedding?: number[];
  relations?: Relation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryMetadata {
  source: string;
  timestamp: Date;
  tags: string[];
  context?: string;
  author?: string;
  location?: string;
  [key: string]: any;
}

export interface Relation {
  type: RelationType;
  targetId: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export enum RelationType {
  REFERENCES = 'references',
  RELATED_TO = 'related_to',
  DERIVED_FROM = 'derived_from',
  RESPONDS_TO = 'responds_to',
  PART_OF = 'part_of',
  FOLLOWS = 'follows',
}

// ============================================================================
// Query Types
// ============================================================================

export interface SearchQuery {
  query: string;
  type?: MemoryType;
  limit?: number;
  offset?: number;
  filters?: SearchFilter[];
  semantic?: boolean;
}

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  GT = 'gt',
  LT = 'lt',
  IN = 'in',
}

export interface SearchResult {
  memory: Memory;
  score: number;
  highlights?: string[];
}

export interface TimelineQuery {
  date?: Date;
  range?: TimeRange;
  type?: MemoryType;
  filters?: SearchFilter[];
}

export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year' | {
  start: Date;
  end: Date;
};

export interface TimelineResult {
  date: Date;
  memories: Memory[];
  stats: {
    total: number;
    byType: Record<MemoryType, number>;
  };
}

// ============================================================================
// Graph Types
// ============================================================================

export interface GraphQuery {
  memoryId: string;
  depth?: number;
  relationTypes?: RelationType[];
  limit?: number;
}

export interface GraphNode {
  memory: Memory;
  relations: GraphEdge[];
}

export interface GraphEdge {
  type: RelationType;
  target: Memory;
  weight?: number;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  avgDegree: number;
  clusters: number;
}

// ============================================================================
// Collector Types
// ============================================================================

export interface CollectorConfig {
  type: string;
  enabled: boolean;
  sources: string[];
  exclude?: string[];
  interval?: number;
  options?: Record<string, any>;
}

export interface CollectResult {
  collected: number;
  failed: number;
  memories: Memory[];
  errors?: Error[];
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageConfig {
  path: string;
  backend: StorageBackend;
  options?: Record<string, any>;
}

export enum StorageBackend {
  LOCAL = 'local',
  SQLITE = 'sqlite',
  POSTGRES = 'postgres',
  MONGODB = 'mongodb',
}

export interface StorageStats {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  diskUsage: number;
  lastUpdate: Date;
}

// ============================================================================
// Embedding Types
// ============================================================================

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey?: string;
  model?: string;
  dimensions?: number;
}

export enum EmbeddingProvider {
  OPENAI = 'openai',
  COHERE = 'cohere',
  LOCAL = 'local',
  HUGGINGFACE = 'huggingface',
}

// ============================================================================
// LLM Types
// ============================================================================

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  LOCAL = 'local',
}

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentConfig {
  memory: any; // MemoryOS instance
  llm: LLMConfig;
  systemPrompt?: string;
  tools?: AgentTool[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// ============================================================================
// Config Types
// ============================================================================

export interface MemoryOSConfig {
  storage: StorageConfig;
  embedding?: EmbeddingConfig;
  llm?: LLMConfig;
  collectors: CollectorConfig[];
  privacy: PrivacyConfig;
  [key: string]: any;
}

export interface PrivacyConfig {
  encryption: boolean;
  encryptionKey?: string;
  shareStats: boolean;
  anonymize: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export enum MemoryEvent {
  COLLECTED = 'collected',
  UPDATED = 'updated',
  DELETED = 'deleted',
  QUERIED = 'queried',
}

export interface MemoryEventData {
  event: MemoryEvent;
  memory?: Memory;
  count?: number;
  timestamp: Date;
}

// ============================================================================
// Export All
// ============================================================================

export * from './types';

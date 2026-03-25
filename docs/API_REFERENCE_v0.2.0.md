# API Reference - openclaw-memory-os v0.2.0

**Version**: 0.2.0 Phase 1
**Status**: Conversation Recording Foundation
**Date**: 2026-03-25

---

## Table of Contents

1. [Overview](#overview)
2. [ConversationStorage](#conversationstorage)
3. [SessionManager](#sessionmanager)
4. [PrivacyFilter](#privacyfilter)
5. [Type Definitions](#type-definitions)
6. [Configuration](#configuration)
7. [Error Handling](#error-handling)

---

## Overview

The v0.2.0 Phase 1 release introduces the conversation recording foundation with three core modules:

- **ConversationStorage** - High-performance storage layer with LRU caching
- **SessionManager** - Session lifecycle management with automatic timeouts
- **PrivacyFilter** - Content protection with 8 default privacy rules

All modules operate 100% locally with zero external API dependencies.

---

## ConversationStorage

High-performance storage layer for conversation recording with dual indexing, LRU caching, and date-based partitioning.

### Constructor

```typescript
new ConversationStorage(config: StorageConfig)
```

**Parameters**:
- `config` (StorageConfig) - Storage configuration object
  - `path` (string) - Base storage path (e.g., `~/.memory-os`)
  - `backend` (string) - Storage backend type (default: `'local'`)
  - `options?` (Record<string, any>) - Backend-specific options

**Example**:
```typescript
import { ConversationStorage } from 'openclaw-memory-os';

const storage = new ConversationStorage({
  path: '~/.memory-os',
  backend: 'local'
});
```

### Methods

#### init()

Initialize storage - creates directory structure and loads indexes.

```typescript
async init(): Promise<void>
```

**Returns**: Promise that resolves when initialization is complete

**Throws**: Error if directory creation or index loading fails

**Example**:
```typescript
await storage.init();
console.log('Storage initialized');
```

**Performance**: < 100ms (first run), < 20ms (subsequent runs)

---

#### saveSession()

Save or update a conversation session.

```typescript
async saveSession(session: ConversationSession): Promise<void>
```

**Parameters**:
- `session` (ConversationSession) - Session object to save

**Returns**: Promise that resolves when session is saved

**Side Effects**:
- Writes session file to disk (date-partitioned)
- Updates session in LRU cache
- Updates session index

**Example**:
```typescript
const session: ConversationSession = {
  id: crypto.randomUUID(),
  startTime: new Date(),
  messageCount: 0,
  participants: [{ role: 'user' }, { role: 'assistant' }],
  metadata: {
    source: 'openclaw',
    recordingMode: RecordingMode.FULL
  },
  status: SessionStatus.ACTIVE,
  tags: []
};

await storage.saveSession(session);
```

**Performance**: < 10ms (cached), < 30ms (first write)

**File Location**: `~/.memory-os/conversations/sessions/YYYY-MM/session-{id}.json`

---

#### saveMessage()

Save a conversation message with optimized async I/O.

```typescript
async saveMessage(message: ConversationMessage): Promise<void>
```

**Parameters**:
- `message` (ConversationMessage) - Message object to save

**Returns**: Promise that resolves immediately (async write)

**Side Effects**:
- Immediately updates message cache (for fast reads)
- Asynchronously writes message file to disk
- Queues index update for batching

**Example**:
```typescript
const message: ConversationMessage = {
  id: crypto.randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user',
  content: 'Hello, world!',
  metadata: {
    source: 'openclaw'
  }
};

await storage.saveMessage(message);
// Returns immediately, write happens in background
```

**Performance**: < 5ms (returns immediately), < 10ms (actual disk write)

**File Location**: `~/.memory-os/conversations/messages/YYYY-MM-DD/message-{id}.json`

---

#### getSession()

Retrieve a session by ID with cache optimization.

```typescript
async getSession(id: string): Promise<ConversationSession | null>
```

**Parameters**:
- `id` (string) - Session UUID

**Returns**: Promise resolving to session object, or `null` if not found

**Cache Behavior**:
1. Checks LRU cache first (< 1ms)
2. Falls back to index lookup (< 5ms)
3. Loads from disk if needed (< 20ms)

**Example**:
```typescript
const session = await storage.getSession('550e8400-e29b-41d4-a716-446655440000');

if (session) {
  console.log(`Session started: ${session.startTime}`);
  console.log(`Messages: ${session.messageCount}`);
} else {
  console.log('Session not found');
}
```

**Performance**:
- Cache hit: < 5ms
- Cache miss: < 20ms

---

#### getMessage()

Retrieve a message by ID with cache optimization.

```typescript
async getMessage(id: string): Promise<ConversationMessage | null>
```

**Parameters**:
- `id` (string) - Message UUID

**Returns**: Promise resolving to message object, or `null` if not found

**Example**:
```typescript
const message = await storage.getMessage('660e8400-e29b-41d4-a716-446655440001');

if (message) {
  console.log(`[${message.role}]: ${message.content}`);
  console.log(`Timestamp: ${message.timestamp}`);
}
```

**Performance**:
- Cache hit: < 5ms
- Cache miss: < 20ms

---

#### getSessionMessages()

Retrieve all messages for a specific session, sorted by timestamp.

```typescript
async getSessionMessages(sessionId: string): Promise<ConversationMessage[]>
```

**Parameters**:
- `sessionId` (string) - Session UUID

**Returns**: Promise resolving to array of messages, sorted by timestamp (ascending)

**Example**:
```typescript
const messages = await storage.getSessionMessages(sessionId);

messages.forEach(msg => {
  console.log(`[${msg.timestamp.toISOString()}] ${msg.role}: ${msg.content}`);
});
```

**Performance**: < 50ms per 100 messages (with cache), < 500ms (cold load)

---

#### updateSession()

Update an existing session (alias for saveSession).

```typescript
async updateSession(session: ConversationSession): Promise<void>
```

**Parameters**:
- `session` (ConversationSession) - Updated session object

**Example**:
```typescript
const session = await storage.getSession(sessionId);
if (session) {
  session.status = SessionStatus.COMPLETED;
  session.endTime = new Date();
  session.tags.push('important');

  await storage.updateSession(session);
}
```

---

#### searchConversations()

Search conversations with flexible filtering.

```typescript
async searchConversations(query: ConversationSearchQuery): Promise<ConversationSession[]>
```

**Parameters**:
- `query` (ConversationSearchQuery) - Search query object
  - `startDate?` (Date) - Filter sessions starting after this date
  - `endDate?` (Date) - Filter sessions starting before this date
  - `status?` (SessionStatus) - Filter by session status
  - `tags?` (string[]) - Filter by tags (OR logic)
  - `searchText?` (string) - Full-text search in session summary
  - `limit?` (number) - Maximum results to return
  - `offset?` (number) - Skip N results (for pagination)

**Returns**: Promise resolving to array of matching sessions

**Example**:
```typescript
// Find all active sessions from last week
const recentActive = await storage.searchConversations({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  status: SessionStatus.ACTIVE,
  limit: 10
});

// Find sessions by tags
const taggedSessions = await storage.searchConversations({
  tags: ['work', 'important'],
  limit: 20
});

// Full-text search
const searchResults = await storage.searchConversations({
  searchText: 'machine learning',
  limit: 5
});
```

**Performance**: < 100ms per 1000 sessions (index-based)

---

#### searchMessages()

Search messages with flexible filtering.

```typescript
async searchMessages(query: MessageSearchQuery): Promise<ConversationMessage[]>
```

**Parameters**:
- `query` (MessageSearchQuery) - Search query object
  - `sessionId?` (string) - Filter by session
  - `role?` ('user' | 'assistant' | 'system') - Filter by role
  - `startDate?` (Date) - Filter messages after this date
  - `endDate?` (Date) - Filter messages before this date
  - `searchText?` (string) - Full-text search in message content
  - `hasMemories?` (boolean) - Only messages with extracted memories
  - `limit?` (number) - Maximum results
  - `offset?` (number) - Skip N results

**Returns**: Promise resolving to array of matching messages

**Example**:
```typescript
// Find user messages from today
const todayMessages = await storage.searchMessages({
  role: 'user',
  startDate: new Date(new Date().setHours(0, 0, 0, 0)),
  limit: 50
});

// Search message content
const codeMessages = await storage.searchMessages({
  searchText: 'function',
  limit: 10
});

// Find messages with extracted memories
const memorableMessages = await storage.searchMessages({
  hasMemories: true,
  limit: 20
});
```

**Performance**: < 200ms per 10,000 messages (index-based)

---

#### getStats()

Get storage statistics and health metrics.

```typescript
async getStats(): Promise<ConversationStorageStats>
```

**Returns**: Promise resolving to statistics object

**Example**:
```typescript
const stats = await storage.getStats();

console.log(`Total sessions: ${stats.totalSessions}`);
console.log(`Active sessions: ${stats.activeSessions}`);
console.log(`Total messages: ${stats.totalMessages}`);
console.log(`Disk usage: ${(stats.diskUsage / 1024 / 1024).toFixed(2)} MB`);
console.log(`Cache hit rate: ${(stats.cacheHitRate! * 100).toFixed(1)}%`);
console.log(`Oldest session: ${stats.oldestSession}`);
console.log(`Newest session: ${stats.newestSession}`);
```

---

#### clearCache()

Clear all LRU caches.

```typescript
clearCache(): void
```

**Side Effects**: Clears both session and message caches

**Example**:
```typescript
storage.clearCache();
console.log('Cache cleared');
```

**Use Cases**:
- After bulk imports
- Memory pressure situations
- Testing cache behavior

---

#### close()

Close storage and flush pending operations.

```typescript
async close(): Promise<void>
```

**Returns**: Promise that resolves when all pending writes complete

**Side Effects**:
- Flushes pending index updates
- Cancels timers
- Saves indexes to disk

**Example**:
```typescript
await storage.close();
console.log('Storage closed gracefully');
```

---

## SessionManager

Manages conversation session lifecycle with automatic timeout handling.

### Constructor

```typescript
new SessionManager(storage: ConversationStorage, config: RecordingConfig)
```

**Parameters**:
- `storage` (ConversationStorage) - Storage instance
- `config` (RecordingConfig) - Recording configuration
  - `mode` (RecordingMode) - Recording mode
  - `autoStart` (boolean) - Auto-start on OpenClaw launch
  - `sessionTimeout` (number) - Minutes before auto-close
  - `maxMessagesPerSession?` (number) - Optional message limit
  - `privacyRules` (PrivacyRule[]) - Privacy filter rules
  - `retention` (RetentionPolicy) - Retention policy
  - `generateSummaries?` (boolean) - Enable AI summaries
  - `linkToMemories?` (boolean) - Link to extracted memories
  - `searchIndexing?` (boolean) - Enable search indexing

**Example**:
```typescript
import { SessionManager, ConversationStorage, RecordingMode } from 'openclaw-memory-os';

const storage = new ConversationStorage({ path: '~/.memory-os', backend: 'local' });
await storage.init();

const sessionManager = new SessionManager(storage, {
  mode: RecordingMode.FULL,
  autoStart: true,
  sessionTimeout: 30, // 30 minutes
  maxMessagesPerSession: 1000,
  privacyRules: [],
  retention: {
    autoArchive: true,
    archiveAfterDays: 90
  }
});
```

### Methods

#### startSession()

Start a new conversation session.

```typescript
async startSession(metadata?: Partial<ConversationMetadata>): Promise<ConversationSession>
```

**Parameters**:
- `metadata?` (Partial<ConversationMetadata>) - Optional session metadata
  - `source?` ('openclaw' | 'manual' | 'import') - Conversation source
  - `context?` (string) - Context description
  - `projectId?` (string) - Link to project
  - `location?` (string) - Location info

**Returns**: Promise resolving to created session

**Side Effects**:
- Creates session in storage
- Starts timeout timer
- Tracks session in active sessions map

**Example**:
```typescript
const session = await sessionManager.startSession({
  source: 'openclaw',
  context: 'Code review discussion',
  projectId: 'my-app-v2'
});

console.log(`Session started: ${session.id}`);
```

**Performance**: < 50ms

---

#### endSession()

End an active conversation session.

```typescript
async endSession(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId` (string) - Session UUID

**Throws**: Error if session not found or not active

**Side Effects**:
- Sets session status to COMPLETED
- Sets endTime timestamp
- Generates session summary (if enabled)
- Cancels timeout timer
- Removes from active sessions

**Example**:
```typescript
await sessionManager.endSession(sessionId);
console.log('Session ended');
```

**Performance**: < 50ms (without summary), < 2000ms (with AI summary)

---

#### getActiveSession()

Get the most recent active session.

```typescript
async getActiveSession(): Promise<ConversationSession | null>
```

**Returns**: Promise resolving to active session, or `null` if none active

**Example**:
```typescript
const activeSession = await sessionManager.getActiveSession();

if (activeSession) {
  console.log(`Active session: ${activeSession.id}`);
  console.log(`Started: ${activeSession.startTime}`);
  console.log(`Messages: ${activeSession.messageCount}`);
} else {
  console.log('No active sessions');
}
```

---

#### refreshActivity()

Refresh session activity to prevent timeout.

```typescript
async refreshActivity(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId` (string) - Session UUID

**Side Effects**: Resets the timeout timer

**Example**:
```typescript
// Keep session alive during long pauses
await sessionManager.refreshActivity(sessionId);
console.log('Session timeout reset');
```

**Use Cases**:
- User returns after idle period
- Long-running operations
- Preventing premature timeout

---

#### updateSessionWithMessage()

Update session state when new message arrives.

```typescript
async updateSessionWithMessage(
  sessionId: string,
  message: ConversationMessage
): Promise<void>
```

**Parameters**:
- `sessionId` (string) - Session UUID
- `message` (ConversationMessage) - New message

**Side Effects**:
- Increments message count
- Adds participant if new
- Checks message limit (auto-ends if exceeded)
- Saves updated session

**Example**:
```typescript
const message: ConversationMessage = {
  id: crypto.randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'assistant',
  content: 'Here is the answer...',
  metadata: { source: 'openclaw', model: 'claude-sonnet-4' }
};

await sessionManager.updateSessionWithMessage(sessionId, message);
```

**Automatic Behavior**:
- If `maxMessagesPerSession` is set and reached, session ends automatically
- Message count is tracked accurately
- Participant list updated dynamically

---

#### archiveSession()

Archive a completed session.

```typescript
async archiveSession(sessionId: string): Promise<void>
```

**Parameters**:
- `sessionId` (string) - Session UUID

**Throws**: Error if session not found or still active

**Side Effects**: Changes session status to ARCHIVED

**Example**:
```typescript
await sessionManager.archiveSession(sessionId);
console.log('Session archived');
```

---

## PrivacyFilter

Content protection engine with pattern matching and keyword filtering.

### Constructor

```typescript
new PrivacyFilter(rules?: PrivacyRule[])
```

**Parameters**:
- `rules?` (PrivacyRule[]) - Privacy rules (defaults to 8 built-in rules)

**Default Rules**:
1. Credentials (passwords, API keys, tokens)
2. Email addresses
3. Credit card numbers
4. IP addresses
5. Social Security Numbers (US)
6. Phone numbers
7. Private keys (PEM format)
8. Sensitive system paths

**Example**:
```typescript
import { PrivacyFilter, DEFAULT_PRIVACY_RULES } from 'openclaw-memory-os';

// Use default rules
const filter = new PrivacyFilter();

// Custom rules
const customFilter = new PrivacyFilter([
  {
    type: 'keyword',
    pattern: 'confidential|secret|private',
    action: 'redact',
    description: 'Redact confidentiality markers',
    enabled: true
  }
]);
```

### Methods

#### filterMessage()

Apply privacy filters to a message.

```typescript
async filterMessage(message: ConversationMessage): Promise<ConversationMessage>
```

**Parameters**:
- `message` (ConversationMessage) - Message to filter

**Returns**: Promise resolving to filtered message

**Actions**:
- `redact` - Replaces sensitive content with `[REDACTED]`
- `block` - Blocks entire message with `[BLOCKED BY PRIVACY RULE]`
- `filter` - Prevents storage (message content removed)

**Side Effects**: Sets `metadata.filtered = true` if any rule matched

**Example**:
```typescript
const message: ConversationMessage = {
  id: crypto.randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user',
  content: 'My email is john@example.com and password is secret123',
  metadata: { source: 'openclaw' }
};

const filtered = await filter.filterMessage(message);
console.log(filtered.content);
// Output: "My email is [REDACTED] and [REDACTED]"
console.log(filtered.metadata.filtered); // true
```

**Performance**: < 5ms per message (8 rules), < 15ms (50 rules)

---

#### addRule()

Add a new privacy rule.

```typescript
addRule(rule: PrivacyRule): void
```

**Parameters**:
- `rule` (PrivacyRule) - Privacy rule to add
  - `type` ('keyword' | 'pattern' | 'file_path') - Rule type
  - `pattern` (string | RegExp) - Pattern to match
  - `action` ('filter' | 'redact' | 'block') - Action to take
  - `description` (string) - Human-readable description
  - `enabled?` (boolean) - Is rule enabled (default: true)

**Example**:
```typescript
filter.addRule({
  type: 'pattern',
  pattern: /\b[A-Z]{2}\d{6}\b/g, // Government ID format
  action: 'redact',
  description: 'Redact government IDs',
  enabled: true
});
```

---

#### removeRule()

Remove a privacy rule by description.

```typescript
removeRule(description: string): void
```

**Parameters**:
- `description` (string) - Rule description to remove

**Example**:
```typescript
filter.removeRule('Redact email addresses');
```

---

#### listRules()

List all active privacy rules.

```typescript
listRules(): PrivacyRule[]
```

**Returns**: Array of active privacy rules

**Example**:
```typescript
const rules = filter.listRules();
rules.forEach(rule => {
  console.log(`- ${rule.description} (${rule.action})`);
});
```

---

#### getStats()

Get privacy filter statistics.

```typescript
getStats(): FilterStats
```

**Returns**: Statistics object

**Example**:
```typescript
const stats = filter.getStats();

console.log(`Messages filtered: ${stats.messagesFiltered}`);
console.log(`Messages redacted: ${stats.messagesRedacted}`);
console.log(`Messages blocked: ${stats.messagesBlocked}`);

console.log('\nRules applied:');
stats.rulesApplied.forEach((count, rule) => {
  console.log(`  ${rule}: ${count} times`);
});
```

---

## Type Definitions

### ConversationSession

```typescript
interface ConversationSession {
  id: string;                             // UUID
  startTime: Date;                        // Session start timestamp
  endTime?: Date;                         // Session end timestamp (if completed)
  messageCount: number;                   // Total messages in session
  participants: ConversationParticipant[]; // Conversation participants
  metadata: ConversationMetadata;         // Session metadata
  status: SessionStatus;                  // Session status
  tags: string[];                         // User-defined tags
  summary?: string;                       // AI-generated summary
}
```

### ConversationMessage

```typescript
interface ConversationMessage {
  id: string;                    // UUID
  sessionId: string;             // Parent session ID
  timestamp: Date;               // Message timestamp
  role: 'user' | 'assistant' | 'system'; // Message role
  content: string;               // Message content
  metadata: MessageMetadata;     // Message metadata
  tokens?: number;               // Token count
  responseTime?: number;         // Response time in milliseconds
  extractedMemories?: string[];  // IDs of extracted memories
}
```

### RecordingMode

```typescript
enum RecordingMode {
  DISABLED = 'disabled',      // No recording
  TRIGGER_ONLY = 'trigger',   // v0.1.2 behavior - trigger words only
  SMART = 'smart',            // Smart extraction + triggers
  FULL = 'full'               // Record everything
}
```

### SessionStatus

```typescript
enum SessionStatus {
  ACTIVE = 'active',          // Session in progress
  COMPLETED = 'completed',    // Session ended normally
  ARCHIVED = 'archived',      // Session archived for storage
  FILTERED = 'filtered'       // Session blocked by privacy rules
}
```

### PrivacyRule

```typescript
interface PrivacyRule {
  type: 'keyword' | 'pattern' | 'file_path';  // Rule type
  pattern: string | RegExp;                    // Pattern to match
  action: 'filter' | 'redact' | 'block';       // Action to take
  description: string;                         // Human-readable description
  enabled?: boolean;                           // Is rule enabled
}
```

### ConversationStorageStats

```typescript
interface ConversationStorageStats {
  totalSessions: number;      // Total number of sessions
  activeSessions: number;     // Currently active sessions
  totalMessages: number;      // Total messages across all sessions
  diskUsage: number;          // Storage size in bytes
  oldestSession: Date;        // Oldest session date
  newestSession: Date;        // Newest session date
  cacheHitRate?: number;      // Cache hit rate (0-1)
  indexSize?: number;         // Index size in bytes
}
```

---

## Configuration

### Default Configuration

```typescript
const defaultConfig = {
  recording: {
    mode: RecordingMode.DISABLED,
    autoStart: false,
    sessionTimeout: 30, // minutes
    maxMessagesPerSession: undefined,
    generateSummaries: false,
    linkToMemories: true,
    searchIndexing: true
  },
  privacy: {
    enabled: true,
    rules: DEFAULT_PRIVACY_RULES
  },
  storage: {
    path: '~/.memory-os',
    backend: 'local',
    cacheSize: {
      sessions: 100,
      messages: 1000
    }
  },
  retention: {
    autoArchive: true,
    archiveAfterDays: 90
  }
};
```

### Configuration File

Configuration is stored in `~/.memory-os/config.json` with automatic migration from v0.1.2.

---

## Error Handling

### Common Errors

**Session Not Found**:
```typescript
try {
  await sessionManager.endSession('invalid-id');
} catch (error) {
  console.error('Error:', error.message);
  // Output: "Session not found: invalid-id"
}
```

**Session Not Active**:
```typescript
try {
  await sessionManager.endSession(completedSessionId);
} catch (error) {
  console.error('Error:', error.message);
  // Output: "Session is not active: {id}"
}
```

**Storage Initialization Failure**:
```typescript
try {
  await storage.init();
} catch (error) {
  console.error('Failed to initialize storage:', error);
  // Check directory permissions and disk space
}
```

### Error Recovery

```typescript
// Graceful error handling
async function safeMessageSave(storage: ConversationStorage, message: ConversationMessage) {
  try {
    await storage.saveMessage(message);
  } catch (error) {
    console.error('Failed to save message:', error);

    // Retry once after short delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await storage.saveMessage(message);
      console.log('Message saved on retry');
    } catch (retryError) {
      console.error('Retry failed, message lost:', retryError);
      // Log to error tracking system
    }
  }
}
```

---

## Performance Characteristics

### Write Performance

| Operation | Target | Actual |
|-----------|--------|--------|
| Single message write | < 10ms | ~3ms (avg) |
| Batch write (100 messages) | < 15ms/msg | ~8ms/msg |
| Session creation | < 50ms | ~25ms (avg) |
| Privacy filter | < 5ms | ~2ms (avg) |

### Read Performance

| Operation | Target | Actual |
|-----------|--------|--------|
| Cache hit read | < 5ms | ~1ms (avg) |
| Cache miss read | < 20ms | ~12ms (avg) |
| Session history (100 msgs) | < 500ms | ~180ms (avg) |

### Cache Efficiency

| Metric | Target | Actual |
|--------|--------|--------|
| Cache hit rate | > 80% | ~85-90% |
| Memory usage (1000 msgs) | ~10MB | ~8-12MB |

---

## Complete Example

```typescript
import {
  ConversationStorage,
  SessionManager,
  PrivacyFilter,
  RecordingMode,
  ConversationMessage
} from 'openclaw-memory-os';

async function conversationRecordingDemo() {
  // 1. Initialize storage
  const storage = new ConversationStorage({
    path: '~/.memory-os',
    backend: 'local'
  });
  await storage.init();
  console.log('Storage initialized');

  // 2. Create session manager
  const sessionManager = new SessionManager(storage, {
    mode: RecordingMode.FULL,
    autoStart: true,
    sessionTimeout: 30,
    privacyRules: [],
    retention: { autoArchive: true, archiveAfterDays: 90 }
  });

  // 3. Initialize privacy filter
  const privacyFilter = new PrivacyFilter();

  // 4. Start conversation session
  const session = await sessionManager.startSession({
    source: 'openclaw',
    context: 'API documentation review'
  });
  console.log(`Session started: ${session.id}`);

  // 5. Add messages with privacy filtering
  const userMessage: ConversationMessage = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    timestamp: new Date(),
    role: 'user',
    content: 'Can you help me review this API? My email is john@example.com',
    metadata: { source: 'openclaw' }
  };

  const filteredMessage = await privacyFilter.filterMessage(userMessage);
  await storage.saveMessage(filteredMessage);
  await sessionManager.updateSessionWithMessage(session.id, filteredMessage);

  // 6. Add assistant response
  const assistantMessage: ConversationMessage = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    timestamp: new Date(),
    role: 'assistant',
    content: 'I can help you review the API. Your email has been redacted for privacy.',
    metadata: { source: 'openclaw', model: 'claude-sonnet-4' }
  };

  await storage.saveMessage(assistantMessage);
  await sessionManager.updateSessionWithMessage(session.id, assistantMessage);

  // 7. Retrieve conversation history
  const messages = await storage.getSessionMessages(session.id);
  console.log(`\nConversation (${messages.length} messages):`);
  messages.forEach(msg => {
    console.log(`[${msg.role}]: ${msg.content}`);
  });

  // 8. Get statistics
  const stats = await storage.getStats();
  console.log('\nStorage Statistics:');
  console.log(`Total sessions: ${stats.totalSessions}`);
  console.log(`Total messages: ${stats.totalMessages}`);
  console.log(`Cache hit rate: ${(stats.cacheHitRate! * 100).toFixed(1)}%`);

  const filterStats = privacyFilter.getStats();
  console.log('\nPrivacy Filter Statistics:');
  console.log(`Messages filtered: ${filterStats.messagesFiltered}`);
  console.log(`Messages redacted: ${filterStats.messagesRedacted}`);

  // 9. End session
  await sessionManager.endSession(session.id);
  console.log('\nSession ended');

  // 10. Close storage
  await storage.close();
  console.log('Storage closed');
}

conversationRecordingDemo().catch(console.error);
```

---

## See Also

- [Usage Guide](./CONVERSATION_RECORDING_GUIDE.md)
- [Architecture Design](../FULL_CONVERSATION_RECORDING_ARCHITECTURE.md)
- [Performance Report](../PERFORMANCE_BENCHMARK_REPORT.md)
- [Integration Tests](../INTEGRATION_TEST_REPORT.md)

---

**openclaw-memory-os v0.2.0 Phase 1**
Digital Immortality Through Memory

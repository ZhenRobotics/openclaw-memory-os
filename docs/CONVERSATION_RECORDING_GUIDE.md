# Conversation Recording Guide
## openclaw-memory-os v0.2.0

**Version**: 0.2.0 Phase 1
**Status**: Foundation Implementation
**Date**: 2026-03-25

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Configuration](#configuration)
4. [Common Usage Scenarios](#common-usage-scenarios)
5. [Privacy and Security](#privacy-and-security)
6. [Performance Optimization](#performance-optimization)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

Get started with conversation recording in 5 minutes.

### Installation

```bash
npm install openclaw-memory-os
```

### Basic Setup

```typescript
import {
  ConversationStorage,
  SessionManager,
  PrivacyFilter,
  RecordingMode
} from 'openclaw-memory-os';
import { randomUUID } from 'crypto';

// 1. Initialize storage
const storage = new ConversationStorage({
  path: '~/.memory-os',
  backend: 'local'
});
await storage.init();

// 2. Create session manager
const sessionManager = new SessionManager(storage, {
  mode: RecordingMode.FULL,
  autoStart: true,
  sessionTimeout: 30, // minutes
  privacyRules: [],
  retention: {
    autoArchive: true,
    archiveAfterDays: 90
  }
});

// 3. Start recording
const session = await sessionManager.startSession({
  source: 'openclaw',
  context: 'Daily work session'
});

// 4. Add messages
await storage.saveMessage({
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user',
  content: 'Hello, world!',
  metadata: { source: 'openclaw' }
});

// 5. Retrieve history
const messages = await storage.getSessionMessages(session.id);
console.log(`Recorded ${messages.length} messages`);

// 6. End session
await sessionManager.endSession(session.id);
```

---

## Core Concepts

### Sessions

A **session** represents a continuous conversation with OpenClaw or other AI systems.

**Session Lifecycle**:
1. **Created** - Session starts with `startSession()`
2. **Active** - Messages are being added
3. **Completed** - Session ends with `endSession()`
4. **Archived** - Old sessions moved to archive

**Session Properties**:
- Unique ID (UUID)
- Start/end timestamps
- Message count
- Participants (user, assistant, system)
- Metadata (source, context, project)
- Status (active, completed, archived)
- User-defined tags
- Optional AI-generated summary

### Messages

A **message** is a single turn in the conversation.

**Message Roles**:
- `user` - User input
- `assistant` - AI response
- `system` - System messages

**Message Properties**:
- Unique ID (UUID)
- Parent session ID
- Timestamp
- Role
- Content (text)
- Metadata (model, tools, attachments)
- Optional token count
- Optional response time
- Links to extracted memories

### Recording Modes

Phase 1 implements the foundation. Full modes will be available in Phase 2+.

| Mode | Description | Status |
|------|-------------|--------|
| `DISABLED` | No recording | ✅ Available |
| `TRIGGER_ONLY` | v0.1.2 behavior - trigger words only | ✅ Available |
| `SMART` | Smart extraction + triggers | 🚧 Phase 2 |
| `FULL` | Record everything | 🚧 Phase 2 |

**Current Phase 1 Capability**:
- Manual recording via API
- Storage foundation ready
- Privacy filtering operational
- Session management working

---

## Configuration

### Storage Configuration

```typescript
const storage = new ConversationStorage({
  path: '~/.memory-os',     // Base storage path
  backend: 'local'           // Storage backend (only 'local' supported)
});
```

**Storage Structure**:
```
~/.memory-os/
├── conversations/
│   ├── sessions/
│   │   └── 2026-03/
│   │       ├── session-{uuid}.json
│   │       └── session-{uuid}.json
│   ├── messages/
│   │   └── 2026-03-25/
│   │       ├── message-{uuid}.json
│   │       └── message-{uuid}.json
│   └── indexes/
│       ├── session-index.json
│       └── message-index.json
└── config.json
```

### Session Manager Configuration

```typescript
const config = {
  // Recording mode
  mode: RecordingMode.FULL,

  // Auto-start recording on OpenClaw launch
  autoStart: true,

  // Session timeout (minutes of inactivity)
  sessionTimeout: 30,

  // Optional: Maximum messages per session
  maxMessagesPerSession: 1000,

  // Privacy rules (empty = use defaults)
  privacyRules: [],

  // Retention policy
  retention: {
    // Auto-archive old sessions
    autoArchive: true,

    // Archive after N days
    archiveAfterDays: 90,

    // Optional: Max total sessions to keep
    maxSessions: 10000,

    // Optional: Max age in days
    maxAge: 365
  },

  // Optional: Generate AI summaries
  generateSummaries: false,

  // Optional: Link messages to extracted memories
  linkToMemories: true,

  // Optional: Enable search indexing
  searchIndexing: true
};

const sessionManager = new SessionManager(storage, config);
```

### Privacy Configuration

```typescript
import { PrivacyFilter, DEFAULT_PRIVACY_RULES } from 'openclaw-memory-os';

// Use default rules (8 built-in rules)
const filter = new PrivacyFilter();

// Add custom rules
filter.addRule({
  type: 'keyword',
  pattern: 'confidential|internal-only|do-not-share',
  action: 'redact',
  description: 'Redact confidentiality markers',
  enabled: true
});

filter.addRule({
  type: 'pattern',
  pattern: /\bACCT\d{8}\b/g, // Account numbers
  action: 'redact',
  description: 'Redact account numbers',
  enabled: true
});
```

**Default Privacy Rules**:
1. Credentials (passwords, API keys, tokens)
2. Email addresses
3. Credit card numbers
4. IP addresses
5. Social Security Numbers
6. Phone numbers
7. Private keys (PEM format)
8. Sensitive system paths

---

## Common Usage Scenarios

### Scenario 1: Basic Conversation Recording

Record a simple back-and-forth conversation.

```typescript
// Start session
const session = await sessionManager.startSession({
  source: 'openclaw',
  context: 'Code review'
});

// User asks question
await storage.saveMessage({
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user',
  content: 'How do I implement authentication?',
  metadata: { source: 'openclaw' }
});

// Assistant responds
await storage.saveMessage({
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'assistant',
  content: 'Here are the steps to implement authentication...',
  metadata: {
    source: 'openclaw',
    model: 'claude-sonnet-4',
    responseTime: 1250
  }
});

// Update session
await sessionManager.updateSessionWithMessage(session.id, message);

// End when done
await sessionManager.endSession(session.id);
```

### Scenario 2: Multi-Session Management

Manage multiple concurrent conversations.

```typescript
// Start multiple sessions
const session1 = await sessionManager.startSession({
  context: 'Frontend work',
  projectId: 'my-app'
});

const session2 = await sessionManager.startSession({
  context: 'Backend API',
  projectId: 'api-service'
});

// Add messages to different sessions
await storage.saveMessage({
  id: randomUUID(),
  sessionId: session1.id,
  role: 'user',
  content: 'Fix the button styling',
  // ...
});

await storage.saveMessage({
  id: randomUUID(),
  sessionId: session2.id,
  role: 'user',
  content: 'Add rate limiting',
  // ...
});

// Retrieve specific session history
const frontendMessages = await storage.getSessionMessages(session1.id);
const backendMessages = await storage.getSessionMessages(session2.id);
```

### Scenario 3: Privacy-Filtered Recording

Automatically filter sensitive content.

```typescript
const privacyFilter = new PrivacyFilter();

// User message with sensitive data
const userMessage = {
  id: randomUUID(),
  sessionId: session.id,
  timestamp: new Date(),
  role: 'user' as const,
  content: 'Deploy with API key sk-1234567890 to john@example.com',
  metadata: { source: 'openclaw' }
};

// Apply privacy filter
const filteredMessage = await privacyFilter.filterMessage(userMessage);

// Save filtered version
await storage.saveMessage(filteredMessage);

console.log(filteredMessage.content);
// Output: "Deploy with [REDACTED] to [REDACTED]"

console.log(filteredMessage.metadata.filtered);
// Output: true
```

### Scenario 4: Searching and Querying

Find specific conversations or messages.

```typescript
// Search sessions by date range
const recentSessions = await storage.searchConversations({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  status: SessionStatus.COMPLETED,
  limit: 10
});

// Search sessions by tags
const workSessions = await storage.searchConversations({
  tags: ['work', 'important'],
  limit: 20
});

// Search messages by content
const codeMessages = await storage.searchMessages({
  searchText: 'function',
  role: 'assistant',
  limit: 50
});

// Find messages with extracted memories
const memorableMessages = await storage.searchMessages({
  hasMemories: true,
  startDate: new Date('2026-03-01'),
  limit: 100
});
```

### Scenario 5: Session Timeout Management

Handle automatic session closure.

```typescript
// Session auto-closes after 30 minutes of inactivity
const session = await sessionManager.startSession();

// ... 25 minutes of activity ...

// Refresh to prevent timeout
await sessionManager.refreshActivity(session.id);

// Session timeout timer reset

// ... continue working ...
```

### Scenario 6: Tagging and Organization

Organize conversations with tags.

```typescript
const session = await sessionManager.startSession({
  context: 'Sprint planning'
});

// ... conversation happens ...

// Add tags before ending
const updatedSession = await storage.getSession(session.id);
if (updatedSession) {
  updatedSession.tags = ['sprint', 'planning', 'team-alpha', 'q1-2026'];
  await storage.updateSession(updatedSession);
}

await sessionManager.endSession(session.id);

// Later: search by tags
const sprintSessions = await storage.searchConversations({
  tags: ['sprint'],
  limit: 50
});
```

### Scenario 7: Statistics and Monitoring

Track conversation recording health.

```typescript
// Get storage statistics
const stats = await storage.getStats();

console.log(`Total sessions: ${stats.totalSessions}`);
console.log(`Active sessions: ${stats.activeSessions}`);
console.log(`Total messages: ${stats.totalMessages}`);
console.log(`Storage size: ${(stats.diskUsage / 1024 / 1024).toFixed(2)} MB`);
console.log(`Cache hit rate: ${(stats.cacheHitRate! * 100).toFixed(1)}%`);
console.log(`Oldest session: ${stats.oldestSession.toISOString()}`);
console.log(`Newest session: ${stats.newestSession.toISOString()}`);

// Get privacy filter statistics
const filterStats = privacyFilter.getStats();

console.log(`\nPrivacy Filter:`);
console.log(`Messages filtered: ${filterStats.messagesFiltered}`);
console.log(`Messages redacted: ${filterStats.messagesRedacted}`);
console.log(`Messages blocked: ${filterStats.messagesBlocked}`);

console.log('\nRules applied:');
filterStats.rulesApplied.forEach((count, rule) => {
  console.log(`  ${rule}: ${count} times`);
});
```

---

## Privacy and Security

### Privacy by Design

Conversation recording in Memory-OS follows privacy-first principles:

1. **100% Local Storage** - No external APIs, no cloud uploads
2. **User Control** - Recording can be disabled at any time
3. **Automatic Filtering** - Sensitive data redacted by default
4. **Configurable Rules** - Add custom privacy rules
5. **Transparent Logging** - All filtering actions logged

### Privacy Rule Actions

**Redact** - Replace sensitive content:
```typescript
{
  type: 'pattern',
  pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  action: 'redact',
  description: 'Redact email addresses'
}

// Input:  "Contact me at john@example.com"
// Output: "Contact me at [REDACTED]"
```

**Block** - Block entire message:
```typescript
{
  type: 'pattern',
  pattern: /-----BEGIN (RSA|PRIVATE|PUBLIC) KEY-----/gi,
  action: 'block',
  description: 'Block messages with private keys'
}

// Input:  "Here is the key: -----BEGIN RSA PRIVATE KEY-----..."
// Output: "[BLOCKED BY PRIVACY RULE]"
```

**Filter** - Prevent storage:
```typescript
{
  type: 'keyword',
  pattern: 'delete-everything|rm -rf /',
  action: 'filter',
  description: 'Filter dangerous commands'
}

// Message is not saved to storage at all
```

### Custom Privacy Rules

```typescript
// Domain-specific sensitive terms
filter.addRule({
  type: 'keyword',
  pattern: 'patient|medical-record|diagnosis|treatment',
  action: 'redact',
  description: 'Healthcare privacy (HIPAA compliance)'
});

// Financial information
filter.addRule({
  type: 'pattern',
  pattern: /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  action: 'redact',
  description: 'Social security numbers'
});

// Internal infrastructure
filter.addRule({
  type: 'keyword',
  pattern: 'production-db|internal-api|staging-server',
  action: 'redact',
  description: 'Internal infrastructure references'
});
```

### Disabling Privacy Filtering

```typescript
// For completely private local use only
const noFilter = new PrivacyFilter([]);

// Or disable specific rules
const customFilter = new PrivacyFilter(
  DEFAULT_PRIVACY_RULES.filter(rule =>
    rule.description !== 'Redact email addresses'
  )
);
```

---

## Performance Optimization

### Cache Configuration

The storage layer uses LRU caching for performance.

**Default Cache Sizes**:
- Sessions: 100 (most recent sessions)
- Messages: 1000 (most recent messages)

**Cache Behavior**:
- Automatic eviction when full (LRU policy)
- Cache hit rate typically 85-90%
- Dramatically faster reads (< 5ms vs < 20ms)

**Cache Management**:
```typescript
// Clear cache manually if needed
storage.clearCache();

// Check cache statistics
const stats = await storage.getStats();
console.log(`Cache hit rate: ${(stats.cacheHitRate! * 100).toFixed(1)}%`);
```

### Write Performance

**Async Writes**:
Messages are written asynchronously for performance.

```typescript
// This returns immediately (< 5ms)
await storage.saveMessage(message);

// Actual disk write happens in background (< 10ms)
```

**Batch Index Updates**:
Index updates are batched for efficiency.

- Updates queued in memory
- Flushed every 200ms
- Reduces I/O operations

### Read Performance

**Optimization Tips**:

1. **Use Cache-Friendly Patterns**:
```typescript
// Good: Repeated access to same session
const session = await storage.getSession(id); // Cache miss
const same = await storage.getSession(id);    // Cache hit (fast!)
```

2. **Batch Queries**:
```typescript
// Good: Single query for all messages
const messages = await storage.getSessionMessages(sessionId);

// Avoid: Individual message queries in loop
for (const id of messageIds) {
  const message = await storage.getMessage(id); // Slower
}
```

3. **Use Indexes**:
```typescript
// Good: Index-based search (fast)
const sessions = await storage.searchConversations({
  status: SessionStatus.ACTIVE
});

// Avoid: Loading all sessions and filtering
const allSessions = await storage.searchConversations({});
const active = allSessions.filter(s => s.status === SessionStatus.ACTIVE);
```

### Storage Optimization

**Date-Based Partitioning**:
- Sessions partitioned by month (`2026-03/`)
- Messages partitioned by day (`2026-03-25/`)
- Prevents single directory from growing too large

**Index Management**:
```typescript
// Indexes automatically maintained
// Manual rebuild if needed (future feature):
// await storage.rebuildIndexes();
```

---

## Best Practices

### Session Management

**DO**:
- Start sessions at logical conversation boundaries
- Use descriptive metadata (context, project)
- Tag sessions for easy retrieval
- End sessions when conversation naturally concludes
- Set appropriate timeout values (30 min default is good)

**DON'T**:
- Create sessions for every single message
- Let sessions run indefinitely
- Forget to end sessions manually
- Use overly short timeouts (< 5 minutes)

### Message Recording

**DO**:
- Record complete message content
- Include relevant metadata (model, tokens, timing)
- Apply privacy filtering consistently
- Link messages to extracted memories

**DON'T**:
- Skip privacy filtering for "trusted" content
- Store partial messages
- Ignore response times (useful for analysis)

### Privacy Rules

**DO**:
- Use default rules as baseline
- Add domain-specific rules
- Test rules with sample data
- Monitor filter statistics

**DON'T**:
- Disable all privacy rules without good reason
- Use overly aggressive filtering (blocks legitimate content)
- Forget to update rules when threats change

### Error Handling

**DO**:
```typescript
// Graceful error handling
try {
  await storage.saveMessage(message);
} catch (error) {
  console.error('Failed to save message:', error);

  // Retry logic
  await new Promise(resolve => setTimeout(resolve, 100));
  try {
    await storage.saveMessage(message);
  } catch (retryError) {
    // Log to error tracking
    console.error('Retry failed:', retryError);
  }
}
```

**DON'T**:
```typescript
// Silent failure
await storage.saveMessage(message).catch(() => {});
```

### Resource Management

**DO**:
```typescript
// Clean shutdown
async function shutdown() {
  await sessionManager.endSession(activeSessionId);
  await storage.close(); // Flushes pending writes
  console.log('Shutdown complete');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

**DON'T**:
```typescript
// Abrupt exit without cleanup
process.exit(0); // May lose pending writes!
```

---

## Troubleshooting

### Message Not Appearing in Queries

**Problem**: Messages saved but not returned by queries.

**Cause**: Index not persisted or corrupted.

**Solution**:
```typescript
// Check if message file exists
const message = await storage.getMessage(messageId);
if (message) {
  console.log('Message exists in storage');
}

// Check session messages
const messages = await storage.getSessionMessages(sessionId);
console.log(`Found ${messages.length} messages`);

// If index is corrupted, restart storage
await storage.close();
await storage.init(); // Rebuilds indexes
```

### High Memory Usage

**Problem**: Memory usage grows over time.

**Cause**: Cache size too large or memory leak.

**Solution**:
```typescript
// Monitor cache size
const stats = await storage.getStats();
console.log(`Cache entries: ${stats.cacheSize}`);

// Clear cache periodically
storage.clearCache();

// Adjust cache size if needed (future feature)
```

### Slow Write Performance

**Problem**: Message writes taking > 50ms.

**Causes**:
1. Disk I/O bottleneck
2. Large message content
3. Many concurrent writes

**Solutions**:
```typescript
// Check disk performance
const start = Date.now();
await storage.saveMessage(message);
console.log(`Write took ${Date.now() - start}ms`);

// For large messages, consider compression (future feature)

// Reduce concurrent writes
const queue = new PQueue({ concurrency: 5 });
await queue.add(() => storage.saveMessage(message));
```

### Session Timeout Too Aggressive

**Problem**: Sessions closing unexpectedly.

**Solution**:
```typescript
// Increase timeout
const sessionManager = new SessionManager(storage, {
  sessionTimeout: 60, // 60 minutes instead of 30
  // ... other config
});

// Or manually refresh activity
await sessionManager.refreshActivity(sessionId);
```

### Privacy Filter Too Aggressive

**Problem**: Legitimate content being redacted.

**Solution**:
```typescript
// List active rules
const rules = privacyFilter.listRules();
rules.forEach(rule => {
  console.log(`${rule.description}: ${rule.pattern}`);
});

// Remove specific rule
privacyFilter.removeRule('Redact email addresses');

// Or adjust pattern
filter.addRule({
  type: 'pattern',
  pattern: /\b[A-Za-z0-9._%+-]+@company\.com\b/g, // Only company emails
  action: 'redact',
  description: 'Redact internal emails only'
});
```

### Storage Directory Permissions

**Problem**: Cannot write to storage directory.

**Solution**:
```bash
# Check permissions
ls -la ~/.memory-os

# Fix permissions
chmod 755 ~/.memory-os
chmod -R 644 ~/.memory-os/*
chmod -R +X ~/.memory-os

# Or use alternative path
const storage = new ConversationStorage({
  path: '/tmp/memory-os-test',
  backend: 'local'
});
```

---

## Next Steps

### Phase 2 (Coming Soon)

Phase 2 will add:
- **ConversationStreamProcessor** - Real-time OpenClaw conversation capture
- **CLI Integration** - `openclaw-memory-os record` command
- **Recording Mode Controls** - Enable SMART and FULL modes
- **OpenClaw Interception** - Automatic conversation recording

### Learn More

- [API Reference](./API_REFERENCE_v0.2.0.md) - Complete API documentation
- [Architecture Design](../FULL_CONVERSATION_RECORDING_ARCHITECTURE.md) - System architecture
- [Performance Report](../PERFORMANCE_BENCHMARK_REPORT.md) - Performance benchmarks
- [Integration Tests](../INTEGRATION_TEST_REPORT.md) - Test results and evidence

---

## Getting Help

**Issues**: https://github.com/ZhenRobotics/openclaw-memory-os/issues
**npm**: https://www.npmjs.com/package/openclaw-memory-os
**ClawHub**: https://clawhub.ai/ZhenStaff/memory-os

---

**openclaw-memory-os v0.2.0 Phase 1**
Digital Immortality Through Memory

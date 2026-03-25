/**
 * Conversation Integration Tests
 *
 * End-to-end integration testing for v0.2.0 Phase 1 conversation recording
 * Tests all 7 scenarios with comprehensive evidence collection
 *
 * Test Scenarios:
 * 1. Complete conversation recording flow
 * 2. Multi-session concurrency
 * 3. Session timeout management
 * 4. Privacy filter integration
 * 5. Configuration migration
 * 6. Cache efficiency
 * 7. Storage persistence
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConversationStorage } from '../../src/conversation/storage';
import { SessionManager } from '../../src/conversation/session-manager';
import { PrivacyFilter } from '../../src/conversation/privacy-filter';
import { ConfigManager } from '../../src/core/config-manager';
import {
  ConversationSession,
  ConversationMessage,
  RecordingMode,
  SessionStatus,
  RecordingConfig,
  StorageConfig
} from '../../src/conversation/types';
import { v4 as uuidv4 } from 'uuid';

// Evidence collection directory
const EVIDENCE_DIR = path.join(process.cwd(), 'test-evidence', 'integration');

// Test data storage
const TEST_DATA_DIR = path.join(os.tmpdir(), 'memory-os-integration-test');

/**
 * Evidence Collector
 * Captures test execution evidence for QA analysis
 */
class EvidenceCollector {
  private evidencePath: string;
  private scenarioEvidence: Map<string, any[]> = new Map();

  constructor(private scenarioName: string) {
    this.evidencePath = path.join(EVIDENCE_DIR, scenarioName);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.evidencePath, { recursive: true });
  }

  async captureSnapshot(name: string, data: any): Promise<void> {
    if (!this.scenarioEvidence.has(this.scenarioName)) {
      this.scenarioEvidence.set(this.scenarioName, []);
    }

    const evidence = {
      timestamp: new Date().toISOString(),
      name,
      data: typeof data === 'string' ? data : JSON.parse(JSON.stringify(data))
    };

    this.scenarioEvidence.get(this.scenarioName)!.push(evidence);

    // Write snapshot file
    const filename = `${name.replace(/\s+/g, '-')}.json`;
    await fs.writeFile(
      path.join(this.evidencePath, filename),
      JSON.stringify(evidence, null, 2),
      'utf-8'
    );
  }

  async captureFileSystemState(label: string): Promise<void> {
    const state = await this.collectFileSystemState(TEST_DATA_DIR);
    await this.captureSnapshot(`filesystem-${label}`, state);
  }

  async captureDatabaseContents(storage: ConversationStorage, label: string): Promise<void> {
    const stats = await storage.getStats();
    const sessions = await storage.searchConversations({});
    const messages = await storage.searchMessages({});

    await this.captureSnapshot(`database-${label}`, {
      stats,
      sessionCount: sessions.length,
      messageCount: messages.length,
      sessions: sessions.map(s => ({
        id: s.id,
        status: s.status,
        messageCount: s.messageCount,
        startTime: s.startTime,
        endTime: s.endTime
      })),
      messageSample: messages.slice(0, 5).map(m => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        contentPreview: m.content.substring(0, 100),
        filtered: m.metadata.filtered
      }))
    });
  }

  async generateReport(): Promise<void> {
    const report = {
      scenario: this.scenarioName,
      executionTime: new Date().toISOString(),
      evidenceItems: this.scenarioEvidence.get(this.scenarioName)?.length || 0,
      evidence: this.scenarioEvidence.get(this.scenarioName) || []
    };

    await fs.writeFile(
      path.join(this.evidencePath, 'report.json'),
      JSON.stringify(report, null, 2),
      'utf-8'
    );
  }

  private async collectFileSystemState(dir: string): Promise<any> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const state: any = {
        path: dir,
        files: [],
        directories: []
      };

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          state.directories.push({
            name: entry.name,
            children: await this.collectFileSystemState(fullPath)
          });
        } else {
          const stats = await fs.stat(fullPath);
          state.files.push({
            name: entry.name,
            size: stats.size,
            modified: stats.mtime
          });
        }
      }

      return state;
    } catch (error) {
      return { path: dir, error: 'Directory not accessible' };
    }
  }
}

/**
 * Test Data Generator
 */
class TestDataGenerator {
  static createMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    sensitive: boolean = false
  ): ConversationMessage {
    return {
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
      role,
      content: sensitive ? this.addSensitiveContent(content) : content,
      metadata: {
        source: 'test'
      }
    };
  }

  static addSensitiveContent(content: string): string {
    return `${content}\nMy email is test@example.com\nAPI Key: sk-abc123xyz456`;
  }

  static createLargeContent(sizeKB: number): string {
    const chunkSize = 100;
    const chunks = Math.ceil((sizeKB * 1024) / chunkSize);
    return Array(chunks).fill('x'.repeat(chunkSize)).join('');
  }
}

beforeAll(async () => {
  // Ensure evidence directory exists
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  // Clean up test data directory
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist
  }
});

afterAll(async () => {
  // Keep test data for evidence analysis
  console.log(`Test evidence saved to: ${EVIDENCE_DIR}`);
  console.log(`Test data preserved at: ${TEST_DATA_DIR}`);
});

describe('Integration Tests - Conversation Recording v0.2.0 Phase 1', () => {

  /**
   * Scenario 1: Complete Conversation Recording Flow
   *
   * Tests the end-to-end flow:
   * - Start new session
   * - Add user message
   * - Add assistant reply
   * - Trigger privacy filter
   * - Verify storage correctness
   * - Read complete session history
   */
  test('Scenario 1: Complete conversation recording flow', async () => {
    const evidence = new EvidenceCollector('scenario-1-complete-flow');
    await evidence.init();

    // Setup
    const config: StorageConfig = {
      path: path.join(TEST_DATA_DIR, 'scenario-1'),
      backend: 'local'
    };

    const storage = new ConversationStorage(config);
    await storage.init();

    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 30,
      privacyRules: [],
      retention: {
        autoArchive: false
      }
    };

    const sessionManager = new SessionManager(storage, recordingConfig);
    const privacyFilter = new PrivacyFilter();

    await evidence.captureSnapshot('config', { storage: config, recording: recordingConfig });

    // Step 1: Start new session
    const session = await sessionManager.startSession({
      source: 'openclaw',
      context: 'Integration test scenario 1'
    });

    expect(session).toBeDefined();
    expect(session.status).toBe(SessionStatus.ACTIVE);
    await evidence.captureSnapshot('session-created', session);

    // Step 2: Add user message
    const userMessage = TestDataGenerator.createMessage(
      session.id,
      'user',
      'How do I implement conversation recording in Memory-OS?'
    );

    await storage.saveMessage(userMessage);
    await sessionManager.updateSessionWithMessage(session.id, userMessage);
    await evidence.captureSnapshot('user-message-added', userMessage);

    // Step 3: Add assistant reply
    const assistantMessage = TestDataGenerator.createMessage(
      session.id,
      'assistant',
      'Memory-OS v0.2.0 provides full conversation recording with privacy filtering...'
    );

    await storage.saveMessage(assistantMessage);
    await sessionManager.updateSessionWithMessage(session.id, assistantMessage);
    await evidence.captureSnapshot('assistant-message-added', assistantMessage);

    // Step 4: Add message with sensitive content
    const sensitiveMessage = TestDataGenerator.createMessage(
      session.id,
      'user',
      'Here is my configuration',
      true // Add sensitive content
    );

    const filteredMessage = await privacyFilter.filterMessage(sensitiveMessage);
    await storage.saveMessage(filteredMessage);
    await sessionManager.updateSessionWithMessage(session.id, filteredMessage);

    await evidence.captureSnapshot('sensitive-message-filtered', {
      original: sensitiveMessage.content,
      filtered: filteredMessage.content,
      wasFiltered: filteredMessage.metadata.filtered
    });

    // Verify privacy filter worked
    expect(filteredMessage.metadata.filtered).toBe(true);
    expect(filteredMessage.content).toContain('[REDACTED]');
    expect(filteredMessage.content).not.toContain('test@example.com');

    // Step 5: Capture filesystem state
    await new Promise(resolve => setTimeout(resolve, 300)); // Allow async writes and index flush (200ms timer)
    await evidence.captureFileSystemState('after-messages');

    // Step 6: Read complete session history
    const sessionMessages = await storage.getSessionMessages(session.id);
    expect(sessionMessages).toHaveLength(3);
    await evidence.captureSnapshot('session-history', {
      messageCount: sessionMessages.length,
      messages: sessionMessages.map(m => ({
        id: m.id,
        role: m.role,
        filtered: m.metadata.filtered,
        preview: m.content.substring(0, 50)
      }))
    });

    // Step 7: Verify session state
    const retrievedSession = await storage.getSession(session.id);
    expect(retrievedSession).toBeDefined();
    expect(retrievedSession!.messageCount).toBe(3);
    await evidence.captureSnapshot('session-final-state', retrievedSession);

    // Capture final database state
    await evidence.captureDatabaseContents(storage, 'final');

    // Cleanup - destroy session manager to clear all timeouts
    await sessionManager.destroy();
    await storage.close();
    await evidence.generateReport();

    console.log(`✅ Scenario 1 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);

  /**
   * Scenario 2: Multi-Session Concurrency
   *
   * Tests concurrent session management:
   * - Create 3 sessions simultaneously
   * - Each session adds 5 messages
   * - Verify session isolation
   * - Check data integrity
   */
  test('Scenario 2: Multi-session concurrency', async () => {
    const evidence = new EvidenceCollector('scenario-2-concurrency');
    await evidence.init();

    const config: StorageConfig = {
      path: path.join(TEST_DATA_DIR, 'scenario-2'),
      backend: 'local'
    };

    const storage = new ConversationStorage(config);
    await storage.init();

    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 30,
      privacyRules: [],
      retention: { autoArchive: false }
    };

    const sessionManager = new SessionManager(storage, recordingConfig);

    // Create 3 sessions concurrently
    const sessionPromises = Array(3).fill(null).map((_, i) =>
      sessionManager.startSession({
        source: 'openclaw',
        context: `Concurrent session ${i + 1}`
      })
    );

    const sessions = await Promise.all(sessionPromises);
    expect(sessions).toHaveLength(3);
    await evidence.captureSnapshot('sessions-created', {
      sessionIds: sessions.map(s => s.id),
      count: sessions.length
    });

    // Each session adds 5 messages concurrently
    const messagePromises = sessions.flatMap(session =>
      Array(5).fill(null).map(async (_, i) => {
        const message = TestDataGenerator.createMessage(
          session.id,
          i % 2 === 0 ? 'user' : 'assistant',
          `Message ${i + 1} in session ${session.id}`
        );
        await storage.saveMessage(message);
        await sessionManager.updateSessionWithMessage(session.id, message);
        return message;
      })
    );

    await Promise.all(messagePromises);
    await new Promise(resolve => setTimeout(resolve, 200)); // Allow async writes

    // Verify session isolation
    for (const session of sessions) {
      const messages = await storage.getSessionMessages(session.id);
      expect(messages).toHaveLength(5);

      // Verify all messages belong to this session
      messages.forEach(msg => {
        expect(msg.sessionId).toBe(session.id);
      });

      await evidence.captureSnapshot(`session-${session.id}-messages`, {
        sessionId: session.id,
        messageCount: messages.length,
        messages: messages.map(m => ({ id: m.id, role: m.role }))
      });
    }

    // Verify total data integrity
    const allMessages = await storage.searchMessages({});
    expect(allMessages).toHaveLength(15); // 3 sessions × 5 messages

    await evidence.captureDatabaseContents(storage, 'final');
    await evidence.captureFileSystemState('final');

    // Cleanup - destroy session manager to clear all timeouts
    await sessionManager.destroy();
    await storage.close();
    await evidence.generateReport();

    console.log(`✅ Scenario 2 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);

  /**
   * Scenario 3: Session Timeout Management
   *
   * Tests automatic session timeout:
   * - Create session with 1-second timeout
   * - Simulate inactivity
   * - Verify automatic archiving
   * - Check session status change
   */
  test('Scenario 3: Session timeout management', async () => {
    const evidence = new EvidenceCollector('scenario-3-timeout');
    await evidence.init();

    const config: StorageConfig = {
      path: path.join(TEST_DATA_DIR, 'scenario-3'),
      backend: 'local'
    };

    const storage = new ConversationStorage(config);
    await storage.init();

    // Use very short timeout for testing (0.05 minutes = 3 seconds)
    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 0.05,
      privacyRules: [],
      retention: { autoArchive: false }
    };

    const sessionManager = new SessionManager(storage, recordingConfig);

    // Create session
    const session = await sessionManager.startSession({
      source: 'openclaw',
      context: 'Timeout test'
    });

    expect(session.status).toBe(SessionStatus.ACTIVE);
    await evidence.captureSnapshot('session-created', {
      id: session.id,
      status: session.status,
      timeoutMinutes: recordingConfig.sessionTimeout
    });

    // Add one message
    const message = TestDataGenerator.createMessage(
      session.id,
      'user',
      'Testing timeout'
    );
    await storage.saveMessage(message);
    await sessionManager.updateSessionWithMessage(session.id, message);

    await evidence.captureSnapshot('before-timeout', {
      activeSessions: sessionManager.getActiveSessions().length
    });

    // Wait for timeout (3.5 seconds to be safe)
    console.log('Waiting for session timeout (3.5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Check if session was auto-closed
    const activeSessions = sessionManager.getActiveSessions();
    expect(activeSessions).toHaveLength(0);

    await evidence.captureSnapshot('after-timeout', {
      activeSessions: activeSessions.length,
      message: 'Session should be auto-closed'
    });

    // Verify session was ended
    const endedSession = await storage.getSession(session.id);
    expect(endedSession).toBeDefined();
    expect(endedSession!.status).toBe(SessionStatus.COMPLETED);
    expect(endedSession!.endTime).toBeDefined();

    await evidence.captureSnapshot('session-final-state', endedSession);
    await evidence.captureDatabaseContents(storage, 'final');

    // Cleanup - destroy session manager to clear all timeouts
    await sessionManager.destroy();
    await storage.close();
    await evidence.generateReport();

    console.log(`✅ Scenario 3 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);

  /**
   * Scenario 4: Privacy Filter Integration
   *
   * Tests privacy filtering:
   * - Messages with API keys
   * - Messages with email addresses
   * - Messages with credit card numbers
   * - Verify filtering rules trigger
   * - Confirm sensitive info redacted
   * - Check filtering statistics
   */
  test('Scenario 4: Privacy filter integration', async () => {
    const evidence = new EvidenceCollector('scenario-4-privacy');
    await evidence.init();

    const privacyFilter = new PrivacyFilter();

    const testCases = [
      {
        name: 'API Key',
        content: 'My OpenAI API key is sk-abc123xyz456',
        shouldRedact: true
      },
      {
        name: 'Email',
        content: 'Contact me at john.doe@example.com',
        shouldRedact: true
      },
      {
        name: 'Credit Card',
        content: 'My card is 4532-1234-5678-9010',
        shouldRedact: true
      },
      {
        name: 'Phone Number',
        content: 'Call me at (555) 123-4567',
        shouldRedact: true
      },
      {
        name: 'IP Address',
        content: 'Server IP: 192.168.1.100',
        shouldRedact: true
      },
      {
        name: 'Clean Content',
        content: 'This is a normal message without sensitive data',
        shouldRedact: false
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      const message: ConversationMessage = {
        id: uuidv4(),
        sessionId: 'test-session',
        timestamp: new Date(),
        role: 'user',
        content: testCase.content,
        metadata: { source: 'test' }
      };

      const filtered = await privacyFilter.filterMessage(message);

      const result = {
        testCase: testCase.name,
        original: testCase.content,
        filtered: filtered.content,
        wasFiltered: filtered.metadata.filtered || false,
        expectedRedaction: testCase.shouldRedact,
        passed: (filtered.metadata.filtered || false) === testCase.shouldRedact
      };

      results.push(result);

      // Verify redaction
      if (testCase.shouldRedact) {
        expect(filtered.metadata.filtered).toBe(true);
        expect(filtered.content).toContain('[REDACTED]');
      } else {
        expect(filtered.metadata.filtered).toBeFalsy();
        expect(filtered.content).toBe(testCase.content);
      }
    }

    await evidence.captureSnapshot('filter-test-results', results);

    // Check statistics
    const stats = privacyFilter.getStats();
    await evidence.captureSnapshot('filter-statistics', stats);

    expect(stats.messagesFiltered).toBeGreaterThan(0);
    expect(stats.messagesRedacted).toBeGreaterThan(0);

    await evidence.generateReport();

    console.log(`✅ Scenario 4 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);

  /**
   * Scenario 5: Configuration Migration
   *
   * Tests backward compatibility:
   * - Simulate v0.1.2 user configuration
   * - Trigger automatic migration
   * - Verify new configuration sections
   * - Confirm backward compatibility
   */
  test('Scenario 5: Configuration migration', async () => {
    const evidence = new EvidenceCollector('scenario-5-migration');
    await evidence.init();

    const configPath = path.join(TEST_DATA_DIR, 'scenario-5', 'config.json');
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    // Create v0.1.2 style config
    const oldConfig = {
      version: '0.1.2',
      storage: {
        path: '~/.memory-os',
        backend: 'local'
      },
      collectors: [],
      privacy: {
        encryption: false,
        shareStats: false
      }
    };

    await fs.writeFile(configPath, JSON.stringify(oldConfig, null, 2), 'utf-8');
    await evidence.captureSnapshot('config-before-migration', oldConfig);

    // Load config (should trigger migration)
    const configManager = new ConfigManager(configPath);
    const migratedConfig = await configManager.load();

    await evidence.captureSnapshot('config-after-migration', migratedConfig);

    // Verify migration
    expect(migratedConfig.version).toBe('0.2.0');
    expect(migratedConfig.conversation).toBeDefined();
    expect(migratedConfig.conversation!.recording).toBeDefined();
    expect(migratedConfig.legacy).toBeDefined();

    // Verify safe defaults for existing users
    expect(migratedConfig.conversation!.recording.mode).toBe(RecordingMode.TRIGGER_ONLY);
    expect(migratedConfig.conversation!.recording.autoStart).toBe(false);

    // Verify backward compatibility - old config preserved
    expect(migratedConfig.storage.path).toBe(oldConfig.storage.path);
    expect(migratedConfig.storage.backend).toBe(oldConfig.storage.backend);

    await evidence.captureSnapshot('migration-validation', {
      versionUpdated: migratedConfig.version === '0.2.0',
      conversationSectionAdded: !!migratedConfig.conversation,
      legacySectionAdded: !!migratedConfig.legacy,
      safeDefaultsApplied: migratedConfig.conversation!.recording.mode === RecordingMode.TRIGGER_ONLY,
      oldConfigPreserved: migratedConfig.storage.path === oldConfig.storage.path
    });

    await evidence.generateReport();

    console.log(`✅ Scenario 5 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);

  /**
   * Scenario 6: Cache Efficiency
   *
   * Tests cache performance:
   * - Write 100 messages
   * - Multiple reads of same data
   * - Verify cache hits
   * - Check performance improvement
   */
  test('Scenario 6: Cache efficiency', async () => {
    const evidence = new EvidenceCollector('scenario-6-cache');
    await evidence.init();

    const config: StorageConfig = {
      path: path.join(TEST_DATA_DIR, 'scenario-6'),
      backend: 'local'
    };

    const storage = new ConversationStorage(config);
    await storage.init();

    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 30,
      privacyRules: [],
      retention: { autoArchive: false }
    };

    const sessionManager = new SessionManager(storage, recordingConfig);

    // Create session and add 100 messages
    const session = await sessionManager.startSession();
    const messageIds: string[] = [];

    for (let i = 0; i < 100; i++) {
      const message = TestDataGenerator.createMessage(
        session.id,
        i % 2 === 0 ? 'user' : 'assistant',
        `Cache test message ${i + 1}`
      );
      await storage.saveMessage(message);
      messageIds.push(message.id);
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    // First read (cache miss expected) - using performance.now() for microsecond precision
    const startColdRead = performance.now();
    for (const id of messageIds.slice(0, 10)) {
      await storage.getMessage(id);
    }
    const coldReadTime = performance.now() - startColdRead;

    await evidence.captureSnapshot('cold-read-performance', {
      messageCount: 10,
      totalTime: coldReadTime,
      avgTime: coldReadTime / 10
    });

    // Second read (cache hit expected) - using performance.now() for microsecond precision
    const startHotRead = performance.now();
    for (const id of messageIds.slice(0, 10)) {
      await storage.getMessage(id);
    }
    const hotReadTime = performance.now() - startHotRead;

    await evidence.captureSnapshot('hot-read-performance', {
      messageCount: 10,
      totalTime: hotReadTime,
      avgTime: hotReadTime / 10,
      speedup: coldReadTime > 0 && hotReadTime > 0 ? `${(coldReadTime / hotReadTime).toFixed(2)}x faster` : 'N/A'
    });

    // Verify cache effectiveness (hot read should be faster than cold read)
    expect(hotReadTime).toBeLessThan(coldReadTime);

    // Random access pattern for cache hit rate test
    const randomReads = 200;
    for (let i = 0; i < randomReads; i++) {
      const randomId = messageIds[Math.floor(Math.random() * messageIds.length)];
      await storage.getMessage(randomId);
    }

    const stats = await storage.getStats();
    await evidence.captureSnapshot('cache-statistics', {
      totalMessages: stats.totalMessages,
      cacheHitRate: stats.cacheHitRate,
      cacheHitRatePercent: `${(stats.cacheHitRate! * 100).toFixed(1)}%`
    });

    // Cache hit rate should be reasonable (above 50% for random access)
    expect(stats.cacheHitRate).toBeGreaterThan(0.5);

    // Cleanup - destroy session manager to clear all timeouts
    await sessionManager.destroy();
    await storage.close();
    await evidence.generateReport();

    console.log(`✅ Scenario 6 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);

  /**
   * Scenario 7: Storage Persistence
   *
   * Tests data persistence:
   * - Write data to storage
   * - Close storage (clear cache)
   * - Reopen storage
   * - Read data from disk
   * - Verify data integrity
   */
  test('Scenario 7: Storage persistence', async () => {
    const evidence = new EvidenceCollector('scenario-7-persistence');
    await evidence.init();

    const storagePath = path.join(TEST_DATA_DIR, 'scenario-7');
    const config: StorageConfig = {
      path: storagePath,
      backend: 'local'
    };

    // Phase 1: Write data
    const storage1 = new ConversationStorage(config);
    await storage1.init();

    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 30,
      privacyRules: [],
      retention: { autoArchive: false }
    };

    const sessionManager1 = new SessionManager(storage1, recordingConfig);
    const session = await sessionManager1.startSession({
      source: 'openclaw',
      context: 'Persistence test'
    });

    const messages = [];
    for (let i = 0; i < 10; i++) {
      const message = TestDataGenerator.createMessage(
        session.id,
        i % 2 === 0 ? 'user' : 'assistant',
        `Persistence test message ${i + 1}`
      );
      await storage1.saveMessage(message);
      await sessionManager1.updateSessionWithMessage(session.id, message);
      messages.push(message);
    }

    await sessionManager1.endSession(session.id);
    await new Promise(resolve => setTimeout(resolve, 200));

    const stats1 = await storage1.getStats();
    await evidence.captureSnapshot('before-close', {
      sessionId: session.id,
      messageCount: messages.length,
      stats: stats1
    });

    await evidence.captureFileSystemState('before-close');

    // Close storage (this clears cache)
    await storage1.close();

    // Phase 2: Reopen and verify
    const storage2 = new ConversationStorage(config);
    await storage2.init();

    await evidence.captureSnapshot('after-reopen', {
      message: 'Storage reopened, cache cleared'
    });

    // Read session from disk
    const loadedSession = await storage2.getSession(session.id);
    expect(loadedSession).toBeDefined();
    expect(loadedSession!.id).toBe(session.id);
    expect(loadedSession!.messageCount).toBe(10);
    expect(loadedSession!.status).toBe(SessionStatus.COMPLETED);

    await evidence.captureSnapshot('session-loaded-from-disk', {
      sessionId: loadedSession!.id,
      messageCount: loadedSession!.messageCount,
      status: loadedSession!.status,
      hasEndTime: !!loadedSession!.endTime
    });

    // Read messages from disk
    const loadedMessages = await storage2.getSessionMessages(session.id);
    expect(loadedMessages).toHaveLength(10);

    // Verify message content integrity
    for (let i = 0; i < loadedMessages.length; i++) {
      const original = messages[i];
      const loaded = loadedMessages.find(m => m.id === original.id);
      expect(loaded).toBeDefined();
      expect(loaded!.content).toBe(original.content);
      expect(loaded!.role).toBe(original.role);
    }

    await evidence.captureSnapshot('messages-loaded-from-disk', {
      messageCount: loadedMessages.length,
      allMessagesIntact: true,
      messageSample: loadedMessages.slice(0, 3).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content.substring(0, 50)
      }))
    });

    const stats2 = await storage2.getStats();
    await evidence.captureSnapshot('stats-after-reload', {
      totalSessions: stats2.totalSessions,
      totalMessages: stats2.totalMessages,
      matchesOriginal: stats2.totalMessages === stats1.totalMessages
    });

    await evidence.captureFileSystemState('after-reload');

    // Cleanup - destroy session managers to clear all timeouts
    await sessionManager1.destroy();
    await storage2.close();
    await evidence.generateReport();

    console.log(`✅ Scenario 7 completed - Evidence at: ${evidence['evidencePath']}`);
  }, 30000);
});

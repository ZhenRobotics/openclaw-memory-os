/**
 * Conversation Performance Benchmark Suite
 *
 * Comprehensive performance testing for v0.2.0 Phase 1 modules:
 * - ConversationStorage (write/read/cache performance)
 * - SessionManager (session lifecycle performance)
 * - PrivacyFilter (filtering performance)
 *
 * Performance Targets:
 * - Write: <10ms per operation
 * - Read: <5ms per operation
 * - Cache hit rate: >80%
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConversationStorage } from '../../src/conversation/storage';
import { SessionManager } from '../../src/conversation/session-manager';
import { PrivacyFilter, DEFAULT_PRIVACY_RULES } from '../../src/conversation/privacy-filter';
import {
  ConversationSession,
  ConversationMessage,
  StorageConfig,
  RecordingConfig,
  RecordingMode,
  SessionStatus
} from '../../src/conversation/types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Performance Tracking Utilities
// ============================================================================

interface PerformanceResult {
  operation: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
}

class PerformanceTracker {
  private measurements: Map<string, number[]> = new Map();

  track(operation: string, duration: number): void {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    this.measurements.get(operation)!.push(duration);
  }

  getResult(operation: string): PerformanceResult {
    const times = this.measurements.get(operation) || [];
    if (times.length === 0) {
      return {
        operation,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        throughput: 0
      };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      operation,
      count: times.length,
      totalTime: sum,
      avgTime: sum / times.length,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      throughput: (times.length / sum) * 1000 // ops/sec
    };
  }

  getAllResults(): PerformanceResult[] {
    return Array.from(this.measurements.keys()).map(op => this.getResult(op));
  }

  reset(): void {
    this.measurements.clear();
  }
}

// ============================================================================
// Test Data Generation
// ============================================================================

class TestDataGenerator {
  generateMessage(sessionId: string, role: 'user' | 'assistant', size: 'small' | 'medium' | 'large' = 'medium'): ConversationMessage {
    const content = this.generateContent(size);

    return {
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
      role,
      content,
      metadata: {
        source: 'test',
        model: role === 'assistant' ? 'claude-3' : undefined
      },
      tokens: Math.floor(content.length / 4),
      responseTime: Math.random() * 1000
    };
  }

  generateContent(size: 'small' | 'medium' | 'large'): string {
    const sizes = {
      small: 100,    // ~100 chars
      medium: 1000,  // ~1KB
      large: 10000   // ~10KB
    };

    const length = sizes[size];
    const words = [
      'test', 'performance', 'benchmark', 'conversation', 'message',
      'memory', 'storage', 'session', 'data', 'processing'
    ];

    let content = '';
    while (content.length < length) {
      content += words[Math.floor(Math.random() * words.length)] + ' ';
    }

    return content.substring(0, length);
  }

  generateCodeBlock(lines: number = 50): string {
    const codeLines = [];
    for (let i = 0; i < lines; i++) {
      codeLines.push(`function test${i}() { return ${i}; }`);
    }
    return '```javascript\n' + codeLines.join('\n') + '\n```';
  }

  generateSensitiveContent(): string {
    return `
      My email is user@example.com and password is secret123.
      API key: sk-1234567890abcdef
      Credit card: 4532-1234-5678-9010
      Phone: +1-555-123-4567
      IP Address: 192.168.1.1
    `;
  }
}

// ============================================================================
// Performance Test Suite
// ============================================================================

describe('Conversation Performance Benchmarks', () => {
  let storage: ConversationStorage;
  let sessionManager: SessionManager;
  let privacyFilter: PrivacyFilter;
  let tracker: PerformanceTracker;
  let dataGen: TestDataGenerator;
  let testDir: string;

  beforeAll(async () => {
    testDir = path.join(__dirname, '../../.test-data/performance-test');
    await fs.mkdir(testDir, { recursive: true });

    const storageConfig: StorageConfig = {
      path: testDir,
      backend: 'filesystem'
    };

    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 30,
      privacyRules: DEFAULT_PRIVACY_RULES,
      retention: {
        autoArchive: false
      },
      generateSummaries: true
    };

    storage = new ConversationStorage(storageConfig);
    await storage.init();

    sessionManager = new SessionManager(storage, recordingConfig);
    privacyFilter = new PrivacyFilter();
    tracker = new PerformanceTracker();
    dataGen = new TestDataGenerator();
  });

  afterAll(async () => {
    await storage.close();
    // Clean up test data
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    tracker.reset();
    privacyFilter.resetStats();
  });

  // ==========================================================================
  // Storage Write Performance Tests
  // ==========================================================================

  describe('Storage Write Performance', () => {
    test('single message write should be <10ms', async () => {
      const session = await sessionManager.startSession();
      const message = dataGen.generateMessage(session.id, 'user');

      const start = performance.now();
      await storage.saveMessage(message);
      const duration = performance.now() - start;

      tracker.track('single_write', duration);

      expect(duration).toBeLessThan(10);
    });

    test('batch message write (10 messages) performance', async () => {
      const session = await sessionManager.startSession();
      const messages = Array.from({ length: 10 }, () =>
        dataGen.generateMessage(session.id, 'user')
      );

      const start = performance.now();
      for (const message of messages) {
        await storage.saveMessage(message);
      }
      const duration = performance.now() - start;

      const avgPerMessage = duration / messages.length;
      tracker.track('batch_write_10', avgPerMessage);

      console.log(`Batch write (10): ${avgPerMessage.toFixed(2)}ms per message`);
      expect(avgPerMessage).toBeLessThan(10);
    });

    test('batch message write (100 messages) performance', async () => {
      const session = await sessionManager.startSession();
      const messages = Array.from({ length: 100 }, () =>
        dataGen.generateMessage(session.id, 'user')
      );

      const start = performance.now();
      for (const message of messages) {
        await storage.saveMessage(message);
      }
      const duration = performance.now() - start;

      const avgPerMessage = duration / messages.length;
      tracker.track('batch_write_100', avgPerMessage);

      console.log(`Batch write (100): ${avgPerMessage.toFixed(2)}ms per message`);
      expect(avgPerMessage).toBeLessThan(15); // Slightly higher tolerance for batch
    });

    test('batch message write (1000 messages) performance', async () => {
      const session = await sessionManager.startSession();
      const messages = Array.from({ length: 1000 }, () =>
        dataGen.generateMessage(session.id, 'user')
      );

      const start = performance.now();
      for (const message of messages) {
        await storage.saveMessage(message);
      }
      const duration = performance.now() - start;

      const avgPerMessage = duration / messages.length;
      tracker.track('batch_write_1000', avgPerMessage);

      console.log(`Batch write (1000): ${avgPerMessage.toFixed(2)}ms per message`);
      expect(avgPerMessage).toBeLessThan(20); // Batch operations may have overhead
    });

    test('concurrent write performance (10 parallel sessions)', async () => {
      const sessions = await Promise.all(
        Array.from({ length: 10 }, () => sessionManager.startSession())
      );

      const start = performance.now();

      await Promise.all(
        sessions.map(async (session) => {
          const messages = Array.from({ length: 10 }, () =>
            dataGen.generateMessage(session.id, 'user')
          );
          for (const message of messages) {
            await storage.saveMessage(message);
          }
        })
      );

      const duration = performance.now() - start;
      const totalMessages = sessions.length * 10;
      const avgPerMessage = duration / totalMessages;

      tracker.track('concurrent_write', avgPerMessage);

      console.log(`Concurrent write (10 sessions): ${avgPerMessage.toFixed(2)}ms per message`);
      expect(avgPerMessage).toBeLessThan(25); // Concurrent operations may have contention
    });

    test('large message write performance (10KB)', async () => {
      const session = await sessionManager.startSession();
      const message = dataGen.generateMessage(session.id, 'user', 'large');

      const start = performance.now();
      await storage.saveMessage(message);
      const duration = performance.now() - start;

      tracker.track('large_message_write', duration);

      console.log(`Large message write (10KB): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50); // Larger messages take more time
    });
  });

  // ==========================================================================
  // Storage Read Performance Tests
  // ==========================================================================

  describe('Storage Read Performance', () => {
    let testSession: ConversationSession;
    let testMessages: ConversationMessage[];

    beforeAll(async () => {
      testSession = await sessionManager.startSession();
      testMessages = Array.from({ length: 100 }, () =>
        dataGen.generateMessage(testSession.id, 'user')
      );

      for (const message of testMessages) {
        await storage.saveMessage(message);
      }

      // Wait for index flush
      await new Promise(resolve => setTimeout(resolve, 6000));
    });

    test('single message read (cache hit) should be <5ms', async () => {
      const messageId = testMessages[0].id;

      // First read to populate cache
      await storage.getMessage(messageId);

      // Second read from cache
      const start = performance.now();
      await storage.getMessage(messageId);
      const duration = performance.now() - start;

      tracker.track('read_cache_hit', duration);

      console.log(`Read cache hit: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(5);
    });

    test('single message read (cache miss) should be <20ms', async () => {
      const messageId = testMessages[50].id;

      const start = performance.now();
      await storage.getMessage(messageId);
      const duration = performance.now() - start;

      tracker.track('read_cache_miss', duration);

      console.log(`Read cache miss: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(20);
    });

    test('session history read (100 messages) performance', async () => {
      const start = performance.now();
      const messages = await storage.getSessionMessages(testSession.id);
      const duration = performance.now() - start;

      tracker.track('session_history_100', duration);

      console.log(`Session history (100 messages): ${duration.toFixed(2)}ms`);
      expect(messages.length).toBe(100);
      expect(duration).toBeLessThan(500); // Bulk read may take longer
    });

    test('index query performance', async () => {
      const start = performance.now();
      const results = await storage.searchMessages({
        sessionId: testSession.id,
        limit: 50
      });
      const duration = performance.now() - start;

      tracker.track('index_query', duration);

      console.log(`Index query: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  // ==========================================================================
  // Cache Efficiency Tests
  // ==========================================================================

  describe('Cache Efficiency', () => {
    test('cache hit rate should be >80% for repeated access', async () => {
      const session = await sessionManager.startSession();
      const messages = Array.from({ length: 100 }, () =>
        dataGen.generateMessage(session.id, 'user')
      );

      // Write messages
      for (const message of messages) {
        await storage.saveMessage(message);
      }

      // Read messages multiple times
      let cacheHits = 0;
      const totalReads = 200;

      for (let i = 0; i < totalReads; i++) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const start = performance.now();
        await storage.getMessage(randomMessage.id);
        const duration = performance.now() - start;

        // Cache hit if read is fast
        if (duration < 5) {
          cacheHits++;
        }
      }

      const hitRate = (cacheHits / totalReads) * 100;
      console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);

      expect(hitRate).toBeGreaterThan(80);
    });

    test('LRU eviction performance', async () => {
      const session = await sessionManager.startSession();

      // Create more messages than cache size (1000 cache limit)
      const messages = Array.from({ length: 1500 }, () =>
        dataGen.generateMessage(session.id, 'user')
      );

      const start = performance.now();
      for (const message of messages) {
        await storage.saveMessage(message);
      }
      const duration = performance.now() - start;

      const avgPerMessage = duration / messages.length;

      console.log(`LRU eviction test: ${avgPerMessage.toFixed(2)}ms per message`);

      // Should still maintain good performance even with evictions
      expect(avgPerMessage).toBeLessThan(15);
    });
  });

  // ==========================================================================
  // Session Manager Performance Tests
  // ==========================================================================

  describe('Session Manager Performance', () => {
    test('session creation should be <50ms', async () => {
      const start = performance.now();
      await sessionManager.startSession();
      const duration = performance.now() - start;

      tracker.track('session_create', duration);

      console.log(`Session creation: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    test('session update with message should be <20ms', async () => {
      const session = await sessionManager.startSession();
      const message = dataGen.generateMessage(session.id, 'user');

      const start = performance.now();
      await sessionManager.updateSessionWithMessage(session.id, message);
      const duration = performance.now() - start;

      tracker.track('session_update', duration);

      console.log(`Session update: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(20);
    });

    test('concurrent session management (100 sessions)', async () => {
      const start = performance.now();

      const sessions = await Promise.all(
        Array.from({ length: 100 }, () => sessionManager.startSession())
      );

      const duration = performance.now() - start;
      const avgPerSession = duration / sessions.length;

      tracker.track('concurrent_session_create', avgPerSession);

      console.log(`Concurrent session creation (100): ${avgPerSession.toFixed(2)}ms per session`);
      expect(avgPerSession).toBeLessThan(100);
    });

    test('timeout check performance (1000 sessions)', async () => {
      // Create 1000 sessions
      const sessions = await Promise.all(
        Array.from({ length: 1000 }, () => sessionManager.startSession())
      );

      // Measure getting all active sessions (timeout check)
      const start = performance.now();
      const activeSessions = sessionManager.getActiveSessions();
      const duration = performance.now() - start;

      tracker.track('timeout_check_1000', duration);

      console.log(`Timeout check (1000 sessions): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
      expect(activeSessions.length).toBe(1000);
    });
  });

  // ==========================================================================
  // Privacy Filter Performance Tests
  // ==========================================================================

  describe('Privacy Filter Performance', () => {
    test('single message filter (8 default rules) should be <5ms', async () => {
      const message = dataGen.generateMessage('test-session', 'user');

      const start = performance.now();
      await privacyFilter.filterMessage(message);
      const duration = performance.now() - start;

      tracker.track('filter_single', duration);

      console.log(`Privacy filter (8 rules): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(5);
    });

    test('filter with sensitive content (redaction)', async () => {
      const message: ConversationMessage = {
        id: uuidv4(),
        sessionId: 'test',
        timestamp: new Date(),
        role: 'user',
        content: dataGen.generateSensitiveContent(),
        metadata: { source: 'test' }
      };

      const start = performance.now();
      const filtered = await privacyFilter.filterMessage(message);
      const duration = performance.now() - start;

      tracker.track('filter_redaction', duration);

      console.log(`Privacy filter with redaction: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(10);
      expect(filtered.content).toContain('[REDACTED]');
    });

    test('large message filter performance (10KB)', async () => {
      const message: ConversationMessage = {
        id: uuidv4(),
        sessionId: 'test',
        timestamp: new Date(),
        role: 'user',
        content: dataGen.generateContent('large'),
        metadata: { source: 'test' }
      };

      const start = performance.now();
      await privacyFilter.filterMessage(message);
      const duration = performance.now() - start;

      tracker.track('filter_large', duration);

      console.log(`Privacy filter (10KB message): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(20);
    });

    test('filter with 50 rules performance', async () => {
      // Create filter with many rules
      const manyRules = [
        ...DEFAULT_PRIVACY_RULES,
        ...Array.from({ length: 42 }, (_, i) => ({
          type: 'keyword' as const,
          pattern: `test${i}`,
          action: 'redact' as const,
          description: `Test rule ${i}`,
          enabled: true
        }))
      ];

      const filterWithManyRules = new PrivacyFilter(manyRules);
      const message = dataGen.generateMessage('test-session', 'user');

      const start = performance.now();
      await filterWithManyRules.filterMessage(message);
      const duration = performance.now() - start;

      tracker.track('filter_50_rules', duration);

      console.log(`Privacy filter (50 rules): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(15);
    });

    test('batch filter performance (100 messages)', async () => {
      const messages = Array.from({ length: 100 }, () =>
        dataGen.generateMessage('test-session', 'user')
      );

      const start = performance.now();
      for (const message of messages) {
        await privacyFilter.filterMessage(message);
      }
      const duration = performance.now() - start;

      const avgPerMessage = duration / messages.length;
      tracker.track('filter_batch_100', avgPerMessage);

      console.log(`Batch filter (100 messages): ${avgPerMessage.toFixed(2)}ms per message`);
      expect(avgPerMessage).toBeLessThan(5);
    });
  });

  // ==========================================================================
  // Memory Usage Tests
  // ==========================================================================

  describe('Memory Usage', () => {
    test('memory usage under load', async () => {
      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

      // Create significant load
      const session = await sessionManager.startSession();
      const messages = Array.from({ length: 1000 }, () =>
        dataGen.generateMessage(session.id, 'user')
      );

      for (const message of messages) {
        await storage.saveMessage(message);
      }

      const peakMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const memoryIncrease = peakMemory - initialMemory;

      console.log(`Memory usage: Initial ${initialMemory.toFixed(2)}MB, Peak ${peakMemory.toFixed(2)}MB, Increase ${memoryIncrease.toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 100MB for 1000 messages)
      expect(memoryIncrease).toBeLessThan(100);
    });
  });

  // ==========================================================================
  // Performance Report Generation
  // ==========================================================================

  afterAll(() => {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(80) + '\n');

    const results = tracker.getAllResults();

    console.log('Operation Performance Summary:');
    console.log('-'.repeat(80));

    for (const result of results) {
      console.log(`\n${result.operation}:`);
      console.log(`  Count: ${result.count}`);
      console.log(`  Avg: ${result.avgTime.toFixed(2)}ms`);
      console.log(`  Min: ${result.minTime.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxTime.toFixed(2)}ms`);
      console.log(`  P50: ${result.p50.toFixed(2)}ms`);
      console.log(`  P95: ${result.p95.toFixed(2)}ms`);
      console.log(`  P99: ${result.p99.toFixed(2)}ms`);
      console.log(`  Throughput: ${result.throughput.toFixed(2)} ops/sec`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('Privacy Filter Statistics:');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(privacyFilter.getStats(), null, 2));

    console.log('\n' + '='.repeat(80) + '\n');
  });
});

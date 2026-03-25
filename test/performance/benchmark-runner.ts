/**
 * Advanced Performance Benchmark Runner
 *
 * Standalone benchmark runner with detailed analysis and reporting
 * Can be run independently of Jest for continuous performance monitoring
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConversationStorage } from '../../src/conversation/storage';
import { SessionManager } from '../../src/conversation/session-manager';
import { PrivacyFilter, DEFAULT_PRIVACY_RULES } from '../../src/conversation/privacy-filter';
import {
  StorageConfig,
  RecordingConfig,
  RecordingMode,
  ConversationMessage
} from '../../src/conversation/types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Benchmark Configuration
// ============================================================================

interface BenchmarkConfig {
  warmupIterations: number;
  measurementIterations: number;
  messageSizes: number[];
  concurrencyLevels: number[];
  enableDetailedLogging: boolean;
}

const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  warmupIterations: 10,
  measurementIterations: 100,
  messageSizes: [100, 1000, 10000], // bytes
  concurrencyLevels: [1, 10, 50],
  enableDetailedLogging: true
};

// ============================================================================
// Benchmark Results Types
// ============================================================================

interface BenchmarkResult {
  name: string;
  unit: string;
  value: number;
  target?: number;
  passed?: boolean;
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  metadata?: Record<string, any>;
}

interface BenchmarkReport {
  timestamp: Date;
  version: string;
  environment: {
    nodeVersion: string;
    platform: string;
    cpus: number;
    memory: number;
  };
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    performanceScore: number;
  };
}

// ============================================================================
// Performance Analyzer
// ============================================================================

class PerformanceAnalyzer {
  private measurements: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    if (!this.measurements.has(metric)) {
      this.measurements.set(metric, []);
    }
    this.measurements.get(metric)!.push(value);
  }

  analyze(metric: string): BenchmarkResult | null {
    const values = this.measurements.get(metric);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      name: metric,
      unit: 'ms',
      value: sum / values.length,
      percentiles: {
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      },
      metadata: {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        stdDev: this.calculateStdDev(values, sum / values.length)
      }
    };
  }

  private calculateStdDev(values: number[], mean: number): number {
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  getAllMetrics(): string[] {
    return Array.from(this.measurements.keys());
  }

  clear(): void {
    this.measurements.clear();
  }
}

// ============================================================================
// Benchmark Suite
// ============================================================================

class BenchmarkSuite {
  private storage!: ConversationStorage;
  private sessionManager!: SessionManager;
  private privacyFilter!: PrivacyFilter;
  private analyzer: PerformanceAnalyzer;
  private config: BenchmarkConfig;
  private testDir: string;

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = { ...DEFAULT_BENCHMARK_CONFIG, ...config };
    this.analyzer = new PerformanceAnalyzer();
    this.testDir = path.join(__dirname, '../../.test-data/benchmark-' + Date.now());
  }

  async setup(): Promise<void> {
    await fs.mkdir(this.testDir, { recursive: true });

    const storageConfig: StorageConfig = {
      path: this.testDir,
      backend: 'filesystem'
    };

    const recordingConfig: RecordingConfig = {
      mode: RecordingMode.FULL,
      autoStart: true,
      sessionTimeout: 30,
      privacyRules: DEFAULT_PRIVACY_RULES,
      retention: { autoArchive: false },
      generateSummaries: true
    };

    this.storage = new ConversationStorage(storageConfig);
    await this.storage.init();

    this.sessionManager = new SessionManager(this.storage, recordingConfig);
    this.privacyFilter = new PrivacyFilter();

    this.log('Benchmark suite initialized');
  }

  async teardown(): Promise<void> {
    await this.storage.close();
    await fs.rm(this.testDir, { recursive: true, force: true });
    this.log('Benchmark suite cleaned up');
  }

  async run(): Promise<BenchmarkReport> {
    this.log('Starting benchmark suite...\n');

    // Run all benchmarks
    await this.benchmarkStorageWrite();
    await this.benchmarkStorageRead();
    await this.benchmarkCacheEfficiency();
    await this.benchmarkSessionManager();
    await this.benchmarkPrivacyFilter();
    await this.benchmarkScalability();

    // Generate report
    return this.generateReport();
  }

  private async benchmarkStorageWrite(): Promise<void> {
    this.log('Benchmarking Storage Write Performance...');

    const session = await this.sessionManager.startSession();

    // Warmup
    for (let i = 0; i < this.config.warmupIterations; i++) {
      const msg = this.generateMessage(session.id, 'user', 1000);
      await this.storage.saveMessage(msg);
    }

    // Single message write
    for (let i = 0; i < this.config.measurementIterations; i++) {
      const msg = this.generateMessage(session.id, 'user', 1000);
      const start = performance.now();
      await this.storage.saveMessage(msg);
      this.analyzer.record('storage_write_single', performance.now() - start);
    }

    // Different message sizes
    for (const size of this.config.messageSizes) {
      for (let i = 0; i < 50; i++) {
        const msg = this.generateMessage(session.id, 'user', size);
        const start = performance.now();
        await this.storage.saveMessage(msg);
        this.analyzer.record(`storage_write_${size}bytes`, performance.now() - start);
      }
    }

    this.log('  ✓ Storage write benchmarks completed');
  }

  private async benchmarkStorageRead(): Promise<void> {
    this.log('Benchmarking Storage Read Performance...');

    const session = await this.sessionManager.startSession();
    const messages: ConversationMessage[] = [];

    // Create test messages
    for (let i = 0; i < 100; i++) {
      const msg = this.generateMessage(session.id, 'user', 1000);
      await this.storage.saveMessage(msg);
      messages.push(msg);
    }

    // Wait for index flush
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Cache hit performance
    for (let i = 0; i < this.config.measurementIterations; i++) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const start = performance.now();
      await this.storage.getMessage(msg.id);
      this.analyzer.record('storage_read_cache_hit', performance.now() - start);
    }

    this.log('  ✓ Storage read benchmarks completed');
  }

  private async benchmarkCacheEfficiency(): Promise<void> {
    this.log('Benchmarking Cache Efficiency...');

    const session = await this.sessionManager.startSession();
    const messages: ConversationMessage[] = [];

    // Create messages
    for (let i = 0; i < 200; i++) {
      const msg = this.generateMessage(session.id, 'user', 1000);
      await this.storage.saveMessage(msg);
      messages.push(msg);
    }

    // Test cache hit rate
    let cacheHits = 0;
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const start = performance.now();
      await this.storage.getMessage(msg.id);
      const duration = performance.now() - start;

      if (duration < 5) cacheHits++;
      this.analyzer.record('cache_access_time', duration);
    }

    const hitRate = (cacheHits / iterations) * 100;
    this.analyzer.record('cache_hit_rate_percent', hitRate);

    this.log(`  ✓ Cache efficiency benchmarks completed (Hit Rate: ${hitRate.toFixed(2)}%)`);
  }

  private async benchmarkSessionManager(): Promise<void> {
    this.log('Benchmarking Session Manager Performance...');

    // Session creation
    for (let i = 0; i < this.config.measurementIterations; i++) {
      const start = performance.now();
      await this.sessionManager.startSession();
      this.analyzer.record('session_create', performance.now() - start);
    }

    // Session update
    const session = await this.sessionManager.startSession();
    for (let i = 0; i < this.config.measurementIterations; i++) {
      const msg = this.generateMessage(session.id, 'user', 1000);
      const start = performance.now();
      await this.sessionManager.updateSessionWithMessage(session.id, msg);
      this.analyzer.record('session_update', performance.now() - start);
    }

    this.log('  ✓ Session manager benchmarks completed');
  }

  private async benchmarkPrivacyFilter(): Promise<void> {
    this.log('Benchmarking Privacy Filter Performance...');

    // Standard filter
    for (let i = 0; i < this.config.measurementIterations; i++) {
      const msg = this.generateMessage('test', 'user', 1000);
      const start = performance.now();
      await this.privacyFilter.filterMessage(msg);
      this.analyzer.record('privacy_filter_standard', performance.now() - start);
    }

    // With sensitive content
    for (let i = 0; i < 50; i++) {
      const msg = this.generateSensitiveMessage('test');
      const start = performance.now();
      await this.privacyFilter.filterMessage(msg);
      this.analyzer.record('privacy_filter_sensitive', performance.now() - start);
    }

    this.log('  ✓ Privacy filter benchmarks completed');
  }

  private async benchmarkScalability(): Promise<void> {
    this.log('Benchmarking Scalability...');

    for (const concurrency of this.config.concurrencyLevels) {
      const start = performance.now();

      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          const session = await this.sessionManager.startSession();
          const messages = Array.from({ length: 10 }, () =>
            this.generateMessage(session.id, 'user', 1000)
          );
          for (const msg of messages) {
            await this.storage.saveMessage(msg);
          }
        })
      );

      const duration = performance.now() - start;
      this.analyzer.record(`scalability_${concurrency}_concurrent`, duration / (concurrency * 10));
    }

    this.log('  ✓ Scalability benchmarks completed');
  }

  private generateReport(): BenchmarkReport {
    const results: BenchmarkResult[] = [];
    const metrics = this.analyzer.getAllMetrics();

    // Performance targets
    const targets: Record<string, number> = {
      'storage_write_single': 10,
      'storage_read_cache_hit': 5,
      'session_create': 50,
      'session_update': 20,
      'privacy_filter_standard': 5,
      'cache_hit_rate_percent': 80
    };

    for (const metric of metrics) {
      const result = this.analyzer.analyze(metric);
      if (result) {
        result.target = targets[metric];
        if (result.target) {
          if (metric === 'cache_hit_rate_percent') {
            result.passed = result.value >= result.target;
          } else {
            result.passed = result.value <= result.target;
          }
        }
        results.push(result);
      }
    }

    const passed = results.filter(r => r.passed === true).length;
    const failed = results.filter(r => r.passed === false).length;

    return {
      timestamp: new Date(),
      version: '0.2.0',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cpus: require('os').cpus().length,
        memory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) // GB
      },
      results,
      summary: {
        totalTests: results.length,
        passed,
        failed,
        performanceScore: passed / (passed + failed) * 100
      }
    };
  }

  private generateMessage(sessionId: string, role: 'user' | 'assistant', size: number): ConversationMessage {
    const content = 'x'.repeat(size);
    return {
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
      role,
      content,
      metadata: { source: 'benchmark' }
    };
  }

  private generateSensitiveMessage(sessionId: string): ConversationMessage {
    return {
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
      role: 'user',
      content: 'My email is test@example.com and password is secret123',
      metadata: { source: 'benchmark' }
    };
  }

  private log(message: string): void {
    if (this.config.enableDetailedLogging) {
      console.log(message);
    }
  }
}

// ============================================================================
// Report Formatter
// ============================================================================

class ReportFormatter {
  static toMarkdown(report: BenchmarkReport): string {
    let md = `# Performance Benchmark Report\n\n`;
    md += `**Generated**: ${report.timestamp.toISOString()}\n`;
    md += `**Version**: ${report.version}\n\n`;

    md += `## Environment\n\n`;
    md += `- Node: ${report.environment.nodeVersion}\n`;
    md += `- Platform: ${report.environment.platform}\n`;
    md += `- CPUs: ${report.environment.cpus}\n`;
    md += `- Memory: ${report.environment.memory} GB\n\n`;

    md += `## Summary\n\n`;
    md += `- Total Tests: ${report.summary.totalTests}\n`;
    md += `- Passed: ${report.summary.passed}\n`;
    md += `- Failed: ${report.summary.failed}\n`;
    md += `- Performance Score: ${report.summary.performanceScore.toFixed(2)}%\n\n`;

    md += `## Detailed Results\n\n`;
    md += `| Metric | Avg | P50 | P95 | P99 | Target | Status |\n`;
    md += `|--------|-----|-----|-----|-----|--------|--------|\n`;

    for (const result of report.results) {
      const status = result.passed === true ? '✅ PASS' :
                     result.passed === false ? '❌ FAIL' : '-';
      const target = result.target ? `${result.target}${result.unit}` : '-';

      md += `| ${result.name} | `;
      md += `${result.value.toFixed(2)}${result.unit} | `;
      md += `${result.percentiles.p50.toFixed(2)}${result.unit} | `;
      md += `${result.percentiles.p95.toFixed(2)}${result.unit} | `;
      md += `${result.percentiles.p99.toFixed(2)}${result.unit} | `;
      md += `${target} | ${status} |\n`;
    }

    return md;
  }

  static toJSON(report: BenchmarkReport): string {
    return JSON.stringify(report, null, 2);
  }

  static toConsole(report: BenchmarkReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(80) + '\n');

    console.log('Summary:');
    console.log(`  Performance Score: ${report.summary.performanceScore.toFixed(2)}%`);
    console.log(`  Tests Passed: ${report.summary.passed}/${report.summary.totalTests}\n`);

    console.log('Key Metrics:');
    for (const result of report.results.filter(r => r.target !== undefined)) {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${result.name}: ${result.value.toFixed(2)}${result.unit} (target: ${result.target}${result.unit})`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const suite = new BenchmarkSuite({
    enableDetailedLogging: true,
    measurementIterations: 100
  });

  try {
    await suite.setup();
    const report = await suite.run();

    // Output to console
    ReportFormatter.toConsole(report);

    // Save reports
    const reportsDir = path.join(__dirname, '../../performance-reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const mdPath = path.join(reportsDir, `benchmark-${timestamp}.md`);
    const jsonPath = path.join(reportsDir, `benchmark-${timestamp}.json`);

    await fs.writeFile(mdPath, ReportFormatter.toMarkdown(report));
    await fs.writeFile(jsonPath, ReportFormatter.toJSON(report));

    console.log(`Reports saved:`);
    console.log(`  Markdown: ${mdPath}`);
    console.log(`  JSON: ${jsonPath}\n`);

    await suite.teardown();

    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Benchmark failed:', error);
    await suite.teardown();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { BenchmarkSuite, BenchmarkReport, ReportFormatter };

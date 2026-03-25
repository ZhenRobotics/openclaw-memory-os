# Performance Testing Guide

Quick start guide for running performance benchmarks on openclaw-memory-os v0.2.0 Phase 1.

## Quick Start

### Option 1: Jest-Based Performance Tests

Run comprehensive test suite with detailed output:

```bash
npm test -- test/performance/conversation-performance.test.ts --verbose
```

Or use the convenience script:

```bash
./scripts/run-performance-tests.sh
```

### Option 2: Standalone Benchmark Runner

Run standalone benchmarks (no Jest dependency):

```bash
./scripts/benchmark-standalone.sh
```

Or directly:

```bash
npx tsx test/performance/benchmark-runner.ts
```

## What Gets Tested

### Storage Performance
- Single message write (target: <10ms)
- Batch writes (10, 100, 1000 messages)
- Concurrent writes (10 parallel sessions)
- Cache hit/miss read performance
- Session history retrieval

### Cache Efficiency
- LRU cache hit rate (target: >80%)
- Cache eviction performance
- Memory usage under load

### Session Manager
- Session creation (target: <50ms)
- Session updates (target: <20ms)
- Concurrent session management
- Timeout check overhead

### Privacy Filter
- Standard filtering (8 rules, target: <5ms)
- Sensitive content redaction
- Large message handling (10KB)
- High rule count (50 rules)
- Batch filtering

## Performance Targets

| Metric | Target | Priority |
|--------|--------|----------|
| Write Performance | < 10ms | Critical |
| Read Performance (cache hit) | < 5ms | Critical |
| Read Performance (cache miss) | < 20ms | High |
| Cache Hit Rate | > 80% | High |
| Session Creation | < 50ms | Medium |
| Privacy Filter | < 5ms | High |

## Understanding Results

### Console Output

```
Storage Write Performance
  ✓ Single message write: 4.23ms (target: 10ms) [PASS]
  ✓ Batch write (100): 8.45ms per message (target: 15ms) [PASS]

Performance Score: 95.2% (20/21 tests passed)
```

- **Green checkmark (✓)**: Test passed
- **PASS**: Meets performance target
- **FAIL**: Below performance target (needs optimization)

### Generated Reports

Reports are saved to `performance-reports/` with timestamp:

- **Markdown**: `benchmark-{timestamp}.md` - Human-readable report
- **JSON**: `benchmark-{timestamp}.json` - Machine-readable data

### Key Metrics Explained

- **Avg**: Average duration across all measurements
- **P50**: Median (50th percentile)
- **P95**: 95th percentile (95% of operations faster than this)
- **P99**: 99th percentile (outlier detection)
- **Throughput**: Operations per second

## Interpreting Performance Issues

### Write Performance Issues

**Symptom**: Write latency > 10ms average

**Possible Causes**:
- Disk I/O bottleneck
- Index update overhead
- Synchronous file operations

**Recommendations**:
- Check disk write speed
- Verify async write queue is working
- Review index batching configuration

### Read Performance Issues

**Symptom**: Cache hit reads > 5ms

**Possible Causes**:
- Cache size too small
- Memory pressure
- Object serialization overhead

**Recommendations**:
- Increase cache size (max parameter)
- Monitor memory usage
- Profile object access patterns

### Cache Hit Rate Issues

**Symptom**: Hit rate < 80%

**Possible Causes**:
- Cache size too small for workload
- Access pattern not LRU-friendly
- Cache eviction too aggressive

**Recommendations**:
- Increase cache max size
- Analyze access patterns
- Consider two-tier caching

### Privacy Filter Issues

**Symptom**: Filter latency > 5ms

**Possible Causes**:
- Too many rules
- Complex regex patterns
- Large message content

**Recommendations**:
- Optimize regex patterns
- Implement rule prioritization
- Consider parallel rule evaluation

## Customizing Benchmarks

### Modify Test Parameters

Edit `test/performance/benchmark-runner.ts`:

```typescript
const config = {
  warmupIterations: 20,        // Increase for stable results
  measurementIterations: 200,  // More iterations = better statistics
  messageSizes: [100, 1000, 10000], // Test different sizes
  concurrencyLevels: [1, 10, 50]     // Test different loads
};
```

### Run Specific Test Suites

```bash
# Only storage tests
npm test -- test/performance/conversation-performance.test.ts -t "Storage"

# Only cache tests
npm test -- test/performance/conversation-performance.test.ts -t "Cache"

# Only session manager tests
npm test -- test/performance/conversation-performance.test.ts -t "Session Manager"

# Only privacy filter tests
npm test -- test/performance/conversation-performance.test.ts -t "Privacy Filter"
```

## Continuous Performance Monitoring

### Establish Baseline

```bash
# Run initial benchmark
./scripts/benchmark-standalone.sh

# Save baseline
cp performance-reports/benchmark-latest.json performance-reports/baseline.json
```

### Compare Against Baseline

```bash
# Run new benchmark
./scripts/benchmark-standalone.sh

# Manual comparison (for now)
diff performance-reports/baseline.json performance-reports/benchmark-latest.json
```

### Automated Regression Detection (Future)

```bash
# Will be implemented
npm run perf:regression
```

## Troubleshooting

### Tests Timeout

**Issue**: Tests fail with timeout error

**Solution**:
```bash
# Increase Jest timeout
npm test -- --testTimeout=120000
```

### Out of Memory

**Issue**: Node.js runs out of memory during tests

**Solution**:
```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

### Inconsistent Results

**Issue**: Performance varies significantly between runs

**Possible Causes**:
- Background processes
- Disk cache effects
- JIT compilation variations

**Solutions**:
- Close unnecessary applications
- Run multiple times and average
- Increase warmup iterations

### Test Data Cleanup

**Issue**: Test data accumulates over time

**Solution**:
```bash
# Tests auto-cleanup, but if needed:
rm -rf .test-data/
```

## Performance Optimization Workflow

1. **Run Baseline Tests**
   ```bash
   ./scripts/benchmark-standalone.sh
   ```

2. **Identify Bottlenecks**
   - Review performance reports
   - Check metrics against targets
   - Analyze P95/P99 for outliers

3. **Implement Optimizations**
   - Make targeted code changes
   - Document optimization rationale

4. **Validate Improvements**
   ```bash
   ./scripts/benchmark-standalone.sh
   ```

5. **Compare Results**
   - Verify performance improvement
   - Ensure no regressions elsewhere
   - Update documentation

6. **Commit with Performance Data**
   ```bash
   git add .
   git commit -m "perf: optimize message write performance

   - Improved batch write latency from 12ms to 8ms
   - Maintained cache hit rate at 87%
   - Benchmark results: performance-reports/benchmark-{timestamp}.json"
   ```

## CI/CD Integration (Future)

### GitHub Actions Example

```yaml
name: Performance Benchmarks

on:
  pull_request:
    paths:
      - 'src/conversation/**'

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run benchmarks
        run: ./scripts/benchmark-standalone.sh
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: performance-report
          path: performance-reports/
```

## Additional Resources

- **Full Report**: `PERFORMANCE_BENCHMARK_REPORT.md`
- **Test Suite**: `test/performance/conversation-performance.test.ts`
- **Benchmark Runner**: `test/performance/benchmark-runner.ts`
- **Architecture**: `ARCHITECTURE.md` (performance design decisions)

## Support

For performance issues or questions:
1. Check `PERFORMANCE_BENCHMARK_REPORT.md` for detailed analysis
2. Review test results in `performance-reports/`
3. File issue with performance data attached

---

**Last Updated**: 2026-03-25
**Version**: v0.2.0-phase1

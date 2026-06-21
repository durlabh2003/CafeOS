/**
 * CafeOS Performance Benchmark Runner
 * 
 * Wraps async operations with timing instrumentation and
 * evaluates results against defined thresholds.
 */

const benchmarkResults = [];

/**
 * Runs a single benchmark test
 * @param {string} name - Name of the benchmark
 * @param {Function} fn - Async function to benchmark
 * @param {number} thresholdMs - Maximum allowed time in ms
 * @param {number} iterations - Number of times to run (default 1)
 * @returns {Object} Result with pass/fail and timing data
 */
export async function runBenchmark(name, fn, thresholdMs, iterations = 1) {
  const timings = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fn();
    } catch (err) {
      const result = {
        name,
        status: 'ERROR',
        error: err.message,
        thresholdMs,
        timestamp: new Date().toISOString()
      };
      benchmarkResults.push(result);
      console.error(`❌ BENCHMARK ERROR [${name}]:`, err.message);
      return result;
    }
    const elapsed = performance.now() - start;
    timings.push(elapsed);
  }

  timings.sort((a, b) => a - b);
  const p50 = timings[Math.floor(timings.length * 0.5)];
  const p95 = timings[Math.floor(timings.length * 0.95)];
  const avg = timings.reduce((s, t) => s + t, 0) / timings.length;
  const max = timings[timings.length - 1];
  const min = timings[0];

  const passed = p95 <= thresholdMs;

  const result = {
    name,
    status: passed ? 'PASS' : 'FAIL',
    thresholdMs,
    iterations,
    timings: {
      min: Math.round(min * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      max: Math.round(max * 100) / 100
    },
    timestamp: new Date().toISOString()
  };

  benchmarkResults.push(result);

  const icon = passed ? '✅' : '❌';
  console.log(
    `${icon} BENCHMARK [${name}]: ${result.timings.p95}ms (P95) vs ${thresholdMs}ms threshold — ${result.status}`
  );

  return result;
}

/**
 * Runs a data integrity check
 * @param {string} name - Name of the check
 * @param {Function} checkFn - Function that returns true/false
 * @returns {Object} Result with pass/fail
 */
export async function runIntegrityCheck(name, checkFn) {
  let passed = false;
  let error = null;

  try {
    passed = await checkFn();
  } catch (err) {
    error = err.message;
  }

  const result = {
    name,
    status: passed ? 'PASS' : 'FAIL',
    type: 'integrity',
    error,
    timestamp: new Date().toISOString()
  };

  benchmarkResults.push(result);

  const icon = passed ? '✅' : '❌';
  console.log(`${icon} INTEGRITY [${name}]: ${result.status}`);

  return result;
}

/**
 * Gets all benchmark results collected so far
 * @returns {Array} Array of benchmark result objects
 */
export function getBenchmarkResults() {
  return [...benchmarkResults];
}

/**
 * Generates a summary report of all benchmarks
 * @returns {Object} Summary with pass/fail counts and details
 */
export function generateReport() {
  const passed = benchmarkResults.filter(r => r.status === 'PASS').length;
  const failed = benchmarkResults.filter(r => r.status === 'FAIL').length;
  const errors = benchmarkResults.filter(r => r.status === 'ERROR').length;

  const report = {
    summary: {
      total: benchmarkResults.length,
      passed,
      failed,
      errors,
      allPassed: failed === 0 && errors === 0,
      generatedAt: new Date().toISOString()
    },
    results: benchmarkResults
  };

  console.log('\n' + '═'.repeat(60));
  console.log('  CAFEOS PERFORMANCE BENCHMARK REPORT');
  console.log('═'.repeat(60));
  console.log(`  Total: ${report.summary.total} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️ Errors: ${errors}`);
  console.log(`  All Passed: ${report.summary.allPassed ? '✅ YES' : '❌ NO'}`);
  console.log('═'.repeat(60) + '\n');

  return report;
}

/**
 * Clears all stored benchmark results
 */
export function clearResults() {
  benchmarkResults.length = 0;
}

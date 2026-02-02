/**
 * Canvas Performance Benchmark
 *
 * Run these benchmarks to measure performance before and after optimizations.
 *
 * Usage (in browser console):
 *   PerformanceMetrics.enable()
 *   // ... interact with canvas for 1 minute ...
 *   PerformanceMetrics.logReport()
 *
 * Or run:
 *   CanvasBenchmark.runAll()
 */

import { PerformanceMetrics } from './PerformanceMetrics';

export const CanvasBenchmark = {
    /**
     * Measure initial page load and first render
     */
    measureInitialRender(): void {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (entries.length > 0) {
            const nav = entries[0];
            console.log('📊 Initial Load Metrics:');
            console.log(`  DOM Content Loaded: ${Math.round(nav.domContentLoadedEventEnd - nav.startTime)}ms`);
            console.log(`  Load Complete: ${Math.round(nav.loadEventEnd - nav.startTime)}ms`);
            console.log(`  DOM Interactive: ${Math.round(nav.domInteractive - nav.startTime)}ms`);
        }
    },

    /**
     * Measure current SCU (shouldComponentUpdate) hit rate
     */
    getSCUStats(): { hitRate: number; hits: number; misses: number } {
        const report = PerformanceMetrics.report();
        const hits = report.renderCounts['SCU_false'] || 0;
        const misses = report.renderCounts['SCU_true'] || 0;
        const total = hits + misses;
        const hitRate = total > 0 ? (hits / total * 100) : 0;

        return { hitRate, hits, misses };
    },

    /**
     * Print SCU statistics with interpretation
     */
    printSCUStats(): void {
        const stats = this.getSCUStats();
        console.log('\n📈 SCU (shouldComponentUpdate) Statistics:');
        console.log(`  Cache Hits (skipped re-renders): ${stats.hits}`);
        console.log(`  Cache Misses (triggered re-renders): ${stats.misses}`);
        console.log(`  Hit Rate: ${stats.hitRate.toFixed(1)}%`);

        if (stats.hitRate > 70) {
            console.log('  ✅ Good! High cache hit rate means fewer unnecessary renders.');
        } else if (stats.hitRate > 40) {
            console.log('  ⚠️ Moderate. There\'s room for improvement.');
        } else {
            console.log('  ❌ Low hit rate. Many components are re-rendering unnecessarily.');
        }
    },

    /**
     * Run interactive benchmark instructions
     */
    startInteractiveBenchmark(): void {
        console.log('\n🚀 Starting Interactive Benchmark');
        console.log('================================');
        console.log('1. PerformanceMetrics is now ENABLED');
        console.log('2. Interact with the canvas for 1-2 minutes:');
        console.log('   - Create/delete classes');
        console.log('   - Drag elements around');
        console.log('   - Select/deselect elements');
        console.log('   - Zoom in/out');
        console.log('3. When done, run: CanvasBenchmark.endBenchmark()');
        console.log('================================\n');

        PerformanceMetrics.reset();
        PerformanceMetrics.enable();
    },

    /**
     * End benchmark and show results
     */
    endBenchmark(): void {
        console.log('\n================================');
        console.log('📊 BENCHMARK RESULTS');
        console.log('================================\n');

        this.measureInitialRender();
        this.printSCUStats();

        console.log('\n⏱️ Timing Details:');
        PerformanceMetrics.logReport();

        PerformanceMetrics.disable();
    },

    /**
     * Quick status check
     */
    status(): void {
        console.log(`\nPerformanceMetrics: ${PerformanceMetrics.isEnabled() ? 'ENABLED' : 'DISABLED'}`);
        if (PerformanceMetrics.isEnabled()) {
            const stats = this.getSCUStats();
            console.log(`SCU: ${stats.hits} hits, ${stats.misses} misses (${stats.hitRate.toFixed(1)}% hit rate)`);
        }
    },

    /**
     * Instructions for comparing before/after
     */
    compareInstructions(): void {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║              PERFORMANCE COMPARISON GUIDE                       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  BEFORE optimization (baseline):                                ║
║  1. Comment out UDComparator import in graphElement.tsx         ║
║  2. Revert to U.isShallowEqualWithProxies                      ║
║  3. CanvasBenchmark.startInteractiveBenchmark()                ║
║  4. Interact for 2 minutes                                      ║
║  5. CanvasBenchmark.endBenchmark()                             ║
║  6. Save results (screenshot or note down)                      ║
║                                                                 ║
║  AFTER optimization:                                            ║
║  1. Ensure UDComparator is active                              ║
║  2. CanvasBenchmark.startInteractiveBenchmark()                ║
║  3. Same interactions for 2 minutes                            ║
║  4. CanvasBenchmark.endBenchmark()                             ║
║  5. Compare results                                             ║
║                                                                 ║
║  KEY METRICS TO COMPARE:                                        ║
║  • SCU Hit Rate: Higher is better (target: >70%)               ║
║  • UDComparator timing: Should be < 1ms per operation          ║
║  • Overall render count: Lower is better                        ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
        `);
    },
};

// Expose to window for browser console
if (typeof window !== 'undefined') {
    (window as any).CanvasBenchmark = CanvasBenchmark;
}

export default CanvasBenchmark;

/**
 * Performance Metrics Utility
 * Measures canvas performance before and after optimizations
 */

type TimingCallback = () => void;

interface TimingStats {
    count: number;
    total: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
}

interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
}

interface PerformanceReport {
    timestamp: string;
    timings: Record<string, TimingStats>;
    renderCounts: Record<string, number>;
    memory: MemoryInfo | null;
}

class PerformanceMetricsClass {
    private metrics: Map<string, number[]> = new Map();
    private renderCounts: Map<string, number> = new Map();
    private enabled = false; // Disabled by default, enable for benchmarking

    enable(): void {
        this.enabled = true;
        console.log('[PerformanceMetrics] Enabled');
    }

    disable(): void {
        this.enabled = false;
        console.log('[PerformanceMetrics] Disabled');
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Measure execution time of a synchronous function
     */
    measure<T>(label: string, fn: () => T): T {
        if (!this.enabled) return fn();

        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;

        this.recordTiming(label, duration);
        return result;
    }

    /**
     * Measure execution time of an async function
     */
    async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
        if (!this.enabled) return fn();

        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;

        this.recordTiming(label, duration);
        return result;
    }

    /**
     * Start a timer, returns function to stop it
     */
    startTimer(label: string): () => number {
        if (!this.enabled) return () => 0;

        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.recordTiming(label, duration);
            return duration;
        };
    }

    /**
     * Record a timing value directly
     */
    recordTiming(label: string, duration: number): void {
        if (!this.enabled) return;

        if (!this.metrics.has(label)) {
            this.metrics.set(label, []);
        }
        this.metrics.get(label)!.push(duration);
    }

    /**
     * Count a render for a component
     */
    countRender(componentName: string): void {
        if (!this.enabled) return;
        const count = this.renderCounts.get(componentName) || 0;
        this.renderCounts.set(componentName, count + 1);
    }

    /**
     * Count shouldComponentUpdate result
     */
    countSCU(result: boolean): void {
        if (!this.enabled) return;
        const key = result ? 'SCU_true' : 'SCU_false';
        const count = this.renderCounts.get(key) || 0;
        this.renderCounts.set(key, count + 1);
    }

    /**
     * Get full performance report
     */
    report(): PerformanceReport {
        const report: PerformanceReport = {
            timestamp: new Date().toISOString(),
            timings: {},
            renderCounts: Object.fromEntries(this.renderCounts),
            memory: this.getMemoryUsage(),
        };

        this.metrics.forEach((values, label) => {
            if (values.length === 0) return;
            report.timings[label] = {
                count: values.length,
                total: values.reduce((a, b) => a + b, 0),
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                p95: this.percentile(values, 95),
            };
        });

        return report;
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.metrics.clear();
        this.renderCounts.clear();
        console.log('[PerformanceMetrics] Reset');
    }

    /**
     * Log report to console with formatting
     */
    logReport(): void {
        const report = this.report();
        console.group('📊 Performance Report');
        console.log('Timestamp:', report.timestamp);
        if (report.memory) {
            console.log(`Memory: ${report.memory.usedJSHeapSize}MB / ${report.memory.totalJSHeapSize}MB`);
        }

        if (Object.keys(report.timings).length > 0) {
            console.log('\n⏱️ Timings:');
            console.table(report.timings);
        }

        if (Object.keys(report.renderCounts).length > 0) {
            console.log('\n🔄 Render counts:');
            console.table(report.renderCounts);

            // Calculate SCU hit rate
            const scuTrue = report.renderCounts['SCU_true'] || 0;
            const scuFalse = report.renderCounts['SCU_false'] || 0;
            if (scuTrue + scuFalse > 0) {
                const hitRate = (scuFalse / (scuTrue + scuFalse) * 100).toFixed(1);
                console.log(`\n📈 SCU Cache Hit Rate: ${hitRate}% (higher is better)`);
            }
        }

        console.groupEnd();
    }

    /**
     * Get SCU hit rate
     */
    getSCUHitRate(): number {
        const scuTrue = this.renderCounts.get('SCU_true') || 0;
        const scuFalse = this.renderCounts.get('SCU_false') || 0;
        if (scuTrue + scuFalse === 0) return 0;
        return scuFalse / (scuTrue + scuFalse) * 100;
    }

    private percentile(arr: number[], p: number): number {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, idx)] || 0;
    }

    private getMemoryUsage(): MemoryInfo | null {
        if ('memory' in performance) {
            const mem = (performance as any).memory;
            return {
                usedJSHeapSize: Math.round(mem.usedJSHeapSize / 1024 / 1024),
                totalJSHeapSize: Math.round(mem.totalJSHeapSize / 1024 / 1024),
            };
        }
        return null;
    }
}

export const PerformanceMetrics = new PerformanceMetricsClass();

// Expose globally for debugging
(window as any).PerformanceMetrics = PerformanceMetrics;

export default PerformanceMetrics;

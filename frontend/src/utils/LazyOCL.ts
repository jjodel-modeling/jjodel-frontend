/**
 * Lazy OCL Evaluation Utility
 *
 * Optimizes OCL constraint evaluation by:
 * 1. Caching results based on data version (clonedCounter)
 * 2. Skipping re-evaluation when data hasn't changed
 * 3. Tracking evaluation statistics for debugging
 *
 * OCL evaluation is computationally expensive, so caching is critical.
 */

import { PerformanceMetrics } from './PerformanceMetrics';

type Pointer = string;
type CacheKey = string;

interface OCLCacheEntry {
    result: boolean | symbol;
    dataVersion: number;  // clonedCounter from data
    viewVersion: number;  // version from view (for oclCondition changes)
    timestamp: number;
    evalCount: number;
}

interface OCLStats {
    cacheHits: number;
    cacheMisses: number;
    evaluations: number;
    skippedEvaluations: number;
}

// Cache for OCL results: key = `${dataId}_${viewId}`
const oclCache = new Map<CacheKey, OCLCacheEntry>();

// Statistics
const stats: OCLStats = {
    cacheHits: 0,
    cacheMisses: 0,
    evaluations: 0,
    skippedEvaluations: 0
};

// Maximum cache size to prevent memory issues
const MAX_CACHE_SIZE = 5000;

// Cache entry TTL (time-to-live) in milliseconds
// Use a shorter TTL (2 seconds) since we're not tracking data changes precisely
// This ensures cache hits within render cycles while still refreshing periodically
const CACHE_TTL = 2 * 1000;

/**
 * Generate a cache key from data and view pointers
 */
function getCacheKey(dataId: Pointer, viewId: Pointer): CacheKey {
    return `${dataId}_${viewId}`;
}

/**
 * Get data version from a data object
 * NOTE: We use className instead of clonedCounter because clonedCounter
 * increments on every Redux update, causing 0% cache hit rate.
 * For OCL view matching, what matters is the element's type/structure,
 * not whether Redux cloned it. We rely on TTL for eventual invalidation.
 */
function getDataVersion(data: any): number {
    if (!data) return 0;
    const raw = data.__raw || data;
    // Use a stable version based on className hash instead of clonedCounter
    // This ensures cache hits when the element type hasn't changed
    const className = raw?.className || '';
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
        hash = ((hash << 5) - hash) + className.charCodeAt(i);
        hash = hash & hash;
    }
    return hash;
}

/**
 * Get view version - hash of oclCondition to detect changes
 */
function getViewOCLVersion(view: any): number {
    if (!view) return 0;
    const raw = view.__raw || view;
    const oclCondition = raw?.oclCondition || '';
    // Simple hash of oclCondition string
    let hash = 0;
    for (let i = 0; i < oclCondition.length; i++) {
        const char = oclCondition.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}

/**
 * Check if we have a valid cached OCL result
 */
export function getCachedOCLResult(
    dataId: Pointer,
    viewId: Pointer,
    dataVersion: number,
    viewVersion: number
): OCLCacheEntry | null {
    const key = getCacheKey(dataId, viewId);
    const entry = oclCache.get(key);

    if (!entry) {
        stats.cacheMisses++;
        return null;
    }

    // Check if cache entry is still valid
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > CACHE_TTL;
    // Only check viewVersion (OCL condition) - dataVersion changes too frequently
    // We rely on TTL for data changes instead
    const isViewMatch = entry.viewVersion === viewVersion;

    if (isExpired || !isViewMatch) {
        stats.cacheMisses++;
        return null;
    }

    stats.cacheHits++;
    PerformanceMetrics.countRender('OCL_cache_hit');
    return entry;
}

/**
 * Store OCL result in cache
 */
export function cacheOCLResult(
    dataId: Pointer,
    viewId: Pointer,
    result: boolean | symbol,
    dataVersion: number,
    viewVersion: number
): void {
    // Prevent cache from growing too large
    if (oclCache.size >= MAX_CACHE_SIZE) {
        pruneCache();
    }

    const key = getCacheKey(dataId, viewId);
    const existingEntry = oclCache.get(key);

    oclCache.set(key, {
        result,
        dataVersion,
        viewVersion,
        timestamp: Date.now(),
        evalCount: (existingEntry?.evalCount || 0) + 1
    });

    stats.evaluations++;
    PerformanceMetrics.countRender('OCL_evaluated');
}

/**
 * Remove old entries from cache
 */
function pruneCache(): void {
    const now = Date.now();
    let pruned = 0;

    // First pass: remove expired entries
    for (const [key, entry] of oclCache.entries()) {
        if ((now - entry.timestamp) > CACHE_TTL) {
            oclCache.delete(key);
            pruned++;
        }
    }

    // If still too large, remove oldest entries
    if (oclCache.size >= MAX_CACHE_SIZE * 0.9) {
        const entries = Array.from(oclCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = Math.floor(entries.length * 0.3);
        for (let i = 0; i < toRemove; i++) {
            oclCache.delete(entries[i][0]);
            pruned++;
        }
    }

    if (PerformanceMetrics.isEnabled()) {
        // console.log(`[LazyOCL] Pruned ${pruned} entries, cache size: ${oclCache.size}`);
    }
}

/**
 * Wrapper for lazy OCL evaluation
 * Returns cached result if available, otherwise calls the evaluator
 *
 * @param data The model element to evaluate
 * @param view The view element with OCL condition
 * @param evaluator Function that performs actual OCL evaluation
 * @returns OCL evaluation result (cached or freshly computed)
 */
export function lazyEvaluateOCL<T>(
    data: any,
    view: any,
    evaluator: () => T
): T {
    // If no OCL condition, return true (no constraint)
    const viewRaw = view?.__raw || view;
    if (!viewRaw?.oclCondition) {
        stats.skippedEvaluations++;
        PerformanceMetrics.countRender('OCL_skipped_no_condition');
        return true as T;
    }

    const dataRaw = data?.__raw || data;
    if (!dataRaw?.id) {
        // No valid data, evaluate directly
        return evaluator();
    }

    const dataId = dataRaw.id;
    const viewId = viewRaw.id;
    const dataVersion = getDataVersion(data);
    const viewVersion = getViewOCLVersion(view);

    // Check cache
    const cached = getCachedOCLResult(dataId, viewId, dataVersion, viewVersion);
    if (cached !== null) {
        return cached.result as T;
    }

    // Evaluate and cache
    const stopTimer = PerformanceMetrics.startTimer('OCL_evaluation');
    let result: T;
    try {
        result = evaluator();
    } finally {
        stopTimer();
    }

    cacheOCLResult(dataId, viewId, result as any, dataVersion, viewVersion);
    return result;
}

/**
 * Check if OCL needs re-evaluation based on data changes
 */
export function needsOCLReevaluation(
    dataId: Pointer,
    viewId: Pointer,
    currentDataVersion: number,
    currentViewVersion: number
): boolean {
    const cached = getCachedOCLResult(dataId, viewId, currentDataVersion, currentViewVersion);
    return cached === null;
}

/**
 * Clear cache for a specific data element (when it's deleted or significantly changed)
 */
export function invalidateDataCache(dataId: Pointer): void {
    let removed = 0;
    for (const key of oclCache.keys()) {
        if (key.startsWith(dataId + '_')) {
            oclCache.delete(key);
            removed++;
        }
    }
    if (PerformanceMetrics.isEnabled() && removed > 0) {
        // console.log(`[LazyOCL] Invalidated ${removed} cache entries for data ${dataId}`);
    }
}

/**
 * Clear cache for a specific view (when its OCL condition changes)
 */
export function invalidateViewCache(viewId: Pointer): void {
    let removed = 0;
    for (const key of oclCache.keys()) {
        if (key.endsWith('_' + viewId)) {
            oclCache.delete(key);
            removed++;
        }
    }
    if (PerformanceMetrics.isEnabled() && removed > 0) {
        // console.log(`[LazyOCL] Invalidated ${removed} cache entries for view ${viewId}`);
    }
}

/**
 * Clear entire OCL cache
 */
export function clearOCLCache(): void {
    const size = oclCache.size;
    oclCache.clear();
    // console.log(`[LazyOCL] Cleared cache (${size} entries)`);
}

/**
 * Get OCL evaluation statistics
 */
export function getOCLStats(): OCLStats & { cacheSize: number; hitRate: string } {
    const total = stats.cacheHits + stats.cacheMisses;
    const hitRate = total > 0 ? ((stats.cacheHits / total) * 100).toFixed(1) + '%' : 'N/A';
    return {
        ...stats,
        cacheSize: oclCache.size,
        hitRate
    };
}

/**
 * Reset statistics
 */
export function resetOCLStats(): void {
    stats.cacheHits = 0;
    stats.cacheMisses = 0;
    stats.evaluations = 0;
    stats.skippedEvaluations = 0;
}

/**
 * Print OCL statistics to console
 */
export function logOCLStats(): void {
    const s = getOCLStats();
    /* console.log(`
[LazyOCL Statistics]
  Cache Size: ${s.cacheSize} entries
  Cache Hits: ${s.cacheHits}
  Cache Misses: ${s.cacheMisses}
  Hit Rate: ${s.hitRate}
  Total Evaluations: ${s.evaluations}
  Skipped (no condition): ${s.skippedEvaluations}
`); */
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).LazyOCL = {
        lazyEvaluateOCL,
        getCachedOCLResult,
        cacheOCLResult,
        needsOCLReevaluation,
        invalidateDataCache,
        invalidateViewCache,
        clearOCLCache,
        getOCLStats,
        resetOCLStats,
        logOCLStats,
        getDataVersion,
        getViewOCLVersion
    };
}

export default {
    lazyEvaluateOCL,
    needsOCLReevaluation,
    invalidateDataCache,
    invalidateViewCache,
    clearOCLCache,
    getOCLStats,
    resetOCLStats,
    logOCLStats
};

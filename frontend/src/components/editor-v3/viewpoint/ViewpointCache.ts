/**
 * Editor V3 — ViewpointCache: LRU cache for compiled views.
 *
 * Avoids re-compilation when the same DViewElement is used on multiple nodes.
 * Key: `viewId:hash` — invalidated when JSX/CSS/constants change.
 */

import type { CompiledView } from '../types';
import { compileView } from './ViewpointCompiler';

interface CacheEntry {
    compiled: CompiledView;
    accessTime: number;
}

class ViewpointCache {
    private cache = new Map<string, CacheEntry>();
    private maxSize: number;

    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }

    /**
     * Get or compile a view. Returns the CompiledView from cache or compiles fresh.
     */
    get(viewId: string, viewElement: any): CompiledView {
        const hash = hashViewElement(viewElement);
        const cacheKey = `${viewId}:${hash}`;

        const cached = this.cache.get(cacheKey);
        if (cached) {
            cached.accessTime = Date.now();
            return cached.compiled;
        }

        // Compile
        const compiled = compileView(viewElement);
        this.cache.set(cacheKey, { compiled, accessTime: Date.now() });

        // Evict LRU if over capacity
        if (this.cache.size > this.maxSize) {
            this.evictLRU();
        }

        return compiled;
    }

    /**
     * Invalidate all cached entries for a given viewId.
     * Call this when a DViewElement is edited.
     */
    invalidate(viewId: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(viewId + ':')) {
                this.cache.delete(key);
            }
        }
    }

    /** Clear the entire cache. */
    clear(): void {
        this.cache.clear();
    }

    /** Current number of cached entries. */
    get size(): number {
        return this.cache.size;
    }

    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache) {
            if (entry.accessTime < oldestTime) {
                oldestTime = entry.accessTime;
                oldestKey = key;
            }
        }
        if (oldestKey) this.cache.delete(oldestKey);
    }
}

/** Hash a DViewElement for cache keying. */
function hashViewElement(viewElement: any): string {
    const raw = (viewElement?.jsxString || '') +
        (viewElement?.css || '') +
        (viewElement?.constants || '') +
        (viewElement?.usageDeclarations || '');
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
    }
    return hash.toString(36);
}

/** Singleton cache instance. */
export const viewpointCache = new ViewpointCache();

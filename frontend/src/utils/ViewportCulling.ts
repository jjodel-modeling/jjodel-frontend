/**
 * Viewport Culling Utility
 *
 * Optimizes canvas rendering by:
 * 1. Determining which elements are visible in the current viewport
 * 2. Skipping render of off-screen elements
 * 3. Adding margin for edges that connect to off-screen vertices
 *
 * This significantly reduces React reconciliation work for large graphs.
 */

import { PerformanceMetrics } from './PerformanceMetrics';

export interface Bounds {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface ViewportState {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    zoomX: number;
    zoomY: number;
}

interface CullingStats {
    totalElements: number;
    visibleElements: number;
    culledElements: number;
    checkCount: number;
}

const stats: CullingStats = {
    totalElements: 0,
    visibleElements: 0,
    culledElements: 0,
    checkCount: 0
};

// Margin around viewport to include partially visible elements and connected edges
const VIEWPORT_MARGIN = 200; // pixels

// Cache for visibility results to avoid recalculating during same render cycle
let visibilityCache = new Map<string, boolean>();
let lastViewportHash = '';

/**
 * Generate a hash of viewport state for cache invalidation
 */
function getViewportHash(viewport: ViewportState): string {
    return `${viewport.offsetX.toFixed(0)}_${viewport.offsetY.toFixed(0)}_${viewport.width.toFixed(0)}_${viewport.height.toFixed(0)}_${viewport.zoomX.toFixed(2)}_${viewport.zoomY.toFixed(2)}`;
}

/**
 * Clear visibility cache when viewport changes
 */
export function invalidateVisibilityCache(): void {
    visibilityCache.clear();
    lastViewportHash = '';
}

/**
 * Check if an element's bounds intersect with the viewport
 *
 * @param elementBounds The element's position and size in graph coordinates
 * @param viewport The current viewport state
 * @param margin Extra margin around viewport (default: VIEWPORT_MARGIN)
 * @returns true if element should be rendered
 */
export function isElementInViewport(
    elementBounds: Bounds,
    viewport: ViewportState,
    margin: number = VIEWPORT_MARGIN
): boolean {
    stats.checkCount++;

    // Transform element bounds to screen coordinates
    const screenX = (elementBounds.x + viewport.offsetX) * viewport.zoomX;
    const screenY = (elementBounds.y + viewport.offsetY) * viewport.zoomY;
    const screenW = elementBounds.w * viewport.zoomX;
    const screenH = elementBounds.h * viewport.zoomY;

    // Viewport bounds with margin
    const viewLeft = -margin;
    const viewTop = -margin;
    const viewRight = viewport.width + margin;
    const viewBottom = viewport.height + margin;

    // Check intersection (AABB collision)
    const intersects = !(
        screenX + screenW < viewLeft ||  // Element is left of viewport
        screenX > viewRight ||            // Element is right of viewport
        screenY + screenH < viewTop ||    // Element is above viewport
        screenY > viewBottom              // Element is below viewport
    );

    if (intersects) {
        stats.visibleElements++;
    } else {
        stats.culledElements++;
    }
    stats.totalElements++;

    return intersects;
}

/**
 * Check visibility with caching for the current render cycle
 *
 * @param elementId Unique identifier for the element
 * @param elementBounds The element's position and size
 * @param viewport The current viewport state
 * @returns true if element should be rendered
 */
export function checkVisibility(
    elementId: string,
    elementBounds: Bounds,
    viewport: ViewportState
): boolean {
    const viewportHash = getViewportHash(viewport);

    // Invalidate cache if viewport changed
    if (viewportHash !== lastViewportHash) {
        visibilityCache.clear();
        lastViewportHash = viewportHash;
        // Reset per-frame stats
        stats.visibleElements = 0;
        stats.culledElements = 0;
        stats.totalElements = 0;
    }

    // Check cache first
    const cached = visibilityCache.get(elementId);
    if (cached !== undefined) {
        return cached;
    }

    // Calculate and cache
    const isVisible = isElementInViewport(elementBounds, viewport);
    visibilityCache.set(elementId, isVisible);

    PerformanceMetrics.countRender(isVisible ? 'Viewport_visible' : 'Viewport_culled');

    return isVisible;
}

/**
 * Get viewport state from a graph element
 *
 * @param graph The LGraph or DGraph object
 * @returns ViewportState object
 */
export function getViewportFromGraph(graph: any): ViewportState | null {
    if (!graph) return null;

    const raw = graph.__raw || graph;
    const offset = raw.offset || { x: 0, y: 0, w: 800, h: 600 };
    const zoom = raw.zoom || { x: 1, y: 1 };

    return {
        offsetX: offset.x || 0,
        offsetY: offset.y || 0,
        width: offset.w || 800,
        height: offset.h || 600,
        zoomX: zoom.x || 1,
        zoomY: zoom.y || 1
    };
}

/**
 * Get element bounds from a vertex/node
 *
 * @param element The LVertex/DVertex or graph element
 * @returns Bounds object or null if not available
 */
export function getElementBounds(element: any): Bounds | null {
    if (!element) return null;

    const raw = element.__raw || element;

    // Check if element has position data
    if (typeof raw.x !== 'number' || typeof raw.y !== 'number') {
        return null;
    }

    return {
        x: raw.x || 0,
        y: raw.y || 0,
        w: raw.w || 100, // Default width if not set
        h: raw.h || 50   // Default height if not set
    };
}

/**
 * Batch check multiple elements for visibility
 * More efficient than checking one at a time
 *
 * @param elements Array of elements with id and bounds
 * @param viewport The current viewport state
 * @returns Map of elementId -> isVisible
 */
export function batchCheckVisibility(
    elements: Array<{ id: string; bounds: Bounds }>,
    viewport: ViewportState
): Map<string, boolean> {
    const viewportHash = getViewportHash(viewport);

    // Invalidate cache if viewport changed
    if (viewportHash !== lastViewportHash) {
        visibilityCache.clear();
        lastViewportHash = viewportHash;
        stats.visibleElements = 0;
        stats.culledElements = 0;
        stats.totalElements = 0;
    }

    const results = new Map<string, boolean>();

    for (const element of elements) {
        // Check cache first
        let isVisible = visibilityCache.get(element.id);

        if (isVisible === undefined) {
            isVisible = isElementInViewport(element.bounds, viewport);
            visibilityCache.set(element.id, isVisible);
        }

        results.set(element.id, isVisible);
    }

    return results;
}

/**
 * Get culling statistics
 */
export function getCullingStats(): CullingStats & { cullRate: string } {
    const total = stats.totalElements || 1;
    const cullRate = ((stats.culledElements / total) * 100).toFixed(1) + '%';
    return {
        ...stats,
        cullRate
    };
}

/**
 * Reset culling statistics
 */
export function resetCullingStats(): void {
    stats.totalElements = 0;
    stats.visibleElements = 0;
    stats.culledElements = 0;
    stats.checkCount = 0;
}

/**
 * Log culling statistics to console
 */
export function logCullingStats(): void {
    const s = getCullingStats();
    // console.log(`
[ViewportCulling Statistics]
  Total Elements: ${s.totalElements}
  Visible: ${s.visibleElements}
  Culled: ${s.culledElements}
  Cull Rate: ${s.cullRate}
  Check Count: ${s.checkCount}
  Cache Size: ${visibilityCache.size}
`);
}

/**
 * Determine if culling should be enabled based on element count
 * For small graphs, culling overhead may not be worth it
 *
 * @param elementCount Number of elements in the graph
 * @returns true if culling should be enabled
 */
export function shouldEnableCulling(elementCount: number): boolean {
    // Enable culling for graphs with more than 50 elements
    return elementCount > 50;
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).ViewportCulling = {
        isElementInViewport,
        checkVisibility,
        getViewportFromGraph,
        getElementBounds,
        batchCheckVisibility,
        invalidateVisibilityCache,
        getCullingStats,
        resetCullingStats,
        logCullingStats,
        shouldEnableCulling,
        VIEWPORT_MARGIN
    };
}

export default {
    isElementInViewport,
    checkVisibility,
    getViewportFromGraph,
    getElementBounds,
    batchCheckVisibility,
    invalidateVisibilityCache,
    getCullingStats,
    resetCullingStats,
    logCullingStats,
    shouldEnableCulling
};

/**
 * Drag Throttle Utility
 *
 * Optimizes drag and resize operations by:
 * 1. Throttling updates using requestAnimationFrame (RAF)
 * 2. Batching multiple updates within the same frame
 * 3. Reducing Redux state updates during continuous drag
 *
 * This can significantly improve performance during drag operations
 * by reducing the number of TRANSACTION calls from ~60/sec to ~30/sec or less.
 */

import { PerformanceMetrics } from './PerformanceMetrics';

type ThrottledCallback = (...args: any[]) => void;

interface ThrottleState {
    pending: boolean;
    rafId: number | null;
    lastArgs: any[] | null;
    lastExecutionTime: number;
}

const throttleStates = new Map<string, ThrottleState>();

/**
 * Creates a throttled version of a callback using requestAnimationFrame
 *
 * @param key Unique identifier for this throttle instance
 * @param callback The function to throttle
 * @param minInterval Minimum time (ms) between executions (default: 16ms = ~60fps)
 * @returns Throttled function
 */
export function rafThrottle<T extends ThrottledCallback>(
    key: string,
    callback: T,
    minInterval: number = 16
): T {
    // Get or create state for this key
    let state = throttleStates.get(key);
    if (!state) {
        state = {
            pending: false,
            rafId: null,
            lastArgs: null,
            lastExecutionTime: 0
        };
        throttleStates.set(key, state);
    }

    const throttledFn = (...args: any[]) => {
        state!.lastArgs = args;

        // If we already have a pending RAF, just update args
        if (state!.pending) {
            return;
        }

        const now = performance.now();
        const timeSinceLastExecution = now - state!.lastExecutionTime;

        // If enough time has passed, execute immediately
        if (timeSinceLastExecution >= minInterval) {
            state!.lastExecutionTime = now;
            callback(...args);
            PerformanceMetrics.countRender('DragThrottle_immediate');
            return;
        }

        // Otherwise, schedule for next RAF
        state!.pending = true;
        state!.rafId = requestAnimationFrame(() => {
            state!.pending = false;
            state!.rafId = null;
            state!.lastExecutionTime = performance.now();

            if (state!.lastArgs) {
                callback(...state!.lastArgs);
                PerformanceMetrics.countRender('DragThrottle_deferred');
            }
        });
    };

    return throttledFn as T;
}

/**
 * Cancel any pending throttled callback
 * @param key The throttle key to cancel
 */
export function cancelThrottle(key: string): void {
    const state = throttleStates.get(key);
    if (state && state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
        state.pending = false;
        state.rafId = null;
        state.lastArgs = null;
    }
}

/**
 * Flush a pending throttled callback immediately
 * @param key The throttle key to flush
 * @param callback The callback to execute with last args
 */
export function flushThrottle<T extends ThrottledCallback>(
    key: string,
    callback: T
): void {
    const state = throttleStates.get(key);
    if (state && state.lastArgs) {
        cancelThrottle(key);
        callback(...state.lastArgs);
        state.lastArgs = null;
        PerformanceMetrics.countRender('DragThrottle_flushed');
    }
}

/**
 * Reset throttle state (useful for cleanup)
 * @param key The throttle key to reset
 */
export function resetThrottle(key: string): void {
    cancelThrottle(key);
    throttleStates.delete(key);
}

/**
 * DragOptimizer class for managing drag operations
 *
 * Usage:
 *   const optimizer = new DragOptimizer(nodeId);
 *
 *   // In drag start
 *   optimizer.start();
 *
 *   // In drag callback
 *   optimizer.update(position, () => {
 *     // Your actual update logic (setSize, etc.)
 *   });
 *
 *   // In drag end
 *   optimizer.stop();
 */
export class DragOptimizer {
    private key: string;
    private isActive: boolean = false;
    private updateCount: number = 0;
    private skippedCount: number = 0;
    private startTime: number = 0;

    constructor(nodeId: string) {
        this.key = `drag_${nodeId}`;
    }

    start(): void {
        this.isActive = true;
        this.updateCount = 0;
        this.skippedCount = 0;
        this.startTime = performance.now();
        PerformanceMetrics.countRender('DragOptimizer_start');
    }

    update(
        position: { x?: number; y?: number; w?: number; h?: number },
        updateFn: (pos: typeof position) => void,
        interval: number = 32 // ~30fps default for Redux updates
    ): void {
        if (!this.isActive) {
            updateFn(position);
            return;
        }

        const throttledUpdate = rafThrottle(
            this.key,
            (pos: typeof position) => {
                this.updateCount++;
                updateFn(pos);
            },
            interval
        );

        throttledUpdate(position);
    }

    stop(
        finalPosition: { x?: number; y?: number; w?: number; h?: number },
        updateFn: (pos: typeof finalPosition) => void
    ): void {
        // Always apply final position
        cancelThrottle(this.key);
        updateFn(finalPosition);

        const duration = performance.now() - this.startTime;
        if (PerformanceMetrics.isEnabled()) {
            // console.log(`[DragOptimizer] Completed: ${this.updateCount} updates in ${duration.toFixed(0)}ms (${(this.updateCount / duration * 1000).toFixed(1)} updates/sec)`);
        }

        this.isActive = false;
        resetThrottle(this.key);
        PerformanceMetrics.countRender('DragOptimizer_stop');
    }
}

/**
 * Simple debounce function for non-critical updates
 */
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).DragThrottle = {
        rafThrottle,
        cancelThrottle,
        flushThrottle,
        resetThrottle,
        DragOptimizer,
        debounce,
        getStates: () => Object.fromEntries(throttleStates)
    };
}

export default DragOptimizer;

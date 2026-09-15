/**
 * Batched Updates Utility
 *
 * Optimizes React re-renders by:
 * 1. Using React's unstable_batchedUpdates to batch state changes
 * 2. Coalescing multiple dispatches within the same event loop tick
 * 3. Reducing the number of React reconciliation passes
 *
 * React 18 has automatic batching, but this helps with:
 * - Edge cases where batching doesn't apply
 * - Redux dispatches outside React event handlers
 * - Ensuring consistent batching behavior
 */

import { unstable_batchedUpdates } from 'react-dom';
import { PerformanceMetrics } from './PerformanceMetrics';

type DispatchFn = (action: any) => void;
type ActionQueue = any[];

interface BatchState {
    queue: ActionQueue;
    scheduled: boolean;
    batchCount: number;
    dispatchCount: number;
}

const batchState: BatchState = {
    queue: [],
    scheduled: false,
    batchCount: 0,
    dispatchCount: 0
};

// Flag to enable/disable micro-task coalescing
let microTaskCoalescingEnabled = false;

/**
 * Execute a function within React's batched updates context
 * This ensures multiple state changes result in a single re-render
 */
export function batchedUpdates<T>(fn: () => T): T {
    let result: T;
    unstable_batchedUpdates(() => {
        result = fn();
    });
    return result!;
}

/**
 * Create a batched dispatch function
 * Wraps the original dispatch to use React's batchedUpdates
 *
 * @param originalDispatch The original Redux store.dispatch function
 * @returns Wrapped dispatch function
 */
export function createBatchedDispatch(originalDispatch: DispatchFn): DispatchFn {
    return (action: any) => {
        batchState.dispatchCount++;
        PerformanceMetrics.countRender('BatchedDispatch');

        if (microTaskCoalescingEnabled) {
            // Queue the action for micro-task coalescing
            batchState.queue.push(action);

            if (!batchState.scheduled) {
                batchState.scheduled = true;
                queueMicrotask(() => flushQueue(originalDispatch));
            }
        } else {
            // Direct batched dispatch (no coalescing)
            unstable_batchedUpdates(() => {
                originalDispatch(action);
            });
        }
    };
}

/**
 * Flush all queued actions in a single batched update
 */
function flushQueue(dispatch: DispatchFn): void {
    if (batchState.queue.length === 0) {
        batchState.scheduled = false;
        return;
    }

    const actionsToDispatch = [...batchState.queue];
    batchState.queue = [];
    batchState.scheduled = false;
    batchState.batchCount++;

    PerformanceMetrics.countRender('BatchedDispatch_flush');

    if (PerformanceMetrics.isEnabled()) {
        // console.log(`[BatchedUpdates] Flushing ${actionsToDispatch.length} actions in batch #${batchState.batchCount}`);
    }

    unstable_batchedUpdates(() => {
        for (const action of actionsToDispatch) {
            dispatch(action);
        }
    });
}

/**
 * Enable micro-task based coalescing
 * When enabled, multiple dispatches in the same event loop tick are combined
 */
export function enableMicroTaskCoalescing(): void {
    microTaskCoalescingEnabled = true;
    // console.log('[BatchedUpdates] Micro-task coalescing ENABLED');
}

/**
 * Disable micro-task based coalescing
 * Each dispatch will be wrapped in batchedUpdates but executed immediately
 */
export function disableMicroTaskCoalescing(): void {
    microTaskCoalescingEnabled = false;
    // console.log('[BatchedUpdates] Micro-task coalescing DISABLED');
}

/**
 * Check if micro-task coalescing is enabled
 */
export function isMicroTaskCoalescingEnabled(): boolean {
    return microTaskCoalescingEnabled;
}

/**
 * Get batch statistics
 */
export function getBatchStats(): { batchCount: number; dispatchCount: number; queueLength: number } {
    return {
        batchCount: batchState.batchCount,
        dispatchCount: batchState.dispatchCount,
        queueLength: batchState.queue.length
    };
}

/**
 * Reset batch statistics
 */
export function resetBatchStats(): void {
    batchState.batchCount = 0;
    batchState.dispatchCount = 0;
}

/**
 * Wrapper for multiple state updates that should be batched
 * Use this when making multiple Redux dispatches that should result in one render
 *
 * @example
 * batchActions(() => {
 *   dispatch(action1);
 *   dispatch(action2);
 *   dispatch(action3);
 * });
 * // Results in single React re-render instead of 3
 */
export function batchActions(fn: () => void): void {
    PerformanceMetrics.countRender('batchActions');
    unstable_batchedUpdates(fn);
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).BatchedUpdates = {
        batchedUpdates,
        batchActions,
        enableMicroTaskCoalescing,
        disableMicroTaskCoalescing,
        isMicroTaskCoalescingEnabled,
        getBatchStats,
        resetBatchStats
    };
}

export default {
    batchedUpdates,
    createBatchedDispatch,
    batchActions,
    enableMicroTaskCoalescing,
    disableMicroTaskCoalescing,
    isMicroTaskCoalescingEnabled,
    getBatchStats,
    resetBatchStats
};

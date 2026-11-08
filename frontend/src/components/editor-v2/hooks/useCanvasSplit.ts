import { useLayoutEffect, useSyncExternalStore } from 'react';
import DockManager from '../../abstract/DockManager';
import type { CanvasSplit } from '../utils/canvasSplit';

/**
 * The split of canvases this editor may be part of (multi-tab L6c, P-2026-11-08-1855). The root's size is the
 * signal: any dock change that alters the split resizes or hides a pane, and rc-dock's own layout callback is
 * wired outside this module. An unmount refreshes after its commit, when the element has left the DOM.
 */
export function useCanvasSplit(pane: HTMLElement | null): CanvasSplit {
    const split = useSyncExternalStore(DockManager.subscribeCanvasSplit, DockManager.getCanvasSplit);
    useLayoutEffect(() => {
        if (!pane) return;
        DockManager.refreshCanvasSplit();
        const observer = new ResizeObserver(() => DockManager.refreshCanvasSplit());
        observer.observe(pane);
        return () => {
            observer.disconnect();
            queueMicrotask(DockManager.refreshCanvasSplit);
        };
    }, [pane]);
    return split;
}

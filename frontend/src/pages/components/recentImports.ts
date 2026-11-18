/* The projects just imported, which their cards mark for a few seconds (P-2026-11-08-2215).
 * It imports nothing from the joiner, so it loads in node: the clock is injected. */
import { useSyncExternalStore } from 'react';
import type { JjodelImporter } from '../../api/persistance/jjodelImport';

export const RECENT_IMPORT_MS = 6000;

export interface RecentImportsClock {
    now: () => number;
    setTimeout: (callback: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
}

const SYSTEM_CLOCK: RecentImportsClock = {
    now: () => Date.now(),
    setTimeout: (callback, ms) => setTimeout(callback, ms),
    clearTimeout: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createRecentImports(clock: RecentImportsClock = SYSTEM_CLOCK, lifetime: number = RECENT_IMPORT_MS) {
    const recorded = new Map<string, { at: number; timer: unknown }>();
    const listeners = new Set<() => void>();
    const notify = () => listeners.forEach(listener => listener());

    return {
        add(id: string): void {
            const previous = recorded.get(id);
            if (previous) clock.clearTimeout(previous.timer);
            const timer = clock.setTimeout(() => {
                recorded.delete(id);
                notify();
            }, lifetime);
            recorded.set(id, { at: clock.now(), timer });
            notify();
        },
        // The time is read here too: a background tab throttles the timer, not the expiry.
        has(id: string): boolean {
            const entry = recorded.get(id);
            return entry !== undefined && clock.now() - entry.at < lifetime;
        },
        subscribe(listener: () => void): () => void {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}

export type RecentImports = ReturnType<typeof createRecentImports>;

export const recentImports = createRecentImports();

/** The importer of a drop or a picker, recording the id of every project it stores. */
export function recordingImports(importer: JjodelImporter, recent: RecentImports = recentImports): JjodelImporter {
    return async content => {
        const projectId = await importer(content);
        recent.add(projectId);
        return projectId;
    };
}

export function useRecentlyImported(projectId: string): boolean {
    return useSyncExternalStore(recentImports.subscribe, () => recentImports.has(projectId));
}

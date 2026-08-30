/**
 * quiescence.ts — a run measures the tree it declares, or it measures nothing.
 *
 * The smoke shares one dev server with every other session on this machine.
 * When somebody saves a file under `frontend/src` while a run is in flight,
 * vite pushes the update into the very page the run is measuring: either a
 * `[vite] hot updated: …` line in its console, or — when the saved module has
 * no HMR boundary — a `full-reload`, after which the page boots again and every
 * console pattern is counted twice or three times.
 *
 * Measured 2026-08-30 over 12 consecutive runs
 * (docs/discovery/discovery_2026-08-30_6_smoke_flaky.md): ten runs with a still
 * tree gave byte-identical console tallies, and the two runs that a concurrent
 * save fell into went red — on the state that happened to be open at that
 * instant. Correlation 8 out of 8 on the runs an independent watcher covered.
 *
 * So this file answers one question, and only that one: did anything under
 * `src` move while we were looking? If it did, the run is VOID — not red. A
 * red run is a statement about the application; a void run is a statement about
 * the machine, and the only correct response to it is to run again.
 *
 * The scan is a full path -> mtime map rather than a max-mtime: it names the
 * file that moved, and it also catches an added or removed file, which a
 * high-water mark misses.
 *
 * Cost measured on this tree, 2026-08-30, five scans each: `src` alone is 1379
 * files in 9-13 ms; `src` plus `public/`, `vite.config.ts` and `index.html` is
 * 4756 files in 22-25 ms. Four scans per run, so widening the root costs about
 * 50 ms on a run that takes minutes — measured before widening, not assumed.
 */

import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/** `frontend/`. Every reported path is relative to it, so it reads like a repo path. */
export const REPORT_ROOT = resolve(HERE, '../..');

/**
 * The tree whose stillness the run depends on: what the dev server watches and
 * serves to the page.
 *
 * `scripts/` is deliberately outside it. The `_tmp_*` probes written next to
 * this file are not part of what the browser loads, and a probe saved during a
 * run must not void it.
 */
export const SRC_ROOT = resolve(REPORT_ROOT, 'src');

/**
 * Directories walked in full.
 *
 * `public/` was added on 2026-08-30: it is served verbatim to the page, so a
 * save in there changes what the run measures exactly as a save under `src`
 * does. It holds 3377 static assets and nothing generated — measured, nothing
 * under it had moved in the previous 24 hours — so it adds no spurious voids.
 */
export const WATCHED_DIRS: string[] = [SRC_ROOT, resolve(REPORT_ROOT, 'public')];

/**
 * Single files watched alongside the directories.
 *
 * `vite.config.ts` is the worst case the guard can catch: saving it does not
 * hot-update the page, it RESTARTS the dev server, and every state opened after
 * that point is measuring a different server than the states before it.
 * `index.html` is the document the page is.
 */
export const WATCHED_FILES: string[] = [
    resolve(REPORT_ROOT, 'vite.config.ts'),
    resolve(REPORT_ROOT, 'index.html'),
];

/** What the run declares it watched, for the report. */
export function describeWatched(): string[] {
    return [...WATCHED_DIRS.map((d) => `${relative(REPORT_ROOT, d)}/`), ...WATCHED_FILES.map((f) => relative(REPORT_ROOT, f))];
}

export interface SrcSnapshot {
    /** The base every reported path is relative to: `frontend/`. */
    root: string;
    /** Wall clock of the scan, for the report. */
    takenAt: number;
    /** Absolute path -> mtimeMs. */
    files: Map<string, number>;
}

export type SrcChangeKind = 'added' | 'removed' | 'modified';

export interface SrcChange {
    /** Relative to REPORT_ROOT, so it reads like a repo path (`src/…`, `vite.config.ts`). */
    path: string;
    kind: SrcChangeKind;
}

function walk(dir: string, into: Map<string, number>): void {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        // An unreadable directory is not evidence of stillness, but it is also
        // not a change: it will be equally unreadable in the second scan, so it
        // simply contributes nothing to either side of the diff.
        return;
    }
    for (const e of entries) {
        const p = resolve(dir, e.name);
        if (e.isDirectory()) {
            walk(p, into);
            continue;
        }
        if (!e.isFile()) continue;
        try {
            into.set(p, statSync(p).mtimeMs);
        } catch {
            // Vanished between readdir and stat — i.e. it moved. Recording it
            // as absent lets the diff report it as removed.
        }
    }
}

export function snapshotSrc(
    dirs: string[] = WATCHED_DIRS,
    files: string[] = WATCHED_FILES,
): SrcSnapshot {
    const map = new Map<string, number>();
    for (const d of dirs) walk(d, map);
    for (const f of files) {
        try {
            map.set(f, statSync(f).mtimeMs);
        } catch {
            // Absent is a legitimate state (a config that does not exist here):
            // it is absent in both scans, so it contributes nothing to the diff.
        }
    }
    return { root: REPORT_ROOT, takenAt: Date.now(), files: map };
}

/** Everything that moved between the two scans, sorted for a stable report. */
export function diffSnapshots(before: SrcSnapshot, after: SrcSnapshot): SrcChange[] {
    const changes: SrcChange[] = [];

    for (const [p, mtime] of after.files) {
        const was = before.files.get(p);
        if (was === undefined) changes.push({ path: relative(after.root, p), kind: 'added' });
        else if (was !== mtime) changes.push({ path: relative(after.root, p), kind: 'modified' });
    }
    for (const p of before.files.keys()) {
        if (!after.files.has(p)) changes.push({ path: relative(before.root, p), kind: 'removed' });
    }

    changes.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    return changes;
}

/**
 * Formats a change list for the report. Capped, because a `git stash` moves
 * dozens of files at once and the point is the fact, not the inventory.
 */
export function describeChanges(changes: SrcChange[], max: number = 6): string[] {
    const lines = changes.slice(0, max).map((c) => `      ${c.kind.padEnd(8)} ${c.path}`);
    if (changes.length > max) lines.push(`      … and ${changes.length - max} more`);
    return lines;
}

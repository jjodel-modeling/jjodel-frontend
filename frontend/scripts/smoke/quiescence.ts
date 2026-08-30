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
 * high-water mark misses. Cost measured on this tree: 1379 files, 7-12 ms.
 */

import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The tree whose stillness the run depends on: what the dev server watches and
 * serves to the page.
 *
 * `scripts/` is deliberately outside it. The `_tmp_*` probes written next to
 * this file are not part of what the browser loads, and a probe saved during a
 * run must not void it.
 */
export const SRC_ROOT = resolve(HERE, '../../src');

export interface SrcSnapshot {
    root: string;
    /** Wall clock of the scan, for the report. */
    takenAt: number;
    /** Absolute path -> mtimeMs. */
    files: Map<string, number>;
}

export type SrcChangeKind = 'added' | 'removed' | 'modified';

export interface SrcChange {
    /** Relative to SRC_ROOT, so it reads like a repo path. */
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

export function snapshotSrc(root: string = SRC_ROOT): SrcSnapshot {
    const files = new Map<string, number>();
    walk(root, files);
    return { root, takenAt: Date.now(), files };
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
    const lines = changes.slice(0, max).map((c) => `      ${c.kind.padEnd(8)} src/${c.path}`);
    if (changes.length > max) lines.push(`      … and ${changes.length - max} more`);
    return lines;
}

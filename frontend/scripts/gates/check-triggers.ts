/**
 * check-triggers.ts — keep docs/harness/rule-triggers.json honest.
 *
 * The map is read by the rule-trigger hook (frontend/scripts/hooks/rule-trigger.mjs):
 * the first write of a session under an entry's glob is denied with the entry's docs
 * named (report docs/discovery/discovery_2026-10-15_lean_context_model_routing.md §5.3,
 * batch B4, P-2026-10-18-1420). A map that names a missing doc, or a glob that matches
 * nothing, fires a trigger that points nowhere or never fires; this gate catches both.
 *
 * Failures, each on its own line:
 *   (a) a doc target that does not exist, or a `#fragment` that matches no Markdown
 *       heading of its file (case-insensitive substring of the heading text, fenced
 *       code blocks skipped);
 *   (b) a glob that matches no tracked file (`git ls-files`);
 *   (c) a tracked CLAUDE.md below the root that is not a doc of some entry whose glob
 *       matches that CLAUDE.md's own path: a rule moved into a nested file without a
 *       trigger is caught here, before it lands;
 *   (d) a duplicate glob.
 *
 * The glob matcher is the hook's, imported, so the gate and the hook cannot disagree.
 *
 * Exit 0 with `check:triggers PASS (<n> entries)`; 1 when a check fails or on a usage
 * error; 2 when the map is missing, not valid JSON or not schema 1, or git cannot list
 * the tracked files.
 *
 * Run: npm run check:triggers [-- --root <dir>]
 */

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { MAP_PATH, matchGlob, validEntries } from '../hooks/rule-trigger.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');

export interface Entry {
    glob: string;
    docs: string[];
    why?: string;
}

/** The text of every Markdown heading of a file, outside fenced code blocks. */
export function headingsOf(text: string): string[] {
    const out: string[] = [];
    let fence: string | null = null;
    for (const line of text.split('\n')) {
        const f = /^\s{0,3}(```|~~~)/.exec(line);
        if (f) {
            if (fence === null) fence = f[1];
            else if (fence === f[1]) fence = null;
            continue;
        }
        if (fence !== null) continue;
        const h = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
        if (h) out.push(h[1]);
    }
    return out;
}

export function check(root: string, entries: Entry[], tracked: string[]): string[] {
    const failures: string[] = [];

    const seen = new Set<string>();
    for (const e of entries) {
        if (seen.has(e.glob)) failures.push(`duplicate glob: ${e.glob}`);
        seen.add(e.glob);
    }

    for (const e of entries) {
        for (const doc of e.docs) {
            const hash = doc.indexOf('#');
            const path = hash === -1 ? doc : doc.slice(0, hash);
            const fragment = hash === -1 ? null : doc.slice(hash + 1);
            const file = resolve(root, path);
            if (!existsSync(file)) {
                failures.push(`missing doc: ${path} (entry ${e.glob})`);
                continue;
            }
            if (fragment !== null) {
                const want = fragment.toLowerCase();
                const found = headingsOf(readFileSync(file, 'utf8')).some((h) => h.toLowerCase().includes(want));
                if (!found) failures.push(`no heading matches #${fragment} in ${path} (entry ${e.glob})`);
            }
        }
        if (!tracked.some((t) => matchGlob(e.glob, t))) failures.push(`glob matches no tracked file: ${e.glob}`);
    }

    for (const t of tracked) {
        if (!t.endsWith('/CLAUDE.md')) continue; // the root CLAUDE.md loads by itself
        const mapped = entries.some((e) => matchGlob(e.glob, t) && e.docs.some((d) => d.split('#')[0] === t));
        if (!mapped) failures.push(`nested CLAUDE.md without a trigger: ${t}`);
    }

    return failures;
}

function trackedFiles(root: string): string[] | null {
    const r = spawnSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) return null;
    return r.stdout.split('\0').filter((s) => s !== '');
}

function parseArgs(argv: string[]): { root: string } | string {
    let root = REPO;
    for (let i = 0; i < argv.length; i++) {
        const t = argv[i];
        if (t === '--root') {
            if (argv[i + 1] === undefined) return '--root needs a directory';
            root = resolve(argv[++i]);
        } else return `unknown argument ${t}`;
    }
    return { root };
}

function main(): void {
    const args = parseArgs(process.argv.slice(2));
    if (typeof args === 'string') {
        process.stderr.write(`check:triggers: ${args}\nusage: npm run check:triggers [-- --root <dir>]\n`);
        process.exit(1);
    }
    const mapFile = resolve(args.root, MAP_PATH);
    let entries: Entry[] | null;
    try {
        entries = validEntries(JSON.parse(readFileSync(mapFile, 'utf8')));
    } catch (e) {
        process.stderr.write(`check:triggers: cannot read ${mapFile} as JSON: ${(e as Error).message}\n`);
        process.exit(2);
    }
    if (entries === null) {
        process.stderr.write(`check:triggers: ${mapFile} is not schema 1 (schema, entries[].glob, entries[].docs)\n`);
        process.exit(2);
    }
    const tracked = trackedFiles(args.root);
    if (tracked === null) {
        process.stderr.write(`check:triggers: git ls-files failed in ${args.root}\n`);
        process.exit(2);
    }
    const failures = check(args.root, entries, tracked);
    if (failures.length > 0) {
        for (const f of failures) process.stdout.write(`check:triggers: ${f}\n`);
        process.stdout.write(`check:triggers FAIL (${failures.length} failures)\n`);
        process.exitCode = 1;
        return;
    }
    process.stdout.write(`check:triggers PASS (${entries.length} entries)\n`);
}

const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();

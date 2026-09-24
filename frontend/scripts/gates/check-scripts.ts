/**
 * check-scripts.ts — false-green guard for verification scripts.
 *
 * Rejects a compound assignment (or `x = x <op> ...`) whose right side awaits, in
 * every script under frontend/scripts: `failures += await e2e.run()` reads the
 * counter before the await and overwrites the increments made during it, which
 * printed ALL GREEN over failures (P-2026-09-24-1005). The rule is in
 * lint-await-counter.ts; this file only walks the disk and reports.
 *
 * It reads THE DISK, not the index. The offender was a gitignored `_tmp_*` probe,
 * and a check that read committed files would have caught nothing then and nothing
 * today. The price is stated, not hidden: the verdict depends on the untracked
 * files of the worktree the gate runs in, and it only runs when someone runs it.
 * `node_modules` and `dist` are skipped; symlinks are not followed.
 *
 * Exit 1 on a finding, on a root that is not a directory, or on a file that cannot
 * be read: a gate that cannot look does not say green.
 *
 * Run: npm run check:scripts [-- --root=<dir>]   (root defaults to frontend/scripts)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, extname, resolve } from 'node:path';
import { findAwaitCounters } from './lint-await-counter.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// frontend/scripts/gates -> frontend/scripts -> frontend -> repo root
const REPO = resolve(HERE, '..', '..', '..');
const DEFAULT_ROOT = resolve(REPO, 'frontend', 'scripts');

const EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist']);

function rel(path: string): string {
    return path.startsWith(REPO + '/') ? path.slice(REPO.length + 1) : path;
}

function walk(dir: string, out: string[]): void {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
        const path = resolve(dir, e.name);
        if (e.isSymbolicLink()) continue;
        if (e.isDirectory()) {
            if (!SKIP_DIRS.has(e.name)) walk(path, out);
        } else if (e.isFile() && EXTENSIONS.has(extname(e.name))) {
            out.push(path);
        }
    }
}

function parseRoot(argv: string[]): string {
    let root = DEFAULT_ROOT;
    for (const a of argv) {
        if (a.startsWith('--root=')) root = resolve(a.slice('--root='.length));
        else {
            console.error(`unknown argument: ${a}`);
            process.exit(1);
        }
    }
    return root;
}

function main(): void {
    const root = parseRoot(process.argv.slice(2));

    console.log('check-scripts — false-green guard for verification scripts');
    console.log(`root: ${root}`);

    try {
        if (!statSync(root).isDirectory()) throw new Error('not a directory');
    } catch (err) {
        console.error(`cannot scan ${root}: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }

    const files: string[] = [];
    walk(root, files);
    const probes = files.filter((f) => basename(f).startsWith('_tmp_')).length;
    console.log(
        `scanned ${files.length} file(s), ${probes} of them _tmp_* probes. Reads the disk, gitignored files included:`,
    );
    console.log('the verdict depends on the untracked files of this worktree.');

    let findings = 0;
    let unreadable = 0;
    for (const file of files) {
        let source: string;
        try {
            source = readFileSync(file, 'utf8');
        } catch (err) {
            unreadable++;
            console.log('');
            console.log(`    ERROR  cannot read ${rel(file)}: ${err instanceof Error ? err.message : String(err)}`);
            continue;
        }
        for (const f of findAwaitCounters(source, file)) {
            findings++;
            console.log('');
            console.log(`    ERROR  ${rel(file)}:${f.line}:${f.column}`);
            console.log(`      ${f.text}`);
            console.log(
                f.kind === 'compound'
                    ? `      \`${f.operator}\` reads its left operand before the await and writes after it: increments made during the await are lost.`
                    : '      `x = x <op> ...` reads x before the await and writes after it: increments made during the await are lost.',
            );
            console.log('      Fix: `const r = await ...; x += r;`');
        }
    }

    console.log('');
    console.log('='.repeat(74));
    const failed = findings + unreadable;
    console.log(
        failed === 0
            ? `  PASS  ${files.length} file(s), no await in a read-modify-write`
            : `  FAIL  ${findings} finding(s), ${unreadable} unreadable file(s)`,
    );
    process.exit(failed === 0 ? 0 : 1);
}

main();

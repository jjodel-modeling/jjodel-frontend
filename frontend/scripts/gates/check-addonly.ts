/**
 * check-addonly.ts — refuses a commit (a merge included) that rewrites an
 * existing line of an add-only file, compared with the commit's first parent.
 *
 * In scope: docs/claude-code-log.md (active), docs/claude-code-log-archive.md
 * (archive), docs/log-inbox/*.md (lane inboxes). Everywhere else in these
 * files, only addition is allowed. Lines are compared as text after stripping
 * trailing whitespace, per file, position-independent: a line removed at one
 * spot and added identical elsewhere in the SAME file counts as unchanged, so
 * R-RAIL-45 reordering (newest-first) and a fold's physical relocation of
 * whole entries are never refused. Two more moves are legitimate, each
 * verified against the SAME commit's new content:
 *
 *   - Rotation: a line removed from the active log is fine when it appears
 *     verbatim in the archive's new content (npm run log:rotate --rotate).
 *   - Batch closure: a line removed from an inbox is fine when it appears
 *     verbatim in the active log's new content (npm run log:rotate --fold, or
 *     the §6.1 hand fold that predates the script).
 *
 * Everything else — a changed character, a line dropped with no matching
 * destination, an inbox emptied without its lines landing in the log, any
 * removal at all from the archive (which is never itself a source) — is
 * refused.
 *
 * checkAddonly() is pure (no I/O): it takes old/new text per file and returns
 * violations. checkCommit()/checkRevision()/checkRange() are the git-backed
 * callers the CLI and lane-run.mjs use.
 *
 * Run: npm run check:addonly [-- <rev>] [-- --range <a>..<b>]
 */

import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
// frontend/scripts/gates -> frontend/scripts -> frontend -> repo root
const REPO = resolve(HERE, '..', '..', '..');

export const LOG_MD = 'docs/claude-code-log.md';
export const LOG_ARCHIVE_MD = 'docs/claude-code-log-archive.md';
export const LOG_INBOX_DIR = 'docs/log-inbox';

// ── pure comparison ──────────────────────────────────────────────────────────

export interface AddonlyFile {
    old: string | null;
    new: string | null;
}

export interface AddonlyInboxFile extends AddonlyFile {
    path: string;
}

export interface AddonlyInput {
    active: AddonlyFile;
    archive: AddonlyFile;
    /** Only the inbox files that changed in this commit. */
    inboxes: AddonlyInboxFile[];
}

export interface AddonlyViolation {
    file: string;
    /** 1-based line number in the OLD (pre-commit) version of the file. */
    line: number;
    text: string;
}

/**
 * Lines of a file, trailing whitespace stripped. An empty string is zero
 * lines, not one blank line. Otherwise `text.split('\n')` leaves a trailing
 * '' for the final newline every one of these files ends with; that artifact
 * is dropped, not counted as a blank line. A text with no trailing newline
 * keeps its last (partial) line.
 */
export function splitLines(text: string): string[] {
    if (text.length === 0) return [];
    const lines = text.split('\n');
    if (text.endsWith('\n') && lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    return lines.map((l) => l.replace(/[ \t\r]+$/, ''));
}

function lineCounter(lines: string[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
}

interface Deficit {
    text: string;
    count: number;
    /** 1-based positions in the OLD file, the most recent `count` of them. */
    positions: number[];
}

/**
 * Lines whose count in `oldLines` exceeds their count in `newLines`, within
 * one file: the per-file multiset diff that makes a same-file move invisible.
 */
function computeDeficits(oldLines: string[], newLines: string[]): Deficit[] {
    const newCounts = lineCounter(newLines);
    const oldPositions = new Map<string, number[]>();
    oldLines.forEach((l, i) => {
        const arr = oldPositions.get(l);
        if (arr) arr.push(i + 1);
        else oldPositions.set(l, [i + 1]);
    });
    const deficits: Deficit[] = [];
    for (const [text, positions] of oldPositions) {
        const have = newCounts.get(text) ?? 0;
        const deficit = positions.length - have;
        if (deficit > 0) deficits.push({ text, count: deficit, positions: positions.slice(-deficit) });
    }
    return deficits;
}

/**
 * Explains as many deficits as possible against a shared pool (the new
 * content of the file the legitimate move lands in), consuming it as it goes
 * so two files drawing on the same pool in one commit don't double-count the
 * same destination line. Returns what remains unexplained.
 */
function explainAgainst(deficits: Deficit[], pool: Map<string, number>): Deficit[] {
    const unexplained: Deficit[] = [];
    for (const d of deficits) {
        const avail = pool.get(d.text) ?? 0;
        const used = Math.min(avail, d.count);
        if (used > 0) pool.set(d.text, avail - used);
        const remaining = d.count - used;
        if (remaining > 0) unexplained.push({ text: d.text, count: remaining, positions: d.positions.slice(-remaining) });
    }
    return unexplained;
}

function pushViolations(out: AddonlyViolation[], file: string, deficits: Deficit[]): void {
    for (const d of deficits) for (const pos of d.positions) out.push({ file, line: pos, text: d.text });
}

/**
 * checkAddonly() is pure: no filesystem, no git. `active`/`archive` are
 * always given in full (even when unchanged, so the exception pools reflect
 * the file's real new content); `inboxes` lists only the inbox files that
 * changed. Violations are sorted by file, then by line.
 */
export function checkAddonly(input: AddonlyInput): AddonlyViolation[] {
    const violations: AddonlyViolation[] = [];

    const activeOld = splitLines(input.active.old ?? '');
    const activeNew = splitLines(input.active.new ?? '');
    const archiveOld = splitLines(input.archive.old ?? '');
    const archiveNew = splitLines(input.archive.new ?? '');

    // Archive: never a legitimate source, so every deficit is a straight violation.
    pushViolations(violations, LOG_ARCHIVE_MD, computeDeficits(archiveOld, archiveNew));

    // Active: a deficit is explained by rotation, i.e. present in the archive's new content.
    const archivePool = lineCounter(archiveNew);
    const activeUnexplained = explainAgainst(computeDeficits(activeOld, activeNew), archivePool);
    pushViolations(violations, LOG_MD, activeUnexplained);

    // Inboxes: a deficit is explained by batch closure, i.e. present in the active log's new
    // content. The pool is shared and consumed across every inbox file changed in this commit.
    const activePool = lineCounter(activeNew);
    for (const inbox of input.inboxes) {
        const oldLines = splitLines(inbox.old ?? '');
        const newLines = splitLines(inbox.new ?? '');
        const unexplained = explainAgainst(computeDeficits(oldLines, newLines), activePool);
        pushViolations(violations, inbox.path, unexplained);
    }

    violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
    return violations;
}

// ── git-backed callers ───────────────────────────────────────────────────────

// The archive file alone is already ~4MB and only grows (rotation never trims
// it); execFileSync's 1MB default maxBuffer silently truncates `git show` on
// it and the catch below then reads that truncation as "file absent" (status
// != 0), which reads as an empty rotation-exception pool — every legitimate
// rotation then comes back as a violation. 64MB is headroom, not a measured
// bound.
const MAX_BUFFER = 64 * 1024 * 1024;

// stderr ignored: `git show <rev>:<path>` on a path absent at <rev> (never
// existed yet, or already deleted — both routine here, e.g. a rotated-out
// inbox) prints `fatal: path '<path>' does not exist in '<rev>'` and is read
// back below as `status !== 0`, not as a failure to report.
function git(args: string[]): { status: number; out: string } {
    try {
        const out = execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: MAX_BUFFER, stdio: ['ignore', 'pipe', 'ignore'] });
        return { status: 0, out };
    } catch (err) {
        const e = err as { status?: number; stdout?: string };
        return { status: e.status ?? 1, out: e.stdout ?? '' };
    }
}

/** The commit's first parent, or null for a root commit. */
export function firstParent(rev: string): string | null {
    const r = git(['rev-parse', '--verify', '--quiet', rev + '^1']);
    return r.status === 0 ? r.out.trim() : null;
}

export function resolveRev(rev: string): string {
    const r = git(['rev-parse', '--verify', '--quiet', rev]);
    if (r.status !== 0) throw new Error(`not a valid revision: ${rev}`);
    return r.out.trim();
}

function showFile(rev: string, path: string): string | null {
    const r = git(['show', `${rev}:${path}`]);
    return r.status === 0 ? r.out : null;
}

/**
 * Paths in scope that changed between two revisions, name-only, restricted to
 * the three scope patterns by pathspec — the single git call that keeps a
 * commit outside the scope O(1): no diff of any other file ever runs.
 */
function changedScopePaths(oldRev: string, newRev: string): string[] {
    const r = git(['diff', '--no-renames', '--name-only', oldRev, newRev, '--', LOG_MD, LOG_ARCHIVE_MD, LOG_INBOX_DIR]);
    return r.out.split('\n').map((l) => l.trim()).filter(Boolean);
}

/** Violations of one commit against its first parent. [] for a root commit or one outside scope. */
export function checkCommit(rev: string): AddonlyViolation[] {
    const parent = firstParent(rev);
    if (parent === null) return [];
    const changed = changedScopePaths(parent, rev);
    if (changed.length === 0) return [];

    const active = { old: showFile(parent, LOG_MD), new: showFile(rev, LOG_MD) };
    const archive = { old: showFile(parent, LOG_ARCHIVE_MD), new: showFile(rev, LOG_ARCHIVE_MD) };
    const inboxPaths = [...new Set(changed.filter((p) => p.startsWith(LOG_INBOX_DIR + '/') && p.endsWith('.md')))];
    const inboxes = inboxPaths.map((path) => ({ path, old: showFile(parent, path), new: showFile(rev, path) }));

    return checkAddonly({ active, archive, inboxes });
}

export function checkRevision(rev: string): { commit: string; violations: AddonlyViolation[] } {
    const commit = resolveRev(rev);
    return { commit, violations: checkCommit(commit) };
}

/** Every commit of a..b, first-parent chain only, oldest first. */
export function checkRange(a: string, b: string): { commit: string; violations: AddonlyViolation[] }[] {
    const r = git(['rev-list', '--first-parent', '--reverse', `${a}..${b}`]);
    if (r.status !== 0) throw new Error(`not a valid range: ${a}..${b}`);
    const commits = r.out.split('\n').map((l) => l.trim()).filter(Boolean);
    return commits.map((commit) => ({ commit, violations: checkCommit(commit) }));
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { rev: string; range: [string, string] | null } {
    let rev = 'HEAD';
    let range: [string, string] | null = null;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--range') {
            const v = argv[++i];
            const m = v ? /^(.+?)\.\.(.+)$/.exec(v) : null;
            if (!m) throw new Error('--range needs a value in the form <a>..<b>');
            range = [m[1], m[2]];
        } else if (!a.startsWith('--')) {
            rev = a;
        } else {
            throw new Error(`unknown argument: ${a}`);
        }
    }
    return { rev, range };
}

function shortSha(sha: string): string {
    return sha.slice(0, 9);
}

function printViolations(commit: string, violations: AddonlyViolation[]): void {
    console.log(`FAIL  ${shortSha(commit)}  ${violations.length} line(s) rewritten:`);
    for (const v of violations) {
        console.log(`    ${v.file}:${v.line}: ${v.text}`);
    }
}

function main(argv: string[]): number {
    console.log('check-addonly — refuses a rewrite of an add-only log');
    console.log(`repo: ${REPO}`);
    console.log('');

    let rev: string;
    let range: [string, string] | null;
    try {
        ({ rev, range } = parseArgs(argv));
    } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 2;
    }

    const results = range ? checkRange(range[0], range[1]) : [checkRevision(rev)];

    let checked = 0;
    let failed = 0;
    for (const { commit, violations } of results) {
        checked++;
        if (violations.length > 0) {
            failed++;
            printViolations(commit, violations);
        }
    }

    console.log('');
    console.log(`${checked} commit(s) checked, ${checked - failed} clean, ${failed} rewriting an add-only log.`);
    return failed > 0 ? 1 : 0;
}

// Run only as a script: the tests import the functions above.
const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    process.exitCode = main(process.argv.slice(2));
}

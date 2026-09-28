/**
 * check-addonly.ts — refuses a commit (a merge included) that rewrites an
 * existing entry of an add-only file, compared with the commit's first
 * parent.
 *
 * In scope: docs/claude-code-log.md (active), docs/claude-code-log-archive.md
 * (archive), docs/log-inbox/*.md (lane inboxes). Every entry of the first
 * parent's version of a file — from its `## ` heading (log-tools.ts
 * splitLog/ENTRY_HEADING) to the next — must reappear byte-identical and
 * contiguous somewhere in the commit's result, entry order free to change:
 * that is what makes R-RAIL-45 reordering, and a fold's or rotation's
 * physical relocation of whole entries, not a violation. Two more
 * destinations are legitimate, each verified against the SAME commit's new
 * content:
 *
 *   - Rotation: an entry missing from the active log's own new content is
 *     fine when it reappears verbatim in the archive's new content
 *     (npm run log:rotate --rotate).
 *   - Batch closure: an entry missing from an inbox's own new content is
 *     fine when it reappears verbatim in the active log's new content
 *     (npm run log:rotate --fold, or the §6.1 hand fold that predates it).
 *
 * The archive is never itself a legitimate source (nothing rotates out of
 * it), and reappearing means the WHOLE entry, unchanged: an entry with even
 * one field edited, split, or reattached to a different heading is a
 * different entry to this comparison and does not explain the original's
 * disappearance. Preamble text before a file's first entry is not compared:
 * stage 1 compared it line by line: kept, that check made "the file emptied
 * or deleted" (COSA, batch closure) refuse on the inbox's own boilerplate
 * preamble, which never appears in the active log. Stage 2 drops it; the log
 * this gate protects is the entries, not the administrative text around them.
 *
 * Exemption: a commit whose message carries a trailer `Log-Repair: <value>`
 * is exempt outright, no comparison run. For a hand repair of a corruption
 * this gate would otherwise have caught (e2448cf61 restoring the two entries
 * 447e4239b spliced, for one) the value names the corrupting commit. The
 * value is not verified to resolve to a real commit — it is a declaration on
 * the record, not a lookup — and the CLI/checkRange report always name an
 * exemption when they use it.
 *
 * checkAddonly() is pure (no I/O): it takes old/new text per file and
 * returns violations. checkCommit()/checkRevision()/checkRange() are the
 * git-backed callers the CLI and lane-run.mjs use; each takes an optional
 * repo root (default: this repository) so a synthetic commit in a throwaway
 * repository can be checked in a test without touching real history.
 *
 * Run: npm run check:addonly [-- <rev>] [-- --range <a>..<b>]
 */

import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { splitLog, entryStartLines } from './log-tools.ts';
import type { RawEntry } from './log-tools.ts';

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
    /** 1-based line of the missing entry's own `## ` heading, in the OLD (pre-commit) file. */
    line: number;
    /** The missing entry's heading line, for a readable report. */
    heading: string;
}

function counter(texts: string[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const t of texts) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
}

/**
 * The comparison key of an entry: its text with trailing blank lines
 * collapsed to the one newline every entry ends with. log-tools.ts splitLog
 * gives an entry everything up to the NEXT heading, so an entry that sits
 * before another (separated by a blank line, the usual layout) carries that
 * blank line as its own trailing text, while the same entry as the last one
 * in a small inbox file (nothing after it) does not. Moving it — rotation or
 * batch closure — legitimately changes which of the two it is; that is
 * formatting around the entry, not a rewrite of it.
 */
function entryKey(e: RawEntry): string {
    return e.text.replace(/\n+$/, '\n');
}

interface Deficit {
    heading: string;
    text: string;
    count: number;
    /** 1-based heading lines in the OLD file, the most recent `count` of them. */
    positions: number[];
}

/**
 * Entries whose key (entryKey: heading through end, trailing blank lines
 * collapsed) is more numerous in `oldEntries` than in `newEntries`: the
 * per-file multiset diff that makes a same-file reorder invisible,
 * generalized from stage 1's line multiset to whole entries.
 */
function computeEntryDeficits(oldEntries: RawEntry[], oldStarts: number[], newEntries: RawEntry[]): Deficit[] {
    const newCounts = counter(newEntries.map(entryKey));
    const byText = new Map<string, { heading: string; positions: number[] }>();
    oldEntries.forEach((e, i) => {
        const key = entryKey(e);
        const rec = byText.get(key);
        if (rec) rec.positions.push(oldStarts[i]);
        else byText.set(key, { heading: e.heading, positions: [oldStarts[i]] });
    });
    const deficits: Deficit[] = [];
    for (const [text, { heading, positions }] of byText) {
        const have = newCounts.get(text) ?? 0;
        const deficit = positions.length - have;
        if (deficit > 0) deficits.push({ heading, text, count: deficit, positions: positions.slice(-deficit) });
    }
    return deficits;
}

/**
 * Explains as many deficits as possible against a shared pool (the new
 * entries of the file the legitimate move lands in), consuming it as it goes
 * so two files drawing on the same pool in one commit don't double-count the
 * same destination entry. Returns what remains unexplained.
 */
function explainAgainst(deficits: Deficit[], pool: Map<string, number>): Deficit[] {
    const unexplained: Deficit[] = [];
    for (const d of deficits) {
        const avail = pool.get(d.text) ?? 0;
        const used = Math.min(avail, d.count);
        if (used > 0) pool.set(d.text, avail - used);
        const remaining = d.count - used;
        if (remaining > 0) unexplained.push({ ...d, count: remaining, positions: d.positions.slice(-remaining) });
    }
    return unexplained;
}

function pushViolations(out: AddonlyViolation[], file: string, deficits: Deficit[]): void {
    for (const d of deficits) for (const pos of d.positions) out.push({ file, line: pos, heading: d.heading });
}

/**
 * checkAddonly() is pure: no filesystem, no git. `active`/`archive` are
 * always given in full (even when unchanged, so the exception pools reflect
 * the file's real new content); `inboxes` lists only the inbox files that
 * changed. Violations are sorted by file, then by line.
 */
export function checkAddonly(input: AddonlyInput): AddonlyViolation[] {
    const violations: AddonlyViolation[] = [];

    const activeOld = splitLog(input.active.old ?? '');
    const activeNew = splitLog(input.active.new ?? '');
    const archiveOld = splitLog(input.archive.old ?? '');
    const archiveNew = splitLog(input.archive.new ?? '');

    const activeOldStarts = entryStartLines(activeOld);
    const archiveOldStarts = entryStartLines(archiveOld);

    // Archive: never a legitimate source, so every deficit is a straight violation.
    pushViolations(violations, LOG_ARCHIVE_MD, computeEntryDeficits(archiveOld.entries, archiveOldStarts, archiveNew.entries));

    // Active: a deficit is explained by rotation, i.e. present in the archive's new entries.
    const archivePool = counter(archiveNew.entries.map(entryKey));
    const activeUnexplained = explainAgainst(computeEntryDeficits(activeOld.entries, activeOldStarts, activeNew.entries), archivePool);
    pushViolations(violations, LOG_MD, activeUnexplained);

    // Inboxes: a deficit is explained by batch closure, i.e. present in the active log's new
    // entries. The pool is shared and consumed across every inbox file changed in this commit.
    const activePool = counter(activeNew.entries.map(entryKey));
    for (const inbox of input.inboxes) {
        const oldLog = splitLog(inbox.old ?? '');
        const newLog = splitLog(inbox.new ?? '');
        const oldStarts = entryStartLines(oldLog);
        const unexplained = explainAgainst(computeEntryDeficits(oldLog.entries, oldStarts, newLog.entries), activePool);
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
function git(repo: string, args: string[]): { status: number; out: string } {
    try {
        const out = execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: MAX_BUFFER, stdio: ['ignore', 'pipe', 'ignore'] });
        return { status: 0, out };
    } catch (err) {
        const e = err as { status?: number; stdout?: string };
        return { status: e.status ?? 1, out: e.stdout ?? '' };
    }
}

/** The commit's first parent, or null for a root commit. */
export function firstParent(rev: string, repo: string = REPO): string | null {
    const r = git(repo, ['rev-parse', '--verify', '--quiet', rev + '^1']);
    return r.status === 0 ? r.out.trim() : null;
}

export function resolveRev(rev: string, repo: string = REPO): string {
    const r = git(repo, ['rev-parse', '--verify', '--quiet', rev]);
    if (r.status !== 0) throw new Error(`not a valid revision: ${rev}`);
    return r.out.trim();
}

function showFile(repo: string, rev: string, path: string): string | null {
    const r = git(repo, ['show', `${rev}:${path}`]);
    return r.status === 0 ? r.out : null;
}

/**
 * Paths in scope that changed between two revisions, name-only, restricted to
 * the three scope patterns by pathspec — the single git call that keeps a
 * commit outside the scope O(1): no diff of any other file ever runs.
 */
function changedScopePaths(repo: string, oldRev: string, newRev: string): string[] {
    const r = git(repo, ['diff', '--no-renames', '--name-only', oldRev, newRev, '--', LOG_MD, LOG_ARCHIVE_MD, LOG_INBOX_DIR]);
    return r.out.split('\n').map((l) => l.trim()).filter(Boolean);
}

const LOG_REPAIR_TRAILER = /^Log-Repair:\s*(\S.*)$/m;

/** The `Log-Repair: <value>` trailer of a commit's message, trimmed, or null when absent. */
function logRepairTrailer(repo: string, rev: string): string | null {
    const r = git(repo, ['log', '-1', '--format=%B', rev]);
    if (r.status !== 0) return null;
    const m = LOG_REPAIR_TRAILER.exec(r.out);
    return m ? m[1].trim() : null;
}

export interface CheckResult {
    violations: AddonlyViolation[];
    /** The Log-Repair trailer's value when the commit is exempt, else null. */
    exempt: string | null;
}

/** One commit against its first parent. Exempt, or [] for a root commit or one outside scope. */
export function checkCommit(rev: string, repo: string = REPO): CheckResult {
    const exempt = logRepairTrailer(repo, rev);
    if (exempt !== null) return { violations: [], exempt };

    const parent = firstParent(rev, repo);
    if (parent === null) return { violations: [], exempt: null };
    const changed = changedScopePaths(repo, parent, rev);
    if (changed.length === 0) return { violations: [], exempt: null };

    const active = { old: showFile(repo, parent, LOG_MD), new: showFile(repo, rev, LOG_MD) };
    const archive = { old: showFile(repo, parent, LOG_ARCHIVE_MD), new: showFile(repo, rev, LOG_ARCHIVE_MD) };
    const inboxPaths = [...new Set(changed.filter((p) => p.startsWith(LOG_INBOX_DIR + '/') && p.endsWith('.md')))];
    const inboxes = inboxPaths.map((path) => ({ path, old: showFile(repo, parent, path), new: showFile(repo, rev, path) }));

    return { violations: checkAddonly({ active, archive, inboxes }), exempt: null };
}

export interface RevisionResult extends CheckResult {
    commit: string;
}

export function checkRevision(rev: string, repo: string = REPO): RevisionResult {
    const commit = resolveRev(rev, repo);
    return { commit, ...checkCommit(commit, repo) };
}

/** Every commit of a..b, first-parent chain only, oldest first. */
export function checkRange(a: string, b: string, repo: string = REPO): RevisionResult[] {
    const r = git(repo, ['rev-list', '--first-parent', '--reverse', `${a}..${b}`]);
    if (r.status !== 0) throw new Error(`not a valid range: ${a}..${b}`);
    const commits = r.out.split('\n').map((l) => l.trim()).filter(Boolean);
    return commits.map((commit) => ({ commit, ...checkCommit(commit, repo) }));
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

function printResult(r: RevisionResult): void {
    if (r.exempt !== null) {
        console.log(`EXEMPT  ${shortSha(r.commit)}  Log-Repair: ${r.exempt}`);
        return;
    }
    console.log(`FAIL  ${shortSha(r.commit)}  ${r.violations.length} entr${r.violations.length === 1 ? 'y' : 'ies'} rewritten:`);
    for (const v of r.violations) {
        console.log(`    ${v.file}:${v.line}: ${v.heading}`);
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
    let exempted = 0;
    for (const r of results) {
        checked++;
        if (r.exempt !== null) {
            exempted++;
            printResult(r);
        } else if (r.violations.length > 0) {
            failed++;
            printResult(r);
        }
    }

    console.log('');
    console.log(`${checked} commit(s) checked, ${checked - failed} clean (${exempted} exempt), ${failed} rewriting an add-only log.`);
    return failed > 0 ? 1 : 0;
}

// Run only as a script: the tests import the functions above.
const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    process.exitCode = main(process.argv.slice(2));
}

/**
 * check-docs.ts — documentation gates.
 *
 * Four independent checks. All always run and all always report: no fail-fast,
 * because one run must give the whole picture. Exit code is non-zero if at
 * least one fails. Warnings never fail the run.
 *
 * Check A — the entry-format block in CLAUDE.md §21.2 and docs/PROTOCOL.md P9
 *           is byte-identical. That identity was declared a critical constraint
 *           but was until now guaranteed only by a hand-run diff.
 *
 * Check B — entries in docs/claude-code-log.md AND in the lane inboxes under
 *           docs/log-inbox/ dated on or after the threshold carry the fields of
 *           their type: Corregge and Causa, with values inside the vocabulary,
 *           for a task; Ticket, Priority and Found in for a ticket (a heading
 *           `ticket:`, from TICKET_LINT_FROM_DATE). The rules live in
 *           log-tools.ts (lintEntry), shared with the fold in rotate-log.ts.
 *
 * Check C — the Notes field of an entry stays within its character cap. The log
 *           is an index, not a fourth copy of the reasoning: past the cap the
 *           text belongs in the document Notes cites. Active log and inboxes,
 *           never the archive.
 *
 * Check D — the active log has at most LOG_MAX_ENTRIES entries. A non-empty
 *           lane inbox under docs/log-inbox/ is a warning, not a failure (its
 *           entries are linted by B and C all the same).
 *
 * This script only reads. It never rewrites, reorders or normalizes the log.
 *
 * Run: npm run check:docs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
    ENTRY_HEADING,
    LINT_FROM_DATE,
    LOG_MAX_ENTRIES,
    NOTES_LINT_FROM_DATE,
    NOTES_MAX_CHARS,
    collectNotesSpans,
    entryStartLines,
    lintEntry,
    promptNameKeys,
    splitLog,
} from './log-tools.ts';
import type { EntryFinding, RawEntry } from './log-tools.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// frontend/scripts/gates -> frontend/scripts -> frontend -> repo root
const REPO = resolve(HERE, '..', '..', '..');

const CLAUDE_MD = resolve(REPO, 'CLAUDE.md');
const PROTOCOL_MD = resolve(REPO, 'docs/PROTOCOL.md');
const LOG_MD = resolve(REPO, 'docs/claude-code-log.md');
const LOG_ARCHIVE_MD = resolve(REPO, 'docs/claude-code-log-archive.md');
const LOG_INBOX_DIR = resolve(REPO, 'docs/log-inbox');

/**
 * Block anchors. Both contain an em dash (U+2014), not an ASCII hyphen:
 * compared as UTF-8, never normalized.
 */
const BLOCK_START = '## YYYY-MM-DD — type: short description';
const BLOCK_END = '**Prompt document name**: YYYY-MM-DD HH:mm';

interface Problem {
    file: string;
    entry: string;
    field: string;
    found: string;
    allowed: string;
    message: string;
}

interface CheckOutcome {
    name: string;
    ok: boolean;
    lines: string[];
    problems: Problem[];
    warnings: string[];
}

function read(path: string): string {
    try {
        return readFileSync(path, 'utf8');
    } catch (err) {
        throw new Error(`cannot read ${path}: ${err instanceof Error ? err.message : String(err)}`);
    }
}

function rel(path: string): string {
    return path.startsWith(REPO) ? path.slice(REPO.length + 1) : path;
}

// ── Check A — block identity ────────────────────────────────────────────────

interface Extraction {
    startCount: number;
    startLine: number;
    endLine: number;
    block: string | null;
    error: string | null;
}

function extractBlock(text: string): Extraction {
    const lines = text.split('\n');
    const startIdxs: number[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === BLOCK_START) startIdxs.push(i);
    }

    if (startIdxs.length === 0) {
        return { startCount: 0, startLine: -1, endLine: -1, block: null, error: 'start anchor not found' };
    }
    if (startIdxs.length > 1) {
        return {
            startCount: startIdxs.length,
            startLine: startIdxs[0] + 1,
            endLine: -1,
            block: null,
            error: `start anchor appears ${startIdxs.length} times (lines ${startIdxs.map((i) => i + 1).join(', ')}) — extraction would be ambiguous`,
        };
    }

    const start = startIdxs[0];
    let end = -1;
    for (let i = start; i < lines.length; i++) {
        if (lines[i] === BLOCK_END) {
            end = i;
            break;
        }
    }
    if (end === -1) {
        return {
            startCount: 1,
            startLine: start + 1,
            endLine: -1,
            block: null,
            error: 'end anchor not found after the start anchor',
        };
    }

    const block = lines.slice(start, end + 1).join('\n');
    if (block.trim() === '') {
        return { startCount: 1, startLine: start + 1, endLine: end + 1, block: null, error: 'extracted block is empty' };
    }
    return { startCount: 1, startLine: start + 1, endLine: end + 1, block, error: null };
}

function checkBlockIdentity(): CheckOutcome {
    const out: CheckOutcome = {
        name: 'A — entry-format block identity (CLAUDE.md §21.2 vs docs/PROTOCOL.md P9)',
        ok: true,
        lines: [],
        problems: [],
        warnings: [],
    };

    const a = extractBlock(read(CLAUDE_MD));
    const b = extractBlock(read(PROTOCOL_MD));

    for (const [path, ex] of [[CLAUDE_MD, a], [PROTOCOL_MD, b]] as Array<[string, Extraction]>) {
        if (ex.error) {
            out.ok = false;
            out.problems.push({
                file: rel(path),
                entry: '(block extraction)',
                field: BLOCK_START,
                found: ex.error,
                allowed: 'exactly one start anchor, a matching end anchor, and a non-empty block',
                message: `cannot extract the template block from ${rel(path)}: ${ex.error}`,
            });
        } else {
            out.lines.push(
                `    ${rel(path)}: lines ${ex.startLine}-${ex.endLine}, ` +
                `${ex.block!.split('\n').length} line(s), ${Buffer.byteLength(ex.block!, 'utf8')} bytes`,
            );
        }
    }

    if (!a.block || !b.block) return out;

    if (a.block === b.block) {
        out.lines.push('    identical, byte for byte');
        return out;
    }

    out.ok = false;
    const al = a.block.split('\n');
    const bl = b.block.split('\n');
    const diffs: string[] = [];
    for (let i = 0; i < Math.max(al.length, bl.length); i++) {
        if (al[i] !== bl[i]) {
            diffs.push(`      line ${i + 1}:`);
            diffs.push(`        CLAUDE.md   : ${al[i] === undefined ? '(missing)' : JSON.stringify(al[i])}`);
            diffs.push(`        PROTOCOL.md : ${bl[i] === undefined ? '(missing)' : JSON.stringify(bl[i])}`);
        }
    }
    out.problems.push({
        file: `${rel(CLAUDE_MD)} vs ${rel(PROTOCOL_MD)}`,
        entry: '(template block)',
        field: 'entry-format block',
        found: `${diffs.length > 0 ? 'differing lines listed below' : 'blocks differ'}`,
        allowed: 'the two blocks must be byte-identical',
        message: 'the template block diverged between CLAUDE.md and docs/PROTOCOL.md',
    });
    out.lines.push(...diffs);
    return out;
}

// ── Check B — log linter ────────────────────────────────────────────────────

// ENTRY_HEADING, the field grammar and every rule of an entry live in
// log-tools.ts, shared with the fold CLI. The optional time in the heading is a
// historical variant: two archive entries are headed `## 2026-05-01 22:05 — fix: ...`.
// Without it their field lines would be attributed to the preceding entry and
// dropped, leaving their prompt-document name out of the Corregge resolution set.

interface InboxFile {
    lane: string;
    path: string;
    text: string;
}

/** One entry of a file the gate lints, with the verdict of the shared rules. */
interface LintedEntry {
    path: string;
    entry: RawEntry;
    startLine: number;
    findings: EntryFinding[];
    unresolved: string[];
}

function readInboxes(): InboxFile[] {
    return listInboxes().map((i) => ({ ...i, text: read(i.path) }));
}

function lintFile(path: string, text: string, known: ReadonlySet<string>): LintedEntry[] {
    const log = splitLog(text);
    const starts = entryStartLines(log);
    return log.entries.map((entry, i) => ({ path, entry, startLine: starts[i], ...lintEntry(entry, known) }));
}

const entryLabel = (e: LintedEntry): string => `${e.entry.heading}  (${rel(e.path)}:${e.startLine})`;

function checkLog(): CheckOutcome {
    const out: CheckOutcome = {
        name: `B — prompt log fields (entries dated >= ${LINT_FROM_DATE})`,
        ok: true,
        lines: [],
        problems: [],
        warnings: [],
    };

    const activeText = read(LOG_MD);
    const active = splitLog(activeText).entries;

    // Every prompt-document name known, active log plus archive: the resolution
    // target for Corregge.
    const known = new Set<string>();
    let archived: RawEntry[] = [];
    try {
        archived = splitLog(read(LOG_ARCHIVE_MD)).entries;
    } catch {
        out.warnings.push(`    archive not readable at ${rel(LOG_ARCHIVE_MD)} — resolution checked against the active log only`);
    }
    for (const k of promptNameKeys([...active, ...archived])) known.add(k);

    // An entry waiting in an inbox may correct another one waiting in a sibling
    // inbox: both resolve at the fold, so both resolve here.
    const inboxes = readInboxes();
    const resolvable = new Set(known);
    for (const i of inboxes) for (const k of promptNameKeys(splitLog(i.text).entries)) resolvable.add(k);

    // The log is NOT in chronological order: filter every entry on its own
    // date, never stop early.
    const inScope = active.filter((e) => e.date >= LINT_FROM_DATE);

    out.lines.push(
        `    ${active.length} entr${active.length === 1 ? 'y' : 'ies'} in ${rel(LOG_MD)}, ` +
        `${archived.length} in the archive, ${known.size} distinct prompt-document key(s) known`,
    );
    out.lines.push(
        `    ${inScope.length} entr${inScope.length === 1 ? 'y' : 'ies'} in scope; ` +
        `${active.length - inScope.length} older than ${LINT_FROM_DATE}, ignored without warning`,
    );

    const linted = [
        ...lintFile(LOG_MD, activeText, resolvable),
        ...inboxes.flatMap((i) => lintFile(i.path, i.text, resolvable)),
    ];
    const inboxEntries = linted.filter((e) => e.path !== LOG_MD);
    out.lines.push(
        `    ${inboxEntries.length} entr${inboxEntries.length === 1 ? 'y' : 'ies'} in ${inboxes.length} lane inbox file(s) ` +
        `under ${rel(LOG_INBOX_DIR)}, ${inboxEntries.filter((e) => e.entry.date >= LINT_FROM_DATE).length} in scope`,
    );

    for (const e of linted) {
        for (const f of e.findings) {
            if (f.check !== 'B') continue;
            out.ok = false;
            out.problems.push({ file: rel(e.path), entry: entryLabel(e), field: f.field, found: f.found, allowed: f.allowed, message: f.message });
        }
        for (const v of e.unresolved) {
            out.warnings.push(
                `    ${entryLabel(e)}\n` +
                `      **Corregge**: ${v} is well-formed but matches no "**Prompt document name**"\n` +
                `      in the active log, the archive or a lane inbox. Fine if that task was never logged; check the value otherwise.`,
            );
        }
    }

    return out;
}

// ── Check C — Notes length ──────────────────────────────────────────────────

interface EntrySpan {
    bytes: number;
}

/** Byte size of every entry, heading included, for the telemetry lines. */
function entrySpans(text: string): EntrySpan[] {
    const lines = text.split('\n');
    const starts: number[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (ENTRY_HEADING.test(lines[i])) starts.push(i);
    }
    return starts.map((s, k) => {
        const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
        return { bytes: Buffer.byteLength(lines.slice(s, end).join('\n'), 'utf8') };
    });
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function checkNotesLength(): CheckOutcome {
    const out: CheckOutcome = {
        name: `C — Notes length <= ${NOTES_MAX_CHARS} chars (entries dated >= ${NOTES_LINT_FROM_DATE})`,
        ok: true,
        lines: [],
        problems: [],
        warnings: [],
    };

    // The active log and the lane inboxes. The archive is never linted and never emended.
    const text = read(LOG_MD);
    const entries = entrySpans(text);
    const spans = collectNotesSpans(text);
    const inScope = spans.filter((s) => s.date >= NOTES_LINT_FROM_DATE);
    const inboxes = readInboxes();
    const inboxSpans = inboxes.flatMap((i) => collectNotesSpans(i.text));
    const inboxInScope = inboxSpans.filter((s) => s.date >= NOTES_LINT_FROM_DATE);

    // Telemetry, printed whether the check passes or fails: the cap is a budget,
    // and a budget nobody measures goes back to being a memory.
    out.lines.push(
        `    ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} in ${rel(LOG_MD)}, ` +
        `${Buffer.byteLength(text, 'utf8')} bytes total`,
    );
    out.lines.push(`    median entry: ${median(entries.map((e) => e.bytes))} bytes`);
    out.lines.push(
        `    ${inScope.length} Notes field(s) in scope; ` +
        `${spans.length - inScope.length} older than ${NOTES_LINT_FROM_DATE}, ignored without warning`,
    );
    out.lines.push(
        `    ${inboxInScope.length} Notes field(s) in scope in ${inboxes.length} lane inbox file(s) under ${rel(LOG_INBOX_DIR)}`,
    );

    // The rules are the shared ones (log-tools.ts lintEntry); Corregge is not
    // this check's business, so nothing is resolved here.
    const linted = [
        ...lintFile(LOG_MD, text, new Set()),
        ...inboxes.flatMap((i) => lintFile(i.path, i.text, new Set())),
    ];
    for (const e of linted) {
        for (const f of e.findings) {
            if (f.check !== 'C') continue;
            out.ok = false;
            out.problems.push({
                file: `${rel(e.path)}:${e.startLine + f.lineOffset}`,
                entry: entryLabel(e),
                field: f.field,
                found: f.found,
                allowed: f.allowed,
                message: f.message,
            });
        }
    }

    return out;
}

// ── Check D — entry count threshold ─────────────────────────────────────────

function listInboxes(): { lane: string; path: string }[] {
    let names: string[] = [];
    try {
        names = readdirSync(LOG_INBOX_DIR).filter((f) => f.endsWith('.md'));
    } catch {
        return [];
    }
    return names.map((f) => ({ lane: f.replace(/\.md$/, ''), path: resolve(LOG_INBOX_DIR, f) }));
}

function checkEntryCount(): CheckOutcome {
    const out: CheckOutcome = {
        name: `D — active log entry count (threshold ${LOG_MAX_ENTRIES})`,
        ok: true,
        lines: [],
        problems: [],
        warnings: [],
    };

    const { entries } = splitLog(read(LOG_MD));
    const count = entries.length;
    out.lines.push(`    ${rel(LOG_MD)}: ${count} entries (threshold ${LOG_MAX_ENTRIES})`);

    if (count > LOG_MAX_ENTRIES) {
        out.ok = false;
        out.problems.push({
            file: rel(LOG_MD),
            entry: '(whole file)',
            field: 'entry count',
            found: `${count} entries`,
            allowed: `at most ${LOG_MAX_ENTRIES}`,
            message: `active log has ${count} entries, over the threshold of ${LOG_MAX_ENTRIES} — run \`npm run log:rotate -- --rotate --write\` in an exclusive lane (RC-12)`,
        });
    }

    for (const inbox of listInboxes()) {
        const { entries: inboxEntries } = splitLog(read(inbox.path));
        if (inboxEntries.length > 0) {
            out.warnings.push(
                `    lane "${inbox.lane}" (${rel(inbox.path)}) has ${inboxEntries.length} entry(ies) waiting to be folded — mid-batch is a normal state`,
            );
        }
    }

    return out;
}

// ── Report ──────────────────────────────────────────────────────────────────

function printOutcome(o: CheckOutcome): void {
    console.log('');
    console.log(`${o.ok ? 'PASS' : 'FAIL'}  Check ${o.name}`);
    for (const l of o.lines) console.log(l);

    for (const p of o.problems) {
        console.log('');
        console.log(`    ERROR  ${p.message}`);
        console.log(`      file    : ${p.file}`);
        console.log(`      entry   : ${p.entry}`);
        console.log(`      field   : ${p.field}`);
        console.log(`      found   : ${p.found}`);
        console.log(`      allowed : ${p.allowed}`);
    }

    for (const w of o.warnings) {
        console.log('');
        console.log(`    WARNING (non-blocking)`);
        console.log(w);
    }
}

function main(): void {
    console.log('check-docs — documentation gates');
    console.log(`repo: ${REPO}`);

    const outcomes: CheckOutcome[] = [];
    // Every check always runs: a single run must give the whole picture.
    outcomes.push(checkBlockIdentity());
    outcomes.push(checkLog());
    outcomes.push(checkNotesLength());
    outcomes.push(checkEntryCount());

    for (const o of outcomes) printOutcome(o);

    const failed = outcomes.filter((o) => !o.ok);
    const warnings = outcomes.reduce((n, o) => n + o.warnings.length, 0);

    console.log('');
    console.log('='.repeat(74));
    for (const o of outcomes) console.log(`  ${o.ok ? 'PASS' : 'FAIL'}  ${o.name}`);
    console.log('');
    console.log(`  ${outcomes.length - failed.length}/${outcomes.length} check(s) passed, ${warnings} warning(s)`);

    if (failed.length > 0) {
        console.log('');
        console.log('  Do not edit the log or the documents just to turn this green:');
        console.log('  read what failed first.');
    }

    process.exit(failed.length > 0 ? 1 : 0);
}

main();

/**
 * check-docs.ts — documentation gates.
 *
 * Two independent checks. Both always run and both always report: no fail-fast,
 * because one run must give the whole picture. Exit code is non-zero if at
 * least one fails. Warnings never fail the run.
 *
 * Check A — the entry-format block in CLAUDE.md §21.2 and docs/PROTOCOL.md P9
 *           is byte-identical. That identity was declared a critical constraint
 *           but was until now guaranteed only by a hand-run diff.
 *
 * Check B — entries in docs/claude-code-log.md dated on or after the threshold
 *           carry Corregge and Causa, with values inside the vocabulary.
 *
 * This script only reads. It never rewrites, reorders or normalizes the log.
 *
 * Run: npm run check:docs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
// frontend/scripts/gates -> frontend/scripts -> frontend -> repo root
const REPO = resolve(HERE, '..', '..', '..');

const CLAUDE_MD = resolve(REPO, 'CLAUDE.md');
const PROTOCOL_MD = resolve(REPO, 'docs/PROTOCOL.md');
const LOG_MD = resolve(REPO, 'docs/claude-code-log.md');
const LOG_ARCHIVE_MD = resolve(REPO, 'docs/claude-code-log-archive.md');

/**
 * Block anchors. Both contain an em dash (U+2014), not an ASCII hyphen:
 * compared as UTF-8, never normalized.
 */
const BLOCK_START = '## YYYY-MM-DD — type: short description';
const BLOCK_END = '**Prompt document name**: YYYY-MM-DD HH:mm';

/** Entries dated before this are ignored without warning: no back-filling. */
const LINT_FROM_DATE = '2026-08-02';

/** The sentinel is an em dash U+2014, not '-' and not an en dash. */
const SENTINEL = '—';

/** CLAUDE.md §21.3 taxonomy. Canonical form is parenthesized. */
const CAUSA_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const CAUSA_ALLOWED = [
    ...CAUSA_LETTERS.map((l) => `(${l})`),
    ...CAUSA_LETTERS,
];

/**
 * Corregge holds the name of a prompt document, whose format is fixed by the
 * template's own last field: YYYY-MM-DD HH:mm. The timestamp must be the
 * prefix; a trailing annotation is allowed, as in
 *   2026-08-01 13:31 (prompt `jjodie_window_default_bottom_left`)
 */
const TIMESTAMP_PREFIX = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})(\s|$)/;

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

interface LogEntry {
    heading: string;
    date: string;
    startLine: number;
    fields: Map<string, string>;
}

/**
 * Entry heading. The optional time is a historical variant: two archive
 * entries are headed `## 2026-05-01 22:05 — fix: ...`. Without it their field
 * lines would be attributed to the preceding entry and dropped, leaving their
 * prompt-document name out of the Corregge resolution set.
 */
const ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /;
const FIELD_LINE = /^\*\*([^*]+)\*\*:\s?(.*)$/;

function parseEntries(text: string): LogEntry[] {
    const lines = text.split('\n');
    const entries: LogEntry[] = [];
    let current: LogEntry | null = null;

    for (let i = 0; i < lines.length; i++) {
        const m = ENTRY_HEADING.exec(lines[i]);
        if (m) {
            current = { heading: lines[i], date: m[1], startLine: i + 1, fields: new Map() };
            entries.push(current);
            continue;
        }
        if (!current) continue;
        const f = FIELD_LINE.exec(lines[i]);
        // First occurrence wins: a field name repeated inside prose must not
        // overwrite the real one.
        if (f && !current.fields.has(f[1])) current.fields.set(f[1], f[2].trim());
    }
    return entries;
}

function checkLog(): CheckOutcome {
    const out: CheckOutcome = {
        name: `B — prompt log fields (entries dated >= ${LINT_FROM_DATE})`,
        ok: true,
        lines: [],
        problems: [],
        warnings: [],
    };

    const activeText = read(LOG_MD);
    const active = parseEntries(activeText);

    // Every prompt-document name known, active log plus archive: the resolution
    // target for Corregge.
    const known = new Set<string>();
    let archived: LogEntry[] = [];
    try {
        archived = parseEntries(read(LOG_ARCHIVE_MD));
    } catch {
        out.warnings.push(`    archive not readable at ${rel(LOG_ARCHIVE_MD)} — resolution checked against the active log only`);
    }
    for (const e of [...active, ...archived]) {
        const n = e.fields.get('Prompt document name');
        if (!n) continue;
        // Keyed on the timestamp prefix, which is the only part §21.2 fixes as a
        // format. BOTH sides carry an optional trailing annotation — sometimes the
        // reference, sometimes the target — so comparing whole names misses the
        // match in either direction. A name without a well-formed prefix is kept
        // verbatim rather than dropped from the set.
        const m = TIMESTAMP_PREFIX.exec(n.trim());
        known.add(m ? m[1] : n.trim());
    }

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

    for (const e of inScope) {
        const label = `${e.heading}  (${rel(LOG_MD)}:${e.startLine})`;

        // Corregge
        if (!e.fields.has('Corregge')) {
            out.ok = false;
            out.problems.push({
                file: rel(LOG_MD),
                entry: label,
                field: '**Corregge**',
                found: '(field absent)',
                allowed: `${SENTINEL}  |  a prompt-document name in the form YYYY-MM-DD HH:mm, optionally followed by an annotation`,
                message: 'required field missing',
            });
        } else {
            const v = e.fields.get('Corregge')!;
            if (v === SENTINEL) {
                // nothing to correct — fine
            } else {
                const m = TIMESTAMP_PREFIX.exec(v);
                if (!m) {
                    out.ok = false;
                    out.problems.push({
                        file: rel(LOG_MD),
                        entry: label,
                        field: '**Corregge**',
                        found: v === '' ? '(empty)' : v,
                        allowed: `${SENTINEL}  |  a prompt-document name in the form YYYY-MM-DD HH:mm, optionally followed by an annotation`,
                        message: 'value is neither the sentinel nor a prompt-document name in the prescribed form',
                    });
                } else if (!known.has(m[1])) {
                    // Well-formed but unresolved: the target entry may legitimately
                    // never have been logged. Warning, not an error.
                    out.warnings.push(
                        `    ${label}\n` +
                        `      **Corregge**: ${m[1]} is well-formed but matches no "**Prompt document name**"\n` +
                        `      in the active log or the archive. Fine if that task was never logged; check the value otherwise.`,
                    );
                }
            }
        }

        // Causa
        if (!e.fields.has('Causa')) {
            out.ok = false;
            out.problems.push({
                file: rel(LOG_MD),
                entry: label,
                field: '**Causa**',
                found: '(field absent)',
                allowed: `${SENTINEL}  |  one of ${CAUSA_LETTERS.map((l) => `(${l})`).join(' ')}`,
                message: 'required field missing',
            });
        } else {
            const v = e.fields.get('Causa')!;
            if (v !== SENTINEL && !CAUSA_ALLOWED.includes(v)) {
                out.ok = false;
                out.problems.push({
                    file: rel(LOG_MD),
                    entry: label,
                    field: '**Causa**',
                    found: v === '' ? '(empty)' : v,
                    allowed: `${SENTINEL}  |  one of ${CAUSA_LETTERS.map((l) => `(${l})`).join(' ')}  (bare letters also accepted)`,
                    message: 'value outside the CLAUDE.md §21.3 taxonomy',
                });
            }
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
    // Both checks always run: a single run must give the whole picture.
    outcomes.push(checkBlockIdentity());
    outcomes.push(checkLog());

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

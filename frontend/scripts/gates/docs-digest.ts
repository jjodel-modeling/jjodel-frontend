/**
 * docs-digest.ts — the decisions digest of one day, generated from the register.
 *
 * RC-25..28 make every unattended decision a row of docs/decisions.md with a
 * header the chat writes. This script reads the register and renders the rows of
 * one date into docs/digest/<date>.md: one line per row with a confidence label
 * computed from the header, the RC-28 counts, and a hand-written section after
 * a marker that a regeneration preserves verbatim.
 *
 * Row grammar. A row is a line `- **<ID>** (<fields>)<sep> <text>` where <ID>
 * matches ROW_ID, <fields> is a date YYYY-MM-DD followed by any of `provisional`,
 * `unattended`, `evidence: measured|read|inferred`, `verified: agent|none`,
 * `reversible: branch|trunk|persisted`, and <sep> is `:`, `.` or ` —` (the
 * older series). A ratified row may carry free-text fields (`«D9» nel prompt`),
 * kept as annotations; a provisional row may not, and the three keyed fields go
 * together or not at all. The section of a row is the nearest `## ` or `### `
 * heading; its title the opening `**…**` of the text, else the first sentence,
 * clamped to TITLE_MAX characters.
 *
 * Confidence: `ratified` without `provisional`; otherwise high = measured and
 * agent; medium = measured and none, or read and agent; low = inferred, or read
 * and none; unmarked = provisional without the three fields. `reversible` does
 * not change the label, it is printed beside it.
 *
 * This script only reads the register. It writes docs/digest/ with --write only,
 * and never a digest file that lacks the marker (that file is someone's text).
 *
 * Exit 0 when the register parses; 2 on a header it cannot parse, every such
 * line printed; 1 on a usage error, an unreadable file or a refused overwrite.
 *
 * Run: npm run docs:digest [-- --date YYYY-MM-DD] [--all] [--write]
 */

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export type Evidence = 'measured' | 'read' | 'inferred';
export type Verified = 'agent' | 'none';
export type Reversible = 'branch' | 'trunk' | 'persisted';
export type Confidence = 'high' | 'medium' | 'low' | 'ratified' | 'unmarked';

export interface Row {
    id: string;
    /** 1-based line of the header in the register. */
    line: number;
    date: string;
    provisional: boolean;
    unattended: boolean;
    evidence: Evidence | null;
    verified: Verified | null;
    reversible: Reversible | null;
    /** Free-text fields of a ratified row, verbatim. */
    annotations: string[];
    /** Text of the nearest preceding `## ` or `### ` heading, '' before the first. */
    section: string;
    /** 1-based line of that heading, 0 before the first: the section's identity. */
    sectionLine: number;
    title: string;
}

export interface HeaderFailure {
    line: number;
    text: string;
    reason: string;
}

export class HeaderParseError extends Error {
    readonly failures: HeaderFailure[];
    constructor(failures: HeaderFailure[]) {
        super(`${failures.length} row header(s) cannot be parsed`);
        this.name = 'HeaderParseError';
        this.failures = failures;
    }
}

export const MANUAL_MARKER = '<!-- digest:manual -->';
export const MANUAL_STUB = '\n## For Alfonso\n\n(hand-written by the chat: RC-26 items, deviations, tickets)\n';
export const TITLE_MAX = 120;

/** `RC-30`, `R-SIM-77`, `R-EDGE-1`, `R-VAL-3`, `R-MCID-1`. */
const ROW_ID = 'R[A-Z]*-?[A-Z]*-?\\d+';
/** A line that opens a row: the ID of the grammar in bold at column 0. */
const ROW_START = new RegExp(`^- \\*\\*(${ROW_ID})\\*\\*`);
/** Shaped like a row, ID outside the grammar (`R-A`, `R-B9-bis`): skipped, and said so. */
const NEAR_MISS = /^- \*\*R[A-Z]*-[^*]*\*\* \(/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const HEADING = /^#{2,3} (.*)$/;

const VOCABULARY = {
    evidence: ['measured', 'read', 'inferred'],
    verified: ['agent', 'none'],
    reversible: ['branch', 'trunk', 'persisted'],
} as const;
type Key = keyof typeof VOCABULARY;

const RANK: Record<Confidence, number> = { low: 0, unmarked: 1, medium: 2, high: 3, ratified: 4 };

interface Header {
    date: string;
    provisional: boolean;
    unattended: boolean;
    evidence: Evidence | null;
    verified: Verified | null;
    reversible: Reversible | null;
    annotations: string[];
    rest: string;
}

/** The header of one row, or the reason it cannot be read. */
function parseHeader(lineText: string, id: string): Header | string {
    const after = lineText.slice(`- **${id}**`.length);
    if (!after.startsWith(' (')) return 'no parenthesis with a date after the ID';
    const close = after.indexOf(')');
    if (close === -1) return 'the parenthesis does not close on the header line';
    const sep = /^(?::|\.| —)(?=\s|$)/.exec(after.slice(close + 1));
    if (!sep) return 'the separator after the parenthesis is not `:`, `.` or ` —`';

    const fields = after.slice(2, close).split(',').map((f) => f.trim());
    const [date, ...rest] = fields;
    if (!DATE.test(date)) return `the first field is not a date YYYY-MM-DD: \`${date}\``;

    const h: Header = {
        date,
        provisional: false,
        unattended: false,
        evidence: null,
        verified: null,
        reversible: null,
        annotations: [],
        rest: after.slice(close + 1 + sep[0].length).trim(),
    };
    for (const f of rest) {
        if (f === '') return 'an empty field';
        if (f === 'provisional') {
            h.provisional = true;
            continue;
        }
        if (f === 'unattended') {
            h.unattended = true;
            continue;
        }
        const kv = /^(evidence|verified|reversible):\s*(.*)$/.exec(f);
        if (kv) {
            const key = kv[1] as Key;
            const value = kv[2];
            const allowed: readonly string[] = VOCABULARY[key];
            if (!allowed.includes(value)) return `${key}: \`${value}\` is outside ${allowed.join('|')}`;
            if (key === 'evidence') h.evidence = value as Evidence;
            else if (key === 'verified') h.verified = value as Verified;
            else h.reversible = value as Reversible;
            continue;
        }
        h.annotations.push(f);
    }
    if (h.provisional && h.annotations.length > 0) {
        return `unknown field in a provisional row: \`${h.annotations[0]}\``;
    }
    const keyed = [h.evidence, h.verified, h.reversible].filter((v) => v !== null).length;
    if (keyed > 0 && keyed < 3) return 'evidence, verified and reversible go all three together, or none';
    return h;
}

/** The opening bold of the text, else its first sentence, clamped. */
function titleOf(text: string): string {
    const bold = /^\*\*(.+?)\*\*/.exec(text);
    const sentence = /^(.*?[.!?])(?=\s|$)/.exec(text);
    const t = (bold ? bold[1] : sentence ? sentence[1] : text).trim();
    if (t.length <= TITLE_MAX) return t;
    let cut = t.slice(0, TITLE_MAX - 3).trimEnd();
    // A cut inside a code span would leave its backtick open for the rest of the line.
    if ((cut.match(/`/g) ?? []).length % 2 === 1) cut = `${cut.slice(0, -1)}\``;
    return `${cut}...`;
}

/**
 * Every row of the register, in file order. Throws HeaderParseError listing
 * every header it cannot read, not the first only.
 */
export function parseRows(text: string): Row[] {
    const lines = text.split('\n');
    const rows: Row[] = [];
    const failures: HeaderFailure[] = [];
    let section = '';
    let sectionLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const heading = HEADING.exec(lines[i]);
        if (heading) {
            section = heading[1].trim();
            sectionLine = i + 1;
            continue;
        }
        const start = ROW_START.exec(lines[i]);
        if (!start) continue;

        const h = parseHeader(lines[i], start[1]);
        if (typeof h === 'string') {
            failures.push({ line: i + 1, text: lines[i], reason: h });
            continue;
        }
        // The text runs on through the continuation lines, up to a blank line,
        // a heading or the next list item.
        const body = [h.rest];
        for (let j = i + 1; j < lines.length; j++) {
            const l = lines[j];
            if (l.trim() === '' || l.startsWith('#') || l.startsWith('- ')) break;
            body.push(l.trim());
        }
        rows.push({
            id: start[1],
            line: i + 1,
            date: h.date,
            provisional: h.provisional,
            unattended: h.unattended,
            evidence: h.evidence,
            verified: h.verified,
            reversible: h.reversible,
            annotations: h.annotations,
            section,
            sectionLine,
            title: titleOf(body.filter((b) => b !== '').join(' ')),
        });
    }
    if (failures.length > 0) throw new HeaderParseError(failures);
    return rows;
}

/** 1-based lines shaped like a row whose ID is outside the grammar. */
export function nearMisses(text: string): number[] {
    const out: number[] = [];
    text.split('\n').forEach((l, i) => {
        if (NEAR_MISS.test(l) && !ROW_START.test(l)) out.push(i + 1);
    });
    return out;
}

export function confidence(row: Row): Confidence {
    if (!row.provisional) return 'ratified';
    const { evidence: e, verified: v } = row;
    if (e === null || v === null) return 'unmarked';
    if (e === 'measured') return v === 'agent' ? 'high' : 'medium';
    if (e === 'read') return v === 'agent' ? 'medium' : 'low';
    return 'low';
}

/** Dates that have rows, ascending. */
export function datesOf(rows: Row[]): string[] {
    return [...new Set(rows.map((r) => r.date))].sort();
}

/**
 * The hand-written part of an existing digest: the text after the marker line.
 * null when there is no file; throws when the file has no marker.
 */
export function manualSection(existing: string | null): string | null {
    if (existing === null) return null;
    const at = existing.indexOf(`\n${MANUAL_MARKER}\n`);
    if (at === -1) throw new Error(`no \`${MANUAL_MARKER}\` marker line: the file is not a generated digest`);
    return existing.slice(at + MANUAL_MARKER.length + 2);
}

/** What the generator writes carries no em dash; the manual section is not its text. */
const plain = (s: string): string => s.replace(/—/g, '-');

/**
 * The digest of `date`. `manual` is the text after the marker (null: the stub);
 * `source` names the state of the register it was read at.
 */
export function render(rows: Row[], date: string, manual: string | null, source: string): string {
    const day = rows.filter((r) => r.date === date);
    const count = (c: Confidence): number => day.filter((r) => confidence(r) === c).length;
    const rev = (v: Reversible): number => day.filter((r) => r.reversible === v).length;
    const ratified = count('ratified');

    const out: string[] = [
        `# Decisions digest ${date}`,
        '',
        `Generated by npm run docs:digest from docs/decisions.md at ${source}; rows dated ${date}: ${day.length} ` +
            `(ratified ${ratified}, provisional ${day.length - ratified}: high ${count('high')}, medium ${count('medium')}, ` +
            `low ${count('low')}, unmarked ${count('unmarked')}); ` +
            `reversible: branch ${rev('branch')}, trunk ${rev('trunk')}, persisted ${rev('persisted')}.`,
        '',
    ];

    const sections = new Map<number, Row[]>();
    for (const r of day) sections.set(r.sectionLine, [...(sections.get(r.sectionLine) ?? []), r]);
    for (const group of sections.values()) {
        // Array.prototype.sort is stable: file order within the same label.
        const sorted = [...group].sort((a, b) => RANK[confidence(a)] - RANK[confidence(b)]);
        out.push(`## ${plain(group[0].section || '(before the first heading)')}`, '');
        for (const r of sorted) {
            const fields = [r.evidence, r.verified, r.reversible].map((v) => v ?? '-').join('/');
            out.push(`- **${r.id}** · ${confidence(r)} · ${fields} · ${plain(r.title)} (decisions.md:${r.line})`);
        }
        out.push('');
    }
    if (day.length === 0) out.push(`No rows dated ${date}.`, '');

    out.push(MANUAL_MARKER);
    return `${out.join('\n')}\n${manual ?? MANUAL_STUB}`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
// frontend/scripts/gates -> frontend/scripts -> frontend -> repo root
const REPO = resolve(HERE, '..', '..', '..');
const REGISTER = resolve(REPO, 'docs/decisions.md');
const DIGEST_DIR = resolve(REPO, 'docs/digest');

interface Args {
    date: string | null;
    all: boolean;
    write: boolean;
}

function today(): string {
    const d = new Date();
    const p = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function usage(message: string): never {
    console.error(message);
    console.error('usage: npm run docs:digest [-- --date YYYY-MM-DD] [--all] [--write]');
    process.exit(1);
}

function parseArgs(argv: string[]): Args {
    const args: Args = { date: null, all: false, write: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--write') args.write = true;
        else if (a === '--all') args.all = true;
        else if (a === '--date') args.date = argv[++i] ?? usage('--date needs a value');
        else if (a.startsWith('--date=')) args.date = a.slice('--date='.length);
        else usage(`unknown argument: ${a}`);
    }
    if (args.date !== null && !DATE.test(args.date)) usage(`not a date YYYY-MM-DD: ${args.date}`);
    if (args.all && args.date !== null) usage('--all and --date exclude each other');
    return args;
}

/**
 * The commit the register was last changed in, not HEAD: the digest line then
 * changes only when the register does. A register with uncommitted edits says so.
 */
function registerSource(): string {
    const git = (args: string[]): { status: number | null; out: string } => {
        const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8' });
        return { status: r.status, out: (r.stdout ?? '').trim() };
    };
    const log = git(['log', '-1', '--format=%h', '--', 'docs/decisions.md']);
    if (log.status !== 0 || log.out === '') return 'an unknown commit (no git history for it)';
    const dirty = git(['diff', '--quiet', 'HEAD', '--', 'docs/decisions.md']).status !== 0;
    return dirty ? `${log.out} plus uncommitted edits` : log.out;
}

function rel(path: string): string {
    return path.startsWith(REPO + '/') ? path.slice(REPO.length + 1) : path;
}

function main(): void {
    const args = parseArgs(process.argv.slice(2));

    let text: string;
    try {
        text = readFileSync(REGISTER, 'utf8');
    } catch (err) {
        console.error(`cannot read ${rel(REGISTER)}: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
    }

    let rows: Row[];
    try {
        rows = parseRows(text);
    } catch (err) {
        if (!(err instanceof HeaderParseError)) throw err;
        console.error(`docs-digest: ${err.message} in ${rel(REGISTER)}`);
        for (const f of err.failures) {
            console.error('');
            console.error(`    ${rel(REGISTER)}:${f.line}: ${f.reason}`);
            console.error(`      ${f.text}`);
        }
        process.exit(2);
    }

    const skipped = nearMisses(text);
    if (skipped.length > 0) {
        console.error(
            `docs-digest: ${skipped.length} line(s) shaped like a row with an ID outside the grammar, skipped: ` +
                `${rel(REGISTER)}:${skipped.join(', ')}`,
        );
    }

    const source = registerSource();
    const dates = args.all ? datesOf(rows) : [args.date ?? today()];
    let refused = 0;
    for (const date of dates) {
        const file = resolve(DIGEST_DIR, `${date}.md`);
        const existing = existsSync(file) ? readFileSync(file, 'utf8') : null;
        let manual: string | null;
        try {
            manual = manualSection(existing);
        } catch (err) {
            refused++;
            console.error(`refused ${rel(file)}: ${err instanceof Error ? err.message : String(err)}`);
            continue;
        }
        const out = render(rows, date, manual, source);
        const n = rows.filter((r) => r.date === date).length;
        if (!args.write) {
            process.stdout.write(out);
            if (dates.length > 1) process.stdout.write('\n');
        } else if (out === existing) {
            console.log(`unchanged ${rel(file)} (${n} rows)`);
        } else {
            mkdirSync(DIGEST_DIR, { recursive: true });
            writeFileSync(file, out);
            console.log(`wrote ${rel(file)} (${n} rows)`);
        }
    }
    process.exit(refused > 0 ? 1 : 0);
}

// Run only as a script: the tests import the functions above.
const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();

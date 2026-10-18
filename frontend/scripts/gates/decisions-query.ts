/**
 * decisions-query.ts — read the decisions the prompt cites, not the whole register.
 *
 * RC-49 (2), AM-5: a session reads the rows it needs, with their amendments, instead
 * of docs/decisions.md in full. For each ID given it prints the canonical row text
 * (the lines of the register, unchanged), its status, its series and section and,
 * unless --no-related, the rows it amends or supersedes and the rows that amend or
 * supersede it. Depth one, no transitive closure. The CLI never writes.
 *
 * The row grammar is parseRows of docs-digest.ts, not reimplemented here. What this
 * file adds is the extent of a row (its lines up to the next blank line, heading or
 * list item, as parseRows reads the body) and the relation markers.
 *
 * Status: `superseded` when the row sits under `## Superate`, or an item of that
 * section points at it (`- R-RAIL-44 (...) — superata da D-UI-15`), or its own text
 * says it is superseded by a row; else `provisional` when its header says so; else
 * `active`. A row that another row merely names with `sostituisce` is not marked.
 *
 * Relation markers recognised in the text of a row (forms of the register, measured
 * with markerStats against the grep -i of the markers):
 *   - forward, this row -> the rows named right after the marker, in the same clause:
 *       `Amends X`, `amends X`, `Emenda X`, `emenda X`, `Emendamento a X`,
 *       `emendamento (b) di X`, `emendamento del X` (amends);
 *       `Supersedes X`, `supersedes X`, `Sostituisce X`, `sostituisce X` (supersedes).
 *   - backward, the rows named after `da` or `by` -> this row:
 *       `emendata da X`, `emendata il DATE da X`, `Amended by X`, `amended by X` (amends);
 *       `superata da X`, `superata il DATE da X`, `Superata per l'arco 1 da X`,
 *       `superseded by X` (supersedes).
 *   - recognised, no edge: `emendata il DATE` (the row amended itself), `emendamento
 *     spec §N`, `superata`/`superato` without a row after it, `renumbered by P-...`,
 *     plural and verb forms of the same stems (`emendamenti`, `sostituiscono`).
 * A name that is not a row of the register (a protocol clause, `P13`, a spec section,
 * a row of the archive) is a marker with no edge. A marker outside the extent of a row
 * and outside the Superate items is counted by markerStats as unattributed.
 *
 * ID argument: `RC-49`, `R-SIM-3`, `D-UI-15`, or the dated form of a shared sigla,
 * `R-B-3 (2026-08-05)` (one argument, or the date as the next one).
 *
 * Exit 0 when every ID was found; 1 when one is missing (`not found: <ID>` on stderr,
 * the found ones still printed) or on a usage error; 2 on a register header that
 * parseRows cannot read.
 *
 * Run: npm run decisions -- <ID> [<ID> ...] [--json] [--no-related]
 */

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { HeaderParseError, parseRows } from './docs-digest.ts';
import type { Row } from './docs-digest.ts';

export type Status = 'active' | 'provisional' | 'superseded';
export type EdgeKind = 'amends' | 'supersedes';
export type RelationName = 'amends' | 'amended-by' | 'supersedes' | 'superseded-by';

export interface Edge {
    from: Row;
    to: Row;
    kind: EdgeKind;
    /** 1-based line of the marker. */
    line: number;
    /** The marker as written. */
    via: string;
}

interface Span {
    owners: Row[];
    /** 1-based, inclusive: the first line and the last line of the item's own text (what is printed). */
    start: number;
    textEnd: number;
    /** The last line whose markers belong to the item: its text plus the paragraphs after a blank line, up to the next item or heading. */
    end: number;
}

export interface Register {
    lines: string[];
    rows: Row[];
    spans: Span[];
    edges: Edge[];
    /** Rows whose own text says they are superseded by a row, or that a Superate item points at. */
    supersededRows: Set<Row>;
    /** Marker lines the recogniser matched by form, with or without an edge. */
    markerLines: Set<number>;
    /** Marker lines that produced at least one edge. */
    edgeLines: Set<number>;
    /** Lines inside the extent of a row or of a Superate item. */
    covered: Set<number>;
}

/** The grep the coverage is measured against. */
export const MARKER_GREP = /amends|emend|supersed|sostituisc|superata|renumber|amended by/i;

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** True from a line that may continue a list item (parseRows reads the body the same way). */
const continues = (l: string): boolean => !(l.trim() === '' || l.startsWith('#') || l.startsWith('- '));
/**
 * A row written as a paragraph, `**R-VP-1** (2026-09-03) — ...` at column 0 without the
 * list dash: 169 of the register's rows (R-VP, R-VAL, R-LAY, R-FORM...), measured
 * 2026-10-18. parseRows reads list items only.
 */
const PARAGRAPH_ROW = /^\*\*[A-Z][A-Za-z0-9-]*\d(?:-bis)?\*\* \(/;
/** Where an item's own paragraphs stop: a heading, a list item, or the next paragraph row. */
const boundary = (l: string): boolean => /^#{1,3} /.test(l) || l.startsWith('- ') || PARAGRAPH_ROW.test(l);

/** `R-B-3` -> `R-B`, `RC-49` -> `RC`, `D-4-1` -> `D-4`, `R-B9-bis` -> `R-B9`. */
export function seriesOf(id: string): string {
    const s = id.replace(/-bis$/, '').replace(/-\d+$/, '');
    return s === id ? id : s;
}

/** The ID as the register writes it in the bold: `R-B-3 (2026-08-05)` when it carries its date. */
export function displayId(row: Row): string {
    return row.idDate !== undefined ? `${row.id} (${row.idDate})` : row.id;
}

const FORWARD: Array<{ re: RegExp; kind: EdgeKind }> = [
    { re: /\bamends\b/gi, kind: 'amends' },
    { re: /\bemenda\b/gi, kind: 'amends' },
    { re: /\bemendament[oi]\b(?:\s*\([^)]{1,12}\))?\s+(?:a|di|del|dell'|of|to)\s/gi, kind: 'amends' },
    { re: /\bsupersedes\b/gi, kind: 'supersedes' },
    { re: /\bsostituisc(?:e|ono)\b/gi, kind: 'supersedes' },
];
/** `emendata da X`, `superata il 2026-10-04 da X`, `amended by X`, `superseded by X`. */
const BACKWARD: Array<{ stem: RegExp; kind: EdgeKind }> = [
    { stem: /\b(?:emendat[aoie]|amended)\b[^.;:\n]{0,50}?\b(?:da|by)\s+/gi, kind: 'amends' },
    { stem: /\b(?:superat[aoie]|superseded)\b[^.;:\n]{0,50}?\b(?:da|by)\s+/gi, kind: 'supersedes' },
];
/** Stems with no row to follow: recognised, no edge. */
const PLAIN = /\b(?:emend\w*|supersed\w*|superat[aoie]|sostituisc\w*|renumber\w*|amends|amended)\b/gi;

/** The alternation of every row ID, longest first, so `R-B9-bis` wins over `R-B9`. */
function idAlternation(rows: Row[]): string {
    return [...new Set(rows.map((r) => r.id))].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
}
/** A known ID in free text: group 1 the ID, group 2 the date of a dated sigla. */
const idRe = (alt: string): RegExp => new RegExp(`(?<![A-Za-z0-9-])(${alt})(?![A-Za-z0-9]|-[A-Za-z0-9])(?:\\s*\\((\\d{4}-\\d{2}-\\d{2})\\))?`, 'g');

/** The rows an ID written in free text names (a dated form narrows a shared sigla). */
function resolveRows(byId: Map<string, Row[]>, id: string, date: string | undefined): Row[] {
    const all = byId.get(id) ?? [];
    if (date === undefined) return all;
    const narrowed = all.filter((r) => r.idDate === date || r.date === date);
    return narrowed.length > 0 ? narrowed : all;
}

/** Offset of the end of the clause that starts at `from`: `;`, `:`, a full stop, ` — `, or a comma that starts a new thought. */
function clauseEnd(text: string, from: number, alt: string): number {
    const limit = Math.min(text.length, from + 160);
    const tail = text.slice(from, limit);
    const m = new RegExp(`;|:|\\*\\*|\\.(?:\\s|$)|\\s—\\s|\\n\\s*\\n|,\\s+(?!(?:and|e|ed|o)\\s|\\(|[\`*]*(?:${alt}))`, 'i').exec(tail);
    return m ? from + m.index : limit;
}

/**
 * The rows of the register through parseRows, unchanged. A paragraph row is given the
 * list dash parseRows asks for (line numbers do not move). A paragraph row whose header
 * parseRows cannot read (`unattended (RC-25)`, a parenthesis inside the parenthesis) is
 * kept as a row with the fields the header line states plainly; a list item that fails
 * still throws HeaderParseError.
 */
function readRows(lines: string[]): Row[] {
    const work = lines.map((l) => (PARAGRAPH_ROW.test(l) ? `- ${l}` : l));
    const fallback: Row[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return [...parseRows(work.join('\n')), ...fallback].sort((a, b) => a.line - b.line);
        } catch (e) {
            if (!(e instanceof HeaderParseError)) throw e;
            const unreadable = e.failures.filter((f) => PARAGRAPH_ROW.test(lines[f.line - 1]));
            if (unreadable.length === 0) throw e;
            for (const f of unreadable) {
                const l = lines[f.line - 1];
                let section = '';
                let sectionLine = 0;
                for (let i = f.line - 2; i >= 0; i--) {
                    const h = /^#{2,3} (.*)$/.exec(lines[i]);
                    if (h) {
                        section = h[1].trim();
                        sectionLine = i + 1;
                        break;
                    }
                }
                const head = l.slice(0, 240);
                fallback.push({
                    id: /^\*\*([^*\s,]+)/.exec(l)?.[1] as string,
                    line: f.line,
                    date: /\((\d{4}-\d{2}-\d{2})/.exec(head)?.[1] ?? '',
                    provisional: /\bprovisional\b/.test(head),
                    unattended: /\bunattended\b/.test(head),
                    evidence: null,
                    verified: null,
                    reversible: null,
                    annotations: [],
                    section,
                    sectionLine,
                    title: '',
                });
                work[f.line - 1] = `~ ${l}`;
            }
        }
    }
    throw new Error('decisions-query: unreadable headers did not settle');
}

/** Build the register: rows, extents, relation edges. Throws HeaderParseError as parseRows does. */
export function loadRegister(text: string): Register {
    const lines = text.split('\n');
    const rows = readRows(lines);
    const byId = new Map<string, Row[]>();
    for (const r of rows) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);
    const alt = idAlternation(rows);

    const spans: Span[] = [];
    for (const r of rows) {
        let textEnd = r.line;
        while (textEnd < lines.length && continues(lines[textEnd])) textEnd++;
        let end = textEnd;
        while (end < lines.length && !boundary(lines[end])) end++;
        spans.push({ owners: [r], start: r.line, textEnd, end });
    }

    // Items of the Superate section that are not rows: pointers to a row that stays in its series.
    const rowLines = new Set(rows.map((r) => r.line));
    const superateAt = lines.findIndex((l) => /^## Superate\b/.test(l));
    const supersededRows = new Set<Row>(rows.filter((r) => /^Superate\b/.test(r.section)));
    if (superateAt !== -1) {
        for (let i = superateAt + 1; i < lines.length; i++) {
            if (/^## /.test(lines[i])) break;
            if (!lines[i].startsWith('- ') || rowLines.has(i + 1)) continue;
            let textEnd = i + 1;
            while (textEnd < lines.length && continues(lines[textEnd])) textEnd++;
            let end = textEnd;
            while (end < lines.length && !boundary(lines[end])) end++;
            const lead = /^- \**([A-Za-z0-9-]+)/.exec(lines[i]);
            const owners = lead ? byId.get(lead[1]) ?? [] : [];
            if (owners.length === 0) continue;
            for (const o of owners) supersededRows.add(o);
            spans.push({ owners, start: i + 1, textEnd, end });
        }
    }

    const edges: Edge[] = [];
    const markerLines = new Set<number>();
    const edgeLines = new Set<number>();
    const lineAt = (span: Span, text: string, offset: number): number => span.start + (text.slice(0, offset).match(/\n/g)?.length ?? 0);

    for (const span of spans) {
        const body = lines.slice(span.start - 1, span.end).join('\n').replace(/\n+$/, '');
        const consumed: Array<[number, number]> = [];
        const taken = (a: number, b: number): boolean => consumed.some(([s, e]) => a < e && b > s);

        const link = (from: Row[], to: Row[], kind: EdgeKind, line: number, via: string): void => {
            for (const f of from) {
                for (const t of to) {
                    if (f === t) continue;
                    if (!edges.some((e) => e.from === f && e.to === t && e.kind === kind)) edges.push({ from: f, to: t, kind, line, via });
                    edgeLines.add(line);
                }
            }
        };
        const named = (at: number): Row[] => {
            const end = clauseEnd(body, at, alt);
            const found: Row[] = [];
            for (const m of body.slice(at, end).matchAll(idRe(alt))) {
                found.push(...resolveRows(byId, m[1], m[2]));
            }
            return found;
        };

        for (const { stem, kind } of BACKWARD) {
            for (const m of body.matchAll(new RegExp(stem.source, stem.flags))) {
                const at = m.index + m[0].length;
                const sources = named(at).filter((r) => !span.owners.includes(r));
                // `ratified by Alfonso` is not a row: only an ID right after da/by counts.
                const first = new RegExp(`^[\`*]*(?:la |the |decisione |decision |clausola )?(?:${alt})(?![A-Za-z0-9])`).exec(body.slice(at));
                const line = lineAt(span, body, m.index);
                markerLines.add(line);
                consumed.push([m.index, m.index + m[0].length]);
                // `R-VP-15 as amended by R-VP-16` speaks of another row, not of the one that owns the text.
                if (!first || sources.length === 0 || /\bas\s+$/i.test(body.slice(Math.max(0, m.index - 4), m.index))) continue;
                link(sources, span.owners, kind, line, m[0].trim());
                if (kind === 'supersedes') for (const o of span.owners) supersededRows.add(o);
            }
        }
        for (const { re, kind } of FORWARD) {
            for (const m of body.matchAll(new RegExp(re.source, re.flags))) {
                if (taken(m.index, m.index + m[0].length)) continue;
                const line = lineAt(span, body, m.index);
                markerLines.add(line);
                consumed.push([m.index, m.index + m[0].length]);
                // `non emenda X`, `does not amend X`: the marker is there, the relation is not.
                if (/\b(?:non|not|never)\s+(?:\w+\s+)?$/i.test(body.slice(Math.max(0, m.index - 14), m.index))) continue;
                if (/^\s+(?:nothing|niente|nessun\w*|none)\b/i.test(body.slice(m.index + m[0].length, m.index + m[0].length + 12))) continue;
                link(span.owners, named(m.index + m[0].length), kind, line, m[0].trim());
            }
        }
        for (const m of body.matchAll(new RegExp(PLAIN.source, PLAIN.flags))) {
            if (taken(m.index, m.index + m[0].length)) continue;
            markerLines.add(lineAt(span, body, m.index));
        }
    }
    // Markers in lines that belong to no item (a section's prose, a bold item that is not a row).
    const covered = new Set<number>();
    for (const sp of spans) for (let n = sp.start; n <= sp.end; n++) covered.add(n);
    lines.forEach((l, i) => {
        if (!covered.has(i + 1) && new RegExp(PLAIN.source, 'i').test(l)) markerLines.add(i + 1);
    });
    return { lines, rows, spans, edges, supersededRows, markerLines, edgeLines, covered };
}

/**
 * The coverage of the recogniser against the grep of the markers: how many lines of
 * the register the grep finds, how many of them the recogniser matched by form, how
 * many of those sit inside the extent of a row, how many produced an edge, and the
 * lines it did not match.
 */
export function markerStats(reg: Register): { total: number; matched: number; attributed: number; withEdge: number; unmatched: number[] } {
    const grep = reg.lines.map((l, i) => (MARKER_GREP.test(l) ? i + 1 : 0)).filter((n) => n > 0);
    const unmatched = grep.filter((n) => !reg.markerLines.has(n));
    return {
        total: grep.length,
        matched: grep.length - unmatched.length,
        attributed: grep.filter((n) => reg.markerLines.has(n) && reg.covered.has(n)).length,
        withEdge: grep.filter((n) => reg.edgeLines.has(n)).length,
        unmatched,
    };
}

export function statusOf(reg: Register, row: Row): Status {
    if (reg.supersededRows.has(row)) return 'superseded';
    return row.provisional ? 'provisional' : 'active';
}

/** The canonical text of a row: its lines of the register, unchanged. */
export function rowText(reg: Register, row: Row): string {
    const span = reg.spans.find((s) => s.start === row.line && s.owners[0] === row) as Span;
    return reg.lines.slice(row.line - 1, span.textEnd).join('\n');
}

/** The rows an ID argument names: every row of that ID, narrowed by the date when the argument carries one. */
export function findRows(reg: Register, arg: string): Row[] {
    const m = /^(\S+?)(?:\s*\((\d{4}-\d{2}-\d{2})\))?$/.exec(arg.trim());
    if (!m) return [];
    const all = reg.rows.filter((r) => r.id === m[1]);
    return m[2] === undefined ? all : all.filter((r) => r.idDate === m[2] || r.date === m[2]);
}

export interface Related {
    row: Row;
    relation: string;
}

/** Rows one edge away, each once, with the relations named (`amends, amended-by`). */
export function relatedOf(reg: Register, row: Row): Related[] {
    const out = new Map<Row, RelationName[]>();
    const add = (r: Row, name: RelationName): void => {
        const names = out.get(r) ?? [];
        if (!names.includes(name)) names.push(name);
        out.set(r, names);
    };
    for (const e of reg.edges) {
        if (e.from === row) add(e.to, e.kind);
        if (e.to === row) add(e.from, e.kind === 'amends' ? 'amended-by' : 'superseded-by');
    }
    return [...out.entries()].map(([r, names]) => ({ row: r, relation: names.join(', ') }));
}

export interface Result {
    id: string;
    status: Status;
    series: string;
    section: string;
    row: string;
    related: Array<{ id: string; relation: string; row: string }>;
}

export function resultOf(reg: Register, row: Row, withRelated: boolean): Result {
    return {
        id: displayId(row),
        status: statusOf(reg, row),
        series: seriesOf(row.id),
        section: row.section,
        row: rowText(reg, row),
        related: withRelated ? relatedOf(reg, row).map((r) => ({ id: displayId(r.row), relation: r.relation, row: rowText(reg, r.row) })) : [],
    };
}

function render(r: Result, withRelated: boolean): string {
    const out = [`== ${r.id}  [${r.status}]  series ${r.series}  section: ${r.section}`, r.row];
    if (withRelated) {
        for (const rel of r.related) out.push('', `-- ${rel.relation}: ${rel.id}`, rel.row);
    }
    return out.join('\n');
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');

interface Args {
    ids: string[];
    json: boolean;
    related: boolean;
    root: string;
}

function parseArgs(argv: string[]): Args | string {
    const a: Args = { ids: [], json: false, related: true, root: REPO };
    for (let i = 0; i < argv.length; i++) {
        const t = argv[i];
        if (t === '--json') a.json = true;
        else if (t === '--no-related') a.related = false;
        else if (t === '--root') {
            if (argv[i + 1] === undefined) return '--root needs a directory';
            a.root = resolve(argv[++i]);
        } else if (t.startsWith('--')) return `unknown option ${t}`;
        else if (/^\(\d{4}-\d{2}-\d{2}\)$/.test(t) && a.ids.length > 0) a.ids[a.ids.length - 1] += ` ${t}`;
        else a.ids.push(t);
    }
    return a.ids.length === 0 ? 'no ID given' : a;
}

function main(): void {
    const args = parseArgs(process.argv.slice(2));
    if (typeof args === 'string') {
        process.stderr.write(`decisions: ${args}\nusage: npm run decisions -- <ID> [<ID> ...] [--json] [--no-related]\n`);
        process.exit(1);
    }
    const file = resolve(args.root, 'docs/decisions.md');
    if (!existsSync(file)) {
        process.stderr.write(`decisions: cannot read ${file}\n`);
        process.exit(1);
    }
    let reg: Register;
    try {
        reg = loadRegister(readFileSync(file, 'utf8'));
    } catch (e) {
        if (!(e instanceof HeaderParseError)) throw e;
        for (const f of e.failures) process.stderr.write(`decisions: ${file}:${f.line}: ${f.reason}\n`);
        process.exit(2);
    }
    const results: Result[] = [];
    let missing = 0;
    for (const arg of args.ids) {
        const rows = findRows(reg, arg);
        if (rows.length === 0) {
            process.stderr.write(`not found: ${arg}\n`);
            missing++;
            continue;
        }
        for (const row of rows) results.push(resultOf(reg, row, args.related));
    }
    if (args.json) process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    else process.stdout.write(results.map((r) => render(r, args.related)).join('\n\n') + (results.length > 0 ? '\n' : ''));
    process.exitCode = missing > 0 ? 1 : 0;
}

const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main();

/**
 * log-find.ts — find the log entries a session needs, not the last N.
 *
 * RC-49 (2), AM-5: a session reads the log entries for its DOVE files, its front and the
 * Prompt-IDs its prompt cites. Sources, in this order: docs/claude-code-log.md, every
 * docs/log-inbox/*.md, docs/claude-code-log-archive.md. The archive (4.9 MB) is read line
 * by line, never whole, and only when the active log and the inboxes gave fewer than
 * --limit hits, or when --since reaches before the oldest entry of the active log.
 * Nothing is written or rotated (that stays with rotate-log.ts).
 *
 * Criteria (OR-ed; an entry needs to satisfy one):
 *   --file <path>     the `**Files touched**` field contains the path, also with a leading
 *                     `frontend/` added or removed.
 *   --front <slug>    the inbox docs/log-inbox/<slug>.md, plus the entries whose heading or
 *                     `**Prompt**` field cites a prompt of that front: its Prompt-ID or its
 *                     file name. A prompt belongs to a front by the `Front:` line of its
 *                     header (parseFrontLine of ../lane-tracking.mjs, the rule of Check E
 *                     of check-docs.ts); its Prompt-ID is the header's `Prompt-ID:` line,
 *                     else the date and time of the file name.
 *   --prompt <P-ID>   the heading or the `**Prompt**` field carries the Prompt-ID (or the
 *                     file stamp `YYYY-MM-DD_HHmm`), or the `**Prompt document name**` or
 *                     `**Corregge**` field starts with its document name `YYYY-MM-DD HH:mm`
 *                     (the entry that corrects it).
 *   --id <P-ID>       the same as --prompt.
 *
 * Output: one line per hit, `<source>:<line> <heading>`, newest first; --full adds the
 * body of the entry after each line. --limit defaults to 20. --since YYYY-MM-DD drops
 * older entries. Exit 0 with hits, 1 with none, 2 on a usage error.
 *
 * Run: npm run log:find -- (--file <path> | --front <slug> | --prompt <P-ID> | --id <P-ID>)... [--full] [--limit <n>] [--since <YYYY-MM-DD>]
 */

import { createReadStream, existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { basename, dirname, resolve } from 'node:path';
import { ENTRY_HEADING, TIMESTAMP_PREFIX, entryStartLines, parseFields, splitLog } from './log-tools.ts';
import { parseFrontLine } from '../lane-tracking.mjs';

export interface LogEntry {
    /** Repo-relative path of the file. */
    source: string;
    /** 1-based line of the heading in that file. */
    line: number;
    heading: string;
    date: string;
    /** `HH:mm` when the heading carries one, else ''. */
    time: string;
    /** The entry as written, heading included. */
    text: string;
}

export interface Criteria {
    files: string[];
    fronts: string[];
    prompts: string[];
}

export interface FrontPrompts {
    ids: Set<string>;
    names: Set<string>;
}

export const DEFAULT_LIMIT = 20;
const ACTIVE = 'docs/claude-code-log.md';
const INBOX_DIR = 'docs/log-inbox';
const ARCHIVE = 'docs/claude-code-log-archive.md';
const PROMPTS_DIR = 'docs/prompts';

const PROMPT_ID = /P-\d{4}-\d{2}-\d{2}-\d{4}/g;
const HEADER_PROMPT_ID = /^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/;
const PROMPT_FILE_TIME = /^(?:claude_)?(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})_/;
const MD_NAME = /[\w.-]+\.md/g;

const entryOf = (source: string, line: number, heading: string, date: string, text: string): LogEntry => ({
    source,
    line,
    heading,
    date,
    time: /^## \d{4}-\d{2}-\d{2} (\d{2}:\d{2})/.exec(heading)?.[1] ?? '',
    text,
});

/** The entries of a log file's text, with the line of each heading. */
export function entriesOfText(text: string, source: string): LogEntry[] {
    const log = splitLog(text);
    const starts = entryStartLines(log);
    return log.entries.map((e, i) => entryOf(source, starts[i], e.heading, e.date, e.text));
}

/** The entries of a file read line by line, one at a time in memory. */
export async function* streamEntries(file: string, source: string): AsyncGenerator<LogEntry> {
    const rl = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity });
    let cur: { line: number; heading: string; date: string; lines: string[] } | null = null;
    let n = 0;
    for await (const l of rl) {
        n++;
        const m = ENTRY_HEADING.exec(l);
        if (m) {
            if (cur) yield entryOf(source, cur.line, cur.heading, cur.date, cur.lines.join('\n'));
            cur = { line: n, heading: l, date: m[1], lines: [l] };
        } else if (cur) {
            cur.lines.push(l);
        }
    }
    if (cur) yield entryOf(source, cur.line, cur.heading, cur.date, cur.lines.join('\n'));
}

/** The Prompt-ID of a prompt text and file name, as Check E of check-docs.ts reads it. */
export function promptIdOf(name: string, text: string): string | null {
    for (const line of text.split('\n')) {
        if (line.startsWith('## ')) break;
        const m = HEADER_PROMPT_ID.exec(line);
        if (m) return m[1];
    }
    const f = PROMPT_FILE_TIME.exec(name);
    return f ? `P-${f[1]}-${f[2]}${f[3]}` : null;
}

/** The Prompt-IDs and file names of the prompts whose `Front:` line is `slug`. */
export function promptsOfFront(root: string, slug: string): FrontPrompts {
    const out: FrontPrompts = { ids: new Set(), names: new Set() };
    const dir = resolve(root, PROMPTS_DIR);
    if (!existsSync(dir)) return out;
    for (const name of readdirSync(dir)) {
        if (!name.endsWith('.md')) continue;
        const text = readFileSync(resolve(dir, name), 'utf8');
        if (parseFrontLine(text) !== slug) continue;
        out.names.add(name);
        const id = promptIdOf(name, text);
        if (id) out.ids.add(id);
    }
    return out;
}

/** `P-2026-10-18-0945` -> the stamp `2026-10-18_0945` and the document name `2026-10-18 09:45`. */
export function promptForms(id: string): { id: string; stamp: string; docName: string } {
    const m = /^P-(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})$/.exec(id);
    return m ? { id, stamp: `${m[1]}_${m[2]}${m[3]}`, docName: `${m[1]} ${m[2]}:${m[3]}` } : { id, stamp: id, docName: id };
}

const startsWithKey = (value: string | undefined, key: string): boolean => {
    if (value === undefined) return false;
    const m = TIMESTAMP_PREFIX.exec(value.trim());
    return (m ? m[1] : value.trim()) === key;
};

export interface Matcher {
    (entry: LogEntry): boolean;
}

/** The predicate of the criteria; `fronts` maps each --front slug to its prompts. */
export function matcherOf(criteria: Criteria, fronts: Map<string, FrontPrompts>): Matcher {
    const files = criteria.files.flatMap((f) => {
        const bare = f.startsWith('frontend/') ? f.slice('frontend/'.length) : f;
        return [...new Set([f, bare, `frontend/${bare}`])];
    });
    const prompts = criteria.prompts.map(promptForms);
    return (entry) => {
        const fields = files.length > 0 || prompts.length > 0 || fronts.size > 0 ? parseFields(entry.text) : new Map<string, string>();
        const cited = `${entry.heading}\n${fields.get('Prompt') ?? ''}`;

        if (files.length > 0) {
            const touched = fields.get('Files touched') ?? '';
            if (files.some((f) => touched.includes(f))) return true;
        }
        for (const p of prompts) {
            if (cited.includes(p.id) || cited.includes(p.stamp)) return true;
            if (startsWithKey(fields.get('Prompt document name'), p.docName)) return true;
            if (startsWithKey(fields.get('Corregge'), p.docName)) return true;
        }
        for (const [slug, front] of fronts) {
            if (entry.source === `${INBOX_DIR}/${slug}.md`) return true;
            if ((cited.match(PROMPT_ID) ?? []).some((id) => front.ids.has(id))) return true;
            if ((cited.match(MD_NAME) ?? []).some((n) => front.names.has(basename(n)))) return true;
        }
        return false;
    };
}

const stamp = (e: LogEntry): string => `${e.date} ${e.time || '00:00'}`;

export interface FindOptions {
    limit: number;
    since?: string;
    full?: boolean;
}

export interface FindResult {
    hits: LogEntry[];
    archiveRead: boolean;
}

/**
 * Newest first. Equal stamps keep source order, except inside an inbox, which is
 * appended to: its later entry is the newer one.
 */
function newestFirst(a: LogEntry[]): LogEntry[] {
    return a
        .map((e, i) => [e, i] as const)
        .sort(([x, i], [y, j]) => {
            if (stamp(x) !== stamp(y)) return stamp(x) < stamp(y) ? 1 : -1;
            return x.source === y.source && x.source.startsWith(`${INBOX_DIR}/`) ? y.line - x.line : i - j;
        })
        .map(([e]) => e);
}

export async function findEntries(root: string, criteria: Criteria, opts: FindOptions): Promise<FindResult> {
    const fronts = new Map<string, FrontPrompts>();
    for (const slug of criteria.fronts) fronts.set(slug, promptsOfFront(root, slug));
    const match = matcherOf(criteria, fronts);
    const keep = (e: LogEntry): boolean => (opts.since === undefined || e.date >= opts.since) && match(e);

    const activeFile = resolve(root, ACTIVE);
    const active = existsSync(activeFile) ? entriesOfText(readFileSync(activeFile, 'utf8'), ACTIVE) : [];
    const inboxDir = resolve(root, INBOX_DIR);
    const inbox = existsSync(inboxDir)
        ? readdirSync(inboxDir)
              .filter((n) => n.endsWith('.md'))
              .sort()
              .flatMap((n) => entriesOfText(readFileSync(resolve(inboxDir, n), 'utf8'), `${INBOX_DIR}/${n}`))
        : [];

    let hits = newestFirst([...active, ...inbox].filter(keep));
    const oldestActive = active.reduce<string | null>((min, e) => (min === null || e.date < min ? e.date : min), null);
    const reachesBack = opts.since !== undefined && (oldestActive === null || opts.since < oldestActive);
    const archiveFile = resolve(root, ARCHIVE);
    let archiveRead = false;
    if ((hits.length < opts.limit || reachesBack) && existsSync(archiveFile)) {
        archiveRead = true;
        const fromArchive: LogEntry[] = [];
        for await (const e of streamEntries(archiveFile, ARCHIVE)) if (keep(e)) fromArchive.push(e);
        hits = newestFirst([...hits, ...fromArchive]);
    }
    return { hits: hits.slice(0, opts.limit), archiveRead };
}

export function renderHits(hits: LogEntry[], full: boolean): string {
    return hits
        .map((e) => {
            const head = `${e.source}:${e.line} ${e.heading}`;
            if (!full) return head;
            const body = e.text.split('\n').slice(1).join('\n').replace(/\s+$/, '');
            return `${head}\n${body}\n`;
        })
        .join('\n');
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');

interface Args extends FindOptions {
    criteria: Criteria;
    root: string;
}

function parseArgs(argv: string[]): Args | string {
    const a: Args = { criteria: { files: [], fronts: [], prompts: [] }, limit: DEFAULT_LIMIT, full: false, root: REPO };
    for (let i = 0; i < argv.length; i++) {
        const t = argv[i];
        const value = (): string | null => (argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? null : argv[++i]);
        if (t === '--full') a.full = true;
        else if (t === '--file' || t === '--front' || t === '--prompt' || t === '--id' || t === '--limit' || t === '--since' || t === '--root') {
            const v = value();
            if (v === null) return `${t} needs a value`;
            if (t === '--file') a.criteria.files.push(v);
            else if (t === '--front') a.criteria.fronts.push(v);
            else if (t === '--prompt' || t === '--id') a.criteria.prompts.push(v);
            else if (t === '--root') a.root = resolve(v);
            else if (t === '--limit') {
                if (!/^[1-9]\d*$/.test(v)) return `--limit needs a positive integer, got \`${v}\``;
                a.limit = Number(v);
            } else {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return `--since needs YYYY-MM-DD, got \`${v}\``;
                a.since = v;
            }
        } else return `unknown argument ${t}`;
    }
    const c = a.criteria;
    return c.files.length + c.fronts.length + c.prompts.length === 0 ? 'no criterion: give --file, --front, --prompt or --id' : a;
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    if (typeof args === 'string') {
        process.stderr.write(`log:find: ${args}\nusage: npm run log:find -- (--file <path> | --front <slug> | --prompt <P-ID> | --id <P-ID>)... [--full] [--limit <n>] [--since <YYYY-MM-DD>]\n`);
        process.exit(2);
    }
    const { hits } = await findEntries(args.root, args.criteria, args);
    if (hits.length > 0) process.stdout.write(`${renderHits(hits, args.full === true)}\n`);
    process.exitCode = hits.length > 0 ? 0 : 1;
}

const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
    main().catch((e: unknown) => {
        process.stderr.write(`log:find: ${e instanceof Error ? e.message : String(e)}\n`);
        process.exitCode = 2;
    });
}

/**
 * trace-index.ts — the trace graph of the harness, derived from its sources.
 *
 * Stage 1 of P-2026-09-27-1030 (discovery report
 * docs/discovery/discovery_2026-09-27_trace_monitor.md, sections 8.1-8.3). Every
 * link is declared once, in the artifact born later (a prompt header cites its
 * chat, a commit its prompt, a log entry its prompt); this script only reads
 * those declarations and never writes one. Inverse links are left to the reader.
 *
 * Nodes: lane (a folder of ~/.jjodel-lanes), prompt (a Prompt-ID, one or more
 * files), chat, decision (a row of docs/decisions.md), commit, logEntry (active
 * log, archive, inboxes), check (a probe log in a lane folder), requirement
 * (stage 2: the type exists, no source yet). Edges, each with the place it was
 * declared: runs, openedBy, cites, closedBy, reports, corrects, foundIn,
 * decidedIn, citesDecision, measures (realizes, parent, verifies: stage 2).
 *
 * An item that does not parse, or a link whose target does not exist, is a miss
 * with its reason, never a failure; items dated before TRACE_FROM (the first
 * prompt with a Prompt-ID) report no miss: the sources are not back-filled.
 *
 * The index carries, for every input, its path, whether it was present and a
 * content hash, plus the HEAD sha; nodes, edges, misses and sources are sorted,
 * so two runs over the same inputs print the same bytes.
 *
 * Reuses docs-digest.ts (the decision rows) and log-tools.ts (the log entries)
 * as they are. Plain node:*, no dependency.
 *
 * Run: npm run trace:index [-- --repo <tree>] [--lanes <dir>] [--trunk <branch>] [--out <file>]
 *   the index JSON on stdout (or in --out), the counts per type on stderr.
 * Exit 0 when the index is built, whatever its misses; 1 on a usage error.
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { confidence, HeaderParseError, nearMisses, parseRows } from './docs-digest.ts';
import type { Confidence, Row } from './docs-digest.ts';
import { entryStartLines, entryType, parseFields, splitLog, TIMESTAMP_PREFIX } from './log-tools.ts';

export const SCHEMA = 'jjodel-trace/1';
/** The first prompt with a Prompt-ID header (report, 4.1): no miss is reported for an item dated before it. */
export const TRACE_FROM = '2026-09-17';
export const DEFAULT_TRUNK = 'alfonso-frontend-jjtl';
export const LIMIT_MINUTES = 90;

export type NodeType = 'lane' | 'prompt' | 'chat' | 'decision' | 'commit' | 'logEntry' | 'check' | 'requirement';
export type EdgeType =
    | 'runs' | 'openedBy' | 'cites' | 'closedBy' | 'reports' | 'corrects' | 'foundIn'
    | 'decidedIn' | 'citesDecision' | 'measures' | 'realizes' | 'parent' | 'verifies';

export interface TraceNode {
    type: NodeType;
    id: string;
    [attribute: string]: unknown;
}

export interface TraceEdge {
    type: EdgeType;
    /** `<type>:<id>` */
    from: string;
    to: string;
    /** Where the link is declared: `<file>:<line>`, `commit <sha>`, or a lane file. */
    source: string;
}

export interface Miss {
    /** The node type of the item that did not parse or link. */
    type: NodeType;
    source: string;
    reason: string;
}

export interface SourceRecord {
    path: string;
    present: boolean;
    hash: string | null;
}

export interface TraceIndex {
    schema: typeof SCHEMA;
    head: string | null;
    sources: SourceRecord[];
    nodes: TraceNode[];
    edges: TraceEdge[];
    misses: Miss[];
}

const PROMPT_ID = /P-\d{4}-\d{2}-\d{2}-\d{4}/g;
const CHAT_ID = /C-\d{4}-\d{2}-\d{2}-\d{4}/g;
const HEADER_ID = /^#*\s*Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})\b/;
const OUTCOME = /^Outcome:\s*(done|hard-stop|question|blocked)\b/;
const DECISION_REF = /\b(R[A-Z]*(?:-[A-Z]+)?-)(\d+)(?:\.\.(\d+))?/g;
const SHA = /^[0-9a-f]{7,40}$/;

const ids = (text: string, re: RegExp): string[] => [...new Set(text.match(re) ?? [])];
const sha1 = (data: string | Buffer): string => createHash('sha1').update(data).digest('hex');
/** The date of a Prompt-ID or of a prompt file name, YYYY-MM-DD, or ''. */
const dateOf = (s: string): string => (/(\d{4}-\d{2}-\d{2})/.exec(s) || [])[1] ?? '';
const promptOfStamp = (stamp: string): string => 'P-' + stamp.slice(0, 10) + '-' + stamp.slice(11, 13) + stamp.slice(14, 16);

// ── prompts ──────────────────────────────────────────────────────────────────

export interface ParsedPrompt {
    file: string;
    id: string | null;
    title: string;
    chat: string | null;
    laneKind: string | null;
    status: string | null;
    statusSha: string | null;
    misses: Miss[];
}

/** The header of a prompt file: the lines before its first `## `, the id pattern tolerant of a trailing annotation or a `#` (report, 4.1). */
export function parsePrompt(file: string, text: string): ParsedPrompt {
    const lines = text.split('\n');
    const end = lines.findIndex((l) => l.startsWith('## '));
    const header = end === -1 ? lines : lines.slice(0, end);
    const field = (name: string): string | null => {
        const l = header.find((x) => x.startsWith(name + ':'));
        return l === undefined ? null : l.slice(name.length + 1).trim();
    };
    const idLine = header.map((l) => HEADER_ID.exec(l)).find((m) => m);
    const id = idLine ? idLine[1] : null;
    const titleLine = header.find((l) => /^# /.test(l) && !HEADER_ID.test(l));
    const chat = field('Chat');
    const lane = field('Lane');
    const status = field('Status');
    let statusSha: string | null = null;
    if (status) {
        const m = /·\s*`?([0-9a-f]{7,40})\b/.exec(status) || /`([0-9a-f]{7,40})`/.exec(status);
        statusSha = m ? m[1] : null;
    }
    const misses: Miss[] = [];
    const dated = (id ? dateOf(id) : dateOf(basename(file))) >= TRACE_FROM && /^claude_\d{4}-\d{2}-\d{2}_\d{4}_/.test(basename(file));
    if (dated) {
        if (!id) misses.push({ type: 'prompt', source: file, reason: 'no Prompt-ID in the header' });
        else {
            if (chat === null) misses.push({ type: 'prompt', source: file, reason: 'no Chat: line' });
            if (lane === null) misses.push({ type: 'prompt', source: file, reason: 'no Lane: line' });
            if (status === null) misses.push({ type: 'prompt', source: file, reason: 'no Status: line' });
        }
    }
    return {
        file,
        id,
        title: titleLine ? titleLine.slice(2).trim() : '',
        chat: chat ? (ids(chat, CHAT_ID)[0] ?? null) : null,
        laneKind: lane ? (/^([A-Za-z-]+)/.exec(lane) || [])[1] ?? null : null,
        status: status ? (/^(da eseguire|eseguito)\b/.exec(status) || [])[1] ?? 'other' : null,
        statusSha,
        misses,
    };
}

// ── decisions ────────────────────────────────────────────────────────────────

export interface ParsedDecision {
    id: string;
    line: number;
    date: string;
    section: string;
    title: string;
    confidence: Confidence;
    reversible: string | null;
    /** The P- and C-ids the row cites, else those of its section preamble. */
    sources: string[];
    sourceLine: number;
}

export interface ParsedDecisions {
    file: string;
    rows: ParsedDecision[];
    misses: Miss[];
}

/** The register through docs-digest.ts; a header it cannot read is a miss and the rest still parses. */
export function parseDecisions(file: string, text: string): ParsedDecisions {
    const lines = text.split('\n');
    const misses: Miss[] = [];
    let rows: Row[];
    try {
        rows = parseRows(text);
    } catch (err) {
        if (!(err instanceof HeaderParseError)) throw err;
        const bad = new Set(err.failures.map((f) => f.line));
        for (const f of err.failures) misses.push({ type: 'decision', source: `${file}:${f.line}`, reason: 'row header: ' + f.reason });
        rows = parseRows(lines.map((l, i) => (bad.has(i + 1) ? '' : l)).join('\n'));
    }
    for (const n of nearMisses(text)) {
        misses.push({ type: 'decision', source: `${file}:${n}`, reason: 'near miss: a row-shaped line with an id outside the grammar' });
    }
    const out: ParsedDecision[] = [];
    for (const r of rows) {
        const body = [lines[r.line - 1]];
        for (let j = r.line; j < lines.length; j++) {
            const l = lines[j];
            if (l.trim() === '' || l.startsWith('#') || l.startsWith('- ')) break;
            body.push(l);
        }
        const preamble: string[] = [];
        for (let j = r.sectionLine; j > 0 && j < lines.length && !lines[j].startsWith('- '); j++) preamble.push(lines[j]);
        const own = [...ids(body.join('\n'), PROMPT_ID), ...ids(body.join('\n'), CHAT_ID)];
        const sec = [...ids(preamble.join('\n'), PROMPT_ID), ...ids(preamble.join('\n'), CHAT_ID)];
        const sources = own.length ? own : sec;
        if (sources.length === 0 && r.date >= TRACE_FROM) {
            misses.push({ type: 'decision', source: `${file}:${r.line}`, reason: 'no prompt or chat cited: the row and its section name none' });
        }
        out.push({
            id: r.id, line: r.line, date: r.date, section: r.section, title: r.title,
            confidence: confidence(r), reversible: r.reversible, sources,
            sourceLine: own.length ? r.line : r.sectionLine,
        });
    }
    return { file, rows: out, misses };
}

// ── log entries ──────────────────────────────────────────────────────────────

export interface ParsedEntry {
    id: string;
    file: string;
    line: number;
    date: string;
    kind: 'task' | 'ticket';
    heading: string;
    outcome: string | null;
    smoke: string | null;
    priority: string | null;
    /** The Prompt-ID of `Prompt document name`. */
    reports: string | null;
    corrects: string | null;
    foundIn: string[];
}

export interface ParsedLog {
    file: string;
    entries: ParsedEntry[];
}

/**
 * The entries of a log file through log-tools.ts. The id hashes the heading and
 * the first field line: an entry keeps its id when the fold or the rotation
 * moves it, verbatim, to another file.
 */
export function parseLogFile(file: string, text: string): ParsedLog {
    const log = splitLog(text);
    const starts = entryStartLines(log);
    const seen = new Map<string, number>();
    const entries = log.entries.map((e, i): ParsedEntry => {
        const f = parseFields(e.text);
        const first = e.text.split('\n').find((l) => /^\*\*[^*]+\*\*:/.test(l)) ?? '';
        let id = 'log:' + sha1(e.heading + '\n' + first).slice(0, 10);
        const n = (seen.get(id) ?? 0) + 1;
        seen.set(id, n);
        if (n > 1) id += '-' + n;
        const stamp = (v: string | undefined): string | null => {
            const m = v === undefined ? null : TIMESTAMP_PREFIX.exec(v.trim());
            return m ? promptOfStamp(m[1]) : null;
        };
        const corr = f.get('Corregge');
        const found = f.get('Found in');
        return {
            id,
            file,
            line: starts[i],
            date: e.date,
            kind: entryType(e),
            heading: e.heading.replace(/^## /, ''),
            outcome: f.get('Outcome') ?? null,
            smoke: f.has('Smoke visivo') ? (f.get('Smoke visivo') || '').split(/[\s(—]/)[0] || null : null,
            priority: f.get('Priority') ?? null,
            reports: stamp(f.get('Prompt document name')),
            corrects: corr && corr.trim() !== '—' ? stamp(corr) : null,
            foundIn: found ? [...ids(found, PROMPT_ID), ...ids(found, CHAT_ID)] : [],
        };
    });
    return { file, entries };
}

// ── commits ──────────────────────────────────────────────────────────────────

export interface ParsedCommit {
    sha: string;
    date: string;
    subject: string;
    merge: boolean;
    models: string[];
    sessions: string[];
    prompts: string[];
    promptsFrom: 'subject' | 'body' | null;
    decisions: string[];
}

/** The git log format parseCommits reads. */
export const GIT_FORMAT = '%H%x1f%P%x1f%cI%x1f%s%x1f%B%x1e';

/** Decision ids of a text in order, a range `R-SIM-73..76` expanded. */
function decisionRefs(text: string): string[] {
    const out: string[] = [];
    for (const m of text.matchAll(DECISION_REF)) {
        const a = Number(m[2]);
        const b = m[3] === undefined ? a : Number(m[3]);
        for (let k = a; k <= b && k - a < 50; k++) out.push(m[1] + k);
    }
    return [...new Set(out)];
}

/**
 * Commits from `git log --format=GIT_FORMAT`. `Model:` and `Claude-Session:` are
 * read as body lines, not as git trailers: 114 `Model:` lines sit before a blank
 * line and git does not parse them (report, 4.4). A commit cites the Prompt-IDs of
 * its subject, else those of its body.
 */
export function parseCommits(text: string): ParsedCommit[] {
    const out: ParsedCommit[] = [];
    for (const rec of text.split('\x1e')) {
        const r = rec.replace(/^\n/, '');
        if (r.trim() === '') continue;
        const [sha, parents, date, subject, raw = ''] = r.split('\x1f');
        const body = raw.split('\n').slice(1).join('\n');
        const lines = body.split('\n');
        const values = (key: string) => lines.filter((l) => l.startsWith(key + ':')).map((l) => l.slice(key.length + 1).trim()).filter((v) => v !== '');
        const fromSubject = ids(subject, PROMPT_ID);
        const fromBody = ids(body, PROMPT_ID);
        out.push({
            sha,
            date,
            subject,
            merge: parents.trim().split(/\s+/).length > 1,
            models: values('Model'),
            sessions: values('Claude-Session'),
            prompts: fromSubject.length ? fromSubject : fromBody,
            promptsFrom: fromSubject.length ? 'subject' : fromBody.length ? 'body' : null,
            decisions: decisionRefs(subject),
        });
    }
    return out;
}

// ── lane logs ────────────────────────────────────────────────────────────────

export interface LogSummary {
    runs: number;
    model: string | null;
    firstEventAt: string | null;
    lastEventAt: string | null;
    lastTool: { name: string; at: string | null; detail: string } | null;
    toolCalls: number;
    costUsd: number | null;
    outcome: string | null;
    outcomeLine: string | null;
}

function toolDetail(name: string, input: Record<string, unknown> | undefined): string {
    if (!input) return '';
    const s = (v: unknown) => (typeof v === 'string' ? v : '');
    let d = '';
    if (name === 'Bash') d = s(input.description) || s(input.command);
    else if (s(input.file_path)) d = basename(s(input.file_path));
    else d = s(input.description) || s(input.pattern) || s(input.skill);
    d = d.replace(/\s+/g, ' ').trim();
    return d.length > 120 ? d.slice(0, 119) + '…' : d;
}

/**
 * The summary of a lane's stream-json, fed in chunks as the log grows: a line
 * cut between two reads waits for its end. Only `assistant` and `user` events
 * carry a timestamp (report, 2.3); `system:init` opens a run.
 */
export class LogAccumulator {
    private rest = '';
    private s: LogSummary = {
        runs: 0, model: null, firstEventAt: null, lastEventAt: null, lastTool: null, toolCalls: 0, costUsd: null, outcome: null, outcomeLine: null,
    };

    push(chunk: string): void {
        const text = this.rest + chunk;
        const cut = text.lastIndexOf('\n');
        this.rest = cut === -1 ? text : text.slice(cut + 1);
        if (cut === -1) return;
        for (const line of text.slice(0, cut).split('\n')) this.line(line);
    }

    private line(line: string): void {
        if (line === '' || line.startsWith('{"type":"system","subtype":"thinking_tokens"') || line.startsWith('{"type":"rate_limit_event"')) return;
        let e: Record<string, unknown>;
        try {
            e = JSON.parse(line);
        } catch {
            return;
        }
        const s = this.s;
        if (e.type === 'system' && e.subtype === 'init') {
            s.runs++;
            if (typeof e.model === 'string') s.model = e.model;
            return;
        }
        if (e.type === 'result') {
            if (typeof e.total_cost_usd === 'number') s.costUsd = e.total_cost_usd;
            return;
        }
        if (e.type !== 'assistant' && e.type !== 'user') return;
        const at = typeof e.timestamp === 'string' ? e.timestamp : null;
        if (at) {
            if (s.firstEventAt === null) s.firstEventAt = at;
            s.lastEventAt = at;
        }
        if (e.type !== 'assistant') return;
        const content = (e.message as { content?: unknown } | undefined)?.content;
        if (!Array.isArray(content)) return;
        for (const b of content as Array<Record<string, unknown>>) {
            if (b.type === 'tool_use' && typeof b.name === 'string') {
                s.toolCalls++;
                s.lastTool = { name: b.name, at, detail: toolDetail(b.name, b.input as Record<string, unknown> | undefined) };
            } else if (b.type === 'text' && typeof b.text === 'string') {
                for (const l of b.text.split('\n')) {
                    const t = l.trim();
                    if (!t.startsWith('Outcome:')) continue;
                    s.outcomeLine = t;
                    const m = OUTCOME.exec(t);
                    s.outcome = m ? m[1] : 'unparsed';
                }
            }
        }
    }

    summary(): LogSummary {
        return { ...this.s, lastTool: this.s.lastTool ? { ...this.s.lastTool } : null };
    }
}

// ── checks and lanes ─────────────────────────────────────────────────────────

export interface CheckInput {
    /** `<Prompt-ID>/<file>` */
    id: string;
    exit: number | null;
    end: string | null;
}

/** A probe log: its last `EXIT=` and `end=` lines; a log without them is a check with no measured result. */
export function parseCheck(id: string, text: string): CheckInput {
    let exit: number | null = null;
    let end: string | null = null;
    for (const l of text.split('\n')) {
        const x = /^EXIT=(-?\d+)\s*$/.exec(l);
        if (x) exit = Number(x[1]);
        const e = /^end=(.+)$/.exec(l);
        if (e) end = e[1].trim();
    }
    return { id, exit, end };
}

export const CHECK_FILE = /^(probe-.+|chat_probe.*)\.log$/;

export interface LaneInput {
    id: string;
    session: string | null;
    worktree: string | null;
    /** The branch checked out in the lane's worktree when the index is built. */
    branch: string | null;
    repo: 'this' | 'foreign' | 'missing';
    state: 'running' | 'exited' | 'blocked';
    exit: number | null;
    started: number | null;
    log: LogSummary;
    checks: CheckInput[];
    inputs: number;
    tier: string | null;
    goahead: string | null;
}

// ── the link phase ───────────────────────────────────────────────────────────

export interface RepoInput {
    prompts: ParsedPrompt[];
    decisions: ParsedDecisions | null;
    logs: ParsedLog[];
    commits: ParsedCommit[];
    /** Full shas reachable from the trunk. */
    trunk: Set<string>;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** The graph of one repo and one lanes folder. Pure: the same inputs, in any order, give the same index. */
export function buildIndex(repo: RepoInput, lanes: LaneInput[], meta: { head?: string | null; sources?: SourceRecord[] } = {}): TraceIndex {
    const nodes = new Map<string, TraceNode>();
    const edges = new Map<string, TraceEdge>();
    const misses: Miss[] = [];
    const key = (type: NodeType, id: string) => type + ':' + id;
    const put = (n: TraceNode) => nodes.set(key(n.type, n.id), n);
    const has = (type: NodeType, id: string) => nodes.has(key(type, id));
    const link = (type: EdgeType, from: string, to: string, source: string) => {
        const e = { type, from, to, source };
        edges.set(`${type}|${from}|${to}|${source}`, e);
    };
    const chat = (id: string) => {
        if (!has('chat', id)) put({ type: 'chat', id });
    };

    // Prompts, one node per id, its files sorted.
    const byId = new Map<string, ParsedPrompt[]>();
    for (const p of repo.prompts) {
        misses.push(...p.misses);
        if (p.id) byId.set(p.id, [...(byId.get(p.id) ?? []), p]);
    }
    for (const [id, list] of byId) {
        const ps = [...list].sort((a, b) => cmp(a.file, b.file));
        byId.set(id, ps);
        const files = ps.map((p) => p.file);
        const pick = <K extends keyof ParsedPrompt>(k: K) => ps.map((p) => p[k]).find((v) => v !== null && v !== '') ?? null;
        const main = ps.find((p) => p.status !== null) ?? ps[0];
        put({
            type: 'prompt', id, files, title: pick('title') ?? '', chat: pick('chat'), laneKind: pick('laneKind'),
            status: main.status, statusSha: main.statusSha,
        });
    }

    // Commits: full sha ids; a short sha resolves by prefix.
    const shas = repo.commits.map((c) => c.sha).sort(cmp);
    const resolveSha = (short: string): string | null => {
        const hit = shas.filter((s) => s.startsWith(short));
        return hit.length === 1 ? hit[0] : null;
    };
    for (const c of repo.commits) {
        put({
            type: 'commit', id: c.sha, short: c.sha.slice(0, 9), date: c.date, subject: c.subject, merge: c.merge,
            onTrunk: repo.trunk.has(c.sha), models: c.models, sessions: c.sessions,
        });
    }

    // Decisions.
    if (repo.decisions) {
        misses.push(...repo.decisions.misses);
        for (const r of repo.decisions.rows) {
            put({ type: 'decision', id: r.id, date: r.date, line: r.line, section: r.section, title: r.title, confidence: r.confidence, reversible: r.reversible });
        }
    }

    // Log entries.
    for (const log of repo.logs) {
        for (const e of log.entries) {
            put({
                type: 'logEntry', id: e.id, kind: e.kind, date: e.date, file: e.file, line: e.line, heading: e.heading,
                outcome: e.outcome, smoke: e.smoke, priority: e.priority,
            });
        }
    }

    // Chats from every reference.
    for (const p of byId.values()) for (const x of p) if (x.chat) chat(x.chat);
    for (const log of repo.logs) for (const e of log.entries) for (const r of e.foundIn) if (r.startsWith('C-')) chat(r);
    for (const r of repo.decisions?.rows ?? []) for (const s of r.sources) if (s.startsWith('C-')) chat(s);

    // Lanes and checks.
    for (const l of lanes) {
        put({
            type: 'lane', id: l.id, session: l.session, worktree: l.worktree, branch: l.branch, repo: l.repo, state: l.state,
            exit: l.exit, started: l.started, outcome: l.state === 'running' ? null : l.log.outcome,
            outcomeLine: l.state === 'running' ? null : l.log.outcomeLine, runs: l.log.runs, model: l.log.model,
            firstEventAt: l.log.firstEventAt, lastEventAt: l.log.lastEventAt, lastTool: l.log.lastTool, toolCalls: l.log.toolCalls,
            costUsd: l.log.costUsd, inputs: l.inputs, tier: l.tier, goahead: l.goahead,
        });
        for (const c of l.checks) put({ type: 'check', id: c.id, exit: c.exit, end: c.end });
    }

    // ── edges ──
    for (const [id, ps] of byId) {
        for (const p of ps) {
            if (p.chat) link('openedBy', key('prompt', id), key('chat', p.chat), p.file);
        }
        const n = nodes.get(key('prompt', id))!;
        const sha = n.statusSha as string | null;
        if (sha) {
            const full = resolveSha(sha);
            const file = ps.find((p) => p.statusSha === sha)!.file;
            if (full) link('closedBy', key('prompt', id), key('commit', full), file);
            else misses.push({ type: 'prompt', source: file, reason: `Status sha ${sha} is not a known commit` });
        }
    }
    for (const c of repo.commits) {
        const from = key('commit', c.sha);
        for (const p of c.prompts) {
            if (has('prompt', p)) link('cites', from, key('prompt', p), `commit ${c.sha.slice(0, 9)} ${c.promptsFrom}`);
            else if (dateOf(c.date) >= TRACE_FROM) misses.push({ type: 'commit', source: `commit ${c.sha.slice(0, 9)}`, reason: `cites ${p}, no such prompt` });
        }
        if (c.prompts.length === 0 && !c.merge && dateOf(c.date) >= TRACE_FROM) {
            misses.push({ type: 'commit', source: `commit ${c.sha.slice(0, 9)}`, reason: 'cites no prompt' });
        }
        for (const d of c.decisions) if (has('decision', d)) link('citesDecision', from, key('decision', d), `commit ${c.sha.slice(0, 9)} subject`);
    }
    for (const log of repo.logs) {
        for (const e of log.entries) {
            const from = key('logEntry', e.id);
            const where = `${e.file}:${e.line}`;
            const late = e.date >= TRACE_FROM;
            if (e.reports) {
                if (has('prompt', e.reports)) link('reports', from, key('prompt', e.reports), where);
                else if (late) misses.push({ type: 'logEntry', source: where, reason: `Prompt document name names ${e.reports}, no such prompt` });
            } else if (late && e.kind === 'task') {
                misses.push({ type: 'logEntry', source: where, reason: 'no Prompt document name' });
            }
            if (e.corrects) {
                if (has('prompt', e.corrects)) link('corrects', from, key('prompt', e.corrects), where);
                else if (late) misses.push({ type: 'logEntry', source: where, reason: `Corregge names ${e.corrects}, no such prompt` });
            }
            for (const r of e.foundIn) {
                if (r.startsWith('C-')) link('foundIn', from, key('chat', r), where);
                else if (has('prompt', r)) link('foundIn', from, key('prompt', r), where);
                else if (late) misses.push({ type: 'logEntry', source: where, reason: `Found in names ${r}, no such prompt` });
            }
        }
    }
    for (const r of repo.decisions?.rows ?? []) {
        const where = `${repo.decisions!.file}:${r.sourceLine}`;
        for (const s of r.sources) {
            if (s.startsWith('C-')) link('decidedIn', key('decision', r.id), key('chat', s), where);
            else if (has('prompt', s)) link('decidedIn', key('decision', r.id), key('prompt', s), where);
        }
    }
    for (const l of lanes) {
        if (has('prompt', l.id)) link('runs', key('lane', l.id), key('prompt', l.id), `${l.id}/`);
        else {
            const why = l.repo === 'foreign' ? ' (the lane ran in another repository)' : l.repo === 'missing' ? ' (its worktree is gone)' : '';
            misses.push({ type: 'lane', source: `${l.id}/`, reason: `no prompt ${l.id} in this repo${why}` });
        }
        for (const c of l.checks) link('measures', key('check', c.id), key('lane', l.id), c.id);
    }

    return {
        schema: SCHEMA,
        head: meta.head ?? null,
        sources: [...(meta.sources ?? [])].sort((a, b) => cmp(a.path, b.path)),
        nodes: [...nodes.values()].sort((a, b) => cmp(key(a.type, a.id), key(b.type, b.id))),
        edges: [...edges.entries()].sort((a, b) => cmp(a[0], b[0])).map((e) => e[1]),
        misses: misses.sort((a, b) => cmp(a.type + '|' + a.source + '|' + a.reason, b.type + '|' + b.source + '|' + b.reason)),
    };
}

/** `nodes 12: lane 3, prompt 4, ...` and the same for edges and misses. */
export function counts(i: TraceIndex): string[] {
    const tally = (xs: Array<{ type: string }>) => {
        const m = new Map<string, number>();
        for (const x of xs) m.set(x.type, (m.get(x.type) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => cmp(a[0], b[0])).map(([k, v]) => `${k} ${v}`).join(', ');
    };
    return [
        `nodes ${i.nodes.length}: ${tally(i.nodes)}`,
        `edges ${i.edges.length}: ${tally(i.edges)}`,
        `misses ${i.misses.length}: ${tally(i.misses)}`,
    ];
}

// ── reading the disk ─────────────────────────────────────────────────────────

const tilde = (p: string) => (p.startsWith(homedir() + '/') ? '~' + p.slice(homedir().length) : p);

function readSource(sources: SourceRecord[], label: string, path: string): string | null {
    if (!existsSync(path) || !statSync(path).isFile()) {
        sources.push({ path: label, present: false, hash: null });
        return null;
    }
    const buf = readFileSync(path);
    sources.push({ path: label, present: true, hash: sha1(buf) });
    return buf.toString('utf8');
}

function run(cwd: string, args: string[]): string | null {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    return r.status === 0 ? r.stdout : null;
}

const listMd = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.md')).sort(cmp) : []);

/** The repo half of the inputs: prompt headers, the register, the logs and git, read from <repo>'s working tree. */
export function readRepo(repo: string, trunk = DEFAULT_TRUNK): { input: RepoInput; head: string | null; sources: SourceRecord[] } {
    const sources: SourceRecord[] = [];
    const prompts: ParsedPrompt[] = [];
    for (const name of listMd(join(repo, 'docs', 'prompts'))) {
        const rel = 'docs/prompts/' + name;
        const text = readSource(sources, rel, join(repo, rel));
        if (text !== null) prompts.push(parsePrompt(rel, text));
    }
    const reg = readSource(sources, 'docs/decisions.md', join(repo, 'docs', 'decisions.md'));
    const logs: ParsedLog[] = [];
    const logFiles = ['docs/claude-code-log.md', 'docs/claude-code-log-archive.md', ...listMd(join(repo, 'docs', 'log-inbox')).map((n) => 'docs/log-inbox/' + n)];
    for (const rel of logFiles) {
        const text = readSource(sources, rel, join(repo, rel));
        if (text !== null) logs.push(parseLogFile(rel, text));
    }
    const head = (run(repo, ['rev-parse', 'HEAD']) ?? '').trim() || null;
    const log = run(repo, ['log', '--since=' + TRACE_FROM, '--branches', '--format=' + GIT_FORMAT]) ?? '';
    const onTrunk = run(repo, ['rev-list', '--since=' + TRACE_FROM, trunk]);
    sources.push({ path: 'git:' + trunk, present: onTrunk !== null, hash: (run(repo, ['rev-parse', '--verify', '-q', trunk]) ?? '').trim() || null });
    return {
        input: {
            prompts,
            decisions: reg === null ? null : parseDecisions('docs/decisions.md', reg),
            logs,
            commits: parseCommits(log),
            trunk: new Set((onTrunk ?? '').split('\n').filter((s) => SHA.test(s))),
        },
        head,
        sources,
    };
}

function alive(pid: number): boolean {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        return (err as NodeJS.ErrnoException).code === 'EPERM';
    }
}

const trimRead = (p: string): string | null => (existsSync(p) ? readFileSync(p, 'utf8').trim() || null : null);

/** The branch and the repository of a lane's worktree, cached per path. */
export function worktreeOf(worktree: string | null, commonDir: string | null, cache: Map<string, { branch: string | null; repo: LaneInput['repo'] }>) {
    if (!worktree || !existsSync(worktree)) return { branch: null, repo: 'missing' as const };
    const hit = cache.get(worktree);
    if (hit) return hit;
    const common = (run(worktree, ['rev-parse', '--path-format=absolute', '--git-common-dir']) ?? '').trim();
    const branch = (run(worktree, ['rev-parse', '--abbrev-ref', 'HEAD']) ?? '').trim() || null;
    const real = (p: string) => (existsSync(p) ? realpathSync(p) : p);
    const v = { branch, repo: (common && commonDir && real(common) === real(commonDir) ? 'this' : 'foreign') as LaneInput['repo'] };
    cache.set(worktree, v);
    return v;
}

/** The lane folders of <lanes>: every P-YYYY-MM-DD-HHmm directory; the rest (_msgs, pending, chains) is not a lane. */
export function laneIds(lanes: string): string[] {
    if (!existsSync(lanes)) return [];
    return readdirSync(lanes).filter((n) => /^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(n) && statSync(join(lanes, n)).isDirectory()).sort(cmp);
}

/** The state of a lane folder, as lane-run reads it: exited once exit.txt is there, blocked when running past the limit. */
export function laneState(dir: string, now = Date.now()): Pick<LaneInput, 'state' | 'exit' | 'started'> {
    const exitText = trimRead(join(dir, 'exit.txt'));
    const started = Number(trimRead(join(dir, 'started.txt')));
    const s = Number.isFinite(started) && started > 0 ? started : null;
    if (exitText !== null) return { state: 'exited', exit: Number.isFinite(Number(exitText)) ? Number(exitText) : null, started: s };
    if (!alive(Number(trimRead(join(dir, 'pid.txt'))))) return { state: 'exited', exit: null, started: s };
    return { state: s !== null && now - s > LIMIT_MINUTES * 60000 ? 'blocked' : 'running', exit: null, started: s };
}

/** Everything of a lane folder but its log summary, which the caller accumulates (whole here, by offset in the monitor). */
export function laneMeta(lanes: string, id: string, commonDir: string | null, cache: Map<string, { branch: string | null; repo: LaneInput['repo'] }>, sources?: SourceRecord[]) {
    const dir = join(lanes, id);
    const names = readdirSync(dir).sort(cmp);
    const label = (n: string) => tilde(join(dir, n));
    const checks: CheckInput[] = [];
    for (const n of names.filter((x) => CHECK_FILE.test(x))) {
        const text = sources ? readSource(sources, label(n), join(dir, n)) : readFileSync(join(dir, n), 'utf8');
        if (text !== null) checks.push(parseCheck(`${id}/${n}`, text));
    }
    if (sources) for (const n of ['session.txt', 'worktree.txt', 'exit.txt']) readSource(sources, label(n), join(dir, n));
    const worktree = trimRead(join(dir, 'worktree.txt'));
    const wt = worktreeOf(worktree, commonDir, cache);
    return {
        id,
        session: trimRead(join(dir, 'session.txt')),
        worktree,
        branch: wt.branch,
        repo: wt.repo,
        ...laneState(dir),
        checks,
        inputs: names.filter((n) => /^input-\d+\.md$/.test(n)).length,
        tier: trimRead(join(dir, 'tier.txt')),
        goahead: trimRead(join(dir, 'goahead.txt')),
    };
}

export function commonDirOf(repo: string): string | null {
    return (run(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']) ?? '').trim() || null;
}

/** The whole index from the disk: the CLI's path. */
export function collect(repo: string, lanes: string, trunk = DEFAULT_TRUNK): TraceIndex {
    const r = readRepo(repo, trunk);
    const commonDir = commonDirOf(repo);
    const cache = new Map<string, { branch: string | null; repo: LaneInput['repo'] }>();
    const inputs: LaneInput[] = [];
    for (const id of laneIds(lanes)) {
        const meta = laneMeta(lanes, id, commonDir, cache, r.sources);
        const acc = new LogAccumulator();
        const text = readSource(r.sources, tilde(join(lanes, id, 'log.jsonl')), join(lanes, id, 'log.jsonl'));
        if (text !== null) acc.push(text.endsWith('\n') ? text : text + '\n');
        inputs.push({ ...meta, log: acc.summary() });
    }
    return buildIndex(r.input, inputs, { head: r.head, sources: r.sources });
}

// ── CLI ──────────────────────────────────────────────────────────────────────

/** The repository this script lives in: frontend/scripts/gates → the root. */
export const HOME_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function main(argv: string[]): number {
    const opt = (name: string): string | null => {
        const at = argv.indexOf(name);
        return at === -1 ? null : argv[at + 1] ?? '';
    };
    for (const a of argv) {
        if (a.startsWith('--') && !['--repo', '--lanes', '--trunk', '--out'].includes(a)) {
            console.error('usage: trace-index.ts [--repo <tree>] [--lanes <dir>] [--trunk <branch>] [--out <file>]');
            return 1;
        }
    }
    const repo = resolve(opt('--repo') || HOME_REPO);
    const lanes = resolve(opt('--lanes') || join(homedir(), '.jjodel-lanes'));
    const index = collect(repo, lanes, opt('--trunk') || DEFAULT_TRUNK);
    const json = JSON.stringify(index, null, 1) + '\n';
    const out = opt('--out');
    if (out) writeFileSync(resolve(out), json);
    else process.stdout.write(json);
    for (const l of counts(index)) console.error(l);
    return 0;
}

// Run only as a script: the tests and the monitor import the functions above.
const invoked = process.argv[1] !== undefined && existsSync(process.argv[1]);
if (invoked && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exitCode = main(process.argv.slice(2));

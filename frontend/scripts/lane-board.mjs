#!/usr/bin/env node
// lane-board: a live, read-only table of the Jjodel lanes on http://localhost:4700.
// It never launches, resumes, merges or kills a lane and never writes in a worktree.
// State, outcome and elapsed come from `lane-run status --all`; worktree, kind, chat,
// tier and phase come from the files in ~/.jjodel-lanes/<Prompt-ID>/. The Timeline tab
// (/api/timeline, drawn by timeline.js next to this file) shows turns, decisions,
// parallelism and dependencies; finished lanes are cached in timeline-cache.json.
// A running lane's Progress is the ladder of milestones its log.jsonl has reached (below).
// P-2026-10-05-1720 adds: the browser assets in board/ next to this file (timeline.js,
// insights.js, requirements.js; timeline-cache.json, gitignored there), the outcome
// `resolved` (a lane that exited blocked and holds resolved.txt), the Requirements tab
// (/api/requirements, req-trace.mjs on this checkout and its trunk) and the status
// strip at the end of the tab bar, counted from the /api rows (stripKey, below).
// Usage: node <tree>/frontend/scripts/lane-board.mjs [--port 4700] [--refresh 30]

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync, openSync, readSync, fstatSync, closeSync, realpathSync } from 'node:fs';
import { homedir, loadavg } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// The browser assets and the timeline cache (P-2026-10-05-1720).
const BOARD_DIR = join(HERE, 'board');

const arg = (name, dflt) => {
    const i = process.argv.indexOf(name);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const PORT = Number(arg('--port', process.env.LANE_BOARD_PORT || 4700));
const REFRESH_S = Number(arg('--refresh', process.env.LANE_BOARD_REFRESH || 30));
const ROOT = process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes');
// The lane-run of this checkout: the board and the `resolved` outcome travel together (P-2026-10-05-1720).
const LANE_RUN = process.env.LANE_RUN || join(HERE, 'lane-run.mjs');
const RECENT_H = 24;
const CACHE_MS = 10_000;

// Measured totals in minutes (2026-09-26/27), used as medians for the estimate.
const MEDIAN = { discovery: 28, phase2: 38, merge: 5, fast: 6 };

const readTrim = (p) => {
    try { return readFileSync(p, 'utf8').trim(); } catch { return ''; }
};

/** The last `bytes` of a file, so a large log.jsonl is never read whole. */
function tail(path, bytes = 256 * 1024) {
    let fd;
    try {
        fd = openSync(path, 'r');
        const size = fstatSync(fd).size;
        const len = Math.min(size, bytes);
        const buf = Buffer.alloc(len);
        readSync(fd, buf, 0, len, size - len);
        return buf.toString('utf8');
    } catch {
        return '';
    } finally {
        if (fd !== undefined) closeSync(fd);
    }
}

function header(dir) {
    const text = readTrim(join(dir, 'input-1.md')).slice(0, 4000);
    const line = (k) => (text.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')) || [])[1] || '';
    const title = (text.match(/^#\s+(.*)$/m) || [])[1] || '';
    return { lane: line('Lane'), chat: line('Chat'), title };
}

function kindOf(laneLine) {
    const l = laneLine.toLowerCase();
    if (/^merge/.test(l)) return 'merge';
    if (/^fast/.test(l)) return 'fast';
    if (/discovery/.test(l)) return 'discovery';
    if (/phase ?2|implementation|full/.test(l)) return 'phase2';
    return '';
}

function phaseOf(dir) {
    const m = [...tail(join(dir, 'log.jsonl')).matchAll(/"description":"((?:[^"\\]|\\.)*)"/g)];
    return m.length ? m[m.length - 1][1].replace(/\\(.)/g, '$1') : '';
}

/** A heuristic, never a promise: the median for the kind minus the elapsed, corrected by the phase and the load.
 *  With milestones, averaged with the median times the share of the ladder above the current milestone. */
export function estimate(kind, minutes, phase, load, progress) {
    const p = phase.toLowerCase();
    const stretch = load > 20 ? 1.5 : 1;
    if (/gate|closure|commit body|status flip|flip/.test(p)) return 'under 5 min';
    // The position of the current milestone, not the count reached: a skipped step is behind the lane.
    const done = progress && progress.total ? (progress.steps.findIndex((s) => s.name === progress.current) + 1) / progress.total : null;
    if (done === 1) return 'under 5 min';
    if (/probe|dev server/.test(p)) return 'about 5-15 min';
    const med = MEDIAN[kind];
    if (!med) return '?';
    let left = /tests? first|baseline/.test(p) ? med * 0.8 : med - minutes;
    if (done !== null) left = (left + Math.max(0, med * (1 - done))) / 2;
    left = Math.round(left * stretch);
    if (left <= 0) return 'past the median';
    return 'about ' + left + ' min';
}

// ── progress ────────────────────────────────────────────────────────────────
// How far a running lane has got, read from the tool calls of its log.jsonl: one ladder of
// milestones per kind, each reached when its signal appears. A later milestone may be reached
// while an earlier one never is (a lane without a probe): once a later one is reached, the
// earlier ones read as skipped, not pending. The current milestone is the last one reached.
// Heredoc bodies (commit messages, log entries) and quoted strings are text, not commands,
// except the program a python3 or node heredoc runs: lanes edit files that way as often as with
// Edit. The code area is frontend/src and frontend/scripts, where a harness lane writes.

const LADDERS = {
    phase2: ['Orient', 'Read', 'Tests first', 'Code', 'Gates', 'Probe', 'Commit', 'Closure'],
    fast: ['Orient', 'Read', 'Tests first', 'Code', 'Gates', 'Probe', 'Commit', 'Closure'],
    discovery: ['Orient', 'Read', 'Probe', 'Report', 'Commit', 'Closure'],
    merge: ['Measure', 'Merge', 'Gates', 'Commit', 'Closure'],
};

const EDIT_TOOLS = /^(Edit|Write|MultiEdit|NotebookEdit)$/;
const CODE_FILE = /(^|\/)frontend\/(src|scripts)(\/|$)/;
const TEST_FILE = /(^|\/)(__tests__|__mocks__)\/|\.(test|spec)\.[cm]?[jt]sx?$/;
const NOT_CODE = /(^|\/)_tmp_|(^|\/)frontend\/scripts\/probe\//;
const CODE_IN_SHELL = /frontend\/(src|scripts)\b|(^|[\s'"=(:])(\.\/)?(src|scripts)\//;
const CODE_RELATIVE = /^(\.\/)?(src|scripts)\//;
const SOURCE_FILE = /\.([cm]?[jt]sx?|s?css|json|html?|svg)$/;
const DOCS_FILE = /(^|\/)docs\//;
const READ_VERB = /(^|[\s;&|(])(grep|rg|sed|cat|head|tail|awk|wc|ls|find|nl)\s|\bgit\s+(show|diff|grep|blame)\b/;
const ORIENT = /(^|[\s;&|(])pwd(?![\w-])|\bgit\s+log\b/;
const MEASURE = /(^|[\s;&|(])pwd(?![\w-])|\bgit\s+(log|status|diff|show|rev-parse|merge-base|merge-tree|worktree)\b/;
const VITEST = /\bnpx\s+vitest\b|\bvitest\s+run\b|\bnpm\s+(run\s+)?test\b/;
const GATE = /\bnpm\s+(run\s+)?(typecheck|build|test|check:[\w-]+)\b|\bnpx\s+(vitest|tsc)\b|\bvitest\s+run\b|\btsc\s+--noEmit\b/;
// lane-run probe <worktree> <probe.ts>: without the two arguments it only prints its usage.
const PROBE = /\blane-run(\.mjs)?\s+probe\s+\S+\s+\S+\.[cm]?[jt]sx?\b|\btsx\s+\S*(probe\/|_tmp_)|\bnpm\s+run\s+smoke\b/;
const REPORT_FILE = /(^|\/)docs\/discovery\/.*\.md$/;
const MERGE = /\bgit\s+merge(?![\w-])(?!\s+--(abort|quit)\b)/;
const GIT_WRITE = /\bgit\s+(-[Cc]\s+\S+\s+)*(commit|merge|cherry-pick|revert)(?![\w-])/;
const GIT_COMMIT = /\bgit\s+(-[Cc]\s+\S+\s+)*commit(?![\w-])/;
const HEREDOC = /(?<!<)<<-?\s*(['"]?)([A-Za-z_]\w*)\1/;
const QUOTED = /'[^']*'|"(?:[^"\\]|\\.)*"/g;
const PYTHON_WRITE = /\bopen\(\s*(?:(['"])([^'"\n]+)\1|(\w+))\s*,\s*['"][wa]|\bPath\(\s*(['"])([^'"\n]+)\4\s*\)\.write_text\(/g;
const NODE_WRITE = /\b(?:writeFileSync|appendFileSync)\(\s*(?:(['"])([^'"\n]+)\1|(\w+))/g;
const REDIRECT = /(?:^|[^<>&\d])>>?\s*(['"]?)([^\s;&|'"<>()]+)\1/g;
const IN_PLACE = /\bsed\s+-i\b|\bperl\s+-\w*i/;
const CD = /(?:^|[;&|(]|\s)cd\s+(['"]?)([^\s;&|'"()]+)\1/g;
const COMMIT_LINE = /^\[[^\]\n]* [0-9a-f]{7,40}\] (.*)$/gm;
const MERGE_MADE = /^Merge made by /m;
const COMMIT_FAILED = /^(fatal|error):|nothing (added )?to commit|Aborting commit/m;
const CLOSURE_PATH = /(^|[\s'"=/])docs\/(log-inbox|prompts)\//;
// The result lines a ladder reads: compactEvent keeps these and drops the rest.
const RESULT_KEEP = /^(\[[^\]\n]* [0-9a-f]{7,40}\] |Merge made by |fatal:|error:)|nothing (added )?to commit|Aborting commit/;
const INPUT_KEEP = ['command', 'file_path', 'notebook_path', 'path', 'pattern'];

const str = (v) => (typeof v === 'string' ? v : '');

/** A shell command without its heredoc bodies, and the heredocs: the text after `<<` on its opening line, its body. */
function heredocs(cmd) {
    const out = [];
    const docs = [];
    let doc = null;
    for (const line of cmd.split('\n')) {
        if (doc) {
            if (line.trim() === doc.end) doc = null;
            else doc.body.push(line);
            continue;
        }
        out.push(line);
        const m = HEREDOC.exec(line);
        if (m) {
            const text = out.join('\n');
            doc = { end: m[2], opener: text.slice(0, text.length - line.length + m.index), body: [] };
            docs.push(doc);
        }
    }
    return { cmd: out.join('\n'), docs: docs.map((d) => ({ opener: d.opener, body: d.body.join('\n') })) };
}

/** A path as written in a shell, joined to the last `cd` before it when relative. */
function inDir(before, path) {
    if (/^[/~]/.test(path)) return path;
    const cds = [...before.matchAll(CD)];
    const dir = cds.length ? cds[cds.length - 1][2] : '';
    return dir ? dir.replace(/\/$/, '') + '/' + path.replace(/^\.\//, '') : path;
}

/** The files a program opens to write: a literal, or the last literal assigned to the name it opens. */
function programWrites(body, re) {
    const value = (name) => {
        const m = [...body.matchAll(new RegExp('(?:^|[^\\w.])' + name + '\\s*=\\s*([\'"])([^\'"\\n]+)\\1', 'g'))];
        return m.length ? m[m.length - 1][2] : '';
    };
    const out = [];
    for (const m of body.matchAll(re)) {
        const p = m[2] || m[5] || (m[3] ? value(m[3]) : '');
        if (p) out.push(p);
    }
    return out;
}

/** The files a shell command writes: redirections, sed -i, and what a python3 or node heredoc opens to write.
 *  `bare` is the command with its quoted strings emptied: a `>` or a `sed -i` inside quotes is text. */
function shellWrites(bare, docs) {
    const out = [];
    for (const m of bare.matchAll(REDIRECT)) if (!/^(\/dev\/|&)/.test(m[2])) out.push(inDir(bare.slice(0, m.index), m[2]));
    let at = 0;
    for (const seg of bare.split(/&&|\|\||;|\n/)) {
        if (IN_PLACE.test(seg)) for (const w of seg.trim().split(/\s+/)) if (/\.[A-Za-z]{1,5}$/.test(w)) out.push(inDir(bare.slice(0, at), w));
        at += seg.length + 1;
    }
    for (const d of docs) {
        const lang = /\bpython3?\b[^\n]*$/.test(d.opener) ? PYTHON_WRITE : /\bnode\b[^\n]*$/.test(d.opener) ? NODE_WRITE : null;
        if (lang) for (const p of programWrites(d.body, lang)) out.push(inDir(d.opener, p));
    }
    return out;
}

function resultText(content) {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    return content.map((x) => (x && typeof x.text === 'string' ? x.text : '')).join('\n');
}

/** The subject of the commit a command makes, from the heredoc or the -m of its git commit; '' when it reads a file. */
function commitSubject(raw) {
    const at = raw.search(GIT_COMMIT);
    if (at < 0) return '';
    const rest = raw.slice(at);
    const nl = rest.indexOf('\n');
    const h = HEREDOC.exec(nl < 0 ? rest : rest.slice(0, nl));
    if (h && nl >= 0) return (rest.slice(nl + 1).split('\n').find((l) => l.trim() && l.trim() !== h[2]) || '').trim();
    const m = /\s-m\s*(['"])([\s\S]*?)\1/.exec(rest);
    return m ? m[2].split('\n')[0].trim() : '';
}

/** A docs commit: by its subject, or, unknown, by a pathspec all under docs/. */
function docsCommit(subject, cmd) {
    if (subject) return /^docs\b/i.test(subject);
    const seg = cmd.slice(cmd.search(GIT_COMMIT)).split(/\n|&&|\|\||;/)[0];
    const i = seg.indexOf(' -- ');
    const paths = i < 0 ? [] : seg.slice(i + 4).trim().split(/\s+/).filter(Boolean);
    return paths.length > 0 && paths.every((x) => /^['"]?(\.\/)?docs(\/|['"]?$)/.test(x));
}

/** The commits a finished Bash call made: from git's own lines, else from the command of a quiet commit. */
function commitsOf(call) {
    if (call.name !== 'Bash' || !call.result || call.result.error || !GIT_WRITE.test(call.bare)) return [];
    const text = call.result.text;
    const lines = [...text.matchAll(COMMIT_LINE)].map((m) => ({ docs: /^docs\b/i.test(m[1]) }));
    if (lines.length) return lines;
    if (MERGE_MADE.test(text)) return [{ docs: false }];
    if (!GIT_COMMIT.test(call.bare) || COMMIT_FAILED.test(text)) return [];
    return [{ docs: docsCommit(commitSubject(call.raw), call.cmd) }];
}

/** The tool calls of a log in order, each with its result once it has one. */
function toolCalls(events) {
    const calls = [];
    const byId = new Map();
    for (const e of Array.isArray(events) ? events : []) {
        const content = e && e.message && Array.isArray(e.message.content) ? e.message.content : [];
        for (const c of content) {
            if (!c || typeof c !== 'object') continue;
            if (e.type === 'assistant' && c.type === 'tool_use') {
                const input = c.input && typeof c.input === 'object' ? c.input : {};
                const raw = str(input.command);
                const h = heredocs(raw);
                const bare = h.cmd.replace(QUOTED, (q) => q[0] + q[0]);
                const path = str(input.file_path) || str(input.notebook_path) || str(input.path);
                const name = str(c.name);
                // The files the call writes: the path of an edit tool, or what the shell writes.
                const writes = EDIT_TOOLS.test(name) ? [path] : name === 'Bash' ? shellWrites(bare, h.docs) : [];
                const call = { name, raw, cmd: h.cmd, bare, path, pattern: str(input.pattern), writes, result: null, commits: [], closure: false };
                calls.push(call);
                if (c.id) byId.set(c.id, call);
            } else if (e.type === 'user' && c.type === 'tool_result') {
                const call = byId.get(c.tool_use_id);
                if (call) call.result = { error: c.is_error === true, text: resultText(c.content) };
            }
        }
    }
    // A docs commit closes the lane when it carries the log inbox or the prompt's Status,
    // named in its command or edited since the commit before it.
    let touched = false;
    for (const call of calls) {
        if (call.writes.some((w) => CLOSURE_PATH.test('/' + w))) touched = true;
        call.commits = commitsOf(call);
        call.closure = call.commits.some((x) => x.docs) && (touched || CLOSURE_PATH.test(call.bare));
        if (call.commits.length) touched = false;
    }
    return calls;
}

/** The index of the call that reached each step of the ladder, -1 for a step not reached. */
function ladder(kind, cs) {
    const find = (test, from = 0, to = cs.length) => {
        for (let i = Math.max(0, from); i < to; i++) if (test(cs[i])) return i;
        return -1;
    };
    const before = (i) => (i < 0 ? cs.length : i);
    const after = (i, test) => (i < 0 ? -1 : find(test, i + 1));
    const bash = (re) => (c) => c.name === 'Bash' && re.test(c.bare);
    const writes = (c, test) => c.writes.some(test);
    const inCode = (w) => CODE_FILE.test(w) || CODE_RELATIVE.test(w);
    // A write in the lane's tree; a log redirected to /tmp is not one.
    const isEdit = (c) => writes(c, (w) => inCode(w) || DOCS_FILE.test(w));
    const isRead = (c) => (/^(Read|Grep|Glob)$/.test(c.name) && (CODE_FILE.test(c.path) || CODE_FILE.test(c.pattern)))
        || (c.name === 'Bash' && READ_VERB.test(c.bare) && CODE_IN_SHELL.test(c.bare));
    const isCode = (c) => writes(c, (w) => inCode(w) && SOURCE_FILE.test(w) && !TEST_FILE.test(w) && !NOT_CODE.test(w));
    const isTest = (c) => writes(c, (w) => TEST_FILE.test(w)) || bash(VITEST)(c);
    const isReport = (c) => writes(c, (w) => REPORT_FILE.test(w));
    const anyCommit = (c) => c.commits.length > 0;
    const codeCommit = (c) => c.commits.some((x) => !x.docs);
    const closure = (c) => c.closure;
    if (kind === 'merge') {
        const merge = find(bash(MERGE));
        // A merge that commits by itself is its own commit.
        const commit = merge < 0 ? -1 : find(codeCommit, merge);
        return [find(bash(MEASURE), 0, before(merge)), merge, after(merge, bash(GATE)), commit, find(closure, commit >= 0 ? commit : merge)];
    }
    const orient = find(bash(ORIENT), 0, before(find(isEdit)));
    const read = find(isRead);
    if (kind === 'discovery') {
        const report = find(isReport);
        const commit = after(report, anyCommit);
        return [orient, read, find(bash(PROBE)), report, commit, find(closure, commit)];
    }
    // Gates, probe and commit count after the code: a baseline or a port committed first is not one.
    const code = find(isCode);
    const commit = after(code, codeCommit);
    return [orient, read, find(isTest, 0, before(code)), code, after(code, bash(GATE)), after(code, bash(PROBE)), commit, find(closure, commit >= 0 ? commit : code)];
}

/** The milestones of a lane of `kind` from the parsed events of its log; null for a kind without a ladder. */
export function milestones(kind, events) {
    const names = LADDERS[kind];
    if (!names) return null;
    const at = ladder(kind, toolCalls(events));
    let last = -1;
    at.forEach((i, k) => { if (i >= 0) last = k; });
    const steps = names.map((name, k) => ({ name, reached: at[k] >= 0, state: at[k] >= 0 ? 'reached' : k < last ? 'skipped' : 'pending' }));
    return { steps, current: last >= 0 ? names[last] : '' };
}

/** The progress of a live row in /api: { reached, total, current, steps: [{ name, state }] }, or null. */
export function progressOf(kind, events) {
    const m = milestones(kind, events);
    if (!m) return null;
    return { reached: m.steps.filter((s) => s.reached).length, total: m.steps.length, current: m.current, steps: m.steps.map(({ name, state }) => ({ name, state })) };
}

/** An event cut to what the ladders read (tool names, paths, commands, errors, git's result lines), or null. */
export function compactEvent(e) {
    const content = e && e.message && Array.isArray(e.message.content) ? e.message.content : null;
    if (!content) return null;
    if (e.type === 'assistant') {
        const uses = content.filter((c) => c && c.type === 'tool_use').map((c) => {
            const input = {};
            for (const k of INPUT_KEEP) if (c.input && typeof c.input[k] === 'string') input[k] = c.input[k];
            return { type: 'tool_use', id: c.id, name: c.name, input };
        });
        return uses.length ? { type: 'assistant', message: { content: uses } } : null;
    }
    if (e.type === 'user') {
        const res = content.filter((c) => c && c.type === 'tool_result').map((c) => ({
            type: 'tool_result', tool_use_id: c.tool_use_id, is_error: c.is_error === true,
            content: resultText(c.content).split('\n').filter((l) => RESULT_KEEP.test(l)).join('\n'),
        }));
        return res.length ? { type: 'user', message: { content: res } } : null;
    }
    return null;
}

const evCache = new Map();

/** The compacted events of a log, read on from where the last read stopped: a log.jsonl only grows. */
export function laneEvents(log) {
    let size;
    try { size = statSync(log).size; } catch { evCache.delete(log); return []; }
    let c = evCache.get(log);
    if (!c || size < c.offset) c = { offset: 0, rest: Buffer.alloc(0), events: [] };
    evCache.set(log, c);
    if (size === c.offset) return c.events;
    let fd;
    try {
        fd = openSync(log, 'r');
        const buf = Buffer.alloc(size - c.offset);
        const n = readSync(fd, buf, 0, buf.length, c.offset);
        const all = Buffer.concat([c.rest, buf.subarray(0, n)]);
        const end = all.lastIndexOf(10);
        if (end >= 0) {
            for (const line of all.subarray(0, end).toString('utf8').split('\n')) {
                if (!line.includes('"tool_use"') && !line.includes('"tool_result"')) continue;
                let e;
                try { e = JSON.parse(line); } catch { continue; }
                const x = compactEvent(e);
                if (x) c.events.push(x);
            }
        }
        c.rest = Buffer.from(end >= 0 ? all.subarray(end + 1) : all);
        c.offset += n;
    } catch { /* read again next time */ } finally {
        if (fd !== undefined) closeSync(fd);
    }
    return c.events;
}

/** Prompt-ID P-YYYY-MM-DD-HHmm → epoch ms (local time). */
function idTime(id) {
    const m = id.match(/P-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : 0;
}

let cache = { at: 0, data: null };

function collect() {
    if (cache.data && Date.now() - cache.at < CACHE_MS) return cache.data;
    const load = loadavg();
    const r = spawnSync(process.execPath, [LANE_RUN, 'status', '--all'], { encoding: 'utf8', timeout: 15_000 });
    const error = r.status === 0 ? '' : (r.stderr || r.error?.message || 'lane-run status failed').trim();
    const rows = [];
    const logs = new Set();
    for (const line of (r.stdout || '').split('\n').slice(1)) {
        if (!line.trim()) continue;
        const cols = line.trim().split(/\s{2,}/);
        if (cols.length < 4) continue;
        const [id, state, outcome, elapsed] = cols;
        const minutes = parseInt(elapsed, 10) || 0;
        const isChain = id.startsWith('chain-');
        const dir = join(ROOT, id);
        const live = state === 'running' || state === 'blocked';
        const t = idTime(id) || (isChain ? idTime(id.slice(6)) : 0);
        const recent = Date.now() - t < RECENT_H * 3600_000;
        const row = { id, state, outcome, minutes, chain: isChain, worktree: '', kind: '', lane: '', chat: '', title: '', tier: '', phase: '', left: '' };
        if (!isChain && existsSync(dir)) {
            row.worktree = readTrim(join(dir, 'worktree.txt')).replace(homedir(), '~');
            const h = header(dir);
            row.lane = h.lane; row.chat = h.chat; row.title = h.title;
            row.kind = kindOf(h.lane);
            row.tier = readTrim(join(dir, 'tier.txt')).split(/[\s:]/)[0];
            // resolved (P-2026-10-05-1720): exited blocked and resolved afterwards, whichever lane-run printed the table.
            if (outcome === 'blocked' && existsSync(join(dir, 'resolved.txt'))) row.outcome = 'resolved';
            if (live) {
                row.phase = phaseOf(dir);
                const log = join(dir, 'log.jsonl');
                logs.add(log);
                row.progress = progressOf(row.kind, laneEvents(log));
                row.left = estimate(row.kind, minutes, row.phase, load[0], row.progress);
            }
        }
        row.live = live;
        row.recent = recent;
        row.day = t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : 'unknown';
        rows.push(row);
    }
    for (const log of evCache.keys()) if (!logs.has(log)) evCache.delete(log);
    const data = { now: Date.now(), load: load.map((x) => x.toFixed(2)), error, rows };
    cache = { at: Date.now(), data };
    return data;
}

// ── timeline ────────────────────────────────────────────────────────────────
// One lane = one or more turns. Turn k starts at the mtime of input-k.md and lasts the
// duration_ms of the k-th `result` event of log.jsonl. The gaps between turns are the
// waits for a decision (GO, ACK, answer); input-k.md for k >= 2 is that decision.
// Lanes from before the input files have one turn: started.txt to exit.txt.

const TL_CACHE_FILE = join(BOARD_DIR, 'timeline-cache.json');
let tlCache = {};
try { tlCache = JSON.parse(readFileSync(TL_CACHE_FILE, 'utf8')); } catch { tlCache = {}; }
let tlDirty = false;

const mtime = (p) => { try { return statSync(p).mtimeMs; } catch { return 0; } };
const size = (p) => { try { return statSync(p).size; } catch { return -1; } };

/** The `result` events of a log: duration and the last Outcome line of each turn. */
function results(log) {
    let buf;
    try { buf = readFileSync(log); } catch { return []; }
    const out = [];
    const key = Buffer.from('"type":"result"');
    let at = buf.indexOf(key);
    while (at !== -1) {
        const s0 = buf.lastIndexOf(10, at) + 1;
        let s1 = buf.indexOf(10, at);
        if (s1 === -1) s1 = buf.length;
        try {
            const e = JSON.parse(buf.subarray(s0, s1).toString('utf8'));
            if (e.type === 'result') {
                const m = [...String(e.result || '').matchAll(/Outcome:\s*`?([a-z][a-z-]*)/gi)];
                out.push({ ms: Number(e.duration_ms) || 0, outcome: m.length ? m[m.length - 1][1].toLowerCase() : '' });
            }
        } catch { /* a half-written line: skip */ }
        at = buf.indexOf(key, s1);
    }
    return out;
}

/** The decision text of input-k.md: its first non-empty line without the [P-…] tag. */
function decisionText(path) {
    const t = readTrim(path).slice(0, 2000).replace(/^\[P-[^\]]*\]\s*/, '');
    const line = t.split('\n').map((x) => x.trim()).find((x) => x) || '';
    return line.length > 220 ? line.slice(0, 217) + '…' : line;
}

/** The paragraph of a prompt that cites a Prompt-ID, cut to about 700 characters around the first mention. */
function citeText(text, cid) {
    const paras = text.split(/\n\s*\n/);
    const p = (paras.find((x) => x.includes(cid)) || '').trim();
    if (p.length <= 700) return p;
    const at = p.indexOf(cid);
    const from = Math.max(0, at - 300);
    return (from ? '…' : '') + p.slice(from, from + 700) + (from + 700 < p.length ? '…' : '');
}

function laneTimeline(id, now) {
    const dir = join(ROOT, id);
    const exitP = join(dir, 'exit.txt');
    const exited = existsSync(exitP);
    const inputs = readdirSync(dir).map((n) => /^input-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
    const key = ['v2', size(join(dir, 'log.jsonl')), mtime(exitP), inputs.length].join('/');
    const hit = tlCache[id];
    if (hit && hit.key === key && exited) return hit.v;
    const res = results(join(dir, 'log.jsonl'));
    const end = exited ? mtime(exitP) : now;
    const turns = [];
    if (!inputs.length) {
        const st = Number(readTrim(join(dir, 'started.txt'))) || end;
        turns.push({ s: st, e: end, o: res.length ? res[res.length - 1].outcome : '' });
    } else {
        const starts = inputs.map((k) => mtime(join(dir, 'input-' + k + '.md')));
        starts.forEach((st, i) => {
            const last = i === starts.length - 1;
            let e;
            if (res[i] && res[i].ms) e = st + res[i].ms;
            else e = last ? end : starts[i + 1];
            if (last && !exited) e = now;
            turns.push({ s: st, e: Math.max(e, st), o: res[i] ? res[i].outcome : '', d: i ? decisionText(join(dir, 'input-' + inputs[i] + '.md')) : '' });
        });
    }
    const text = readTrim(join(dir, 'input-1.md')).slice(0, 20000);
    const cites = [...new Set((text.match(/P-\d{4}-\d{2}-\d{2}-\d{4}/g) || []).filter((x) => x !== id))].map((c) => ({ id: c, text: citeText(text, c) }));
    const v = { turns, cites, exited };
    if (exited) { tlCache[id] = { key, v }; tlDirty = true; }
    return v;
}

function chains() {
    const out = [];
    for (const n of readdirSync(ROOT)) {
        if (!/^(auto)?chain-/.test(n)) continue;
        try {
            const c = JSON.parse(readFileSync(join(ROOT, n, 'chain.json'), 'utf8'));
            const ls = (c.lanes || []).filter((l) => l && l.id);
            for (let i = 1; i < ls.length; i++) {
                out.push([ls[i - 1].id, ls[i].id, {
                    chain: c.id || n, step: i, of: ls.length, branch: c.branch || '', worktree: (c.worktree || '').replace(homedir(), '~'),
                    from: (ls[i - 1].prompt || '').replace(homedir(), '~'), to: (ls[i].prompt || '').replace(homedir(), '~'),
                }]);
            }
        } catch { /* not a chain */ }
    }
    return out;
}

let tlMem = { at: 0, data: null };
function timeline() {
    if (tlMem.data && Date.now() - tlMem.at < CACHE_MS) return tlMem.data;
    const now = Date.now();
    const status = new Map(collect().rows.map((r) => [r.id, r]));
    const lanes = [];
    for (const id of readdirSync(ROOT)) {
        if (!/^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(id)) continue;
        const dir = join(ROOT, id);
        try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
        let t;
        try { t = laneTimeline(id, now); } catch { continue; }
        const st = status.get(id) || {};
        const h = st.worktree !== undefined ? st : (() => { const x = header(dir); return { ...x, worktree: readTrim(join(dir, 'worktree.txt')).replace(homedir(), '~'), kind: kindOf(x.lane) }; })();
        lanes.push({ id, title: h.title || '', chat: h.chat || '', worktree: h.worktree || '', kind: h.kind || '', tier: st.tier || '', state: st.state || (t.exited ? 'exited' : '?'), outcome: st.outcome || '', live: !!st.live, turns: t.turns, cites: t.cites });
    }
    const known = new Set(lanes.map((l) => l.id));
    const chainDeps = chains().filter(([a, b]) => known.has(a) && known.has(b));
    if (tlDirty) {
        try { writeFileSync(TL_CACHE_FILE + '.tmp', JSON.stringify(tlCache)); renameSync(TL_CACHE_FILE + '.tmp', TL_CACHE_FILE); } catch { /* best effort */ }
        tlDirty = false;
    }
    const data = { now, lanes, chainDeps };
    tlMem = { at: Date.now(), data };
    return data;
}

// ── exports ─────────────────────────────────────────────────────────────────
// Chrome Trace Event format (opens in ui.perfetto.dev): one process per worktree,
// one thread per lane, turns and waits as slices, decisions as instants, dependencies
// as flow arrows, and a counter track with the lanes working.
function lanesSince(days) {
    const d = timeline();
    const from = days > 0 ? d.now - days * 864e5 : 0;
    return { d, lanes: d.lanes.filter((l) => l.turns.length && l.turns[l.turns.length - 1].e >= from) };
}

function traceExport(days) {
    const { d, lanes } = lanesSince(days);
    const us = (t) => Math.round(t * 1000);
    const ev = [];
    const pids = new Map();
    const pidOf = (wt) => {
        const k = wt || 'unknown';
        if (!pids.has(k)) { pids.set(k, pids.size + 1); ev.push({ ph: 'M', name: 'process_name', pid: pids.get(k), args: { name: k } }); }
        return pids.get(k);
    };
    const where = new Map();
    lanes.sort((a, b) => a.turns[0].s - b.turns[0].s).forEach((l, i) => {
        const pid = pidOf(l.worktree), tid = i + 1;
        where.set(l.id, { pid, tid, l });
        ev.push({ ph: 'M', name: 'thread_name', pid, tid, args: { name: l.id + (l.title ? ' · ' + l.title : '') } });
        l.turns.forEach((t, k) => {
            if (k > 0) {
                const w0 = l.turns[k - 1].e;
                if (t.s > w0) ev.push({ ph: 'X', cat: 'wait', name: 'waiting for decision', pid, tid, ts: us(w0), dur: us(t.s - w0) });
                ev.push({ ph: 'i', s: 't', cat: 'decision', name: 'decision', pid, tid, ts: us(t.s), args: { text: t.d || '' } });
            }
            ev.push({ ph: 'X', cat: 'turn', name: 'turn ' + (k + 1) + (t.o ? ' · ' + t.o : ''), pid, tid, ts: us(t.s), dur: Math.max(us(t.e - t.s), 1),
                args: { lane: l.id, chat: l.chat, kind: l.kind, tier: l.tier, outcome: t.o || '' } });
        });
    });
    // Dependencies as flows: from the end of the source's last turn to the start of the target's first.
    let flow = 1;
    const link = (a, b, name, text) => {
        const A = where.get(a), B = where.get(b);
        if (!A || !B) return;
        const ta = A.l.turns[A.l.turns.length - 1], tb = B.l.turns[0];
        ev.push({ ph: 's', id: flow, cat: 'dep', name, pid: A.pid, tid: A.tid, ts: us(Math.min(ta.e, Math.max(ta.s, tb.s))) - 1, args: { text } });
        ev.push({ ph: 'f', bp: 'e', id: flow, cat: 'dep', name, pid: B.pid, tid: B.tid, ts: us(tb.s) });
        flow++;
    };
    d.chainDeps.forEach(([a, b, info]) => link(a, b, 'chain', (info && info.chain) || ''));
    lanes.forEach((l) => l.cites.forEach((c) => link(c.id, l.id, 'cites', c.text)));
    // Counter: lanes working.
    const pts = [];
    lanes.forEach((l) => l.turns.forEach((t) => { pts.push([t.s, 1], [t.e, -1]); }));
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let c = 0;
    ev.push({ ph: 'M', name: 'process_name', pid: 0, args: { name: 'Parallelism' } });
    pts.forEach(([t, v]) => { c += v; ev.push({ ph: 'C', name: 'lanes working', pid: 0, ts: us(t), args: { working: c } }); });
    return JSON.stringify({ traceEvents: ev, displayTimeUnit: 'ms', otherData: { source: 'Jjodel Harness Lane Management', exported: new Date(d.now).toISOString() } });
}

// XES event log (IEEE 1849) for process mining: one trace per lane; turns as start/complete,
// decisions as events of the resource that took them.
function xesExport(days) {
    const { lanes } = lanesSince(days);
    const x = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const iso = (t) => new Date(t).toISOString();
    const str = (k, v) => '<string key="' + k + '" value="' + x(v) + '"/>';
    const out = ['<?xml version="1.0" encoding="UTF-8"?>',
        '<log xes.version="1849-2016" xes.features="nested-attributes" xmlns="http://www.xes-standard.org/">',
        '<extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext"/>',
        '<extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext"/>',
        '<extension name="Lifecycle" prefix="lifecycle" uri="http://www.xes-standard.org/lifecycle.xesext"/>',
        '<extension name="Organizational" prefix="org" uri="http://www.xes-standard.org/org.xesext"/>',
        '<global scope="event">' + str('concept:name', '__INVALID__') + '<date key="time:timestamp" value="1970-01-01T00:00:00.000Z"/>' + str('lifecycle:transition', 'complete') + '</global>',
        '<classifier name="Activity" keys="concept:name"/>',
        str('concept:name', 'Jjodel harness lanes')];
    const event = (name, t, tr, res, extra = '') => '<event>' + str('concept:name', name) + '<date key="time:timestamp" value="' + iso(t) + '"/>' + str('lifecycle:transition', tr) + str('org:resource', res) + extra + '</event>';
    lanes.forEach((l) => {
        out.push('<trace>' + str('concept:name', l.id) + str('title', l.title) + str('worktree', l.worktree) + str('chat', l.chat) + str('kind', l.kind) + str('tier', l.tier) + str('outcome', l.outcome));
        l.turns.forEach((t, k) => {
            if (k > 0) out.push(event('decision', t.s, 'complete', 'Alfonso / chat ' + (l.chat || ''), str('text', t.d)));
            const name = k === 0 ? 'first turn' : 'turn';
            out.push(event(name, t.s, 'start', 'Claude Code'));
            out.push(event(name, t.e, 'complete', 'Claude Code', str('outcome', t.o || 'none')));
            if (t.o) out.push(event('outcome: ' + t.o, t.e, 'complete', 'Claude Code'));
        });
        out.push('</trace>');
    });
    out.push('</log>');
    return out.join('\n');
}

// ── requirements ────────────────────────────────────────────────────────────
// req-trace.mjs, run asynchronously so the other tabs keep answering; one run at a
// time, its JSON kept for REQ_MS. Its own cache (the git side, keyed on the trunk
// sha) lives outside the tree.
const REQ_REPO = process.env.REQ_TRACE_REPO || join(HERE, '..', '..');
const REQ_TRACE = join(HERE, 'req-trace.mjs');
const REQ_TRUNK = process.env.REQ_TRACE_TRUNK || 'alfonso-frontend-jjtl';
const REQ_MS = 60_000;
let reqMem = { at: 0, body: null, pending: null };
function requirements() {
    if (reqMem.body && Date.now() - reqMem.at < REQ_MS) return Promise.resolve(reqMem.body);
    if (reqMem.pending) return reqMem.pending;
    reqMem.pending = new Promise((done) => {
        const out = [], err = [];
        const finish = (ok, body) => { reqMem = { at: ok ? Date.now() : 0, body: ok ? body : null, pending: null }; done(body); };
        let child;
        try { child = spawn(process.execPath, [REQ_TRACE, '--repo', REQ_REPO, '--trunk', REQ_TRUNK], { stdio: ['ignore', 'pipe', 'pipe'] }); }
        catch (e) { return finish(false, JSON.stringify({ error: 'req-trace: ' + e.message, rows: [] })); }
        const timer = setTimeout(() => child.kill('SIGKILL'), 120_000);
        child.stdout.on('data', (b) => out.push(b));
        child.stderr.on('data', (b) => err.push(b));
        child.on('error', (e) => { clearTimeout(timer); finish(false, JSON.stringify({ error: 'req-trace: ' + e.message, rows: [] })); });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) finish(true, Buffer.concat(out).toString('utf8'));
            else finish(false, JSON.stringify({ error: ('req-trace exit ' + code + ': ' + Buffer.concat(err).toString('utf8')).trim(), rows: [] }));
        });
    });
    return reqMem.pending;
}

// ── status strip ────────────────────────────────────────────────────────────
// The pills at the end of the tab bar (Alfonso, 2026-10-05 17:35): key, label, the
// class of the outcome colour the Lanes table already uses. Counted in the page from
// the /api rows by stripKey, embedded in the page as written here.
export const STRIP = [['running', 'running', 'running'], ['question', 'question', 'question'], ['hard-stop', 'hard-stop', 'hard-stop'],
    ['blocked', 'blocked', 'blocked-o'], ['resolved', 'resolved', 'resolved'], ['done', 'done 24 h', 'done']];

/** The pill of a row, or null: a chain by its state; a lane running or over its limit by its state; an exited lane by its outcome, done only within the last 24 hours. */
export function stripKey(r) {
    if (r.chain) return r.state === 'running' ? 'running' : r.state === 'done' && r.recent ? 'done' : null;
    if (r.state === 'running') return 'running';
    if (r.state === 'blocked') return 'blocked';
    const o = String(r.outcome || '').split(' ')[0];
    if (o === 'done') return r.recent ? 'done' : null;
    return o === 'question' || o === 'hard-stop' || o === 'blocked' || o === 'resolved' ? o : null;
}

export function stripCounts(rows) {
    const n = Object.fromEntries(STRIP.map(([k]) => [k, 0]));
    for (const r of rows) {
        const k = stripKey(r);
        if (k) n[k]++;
    }
    return n;
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jjodel Harness Lane Management</title>
<style>
:root{--bg:#f8fafc;--fg:#0f172a;--muted:#64748b;--line:#e2e8f0;--card:#fff;--accent:#0ea5e9;--run:#0284c7;--ok:#15803d;--warn:#b45309;--bad:#b91c1c}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--fg:#e2e8f0;--muted:#94a3b8;--line:#1e293b;--card:#111a2e;--run:#38bdf8;--ok:#4ade80;--warn:#fbbf24;--bad:#f87171}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif}
main{max-width:1280px;margin:0 auto;padding:16px}
header{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:baseline;margin-bottom:16px}
h1{font-size:16px;margin:0}h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:24px 0 8px}
.meta{color:var(--muted);font-size:12px}.meta b{color:var(--fg);font-weight:600}
.wrap{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;width:100%;min-width:900px}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap}tr:last-child td{border-bottom:0}
td.id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap}
.title{display:block;color:var(--muted);font-size:11px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:320px;white-space:normal}
.pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid currentColor}
.running{color:var(--run)}.blocked,.stopped{color:var(--warn)}.done,.resolved{color:var(--ok)}.question,.hard-stop{color:var(--warn)}.blocked-o,.unparsed,.failed{color:var(--bad)}
.phase{max-width:340px}.empty{padding:16px;color:var(--muted)}.err{color:var(--bad);margin:8px 0}
.prog{white-space:nowrap}.prog .n{font-variant-numeric:tabular-nums;margin-right:6px}.segs{display:inline-flex;gap:2px;vertical-align:middle}.segs .seg{width:10px;height:8px;border-radius:2px;border:1px solid var(--muted)}.segs .seg.reached{background:var(--run);border-color:var(--run)}.segs .seg.skipped{background:repeating-linear-gradient(135deg,var(--muted) 0 1px,transparent 1px 3px)}.prog .cur{display:block;color:var(--muted);font-size:11px}
.load-hi{color:var(--bad);font-weight:600}
.strip{margin-left:auto;display:flex;gap:4px;align-items:center;flex:none;padding:4px 0}.strip .sp{text-decoration:none;white-space:nowrap;cursor:pointer;background:var(--card)}.strip .sp b{display:inline-block;min-width:3ch;text-align:right;font-variant-numeric:tabular-nums;margin-right:3px}.strip .sp.zero{opacity:.35}.strip .sp.on{box-shadow:0 0 0 2px currentColor}
.filt{display:flex;gap:12px;align-items:baseline}.filt a{color:var(--accent);font-size:12px;text-transform:none;letter-spacing:0;cursor:pointer}
.tabs{display:flex;gap:4px;margin:0 0 8px;border-bottom:1px solid var(--line)}.tabs button,.seg button{font:inherit;font-size:12px;background:none;border:0;color:var(--muted);padding:8px 12px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}.tabs button.on{color:var(--fg);border-bottom-color:var(--accent);font-weight:600}
details{margin-bottom:8px}summary{cursor:pointer;display:flex;gap:16px;align-items:baseline;padding:8px 12px;background:var(--card);border:1px solid var(--line);border-radius:8px;list-style:none}summary::-webkit-details-marker{display:none}summary::before{content:'\\25B8';color:var(--muted)}details[open] summary::before{content:'\\25BE'}details[open] summary{border-radius:8px 8px 0 0;border-bottom:0}details[open] .wrap{border-radius:0 0 8px 8px}
</style></head><body><main>
<header><h1>Jjodel Harness Lane Management</h1><span class="meta" id="meta">loading…</span></header>
<nav class="tabs"><button data-tab="table">Lanes</button><button data-tab="timeline">Timeline</button><button data-tab="insights">Insights</button><button data-tab="requirements">Requirements</button><div class="strip" id="strip" aria-label="Lanes by state">${STRIP.map(([k, label, cls]) => '<a href="#" role="button" class="pill sp ' + cls + ' zero" data-k="' + k + '" title="Show the ' + label + ' lanes"><b>0</b>' + label + '</a>').join('')}</div></nav>
<div class="err" id="err"></div>
<section id="tab-table">
<div id="lanes-filt" hidden></div>
<div id="lanes-all">
<h2>Running</h2><div class="wrap" id="live"></div>
<h2>Last ${RECENT_H} hours</h2><div class="wrap" id="recent"></div>
<h2>Earlier lanes</h2><div id="older"></div>
</div>
</section>
<section id="tab-timeline" hidden><div id="tl"></div></section>
<section id="tab-insights" hidden><div id="ins"></div></section>
<section id="tab-requirements" hidden><div id="req"></div></section>
</main><script src="/timeline.js"></script><script src="/insights.js"></script><script src="/requirements.js"></script><script>
const REFRESH=${REFRESH_S}*1000;
const stripKey=${stripKey.toString()};
const STRIP=${JSON.stringify(STRIP)};
let laneFilter='',lastRows=[];
function renderStrip(rows){
  const n={};STRIP.forEach(([k])=>{n[k]=0});rows.forEach(r=>{const k=stripKey(r);if(k)n[k]++});
  STRIP.forEach(([k])=>{const el=document.querySelector('#strip [data-k="'+k+'"]');if(!el)return;el.querySelector('b').textContent=n[k];el.classList.toggle('zero',!n[k]);el.classList.toggle('on',laneFilter===k)});
}
function renderLanes(rows){
  const f=document.getElementById('lanes-filt'),all=document.getElementById('lanes-all');
  f.hidden=!laneFilter;all.hidden=!!laneFilter;
  if(laneFilter){
    const label=(STRIP.find(s=>s[0]===laneFilter)||[,laneFilter])[1];
    const rs=rows.filter(r=>stripKey(r)===laneFilter),L=rs.filter(r=>r.live),E=rs.filter(r=>!r.live);
    f.innerHTML='<h2 class="filt"><span>'+esc(label)+' · '+rs.length+' lane'+(rs.length===1?'':'s')+'</span><a id="clearf">show all lanes</a></h2>'+
      (rs.length?'':'<div class="wrap"><div class="empty">No lane in this state.</div></div>')+
      (L.length?'<div class="wrap">'+table(L,true)+'</div>':'')+(E.length?'<div class="wrap"'+(L.length?' style="margin-top:8px"':'')+'>'+table(E,false)+'</div>':'');
    document.getElementById('clearf').addEventListener('click',e=>{e.preventDefault();setFilter('')});
    return;
  }
  document.getElementById('live').innerHTML=table(rows.filter(r=>r.live),true);
  document.getElementById('recent').innerHTML=table(rows.filter(r=>!r.live&&r.recent),false);
  renderOlder(rows.filter(r=>!r.live&&!r.recent));
}
function setFilter(k){laneFilter=k;renderStrip(lastRows);renderLanes(lastRows)}
document.getElementById('strip').addEventListener('click',e=>{const a=e.target.closest('[data-k]');if(!a)return;e.preventDefault();showTab('table');setFilter(laneFilter===a.dataset.k?'':a.dataset.k)});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pill=(t,cls)=>t?'<span class="pill '+esc(cls||t)+'">'+esc(t)+'</span>':'';
const dur=m=>m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min';
function prog(p){
  if(!p)return '<td class="prog"></td>';
  const label=p.reached+' of '+p.total+' milestones reached'+(p.current?', last '+p.current:'');
  const segs=p.steps.map(s=>'<i class="seg '+esc(s.state)+'" title="'+esc(s.name+': '+s.state)+'"></i>').join('');
  return '<td class="prog"><span class="n">'+p.reached+'/'+p.total+'</span><span class="segs" role="img" aria-label="'+esc(label)+'">'+segs+'</span>'+(p.current?'<span class="cur">'+esc(p.current)+'</span>':'')+'</td>';
}
function table(rows,live){
  if(!rows.length)return '<div class="empty">'+(live?'No lane is running.':'No lanes in this period.')+'</div>';
  const cols=live?['Lane','State','Kind','Elapsed','Left','Progress','Phase','Worktree','Chat']:['Lane','State','Outcome','Kind','Elapsed','Worktree','Chat'];
  let h='<table><thead><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr></thead><tbody>';
  for(const r of rows){
    const id='<td class="id">'+esc(r.id)+(r.title?'<span class="title">'+esc(r.title)+'</span>':'')+'</td>';
    const kind='<td>'+esc(r.kind||r.lane.split(/[ .(]/)[0]||'')+(r.tier?' · '+esc(r.tier):'')+'</td>';
    const oc=r.outcome==='none'?'':r.outcome;
    if(live)h+='<tr>'+id+'<td>'+pill(r.state)+'</td>'+kind+'<td>'+dur(r.minutes)+'</td><td>'+esc(r.left)+'</td>'+prog(r.progress)+'<td class="phase">'+esc(r.phase)+'</td><td>'+esc(r.worktree)+'</td><td>'+esc(r.chat)+'</td></tr>';
    else h+='<tr>'+id+'<td>'+pill(r.state)+'</td><td>'+pill(oc,oc==='blocked'?'blocked-o':oc)+'</td>'+kind+'<td>'+dur(r.minutes)+'</td><td>'+esc(r.worktree)+'</td><td>'+esc(r.chat)+'</td></tr>';
  }
  return h+'</tbody></table>';
}
async function tick(){
  try{
    const d=await (await fetch('/api',{cache:'no-store'})).json();
    const t=new Date(d.now).toLocaleTimeString('en-GB');
    const hi=Number(d.load[0])>20;
    document.getElementById('meta').innerHTML='updated at <b>'+t+'</b> · refresh every '+(REFRESH/1000)+' s · load <span class="'+(hi?'load-hi':'')+'">'+d.load.join(' ')+'</span>';
    document.getElementById('err').textContent=d.error||'';
    lastRows=d.rows;renderStrip(d.rows);renderLanes(d.rows);
    const n=d.rows.filter(r=>r.live).length;document.title=(n?'('+n+') ':'')+'Jjodel Harness Lane Management';
  }catch(e){document.getElementById('err').textContent='lane-board unreachable: '+e.message}
}
function renderOlder(rows){
  const days=[...new Set(rows.map(r=>r.day))].sort().reverse();
  const box=document.getElementById('older');
  if(!days.length){box.innerHTML='<div class="wrap"><div class="empty">No earlier lanes.</div></div>';return;}
  box.innerHTML=days.map(day=>{
    const rs=rows.filter(r=>r.day===day);
    const tally={};rs.forEach(r=>{const o=(r.chain||r.outcome==='none')?r.state:r.outcome.split(' ')[0];tally[o]=(tally[o]||0)+1});
    const sum=Object.entries(tally).map(([k,v])=>v+' '+k).join(' · ');
    return '<details data-day="'+day+'"'+(openDays.has(day)?' open':'')+'><summary><b>'+day+'</b><span class="meta">'+rs.length+' lane'+(rs.length>1?'s':'')+' · '+esc(sum)+'</span></summary><div class="wrap">'+table(rs,false)+'</div></details>';
  }).join('');
  box.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{el.open?openDays.add(el.dataset.day):openDays.delete(el.dataset.day);saveOpen()}));
}
let openDays=new Set();
try{openDays=new Set(JSON.parse(localStorage.getItem('laneBoardOpenDays')||'[]'))}catch(e){}
function saveOpen(){try{localStorage.setItem('laneBoardOpenDays',JSON.stringify([...openDays]))}catch(e){}}
function showTab(t){if(!document.getElementById('tab-'+t))t='table';document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));['table','timeline','insights','requirements'].forEach(k=>{document.getElementById('tab-'+k).hidden=t!==k});try{localStorage.setItem('laneBoardTab',t)}catch(e){}if(t==='timeline'&&window.TL)TL.refresh();if(t==='insights'&&window.INS)INS.refresh();if(t==='requirements'&&window.REQ)REQ.refresh()}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
let tab0='table';try{tab0=localStorage.getItem('laneBoardTab')||'table'}catch(e){}
showTab(tab0);
tick();setInterval(()=>{tick();if(!document.getElementById('tab-timeline').hidden&&window.TL)TL.refresh();if(!document.getElementById('tab-insights').hidden&&window.INS)INS.refresh();if(!document.getElementById('tab-requirements').hidden&&window.REQ)REQ.refresh()},REFRESH);
</script></body></html>`;

// Listens when run (launchd, node lane-board.mjs), not when its tests import it.
const MAIN = (() => { try { return realpathSync(process.argv[1] || '') === fileURLToPath(import.meta.url); } catch { return false; } })();

const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const days = Number(url.searchParams.get('days') || 0);
    if (url.pathname === '/insights.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(readTrim(join(BOARD_DIR, 'insights.js')));
    }
    if (url.pathname === '/export/trace.json' || url.pathname === '/export/lanes.xes') {
        const xes = url.pathname.endsWith('.xes');
        let body;
        try { body = xes ? xesExport(days) : traceExport(days); } catch (e) { res.writeHead(500); return res.end(String(e)); }
        const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
        res.writeHead(200, { 'content-type': xes ? 'application/xml; charset=utf-8' : 'application/json', 'cache-control': 'no-store',
            ...(url.searchParams.has('download') ? { 'content-disposition': 'attachment; filename="jjodel-lanes-' + stamp + (xes ? '.xes' : '.trace.json') + '"' } : {}) });
        return res.end(body);
    }
    if (req.url === '/timeline.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(readTrim(join(BOARD_DIR, 'timeline.js')));
    }
    if (req.url === '/requirements.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(readTrim(join(BOARD_DIR, 'requirements.js')));
    }
    if (req.url === '/api/requirements') {
        requirements().then((body) => {
            res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            res.end(body);
        });
        return;
    }
    if (req.url === '/api/timeline') {
        let body;
        try { body = JSON.stringify(timeline()); } catch (e) { body = JSON.stringify({ now: Date.now(), lanes: [], chainDeps: [], error: String(e) }); }
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        return res.end(body);
    }
    if (req.url === '/api') {
        let body;
        try { body = JSON.stringify(collect()); } catch (e) { body = JSON.stringify({ now: Date.now(), load: [], error: String(e), rows: [] }); }
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        return res.end(body);
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
});
if (MAIN) server.listen(PORT, '127.0.0.1', () => console.log('lane-board on http://localhost:' + PORT + ' (refresh ' + REFRESH_S + ' s)'));

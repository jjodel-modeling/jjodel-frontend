#!/usr/bin/env node
// lane-board: a live, read-only table of the Jjodel lanes on http://localhost:4700.
// It never launches, resumes, merges or kills a lane and never writes in a worktree.
// State, outcome and elapsed come from `lane-run status --all`; worktree, kind, chat,
// tier and phase come from the files in ~/.jjodel-lanes/<Prompt-ID>/. The Timeline tab
// (/api/timeline, drawn by timeline.js next to this file) shows turns, decisions,
// parallelism and dependencies; finished lanes are cached in timeline-cache.json. The Insights
// tab adds /api/insights: model, cost, code areas and first-shot success per lane, from the lane
// logs, `git log --all` and the trunk's log entries and decisions.md (insights.js, README).
// Usage: node ~/.jjodel-lanes/board/lane-board.mjs [--port 4700] [--refresh 30]

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync, openSync, readSync, fstatSync, closeSync } from 'node:fs';
import { homedir, loadavg } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const arg = (name, dflt) => {
    const i = process.argv.indexOf(name);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const PORT = Number(arg('--port', process.env.LANE_BOARD_PORT || 4700));
const REFRESH_S = Number(arg('--refresh', process.env.LANE_BOARD_REFRESH || 30));
const ROOT = process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes');
// In the repo the board sits in frontend/scripts/lane-board/, beside lane-run.mjs; outside it, the trunk's copy.
const LANE_RUN = process.env.LANE_RUN || (existsSync(join(HERE, '..', 'lane-run.mjs')) ? join(HERE, '..', 'lane-run.mjs') : join(homedir(), 'jjodel-release/frontend/scripts/lane-run.mjs'));
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

// The header of a lane's prompt: input-1.md (from P-2026-09-28-1545 on), else the file named in
// prompt.txt, else the trunk's copy of the prompt (lanes of 2026-09-26/27, removed worktrees).
// Kept once found, or once the lane has exited: a prompt's Lane, Chat and title lines do not change.
const headMem = new Map();
function header(dir) {
    if (headMem.has(dir)) return headMem.get(dir);
    const promptPath = readTrim(join(dir, 'prompt.txt'));
    const file = promptPath.replace(/^.*\//, '');
    let text = readTrim(join(dir, 'input-1.md')).slice(0, 4000);
    if (!text && promptPath) text = readTrim(promptPath).slice(0, 4000);
    if (!text && existsSync(join(dir, 'exit.txt'))) text = trunkPrompt(dir.replace(/^.*\//, ''), file).slice(0, 4000);
    const line = (k) => (text.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')) || [])[1] || '';
    const title = (text.match(/^#\s+(.*)$/m) || [])[1] || '';
    const h = { lane: line('Lane'), chat: line('Chat'), title, file };
    if (text || existsSync(join(dir, 'exit.txt'))) headMem.set(dir, h);
    return h;
}

/** Kind from the Lane line's first word (P13: fast, full (<trigger>), discovery); lane-run's merge prompts declare `Lane: full (merge; …)`. */
function kindOf(laneLine, file = '') {
    const l = laneLine.toLowerCase();
    if (/^merge|^full \((merge|take[- ]trunk)\b/.test(l) || /_prompt_merge_|_take_trunk/.test(file)) return 'merge';
    if (/^fast/.test(l)) return 'fast';
    // A full lane that is only a read-only Phase 1 (its fix is a later lane) is a discovery; a two-phase lane is not.
    if (/^discovery|^phase 1 only|^full \(discovery\b/.test(l) || (/^full \(phase 1\b/.test(l) && /read-only/.test(l) && !/two-phase|same session|in cascade|after the chat'?s go/.test(l))) return 'discovery';
    if (/^full|^phase|implementation/.test(l)) return 'phase2';
    return '';
}

function phaseOf(dir) {
    const m = [...tail(join(dir, 'log.jsonl')).matchAll(/"description":"((?:[^"\\]|\\.)*)"/g)];
    return m.length ? m[m.length - 1][1].replace(/\\(.)/g, '$1') : '';
}

/** A heuristic, never a promise: the median for the kind minus the elapsed, corrected by the phase and the load. */
function estimate(kind, minutes, phase, load) {
    const p = phase.toLowerCase();
    const stretch = load > 20 ? 1.5 : 1;
    if (/gate|closure|commit body|status flip|flip/.test(p)) return 'under 5 min';
    if (/probe|dev server/.test(p)) return 'about 5-15 min';
    const med = MEDIAN[kind];
    if (!med) return '?';
    let left = /tests? first|baseline/.test(p) ? med * 0.8 : med - minutes;
    left = Math.round(left * stretch);
    if (left <= 0) return 'past the median';
    return 'about ' + left + ' min';
}

/** Prompt-ID P-YYYY-MM-DD-HHmm → epoch ms (local time). */
function idTime(id) {
    const m = id.match(/P-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : 0;
}

let cache = { at: 0, data: null };

let cposMem = { at: 0, v: new Map() };
function chainPosMem() { if (Date.now() - cposMem.at > CACHE_MS) cposMem = { at: Date.now(), v: chainPositions() }; return cposMem.v; }
function collect() {
    if (cache.data && Date.now() - cache.at < CACHE_MS) return cache.data;
    const now = Date.now();
    const load = loadavg();
    const r = spawnSync(process.execPath, [LANE_RUN, 'status', '--all'], { encoding: 'utf8', timeout: 15_000 });
    const error = r.status === 0 ? '' : (r.stderr || r.error?.message || 'lane-run status failed').trim();
    const rows = [];
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
        const row = { id, state, outcome, minutes, chain: isChain, t, worktree: '', kind: '', lane: '', chat: '', title: '', tier: '', phase: '', left: '' };
        if (!isChain && existsSync(dir)) {
            row.worktree = readTrim(join(dir, 'worktree.txt')).replace(homedir(), '~');
            const h = header(dir);
            row.lane = h.lane; row.chat = h.chat; row.title = h.title;
            row.kind = kindOf(h.lane, h.file);
            row.tier = readTrim(join(dir, 'tier.txt')).split(/[\s:]/)[0];
            if (live) {
                row.phase = phaseOf(dir);
                row.left = estimate(row.kind, minutes, row.phase, load[0]);
            }
        }
        if (!isChain) row.launcher = launcherOf(id, chainPosMem().get(id), row.chat);
        row.live = live;
        row.recent = recent;
        row.day = t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : 'unknown';
        if (!isChain) Object.assign(row, laneSpan(id, now));
        rows.push(row);
    }
    // A chain spans its lanes: the earliest start, the latest end once every lane that started has ended, the sum of their work.
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const row of rows) {
        if (!row.chain) continue;
        const spans = [...chainPosMem()].filter(([, p]) => p.chain === row.id).map(([lid]) => byId.get(lid) || laneSpan(lid, now)).filter((s) => s.start);
        row.start = spans.length ? Math.min(...spans.map((s) => s.start)) : 0;
        row.end = !row.live && spans.length && spans.every((s) => s.end) ? Math.max(...spans.map((s) => s.end)) : 0;
        row.work = spans.reduce((a, s) => a + s.work, 0);
    }
    if (tlDirty) {
        try { writeFileSync(TL_CACHE_FILE + '.tmp', JSON.stringify(tlCache)); renameSync(TL_CACHE_FILE + '.tmp', TL_CACHE_FILE); } catch { /* best effort */ }
        tlDirty = false;
    }
    const data = { now: Date.now(), load: load.map((x) => x.toFixed(2)), error, rows };
    cache = { at: Date.now(), data };
    return data;
}

// ── timeline ────────────────────────────────────────────────────────────────
// One lane = one or more turns. Turn k starts at the mtime of input-k.md and lasts the
// duration_ms of the k-th `result` event of log.jsonl. The gaps between turns are the
// waits for a decision (GO, ACK, answer); input-k.md for k >= 2 is that decision.
// A `result` that is not a turn (a task notification) is skipped, and a turn never runs past the next input.
// Lanes from before the input files have one turn: started.txt to exit.txt.

// The cache lives with the lanes, never in a worktree.
const TL_CACHE_FILE = process.env.LANE_BOARD_CACHE || join(ROOT, 'board', 'timeline-cache.json');
let tlCache = {};
try { tlCache = JSON.parse(readFileSync(TL_CACHE_FILE, 'utf8')); } catch { tlCache = {}; }
let tlDirty = false;

const mtime = (p) => { try { return statSync(p).mtimeMs; } catch { return 0; } };
const size = (p) => { try { return statSync(p).size; } catch { return -1; } };

/** The `result` events of a log (its bytes, or null): duration and the last Outcome line of each turn. */
function results(buf) {
    if (!buf) return [];
    const out = [];
    const key = Buffer.from('"type":"result"');
    let at = buf.indexOf(key);
    while (at !== -1) {
        const s0 = buf.lastIndexOf(10, at) + 1;
        let s1 = buf.indexOf(10, at);
        if (s1 === -1) s1 = buf.length;
        try {
            const e = JSON.parse(buf.subarray(s0, s1).toString('utf8'));
            const notTurn = (e.origin && e.origin.kind === 'task-notification') || (e.num_turns === 0 && !e.result);
            if (e.type === 'result' && !notTurn) {
                const m = [...String(e.result || '').matchAll(/Outcome:\s*`?([a-z][a-z-]*)/gi)];
                out.push({ ms: Number(e.duration_ms) || 0, outcome: m.length ? m[m.length - 1][1].toLowerCase() : '' });
            }
        } catch { /* a half-written line: skip */ }
        at = buf.indexOf(key, s1);
    }
    return out;
}

/** Calls fn with every line of buf that contains key, once per line. */
function eachLine(buf, key, fn) {
    const k = Buffer.from(key);
    let at = buf.indexOf(k);
    while (at !== -1) {
        const s0 = buf.lastIndexOf(10, at) + 1;
        let s1 = buf.indexOf(10, at);
        if (s1 === -1) s1 = buf.length;
        fn(buf.subarray(s0, s1));
        at = buf.indexOf(k, s1);
    }
}

const parseLine = (raw) => { try { return JSON.parse(raw.toString('utf8')); } catch { return null; } };
const ASSISTANT = Buffer.from('{"type":"assistant"');

/** What the Insights tab reads from a lane's log. total_cost_usd and modelUsage are cumulative over the
 *  session (a resume restores them; 0 decreases in 196 consecutive pairs, 2026-10-10), so the largest is the lane's. */
function logFacts(buf, res) {
    const f = { model: '', cli: '', runs: 0, costUSD: 0, outTokens: 0, subModels: {}, apiError: false, outcome: 'none',
        blockedRun: res.some((r) => r.outcome === 'blocked'), overTime: res.some((r) => r.ms > 90 * 60e3) };
    if (!buf) return f;
    eachLine(buf, '"subtype":"init"', (raw) => {
        const e = parseLine(raw);
        if (!e || e.type !== 'system' || e.subtype !== 'init') return;
        f.runs++;
        if (!f.model) { f.model = e.model || ''; f.cli = e.claude_code_version || ''; }
    });
    eachLine(buf, '"type":"result"', (raw) => {
        const e = parseLine(raw);
        if (!e || e.type !== 'result') return;
        if (typeof e.total_cost_usd === 'number') f.costUSD = Math.max(f.costUSD, e.total_cost_usd);
        if (e.modelUsage) f.outTokens = Math.max(f.outTokens, Object.values(e.modelUsage).reduce((a, v) => a + ((v && v.outputTokens) || 0), 0));
        if (e.terminal_reason === 'api_error' || e.is_error) f.apiError = true;
    });
    // Subagents: assistant events with a parent tool use; only their model is read.
    eachLine(buf, '"parent_tool_use_id":"', (raw) => {
        if (!raw.subarray(0, ASSISTANT.length).equals(ASSISTANT)) return;
        const m = /"model":"([^"]+)"/.exec(raw.toString('utf8'));
        if (m && m[1] !== '<synthetic>') f.subModels[m[1]] = (f.subModels[m[1]] || 0) + 1;
    });
    // The outcome as `lane-run status` reads it (lastOutcome there): the last assistant text line that starts with Outcome:.
    let last = null;
    eachLine(buf, 'Outcome:', (raw) => {
        if (!raw.subarray(0, ASSISTANT.length).equals(ASSISTANT)) return;
        const e = parseLine(raw);
        const content = e && e.message && Array.isArray(e.message.content) ? e.message.content : [];
        for (const b of content) {
            if (!b || b.type !== 'text' || typeof b.text !== 'string') continue;
            for (const line of b.text.split('\n')) if (line.trim().startsWith('Outcome:')) last = line.trim();
        }
    });
    if (last !== null) f.outcome = (/^Outcome:\s*(done|hard-stop|question|blocked)\b/.exec(last) || [])[1] || 'unparsed';
    return f;
}

/** The class of a resume input (input-k.md, k >= 2, or msg-k.md): first-line rules, plus a body rule for a fix request.
 *  19/20 on a hand-checked sample with the first-line rules, 20/20 with the body rule on the same sample (discovery P-2026-10-10-1520 §4.2). */
function inputClass(text) {
    const t = text.replace(/^\[P-[^\]]*\]\s*/, '');
    const l = t.split('\n').map((x) => x.trim()).find(Boolean) || '';
    const body = t.split(/\n---\s*\n/)[0].slice(0, 1200);
    if (/^(The Mac (went to sleep|lost)|Your (last turn|session) ended|The (previous resume|session) ended|The chat stopped this session)/i.test(l)) return 'recovery';
    if (/^(Rework|Chat check: one fix|Corrections?\b|Two corrections|Fix\b|Redo|Not yet|Failed|The visual check failed)|with one fix before the GO|fails?\b.*before the merge/i.test(l)) return 'corrective';
    if (!/Phase 2/i.test(l) && /\b(one|two|three|\d) (precise )?fix(es)?\b|\bfix(es)? before the GO\b/i.test(body)) return 'corrective';
    if (/^ACK\b/.test(l)) return 'ack';
    if (/^(Answers?\b|Q\d|Recommended answer|Recommendation adopted|Chat decision|.*adopted as recommended|.*ratified as recommended)/i.test(l)) return 'answer';
    if (/^(Visual )?GO\b|^GO[.,:]|Visual GO|Phase 2 GO|^Visual check by the chat/i.test(l)) return 'go';
    if (/^\/status-flip/.test(l)) return 'closure';
    return 'other';
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
    const names = readdirSync(dir);
    const inputs = names.map((n) => /^input-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
    // v6: the Insights facts (logFacts) and the class of each resume input ride the same cache.
    const key = ['v6', size(join(dir, 'log.jsonl')), mtime(exitP), inputs.length, mtime(join(dir, 'request.md'))].join('/');
    const hit = tlCache[id];
    if (hit && hit.key === key && exited) return hit.v;
    let buf = null;
    try { buf = readFileSync(join(dir, 'log.jsonl')); } catch { /* no log yet */ }
    const res = results(buf);
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
            if (!last) e = Math.min(e, starts[i + 1]);
            if (last && !exited) e = now;
            const input = join(dir, 'input-' + inputs[i] + '.md');
            turns.push({ s: st, e: Math.max(e, st), o: res[i] ? res[i].outcome : '', d: i ? decisionText(input) : '', c: i ? inputClass(readTrim(input).slice(0, 1500)) : '' });
        });
    }
    const facts = logFacts(buf, res);
    // Turns from input-k.md carry each run; before them a lane has one turn, started.txt (the last run's start) to exit.txt.
    facts.fromInputs = inputs.length > 0;
    facts.res = res.map((r) => ({ ms: r.ms, outcome: r.outcome }));
    // Lanes from before input-k.md kept their resume messages as msg-k.md (lane-run v2): classed, not aligned to turns.
    const msgs = names.map((n) => /^msg-(\d+)\.md$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
    facts.resumeCls = inputs.length > 1 ? turns.slice(1).map((t) => t.c) : msgs.map((k) => inputClass(readTrim(join(dir, 'msg-' + k + '.md')).slice(0, 1500)));
    const text = readTrim(join(dir, 'input-1.md')).slice(0, 20000);
    const cites = [...new Set((text.match(/P-\d{4}-\d{2}-\d{2}-\d{4}/g) || []).filter((x) => x !== id))].map((c) => ({ id: c, text: citeText(text, c) }));
    // Declared dependencies (PROTOCOL P13, `Depends:` header line): exact, unlike the citations.
    const depLine = (text.match(/^Depends:\s*(.*)$/m) || [])[1] || '';
    const depends = /^none\b/i.test(depLine.trim()) ? [] : [...new Set(depLine.match(/P-\d{4}-\d{2}-\d{2}-\d{4}/g) || [])].filter((x) => x !== id);
    // The request (PROTOCOL P13, RC-43): the `Request:` header line, and the words kept in request.md, written by lane-run start or later by the chat.
    const request = { url: ((text.split(/\n## /)[0].match(/^Request:[ \t]*(.*)$/m) || [])[1] || '').trim(), text: readTrim(join(dir, 'request.md')).slice(0, 4000) };
    const v = { turns, cites, depends, declared: !!depLine, request, exited, facts };
    if (exited) { tlCache[id] = { key, v }; tlDirty = true; }
    return v;
}

/** When a lane started and ended, in epoch ms: the first turn's start and, once it has exited, the last turn's end; 0 when unknown or running.
 *  work: the sum of the turn durations in ms, the running turn up to now (the waits for a decision are not work). */
function laneSpan(id, now) {
    if (!/^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(id)) return { start: 0, end: 0, work: 0 };
    try {
        const { turns, exited } = laneTimeline(id, now);
        if (!turns.length) return { start: 0, end: 0, work: 0 };
        const work = Math.round(turns.reduce((a, t) => a + Math.max(0, t.e - t.s), 0));
        return { start: Math.round(turns[0].s), end: exited ? Math.round(turns[turns.length - 1].e) : 0, work };
    } catch { return { start: 0, end: 0, work: 0 }; }
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

// ── launcher ────────────────────────────────────────────────────────────────
// Who launched a lane, from the commit that added its prompt to docs/prompts/:
// a claude.ai chat leaves a `Claude-Session:` trailer, a local Claude Code session
// only `Co-Authored-By: Claude`, a hand commit neither; lane-run writes the merge and
// take-trunk prompts itself; a chain launches every lane after its first.
const REPO = process.env.JJODEL_REPO || join(homedir(), 'jjodel');
let launchMem = { at: 0, map: new Map() };
function promptCommits() {
    if (Date.now() - launchMem.at < 5 * 60e3) return launchMem.map;
    const map = new Map();
    const r = spawnSync('git', ['-C', REPO, 'log', '--all', '--diff-filter=A', '--name-only', '--format=%x1e%h%x1f%an%x1f%aI%x1f%B%x1f', '--', 'docs/prompts/'], { encoding: 'utf8', timeout: 20_000, maxBuffer: 64 * 1024 * 1024 });
    if (r.status === 0) {
        for (const rec of r.stdout.split('\x1e')) {
            const f = rec.split('\x1f');
            if (f.length < 5) continue;
            const [sha, author, date, body] = f;
            const session = (body.match(/Claude-Session:\s*(\S+)/) || [])[1] || '';
            const models = [...body.matchAll(/Co-Authored-By:\s*(Claude[^<\n]*)/gi)].map((m) => m[1].trim());
            const model = (body.match(/^Model:\s*(.+)$/m) || [])[1] || '';
            for (const file of f[4].split('\n').map((x) => x.trim()).filter(Boolean)) {
                const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})_[^/]*\.md$/.exec(file);
                if (!m) continue;
                // git log lists newest first: the last write per Prompt-ID is the oldest commit, the one that added it.
                map.set('P-' + m[1] + '-' + m[2] + m[3], { sha, author, date, session, models, model, file: file.replace(/^.*\//, '') });
            }
        }
    }
    launchMem = { at: Date.now(), map };
    return map;
}

function launcherOf(id, chainPos, chat) {
    if (chainPos && chainPos.index > 0) return { by: 'chain', label: 'chain', detail: chainPos.chain + ' · step ' + (chainPos.index + 1) };
    const c = promptCommits().get(id);
    if (!c) return { by: 'unknown', label: 'unknown', detail: 'no commit adds a prompt with this Prompt-ID' };
    const base = { sha: c.sha, file: c.file, date: c.date };
    if (/_prompt_merge_|_take_trunk/.test(c.file)) return { ...base, by: 'harness', label: 'lane-run', detail: 'merge prompt written by lane-run (' + c.sha + ')' };
    if (c.session) return { ...base, by: 'chat', label: 'chat', detail: c.session.replace(/^https?:\/\/claude\.ai\/code\//, '') + (c.models.length ? ' · ' + c.models.join(', ') : ''), session: c.session };
    // A prompt that names its chat (`Chat: C-…`) was written by that chat even when the commit went through the Mac shell without the session trailer.
    if (!chat) chat = ((c.models.join(' ') + ' ' + c.model).match(/chat (C-\d{4}-\d{2}-\d{2}-\d{4})/) || [])[1] || '';
    if (!chat && /\bchat\b/i.test(c.model)) chat = 'a chat (' + c.model.trim() + ')';
    if (chat) return { ...base, by: 'chat', label: 'chat', detail: chat + ' · committed from the Mac shell' + (c.models.length ? ' · ' + c.models.join(', ') : '') + ' (' + c.sha + ')' };
    if (c.models.length || c.model) return { ...base, by: 'claude-code', label: 'Claude Code', detail: 'local session · ' + (c.models.join(', ') || c.model) + ' (' + c.sha + ')' };
    return { ...base, by: 'manual', label: c.author || 'manual', detail: 'committed by hand (' + c.sha + ')' };
}

function chainPositions() {
    const pos = new Map();
    for (const n of readdirSync(ROOT)) {
        if (!/^(auto)?chain-/.test(n)) continue;
        try {
            const c = JSON.parse(readFileSync(join(ROOT, n, 'chain.json'), 'utf8'));
            (c.lanes || []).forEach((l, i) => { if (l && l.id) pos.set(l.id, { chain: c.id || n, index: i }); });
        } catch { /* not a chain */ }
    }
    return pos;
}

let tlMem = { at: 0, data: null };
function timeline() {
    if (tlMem.data && Date.now() - tlMem.at < CACHE_MS) return tlMem.data;
    const now = Date.now();
    const status = new Map(collect().rows.map((r) => [r.id, r]));
    const cpos = chainPositions();
    const lanes = [];
    for (const id of readdirSync(ROOT)) {
        if (!/^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(id)) continue;
        const dir = join(ROOT, id);
        try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
        let t;
        try { t = laneTimeline(id, now); } catch { continue; }
        const st = status.get(id) || {};
        const h = st.worktree !== undefined ? st : (() => { const x = header(dir); return { ...x, worktree: readTrim(join(dir, 'worktree.txt')).replace(homedir(), '~'), kind: kindOf(x.lane, x.file) }; })();
        lanes.push({ id, launcher: launcherOf(id, cpos.get(id), h.chat), title: h.title || '', chat: h.chat || '', worktree: h.worktree || '', kind: h.kind || '', tier: st.tier || '', state: st.state || (t.exited ? 'exited' : '?'), outcome: st.outcome || '', live: !!st.live, turns: t.turns, cites: t.cites, depends: t.depends || [], declared: !!t.declared, request: t.request || { url: '', text: '' } });
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

// ── insights ────────────────────────────────────────────────────────────────
// /api/insights (discovery P-2026-10-10-1520): per lane, the model, cost, code areas and success
// signals that the Insights tab aggregates by range. Log facts ride the per-lane cache (v6, above).
// Git facts (commits by Prompt-ID, reverts) are scanned once, then only for the commits since the
// last scan, and only when the hash of `git for-each-ref` moves. Log entries and RC rows are read
// from the trunk ref, never from a working tree, and again only when the trunk moves.
const TRUNK = process.env.JJODEL_TRUNK || 'alfonso-frontend-jjtl';
// CLAUDE.md §3.2: the six files whose edit needs a Layer Impact Report. A flag on the lane, not an area.
const CZ_FILES = ['useJjomSync.ts', 'syncState.ts', 'canvasToJjom.ts', 'portDistribution.ts', 'useM1ReferenceEdges.ts', 'VersionFixer.tsx'];
// First match wins; every path not matched before lands in other-ui. Probes follow the area they probe and are not attributed.
const AREAS = [
    { key: 'viewpoint', label: 'Viewpoint (IR, authoring, derive)', rule: 'frontend/src/components/editor-v2/viewpoint/**', re: /^frontend\/src\/components\/editor-v2\/viewpoint\// },
    { key: 'simulator', label: 'Simulator', rule: 'editor-v2/sim/**, model/simulation/**', re: /^frontend\/src\/(components\/editor-v2\/sim|model\/simulation)\// },
    { key: 'canvas', label: 'Canvas', rule: 'the rest of frontend/src/components/editor-v2/**', re: /^frontend\/src\/components\/editor-v2\// },
    { key: 'languages', label: 'Languages and codegen', rule: 'src/jjscript, jjel, jjtl, codegen', re: /^frontend\/src\/(jjscript|jjel|jjtl|codegen)\// },
    { key: 'model-core', label: 'Model core', rule: 'src/model, redux, joiner, view, common, api, services', re: /^frontend\/src\/(model|redux|joiner|view|common|api|services)\// },
    { key: 'harness', label: 'Harness', rule: 'frontend/scripts/** (not probes), .claude/, CLAUDE.md, AGENTS.md, package.json, vitest.config.ts', re: /^(frontend\/scripts\/|\.claude\/|CLAUDE\.md$|AGENTS\.md$|frontend\/package\.json$|frontend\/vitest\.config\.ts$|\.gitignore$)/ },
    { key: 'other-ui', label: 'Other UI', rule: 'everything else', re: /^/ },
];
const BANDS = [[50, '≤50'], [200, '51–200'], [800, '201–800'], [Infinity, '>800']];
const isProbe = (p) => p.startsWith('frontend/scripts/probe/') || /(^|\/)_tmp_/.test(p);
const areaOf = (p) => (isProbe(p) ? '' : AREAS.find((a) => a.re.test(p)).key);
const git = (args) => spawnSync('git', ['-C', REPO, ...args], { encoding: 'utf8', timeout: 20_000, maxBuffer: 64 * 1024 * 1024 });
const alive = (pid) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

/** The trunk's copy of a lane's prompt, found by the file name of prompt.txt or by the Prompt-ID's time stamp; '' when none. */
let trunkPrompts = { at: 0, files: [] };
function trunkPrompt(id, file) {
    if (Date.now() - trunkPrompts.at > 5 * 60e3) {
        const r = git(['ls-tree', '--name-only', TRUNK, 'docs/prompts/']);
        trunkPrompts = { at: Date.now(), files: r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [] };
    }
    const m = /^P-(\d{4}-\d{2}-\d{2})-(\d{4})$/.exec(id);
    const stamp = m ? 'docs/prompts/claude_' + m[1] + '_' + m[2] + '_' : '';
    for (const p of trunkPrompts.files.filter((x) => (file && x.endsWith('/' + file)) || (stamp && x.startsWith(stamp)))) {
        const r = git(['show', TRUNK + ':' + p]);
        if (r.status === 0 && r.stdout.includes('Prompt-ID: ' + id)) return r.stdout;
    }
    return '';
}

const gitFacts = { key: '', scannedAt: 0, trunk: '', seen: new Set(), byPid: new Map(), reverted: new Map(), entries: [], rc: [] };
let gitFlight = null;

/** git as a child process: its stdout, or null on a failure or after 60 s. */
function gitAsync(args, input = '') {
    return new Promise((resolve) => {
        const child = spawn('git', ['-C', REPO, ...args]);
        const chunks = [];
        const timer = setTimeout(() => child.kill(), 60_000);
        child.stdout.on('data', (d) => chunks.push(d));
        child.on('error', () => { clearTimeout(timer); resolve(null); });
        child.on('close', (code) => { clearTimeout(timer); resolve(code === 0 ? Buffer.concat(chunks).toString('utf8') : null); });
        child.stdin.on('error', () => { /* git exited first */ });
        child.stdin.end(input);
    });
}

/** Brings gitFacts up to date when a ref moved, in two passes run as child processes, in parallel with the
 *  caller's log parsing: every commit's subject and body (0.1 s), then --numstat outside docs/ for the
 *  new commits that carry a Prompt-ID only (0.6 s on the first scan, measured 2026-10-10). */
function refreshGit(since) {
    if (gitFlight) return gitFlight;
    const refs = git(['for-each-ref', '--format=%(objectname) %(refname)']);
    if (refs.status !== 0) return Promise.resolve(gitFacts);
    const key = createHash('sha1').update(refs.stdout).digest('hex');
    if (key === gitFacts.key) return Promise.resolve(gitFacts);
    const trunk = (refs.stdout.split('\n').find((l) => l.endsWith(' refs/heads/' + TRUNK)) || '').split(' ')[0];
    // An hour of slack on the committer date; the first scan starts two days before the first lane.
    const from = gitFacts.scannedAt ? new Date(gitFacts.scannedAt - 3600e3).toISOString() : since;
    const scanAt = Date.now();
    gitFlight = (async () => {
        const out = await gitAsync(['log', '--all', '--no-merges', '--since=' + from, '--format=%x1e%H%x1f%aI%x1f%s%x1f%b']);
        if (out !== null) {
            const fresh = addCommits(out);
            const stats = fresh.length ? await gitAsync(['log', '--no-walk=unsorted', '--no-renames', '--numstat', '--format=%x1e%H', '--stdin', '--', '.', ':(exclude)docs'], fresh.map((c) => c.sha).join('\n') + '\n') : '';
            if (stats !== null) {
                const bySha = new Map(fresh.map((c) => [c.sha, c]));
                for (const rec of stats.split('\x1e')) {
                    const [head, ...rest] = rec.split('\n');
                    const c = bySha.get(head.trim());
                    if (c) c.stat = rest.map((x) => x.trim().split('\t')).filter((x) => x.length === 3).map(([a, d, p]) => ({ a: a === '-' ? 0 : Number(a), d: d === '-' ? 0 : Number(d), p }));
                }
                gitFacts.key = key;
                gitFacts.scannedAt = scanAt;
            } else {
                // No stats: forget these commits, so the next scan files them again.
                for (const c of fresh) {
                    gitFacts.seen.delete(c.sha);
                    for (const [pid, list] of gitFacts.byPid) if (list.includes(c)) gitFacts.byPid.set(pid, list.filter((x) => x !== c));
                }
            }
        }
        if (trunk && trunk !== gitFacts.trunk) { gitFacts.entries = logEntries(); gitFacts.rc = rcRows(); gitFacts.trunk = trunk; }
        return gitFacts;
    })().finally(() => { gitFlight = null; });
    return gitFlight;
}

/** Files every commit of a `git log` by the Prompt-ID of its subject suffix (CLAUDE.md §6.2) or of a `Prompt-ID:`
 *  trailer, and every revert by the sha it reverts; returns the new commits that carry a Prompt-ID. */
function addCommits(out) {
    const fresh = [];
    for (const rec of out.split('\x1e')) {
        const f = rec.split('\x1f');
        if (f.length < 4 || gitFacts.seen.has(f[0])) continue;
        const [sha, adate, subject, body] = f;
        gitFacts.seen.add(sha);
        const rv = /This reverts commit ([0-9a-f]{40})/.exec(body);
        if (rv) gitFacts.reverted.set(rv[1], sha.slice(0, 9));
        const pid = (/\((P-\d{4}-\d{2}-\d{2}-\d{4})\)\s*$/.exec(subject) || /^Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})/m.exec(body) || [])[1];
        if (!pid) continue;
        const list = gitFacts.byPid.get(pid) || [];
        // A cherry-pick repeats subject and author date on another sha: counted once.
        if (list.some((c) => c.subject === subject && c.adate === adate)) continue;
        const c = { sha, adate, subject, stat: [] };
        list.push(c);
        gitFacts.byPid.set(pid, list);
        fresh.push(c);
    }
    return fresh;
}

const stampPid = (s) => { const m = /(\d{4})-(\d{2})-(\d{2})[ T_](\d{2}):?(\d{2})/.exec(s || ''); return m ? 'P-' + m[1] + '-' + m[2] + '-' + m[3] + '-' + m[4] + m[5] : ''; };
const filePid = (s) => { const m = /claude_(\d{4}-\d{2}-\d{2})_(\d{4})_/.exec(s || ''); return m ? 'P-' + m[1] + '-' + m[2] : ''; };

/** The P9 entries of the trunk: inboxes first (newest), then the active log, then the archive. */
function logEntries() {
    const ls = git(['ls-tree', '--name-only', TRUNK, 'docs/log-inbox/']);
    const files = [...(ls.status === 0 ? ls.stdout.split('\n').filter((p) => p.endsWith('.md')) : []), 'docs/claude-code-log.md', 'docs/claude-code-log-archive.md'];
    const raw = [];
    for (const file of files) {
        const r = git(['show', TRUNK + ':' + file]);
        if (r.status !== 0) continue;
        let cur = null;
        for (const ln of r.stdout.split('\n')) {
            if (/^## \d{4}-\d{2}-\d{2}/.test(ln)) { cur = { head: ln, fields: {} }; raw.push(cur); continue; }
            const m = cur && /^\*\*([^*]+)\*\*:\s*(.*)$/.exec(ln);
            if (m && !(m[1].trim() in cur.fields)) cur.fields[m[1].trim()] = m[2];
        }
    }
    return raw.map(({ head, fields }) => {
        const c = (fields.Corregge || '').trim();
        const filled = c !== '' && !/^[—-]/.test(c);
        const o = fields.Outcome || '';
        return {
            pid: (/\((P-\d{4}-\d{2}-\d{2}-\d{4})\)/.exec(head) || [])[1] || stampPid(fields['Prompt document name']),
            type: (/^## \S+ — ([a-z]+)/.exec(head) || [])[1] || '',
            cPid: filled ? (/P-\d{4}-\d{2}-\d{2}-\d{4}/.exec(c) || [])[0] || filePid(c) || stampPid(c) : '',
            causa: ((fields.Causa || '').match(/\(([a-g])\)|^([a-g])\b/) || []).slice(1).find(Boolean) || '',
            outcome: o.includes('✅') ? 'completed' : o.includes('⚠') ? 'partial' : o.includes('❌') ? 'problems' : '',
            regressions: (fields.Regressions || '').trim().split(/[ .,;]/)[0],
            smoke: (fields['Smoke visivo'] || '').trim().split(/[ (—,;]/)[0],
        };
    });
}

/** RC rows of the trunk's decisions.md from RC-20 (the orchestrated lanes) on: id, date, the bold title. */
function rcRows() {
    const r = git(['show', TRUNK + ':docs/decisions.md']);
    if (r.status !== 0) return [];
    const lines = r.stdout.split('\n');
    const out = [];
    lines.forEach((ln, i) => {
        const m = /^- \*\*RC-(\d+)\*\* \((\d{4}-\d{2}-\d{2})/.exec(ln);
        if (!m || Number(m[1]) < 20) return;
        const t = /\*\*([^*]+)\*\*/.exec(ln.replace(/^- \*\*RC-\d+\*\*/, '')) || /\*\*([^*]+)\*\*/.exec(lines[i + 1] || '');
        out.push({ id: 'RC-' + m[1], date: m[2], title: t ? t[1].trim().replace(/\.$/, '') : '' });
    });
    return out;
}

/** One lane of /api/insights. firstShot (discovery §4.3): ends done or hard-stop, no rework signal, no blocked or over-90-minute run; null while it runs. */
function insightLane(id, dir, t, g, corr, own, now) {
    const f = t.facts || {};
    const h = header(dir);
    const tierLine = readTrim(join(dir, 'tier.txt'));
    const tier = (/^(heavy|light)\b/.exec(tierLine) || [])[1] || '';
    // RC-45: a lane whose tier was drawn at random says so in its Lane line, `tier drawn (RC-45): heavy|light`.
    const dm = /tier drawn \(RC-45\)\s*:?\s*(heavy|light)?/i.exec(h.lane);
    const commits = g.byPid.get(id) || [];
    const lines = {};
    const files = new Set();
    let cz = false;
    for (const c of commits) for (const s of c.stat) {
        if (!s.p || s.p.startsWith('docs/')) continue;
        files.add(s.p);
        if (CZ_FILES.some((n) => s.p.endsWith('/' + n))) cz = true;
        const a = areaOf(s.p);
        if (a) lines[a] = (lines[a] || 0) + s.a + s.d;
    }
    const total = Object.values(lines).reduce((a, b) => a + b, 0);
    const byLines = Object.keys(lines).sort((a, b) => lines[b] - lines[a]);
    const live = !t.exited && alive(Number(readTrim(join(dir, 'pid.txt'))));
    const cls = f.resumeCls || [];
    const signals = {
        corrective: cls.includes('corrective'),
        correctedBy: [...new Set(corr.filter((e) => e.pid !== id).map((e) => e.pid))],
        selfCorrected: corr.some((e) => e.pid === id),
        reverted: commits.map((c) => g.reverted.get(c.sha)).filter(Boolean),
        blockedRun: !!f.blockedRun, overTime: !!f.overTime, recovery: cls.includes('recovery'),
        resumeTextComplete: cls.length >= Math.max(0, (f.runs || 0) - 1),
    };
    const final = live ? 'running' : f.outcome || 'none';
    const rework = signals.corrective || signals.correctedBy.length > 0 || signals.selfCorrected || signals.reverted.length > 0;
    const failedRun = signals.blockedRun || signals.overTime || ['blocked', 'none', 'unparsed'].includes(final);
    const turns = t.turns || [];
    const end = turns.length ? turns[turns.length - 1].e : 0;
    // Without input-k.md the one turn covers the last run only: runs and work come from the result events, the start from the Prompt-ID.
    const res = f.fromInputs || !(f.res || []).length ? null : f.res;
    const runs = res
        ? res.map((r, i) => ({ start: null, ms: r.ms, outcome: r.outcome, input: i === 0 ? 'first' : cls.length === res.length - 1 ? cls[i - 1] : 'unknown' }))
        : turns.map((x, i) => ({ start: Math.round(x.s), ms: Math.round(x.e - x.s), outcome: x.o || '', input: i === 0 ? 'first' : x.c || 'unknown' }));
    const start = turns.length ? Math.round(res ? Math.min(turns[0].s, idTime(id) || turns[0].s) : turns[0].s) : 0;
    return {
        id, day: id.slice(2, 12), start, end: Math.round(end), kind: kindOf(h.lane, h.file),
        model: f.model || null, subagentModels: f.subModels || {}, tier, tierReason: tierLine.replace(/^[^:]*:\s*/, ''),
        drawn: dm ? (dm[1] || tier || '').toLowerCase() || null : null, cliVersion: f.cli || '',
        runs, final, workMs: Math.round(runs.reduce((a, x) => a + Math.max(0, x.ms), 0)), costUSD: Math.round((f.costUSD || 0) * 100) / 100, outTokens: f.outTokens || 0,
        commits: commits.map((c) => c.sha.slice(0, 9)), files: [...files], lines, primaryArea: byLines[0] || '', criticalZone: cz,
        sizeBand: total ? BANDS.find(([max]) => total <= max)[1] : null,
        signals, rework, failedRun,
        firstShot: live ? null : ['done', 'hard-stop'].includes(final) && !rework && !failedRun,
        causa: [...new Set([...corr, own].filter(Boolean))].map((e) => e.causa).filter(Boolean),
        selfAssessment: own ? { outcome: own.outcome, regressions: own.regressions, causa: own.causa, corregge: own.cPid, smoke: own.smoke } : null,
        ageDays: live ? 0 : Math.round(((now - end) / 864e5) * 10) / 10,
    };
}

let insMem = { at: 0, data: null };
let insFlight = null;
function insights() {
    if (insMem.data && Date.now() - insMem.at < CACHE_MS) return Promise.resolve(insMem.data);
    if (insFlight) return insFlight;
    insFlight = (async () => {
        const now = Date.now();
        const ids = readdirSync(ROOT).filter((n) => /^P-\d{4}-\d{2}-\d{2}-\d{4}$/.test(n)).sort();
        const pending = refreshGit(new Date((ids.length ? idTime(ids[0]) : now) - 2 * 864e5).toISOString());
        const rows = [];
        for (const id of ids) {
            const dir = join(ROOT, id);
            try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
            // header() here, not after the await: its reads and trunk lookups overlap the git child processes.
            try { rows.push({ id, dir, t: laneTimeline(id, now) }); header(dir); } catch { /* an unreadable lane folder: skipped */ }
        }
        if (tlDirty) {
            try { writeFileSync(TL_CACHE_FILE + '.tmp', JSON.stringify(tlCache)); renameSync(TL_CACHE_FILE + '.tmp', TL_CACHE_FILE); } catch { /* best effort */ }
            tlDirty = false;
        }
        const g = await pending;
        const corr = new Map();
        const own = new Map();
        for (const e of g.entries) {
            if (e.type !== 'ticket' && e.pid && !own.has(e.pid)) own.set(e.pid, e);
            if (e.cPid) { if (!corr.has(e.cPid)) corr.set(e.cPid, []); corr.get(e.cPid).push(e); }
        }
        const lanes = rows.map(({ id, dir, t }) => insightLane(id, dir, t, g, corr.get(id) || [], own.get(id), now));
        const data = {
            v: 1, now, trunk: g.trunk.slice(0, 9),
            sources: { lanes: lanes.length, sessions: lanes.filter((l) => l.model).length, commitsScanned: g.seen.size, logEntries: g.entries.length, since: ids.length ? ids[0].slice(2, 12) : '' },
            areas: AREAS.map(({ key, label, rule }) => ({ key, label, rule })), bands: BANDS.map((b) => b[1]), harness: g.rc, lanes,
        };
        insMem = { at: Date.now(), data };
        return data;
    })().finally(() => { insFlight = null; });
    return insFlight;
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
    lanes.forEach((l) => (l.depends || []).forEach((d) => link(d, l.id, 'depends', 'declared in the Depends: line')));
    lanes.forEach((l) => l.cites.forEach((c) => { if (!(l.depends || []).includes(c.id)) link(c.id, l.id, 'cites', c.text); }));
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

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jjodel Harness Lane Management</title>
<style>
:root{--bg:#f8fafc;--fg:#0f172a;--muted:#64748b;--line:#e2e8f0;--card:#fff;--accent:#0ea5e9;--run:#0284c7;--ok:#15803d;--warn:#b45309;--hs:#74b98a;--bad:#b91c1c}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--fg:#e2e8f0;--muted:#94a3b8;--line:#1e293b;--card:#111a2e;--run:#38bdf8;--ok:#4ade80;--warn:#fbbf24;--hs:#2f7d4f;--bad:#f87171}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif}
main{max-width:1280px;margin:0 auto;padding:16px}
header{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:baseline;margin-bottom:16px}
h1{font-size:16px;margin:0}h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:24px 0 8px}
.meta{color:var(--muted);font-size:12px}.meta b{color:var(--fg);font-weight:600}
.wrap{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;width:100%;min-width:900px}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11px;font-weight:600;color:var(--muted);white-space:nowrap}tr:last-child td{border-bottom:0}
td.id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap}td.when{white-space:nowrap;font-variant-numeric:tabular-nums}
.title{display:block;color:var(--muted);font-size:11px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:320px;white-space:normal}
.pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid currentColor}
.running{color:var(--run)}.blocked,.stopped{color:var(--warn)}.done{color:var(--ok)}.question{color:var(--warn)}.hard-stop{color:var(--hs)}.blocked-o,.unparsed,.failed{color:var(--bad)}
.phase{max-width:340px}.empty{padding:16px;color:var(--muted)}.err{color:var(--bad);margin:8px 0}
.load-hi{color:var(--bad);font-weight:600}
.tabs{display:flex;gap:4px;margin:0 0 8px;border-bottom:1px solid var(--line)}.tabs button,.seg button{font:inherit;font-size:12px;background:none;border:0;color:var(--muted);padding:8px 12px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}.tabs button.on{color:var(--fg);border-bottom-color:var(--accent);font-weight:600}
details{margin-bottom:8px}summary{cursor:pointer;display:flex;gap:16px;align-items:baseline;padding:8px 12px;background:var(--card);border:1px solid var(--line);border-radius:8px;list-style:none}summary::-webkit-details-marker{display:none}summary::before{content:'\\25B8';color:var(--muted)}details[open] summary::before{content:'\\25BE'}details[open] summary{border-radius:8px 8px 0 0;border-bottom:0}details[open] .wrap{border-radius:0 0 8px 8px}
</style></head><body><main>
<header><h1>Jjodel Harness Lane Management</h1><span class="meta" id="meta">loading…</span></header>
<nav class="tabs"><button data-tab="table">Lanes</button><button data-tab="timeline">Timeline</button><button data-tab="insights">Insights</button></nav>
<div class="err" id="err"></div>
<section id="tab-table">
<h2>Running</h2><div class="wrap" id="live"></div>
<h2>Last ${RECENT_H} hours</h2><div class="wrap" id="recent"></div>
<h2>Earlier lanes</h2><div id="older"></div>
</section>
<section id="tab-timeline" hidden><div id="tl"></div></section>
<section id="tab-insights" hidden><div id="ins"></div></section>
</main><script src="/timeline.js"></script><script src="/insights.js"></script><script>
const REFRESH=${REFRESH_S}*1000;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pill=(t,cls)=>t?'<span class="pill '+esc(cls||t)+'">'+esc(t)+'</span>':'';
const launch=r=>{const l=r.launcher||{};const c={chat:'var(--run)',harness:'var(--muted)',chain:'var(--muted)','claude-code':'var(--warn)',manual:'var(--ok)'}[l.by]||'var(--muted)';return (l.label?'<span class="pill" style="color:'+c+'" title="'+esc(l.detail||'')+'">'+esc(l.label)+'</span>':'')+(r.chat?'<span class="title">'+esc(r.chat)+'</span>':'')};
const dur=m=>m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min';
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
// HH:MM on the table's reference day (YYYY-MM-DD), MM-DD HH:MM on any other; empty when unknown.
const when=(ms,day)=>{if(!ms)return '<td class="when"></td>';const d=new Date(ms);const hm=pad(d.getHours())+':'+pad(d.getMinutes());return '<td class="when">'+(ymd(d)===day?hm:pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+hm)+'</td>'};
// Elapsed is the working time, the sum of the turns; empty when no turn is known.
const work=r=>'<td>'+(r.start?dur(Math.floor(r.work/60000)):'')+'</td>';
// Span is the start to the end, waits for decisions included: to now while the lane runs; empty when an end is unknown.
const span=r=>{const e=r.live?Date.now():r.end;return '<td>'+(r.start&&e?dur(Math.floor((e-r.start)/60000)):'')+'</td>'};
const tips={Elapsed:"Working time: the sum of the lane's turns",Span:'From start to end, waits for decisions included'};
// day: the reference day of Started and Ended, today unless given (an Earlier lanes group passes its own).
function table(rows,live,day){
  day=day||ymd(new Date());
  if(!rows.length)return '<div class="empty">'+(live?'No lane is running.':'No lanes in this period.')+'</div>';
  const cols=live?['Lane','State','Kind','Started','Elapsed','Span','Left','Phase','Worktree','Launched by']:['Lane','State','Outcome','Kind','Started','Ended','Elapsed','Span','Worktree','Launched by'];
  let h='<table><thead><tr>'+cols.map(c=>'<th'+(tips[c]?' title="'+esc(tips[c])+'"':'')+'>'+c+'</th>').join('')+'</tr></thead><tbody>';
  for(const r of rows){
    const id='<td class="id">'+esc(r.id)+(r.title?'<span class="title">'+esc(r.title)+'</span>':'')+'</td>';
    const kind='<td>'+esc(r.kind||r.lane.split(/[ .(]/)[0]||'')+(r.tier?' · '+esc(r.tier):'')+'</td>';
    const oc=r.outcome==='none'?'':r.outcome;
    if(live)h+='<tr>'+id+'<td>'+pill(r.state)+'</td>'+kind+when(r.start,day)+work(r)+span(r)+'<td>'+esc(r.left)+'</td><td class="phase">'+esc(r.phase)+'</td><td>'+esc(r.worktree)+'</td><td>'+launch(r)+'</td></tr>';
    else h+='<tr>'+id+'<td>'+pill(r.state)+'</td><td>'+pill(oc,oc==='blocked'?'blocked-o':oc)+'</td>'+kind+when(r.start,day)+when(r.end,day)+work(r)+span(r)+'<td>'+esc(r.worktree)+'</td><td>'+launch(r)+'</td></tr>';
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
    document.getElementById('live').innerHTML=table(d.rows.filter(r=>r.live),true);
    document.getElementById('recent').innerHTML=table(d.rows.filter(r=>!r.live&&r.recent),false);
    renderOlder(d.rows.filter(r=>!r.live&&!r.recent));
    const n=d.rows.filter(r=>r.live).length;document.title=(n?'('+n+') ':'')+'Jjodel Harness Lane Management';
  }catch(e){document.getElementById('err').textContent='lane-board unreachable: '+e.message}
}
function renderOlder(rows){
  const days=[...new Set(rows.map(r=>r.day))].sort().reverse();
  const box=document.getElementById('older');
  if(!days.length){box.innerHTML='<div class="wrap"><div class="empty">No earlier lanes.</div></div>';return;}
  box.innerHTML=days.map(day=>{
    const rs=rows.filter(r=>r.day===day).sort((a,b)=>b.t-a.t||(a.id<b.id?1:a.id>b.id?-1:0));
    const tally={};rs.forEach(r=>{const o=(r.chain||r.outcome==='none')?r.state:r.outcome.split(' ')[0];tally[o]=(tally[o]||0)+1});
    const sum=Object.entries(tally).map(([k,v])=>v+' '+k).join(' · ');
    return '<details data-day="'+day+'"'+(openDays.has(day)?' open':'')+'><summary><b>'+day+'</b><span class="meta">'+rs.length+' lane'+(rs.length>1?'s':'')+' · '+esc(sum)+'</span></summary><div class="wrap">'+table(rs,false,day)+'</div></details>';
  }).join('');
  box.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{el.open?openDays.add(el.dataset.day):openDays.delete(el.dataset.day);saveOpen()}));
}
let openDays=new Set();
try{openDays=new Set(JSON.parse(localStorage.getItem('laneBoardOpenDays')||'[]'))}catch(e){}
function saveOpen(){try{localStorage.setItem('laneBoardOpenDays',JSON.stringify([...openDays]))}catch(e){}}
function showTab(t){if(!document.getElementById('tab-'+t))t='table';document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));['table','timeline','insights'].forEach(k=>{document.getElementById('tab-'+k).hidden=t!==k});try{localStorage.setItem('laneBoardTab',t)}catch(e){}if(t==='timeline'&&window.TL)TL.refresh();if(t==='insights'&&window.INS)INS.refresh()}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
let tab0='table';try{tab0=localStorage.getItem('laneBoardTab')||'table'}catch(e){}
showTab(tab0);
tick();setInterval(()=>{tick();if(!document.getElementById('tab-timeline').hidden&&window.TL)TL.refresh();if(!document.getElementById('tab-insights').hidden&&window.INS)INS.refresh()},REFRESH);
</script></body></html>`;

createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const days = Number(url.searchParams.get('days') || 0);
    if (url.pathname === '/insights.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(readTrim(join(HERE, 'insights.js')));
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
        return res.end(readTrim(join(HERE, 'timeline.js')));
    }
    if (req.url === '/api/timeline') {
        let body;
        try { body = JSON.stringify(timeline()); } catch (e) { body = JSON.stringify({ now: Date.now(), lanes: [], chainDeps: [], error: String(e) }); }
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        return res.end(body);
    }
    if (req.url === '/api/insights') {
        insights().then((d) => JSON.stringify(d), (e) => JSON.stringify({ v: 1, now: Date.now(), lanes: [], error: String(e) })).then((body) => {
            res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            res.end(body);
        });
        return;
    }
    if (req.url === '/api') {
        let body;
        try { body = JSON.stringify(collect()); } catch (e) { body = JSON.stringify({ now: Date.now(), load: [], error: String(e), rows: [] }); }
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        return res.end(body);
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
}).listen(PORT, '127.0.0.1', () => console.log('lane-board on http://localhost:' + PORT + ' (refresh ' + REFRESH_S + ' s)'));

#!/usr/bin/env node
// lane-board: a live, read-only table of the Jjodel lanes on http://localhost:4700.
// It never launches, resumes, merges or kills a lane and never writes in a worktree.
// State, outcome and elapsed come from `lane-run status --all`; worktree, kind, chat,
// tier and phase come from the files in ~/.jjodel-lanes/<Prompt-ID>/. The Timeline tab
// (/api/timeline, drawn by timeline.js next to this file) shows turns, decisions,
// parallelism and dependencies; finished lanes are cached in timeline-cache.json. The Insights
// tab adds /api/insights: model, cost, code areas and first-shot success per lane, from the lane
// logs, `git log --all` and the trunk's log entries and decisions.md (insights.js, README). The Requirements
// tab adds /api/requirements: req-trace.mjs on the working tree of this checkout and its trunk (requirements.js).
// A running lane's progress is the ladder of milestones its log.jsonl has reached (below), drawn in
// its Phase cell; an exited blocked lane holding resolved.txt reads `resolved` in the Lanes tab, and
// Timeline and Insights paint it in the ok colour from a flag beside its raw outcome. A strip of six
// pills ends the tab bar, counted from the /api rows (stripKey, below); a click filters the Lanes tab.
// /api/attention and /l/<Prompt-ID> serve the menu bar app (attentionOf, below; tools/lane-monitor-app/), and
// /#lane=<Prompt-ID> marks a lane's row in the Lanes tab.
// It listens when run as a script, not when imported (the tests import its functions).
// Usage: node ~/.jjodel-lanes/board/lane-board.mjs [--port 4700] [--refresh 30]

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync, statSync, openSync, readSync, fstatSync, closeSync, realpathSync } from 'node:fs';
import { homedir, loadavg } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
// The tokens of a lane come from lane-usage.mjs, beside lane-run.mjs as above; without it the token cells read n/a.
const LANE_USAGE = process.env.LANE_USAGE || (existsSync(join(HERE, '..', 'lane-usage.mjs')) ? join(HERE, '..', 'lane-usage.mjs') : join(homedir(), 'jjodel-release/frontend/scripts/lane-usage.mjs'));
const LU = await import(pathToFileURL(LANE_USAGE).href).catch(() => null);
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
    // The Request: line (RC-43) of the header block, before the first `## ` section: its first word, a URL or `none`.
    const request = (text.split(/\n## /)[0].match(/^Request:[ \t]*(\S*)/m) || [])[1] || '';
    // The lanes this one declares (P13 `Depends:`) and corrects (`Corregge:`, a Prompt-ID or the prompt's `YYYY-MM-DD HH:mm`), for /api/attention.
    const ids = (s) => [...new Set([...(s.match(/P-\d{4}-\d{2}-\d{2}-\d{4}/g) || []), ...[...s.matchAll(/\b(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})\b/g)].map((m) => 'P-' + m[1] + '-' + m[2] + m[3])])];
    const h = { lane: line('Lane'), chat: line('Chat'), title, file, request, depends: ids(line('Depends')), corregge: ids(line('Corregge')) };
    if (text || existsSync(join(dir, 'exit.txt'))) headMem.set(dir, h);
    return h;
}

/** Kind from the Lane line's first word (P13: fast, full (<trigger>), discovery); lane-run's merge prompts declare `Lane: full (merge; …)`, or count them, `full (two merges …)`. */
function kindOf(laneLine, file = '') {
    const l = laneLine.toLowerCase();
    if (/^merge|^full \((merge|take[- ]trunk|(one|two|three|four|five|six|seven|eight|nine|ten|\d+) merges?)\b/.test(l) || /_prompt_merge_|_take_trunk/.test(file)) return 'merge';
    if (/^fast/.test(l)) return 'fast';
    // A full lane that is only a read-only Phase 1 (its fix is a later lane) is a discovery; a two-phase lane is not.
    if (/^discovery|^phase 1 only|^full \(discovery\b/.test(l) || (/^full \(phase 1\b/.test(l) && /read-only/.test(l) && !/two-phase|same session|in cascade|after the chat'?s go/.test(l))) return 'discovery';
    if (/^full|^phase|implementation/.test(l)) return 'phase2';
    return '';
}

const readJson = (p) => {
    try { const v = JSON.parse(readFileSync(p, 'utf8')); return v && typeof v === 'object' ? v : null; } catch { return null; }
};

/** What a lane folder says about how the lane ran, for kindDetails: direct.json (null when absent) and result.json (null when
 *  absent or unreadable) parsed, resolved.txt, the last line of runs.jsonl parsed and the count of its lines, session.txt, tier.txt, and
 *  whether architect.json and log.jsonl are there. Reads only; a missing folder gives the empty facts. */
export function kindFacts(dir) {
    const runLines = readTrim(join(dir, 'runs.jsonl')).split('\n').filter((l) => l.trim());
    let lastRun = null;
    try { lastRun = runLines.length ? JSON.parse(runLines[runLines.length - 1]) : null; } catch { lastRun = null; }
    const result = readJson(join(dir, 'result.json'));
    // direct.json carries the union files whole: parsed only for branch and trunk while result.json is not there yet.
    const direct = existsSync(join(dir, 'direct.json')) ? (result ? {} : readJson(join(dir, 'direct.json')) || {}) : null;
    return {
        direct, result, resolved: readTrim(join(dir, 'resolved.txt')),
        runs: runLines.length, lastRun: lastRun && typeof lastRun === 'object' ? lastRun : null,
        session: readTrim(join(dir, 'session.txt')), tierLine: readTrim(join(dir, 'tier.txt')),
        architect: existsSync(join(dir, 'architect.json')), log: existsSync(join(dir, 'log.jsonl')),
    };
}

const NO_FACTS = { direct: null, result: null, resolved: '', runs: 0, lastRun: null, session: '', tierLine: '', architect: false, log: false };

const KIND_MEANING = {
    merge: 'merge: brings a lane branch into the trunk',
    fast: 'fast: one module, one phase, closed by one docs commit (RC-17)',
    discovery: 'discovery: a read-only Phase 1 that ends with a report',
    phase2: 'phase2: a full lane that changes code (Phase 2, or two phases in one session)',
    chain: 'chain: lanes run one after the other; each lane has its own kind',
    unknown: 'unknown: the Lane line matches no kind',
};

/** The overlay of the Kind badge (P-2026-10-18-1428), plain text lines: what the kind means and the Lane line it came from,
 *  how the lane ran, and what the token columns mean for this row. Pure: `row` is an /api row (kind, lane, chain, tier,
 *  tokensIn, archTotal, archOpen) with `model`, the first model of its log.jsonl when known, `f` the kindFacts of its folder, `usage` false when lane-usage.mjs is missing. */
export function kindDetails(row, f, usage = true) {
    const kind = row.chain ? 'chain' : row.kind || 'unknown';
    const out = [KIND_MEANING[kind], row.lane ? 'Lane: ' + row.lane : row.chain ? 'Lane: none, a chain has no prompt' : 'Lane: no Lane line in the prompt'];
    if (row.chain) return out;
    if (f.direct) {
        const r = f.result || {};
        const branch = r.branch || f.direct.branch, trunk = r.trunk || f.direct.trunk;
        out.push('How it ran: scripted: git merge and gates, no model session');
        if (branch || trunk) out.push((branch || '?') + ' into ' + (trunk || '?'));
        const gates = Array.isArray(r.gates) ? r.gates : [];
        if (gates.length) out.push('Gates: ' + gates.map((g) => g.name + (g.ok ? ' ok' : ' red' + (g.detail ? ' (' + g.detail + ')' : ''))).join(' · '));
        else out.push('Gates: no result.json yet');
        // result.json's outcome is the stop before the GO; a closure sha means the chat closed the merge after it.
        if (r.outcome && r.closure) out.push('Result: ' + r.outcome + ' at the merge' + (r.reason ? ', ' + r.reason : '') + ', closed by ' + String(r.closure).slice(0, 9));
        else if (r.outcome) out.push('Result: ' + r.outcome + (r.reason ? ', ' + r.reason : ''));
        if (f.resolved) out.push('Resolved: ' + f.resolved);
        out.push('In, Out, Total, Ctx max: n/a, no model ran');
        out.push(f.architect ? 'Arch: from architect.json' : 'Arch: n/a, the chat records it only for session lanes');
        return out;
    }
    out.push('How it ran: a Claude Code session started by lane-run');
    const run = f.lastRun;
    if (run) {
        const model = run.effectiveModel || run.requestedModel;
        out.push('Tier ' + (run.tier || '?') + ' · model ' + (model || '?') + ' · effort ' + (run.effort || '?') + ' (runs.jsonl, ' + f.runs + ' launch' + (f.runs === 1 ? '' : 'es') + ')');
    } else if (row.model) out.push('Tier: ' + (f.tierLine || row.tier || 'not recorded') + ' · model ' + row.model + ' (log.jsonl); no runs.jsonl, so effort is not recorded');
    else out.push('Tier: ' + (f.tierLine || row.tier || 'not recorded') + '; no runs.jsonl, so model and effort are not recorded');
    const session = f.session || (run && run.session) || '';
    out.push(session ? 'Session: ' + session : 'Session: no session.txt');
    if (row.tokensIn !== null && row.tokensIn !== undefined) out.push('In, Out, Total, Ctx max: the main session, from log.jsonl');
    else if (!f.log) out.push('In, Out, Total, Ctx max: n/a, no log.jsonl in the lane folder');
    else if (!usage) out.push('In, Out, Total, Ctx max: n/a, lane-usage.mjs not found beside the board');
    else out.push('In, Out, Total, Ctx max: n/a, log.jsonl holds no call with message.usage yet');
    if (row.archOpen) out.push('Arch: open, architect.json not closed by the chat yet');
    else if (row.archTotal !== null && row.archTotal !== undefined) out.push('Arch: from architect.json');
    else out.push(f.architect ? 'Arch: n/a, architect.json is unreadable' : 'Arch: n/a, no architect.json in the lane folder');
    return out;
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

// The /api snapshot (P-2026-10-11-1205). `lane-run status --all` runs as a child process, one run at a time,
// killed at STATUS_KILL_MS, so a slow status never blocks the other routes. A run that fails or times out after
// a success leaves that success's rows in the snapshot, marked stale since it: a timed-out status is never an
// empty board. Only before any success is the snapshot empty, with the error.
let cache = { at: 0, data: null };
let lastGood = null;
let statusFlight = null;
const STATUS_KILL_MS = 15_000;

let cposMem = { at: 0, v: new Map() };
function chainPosMem() { if (Date.now() - cposMem.at > CACHE_MS) cposMem = { at: Date.now(), v: chainPositions() }; return cposMem.v; }
/** The snapshot of one status run `r` ({ ok, stdout, error }), left in the cache. */
function snapshot(r) {
    const now = Date.now();
    const load = loadavg();
    if (!r.ok && lastGood) {
        cache = { at: Date.now(), data: { ...lastGood, now: Date.now(), load: load.map((x) => x.toFixed(2)), error: r.error, stale: true, staleSince: lastGood.now } };
        return cache.data;
    }
    const error = r.ok ? '' : r.error;
    const rows = [];
    const spend = {};
    const logs = new Set();
    for (const line of (r.ok ? r.stdout : '').split('\n').slice(1)) {
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
        const row = { id, state, outcome, minutes, chain: isChain, t, worktree: '', kind: '', lane: '', chat: '', title: '', tier: '', phase: '', left: '', chatUrl: '', chatUrlFrom: '', chatUrlVia: '' };
        let request = '';
        if (!isChain && existsSync(dir)) {
            row.worktree = readTrim(join(dir, 'worktree.txt')).replace(homedir(), '~');
            const h = header(dir);
            row.lane = h.lane; row.chat = h.chat; row.title = h.title; request = h.request;
            row.kind = kindOf(h.lane, h.file);
            row.tier = readTrim(join(dir, 'tier.txt')).split(/[\s:]/)[0];
            // resolved (P-2026-10-05-1720): exited blocked and resolved afterwards, whichever lane-run printed the table.
            // timeline() keeps the raw outcome for the exports and flags the lane `resolved` beside it; /api/insights reads its own from the log.
            if (outcome === 'blocked' && existsSync(join(dir, 'resolved.txt'))) row.outcome = 'resolved';
            if (live) {
                row.phase = phaseOf(dir);
                // A direct merge's log.jsonl is its worker's, with no tool call a ladder reads: no progress.
                if (existsSync(join(dir, 'direct.json'))) row.progress = null;
                else {
                    const log = join(dir, 'log.jsonl');
                    logs.add(log);
                    row.progress = progressOf(row.kind, laneEvents(log));
                }
                row.left = estimate(row.kind, minutes, row.phase, load[0], row.progress);
            }
        }
        if (!isChain) row.launcher = launcherOf(id, chainPosMem().get(id), row.chat);
        if (!isChain) Object.assign(row, ownChatUrl(id, request));
        row.live = live;
        row.recent = recent;
        row.day = t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : 'unknown';
        if (!isChain) Object.assign(row, laneSpan(id, now));
        // The Lanes tab's token columns (P-2026-10-18-1045): integers, null when the lane has no per-call usage.
        const tk = isChain ? null : laneTokens(id);
        Object.assign(row, { tokensIn: tk ? tk.tokensIn : null, tokensOut: tk ? tk.tokensOut : null, tokensTotal: tk ? tk.tokensTotal : null, ctxMax: tk ? tk.ctxMax : null, tokensSub: tk ? tk.tokensSub : null });
        Object.assign(row, isChain ? archFields(null) : archFields(laneArchitect(id)));
        // The Cost column and the day totals (P-2026-10-18-1750): costUSD null without a result that carries a cost.
        const co = isChain ? null : laneCost(id);
        Object.assign(row, { costUSD: co ? co.max : null, sessions: co && co.max !== null ? co.sessions : null });
        if (co && co.events.length) {
            try { for (const [d, usd] of Object.entries(spendByDay(co.events, laneTimeline(id, now).turns))) spend[d] = (spend[d] || 0) + usd; } catch { /* no turns */ }
        }
        // The Kind badge (P-2026-10-18-1428): direct from direct.json, and the overlay's lines.
        const kf = isChain ? NO_FACTS : kindFacts(dir);
        row.direct = Boolean(kf.direct);
        row.kindInfo = kindDetails({ ...row, model: tk ? tk.model : null }, kf, Boolean(LU));
        rows.push(row);
    }
    for (const log of evCache.keys()) if (!logs.has(log)) evCache.delete(log);
    // A chain spans its lanes: the earliest start, the latest end once every lane that started has ended, the sum of their work.
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const row of rows) {
        if (!row.chain) continue;
        const spans = [...chainPosMem()].filter(([, p]) => p.chain === row.id).map(([lid]) => byId.get(lid) || laneSpan(lid, now)).filter((s) => s.start);
        row.start = spans.length ? Math.min(...spans.map((s) => s.start)) : 0;
        row.end = !row.live && spans.length && spans.every((s) => s.end) ? Math.max(...spans.map((s) => s.end)) : 0;
        row.work = spans.reduce((a, s) => a + s.work, 0);
    }
    // A lane without a URL of its own borrows the one of the latest other lane (by Prompt-ID) that names the same Chat: id.
    const chatKey = (r) => (r.chat.match(/C-\d{4}-\d{2}-\d{2}-\d{4}/) || [])[0] || '';
    const donor = new Map();
    for (const row of rows) {
        const k = chatKey(row), cur = donor.get(k);
        if (k && row.chatUrl && (!cur || row.id > cur.id)) donor.set(k, row);
    }
    for (const row of rows) {
        const d = donor.get(chatKey(row));
        if (!row.chatUrl && d) Object.assign(row, { chatUrl: d.chatUrl, chatUrlFrom: 'chat-id', chatUrlVia: d.id });
    }
    if (tlDirty) {
        try { writeFileSync(TL_CACHE_FILE + '.tmp', JSON.stringify(tlCache)); renameSync(TL_CACHE_FILE + '.tmp', TL_CACHE_FILE); } catch { /* best effort */ }
        tlDirty = false;
    }
    saveTokens();
    const data = { now: Date.now(), load: load.map((x) => x.toFixed(2)), error, stale: false, rows, spendByDay: spend };
    if (r.ok) lastGood = data;
    cache = { at: Date.now(), data };
    return data;
}

/** One run of `lane-run status --all` as a child process: `{ ok, stdout, error }`, `error` one line; killed at `killMs`. */
export function runStatus(spawnFn = spawn, killMs = STATUS_KILL_MS) {
    return new Promise((done) => {
        const out = [], err = [];
        const fail = (error) => done({ ok: false, stdout: '', error: String(error).replace(/\s+/g, ' ').trim() });
        let child, killed = false;
        try { child = spawnFn(process.execPath, [LANE_RUN, 'status', '--all'], { stdio: ['ignore', 'pipe', 'pipe'] }); }
        catch (e) { return fail('lane-run status: ' + e.message); }
        const timer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, killMs);
        child.stdout.on('data', (b) => out.push(b));
        child.stderr.on('data', (b) => err.push(b));
        child.on('error', (e) => { clearTimeout(timer); fail('lane-run status: ' + e.message); });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0 && !killed) done({ ok: true, stdout: Buffer.concat(out).toString('utf8'), error: '' });
            else fail(killed ? 'lane-run status timed out after ' + killMs / 1000 + ' s' : Buffer.concat(err).toString('utf8').trim() || 'lane-run status failed (exit ' + code + ')');
        });
    });
}

/** Starts a status run unless one is in flight; resolves once its snapshot is in the cache. Never rejects. */
function refreshStatus() {
    if (!statusFlight) {
        statusFlight = runStatus().then((r) => {
            try { snapshot(r); } catch (e) { snapshot({ ok: false, stdout: '', error: String(e) }); }
        }).finally(() => { statusFlight = null; });
    }
    return statusFlight;
}

/** The snapshot at once, `refreshing` while a run is in flight; one older than CACHE_MS starts a run in the background.
 *  Synchronous because timeline() is: its routes are answered from the snapshot and never wait for a run. */
function collect() {
    if (!cache.data || Date.now() - cache.at >= CACHE_MS) refreshStatus();
    return { ...(cache.data || { now: Date.now(), load: loadavg().map((x) => x.toFixed(2)), error: '', stale: false, rows: [] }), refreshing: statusFlight !== null };
}

/** /api: a request that finds no snapshot, or one older than CACHE_MS, starts a run and waits for it; a request that
 *  arrives while a run is in flight gets the snapshot at once, `refreshing: true`, and starts no second run. */
function apiStatus() {
    if (statusFlight && cache.data) return Promise.resolve(collect());
    if (!cache.data || Date.now() - cache.at >= CACHE_MS) return refreshStatus().then(() => collect());
    return Promise.resolve(collect());
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

// ── tokens ──────────────────────────────────────────────────────────────────
// Per lane, from lane-usage.mjs: the board never reads message.usage itself. Cached by the size and mtime of
// log.jsonl in usage-cache.json beside the Timeline cache, so a refresh recomputes only the lanes whose log changed.
// `alone` is not cached: it depends on the other lanes' intervals, and is recomputed from them on every read.
const US_CACHE_FILE = join(dirname(TL_CACHE_FILE), 'usage-cache.json');
let usCache = {};
try { usCache = JSON.parse(readFileSync(US_CACHE_FILE, 'utf8')); } catch { usCache = {}; }
let usDirty = false;
let ivMem = { at: 0, v: new Map() };
const intervals = () => { if (Date.now() - ivMem.at > CACHE_MS) ivMem = { at: Date.now(), v: LU.allIntervals() }; return ivMem.v; };

/** The numbers the board shows from one laneUsage() result. In: input, cache_read and cache_creation of the main calls;
 *  Out: the output of the last modelUsage, all models (the per-call output is the count at stream start); null throughout
 *  when the lane has no main call. Sub: the four classes of the subagent calls, kept out of In. */
export function tokensOf(u) {
    const sum = (block, out) => Object.values(block).reduce((a, c) => a + c.input + c.cacheRead + c.cacheCreation + (out ? c.output : 0), 0);
    const calls = u.context.calls > 0;
    const tokensIn = calls ? sum(u.main, false) : null;
    const tokensOut = calls && u.resultOutput ? Object.values(u.resultOutput).reduce((a, v) => a + (v || 0), 0) : null;
    return {
        tokensIn, tokensOut, tokensTotal: calls ? tokensIn + (tokensOut || 0) : null, ctxMax: calls ? u.context.max : null,
        tokensSub: sum(u.subagents, true), at200k: u.context.atOrAbove200k, at250k: u.context.atOrAbove250k,
        sevenDayDelta: u.rateLimit.delta ? u.rateLimit.delta.sevenDay : null, tier: u.tier, model: u.model.first,
    };
}

/** The architect's share of a lane (P-2026-10-18-1155), from architect.json through lane-usage.mjs. Read on every call, uncached:
 *  the file is a few hundred bytes and the chat rewrites it when it closes the lane. null without lane-usage.mjs, without the file, or when unreadable. */
function laneArchitect(id) {
    if (!LU || !LU.architectOf) return null;
    const a = LU.architectOf(id);
    if (a.state === 'open') return { open: true, chat: a.chat, model: a.model, delta: null };
    if (a.state !== 'ok') return null;
    return { open: false, chat: a.chat, model: a.model, delta: a.delta };
}

/** The /api fields of the Arch column: integers, null while open or without the file. */
export function archFields(a) {
    const d = a && a.delta;
    return {
        archIn: d ? d.totalIn : null, archOut: d ? d.output : null, archTotal: d ? d.totalIn + d.output : null,
        archChat: a ? a.chat : null, archOpen: Boolean(a && a.open),
    };
}

/** The tokens of a lane folder with `alone` beside them; null without lane-usage.mjs or a log.jsonl. */
function laneTokens(id) {
    if (!LU) return null;
    let st;
    try { st = statSync(join(ROOT, id, 'log.jsonl')); } catch { return null; }
    const key = ['v1', st.size, st.mtimeMs].join('/');
    const hit = usCache[id];
    let v = hit && hit.key === key ? hit.v : null;
    if (!v) {
        try { v = tokensOf(LU.laneUsage(id, intervals())); } catch { return null; }
        usCache[id] = { key, v };
        usDirty = true;
    }
    return { ...v, alone: LU.overlap(id, intervals()).alone };
}

function saveTokens() {
    if (!usDirty) return;
    try { writeFileSync(US_CACHE_FILE + '.tmp', JSON.stringify(usCache)); renameSync(US_CACHE_FILE + '.tmp', US_CACHE_FILE); } catch { /* best effort */ }
    usDirty = false;
}

// ── cost (P-2026-10-18-1750) ────────────────────────────────────────────────
// total_cost_usd of a `result` event is cumulative over the session and restored by a resume, so the lane's cost is the
// largest and the spend of a turn is the increase over the previous event. The cost events of a log are cached beside the
// token columns (usage-cache.json, key 'cost:<id>', by the size and mtime of log.jsonl); the days are worked out from them
// and the lane's turns on every read, so a turn that moves does not outlive a stale cache.

/** The local day (YYYY-MM-DD) of an epoch ms: the rule of row.day. */
export function localDay(ms) { return new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

/** What the cost columns read from a log (its bytes, or null): `events` are the `result` events that carry total_cost_usd,
 *  each as { usd, turn }: `turn` is the index of the turn it closes, counted as results() counts them, and an event that
 *  closes no turn (a task notification) takes the index of the preceding turn. max: the lane's cost, null without an event. */
export function costEvents(buf) {
    const out = { events: [], max: null, sessions: 0 };
    if (!buf) return out;
    eachLine(buf, '"subtype":"init"', (raw) => {
        const e = parseLine(raw);
        if (e && e.type === 'system' && e.subtype === 'init') out.sessions++;
    });
    let seen = 0;
    eachLine(buf, '"type":"result"', (raw) => {
        const e = parseLine(raw);
        if (!e || e.type !== 'result') return;
        const notTurn = (e.origin && e.origin.kind === 'task-notification') || (e.num_turns === 0 && !e.result); // as in results()
        const turn = notTurn ? Math.max(0, seen - 1) : seen;
        if (!notTurn) seen++;
        if (typeof e.total_cost_usd !== 'number') return;
        out.events.push({ usd: e.total_cost_usd, turn });
        out.max = out.max === null ? e.total_cost_usd : Math.max(out.max, e.total_cost_usd);
    });
    return out;
}

/** { 'YYYY-MM-DD': usd } for one lane: the delta of each cost event (the increase over the previous event of the log; a
 *  decrease is a new session and the delta is the value itself) on the local day of the end of the turn it lands on.
 *  A lane with fewer turns than events (no input files) lands the rest on its last turn. */
export function spendByDay(events, turns) {
    const out = {};
    if (!turns || !turns.length) return out;
    let prev = 0;
    for (const ev of events) {
        const delta = ev.usd >= prev ? ev.usd - prev : ev.usd;
        prev = ev.usd;
        if (!delta) continue;
        const day = localDay(turns[Math.min(ev.turn, turns.length - 1)].e);
        out[day] = (out[day] || 0) + delta;
    }
    return out;
}

/** The cost events of a lane folder, cached; null without a log.jsonl. */
function laneCost(id) {
    let st;
    try { st = statSync(join(ROOT, id, 'log.jsonl')); } catch { return null; }
    const key = ['c1', st.size, st.mtimeMs].join('/');
    const hit = usCache['cost:' + id];
    let v = hit && hit.key === key ? hit.v : null;
    if (!v) {
        try { v = costEvents(readFileSync(join(ROOT, id, 'log.jsonl'))); } catch { return null; }
        usCache['cost:' + id] = { key, v };
        usDirty = true;
    }
    return v;
}

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

/** A lane's own claude.ai conversation (RC-43): the Request: header, else the Claude-Session: trailer of the commit that added its prompt. */
const CLAUDE_URL = /^https:\/\/claude\.ai\//;
function ownChatUrl(id, request) {
    if (CLAUDE_URL.test(request)) return { chatUrl: request, chatUrlFrom: 'request' };
    const session = (promptCommits().get(id) || {}).session || '';
    if (CLAUDE_URL.test(session)) return { chatUrl: session, chatUrlFrom: 'commit' };
    return { chatUrl: '', chatUrlFrom: '' };
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

/** The outcome a lane recorded: `resolved` is the Lanes tab's overlay on `blocked` (collect), not the lane's, so the
 *  Timeline data and the XES export it feeds keep `blocked`; the trace export reads the turns' own outcomes.
 *  The overlay rides beside it as `resolved: true`, which timeline.js and insights.js paint in the ok colour. */
const rawOutcome = (o) => (o === 'resolved' ? 'blocked' : o || '');

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
        lanes.push({ id, launcher: launcherOf(id, cpos.get(id), h.chat), title: h.title || '', chat: h.chat || '', worktree: h.worktree || '', kind: h.kind || '', tier: st.tier || '', state: st.state || (t.exited ? 'exited' : '?'), outcome: rawOutcome(st.outcome), resolved: st.outcome === 'resolved', live: !!st.live, turns: t.turns, cites: t.cites, depends: t.depends || [], declared: !!t.declared, request: t.request || { url: '', text: '' } });
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

// The facts of /api/attention (attentionOf, below), memoised: a trunk Status for 60 s, a closed verdict for the process
// lifetime, the trunk's commits for 60 s over the window asked, a final message's first line by the size of its log.
const attnClosed = new Set();
const statusMem = new Map();
const textMem = new Map();
let commitsMem = { at: 0, since: 0, list: [] };
const ATTN_MS = 60_000;

function trunkStatus(id) {
    const hit = statusMem.get(id);
    if (hit && Date.now() - hit.at < ATTN_MS) return hit.s;
    const dir = join(ROOT, id);
    const s = (trunkPrompt(id, existsSync(dir) ? header(dir).file : '').match(/^Status:[ \t]*(.*)$/m) || [])[1] || '';
    statusMem.set(id, { at: Date.now(), s });
    return s;
}

/** firstLineOf the lane's final message: the last `result` event of its log that is a turn. */
function finalText(id) {
    const log = join(ROOT, id, 'log.jsonl');
    const sz = size(log);
    const hit = textMem.get(id);
    if (hit && hit.size === sz) return hit.v;
    const buf = tail(log);
    const key = '"type":"result"';
    let v = { firstLine: '', recommended: '' };
    for (let at = buf.lastIndexOf(key); at !== -1;) {
        const s0 = buf.lastIndexOf('\n', at) + 1;
        let s1 = buf.indexOf('\n', at);
        if (s1 === -1) s1 = buf.length;
        try {
            const e = JSON.parse(buf.slice(s0, s1));
            if (e.type === 'result' && e.result && !(e.origin && e.origin.kind === 'task-notification')) { v = firstLineOf(e.result); break; }
        } catch { /* a half-written line, or the cut at the start of the tail */ }
        at = s0 ? buf.lastIndexOf(key, s0 - 1) : -1;
    }
    textMem.set(id, { size: sz, v });
    return v;
}

/** The trunk's commits since `since` (epoch ms): [{ at, subject, body }]. */
async function trunkCommits(since) {
    if (Date.now() - commitsMem.at < ATTN_MS && commitsMem.since <= since) return commitsMem.list;
    const out = await gitAsync(['log', TRUNK, '--since=' + new Date(since).toISOString(), '--format=%x1e%ct%x1f%s%x1f%b']);
    const list = out === null ? [] : out.split('\x1e').map((rec) => rec.split('\x1f')).filter((f) => f.length >= 3).map(([ct, subject, ...body]) => ({ at: Number(ct) * 1000, subject, body: body.join('\x1f') }));
    commitsMem = { at: Date.now(), since, list };
    return list;
}

/** /api/attention: the /api snapshot through attentionOf. */
async function attention() {
    const d = await apiStatus();
    const rows = d.rows || [];
    // Closure (b): the lanes that name an earlier one in their Depends: or Corregge: line.
    const named = new Map();
    for (const r of rows) {
        if (r.chain || !existsSync(join(ROOT, r.id))) continue;
        const h = header(join(ROOT, r.id));
        for (const x of new Set([...(h.depends || []), ...(h.corregge || [])])) if (x < r.id) named.set(x, [...(named.get(x) || []), r.id]);
    }
    const facts = { closed: attnClosed, status: trunkStatus, namedBy: (id) => named.get(id) || [], commits: [], text: finalText };
    // Closure (c) reads the trunk's log from the oldest candidate that (a) and (b) leave open.
    let since = Infinity;
    for (const r of rows) {
        const k = stripKey(r);
        if (r.chain || attnClosed.has(r.id) || (k !== 'question' && k !== 'blocked' && k !== 'hard-stop')) continue;
        const s = attentionSince(r);
        if (!closureOf(r, s, facts)) since = Math.min(since, s);
    }
    if (since !== Infinity) facts.commits = await trunkCommits(since);
    const board = d.error ? 'error: ' + String(d.error).replace(/\s+/g, ' ').trim() : d.refreshing ? 'refreshing' : 'ok';
    return { v: 1, now: d.now, stale: !!d.stale, board, ...attentionOf(rows, facts, d.now) };
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

/** RC-45: the draws of lane-run's ledger, ROOT/rc45-draws.jsonl, Prompt-ID to the tier of its first entry; a line that is not a draw is skipped. */
function rc45Draws() {
    const m = new Map();
    for (const line of readTrim(join(ROOT, 'rc45-draws.jsonl')).split('\n')) {
        let d = null;
        try { d = JSON.parse(line); } catch { /* not a draw */ }
        if (d && typeof d.promptId === 'string' && (d.tier === 'heavy' || d.tier === 'light') && !m.has(d.promptId)) m.set(d.promptId, d.tier);
    }
    return m;
}

/** One lane of /api/insights. firstShot (discovery §4.3): ends done or hard-stop, no rework signal, no blocked or over-90-minute run; null while it runs. */
function insightLane(id, dir, t, g, corr, own, now, draws = new Map()) {
    const f = t.facts || {};
    const h = header(dir);
    const tierLine = readTrim(join(dir, 'tier.txt'));
    const tier = (/^(heavy|light)\b/.exec(tierLine) || [])[1] || '';
    // RC-45: a lane whose tier was drawn at random is in lane-run's ledger, or its tier.txt reads
    // `<tier> (<model>): drawn (RC-45), <n>/40` (never `not drawn`), or its Lane line says `tier drawn (RC-45): heavy|light`.
    const tm = /^(heavy|light) \([^)]*\): drawn \(RC-45\)/.exec(tierLine);
    const dm = /tier drawn \(RC-45\)\s*:?\s*(heavy|light)?/i.exec(h.lane);
    const drawn = draws.get(id) || (tm ? tm[1] : null) || (dm ? (dm[1] || tier || '').toLowerCase() || null : null);
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
        drawn, cliVersion: f.cli || '',
        runs, final, workMs: Math.round(runs.reduce((a, x) => a + Math.max(0, x.ms), 0)), costUSD: Math.round((f.costUSD || 0) * 100) / 100, outTokens: f.outTokens || 0,
        commits: commits.map((c) => c.sha.slice(0, 9)), files: [...files], lines, primaryArea: byLines[0] || '', criticalZone: cz,
        sizeBand: total ? BANDS.find(([max]) => total <= max)[1] : null,
        signals, rework, failedRun,
        firstShot: live ? null : ['done', 'hard-stop'].includes(final) && !rework && !failedRun,
        causa: [...new Set([...corr, own].filter(Boolean))].map((e) => e.causa).filter(Boolean),
        selfAssessment: own ? { outcome: own.outcome, regressions: own.regressions, causa: own.causa, corregge: own.cPid, smoke: own.smoke } : null,
        ageDays: live ? 0 : Math.round(((now - end) / 864e5) * 10) / 10,
        // The raw numbers of the Tokens block (tokenGroups): laneTokens(), null without a log.
        tokens: laneTokens(id),
        arch: (() => { const a = laneArchitect(id); return a ? { ...archFields(a), model: a.model } : null; })(),
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
        const draws = rc45Draws();
        const lanes = rows.map(({ id, dir, t }) => insightLane(id, dir, t, g, corr.get(id) || [], own.get(id), now, draws));
        saveTokens();
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

// ── requirements ────────────────────────────────────────────────────────────
// The Requirements tab (/api/requirements, drawn by requirements.js; ported by P-2026-10-11-0008 from branch
// harness-req-tab 35240a582): req-trace.mjs on the working tree of the board's own checkout and its trunk, run
// asynchronously so the other tabs keep answering. One run at a time, its JSON kept REQ_MS from the end of the
// run, a failed run not kept, a run killed at REQ_KILL_MS. Its own cache (the git side, keyed on the trunk sha)
// lives in the system temp folder, outside the tree.
const REQ_TRACE = join(HERE, '..', 'req-trace.mjs');
const REQ_REPO = process.env.REQ_TRACE_REPO || join(HERE, '..', '..', '..');
const REQ_TRUNK = process.env.REQ_TRACE_TRUNK || 'alfonso-frontend-jjtl';
const REQ_MS = 60_000;
const REQ_KILL_MS = 120_000;

/** One run of req-trace: `{ ok, body }`, body its stdout when it exits 0, else a JSON error document. */
export function runReqTrace(spawnFn = spawn, killMs = REQ_KILL_MS) {
    return new Promise((done) => {
        const out = [], err = [];
        const fail = (error) => done({ ok: false, body: JSON.stringify({ error, rows: [] }) });
        let child, killed = false;
        try { child = spawnFn(process.execPath, [REQ_TRACE, '--repo', REQ_REPO, '--trunk', REQ_TRUNK], { stdio: ['ignore', 'pipe', 'pipe'] }); }
        catch (e) { return fail('req-trace: ' + e.message); }
        const timer = setTimeout(() => { killed = true; child.kill('SIGKILL'); }, killMs);
        child.stdout.on('data', (b) => out.push(b));
        child.stderr.on('data', (b) => err.push(b));
        child.on('error', (e) => { clearTimeout(timer); fail('req-trace: ' + e.message); });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) done({ ok: true, body: Buffer.concat(out).toString('utf8') });
            else fail(killed ? 'req-trace killed after ' + killMs / 1000 + ' s' : ('req-trace exit ' + code + ': ' + Buffer.concat(err).toString('utf8')).trim());
        });
    });
}

/** `run` behind a single flight and a cache of `ttl` ms from the end of the run; a failed run is served once, not kept. */
export function reqTraceCache(run = runReqTrace, now = Date.now, ttl = REQ_MS) {
    let mem = { at: 0, body: null };
    let pending = null;
    return () => {
        if (mem.body !== null && now() - mem.at < ttl) return Promise.resolve(mem.body);
        if (pending) return pending;
        pending = run().then(({ ok, body }) => {
            mem = ok ? { at: now(), body } : { at: 0, body: null };
            pending = null;
            return body;
        });
        return pending;
    };
}
const requirements = reqTraceCache();

// ── status strip ────────────────────────────────────────────────────────────
// The pills at the end of the tab bar (Alfonso, 2026-10-05 17:35; ported by P-2026-10-10-2103): key,
// label, the class of the outcome colour the Lanes table already uses. Counted in the page from the
// /api rows by stripKey, embedded in the page as written here.
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

/** A token count as the board writes it: en-US, one decimal, k, M or B; the integer as it is below 1000; n/a for null. */
export function abbr(n) {
    if (n === null || n === undefined) return 'n/a';
    if (Math.abs(n) < 1000) return String(n);
    const units = ['k', 'M', 'B'];
    let v = n / 1000, i = 0;
    while (Math.abs(Number(v.toFixed(1))) >= 1000 && i < units.length - 1) { v /= 1000; i++; }
    return v.toFixed(1) + units[i];
}

/** The rows of the Insights Tokens block: the lanes with usage (l.tokens, laneTokens) grouped by `by`, 'tier' or 'model'.
 *  The 7-day delta is summed over the lanes alone with a delta, counted beside it: a lower bound (lane-usage OVERLAP_NOTE). */
export function tokenGroups(lanes, by) {
    const med = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
    const groups = new Map();
    for (const l of lanes) {
        const t = l.tokens;
        if (!t || t.tokensTotal === null) continue;
        const k = t[by] || '';
        if (!groups.has(k)) groups.set(k, []);
        // The architect's total rides beside the executor's: only a closed lane carries one (archOpen or n/a leave it null).
        groups.get(k).push({ ...t, arch: l.arch && !l.arch.archOpen && typeof l.arch.archTotal === 'number' ? l.arch.archTotal : null });
    }
    return [...groups].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([key, ts]) => {
        const alone = ts.filter((t) => t.alone === true && typeof t.sevenDayDelta === 'number');
        const arch = ts.filter((t) => t.arch !== null);
        const archSum = arch.reduce((a, t) => a + t.arch, 0), execSum = arch.reduce((a, t) => a + t.tokensTotal, 0);
        return {
            key, lanes: ts.length, totalMedian: med(ts.map((t) => t.tokensTotal)), totalSum: ts.reduce((a, t) => a + t.tokensTotal, 0),
            ctxMaxMedian: med(ts.map((t) => t.ctxMax)), at200k: ts.filter((t) => t.at200k > 0).length, at250k: ts.filter((t) => t.at250k > 0).length,
            aloneDelta7d: Math.round(alone.reduce((a, t) => a + t.sevenDayDelta, 0) * 1e6) / 1e6, aloneLanes: alone.length,
            archLanes: arch.length, archSum, archMedian: med(arch.map((t) => t.arch)), archRatio: arch.length && execSum > 0 ? archSum / execSum : null,
        };
    });
}

export function stripCounts(rows) {
    const n = Object.fromEntries(STRIP.map(([k]) => [k, 0]));
    for (const r of rows) {
        const k = stripKey(r);
        if (k) n[k]++;
    }
    return n;
}

// ── /api/attention (P-2026-10-18-2320, discovery P-2026-10-18-2255 §Q1-§Q3) ─────
// What the menu bar app shows: the lanes that wait for the operator. A row whose pill is question, blocked or hard-stop
// is a candidate; it is closed when (a) its trunk prompt's Status no longer reads `da eseguire`, (b) a later lane names it
// in `Depends:` or `Corregge:`, or (c) a trunk commit after its end names it, `docs: add prompt` commits excepted.
// An open candidate is waiting up to ATTENTION_STALE_H hours after `since`, stale after.
export const ATTENTION_STALE_H = 72;
export const LIVE_LIMIT_MIN = 90;

/** When a candidate began to wait: the end of its last turn; a live lane over its limit, its start plus LIVE_LIMIT_MIN; else the Prompt-ID's time. */
export function attentionSince(r) {
    if (r.state === 'blocked') return r.start ? r.start + LIVE_LIMIT_MIN * 60e3 : r.t || 0;
    return r.end || r.t || 0;
}

/** Which closure holds for candidate r waiting since `since`: 'a', 'b', 'c' or ''. facts: status(id) the trunk Status line ('' without a
 *  trunk prompt), namedBy(id) the later lanes naming it, commits [{ at, subject, body }] of the trunk. */
export function closureOf(r, since, facts) {
    const s = String(facts.status(r.id) || '').trim();
    if (s && !/^da eseguire\b/i.test(s)) return 'a';
    if ((facts.namedBy(r.id) || []).length) return 'b';
    if ((facts.commits || []).some((c) => c.at > since && !/^docs: add prompt\b/.test(c.subject) && (c.subject + '\n' + c.body).includes(r.id))) return 'c';
    return '';
}

const hhmm = (ms) => { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

/** The /api/attention body, without v/now/stale/board, from the /api rows. facts as closureOf, plus text(id) → { firstLine, recommended }
 *  of an exited lane's final message, and an optional `closed` Set that remembers the closed ids across calls (a closed lane does not reopen). */
export function attentionOf(rows, facts, now) {
    const items = [], runningItems = [];
    let staleCount = 0, staleOldest = null;
    for (const r of rows) {
        if (r.chain) continue;
        const k = stripKey(r);
        if (k === 'running') { runningItems.push({ id: r.id, laneKind: r.kind || '', title: r.title || '', phase: r.phase || '', left: r.left || '', since: r.start || 0 }); continue; }
        if (k !== 'question' && k !== 'blocked' && k !== 'hard-stop') continue;
        const since = attentionSince(r);
        if (facts.closed && facts.closed.has(r.id)) continue;
        if (closureOf(r, since, facts)) { if (facts.closed) facts.closed.add(r.id); continue; }
        if (now - since > ATTENTION_STALE_H * 3600e3) { staleCount++; if (staleOldest === null || since < staleOldest) staleOldest = since; continue; }
        const tx = r.state === 'blocked' ? { firstLine: 'over its limit since ' + hhmm(since), recommended: '' } : facts.text(r.id) || { firstLine: '', recommended: '' };
        items.push({ id: r.id, kind: k, laneKind: r.kind || '', title: r.title || '', chat: r.chat || '', chatUrl: r.chatUrl || '', firstLine: tx.firstLine, recommended: tx.recommended, since });
    }
    items.sort((a, b) => a.since - b.since || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    runningItems.sort((a, b) => a.since - b.since);
    return { waiting: items.length, blocked: items.filter((i) => i.kind === 'blocked').length, running: runningItems.length, staleCount, staleOldest, items, runningItems };
}

/** A line cut to 60 characters at its last space after character 30, trailing punctuation trimmed, with an ellipsis; shorter lines as they are. */
function cut60(s) {
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length <= 60) return s;
    const sp = s.lastIndexOf(' ', 60);
    return s.slice(0, sp > 30 ? sp : 60).replace(/[\s.,;:!?…—–-]+$/, '') + '…';
}

/** The first line of a lane's final message (§Q3) and its last `Recommended:` line, each at most 60 characters and an ellipsis. */
export function firstLineOf(text) {
    const t = String(text || '').replace(/^\s*\[P-[^\]\n]*\]\s*/, '');
    const plain = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*|`/g, '').replace(/^#+\s+/, '').trim();
    const recs = t.split('\n').map((l) => l.trim()).filter((l) => /^(\*\*)?Recommended:/.test(l));
    const recommended = recs.length ? cut60(plain(recs[recs.length - 1]).replace(/^Recommended:\s*/, '')) : '';
    const ask = t.split('\n').map((l) => l.trim()).find((l) => /^\*\*(Decision|Question) for (you|Alfonso):\*\*/i.test(l));
    if (ask) return { firstLine: cut60(plain(ask.replace(/^\*\*[^*]+\*\*/, ''))), recommended };
    const para = t.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !/^(\*\*)?(Outcome|Recommended):/.test(p)) || '';
    const line = plain(para.split('\n')[0]);
    const sentence = (s, colon) => (s.match(colon ? /^.*?[.?!:](?=\s|$)/ : /^.*?[.?!](?=\s|$)/) || [s])[0];
    let first = sentence(line, true);
    if (first.endsWith(':')) {
        const after = line.slice(first.length).trim();
        if (after) first = sentence(after, false);
    }
    return { firstLine: cut60(first), recommended };
}

/** The Prompt-ID of a /l/<Prompt-ID> path, or null: the id alone, exact, nothing after it. */
export function laneLinkId(pathname) {
    const m = /^\/l\/(P-\d{4}-\d{2}-\d{2}-\d{4})$/.exec(pathname);
    return m ? m[1] : null;
}

/** The hand-off page of /l/<id>: asks the OS for jjodel-lanes://<id> (the menu bar app), and lands on the board's
 *  /#lane=<id> after 1.5 s unless the page lost focus or visibility first (the app took the link). */
export function laneLinkPage(id, onBoard) {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${id} · Jjodel lanes</title>
<style>body{margin:0;padding:24px;font:13px/1.45 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#0f172a;background:#f8fafc}a{color:#0284c7}</style></head><body>
<p>Opening <b>${id}</b> in Lane Monitor… <a href="/#lane=${id}">open it on the board</a></p>
${onBoard ? '' : '<p>' + id + ' is not on the board yet: the lane may not have started.</p>\n'}<script>
let gone=false;const off=()=>{gone=true};
window.addEventListener('blur',off);document.addEventListener('visibilitychange',()=>{if(document.hidden)off()});
location.href='jjodel-lanes://${id}';
setTimeout(()=>{if(!gone)location.replace('/#lane=${id}')},1500);
</script></body></html>`;
}

// The page's two themes (P-2026-10-19-1130, the «Lane Monitor Desktop» design): the same tokens, light and dark. The legacy
// names (--bg, --fg, --muted, --line, --card, --accent, --run, --ok, --warn, --hs, --bad) alias them, so timeline.js,
// insights.js and requirements.js follow the theme; --q, --neutral and --track are timeline.js's own, set here on a
// stronger selector so a theme chosen against the system's still reaches them. Slice 2 (P-2026-10-19-1157) took the
// design's neutrals for them and the link indigo for --q, so no purple is left; the question state paints in --warn.
const THEME_LIGHT = 'color-scheme:light;--t-side:#F7F7F8;--t-content:#FFFFFF;--t-panel:#FBFBFC;--t-panel2:#FFFFFF;--t-head:#F7F7F8;--t-line:#ECEDF0;--t-line2:#E5E6EA;--t-line3:#D9DAE0;' +
    '--t-text:#16171B;--t-text2:#5D616B;--t-muted:#80848E;--t-accent:#5B63D6;--t-link:#4B53C6;--t-accent-dim:#C9CCF2;--t-done:#2E9E66;--t-res:#237A52;--t-wait:#B7791F;--t-block:#D64541;--t-hs:#80848E;' +
    '--t-sel:#ECECEF;--t-hover:#F2F2F4;--t-tag:#EFEFF2;--t-k-fast:#2E9E66;--t-ban-bg:#FDF7EC;--t-ban-line:#F0DDB8;--t-ban-fg:#FFFFFF;--q:#4B53C6;--neutral:#A3A6AE;--track:#E5E6EA';
const THEME_DARK = 'color-scheme:dark;--t-side:#0C0D0F;--t-content:#0F1013;--t-panel:#121317;--t-panel2:#131418;--t-head:#101114;--t-line:#1C1E22;--t-line2:#1F2126;--t-line3:#2A2C33;' +
    '--t-text:#EDEEF0;--t-text2:#A1A4AB;--t-muted:#7E828B;--t-accent:#8A93FF;--t-link:#A9B1FF;--t-accent-dim:#3B3F6E;--t-done:#4CC38A;--t-res:#2E8F62;--t-wait:#F2B04C;--t-block:#F2645A;--t-hs:#8B8F98;' +
    '--t-sel:#1A1B20;--t-hover:#15161A;--t-tag:#1D1F25;--t-k-fast:#7FD3B0;--t-ban-bg:#17140E;--t-ban-line:#3A3020;--t-ban-fg:#17140E;--q:#A9B1FF;--neutral:#5A5E66;--track:#2A2C33';
// The views' icons, drawn for the board (plain strokes), as CSS masks: the tab buttons keep their bare label.
const icon = (body) => 'url("data:image/svg+xml,' + ("%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round'%3E" + body + '%3C/svg%3E') + '")';
const ICONS = {
    table: icon("%3Crect x='2' y='3' width='12' height='3' rx='1'/%3E%3Crect x='2' y='10' width='12' height='3' rx='1'/%3E"),
    timeline: icon("%3Cpath d='M2 4h6M5 8h8M3 12h5'/%3E"),
    insights: icon("%3Cpath d='M3 13V8M8 13V3M13 13V6'/%3E"),
    requirements: icon("%3Cpath d='M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01'/%3E"),
};
const MONO = 'ui-monospace,"SF Mono",SFMono-Regular,Menlo,monospace';

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jjodel Harness Lane Management</title>
<script data-theme-boot>try{var th=localStorage.getItem('laneBoardTheme');if(th==='light'||th==='dark')document.documentElement.setAttribute('data-theme',th)}catch(e){}</script>
<style>
:root,:root[data-theme=light]{${THEME_LIGHT}}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${THEME_DARK}}}
:root[data-theme=dark]{${THEME_DARK}}
:root{--bg:var(--t-content);--fg:var(--t-text);--muted:var(--t-muted);--line:var(--t-line2);--card:var(--t-panel);--accent:var(--t-accent);--run:var(--t-accent);--ok:var(--t-done);--warn:var(--t-wait);--hs:var(--t-hs);--bad:var(--t-block)}
*{box-sizing:border-box}body{margin:0;background:var(--t-content);color:var(--t-text);font:13px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--t-link);text-decoration:none}a:hover{text-decoration:underline}.mono{font-family:${MONO}}
/* The shell: a 232 px sidebar (product, views, lanes by state, needs attention, footer) and the view beside it. */
.app{display:flex;min-height:100vh}
.side{width:232px;flex:none;position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;background:var(--t-side);border-right:1px solid var(--t-line)}
.prod{display:flex;align-items:center;gap:10px;padding:16px 12px 14px 14px}.prod>div{min-width:0}
.logo{width:26px;height:26px;flex:none;border-radius:7px;background:var(--t-panel2);border:1px solid var(--t-line3);display:flex;align-items:center;justify-content:center;color:var(--t-link)}
.prod b{display:block;font-weight:600}.prod .mono{display:block;font-size:11px;color:var(--t-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
nav.tabs{display:flex;flex-direction:column;gap:1px;padding:0 8px}
nav.tabs>button{height:30px;display:flex;align-items:center;gap:10px;padding:0 10px;border:0;border-radius:6px;background:none;color:var(--t-text2);font:inherit;text-align:left;cursor:pointer}
nav.tabs>button:hover{background:var(--t-hover)}nav.tabs>button.on{background:var(--t-sel);color:var(--t-text)}
nav.tabs>button:focus-visible,.side a:focus-visible,.kpi:focus-visible{outline:2px solid var(--t-accent);outline-offset:-2px}
nav.tabs>button::before{content:'';width:15px;height:15px;flex:none;background:currentColor;-webkit-mask:var(--ic) center/15px no-repeat;mask:var(--ic) center/15px no-repeat}
nav.tabs>button::after{margin-left:auto;font:11px ${MONO};color:var(--t-muted)}
${Object.entries(ICONS).map(([t, u]) => 'nav.tabs>button[data-tab=' + t + ']{--ic:' + u + '}').join('')}
nav.tabs>button[data-tab=table]::after{content:var(--lanes-n,'');color:var(--t-link)}nav.tabs>button[data-tab=requirements]::after{content:var(--req-n,'')}
.grp,.strip::before{display:block;padding:18px 10px 6px;font-size:11px;font-weight:500;color:var(--t-muted);letter-spacing:.02em}.strip::before{content:'By state'}
.strip{display:flex;flex-direction:column;gap:1px}
.strip .sp,.attn a,.attn span.ar{height:28px;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:6px;font-size:13px;font-weight:400;text-decoration:none;cursor:pointer}
.strip .sp b{order:2;margin-left:auto;font:500 11px ${MONO};color:var(--t-muted)}.strip .sp.zero{opacity:.45}
.strip .sp:hover,.attn a:hover{background:var(--t-hover);text-decoration:none}.strip .sp.on,.attn a.on{background:var(--t-sel)}
.attn{display:flex;flex-direction:column;gap:1px;padding:0 8px}.attn a,.attn span.ar{color:var(--t-text2)}.attn span.ar{cursor:default}
.attn .n{margin-left:auto;font:500 11px ${MONO};color:var(--t-muted)}.attn .w .n{color:var(--t-wait)}.attn .b .n{color:var(--t-block)}.attn .none{padding:4px 10px;font-size:12px;color:var(--t-muted)}
.dot{width:8px;height:8px;flex:none;border-radius:50%;background:currentColor;margin:0 3px}.dot.w{background:var(--t-wait)}.dot.b{background:var(--t-block)}.dot.s{background:transparent;border:1.5px dashed var(--t-hs)}
.foot{margin-top:auto;padding:14px 18px 16px;border-top:1px solid var(--t-line);display:flex;flex-direction:column;gap:10px}
.fr{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12px;color:var(--t-muted)}.fr>*{white-space:nowrap}.fr b{font:500 12px ${MONO};color:var(--t-text);font-variant-numeric:tabular-nums;white-space:nowrap}.fr b small{font-size:12px;font-weight:400;color:var(--t-text2)}
.fr.fs{align-items:center;gap:6px;font-size:11px}.fr.fs .mono{margin-right:auto}.ok-dot{width:6px;height:6px;flex:none;border-radius:50%;background:var(--t-done)}.ok-dot.stale{background:var(--t-wait)}.ok-dot.down{background:var(--t-block)}
.theme{display:flex;gap:2px;padding:2px;background:var(--t-hover);border:1px solid var(--t-line2);border-radius:7px}
.theme button{flex:1;height:24px;border:0;border-radius:5px;background:transparent;color:var(--t-text2);font:inherit;font-size:12px;cursor:pointer}.theme button.on{background:var(--t-sel);color:var(--t-text);box-shadow:0 0 0 1px var(--t-line3)}
main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--t-content)}
.vh{height:52px;flex:none;position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:0 20px 0 24px;border-bottom:1px solid var(--t-line);background:var(--t-content)}
.vh h1{margin:0;font-size:14px;font-weight:600}.live{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--t-text2)}
.pulse{width:7px;height:7px;flex:none;border-radius:50%;background:var(--t-accent);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--t-accent) 55%,transparent)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
@media (prefers-reduced-motion:reduce){.pulse{animation:none}}
.view{padding:20px 24px 32px}
h2{display:flex;align-items:baseline;gap:8px;margin:24px 0 10px;font-size:12.5px;font-weight:500;color:var(--t-text)}h2 .h2n{font:11px ${MONO};color:var(--t-muted)}
.meta{color:var(--t-muted);font-size:12px}.meta b{color:var(--t-text);font-weight:600}
.empty{padding:16px;color:var(--t-muted)}.err{color:var(--bad);margin:0 0 8px}.err:empty{display:none}.err.stale{color:var(--warn)}
.spin{display:inline-block;width:10px;height:10px;border:2px solid var(--t-line3);border-top-color:var(--t-accent);border-radius:50%;animation:spin .8s linear infinite}.spin[hidden]{display:none}@keyframes spin{to{transform:rotate(360deg)}}
/* The Lanes tab: KPI strip, the waiting banner, running cards, the tables. */
.kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border:1px solid var(--t-line2);border-radius:10px;background:var(--t-panel);overflow:hidden}
.kpi{display:flex;flex-direction:column;gap:4px;padding:12px 16px;border:0;border-left:1px solid var(--t-line2);background:none;color:inherit;font:inherit;text-align:left}.kpi:first-child{border-left:0}
button.kpi{cursor:pointer}button.kpi:hover{background:var(--t-hover)}button.kpi.on{background:var(--t-sel)}
.kpi .kl{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--t-text2)}.kpi .kl .dot{width:7px;height:7px;margin:0}
.kpi .kv{display:flex;align-items:baseline;gap:8px}.kpi .kv b{font-size:22px;font-weight:500;letter-spacing:-.01em;font-variant-numeric:tabular-nums}.kpi .kv span{font-size:11px;color:var(--t-muted)}
.banner{display:flex;align-items:center;gap:14px;margin-top:16px;padding:10px 12px 10px 16px;border:1px solid var(--t-ban-line);background:var(--t-ban-bg);border-radius:10px}.banner[hidden]{display:none}
.banner svg{flex:none;color:var(--t-wait)}.banner .bt b{font-weight:500}.banner .bt span{color:var(--t-text2)}
.banner a{margin-left:auto;flex:none;height:28px;display:flex;align-items:center;padding:0 12px;border-radius:7px;background:var(--t-wait);color:var(--t-ban-fg);font-weight:500;font-size:12.5px;cursor:pointer}.banner a:hover{text-decoration:none;filter:brightness(1.08)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:12px}.cards>.empty{border:1px solid var(--t-line2);border-radius:10px;background:var(--t-panel)}
.card{display:flex;flex-direction:column;gap:12px;min-width:0;padding:14px 16px;border:1px solid var(--t-line2);border-radius:10px;background:var(--t-panel2)}.card.c-run{border-color:var(--t-accent-dim)}.card.c-blk{border-color:color-mix(in srgb,var(--t-wait) 45%,var(--t-line2))}
.card.mark{box-shadow:0 0 0 2px var(--t-accent)}
.ch{display:flex;align-items:center;gap:10px;min-width:0}.ch .cid{font:500 12.5px ${MONO};white-space:nowrap}.ch .ct{margin-left:auto;font-size:12px;color:var(--t-text2);white-space:nowrap;font-variant-numeric:tabular-nums}.ch .ct b{font-weight:400;color:var(--t-text)}
.ch .pulse.c-blk{background:var(--t-wait);animation:none}
.ctitle{font-size:13.5px;line-height:1.4;min-height:38px;overflow-wrap:anywhere}
.cprog{display:flex;flex-direction:column;gap:6px}.csteps{display:flex;gap:3px}.csteps i{flex:1;height:4px;border-radius:2px;background:var(--t-line3)}.csteps i.reached{background:var(--t-accent)}.csteps i.skipped{background:var(--t-accent-dim)}
.cphase{display:flex;justify-content:space-between;gap:12px;font-size:11.5px;color:var(--t-muted)}.cphase span:last-child{font-family:${MONO};color:var(--t-text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.cfacts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding-top:10px;border-top:1px solid var(--t-line2)}.cfacts div{display:flex;flex-direction:column;gap:2px;min-width:0}.cfacts span{font-size:11px;color:var(--t-muted)}.cfacts b{font:400 12px ${MONO};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cby{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--t-muted);min-width:0}
.wrap{overflow-x:auto;background:var(--t-panel);border:1px solid var(--t-line2);border-radius:10px}
table{border-collapse:collapse;width:100%;min-width:900px}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--t-line);vertical-align:middle}
th{height:34px;font-size:11.5px;font-weight:400;color:var(--t-muted);background:var(--t-head);white-space:nowrap;border-bottom-color:var(--t-line2)}tr:last-child td{border-bottom:0}tbody tr:hover>td{background:var(--t-hover)}
td.id{font:12px ${MONO};color:var(--t-text);white-space:nowrap}td.when{white-space:nowrap;font:12px ${MONO};color:var(--t-text2);font-variant-numeric:tabular-nums}
.title{display:block;color:var(--t-text2);font-size:11px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;max-width:320px;white-space:normal}
td.id .title{margin-top:1px;font-size:12.5px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
/* State as a dot and a word (a dashed ring for hard-stop); the launcher as a quiet tag; the kind as a mono tag. */
.pill{display:inline-flex;align-items:center;gap:7px;max-width:100%;font-size:12px;font-weight:400;white-space:nowrap}.pill::before{content:'';width:8px;height:8px;flex:none;border-radius:50%;background:currentColor}
.pill.hard-stop::before{background:transparent;border:1.5px dashed currentColor}
span[class=pill]{padding:1px 6px;border-radius:5px;background:var(--t-tag);font-size:11px;margin-right:6px}span[class=pill]::before{display:none}
.exited{color:var(--t-text2)}.pill.exited::before{background:var(--t-muted)}.running{color:var(--run)}.blocked,.stopped{color:var(--warn)}.done,.resolved{color:var(--ok)}.question{color:var(--warn)}.hard-stop{color:var(--hs)}.blocked-o,.unparsed,.failed{color:var(--bad)}
.phase{max-width:340px}
td.phase .prow{display:flex;align-items:center;gap:6px;height:18px;overflow:hidden}td.phase .ptext{display:block;height:18px;line-height:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--t-text2)}td.phase .n{flex:none;color:var(--muted);font:11px ${MONO}}
.segs{display:flex;gap:2px;min-width:0}.segs .seg{display:block;flex:0 1 10px;min-width:3px;height:4px;border-radius:2px;background:var(--t-line3)}.segs .seg.reached{background:var(--run)}.segs .seg.skipped{background:var(--t-accent-dim)}
table.lfx{table-layout:fixed;width:100%;min-width:1640px}table.lfx th,table.lfx td{padding:8px;overflow:hidden;overflow-wrap:anywhere}table.lfx th:first-child,table.lfx td:first-child{padding-left:16px}table.lfx .pill{overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
table.cfx{table-layout:fixed;width:100%;min-width:1100px}table.cfx th,table.cfx td{padding:7px 8px;overflow:hidden}table.cfx th:first-child,table.cfx td:first-child{padding-left:16px}table.cfx .r{text-align:right}
table.cfx td.r b{display:block;font-weight:400;font-size:12.5px;font-variant-numeric:tabular-nums;white-space:nowrap}table.cfx td.cn b{font:12px ${MONO}}table.cfx .sub{display:block;font:10.5px ${MONO};color:var(--t-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
table.cfx td.cw{font:12px ${MONO};color:var(--t-text2);font-variant-numeric:tabular-nums}table.cfx td.cwt{font:11.5px ${MONO};color:var(--t-text2)}table.cfx td.cby2{white-space:nowrap;text-overflow:ellipsis}table.cfx td.cby2 .title{display:inline;max-width:none;white-space:nowrap;font-size:10.5px}table.cfx td.cby2 span[class=pill]{margin-right:4px}table.cfx .pill{overflow:hidden;text-overflow:ellipsis;vertical-align:middle}
td.lfx-num{white-space:nowrap;font:12px ${MONO};font-variant-numeric:tabular-nums}td.lfx-cut{white-space:nowrap;text-overflow:ellipsis}td.lfx-cut:not(:has(.kb)){font:12px ${MONO};color:var(--t-text2)}
a.chat{color:var(--t-link);text-decoration:none;font:11px ${MONO};display:inline}a.chat:hover{text-decoration:underline}
.load-hi{color:var(--bad);font-weight:600}
.filt{display:flex;gap:12px;align-items:baseline}.filt a{color:var(--t-link);font-size:12px;font-weight:400;cursor:pointer}
/* The Kind badge and its overlay (P-2026-10-18-1428): one width for every kind, so no row moves between states. */
button.kb{width:64px;padding:1px 2px;justify-content:center;border:1px solid var(--t-line3);border-radius:5px;background:none;font:10.5px/1.45 ${MONO};cursor:pointer}button.kb::before{display:none}button.kb:focus-visible{outline:2px solid var(--accent);outline-offset:1px}button.kb.on{box-shadow:0 0 0 2px currentColor}
.k-merge{color:var(--t-text2)}.k-fast{color:var(--t-k-fast)}.k-discovery{color:var(--warn)}.k-phase2{color:var(--t-link)}.k-unknown,.k-chain{color:var(--muted)}button.kb.k-unknown,button.kb.k-chain{border-style:dashed}.ksx{color:var(--muted);font-size:11px;white-space:nowrap}
#kd{position:absolute;z-index:20;max-width:460px;background:var(--t-panel2);color:var(--t-text);border:1px solid var(--t-line3);border-radius:8px;padding:8px 10px;font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,.28);pointer-events:none;overflow-wrap:anywhere}#kd.pin{pointer-events:auto}#kd div{margin-top:2px;color:var(--t-text2)}
details{margin-bottom:8px}summary{cursor:pointer;display:flex;gap:16px;align-items:baseline;padding:9px 16px;background:var(--t-panel);border:1px solid var(--t-line2);border-radius:10px;list-style:none}summary:hover{background:var(--t-hover)}summary b{font:500 12.5px ${MONO}}summary::-webkit-details-marker{display:none}summary::before{content:'\\25B8';color:var(--muted)}details[open] summary::before{content:'\\25BE'}details[open] summary{border-radius:10px 10px 0 0;border-bottom:0}details[open] .wrap{border-radius:0 0 10px 10px}
/* #lane=<id> (P-2026-10-18-2320): the row the link names, until the next click. */
tr.mark>td{background:color-mix(in srgb,var(--run) 12%,transparent)}tr.mark>td:first-child{box-shadow:inset 3px 0 0 var(--run)}
/* Below 900 px the sidebar folds into a top bar. */
@media (max-width:899px){
.app{flex-direction:column}.side{position:static;width:auto;height:auto;overflow:visible;flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:6px 10px;border-right:0;border-bottom:1px solid var(--t-line)}
.prod{padding:2px 6px 2px 0}.prod .mono{display:none}nav.tabs{flex-direction:row;flex-wrap:wrap;padding:0}nav.tabs>button{height:28px}
.strip{flex-direction:row;flex-wrap:wrap;flex-basis:100%}.strip::before,.grp{display:none}.strip .sp,.attn a,.attn span.ar{height:26px;padding:0 8px;gap:6px;font-size:12px}.strip .sp b{order:0;margin-left:0}
.attn{flex-direction:row;flex-wrap:wrap;padding:0}.foot{margin:0 0 0 auto;padding:2px 0;border-top:0;flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px 14px}.fr{gap:6px}.theme{width:180px}
.vh{position:static}.view{padding:16px}.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.kpi:nth-child(4){border-left:0}.kpi:nth-child(n+4){border-top:1px solid var(--t-line2)}.cards{grid-template-columns:minmax(0,1fr)}.cfacts{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style></head><body><div class="app">
<aside class="side" aria-label="Board">
<div class="prod"><span class="logo" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 4h12M2 8h8M2 12h11"/></svg></span><div><b>Jjodel Harness</b><span class="mono" title="The trunk the board reads">${TRUNK}</span></div></div>
<nav class="tabs"><button data-tab="table">Lanes</button><button data-tab="timeline">Timeline</button><button data-tab="insights">Insights</button><button data-tab="requirements">Requirements</button><div class="strip" id="strip" aria-label="Lanes by state">${STRIP.map(([k, label, cls]) => '<a href="#" role="button" class="pill sp ' + cls + ' zero" data-k="' + k + '" title="Show the ' + label + ' lanes"><b>0</b>' + label + '</a>').join('')}</div></nav>
<div class="grp" id="attn-h">Needs attention</div><div class="attn" id="attn" aria-labelledby="attn-h"><span class="none">Loading…</span></div>
<div class="foot">
<div class="fr"><span>Spend today</span><b id="f-spend" title="Spend on this day at API list price, each turn counted on the day it ended. The architect chat is not included.">…</b></div>
<div class="fr"><span>Load 1 · 5 · 15 min</span><b id="f-load">…</b></div>
<div class="fr fs"><span class="ok-dot" id="f-dot"></span><span class="mono">localhost:${PORT}</span><span id="f-sync">…</span></div>
<div class="theme" id="theme" role="group" aria-label="Theme"><button type="button" data-th="light">Light</button><button type="button" data-th="dark">Dark</button><button type="button" data-th="system">System</button></div>
</div>
</aside>
<main>
<header class="vh"><h1 id="vt">Lanes</h1><span class="spin" id="spin" role="status" aria-label="Loading" hidden></span><span class="live" id="meta"><span class="pulse" aria-hidden="true"></span>Live · every ${REFRESH_S} s</span></header>
<div class="view">
<div class="err" id="err"></div>
<div class="meta" id="lanenote" hidden></div>
<section id="tab-table">
<div class="kpis" id="kpis" aria-label="Summary"></div>
<div class="banner" id="banner" role="status" hidden></div>
<div id="lanes-filt" hidden></div>
<div id="lanes-all">
<h2>Running<span class="h2n" id="n-live"></span></h2><div class="cards" id="live"><div class="empty">Loading lanes…</div></div>
<h2>Last ${RECENT_H} hours<span class="h2n" id="n-recent"></span></h2><div class="wrap" id="recent"></div>
<h2>Earlier lanes</h2><div id="older"></div>
</div>
</section>
<section id="tab-timeline" hidden><div id="tl"></div></section>
<section id="tab-insights" hidden><div id="ins"></div></section>
<section id="tab-requirements" hidden><div id="req"></div></section>
</div>
<div id="kd" role="tooltip" hidden></div>
</main></div><script src="/timeline.js"></script><script src="/insights.js"></script><script src="/requirements.js"></script><script>
const REFRESH=${REFRESH_S}*1000;
const stripKey=${stripKey.toString()};
const abbr=${abbr.toString()};
const tokenGroups=${tokenGroups.toString()};
const STRIP=${JSON.stringify(STRIP)};
let laneFilter='',lastRows=[];
// The spinner beside "updated at": on while a request to /api or /api/* is in flight, from any tab (fetch is
// counted here, so timeline.js, insights.js and requirements.js need nothing), or while the last /api answer
// said the server was still refreshing; then the page asks again in 2 s.
let inflight=0,refreshing=false,again=0,loaded=false;
const spin=()=>{document.getElementById('spin').hidden=!(inflight||refreshing)};
if(window.fetch){const f0=window.fetch.bind(window);window.fetch=function(u,o){const p=new URL(String(u&&u.url||u),location.href).pathname;if(p!=='/api'&&!p.startsWith('/api/'))return f0(u,o);inflight++;spin();return f0(u,o).finally(()=>{inflight--;spin()})}}
function renderStrip(rows){
  const n={};STRIP.forEach(([k])=>{n[k]=0});rows.forEach(r=>{const k=stripKey(r);if(k)n[k]++});
  STRIP.forEach(([k])=>{const el=document.querySelector('#strip [data-k="'+k+'"]');if(!el)return;el.querySelector('b').textContent=n[k];el.classList.toggle('zero',!n[k]);el.classList.toggle('on',laneFilter===k)});
  renderKpis(rows);renderAttn();
}
// Beside the strip's keys, three filters of the shell (P-2026-10-19-1130): the lanes /api/attention lists as waiting for a
// reply (question, hard-stop), the ones it lists as blocked, and the lanes resolved in the last 24 hours.
const FILTERS={waiting:'waiting for a reply',blockednow:'blocked now',resolved24:'resolved, last 24 h'};
let attn=null;
const attnIds=b=>new Set(((attn&&attn.items)||[]).filter(i=>(i.kind==='blocked')===b).map(i=>i.id));
function inFilter(k){
  if(k==='waiting'||k==='blockednow'){const ids=attnIds(k==='blockednow');return r=>ids.has(r.id)}
  if(k==='resolved24')return r=>stripKey(r)==='resolved'&&r.recent;
  return r=>stripKey(r)===k;
}
const plural=(n,w)=>n+' '+w+(n===1?'':'s');
// The KPI strip: six cells, each with its window; a cell with a filter behind it filters the Lanes tab as a pill does.
function renderKpis(rows){
  const box=document.getElementById('kpis');
  const n=k=>rows.filter(inFilter(k)).length;
  const sp=daySpend(ymd(new Date()));
  const cells=[['running','Running',n('running'),'now','var(--t-accent)'],['waiting','Waiting',attn?attnIds(false).size:'–','now','var(--t-wait)'],['blockednow','Blocked',attn?attnIds(true).size:'–','now','var(--t-block)'],
    ['done','Done',n('done'),'last 24 h','var(--t-done)'],['resolved24','Resolved',n('resolved24'),'last 24 h','var(--t-res)'],['','Spend',sp||(Object.keys(spendByDay).length?'$0.00':'–'),'today','var(--t-hs)']];
  box.innerHTML=cells.map(([k,l,v,w,c])=>(k?'<button type="button" class="kpi'+(laneFilter===k?' on':'')+'" data-f="'+k+'" title="Show the lanes: '+esc(l.toLowerCase())+', '+w+'">':'<div class="kpi" title="'+esc(SPEND_TIP)+'">')+
    '<span class="kl"><span class="dot" style="background:'+c+'"></span>'+l+'</span><span class="kv"><b>'+esc(v)+'</b><span>'+w+'</span></span>'+(k?'</button>':'</div>')).join('');
  const root=document.documentElement;if(root&&root.style)root.style.setProperty('--lanes-n',n('running')?'"'+n('running')+'"':'""');
}
// Needs attention (sidebar) and the banner, from /api/attention: waiting and blocked filter the Lanes tab; stale is a count.
function renderAttn(){
  const box=document.getElementById('attn'),ban=document.getElementById('banner');
  if(!attn){ban.hidden=true;return}
  if(attn.board&&attn.board!=='ok'){box.innerHTML='<span class="none" title="'+esc(attn.board)+'">unavailable</span>';ban.hidden=true;return}
  const w=attnIds(false).size,b=attnIds(true).size;
  const row=(k,cls,label,n,tip)=>'<a href="#" role="button" class="'+cls+(laneFilter===k?' on':'')+'" data-f="'+k+'" title="'+esc(tip)+'"><span class="dot '+cls+'"></span>'+label+'<span class="n">'+n+'</span></a>';
  box.innerHTML=row('waiting','w','Waiting',w,'Question or hard-stop, not yet closed, waiting less than '+${ATTENTION_STALE_H}+' h')+row('blockednow','b','Blocked',b,'Over the time limit while running, or exited blocked')+
    '<span class="ar" title="Waiting more than '+${ATTENTION_STALE_H}+' h'+(attn.staleOldest?', the oldest since '+esc(new Date(attn.staleOldest).toLocaleString('en-GB'))+'':'')+': counted, not listed"><span class="dot s"></span>Stale<span class="n">'+attn.staleCount+'</span></span>';
  ban.hidden=!attn.waiting;
  if(!attn.waiting)return;
  const lead=w?'<b>'+plural(w,'lane')+' '+(w===1?'is':'are')+' waiting for a GO, ACK or answer</b>'+(b?'<span>, and '+b+' '+(b===1?'is':'are')+' blocked.</span>':'<span>.</span>'):'<b>'+plural(b,'lane')+' '+(b===1?'is':'are')+' blocked</b><span>.</span>';
  ban.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11h.01"/></svg><span class="bt">'+lead+'<span> Their agents are idle until you reply.</span></span><a href="#" role="button" data-f="'+(w?'waiting':'blockednow')+'">Show '+(w?'waiting':'blocked')+' lanes</a>';
}
async function attnTick(){try{attn=await (await fetch('/api/attention',{cache:'no-store'})).json();renderKpis(lastRows);renderAttn();if(laneFilter==='waiting'||laneFilter==='blockednow'){renderLanes(lastRows);markLane()}}catch(e){}}
// A pill shows its lanes alone, through the same table(): the running ones first, then the exited.
function renderLanes(rows){
  const f=document.getElementById('lanes-filt'),all=document.getElementById('lanes-all');
  f.hidden=!laneFilter;all.hidden=!!laneFilter;
  if(laneFilter){
    const label=(STRIP.find(s=>s[0]===laneFilter)||[,FILTERS[laneFilter]||laneFilter])[1];
    const rs=rows.filter(inFilter(laneFilter)),L=rs.filter(r=>r.live),E=rs.filter(r=>!r.live);
    f.innerHTML='<h2 class="filt"><span>'+esc(label)+' · '+rs.length+' lane'+(rs.length===1?'':'s')+'</span><a id="clearf">show all lanes</a></h2>'+
      (rs.length?'':'<div class="wrap"><div class="empty">No lane in this state.</div></div>')+
      (L.length?'<div class="wrap">'+table(L,true)+'</div>':'')+(E.length?'<div class="wrap"'+(L.length?' style="margin-top:8px"':'')+'>'+table(E,false)+'</div>':'');
    document.getElementById('clearf').addEventListener('click',e=>{e.preventDefault();setFilter('')});
    return;
  }
  const L=rows.filter(r=>r.live),R=rows.filter(r=>!r.live&&r.recent);
  document.getElementById('live').innerHTML=cards(L);
  document.getElementById('n-live').textContent=L.length?String(L.length):'';
  document.getElementById('recent').innerHTML=compact(R);
  const rd=R.filter(r=>stripKey(r)==='done').length,rr=R.filter(r=>stripKey(r)==='resolved').length;
  document.getElementById('n-recent').textContent=R.length?R.length+' lanes · '+rd+' done · '+rr+' resolved':'';
  renderOlder(rows.filter(r=>!r.live&&!r.recent));
}
// A second click on the pill of the filter, or "show all lanes", clears it.
function setFilter(k){laneFilter=k;renderStrip(lastRows);renderLanes(lastRows)}
document.getElementById('strip').addEventListener('click',e=>{const a=e.target.closest('[data-k]');if(!a)return;e.preventDefault();showTab('table');setFilter(laneFilter===a.dataset.k?'':a.dataset.k)});
// The KPI cells, Needs attention and the banner's link filter alike; a second click clears.
['kpis','attn','banner'].forEach(id=>document.getElementById(id).addEventListener('click',e=>{const a=e.target.closest('[data-f]');if(!a)return;e.preventDefault();showTab('table');setFilter(laneFilter===a.dataset.f?'':a.dataset.f)}));
// The running lanes as cards (Lanes tab, no filter): the same facts as the Running table, laid out as in the design; the
// filtered view keeps table(). The Kind badge is the table's, so #lane=<id> and the overlay find the card as they find a row.
function cards(rows){
  if(!rows.length)return '<div class="empty">'+(loaded?'No lane is running.':'Loading lanes…')+'</div>';
  return rows.map(r=>{
    const p=r.progress,st=r.state==='blocked'?'c-blk':'c-run';
    const left=!r.left||r.left==='?'?'':/^(about|under) /.test(r.left)?r.left+' left':r.left;
    const el=r.start?dur(Math.floor(r.work/60000)):'';
    const label=p?p.reached+' of '+p.total+' milestones reached'+(p.current?', last '+p.current:''):'';
    const steps=p?'<span class="csteps" role="img" aria-label="'+esc(label)+'">'+p.steps.map(s=>'<i class="'+esc(s.state)+'" title="'+esc(s.name+': '+s.state)+'"></i>').join('')+'</span>':'';
    const fact=(k,v,tip)=>'<div><span>'+k+'</span><b title="'+esc(tip||v)+'">'+(v===''?'–':esc(v))+'</b></div>';
    const hm=r.start?pad(new Date(r.start).getHours())+':'+pad(new Date(r.start).getMinutes()):'';
    return '<article class="card '+st+'" data-id="'+esc(r.id)+'"><div class="ch"><span class="pulse '+st+'" title="'+esc(r.state)+'"></span><span class="cid">'+esc(r.id)+'</span>'+kindBadge(r)+
      '<span class="ct" title="'+esc(tips.Elapsed+'; the time left is an estimate')+'">'+esc(el)+(left?' · <b>'+esc(left)+'</b>':'')+'</span></div>'+
      '<div class="ctitle">'+esc(r.title||r.id)+'</div>'+
      '<div class="cprog">'+steps+'<div class="cphase"><span>'+esc(p?p.reached+'/'+p.total+(p.current?' · '+p.current:''):r.chain?'chain':'no progress read')+'</span><span title="'+esc(r.phase)+'">'+esc(r.phase)+'</span></div></div>'+
      '<div class="cfacts">'+fact('Started',hm)+fact('Tokens in',abbr(r.tokensIn),tips.In+(r.tokensIn===null||r.tokensIn===undefined?'':': '+r.tokensIn))+fact('Context peak',abbr(r.ctxMax),tips['Ctx max']+(r.ctxMax===null||r.ctxMax===undefined?'':': '+r.ctxMax))+fact('Worktree',r.worktree||'')+'</div>'+
      '<div class="cby"><span>Launched by</span>'+launch(r)+'</div></article>';
  }).join('');
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pill=(t,cls)=>t?'<span class="pill '+esc(cls||t)+'">'+esc(t)+'</span>':'';
// The chat id opens the lane's claude.ai conversation when one is known; a URL without a chat id reads "chat".
const chatFrom=r=>({request:'from the Request header',commit:'from the commit that added the prompt','chat-id':'inferred from '+r.chatUrlVia+', same chat id'})[r.chatUrlFrom]||'';
const chatLink=r=>r.chatUrl?'<a class="title chat" href="'+esc(r.chatUrl)+'" target="_blank" rel="noopener" title="'+esc(chatFrom(r))+'">'+esc(/C-\\d{4}-\\d{2}-\\d{2}-\\d{4}/.test(r.chat)?r.chat:'chat')+'</a>':(r.chat?'<span class="title">'+esc(r.chat)+'</span>':'');
const launch=r=>{const l=r.launcher||{};const c={chat:'var(--run)',harness:'var(--muted)',chain:'var(--muted)','claude-code':'var(--warn)',manual:'var(--ok)'}[l.by]||'var(--muted)';return (l.label?'<span class="pill" style="color:'+c+'" title="'+esc(l.detail||'')+'">'+esc(l.label)+'</span>':'')+chatLink(r)};
const dur=m=>m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min';
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
// HH:MM on the table's reference day (YYYY-MM-DD), MM-DD HH:MM on any other; empty when unknown.
const when=(ms,day)=>{if(!ms)return '<td class="when"></td>';const d=new Date(ms);const hm=pad(d.getHours())+':'+pad(d.getMinutes());return '<td class="when">'+(ymd(d)===day?hm:pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+hm)+'</td>'};
// Elapsed is the working time, the sum of the turns; empty when no turn is known.
const work=r=>'<td class="lfx-num">'+(r.start?dur(Math.floor(r.work/60000)):'')+'</td>';
// Span is the start to the end, waits for decisions included: to now while the lane runs; empty when an end is unknown.
const span=r=>{const e=r.live?Date.now():r.end;return '<td class="lfx-num">'+(r.start&&e?dur(Math.floor((e-r.start)/60000)):'')+'</td>'};
const tips={Elapsed:"Working time: the sum of the lane's turns",Span:'From start to end, waits for decisions included',In:'Main session: input, cache read and cache creation tokens',Out:'Output tokens, from the last modelUsage (all models of the lane)',Total:'In + Out',Arch:"The architect's tokens over the lane (input + output), from architect.json: open until the chat closes the lane, n/a without the file",'Ctx max':'The largest main context of one call',Cost:"List price at API rates: total_cost_usd as Claude Code reports it, cumulative over the lane's sessions. Not what the subscription costs. The architect chat is not included. Subagents included."};
// In, Out, Total and Ctx max (P-2026-10-18-1045): abbreviated, the exact integer in the title; n/a without per-call usage.
const tnum=(v,more)=>'<td class="lfx-num" title="'+esc(v===null||v===undefined?'':String(v)+(more||''))+'">'+abbr(v)+'</td>';
// Arch (P-2026-10-18-1155): the architect's totalIn + output from the lane's architect.json; open while the chat has not closed it.
const arch=r=>{const none=r.archTotal===null||r.archTotal===undefined;const chat=r.archChat?' · chat '+r.archChat:'';return '<td class="lfx-num" title="'+esc(r.archOpen?'open'+chat:none?'':'in '+r.archIn+' · out '+r.archOut+' · total '+r.archTotal+chat)+'">'+(r.archOpen?'open':abbr(none?null:r.archTotal))+'</td>'};
// Cost (P-2026-10-18-1750): list price of the lane at API rates, $ and two decimals; empty without a result that carries a cost.
const usd=v=>v>0&&v<0.01?'<$0.01':'$'+v.toFixed(2);
const cost=r=>{const none=r.costUSD===null||r.costUSD===undefined;return '<td class="lfx-num" title="'+esc(none?'':'$'+Number(r.costUSD.toFixed(6))+' · '+r.sessions+' session'+(r.sessions===1?'':'s'))+'">'+(none?'':esc(usd(r.costUSD)))+'</td>'};
// The spend of a day, from /api spendByDay (each turn on the day it ended); empty when the day has none.
let spendByDay={};
const SPEND_TIP='Spend on this day at API list price, each turn counted on the day it ended. The architect chat is not included.';
const daySpend=day=>typeof spendByDay[day]==='number'?usd(spendByDay[day]):'';
const tokens=r=>tnum(r.tokensIn,' · subagents: '+(r.tokensSub||0)+' tokens')+tnum(r.tokensIn===null?null:r.tokensOut)+tnum(r.tokensTotal)+arch(r)+cost(r)+tnum(r.ctxMax);
// One width per column name, shared by every Lanes-tab table so a column keeps its width wherever it appears.
// Phase (Running) and Outcome (exited) have none: they take the room the others leave.
// The five token columns widen the Lanes tab's page by 328 px (main.wide): 360 for them, less 32 from Worktree; Cost adds 64 more.
const COL_W={Lane:200,State:92,Kind:124,Started:96,Ended:96,Elapsed:100,Span:100,In:72,Out:72,Total:72,Arch:72,Cost:64,'Ctx max':72,Left:116,Worktree:112,'Launched by':128};
// Phase (Running): the milestone segments (reached, skipped, pending) and n/m on one line, the phase text cut below,
// whole in the title. Both lines are drawn with or without progress, so a row keeps its height as the lane advances.
function phaseCell(r){
  const p=r.progress;
  let line='';
  if(p){
    const label=p.reached+' of '+p.total+' milestones reached'+(p.current?', last '+p.current:'');
    line='<span class="segs" role="img" aria-label="'+esc(label)+'">'+p.steps.map(s=>'<i class="seg '+esc(s.state)+'" title="'+esc(s.name+': '+s.state)+'"></i>').join('')+'</span><span class="n" title="'+esc(label)+'">'+p.reached+'/'+p.total+'</span>';
  }
  return '<td class="phase" title="'+esc(r.phase)+'"><span class="prow">'+line+'</span><span class="ptext">'+esc(r.phase)+'</span></td>';
}
// Kind (P-2026-10-18-1428): a fixed-width badge per kind, then direct and the tier; the overlay's lines ride in data-kd.
// Hover or focus shows the overlay, a click pins it until Esc, a click outside or a click on another badge.
let kdPin='';
const kindBadge=r=>{const k=r.chain?'chain':r.kind||'unknown';const sx=[r.direct?'direct':'',r.tier].filter(Boolean).join(' · ');return '<button type="button" class="pill kb k-'+esc(k)+(kdPin===r.id?' on':'')+'" data-id="'+esc(r.id)+'" data-kd="'+esc((r.kindInfo||[]).join('\\n')).replace(/\\n/g,'&#10;')+'" aria-describedby="kd">'+esc(k)+'</button>'+(sx?'<span class="ksx"> · '+esc(sx)+'</span>':'')};
const kindCell=r=>'<td class="lfx-cut">'+kindBadge(r)+'</td>';
const kd=document.getElementById('kd');
function kdShow(b){
  kd.innerHTML=(b.getAttribute('data-kd')||'').split('\\n').map((l,i)=>i?'<div>'+esc(l)+'</div>':'<b>'+esc(l)+'</b>').join('');
  kd.hidden=false;
  const r=b.getBoundingClientRect(),o=kd.getBoundingClientRect();
  let y=r.bottom+6;if(y+o.height>innerHeight-8)y=Math.max(8,r.top-o.height-6);
  // Placed in the viewport, written in page coordinates: a scroll of the window carries it with its badge.
  kd.style.left=scrollX+Math.max(8,Math.min(r.left,innerWidth-o.width-8))+'px';kd.style.top=scrollY+y+'px';
}
function kdHide(){kd.hidden=true;kd.classList.remove('pin');kdPin='';document.querySelectorAll('button.kb.on').forEach(b=>b.classList.remove('on'))}
const kbOf=e=>e.target&&e.target.closest?e.target.closest('button.kb'):null;
document.body.addEventListener('mouseover',e=>{const b=kbOf(e);if(b&&!kdPin)kdShow(b)});
document.body.addEventListener('focusin',e=>{const b=kbOf(e);if(b&&!kdPin)kdShow(b)});
document.body.addEventListener('mouseout',e=>{const b=kbOf(e);if(b&&!kdPin&&!b.contains(e.relatedTarget))kd.hidden=true});
document.body.addEventListener('focusout',e=>{if(kbOf(e)&&!kdPin)kd.hidden=true});
document.body.addEventListener('click',e=>{
  const b=kbOf(e);
  if(b){const same=kdPin===b.dataset.id;kdHide();if(same)return;kdPin=b.dataset.id;b.classList.add('on');kd.classList.add('pin');kdShow(b);return}
  if(kdPin&&!kd.contains(e.target))kdHide();
});
document.body.addEventListener('keydown',e=>{if(e.key==='Escape'&&!kd.hidden)kdHide()});
// A table scrolled sideways moves the badge: a pinned overlay follows it, a hover one closes.
document.body.addEventListener('scroll',()=>{if(kd.hidden)return;const b=kdPin&&document.querySelector('button.kb[data-id="'+kdPin+'"]');if(b)kdShow(b);else kdHide()},true);
// day: the reference day of Started and Ended, today unless given (an Earlier lanes group passes its own).
function table(rows,live,day){
  day=day||ymd(new Date());
  if(!rows.length)return '<div class="empty">'+(live?(loaded?'No lane is running.':'Loading lanes…'):'No lanes in this period.')+'</div>';
  const cols=live?['Lane','State','Kind','Started','Elapsed','Span','In','Out','Total','Arch','Cost','Ctx max','Left','Phase','Worktree','Launched by']:['Lane','State','Outcome','Kind','Started','Ended','Elapsed','Span','In','Out','Total','Arch','Cost','Ctx max','Worktree','Launched by'];
  let h='<table class="lfx"><colgroup>'+cols.map(c=>'<col'+(COL_W[c]?' style="width:'+COL_W[c]+'px"':'')+'>').join('')+'</colgroup><thead><tr>'+cols.map(c=>'<th'+(tips[c]?' title="'+esc(tips[c])+'"':'')+'>'+c+'</th>').join('')+'</tr></thead><tbody>';
  for(const r of rows){
    const id='<td class="id">'+esc(r.id)+(r.title?'<span class="title">'+esc(r.title)+'</span>':'')+'</td>';
    const kind=kindCell(r);
    const oc=r.outcome==='none'?'':r.outcome;
    const wt='<td class="lfx-cut" title="'+esc(r.worktree)+'">'+esc(r.worktree)+'</td>';
    if(live)h+='<tr>'+id+'<td>'+pill(r.state)+'</td>'+kind+when(r.start,day)+work(r)+span(r)+tokens(r)+'<td class="lfx-num">'+esc(r.left)+'</td>'+phaseCell(r)+wt+'<td>'+launch(r)+'</td></tr>';
    else h+='<tr>'+id+'<td>'+pill(r.state)+'</td><td>'+pill(oc,oc==='blocked'?'blocked-o':oc)+'</td>'+kind+when(r.start,day)+when(r.end,day)+work(r)+span(r)+tokens(r)+wt+'<td>'+launch(r)+'</td></tr>';
  }
  return h+'</tbody></table>';
}
// The 24 h and earlier tables (P-2026-10-19-1130, fix after the chat check): ten columns that fit 1160 px, as Main.dc.html.
// Same rows, same order, same values as table(): Started and Ended as one Window cell, Elapsed over Span, Total over In / Out,
// Ctx max over Arch, State beside the outcome; whatever a cell leaves out is in its title. table() stays as it is for
// the Running table of a filter and for the tests that read its columns.
const at=(ms,day)=>{if(!ms)return '';const d=new Date(ms);const hm=pad(d.getHours())+':'+pad(d.getMinutes());return ymd(d)===day?hm:pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+hm};
const CW={Lane:0,Outcome:104,Kind:132,Window:112,'Work / span':96,Tokens:104,'Ctx / arch':76,Cost:64,Worktree:96,'Launched by':184};
const ctips={Window:'Started → Ended',
  'Work / span':tips.Elapsed+'; below, Span: '+tips.Span,Tokens:'Total (In + Out); below, In / Out. In: '+tips.In+'. Out: '+tips.Out,
  'Ctx / arch':tips['Ctx max']+'; below, Arch: '+tips.Arch,Cost:tips.Cost};
function compact(rows,day){
  day=day||ymd(new Date());
  if(!rows.length)return '<div class="empty">No lanes in this period.</div>';
  const cols=Object.keys(CW),R=['Work / span','Tokens','Ctx / arch','Cost'];
  let h='<table class="cfx"><colgroup>'+cols.map(c=>'<col'+(CW[c]?' style="width:'+CW[c]+'px"':'')+'>').join('')+'</colgroup><thead><tr>'+cols.map(c=>'<th'+(R.includes(c)?' class="r"':'')+(ctips[c]?' title="'+esc(ctips[c])+'"':'')+'>'+c+'</th>').join('')+'</tr></thead><tbody>';
  const num=v=>v===null||v===undefined?'':String(v);
  for(const r of rows){
    const oc=r.outcome==='none'?'':r.outcome;
    const out=oc?pill(oc,oc==='blocked'?'blocked-o':oc):pill(r.state);
    const sp=r.live?Date.now():r.end;
    const w=r.start?dur(Math.floor(r.work/60000)):'',s=r.start&&sp?dur(Math.floor((sp-r.start)/60000)):'';
    const none=r.tokensIn===null||r.tokensIn===undefined;
    const archT=r.archOpen?'open':abbr(r.archTotal===null||r.archTotal===undefined?null:r.archTotal);
    const archTip=r.archOpen?'open'+(r.archChat?' · chat '+r.archChat:''):r.archTotal===null||r.archTotal===undefined?'n/a':'in '+r.archIn+' · out '+r.archOut+' · total '+r.archTotal+(r.archChat?' · chat '+r.archChat:'');
    const costNone=r.costUSD===null||r.costUSD===undefined;
    h+='<tr><td class="id">'+esc(r.id)+(r.title?'<span class="title">'+esc(r.title)+'</span>':'')+'</td>'+
      '<td title="'+esc('State: '+r.state+(oc?' · outcome: '+oc:''))+'">'+out+'</td>'+kindCell(r)+
      '<td class="cw" title="'+esc('Started '+(r.start?new Date(r.start).toLocaleString('en-GB'):'?')+' · Ended '+(r.end?new Date(r.end).toLocaleString('en-GB'):'?'))+'">'+esc(at(r.start,day))+(r.end?' → '+esc(at(r.end,day)):'')+'</td>'+
      '<td class="r" title="'+esc('Elapsed '+(w||'?')+' · Span '+(s||'?'))+'"><b>'+esc(w)+'</b><span class="sub">'+(s?'span '+esc(s):'')+'</span></td>'+
      '<td class="r cn" title="'+esc(none?'n/a':'In '+r.tokensIn+' · Out '+r.tokensOut+' · Total '+r.tokensTotal+' · subagents: '+(r.tokensSub||0)+' tokens')+'"><b>'+abbr(r.tokensTotal)+'</b><span class="sub">'+(none?'n/a':abbr(r.tokensIn)+' / '+abbr(r.tokensOut))+'</span></td>'+
      '<td class="r cn" title="'+esc('Ctx max '+num(r.ctxMax===null||r.ctxMax===undefined?'n/a':r.ctxMax)+' · Arch '+archTip)+'"><b>'+abbr(r.ctxMax)+'</b><span class="sub">arch '+esc(archT)+'</span></td>'+
      '<td class="r cn" title="'+esc(costNone?'':'$'+Number(r.costUSD.toFixed(6))+' · '+r.sessions+' session'+(r.sessions===1?'':'s'))+'">'+(costNone?'':esc(usd(r.costUSD)))+'</td>'+
      '<td class="lfx-cut cwt" title="'+esc(r.worktree)+'">'+esc(r.worktree)+'</td><td class="cby2" title="'+esc([(r.launcher||{}).label,r.chat].filter(Boolean).join(' · '))+'">'+launch(r)+'</td></tr>';
  }
  return h+'</tbody></table>';
}
async function tick(){
  try{
    const d=await (await fetch('/api',{cache:'no-store'})).json();
    spendByDay=d.spendByDay||{};
    const t=new Date(d.now).toLocaleTimeString('en-GB');
    const hi=Number(d.load[0])>20;
    // The sidebar's footer (P-2026-10-19-1130): spend today, the load average, the time of the last /api answer.
    document.getElementById('f-spend').textContent=d.spendByDay?daySpend(ymd(new Date()))||'$0.00':'n/a';
    document.getElementById('f-load').innerHTML=(d.load||[]).length?'<span class="'+(hi?'load-hi':'')+'">'+esc(d.load[0])+'</span> <small>'+esc(d.load.slice(1).join(' '))+'</small>':'n/a';
    document.getElementById('f-sync').textContent='synced '+t;
    document.getElementById('f-dot').className='ok-dot'+(d.stale?' stale':d.error?' down':'');
    attnTick();
    // Stale rows (a status run that failed after a success) are drawn and counted, under an amber line.
    const err=document.getElementById('err');
    err.className=d.stale?'err stale':'err';
    err.title=d.stale?d.error:'';
    err.textContent=d.stale?(/timed out/.test(d.error)?'Status timed out':'Status failed')+' at load '+d.load[0]+'; showing data from '+new Date(d.staleSince).toLocaleTimeString('en-GB')+'.':d.error||'';
    // Empty rows read "no lane" only when a status run gave them; before any success they read "loading".
    loaded=!d.error||!!d.stale;
    lastRows=d.rows;renderStrip(d.rows);renderLanes(d.rows);markLane();
    const n=d.rows.filter(r=>r.live).length;document.title=(n?'('+n+') ':'')+'Jjodel Harness Lane Management';
    refreshing=!!d.refreshing;spin();clearTimeout(again);if(refreshing)again=setTimeout(tick,2000);
  }catch(e){const err=document.getElementById('err');err.className='err';err.title='';err.textContent='lane-board unreachable: '+e.message;document.getElementById('f-dot').className='ok-dot down';refreshing=false;spin()}
}
// The Requirements count beside its view: the register's rows, read at load and every 20 refreshes (req-trace is not cheap).
async function reqCount(){try{const d=await (await fetch('/api/requirements',{cache:'no-store'})).json();const root=document.documentElement;if(root&&root.style&&d.counts)root.style.setProperty('--req-n','"'+d.counts.rows+'"')}catch(e){}}
// The theme: System follows prefers-color-scheme; Light and Dark set data-theme on <html>, remembered in localStorage.
function setTheme(t){
  const root=document.documentElement;
  if(root&&root.setAttribute){if(t==='light'||t==='dark')root.setAttribute('data-theme',t);else root.removeAttribute('data-theme')}
  document.querySelectorAll('#theme button').forEach(b=>{b.classList.toggle('on',b.dataset.th===t);b.setAttribute('aria-pressed',String(b.dataset.th===t))});
}
let theme0='system';try{const v=localStorage.getItem('laneBoardTheme');if(v==='light'||v==='dark')theme0=v}catch(e){}
setTheme(theme0);
document.getElementById('theme').addEventListener('click',e=>{const b=e.target.closest('[data-th]');if(!b)return;setTheme(b.dataset.th);try{localStorage.setItem('laneBoardTheme',b.dataset.th)}catch(e){}});
function renderOlder(rows){
  const days=[...new Set(rows.map(r=>r.day))].sort().reverse();
  const box=document.getElementById('older');
  if(!days.length){box.innerHTML='<div class="wrap"><div class="empty">No earlier lanes.</div></div>';return;}
  box.innerHTML=days.map(day=>{
    const rs=rows.filter(r=>r.day===day).sort((a,b)=>b.t-a.t||(a.id<b.id?1:a.id>b.id?-1:0));
    const tally={};rs.forEach(r=>{const o=(r.chain||r.outcome==='none')?r.state:r.outcome.split(' ')[0];tally[o]=(tally[o]||0)+1});
    const sum=Object.entries(tally).map(([k,v])=>v+' '+k).join(' · ');
    return '<details data-day="'+day+'"'+(openDays.has(day)?' open':'')+'><summary><b>'+day+'</b><span class="meta">'+rs.length+' lane'+(rs.length>1?'s':'')+' · '+esc(sum)+(daySpend(day)?' · <span title="'+esc(SPEND_TIP)+'">'+esc(daySpend(day))+'</span>':'')+'</span></summary><div class="wrap">'+compact(rs,day)+'</div></details>';
  }).join('');
  box.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{el.open?openDays.add(el.dataset.day):openDays.delete(el.dataset.day);saveOpen()}));
}
let openDays=new Set();
try{openDays=new Set(JSON.parse(localStorage.getItem('laneBoardOpenDays')||'[]'))}catch(e){}
function saveOpen(){try{localStorage.setItem('laneBoardOpenDays',JSON.stringify([...openDays]))}catch(e){}}
const VIEWS={table:'Lanes',timeline:'Timeline',insights:'Insights',requirements:'Requirements'};
function showTab(t){if(!document.getElementById('tab-'+t))t='table';document.getElementById('vt').textContent=VIEWS[t];document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));document.querySelector('main').classList.toggle('wide',t==='table');['table','timeline','insights','requirements'].forEach(k=>{document.getElementById('tab-'+k).hidden=t!==k});try{localStorage.setItem('laneBoardTab',t)}catch(e){}if(t==='timeline'&&window.TL)TL.refresh();if(t==='insights'&&window.INS)INS.refresh();if(t==='requirements'&&window.REQ)REQ.refresh()}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
let tab0='table';try{tab0=localStorage.getItem('laneBoardTab')||'table'}catch(e){}
// #lane=<id> (P-2026-10-18-2320, the /l/<id> fallback): the Lanes tab, no filter, the row scrolled to and marked
// until the next click; a lane not in the table says so in one line. The mark survives the refresh, the scroll does not repeat.
// The row is found by its Kind badge's data-id: the <tr> stays bare, as the tests that split the table on it expect.
let laneMark='',laneScroll=false;
const laneHash=()=>{const m=/^#lane=(P-\\d{4}-\\d{2}-\\d{2}-\\d{4})$/.exec((window.location||{}).hash||'');return m?m[1]:''};
function markLane(){
  const note=document.getElementById('lanenote');
  if(!laneMark){note.hidden=true;return}
  // A running lane is a card in the Lanes tab: the badge's <article> is marked as a row is.
  const b=document.querySelector('button.kb[data-id="'+laneMark+'"]'),tr=b&&(b.closest('tr')||b.closest('article'));
  note.hidden=!!tr||!loaded||!!laneFilter;note.textContent=laneMark+' is not in the lanes table.';
  if(!tr)return;
  const det=tr.closest('details');if(det&&!det.open)det.open=true;
  tr.classList.add('mark');
  if(laneScroll){laneScroll=false;tr.scrollIntoView({block:'center'})}
}
function toLane(){laneMark=laneHash();if(!laneMark)return;laneScroll=true;showTab('table');setFilter('');markLane()}
window.onhashchange=toLane;
document.body.addEventListener('click',()=>{if(!laneMark)return;laneMark='';document.querySelectorAll('tr.mark').forEach(t=>t.classList.remove('mark'));document.querySelectorAll('article.mark').forEach(t=>t.classList.remove('mark'));markLane();try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}});
showTab(tab0);
toLane();
let ticks=0;
tick();reqCount();setInterval(()=>{tick();if(++ticks%20===0)reqCount();if(!document.getElementById('tab-timeline').hidden&&window.TL)TL.refresh();if(!document.getElementById('tab-insights').hidden&&window.INS)INS.refresh();if(!document.getElementById('tab-requirements').hidden&&window.REQ)REQ.refresh()},REFRESH);
</script></body></html>`;

// Listens when run (launchd, node lane-board.mjs), also through a symlinked path, not when its tests import it.
const MAIN = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();

const server = createServer((req, res) => {
    // timeline() reads the status synchronously: before the first snapshot, the routes that call it wait for one
    // without blocking the others (refreshStatus always leaves a snapshot, so the request comes back here once).
    if (!cache.data && /^\/(api\/timeline|export\/)/.test(req.url)) { refreshStatus().then(() => server.emit('request', req, res)); return; }
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
    if (url.pathname === '/requirements.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(readTrim(join(HERE, 'requirements.js')));
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
    if (req.url === '/api/insights') {
        insights().then((d) => JSON.stringify(d), (e) => JSON.stringify({ v: 1, now: Date.now(), lanes: [], error: String(e) })).then((body) => {
            res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            res.end(body);
        });
        return;
    }
    // The menu bar app's two routes (P-2026-10-18-2320), on the pathname: a query string changes nothing.
    if (url.pathname === '/api/attention') {
        attention().then((d) => JSON.stringify(d), (e) => JSON.stringify({ v: 1, now: Date.now(), stale: false, board: 'error: ' + String(e).replace(/\s+/g, ' ').trim(), waiting: 0, blocked: 0, running: 0, staleCount: 0, staleOldest: null, items: [], runningItems: [] })).then((body) => {
            res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            res.end(body);
        });
        return;
    }
    if (url.pathname.startsWith('/l/')) {
        const id = laneLinkId(url.pathname);
        if (!id) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('not a lane link: /l/<Prompt-ID>\n'); }
        apiStatus().then((d) => (d.rows || []).some((r) => r.id === id), () => false).then((onBoard) => {
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
            res.end(laneLinkPage(id, onBoard));
        });
        return;
    }
    if (req.url === '/api') {
        apiStatus().then((d) => JSON.stringify(d), (e) => JSON.stringify({ now: Date.now(), load: [], error: String(e), rows: [] })).then((body) => {
            res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            res.end(body);
        });
        return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PAGE);
});
if (MAIN) server.listen(PORT, '127.0.0.1', () => console.log('lane-board on http://localhost:' + PORT + ' (refresh ' + REFRESH_S + ' s)'));

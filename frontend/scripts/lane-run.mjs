/**
 * lane-run.mjs: the chat's launcher for Claude Code lanes (P16, RC-20).
 *
 * Starts a lane from its committed prompt file, resumes it with a message, and
 * reports its state. It never pushes. What it keeps lives in
 * ~/.jjodel-lanes/<Prompt-ID>/; it writes in a repo only where a command below
 * says so (merge, with --launch, moves the prompt it rendered into the tree and
 * commits it alone).
 *
 *   start <worktree> <prompt-file>
 *                runs `claude -p` in <worktree> with the prompt file on stdin
 *                (the path as given, absolute or relative to the caller's
 *                directory, then relative to the worktree; refused, naming both,
 *                when neither exists), detached,
 *                the stream-json on log.jsonl; prints the log path, then the
 *                session id of the first event that carries one, which it also
 *                writes to session.txt; the prompt path goes to prompt.txt.
 *                Refused, before anything runs, when the prompt header has no
 *                `Prompt-ID: P-YYYY-MM-DD-HHmm`, and when the lane already has a
 *                session.
 *   resume <Prompt-ID> <message-file> | --text "<message>" | -
 *                `claude -p --resume <session id>` with the message on stdin, in
 *                the worktree recorded at start: a resume runs in the caller's
 *                directory otherwise (discovery report of P-2026-09-26-1640,
 *                section 5). An inline message (--text, or - for stdin) is first
 *                written to msg-<n>.md in the lane folder, so the log stays
 *                reproducible. Appends to the same log. Refused without
 *                session.txt or worktree.txt, and while a run is live.
 *   go <Prompt-ID> --smoke "<what the chat verified>" [--step <n>]
 *                resumes with the standard GO: `[<Prompt-ID>] GO.`, the smoke
 *                sentence, and step <n> of the prompt's COME (of its `### Steps`
 *                when it has one), or the closure commit when --step is absent.
 *   status <Prompt-ID> [--limit <minutes>]
 *                running, exited or blocked (running past the limit, 90 minutes
 *                by default); the exit code; the last `Outcome:` line of the
 *                assistant text in the log, a suffix after the word tolerated,
 *                `unparsed: <line>` when that line names no outcome, `none` while
 *                the lane runs (the line belongs to an earlier turn); the elapsed
 *                time of the last run.
 *   status --all [--limit <minutes>]
 *                every lane folder of ~/.jjodel-lanes in one table (id, state,
 *                outcome, elapsed), newest Prompt-ID first.
 *   wait <Prompt-ID> | --any <id,id,...> [--max <seconds>]
 *                polls every 2 s until the lane, or any of the lanes, no longer
 *                runs (exit 0, its status printed) or the deadline passes (exit
 *                0, the line `timeout: <ids> still running after <max> s`: an
 *                osascript `do shell script` drops the output of a non-zero
 *                exit). --max defaults to 170 and is refused above it: the chat's
 *                shell call ends near 180 s.
 *   probe <worktree> <probe.ts> --port <n> [--config <vite config>] [--id <Prompt-ID>]
 *                refused on port 3001 and on a port in use (lsof). Starts
 *                `npx vite --config <cfg> --port <n> --strictPort` in
 *                <worktree>/frontend, detached, waits up to 60 s for a 200 on /,
 *                runs `npx tsx <probe.ts>` there (PROBE_URL and PROBE_PORT in its
 *                environment) with both streams on probe-<name>.log in the lane
 *                folder (probe-<date> without --id), then EXIT=<code> and
 *                end=<time>; stops the process group it started, and only that,
 *                and exits with the probe's code. The default config is
 *                frontend/scripts/smoke/_tmp_lane_vite_<port>.config.ts, written
 *                when absent in the shape of the chat's _tmp_chat_vite configs.
 *   merge <branch> --into <trunk> [--at <rev>] [--chat <id>] [--launch [--governance-goahead]]
 *   merge --trunk-into <branch> [--from <trunk>] [--at <rev>] [--chat <id>] [--launch [--governance-goahead]]
 *                run from the worktree of the side that receives the merge (the
 *                trunk; the branch for --trunk-into, RC-14). Measures the merge
 *                base, `git merge-tree` conflicts, the files changed on each side
 *                and on both, the governance files changed on the branch, the
 *                commits of each side, the prompt files the branch adds and their
 *                Status, the worktrees of the two branches, and the decision rows
 *                and inbox headings each side adds (the probes). Renders
 *                lane-templates/merge-into-trunk.md (trunk-into-branch.md) with a
 *                fresh Prompt-ID, P-<today>-<HHmm>, into ~/.jjodel-lanes/pending/
 *                (a prompt file enters the tree only in the run that commits it),
 *                refused when a prompt of that minute exists there or in
 *                docs/prompts/. --at measures the trunk at <rev> instead of its
 *                tip; --from names the trunk of the mirror (default
 *                alfonso-frontend-jjtl). --launch moves the prompt into
 *                docs/prompts/, commits it alone (`Model:` trailer from
 *                JJODEL_MODEL_TRAILER, else `Model: chat via lane-run`) and starts
 *                it; it is refused, the prompt left in pending/ with the findings
 *                in its COSA, on a conflict outside docs/decisions.md and
 *                docs/log-inbox/*.md, on a governance file changed on the branch
 *                and, into the trunk, on a code file changed on both sides or a
 *                branch prompt not flipped. Not launched or refused, it prints a
 *                `by hand:` line: the cp, add, commit and start of that launch.
 *                --governance-goahead, Alfonso's yes (RC-26), lets --launch past a
 *                governance file changed on the branch and nothing else; the
 *                Findings and the commit body record it. Without --launch it
 *                reaches only the commit of the `by hand:` line.
 *
 * Every run passes `--output-format stream-json --verbose` (stream-json under -p
 * requires --verbose) and `--permission-mode bypassPermissions` (RC-19: a -p
 * session in default mode cannot commit). No --model: the pin lives in
 * .claude/settings.json only (RC-16). `claude` is looked up on the PATH, then in
 * ~/.local/bin; the child's PATH starts with the directory of the node running
 * this script, so the lane's own gates do not meet the node 16 of a bare shell.
 * LANE_RUN_NOW=YYYY-MM-DDTHH:mm stands in for the clock (the tests).
 *
 * Plain ES module, nothing outside node:*, like the hooks beside it.
 * Exit codes: 0 done, 1 the launched session failed to start (a probe's
 * server failed to serve), 2 refused; probe exits with the probe's own code.
 *
 * Run by: ~/.local/bin/node <tree>/frontend/scripts/lane-run.mjs <command> ...
 */

import { spawn, spawnSync } from 'node:child_process';
import {
    accessSync, closeSync, constants, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, statSync,
    unlinkSync, writeFileSync,
} from 'node:fs';
import { get as httpGet } from 'node:http';
import { homedir } from 'node:os';
import { basename, delimiter, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_LIMIT_MINUTES = 90;
const START_WAIT_MS = 120000;
const POLL_MS = 100;
const PROMPT_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const HEADER_PROMPT_ID = /^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/;
const OUTCOME = /^Outcome:\s*(done|hard-stop|question|blocked)\b/;
const FLAGS = ['--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions'];
const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), 'lane-templates');
const DEFAULT_TRUNK = 'alfonso-frontend-jjtl';
const GOVERNANCE = ['CLAUDE.md', 'AGENTS.md', 'docs/PROTOCOL.md', '.claude/settings.json'];
const LISTED_MAX = 40;
const SUBJECT_MAX = 72;
const WAIT_MAX_S = 170;
const WAIT_POLL_MS = 2000;
const PROBE_SERVE_MS = 60000;
const PROBE_STOP_MS = 5000;
const PROBE_POLL_MS = 250;

// The detached run: claude with the input file on stdin, stdout appended to the
// log, then its exit code written atomically, so status never reads half a file.
const WRAPPER =
    'input="$1"; log="$2"; err="$3"; code="$4"; shift 4\n' +
    'nohup "$@" < "$input" >> "$log" 2>> "$err"\n' +
    'echo $? > "$code.tmp" && mv "$code.tmp" "$code"\n';

class Refusal extends Error {}

function refuse(message) {
    throw new Refusal(message);
}

const lanesRoot = () => join(homedir(), '.jjodel-lanes');

function laneFiles(id) {
    const dir = join(lanesRoot(), id);
    return {
        dir,
        log: join(dir, 'log.jsonl'),
        err: join(dir, 'stderr.log'),
        session: join(dir, 'session.txt'),
        worktree: join(dir, 'worktree.txt'),
        pid: join(dir, 'pid.txt'),
        started: join(dir, 'started.txt'),
        exit: join(dir, 'exit.txt'),
        goahead: join(dir, 'goahead.txt'),
        prompt: join(dir, 'prompt.txt'),
    };
}

function checkId(id) {
    if (typeof id !== 'string' || !PROMPT_ID.test(id)) refuse('not a Prompt-ID (P-YYYY-MM-DD-HHmm): ' + id);
    return id;
}

/** The Prompt-ID of the header: the lines before the first `## ` heading. */
function headerPromptId(text) {
    for (const line of text.split('\n')) {
        if (line.startsWith('## ')) break;
        const m = HEADER_PROMPT_ID.exec(line);
        if (m) return m[1];
    }
    return null;
}

function isExecutable(path) {
    try {
        accessSync(path, constants.X_OK);
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

function findClaude() {
    for (const d of (process.env.PATH || '').split(delimiter)) {
        if (d && isExecutable(join(d, 'claude'))) return join(d, 'claude');
    }
    const fallback = join(homedir(), '.local', 'bin', 'claude');
    if (isExecutable(fallback)) return fallback;
    refuse('claude is neither on the PATH nor in ~/.local/bin');
}

function readTrim(path) {
    return existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
}

function isAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (err) {
        return err.code === 'EPERM';
    }
}

/** A run is live while its exit code is not written and its wrapper still exists. */
function isRunning(f) {
    return !existsSync(f.exit) && isAlive(Number(readTrim(f.pid)));
}

function launch(f, claude, cwd, input, args, goAhead = null) {
    if (existsSync(f.exit)) unlinkSync(f.exit);
    const env = { ...process.env, PATH: dirname(process.execPath) + delimiter + (process.env.PATH || '') };
    if (goAhead) env.JJODEL_CRITICAL_ZONE_GOAHEAD = goAhead;
    else delete env.JJODEL_CRITICAL_ZONE_GOAHEAD;
    const child = spawn('/bin/sh', ['-c', WRAPPER, 'lane-run', input, f.log, f.err, f.exit, claude, ...args], {
        cwd,
        env,
        detached: true,
        stdio: 'ignore',
    });
    child.unref();
    writeFileSync(f.pid, String(child.pid) + '\n');
    writeFileSync(f.started, String(Date.now()) + '\n');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Parsed events of the log from a byte offset on; a partial last line is skipped. */
function events(path, from = 0) {
    if (!existsSync(path)) return [];
    const text = readFileSync(path).subarray(from).toString('utf8');
    const out = [];
    for (const line of text.split('\n')) {
        if (line.trim() === '') continue;
        try {
            out.push(JSON.parse(line));
        } catch {
            // a line still being written
        }
    }
    return out;
}

function firstSessionId(path, from) {
    for (const e of events(path, from)) {
        if (e && typeof e.session_id === 'string' && e.session_id !== '') return e.session_id;
    }
    return null;
}

/** `--critical-zone-goahead <Prompt-ID>` (RC-30): the lane may edit the critical zone; the value must be the lane's own Prompt-ID. */
function goAheadOption(rest, id) {
    const at = rest.indexOf('--critical-zone-goahead');
    if (at === -1) return null;
    const v = rest[at + 1];
    if (!v || !PROMPT_ID.test(v)) refuse('--critical-zone-goahead needs the Prompt-ID of this lane');
    if (id && v !== id) refuse('--critical-zone-goahead ' + v + ' is not the Prompt-ID of this lane (' + id + ')');
    return v;
}

async function start(worktreeArg, promptArg, rest = []) {
    if (!worktreeArg || !promptArg) refuse('usage: lane-run start <worktree> <prompt-file> [--critical-zone-goahead <Prompt-ID>]');
    const worktree = resolve(worktreeArg);
    if (!existsSync(worktree) || !statSync(worktree).isDirectory()) refuse('not a directory: ' + worktree);
    // As given (absolute, or relative to the caller's directory), then relative to the worktree.
    const tried = [...new Set([resolve(promptArg), resolve(worktree, promptArg)])];
    const promptFile = tried.find((p) => existsSync(p) && statSync(p).isFile());
    if (!promptFile) refuse('no prompt file: tried ' + tried.join(' and '));
    const id = headerPromptId(readFileSync(promptFile, 'utf8'));
    if (!id) refuse('the prompt header has no "Prompt-ID: P-YYYY-MM-DD-HHmm" line: ' + promptFile);

    const claude = findClaude();
    const f = laneFiles(id);
    if (existsSync(f.session)) refuse(id + ' already has a session (' + readTrim(f.session) + '): use resume');
    if (isRunning(f)) refuse(id + ' is running');
    mkdirSync(f.dir, { recursive: true });
    writeFileSync(f.worktree, worktree + '\n');
    writeFileSync(f.prompt, promptFile + '\n');
    closeSync(openSync(f.log, 'a'));
    const from = statSync(f.log).size;

    const goAhead = goAheadOption(rest, id);
    if (goAhead) writeFileSync(f.goahead, goAhead + '\n');
    launch(f, claude, worktree, promptFile, ['-p', ...FLAGS], goAhead);
    console.log('prompt: ' + promptFile);
    console.log('log: ' + f.log);

    const end = Date.now() + START_WAIT_MS;
    while (Date.now() < end) {
        const session = firstSessionId(f.log, from);
        if (session) {
            writeFileSync(f.session, session + '\n');
            console.log('session: ' + session);
            return 0;
        }
        if (existsSync(f.exit)) {
            await sleep(POLL_MS);
            const late = firstSessionId(f.log, from);
            if (late) {
                writeFileSync(f.session, late + '\n');
                console.log('session: ' + late);
                return 0;
            }
            console.error('lane-run: claude exited with ' + readTrim(f.exit) + ' before any session event. stderr:');
            console.error(readTrim(f.err));
            return 1;
        }
        await sleep(POLL_MS);
    }
    console.error('lane-run: no session event after ' + START_WAIT_MS / 1000 + ' s; see lane-run status ' + id);
    return 1;
}

/** The next msg-<n>.md of the lane folder, holding the text: an inline message is kept before it runs. */
function writeMessage(f, text) {
    let n = 0;
    for (const name of readdirSync(f.dir)) {
        const m = /^msg-(\d+)\.md$/.exec(name);
        if (m) n = Math.max(n, Number(m[1]));
    }
    const path = join(f.dir, 'msg-' + (n + 1) + '.md');
    writeFileSync(path, text.endsWith('\n') ? text : text + '\n');
    return path;
}

function resume(idArg, rest) {
    const id = checkId(idArg);
    const [messageArg] = rest;
    if (!messageArg) refuse('usage: lane-run resume <Prompt-ID> <message-file> | --text "<message>" | -');
    let text = null;
    if (messageArg === '--text') text = rest[1] ?? '';
    else if (messageArg === '-') text = readFileSync(0, 'utf8');
    if (text !== null && text.trim() === '') refuse('the message is empty');
    const f = laneFiles(id);
    const session = readTrim(f.session);
    if (!session) refuse(id + ' has no session.txt: start the lane first');
    const worktree = readTrim(f.worktree);
    if (!worktree) refuse(id + ' has no worktree.txt: the lane directory is incomplete');
    if (isRunning(f)) refuse(id + ' is still running: wait for its exit before resuming');
    if (text === null && !existsSync(resolve(messageArg))) refuse('no message file: ' + resolve(messageArg));
    const claude = findClaude();
    let message;
    if (text !== null) {
        message = writeMessage(f, text);
        console.log('message: ' + message);
    } else {
        message = resolve(messageArg);
    }

    const goAhead = existsSync(f.goahead) ? readTrim(f.goahead) : null;
    launch(f, claude, worktree, message, ['-p', '--resume', session, ...FLAGS], goAhead || null);
    console.log('log: ' + f.log);
    console.log('session: ' + session);
    return 0;
}

/** The last line of the assistant text that starts with `Outcome:`, parsed or not. */
function lastOutcome(path) {
    let last = null;
    for (const e of events(path)) {
        if (!e || e.type !== 'assistant' || !e.message || !Array.isArray(e.message.content)) continue;
        for (const block of e.message.content) {
            if (!block || block.type !== 'text' || typeof block.text !== 'string') continue;
            for (const line of block.text.split('\n')) {
                if (line.trim().startsWith('Outcome:')) last = line.trim();
            }
        }
    }
    return last;
}

function limitOption(rest) {
    const at = rest.indexOf('--limit');
    if (at === -1) return DEFAULT_LIMIT_MINUTES;
    const limit = Number(rest[at + 1]);
    if (!Number.isFinite(limit) || limit < 0) refuse('--limit takes a number of minutes');
    return limit;
}

function laneState(f, limit) {
    const exited = existsSync(f.exit);
    const running = !exited && isAlive(Number(readTrim(f.pid)));
    const started = Number(readTrim(f.started));
    const stopped = exited ? statSync(f.exit).mtimeMs : Date.now();
    const elapsedMs = Number.isFinite(started) && started > 0 ? stopped - started : 0;
    let state = running ? 'running' : 'exited';
    if (running && elapsedMs > limit * 60000) state = 'blocked';
    // An Outcome line is the result of a turn: while a turn runs, the last one belongs to an earlier turn.
    return { state, exited, outcome: running ? null : lastOutcome(f.log), minutes: Math.floor(elapsedMs / 60000) };
}

function status(idArg, rest) {
    if (idArg === '--all') return statusAll(rest);
    const id = checkId(idArg);
    const limit = limitOption(rest);
    const f = laneFiles(id);
    if (!existsSync(f.dir)) refuse('no lane ' + id + ' in ' + lanesRoot());

    const s = laneState(f, limit);
    console.log('lane: ' + id);
    console.log('state: ' + s.state);
    console.log('exit: ' + (s.exited ? readTrim(f.exit) : '-'));
    console.log('outcome: ' + (s.outcome === null ? 'none' : OUTCOME.test(s.outcome) ? s.outcome : 'unparsed: ' + s.outcome));
    console.log('elapsed: ' + s.minutes + ' min, limit ' + limit + ' min');
    console.log('session: ' + (readTrim(f.session) || '-'));
    console.log('log: ' + f.log);
    return 0;
}

/** Every lane folder of ~/.jjodel-lanes in one table, newest Prompt-ID first; other folders and files are not lanes. */
function statusAll(rest) {
    const limit = limitOption(rest);
    const root = lanesRoot();
    const ids = existsSync(root) ? readdirSync(root).filter((n) => PROMPT_ID.test(n) && statSync(join(root, n)).isDirectory()) : [];
    const rows = [['id', 'state', 'outcome', 'elapsed']];
    for (const id of ids.sort().reverse()) {
        const s = laneState(laneFiles(id), limit);
        const m = s.outcome === null ? null : OUTCOME.exec(s.outcome);
        rows.push([id, s.state, s.outcome === null ? 'none' : m ? m[1] : 'unparsed', s.minutes + ' min']);
    }
    const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => r[c].length)));
    for (const r of rows) console.log(r.map((x, c) => (c === r.length - 1 ? x : x.padEnd(widths[c]))).join('  '));
    return 0;
}

// ── wait ─────────────────────────────────────────────────────────────────────

async function waitLanes(rest) {
    const any = option(rest, '--any');
    const ids = any !== null ? any.split(',').map((x) => x.trim()).filter((x) => x !== '') : [rest[0]];
    if (ids.length === 0 || (any === null && (!rest[0] || rest[0].startsWith('--')))) {
        refuse('usage: lane-run wait <Prompt-ID> | --any <id,id,...> [--max <seconds>]');
    }
    // An unknown lane never runs: status, below, refuses it at the first poll.
    ids.forEach(checkId);
    const maxArg = option(rest, '--max');
    const max = maxArg === null ? WAIT_MAX_S : Number(maxArg);
    if (!Number.isFinite(max) || max < 0) refuse('--max takes a number of seconds');
    if (max > WAIT_MAX_S) {
        refuse('--max ' + max + ' is above ' + WAIT_MAX_S + ' s: the chat\'s shell call ends near 180 s and the wait would be lost with it; call wait again');
    }
    const end = Date.now() + max * 1000;
    for (;;) {
        const ended = ids.filter((id) => !isRunning(laneFiles(id)));
        if (ended.length) {
            ended.forEach((id, i) => {
                if (i) console.log('');
                status(id, []);
            });
            return 0;
        }
        const left = end - Date.now();
        if (left <= 0) {
            // A deadline ends a poll, it is not a failure: osascript would drop the output of a non-zero exit.
            console.log('timeout: ' + ids.join(', ') + ' still running after ' + max + ' s');
            return 0;
        }
        await sleep(Math.min(WAIT_POLL_MS, left));
    }
}

// ── probe ────────────────────────────────────────────────────────────────────

/** An executable on the PATH, else the first fallback that is one; null when none is. */
function onPath(name, fallbacks = []) {
    for (const d of (process.env.PATH || '').split(delimiter)) {
        if (d && isExecutable(join(d, name))) return join(d, name);
    }
    return fallbacks.find(isExecutable) ?? null;
}

function portInUse(port) {
    const lsof = onPath('lsof', ['/usr/sbin/lsof']);
    if (!lsof) refuse('lsof is neither on the PATH nor in /usr/sbin: the port cannot be checked');
    const r = spawnSync(lsof, ['-nP', '-iTCP:' + port, '-sTCP:LISTEN'], { encoding: 'utf8' });
    return r.status === 0 && r.stdout.trim() !== '';
}

/** The status code of GET / on localhost:<port>, 0 when nothing answers. */
function httpStatus(port) {
    return new Promise((res) => {
        const req = httpGet({ host: 'localhost', port, path: '/', timeout: 2000 }, (r) => {
            r.resume();
            res(r.statusCode || 0);
        });
        req.on('timeout', () => req.destroy());
        req.on('error', () => res(0));
    });
}

/** As given (absolute, or relative to the caller's directory), then relative to the base directory. */
function existingPath(arg, base, what) {
    const tried = [...new Set([resolve(arg), resolve(base, arg)])];
    const found = tried.find((p) => existsSync(p) && statSync(p).isFile());
    if (!found) refuse('no ' + what + ': tried ' + tried.join(' and '));
    return found;
}

// The shape of the chat's _tmp_chat_vite_3005.config.ts: the base config, the
// port strict, and a cacheDir outside the tree so the tree's own server keeps its cache (P14).
const probeConfig = (port) => `// Scratch dev-server config written by lane-run probe (gitignored, _tmp_).
// Reuses vite.config.ts; port ${port}, and a cacheDir outside the tree so another
// server on the same tree keeps its .vite-cache untouched (P14).
import { defineConfig } from 'vite';
import base from '../../vite.config';

export default defineConfig((env) => {
    const b: any = typeof base === 'function' ? (base as any)(env) : base;
    return {
        ...b,
        cacheDir: '/tmp/lane-vite-cache-${port}',
        server: { ...b.server, port: ${port}, strictPort: true },
    };
});
`;

async function probe(rest) {
    const [worktreeArg, probeArg] = rest;
    const usage = 'usage: lane-run probe <worktree> <probe.ts> --port <n> [--config <vite config>] [--id <Prompt-ID>]';
    if (!worktreeArg || !probeArg || worktreeArg.startsWith('--') || probeArg.startsWith('--')) refuse(usage);
    const portArg = option(rest, '--port');
    if (portArg === null || !/^\d+$/.test(portArg) || Number(portArg) < 1 || Number(portArg) > 65535) refuse(usage);
    const port = Number(portArg);
    if (port === 3001) refuse('port 3001 is the trunk\'s dev server: pick another');
    const frontend = join(resolve(worktreeArg), 'frontend');
    if (!existsSync(frontend) || !statSync(frontend).isDirectory()) refuse('not a directory: ' + frontend);
    const probeFile = existingPath(probeArg, frontend, 'probe file');
    const idArg = option(rest, '--id');
    const folder = join(lanesRoot(), idArg !== null ? checkId(idArg) : 'probe-' + stamp(clock()).date);
    const configArg = option(rest, '--config');
    const config = configArg !== null ? existingPath(configArg, frontend, 'vite config') : join(frontend, 'scripts', 'smoke', '_tmp_lane_vite_' + port + '.config.ts');
    if (portInUse(port)) refuse('port ' + port + ' is in use (lsof): pick another');
    const npx = onPath('npx', [join(dirname(process.execPath), 'npx')]);
    if (!npx) refuse('npx is neither on the PATH nor beside ' + process.execPath);

    if (!existsSync(config)) writeFileSync(config, probeConfig(port));
    mkdirSync(folder, { recursive: true });
    const log = join(folder, 'probe-' + basename(probeFile, extname(probeFile)) + '.log');
    const env = { ...process.env, PATH: dirname(process.execPath) + delimiter + (process.env.PATH || '') };
    const viteOut = openSync(join(folder, 'vite-' + port + '.log'), 'a');
    const vite = spawn(npx, ['vite', '--config', config, '--port', String(port), '--strictPort'], {
        cwd: frontend, env, detached: true, stdio: ['ignore', viteOut, viteOut],
    });
    closeSync(viteOut);
    let viteExited = false;
    vite.on('exit', () => {
        viteExited = true;
    });
    // Only the process group this command started: vite and what npx spawned under it.
    const stopVite = () => {
        try {
            process.kill(-vite.pid, 'SIGTERM');
        } catch {
            // already gone
        }
    };
    let child = null;
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
        process.on(sig, () => {
            if (child) child.kill(sig);
            stopVite();
            process.exit(1);
        });
    }

    const end = Date.now() + PROBE_SERVE_MS;
    let served = 0;
    while (!viteExited && Date.now() < end) {
        served = await httpStatus(port);
        if (served === 200) break;
        await sleep(PROBE_POLL_MS);
    }
    if (served !== 200) {
        stopVite();
        console.error('lane-run: vite ' + (viteExited ? 'exited' : 'did not answer 200 on /') + ' before serving on ' + port + '; see ' + join(folder, 'vite-' + port + '.log'));
        return 1;
    }

    writeFileSync(log, 'probe=' + probeFile + '\nCFG=' + config + '\nurl=http://localhost:' + port + '/\nserver=200\n', { flag: 'a' });
    const out = openSync(log, 'a');
    child = spawn(npx, ['tsx', probeFile], {
        cwd: frontend,
        env: { ...env, PROBE_URL: 'http://localhost:' + port + '/', PROBE_PORT: String(port) },
        stdio: ['ignore', out, out],
    });
    const code = await new Promise((res) => {
        child.on('error', () => res(1));
        child.on('exit', (c) => res(c === null ? 1 : c));
    });
    closeSync(out);
    writeFileSync(log, 'EXIT=' + code + '\nend=' + new Date().toISOString() + '\n', { flag: 'a' });
    stopVite();
    const freeBy = Date.now() + PROBE_STOP_MS;
    while (portInUse(port) && Date.now() < freeBy) await sleep(PROBE_POLL_MS);
    if (portInUse(port)) {
        try {
            process.kill(-vite.pid, 'SIGKILL');
        } catch {
            // already gone
        }
    }
    console.log('log: ' + log);
    console.log('exit: ' + code);
    return code;
}

/** The value after a flag; null when the flag is absent, refused when its value is. */
function option(rest, name) {
    const at = rest.indexOf(name);
    if (at === -1) return null;
    const v = rest[at + 1];
    if (v === undefined || v.startsWith('--')) refuse(name + ' needs a value');
    return v;
}

// ── go ───────────────────────────────────────────────────────────────────────

/** The lane's prompt: prompt.txt, or for a lane started before it, the docs/prompts file whose header holds the id. */
function lanePrompt(f, id) {
    const recorded = readTrim(f.prompt);
    if (recorded && existsSync(recorded)) return recorded;
    const dir = join(readTrim(f.worktree), 'docs', 'prompts');
    if (existsSync(dir)) {
        for (const name of readdirSync(dir).sort()) {
            const path = join(dir, name);
            if (name.endsWith('.md') && headerPromptId(readFileSync(path, 'utf8')) === id) return path;
        }
    }
    refuse('no prompt file for ' + id + ': neither prompt.txt nor a header in ' + dir);
}

/** Step n of the COME section (of its `### Steps` when it has one), continuation lines kept. */
function comeStep(text, n) {
    const all = text.split('\n');
    const s = all.findIndex((l) => /^## COME\b/.test(l));
    if (s === -1) return null;
    let e = all.findIndex((l, i) => i > s && l.startsWith('## '));
    let body = all.slice(s + 1, e === -1 ? all.length : e);
    const steps = body.findIndex((l) => /^### Steps\b/.test(l));
    if (steps !== -1) {
        e = body.findIndex((l, i) => i > steps && l.startsWith('### '));
        body = body.slice(steps + 1, e === -1 ? body.length : e);
    }
    const at = body.findIndex((l) => l.startsWith(n + '. '));
    if (at === -1) return null;
    const out = [body[at].slice(String(n).length + 2)];
    for (let i = at + 1; i < body.length; i++) {
        const l = body[i];
        if (l.trim() === '' || /^\d+\.\s/.test(l) || l.startsWith('#')) break;
        out.push(l);
    }
    return out.join('\n');
}

function go(idArg, rest) {
    const id = checkId(idArg);
    const smoke = option(rest, '--smoke');
    if (!smoke || smoke.trim() === '') refuse('usage: lane-run go <Prompt-ID> --smoke "<what the chat verified>" [--step <n>]');
    const stepArg = option(rest, '--step');
    let next = 'Now the closure commit as the prompt says.';
    if (stepArg !== null) {
        if (!/^[1-9]\d*$/.test(stepArg)) refuse('--step takes a step number: ' + stepArg);
        const f = laneFiles(id);
        if (!existsSync(f.dir)) refuse('no lane ' + id + ' in ' + lanesRoot());
        const promptFile = lanePrompt(f, id);
        const step = comeStep(readFileSync(promptFile, 'utf8'), Number(stepArg));
        if (step === null) refuse('no step ' + stepArg + ' in the COME of ' + promptFile);
        next = 'Now step ' + stepArg + ': ' + step;
    }
    return resume(id, ['--text', '[' + id + '] GO.\n\n' + smoke.trim() + '\n\n' + next + '\n']);
}

// ── merge ────────────────────────────────────────────────────────────────────

const isUnion = (p) => p === 'docs/decisions.md' || /^docs\/log-inbox\/[^/]+\.md$/.test(p);
const isCode = (p) => !p.startsWith('docs/') && !p.endsWith('.md');
const nonEmpty = (text) => text.split('\n').filter((x) => x !== '');
const quote = (xs) => xs.map((x) => '`' + x + '`').join(', ');
const pad2 = (n) => String(n).padStart(2, '0');
/** A word for /bin/sh: bare when it holds only safe characters, else single-quoted. */
const shWord = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : "'" + s.replace(/'/g, "'\\''") + "'");

function git(cwd, args, ok = [0]) {
    const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    if (r.error) throw new Error('git ' + args[0] + ': ' + r.error.message);
    if (!ok.includes(r.status)) throw new Error('git ' + args.join(' ') + ' exited ' + r.status + ': ' + r.stderr.trim());
    return { status: r.status, out: r.stdout };
}

function commitOf(cwd, rev) {
    const r = git(cwd, ['rev-parse', '--verify', '--quiet', rev + '^{commit}'], [0, 1, 128]);
    if (r.status !== 0) refuse('not a commit: ' + rev);
    return r.out.trim();
}

const shortSha = (cwd, sha) => git(cwd, ['rev-parse', '--short=9', sha]).out.trim();

/** The local clock, or LANE_RUN_NOW=YYYY-MM-DDTHH:mm. */
function clock() {
    const v = process.env.LANE_RUN_NOW;
    if (!v) return new Date();
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
    if (!m) refuse('LANE_RUN_NOW is not YYYY-MM-DDTHH:mm: ' + v);
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

function stamp(d) {
    return { date: d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()), hhmm: pad2(d.getHours()) + pad2(d.getMinutes()) };
}

function headerStatus(text) {
    for (const line of text.split('\n')) {
        if (line.startsWith('## ')) break;
        const m = /^Status:\s*(.*)$/.exec(line);
        if (m) return m[1].trim();
    }
    return '';
}

function worktrees(cwd) {
    const out = [];
    for (const line of git(cwd, ['worktree', 'list', '--porcelain']).out.split('\n')) {
        if (line.startsWith('worktree ')) out.push({ path: line.slice('worktree '.length), branch: null });
        else if (line.startsWith('branch refs/heads/') && out.length) out[out.length - 1].branch = line.slice('branch refs/heads/'.length);
    }
    return out;
}

/** Lines a side adds since the base, with the file each belongs to. */
function addedLines(cwd, base, tip, paths) {
    const out = [];
    let file = null;
    for (const l of git(cwd, ['diff', '-U0', '--no-color', '--no-ext-diff', base, tip, '--', ...paths]).out.split('\n')) {
        if (l.startsWith('+++ ')) file = l.startsWith('+++ b/') ? l.slice(6) : null;
        else if (l.startsWith('+') && file) out.push({ file, text: l.slice(1) });
    }
    return out;
}

/** The decision rows and inbox headings each side adds, each to be found once after the merge; the next row id of the series is the control. */
function mergeProbes(cwd, base, sides) {
    const rows = new Map();
    const headings = new Map();
    for (const [side, tip] of sides) {
        for (const a of addedLines(cwd, base, tip, ['docs/decisions.md', 'docs/log-inbox/'])) {
            const row = a.file === 'docs/decisions.md' ? /^- \*\*((?:R|RC)(?:-[A-Z]+)*-\d+)\*\*/.exec(a.text) : null;
            const map = row ? rows : /^##/.test(a.text) ? headings : null;
            if (!map) continue;
            const key = row ? row[1] : a.file + '\n' + a.text;
            map.set(key, map.has(key) && map.get(key).side !== side ? { ...map.get(key), side: 'both sides' } : { file: a.file, text: a.text, side });
        }
    }
    const out = [];
    if (rows.size) {
        const ids = [...rows.keys()];
        const series = ids[ids.length - 1].replace(/-\d+$/, '');
        const re = new RegExp('^- \\*\\*' + series + '-(\\d+)\\*\\*', 'gm');
        let max = 0;
        for (const [, tip] of sides) {
            const r = git(cwd, ['show', tip + ':docs/decisions.md'], [0, 128]);
            for (const m of r.status === 0 ? r.out.matchAll(re) : []) max = Math.max(max, Number(m[1]));
        }
        out.push('`docs/decisions.md`, each row once, counted on `- **<id>**`: ' +
            ids.map((id) => '`' + id + '` (' + rows.get(id).side + ')').join(', ') +
            '; control: `- **' + series + '-' + (max + 1) + '**` none.');
    }
    for (const h of headings.values()) out.push('`' + h.file + '`: the heading `' + h.text + '` once (' + h.side + ').');
    return out;
}

function measureMerge(cwd, o) {
    const trunkTip = commitOf(cwd, o.at || o.trunk);
    const branchTip = commitOf(cwd, o.branch);
    const mb = git(cwd, ['merge-base', trunkTip, branchTip], [0, 1]);
    if (mb.status !== 0) refuse(o.branch + ' and ' + o.trunk + ' have no merge base');
    const base = mb.out.trim();
    const pair = o.mode === 'into' ? [trunkTip, branchTip] : [branchTip, trunkTip];
    const mt = git(cwd, ['merge-tree', '--write-tree', '--name-only', '--no-messages', ...pair], [0, 1]);
    const conflicts = mt.status === 0 ? [] : [...new Set(nonEmpty(mt.out).slice(1))];
    const branchFiles = nonEmpty(git(cwd, ['diff', '--name-only', base, branchTip]).out);
    const trunkFiles = nonEmpty(git(cwd, ['diff', '--name-only', base, trunkTip]).out);
    const log = (tip) => nonEmpty(git(cwd, ['log', '--format=%h %s', '--abbrev=9', base + '..' + tip]).out);
    const prompts = nonEmpty(git(cwd, ['diff', '--name-only', '--diff-filter=A', base, branchTip, '--', 'docs/prompts/']).out).map((path) => {
        const status = headerStatus(git(cwd, ['show', branchTip + ':' + path]).out);
        return { name: basename(path), status, done: /^eseguito\b/.test(status) };
    });
    const lastMerge = (tip) => git(cwd, ['log', '--merges', '-1', '--format=%h', '--abbrev=9', tip]).out.trim();
    let precedent = { sha: lastMerge(o.mode === 'into' ? trunkTip : branchTip), on: o.mode === 'into' ? o.trunk : o.branch };
    if (!precedent.sha && o.mode !== 'into') precedent = { sha: lastMerge(trunkTip), on: o.trunk };
    return {
        trunkTip, branchTip, base, conflicts, branchFiles, trunkFiles,
        both: branchFiles.filter((p) => trunkFiles.includes(p)),
        governance: nonEmpty(git(cwd, ['diff', '--name-only', base, branchTip, '--', ...GOVERNANCE]).out),
        branchCommits: log(branchTip),
        trunkCommits: log(trunkTip),
        prompts,
        precedent,
        worktrees: worktrees(cwd),
        probes: mergeProbes(cwd, base, [['branch', branchTip], ['trunk', trunkTip]]),
        short: { trunk: shortSha(cwd, trunkTip), branch: shortSha(cwd, branchTip), base: shortSha(cwd, base) },
    };
}

/** What refuses --launch, measured: stated in the prompt's COSA as well. A governance go-ahead lifts the governance finding only. */
function mergeFindings(m, o, liftGovernance = false) {
    const out = [];
    const hard = m.conflicts.filter((p) => !isUnion(p));
    if (hard.length) out.push('a conflict the union rule does not cover: ' + quote(hard));
    if (m.governance.length && !liftGovernance) out.push('governance files changed on the branch: ' + quote(m.governance));
    if (o.mode === 'into') {
        const code = m.both.filter(isCode);
        if (code.length) {
            out.push('code files changed on both sides since the base; RC-14, the branch takes the trunk first (`lane-run merge --trunk-into ' +
                o.branch + '`): ' + quote(code));
        }
        const open = m.prompts.filter((p) => !p.done);
        if (open.length) out.push('branch prompts whose Status is not eseguito: ' + open.map((p) => '`' + p.name + '` (' + (p.status || 'no Status line') + ')').join(', '));
    }
    return out;
}

function render(name, values) {
    const text = readFileSync(join(TEMPLATES, name), 'utf8').replace(/\{\{(\w+)\}\}/g, (all, key) => {
        if (!(key in values)) throw new Error('template ' + name + ' has no value for ' + all);
        return values[key];
    });
    if (text.includes('{{')) throw new Error('template ' + name + ' holds a malformed placeholder');
    return text.replace(/\n{3,}/g, '\n\n');
}

function mergeValues(m, o, id, when, findings, goahead = null) {
    const into = o.mode === 'into';
    const where = (b) => {
        const paths = m.worktrees.filter((w) => w.branch === b).map((w) => '`' + w.path + '`');
        return paths.length ? paths.join(' and ') : 'no worktree';
    };
    const commits = (xs, tip) => {
        if (!xs.length) return '- none';
        const shown = xs.slice(0, LISTED_MAX).map((l) => '- `' + l.slice(0, l.indexOf(' ')) + '` ' + l.slice(l.indexOf(' ') + 1));
        if (xs.length > LISTED_MAX) shown.push('- and ' + (xs.length - LISTED_MAX) + ' more: `git log --oneline ' + m.short.base + '..' + tip + '`');
        return shown.join('\n');
    };
    const count = (n) => n + (n === 1 ? ' commit' : ' commits');
    const conflicts = m.conflicts.length ? m.conflicts.length + (m.conflicts.length === 1 ? ' conflict: ' : ' conflicts: ') + quote(m.conflicts) : 'zero conflicts';
    const head = into ? 'merge: ' + o.branch + ' into ' + o.trunk : 'merge: ' + o.branch + ' takes ' + o.trunk;
    const subject = (head.length <= SUBJECT_MAX ? head : into ? 'merge: ' + o.branch : 'merge: ' + o.branch + ' takes the trunk') + ' (' + id + ')';
    return {
        promptId: id,
        chat: o.chat || '—',
        branch: o.branch,
        trunk: o.trunk,
        laneNote: m.conflicts.length ? conflicts + ' measured' : 'zero conflicts measured',
        trunkWorktree: into ? o.top : where(o.trunk),
        branchWorktree: into ? where(o.branch) : o.top,
        trunkTip: m.short.trunk,
        branchTip: m.short.branch,
        base: m.short.base,
        precedent: m.precedent.sha
            ? 'in the shape of `' + m.precedent.sha + '` (the last merge commit on `' + m.precedent.on + '`; read its body first)'
            : 'in the shape of the prompts named in RIFERIMENTI (no merge commit on `' + m.precedent.on + '` to copy)',
        branchCommitCount: count(m.branchCommits.length),
        trunkCommitCount: count(m.trunkCommits.length),
        branchCommits: commits(m.branchCommits, m.short.branch),
        trunkCommits: commits(m.trunkCommits, m.short.trunk),
        measuredAt: when,
        conflicts,
        branchFileCount: String(m.branchFiles.length),
        trunkFileCount: String(m.trunkFiles.length),
        bothSides: m.both.length ? quote(m.both) : 'none',
        governance: m.governance.length ? quote(m.governance) : 'empty',
        branchPrompts: m.prompts.length ? m.prompts.map((p) => '`' + p.name + '` (' + (p.status || 'no Status line') + ')').join(', ') : 'none',
        worktrees: '`' + o.branch + '` in ' + where(o.branch) + '; `' + o.trunk + '` in ' + where(o.trunk),
        findings: [
            findings.length ? '**Findings.** `lane-run merge` refuses `--launch` on this measurement:\n\n' + findings.map((x) => '- ' + x).join('\n') : '',
            goahead
                ? '**Findings.** governance files changed on the branch: ' + quote(m.governance) + "; launch allowed by Alfonso's yes (`--governance-goahead`, " + goahead + ')'
                : '',
        ].filter((x) => x !== '').join('\n\n'),
        probes: (m.probes.length ? m.probes : ['none: neither side adds a decision row or an inbox heading since the base.']).map((x) => '   - ' + x).join('\n'),
        mergeSubject: subject,
    };
}

function parseMerge(rest) {
    const o = { launch: false, governanceGoahead: false };
    const positional = [];
    const valued = { '--into': 'into', '--trunk-into': 'trunkInto', '--from': 'from', '--at': 'at', '--chat': 'chat' };
    const usage = 'usage: lane-run merge <branch> --into <trunk> | merge --trunk-into <branch> [--from <trunk>], with [--at <rev>] [--chat <id>] [--launch [--governance-goahead]]';
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === '--launch') o.launch = true;
        else if (a === '--governance-goahead') o.governanceGoahead = true;
        else if (a.startsWith('--governance-goahead=')) refuse('--governance-goahead takes no value; ' + usage);
        else if (a in valued) {
            o[valued[a]] = option(rest.slice(i), a);
            i++;
        } else if (a.startsWith('--')) refuse('unknown option for merge: ' + a);
        else positional.push(a);
    }
    if (o.trunkInto) {
        if (positional.length || o.into) refuse(usage);
        return { ...o, mode: 'trunk-into', branch: o.trunkInto, trunk: o.from || DEFAULT_TRUNK };
    }
    if (positional.length !== 1 || !o.into || o.from) refuse(usage);
    return { ...o, mode: 'into', branch: positional[0], trunk: o.into };
}

function modelTrailer() {
    const v = (process.env.JJODEL_MODEL_TRAILER || '').trim();
    if (!v) return 'Model: chat via lane-run';
    return v.startsWith('Model:') ? v : 'Model: ' + v;
}

async function merge(rest) {
    const o = parseMerge(rest);
    const here = process.cwd();
    const top = git(here, ['rev-parse', '--show-toplevel'], [0, 128]);
    if (top.status !== 0) refuse('not inside a git worktree: ' + here);
    o.top = top.out.trim();
    for (const b of [o.branch, o.trunk]) {
        if (git(o.top, ['rev-parse', '--verify', '--quiet', 'refs/heads/' + b], [0, 1, 128]).status !== 0) refuse('no local branch ' + b);
    }
    const receiver = o.mode === 'into' ? o.trunk : o.branch;
    const current = git(o.top, ['branch', '--show-current']).out.trim();
    if (current !== receiver) {
        refuse('run ' + (o.mode === 'into' ? 'merge --into' : 'merge --trunk-into') + ' from the worktree of ' + receiver + ' (RC-14); ' + o.top + ' is on ' + (current || 'a detached HEAD'));
    }

    const d = clock();
    const { date, hhmm } = stamp(d);
    const id = 'P-' + date + '-' + hhmm;
    const dir = join(o.top, 'docs', 'prompts');
    const pending = join(lanesRoot(), 'pending');
    const taken = [dir, pending].flatMap((x) => (existsSync(x) ? readdirSync(x) : [])).filter((n) => n.startsWith('claude_' + date + '_' + hhmm + '_'));
    if (taken.length) refuse(id + ' is taken by ' + taken.join(', ') + ': run again in the next minute');
    if (existsSync(laneFiles(id).dir)) refuse(id + ' already has a lane folder in ' + lanesRoot());

    const m = measureMerge(o.top, o);
    const when = date + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    // Alfonso's yes on a governance change: lifted only by a launch; the by-hand commit records it all the same.
    const goahead = o.governanceGoahead && m.governance.length ? when : null;
    const findings = mergeFindings(m, o, Boolean(o.launch && goahead));
    const slug = o.branch.replace(/[^A-Za-z0-9._-]+/g, '-');
    const file = join(dir, 'claude_' + date + '_' + hhmm + (o.mode === 'into' ? '_prompt_merge_' + slug : '_prompt_' + slug + '_take_trunk') + '.md');
    const parked = join(pending, basename(file));
    const values = mergeValues(m, o, id, when, findings, o.launch ? goahead : null);
    const text = render(o.mode === 'into' ? 'merge-into-trunk.md' : 'trunk-into-branch.md', values);
    mkdirSync(pending, { recursive: true });
    writeFileSync(parked, text);

    const plain = (xs) => (xs.length ? xs.join(', ') : 'none');
    const where = (b) => b + ' in ' + plain(m.worktrees.filter((w) => w.branch === b).map((w) => w.path));
    console.log('mode: ' + (o.mode === 'into' ? o.branch + ' into ' + o.trunk : o.trunk + ' into ' + o.branch));
    console.log('trunk: ' + o.trunk + ' at ' + m.short.trunk);
    console.log('branch: ' + o.branch + ' at ' + m.short.branch);
    console.log('base: ' + m.short.base);
    console.log('conflicts: ' + (m.conflicts.length ? m.conflicts.length + ': ' + m.conflicts.join(', ') : 'none'));
    console.log('files: ' + m.branchFiles.length + ' on the branch side, ' + m.trunkFiles.length + ' on the trunk side; both sides: ' + plain(m.both));
    console.log('governance: ' + (m.governance.length ? 'changed on the branch: ' + m.governance.join(', ') : 'unchanged on the branch'));
    console.log('branch commits: ' + m.branchCommits.length);
    console.log('trunk commits: ' + m.trunkCommits.length);
    console.log('branch prompts: ' + plain(m.prompts.map((p) => p.name + ' ' + (p.done ? 'eseguito' : p.status || 'no Status line'))).replace(/, /g, '; '));
    console.log('worktrees: ' + where(o.branch) + '; ' + where(o.trunk));
    console.log('probes: ' + m.probes.length);
    console.log('Prompt-ID: ' + id);
    console.log('prompt: ' + parked);

    const refusals = findings.map((x) => x.replace(/`/g, ''));
    if (o.at && o.mode === 'into' && commitOf(o.top, o.trunk) !== m.trunkTip) {
        refusals.push('--at ' + o.at + ' is not the tip of ' + o.trunk + ': a launched merge starts from the trunk tip');
    }
    const rel = relative(o.top, file);
    const message = ['docs: add prompt ' + id + ', merge ' + (o.mode === 'into' ? o.branch + ' into ' + o.trunk : o.trunk + ' into ' + o.branch), modelTrailer()];
    if (goahead) message.push("Governance go-ahead: Alfonso's yes, " + goahead + ' (--governance-goahead).');
    const byHand = 'by hand: cp ' + shWord(parked) + ' ' + shWord(file) + ' && git -C ' + shWord(o.top) + ' add -- ' + shWord(rel) +
        ' && git -C ' + shWord(o.top) + ' commit ' + message.map((x) => '-m ' + shWord(x)).join(' ') + ' -- ' + shWord(rel) +
        ' && lane-run start ' + shWord(o.top) + ' ' + shWord(rel);
    if (!o.launch) {
        console.log('launch: not requested' + (refusals.length ? '; it would be refused: ' + refusals.join('; ') : ''));
        console.log(byHand);
        return 0;
    }
    if (refusals.length) {
        console.log('launch: refused');
        console.log(byHand);
        refuse('launch refused: ' + refusals.join('; '));
    }
    mkdirSync(dir, { recursive: true });
    copyFileSync(parked, file);
    unlinkSync(parked);
    git(o.top, ['add', '--', rel]);
    git(o.top, ['commit', '-q', ...message.flatMap((x) => ['-m', x]), '--', rel]);
    console.log('launch: committed ' + shortSha(o.top, 'HEAD'));
    return start(o.top, file);
}

async function main(argv) {
    const [command, ...rest] = argv;
    if (command === 'start') return start(rest[0], rest[1], rest.slice(2));
    if (command === 'resume') return resume(rest[0], rest.slice(1));
    if (command === 'go') return go(rest[0], rest.slice(1));
    if (command === 'status') return status(rest[0], rest.slice(1));
    if (command === 'merge') return merge(rest);
    if (command === 'wait') return waitLanes(rest);
    if (command === 'probe') return probe(rest);
    refuse('usage: lane-run start <worktree> <prompt-file> | resume <Prompt-ID> <message-file>|--text "<message>"|- | ' +
        'go <Prompt-ID> --smoke "<text>" [--step <n>] | status <Prompt-ID> [--limit <minutes>] | ' +
        'merge <branch> --into <trunk> | merge --trunk-into <branch> [--from <trunk>] | ' +
        'wait <Prompt-ID>|--any <ids> [--max <s>] | probe <worktree> <probe.ts> --port <n>');
}

main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
        console.error('lane-run: ' + (err && err.message ? err.message : String(err)));
        process.exit(err instanceof Refusal ? 2 : 1);
    },
);

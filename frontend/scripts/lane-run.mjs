/**
 * lane-run.mjs: the chat's launcher for Claude Code lanes (P16, RC-20).
 *
 * Starts a lane from its committed prompt file, resumes it with a message file,
 * and reports its state. It never commits, never pushes and never writes in a
 * repo: everything it keeps lives in ~/.jjodel-lanes/<Prompt-ID>/.
 *
 *   start <worktree> <prompt-file>
 *                runs `claude -p` in <worktree> with the prompt file on stdin
 *                (a relative prompt path is read from the worktree), detached,
 *                the stream-json on log.jsonl; prints the log path, then the
 *                session id of the first event that carries one, which it also
 *                writes to session.txt. Refused, before anything runs, when the
 *                prompt header has no `Prompt-ID: P-YYYY-MM-DD-HHmm`, and when
 *                the lane already has a session.
 *   resume <Prompt-ID> <message-file>
 *                `claude -p --resume <session id>` with the message file on
 *                stdin, in the worktree recorded at start: a resume runs in the
 *                caller's directory otherwise (discovery report of
 *                P-2026-09-26-1640, section 5). Appends to the same log. Refused
 *                without session.txt or worktree.txt, and while a run is live.
 *   status <Prompt-ID> [--limit <minutes>]
 *                running, exited or blocked (running past the limit, 90 minutes
 *                by default); the exit code; the last `Outcome:` line of the
 *                assistant text in the log; the elapsed time of the last run.
 *
 * Every run passes `--output-format stream-json --verbose` (stream-json under -p
 * requires --verbose) and `--permission-mode bypassPermissions` (RC-19: a -p
 * session in default mode cannot commit). No --model: the pin lives in
 * .claude/settings.json only (RC-16). `claude` is looked up on the PATH, then in
 * ~/.local/bin; the child's PATH starts with the directory of the node running
 * this script, so the lane's own gates do not meet the node 16 of a bare shell.
 *
 * Plain ES module, nothing outside node:*, like the hooks beside it.
 * Exit codes: 0 done, 1 the launched session failed to start, 2 refused.
 *
 * Run by: ~/.local/bin/node <tree>/frontend/scripts/lane-run.mjs <command> ...
 */

import { spawn } from 'node:child_process';
import {
    accessSync, closeSync, constants, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';

const DEFAULT_LIMIT_MINUTES = 90;
const START_WAIT_MS = 120000;
const POLL_MS = 100;
const PROMPT_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const HEADER_PROMPT_ID = /^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/;
const OUTCOME = /^Outcome: (done|hard-stop|question|blocked)\s*$/;
const FLAGS = ['--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions'];

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
    const promptFile = resolve(worktree, promptArg);
    if (!existsSync(promptFile)) refuse('no prompt file: ' + promptFile);
    const id = headerPromptId(readFileSync(promptFile, 'utf8'));
    if (!id) refuse('the prompt header has no "Prompt-ID: P-YYYY-MM-DD-HHmm" line: ' + promptFile);

    const claude = findClaude();
    const f = laneFiles(id);
    if (existsSync(f.session)) refuse(id + ' already has a session (' + readTrim(f.session) + '): use resume');
    if (isRunning(f)) refuse(id + ' is running');
    mkdirSync(f.dir, { recursive: true });
    writeFileSync(f.worktree, worktree + '\n');
    closeSync(openSync(f.log, 'a'));
    const from = statSync(f.log).size;

    const goAhead = goAheadOption(rest, id);
    if (goAhead) writeFileSync(f.goahead, goAhead + '\n');
    launch(f, claude, worktree, promptFile, ['-p', ...FLAGS], goAhead);
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

function resume(idArg, messageArg) {
    const id = checkId(idArg);
    if (!messageArg) refuse('usage: lane-run resume <Prompt-ID> <message-file>');
    const f = laneFiles(id);
    const session = readTrim(f.session);
    if (!session) refuse(id + ' has no session.txt: start the lane first');
    const worktree = readTrim(f.worktree);
    if (!worktree) refuse(id + ' has no worktree.txt: the lane directory is incomplete');
    if (isRunning(f)) refuse(id + ' is still running: wait for its exit before resuming');
    const message = resolve(messageArg);
    if (!existsSync(message)) refuse('no message file: ' + message);
    const claude = findClaude();

    const goAhead = existsSync(f.goahead) ? readTrim(f.goahead) : null;
    launch(f, claude, worktree, message, ['-p', '--resume', session, ...FLAGS], goAhead || null);
    console.log('log: ' + f.log);
    console.log('session: ' + session);
    return 0;
}

function lastOutcome(path) {
    let last = null;
    for (const e of events(path)) {
        if (!e || e.type !== 'assistant' || !e.message || !Array.isArray(e.message.content)) continue;
        for (const block of e.message.content) {
            if (!block || block.type !== 'text' || typeof block.text !== 'string') continue;
            for (const line of block.text.split('\n')) {
                if (OUTCOME.test(line.trim())) last = line.trim();
            }
        }
    }
    return last;
}

function status(idArg, rest) {
    const id = checkId(idArg);
    let limit = DEFAULT_LIMIT_MINUTES;
    const at = rest.indexOf('--limit');
    if (at !== -1) {
        limit = Number(rest[at + 1]);
        if (!Number.isFinite(limit) || limit < 0) refuse('--limit takes a number of minutes');
    }
    const f = laneFiles(id);
    if (!existsSync(f.dir)) refuse('no lane ' + id + ' in ' + lanesRoot());

    const exited = existsSync(f.exit);
    const running = !exited && isAlive(Number(readTrim(f.pid)));
    const started = Number(readTrim(f.started));
    const stopped = exited ? statSync(f.exit).mtimeMs : Date.now();
    const elapsedMs = Number.isFinite(started) && started > 0 ? stopped - started : 0;
    let state = running ? 'running' : 'exited';
    if (running && elapsedMs > limit * 60000) state = 'blocked';

    console.log('lane: ' + id);
    console.log('state: ' + state);
    console.log('exit: ' + (exited ? readTrim(f.exit) : '-'));
    console.log('outcome: ' + (lastOutcome(f.log) || 'none'));
    console.log('elapsed: ' + Math.floor(elapsedMs / 60000) + ' min, limit ' + limit + ' min');
    console.log('session: ' + (readTrim(f.session) || '-'));
    console.log('log: ' + f.log);
    return 0;
}

async function main(argv) {
    const [command, ...rest] = argv;
    if (command === 'start') return start(rest[0], rest[1], rest.slice(2));
    if (command === 'resume') return resume(rest[0], rest[1]);
    if (command === 'status') return status(rest[0], rest.slice(1));
    refuse('usage: lane-run start <worktree> <prompt-file> | resume <Prompt-ID> <message-file> | status <Prompt-ID> [--limit <minutes>]');
}

main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
        console.error('lane-run: ' + (err && err.message ? err.message : String(err)));
        process.exit(err instanceof Refusal ? 2 : 1);
    },
);

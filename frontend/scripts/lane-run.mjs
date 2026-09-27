/**
 * lane-run.mjs: the chat's launcher for Claude Code lanes (P16, RC-20).
 *
 * Starts a lane from its committed prompt file, resumes it with a message, and
 * reports its state. It never pushes. What it keeps lives in
 * ~/.jjodel-lanes/<Prompt-ID>/; it writes in a repo only where a command below
 * says so (merge, with --launch, moves the prompt it rendered into the tree and
 * commits it alone).
 *
 *   start <worktree> <prompt-file> [--critical-zone-goahead <Prompt-ID>] [--tier heavy|light]
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
 *   go <Prompt-ID> --smoke "<what the chat verified>" [--step <n>] [--front <inbox>]
 *                resumes with the standard GO: `[<Prompt-ID>] GO.`, the smoke
 *                sentence, and step <n> of the prompt's COME (of its `### Steps`
 *                when it has one), or the closure commit when --step is absent.
 *                On a direct merge (merge --direct) there is no session: go
 *                writes the closure itself, one docs commit that flips the merge
 *                prompt's Status (the smoke sentence in parentheses) and appends
 *                the P9 entry, generated from git and result.json, to the one
 *                inbox the branch adds headings to (--front <name> when it
 *                writes several); refused on a blocked merge and on a second go.
 *   status <Prompt-ID> [--limit <minutes>]
 *                running, exited or blocked (running past the limit, 90 minutes
 *                by default); the exit code; the last `Outcome:` line of the
 *                assistant text in the log, a suffix after the word tolerated,
 *                `unparsed: <line>` when that line names no outcome, `none` while
 *                the lane runs (the line belongs to an earlier turn); the elapsed
 *                time of the last run. Once the lane has exited, a warning line
 *                for each discovery report it wrote (its log's Write and Edit
 *                calls, else the commits carrying its Prompt-ID) whose brief, `## 0.
 *                Answer in brief`, is missing, not the first section, or above 40
 *                lines (P16).
 *   status --all [--limit <minutes>]
 *                every lane folder of ~/.jjodel-lanes in one table (id, state,
 *                outcome, elapsed), newest Prompt-ID first; a chain is one row,
 *                its position in the outcome column, its lanes not listed apart.
 *   status <chain-id>
 *                a chain: state (running, done, stopped, lost when its
 *                supervisor died), position, lanes, the merge after, where it
 *                stopped and why.
 *   wait <Prompt-ID> | --any <id,id,...> [--max <seconds>]
 *                (a chain id waits for the chain) polls every 2 s until the lane,
 *                or any of the lanes, no longer runs (exit 0, its status printed) or the deadline passes (exit
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
 *   merge ... --direct [--launch]
 *                the same measurement, and when every precondition holds (no
 *                conflict outside the union files, each union hunk a pure
 *                insertion, governance unchanged on the branch, no code file
 *                changed on both sides, every branch prompt at Status: eseguito,
 *                every probe once on the resolved merge, the receiving tree
 *                clean, no MERGE_HEAD, no lane running in it, the incoming
 *                side's worktree at its tip when it changes test files) the
 *                script merges without a session: it commits the prompt alone,
 *                tags pre-<branch> on the trunk tip (into the trunk, RC-31;
 *                pre-<branch>-<Prompt-ID> when taken), and starts a detached
 *                worker (direct-run) that runs the gates of the template on the
 *                receiving tip, merges --no-ff, resolves the union files, commits
 *                with the template's subject and a measured body, runs the gates
 *                on the merge, and writes result.json, a synthetic `Outcome:
 *                hard-stop` (or `blocked` on a red gate, the merge commit left in
 *                place) in log.jsonl and exit.txt, so status and wait read it as
 *                a lane. A failed precondition falls back, saying why: the
 *                rendered prompt is launched with --launch, parked without.
 *   chain <worktree> <prompt-1> [<prompt-2> ...] [--merge-after [--into <trunk>]] [--limit <minutes>] [--chat <id>] [--tier heavy|light]
 *                validates every prompt (a header Prompt-ID, no id twice, no lane
 *                folder yet; one in the tree committed, one outside it not yet in
 *                docs/prompts/), writes ~/.jjodel-lanes/chain-<first Prompt-ID>/
 *                chain.json and starts a detached supervisor (chain-run, nohup)
 *                that runs the lanes one after the other in <worktree>: a prompt
 *                outside the tree is committed alone at its launch (its copy in
 *                pending/ removed), and the next lane starts only on `Outcome:
 *                done` with exit 0. Any other outcome, a non-zero exit, a lane
 *                past the limit (90 minutes by default, the lane left running),
 *                tracked changes before the next commit, or a stop request stops
 *                the chain, chain.json naming the lane and the reason, the rest
 *                left queued and parked. --merge-after ends a finished chain with
 *                `merge <branch> --into <trunk> --direct` run in the trunk's
 *                worktree (default alfonso-frontend-jjtl); a fallback is parked,
 *                never launched.
 *   chain --stop <chain-id>
 *                the chain stops after its running lane, which runs to its end.
 *
 * Every run passes `--output-format stream-json --verbose` (stream-json under -p
 * requires --verbose) and `--permission-mode bypassPermissions` (RC-19: a -p
 * session in default mode cannot commit). The model follows the activity
 * (RC-32, amending RC-16): a heavy lane passes no --model and runs the pin of
 * .claude/settings.json; a light lane passes --model LIGHT_MODEL. start picks the
 * tier from the prompt's header and DOVE and from the command, never from free
 * text (tierRule, below; heavy when in doubt), prints it, and writes it to
 * tier.txt; --tier heavy|light on start, merge --launch and chain overrides it,
 * light refused where the rule forces heavy. A resume passes no --model: the
 * session keeps its own (measured, report of P-2026-09-27-2330, 7.1). `claude` is
 * looked up on the PATH, then in
 * ~/.local/bin; the child's PATH starts with the directory of the node running
 * this script, so the lane's own gates do not meet the node 16 of a bare shell.
 * LANE_RUN_NOW=YYYY-MM-DDTHH:mm stands in for the clock (the tests), and
 * LANE_RUN_NPM for the npm of the gates (else the one beside this node), and
 * LANE_RUN_LIGHT_MODEL for LIGHT_MODEL (empty or `null`: no light model).
 *
 * Plain ES module, nothing outside node:*, like the hooks beside it.
 * Exit codes: 0 done, 1 the launched session failed to start (a probe's
 * server failed to serve), 2 refused; probe exits with the probe's own code.
 *
 * Run by: ~/.local/bin/node <tree>/frontend/scripts/lane-run.mjs <command> ...
 */

import { spawn, spawnSync } from 'node:child_process';
import {
    accessSync, closeSync, constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync,
    realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { get as httpGet } from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { basename, delimiter, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CRITICAL_FILES } from './hooks/critical-zone.mjs';

// Model by activity (RC-32). heavy: the pin of .claude/settings.json, no --model (RC-16).
// light: LIGHT_MODEL, set by the owner chat under RC-32; null runs every lane heavy.
const LIGHT_MODEL = 'claude-sonnet-5';
const TIERS = ['heavy', 'light'];

const DEFAULT_LIMIT_MINUTES = 90;
const START_WAIT_MS = 120000;
const POLL_MS = 100;
const PROMPT_ID = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const HEADER_PROMPT_ID = /^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/;
const OUTCOME = /^Outcome:\s*(done|hard-stop|question|blocked)\b/;
const FLAGS = ['--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions'];
const SELF = fileURLToPath(import.meta.url);
const TEMPLATES = join(dirname(SELF), 'lane-templates');
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
        tier: join(dir, 'tier.txt'),
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

// ── the model tier (RC-32) ───────────────────────────────────────────────────

/** The names that put a prompt in the critical zone: the six files of CLAUDE.md 3.2 (the hook's list) and rule 14's two. */
const CRITICAL_NAMES = [...CRITICAL_FILES.map((p) => basename(p)), 'DV.tsx', 'defaultViewTemplate.ts'];

/** The header of a prompt (the lines before its first `## `) and its DOVE section, null when it has none. */
function promptParts(text) {
    const lines = text.split('\n');
    const first = lines.findIndex((l) => l.startsWith('## '));
    const header = (first === -1 ? lines : lines.slice(0, first)).join('\n');
    const s = lines.findIndex((l) => /^## DOVE\b/.test(l));
    if (s === -1) return { header, dove: null };
    const e = lines.findIndex((l, i) => i > s && l.startsWith('## '));
    return { header, dove: lines.slice(s + 1, e === -1 ? lines.length : e).join('\n') };
}

/**
 * The paths DOVE writes, read strictly (answer 9 of the report of
 * P-2026-09-27-2330): backticked paths of the tree, under frontend/, docs/,
 * scripts/ or .claude/, or a governance file; a gitignored probe (`_tmp_`) and a
 * path outside the tree (`~/...`) are not writes.
 */
function doveTargets(dove) {
    return [...dove.matchAll(/`([^`\s]+)`/g)].map((m) => m[1])
        .filter((p) => /^(frontend|docs|scripts|\.claude)\//.test(p) || GOVERNANCE.includes(p))
        .filter((p) => !p.includes('_tmp_'));
}

/**
 * The rule of RC-32: the tier a prompt runs, whether the rule forces it, and
 * why, from the header, DOVE and the command, never from free text. Forced
 * heavy: the critical-zone go-ahead, a merge session, the governance go-ahead,
 * a critical-zone name in the header or DOVE, a governance file in DOVE,
 * `Lane: full`, a discovery whose DOVE writes outside docs/. Light: `Lane: fast`
 * or `Lane: discovery` whose DOVE writes docs/ only. Heavy when in doubt.
 */
function tierRule(text, ctx) {
    const { header, dove } = promptParts(text);
    const lane = (/^Lane:\s*([A-Za-z-]+)/m.exec(header) || [])[1] || '';
    const targets = dove === null ? [] : doveTargets(dove);
    const docsOnly = targets.length > 0 && targets.every((p) => p.startsWith('docs/'));
    const forced = (reason) => ({ tier: 'heavy', forced: true, reason });
    if (ctx.goahead) return forced('--critical-zone-goahead');
    if (ctx.merge) return forced('a merge that falls back to a session');
    if (ctx.governanceGoahead) return forced('--governance-goahead');
    const cz = CRITICAL_NAMES.find((n) => header.includes(n) || (dove || '').includes(n));
    if (cz) return forced('names ' + cz);
    const gov = targets.find((p) => GOVERNANCE.includes(p));
    if (gov) return forced('DOVE writes ' + gov);
    if (lane === 'full') return forced('Lane: full');
    if (lane === 'discovery' && targets.length > 0 && !docsOnly) return forced('Lane: discovery writes outside docs/');
    if ((lane === 'fast' || lane === 'discovery') && docsOnly) return { tier: 'light', forced: false, reason: 'Lane: ' + lane + ', DOVE writes docs only' };
    return {
        tier: 'heavy', forced: false,
        reason: 'in doubt: ' + (lane ? 'Lane: ' + lane : 'no Lane line') + (dove === null ? ', no DOVE' : targets.length ? ', DOVE writes outside docs/' : ', DOVE names no path'),
    };
}

/** The tier a lane runs: the rule, or --tier where the rule does not force; the model it passes, and the line printed and kept in tier.txt. */
function chooseTier(text, ctx = {}, requested = null) {
    const rule = tierRule(text, ctx);
    const raw = 'LANE_RUN_LIGHT_MODEL' in process.env ? process.env.LANE_RUN_LIGHT_MODEL.trim() : LIGHT_MODEL;
    const light = raw && raw !== 'null' ? raw : null;
    let t;
    if (requested === 'heavy') t = { tier: 'heavy', reason: '--tier heavy' };
    else if (requested === 'light') {
        if (rule.forced) refuse('--tier light refused: the rule forces heavy (' + rule.reason + ')');
        if (!light) refuse('--tier light: no light model is set (LIGHT_MODEL, RC-32)');
        t = { tier: 'light', reason: '--tier light (the rule: ' + rule.reason + ')' };
    } else if (rule.tier === 'light' && !light) t = { tier: 'heavy', reason: 'no light model set (' + rule.reason + ')' };
    else t = { tier: rule.tier, reason: rule.reason };
    if (t.tier === 'light' && !/^claude-[a-z0-9][a-z0-9.-]*$/.test(light)) refuse('the light model id is malformed: "' + light + '"');
    t.model = t.tier === 'light' ? light : null;
    t.line = t.tier + ' (' + (t.model || 'settings pin') + '): ' + t.reason;
    return t;
}

function tierOption(rest) {
    const v = option(rest, '--tier');
    if (v !== null && !TIERS.includes(v)) refuse('--tier takes heavy or light: ' + v);
    return v;
}

async function start(worktreeArg, promptArg, rest = [], ctx = {}) {
    if (!worktreeArg || !promptArg) refuse('usage: lane-run start <worktree> <prompt-file> [--critical-zone-goahead <Prompt-ID>] [--tier heavy|light]');
    const worktree = resolve(worktreeArg);
    if (!existsSync(worktree) || !statSync(worktree).isDirectory()) refuse('not a directory: ' + worktree);
    // As given (absolute, or relative to the caller's directory), then relative to the worktree.
    const tried = [...new Set([resolve(promptArg), resolve(worktree, promptArg)])];
    const promptFile = tried.find((p) => existsSync(p) && statSync(p).isFile());
    if (!promptFile) refuse('no prompt file: tried ' + tried.join(' and '));
    const text = readFileSync(promptFile, 'utf8');
    const id = headerPromptId(text);
    if (!id) refuse('the prompt header has no "Prompt-ID: P-YYYY-MM-DD-HHmm" line: ' + promptFile);
    const goAhead = goAheadOption(rest, id);
    const tier = chooseTier(text, { ...ctx, goahead: Boolean(goAhead) }, tierOption(rest));

    const claude = findClaude();
    const f = laneFiles(id);
    if (existsSync(f.session)) refuse(id + ' already has a session (' + readTrim(f.session) + '): use resume');
    if (isRunning(f)) refuse(id + ' is running');
    mkdirSync(f.dir, { recursive: true });
    writeFileSync(f.worktree, worktree + '\n');
    writeFileSync(f.prompt, promptFile + '\n');
    closeSync(openSync(f.log, 'a'));
    const from = statSync(f.log).size;

    if (goAhead) writeFileSync(f.goahead, goAhead + '\n');
    writeFileSync(f.tier, tier.line + '\n');
    launch(f, claude, worktree, promptFile, ['-p', ...FLAGS, ...(tier.model ? ['--model', tier.model] : [])], goAhead);
    console.log('prompt: ' + promptFile);
    console.log('tier: ' + tier.line);
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
    if (typeof idArg === 'string' && CHAIN_ID.test(idArg)) return chainStatus(idArg);
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
    if (s.state !== 'exited') return 0;
    const tree = readTrim(f.worktree);
    for (const path of laneReports(f, id)) {
        const w = briefWarning(path);
        if (w) console.log('warning: ' + (tree ? relative(tree, path) : path) + ': ' + w + ' (P16)');
    }
    return 0;
}

// The brief of a discovery report (P16, rule 5 of P-2026-09-27-2330): it opens the report, at most 40 lines.
const BRIEF_MAX = 40;
const BRIEF = /^## 0\. Answer in brief\s*$/;
const REPORT_FILE = /(^|\/)docs\/discovery\/discovery_[^/]+\.md$/;

/**
 * The discovery reports a lane wrote: the Write and Edit calls of its log (the
 * prompt text also names the reports it reads, so it is not the source); else
 * the files under docs/discovery/ that commits carrying its Prompt-ID add.
 */
function laneReports(f, id) {
    const tree = readTrim(f.worktree);
    const written = [];
    for (const e of events(f.log)) {
        if (!e || e.type !== 'assistant' || !e.message || !Array.isArray(e.message.content)) continue;
        for (const b of e.message.content) {
            const p = b && b.type === 'tool_use' && (b.name === 'Write' || b.name === 'Edit') && b.input ? b.input.file_path : null;
            if (typeof p === 'string' && REPORT_FILE.test(p)) written.push(p.startsWith('/') ? p : join(tree, p));
        }
    }
    if (written.length || !tree || !existsSync(tree)) return [...new Set(written)];
    const r = spawnSync('git', ['log', '--format=', '--name-only', '--diff-filter=A', '--fixed-strings', '--grep=' + id, '--', 'docs/discovery/'], { cwd: tree, encoding: 'utf8' });
    if (r.status !== 0) return [];
    return [...new Set(nonEmpty(r.stdout).filter((p) => REPORT_FILE.test(p)).map((p) => join(tree, p)))];
}

/** What is wrong with a report's brief, or null: absent, not the first section, or above BRIEF_MAX lines (trailing blank lines dropped). */
function briefWarning(path) {
    if (!existsSync(path)) return null;
    const lines = readFileSync(path, 'utf8').split('\n');
    const at = lines.findIndex((l) => BRIEF.test(l));
    if (at === -1) return 'no "## 0. Answer in brief"';
    if (lines.findIndex((l) => l.startsWith('## ')) !== at) return '"## 0. Answer in brief" is not the first section';
    const end = lines.findIndex((l, i) => i > at && l.startsWith('## '));
    const body = lines.slice(at + 1, end === -1 ? lines.length : end);
    while (body.length && body[body.length - 1].trim() === '') body.pop();
    return body.length > BRIEF_MAX ? 'the brief runs ' + body.length + ' lines, above ' + BRIEF_MAX : null;
}

/** Every lane folder of ~/.jjodel-lanes in one table, newest Prompt-ID first; other folders and files are not lanes. */
function statusAll(rest) {
    const limit = limitOption(rest);
    const root = lanesRoot();
    const chains = existsSync(root) ? readdirSync(root).filter((n) => CHAIN_ID.test(n) && existsSync(chainFiles(n).json)).map((n) => readChain(n)) : [];
    // A chain is one row with its position; its lanes are not listed on their own.
    const chained = new Set(chains.flatMap((c) => c.lanes.map((l) => l.id)));
    const ids = existsSync(root) ? readdirSync(root).filter((n) => PROMPT_ID.test(n) && !chained.has(n) && statSync(join(root, n)).isDirectory()) : [];
    const rows = [['id', 'state', 'outcome', 'elapsed']];
    for (const id of ids.sort().reverse()) {
        const s = laneState(laneFiles(id), limit);
        const m = s.outcome === null ? null : OUTCOME.exec(s.outcome);
        rows.push([id, s.state, s.outcome === null ? 'none' : m ? m[1] : 'unparsed', s.minutes + ' min']);
    }
    for (const c of chains.sort((a, b) => (a.id < b.id ? 1 : -1))) {
        rows.push([c.id, chainState(c), chainPosition(c), Math.floor((Date.now() - c.created) / 60000) + ' min']);
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
    // An unknown lane never runs: status, below, refuses it at the first poll. A chain waits until it stops.
    ids.forEach((id) => (CHAIN_ID.test(id) ? readChain(id) : checkId(id)));
    const live = (id) => (CHAIN_ID.test(id) ? chainRunning(readChain(id)) : isRunning(laneFiles(id)));
    const maxArg = option(rest, '--max');
    const max = maxArg === null ? WAIT_MAX_S : Number(maxArg);
    if (!Number.isFinite(max) || max < 0) refuse('--max takes a number of seconds');
    if (max > WAIT_MAX_S) {
        refuse('--max ' + max + ' is above ' + WAIT_MAX_S + ' s: the chat\'s shell call ends near 180 s and the wait would be lost with it; call wait again');
    }
    const end = Date.now() + max * 1000;
    for (;;) {
        const ended = ids.filter((id) => !live(id));
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
    if (!smoke || smoke.trim() === '') refuse('usage: lane-run go <Prompt-ID> --smoke "<what the chat verified>" [--step <n>] [--front <inbox>]');
    const stepArg = option(rest, '--step');
    if (existsSync(join(laneFiles(id).dir, 'direct.json'))) {
        if (stepArg !== null) refuse(id + ' is a direct merge: it has no session and no steps; go writes its closure');
        return closeDirect(id, smoke.trim(), option(rest, '--front'));
    }
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

/**
 * The decision rows and inbox headings each side adds, each to be found once
 * after the merge; the next row id of the series is the control. Plain data, so
 * a direct merge carries it to its worker.
 */
function probeList(cwd, base, sides) {
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
    let control = null;
    if (rows.size) {
        const ids = [...rows.keys()];
        const series = ids[ids.length - 1].replace(/-\d+$/, '');
        const re = new RegExp('^- \\*\\*' + series + '-(\\d+)\\*\\*', 'gm');
        let max = 0;
        for (const [, tip] of sides) {
            const r = git(cwd, ['show', tip + ':docs/decisions.md'], [0, 128]);
            for (const m of r.status === 0 ? r.out.matchAll(re) : []) max = Math.max(max, Number(m[1]));
        }
        control = series + '-' + (max + 1);
    }
    return {
        rows: [...rows].map(([id, r]) => ({ id, side: r.side })),
        headings: [...headings.values()].map((h) => ({ file: h.file, text: h.text, side: h.side })),
        control,
    };
}

function mergeProbes(list) {
    const out = [];
    if (list.rows.length) {
        out.push('`docs/decisions.md`, each row once, counted on `- **<id>**`: ' +
            list.rows.map((r) => '`' + r.id + '` (' + r.side + ')').join(', ') +
            '; control: `- **' + list.control + '**` none.');
    }
    for (const h of list.headings) out.push('`' + h.file + '`: the heading `' + h.text + '` once (' + h.side + ').');
    return out;
}

/** The probes a merged text fails: each row and each heading once, the control absent. */
function failedProbes(list, textOf) {
    const out = [];
    const count = (file, keep) => textOf(file).split('\n').filter(keep).length;
    for (const r of list.rows) {
        const n = count('docs/decisions.md', (l) => l.startsWith('- **' + r.id + '**'));
        if (n !== 1) out.push('`- **' + r.id + '**` ' + n + ' times in docs/decisions.md');
    }
    if (list.control) {
        const n = count('docs/decisions.md', (l) => l.startsWith('- **' + list.control + '**'));
        if (n !== 0) out.push('the control `- **' + list.control + '**` ' + n + ' times in docs/decisions.md');
    }
    for (const h of list.headings) {
        const n = count(h.file, (l) => l === h.text);
        if (n !== 1) out.push('the heading `' + h.text + '` ' + n + ' times in ' + h.file);
    }
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
    const tree = nonEmpty(mt.out)[0];
    const conflicts = mt.status === 0 ? [] : [...new Set(nonEmpty(mt.out).slice(1))];
    const branchFiles = nonEmpty(git(cwd, ['diff', '--name-only', base, branchTip]).out);
    const trunkFiles = nonEmpty(git(cwd, ['diff', '--name-only', base, trunkTip]).out);
    const log = (tip) => nonEmpty(git(cwd, ['log', '--format=%h %s', '--abbrev=9', base + '..' + tip]).out);
    const prompts = nonEmpty(git(cwd, ['diff', '--name-only', '--diff-filter=A', base, branchTip, '--', 'docs/prompts/']).out).map((path) => {
        const text = git(cwd, ['show', branchTip + ':' + path]).out;
        const status = headerStatus(text);
        const title = (text.split('\n')[0] || '').replace(/^#\s*(Prompt:\s*)?/, '').trim();
        return { name: basename(path), status, done: /^eseguito\b/.test(status), title };
    });
    const lastMerge = (tip) => git(cwd, ['log', '--merges', '-1', '--format=%h', '--abbrev=9', tip]).out.trim();
    let precedent = { sha: lastMerge(o.mode === 'into' ? trunkTip : branchTip), on: o.mode === 'into' ? o.trunk : o.branch };
    if (!precedent.sha && o.mode !== 'into') precedent = { sha: lastMerge(trunkTip), on: o.trunk };
    const probes = probeList(cwd, base, [['branch', branchTip], ['trunk', trunkTip]]);
    return {
        trunkTip, branchTip, base, tree, conflicts, branchFiles, trunkFiles,
        both: branchFiles.filter((p) => trunkFiles.includes(p)),
        governance: nonEmpty(git(cwd, ['diff', '--name-only', base, branchTip, '--', ...GOVERNANCE]).out),
        branchCommits: log(branchTip),
        trunkCommits: log(trunkTip),
        prompts,
        precedent,
        worktrees: worktrees(cwd),
        probeList: probes,
        fronts: inboxFronts(cwd, base, branchTip),
        probes: mergeProbes(probes),
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
        front: m.fronts.length === 1 ? '`' + m.fronts[0] + '`' : 'the `docs/log-inbox/` file of this branch\'s front (the branch adds headings to ' + (m.fronts.length ? quote(m.fronts) : 'none') + ')',
    };
}

function parseMerge(rest) {
    const o = { launch: false, governanceGoahead: false, direct: false };
    const positional = [];
    const valued = { '--into': 'into', '--trunk-into': 'trunkInto', '--from': 'from', '--at': 'at', '--chat': 'chat', '--tier': 'tier' };
    const usage = 'usage: lane-run merge <branch> --into <trunk> | merge --trunk-into <branch> [--from <trunk>], with [--at <rev>] [--chat <id>] [--direct] [--launch [--governance-goahead]] [--tier heavy]';
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === '--launch') o.launch = true;
        else if (a === '--direct') o.direct = true;
        else if (a === '--governance-goahead') o.governanceGoahead = true;
        else if (a.startsWith('--governance-goahead=')) refuse('--governance-goahead takes no value; ' + usage);
        else if (a in valued) {
            o[valued[a]] = option(rest.slice(i), a);
            i++;
        } else if (a.startsWith('--')) refuse('unknown option for merge: ' + a);
        else positional.push(a);
    }
    if (o.tier !== undefined && o.tier !== 'heavy') refuse('--tier ' + o.tier + ': a merge session runs heavy (RC-32)');
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
    const direct = o.direct ? directFindings(m, o) : null;
    const goDirect = direct !== null && direct.findings.length === 0;
    const slug = o.branch.replace(/[^A-Za-z0-9._-]+/g, '-');
    const file = join(dir, 'claude_' + date + '_' + hhmm + (o.mode === 'into' ? '_prompt_merge_' + slug : '_prompt_' + slug + '_take_trunk') + '.md');
    const parked = join(pending, basename(file));
    const values = mergeValues(m, o, id, when, findings, o.launch ? goahead : null);
    if (direct) {
        const note = goDirect
            ? '**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `' + join(laneFiles(id).dir, 'result.json') + '`.'
            : '**Direct.** `lane-run merge --direct` fell back:\n\n' + direct.findings.map((x) => '- ' + x).join('\n');
        values.findings = [values.findings, note].filter((x) => x !== '').join('\n\n');
    }
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
    if (direct) console.log(goDirect ? 'direct: preconditions hold' : 'direct: falls back: ' + direct.findings.map((x) => x.replace(/`/g, '')).join('; '));

    const refusals = findings.map((x) => x.replace(/`/g, ''));
    if (o.at && o.mode === 'into' && commitOf(o.top, o.trunk) !== m.trunkTip) {
        refusals.push('--at ' + o.at + ' is not the tip of ' + o.trunk + ': a launched merge starts from the trunk tip');
    }
    const rel = relative(o.top, file);
    const subjectLine = 'docs: add prompt ' + id + ', merge ' + (o.mode === 'into' ? o.branch + ' into ' + o.trunk : o.trunk + ' into ' + o.branch);
    const message = [subjectLine, modelTrailer() + '; lane tier heavy (a merge that falls back to a session)'];
    if (goahead) message.push("Governance go-ahead: Alfonso's yes, " + goahead + ' (--governance-goahead).');
    const byHand = 'by hand: cp ' + shWord(parked) + ' ' + shWord(file) + ' && git -C ' + shWord(o.top) + ' add -- ' + shWord(rel) +
        ' && git -C ' + shWord(o.top) + ' commit ' + message.map((x) => '-m ' + shWord(x)).join(' ') + ' -- ' + shWord(rel) +
        ' && lane-run start ' + shWord(o.top) + ' ' + shWord(rel);
    if (goDirect) return mergeDirect({ o, m, id, when, file, parked, rel, values, direct, message: [subjectLine, modelTrailer(), 'Run by lane-run merge --direct, no session.'] });
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
    return start(o.top, file, [], { merge: true, governanceGoahead: Boolean(goahead) });
}

// ── merge --direct ───────────────────────────────────────────────────────────

const GATES = ['typecheck', 'typecheck:scripts', 'vitest', 'build', 'check:docs', 'check:agents', 'check:scripts'];
// Conflict markers longer than any line of a markdown document, so a `=======` in the text is never taken for one.
const MARKER = 31;
const isTest = (p) => /\.test\.tsx?$/.test(p);

/** The npm of the gates: LANE_RUN_NPM (the tests), else the one beside this node, else the PATH's. */
function findNpm() {
    const v = (process.env.LANE_RUN_NPM || '').trim();
    if (v) return v;
    const beside = join(dirname(process.execPath), 'npm');
    if (isExecutable(beside)) return beside;
    const found = onPath('npm');
    if (!found) throw new Error('npm is neither beside ' + process.execPath + ' nor on the PATH');
    return found;
}

/**
 * The union of a docs file both sides changed, the templates' rule made
 * deterministic: `git merge-file --diff3` of the trunk, the base and the branch;
 * every conflict hunk must be a pure insertion (an empty base section) and
 * becomes the trunk's lines, one blank line when the branch's block opens with a
 * heading right after a non-blank line, then the branch's lines. Measured on the
 * 16 union files of 2026-09-26/27: 15 byte-identical to the sessions' own
 * resolutions (report P-2026-09-27-2330, 4.3). Null when a hunk edits (a fold on
 * one side): that is not an append, and the merge falls back.
 */
function unionResolve(cwd, base, trunkTip, branchTip, path) {
    const dir = mkdtempSync(join(tmpdir(), 'lane-run-union-'));
    try {
        const input = (rev, name) => {
            const r = git(cwd, ['show', rev + ':' + path], [0, 128]);
            writeFileSync(join(dir, name), r.status === 0 ? r.out : '');
            return join(dir, name);
        };
        const sides = [input(trunkTip, 'trunk'), input(base, 'base'), input(branchTip, 'branch')];
        const r = spawnSync('git', ['merge-file', '-p', '--diff3', '--marker-size=' + MARKER, '-L', 'trunk', '-L', 'base', '-L', 'branch', ...sides], {
            encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
        });
        if (r.error || r.status === null || r.status > 127) throw new Error('git merge-file ' + path + ': ' + (r.error ? r.error.message : r.stderr.trim()));
        const open = '<'.repeat(MARKER) + ' trunk';
        const mid = '|'.repeat(MARKER) + ' base';
        const sep = '='.repeat(MARKER);
        const close = '>'.repeat(MARKER) + ' branch';
        const out = [];
        let state = null;
        let ours = [];
        let baseLines = [];
        let theirs = [];
        for (const line of r.stdout.split('\n')) {
            if (state === null && line === open) {
                state = 'ours';
                ours = [];
                baseLines = [];
                theirs = [];
            } else if (state === 'ours' && line === mid) state = 'base';
            else if ((state === 'ours' || state === 'base') && line === sep) state = 'theirs';
            else if (state === 'theirs' && line === close) {
                if (baseLines.length) return null;
                out.push(...ours);
                if (ours.length && theirs.length && ours[ours.length - 1].trim() !== '' && theirs[0].startsWith('#')) out.push('');
                out.push(...theirs);
                state = null;
            } else if (state === 'ours') ours.push(line);
            else if (state === 'base') baseLines.push(line);
            else if (state === 'theirs') theirs.push(line);
            else out.push(line);
        }
        if (state !== null) throw new Error('git merge-file ' + path + ': a conflict without its end marker');
        return out.join('\n');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

/** The lanes whose run is live in a tree. */
function runningIn(tree) {
    const root = lanesRoot();
    if (!existsSync(root)) return [];
    return readdirSync(root).filter((n) => PROMPT_ID.test(n)).filter((n) => {
        const f = laneFiles(n);
        return readTrim(f.worktree) === tree && isRunning(f);
    });
}

/**
 * What keeps a merge from running without a session, on top of what refuses
 * --launch (P16, question 3 of the report of P-2026-09-27-2330). Also the union
 * texts and the incoming side's test files, which the worker needs.
 */
function directFindings(m, o) {
    const into = o.mode === 'into';
    const out = mergeFindings(m, o, false);
    if (!into) {
        const code = m.both.filter(isCode);
        if (code.length) out.push('code files changed on both sides since the base; step 5 of the template is a reading no script does: ' + quote(code));
        const open = m.prompts.filter((p) => !p.done);
        if (open.length) out.push('branch prompts whose Status is not eseguito: ' + open.map((p) => '`' + p.name + '` (' + (p.status || 'no Status line') + ')').join(', '));
    }
    if (o.at) out.push('--at ' + o.at + ': a direct merge takes the tip');
    if (git(o.top, ['status', '--porcelain']).out.trim() !== '') out.push('the tree is not clean (`git status --porcelain`)');
    if (git(o.top, ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], [0, 1]).status === 0) out.push('a merge is in progress (`MERGE_HEAD`)');
    for (const id of runningIn(o.top)) out.push(id + ' is running in ' + o.top);

    const union = {};
    let edits = false;
    for (const p of m.conflicts.filter(isUnion)) {
        const text = unionResolve(o.top, m.base, m.trunkTip, m.branchTip, p);
        if (text === null) {
            edits = true;
            out.push('a union hunk edits ' + p + ' (a base section): not an append');
        } else union[p] = text;
    }
    if (!edits) {
        const textOf = (p) => {
            if (p in union) return union[p];
            const r = git(o.top, ['show', m.tree + ':' + p], [0, 128]);
            return r.status === 0 ? r.out : '';
        };
        const failed = failedProbes(m.probeList, textOf);
        if (failed.length) out.push('a probe does not hold on the resolved merge: ' + failed.join('; '));
    }

    // The incoming side's test files are counted in its own worktree, at its tip (the template's vitest step).
    const incoming = into ? { branch: o.branch, tip: m.branchTip } : { branch: o.trunk, tip: m.trunkTip };
    const tests = (filter) => nonEmpty(git(o.top, ['diff', '--name-only', '--no-renames', '--diff-filter=' + filter, m.base, incoming.tip, '--', 'frontend/']).out)
        .filter(isTest).map((p) => p.slice('frontend/'.length));
    const changed = tests('AM');
    const deleted = tests('D');
    let tree = null;
    if (changed.length) {
        const trees = m.worktrees.filter((w) => w.branch === incoming.branch).map((w) => w.path);
        if (trees.length !== 1) {
            out.push('the ' + incoming.branch + ' side changes test files and has ' + (trees.length ? trees.length + ' worktrees' : 'no worktree') + ' to count them in');
        } else if (git(trees[0], ['rev-parse', 'HEAD']).out.trim() !== incoming.tip) {
            out.push('the worktree of ' + incoming.branch + ' (' + trees[0] + ') is not at ' + shortSha(o.top, incoming.tip));
        } else if (git(trees[0], ['status', '--porcelain', '--untracked-files=no']).out.trim() !== '') {
            out.push('the worktree of ' + incoming.branch + ' (' + trees[0] + ') has tracked changes');
        } else tree = trees[0];
    }
    return { findings: out, union, incoming: { ...incoming, tree, tests: changed, deleted } };
}

/** The commit message of a direct merge: the template's subject, a body of measurements only (question 5). */
function directMessage(m, o, id, when, values, tag) {
    const into = o.mode === 'into';
    const list = (xs) => (xs.length ? xs.slice(0, LISTED_MAX).map((l) => '- ' + l).join('\n') + (xs.length > LISTED_MAX ? '\n- and ' + (xs.length - LISTED_MAX) + ' more' : '') : '- none');
    const count = (n) => n + (n === 1 ? ' commit' : ' commits');
    const union = Object.keys(m.union);
    const lines = [
        into
            ? 'Brings ' + o.branch + ' at ' + m.short.branch + ' into ' + o.trunk + ' by lane-run merge --direct, no session (P16, RC-14). Merge base ' + m.short.base + '.'
            : 'Brings the trunk ' + o.trunk + ' at ' + m.short.trunk + ' into ' + o.branch + ' by lane-run merge --direct, no session (P16, RC-14). Merge base ' + m.short.base + '.',
        '',
        'The branch side, ' + count(m.branchCommits.length) + ':',
        list(m.branchCommits),
        '',
        'The trunk side since the base, ' + count(m.trunkCommits.length) + (into ? ', and this merge\'s prompt on top:' : ':'),
        list(m.trunkCommits),
        '',
        'Measured by lane-run merge at ' + when + ': git merge-tree --write-tree --name-only: ' + values.conflicts.replace(/`/g, '') + '. Files changed since the base: ' +
            values.branchFileCount + ' on the branch side, ' + values.trunkFileCount + ' on the trunk side; on both sides: ' + values.bothSides.replace(/`/g, '') +
            '. Governance files changed on the branch: none. Branch prompts: ' + values.branchPrompts.replace(/`/g, '') + '.',
        union.length ? 'Union resolutions, the trunk\'s block first, then the branch\'s: ' + union.join(', ') + '.' : 'No union resolution.',
        'Probes on the resolved merge, each once: ' + (m.probeList.rows.length + m.probeList.headings.length) + (m.probeList.control ? '; the control ' + m.probeList.control + ' absent' : '') + '.',
        'What the branch brings, by the titles of its prompts: ' + (m.prompts.length ? m.prompts.map((p) => p.title || p.name).join('; ') : 'none') + '.',
    ];
    if (tag) lines.push('Rollback tag: ' + tag + ' on ' + m.short.trunk + ' (RC-31).');
    lines.push('The gates run on this commit in the same worker; the result is in ~/.jjodel-lanes/' + id + '/result.json.');
    lines.push('', 'Model: none (lane-run merge --direct; ' + (o.chat ? 'chat ' + o.chat + ', ' : '') + modelTrailer().replace(/^Model:\s*/, '') + ')');
    return values.mergeSubject + '\n\n' + lines.join('\n') + '\n';
}

/** The foreground of a direct merge: the prompt committed alone, the rollback tag, the worker started. */
function mergeDirect({ o, m, id, when, file, parked, rel, values, direct, message }) {
    const into = o.mode === 'into';
    const tagged = (t) => git(o.top, ['rev-parse', '--verify', '--quiet', 'refs/tags/' + t], [0, 1, 128]).status === 0;
    let tag = null;
    if (into) {
        tag = tagged('pre-' + o.branch) ? 'pre-' + o.branch + '-' + id : 'pre-' + o.branch;
        if (tagged(tag)) refuse('the rollback tags pre-' + o.branch + ' and ' + tag + ' both exist: tag by hand and merge again');
    }
    mkdirSync(dirname(file), { recursive: true });
    copyFileSync(parked, file);
    unlinkSync(parked);
    git(o.top, ['add', '--', rel]);
    git(o.top, ['commit', '-q', ...message.flatMap((x) => ['-m', x]), '--', rel]);
    const promptCommit = git(o.top, ['rev-parse', 'HEAD']).out.trim();
    console.log('launch: committed ' + shortSha(o.top, promptCommit));
    if (tag) {
        git(o.top, ['tag', tag, m.trunkTip]);
        console.log('tag: ' + tag + ' on ' + m.short.trunk);
    }

    const f = laneFiles(id);
    mkdirSync(f.dir, { recursive: true });
    writeFileSync(f.worktree, o.top + '\n');
    writeFileSync(f.prompt, file + '\n');
    const plan = {
        kind: 'direct', mode: o.mode, promptId: id, top: o.top, branch: o.branch, trunk: o.trunk, chat: o.chat || null,
        base: m.base, trunkTip: m.trunkTip, branchTip: m.branchTip, promptCommit,
        incomingTip: direct.incoming.tip, incomingTree: direct.incoming.tree, incomingTests: direct.incoming.tests, deletedTests: direct.incoming.deleted,
        union: direct.union, probes: m.probeList, tag, prompt: file,
        message: directMessage({ ...m, union: direct.union }, o, id, when, values, tag),
    };
    writeFileSync(join(f.dir, 'direct.json'), JSON.stringify(plan, null, 1) + '\n');
    closeSync(openSync(f.log, 'a'));
    launch(f, process.execPath, o.top, '/dev/null', [SELF, 'direct-run', id]);
    console.log('direct: worker started, lane folder ' + f.dir);
    console.log('log: ' + f.log);
    return 0;
}

/** `<file> <code>` of every type error in a tsc output, sorted: the gate compares it with the receiving tip's. */
function typeErrors(text) {
    const out = [];
    for (const line of text.split('\n')) {
        const e = /^(\S.*?)\(\d+,\d+\): error (TS\d+):/.exec(line);
        if (e) out.push(e[1] + ' ' + e[2]);
    }
    return out.sort();
}

/** Per test file, relative to frontend/: its tests, the failed ones, and whether it failed at import. */
function vitestFiles(report, frontend) {
    if (!existsSync(report)) throw new Error('vitest wrote no report at ' + report);
    const j = JSON.parse(readFileSync(report, 'utf8'));
    const root = realpathSync(frontend);
    const files = {};
    for (const t of j.testResults || []) {
        const a = t.assertionResults || [];
        files[relative(root, t.name)] = { tests: a.length, failed: a.filter((x) => x.status === 'failed').length, importRed: t.status === 'failed' && a.length === 0 };
    }
    return files;
}

/** Atomic, like exit.txt: status never reads half a file. */
function writeJson(path, value) {
    writeFileSync(path + '.tmp', JSON.stringify(value, null, 1) + '\n');
    renameSync(path + '.tmp', path);
}

/**
 * The detached worker of a direct merge: the template's steps 4 to 7 without a
 * session. Its stdout is the lane's log.jsonl, so it prints events only.
 */
async function directRun(idArg) {
    const id = checkId(idArg);
    const f = laneFiles(id);
    const plan = JSON.parse(readFileSync(join(f.dir, 'direct.json'), 'utf8'));
    const res = {
        kind: 'direct', mode: plan.mode, promptId: id, branch: plan.branch, trunk: plan.trunk, tree: plan.top, tag: plan.tag,
        promptCommit: plan.promptCommit, merge: null, union: Object.keys(plan.union), gates: [], ok: false, outcome: 'blocked',
        reason: null, port3001: null, closure: null,
    };
    console.log(JSON.stringify({ type: 'system', subtype: 'direct', prompt_id: id }));
    try {
        const npm = findNpm();
        const frontend = join(plan.top, 'frontend');
        const run = (name, cwd, args) => {
            const log = join(f.dir, 'gate-' + name + '.log');
            const fd = openSync(log, 'w');
            const r = spawnSync(npm, args, { cwd, stdio: ['ignore', fd, fd] });
            closeSync(fd);
            return { code: r.error || r.status === null ? 1 : r.status, text: readFileSync(log, 'utf8') };
        };
        const vitest = (name, cwd, files, extra = []) => {
            const report = join(f.dir, 'vitest-' + name + '.json');
            run('vitest-' + name, cwd, ['run', 'test', '--', ...files, '--reporter=json', '--outputFile=' + report, ...extra]);
            return vitestFiles(report, cwd);
        };

        // Before the merge: the receiving tip's type errors and tests, and the incoming side's changed test files.
        const typesBefore = typeErrors(run('typecheck-before', frontend, ['run', 'typecheck']).text);
        const expected = vitest('before', frontend, []);
        if (plan.incomingTests.length) {
            const incoming = vitest('incoming', join(plan.incomingTree, 'frontend'), plan.incomingTests, ['--passWithNoTests']);
            for (const p of plan.incomingTests) {
                if (incoming[p]) expected[p] = incoming[p];
                else delete expected[p];
            }
        }
        for (const p of plan.deletedTests) delete expected[p];

        // The merge: --no-ff of the measured tip, the union files written, the probes on the index.
        git(plan.top, ['merge', '--no-ff', '--no-commit', plan.incomingTip], [0, 1]);
        const unmerged = nonEmpty(git(plan.top, ['diff', '--name-only', '--diff-filter=U']).out);
        const stray = unmerged.filter((p) => !(p in plan.union));
        if (stray.length) {
            git(plan.top, ['merge', '--abort']);
            throw new Error('conflicts the measurement did not show, merge aborted: ' + stray.join(', '));
        }
        for (const p of unmerged) {
            writeFileSync(join(plan.top, p), plan.union[p]);
            git(plan.top, ['add', '--', p]);
        }
        const failed = failedProbes(plan.probes, (p) => {
            const r = git(plan.top, ['show', ':' + p], [0, 128]);
            return r.status === 0 ? r.out : '';
        });
        if (failed.length) {
            git(plan.top, ['merge', '--abort']);
            throw new Error('probes on the index, merge aborted: ' + failed.join('; '));
        }
        const messageFile = join(f.dir, 'merge-message.txt');
        writeFileSync(messageFile, plan.message);
        git(plan.top, ['commit', '-q', '-F', messageFile]);
        res.merge = git(plan.top, ['rev-parse', 'HEAD']).out.trim();

        // The gates of the template on the merge commit, every one of them, no fail-fast.
        for (const name of GATES) {
            if (name === 'typecheck') {
                const after = typeErrors(run(name, frontend, ['run', 'typecheck']).text);
                const added = after.filter((e, i, xs) => xs.indexOf(e) === i && after.filter((x) => x === e).length > typesBefore.filter((x) => x === e).length);
                const gone = typesBefore.filter((e, i, xs) => xs.indexOf(e) === i && typesBefore.filter((x) => x === e).length > after.filter((x) => x === e).length);
                const ok = added.length === 0 && gone.length === 0;
                res.gates.push({ name, ok, detail: after.length + ' errors' + (ok ? ', the receiving tip\'s set' : '; new: ' + (added.join(', ') || 'none') + '; gone: ' + (gone.join(', ') || 'none')) });
            } else if (name === 'vitest') {
                const after = vitest('after', frontend, []);
                const keys = [...new Set([...Object.keys(expected), ...Object.keys(after)])].sort();
                const differ = keys.filter((k) => !expected[k] || !after[k] || expected[k].tests !== after[k].tests || expected[k].importRed !== after[k].importRed);
                const tests = Object.values(after).reduce((s, x) => s + x.tests, 0);
                const failedTests = Object.values(after).reduce((s, x) => s + x.failed, 0);
                const red = Object.values(after).filter((x) => x.importRed).length;
                const hooks = Object.entries(after).filter(([k]) => k.startsWith('scripts/hooks/')).reduce((s, [, x]) => s + x.tests, 0);
                const ok = differ.length === 0 && failedTests === 0;
                res.gates.push({
                    name, ok,
                    detail: tests + ' tests in ' + Object.keys(after).length + ' files, ' + red + ' red at import, hooks ' + hooks +
                        (failedTests ? '; ' + failedTests + ' failed' : '') + (differ.length ? '; not as expected: ' + differ.slice(0, 5).join(', ') : ''),
                });
            } else {
                const code = run(name, frontend, ['run', name]).code;
                res.gates.push({ name, ok: code === 0, detail: 'exit ' + code });
            }
        }
        res.ok = res.gates.every((g) => g.ok);
        res.outcome = res.ok ? 'hard-stop' : 'blocked';
        if (!res.ok) res.reason = 'red gates: ' + res.gates.filter((g) => !g.ok).map((g) => g.name).join(', ') + '; the merge commit stays';
    } catch (err) {
        res.reason = err && err.message ? err.message : String(err);
    }
    try {
        res.port3001 = portInUse(3001) ? 'up' : 'down';
    } catch {
        res.port3001 = 'unknown';
    }
    writeJson(join(f.dir, 'result.json'), res);
    const summary = [
        '[' + id + '] direct merge of ' + (plan.mode === 'into' ? plan.branch + ' into ' + plan.trunk : plan.trunk + ' into ' + plan.branch) +
            (res.merge ? ': merge ' + res.merge.slice(0, 9) : ': no merge commit') + (res.tag ? ', rollback tag ' + res.tag : '') + '.',
        ...res.gates.map((g) => '- ' + g.name + ': ' + (g.ok ? 'ok' : 'RED') + ', ' + g.detail),
        res.reason ? 'Reason: ' + res.reason : 'Every gate green. 3001 is ' + res.port3001 + '; the chat runs the visual check, then `lane-run go ' + id + ' --smoke "..."`.',
        'Outcome: ' + res.outcome,
    ];
    console.log(JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: summary.join('\n') }] } }));
    return res.outcome === 'hard-stop' ? 0 : 1;
}

// ── chain ────────────────────────────────────────────────────────────────────

const CHAIN_ID = /^chain-P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const CHAIN_POLL_MS = 500;

function chainFiles(id) {
    const dir = join(lanesRoot(), id);
    return { dir, json: join(dir, 'chain.json'), stop: join(dir, 'stop'), log: join(dir, 'chain.log') };
}

function readChain(id) {
    const cf = chainFiles(id);
    if (!existsSync(cf.json)) refuse('no chain ' + id + ' in ' + lanesRoot());
    return JSON.parse(readFileSync(cf.json, 'utf8'));
}

/** Running while its state says so and its supervisor lives (not yet known right after the launch). */
const chainRunning = (c) => c.state === 'running' && (!c.supervisor || isAlive(c.supervisor.pid));
const chainState = (c) => (c.state === 'running' && c.supervisor && !isAlive(c.supervisor.pid) ? 'lost' : c.state);
const chainPosition = (c) => c.position + '/' + c.lanes.length + ' ' + (c.lanes[Math.max(0, c.position - 1)] || { id: '-' }).id;

function chainStatus(id) {
    const c = readChain(id);
    console.log('chain: ' + c.id);
    console.log('state: ' + chainState(c));
    console.log('position: ' + chainPosition(c));
    console.log('lanes: ' + c.lanes.map((l) => l.id + ' ' + l.state + (l.outcome ? ' (' + l.outcome + ')' : '')).join('; '));
    console.log('merge after: ' + (c.mergeAfter ? 'into ' + c.mergeAfter.into + ', ' + c.mergeAfter.state + (c.mergeAfter.promptId ? ' ' + c.mergeAfter.promptId : '') +
        (c.mergeAfter.reason ? ': ' + c.mergeAfter.reason : '') : 'none'));
    console.log('stopped at: ' + (c.stoppedAt ? (c.stoppedAt.id || '-') + ': ' + c.stoppedAt.reason : '-'));
    console.log('elapsed: ' + Math.floor((Date.now() - c.created) / 60000) + ' min');
    console.log('log: ' + chainFiles(id).log);
    return 0;
}

/**
 * chain <worktree> <prompt>...: the lanes run one after the other in one
 * worktree, the next only on `Outcome: done` with exit 0, under a detached
 * supervisor that outlives the chat's call (nohup, its own session, as start's
 * wrapper). A prompt outside the tree (parked in pending/) is committed alone
 * at its launch, as merge --launch does.
 */
function chain(rest) {
    if (rest[0] === '--stop') return chainStop(rest[1]);
    const usage = 'usage: lane-run chain <worktree> <prompt-1> [<prompt-2> ...] [--merge-after [--into <trunk>]] [--limit <minutes>] [--chat <id>] [--tier heavy|light] | chain --stop <chain-id>';
    const positional = [];
    const o = { mergeAfter: false, into: null, limit: DEFAULT_LIMIT_MINUTES, chat: null, tier: null };
    for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === '--merge-after') o.mergeAfter = true;
        else if (a === '--into' || a === '--chat' || a === '--tier') {
            o[a.slice(2)] = option(rest.slice(i), a);
            i++;
        } else if (a === '--limit') {
            o.limit = limitOption(rest.slice(i));
            i++;
        } else if (a.startsWith('--')) refuse('unknown option for chain: ' + a + '; ' + usage);
        else positional.push(a);
    }
    if (positional.length < 2) refuse(usage);
    if (o.into && !o.mergeAfter) refuse('--into goes with --merge-after; ' + usage);
    if (o.tier !== null && !TIERS.includes(o.tier)) refuse('--tier takes heavy or light: ' + o.tier);
    const worktree = resolve(positional[0]);
    if (!existsSync(worktree) || !statSync(worktree).isDirectory()) refuse('not a directory: ' + worktree);
    const t = git(worktree, ['rev-parse', '--show-toplevel'], [0, 128]);
    if (t.status !== 0) refuse('not inside a git worktree: ' + worktree);
    const top = t.out.trim();
    const branch = git(top, ['branch', '--show-current']).out.trim();
    if (!branch) refuse(top + ' is on a detached HEAD: a chain runs on a branch');

    const lanes = [];
    for (const p of positional.slice(1)) {
        const tried = [...new Set([resolve(p), resolve(top, p)])];
        const file = tried.find((x) => existsSync(x) && statSync(x).isFile());
        if (!file) refuse('no prompt file: tried ' + tried.join(' and '));
        const id = headerPromptId(readFileSync(file, 'utf8'));
        if (!id) refuse('the prompt header has no "Prompt-ID: P-YYYY-MM-DD-HHmm" line: ' + file);
        if (lanes.some((l) => l.id === id)) refuse(id + ' is chained twice');
        if (existsSync(laneFiles(id).dir)) refuse(id + ' already has a lane folder in ' + lanesRoot());
        const inTree = !relative(top, file).startsWith('..');
        if (inTree) {
            const rel = relative(top, file);
            if (git(top, ['ls-files', '--error-unmatch', '--', rel], [0, 1]).status !== 0 || git(top, ['status', '--porcelain', '--', rel]).out.trim() !== '') {
                refuse(rel + ' is in the tree but not committed: park it in ' + join(lanesRoot(), 'pending') + ' or commit it');
            }
        } else if (existsSync(join(top, 'docs', 'prompts', basename(file))) || lanes.some((l) => !l.inTree && basename(l.prompt) === basename(file))) {
            refuse('docs/prompts/' + basename(file) + ' would be written twice');
        }
        // The tier of each lane, --tier light refused on a lane the rule forces heavy, before anything runs.
        const tier = chooseTier(readFileSync(file, 'utf8'), {}, o.tier);
        lanes.push({ id, prompt: file, inTree, state: 'queued', tier: tier.tier, tierReason: tier.reason });
    }
    let into = null;
    if (o.mergeAfter) {
        into = o.into || DEFAULT_TRUNK;
        if (!worktrees(top).some((w) => w.branch === into)) refuse('--merge-after: ' + into + ' has no worktree to merge in');
    }
    const id = 'chain-' + lanes[0].id;
    const cf = chainFiles(id);
    if (existsSync(cf.dir)) refuse(id + ' already exists in ' + lanesRoot());
    mkdirSync(cf.dir, { recursive: true });
    writeJson(cf.json, {
        id, worktree: top, branch, state: 'running', position: 0, created: Date.now(), limit: o.limit, chat: o.chat, tier: o.tier,
        lanes, mergeAfter: into ? { into, state: 'queued' } : null, stoppedAt: null, supervisor: null,
    });
    const env = { ...process.env, PATH: dirname(process.execPath) + delimiter + (process.env.PATH || '') };
    const child = spawn('/bin/sh', ['-c', 'nohup "$@" >> "$0" 2>&1', cf.log, process.execPath, SELF, 'chain-run', id], {
        cwd: top, env, detached: true, stdio: 'ignore',
    });
    child.unref();
    console.log('chain: ' + id);
    console.log('lanes: ' + lanes.map((l) => l.id).join(', '));
    console.log('merge after: ' + (into ? 'into ' + into + ' --direct' : 'none'));
    console.log('log: ' + cf.log);
    return 0;
}

function chainStop(idArg) {
    if (typeof idArg !== 'string' || !CHAIN_ID.test(idArg)) refuse('usage: lane-run chain --stop <chain-id>');
    const c = readChain(idArg);
    if (!chainRunning(c)) refuse(idArg + ' is not running (' + chainState(c) + ')');
    writeFileSync(chainFiles(idArg).stop, new Date().toISOString() + '\n');
    console.log('stop: requested; ' + idArg + ' stops after the running lane, which is not interrupted');
    return 0;
}

/** The supervisor of a chain; its output goes to chain.log. */
async function chainRun(id) {
    const cf = chainFiles(id);
    const c = readChain(id);
    const save = () => writeJson(cf.json, c);
    const stop = (laneId, reason) => {
        c.state = 'stopped';
        c.stoppedAt = { id: laneId, reason };
        save();
        return 1;
    };
    c.supervisor = { pid: process.pid, started: Date.now() };
    save();
    const pending = join(lanesRoot(), 'pending');
    for (let k = 0; k < c.lanes.length; k++) {
        const lane = c.lanes[k];
        c.position = k + 1;
        save();
        if (existsSync(cf.stop)) return stop(lane.id, '--stop');
        let promptFile = lane.prompt;
        if (!lane.inTree) {
            if (git(c.worktree, ['status', '--porcelain', '--untracked-files=no']).out.trim() !== '') return stop(lane.id, 'tree dirty');
            const target = join(c.worktree, 'docs', 'prompts', basename(lane.prompt));
            if (existsSync(target)) return stop(lane.id, 'docs/prompts/' + basename(target) + ' exists');
            mkdirSync(dirname(target), { recursive: true });
            copyFileSync(lane.prompt, target);
            const rel = relative(c.worktree, target);
            git(c.worktree, ['add', '--', rel]);
            git(c.worktree, ['commit', '-q', '-m', 'docs: add prompt ' + lane.id + ', lane ' + (k + 1) + '/' + c.lanes.length + ' of ' + c.id, '-m', modelTrailer() + '; lane tier ' + lane.tier + ' (' + lane.tierReason + ')', '--', rel]);
            lane.committed = git(c.worktree, ['rev-parse', 'HEAD']).out.trim();
            if (dirname(lane.prompt) === pending) unlinkSync(lane.prompt);
            promptFile = target;
        }
        lane.state = 'running';
        save();
        let code;
        try {
            code = await start(c.worktree, promptFile, c.tier ? ['--tier', c.tier] : []);
        } catch (err) {
            return stop(lane.id, 'start refused: ' + (err && err.message ? err.message : String(err)));
        }
        if (code !== 0) return stop(lane.id, 'start failed, exit ' + code);
        const f = laneFiles(lane.id);
        while (isRunning(f)) {
            if (Date.now() - Number(readTrim(f.started)) > c.limit * 60000) return stop(lane.id, 'limit ' + c.limit + ' min');
            await sleep(CHAIN_POLL_MS);
        }
        const line = lastOutcome(f.log);
        const m = line === null ? null : OUTCOME.exec(line);
        lane.exit = readTrim(f.exit) || '-';
        lane.outcome = line === null ? 'none' : m ? m[1] : 'unparsed';
        if (lane.outcome !== 'done') {
            lane.state = 'ended';
            return stop(lane.id, 'Outcome: ' + lane.outcome);
        }
        if (lane.exit !== '0') {
            lane.state = 'ended';
            return stop(lane.id, 'exit ' + lane.exit);
        }
        lane.state = 'done';
        save();
    }
    if (c.mergeAfter) {
        if (existsSync(cf.stop)) return stop(null, '--stop');
        const tree = worktrees(c.worktree).find((w) => w.branch === c.mergeAfter.into);
        if (!tree) return stop(null, 'merge after: ' + c.mergeAfter.into + ' has no worktree');
        // Parked on a fallback, never launched: the chat decides (question 11 of the report).
        const r = spawnSync(process.execPath, [SELF, 'merge', c.branch, '--into', c.mergeAfter.into, '--direct', ...(c.chat ? ['--chat', c.chat] : [])], {
            cwd: tree.path, encoding: 'utf8',
        });
        const out = (r.stdout || '') + (r.stderr || '');
        const pid = /^Prompt-ID: (P-\S+)$/m.exec(out);
        const falls = /^direct: falls back: (.*)$/m.exec(out);
        const byHand = /^by hand: .*$/m.exec(out);
        c.mergeAfter.promptId = pid ? pid[1] : null;
        c.mergeAfter.exit = r.status;
        c.mergeAfter.state = /^direct: worker started/m.test(out) ? 'direct' : falls ? 'fallback' : 'refused';
        if (falls) c.mergeAfter.reason = falls[1];
        else if (c.mergeAfter.state === 'refused') c.mergeAfter.reason = out.trim().split('\n').pop() || 'exit ' + r.status;
        if (byHand) c.mergeAfter.byHand = byHand[0].slice('by hand: '.length);
        if (c.mergeAfter.state !== 'direct') return stop(null, 'merge after: ' + c.mergeAfter.state);
    }
    c.state = 'done';
    save();
    return 0;
}

// ── go on a direct merge: the one closure commit ─────────────────────────────

const NOTES_MAX = 500;

const INBOX_FILE = /^docs\/log-inbox\/[^/]+\.md$/;

/** The inboxes a side adds headings to since the base: a merge's entry goes to the branch's front. */
function inboxFronts(cwd, base, tip) {
    return [...new Set(addedLines(cwd, base, tip, ['docs/log-inbox/']).filter((a) => /^## /.test(a.text) && INBOX_FILE.test(a.file)).map((a) => a.file))];
}

/** `YYYY-MM-DD HH:mm` of a prompt file named claude_<date>_<HHmm>_...: its P9 `Prompt document name`. */
function promptDocumentName(file) {
    const m = /^claude_(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})_/.exec(basename(file));
    return m ? m[1] + ' ' + m[2] + ':' + m[3] : '—';
}

/** The P9 entry of a direct merge, generated from git and result.json; Notes within the cap of CLAUDE.md 21.2. */
function directEntry(plan, res, smoke, date) {
    const into = plan.mode === 'into';
    const cwd = plan.top;
    const s = (sha) => shortSha(cwd, sha);
    const files = nonEmpty(git(cwd, ['diff', '--name-only', res.merge + '^1', res.merge]).out);
    const shown = files.slice(0, 8).map((p) => '`' + p + '`').join(', ') + (files.length > 8 ? ', and ' + (files.length - 8) + ' more' : '');
    const commits = nonEmpty(git(cwd, ['rev-list', plan.base + '..' + plan.incomingTip]).out).length;
    const incomingSide = into ? 'the branch side' : 'the trunk side';
    let notes = (res.tag ? 'Rollback tag `' + res.tag + '` on `' + s(plan.trunkTip) + '` (RC-31). ' : '') +
        'Union: ' + (res.union.length ? res.union.map((p) => '`' + p + '`').join(', ') : 'none') + '. Worker and gates: `~/.jjodel-lanes/' + res.promptId + '/result.json`.';
    if (notes.length > NOTES_MAX) notes = notes.slice(0, NOTES_MAX - 3) + '...';
    return [
        '## ' + date + ' — ' + (into ? 'merge: ' + plan.branch + ' into ' + plan.trunk : 'merge: ' + plan.branch + ' takes ' + plan.trunk) + ' (' + res.promptId + ')',
        '**Prompt**: `' + basename(plan.prompt) + '`, a direct merge by `lane-run merge --direct`, no session: `' + (into ? plan.branch : plan.trunk) + '` at `' + s(plan.incomingTip) +
            '` into `' + (into ? plan.trunk : plan.branch) + '`, merge base `' + s(plan.base) + '`, ' + commits + (commits === 1 ? ' commit' : ' commits') + ' on ' + incomingSide + '.',
        '**Files touched**: merge `' + s(res.merge) + '`: ' + files.length + ' files from ' + incomingSide + (files.length ? ' (' + shown + ')' : '') + '; this commit: this entry and the Status of the prompt file.',
        '**Outcome**: ✅ completed',
        '**Corregge**: —',
        '**Causa**: —',
        '**Regressions**: no. Gates on `' + s(res.merge) + '` in the worker: ' + res.gates.map((g) => g.name + ' ' + g.detail).join('; ') + '.',
        '**Out-of-scope changes**: no',
        '**Layer Impact Report**: not-required',
        '**Smoke visivo**: passato — chat, unattended: ' + smoke,
        '**Notes**: ' + notes,
        '**Prompt document name**: ' + promptDocumentName(plan.prompt),
    ].join('\n') + '\n';
}

/**
 * go on a direct merge (rule 2 of P-2026-09-27-2330): after the chat's visual
 * check, one docs commit flips the merge prompt's Status and appends the P9
 * entry to the inbox the branch writes to; no session is resumed.
 */
function closeDirect(id, smoke, frontArg) {
    const f = laneFiles(id);
    const plan = JSON.parse(readFileSync(join(f.dir, 'direct.json'), 'utf8'));
    if (isRunning(f)) refuse(id + ' is still running its gates: wait for it');
    const resultFile = join(f.dir, 'result.json');
    if (!existsSync(resultFile)) refuse(id + ' has no result.json: the worker ended without one; see ' + f.err);
    const res = JSON.parse(readFileSync(resultFile, 'utf8'));
    if (res.closure) refuse(id + ' is already closed at ' + res.closure.slice(0, 9));
    if (!res.ok || !res.merge) refuse(id + ' is blocked (' + (res.reason || 'no merge') + '): no closure over it');
    const top = plan.top;
    if (git(top, ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], [0, 1]).status === 0) refuse('a merge is in progress in ' + top);
    if (git(top, ['merge-base', '--is-ancestor', res.merge, 'HEAD'], [0, 1]).status !== 0) refuse('the merge ' + res.merge.slice(0, 9) + ' is not in the history of HEAD in ' + top);

    let inbox;
    if (frontArg !== null) {
        inbox = 'docs/log-inbox/' + frontArg.replace(/\.md$/, '') + '.md';
        if (!existsSync(join(top, inbox))) refuse('--front ' + frontArg + ': no ' + inbox + ' in ' + top);
    } else {
        const fronts = inboxFronts(top, plan.base, plan.branchTip);
        if (fronts.length !== 1) {
            refuse('the branch adds headings to ' + (fronts.length ? fronts.join(', ') : 'no inbox') + ': name the entry\'s inbox with --front <name>');
        }
        inbox = fronts[0];
    }
    const promptRel = relative(top, plan.prompt);
    if (git(top, ['status', '--porcelain', '--', promptRel, inbox]).out.trim() !== '') refuse(promptRel + ' or ' + inbox + ' has uncommitted changes in ' + top);

    const { date } = stamp(clock());
    const lines = readFileSync(plan.prompt, 'utf8').split('\n');
    const end = lines.findIndex((l) => l.startsWith('## '));
    const at = lines.findIndex((l, i) => (end === -1 || i < end) && /^Status:/.test(l));
    if (at === -1 || lines[at].trim() !== 'Status: da eseguire') refuse(promptRel + ': the header Status is not `da eseguire`');
    const lane = plan.mode === 'into' ? 'merge' : plan.branch;
    lines[at] = 'Status: eseguito ' + date + ' · lane ' + lane + ' · ' + shortSha(top, res.merge) + ' · verifica visiva passata ' + date + ' (' + smoke + ')';
    writeFileSync(plan.prompt, lines.join('\n'));
    const current = readFileSync(join(top, inbox), 'utf8');
    const sep = current === '' || current.endsWith('\n\n') ? '' : current.endsWith('\n') ? '\n' : '\n\n';
    writeFileSync(join(top, inbox), current + sep + directEntry(plan, res, smoke, date));

    const long = 'docs: Status flip and log entry for the ' + plan.branch + ' merge';
    const subject = (long.length <= SUBJECT_MAX ? long : 'docs: Status flip and log entry for a direct merge') + ' (' + id + ')';
    const trailer = 'Model: none (lane-run go, direct merge; ' + modelTrailer().replace(/^Model:\s*/, '') + ')';
    git(top, ['add', '--', promptRel, inbox]);
    git(top, ['commit', '-q', '-m', subject, '-m', trailer, '--', promptRel, inbox]);
    res.closure = git(top, ['rev-parse', 'HEAD']).out.trim();
    writeJson(resultFile, res);
    const text = '[' + id + '] closure ' + res.closure.slice(0, 9) + ': Status flipped, entry in ' + inbox + '.\nOutcome: done';
    writeFileSync(f.log, JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } }) + '\n', { flag: 'a' });
    console.log('closure: committed ' + res.closure.slice(0, 9));
    console.log('status: ' + promptRel);
    console.log('entry: ' + inbox);
    return 0;
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
    if (command === 'direct-run') return directRun(rest[0]);
    if (command === 'chain') return chain(rest);
    if (command === 'chain-run') return chainRun(rest[0]);
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

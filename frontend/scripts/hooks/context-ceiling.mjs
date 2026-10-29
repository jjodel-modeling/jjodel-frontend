/**
 * context-ceiling.mjs: PreToolUse hook on every tool (matcher `*`).
 *
 * AM-8 of report docs/discovery/discovery_2026-10-15_lean_context_model_routing.md §7.3
 * (batch B8b, P-2026-10-18-1530): a context ceiling per session. The thresholds below,
 * soft 200,000 and hard 250,000 tokens, are ratified by RC-51 (2026-10-18). JJODEL_CONTEXT_SOFT and
 * JJODEL_CONTEXT_HARD override them when both are positive integers and soft < hard;
 * otherwise the defaults hold.
 *
 * Measure. The context of the session is input_tokens + cache_read_input_tokens +
 * cache_creation_input_tokens of the latest main `assistant` event that carries a
 * message.usage. Main means isSidechain is not true and parent_tool_use_id is empty (the
 * transcript marks a subagent with the first, the stream-json lane log with the second).
 * The lines of one message.id (one per content block) carry the same usage: the latest
 * line of the latest message counts. An event whose sum is 0 (a synthetic message) is
 * not a measure and is skipped. The source is JJODEL_LANE_LOG when it is set and
 * readable (what lane-run launch exports from B8a on), else the hook input's
 * transcript_path. Only the last 512 KB are read, widened once to the whole file when
 * that tail holds no qualifying event: the hook runs on every call. The event of the
 * call that requests the tool is already on disk when PreToolUse runs (measured
 * 2026-10-18, P-2026-10-18-1530), so the measure is the current call's.
 *
 * Lane session: a directory under ~/.jjodel-lanes/ (JJODEL_LANES_DIR overrides the root)
 * whose session.txt holds the session_id. Below soft: silent. At or above soft, the first
 * time: `deny`, naming the handoff (<lane folder>/handoff.md, sections Task, Scope,
 * Decisions taken, Evidence, Current diff, Remaining checks, the full diff in
 * <lane folder>/handoff.diff) and the closing `Outcome: hard-stop`. The firing is
 * recorded in os.tmpdir()/jjodel-context-ceiling-<session_id>.json; later calls below
 * hard are allowed. At or above hard: `deny` every call except Read, Write or Edit of
 * the two handoff files and a Bash command that is one `git status` or `git diff`,
 * optionally redirected with `>` to <lane folder>/handoff.diff, with nothing chained.
 * The hard stop keeps no state.
 *
 * Interactive session (no lane folder): at or above soft, once per session, `deny`
 * telling the session to start no new work, report the measure and recommend a fresh
 * session. No hard stop (RC-50 governs the architect chat).
 *
 * `deny`, never `ask`, so that it holds under bypassPermissions (RC-29). It FAILS OPEN,
 * with no decision: missing or unparsable stdin, no session_id, no readable source, no
 * qualifying event, an unwritable temp dir when the soft marker is due, any exception.
 *
 * Run by: node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/context-ceiling.mjs"
 */

import { closeSync, fstatSync, openSync, readdirSync, readFileSync, readSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve } from 'node:path';
import { readInput, decide, runHook } from './lib.mjs';

export const DEFAULT_SOFT = 200000;
export const DEFAULT_HARD = 250000;
export const TAIL_BYTES = 512 * 1024;
export const HANDOFF_FILES = ['handoff.md', 'handoff.diff'];

/** The thresholds in force: the overrides when both are valid, else the defaults. */
export function thresholds(env) {
    const parse = (v) => (typeof v === 'string' && /^[1-9]\d*$/.test(v.trim()) ? Number(v.trim()) : null);
    const soft = parse(env.JJODEL_CONTEXT_SOFT);
    const hard = parse(env.JJODEL_CONTEXT_HARD);
    if (soft !== null && hard !== null && soft < hard) return { soft, hard };
    return { soft: DEFAULT_SOFT, hard: DEFAULT_HARD };
}

/** The context of one jsonl line, or null when it is not a main assistant event with a usage. */
export function contextOf(line) {
    if (line.indexOf('"assistant"') === -1 || line.indexOf('"usage"') === -1) return null;
    let o;
    try {
        o = JSON.parse(line);
    } catch {
        return null;
    }
    if (!o || o.type !== 'assistant' || o.isSidechain === true || o.parent_tool_use_id) return null;
    const u = o.message && o.message.usage;
    if (!u || typeof u !== 'object') return null;
    const n = (k) => (typeof u[k] === 'number' && u[k] >= 0 ? u[k] : 0);
    const total = n('input_tokens') + n('cache_read_input_tokens') + n('cache_creation_input_tokens');
    return total > 0 ? total : null;
}

/** The context of the latest qualifying line of a jsonl text, scanning from the end. */
export function latestContext(text) {
    let end = text.length;
    while (end > 0) {
        const nl = text.lastIndexOf('\n', end - 1);
        const line = text.slice(nl + 1, end);
        end = nl === -1 ? 0 : nl;
        const c = contextOf(line);
        if (c !== null) return c;
    }
    return null;
}

function readTail(fd, size, bytes) {
    const start = Math.max(0, size - bytes);
    const buf = Buffer.alloc(size - start);
    let off = 0;
    while (off < buf.length) {
        const r = readSync(fd, buf, off, buf.length - off, start + off);
        if (r === 0) break;
        off += r;
    }
    let text = buf.toString('utf8', 0, off);
    if (start > 0) {
        const nl = text.indexOf('\n');
        text = nl === -1 ? '' : text.slice(nl + 1); // the first line is cut
    }
    return { text, whole: start === 0 };
}

/** The measured context of a jsonl file, or null (unreadable, no qualifying event). */
export function measureFile(path) {
    let fd;
    try {
        fd = openSync(path, 'r');
    } catch {
        return null;
    }
    try {
        const size = fstatSync(fd).size;
        const tail = readTail(fd, size, TAIL_BYTES);
        const c = latestContext(tail.text);
        if (c !== null || tail.whole) return c;
        return latestContext(readTail(fd, size, size).text);
    } finally {
        closeSync(fd);
    }
}

function readable(path) {
    try {
        closeSync(openSync(path, 'r'));
        return true;
    } catch {
        return false;
    }
}

/** The source to measure: JJODEL_LANE_LOG when set and readable, else transcript_path. */
export function sourceOf(env, input) {
    const laneLog = env.JJODEL_LANE_LOG;
    if (typeof laneLog === 'string' && laneLog !== '' && readable(laneLog)) return laneLog;
    const t = input.transcript_path;
    return typeof t === 'string' && t !== '' ? t : null;
}

function holdsSession(dir, sessionId) {
    try {
        return readFileSync(join(dir, 'session.txt'), 'utf8').trim() === sessionId;
    } catch {
        return false;
    }
}

/** The lane folder whose session.txt holds the session id, or null. */
export function laneFolder(env, sessionId) {
    const root = env.JJODEL_LANES_DIR || join(homedir(), '.jjodel-lanes');
    const log = env.JJODEL_LANE_LOG;
    if (typeof log === 'string' && log !== '' && holdsSession(dirname(resolve(log)), sessionId)) return dirname(resolve(log));
    let names;
    try {
        names = readdirSync(root);
    } catch {
        return null;
    }
    for (const name of names.sort().reverse()) {
        const dir = join(root, name);
        if (holdsSession(dir, sessionId)) return dir;
    }
    return null;
}

function markerPath(sessionId) {
    return join(tmpdir(), 'jjodel-context-ceiling-' + sessionId + '.json');
}

function softFired(file) {
    try {
        return JSON.parse(readFileSync(file, 'utf8')).soft === true;
    } catch {
        return false;
    }
}

function real(path) {
    try {
        return realpathSync(path);
    } catch {
        return resolve(path);
    }
}

/** Whether a path names one of the handoff files of the lane folder. */
export function isHandoffPath(lane, target, cwd) {
    if (typeof target !== 'string' || target === '') return false;
    const abs = resolve(typeof cwd === 'string' && cwd !== '' ? cwd : process.cwd(), target);
    return HANDOFF_FILES.includes(basename(abs)) && real(dirname(abs)) === real(lane);
}

/**
 * Whether a Bash command is one `git status` or `git diff`, optionally redirected with
 * `>` to <lane folder>/handoff.diff. Nothing chained, no substitution, no variable, no
 * other redirection, no newline (a newline separates commands as `;` does), no
 * `--output` (git diff would write a file of its choosing).
 */
export function isHandoffBash(lane, command, cwd) {
    if (typeof command !== 'string' || /[\n\r]/.test(command)) return false;
    const m = /^[ \t]*git[ \t]+(?:--no-pager[ \t]+)?(?:status|diff)((?:[ \t]+[^\s;&|`$<>()'"\\]+)*)[ \t]*(?:>[ \t]*(?:"([^"$`\\]+)"|'([^']+)'|([^\s;&|`$<>()'"\\]+)))?[ \t]*$/.exec(command);
    if (!m) return false;
    if (/(^|[ \t])--output(=|[ \t]|$)/.test(m[1])) return false;
    const target = m[2] ?? m[3] ?? m[4];
    if (target === undefined) return true;
    return basename(target) === 'handoff.diff' && isHandoffPath(lane, target, cwd);
}

function handoffText(lane) {
    const md = join(lane, 'handoff.md');
    const diff = join(lane, 'handoff.diff');
    return (
        'Write ' + md + ' with the sections Task, Scope, Decisions taken, Evidence, Current diff, Remaining checks. ' +
        'Current diff is the output of `git diff --stat <cut sha>` plus the path of the full diff, written with ' +
        '`git diff <cut sha> > ' + diff + '`. Then end your final message with the line `Outcome: hard-stop`.'
    );
}

function main() {
    const input = readInput();
    if (!input) return;
    const sessionId = input.session_id;
    if (typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(sessionId)) return;
    const env = process.env;
    const source = sourceOf(env, input);
    if (source === null) return;
    const context = measureFile(source);
    if (context === null) return;
    const { soft, hard } = thresholds(env);
    if (context < soft) return;

    const lane = laneFolder(env, sessionId);
    const measured = 'context-ceiling: this session\'s context is ' + context + ' tokens';

    if (lane !== null && context >= hard) {
        const tool = input.tool_name;
        const ti = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
        if ((tool === 'Read' || tool === 'Write' || tool === 'Edit') && isHandoffPath(lane, ti.file_path, input.cwd)) return;
        if (tool === 'Bash' && isHandoffBash(lane, ti.command, input.cwd)) return;
        decide(
            'deny',
            measured + ', at or above the hard ceiling of ' + hard + ' (AM-8). Every tool is denied except Read, Write or Edit of ' +
                join(lane, 'handoff.md') + ' or ' + join(lane, 'handoff.diff') + ', and one `git status` or `git diff` with nothing chained. ' +
                handoffText(lane),
        );
        return;
    }

    const marker = markerPath(sessionId);
    if (softFired(marker)) return;
    try {
        writeFileSync(marker, JSON.stringify({ soft: true, context, lane }) + '\n');
    } catch {
        return; // no marker, no denial: it would fire on every call
    }

    if (lane !== null) {
        decide(
            'deny',
            measured + ', at or above the soft ceiling of ' + soft + ' (AM-8; hard ceiling ' + hard + '). Start no new work. ' +
                handoffText(lane) +
                ' This fires once per session: calls below ' + hard + ' tokens are allowed again; at ' + hard +
                ' only the handoff writes and `git status`/`git diff` are.',
        );
        return;
    }
    decide(
        'deny',
        measured + ', at or above the soft ceiling of ' + soft + ' (AM-8). Start no new work: tell the user the measured context (' +
            context + ' tokens) and recommend continuing in a fresh session. This fires once per session; later calls are allowed.',
    );
}

const isMain = (() => {
    try {
        return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
})();
if (isMain) runHook('context-ceiling', main);

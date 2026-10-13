/**
 * output-budget.mjs: PreToolUse hook on Bash.
 *
 * Holds the context cost of a command, where bash-guard.mjs holds its safety:
 * the two evolve for different reasons and stay separate files
 * (P-2026-10-13-1930). It denies the common forms that pour a whole file, a
 * whole tree search, a whole commit or a whole build log into the context, and
 * its one-line reason names the bounded alternative. Like the other hooks it
 * FAILS OPEN, and a command it cannot classify with confidence is allowed: the
 * goal is to stop the expensive common cases, not to sandbox the shell.
 *
 *   a. cat, less, more on a file            -> Read with offset and limit
 *   b. sed -n on a file, without a line range or over 120 lines -> Read
 *   c. grep -r / -R, rg, unbounded          -> -l, -c, -m N (N <= 50)
 *   d. git show <rev> and git diff without --stat, --name-only or a path;
 *      git log without -n N / -N (N <= 30)  -> those flags
 *   e. npm test, npm run build | typecheck* | test*, npx (or npm exec) vitest |
 *      tsc | playwright, not through frontend/scripts/run-quiet.mjs -> the runner.
 *      The gates lane-run runs itself are its child processes, never a Bash
 *      tool call, so this hook does not see them and no exemption is needed.
 *
 * a to d also pass when the output is bounded: a later segment of the same
 * pipeline is `head`/`tail` (-n N, N <= 80), `wc` or `grep -c`, or stdout goes
 * to a file. e passes only through the runner, which keeps the whole log.
 *
 * Escape hatch: a command holding `# allow-large-output` passes, and one line
 * (ISO time, command cut at 300 characters) is appended to
 * .agent-logs/guard-overrides.log at the project root.
 *
 * Run by: node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/output-budget.mjs"
 */

import { appendFileSync, mkdirSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readInput, decide, runHook, parseShell } from './lib.mjs';

const COMMAND_MAX_CHARS = 100000;
const PAYLOAD_DEPTH = 3;
const OVERRIDE = '# allow-large-output';
const OVERRIDE_LOG_CHARS = 300;
const SED_MAX_LINES = 120;
const GREP_MAX_COUNT = 50;
const LOG_MAX_COUNT = 30;
const BOUND_MAX_LINES = 80;

/** frontend/scripts/hooks -> the repository root, when CLAUDE_PROJECT_DIR is not set */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
const PASSTHROUGH = new Set(['command', 'builtin', 'time', 'nohup', 'exec']);
const KEYWORDS = new Set(['do', 'then', 'else', 'elif', 'if', 'while', 'until', '!', '{']);
const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix', '--config-env']);
const PAGERS = new Set(['cat', 'less', 'more']);
const GREPS = new Set(['grep', 'egrep', 'fgrep', 'ugrep']);
const GREP_VALUE_LETTERS = 'ABCDdefm';
const RG_VALUE_LETTERS = 'ABCEMTdefgjmrt';
const SUMMARY_FLAGS = ['--stat', '--name-only', '--name-status', '--shortstat', '--numstat', '--dirstat', '--no-patch', '-s'];
const WHOLE_TREE = new Set(['.', './', ':/', '*']);
const NPM_VALUE_OPTIONS = new Set(['--prefix', '-C', '--workspace', '-w']);
const NPX_VALUE_OPTIONS = new Set(['-p', '--package']);
const NPM_TEST = new Set(['test', 't', 'tst']);
const NPM_RUN = new Set(['run', 'run-script', 'rum', 'urn']);
const TEST_TOOLS = new Set(['vitest', 'tsc', 'playwright']);

const BOUND_HINT = 'or bound it with | head -n N (N <= ' + BOUND_MAX_LINES + ').';

// ── Pipes and redirections ───────────────────────────────────────────────────
//
// parseShell reads a pipeline as a plain list of commands and drops every
// redirection, and this hook needs both: the pipe, to know what bounds a
// command, and a stdout redirection, to know that the output never reaches the
// context. So before parsing, a pipe and a stdout `>` become marker words. A
// marker that falls inside quotes or a heredoc body lands in data, where it is
// never a whole word and changes nothing the rules read.

const PIPE = '\u0001pipe';
const TO_FILE = '\u0001file';

function mark(src) {
    return src
        .replace(/(\d*)(&?)>>?\|?(&[\d-]*)?/g, (m, fd, amp, dup) => {
            if (dup !== undefined) return m; // >&2, 2>&1: still on a stream the tool captures
            if (amp || fd === '' || fd === '1') return ' ' + TO_FILE + ' ';
            return m; // 2> file: stderr only
        })
        .replace(/(?<![|\\])\|(?!\|)&?/g, ' ' + PIPE + ' ');
}

const isMarker = (w, m) => !w.opaque && w.text === m;

/** parseShell's commands regrouped as pipelines of segments { words, toFile }. */
function pipelines(commands) {
    const out = [];
    let open = null; // a pipeline whose line ended with `|`: the next command continues it
    for (const c of commands) {
        const segs = open || [];
        if (!open) out.push(segs);
        let cur = { words: [], toFile: false };
        for (let i = 0; i < c.words.length; i++) {
            const w = c.words[i];
            if (isMarker(w, PIPE)) {
                segs.push(cur);
                cur = { words: [], toFile: false };
            } else if (isMarker(w, TO_FILE)) {
                cur.toFile = true;
                i++; // the target
            } else cur.words.push(w);
        }
        const last = c.words[c.words.length - 1];
        open = last && isMarker(last, PIPE) ? segs : null;
        if (!open) segs.push(cur);
    }
    return out;
}

// ── Resolving a simple command ───────────────────────────────────────────────

/** Skips assignments, shell keywords and the wrappers the permission engine does not strip. */
function resolveCommand(words) {
    let i = 0;
    for (;;) {
        while (i < words.length && !words[i].opaque && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i].text)) i++;
        const w = words[i];
        if (!w || w.opaque) return null;
        const name = basename(w.text);
        if (PASSTHROUGH.has(name) || KEYWORDS.has(w.text)) {
            i++;
            continue;
        }
        if (name === 'env') {
            i++;
            while (i < words.length && words[i].text.startsWith('-')) i += words[i].text === '-u' ? 2 : 1;
            continue;
        }
        return { name, args: words.slice(i + 1) };
    }
}

/** The payload of `sh -c PAYLOAD` (also -lc, -ec), or null. */
function shellPayload(args) {
    for (let i = 0; i < args.length; i++) {
        if (/^-[A-Za-z]*c[A-Za-z]*$/.test(args[i].text)) return args[i + 1] ? args[i + 1].text : null;
    }
    return null;
}

// ── What bounds a command ────────────────────────────────────────────────────

/** head and tail: true when they print at most BOUND_MAX_LINES lines. */
function linesBound(args) {
    let n = 10;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        const t = a.text;
        if (a.opaque) continue;
        let v = null;
        if (t === '-f' || t === '-F' || t === '--follow' || t.startsWith('--follow=')) return false;
        if (t === '-n' || t === '--lines') {
            const next = args[++i];
            if (!next) return false;
            if (next.opaque) return true; // a count the parser cannot know: not classifiable
            v = next.text;
        } else if (/^-n./.test(t)) v = t.slice(2);
        else if (t.startsWith('--lines=')) v = t.slice(8);
        else if (/^-\d+$/.test(t)) v = t.slice(1);
        else continue;
        if (!/^\d+$/.test(v)) return false; // +N, -N on GNU: from or up to a line, not a count
        n = Number(v);
    }
    return n <= BOUND_MAX_LINES;
}

/** A pipeline segment that bounds what flows into it. */
function bounds(seg) {
    const r = resolveCommand(seg.words);
    if (!r) return false;
    if (r.name === 'head' || r.name === 'tail') return linesBound(r.args);
    if (r.name === 'wc') return true;
    if (GREPS.has(r.name)) {
        const f = grepFlags(r.args, GREP_VALUE_LETTERS);
        return f.count || f.quiet;
    }
    return false;
}

function isBound(segs, i) {
    if (segs[i].toFile) return true;
    for (let j = i + 1; j < segs.length; j++) if (segs[j].toFile || bounds(segs[j])) return true;
    return false;
}

// ── a. cat, less, more ───────────────────────────────────────────────────────

function pagerRule(name, args) {
    let afterDD = false;
    const files = args.filter((a) => {
        if (!afterDD && a.text === '--' && !a.opaque) {
            afterDD = true;
            return false;
        }
        if (a.opaque) return true;
        if (!afterDD && (a.text.startsWith('-') || a.text.startsWith('+'))) return false;
        return a.text !== '-' && !a.text.startsWith('/dev/');
    });
    if (files.length === 0) return null; // reads stdin, or writes a heredoc
    return name + ' on a file puts the whole file in the context: use the Read tool with offset and limit, ' + BOUND_HINT;
}

// ── b. sed -n ────────────────────────────────────────────────────────────────

/** The lines a sed -n script prints: { kind: 'none' | 'open' | 'unknown' | 'lines', n }. */
function sedLines(script) {
    let lines = 0;
    let ranges = 0;
    let unknown = false;
    for (const raw of script.split(/[;\n]/)) {
        const cmd = raw.trim();
        if (cmd === '' || /^(\d+|\$)?\s*q$/.test(cmd)) continue;
        const m = /^(\d+|\$)(?:\s*,\s*(\d+|\$))?\s*p$/.exec(cmd);
        if (!m) {
            unknown = true;
            continue;
        }
        ranges++;
        if (m[2] === '$' && m[1] !== '$') return { kind: 'open', n: 0 };
        if (m[1] === '$') lines += 1;
        else {
            const from = Number(m[1]);
            const to = m[2] === undefined ? from : Number(m[2]);
            lines += Math.max(to - from + 1, 1);
        }
    }
    if (ranges === 0) return { kind: 'none', n: 0 };
    return unknown ? { kind: 'unknown', n: 0 } : { kind: 'lines', n: lines };
}

function sedRule(args) {
    let quiet = false;
    let skip = false; // in place, or a script from a file: nothing this hook can read
    const scripts = [];
    const operands = [];
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        const t = a.text;
        if (a.opaque || !t.startsWith('-') || t === '-') {
            operands.push(a);
            continue;
        }
        if (t === '--') {
            operands.push(...args.slice(i + 1));
            break;
        }
        if (t.startsWith('--')) {
            const eq = t.indexOf('=');
            const name = eq === -1 ? t : t.slice(0, eq);
            if (name === '--quiet' || name === '--silent') quiet = true;
            else if (name === '--in-place' || name === '--file') skip = true;
            else if (name === '--expression') {
                const v = eq === -1 ? args[++i] : { text: t.slice(eq + 1), opaque: false };
                if (v) scripts.push(v);
            }
            continue;
        }
        for (let k = 1; k < t.length; k++) {
            const ch = t[k];
            if (ch === 'n') quiet = true;
            else if (ch === 'i') {
                skip = true;
                break;
            } else if (ch === 'e' || ch === 'f' || ch === 'l') {
                const rest = t.slice(k + 1);
                const v = rest ? { text: rest, opaque: false } : args[++i];
                if (ch === 'e' && v) scripts.push(v);
                if (ch === 'f') skip = true;
                break;
            }
        }
    }
    if (!quiet || skip) return null;
    if (scripts.length === 0 && operands.length > 0) scripts.push(operands.shift());
    if (operands.length === 0 || scripts.length === 0) return null; // reads stdin: a filter, not a read of a file
    if (scripts.some((s) => s.opaque)) return null;
    const r = sedLines(scripts.map((s) => s.text).join('\n'));
    if (r.kind === 'none') return 'sed -n without a line range: use the Read tool with offset and limit (grep -n for a pattern).';
    if (r.kind === 'open') return 'sed -n with an open range (N,$): use the Read tool with offset and limit.';
    if (r.kind === 'lines' && r.n > SED_MAX_LINES) {
        return 'sed -n prints ' + r.n + ' lines, over ' + SED_MAX_LINES + ': use the Read tool with offset and limit.';
    }
    return null;
}

// ── c. grep -r, rg ───────────────────────────────────────────────────────────

/** A max count: a number, 0 when the parser cannot know it (not classifiable), null when absent or malformed. */
function maxOf(v) {
    if (!v) return null;
    if (v.opaque) return 0;
    return /^\d+$/.test(v.text) ? Number(v.text) : null;
}

function grepFlags(args, valueLetters) {
    const f = { recursive: false, list: false, count: false, quiet: false, max: null };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        const t = a.text;
        if (a.opaque || !t.startsWith('-') || t === '-') continue;
        if (t === '--') break;
        if (t.startsWith('--')) {
            const eq = t.indexOf('=');
            const name = eq === -1 ? t : t.slice(0, eq);
            const inline = eq === -1 ? null : { text: t.slice(eq + 1), opaque: false };
            if (name === '--recursive' || name === '--dereference-recursive') f.recursive = true;
            else if (name === '--files-with-matches') f.list = true;
            else if (name === '--count' || name === '--count-matches') f.count = true;
            else if (name === '--quiet' || name === '--silent') f.quiet = true;
            else if (name === '--max-count') f.max = maxOf(inline || args[++i]);
            else if (name === '--directories') {
                const v = inline || args[++i];
                if (v && v.text === 'recurse') f.recursive = true;
            }
            continue;
        }
        for (let k = 1; k < t.length; k++) {
            const ch = t[k];
            if (valueLetters.includes(ch)) {
                const rest = t.slice(k + 1);
                const v = rest ? { text: rest, opaque: false } : args[++i];
                if (ch === 'm') f.max = maxOf(v);
                else if (ch === 'd' && valueLetters === GREP_VALUE_LETTERS && v && v.text === 'recurse') f.recursive = true;
                break;
            }
            if (ch === 'r' || ch === 'R') f.recursive = true;
            else if (ch === 'l') f.list = true;
            else if (ch === 'c') f.count = true;
            else if (ch === 'q') f.quiet = true;
        }
    }
    return f;
}

function searchRule(name, args) {
    const rg = name === 'rg';
    const f = grepFlags(args, rg ? RG_VALUE_LETTERS : GREP_VALUE_LETTERS);
    if (!rg && !f.recursive) return null;
    if (f.list || f.count || f.quiet || (f.max !== null && f.max <= GREP_MAX_COUNT)) return null;
    return (
        (rg ? 'rg' : 'recursive grep') + ' with unbounded output: add -l, -c or -m N (N <= ' + GREP_MAX_COUNT + '), ' + BOUND_HINT
    );
}

// ── d. git show, git diff, git log ───────────────────────────────────────────

/** git's own options skipped: the subcommand and its arguments, or null. */
function gitCall(args) {
    let j = 0;
    while (j < args.length) {
        const t = args[j].text;
        if (GIT_VALUE_OPTIONS.has(t)) j += 2;
        else if (t.startsWith('-')) j++;
        else break;
    }
    if (j >= args.length) return null;
    return { sub: args[j].text, args: args.slice(j + 1) };
}

function hasSummary(args) {
    return args.some((a) => !a.opaque && SUMMARY_FLAGS.some((f) => a.text === f || a.text.startsWith(f + '=')));
}

/** The positional arguments before `--`, and the pathspecs after it. */
function revsAndPaths(args) {
    const dd = args.findIndex((a) => !a.opaque && a.text === '--');
    const before = (dd === -1 ? args : args.slice(0, dd)).filter((a) => a.opaque || !a.text.startsWith('-'));
    return { before, after: dd === -1 ? [] : args.slice(dd + 1) };
}

const narrows = (a) => a.opaque || !WHOLE_TREE.has(a.text);

/** A positional that names a path on disk; one the parser cannot know may be one. */
function onDisk(a, ctx) {
    if (a.opaque) return true;
    if (WHOLE_TREE.has(a.text) || a.text.includes(':')) return false;
    try {
        statSync(resolve(ctx.cwd, a.text));
        return true;
    } catch {
        return false; // a revision, or a path that is not there
    }
}

function showRule(args, ctx) {
    if (hasSummary(args)) return null;
    const { before, after } = revsAndPaths(args);
    if (after.some(narrows)) return null;
    if (before.slice(1).some((a) => onDisk(a, ctx))) return null; // git show REV PATH
    if (before.some((a) => !a.opaque && a.text.includes(':') && !a.text.startsWith(':/'))) {
        return 'git show REV:PATH prints the whole file: write it to a file and Read it with offset and limit, ' + BOUND_HINT;
    }
    return 'git show without --stat, --name-only or a path: add one of them, ' + BOUND_HINT;
}

function diffRule(args, ctx) {
    if (hasSummary(args)) return null;
    const { before, after } = revsAndPaths(args);
    if (after.some(narrows)) return null;
    if (before.some((a) => onDisk(a, ctx))) return null; // git diff PATH, git diff --no-index A B
    return 'git diff without --stat, --name-only or a path: add one of them, ' + BOUND_HINT;
}

/** The commit count a git log asks for, 0 when the parser cannot know it, null when absent. */
function logCount(args) {
    let n = null;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        const t = a.text;
        if (a.opaque) continue;
        if (t === '--') break;
        let v;
        if (t === '-n' || t === '--max-count') {
            const next = args[++i];
            if (!next) continue;
            if (next.opaque) return 0;
            v = next.text;
        } else if (/^-n\d+$/.test(t)) v = t.slice(2);
        else if (/^-\d+$/.test(t)) v = t.slice(1);
        else if (t.startsWith('--max-count=')) v = t.slice(12);
        else continue;
        if (/^\d+$/.test(v)) n = n === null ? Number(v) : Math.min(n, Number(v));
    }
    return n;
}

function logRule(args) {
    const n = logCount(args);
    if (n !== null && n <= LOG_MAX_COUNT) return null;
    return 'git log without -n N (N <= ' + LOG_MAX_COUNT + '): add -n N or -N, ' + BOUND_HINT;
}

function gitRule(args, ctx) {
    const g = gitCall(args);
    if (!g) return null;
    if (g.sub === 'show') return showRule(g.args, ctx);
    if (g.sub === 'diff') return diffRule(g.args, ctx);
    if (g.sub === 'log') return logRule(g.args);
    return null;
}

// ── e. builds, tests, type-checks ────────────────────────────────────────────

/** The first positional word from index i on, the options skipped: { word, at } or null. */
function positional(args, i, valueOptions) {
    while (i < args.length) {
        const a = args[i];
        if (a.opaque) return null;
        if (valueOptions.has(a.text)) i += 2;
        else if (a.text.startsWith('-')) i++;
        else return { word: a.text, at: i };
    }
    return null;
}

function runnerReason(what) {
    return (
        what + ' outside the quiet runner: node frontend/scripts/run-quiet.mjs LABEL -- ' + what +
        ' (from frontend/: node scripts/run-quiet.mjs) keeps the whole log in .agent-logs/ and prints the exit code, the error lines and the tail.'
    );
}

function toolRule(args, via) {
    const t = positional(args, 0, NPX_VALUE_OPTIONS);
    if (!t) return null;
    const tool = t.word.replace(/^(@?[^@]+)@.*$/, '$1');
    return TEST_TOOLS.has(tool) ? runnerReason(via + ' ' + tool) : null;
}

function npmRule(args) {
    const sub = positional(args, 0, NPM_VALUE_OPTIONS);
    if (!sub) return null;
    if (NPM_TEST.has(sub.word)) return runnerReason('npm ' + sub.word);
    if (NPM_RUN.has(sub.word)) {
        const s = positional(args, sub.at + 1, NPM_VALUE_OPTIONS);
        if (s && (s.word === 'build' || s.word.startsWith('typecheck') || s.word.startsWith('test'))) return runnerReason('npm run ' + s.word);
        return null;
    }
    if (sub.word === 'exec' || sub.word === 'x') return toolRule(args.slice(sub.at + 1), 'npm ' + sub.word);
    return null;
}

/** A finding { reason, always }: `always` is not lifted by a bound (rule e). */
function classify(r, ctx) {
    const { name, args } = r;
    let reason = null;
    if (PAGERS.has(name)) reason = pagerRule(name, args);
    else if (name === 'sed') reason = sedRule(args);
    else if (GREPS.has(name) || name === 'rg') reason = searchRule(name, args);
    else if (name === 'git') reason = gitRule(args, ctx);
    else if (name === 'npm') return wrap(npmRule(args), true);
    else if (name === 'npx') return wrap(toolRule(args, 'npx'), true);
    else if (TEST_TOOLS.has(name)) return wrap(runnerReason(name), true);
    return wrap(reason, false);
}

const wrap = (reason, always) => (reason ? { reason, always } : null);

// ── The walk ─────────────────────────────────────────────────────────────────

function analyze(commands, ctx, depth, outerBound, findings) {
    for (const segs of pipelines(commands)) {
        for (let i = 0; i < segs.length; i++) {
            const r = resolveCommand(segs[i].words);
            if (!r) continue;
            const bound = outerBound || isBound(segs, i);
            if (SHELLS.has(r.name) || r.name === 'eval') {
                const payload = r.name === 'eval' ? r.args.map((a) => a.text).join(' ') : shellPayload(r.args);
                if (payload !== null && depth < PAYLOAD_DEPTH) analyze(parseShell(mark(payload)), ctx, depth + 1, bound, findings);
                continue;
            }
            const f = classify(r, ctx);
            if (f && (f.always || !bound)) findings.push(f.reason);
        }
    }
}

function logOverride(command) {
    try {
        const dir = resolve(process.env.CLAUDE_PROJECT_DIR || REPO_ROOT, '.agent-logs');
        mkdirSync(dir, { recursive: true });
        const line = command.replace(/\r?\n/g, '\\n').slice(0, OVERRIDE_LOG_CHARS);
        appendFileSync(resolve(dir, 'guard-overrides.log'), new Date().toISOString() + ' ' + line + '\n');
    } catch {
        /* the record is not a gate: a failed write lets the command through */
    }
}

function main() {
    const input = readInput();
    const command = input && input.tool_input && input.tool_input.command;
    if (typeof command !== 'string' || command.length === 0 || command.length > COMMAND_MAX_CHARS) return;
    if (command.includes(OVERRIDE)) {
        logOverride(command);
        return;
    }
    const ctx = { cwd: typeof input.cwd === 'string' && input.cwd ? input.cwd : process.cwd() };
    const findings = [];
    analyze(parseShell(mark(command)), ctx, 0, false, findings);
    if (findings.length > 0) decide('deny', 'output-budget: ' + Array.from(new Set(findings)).join(' '));
}

runHook('output-budget', main);

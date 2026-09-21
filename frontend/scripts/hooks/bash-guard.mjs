/**
 * bash-guard.mjs: PreToolUse hook on Bash.
 *
 * Holds what a deny pattern cannot say, by reading the whole command string
 * (tool_input.command, heredocs and compound commands included). The fixed
 * forms live in permissions.deny of .claude/settings.json; this hook is the
 * layer above it and it FAILS OPEN: a crash, a timeout or a missing node lets
 * the call through (hooks.md, Exit code output). It only ever adds refusals:
 * the `ask` on `git commit*` in settings stays the human gate.
 *
 *   git commit   deny unless: a pathspec follows `--` (CLAUDE.md 6.1, P13);
 *                the message, when it is in the string or in a readable -F
 *                file, has a `Model:` trailer (P6) and a subject within 72
 *                characters once a trailing " (P-YYYY-MM-DD-HHmm)" is dropped
 *                (CLAUDE.md 6.2); the pathspec does not mix docs and code (P13).
 *                Those checks are skipped while a merge, cherry-pick or revert is
 *                in progress: git refuses a pathspec there (RC-14, P14).
 *                Always denied: a short-flag token holding `n` (-n, -qn, -nq; for
 *                git commit that letter is --no-verify only, CLAUDE.md 6.3).
 *   git stash, and the whole-tree forms of RC-13-bis (reset --hard, clean,
 *   restore and checkout of `.` or a directory)
 *                ask, in any form found after quotes and heredocs are read:
 *                the wrappers (`sh -c`, `git -C`, `/usr/bin/git`, `env`, `eval`)
 *                are outside a Bash deny pattern (RC-13-bis, P13).
 *
 * Run by: node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/bash-guard.mjs"
 */

import { readFileSync, existsSync, realpathSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, resolve, relative, isAbsolute } from 'node:path';
import { readInput, decide, runHook, parseShell, stripPromptIdSuffix } from './lib.mjs';

const SUBJECT_MAX = 72;
const COMMAND_MAX_CHARS = 100000;
const PAYLOAD_DEPTH = 3;

const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
const PASSTHROUGH = new Set(['command', 'builtin', 'time', 'nohup', 'exec']);
const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--super-prefix', '--config-env']);
const COMMIT_SHORT_VALUE = new Set(['m', 'F', 'C', 'c', 't']);
const COMMIT_LONG_VALUE = new Set([
    '--reuse-message', '--reedit-message', '--template', '--author', '--date',
    '--cleanup', '--trailer', '--fixup', '--squash', '--pathspec-from-file',
]);

// ── Resolving a simple command ───────────────────────────────────────────────

/** Skips assignments and the wrappers the permission engine does not strip. */
function resolveCommand(words) {
    let i = 0;
    for (;;) {
        while (i < words.length && !words[i].opaque && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i].text)) i++;
        const w = words[i];
        if (!w || w.opaque) return null;
        const name = basename(w.text);
        if (PASSTHROUGH.has(name)) {
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

// ── git commit ───────────────────────────────────────────────────────────────

function parseCommitArgs(args) {
    const r = { paths: null, messages: [], files: [], noVerify: false };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        const t = a.text;
        if (r.paths) {
            r.paths.push(a);
            continue;
        }
        if (t === '--' && !a.opaque) {
            r.paths = [];
            continue;
        }
        if (t.startsWith('--')) {
            const eq = t.indexOf('=');
            const name = eq === -1 ? t : t.slice(0, eq);
            const inline = eq === -1 ? null : { text: t.slice(eq + 1), opaque: a.opaque };
            if (name === '--message' || name === '--file') {
                const v = inline || args[++i];
                if (v) (name === '--message' ? r.messages : r.files).push(v);
            } else if (COMMIT_LONG_VALUE.has(name) && inline === null) i++;
            continue;
        }
        if (t.startsWith('-') && t.length > 1) {
            for (let k = 1; k < t.length; k++) {
                const ch = t[k];
                if (COMMIT_SHORT_VALUE.has(ch)) {
                    const rest = t.slice(k + 1);
                    const v = rest ? { text: rest, opaque: a.opaque } : args[++i];
                    if (v && ch === 'm') r.messages.push(v);
                    else if (v && ch === 'F') r.files.push(v);
                    break;
                }
                if (ch === 'u' || ch === 'S') break;
                if (ch === 'n') r.noVerify = true;
            }
        }
    }
    return r;
}

/** The message text when the string or a readable -F file holds it, else null. */
function commitMessage(parsed, heredocs, cwd) {
    if (parsed.messages.length > 0) {
        if (parsed.messages.some((m) => m.opaque)) return null;
        return parsed.messages.map((m) => m.text).join('\n\n');
    }
    if (parsed.files.length > 0) {
        const f = parsed.files[0];
        if (f.opaque) return null;
        if (f.text === '-') return heredocs.length > 0 ? heredocs[0].body : null;
        try {
            return readFileSync(resolve(cwd, f.text), 'utf8');
        } catch {
            return null;
        }
    }
    return null;
}

function gitOutput(args, cwd) {
    try {
        return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim();
    } catch {
        return null; // not a repository, or no git: nothing to say
    }
}

/** A merge, cherry-pick or revert waiting for its commit: git refuses a pathspec there. */
function operationInProgress(cwd) {
    for (const ref of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD']) {
        const p = gitOutput(['rev-parse', '--git-path', ref], cwd);
        if (p && existsSync(resolve(cwd, p))) return true;
    }
    return false;
}

/** docs/**, and the two normative Markdown names that sit outside docs/. */
function isDocPath(p) {
    const b = basename(p);
    return p === 'docs' || p.startsWith('docs/') || b === 'CLAUDE.md' || b === 'AGENTS.md';
}

/** A pathspec as git sees it, relative to the repository root (cwd may be a subdirectory or a symlink). */
function repoRelative(p, cwd, top) {
    if (!top) return p.replace(/^\.\//, '');
    let base = cwd;
    try {
        base = realpathSync(cwd);
    } catch {
        /* the cwd is gone: resolve against what was given */
    }
    const rel = relative(top, isAbsolute(p) ? p : resolve(base, p)).split('\\').join('/');
    return rel.startsWith('..') ? p : rel;
}

function checkCommit(args, heredocs, ctx, findings) {
    const parsed = parseCommitArgs(args);
    if (parsed.noVerify) {
        findings.push({
            kind: 'deny',
            reason:
                'CLAUDE.md 6.3: never skip the pre-commit hooks. On git commit the short flag n is --no-verify, ' +
                'alone or in a cluster (-n, -qn, -nq).',
        });
    }
    if (ctx.inProgress()) return;
    const violations = [];

    if (!parsed.paths || parsed.paths.length === 0) {
        violations.push(
            'CLAUDE.md 6.1 and docs/PROTOCOL.md P13: git commit commits the whole index, and another lane may have staged work. ' +
                'Pass the pathspec to the commit itself: git commit -m "..." -- <paths>.',
        );
    }

    const message = commitMessage(parsed, heredocs, ctx.cwd);
    if (message !== null) {
        const first = message.split('\n').find((l) => l.trim() !== '') || '';
        const length = Array.from(stripPromptIdSuffix(first)).length;
        if (length > SUBJECT_MAX) {
            violations.push(
                'CLAUDE.md 6.2: the subject is ' + length + ' characters, over ' + SUBJECT_MAX +
                    ' (a trailing " (P-YYYY-MM-DD-HHmm)" is not counted).',
            );
        }
        if (!/^Model: \S/m.test(message)) {
            violations.push('docs/PROTOCOL.md P6: the message has no "Model: <vendor> <name> <version>" trailer.');
        }
    }

    if (parsed.paths && parsed.paths.length > 0 && parsed.paths.every((p) => !p.opaque)) {
        const top = ctx.top();
        const rels = parsed.paths.map((p) => repoRelative(p.text, ctx.cwd, top));
        const docs = rels.filter(isDocPath);
        const code = rels.filter((p) => !isDocPath(p));
        if (docs.length > 0 && code.length > 0) {
            violations.push(
                'docs/PROTOCOL.md P13: docs and code never in the same commit; the pathspec mixes docs (' +
                    docs.join(', ') + ') with code (' + code.join(', ') + ').',
            );
        }
    }

    for (const reason of violations) findings.push({ kind: 'deny', reason });
}

// ── The whole-tree forms of RC-13-bis ────────────────────────────────────────

/** `.`, a trailing slash, the top-level magic, or an existing directory. */
function isTreePath(p, cwd, allowStat) {
    if (p === '.' || p === './' || p === ':/' || p.endsWith('/')) return true;
    if (!allowStat) return false;
    try {
        return statSync(resolve(cwd, p)).isDirectory();
    } catch {
        return false; // a path that does not exist is not a directory
    }
}

/** Pathspecs of `git restore`: every argument that is not an option or the value of -s/--source. */
function restorePaths(args) {
    const paths = [];
    let afterDD = false;
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (afterDD) paths.push(a);
        else if (a.text === '--' && !a.opaque) afterDD = true;
        else if (a.text === '-s' || a.text === '--source') i++;
        else if (!a.text.startsWith('-')) paths.push(a);
    }
    return paths;
}

/** Pathspecs of `git checkout`: after `--` any tree path counts, before it only `.` and a trailing slash (a bare name may be a branch). */
function checkoutPaths(args) {
    const dd = args.findIndex((a) => a.text === '--' && !a.opaque);
    if (dd !== -1) return { paths: args.slice(dd + 1), allowStat: true };
    return { paths: args.filter((a) => !a.text.startsWith('-')), allowStat: false };
}

/** What the command is, when it discards the work of every lane on the tree; else null. */
function wholeTreeForm(g, cwd) {
    if (g.sub === 'reset') return g.args.some((a) => !a.opaque && a.text === '--hard') ? 'git reset --hard' : null;
    if (g.sub === 'clean') return 'git clean';
    if (g.sub === 'restore') {
        return restorePaths(g.args).some((p) => !p.opaque && isTreePath(p.text, cwd, true))
            ? 'git restore of the tree or a directory'
            : null;
    }
    if (g.sub === 'checkout') {
        const { paths, allowStat } = checkoutPaths(g.args);
        return paths.some((p) => !p.opaque && isTreePath(p.text, cwd, allowStat))
            ? 'git checkout of the tree or a directory'
            : null;
    }
    return null;
}

// ── The walk ─────────────────────────────────────────────────────────────────

function analyze(commands, ctx, depth, findings) {
    for (const c of commands) {
        const r = resolveCommand(c.words);
        if (!r) continue;
        if (SHELLS.has(r.name)) {
            const payload = shellPayload(r.args);
            if (payload !== null && depth < PAYLOAD_DEPTH) analyze(parseShell(payload), ctx, depth + 1, findings);
        } else if (r.name === 'eval') {
            if (depth < PAYLOAD_DEPTH) analyze(parseShell(r.args.map((a) => a.text).join(' ')), ctx, depth + 1, findings);
        } else if (r.name === 'git') {
            const g = gitCall(r.args);
            if (!g) continue;
            if (g.sub === 'stash') {
                findings.push({
                    kind: 'ask',
                    reason:
                        'docs/PROTOCOL.md P13 and RC-13-bis: no git stash on a shared tree. This form is outside the deny pattern ' +
                        'of .claude/settings.json; confirm only if this tree is yours alone.',
                });
            } else if (g.sub === 'commit') checkCommit(g.args, c.heredocs, ctx, findings);
            else {
                const form = wholeTreeForm(g, ctx.cwd);
                if (form) {
                    findings.push({
                        kind: 'ask',
                        reason:
                            'docs/PROTOCOL.md P9 (RC-13-bis) and P13: ' + form + ' discards the work of every lane on this tree. ' +
                            'This form is outside the deny patterns of .claude/settings.json; confirm only if this tree is yours alone.',
                    });
                }
            }
        }
    }
}

function makeContext(cwdInput) {
    const cwd = typeof cwdInput === 'string' && cwdInput ? cwdInput : process.cwd();
    let progress;
    let top;
    return {
        cwd,
        inProgress: () => (progress === undefined ? (progress = operationInProgress(cwd)) : progress),
        top: () => (top === undefined ? (top = gitOutput(['rev-parse', '--show-toplevel'], cwd)) : top),
    };
}

function main() {
    const input = readInput();
    const command = input && input.tool_input && input.tool_input.command;
    if (typeof command !== 'string' || command.length === 0 || command.length > COMMAND_MAX_CHARS) return;

    const findings = [];
    analyze(parseShell(command), makeContext(input.cwd), 0, findings);

    const denies = findings.filter((f) => f.kind === 'deny');
    const asks = findings.filter((f) => f.kind === 'ask');
    if (denies.length > 0) decide('deny', 'bash-guard: ' + denies.map((f) => f.reason).join(' '));
    else if (asks.length > 0) decide('ask', 'bash-guard: ' + asks[0].reason);
}

runHook('bash-guard', main);

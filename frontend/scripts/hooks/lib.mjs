/**
 * lib.mjs: shared by the harness hooks under frontend/scripts/hooks/.
 *
 * Plain ES module, no TypeScript syntax, nothing outside node:*: the hooks are
 * started by the launcher's `node` (P-2026-09-21-1620, decision 10), which on
 * this Mac can be v16, v18, v23 or v26 depending on the PATH the launcher had.
 * Nothing here needs more than node 16.
 *
 * A hook FAILS OPEN. Any exit code other than 2 is a non-blocking error and
 * the tool call proceeds (hooks.md, Exit code output), so an internal error
 * must end quietly with exit 0; the fail-closed layer is the deny list in
 * .claude/settings.json. runHook() is that contract in one place.
 */

import { readFileSync } from 'node:fs';

/** Stands in for text the parser cannot know: $VAR, $(...), backticks. */
export const OPAQUE = '￼';

const MAX_DEPTH = 12;

/** The hook input (stdin JSON) as an object, or null on anything unexpected. */
export function readInput() {
    try {
        const value = JSON.parse(readFileSync(0, 'utf8'));
        return value && typeof value === 'object' ? value : null;
    } catch {
        return null;
    }
}

/** PreToolUse decision: JSON on stdout, exit 0 (hooks.md, PreToolUse decision control). */
export function decide(decision, reason) {
    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: decision,
                permissionDecisionReason: reason,
            },
        }) + '\n',
    );
}

/** Runs a hook body and never lets an error turn into a block. */
export function runHook(name, main) {
    try {
        main();
    } catch (err) {
        process.stderr.write('[' + name + '] internal error, failing open: ' + (err && err.message) + '\n');
    }
    process.exitCode = 0;
}

/** CLAUDE.md 6.2: the 72 characters do not count a trailing " (P-YYYY-MM-DD-HHmm)". */
export function stripPromptIdSuffix(subject) {
    return subject.replace(/ \(P-\d{4}-\d{2}-\d{2}-\d{4}\)$/, '');
}

// ── A small shell reader ─────────────────────────────────────────────────────
//
// Not a shell: it reads only what the guards need. It splits a command line
// into simple commands and words, resolving quotes and heredoc bodies, so that
// text which is DATA (a commit message, a quoted string, a heredoc) is never
// mistaken for a command, and a command hidden behind `$(...)` or a subshell is
// still found. Anything it cannot know becomes OPAQUE and the callers treat
// opaque text as unknown, never as a match.
//
// parseShell(src) -> [{ words: [{ text, opaque }], heredocs: [{ tag, body }] }]
// Nested commands ($(...), backticks, subshells) are flattened into the list.

export function parseShell(src) {
    const out = [];
    parseSequence(src, 0, null, out, 0);
    return out;
}

function parseSequence(src, start, closer, out, depth) {
    if (depth > MAX_DEPTH) throw new Error('shell nesting too deep');
    let pos = start;
    let cmd = null;
    let word = null;
    let discardNext = false; // the next word is a redirect target
    let parens = 0;
    const pending = []; // heredocs waiting for the newline that starts their body

    const ensureCmd = () => {
        if (!cmd) {
            cmd = { words: [], heredocs: [] };
            out.push(cmd);
        }
        return cmd;
    };
    const endWord = () => {
        if (!word) return;
        if (discardNext) discardNext = false;
        else ensureCmd().words.push(word);
        word = null;
    };
    const endCommand = () => {
        endWord();
        cmd = null;
        discardNext = false;
    };
    const addText = (text, opaque) => {
        if (!word) word = { text: '', opaque: false };
        word.text += text;
        if (opaque) word.opaque = true;
    };

    while (pos < src.length) {
        const c = src[pos];

        if (c === '\\') {
            if (src[pos + 1] === '\n') pos += 2;
            else if (pos + 1 < src.length) {
                addText(src[pos + 1], false);
                pos += 2;
            } else pos++;
            continue;
        }
        if (c === "'") {
            const end = src.indexOf("'", pos + 1);
            const stop = end === -1 ? src.length : end;
            addText(src.slice(pos + 1, stop), false);
            pos = stop + 1;
            continue;
        }
        if (c === '"') {
            pos = parseDouble(src, pos + 1, addText, out, depth);
            continue;
        }
        if (c === '$' || c === '`') {
            const e = readExpansion(src, pos, out, depth);
            addText(e.text, e.opaque);
            pos = e.next;
            continue;
        }
        if (c === '#' && !word) {
            const nl = src.indexOf('\n', pos);
            pos = nl === -1 ? src.length : nl;
            continue;
        }
        if (c === ' ' || c === '\t' || c === '\r') {
            endWord();
            pos++;
            continue;
        }
        if (c === '\n') {
            endWord();
            pos = readHeredocBodies(src, pos + 1, pending);
            endCommand();
            continue;
        }
        if (c === '<' && src[pos + 1] === '<' && src[pos + 2] !== '<') {
            endWord();
            let p = pos + 2;
            let strip = false;
            if (src[p] === '-') {
                strip = true;
                p++;
            }
            while (src[p] === ' ' || src[p] === '\t') p++;
            let tag = '';
            while (p < src.length && !/[\s;&|<>()]/.test(src[p])) {
                const ch = src[p];
                if (ch === "'" || ch === '"') {
                    const end = src.indexOf(ch, p + 1);
                    const stop = end === -1 ? src.length : end;
                    tag += src.slice(p + 1, stop);
                    p = stop + 1;
                } else if (ch === '\\') {
                    tag += src[p + 1] || '';
                    p += 2;
                } else {
                    tag += ch;
                    p++;
                }
            }
            pending.push({ tag, strip, cmd: ensureCmd() });
            pos = p;
            continue;
        }
        if (c === '<' || c === '>') {
            // a plain redirection: drop the fd digit before it, then the target word
            if (word && !word.opaque && /^\d+$/.test(word.text)) word = null;
            else endWord();
            pos++;
            while (pos < src.length && '<>&|'.includes(src[pos])) pos++;
            discardNext = true;
            continue;
        }
        if (c === '&' && src[pos + 1] === '>') {
            endWord();
            pos += 2;
            if (src[pos] === '>') pos++;
            discardNext = true;
            continue;
        }
        if (c === ';' || c === '|' || c === '&') {
            endCommand();
            pos += src[pos + 1] === c ? 2 : 1;
            if (c === '|' && src[pos] === '&') pos++;
            continue;
        }
        if (c === '(') {
            endCommand();
            parens++;
            pos++;
            continue;
        }
        if (c === ')') {
            endCommand();
            pos++;
            if (parens > 0) parens--;
            else if (closer === ')') return pos;
            continue;
        }
        addText(c, false);
        pos++;
    }
    endCommand();
    return pos;
}

function parseDouble(src, start, addText, out, depth) {
    let pos = start;
    addText('', false); // a quoted string is a word even when it is empty
    while (pos < src.length) {
        const c = src[pos];
        if (c === '"') return pos + 1;
        if (c === '\\') {
            const n = src[pos + 1];
            if (n === '\n') pos += 2;
            else if (n === '"' || n === '\\' || n === '$' || n === '`') {
                addText(n, false);
                pos += 2;
            } else {
                addText('\\', false);
                pos++;
            }
            continue;
        }
        if (c === '$' || c === '`') {
            const e = readExpansion(src, pos, out, depth);
            addText(e.text, e.opaque);
            pos = e.next;
            continue;
        }
        addText(c, false);
        pos++;
    }
    return pos;
}

// $(...), backticks, ${...} and $VAR. The commands inside a substitution are
// appended to `out` so that a guard sees them; the one substitution whose
// value is known is `$(cat <<'TAG' ... TAG)`, the way a commit message is
// passed, and it resolves to the heredoc body.
function readExpansion(src, pos, out, depth) {
    if (src[pos] === '`') {
        let end = pos + 1;
        while (end < src.length && src[end] !== '`') end += src[end] === '\\' ? 2 : 1;
        parseSequence(src.slice(pos + 1, end), 0, null, out, depth + 1);
        return { text: OPAQUE, opaque: true, next: end + 1 };
    }
    const n = src[pos + 1];
    if (n === '(') {
        const before = out.length;
        const next = parseSequence(src, pos + 2, ')', out, depth + 1);
        const inner = out.slice(before);
        const only = inner[0];
        if (inner.length === 1 && only.words.length === 1 && only.words[0].text === 'cat' && only.heredocs.length === 1) {
            return { text: only.heredocs[0].body.replace(/\n+$/, ''), opaque: false, next };
        }
        return { text: OPAQUE, opaque: true, next };
    }
    if (n === '{') {
        let level = 1;
        let end = pos + 2;
        while (end < src.length && level > 0) {
            if (src[end] === '{') level++;
            else if (src[end] === '}') level--;
            end++;
        }
        return { text: OPAQUE, opaque: true, next: end };
    }
    if (n && /[A-Za-z_0-9@*#?!$-]/.test(n)) {
        let end = pos + 2;
        if (/[A-Za-z_]/.test(n)) while (end < src.length && /\w/.test(src[end])) end++;
        return { text: OPAQUE, opaque: true, next: end };
    }
    return { text: '$', opaque: false, next: pos + 1 };
}

function readHeredocBodies(src, start, pending) {
    let pos = start;
    while (pending.length > 0) {
        const spec = pending.shift();
        const lines = [];
        while (pos < src.length) {
            const nl = src.indexOf('\n', pos);
            const end = nl === -1 ? src.length : nl;
            const line = src.slice(pos, end);
            pos = nl === -1 ? src.length : nl + 1;
            if ((spec.strip ? line.replace(/^\t+/, '') : line) === spec.tag) break;
            lines.push(line);
        }
        spec.cmd.heredocs.push({ tag: spec.tag, body: lines.join('\n') });
    }
    return pos;
}

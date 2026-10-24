/**
 * JjScript formatter, display only (P-2026-10-24-0405)
 *
 * One command per line, grammar unchanged (R-JJD-4). A `create instance of X "n" in a.b` line
 * longer than the width is broken before `in`: the command on the first line, the container on
 * the next, indented four spaces past it. Every other line, comments and blank lines included,
 * is returned byte for byte.
 *
 * Display only: executeScript parses one line per command, so the continuation line `in a.b`
 * is not read back as part of the create. Not for text that is going to be run.
 */

import { Token } from './types';
import { tokenize } from './parser/lexer';

export const DEFAULT_FORMAT_WIDTH = 80;

const CONTINUATION_INDENT = '    ';

/**
 * Format a script for display. `width` is the longest line, in characters, left as it is.
 */
export function formatForDisplay(script: string, width: number = DEFAULT_FORMAT_WIDTH): string {
    const lines = script.split('\n');
    const out: string[] = [];
    let inBlockComment = false;

    for (const raw of lines) {
        const startsInComment = inBlockComment;
        inBlockComment = endsInBlockComment(raw, inBlockComment);

        const cr = raw.endsWith('\r') ? '\r' : '';
        const line = cr ? raw.slice(0, -1) : raw;
        if (startsInComment || line.length <= width) {
            out.push(raw);
            continue;
        }

        const at = breakPosition(line);
        if (at < 0) {
            out.push(raw);
            continue;
        }

        const indent = line.slice(0, line.length - line.trimStart().length);
        out.push(line.slice(0, at).trimEnd() + cr);
        out.push(indent + CONTINUATION_INDENT + line.slice(at) + cr);
    }

    return out.join('\n');
}

/**
 * The offset of the `in` to break before, or -1. Only the documented order qualifies, as one
 * command on the line: create instance of <Class> [<name>] in <Parent>.<reference>.
 */
function breakPosition(line: string): number {
    // Comments and whitespace are dropped by the lexer; EOF closes the list.
    const t = tokenize(line).filter(tok => tok.type !== 'EOF');
    if (t.length < 6 || t.length > 7) return -1;

    const is = (tok: Token, type: string, value?: string) =>
        tok.type === type && (value === undefined || tok.value === value);
    const isName = (tok: Token) => is(tok, 'IDENTIFIER') || is(tok, 'QUALIFIED_NAME');

    if (!is(t[0], 'COMMAND', 'create') || !is(t[1], 'KEYWORD', 'instance') || !is(t[2], 'KEYWORD', 'of')) return -1;
    if (!isName(t[3])) return -1;

    const inIndex = t.length - 2;
    if (inIndex === 5 && !(is(t[4], 'STRING') || is(t[4], 'IDENTIFIER'))) return -1;
    const kw = t[inIndex];
    if (!is(kw, 'KEYWORD', 'in') || !isName(t[inIndex + 1])) return -1;

    return line.startsWith('in', kw.position) ? kw.position : -1;
}

/**
 * Whether a block comment is still open at the end of the line, given whether one was open at
 * its start. Quotes are skipped so that a `/*` inside a string opens nothing.
 */
function endsInBlockComment(line: string, open: boolean): boolean {
    let i = 0;
    while (i < line.length) {
        if (open) {
            const close = line.indexOf('*/', i);
            if (close < 0) return true;
            open = false;
            i = close + 2;
            continue;
        }
        const c = line[i];
        if (c === '"' || c === "'") {
            i++;
            while (i < line.length && line[i] !== c) i += line[i] === '\\' ? 2 : 1;
            i++;
            continue;
        }
        if (c === '/' && line[i + 1] === '/') return false;
        if (c === '/' && line[i + 1] === '*') {
            open = true;
            i += 2;
            continue;
        }
        i++;
    }
    return open;
}

/**
 * indent — block indentation, as a pure function applied at render time (slice S2; spec §4, discovery §B.4).
 *
 * The rule (Xtend's): a multi-line value interpolated on a template line whose leading whitespace is `w` gets `w`
 * before every line after its first, and the rule composes across nested template calls. Two halves:
 * - `holePrefixes`, at interpolation: the `w` of each hole, the leading whitespace of the template line it sits on
 *   (spaces and tabs from the line's start to its first other character or hole). The string's start counts as
 *   a line's start: the enclosing hole, if any, supplies what precedes it.
 * - `layoutFragments`, at render: after a newline, the prefix written before the next character is the one of the
 *   levels its fragment shares with the fragment that wrote the newline, outermost first. A newline that ends a
 *   hole's value is followed by text outside that hole, which does not share the hole's level, so the template's
 *   next line is not indented by it; an empty line gets no prefix, so no line ends in whitespace.
 *
 * Pure: types only.
 */

import type { IndentLevel, TextFragment } from './text';

/** One piece of the output: text of fragment `fragment`, or an indentation prefix (`null`). A newline is a piece alone. */
export interface LaidOutPiece {
    readonly text: string;
    readonly fragment: number | null;
}

/** The prefix the levels `a` and `b` share from the outermost: the concatenation of their common head. */
function sharedPrefix(a: readonly IndentLevel[], b: readonly IndentLevel[]): string {
    let prefix = '';
    for (let i = 0; i < a.length && i < b.length && a[i].id === b[i].id; i++) prefix += a[i].prefix;
    return prefix;
}

export function layoutFragments(fragments: readonly Pick<TextFragment, 'text' | 'indent'>[]): LaidOutPiece[] {
    const pieces: LaidOutPiece[] = [];
    // The levels of the fragment that wrote the last newline, while the line it opened is still empty.
    let pending: readonly IndentLevel[] | null = null;
    fragments.forEach((f, index) => {
        if (f.text === '') {
            pieces.push({ text: '', fragment: index });
            return;
        }
        const lines = f.text.split('\n');
        lines.forEach((segment, k) => {
            if (segment !== '') {
                if (pending !== null) {
                    const prefix = sharedPrefix(pending, f.indent);
                    if (prefix !== '') pieces.push({ text: prefix, fragment: null });
                    pending = null;
                }
                pieces.push({ text: segment, fragment: index });
            }
            if (k < lines.length - 1) {
                pieces.push({ text: '\n', fragment: index });
                pending = f.indent;
            }
        });
    });
    return pieces;
}

/** One part of an interpolated string, as `holePrefixes` reads it. */
export type IndentPart = { readonly kind: 'text'; readonly value: string } | { readonly kind: 'hole' };

/** For each hole of `parts`, in order, the leading whitespace of the template line it sits on. */
export function holePrefixes(parts: readonly IndentPart[]): string[] {
    const out: string[] = [];
    let leading = '';
    let atLeading = true;
    for (const part of parts) {
        if (part.kind === 'hole') {
            out.push(leading);
            atLeading = false;
            continue;
        }
        for (const c of part.value) {
            if (c === '\n') {
                leading = '';
                atLeading = true;
            } else if (atLeading && (c === ' ' || c === '\t')) {
                leading += c;
            } else {
                atLeading = false;
            }
        }
    }
    return out;
}

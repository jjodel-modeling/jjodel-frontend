/**
 * codeTokens — syntax colouring of the generated text (P-2026-10-24-1516). The pieces of `linesOf` (codeLines.ts)
 * are cut again at the boundaries of Monaco's tokens (`monaco.editor.tokenize`), so every piece keeps its provenance
 * entry and gains a token class; the class's colour is read from the Monaco theme of the Template Editor.
 *
 * Pure: no React, no store, no Monaco. The tokens come in as data, in the shape `tokenize` returns.
 */

import { DEFAULT_GENERATION_MAX_CHARS } from '../engine/text';
import type { Piece } from './codeLines';

/** The fixed set of classes the generated text is coloured with. */
export type TokenClass = 'keyword' | 'string' | 'number' | 'comment' | 'type' | 'delimiter' | 'identifier';

export const TOKEN_CLASSES: readonly TokenClass[] = ['keyword', 'string', 'number', 'comment', 'type', 'delimiter', 'identifier'];

/** One token of a line, as `monaco.editor.tokenize` returns it: its start column (0-based) and its type. */
export interface LineToken {
    readonly offset: number;
    readonly type: string;
}

/** A piece of `linesOf` cut at token boundaries: same provenance entry, plus the class of its token. */
export interface ColouredPiece extends Piece {
    readonly token: TokenClass | null;
}

/** A text longer than the generation budget (S7) is shown uncoloured. */
export const COLOUR_MAX_CHARS = DEFAULT_GENERATION_MAX_CHARS;

/** Language ids by extension; for an extension with several candidates, the first one Monaco registers wins. */
const LANGUAGES: Readonly<Record<string, readonly string[]>> = {
    js: ['javascript'],
    mjs: ['javascript'],
    ts: ['typescript'],
    v: ['verilog', 'systemverilog'],
    sv: ['systemverilog'],
    json: ['json'],
    md: ['markdown'],
    html: ['html'],
    py: ['python'],
    java: ['java'],
};

/** The Monaco language of a file, from its extension, among the ids Monaco registers; null for plain text. */
export function languageOf(path: string, registered: readonly string[]): string | null {
    const dot = path.lastIndexOf('.');
    if (dot < 0 || dot < path.lastIndexOf('/')) return null;
    const candidates = LANGUAGES[path.slice(dot + 1).toLowerCase()] ?? [];
    return candidates.find(id => registered.includes(id)) ?? null;
}

/** The class of a Monaco token type, from its first segment (`keyword.js`, `type.identifier.ts`, `string.key.json`). */
export function tokenClass(type: string): TokenClass | null {
    const head = type.split('.', 1)[0];
    switch (head) {
        case 'keyword':
        case 'string':
        case 'number':
        case 'comment':
        case 'type':
        case 'delimiter':
        case 'identifier':
            return head;
        case 'regexp':
            return 'string';
        case 'operator':
            return 'delimiter';
        default:
            return null;
    }
}

/** The lines of `linesOf`, each piece cut at the token boundaries of its line; a line with no tokens stays uncoloured. */
export function colourLines(lines: readonly (readonly Piece[])[], tokens: readonly (readonly LineToken[])[]): ColouredPiece[][] {
    return lines.map((pieces, i) => {
        const line = tokens[i] ?? [];
        const out: ColouredPiece[] = [];
        let at = 0;
        let k = 0;
        for (const p of pieces) {
            const end = at + p.text.length;
            let from = at;
            while (from < end) {
                while (k + 1 < line.length && line[k + 1].offset <= from) k++;
                const current = line.length > 0 && line[k].offset <= from ? tokenClass(line[k].type) : null;
                const next = k + 1 < line.length ? Math.min(line[k + 1].offset, end) : end;
                const to = next > from ? next : end;
                out.push({ text: p.text.slice(from - at, to - at), entry: p.entry, token: current });
                from = to;
            }
            at = end;
        }
        return out;
    });
}

/** A rule of a Monaco theme, as `IStandaloneThemeData.rules` holds it. */
export interface ThemeRule {
    readonly token: string;
    readonly foreground?: string;
    readonly fontStyle?: string;
}

export interface TokenStyle {
    readonly color?: string;
    readonly fontStyle?: 'italic';
    readonly fontWeight?: 'bold';
}

/** Each class's style, read from the theme: the rule named like the class, else the first rule under it (`type.identifier`). */
export function tokenStyles(rules: readonly ThemeRule[]): Record<TokenClass, TokenStyle> {
    const out = {} as Record<TokenClass, TokenStyle>;
    for (const c of TOKEN_CLASSES) {
        const rule = rules.find(r => r.token === c) ?? rules.find(r => r.token.startsWith(`${c}.`));
        const style: { color?: string; fontStyle?: 'italic'; fontWeight?: 'bold' } = {};
        if (rule?.foreground) style.color = `#${rule.foreground.replace(/^#/, '')}`;
        if (rule?.fontStyle?.includes('italic')) style.fontStyle = 'italic';
        if (rule?.fontStyle?.includes('bold')) style.fontWeight = 'bold';
        out[c] = style;
    }
    return out;
}

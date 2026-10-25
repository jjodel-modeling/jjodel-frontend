/**
 * JjScript colours outside the editor (P-2026-10-25-1020).
 *
 * Builds the refractor-shaped tree `react-syntax-highlighter` renders from the tokens the
 * `jjscript` Monarch tokenizer yields, and the stylesheet that paints them with the editor's
 * theme rules, so a script in a Jjodie message has the colours it has in the script editor.
 *
 * Pure: the tokens and the rules come in, so the tree is checked in a node test. The Monaco call
 * lives in `jjscriptHighlighter.ts`.
 */

import type * as Monaco from 'monaco-editor';
import type { CSSProperties } from 'react';

export interface HighlightToken {
    offset: number;
    type: string;
}

export interface HastText {
    type: 'text';
    value: string;
}

export interface HastElement {
    type: 'element';
    tagName: 'span';
    properties: { className: string[] };
    children: HastText[];
}

export type HastNode = HastText | HastElement;

type ThemeRule = Monaco.editor.ITokenThemeRule;

const POSTFIX = '.jjscript';

function paintable(rule: ThemeRule): boolean {
    return !!rule.token && !rule.token.startsWith('@');
}

/** The rule that paints a token type, as Monaco resolves it: the longest dot-segment prefix. */
export function jjscriptRuleFor(type: string, rules: readonly ThemeRule[]): ThemeRule | undefined {
    const bare = type.endsWith(POSTFIX) ? type.slice(0, -POSTFIX.length) : type;
    let best: ThemeRule | undefined;
    for (const rule of rules) {
        if (!paintable(rule)) continue;
        if (bare !== rule.token && !bare.startsWith(`${rule.token}.`)) continue;
        if (!best || rule.token.length > best.token.length) best = rule;
    }
    return best;
}

export function jjscriptClassName(ruleToken: string): string {
    return `jjs-${ruleToken.replace(/\./g, '-')}`;
}

/** One stylesheet entry per rule, keyed by the class `jjscriptHast` gives its tokens. */
export function jjscriptStylesheet(rules: readonly ThemeRule[]): Record<string, CSSProperties> {
    const sheet: Record<string, CSSProperties> = {};
    for (const rule of rules) {
        if (!paintable(rule)) continue;
        const style: CSSProperties = {};
        if (rule.foreground) style.color = `#${rule.foreground}`;
        if (rule.fontStyle?.includes('bold')) style.fontWeight = 'bold';
        if (rule.fontStyle?.includes('italic')) style.fontStyle = 'italic';
        sheet[jjscriptClassName(rule.token)] = style;
    }
    return sheet;
}

/**
 * The tree of `code`, one entry of `lineTokens` per line as `monaco.editor.tokenize` returns
 * them. A token no rule paints (whitespace, the default token) stays plain text.
 */
export function jjscriptHast(
    code: string,
    lineTokens: readonly (readonly HighlightToken[])[],
    rules: readonly ThemeRule[],
): HastNode[] {
    const nodes: HastNode[] = [];
    code.split('\n').forEach((line, i) => {
        if (i > 0) nodes.push({ type: 'text', value: '\n' });
        const tokens = lineTokens[i] ?? [];
        const head = tokens.length > 0 ? tokens[0].offset : line.length;
        if (head > 0) nodes.push({ type: 'text', value: line.slice(0, head) });
        tokens.forEach((token, k) => {
            const end = k + 1 < tokens.length ? tokens[k + 1].offset : line.length;
            const value = line.slice(token.offset, end);
            if (!value) return;
            const rule = jjscriptRuleFor(token.type, rules);
            nodes.push(rule
                ? { type: 'element', tagName: 'span', properties: { className: ['token', jjscriptClassName(rule.token)] }, children: [{ type: 'text', value }] }
                : { type: 'text', value });
        });
    });
    return nodes;
}

/**
 * The Monaco side of the Text tab (step B1, R-TXT-38; design in docs/discovery/discovery_2026-11-03_textual_language_service.md):
 * the language `jjodel-textual` with six providers on the language service (semantic tokens, document symbols, folding
 * ranges, definition, references, hover), a Monarch tokenizer for the EBNF tab, and one light theme (D-UI-15).
 *
 * A Monaco theme is global: the theme here is the JjScript theme (`vs`, the JjTL colours on the `.jjscript` tokens) plus
 * the rules of the text and of the EBNF, so a JjScript editor beside the tab keeps its colours. The semantic token types
 * are prefixed (`textual-<role>`) and the EBNF tokens carry the `.jjodel-ebnf` postfix, for the same reason: a theme rule
 * matches a token by its dotted prefix, and a rule on a bare `keyword` would recolour every other language's keywords.
 *
 * It imports the JjTL theme, which imports `joiner`: TextualTab.tsx loads this module with a dynamic import, so that the
 * bench can still import the tab's pure functions.
 */

import type * as Monaco from 'monaco-editor';
import { jjscriptThemeRules } from '../../../jjscript/editor/jjscriptLanguage';
import { jjtlTheme } from '../../../jjtl/editor/jjtlTheme';
import type { ConcreteGrammar } from '../concreteGrammar';
import { analyzeText, SEMANTIC_MODIFIERS, SEMANTIC_ROLES } from '../languageService';
import type { SemanticRole, TextAnalysis, TextRange, TextSymbol } from '../languageService';
import type { TextMetamodel } from '../metamodel';
import { parseText } from '../parser';
import type { ParseOptions, TextParseResult } from '../parser';

export const TEXTUAL_LANGUAGE_ID = 'jjodel-textual';
export const EBNF_LANGUAGE_ID = 'jjodel-ebnf';
export const TEXTUAL_THEME_ID = 'jjodel-textual-theme';

const tokenType = (role: SemanticRole): string => `textual-${role}`;

/** The colours of the design tokens: slate base, cyan accents (styles/tokens). */
const SLATE_900 = '0f172a';
const SLATE_700 = '334155';
const SLATE_600 = '475569';
const SLATE_500 = '64748b';
const SLATE_400 = '94a3b8';
const CYAN = '06b6d4';
const RED_600 = 'dc2626';

const TEXTUAL_RULES: Monaco.editor.ITokenThemeRule[] = [
    { token: tokenType('type'), foreground: SLATE_900, fontStyle: 'bold' },
    { token: tokenType('feature'), foreground: SLATE_500 },
    { token: tokenType('keyword'), foreground: SLATE_500, fontStyle: 'italic' },
    { token: tokenType('name'), foreground: CYAN, fontStyle: 'bold' },
    { token: tokenType('string'), foreground: SLATE_600 },
    { token: tokenType('number'), foreground: SLATE_600 },
    { token: tokenType('value'), foreground: SLATE_600 },
    { token: tokenType('literal'), foreground: SLATE_700, fontStyle: 'italic' },
    { token: tokenType('reference'), foreground: CYAN },
    { token: `${tokenType('reference')}.unresolved`, foreground: RED_600 },
    { token: `${tokenType('reference')}.outer`, foreground: SLATE_500, fontStyle: 'italic' },
    { token: tokenType('comment'), foreground: SLATE_400, fontStyle: 'italic' },
];

const EBNF_RULES: Monaco.editor.ITokenThemeRule[] = [
    { token: 'type.jjodel-ebnf', foreground: SLATE_900, fontStyle: 'bold' },
    { token: 'string.jjodel-ebnf', foreground: CYAN },
    { token: 'variable.jjodel-ebnf', foreground: SLATE_600 },
    { token: 'constant.jjodel-ebnf', foreground: SLATE_500, fontStyle: 'italic' },
    { token: 'identifier.jjodel-ebnf', foreground: SLATE_700 },
    { token: 'operator.jjodel-ebnf', foreground: SLATE_400 },
    { token: 'delimiter.jjodel-ebnf', foreground: SLATE_400 },
    { token: 'comment.jjodel-ebnf', foreground: SLATE_400, fontStyle: 'italic' },
];

/** The EBNF of concreteGrammar.ts `concreteGrammarEbnf`: `Rule ::= ... ;`, quoted terminals, `feature=`, `(* ... *)`. */
const EBNF_MONARCH: Monaco.languages.IMonarchLanguage = {
    tokenPostfix: '.jjodel-ebnf',
    tokenizer: {
        root: [
            [/\(\*/, 'comment', '@comment'],
            [/^[A-Za-z_]\w*(?=\s*::=)/, 'type'],
            [/::=/, 'operator'],
            [/"(?:[^"\\]|\\.)*"/, 'string'],
            [/'(?:[^'\\]|\\.)*'/, 'string'],
            [/[A-Za-z_]\w*(?=\+?=|\?=)/, 'variable'],
            [/\+=|\?=|=/, 'operator'],
            [/[A-Z][A-Z0-9_]*\b/, 'constant'],
            [/[A-Za-z_]\w*/, 'identifier'],
            [/[|;[\]{}()]/, 'delimiter'],
        ],
        comment: [
            [/\*\)/, 'comment', '@pop'],
            [/[^*]+|\*/, 'comment'],
        ],
    },
};

/** What a session parses with: read when it parses, so a new print or new carried tokens need `invalidate`. */
export interface TextualSessionInput {
    readonly base: () => { readonly grammar: ConcreteGrammar; readonly mm: TextMetamodel } | null;
    readonly keep: () => ParseOptions['keep'];
}

/** The parse and the analysis of one version of the text. */
export interface TextualReading {
    readonly text: string;
    readonly grammar: ConcreteGrammar;
    readonly parsed: TextParseResult;
    readonly analysis: TextAnalysis;
}

export interface TextualSession {
    /** The reading of the model's current version: one parse per version, shared by the providers and the typing pause. */
    current(): TextualReading | null;
    /** The base or the carried tokens changed: the next query parses again, and the highlighting is asked again. */
    invalidate(): void;
    dispose(): void;
}

const sessions = new Map<Monaco.editor.ITextModel, TextualSession>();
let changed: Monaco.Emitter<void> | null = null;

/** Opens the session of a Text tab's model: the providers answer on the models that have one. */
export function openTextualSession(model: Monaco.editor.ITextModel, input: TextualSessionInput): TextualSession {
    let cache: { readonly version: number; readonly value: TextualReading | null } | null = null;
    const session: TextualSession = {
        current: () => {
            const version = model.getVersionId();
            if (cache && cache.version === version) return cache.value;
            const base = input.base();
            let value: TextualReading | null = null;
            if (base) {
                const text = model.getValue();
                const parsed = parseText(text, base.grammar, { keep: input.keep() });
                value = { text, grammar: base.grammar, parsed, analysis: analyzeText(text, parsed, base.grammar, base.mm) };
            }
            cache = { version, value };
            return value;
        },
        invalidate: () => {
            cache = null;
            changed?.fire();
        },
        dispose: () => {
            if (sessions.get(model) === session) sessions.delete(model);
        },
    };
    sessions.set(model, session);
    return session;
}

const readingOf = (model: Monaco.editor.ITextModel): TextualReading | null => sessions.get(model)?.current() ?? null;

let registered = false;

/** Registers the two languages, the providers and the theme, once; meant for the `beforeMount` prop of the editors. */
export function registerTextualMonaco(monaco: typeof Monaco): void {
    if (registered) return;
    registered = true;
    changed = new monaco.Emitter<void>();
    monaco.languages.register({ id: TEXTUAL_LANGUAGE_ID });
    monaco.languages.register({ id: EBNF_LANGUAGE_ID });
    monaco.languages.setMonarchTokensProvider(EBNF_LANGUAGE_ID, EBNF_MONARCH);

    const rangeOf = (model: Monaco.editor.ITextModel, r: TextRange): Monaco.Range => {
        const a = model.getPositionAt(r.start);
        const b = model.getPositionAt(r.end);
        return new monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column);
    };
    const locations = (model: Monaco.editor.ITextModel, rs: readonly TextRange[]): Monaco.languages.Location[] => rs.map(r => ({ uri: model.uri, range: rangeOf(model, r) }));

    monaco.languages.registerDocumentSemanticTokensProvider(TEXTUAL_LANGUAGE_ID, {
        onDidChange: changed.event,
        getLegend: () => ({ tokenTypes: SEMANTIC_ROLES.map(tokenType), tokenModifiers: [...SEMANTIC_MODIFIERS] }),
        provideDocumentSemanticTokens: model => {
            const r = readingOf(model);
            return r ? { data: r.analysis.encodedTokens() } : null;
        },
        releaseDocumentSemanticTokens: () => {},
    });

    const symbolOf = (model: Monaco.editor.ITextModel, s: TextSymbol): Monaco.languages.DocumentSymbol => ({
        name: s.name,
        detail: s.kind === 'unknown' ? '' : s.cls ?? '',
        kind: s.kind === 'unknown' ? monaco.languages.SymbolKind.Namespace : monaco.languages.SymbolKind.Object,
        tags: [],
        range: rangeOf(model, s),
        selectionRange: rangeOf(model, { start: s.nameStart, end: s.nameEnd }),
        children: s.children.map(c => symbolOf(model, c)),
    });
    monaco.languages.registerDocumentSymbolProvider(TEXTUAL_LANGUAGE_ID, {
        provideDocumentSymbols: model => readingOf(model)?.analysis.symbols.map(s => symbolOf(model, s)) ?? [],
    });

    // Folds follow the text's blocks only, which change with the content, when Monaco asks again anyway.
    monaco.languages.registerFoldingRangeProvider(TEXTUAL_LANGUAGE_ID, {
        provideFoldingRanges: model => readingOf(model)?.analysis.folds.map(f => ({
            start: f.startLine, end: f.endLine, ...(f.kind === 'comment' ? { kind: monaco.languages.FoldingRangeKind.Comment } : {}),
        })) ?? [],
    });

    monaco.languages.registerDefinitionProvider(TEXTUAL_LANGUAGE_ID, {
        provideDefinition: (model, position) => {
            const d = readingOf(model)?.analysis.definitionAt(model.getOffsetAt(position));
            return d ? locations(model, [d]) : null;
        },
    });

    monaco.languages.registerReferenceProvider(TEXTUAL_LANGUAGE_ID, {
        provideReferences: (model, position, context) =>
            locations(model, readingOf(model)?.analysis.referencesAt(model.getOffsetAt(position), context.includeDeclaration) ?? []),
    });

    monaco.languages.registerHoverProvider(TEXTUAL_LANGUAGE_ID, {
        provideHover: (model, position) => {
            const h = readingOf(model)?.analysis.hoverAt(model.getOffsetAt(position));
            return h ? { range: rangeOf(model, h), contents: h.contents.map(value => ({ value })) } : null;
        },
    });

    monaco.editor.defineTheme(TEXTUAL_THEME_ID, {
        base: 'vs',
        inherit: true,
        rules: [...jjscriptThemeRules(jjtlTheme.rules), ...TEXTUAL_RULES, ...EBNF_RULES],
        colors: {},
    });
}

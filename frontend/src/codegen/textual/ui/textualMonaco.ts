/**
 * The Monaco side of the Text tab (step B1, R-TXT-38; design in docs/discovery/discovery_2026-11-03_textual_language_service.md):
 * the language `jjodel-textual` with six providers on the language service (semantic tokens, document symbols, folding
 * ranges, definition, references, hover), a Monarch tokenizer for the EBNF tab, and one light theme (D-UI-15). Step D lane
 * D2c adds the seventh, completion (docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §3.3 C4), and lane D3b
 * the eighth, the code actions of the parse errors' fixes (same report §4), and lane D4 the ninth, rename through the text
 * (same report §5), and lane D5 the tenth and eleventh, Format Document and Format Selection (same report §6.2).
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
import { formatText, formatTextRange, minimalEdit } from '../format';
import { hoverCard, hoverLinks, hoverLinksMarkdown } from '../hoverCard';
import type { HoverCard, HoverCardLines } from '../hoverCard';
import { formatShortcut } from '../../../utils/keyboardShortcuts';
import type { ShortcutConfig } from '../../../utils/keyboardShortcuts';
import { analyzeText, completionsAt, ISLAND_TRIGGER, renameEdits, renameLocation, SEMANTIC_MODIFIERS, SEMANTIC_ROLES, triggeredCompletions } from '../languageService';
import type { SemanticRole, TextAnalysis, TextCompletion, TextRange, TextSymbol } from '../languageService';
import type { TextMetamodel } from '../metamodel';
import { parseText } from '../parser';
import type { ParseOptions, TextParseError, TextParseResult } from '../parser';
import { STYLE_CATALOG } from '../style';
import type { NotationStyle } from '../style';

export const TEXTUAL_LANGUAGE_ID = 'jjodel-textual';
export const EBNF_LANGUAGE_ID = 'jjodel-ebnf';
export const TEXTUAL_THEME_ID = 'jjodel-textual-theme';
/** The command a hover link runs (step B2, R-TXT-39 (3)): the caret to an offset of a Text tab's model, its line revealed. */
export const TEXTUAL_REVEAL_COMMAND = 'jjodel.textual.reveal';
/** The command of a hover's Pin link (lane D6, R-TXT-42): the card that stays open, at an offset of a Text tab's model. */
export const TEXTUAL_PIN_COMMAND = 'jjodel.textual.pin';

const tokenType = (role: SemanticRole): string => `textual-${role}`;

/** The characters a style's punctuation ends with, letters never: typing one asks for completion (D2c, report §3.3 C4). */
const styleTriggers = (s: NotationStyle): string[] => [...new Set(
    [...s.blockOpen, ...s.blockClose, ...s.emptyBlock, ...s.assign, ...s.terminator, s.list.open, s.list.separator, s.list.close]
        .filter(t => t && !/\w/.test(t.slice(-1))).map(t => t.slice(-1)),
)];
/**
 * Monaco takes its trigger characters once, so the catalog's together, and `.` for a JjEL island (F1d); a request reads its
 * own style's (`styleTriggers`, `triggeredCompletions`).
 */
const CATALOG_TRIGGERS = [...new Set([...Object.values(STYLE_CATALOG).flatMap(styleTriggers), ISLAND_TRIGGER])];

/** The colours of the design tokens: slate base, cyan accents (styles/tokens). */
const SLATE_900 = '0f172a';
const SLATE_700 = '334155';
const SLATE_600 = '475569';
const SLATE_500 = '64748b';
const SLATE_400 = '94a3b8';
const CYAN = '0891b2'; // cyan-600: about 4.5:1 on white, where cyan-500 gave about 2.4:1
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
    /** The metamodel the text was read against: completion reads its enumerations (D2c). */
    readonly mm?: TextMetamodel;
    /** The carried reference tokens the text was read with (R-TXT-35): rename reads the edited text with them (D4). */
    readonly keep?: ParseOptions['keep'];
}

export interface TextualSession {
    /** The reading of the model's current version: one parse per version, shared by the providers and the typing pause. */
    current(): TextualReading | null;
    /** The base or the carried tokens changed: the next query parses again, and the highlighting is asked again. */
    invalidate(): void;
    dispose(): void;
}

const sessions = new Map<Monaco.editor.ITextModel, TextualSession>();
/** D3b: the errors of a session's current version parsed with D3a's fixes, asked by the code actions only. */
const fixedErrors = new Map<Monaco.editor.ITextModel, () => readonly TextParseError[]>();
let changed: Monaco.Emitter<void> | null = null;

/** Opens the session of a Text tab's model: the providers answer on the models that have one. */
export function openTextualSession(model: Monaco.editor.ITextModel, input: TextualSessionInput): TextualSession {
    let cache: { readonly version: number; readonly value: TextualReading | null } | null = null;
    let fixed: { readonly version: number; readonly errors: readonly TextParseError[] } | null = null;
    const session: TextualSession = {
        current: () => {
            const version = model.getVersionId();
            if (cache && cache.version === version) return cache.value;
            const base = input.base();
            let value: TextualReading | null = null;
            if (base) {
                const text = model.getValue();
                const keep = input.keep();
                const parsed = parseText(text, base.grammar, { keep });
                value = { text, grammar: base.grammar, parsed, analysis: analyzeText(text, parsed, base.grammar, base.mm), mm: base.mm, keep };
            }
            cache = { version, value };
            return value;
        },
        invalidate: () => {
            cache = null;
            fixed = null;
            changed?.fire();
        },
        dispose: () => {
            if (sessions.get(model) === session) {
                sessions.delete(model);
                fixedErrors.delete(model);
            }
        },
    };
    sessions.set(model, session);
    // One more parse per version, and only when a code action is asked: the fixes' second parse (D3a (3)) stays off the
    // typing path.
    fixedErrors.set(model, () => {
        const version = model.getVersionId();
        if (fixed && fixed.version === version) return fixed.errors;
        const base = input.base();
        const errors = base ? parseText(model.getValue(), base.grammar, { keep: input.keep(), fixes: true }).errors : [];
        fixed = { version, errors };
        return errors;
    });
    return session;
}

const readingOf = (model: Monaco.editor.ITextModel): TextualReading | null => sessions.get(model)?.current() ?? null;

/** The shortcut of the pinned card (lane D6, report §2): shown in the hover, bound by PinnedHoverCard.tsx. */
const PIN_SHORTCUT: ShortcutConfig = { key: 'H', modifiers: ['alt'] };
const pinHandlers = new Map<Monaco.editor.ICodeEditor, (offset: number) => void>();
const linesOf = (model: Monaco.editor.ITextModel): HoverCardLines => ({
    lineOf: offset => model.getPositionAt(offset).lineNumber,
    textOf: line => model.getLineContent(line),
});

/** The caret to an offset of the editor's model, its line revealed: a hover's links and the card's. */
export function textualReveal(editor: Monaco.editor.ICodeEditor, offset: number): void {
    const m = editor.getModel();
    if (!m) return;
    const p = m.getPositionAt(offset);
    editor.setPosition(p);
    editor.revealLineInCenterIfOutsideViewport(p.lineNumber);
    editor.focus();
}

/** What a card pinned at `offset` of a Text tab's model shows, or null where there is no hover. */
export function textualHoverCard(model: Monaco.editor.ITextModel, offset: number): HoverCard | null {
    const r = readingOf(model);
    return r ? hoverCard(r.analysis, offset, linesOf(model)) : null;
}

/** The editor's card, called by the Pin link; returns the removal. */
export function onTextualPin(editor: Monaco.editor.ICodeEditor, handler: (offset: number) => void): () => void {
    pinHandlers.set(editor, handler);
    return () => { if (pinHandlers.get(editor) === handler) pinHandlers.delete(editor); };
}

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

    // Step B2: the hover's links run the reveal command on the editor of the hovered model, so they move the caret where
    // F12 would (the definition) or to a line that uses the reference. A link is trusted for that one command only.
    monaco.editor.registerCommand(TEXTUAL_REVEAL_COMMAND, (_accessor, uri: unknown, offset: unknown) => {
        if (typeof uri !== 'string' || typeof offset !== 'number') return;
        const editor = monaco.editor.getEditors().find(e => e.getModel()?.uri.toString() === uri);
        if (editor) textualReveal(editor, offset);
    });
    // Lane D6: the Pin link hands the offset to the card of the hovered model's editor.
    monaco.editor.registerCommand(TEXTUAL_PIN_COMMAND, (_accessor, uri: unknown, offset: unknown) => {
        if (typeof uri !== 'string' || typeof offset !== 'number') return;
        const editor = monaco.editor.getEditors().find(e => e.getModel()?.uri.toString() === uri);
        if (editor) pinHandlers.get(editor)?.(offset);
    });
    const trusted = { enabledCommands: [TEXTUAL_REVEAL_COMMAND, TEXTUAL_PIN_COMMAND] };
    const commandLink = (command: string, model: Monaco.editor.ITextModel, label: string, offset: number): string =>
        `[${label}](command:${command}?${encodeURIComponent(JSON.stringify([model.uri.toString(), offset]))})`;
    monaco.languages.registerHoverProvider(TEXTUAL_LANGUAGE_ID, {
        provideHover: (model, position) => {
            const r = readingOf(model);
            const offset = model.getOffsetAt(position);
            const h = r?.analysis.hoverAt(offset);
            if (!r || !h) return null;
            const reveal = (label: string, at: number): string => commandLink(TEXTUAL_REVEAL_COMMAND, model, label, at);
            const pin = `${commandLink(TEXTUAL_PIN_COMMAND, model, 'Pin', offset)} · ${formatShortcut(PIN_SHORTCUT)}`;
            const links = [...hoverLinksMarkdown(hoverLinks(r.analysis, offset, linesOf(model)), reveal), pin].map(value => ({ value, isTrusted: trusted }));
            return { range: rangeOf(model, h), contents: [...h.contents.map(value => ({ value })), ...links] };
        },
    });

    // Step D lane D2c: the candidates of `completionsAt`, on a session's reading only. A cursor parse is one more parse of
    // the text per request (report §3.3 C4); `sortText` keeps the parser's order, which Monaco would otherwise sort by label.
    const kindOf: Record<TextCompletion['kind'], Monaco.languages.CompletionItemKind> = {
        keyword: monaco.languages.CompletionItemKind.Keyword,
        literal: monaco.languages.CompletionItemKind.EnumMember,
        reference: monaco.languages.CompletionItemKind.Reference,
    };
    // F1d: a JjEL island's candidates by what the template completion offers them as, its own provider's kinds.
    const K = monaco.languages.CompletionItemKind;
    const jjelKindOf: Record<NonNullable<TextCompletion['jjel']>, Monaco.languages.CompletionItemKind> = {
        class: K.Class, template: K.Function, variable: K.Variable, feature: K.Field, member: K.Property, function: K.Method,
    };
    monaco.languages.registerCompletionItemProvider(TEXTUAL_LANGUAGE_ID, {
        triggerCharacters: CATALOG_TRIGGERS,
        provideCompletionItems: (model, position, context) => {
            const r = readingOf(model);
            if (!r?.mm) return { suggestions: [] };
            const typed = context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter;
            const found = completionsAt(r.text, model.getOffsetAt(position), r.grammar, r.mm);
            const all = typed ? triggeredCompletions(found, context.triggerCharacter ?? '', styleTriggers(r.grammar.style)) : found;
            const width = String(all.length).length;
            return {
                suggestions: all.map((c, i) => ({
                    label: c.label,
                    kind: c.jjel ? jjelKindOf[c.jjel] : kindOf[c.kind],
                    insertText: c.label,
                    range: rangeOf(model, c),
                    sortText: String(i).padStart(width, '0'),
                    ...(c.doc ? { documentation: { value: c.doc.join('\n\n') } } : {}),
                })),
            };
        },
    });

    // Step D lane D3b (decision D6): a parse error marker's D3a fixes as quick fixes, text edits only, applied by the typing
    // pause like any edit. A marker is the error at its start with its message, as `setMarkers` in TextualTab.tsx sets it;
    // any other marker (a conformance warning, say) has none.
    monaco.languages.registerCodeActionProvider(TEXTUAL_LANGUAGE_ID, {
        provideCodeActions: (model, _range, context) => {
            const errors = fixedErrors.get(model)?.() ?? [];
            const length = model.getValue().length;
            const actions = context.markers.flatMap(marker => {
                const at = model.getOffsetAt({ lineNumber: marker.startLineNumber, column: marker.startColumn });
                const e = errors.find(x => x.fix && Math.min(x.start, length) === at && x.message === marker.message);
                return (e?.fix ?? []).map((f, i): Monaco.languages.CodeAction => ({
                    title: f.title,
                    kind: 'quickfix',
                    diagnostics: [marker],
                    isPreferred: i === 0,
                    edit: { edits: [{ resource: model.uri, versionId: model.getVersionId(), textEdit: { range: rangeOf(model, f), text: f.text } }] },
                }));
            });
            return { actions, dispose: () => {} };
        },
    }, { providedCodeActionKinds: ['quickfix'] });

    // Step D lane D4 (report §5.2, decision D4): rename through the text, never a model write. The box opens on the token at
    // the cursor with the name as one types it; the edits come as one workspace edit, so one undo stop, and the typing
    // pause applies the new name through the diff like any edit. A refusal is the box's reason.
    const NO_READING = 'the text has no notation to read it with';
    // Monaco 0.52 sends a rejectReason of provideRenameEdits to the notification service, which the standalone editor only
    // logs (rename.js): the reason is shown at the cursor by the message controller, as resolveRenameLocation's is.
    type MessageController = Monaco.editor.IEditorContribution & { showMessage(message: string, position: Monaco.IPosition): void };
    const showRefusal = (model: Monaco.editor.ITextModel, position: Monaco.IPosition, message: string): void => {
        const editor = monaco.editor.getEditors().find(e => e.getModel() === model);
        editor?.getContribution<MessageController>('editor.contrib.messageController')?.showMessage(message, position);
    };
    monaco.languages.registerRenameProvider(TEXTUAL_LANGUAGE_ID, {
        resolveRenameLocation: (model, position) => {
            const r = readingOf(model);
            const offset = model.getOffsetAt(position);
            const loc = r?.mm ? renameLocation(r.text, offset, r.grammar, r.mm, r.keep) : { refused: NO_READING };
            if ('refused' in loc) return { range: rangeOf(model, { start: offset, end: offset }), text: '', rejectReason: loc.refused };
            return { range: rangeOf(model, loc), text: loc.name };
        },
        provideRenameEdits: (model, position, newName) => {
            const r = readingOf(model);
            const out = r?.mm ? renameEdits(r.text, model.getOffsetAt(position), newName, r.grammar, r.mm, r.keep) : { refused: NO_READING };
            if ('refused' in out) {
                showRefusal(model, position, out.refused);
                return { edits: [], rejectReason: out.refused };
            }
            const versionId = model.getVersionId();
            return { edits: out.edits.map(e => ({ resource: model.uri, versionId, textEdit: { range: rangeOf(model, e), text: e.text } })) };
        },
    });

    // Step D lane D5 (report §6.2, decision D5): a format is an editor edit, never a model write; the typing pause applies
    // it like any edit, and a format never changes meaning. One edit, the common prefix and suffix left out, so the caret
    // and the decorations of the untouched objects stay; none on a text that is not applicable.
    const formatEdits = (model: Monaco.editor.ITextModel, formatted: string | null): Monaco.languages.TextEdit[] => {
        const e = formatted === null ? null : minimalEdit(model.getValue(), formatted);
        return e ? [{ range: rangeOf(model, e), text: e.text }] : [];
    };
    monaco.languages.registerDocumentFormattingEditProvider(TEXTUAL_LANGUAGE_ID, {
        provideDocumentFormattingEdits: model => {
            const r = readingOf(model);
            return formatEdits(model, r ? formatText(r.text, r.grammar) : null);
        },
    });
    monaco.languages.registerDocumentRangeFormattingEditProvider(TEXTUAL_LANGUAGE_ID, {
        provideDocumentRangeFormattingEdits: (model, range) => {
            const r = readingOf(model);
            const start = model.getOffsetAt({ lineNumber: range.startLineNumber, column: range.startColumn });
            const end = model.getOffsetAt({ lineNumber: range.endLineNumber, column: range.endColumn });
            return formatEdits(model, r ? formatTextRange(r.text, r.grammar, start, end) : null);
        },
    });

    monaco.editor.defineTheme(TEXTUAL_THEME_ID, {
        base: 'vs',
        inherit: true,
        rules: [...jjscriptThemeRules(jjtlTheme.rules), ...TEXTUAL_RULES, ...EBNF_RULES],
        colors: {},
    });
}

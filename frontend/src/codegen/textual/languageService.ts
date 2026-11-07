/**
 * The language service of the Text tab (step B1, R-TXT-34 step B, R-TXT-38; design in
 * docs/discovery/discovery_2026-11-03_textual_language_service.md, recommended design items 1, 2, 7, 8): one analysis per
 * text version, derived from the parser's lossless tree (step A) and the metamodel, with no Monaco import, so that the
 * bench can run it. The Monaco adapter (ui/textualMonaco.ts) turns its answers into the providers' shapes.
 *
 * One walk of the tree gives: the semantic tokens with their roles, the document symbols (full range and name range,
 * nesting, the recovered and unclosed flags, and an `unknown container` group where the parser read orphans inside a
 * skipped block), the folding ranges of blocks, lists and runs of comments, and the inverse index of the references.
 * Definition, references and hover are queries on that walk. Nothing names a metamodel: classes, features, keywords and
 * literals come from the grammar and the metamodel.
 *
 * A broken text is analysed as it parsed: its recovered objects show here, for display only, and are never applied
 * (R-TXT-21 (8)). Identity across versions (`displayMatch`) is not computed here: it is quadratic (finding F4), and no
 * query of B1 needs a model id.
 *
 * Completion (D2b, `completionsAt`) is a query of its own: it parses the text again with the cursor (D2a). So is rename
 * (D4, `renameLocation`, `renameEdits`): it parses the text, then the text its edits make, and refuses what changes.
 */

import type { ConcreteGrammar } from './concreteGrammar';
import { applyCase } from './concreteGrammar';
import type { TextAttribute, TextClass, TextEnumeration, TextFeature, TextMetamodel, TextReference } from './metamodel';
import { isOuterRef } from './metamodel';
import type { ItemNode, ListNode, ObjectNode, ParsedRef, ParseOptions, RefNode, SyntaxNode, SyntaxToken, TextParseResult } from './parser';
import { commentsOf, isApplicableParse, parseText, tokenizeText } from './parser';
import type { TextNaming } from './printer';
import { pathKeyword, textNaming } from './printer';
import { featureTable } from './textMatch';

/** What a token is for highlighting. `feature` is a feature's keyword, `keyword` any other word of the notation. */
export type SemanticRole = 'type' | 'feature' | 'keyword' | 'name' | 'string' | 'number' | 'value' | 'literal' | 'reference' | 'comment';
/** The legend's order: a role's index is its token type in the encoding. */
export const SEMANTIC_ROLES: readonly SemanticRole[] = ['type', 'feature', 'keyword', 'name', 'string', 'number', 'value', 'literal', 'reference', 'comment'];

/** `declaration`: an object's name. `unresolved`: a reference that names nothing and keeps no target. `outer`: `@"id"`. */
export type SemanticModifier = 'declaration' | 'unresolved' | 'outer';
/** The legend's order: a modifier's index is its bit in the encoding. */
export const SEMANTIC_MODIFIERS: readonly SemanticModifier[] = ['declaration', 'unresolved', 'outer'];

/** `[start, end)` offsets of the text. */
export interface TextRange {
    readonly start: number;
    readonly end: number;
}

export interface SemanticToken extends TextRange {
    readonly role: SemanticRole;
    readonly modifiers: readonly SemanticModifier[];
}

/** An object of the text as an outline shows it, or the group of the objects read inside a skipped block. */
export interface TextSymbol extends TextRange {
    readonly kind: 'object' | 'unknown';
    /** The parsed object's id (`TextParseResult.objects`); absent on the `unknown container` group. */
    readonly id?: string;
    readonly cls?: string;
    /** The object's name, its class when it has none; `unknown container` for the group. */
    readonly name: string;
    readonly named: boolean;
    /** The feature of the enclosing object it is read in; absent at the top and in the group. */
    readonly feature?: string;
    /** The name token, else the class keyword, else the first token: what a symbol selects. */
    readonly nameStart: number;
    readonly nameEnd: number;
    /** In `TextParseResult.recovered`: not read in full, a reference naming nothing, a block left open, or read as an orphan. */
    readonly recovered: boolean;
    /** Read in full, but its block or an enclosing one is left open (`TextParseResult.unclosed`). */
    readonly unclosed: boolean;
    readonly children: readonly TextSymbol[];
}

/** 1-based lines, as Monaco takes them: the lines after `startLine` up to `endLine` fold. */
export interface FoldRange {
    readonly startLine: number;
    readonly endLine: number;
    readonly kind?: 'comment';
}

export interface TextHover extends TextRange {
    /** Markdown paragraphs. */
    readonly contents: readonly string[];
}

export interface TextAnalysis {
    readonly tokens: readonly SemanticToken[];
    readonly symbols: readonly TextSymbol[];
    readonly folds: readonly FoldRange[];
    /** The tokens as Monaco's semantic tokens: five numbers per token per line (line delta, column delta, length, role, modifier bits). */
    encodedTokens(): Uint32Array;
    /** The name range of the object the reference at `offset` names; null elsewhere, and for a reference outside the text. */
    definitionAt(offset: number): TextRange | null;
    /** The references to the object named or declared at `offset`, in text order, its name first when asked. */
    referencesAt(offset: number, includeDeclaration: boolean): TextRange[];
    hoverAt(offset: number): TextHover | null;
}

/**
 * A candidate of completion (D2b, report §3.3 C2): the text to write, what it is, and the range of the text it replaces,
 * the word the cursor is in or ends, else the cursor alone.
 */
export interface TextCompletion extends TextRange {
    readonly label: string;
    /** `keyword`: a keyword or a style token, a block's own and the head prefix included; `reference`: a target's name or path. */
    readonly kind: 'keyword' | 'literal' | 'reference';
    /** A literal's hover, as `hoverAt` gives it: Markdown paragraphs. */
    readonly doc?: readonly string[];
}

/** The unknown-container group's name (R-TXT-36). */
export const UNKNOWN_CONTAINER = 'unknown container';

interface MutableSymbol {
    kind: 'object' | 'unknown';
    id?: string;
    cls?: string;
    name: string;
    named: boolean;
    feature?: string;
    start: number;
    end: number;
    nameStart: number;
    nameEnd: number;
    /** The rank of the token `nameStart` came from: 0 the name, 1 the class keyword, 2 the first token, 3 none yet. */
    nameRank: number;
    recovered: boolean;
    unclosed: boolean;
    children: MutableSymbol[];
}

/** A token read by the parser, with where it sits: what the queries look up by offset. */
interface TokenInfo {
    readonly token: SyntaxToken;
    readonly role?: SemanticRole;
    readonly object: ObjectNode | null;
    readonly item: ItemNode | ListNode | null;
    readonly ref: RefNode | null;
}

const code = (s: string): string => '`' + s.replace(/`/g, "'") + '`';

/** The hover of the literal `lit` of the enumeration `e`. */
function literalHover(e: TextEnumeration | undefined, lit: string): string[] {
    const doc = e?.literalDocs?.[lit];
    return [`${code(lit)} : enumeration ${code(e?.name ?? '?')}`, ...(e ? [`literals ${e.literals.map(code).join(', ')}`] : []),
        ...(doc ? [doc] : []), ...(e?.doc ? [e.doc] : [])];
}

function bounds(f: TextFeature, decl: TextAttribute | TextReference | undefined): string {
    if (decl?.lower === undefined && decl?.upper === undefined) return f.many ? 'many-valued' : 'single-valued';
    const upper = decl.upper ?? (f.many ? -1 : 1);
    return code(`[${decl.lower ?? 0}..${upper < 0 ? '*' : upper}]`);
}

/**
 * The analysis of `text` as `parsed` read it with `grammar`, against the metamodel `mm`. The parse must carry its tree
 * (every `parseText` result does); without one the analysis is empty.
 */
export function analyzeText(text: string, parsed: TextParseResult, grammar: ConcreteGrammar, mm: TextMetamodel): TextAnalysis {
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) lineStarts.push(i + 1);
    /** The 0-based line of an offset. */
    const lineOf = (off: number): number => {
        let lo = 0;
        let hi = lineStarts.length - 1;
        while (lo < hi) {
            const m = (lo + hi + 1) >> 1;
            if (lineStarts[m] <= off) lo = m; else hi = m - 1;
        }
        return lo;
    };

    const byId = new Map(parsed.objects.map(o => [o.id, o]));
    const infos: TokenInfo[] = [];
    const tokens: SemanticToken[] = [];
    const top: MutableSymbol[] = [];
    const symbolOf = new Map<string, MutableSymbol>();
    const folds: FoldRange[] = [];
    const refsTo = new Map<string, TextRange[]>();

    const fold = (start: number, end: number, closed: boolean): void => {
        const a = lineOf(start);
        const b = lineOf(Math.max(start, end - 1));
        // A closed body keeps its close visible; an open one folds to its last token.
        const last = closed ? b - 1 : b;
        if (last > a) folds.push({ startLine: a + 1, endLine: last + 1 });
    };

    const roleOf = (t: SyntaxToken, parent: SyntaxNode, index: number, ref: RefNode | null): { role?: SemanticRole; modifiers: SemanticModifier[] } => {
        switch (t.role) {
            case 'class': return { role: 'type', modifiers: [] };
            case 'keyword': {
                // A feature's keyword opens its item; any other word of the notation is a keyword of the style.
                const opens = parent.kind === 'item' && parent.children.findIndex(c => c.kind === 'token') === index;
                return { role: opens ? 'feature' : 'keyword', modifiers: [] };
            }
            case 'name': return { role: 'name', modifiers: ['declaration'] };
            case 'value': return { role: t.k === 'STR' ? 'string' : t.k === 'INT' || t.k === 'FLOAT' ? 'number' : 'value', modifiers: [] };
            case 'literal': return { role: 'literal', modifiers: [] };
            case 'reference': {
                const r = ref?.ref;
                if (r?.outer) return { role: 'reference', modifiers: ['outer'] };
                // A token kept by R-TXT-35 names nothing in the text and is no error: the diff keeps its target.
                const unresolved = !r || (r.to === undefined && r.error !== undefined);
                return { role: 'reference', modifiers: unresolved ? ['unresolved'] : [] };
            }
            // A word the style uses as punctuation (a block opened by `begin`) reads as a keyword.
            case 'punctuation': return t.k === 'ID' ? { role: 'keyword', modifiers: [] } : { modifiers: [] };
            default: return { modifiers: [] };
        }
    };

    const walk = (n: SyntaxNode, object: ObjectNode | null, sym: MutableSymbol | null, into: MutableSymbol[], item: ItemNode | ListNode | null, ref: RefNode | null): void => {
        let here = into;
        if (n.kind === 'object') {
            const o = byId.get(n.id);
            const name = typeof o?.slots.name === 'string' ? o.slots.name : '';
            const s: MutableSymbol = {
                kind: 'object', id: n.id, cls: n.cls, name: name || n.cls, named: name !== '',
                ...(item && sym ? { feature: item.feature } : {}),
                start: n.start, end: n.end, nameStart: n.start, nameEnd: n.start, nameRank: 3,
                recovered: n.state !== 'complete' || !!n.orphan, unclosed: n.state === 'unclosed', children: [],
            };
            into.push(s);
            symbolOf.set(n.id, s);
            object = n;
            sym = s;
            here = s.children;
            item = null;
        } else if (n.kind === 'item' || n.kind === 'list') {
            item = n;
            if (n.kind === 'list') {
                const last = n.children[n.children.length - 1];
                fold(n.start, n.end, !!last && last.kind === 'token' && last.role === 'punctuation' && last.v === grammar.style.list.close);
            }
        } else if (n.kind === 'block') {
            fold(n.start, n.end, n.closed);
        } else if (n.kind === 'ref') {
            ref = n;
            const to = n.ref?.to;
            if (typeof to === 'string' && n.ref) {
                const at = { start: n.ref.start, end: n.ref.end };
                const list = refsTo.get(to);
                if (list) list.push(at); else refsTo.set(to, [at]);
            }
        } else if (n.kind === 'error' && n.children.some(c => c.kind === 'object')) {
            // R-TXT-36: the objects read inside a skipped block sit in a group where the block was.
            const g: MutableSymbol = {
                kind: 'unknown', name: UNKNOWN_CONTAINER, named: false, start: n.start, end: n.end,
                nameStart: n.start, nameEnd: n.start, nameRank: 0, recovered: true, unclosed: false, children: [],
            };
            into.push(g);
            here = g.children;
            item = null;
        }
        n.children.forEach((c, i) => {
            if (c.kind !== 'token') { walk(c, object, sym, here, item, ref); return; }
            if (!c.role) return;
            const { role, modifiers } = roleOf(c, n, i, ref);
            infos.push({ token: c, ...(role ? { role } : {}), object, item, ref });
            if (role) tokens.push({ start: c.start, end: c.end, role, modifiers });
            if (sym && object && sym.id === object.id) {
                const rank = c.role === 'name' ? 0 : c.role === 'class' ? 1 : 2;
                if (rank < sym.nameRank) { sym.nameStart = c.start; sym.nameEnd = c.end; sym.nameRank = rank; }
            }
        });
    };

    const tree = parsed.tree;
    if (tree) walk(tree, null, null, top, null, null);

    // The comments, merged into the tokens in text order; a run of own-line comments folds.
    const comments = tree ? commentsOf(tree, grammar) : [];
    if (comments.length) {
        const merged: SemanticToken[] = [];
        let k = 0;
        for (const c of comments) {
            while (k < tokens.length && tokens[k].start < c.start) merged.push(tokens[k++]);
            merged.push({ start: c.start, end: c.end, role: 'comment', modifiers: [] });
        }
        while (k < tokens.length) merged.push(tokens[k++]);
        tokens.length = 0;
        tokens.push(...merged);
        let run: { a: number; b: number } | null = null;
        const flush = (): void => { if (run && run.b > run.a) folds.push({ startLine: run.a + 1, endLine: run.b + 1, kind: 'comment' }); run = null; };
        for (const c of comments) {
            const a = lineOf(c.start);
            const ownLine = text.slice(lineStarts[a], c.start).trim() === '';
            if (!ownLine) { flush(); continue; }
            const b = lineOf(Math.max(c.start, c.end - 1));
            if (run && a === run.b + 1) run.b = b;
            else { flush(); run = { a, b }; }
        }
        flush();
    }
    folds.sort((x, y) => x.startLine - y.startLine || y.endLine - x.endLine);

    let encoded: Uint32Array | null = null;
    const encodedTokens = (): Uint32Array => {
        if (encoded) return encoded;
        const data: number[] = [];
        let pl = 0;
        let pc = 0;
        const push = (line: number, col: number, length: number, role: number, bits: number): void => {
            data.push(line - pl, line === pl ? col - pc : col, length, role, bits);
            pl = line;
            pc = col;
        };
        for (const t of tokens) {
            const role = SEMANTIC_ROLES.indexOf(t.role);
            const bits = t.modifiers.reduce((b, m) => b | (1 << SEMANTIC_MODIFIERS.indexOf(m)), 0);
            // A token never spans a line in Monaco: a block comment is cut at each line end.
            let from = t.start;
            let line = lineOf(from);
            while (from < t.end) {
                const next = line + 1 < lineStarts.length ? lineStarts[line + 1] : Infinity;
                const to = Math.min(t.end, next - 1);
                if (to > from) push(line, from - lineStarts[line], to - from, role, bits);
                from = next;
                line++;
            }
        }
        encoded = new Uint32Array(data);
        return encoded;
    };

    /** The read token at `offset`: the one starting there, else the one it is inside or just after. */
    const infoAt = (offset: number): TokenInfo | null => {
        let lo = 0;
        let hi = infos.length - 1;
        let found = -1;
        while (lo <= hi) {
            const m = (lo + hi) >> 1;
            if (infos[m].token.start <= offset) { found = m; lo = m + 1; } else hi = m - 1;
        }
        const i = found >= 0 ? infos[found] : null;
        return i && offset <= i.token.end ? i : null;
    };

    const nameRange = (s: MutableSymbol): TextRange => ({ start: s.nameStart, end: s.nameEnd });

    /** The object declared at `offset` (its name or class keyword), or named by the reference there. */
    const targetAt = (offset: number): string | null => {
        const i = infoAt(offset);
        if (!i) return null;
        if (i.ref) {
            const to = i.ref.ref?.to;
            return typeof to === 'string' ? to : null;
        }
        return i.object && (i.token.role === 'name' || i.token.role === 'class') ? i.object.id : null;
    };

    const parentOf = new Map<MutableSymbol, MutableSymbol>();
    const link = (ss: readonly MutableSymbol[], parent?: MutableSymbol): void => {
        for (const s of ss) {
            if (parent) parentOf.set(s, parent);
            link(s.children, s);
        }
    };
    link(top);

    const classes = new Map<string, TextClass>(mm.classes.map(c => [c.name, c]));
    const enums = new Map<string, TextEnumeration>(mm.enumerations.map(e => [e.name, e]));
    const featuresOf = featureTable(mm);
    const featureOf = (cls: string, name: string): TextFeature | undefined => featuresOf(cls).find(f => f.name === name);
    const declOf = (f: TextFeature): TextAttribute | TextReference | undefined => {
        const owner = classes.get(f.owner);
        return f.kind === 'attribute' ? owner?.attributes?.find(a => a.name === f.name) : owner?.references?.find(r => r.name === f.name);
    };

    const featureHover = (cls: string, name: string): string[] => {
        const f = featureOf(cls, name);
        if (!f) return [code(name)];
        const decl = declOf(f);
        const kind = f.kind === 'attribute' ? 'attribute' : f.kind === 'containment' ? 'containment' : 'reference';
        const order = f.ordered === undefined ? '' : f.ordered ? ', ordered' : ', unordered';
        return [`${code(f.name)} : ${code(f.type)} ${bounds(f, decl)}`, `${kind} of ${code(f.owner)}${order}`, ...(decl?.doc ? [decl.doc] : [])];
    };

    const classHover = (cls: string): string[] => {
        const c = classes.get(cls);
        const supers = c?.supers?.length ? `, extends ${c.supers.map(code).join(', ')}` : '';
        return [`${c?.isAbstract ? 'abstract class' : 'class'} ${code(cls)}${supers}`, ...(c?.doc ? [c.doc] : [])];
    };

    const objectHover = (s: MutableSymbol | undefined, cls: string): string[] => {
        const parent = s ? parentOf.get(s) : undefined;
        const where = !s ? [] : s.feature && parent ? [`in ${code(s.feature)} of ${code(parent.name)}`] : [];
        const state = !s || !s.recovered ? [] : [s.unclosed ? 'its block or an enclosing one is left open: shown, never applied'
            : 'recovered from a broken text: shown, never applied'];
        return [`**${s?.named ? s.name : cls}**${s?.named ? ` : ${code(cls)}` : ''}`, ...classHover(cls), ...where, ...state];
    };

    const hoverAt = (offset: number): TextHover | null => {
        const i = infoAt(offset);
        if (!i || !i.object) return null;
        const t = i.token;
        const cls = i.object.cls;
        if (i.ref) {
            const r = i.ref.ref;
            const at = { start: r?.start ?? i.ref.start, end: r?.end ?? i.ref.end };
            const head = featureHover(cls, i.ref.feature);
            const to = r?.to;
            let target: string;
            if (isOuterRef(to)) target = `names ${code(to.outer)}, an object outside the text`;
            else if (typeof to === 'string') {
                const s = symbolOf.get(to);
                target = s ? `names **${s.name}**${s.named ? ` : ${code(s.cls ?? '')}` : ''}, line ${lineOf(s.nameStart) + 1}` : `names ${code(to)}`;
            } else if (r && !r.error) target = 'names nothing in the text: it keeps the target it was printed for';
            else target = `names nothing in the text${r?.error ? `: ${r.error.message}` : ''}`;
            return { ...at, contents: [target, ...head] };
        }
        const range = { start: t.start, end: t.end };
        switch (i.role) {
            case 'type': case 'name': return { ...range, contents: objectHover(symbolOf.get(i.object.id), cls) };
            case 'literal': {
                const f = i.item ? featureOf(cls, i.item.feature) : undefined;
                const e = f ? enums.get(f.type) : undefined;
                const lit = e?.literals.find(l => applyCase(l, grammar.literalCase) === t.v) ?? t.v;
                return { ...range, contents: literalHover(e, lit) };
            }
            default: return i.item ? { ...range, contents: featureHover(cls, i.item.feature) } : null;
        }
    };

    const done = ({ nameRank: _, children, ...s }: MutableSymbol): TextSymbol => ({ ...s, children: children.map(done) });

    return {
        tokens,
        symbols: top.map(done),
        folds,
        encodedTokens,
        definitionAt: offset => {
            const i = infoAt(offset);
            const to = i?.ref?.ref?.to;
            const s = typeof to === 'string' ? symbolOf.get(to) : undefined;
            return s ? nameRange(s) : null;
        },
        referencesAt: (offset, includeDeclaration) => {
            const id = targetAt(offset);
            if (id === null) return [];
            const s = symbolOf.get(id);
            return [...(includeDeclaration && s ? [nameRange(s)] : []), ...(refsTo.get(id) ?? [])];
        },
        hoverAt,
    };
}

/**
 * A node of the outline (step B2, R-TXT-39 (1), (2); design in docs/discovery/discovery_2026-11-04_textual_b2_outline_hover.md,
 * recommended design items 1 and 2): an object, the group of a feature the text prints a keyword for, or the
 * `unknown container` group of the objects read inside a skipped block.
 */
export interface OutlineNode extends TextRange {
    /** The path of labels from the top, unique: what keeps a node's expansion across versions of the text. */
    readonly key: string;
    readonly kind: 'object' | 'group' | 'unknown';
    /** The parsed object's id; objects only. */
    readonly id?: string;
    readonly cls?: string;
    /** A name; for an unnamed object rule C4', with ` [k]` when siblings collide; a group's keyword as printed. */
    readonly label: string;
    /** Secondary text: a named object's class, the feature an unnamed object's label comes from, a group's object count. */
    readonly detail: string;
    readonly named: boolean;
    /** An object's feature in its container, a group's own feature; absent at the top and in the unknown group. */
    readonly feature?: string;
    /** The name token, else the class keyword, else the first token; a group's keyword: what a click selects. */
    readonly selectStart: number;
    readonly selectEnd: number;
    /** As `TextSymbol.recovered` and `TextSymbol.unclosed`; false on groups. */
    readonly recovered: boolean;
    readonly unclosed: boolean;
    readonly children: readonly OutlineNode[];
}

export interface TextOutline {
    readonly nodes: readonly OutlineNode[];
    /** The nodes from the top down to the innermost one holding `offset`; empty outside every node. */
    pathAt(offset: number): OutlineNode[];
}

interface MutableOutline {
    key: string;
    kind: OutlineNode['kind'];
    id?: string;
    cls?: string;
    label: string;
    detail: string;
    named: boolean;
    feature?: string;
    start: number;
    end: number;
    selectStart: number;
    selectEnd: number;
    selectRank: number;
    recovered: boolean;
    unclosed: boolean;
    /** The index the object's path segment prints: within its feature, or among the top objects of its class. */
    k: number;
    children: MutableOutline[];
}

const LABEL_MAX = 24;
const cut = (v: string): string => (v.length > LABEL_MAX ? `${v.slice(0, LABEL_MAX - 1)}…` : v);
const PLAIN_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Rule C4' (R-TXT-39 (2)): the value an unnamed object is told apart by, from its own single values in text order. The
 * first one written as a name (a reference by name, an enum literal), else the first attribute value as printed
 * (strings keep their quotes, cut at 24 characters); null when there is neither, and the label falls to `Class[k]`.
 */
function distinguishing(text: string, o: ObjectNode): { value: string; feature: string } | null {
    let name: { value: string; feature: string } | null = null;
    let value: { value: string; feature: string } | null = null;
    const walk = (n: SyntaxNode): void => {
        for (const c of n.children) {
            if (name) return;
            if (c.kind === 'token' || c.kind === 'object' || c.kind === 'list') continue;
            if (c.kind === 'item' && c.feature !== 'name' && !c.children.some(x => x.kind === 'object' || x.kind === 'block')) {
                const ref = c.children.find((x): x is RefNode => x.kind === 'ref');
                const tok = c.children.find((x): x is SyntaxToken => x.kind === 'token' && (x.role === 'value' || x.role === 'literal'));
                if (ref) {
                    const written = text.slice(ref.start, ref.end);
                    // A path or `@"id"` is readable as a path, poor as a label: rule C4' drops that tier.
                    if (PLAIN_NAME.test(written)) name = { value: written, feature: c.feature };
                } else if (tok?.role === 'literal') name = { value: tok.raw, feature: c.feature };
                else if (tok && !value) value = { value: tok.raw, feature: c.feature };
            }
            walk(c);
        }
    };
    walk(o);
    return name ?? value;
}

/**
 * Ticket #687: `offset` is inside a comment of the tokens' trivia, scanned as `commentsOf` scans it (parser.ts): after its
 * first character, up to a line comment's end (the line break excluded) or an unclosed block comment's, before a closed
 * block comment's last character.
 */
function insideTrivia(tokens: readonly SyntaxToken[], offset: number, comments: ConcreteGrammar['style']['comments']): boolean {
    const { line, block } = comments;
    const scan = (trivia: string, at: number): boolean => {
        let j = 0;
        while (j < trivia.length) {
            let e = -1;
            let open = true;
            if (line && trivia.startsWith(line, j)) { e = trivia.indexOf('\n', j); if (e < 0) e = trivia.length; }
            else if (block && trivia.startsWith(block[0], j)) {
                const close = trivia.indexOf(block[1], j + block[0].length);
                open = close < 0;
                e = open ? trivia.length : close + block[1].length;
            }
            if (e < 0) { j++; continue; }
            if (at + j < offset && (offset < at + e || (open && offset === at + e))) return true;
            j = e;
        }
        return false;
    };
    return tokens.some(t => (!!t.leading && scan(t.leading, t.start - t.leading.length)) || (!!t.trailing && scan(t.trailing, t.end)));
}

/**
 * The outline of `text` as `parsed` read it: the objects in text order, nested as the text nests them. An `item` that
 * holds a keyword token itself and contains objects is a group node labelled with that keyword, so a grouped containment
 * gives two levels and an inline one, printing no keyword, none (R-TXT-39 (1)). Unnamed objects are labelled by rule C4'.
 */
/**
 * What may be written at `offset` of `text` (D2b, report §3.3 C2, decisions D3 and D10), from the parser's expected set
 * at the word the cursor is in or ends, else at the cursor (D2a). Keywords and style tokens as written, a block's tokens
 * among them, a multi-word close whole and its rest once begun; enumeration literals as the text writes them, with their
 * hover; the objects of the text a reference may name, written as the printer writes them (`textNaming`: the name when
 * unique among the targets, else the path), never `@"id"`. No candidate for a new name or a value. In the order the
 * parser tested them, without repeats.
 */
export function completionsAt(text: string, offset: number, grammar: ConcreteGrammar, mm: TextMetamodel): TextCompletion[] {
    const tokens = tokenizeText(text, grammar).tokens;
    // Ticket #687: nothing is offered inside a comment or a string, so Enter at a comment's end breaks the line.
    if (insideTrivia(tokens, offset, grammar.style.comments) || tokens.some(t => t.k === 'STR' && t.start < offset && offset < t.end)) return [];
    const word = tokens.find(t => t.k === 'ID' && t.start < offset && offset <= t.end);
    const range: TextRange = word ? { start: word.start, end: word.end } : { start: offset, end: offset };
    const parsed = parseText(text, grammar, { cursor: range.start });
    const enums = new Map<string, TextEnumeration>(mm.enumerations.map(e => [e.name, e]));
    /** The enumeration a literal rule reads: a grouping's derived rule names it on its literals (concreteGrammar.ts). */
    const enumOf = (rule: string): TextEnumeration | undefined => {
        const r = grammar.rules.find(x => x.t === 'enum' && x.name === rule);
        const first = r?.t === 'enum' && r.body.t === 'alt' ? r.body.alts[0] : undefined;
        const src = first?.t === 'kw' ? first.src : undefined;
        return enums.get(src?.k === 'literal' ? src.enumName : rule);
    };
    const out: TextCompletion[] = [];
    const seen = new Set<string>();
    const add = (label: string, kind: TextCompletion['kind'], doc?: readonly string[]): void => {
        const key = `${kind} ${label}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ label, kind, ...range, ...(doc ? { doc } : {}) });
    };
    let naming: TextNaming | undefined;
    for (const e of parsed.expected ?? []) {
        switch (e.kind) {
            case 'kw': case 'p': case 'block': add((e.words ?? [e.matcher.replace(/^(ID|P):/, '')]).join(' '), 'keyword'); break;
            case 'lit': add(e.matcher.replace(/^ID:/, ''), 'literal', literalHover(e.rule === undefined ? undefined : enumOf(e.rule), e.literal ?? e.matcher)); break;
            case 'xref': {
                // One item per matcher of the reference (a name, a string, `@`): the targets once, `@"id"` never (D3).
                const targets = e.targets ?? [];
                naming ??= textNaming(grammar, parsed.objects);
                for (const o of parsed.objects) if (targets.includes(o.cls)) add(naming.ref(targets, o), 'reference');
                break;
            }
            case 'tok': break;
        }
    }
    return out;
}

export function textOutline(text: string, parsed: TextParseResult, grammar: ConcreteGrammar): TextOutline {
    const byId = new Map(parsed.objects.map(o => [o.id, o]));
    const top: MutableOutline[] = [];
    const seen = new Map<string, number>();
    const nextK = (key: string): number => {
        const k = seen.get(key) ?? 0;
        seen.set(key, k + 1);
        return k;
    };

    const walk = (n: SyntaxNode, object: ObjectNode | null, at: MutableOutline | null, into: MutableOutline[], feature: string | null, unknown: boolean): void => {
        let here = into;
        let group: MutableOutline | null = null;
        if (n.kind === 'object') {
            const o = byId.get(n.id);
            const name = typeof o?.slots.name === 'string' ? o.slots.name : '';
            const kw = pathKeyword(grammar, n.cls);
            const k = nextK(object ? `${object.id}.${feature}` : `${unknown ? 'unknown' : 'top'}.${n.cls}`);
            const value = name ? null : distinguishing(text, n);
            const s: MutableOutline = {
                key: '', kind: 'object', id: n.id, cls: n.cls,
                label: name || (value ? `${kw} ${cut(value.value)}` : `${kw}[${k}]`),
                detail: name ? kw : value?.feature ?? '', named: name !== '',
                ...(object && feature !== null ? { feature } : {}),
                start: n.start, end: n.end, selectStart: n.start, selectEnd: n.start, selectRank: 3,
                recovered: n.state !== 'complete' || !!n.orphan, unclosed: n.state === 'unclosed', k, children: [],
            };
            into.push(s);
            object = n;
            at = s;
            here = s.children;
            feature = null;
        } else if (n.kind === 'item' || n.kind === 'list') {
            feature = n.feature;
            const kw = n.kind === 'item' ? n.children.find((c): c is SyntaxToken => c.kind === 'token' && c.role === 'keyword') : undefined;
            if (kw) {
                group = {
                    key: '', kind: 'group', label: kw.raw, detail: '', named: false, feature: n.feature, start: n.start, end: n.end,
                    selectStart: kw.start, selectEnd: kw.end, selectRank: 0, recovered: false, unclosed: false, k: 0, children: [],
                };
                here = group.children;
            }
        } else if (n.kind === 'error' && n.children.some(c => c.kind === 'object')) {
            // R-TXT-36, as in `analyzeText`: the objects read inside a skipped block sit in a group where the block was.
            const g: MutableOutline = {
                key: '', kind: 'unknown', label: UNKNOWN_CONTAINER, detail: '', named: false, start: n.start, end: n.end,
                selectStart: n.start, selectEnd: n.start, selectRank: 0, recovered: true, unclosed: false, k: 0, children: [],
            };
            into.push(g);
            here = g.children;
            object = null;
            feature = null;
            unknown = true;
        }
        for (const c of n.children) {
            if (c.kind !== 'token') { walk(c, object, at, here, feature, unknown); continue; }
            if (!c.role || !at || !object || at.id !== object.id) continue;
            const rank = c.role === 'name' ? 0 : c.role === 'class' ? 1 : 2;
            if (rank < at.selectRank) { at.selectStart = c.start; at.selectEnd = c.end; at.selectRank = rank; }
        }
        // A keyword item holding no object is a single value, not a group. R-TXT-44 (3): the items of one per-item keyword
        // feature, which the grammar reads one after the other, share the group of the first.
        const last = into[into.length - 1];
        if (group && group.children.length && last?.kind === 'group' && last.feature === group.feature && last.label === group.label) {
            last.children.push(...group.children);
            last.end = group.end;
        } else if (group && group.children.length) into.push(group);
    };
    if (parsed.tree) walk(parsed.tree, null, null, top, null, false);

    const count = (s: MutableOutline): number => s.children.reduce((a, c) => a + (c.kind === 'object' ? 1 : count(c)), 0);
    const finish = (ss: MutableOutline[], parent: string): OutlineNode[] => {
        const labels = new Map<string, number>();
        for (const s of ss) if (s.kind === 'object' && !s.named) labels.set(s.label, (labels.get(s.label) ?? 0) + 1);
        const keys = new Map<string, number>();
        return ss.map(s => {
            // R-TXT-39 (2), the chat's answer: the index only where two unnamed siblings read the same.
            if (s.kind === 'object' && !s.named && (labels.get(s.label) ?? 0) > 1) s.label = `${s.label} [${s.k}]`;
            if (s.kind === 'group') s.detail = String(count(s));
            const base = `${parent}/${s.kind === 'group' ? `${s.feature}:` : ''}${s.label}`;
            const dup = keys.get(base) ?? 0;
            keys.set(base, dup + 1);
            const { selectRank: _r, k: _k, children, ...rest } = s;
            const key = dup ? `${base}#${dup}` : base;
            return { ...rest, key, children: finish(children, key) };
        });
    };
    const nodes = finish(top, '');

    const pathAt = (offset: number): OutlineNode[] => {
        const out: OutlineNode[] = [];
        let level: readonly OutlineNode[] = nodes;
        for (;;) {
            const hit = level.find(s => s.start <= offset && offset < s.end) ?? level.find(s => s.end === offset && s.start < offset);
            if (!hit) return out;
            out.push(hit);
            level = hit.children;
        }
    };
    return { nodes, pathAt };
}

/** D4 (report §5): one edit of a rename, `[start, end)` of the text replaced with `text`. */
export interface TextRenameEdit extends TextRange {
    readonly text: string;
}

/** A rename the service will not do, and why, in words for the rename box. */
export interface TextRenameRefusal {
    readonly refused: string;
}

/** Where a rename starts: the token at the cursor, the name or a reference to it, and the object's name as one types it. */
export interface TextRenameLocation extends TextRange {
    readonly name: string;
}

/** R-TXT-45, decision D4: a name is inserted by typing it; the rename box only replaces one. */
const RENAME_NAMELESS = 'this object has no name: type one in the text';

interface RenameTarget {
    readonly parsed: TextParseResult;
    readonly tokens: ReadonlyMap<number, SyntaxToken>;
    readonly id: string;
    readonly name: string;
    /** The range of the cursor's token. */
    readonly at: TextRange;
    /** The object's name token, then the references to it written as its name, in text order. */
    readonly ranges: readonly TextRange[];
}

/** The object a rename at `offset` renames, on an applicable parse of `text` only (R-TXT-21 (8)). */
function renameTarget(text: string, offset: number, grammar: ConcreteGrammar, mm: TextMetamodel, keep: ParseOptions['keep']): RenameTarget | TextRenameRefusal {
    const parsed = parseText(text, grammar, keep ? { keep } : {});
    if (!isApplicableParse(parsed)) return { refused: 'the text has errors: fix them before renaming' };
    if (parsed.refs?.some(r => r.outer && r.start <= offset && offset <= r.end)) {
        return { refused: 'this reference names an object outside the text (`@"id"`): rename that object where it is printed' };
    }
    const tokens = new Map((parsed.tree?.tokens ?? []).map(t => [t.start, t]));
    const analysis = analyzeText(text, parsed, grammar, mm);
    const found = analysis.referencesAt(offset, true);
    const symbols = (ss: readonly TextSymbol[]): TextSymbol[] => ss.flatMap(s => [s, ...symbols(s.children)]);
    const decl = found[0];
    const s = decl ? symbols(analysis.symbols).find(x => x.kind === 'object' && x.nameStart === decl.start && x.nameEnd === decl.end) : undefined;
    if (!decl || !s?.id) return { refused: "nothing to rename here: put the cursor on an object's name or on a reference to it" };
    const o = parsed.objects.find(x => x.id === s.id);
    const name = typeof o?.slots.name === 'string' ? o.slots.name : '';
    if (!s.named || tokens.get(decl.start)?.role !== 'name' || name === '') return { refused: RENAME_NAMELESS };
    // A reference written as a name is one token, a name or a string; a path (`keyword[k].f[i]`) is several and names no name.
    const byName = (r: TextRange): boolean => {
        const t = tokens.get(r.start);
        return !!t && t.end === r.end && (t.k === 'ID' || t.k === 'STR');
    };
    const ranges = [decl, ...found.slice(1).filter(byName)];
    const at = found.find(r => r.start <= offset && offset <= r.end) ?? decl;
    return { parsed, tokens, id: s.id, name, at, ranges };
}

/**
 * Where the rename box opens at `offset` of `text` (D4, report §5): the token at the cursor, the object's name or a
 * reference to it, with the name as one types it, a quoted name without its quotes. Refused on a text that is not an
 * applicable parse, on a nameless object (R-TXT-45), on `@"id"`, and away from any object's name or reference.
 */
export function renameLocation(text: string, offset: number, grammar: ConcreteGrammar, mm: TextMetamodel, keep?: ParseOptions['keep']): TextRenameLocation | TextRenameRefusal {
    const t = renameTarget(text, offset, grammar, mm, keep);
    return 'refused' in t ? t : { start: t.at.start, end: t.at.end, name: t.name };
}

/**
 * The edits that rename the object at `offset` of `text` to `newName` (D4, report §5.2 and §5.3, decision D4 of
 * R-TXT-53): its name token and every reference token that names it by its name, the declaration first, then in text
 * order, each written as the printer writes a name (`textNaming`: bare when an identifier and no reserved word, else
 * quoted). Paths and `@"id"` are never rewritten: they name no name. The edits are checked on the text they make, parsed
 * with the same carried tokens shifted by the edits (R-TXT-35): refused when that text has an error, or when a reference
 * names another object than before, token by token. `renameLocation`'s refusals hold here too, and an empty name is
 * refused. Names inside JjEL strings and validation rules are not rewritten (step F).
 */
export function renameEdits(text: string, offset: number, newName: string, grammar: ConcreteGrammar, mm: TextMetamodel, keep?: ParseOptions['keep']): { readonly edits: readonly TextRenameEdit[] } | TextRenameRefusal {
    if (newName === '') return { refused: 'a name cannot be empty: to remove it, delete it in the text' };
    const t = renameTarget(text, offset, grammar, mm, keep);
    if ('refused' in t) return t;
    const written = textNaming(grammar, t.parsed.objects).name(newName);
    const edits = t.ranges.map(r => ({ start: r.start, end: r.end, text: written }));

    // §5.3: the edited text, read as the tab would read it after the edits.
    const sorted = [...edits].sort((a, b) => a.start - b.start);
    /** Where an offset of `text` lands in the edited text; an edit's own start does not move. */
    const shift = (p: number): number => {
        let d = 0;
        for (const e of sorted) {
            if (e.end > p) break;
            d += e.text.length - (e.end - e.start);
        }
        return p + d;
    };
    let after = text;
    for (const e of [...sorted].reverse()) after = after.slice(0, e.start) + e.text + after.slice(e.end);
    const moved = keep?.map(k => ({ start: shift(k.start), end: shift(k.end), text: k.text }));
    const next = parseText(after, grammar, moved ? { keep: moved } : {});
    const quoted = JSON.stringify(newName);
    if (!isApplicableParse(next)) {
        const e = next.errors[0];
        return { refused: e ? `renaming to ${quoted} gives the text an error at ${e.line}:${e.col}: ${e.message}` : `renaming to ${quoted} leaves an object of the text unread` };
    }
    const startsBefore = new Map(t.parsed.spans.map(s => [s.id, s.start]));
    const startsAfter = new Map(next.spans.map(s => [s.id, s.start]));
    /** What a reference names, comparable across the two texts: the start of its target in the edited text. */
    const target = (to: ParsedRef['to'], starts: ReadonlyMap<string, number>, move: (p: number) => number): string =>
        to === undefined ? 'nothing' : isOuterRef(to) ? `outer ${to.outer}` : `at ${move(starts.get(to) ?? -1)}`;
    const refsAfter = new Map((next.refs ?? []).map(r => [r.start, r]));
    for (const r of t.parsed.refs ?? []) {
        const n = refsAfter.get(shift(r.start));
        if (n && target(r.to, startsBefore, shift) === target(n.to, startsAfter, p => p)) continue;
        const tok = t.tokens.get(r.start);
        return { refused: `renaming to ${quoted} changes what the reference at ${tok ? `${tok.line}:${tok.col}` : r.start} names` };
    }
    if ((next.refs ?? []).length !== (t.parsed.refs ?? []).length) return { refused: `renaming to ${quoted} changes the references of the text` };
    const renamed = next.objects.find(o => startsAfter.get(o.id) === shift(startsBefore.get(t.id) ?? -1));
    if (renamed?.slots.name !== newName) return { refused: `${quoted} does not read back as the object's name` };
    return { edits };
}

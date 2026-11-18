/**
 * JjEL islands (step F, lane F1a, P-2026-11-07-1356; R-TXT-55 F1, docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md
 * §4.3): the values of the attributes that hold JjEL (`TextAttribute.jjel`) in a parsed text, each with its place in the
 * text and the map from an offset of the value, as JjEL reads it, to an offset of the text, as the string is written.
 *
 * A value is the `STR` token of an item of its feature. The map re-reads the token's `raw` with the style's escape rule,
 * as the tokenizer does (parser.ts `tokenize`): `\"`, `\\`, `\n` under `backslash`; a doubled quote and the joined
 * character codes `'a'#10'b'` under `double` (D4). Every character of the value has the place it is written at, so a
 * range of the value maps to a range of the text that covers whole escapes and never a quote between two pieces.
 *
 * Pure: no Monaco, no joiner, so the bench imports it (CLAUDE.md §5, the `nameLookup.ts` example).
 */

import { classFeatures } from './metamodel';
import type { JjelMode, TextFeature, TextMetamodel } from './metamodel';
import type { SyntaxElement, SyntaxToken, TextParseResult } from './parser';
import type { NotationStyle } from './style';
import { tokenize } from '../../jjel/lexer';
import { parseAction, parseExpressionStrict } from '../../jjel/parser';
import { JjelTokenType } from '../../jjel/types';

export interface JjelIsland {
    /** The parsed object the value belongs to (`TextParseResult.objects`). */
    readonly owner: string;
    readonly feature: string;
    readonly mode: JjelMode;
    /** The string token in the text, its quotes included. */
    readonly start: number;
    readonly end: number;
    /** The value unescaped, as JjEL reads it. */
    readonly value: string;
    /** `map[k]`: the text offset where the value's character `k` is written; `ends[k]`: the offset after it. */
    readonly map: readonly number[];
    readonly ends: readonly number[];
    /** F1e: the owner's class and the names of its features, inherited included, as `self.<f>` may read them. */
    readonly cls?: string;
    readonly features?: readonly string[];
}

/** The value of a string token and where each of its characters is written, under the style's escape rule. */
export function valueMap(raw: string, at: number, string: NotationStyle['string']): { value: string; map: number[]; ends: number[] } {
    const { quote, escape } = string;
    let value = '';
    const map: number[] = [];
    const ends: number[] = [];
    const put = (s: string, from: number, to: number): void => {
        // A code point above U+FFFF is two characters of the value, both written at the same place.
        for (let u = 0; u < s.length; u++) { map.push(at + from); ends.push(at + to); }
        value += s;
    };
    let j = 0;
    for (let piece = true; ; ) {
        let closed = false;
        if (piece) {
            j++;
            while (j < raw.length) {
                const c = raw[j];
                if (escape === 'backslash' && c === '\\' && j + 1 < raw.length) {
                    const e = raw[j + 1];
                    put(e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '\r' : e, j, j + 2);
                    j += 2;
                    continue;
                }
                if (c === quote) {
                    if (escape === 'double' && raw[j + 1] === quote) { put(quote, j, j + 2); j += 2; continue; }
                    closed = true;
                    j++;
                    break;
                }
                put(c, j, j + 1);
                j++;
            }
            if (!closed) break;
        } else {
            const digits = /^[0-9]+/.exec(raw.slice(j + 1))![0];
            const n = Number(digits);
            if (n <= 0x10ffff) put(String.fromCodePoint(n), j, j + 1 + digits.length);
            j += 1 + digits.length;
        }
        if (escape !== 'double') break;
        if (raw[j] === '#' && /[0-9]/.test(raw[j + 1] ?? '')) piece = false;
        else if (raw[j] === quote) piece = true;
        else break;
    }
    return { value, map, ends };
}

/** The text offset of the value offset `k`, from 0 to the value's length: the end of the value sits before its close. */
export function islandOffset(island: JjelIsland, k: number): number {
    if (k < island.map.length) return island.map[Math.max(0, k)];
    return island.ends.length ? island.ends[island.ends.length - 1] : island.start + 1;
}

/** The text range of the value range `[from, to)`: whole escapes, no quote of a piece join at either end. */
export function islandRange(island: JjelIsland, from: number, to: number): { start: number; end: number } {
    if (to <= from) { const at = islandOffset(island, from); return { start: at, end: at }; }
    return { start: islandOffset(island, from), end: island.ends[Math.min(to, island.ends.length) - 1] };
}

/** A token of an island's value as the JjEL lexer reads it, placed in the text; `after` the type of the token before it. */
export interface IslandToken {
    readonly start: number;
    readonly end: number;
    readonly type: JjelTokenType;
    readonly after?: JjelTokenType;
}

/**
 * The tokens of an island's value (lane F1b, R-TXT-55 F2), in text order, each through the map so that it covers whole
 * escapes; an action lexes `:=`. Null when the lexer refuses the value (report §9 R2): the island is then one string.
 */
export function islandTokens(island: JjelIsland): IslandToken[] | null {
    const { tokens, errors } = tokenize(island.value, { actionMode: island.mode === 'action' });
    if (errors.length) return null;
    const out: IslandToken[] = [];
    let after: JjelTokenType | undefined;
    for (const t of tokens) {
        if (t.end <= t.start) continue;
        const r = islandRange(island, t.start, t.end);
        out.push({ start: r.start, end: r.end, type: t.type, ...(after ? { after } : {}) });
        after = t.type;
    }
    return out;
}

/**
 * The places of the island's text no character of the value is written at: the quotes, and under `double` the quotes
 * and `#` of a join. What is left is the value's own text, its escapes included.
 */
export function islandDelimiters(island: JjelIsland): { start: number; end: number }[] {
    const out: { start: number; end: number }[] = [];
    let at = island.start;
    for (let k = 0; k < island.map.length; k++) {
        if (island.map[k] > at) out.push({ start: at, end: island.map[k] });
        at = Math.max(at, island.ends[k]);
    }
    if (island.end > at) out.push({ start: at, end: island.end });
    return out;
}

/**
 * Every JjEL value of a parsed text, in text order: the string tokens of the items whose feature, on the class of the
 * object they belong to, is an attribute with `jjel` set. Tokens the parser skipped (an error node) are not values.
 */
export function jjelIslands(parsed: TextParseResult, mm: TextMetamodel, style: NotationStyle): JjelIsland[] {
    const out: JjelIsland[] = [];
    if (!parsed.tree) return out;
    const featuresOf = new Map<string, readonly TextFeature[]>();
    const jjelFeature = (cls: string, name: string): TextFeature | undefined => {
        let fs = featuresOf.get(cls);
        if (!fs) {
            const c = mm.classes.find(k => k.name === cls);
            fs = c ? classFeatures(mm, c) : [];
            featuresOf.set(cls, fs);
        }
        return fs.find(f => f.name === name && f.kind === 'attribute' && f.jjel);
    };
    const island = (t: SyntaxToken, owner: { id: string; cls: string }, f: TextFeature): void => {
        const { value, map, ends } = valueMap(t.raw, t.start, style.string);
        // The map is read as the tokenizer reads: a value it does not give back is not mapped, never mapped wrong.
        if (value !== t.v) return;
        const features = (featuresOf.get(owner.cls) ?? []).map(k => k.name);
        out.push({ owner: owner.id, feature: f.name, mode: f.jjel!, start: t.start, end: t.end, value, map, ends, cls: owner.cls, features });
    };
    const walk = (n: SyntaxElement, owner: { id: string; cls: string } | null, f: TextFeature | undefined): void => {
        if (n.kind === 'token') {
            if (n.k === 'STR' && owner && f) island(n, owner, f);
            return;
        }
        if (n.kind === 'error') return;
        if (n.kind === 'object') { for (const c of n.children) walk(c, { id: n.id, cls: n.cls }, undefined); return; }
        const next = n.kind === 'item' && owner ? jjelFeature(owner.cls, n.feature) : f;
        for (const c of n.children) walk(c, owner, next);
    };
    walk(parsed.tree, null, undefined);
    return out;
}

/** A JjEL error of an island, placed in the text (lane F1c, R-TXT-55 F3): the offending token's range and the parser's message. */
export interface JjelDiagnostic {
    readonly start: number;
    readonly end: number;
    readonly message: string;
}

/** The value offset of a JjEL line and column, both from 1, through the value's own lines; clamped to the value. */
function valueOffset(value: string, line: number, column: number): number {
    let at = 0;
    for (let l = 1; l < line; l++) {
        const nl = value.indexOf('\n', at);
        if (nl < 0) break;
        at = nl + 1;
    }
    return Math.min(Math.max(at + column - 1, 0), value.length);
}

const SELF_NAVIGATION = new Set<JjelTokenType>([JjelTokenType.DOT, JjelTokenType.QUESTION_DOT]);
const ANY_NAVIGATION = new Set<JjelTokenType>([JjelTokenType.DOT, JjelTokenType.QUESTION_DOT, JjelTokenType.DOT_LBRACKET]);

/**
 * F1e (R-TXT-55 F5, report §4.3): the `self.<f>` and `self?.<f>` of a well-formed island whose `<f>` is not a feature
 * of the owner's class, each on its `<f>`. Only `self` as a root, never after a navigation; `self.<f>(...)` is a method
 * and `self.[x]` state (JjEL SPEC §5.10), neither a feature. An island with no class is not checked.
 */
function selfNames(island: JjelIsland): JjelDiagnostic[] {
    const { cls, features } = island;
    if (cls === undefined || !features) return [];
    const tokens = tokenize(island.value, { actionMode: island.mode === 'action' }).tokens.filter(t => t.end > t.start);
    const out: JjelDiagnostic[] = [];
    for (let i = 0; i + 2 < tokens.length; i++) {
        const [root, nav, name] = [tokens[i], tokens[i + 1], tokens[i + 2]];
        if (root.type !== JjelTokenType.IDENTIFIER || root.value !== 'self') continue;
        if (i > 0 && ANY_NAVIGATION.has(tokens[i - 1].type)) continue;
        if (!SELF_NAVIGATION.has(nav.type) || tokens[i + 3]?.type === JjelTokenType.LPAREN) continue;
        if (features.includes(name.value)) continue;
        out.push({ ...islandRange(island, name.start, name.end), message: `${name.value} is not a feature of ${cls}` });
    }
    return out;
}

/**
 * The JjEL errors of the islands (lane F1c, R-TXT-55 F3, report §4.3): each value parsed as conformance parses it
 * (`ConformanceValidator.ts`, R-SIM-44), with its exemptions, a blank value and the literal `else` of an Expression.
 * One diagnostic per island (report §9 R2): the parser stops at its first error, and a lexer error comes back as the
 * parse's. The parser gives a line and a column, no end: the end is the offending token's, re-lexed as the entry point
 * lexes; an error at the end of the value marks its last token, the end of input having no width.
 */
export function checkIslands(islands: readonly JjelIsland[]): JjelDiagnostic[] {
    const out: JjelDiagnostic[] = [];
    for (const island of islands) {
        const { value, mode } = island;
        if (value.trim() === '' || (mode === 'expression' && value === 'else')) continue;
        let parsed: boolean;
        let errors: readonly { line: number; column: number; message: string }[];
        if (mode === 'expression') {
            const r = parseExpressionStrict(value);
            parsed = r.expression !== null; errors = r.errors;
        } else {
            const r = parseAction(value);
            parsed = r.action !== null; errors = r.errors;
        }
        if (parsed && errors.length === 0) { out.push(...selfNames(island)); continue; }
        const e = errors[0];
        if (!e) { out.push({ ...islandRange(island, 0, value.length), message: `Not a well-formed ${mode}` }); continue; }
        const at = valueOffset(value, e.line, e.column);
        const tokens = tokenize(value, { actionMode: mode === 'action' }).tokens.filter(t => t.end > t.start);
        const t = tokens.find(k => k.start <= at && at < k.end) ?? tokens[tokens.length - 1];
        out.push({ ...(t ? islandRange(island, t.start, t.end) : islandRange(island, at, at)), message: e.message });
    }
    return out;
}

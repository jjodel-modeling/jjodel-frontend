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
    const island = (t: SyntaxToken, owner: string, f: TextFeature): void => {
        const { value, map, ends } = valueMap(t.raw, t.start, style.string);
        // The map is read as the tokenizer reads: a value it does not give back is not mapped, never mapped wrong.
        if (value !== t.v) return;
        out.push({ owner, feature: f.name, mode: f.jjel!, start: t.start, end: t.end, value, map, ends });
    };
    const walk = (n: SyntaxElement, owner: { id: string; cls: string } | null, f: TextFeature | undefined): void => {
        if (n.kind === 'token') {
            if (n.k === 'STR' && owner && f) island(n, owner.id, f);
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

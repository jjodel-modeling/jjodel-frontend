/**
 * Step F, lane F1a (P-2026-11-07-1356; R-TXT-55 F1 and F11, docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md
 * §3.2, §4.3): which attribute values are JjEL, read off the primitive's id as conformance keys it, never off the type's
 * name. The globals are written by hand in the shape eval.ts builds them, the store's imports mocked as textualTab.test.ts
 * does. Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { textInputOf } from '../ui/TextualTab';
import { classFeatures, jjelOf } from '../metamodel';
import type { TextMetamodel, TextObject } from '../metamodel';
import { checkIslands, islandOffset, islandRange, jjelIslands, valueMap } from '../jjelIslands';
import type { JjelIsland } from '../jjelIslands';
import { deriveBaseGrammar } from '../baseGrammar';
import { deriveConcreteGrammar } from '../concreteGrammar';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE, INDENT_STYLE, PASCAL_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { tokenize } from '../../../jjel/lexer';

describe('F1: a JjEL value is an attribute typed by Pointer_EXPRESSION or Pointer_ACTION', () => {
    it('maps the two primitive ids and nothing else (dies on the ids swapped, on a name read as an id, on a prototype key)', () => {
        expect(jjelOf('Pointer_EXPRESSION')).toEqual({ jjel: 'expression' });
        expect(jjelOf('Pointer_ACTION')).toEqual({ jjel: 'action' });
        for (const t of ['Expression', 'Action', 'Pointer_ESTRING', 'constructor', 'toString', '', undefined, null, 42]) expect(jjelOf(t)).toEqual({});
    });

    // The shells as eval.ts builds them: `type` the type's name (eval.ts `attr.type?.name`), measured in the app on
    // DemoESM (R1): `String(a.type)` is `Expression`, `a.type.id` undefined, the lookup's `type` the primitive's id.
    const globals = () => ({
        classes: [{
            id: 'C_T', name: 'Transition', superTypes: [],
            attributes: [
                { id: 'A_name', name: 'name', type: 'EString' },
                { id: 'A_guard', name: 'guard', type: 'Expression' },
                { id: 'A_effect', name: 'effect', type: 'Action' },
                { id: 'A_note', name: 'note', type: 'EString' },
                { id: 'A_fake', name: 'fake', type: 'Expression' },
            ],
            references: [],
        }],
        enumerations: [],
        instances: [],
    });
    const lookup = {
        A_name: { id: 'A_name', type: 'Pointer_ESTRING' },
        A_guard: { id: 'A_guard', type: 'Pointer_EXPRESSION' },
        A_effect: { id: 'A_effect', type: 'Pointer_ACTION' },
        A_note: { id: 'A_note', type: 'Pointer_ESTRING' },
        // A user class called Expression: the name prints the same, the id is not the primitive's.
        A_fake: { id: 'A_fake', type: 'Pointer_UserExpression' },
    };

    it('textInputOf sets `jjel` from the lookup by the attribute id, EString and a namesake class left out (dies on the flag dropped, on the name keyed)', () => {
        const attrs = textInputOf(globals(), lookup).metamodel.classes[0].attributes!;
        const jj = Object.fromEntries(attrs.map(a => [a.name, a.jjel ?? null]));
        expect(jj).toEqual({ name: null, guard: 'expression', effect: 'action', note: null, fake: null });
        expect(attrs.find(a => a.name === 'guard')!.type).toBe('Expression');
        // Without the lookup no attribute is JjEL: the shell holds no id of its type.
        expect(textInputOf(globals()).metamodel.classes[0].attributes!.some(a => a.jjel !== undefined)).toBe(false);
    });

    it('classFeatures carries `jjel` onto the feature, own and inherited (dies on the flag not carried)', () => {
        const mm: TextMetamodel = {
            classes: [
                { name: 'Base', attributes: [{ name: 'guard', type: 'Expression', jjel: 'expression' }] },
                { name: 'Step', supers: ['Base'], attributes: [{ name: 'effect', type: 'Action', jjel: 'action' }, { name: 'note', type: 'EString' }] },
            ],
            enumerations: [],
        };
        const fs = classFeatures(mm, mm.classes[1]);
        expect(fs.map(f => [f.name, f.jjel ?? null])).toEqual([['guard', 'expression'], ['effect', 'action'], ['note', null]]);
        expect('jjel' in fs[2]).toBe(false);
    });
});

// ---- The islands of a parsed text (§4.3, R3) -------------------------------------------------------------------------

const NET_MM: TextMetamodel = {
    classes: [
        { name: 'Net', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'transitions', type: 'Transition', containment: true, many: true }] },
        {
            name: 'Transition',
            attributes: [
                { name: 'name', type: 'EString' },
                { name: 'guard', type: 'Expression', jjel: 'expression' },
                { name: 'effect', type: 'Action', jjel: 'action' },
                { name: 'note', type: 'EString' },
                // F1e: the features F1c's valid values read after `self.`.
                { name: 'count', type: 'EInt' },
                { name: 'label', type: 'EString' },
            ],
        },
    ],
    enumerations: [],
};

// Values chosen for their escapes: `"` and `\` inside a JjEL string under C-like, `'` and a line break under Pascal.
const GUARD = 'self.label == "go" and self.path == "a\\\\b"';
const EFFECT = "count := count + 1\nlabel := 'it'";
const NET_OBJECTS: TextObject[] = [
    { id: 'n', cls: 'Net', slots: { name: 'N', transitions: ['t', 'u'] } },
    { id: 't', cls: 'Transition', slots: { name: 'fire', guard: GUARD, effect: EFFECT, note: 'self.x > 0' } },
    { id: 'u', cls: 'Transition', slots: { name: 'idle', guard: 'n=="q"', effect: null, note: null } },
];

const parsedIn = (style: NotationStyle) => {
    const g = deriveConcreteGrammar(deriveBaseGrammar(NET_MM), style);
    const text = printTextModel(g, NET_OBJECTS).text;
    const parsed = parseText(text, g);
    expect(parsed.errors).toEqual([]);
    return { text, parsed, islands: jjelIslands(parsed, NET_MM, style) };
};

/** The text each JjEL token of the island is written as, through the map. */
const writtenTokens = (text: string, island: JjelIsland): string[] =>
    tokenize(island.value, { actionMode: island.mode === 'action' }).tokens
        .filter(t => t.end > t.start)
        .map(t => { const r = islandRange(island, t.start, t.end); return text.slice(r.start, r.end); });

describe('jjelIslands: the JjEL values of a parsed text', () => {
    for (const style of [CLIKE_STYLE, PASCAL_STYLE, INDENT_STYLE]) {
        it(`${style.id}: one island per Expression and Action value, none for EString (dies on the jjel test dropped, on the owner of the enclosing object)`, () => {
            const { text, parsed, islands } = parsedIn(style);
            const clsOf = (id: string) => parsed.objects.find(o => o.id === id)!;
            expect(islands.map(i => [clsOf(i.owner).slots.name, i.feature, i.mode, i.value])).toEqual([
                ['fire', 'guard', 'expression', GUARD],
                ['fire', 'effect', 'action', EFFECT],
                ['idle', 'guard', 'expression', 'n=="q"'],
            ]);
            for (const i of islands) expect(text[i.start]).toBe(style.string.quote);
            for (const i of islands) expect(text.slice(i.start, i.end)).toBe(parsed.tree!.tokens.find(t => t.start === i.start)!.raw);
        });
    }

    it('reads no island without the tree, nor in a metamodel with no jjel attribute (dies on EString read as JjEL)', () => {
        const { parsed } = parsedIn(CLIKE_STYLE);
        expect(jjelIslands({ ...parsed, tree: undefined }, NET_MM, CLIKE_STYLE)).toEqual([]);
        const plain: TextMetamodel = { ...NET_MM, classes: NET_MM.classes.map(c => ({ ...c, attributes: c.attributes?.map(({ jjel: _j, ...a }) => a) })) };
        expect(jjelIslands(parsed, plain, CLIKE_STYLE)).toEqual([]);
    });
});

describe('the value-to-text map across escapes (R3)', () => {
    /** What each character of the value is written as. */
    const written = (text: string, i: JjelIsland) => [...i.value].map((_, k) => text.slice(i.map[k], i.ends[k]));

    it('c-like: `\\"` and `\\\\` are two characters of the text, one of the value (dies on an escape read as one wide)', () => {
        const { text, islands } = parsedIn(CLIKE_STYLE);
        const [guard, effect] = islands;
        const w = written(text, guard);
        expect(w[GUARD.indexOf('"')]).toBe('\\"');
        expect(w[GUARD.indexOf('\\')]).toBe('\\\\');
        expect(w[0]).toBe('s');
        expect(written(text, effect)[EFFECT.indexOf('\n')]).toBe('\\n');
        // Every character, the value rebuilt from the text through the map: the map is total and in order.
        for (const i of islands) for (let k = 1; k < i.value.length; k++) expect(i.map[k]).toBe(i.ends[k - 1]);
    });

    it("pascal: `''` is one quote of the value, `#10` one line break between two pieces (dies on the doubled quote read as one wide, on the join's quotes mapped)", () => {
        const { text, islands } = parsedIn(PASCAL_STYLE);
        const [guard, effect] = islands;
        expect(text.slice(effect.start, effect.end)).toBe("'count := count + 1'#10'label := ''it'''");
        const w = written(text, effect);
        expect(w[EFFECT.indexOf("'")]).toBe("''");
        expect(w[EFFECT.indexOf('\n')]).toBe('#10');
        // The quotes of the join belong to no character: `1` ends before the first, `l` starts after the second.
        expect(text.slice(effect.ends[EFFECT.indexOf('\n') - 1], effect.map[EFFECT.indexOf('\n')])).toBe("'");
        expect(text.slice(effect.ends[EFFECT.indexOf('\n')], effect.map[EFFECT.indexOf('\n') + 1])).toBe("'");
        // Pascal has no backslash escape: `\` is one character of the text.
        expect(written(text, guard)[GUARD.indexOf('\\')]).toBe('\\');
    });

    it('islandOffset: the end of the value sits before its close quote, an empty value between its quotes (dies on the end read past the quote)', () => {
        const { text, islands } = parsedIn(PASCAL_STYLE);
        const [guard] = islands;
        expect(islandOffset(guard, guard.value.length)).toBe(guard.end - 1);
        expect(islandOffset(guard, 0)).toBe(guard.start + 1);
        const empty: JjelIsland = { owner: 'x', feature: 'guard', mode: 'expression', start: 10, end: 12, value: '', map: [], ends: [] };
        expect(islandOffset(empty, 0)).toBe(11);
        expect(islandRange(empty, 0, 0)).toEqual({ start: 11, end: 11 });
        expect(text[islandOffset(guard, guard.value.length)]).toBe("'");
    });

    it('a code point above U+FFFF from `#128512` is two characters of the value at one place of the text (dies on one place per code point)', () => {
        const raw = "'a'#128512'b'";
        const m = valueMap(raw, 100, PASCAL_STYLE.string);
        expect(m.value).toBe('a\u{1F600}b');
        expect(m.map).toEqual([101, 103, 103, 111]);
        expect(m.ends).toEqual([102, 110, 110, 112]);
    });
});

describe('a JjEL token through the map, an escape at its boundary (R3)', () => {
    it('c-like: the JjEL string `"go"` is written `\\"go\\"`, the `==` before it ends at the escape (dies on the end taken from the next start)', () => {
        const { text, islands } = parsedIn(CLIKE_STYLE);
        expect(writtenTokens(text, islands[0])).toEqual(['self', '.', 'label', '==', '\\"go\\"', 'and', 'self', '.', 'path', '==', '\\"a\\\\\\\\b\\"']);
        expect(writtenTokens(text, islands[2])).toEqual(['n', '==', '\\"q\\"']);
    });

    it("pascal: `1` ends before the join, `label` starts after it, `'it'` is written `''it''` (dies on a join quote inside a token)", () => {
        const { text, islands } = parsedIn(PASCAL_STYLE);
        const w = writtenTokens(text, islands[1]);
        expect(w).toContain('1');
        expect(w).toContain('label');
        expect(w).toContain("''it''");
        expect(w.some(s => s.includes("'#") || s.includes("#10'"))).toBe(false);
        expect(writtenTokens(text, islands[2])).toEqual(['n', '==', '"q"']);
    });
});

// ---- Checking (lane F1c, P-2026-11-07-1522; R-TXT-55 F3, report §4.3, R2) -------------------------------------------

/** One transition with the given guard and effect, printed and parsed in the style, its islands checked. */
const checkedIn = (style: NotationStyle, guard: string | null, effect: string | null = null) => {
    const g = deriveConcreteGrammar(deriveBaseGrammar(NET_MM), style);
    const text = printTextModel(g, [
        { id: 'n', cls: 'Net', slots: { name: 'N', transitions: ['t'] } },
        // A malformed EString is not JjEL: never checked.
        { id: 't', cls: 'Transition', slots: { name: 'fire', guard, effect, note: 'self.x >' } },
    ]).text;
    const parsed = parseText(text, g);
    expect(parsed.errors).toEqual([]);
    return { text, found: checkIslands(jjelIslands(parsed, NET_MM, style)) };
};

/** Each diagnostic as the text it covers, the text right after its start, and its message. */
const placed = (text: string, found: ReturnType<typeof checkIslands>, ahead = 3) =>
    found.map(d => [text.slice(d.start, d.end), text.slice(d.start, d.start + ahead), d.message]);

/** An island built from a raw string token at 0, the way jjelIslands builds it. */
const islandOf = (raw: string, mode: JjelIsland['mode'], style: NotationStyle = CLIKE_STYLE): JjelIsland => {
    const { value, map, ends } = valueMap(raw, 0, style.string);
    return { owner: 'o', feature: 'f', mode, start: 0, end: raw.length, value, map, ends };
};

// A JjEL `"` under C-like and a JjEL `'` under Pascal before the error: both shift the text against the value.
const BAD_GUARD = `self.a == "go" and self.b == 'it' > > 1`;

describe('checkIslands: a JjEL error of an island, placed on the offending token', () => {
    for (const style of [CLIKE_STYLE, PASCAL_STYLE, INDENT_STYLE]) {
        it(`${style.id}: a valid expression and action give nothing, an EString is not checked (dies on the entry points swapped)`, () => {
            expect(checkedIn(style, 'self.count > 0 and self.label == "go"', 'self.[count] := self.count + 1').found).toEqual([]);
        });

        it(`${style.id}: an error after an escape lands on the second \`>\` (dies on the map skipped, on the column read from 0)`, () => {
            const { text, found } = checkedIn(style, `${BAD_GUARD} + 22`);
            expect(placed(text, found, 4)).toEqual([['>', '> 1 ', 'Expected expression']]);
        });

        it(`${style.id}: an error on the second line of a value, after \`\\n\` or \`#10\` (dies on the line not converted)`, () => {
            const { text, found } = checkedIn(style, 'self.a ==\n  > 2');
            expect(placed(text, found)).toEqual([['>', '> 2', 'Expected expression']]);
        });

        it(`${style.id}: an action error lands on its token, \`:=\` whole (dies on the action parsed as an expression, on the end one past the offset)`, () => {
            const { text, found } = checkedIn(style, null, 'count := count + 1');
            expect(placed(text, found)).toEqual([[':=', ':= ', "The target of an action must end in '.[attribute]'"]]);
        });
    }

    it('an error at the end of the value marks its last token (dies on the empty EOF token kept)', () => {
        const { text, found } = checkedIn(CLIKE_STYLE, 'self.count >');
        expect(placed(text, found, 2)).toEqual([['>', '>"', 'Expected expression']]);
        const action = checkedIn(PASCAL_STYLE, null, 'self.[count] := ');
        expect(placed(action.text, action.found, 2)).toEqual([[':=', ':=', 'Expected expression']]);
    });

    it('a lexer error is one diagnostic per island, on the character the lexer refused (R2; dies on the column read from 0, on the last error read for the first)', () => {
        const { text, found } = checkedIn(CLIKE_STYLE, 'self.x # # 1');
        expect(placed(text, found)).toEqual([['#', '# #', 'Unexpected character: #']]);
    });

    it('an unterminated JjEL string covers the string as written, its escaped quote included (dies on the map skipped)', () => {
        const c = checkedIn(CLIKE_STYLE, 'self.a == "abc');
        expect(placed(c.text, c.found)).toEqual([['\\"abc', '\\"a', 'Unterminated string']]);
        const p = checkedIn(PASCAL_STYLE, "self.a == 'abc");
        expect(placed(p.text, p.found)).toEqual([["''abc", "''a", 'Unterminated string']]);
    });

    it('one diagnostic per malformed island, in island order', () => {
        const { text, found } = checkedIn(CLIKE_STYLE, 'self.count >', 'self.[a] := #');
        expect(placed(text, found, 1)).toEqual([['>', '>', 'Expected expression'], ['#', '#', 'Unexpected character: #']]);
    });

    it("conformance's exemptions: blank is absent, `else` a well-formed Expression only (dies on either exemption dropped, on `else` exempt as an action)", () => {
        for (const mode of ['expression', 'action'] as const) {
            expect(checkIslands([islandOf('""', mode), islandOf('"   "', mode), islandOf('"\\n"', mode)])).toEqual([]);
        }
        expect(checkIslands([islandOf('"else"', 'expression')])).toEqual([]);
        // ` else` is not the literal: conformance compares the value as it is.
        expect(checkIslands([islandOf('" else"', 'expression')]).length).toBe(1);
        const action = checkIslands([islandOf('"else"', 'action')]);
        expect(action.map(d => [d.start, d.end])).toEqual([[1, 5]]);
    });
});

// ---- Names (lane F1e, P-2026-11-07-1736; R-TXT-55 F5, report §4.3, R4) ----------------------------------------------

const NAMES_MM: TextMetamodel = {
    classes: [
        { name: 'Net', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'transitions', type: 'Transition', containment: true, many: true }] },
        { name: 'Arc', attributes: [{ name: 'weight', type: 'EInt' }], references: [{ name: 'target', type: 'Net' }] },
        {
            name: 'Transition', supers: ['Arc'],
            attributes: [
                { name: 'name', type: 'EString' },
                { name: 'label', type: 'EString' },
                { name: 'guard', type: 'Expression', jjel: 'expression' },
                { name: 'effect', type: 'Action', jjel: 'action' },
            ],
        },
    ],
    enumerations: [],
};

/** One transition with the given guard and effect in NAMES_MM, printed and parsed in the style, its islands checked. */
const namedIn = (style: NotationStyle, guard: string | null, effect: string | null = null) => {
    const g = deriveConcreteGrammar(deriveBaseGrammar(NAMES_MM), style);
    const text = printTextModel(g, [
        { id: 'n', cls: 'Net', slots: { name: 'N', transitions: ['t'] } },
        { id: 't', cls: 'Transition', slots: { name: 'fire', guard, effect } },
    ]).text;
    const parsed = parseText(text, g);
    expect(parsed.errors).toEqual([]);
    return { text, found: checkIslands(jjelIslands(parsed, NAMES_MM, style)) };
};

describe('checkIslands: `self.<f>` names a feature of the owner\'s class', () => {
    for (const style of [CLIKE_STYLE, PASCAL_STYLE]) {
        it(`${style.id}: a known feature gives nothing, own, inherited, or a reference (dies on the lookup dropped, on own features only)`, () => {
            expect(namedIn(style, 'self.label == "go" and self.weight > 0 and self.target != null', 'self.[n] := self.weight + 1').found).toEqual([]);
        });

        it(`${style.id}: an unknown feature is placed on its token, after an escape, the class named (dies on the map skipped, on the receiver's range)`, () => {
            const { text, found } = namedIn(style, `self.label == "go" and self.label == 'it' and self.gard > 0`);
            expect(placed(text, found, 5)).toEqual([['gard', 'gard ', 'gard is not a feature of Transition']]);
        });

        it(`${style.id}: \`?.\` is checked, an action too, every unknown in order (dies on the null-safe receiver left out, on the first only)`, () => {
            const { text, found } = namedIn(style, 'self?.labl == "x"', 'self.[n] := self.wieght + self.target.[n]');
            expect(placed(text, found, 4)).toEqual([
                ['labl', 'labl', 'labl is not a feature of Transition'],
                ['wieght', 'wieg', 'wieght is not a feature of Transition'],
            ]);
        });
    }

    it('another receiver, a deeper member, a method call and state access give nothing (dies on the receiver test dropped, on `self` taken after a dot)', () => {
        expect(namedIn(CLIKE_STYLE, 'n.gard > 0 and self.target.gard > 0 and self.gard() and self.[gard] > 0 and x.self.gard').found).toEqual([]);
    });

    it('a malformed island gives only the syntax diagnostic (dies on names checked after a parse error)', () => {
        const { text, found } = namedIn(CLIKE_STYLE, 'self.gard >');
        expect(placed(text, found, 2)).toEqual([['>', '>"', 'Expected expression']]);
    });

    it('an island with no class gives no name diagnostic (dies on a missing class read as no features)', () => {
        expect(checkIslands([islandOf('"self.gard > 0"', 'expression')])).toEqual([]);
    });
});

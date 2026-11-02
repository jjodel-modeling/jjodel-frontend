/**
 * The JjScript lines of «New model from text» (slice T2c, P-2026-11-02-0045). On T1's corpus: print a model, parse
 * it, build the lines, run them through the JjScript planner on an empty model of the metamodel (the world PreviewBar
 * plans against, here derived from T1's input), and read the planned effects back as a model: it is the original up
 * to ids. The planner parses every line with the real JjScript parser and applies the executor's rules (handles,
 * containers, multiplicities, operators), so a line it refuses is a line the app would refuse.
 *
 * A many-valued attribute with two values or more is not writable by JjScript today: the round trip runs on the
 * corpus with such attributes cut to their first value, and the problem is pinned on the originals.
 */

import { describe, it, expect } from 'vitest';
import { planEffects } from '../../../jjscript/executor/effectsPlanner';
import type { EffectsPlan, PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import type { ConcreteGrammar } from '../concreteGrammar';
import { classAncestors, classFeatures } from '../metamodel';
import type { TextMetamodel, TextObject } from '../metamodel';
import { jjscriptNumber, jjscriptString, modelLines, readNewModel } from '../modelLines';
import { isApplicableParse, parseText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, LOWER, NON_DIAMOND } from './corpus';
import { FIXTURE, metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';

// Names JjScript cannot take as a handle: a command word, a literal word in another case, a class name, a name that
// is not an identifier; and a value of every kind a line writes.
const AWKWARD: Spec = {
    classes: [
        { name: 'Thing', attributes: [{ name: 'name', type: 'EString' }, { name: 'n', type: 'EDouble' }, { name: 'on', type: 'EBoolean' }, { name: 'text', type: 'EString' }], references: [{ name: 'from', type: 'Thing' }, { name: 'to', type: 'Thing', many: true }] },
    ],
    enums: {},
    objects: [
        { id: 'k1', cls: 'Thing', slots: { name: 'create', n: -2.5, on: true, text: 'tab\there\\ "q" \r', from: 'k2', to: ['k3', 'k4', 'k3'] } },
        { id: 'k2', cls: 'Thing', slots: { name: 'True', n: 0.0000015, on: false, text: '' } },
        { id: 'k3', cls: 'Thing', slots: { name: 'Thing', n: 1e21 } },
        { id: 'k4', cls: 'Thing', slots: { name: 'two words', to: ['k1'] } },
        { id: 'k5', cls: 'Thing', slots: { name: 'Thing_1' } },
    ],
};


/** The spec with every many-valued attribute cut to its first value: what JjScript can write today. */
function oneValued(spec: Spec): Spec {
    const mm = metamodelOf(spec);
    return {
        ...spec,
        objects: spec.objects.map(o => {
            const c = mm.classes.find(k => k.name === o.cls)!;
            const many = new Set(classFeatures(mm, c).filter(f => f.kind === 'attribute' && f.many).map(f => f.name));
            return { ...o, slots: Object.fromEntries(Object.entries(o.slots).map(([k, v]) => [k, many.has(k) && Array.isArray(v) ? v.slice(0, 1) : v])) };
        }),
    };
}

/** An empty model of the metamodel, as `buildPlanWorld` reads one: classes with inherited features, no element. */
function emptyWorld(mm: TextMetamodel): PlanWorld {
    const classes: PlanWorld['classes'] = {};
    for (const c of mm.classes) {
        const features = classFeatures(mm, c);
        classes[c.name] = {
            name: c.name, abstract: !!c.isAbstract, kinds: [c.name, ...classAncestors(mm, c).map(a => a.name)],
            attributes: features.filter(f => f.kind === 'attribute').map(f => {
                const e = mm.enumerations.find(x => x.name === f.type);
                return { name: f.name, upper: f.many ? -1 : 1, ...(e ? { enumeration: { name: e.name, literals: [...e.literals] } } : {}) };
            }),
            references: features.filter(f => f.kind !== 'attribute').map(f => ({ name: f.name, containment: f.kind === 'containment', upper: f.many ? -1 : 1, type: f.type })),
        };
    }
    return { classes, elements: [], level: 'M1' };
}

/**
 * The model the plan builds, in creation order, with the planner's ids: an object is named by its `create` (the
 * handle) unless a `set … name` follows; a contained object enters its container's slot at its `create`.
 */
function plannedModel(mm: TextMetamodel, plan: EffectsPlan): TextObject[] {
    const byHandle = new Map(plan.created.map(c => [c.name, c.id]));
    const out = new Map<string, { id: string; cls: string; slots: Record<string, unknown> }>();
    const featureOf = (id: string, name: string) => {
        const c = mm.classes.find(k => k.name === out.get(id)!.cls)!;
        return classFeatures(mm, c).find(f => f.name === name)!;
    };
    const put = (id: string, name: string, value: unknown) => {
        const slots = out.get(id)!.slots;
        if (featureOf(id, name).many) slots[name] = [...((slots[name] as unknown[] | undefined) ?? []), value];
        else slots[name] = value;
    };
    for (const c of plan.created) {
        out.set(c.id, { id: c.id, cls: c.metaclass, slots: {} });
        const k = mm.classes.find(x => x.name === c.metaclass)!;
        if (classFeatures(mm, k).some(f => f.kind === 'attribute' && f.name === 'name')) out.get(c.id)!.slots.name = c.name;
        if (c.container) {
            const [owner, feature] = c.container.split('.');
            put(byHandle.get(owner)!, feature, c.id);
        }
    }
    for (const f of plan.features) {
        if (f.values) out.get(f.ownerId)!.slots[f.feature] = [...f.values];
        else put(f.ownerId, f.feature, f.value);
    }
    for (const r of plan.references) {
        expect(r.operator === '=' || r.operator === '+=').toBe(true);
        put(r.sourceId, r.feature, r.targetId);
    }
    return [...out.values()];
}

/** The planned objects with the original ids, matched by text order (creation order is text order). */
function withOriginalIds(g: ConcreteGrammar, mm: TextMetamodel, original: readonly TextObject[], planned: readonly TextObject[]): TextObject[] {
    const order = printTextModel(g, original).spans.map(s => s.id);
    const to = new Map(planned.map((o, i) => [o.id, order[i]]));
    return planned.map(o => ({
        id: to.get(o.id)!, cls: o.cls,
        slots: Object.fromEntries(Object.entries(o.slots).map(([k, v]) => {
            const f = classFeatures(mm, mm.classes.find(c => c.name === o.cls)!).find(x => x.name === k)!;
            const id = (x: unknown) => (typeof x === 'string' && to.has(x) ? to.get(x) : x);
            return [k, f.kind === 'attribute' ? v : Array.isArray(v) ? v.map(id) : id(v)];
        })),
    }));
}

describe('lines of a parsed text, run by the JjScript planner on an empty model, give the model back up to ids', () => {
    const corpus: [string, Spec, NotationStyle][] = [
        ['the 1709 fixture', FIXTURE, CLIKE_STYLE],
        ['the 1709 fixture, many-valued attributes cut to one value', oneValued(FIXTURE), CLIKE_STYLE],
        ['a diamond', DIAMOND, CLIKE_STYLE],
        ['a multiple inheritance without a diamond', NON_DIAMOND, CLIKE_STYLE],
        ['names, homonyms, paths, several roots; a two-valued enumeration and a two-valued number', GARAGE, CLIKE_STYLE],
        ['a single nameless root and a nameless named object', BOX, CLIKE_STYLE],
        ['class keywords and literals in lower case', GARAGE, LOWER],
        ['two class keywords after the fallback', CASES, LOWER],
        ['awkward names and every kind of value', AWKWARD, CLIKE_STYLE],
    ];
    it.each(corpus)('%s', async (_, spec, style) => {
        const g = grammarOf(spec, style);
        const mm = metamodelOf(spec);
        const original = objectsOf(spec);
        const parsed = parseText(printTextModel(g, original).text, g);
        expect(isApplicableParse(parsed)).toBe(true);
        const built = modelLines(mm, parsed.objects);
        expect(built.problems).toEqual([]);
        const plan = await planEffects(built.lines.join('\n'), emptyWorld(mm));
        expect(plan.errors).toEqual([]);
        expect(plan.warnings).toEqual([]);
        expect(plan.created).toHaveLength(original.length);
        // A nameless object of a class with a name takes its handle as name, as any instance created without one.
        const handleOf = new Map(parsed.objects.map((o, i) => [printTextModel(g, original).spans[i].id, built.handles.get(o.id)!]));
        const expected = original.map(o => {
            const named = classFeatures(mm, mm.classes.find(c => c.name === o.cls)!).some(f => f.kind === 'attribute' && f.name === 'name');
            return named && typeof o.slots.name !== 'string' ? { ...o, slots: { ...o.slots, name: handleOf.get(o.id) } } : o;
        });
        const byId = new Map(expected.map(o => [o.id, o]));
        for (const o of withOriginalIds(g, mm, original, plannedModel(mm, plan))) expect(o).toEqual(byId.get(o.id));
    });
});

describe('handles, order and values', () => {
    it('an object named by a unique identifier is created under its name; parents before children, then attributes, then references', () => {
        const spec: Spec = {
            classes: [{ name: 'Sys', attributes: [{ name: 'name', type: 'EString' }, { name: 'w', type: 'EInt' }], references: [{ name: 'parts', type: 'Sys', containment: true, many: true }, { name: 'main', type: 'Sys' }] }],
            enums: {},
            objects: [{ id: 's', cls: 'Sys', slots: { name: 'top', w: 1, parts: ['p'], main: 'p' } }, { id: 'p', cls: 'Sys', slots: { name: 'leaf', w: 2 } }],
        };
        expect(modelLines(metamodelOf(spec), objectsOf(spec)).lines).toEqual([
            'create instance of Sys "top"',
            'create instance of Sys "leaf" in top.parts',
            'set top.w = 1',
            'set leaf.w = 2',
            'set top.main = leaf',
        ]);
    });

    it('homonyms, names that are not identifiers, reserved or literal words and class names get generated handles, then their name', () => {
        const built = modelLines(metamodelOf(AWKWARD), objectsOf(AWKWARD));
        // Thing_1 is a name in the text: the generated handles skip it.
        expect([...built.handles.values()]).toEqual(['Thing_2', 'Thing_3', 'Thing_4', 'Thing_5', 'Thing_1']);
        expect(built.lines.filter(l => l.includes('.name ='))).toEqual([
            'set Thing_2.name = "create"', 'set Thing_3.name = "True"', 'set Thing_4.name = "Thing"', 'set Thing_5.name = "two words"',
        ]);
        const dup = modelLines(metamodelOf(FIXTURE), objectsOf(FIXTURE)).handles;
        expect([dup.get('p1'), dup.get('p2'), dup.get('p4'), dup.get('p5')]).toEqual(['Part_1', 'Part_2', 'FAST', 'Part_3']);
    });

    it('a many-valued reference is written with += per value, in order, duplicates kept; a single one with =', () => {
        const lines = modelLines(metamodelOf(AWKWARD), objectsOf(AWKWARD)).lines;
        expect(lines.filter(l => /\.(to|from) /.test(l))).toEqual([
            'set Thing_2.from = Thing_3', 'set Thing_2.to += Thing_4', 'set Thing_2.to += Thing_5', 'set Thing_2.to += Thing_4', 'set Thing_5.to += Thing_2',
        ]);
    });

    it('an enumeration value is written as the bare literal, in the declared case, even where a handle has its name', () => {
        const lines = modelLines(metamodelOf(FIXTURE), objectsOf(FIXTURE)).lines;
        expect(lines).toContain('set s1.mode = Fast');
        expect(lines).toContain('set Part_1.kind = FAST');
        expect(lines).toContain('set FAST.kind = Fast');
    });

    it('a many-valued attribute is written as one list, enumeration literals bare; an empty one is not written', () => {
        expect(modelLines(metamodelOf(FIXTURE), objectsOf(FIXTURE)).lines.filter(l => /\.(tags|empty) /.test(l))).toEqual(['set s1.tags = ["a", "b-c"]']);
        const garage = modelLines(metamodelOf(GARAGE), objectsOf(GARAGE)).lines;
        expect(garage).toContain('set alpha.colors = [Red, blue]');
        expect(garage).toContain('set alpha.marks = [3, 1]');
        expect(modelLines(metamodelOf(oneValued(GARAGE)), objectsOf(oneValued(GARAGE))).lines).toContain('set alpha.colors = [Red]');
    });

    it('a literal JjScript would not read back as a name is written as a string', () => {
        const spec: Spec = {
            classes: [{ name: 'Lamp', attributes: [{ name: 'state', type: 'Sw' }, { name: 'log', type: 'Sw', many: true }] }],
            enums: { Sw: ['true', 'create', 'on'] },
            objects: [{ id: 'l', cls: 'Lamp', slots: { state: 'true', log: ['create', 'on'] } }],
        };
        expect(modelLines(metamodelOf(spec), objectsOf(spec)).lines.slice(1)).toEqual(['set Lamp_1.state = "true"', 'set Lamp_1.log = ["create", on]']);
    });

    it('strings are escaped for the JjScript lexer; numbers never use an exponent', () => {
        expect(jjscriptString('a\\b"c\nd\re\tf')).toBe('"a\\\\b\\"c\\nd\\re\\tf"');
        expect([1e21, 1.25e21, 1.5e-7, -2.5e-7, 0, -3, 0.5].map(jjscriptNumber)).toEqual([
            '1000000000000000000000', '1250000000000000000000', '0.00000015', '-0.00000025', '0', '-3', '0.5',
        ]);
    });
});

describe('what JjScript cannot write yet blocks the creation', () => {
    it('a many-valued attribute with two values or more is no longer a problem (R-TXT-25 (2))', () => {
        expect(modelLines(metamodelOf(FIXTURE), objectsOf(FIXTURE)).problems).toEqual([]);
        expect(modelLines(metamodelOf(GARAGE), objectsOf(GARAGE)).problems).toEqual([]);
    });

    it('a class whose name JjScript reads as a word of its own is a problem', () => {
        const spec: Spec = { classes: [{ name: 'model' }], enums: {}, objects: [{ id: 'm', cls: 'model', slots: {} }] };
        expect(modelLines(metamodelOf(spec), objectsOf(spec)).problems.map(p => p.id)).toEqual(['m']);
    });
});

describe('the reading of the «new» mode: markers, and lines only when nothing blocks', () => {
    it('a text with errors has a marker per error and no lines, even where objects were recovered (R-TXT-21 (8))', () => {
        const g = grammarOf(FIXTURE);
        const text = 'Part a { size four }\nPart b {}';
        const r = readNewModel(text, g, metamodelOf(FIXTURE));
        expect(r.lines).toBeNull();
        expect(r.markers.length).toBeGreaterThan(0);
        expect(text.slice(r.markers[0].start, r.markers[0].end)).toBe('four');
    });

    it('a many-valued attribute with two values is no marker, and the lines are given', () => {
        const g = grammarOf(FIXTURE);
        const text = printTextModel(g, objectsOf(FIXTURE)).text;
        const r = readNewModel(text, g, metamodelOf(FIXTURE));
        expect(r.markers).toEqual([]);
        expect(r.lines).toContain('set s1.tags = ["a", "b-c"]');
    });

    it('a clean text gives its lines and no marker; an empty text is an empty model', () => {
        const spec = oneValued(GARAGE);
        const g = grammarOf(spec);
        const r = readNewModel(printTextModel(g, objectsOf(spec)).text, g, metamodelOf(spec));
        expect(r.markers).toEqual([]);
        expect(r.objects).toBe(spec.objects.length);
        expect(r.lines).toEqual(modelLines(metamodelOf(spec), parseText(r.text, g).objects).lines);
        expect(readNewModel('  // nothing yet\n', g, metamodelOf(spec))).toMatchObject({ markers: [], lines: [], objects: 0 });
    });
});

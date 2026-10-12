/**
 * generate — end to end (slice S2, P-2026-10-10-0945; spec §4, §5, §7, R-GEN-5, R-GEN-7).
 *
 * A template set generates a JavaScript module from `stc.nodes` and `stc.transitions` of the turnstile state
 * machine, and the line that names a transition maps back to that transition's id and feature.
 *
 * The lookup is the turnstile of codegen/__tests__/stcAccess.test.ts (itself `TURNSTILE` of
 * sim/__tests__/simBridge.test.ts), copied because a test file exports nothing, plus one `name` attribute on the
 * transitions so that their names are a feature, as an identity slot is. `generate` takes the record
 * `buildEvalContext` returns from its caller (ratified, RC-21): `buildEvalContext` does not import under the node
 * bench (the joiner writes on `window`, measured in this lane), so `record` below builds a synthetic one, plain
 * handles with `id` and their features by name, references resolved to the same handles, names bound at the top,
 * as in guardContext.test.ts. The gap is declared: the real record reaches `generate` only in slice S5, whose
 * browser probe owes the call with the real `buildEvalContext` output.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import type { TemplateRecord } from '../templates';

type Lookup = Record<string, any>;
interface Obj { cls: string; slots?: Record<string, unknown[]> }

/** As stcAccess.test.ts: the metamodel MM with the role bag, the model M of it, the objects (father M), the slots as DValues. */
function buildLookup(bag: Record<string, unknown> | undefined, objects: Record<string, Obj>): Lookup {
    const lookup: Lookup = {
        MM: { className: 'DModel', id: 'MM', name: 'mm', ...(bag ? { _state: { ...bag } } : {}) },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
    };
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: id, features };
    }
    return lookup;
}

function classes(lookup: Lookup, table: Record<string, string[]>): void {
    for (const [id, ext] of Object.entries(table)) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: ext };
}

const SM_BAG = {
    simProfile: 'stateMachine', simNode: 'C_State', simTransition: 'C_Trans', simInitial: 'C_Init',
    simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger', simEventIdentifier: 'A_label',
    simGuard: 'A_guard', simAction: 'A_act',
};

/** Locked (Initial) -coin-> Unlocked -push-> Locked, Locked -push-> Locked; the transitions carry `name`. */
function smLookup(bag: Record<string, unknown> = SM_BAG): Lookup {
    const lookup = buildLookup(bag, {
        Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } },
        Unlocked: { cls: 'C_State', slots: { R_out: ['tPushU'] } },
        coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
        push: { cls: 'C_Event', slots: { A_label: ['Push'] } },
        tCoin: { cls: 'C_Trans', slots: { A_name: ['tCoin'], R_next: ['Unlocked'], R_trigger: ['coin'], A_guard: ['self.trigger == event'], A_act: ['x := 1'] } },
        tPushU: { cls: 'C_Trans', slots: { A_name: ['tPushU'], R_next: ['Locked'], R_trigger: ['push'], A_guard: ['   '] } },
        tPushL: { cls: 'C_Trans', slots: { A_name: ['tPushL'], R_oldTrigger: ['coin'], R_next: ['Locked'], R_trigger: ['push'], A_guard: ['false'] } },
    });
    classes(lookup, { C_State: [], C_Init: ['C_State'], C_Trans: [], C_Event: [] });
    lookup.R_out = { className: 'DReference', id: 'R_out', name: 'out', composition: true };
    lookup.R_next = { className: 'DReference', id: 'R_next', name: 'next' };
    lookup.R_trigger = { className: 'DReference', id: 'R_trigger', name: 'trigger', type: 'C_Event' };
    lookup.R_oldTrigger = { className: 'DReference', id: 'R_oldTrigger', name: 'trigger', type: 'C_Event' };
    for (const id of ['A_label', 'A_guard', 'A_act', 'A_name']) lookup[id] = { className: 'DAttribute', id, name: id.slice(2) };
    return lookup;
}

/** A record shaped like `buildEvalContext`'s: one handle per object, `out` many, the rest single, names bound at the top. */
function record(lookup: Lookup): Record<string, any> {
    const ids = Object.keys(lookup).filter(id => lookup[id].className === 'DObject');
    const handles = new Map<string, any>(ids.map(id => [id, { id, __type: 'Object', name: lookup[id].name }]));
    for (const id of ids) {
        const h = handles.get(id);
        for (const vid of lookup[id].features) {
            const v = lookup[vid];
            const f = lookup[v.instanceof];
            const values = v.values.map((x: unknown) => (f.className === 'DReference' ? handles.get(x as string) ?? null : x));
            h[f.name] = f.id === 'R_out' ? values : values[0] ?? null;
        }
    }
    const out: Record<string, any> = { instances: [...handles.values()] };
    for (const [id, h] of handles) out[lookup[id].name] = h;
    return out;
}

const TEMPLATES: TemplateRecord[] = [
    {
        name: 'module', params: ['title'],
        body: '"// generated from ${title}\nexport const states = [${stc.nodes.map(s => "\'${s.name}\'").join(", ")}];\nexport const transitions = {\n  ${stc.transitions.map(t => transition(t)).join(",\n")}\n};\n"',
    },
    {
        name: 'transition', params: ['t'],
        body: '"${t.name}: { from: \'${stc.source(t).first.name}\', to: \'${stc.target(t).first.name}\', on: \'${stc.trigger(t).first.label}\' }"',
    },
];

const EXPECTED = [
    '// generated from m',
    "export const states = ['Locked', 'Unlocked'];",
    'export const transitions = {',
    "  tCoin: { from: 'Locked', to: 'Unlocked', on: 'Coin' },",
    "  tPushU: { from: 'Unlocked', to: 'Locked', on: 'Push' },",
    "  tPushL: { from: 'Locked', to: 'Locked', on: 'Push' }",
    '};',
    '',
].join('\n');

function run() {
    const lookup = smLookup();
    return generate(record(lookup), lookup, 'M', TEMPLATES, 'module', ['m']);
}

describe('generate, end to end on the turnstile', () => {
    it('produces the exact expected module, with no error', () => {
        const out = run();
        expect(out.errors).toEqual([]);
        expect(out.hasErrors).toBe(false);
        expect(out.code).toBe(EXPECTED);
    });

    it('the line that names a transition maps back to that transition\'s id and its name feature', () => {
        const { code, map } = run();
        const line = code.split('\n').findIndex(l => l.startsWith('  tPushU:')) + 1;
        expect(line).toBe(5);
        const named = map.filter(e => e.line === line && e.origin.kind === 'model' && e.origin.featureName === 'name');
        expect(named.map(e => [code.split('\n')[line - 1].slice(e.start, e.end), e.origin])).toEqual([
            ['tPushU', { kind: 'model', elementId: 'tPushU', feature: 'A_name', featureName: 'name', transformation: { name: 'identity' } }],
            ['Unlocked', { kind: 'model', elementId: 'Unlocked', feature: null, featureName: 'name', transformation: { name: 'identity' } }],
            ['Locked', { kind: 'model', elementId: 'Locked', feature: null, featureName: 'name', transformation: { name: 'identity' } }],
        ]);
        const push = map.find(e => e.line === line && e.origin.kind === 'model' && e.origin.featureName === 'label')!;
        expect(push.origin).toMatchObject({ elementId: 'push', feature: 'A_label' });
    });

    it('every span whose origin is the transition tPushU is on its line, and the indentation prefix is mapped to nothing', () => {
        const { map } = run();
        expect(map.filter(e => e.origin.kind === 'model' && e.origin.elementId === 'tPushU').map(e => [e.line, e.start, e.end])).toEqual([[5, 2, 8]]);
        expect(map.some(e => e.line === 5 && e.start < 2)).toBe(false);
    });

    it('stc is null on a model whose metamodel has no STC: reading it is an error fragment, the rest generates', () => {
        const lookup = smLookup();
        delete lookup.MM._state;
        const out = generate(record(lookup), lookup, 'M', TEMPLATES, 'module', ['m']);
        expect(out.hasErrors).toBe(true);
        expect(out.errors.map(e => e.message)).toEqual(["Cannot access property 'nodes' of null", "Cannot access property 'transitions' of null"]);
        expect(out.code).toBe('// generated from m\nexport const states = [];\nexport const transitions = {\n  \n};\n');
    });
});

/**
 * The lecture examples name elements, not ids (slice S7a, P-2026-10-11-1052; R-GEN-17).
 *
 * The fixtures use readable ids that equal the names (`locked`, `tc`), so a scan of their output cannot tell an id
 * from a name. Here each example is first moved to ids like the app's (`Pointer1791659970959_USER_<n>`): the model and
 * every object of it renamed, the references and the scenario followed. Its templates then generate the program with
 * `generate`, and the text is scanned for every id of the model: each object's id and the model's appear exactly once,
 * inside the `const $ID = Object.freeze({ … });` block, and no id of the model appears anywhere else. The oracle runs
 * on the recorded scenario through the runner's in-process path of S4's tests, in node, as S6's tests run it
 * (oracle/__tests__/exampleFixture.ts), and the README's mutation still breaks it at its step. Each test name says
 * which break kills it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../../engine/generate';
import { readModelTemplates } from '../../engine/templateCodec';
import { runOracle } from '../../oracle/oracle';
import { EXAMPLES, inProcess, loadExample, recordOf, swapTarget } from '../../oracle/__tests__/exampleFixture';
import type { Example } from '../../oracle/__tests__/exampleFixture';

type Lookup = Record<string, any>;

const ID_BLOCK = 'const $ID = Object.freeze({';

function underModel(lookup: Lookup, id: string, modelId: string): boolean {
    let d = lookup[id];
    for (let i = 0; d && i < 40; i++) {
        if (d.id === modelId) return true;
        d = lookup[d.father];
    }
    return false;
}

/**
 * The example under app-like ids: the model and every DObject under it renamed in lookup order, the `father` of every
 * entry, the values of every reference slot, the scenario's events and selectors and the mutation followed.
 */
function withAppIds(source: Example): { ex: Example; objects: string[]; all: string[] } {
    const lookup = source.lookup;
    const renamed = Object.keys(lookup).filter(id => id === source.modelId || (lookup[id].className === 'DObject' && underModel(lookup, id, source.modelId)));
    const to = new Map(renamed.map((id, i) => [id, `Pointer1791659970959_USER_${100 + i}`]));
    const map = <T>(x: T): T => (typeof x === 'string' && to.has(x) ? to.get(x) as T : x);
    const out: Lookup = {};
    for (const [id, d] of Object.entries(lookup)) {
        const copy: Record<string, any> = { ...d, id: map(d.id) };
        if (d.father !== undefined) copy.father = map(d.father);
        if (d.className === 'DValue' && lookup[d.instanceof]?.className === 'DReference') copy.values = (d.values ?? []).map(map);
        out[map(id)] = copy;
    }
    const m = source.mutation;
    const ex: Example = {
        ...source,
        lookup: out,
        modelId: map(source.modelId),
        scenario: { ...source.scenario, steps: source.scenario.steps.map(s => ({ ...s, event: map(s.event), selector: map(s.selector) })) },
        mutation: { ...m, transition: map(m.transition), from: map(m.from), to: map(m.to) },
    };
    const all = Object.keys(out).filter(id => underModel(out, id, ex.modelId));
    return { ex, objects: renamed.map(id => to.get(id)!), all };
}

function generated(ex: Example) {
    return generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, readModelTemplates(ex.lookup, ex.modelId).templates, 'main');
}

/** The `$ID` block of a program: from its declaration to the `});` that closes it. Exactly one. */
function idBlock(code: string): { start: number; end: number } {
    const start = code.indexOf(ID_BLOCK);
    expect(start, 'the program declares $ID').toBeGreaterThanOrEqual(0);
    expect(code.indexOf(ID_BLOCK, start + 1), 'the program declares $ID once').toBe(-1);
    const end = code.indexOf('});', start) + 3;
    return { start, end };
}

function count(text: string, x: string): number {
    return text.split(x).length - 1;
}

describe.each(EXAMPLES)('the example %s, under ids like the app\'s', name => {
    it('writes every id of the model once, in the $ID block, and nowhere else (mutant: a template interpolates one raw id)', () => {
        const { ex, objects, all } = withAppIds(loadExample(name));
        const out = generated(ex);
        expect(out.errors).toEqual([]);
        const { start, end } = idBlock(out.code);
        const block = out.code.slice(start, end);
        const outside = out.code.slice(0, start) + out.code.slice(end);
        expect(objects.length).toBeGreaterThan(5);
        for (const id of objects) expect(count(block, `'${id}'`), `${id} in the $ID block`).toBe(1);
        for (const id of all) expect(count(outside, id), `${id} outside the $ID block`).toBe(0);
        expect(count(out.code, '$ID.'), 'the program names elements through $ID').toBeGreaterThan(10);
    });

    it('passes the oracle on its recorded scenario (mutant: a reference printed that names another element)', async () => {
        const { ex } = withAppIds(loadExample(name));
        const out = generated(ex);
        const result = await runOracle({ lookup: ex.lookup, modelId: ex.modelId, globals: recordOf(ex.lookup, ex.modelId), scenario: ex.scenario, code: out.code, map: out.map, run: inProcess });
        expect(result.ok, JSON.stringify(result).slice(0, 1500)).toBe(true);
        expect(result.gen.map(s => s.kind)).toEqual(['initial', ...ex.scenario.steps.map(s => s.kind)]);
    });

    it('the README\'s mutation, written over $ID, still breaks the oracle at its step, at the transition\'s text', async () => {
        const { ex } = withAppIds(loadExample(name));
        const out = generated(ex);
        const m = ex.mutation;
        const code = swapTarget(out.code, m.transition, m.from, m.to);
        expect(code).not.toBe(out.code);
        const result = await runOracle({ lookup: ex.lookup, modelId: ex.modelId, globals: recordOf(ex.lookup, ex.modelId), scenario: ex.scenario, code, map: out.map, run: inProcess });
        expect(result).toMatchObject({ ok: false, step: m.step, kind: 'observe', transitionId: m.transition });
        const origin = (result as any).origin;
        expect(out.code.split('\n')[origin.line - 1].slice(origin.start, origin.end)).toBe(ex.lookup[m.transition].name);
    });

    it('swapTarget refuses a place the postset does not hold, so a template change cannot void the mutation', () => {
        const ex = loadExample(name);
        const out = generated(ex);
        expect(() => swapTarget(out.code, ex.mutation.transition, ex.mutation.to, ex.mutation.from)).toThrow(/no postset place/);
    });
});

describe('the producer-consumer, its tables over $ID', () => {
    it('prints the preset and the postset of a transition as place references, not JSON', () => {
        const out = generated(loadExample('petri-producer-consumer'));
        expect(out.errors).toEqual([]);
        expect(out.code).toContain('id: $ID.deliver, name: \'deliver\',\n    preset: [{ place: $ID.produced, weight: 1 }], postset: [{ place: $ID.ready, weight: 1 }, { place: $ID.buffer, weight: 1 }], inhibitors: [],');
        expect(out.code).toContain('guards: [(state, event) => $guard(() => ($lt($tokens(state, $ID.buffer), 2)))]');
        expect(out.code).toContain('return { marking: { [$ID.ready]: 1, [$ID.idle]: 1 }, attrs: {} };');
        expect(out.code).not.toMatch(/"place"/);
    });
});

describe('the turnstile, its tables over $ID', () => {
    it('prints the events, the declarations, the derived values and the transitions through $ID', () => {
        const out = generated(loadExample('turnstile'));
        expect(out.errors).toEqual([]);
        expect(out.code).toContain("const EVENTS = [{ id: $ID.coin, name: 'coin' }, { id: $ID.push, name: 'push' }, { id: $ID.stop, name: 'stop' }];");
        expect(out.code).toContain("[$ID.demoESM, 'coins', ");
        expect(out.code).toContain("{ element: $ID.demoESM, attr: 'paid', equation: (state, event) => $ge($read(state, $ID.demoESM, \"coins\"), 2) }");
        expect(out.code).toContain('id: $ID.tp, name: \'tp\',');
        expect(out.code).toContain('triggers: [$ID.push], elseOf: null,');
        expect(out.code).toContain('guards: [(state, event) => $guard(() => ($read(state, $ID.demoESM, "paid")))]');
        expect(out.code).toContain('return $apply(state, [[$ID.demoESM, "coins", $v0]]);');
    });
});

/**
 * The oracle end to end on the two lecture examples (slice S6, P-2026-10-10-2029; R-GEN-11, discovery §I.4 S6).
 *
 * For each example of codegen/examples/: its templates (the metamodel's `genTemplates`) generate the program with
 * `generate`, the program runs through the runner's in-process path of S4's tests (`runInWorker` over a worker
 * that hands the request to `executeRun`, a real ES module from a `data:` URL; not `new Function`), the scenario
 * replays in the simulator's core, and the oracle passes. Then the generated program is mutated as the README says
 * (the target of one transition swapped) and the oracle reports the divergence at the step where that transition
 * fires, with the transition and the generated text whose origin it is. The record is synthetic (exampleFixture.ts).
 * Each test name says which break kills it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../../engine/generate';
import { readModelTemplates } from '../../engine/templateCodec';
import { runOracle } from '../oracle';
import { EXAMPLES, inProcess, loadExample, recordOf, swapTarget } from './exampleFixture';

function generated(name: (typeof EXAMPLES)[number]) {
    const ex = loadExample(name);
    const templates = readModelTemplates(ex.lookup, ex.modelId);
    const out = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, templates.templates, 'main');
    return { ex, templates, out };
}

describe.each(EXAMPLES)('the example %s', name => {
    it('stores its templates in the metamodel and generates with no error', () => {
        const { templates, out } = generated(name);
        expect(templates.defects).toEqual([]);
        expect(templates.templates.map(t => t.name)).toContain('main');
        expect(out.errors).toEqual([]);
        expect(out.code).toMatch(/export function initial\(\)/);
        expect(out.code).toMatch(/export function step\(state, event, selector, inputs\)/);
        expect(out.code).toMatch(/export function observe\(state\)/);
        expect(out.code).toMatch(/export function main\(\)/);
    });

    it('has a scenario of at least six steps', () => {
        const { ex } = generated(name);
        expect(ex.scenario.steps.length).toBeGreaterThanOrEqual(6);
    });

    it('passes the oracle on its scenario (mutant: the printer\'s guards or actions out of the program)', async () => {
        const { ex, out } = generated(name);
        const result = await runOracle({ lookup: ex.lookup, modelId: ex.modelId, globals: recordOf(ex.lookup, ex.modelId), scenario: ex.scenario, code: out.code, map: out.map, run: inProcess });
        expect(result.ok, JSON.stringify(result).slice(0, 1500)).toBe(true);
        expect(result.sim.length).toBe(ex.scenario.steps.length + 1);
        expect(result.gen.map(s => s.kind)).toEqual(['initial', ...ex.scenario.steps.map(s => s.kind)]);
    });

    it('reports the swapped target at the step that fires the transition, with its generated text', async () => {
        const { ex, out } = generated(name);
        const m = ex.mutation;
        const code = swapTarget(out.code, m.transition, m.from, m.to);
        const result = await runOracle({ lookup: ex.lookup, modelId: ex.modelId, globals: recordOf(ex.lookup, ex.modelId), scenario: ex.scenario, code, map: out.map, run: inProcess });
        expect(result).toMatchObject({ ok: false, step: m.step, kind: 'observe', transitionId: m.transition });
        const origin = (result as any).origin;
        expect(origin.origin).toMatchObject({ kind: 'model', elementId: m.transition });
        expect(out.code.split('\n')[origin.line - 1].slice(origin.start, origin.end)).toBe(m.transition);
    });
});

describe('the turnstile, details', () => {
    it('the scenario holds a discard, and the program prints the guard and the actions of the transitions', () => {
        const { ex, out } = generated('turnstile');
        expect(ex.scenario.steps.some(s => s.kind === 'discard')).toBe(true);
        expect(out.code).toContain('$guard(() => ($read(state, "M", "paid")))');
        expect(out.code).toContain('$add($read(state, "M", "coins"), 1)');
        expect(out.code).toContain('equation: (state, event) => $ge($read(state, "M", "coins"), 2)');
    });

    it('a guard the printer refuses is an error fragment, and the run is refused (mutant: target.guard returns on a refusal)', () => {
        const ex = loadExample('turnstile');
        const tp = Object.values(ex.lookup).find((d: any) => d.className === 'DValue' && d.father === 'tp' && d.instanceof === 'F_Transition_guard') as any;
        tp.values = ['model.[coins].size > 0'];
        const out = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, readModelTemplates(ex.lookup, ex.modelId).templates, 'main');
        expect(out.hasErrors).toBe(true);
        expect(out.errors.some(e => e.message.includes('The guard of tp'))).toBe(true);
    });
});

describe('the producer-consumer, details', () => {
    it('the scenario resolves a choice by its selector, and the guard is printed', async () => {
        const { ex, out } = generated('petri-producer-consumer');
        const result = await runOracle({ lookup: ex.lookup, modelId: ex.modelId, globals: recordOf(ex.lookup, ex.modelId), scenario: ex.scenario, code: out.code, map: out.map, run: inProcess });
        const choices = result.sim.filter(s => (s.offered?.length ?? 0) >= 2);
        expect(choices.length).toBeGreaterThan(0);
        for (const s of choices) expect(s.offered).toContain(s.transition);
        expect(out.code).toContain('$guard(() => ($lt($tokens(state, "buffer"), 2)))');
    });
});

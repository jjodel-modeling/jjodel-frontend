/**
 * access — the `target` value of a template's context, and the run it compiles (slice S6, P-2026-10-10-2029;
 * R-GEN-6, R-GEN-16 provisional).
 *
 * Executed through `generate` (P11), the way the code panel reaches it, over the two lecture examples
 * (codegen/examples/) and a synthetic `buildEvalContext` record (oracle/__tests__/exampleFixture.ts). The run
 * `compileModelRun` rebuilds is compared with the bridge's own (simBridge.ts `startRun`) and its replay with the
 * bridge's oracles, so the copies cannot drift. Each test name says which break kills it; the bench is in the
 * commit body.
 */

import { describe, it, expect } from 'vitest';
import { step as coreStep } from '../../../../model/simulation/netStep';
import type { NetConfiguration } from '../../../../model/simulation/netTypes';
import { startRun } from '../../../../components/editor-v2/sim/simBridge';
import { generate } from '../../../engine/generate';
import type { TemplateRecord } from '../../../engine/templates';
import { observeSim } from '../../../oracle/observe';
import { simulate } from '../../../oracle/oracle';
import { EXAMPLES, loadExample, recordOf } from '../../../oracle/__tests__/exampleFixture';
import { compileModelRun } from '../access';
import { JS_RUNTIME, toJsState } from '../printer';

type Lookup = Record<string, any>;

function gen(lookup: Lookup, body: string, params: string[] = [], args: unknown[] = []) {
    const templates: TemplateRecord[] = [{ name: 'probe', params, body }];
    return generate(recordOf(lookup, 'M'), lookup, 'M', templates, 'probe', args as any);
}

function runOf(lookup: Lookup) {
    const r = compileModelRun(lookup, 'M', recordOf(lookup, 'M'));
    if (r.kind !== 'ok') throw new Error(r.reason);
    return r.run;
}

describe('compileModelRun against the bridge (startRun)', () => {
    it.each(EXAMPLES)('%s: the same net, initial state and replay of the scenario', name => {
        const ex = loadExample(name);
        const mine = runOf(ex.lookup);
        const started = startRun(ex.lookup, 'M', 'MM', '', () => recordOf(ex.lookup, 'M') as any, 1);
        if (started.kind !== 'started') throw new Error('the bridge refused');
        const bridge = started.run;
        expect([...mine.net.places]).toEqual([...bridge.net.places]);
        expect(mine.net.transitions).toEqual(bridge.net.transitions);
        expect(mine.net.bound).toBe(bridge.net.bound);
        expect(observeSim(mine.net.initial)).toEqual(observeSim(bridge.net.initial));
        // The bridge's oracles over the scenario, as configAt replays a trace.
        let cfg: NetConfiguration = { state: bridge.net.initial, event: null };
        const expected = [observeSim(cfg.state)];
        for (const s of ex.scenario.steps) {
            const o = coreStep(bridge.net, { state: cfg.state, event: s.event }, s.selector, bridge.guards, bridge.actions, bridge.derived);
            if (o.kind === 'inadmissible') throw new Error('the bridge refuses the scenario');
            expect(o.kind).toBe(s.kind);
            expected.push(observeSim(o.next.state));
            cfg = o.next;
        }
        const replay = simulate(mine, ex.scenario);
        expect(replay.failure).toBeNull();
        expect(replay.trace.map(s => s.observed)).toEqual(expected);
    });
});

describe('target, in a template', () => {
    it('is bound next to stc, the JavaScript profile (mutant: generate binds no target)', () => {
        const ex = loadExample('turnstile');
        const out = gen(ex.lookup, '"${target.name}"');
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('javascript');
    });

    it('is null on a model whose metamodel has no STC', () => {
        const ex = loadExample('turnstile');
        delete ex.lookup.MM._state;
        const out = gen(ex.lookup, '"${target.name}"');
        expect(out.errors.map(e => e.message)).toEqual(["Cannot access property 'name' of null"]);
    });

    it('initial is the compiled initial state as a JavaScript literal, derived values included', () => {
        const ex = loadExample('turnstile');
        const out = gen(ex.lookup, '"${target.initial}"');
        expect(JSON.parse(out.code)).toEqual(toJsState(runOf(loadExample('turnstile').lookup).net.initial));
        expect(JSON.parse(out.code)).toEqual({ marking: { locked: 1 }, attrs: { M: { coins: 0 } }, derived: { M: { paid: false } } });
    });

    it('net lists the transitions in compile order with their arcs and sites, and the derived attributes', () => {
        const ex = loadExample('turnstile');
        const out = gen(ex.lookup, '"${target.net.transitions.map(t => t.id + \':\' + t.preset.first.place + \'>\' + t.postset.first.place).join(\' \')} | ${target.net.derived.map(d => d.element + \'.\' + d.attr).join(\' \')}"');
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('tc:locked>locked tp:locked>unlocked ts:locked>off tu:unlocked>locked | M.paid');
    });

    it('guard(site) is the printer\'s guard as the simulator\'s outcome; true without a guard (mutant: the conjunction of a site dropped)', () => {
        const ex = loadExample('turnstile');
        const out = gen(ex.lookup, '"${target.guard(\'tp\')}|${target.guard(\'tc\')}"');
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('$guard(() => ($read(state, "M", "paid")))|({ kind: \'true\' })');
    });

    it('guard(site) conjoins two Guard attributes as the bridge does: a defect wins, then false', () => {
        const ex = loadExample('turnstile');
        ex.lookup.MM._state.simGuard = JSON.stringify(['F_Transition_guard', 'F_Transition_extra']);
        ex.lookup.F_Transition_extra = { className: 'DAttribute', id: 'F_Transition_extra', name: 'extra', father: 'C_Transition' };
        ex.lookup.V_tp_extra = { className: 'DValue', id: 'V_tp_extra', instanceof: 'F_Transition_extra', father: 'tp', values: ['model.[coins] > 0'] };
        ex.lookup.tp.features.push('V_tp_extra');
        const run = runOf(ex.lookup);
        expect(run.guards.get('tp')?.length).toBe(2);
        const out = gen(ex.lookup, '"${target.guard(\'tp\')}"');
        expect(out.errors).toEqual([]);
        const outcome = (paid: boolean, coins: number) => new Function('state', 'event', `'use strict';\n${JS_RUNTIME}\nreturn (${out.code});`)({ marking: {}, attrs: { M: { coins } }, derived: { M: { paid } } }, null);
        expect(outcome(true, 1)).toEqual({ kind: 'true' });
        expect(outcome(true, 0)).toEqual({ kind: 'false' });
        expect(outcome(false, 1)).toEqual({ kind: 'false' });
    });

    it('a guard the printer refuses throws its refusal into an error fragment (mutant: a refusal printed as code)', () => {
        const ex = loadExample('petri-producer-consumer');
        const v = ex.lookup.V_deliver_guard;
        v.values = ['buffer.[tokens].size > 0'];
        const out = gen(ex.lookup, '"${target.guard(\'deliver\')}"');
        expect(out.hasErrors).toBe(true);
        expect(out.code).toBe('');
        expect(out.errors[0].message).toMatch(/^The guard of deliver, 'buffer.\[tokens\].size > 0', has no JavaScript: P-STEP /);
    });

    it('actions(site) is the printer\'s body for a site object or an id', () => {
        const ex = loadExample('turnstile');
        const out = gen(ex.lookup, '"${target.actions(\'tc\')}\n---\n${target.actions(target.net.transitions.first.actionSites.filter(s => s.role == \'transition\').first)}"');
        expect(out.errors).toEqual([]);
        const [byId, bySite] = out.code.split('\n---\n');
        expect(byId).toBe('const $v0 = $value($add($read(state, "M", "coins"), 1));\nreturn $apply(state, [["M", "coins", $v0]]);');
        expect(bySite).toBe(byId);
    });

    it('equation(d) prints a global\'s equation with self the model (mutant: the model handle left out of the fold)', () => {
        const ex = loadExample('turnstile');
        const out = gen(ex.lookup, '"${target.equation(target.net.derived.first)}"');
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('$ge($read(state, "M", "coins"), 2)');
    });
});


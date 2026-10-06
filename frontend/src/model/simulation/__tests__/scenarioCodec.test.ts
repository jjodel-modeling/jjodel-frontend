/**
 * scenarioCodec — the scenarios of a model, as its bag stores them (R-SIM-139; P-2026-10-05-2315,
 * docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §4, C1).
 *
 * One key of the M1 bag, `runScenarios`, a JSON string `{"v":1,"scenarios":[{name,steps,expect?}]}`, a step being
 * `{event,selector,kind,inputs?}` by id: the fields in that order, so the same scenarios give the same string;
 * decoding tolerant scenario by scenario; at most 1000 steps a scenario; no key until a list is written, `[]` once
 * one was. Each test name says which break of the rule kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import {
    decodeScenarios, encodeScenarios, RUN_SCENARIOS_KEY, SCENARIO_MAX_STEPS, SCENARIO_STEP_KINDS, scenariosPatch,
} from '../scenarioCodec';
import type { ScenarioRecord, ScenarioStep } from '../scenarioCodec';

const COIN: ScenarioStep = { event: 'ev_coin', selector: 'tc', kind: 'fired' };
const PUSH_DISCARD: ScenarioStep = { event: 'ev_push', selector: null, kind: 'discard' };
const EPS_INPUT: ScenarioStep = { event: null, selector: 'n1#e3', kind: 'fired', inputs: [{ element: 'D', attr: 'decision', value: false }] };
const PAY: ScenarioRecord = { name: 'pay', steps: [COIN, PUSH_DISCARD], expect: 'Unlocked.[marked]' };
const DECIDE: ScenarioRecord = { name: 'decide', steps: [EPS_INPUT, { event: null, selector: null, kind: 'quiescence' }] };

describe('the key and the cap (C1)', () => {
    it('is runScenarios, not a sim* key: the run signature folds every sim* key, so a save would interrupt the run it is recorded from (mutant: simScenarios)', () => {
        expect(RUN_SCENARIOS_KEY).toBe('runScenarios');
        expect(RUN_SCENARIOS_KEY.startsWith('sim')).toBe(false);
    });

    it('a scenario holds 1000 steps at most, the kept configurations\' and Play\'s bound; the kinds are the trace\'s (mutant: another cap)', () => {
        expect(SCENARIO_MAX_STEPS).toBe(1000);
        expect(SCENARIO_STEP_KINDS).toEqual(['fired', 'halted', 'discard', 'quiescence']);
    });
});

describe('encodeScenarios: one string per list', () => {
    it('v, then the list; a scenario name, steps, expect; a step event, selector, kind, inputs; an input element, attr, value; whatever the records\' key order (mutant: the records spread as given)', () => {
        const shuffled = {
            expect: 'p3.[marked]',
            steps: [{ inputs: [{ value: 3, attr: 'n', element: 'M' }], kind: 'fired', selector: 't1', event: null }],
            name: 'one',
        } as unknown as ScenarioRecord;
        expect(encodeScenarios([shuffled])).toBe(
            '{"v":1,"scenarios":[{"name":"one","steps":[{"event":null,"selector":"t1","kind":"fired","inputs":[{"element":"M","attr":"n","value":3}]}],"expect":"p3.[marked]"}]}',
        );
    });

    it('a step without inputs and a scenario without expect write no such field; extra fields are not written (mutants: inputs written as []; expect written as null; the extras kept)', () => {
        const extra = { ...DECIDE, note: 'x', steps: [{ ...DECIDE.steps[1], origin: 'random' }] } as unknown as ScenarioRecord;
        expect(encodeScenarios([extra])).toBe('{"v":1,"scenarios":[{"name":"decide","steps":[{"event":null,"selector":null,"kind":"quiescence"}]}]}');
    });

    it('the empty list is [] (written as [], never a removed key)', () => {
        expect(encodeScenarios([])).toBe('{"v":1,"scenarios":[]}');
    });
});

describe('decodeScenarios: tolerant, scenario by scenario', () => {
    it('absent means no scenarios and no defect: a model without the key reads as before (mutants: absent read as unreadable; as a defect)', () => {
        for (const raw of [undefined, null]) expect(decodeScenarios(raw)).toEqual({ scenarios: [], defects: [], readable: true });
    });

    it('byte-identical round trip: null event and selector, inputs of the three value types, expect, quotes and non-ASCII (mutants: a field dropped on decode; inputs or expect not copied)', () => {
        const raw = encodeScenarios([
            PAY, DECIDE,
            { name: 'québec "fin"', steps: [{ event: 'e', selector: 's', kind: 'halted', inputs: [{ element: 'M', attr: 'x', value: 'a"b' }, { element: 'M', attr: 'y', value: true }] }], expect: '' },
        ]);
        const decoded = decodeScenarios(raw);
        expect(decoded.defects).toEqual([]);
        expect(decoded.scenarios).toHaveLength(3);
        expect(encodeScenarios(decoded.scenarios)).toBe(raw);
        expect(decoded.scenarios[0]).toEqual(PAY);
        expect(decoded.scenarios[1]).toEqual(DECIDE);
        expect(decodeScenarios('{"v":1,"scenarios":[]}')).toEqual({ scenarios: [], defects: [], readable: true });
    });

    it('a string that is not JSON, or has no v 1 and scenarios list, is one defect on the key and not readable (mutants: not JSON read as []; v not checked)', () => {
        const notJson = decodeScenarios('{"v":1,');
        expect([notJson.scenarios, notJson.readable, notJson.defects.length, notJson.defects[0].index]).toEqual([[], false, 1, null]);
        for (const raw of ['{"scenarios":[]}', '{"v":1}', '{"v":1,"scenarios":{}}', '[]', '"x"', '{"v":2,"scenarios":[]}']) {
            const d = decodeScenarios(raw);
            expect([raw, d.readable, d.defects.length, d.defects[0]?.index]).toEqual([raw, false, 1, null]);
        }
    });

    it('a broken scenario is a defect of its own and the others decode, in order (mutants: one defect drops the list; the index lost)', () => {
        const good = JSON.parse(encodeScenarios([PAY]))['scenarios'][0];
        const list = [
            'x',
            { steps: [] },
            good,
            { ...good },
            { name: 'notList', steps: {} },
            { name: 'badEvent', steps: [{ event: 3, selector: null, kind: 'discard' }] },
            { name: 'badSelector', steps: [{ event: null, kind: 'quiescence' }] },
            { name: 'badKind', steps: [{ event: null, selector: 't', kind: 'inadmissible' }] },
            { name: 'badInputs', steps: [{ event: null, selector: 't', kind: 'fired', inputs: [{ element: 'M', attr: 'x', value: null }] }] },
            { name: 'inputsNotList', steps: [{ event: null, selector: 't', kind: 'fired', inputs: {} }] },
            { name: 'badExpect', steps: [], expect: 3 },
            { name: 'nullExpect', steps: [], expect: null },
            { name: 'stepNotRecord', steps: [null] },
            { name: 'stringValue', steps: [{ event: null, selector: 't', kind: 'fired', inputs: [{ element: 'M', attr: 'x', value: 'NaN' }] }] },
            { name: 'empty', steps: [] },
        ];
        const d = decodeScenarios(JSON.stringify({ v: 1, scenarios: list }));
        expect(d.readable).toBe(true);
        expect(d.scenarios.map(s => s.name)).toEqual(['pay', 'stringValue', 'empty']);
        expect(d.defects.map(x => [x.index, x.name])).toEqual([
            [0, null], [1, null], [3, 'pay'], [4, 'notList'], [5, 'badEvent'], [6, 'badSelector'], [7, 'badKind'], [8, 'badInputs'],
            [9, 'inputsNotList'], [10, 'badExpect'], [11, 'nullExpect'], [12, 'stepNotRecord'],
        ]);
        expect(d.defects[2].message).toContain('taken');
        expect(d.defects[5].message).toContain('step 1');
    });

    it('a scenario past the cap is a defect, one at the cap decodes (mutants: no cap; the cap off by one)', () => {
        const step = { event: null, selector: 't', kind: 'fired' };
        const at = { name: 'at', steps: Array.from({ length: SCENARIO_MAX_STEPS }, () => step) };
        const past = { name: 'past', steps: Array.from({ length: SCENARIO_MAX_STEPS + 1 }, () => step) };
        const d = decodeScenarios(JSON.stringify({ v: 1, scenarios: [at, past] }));
        expect(d.scenarios.map(s => [s.name, s.steps.length])).toEqual([['at', SCENARIO_MAX_STEPS]]);
        expect(d.defects.map(x => [x.index, x.name])).toEqual([[1, 'past']]);
        expect(d.defects[0].message).toContain('1001');
    });

    it('unknown fields are ignored, on the root, a scenario, a step and an input (mutant: an unknown field is a defect)', () => {
        const raw = JSON.stringify({ v: 1, x: 1, scenarios: [{ name: 'a', z: 2, steps: [{ event: null, selector: 't', kind: 'fired', origin: 'random', inputs: [{ element: 'M', attr: 'x', value: 1, w: 0 }] }] }] });
        const d = decodeScenarios(raw);
        expect(d.defects).toEqual([]);
        expect(encodeScenarios(d.scenarios)).toBe('{"v":1,"scenarios":[{"name":"a","steps":[{"event":null,"selector":"t","kind":"fired","inputs":[{"element":"M","attr":"x","value":1}]}]}]}');
    });
});

describe('scenariosPatch: what a save or a delete writes', () => {
    it('nothing on a model with no key and no scenario: its bytes stay (mutant: [] written on an untouched model)', () => {
        expect(scenariosPatch(undefined, [])).toBeNull();
        expect(scenariosPatch(null, [])).toBeNull();
    });

    it('the key alone, in one assignment, so one set_state and one undo step (mutant: the whole bag written)', () => {
        expect(scenariosPatch(undefined, [PAY])).toEqual({ runScenarios: encodeScenarios([PAY]) });
    });

    it('nothing when the list is the stored one (mutant: a write per save of the same list)', () => {
        expect(scenariosPatch(encodeScenarios([PAY]), [PAY])).toBeNull();
    });

    it('the last one deleted writes [], never a removed key: the undo of a removed bag key does not restore it (mutant: the key removed)', () => {
        expect(scenariosPatch(encodeScenarios([PAY]), [])).toEqual({ runScenarios: '{"v":1,"scenarios":[]}' });
    });
});

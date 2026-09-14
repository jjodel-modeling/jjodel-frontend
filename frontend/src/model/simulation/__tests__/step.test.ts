/**
 * step — the simulation step as committed, locked before step 3 changes it.
 *
 * Executes the core (P11): `stepFlowchartBoolean`, `initialConfiguration`,
 * `runStatus` and `stcFromRoles` run against a fake `SimModelView` built from a
 * small table of instances and transitions. No mirror of the logic lives here.
 *
 * The tests named `quirk:` pin behaviour that is committed but not intended to
 * survive: the fire-all, the global terminal freeze, the vanishing token of a
 * dangling transition, `Deadlock` reported while other tokens progress. They
 * are the regression net for R-SIM-7; when step 3 lands they are expected to
 * change, and each change must be a decision, not an accident.
 *
 * Every assertion of "nothing happened" is paired with the same call on an
 * input where something does happen (P12).
 */

import { describe, it, expect } from 'vitest';
import { applyStepLabel, initialConfiguration, runStatus, stepFlowchartBoolean } from '../step';
import { stcFromRoles } from '../stcFromRoles';
import { isKindOf } from '../isKindOf';
import type { SimConfiguration, SimModelView, StcDescriptor } from '../types';
// Test-only import from the IR (import-free module): the parity check of R-SIM-8.
import { classAncestry } from '../../../components/editor-v2/viewpoint/ir/irReadCtx';

const STC: StcDescriptor = {
    kind: 'boolean',
    roles: { initial: 'C_Initial', terminal: 'C_Final', ownedTransitions: 'R_out', nextState: 'R_next' },
};

interface Fixture {
    /** instance id -> metaclass id and owned transition ids */
    instances: Record<string, { cls: string; out?: string[] }>;
    /** transition id -> target id (null: unset) */
    transitions: Record<string, string | null>;
}

function makeView(f: Fixture): SimModelView {
    return {
        exists: id => id in f.instances || id in f.transitions,
        isInstanceOf: (id, classId) => f.instances[id]?.cls === classId,
        outgoingTransitions: id => [...(f.instances[id]?.out ?? [])],
        transitionTarget: t => f.transitions[t] ?? null,
    };
}

function config(...ids: string[]): SimConfiguration {
    return { marking: new Set(ids), event: null };
}

function marked(c: SimConfiguration): string[] {
    return [...c.marking].sort();
}

describe('initialConfiguration (Reset)', () => {
    it('marks every instance of the initial metaclass among the given ids', () => {
        const view = makeView({
            instances: { I1: { cls: 'C_Initial' }, I2: { cls: 'C_Initial' }, S: { cls: 'C_State' } },
            transitions: {},
        });
        const c = initialConfiguration(STC, view, ['I1', 'S', 'I2']);
        expect(marked(c)).toEqual(['I1', 'I2']);
        expect(c.event).toBeNull();
    });

    it('marks nothing when no id is an instance of the initial metaclass', () => {
        const view = makeView({ instances: { S: { cls: 'C_State' }, I: { cls: 'C_Initial' } }, transitions: {} });
        expect(marked(initialConfiguration(STC, view, ['S']))).toEqual([]);
        // control: the same view marks I when I is among the ids
        expect(marked(initialConfiguration(STC, view, ['S', 'I']))).toEqual(['I']);
    });
});

describe('stepFlowchartBoolean', () => {
    it('linear chain: the token moves one transition per step', () => {
        const view = makeView({
            instances: { A: { cls: 'C_Initial', out: ['t1'] }, B: { cls: 'C_State', out: ['t2'] }, C: { cls: 'C_Final' } },
            transitions: { t1: 'B', t2: 'C' },
        });
        const s1 = stepFlowchartBoolean(config('A'), STC, view);
        expect(marked(s1.next)).toEqual(['B']);
        expect(s1.label).toEqual({ fired: ['t1'], deactivated: ['A'], activated: ['B'] });

        const s2 = stepFlowchartBoolean(s1.next, STC, view);
        expect(marked(s2.next)).toEqual(['C']);
        expect(s2.label).toEqual({ fired: ['t2'], deactivated: ['B'], activated: ['C'] });
    });

    it('quirk: fire-all — every outgoing transition fires, a fork marks every target', () => {
        const view = makeView({
            instances: { A: { cls: 'C_Initial', out: ['t1', 't2'] }, B: { cls: 'C_State' }, C: { cls: 'C_State' } },
            transitions: { t1: 'B', t2: 'C' },
        });
        const s = stepFlowchartBoolean(config('A'), STC, view);
        expect(marked(s.next)).toEqual(['B', 'C']);
        expect(s.label.fired).toEqual(['t1', 't2']);
    });

    it('quirk: fire-all — every marked instance fires in the same step, a join collapses into one mark', () => {
        const view = makeView({
            instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State', out: ['t2'] }, C: { cls: 'C_State' } },
            transitions: { t1: 'C', t2: 'C' },
        });
        const s = stepFlowchartBoolean(config('A', 'B'), STC, view);
        expect(marked(s.next)).toEqual(['C']);
        expect(s.label).toEqual({ fired: ['t1', 't2'], deactivated: ['A', 'B'], activated: ['C', 'C'] });
    });

    it('quirk: a dangling transition still consumes the source token, which vanishes', () => {
        const view = makeView({
            instances: { A: { cls: 'C_State', out: ['tUnset', 'tGone'] } },
            transitions: { tUnset: null, tGone: 'DELETED' },
        });
        const s = stepFlowchartBoolean(config('A'), STC, view);
        expect(marked(s.next)).toEqual([]);
        expect(s.label).toEqual({ fired: ['tUnset', 'tGone'], deactivated: ['A'], activated: [] });
    });

    it('quirk: any marked terminal freezes the whole run, other tokens included', () => {
        const view = makeView({
            instances: { F: { cls: 'C_Final' }, A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } },
            transitions: { t1: 'B' },
        });
        const frozen = config('F', 'A');
        const s = stepFlowchartBoolean(frozen, STC, view);
        expect(s.next).toBe(frozen);
        expect(s.label).toEqual({ fired: [], deactivated: [], activated: [] });
        // control: without the terminal mark, A fires
        expect(marked(stepFlowchartBoolean(config('A'), STC, view).next)).toEqual(['B']);
    });

    it('quirk: an instance with no outgoing transition stays marked while the others progress', () => {
        const view = makeView({
            instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' }, Stuck: { cls: 'C_State' } },
            transitions: { t1: 'B' },
        });
        const s = stepFlowchartBoolean(config('A', 'Stuck'), STC, view);
        expect(marked(s.next)).toEqual(['B', 'Stuck']);
        expect(s.label.deactivated).toEqual(['A']);
    });

    it('activation wins over deactivation: a self-loop keeps its source marked', () => {
        const view = makeView({ instances: { A: { cls: 'C_State', out: ['loop'] } }, transitions: { loop: 'A' } });
        const s = stepFlowchartBoolean(config('A'), STC, view);
        expect(marked(s.next)).toEqual(['A']);
        expect(s.label).toEqual({ fired: ['loop'], deactivated: ['A'], activated: ['A'] });
    });

    it('activation wins over deactivation: a source re-entered by another firing transition stays marked', () => {
        const view = makeView({
            instances: { A: { cls: 'C_State', out: ['tAB'] }, B: { cls: 'C_State', out: ['tBA'] } },
            transitions: { tAB: 'B', tBA: 'A' },
        });
        const s = stepFlowchartBoolean(config('A', 'B'), STC, view);
        expect(marked(s.next)).toEqual(['A', 'B']);
    });

    it('empty configuration: nothing fires', () => {
        const view = makeView({ instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: 'B' } });
        const s = stepFlowchartBoolean(config(), STC, view);
        expect(marked(s.next)).toEqual([]);
        expect(s.label).toEqual({ fired: [], deactivated: [], activated: [] });
        // control: the same view fires from A
        expect(stepFlowchartBoolean(config('A'), STC, view).label.fired).toEqual(['t1']);
    });

    it('quirk: a marked id no longer in the model is skipped and kept in the marking', () => {
        const view = makeView({ instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: 'B' } });
        const s = stepFlowchartBoolean(config('A', 'DELETED'), STC, view);
        expect(marked(s.next)).toEqual(['B', 'DELETED']);
        expect(s.label.deactivated).toEqual(['A']);
    });

    it('does not mutate the input marking', () => {
        const view = makeView({ instances: { A: { cls: 'C_State', out: ['t1'] }, B: { cls: 'C_State' } }, transitions: { t1: 'B' } });
        const before = config('A');
        stepFlowchartBoolean(before, STC, view);
        expect(marked(before)).toEqual(['A']);
    });
});

describe('runStatus', () => {
    const view = makeView({
        instances: {
            A: { cls: 'C_State', out: ['t1'] },
            B: { cls: 'C_State', out: ['t2'] },
            Stuck: { cls: 'C_State' },
            F: { cls: 'C_Final' },
        },
        transitions: { t1: 'B', t2: 'A' },
    });

    it('Not started when nothing in the model is marked', () => {
        expect(runStatus(config(), STC, view)).toBe('Not started');
        expect(runStatus(config('DELETED'), STC, view)).toBe('Not started');
        // control
        expect(runStatus(config('A'), STC, view)).toBe('Running');
    });

    it('Terminated when any marked instance is terminal', () => {
        expect(runStatus(config('F', 'A'), STC, view)).toBe('Terminated');
    });

    it('quirk: Terminated wins over Deadlock', () => {
        expect(runStatus(config('F', 'Stuck'), STC, view)).toBe('Terminated');
    });

    it('quirk: Deadlock as soon as one marked instance is stuck, even while others can progress', () => {
        expect(runStatus(config('A', 'Stuck'), STC, view)).toBe('Deadlock');
        expect(runStatus(config('A', 'B'), STC, view)).toBe('Running');
    });
});

describe('applyStepLabel', () => {
    it('deactivates first, then activates', () => {
        expect([...applyStepLabel(new Set(['A', 'X']), ['A'], ['A', 'B'])].sort()).toEqual(['A', 'B', 'X']);
        expect([...applyStepLabel(new Set(['A', 'X']), ['A'], ['B'])].sort()).toEqual(['B', 'X']);
    });
});

describe('isKindOf — one notion of "is a" (R-SIM-8)', () => {
    // Raw D-layer shape: DObject.instanceof -> DClass id, DClass.extends -> DClass ids.
    const lookup: Record<string, any> = {
        C_Node: { className: 'DClass', name: 'Node', extends: [] },
        C_Initial: { className: 'DClass', name: 'Initial', extends: ['C_Node'] },
        C_SubInitial: { className: 'DClass', name: 'SubInitial', extends: ['C_Initial'] },
        C_Final: { className: 'DClass', name: 'Final', extends: ['C_Node'] },
        C_SubFinal: { className: 'DClass', name: 'SubFinal', extends: ['C_Final'] },
        C_LoopA: { className: 'DClass', name: 'LoopA', extends: ['C_LoopB'] },
        C_LoopB: { className: 'DClass', name: 'LoopB', extends: ['C_LoopA'] },
        I: { className: 'DObject', instanceof: 'C_Initial', out: [] },
        SubI: { className: 'DObject', instanceof: 'C_SubInitial', out: ['t1'] },
        N: { className: 'DObject', instanceof: 'C_Node', out: [] },
        SubF: { className: 'DObject', instanceof: 'C_SubFinal', out: [] },
        A: { className: 'DObject', instanceof: 'C_Node', out: ['t2'] },
        Loop: { className: 'DObject', instanceof: 'C_LoopA' },
        Orphan: { className: 'DObject', instanceof: 'C_Deleted' },
        t1: { className: 'DObject', instanceof: 'C_T', next: 'A' },
        t2: { className: 'DObject', instanceof: 'C_T', next: 'SubF' },
    };
    // Built exactly as the panel's adapter builds `isInstanceOf`.
    const view: SimModelView = {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: id => [...(lookup[id]?.out ?? [])],
        transitionTarget: t => lookup[t]?.next ?? null,
    };

    it('a subclass of the initial metaclass is initial', () => {
        expect(marked(initialConfiguration(STC, view, ['N', 'SubI', 'A']))).toEqual(['SubI']);
        // control: the superclass is not initial
        expect(marked(initialConfiguration(STC, view, ['N', 'A']))).toEqual([]);
    });

    it('a subclass of the terminal metaclass terminates the run', () => {
        expect(runStatus(config('SubF'), STC, view)).toBe('Terminated');
        expect(stepFlowchartBoolean(config('SubF', 'A'), STC, view).label.fired).toEqual([]);
        // control: without it, A fires into SubF
        expect(stepFlowchartBoolean(config('A'), STC, view).label.fired).toEqual(['t2']);
    });

    it('matches the class itself, walks transitively, never downwards', () => {
        expect(isKindOf(lookup, 'I', 'C_Initial')).toBe(true);
        expect(isKindOf(lookup, 'SubI', 'C_Node')).toBe(true);
        expect(isKindOf(lookup, 'I', 'C_SubInitial')).toBe(false);
        expect(isKindOf(lookup, 'N', 'C_Initial')).toBe(false);
    });

    it('terminates on a cycle in extends, and answers false for unknown objects', () => {
        expect(isKindOf(lookup, 'Loop', 'C_LoopB')).toBe(true);
        expect(isKindOf(lookup, 'Loop', 'C_Node')).toBe(false);
        expect(isKindOf(lookup, 'Nobody', 'C_Node')).toBe(false);
    });

    it('keeps the exact-id match of a metaclass no longer in the lookup', () => {
        expect(isKindOf(lookup, 'Orphan', 'C_Deleted')).toBe(true);
        expect(isKindOf(lookup, 'Orphan', 'C_Node')).toBe(false);
    });

    it('agrees with the IR ancestry walk (classAncestry) on every existing class', () => {
        const classes = Object.keys(lookup).filter(id => lookup[id].className === 'DClass');
        const objects = Object.keys(lookup).filter(id => lookup[id].className === 'DObject' && lookup[lookup[id].instanceof]);
        let compared = 0;
        for (const o of objects) {
            const ancestors = classAncestry(lookup, lookup[o].instanceof).map(a => a.id);
            for (const c of classes) {
                expect(isKindOf(lookup, o, c)).toBe(ancestors.includes(c));
                compared++;
            }
        }
        expect(compared).toBeGreaterThan(20);
    });
});

describe('stcFromRoles', () => {
    const complete = {
        simNode: 'C_State',
        simInitial: 'C_Initial',
        simTerminal: 'C_Final',
        simTransition: 'C_Transition',
        simOwnedTransitions: 'R_out',
        simNextState: 'R_next',
    };

    it('builds the boolean descriptor from the six flat keys', () => {
        expect(stcFromRoles(complete)).toEqual({
            kind: 'boolean',
            roles: {
                initial: 'C_Initial', terminal: 'C_Final', ownedTransitions: 'R_out', nextState: 'R_next',
                node: 'C_State', transition: 'C_Transition',
            },
        });
    });

    it('needs only the four engine keys; node and transition are optional', () => {
        const { simNode, simTransition, ...engine } = complete;
        expect(stcFromRoles(engine)?.roles).toEqual({
            initial: 'C_Initial', terminal: 'C_Final', ownedTransitions: 'R_out', nextState: 'R_next',
        });
    });

    it('returns null when any engine key is missing, empty or not a string', () => {
        for (const key of ['simInitial', 'simTerminal', 'simOwnedTransitions', 'simNextState']) {
            expect(stcFromRoles({ ...complete, [key]: undefined })).toBeNull();
            expect(stcFromRoles({ ...complete, [key]: '' })).toBeNull();
            expect(stcFromRoles({ ...complete, [key]: 42 })).toBeNull();
        }
        expect(stcFromRoles(undefined)).toBeNull();
        expect(stcFromRoles({})).toBeNull();
    });
});

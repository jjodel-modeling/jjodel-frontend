/**
 * simProfiles — the simulation profiles (P-2026-09-25-1805, R-SIM-47..49,
 * R-SIM-54): the eight system profiles, the computed required set with the
 * either-items of the control-flow source (R-SIM-10) and initial tokens
 * (R-SIM-56, P-2026-09-25-1840), the defects of a profile and the checkability
 * verdict on a role bag.
 */

import { describe, it, expect } from 'vitest';
import { ROLE_IDS, roleDescriptor } from '../roleCatalog';
import type { RoleId } from '../roleCatalog';
import {
    SYSTEM_PROFILES, SYSTEM_PROFILE_IDS, checkability, requiredRoles, systemProfile, validateProfile,
} from '../simProfiles';
import type { RequiredItem, RoleMode, SimProfile, SystemProfileId } from '../simProfiles';

const EITHER_SOURCE: RequiredItem = { anyOf: ['source', 'ownedTransitions'] };
const EITHER_INITIAL: RequiredItem = { anyOf: ['initial', 'initialMarking'] };
const CF_CLOSURE: RequiredItem[] = ['node', 'transition', 'nextState', EITHER_INITIAL, EITHER_SOURCE];
const PETRI_CLOSURE: RequiredItem[] = ['node', 'transition', 'arc', 'arcSource', 'arcTarget', 'initialMarking'];
const CF_CLOSURE_ROLES: RoleId[] = ['node', 'transition', 'nextState', 'initial', 'initialMarking', 'source', 'ownedTransitions'];
const PETRI_GROUP: RoleId[] = ['arc', 'arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc'];

/** The prompt's table: roles active beyond the closure, added requirements, constraints. */
const TABLE: Record<SystemProfileId, {
    name: string; shape: 'controlFlow' | 'petri'; active: RoleId[]; added: RoleId[]; constraints: string[];
}> = {
    petri: { name: 'Petri net (P/T)', shape: 'petri', active: ['arcWeight', 'inhibitorArc', 'bound', 'terminal'], added: [], constraints: [] },
    flowchart: { name: 'Flowchart / Activity', shape: 'controlFlow', active: ['guard', 'terminal', 'activityFinal', 'fork', 'join', 'action', 'entry'], added: [], constraints: [] },
    stateMachine: { name: 'State machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'guard', 'terminal'], added: [], constraints: ['singleToken'] },
    extendedStateMachine: { name: 'Extended state machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'guard', 'terminal', 'action', 'entry', 'exit', 'stateAttributes'], added: [], constraints: ['singleToken'] },
    dfa: { name: 'DFA', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'accepting'], added: ['trigger', 'accepting'], constraints: ['singleToken', 'noEpsilon', 'deterministic'] },
    nfa: { name: 'NFA', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'accepting'], added: ['trigger', 'accepting'], constraints: ['singleToken'] },
    moore: { name: 'Moore machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'stateOutput'], added: ['trigger', 'stateOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'] },
    mealy: { name: 'Mealy machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'transitionOutput'], added: ['trigger', 'transitionOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'] },
};

function sys(id: SystemProfileId): SimProfile {
    const p = systemProfile(id);
    if (!p) throw new Error(`no system profile ${id}`);
    return p;
}

/** A user profile copied from a system one («Save as…»), with some modes replaced. */
function userCopy(id: SystemProfileId, modes: Partial<Record<RoleId, RoleMode>> = {}, name = 'My profile'): SimProfile {
    const base = sys(id);
    return { ...base, id: 'user-1', name, system: false, basedOn: id, modes: { ...base.modes, ...modes } };
}

const OFF: RoleMode = { mode: 'off', reason: 'test' };
const EDIT: RoleMode = { mode: 'edit' };

const CF_BAG = { simNode: 'c_node', simTransition: 'c_edge', simNextState: 'f_next', simInitial: 'c_init', simSource: 'f_src' };
const PETRI_BAG = { simNode: 'c_place', simTransition: 'c_trans', simArc: 'c_arc', simArcSource: 'f_as', simArcTarget: 'f_at', simInitialMarking: 'f_m0' };

describe('system profiles: complete and valid', () => {
    it('are the eight of R-SIM-54, in order, with their names', () => {
        expect(SYSTEM_PROFILES.map(p => p.id)).toEqual([...SYSTEM_PROFILE_IDS]);
        expect(SYSTEM_PROFILE_IDS).toEqual(['petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'dfa', 'nfa', 'moore', 'mealy']);
        for (const p of SYSTEM_PROFILES) {
            expect(p.name).toBe(TABLE[p.id as SystemProfileId].name);
            expect(p.system).toBe(true);
            expect(p.shape).toBe(TABLE[p.id as SystemProfileId].shape);
        }
    });

    it('carry a mode for every RoleId, and nothing else', () => {
        for (const p of SYSTEM_PROFILES) expect(Object.keys(p.modes).sort(), p.id).toEqual([...ROLE_IDS].sort());
    });

    it('validate', () => {
        for (const p of SYSTEM_PROFILES) expect(validateProfile(p), p.id).toEqual([]);
    });

    it('put in edit exactly the closure roles plus the table row, the derived Initial marking aside', () => {
        for (const p of SYSTEM_PROFILES) {
            const row = TABLE[p.id as SystemProfileId];
            const closure: RoleId[] = row.shape === 'petri'
                ? ['node', 'transition', 'arc', 'arcSource', 'arcTarget', 'initialMarking']
                : CF_CLOSURE_ROLES.filter(r => r !== 'initialMarking');
            const edit = ROLE_IDS.filter(r => p.modes[r].mode === 'edit');
            expect(edit.sort(), p.id).toEqual([...new Set([...closure, ...row.active])].sort());
        }
    });

    it('derive bound (1) and initial marking (from Initial, 1 on Initial) in control flow, and event from trigger where trigger is active', () => {
        for (const p of SYSTEM_PROFILES) {
            const row = TABLE[p.id as SystemProfileId];
            if (row.shape === 'controlFlow') {
                expect(p.modes.initial, p.id).toEqual({ mode: 'edit' });
                expect(p.modes.bound, p.id).toMatchObject({ mode: 'derived', value: 1 });
                expect(p.modes.initialMarking, p.id).toEqual({ mode: 'derived', from: 'initial', note: '1 on Initial' });
                expect(p.params.bound, p.id).toBe(1);
            }
            if (row.active.includes('trigger')) expect(p.modes.event, p.id).toMatchObject({ mode: 'derived', from: 'trigger' });
            else expect(p.modes.event.mode, p.id).toBe('off');
        }
        expect(sys('petri').modes.bound).toEqual({ mode: 'edit' });
        expect(sys('petri').params).toEqual({ bound: 1, selector: 'list' });
    });

    it('turn off the rest with the reasons of the prompt', () => {
        for (const p of SYSTEM_PROFILES) {
            for (const r of ROLE_IDS) {
                const m = p.modes[r];
                if (m.mode !== 'off') continue;
                if (p.shape === 'controlFlow' && PETRI_GROUP.includes(r)) expect(m.reason, `${p.id}.${r}`).toBe('Compiled from control flow');
                else if (p.id === 'petri' && r === 'initial') expect(m.reason).toBe('Petri shape uses Initial marking');
                else expect(m.reason, `${p.id}.${r}`).toBe(`Not used by ${p.name}`);
            }
        }
    });

    it('carry the constraints and added requirements of the table', () => {
        for (const p of SYSTEM_PROFILES) {
            const row = TABLE[p.id as SystemProfileId];
            expect([...p.constraints].sort(), p.id).toEqual([...row.constraints].sort());
            expect([...p.addedRequired], p.id).toEqual(row.added);
            expect(p.params.selector, p.id).toBe('list');
        }
    });

    it('are found by id, and nothing is found by a stranger', () => {
        expect(systemProfile('dfa')?.name).toBe('DFA');
        expect(systemProfile('statechart')).toBeUndefined();
        expect(systemProfile('')).toBeUndefined();
    });
});

describe('requiredRoles', () => {
    const cases: Array<[SystemProfileId, RequiredItem[]]> = [
        ['petri', PETRI_CLOSURE],
        ['flowchart', CF_CLOSURE],
        ['stateMachine', CF_CLOSURE],
        ['extendedStateMachine', CF_CLOSURE],
        ['dfa', [...CF_CLOSURE, 'trigger', 'accepting']],
        ['nfa', [...CF_CLOSURE, 'trigger', 'accepting']],
        ['moore', [...CF_CLOSURE, 'trigger', 'stateOutput']],
        ['mealy', [...CF_CLOSURE, 'trigger', 'transitionOutput']],
    ];
    it.each(cases)('%s', (id, expected) => {
        expect(requiredRoles(sys(id))).toEqual(expected);
    });

    it('adds a requirement once, even when it is already in the closure', () => {
        const p: SimProfile = { ...userCopy('flowchart'), addedRequired: ['node', 'guard', 'guard'] };
        expect(requiredRoles(p)).toEqual([...CF_CLOSURE, 'guard']);
    });
});

describe('validateProfile: one failing profile per defect', () => {
    it('a closure role off (a user profile that drops Next state is rejected)', () => {
        const defects = validateProfile(userCopy('flowchart', { nextState: OFF }));
        expect(defects.map(d => d.code)).toEqual(['closureRoleOff']);
        expect(defects[0].roles).toEqual(['nextState']);
    });

    it('a Petri closure role off', () => {
        expect(validateProfile(userCopy('petri', { initialMarking: OFF })).map(d => d.code)).toEqual(['closureRoleOff']);
    });

    it('the either-item: one side off is fine, both off is one defect naming both', () => {
        expect(validateProfile(userCopy('flowchart', { source: OFF }))).toEqual([]);
        expect(validateProfile(userCopy('flowchart', { ownedTransitions: OFF }))).toEqual([]);
        const defects = validateProfile(userCopy('flowchart', { source: OFF, ownedTransitions: OFF }));
        expect(defects.map(d => d.code)).toEqual(['closureRoleOff']);
        expect(defects[0].roles).toEqual(['source', 'ownedTransitions']);
    });

    it('the Initial either-item: Initial off with Initial marking in edit is fine, both off is one defect naming both', () => {
        expect(validateProfile(userCopy('flowchart', { initial: OFF, initialMarking: EDIT }))).toEqual([]);
        const defects = validateProfile(userCopy('flowchart', { initial: OFF, initialMarking: OFF }));
        expect(defects.map(d => d.code)).toEqual(['closureRoleOff']);
        expect(defects[0].roles).toEqual(['initial', 'initialMarking']);
    });

    it('a closure role derived is not a defect', () => {
        expect(validateProfile(userCopy('flowchart', { initial: { mode: 'derived', from: 'node', note: 'every node' } }))).toEqual([]);
    });

    it('an active role of the other shape group', () => {
        const cf = validateProfile(userCopy('flowchart', { arc: EDIT }));
        expect(cf.map(d => d.code)).toEqual(['otherShapeActive']);
        expect(cf[0].roles).toEqual(['arc']);
        const petri = validateProfile(userCopy('petri', { nextState: EDIT }));
        expect(petri.map(d => d.code)).toEqual(['otherShapeActive']);
        expect(petri[0].roles).toEqual(['nextState']);
    });

    it('an active role whose dependency is off (edit and derived alike)', () => {
        const defects = validateProfile(userCopy('stateMachine', { trigger: OFF }));
        expect(defects.map(d => [d.code, ...d.roles])).toEqual([
            ['dependencyOff', 'event', 'trigger'],
            ['dependencyOff', 'eventIdentifier', 'trigger'],
        ]);
    });

    it('a derived role with neither value nor from', () => {
        const defects = validateProfile(userCopy('flowchart', { bound: { mode: 'derived', note: 'k' } }));
        expect(defects.map(d => [d.code, ...d.roles])).toEqual([['derivedWithoutSource', 'bound']]);
    });

    it('an empty or blank name', () => {
        expect(validateProfile(userCopy('flowchart', {}, '')).map(d => d.code)).toEqual(['blankName']);
        expect(validateProfile(userCopy('flowchart', {}, '  \t')).map(d => d.code)).toEqual(['blankName']);
    });

    it('a user profile named as a system profile (case-insensitive, trimmed)', () => {
        expect(validateProfile(userCopy('dfa', {}, '  dfa ')).map(d => d.code)).toEqual(['systemName']);
        expect(validateProfile(userCopy('flowchart', {}, 'FLOWCHART / activity')).map(d => d.code)).toEqual(['systemName']);
        expect(validateProfile(userCopy('dfa', {}, 'DFA with outputs'))).toEqual([]);
    });

    it('reports every defect, not the first', () => {
        const defects = validateProfile(userCopy('flowchart', { nextState: OFF, arc: EDIT }, ''));
        expect(defects.map(d => d.code).sort()).toEqual(['blankName', 'closureRoleOff', 'otherShapeActive']);
    });
});

describe('checkability', () => {
    it('an empty bag misses the whole closure', () => {
        expect(checkability(sys('flowchart'), {})).toEqual({ status: 'notCheckable', missing: CF_CLOSURE });
        expect(checkability(sys('petri'), {})).toEqual({ status: 'notCheckable', missing: PETRI_CLOSURE });
        expect(checkability(sys('dfa'), {})).toEqual({ status: 'notCheckable', missing: [...CF_CLOSURE, 'trigger', 'accepting'] });
    });

    it('a complete control-flow bag is checkable', () => {
        expect(checkability(sys('flowchart'), CF_BAG)).toEqual({ status: 'checkable', missing: [] });
        expect(checkability(sys('stateMachine'), CF_BAG)).toEqual({ status: 'checkable', missing: [] });
    });

    it('a complete Petri bag is checkable', () => {
        expect(checkability(sys('petri'), PETRI_BAG)).toEqual({ status: 'checkable', missing: [] });
    });

    it('the source: Source only, Owned transitions only, neither', () => {
        const { simSource: _s, ...noSource } = CF_BAG;
        expect(checkability(sys('flowchart'), CF_BAG).status).toBe('checkable');
        expect(checkability(sys('flowchart'), { ...noSource, simOwnedTransitions: 'f_out' }).status).toBe('checkable');
        expect(checkability(sys('flowchart'), noSource)).toEqual({ status: 'notCheckable', missing: [EITHER_SOURCE] });
    });

    it('binds a role only with a non-empty string', () => {
        expect(checkability(sys('flowchart'), { ...CF_BAG, simNextState: '' }).missing).toEqual(['nextState']);
        expect(checkability(sys('flowchart'), { ...CF_BAG, simNextState: 3 }).missing).toEqual(['nextState']);
        expect(checkability(sys('flowchart'), { ...CF_BAG, simNextState: null }).missing).toEqual(['nextState']);
    });

    it('counts a derived role as bound (event, from trigger, with no key)', () => {
        const p: SimProfile = { ...userCopy('stateMachine'), addedRequired: ['event', 'bound'] };
        expect(checkability(p, { ...CF_BAG, simTrigger: 'f_trig' })).toEqual({ status: 'checkable', missing: [] });
    });

    it('counts a derived role with from as unbound while its source is unbound (event without trigger)', () => {
        const p: SimProfile = { ...userCopy('stateMachine'), addedRequired: ['event', 'bound'] };
        expect(checkability(p, CF_BAG)).toEqual({ status: 'notCheckable', missing: ['event'] });
    });

    it('a control-flow system profile without simInitial misses the Initial item: the derived Initial marking does not bind alone', () => {
        const { simInitial: _i, ...noInitial } = CF_BAG;
        for (const id of ['flowchart', 'stateMachine'] as SystemProfileId[]) {
            expect(checkability(sys(id), noInitial), id).toEqual({ status: 'notCheckable', missing: [EITHER_INITIAL] });
            expect(checkability(sys(id), { ...noInitial, simInitialMarking: 'f_m0' }), id).toEqual({ status: 'notCheckable', missing: [EITHER_INITIAL] });
        }
    });

    it('a derived cycle binds nothing and does not throw', () => {
        const p = userCopy('flowchart', {
            initial: { mode: 'derived', from: 'initialMarking', note: 'x' },
            initialMarking: { mode: 'derived', from: 'initial', note: 'y' },
        });
        expect(checkability(p, CF_BAG)).toEqual({ status: 'notCheckable', missing: [EITHER_INITIAL] });
    });

    it('does not bind a role that is off, even with its key set', () => {
        const p = userCopy('flowchart', { source: OFF });
        expect(checkability(p, CF_BAG)).toEqual({ status: 'notCheckable', missing: [EITHER_SOURCE] });
    });

    it('adds the requirements of the profile (DFA without trigger and accepting)', () => {
        expect(checkability(sys('dfa'), CF_BAG)).toEqual({ status: 'notCheckable', missing: ['trigger', 'accepting'] });
        expect(checkability(sys('dfa'), { ...CF_BAG, simTrigger: 'f_t', simAccepting: 'c_acc' }).status).toBe('checkable');
    });

    it('a warn verdict gives warnings, an incompatible one notCheckable', () => {
        expect(checkability(sys('flowchart'), CF_BAG, { guard: 'warn' })).toEqual({ status: 'warnings', missing: [] });
        expect(checkability(sys('flowchart'), CF_BAG, { nextState: 'incompatible' })).toEqual({ status: 'notCheckable', missing: [] });
        expect(checkability(sys('flowchart'), CF_BAG, { guard: 'warn', nextState: 'incompatible' }).status).toBe('notCheckable');
        expect(checkability(sys('flowchart'), CF_BAG, { guard: 'ok', nextState: 'ok' }).status).toBe('checkable');
        const { simInitial: _i, ...noInitial } = CF_BAG;
        expect(checkability(sys('flowchart'), noInitial, { guard: 'warn' })).toEqual({ status: 'notCheckable', missing: [EITHER_INITIAL] });
    });
});

describe('the catalog and the profiles agree', () => {
    it('no system profile activates a role whose dependency it turns off', () => {
        for (const p of SYSTEM_PROFILES) {
            for (const r of ROLE_IDS) {
                if (p.modes[r].mode === 'off') continue;
                for (const dep of roleDescriptor(r).dependsOn) expect(p.modes[dep].mode, `${p.id}: ${r} -> ${dep}`).not.toBe('off');
            }
        }
    });
});

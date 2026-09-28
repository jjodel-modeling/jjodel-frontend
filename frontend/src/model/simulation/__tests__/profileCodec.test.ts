/**
 * profileCodec — the `simProfile` bag key and the «Custom» profile of a bag
 * without it (P-2026-09-25-1805, R-SIM-55, R-SIM-31(4)); in control flow Bound
 * and Initial marking in edit when set (R-SIM-56, P-2026-09-25-1840).
 */

import { describe, it, expect } from 'vitest';
import { ROLE_IDS } from '../roleCatalog';
import type { RoleId } from '../roleCatalog';
import { checkability, systemProfile, validateProfile } from '../simProfiles';
import type { SimProfile } from '../simProfiles';
import { decodeProfile, encodeProfile, inferCustomProfile } from '../profileCodec';

function sys(id: string): SimProfile {
    const p = systemProfile(id);
    if (!p) throw new Error(`no system profile ${id}`);
    return p;
}

const USER: SimProfile = {
    ...sys('dfa'),
    id: 'user-dfa-out',
    name: 'DFA with outputs',
    system: false,
    basedOn: 'dfa',
    modes: { ...sys('dfa').modes, stateOutput: { mode: 'edit' } },
    addedRequired: ['trigger', 'accepting', 'stateOutput'],
};

function editRoles(p: SimProfile): RoleId[] {
    return ROLE_IDS.filter(r => p.modes[r].mode === 'edit');
}

describe('encodeProfile / decodeProfile', () => {
    it('writes a system profile as its id, and reads it back', () => {
        expect(encodeProfile(sys('dfa'))).toBe('dfa');
        expect(decodeProfile('dfa')).toEqual(sys('dfa'));
        for (const id of ['petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'nfa', 'moore', 'mealy']) {
            expect(decodeProfile(encodeProfile(sys(id)))).toEqual(sys(id));
        }
    });

    it('writes a user profile as JSON, and reads it back equal', () => {
        const encoded = encodeProfile(USER);
        expect(encoded.startsWith('{')).toBe(true);
        expect(decodeProfile(encoded)).toEqual(USER);
    });

    it('round-trips a user profile without basedOn', () => {
        const { basedOn: _b, ...bare } = USER;
        expect(decodeProfile(encodeProfile(bare))).toEqual(bare);
    });

    it('returns null on an empty string, broken JSON and an unknown id', () => {
        expect(decodeProfile('')).toBeNull();
        expect(decodeProfile('{')).toBeNull();
        expect(decodeProfile('statechart')).toBeNull();
        expect(decodeProfile('DFA')).toBeNull();
    });

    it('returns null on a JSON with a missing mode', () => {
        const json = JSON.parse(encodeProfile(USER));
        delete json.modes.guard;
        expect(decodeProfile(JSON.stringify(json))).toBeNull();
    });

    it('returns null on malformed parts, without throwing', () => {
        const base = JSON.parse(encodeProfile(USER));
        const broken: Array<[string, (j: any) => void]> = [
            ['system true', j => { j.system = true; }],
            ['unknown shape', j => { j.shape = 'statechart'; }],
            ['unknown mode', j => { j.modes.guard = { mode: 'maybe' }; }],
            ['off without reason', j => { j.modes.guard = { mode: 'off' }; }],
            ['derived without note', j => { j.modes.bound = { mode: 'derived', value: 1 }; }],
            ['derived from a stranger', j => { j.modes.event = { mode: 'derived', from: 'simEvent', note: 'x' }; }],
            ['bound zero', j => { j.params.bound = 0; }],
            ['random selector', j => { j.params.selector = 'random'; }],
            ['unknown constraint', j => { j.constraints = ['fair']; }],
            ['unknown added role', j => { j.addedRequired = ['event', 'simEvent']; }],
            ['unknown basedOn', j => { j.basedOn = 'statechart'; }],
            ['name not a string', j => { j.name = 7; }],
            ['modes an array', j => { j.modes = []; }],
        ];
        for (const [label, mutate] of broken) {
            const j = structuredClone(base);
            mutate(j);
            expect(decodeProfile(JSON.stringify(j)), label).toBeNull();
        }
        for (const raw of ['null', '[]', '"dfa"', '42', 'true']) expect(decodeProfile(raw), raw).toBeNull();
        for (const raw of [undefined, null, 42, {}, ['dfa']]) expect(decodeProfile(raw), String(raw)).toBeNull();
    });

    it('keeps a decoded profile that decodes but does not validate: validity is validateProfile', () => {
        const j = JSON.parse(encodeProfile(USER));
        j.modes.nextState = { mode: 'off', reason: 'dropped' };
        const p = decodeProfile(JSON.stringify(j));
        expect(p).not.toBeNull();
        expect(validateProfile(p as SimProfile).map(d => d.code)).toEqual(['closureRoleOff']);
    });

    it('drops the fields a profile does not have', () => {
        const j = JSON.parse(encodeProfile(USER));
        j.extra = 'x';
        j.modes.simEvent = { mode: 'edit' };
        expect(decodeProfile(JSON.stringify(j))).toEqual(USER);
    });
});

describe('inferCustomProfile', () => {
    it('an empty bag: control flow, the closure in edit, the rest off «Not bound»', () => {
        const { profile, ignoredKeys } = inferCustomProfile({});
        expect(profile).toMatchObject({ id: 'custom', name: 'Custom', system: false, shape: 'controlFlow', constraints: [], addedRequired: [] });
        expect(profile.basedOn).toBeUndefined();
        expect(profile.params).toEqual({ bound: 1, selector: 'list' });
        expect(editRoles(profile).sort()).toEqual(['initial', 'nextState', 'node', 'ownedTransitions', 'source', 'transition']);
        expect(profile.modes.bound).toMatchObject({ mode: 'derived', value: 1 });
        expect(profile.modes.initialMarking).toEqual({ mode: 'derived', from: 'initial', note: '1 on Initial' });
        expect(profile.modes.guard).toEqual({ mode: 'off', reason: 'Not bound' });
        expect(profile.modes.event).toEqual({ mode: 'off', reason: 'Not bound' });
        expect(ignoredKeys).toEqual([]);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('a control-flow bag: every set key in edit, event derived from trigger', () => {
        const bag = {
            simNode: 'c_s', simTransition: 'c_t', simNextState: 'f_n', simSource: 'f_s', simInitial: 'c_i',
            simGuard: 'f_g', simTrigger: 'f_tr', simEventIdentifier: 'f_id', simTerminal: 'c_f', simFork: 'c_fk',
            simAccepting: 'c_acc', simEvent: 'c_ev', simProfile: 'garbage',
        };
        const { profile, ignoredKeys } = inferCustomProfile(bag);
        expect(profile.shape).toBe('controlFlow');
        expect(editRoles(profile).sort()).toEqual([
            'accepting', 'eventIdentifier', 'fork', 'guard', 'initial', 'nextState', 'node', 'ownedTransitions', 'source', 'terminal', 'transition', 'trigger',
        ]);
        expect(profile.modes.event).toMatchObject({ mode: 'derived', from: 'trigger' });
        expect(profile.modes.bound).toMatchObject({ mode: 'derived', value: 1 });
        expect(profile.modes.initialMarking).toEqual({ mode: 'derived', from: 'initial', note: '1 on Initial' });
        expect(profile.params.bound).toBe(1);
        expect(ignoredKeys).toEqual([]);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('a control-flow bag of the naturals genre: Bound and Initial marking in edit, k from the bag, complete without simInitial', () => {
        const bag = { simNode: 'c_s', simTransition: 'c_t', simNextState: 'f_n', simSource: 'f_s', simInitialMarking: 'f_m0', simBound: '3' };
        const { profile, ignoredKeys } = inferCustomProfile(bag);
        expect(profile.shape).toBe('controlFlow');
        expect(profile.modes.bound).toEqual({ mode: 'edit' });
        expect(profile.modes.initialMarking).toEqual({ mode: 'edit' });
        expect(profile.modes.initial).toEqual({ mode: 'edit' });
        expect(profile.params.bound).toBe(3);
        expect(ignoredKeys).toEqual([]);
        expect(validateProfile(profile)).toEqual([]);
        expect(checkability(profile, bag)).toEqual({ status: 'checkable', missing: [] });
    });

    it('a Petri bag: shape from simArc, bound in edit with its k', () => {
        const bag = {
            simNode: 'c_p', simTransition: 'c_t', simArc: 'c_a', simArcSource: 'f_as', simArcTarget: 'f_at',
            simInitialMarking: 'f_m0', simArcWeight: 'f_w', simBound: '3', simTerminal: 'c_end',
        };
        const { profile, ignoredKeys } = inferCustomProfile(bag);
        expect(profile.shape).toBe('petri');
        expect(editRoles(profile).sort()).toEqual([
            'arc', 'arcSource', 'arcTarget', 'arcWeight', 'bound', 'initialMarking', 'node', 'terminal', 'transition',
        ]);
        expect(profile.params.bound).toBe(3);
        expect(profile.modes.initial.mode).toBe('off');
        expect(profile.modes.nextState).toEqual({ mode: 'off', reason: 'Not bound' });
        expect(ignoredKeys).toEqual([]);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('a Petri bag without simBound: bound off, k 1', () => {
        const { profile } = inferCustomProfile({ simArc: 'c_a' });
        expect(profile.shape).toBe('petri');
        expect(profile.modes.bound).toEqual({ mode: 'off', reason: 'Not bound' });
        expect(profile.params.bound).toBe(1);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('a bag with keys of both groups: Petri wins by simArc, the control-flow keys are ignored', () => {
        const bag = {
            simNode: 'c_p', simTransition: 'c_t', simArc: 'c_a', simArcSource: 'f_as', simArcTarget: 'f_at', simInitialMarking: 'f_m0',
            simNextState: 'f_n', simOwnedTransitions: 'f_o', simJoin: 'c_j',
        };
        const { profile, ignoredKeys } = inferCustomProfile(bag);
        expect(profile.shape).toBe('petri');
        for (const r of ['nextState', 'ownedTransitions', 'join'] as RoleId[]) expect(profile.modes[r].mode, r).toBe('off');
        expect(ignoredKeys).toEqual(['simOwnedTransitions', 'simNextState', 'simJoin']);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('a control-flow bag with Petri keys but no simArc: the Petri keys are ignored', () => {
        const { profile, ignoredKeys } = inferCustomProfile({ simNode: 'c', simArcWeight: 'f_w', simInhibitorArc: 'c_i' });
        expect(profile.shape).toBe('controlFlow');
        expect(profile.modes.arcWeight.mode).toBe('off');
        expect(profile.modes.inhibitorArc.mode).toBe('off');
        expect(ignoredKeys).toEqual(['simArcWeight', 'simInhibitorArc']);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('ignores the keys the shape does not read, and a role left without its dependency; reads Bound and Initial marking in control flow', () => {
        const cf = inferCustomProfile({ simNode: 'c', simBound: '2', simInitialMarking: 'f_m0', simEventIdentifier: 'f_id' });
        expect(cf.profile.modes.bound).toEqual({ mode: 'edit' });
        expect(cf.profile.modes.initialMarking).toEqual({ mode: 'edit' });
        expect(cf.profile.modes.eventIdentifier.mode).toBe('off');
        expect(cf.profile.params.bound).toBe(2);
        expect(cf.ignoredKeys).toEqual(['simEventIdentifier']);
        expect(validateProfile(cf.profile)).toEqual([]);

        const petri = inferCustomProfile({ simArc: 'c_a', simInitial: 'c_i' });
        expect(petri.profile.modes.initial.mode).toBe('off');
        expect(petri.ignoredKeys).toEqual(['simInitial']);
        expect(validateProfile(petri.profile)).toEqual([]);
    });

    it('treats an empty string as unset', () => {
        const { profile, ignoredKeys } = inferCustomProfile({ simArc: '', simGuard: '', simArcWeight: '' });
        expect(profile.shape).toBe('controlFlow');
        expect(profile.modes.guard.mode).toBe('off');
        expect(ignoredKeys).toEqual([]);
    });
});

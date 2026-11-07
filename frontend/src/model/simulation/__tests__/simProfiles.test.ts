/**
 * simProfiles — the simulation profiles (P-2026-09-25-1805, R-SIM-47..49,
 * R-SIM-54): the eight system profiles, the computed required set with the
 * either-items of the control-flow source (R-SIM-10) and initial tokens
 * (R-SIM-56, P-2026-09-25-1840), the defects of a profile and the checkability
 * verdict on a role bag. The dcn shape and «Dynamic classification»
 * (P-2026-11-07-0941, R-DCN-8) at the end, with the eight profiles pinned on
 * the base of that lane.
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { ROLE_IDS, roleDescriptor } from '../roleCatalog';
import type { RoleId } from '../roleCatalog';
import {
    DCN_OFF, OTHER_SHAPE_GROUP, SYSTEM_PROFILES, SYSTEM_PROFILE_IDS, checkability, closureRoles, requiredRoles, systemProfile,
    validateProfile,
} from '../simProfiles';
import type { ProfileShape, RequiredItem, RoleMode, SimProfile, SystemProfileId } from '../simProfiles';
import { decodeProfile, encodeProfile, inferCustomProfile } from '../profileCodec';

const EITHER_SOURCE: RequiredItem = { anyOf: ['source', 'ownedTransitions'] };
const EITHER_INITIAL: RequiredItem = { anyOf: ['initial', 'initialMarking'] };
const CF_CLOSURE: RequiredItem[] = ['node', 'transition', 'nextState', EITHER_INITIAL, EITHER_SOURCE];
const PETRI_CLOSURE: RequiredItem[] = ['node', 'transition', 'arc', 'arcSource', 'arcTarget', 'initialMarking'];
const CF_CLOSURE_ROLES: RoleId[] = ['node', 'transition', 'nextState', 'initial', 'initialMarking', 'source', 'ownedTransitions'];
const PETRI_GROUP: RoleId[] = ['arc', 'arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc'];
const DCN_CLOSURE: RequiredItem[] = ['staticClass', 'viewpoints', 'dynamicClasses', 'invariant'];
const DCN_GROUP: RoleId[] = [
    'staticClass', 'viewpoints', 'dynamicClasses', 'invariant', 'operation', 'precondition', 'body',
    'redefines', 'monitor', 'overlapping', 'complete',
];

/** The prompt's table: roles active beyond the closure, added requirements, constraints. */
const TABLE: Record<SystemProfileId, {
    name: string; shape: ProfileShape; active: RoleId[]; added: RoleId[]; constraints: string[];
}> = {
    petri: { name: 'Petri net (P/T)', shape: 'petri', active: ['arcWeight', 'inhibitorArc', 'bound', 'terminal', 'guard'], added: [], constraints: [] },
    flowchart: { name: 'Flowchart / Activity', shape: 'controlFlow', active: ['guard', 'terminal', 'activityFinal', 'fork', 'join', 'action', 'entry', 'stateAttributes'], added: [], constraints: [] },
    stateMachine: { name: 'State machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'guard', 'terminal'], added: [], constraints: ['singleToken'] },
    extendedStateMachine: { name: 'Extended state machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'guard', 'terminal', 'action', 'entry', 'exit', 'stateAttributes'], added: [], constraints: ['singleToken'] },
    dfa: { name: 'DFA', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'accepting'], added: ['trigger', 'accepting'], constraints: ['singleToken', 'noEpsilon', 'deterministic'] },
    nfa: { name: 'NFA', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'accepting'], added: ['trigger', 'accepting'], constraints: ['singleToken'] },
    moore: { name: 'Moore machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'stateOutput'], added: ['trigger', 'stateOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'] },
    mealy: { name: 'Mealy machine', shape: 'controlFlow', active: ['trigger', 'eventIdentifier', 'transitionOutput'], added: ['trigger', 'transitionOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'] },
    dynamicClassification: { name: 'Dynamic classification', shape: 'dcn', active: DCN_GROUP, added: [], constraints: [] },
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
    it('are the eight of R-SIM-54 and Dynamic classification (R-DCN-8), in order, with their names', () => {
        expect(SYSTEM_PROFILES.map(p => p.id)).toEqual([...SYSTEM_PROFILE_IDS]);
        expect(SYSTEM_PROFILE_IDS).toEqual(['petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'dfa', 'nfa', 'moore', 'mealy', 'dynamicClassification']);
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
                : row.shape === 'dcn' ? DCN_CLOSURE as RoleId[] : CF_CLOSURE_ROLES.filter(r => r !== 'initialMarking');
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

    it('Petri net keeps Guard in edit (R-SIM-54 amended 2026-09-27, killed by dropping guard from the Petri row)', () => {
        expect(sys('petri').modes.guard).toEqual({ mode: 'edit' });
    });

    it('turn off the rest with the reasons of the prompt', () => {
        for (const p of SYSTEM_PROFILES) {
            for (const r of ROLE_IDS) {
                const m = p.modes[r];
                if (m.mode !== 'off') continue;
                if (p.shape === 'controlFlow' && PETRI_GROUP.includes(r)) expect(m.reason, `${p.id}.${r}`).toBe('Compiled from control flow');
                else if (p.shape !== 'dcn' && DCN_GROUP.includes(r)) expect(m, `${p.id}.${r}`).toEqual(DCN_OFF);
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
        ['dynamicClassification', DCN_CLOSURE],
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
            ['derivedFromOff', 'event', 'trigger'],
            ['dependencyOff', 'eventIdentifier', 'trigger'],
        ]);
    });

    it('a derived role with neither value nor from', () => {
        const defects = validateProfile(userCopy('flowchart', { bound: { mode: 'derived', note: 'k' } }));
        expect(defects.map(d => [d.code, ...d.roles])).toEqual([['derivedWithoutSource', 'bound']]);
    });

    it('a derived role whose source is off (Initial off, Initial marking derived from Initial)', () => {
        const defects = validateProfile(userCopy('flowchart', { initial: OFF }));
        const fromOff = defects.filter(d => d.code === 'derivedFromOff');
        expect(fromOff.map(d => [d.code, ...d.roles])).toEqual([['derivedFromOff', 'initialMarking', 'initial']]);
        expect(fromOff[0].message).toBe('Initial marking is derived from Initial, which is off');
        expect(defects.some(d => d.code === 'derivedWithoutSource')).toBe(false);
    });

    it('a derived role whose source is active raises no derivedFromOff', () => {
        const p = userCopy('flowchart', { initial: EDIT });
        expect(p.modes.initialMarking).toEqual({ mode: 'derived', from: 'initial', note: '1 on Initial' });
        expect(validateProfile(p).some(d => d.code === 'derivedFromOff')).toBe(false);
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

// ---------------------------------------------------------------------------
// The dcn shape and «Dynamic classification» (P-2026-11-07-0941, R-DCN-8)
// ---------------------------------------------------------------------------

/**
 * The eight existing profiles on the base of P-2026-11-07-0941 (b02f337d7), field
 * for field: sha256 of the JSON of id, name, system, shape, the mode of every
 * role of the base catalog in its order, params, constraints, added
 * requirements and the required set, first 16 hex digits. Taken by running the
 * same canonical form on the base.
 */
const BASE_ROLES: readonly RoleId[] = ROLE_IDS.slice(0, 28);
const BASE_HASH: Record<string, string> = {
    petri: 'f2f5fa11353d327f', flowchart: 'e9e5eabbe3aaa695', stateMachine: 'adc140b4e9f2065b', extendedStateMachine: 'b410169318474c62',
    dfa: '1e7aee7f24acb9ac', nfa: '44919305b762cdad', moore: 'a2534555726aec02', mealy: 'f8bd6e5d97ba986f',
};

function baseHash(p: SimProfile): string {
    const modes = BASE_ROLES.map(r => [r, p.modes[r]]);
    const json = JSON.stringify({
        id: p.id, name: p.name, system: p.system, shape: p.shape, modes, params: p.params,
        constraints: p.constraints, addedRequired: p.addedRequired, required: requiredRoles(p),
    });
    return crypto.createHash('sha256').update(json).digest('hex').slice(0, 16);
}

/** The DCN metamodel of dcn-drone-fixture.ts (spec §3), one id per feature, named `Class.feature`. */
const DRONE_BAG = {
    simStaticClass: 'StaticClass',
    simViewpoints: 'StaticClass.viewpoints',
    simDynamicClasses: 'Viewpoint.classes',
    simInvariant: 'DynamicClass.invariant',
    simOperation: 'DynamicClass.operations',
    simPrecondition: 'Operation.pre',
    simBody: 'Operation.body',
    simRedefines: 'Operation.redefines',
    simMonitor: 'DynamicClass.monitors',
    simOverlapping: 'Viewpoint.isOverlapping',
    simComplete: 'Viewpoint.isComplete',
};

describe('the eight existing profiles are unchanged by the dcn group', () => {
    it('the base catalog is the first 28 ids (control: the slice the hashes read)', () => {
        expect(BASE_ROLES).toHaveLength(28);
        expect(BASE_ROLES[27]).toBe('transitionOutput');
        expect(ROLE_IDS[28]).toBe('staticClass');
    });

    it('resolve field for field as on the base (mutant: any mode, reason, param or requirement of one of them)', () => {
        const got = Object.fromEntries(SYSTEM_PROFILES.filter(p => p.id in BASE_HASH).map(p => [p.id, baseHash(p)]));
        expect(got).toEqual(BASE_HASH);
    });

    it('turn every dcn role off with the one reason the codec reads back (mutant: a dcn role left in edit)', () => {
        for (const p of SYSTEM_PROFILES.filter(q => q.shape !== 'dcn')) {
            for (const r of DCN_GROUP) expect(p.modes[r], `${p.id}.${r}`).toEqual(DCN_OFF);
        }
        expect(DCN_OFF.mode).toBe('off');
    });

    it('a user profile stored before the dcn group decodes, and re-encodes to the stored string (mutant: the codec writes the DCN_OFF roles)', () => {
        for (const base of SYSTEM_PROFILES.filter(p => p.shape !== 'dcn')) {
            const copy: SimProfile = {
                id: 'user', name: 'Mine', system: false, basedOn: base.id as SystemProfileId, shape: base.shape,
                modes: base.modes, params: base.params, constraints: base.constraints, addedRequired: base.addedRequired,
            };
            // The string the base wrote: the 28 modes of its catalog, in order.
            const stored = JSON.stringify({ ...copy, modes: Object.fromEntries(BASE_ROLES.map(r => [r, copy.modes[r]])) });
            const decoded = decodeProfile(stored);
            expect(decoded, base.id).toEqual(copy);
            expect(encodeProfile(decoded as SimProfile), base.id).toBe(stored);
        }
    });

    it('a stored dcn profile must carry every mode; a dcn role in another shape decodes as written (mutant: DCN_OFF filled under dcn)', () => {
        const dcn = { ...sys('dynamicClassification'), id: 'user', name: 'Mine', system: false };
        const j = JSON.parse(encodeProfile(dcn));
        expect(Object.keys(j.modes)).toHaveLength(ROLE_IDS.length);
        delete j.modes.monitor;
        expect(decodeProfile(JSON.stringify(j))).toBeNull();
        // control: an edited dcn role of a control-flow copy is written and read back, not dropped
        const cf = userCopy('flowchart', { monitor: EDIT });
        expect(decodeProfile(encodeProfile(cf))?.modes.monitor).toEqual(EDIT);
    });

    it('«Custom» ignores the dcn keys of a bag, as the keys of a hidden group (mutant: a set dcn key in edit)', () => {
        const { profile, ignoredKeys } = inferCustomProfile({ ...CF_BAG, simStaticClass: 'c_s', simInvariant: 'f_inv' });
        expect(profile.shape).toBe('controlFlow');
        expect(profile.modes.staticClass).toEqual(DCN_OFF);
        expect(profile.modes.viewpoints).toEqual({ mode: 'off', reason: 'Not bound' });
        expect(ignoredKeys).toEqual(['simStaticClass', 'simInvariant']);
        expect(validateProfile(profile)).toEqual([]);
    });

    it('stay checkable on their bags with the dcn keys set, which they do not read', () => {
        expect(checkability(sys('flowchart'), { ...CF_BAG, ...DRONE_BAG })).toEqual({ status: 'checkable', missing: [] });
        expect(checkability(sys('petri'), { ...PETRI_BAG, ...DRONE_BAG })).toEqual({ status: 'checkable', missing: [] });
    });
});

describe('the dcn shape (R-DCN-8)', () => {
    it('has the closure Static class, Viewpoints, Dynamic classes, Invariant (mutant: Invariant dropped)', () => {
        expect(closureRoles('dcn')).toEqual(DCN_CLOSURE);
        expect(requiredRoles(sys('dynamicClassification'))).toEqual(DCN_CLOSURE);
    });

    it('hides the control-flow and Petri groups, and the dcn group is hidden under the other two (mutant: the dcn group visible in control flow)', () => {
        expect(OTHER_SHAPE_GROUP).toEqual({
            controlFlow: ['petri', 'dcn'],
            petri: ['controlFlow', 'dcn'],
            dcn: ['controlFlow', 'petri'],
        });
    });

    it('validateProfile reports a role of a hidden group, per shape, with the existing messages kept', () => {
        const dcnArc = validateProfile(userCopy('dynamicClassification', { arc: EDIT }));
        expect(dcnArc.map(d => [d.code, ...d.roles])).toEqual([['otherShapeActive', 'arc']]);
        expect(dcnArc[0].message).toBe('Arc belongs to the Petri net group');
        const dcnNext = validateProfile(userCopy('dynamicClassification', { nextState: EDIT }));
        expect(dcnNext.map(d => d.code)).toContain('otherShapeActive');
        expect(dcnNext[0].message).toBe('Next state belongs to the control flow group');
        for (const base of ['flowchart', 'petri'] as const) {
            const d = validateProfile(userCopy(base, { staticClass: EDIT }));
            expect(d.map(x => [x.code, ...x.roles]), base).toEqual([['otherShapeActive', 'staticClass']]);
            expect(d[0].message).toBe('Static class belongs to the dynamic classification group');
        }
        // control: the messages of the two existing shapes are as before
        expect(validateProfile(userCopy('flowchart', { arc: EDIT }))[0].message).toBe('Arc belongs to the Petri net group');
        expect(validateProfile(userCopy('petri', { nextState: EDIT }))[0].message).toBe('Next state belongs to the control flow group');
    });

    it('a dcn closure role off is a defect of the dynamic-classification shape', () => {
        const d = validateProfile(userCopy('dynamicClassification', { invariant: OFF }));
        expect(d.map(x => [x.code, ...x.roles])).toEqual([['closureRoleOff', 'invariant']]);
        expect(d[0].message).toBe('Invariant is required by the dynamic-classification shape');
        // control: the existing shapes keep their wording
        expect(validateProfile(userCopy('petri', { arc: OFF })).find(x => x.code === 'closureRoleOff')?.message).toBe('Arc is required by the Petri shape');
        expect(validateProfile(userCopy('flowchart', { nextState: OFF }))[0].message).toBe('Next state is required by the control-flow shape');
    });
});

describe('Dynamic classification (R-DCN-8): the system profile', () => {
    const p = () => sys('dynamicClassification');

    it('puts the dcn group in edit, and the general, control-flow, Petri, data and output groups off', () => {
        for (const r of ROLE_IDS) {
            const g = roleDescriptor(r).group;
            if (g === 'dcn') expect(p().modes[r], r).toEqual({ mode: 'edit' });
            else if (g !== 'events') expect(p().modes[r], r).toEqual({ mode: 'off', reason: 'Not used by Dynamic classification' });
        }
    });

    it('keeps the events group as the profiles that do not use it have it: off, since Trigger needs Transition', () => {
        for (const r of ['trigger', 'event', 'eventIdentifier'] as const) {
            expect(p().modes[r], r).toEqual({ mode: 'off', reason: 'Not used by Dynamic classification' });
        }
        expect(roleDescriptor('trigger').dependsOn).toEqual(['transition']);
    });

    it('validates, with k = 1, the list selector and no constraint', () => {
        expect(validateProfile(p())).toEqual([]);
        expect(p()).toMatchObject({ shape: 'dcn', system: true, params: { bound: 1, selector: 'list' }, constraints: [], addedRequired: [] });
    });

    it('resolves on the drone metamodel: every role bound, checkable (mutant: a closure role read from the wrong key)', () => {
        expect(checkability(p(), DRONE_BAG)).toEqual({ status: 'checkable', missing: [] });
        const { simInvariant: _i, ...noInvariant } = DRONE_BAG;
        expect(checkability(p(), noInvariant)).toEqual({ status: 'notCheckable', missing: ['invariant'] });
        expect(checkability(p(), {})).toEqual({ status: 'notCheckable', missing: DCN_CLOSURE });
        // control: a complete control-flow bag binds nothing of the dcn closure
        expect(checkability(p(), CF_BAG).missing).toEqual(DCN_CLOSURE);
    });
});

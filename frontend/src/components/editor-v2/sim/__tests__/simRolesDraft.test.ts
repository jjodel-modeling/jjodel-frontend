/**
 * simRolesDraft — the pure layer of the Simulation roles modal (S11b, S11c;
 * P-2026-09-27-1740, report docs/discovery/discovery_2026-09-27_sim_modal.md).
 *
 * Executes the module the modal reads (P11): the modal imports the joiner and
 * does not load under this bench. Each test name says which break of the rule
 * kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import {
    bagWithEdits, boundHelp, draftApply, draftPatch, draftProposals, draftStatus, isFirstOpen, matchLine, roleBadge,
    roleSections, rowValue,
} from '../simRolesDraft';
import type { DraftInput } from '../simRolesDraft';
import { profilePatch, storedProfile } from '../simRoleStatus';
import type { BoundEstimate } from '../modelMarkings';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import type { SimProfile } from '../../../../model/simulation/simProfiles';
import type { ProfileBindings, RoleBinding } from '../../../../model/simulation/profileBinder';

const SM = systemProfile('stateMachine') as SimProfile;
const ESM = systemProfile('extendedStateMachine') as SimProfile;
const FLOW = systemProfile('flowchart') as SimProfile;
const PETRI = systemProfile('petri') as SimProfile;

const bound = (value: string): RoleBinding => ({ status: 'bound', value, why: 'test' });
const none: RoleBinding = { status: 'none', why: 'test' };

/** The turnstile under State machine, as the binder gives it (simRoleStatus.test.ts). */
const TURN: ProfileBindings = {
    node: bound('C_State'), initial: bound('C_Init'), terminal: none, transition: bound('C_Trans'),
    ownedTransitions: bound('R_out'), source: none, nextState: bound('R_next'), trigger: bound('R_trigger'),
    eventIdentifier: none, guard: none,
};
const TURN_LOOKUP: Record<string, any> = {
    R_trigger: { className: 'DReference', type: 'C_Event' },
    C_Event: { className: 'DClass', isPrimitive: false, extends: [] },
    C_State: { className: 'DClass', extends: [] }, C_Init: { className: 'DClass', extends: ['C_State'] },
    C_Trans: { className: 'DClass', extends: [] }, C_Other: { className: 'DClass', extends: [] },
};
const TURN_CLASSES = ['C_State', 'C_Init', 'C_Trans', 'C_Event', 'C_Other'];

const B2NET_BINDINGS: ProfileBindings = {
    node: bound('C_Place'), initialMarking: bound('A_tokens'), terminal: none, transition: bound('C_PTrans'),
    arc: bound('C_Arc'), arcSource: bound('R_src'), arcTarget: bound('R_tgt'), arcWeight: none, inhibitorArc: none, guard: none,
};
const closed = (max: number, markings = 9): BoundEstimate => ({ largestInitial: 2, exploration: { max, end: 'closed', markings } });

const input = (over: Partial<DraftInput>): DraftInput => ({
    profile: SM, bag: {}, bindings: TURN, edits: {}, declarations: null, matchOff: false, writeProfile: true, ...over,
});

// ---------------------------------------------------------------------------
// Sections (report §5, D1, D2, D8)
// ---------------------------------------------------------------------------

describe('roleSections: Required is requiredRoles (R-SIM-48), dependencies are «Needed by» (D1)', () => {
    it('State machine: the closure in catalog order, the source pair as one item; Trigger optional and needed by Event and Event identifier (killed by a dependency counted as Required)', () => {
        const s = roleSections(SM, {});
        expect(s.required).toEqual([['node'], ['initial'], ['transition'], ['ownedTransitions', 'source'], ['nextState']]);
        expect(s.parameters).toEqual([]);
        expect(s.optional).toEqual(['terminal', 'trigger', 'eventIdentifier', 'guard']);
        expect(s.derived).toEqual(['initialMarking', 'bound', 'event']);
        expect(s.off).toEqual(['activityFinal', 'fork', 'join', 'arc', 'arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc', 'action', 'entry', 'exit']);
        expect(s.neededBy.trigger).toEqual(['event', 'eventIdentifier']);
        expect(s.neededBy.stateAttributes).toBeUndefined();
    });

    it('Petri net (P/T): the Petri closure; Bound a parameter, not Required (D2); Terminal and Guard optional (killed by Bound in Required)', () => {
        const s = roleSections(PETRI, {});
        expect(s.required).toEqual([['node'], ['initialMarking'], ['transition'], ['arc'], ['arcSource'], ['arcTarget']]);
        expect(s.parameters).toEqual(['bound']);
        expect(s.optional).toEqual(['terminal', 'arcWeight', 'inhibitorArc', 'guard']);
        expect(s.derived).toEqual([]);
        expect(s.off).toContain('initial');
        expect(s.off).toContain('nextState');
        expect(s.off).not.toContain('guard');
    });

    it('Extended state machine and Flowchart: Action, Entry need State attributes, which is no row (killed by listing stateAttributes as a role row)', () => {
        const esm = roleSections(ESM, {});
        expect(esm.optional).toEqual(['terminal', 'trigger', 'eventIdentifier', 'guard', 'action', 'entry', 'exit']);
        expect(esm.neededBy.stateAttributes).toEqual(['action', 'entry', 'exit']);
        const flow = roleSections(FLOW, {});
        expect(flow.optional).toEqual(['terminal', 'activityFinal', 'fork', 'join', 'guard', 'action', 'entry']);
        expect(flow.neededBy.stateAttributes).toEqual(['action', 'entry']);
        for (const s of [esm, flow]) {
            expect([...s.optional, ...s.derived, ...s.off, ...s.required.flat()]).not.toContain('stateAttributes');
        }
    });

    it('Accepting, State output, Transition output are hidden unless set (D8; killed by showing a feature nothing reads)', () => {
        const s = roleSections(SM, {});
        for (const r of ['accepting', 'stateOutput', 'transitionOutput'] as const) {
            expect([...s.optional, ...s.derived, ...s.off]).not.toContain(r);
        }
        // control: a set key shows, under Not used, since the preset turns it off
        expect(roleSections(SM, { simAccepting: 'C_Acc' }).off).toContain('accepting');
    });

    it('an either-item with both sides edit keeps both; with the other side derived, the edit side alone (killed by dropping the derived filter)', () => {
        const custom = storedProfile({ simInitialMarking: 'A_m' }).profile;
        expect(roleSections(custom, { simInitialMarking: 'A_m' }).required).toContainEqual(['initial', 'initialMarking']);
        expect(roleSections(SM, {}).required).toContainEqual(['initial']);
    });
});

describe('roleBadge', () => {
    it('class, ref, attr, value by the catalog kind; the declarations have none', () => {
        expect(roleBadge('node')).toBe('class');
        expect(roleBadge('event')).toBe('class');
        expect(roleBadge('ownedTransitions')).toBe('ref');
        expect(roleBadge('initialMarking')).toBe('attr');
        expect(roleBadge('guard')).toBe('attr');
        expect(roleBadge('action')).toBe('attr');
        expect(roleBadge('bound')).toBe('value');
        expect(roleBadge('stateAttributes')).toBeNull();
    });
});

describe('isFirstOpen (D10)', () => {
    it('true only with no simProfile and no catalog key set (killed by reading simProfile alone)', () => {
        expect(isFirstOpen({})).toBe(true);
        expect(isFirstOpen({ simProfile: '', simNode: '' })).toBe(true);
        expect(isFirstOpen({ simNode: 'C_State' })).toBe(false);
        expect(isFirstOpen({ simStateAttributes: '{"v":1,"attrs":[]}' })).toBe(false);
        expect(isFirstOpen({ simProfile: 'petri' })).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// The draft and Apply (D3)
// ---------------------------------------------------------------------------

describe('draftPatch: proposals on unset keys, then the user edits, then simProfile, in one write (R-SIM-78, D3)', () => {
    it('with no edit it is profilePatch: the proposals of the unset keys and simProfile', () => {
        const r = profilePatch(SM, { simNode: 'C_Other' }, TURN, TURN_LOOKUP, TURN_CLASSES);
        expect(draftPatch(input({ bag: { simNode: 'C_Other' } }))).toEqual((r as { patch: Record<string, string> }).patch);
    });

    it('never writes a proposal over a set key; an explicit edit does (killed by proposals over set keys, and by edits dropped)', () => {
        expect(draftPatch(input({ bag: { simNode: 'C_Other' } }))).not.toHaveProperty('simNode');
        expect(draftPatch(input({ bag: { simNode: 'C_Other' }, edits: { simNode: 'C_State' } }))).toMatchObject({ simNode: 'C_State' });
    });

    it('an explicit clear writes undefined, as the inline select did, and suppresses the proposal of that key (killed by proposing over a clear)', () => {
        const p = draftPatch(input({ bag: { simTrigger: 'R_trigger' }, edits: { simTrigger: null } }));
        expect(Object.keys(p)).toContain('simTrigger');
        expect(p.simTrigger).toBeUndefined();
        const fresh = draftPatch(input({ edits: { simTrigger: null } }));
        expect(fresh).not.toHaveProperty('simTrigger');
        expect(draftProposals(input({ edits: { simTrigger: null } })).map(p => p.key)).not.toContain('simTrigger');
        // control: untouched, the key is proposed
        expect(draftProposals(input({})).map(p => p.key)).toContain('simTrigger');
    });

    it('the match withdrawn: no proposal, the edits and simProfile stay (killed by ignoring matchOff)', () => {
        expect(draftPatch(input({ matchOff: true, edits: { simNode: 'C_State' } }))).toEqual({ simNode: 'C_State', simProfile: 'stateMachine' });
    });

    it('writeProfile false leaves simProfile out; the declarations go in as their string', () => {
        const decl = '{"v":1,"attrs":[]}';
        const p = draftPatch(input({ bindings: null, writeProfile: false, edits: { simNode: 'C_State' }, declarations: decl }));
        expect(p).toEqual({ simNode: 'C_State', simStateAttributes: decl });
    });

    it('a write that changes nothing is dropped, so an applied profile has nothing pending (killed by keeping no-op writes)', () => {
        const applied = { simNode: 'C_State', simInitial: 'C_Init', simTransition: 'C_Trans', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger', simProfile: 'stateMachine' };
        expect(draftPatch(input({ bag: applied }))).toEqual({});
        expect(draftPatch(input({ bag: applied, edits: { simNode: 'C_State', simSource: null } }))).toEqual({});
        // control: another preset is a write of simProfile
        expect(draftPatch(input({ bag: applied, profile: ESM }))).toEqual({ simProfile: 'extendedStateMachine' });
    });
});

describe('draftApply: the overlap check of a role write on the whole patch (R-SIM-16)', () => {
    it('refuses, writing nothing, when an edit makes the Petri roles overlap (killed by judging the stored bag)', () => {
        const lookup = { C_Place: { className: 'DClass', extends: [] } };
        const r = draftApply(input({ profile: PETRI, bindings: { node: bound('C_Place') }, edits: { simArc: 'C_Place' } }), lookup, ['C_Place']);
        expect(r).toEqual({ kind: 'refused', overlap: { classId: 'C_Place', sorts: ['node', 'arc'] } });
        const ok = draftApply(input({ profile: PETRI, bindings: { node: bound('C_Place') }, edits: { simArc: 'C_Arc' } }), lookup, ['C_Place']);
        expect(ok).toMatchObject({ kind: 'write', patch: { simNode: 'C_Place', simArc: 'C_Arc', simProfile: 'petri' }, overlap: null });
    });
});

describe('draftStatus and the rows', () => {
    it('checkability on the bag as Apply leaves it: the proposals count, a withdrawn match does not (killed by judging the stored bag)', () => {
        expect(draftStatus(input({}))).toEqual({ status: 'checkable', missing: [] });
        expect(draftStatus(input({ matchOff: true }))).toEqual({
            status: 'notCheckable', missing: ['Node', 'Transition', 'Next state', 'Initial or Initial marking', 'Source or Owned transitions'],
        });
    });

    it('rowValue: an edit, else the stored value, else the proposal', () => {
        const d = input({ bag: { simNode: 'C_Other' }, edits: { simTrigger: null, simTerminal: 'C_End' } });
        const proposals = draftProposals(d);
        expect(rowValue('simNode', d, proposals)).toEqual({ value: 'C_Other', source: 'stored' });
        expect(rowValue('simInitial', d, proposals)).toEqual({ value: 'C_Init', source: 'proposed' });
        expect(rowValue('simTerminal', d, proposals)).toEqual({ value: 'C_End', source: 'edited' });
        expect(rowValue('simTrigger', d, proposals)).toEqual({ value: '', source: 'edited' });
        expect(rowValue('simGuard', d, proposals)).toEqual({ value: '', source: 'unset' });
    });

    it('bagWithEdits drops a cleared key and keeps the rest', () => {
        expect(bagWithEdits({ simNode: 'a', simTrigger: 'b' }, { simTrigger: null, simGuard: 'g' })).toEqual({ simNode: 'a', simGuard: 'g' });
    });

    it('matchLine counts the roles the binder bound among those it judged', () => {
        expect(matchLine(TURN)).toEqual({ matched: 6, total: 10 });
        expect(matchLine(null)).toBeNull();
    });
});

describe('boundHelp: the engine reasons (R-SIM-81(1) as amended, D2)', () => {
    it('the closed exploration proposes 4 on the demo net with its reason, verbatim (killed by a paraphrase or the largest initial marking)', () => {
        const d = input({ profile: PETRI, bindings: B2NET_BINDINGS, estimate: closed(4) });
        expect(boundHelp(draftProposals(d))).toBe('Proposed 4. The most tokens a place holds over the 9 reachable markings of the models, guards aside.');
        expect(draftPatch(d)).toMatchObject({ simBound: '4' });
    });

    it('no help when the match is withdrawn or Bound is edited (killed by showing a proposal Apply would not write)', () => {
        expect(boundHelp(draftProposals(input({ profile: PETRI, bindings: B2NET_BINDINGS, estimate: closed(4), matchOff: true })))).toBeNull();
        const edited = input({ profile: PETRI, bindings: B2NET_BINDINGS, estimate: closed(4), edits: { simBound: '6' } });
        expect(boundHelp(draftProposals(edited))).toBeNull();
        expect(draftPatch(edited)).toMatchObject({ simBound: '6' });
    });
});

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
    bagWithEdits, boundHelp, compatibleIds, compatibleOptions, defectFix, draftApply, draftBag, draftPatch, draftProposals, draftStatus, isFirstOpen,
    isModified, matchLine, MULTI_TAGS_SHOWN, multiRow, multiRowLabels, pillTitle, removesTag, roleBadge, roleSections, roleSwitch, rowValue, rowVerdict,
    withAdded, withPrimary, withProfileName, withRemoved, withRoleMode,
} from '../simRolesDraft';
import type { DraftInput } from '../simRolesDraft';
import { profileBindings, profilePatch, storedProfile } from '../simRoleStatus';
import type { BoundEstimate } from '../modelMarkings';
import { systemProfile, validateProfile } from '../../../../model/simulation/simProfiles';
import { decodeProfile, encodeProfile } from '../../../../model/simulation/profileCodec';
import { ROLE_IDS } from '../../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../../model/simulation/roleCatalog';
import type { SimProfile } from '../../../../model/simulation/simProfiles';
import type { MetamodelSketch, ProfileBindings, RoleBinding } from '../../../../model/simulation/profileBinder';
import { bindingVerdicts } from '../../../../model/simulation/bindingCompat';
import type { BindingVerdicts, RoleCompatibility } from '../../../../model/simulation/bindingCompat';

const SM = systemProfile('stateMachine') as SimProfile;
const ESM = systemProfile('extendedStateMachine') as SimProfile;
const FLOW = systemProfile('flowchart') as SimProfile;
const PETRI = systemProfile('petri') as SimProfile;
const DFA = systemProfile('dfa') as SimProfile;
const NFA = systemProfile('nfa') as SimProfile;
const MOORE = systemProfile('moore') as SimProfile;
const MEALY = systemProfile('mealy') as SimProfile;

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
        expect(s.off).toEqual([
            'accepting', 'activityFinal', 'fork', 'join', 'arc', 'arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc', 'action', 'entry', 'exit',
            'stateOutput', 'transitionOutput',
        ]);
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

    it('Accepting, State output, Transition output are ordinary rows: Not used in the four demo presets, set or not (killed by keeping UNREAD_ROLES)', () => {
        for (const p of [SM, ESM, FLOW, PETRI]) {
            const s = roleSections(p, {});
            for (const r of ['accepting', 'stateOutput', 'transitionOutput'] as const) expect({ p: p.id, r, off: s.off.includes(r) }).toEqual({ p: p.id, r, off: true });
        }
        // The closed fold of the dialog, «n derived · m not used» (discovery §3.7): three more not used each.
        const fold = (p: SimProfile) => { const s = roleSections(p, {}); return [s.derived.length, s.off.length]; };
        expect([SM, ESM, FLOW, PETRI].map(fold)).toEqual([[3, 14], [3, 11], [2, 12], [0, 16]]);
        // control: a set key reads the same
        expect(roleSections(SM, { simAccepting: 'C_Acc' }).off).toEqual(roleSections(SM, {}).off);
    });

    it('DFA, NFA, Moore, Mealy: the role they read is a Required row (probe A of P-2026-09-29-0239)', () => {
        const cf: RoleId[][] = [['node'], ['initial'], ['transition'], ['ownedTransitions', 'source'], ['nextState'], ['trigger']];
        const withAccepting = [['node'], ['initial'], ['accepting'], ...cf.slice(2)];
        expect(roleSections(DFA, {}).required).toEqual(withAccepting);
        expect(roleSections(NFA, {}).required).toEqual(withAccepting);
        expect(roleSections(MOORE, {}).required).toEqual([...cf, ['stateOutput']]);
        expect(roleSections(MEALY, {}).required).toEqual([...cf, ['transitionOutput']]);
        // the other two are Not used there
        expect(roleSections(DFA, {}).off).toEqual(expect.arrayContaining(['stateOutput', 'transitionOutput']));
        expect(roleSections(MOORE, {}).off).toEqual(expect.arrayContaining(['accepting', 'transitionOutput']));
    });

    it('DFA in the dialog: the Accepting row lists the subclasses of State, and the one picked turns «Missing: Accepting.» into checkable (probe C)', () => {
        const C = (id: string, supers: string[] = []) => ({ id, name: id, abstract: false, supers });
        const R = (owner: string, name: string, type: string, composition = false) => ({ id: `${owner}.${name}`, name, owner, type, composition, aggregation: false });
        const sketch: MetamodelSketch = {
            classes: [C('State'), C('Initial', ['State']), C('Good', ['State']), C('Transition'), C('Symbol')],
            attributes: [],
            references: [R('State', 'transitions', 'Transition', true), R('Transition', 'nextState', 'State'), R('Transition', 'event', 'Symbol')],
        };
        const base = input({ profile: DFA, bindings: profileBindings(DFA, sketch, {}) });
        expect(draftStatus(base, sketch)).toEqual({ status: 'notCheckable', missing: ['Accepting'] });
        const compat = bindingVerdicts(DFA, draftBag(base), sketch).accepting;
        expect(compatibleOptions(compat, '').map(o => [o.id, o.verdict])).toEqual([['State', 'warn'], ['Initial', 'ok'], ['Good', 'ok']]);
        const picked = input({ ...base, edits: { simAccepting: 'Good' } });
        expect(draftStatus(picked, sketch)).toEqual({ status: 'checkable', missing: [] });
        expect(draftPatch(picked)).toMatchObject({ simAccepting: 'Good', simProfile: 'dfa' });
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

describe('pillTitle: the pill says why its verdict is what it is (ticket of P-2026-09-28-0140)', () => {
    const judged = (verdict: 'ok' | 'warn' | 'incompatible', why: string): RoleCompatibility => ({ candidates: [], current: { id: 'X', verdict, why } });

    it('nothing missing and every bound value ok, or no sketch: every required role is bound', () => {
        expect(pillTitle({ status: 'checkable', missing: [] }, null)).toBe('Every required role is bound.');
        expect(pillTitle({ status: 'checkable', missing: [] }, { node: judged('ok', '') })).toBe('Every required role is bound.');
    });

    it('an incompatible binding is named with its why (killed by the old title, «Every required role is bound.»)', () => {
        const verdicts: BindingVerdicts = { node: judged('ok', ''), initial: judged('incompatible', 'Transition is not a kind of State') };
        expect(pillTitle({ status: 'notCheckable', missing: [] }, verdicts)).toBe('Incompatible: Initial (Transition is not a kind of State).');
    });

    it('the warnings follow the incompatible ones, whatever the order of the roles (killed by one list in role order)', () => {
        const verdicts: BindingVerdicts = {
            node: judged('warn', 'every State would be Accepting'),
            initial: judged('incompatible', 'Transition is not a kind of State'),
            terminal: judged('incompatible', 'Event is not a kind of State'),
        };
        expect(pillTitle({ status: 'notCheckable', missing: [] }, verdicts)).toBe(
            'Incompatible: Initial (Transition is not a kind of State); Terminal (Event is not a kind of State). Warning: Node (every State would be Accepting).',
        );
        expect(pillTitle({ status: 'warnings', missing: [] }, { node: judged('warn', 'w') })).toBe('Warning: Node (w).');
    });

    it('a role with no bound value is not judged: its candidates say nothing (killed by reading the candidates)', () => {
        const verdicts: BindingVerdicts = { initial: { candidates: [{ id: 'C', verdict: 'incompatible', why: 'no' }], current: null } };
        expect(pillTitle({ status: 'checkable', missing: [] }, verdicts)).toBe('Every required role is bound.');
    });

    it('what is missing comes first, then the verdicts (killed by dropping either)', () => {
        expect(pillTitle({ status: 'notCheckable', missing: ['Node', 'Initial or Initial marking'] }, null)).toBe('Missing: Node, Initial or Initial marking.');
        expect(pillTitle({ status: 'notCheckable', missing: ['Node'] }, { initial: judged('incompatible', 'i') })).toBe('Missing: Node. Incompatible: Initial (i).');
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

// ---------------------------------------------------------------------------
// User profiles and compatible selects (S11c, S10)
// ---------------------------------------------------------------------------

describe('roleSwitch: the dialog offers only switches the validator accepts (R-SIM-47, R-SIM-48)', () => {
    it('State machine: Terminal and Guard off, Fork on; Trigger (needed), Initial (required), Bound (derived), Arc (other shape) none (killed by offering a switch into a defect)', () => {
        expect(roleSwitch(SM, 'terminal')).toBe('off');
        expect(roleSwitch(SM, 'guard')).toBe('off');
        expect(roleSwitch(SM, 'fork')).toBe('on');
        for (const r of ['trigger', 'initial', 'bound', 'arc', 'event', 'initialMarking'] as const) expect(roleSwitch(SM, r)).toBeNull();
        // Accepting and the outputs are read by the engine (R-SIM-91, R-SIM-92): switchable on (killed by keeping UNREAD_ROLES)
        for (const r of ['accepting', 'stateOutput', 'transitionOutput'] as const) expect(roleSwitch(SM, r)).toBe('on');
        // control: where the preset requires it, no switch
        expect(roleSwitch(DFA, 'accepting')).toBeNull();
        // Every offered switch leaves a profile the validator accepts, but for the name.
        for (const r of ROLE_IDS) {
            const s = roleSwitch(SM, r);
            if (s === null) continue;
            const codes = validateProfile(withProfileName(withRoleMode(SM, r, s === 'on'), 'Mine')).map(d => d.code);
            expect({ r, codes }).toEqual({ r, codes: [] });
        }
    });

    it('Petri: Data can be turned on (the engine runs it on nets, report §3.5); Initial and the control-flow group cannot', () => {
        for (const r of ['action', 'entry', 'exit', 'stateAttributes'] as const) expect(roleSwitch(PETRI, r)).toBe('on');
        for (const r of ['initial', 'ownedTransitions', 'nextState', 'bound'] as const) expect(roleSwitch(PETRI, r)).toBeNull();
    });

    it('on brings what the role depends on: Action brings State attributes, Trigger brings Event from Trigger (killed by turning the role alone on)', () => {
        const withAction = withRoleMode(SM, 'action', true);
        expect(withAction.modes.stateAttributes).toEqual({ mode: 'edit' });
        const petriEvents = withRoleMode(PETRI, 'trigger', true);
        expect(petriEvents.modes.event).toEqual({ mode: 'derived', from: 'trigger', note: 'Declared type of Trigger' });
        expect(validateProfile(withProfileName(petriEvents, 'Mine'))).toEqual([]);
    });

    it('a role needed by an active role, or the source of an active derived role, cannot be turned off', () => {
        expect(roleSwitch(ESM, 'stateAttributes')).toBeNull();
        expect(roleSwitch(withRoleMode(SM, 'eventIdentifier', false), 'trigger')).toBeNull();
        // The source rule alone (killed by dropping it): Terminal, switchable on State machine, is the source of a derived Bound here.
        const fromTerminal = { ...SM, modes: { ...SM.modes, bound: { mode: 'derived' as const, from: 'terminal' as const, note: 'test' } } };
        expect(roleSwitch(SM, 'terminal')).toBe('off');
        expect(roleSwitch(fromTerminal, 'terminal')).toBeNull();
    });
});

describe('user profiles: a changed mode is a user copy, «modified» until named (R-SIM-47, R-SIM-55)', () => {
    it('turning Fork on copies State machine: based on it, no name, the one defect blankName; named, it validates and round-trips (killed by editing the system profile in place)', () => {
        const copy = withRoleMode(SM, 'fork', true);
        expect(copy).toMatchObject({ id: 'user', name: '', system: false, basedOn: 'stateMachine' });
        expect(copy.modes.fork).toEqual({ mode: 'edit' });
        expect(SM.modes.fork.mode).toBe('off');
        expect(isModified(copy)).toBe(true);
        expect(validateProfile(copy).map(d => d.code)).toEqual(['blankName']);
        const named = withProfileName(copy, 'Turnstile with fork');
        expect(validateProfile(named)).toEqual([]);
        expect(decodeProfile(encodeProfile(named))).toEqual(named);
        expect(draftPatch(input({ profile: named, bindings: null }))).toEqual({ simProfile: encodeProfile(named) });
    });

    it('a name alone is a named copy, not modified; a system name is the validator\'s systemName (killed by isModified on the name)', () => {
        const saved = withProfileName(SM, 'Mine');
        expect(isModified(saved)).toBe(false);
        expect(validateProfile(withProfileName(SM, 'state machine')).map(d => d.code)).toEqual(['systemName']);
    });

    it('«Custom» turned into a profile gets the user id and no name', () => {
        const custom = storedProfile({}).profile;
        expect(withRoleMode(custom, 'fork', true)).toMatchObject({ id: 'user', name: '', system: false });
        expect(withRoleMode(custom, 'fork', true).basedOn).toBeUndefined();
    });

    it('4e: Initial off in a saved profile, the fix turns it on and clears derivedFromOff (killed by fixing the derived side)', () => {
        const broken = withProfileName({ ...SM, modes: { ...SM.modes, initial: { mode: 'off', reason: 'x' } } }, 'Mine');
        const defect = validateProfile(broken).find(d => d.code === 'derivedFromOff');
        expect(defect?.message).toBe('Initial marking is derived from Initial, which is off');
        const fix = defectFix(broken, defect!);
        expect(fix).toEqual({ role: 'initial', on: true });
        expect(validateProfile(withRoleMode(broken, fix!.role, fix!.on))).toEqual([]);
    });
});

describe('compatibleOptions (S10 over S11a)', () => {
    const compat = {
        candidates: [
            { id: 'a', verdict: 'ok' as const, why: '' }, { id: 'b', verdict: 'warn' as const, why: 'w' }, { id: 'c', verdict: 'incompatible' as const, why: 'i' },
        ],
        current: null,
    };
    it('leaves the incompatible out, keeps the warnings, and always lists the bound value (killed by dropping the bound value)', () => {
        expect(compatibleOptions(compat, '').map(o => o.id)).toEqual(['a', 'b']);
        expect(compatibleOptions(compat, 'c').map(o => o.id)).toEqual(['a', 'b', 'c']);
        expect(compatibleOptions({ ...compat, current: { id: 'z', verdict: 'incompatible', why: 'gone' } }, 'z').map(o => o.id)).toEqual(['z', 'a', 'b']);
        expect(compatibleOptions(undefined, 'x')).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// R-SIM-90: a multi row, the primary select and the other attributes as tags
// ---------------------------------------------------------------------------

describe('R-SIM-90: the multi row of Guard, Action, Entry and Exit (P-2026-09-29-0010)', () => {
    const compat = (verdicts: Record<string, 'ok' | 'warn' | 'incompatible'>): RoleCompatibility => ({
        candidates: Object.entries(verdicts).map(([id, verdict]) => ({ id, verdict, why: verdict === 'ok' ? '' : `${id} is wrong` })),
        current: null,
    });

    it('the primary is the first attribute, the tags the others; the stored plain id is a row without tags', () => {
        expect(multiRow('A', ['A', 'B'])).toMatchObject({ primary: 'A', others: [] });
        expect(multiRow('["A","B","C"]', ['A', 'B', 'C'])).toMatchObject({ primary: 'A', others: ['B', 'C'] });
        expect(multiRow('', ['A', 'B'])).toMatchObject({ primary: '', others: [] });
    });

    it('the «+» exists only with two or more candidates not incompatible; its options leave out the chosen ones (mutants: «+» with one candidate; a chosen one offered again)', () => {
        const ids = compatibleIds(compat({ A: 'ok', B: 'warn', C: 'incompatible' }));
        expect(ids).toEqual(['A', 'B']);
        expect(multiRow('A', ids)).toMatchObject({ plus: true, addable: ['B'], plusShown: true });
        // one compatible candidate, or none: no «+», the row reads as today (the four demo scenes)
        expect(multiRow('A', compatibleIds(compat({ A: 'ok', C: 'incompatible' })))).toMatchObject({ plus: false });
        expect(multiRow('', [])).toMatchObject({ plus: false });
        // every candidate chosen: the slot stays, the select is hidden
        expect(multiRow('["A","B"]', ids)).toMatchObject({ plus: true, addable: [], plusShown: false });
    });

    it('the «+» keeps its slot but is hidden while the primary is empty (no layout shift)', () => {
        expect(multiRow('', ['A', 'B'])).toMatchObject({ plus: true, plusShown: false, addable: ['A', 'B'] });
    });

    it('at most MULTI_TAGS_SHOWN tags show, the rest are counted: the row never grows', () => {
        expect(MULTI_TAGS_SHOWN).toBe(1);
        const row = multiRow('["A","B","C","D"]', ['A', 'B', 'C', 'D']);
        expect([row.shown, row.more]).toEqual([['B'], ['C', 'D']]);
        expect(multiRow('["A","B"]', ['A', 'B'])).toMatchObject({ shown: ['B'], more: [] });
    });

    it('editing the list: set the primary, clear it and promote the first tag, add, remove (mutants: clearing drops the tags; a repeated add)', () => {
        expect(withPrimary('', 'A')).toBe('A');
        expect(withPrimary('A', 'B')).toBe('B');
        expect(withPrimary('["A","B","C"]', 'D')).toBe('["D","B","C"]');
        // a tag chosen as the primary moves there, no duplicate
        expect(withPrimary('["A","B","C"]', 'C')).toBe('["C","B"]');
        // cleared: the first tag becomes the primary
        expect(withPrimary('["A","B","C"]', '')).toBe('["B","C"]');
        expect(withPrimary('["A","B"]', '')).toBe('B');
        expect(withPrimary('A', '')).toBe('');
        expect(withAdded('A', 'B')).toBe('["A","B"]');
        expect(withAdded('["A","B"]', 'B')).toBe('["A","B"]');
        expect(withRemoved('["A","B","C"]', 'B')).toBe('["A","C"]');
        expect(withRemoved('["A","B"]', 'B')).toBe('A');
    });

    it('Apply writes the plain id for one attribute, JSON for two or more, nothing for none, in one patch (mutant: a single element encoded as JSON)', () => {
        const edit = (value: string) => (value === '' ? null : value);
        const two = draftPatch(input({ profile: ESM, bag: { simGuard: 'A_g' }, edits: { simGuard: edit(withAdded('A_g', 'A_h')) } }));
        expect(two.simGuard).toBe('["A_g","A_h"]');
        const back = draftPatch(input({ profile: ESM, bag: { simGuard: '["A_g","A_h"]' }, edits: { simGuard: edit(withRemoved('["A_g","A_h"]', 'A_h')) } }));
        expect(back.simGuard).toBe('A_g');
        const cleared = draftPatch(input({ profile: ESM, bag: { simGuard: 'A_g' }, edits: { simGuard: edit(withPrimary('A_g', '')) } }));
        expect('simGuard' in cleared && cleared.simGuard === undefined).toBe(true);
        // control: a list edited back to the stored one writes nothing for the key
        expect(draftPatch(input({ profile: ESM, bag: { simGuard: '["A_g","A_h"]' }, edits: { simGuard: edit(withAdded('A_g', 'A_h')) } }))).not.toHaveProperty('simGuard');
    });

    it('the accessible names: the strip, each remove button, the «+» select', () => {
        const names = multiRowLabels('Guard');
        expect(names.strip).toBe('Other Guard attributes');
        expect(names.add).toBe('Add another Guard attribute');
        expect(names.remove('Transition.cond')).toBe('Remove Transition.cond from Guard');
        expect(names.more(['Transition.cond', 'Transition.when'])).toBe('Also: Transition.cond, Transition.when');
    });

    it('the keyboard: Delete and Backspace on a focused remove button remove the tag; Escape and the rest do not (Enter and Space click the button)', () => {
        expect(removesTag('Delete')).toBe(true);
        expect(removesTag('Backspace')).toBe(true);
        for (const key of ['Escape', 'Tab', 'Enter', ' ', 'ArrowLeft', 'a']) expect(removesTag(key), key).toBe(false);
    });

    it('the verdict slot: one attribute as before; several, the worst with each attribute that is not ok named in the title (mutant: the first attribute\'s verdict)', () => {
        const nameOf = (id: string) => `N.${id}`;
        const one: RoleCompatibility = { ...compat({ A: 'ok', W: 'warn' }), current: { id: 'W', verdict: 'warn', why: 'W is wrong' }, currents: [{ id: 'W', verdict: 'warn', why: 'W is wrong' }] };
        expect(rowVerdict(one, 'W', nameOf)).toEqual({ verdict: 'warn', why: 'W is wrong' });
        expect(rowVerdict(one, 'A', nameOf)).toBeNull();
        const many: RoleCompatibility = {
            ...compat({ A: 'ok', W: 'warn', X: 'incompatible' }),
            current: { id: 'X', verdict: 'incompatible', why: 'X is wrong' },
            currents: [{ id: 'A', verdict: 'ok', why: '' }, { id: 'W', verdict: 'warn', why: 'W is wrong' }, { id: 'X', verdict: 'incompatible', why: 'X is wrong' }],
        };
        expect(rowVerdict(many, '["A","W","X"]', nameOf)).toEqual({ verdict: 'incompatible', why: 'N.W: W is wrong; N.X: X is wrong' });
        const fine: RoleCompatibility = { ...many, current: { id: 'A', verdict: 'ok', why: '' }, currents: [{ id: 'A', verdict: 'ok', why: '' }, { id: 'B', verdict: 'ok', why: '' }] };
        expect(rowVerdict(fine, '["A","B"]', nameOf)).toBeNull();
        // no sketch, no verdict
        expect(rowVerdict(undefined, 'A', nameOf)).toBeNull();
    });
});

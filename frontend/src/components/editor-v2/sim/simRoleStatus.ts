/**
 * simRoleStatus — the simulation roles, and what the role bag is missing.
 *
 * Pure: no React, no store, no import from the joiner, so these rules run under
 * the node test bench (sim/__tests__/simRoleStatus.test.ts). The role specs,
 * the engine keys and the role types moved here unchanged from
 * SimulationPanel.tsx, which imports them (P-2026-09-24-1005).
 */

import { STATE_ATTRIBUTES_KEY, stateAttributeRows } from '../../../model/simulation/stateAttributesCodec';
import { ROLE_CATALOG, roleDescriptor, roleValues } from '../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../model/simulation/roleCatalog';
import { checkability } from '../../../model/simulation/simProfiles';
import type { Checkability, CheckabilityStatus, RequiredItem, SimProfile, SystemProfileId } from '../../../model/simulation/simProfiles';
import { decodeProfile, encodeProfile, inferCustomProfile } from '../../../model/simulation/profileCodec';
import { bindProfile } from '../../../model/simulation/profileBinder';
import type { MetamodelSketch, ProfileBindings } from '../../../model/simulation/profileBinder';
import { bindingVerdicts, currentVerdicts } from '../../../model/simulation/bindingCompat';
import { overlapVerdict } from '../../../model/simulation/stcFromRoles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import { withDerivedEventRole } from '../../../model/simulation/netCompile';
import type { BoundEstimate } from './modelMarkings';

// ---------------------------------------------------------------------------
// Roles — flat keys in the M2 bag (R-SIM-2). No nested `sim: {...}` object: the
// bag copy is shallow, a nested mutation would escape actions/undo/re-render.
// ---------------------------------------------------------------------------

export type RoleKey =
    | 'simNode'
    | 'simInitial'
    | 'simInitialMarking'
    | 'simTerminal'
    | 'simActivityFinal'
    | 'simBound'
    | 'simTransition'
    | 'simGuard'
    | 'simAction'
    | 'simEntry'
    | 'simExit'
    | 'simOwnedTransitions'
    | 'simSource'
    | 'simNextState'
    | 'simFork'
    | 'simJoin'
    | 'simArc'
    | 'simArcSource'
    | 'simArcTarget'
    | 'simArcWeight'
    | 'simInhibitorArc'
    | 'simEvent'
    | 'simTrigger'
    | 'simEventIdentifier';

/**
 * `number`: a value, not a pointer; written as a digit string (`simBound`, R-SIM-37).
 * `expression` and `action`: an attribute typed `Expression` or `Action`, or
 * EString, the lists of the Data group (R-SIM-44, R-SIM-71).
 */
export type RoleKind = 'class' | 'composition' | 'reference' | 'attribute' | 'number' | 'expression' | 'action';

export interface RoleSpec {
    key: RoleKey;
    label: string;
    kind: RoleKind;
    placeholder: string;
}

export const ROLE_SPECS: RoleSpec[] = [
    { key: 'simNode', label: 'Node', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simInitial', label: 'Initial', kind: 'class', placeholder: 'Select a metaclass' },
    // The keys of the Petri core (R-SIM-32, definitive with step 3b, R-SIM-37), and simSource (R-SIM-10).
    { key: 'simInitialMarking', label: 'Initial marking', kind: 'attribute', placeholder: 'Select an attribute' },
    { key: 'simTerminal', label: 'Terminal', kind: 'class', placeholder: 'Select a metaclass' },
    // R-SIM-53, which the engine reads from lane E1 on: a row, so a key left by a Flowchart Apply is seen and cleared (G6).
    { key: 'simActivityFinal', label: 'Activity final', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simBound', label: 'Bound', kind: 'number', placeholder: '1' },
    { key: 'simTransition', label: 'Transition', kind: 'class', placeholder: 'Select a metaclass' },
    // The Data group (R-SIM-52, R-SIM-69): the guard, and the `Action [0..*]` features by site role.
    { key: 'simGuard', label: 'Guard', kind: 'expression', placeholder: 'Select an attribute' },
    { key: 'simAction', label: 'Action', kind: 'action', placeholder: 'Select an attribute' },
    { key: 'simEntry', label: 'Entry', kind: 'action', placeholder: 'Select an attribute' },
    { key: 'simExit', label: 'Exit', kind: 'action', placeholder: 'Select an attribute' },
    { key: 'simOwnedTransitions', label: 'Owned transitions', kind: 'composition', placeholder: 'Select a composition' },
    { key: 'simSource', label: 'Source', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simNextState', label: 'Next state', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simFork', label: 'Fork', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simJoin', label: 'Join', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simArc', label: 'Arc', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simArcSource', label: 'Arc source', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simArcTarget', label: 'Arc target', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simArcWeight', label: 'Arc weight', kind: 'attribute', placeholder: 'Select an attribute' },
    { key: 'simInhibitorArc', label: 'Inhibitor arc', kind: 'class', placeholder: 'Select a metaclass' },
    // The event role (step 1, R-SIM-16), configured by Trigger alone (R-SIM-38):
    // simEvent is the Trigger's declared type, derived at every read of the bag
    // (withDerivedEventRole, netCompile.ts) and never written. It stays here so
    // mapStateToProps copies the derived value into the roles; the panel does not
    // show it (ROLE_GROUPS). The identifier only labels the buttons, default `name`.
    { key: 'simEvent', label: 'Event', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTrigger', label: 'Trigger', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simEventIdentifier', label: 'Event identifier', kind: 'attribute', placeholder: 'name (default)' },
];

/**
 * The keys whose presence decides whether the Petri core can run
 * (`netStcFromRoles`, model/simulation/netCompile.ts), `simBound` aside: that
 * one is a value, checked by `invalidEngineRoles`. Terminal is not among them:
 * the role is optional (R-SIM-28), and without it the run ends in Deadlock or
 * never. Which of these a bag needs depends on its shape, Petri exactly when
 * `simArc` is set (R-SIM-31):
 *
 * - control flow: Next state, one of Owned transitions and Source, one of
 *   Initial and Initial marking;
 * - Petri: Node, Transition, Arc source, Arc target, Initial marking.
 */
export const ENGINE_ROLE_KEYS: RoleKey[] = [
    'simNextState', 'simOwnedTransitions', 'simSource', 'simInitial', 'simInitialMarking',
    'simNode', 'simTransition', 'simArc', 'simArcSource', 'simArcTarget',
];

export type Roles = Partial<Record<RoleKey, string>>;

/**
 * The declarations of the Data group (R-SIM-67): not a role of ROLE_SPECS but a
 * JSON string of its own, read by the panel as its own prop and never folded
 * into the role signature (report risk 1).
 */
export const STATE_ATTRIBUTES_SPEC = { key: STATE_ATTRIBUTES_KEY, label: 'State attributes' } as const;

// ---------------------------------------------------------------------------
// What is missing
// ---------------------------------------------------------------------------

function labelOf(key: RoleKey): string {
    return ROLE_SPECS.find(spec => spec.key === key)?.label ?? key;
}

/**
 * What the bag lacks for its shape, in ROLE_SPECS order; a pair either of which
 * will do is one entry, "Owned transitions or Source". An empty string counts as
 * unset. Together with `invalidEngineRoles` empty exactly when `netStcFromRoles`
 * builds an STC (the parity of simRoleStatus.test.ts): the run controls show
 * only then.
 */
export function missingEngineRoles(roles: Roles): string[] {
    if (roles.simArc) {
        const petri: RoleKey[] = ['simNode', 'simInitialMarking', 'simTransition', 'simArcSource', 'simArcTarget'];
        return ROLE_SPECS.filter(spec => petri.includes(spec.key) && !roles[spec.key]).map(spec => spec.label);
    }
    const missing: string[] = [];
    if (!roles.simInitial && !roles.simInitialMarking) missing.push(`${labelOf('simInitial')} or ${labelOf('simInitialMarking')}`);
    if (!roles.simOwnedTransitions && !roles.simSource) missing.push(`${labelOf('simOwnedTransitions')} or ${labelOf('simSource')}`);
    if (!roles.simNextState) missing.push(labelOf('simNextState'));
    return missing;
}

/**
 * The keys set to a value the engine refuses: today `simBound`, which must be a
 * whole number >= 1 written in digits (the rule of `readBound` in netCompile.ts).
 */
export function invalidEngineRoles(roles: Roles): string[] {
    const bound = roles.simBound;
    if (!bound) return [];
    const ok = /^\s*\d+\s*$/.test(bound) && Number(bound) >= 1;
    return ok ? [] : [`${labelOf('simBound')} (a whole number ≥ 1)`];
}

/** Where the missing roles are to be set: the metamodel by name, or a generic fallback. */
function onMetamodel(metamodelName: string): string {
    return ` on ${metamodelName || 'the metamodel'}`;
}

/** The model face's message, in place of the run controls, when an engine role is missing or invalid. */
export function incompleteConfigurationMessage(metamodelName: string, missing: readonly string[]): string {
    return `Simulation not configured. Missing${onMetamodel(metamodelName)}: ${missing.join(', ')}.`;
}

/**
 * The warning line of a half-set event role. The model face names the
 * metamodel; the metamodel face (`metamodelName` null) is the metamodel itself.
 */
export function eventRoleWarning(missing: readonly string[], metamodelName: string | null): string {
    const where = metamodelName === null ? '' : onMetamodel(metamodelName);
    return `Events disabled. Missing${where}: ${missing.join(', ')}.`;
}

/**
 * The warning line of a stored `simEvent` the run ignores (S7, R-SIM-38): the
 * event class is always the Trigger's declared type, derived on every read, so
 * a `simEvent` left over from before that rule is never used. `null` when there
 * is nothing to warn about: no stored value, no derived class (no Trigger
 * bound), or the two already agree. `nameOf` resolves a class pointer the way
 * the panel already does (name, falling back to the id).
 */
export function staleEventWarning(stored: string | undefined, derived: string | undefined, nameOf: (id: string) => string): string | null {
    if (!stored || !derived || stored === derived) return null;
    return `Stored event class ${nameOf(stored)} is ignored: the run uses ${nameOf(derived)}, the Trigger's type.`;
}

// ---------------------------------------------------------------------------
// The profile row of the M2 face (R-SIM-77..79)
// ---------------------------------------------------------------------------

/**
 * The presets the panel lists, in the order of the memo table (R-SIM-79, A2).
 * DFA, NFA, Moore and Mealy stay hidden until R-SIM-50 and R-SIM-51 are in the
 * engine: nothing reads Accepting or the outputs yet.
 */
export const PANEL_PROFILE_IDS: readonly SystemProfileId[] = ['petri', 'flowchart', 'stateMachine', 'extendedStateMachine'];

/** The `simProfile` key of the bag (R-SIM-55). */
export const PROFILE_KEY = 'simProfile';

export interface StoredProfile {
    readonly profile: SimProfile;
    /** No readable `simProfile`: «Custom», rebuilt from the role keys. */
    readonly custom: boolean;
    /** False when `simProfile` is present but does not decode (D6). */
    readonly readable: boolean;
}

/**
 * The profile a bag names. `simProfile` absent or empty → «Custom» from the
 * bag; present but not decodable → «Custom» too, with `readable` false for
 * the warning line (D6). Never throws.
 */
export function storedProfile(bag: Readonly<Record<string, unknown>>): StoredProfile {
    const raw = bag[PROFILE_KEY];
    if (raw === undefined || raw === null || raw === '') return { profile: inferCustomProfile(bag).profile, custom: true, readable: true };
    const profile = decodeProfile(raw);
    return profile
        ? { profile, custom: false, readable: true }
        : { profile: inferCustomProfile(bag).profile, custom: true, readable: false };
}

/**
 * The bindings a profile proposes from: the binder over the metamodel sketch,
 * for every profile but «Custom», which nothing is bound against (D7 of the
 * profiles lane). A user profile is bound as its preset (S11c). The panel and
 * the dialog read this one rule (P-2026-09-28-0140). `bag`, when given, is the
 * values already set, so a kept Node or Transition carries into the roles that
 * depend on it (S6), not the binder's own guess.
 */
export function profileBindings(
    profile: SimProfile, sketch: MetamodelSketch | null | undefined, bag?: Readonly<Record<string, unknown>>,
): ProfileBindings | null {
    return profile.id !== CUSTOM_ID && sketch ? bindProfile(profile, sketch, bag) : null;
}

/** The id `inferCustomProfile` gives «Custom» (profileCodec.ts). */
const CUSTOM_ID = 'custom';

/**
 * The verdict of a bag as Apply leaves it: `checkability` with the S11a
 * verdicts of its bound values (R-SIM-48; bindingCompat.ts), so a warning
 * reads «with warnings» and an incompatible value «Not checkable». Without a
 * sketch, no verdicts: the reading before S11a. The panel's badge and the
 * dialog's pill read this one function (P-2026-09-28-0140).
 */
export function profileVerdict(
    profile: SimProfile, after: Readonly<Record<string, unknown>>, sketch: MetamodelSketch | null | undefined,
): Checkability {
    return checkability(profile, after, sketch ? currentVerdicts(bindingVerdicts(profile, after, sketch)) : undefined);
}

/** The words of a verdict, the badge's and the pill's. */
export const VERDICT_LABEL = {
    checkable: 'Checkable',
    warnings: 'Checkable with warnings',
    notCheckable: 'Not checkable',
} as const satisfies Readonly<Record<CheckabilityStatus, string>>;

export interface ProfileProposal {
    readonly role: RoleId; readonly key: string; readonly label: string; readonly value: string;
    /** Why, for a proposal that is not the binder's: the Bound (R-SIM-81). */
    readonly why?: string;
}
export interface ProfileChoice { readonly role: RoleId; readonly key: string; readonly label: string; readonly values: readonly string[] }
export interface ProfileKept { readonly role: RoleId; readonly key: string; readonly label: string; readonly value: string; readonly proposed: string }

export interface ProfileSummary {
    readonly name: string;
    /**
     * `profileVerdict` on the bag as Apply leaves it: with a sketch, the S11a
     * verdicts count, the dialog's pill (P-2026-09-28-0140; D5's «never with
     * warnings» held until the compatibility check existed).
     */
    readonly status: CheckabilityStatus;
    /** The required items still missing, as labels; an either-item reads «A or B». */
    readonly missing: readonly string[];
    /** What Apply writes: the bound values of the unset keys of `edit` roles, in catalog order. */
    readonly proposals: readonly ProfileProposal[];
    /** Unset roles with several candidates: named, never picked (R-SIM-77, D3). */
    readonly choices: readonly ProfileChoice[];
    /** Set keys Apply keeps although the binder proposes another value (R-SIM-55). */
    readonly kept: readonly ProfileKept[];
    /** The labels of the roles whose key is set and whose mode is `off` (D8). */
    readonly setButOff: readonly string[];
    /** Apply has something to write: a proposal, or a `simProfile` other than the stored one. */
    readonly pending: boolean;
    /**
     * Action, Entry or Exit is bound as Apply leaves the bag and no state
     * attribute is declared: the first firing would halt (R-SIM-81, G9).
     */
    readonly declareHint?: boolean;
}

/** A role value: a non-empty string, the filter of stcFromRoles.ts. */
function isSetKey(bag: Readonly<Record<string, unknown>>, key: string): boolean {
    const value = bag[key];
    return typeof value === 'string' && value !== '';
}

function itemLabel(item: RequiredItem): string {
    return typeof item === 'string' ? roleDescriptor(item).label : item.anyOf.map(r => roleDescriptor(r).label).join(' or ');
}

/** The reason of the Bound proposal, in its title (R-SIM-81). */
const BOUND_WHY = 'The largest initial marking on the models of this metamodel';

/**
 * The Bound a measure proposes, and why (R-SIM-81(1) as amended by Alfonso on
 * 2026-09-27, G12(b)): the most tokens over the reachable markings when their
 * exploration closed, the largest initial marking otherwise, with a reason that
 * says which. A number is the largest initial marking alone, the reading before
 * the amendment. `null` when there is no value.
 */
function boundValue(measure: number | BoundEstimate | null | undefined): { value: number; why: string } | null {
    if (typeof measure === 'number') return { value: measure, why: BOUND_WHY };
    if (!measure) return null;
    const e = measure.exploration;
    if (e?.end === 'closed') {
        return { value: e.max, why: `The most tokens a place holds over the ${e.markings} reachable markings of the models, guards aside` };
    }
    if (measure.largestInitial === null) return null;
    const why = e === null ? 'the roles after Apply make no net to explore'
        : e.end === 'unbounded' ? 'a reachable marking covers an earlier one with more tokens, so no bound was found'
            : `more than ${e.markings} reachable markings, not all explored`;
    return { value: measure.largestInitial, why: `${BOUND_WHY}: ${why}` };
}

/**
 * The writes of Apply for the role keys: bound, `edit`, unset. Never `undefined`, never over a set key.
 * Bound is a value, not a binding: the measure of the models, when above 1 (R-SIM-81(1) as amended, `boundValue`).
 */
function proposalsOf(
    profile: SimProfile, bag: Readonly<Record<string, unknown>>, bindings: ProfileBindings, largestMarking?: number | BoundEstimate | null,
): ProfileProposal[] {
    const out: ProfileProposal[] = [];
    for (const d of ROLE_CATALOG) {
        if (d.key === null || profile.modes[d.id].mode !== 'edit' || isSetKey(bag, d.key)) continue;
        if (d.id === 'bound') {
            const bound = boundValue(largestMarking);
            if (bound && bound.value > 1) {
                out.push({ role: d.id, key: d.key, label: d.label, value: String(bound.value), why: bound.why });
            }
            continue;
        }
        const b = bindings[d.id];
        if (b?.status === 'bound') out.push({ role: d.id, key: d.key, label: d.label, value: b.value });
    }
    return out;
}

/**
 * What the Bound proposal measures on the models (R-SIM-81, G2): the Place
 * class and the Initial marking attribute as Apply leaves them, the bag's value
 * first, the binder's otherwise. `null` when Bound is not `edit`, is already
 * set, or either input is unknown: then the models are not read.
 */
export function boundProposalInputs(
    profile: SimProfile, bag: Readonly<Record<string, unknown>>, bindings: ProfileBindings,
): { node: string; initialMarking: string } | null {
    if (profile.modes.bound.mode !== 'edit' || isSetKey(bag, 'simBound')) return null;
    const valueOf = (role: RoleId, key: string): string | undefined => {
        if (isSetKey(bag, key)) return bag[key] as string;
        const b = bindings[role];
        return b?.status === 'bound' ? b.value : undefined;
    };
    const node = valueOf('node', 'simNode');
    const initialMarking = valueOf('initialMarking', 'simInitialMarking');
    return node && initialMarking ? { node, initialMarking } : null;
}

/**
 * The bag the Bound exploration compiles (G12(b), `boundEstimate` in
 * modelMarkings.ts): the bag as Apply leaves it, the binder's proposals
 * written over the unset keys, the Bound aside. `null` exactly when
 * `boundProposalInputs` is: nothing to measure.
 */
export function boundProposalBag(
    profile: SimProfile, bag: Readonly<Record<string, unknown>>, bindings: ProfileBindings,
): Record<string, unknown> | null {
    if (!boundProposalInputs(profile, bag, bindings)) return null;
    const after: Record<string, unknown> = { ...bag };
    for (const p of proposalsOf(profile, bag, bindings)) after[p.key] = p.value;
    return after;
}

/** The keys whose actions write state attributes (R-SIM-69). */
const ACTION_KEYS: readonly RoleKey[] = ['simAction', 'simEntry', 'simExit'];

/**
 * The summary line of the profile row. `bindings` null for «Custom», which
 * nothing is bound against. The verdict is taken on the bag as Apply would
 * leave it, so a preview reads «Checkable» only when Apply gets there.
 * `largestMarking` is the source of the Bound proposal (R-SIM-81): the panel
 * passes `boundEstimate` over `boundProposalBag` (modelMarkings.ts, G12(b)); a
 * number is `largestInitialMarking` alone, the reading before the amendment.
 * `sketch`, when given, lets the S11a verdicts into the status (`profileVerdict`).
 */
export function profileSummary(
    profile: SimProfile,
    bag: Readonly<Record<string, unknown>>,
    bindings: ProfileBindings | null,
    largestMarking?: number | BoundEstimate | null,
    sketch?: MetamodelSketch | null,
): ProfileSummary {
    const proposals = bindings ? proposalsOf(profile, bag, bindings, largestMarking) : [];
    const after: Record<string, unknown> = { ...bag };
    for (const p of proposals) after[p.key] = p.value;
    const verdict = profileVerdict(profile, after, sketch);
    // Unreadable (D6) shows nothing, not the hint for an empty declaration (S8).
    const stateRows = stateAttributeRows(isSetKey(after, STATE_ATTRIBUTES_KEY) ? after[STATE_ATTRIBUTES_KEY] as string : undefined);
    const choices: ProfileChoice[] = [];
    const kept: ProfileKept[] = [];
    const setButOff: string[] = [];
    for (const d of ROLE_CATALOG) {
        if (d.key === null) continue;
        const mode = profile.modes[d.id].mode;
        if (mode === 'off') {
            if (isSetKey(bag, d.key)) setButOff.push(d.label);
            continue;
        }
        const b = bindings?.[d.id];
        if (mode !== 'edit' || !b) continue;
        if (b.status === 'candidates' && !isSetKey(bag, d.key)) choices.push({ role: d.id, key: d.key, label: d.label, values: b.values });
        if (b.status === 'bound' && isSetKey(bag, d.key)) {
            // R-SIM-90: a list is kept unless it is the binder's one attribute.
            const stored = keptValues(d.id, bag[d.key] as string);
            if (!(stored.length === 1 && stored[0] === b.value)) {
                kept.push({ role: d.id, key: d.key, label: d.label, value: bag[d.key] as string, proposed: b.value });
            }
        }
    }
    return {
        name: profile.name,
        status: verdict.status,
        missing: verdict.missing.map(itemLabel),
        proposals,
        choices,
        kept,
        setButOff,
        pending: bindings !== null && (proposals.length > 0 || bag[PROFILE_KEY] !== encodeProfile(profile)),
        declareHint: ACTION_KEYS.some(k => isSetKey(after, k)) && stateRows.readable && stateRows.rows.length === 0,
    };
}

/** The elements of a kept value: every attribute of a `multi` role (R-SIM-90), else the value itself. */
function keptValues(role: RoleId, value: string): string[] {
    return roleDescriptor(role).multi ? roleValues(value) : [value];
}

export interface ProfileSummaryText {
    /** «State machine · Checkable», «… after Apply» while something is pending. */
    readonly status: string;
    readonly badge: 'Checkable' | 'Checkable with warnings' | 'Not checkable';
    readonly missing: string | null;
    /** «Not checkable: choose …» (R-SIM-77): the roles left to the user, with their candidates. */
    readonly choose: string | null;
    /** One «Label → Value» per proposal. */
    readonly proposals: readonly string[];
    readonly kept: string | null;
    /** The information line of D8. */
    readonly setButOff: string | null;
    /** The declarations hint (R-SIM-81, G9), followed in the panel by its «Add attribute» button. */
    readonly declare?: string | null;
}

/** The text of the summary; `nameOf` names a class or feature by id. */
export function profileSummaryText(summary: ProfileSummary, nameOf: (id: string) => string): ProfileSummaryText {
    const badge = VERDICT_LABEL[summary.status];
    return {
        status: `${summary.name} · ${badge}${summary.pending ? ' after Apply' : ''}`,
        badge,
        missing: summary.missing.length > 0 ? `Missing: ${summary.missing.join(', ')}.` : null,
        choose: summary.choices.length > 0
            ? `Choose ${summary.choices.map(c => `${c.label}: ${c.values.length} candidates (${c.values.map(nameOf).join(', ')})`).join('; ')}.`
            : null,
        // A parameter (Bound) is a number, not an element to name.
        proposals: summary.proposals.map(p => `${p.label} → ${roleDescriptor(p.role).kind === 'int' ? p.value : nameOf(p.value)}`),
        kept: summary.kept.length > 0 ? `Kept: ${summary.kept.map(k => `${k.label} (${keptValues(k.role, k.value).map(nameOf).join(', ')})`).join(', ')}.` : null,
        setButOff: summary.setButOff.length > 0 ? `Set but off: ${summary.setButOff.join(', ')}.` : null,
        declare: summary.declareHint ? 'Declare the state attributes the actions write:' : null,
    };
}

export type ProfileApply =
    | { readonly kind: 'write'; readonly patch: Readonly<Record<string, string>>; readonly overlap: RoleOverlap | null }
    | { readonly kind: 'refused'; readonly overlap: RoleOverlap };

/**
 * Apply as one `state` assignment (R-SIM-78, D2): the bound values of the
 * unset keys of `edit` roles, plus `simProfile`, judged first by the overlap
 * check of a role write (R-SIM-16) on the bag as it will stand, the event class
 * derived. A refusal writes nothing; an overlap that does not refuse is
 * written, with the overlap for the warning line, as a role write is.
 * `largestMarking` is the summary's, so Apply writes the Bound it listed (R-SIM-81).
 */
export function profilePatch(
    profile: SimProfile,
    bag: Readonly<Record<string, unknown>>,
    bindings: ProfileBindings,
    lookup: Record<string, any>,
    classIds: readonly string[],
    largestMarking?: number | BoundEstimate | null,
): ProfileApply {
    const patch: Record<string, string> = {};
    for (const p of proposalsOf(profile, bag, bindings, largestMarking)) patch[p.key] = p.value;
    patch[PROFILE_KEY] = encodeProfile(profile);
    const verdict = overlapVerdict(lookup, withDerivedEventRole({ ...bag, ...patch }, lookup), classIds);
    if (verdict?.refuse) return { kind: 'refused', overlap: verdict.overlap };
    return { kind: 'write', patch, overlap: verdict?.overlap ?? null };
}

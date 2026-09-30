/**
 * notations — the notations «Derive viewpoint» offers and the binding its dialog edits (slice D,
 * P-2026-09-30-0255, docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md §3, R-VP-21).
 *
 * - **The list**: Generic (variant C, R-VP-19, R-VP-20), State machine, Petri net and Flowchart. The
 *   last three are the role-keyed renderings of R-VP-15..18, unchanged, and apply only when picked:
 *   the stored simulation binding no longer picks them (amends R-VP-15 (5) and R-VP-17). ER and UML
 *   come with their own slices.
 * - **The table**: a metaclass → role map over the class roles the notation's system profile edits
 *   and the derivation draws. Its prefill is the binder's (`bindProfile`), with the metamodel's stored
 *   simulation binding as bag, inverted per class; when the metamodel already has a derived viewpoint
 *   of that notation, the latest one's `_state` (regeneration before 2026-10-07: always a new
 *   viewpoint, never an update in place).
 * - **Read, never written**: the simulation binding. The dialog's binding is stored with the derived
 *   viewpoint only, in flat `_state` keys (`derivedViewpointState`), and every document it creates
 *   carries its provenance, `ir.generated` (irTypes.ts `GeneratedProvenance`).
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the node bench
 * (derive/__tests__/notations.test.ts). It reads the raw lookup and writes nothing into it.
 */

import { ROLE_CATALOG, roleDescriptor } from '../../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../../model/simulation/roleCatalog';
import { isSystemProfileId, systemProfile } from '../../../../model/simulation/simProfiles';
import type { SimProfile, SystemProfileId } from '../../../../model/simulation/simProfiles';
import { bindProfile } from '../../../../model/simulation/profileBinder';
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { storedProfile } from '../../sim/simRoleStatus';
import { structuralHash } from '../ir/irDefaults';
import type { GeneratedProvenance } from '../ir/irTypes';
import { DERIVATION_CLASS_ROLES, deriveViewpointForBinding, rolesFromTable } from './viewpointDerivation';
import type { AnyDerivedView, DerivationRoles } from './viewpointDerivation';

type Lookup = Record<string, any>;

export type DerivedNotationId = 'generic' | 'stateMachine' | 'petri' | 'flowchart';

export interface DerivedNotation {
    readonly id: DerivedNotationId;
    readonly label: string;
    /** The system profile whose binder prefills the table and whose shape the derivation reads; null: no roles. */
    readonly profile: SystemProfileId | null;
    /** How the table names the Node role. */
    readonly nodeLabel: string;
}

/** The notations of the dialog's select, in its order; Generic is the default. */
export const DERIVED_NOTATIONS: readonly DerivedNotation[] = [
    { id: 'generic', label: 'Generic', profile: null, nodeLabel: 'Node' },
    { id: 'stateMachine', label: 'State machine', profile: 'stateMachine', nodeLabel: 'State' },
    { id: 'petri', label: 'Petri net', profile: 'petri', nodeLabel: 'Place' },
    { id: 'flowchart', label: 'Flowchart', profile: 'flowchart', nodeLabel: 'Node' },
];

/** The keys of a derived viewpoint's `_state` (R-VP-21, persisted names, R-B9). */
export const DERIVED_FROM_KEY = 'derivedFrom';
export const DERIVED_NOTATION_KEY = 'derivedNotation';
/** One key per bound class: `derivedRole_<classId>`, its role id as value. */
export const DERIVED_ROLE_PREFIX = 'derivedRole_';
/** `ir.generated.by` of every view this derivation creates. */
export const DERIVATION_ID = 'derive-2';

/** The dialog's table: class id → role. */
export type ClassRoles = Readonly<Record<string, RoleId>>;

/** What the dialog confirms. */
export interface DeriveChoice {
    readonly notation: DerivedNotationId;
    readonly classRoles: ClassRoles;
}

/**
 * A table to open on, and where it came from: the latest derived viewpoint of the same notation, the
 * binder over a stored binding, the binder over the names and the structure alone, or none (Generic).
 */
export interface DialogPrefill {
    readonly roles: ClassRoles;
    readonly from: 'derived' | 'binding' | 'signals' | 'none';
}

const notationOf = (id: unknown): DerivedNotation | undefined => DERIVED_NOTATIONS.find(n => n.id === id);
const profileOf = (id: unknown): SimProfile | undefined => {
    const p = notationOf(id)?.profile;
    return p ? systemProfile(p) : undefined;
};

/** The class roles the notation's table offers: its profile edits them and the derivation draws them. Catalog order. */
export function notationRoles(id: DerivedNotationId): RoleId[] {
    const profile = profileOf(id);
    if (!profile) return [];
    return ROLE_CATALOG
        .filter(d => d.kind === 'class' && profile.modes[d.id].mode === 'edit' && DERIVATION_CLASS_ROLES.includes(d.id))
        .map(d => d.id);
}

/** A role as the notation's table names it: Node by the notation's own word, the others as the catalog does. */
export function roleLabel(id: DerivedNotationId, role: RoleId): string {
    return role === 'node' ? (notationOf(id)?.nodeLabel ?? roleDescriptor(role).label) : roleDescriptor(role).label;
}

/** Generic always; a role notation once a class has a role (with none it would draw no notation). */
export function canDerive(choice: DeriveChoice): boolean {
    return !profileOf(choice.notation) || Object.values(choice.classRoles).some(r => !!r);
}

// ---------------------------------------------------------------------------
// The sources of the prefill
// ---------------------------------------------------------------------------

/** The metamodel's stored simulation binding, raw, when a role key holds a value (the test «Derive viewpoint» read before slice D). */
function storedBinding(lookup: Lookup, metamodelId: string): Readonly<Record<string, unknown>> | null {
    const raw = lookup[metamodelId]?._state;
    if (!raw || typeof raw !== 'object') return null;
    return ROLE_CATALOG.some(d => d.key !== null && typeof raw[d.key] === 'string' && raw[d.key] !== '') ? raw : null;
}

/** The notation each system profile draws in: the four control-flow machines are state machines. */
const PROFILE_NOTATION: Readonly<Record<SystemProfileId, DerivedNotationId>> = {
    petri: 'petri', flowchart: 'flowchart', stateMachine: 'stateMachine', extendedStateMachine: 'stateMachine',
    dfa: 'stateMachine', nfa: 'stateMachine', moore: 'stateMachine', mealy: 'stateMachine',
};

/** The notation a stored binding matches: its system profile, or the one a user profile is based on; «Custom» by shape and Trigger. */
function notationOfBinding(bag: Readonly<Record<string, unknown>>): DerivedNotationId {
    const { profile } = storedProfile(bag);
    const system = profile.system ? profile.id : profile.basedOn;
    if (system && isSystemProfileId(system)) return PROFILE_NOTATION[system];
    if (profile.shape === 'petri') return 'petri';
    // A binding with a Trigger is a state machine, one without an activity (R-VP-17).
    return typeof bag.simTrigger === 'string' && bag.simTrigger !== '' ? 'stateMachine' : 'flowchart';
}

/** The table kept to what the notation offers, on classes of the metamodel. */
function cleanTable(lookup: Lookup, metamodelId: string, notation: DerivedNotationId, entries: Iterable<[string, unknown]>): Record<string, RoleId> {
    const classes = new Set(sketchOfMetamodel(lookup, metamodelId).classes.map(c => c.id));
    const offered = new Set<string>(notationRoles(notation));
    const out: Record<string, RoleId> = {};
    for (const [id, role] of entries) if (classes.has(id) && typeof role === 'string' && offered.has(role)) out[id] = role as RoleId;
    return out;
}

/**
 * The latest derived viewpoint of the metamodel: the last of `viewpointIds` (the project's order) whose
 * `_state` names it; null when none, or when the latest names no notation of this list.
 */
function latestDerived(lookup: Lookup, metamodelId: string, viewpointIds: readonly string[]): { notation: DerivedNotationId; state: Record<string, unknown> } | null {
    for (let i = viewpointIds.length - 1; i >= 0; i--) {
        const state = lookup[viewpointIds[i]]?._state;
        if (!state || typeof state !== 'object' || state[DERIVED_FROM_KEY] !== metamodelId) continue;
        const notation = notationOf(state[DERIVED_NOTATION_KEY]);
        return notation ? { notation: notation.id, state } : null;
    }
    return null;
}

/** `bindProfile` for the notation's profile, the bag given, inverted per class: catalog order, a class keeps its first role. */
function binderRoles(lookup: Lookup, metamodelId: string, notation: DerivedNotationId, bag: Readonly<Record<string, unknown>> | undefined): ClassRoles {
    const profile = profileOf(notation);
    if (!profile) return {};
    const bindings = bindProfile(profile, sketchOfMetamodel(lookup, metamodelId), bag);
    const out: Record<string, RoleId> = {};
    for (const role of notationRoles(notation)) {
        const b = bindings[role];
        if (b?.status === 'bound' && !(b.value in out)) out[b.value] = role;
    }
    return out;
}

// ---------------------------------------------------------------------------
// What the dialog opens on
// ---------------------------------------------------------------------------

/** The notation the select opens on: the latest derived viewpoint's, else the stored binding's, else Generic. */
export function initialNotation(lookup: Lookup, metamodelId: string, viewpointIds: readonly string[]): DerivedNotationId {
    const latest = latestDerived(lookup, metamodelId, viewpointIds);
    if (latest) return latest.notation;
    const bag = storedBinding(lookup, metamodelId);
    return bag ? notationOfBinding(bag) : 'generic';
}

/** The table of `notation` as the dialog shows it on open or on a change of the select. Generic has none. */
export function dialogPrefill(lookup: Lookup, metamodelId: string, notation: DerivedNotationId, viewpointIds: readonly string[]): DialogPrefill {
    if (!profileOf(notation)) return { roles: {}, from: 'none' };
    const latest = latestDerived(lookup, metamodelId, viewpointIds);
    if (latest && latest.notation === notation) {
        const entries = Object.entries(latest.state)
            .filter(([k]) => k.startsWith(DERIVED_ROLE_PREFIX))
            .map(([k, v]): [string, unknown] => [k.slice(DERIVED_ROLE_PREFIX.length), v]);
        return { roles: cleanTable(lookup, metamodelId, notation, entries), from: 'derived' };
    }
    const bag = storedBinding(lookup, metamodelId);
    return { roles: binderRoles(lookup, metamodelId, notation, bag ?? undefined), from: bag ? 'binding' : 'signals' };
}

/** What a confirm without a change derives: the initial notation and its prefill. */
export function defaultChoice(lookup: Lookup, metamodelId: string, viewpointIds: readonly string[]): DeriveChoice {
    const notation = initialNotation(lookup, metamodelId, viewpointIds);
    return { notation, classRoles: dialogPrefill(lookup, metamodelId, notation, viewpointIds).roles };
}

// ---------------------------------------------------------------------------
// What the dialog creates
// ---------------------------------------------------------------------------

/**
 * The derivation's input for a choice: null for Generic; else the table, and a bag of the references
 * and attributes the roles read, from the binder with the table's Node and Transition as the ones the
 * other roles derive from (the binder's S6). The stored simulation binding is not read.
 */
function derivationRolesOf(lookup: Lookup, metamodelId: string, choice: DeriveChoice): DerivationRoles | null {
    const profile = profileOf(choice.notation);
    if (!profile) return null;
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const classRoles = cleanTable(lookup, metamodelId, choice.notation, Object.entries(choice.classRoles));
    const tableBag: Record<string, unknown> = {};
    for (const role of ['node', 'transition'] as const) {
        const id = sketch.classes.find(c => classRoles[c.id] === role)?.id;
        const key = roleDescriptor(role).key;
        if (id && key) tableBag[key] = id;
    }
    const bindings = bindProfile(profile, sketch, tableBag);
    const bag: Record<string, unknown> = {};
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key !== null && d.kind !== 'class' && b?.status === 'bound') bag[d.key] = b.value;
    }
    return { bag, shape: profile.shape, classRoles };
}

/** The `_state` of the derived viewpoint: where it came from, the notation, one `derivedRole_<classId>` per bound class. */
export function derivedViewpointState(lookup: Lookup, metamodelId: string, choice: DeriveChoice): Record<string, string> {
    const out: Record<string, string> = { [DERIVED_FROM_KEY]: metamodelId, [DERIVED_NOTATION_KEY]: choice.notation };
    for (const [id, role] of Object.entries(cleanTable(lookup, metamodelId, choice.notation, Object.entries(choice.classRoles)))) {
        out[`${DERIVED_ROLE_PREFIX}${id}`] = role;
    }
    return out;
}

/** The documents of a choice, in the derivation's order, each with its provenance (`ir.generated`). */
export function derivedDocuments(lookup: Lookup, metamodelId: string, choice: DeriveChoice): AnyDerivedView[] {
    const roles = derivationRolesOf(lookup, metamodelId, choice);
    const table = roles?.classRoles ? rolesFromTable(lookup, metamodelId, roles.classRoles) : null;
    return deriveViewpointForBinding(lookup, metamodelId, roles).map((v): AnyDerivedView => {
        const role = table?.get(v.classId);
        const generated: GeneratedProvenance = { by: DERIVATION_ID, notation: choice.notation, ...(role ? { role } : {}), hash: structuralHash(v.ir) };
        return { ...v, ir: { ...v.ir, generated } } as AnyDerivedView;
    });
}

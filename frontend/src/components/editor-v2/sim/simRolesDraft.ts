/**
 * simRolesDraft — the pure layer of the Simulation roles modal (S11b, S11c;
 * P-2026-09-27-1740, docs/discovery/discovery_2026-09-27_sim_modal.md).
 *
 * The modal is a draft over the M2 bag: the preset or profile picked, the rows
 * the user changed, the declarations as edited, and whether the binder's
 * proposals are kept. Apply writes it in one `state` assignment, one undo step
 * (R-SIM-78, D3): the proposals on the keys still unset, then the user's own
 * edits, then the declarations and `simProfile`. A write that changes nothing
 * is dropped, so an applied profile has nothing pending.
 *
 * The sections say what the code says and nothing more (report §5, D1): the
 * Required items are `requiredRoles` (R-SIM-48), the rule of «Checkable»; a
 * role another active role depends on is «Needed by» it, the validator's
 * `dependencyOff`, not Required. Bound is a parameter (R-SIM-49, D2). The
 * three roles nothing reads (Accepting, State output, Transition output)
 * show only when their key is set (D8).
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/simRolesDraft.test.ts).
 */

import { ROLE_CATALOG, ROLE_IDS, roleDescriptor } from '../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../model/simulation/roleCatalog';
import { checkability, requiredRoles } from '../../../model/simulation/simProfiles';
import type { BindingVerdict, RequiredItem, SimProfile } from '../../../model/simulation/simProfiles';
import { encodeProfile } from '../../../model/simulation/profileCodec';
import type { ProfileBindings } from '../../../model/simulation/profileBinder';
import { overlapVerdict } from '../../../model/simulation/stcFromRoles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import { withDerivedEventRole } from '../../../model/simulation/netCompile';
import { STATE_ATTRIBUTES_KEY } from '../../../model/simulation/stateAttributesCodec';
import { PROFILE_KEY, profileSummary } from './simRoleStatus';
import type { ProfileProposal } from './simRoleStatus';
import type { BoundEstimate } from './modelMarkings';

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/** The roles nothing reads yet (roleCatalog.ts header): shown only when their key is set (D8). */
const UNREAD_ROLES: ReadonlySet<RoleId> = new Set<RoleId>(['accepting', 'stateOutput', 'transitionOutput']);

/** A role value: a non-empty string, the filter of stcFromRoles.ts. */
function isSetValue(value: unknown): boolean {
    return typeof value === 'string' && value !== '';
}

function rolesOf(item: RequiredItem): readonly RoleId[] {
    return typeof item === 'string' ? [item] : item.anyOf;
}

const catalogIndex = (r: RoleId) => ROLE_IDS.indexOf(r);

export interface RoleSections {
    /** The items of `requiredRoles` with their `edit` sides, in catalog order; an either-item with two such sides has both. */
    readonly required: readonly (readonly RoleId[])[];
    /** Bound when it is `edit` (R-SIM-49). */
    readonly parameters: readonly RoleId[];
    readonly optional: readonly RoleId[];
    readonly derived: readonly RoleId[];
    readonly off: readonly RoleId[];
    /** The active roles that depend on a role (`dependencyOff`): it cannot be turned off while they are on. */
    readonly neededBy: Readonly<Partial<Record<RoleId, readonly RoleId[]>>>;
}

/**
 * The rows of the modal for `profile`. State attributes is the Data section,
 * never a row; its `neededBy` is still given. A role of the either-item whose
 * other side is derived from it shows alone (Initial, with Initial marking
 * derived from it); the derived side is a Derived row.
 */
export function roleSections(profile: SimProfile, bag: Readonly<Record<string, unknown>>): RoleSections {
    const mode = (r: RoleId) => profile.modes[r].mode;
    const shown = (r: RoleId) => r !== 'stateAttributes'
        && (!UNREAD_ROLES.has(r) || mode(r) !== 'off' || isSetValue(bag[roleDescriptor(r).key ?? '']));

    const placed = new Set<RoleId>();
    const required: RoleId[][] = [];
    for (const item of requiredRoles(profile)) {
        const sides = rolesOf(item).filter(r => mode(r) === 'edit' && shown(r)).sort((a, b) => catalogIndex(a) - catalogIndex(b));
        if (sides.length === 0) continue;
        required.push(sides);
        for (const r of sides) placed.add(r);
    }
    required.sort((a, b) => catalogIndex(a[0]) - catalogIndex(b[0]));

    const parameters: RoleId[] = [];
    const optional: RoleId[] = [];
    const derived: RoleId[] = [];
    const off: RoleId[] = [];
    const neededBy: Partial<Record<RoleId, RoleId[]>> = {};
    for (const d of ROLE_CATALOG) {
        const dependents = ROLE_CATALOG.filter(o => o.dependsOn.includes(d.id) && mode(o.id) !== 'off').map(o => o.id);
        if (dependents.length > 0) neededBy[d.id] = dependents;
        if (placed.has(d.id) || !shown(d.id)) continue;
        const m = mode(d.id);
        if (m === 'off') off.push(d.id);
        else if (m === 'derived' || d.key === null) derived.push(d.id);
        else if (d.kind === 'int') parameters.push(d.id);
        else optional.push(d.id);
    }
    return { required, parameters, optional, derived, off, neededBy };
}

export type RoleBadge = 'class' | 'ref' | 'attr' | 'value';

/** The kind badge of a row: what the role binds (roleCatalog.ts `kind`); `null` for the declarations. */
export function roleBadge(role: RoleId): RoleBadge | null {
    switch (roleDescriptor(role).kind) {
        case 'class':
        case 'derived':
            return 'class';
        case 'reference':
            return 'ref';
        case 'attribute':
        case 'intAttribute':
        case 'expressionAttribute':
        case 'actionListAttribute':
            return 'attr';
        case 'int':
            return 'value';
        default:
            return null;
    }
}

/** The dialog opens on the model kind picker (4a) only for a bag with no `simProfile` and no role key set (D10). */
export function isFirstOpen(bag: Readonly<Record<string, unknown>>): boolean {
    const raw = bag[PROFILE_KEY];
    if (raw !== undefined && raw !== null && raw !== '') return false;
    return !ROLE_CATALOG.some(d => d.key !== null && isSetValue(bag[d.key]));
}

// ---------------------------------------------------------------------------
// The draft
// ---------------------------------------------------------------------------

/** The rows the user changed: a key to its value, or `null` to clear it. */
export type DraftEdits = Readonly<Record<string, string | null>>;

export interface DraftInput {
    readonly profile: SimProfile;
    /** The stored bag: the catalog keys set and `simProfile`. */
    readonly bag: Readonly<Record<string, unknown>>;
    /** `null` for «Custom», which nothing is bound against (D7 of the profiles lane). */
    readonly bindings: ProfileBindings | null;
    readonly edits: DraftEdits;
    /** The declarations as the dialog holds them, encoded; `null` when not changed. */
    readonly declarations: string | null;
    /** The match line's Undo: the binder's proposals are withdrawn. */
    readonly matchOff: boolean;
    /** Whether Apply writes `simProfile`: not for a «Custom» left as it is. */
    readonly writeProfile: boolean;
    /** The source of the Bound proposal (`boundEstimate`, modelMarkings.ts). */
    readonly estimate?: number | BoundEstimate | null;
}

/** The bag with the edits: a cleared key is removed, a set one replaced. */
export function bagWithEdits(bag: Readonly<Record<string, unknown>>, edits: DraftEdits): Record<string, unknown> {
    const out: Record<string, unknown> = { ...bag };
    for (const [key, value] of Object.entries(edits)) {
        if (value === null || value === '') delete out[key];
        else out[key] = value;
    }
    return out;
}

/**
 * What Apply would propose: `profileSummary`'s proposals on the bag with the
 * edits, the keys the user touched aside (a cleared key is not proposed again).
 * None for «Custom» or with the match withdrawn.
 */
export function draftProposals(input: DraftInput): ProfileProposal[] {
    if (!input.bindings || input.matchOff) return [];
    const summary = profileSummary(input.profile, bagWithEdits(input.bag, input.edits), input.bindings, input.estimate);
    return summary.proposals.filter(p => !(p.key in input.edits));
}

/** `undefined`, `null` and `''` are the same unset value (stcFromRoles.ts, simProfiles.ts). */
function same(a: unknown, b: unknown): boolean {
    const unset = (v: unknown) => v === undefined || v === null || v === '';
    return (unset(a) && unset(b)) || a === b;
}

/**
 * The one assignment of Apply (D3): the proposals, then the edits (`null`
 * writes `undefined`, as the inline select did), then the declarations and
 * `simProfile`. Every entry that would not change the stored bag is dropped.
 */
export function draftPatch(input: DraftInput): Record<string, string | undefined> {
    const patch: Record<string, string | undefined> = {};
    for (const p of draftProposals(input)) patch[p.key] = p.value;
    for (const [key, value] of Object.entries(input.edits)) patch[key] = value === null || value === '' ? undefined : value;
    if (input.declarations !== null) patch[STATE_ATTRIBUTES_KEY] = input.declarations;
    if (input.writeProfile) patch[PROFILE_KEY] = encodeProfile(input.profile);
    for (const key of Object.keys(patch)) if (same(patch[key], input.bag[key])) delete patch[key];
    return patch;
}

/** The bag as Apply would leave it. */
export function draftBag(input: DraftInput): Record<string, unknown> {
    const out: Record<string, unknown> = { ...input.bag };
    for (const [key, value] of Object.entries(draftPatch(input))) {
        if (value === undefined) delete out[key];
        else out[key] = value;
    }
    return out;
}

export type DraftApply =
    | { readonly kind: 'write'; readonly patch: Readonly<Record<string, string | undefined>>; readonly overlap: RoleOverlap | null }
    | { readonly kind: 'refused'; readonly overlap: RoleOverlap };

/**
 * Apply judged first by the overlap check of a role write (R-SIM-16) on the
 * bag as it will stand, the event class derived: a refusal writes nothing, an
 * overlap that does not refuse is written with the overlap for the warning.
 */
export function draftApply(input: DraftInput, lookup: Record<string, any>, classIds: readonly string[]): DraftApply {
    const patch = draftPatch(input);
    const verdict = overlapVerdict(lookup, withDerivedEventRole(draftBag(input), lookup), classIds);
    if (verdict?.refuse) return { kind: 'refused', overlap: verdict.overlap };
    return { kind: 'write', patch, overlap: verdict?.overlap ?? null };
}

function itemLabel(item: RequiredItem): string {
    return rolesOf(item).map(r => roleDescriptor(r).label).join(' or ');
}

export interface DraftStatus {
    readonly status: 'checkable' | 'warnings' | 'notCheckable';
    /** The required items still unbound, as labels; an either-item reads «A or B». */
    readonly missing: readonly string[];
}

/** `checkability` on the bag as Apply would leave it, with the binding verdicts when given. */
export function draftStatus(input: DraftInput, verdicts?: Readonly<Partial<Record<RoleId, BindingVerdict>>>): DraftStatus {
    const c = checkability(input.profile, draftBag(input), verdicts);
    return { status: c.status, missing: c.missing.map(itemLabel) };
}

export interface RowValue {
    readonly value: string;
    /** `edited` in the dialog, `stored` in the bag, `proposed` by the binder, `unset`. */
    readonly source: 'edited' | 'stored' | 'proposed' | 'unset';
}

/** The value a row shows: the edit, else the stored value, else the proposal. */
export function rowValue(key: string, input: DraftInput, proposals: readonly ProfileProposal[]): RowValue {
    if (key in input.edits) return { value: input.edits[key] ?? '', source: 'edited' };
    const stored = input.bag[key];
    if (isSetValue(stored)) return { value: stored as string, source: 'stored' };
    const p = proposals.find(x => x.key === key);
    return p ? { value: p.value, source: 'proposed' } : { value: '', source: 'unset' };
}

/** The match line: how many of the roles the binder judged it bound; `null` for «Custom». */
export function matchLine(bindings: ProfileBindings | null): { matched: number; total: number } | null {
    if (!bindings) return null;
    const all = Object.values(bindings);
    return { matched: all.filter(b => b?.status === 'bound').length, total: all.length };
}

/** The Bound row's helper: the proposal and the engine's reason, verbatim (`boundValue`, simRoleStatus.ts); `null` without one. */
export function boundHelp(proposals: readonly ProfileProposal[]): string | null {
    const p = proposals.find(x => x.role === 'bound');
    return p ? `Proposed ${p.value}. ${p.why ?? ''}.` : null;
}

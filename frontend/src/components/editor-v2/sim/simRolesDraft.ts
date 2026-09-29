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
 * `dependencyOff`, not Required. Bound is a parameter (R-SIM-49, D2).
 * Accepting, State output and Transition output are rows as every other role
 * since the engine reads them (R-SIM-91, R-SIM-92; P-2026-09-29-0300): the
 * rule of D8 that showed them only when set is gone.
 *
 * User profiles (S11c, R-SIM-47): a mode changed or a name given makes a user
 * copy of the profile, «modified» until named; the switches offered are the
 * ones the validator accepts, and each of its defects that one switch clears
 * carries that switch. The selects list the candidates S11a does not judge
 * incompatible (S10), the bound value always.
 *
 * Guard, Action, Entry and Exit hold a list (R-SIM-90): the row keeps its
 * select for the first attribute and shows the others as tags, with a «+»
 * select to add one when the metamodel offers two or more compatible
 * candidates; the edit is the encoded list (`encodeRoleValues`), so Apply
 * stays one assignment and one attribute is written as the plain id.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/simRolesDraft.test.ts).
 */

import { ROLE_CATALOG, ROLE_IDS, encodeRoleValues, roleDescriptor, roleValues } from '../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../model/simulation/roleCatalog';
import {
    EVENT_FROM_TRIGGER, OTHER_SHAPE_GROUP, isSystemProfileId, requiredRoles, systemProfile,
} from '../../../model/simulation/simProfiles';
import type { BindingVerdict, ProfileDefect, RequiredItem, RoleMode, SimProfile } from '../../../model/simulation/simProfiles';
import type { RoleCompatibility } from '../../../model/simulation/bindingCompat';
import { encodeProfile } from '../../../model/simulation/profileCodec';
import type { MetamodelSketch, ProfileBindings } from '../../../model/simulation/profileBinder';
import { overlapVerdict } from '../../../model/simulation/stcFromRoles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import { withDerivedEventRole } from '../../../model/simulation/netCompile';
import { STATE_ATTRIBUTES_KEY } from '../../../model/simulation/stateAttributesCodec';
import { PROFILE_KEY, profileSummary, profileVerdict } from './simRoleStatus';
import type { ProfileProposal } from './simRoleStatus';
import type { BoundEstimate } from './modelMarkings';

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

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
    const shown = (r: RoleId) => r !== 'stateAttributes';

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

/**
 * `profileVerdict` on the bag as Apply would leave it, the S11a verdicts
 * counted when the sketch is given: the panel's badge reads the same function
 * (P-2026-09-28-0140).
 */
export function draftStatus(input: DraftInput, sketch?: MetamodelSketch | null): DraftStatus {
    const c = profileVerdict(input.profile, draftBag(input), sketch);
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

// ---------------------------------------------------------------------------
// User profiles (S11c, R-SIM-47): a mode changed makes a user copy, named by the user
// ---------------------------------------------------------------------------

/** The id of a user profile: one `simProfile` per metamodel bag, so one id does (R-SIM-55). */
export const USER_PROFILE_ID = 'user';

/** The reason of a role turned off in the dialog. */
export const TURNED_OFF = 'Turned off';

/**
 * The user copy of `profile`: a system profile becomes a copy based on it, and
 * «Custom» a profile of its own, both unnamed until the user names them
 * (R-SIM-47: a modified system profile is «modified» until saved with a name).
 * A user profile is its own copy.
 */
function userCopy(profile: SimProfile): SimProfile {
    if (!profile.system && profile.id !== CUSTOM_ID) return profile;
    return {
        id: USER_PROFILE_ID,
        name: '',
        system: false,
        ...(profile.system && isSystemProfileId(profile.id) ? { basedOn: profile.id } : {}),
        shape: profile.shape,
        modes: profile.modes,
        params: profile.params,
        constraints: profile.constraints,
        addedRequired: profile.addedRequired,
    };
}

/** The id `inferCustomProfile` gives «Custom» (profileCodec.ts). */
const CUSTOM_ID = 'custom';

/**
 * Whether the dialog offers to turn `role` on (`'on'`) or off (`'off'`), or
 * neither. On: an `off` role of the profile's shape that the engine reads (not
 * the other shape's group, not Initial in Petri, not Event, which is derived).
 * Off: an `edit` role that is no side of a
 * required item, no parameter, not needed by an active role (`dependencyOff`)
 * and not the source of an active derived role (`derivedFromOff`). The rule is
 * the validator's, so a switch the dialog offers never makes a defect.
 */
export function roleSwitch(profile: SimProfile, role: RoleId): 'on' | 'off' | null {
    const d = roleDescriptor(role);
    const mode = profile.modes[role].mode;
    if (mode === 'off') {
        if (role === 'event' || d.group === OTHER_SHAPE_GROUP[profile.shape]) return null;
        if (profile.shape === 'petri' && role === 'initial') return null;
        return 'on';
    }
    if (mode !== 'edit' || d.key === null || d.kind === 'int') return null;
    if (requiredRoles(profile).some(item => rolesOf(item).includes(role))) return null;
    const active = (r: RoleId) => profile.modes[r].mode !== 'off';
    if (ROLE_CATALOG.some(o => active(o.id) && o.dependsOn.includes(role))) return null;
    if (ROLE_IDS.some(r => { const m = profile.modes[r]; return m.mode === 'derived' && m.from === role; })) return null;
    return 'off';
}

/**
 * `profile` with `role` turned on (`edit`) or off, as a user copy. On brings
 * the roles it depends on that are off (Action brings State attributes), and
 * Trigger brings Event derived from it, as the system profiles have it
 * (simProfiles.ts `systemProfileOf`): no switch leaves a `dependencyOff`.
 */
export function withRoleMode(profile: SimProfile, role: RoleId, on: boolean): SimProfile {
    const copy = userCopy(profile);
    const modes: Record<RoleId, RoleMode> = { ...copy.modes };
    if (!on) {
        modes[role] = { mode: 'off', reason: TURNED_OFF };
        return { ...copy, modes };
    }
    const turnOn = (r: RoleId): void => {
        if (modes[r].mode !== 'off') return;
        modes[r] = r === 'event' ? EVENT_FROM_TRIGGER : { mode: 'edit' };
        for (const dep of roleDescriptor(r).dependsOn) turnOn(dep);
        if (r === 'trigger') turnOn('event');
    };
    turnOn(role);
    return { ...copy, modes };
}

/** `profile` named `name`, as a user copy («Save as…», R-SIM-47). */
export function withProfileName(profile: SimProfile, name: string): SimProfile {
    return { ...userCopy(profile), name };
}

/** A user copy whose modes differ from the system profile it is based on. */
export function isModified(profile: SimProfile): boolean {
    if (profile.system || !profile.basedOn) return false;
    const base = systemProfile(profile.basedOn);
    return !!base && ROLE_IDS.some(r => JSON.stringify(profile.modes[r]) !== JSON.stringify(base.modes[r]));
}

/** The one switch that clears a defect, when there is one: the fix the dialog offers beside it (4e). */
export function defectFix(profile: SimProfile, defect: ProfileDefect): { role: RoleId; on: boolean } | null {
    const on = (r: RoleId) => (roleSwitch(profile, r) === 'on' ? { role: r, on: true } : null);
    switch (defect.code) {
        case 'closureRoleOff':
            return defect.roles.map(on).find(x => x !== null) ?? null;
        case 'dependencyOff':
        case 'derivedFromOff':
            return on(defect.roles[1]);
        case 'otherShapeActive':
            return { role: defect.roles[0], on: false };
        default:
            return null;
    }
}

/** A select option judged by S11a: the incompatible ones are left out, but the bound value is always listed. */
export interface CompatibleOption {
    readonly id: string;
    readonly verdict: BindingVerdict;
    readonly why: string;
}

/** The options of a role's select from its compatibility (bindingCompat.ts, S10): never incompatible, but for the current value. */
export function compatibleOptions(compat: RoleCompatibility | undefined, current: string): CompatibleOption[] {
    if (!compat) return [];
    const out: CompatibleOption[] = compat.candidates.filter(c => c.verdict !== 'incompatible' || c.id === current);
    if (current && !out.some(c => c.id === current)) out.unshift(compat.current ?? { id: current, verdict: 'incompatible', why: 'Not an element of this metamodel' });
    return out;
}

// ---------------------------------------------------------------------------
// R-SIM-90: the multi row, the first attribute in the select, the others as tags
// ---------------------------------------------------------------------------

/** The tags a row shows before it counts the rest: the row never grows. */
export const MULTI_TAGS_SHOWN = 1;

/** The candidates S11a does not judge incompatible, in sketch order (S10): what the «+» may offer. */
export function compatibleIds(compat: RoleCompatibility | undefined): string[] {
    return compat ? compat.candidates.filter(c => c.verdict !== 'incompatible').map(c => c.id) : [];
}

export interface MultiRow {
    /** The first attribute, the value of the row's select; `''` when the role is unset. */
    readonly primary: string;
    /** The other attributes, the tags, in order. */
    readonly others: readonly string[];
    /** The tags shown, then the ones counted as `+n`. */
    readonly shown: readonly string[];
    readonly more: readonly string[];
    /**
     * The «+» select has a slot: two or more candidates not incompatible. It depends on the
     * metamodel and the context roles, never on the list, so it does not come and go while editing.
     */
    readonly plus: boolean;
    /** The «+» select is visible: the primary set and something left to add; hidden, it keeps its slot. */
    readonly plusShown: boolean;
    /** The options of the «+» select: those candidates, the attributes already chosen aside. */
    readonly addable: readonly string[];
}

/** The row of a multi role over its value (a plain id, a JSON list, or unset) and its compatible candidates. */
export function multiRow(value: string, compatible: readonly string[]): MultiRow {
    const list = roleValues(value);
    const others = list.slice(1);
    const addable = compatible.filter(id => !list.includes(id));
    const plus = compatible.length >= 2;
    return {
        primary: list[0] ?? '',
        others,
        shown: others.slice(0, MULTI_TAGS_SHOWN),
        more: others.slice(MULTI_TAGS_SHOWN),
        plus,
        plusShown: plus && list.length > 0 && addable.length > 0,
        addable,
    };
}

/** The edit of the row's select (an encoded list, `''` for none): `id` first, or `''` to clear it, which promotes the first tag. */
export function withPrimary(value: string, id: string): string {
    const list = roleValues(value);
    const next = id === '' ? list.slice(1) : [id, ...list.slice(1).filter(x => x !== id)];
    return encodeRoleValues(next) ?? '';
}

/** The edit of the «+» select: `id` after the others. */
export function withAdded(value: string, id: string): string {
    return encodeRoleValues([...roleValues(value), id]) ?? '';
}

/** The edit of a tag's remove button. */
export function withRemoved(value: string, id: string): string {
    return encodeRoleValues(roleValues(value).filter(x => x !== id)) ?? '';
}

/** The accessible names of a multi row, by the role's label. */
export function multiRowLabels(label: string): {
    readonly strip: string; readonly add: string; readonly remove: (name: string) => string; readonly more: (names: readonly string[]) => string;
} {
    return {
        strip: `Other ${label} attributes`,
        add: `Add another ${label} attribute`,
        remove: name => `Remove ${name} from ${label}`,
        more: names => `Also: ${names.join(', ')}`,
    };
}

/** The keys that remove a tag from its focused remove button; Enter and Space click it, Escape closes the dialog. */
export function removesTag(key: string): boolean {
    return key === 'Delete' || key === 'Backspace';
}

/**
 * The verdict beside a row (S11a), `null` when it is ok or unjudged: its value's; for several
 * attributes (R-SIM-90) the worst, `current`, with each attribute that is not ok named in the why.
 */
export function rowVerdict(
    compat: RoleCompatibility | undefined, value: string, nameOf: (id: string) => string,
): { readonly verdict: 'warn' | 'incompatible'; readonly why: string } | null {
    if (!compat || !value) return null;
    if (compat.currents && compat.currents.length > 1) {
        const worst = compat.current;
        if (!worst || worst.verdict === 'ok') return null;
        return { verdict: worst.verdict, why: compat.currents.filter(c => c.verdict !== 'ok').map(c => `${nameOf(c.id)}: ${c.why}`).join('; ') };
    }
    const judged = compat.candidates.find(c => c.id === value) ?? compat.current;
    return judged && judged.verdict !== 'ok' ? { verdict: judged.verdict, why: judged.why } : null;
}

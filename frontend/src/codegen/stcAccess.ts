/**
 * stcAccess — read-only access to the roles of a metamodel's simulation STC,
 * for the templates of the code generator (R-GEN-7, slice S3).
 *
 * A template is written against the concrete metamodel and reads the STC the
 * simulator reads: the M1's metamodel bag (`_state`), its profile, the run bag
 * (the keys of the roles the profile turns off dropped, the event class derived
 * from the Trigger, R-SIM-78, R-SIM-38), then `netStcFromRoles`. The view has
 * no write path: every object and array it builds is frozen.
 *
 * Elements are returned through `handleOf`, the caller's map from element id to
 * the JjEL handle (`buildEvalContext`, wired by slice S2): the one builder of
 * JjEL contexts stays the only one (guardContext.ts). The handles are the
 * caller's and are returned as given, not frozen.
 *
 * Order: the element lists follow the model's object order as the panel reads
 * it (`collectModelObjectIds`, the key order of the lookup), the order
 * `compileNet` reads, so `nodes` and `net.places` agree where they overlap.
 *
 * Pure: imports the core of the simulator only. `collectModelObjectIds`,
 * `runBag` and `makeNetModelView` (components/editor-v2/sim/simBridge.ts) and
 * `storedProfile` (components/editor-v2/sim/simRoleStatus.ts) are copied
 * below, reduced, because the bridge imports the run singleton and, through
 * it, React; the tests compare each copy with its original.
 * Design: docs/discovery/discovery_2026-10-10_code_generation_pilot.md §D.
 */

import { compileNet, featuresOf, netStcFromRoles, withDerivedEventRole } from '../model/simulation/netCompile';
import type { NetModelView, NetStc, NetTransition } from '../model/simulation/netTypes';
import { isKindOf } from '../model/simulation/isKindOf';
import { objectReferences, objectSlotValues } from '../model/simulation/objectSlots';
import { ROLE_CATALOG } from '../model/simulation/roleCatalog';
import type { RoleId } from '../model/simulation/roleCatalog';
import { decodeProfile, inferCustomProfile } from '../model/simulation/profileCodec';
import type { SimProfile } from '../model/simulation/simProfiles';

type Lookup = Record<string, any>;

/** An element as a template passes it back: its id, or a handle that carries it. */
export type StcElement = string | { readonly id?: unknown } | null | undefined;

export interface StcProfile {
    readonly id: string;
    readonly name: string;
    readonly shape: SimProfile['shape'];
    /** No readable `simProfile`: «Custom», rebuilt from the role keys. */
    readonly custom: boolean;
}

/** The compiled net, for the oracle: the places and the transitions with their ids, as `compileNet` gives them. */
export interface StcNet {
    readonly places: readonly string[];
    readonly transitions: readonly NetTransition[];
}

export interface StcView<H> {
    readonly profile: StcProfile;
    /** The objects of the model that are a kind of the bound role class (`isKindOf`); `[]` for a role unbound or off. */
    readonly nodes: readonly H[];
    readonly transitions: readonly H[];
    readonly initial: readonly H[];
    readonly events: readonly H[];
    /** The objects the element's slot for the role's reference holds, by feature pointer, in slot order. */
    trigger(t: StcElement): readonly H[];
    /** The Source reference, else the owner through Owned transitions (netCompile.ts `compileControlFlow`). */
    source(t: StcElement): readonly H[];
    target(t: StcElement): readonly H[];
    /** The guard's JjEL text; `null` when absent or blank. Two Guard attributes are conjoined; `else` is returned as written. */
    guard(t: StcElement): string | null;
    /** The values of the Action attributes, in order, blanks dropped. */
    actions(t: StcElement): readonly string[];
    readonly net: StcNet;
}

// The roles the view reads, as catalog ids: the field of `NetStc` has the same name.
const NODE: RoleId & keyof NetStc = 'node';
const TRANSITION: RoleId & keyof NetStc = 'transition';
const INITIAL: RoleId & keyof NetStc = 'initial';
const EVENT: RoleId & keyof NetStc = 'event';
const TRIGGER: RoleId & keyof NetStc = 'trigger';
const SOURCE: RoleId & keyof NetStc = 'source';
const OWNED_TRANSITIONS: RoleId & keyof NetStc = 'ownedTransitions';
const NEXT_STATE: RoleId & keyof NetStc = 'nextState';

/** The `simProfile` key of the bag (R-SIM-55): not a role, `PROFILE_KEY` of simRoleStatus.ts. */
const PROFILE_KEY = 'simProfile';

/** Copy of simBridge.ts `collectModelObjectIds`: the DObjects whose `father` chain reaches the model. */
function collectModelObjectIds(lookup: Lookup, modelId: string): string[] {
    const ids: string[] = [];
    for (const id in lookup) {
        const d = lookup[id];
        if (!d || d.className !== 'DObject') continue;
        let owner: any = d;
        let depth = 0;
        while (owner && owner.className !== 'DModel' && depth++ < 40) {
            const fatherId = typeof owner.father === 'string' ? owner.father : null;
            owner = fatherId ? lookup[fatherId] : null;
        }
        if (owner?.id === modelId) ids.push(id);
    }
    return ids;
}

/** Copy of simRoleStatus.ts `storedProfile`, without `readable`: `simProfile` decoded, else «Custom» from the bag. */
function storedProfile(bag: Readonly<Record<string, unknown>>): { profile: SimProfile; custom: boolean } {
    const raw = bag[PROFILE_KEY];
    const profile = raw === undefined || raw === null || raw === '' ? null : decodeProfile(raw);
    return profile ? { profile, custom: false } : { profile: inferCustomProfile(bag).profile, custom: true };
}

/** Copy of simBridge.ts `runBag`: the keys of the roles the profile turns off dropped, the event derived. */
function runBag(raw: Record<string, unknown>, lookup: Lookup, profile: SimProfile): Record<string, unknown> {
    const bag: Record<string, unknown> = { ...raw };
    for (const d of ROLE_CATALOG) if (d.key !== null && profile.modes[d.id].mode === 'off') delete bag[d.key];
    const derived = withDerivedEventRole(bag, lookup);
    if (profile.modes[EVENT].mode === 'off') delete derived.simEvent;
    return derived;
}

/** Copy of simBridge.ts `makeNetModelView`, without the label: what `compileNet` reads. */
function netModelView(lookup: Lookup): NetModelView {
    return {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: () => [],
        transitionTarget: () => null,
        references: (objectId, featureId) => objectReferences(lookup, objectId, featureId),
        values: (objectId, featureId) => objectSlotValues(lookup, objectId, featureId),
    };
}

function idOf(t: StcElement): string {
    if (typeof t === 'string') return t;
    const id = t?.id;
    return typeof id === 'string' ? id : '';
}

/** Freezes `value` and every object and array under it. Only for what this module builds. */
function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const v of Object.values(value)) deepFreeze(v);
    }
    return value;
}

/**
 * The STC view of the M1 model `modelId`, or `null` when its metamodel's roles
 * do not make an STC (none bound, or incomplete) or the model or its metamodel
 * is not in the lookup. Never throws on a well-formed lookup.
 */
export function stcAccess<H>(lookup: Lookup, modelId: string, handleOf: (id: string) => H): StcView<H> | null {
    const metamodelId = lookup[modelId]?.instanceof;
    const raw = typeof metamodelId === 'string' ? lookup[metamodelId]?._state : undefined;
    if (!raw || typeof raw !== 'object') return null;
    const { profile, custom } = storedProfile(raw);
    const stc = netStcFromRoles(runBag(raw, lookup, profile));
    if (!stc) return null;
    const ids = collectModelObjectIds(lookup, modelId);

    const handles = (list: readonly string[]): readonly H[] => Object.freeze(list.map(id => handleOf(id)));
    const kindOf = (role: RoleId & keyof NetStc): readonly H[] => {
        const cls = stc[role];
        return handles(typeof cls === 'string' ? ids.filter(id => isKindOf(lookup, id, cls)) : []);
    };
    const references = (t: StcElement, role: RoleId & keyof NetStc): string[] => {
        const feature = stc[role];
        return typeof feature === 'string' ? objectReferences(lookup, idOf(t), feature) : [];
    };

    // The owner of each owned transition, the first in model order, as compileNet.
    const owner = new Map<string, string>();
    if (stc.ownedTransitions) {
        for (const s of ids) for (const t of references(s, OWNED_TRANSITIONS)) if (!owner.has(t)) owner.set(t, s);
    }

    const compiled = compileNet(stc, netModelView(lookup), modelId, ids);

    return Object.freeze({
        profile: deepFreeze({ id: profile.id, name: profile.name, shape: profile.shape, custom }),
        nodes: kindOf(NODE),
        transitions: kindOf(TRANSITION),
        initial: kindOf(INITIAL),
        events: kindOf(EVENT),
        trigger: (t: StcElement) => handles(references(t, TRIGGER)),
        source: (t: StcElement) => {
            const declared = references(t, SOURCE);
            const fallback = owner.get(idOf(t));
            return handles(declared.length > 0 ? declared : fallback !== undefined ? [fallback] : []);
        },
        target: (t: StcElement) => handles(references(t, NEXT_STATE)),
        guard: (t: StcElement) => {
            const texts: string[] = [];
            for (const feature of featuresOf(stc, 'guard')) {
                const value = objectSlotValues(lookup, idOf(t), feature)[0];
                if (value === undefined) continue;
                const text = String(value);
                if (text.trim() !== '') texts.push(text);
            }
            return texts.length === 0 ? null : texts.length === 1 ? texts[0] : texts.map(x => `(${x})`).join(' and ');
        },
        actions: (t: StcElement) => Object.freeze(featuresOf(stc, 'action')
            .flatMap(feature => objectSlotValues(lookup, idOf(t), feature))
            .map(v => String(v))
            .filter(text => text.trim() !== '')),
        net: deepFreeze({ places: [...compiled.places], transitions: [...compiled.transitions] }),
    });
}

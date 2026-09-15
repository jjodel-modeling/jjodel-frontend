/**
 * metaclassPin — which concrete class an IR view is authored against, resolved by
 * identity instead of by name.
 *
 * `ir.metaclasses` is a list of NAMES and stays one: the resolver matches by name
 * and this module does not touch it. But the authoring layer needs more than a
 * name — it has to read the feature set of one specific class, and a project can
 * hold two metamodels that both declare `State` (discovery 2026-07-23 §9). Until
 * now that disambiguation came from `view.appliableToClasses`, a list of class
 * pointers the IR resolver ignores and the tab partition retires as a control:
 * once the Apply-to tab is gone, nothing would pin the identity any more and the
 * authoring panels would silently fall back to the first class with that name.
 *
 * Hence the three-step chain below. Step 2 is the load-bearing one: every view
 * authored before the pin existed has no map, and only `appliableToClasses` keeps
 * it pointing at the right class. It is a READ, not a backfill — nothing here
 * writes the legacy pointer into the ir.
 *
 * Pure by contract, on the model of pathExpr.ts: no React, no Redux, no runtime
 * import from editor-v2. Resolving a pointer to an L-proxy and enumerating the
 * project's metamodels are impure, so the caller does them and passes the result
 * in as plain {id, name} pairs.
 */

import type { AuthoringMetaclassPins } from './irTypes';

/** A metamodel class reduced to what identity resolution needs. */
export interface MetaclassRef {
    id: string;
    name: string;
}

/**
 * Everything the chain matches against.
 *
 * - `pins`     — the ir's own map (step 1).
 * - `appliesTo`— `view.appliableToClasses` already filtered to real M2 classes
 *                (step 2). The caller drops the non-class entries: the field
 *                mixes D-level type names with class pointers (cf. EnableIRPanel).
 * - `candidates` — every class of every project metamodel, in metamodel iteration
 *                order (step 3, and the existence check for steps 1 and 2).
 */
export interface MetaclassPinContext {
    pins?: AuthoringMetaclassPins;
    appliesTo?: MetaclassRef[];
    candidates: MetaclassRef[];
}

/** The same context minus the map, which `withMetaclassPins` takes from the draft. */
export type MetaclassIdentityContext = Omit<MetaclassPinContext, 'pins'>;

/** Which step of the chain produced the answer — for diagnostics and tests. */
export type MetaclassPinSource = 'pin' | 'appliesTo' | 'name';

export interface ResolvedMetaclass {
    id: string;
    source: MetaclassPinSource;
}

/**
 * The class `name` refers to, or null when no metamodel declares it.
 *
 * 1. the ir's pin for that exact name;
 * 2. a class of that name among the view's appliableToClasses (legacy identity —
 *    the step that keeps already-authored views correct);
 * 3. the first class of that name in the project.
 *
 * Steps 1 and 2 fall through when the id they yield is not in `candidates`: a
 * pointer can outlive the class it points at (metamodel deleted or re-imported),
 * and a dangling id would starve the feature set instead of degrading to the
 * name match. This mirrors what the panels already did — they looked the id up
 * in the metamodel's class list and kept the name fallback when it was absent.
 */
export function resolveMetaclassId(
    name: string | null | undefined,
    ctx: MetaclassPinContext,
): ResolvedMetaclass | null {
    if (!name) return null;
    const candidates = ctx.candidates ?? [];
    const declared = (id: string) => candidates.some((c) => c.id === id);

    const pinned = ctx.pins?.[name];
    if (pinned && declared(pinned)) return { id: pinned, source: 'pin' };

    for (const entry of ctx.appliesTo ?? []) {
        if (entry.name === name && declared(entry.id)) return { id: entry.id, source: 'appliesTo' };
    }

    const byName = candidates.find((c) => c.name === name);
    return byName ? { id: byName.id, source: 'name' } : null;
}

/** The IR shape this module operates on — the three authorable kinds share it. */
export interface PinnableIR {
    metaclasses: string[] | '*';
    authoringMetaclassPins?: AuthoringMetaclassPins;
}

function samePins(a: AuthoringMetaclassPins | undefined, b: AuthoringMetaclassPins): boolean {
    if (!a) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && kb.every((k) => a[k] === b[k]);
}

/**
 * `next` with its pin map reconciled against its metaclass list.
 *
 * Called from the panel's `patch`, so the map is written by the SAME patch that
 * writes `metaclasses` — never one without the other. Two lists free to move
 * independently would diverge at the first edit, which is the failure this pin
 * exists to prevent.
 *
 * Only a genuine metaclass edit reconciles: when the list is unchanged `next` is
 * returned as it came, so editing a colour never writes a pin into a view that
 * had none. That is the no-backfill rule — step 2 of the chain stays a read.
 *
 * A pin already present on `next` is honoured before the one on `prev`: that is how
 * the picker hands over the class it actually selected among homonyms. Everything
 * else is unchanged, and a caller that sets no pin sees the previous behaviour.
 *
 * The map is rebuilt for the new list rather than patched: names dropped from the
 * list lose their pin (a stale entry is exactly the divergence to avoid), names
 * already pinned keep theirs (step 1 of the chain returns it), names just added
 * resolve through the same chain the reader uses — so a name that was correct via
 * appliableToClasses is pinned to that same class, and the identity survives the
 * removal of the Apply-to control.
 *
 * An empty result drops the KEY instead of writing `{}` or `undefined`, keeping
 * the ir byte-identical to one authored without any pin.
 */
export function withMetaclassPins<T extends PinnableIR>(
    prev: T,
    next: T,
    ctx: MetaclassIdentityContext,
): T {
    if (JSON.stringify(prev.metaclasses) === JSON.stringify(next.metaclasses)) return next;

    // A pin declared on `next` is the author's explicit choice, made in the same
    // patch that adds the name: it wins over the one carried by `prev`, which is
    // history. Without this the picker could not say WHICH of two homonymous
    // classes was selected — step 3 of the chain would answer "the first one" and
    // the choice would be lost on the way in.
    const declaredPins: AuthoringMetaclassPins = {
        ...(prev.authoringMetaclassPins ?? {}),
        ...(next.authoringMetaclassPins ?? {}),
    };

    const list = Array.isArray(next.metaclasses) ? next.metaclasses : [];
    const pins: AuthoringMetaclassPins = {};
    for (const name of list) {
        const hit = resolveMetaclassId(name, { ...ctx, pins: declaredPins });
        if (hit) pins[name] = hit.id;
    }

    if (Object.keys(pins).length === 0) {
        if (next.authoringMetaclassPins === undefined) return next;
        const { authoringMetaclassPins, ...rest } = next;
        return rest as T;
    }
    if (samePins(next.authoringMetaclassPins, pins)) return next;
    return { ...next, authoringMetaclassPins: pins };
}

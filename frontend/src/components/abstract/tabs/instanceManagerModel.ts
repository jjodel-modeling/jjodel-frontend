/**
 * instanceManagerModel — the pure half of the instance manager.
 *
 * Everything here is a function of a plain `idlookup` dictionary: no React, no
 * Redux, no L-proxy. That is deliberate and it is what the unit tests exercise —
 * nine suites in this repo already die at import on `window is not defined`, so a
 * module that needs the store to be tested is a module that does not get tested.
 * The impure half (resolving the metamodel, subscribing to the store) stays in
 * `InstanceManagerTab.tsx`.
 *
 * The naming rule is NOT reimplemented here: `makeDrawReadCtx` already owns it
 * (`name` slot value first, then `DObject.name`, then `initialName` — the parity
 * the XMI importer needs), and `irReadCtx.ts` is itself a zero-import module, so
 * importing it costs this one nothing. `useFormWidgets.ts` asks in its header that
 * a third copy of a shared rule be extracted rather than written again; this is the
 * cheaper obedience to the same request.
 */

import { makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';

type Idlookup = Record<string, any>;

/** Tab id prefix. Prefixed because `TabDataMaker.metamodel/model` use the bare
 *  `model.id`: an unprefixed manager would collide with the canvas tab of the same
 *  model and `DockManager.open` would silently activate the canvas instead of
 *  opening anything. Same reason `doc_`, `jjtl_` and `vp_` are prefixed. */
export const MANAGER_TAB_PREFIX = 'mgr_';

/** The dock id of the manager tab of a model. */
export function managerTabId(modelId: string): string {
    return MANAGER_TAB_PREFIX + modelId;
}

/** The model id a manager tab id was built from; null when it is not one. */
export function modelIdOfManagerTab(tabId: string): string | null {
    if (!tabId || !tabId.startsWith(MANAGER_TAB_PREFIX)) return null;
    const rest = tabId.slice(MANAGER_TAB_PREFIX.length);
    return rest.length > 0 ? rest : null;
}

/**
 * The model an object belongs to, by walking `father` up to a `DModel`.
 *
 * `DObject` carries no `model` field — `ObjectPointers` declares only `father`
 * (a `DValue` for a contained child, a `DModel` for a root) and `instanceof`. So
 * membership is a walk, not a lookup, and a contained child is several hops from
 * its model.
 *
 * Backward-link iteration on purpose (CLAUDE.md §3.6): the forward collection
 * `model.objects` holds ROOT objects only and is stale immediately after a parse,
 * so counting through it would both miss every contained instance and race the
 * reducer.
 *
 * `depthCap` is a cycle belt, not a semantic limit: a father chain that long is
 * already corrupt, and returning null beats looping.
 */
export function modelIdOfObject(idlookup: Idlookup, objectId: string, depthCap = 64): string | null {
    let current = idlookup[objectId];
    for (let i = 0; i < depthCap && current; i++) {
        if (current.className === 'DModel') return typeof current.id === 'string' ? current.id : null;
        const father = current.father;
        if (typeof father !== 'string') return null;
        current = idlookup[father];
    }
    return null;
}

/** One row of the instance list. Flat and serializable: the row is data, the
 *  rendering is the caller's. */
export interface InstanceRow {
    /** DObject id — the subject `IRForm` is mounted on. */
    id: string;
    /** Display name, by the `makeDrawReadCtx` rule. */
    name: string;
    /** Metaclass name, repeated per row: the list is filtered to one metaclass
     *  today, but a row that does not say what it is stops being readable the
     *  moment the filter widens. */
    metaclassName: string;
    /** True when the object is contained by another object rather than by the
     *  model. Not rendered in this slice; it is the one bit of the walk that
     *  would otherwise be thrown away and recomputed. */
    isContained: boolean;
}

/**
 * Every instance of `classId` inside `modelId`, name-sorted.
 *
 * EXACT metaclass match, not conformance: an instance of a subclass does NOT
 * appear under its superclass. That is a deliberate reading of "instances of the
 * selected metaclass" and it is what makes the counts add up to the model's
 * object total; if a conformance-wide list is wanted later it is a second
 * function, not a flag on this one.
 *
 * The sort is by name and then by id, so two homonymous instances keep a stable
 * order across renders instead of swapping on every store update.
 */
export function instancesOfClass(
    idlookup: Idlookup,
    modelId: string,
    classId: string,
): InstanceRow[] {
    if (!idlookup || !modelId || !classId) return [];
    const ctx = makeDrawReadCtx(idlookup);
    const rows: InstanceRow[] = [];
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DObject') continue;
        if (d.instanceof !== classId) continue;
        if (modelIdOfObject(idlookup, id) !== modelId) continue;
        rows.push({
            id,
            name: ctx.getName(id) ?? '',
            metaclassName: ctx.getMetaclassName(id) ?? '',
            isContained: idlookup[d.father]?.className === 'DValue',
        });
    }
    rows.sort((a, b) => (a.name === b.name ? (a.id < b.id ? -1 : 1) : a.name < b.name ? -1 : 1));
    return rows;
}

/** How many instances of each class the model holds, keyed by class id.
 *  One pass over `idlookup` for every class, instead of one pass per class. */
export function instanceCountsByClass(idlookup: Idlookup, modelId: string): Record<string, number> {
    const out: Record<string, number> = {};
    if (!idlookup || !modelId) return out;
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DObject') continue;
        const cid = d.instanceof;
        if (typeof cid !== 'string') continue;
        if (modelIdOfObject(idlookup, id) !== modelId) continue;
        out[cid] = (out[cid] ?? 0) + 1;
    }
    return out;
}

/** Why a metaclass cannot be instantiated, or null when it can.
 *  The manager shows the reason instead of hiding the row: a metaclass absent from
 *  the list reads as a missing model, one greyed out with a cause reads as the
 *  metamodel saying so. */
export function uninstantiableReason(cls: { isAbstract?: boolean }): string | null {
    return cls?.isAbstract ? 'Abstract metaclass — it has no direct instances' : null;
}

/**
 * syncPatchIdentity — keep the identity of what an incremental-sync patch would
 * not change (P-2026-10-02-1450, ticket T9).
 *
 * `useJjomSync`'s incremental-sync effect runs after every render (its deps hold
 * `Date.now()`, kept for #67) and re-transforms every element. A patch built from
 * a transformer output that is equal in content to the canvas state, but made of
 * new objects, re-rendered the editor, which re-ran the effect: a loop at the
 * display rate in every editor holding an edge, hidden or visible
 * (`docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md`).
 *
 * Both helpers are conservative: where they cannot tell, they answer «changed»,
 * which is what the sync did before them.
 */

import type { Edge } from '@xyflow/react';

/** Nesting beyond this depth counts as a difference. Node data goes four levels deep. */
const MAX_DEPTH = 8;

function isPlainObject(value: object): boolean {
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function equalAt(a: unknown, b: unknown, depth: number): boolean {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (depth >= MAX_DEPTH) return false;
    const aIsArray = Array.isArray(a);
    if (aIsArray !== Array.isArray(b)) return false;
    if (aIsArray) {
        const x = a as unknown[];
        const y = b as unknown[];
        if (x.length !== y.length) return false;
        for (let i = 0; i < x.length; i++) {
            if (!equalAt(x[i], y[i], depth + 1)) return false;
        }
        return true;
    }
    // A proxy, a class instance, a Map: identity only.
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    const keysA = Object.keys(a);
    if (keysA.length !== Object.keys(b).length) return false;
    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (!equalAt((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], depth + 1)) return false;
    }
    return true;
}

/**
 * Structural equality over primitives, arrays and plain objects (prototype
 * `Object.prototype` or `null`). Anything else compares by identity, a key present
 * with `undefined` differs from a key absent, and nesting beyond `MAX_DEPTH`
 * differs.
 */
export function samePlainData(a: unknown, b: unknown): boolean {
    return equalAt(a, b, 0);
}

/**
 * The edge an incremental-sync patch leaves in React Flow's state: the
 * transformer's `incoming` edge, with what only the canvas knows carried over from
 * `current` (handles, local routing, the DReference id, a non-association kind).
 * The merge is the one `useJjomSync`'s edge patch did inline, moved verbatim; the
 * canvas selection flag is not carried, EditorV2's `setEdges` wrapper re-applies
 * it. When the merged edge equals `current` in content, `current` itself is
 * returned, so a patch that changes nothing changes no identity.
 */
export function mergeSyncedEdge(current: Edge, incoming: Edge): Edge {
    const e = current;
    const newEdge = incoming;
    const merged = { ...newEdge };
    if (e.sourceHandle) merged.sourceHandle = e.sourceHandle;
    if (e.targetHandle) merged.targetHandle = e.targetHandle;
    const existingData = (e.data as any) ?? {};
    const mergedData = (merged.data as any) ?? {};
    // Preserve local routing customizations that are not
    // persisted in JjOM and would otherwise be lost after
    // incremental sync patches.
    if (existingData.waypoints !== undefined && mergedData.waypoints === undefined) {
        mergedData.waypoints = existingData.waypoints;
    }
    if (existingData.sourceAnchor && !mergedData.sourceAnchor) {
        mergedData.sourceAnchor = existingData.sourceAnchor;
    }
    if (existingData.targetAnchor && !mergedData.targetAnchor) {
        mergedData.targetAnchor = existingData.targetAnchor;
    }
    merged.data = mergedData;
    const existingJjomRefId = (e.data as any)?.jjomRefId;
    if (existingJjomRefId && !(merged.data as any)?.jjomRefId) {
        (merged.data as any).jjomRefId = existingJjomRefId;
    }
    const existingRef = (e.data as any)?.reference;
    const newRef = (merged.data as any)?.reference;
    if (existingRef && newRef && newRef.kind === 'association' && existingRef.kind !== 'association') {
        (merged.data as any).reference = {
            ...newRef,
            kind: existingRef.kind,
            containment: existingRef.containment,
        };
    }
    return samePlainData(merged, current) ? current : merged;
}

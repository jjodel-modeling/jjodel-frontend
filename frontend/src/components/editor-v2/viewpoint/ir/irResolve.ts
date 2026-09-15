/**
 * irResolve — IR-native view resolution for EditorV2 (React wiring).
 *
 * Pure resolution logic lives in irResolveCore.ts (unit-tested); this module
 * adds the store subscription and the useIRView hook consumed by ObjectNode.
 * The resolver operates ONLY on views carrying the `ir` field: it never calls
 * getAppliedViewsNew and never touches transientProperties (the classic
 * resolver and this one coexist without overlap, decision 2026-07-17).
 */

import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { store } from '../../../../joiner';
import { useSimVersion } from '../../sim/simRunState';
import { type ReadCtx } from './irReadCtx';
import { makeReadCtx } from './irReadCtxLproxy';
import type { CompiledRowView, CompiledView } from './irTypes';
import { computeIRSignature, getIRIndex, resolveIRView, resolveRowView } from './irResolveCore';
import { compileRowView } from './irCompile';
import { defaultRowViewIR, IR_DEFAULT_ROW_VIEW_ID } from './irDefaults';
import {
    clearCrossDeps,
    crossDepsSignature,
    publishCrossDeps,
    resolveCrossDeps,
    warnCappedCrossDeps,
    warnUnresolvedCrossDeps,
} from './irCrossDeps';

export { computeIRSignature, getIRIndex, resolveIRView } from './irResolveCore';
export type { IRViewpointIndex } from './irResolveCore';

export interface IRViewResolution {
    compiled: CompiledView;
    objectId: string;
    readCtx: ReadCtx;
}

/**
 * React hook used by ObjectNode. Subscribes to a compact signature:
 * (viewpoint IR signature) + (object's own feature snapshot restricted to the
 * resolved view's dependency set). Cross-object PathExprs are NOT covered
 * (known v1 limit, spec v1.2 dependency-set work).
 *
 * Returns null when the active viewpoint has no applicable IR view — in that
 * case ObjectNode renders exactly as before the spike.
 */
export function useIRView(vertexId: string, instanceOfClassId: string | null | undefined): IRViewResolution | null {
    const signature = useSelector((state: any) => {
        const irSig = computeIRSignature(state);
        if (!irSig || !instanceOfClassId) return '';
        // Self feature snapshot: values of this object's DValue slots.
        // Kept unconditional (not filtered by dependency set) to avoid a
        // resolve inside the selector; objects have few features.
        const lookup = state.idlookup;
        const objectId = lookup?.[vertexId]?.model;
        if (typeof objectId !== 'string') return '';
        const dObject = lookup?.[objectId];
        if (!dObject) return '';
        const snap: string[] = [irSig, objectId, dObject.instanceof ?? ''];
        if (Array.isArray(dObject.features)) {
            for (const fid of dObject.features) {
                const dv = lookup?.[fid];
                if (dv && Array.isArray(dv.values)) snap.push(`${fid}=${JSON.stringify(dv.values)}`);
            }
        }
        // Cross-object deps published by this node's previous render (spec v1.2
        // sez. 9): appending their value snapshot makes a change on a navigated
        // target's feature invalidate exactly this node.
        const crossSig = crossDepsSignature(lookup, vertexId);
        return crossSig ? `${snap.join(';')};X${crossSig}` : snap.join(';');
    });

    // Declared-channel gate (R-MK-5/R-MK-6). The subscription is UNCONDITIONAL —
    // rules of hooks, same reason ObjectNode.tsx states at :191-193 — but the VALUE
    // only reaches the memo when the active index declares the channel. A viewpoint
    // whose views never read `marked` therefore feeds a constant 0 and re-resolves
    // exactly as it did before this slice: that constant is the restrictive clause of
    // spec sez. 9 ("NON DEVE re-renderizzare per ... fuori dal set") on the channel
    // half of the dependency set, not a detail.
    //
    // The gate reads the INDEX, not the resolved view: at this point the view is not
    // resolved yet (the resolve lives inside the memo below, by construction), so the
    // granularity is per index. That is the v1 granularity R-MK-6 declares, and the
    // refinement to per element is a later ratification, on a measurement.
    //
    // Recomputed only when `signature` changes — which embeds irSig, so it changes
    // whenever the index can change — never on a channel bump.
    const markVersion = useSimVersion();
    const markDeclared = useMemo(() => {
        const state: any = store.getState();
        const irSig = computeIRSignature(state);
        const index = irSig ? getIRIndex(state, irSig) : null;
        return !!index?.channelsInUse?.has('mark');
    }, [signature]);
    const markDep = markDeclared ? markVersion : 0;

    // Drop this node's published cross-object deps when it unmounts.
    useEffect(() => () => clearCrossDeps(vertexId), [vertexId]);

    return useMemo(() => {
        if (!signature || !instanceOfClassId) { clearCrossDeps(vertexId); return null; }
        const state: any = store.getState();
        const irSig = computeIRSignature(state);
        const index = getIRIndex(state, irSig);
        if (!index) { clearCrossDeps(vertexId); return null; }
        const lookup = state.idlookup;
        const objectId = lookup?.[vertexId]?.model;
        if (typeof objectId !== 'string') { clearCrossDeps(vertexId); return null; }
        const readCtx = makeReadCtx(lookup);
        const compiled = resolveIRView(objectId, instanceOfClassId, index, readCtx, lookup);
        if (!compiled) { clearCrossDeps(vertexId); return null; }
        // Two-phase publish: resolve the cross-object deps of the resolved view
        // against the current state and register them for the next selector pass.
        const cross = resolveCrossDeps(lookup, objectId, compiled.crossPaths);
        publishCrossDeps(vertexId, cross.fids);
        if (cross.unresolved.length) warnUnresolvedCrossDeps(cross.unresolved, compiled.viewId);
        if (cross.capped) warnCappedCrossDeps(compiled.viewId);
        return { compiled, objectId, readCtx };
    }, [signature, vertexId, instanceOfClassId, markDep]);
}

/**
 * True when the active viewpoint publishes an IR index — i.e. when a `null` from
 * `useIRView` means "this metaclass has no view" rather than "there is no IR
 * viewpoint at all". The two cases are indistinguishable from the resolution alone
 * (null carries no fields), and they must render differently: no viewpoint → the
 * object renders in full, as it always did; viewpoint without a view for it →
 * neutral node (the canvas counterpart of the tree's `not rendered` dimming).
 *
 * Reads nothing beyond `computeIRSignature` + `getIRIndex`, the same index gate the
 * canvas already uses for the views-editor entry (EditorV2.tsx, Fase 2): the active
 * viewpoint id is carried by the index, so this is not a second reader of
 * `state.viewpoint` (R-LAY-19, 2026-08-25). Subscribed on the signature string only,
 * so it recomputes exactly when the index can change.
 */
export function useIRViewpointActive(): boolean {
    const irSig = useSelector((state: any) => computeIRSignature(state) || '');
    return useMemo(() => {
        if (!irSig) return false;
        return !!getIRIndex(store.getState(), irSig);
    }, [irSig]);
}

export interface IRRowResolution {
    compiled: CompiledRowView;
    objectId: string;
    readCtx: ReadCtx;
}

/**
 * Row-view resolution for a containment child rendered as an inline row (Fase R2).
 * Mirrors useIRView but keyed on the child's DObject id and returning a CompiledRowView.
 * Own feature-snapshot subscription (+ cross-object deps for multi-hop template paths),
 * so the row re-renders on a change to the CHILD without a forced re-render of the host
 * node (spec R2 P3). Falls back to the built-in defaultRowViewIR (intrinsic name,
 * compiled + cached, never persisted) when no row view of the active viewpoint matches.
 * Returns null only when there is no active IR viewpoint or the child has no metaclass.
 */
export function useIRRowView(childObjectId: string): IRRowResolution | null {
    const signature = useSelector((state: any) => {
        const irSig = computeIRSignature(state);
        if (!irSig) return '';
        const lookup = state.idlookup;
        const dObject = lookup?.[childObjectId];
        if (!dObject) return '';
        const snap: string[] = [irSig, childObjectId, dObject.instanceof ?? ''];
        if (Array.isArray(dObject.features)) {
            for (const fid of dObject.features) {
                const dv = lookup?.[fid];
                if (dv && Array.isArray(dv.values)) snap.push(`${fid}=${JSON.stringify(dv.values)}`);
            }
        }
        const crossSig = crossDepsSignature(lookup, childObjectId);
        return crossSig ? `${snap.join(';')};X${crossSig}` : snap.join(';');
    });

    // Same declared-channel gate as useIRView above, keyed on the row's own object.
    const markVersion = useSimVersion();
    const markDeclared = useMemo(() => {
        const state: any = store.getState();
        const irSig = computeIRSignature(state);
        const index = irSig ? getIRIndex(state, irSig) : null;
        return !!index?.channelsInUse?.has('mark');
    }, [signature]);
    const markDep = markDeclared ? markVersion : 0;

    useEffect(() => () => clearCrossDeps(childObjectId), [childObjectId]);

    return useMemo(() => {
        if (!signature) { clearCrossDeps(childObjectId); return null; }
        const state: any = store.getState();
        const irSig = computeIRSignature(state);
        const lookup = state.idlookup;
        const dObject = lookup?.[childObjectId];
        const metaclassId = dObject?.instanceof;
        if (typeof metaclassId !== 'string') { clearCrossDeps(childObjectId); return null; }
        const index = getIRIndex(state, irSig);
        const readCtx = makeReadCtx(lookup);
        let compiled: CompiledRowView | null =
            index ? resolveRowView(childObjectId, metaclassId, index, readCtx, lookup) : null;
        if (!compiled) compiled = compileRowView(IR_DEFAULT_ROW_VIEW_ID, defaultRowViewIR());
        const cross = resolveCrossDeps(lookup, childObjectId, compiled.crossPaths);
        publishCrossDeps(childObjectId, cross.fids);
        if (cross.unresolved.length) warnUnresolvedCrossDeps(cross.unresolved, compiled.viewId);
        if (cross.capped) warnCappedCrossDeps(compiled.viewId);
        return { compiled, objectId: childObjectId, readCtx };
    }, [signature, childObjectId, markDep]);
}

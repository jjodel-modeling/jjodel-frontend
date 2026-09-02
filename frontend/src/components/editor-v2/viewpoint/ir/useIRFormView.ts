/**
 * useIRFormView — resolve the IR view of an object for the FORM host.
 *
 * Same job as `useIRView`, one difference that is the whole reason this exists:
 * `useIRView` is keyed on the DVertex id and reaches the object through
 * `lookup[vertexId].model`. The form's hosts do not have a vertex. The rail's subject
 * may be an object selected in the tree, in a closed graph, or off-canvas entirely, and
 * the form document (Slice 3) has no canvas at all.
 *
 * The pattern is not invented here: `useIRRowView` already keys the identical
 * subscription on a DObject id, for the containment children rendered as rows. This is
 * that hook with `resolveIRView` in place of `resolveRowView`, so node views resolve
 * instead of row views.
 *
 * Returns `{ compiled: null }` rather than a bare null when the object exists but no
 * view matches, because for the form the two cases render DIFFERENTLY and null cannot
 * tell them apart: no view means "fall back to the metamodel-derived default form"
 * (spec v1.2 sez. 10), which is the state most models are in before anyone authors a
 * `form`. A bare null is reserved for "there is no object here to render".
 */

import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { store } from '../../../../joiner';
import { useSimVersion } from '../../sim/simRunState';
import { type ReadCtx } from './irReadCtx';
import { makeReadCtx } from './irReadCtxLproxy';
import type { CompiledView } from './irTypes';
import { computeIRSignature, getIRIndex, resolveIRView } from './irResolveCore';
import {
    clearCrossDeps,
    crossDepsSignature,
    publishCrossDeps,
    resolveCrossDeps,
    warnCappedCrossDeps,
    warnUnresolvedCrossDeps,
} from './irCrossDeps';

export interface IRFormResolution {
    /** The resolved node view, or null when no view of the active viewpoint matches
     *  this object — the form then renders the metamodel-derived default. */
    compiled: CompiledView | null;
    objectId: string;
    readCtx: ReadCtx;
}

/**
 * Cross-dep publication key.
 *
 * `publishCrossDeps` is keyed by whatever id the caller passes, and `useIRView` passes
 * the vertex id for the same object. Passing the bare object id here would make the two
 * hooks fight over one entry whenever a node and a form show the same object: the last
 * one to render would overwrite the other's dependency set. The prefix gives the form
 * its own slot in that registry, so canvas and form subscribe independently.
 */
function formDepKey(objectId: string): string {
    return `form:${objectId}`;
}

export function useIRFormView(objectId: string | undefined): IRFormResolution | null {
    // Slot snapshot of the object, exactly as useIRView/useIRRowView build it: the whole
    // feature set, unfiltered by any dependency set. For the form that is not a
    // concession but the requirement — a form reads every feature, not only the ones the
    // view's PathExprs mention.
    const signature = useSelector((state: any) => {
        if (!objectId) return '';
        const irSig = computeIRSignature(state);
        const lookup = state.idlookup;
        const dObject = lookup?.[objectId];
        if (!dObject) return '';
        // The object's own name is in the snapshot because the form header shows it and
        // the name field edits it. useIRView can leave it out (a canvas label reads it
        // through the accessor, whose value lands in the slot snapshot); here it is a
        // first-class field of the rendering.
        const snap: string[] = [irSig || '-', objectId, dObject.instanceof ?? '', dObject.name ?? ''];
        if (Array.isArray(dObject.features)) {
            for (const fid of dObject.features) {
                const dv = lookup?.[fid];
                if (dv && Array.isArray(dv.values)) snap.push(`${fid}=${JSON.stringify(dv.values)}`);
            }
        }
        const crossSig = crossDepsSignature(lookup, formDepKey(objectId));
        return crossSig ? `${snap.join(';')};X${crossSig}` : snap.join(';');
    });

    // Declared-channel gate (R-MK-5/R-MK-6), same shape as the two sibling hooks: the
    // subscription is unconditional (rules of hooks) but the value only reaches the memo
    // when the active index declares the channel, so a viewpoint that never reads
    // `marked` re-resolves exactly as it did before markings existed.
    const markVersion = useSimVersion();
    const markDeclared = useMemo(() => {
        const state: any = store.getState();
        const irSig = computeIRSignature(state);
        const index = irSig ? getIRIndex(state, irSig) : null;
        return !!index?.channelsInUse?.has('mark');
    }, [signature]);   // eslint-disable-line react-hooks/exhaustive-deps
    const markDep = markDeclared ? markVersion : 0;

    useEffect(() => () => { if (objectId) clearCrossDeps(formDepKey(objectId)); }, [objectId]);

    return useMemo(() => {
        if (!objectId || !signature) {
            if (objectId) clearCrossDeps(formDepKey(objectId));
            return null;
        }
        const state: any = store.getState();
        const lookup = state.idlookup;
        const dObject = lookup?.[objectId];
        if (!dObject) { clearCrossDeps(formDepKey(objectId)); return null; }
        const readCtx = makeReadCtx(lookup);

        const metaclassId = dObject.instanceof;
        const irSig = computeIRSignature(state);
        const index = irSig ? getIRIndex(state, irSig) : null;
        // No viewpoint, no metaclass (a shapeless instance), or no matching view: all
        // three resolve to the default form, which is derived from whatever the object
        // does have. None of them is an error.
        let compiled: CompiledView | null = null;
        if (index && typeof metaclassId === 'string') {
            compiled = resolveIRView(objectId, metaclassId, index, readCtx, lookup);
        }

        if (compiled) {
            const cross = resolveCrossDeps(lookup, objectId, compiled.crossPaths);
            publishCrossDeps(formDepKey(objectId), cross.fids);
            if (cross.unresolved.length) warnUnresolvedCrossDeps(cross.unresolved, compiled.viewId);
            if (cross.capped) warnCappedCrossDeps(compiled.viewId);
        } else {
            clearCrossDeps(formDepKey(objectId));
        }

        return { compiled, objectId, readCtx };
    }, [signature, objectId, markDep]);
}

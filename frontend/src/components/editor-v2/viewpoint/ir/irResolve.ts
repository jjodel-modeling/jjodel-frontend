/**
 * irResolve — IR-native view resolution for EditorV2.
 *
 * This resolver operates ONLY on views carrying the `ir` field. It never calls
 * getAppliedViewsNew and never touches transientProperties: the classic
 * resolver and this one coexist without overlap (a viewpoint is IR or classic,
 * never both — decision 2026-07-17).
 *
 * Resolution order (explicit IR rule, sessione 2026-07-17_2):
 *   1. explicit `priority` (higher wins; absent = 0)
 *   2. metaclass specificity (exact match > match via inheritance)
 *   3. declaration order of the view inside the viewpoint (state.viewelements order)
 *
 * The per-metaclass index is (re)built when the signature of the active
 * viewpoint's IR views changes; dispatch stays O(#candidate views), never
 * O(model).
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { store } from '../../../../joiner';
import { compileView } from './irCompile';
import { classAncestryNames, makeReadCtx, type ReadCtx } from './irReadCtx';
import type { CompiledView, VertexViewIR } from './irTypes';
import { ensureViewCss, removeViewCss } from './irStyle';

interface IndexEntry {
    compiled: CompiledView;
    declarationIndex: number;
}

export interface IRViewpointIndex {
    viewpointId: string;
    /** metaclass name → views declared for it (declaration order preserved) */
    byMetaclass: Map<string, IndexEntry[]>;
    /** all IR view ids, for style lifecycle */
    viewIds: string[];
}

/** Structural-change signature of the ir objects of the active viewpoint (WeakMap: D-layer replaces refs on change). */
const irRefHashes = new WeakMap<object, string>();
let hashCounter = 0;
function refToken(ir: object): string {
    let t = irRefHashes.get(ir);
    if (!t) { t = 'r' + (++hashCounter); irRefHashes.set(ir, t); }
    return t;
}

/**
 * Signature of (active viewpoint, its IR views). Cheap: iterates the
 * viewelements pointer list only. Changes when the viewpoint changes, an IR
 * view is added/removed, or any ir object is replaced (edited).
 */
export function computeIRSignature(state: any): string {
    const vp = state.viewpoint;
    if (!vp) return '';
    const lookup = state.idlookup;
    const parts: string[] = [vp];
    const list: string[] = state.viewelements ?? [];
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== vp) continue;
        const ir = (d as any).ir;
        if (ir && typeof ir === 'object') parts.push(`${vid}:${refToken(ir)}`);
    }
    return parts.length > 1 ? parts.join('|') : '';
}

const indexCache = new Map<string, IRViewpointIndex>();

/** Build (or fetch cached) the per-metaclass index for the active viewpoint. */
export function getIRIndex(state: any, signature: string): IRViewpointIndex | null {
    if (!signature) return null;
    const cached = indexCache.get(signature);
    if (cached) return cached;

    const vp = state.viewpoint as string;
    const lookup = state.idlookup;
    const byMetaclass = new Map<string, IndexEntry[]>();
    const viewIds: string[] = [];
    let declarationIndex = 0;
    const list: string[] = state.viewelements ?? [];
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== vp) continue;
        const ir = (d as any).ir as VertexViewIR | undefined;
        if (!ir || typeof ir !== 'object' || ir.kind !== 'vertex') continue;
        if (ir.exclusive === false) continue; // spike: decorative views ignored
        let compiled: CompiledView;
        try {
            compiled = compileView(vid, ir);
        } catch (e) {
            // A malformed ir must never take the canvas down: skip the view.
            console.warn('[ir] compile failed for view', vid, e);
            continue;
        }
        const entry: IndexEntry = { compiled, declarationIndex: declarationIndex++ };
        for (const mc of ir.metaclasses ?? []) {
            const arr = byMetaclass.get(mc) ?? [];
            arr.push(entry);
            byMetaclass.set(mc, arr);
        }
        viewIds.push(vid);
        ensureViewCss(vid, ir);
    }
    if (viewIds.length === 0) return null;

    // Style lifecycle: drop css of views from previous signatures of this viewpoint.
    for (const [oldSig, oldIdx] of indexCache) {
        if (oldIdx.viewpointId === vp && oldSig !== signature) {
            for (const oldVid of oldIdx.viewIds) if (!viewIds.includes(oldVid)) removeViewCss(oldVid);
            indexCache.delete(oldSig);
        }
    }

    const idx: IRViewpointIndex = { viewpointId: vp, byMetaclass, viewIds };
    indexCache.set(signature, idx);
    return idx;
}

/**
 * Resolve the IR view for an object given its metaclass id.
 * Returns null when no IR view of the active viewpoint applies.
 */
export function resolveIRView(
    objectId: string,
    metaclassId: string,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Record<string, any>,
): CompiledView | null {
    const ancestry = classAncestryNames(idlookup, metaclassId); // [self, ...ancestors]
    if (ancestry.length === 0) return null;
    const selfName = ancestry[0];

    type Candidate = { entry: IndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<IndexEntry>();
    const exact = index.byMetaclass.get(selfName);
    if (exact) for (const e of exact) { if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: 2 }); } }
    for (let i = 1; i < ancestry.length; i++) {
        const inh = index.byMetaclass.get(ancestry[i]);
        if (inh) for (const e of inh) { if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: 1 }); } }
    }
    if (candidates.length === 0) return null;

    candidates.sort((a, b) =>
        (b.entry.compiled.priority - a.entry.compiled.priority)
        || (b.specificity - a.specificity)
        || (a.entry.declarationIndex - b.entry.declarationIndex)
    );

    for (const c of candidates) {
        try {
            if (c.entry.compiled.predicate(readCtx, objectId)) return c.entry.compiled;
        } catch {
            // predicate failure = no match, never a crash
        }
    }
    return null;
}

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
        return snap.join(';');
    });

    return useMemo(() => {
        if (!signature || !instanceOfClassId) return null;
        const state: any = store.getState();
        const irSig = computeIRSignature(state);
        const index = getIRIndex(state, irSig);
        if (!index) return null;
        const lookup = state.idlookup;
        const objectId = lookup?.[vertexId]?.model;
        if (typeof objectId !== 'string') return null;
        const readCtx = makeReadCtx(lookup);
        const compiled = resolveIRView(objectId, instanceOfClassId, index, readCtx, lookup);
        if (!compiled) return null;
        return { compiled, objectId, readCtx };
    }, [signature, vertexId, instanceOfClassId]);
}

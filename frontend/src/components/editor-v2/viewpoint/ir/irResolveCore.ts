/**
 * irResolveCore — pure IR resolution (index build + deterministic ordering).
 *
 * No joiner/react imports: unit-testable in the node vitest environment.
 * Semantics: spec v1.2 sez. 2 (priority > specificity exact/inherited/wildcard
 * > declaration order). See irResolve.ts for the React hook wiring.
 */

import { compileEdgeView, compileView } from './irCompile';
import { classAncestryNames, type ReadCtx } from './irReadCtx';
import type { AnyViewIR, CompiledEdgeView, CompiledView, EdgeViewIR } from './irTypes';
import { ensureViewCss, removeViewCss } from './irStyle';

export interface IndexEntry {
    compiled: CompiledView;
    declarationIndex: number;
}

export interface EdgeIndexEntry {
    compiled: CompiledEdgeView;
    declarationIndex: number;
}

export interface IRViewpointIndex {
    viewpointId: string;
    /** metaclass name → views declared for it (declaration order preserved) */
    byMetaclass: Map<string, IndexEntry[]>;
    /** wildcard views (metaclasses: '*') — default-view semantics, minimum specificity */
    wildcard: IndexEntry[];
    /** reference-as-edge views, keyed by SOURCE metaclass name (+ wildcard) */
    edgeByMetaclass: Map<string, EdgeIndexEntry[]>;
    edgeWildcard: EdgeIndexEntry[];
    /** object-as-edge views, keyed by the edge-object metaclass name */
    objectAsEdgeByMetaclass: Map<string, EdgeIndexEntry[]>;
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
    const wildcard: IndexEntry[] = [];
    const edgeByMetaclass = new Map<string, EdgeIndexEntry[]>();
    const edgeWildcard: EdgeIndexEntry[] = [];
    const objectAsEdgeByMetaclass = new Map<string, EdgeIndexEntry[]>();
    const viewIds: string[] = [];
    let declarationIndex = 0;
    const list: string[] = state.viewelements ?? [];
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== vp) continue;
        const ir = (d as any).ir as AnyViewIR | undefined;
        if (!ir || typeof ir !== 'object') continue;
        if (ir.kind === 'edge') {
            let compiledE: CompiledEdgeView;
            try {
                compiledE = compileEdgeView(vid, ir as EdgeViewIR);
            } catch (e) {
                console.warn('[ir] edge compile failed for view', vid, e);
                continue;
            }
            const entry: EdgeIndexEntry = { compiled: compiledE, declarationIndex: declarationIndex++ };
            if (compiledE.isObjectAsEdge) {
                if (ir.metaclasses !== '*') {
                    for (const mc of ir.metaclasses ?? []) {
                        const arr = objectAsEdgeByMetaclass.get(mc) ?? [];
                        arr.push(entry);
                        objectAsEdgeByMetaclass.set(mc, arr);
                    }
                }
            } else if (ir.metaclasses === '*') {
                edgeWildcard.push(entry);
            } else {
                for (const mc of ir.metaclasses ?? []) {
                    const arr = edgeByMetaclass.get(mc) ?? [];
                    arr.push(entry);
                    edgeByMetaclass.set(mc, arr);
                }
            }
            viewIds.push(vid);
            continue;
        }
        if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue;
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
        if (ir.metaclasses === '*') {
            wildcard.push(entry);
        } else {
            for (const mc of ir.metaclasses ?? []) {
                const arr = byMetaclass.get(mc) ?? [];
                arr.push(entry);
                byMetaclass.set(mc, arr);
            }
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

    const idx: IRViewpointIndex = {
        viewpointId: vp, byMetaclass, wildcard,
        edgeByMetaclass, edgeWildcard, objectAsEdgeByMetaclass, viewIds,
    };
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
    for (const e of index.wildcard) { if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: 0 }); } }
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


/**
 * Resolve the reference-as-edge view for an M1 reference edge.
 * `sourceMetaclassId` = metaclass of the SOURCE object; `referenceName`
 * restricts matching to views declaring the same `reference` (views without
 * `reference` match any). Ordering: spec v1.2 sez. 2 (reference-specific views
 * gain +0.5 specificity over unnamed ones within the same tier).
 */
export function resolveEdgeView(
    sourceObjectId: string,
    sourceMetaclassId: string,
    referenceName: string,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Record<string, any>,
): CompiledEdgeView | null {
    const ancestry = classAncestryNames(idlookup, sourceMetaclassId);
    if (ancestry.length === 0) return null;
    type Candidate = { entry: EdgeIndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<EdgeIndexEntry>();
    const push = (entries: EdgeIndexEntry[] | undefined, spec: number) => {
        if (!entries) return;
        for (const e of entries) {
            if (seen.has(e)) continue;
            const ref = e.compiled.reference;
            if (ref !== null && ref !== referenceName) continue;
            seen.add(e);
            candidates.push({ entry: e, specificity: spec + (ref !== null ? 0.5 : 0) });
        }
    };
    push(index.edgeByMetaclass.get(ancestry[0]), 2);
    for (let i = 1; i < ancestry.length; i++) push(index.edgeByMetaclass.get(ancestry[i]), 1);
    push(index.edgeWildcard, 0);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) =>
        (b.entry.compiled.priority - a.entry.compiled.priority)
        || (b.specificity - a.specificity)
        || (a.entry.declarationIndex - b.entry.declarationIndex)
    );
    for (const c of candidates) {
        try {
            if (c.entry.compiled.predicate(readCtx, sourceObjectId)) return c.entry.compiled;
        } catch { /* no match, never a crash */ }
    }
    return null;
}

/** Resolve the object-as-edge view for an object (Transition pattern). */
export function resolveObjectAsEdgeView(
    objectId: string,
    metaclassId: string,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Record<string, any>,
): CompiledEdgeView | null {
    if (index.objectAsEdgeByMetaclass.size === 0) return null;
    const ancestry = classAncestryNames(idlookup, metaclassId);
    type Candidate = { entry: EdgeIndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<EdgeIndexEntry>();
    for (let i = 0; i < ancestry.length; i++) {
        const entries = index.objectAsEdgeByMetaclass.get(ancestry[i]);
        if (!entries) continue;
        for (const e of entries) {
            if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: i === 0 ? 2 : 1 }); }
        }
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
        } catch { /* no match */ }
    }
    return null;
}

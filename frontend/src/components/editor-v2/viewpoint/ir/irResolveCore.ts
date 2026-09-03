/**
 * irResolveCore — pure IR resolution (index build + deterministic ordering).
 *
 * No joiner/react imports: unit-testable in the node vitest environment.
 * Semantics: spec v1.2 sez. 2 (priority > specificity exact/inherited/wildcard
 * > declaration order). See irResolve.ts for the React hook wiring.
 */

import { compileEdgeView, compileRowView, compileView } from './irCompile';
import { classAncestry, type ClassAncestor, type ReadCtx } from './irReadCtx';
import type { AnyViewIR, AuthoringMetaclassPins, CompiledEdgeView, CompiledRowView, CompiledView, EdgeViewIR, RowViewIR } from './irTypes';
import { ensureViewCss, removeViewCss } from './irStyle';

export interface IndexEntry {
    compiled: CompiledView;
    declarationIndex: number;
    /** The view's metaclass pins, verbatim from its ir. See `pinAccepts`. */
    pins?: AuthoringMetaclassPins;
}

export interface EdgeIndexEntry {
    compiled: CompiledEdgeView;
    declarationIndex: number;
    pins?: AuthoringMetaclassPins;
}

export interface RowIndexEntry {
    compiled: CompiledRowView;
    declarationIndex: number;
    pins?: AuthoringMetaclassPins;
}

/**
 * Whether an entry filed under `name` accepts the ancestor that carried that name.
 *
 * The buckets are keyed by NAME, and a project can hold two metamodels that both
 * declare `Person`: without this check a view authored on one of them applies to
 * the instances of the other. The pin, written by the authoring panels next to
 * `metaclasses`, says which class was meant; the ancestor's ID says which class
 * the instance actually descends from.
 *
 * A view with no pin for that name matches by name exactly as before: every view
 * authored before the pin existed, and every ir written by hand, keeps working.
 * The comparison is per ancestor, so inheritance is untouched — a view pinned to
 * `A.Person` still matches an instance of `A.Employee`, which reaches the bucket
 * through the `A.Person` ancestor.
 */
export function pinAccepts(entry: { pins?: AuthoringMetaclassPins }, name: string, classId: string): boolean {
    const pinned = entry.pins?.[name];
    return !pinned || pinned === classId;
}

/**
 * Shared candidate ordering (spec v1.2 sez. 2): priority desc, then specificity
 * desc, then declaration order asc. Extracted (Fase R1) from the three resolvers so
 * vertex, reference-edge, object-as-edge and row all order identically — same
 * semantics and tie-breaks as the previous inline sorts.
 */
export function compareCandidates(
    a: { entry: { compiled: { priority: number }; declarationIndex: number }; specificity: number },
    b: { entry: { compiled: { priority: number }; declarationIndex: number }; specificity: number },
): number {
    return (b.entry.compiled.priority - a.entry.compiled.priority)
        || (b.specificity - a.specificity)
        || (a.entry.declarationIndex - b.entry.declarationIndex);
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
    /** row views (compartment dispatch context, Fase R1), keyed by metaclass name (+ wildcard) */
    rowByMetaclass: Map<string, RowIndexEntry[]>;
    rowWildcard: RowIndexEntry[];
    /** all IR view ids, for style lifecycle */
    viewIds: string[];
    /**
     * Union of the CHANNELS declared by every compiled entry of this index —
     * nodes, rows and edges together (R-MK-5). A channel is a non-feature
     * dependency: a global version counter the resolvers subscribe to.
     *
     * Union at index level, not per element, and that is the declared v1
     * granularity (R-MK-6): the resolvers need to know whether to append a
     * channel version BEFORE resolving, and at that point they do not yet know
     * which view will win. The precedent is `oaeSlotsSig`, which unions the
     * dependency sets of the object-as-edge views the same way. Per-element
     * granularity is a future refinement, to be opened on a measurement.
     *
     * Optional by rule 11 (exported interface): always populated by getIRIndex,
     * the only constructor in the repo.
     */
    channelsInUse?: ReadonlySet<string>;
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
    const rowByMetaclass = new Map<string, RowIndexEntry[]>();
    const rowWildcard: RowIndexEntry[] = [];
    const viewIds: string[] = [];
    const channelsInUse = new Set<string>();
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
            for (const ch of compiledE.channels ?? []) channelsInUse.add(ch);
            const entry: EdgeIndexEntry = { compiled: compiledE, declarationIndex: declarationIndex++, pins: ir.authoringMetaclassPins };
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
        if (ir.kind === 'row') {
            let compiledR: CompiledRowView;
            try {
                compiledR = compileRowView(vid, ir as RowViewIR);
            } catch (e) {
                // A malformed row ir must never take the canvas down: skip the view.
                console.warn('[ir] row compile failed for view', vid, e);
                continue;
            }
            for (const ch of compiledR.channels ?? []) channelsInUse.add(ch);
            const entry: RowIndexEntry = { compiled: compiledR, declarationIndex: declarationIndex++, pins: ir.authoringMetaclassPins };
            if (ir.metaclasses === '*') {
                rowWildcard.push(entry);
            } else {
                for (const mc of ir.metaclasses ?? []) {
                    const arr = rowByMetaclass.get(mc) ?? [];
                    arr.push(entry);
                    rowByMetaclass.set(mc, arr);
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
        for (const ch of compiled.channels ?? []) channelsInUse.add(ch);
        const entry: IndexEntry = { compiled, declarationIndex: declarationIndex++, pins: ir.authoringMetaclassPins };
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
        edgeByMetaclass, edgeWildcard, objectAsEdgeByMetaclass,
        rowByMetaclass, rowWildcard, viewIds, channelsInUse,
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
    const ancestry = classAncestry(idlookup, metaclassId); // [self, ...ancestors]
    if (ancestry.length === 0) return null;
    const self = ancestry[0];

    type Candidate = { entry: IndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<IndexEntry>();
    // An entry rejected by the pin at one tier is NOT marked seen: the same view may
    // legitimately match through another ancestor it pinned correctly.
    const exact = index.byMetaclass.get(self.name);
    if (exact) for (const e of exact) { if (!seen.has(e) && pinAccepts(e, self.name, self.id)) { seen.add(e); candidates.push({ entry: e, specificity: 2 }); } }
    for (let i = 1; i < ancestry.length; i++) {
        const a = ancestry[i];
        const inh = index.byMetaclass.get(a.name);
        if (inh) for (const e of inh) { if (!seen.has(e) && pinAccepts(e, a.name, a.id)) { seen.add(e); candidates.push({ entry: e, specificity: 1 }); } }
    }
    for (const e of index.wildcard) { if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: 0 }); } }
    if (candidates.length === 0) return null;

    candidates.sort(compareCandidates);

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
    const ancestry = classAncestry(idlookup, sourceMetaclassId);
    if (ancestry.length === 0) return null;
    type Candidate = { entry: EdgeIndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<EdgeIndexEntry>();
    // `via` is the ancestor whose name keyed the bucket, or null for the wildcard
    // bucket, which no name (and therefore no pin) filed.
    const push = (via: ClassAncestor | null, entries: EdgeIndexEntry[] | undefined, spec: number) => {
        if (!entries) return;
        for (const e of entries) {
            if (seen.has(e)) continue;
            if (via && !pinAccepts(e, via.name, via.id)) continue;
            const ref = e.compiled.reference;
            if (ref !== null && ref !== referenceName) continue;
            seen.add(e);
            candidates.push({ entry: e, specificity: spec + (ref !== null ? 0.5 : 0) });
        }
    };
    push(ancestry[0], index.edgeByMetaclass.get(ancestry[0].name), 2);
    for (let i = 1; i < ancestry.length; i++) push(ancestry[i], index.edgeByMetaclass.get(ancestry[i].name), 1);
    push(null, index.edgeWildcard, 0);
    if (candidates.length === 0) return null;
    candidates.sort(compareCandidates);
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
    const ancestry = classAncestry(idlookup, metaclassId);
    type Candidate = { entry: EdgeIndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<EdgeIndexEntry>();
    for (let i = 0; i < ancestry.length; i++) {
        const a = ancestry[i];
        const entries = index.objectAsEdgeByMetaclass.get(a.name);
        if (!entries) continue;
        for (const e of entries) {
            if (!seen.has(e) && pinAccepts(e, a.name, a.id)) { seen.add(e); candidates.push({ entry: e, specificity: i === 0 ? 2 : 1 }); }
        }
    }
    if (candidates.length === 0) return null;
    candidates.sort(compareCandidates);
    for (const c of candidates) {
        try {
            if (c.entry.compiled.predicate(readCtx, objectId)) return c.entry.compiled;
        } catch { /* no match */ }
    }
    return null;
}

/**
 * Resolve the row view for a containment child given its metaclass id (Fase R1).
 * Same ordering as vertices (priority > specificity exact/inherited/wildcard >
 * declaration order, shared compareCandidates) but over the dedicated row buckets:
 * a vertex view is never a row candidate and vice versa. Returns null when no row
 * view of the active viewpoint applies. Consumed by the R2 compartment dispatch.
 */
export function resolveRowView(
    objectId: string,
    metaclassId: string,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Record<string, any>,
): CompiledRowView | null {
    const ancestry = classAncestry(idlookup, metaclassId); // [self, ...ancestors]
    if (ancestry.length === 0) return null;
    const self = ancestry[0];

    type Candidate = { entry: RowIndexEntry; specificity: number };
    const candidates: Candidate[] = [];
    const seen = new Set<RowIndexEntry>();
    const exact = index.rowByMetaclass.get(self.name);
    if (exact) for (const e of exact) { if (!seen.has(e) && pinAccepts(e, self.name, self.id)) { seen.add(e); candidates.push({ entry: e, specificity: 2 }); } }
    for (let i = 1; i < ancestry.length; i++) {
        const a = ancestry[i];
        const inh = index.rowByMetaclass.get(a.name);
        if (inh) for (const e of inh) { if (!seen.has(e) && pinAccepts(e, a.name, a.id)) { seen.add(e); candidates.push({ entry: e, specificity: 1 }); } }
    }
    for (const e of index.rowWildcard) { if (!seen.has(e)) { seen.add(e); candidates.push({ entry: e, specificity: 0 }); } }
    if (candidates.length === 0) return null;

    candidates.sort(compareCandidates);

    for (const c of candidates) {
        try {
            if (c.entry.compiled.predicate(readCtx, objectId)) return c.entry.compiled;
        } catch {
            // predicate failure = no match, never a crash
        }
    }
    return null;
}

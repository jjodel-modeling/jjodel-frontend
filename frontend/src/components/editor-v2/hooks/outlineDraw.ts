/**
 * outlineDraw — the importless half of the D-graph OUTLINE adapter (slice 10b).
 *
 * Same split, same reason, as `multiDraw.ts`, `createDraw.ts` and `deleteDraw.ts`
 * next door (R-FORM-5): the `*Adapter.ts` files import the joiner barrel, the
 * barrel reaches monaco, monaco dereferences `window` at import time, and a unit
 * test that touched anything in them would die at import. Everything here is a
 * pure function of a plain `idlookup`, and the modules it imports — `irReadCtx`
 * and `createDraw` — are themselves importless in that sense.
 *
 * ── Nothing is walked twice, and nothing is invented ──────────────────────────
 *
 * The containment graph was already walkable before this slice, in functions that
 * exist for other surfaces:
 *
 *  - `createDraw.ownerOf` — «null» means the MODEL owns it directly, which is the
 *    predicate of an outline root;
 *  - `createDraw.modelOfObject` — membership by backward link (§3.6), never by the
 *    forward `DModel.objects`, which holds roots only and is stale after a parse;
 *  - `irReadCtx.makeDrawReadCtx` — the naming rule (identity slot, then
 *    `DObject.name`, then `initialName`), so the outline labels a node exactly as
 *    the table labels its row and the breadcrumb labels its segment.
 *
 * What this module adds is the recursion, the ORDER, and the one thing the
 * existing walk deliberately throws away — see below.
 *
 * ── `childrenIn` is not enough, and that is the point ─────────────────────────
 *
 * `multiDraw.childrenIn` drops a slot value that does not resolve to a live
 * DObject, because an inline sub-form mounted on a phantom would render an empty
 * shell instead of nothing. The outline is the opposite surface: a dangling
 * pointer is a fact about the model's structure, and a tree that silently omits it
 * tells the user their model is fine when it is not. So the slot is read RAW here
 * and an unresolved value becomes a `broken` node — the same token the table
 * paints for the same state (`instance-manager__broken`, 12d).
 *
 * ── Order, declared ───────────────────────────────────────────────────────────
 *
 *  - children: the SHAPE's order of the containment features, then the array order
 *    inside each slot. Both are orders the metamodel and the user chose; sorting
 *    them alphabetically would make the tree disagree with the form beside it.
 *  - roots: the discovery order of `idlookup`, which is insertion order and stable
 *    across renders. NOT alphabetical, and NOT `DModel.objects`: the first is a
 *    directory's rule and this is a model, the second is the forward collection
 *    that §3.6 says is stale.
 *
 * ── One node per instance, and why it was not one before (10g) ────────────────
 *
 * Containment is a FUNCTION: an instance has ONE owner. The tree drew it as a
 * relation, because its two halves read two different sources — the roots from
 * `father` (`ownerOf(id) === null`), the children from the owner's slot `values` —
 * and nothing made the two agree. An instance listed in a containment slot whose
 * `father` was never moved off the model therefore rendered TWICE: once as a root,
 * once as that slot's child. Measured on the real app (10g referto): 14 nodes for
 * 11 instances, the three extra being exactly the three whose slot write did not
 * carry the `father` side-effect.
 *
 * The rule this file now holds: a slot value is drawn as a child of `X` only when
 * `ownerOf(value) === X`. `ownerOf` is `createDraw`'s — the SAME resolver the ego
 * neighbourhood (13a, `ownerLinkOf`) and `instancesUnder` already read, not a
 * second one. Composition is not re-tested inside it: the walk only ever visits
 * `ClassShape.children`, which `shapeAdapter` builds from `composition === true`,
 * so the containment side of «father + composition» is already enforced one line
 * up. Pushing the test down into `ownerOf` would change a resolver shared with two
 * other surfaces (Rule 20) for no measured gain.
 *
 * A value that resolves to nothing is still a `broken` node — the filter is on
 * OWNERSHIP, and a dangling pointer has no owner to disagree with.
 *
 * ── The sweep, and the invariant it buys ──────────────────────────────────────
 *
 * The filter alone makes duplicates impossible but not the count exact: an
 * instance whose `father` names an owner that never draws it — a containment
 * flipped to `false` after the write, a slot emptied without detaching — would be
 * neither root nor child, and DISAPPEAR. That is the worse half of the same
 * defect. After the root walk, such an instance is appended at root level, so the
 * count is `instances + 1` by construction, in either direction.
 *
 * The sweep is DELIBERATELY not unconditional. It fires only when the owner's
 * metaclass IS in the shape — that is, when the shape had its say and still did
 * not draw the child. A shape that is null, or missing the owner's class, is a
 * metamodel mid-load: there the tree is knowably incomplete, and flattening every
 * contained instance to root level would turn a two-frame load into a visible
 * shuffle. Those two states keep exactly the rendering 10b committed, and the
 * `instances + 1` invariant is claimed for a LOADED shape, which is the state the
 * acceptance criterion is written on.
 */

import { findFeatureRaw, makeDrawReadCtx } from '../viewpoint/ir/irReadCtx';
import { modelOfObject, ownerOf } from './createDraw';
import type { MetamodelShape, OutlineNode } from '../../../jjform';

type Idlookup = Record<string, any>;

/** The values a slot holds, holes excluded, WITHOUT the liveness filter.
 *  The hole filter is `createDraw.filledSlotValues`'s and is the same everywhere
 *  (`clearSlotValue` assigns a hole rather than splicing); the liveness filter is
 *  the one this module must not apply — see the header. */
function rawSlotValues(idlookup: Idlookup, ownerId: string, featureKey: string): string[] {
    const slot = findFeatureRaw(idlookup, ownerId, featureKey);
    const raw: unknown[] = Array.isArray(slot?.values) ? slot.values : [];
    return raw.filter(v => v != null && String(v).trim() !== '').map(v => String(v));
}

/**
 * The instances `modelId` owns DIRECTLY — the roots of the outline.
 *
 * One pass over the lookup, and the test is `ownerOf(id) === null` and not «father
 * is the model»: the two agree, but the first is the predicate `createDraw` already
 * publishes and `instancesUnder` already uses for the same question.
 */
export function outlineRoots(idlookup: Idlookup, modelId: string): string[] {
    const out: string[] = [];
    if (!idlookup || !modelId) return out;
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DObject') continue;
        if (ownerOf(idlookup, id) !== null) continue;
        if (modelOfObject(idlookup, id) !== modelId) continue;
        out.push(id);
    }
    return out;
}

/**
 * The whole containment tree of `modelId`, model node first.
 *
 * Returns the MODEL as the root node, not a list of roots: the model is where a
 * rootable create is offered from (`rootMenu`), so it has to be a node with a «+»
 * like any other, and mock 1b draws it as one.
 *
 * `shape` is what says which features are containment features. An object whose
 * metaclass is absent from the shape renders as a childless node rather than
 * disappearing: a half-loaded metamodel must not delete a branch of the model.
 *
 * `depthCap` and the `emitted` set are a cycle belt, not a semantic limit: the core
 * refuses to write a containment cycle (`LValue.setValueAtPosition` returns
 * `{success:false}`), so a tree this deep is already corrupt and stopping beats
 * looping.
 */
export function outlineTree(
    idlookup: Idlookup,
    modelId: string,
    shape: MetamodelShape | null,
    depthCap = 64,
): OutlineNode {
    const ctx = makeDrawReadCtx(idlookup);
    const model = idlookup?.[modelId];
    const root: OutlineNode = {
        id: modelId,
        name: typeof model?.name === 'string' ? model.name : '',
        cls: '',
        kind: 'model',
        depth: 0,
        childKey: null,
        children: [],
    };
    if (!idlookup || !modelId) return root;

    /** Every instance already drawn. Doubles as the cycle belt: a node reached a
     *  second time is not drawn a second time, it is not drawn at all. */
    const emitted = new Set<string>();

    const nodeOf = (id: string, depth: number, childKey: string | null): OutlineNode => {
        const d = idlookup[id];
        if (d?.className !== 'DObject') {
            return { id, name: '', cls: '', kind: 'broken', depth, childKey, children: [] };
        }
        emitted.add(id);
        const node: OutlineNode = {
            id,
            name: ctx.getName(id) ?? '',
            cls: ctx.getMetaclassName(id) ?? '',
            kind: 'object',
            depth,
            childKey,
            children: [],
        };
        if (depth >= depthCap) return node;   // cycle belt
        const cls = node.cls ? shape?.classes?.[node.cls] : null;
        for (const child of cls?.children ?? []) {
            for (const value of rawSlotValues(idlookup, id, child.key)) {
                if (idlookup[value]?.className === 'DObject') {
                    // The owner is the one the D-graph names, not the one that
                    // happens to list it: a slot value whose `father` points
                    // elsewhere renders THERE, once.
                    if (ownerOf(idlookup, value) !== id) continue;
                    if (emitted.has(value)) continue;
                }
                node.children.push(nodeOf(value, depth + 1, child.key));
            }
        }
        return node;
    };

    // No `emitted` guard here: a root has no owner, and the walk only descends
    // into values whose owner it IS, so a root cannot already be someone's child.
    for (const id of outlineRoots(idlookup, modelId)) root.children.push(nodeOf(id, 1, null));
    // The sweep — see the header. Same discovery order as the roots, so an
    // orphan lands where insertion order says and not at some sorted position.
    for (const id in idlookup) {
        if (emitted.has(id)) continue;
        if (idlookup[id]?.className !== 'DObject') continue;
        if (modelOfObject(idlookup, id) !== modelId) continue;
        // Its owner's class must be one the shape knows: a missing class is a
        // metamodel still loading, not an orphan.
        const ownerId = ownerOf(idlookup, id);
        const ownerCls = ownerId ? ctx.getMetaclassName(ownerId) : null;
        if (!ownerCls || !shape?.classes?.[ownerCls]) continue;
        root.children.push(nodeOf(id, 1, null));
    }
    return root;
}

/**
 * The tree as the rows a list renders, parents before children.
 *
 * `isOpen` decides per node; a closed node contributes itself and none of its
 * descendants. Kept here rather than in the component because it is the one piece
 * of the rendering that is a function of the tree alone, and therefore the one
 * piece a test can hold.
 */
export function outlineRows(root: OutlineNode | null, isOpen: (node: OutlineNode) => boolean): OutlineNode[] {
    const out: OutlineNode[] = [];
    const push = (node: OutlineNode) => {
        out.push(node);
        if (node.children.length === 0 || !isOpen(node)) return;
        for (const c of node.children) push(c);
    };
    if (root) push(root);
    return out;
}

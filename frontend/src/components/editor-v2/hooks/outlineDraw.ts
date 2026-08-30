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
 * `depthCap` and the `seen` set are a cycle belt, not a semantic limit: the core
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

    const seen = new Set<string>();

    const nodeOf = (id: string, depth: number, childKey: string | null): OutlineNode => {
        const d = idlookup[id];
        if (d?.className !== 'DObject') {
            return { id, name: '', cls: '', kind: 'broken', depth, childKey, children: [] };
        }
        const node: OutlineNode = {
            id,
            name: ctx.getName(id) ?? '',
            cls: ctx.getMetaclassName(id) ?? '',
            kind: 'object',
            depth,
            childKey,
            children: [],
        };
        if (depth >= depthCap || seen.has(id)) return node;   // cycle belt
        seen.add(id);
        const cls = node.cls ? shape?.classes?.[node.cls] : null;
        for (const child of cls?.children ?? []) {
            for (const value of rawSlotValues(idlookup, id, child.key)) {
                node.children.push(nodeOf(value, depth + 1, child.key));
            }
        }
        return node;
    };

    for (const id of outlineRoots(idlookup, modelId)) root.children.push(nodeOf(id, 1, null));
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

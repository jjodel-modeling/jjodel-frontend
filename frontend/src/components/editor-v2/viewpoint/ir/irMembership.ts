/**
 * irMembership — what a drop does to the model (R-GV-8, spec addendum 2026-10-10 §6, slice S3): the container under a
 * dropped node, the plan of the drop from the two containers' membership modes, and the slots the plan writes.
 *
 * Pure: no React, no Redux, no joiner. EditorV2 executes the plan (`handleNodesChange`, `onDrop`, the connect gesture)
 * through the existing L-proxy `.values` setter inside one SetField-only TRANSACTION (docs/lir/lir_2026-10-10_graphvertex_s3.md).
 * Unit-tested in __tests__/irMembership.test.ts.
 */

import type { CompiledPathStep, ContainmentMembership, MembershipMode } from './irTypes';
import { classAncestry, findFeatureRaw, navigateRefHop } from './irReadCtx';

type Idlookup = Record<string, any>;

export interface Rect { x: number; y: number; w: number; h: number }

/** A container a node may be dropped into: its drawn box, its depth in the visual-parent forest, its canvas order. */
export interface DropCandidate { containerId: string; box: Rect; depth: number; order: number }

/**
 * The container under `point` that accepts the dropped object (R-GV-8): among the candidates whose box holds the point
 * (edges included) and whose channel accepts it, the deepest; on a tie the smaller box, then the first in canvas order.
 * `exclude` holds the dropped object and its descendants, which can never receive it. Null when none.
 */
export function resolveDropTarget(
    point: { x: number; y: number },
    candidates: ReadonlyArray<DropCandidate>,
    accepts: (containerId: string) => boolean,
    exclude: ReadonlySet<string>,
): string | null {
    let best: DropCandidate | null = null;
    for (const c of candidates) {
        if (exclude.has(c.containerId)) continue;
        const b = c.box;
        if (point.x < b.x || point.x > b.x + b.w || point.y < b.y || point.y > b.y + b.h) continue;
        if (!accepts(c.containerId)) continue;
        if (!best
            || c.depth > best.depth
            || (c.depth === best.depth && c.box.w * c.box.h < best.box.w * best.box.h)
            || (c.depth === best.depth && c.box.w * c.box.h === best.box.w * best.box.h && c.order < best.order)) {
            best = c;
        }
    }
    return best ? best.containerId : null;
}

/** A slot of the model: the object that owns it, the feature, its DValue id, and whether the feature is containment. */
export interface SlotRef { ownerId: string; feature: string; slotId: string | null; containment: boolean }

/** One side of a drop: a container, its membership mode, its channel's terminal slot and its creation owner's slot. */
export interface MembershipEnd { containerId: string; mode: MembershipMode; terminal: SlotRef | null; createOwner: SlotRef | null }

export interface DropInput {
    objectId: string;
    /** The container that draws the object before the drag (its visual parent), or null. */
    source: MembershipEnd | null;
    /** The container under its centre that accepts it (`resolveDropTarget`), or null. */
    target: MembershipEnd | null;
    /** The composition slot that holds the object now, or null. */
    containedIn: SlotRef | null;
    /** The object's father is the DModel: `setValueAtPosition` will not detach it from its old slot (LIR §1, fact 4). */
    rootFather: boolean;
}

export interface MembershipOp { op: 'remove' | 'append'; slot: SlotRef; value: string }

export type SnapReason = 'forbid' | 'outside' | 'not-membership' | 'no-slot' | 'uncontained';
export type DropPlan = { kind: 'move' } | { kind: 'snapBack'; reason: SnapReason } | { kind: 'edit'; ops: MembershipOp[] };

/** The ops that move the object's containment into `slot` (R-GV-8): the append re-fathers it, and a pure root, which
 *  `setValueAtPosition` does not detach, is removed from its old slot explicitly. Never both on a DValue father. */
function containmentMove(i: DropInput, slot: SlotRef): MembershipOp[] {
    if (i.containedIn && i.containedIn.slotId !== null && i.containedIn.slotId === slot.slotId) return [];
    const ops: MembershipOp[] = [];
    if (i.rootFather && i.containedIn) ops.push({ op: 'remove', slot: i.containedIn, value: i.objectId });
    ops.push({ op: 'append', slot, value: i.objectId });
    return ops;
}

/**
 * The plan of a drop (spec addendum §6, R-GV-8):
 * - the same container on both sides (none included): a move;
 * - `forbid` on either side: snap back;
 * - dropped outside every container that accepts it: snap back, unless the source's mode is `none`;
 * - into a container whose mode is `none` from one that is not: snap back (its membership is not editable);
 * - otherwise the source's mode governs the removal (`reference`: out of its terminal slot; `reparent`: by the
 *   containment move of the target) and the target's mode the append (`reference`: into its terminal slot, and into
 *   its creation owner's slot when the object is contained elsewhere; `reparent`: into its terminal containment slot).
 *   An edit that would leave a `reparent` source's object uncontained, or that has no slot to write, snaps back.
 */
export function planDrop(i: DropInput): DropPlan {
    const src = i.source;
    const tgt = i.target;
    if ((src?.containerId ?? null) === (tgt?.containerId ?? null)) return { kind: 'move' };
    const srcMode: MembershipMode = src?.mode ?? 'none';
    const tgtMode: MembershipMode = tgt?.mode ?? 'none';
    if (srcMode === 'forbid' || tgtMode === 'forbid') return { kind: 'snapBack', reason: 'forbid' };
    if (!tgt) return srcMode === 'none' ? { kind: 'move' } : { kind: 'snapBack', reason: 'outside' };
    if (tgtMode === 'none') return srcMode === 'none' ? { kind: 'move' } : { kind: 'snapBack', reason: 'not-membership' };

    const ops: MembershipOp[] = [];
    if (src && srcMode === 'reference') {
        if (!src.terminal) return { kind: 'snapBack', reason: 'no-slot' };
        ops.push({ op: 'remove', slot: src.terminal, value: i.objectId });
    }
    let movesContainment = false;
    if (tgtMode === 'reference') {
        if (!tgt.terminal) return { kind: 'snapBack', reason: 'no-slot' };
        ops.push({ op: 'append', slot: tgt.terminal, value: i.objectId });
        if (tgt.createOwner) {
            const move = containmentMove(i, tgt.createOwner);
            ops.push(...move);
            movesContainment = move.length > 0 || i.containedIn?.slotId === tgt.createOwner.slotId;
        }
    } else {
        if (!tgt.terminal || !tgt.terminal.containment) return { kind: 'snapBack', reason: 'no-slot' };
        ops.push(...containmentMove(i, tgt.terminal));
        movesContainment = true;
    }
    if (srcMode === 'reparent' && !movesContainment) return { kind: 'snapBack', reason: 'uncontained' };
    return { kind: 'edit', ops };
}

// ── The D-layer side: slots read off the idlookup ───────────────────────────────────────────────────────────────

/** The slot `feature` of `ownerId`, with its containment flag; null when the object has no such feature. */
export function slotRefOf(idlookup: Idlookup, ownerId: string, feature: string): SlotRef | null {
    const dValue = findFeatureRaw(idlookup, ownerId, feature);
    if (!dValue) return null;
    return { ownerId, feature, slotId: typeof dValue.id === 'string' ? dValue.id : null, containment: !!idlookup[dValue.instanceof]?.composition };
}

/** The terminal slot of a declared channel from `containerId`: hops as `navigateRefHop`, the last step's slot. */
export function terminalSlotOf(idlookup: Idlookup, containerId: string, steps: ReadonlyArray<CompiledPathStep>): SlotRef | null {
    if (steps.length === 0) return null;
    let current = containerId;
    for (let i = 0; i < steps.length - 1; i++) {
        const next = navigateRefHop(idlookup, current, steps[i].feature, steps[i].take);
        if (next === null) return null;
        current = next;
    }
    return slotRefOf(idlookup, current, steps[steps.length - 1].feature);
}

/** The composition slot of `ownerId` that lists `childId`, or null. */
export function compositionSlotHolding(idlookup: Idlookup, ownerId: string, childId: string): SlotRef | null {
    const dObject = idlookup[ownerId];
    if (!Array.isArray(dObject?.features)) return null;
    for (const fid of dObject.features) {
        const dValue = idlookup[fid];
        const feat = dValue ? idlookup[dValue.instanceof] : undefined;
        if (!feat?.composition || !Array.isArray(dValue.values) || !dValue.values.includes(childId)) continue;
        return { ownerId, feature: String(feat.name), slotId: typeof dValue.id === 'string' ? dValue.id : fid, containment: true };
    }
    return null;
}

/** The composition slot that holds `objectId` now, through the complete composition walk (`containerOf`). */
export function containedInSlot(idlookup: Idlookup, containerOf: ReadonlyMap<string, string> | undefined, objectId: string): SlotRef | null {
    const owner = containerOf?.get(objectId);
    return owner === undefined ? null : compositionSlotHolding(idlookup, owner, objectId);
}

/** Whether `classId` is `kind` or inherits from it. */
function isKindOf(idlookup: Idlookup, classId: string | undefined, kind: string): boolean {
    return !!classId && classAncestry(idlookup, classId).some(a => a.name === kind);
}

/**
 * The creation owner's slot of a container (R-GV-8, spec addendum §6.1): the `create.feature` slot of the nearest
 * composition ancestor of `containerId` (the container itself excluded) whose class is `create.ownerKind` or inherits
 * from it. Null when the chain has none, or when the owner has no such feature.
 */
export function createOwnerSlotOf(
    idlookup: Idlookup,
    containerOf: ReadonlyMap<string, string> | undefined,
    containerId: string,
    create: NonNullable<ContainmentMembership['create']>,
): SlotRef | null {
    const seen = new Set<string>([containerId]);
    for (let cur = containerOf?.get(containerId); cur !== undefined && !seen.has(cur); cur = containerOf?.get(cur)) {
        seen.add(cur);
        if (isKindOf(idlookup, idlookup[cur]?.instanceof, create.ownerKind)) return slotRefOf(idlookup, cur, create.feature);
    }
    return null;
}

/** Whether an object of `classId` may enter `slot`: the slot's feature type is the class or one of its ancestors.
 *  A feature with no type accepts anything, as the model does. */
export function slotAccepts(idlookup: Idlookup, slot: SlotRef, classId: string): boolean {
    const dValue = slot.slotId ? idlookup[slot.slotId] : findFeatureRaw(idlookup, slot.ownerId, slot.feature);
    const type = dValue ? idlookup[dValue.instanceof]?.type : undefined;
    if (typeof type !== 'string') return true;
    return classAncestry(idlookup, classId).some(a => a.id === type);
}

/** The object's father is the DModel (a pure root, LIR §1 fact 4). */
export function isRootFathered(idlookup: Idlookup, objectId: string): boolean {
    const father = idlookup[objectId]?.father;
    return typeof father === 'string' && idlookup[father]?.className === 'DModel';
}

/** The values a slot holds after `op`, the empty entries dropped; null when the op changes nothing. */
export function nextValues(values: ReadonlyArray<unknown>, op: MembershipOp): string[] | null {
    const meaningful = values.filter((v): v is string => typeof v === 'string' && v !== '');
    if (op.op === 'append') return meaningful.includes(op.value) ? null : [...meaningful, op.value];
    return meaningful.includes(op.value) ? meaningful.filter(v => v !== op.value) : null;
}

/** The composition slot of `containerId` that accepts an object of `classId`: the terminal of the default channel for a
 *  `reparent` container without a declared one. The first such slot in feature order; null when none. */
export function compositionSlotFor(idlookup: Idlookup, containerId: string, classId: string): SlotRef | null {
    const dObject = idlookup[containerId];
    if (!Array.isArray(dObject?.features)) return null;
    for (const fid of dObject.features) {
        const dValue = idlookup[fid];
        const feat = dValue ? idlookup[dValue.instanceof] : undefined;
        if (!feat?.composition) continue;
        const ref: SlotRef = { ownerId: containerId, feature: String(feat.name), slotId: typeof dValue.id === 'string' ? dValue.id : fid, containment: true };
        if (slotAccepts(idlookup, ref, classId)) return ref;
    }
    return null;
}

/** What `ownerSlotForNewObject` reads of a containment model (irContainment.ContainmentModel satisfies it). */
export interface MembershipModel {
    containers: ReadonlyMap<string, { membership?: ContainmentMembership; channelSteps?: CompiledPathStep[] }>;
    parentOf: ReadonlyMap<string, string>;
    containerOf?: ReadonlyMap<string, string>;
}

/**
 * Where an object created next to `anchorId` belongs (R-GV-8, spec addendum §6.1): climbing the visual parents of the
 * anchor, the first container that names a creation owner gives that owner's slot; the first `reparent` container
 * with a declared channel gives the channel's terminal containment slot. Null when the chain has neither (the object
 * stays a root, as today). Used for the edge object of the connect gesture, anchored on its source.
 */
export function ownerSlotForNewObject(idlookup: Idlookup, model: MembershipModel, anchorId: string): SlotRef | null {
    const seen = new Set<string>();
    for (let c = model.parentOf.get(anchorId); c !== undefined && !seen.has(c); c = model.parentOf.get(c)) {
        seen.add(c);
        const info = model.containers.get(c);
        const m = info?.membership;
        if (m?.mode === 'reference' && m.create) {
            const owner = createOwnerSlotOf(idlookup, model.containerOf, c, m.create);
            if (owner) return owner;
        }
        if (m?.mode === 'reparent' && info?.channelSteps) {
            const terminal = terminalSlotOf(idlookup, c, info.channelSteps);
            if (terminal?.containment) return terminal;
        }
    }
    return null;
}

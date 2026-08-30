/**
 * jjform — the portable form engine (R-FORM-2).
 *
 * Public surface. Slice 2b opened the directory for the SHAPE contract only;
 * slice 2c added the CREATE half of the engine (`create.ts`), slice 12d the
 * DELETE half (`delete.ts`), and slice 12b/12c the MULTI-SELECTION (`multi.ts`)
 * and the depth/breadcrumb rule (`nav.ts`) — all pure for the reason the shape
 * is. Slice S2 added `write.ts`, the RESULT type of a write, and slice S4
 * `writeCtx.ts` — the write primitives themselves, the contract an adapter
 * implements so the engine can write without knowing what it is writing into. Slice S5
 * closed that surface with `validTargets`, the per-instance offer of R-FORM-13: the
 * legal ARGUMENTS of a write belong to the same contract as the write, or a host can
 * offer what it will then refuse. Slice 10b added `outline.ts`, the containment tree's
 * menu rule, and slice 13a `neighborhood.ts` — the local graph of one instance, read
 * plus navigation, never a second canvas. What still waits are the open questions of
 * `form-engine-contract.md`.
 *
 * Invariant, checked by reading and by the module having nothing to import:
 * nothing under `jjform/` imports from `joiner/`, `redux/`, `react` or
 * `components/`. The adapters live outside and depend inwards.
 */

export type {
    AttrShape,
    AttrType,
    ClassShape,
    EnumLiteralShape,
    EnumShape,
    IncomingRef,
    MetamodelShape,
    RefShape,
    ShapeCtx,
} from './shape';

export { collectionClasses, multiplicity, tableFeatures } from './shape';

export type {
    Draft,
    DraftContext,
    DraftField,
    DraftFieldKind,
    DraftModel,
    DraftOption,
} from './create';

export {
    addChildReason,
    draftableAttrs,
    draftableRefs,
    draftModel,
    newDraft,
    newInstanceReason,
    setDraftRef,
    setDraftValue,
    validateDraft,
} from './create';

export type {
    ClearStep,
    DeleteOption,
    DeleteOptions,
    DeletePlan,
    DeletePreflight,
    DeleteReferrer,
    DeleteVerdict,
    DescendantInput,
    PreflightInput,
    ReassignStep,
    ReferrerInput,
} from './delete';

export type { PlanWriteOutcome, PlanWriteRefusal } from './delete';

export { applyPlanWrites, deletePlan, deletePreflight, deleteVerdict } from './delete';

export type {
    BulkSetValue,
    MultiExclusion,
    MultiField,
    MultiFieldKind,
    MultiFieldState,
    MultiInstance,
    MultiModel,
} from './multi';

export type { UnionPreflight, UnionPreflightInput } from './multi';

export { IDENTITY_KEY, bulkExclusionReason, bulkPlan, multiModel, unionPreflight, willApplyTo } from './multi';

export type { WriteResult } from './write';

export { writeDone, writeRefused, writeUnchanged } from './write';

export type { CreateResult, TargetOption, WriteCtx, WriteValue } from './writeCtx';

export { targetOptions } from './writeCtx';

export type { Crumb, NavState, NavStep } from './nav';

export {
    INLINE_DEPTH_LIMIT,
    breadcrumbOf,
    crumbLabel,
    currentOf,
    depthOf,
    drillInto,
    drillOut,
    navFor,
    rendersInline,
    rootOf,
    truncateTo,
} from './nav';

export type {
    NeighborEdge,
    NeighborKind,
    NeighborNode,
    NeighborRole,
    NeighborValue,
    Neighborhood,
    NeighborhoodLayout,
    PlacedEdge,
    PlacedNode,
} from './neighborhood';

export {
    NEIGHBOR_COL_GAP,
    NEIGHBOR_NODE_H,
    NEIGHBOR_NODE_W,
    NEIGHBOR_OWNER_GAP,
    NEIGHBOR_ROW_GAP,
    neighborLabel,
    neighborhoodLayout,
    neighborhoodNote,
} from './neighborhood';

export type {
    OutlineKind,
    OutlineMenu,
    OutlineMenuBlock,
    OutlineMenuEntry,
    OutlineNode,
} from './outline';

export {
    OUTLINE_DEFAULT_OPEN_DEPTH,
    childMenu,
    outlineLabel,
    outlineOpenByDefault,
    rootMenu,
} from './outline';

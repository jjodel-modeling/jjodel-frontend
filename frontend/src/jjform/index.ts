/**
 * jjform — the portable form engine (R-FORM-2).
 *
 * Public surface. Slice 2b opened the directory for the SHAPE contract only;
 * slice 2c added the CREATE half of the engine (`create.ts`), slice 12d the
 * DELETE half (`delete.ts`), and slice 12b/12c the MULTI-SELECTION (`multi.ts`)
 * and the depth/breadcrumb rule (`nav.ts`) — all pure for the reason the shape
 * is. What still waits on `WriteCtx` is the rest of the write side — the
 * per-field `set` — and the open questions of `form-engine-contract.md`.
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

export { deletePlan, deletePreflight, deleteVerdict } from './delete';

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

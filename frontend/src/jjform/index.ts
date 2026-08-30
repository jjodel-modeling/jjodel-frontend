/**
 * jjform — the portable form engine (R-FORM-2).
 *
 * Public surface. Slice 2b opened the directory for the SHAPE contract only;
 * slice 2c added the CREATE half of the engine (`create.ts`) and slice 12d the
 * DELETE half (`delete.ts`), both pure for the same reason the shape is. What
 * still waits on `WriteCtx` is the rest of the write side — the per-field `set`
 * — and the open questions of `form-engine-contract.md`.
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

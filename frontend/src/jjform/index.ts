/**
 * jjform — the portable form engine (R-FORM-2).
 *
 * Public surface. Empty of runtime code so far: slice 2b opens the directory for
 * the SHAPE contract only, and the engine lands when the remaining ports
 * (`WriteCtx`) and the open questions of `form-engine-contract.md` are settled.
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

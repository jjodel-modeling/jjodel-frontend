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
 * plus navigation, never a second canvas. Slice FL1 added `layout.ts`, the
 * WIDTH REGISTRY and the packer of the form auto-layout — the module that makes the
 * metamodel, and never the user, decide where a field sits. Slice FL2 added `themes.ts`, the form's
 * THEME — a named preset over exactly three fields, resolved through the same
 * least-to-most-specific cascade as every other style field of the platform. Slice FL5
 * added `egoNeighborhood.ts`, the 1-HOP EGO of one instance — the same data 13a walks,
 * projected onto a ribbon a table row can hold: dedup, precedence, cap, counts,
 * positions, and the routing of a click. What
 * still waits are the open questions of `form-engine-contract.md`.
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

export type {
    FormLayout,
    FormWidget,
    LayoutAnnotations,
    LayoutField,
    LayoutRow,
    LayoutSection,
    SectionKey,
    Span,
    WidthClass,
    WidthKind,
    WidthRung,
    WidthVerdict,
} from './layout';

export {
    ENUM_SEGMENTED_MAX,
    GRID_COLUMNS,
    RENDERER_WIDTH_KIND,
    WIDTH_MAP,
    formLayout,
    layoutField,
    packRows,
    widthOf,
} from './layout';

export type {
    Ego,
    EgoCounts,
    EgoInput,
    EgoInstance,
    EgoKind,
    EgoNode,
    EgoPointer,
    EgoSide,
} from './egoNeighborhood';

export type { EgoAction, EgoArrow, EgoHandlers, EgoLayout, EgoPlacedNode } from './egoNeighborhood';

export {
    EGO_COL_GAP,
    EGO_MAX_PER_SIDE,
    EGO_NODE_H,
    EGO_NODE_W,
    EGO_ROW_GAP,
    EGO_SUBJECT_H,
    EGO_SUBJECT_W,
    egoAction,
    egoDispatch,
    egoLabel,
    egoLayout,
    egoNeighborhood,
    egoShowAll,
    egoSummary,
} from './egoNeighborhood';

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
    CheckStatus,
    ControlDecision,
    ControlFlags,
    Duration,
    DurationUnit,
    FieldCheck,
    UrlCheck,
} from './widgetValue';

export {
    checkEmail,
    checkUrl,
    controlClass,
    controlDecision,
    durationValueIn,
    formatDuration,
    isHexColor,
    normalizeHex,
    normalizeIsoDate,
    normalizeIsoDateTime,
    parseDuration,
} from './widgetValue';

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

export type {
    Density,
    DensityScale,
    FormTheme,
    FormThemeName,
    LabelLayout,
    LabelPlacement,
    SectionChrome,
    SectionStyle,
} from './themes';

export {
    DENSITY_SCALE,
    FORM_THEME_DEFAULT,
    FORM_THEME_DEFAULT_NAME,
    FORM_THEME_NAMES,
    FORM_THEME_PRESETS,
    LABEL_COLUMN_WIDTH,
    LABEL_FONT_SIZE,
    LABEL_FONT_WEIGHT,
    LABEL_LAYOUT,
    SECTION_CHROME,
    SECTION_HEADER_BAND,
    resolveTheme,
    themeLayer,
    themeName,
} from './themes';

/**
 * irPrune — the pruning of the per-class view, at the level of the ir (R-DMV slice F).
 *
 * `FormAuthoringBody.pruneForm` prunes INSIDE a `FormSpec` and cannot see one level up:
 * it takes a `FormSpec` and gives one back, while `table` is a SIBLING of `form` on the
 * node ir (`VertexViewIR.table`, `GraphVertexViewIR.table`). A `table: { columns: [] }`
 * would therefore survive forever — the saved ir has no VersionFixer (R-B9), so every
 * literal written there is definitive.
 *
 * ONE PLACE, and the reason is measured: there are already two restatements of
 * `pruneForm`'s criteria in the codebase (`widgetRenderer.ts` and `jjform/widgetValue.ts`),
 * each with a test whose job is to stop them drifting. A third would be a third thing to
 * keep in step by hand. Everything that writes `form` or `table` on a per-class view of the
 * singleton goes through the two setters here, and the emptiness question is asked once.
 *
 * Pure, and importable under the node test environment: it depends on `irTypes` alone, so
 * the cases exercise the same code the panel runs and not a copy of it (P11).
 */

import type { AnyViewIR, FormSpec, NodeViewIR, TableSpec } from './irTypes';

/**
 * A `TableSpec` with nothing left in it is `undefined`, never `{}`.
 *
 * The same rule `pruneForm` applies to `order` and `hidden`, and for the same reason:
 * `orderColumns` returns its input unchanged when `columns` is absent OR empty
 * (`instanceTable.ts`), so an empty list and a missing one are one rendering. Only one of
 * them should reach the file.
 */
export function pruneTable(next: TableSpec | undefined): TableSpec | undefined {
    if (!next) return undefined;
    const out: TableSpec = { ...next };
    if (out.columns && out.columns.length === 0) delete out.columns;
    return Object.keys(out).length === 0 ? undefined : out;
}

/**
 * Set or clear the `table` of a node view.
 *
 * `undefined` REMOVES the key rather than writing it undefined: a view whose columns were
 * fixed and then reset must round-trip byte-identical to one where they never were. Same
 * idiom as `withFormKey`, one level up.
 */
export function withViewTable<T extends NodeViewIR>(ir: T, next: TableSpec | undefined): T {
    const out: any = { ...ir };
    const pruned = pruneTable(next);
    if (pruned === undefined) delete out.table; else out.table = pruned;
    return out as T;
}

/** Set or clear the `form` of a node view. The `FormSpec` is expected already pruned by
 *  `pruneForm`; this function only decides between the key and its absence. */
export function withViewForm<T extends NodeViewIR>(ir: T, next: FormSpec | undefined): T {
    const out: any = { ...ir };
    if (next === undefined) delete out.form; else out.form = next;
    return out as T;
}

/**
 * The keys a per-class view of the singleton carries when it says NOTHING.
 *
 * They are exactly what `DataManagerViewpointPanel.createClassView` writes: the ir version,
 * the kind, the metaclass and its pin, the two resolution knobs, and the minimal shape
 * R-DMV-3-bis forced on it (an ir without `shape` makes `compileView` throw, so the
 * skeleton is not free of one). Anything else on the view is authored content.
 */
const SKELETON_KEYS: ReadonlySet<string> = new Set([
    'irVersion', 'kind', 'metaclasses', 'authoringMetaclassPins', 'priority', 'exclusive', 'shape',
]);

/**
 * Is this per-class view of the singleton still saying anything?
 *
 * True — «prunable» — when it declares neither `form` nor `table` AND carries nothing but
 * the skeleton above. R-DMV-5: «una view svuotata si pota e la classe sparisce dall'albero».
 *
 * THE SHAPE IS INSPECTED, not assumed. The skeleton's is `{ form: 'rect' }` and nothing
 * else; a view whose shape says more than that was authored by somebody as a symbol, and
 * deleting it because a widget override was reset would destroy work the panel never made.
 * The same caution answers the general case: an unknown key keeps the view alive. The
 * conservative direction is deliberate — a view that survives is a row in a tree, a view
 * wrongly deleted is gone for good.
 */
export function isPrunableClassView(ir: AnyViewIR | undefined | null): boolean {
    if (!ir || typeof ir !== 'object') return false;
    const any = ir as any;
    if (any.kind !== 'vertex' && any.kind !== 'graphVertex') return false;
    if (any.form !== undefined || any.table !== undefined) return false;
    for (const key of Object.keys(any)) {
        if (!SKELETON_KEYS.has(key)) return false;
    }
    const shape = any.shape;
    if (shape !== undefined) {
        if (typeof shape !== 'object' || shape === null) return false;
        const keys = Object.keys(shape);
        if (keys.length > 1 || (keys.length === 1 && shape.form !== 'rect')) return false;
    }
    return true;
}

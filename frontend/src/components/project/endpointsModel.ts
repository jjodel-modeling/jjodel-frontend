/**
 * endpointsModel — pure helpers of the project page's Endpoints section (#186, P-2026-10-14-1101).
 *
 * ZERO imports on purpose, so the vitest bench (environment `node`) can load it: the section and
 * the steps that use it do not import under node (CLAUDE.md §5).
 *
 * The «Editable metaclasses» tab lists every class of every metamodel. A class that cannot be
 * created on its own (a reason from `topLevelReason`: abstract, created inside another, …) is
 * never offered, and in a large metamodel those rows were most of the list (#186 image 3). They
 * are folded away behind one button per metamodel; a marked one stays visible, so it can be
 * removed (R3 of #157 kept marks made before the rule).
 */

/**
 * Splits a metamodel's rows into the ones shown and the ones folded away. Shown: no reason, or
 * marked. Folded: a reason and not marked. The input order is kept in both lists, and the item
 * objects are returned as they are.
 */
export function splitSelectable<T extends { id: string; reason: string | null }>(
    items: readonly T[],
    marked: readonly string[],
): { shown: T[]; folded: T[] } {
    const shown: T[] = [];
    const folded: T[] = [];
    for (const it of items) {
        if (!it.reason || marked.includes(it.id)) shown.push(it);
        else folded.push(it);
    }
    return { shown, folded };
}

/** The text of the button that shows or hides a metamodel's folded rows. */
export function foldToggleLabel(count: number, open: boolean): string {
    return open ? 'Hide not selectable' : `Show ${count} not selectable`;
}

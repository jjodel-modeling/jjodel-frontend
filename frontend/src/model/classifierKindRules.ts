/**
 * Classifier-kind rules of a metamodel, in a module the test bench can import.
 *
 * Enum step B (R-EDGE-2, P-2026-09-27-1806): the model layer refuses what the canvas has
 * refused since C1 (`isMetamodelConnectionValid`, `5dc09a4ce`), for the writers C1 does not
 * see: the console, the L API, custom view code. The setters that apply these rules live in
 * `LModelElement.tsx` and `joiner/classes.ts`, which `vitest` cannot load (`window is not
 * defined` through the `joiner` barrel), so the rules live here and are executed, not read.
 *
 * The module imports nothing on purpose, as `nameLookup.ts`: an import from `joiner`, even a
 * type, would pull the barrel back in.
 *
 * Evidence: docs/discovery/discovery_2026-09-27_enum_step_b.md, §3.6 (the candidate guard live
 * on load, undo/redo, VersionFixer replay, «Check integrity» and the Ecore import: 0 refusals)
 * and §4 B1-B3, B5.
 */

/** The D className of the one classifier that can type a reference or sit on either end of an `extends`. */
export const CLASS_KIND = 'DClass';

/** True for a class's D className. `undefined` (a pointer that does not resolve) is not a class. */
export function isClassKind(className: string | undefined | null): boolean {
    return className === CLASS_KIND;
}

/**
 * B1. May a typed element of D className `ownerClassName` take as its type an element of D
 * className `targetClassName`? Only a `DReference` is constrained: it is typed by a class.
 *
 * `targetClassName` is `undefined` when the pointer does not resolve. That passes, as today:
 * `set_type` keeps a name it cannot resolve yet (set-by-name, resolved later by `get_type`).
 */
export function isTypeKindAllowed(ownerClassName: string | undefined, targetClassName: string | undefined): boolean {
    if (ownerClassName !== 'DReference') return true;
    if (targetClassName === undefined) return true;
    return isClassKind(targetClassName);
}

/**
 * B3. May a data type's `extends` go from `prev` to `next`? Only when the write adds nothing.
 *
 * Removals stay open: deleting the class a saved enum «extends» (`Dummy.dclass`) and unlinking
 * that edge from the canvas (`syncDeleteEdge`) are the two legitimate writers, and both shrink
 * the list. Refusing every write was measured to leave a dangling pointer in the first and to
 * block the only in-app repair in the second (report §3.6, mode `on-a`).
 */
export function isDataTypeExtendsWriteAllowed(prev: readonly string[] | undefined | null, next: readonly string[]): boolean {
    const before = new Set(prev ?? []);
    for (const p of next) if (!before.has(p)) return false;
    return true;
}

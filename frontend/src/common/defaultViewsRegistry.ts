/**
 * The scan that fills `Defaults.defaultViewPointsMap` and `Defaults.defaultViewsMap`, in a module the test bench can
 * import (P-2026-10-21-1950, F2).
 *
 * The reducer runs it while the seeded viewpoint is not yet an object in the map (`reducer.ts`, «initialize default
 * views map»). The scan used to register every view record it found. On an in-page open the seed is skipped, the guard
 * stays open, and the scan saw the loaded project: its user viewpoints and views entered the built-in maps, and
 * `Defaults.check` made them read-only for the rest of the page session (measured in
 * `docs/discovery/discovery_2026-10-21_gv_f2_readonly_views_f3_palette_click.md` §3.1).
 *
 * Only ids in the `Pointer_View` namespace are built-in: the convention of `Defaults.holdsOnlySystemViews`. User ids
 * never carry the prefix (`joiner/classes.ts`, the id generator).
 *
 * The module imports nothing on purpose, as `model/nameLookup.ts`: `Defaults.ts` and `reducer.ts` reach monaco through
 * the `joiner` barrel and do not load under `vitest` (`window is not defined`).
 */

const SYSTEM_PREFIX = 'Pointer_View';

/** Registers the `Pointer_View*` viewpoint and view records of `idlookup` into the two maps, by id. Nothing else. */
export function registerSystemViews(idlookup: Record<string, unknown>, vpMap: Record<string, any>, viewMap: Record<string, any>): void {
    for (const k in idlookup) {
        if (!k.startsWith(SYSTEM_PREFIX)) continue;
        const e: any = idlookup[k];
        if (!e || typeof e !== 'object') continue;
        const className = e.className;
        if (typeof className !== 'string') continue;
        if (className.includes('DViewPoint')) vpMap[k] = e;
        if (className.includes('DViewElement')) viewMap[k] = e;
    }
}

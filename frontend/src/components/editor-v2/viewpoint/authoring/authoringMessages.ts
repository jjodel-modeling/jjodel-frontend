/**
 * Copy shared by the IR authoring panels.
 *
 * A message rendered by more than one panel lives here, not in each of them. The
 * ambiguity warning below is the case that motivated the module: it was copied in
 * three panels, and a single cause (`85fc8aa3e`, which moved metaclass resolution to
 * the identity pin) left all three stale at once, because correcting one file did
 * not correct the others. See docs/claude-code-log.md, entries 2026-08-05 (which
 * aligned the three copies and recorded the extraction as pending) and 2026-08-09
 * (which measured them again before this extraction).
 */

/**
 * B-5 — the target metaclass NAME is declared in more than one project metamodel.
 *
 * Names the tab where the metaclass is chosen (cross-tab, R-B) and states the
 * resolution actually in force since slice 1.3: `resolveMetaclassId`
 * (`ir/metaclassPin.ts`) resolves pin -> appliesTo -> name, so the view uses the
 * metaclass pinned when it was chosen, not any metaclass carrying that name. The
 * `appliesTo` step is the fallback, not the rule — an earlier wording described it
 * as the rule and was wrong for two months.
 *
 * A function and not a bare string because both operands are read at render time.
 * `targetName` is `string | null` at the call sites; the panels render this only
 * under `metamodelsWithClass > 1`, where it is never null in practice, and the
 * interpolation is left verbatim rather than guarded — the text must stay
 * byte-identical to the three copies it replaces.
 */
export const metaclassAmbiguityWarning = (targetName: string | null, metamodelsWithClass: number): string =>
    `The metaclass «${targetName}» is declared in ${metamodelsWithClass} project metamodels: the view uses the one pinned in the Applies to tab when the metaclass was chosen, not any metaclass carrying that name. Check that the metamodels are not duplicated.`;

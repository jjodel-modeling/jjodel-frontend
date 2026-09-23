# Prompt: the default object view paints the abstract node's fill

Prompt-ID: P-2026-09-22-2105
Status: eseguito (2026-09-23, lane default-view-parity, `fb876efaa`)
Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl` (the trunk). Not `~/jjodel`: `validation-skeleton` was reintegrated on 2026-09-21 (`4d397ac02`) and takes no more work.
Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID.

## COSA

A vertex view created in a syntax viewpoint must fill its box like the abstract-syntax instance node. R-IRN-29..31 brought border, corner radius, name size, name colour and underline to parity inside `defaultObjectViewIR()`, but the factory sets no `fill`. The IR box therefore takes whatever the stylesheets give `.ir-node-content`, a different token from the `var(--color-inode-surface)` that `instanceNode.scss:29` paints. A lane on the stale branch reported it on 2026-09-22 as "visibly tinted" in light; that lane was closed without a commit.

Scope is the fill and nothing else. Border, radius, label style and `underline: true` stay as R-IRN-29..31 set them. No new default on `.ir-node-content` in CSS: it would repaint every user-authored view that has no fill, the retroactive global constant rejected on 2026-09-19.

## DOVE

Phase 1 reads, under `frontend/src/`: `components/editor-v2/viewpoint/ir/irDefaults.ts` (factory, `LEGACY_OBJECT_VIEW_SNAPSHOT`, `isMigratedDefaultView`), `irCreationSeed.ts`, `irKindConvert.ts`, the vertex path of `EnableIRPanel`, `irCompile.ts` and `IRNodeContent.tsx` for how `shape.fill` reaches the DOM, `components/editor-v2/nodes/instanceNode.scss`, `components/editor-v2/_color-schemes.scss` (`--node-bg` at :358 and :384), `components/editor-v2/_notations.scss` (:47), `styles/classic-object-view.scss`, `styles/tokens/_colors-light.scss` and `_colors-dark.scss`.

Phase 2 is expected to touch `irDefaults.ts` and its tests only. Any other file is declared in the report before the GO.

## COME

### Phase 1 (read-only)

1. Find the rule that paints the background of `.ir-node-content` when the IR has no fill. File and line.
2. Measure at runtime on the dev server (DOM and `getComputedStyle`, never screenshots) the computed background of a default IR object view and of the native instance node, light and dark, under the default scheme and under each scheme or notation that sets `--node-bg` (the three lines above). One table.
3. Say whether the native instance node follows those schemes and notations or always paints `--color-inode-surface`. Parity means the IR default does the same thing the native does, including when a notation wants transparent nodes.
4. Confirm how `ShapeSpec.fill` is compiled (inline style or class) and whether a CSS variable is accepted as is.
5. List the consumers of `defaultObjectViewIR()` and say whether a fill in the factory reaches every creation path.
6. Confirm that a fill in the factory changes the hash `isMigratedDefaultView` compares, and name the test that would catch a repeat of the R-IRN-33 regression.

Save the report as `docs/discovery/discovery_2026-09-22_ir_default_fill.md`: objective, files read with full paths, findings, risks, open questions for Alfonso, and the proposed Phase 2 diff in prose. Commit it alone, with pathspec. Hard stop: the phase is not complete until the report is on disk.

### Phase 2 (after GO)

1. Add `fill: 'var(--color-inode-surface)'` to `defaultObjectViewIR()`, unless Phase 1 step 3 shows the native node follows the notation, in which case the GO will say what to write.
2. Freeze the factory shape as it stands today (after `400095370`, before the fill) as a second legacy snapshot beside `LEGACY_OBJECT_VIEW_SNAPSHOT`. `isMigratedDefaultView` recognizes the 07-18 shape, the 09-18 shape and the current factory. Rename nothing.
3. Tests: a view persisted in each of the three shapes delegates to the native renderer; a modified one does not. Prove it by mutation (drop the new snapshot, the 09-18 test must fail) and report the mutation.
4. Gates: typecheck with the same error set as the baseline you measure first, vitest, build, `npm run check:docs`, `npm run check:agents`.
5. Hard stop for Alfonso's visual check on 3001: a new Mario:Person view against the abstract node, light and dark; a project saved before this commit still renders through the native node.
6. After the OK: one code commit with pathspec, then one docs commit with the entry in `docs/log-inbox/default-view-parity.md`. P6 trailer `Model: ...` in both bodies.

Never: `git add .`, `git stash`, commits in `~/jjodel`, the paper files under `docs/mde-intelligence-2026/`.

## RIFERIMENTI

- `docs/decisions.md` R-IRN-29..34; R-IRN-33 for the frozen-shape mechanism and its tests (`516afd310`).
- `docs/discovery/discovery_2026-09-18_default_view_parity.md` and the probe `docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts` (it measured border, radius and text, not the background).
- `~/seed-fill-2026-09-22.patch`: the closed lane's diff, for reference only. Do not apply it: it was written against the pre-merge factory, it duplicates R-IRN-29..31 in the seed and drops the underline.
- Open debt, high: migrated default views are identified by structural equality with a moving factory. This prompt adds the second frozen shape; the stable-identity round comes next.

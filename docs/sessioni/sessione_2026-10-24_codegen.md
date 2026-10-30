# Section: chat C-2026-10-23-2009 (front codegen, generators per metamodel, R-GEN)

Written 2026-10-24 at 01:55 (Rome), at the end of an unattended night (`/lane auto`). Replaces only this section.

## State

- Alfonso gave this chat the codegen front on 2026-10-23 at 22:45 (`docs/harness/fronts.json`, slug `codegen`,
  milestone 14); C-2026-10-22-1050 handed over at 23:25 and no longer touches `frontend/src/codegen/`.
- Trunk `alfonso-frontend-jjtl`, not pushed: S4 completion merged (`3b5901f05`, visual check by the chat on DemoPetri,
  Status `4a364694a`), generator-as-viewpoint discovery merged (`b1934ac2d`). Rollback tags `pre-cg-s4`,
  `pre-cg-s4-status`, `pre-codegen-front-2026-10-23`, `pre-cg-viewpoint-report`.
- Branch `cg-generators` (worktree `~/jjodel-w-cggen`), **not to be merged before the 3.2 tag (R-GEN-39)**, tip
  `10be255fd`, tree clean:
  - `b3937b348` R-GEN-19..43 in `docs/decisions.md` (19..30 provisional, 31..43 ratified «si su tutto»);
  - G1 codec `f41de8b23` (`genGenerators` beside `genTemplates`, no migration), bench 6/6;
  - G2 generation per file with the generator's target `8bdead3c5`, bench 5/5;
  - G3 generator tab, Code panel as launcher, two-way provenance `e4be12d09` (lane 0003 died at the context limit,
    completed by P-2026-10-24-0045: Run only on target js, probes ported, bench 7/7);
  - G4 GENERATORS section in the left bar `51620011c`, bench 10/10, lazy gate on green.
- Crops checked by the chat (RC-23), in `~/.jjodel-lanes/P-2026-10-24-0045/crops/` and `.../P-2026-10-24-0004/crops/`.
- No lane running. Scheduled checks of this chat: none left.

## Decisions

- Generator stored on the metamodel's `_state`, not as a `DViewPoint` (a viewpoint is a `DViewElement` and is bound to
  no metamodel): R-GEN-31..32. Target declared per generator, STC not: R-GEN-33..34.
- 3.2 ships as is; generators in 3.3 (R-GEN-39). One tab per generator is the only authoring surface, pill as launcher
  (R-GEN-40); provenance both ways (R-GEN-41); GENERATORS section in the left bar (R-GEN-42); slice order (R-GEN-43).
- Unattended: G4 moved the tab's creation code into an exported `createGenerator` in `TemplateEditorTab.tsx`, outside
  its DOVE (RC-21).

## Open (for Alfonso's morning check)

1. Visual GO on `cg-generators` (dev server on the worktree): tab, generator selector, Preview/Run/Check, pill menu,
   left-bar section, Alt+click to template (the crop shows only the list selection, not the range reveal).
2. Fix seen in the crops: a new, empty generator shows «No template named 'main'» as a red error in Preview; it should
   be an empty state.
3. 3.2 leftovers on this front: CHANGELOG lines on template authoring (double surface as a known limit, R-GEN-39);
   lazy gate `--off` red on the trunk (known ticket, `.env.production` turns `VITE_CODEGEN` on).
4. Cleanup candidate: `ui/TemplateEditor.tsx` has no importer on `cg-generators`.
5. Push of the trunk stays with Alfonso.

## Lessons

- A G3-sized UI slice does not fit one lane's context: split code, then gates/probe/crops, from the start.
- Crops come back through osascript base64 of several files at once (the output lands in a file).
- A chain stops at the first non-`done` lane; the remaining prompts are started by hand with `lane-run start`.

# Prompt: Phase 1 and 2 in cascade, viewpoint option «Color by metaclass» (fill palette from a base color, auto text contrast, border on/off)

Prompt-ID: P-2026-09-30-1815
Chat: C-2026-09-30-1815
Lane: full (new persisted viewpoint field, more than three files, render path of nodes; Phase 1 then Phase 2 in cascade; critical zone only if the report proves it necessary, Layer Impact Report first, go-ahead RC-30 given at launch). Tier: heavy.
Status: eseguito 2026-09-30 · lane viewpoint-metaclass-colors · c29280962, fa0b20de1; rework c76656bbc (merge trunk 45ff6c290), 390bcaddd · non fuso: hard-stop, lane probe on 3091 (light) 57/57, the four demo scenes 0 px from 45ff6c290, mutation bench 37/38, crops in frontend/scripts/smoke/_tmp_vpcolor_crops/vpc_after2_* (gitignored), verifica visiva alla chat

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-vpcolor`, branch `viewpoint-metaclass-colors`, created from the trunk `alfonso-frontend-jjtl` at `c1e0376dc`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-vpcolor`, branch `viewpoint-metaclass-colors`, `git log -1` is the docs commit that added this prompt, `git status` clean; if any differs, stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-09-30-1815 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Alfonso is away (lane auto): questions inside this lane's perimeter are answered by the chat as recommended (RC-21, RC-25); write your recommendation so it can be adopted verbatim.

## Contesto (non rifare l'analisi)

Alfonso's request (2026-09-30): in the properties panel of a viewpoint (`frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`, today Name and the Type segmented control with the hint «Only Syntax can be chosen here.»), add a toggle. When the toggle is on, the panel shows a **Border** checkbox and a **color picker**. With the toggle on, every node that is an instance of a metaclass (M1 objects) is filled with a color taken from a color scheme derived from the picked color, one color per metaclass; the node text becomes black or white, whichever contrasts more with the fill; the Border checkbox decides whether the node has a border or not.

Decisions taken by the chat (provisional, unattended, RC-25; write them as R-VP rows `provisional, unattended` in `docs/decisions.md`, next free number after the last R-VP row on this branch):

1. **Labels.** Toggle: «Color by metaclass» (off by default). Controls under it: «Base color» (native `<input type="color">` styled like the other `wp-field` inputs, with the hex value shown beside it, 11 px) and «Border» (checkbox, on by default). Default base color `#0ea5e9`. The controls are hidden when the toggle is off (progressive disclosure); their values are kept when the toggle goes off and on again. Read-only viewpoints show the controls disabled. Reuse an existing toggle/switch component or class of the workbench properties if one exists (grep first); otherwise a checkbox styled as the panel's other checkboxes. Bootstrap Icons only.
2. **Persistence.** Three optional fields on the viewpoint (the D-object behind `LViewPoint`), for example `metaclassColoring?: { enabled: boolean; baseColor: string; border: boolean }` or three flat fields, whichever the viewpoint's existing field pattern and serialization make additive and safe: absent means off, old projects load unchanged, the value is saved with the project, undo/redo works like the Name field. Write through the `L` proxy as the Name field does. If adding the field requires a creator or `SetFieldAction` path the critical-zone hook guards, write the Layer Impact Report first (RC-30 go-ahead given).
3. **Palette.** A new pure module (no React, no DOM), for example `frontend/src/view/viewPoint/metaclassPalette.ts` (grep the name first): `metaclassPalette(baseColor: string, count: number): string[]`. Convert the base color to HSL; color 0 is the base color itself; color i rotates the hue by i × 137.508° (golden angle) keeping the base saturation and lightness, both clamped to S 40..80 %, L 40..72 % so that no fill is washed out or near black. Deterministic: the same base and count always give the same list. Metaclass → index assignment: the order of the classes in the metamodel (stable across reloads and renames), not a hash of the name, not the order of appearance on canvas. Abstract classes consume no index only if the report shows that is simpler; otherwise every class has one.
4. **Text color.** `contrastText(fill: string): '#000000' | '#ffffff'`: WCAG 2.x relative luminance, contrast ratio against black and against white, pick the higher; ties go to black. Applies to every text the node paints (name, attributes, labels inside the node). Edge labels are not touched.
5. **Border.** Border on: the node keeps a 1 px border in a darker shade of its fill (same hue, lightness minus 25 points, floor 10 %). Border off: no border (stroke none or width 0, whichever the renderer uses), no layout shift (node size unchanged, measured).
6. **Scope.** Applies to M1 object nodes of models shown under this viewpoint, in both paths that paint nodes: native JSX views and IR-rendered views (derived viewpoints included, since the screenshot is «DemoFlowB (derived)»). M2 metamodel nodes, edges, ports, the selection outline, hover and error styles are not touched. The coloring overrides the view's own fill only while the toggle is on; toggle off restores exactly what the viewpoint painted before (0 px, same colors, measured). Only the viewpoint that owns the setting is affected; other viewpoints and the default viewpoint are unchanged.

Concurrent lanes of another chat on branches from the same trunk sha: `selection-outline` (P-2026-09-30-1808, selection outline of IR-rendered nodes, renderer under `editor-v2/`) and `edge-ends` (P-2026-09-30-1810: `irTypes.ts`, `irValidate.ts`, `irCompile.ts`, `irEdgeViews.ts`, `UnifiedEdge.tsx`, `edgeUtils.ts`, `EdgeAuthoringPanel.tsx`). Keep out of all edge files and out of `irTypes.ts`, `irValidate.ts`, `irCompile.ts`; if the IR node path can only be reached through one of them, stop with `Outcome: question` and a recommendation. In the node renderer keep the hunk small and away from selection code so the later merge is mechanical.

## COSA

The feature above, end to end: panel controls, persisted fields, pure palette and contrast functions with tests, application in the node render paths.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_viewpoint_metaclass_colors.md` (naming `discovery_<date>_<description>.md`): how a viewpoint's fields are declared, serialized and written (file:line, verbatim); where node fill, stroke and text color are decided for native views and for IR-rendered views, and the single point (or two) where a viewpoint-level override can be applied; how a node knows its metaclass and the metaclass order in its metamodel; how the active viewpoint of a model view is read at render time; the exact Phase 2 file list with a size estimate; critical-zone involvement (Layer Impact Report if any); questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless a question has no single recommendation, the file list exceeds eight source files, or it touches a file excluded above.

Phase 2: `ViewpointProperties.tsx`, `properties.scss`, the viewpoint D-object and its L proxy (additive optional field only), the new palette module, the render point(s) the report names, their tests; a log entry in `docs/log-inbox/views.md`; the R-VP rows; this prompt's Status.

Out of scope: edge files listed above, `notations.ts`, `viewpointDerivation.ts`, `deriveViewpoint.ts`, every demo project, `NewViewpointDialog.tsx`, `docs/CHANGELOG.md` (the merge adds the line), jjodel-docs.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the R-VP rows in `docs/decisions.md`.
2. Phase 1 report, committed. Before introducing any new CSS class, identifier, field name or module name, grep the codebase and prove it is unused.
3. Tests first: palette (determinism, color 0 equals base, clamps, distinct hues for 8 classes, invalid hex falls back to the default); contrast (`#ffffff` gives black, `#000000` gives white, `#0ea5e9` and a mid gray as computed by the WCAG formula); the field is absent on a fresh viewpoint and survives a save/load round trip; the override resolver returns nothing when the toggle is off. Mutation bench on the palette, contrast and resolver; report the score.
4. Implement. Gates: typecheck (the known baseline only), full vitest (the known reds at import only), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme, isolated profile. On a model with at least three metaclasses (DemoFlowB under its derived viewpoint, and a native-view model such as DemoESM or the report's choice): toggle off, then on with the default base, then base `#f59e0b`, border on and off. Measure from the DOM for three nodes: computed fill, text color, stroke, node box before and after (0 px change). Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_vpcolor_crops/` (gitignored; check), including the properties panel with the toggle off and on. The four demo scenes in the default viewpoint 0 px from `c1e0376dc`.
6. Commits: `feat:` code and tests, `docs:` report, R-VP rows, log entry, Status (RC-17: log entry and Status uncommitted while the visual check is due is acceptable, say which); stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the decisions taken (unattended) and the decisions awaiting Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser or ports 3000/3001/3003, a call to an AI model.

## HARD STOP

After the Phase 2 commits and the visual measures: `Outcome: hard-stop` (visual check due). Earlier: `Outcome: question` per the DOVE conditions.

## NON FARE

No change to existing viewpoints' look when the toggle is off. No new dependency (color math written by hand). No renaming of existing classes or identifiers. No edits to M2 node styling.

## RIFERIMENTI

`ViewpointProperties.tsx`, `properties.scss`, `frontend/src/view/viewPoint/viewpoint.ts` (`getViewpointType`), the IR node renderer under `frontend/src/components/editor-v2/`, R-VP rows, `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md`.

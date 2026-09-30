# Prompt: Phase 1 and 2 in cascade, canvas export broken in all four options (PNG, JPEG, SVG, Copy to clipboard)

Prompt-ID: P-2026-09-30-2035
Chat: C-2026-09-30-2035
Lane: fast (bug fix, expected two to four files, no critical zone; Phase 1 then Phase 2 in cascade, no merge to the trunk by this lane). Tier: heavy.
Status: da eseguire

Protocol: docs/PROTOCOL.md, clauses P1..P16 apply unless this prompt says otherwise.

Worktree: `~/jjodel-w-canvasexport`, branch `canvas-export-fix`, created from the trunk `alfonso-frontend-jjtl` at `31999a630`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-canvasexport`, branch `canvas-export-fix`, `git log -1` is the docs commit that added this prompt, `git status` clean; if any differs, stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-09-30-2035 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Alfonso is away (lane auto): questions inside this lane's perimeter are answered by the chat as recommended (RC-21, RC-25); write the recommendation so it can be adopted verbatim.

## Context (do not redo the analysis)

Alfonso's report (2026-09-30): exporting the canvas does not work in any of the four options of the export menu. The four options are PNG, JPEG, SVG and Copy to clipboard.

What the chat already read on the trunk (verify, do not trust):

1. `frontend/src/components/abstract/tabs/MetamodelTab.tsx` lines 36-75: a listener on `JjodelEvents.EXPORT_CANVAS` (window event, detail `{ format: string }`). It reads `format`, but the only branch that uses it is `'clipboard'`. Every other format goes to `CanvasExportService.export(canvasRef.current)` with no options, so JPEG and SVG cannot work through this path: the file is always a PNG.
2. `frontend/src/services/CanvasExportService.ts`: built on `html-to-image` (`toPng`, `toJpeg`, `toSvg`, `toBlob`). It exports `canvasElement.querySelector('.Graph') || canvasElement`, forces `style.transform = 'none'` on that element, defaults `pixelRatio: 0.5`, `style: { padding: '5px' }`, and filters nodes by class name. Suspects to test at runtime: the `transform: 'none'` reset on the pan/zoom container, the `.Graph` element choice (it may be an empty or zero-size container, with nodes in a sibling layer), the pixel ratio, fonts and cross-origin images making `html-to-image` throw, `ClipboardItem` availability and permissions.
3. `frontend/src/components/export/ExportImageMenu.tsx` and `frontend/src/hooks/useCanvasExport.ts` are a second entry point. Only `MetamodelTab.tsx` imports `CanvasExportService` directly; find out who dispatches `EXPORT_CANVAS` (the chat saw a match in `frontend/src/pages/components/Navbar.tsx`) and whether `ExportImageMenu` is mounted anywhere at all.
4. git history of the feature: `dae519413` canvas export, then `260e1a0ce uniform ai services attempt` touched the same files. Read both diffs: one of them may have broken the working version.

Do not assume the cause. The fix is whatever the runtime reproduction shows, for each of the four options separately.

## COSA

Make the four export options work end to end on the canvas of a metamodel (M2) and of a model (M1) shown in a viewpoint: PNG, JPEG and SVG download a file of the right type that opens and shows the whole diagram (all nodes and edges visible, nothing cropped, readable resolution, white background), and Copy to clipboard puts a PNG of the same image on the clipboard or, where the browser forbids it, shows a clear error alert. The format chosen in the menu must reach the service.

## DOVE

Phase 1 (read-only): write `docs/discovery/discovery_2026-09-30_canvas_export_broken.md` (naming `discovery_<date>_<description>.md`): the full event path from the menu click to the service call (file:line, verbatim), which element is exported and its measured size, the reproduction of each of the four options in the lane's own dev server (per option: what happens, console error if any, size and type of the produced file or blob), the root cause of each failure, and the smallest fix for each. Commit it.

Phase 2 (scoped): `frontend/src/components/abstract/tabs/MetamodelTab.tsx`, `frontend/src/services/CanvasExportService.ts`, `frontend/src/hooks/useCanvasExport.ts` and `frontend/src/components/export/ExportImageMenu.tsx` only if the report proves they are on the broken path, plus the dispatcher named by the report (Navbar or equivalent) if it sends the wrong payload, plus a test file next to the service. A log entry in `docs/log-inbox/views.md`; this prompt's Status.

Out of scope: any critical-zone file (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`), edge routing files, the IR renderer under `editor-v2/`, PDF export, new export formats, new dependencies, `docs/CHANGELOG.md` (the merge adds the line), jjodel-docs. If the root cause sits in a file outside the DOVE list, stop with `Outcome: question` and a `Recommended:` line.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6), `docs/PROTOCOL.md` P16, RC-20..RC-34.
2. Phase 1 report, committed. Before introducing any new identifier, grep the codebase and prove it is unused.
3. Tests first where the code is pure: the service must pass the requested format to the library and build the right filename extension (`png`, `jpeg`, `svg`); the `EXPORT_CANVAS` handler must route `png`, `jpeg`, `svg`, `clipboard` to four distinct calls (extract the routing into a small pure function if that is what makes it testable). Mutation check on the routing.
4. Implement the smallest fix per root cause. Keep the default filename pattern. Do not change what the canvas looks like on screen.
5. Gates: typecheck (the known baseline only), full vitest (the known reds at import only), build exit 0, `check:docs`, `check:addonly`.
6. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme, isolated profile. On a model with at least three classes and several edges (DemoESM or the report's choice) and on one M2 canvas: trigger each of the four options through the real UI (File menu, or the menu the report names), intercept the download or read the clipboard in the probe, and check per option: file type and non-zero size, image dimensions, and that the image is not blank (sample pixels: share of non-white pixels above 1 %). Save crops under `frontend/scripts/smoke/_tmp_canvas_export/` (gitignored) and report the path.
7. Commits: `fix:` code and tests, `docs:` report, log entry, Status (RC-17: log entry and Status uncommitted while the visual check is due is acceptable, say which); stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the four per-option measures, the mutation score, the decisions taken (unattended) and the decisions awaiting Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser or ports 3000/3001/3003, a call to an AI model.

## HARD STOP

After the Phase 2 commits and the four measures: `Outcome: hard-stop` (visual check due). Earlier: `Outcome: question` per the DOVE conditions.

## NON FARE

No new dependency. No renaming of existing exported identifiers. No change to the on-screen canvas. No touching of the critical zone.

## RIFERIMENTI

`MetamodelTab.tsx`, `CanvasExportService.ts`, `useCanvasExport.ts`, `ExportImageMenu.tsx`, `JjodelEvents.EXPORT_CANVAS`, `Navbar.tsx`, commits `dae519413` and `260e1a0ce`, `html-to-image` 1.11.x.

# Prompt: save/loading overlay must cover the Properties rail

Prompt-ID: P-2026-09-30-2025
Chat: C-2026-09-30-1940
Lane: fast (z-order bug, one or two style files, measure then fix, no Phase 1 hard stop). Tier: heavy.
Status: da eseguire
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-loaderz`, branch `loader-over-rail`, created from the trunk `alfonso-frontend-jjtl` at `45ff6c290`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-loaderz`, branch `loader-over-rail`, `git log -1` is the docs commit that added this prompt, `git status` clean; if any differs, stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-09-30-2025 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Alfonso is away (lane auto): questions inside this lane's perimeter are answered by the chat as recommended (RC-21, RC-25).

## Contesto (non rifare l'analisi)

Alfonso's report (2026-09-30, screenshot on localhost:3001, DemoFlowB under «DemoFlowB (derived)», Advanced mode): while the project is being saved, the dark loading overlay with the spinner dims the canvas, the left instances rail and the top bar, but the **right Properties rail stays fully bright on top of it** (tree of viewpoints, the model's properties). The overlay must cover the whole window, rail included, as it does for the rest.

What the chat read on the trunk (verify, do not trust): the overlay is `.loader-spinner` in `frontend/src/components/loader/style.scss` (`position: fixed`, `z-index: 99999`, i.e. `--z-loading`), rendered by `Loader` from `App.tsx` (`{isLoading && <Loader/>}` at about lines 127, 202, 210). The rail mounts `.properties-tree-overlay` `position: fixed` at `z-index: 900` (`frontend/src/components/editors/properties-with-tree-view.scss` about line 1486), and `--z-navbar` was set to 950 because of it (`frontend/src/styles/tokens/_z-index.scss`). A 99999 overlay losing to a 900 element means the overlay sits inside a stacking context lower than the rail's (or the rail is portaled above it): the root cause is the stacking context, not the numbers.

Decision (provisional, unattended, RC-25): fix the stacking so the loader is above everything the app paints while saving, **without lowering the rail** (that breaks rc-dock and the navbar fix recorded in `_z-index.scss`). Preferred order, first that works: (1) render the loader where its `position: fixed` lives in the root stacking context (for example the save path's Loader mounted at the App root or through a portal to `document.body`, whichever the code already uses elsewhere; grep for `createPortal` first), (2) remove the ancestor property that creates the trapping context only if it is inert for everything else (measured). Do not raise the rail. Do not touch the `transform: rotate(180deg)` quirk unless it is the cause.

Concurrent lanes: `edge-click-properties` (P-2026-09-30-1940, `useJjomSelection.ts`, `EditorV2.tsx` selection hunk), `viewpoint-metaclass-colors` (P-2026-09-30-1815, `ViewpointProperties.tsx`, viewpoint `properties.scss`, node render paths), `edge-ends` (P-2026-09-30-1810, IR edge files). Keep out of all of them. If the fix needs `properties-with-tree-view.scss`, touch only the selector the measure names, with a one-line hunk.

## COSA

The save/loading overlay covers the Properties rail too.

## DOVE

Measure first, then fix. Report `docs/discovery/discovery_2026-09-30_loader_over_rail.md` (naming `discovery_<date>_<description>.md`): which `Loader` instance shows during save, its DOM ancestors with each ancestor's `position`, `z-index`, `transform`, `filter`, `isolation`, `contain`, `will-change` (computed, from a probe), the rail overlay's own ancestors and stacking context, the root cause in one sentence, the fix. Commit the report (`docs:`) together with the fix commit sequence below.

Files expected: `frontend/src/App.tsx` and/or `frontend/src/components/loader/Loader.tsx` / `style.scss`; at most one other file the report names. More than three source files: stop with `Outcome: question`.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6) and `docs/PROTOCOL.md` P16.
2. Probe (`lane-run probe`, free port, not 3000, 3001, 3003; light theme; isolated profile): open DemoFlowB, trigger a save (the same action Alfonso uses: File > Save or Cmd+S, whatever the app binds), and while the overlay is up take `document.elementFromPoint` at the centre of the rail and at the centre of the canvas: before the fix the rail point returns a rail element, after the fix both return the overlay (or a child). Crop both states `sips -Z 600` under `frontend/scripts/smoke/_tmp_loaderz_crops/` (gitignored; check). If the save is too fast to catch, force the overlay on from the probe the way the app does (the same flag `isLoading` reads) and say so.
3. Regressions to measure after the fix: the loader on project open and on navigation still shows and covers the window; navbar menus and the rail tree overlay still behave (navbar above the rail when no loader); the four demo scenes 0 px from `45ff6c290`.
4. Gates: typecheck (known baseline only), full vitest (known reds at import only), build exit 0, `check:docs`, `check:addonly`.
5. Commits: `fix:` code, `docs:` report plus a log entry in `docs/log-inbox/` (the file for app shell or UI; the report names it) plus this prompt's Status; stage by explicit path. Stop with `Outcome: hard-stop`, shas, the elementFromPoint measures before and after, crops path.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser or ports 3000/3001/3003, a call to an AI model.

## HARD STOP

After the commits and measures: `Outcome: hard-stop` (visual check due).

## NON FARE

No lowering of the rail's z-index, no change to `--z-navbar`, no new dependency, no renaming of classes.

## RIFERIMENTI

`frontend/src/components/loader/style.scss`, `frontend/src/App.tsx`, `frontend/src/styles/tokens/_z-index.scss` (comment on `--z-navbar`), `frontend/src/components/editors/properties-with-tree-view.scss` around line 1430-1490.

# Prompt: four demo scenes on the trunk after the staging merge (baseline)

Prompt-ID: P-2026-09-28-1025
Chat: C-2026-09-27-1437
Lane: fast (read-only measurement; saved report, no code change). Tier: light.
Status: eseguito 2026-09-28 · lane fast · `69f7dbea1` (discovery report) · quattro scene identiche a `888ea9a9d`, docking ok su entrambe le tab, nessun bisect necessario

Worktree: `/Users/alfonso/jjodel-w-scenes`, branch `scenes-base`, created from trunk tip `447e4239b`, `frontend/node_modules` symlinked (P14). Before anything else run `pwd` and `git branch --show-current`: if the answer is not that worktree on `scenes-base`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1025 · session <id>]` and ends with an `Outcome:` line (P16). Run probes in the foreground.

## COSA

Measure whether the merge of `staging` by another author (`447e4239b`, 12 feature commits of ticket #157, 20 code files) changed any of the four demo scenes. The previous known-good measurement is trunk `888ea9a9d` (identical scenes on every code merge of the night). Expected readings, unchanged:

- SM: 10 steps, Terminated.
- Petri, Bound 4: 4 steps, `Deadlock · ε: t2 false`.
- ESM: 10 steps, halt line whole on two rows.
- Flow B: 6 steps, Terminated, `fin · count = 2`.

Also read the docking of the Simulation panel on each scene (panel docks at the bottom of the editor, the two tabs metamodel and model both open the panel, `Simulation` chip present) because the merge touches `Dock.tsx`, `DockManager.tsx`, `MyRcDock.tsx`, `Navbar.tsx`, `LeftBar.tsx`, `joiner/classes.ts`, `joiner/index.ts`.

Verdict per scene: identical, or different with the measured text. If any scene differs, name the commit of the range `888ea9a9d..447e4239b` that causes it with `git bisect`-style checks on the touched files only (at most 3 steps), and stop there.

## DOVE

- Nothing under `frontend/src` is written. Files you may add: the report `docs/discovery/discovery_2026-09-28_scenes_after_staging_merge.md`, this prompt file, one entry in `docs/log-inbox/simulation.md`. Commit on `scenes-base` with explicit paths.
- Harness to reuse, as scratch, not committed: `/Users/alfonso/jjodel-release/frontend/scripts/smoke/_tmp_m0209_walk.ts`, `_tmp_m0209_common.ts`, `_tmp_m0209_scenario.js`, `_tmp_m0209_vite.config.ts` (the four scenes, one per run with `DEMO_SCENE=sm|petri|esm|flowB`). Copy them into this worktree's `frontend/scripts/smoke/` under a `_tmp_s<id>_` prefix (gitignored), keep its probe port (3029) or use a free one; check with `lsof` before starting. Crops go to `~/.jjodel-lanes/shots_scenes_after_staging/`, light, 1600x1000, cropped at most 600 px wide for the report.
- Ports 3000, 3001 and 3003 belong to Alfonso: never start, stop or reconfigure them. Do not push. Do not merge. Do not touch `/Users/alfonso/jjodel-release`.

## COME

1. Confirm the worktree tip is `447e4239b` and the tree is clean.
2. Run the four scenes, one per run, on the dev server of this worktree. Record per scene: steps, terminal line, halt line, the docking reading, console error kinds against the known baseline (`failed to get project {project: null}` is known).
3. Write the report: goal, files read, table scene by verdict, the measured text of every difference, risks, open questions. English only in committed files, no em dashes.
4. Log entry in `docs/log-inbox/simulation.md`, flip Status, one closure commit on `scenes-base`.

## RIFERIMENTI

`docs/demo/models_2026_simulator_demo.md`, `docs/discovery/discovery_2026-09-27_freeze_readiness.md`, `docs/log-inbox/simulation.md` (scenes of the night), `frontend/scripts/smoke/README-probes.md`, `docs/PROTOCOL.md` P14, P16.

# Prompt: two console errors on the trunk before the MODELS demo, discovery (read-only)

Prompt-ID: P-2026-10-04-1025
Chat: C-2026-10-03-1610
Lane: full (Phase 1 discovery read-only, hard stop; any fix is a later lane written by the chat from this report). Tier: heavy (RC-32: the questions cross `reducer.ts`, `LModelElement.tsx` and the save path). Model: the default of `.claude/settings.json`, no deviation.
Status: eseguito 2026-10-04 · lane console-errors-disc · discovery only · probe 9e54b5d96 (frontend/scripts/probe/console-errors-demo.ts, 40 fresh pages on 3084, light, ALL GREEN) · report ecea25e93 docs/discovery/discovery_2026-10-04_console_errors_demo.md · hard-stop, two decisions taken unattended and one awaiting Alfonso (fix before the freeze or after Málaga, recommended after) in §0

Worktree: `~/jjodel-w-consoleerr`, branch `console-errors-disc`, cut by the chat from `alfonso-frontend-jjtl` at `5b4d6c887`, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Two console errors show on the trunk during the four demo scenes. Both are pre-existing and have been noted by several lanes as noise, never investigated. Alfonso (2026-10-04) wants to know, before the merge freeze of 2026-10-07, whether either one can hurt the MODELS demo or hides a defect, and only then decide whether to fix it before or after the demo.

1. **E1, «Invalid action path 0».** Thrown in `deepCopyButOnlyFollowingPath` (`frontend/src/redux/reducer/reducer.ts`, about line 43) for a `SetFieldAction` (or `SetFieldAction2`) whose path is undefined. Seen at scene open, intermittent (DemoPEST, DemoESM, DemoPetri; references: `docs/log-inbox/simulation.md` around line 262, `docs/log-inbox/views.md` around line 341, `docs/discovery/discovery_2026-09-25_hash_change_open.md` around line 124).
2. **E2, «Cannot serialize in ecore, found loop».** Thrown in `generateEcoreJson_impl` (`frontend/src/model/logicWrapper/LModelElement.tsx`, about line 5939). Seen on DemoPEST and DemoESM after the model tab opens and Reset runs, and around save (24 occurrences per run in the I/O board probe; references: `docs/discovery/discovery_2026-10-03_sim_io_board.md` lines 79 and 292, `docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md` line 159).

For each error answer, with file and line and numbers rather than impressions:

- **Who dispatches or calls it.** The exact action (type, target id, path) for E1; the exact caller chain and the element cycle for E2 (which objects, which reference closes the loop). Capture full stacks in the probe.
- **When.** Count per scene and per step of the demo script (`docs/demo/models_2026_simulator_demo.md`): open, model tab, Simulation panel, Reset, Step, the board, save. Five fresh pages per scene at least, so intermittency gets a rate.
- **Consequence.** E1: is a write lost (compare the state the action meant to write with the state after), or is the action a harmless no-op? E2: does save still persist a complete project (round trip: save, reload, compare the model and the viewpoints), does the `.ecore`/Ecore JSON export the user can download contain everything, and is the «loop» a real cycle or a false positive of the visited-set check (for example a shared, non-containment reference visited twice)?
- **Visibility.** Anything the audience can see (a toast, a stalled panel, a slower Reset, a missing element), or console only.
- **Smallest fix**, the files it would touch, whether any is in the critical zone (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`, `viewpoint/ir/`), and how it squares with R-UNDO-7/R-UNDO-8 if it touches the reducer.
- **Recommendation**: fix before the freeze, after Málaga, or leave as is, with the risk of each.

## DOVE

Read-only on the app. You may add one probe under `frontend/scripts/probe/` (grep the name first; `derived-notations-edges.ts`, `petri-ink-ports.ts` and the I/O board probe are models) and use the fixtures in `frontend/scripts/probe/fixtures/` (byte copies of `~/jjodel-demo-exports/`, never modified). Write the discovery report `docs/discovery/discovery_2026-10-04_console_errors_demo.md` (§0 «Answer in brief» first, at most 40 lines, with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» per RC-26). No change under `frontend/src/`; critical-zone files are read only. Plus the closure docs: this prompt's Status and one entry in `docs/log-inbox/simulation.md` (where the ticket lives). Lanes P-2026-10-04-0150 (`sim-io-clock`) and P-2026-10-04-0935 (`sim-hide-events`) are running under `editor-v2/sim/`: do not touch their worktrees.

## COME

1. Read `CLAUDE.md` (sections 3, 6, 17, 21.2), `docs/PROTOCOL.md` P16, RC-21, RC-25, RC-26, R-UNDO-7, R-UNDO-8, D-UI-15, the references above, and the files of the two throw sites with their callers.
2. Probe through `lane-run probe <worktree> <probe.ts> --port 3084` (never 3000, 3001 or 3003), 1600×1000, light theme (dark retired by D-UI-15). Hook `console.error` and `window.onerror` before the app boots to keep full stacks; for E1 record the offending action object; for E2 record the cycle path. Run the demo script steps on the four scenes, five fresh pages each.
3. For E2's consequence, do the save round trip and the Ecore export on DemoPEST and DemoESM in the probe and compare, field by field, what goes out with what came in.
4. Commit the probe (`probe:`) and the report (`docs:`), then the closure docs commit (Status flip with lane, shas and «discovery only»; inbox entry); stage by explicit path. Stop with `Outcome: hard-stop`, the report's path and its two decision lists.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree and `~/.jjodel-lanes/P-2026-10-04-1025/` (no `/tmp`: scratch goes under the worktree's gitignored `frontend/scripts/smoke/_tmp_*` or the lane directory), any change under `frontend/src/`, removing the `frontend/node_modules` link.

## RIFERIMENTI

Tickets in `docs/log-inbox/simulation.md` (around line 262) and `docs/log-inbox/views.md` (around line 341); discovery reports of 2026-09-25 (hash change open), 2026-10-02 (edge ends trunk sync), 2026-10-03 (I/O board); R-UNDO-7, R-UNDO-8; the demo script `docs/demo/models_2026_simulator_demo.md`; Alfonso's request of 2026-10-04 («si», launch the discovery on the console errors).

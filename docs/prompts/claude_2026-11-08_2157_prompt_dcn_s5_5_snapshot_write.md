# DCN slice 5, lane 5: write the snapshot as a new M1 model, one undo

Prompt-ID: P-2026-11-08-2157
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane full · 3cc93959d
Lane: full, critical (D-layer writes: new DModel, objects, references, possibly DVertex; launched with `--critical-zone-goahead P-2026-11-08-2157`)
Go-ahead: Alfonso 2026-11-08 18:21 «Go su tutto» on R-DCN-30, which names this write lane and its Layer Impact Report
Depends: lane 4 P-2026-11-08-2124 (`planSnapshot` in sim/simSnapshot.ts, 73476ef3f) on dcn-s5; discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §B
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No subagents, no background tasks. Every reply opens with [P-2026-11-08-2157 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read §B of the report and lane 4's log entry; grep first, about 60 lines around; never read a whole file over 400 lines (`LModelElement.tsx`, `ProjectEditor.tsx`, `reducer.ts`, `instantiate.ts`); summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. One item per commit.

## COSA

(0) **Layer Impact Report first** (CLAUDE.md §3.2 format), saved as `docs/discovery/lir_2026-11-08_dcn_snapshot_write.md` and committed alone before any code: layers touched (D-layer objects and references, the new DModel and its DGraph, possibly DVertex for the new model's views, undo history), what does not change (the source model, the run, the sync layer of the source), cross-layer interaction, side-effect safety, smoke scenarios (Families.ecore import, open an existing project, save and reopen). If the report finds that the write needs `useJjomSync.ts`, `portDistribution.ts` or `canvasToJjom.ts` changes, stop with Outcome: question.

(1) **Writer.** A new module next to `simSnapshot.ts` (grep the name first) exporting `writeSnapshot(plan)` that executes `planSnapshot`'s operations: the new model by the sequence the report cites (`DModel.new` with the source's metamodel, `uniqueModelName` for the name, the DGraph and project registration as `ProjectEditor.tsx` about 1768-1805 does; not `createM1`, Rule 21, and no tab opened), every object created in containment order, references written through `.values = [id]` from the plan's temporary keys, attributes through `.value`, σ overrides per the plan; slots found by `instanceof` (lane 4's contract). The whole write is one undo group (`history.beginUndoGroup()` / `endUndoGroup()`, `reducer.ts` about 1148-1169), ended only after the last write landed, as `instantiate.ts` about 797-805 does; no TRANSACTION around DVertex or DVoidEdge creation (Rule 12). Report `unwritten` from the plan to the caller. Expose it as a function the panel button (lane 6) will call with the live run's shown step; no UI in this lane.

(2) **Tests** where the layers allow (pure parts, the undo-group bracketing with a fake history); the rest is held by the probe.

(3) **Probe** `frontend/scripts/probe/dcn-snapshot.ts` (new; free port, not 3001; temporary node_modules symlink removed at the end): import `~/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel`, run Reset, 20 Ticks, takeOff, 3 Ticks, call the writer through the page (the same entry lane 6 will use). Checks: a new model named `drone (snapshot step 24)` exists (or with the uniqueness suffix); its instances and links equal the source's by name and classifier; `dji` slots carry σ (Mode Flying slots: distance 3, speed 1, battery 97, chargeRate 1); the source model is byte-equal before and after (serialize both); `runSignature` of the live run is unchanged; one undo removes the whole new model and nothing else; the new model reopens as an object diagram and a Reset on it classifies `dji` as Flying. Crops into `~/.jjodel-lanes/P-2026-11-08-2157/crops/`: `1-snapshot-open` (the new model's object diagram with dji's rows). Smoke of the LIR scenarios: say which you ran and how.

(4) **Gates**: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs.

(5) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report: the LIR path; Smoke visivo: crop read by the lane, chat to read it). Status flip of this prompt. `git add` only named files. No push, no merge. Final message: LIR summary, files and commits, gate table, probe MEAS, crop description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/ (the new writer module and its test; `simSnapshot.ts` only to fix a plan defect found here, reported); the D-layer and L-layer APIs are called, not changed (`LModelElement.tsx`, `reducer.ts`, `nameLookup.ts`, `ProjectEditor.tsx` read-only); frontend/scripts/probe/dcn-snapshot.ts (new); docs/discovery/ (the LIR), docs/log-inbox/dcn.md, this prompt. If a change in a core file is needed, stop with Outcome: question. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §B; lane 4's entry in docs/log-inbox/dcn.md (writer contract); docs/decisions.md R-DCN-27, R-DCN-30; CLAUDE.md §3.1, §3.2, Rules 12, 20, 21; frontend/src/model/CLAUDE.md §9.3.

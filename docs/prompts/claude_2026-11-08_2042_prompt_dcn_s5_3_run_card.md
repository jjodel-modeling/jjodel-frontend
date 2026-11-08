# DCN slice 5, lane 3: the run card on the instance node

Prompt-ID: P-2026-11-08-2042
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (UI: `sim/SimNodeRunState.tsx` and its stylesheet; probe and crops)
Depends: lanes 1 (dcnCanvasState.ts), 2 (getSimDcnNode), 0 (drone with the UML object viewpoint) on dcn-s5; R-DCN-25, 26, 29; discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file (not `ObjectNode.tsx`, `IRRow.tsx`, `IRNodeContent.tsx`, nothing under `viewpoint/ir/`): if the card cannot be done without one, stop with Outcome: question. No new dependency. No subagents, no background tasks. Every reply opens with [P-2026-11-08-2042 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: read only §A of the report and the cited line ranges; grep first, about 60 lines around; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. One item per commit.

## COSA

(1) **The card.** In `frontend/src/components/editor-v2/sim/SimNodeRunState.tsx`, when `getSimDcnNode(objectId)` returns data, render a run card below the node in the same absolutely positioned, `pointer-events: none` layer the Petri overlay uses (R-SIM-3): one compartment per viewpoint with the viewpoint name and the dynamic classes as pills, the active ones highlighted (cyan accent `#0ea5e9` on slate, as the design tokens in use; grep the existing sim tokens and reuse them); a line per dormant slot, greyed, `name = value`; a monitor icon (Bootstrap Icons only, e.g. `bi-activity`) on an active class that has running monitors, with the monitor names in small text; a short list of static slots whose σ differs from Reset (`speed 0 → 1`). The card shares one column with `.sim-node-run__tags` (`simNodeRunState.scss` about 132-140) so they do not overlap. Petri runs unchanged.

(2) **Ring.** The dashed ring of a DCN instance that shows the card is suppressed (R-DCN-29); other nodes keep it.

(3) **Styles** in `simNodeRunState.scss`, 11px secondary text, 8px grid; grep every new class name first; no change to existing class names.

(4) **Tests**: none for rendering (R-DCN-32, no new test dependency). The probe holds it.

(5) **Probe**: extend `frontend/scripts/probe/dcn-drone-run.ts` (free port, not 3001; temporary node_modules symlink removed at the end): assertions on the card's DOM (the Mode compartment shows Charging active after Reset; after Ticks to Ready and takeOff it shows Flying active; `chargeRate` appears in the dormant list in Flying and not in Charging; the monitor icon is on Flying; step back with the slider returns the Charging card; the ring is absent on `dji` while the card shows). Crops at deviceScaleFactor 2 into `~/.jjodel-lanes/P-2026-11-08-2042/crops/`: `1-charging` (dji node with its card after Reset), `2-flying` (after takeOff and three Ticks), `3-stepback` (slider back to step 0), each framing the dji node with its card. Say what each shows.

(6) **Gates**: typecheck, typecheck:scripts, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs.

(7) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: crops read by the lane, chat to read them). Status flip of this prompt. Commits: card and styles, probe, docs. `git add` only named files. No push, no merge. Final message: files and commits, gate table, probe MEAS, crop descriptions, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/sim/SimNodeRunState.tsx, sim/simNodeRunState.scss (or the stylesheet the component imports), frontend/scripts/probe/dcn-drone-run.ts, docs/log-inbox/dcn.md, this prompt. Read-only elsewhere. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A; docs/decisions.md R-DCN-25, 26, 29, 32, R-SIM-3, R-SIM-106; frontend/src/model/simulation/dcn/dcnCanvasState.ts; frontend/src/components/editor-v2/sim/simRunState.ts (`getSimDcnNode`).

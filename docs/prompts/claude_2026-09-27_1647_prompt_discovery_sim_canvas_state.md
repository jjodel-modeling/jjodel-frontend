# Prompt: discovery, the run state on the canvas (S15, G3 canvas side, R-SIM-33 wave 3c)

Prompt-ID: P-2026-09-27-1647
Chat: C-2026-09-27-1437
Lane: full (Phase 1, read-only; Phase 2 is critical zone and amends R-SIM-4, so it waits for Alfonso and for MODELS; hard stop at the report)
Status: eseguito 2026-09-27 · lane sim-canvas-state · 4538d824f · verifica visiva in attesa (RC-23; Phase 2 slice A1, report 3c4a63e74; A2 waits for sim-modal)

Worktree: `~/jjodel-icons`, branch `sim-canvas-state` (cut by the chat from `alfonso-frontend-jjtl` at `7a4976853`, the trunk with E1 merged), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-icons`, branch `sim-canvas-state`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Wave 1, lane 3 of the backlog report (P-2026-09-27-1625), item S15: token counts and σ on the canvas nodes during a run. Today the canvas reads only `isSimActive` (`nodes/ObjectNode.tsx:40`). Find what a run-state channel into `viewpoint/ir/` needs: where the marking and the candidate transitions would be read, which components render them, the smallest channel that leaves R-SIM-4's core surface untouched if one exists, and what each option costs in critical-zone files. Read the backlog report with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§4.4 S15, §5, §8 D). Critical-zone files are read only; no Layer Impact Report is needed for a read-only lane, but the report must include the draft of the one Phase 2 would need.

## DOVE

Read-only: `frontend/src/components/editor-v2/**` (nodes, viewpoint, ir), `frontend/src/components/editor-v2/sim/**`, `frontend/src/model/simulation/**`, the critical-zone files, `docs/decisions.md` (R-SIM-4, R-SIM-33). Write: `docs/discovery/discovery_2026-09-27_sim_canvas_state.md` (new), one entry in `docs/log-inbox/simulation.md`, this prompt's Status flip. Probes (gitignored `_tmp_canvas_*`) on port 3018 only, if measuring render cost needs one.

## COME

1. Read `CLAUDE.md`, the backlog report sections, R-SIM-4 and R-SIM-33, and the files.
2. Map the render path of a node from the model to the pixel, and where run state could enter it.
3. At least two channel options (for example a React context above the canvas vs a store slice vs a DOM data attribute), each with the files it touches, whether it amends R-SIM-4, critical-zone files, render cost, and tests.
4. Report: objective, files read, the render path, the options, the recommended option, the draft Layer Impact Report for Phase 2, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
5. One docs commit with the report, the log entry and the Status flip: `docs(sim): canvas run-state discovery (P-2026-09-27-1647)`.
6. `Outcome: hard-stop` with the sha.

Never: an edit under `frontend/src`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3018.

## RIFERIMENTI

- Backlog report (above) §4.4, §5, §8 D; `docs/decisions.md` R-SIM-4, R-SIM-33; `CLAUDE.md` critical zone.
- `docs/PROTOCOL.md` P13, P16; RC-22, RC-25, RC-26, RC-30.

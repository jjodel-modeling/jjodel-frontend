# DCN L4.5d: a drone run in the app, crops of the Simulation panel

Prompt-ID: P-2026-11-08-0329
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (visual check of L4.5; probe only, no frontend/src)
Depends: P-2026-11-08-0248, 0303, 0315 on this branch
Worktree: ~/jjodel-w-dcn-l45, branch dcn-l45, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No edit under frontend/src. No subagents, no background tasks. Every reply opens with [P-2026-11-08-0329 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: do not read source files whole; grep for the selectors and labels you need (`DCN_PANEL_HEADING`, the DCN inputs row, the Reset and Choices controls in `SimulationPanel.tsx`). Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep only MEAS, FAIL and DONE lines; one probe run per tool call. Before each probe run check uptime: wait while the 1-minute load is above 20.

## COSA

(1) **Probe** `frontend/scripts/probe/dcn-drone-run.ts`, modelled on `dcn-drone-fixture.ts` (server on a free port, not 3001; a temporary node_modules symlink if needed, removed at the end). Import `~/jjodel-demo-exports/dcn/dcn-drone-objects.jjodel`, open the object diagram, open the Simulation panel, Choices Random with a fixed seed, Reset. Light theme, deviceScaleFactor 2, crops of the panel into `~/.jjodel-lanes/P-2026-11-08-0329/crops/`:
- `1-reset`: after Reset;
- `2-ready`: after the ticks that bring `dji` to `Mode = Ready` (at most 20 Tick presses);
- `3-takeoff`: after pressing `dji.takeOff()`;
- `4-flying`: after three more Tick presses.
One MEAS line per step with the panel's classification line text and the last-step text. Assertions: the panel shows Reset (not «Simulation not configured»); the heading is the DCN one; after `takeOff` the classification has `Mode = Flying` and the step is one trace entry.

(2) **If the drone never reaches Ready** in 20 ticks, or Reset or a step halts: report the MEAS lines, say which slot and which invariant cause it (known: `dji.power`, `dji.vmax` and every sensor slot are empty in the export), and stop with Outcome: question with a one-line Recommended. Do not edit the export, the fixture or frontend/src.

(3) Say for each crop what the panel shows.

(4) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters, measured with `wc -m` before committing; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: crops read by the lane, chat to read them). Status flip of this prompt. Commits: the probe (`test(dcn): drone run in the Simulation panel (P-2026-11-08-0329)`), then docs. `git add` only named files. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/scripts/probe/dcn-drone-run.ts (new); docs/log-inbox/dcn.md; this prompt. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md; docs/prompts/claude_2026-11-08_0248_prompt_dcn_l45_run_wiring.md (COSA (5)); frontend/scripts/probe/dcn-drone-fixture.ts; docs/decisions.md R-DCN-22.

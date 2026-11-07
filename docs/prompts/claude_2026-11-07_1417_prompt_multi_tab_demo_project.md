# Multi-tab demo project: a project where two tabs with different viewpoints are visibly different

Prompt-ID: P-2026-11-07-1417
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · no code commit (closed by P-2026-11-07-1439 after the context ceiling) · app check ALL PASS (24/24), crops in ~/.jjodel-lanes/P-2026-11-07-1439/, checked by the session · log entry in docs/log-inbox/multi-tab.md
Lane: full (builds a demo project through the running app; no source change)
Depends: L2 on the trunk (P-2026-11-07-1210), the layout-key fix (da2af3bf7)
Worktree: ~/jjodel-w-mtdemo, branch multi-tab-demo, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-07 14:15 «generami un progetto relativamente complesso in cui il multitab è evidente»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No source changes. No subagents. A dev server on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (only processes you started, by PID). Every reply opens with [P-2026-11-07-1417 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log. Scripts and fixtures only in `~/.jjodel-lanes/P-2026-11-07-1417/`; you may copy and adapt the 0457 and 0628 probes (`~/.jjodel-lanes/P-2026-11-07-0457/`, `~/.jjodel-lanes/P-2026-11-07-0555/`), never edit them in place.

## COSA

Build, through the app with Playwright (the same way the probes build their fixtures: UI gestures, JjScript console, L-layer writes; never by writing the project JSON by hand), a project that makes per-tab viewpoints obvious at a glance, then export it with the app's own Download Project.

(1) Domain: a small "Smart building" metamodel. Classes `Building`, `Floor`, `Room` (with `area: EInt`), `Device` (abstract) with subclasses `Sensor`, `Actuator`, `Controller`, an enum `DeviceKind`, and references `floors`, `rooms`, `devices` (containment) and `controls` (Controller → Actuator), `reads` (Controller → Sensor). Two models conforming to it: «Apartment» (1 floor, 4 rooms, about 12 devices) and «Office» (2 floors, 6 rooms, about 18 devices), with plausible names.

(2) Two exclusive syntax viewpoints, built with the viewpoint authoring the app offers (no new code):
- «Floor plan»: rooms as large boxes with their area, devices small; nodes laid out as a floor plan (rooms in a grid, devices placed inside or next to their room).
- «Control wiring»: devices only in the foreground, coloured by kind (sensor, actuator, controller each with its own fill), rooms de-emphasised; nodes laid out in three columns (sensors, controllers, actuators) so the `reads` and `controls` edges run left to right.
Each model gets distinct stored positions under each viewpoint, set by real drags or by the layout API the app uses, so that switching viewpoint visibly rearranges the canvas (R-MT-19).
If a requested visual (colour by kind, containment) is not reachable with today's authoring, use the nearest thing that is and say so in the report; do not change code.

(3) Verify on the dev server before exporting: open «Apartment» in one tab on «Floor plan» and «Office» in a second tab on «Control wiring»; switching tabs keeps each tab's viewpoint and positions (V1, V2 of 0457); one crop of each tab in light theme. Then Download Project and re-import the file into a fresh browser profile: the two models, the two viewpoints and the positions come back (count objects and compare three node positions per viewpoint).

(4) Deliver: the exported file at `~/Downloads/jjodel-multitab-demo.jjodel`, a copy in the lane folder, the crops, and `~/Downloads/jjodel-multitab-demo.md` (English, short) with the four steps to see the effect: import, open the two models in two tabs, pick the viewpoints, switch tabs and switch viewpoint inside one tab. State the current limits plainly: one tab per model until L6; a drag while two tabs show different viewpoints writes under the active viewpoint until L3 is merged.

(5) Status flip of this prompt and a short log entry in `docs/log-inbox/multi-tab.md`, one docs commit. Exit with Outcome: done.

## HARD STOP

After (5). Any change outside the lane folder, `~/Downloads/` and the two docs files is a stop with Outcome: question. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md; docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md (0457 addendum); ~/.jjodel-lanes/P-2026-11-07-1008/results-1008.md (welcome-key seed); docs/decisions.md R-MT.

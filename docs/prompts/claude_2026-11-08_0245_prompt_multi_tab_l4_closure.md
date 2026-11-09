# Multi-tab, lane L4: regressions and closure (continuation of P-2026-11-08-0150)

Prompt-ID: P-2026-11-08-0245
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · no source change · two-tab rerun at load 2.40 identical to 0150 · single tab 3/3 every step x3, container 0 failures, 0457 scenes 17 PASS 0 FAIL, demo 18/18 and 25/25 · LIR §7 · log entry in docs/log-inbox/multi-tab.md · hard-stop: visual check due · non fuso
Lane: full (measurement and closure of a critical-zone lane; no source change)
Depends: P-2026-11-08-0131 (LIR f888be09f, tests 634dceabf, code 587aed3cf), P-2026-11-08-0150 (gates and two-tab measurement, uncommitted, handoff `~/.jjodel-lanes/P-2026-11-08-0150/handoff.md`)
Worktree: ~/jjodel-w-mtl4, branch multi-tab-l4, at this prompt's commit (node_modules by the P14 symlink, re-created by you as the handoff says, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (third part of L4; Alfonso 2026-11-07 18:33 «via», 2026-11-08 00:03 «puoi procedere tu con i merge»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit, its parent is 1cc639636 and the tree is clean; otherwise stop with Outcome: blocked. Read the 0150 handoff first, only the sections you need: its tables and departures are the measurement of record; do not redo items (1) to (3) of 0150. No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-0245 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes only from the copies in `~/.jjodel-lanes/P-2026-11-08-0150/` (copy them into `~/.jjodel-lanes/P-2026-11-08-0245/`, never edit in place). Context discipline: two lanes of this L4 hit the ceiling; keep every read short and commit only at (3).

## COSA

(1) One rerun of the 0150 branch two-tab scene (class added with both tabs open: 1 vertex; registries kept after closing tab 1, cleared after the last), with the load gate respected, to settle the runs that started above 40.

(2) Single tab and two models, no regression: the 0628 layout probe three runs (3/3 at every step), the container probe one run (0 failures), the 0457 scenes V1, V2, V3, R-MT-18 once each, the 1730 two-tab demo scene once (tab A 18 nodes, tab B 25).

(3) Closure, one docs commit: an addendum to `docs/discovery/lir_2026-11-07_l4_populate_owner.md` with the 0150 tables, its departures (console creation through the calls of `ContextMenu.tsx:321`, `:325`; the view move in tab 2; the load-gate breach and this lane's rerun), the finding that the duplicate M2 edge of §3.7 does not reproduce on the parent, and this lane's tables; the 0131 entry in `docs/log-inbox/multi-tab.md` (P9) with the gates of 0131 and 0150, `Smoke visivo` and `Regressions` from 0150 and this lane, and the ticket (the sync registries have no model key: the last tab of model N clears the entries of an open tab on model M; out of L4); the Status flips of 0131, 0150 and this prompt; then `npm run check:docs` again after the edits. Exit with Outcome: hard-stop (visual check due on the 0150 crops).

## HARD STOP

After (3). Any source change is a stop with Outcome: question. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0150/handoff.md; docs/prompts/claude_2026-11-08_0131_prompt_multi_tab_l4_populate_owner.md; docs/prompts/claude_2026-11-08_0150_prompt_multi_tab_l4_check.md; docs/discovery/lir_2026-11-07_l4_populate_owner.md; docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.2, §3.7.

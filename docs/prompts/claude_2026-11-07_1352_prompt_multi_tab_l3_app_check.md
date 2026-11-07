# Multi-tab, lane L3: app check, crops and closure (continuation of P-2026-11-07-1249)

Prompt-ID: P-2026-11-07-1352
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (measurement and closure of a critical-zone lane; no source change)
Depends: P-2026-11-07-1249 (LIR d9424764a, tests 4678327cc, code 1015af5e1 and 0002f1ae4)
Worktree: ~/jjodel-w-mtl3, branch multi-tab-l3, at this prompt's commit (node_modules by the P14 symlink, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (second half of L3 under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit and the only uncommitted files are the 1249 inbox entry and Status flip; otherwise stop with Outcome: blocked. No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-07-1352 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log; one probe run per tool call. Check `uptime` before each probe run; above 40 on the 1-minute load, wait. Probes are copied into `~/.jjodel-lanes/P-2026-11-07-1352/`, never edited in place.

## COSA

(1) Single tab, no regression: the layout probe of 0628 (`~/.jjodel-lanes/P-2026-11-07-0555/`, the version 0628 ran, with the welcome-key seed noted by P-2026-11-07-1008) three runs: 3/3 at every step. Container probe one run: 0 failures.

(2) Two tabs on two models (the 0457 probe, `~/.jjodel-lanes/P-2026-11-07-0457/`), extended by one scene: tab A on model 1 with viewpoint V, tab B on model 2 with viewpoint W, each model with different stored positions under V and W. Focus A, then B, then A: each tab's nodes sit at its own viewpoint's positions, read from the DOM against `layoutByViewpoint[key]`; a drag in B writes under W only (the V record unchanged). Three runs. Also rerun V1, V2, V3 and R-MT-18 of 0457 once each.

(3) Crops in light theme, at most four.

(4) Closure, one docs commit: an addendum to `docs/discovery/lir_2026-11-07_l3_tab_layout_key.md` with the tables; the 1249 inbox entry with `Smoke visivo` and `Regressions` filled from this lane; the Status flips of 1249 and this prompt. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (4). Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/prompts/claude_2026-11-07_1249_prompt_multi_tab_l3_tab_layout_key.md; docs/discovery/lir_2026-11-07_l3_tab_layout_key.md; docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.3, §7; ~/.jjodel-lanes/P-2026-11-07-1008/results-1008.md (the welcome-key seed).

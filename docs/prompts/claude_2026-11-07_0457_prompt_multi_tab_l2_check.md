# Multi-tab, lane L2: app check, crops and closure (continuation of P-2026-11-07-0440)

Prompt-ID: P-2026-11-07-0457
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · app check 3 runs per tree, V1 V2 R-MT-18 3/3, V3 +1 undo per focus, one tab = base · LIR addendum · non fuso: hard-stop, visual check due
Lane: full (measurement and closure; no source change)
Depends: P-2026-11-07-0440 (code and gates on branch multi-tab-l2)
Worktree: ~/jjodel-w-mtl2, branch multi-tab-l2, at this prompt's commit (node_modules by the P14 symlink, removed at the end)
Request: none (second half of L2, launched under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -4, git status --short: the commits of P-2026-11-07-0440 are in the history and the only uncommitted files are its inbox entry and Status flip; otherwise stop with Outcome: blocked. No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit. Every reply opens with [P-2026-11-07-0457 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log; one probe run per tool call. Probes and fixtures only in `~/.jjodel-lanes/P-2026-11-07-0457/`; the L0b probe in `~/.jjodel-lanes/P-2026-11-07-0106/` may be copied, never edited.

## COSA

Measure in the app, two models open in two tabs (the only multi-tab reachable before L6), three runs each, one table per scene (expected, measured, match):

(1) V1: pick a viewpoint in tab A, focus tab B: B keeps its own viewpoint and its saved preference.
(2) V2: a tab that restores a saved viewpoint opens with that viewpoint's saved pan and zoom.
(3) V3: count the undo entries added by focusing a tab whose viewpoint differs from the root (one focus, then back). Report the number; do not fix it.
(4) R-MT-18: a model whose saved preference is `''` opens in abstract syntax; a model with no saved preference opens as before L2. Say in the report where the preference is stored and whether a value written before L1 can be told apart from one written after (read the code; a fresh browser profile cannot measure real users).
(5) No regression of one-tab behaviour: one model, switch A → B → A from the picker, positions as on the trunk.

Crops in light theme (D-UI-15), at most six, named `crop_<scene>.png`, in the lane folder.

Closure: append the figures to `docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md` as an addendum; one docs commit with the addendum, the inbox entry of 0440 (with `Smoke visivo` from this lane) and the Status flips of 0440 and 0457. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After the closure commit. Remove the node_modules symlink and stop the dev server first. No push, no merge.

## RIFERIMENTI

docs/prompts/claude_2026-11-07_0440_prompt_multi_tab_l2_tab_viewpoint_plumbing.md; docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §7 row L2, §9 Q2, Q7; docs/decisions.md R-MT-15, R-MT-18.

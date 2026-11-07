# Multi-tab, layout-key fix: app check, crops and closure (continuation of P-2026-11-07-0430)

Prompt-ID: P-2026-11-07-0431
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (measurement and closure of a critical-zone fix; no source change)
Depends: P-2026-11-07-0430 (code and gates on branch multi-tab-layout-key), R-MT-19
Worktree: ~/jjodel-w-mtlk, branch multi-tab-layout-key, at the closing code commit of P-2026-11-07-0430 plus this prompt (node_modules by the P14 symlink, removed at the end)
Request: none (second half of the layout-key fix, launched under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: the code commits of P-2026-11-07-0430 are in the history; the only uncommitted files are its inbox entry and Status flip; otherwise stop with Outcome: blocked. No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003), stopped before exit. Every reply opens with [P-2026-11-07-0431 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log; one probe run per tool call.

## COSA

(1) Reuse the L0b probe in `~/.jjodel-lanes/P-2026-11-07-0106/` (`layout-switch.mts` and its vite configs; copy them into `~/.jjodel-lanes/P-2026-11-07-0431/`, do not edit the originals). Three runs on this branch: expect 3/3 matches on steps 2, 5 and 6 (A → B → A, and after a reload). One table: expected position, rendered position, match.

(2) A container viewpoint (`useIRContainment`): one switch away and back, positions and container boxes unchanged by the fix.

(3) Cost on the 407-instance harness model (`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, fixture of `frontend/scripts/probe/large-model-click-profile.ts`): duration of one viewpoint switch, three runs, on this branch and on its parent on the trunk. Report the delta; a regression above 300 ms per switch is a stop with Outcome: question.

(4) Crops in light theme (D-UI-15) into the lane folder: before and after the switch on A, B, A for the three-node fixture; names `crop_<step>.png`, at most six.

(5) Closure: append the measured figures to the LIR `docs/discovery/lir_2026-11-07_layout_key_resync.md` as an addendum; one docs commit with the LIR addendum, the inbox entry of 0430 (updated with `Smoke visivo` from this lane), and the Status flips of 0430 and 0431. Exit with Outcome: hard-stop (visual check due) so the chat runs RC-23 on the crops.

## HARD STOP

After (5). Remove the node_modules symlink and stop the dev server first. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md §2-§5; docs/prompts/claude_2026-11-07_0430_prompt_multi_tab_layout_key_fix.md; docs/decisions.md R-MT-19.

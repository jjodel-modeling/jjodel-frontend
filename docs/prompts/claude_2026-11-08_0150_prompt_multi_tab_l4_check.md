# Multi-tab, lane L4: remaining gates, app measurement, crops and closure (continuation of P-2026-11-08-0131)

Prompt-ID: P-2026-11-08-0150
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · no source change · build exit 0, check:docs exit 0 · two tabs: vertex 2 -> 1, M2 edge 1 and 1 (§3.7 edge half not reproduced on the parent), registries kept after the owner closes, cleared by the last · cut at the AM-8 ceiling, closed by P-2026-11-08-0245 · hard-stop: visual check due · non fuso
Lane: full (gates, measurement and closure of a critical-zone lane; no source change)
Depends: P-2026-11-08-0131 (LIR f888be09f, tests 634dceabf, code 587aed3cf), its handoff `~/.jjodel-lanes/P-2026-11-08-0131/handoff.md`; docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.2, §3.7
Worktree: ~/jjodel-w-mtl4, branch multi-tab-l4, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (second half of L4; Alfonso 2026-11-07 18:33 «via», 2026-11-08 00:03 «puoi procedere tu con i merge»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -4, git status --short: HEAD is this prompt's commit, its parent is 587aed3cf and the tree is clean; otherwise stop with Outcome: blocked. Read the 0131 handoff first (only the sections you need). No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-0150 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Check `uptime` before each probe run and before the build; above 40 on the 1-minute load, wait. Probes and fixtures only in `~/.jjodel-lanes/P-2026-11-08-0150/`; copy the 0457, 0628 and 1730 probes (`~/.jjodel-lanes/P-2026-11-07-0457/`, `~/.jjodel-lanes/P-2026-11-07-0555/`, `~/.jjodel-lanes/P-2026-11-07-1730/`), never edit them in place. Context discipline: the previous half hit the ceiling; read only the line ranges you need and commit nothing until (5).

## COSA

(1) The gates 0131 did not reach: `npm run build` and `npm run check:docs`, at the baselines of `CLAUDE.md` §17. Typecheck and vitest were run by 0131 (exit 0; 15124 passed, only the 3 known `window` files red); do not rerun the full vitest.

(2) Discovery §3.7, before and after. Fixture: Families.ecore imported as a metamodel. Two `EditorV2` instances on that metamodel, crafted from the console as the discovery describes (a second tab with an id other than the model id; L6 will add the gesture). After both are mounted, add a class from the Tree View and a reference from Properties. Count the DVertex for the new class and the DVoidEdge with the new reference's `refId`. Expected: before (a detached worktree of yours at 587aed3cf's parent `db65de069`, in the lane folder, removed at the end) 2 and 2 if §3.7 is right; after (this branch) 1 and 1. Then close the owner tab and add one more class: 1 vertex, created by the remaining tab. Three runs on the branch, one on the parent.

(3) Discovery §3.2 and LIR §4, on this branch: close one of the two tabs and read `canvasEdgePairs` and `edgeRefIds` from the other (entries kept); close the last, read them again (cleared). One run. Also the LIR §4 risk: draw a reference on the canvas of the tab that does not own the populate; count the DVoidEdge for it (report, do not fix).

(4) Single tab and two models, no regression: the 0628 layout probe three runs (3/3 at every step), the container probe one run (0 failures), the 0457 scenes V1, V2, V3, R-MT-18 once each, and the 1730 two-tab scene on the demo project once (tab A 18 nodes, tab B 25).

(5) Crops in light theme, at most four (the two tabs after the class addition on the branch, and on the parent if it shows the duplicate). Closure, one docs commit: an addendum to `docs/discovery/lir_2026-11-07_l4_populate_owner.md` with the tables; the 0131 entry in `docs/log-inbox/multi-tab.md` (P9) with the gates of 0131 and of this lane, `Smoke visivo` and `Regressions` from this lane, and the ticket of the handoff (the sync registries have no model key: the last tab of model N clears the entries of an open tab on model M; out of L4); the Status flips of 0131 and this prompt. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (5). Any source change is a stop with Outcome: question. Remove the extra worktree and the node_modules symlink, stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/prompts/claude_2026-11-08_0131_prompt_multi_tab_l4_populate_owner.md; ~/.jjodel-lanes/P-2026-11-08-0131/handoff.md; docs/discovery/lir_2026-11-07_l4_populate_owner.md; docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md §3.2, §3.7, §6; docs/decisions.md R-MT-17.

# Multi-tab, lane L5: remaining gates, app check, crops and closure (continuation of P-2026-11-07-1516)

Prompt-ID: P-2026-11-07-1730
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-07 · lane full · no source change · build exit 0 · demo two tabs 18/18 and 25/25 nodes, own colours, x3 · L3 pair 6/6 (was 6/10) · single tab 3/3 every step x3, container 0 failures, 0457 scenes unchanged · Symbol Editor: no node-side opener, contract by dispatch · LIR §7 · hard-stop: visual check due · non fuso
Lane: full (gates, measurement and closure of L5; no source change)
Depends: P-2026-11-07-1516 (LIR a87146a64, tests 7b3cf6d2a, code f2ddead3d), its handoff `~/.jjodel-lanes/P-2026-11-07-1516/handoff.md`, the demo project of P-2026-11-07-1439 (`~/Downloads/jjodel-multitab-demo.jjodel`)
Worktree: ~/jjodel-w-mtl5, branch multi-tab-l5, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (second half of L5 under /lane auto)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -4, git status --short: HEAD is this prompt's commit, its parent is f2ddead3d and the tree is clean; otherwise stop with Outcome: blocked. Read the 1516 handoff first (only the sections you need). No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-07-1730 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Check `uptime` before each probe run and before the build; above 40 on the 1-minute load, wait. Probes and fixtures only in `~/.jjodel-lanes/P-2026-11-07-1730/`; copy the 0457, 0628 and 1439 probes (`~/.jjodel-lanes/P-2026-11-07-0457/`, `~/.jjodel-lanes/P-2026-11-07-0555/`, `~/.jjodel-lanes/P-2026-11-07-1439/`), never edit them in place. Context discipline: the previous half hit the ceiling; read only the line ranges you need and commit nothing until (4).

## COSA

(1) The gates 1516 did not reach: `npm run build` and `npm run check:docs`, at the baselines of `CLAUDE.md` §17. Typecheck and vitest were run by 1516 (exit 0; 14873 passed, the six red files explained in its report); do not rerun the full vitest.

(2) Two tabs, the effect L5 is for: import the demo project, tab A on «Apartment» with «Floor plan», tab B on «Office» with «Control wiring». Focus A, then B, then A: each tab draws the node set of its own viewpoint (count the rendered nodes per tab from the DOM and compare with the count that viewpoint gives in a single tab), and its own viewpoint's fills and metaclass colours. The L3 check measured 6 against 10 before L5 on its fixture; report the same pair on this branch. Also: the Symbol Editor opened from a node in tab B shows tab B's viewpoint. Three runs.

(3) Single tab, no regression: the 0628 layout probe three runs (3/3 at every step, welcome-key seed of P-2026-11-07-1008), the container probe one run (0 failures), and the 0457 probe's V1, V2, V3 and R-MT-18 once each.

(4) Crops in light theme, at most four (tab A and tab B with the two node sets at least). Closure, one docs commit: an addendum to `docs/discovery/lir_2026-11-07_l5_ir_resolution_tab_viewpoint.md` with the tables; the 1516 entry in `docs/log-inbox/multi-tab.md` (P9) with the Option A scope (seven source files), the two extended mocks (`irPresentation.test.ts`, `irSimActive.test.ts`), the gates of 1516 and of this lane, `Smoke visivo` and `Regressions` from this lane, and the ticket of the handoff (`publishedChannelSlots`, `useIRContainment.ts:61`, one module-level list for every IR canvas; out of L5); the Status flips of 1516 and this prompt. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (4). Any source change is a stop with Outcome: question. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/prompts/claude_2026-11-07_1516_prompt_multi_tab_l5_ir_resolution.md; ~/.jjodel-lanes/P-2026-11-07-1516/handoff.md; docs/discovery/lir_2026-11-07_l5_ir_resolution_tab_viewpoint.md; docs/discovery/lir_2026-11-07_l3_tab_layout_key.md §6; ~/Downloads/jjodel-multitab-demo.md; docs/decisions.md R-MT-1..23.

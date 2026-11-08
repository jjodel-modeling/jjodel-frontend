# Multi-tab, lane L6: app check of the second tab, crops and closure (continuation of P-2026-11-08-0808)

Prompt-ID: P-2026-11-08-0852
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (measurement and closure; no source change)
Depends: P-2026-11-08-0808 (note 46cde4fdc and c6ccbab4c, tests 64b18a050, code 89fa42c59); R-MT-4, R-MT-9, R-MT-17, R-MT-24, R-MT-25; the demo project `~/Downloads/jjodel-multitab-demo.jjodel`
Worktree: ~/jjodel-w-mtl6, branch multi-tab-l6, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (second half of L6; Alfonso 2026-11-08 08:34 «Ok su tutto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit, its parent is c6ccbab4c, and the only uncommitted files are the 0808 inbox entry and Status flip; otherwise stop with Outcome: blocked. No source changes. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-0852 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe or test log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes and fixtures only in `~/.jjodel-lanes/P-2026-11-08-0852/`; copy the 0457, 0628, 1730 and 0150 probes (`~/.jjodel-lanes/P-2026-11-07-0457/`, `~/.jjodel-lanes/P-2026-11-07-0555/`, `~/.jjodel-lanes/P-2026-11-07-1730/`, `~/.jjodel-lanes/P-2026-11-08-0150/`), never edit them in place. Context discipline: this front's lanes hit the ceiling; keep reads short; if the context runs short, commit nothing, write a handoff and stop.

## COSA

(1) The gesture, on the demo project, through real UI clicks on the Tree View model row (R-MT-25): «Open in new tab ▸ Control wiring» on «Apartment» while its first tab is on «Floor plan». Two tabs exist with ids `<modelId>` and `<modelId>~tab1`; focus A, then B, then A: each draws its own viewpoint's node set (counts against a single tab on that viewpoint) and the side panels, status bar and `body[data-editor-type]` follow the focused tab. Then «Open beside ▸ Floor plan» on «Office»: the tab opens in a right panel; with the dock in a state where `openBeside` returns false (one panel maximized), the item opens a new tab with the same viewpoint (R-MT-25). Three runs.

(2) Same model, the L4 guards through the gesture: with two tabs on «Apartment», add an object from outside the canvas (the console path of 0150, `ContextMenu.tsx:321`): one vertex. Close tab B: tab A keeps working (a drag writes under its viewpoint); open a second tab again and close tab A first: tab B takes the populate (one more object, one vertex). Delete the model: every tab of it closes. One run each.

(3) The known limits, stated as observed: a tab in the right panel does not drive the side panels (`Dock.tsx:360`); JjScript and the console on a second tab find no active model and do not crash (`jjscript/executor/utils.ts`, `Console.tsx`). Report, do not fix.

(4) Single tab, no regression: the 0628 layout probe three runs (3/3 at every step), the container probe one run (0 failures), the 0457 scenes once, the 1730 two-model demo scene once (18 and 25 nodes).

(5) Crops in light theme, at most four (the Tree View menu open on the model row, the two tabs on one model with their two node sets, the beside panel). Closure, one docs commit: the tables appended to `docs/discovery/discovery_2026-11-08_l6_second_tab.md`; the 0808 inbox entry in `docs/log-inbox/multi-tab.md` turned to its final form (`Smoke visivo`, `Regressions` from this lane) plus the ticket for the JjScript and console readers of the tab id; the Status flips of 0808 and this prompt. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (5). Any source change is a stop with Outcome: question. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/prompts/claude_2026-11-08_0808_prompt_multi_tab_l6_second_tab.md; docs/discovery/discovery_2026-11-08_l6_second_tab.md; docs/discovery/lir_2026-11-07_l4_populate_owner.md §7; ~/Downloads/jjodel-multitab-demo.md; docs/decisions.md R-MT-1..25.

# Multi-tab, lane L6b: the rail at the window's right edge in a split (continuation of P-2026-11-08-1633)

Prompt-ID: P-2026-11-08-1729
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · 0189a0928 · gates green (typecheck 0, build, check:docs, vitest 147 passed) · log entry in docs/log-inbox/multi-tab.md · Alfonso's visual GO pending
Lane: full (layout only: SCSS; no critical zone, no core)
Depends: P-2026-11-08-1608 and P-2026-11-08-1633 (closure 26b91eda8; `0aff5a02a` put the rail in its own column between the two canvases); R-MT-26
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-08 17:25 on the 1633 crops: «crop single tab is fine, in both crop besides si vede il rail di destra tra il tab di sinistra e quello di destra»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -2, git status --short: HEAD is this prompt's commit, its parent is 26b91eda8 and the tree is clean; otherwise stop with Outcome: blocked. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), restarted after every source edit, stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-1729 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes only in `~/.jjodel-lanes/P-2026-11-08-1729/`, copied from `~/.jjodel-lanes/P-2026-11-08-1633/`, never edited in place. CSS classes are internal API: never rename or remove one; grep before adding a class name. Context discipline: keep reads short; if the context runs short, commit what is done and stop with a handoff.

## The finding

Alfonso's visual check: in both split crops of 1633 the right rail (the side panels) stands between the left tab and the right tab. In a split it must sit where it sits with a single tab, at the right edge of the window, after the right panel; the two canvases are adjacent, separated only by the dock divider. The rest of 1608 and 1633 (no cap, toolbar icons and scroll, minimaps, app bar) stays.

## COSA

(1) Find in `0aff5a02a` (and any later rule) what places the rail column between the panels, and change it so the rail is at the right edge of the dock area in a split, as with a single tab, with the right panel's canvas clear of it (the same clearance a single tab's canvas has). SCSS only; if it needs TSX (for example because the rail is rendered inside the left panel's editor), stop with Outcome: question and a `Recommended:` line naming the smallest change. Commit alone.

(2) Gates: typecheck (print its exit status), build, check:docs; vitest on the files the branch touched and the five L6 test files.

(3) App check, demo project, the split at 1600 and 1280 px, three runs each: the rail's left edge is to the right of the right panel's right edge (no rail pixel between the two panels), both canvases clear of the rail, divider drag changes the sizes, both minimaps inside their canvases, every toolbar control reachable, the app bar lists both tabs. Then once each: a single tab (unchanged), the Refactoring split (as in 1003), the 1730 two-model demo.

(4) Crops in light theme, at most three (the split at 1600 and 1280, the Refactoring split). Closure, one docs commit: the tables appended to `docs/discovery/discovery_2026-11-08_l6b_beside_layout.md`, the L6b log entry in `docs/log-inbox/multi-tab.md` updated with this finding and its fix, the Status flip of this prompt. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (4). Any file outside SCSS files, the note, the inbox and this prompt is a stop with Outcome: question. No critical-zone file. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_l6b_beside_layout.md; docs/prompts/claude_2026-11-08_1608_prompt_multi_tab_l6b_beside_layout.md; docs/prompts/claude_2026-11-08_1633_prompt_multi_tab_l6b_finish.md; ~/.jjodel-lanes/P-2026-11-08-1633/; docs/decisions.md R-MT-26.

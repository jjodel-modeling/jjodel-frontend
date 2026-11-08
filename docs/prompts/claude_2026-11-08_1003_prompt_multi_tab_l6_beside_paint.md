# Multi-tab, lane L6: paint the beside panel, recheck and closure (continuation of P-2026-11-08-0852)

Prompt-ID: P-2026-11-08-1003
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (one SCSS rule, then measurement and closure; no critical zone)
Depends: P-2026-11-08-0808 (code 89fa42c59), P-2026-11-08-0852 (app check, uncommitted, handoff `~/.jjodel-lanes/P-2026-11-08-0852/handoff.md`); R-MT-24, R-MT-25
Worktree: ~/jjodel-w-mtl6, branch multi-tab-l6, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (0852's Recommended adopted by the chat under RC-21; Alfonso 2026-11-08 08:34 «Ok su tutto» on L6)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit, its parent is d65442ea9, and the only uncommitted files are the 0808 inbox entry and Status flip; otherwise stop with Outcome: blocked. Read the 0852 handoff first, only the sections you need: its tables are the measurement of record for everything except Open beside. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-1003 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes only from copies in `~/.jjodel-lanes/P-2026-11-08-1003/` of the 0852 probes, never edited in place. Context discipline: keep reads short; if the context runs short, commit what is done and stop with a handoff.

## COSA

(1) The fix, committed alone: in `frontend/src/components/abstract/tabs/ScriptTab.scss` (verify the path), extend the exception at about `:279-284` that keeps a top-level panel without a pinnable tab header painted under `.not-strip`, so that a model canvas tab opened beside (R-MT-24) is painted too, as the Refactoring split already is. Smallest selector that matches only that case; do not rename or remove any existing class; grep before adding a class or attribute name. If it cannot be done in that file alone, stop with Outcome: question and a `Recommended:` line.

(2) Gates: typecheck (print its exit status), build, check:docs; vitest only on the files of 0808 (`modelTabId.test.ts` and the other four test files of 64b18a050). No full vitest: no TypeScript changed.

(3) Recheck Open beside on the demo project, three runs: «Open beside ▸ Floor plan» on «Office» from the Tree View row; the right panel has a non-zero width and paints its nodes (count against a single tab on that viewpoint); the left canvas is unchanged; the Refactoring split still paints (one run of the 0852 path or of the earliest probe that opens it). Then one run each of the 0852 «Open in new tab» scene and the 1730 two-model demo scene, as a regression check of the rule.

(4) Crops in light theme, at most three (the beside panel painted, the Refactoring split). Closure, one docs commit: the 0852 tables and this lane's tables appended to `docs/discovery/discovery_2026-11-08_l6_second_tab.md`, with 0852's findings: JjScript on a second tab finds the model through the `EDITOR_TYPE_CHANGE` cache (the note's earlier claim corrected); the console not observed; the maximized fallback creates the tab in a hidden placeholder panel, not reachable with the mouse, a known limit; the status bar follows the right panel when the left tab is a `~tab` id, not traced; second tabs are `~tab2`, `~tab3`. The 0808 inbox entry in `docs/log-inbox/multi-tab.md` in its final form (`Smoke visivo`, `Regressions` from 0852 and this lane), with the JjScript ticket corrected to the console only, and the fix of (1) listed. The Status flips of 0808, 0852 and this prompt. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (4). Any file outside `ScriptTab.scss`, the discovery note, the inbox and the three prompts is a stop with Outcome: question. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0852/handoff.md; docs/prompts/claude_2026-11-08_0808_prompt_multi_tab_l6_second_tab.md; docs/prompts/claude_2026-11-08_0852_prompt_multi_tab_l6_check.md; docs/discovery/discovery_2026-11-08_l6_second_tab.md; docs/decisions.md R-MT-24, R-MT-25.

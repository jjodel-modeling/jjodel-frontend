# Multi-tab, lane L6b: the layout of a model tab opened beside another

Prompt-ID: P-2026-11-08-1608
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · 541ba4cb8 · gates green (typecheck 0, build, check:docs, vitest 147 passed) · log entry in docs/log-inbox/multi-tab.md · Alfonso's visual GO pending
Lane: full (layout only: SCSS and the app bar; no critical zone, no core)
Depends: L6 on the trunk (merge bc4b137cd; the beside panel is painted by the `ScriptTab.scss` rule of 7f8e8c0fb); R-MT-24, R-MT-25, R-MT-26; the four layout findings of P-2026-11-08-1003 (`~/.jjodel-lanes/P-2026-11-08-1003/handoff.md` or its final report, crops `crop_1_beside_panel.png`)
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit on alfonso-frontend-jjtl (node_modules by the P14 symlink, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (R-MT-26 item 1, Alfonso 2026-11-08 16:06 «decidi tu al meglio per tutto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-1608 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes only in `~/.jjodel-lanes/P-2026-11-08-1608/`, copied from `~/.jjodel-lanes/P-2026-11-08-1003/` and `~/.jjodel-lanes/P-2026-11-07-1730/`, never edited in place. CSS classes are internal API: never rename or remove one; grep before adding a class name. Context discipline: one commit per numbered item; if the context runs short, commit what is done and stop with a handoff.

## COSA

(1) Discovery note, committed alone, short: `docs/discovery/discovery_2026-11-08_l6b_beside_layout.md` (path `docs/discovery/`, naming `discovery_<data>_<descrizione>.md`). For each of the four findings, the rule or code that causes it, with file and line on this commit: (a) the side panels cover the left canvas of the split (289 px visible); (b) the right panel is capped at 710 px (`style.scss:1055` exempts only the Refactoring split); (c) the toolbar labels overlap in both panes; (d) the app bar does not list the right panel's tab. For each, the smallest fix and the file it lives in. Any fix outside SCSS files and `pages/components/Navbar.tsx` is a stop with Outcome: question and a `Recommended:` line.

(2) The fixes, one commit each, in the files the note named: the split leaves the left canvas visible beside the side panels as a single tab does; the right panel takes the width its dock sizes give it, as the Refactoring split does; the toolbar of a narrow pane collapses its labels (icons only, labels as tooltips) instead of overlapping, using the existing toolbar classes and a container rule; the app bar lists the beside tab. A single tab and the Refactoring split must look exactly as today.

(3) Gates: typecheck (print its exit status), build, check:docs; vitest on the files you touched and on the five L6 test files (no full vitest unless TypeScript beyond `Navbar.tsx` changed).

(4) App check on the demo project, three runs: «Open beside ▸ Floor plan» on «Office» while «Apartment» is on «Floor plan»: left canvas visible width, right panel width against its dock size, no overlapping toolbar labels (bounding boxes), the app bar lists both tabs; then a single tab and the Refactoring split once each (unchanged against the 1003 numbers), and the 1730 two-model demo once.

(5) Crops in light theme, at most four (the split before and after is not needed: after only, the single tab, the Refactoring split). Closure, one docs commit: the tables appended to the note; a log entry in `docs/log-inbox/multi-tab.md` (P9); the Status flip. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (5). Any file outside SCSS files, `Navbar.tsx`, their tests, the note, the inbox and this prompt is a stop with Outcome: question. No critical-zone file. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_l6_second_tab.md; docs/prompts/claude_2026-11-08_1003_prompt_multi_tab_l6_beside_paint.md; ~/.jjodel-lanes/P-2026-11-08-1003/; docs/decisions.md R-MT-24, R-MT-25, R-MT-26.

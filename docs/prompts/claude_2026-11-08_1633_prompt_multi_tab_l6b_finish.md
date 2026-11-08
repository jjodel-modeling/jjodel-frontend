# Multi-tab, lane L6b: finish the beside layout, gates, app check and closure (continuation of P-2026-11-08-1608)

Prompt-ID: P-2026-11-08-1633
Chat: C-2026-11-07-0425
Front: multi-tab
Status: eseguito 2026-11-08 · lane full · b89421b06 · gates green (typecheck 0, build, check:docs, vitest 147 passed) · log entry in docs/log-inbox/multi-tab.md · Alfonso's visual GO pending
Lane: full (layout only: SCSS and the app bar; no critical zone, no core)
Depends: P-2026-11-08-1608 (note 6d229bff2, fixes 1cb96945d, 0aff5a02a, 541ba4cb8; toolbar work uncommitted in `EditorV2.scss`), its handoff `~/.jjodel-lanes/P-2026-11-08-1608/handoff.md` and `handoff.diff`; R-MT-26
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit (node_modules by the P14 symlink, re-created by you, removed at the end)
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (second half of L6b; Alfonso 2026-11-08 16:06 «decidi tu al meglio per tutto»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -3, git status --short: HEAD is this prompt's commit, its parent is 541ba4cb8, and the only uncommitted file is the toolbar work in `EditorV2.scss`; otherwise stop with Outcome: blocked. Read the handoff first, only the sections you need. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), restarted after every source edit as the handoff says, stopped before exit (stop only processes you started, by PID). Every reply opens with [P-2026-11-08-1633 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Run `uptime` as its own command before each probe run and wait while the 1-minute load is above 40. Probes only in `~/.jjodel-lanes/P-2026-11-08-1633/`, copied from `~/.jjodel-lanes/P-2026-11-08-1608/`, never edited in place. CSS classes are internal API: never rename or remove one; grep before adding a class name. Context discipline: the first half hit the ceiling; keep every read short, one commit per numbered item; if the context runs short again, commit what is done and stop with a handoff.

## Decisions taken by the chat (R-MT-26 delegation)

- The two panels share the width the rail leaves, in their dock proportions (600 / 600 at 1600 px), as 1608 did: accepted.
- No toolbar control is hidden. In a narrow pane the toolbar shows icons only (labels as tooltips) and, if the icons still do not fit, the bar scrolls horizontally inside the pane; the zoom level and the rail toggle stay reachable.

## COSA

(1) The divider drag between the two panels must work again (1608 measured it dead after `0aff5a02a`; it worked before). Diagnose from the diff, fix in the SCSS of `0aff5a02a`, commit alone. If the fix is outside SCSS, stop with Outcome: question.

(2) The right pane's minimap sits inside its own canvas again (one rule), committed alone.

(3) The toolbar: finish the uncommitted `EditorV2.scss` work to the decision above (icons only, horizontal scroll as the last resort, no control hidden, the left pane's rail cell aligned with the rail), committed alone.

(4) Gates: typecheck (print its exit status), build, check:docs; vitest on the files the branch touched and the five L6 test files.

(5) App check, demo project: the split at 1600 px and at 1280 px, three runs each: left canvas clear of the rail, panel widths, divider drag changes the sizes, both minimaps inside their canvases, no overlapping toolbar controls (bounding boxes) and every control reachable, the app bar lists both tabs. Then once each: a single tab (toolbar, rail and minimap unchanged against the trunk), the Refactoring split (as in 1003), the 1730 two-model demo.

(6) Crops in light theme, at most four (the split at 1600 and 1280, a single tab, the Refactoring split). Closure, one docs commit: 1608's and this lane's tables appended to `docs/discovery/discovery_2026-11-08_l6b_beside_layout.md`; one log entry in `docs/log-inbox/multi-tab.md` (P9) for 1608 and this lane; the Status flips of both prompts. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (6). Any file outside SCSS files, `Navbar.tsx`, their tests, the note, the inbox and the two prompts is a stop with Outcome: question. No critical-zone file. Remove the node_modules symlink and stop your dev servers first. No push, no merge.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-1608/handoff.md; docs/prompts/claude_2026-11-08_1608_prompt_multi_tab_l6b_beside_layout.md; docs/discovery/discovery_2026-11-08_l6b_beside_layout.md; docs/decisions.md R-MT-26.

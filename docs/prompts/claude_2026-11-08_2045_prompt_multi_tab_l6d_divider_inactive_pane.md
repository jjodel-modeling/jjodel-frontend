# Multi-tab, lane L6d: a visible divider handle, and the inactive pane's commands disabled instead of a cyan mark

Prompt-ID: P-2026-11-08-2045
Chat: C-2026-11-08-1855
Front: multi-tab
Status: da eseguire
Lane: full (TSX in editor-v2, SCSS; no critical zone, no core)
Depends: P-2026-11-08-2025 (closure on multi-tab-l6b; it holds the active-pane rule of P-2026-11-08-1855, D1..D7, and E1..E4)
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R3ryTKXDLzoripnbo6 (Alfonso 2026-11-08 20:39: «rendi la linea divisoria tra i due modelli piu evidente con un handle in vista, rimuovi la linea cyan sul canvas attivo e piuttosto disabilita tutti i comandi sull'altro canvas»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Every rule of the operating paragraph of P-2026-11-08-1855 applies unchanged (ports, never 3000, 3001, 3003, 3061, 4700; probes copied into `~/.jjodel-lanes/P-2026-11-08-2045/` from `~/.jjodel-lanes/P-2026-11-08-2025/`; run-quiet; uptime before each probe; one probe run per tool call; no subagents; commit with an explicit pathspec after `--`; restart your dev server after every source edit). Every reply opens with [P-2026-11-08-2045 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Keep context lean: read the discovery note of L6c and the diff of the D2 commit `a204ce6ac`, not the whole history.

## Decisions (Alfonso's request, details by the chat)

F1. Divider. The dock divider between the two panes of a split becomes visible at rest: 6 px wide, the slate border colour of the design system, with a centred grip (a short vertical pill, 4 x 32 px, or three dots) always shown. Hover and drag: the divider and the grip turn cyan `#0ea5e9`, cursor `col-resize`. Hit area at least 8 px. Only the divider of a model split; the Refactoring split and every other dock divider stay as they are. Prefer a selector scoped by the split class the branch already uses; grep before adding a class.
F2. Remove the cyan 2 px top border of D2 entirely, the transparent border of the inactive pane included (revert what `a204ce6ac` added for it; keep the active-pane state itself, D1 and D3 depend on it).
F3. The inactive pane shows that it is inactive by its commands, not by a mark: every control of its toolbar is disabled (the `disabled` attribute or the toolbar's existing disabled class, muted as disabled controls already are, tooltips still shown), and its canvas runs no command: no context menu, no keyboard shortcut, no double-click edit, no node drag, no connection, no drop (D3 already refuses drops). Pan and zoom by wheel stay, so the user can still look at it. The first pointerdown anywhere in the inactive pane only makes it active: it does not select, drag or open anything; from then on it behaves as an active pane. The canvas content is not dimmed or greyed.
F4. A single tab, the Refactoring split and the 1730 two-model demo look and behave exactly as today, apart from F1 not applying to them.

## COSA

(1) F2, one commit. (2) F1, one commit. (3) F3, one commit; if the canvas guard needs a file outside DOVE (a shared hook, the critical zone, `src/model/`), keep the toolbar part, record the rest in the note as open with a `Recommended:` line, and continue. Unit test for the activation rule (first pointerdown on the inactive pane activates and is consumed; commands of the inactive pane are refused) if the logic sits in a plain function, else extend `canvasSplit.test.ts`.
(4) Gates: typecheck (print its exit status), build, check:docs; vitest on the touched files, `canvasSplit.test.ts` and the five L6 test files.
(5) App check, demo project, split «Apartment» Control wiring beside Floor plan, at 1600 and 1280 px, two runs each: divider width 6 ±1 px and the grip visible at rest (bounding box, computed colour not transparent); no element with a cyan top border on either toolbar; every toolbar control of the inactive pane disabled and every one of the active pane enabled; right-click and double-click on a node of the inactive pane open nothing and change nothing; Delete on the inactive pane deletes nothing; the first click on the inactive pane switches the palette header and leaves the selection unchanged; the second click selects; wheel zoom works on the inactive pane; divider drag still resizes. Then once each: a single tab, the Refactoring split (its divider unchanged, measured), the 1730 demo.
(6) At most three light-theme crops (`CROPS=1`): the split at 1600 with the right pane active (divider and grip visible), the same with the pointer hovering the divider, the split at 1280. Closure, one docs commit: tables appended to `docs/discovery/discovery_2026-11-08_l6c_single_palette.md` under a heading for L6d; the L6 entry in `docs/log-inbox/multi-tab.md` extended; the Status flip of this prompt. Exit with Outcome: hard-stop (visual check due).

## DOVE

`frontend/src/components/editor-v2/**`, `components/abstract/DockManager.tsx`, SCSS already touched by the branch and the dock stylesheet that styles the divider (grep for the rc-dock divider class), the note, the inbox, this prompt.

## HARD STOP

After (6). Any file outside DOVE is a stop with Outcome: question and a `Recommended:` line, except the fallback of (3). No critical-zone file. Stop your dev servers first. No push, no merge.

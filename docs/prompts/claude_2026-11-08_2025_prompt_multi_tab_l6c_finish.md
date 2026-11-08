# Multi-tab, lane L6c: finish (D6 zoom floor, refit on split, gates, checks, closure)

Prompt-ID: P-2026-11-08-2025
Chat: C-2026-11-08-1855
Front: multi-tab
Status: da eseguire
Lane: full (TSX in editor-v2, SCSS; no critical zone, no core)
Depends: P-2026-11-08-1855 (stopped at the context ceiling at d10579948; handoff `~/.jjodel-lanes/P-2026-11-08-1855/handoff.md`, read it first, it is the state of the work)
Worktree: ~/jjodel-w-mtl6b, branch multi-tab-l6b, at this prompt's commit (the node_modules symlink is in place; remove it at the end only if 3061 is not running from this worktree)
Request: https://claude.ai/code/session_01DQt9R3ryTKXDLzoripnbo6 (continuation of P-2026-11-08-1855; Alfonso 18:49 «per le altre cose decidi tu»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Every rule of the operating paragraph of P-2026-11-08-1855 applies unchanged (ports, probes copied into `~/.jjodel-lanes/P-2026-11-08-2025/`, run-quiet, uptime before each probe, one probe run per tool call, no subagents, commit with an explicit pathspec after `--`). Every reply opens with [P-2026-11-08-2025 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Keep context lean: do not re-read files the handoff already summarises unless you edit them.

## Decisions on the 1855 findings (taken by the chat)

E1. D6 zoom floor: apply the handoff's edit, `minZoom={inCanvasSplit ? 0.05 : 0.5}` on `<ReactFlow>` in `EditorV2.tsx`, with its one-line comment.
E2. Opening a split refits each pane once, to its own visible area, at the moment the pane enters the split (the `useCanvasSplit` signal). No refit on later resizes or on focus changes.
E3. D2's transparent 2 px border on the inactive toolbar stays: it keeps the toolbar from shifting when the active pane switches (no layout shifts). The note records it as the reading of D2.
E4. Auto layout in the right pane moving the left pane's nodes: diagnose only. Find where the two viewpoints' positions are stored and why one write reaches both; write cause, file and line in the note. Fix it only if the fix lies inside DOVE and outside the critical zone; otherwise record it as open with a one-line `Recommended:` in the note and the closing report, and continue.

## COSA

(1) E1 and E2, one commit; typecheck. (2) E4 diagnosis, and the fix in its own commit if E4 allows it. (3) Gates: typecheck (print its exit status), build, check:docs; vitest on `canvasSplit.test.ts`, the files touched by 1855 and this lane, and the five L6 test files. (4) App check as item (7) of P-2026-11-08-1855, at 1600 and 1280 px, two runs each, plus: right after «Open beside», with no manual fit, no node box of either canvas lies outside its canvas; auto layout in the right pane leaves the left pane's node positions unchanged (only if fixed). Then once each: a single tab, the Refactoring split, the 1730 two-model demo. (5) At most three light-theme crops (`CROPS=1`): the split at 1600 with the right pane active, the split at 1280, a single tab. Closure, one docs commit: tables appended to `docs/discovery/discovery_2026-11-08_l6c_single_palette.md`, hypothesis 6 corrected (the minZoom clamp), E3 and E4 recorded; the L6 entry in `docs/log-inbox/multi-tab.md` extended; the Status flips of P-2026-11-08-1855 and of this prompt. Exit with Outcome: hard-stop (visual check due).

## DOVE

As P-2026-11-08-1855: `frontend/src/components/editor-v2/**`, `components/abstract/DockManager.tsx`, `pages/components/Navbar.tsx`, SCSS already touched by the branch, the note, the inbox, the two prompts.

## HARD STOP

After (5). Any file outside DOVE is a stop with Outcome: question and a `Recommended:` line, except E4, which records instead of stopping. No critical-zone file. Stop your dev servers first. No push, no merge.

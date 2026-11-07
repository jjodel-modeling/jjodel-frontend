# Multi-tab, lane L2: the viewpoint write on tab focus adds no undo entry (R-MT-20)

Prompt-ID: P-2026-11-07-0935
Chat: C-2026-11-07-0425
Front: multi-tab
Status: da eseguire
Lane: full (L2 files; tests; app check with the 0457 probe; not critical zone)
Depends: P-2026-11-07-0440 (code a99ea2482), P-2026-11-07-0457 (closure e0a19596d, V3 measured: +1 undo entry per focus write), R-MT-15, R-MT-20
Worktree: ~/jjodel-w-mtl2, branch multi-tab-l2, at this prompt's commit (node_modules by the P14 symlink, removed at the end)
Request: Alfonso 2026-11-07 09:29 «Ok alle raccomandazioni» (question 2: the focus write goes without an undo entry)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 4700), stopped before exit. Every reply opens with [P-2026-11-07-0935 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe, test or gate log; one probe run per tool call. Context discipline: read only the line ranges you need, one commit per numbered item; if the context runs short after (3), commit and stop with a handoff.

## Contesto (non rifare l'analisi)

0457 measured V3 on L2: focusing a tab whose viewpoint differs from the root calls `activateViewpoint`, and each such write adds one undo entry (two for focus B then back to A; zero when both tabs share the viewpoint; zero on the parent). R-MT-20: a focus write must add none. A pick from the toolbar picker is a user edit and keeps its undo entry as today.

## COSA

(1) Find how the focus write reaches the undo stack (read only the paths from the L2 focus handler to the action that records undo). Write three lines in the log entry's Notes later; no report file.

(2) Tests first, red, committed: focusing a tab with a different viewpoint leaves the undo stack length unchanged; a picker change still adds exactly one entry; focusing with the same viewpoint writes nothing.

(3) The change, in the L2 files (`EditorSwitch.tsx`, `Toolbar.tsx`, `EditorV2.tsx`, `EditorContext.tsx`) or, if the action needs a flag, in the one place that records undo for it. If that place is the reducer or the undo core (`CLAUDE.md` core rule), stop before editing with Outcome: question and the smallest option. Tests green.

(4) App check with the 0457 probe copies (`~/.jjodel-lanes/P-2026-11-07-0457/`, copy into this lane's folder, never edit the originals): V3 three runs (expected +0 entries per focus), V1 and V2 three runs each (no regression). One table per scene. Crops in light theme, at most three.

(5) Gates at the baselines of `CLAUDE.md` §17: typecheck, vitest (timing tests `languageService`, `outline`, `tolerant`, `laneBoard`, `irCollapsedRender`, `irSelectionRing`, `traceMonitor` rerun alone if red), build, check:docs. Closure, one docs commit: the inbox entry in `docs/log-inbox/multi-tab.md` and the Status flip. Exit with Outcome: hard-stop (visual check due).

## HARD STOP

After (5). Any file outside the four L2 files, the one undo-recording place of (3) if it is not core, their tests, the inbox and this prompt is a stop with Outcome: question. Remove the node_modules symlink and stop the dev server before exiting. No push, no merge.

## RIFERIMENTI

docs/prompts/claude_2026-11-07_0440_prompt_multi_tab_l2_tab_viewpoint_plumbing.md; docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md (addendum of 0457); docs/decisions.md R-MT-15, R-MT-20.

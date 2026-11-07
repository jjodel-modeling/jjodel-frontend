# Textual syntax, lane E2b: canvas selection highlighted in the Text tab

Prompt-ID: P-2026-11-07-1635
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · 8f4fd2338 (pure, red first), dae6ba6c1 · gates green (vitest: 3 import reds baseline) · app check 24/24, crops in ~/.jjodel-lanes/P-2026-11-07-1635/
Lane: full (listener, highlight collection, reveal; tests; app check with crops from real canvas gestures)
Depends: E1a, E1b, E2a (merged), R-TXT-54
Worktree: ~/jjodel-w-texte2b, branch textual-e2b-highlight (from trunk c0ee2cc00, own node_modules)
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file and no store write: this lane only reads the canvas selection. No new dependency. Every reply opens with [P-2026-11-07-1635 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-07-1635/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row E2b of docs/discovery/discovery_2026-11-06_textual_e_sync.md §9.1, with the decisions of §9.2 (R-TXT-54), designed in §5 (canvas to text), §6.1 (ping-pong), §6.2 (pause-apply cycle), §6.3 (objects without a span); crops of §8.3.

(1) **From an object id to its span**, pure, in `selectionSync.ts` (E2a's module; extend it, do not fork it): the selected objects' ids to the text spans the tab carries (§5.2), objects without a span give nothing (§6.3). Tests in `__tests__/selectionSync.test.ts`: one id, several ids, an id with no span, a span that moved after a reprint.

(2) **In the Text tab** (`ui/TextualTab.tsx`, `ui/TextualTab.scss`): the `CANVAS_SELECTION_CHANGED` listener of §5.1; a Monaco decorations collection that highlights the spans (one class, grep the name first, light theme only, D-UI-15); reveal the first span without moving the caret or taking focus (E1); the highlight kept across a reprint, an apply and a splice, recomputed from the new spans. No ping-pong with E2a's text-to-canvas direction: follow §6.1 exactly (a selection that the tab itself published does not come back as a highlight that republishes). Touch only what this needs in those two files.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with real canvas gestures (§8.2), crops of §8.3 in ~/.jjodel-lanes/P-2026-11-07-1635/, reusing the E2a probe in ~/.jjodel-lanes/P-2026-11-07-0746/ (copy it and what it imports) on its own port: at least 1-click (one node clicked on the canvas, its span highlighted in the tab, caret unmoved), 2-multi (two nodes), 3-after-apply (the highlight survives an apply from the text), 4-no-loop (clicking in the text does not leave a stale highlight nor re-trigger the canvas). Measure from the DOM (decoration elements and their lines) and Monaco's state, not from the screenshot.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, ui/TextualTab.scss, selectionSync.ts, __tests__/selectionSync.test.ts. Nothing else; ask first. Before a new identifier or CSS class, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_e_sync.md (§5, §6, §8, §9); docs/decisions.md R-TXT-54; the E1a, E1b and E2a log entries in docs/log-inbox/codegen.md.

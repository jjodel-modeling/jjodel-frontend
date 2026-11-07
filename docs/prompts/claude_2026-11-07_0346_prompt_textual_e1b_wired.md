# Textual syntax, step E, lane E1b: T10 wired into the Text tab, scenario 2

Prompt-ID: P-2026-11-07-0346
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (Text tab; tests; app check with real canvas gestures and crops)
Depends: P-2026-11-07-0048 (E1a, `reprintChanged` in textReprint.ts, on this branch), R-TXT-54 (E3, E10), R-TXT-20
Worktree: ~/jjodel-w-texte1, branch textual-e1-reprint (after taking the trunk)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 23:31, «Procedi con E e poi F con /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-07-0346 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row E1b of docs/discovery/discovery_2026-11-06_textual_e_sync.md (lane plan), with E1a's notes (~/.jjodel-lanes/P-2026-11-07-0048/, final message).
(1) The agreement the Text tab keeps (the `TextSync` of the last apply or print) also stores the old print's tracked spans, which `reprintChanged` needs.
(2) The `reprint` branch of ui/TextualTab.tsx (today `setValue` of the full print when the model changes) calls `reprintChanged` when the agreed text is not the bare print; on a result it replaces the text with `setValue` keeping the view state (scroll, caret clamped) (E3), and the tracked spans come from the splice; on `null` it does today's full reprint.
(3) Tests first in __tests__/textReprint.test.ts or the tab's tests: a diagram-side attribute change keeps a comment elsewhere; a rename keeps comments; the fallback path unchanged. R4 of the report (a comment between two attributes of a changed object moves to the object's head) is pinned by a test, not changed.
(4) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(5) App check of scenario 2 with real canvas gestures (the report's §8: fixture scene_3_DemoESM.jjodel, the Text tab opened and docked beside the canvas as the report describes, `flowBox` for the canvas box): type a comment in the text and apply; then on the canvas rename a node through its row (double-click, type, Enter) and delete another (select, Backspace); the text updates and the typed comment is still there. Crops in ~/.jjodel-lanes/P-2026-11-07-0346/, light theme, scale 1: before, after the rename, after the delete. Stop the server.
(6) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, textReprint.ts (only if the wiring needs an input), __tests__/textReprint.test.ts. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_e_sync.md §3, §8, lane plan; docs/decisions.md R-TXT-20, R-TXT-54.

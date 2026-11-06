# Textual syntax, step E, lane E1a: T10, the pure splice that keeps typed text

Prompt-ID: P-2026-11-07-0048
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (new pure module; tests)
Depends: P-2026-11-06-2337 (step E discovery, §3.3 and §9 row E1a), R-TXT-54 (provisional, E3 and E10), R-TXT-20
Worktree: ~/jjodel-w-texte1, branch textual-e1-reprint, from b01e829d9 (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 23:31, «Procedi con E e poi F con /lane auto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of b01e829d9 and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-07-0048 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row E1a of docs/discovery/discovery_2026-11-06_textual_e_sync.md (lane plan), design §3.3, decision E10: a pure `reprintChanged` in frontend/src/codegen/textual/textReprint.ts (new). Given the text the user agreed on (with its tracked spans and comment owners) and the new print of the changed model (with its spans), it keeps each object's typed text when that object's own printed text has not changed, recursing into children, and splices only the changed objects' new print. It returns `null` (the caller then does today's full reprint) whenever it cannot splice safely; the result must parse to the same model as the new print (print-parse equality, asserted in the function or by the caller's test).
(1) Tests first in __tests__/textReprint.test.ts on the textual corpus and DemoESM (scene_3_DemoESM.jjodel): an attribute changed, a rename with referrers, a create, a delete, a move, comments own-line and trailing kept, a one-root model (the recursion matters), the `null` fallbacks.
(2) Mutation bench on the report's rules 1, 2 and 4 (CLAUDE.md §5).
(3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(4) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Smoke visivo non applicabile, pure module), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/textReprint.ts (new), frontend/src/codegen/textual/__tests__/textReprint.test.ts (new). Read anything; change nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_e_sync.md §3, lane plan; docs/decisions.md R-TXT-20, R-TXT-54.

# Textual syntax, step D, lane D1: commenting an object out asks first (R-TXT-37 with D7)

Prompt-ID: P-2026-11-06-2301
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (Text tab; tests; app check with crops)
Depends: R-TXT-37, R-TXT-53 D7 (ratified by Alfonso 2026-11-06 22:28), docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §7 and §8 row D1
Worktree: ~/jjodel-w-textd1, branch textual-d1-comment-guard, from 7d171b504 (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 22:28, «si, si»: D7 ratified)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 7d171b504 and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-06-2301 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D1 of the report §8, design §7.3, with D7: when the pause would apply a deletion and any deleted object's tracked span lies inside a comment, the tab does not apply it on the pause; it asks first, with the existing deletion-guard confirmation shape (the bar text names the object(s) commented out and offers apply or keep). This holds even when the same pause carries other changes. Other deletions keep today's guard (three deleted subtrees up). The measured defect (report §7.2): commenting out one port today gives one deletion, applied silently while typing.

(1) Tests red first in __tests__/deletionGuard.test.ts: one port commented out asks; a port commented out together with an edit elsewhere asks; a port deleted (not commented) applies as today; uncommenting restores nothing to apply; a comment that covers no object changes nothing.
(2) The check in ui/TextualTab.tsx on the data the tab already has (the deleted object's tracked span and the comment ranges of the parse).
(3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(4) App check, port corpus (copy ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed; real keystrokes), crops in ~/.jjodel-lanes/P-2026-11-06-2301/, light theme, scale 1: the bar asking after a port is commented out; the model unchanged until confirmed; confirm applies; keep leaves the model. Stop the server.
(5) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, frontend/src/codegen/textual/__tests__/deletionGuard.test.ts. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §7, §8; docs/decisions.md R-TXT-37, R-TXT-53; probe ~/.jjodel-lanes/P-2026-11-06-2040/probe_comment.ts.

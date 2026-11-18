# Ticket #687: Enter at the end of a comment accepts a completion (`// end stateState`)

Prompt-ID: P-2026-11-07-1145
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · c9c34c610 · gates green · app check ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-07-1145/, checked by the session · log entry in docs/log-inbox/codegen.md
Lane: full (root cause, fix, tests; app check)
Depends: D2c (CompletionItemProvider), D5 (branch textual-d5-format, merging now); ticket https://github.com/jjodel-modeling/jjodel-lanes/issues/687
Worktree: ~/jjodel-w-text687, branch textual-687-comment-enter (from textual-d5-format, so D5 is in; merges after D5)
Request: none (lane auto; ticket opened by the chat, priority high)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-1145 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Test red first, its own commit (RC-51, code first).

## COSA

(1) **Reproduce and find the cause** with a real-gesture probe (port corpus, e.g. ~/.jjodel-lanes/P-2026-11-07-0510/{common.mjs,probe.mjs} or ~/.jjodel-lanes/P-2026-11-07-0609/ copied into ~/.jjodel-lanes/P-2026-11-07-1145/): type `// end state` at the end of a line, then Enter. Record whether the suggest widget is open inside the comment, which provider offers the item (`completionsAt` in languageService.ts, the CompletionItemProvider in ui/textualMonaco.ts, or Monaco's word-based suggestions), and whether Enter accepts it. Write the cause, with file:line, in your final message.

(2) **The fix**, the smallest one: no completion inside a `//` comment (nor inside a string literal, if the same path applies), so Enter breaks the line. If the items come from Monaco's word-based suggestions, turn those off for the textual language in the editor options the Text tab already sets, only if that place is in DOVE; otherwise stop with Outcome: question. Tests first, red on HEAD: no items at an offset inside a line comment, at its end, and inside a string; items unchanged elsewhere.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check**, the same gesture after the fix: crops light theme scale 1, 1-before-fix (from the HEAD run of (1)), 2-after-fix (the comment kept, the caret on a new line, no suggest widget). Stop your server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge: ticket #687, Causa: the cause of (1), Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). Edit only your new entry's lines in the log, never other entries. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/languageService.ts, ui/textualMonaco.ts, __tests__/completion.test.ts (or __tests__/languageService.test.ts). ui/TextualTab.tsx only if the editor options live there and the fix needs them: ask first. Nothing else.

## RIFERIMENTI

Ticket #687; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (§3 completion, D2c); the undo-fix log entry of P-2026-11-07-0912 (the Ticket paragraph).

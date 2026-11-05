# Textual syntax, step C lane C3b, continuation 2: the picker and form, bench, gates, app check, docs (continues P-2026-11-05-0816)

Prompt-ID: P-2026-11-05-0843
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (continuation; guard 72389e089, indentation 7c004674a; red tests for item 3 uncommitted in three test files)
Depends: P-2026-11-05-0816 (hard-stop at the ceiling during item 3; handoff in its lane folder)
Worktree: ~/jjodel-w-textc3b, branch textual-c3b-indent (the same tree)
Request: none (RC-51 continuation; lane auto)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 7c004674a and the tree holds only the uncommitted changes of the three test files the 0816 handoff names (restore them from its handoff.diff if missing); otherwise stop with Outcome: blocked. Same rules as P-2026-11-05-0748. Every reply opens with [P-2026-11-05-0843 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Read ~/.jjodel-lanes/P-2026-11-05-0816/handoff.md once, then code.

## COSA

Chat decision, lane auto: the two one-line fixes outside the 0748 file list are approved as a declared scope expansion: syntaxForm.ts:281 (a style other than Pascal/Ada saved as C-like: save the chosen base) and annotations.ts:239 (the unknown-style message lists the catalog's ids, not a hard-coded pair). Apply the pending fix of the handoff (the test lookup uses f.id). Then: item (3) commit with the red-first evidence; item (4) mutation bench on the guard (the tokenizer bench is in 7c004674a) and the gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes; item (5) the app check of the 0748 prompt with crops in ~/.jjodel-lanes/P-2026-11-05-0843/ (switch to Indentation by a real click; edit a width, one Undo; truncate the last 6 lines, the guard asks with the count, Cancel keeps all; select all and delete, the guard asks; a one-object deletion applies without asking; the Syntax form lists Indentation and saves it); item (6) log entry for 0748, 0816 and this prompt (Notes under 500 characters; Out-of-scope changes: yes, the two approved lines), Status flips, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

As P-2026-11-05-0748, plus syntaxForm.ts:281 and annotations.ts:239 (one line each).

## RIFERIMENTI

docs/prompts/claude_2026-11-05_0748_prompt_textual_c3b_indent.md; ~/.jjodel-lanes/P-2026-11-05-0816/handoff.md.

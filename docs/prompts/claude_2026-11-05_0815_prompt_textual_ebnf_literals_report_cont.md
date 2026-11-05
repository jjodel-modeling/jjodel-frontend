# Textual syntax, EBNF literals discovery, continuation: §4 and §5 (continues P-2026-11-05-0746 after the context ceiling)

Prompt-ID: P-2026-11-05-0815
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: fast (discovery, read only; report §0-§3 committed at a61e4fdfc)
Depends: P-2026-11-05-0746 (hard-stop at the ceiling; handoff in its lane folder)
Worktree: ~/jjodel-w-ebnflit, branch textual-ebnf-literals (the same tree)
Request: none (RC-51 continuation; lane auto)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Read only. Every reply opens with [P-2026-11-05-0815 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Read ~/.jjodel-lanes/P-2026-11-05-0746/handoff.md once; read only the parts of style.ts, styleCheck.ts, syntaxRecord.ts and the style picker that §4 needs.

## COSA

Append to docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §4 (step 2: style overrides on `style.base`, what the record, style.ts, concreteGrammar.ts, printer.ts, parser.ts, styleCheck.ts and the picker need; validation of a custom token) and §5 (the lane plan for step 1 and step 2, files per lane, which are visual; the decisions D1..D12 of the handoff as the closing list, with these two answered by the chat under lane auto: D7 every element literal is editable in the EBNF mode in Basic and Advanced alike, since opening the EBNF mode is itself the disclosure; D12 the record stays at version 1). One commit per section; then the Status flips of 0746 and this prompt, left uncommitted (RC-17). No push, no merge. Final message: §4 and §5 in short, then the Outcome.

## DOVE

The report and the two Status lines.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-05-0746/handoff.md; docs/decisions.md R-TXT-47, R-TXT-48.

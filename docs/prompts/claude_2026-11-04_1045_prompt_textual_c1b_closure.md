# Textual syntax, step C lane C1b, closure: probe fixes, crops, docs (continues P-2026-11-04-1005 after the context ceiling)

Prompt-ID: P-2026-11-04-1045
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (closure of C1b; continuation under RC-51)
Depends: P-2026-11-04-1005 (hard-stop at the ceiling; code at 5e83da5cf, handoff in its lane folder)
Worktree: ~/jjodel-w-textc1, branch textual-c1-operators (the same tree)
Request: none (RC-51 continuation, no new words from Alfonso)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 5e83da5cf and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; no new dependency. Every reply opens with [P-2026-11-04-1045 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks except the foreground probe server. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. A fix gets a test red first and its own commit. Near the ceiling, commit and write a handoff.

## COSA
Read ~/.jjodel-lanes/P-2026-11-04-1005/handoff.md. Chat answers to its questions: (1) the Pascal `;` after a variable inside an expression is dropped in C1d, not here; (2) an and/or with fewer than two operands must never lose the object: the call form always exists, its word defaulting to the class keyword in the style's case (§2.2 of the step C report), so under Pascal with no `call` set the printer writes `and()` / `or(x)` with the default word and the parser reads it; fix it here with a test red first (the printer never writes a text that reads back to a different model); (3) add `+` samples to the generator, pinned by the test. Then the three probe fixes of the handoff (the typed text goes in through the editor API or with auto-indent off so the crop shows the model's print; read the cause of «Applied, 1 line failed» on the ` | a` edit and fix it if it is in this lane's files, else report it with figures; close the Open Collective popup before the crops), one probe run, the crops of the Text and EBNF tabs in ~/.jjodel-lanes/P-2026-11-04-1045/ (light theme, scale 1), the gates one call each from frontend/ (npx tsc --noEmit; full npx vitest run, 3 files red at import are the baseline; npm run build; npm run check:docs; npm run check:codegen-lazy both modes), the log entry (Notes under 500 characters) and the Status flips of 0938, 1005 and this prompt, left uncommitted (RC-17). Stop the probe server. No push, no merge. Public repo: name no partner company. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

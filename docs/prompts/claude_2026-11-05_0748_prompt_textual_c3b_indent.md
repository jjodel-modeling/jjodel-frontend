# Textual syntax, step C lane C3b: the indentation style, with the deletion guard

Prompt-ID: P-2026-11-05-0748
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (tokenizer, grammar, printer of the textual layer; a guard on the write path)
Depends: C3a (Pascal/Ada and the style picker, merged), R-TXT-40, R-TXT-41 D2, R-TXT-43 (delete-all guard), R-TXT-37
Worktree: ~/jjodel-w-textc3b, branch textual-c3b-indent, from c4e446a9e (own node_modules from npm ci)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-05 07:38, «Procedi in lane auto per tutto»; R-TXT-41 D2: indentation ships only with the deletion guard)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of c4e446a9e and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no executor, no new dependency. Every reply opens with [P-2026-11-05-0748 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each numbered item: test red first, its own commit as soon as it is green (RC-51). Read docs/discovery/discovery_2026-11-04_textual_step_c.md §4 (F15-F18, the recommended design) and docs/decisions.md R-TXT-37, R-TXT-41, R-TXT-43 once, then code; no reading tour. Grep every new identifier first.

## COSA

(1) **The deletion guard first** (R-TXT-41 D2, R-TXT-43, R-TXT-37): an application whose effect deletes a share of the objects that a truncation or a lost indent explains (F18: a truncated indentation text parses with 0 errors and keeps 3 objects of 10), or every object, asks for confirmation instead of applying on the pause; the confirm names the count; Cancel keeps the text and the model; one Undo after a confirmed application restores. Measure the threshold on the F18 corpus (trunc, delete, dedent, indent) and choose it so that ordinary deletions of one or two objects never ask; state the rule in the commit body. Applies in every style. Tests red first.

(2) **INDENT/DEDENT** in the tokenizer, `layout: 'indent'` in concreteGrammar.ts (it throws today, :109), the style `indent` in style.ts's catalog with `style.base: 'indent'` in the record, the printer for it; the tolerant parser of step A keeps working (an inconsistent dedent is an error with recovery, never a silent reparent). Round trip byte-identical on the corpora in the three styles; nearley oracle where it covers the head.

(3) **The picker** offers Indentation next to C-like and Pascal/Ada; switching keeps the model and reprints; the Syntax form (R-TXT-47) lists it in Language > style.

(4) **Mutation bench** on (1) and (2); **gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness timeouts rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(5) **In the app**, port corpus (copy the probe of ~/.jjodel-lanes/P-2026-11-05-0118/, it suppresses the banner and the What's new modal): switch to Indentation by a real click, the text prints indented; edit a width, applies with one Undo; delete the last 6 lines (truncation): the guard asks with the count, Cancel keeps everything; select all and delete: the guard asks; a one-object deletion applies without asking. Crops in ~/.jjodel-lanes/P-2026-11-05-0748/, light theme, scale 1. Stop the server.

(6) **Docs**: log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge and Causa the dash), the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

frontend/src/codegen/textual/parser.ts (tokenizer), concreteGrammar.ts, style.ts, printer.ts, styleCheck.ts if a rule is needed, textApply.ts or ui/TextualTab.tsx for the guard (the place where an application is triggered on the pause), ui/SyntaxForm.tsx only if the style list is not data-driven, __tests__/. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-04_textual_step_c.md §4; docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.2 (indentation); docs/decisions.md R-TXT-36, R-TXT-37, R-TXT-40, R-TXT-41, R-TXT-43, R-TXT-47.

# Textual syntax, step C lane C3b, fix: a line-aware LL(1) check under Indentation, and the picker refuses a refused style

Prompt-ID: P-2026-11-05-0910
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-05 · lane textual-c3b-indent · 559b61194 · app probe 9/9, verifica visiva in attesa del GO
Lane: full (style check of the textual layer; the Text tab's style picker)
Depends: P-2026-11-05-0843 (Outcome question: false LL(1) conflicts under Indentation; ticket in its log entry, uncommitted in this tree)
Worktree: ~/jjodel-w-textc3b, branch textual-c3b-indent (the same tree)
Request: none (lane auto, Alfonso 07:38; the chat takes the lane's recommendation (a))

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 506837dc1 and the tree holds only the uncommitted docs of P-2026-11-05-0843 (docs/log-inbox/codegen.md and three Status lines); otherwise stop with Outcome: blocked. Do not commit those docs; leave them as they are. Same rules as P-2026-11-05-0748. Every reply opens with [P-2026-11-05-0910 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Read the final message of P-2026-11-05-0843 (its log.jsonl result, or its ticket in docs/log-inbox/codegen.md) and styleCheck.ts's `ll1Conflicts` (about :216), then code. Each item: test red first, its own commit.

## COSA

(1) **Line-aware LL(1) under Indentation** (option (a)): under the indentation style the FOLLOW of an optional part of a header line ends at the line break, as the parser's line rule reads it (an optional part does not start on a new line), so an optional part that starts with a name is not in conflict with what follows on the next line. Genuine conflicts on the same line stay errors. Red first on the 5 tolerant-corpus cases with a saved record (each reports 1 to 4 false errors under Indentation today) and on `{v:1, style:{base:'indent'}}`; C-like and Pascal results unchanged (turnstile-annotated keeps its 3 genuine errors in every style). Mutation bench on the new branch.

(2) **The picker**: switching the style in the Text tab's picker to a style whose `checkStyle` has an error is refused with its reason, as the Syntax form's Save is (R-TXT-47 D1); the record is not written. Test red first where the logic sits outside the component.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.

(4) **In the app**: the port corpus under Indentation through the picker shows no false finding in the bar (only the genuine Ref refusal decided for nameless keyword-less objects, if the corpus has one: then the picker refuses and says so); the Syntax form saves Indentation on a corpus that passes; crops in ~/.jjodel-lanes/P-2026-11-05-0910/, light theme, scale 1; investigate the `pageerror: Canceled` seen in 0843 (one line: where it comes from, harmless or not). Stop the server.

(5) **Docs**: log entry for this prompt (Notes under 500 characters; Corregge `2026-11-05 08:43`; Causa (c)), its Status flip, left uncommitted with the 0843 docs (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/styleCheck.ts, ui/TextualTab.tsx (the picker gate only), syntaxForm.ts if the gate helper lives there, __tests__/. Nothing else; ask first.

## RIFERIMENTI

docs/prompts/claude_2026-11-05_0843_prompt_textual_c3b_cont2.md and its ticket; docs/decisions.md R-TXT-41, R-TXT-47.

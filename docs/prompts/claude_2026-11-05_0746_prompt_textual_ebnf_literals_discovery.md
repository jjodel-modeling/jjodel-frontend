# Textual syntax, editable literals in the EBNF mode (R-TXT-48), discovery

Prompt-ID: P-2026-11-05-0746
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (discovery, read only)
Depends: P-2026-11-05-0724 (C2b Syntax form merged, c3a469c71), R-TXT-48 (c4e446a9e)
Worktree: ~/jjodel-w-ebnflit, branch textual-ebnf-literals, from c4e446a9e (own node_modules from npm ci)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-05 07:37, «1 e poi 2», recorded as R-TXT-48; 07:38 «Procedi in lane auto per tutto»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of c4e446a9e and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report and throwaway probes in the lane folder. Every reply opens with [P-2026-11-05-0746 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each section (RC-51).

## COSA

R-TXT-48: inside the EBNF mode only the text between quotes is editable; each literal carries the record field it comes from; an edit goes into the draft of the Syntax form (syntaxForm.ts, ui/SyntaxForm.tsx) with its checks and Save. Step 1 the element literals, style tokens read only; step 2 the style tokens as overrides on `style.base`.

(1) **Origins**: how concreteGrammarEbnf (and the grammar nodes it prints) produces each quoted literal; whether each can carry its origin (class keyword, feature keyword, per-item keyword, name keyword, operator symbol, call word, enum group name, or a style token), with file:line; what is missing to carry it (an optional field on the `kw`/`p` grammar nodes, or a side table from the printer), and a probe on the port corpus and BOOL that lists every literal of the EBNF with its origin.

(2) **Editor**: how the EBNF mode's Monaco is set up today in ui/TextualTab.tsx; the options for editable islands inside a read-only document (read-only model with an inline input over the literal, `onDidChangeModelContent` with undo of edits outside the islands, decorations, a content widget); which one keeps the design rules (no layout shift, the tab's tokens) and Monaco's undo coherent with the app's undo (one Save, one undo step). Recommend one.

(3) **Back into the draft**: one edit maps to one field change of the draft (syntaxForm.ts setters); a literal that appears in several rules (a class keyword used where the class is referenced, a style token everywhere) changes every occurrence; the preview, the findings at the literal (D9 de-duplicated), the Save gates of R-TXT-47 D1; the EBNF and the form stay in step when both are open.

(4) **Step 2**: what the record needs (overrides on top of `style.base`: which tokens, validation), what style.ts, concreteGrammar.ts, printer.ts, parser.ts and styleCheck.ts need (a custom token must still pass the LL(1) check and the token rules: no identifier-like brace, no collision with an operator symbol or a keyword), and how the style picker shows a custom style.

(5) **Lane plan** for step 1 and step 2 (files per lane, order, which produce visual changes and need crops), decisions D1..Dn with a recommendation each.

Discovery report, mandatory: docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: findings in short, D1..Dn with recommendations, then the Outcome.

## DOVE

Read: frontend/src/codegen/textual/ (concreteGrammar.ts, syntaxRecord.ts, style.ts, styleCheck.ts, syntaxForm.ts, annotations.ts, parser.ts tokenizer, printer.ts, ui/TextualTab.tsx, ui/SyntaxForm.tsx, ui/textualMonaco.ts). Write: the report and the lane folder.

## RIFERIMENTI

docs/decisions.md R-TXT-16, R-TXT-40, R-TXT-41, R-TXT-47, R-TXT-48; docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md; docs/discovery/discovery_2026-11-04_textual_step_c.md §2.4, §4.

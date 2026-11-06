# Textual syntax, step D (writing aids), discovery

Prompt-ID: P-2026-11-06-2040
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-06 · lane full · discovery, no code · report docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (9b292d83b..b171c599a) · hard stop, D1-D10 to ratify
Lane: full (discovery, read only)
Depends: step C closed (fc79098ad, docs/sessioni/sessione_2026-11-03_textual_ide_plan.md «Status after step C»), R-TXT-34, R-TXT-37
Worktree: ~/jjodel-w-textd, branch textual-d-writing-aids, from fc79098ad (own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 20:34, «decidi tu in /lane auto»: start D)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of fc79098ad and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report and throwaway probes in the lane folder ~/.jjodel-lanes/P-2026-11-06-2040/. Every reply opens with [P-2026-11-06-2040 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each (RC-51).

## COSA

Step D of the plan: «Contextual completion (allowed keywords, valid targets, enum literals), errors on the line with quick fixes, including conformance violations and validation rules; safe rename; formatting. Commenting whole objects out asks for confirmation instead of applying on the pause (R-TXT-37).» Measure what exists and what each piece needs, so D can be cut into lanes of five files or fewer.

(1) **Completion.** What the tolerant parser and the language service (languageService.ts, parser.ts) expose at a cursor today: the expected set at an error point, the FIRST of the rule being read, the scope for reference targets (by name and by path, R-TXT-28), enum literals from the metamodel. Which Monaco provider (completion item provider) TextualTab.tsx wires already and which not. A probe on the port corpus: the expected set at five cursor positions (after a class keyword, inside a block, after `:`, after `=`, inside an expression), with the per-block tokens and head prefix of step C.
(2) **Diagnostics and quick fixes.** Where markers come from today (parse errors, style check, conformance, validation rules of the metamodel if any are reachable from the textual layer); which have a fixable shape (missing token inserted by the repair, unknown reference with a near name, missing mandatory feature); the Monaco code action provider.
(3) **Safe rename.** References by name and by path: what a rename of an object name must rewrite in the text and in the model (LModel writes by name, `$attr.value`); whether it goes through the text (a text edit then apply) or the model (a model write then reprint); conflicts with an existing name; nameless objects (R-TXT-45).
(4) **Formatting.** The printer as the formatter: a full reprint versus a range format; what survives (comments, R-TXT-20; redundant parentheses, the lossless tree of A); Monaco's document formatting provider.
(5) **R-TXT-37.** Where the pause-apply happens, how commenting out a whole object is detected (an object that disappears from the parse while its text is inside a comment), and the confirmation shape.
(6) **Lane plan**: lanes in order, each at five files or fewer, with files, visual yes/no, and the critical-zone check (CLAUDE.md 3.1) for each. Decisions D1..Dn with one recommendation each.

Discovery report, mandatory: docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: findings in short, D1..Dn with recommendations, then the Outcome.

## DOVE

Read: frontend/src/codegen/textual/ (languageService.ts, parser.ts, printer.ts, concreteGrammar.ts, styleCheck.ts, annotations.ts, textDiff.ts, ui/TextualTab.tsx, ui/useSyntaxDraft.ts), and whatever they import for conformance and validation. Write: the report and the lane folder.

## RIFERIMENTI

docs/sessioni/sessione_2026-11-03_textual_ide_plan.md; docs/decisions.md R-TXT-20, R-TXT-21, R-TXT-28, R-TXT-34, R-TXT-37, R-TXT-44..52; docs/discovery/discovery_2026-11-05_textual_block_tokens.md.

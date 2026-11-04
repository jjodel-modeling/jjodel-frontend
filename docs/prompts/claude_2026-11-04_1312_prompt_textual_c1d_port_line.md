# Textual syntax, step C lane C1d: the port line (per-item keyword, punctuation keyword, inline containment, call layout, optional name), the Pascal terminator inside expressions, Briefs' Ref on one line

Prompt-ID: P-2026-11-04-1312
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (annotations, grammar, parser and printer of the textual layer)
Depends: P-2026-11-04-1241 (C1c closed on the branch at 75fdfa6cb)
Worktree: ~/jjodel-w-textc1, branch textual-c1-operators (the same tree)
Request: none (R-TXT-41 D3, Alfonso 2026-11-04 06:52; step C report §2.4 and §5 lane C1d; C1a and C1b log entries, the opens for C1d)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 75fdfa6cb and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md, the core or the JjScript executor; no new dependency. Every reply opens with [P-2026-11-04-1312 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks except the foreground probe server. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Each numbered item below gets its test red first and its own commit (RC-51: a lane that dies at the ceiling leaves committed items behind it, and a handoff.md in its lane folder).

## COSA

The one-line port `input instr : Word(32)` of the step C report §2.4 must print and read back, in both styles, through five additions to the vocabulary of `docs/discovery/discovery_2026-11-04_textual_step_c.md` §2.4 and §6, plus two leftovers of C1a and C1b.

(1) **Annotations and the style check** (`annotations.ts`, `styleCheck.ts` only for the new rules). A feature annotation accepts: a keyword that is an identifier, `''`, or one punctuation token (`:` for `type`); `itemKeyword`, a per-item keyword printed before each item of a multi-valued containment instead of once around the block (`input` and `output` for `inputs` and `outputs`, which share the class Port); `inline` on a single-valued containment, the child printed in the line with no block. A class annotation accepts the layout `call`: the class word (its keyword, or the class name as today's call word) followed by its positional attributes in parentheses, comma separated, `Word(32)`. Refusals with a reason, as the existing ones: a punctuation keyword that collides with a block, list, terminator or operator token of the style in force; `itemKeyword` on a single-valued feature; `inline` on a multi-valued containment or on a class whose layout is block; `call` on a class with a containment. Every refusal is a `StyleRule` with a `where`, so the C2 form can show it next to its field.

(2) **Grammar: the optional name under the LL(1) condition** (`concreteGrammar.ts`, R-TXT-41 D3, which amends R-TXT-27 (2)). The blanket refusal of an optional name in a one-line, positional or call head (concreteGrammar.ts:208 and the lines after it) becomes the condition: the name is accepted when the token that can follow the name position cannot also start the rest of the head; otherwise refused with the same message, naming the two tokens. `ll1Conflicts` (styleCheck.ts:216) checks it on the derived grammar; the per-item keyword, the punctuation keyword and the inline containment take part in FIRST and FOLLOW. The EBNF (`syntaxRecord.ts`'s print of the grammar) shows the four shapes.

(3) **Parser and printer** (`parser.ts`, `printer.ts`). Read and print the per-item keyword, the punctuation keyword, the inline containment and the call layout; a one-line object with nothing to print in its body prints no braces, and reads back with the braces optional, only where (2) proves the empty braces optional, otherwise it prints `{}` as today. Round trip byte-identical on a corpus with the four shapes, in both styles (extend `corpus.ts` or `boolCorpus.ts`, and the nearley oracle of `oracle.ts` if it covers the head of a class; say which). The outline and the breadcrumb of the Text tab label the inline child and the call object as they label a positional object today (R-TXT-39, C4'): check with `outline.test.ts`, no change to the UI unless a test shows one is needed, in which case stop with Outcome: question.

(4) **The Pascal terminator inside expressions** (open of C1a). Under the Pascal/Ada style, `Or(is_sw;)` is printed and read today: the terminator must not follow a primary inside an expression; it closes the statement line only. `st & or(is_sw);` reads and prints to the same bytes; `or(is_sw;)` is a syntax error with the recovery of step A. Tests on `styles.test.ts` or `expressions.test.ts`, red first.

(5) **Briefs' Ref on one line** (open of C1b). In the syntax record used by the Briefs test (needs `PROTO`; skipped without it), `Ref` is annotated as a one-line class with keyword `''` and an empty body omitted per (3), so the expression of `dmem_we.driver` in `mc_w4_r4` prints `st & or(is_sw)` and reads back; `input instr : Word(32)` prints as one line through (1) and (2). The Briefs test stays byte-identical on all six models. If an annotation needed by Briefs is refused by (1) or (2), report the refusal and its reason and stop with Outcome: question rather than loosening the rule.

(6) **Mutation bench** on (1), (2), (3), (4): each new rule and each new parser branch gets one mutation, the textual suite run on it, the count of red tests in the commit body; a survivor gets a test that kills it.

(7) **Gates**, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. The 50 ms per keystroke budget of R-TXT-36 on the 1,000-object corpus: report the languageService timing test's figure.

(8) **In the app**, on a free port, with a metamodel of this lane's own (a module with input and output ports, a port with an optional name and a typed width, no partner metamodel): the Text tab in C-like and in Pascal/Ada shows the port lines; keystrokes change a width, rename a port, add a port line, remove the name of a port; each applies with one Undo or is refused with a reason, never half applied; the EBNF mode shows the four shapes. Crops per edit and per mode in ~/.jjodel-lanes/P-2026-11-04-1312/, light theme, scale 1, donation banner closed or suppressed through the localStorage flag of the C1c probe. Stop the probe server.

(9) **Docs**: log entry in docs/log-inbox/codegen.md (Notes under 500 characters; Corregge and Causa are `—` or their allowed values) and the Status flip of this prompt, left uncommitted (RC-17). No push, no merge. Public repo: name no partner company. Final message: what was verified and how (direct model write is not a canvas gesture; a unit test is not the app check), Decisions taken (unattended), Decisions awaiting Alfonso, then the Outcome.

## DOVE

`frontend/src/codegen/textual/annotations.ts`, `concreteGrammar.ts`, `styleCheck.ts` (new rules only), `parser.ts`, `printer.ts`, `syntaxRecord.ts` (EBNF print only if the four shapes need it), `__tests__/` (corpus, oracle, annotations, styles, expressions, outline tests), the Briefs test's syntax record. Not `textMatch.ts`, `textDiff.ts`, `ui/*` (stop with a question if a change there is needed).

## COME

Read the lane folders of C1b and C1c for their handoffs (`~/.jjodel-lanes/P-2026-11-04-1005/handoff.md`, `~/.jjodel-lanes/P-2026-11-04-1158/handoff.md`) and the step C report §2.4, §5, §6, §8 before writing code; write code from the first tool calls after that, no further reading tour. Existing identifiers keep their names; new rule names are checked with a grep across frontend/src before use. The style check messages name the annotation, not the tokens, when an annotation is the cause (step C report F12).

## RIFERIMENTI

docs/decisions.md R-TXT-16 (3) and R-TXT-27 (2) as amended by R-TXT-41; R-TXT-36 (tolerant parser, 50 ms budget); R-TXT-39 (outline labels); docs/discovery/discovery_2026-11-04_textual_step_c.md §2.4, §5, §6, §8 (D3); docs/log-inbox/codegen.md entries of P-2026-11-04-0732/0910 (C1a), 1045 (C1b), 1115/1158/1241 (C1c).

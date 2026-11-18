# Textual syntax, step C discovery: expression notation, annotations form, other styles

Prompt-ID: P-2026-11-04-0303
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-04 · lane full · d5e38cb8b (probe and output) · hard-stop at the context soft ceiling, report written by P-2026-11-04-0330 in 8906621a1
Lane: full (discovery only in this prompt; read-only on the code)
Depends: P-2026-11-04-0250 (step B merged)
Worktree: ~/jjodel-w-textc, branch textual-c-notation
Request: none (R-TXT-34 (1) and step C of the plan, Alfonso 2026-11-03 13:53)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch, otherwise stop with Outcome: blocked. No production code in this lane; probes under docs/discovery/harness/ only. Every reply opens with [P-2026-11-04-0303 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a probe log: summary lines only. One probe run per tool call. Commit the report before stopping; near the ceiling, commit what is written and a handoff.

## Context
Plan: docs/sessioni/sessione_2026-11-03_textual_ide_plan.md, step C and its three open points. Decisions: R-TXT-16 (3) (a class as a binary operator with symbol and precedence), R-TXT-21 (1) (hand-written interpreter of the concrete grammar, nearley as the unambiguity oracle), R-TXT-23, R-TXT-24, R-TXT-34, R-TXT-36 (the lossless tree, trivia on tokens). Code: frontend/src/codegen/textual/ (grammar, annotations.ts, syntaxRecord.ts, style.ts, styleCheck.ts with the LL(1) check, parser.ts, printer.ts, the tree). Alfonso's goal: `driver` readable as `st & (is_sw)` instead of Conj/Disj/ops pyramids, with a round trip to the model; a port on one line, `input instr : Word(32)`, as a test case; styles chosen from a catalog (C-like, Pascal/Ada, indentation); the annotations form (T4b) editing keywords, one-line classes, grouping and operators without touching records by hand, validation shown in place, live effect on the EBNF and the printed text, one undo step, ambiguous annotations refused with the failing rule.

## COSA
Write docs/discovery/discovery_2026-11-04_textual_step_c.md (objective, files read with paths, findings with file:line and figures, risks, one recommended design per part with rejected alternatives, Decisions taken (unattended), Decisions awaiting Alfonso), measured on a non-hardware metamodel first (an expression metamodel of the test corpus or a small boolean-expression metamodel you add to the corpus), the RISC-V Briefs read-only.

(1) Expression notation: how an `operator` annotation on a class maps to the grammar and the tree; R-TXT-16 (3) says binary, but Conj/Disj hold an `ops` list, so propose how n-ary containment prints and parses (left-fold, flat with one symbol, or refuse); precedence and associativity as annotation data, and how the LL(1) check of T3 handles an expression grammar (precedence climbing or a layered grammar, and what the check must know); redundant parentheses have no model element: they survive only through the tree's trivia or a parenthesis node, say which; the round trip to the model: parse `st & (is_sw)` into Conj with two operands, print it back identically, and an edit in the text applies as a diff; what the existing diff needs for nested expression objects. Show the test case and `driver` on the Briefs, read-only. (2) T4b, the annotations form: where it lives (R-TXT-23, the textual entry; Properties panel pattern), its fields per element kind, validation (T3 and LL(1) rules by name, shown in place), live preview of EBNF and text, one undo step, and how it refuses an ambiguous annotation. (3) T5, other styles: the Pascal/Ada and indentation styles of §A.2 against the current style.ts and tokenizer (trivia-based now); the indentation lexer on broken input, measured on the tolerant corpus; a style picker for the language; switching style keeps the model unchanged; byte-identical round trip per style on the corpus. Order the three parts into lanes with their file sets. Stop with Outcome: question. Public repo: name no partner company. No push, no merge.

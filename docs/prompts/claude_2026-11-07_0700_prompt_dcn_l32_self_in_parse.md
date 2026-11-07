# DCN L3.2: parse `::` and `self.in(V::D)` into a `ClassificationTest` node

Prompt-ID: P-2026-11-07-0700
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (changes the JjEL grammar and an exported AST union)
Depends: R-DCN-7, R-DCN-21, the languages concern section «Dynamic classification in JjEL» (4093bf31c); discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §4
Worktree: ~/jjodel-w-dcn-l32, branch dcn-l32, from dcn at the commit that adds this prompt (P14 symlink to ~/jjodel/frontend/node_modules, removed at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-07 06:51 «Via»)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean, otherwise stop with Outcome: blocked. Phase 1 is done (the discovery above); this prompt carries the GO for Phase 2. No subagents, no background tasks. Commit as soon as gates are green. Every reply opens with [P-2026-11-07-0700 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log. Rule 11: this prompt authorizes one new member of the exported AST node union and one new token type.

## Contesto (non rifare l'analisi)

Read the discovery §4 and the concern section in `docs/spec/concern_languages.md` («Dynamic classification in JjEL»), nothing else of either. Today `:` not followed by `=` lexes as COLON (`jjel/lexer/lexer.ts:111-121`), so `V::D` fails; `in` is a keyword but a member name after `.` admits keywords (`parser.ts:66-69` `MEMBER_NAME_TYPES`, consumed near `:432`), so `self.in(x)` is already a member call. The precedent for a dedicated node is `StateAccessExpr` (`jjel/types/ast.ts:318-327`).

## COSA

(1) Lexer and tokens: one token type for `::` (name it after a grep that the name is free), produced by the `:` case when the next character is `:`; `:=` and a single `:` unchanged.
(2) AST: a node `ClassificationTest { object: Expr; viewpoint: string; dynamicClass: string }` with source positions like its neighbours.
(3) Parser: a member call named `in` whose argument list is exactly one qualified name `IDENT :: IDENT` produces `ClassificationTest`; `in` with any other arguments stays the ordinary member call it is today; `::` anywhere else is a parse error with a message that names the one place it is allowed. `forall x in S` and `exists x in S` are unchanged.
(4) Evaluation is not this lane: the evaluator throws on a `ClassificationTest` with a clear message («classification is not bound here»), so the tri-state reports `exception`; the accessor is lane L3.3. If the evaluator's exhaustive switch forces a case, add only that throwing case and say so (a sixth file is allowed for this and only this).
(5) Tests first, in one new test file beside the existing parser tests: the four token cases (`:`, `:=`, `::`, `: :`), the node for `self.in(Mode::Charging)` and for a chained receiver (`self.wau.in(Alert::Safe)`), `self.in(x)` still a member call, `::` outside `in` refused, `forall`/`exists` parity, and an existing parser suite run unchanged. Mutation bench on lexer and parser changes (P5).
(6) Gates: typecheck at the baseline of CLAUDE.md §17, the JjEL suites and the full vitest run at its baseline, `npm run build`, `npm run check:docs`. One code commit; the log entry appended to `docs/log-inbox/dcn.md` and the Status flip in one docs commit. No visual check is owed.

## HARD STOP

A need to touch a file outside `frontend/src/jjel/` and its tests: stop with Outcome: question.

## NON FARE

No evaluator semantics, no change to `jjscript/`, no slot write syntax (L3.4), no push, no merge. Public repo: name no partner company.

## DOVE

`frontend/src/jjel/lexer/lexer.ts`, `frontend/src/jjel/types/tokens.ts`, `frontend/src/jjel/types/ast.ts`, `frontend/src/jjel/parser/parser.ts`, one new test file; `frontend/src/jjel/evaluator/evaluator.ts` only for (4).

## RIFERIMENTI

docs/decisions.md R-DCN-7, R-DCN-12, R-DCN-21; docs/spec/concern_languages.md; docs/discovery/discovery_2026-11-06_dcn_foundations.md §4.

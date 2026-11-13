# JjEL: `and`/`or` decided by the left operand as SPEC says, and the hint for `oclIsTypeOf`

Prompt-ID: P-2026-11-13-1246
Chat: C-2026-11-12-1346
Front: maintenance
Lane: full (Phase 1 read-only discovery, hard stop, Phase 2 only after the chat's GO in a resume message)
Status: eseguito 2026-11-13 · lane full · 971e866df
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-13 12:21, on the trunk defects found by the review of the Jjodel book, the `and`/`or` disagreement included: "fixa"

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjel-bookfix`, branch `jjel-and-or`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt.
Model and tier as pinned (RC-16), effort `xhigh`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as
stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-13-1246 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes per phase. Context discipline: grep and read
the parts you need, never cat whole large files or logs; write the report before the soft ceiling (RC-51). No push, no merge.

## Contesto (non rifare l'analisi)

Two points, both found by an external review of the Jjodel book and confirmed on the trunk by the book lanes.

1. `frontend/src/jjel/SPEC.md` says three times that `and`/`or` are short-circuit (line 106, lines 516-517, and the comparison
   table at line 778). The evaluator applies the operator to two operands already evaluated
   (`frontend/src/jjel/evaluator/evaluator.ts`, `case 'and'` and `case 'or'`, about lines 541-545), and the JavaScript target
   of the generator states it (`frontend/src/codegen/target/js/printer.ts:449`: "Both operands arrive evaluated: JjEL's
   and/or never short-circuit", with `$and`/`$or` that also dispatch to `$bvOp` on bit-vector operands). `implies` is already
   short-circuit in the evaluator (`evaluateImplies`). A guard such as `t.event != null and t.event.name == "e"` therefore
   fails today where SPEC says it holds.
2. The ticket of 2026-11-13 in `docs/log-inbox/maintenance.md`, "JjEL lexer: the hint for oclIsTypeOf suggests is, which
   includes subclasses". Read it whole.

Decision (Alfonso's mandate of 2026-11-13, direction chosen by the chat): SPEC is the normative text and the evaluator follows
it, under one constraint: **on every input for which the present evaluator returns a value, the result stays the same.** The
only intended change is that the right operand is not evaluated when the left operand alone decides the result, so an error or
a null dereference in the right operand no longer surfaces in that case.

## COSA, Phase 1 (read-only on product code)

Write the report `docs/discovery/discovery_2026-11-13_jjel_and_or_short_circuit.md` (P4: the hypothesis being falsified, the
goal, the files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions).
The only files you write in Phase 1 are the report and gitignored probes.

1. The evaluator: where the operands of a binary operator are evaluated, how `implies` avoids it, and the table of results of
   `and`/`or` today for every pair of operand classes (true, false, null, a non-boolean truthy or falsy value, a bit-vector,
   an operand whose evaluation throws). For each cell: the present result and the result under the decision. Name the cells
   that change; by the constraint above they can only be cells where the present evaluator throws.
2. Bit-vectors: `and`/`or` on bit-vector operands are bitwise and need both operands. Say what "the left operand alone decides"
   means when the left operand is a boolean and the right one could be a bit-vector, and which rule keeps the constraint.
3. Every other place that implements or assumes the semantics: the JavaScript target (`$and`, `$or`, how the printer emits
   the two operands), any other generator target, the JjTL executor's use of JjEL, the translatable subset used by semantic
   type class actions, static analysis of dependencies (does anything compute the dependencies of an expression by
   evaluating both operands, so that a reactive re-evaluation would be missed when the right operand is skipped), the
   differential tests between evaluator and generated code, and the tests that pin eager evaluation.
4. The documents that state either semantics (SPEC, help pages under `docs/help/`, comments). After the fix they must agree.
5. The hint: `frontend/src/jjel/lexer/lexer.ts:19-20` and `lexer-own-keys.test.ts:61-62`. Check with a probe that
   `x.instanceOf.name == "T"` evaluates as the exact-class test today, and propose the wording of a distinct message for
   `oclIsTypeOf` that names it.
6. For each point: the proposed fix in the fewest lines, the files it touches, the tests to write first (red on the present
   code), the negative control, and whether any file of the critical zone (CLAUDE.md §3.2) is involved. No visual check is
   expected; say so if you find otherwise.

Commit the report alone (`docs: discovery, JjEL and/or and the oclIsTypeOf hint (P-2026-11-13-1246)`).

## HARD STOP

After the report is committed. The final message gives the path of the report, the table of the cells that change, the
proposed fixes in three lines each, and the questions with their `Recommended:` lines. `Outcome: hard-stop`.

## COSA, Phase 2 (only after a resume message that opens with `[P-2026-11-13-1246]` and says GO)

The resume message states what is approved and with which answers. Then: baseline gates, tests first, the fix in the evaluator
and in every implementation the report lists (they change together or not at all), the hint, negative control, gates
(typecheck against the baseline, `npx vitest run`, build), one code commit per point, the comment at `printer.ts:449` and the
documents of point 4 aligned, the log entry in `docs/log-inbox/maintenance.md` and the Status flip as P9 and P13 prescribe.

## NON FARE

- No change to the JjEL grammar. No change to `implies`, to truthiness or to the bitwise operators on bit-vectors.
- No file of the critical zone. No refactoring next to the fix. No rename.
- Nothing in the book repository. No push, no merge: the chat merges.

## RIFERIMENTI

`frontend/src/jjel/SPEC.md`, `frontend/src/jjel/evaluator/evaluator.ts`, `frontend/src/codegen/target/js/printer.ts`,
`frontend/src/jjel/lexer/lexer.ts`, `docs/log-inbox/maintenance.md` (the ticket of 2026-11-13).

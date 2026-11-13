# JjTL: two defects found by the book review (jjodel-lanes #897, #898)

Prompt-ID: P-2026-11-13-1245
Chat: C-2026-11-12-1346
Front: maintenance
Lane: full (Phase 1 read-only discovery, hard stop, Phase 2 only after the chat's GO in a resume message)
Status: eseguito 2026-11-13 · lane full · b895ab900 · verifica visiva passata 2026-11-13
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-13 12:21, on the trunk defects found by the review of the Jjodel book: "fixa"

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjtl-bookfix`, branch `jjtl-book-findings`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt. Model and tier as pinned (RC-16), effort `xhigh`. Before anything else: `pwd`, branch, `git log -1` and `git status`
are as stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-13-1245 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes per phase. Context discipline: grep and read
the parts you need, never cat whole large files or logs; write the report before the soft ceiling (RC-51). No push, no merge.

## Contesto (non rifare l'analisi)

The two tickets are in `docs/log-inbox/maintenance.md` (entries of 2026-11-12, "ticket: JjTL trace: every := binding recorded
as not invertible on the app parse path" and "ticket: JjTL: two creation blocks on one feature overwrite each other"). Read
both whole. What the book lanes already established, on `alfonso-frontend-jjtl` at `ea82026e1`:

- #897. With source text the parser wraps each expression as `JjelExpression` (`frontend/src/jjtl/parser/parser.ts:907, 927`);
  `isExpressionInvertible` (`frontend/src/jjtl/executor/executor.ts:2170-2204`) has no case for that type and answers `false`.
  On the legacy parse path (no source text) the same run records `name := name` as invertible.
- #898. Two creation blocks on one multi-valued target feature in one rule (two `-> cols` blocks) overwrite each other: only
  the elements of the second block remain.

The book repository is read-only for this lane. Its fixture and the program as printed are at
`~/jjodel-book-w-book32/author/tools/codegen-fixture/` (`run.sh`, `uml2rdbms-as-printed.jjtl`), and the runs are described in
`~/jjodel-book-w-book32/author/discovery/discovery_2026-11-12_review_l1_runs.md` (section 3.1 and the JjTL section).

## COSA, Phase 1 (read-only on product code)

Write the report `docs/discovery/discovery_2026-11-13_jjtl_book_findings.md` (P4: the hypothesis being falsified, the goal, the
files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions). The only
files you write in Phase 1 are the report and gitignored probes.

1. #897, invertibility on the app parse path.
   - Reproduce with a probe: one rule with `name := name`, parsed with source text and without, and the trace entry each run
     records.
   - What a `JjelExpression` node carries (the JjEL AST, the source text, both), and which JjEL shapes the legacy cases of
     `isExpressionInvertible` treat as invertible. The goal is one answer on both paths for the same expression.
   - Every consumer of the invertibility flag (`grep` the field through `jjtl/`, the trace model, the transformation panel,
     any backward propagation or synchronisation). This is the risk to rule on: the flag has been `false` on the app path
     since the wrapper was introduced, so a consumer may have code that has never run in the application. Say, per consumer,
     what changes when the flag becomes `true` for a property reference.
   - The tests that pin the present answer.
2. #898, creation blocks on one feature.
   - Reproduce with the book's program and with a minimal rule (two creation blocks on one multi-valued feature).
   - Where a creation block writes its feature (assignment or append), and what the JjTL specification and the development
     plan (`docs/jjtl/`, `frontend/src/jjtl/` SPEC or README files) say about several blocks on one feature.
   - The cases around it: a second block on a single-valued feature; a creation block followed by a `:=` binding on the same
     feature; re-execution of the transformation (are the elements created by a previous run reused through the trace, and
     would accumulation duplicate them).
   - The tests that pin the present behaviour.
3. For each defect: the proposed fix in the fewest lines, the files it touches, the tests to write first (red on the present
   code), the negative control, whether a visual check is due (it is, if the transformation panel shows the flag or the
   created elements differently after the fix), and whether any file of the critical zone (CLAUDE.md §3.2) is involved. If
   one is, say so and stop there for that defect.

Commit the report alone (`docs: discovery, JjTL book findings (P-2026-11-13-1245)`).

## HARD STOP

After the report is committed. The final message gives the path of the report, the two proposed fixes in three lines each, and
the questions with their `Recommended:` lines. `Outcome: hard-stop`.

## COSA, Phase 2 (only after a resume message that opens with `[P-2026-11-13-1245]` and says GO)

The resume message states which fixes are approved and with which answers. Then: baseline gates, tests first, the fix,
negative control, gates (typecheck against the baseline, `npx vitest run`, build), one code commit per defect, the log entry in
`docs/log-inbox/maintenance.md` and the Status flip as P9 and P13 prescribe. Expected behaviour after the fix:

- a binding whose expression is a property reference is recorded invertible on both parse paths;
- several creation blocks on one multi-valued feature accumulate, in the order written.

## NON FARE

- No change to the JjTL grammar or to the trace model's exported types beyond what the report justifies and the GO approves.
- No file of the critical zone. No refactoring next to the fix. No rename.
- Nothing in the book repository. No push, no merge: the chat merges.

## RIFERIMENTI

`docs/log-inbox/maintenance.md` (the two tickets), `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/executor/executor.ts`,
`docs/jjtl/DEVELOPMENT-PLAN.md`, the book fixture and discovery named above.

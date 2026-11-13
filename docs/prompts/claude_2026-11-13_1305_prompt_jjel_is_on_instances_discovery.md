# Discovery: JjEL `is` on model instances (SPEC says kind-of, the evaluator answers false)

Prompt-ID: P-2026-11-13-1305
Chat: C-2026-11-12-1346
Front: maintenance
Lane: full (Phase 1 read-only discovery, hard stop, Phase 2 only after the chat's GO in a resume message)
Status: eseguito 2026-11-13 · lane full · a065ce9c0 · verifica visiva passata 2026-11-13
Request: https://claude.ai/code/session_01DQt9R4bYnjEzX4r18SudeG Alfonso, chat of 2026-11-13 12:21, on the trunk defects found by the review of the Jjodel book: "fixa"; this defect was found by lane P-2026-11-13-1246 while it worked on that mandate

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjel-is`, branch `jjel-is-instances`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt.
Model and tier as pinned (RC-16), effort `xhigh`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as
stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-13-1305 · session <id>]`; every final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes per phase. Context discipline: grep and read
the parts you need, never cat whole large files or logs; write the report before the soft ceiling (RC-51). No push, no merge.

## Contesto (non rifare l'analisi)

Lane P-2026-11-13-1246 measured, on `d648c4a02`, on a class `Sub` whose `superTypes` is `[Base]` and an instance `o` of `Sub`
shaped like the record of `buildEvalContext` (`guardContext.test.ts:28-40`): `o is Sub` is `false`, `o is Base` is `false`,
`o.instanceOf.name == "Sub"` is `true`, `o.instanceOf == Sub` is `true`. Its report is
`docs/discovery/discovery_2026-11-13_jjel_and_or_short_circuit.md` on branch `jjel-and-or` (worktree `~/jjodel-w-jjel-bookfix`,
read-only for you), sections 4.8 and 5.3. It quotes `subsetChecker.ts:354` ("`is` is false on model instances: write
`self.instanceOf == ...`") and `TypeRegistry.isInstance` (`frontend/src/jjel/context.ts:103-120`), which matches `__type` or
`className` against the registered types; on an instance `__type` is `'Object'` and on an L proxy `className` is the D-name
(root CLAUDE.md §3.13).

The Jjodel book states, in its chapter on JjEL and in its reference appendix, that `is` "checks type membership with kind-of
semantics: an instance of a subclass satisfies `is`", and the lexer's hints send OCL users to `expr is Type`. So either `is`
works on model instances somewhere the measure did not look, or the language promises what the evaluator does not do.

That lane is changing `and`/`or` in `evaluator.ts`, `printer.ts` and `subsetChecker.ts` right now. Do not depend on its
branch; say in the report where a fix here would touch the same files.

## COSA, Phase 1 (read-only on product code)

Write the report `docs/discovery/discovery_2026-11-13_jjel_is_on_model_instances.md` (P4: the hypothesis being falsified, the
goal, the files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions).
The only files you write in Phase 1 are the report and gitignored probes.

1. What SPEC (`frontend/src/jjel/SPEC.md`) and the help pages say `is` does: on primitive values, on model instances, on
   classes, on null; kind-of or exact.
2. Measure `x is T` for an instance of `T`, of a subclass of `T`, of an unrelated class, and for a name that is not a class,
   in every context where a modeller can write JjEL, each with the objects that context really passes: a validation rule, a
   view predicate if it goes through the JjEL evaluator, the Console's JjEL mode, a JjTL `where` clause and a JjTL binding,
   a JjGen hole, a JjScript `such that`, a guard and an action of a semantic type class (evaluator and generated JavaScript).
   Use the real context builders, not hand-made records; say for each whether the value is an L proxy, a D object or a
   plain record, and what `TypeRegistry` holds there.
3. How the other mechanisms that include subclasses do it today (validation scoping, JjGen dispatch, the roles of a semantic
   type class), with `file:line`, since `is` should agree with them. And where exact-class is the rule (`T.instances`, JjTL
   matching), so the report states the whole picture in one table.
4. Who relies on the present answer: tests that pin `is` as false on instances, the subset checker's message, expressions
   in fixtures, demo projects and the MODELS demo material that use `is` on an instance and would change value.
5. The proposed fix in the fewest lines: where the kind-of test belongs (`TypeRegistry.isInstance`, the evaluator's `is`
   case, the context builders), how it resolves the class of an instance and walks `superTypes` without touching the
   L-proxy conventions of CLAUDE.md §3.13, what the generated JavaScript does for `is`, the files touched, the tests to write
   first, the negative control, whether a visual check is due, and whether any file of the critical zone (CLAUDE.md §3.2)
   is involved. If the change cannot be made without the critical zone or an exported interface, say so and recommend the
   alternative (the language states the limit, and the hints change).

Commit the report alone (`docs: discovery, JjEL is on model instances (P-2026-11-13-1305)`).

## HARD STOP

After the report is committed. The final message gives the path of the report, the table of contexts with the measured
answers, the proposed fix in five lines, and the questions with their `Recommended:` lines. `Outcome: hard-stop`.

## COSA, Phase 2 (only after a resume message that opens with `[P-2026-11-13-1305]` and says GO)

The resume message states what is approved. Then: baseline gates, tests first, the fix, negative control, gates, the code
commit, the log entry in `docs/log-inbox/maintenance.md` and the Status flip as P9 and P13 prescribe.

## NON FARE

- No change to the JjEL grammar, to `instanceOf`, to `T.instances` or to JjTL matching.
- No file of the critical zone. No refactoring next to the fix. No rename.
- Nothing in the book repository, nothing in `~/jjodel-w-jjel-bookfix`. No push, no merge: the chat merges.

## RIFERIMENTI

`frontend/src/jjel/SPEC.md`, `frontend/src/jjel/context.ts`, `frontend/src/jjel/evaluator/evaluator.ts`,
`frontend/src/semantics` or wherever `subsetChecker.ts` and `buildEvalContext` live, root `CLAUDE.md` §3.13 and
`frontend/src/model/CLAUDE.md`.

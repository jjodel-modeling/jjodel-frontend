# JjEL bit-vector values, slice S2: finish the simulator word domain after the context ceiling (implementation)

Prompt-ID: P-2026-10-21-0055
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-0010 after the AM-8 ceiling, RC-51; simulation engine)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-0010
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bvsim`, branch `bv-sim`, HEAD at the commit that adds this prompt. The tree is **expected
dirty** with the uncommitted work of P-2026-10-21-0010 (its `handoff.diff` and `handoff.md` in
`/Users/alfonso/.jjodel-lanes/P-2026-10-21-0010/`; three new files marked intent-to-add). Check that `git diff`
matches the handoff diff; otherwise stop. The `frontend/node_modules` link is still in place; remove it at the end.
Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0055 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Two sessions of this front hit the AM-8
ceiling: read `handoff.md` first, never the 65 kB diff in full (use `git diff --stat` and read only the hunks you
touch), send test output to files and read their tails. **Commit the code the moment the gates are green**, before the
bench and the docs.

## COSA

Everything in `handoff.md` stands (scope, decisions 1-3, `toNumber` left out, `toVerilog` flagged from a bit-vector
set). The one open defect: the three integration tests that call `bits(8, 1)` in an action fail with
`Function 'bits' is not defined`. Cause, measured by the chat: `JjelEvaluator` registers its global builtins on its own
context (`jjel/evaluator/evaluator.ts:114`, `bits` at `:154`), while the simulator evaluates on the context it builds
in `model/simulation/guardContext.ts:140` (`base: new EvaluationContext(record)`), which has none.

The fix, decided by the chat (unattended, RC-25): export from JjEL one function that registers only the two
bit-vector constructors on a given context (in `frontend/src/jjel/evaluator/builtins/bitvectors.ts`, for example
`registerBitVectorConstructors(ctx)`, reusing the evaluator's own definitions so there is one implementation), call it
in `evaluator.ts` where `bits`/`sbits` are registered today, and call it on the simulator's base context in
`guardContext.ts`. Only `bits` and `sbits`: the other global builtins stay out of the simulator, so no model attribute
is shadowed there (discovery §3.1). Both files join the Rule 19 list of P-2026-10-21-0010; no other new file. Also fix
the test type error at `wordDomain.test.ts:121`.

## COME

1. Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/jjel src/model src/codegen src/components/editor-v2/sim`
   green (wider than the earlier lanes: the merge gate runs the whole suite and caught a validation test last time);
   `npm run build`.
2. Commit `feat(sim): bit-vector word domains, widths read per element at Reset (P-2026-10-21-0010)` with the files by
   path (the `git add -N` files included), gates in the body, `Model:` trailer.
3. The five-mutation bench (inDomain, width resolution, `bvToSmv`), killers named in a docs commit body if the feat
   commit is already made.
4. Docs closure: `docs/decisions.md` rows R-BV-8 (and R-BV-9, R-BV-10 if you keep decisions separate) with header
   `provisional, unattended, evidence: measured, verified: none, reversible: trunk` (only those vocabularies parse:
   `npm run -s docs:digest`); the Status lines of P-2026-10-21-0010 and of this prompt; one entry in
   `docs/log-inbox/jjel-bitvector.md` in the §21.3 taxonomy (`Causa: —` when `Corregge: —`, Notes at most 500
   characters); `npm run check:docs` green.

## NON FARE

No other JjEL change, no codegen, no `.smv` exporter, no declaration dialog (item 7 stays out). No push, no merge. Do
not name the industrial partner.

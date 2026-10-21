# JjEL bit-vector values, slice S3: bit-vectors in code generation (implementation)

Prompt-ID: P-2026-10-21-0640
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (code generation engine and JS target of the R-GEN pilot, near the 3.2 freeze)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-0055
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bvgen`, branch `bv-codegen`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt
(S1 and S2 are on the trunk). Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules`
(P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`. Single phase: the analysis is in
`docs/discovery/discovery_2026-10-20_jjel_bitvector.md` §6 and §11 S3; do not redo it. Alfonso decided on 2026-10-21 that
S3 lands before the 2026-10-23 freeze (R-REL-3).

## Lane discipline

Every reply opens with `[P-2026-10-21-0640 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Three sessions of this front hit the AM-8 ceiling: read only the functions you edit (discovery §6 gives the lines),
send test output to files and read their tails, and **commit the code the moment the gates are green**, before the
bench and the docs.

## COSA

Make a bit-vector value travel through the code generation pilot without loss.

1. `frontend/src/codegen/engine/origin.ts` `plain()` (about line 194): a bit-vector prints in its Verilog form
   (`x.toVerilog()` of S1, e.g. `8'hff`, `8'sh80`), never `JSON.stringify` and never `[Object]`. A template hole
   `${r}` with a vector therefore emits Verilog text with its width.
2. `frontend/src/codegen/target/js/access.ts` `valueLiteral` (about line 277): a vector is emitted as a call that
   rebuilds it in the generated code, never as `null` and never as a plain object literal.
3. `frontend/src/codegen/target/js/printer.ts` runtime prelude (about lines 156-205): the generated JavaScript gets the
   bit-vector semantics. Reuse the S1 module `frontend/src/jjel/evaluator/builtins/bitvectors.ts` as the single source
   (inline its functions as text into the prelude, or the mechanism the printer already uses for its helpers), so the
   generated code and the evaluator cannot diverge; `$add`, `$sub`, `$mul`, `$neg`, `$eq`, `$cmp`, `$truthy` dispatch to
   it for vectors, with the same defects (thrown errors) as the evaluator.
4. If the JS target translates JjEL method calls, the S1 bit-vector methods are translated; if a construct is out of
   the translatable subset, the existing refusal path names it.

Tests: the R-GEN-8 oracle compare on a counter model whose register is an 8-bit word wrapping at 256 (generated JS
and the simulator give the same trace); the runner round trip of a vector through `postMessage` and
`structuredClone`; `plain()` on a vector; `valueLiteral` on a vector; one test per dispatched runtime helper on a
vector, including a width-mismatch defect.

## DOVE

Items 1 to 4 and their tests under `frontend/src/codegen/`. Rule 19 list: the files you edit, declared in the report.
`bitvectors.ts` may only gain exports needed to inline it (no behaviour change); any other JjEL or simulator change is
out: stop with `Outcome: question`. No critical-zone file. Docs in the closure commit: one row R-BV-9 in
`docs/decisions.md` (header `provisional, unattended, evidence: measured, verified: none, reversible: trunk`; only those
vocabularies parse, check with `npm run -s docs:digest`) recording how the prelude shares the S1 semantics; the Status
line; one entry in `docs/log-inbox/jjel-bitvector.md` in the §21.3 taxonomy (`Causa: —` when `Corregge: —`, Notes at
most 500 characters); `npm run check:docs` green.

## COME

Baseline typecheck and `npx vitest run src/codegen` (state counts). Gates: typecheck 0 through
`node scripts/run-quiet.mjs`; `npx vitest run src/jjel src/model src/codegen src/components` green but the known
import failures of CLAUDE.md §17 (the merge gate runs the whole suite); `npm run build`; a mutation bench of five
mutations on `plain`, `valueLiteral` and the prelude dispatch, killers named in the docs commit body. One
`feat(codegen): ...` commit, one docs closure commit, `git add` by path, `Model:` trailer. No push, no merge. Do not
name the industrial partner.

# JjEL bit-vector values, slice S3: finish code generation after the context ceiling (implementation)

Prompt-ID: P-2026-10-21-0700
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-0640 after the AM-8 ceiling, RC-51; codegen engine and JS target)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-0640
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bvgen`, branch `bv-codegen`, HEAD at the commit that adds this prompt. The tree is **expected
dirty** with the uncommitted work of P-2026-10-21-0640 (`origin.ts`, `access.ts`, `printer.ts`; its `handoff.md` and
`handoff.diff` in `/Users/alfonso/.jjodel-lanes/P-2026-10-21-0640/`). Check that `git diff` matches the handoff diff;
otherwise stop. The `frontend/node_modules` link is in place; remove it at the end. Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0700 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Read `handoff.md` first; never read the diff
or `printer.ts` in full (read only the hunks and functions you test); send test output to files and read their
tails. **Commit the code the moment the gates are green**, before the bench and the docs.

## COSA

Finish S3 as `handoff.md` lists it, with one addition the previous session named as the main remaining risk:

1. The six tests of the handoff (counter model with an 8-bit register wrapping at 256 against the R-GEN-8 oracle,
   runner round trip, `plain()`, `valueLiteral`, dispatched runtime helpers including a width-mismatch defect).
2. **A parity test** between the prelude's JavaScript copy of the bit-vector semantics and the S1 module
   `frontend/src/jjel/evaluator/builtins/bitvectors.ts`: it runs every row of the oracle table
   `frontend/src/jjel/__tests__/fixtures/bv-cases.json` through the generated prelude functions and compares with the
   table's `expected` values. If that fixture is not on this branch yet (it lands with lane P-2026-10-21-0641), use the
   S1 golden set `bv-golden.json` and state it; the chat rebases nothing. This is what stops the copy from drifting
   (R-BV-6).
3. Gates, feat commit, the five-mutation bench, docs closure (R-BV-9 with header `provisional, unattended, evidence:
   measured, verified: none, reversible: trunk`, only those vocabularies parse: `npm run -s docs:digest`; Status lines of
   P-2026-10-21-0640 and of this prompt; one entry in `docs/log-inbox/jjel-bitvector.md`, §21.3 taxonomy, `Causa: —`,
   Notes at most 500 characters; `npm run check:docs` green).
4. The two problems found by the previous session go to tickets with `lane-run ticket --front hw-notation`: high,
   `CodePanel.tsx:582` and `checkView.ts` call `JSON.stringify` on a run result holding a vector (BigInt); medium, the
   generated domain check of the lecture example templates has no `word` case. Do not fix them here.

## DOVE

The three files of the handoff, the new tests under `frontend/src/codegen/`, and the docs above. Nothing else under
`frontend/src`. No critical-zone file. No push, no merge. Do not name the industrial partner.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/jjel src/model src/codegen src/components`
green but the known import failures of CLAUDE.md §17; `npm run build`. One `feat(codegen): bit-vectors in code
generation (P-2026-10-21-0640)` commit, one docs closure commit, `git add` by path, `Model:` trailer.

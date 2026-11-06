# JjEL bit-vector values: the Verilator oracle for the operator semantics (implementation)

Prompt-ID: P-2026-10-21-0641
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (test oracle against an external simulator; new script and fixture)
Status: eseguito 2026-10-21 · lane bv-oracle · 4b2dc75fd
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-20-2350
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bvoracle`, branch `bv-oracle`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at
the end. Heavy tier (RC-16), effort `high`. Single phase: the design is §9 of
`docs/discovery/discovery_2026-10-20_jjel_bitvector.md`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0641 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Read only what you need; send command output
to files and read their tails; commit the code the moment the gates are green.

## COSA

Verilator 5.052 is now installed on this machine (Homebrew, `/opt/homebrew/bin/verilator`; check `verilator --version`
first and stop with `Outcome: blocked` if it is missing). Prove that the evaluator's bit-vector semantics (S1,
`frontend/src/jjel/evaluator/builtins/bitvectors.ts`) coincides with Verilog's on a generated table of cases.

1. `frontend/scripts/oracle/bv-cases.mjs`: generates `frontend/src/jjel/__tests__/fixtures/bv-cases.json`, inputs only,
   as hex text: every operator and method of S1 (arithmetic, comparisons signed and unsigned, bitwise methods, shifts
   logical and arithmetic, `slice`, `bit`, `concat`, `replicate`, `zext`, `sext`, `trunc`), widths
   `{1, 4, 7, 8, 16, 32, 33, 53, 54, 64, 65, 128}`, both signednesses where it applies, operands from the edge set
   `{0, 1, 2^(w-1)-1, 2^(w-1), 2^w-1}` plus seeded random values (fixed seed), shift amounts `{0, 1, w-1, w, w+1}`.
   Keep the table under about 5,000 rows.
2. `frontend/scripts/oracle/bv-verilator.mjs`: writes one SystemVerilog module per operator family with every operand
   sized and signed explicitly, one `$display` per case printing the case index and the result in hex, runs
   `verilator --binary` in a scratch directory under `frontend/.vite-cache/bv-oracle/` (gitignored), parses the output
   and writes `expected` back into `bv-cases.json`. A case Verilog cannot express identically (for instance a shift
   amount wider than the operand) is listed in the report with the reason, never silently dropped.
3. `frontend/src/jjel/__tests__/bitvectorOracle.test.ts`: reads `bv-cases.json` and checks the evaluator row by row
   against `expected`. It runs in the normal suite without Verilator (the expected values are committed).
4. An npm script `oracle:bv` that runs the two scripts in order, documented in `frontend/src/jjel/SPEC.md` §7.5 in one
   paragraph.

If the evaluator disagrees with Verilator on any row, do not change `bitvectors.ts`: commit the table and the test
with the disagreeing rows marked `skip` and listed, and end with `Outcome: question`, the rows grouped by operator and a
`Recommended:` line on which side is right (cite IEEE 1800-2017).

## DOVE

The four items above; `frontend/package.json` for the npm script only. No change to `bitvectors.ts`, the evaluator,
the simulator or codegen. No new npm dependency. Docs closure: one row R-BV-10 in `docs/decisions.md` (header
`provisional, unattended, evidence: measured, verified: probe, reversible: trunk`; check with `npm run -s docs:digest`)
stating the oracle and its result; the Status line; one entry in `docs/log-inbox/jjel-bitvector.md` (§21.3 taxonomy,
`Causa: —`, Notes at most 500 characters); `npm run check:docs` green.

## COME

Gates: typecheck 0 and `typecheck:scripts` 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/jjel` green;
`npm run build`; `npm run check:scripts`. One `test(jjel): ...` commit with the counts (rows, operators, agreements) in
the body, one docs closure commit, `git add` by path, `Model:` trailer. No push, no merge. Do not name the industrial
partner.

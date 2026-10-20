# JjEL bit-vector values, slice S2: word domains in the simulator and the nuXmv word printer (implementation)

Prompt-ID: P-2026-10-21-0010
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (simulation engine across modules: net types, step, codec, action evaluator, subset checker)
Status: eseguito 2026-10-21 · lane bv-sim · 9b4ded919
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-20-2350
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bvsim`, branch `bv-sim`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt
(S1 is on the trunk: `frontend/src/jjel/evaluator/builtins/bitvectors.ts`). Check `pwd`, branch, `git log -1`,
`git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort
`xhigh`. Single-phase lane: the discovery is `docs/discovery/discovery_2026-10-20_jjel_bitvector.md` (§5, §11 S2) and
its decisions are in force; do not redo it.

## Lane discipline

Every reply opens with `[P-2026-10-21-0010 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Context is the scarce resource (two sessions of this front hit the AM-8 ceiling): read only the functions you edit and
the discovery sections cited, never whole large files; run test commands with output to a file and read its tail.
Commit the code as soon as the gates are green, before the docs, so a ceiling stop never leaves work uncommitted.

## COSA

Let a stored attribute of the simulator hold a bit-vector (R-BV-7, ratified): a fourth `Domain` kind
`{ kind: 'word', widthFeature: string, signed: boolean }` whose width is read per element from the frozen model at
Reset (the value of the feature `widthFeature` of that element, an integer from 1 to 128, constant for the run; a
missing or invalid width is a compile defect `declaration` at Reset, named by the element).

1. `model/simulation/netTypes.ts`: `SimValue` gains `JjelBitVector`; `Domain` gains the `word` kind.
2. `model/simulation/netStep.ts` `inDomain`: a vector of the element's width and signedness.
3. `model/simulation/stateAttributesCodec.ts`: `domainOf` and the codec for `word`; `parseInitialLiteral` accepts a
   number literal or a call `bits(w, n)` / `sbits(w, n)` with literal arguments, checked against the domain at Reset.
4. `model/simulation/actionEvaluator.ts` `isSimValue`: accepts a vector.
5. `model/simulation/subsetChecker.ts`: the bit-vector methods of S1 that have a nuXmv word operator are translatable;
   `toNumber` and `toVerilog` are not.
6. New pure module `model/simulation/bvToSmv.ts`: a bit-vector JjEL expression (AST) to nuXmv text, per discovery
   §5.3 (`unsigned word[N]`/`signed word[N]` declarations, `0ud8_255`, `-0sd8_1`, `+ - *`, `&`, `|`, `xor`, `!`, `<<`,
   `>>`, `::`, `x[hi:lo]`, `extend`, `resize`, `signed()`/`unsigned()`), with its unit tests. No exporter exists; this
   module is what a later exporter lane consumes.
7. The declaration dialog's domain editor offers `word` with a width-feature picker and a signed toggle, only if the
   change stays inside the dialog component; otherwise leave the UI out and say so in the report.

Tests: a register declared `word` with width feature `width = 8` incremented 256 times is 0; two elements of one
metaclass with widths 8 and 16 run side by side; step back restores the vector; a Reset defect for a width-mismatched
initial literal and for a missing width; trace parity on every existing simulation test (no `word` domain, identical
traces); `bvToSmv` on every S1 method that is translatable.

## DOVE

The files of items 1 to 6, their tests, and item 7's dialog component if taken. List them in the report as the
Rule 19 declaration. No critical-zone file; no JjEL file (S1 is closed: if S1 needs a change, stop with
`Outcome: question`). Docs in a closure commit: `docs/decisions.md` one row R-BV-8 (provisional, unattended,
`evidence: measured`, `verified: none`, `reversible: trunk`; only those vocabularies parse, check with
`npm run -s docs:digest`) recording the `word` domain as built; the Status line; one entry in
`docs/log-inbox/jjel-bitvector.md`; `npm run check:docs` green.

## COME

Baseline typecheck and `npx vitest run src/model/simulation` (state counts). Gates: typecheck 0 through
`node scripts/run-quiet.mjs`; `npx vitest run src/jjel src/model/simulation src/codegen` green; `npm run build`; a
mutation bench of five mutations on `inDomain`, the width resolution and `bvToSmv` (killers named in the commit body).
One `feat(sim): ...` commit, one docs closure commit, `git add` by path, `Model:` trailer. No push, no merge.

## NON FARE

No `.smv` exporter (its own lane), no codegen change, no lexer or parser change. Do not name the industrial partner.

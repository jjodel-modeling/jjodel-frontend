# JjEL bit-vector values: where the type enters and what it breaks (discovery)

Prompt-ID: P-2026-10-20-2055
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (new value kind in the JjEL evaluator, exported interfaces of the language core; Phase 1 read-only)
Status: eseguito 2026-10-20 · lane jjel-bitvector · 319b16865
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: none
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bitvector`, branch `jjel-bitvector`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here; otherwise stop.
Link `frontend/node_modules` as P14 says and remove the link at the end of the lane. Model and tier: heavy, as pinned
(RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-20-2055 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. This is Phase 1 only: it ends with a hard stop on the
discovery report; no product code is edited.

## Context (do not redo the analysis)

The front `hw-notation` builds a demonstrator for an industrial research partner: a hardware design notation in
Jjodel (ISA, datapath, control FSM) whose models are simulated cycle by cycle in the Jjodel simulator, transformed with
JjTL into a Verilog abstract-syntax metamodel and emitted as Verilog by the R-GEN templates, then checked against an
external Verilog simulator. Everything in that chain exists on the trunk except one thing: JjEL has no fixed-width
integer. JavaScript numbers lose precision above 53 bits and do not wrap, so an 8-bit `0xFF + 1` is 256 instead of 0
and a 64-bit bus is wrong. The demonstrator is not credible until the simulator and the generated Verilog agree on
every operator.

The chat has written the intended semantics as provisional decisions R-BV-1..6 in `docs/decisions.md` (section
`## R-BV`). Read them first. The discovery confirms or refutes each one with measurements, and says where it lands.

## COSA

Find, with `file:line` and verbatim quotes, every place a bit-vector value has to enter or will break, and answer
these questions, each with evidence:

1. **Value representation.** How the evaluator represents values today (numbers, strings, booleans, collections,
   model objects), where a new value kind is introduced (`frontend/src/jjel/types/`, `evaluator/`), how equality,
   ordering, printing and `toString` work on values, and how arithmetic operators dispatch. State the smallest change
   that adds a value carrying `width`, `signed` and a `BigInt` payload (R-BV-1), and every operator site that would
   otherwise apply JavaScript arithmetic to it silently.
2. **Syntax.** R-BV-5 puts functions and methods first (`bits(8, 255)`, `sbits(8, -1)`, `x.slice(7, 4)`, `x.bit(0)`,
   `concat(a, b)`, `zext(x, 16)`, `sext`, `trunc`). Find how built-in functions and methods are registered and
   resolved, and whether the names collide with existing functions, OCL operations or the reserved names of
   `jjel/stateReserved.ts` and `jjscript/reservedIdentifiers.ts`. Then measure, do not guess, the cost of Verilog
   literals (`8'hFF`, `4'b1010`, `'d3`) in the lexer: what the apostrophe means today, which tokens would clash, and
   which existing tests would change.
3. **Persistence.** Where an attribute value of a model object is stored and serialized, what type a bit-vector
   attribute would have in the metamodel (an `EInt`/`ELong` with a width read from the model, a string encoding, or a
   new data type), and whether any choice forces a VersionFixer migration. R-BV-1 says the width comes from the model
   data, not from the metamodel; say whether the code supports that.
4. **Simulator.** Where guards and actions are evaluated (`Expression`, `Action`, the `.[x]` accessor of R-SIM-18,
   stored and derived attributes of R-SIM-19), which subset of JjEL counts as translatable for guards, and what an
   assignment of a bit-vector to a stored attribute needs. Find the `.smv` exporter if it exists (R-SIM vocabulary:
   `VAR`, `DEFINE`, `TRANS`) and say how `unsigned word[N]` / `signed word[N]` would be emitted (R-BV-6).
5. **Code generation.** How R-GEN templates turn values into text, and how the JavaScript runner in the Web Worker
   receives values (`postMessage`: structured clone carries `BigInt`, measure that the runner does not convert it).
   Say what a template needs to print a value with an explicit width in Verilog form (R-BV-6).
6. **Conformance and the problems registry.** Where a width mismatch, an out-of-range literal or a slice outside the
   width would be reported, and whether it is a defect of the rule or action (as R-VAL-13 treats a non-boolean
   verdict) or a model violation.
7. **Overlap.** The unmerged branch `jjel-multivalued` (`796839cc8`) edits `evaluator/evaluator.ts` and
   `evaluator/modelContext.ts`. Measure the overlap with the sites found above and say whether it should merge first.
8. **Oracle.** Check whether `verilator` and `iverilog` are installed on this machine (`command -v`, versions). Propose
   the test oracle for the operator semantics: a table of operator cases generated once, and how a later slice runs the
   same cases through Verilator to prove the two semantics coincide.

Then propose the slices, each with its files, its tests and its gates: S1 the value and the functions in the
evaluator; S2 the simulator (stored attributes, guards, actions, `.smv` words); S3 code generation (emission with
explicit widths, the JavaScript runner); S4 the Verilog literals, only if item 2 shows the lexer can take them without
breaking existing tests. Close with a Layer Impact Report for S1 and a mutation-bench plan for the operators.

## DOVE

Read anything. Write only:

1. `docs/discovery/discovery_2026-10-20_jjel_bitvector.md`: the discovery report (mandatory, CLAUDE.md and P4:
   the hypothesis being falsified, objective, files read with full paths, findings with `file:line` and verbatim
   quotes, dependencies and risks, open questions, one verdict per decision R-BV-1..6 (confirmed, amended with the
   amendment written out, or refuted with the evidence), the slice plan, the Layer Impact Report for S1). The report
   closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26).
2. Scratch probes, if any, under `frontend/.vite-cache/` (gitignored), not committed.

## COME

1. Baseline: `npm run typecheck` through `node scripts/run-quiet.mjs` from `frontend/` (state the count against the
   baseline of CLAUDE.md §17). Run the JjEL test suite once (`npx vitest run src/jjel`) and state the counts.
2. Answer items 1..8 by reading and by small probes run with Node or vitest, never by editing product code.
3. Commit the report in one `docs:` commit (`git add` by path, `Model:` trailer, P6), then hard stop.

## HARD STOP

At the end of Phase 1, with the report committed. Also stop and ask if: answering any item would need a product code
change; the semantics of R-BV-3 (no implicit extension) turns out to break existing JjEL expressions on numbers
(numbers stay numbers: bit-vectors are a separate kind, and mixing the two is the question to report, not to solve).

## NON FARE

Do not edit files under `frontend/src`. Do not touch the critical zone. Do not merge or rebase `jjel-multivalued`. Do
not name the industrial partner in any file: the repository is public.

## RIFERIMENTI

`docs/decisions.md` sections `## R-BV` (this front), `## R-GEN` (code generation), R-SIM-16..20 and R-SIM-21..33
(simulator), R-VAL-13 (non-boolean verdict as a rule defect). `docs/spec/concern_languages.md` (JjEL concern: known
bugs and decisions in tension, read before any language work). `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`
and `docs/spec/claude_spec_2026-09-13_computational_model.md` §8 (nuXmv vocabulary). `frontend/src/jjel/SPEC.md`.

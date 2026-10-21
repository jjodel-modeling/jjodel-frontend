# Hardware demonstrator S-G1: the nuXmv .smv exporter, core (implementation)

Prompt-ID: P-2026-10-21-1301
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (new pure exporter in the simulation core; golden files)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1145
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwsmv`, branch `hw-smv`, cut from `hw-demo` at the commit that adds this prompt; it merges back into `hw-demo`, not into the trunk. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link
`frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`. Single phase: the analysis is
done.

## Lane discipline

Every reply opens with `[P-2026-10-21-1301 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Six sessions of this front hit the AM-8 ceiling: read only what you edit and the plan section cited, never whole large
files; send command output to files and read their tails; **commit the code the moment the gates are green**, before
the bench and the docs. No push, no merge. Do not name the industrial partner in any file: the repository is public.

## Context

The plan is `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` on branch `hw-demo` (P-2026-10-21-0950 and
-1012). Alfonso ratified its recommendations on 2026-10-21 at 10:32 («ok alle raccomandazioni»): the waves of §10.2,
route A in the demo, route B after the demo minimum, the CPU shipped under `frontend/public/examples/hw/`, no push of
`hw-demo` before S-E is green. This lane is slice **S-G1** of §10.1: read §8 (verdicts) and the §10.1 entry of
S-G1 first; that entry is the specification (files, content, tests, dependencies). S-A1 (CPU model), S-D0 (Verilog printer) and S-B (roles, program, committed trace) are on `hw-demo`; S-D and S-G1 run in parallel on disjoint files.

## COME

Baseline typecheck (expected 0) through `node scripts/run-quiet.mjs`. Gates: typecheck 0; the vitest folders that
cover your files plus `src/jjel src/codegen src/model src/jjtl` (the merge gate runs the whole suite), green but the
known import failures of CLAUDE.md §17; `npm run build`. Code commit(s) with gates and mutation-bench killers in the
body, then one docs closure commit: Status line, one entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy,
`Causa: —` when `Corregge: —`, Notes at most 500 characters), `npm run check:docs` green. `git add` by path, `Model:`
trailer. A decisions row, if the slice needs one, uses the header vocabulary `evidence: measured|read|inferred`,
`verified: agent|none|probe`, `reversible: branch|trunk|persisted` (check with `npm run -s docs:digest`).

## DOVE and NON FARE

The files of the S-G1 entry only: new `frontend/src/model/simulation/smvExport.ts`, its test
`…/__tests__/smvExport.test.ts`, goldens `…/__tests__/fixtures/turnstile.smv` and `hw-cpu.smv`. Pure TypeScript, no
React, no UI, no change to `bvToSmv.ts`, `netStep.ts`, `netTypes.ts` or any other existing simulator file (if one is
needed, stop with `Outcome: question` and a `Recommended:` line). nuXmv is not installed and is not needed: the
round-trip test checks the export against the simulator's own candidate sets on the committed trace of S-B. Do not try
to install nuXmv. No critical-zone file.

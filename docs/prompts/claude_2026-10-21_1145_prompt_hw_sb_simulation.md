# Hardware demonstrator S-B: simulation roles and a running program with a committed trace (implementation)

Prompt-ID: P-2026-10-21-1145
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (simulation roles on the CPU model; in-app probe and headless run)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1100
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, the integration branch of the demonstrator, at the commit that adds this prompt (S-A1 and S-D0 are on it). Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link
`frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`. Single phase: the analysis is
done.

## Lane discipline

Every reply opens with `[P-2026-10-21-1145 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Six sessions of this front hit the AM-8 ceiling: read only what you edit and the plan section cited, never whole large
files; send command output to files and read their tails; **commit the code the moment the gates are green**, before
the bench and the docs. No push, no merge. Do not name the industrial partner in any file: the repository is public.

## Context

The plan is `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` on branch `hw-demo` (P-2026-10-21-0950 and
-1012). Alfonso ratified its recommendations on 2026-10-21 at 10:32 («ok alle raccomandazioni»): the waves of §10.2,
route A in the demo, route B after the demo minimum, the CPU shipped under `frontend/public/examples/hw/`, no push of
`hw-demo` before S-E is green. This lane is slice **S-B** of §10.1: read §8 (verdicts) and the §10.1 entry of
S-B first; that entry is the specification (files, content, tests, dependencies). S-A1 (the CPU model, `build-hw-cpu.ts`) and S-D0 (the Verilog printer) are done; S-C0 runs in parallel on JjTL files.

## COME

Baseline typecheck (expected 0) through `node scripts/run-quiet.mjs`. Gates: typecheck 0; the vitest folders that
cover your files plus `src/jjel src/codegen src/model src/jjtl` (the merge gate runs the whole suite), green but the
known import failures of CLAUDE.md §17; `npm run build`. Code commit(s) with gates and mutation-bench killers in the
body, then one docs closure commit: Status line, one entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy,
`Causa: —` when `Corregge: —`, Notes at most 500 characters), `npm run check:docs` green. `git add` by path, `Model:`
trailer. A decisions row, if the slice needs one, uses the header vocabulary `evidence: measured|read|inferred`,
`verified: agent|none|probe`, `reversible: branch|trunk|persisted` (check with `npm run -s docs:digest`).

## DOVE and NON FARE

The files of the S-B entry only (`frontend/src/codegen/examples/hw-cpu/hw-cpu.json`, `frontend/scripts/examples/build-hw-cpu.ts`,
the regenerated `frontend/public/examples/hw/hw-cpu.jjodel`, the new `hw-cpu.run.test.ts` and the committed
`hw-cpu.trace.json`). The trace format is the one of §7.4, so that S-E can compare it with Verilator's. Every constant
is written as a string (`bits(8, '0x0f')`, R6). The `.jjodel` is written by the app's export, never by hand. A dev server
on a port of your own (not 3000, 3001, 3003); stop it at the end. No change to the simulator engine: if the CPU needs
one, stop with `Outcome: question` and a `Recommended:` line. No critical-zone file.

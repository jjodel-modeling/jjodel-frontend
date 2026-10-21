# Hardware demonstrator S-A1: finish the HwDesign build after the context ceiling (implementation)

Prompt-ID: P-2026-10-21-1100
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-1036 after the AM-8 ceiling, RC-51)
Status: eseguito 2026-10-21 · lane hw-sa1 · d3abfaade
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1036
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, the integration branch of the demonstrator, at the commit that adds this prompt. The tree is **expected dirty** with the
uncommitted work of P-2026-10-21-1036 (build script, spec, a `.jjodel` from a failing run that must be regenerated and
not committed as it is). Read `/Users/alfonso/.jjodel-lanes/P-2026-10-21-1036/handoff.md` first: it records 10 of 13
build checks passing and the cause of the 3 failures (features created and looked up in the same call, so bounds and
containment are never set; fix: set them in a second call after a pause, as `uml-class-object-fixture.ts:133-142`). Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link
`frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`. Single phase: the analysis is
done.

## Lane discipline

Every reply opens with `[P-2026-10-21-1100 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Six sessions of this front hit the AM-8 ceiling: read only what you edit and the plan section cited, never whole large
files; send command output to files and read their tails; **commit the code the moment the gates are green**, before
the bench and the docs. No push, no merge. Do not name the industrial partner in any file: the repository is public.

## Context

The plan is `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` on branch `hw-demo` (P-2026-10-21-0950 and
-1012). Alfonso ratified its recommendations on 2026-10-21 at 10:32 («ok alle raccomandazioni»): the waves of §10.2,
route A in the demo, route B after the demo minimum, the CPU shipped under `frontend/public/examples/hw/`, no push of
`hw-demo` before S-E is green. This lane is slice **S-A1** of §10.1: read §8 (verdicts) and the §10.1 entry of
S-A1 first; that entry is the specification (files, content, tests, dependencies). Wave 1 runs S-D0, S-A1 and S-C0
in parallel on disjoint files.

## COME

Baseline typecheck (expected 0) through `node scripts/run-quiet.mjs`. Gates: typecheck 0; the vitest folders that
cover your files plus `src/jjel src/codegen src/model src/jjtl` (the merge gate runs the whole suite), green but the
known import failures of CLAUDE.md §17; `npm run build`. Code commit(s) with gates and mutation-bench killers in the
body, then one docs closure commit: Status line, one entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy,
`Causa: —` when `Corregge: —`, Notes at most 500 characters), `npm run check:docs` green. `git add` by path, `Model:`
trailer. A decisions row, if the slice needs one, uses the header vocabulary `evidence: measured|read|inferred`,
`verified: agent|none|probe`, `reversible: branch|trunk|persisted` (check with `npm run -s docs:digest`).

## What remains

Apply the fix of the handoff, rerun the build until all 13 checks pass, regenerate the `.jjodel`, run the gates, and
commit the code as soon as they are green; then the docs closure, flipping the Status of P-2026-10-21-1036 and of this
prompt.

## DOVE and NON FARE

The files of the S-A1 entry only (`frontend/scripts/examples/build-hw-cpu.ts`, `frontend/src/codegen/examples/hw-cpu/hw-cpu.json`,
the generated `frontend/public/examples/hw/hw-cpu.jjodel`, `frontend/src/codegen/oracle/__tests__/exampleFixture.ts`, the
importable test and the import probe). Default viewpoints only (the three views are S-A2). The `.jjodel` is written by
the app's export, never by hand (R9 of the plan). A dev server on a port of your own (not 3000, 3001, 3003); stop it at
the end. No critical-zone file.

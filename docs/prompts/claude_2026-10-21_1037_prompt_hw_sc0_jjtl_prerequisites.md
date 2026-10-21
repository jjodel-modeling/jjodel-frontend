# Hardware demonstrator S-C0: two JjTL prerequisites of route B (discovery, then fix)

Prompt-ID: P-2026-10-21-1037
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (JjTL executor; possibly ProjectEditor; two phases)
Status: eseguito 2026-10-21 · lane hw-jjtl · c3f5cb15e · finished by P-2026-10-21-1220 after the context ceiling (discovery 229e822f5) · verifica visiva non applicabile (no UI change)
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1012
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwjjtl`, branch `hw-jjtl`, cut from `hw-demo` at the commit that adds this prompt; it merges back into `hw-demo`, not into the trunk. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link
`frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`. Single phase: the analysis is
done.

## Lane discipline

Every reply opens with `[P-2026-10-21-1037 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Six sessions of this front hit the AM-8 ceiling: read only what you edit and the plan section cited, never whole large
files; send command output to files and read their tails; **commit the code the moment the gates are green**, before
the bench and the docs. No push, no merge. Do not name the industrial partner in any file: the repository is public.

## Context

The plan is `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` on branch `hw-demo` (P-2026-10-21-0950 and
-1012). Alfonso ratified its recommendations on 2026-10-21 at 10:32 («ok alle raccomandazioni»): the waves of §10.2,
route A in the demo, route B after the demo minimum, the CPU shipped under `frontend/public/examples/hw/`, no push of
`hw-demo` before S-E is green. This lane is slice **S-C0** of §10.1: read §8 (verdicts) and the §10.1 entry of
S-C0 first; that entry is the specification (files, content, tests, dependencies). Wave 1 runs S-D0, S-A1 and S-C0
in parallel on disjoint files.

## COME

Baseline typecheck (expected 0) through `node scripts/run-quiet.mjs`. Gates: typecheck 0; the vitest folders that
cover your files plus `src/jjel src/codegen src/model src/jjtl` (the merge gate runs the whole suite), green but the
known import failures of CLAUDE.md §17; `npm run build`. Code commit(s) with gates and mutation-bench killers in the
body, then one docs closure commit: Status line, one entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy,
`Causa: —` when `Corregge: —`, Notes at most 500 characters), `npm run check:docs` green. `git add` by path, `Model:`
trailer. A decisions row, if the slice needs one, uses the header vocabulary `evidence: measured|read|inferred`,
`verified: agent|none|probe`, `reversible: branch|trunk|persisted` (check with `npm run -s docs:digest`).

## Phases

The S-C0 entry asks Phase 1 first. Phase 1: reproduce F4 (a binding's member access through a source `{__ref}` reads
null) as a failing executed test, and run the containment write-back probe of §4.3; write the findings in
`docs/discovery/discovery_2026-10-21_hw_jjtl_prerequisites.md`.
Then, without a stop, Phase 2 for F4 only (`frontend/src/jjtl/executor/executor.ts` and its test), since its fix is
local and named by the plan. If the write-back probe fails, do not fix `ProjectEditor.tsx` in this lane: report the
fix with its Layer Impact Report and end with `Outcome: question` and a `Recommended:` line.

## DOVE and NON FARE

`frontend/src/jjtl/executor/executor.ts`, a new test under `frontend/src/jjtl/executor/__tests__/`, a scratch probe
under `frontend/scripts/probe/` (not committed unless it becomes a regression probe), the discovery file above. No
change to the partner's metamodel (route B's `VerilogAst` is S-C1, and its source file stays outside the repository).

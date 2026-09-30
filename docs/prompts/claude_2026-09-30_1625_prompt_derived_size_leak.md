# Prompt: Phase 1 and 2 in cascade, a node keeps the derived size back in the default viewpoint

Prompt-ID: P-2026-09-30-1625
Chat: C-2026-09-30-1458
Lane: Phase 1 then Phase 2 in cascade (critical zone possible; Layer Impact Report before any edit there; go-ahead RC-30 given at launch). Tier: heavy.
Status: eseguito 2026-09-30 · lane derived-size-leak · 580f75377, 92d0d5f0a · non fuso: hard-stop, lane probe on 3081 (light) 12/17 on ee5cd0792 then 22/22, the four demo scenes 0 px, mutation bench 9/9, crops in frontend/scripts/smoke/_tmp_sizeleak_crops/ (gitignored), verifica visiva alla chat

Worktree: `~/jjodel-w-sizeleak`, branch `derived-size-leak`, created from the trunk `alfonso-frontend-jjtl` at `ecbc0e92c`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-sizeleak`, branch `derived-size-leak`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Found by the A2 lane (P-2026-09-30-1521, branch `viewpoint-notations`, report `docs/discovery/` of that branch), probe on 3081, light theme: after showing a derived viewpoint and switching back to the default one, nodes keep the derived size. Measured: DemoPetri's places stay 66×66 instead of 200×78; DemoFlowB's `d1` stays 54×66 instead of 200×50. The lane attributes it to notations older than A2 (the R-VP-16 circle, already on the trunk, and the ISO diamond, on the branch). A presenter at MODELS would see it after «Derive viewpoint» and a return to the default viewpoint.

1. Reproduce on the trunk with the R-VP-16 Petri notation (DemoPetri: «Derive viewpoint», show it, back to the default viewpoint). Establish where the derived size is written and why the default viewpoint reads it: a size stored per node and not per view or viewpoint, the content-size derivation of `useContentSize.ts` kept in session (R-IRN, «la taglia derivata resta in sessione»), or `isResized`.
2. Fix: the size a node gets under a view of a viewpoint never leaks into another viewpoint; back in the default viewpoint every node has the size it had before the derived one was shown. A size a human chose (`isResized`) keeps its precedence where it was set. No change to the stored model beyond what the fix needs; if the fix changes what is persisted, say so and stop with `Outcome: question`.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_derived_size_leak.md`, the reproduction, the root cause with file and line, the Layer Impact Report if the critical zone is involved, questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless a question has no single recommendation, or the fix touches `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts` beyond what the report names.

Phase 2: the files the report names, their tests; a log entry in `docs/log-inbox/views.md`, this prompt's Status.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` and the size contract (`shapeRegistry.ts`, `viewpoint/ir/useContentSize.ts`).
2. Reproduce with `lane-run probe` on a free port (not 3000, 3001, 3003), light theme, isolated profile; report, committed.
3. Tests first: sizes in the default viewpoint equal before and after a derived viewpoint is shown, for DemoPetri; a resized node keeps its size. Mutation bench on the fix; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: the probe before and after, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_sizeleak_crops/`; the four demo scenes in the default viewpoint 0 px from `ecbc0e92c`.
6. Commits: `fix:` code and tests, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

A2 report on branch `viewpoint-notations` (`9ed06f9cd`), `git show viewpoint-notations:docs/discovery/` (grep a2); R-VP-16; `useContentSize.ts`; `shapeRegistry.ts`.

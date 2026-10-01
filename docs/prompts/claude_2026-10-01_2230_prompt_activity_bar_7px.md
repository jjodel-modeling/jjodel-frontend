# Prompt: Phase 1 and 2 in cascade, the Activity (UML) fork and join bar declared 7 px

Prompt-ID: P-2026-10-01-2230
Chat: C-2026-10-01-2220
Lane: Phase 1 then Phase 2 in cascade, outside the critical zone. Tier: light.
Status: da eseguire
Worktree: `~/jjodel-w-forkbar`, branch `activity-bar-7`, created from the trunk at `ac3890b7e`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-forkbar`, branch `activity-bar-7`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

The 2026-09-30 checkpoint asked Alfonso: «Fork/join bar declared 5 px draws 3 px (1 px border each side). Keep 5 or 7?». His answer, 2026-10-01 about 22:25 (verbatim): «7».

The Activity (UML) fork and join bar gets `defaultSize` 7×120 instead of 5×120 (`ACTIVITY_BAR_SIZE`, `viewpointDerivation.ts:778`). The height, the fill, the border and everything else in the notation stay as they are. The classic Petri bar (`CLASSIC_BAR_SIZE`, R-VP-24) does not change. On the 2026-09-30 measure the bar painted 3×118 at the declared 5×120, so the expected painted bar is 5×118: measure it, do not assume it.

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-10-01_activity_bar_7px.md` with: the callers of `ACTIVITY_BAR_SIZE`; every test that pins 5×120; whether a derived viewpoint already saved (DemoFlowB in the demo scenes, Alfonso's projects) stores the size in its documents, so that it keeps 5 until re-derived, or reads it at render; what makes the MODELS demo show 7. Questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, or showing 7 in the demo needs an edit to a scene file, a persisted project or a migration: then stop with `Outcome: hard-stop` and the options.

Phase 2: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (the constant and the two comments that say 5, lines 775 and 796), `frontend/src/components/editor-v2/viewpoint/derive/__tests__/activityUml.test.ts` and any other test the report names as pinning 5×120. Docs: the report, one row in `docs/decisions.md`, a log entry in `docs/log-inbox/views.md`, this prompt's Status. Anything else: stop and ask.

The decision row is **R-VP-36** (ratified by Alfonso 2026-10-01, evidence: measured, reversible: branch), amending R-VP-26 (2) on the bar thickness only. The trunk ends at R-VP-35. The unmerged branch `viewpoint-colors-pastel` carries its own R-VP-32..34, in collision with the trunk's R-VP-32..35; it renumbers at its own trunk sync, after 36. Do not touch that branch, and do not edit the text of R-VP-26 (add-only).

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-24..26, and the reports `docs/discovery/discovery_2026-09-30_activity_uml_notation.md` and `docs/discovery/discovery_2026-09-30_activity_sizes.md`.
2. Phase 1 report, committed.
3. Tests first: the derived Activity (UML) documents declare the bar 7×120; red before the change, green after. Mutation bench on the constant (5, 6, 8, the height); report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme only. DemoFlowB on Activity (UML), re-derived if the stored view keeps 5: from the DOM, the node width and the painted bar width and height of the fork and of the join. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_forkbar_crops/` (gitignored), one of the fork and one of the join with their neighbours. The four demo scenes in the default viewpoint: 0 px from `ac3890b7e`.
6. Commits: `fix:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the questions adopted. The merge waits for Alfonso's visual GO: it changes what the demo shows.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property, changing the default viewpoint.

## RIFERIMENTI

R-VP-26 (2) and the limits paragraph; `viewpointDerivation.ts:775-796`; report `discovery_2026-09-30_activity_sizes.md` (the 24 px floor removed for declared sizes); `discovery_2026-09-30_activity_decision_merge.md` H9 (fork and join identical at rest, painted 3×118).

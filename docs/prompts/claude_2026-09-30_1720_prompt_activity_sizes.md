# Prompt: Phase 1 and 2 in cascade, sizes and markers for the Activity (UML) and classic Petri symbols

Prompt-ID: P-2026-09-30-1720
Chat: C-2026-09-30-1458
Lane: Phase 1 then Phase 2 in cascade (critical zone possible; Layer Impact Report before any edit there; go-ahead RC-30 given at launch). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of the Activity (UML) lane (P-2026-09-30-1552, `21345bbba`), not merged, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

The Activity (UML) lane stopped with a mismatch table and a single recommendation, adopted by the chat under RC-21 (Alfonso approved the mockup these sizes come from, 2026-09-30, «il nuovo mockup UML activity è ottimo»):

| Element | Asked | Drawn | Cause |
|---|---|---|---|
| Fork/join bar | 5 px thick | 24 px node, 22 visible | 24 px size floor, `nodes/nodeSizing.ts:73` |
| Initial dot | 20 px | 24 | same floor |
| Bull's-eye inner disc | 14 px | about 7 px | the registry's `dot` marker |
| Action corner radius | 14 | 10.5 | render clamp to a quarter of the box height |

Recommended by the lane: one lane that names `nodes/nodeSizing.ts` and `markerRegistry.ts`: the bar with no size floor, small circles at 12 px minimum, a larger bull's-eye disc; the documents already derived then draw as specified without being re-derived. The classic Petri bars (R-VP-24) redraw at their specified 10 px as a consequence.

1. Remove the floor only for the shapes that declare their own size in the IR (the `bar` form, the initial dot, the bull's-eye), never for native nodes or IR views without a declared size: the default viewpoint must stay byte-identical.
2. The bull's-eye inner disc at 14 px on a 24 px outer circle (a marker size or a new optional marker, whichever the registry supports; report which).
3. The corner radius clamp: keep the clamp but at half the box height (radius 14 on a 44 px action), unless the report shows it changes an existing view; then leave it and say so.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_activity_sizes.md`, Layer Impact Report first, the callers of the floor and of the clamp, what else would move, questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless a question has no single recommendation, or the default viewpoint would change.

Phase 2: `nodes/nodeSizing.ts`, `markerRegistry.ts`, the file that clamps the radius (report names it), their tests; a log entry in `docs/log-inbox/views.md`, this prompt's Status. Anything else: stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-15..26, the Activity (UML) report §6.
2. Phase 1 report, committed.
3. Tests first: bar 5 px, initial 20 px, bull's-eye 24/14, action radius 14 on the Activity (UML) views of DemoFlowB; classic Petri bars 10 px; every native node and every IR view without a declared size unchanged. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: DemoFlowB as Activity (UML), DemoPetri as Petri net (classic); crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_actsize_crops/`; the four demo scenes in the default viewpoint 0 px from `21345bbba`.
6. Commits: `fix:` code and tests, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property, changing the default viewpoint.

## RIFERIMENTI

Activity (UML) report §6 (`21345bbba`); `nodes/nodeSizing.ts:73`; `markerRegistry.ts`; design canvas row «DemoFlowB · UML activity».

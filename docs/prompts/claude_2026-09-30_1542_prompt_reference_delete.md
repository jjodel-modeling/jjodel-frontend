# Prompt: Phase 1 and 2 in cascade, references (edges) cannot be deleted

Prompt-ID: P-2026-09-30-1542
Chat: C-2026-09-30-1458
Lane: Phase 1 then Phase 2 in cascade (critical zone possible: `useJjomSync.ts`, `canvasToJjom.ts`; Layer Impact Report before any edit there; go-ahead RC-30 given at launch). Tier: heavy.
Status: eseguito 2026-09-30 · lane reference-delete · c820dbb51 · verifica visiva passata 2026-09-30 (GO by the chat C-2026-09-30-1458, RC-23 on the lane probe)

Worktree: `~/jjodel-w-refdelete`, branch `reference-delete`, created from the trunk at `ecbc0e92c`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-refdelete`, branch `reference-delete`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-09-30, verbatim: «le reference (edge) non si riescono a cancellare». No more detail: the lane establishes where and how. Scope of the reproduction, light theme, a fresh project: on the M2 canvas (editor v2) a reference edge between two classes, and on an M1 canvas a link edge between two objects; for each, every delete path the UI offers: select the edge and press Delete and Backspace, the edge's context menu, the Properties rail, the tree row of the reference or link. Record for each path what happens in the canvas, in the tree and in the model (`idlookup`), and whether undo restores it. If one path fails, bisect it (`git bisect` in this worktree, known-good candidates `3.0.0` then the commits of 2026-09-27 `5dc09a4ce` and `1b40eacd0`, «metamodel canvas refuses connections to non-class nodes», and `no model write or DEdge for a non-class edge end`) and name the first bad commit.

Fix: a reference or link deleted by any path listed above disappears from canvas, tree and model in one undo step; nothing else changes.

## DOVE

Phase 1 (read-only apart from the bisect, which leaves the worktree at the branch tip): report `docs/discovery/discovery_2026-09-30_reference_delete.md` with the matrix of paths × levels, the first bad commit, the root cause with file and line, the Layer Impact Report if the fix touches the critical zone, questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation, or the fix touches a file outside the ones the report names as the cause and its test.

Phase 2: the files the report names, their tests; a log entry in `docs/log-inbox/` (the inbox of editor-v2 or views, grep which), this prompt's Status.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34.
2. Reproduce with a `lane-run probe` on a free port (not 3000, 3001, 3003), Playwright, isolated profile; bisect; report, committed.
3. Tests first: the failing path(s) deleted in model and canvas, one undo step, the other paths unchanged. Mutation bench on the fix; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: the probe again, before and after, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_refdelete_crops/`; the four demo scenes in the default viewpoint unchanged.
6. Commits: `fix:` code and tests, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the matrix, the first bad commit, the mutation score, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except `git bisect reset`), `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

`5dc09a4ce`, `1b40eacd0` (2026-09-27, the enum edge guard); the commit «no model write or DEdge for a non-class edge end» (grep); `frontend/src/components/editor-v2/`.

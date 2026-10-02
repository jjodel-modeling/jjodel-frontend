# Prompt: Phase 1 and 2 in cascade, sync the trunk into edge-ends (slice E) before its merge

Prompt-ID: P-2026-10-02-1505
Chat: C-2026-10-01-2220
Lane: Phase 1 then Phase 2 in cascade, a trunk sync with code conflicts resolved on the branch (RC-14); stop before the critical zone. Tier: heavy. Time limit: 90 min.
Status: da eseguire
Worktree: `~/jjodel-w-edgeends`, branch `edge-ends` at `633c22a8c` plus the docs commit that added this prompt, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-edgeends`, branch `edge-ends`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Slice E (P-2026-09-30-1810: edge ends, seven glyphs, Conditional ends, end roles) waited at hard-stop for Alfonso's GO; he gave it on 2026-10-02 («GO»), and it goes into 3.1 before the merge freeze of 2026-10-07. The branch is 5 commits ahead and 172 behind the trunk `alfonso-frontend-jjtl` (tip `c3a9c9ffd` at 15:01). Measured by the chat with `git merge-tree`: conflicts in `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` and `docs/log-inbox/views.md`. Since the branch was cut, the trunk took among others: the edge-click-properties merge, the update-depth fix in `EditorV2.tsx` (setEdges keeps edges, `CanvasErrorBoundary`), the Activity decision/merge notation (R-VP-32..35), the fork bar at 7 px (R-VP-36), the staging merge (#157, #158), the JjScript Run lanes. The goal: `edge-ends` = trunk plus slice E, both intents kept, gates at baseline.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md`, opening with `## 0. Answer in brief` (at most 40 lines): the merge base; for each conflicted file, the trunk side's intent and the branch side's intent (`git log -p <base>..<side> -- <file>`), and the resolution hunk by hunk; files changed on both sides that auto-merge, with their risk; whether a resolution touches the critical zone (`CLAUDE.md` §3.2, e.g. `portDistribution.ts`, `useJjomSync.ts`); questions with `Recommended:`. Commit it (`docs:`) and go on in cascade unless a question has no single recommendation or a resolution touches the critical zone: then `Outcome: question`.

Phase 2, in this worktree only: `git merge --no-ff alfonso-frontend-jjtl` (message from a file under `frontend/scripts/smoke/_tmp_ee_sync_msg.txt`, gitignored, removed after; subject `merge: alfonso-frontend-jjtl into edge-ends (P-2026-10-02-1505)`); the log by the union rule; the two code files as the report says; any further semantic fix in a separate `fix:` commit after the merge. Docs: the report's addendum, a log entry in `docs/log-inbox/views.md`, this prompt's Status. Anything else: stop and ask.

## COME

1. Read `CLAUDE.md` (§3, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P13, P14, P16, RC-13, RC-14, RC-22, RC-26, RC-34; the slice E report (`docs/discovery/` of P-2026-09-30-1810) and its R-EE rows.
2. Phase 1 report, committed.
3. Merge and resolve.
4. Gates, each in the foreground: typecheck (the known 14 of the trunk tip), full vitest (the known 9 red at import; a red file: re-run it alone before judging, the Mac is often loaded), build exit 0, `check:docs`, `check:addonly --range c3a9c9ffd..HEAD`. Re-run slice E's own tests and its mutation bench; report the score.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme only: the four demo scenes in the default viewpoint 0 px from `c3a9c9ffd`; slice E's own probe re-run on the merged tree (the seven glyphs, Conditional ends, end roles) and the Activity (UML) view of DemoFlowB (open arrowheads, the 7 px bar unchanged); crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_ee_sync_crops/` (gitignored).
6. Commits by explicit path. Stop with `Outcome: hard-stop`, the shas, the gates, the probe results, the questions adopted. The chat merges `edge-ends` into the trunk after its check.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `--force`, push, rebase, squash, a commit on any branch but `edge-ends`, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property, changing the default viewpoint.

## RIFERIMENTI

`633c22a8c` (slice E docs), `462fba92d`, `8f3e7c307`; trunk tip `c3a9c9ffd`; `sessione_CORRENTE.md` section C-2026-10-01-2220.

# Prompt: Phase 1 and 2 in cascade, sync the trunk into viewpoint-colors-pastel and renumber its decision rows

Prompt-ID: P-2026-10-02-1506
Chat: C-2026-10-01-2220
Lane: Phase 1 then Phase 2 in cascade, a trunk sync on the branch (RC-14), docs conflicts only as measured, outside the critical zone. Tier: heavy. Time limit: 90 min.
Status: eseguito 2026-10-02 · lane viewpoint-colors-pastel · 48abe2b94, 68c3f8251, 25ed824fb · non fuso: hard-stop, rows R-VP-37..39, lane probe on 3151 (light) 60/60, the four demo scenes 0 px from c3a9c9ffd, mutation bench 55/59, check:addonly red on the merge only (194, structural), crops in frontend/scripts/smoke/_tmp_vp_sync_crops/ (gitignored), verifica visiva alla chat
Worktree: `~/jjodel-w-vppastel`, branch `viewpoint-colors-pastel` at `7d1882c5f` plus the docs commit that added this prompt, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-vppastel`, branch `viewpoint-colors-pastel`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

The pastel metaclass colours (P-2026-09-30-2022: twelve pastel swatches, per-class overrides, reference-aware assignment, rows R-VP-32..34) waited for Alfonso's GO; he gave it on 2026-10-02 («GO»). The branch is 4 commits ahead and 145 behind the trunk `alfonso-frontend-jjtl` (tip `c3a9c9ffd` at 15:01). Measured by the chat with `git merge-tree`: conflicts in `docs/decisions.md` and `docs/log-inbox/views.md`. The decisions conflict hides an id collision: the branch's R-VP-32, R-VP-33, R-VP-34 are different decisions from the trunk's R-VP-32..35 (Activity decision/merge, P-2026-09-30-1935) and R-VP-36 (fork bar at 7 px, P-2026-10-01-2230). The goal: the branch = trunk plus the pastel work, its three rows renumbered to the next free ids on the trunk, every reference to them updated, gates at baseline.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-10-02_pastel_trunk_sync.md`, opening with `## 0. Answer in brief` (at most 40 lines): the merge base; the highest R-VP id on the trunk tip and on every other local branch (`git branch --list`, `git show <b>:docs/decisions.md`), so the new ids collide with nothing known; the mapping old id to new id (expected R-VP-37..39 if nothing else took them); every place on the branch that cites R-VP-32..34 with the pastel meaning (`git grep` on the branch: decisions, report, log entry, prompt, code comments, tests); files changed on both sides that auto-merge, with their risk (the viewpoint panel and `metaclassColoring` touched by the trunk's «Color by metaclass» rework); questions with `Recommended:`. Commit it (`docs:`) and go on in cascade unless a question has no single recommendation: then `Outcome: question`.

Phase 2, in this worktree only: `git merge --no-ff alfonso-frontend-jjtl` (message from a file under `frontend/scripts/smoke/_tmp_vp_sync_msg.txt`, gitignored, removed after; subject `merge: alfonso-frontend-jjtl into viewpoint-colors-pastel (P-2026-10-02-1506)`); in `docs/decisions.md` keep the trunk's rows verbatim and place the branch's three rows under their new ids; the log by the union rule. Then one `docs:` commit that renumbers the branch's own citations (report, entry, prompt Status, comments) to the new ids, and one `fix:` commit only if a code comment or test name cites the old id. Add-only rule: rows already on the trunk are never edited; the branch's rows were never on the trunk, so renaming them here is not an amendment (state this in the commit body). Docs: the report's addendum, a log entry in `docs/log-inbox/views.md`, this prompt's Status. Anything else: stop and ask.

## COME

1. Read `CLAUDE.md` (§3, §5, §6), `docs/PROTOCOL.md` P13, P14, P16, RC-13, RC-14, RC-34; the pastel report and its R-VP rows; R-VP-27..36 on the trunk.
2. Phase 1 report, committed.
3. Merge, renumber, resolve.
4. Gates, each in the foreground: typecheck (the known 14), full vitest (the known 9 red at import; a red file: re-run it alone before judging), build exit 0, `check:docs`, `check:addonly --range c3a9c9ffd..HEAD`. Re-run the pastel tests and mutation bench; report the score.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme only: the four demo scenes in the default viewpoint 0 px from `c3a9c9ffd` with colouring off; the pastel probe of P-2026-09-30-2022 re-run on the merged tree (swatches, per-class override, Reset, contrast); crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_vp_sync_crops/` (gitignored).
6. Commits by explicit path. Stop with `Outcome: hard-stop`, the shas, the new ids, the gates, the probe results. The chat merges the branch into the trunk after its check.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `--force`, push, rebase, squash, a commit on any branch but `viewpoint-colors-pastel`, editing a row that is on the trunk, writes outside this worktree (no `/tmp` either), a call to an AI model, changing the default viewpoint.

## RIFERIMENTI

`7d1882c5f`, `feefa9214`, `f61fc0265` (P-2026-09-30-2022); trunk tip `c3a9c9ffd`; `sessione_CORRENTE.md` section C-2026-10-01-2220 (open item 3).

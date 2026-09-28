# Prompt: a gate that refuses a commit or merge rewriting existing lines of the add-only logs

Prompt-ID: P-2026-09-28-2001
Chat: C-2026-09-28-1936
Lane: fast (scripts only: one new gate, its tests, one call in lane-run; no discovery). Tier: light.
Status: eseguito 2026-09-28 · lane harness · 65b8763a7

Worktree: `~/jjodel-w-addonly`, branch `log-addonly-gate` (cut by the chat from `alfonso-frontend-jjtl` at `247a93549`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-addonly`, branch `log-addonly-gate`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

The staging merge `447e4239b` (a conflict resolution by hand) spliced two entries of `docs/claude-code-log.md`: the tail of P-2026-09-26-2350 replaced the tail of the 2026-09-18 entry. The chat restored both from the parents in `e2448cf61`. `check:docs` saw only the missing fields, not the wrong content, because it checks form, not history. The log is add-only (`CLAUDE.md` about `:648`, R-RAIL-45), and so are the lane inboxes until a batch closure moves them.

Goal: a gate that compares a commit (a merge included) with its first parent and refuses it when an existing line of an add-only file is removed or changed, except for the two legitimate moves:

- **Rotation** (`npm run log:rotate`, `scripts/gates/rotate-log.ts`): lines removed from `docs/claude-code-log.md` are allowed when each appears verbatim in `docs/claude-code-log-archive.md` of the same commit.
- **Batch closure** (`docs/PROTOCOL.md` about `:140`): lines removed from `docs/log-inbox/<lane>.md` (the file emptied or deleted) are allowed when each appears verbatim in `docs/claude-code-log.md` of the same commit.

Everything else in those files may only add lines. Files in scope: `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`, `docs/log-inbox/*.md`.

## DOVE

- A new gate module under `frontend/scripts/gates/` (reuse `log-tools.ts` where it helps; grep the name before choosing it, e.g. `check-addonly.ts`), with an `npm run check:addonly` entry in `frontend/package.json` taking an optional revision (default `HEAD`) and an optional `--range <a>..<b>` that checks every commit of the range, merges against their first parent.
- `frontend/scripts/lane-run.mjs`: `merge` (both `--direct` and the launched merge) runs the gate on the merge commit before it reports success; on a violation it resets the trunk to the pre-merge tip it recorded, prints the offending lines with file and line number, and exits non-zero. Read how `merge` already records the pre-merge state and handles a failed gate, and follow that pattern; do not invent a second rollback path.
- Tests: `frontend/scripts/gates/__tests__/` (the gate) and `frontend/scripts/hooks/__tests__/laneRun.test.ts` (the merge call).
- Closure: `docs/log-inbox/harness.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, §21.2, rule 19, the add-only paragraph), `docs/PROTOCOL.md` P9, P16, RC-20/RC-21 and the batch-closure paragraph, `rotate-log.ts`, `log-tools.ts`, and `lane-run.mjs` `merge`.
2. Tests first (red before, green after):
   - On the real history of this repository: `447e4239b` is refused (it names the spliced lines); `e2448cf61` passes; the rotation `559eb82c5` passes; one real batch-closure commit passes (find one with `git log --diff-filter=D -- docs/log-inbox` and name it in the report).
   - On synthetic fixtures: an added entry passes; a changed character in an old entry is refused; a removed line not present in the archive is refused; a rotation whose archive lacks one moved line is refused; an inbox deleted without its lines in the log is refused; a commit that does not touch the files in scope passes in constant time (no diff of other files).
   - lane-run: a merge whose result violates the gate leaves the trunk at its pre-merge tip and exits non-zero; a clean merge is unchanged.
3. Compare lines as text after stripping trailing whitespace only. A line that moves within the same file (removed at one position, added identical at another) counts as unchanged, so that the newest-first reordering of R-RAIL-45 is not refused. No new dependency.
4. Gates: `typecheck:scripts` exit 0; the vitest of `scripts/hooks` and `scripts/gates` green (counts before and after); `check:docs`; `check:scripts`; `npm run check:addonly -- --range 65eb5475b..HEAD` passes on this branch. A mutation bench on the new code, as the harness lanes do. `check:agents` and `log:rotate` need node ≥ 22 (`~/.nvm/versions/node/v23.3.0`).
5. Commits: `feat(harness): check:addonly refuses rewrites of the add-only logs, lane-run merge runs it (P-2026-09-28-2001)`, then one docs commit with the log entry in `docs/log-inbox/harness.md` and this prompt's Status. Do not edit `docs/PROTOCOL.md` or `CLAUDE.md` (governance: the chat adds the rule on the trunk after the merge).
6. Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the test counts, and the batch-closure commit used in the tests.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` outside the tested rollback path of `merge`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, any file under `frontend/src`.

## RIFERIMENTI

- The incident: `447e4239b` (staging merge), `e2448cf61` (the repair), `559eb82c5` (the rotation to 40 entries); `sessione_2026-09-28_3.md`, «Bugs and incidents».
- `docs/PROTOCOL.md` P9, P16, RC-20, RC-21, batch closure; `CLAUDE.md` add-only paragraph (R-RAIL-45).

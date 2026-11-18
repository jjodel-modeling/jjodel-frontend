# Prompt: merge lost-link-fix into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-09-1420
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-09 · lane merge · cbd3d6115 · verifica visiva passata 2026-11-09 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-1420 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7571f8a53`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `lost-link-fix` into the trunk with one merge commit, `--no-ff`, of the explicit sha `1070a45a1`, in the shape of `b103b2481` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7571f8a53`. The branch carries, on top of the base, 18 commits:

- `1070a45a1` docs(dcn): Status flip of the trunk merge and its gates (P-2026-11-09-1358)
- `20f2dcfb9` docs(dcn): prompt for the gates on the trunk merge into lost-link-fix (P-2026-11-09-1358)
- `067e796bc` merge: lost-link-fix takes alfonso-frontend-jjtl (P-2026-11-09-1347)
- `f2ac2d722` docs: add prompt P-2026-11-09-1347, merge alfonso-frontend-jjtl into lost-link-fix
- `646c78b89` docs(dcn): close the queued appends fix, entry and status (P-2026-11-09-1323)
- `3b7e06289` docs(dcn): LIR measures, two drops before and after (P-2026-11-09-1323)
- `d3f989d5c` docs(dcn): prompt to close the queued appends fix (P-2026-11-09-1323)
- `0971567bb` test(editor-v2): landed entry in flight, every slot settled (P-2026-11-09-1227)
- `c3eabab15` test(dcn): arms keep both writes, two real drops (P-2026-11-09-1227)
- `3d567c77a` fix(editor-v2): queue slot appends so a burst keeps every write (P-2026-11-09-1227)
- `f9b8f2e2a` feat(editor-v2): queue of slot appends not yet in the store (P-2026-11-09-1227)
- `6b66f67ad` docs(dcn): Layer Impact Report of the queued appends (P-2026-11-09-1227)
- `f840dac52` docs(dcn): prompt for the queued appends fix (P-2026-11-09-1227)
- `95dbfaacb` docs(dcn): Status of the lost containment discovery prompt (P-2026-11-09-1020)
- `08ee13b31` docs(dcn): Status flip of the lost containment discovery (P-2026-11-09-1020)
- `b7b4817b1` docs(dcn): lost containment write discovery (P-2026-11-09-1020)
- `780b0b99e` test(dcn): probe of the lost containment write (P-2026-11-09-1020)
- `285600ecb` docs(dcn): prompt P-2026-11-09-1020

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-09 14:20, trunk at `7571f8a53`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1070a45a1`: zero conflicts.
- Files changed since the base: 14 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 7571f8a53 1070a45a1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-09_1020_prompt_lost_containment_discovery.md` (eseguito 2026-11-09 · lane discovery · b7b4817b1), `claude_2026-11-09_1227_prompt_lost_link_fix.md` (eseguito 2026-11-09 · lane lost-link-fix · 0971567bb), `claude_2026-11-09_1323_prompt_lost_link_fix_close.md` (eseguito 2026-11-09 · lane lost-link-fix · 3b7e06289), `claude_2026-11-09_1347_prompt_lost-link-fix_take_trunk.md` (eseguito 2026-11-09 · lane lost-link-fix · 067e796bc), `claude_2026-11-09_1358_prompt_lost_link_fix_merge_gates.md` (eseguito 2026-11-09 · lane lost-link-fix · 067e796bc).
- `git worktree list`: `lost-link-fix` in `/Users/alfonso/jjodel-w-lostfix`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `1070a45a1` is the tip of `lost-link-fix`; the prompt files of the branch read `Status: eseguito` at `1070a45a1`; `git worktree list` shows `lost-link-fix` only in `/Users/alfonso/jjodel-w-lostfix`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 1070a45a1` (measured above: zero conflicts). `git diff --name-only 7571f8a53 1070a45a1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7571f8a53 alfonso-frontend-jjtl` with `git diff --name-only 7571f8a53 1070a45a1` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — fix: queued slot appends keep every write of a burst (P-2026-11-09-1227, P-2026-11-09-1323)` once (branch).
4. `git merge --no-ff --no-commit 1070a45a1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lost-link-fix into alfonso-frontend-jjtl (P-2026-11-09-1420)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `1070a45a1` in `/Users/alfonso/jjodel-w-lostfix`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-lostfix`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7571f8a53` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 7571f8a53 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the lost-link-fix merge (P-2026-11-09-1420)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-lostfix`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

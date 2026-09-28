# Prompt: merge sim-multi-roles-p2 into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-29-0105
Chat: C-2026-09-28-1936
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-29-0105 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `b6e9d82ef`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-multi-roles-p2` into the trunk with one merge commit, `--no-ff`, of the explicit sha `aa6b0897c`, in the shape of `27f3f7c25` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `024d95345`. The branch carries, on top of the base, 6 commits:

- `aa6b0897c` docs: log entry, ticket and Status flip for R-SIM-90 Phase 2 (P-2026-09-29-0010)
- `9ab66e047` feat(sim): the roles dialog binds several attributes as tags (R-SIM-90) (P-2026-09-29-0010)
- `2fbb1fa97` feat(sim): verdicts per attribute, the role takes the worst (R-SIM-90) (P-2026-09-29-0010)
- `1bb05b781` feat(sim): the engine reads every attribute of the four roles (R-SIM-90) (P-2026-09-29-0010)
- `c6e28f893` feat(sim): multi-valued role codec and NetStc lists (R-SIM-90) (P-2026-09-29-0010)
- `431e3b6b3` docs(prompts): P-2026-09-29-0010 R-SIM-90 Phase 2

The trunk carries, since the base, 10 commits:

- `b6e9d82ef` docs: Status flip and log entry for the harness-reds-repairs merge (P-2026-09-29-0029)
- `27f3f7c25` merge: harness-reds-repairs into alfonso-frontend-jjtl (P-2026-09-29-0029)
- `34cd16881` docs: add prompt P-2026-09-29-0029, merge harness-reds-repairs into alfonso-frontend-jjtl
- `2ed46699c` docs: log entry and Status for the light-model step (P-2026-09-28-2332)
- `d5d2b7d49` fix(harness): light tier runs claude-sonnet-5-5, RC-32 (P-2026-09-28-2332)
- `36dc4f165` docs: log entry and Status flip for the harness reds (P-2026-09-28-2332)
- `6f43d630b` fix(harness): check:addonly exempts known repairs (P-2026-09-28-2332)
- `3c22f4521` fix(harness): pin the checkRange test to fixed commits (P-2026-09-28-2332)
- `c2e861e31` fix(harness): spawn the TS gates with strip-types flags (P-2026-09-28-2332)
- `68399c96e` docs(prompts): P-2026-09-28-2332 harness reds and known repairs

Measured by `lane-run merge` at 2026-09-29 01:05, trunk at `b6e9d82ef`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl aa6b0897c`: zero conflicts.
- Files changed since the base: 18 on the branch side, 9 on the trunk side; on both sides: none.
- `git diff --name-only 024d95345 aa6b0897c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-29_0010_prompt_sim_multi_roles_p2.md` (eseguito 2026-09-29 · lane sim-multi-roles-p2 · c6e28f893, 1bb05b781, 2fbb1fa97, 9ab66e047 · non fuso: hard-stop, crop in docs/discovery/harness/_tmp_multi_*.png (gitignored), le quattro scene le sonda la chat).
- `git worktree list`: `sim-multi-roles-p2` in `/Users/alfonso/jjodel-w-multi2`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-29-0105/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `aa6b0897c` is the tip of `sim-multi-roles-p2`; the prompt files of the branch read `Status: eseguito` at `aa6b0897c`; `git worktree list` shows `sim-multi-roles-p2` only in `/Users/alfonso/jjodel-w-multi2`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl aa6b0897c` (measured above: zero conflicts). `git diff --name-only 024d95345 aa6b0897c -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 024d95345 alfonso-frontend-jjtl` with `git diff --name-only 024d95345 aa6b0897c` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — feat: Entry, Exit, Action and Guard multi-valued, R-SIM-90 Phase 2 (P-2026-09-29-0010)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-29 — ticket: the problems dedup reads only the first Guard or Action attribute` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — fix: the six known vitest reds and the known-repairs list of check:addonly (P-2026-09-28-2332)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — fix: light tier runs claude-sonnet-5-5, RC-32 (P-2026-09-28-2332)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-29 — merge: harness-reds-repairs into alfonso-frontend-jjtl (P-2026-09-29-0029)` once (trunk).
4. `git merge --no-ff --no-commit aa6b0897c`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-multi-roles-p2 into alfonso-frontend-jjtl (P-2026-09-29-0105)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `aa6b0897c` in `/Users/alfonso/jjodel-w-multi2`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard b6e9d82ef` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-multi-roles-p2 merge (P-2026-09-29-0105)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-multi2`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

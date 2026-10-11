# Prompt: merge firstshot-time-axis into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1152
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1152 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cbbc1a204`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `firstshot-time-axis` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7d7ba62e5`, in the shape of `bcffa0c76` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ef42d3596`. The branch carries, on top of the base, 3 commits:

- `7d7ba62e5` docs: Status flip and log entry for first-shot on the time axis (P-2026-10-11-1138)
- `3f5e33827` feat(harness): first-shot squares on the time axis (P-2026-10-11-1138)
- `35974e80f` docs: prompt for first-shot squares on the time axis (P-2026-10-11-1138)

The trunk carries, since the base, 5 commits:

- `cbbc1a204` docs(prompts): lane board Insights, more cards, discovery (P-2026-10-11-1150)
- `e47e456b1` docs(prompts): Front line for P-2026-10-11-1145
- `3e2a0ac34` docs(prompts): JjScript do-block follow-ups, lane auto (P-2026-10-11-1145)
- `8432b808f` docs(prompts): Status flip, P-2026-10-10-0045 and P-2026-10-10-0810
- `8bf53414a` docs: Status flip and log entry for the do-freeze merge (P-2026-10-11-0034)

Measured by `lane-run merge` at 2026-10-11 11:52, trunk at `cbbc1a204`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7d7ba62e5`: zero conflicts.
- Files changed since the base: 4 on the branch side, 6 on the trunk side; on both sides: none.
- `git diff --name-only ef42d3596 7d7ba62e5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-11_1138_prompt_firstshot_time_axis.md` (eseguito 2026-10-11, lane P-2026-10-11-1138 (firstshot-time-axis, 3f5e33827); visual check passed (chat, built-in browser on 4702, RC-23)).
- `git worktree list`: `firstshot-time-axis` in `/Users/alfonso/jjodel-w-fstime`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1152/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7d7ba62e5` is the tip of `firstshot-time-axis`; the prompt files of the branch read `Status: eseguito` at `7d7ba62e5`; `git worktree list` shows `firstshot-time-axis` only in `/Users/alfonso/jjodel-w-fstime`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7d7ba62e5` (measured above: zero conflicts). `git diff --name-only ef42d3596 7d7ba62e5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ef42d3596 alfonso-frontend-jjtl` with `git diff --name-only ef42d3596 7d7ba62e5` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): first-shot squares on the time axis (P-2026-10-11-1138)` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — merge: do-freeze into alfonso-frontend-jjtl (P-2026-10-11-0034)` once (trunk).
4. `git merge --no-ff --no-commit 7d7ba62e5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: firstshot-time-axis into alfonso-frontend-jjtl (P-2026-10-11-1152)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7d7ba62e5` in `/Users/alfonso/jjodel-w-fstime`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cbbc1a204` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the firstshot-time-axis merge (P-2026-10-11-1152)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-fstime`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

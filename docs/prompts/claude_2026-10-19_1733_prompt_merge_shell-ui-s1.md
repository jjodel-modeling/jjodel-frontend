# Prompt: merge shell-ui-s1 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-19-1733
Chat: —
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-19 · lane merge · c82bfedde · gates green except vitest; verifica visiva passata 2026-10-19 (Alfonso on 3001); closed by hand: the worker stopped on vitest, red on the receiving tip before the merge (laneTracking, fronts without milestone, fixed by 7a9d1610e); the full suite on 7a9d1610e then showed the R-SHELL header reds, fixed by the commit before this one; closure approved by Alfonso in chat 2026-10-19

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-19-1733 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `124e479c6`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `shell-ui-s1` into the trunk with one merge commit, `--no-ff`, of the explicit sha `06138110d`, in the shape of `124e479c6` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `084c67fcd`. The branch carries, on top of the base, 4 commits:

- `06138110d` docs: log shell S1 tokens and data-mode, flip prompt Status (P-2026-10-19-1725)
- `5aea38269` feat(shell): shell token layer and html data-mode (P-2026-10-19-1725)
- `b846d0dfa` docs: add prompt P-2026-10-19-1725, shell S1 tokens and data-mode
- `595857304` docs(discovery): shell visual consolidation, Phase 1 (P-2026-10-19-1710)

The trunk carries, since the base, 7 commits:

- `124e479c6` merge: s4d-sweep into alfonso-frontend-jjtl (P-2026-10-19-1716)
- `19f22dda7` docs: add prompt P-2026-10-19-1716, merge s4d-sweep into alfonso-frontend-jjtl
- `b90416442` docs: Status flip of P-2026-10-19-1655 (Tack slice 6 continuation)
- `1aa42cc25` merge: tack-s6, Tack slice 6 layers 2-3, Jjodel importer and parity (P-2026-10-19-1620, P-2026-10-19-1655)
- `35ae04d0c` docs: Status flip and log entry, Tack slice 6, P-2026-10-19-1620 (P-2026-10-19-1655)
- `6f0353e74` feat(tack): slice 6 layers 2-3, importer, parity, P-2026-10-19-1620 (P-2026-10-19-1655)
- `0b2fe67f2` docs: S4d sweep, Status of stale prompts classified and flipped (P-2026-10-19-1022)

Measured by `lane-run merge` at 2026-10-19 17:33, trunk at `124e479c6`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 06138110d`: zero conflicts.
- Files changed since the base: 7 on the branch side, 40 on the trunk side; on both sides: none.
- `git diff --name-only 084c67fcd 06138110d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-19_1725_prompt_shell_ui_s1_tokens_mode.md` (eseguito 2026-10-19 · lane shell-ui · code 5aea38269, docs commit carrying this line · done, dev server 3011 left running for the DOM check).
- `git worktree list`: `shell-ui-s1` in `/Users/alfonso/jjodel-w-shellui-s1`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-19-1733/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `06138110d` is the tip of `shell-ui-s1`; the prompt files of the branch read `Status: eseguito` at `06138110d`; `git worktree list` shows `shell-ui-s1` only in `/Users/alfonso/jjodel-w-shellui-s1`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 06138110d` (measured above: zero conflicts). `git diff --name-only 084c67fcd 06138110d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 084c67fcd alfonso-frontend-jjtl` with `git diff --name-only 084c67fcd 06138110d` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — discovery: shell visual consolidation, Phase 1` once (branch).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: shell token layer and html data-mode (S1)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — chore(harness): S4d sweep, six stale prompts classified, one flipped (P-2026-10-19-1022)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 6, layers 2 and 3, Jjodel log importer, lane-run adapter, parity` once (trunk).
4. `git merge --no-ff --no-commit 06138110d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: shell-ui-s1 into alfonso-frontend-jjtl (P-2026-10-19-1733)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `06138110d` in `/Users/alfonso/jjodel-w-shellui-s1`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-shellui-s1`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 124e479c6` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 124e479c6 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/shell-ui.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the shell-ui-s1 merge (P-2026-10-19-1733)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-shellui-s1`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

# Prompt: merge sim-input-variables into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-1914
Chat: —
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1914 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `016a03e86`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-input-variables` into the trunk with one merge commit, `--no-ff`, of the explicit sha `2230df5f1`, in the shape of `ef8356005` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7b3e1cae0`. The branch carries, on top of the base, 11 commits:

- `2230df5f1` docs: Status flip and log entry, sim-input-variables took the trunk (P-2026-09-28-1837)
- `e259b94ec` merge: sim-input-variables takes alfonso-frontend-jjtl (P-2026-09-28-1837)
- `9f25631fa` docs: add prompt P-2026-09-28-1837, merge alfonso-frontend-jjtl into sim-input-variables
- `f15692c00` docs(sim): log entry and Status for the input variables (P-2026-09-28-0034)
- `b15fe4484` docs(spec): input variables, a third input of the step, S4 (P-2026-09-28-0034)
- `2033b731d` feat(sim): the input dialog and the input form of a Data row, S3 (P-2026-09-28-0034)
- `4884a57c3` feat(sim): the bridge asks the inputs a press reads, S2 (P-2026-09-28-0034)
- `ffcd0d5ae` feat(sim): input declarations in the core and codec, S1 (P-2026-09-28-0034)
- `417b39053` Merge branch 'alfonso-frontend-jjtl' into sim-input-variables
- `011157c2b` docs: sim input variables discovery (P-2026-09-28-0034)
- `ac7f5db80` docs: add prompt P-2026-09-28-0034, sim input variables discovery

The trunk carries, since the base, 1 commit:

- `016a03e86` docs: R-SIM-88 amended, input variables merge before the freeze (P-2026-09-28-1120)

Measured by `lane-run merge` at 2026-09-28 19:14, trunk at `016a03e86`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2230df5f1`: zero conflicts.
- Files changed since the base: 26 on the branch side, 3 on the trunk side; on both sides: none.
- `git diff --name-only 7b3e1cae0 2230df5f1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_0034_prompt_sim_input_variables.md` (eseguito 2026-09-28 · lane sim-input-variables · Phase 1 011157c2b; Phase 2 ffcd0d5ae, 4884a57c3, 2033b731d, b15fe4484 · verifica visiva non eseguita a mano: crops in ~/.jjodel-lanes/shots_input/ · not merged: after 2026-10-04 (R-SIM-88)), `claude_2026-09-28_1837_prompt_sim-input-variables_take_trunk.md` (eseguito 2026-09-28 · lane sim-input-variables · e259b94ec · verifica visiva passata 2026-09-28 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `sim-input-variables` in `/Users/alfonso/jjodel-w-input`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-1914/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `2230df5f1` is the tip of `sim-input-variables`; the prompt files of the branch read `Status: eseguito` at `2230df5f1`; `git worktree list` shows `sim-input-variables` only in `/Users/alfonso/jjodel-w-input`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 2230df5f1` (measured above: zero conflicts). `git diff --name-only 7b3e1cae0 2230df5f1 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7b3e1cae0 alfonso-frontend-jjtl` with `git diff --name-only 7b3e1cae0 2230df5f1` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: input variables for the simulator, S1-S4 (P-2026-09-28-0034)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: alfonso-frontend-jjtl into sim-input-variables (P-2026-09-28-1837)` once (branch).
4. `git merge --no-ff --no-commit 2230df5f1`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-input-variables into alfonso-frontend-jjtl (P-2026-09-28-1914)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `2230df5f1` in `/Users/alfonso/jjodel-w-input`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the sim-input-variables merge (P-2026-09-28-1914)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-input`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

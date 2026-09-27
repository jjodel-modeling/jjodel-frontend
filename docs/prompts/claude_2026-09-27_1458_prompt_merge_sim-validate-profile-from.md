# Prompt: merge sim-validate-profile-from into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-1458
Chat: C-2026-09-27-1428
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1458 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a76679486`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-validate-profile-from` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5369aef4f`, in the shape of `964597641` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `86520a8f3`. The branch carries, on top of the base, 4 commits:

- `5369aef4f` docs(sim): log entry and Status flip for P-2026-09-27-1437
- `6ade65d90` fix(sim): validateProfile rejects a derived role whose source is off (P-2026-09-27-1437)
- `8c1a499c1` docs: P-2026-09-27-1437 moves to ~/jjodel-open, ~/jjodel-gate taken by P-2026-09-27-1440
- `8e8b6d0fa` docs: add prompt P-2026-09-27-1437, validateProfile rejects a derived role whose source is off

The trunk carries, since the base, 6 commits:

- `a76679486` docs: Status flip for the harness-merge-pending merge (P-2026-09-27-1450)
- `964597641` merge: harness-merge-pending into alfonso-frontend-jjtl (P-2026-09-27-1450)
- `b848d1cf6` docs: add prompt P-2026-09-27-1450, merge harness-merge-pending into alfonso-frontend-jjtl
- `c0c1cb3e1` docs: close the merge pending and governance go-ahead tickets (P-2026-09-27-1440)
- `41e85a32e` fix(harness): lane-run merge renders to pending, --governance-goahead (P-2026-09-27-1440)
- `b96195cc5` docs: add prompt P-2026-09-27-1440, lane-run merge renders to pending and --governance-goahead

Measured by `lane-run merge` at 2026-09-27 14:58, trunk at `a76679486`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5369aef4f`: zero conflicts.
- Files changed since the base: 4 on the branch side, 5 on the trunk side; on both sides: none.
- `git diff --name-only 86520a8f3 5369aef4f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1437_prompt_sim_validate_profile_derived_from_off.md` (eseguito 2026-09-27 · lane sim-validate-profile-from · 6ade65d90).
- `git worktree list`: `sim-validate-profile-from` in `/Users/alfonso/jjodel-open`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5369aef4f` is the tip of `sim-validate-profile-from`; the prompt files of the branch read `Status: eseguito` at `5369aef4f`; `git worktree list` shows `sim-validate-profile-from` only in `/Users/alfonso/jjodel-open`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5369aef4f` (measured above: zero conflicts). `git diff --name-only 86520a8f3 5369aef4f -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 86520a8f3 alfonso-frontend-jjtl` with `git diff --name-only 86520a8f3 5369aef4f` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — fix: validateProfile rejects a derived role whose source is off (P-2026-09-27-1437)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-27 — fix: lane-run merge renders to pending, --governance-goahead (P-2026-09-27-1440)` once (trunk).
4. `git merge --no-ff --no-commit 5369aef4f`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-validate-profile-from into alfonso-frontend-jjtl (P-2026-09-27-1458)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5369aef4f` in `/Users/alfonso/jjodel-open`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-validate-profile-from merge (P-2026-09-27-1458)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-open`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

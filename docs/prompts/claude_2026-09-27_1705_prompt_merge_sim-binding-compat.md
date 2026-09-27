# Prompt: merge sim-binding-compat into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-27-1705
Chat: C-2026-09-27-1437
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1705 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7a4976853`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `sim-binding-compat` into the trunk with one merge commit, `--no-ff`, of the explicit sha `71807ed61`, in the shape of `bbd9b7142` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `bbd9b7142`. The branch carries, on top of the base, 3 commits:

- `71807ed61` docs(sim): S11a closure, log entry, Status (P-2026-09-27-1646)
- `3d44abce0` feat(sim): binding compatibility verdicts as a pure module (P-2026-09-27-1646)
- `e08984295` docs: add prompt P-2026-09-27-1646, binding compatibility verdicts

The trunk carries, since the base, 1 commit:

- `7a4976853` docs: Status flip for the sim-e1-engine merge (P-2026-09-27-1632)

Measured by `lane-run merge` at 2026-09-27 17:05, trunk at `7a4976853`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 71807ed61`: zero conflicts.
- Files changed since the base: 4 on the branch side, 1 on the trunk side; on both sides: none.
- `git diff --name-only bbd9b7142 71807ed61 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1646_prompt_sim_binding_compat.md` (eseguito 2026-09-27 · lane sim-binding-compat · 3d44abce0).
- `git worktree list`: `sim-binding-compat` in `/Users/alfonso/jjodel-sim`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `71807ed61` is the tip of `sim-binding-compat`; the prompt files of the branch read `Status: eseguito` at `71807ed61`; `git worktree list` shows `sim-binding-compat` only in `/Users/alfonso/jjodel-sim`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 71807ed61` (measured above: zero conflicts). `git diff --name-only bbd9b7142 71807ed61 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only bbd9b7142 alfonso-frontend-jjtl` with `git diff --name-only bbd9b7142 71807ed61` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: binding compatibility verdicts as a pure module, S11a (P-2026-09-27-1646)` once (branch).
4. `git merge --no-ff --no-commit 71807ed61`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-binding-compat into alfonso-frontend-jjtl (P-2026-09-27-1705)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `71807ed61` in `/Users/alfonso/jjodel-sim`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip for the sim-binding-compat merge (P-2026-09-27-1705)`. No log entry for the merge. Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-sim`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

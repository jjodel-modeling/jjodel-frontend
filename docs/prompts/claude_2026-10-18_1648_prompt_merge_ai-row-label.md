# Prompt: merge ai-row-label into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-18-1648
Chat: C-2026-10-18-0035
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-18 · lane merge · e74903e21 · verifica visiva passata 2026-10-18 (Visual GO by Alfonso at 16:48 on the ai-row-label worktree (localhost:3005), same tree as the merge: rows show Connected / failure kind / Not tested / Set up, no model name. Trunk 3001 down, not re-checked.)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-18-1648 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d0f4744b9`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ai-row-label` into the trunk with one merge commit, `--no-ff`, of the explicit sha `12c75e586`, in the shape of `412536c3e` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7cb3b9b27`. The branch carries, on top of the base, 4 commits:

- `12c75e586` docs: Status and log entry for the AI row state correction (P-2026-10-18-1525)
- `e8a6423b1` fix(settings): AI rows show the connection state, no model (P-2026-10-18-1525)
- `98b7befaa` docs: Status flip and log entry for the AI settings row lane (P-2026-10-18-1525)
- `edaccffb0` feat(settings): AI rows show the model, the failure kind on the dot (P-2026-10-18-1525)

The trunk carries, since the base, 12 commits:

- `d0f4744b9` docs: Status flip for the context-ceiling merge (P-2026-10-18-1638)
- `412536c3e` merge: context-ceiling into alfonso-frontend-jjtl (P-2026-10-18-1638)
- `a00c47dfc` Revert "docs: add prompt P-2026-10-18-1528, B8b context-ceiling hook"
- `9ebcae103` docs: add prompt P-2026-10-18-1638, merge context-ceiling into alfonso-frontend-jjtl
- `60db4fad7` merge: login-redesign into alfonso-frontend-jjtl (P-2026-10-18-1500)
- `2902e7d09` docs: Status, report and log entry for the auth page redesign (P-2026-10-18-1500)
- `a42694244` fix(auth): top-align intro and card, primary labels match titles (P-2026-10-18-1500)
- `f05d791d0` docs: B8b context-ceiling hook, gates, log entry and Status (P-2026-10-18-1530)
- `1293f152d` feat(harness): context-ceiling hook for AM-8 (P-2026-10-18-1530)
- `b6dee9372` docs: add prompt P-2026-10-18-1528, B8b context-ceiling hook
- `74109e58c` docs: add prompt P-2026-10-18-1530 (B8b context-ceiling hook)
- `b8a12dc99` feat(auth): editorial layout for sign in, register and password reset (P-2026-10-18-1500)

Measured by `lane-run merge` at 2026-10-18 16:48, trunk at `d0f4744b9`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 12c75e586`: zero conflicts.
- Files changed since the base: 7 on the branch side, 11 on the trunk side; on both sides: none.
- `git diff --name-only 7cb3b9b27 12c75e586 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `ai-row-label` in `/Users/alfonso/jjodel-w-ailabel`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-18-1648/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `12c75e586` is the tip of `ai-row-label`; the prompt files of the branch read `Status: eseguito` at `12c75e586`; `git worktree list` shows `ai-row-label` only in `/Users/alfonso/jjodel-w-ailabel`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 12c75e586` (measured above: zero conflicts). `git diff --name-only 7cb3b9b27 12c75e586 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7cb3b9b27 alfonso-frontend-jjtl` with `git diff --name-only 7cb3b9b27 12c75e586` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/release-3-2-ailabel.md`: the heading `## 2026-10-18 — feat(settings): AI rows show the model, the failure kind on the dot (P-2026-10-18-1525)` once (branch).
   - `docs/log-inbox/release-3-2-ailabel.md`: the heading `## 2026-10-18 — fix(settings): AI rows show the connection state, no model (P-2026-10-18-1525)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B8b, context-ceiling hook for AM-8 (P-2026-10-18-1530)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: B8a keeps --fresh, next, the slice refusal and the mechanical handoff; JJODEL_LANE_LOG becomes optional` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: B7 registers context-ceiling.mjs with matcher `*`` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat(auth): editorial layout for sign in, register and password reset (P-2026-10-18-1500)` once (trunk).
4. `git merge --no-ff --no-commit 12c75e586`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ai-row-label into alfonso-frontend-jjtl (P-2026-10-18-1648)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `12c75e586` in `/Users/alfonso/jjodel-w-ailabel`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-ailabel`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard d0f4744b9` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/release-3-2-ailabel.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ai-row-label merge (P-2026-10-18-1648)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-ailabel`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

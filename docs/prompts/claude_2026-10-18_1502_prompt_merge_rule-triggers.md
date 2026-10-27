# Prompt: merge rule-triggers into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-18-1502
Chat: C-2026-10-18-1414
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-18-1502 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `87feac64a`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `rule-triggers` into the trunk with one merge commit, `--no-ff`, of the explicit sha `bf2d67848`, in the shape of `fd9da9bef` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `ce534749c`. The branch carries, on top of the base, 2 commits:

- `bf2d67848` docs: B4 trigger map, gates.md, log entry and Status (P-2026-10-18-1420)
- `71a932b8f` feat(harness): rule-trigger hook, trigger map and check:triggers (P-2026-10-18-1420)

The trunk carries, since the base, 8 commits:

- `87feac64a` docs(prompts): auth page redesign prompt (P-2026-10-18-1500)
- `fd9da9bef` merge: ai-models-dynamic into alfonso-frontend-jjtl (P-2026-10-18-1457)
- `498606f95` docs: add prompt P-2026-10-18-1457, merge ai-models-dynamic into alfonso-frontend-jjtl
- `abcff0f69` docs: Status and log entry for slices c1, c2, d (P-2026-10-18-1146)
- `2a9ff5f02` feat(ai): live OpenAI and Gemini catalogs, tests as GET models (P-2026-10-18-1146)
- `7044b6812` feat(ai): model picker shows newest per family, older on demand (P-2026-10-18-1146)
- `b8b2724de` feat(ai): live Anthropic model catalog, test connection as GET models (P-2026-10-18-1146)
- `a3ec93534` docs: add prompt P-2026-10-18-1428, lane board kind badge

Measured by `lane-run merge` at 2026-10-18 15:02, trunk at `87feac64a`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl bf2d67848`: zero conflicts.
- Files changed since the base: 9 on the branch side, 15 on the trunk side; on both sides: none.
- `git diff --name-only ce534749c bf2d67848 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `rule-triggers` in `/Users/alfonso/jjodel-w-triggers`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-18-1502/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `bf2d67848` is the tip of `rule-triggers`; the prompt files of the branch read `Status: eseguito` at `bf2d67848`; `git worktree list` shows `rule-triggers` only in `/Users/alfonso/jjodel-w-triggers`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl bf2d67848` (measured above: zero conflicts). `git diff --name-only ce534749c bf2d67848 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only ce534749c alfonso-frontend-jjtl` with `git diff --name-only ce534749c bf2d67848` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): B4, rule-trigger hook, trigger map and check:triggers (P-2026-10-18-1420)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: lane-run start does not yet append a «Rules in scope» block from the DOVE globs` once (branch).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat: dynamic model lists for Anthropic, OpenAI and Gemini; connection test as GET models (P-2026-10-18-1146)` once (trunk).
4. `git merge --no-ff --no-commit bf2d67848`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: rule-triggers into alfonso-frontend-jjtl (P-2026-10-18-1502)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `bf2d67848` in `/Users/alfonso/jjodel-w-triggers`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-triggers`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 87feac64a` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/harness.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the rule-triggers merge (P-2026-10-18-1502)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-triggers`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

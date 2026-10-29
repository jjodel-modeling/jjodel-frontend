# Prompt: merge shell-ui-s5 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-20-0039
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-20 · lane merge · be73e2b2d · verifica visiva passata 2026-10-20 (Chat: S5 sheets at be73e2b2d identical to the shell-ui-s5 tip f9917a3ee checked on 3021 (File menu radius 8, 1px border, single shadow, items 36/28, trigger radius 4, rects unchanged, console init_dash only).)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-20-0039 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `eaf3a9fcc`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `shell-ui-s5` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f9917a3ee`, in the shape of `068b862d9` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `425187033`. The branch carries, on top of the base, 2 commits:

- `f9917a3ee` docs: Status and log entry for shell S5 menus (P-2026-10-19-2350)
- `40a3626a0` feat(shell): menus on shell tokens, 8px panels, 36/28px items (P-2026-10-19-2350)

The trunk carries, since the base, 11 commits:

- `eaf3a9fcc` docs: Status flip and log entry for the sim-trigger-position merge (P-2026-10-20-0026)
- `068b862d9` merge: sim-trigger-position into alfonso-frontend-jjtl (P-2026-10-20-0026)
- `5c31bb4fd` docs(prompts): Lanes page fixes on tack-s8, closure sources and IDs (P-2026-10-20-0040)
- `658f8d7fc` docs: add prompt P-2026-10-20-0026, merge sim-trigger-position into alfonso-frontend-jjtl
- `84d476f0e` docs: R-SIM row, Status flip and log entry (P-2026-10-20-0031)
- `c341ffbd3` feat(sim): compile defect trigger-position, fork and join fusion (P-2026-10-20-0031)
- `024dfb142` test(sim): trigger-position defect (P-2026-10-20-0031)
- `e02976c38` docs(prompts): sim trigger-position defect (P-2026-10-20-0031)
- `b91d9bb1a` docs(prompts): renumber the Lanes view fix to P-2026-10-20-0018 (0015 taken by the sim-docs lane)
- `9f8804310` docs(prompts): Lanes view fix on tack-s8 (P-2026-10-20-0015)
- `e24d30ac4` docs(tack): roadmap aligned with tack-s8 before the merge (phase ladder per project)

Measured by `lane-run merge` at 2026-10-20 00:39, trunk at `eaf3a9fcc`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f9917a3ee`: zero conflicts.
- Files changed since the base: 4 on the branch side, 11 on the trunk side; on both sides: none.
- `git diff --name-only 425187033 f9917a3ee -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `shell-ui-s5` in `/Users/alfonso/jjodel-w-shellui-s5`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-20-0039/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f9917a3ee` is the tip of `shell-ui-s5`; the prompt files of the branch read `Status: eseguito` at `f9917a3ee`; `git worktree list` shows `shell-ui-s5` only in `/Users/alfonso/jjodel-w-shellui-s5`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f9917a3ee` (measured above: zero conflicts). `git diff --name-only 425187033 f9917a3ee -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 425187033 alfonso-frontend-jjtl` with `git diff --name-only 425187033 f9917a3ee` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-147` (trunk); control: `- **R-SIM-148**` none.
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — feat: menus on shell tokens, 8px panels, 36/28px items (S5)` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-20: a trigger that fork or join fusion drops (R-SIM-147)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — feat(sim): compile defect trigger-position for triggers dropped by fork or join fusion (P-2026-10-20-0031)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — merge: sim-trigger-position into alfonso-frontend-jjtl (P-2026-10-20-0026)` once (trunk).
4. `git merge --no-ff --no-commit f9917a3ee`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: shell-ui-s5 into alfonso-frontend-jjtl (P-2026-10-20-0039)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f9917a3ee` in `/Users/alfonso/jjodel-w-shellui-s5`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-shellui-s5`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard eaf3a9fcc` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only eaf3a9fcc HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/shell-ui.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the shell-ui-s5 merge (P-2026-10-20-0039)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-shellui-s5`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

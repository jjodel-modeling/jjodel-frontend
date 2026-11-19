# Prompt: merge multi-tab-groups-2a into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-19-1830
Chat: C-2026-11-18-2337
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (merge of multi-tab-groups-2a launched by chat C-2026-11-18-2337)
Lane: full (merge; 1 conflict: `docs/log-inbox/multi-tab.md` measured)
Status: eseguito 2026-11-19 · lane merge · 9ada8807b · verifica visiva passata 2026-11-19 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-19-1830 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6c306688f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-groups-2a` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f0c35e0fc`, in the shape of `3ca35aebc` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `3ca35aebc`. The branch carries, on top of the base, 8 commits:

- `f0c35e0fc` docs: R-MT-30 header in the register grammar
- `144e34ba7` docs: close editor groups lane 2a, R-MT-30 GO (P-2026-11-19-1745)
- `5a8189689` docs: R-MT-30 editor groups, Split Right only (provisional) (P-2026-11-19-1745)
- `f0af162bf` fix(dock): openBeside never splits, Split Right only (P-2026-11-19-1745)
- `eb720156f` docs: add prompt P-2026-11-19-1745, finish editor groups lane 2a
- `b1c458f83` feat(dock): editor groups core, Split Right, veto, active group (P-2026-11-19-1600)
- `1c248d9e0` feat(dock): dockGroups, the active group accessor and the move veto (P-2026-11-19-1600)
- `80826045b` docs: add prompt P-2026-11-19-1600, editor groups lane 2a (core)

The trunk carries, since the base, 2 commits:

- `6c306688f` docs: add prompt P-2026-11-19-1821, merge multi-tab-groups-2a into alfonso-frontend-jjtl
- `116c9718f` docs: Status flip and log entry for the multi-tab-l4c merge (P-2026-11-19-1705)

Measured by `lane-run merge` at 2026-11-19 18:30, trunk at `6c306688f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f0c35e0fc`: 1 conflict: `docs/log-inbox/multi-tab.md`.
- Files changed since the base: 18 on the branch side, 3 on the trunk side; on both sides: `docs/log-inbox/multi-tab.md`.
- `git diff --name-only 3ca35aebc f0c35e0fc -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-19_1600_prompt_multi-tab-groups-2a-core.md` (eseguito 2026-11-19 · lane full · 1c248d9e0, b1c458f83 · verifica visiva passata 2026-11-19 (closed by P-2026-11-19-1745, stopped at the context ceiling)), `claude_2026-11-19_1745_prompt_multi-tab-groups-2a-finish.md` (eseguito 2026-11-19 · lane full · f0af162bf · verifica visiva passata 2026-11-19).
- `git worktree list`: `multi-tab-groups-2a` in `/Users/alfonso/jjodel-w-mtg2a`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `f0c35e0fc` is the tip of `multi-tab-groups-2a`; the prompt files of the branch read `Status: eseguito` at `f0c35e0fc`; `git worktree list` shows `multi-tab-groups-2a` only in `/Users/alfonso/jjodel-w-mtg2a`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f0c35e0fc` (measured above: 1 conflict: `docs/log-inbox/multi-tab.md`). `git diff --name-only 3ca35aebc f0c35e0fc -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 3ca35aebc alfonso-frontend-jjtl` with `git diff --name-only 3ca35aebc f0c35e0fc` (measured above: `docs/log-inbox/multi-tab.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-MT-30` (branch); control: `- **R-MT-31**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — feat: editor groups core, Split Right only (multi-tab lane 2a)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — merge: multi-tab-l4c into alfonso-frontend-jjtl (P-2026-11-19-1705)` once (trunk).
4. `git merge --no-ff --no-commit f0c35e0fc`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-groups-2a into alfonso-frontend-jjtl (P-2026-11-19-1830)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `f0c35e0fc` in `/Users/alfonso/jjodel-w-mtg2a`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtg2a`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6c306688f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 6c306688f HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-groups-2a merge (P-2026-11-19-1830)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtg2a`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

# Prompt: merge multi-tab-groups-2b into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-19-2124
Chat: C-2026-11-18-2337
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (merge of multi-tab-groups-2b launched by chat C-2026-11-18-2337)
Lane: full (merge; 1 conflict: `docs/log-inbox/multi-tab.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-19-2124 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `f111aeb8e`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-groups-2b` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b18a0b03d`, in the shape of `9ada8807b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `9ada8807b`. The branch carries, on top of the base, 5 commits:

- `b18a0b03d` docs: close editor groups lane 2b, log entry and Status (P-2026-11-19-1915)
- `b25a2b494` docs: R-MT-30, lane 2b strips and group widths (P-2026-11-19-1915)
- `021642d48` feat(dock): one tab strip per editor group, groups keep their width (P-2026-11-19-1915)
- `2d1f68d8d` docs: add prompt P-2026-11-19-1915, finish editor groups lane 2b
- `850775e3b` docs: add prompt P-2026-11-19-1820, editor groups lane 2b (strips)

The trunk carries, since the base, 1 commit:

- `f111aeb8e` docs: Status flip and log entry for the multi-tab-groups-2a merge (P-2026-11-19-1830)

Measured by `lane-run merge` at 2026-11-19 21:24, trunk at `f111aeb8e`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b18a0b03d`: 1 conflict: `docs/log-inbox/multi-tab.md`.
- Files changed since the base: 11 on the branch side, 3 on the trunk side; on both sides: `docs/log-inbox/multi-tab.md`.
- `git diff --name-only 9ada8807b b18a0b03d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-19_1820_prompt_multi-tab-groups-2b-strips.md` (eseguito 2026-11-19 · lane full · 021642d48 · verifica visiva passata 2026-11-19 (closed by P-2026-11-19-1915, stopped at the context ceiling)), `claude_2026-11-19_1915_prompt_multi-tab-groups-2b-finish.md` (eseguito 2026-11-19 · lane full · 021642d48, b25a2b494 · verifica visiva passata 2026-11-19).
- `git worktree list`: `multi-tab-groups-2b` in `/Users/alfonso/jjodel-w-mtg2b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b18a0b03d` is the tip of `multi-tab-groups-2b`; the prompt files of the branch read `Status: eseguito` at `b18a0b03d`; `git worktree list` shows `multi-tab-groups-2b` only in `/Users/alfonso/jjodel-w-mtg2b`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b18a0b03d` (measured above: 1 conflict: `docs/log-inbox/multi-tab.md`). `git diff --name-only 9ada8807b b18a0b03d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 9ada8807b alfonso-frontend-jjtl` with `git diff --name-only 9ada8807b b18a0b03d` (measured above: `docs/log-inbox/multi-tab.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — feat: one tab strip per editor group, groups keep their width (multi-tab lane 2b)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — ticket: metamodels always open in the left group` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-19 — merge: multi-tab-groups-2a into alfonso-frontend-jjtl (P-2026-11-19-1830)` once (trunk).
4. `git merge --no-ff --no-commit b18a0b03d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-groups-2b into alfonso-frontend-jjtl (P-2026-11-19-2124)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b18a0b03d` in `/Users/alfonso/jjodel-w-mtg2b`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtg2b`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard f111aeb8e` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only f111aeb8e HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-groups-2b merge (P-2026-11-19-2124)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtg2b`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

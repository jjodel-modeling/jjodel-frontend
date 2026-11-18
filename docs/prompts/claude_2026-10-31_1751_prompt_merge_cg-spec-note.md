# Prompt: merge cg-spec-note into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-31-1751
Chat: C-2026-10-31-1328
Request: none (rendered by lane-run, no chat URL known for C-2026-10-31-1328)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-31 · lane merge · 2a41d7507 · GO 2026-10-31 senza verifica visiva (chat, unattended: gates on 2a41d7507 and the unit test of the condition, browser pane hidden; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-1751 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `d575e2965`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `cg-spec-note` into the trunk with one merge commit, `--no-ff`, of the explicit sha `16bcd3432`, in the shape of `2249bfef5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `e94541c13`. The branch carries, on top of the base, 4 commits:

- `16bcd3432` docs: Status flip and log entry for the spec and draft-note lane (P-2026-10-31-1712)
- `a8499d9d0` docs(jjel): SPEC 9.4, origins of member reads through + and join (P-2026-10-31-1712)
- `90123e307` fix(codegen): stale-draft note only while the metamodel exists (P-2026-10-31-1712)
- `0d567dacf` docs(prompts): add P-2026-10-31-1712

The trunk carries, since the base, 3 commits:

- `d575e2965` docs: add prompt P-2026-10-31-1746, merge jjel-range into alfonso-frontend-jjtl
- `326e2e6d1` docs(sessioni): update checkpoint of chat C-2026-10-31-1328 after the five merges
- `898e8adeb` docs: add prompts P-2026-10-31-1740 and 1741 (jjel range, jjtl multivar forall)

Measured by `lane-run merge` at 2026-10-31 17:51, trunk at `d575e2965`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 16bcd3432`: zero conflicts.
- Files changed since the base: 6 on the branch side, 4 on the trunk side; on both sides: none.
- `git diff --name-only e94541c13 16bcd3432 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-31_1712_prompt_codegen_spec_and_draft_note.md` (eseguito 2026-10-31 · lane cg-spec-note · 90123e307, a8499d9d0).
- `git worktree list`: `cg-spec-note` in `/Users/alfonso/jjodel-w-cgspec`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `16bcd3432` is the tip of `cg-spec-note`; the prompt files of the branch read `Status: eseguito` at `16bcd3432`; `git worktree list` shows `cg-spec-note` only in `/Users/alfonso/jjodel-w-cgspec`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 16bcd3432` (measured above: zero conflicts). `git diff --name-only e94541c13 16bcd3432 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only e94541c13 alfonso-frontend-jjtl` with `git diff --name-only e94541c13 16bcd3432` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — fix(codegen): stale-draft note only while the metamodel exists, SPEC on origins through + and join (P-2026-10-31-1712)` once (branch).
4. `git merge --no-ff --no-commit 16bcd3432`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: cg-spec-note into alfonso-frontend-jjtl (P-2026-10-31-1751)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `16bcd3432` in `/Users/alfonso/jjodel-w-cgspec`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-cgspec`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard d575e2965` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only d575e2965 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the cg-spec-note merge (P-2026-10-31-1751)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-cgspec`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

# Prompt: merge textual-d4-rename into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0717
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0717 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cfbe326c0`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-d4-rename` into the trunk with one merge commit, `--no-ff`, of the explicit sha `76d1b4295`, in the shape of `511a3de3c` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `4ad2bf5fc`. The branch carries, on top of the base, 6 commits:

- `76d1b4295` docs: Status flips and log entry for D4 (P-2026-11-07-0515, P-2026-11-07-0609)
- `e42169108` fix(codegen): D4 (3), show the rename refusal after typing (P-2026-11-07-0609)
- `840d19da7` docs: add prompt P-2026-11-07-0609, D4 continuation
- `63c4fffc6` feat(codegen): D4 (2), the rename provider of the Text tab (P-2026-11-07-0515)
- `ec89f027f` feat(codegen): D4 (1), renameEdits with the reparse check (P-2026-11-07-0515)
- `c238fa96b` docs: add prompt P-2026-11-07-0515, D4 safe rename

The trunk carries, since the base, 17 commits:

- `cfbe326c0` docs: close the textual-e1-reprint merge by hand (P-2026-11-07-0645)
- `511a3de3c` merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)
- `826e850dd` docs: add prompt P-2026-11-07-0645, merge textual-e1-reprint into alfonso-frontend-jjtl
- `c55cc1a3a` docs: Status flip and log entry, textual-e1-reprint took the trunk (P-2026-11-07-0607)
- `c8a3be5f3` merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0607)
- `438229732` docs: add prompt P-2026-11-07-0607, merge alfonso-frontend-jjtl into textual-e1-reprint
- `a75356f55` docs: Status flips and log entry for E1b (P-2026-11-07-0346, P-2026-11-07-0510)
- `40b7be107` feat(codegen): E1b, a comment-only edit is the agreement (P-2026-11-07-0510)
- `cf2b29a1d` docs: add prompt P-2026-11-07-0510, E1b continuation
- `0be037a6f` feat(codegen): E1b, T10 wired into the Text tab (P-2026-11-07-0346)
- `63faf9fb9` docs: add prompt P-2026-11-07-0346, E1b, T10 wired into the Text tab
- `443612826` docs: close the trunk-into of textual-e1-reprint by hand (P-2026-11-07-0251)
- `7807c9c78` merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0251)
- `8bf3b95ed` docs: add prompt P-2026-11-07-0251, merge alfonso-frontend-jjtl into textual-e1-reprint
- `c4a9d442d` docs: Status flip and log entry for E1a (P-2026-11-07-0048)
- `d795d9533` feat(codegen): E1a, T10's splice keeps typed text (P-2026-11-07-0048)
- `334b1985b` docs: add prompt P-2026-11-07-0048, E1a, the T10 splice

Measured by `lane-run merge` at 2026-11-07 07:17, trunk at `cfbe326c0`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 76d1b4295`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 6 on the branch side, 10 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 4ad2bf5fc 76d1b4295 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_0515_prompt_textual_d4_rename.md` (eseguito 2026-11-07 · lane full · ec89f027f, 63c4fffc6 · gates green; app check in P-2026-11-07-0609 · log entry in docs/log-inbox/codegen.md), `claude_2026-11-07_0609_prompt_textual_d4_continuation.md` (eseguito 2026-11-07 · lane full · e42169108 · gates green · app check ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-07-0609/, checked by the chat · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-d4-rename` in `/Users/alfonso/jjodel-w-textd4`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0717/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `76d1b4295` is the tip of `textual-d4-rename`; the prompt files of the branch read `Status: eseguito` at `76d1b4295`; `git worktree list` shows `textual-d4-rename` only in `/Users/alfonso/jjodel-w-textd4`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 76d1b4295` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 4ad2bf5fc 76d1b4295 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 4ad2bf5fc alfonso-frontend-jjtl` with `git diff --name-only 4ad2bf5fc 76d1b4295` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D4, safe rename through the text (P-2026-11-07-0609)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1a, T10's splice keeps typed text (P-2026-11-07-0048)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0251)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1b, T10 wired into the Text tab (P-2026-11-07-0510)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0607)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)` once (trunk).
4. `git merge --no-ff --no-commit 76d1b4295`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-d4-rename into alfonso-frontend-jjtl (P-2026-11-07-0717)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `76d1b4295` in `/Users/alfonso/jjodel-w-textd4`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textd4`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cfbe326c0` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only cfbe326c0 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-d4-rename merge (P-2026-11-07-0717)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textd4`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

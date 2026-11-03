# Prompt: merge textual-a-tolerant-parser into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-03-2245
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-a-tolerant-parser launched by chat C-2026-11-03-1037)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-2245 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `00e4bcea4`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-a-tolerant-parser` into the trunk with one merge commit, `--no-ff`, of the explicit sha `deb4416f9`, in the shape of `6fb7d2841` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `6fb7d2841`. The branch carries, on top of the base, 18 commits:

- `deb4416f9` docs: log entry and Status for the printer half of step A (P-2026-11-03-2220)
- `5dd458ddb` test(codegen): mutation bench of the printer's tree and its equality (P-2026-11-03-2220)
- `c79d05b4c` perf(codegen): the printer resolves names in linear time (P-2026-11-03-2220)
- `8c6734ffe` feat(codegen): the printer builds the tree its parse builds (P-2026-11-03-2220)
- `98898d626` docs: close the parser half, log entry and Status of 1415, 2120, 2152 (P-2026-11-03-2220)
- `920e17804` docs(harness): tolerant recovery probe of the parser half (P-2026-11-03-2220)
- `a81e598f3` docs: add prompt P-2026-11-03-2220, step A printer half
- `b35e18146` test(codegen): mutation bench of recovery and the never-applied rule (P-2026-11-03-2152)
- `bfa1a18ee` feat(codegen): the match of a broken parse, for display only (P-2026-11-03-2152)
- `beb512f58` perf(codegen): the parser resolves names in linear time (P-2026-11-03-2152)
- `231113e79` feat(codegen): reference errors after a syntax error are warnings (P-2026-11-03-2152)
- `ce29856c2` feat(codegen): the parser recovers by insertion, deletion and descent (P-2026-11-03-2152)
- `f6c253f23` docs: add prompt P-2026-11-03-2152, step A parser half continuation
- `93ec1bd92` feat(codegen): the parser builds a lossless tree (P-2026-11-03-2120)
- `722eb3cee` feat(codegen): parser tokens keep their trivia, losslessly (P-2026-11-03-2120)
- `1a21fd9bc` docs: add prompt P-2026-11-03-2120, step A parser half
- `bda84222f` docs: log entry for the tolerant parser discovery (P-2026-11-03-1415)
- `ecb912167` docs(codegen): discovery of the tolerant parser, step A phase 1 (P-2026-11-03-1415)

The trunk carries, since the base, 6 commits:

- `00e4bcea4` docs: R-TXT-37, commenting an object out asks first; plan line in step D
- `98f81e521` docs: fix the header of R-TXT-36 so that parseRows reads it
- `52627e236` docs: R-TXT-36, answers on the tolerant parser
- `bd82f5f72` docs: R-JTG-14 ratified
- `e1f65f3ce` docs: session checkpoint, the open JjTL points
- `8c7ded3a6` docs: Status flip and log entry for the jjtl-panel-warnings-low merge (P-2026-11-03-1619)

Measured by `lane-run merge` at 2026-11-03 22:45, trunk at `00e4bcea4`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl deb4416f9`: zero conflicts.
- Files changed since the base: 14 on the branch side, 5 on the trunk side; on both sides: none.
- `git diff --name-only 6fb7d2841 deb4416f9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-03_2120_prompt_textual_a_parser.md` (eseguito 2026-11-03 · lane full · 722eb3cee, 93ec1bd92 · stopped at the context ceiling (RC-51), closed by P-2026-11-03-2152 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-2152)), `claude_2026-11-03_2152_prompt_textual_a_parser_cont.md` (eseguito 2026-11-03 · lane full · ce29856c2, 231113e79, beb512f58, bfa1a18ee, b35e18146 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-2152)), `claude_2026-11-03_2220_prompt_textual_a_printer.md` (eseguito 2026-11-03 · lane full · 8c6734ffe, c79d05b4c, 5dd458ddb · verifica visiva non applicabile (nothing on screen; in-app check by the lane, 4/4), closed by the chat (RC-17)).
- `git worktree list`: `textual-a-tolerant-parser` in `/Users/alfonso/jjodel-w-texta`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-03-2245/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `deb4416f9` is the tip of `textual-a-tolerant-parser`; the prompt files of the branch read `Status: eseguito` at `deb4416f9`; `git worktree list` shows `textual-a-tolerant-parser` only in `/Users/alfonso/jjodel-w-texta`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl deb4416f9` (measured above: zero conflicts). `git diff --name-only 6fb7d2841 deb4416f9 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 6fb7d2841 alfonso-frontend-jjtl` with `git diff --name-only 6fb7d2841 deb4416f9` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-36` (trunk), `R-TXT-37` (trunk), `R-JTG-14` (trunk); control: `- **R-JTG-15**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — discovery(codegen): tolerant parser, textual step A phase 1 (P-2026-11-03-1415)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): tolerant parser, lossless tree and recovery, textual step A parser half (P-2026-11-03-2120, P-2026-11-03-2152)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — feat(codegen): the printer builds the parser's tree, textual step A printer half (P-2026-11-03-2220)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-03 — merge: jjtl-panel-warnings-low into alfonso-frontend-jjtl (P-2026-11-03-1619)` once (trunk).
4. `git merge --no-ff --no-commit deb4416f9`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-a-tolerant-parser into alfonso-frontend-jjtl (P-2026-11-03-2245)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `deb4416f9` in `/Users/alfonso/jjodel-w-texta`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-texta`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 00e4bcea4` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 00e4bcea4 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-a-tolerant-parser merge (P-2026-11-03-2245)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-texta`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

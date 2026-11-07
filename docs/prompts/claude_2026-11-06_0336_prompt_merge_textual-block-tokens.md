# Prompt: merge textual-block-tokens into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-06-0336
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-06 · lane merge · 339928e84 · verifica visiva passata 2026-11-06 (B3a core; B3b crops b3b-1..5 in ~/.jjodel-lanes/P-2026-11-06-0242/ checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-06-0336 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fa59c8f84`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-block-tokens` into the trunk with one merge commit, `--no-ff`, of the explicit sha `60b8a78e4`, in the shape of `79f4d6ed3` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7993d0580`. The branch carries, on top of the base, 12 commits:

- `60b8a78e4` docs: Status flips and log entry for B3b (P-2026-11-06-0242, P-2026-11-06-0310)
- `2833f05c5` docs: add prompt P-2026-11-06-0310, B3b continuation
- `65a842fe2` feat(codegen): B3b (2), the head prefix in the Syntax form and EBNF (P-2026-11-06-0242)
- `ca03ff90d` fix(codegen): B3b (1), the readers find the class keyword by origin (P-2026-11-06-0242)
- `ffb6eafc0` docs: add prompt P-2026-11-06-0242, B3b, the head prefix in the readers and the form
- `55bd3bbec` docs: Status flips and log entry for B3a (P-2026-11-06-0147, P-2026-11-06-0215)
- `961f43a3f` feat(codegen): B3a (4), D8 for a prefixed head, an empty open (P-2026-11-06-0147)
- `a50166979` docs: add prompt P-2026-11-06-0215, B3a continuation
- `c3e06275c` fix(codegen): B3a (3), the style check finds the class keyword by origin (P-2026-11-06-0147)
- `571675a7a` feat(codegen): B3a (2), the head prefix in the derivation (P-2026-11-06-0147)
- `2caec7308` feat(codegen): B3a (1), the head prefix resolved on a class (P-2026-11-06-0147)
- `f83d24b90` docs: add prompt P-2026-11-06-0147, B3a, the head prefix of a class (core)

The trunk carries, since the base, 8 commits:

- `fa59c8f84` docs: Status flip and log entry for the textual-block-tokens merge (P-2026-11-06-0124)
- `79f4d6ed3` merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0124)
- `c191cd7b7` docs: add prompt P-2026-11-06-0124, merge textual-block-tokens into alfonso-frontend-jjtl
- `f9220d03b` docs: Status flip and log entry for the textual-block-tokens merge (P-2026-11-06-0030)
- `5dfa13429` merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0030)
- `f0ccc0cfe` docs: add prompt P-2026-11-06-0030, merge textual-block-tokens into alfonso-frontend-jjtl
- `27e38755c` docs: add the missing Corregge and Causa fields to the jjtl-method-failure-error closure entry
- `119abdb41` docs: measure harness continuations and ceiling exceptions

Measured by `lane-run merge` at 2026-11-06 03:36, trunk at `fa59c8f84`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 60b8a78e4`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 13 on the branch side, 8 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 7993d0580 60b8a78e4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-06_0147_prompt_textual_block_tokens_b3a.md` (eseguito 2026-11-06 · lane full · 2caec7308, 571675a7a, c3e06275c, then continued by P-2026-11-06-0215 (soft context ceiling) · 961f43a3f · core only, no visual check), `claude_2026-11-06_0215_prompt_textual_block_tokens_b3a_cont.md` (eseguito 2026-11-06 · lane full · 961f43a3f · gates green except check:docs B, the trunk hw-notation.md:1307 entry; core only, no visual check), `claude_2026-11-06_0242_prompt_textual_block_tokens_b3b.md` (eseguito 2026-11-06 · lane full · ca03ff90d, 65a842fe2 · gates green · app check 10/10 (step 3 in P-2026-11-06-0310) · soft ceiling, continued by P-2026-11-06-0310), `claude_2026-11-06_0310_prompt_textual_block_tokens_b3b_cont.md` (eseguito 2026-11-06 · lane full · no code · app check step 3 pass, probe ALL PASS · log entry and Status flips uncommitted (RC-17)).
- `git worktree list`: `textual-block-tokens` in `/Users/alfonso/jjodel-w-blocktok`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-06-0336/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `60b8a78e4` is the tip of `textual-block-tokens`; the prompt files of the branch read `Status: eseguito` at `60b8a78e4`; `git worktree list` shows `textual-block-tokens` only in `/Users/alfonso/jjodel-w-blocktok`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 60b8a78e4` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 7993d0580 60b8a78e4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7993d0580 alfonso-frontend-jjtl` with `git diff --name-only 7993d0580 60b8a78e4` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): B3a, the head prefix of a class, core (P-2026-11-06-0147, P-2026-11-06-0215)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): B3b, the head prefix in the readers and the Syntax form (P-2026-11-06-0242, P-2026-11-06-0310)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0030)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0124)` once (trunk).
   - `docs/log-inbox/harness-effectiveness-followup.md`: the heading `## 2026-11-05 — docs: compare harness consumption with continuations and inspect ceiling exceptions` once (trunk).
4. `git merge --no-ff --no-commit 60b8a78e4`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-block-tokens into alfonso-frontend-jjtl (P-2026-11-06-0336)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `60b8a78e4` in `/Users/alfonso/jjodel-w-blocktok`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-blocktok`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fa59c8f84` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only fa59c8f84 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-block-tokens merge (P-2026-11-06-0336)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-blocktok`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

# Prompt: merge textual-t8e-match into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-2002
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-t8e-match launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-08 · lane merge · 3589668e7 · verifica visiva passata 2026-11-08 (T8e crops 1-swap, 2-offscreen in ~/.jjodel-lanes/P-2026-11-08-1927/; 1-swap 20 runs, 0 holes, pairing 100%)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-2002 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `7be5a7c57`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t8e-match` into the trunk with one merge commit, `--no-ff`, of the explicit sha `431448be5`, in the shape of `936f8ac85` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `723bcabf6`. The branch carries, on top of the base, 10 commits:

- `431448be5` docs: T8e log entry and Status flips (P-2026-11-08-1927)
- `fa4ac61e3` docs: prompt for T8e acceptance and log entry (P-2026-11-08-1927)
- `16f7302f6` merge: alfonso-frontend-jjtl into textual-t8e-match (settle fix for the T8e acceptance)
- `000a8f1f4` docs: T8f report, the reorder hole is a settle race (P-2026-11-08-1718)
- `d556aae9c` docs: prompt for T8f, the null hole after a homonym reorder (P-2026-11-08-1718)
- `a3de44bbf` docs: prompt for T8e continuation, app check and docs (P-2026-11-08-1705)
- `52c8422ea` fix(codegen): T8e, highlight on open for a node out of view (P-2026-11-08-1625)
- `ad25337a7` feat(codegen): T8e, homonyms pair by content, order the tie-break (P-2026-11-08-1625)
- `723eb1233` feat(codegen): T8e, rename thresholds as a match parameter (P-2026-11-08-1625)
- `814b74524` docs: prompt for T8e, match parameters and homonym pairing (P-2026-11-08-1625)

The trunk carries, since the base, 10 commits:

- `7be5a7c57` docs: Status flip and log entry for the textual-c2h-index merge (P-2026-11-08-1926)
- `936f8ac85` merge: textual-c2h-index into alfonso-frontend-jjtl (P-2026-11-08-1926)
- `21c46e67a` docs: C2h log entry and Status flip (P-2026-11-08-1626)
- `09e60421f` fix(editor-v2): C2h, number unnamed homonyms on the IR chips (P-2026-11-08-1626)
- `d54e1f51d` test(editor-v2): C2h, chips of one field number homonyms, red (P-2026-11-08-1626)
- `4577595f1` docs: LIR of C2h, the chips under the widened scope (P-2026-11-08-1626)
- `0f72e3ad3` fix(editor-v2): C2h, the stale comments name `<Class> (unnamed)` (P-2026-11-08-1626)
- `71bf799ef` fix(editor-v2): C2h, number unnamed homonyms of one default-view slot (P-2026-11-08-1626)
- `fce48f889` docs: LIR of C2h, index on unnamed homonym labels (P-2026-11-08-1626)
- `279a76a6a` docs: prompt for C2h, index on unnamed homonym chips and default view (P-2026-11-08-1626)

Measured by `lane-run merge` at 2026-11-08 20:02, trunk at `7be5a7c57`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 431448be5`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 12 on the branch side, 7 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 723bcabf6 431448be5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1625_prompt_textual_t8e_match.md` (eseguito 2026-11-08 · lane textual-t8e-match · 52c8422ea), `claude_2026-11-08_1705_prompt_textual_t8e_appcheck.md` (eseguito 2026-11-08 · lane textual-t8e-match · 52c8422ea), `claude_2026-11-08_1718_prompt_textual_t8f_reorder_hole.md` (eseguito 2026-11-08 · lane textual-t8e-match · 000a8f1f4), `claude_2026-11-08_1927_prompt_textual_t8e_acceptance.md` (eseguito 2026-11-08 · lane textual-t8e-match · 52c8422ea).
- `git worktree list`: `textual-t8e-match` in `/Users/alfonso/jjodel-w-textt8e`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-2002/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `431448be5` is the tip of `textual-t8e-match`; the prompt files of the branch read `Status: eseguito` at `431448be5`; `git worktree list` shows `textual-t8e-match` only in `/Users/alfonso/jjodel-w-textt8e`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 431448be5` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 723bcabf6 431448be5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 723bcabf6 alfonso-frontend-jjtl` with `git diff --name-only 723bcabf6 431448be5` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8e, thresholds as a parameter, homonyms by content, highlight off-screen (P-2026-11-08-1625, P-2026-11-08-1705, P-2026-11-08-1718, P-2026-11-08-1927)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2h, index on unnamed homonyms of IR chips and default view (P-2026-11-08-1626)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-c2h-index into alfonso-frontend-jjtl (P-2026-11-08-1926)` once (trunk).
4. `git merge --no-ff --no-commit 431448be5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t8e-match into alfonso-frontend-jjtl (P-2026-11-08-2002)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `431448be5` in `/Users/alfonso/jjodel-w-textt8e`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt8e`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 7be5a7c57` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 7be5a7c57 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t8e-match merge (P-2026-11-08-2002)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt8e`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

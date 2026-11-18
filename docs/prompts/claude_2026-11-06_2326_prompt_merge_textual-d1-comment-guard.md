# Prompt: merge textual-d1-comment-guard into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-06-2326
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-06 · lane merge · 59b532f43 · verifica visiva passata 2026-11-06 (D1 crops d1-1..4 in ~/.jjodel-lanes/P-2026-11-06-2301/ checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-06-2326 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8049bf81b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-d1-comment-guard` into the trunk with one merge commit, `--no-ff`, of the explicit sha `275eec130`, in the shape of `ad6da074b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `7d171b504`. The branch carries, on top of the base, 3 commits:

- `275eec130` docs: Status flip and log entry for D1 (P-2026-11-06-2301)
- `87ca3f547` feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)
- `7edac8f1a` docs: add prompt P-2026-11-06-2301, D1, commenting an object out asks first

The trunk carries, since the base, 8 commits:

- `8049bf81b` docs: Status flip and log entry for the textual-c2e-ir-chip merge (P-2026-11-06-2302)
- `ad6da074b` merge: textual-c2e-ir-chip into alfonso-frontend-jjtl (P-2026-11-06-2302)
- `2e87b96f5` docs: R-FA-12 boundary ratified, R-FA-13 builtin errors name the rule
- `48ea40eec` docs: add prompt P-2026-11-06-2302, merge textual-c2e-ir-chip into alfonso-frontend-jjtl
- `53359fde7` docs: Status flip and log entry for C2e (P-2026-11-06-2041)
- `baec942aa` fix(editor-v2): label a nameless target `: <Class>` on the IR form (P-2026-11-06-2041)
- `ed9054afd` docs(editor-v2): C2e Phase 1, Layer Impact Report (P-2026-11-06-2041)
- `2edce622d` docs: add prompt claude_2026-11-06_2041_prompt_textual_c2e_ir_chip.md

Measured by `lane-run merge` at 2026-11-06 23:26, trunk at `8049bf81b`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 275eec130`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 4 on the branch side, 9 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 7d171b504 275eec130 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-06_2301_prompt_textual_d1_comment_guard.md` (eseguito 2026-11-06 · lane full · 87ca3f547 · gates green · app check 6/6 PASS, crops in ~/.jjodel-lanes/P-2026-11-06-2301/, visual GO pending · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-d1-comment-guard` in `/Users/alfonso/jjodel-w-textd1`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-06-2326/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `275eec130` is the tip of `textual-d1-comment-guard`; the prompt files of the branch read `Status: eseguito` at `275eec130`; `git worktree list` shows `textual-d1-comment-guard` only in `/Users/alfonso/jjodel-w-textd1`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 275eec130` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 7d171b504 275eec130 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 7d171b504 alfonso-frontend-jjtl` with `git diff --name-only 7d171b504 275eec130` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-FA-13` (trunk); control: `- **R-FA-14**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — fix(editor-v2): C2e, a nameless reference target is labelled `: <Class>` on the IR form (P-2026-11-06-2041)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-c2e-ir-chip into alfonso-frontend-jjtl (P-2026-11-06-2302)` once (trunk).
4. `git merge --no-ff --no-commit 275eec130`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-d1-comment-guard into alfonso-frontend-jjtl (P-2026-11-06-2326)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `275eec130` in `/Users/alfonso/jjodel-w-textd1`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textd1`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8049bf81b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 8049bf81b HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-d1-comment-guard merge (P-2026-11-06-2326)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textd1`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

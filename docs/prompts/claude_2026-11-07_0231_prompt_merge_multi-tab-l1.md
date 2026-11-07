# Prompt: merge multi-tab-l1 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0231
Chat: C-2026-11-06-2333
Request: https://claude.ai/code/session_01DQt9R7EZZv9MmGKpjvzZWx (merge of multi-tab-l1 launched by chat C-2026-11-06-2333)
Lane: full (merge; 1 conflict: `docs/log-inbox/multi-tab.md` measured)
Status: eseguito 2026-11-07 · lane merge · 04b782a5b · verifica visiva passata 2026-11-07 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0231 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6cc4d86e3`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l1` into the trunk with one merge commit, `--no-ff`, of the explicit sha `842094952`, in the shape of `07d20a2f5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f4c031b3e`. The branch carries, on top of the base, 3 commits:

- `842094952` docs: align the multi-tab inbox with the trunk before the L1 merge
- `07793a472` docs: Status flip and log entry for multi-tab lane L1 (P-2026-11-07-0105)
- `d9949895c` fix(tabs): a model tab stops rewriting other tabs' viewpoint (P-2026-11-07-0105)

The trunk carries, since the base, 14 commits:

- `6cc4d86e3` docs: close the F discovery merge by hand, R-TXT-55 provisional
- `07d20a2f5` merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)
- `47b7b514f` docs: add prompt P-2026-11-07-0116, merge textual-f-jjel-tracing into alfonso-frontend-jjtl
- `c8b568e56` docs: Status flip and log entry for the multi-tab merge (P-2026-11-07-0041)
- `073fa7806` docs: Status flip and log entry for the step F discovery (P-2026-11-06-2357)
- `ee0ba5a0f` docs(codegen): step F discovery, lane plan, decisions, risks (P-2026-11-06-2357)
- `f80ff0010` docs(codegen): step F discovery, critical zone (P-2026-11-06-2357)
- `d91b30bd6` docs(codegen): step F discovery, T8 (P-2026-11-06-2357)
- `74e824626` docs(codegen): step F discovery, tracing (P-2026-11-06-2357)
- `5761792b0` docs(codegen): step F discovery, JjEL islands, probe (P-2026-11-06-2357)
- `a18c4bca3` docs(codegen): step F discovery, where JjEL lives (P-2026-11-06-2357)
- `c9e28ffc6` docs(codegen): step F discovery, files read (P-2026-11-06-2357)
- `afd1b3138` docs(codegen): step F discovery, header and hypotheses (P-2026-11-06-2357)
- `6b38a1318` docs: add prompt P-2026-11-06-2357, step F discovery

Measured by `lane-run merge` at 2026-11-07 02:31, trunk at `6cc4d86e3`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 842094952`: 1 conflict: `docs/log-inbox/multi-tab.md`.
- Files changed since the base: 5 on the branch side, 7 on the trunk side; on both sides: `docs/log-inbox/multi-tab.md`.
- `git diff --name-only f4c031b3e 842094952 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `multi-tab-l1` in `/Users/alfonso/jjodel-w-mtl1`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** `lane-run merge --direct` fell back:

- a probe does not hold on the resolved merge: the heading `## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)` 2 times in docs/log-inbox/multi-tab.md

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `842094952` is the tip of `multi-tab-l1`; the prompt files of the branch read `Status: eseguito` at `842094952`; `git worktree list` shows `multi-tab-l1` only in `/Users/alfonso/jjodel-w-mtl1`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 842094952` (measured above: 1 conflict: `docs/log-inbox/multi-tab.md`). `git diff --name-only f4c031b3e 842094952 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f4c031b3e alfonso-frontend-jjtl` with `git diff --name-only f4c031b3e 842094952` (measured above: `docs/log-inbox/multi-tab.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-55` (trunk); control: `- **R-TXT-56**` none.
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)` once (both sides).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a model tab stops rewriting the viewpoint of the other open tabs` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — docs: step F discovery, embedded JjEL and tracing (P-2026-11-06-2357)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)` once (trunk).
4. `git merge --no-ff --no-commit 842094952`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `842094952` in `/Users/alfonso/jjodel-w-mtl1`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl1`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6cc4d86e3` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 6cc4d86e3 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l1 merge (P-2026-11-07-0231)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl1`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

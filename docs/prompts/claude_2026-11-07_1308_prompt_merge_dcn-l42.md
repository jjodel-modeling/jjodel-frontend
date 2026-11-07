# Prompt: merge dcn-l42 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-1308
Chat: C-2026-11-06-2159
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (merge of dcn-l42 launched by chat C-2026-11-06-2159)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1308 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `9d3a79c22`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `dcn-l42` into the trunk with one merge commit, `--no-ff`, of the explicit sha `178c1c837`, in the shape of `02c2ff850` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `730763ebb`. The branch carries, on top of the base, 8 commits:

- `178c1c837` merge: dcn-l34 into dcn-l42 (d0a81202d)
- `d0a81202d` docs(dcn): Status flip and log entry for the L3.4 slot writes (P-2026-11-07-1215)
- `5d86470c9` feat(jjel): slot writes `self.battery := e` in a DCN action mode (P-2026-11-07-1215)
- `9e36d009a` docs(dcn): L4.2 log entry and Status flip (P-2026-11-07-1216)
- `839affc1a` fix(sim): under the dcn shape the roles dialog shows the dcn group only (P-2026-11-07-1216)
- `a5bef0684` feat(sim): the DCN compiler, roles and model to a placeless net (P-2026-11-07-1216)
- `0d689a2e6` docs(dcn): l42 prompt (P-2026-11-07-1216)
- `a08d9588b` docs(dcn): l34 prompt (P-2026-11-07-1215)

The trunk carries, since the base, 16 commits:

- `9d3a79c22` docs: prompt P-2026-11-07-1249, multi-tab lane L3
- `7e44b15ae` docs: Status flip and log entry for the multi-tab-l2 merge (P-2026-11-07-1210)
- `02c2ff850` merge: multi-tab-l2 into alfonso-frontend-jjtl (P-2026-11-07-1210)
- `dcd7ed29d` merge: alfonso-frontend-jjtl into multi-tab-l2 before the L2 merge
- `9a42beef3` docs: align the multi-tab inbox with the trunk before the L2 merge
- `e225f7000` docs: multi-tab L2 focus write without undo entry, closure (P-2026-11-07-0935)
- `1acbbdf99` fix(multi-tab): a batch of only noUndo writes adds no undo entry (P-2026-11-07-0935)
- `d16f662ac` test(multi-tab): a batch of flagged writes adds no undo entry, red (P-2026-11-07-0935)
- `8ab8077be` feat(multi-tab): focus write adds no undo entry (P-2026-11-07-0935)
- `9b9e9b103` test(multi-tab): focus write adds no undo entry, red (P-2026-11-07-0935)
- `b03625106` docs: prompt P-2026-11-07-0935, L2 focus write without undo entry
- `e0a19596d` docs: multi-tab L2 app check, LIR addendum, closure (P-2026-11-07-0457)
- `cec8db8a6` docs: prompt P-2026-11-07-0457, L2 app check and closure
- `a99ea2482` feat(multi-tab): per-tab viewpoint plumbing, R-MT-18 restore (P-2026-11-07-0440)
- `2f1f166b8` test(multi-tab): tab layout key, tab init, saved abstract syntax, red (P-2026-11-07-0440)
- `029d1ea4e` docs: LIR of multi-tab L2, per-tab viewpoint plumbing (P-2026-11-07-0440)

Measured by `lane-run merge` at 2026-11-07 13:08, trunk at `9d3a79c22`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 178c1c837`: zero conflicts.
- Files changed since the base: 12 on the branch side, 19 on the trunk side; on both sides: none.
- `git diff --name-only 730763ebb 178c1c837 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_1215_prompt_dcn_l34_slot_writes.md` (eseguito 2026-11-07 · lane full · 5d86470c9 · bench 14/14 killed · verifica visiva non applicabile (no visual check owed)), `claude_2026-11-07_1216_prompt_dcn_l42_compiler.md` (eseguito 2026-11-07 · lane full · a5bef0684, 839affc1a · bench 25/26 and 3/3 · no visual check owed (closure written by the chat C-2026-11-06-2159 from the handoff after the context ceiling)).
- `git worktree list`: `dcn-l42` in `/Users/alfonso/jjodel-w-dcn-l42`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `178c1c837` is the tip of `dcn-l42`; the prompt files of the branch read `Status: eseguito` at `178c1c837`; `git worktree list` shows `dcn-l42` only in `/Users/alfonso/jjodel-w-dcn-l42`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 178c1c837` (measured above: zero conflicts). `git diff --name-only 730763ebb 178c1c837 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 730763ebb alfonso-frontend-jjtl` with `git diff --name-only 730763ebb 178c1c837` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the DCN compiler, resolved roles and model to a placeless net` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: slot writes `self.battery := e` in a DCN action mode` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: per-tab viewpoint plumbing, saved abstract syntax restored (multi-tab L2)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: the viewpoint write on tab focus adds no undo entry (multi-tab L2)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l2 into alfonso-frontend-jjtl (P-2026-11-07-1210)` once (trunk).
4. `git merge --no-ff --no-commit 178c1c837`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: dcn-l42 into alfonso-frontend-jjtl (P-2026-11-07-1308)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `178c1c837` in `/Users/alfonso/jjodel-w-dcn-l42`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-dcn-l42`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 9d3a79c22` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 9d3a79c22 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the dcn-l42 merge (P-2026-11-07-1308)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-dcn-l42`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

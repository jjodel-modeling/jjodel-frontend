# Prompt: merge textual-t8a-ids into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0152
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-t8a-ids launched by chat C-2026-11-03-1037)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0152 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `90cd28003`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-t8a-ids` into the trunk with one merge commit, `--no-ff`, of the explicit sha `48e139de3`, in the shape of `3da1b61e7` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `05f5a9057`. The branch carries, on top of the base, 6 commits:

- `48e139de3` docs: Status flip and log entry for T8a (P-2026-11-08-0121)
- `c62312a02` feat(codegen): T8a, the id in the text as evidence 0 of the match (P-2026-11-08-0121)
- `388a2d2b9` feat(codegen): T8a, read the id comments back from the tree (P-2026-11-08-0121)
- `d9ac37c51` feat(codegen): T8a, ids in the text as a head-line comment (P-2026-11-08-0121)
- `bed4908a1` docs: renumber the T8a prompt to P-2026-11-08-0121 (0057 was taken by the dcn chat)
- `d5d5e777b` docs: add prompt P-2026-11-08-0057, T8a ids in the text

The trunk carries, since the base, 22 commits:

- `90cd28003` docs: Status flip and log entry for the textual-f2-reveal merge (P-2026-11-08-0122)
- `db65de069` docs: renumber the L4 prompt to P-2026-11-08-0131 (0125 taken by another chat's lane)
- `9805e9d33` docs: prompt P-2026-11-08-0125, multi-tab L4 populate owner
- `3da1b61e7` merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)
- `d50e0e265` docs: add prompt P-2026-11-08-0122, merge textual-f2-reveal into alfonso-frontend-jjtl
- `f476d9e83` docs: Status flip and log entry for F2 (P-2026-11-08-0027)
- `2375441e3` docs: Status flip and log entry for the dcn-conf merge (P-2026-11-08-0040)
- `28e16543b` docs: Status flip and log entry for the multi-tab-l5 merge (P-2026-11-08-0055)
- `46554f772` merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)
- `9d2050879` feat(codegen): F2, the Text tab reveals a generated span's origin (P-2026-11-08-0027)
- `5bcafa843` docs: Status flip and log entry, multi-tab-l5 took the trunk (P-2026-11-08-0012)
- `3235f9e73` feat(codegen): F2, a model span click dispatches TEXTUAL_REVEAL (P-2026-11-08-0027)
- `1e84a9440` feat(events): F2, TEXTUAL_REVEAL in the registry (P-2026-11-08-0027)
- `b4ebab7ab` feat(codegen): F2, revealedRange, a span's origin to its line (P-2026-11-08-0027)
- `5ffbc6058` docs: add prompt P-2026-11-08-0027, F2 generated line to model line
- `f2b5d1934` merge: multi-tab-l5 takes alfonso-frontend-jjtl (P-2026-11-08-0012)
- `ddf8631ef` docs: add prompt P-2026-11-08-0012, merge alfonso-frontend-jjtl into multi-tab-l5
- `73e6441fd` docs: multi-tab L5 app check, log entry and Status (P-2026-11-07-1730)
- `3bb82e75e` docs: prompt P-2026-11-07-1730, multi-tab L5 check and closure
- `f2ddead3d` feat(editor-v2): IR resolution follows the tab's viewpoint (P-2026-11-07-1516)
- `7b3cf6d2a` test(editor-v2): IR resolution by the tab's viewpoint, red (P-2026-11-07-1516)
- `a87146a64` docs: Layer Impact Report for multi-tab L5, IR resolution by tab (P-2026-11-07-1516)

Measured by `lane-run merge` at 2026-11-08 01:52, trunk at `90cd28003`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 48e139de3`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 6 on the branch side, 28 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 05f5a9057 48e139de3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0121_prompt_textual_t8a_ids.md` (eseguito 2026-11-08 · lane full · d9ac37c51, 388a2d2b9, c62312a02 (red first, bench 13/13) · gates green (vitest: 3 import reds baseline) · no visual change, no crops · log entry in docs/log-inbox/codegen.md, uncommitted (RC-17)).
- `git worktree list`: `textual-t8a-ids` in `/Users/alfonso/jjodel-w-textt8a`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-0152/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `48e139de3` is the tip of `textual-t8a-ids`; the prompt files of the branch read `Status: eseguito` at `48e139de3`; `git worktree list` shows `textual-t8a-ids` only in `/Users/alfonso/jjodel-w-textt8a`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 48e139de3` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 05f5a9057 48e139de3 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 05f5a9057 alfonso-frontend-jjtl` with `git diff --name-only 05f5a9057 48e139de3` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8a, ids in the text and evidence 0 of the match (P-2026-11-08-0121)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): F2, a generated line to the model line in the Text tab (P-2026-11-08-0027)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-conf into alfonso-frontend-jjtl (P-2026-11-08-0040)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: IR resolution follows the tab's viewpoint (multi-tab L5)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — ticket: publishedChannelSlots is one module-level list for every IR canvas` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l5 (P-2026-11-08-0012)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)` once (trunk).
4. `git merge --no-ff --no-commit 48e139de3`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-t8a-ids into alfonso-frontend-jjtl (P-2026-11-08-0152)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `48e139de3` in `/Users/alfonso/jjodel-w-textt8a`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textt8a`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 90cd28003` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 90cd28003 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-t8a-ids merge (P-2026-11-08-0152)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textt8a`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

# Prompt: merge jjtl-kernel-gaps into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0229
Chat: C-2026-11-03-1202
Request: https://claude.ai/code/session_01DQt9R5EJe1reXq5Xut2Jif (merge of jjtl-kernel-gaps launched by chat C-2026-11-03-1202)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-08 · merge e7605a490 · gate check:docs red only on Check C of docs/log-inbox/dcn.md:320 (another front, Notes 505 chars), not this branch; closed by hand, no go on a blocked merge

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0229 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `21e7da758`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-kernel-gaps` into the trunk with one merge commit, `--no-ff`, of the explicit sha `cab1bc1c4`, in the shape of `21e7da758` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d50e0e265`. The branch carries, on top of the base, 3 commits:

- `cab1bc1c4` docs: Status flip and log entry for the kernel gaps discovery (P-2026-11-08-0125)
- `5ce412df7` docs: discovery of the JjTL gaps on the Brief kernel (P-2026-11-08-0125)
- `23c28c21f` docs: add prompt P-2026-11-08-0125, JjTL gaps on the generic Brief transformation

The trunk carries, since the base, 26 commits:

- `21e7da758` merge: dcn-l25 into alfonso-frontend-jjtl (P-2026-11-08-0154)
- `c8153d84a` docs: Status flip and log entry for the textual-t8a-ids merge (P-2026-11-08-0152)
- `94a55a92d` merge: textual-t8a-ids into alfonso-frontend-jjtl (P-2026-11-08-0152)
- `89c58711d` docs: add prompt P-2026-11-08-0154, merge dcn-l25 into alfonso-frontend-jjtl
- `8329dbbb3` docs: add prompt P-2026-11-08-0152, merge textual-t8a-ids into alfonso-frontend-jjtl
- `48e139de3` docs: Status flip and log entry for T8a (P-2026-11-08-0121)
- `a42645aa5` docs(dcn): L2.5 drone object diagram log entry, Status flips (P-2026-11-08-0057)
- `a6c855081` docs(dcn): drone measures and object diagram screenshot (P-2026-11-08-0011)
- `f097a2847` test(dcn): drone object diagram on R-OI instantiation (P-2026-11-08-0011)
- `90cd28003` docs: Status flip and log entry for the textual-f2-reveal merge (P-2026-11-08-0122)
- `c62312a02` feat(codegen): T8a, the id in the text as evidence 0 of the match (P-2026-11-08-0121)
- `388a2d2b9` feat(codegen): T8a, read the id comments back from the tree (P-2026-11-08-0121)
- `d9ac37c51` feat(codegen): T8a, ids in the text as a head-line comment (P-2026-11-08-0121)
- `db65de069` docs: renumber the L4 prompt to P-2026-11-08-0131 (0125 taken by another chat's lane)
- `9805e9d33` docs: prompt P-2026-11-08-0125, multi-tab L4 populate owner
- `3da1b61e7` merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)
- `bed4908a1` docs: renumber the T8a prompt to P-2026-11-08-0121 (0057 was taken by the dcn chat)
- `f476d9e83` docs: Status flip and log entry for F2 (P-2026-11-08-0027)
- `d5d5e777b` docs: add prompt P-2026-11-08-0057, T8a ids in the text
- `e77b4ed8c` docs(dcn): prompt P-2026-11-08-0057
- `9d2050879` feat(codegen): F2, the Text tab reveals a generated span's origin (P-2026-11-08-0027)
- `3235f9e73` feat(codegen): F2, a model span click dispatches TEXTUAL_REVEAL (P-2026-11-08-0027)
- `1e84a9440` feat(events): F2, TEXTUAL_REVEAL in the registry (P-2026-11-08-0027)
- `b4ebab7ab` feat(codegen): F2, revealedRange, a span's origin to its line (P-2026-11-08-0027)
- `5ffbc6058` docs: add prompt P-2026-11-08-0027, F2 generated line to model line
- `2a433667e` docs(dcn): prompt P-2026-11-08-0011

Measured by `lane-run merge` at 2026-11-08 02:29, trunk at `21e7da758`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl cab1bc1c4`: zero conflicts.
- Files changed since the base: 3 on the branch side, 23 on the trunk side; on both sides: none.
- `git diff --name-only d50e0e265 cab1bc1c4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0125_prompt_jjtl_kernel_gaps_discovery.md` (eseguito 2026-11-08 · report 5ce412df7 · discovery only, 7 questions for Alfonso).
- `git worktree list`: `jjtl-kernel-gaps` in `/Users/alfonso/jjodel-w-kgaps`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-0229/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `cab1bc1c4` is the tip of `jjtl-kernel-gaps`; the prompt files of the branch read `Status: eseguito` at `cab1bc1c4`; `git worktree list` shows `jjtl-kernel-gaps` only in `/Users/alfonso/jjodel-w-kgaps`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl cab1bc1c4` (measured above: zero conflicts). `git diff --name-only d50e0e265 cab1bc1c4 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d50e0e265 alfonso-frontend-jjtl` with `git diff --name-only d50e0e265 cab1bc1c4` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — discovery: JjTL gaps on the generic Brief transformation (P-2026-11-08-0125)` once (branch).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: a JjTL demand used as a value gives a wrong target and success true` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): F2, a generated line to the model line in the Text tab (P-2026-11-08-0027)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8a, ids in the text and evidence 0 of the match (P-2026-11-08-0121)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8a-ids into alfonso-frontend-jjtl (P-2026-11-08-0152)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone object diagram on R-OI instantiation (P-2026-11-08-0011, P-2026-11-08-0057)` once (trunk).
4. `git merge --no-ff --no-commit cab1bc1c4`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-kernel-gaps into alfonso-frontend-jjtl (P-2026-11-08-0229)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `cab1bc1c4` in `/Users/alfonso/jjodel-w-kgaps`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-kgaps`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 21e7da758` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 21e7da758 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-kernel-gaps merge (P-2026-11-08-0229)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-kgaps`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

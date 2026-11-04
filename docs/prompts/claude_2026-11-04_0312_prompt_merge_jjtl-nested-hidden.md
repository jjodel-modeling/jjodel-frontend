# Prompt: merge jjtl-nested-hidden into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-0312
Chat: C-2026-11-03-2317
Request: https://claude.ai/code/session_01DQt9R6hbytx4vz5aAdzQ8i (merge of jjtl-nested-hidden launched by chat C-2026-11-03-2317)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-0312 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `1f58fece6`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-nested-hidden` into the trunk with one merge commit, `--no-ff`, of the explicit sha `93e82ab1e`, in the shape of `2f35ce2c5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `8411cfae5`. The branch carries, on top of the base, 3 commits:

- `93e82ab1e` docs: R-JTG-17 nested case, SPEC §10, log entry (P-2026-11-04-0255)
- `d52a89f99` fix(jjtl): nested missing class is an error; hidden tab not busy (P-2026-11-04-0255)
- `d2a51dc1b` docs: add prompt P-2026-11-04-0255, nested missing class and hidden tab

The trunk carries, since the base, 28 commits:

- `1f58fece6` docs: Status flip and log entry for the textual-b-navigation merge (P-2026-11-04-0250)
- `2f35ce2c5` merge: textual-b-navigation into alfonso-frontend-jjtl (P-2026-11-04-0250)
- `689fd6db2` docs: Status of the step B discovery prompt; drop a duplicated inbox entry left by a cherry-pick
- `652eaf457` docs: Alfonso's GO on the crops of step B (2026-11-04 02:49)
- `b4cdc93cb` docs: log entry and Status flips of step B2, crops checked by the chat (P-2026-11-04-0125, P-2026-11-04-0146)
- `e64b95c02` fix(codegen): Text tab folding margin fits the 30 px (P-2026-11-04-0146)
- `8cfd25833` fix(codegen): Text tab hover no longer clipped (P-2026-11-04-0146)
- `55b5ff562` docs: add prompt P-2026-11-04-0146, step B2 closure
- `e482a33d7` feat(codegen): trusted command links in the Text tab hover (P-2026-11-04-0125)
- `f7b094494` feat(codegen): Text tab outline and breadcrumb (P-2026-11-04-0125)
- `fc5e898b6` feat(codegen): outline with group nodes and C4' labels (P-2026-11-04-0125)
- `69bd03a65` docs: add prompt P-2026-11-04-0125, step B2 outline and breadcrumb
- `a31be0101` docs: log entry and Status for textual step B2 discovery (P-2026-11-04-0021)
- `1ecab6736` docs(codegen): textual step B2 discovery, outline and hover card (P-2026-11-04-0005)
- `52ca42a69` docs: log entry, ticket and Status flips of step B1, crops checked by the chat (P-2026-11-04-0046)
- `87743a3ba` style(codegen): names and references in cyan-600 for contrast on white (P-2026-11-04-0046)
- `5aa54693b` docs: add prompt P-2026-11-04-0046, step B1 closure
- `52154bc57` test(codegen): language service tests closed on a mutation bench (P-2026-11-04-0020)
- `fad04693b` feat(codegen): the hover reads bounds and GenModel docs off the lookup (P-2026-11-04-0020)
- `3423b9f1f` feat(codegen): Monaco providers and theme for the Text tab, step B1 (P-2026-11-04-0020)
- `7cadcae54` feat(codegen): the language service of the Text tab, step B1 (P-2026-11-04-0020)
- `38baf45d2` docs: add prompt P-2026-11-04-0020, step B1 continuation
- `b039ce08d` docs: add prompt P-2026-11-03-2350, step B1 language service and providers
- `92b0ff5ff` docs: log entry and Status for the paste-back spans fix, crops checked (P-2026-11-03-2326)
- `b57178053` fix(codegen): a pasted-back text gets its agreed spans back (P-2026-11-03-2326)
- `16da9a1a2` docs: add prompt P-2026-11-03-2326, pasted-back text keeps its spans
- `85abf3dc4` docs: discovery of the Text tab language service, step B phase 1 (P-2026-11-03-2300)
- `914becadd` docs: add prompt P-2026-11-03-2300, step B language service and navigation

Measured by `lane-run merge` at 2026-11-04 03:12, trunk at `1f58fece6`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 93e82ab1e`: zero conflicts.
- Files changed since the base: 9 on the branch side, 43 on the trunk side; on both sides: none.
- `git diff --name-only 8411cfae5 93e82ab1e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_0255_prompt_jjtl_nested_hidden.md` (eseguito 2026-11-04 · lane full · d52a89f99 · app probe on a nested missing class, nothing written, control 27; no visual check by hand (unattended)).
- `git worktree list`: `jjtl-nested-hidden` in `/Users/alfonso/jjodel-w-jjtlnested`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-0312/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `93e82ab1e` is the tip of `jjtl-nested-hidden`; the prompt files of the branch read `Status: eseguito` at `93e82ab1e`; `git worktree list` shows `jjtl-nested-hidden` only in `/Users/alfonso/jjodel-w-jjtlnested`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 93e82ab1e` (measured above: zero conflicts). `git diff --name-only 8411cfae5 93e82ab1e -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 8411cfae5 alfonso-frontend-jjtl` with `git diff --name-only 8411cfae5 93e82ab1e` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-04 — fix(jjtl): nested missing class is an error; hidden tab does not hold the undo group (P-2026-11-04-0255)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-03 — fix(codegen): a pasted-back text gets its agreed spans back (P-2026-11-03-2326)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — feat(codegen): Text tab language service checked in the app, step B1 closure (P-2026-11-04-0046)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — ticket: the Text tab hover clips its last characters` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — discovery(codegen): textual step B2, outline groups, unnamed labels, hover card (P-2026-11-04-0005, P-2026-11-04-0021)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — feat(codegen): Text tab outline, breadcrumb, hover links, hover box and folding margin, step B2 (P-2026-11-04-0125, P-2026-11-04-0146)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — merge: textual-b-navigation into alfonso-frontend-jjtl (P-2026-11-04-0250)` once (trunk).
4. `git merge --no-ff --no-commit 93e82ab1e`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-nested-hidden into alfonso-frontend-jjtl (P-2026-11-04-0312)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `93e82ab1e` in `/Users/alfonso/jjodel-w-jjtlnested`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-jjtlnested`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 1f58fece6` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 1f58fece6 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-nested-hidden merge (P-2026-11-04-0312)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjtlnested`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

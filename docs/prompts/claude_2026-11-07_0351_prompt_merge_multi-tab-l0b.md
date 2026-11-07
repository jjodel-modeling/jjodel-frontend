# Prompt: merge multi-tab-l0b into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0351
Chat: C-2026-11-06-2333
Request: https://claude.ai/code/session_01DQt9R7EZZv9MmGKpjvzZWx (merge of multi-tab-l0b launched by chat C-2026-11-06-2333)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0351 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `275486660`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l0b` into the trunk with one merge commit, `--no-ff`, of the explicit sha `35c755768`, in the shape of `5e1179252` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `f4c031b3e`. The branch carries, on top of the base, 2 commits:

- `35c755768` docs: Status flip of P-2026-11-07-0106
- `dcb988216` docs(discovery): layout switch regression after 242a82bcd confirmed (P-2026-11-07-0106)

The trunk carries, since the base, 37 commits:

- `275486660` docs: Status flip and log entry for the multi-tab-l1 merge (P-2026-11-07-0231)
- `ffeeb07a8` docs: close the D3a+D3b merge by hand, ticket #656, R-TXT-56 provisional
- `5e1179252` merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)
- `5454be7db` docs(sessioni): instance-of undo groups, S2u..S3b rebuilt (C-2026-10-25-2159)
- `a28b49cc8` docs: add prompt P-2026-11-07-0250, merge textual-d-writing-aids into alfonso-frontend-jjtl
- `04b782a5b` merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)
- `9d7365544` docs: Status flip and log entry for D3b (P-2026-11-07-0157)
- `7bea73d1c` docs: add prompt P-2026-11-07-0231, merge multi-tab-l1 into alfonso-frontend-jjtl
- `842094952` docs: align the multi-tab inbox with the trunk before the L1 merge
- `90d1c79b6` feat(codegen): D3b (2), conformance violations as markers (P-2026-11-07-0157)
- `4bae15ec2` feat(codegen): D3b (1), D3a fixes as quick fixes (P-2026-11-07-0157)
- `d56eba8a2` docs: add prompt P-2026-11-07-0157, D3b, quick fixes and conformance markers
- `b6c040013` docs: close the trunk-into of textual-d-writing-aids by hand (P-2026-11-07-0117)
- `6cc4d86e3` docs: close the F discovery merge by hand, R-TXT-55 provisional
- `a4b4d551f` merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)
- `07d20a2f5` merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)
- `5158f1f1a` docs: add prompt P-2026-11-07-0117, merge alfonso-frontend-jjtl into textual-d-writing-aids
- `47b7b514f` docs: add prompt P-2026-11-07-0116, merge textual-f-jjel-tracing into alfonso-frontend-jjtl
- `07793a472` docs: Status flip and log entry for multi-tab lane L1 (P-2026-11-07-0105)
- `d9949895c` fix(tabs): a model tab stops rewriting other tabs' viewpoint (P-2026-11-07-0105)
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
- `8cf70e2ec` docs: Status flip and log entry for D3a (P-2026-11-06-2328)
- `99cb12a30` test(codegen): D3a (4), no fix without a shape; the corpus identity (P-2026-11-06-2328)
- `533eabcbc` feat(codegen): D3a (3), a misspelled keyword is replaced by a near one (P-2026-11-06-2328)
- `a9ff46da8` feat(codegen): D3a (2), near names for an unknown reference (P-2026-11-06-2328)
- `dcccb1d16` feat(codegen): D3a (1), a missing token carries its insert fix (P-2026-11-06-2328)
- `a16a8c45f` docs: add prompt P-2026-11-06-2328, D3a, structured fixes on parse errors

Measured by `lane-run merge` at 2026-11-07 03:51, trunk at `275486660`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 35c755768`: zero conflicts.
- Files changed since the base: 2 on the branch side, 23 on the trunk side; on both sides: none.
- `git diff --name-only f4c031b3e 35c755768 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `multi-tab-l0b` in `/Users/alfonso/jjodel-w-mtl0b`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0351/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `35c755768` is the tip of `multi-tab-l0b`; the prompt files of the branch read `Status: eseguito` at `35c755768`; `git worktree list` shows `multi-tab-l0b` only in `/Users/alfonso/jjodel-w-mtl0b`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 35c755768` (measured above: zero conflicts). `git diff --name-only f4c031b3e 35c755768 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only f4c031b3e alfonso-frontend-jjtl` with `git diff --name-only f4c031b3e 35c755768` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-55` (trunk), `R-TXT-56` (trunk); control: `- **R-TXT-57**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — docs: step F discovery, embedded JjEL and tracing (P-2026-11-06-2357)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D3a, structured fixes on parse errors (P-2026-11-06-2328)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3b, quick fixes and conformance markers (P-2026-11-07-0157)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: Objects created on the canvas (and by the create command) leave the name slot empty` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a model tab stops rewriting the viewpoint of the other open tabs` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)` once (trunk).
4. `git merge --no-ff --no-commit 35c755768`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l0b into alfonso-frontend-jjtl (P-2026-11-07-0351)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `35c755768` in `/Users/alfonso/jjodel-w-mtl0b`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl0b`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 275486660` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 275486660 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to none), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l0b merge (P-2026-11-07-0351)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl0b`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

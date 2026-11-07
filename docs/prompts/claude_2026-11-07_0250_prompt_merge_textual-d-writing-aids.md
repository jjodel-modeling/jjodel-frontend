# Prompt: merge textual-d-writing-aids into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0250
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0250 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `04b782a5b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-d-writing-aids` into the trunk with one merge commit, `--no-ff`, of the explicit sha `9d7365544`, in the shape of `04b782a5b` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `47b7b514f`. The branch carries, on top of the base, 13 commits:

- `9d7365544` docs: Status flip and log entry for D3b (P-2026-11-07-0157)
- `90d1c79b6` feat(codegen): D3b (2), conformance violations as markers (P-2026-11-07-0157)
- `4bae15ec2` feat(codegen): D3b (1), D3a fixes as quick fixes (P-2026-11-07-0157)
- `d56eba8a2` docs: add prompt P-2026-11-07-0157, D3b, quick fixes and conformance markers
- `b6c040013` docs: close the trunk-into of textual-d-writing-aids by hand (P-2026-11-07-0117)
- `a4b4d551f` merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)
- `5158f1f1a` docs: add prompt P-2026-11-07-0117, merge alfonso-frontend-jjtl into textual-d-writing-aids
- `8cf70e2ec` docs: Status flip and log entry for D3a (P-2026-11-06-2328)
- `99cb12a30` test(codegen): D3a (4), no fix without a shape; the corpus identity (P-2026-11-06-2328)
- `533eabcbc` feat(codegen): D3a (3), a misspelled keyword is replaced by a near one (P-2026-11-06-2328)
- `a9ff46da8` feat(codegen): D3a (2), near names for an unknown reference (P-2026-11-06-2328)
- `dcccb1d16` feat(codegen): D3a (1), a missing token carries its insert fix (P-2026-11-06-2328)
- `a16a8c45f` docs: add prompt P-2026-11-06-2328, D3a, structured fixes on parse errors

The trunk carries, since the base, 17 commits:

- `04b782a5b` merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)
- `7bea73d1c` docs: add prompt P-2026-11-07-0231, merge multi-tab-l1 into alfonso-frontend-jjtl
- `842094952` docs: align the multi-tab inbox with the trunk before the L1 merge
- `6cc4d86e3` docs: close the F discovery merge by hand, R-TXT-55 provisional
- `07d20a2f5` merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)
- `07793a472` docs: Status flip and log entry for multi-tab lane L1 (P-2026-11-07-0105)
- `d9949895c` fix(tabs): a model tab stops rewriting other tabs' viewpoint (P-2026-11-07-0105)
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

Measured by `lane-run merge` at 2026-11-07 02:50, trunk at `04b782a5b`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9d7365544`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 10 on the branch side, 11 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 47b7b514f 9d7365544 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-06_2328_prompt_textual_d3a_fixes.md` (eseguito 2026-11-06 · lane full · dcccb1d16..99cb12a30 · gates green · no visual check (parser only) · log entry in docs/log-inbox/codegen.md), `claude_2026-11-07_0117_prompt_textual-d-writing-aids_take_trunk.md` (eseguito 2026-11-07 · direct merge a4b4d551f · vitest reds by load (languageService budget, tolerant (v) and (x), irCollapsedRender, irSelectionRing; 121/121 alone), resolved 01:51 · closed by hand: lane-run go refuses a blocked merge), `claude_2026-11-07_0157_prompt_textual_d3b_actions.md` (eseguito 2026-11-07 · lane full · 4bae15ec2..90d1c79b6 · gates green · app check ALL PASS, crops in ~/.jjodel-lanes/P-2026-11-07-0157/ · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-d-writing-aids` in `/Users/alfonso/jjodel-w-textd`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0250/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `9d7365544` is the tip of `textual-d-writing-aids`; the prompt files of the branch read `Status: eseguito` at `9d7365544`; `git worktree list` shows `textual-d-writing-aids` only in `/Users/alfonso/jjodel-w-textd`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 9d7365544` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 47b7b514f 9d7365544 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 47b7b514f alfonso-frontend-jjtl` with `git diff --name-only 47b7b514f 9d7365544` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-55` (trunk); control: `- **R-TXT-56**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D3a, structured fixes on parse errors (P-2026-11-06-2328)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3b, quick fixes and conformance markers (P-2026-11-07-0157)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — docs: step F discovery, embedded JjEL and tracing (P-2026-11-06-2357)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a model tab stops rewriting the viewpoint of the other open tabs` once (trunk).
4. `git merge --no-ff --no-commit 9d7365544`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `9d7365544` in `/Users/alfonso/jjodel-w-textd`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textd`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 04b782a5b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 04b782a5b HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-d-writing-aids merge (P-2026-11-07-0250)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textd`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

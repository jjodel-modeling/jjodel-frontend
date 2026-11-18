# Prompt: merge textual-name-slot into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-0443
Chat: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH
Request: none (rendered by lane-run, no chat URL known for https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH)
Lane: full (merge; 1 conflict: `docs/log-inbox/codegen.md` measured)
Status: eseguito 2026-11-07 · lane merge · 1d4ca6039 · verifica visiva passata 2026-11-07 (name-slot crop text-tab-cpu-no-warning.png in ~/.jjodel-lanes/P-2026-11-07-0344/ checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-0443 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `69c191631`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-name-slot` into the trunk with one merge commit, `--no-ff`, of the explicit sha `5b9953e38`, in the shape of `38f2f079d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `04b782a5b`. The branch carries, on top of the base, 10 commits:

- `5b9953e38` docs: Status flip and log entry for the name-slot fix (P-2026-11-07-0344)
- `fe6f81bc7` fix(codegen): «New model from text» writes every name slot (P-2026-11-07-0344)
- `acebac08a` fix(codegen): a text edit writes the name slot of a created object (P-2026-11-07-0344)
- `e67a878ae` docs: add prompt P-2026-11-07-0344, write the name slot of an object created from text
- `5099fcf83` docs: Status flip and log entry for the name-slot discovery (P-2026-11-07-0253)
- `55d88a441` docs(discovery): textual name slot, lane plan, N1..N5, risks (P-2026-11-07-0253)
- `3fbfc3141` docs(discovery): textual name slot, the trace and the cause (P-2026-11-07-0253)
- `db49b0bb6` docs(discovery): textual name slot, the reproduction (P-2026-11-07-0253)
- `dac574b7c` docs(discovery): textual name slot, objective and hypotheses (P-2026-11-07-0253)
- `e47437874` docs: add prompt P-2026-11-07-0253, the empty name slot of a model created from text, discovery

The trunk carries, since the base, 26 commits:

- `69c191631` docs: prompt P-2026-11-07-0440, multi-tab lane L2
- `753122b0b` docs: multi-tab front to chat C-2026-11-07-0425, prompts 0430 and 0431
- `694cb85f4` docs: Alfonso ratifies R-MT-1 and R-MT-5..19
- `396631546` docs: close the multi-tab-l0b merge by hand, R-MT-18..19, checkpoint
- `38f2f079d` merge: multi-tab-l0b into alfonso-frontend-jjtl (P-2026-11-07-0351)
- `99c866a9c` docs: add prompt P-2026-11-07-0351, merge multi-tab-l0b into alfonso-frontend-jjtl
- `275486660` docs: Status flip and log entry for the multi-tab-l1 merge (P-2026-11-07-0231)
- `ffeeb07a8` docs: close the D3a+D3b merge by hand, ticket #656, R-TXT-56 provisional
- `5e1179252` merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)
- `5454be7db` docs(sessioni): instance-of undo groups, S2u..S3b rebuilt (C-2026-10-25-2159)
- `a28b49cc8` docs: add prompt P-2026-11-07-0250, merge textual-d-writing-aids into alfonso-frontend-jjtl
- `9d7365544` docs: Status flip and log entry for D3b (P-2026-11-07-0157)
- `90d1c79b6` feat(codegen): D3b (2), conformance violations as markers (P-2026-11-07-0157)
- `4bae15ec2` feat(codegen): D3b (1), D3a fixes as quick fixes (P-2026-11-07-0157)
- `d56eba8a2` docs: add prompt P-2026-11-07-0157, D3b, quick fixes and conformance markers
- `b6c040013` docs: close the trunk-into of textual-d-writing-aids by hand (P-2026-11-07-0117)
- `35c755768` docs: Status flip of P-2026-11-07-0106
- `dcb988216` docs(discovery): layout switch regression after 242a82bcd confirmed (P-2026-11-07-0106)
- `a4b4d551f` merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)
- `5158f1f1a` docs: add prompt P-2026-11-07-0117, merge alfonso-frontend-jjtl into textual-d-writing-aids
- `8cf70e2ec` docs: Status flip and log entry for D3a (P-2026-11-06-2328)
- `99cb12a30` test(codegen): D3a (4), no fix without a shape; the corpus identity (P-2026-11-06-2328)
- `533eabcbc` feat(codegen): D3a (3), a misspelled keyword is replaced by a near one (P-2026-11-06-2328)
- `a9ff46da8` feat(codegen): D3a (2), near names for an unknown reference (P-2026-11-06-2328)
- `dcccb1d16` feat(codegen): D3a (1), a missing token carries its insert fix (P-2026-11-06-2328)
- `a16a8c45f` docs: add prompt P-2026-11-06-2328, D3a, structured fixes on parse errors

Measured by `lane-run merge` at 2026-11-07 04:43, trunk at `69c191631`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5b9953e38`: 1 conflict: `docs/log-inbox/codegen.md`.
- Files changed since the base: 8 on the branch side, 23 on the trunk side; on both sides: `docs/log-inbox/codegen.md`.
- `git diff --name-only 04b782a5b 5b9953e38 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-07_0253_prompt_textual_name_slot_discovery.md` (eseguito 2026-11-07 · lane full · 55d88a441 · read only: report committed, hard stop for N1..N5), `claude_2026-11-07_0344_prompt_textual_name_slot_fix.md` (eseguito 2026-11-07 · lane full · acebac08a, fe6f81bc7 · gates green · app check 10/10 PASS, crop in ~/.jjodel-lanes/P-2026-11-07-0344/, visual GO pending · log entry in docs/log-inbox/codegen.md).
- `git worktree list`: `textual-name-slot` in `/Users/alfonso/jjodel-w-textns`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-07-0443/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `5b9953e38` is the tip of `textual-name-slot`; the prompt files of the branch read `Status: eseguito` at `5b9953e38`; `git worktree list` shows `textual-name-slot` only in `/Users/alfonso/jjodel-w-textns`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 5b9953e38` (measured above: 1 conflict: `docs/log-inbox/codegen.md`). `git diff --name-only 04b782a5b 5b9953e38 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 04b782a5b alfonso-frontend-jjtl` with `git diff --name-only 04b782a5b 5b9953e38` (measured above: `docs/log-inbox/codegen.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-56` (trunk), `R-MT-1` (trunk), `R-MT-5` (trunk), `R-MT-6` (trunk), `R-MT-7` (trunk), `R-MT-8` (trunk), `R-MT-9` (trunk), `R-MT-10` (trunk), `R-MT-11` (trunk), `R-MT-12` (trunk), `R-MT-13` (trunk), `R-MT-14` (trunk), `R-MT-15` (trunk), `R-MT-16` (trunk), `R-MT-17` (trunk), `R-MT-18` (trunk), `R-MT-19` (trunk); control: `- **R-MT-20**` none.
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: the empty raw name slot of an object created from text (P-2026-11-07-0253)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): the textual layer writes the name slot of an object it creates (P-2026-11-07-0344)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D3a, structured fixes on parse errors (P-2026-11-06-2328)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3b, quick fixes and conformance markers (P-2026-11-07-0157)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: Objects created on the canvas (and by the create command) leave the name slot empty` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l0b into alfonso-frontend-jjtl (P-2026-11-07-0351)` once (trunk).
4. `git merge --no-ff --no-commit 5b9953e38`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-name-slot into alfonso-frontend-jjtl (P-2026-11-07-0443)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `5b9953e38` in `/Users/alfonso/jjodel-w-textns`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textns`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 69c191631` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 69c191631 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-name-slot merge (P-2026-11-07-0443)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textns`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

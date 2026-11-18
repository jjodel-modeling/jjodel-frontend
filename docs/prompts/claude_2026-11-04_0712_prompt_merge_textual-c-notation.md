# Prompt: merge textual-c-notation into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-04-0712
Chat: C-2026-11-03-1037
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (merge of textual-c-notation launched by chat C-2026-11-03-1037)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-04 · lane merge · 4325ec678 · verifica visiva passata 2026-11-04 (crops c3a-* checked by the chat, RC-23, and by Alfonso, «go» 06:52; vitest red only on an environmental port clash in laneRun.test.ts, 145/145 alone twice)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-04-0712 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `26a0b21fa`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `textual-c-notation` into the trunk with one merge commit, `--no-ff`, of the explicit sha `7a0ae847b`, in the shape of `158f7eb76` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `26a0b21fa`. The branch carries, on top of the base, 20 commits:

- `7a0ae847b` docs: Status flip and log entry, textual-c-notation took the trunk (P-2026-11-04-0653)
- `df01f813c` merge: textual-c-notation takes alfonso-frontend-jjtl (P-2026-11-04-0653)
- `ba24f6dcb` docs: add prompt P-2026-11-04-0653, merge alfonso-frontend-jjtl into textual-c-notation
- `54abb3499` docs: Alfonso's GO on the style picker crops (2026-11-04 06:52)
- `206702a2d` docs: fix the Corregge and Causa fields of the C3a entry to the log grammar
- `3c088e86c` docs: log entry and Status flips of step C lane C3a, probe folder, crops checked by the chat (P-2026-11-04-0345, P-2026-11-04-0412)
- `7852e462b` feat(codegen): the style picker in the Text tab, step C3a (5) (P-2026-11-04-0412)
- `c6d22de51` feat(codegen): the corpus round-trips per style, step C3a (4) (P-2026-11-04-0412)
- `076b38d18` fix(codegen): a keyword-less feature prints no assign token (P-2026-11-04-0412)
- `7973bd825` docs: add prompt P-2026-11-04-0412, C3a continuation
- `794041be3` feat(codegen): a newline in a Pascal string, joined code, step C3a (3) (P-2026-11-04-0345)
- `0349387ef` feat(codegen): the syntax record names its style, step C3a (2) (P-2026-11-04-0345)
- `b4e6eae69` feat(codegen): Pascal/Ada in the style catalog, step C3a (1) (P-2026-11-04-0345)
- `0f6f7fa8b` docs: the step C probe reads the prototype folder from PROTO (P-2026-11-04-0345)
- `f50306d27` docs: add prompt P-2026-11-04-0345, step C lane C3a Pascal style and picker
- `476dec9b7` docs: Status flips and log entry for the step C discovery (P-2026-11-04-0330)
- `8906621a1` docs: step C discovery report, expression notation, T4b, T5 (P-2026-11-04-0330)
- `44421e1f2` docs: add prompt P-2026-11-04-0330, step C discovery report
- `d5e38cb8b` docs: step C discovery probe and its output, report pending (P-2026-11-04-0303)
- `2798d3a60` docs: add prompt P-2026-11-04-0303, step C discovery

The trunk carries, since the base, 0 commits:

- none

Measured by `lane-run merge` at 2026-11-04 07:12, trunk at `26a0b21fa`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7a0ae847b`: zero conflicts.
- Files changed since the base: 29 on the branch side, 0 on the trunk side; on both sides: none.
- `git diff --name-only 26a0b21fa 7a0ae847b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-04_0303_prompt_textual_c_discovery.md` (eseguito 2026-11-04 · lane full · d5e38cb8b (probe and output) · hard-stop at the context soft ceiling, report written by P-2026-11-04-0330 in 8906621a1), `claude_2026-11-04_0330_prompt_textual_c_report.md` (eseguito 2026-11-04 · lane full · 8906621a1 · discovery only, awaiting Alfonso on D1-D6 of the report), `claude_2026-11-04_0345_prompt_textual_c3a_pascal.md` (eseguito 2026-11-04 · lane full · 0f6f7fa8b b4e6eae69 0349387ef 794041be3 · ceiling stop, closed by P-2026-11-04-0412 · verifica visiva della chat passata 2026-11-04 (RC-23, crops c3a-*); GO di Alfonso 2026-11-04 06:52 («go»)), `claude_2026-11-04_0412_prompt_textual_c3a_cont.md` (eseguito 2026-11-04 · lane full · 076b38d18 c6d22de51 7852e462b · verifica visiva della chat passata 2026-11-04 (RC-23, crops c3a-* of P-2026-11-04-0345); GO di Alfonso 2026-11-04 06:52 («go»)), `claude_2026-11-04_0653_prompt_textual-c-notation_take_trunk.md` (eseguito 2026-11-04 · lane textual-c-notation · df01f813c · verifica visiva passata 2026-11-04 (chat, unattended; Alfonso in the morning digest)).
- `git worktree list`: `textual-c-notation` in `/Users/alfonso/jjodel-w-textc`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-04-0712/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `7a0ae847b` is the tip of `textual-c-notation`; the prompt files of the branch read `Status: eseguito` at `7a0ae847b`; `git worktree list` shows `textual-c-notation` only in `/Users/alfonso/jjodel-w-textc`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 7a0ae847b` (measured above: zero conflicts). `git diff --name-only 26a0b21fa 7a0ae847b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 26a0b21fa alfonso-frontend-jjtl` with `git diff --name-only 26a0b21fa 7a0ae847b` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — discovery(codegen): textual step C, expression notation, T4b form, T5 styles (P-2026-11-04-0303, P-2026-11-04-0330)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — feat(codegen): Pascal/Ada style and the style picker, textual step C lane C3a (P-2026-11-04-0345, P-2026-11-04-0412)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-04 — merge: textual-c-notation takes alfonso-frontend-jjtl (P-2026-11-04-0653)` once (branch).
4. `git merge --no-ff --no-commit 7a0ae847b`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: textual-c-notation into alfonso-frontend-jjtl (P-2026-11-04-0712)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `7a0ae847b` in `/Users/alfonso/jjodel-w-textc`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-textc`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 26a0b21fa` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 26a0b21fa HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/codegen.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the textual-c-notation merge (P-2026-11-04-0712)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-textc`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

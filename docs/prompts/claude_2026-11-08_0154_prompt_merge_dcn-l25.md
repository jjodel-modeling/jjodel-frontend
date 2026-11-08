# Prompt: merge dcn-l25 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0154
Chat: C-2026-11-06-2159
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (merge of dcn-l25 launched by chat C-2026-11-06-2159)
Lane: full (merge; 1 conflict: `docs/log-inbox/dcn.md` measured)
Status: eseguito 2026-11-08 · lane merge · 21e7da758 · verifica visiva passata 2026-11-08 (non applicabile, docs and probe only; gates verified by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0154 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8329dbbb3`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `dcn-l25` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a42645aa5`, in the shape of `3da1b61e7` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `631076c5a`. The branch carries, on top of the base, 5 commits:

- `a42645aa5` docs(dcn): L2.5 drone object diagram log entry, Status flips (P-2026-11-08-0057)
- `a6c855081` docs(dcn): drone measures and object diagram screenshot (P-2026-11-08-0011)
- `f097a2847` test(dcn): drone object diagram on R-OI instantiation (P-2026-11-08-0011)
- `e77b4ed8c` docs(dcn): prompt P-2026-11-08-0057
- `2a433667e` docs(dcn): prompt P-2026-11-08-0011

The trunk carries, since the base, 37 commits:

- `8329dbbb3` docs: add prompt P-2026-11-08-0152, merge textual-t8a-ids into alfonso-frontend-jjtl
- `90cd28003` docs: Status flip and log entry for the textual-f2-reveal merge (P-2026-11-08-0122)
- `db65de069` docs: renumber the L4 prompt to P-2026-11-08-0131 (0125 taken by another chat's lane)
- `9805e9d33` docs: prompt P-2026-11-08-0125, multi-tab L4 populate owner
- `3da1b61e7` merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)
- `d50e0e265` docs: add prompt P-2026-11-08-0122, merge textual-f2-reveal into alfonso-frontend-jjtl
- `f476d9e83` docs: Status flip and log entry for F2 (P-2026-11-08-0027)
- `2375441e3` docs: Status flip and log entry for the dcn-conf merge (P-2026-11-08-0040)
- `28e16543b` docs: Status flip and log entry for the multi-tab-l5 merge (P-2026-11-08-0055)
- `46554f772` merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)
- `05f5a9057` docs: add prompt P-2026-11-08-0055, merge multi-tab-l5 into alfonso-frontend-jjtl
- `9d2050879` feat(codegen): F2, the Text tab reveals a generated span's origin (P-2026-11-08-0027)
- `23b47e83c` merge: dcn-conf into alfonso-frontend-jjtl (P-2026-11-08-0040)
- `5bcafa843` docs: Status flip and log entry, multi-tab-l5 took the trunk (P-2026-11-08-0012)
- `106fbc1a5` docs: add prompt P-2026-11-08-0040, merge dcn-conf into alfonso-frontend-jjtl
- `3235f9e73` feat(codegen): F2, a model span click dispatches TEXTUAL_REVEAL (P-2026-11-08-0027)
- `1e84a9440` feat(events): F2, TEXTUAL_REVEAL in the registry (P-2026-11-08-0027)
- `b4ebab7ab` feat(codegen): F2, revealedRange, a span's origin to its line (P-2026-11-08-0027)
- `577368897` docs(dcn): log entry and Status of P-2026-11-08-0010 (P-2026-11-08-0010)
- `5ffbc6058` docs: add prompt P-2026-11-08-0027, F2 generated line to model line
- `9e5452556` fix(dcn): DCN bodies in DCN action mode; W1 names association ends (P-2026-11-08-0010)
- `f2b5d1934` merge: multi-tab-l5 takes alfonso-frontend-jjtl (P-2026-11-08-0012)
- `819c700b5` docs: checkpoint update, textual steps D, E, F (C-2026-11-03-1037)
- `8e57a1aef` docs: Status flip and log entry for the textual-d3c-rules merge (P-2026-11-08-0004)
- `ddf8631ef` docs: add prompt P-2026-11-08-0012, merge alfonso-frontend-jjtl into multi-tab-l5
- `5c15e491e` docs: session checkpoint, multi-tab front, 3.1.2 and L5 (C-2026-11-07-0425)
- `cae331a7c` merge: textual-d3c-rules into alfonso-frontend-jjtl (P-2026-11-08-0004)
- `e7a12d229` docs(dcn): prompt P-2026-11-08-0010
- `8e5e473f0` docs: Status flip and log entry for D3c (P-2026-11-07-1838)
- `8cdb3ea8f` feat(codegen): D3c, validation-rule markers in the Text tab (P-2026-11-07-1838)
- `8d7605eef` feat(codegen): D3c, validation-rule problems mapped to the spans (P-2026-11-07-1838)
- `999841571` docs: add prompt P-2026-11-07-1838, D3c validation-rule markers
- `73e6441fd` docs: multi-tab L5 app check, log entry and Status (P-2026-11-07-1730)
- `3bb82e75e` docs: prompt P-2026-11-07-1730, multi-tab L5 check and closure
- `f2ddead3d` feat(editor-v2): IR resolution follows the tab's viewpoint (P-2026-11-07-1516)
- `7b3cf6d2a` test(editor-v2): IR resolution by the tab's viewpoint, red (P-2026-11-07-1516)
- `a87146a64` docs: Layer Impact Report for multi-tab L5, IR resolution by tab (P-2026-11-07-1516)

Measured by `lane-run merge` at 2026-11-08 01:54, trunk at `8329dbbb3`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a42645aa5`: 1 conflict: `docs/log-inbox/dcn.md`.
- Files changed since the base: 7 on the branch side, 41 on the trunk side; on both sides: `docs/log-inbox/dcn.md`.
- `git diff --name-only 631076c5a a42645aa5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0011_prompt_dcn_l25_object_diagram.md` (eseguito 2026-11-08 · lane full · f097a2847), `claude_2026-11-08_0057_prompt_dcn_l25_objects_cont.md` (eseguito 2026-11-08 · lane full · f097a2847).
- `git worktree list`: `dcn-l25` in `/Users/alfonso/jjodel-w-dcn-l25`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a42645aa5` is the tip of `dcn-l25`; the prompt files of the branch read `Status: eseguito` at `a42645aa5`; `git worktree list` shows `dcn-l25` only in `/Users/alfonso/jjodel-w-dcn-l25`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a42645aa5` (measured above: 1 conflict: `docs/log-inbox/dcn.md`). `git diff --name-only 631076c5a a42645aa5 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 631076c5a alfonso-frontend-jjtl` with `git diff --name-only 631076c5a a42645aa5` (measured above: `docs/log-inbox/dcn.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone object diagram on R-OI instantiation (P-2026-11-08-0011, P-2026-11-08-0057)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3c, validation-rule markers in the Text tab (P-2026-11-07-1838)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-d3c-rules into alfonso-frontend-jjtl (P-2026-11-08-0004)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): F2, a generated line to the model line in the Text tab (P-2026-11-08-0027)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: conformance parses DCN bodies in DCN mode; W1 names association-owned ends` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-conf into alfonso-frontend-jjtl (P-2026-11-08-0040)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: IR resolution follows the tab's viewpoint (multi-tab L5)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — ticket: publishedChannelSlots is one module-level list for every IR canvas` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l5 (P-2026-11-08-0012)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)` once (trunk).
4. `git merge --no-ff --no-commit a42645aa5`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: dcn-l25 into alfonso-frontend-jjtl (P-2026-11-08-0154)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a42645aa5` in `/Users/alfonso/jjodel-w-dcn-l25`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-dcn-l25`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8329dbbb3` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 8329dbbb3 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the dcn-l25 merge (P-2026-11-08-0154)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-dcn-l25`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

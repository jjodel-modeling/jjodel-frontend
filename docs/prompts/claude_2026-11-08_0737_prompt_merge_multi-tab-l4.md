# Prompt: merge multi-tab-l4 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-0737
Chat: C-2026-11-07-0425
Request: https://claude.ai/code/session_01DQt9R2jWxTfKXT19Kf4HUW (Alfonso 2026-11-08 07:37 «Ok» on the L4 crops, critical-zone go-ahead 2026-11-07 04:23)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-0737 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `ce18b0c02`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `multi-tab-l4` into the trunk with one merge commit, `--no-ff`, of the explicit sha `d2b184780`, in the shape of `617ad7579` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `db65de069`. The branch carries, on top of the base, 6 commits:

- `d2b184780` docs: multi-tab L4 closure, app measurement and regressions (P-2026-11-08-0245)
- `b43fe7b9d` docs: prompt P-2026-11-08-0245, multi-tab L4 regressions and closure
- `1cc639636` docs: prompt P-2026-11-08-0150, multi-tab L4 check and closure
- `587aed3cf` fix(editor-v2): one populate owner per model, last instance clears (P-2026-11-08-0131)
- `634dceabf` test(editor-v2): one populate owner per model, red (P-2026-11-08-0131)
- `f888be09f` docs: Layer Impact Report for multi-tab L4, one populate owner per model (P-2026-11-08-0131)

The trunk carries, since the base, 59 commits:

- `ce18b0c02` docs: DCN session checkpoint 2026-11-08, slice 4 closed
- `cff549c26` docs: Status flip and log entry for the dcn-l45 merge (P-2026-11-08-0430)
- `617ad7579` merge: dcn-l45 into alfonso-frontend-jjtl (P-2026-11-08-0430)
- `7add4be3c` docs: add prompt P-2026-11-08-0430, merge dcn-l45 into alfonso-frontend-jjtl
- `1d2691776` docs(dcn): L4.5d closure, visual check passed (P-2026-11-08-0329)
- `b4a6aeddf` docs(dcn): Status of the L4.5d prompt (P-2026-11-08-0329)
- `7a9c0d219` docs(dcn): L4.5d log entry, drone run crops (P-2026-11-08-0329)
- `32a3e617e` test(dcn): drone run probe presses Tick by its label dcn-tick (P-2026-11-08-0329)
- `599df8938` docs(dcn): Status of the L4.5e prompt (P-2026-11-08-0345)
- `c730d6bda` docs(dcn): L4.5e log entry, freeze fix, probe tick ticket (P-2026-11-08-0345)
- `db9d66ddf` fix(jjscript): class shell flags read the stored field first (P-2026-11-08-0345)
- `969670d5b` docs(dcn): discovery, freeze refuses a proxy in the class shell (P-2026-11-08-0345)
- `0429e8c7d` docs: DCN session checkpoint 2026-11-08
- `53606f71c` test(dcn): drone run probe, acceptance for the freeze fix (P-2026-11-08-0329)
- `d2e80f600` docs(dcn): prompt P-2026-11-08-0345
- `376706d73` docs(dcn): prompt P-2026-11-08-0329
- `b1492b017` docs(dcn): Status of the L4.5 prompts (P-2026-11-08-0315)
- `d5fd443d7` docs(dcn): L4.5 log entry, withInputs ticket (P-2026-11-08-0315)
- `b4bb4c04c` feat(dcn): panel gate, DCN inputs row, chips and heading (P-2026-11-08-0315)
- `cf6a07124` docs(dcn): prompt P-2026-11-08-0315
- `b7bffda4c` feat(dcn): startRun starts a DCN run, texts dispatch by net (P-2026-11-08-0303)
- `70c5174c8` feat(dcn): panel texts of a DCN run (P-2026-11-08-0303)
- `f9c15fbb2` docs: Status flip and log entry for the oi-s3b merge (P-2026-11-07-1834)
- `bdd94bfc7` docs(dcn): L4.5 run wiring discovery (P-2026-11-08-0248)
- `a099d845e` docs(dcn): prompt P-2026-11-08-0303
- `92ed7b983` docs: checkpoint update, F2, T8a, T8b (C-2026-11-03-1037)
- `3146847ed` docs: Status flip and log entry for the textual-t8b-file merge (P-2026-11-08-0246)
- `0322b765f` merge: textual-t8b-file into alfonso-frontend-jjtl (P-2026-11-08-0246)
- `75377d91a` docs: add prompt P-2026-11-08-0246, merge textual-t8b-file into alfonso-frontend-jjtl
- `6d98d145c` docs(dcn): prompt P-2026-11-08-0248
- `089b39fc9` docs: shorten the Notes of the dcn-l25 merge entry (P-2026-11-08-0154)
- `0dd8d67e0` docs: Status flip and log entry, blocked jjtl-kernel-gaps merge closed (P-2026-11-08-0229)
- `cb6e436c3` docs: Status flip and log entry for T8b (P-2026-11-08-0206)
- `e7605a490` merge: jjtl-kernel-gaps into alfonso-frontend-jjtl (P-2026-11-08-0229)
- `a0876feb3` docs: Status flip and log entry for the dcn-l25 merge (P-2026-11-08-0154)
- `615f03ca8` docs: add prompt P-2026-11-08-0229, merge jjtl-kernel-gaps into alfonso-frontend-jjtl
- `ca62444fa` feat(codegen): T8b, Export and Import in the Text tab (P-2026-11-08-0206)
- `21e7da758` merge: dcn-l25 into alfonso-frontend-jjtl (P-2026-11-08-0154)
- `6f5207c66` feat(codegen): T8b, the text file of a model (P-2026-11-08-0206)
- `b861b46e6` docs: add prompt P-2026-11-08-0206, T8b Export and Import
- and 19 more: `git log --oneline db65de069..ce18b0c02`

Measured by `lane-run merge` at 2026-11-08 07:37, trunk at `ce18b0c02`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d2b184780`: zero conflicts.
- Files changed since the base: 9 on the branch side, 47 on the trunk side; on both sides: none.
- `git diff --name-only db65de069 d2b184780 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0150_prompt_multi_tab_l4_check.md` (eseguito 2026-11-08 · lane full · no source change · build exit 0, check:docs exit 0 · two tabs: vertex 2 -> 1, M2 edge 1 and 1 (§3.7 edge half not reproduced on the parent), registries kept after the owner closes, cleared by the last · cut at the AM-8 ceiling, closed by P-2026-11-08-0245 · hard-stop: visual check due · non fuso), `claude_2026-11-08_0245_prompt_multi_tab_l4_closure.md` (eseguito 2026-11-08 · lane full · no source change · two-tab rerun at load 2.40 identical to 0150 · single tab 3/3 every step x3, container 0 failures, 0457 scenes 17 PASS 0 FAIL, demo 18/18 and 25/25 · LIR §7 · log entry in docs/log-inbox/multi-tab.md · hard-stop: visual check due · non fuso).
- `git worktree list`: `multi-tab-l4` in `/Users/alfonso/jjodel-w-mtl4`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `d2b184780` is the tip of `multi-tab-l4`; the prompt files of the branch read `Status: eseguito` at `d2b184780`; `git worktree list` shows `multi-tab-l4` only in `/Users/alfonso/jjodel-w-mtl4`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl d2b184780` (measured above: zero conflicts). `git diff --name-only db65de069 d2b184780 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only db65de069 alfonso-frontend-jjtl` with `git diff --name-only db65de069 d2b184780` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — fix: one populate owner per model, the last instance clears (multi-tab L4)` once (branch).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — ticket: sync registries have no model key, the last tab of model N clears model M` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8a, ids in the text and evidence 0 of the match (P-2026-11-08-0121)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8a-ids into alfonso-frontend-jjtl (P-2026-11-08-0152)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8b, Export and Import of the text in the Text tab (P-2026-11-08-0206)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8b-file into alfonso-frontend-jjtl (P-2026-11-08-0246)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone object diagram on R-OI instantiation (P-2026-11-08-0011, P-2026-11-08-0057)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l25 into alfonso-frontend-jjtl (P-2026-11-08-0154)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN L4.5 run wiring, startRun to panel (P-2026-11-08-0248, P-2026-11-08-0303, P-2026-11-08-0315)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: a DCN run freezes its model, class shell flags read the stored field (P-2026-11-08-0345)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone run in the Simulation panel, crops (P-2026-11-08-0329)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l45 into alfonso-frontend-jjtl (P-2026-11-08-0430)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — discovery: JjTL gaps on the generic Brief transformation (P-2026-11-08-0125)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: a JjTL demand used as a value gives a wrong target and success true` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — docs: closure of the blocked jjtl-kernel-gaps merge` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — merge: oi-s3b into alfonso-frontend-jjtl (P-2026-11-07-1834)` once (trunk).
4. `git merge --no-ff --no-commit d2b184780`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: multi-tab-l4 into alfonso-frontend-jjtl (P-2026-11-08-0737)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `d2b184780` in `/Users/alfonso/jjodel-w-mtl4`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-mtl4`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard ce18b0c02` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only ce18b0c02 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/multi-tab.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the multi-tab-l4 merge (P-2026-11-08-0737)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-mtl4`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

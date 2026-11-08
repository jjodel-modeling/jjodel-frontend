# Prompt: merge jjtl-include-pills into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-08-1359
Chat: C-2026-11-03-1202
Request: https://claude.ai/code/session_01DQt9R5EJe1reXq5Xut2Jif (merge of jjtl-include-pills launched by chat C-2026-11-03-1202)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-08 · lane merge · cc06d9f6d · verifica visiva passata 2026-11-08 (Include pills: multi-value select with pills, crops checked by the chat)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1359 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fb108b065`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjtl-include-pills` into the trunk with one merge commit, `--no-ff`, of the explicit sha `77c105333`, in the shape of `d79d51f90` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `34a511ffb`. The branch carries, on top of the base, 11 commits:

- `77c105333` docs: Status of the include pills prompts (P-2026-11-08-1230)
- `07589e508` docs: log entry of the include pills lane (P-2026-11-08-1230)
- `6d99cd048` docs(jjtl): phase 2 of the include pills report (P-2026-11-08-1230)
- `a7b5a12a2` docs: R-JTG-33, R-JTG-34 and the note on R-JTG-27 (P-2026-11-08-1230)
- `08384ff6e` docs(jjtl): SPEC for the pills field and unbound envLookup (P-2026-11-08-1230)
- `d4c331168` fix(jjtl): pills field at the select's height, list stays shut (P-2026-11-08-1230)
- `e92b7d2cc` feat(jjtl): included models as pills in a combobox (P-2026-11-08-1230)
- `286bf7e7a` docs: add prompt P-2026-11-08-1230, close the include pills lane
- `ac9ee73cf` fix(jjtl): an unbound envLookup stops the run (P-2026-11-08-1200)
- `c7b2df61a` docs(jjtl): discovery of include pills and unbound envLookup (P-2026-11-08-1200)
- `09784b7e6` docs: add prompt P-2026-11-08-1200, included models as pills and unbound envLookup

The trunk carries, since the base, 45 commits:

- `fb108b065` docs: checkpoint update, midday round of the codegen front (C-2026-11-03-1037)
- `ba8218957` docs: Status flip and log entry for the undo-682-create-entry merge (P-2026-11-08-1344)
- `d79d51f90` merge: undo-682-create-entry into alfonso-frontend-jjtl (P-2026-11-08-1344)
- `35c91c6aa` docs: add prompt P-2026-11-08-1344, merge undo-682-create-entry into alfonso-frontend-jjtl
- `52fe260da` docs: Status flip of the #682 discovery prompt (P-2026-11-08-0916)
- `445cb8f42` docs: Status flip and log entry for the textual-c2g-align merge (P-2026-11-08-1330)
- `ae7a149aa` merge: textual-c2g-align into alfonso-frontend-jjtl (P-2026-11-08-1330)
- `78f4b1a5a` docs: session checkpoint, multi-tab front, L5, L4 and L6 on the trunk (C-2026-11-07-0425)
- `64b2476c6` docs: add prompt P-2026-11-08-1330, merge textual-c2g-align into alfonso-frontend-jjtl
- `26abc8149` docs: #682 Phase 2 log entry, ticket #764 and Status flips (P-2026-11-08-1313)
- `e0997544f` docs: C2g log entry and Status flip (P-2026-11-08-1239)
- `4dd7f8b2a` docs: Status flip and log entry for the multi-tab-l6 merge (P-2026-11-08-1247)
- `8d25f11cf` docs: prompt for #682 Phase 2 closure, smoke diagnosis (P-2026-11-08-1313)
- `bc4b137cd` merge: multi-tab-l6 into alfonso-frontend-jjtl (P-2026-11-08-1247)
- `5541ea46b` docs: R-TXT-59, a row header the register parses (P-2026-11-08-1239)
- `af51a3094` docs: add prompt P-2026-11-08-1247, merge multi-tab-l6 into alfonso-frontend-jjtl
- `05dadce29` fix(editor-v2): C2g, one label for unnamed reference targets (P-2026-11-08-1239)
- `f0ecce336` docs: R-TXT-59 and the LIR of C2g, one unnamed label (P-2026-11-08-1239)
- `76f051677` docs: Status flip and log entry, multi-tab-l6 took the trunk (P-2026-11-08-1156)
- `0475bde69` fix(undo): a canvas create opens its own entry (#682) (P-2026-11-08-1202)
- `a3cd1dbcd` docs: amend the #682 LIR, compose only into a create's entry (P-2026-11-08-1202)
- `0ab860da1` docs: prompt for C2g, one label for unnamed reference targets (P-2026-11-08-1239)
- `3d0cc984d` docs: Status flip and log entry for the textual-c2f-labels merge (P-2026-11-08-1201)
- `5e0987b1b` docs: Layer Impact Report for #682 Phase 2 (P-2026-11-08-1202)
- `29fcd307f` merge: textual-c2f-labels into alfonso-frontend-jjtl (P-2026-11-08-1201)
- `92f763461` docs: prompt for #682 Phase 2, canvas create undo entry (P-2026-11-08-1202)
- `fa3267725` docs: add prompt P-2026-11-08-1201, merge textual-c2f-labels into alfonso-frontend-jjtl
- `5173fe284` docs: C2f log entry and Status flips, Alfonso visual GO (P-2026-11-08-0843)
- `7b4a75718` merge: multi-tab-l6 takes alfonso-frontend-jjtl (P-2026-11-08-1156)
- `bf98e6908` docs: add prompt P-2026-11-08-1156, merge alfonso-frontend-jjtl into multi-tab-l6
- `59c96355b` docs: L6 closure, app check tables and Status flips (P-2026-11-08-1003)
- `7f8e8c0fb` fix: paint a model tab opened beside another (P-2026-11-08-1003)
- `7ad9a6766` docs: prompt P-2026-11-08-1003, multi-tab L6 beside panel paint and closure
- `2eb74325d` docs: discovery #682, a canvas create gets no undo step (P-2026-11-08-0916)
- `f52ff3db8` docs: prompt for the #682 canvas create undo discovery (P-2026-11-08-0916)
- `9c44d338a` fix(editor-v2): C2f, IR reference widgets name unnamed targets (P-2026-11-08-0843)
- `8df0eb631` fix(editor-v2): C2f, the labels of the unnamed targets of one list (P-2026-11-08-0843)
- `d65442ea9` docs: prompt P-2026-11-08-0852, multi-tab L6 app check and closure
- `78a5bc7e6` docs: Layer Impact Report for C2f nameless reference labels (P-2026-11-08-0843)
- `a7023ff6d` docs: add prompt P-2026-11-08-0843, C2f in the critical zone (Alfonso 08:33)
- and 5 more: `git log --oneline 34a511ffb..fb108b065`

Measured by `lane-run merge` at 2026-11-08 13:59, trunk at `fb108b065`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 77c105333`: zero conflicts.
- Files changed since the base: 12 on the branch side, 46 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 34a511ffb 77c105333 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_1200_prompt_jjtl_include_pills.md` (eseguito 2026-11-08 · lane full · c7b2df61a (report), ac9ee73cf (envLookup); combobox and closure in P-2026-11-08-1230), `claude_2026-11-08_1230_prompt_jjtl_include_pills_close.md` (eseguito 2026-11-08 · lane full · e92b7d2cc (combobox), d4c331168 (probe fixes), 08384ff6e (SPEC), a7b5a12a2 (decisions), 6d99cd048 (report)).
- `git worktree list`: `jjtl-include-pills` in `/Users/alfonso/jjodel-w-includepills`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-08-1359/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `77c105333` is the tip of `jjtl-include-pills`; the prompt files of the branch read `Status: eseguito` at `77c105333`; `git worktree list` shows `jjtl-include-pills` only in `/Users/alfonso/jjodel-w-includepills`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 77c105333` (measured above: zero conflicts). `git diff --name-only 34a511ffb 77c105333 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 34a511ffb alfonso-frontend-jjtl` with `git diff --name-only 34a511ffb 77c105333` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-JTG-33` (branch), `R-JTG-34` (branch), `R-TXT-59` (trunk); control: `- **R-TXT-60**` none.
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(jjtl): included models as pills, unbound envLookup stops the run (P-2026-11-08-1230)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2f, IR reference widgets name unnamed targets (P-2026-11-08-0843)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-c2f-labels into alfonso-frontend-jjtl (P-2026-11-08-1201)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2g, one label for unnamed reference targets (P-2026-11-08-1239)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-c2g-align into alfonso-frontend-jjtl (P-2026-11-08-1330)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: undo: reducer indexes the sender stack with the length of all` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(undo): a canvas create opens its own entry, #682 Phase 2 (P-2026-11-08-1202, P-2026-11-08-1313)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: undo-682-create-entry into alfonso-frontend-jjtl (P-2026-11-08-1344)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — feat: a second tab on one model, Open in new tab and Open beside (multi-tab L6)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — ticket: the Console reads the dock tab id as a model id` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l6 (P-2026-11-08-1156)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l6 into alfonso-frontend-jjtl (P-2026-11-08-1247)` once (trunk).
4. `git merge --no-ff --no-commit 77c105333`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjtl-include-pills into alfonso-frontend-jjtl (P-2026-11-08-1359)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `77c105333` in `/Users/alfonso/jjodel-w-includepills`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-includepills`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fb108b065` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only fb108b065 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/hw-notation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjtl-include-pills merge (P-2026-11-08-1359)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-includepills`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

# Prompt: merge gv-drag-frame into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-11-1728
Chat: —
Lane: full (merge; 1 conflict: `docs/decisions.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1728 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `0c74c7b96`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `gv-drag-frame` into the trunk with one merge commit, `--no-ff`, of the explicit sha `af236ac12`, in the shape of `2dc0982bc` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `bc5b997c1`. The branch carries, on top of the base, 14 commits:

- `af236ac12` docs: flip status of P-2026-10-11-1156
- `dd1e66f57` docs(log): inbox entry of the pointer-band correction (P-2026-10-11-1156)
- `23f78e4c8` docs(spec): R-GV-17 and §12 follow the pointer within a band (P-2026-10-11-1156)
- `76f741e2a` chore(probe): drag4 band and leave drags (P-2026-10-11-1156)
- `dda304dbb` test(ir): the bottom band case leaves the centre past the border (P-2026-10-11-1156)
- `efb97f948` fix(ir): a frame follows its child while the pointer is in a band (P-2026-10-11-1156)
- `6966e468c` docs(log): inbox entry and two tickets of the four-side frame (P-2026-10-11-1156)
- `879276a2a` docs(spec): graphVertex frame on four sides, R-GV-17 (P-2026-10-11-1156)
- `7b23cfa74` test(editor-v2): a sized update sets the hand-set flag (P-2026-10-11-1156)
- `d7b6914a4` fix(editor-v2): Auto layout writes a grown box with its position (P-2026-10-11-1156)
- `74ce6c94f` docs(lir): position and size of a container as one record (P-2026-10-11-1156)
- `6fdf5be0d` chore(probe): drag4, relayout and carry scenes (P-2026-10-11-1156)
- `18569bcc3` fix(editor-v2): a dragged container lands at its record plus the delta (P-2026-10-11-1156)
- `2d2f75846` fix(ir): graphVertex frame follows a dragged child on four sides (P-2026-10-11-1156)

The trunk carries, since the base, 82 commits:

- `0c74c7b96` docs: prompt for softgoal balance view (P-2026-10-11-1735)
- `6093cfbd3` docs: close P-2026-10-11-1630, add prompt P-2026-10-11-1725 (CAIN RQ tables)
- `e262e68bc` docs: Status flip and log entry for the cain-data merge (P-2026-10-11-1719)
- `2dc0982bc` merge: cain-data into alfonso-frontend-jjtl (P-2026-10-11-1719)
- `8cdafc89c` docs: flip status of P-2026-10-11-1156
- `e4cea10c4` docs: add prompt P-2026-10-11-1719, merge cain-data into alfonso-frontend-jjtl
- `dfea753d4` docs: flip status of P-2026-10-11-1135
- `e34fccc1f` docs(research): governance drift dataset for CAIN 2027 (P-2026-10-11-1630)
- `f6e14efad` docs: prompt for goal tree, correlations and hurts (P-2026-10-11-1650)
- `154311f55` docs(prompts): governance drift dataset for CAIN 2027, discovery (P-2026-10-11-1630)
- `d81d7dc41` docs: Status flip and log entry for the ratification of the provisional rows (P-2026-10-11-1540)
- `21cdad0df` docs: Status flip and log entry for the ratify-provisional merge (P-2026-10-11-1559)
- `c6804f3d3` merge: ratify-provisional into alfonso-frontend-jjtl (P-2026-10-11-1559)
- `2a10e9f36` docs: add prompt P-2026-10-11-1559, merge ratify-provisional into alfonso-frontend-jjtl
- `d7a251297` docs(decisions): ratify 76 rows, amend R-SIM-120, R-VP-29, fix headers (P-2026-10-11-1540)
- `88627f711` docs(prompts): ratify the provisional rows per the digest (P-2026-10-11-1540)
- `efaa32bea` docs: Status flip and log entry for the codegen-examples merge (P-2026-10-11-1542)
- `87d05057c` merge: codegen-examples into alfonso-frontend-jjtl (P-2026-10-11-1542)
- `7e864e926` docs: Status flip and log entry for the cluster-descriptions merge (P-2026-10-11-1535)
- `8b37e2fe5` docs: add prompt P-2026-10-11-1542, merge codegen-examples into alfonso-frontend-jjtl
- `06bf2dd10` docs: Status flip for the codegen S8 importable examples lane (P-2026-10-11-1415)
- `ee5c07c2f` merge: cluster-descriptions into alfonso-frontend-jjtl (P-2026-10-11-1535)
- `748c513ce` docs: add prompt P-2026-10-11-1535, merge cluster-descriptions into alfonso-frontend-jjtl
- `e657a479a` docs: Status flip and log entry for cluster descriptions (P-2026-10-11-1510)
- `8a22140d9` docs(sessioni): checkpoint of chat C-2026-10-10-0039 (Jjodie reserved names, do-block parser fixes)
- `e1c750a8a` docs(goals): requirement cluster descriptions (P-2026-10-11-1510)
- `16ebdfca5` feat(harness): clusters carry a written description (P-2026-10-11-1510)
- `8840e4c83` docs: prompt for written descriptions of requirement clusters (P-2026-10-11-1510)
- `d4b8a6b09` docs: Status flip and log entry for the provisional rows digest (P-2026-10-11-1430)
- `212b081fa` docs: Status flip and log entry for the prov-digest merge (P-2026-10-11-1451)
- `0e6153215` docs: log entry for the codegen importable examples (P-2026-10-11-1415)
- `4a7fb2755` feat(codegen): the two lecture examples as importable project files (P-2026-10-11-1415)
- `a98c3b1ce` merge: prov-digest into alfonso-frontend-jjtl (P-2026-10-11-1451)
- `bcd4b993b` docs: add prompt P-2026-10-11-1451, merge prov-digest into alfonso-frontend-jjtl
- `b646a9a04` docs(ratifiche): digest of the provisional decision rows, by consequence (P-2026-10-11-1430)
- `239ca4266` docs(log-inbox): three maintenance tickets from P-2026-10-11-1025
- `a60241d55` docs: Status flip and log entry for the fix-subclass-edge-gesture merge (P-2026-10-11-1421)
- `4de76fb74` docs(prompts): digest of the provisional decision rows (P-2026-10-11-1430)
- `91be061fc` merge: fix-subclass-edge-gesture into alfonso-frontend-jjtl (P-2026-10-11-1421)
- `2da0ee1df` docs: add prompt P-2026-10-11-1421, merge fix-subclass-edge-gesture into alfonso-frontend-jjtl
- and 42 more: `git log --oneline bc5b997c1..0c74c7b96`

Measured by `lane-run merge` at 2026-10-11 17:28, trunk at `0c74c7b96`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl af236ac12`: 1 conflict: `docs/decisions.md`.
- Files changed since the base: 94 on the branch side, 94 on the trunk side; on both sides: `docs/decisions.md`, `docs/prompts/claude_2026-10-11_1156_prompt_gv_drag_frame.md`.
- `git diff --name-only bc5b997c1 af236ac12 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `gv-drag-frame` in `/Users/alfonso/jjodel-w-gvdrag`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-11-1728/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `af236ac12` is the tip of `gv-drag-frame`; the prompt files of the branch read `Status: eseguito` at `af236ac12`; `git worktree list` shows `gv-drag-frame` only in `/Users/alfonso/jjodel-w-gvdrag`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl af236ac12` (measured above: 1 conflict: `docs/decisions.md`). `git diff --name-only bc5b997c1 af236ac12 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only bc5b997c1 alfonso-frontend-jjtl` with `git diff --name-only bc5b997c1 af236ac12` (measured above: `docs/decisions.md`, `docs/prompts/claude_2026-10-11_1156_prompt_gv_drag_frame.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-GV-17` (branch), `R-ESEL-1` (trunk), `R-ESEL-2` (trunk), `R-ESEL-3` (trunk), `R-ESEL-4` (trunk), `R-ESEL-5` (trunk), `R-IRN-38` (trunk), `R-IRN-40` (trunk), `R-IRN-39` (trunk), `R-IRN-41` (trunk), `R-SIM-67` (trunk), `R-SIM-111` (trunk), `R-SIM-112` (trunk), `R-SIM-113` (trunk), `R-SIM-115` (trunk), `R-SIM-116` (trunk), `R-SIM-117` (trunk), `R-SIM-118` (trunk), `R-SIM-119` (trunk), `R-SIM-120` (trunk), `R-SIM-121` (trunk), `R-SIM-122` (trunk), `R-SIM-123` (trunk), `R-SIM-124` (trunk), `R-SIM-125` (trunk), `R-SIM-126` (trunk), `R-SIM-127` (trunk), `R-SIM-128` (trunk), `R-SIM-129` (trunk), `R-SIM-130` (trunk), `R-SIM-131` (trunk), `R-SIM-132` (trunk), `R-SIM-133` (trunk), `R-SIM-134` (trunk), `R-SIM-135` (trunk), `R-SIM-136` (trunk), `R-SIM-137` (trunk), `R-SIM-138` (trunk), `R-SIM-139` (trunk), `R-SIM-140` (trunk), `R-UNDO-8` (trunk), `R-VP-27` (trunk), `R-VP-28` (trunk), `R-VP-29` (trunk), `R-VP-30` (trunk), `R-VP-31` (trunk), `R-VP-19` (trunk), `R-VP-20` (trunk), `R-VP-21` (trunk), `R-VP-22` (trunk), `R-VP-23` (trunk), `R-VP-32` (trunk), `R-VP-33` (trunk), `R-VP-34` (trunk), `R-VP-35` (trunk), `R-VP-37` (trunk), `R-VP-38` (trunk), `R-VP-39` (trunk), `R-VP-40` (trunk), `R-VP-41` (trunk), `R-VP-42` (trunk), `R-VP-43` (trunk), `R-VP-44` (trunk), `R-VP-45` (trunk), `R-VP-46` (trunk), `R-VP-47` (trunk), `R-VP-54` (trunk), `R-VP-55` (trunk), `R-VP-56` (trunk), `R-VP-57` (trunk), `R-EE-1` (trunk), `R-EE-2` (trunk), `R-EE-3` (trunk), `R-EE-4` (trunk), `R-JS-2` (trunk), `R-JS-3` (trunk), `R-JS-4` (trunk), `R-JS-5` (trunk), `R-JS-6` (trunk), `R-JS-7` (trunk), `R-JS-8` (trunk), `R-JS-9` (trunk), `R-JS-10` (trunk), `R-JS-11` (trunk), `R-GOAL-1` (trunk), `R-GEN-1` (trunk), `R-GEN-2` (trunk), `R-GEN-3` (trunk), `R-GEN-4` (trunk), `R-GEN-5` (trunk), `R-GEN-6` (trunk), `R-GEN-7` (trunk), `R-GEN-8` (trunk), `R-GEN-9` (trunk), `R-GEN-10` (trunk), `R-GEN-11` (trunk), `R-GEN-12` (trunk), `R-GEN-13` (trunk), `R-GEN-14` (trunk), `R-GEN-15` (trunk), `R-GEN-16` (trunk), `R-GEN-17` (trunk), `R-GV-15` (trunk), `R-GV-16` (trunk); control: `- **R-GV-18**` none.
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — fix(ir): graphVertex frame follows a dragged child on four sides (P-2026-10-11-1156)` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — ticket: regions packed edge to edge cannot grow across their shared border` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — ticket: a child dragged out of a none container is framed again after the drop` once (branch).
   - `docs/log-inbox/ir-graphvertex.md`: the heading `## 2026-10-11 — fix(ir): a frame follows its child while the pointer is in a band (P-2026-10-11-1156)` once (branch).
   - `docs/log-inbox/codegen-check.md`: the heading `## 2026-10-11 — feat(codegen): «Check» runs the oracle from the Code panel (P-2026-10-11-1053)` once (trunk).
   - `docs/log-inbox/codegen-check.md`: the heading `## 2026-10-11 — merge: codegen-check into alfonso-frontend-jjtl (P-2026-10-11-1250)` once (trunk).
   - `docs/log-inbox/codegen-examples.md`: the heading `## 2026-10-11 — feat(codegen): the two lecture examples as importable project files (P-2026-10-11-1415)` once (trunk).
   - `docs/log-inbox/codegen-examples.md`: the heading `## 2026-10-11 — merge: codegen-examples into alfonso-frontend-jjtl (P-2026-10-11-1542)` once (trunk).
   - `docs/log-inbox/codegen-names.md`: the heading `## 2026-10-11 — feat(codegen): readable element names in the generated JavaScript (P-2026-10-11-1052)` once (trunk).
   - `docs/log-inbox/codegen-names.md`: the heading `## 2026-10-11 — merge: codegen-names into alfonso-frontend-jjtl (P-2026-10-11-1238)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: firstshot-time-axis into alfonso-frontend-jjtl (P-2026-10-11-1152)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — fix(harness): lane board keeps last good data, shows a loading indicator (P-2026-10-11-1205)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: board-loading into alfonso-frontend-jjtl (P-2026-10-11-1221)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: insights-more into alfonso-frontend-jjtl (P-2026-10-11-1328)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — discovery: lane board Insights, rework, decisions, lead time (P-2026-10-11-1150)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: prov-digest into alfonso-frontend-jjtl (P-2026-10-11-1451)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(ratifiche): digest of the provisional decision rows (P-2026-10-11-1430)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): a written description for each requirement cluster (P-2026-10-11-1510)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: cluster-descriptions into alfonso-frontend-jjtl (P-2026-10-11-1535)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: ratify-provisional into alfonso-frontend-jjtl (P-2026-10-11-1559)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(decisions): ratify the provisional rows of the digest, amend R-SIM-120 and R-VP-29, fix headers (P-2026-10-11-1540)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — merge: cain-data into alfonso-frontend-jjtl (P-2026-10-11-1719)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — docs(research): governance drift dataset for CAIN 2027 (P-2026-10-11-1630)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — fix(jjscript): block eval stops at end, a bare do fails a strict parse (P-2026-10-11-1145)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — merge: do-tickets into alfonso-frontend-jjtl (P-2026-10-11-1300)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: M1 canvas: xyflow refuses Transition→State over `target` after reopen` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts` once (trunk).
   - `docs/log-inbox/subclass-edge-gesture.md`: the heading `## 2026-10-11 — fix(editor-v2): superclass ids in the M2 signature, M1 gesture on subclass instances (P-2026-10-11-1025)` once (trunk).
   - `docs/log-inbox/subclass-edge-gesture.md`: the heading `## 2026-10-11 — merge: fix-subclass-edge-gesture into alfonso-frontend-jjtl (P-2026-10-11-1421)` once (trunk).
4. `git merge --no-ff --no-commit af236ac12`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: gv-drag-frame into alfonso-frontend-jjtl (P-2026-10-11-1728)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `af236ac12` in `/Users/alfonso/jjodel-w-gvdrag`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 0c74c7b96` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/ir-graphvertex.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the gv-drag-frame merge (P-2026-10-11-1728)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-gvdrag`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

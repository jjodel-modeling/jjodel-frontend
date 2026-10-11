# Prompt: new-model-instantiate takes the trunk before its own merge

Prompt-ID: P-2026-10-11-1716
Chat: —
Lane: full (merge of the trunk into the branch; 1 conflict: `frontend/src/components/editor-v2/hooks/useEditorMode.ts` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-newinst`, branch `new-model-instantiate`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-newinst`, branch `new-model-instantiate`, `git log -1` is the commit that adds this file (its parent `91a5f2e31`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-11-1716 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `dfea753d4` into `new-model-instantiate` with one merge commit, `--no-ff`, in the shape of `bcffa0c76` (the last merge commit on `new-model-instantiate`; read its body first). Merge base `be556435b`. The trunk brings, since the base, 87 commits:

- `dfea753d4` docs: flip status of P-2026-10-11-1135
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
- `2cf1ae68c` docs(discovery): codegen examples as importable projects (P-2026-10-11-1415)
- `2a6eef070` docs(prompts): add P-2026-10-11-1415, codegen S8 importable lecture examples
- `ec1a12ab0` docs: Status flip and log entry for the Insights discovery (P-2026-10-11-1150)
- `83b9e8f82` docs: Status flip and log entry for the insights-more merge (P-2026-10-11-1328)
- `5278fa2e9` merge: insights-more into alfonso-frontend-jjtl (P-2026-10-11-1328)
- `e73fdcb18` docs: add prompt P-2026-10-11-1328, merge insights-more into alfonso-frontend-jjtl
- `a40dec6db` docs(prompts): Status flip, P-2026-10-11-1145
- and 47 more: `git log --oneline be556435b..dfea753d4`

This branch brings, 7 commits:

- `91a5f2e31` docs: flip status of P-2026-10-11-1135
- `1df16a7a4` docs: inbox entry for new-model-instantiate F1, Phase 2 (P-2026-10-11-1135)
- `c2666b3b2` docs(discovery): new model instantiate, F1 measured addendum (P-2026-10-11-1135)
- `b08c92322` fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)
- `d53d319dc` docs: inbox entry and a ticket for the new-model-instantiate Phase 1 (P-2026-10-11-1135)
- `60e51a4a3` docs(discovery): new model instantiate, not reproduced; stale memo (P-2026-10-11-1135)
- `309245922` chore(probe): every instantiation path on a fresh project (P-2026-10-11-1135)

Measured by `lane-run merge --trunk-into` at 2026-10-11 17:16, trunk at `dfea753d4`:

- `git merge-tree --write-tree --name-only new-model-instantiate dfea753d4`: 1 conflict: `frontend/src/components/editor-v2/hooks/useEditorMode.ts`.
- Files changed since the base: 15 on the branch side, 86 on the trunk side; on both sides: `docs/prompts/claude_2026-10-11_1135_prompt_new_model_instantiate.md`, `frontend/src/components/editor-v2/hooks/useEditorMode.ts`.
- `git diff --name-only be556435b 91a5f2e31 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `new-model-instantiate` in `/Users/alfonso/jjodel-w-newinst`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/editor-v2/hooks/useEditorMode.ts`

## COME

1. Preconditions above, plus: `dfea753d4` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `dfea753d4` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only new-model-instantiate dfea753d4` (measured above: 1 conflict: `frontend/src/components/editor-v2/hooks/useEditorMode.ts`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit dfea753d4`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-ESEL-1` (trunk), `R-ESEL-2` (trunk), `R-ESEL-3` (trunk), `R-ESEL-4` (trunk), `R-ESEL-5` (trunk), `R-IRN-38` (trunk), `R-IRN-40` (trunk), `R-IRN-39` (trunk), `R-IRN-41` (trunk), `R-SIM-67` (trunk), `R-SIM-111` (trunk), `R-SIM-112` (trunk), `R-SIM-113` (trunk), `R-SIM-115` (trunk), `R-SIM-116` (trunk), `R-SIM-117` (trunk), `R-SIM-118` (trunk), `R-SIM-119` (trunk), `R-SIM-120` (trunk), `R-SIM-121` (trunk), `R-SIM-122` (trunk), `R-SIM-123` (trunk), `R-SIM-124` (trunk), `R-SIM-125` (trunk), `R-SIM-126` (trunk), `R-SIM-127` (trunk), `R-SIM-128` (trunk), `R-SIM-129` (trunk), `R-SIM-130` (trunk), `R-SIM-131` (trunk), `R-SIM-132` (trunk), `R-SIM-133` (trunk), `R-SIM-134` (trunk), `R-SIM-135` (trunk), `R-SIM-136` (trunk), `R-SIM-137` (trunk), `R-SIM-138` (trunk), `R-SIM-139` (trunk), `R-SIM-140` (trunk), `R-UNDO-8` (trunk), `R-VP-27` (trunk), `R-VP-28` (trunk), `R-VP-29` (trunk), `R-VP-30` (trunk), `R-VP-31` (trunk), `R-VP-19` (trunk), `R-VP-20` (trunk), `R-VP-21` (trunk), `R-VP-22` (trunk), `R-VP-23` (trunk), `R-VP-32` (trunk), `R-VP-33` (trunk), `R-VP-34` (trunk), `R-VP-35` (trunk), `R-VP-37` (trunk), `R-VP-38` (trunk), `R-VP-39` (trunk), `R-VP-40` (trunk), `R-VP-41` (trunk), `R-VP-42` (trunk), `R-VP-43` (trunk), `R-VP-44` (trunk), `R-VP-45` (trunk), `R-VP-46` (trunk), `R-VP-47` (trunk), `R-VP-54` (trunk), `R-VP-55` (trunk), `R-VP-56` (trunk), `R-VP-57` (trunk), `R-EE-1` (trunk), `R-EE-2` (trunk), `R-EE-3` (trunk), `R-EE-4` (trunk), `R-JS-2` (trunk), `R-JS-3` (trunk), `R-JS-4` (trunk), `R-JS-5` (trunk), `R-JS-6` (trunk), `R-JS-7` (trunk), `R-JS-8` (trunk), `R-JS-9` (trunk), `R-JS-10` (trunk), `R-JS-11` (trunk), `R-GOAL-1` (trunk), `R-GEN-1` (trunk), `R-GEN-2` (trunk), `R-GEN-3` (trunk), `R-GEN-4` (trunk), `R-GEN-5` (trunk), `R-GEN-6` (trunk), `R-GEN-7` (trunk), `R-GEN-8` (trunk), `R-GEN-9` (trunk), `R-GEN-10` (trunk), `R-GEN-11` (trunk), `R-GEN-12` (trunk), `R-GEN-13` (trunk), `R-GEN-14` (trunk), `R-GEN-15` (trunk), `R-GEN-16` (trunk), `R-GEN-17` (trunk), `R-GV-15` (trunk), `R-GV-16` (trunk); control: `- **R-GV-17**` none.
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — docs(discovery): new model instantiate, not reproduced; stale canvas memo (P-2026-10-11-1135)` once (branch).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — ticket: after a page load every user view and viewpoint reads as a system default` once (branch).
   - `docs/log-inbox/new-model-instantiate.md`: the heading `## 2026-10-11 — fix(editor-v2): the canvas memo sees containment, F1 (P-2026-10-11-1135)` once (branch).
   - `docs/log-inbox/codegen-check.md`: the heading `## 2026-10-11 — feat(codegen): «Check» runs the oracle from the Code panel (P-2026-10-11-1053)` once (trunk).
   - `docs/log-inbox/codegen-check.md`: the heading `## 2026-10-11 — merge: codegen-check into alfonso-frontend-jjtl (P-2026-10-11-1250)` once (trunk).
   - `docs/log-inbox/codegen-examples.md`: the heading `## 2026-10-11 — feat(codegen): the two lecture examples as importable project files (P-2026-10-11-1415)` once (trunk).
   - `docs/log-inbox/codegen-examples.md`: the heading `## 2026-10-11 — merge: codegen-examples into alfonso-frontend-jjtl (P-2026-10-11-1542)` once (trunk).
   - `docs/log-inbox/codegen-names.md`: the heading `## 2026-10-11 — feat(codegen): readable element names in the generated JavaScript (P-2026-10-11-1052)` once (trunk).
   - `docs/log-inbox/codegen-names.md`: the heading `## 2026-10-11 — merge: codegen-names into alfonso-frontend-jjtl (P-2026-10-11-1238)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-11 — feat(harness): first-shot squares on the time axis (P-2026-10-11-1138)` once (trunk).
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
   - `docs/log-inbox/jjodie-reserved.md`: the heading `## 2026-10-11 — merge: jjodie-reserved into alfonso-frontend-jjtl (P-2026-10-11-0023)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — merge: do-freeze into alfonso-frontend-jjtl (P-2026-10-11-0034)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — fix(jjscript): block eval stops at end, a bare do fails a strict parse (P-2026-10-11-1145)` once (trunk).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-11 — merge: do-tickets into alfonso-frontend-jjtl (P-2026-10-11-1300)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: M1 canvas: xyflow refuses Transition→State over `target` after reopen` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-11 — ticket: leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts` once (trunk).
   - `docs/log-inbox/subclass-edge-gesture.md`: the heading `## 2026-10-11 — fix(editor-v2): superclass ids in the M2 signature, M1 gesture on subclass instances (P-2026-10-11-1025)` once (trunk).
   - `docs/log-inbox/subclass-edge-gesture.md`: the heading `## 2026-10-11 — merge: fix-subclass-edge-gesture into alfonso-frontend-jjtl (P-2026-10-11-1421)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/prompts/claude_2026-10-11_1135_prompt_new_model_instantiate.md`, `frontend/src/components/editor-v2/hooks/useEditorMode.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: new-model-instantiate takes alfonso-frontend-jjtl (P-2026-10-11-1716)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 91a5f2e31` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane new-model-instantiate · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/new-model-instantiate.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, new-model-instantiate took the trunk (P-2026-10-11-1716)` (P16, RC-17). `Outcome: done`. The merge of `new-model-instantiate` into the trunk gets its own prompt (`lane-run merge new-model-instantiate --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.

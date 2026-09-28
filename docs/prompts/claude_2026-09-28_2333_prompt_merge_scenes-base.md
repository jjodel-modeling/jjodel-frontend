# Prompt: merge scenes-base into alfonso-frontend-jjtl

Prompt-ID: P-2026-09-28-2333
Chat: C-2026-09-28-1936
Lane: full (merge; 1 conflict: `docs/log-inbox/simulation.md` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-2333 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `fb044365b`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `scenes-base` into the trunk with one merge commit, `--no-ff`, of the explicit sha `80b4397ea`, in the shape of `2d73c73d5` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `447e4239b`. The branch carries, on top of the base, 3 commits:

- `80b4397ea` docs: scenes-after-staging log entry and Status flip (P-2026-09-28-1025)
- `69f7dbea1` docs: four demo scenes read identical after the staging merge (P-2026-09-28-1025)
- `583f2efdf` docs: add prompt P-2026-09-28-1025, four demo scenes after the staging merge

The trunk carries, since the base, 91 commits:

- `fb044365b` docs: R-SIM-90 enters before the freeze (Alfonso, 2026-09-28)
- `e913b9627` docs: Status flip and log entry for the sim-mixin-owner merge (P-2026-09-28-2250)
- `2d73c73d5` merge: sim-mixin-owner into alfonso-frontend-jjtl (P-2026-09-28-2250)
- `dc127cea3` docs: add prompt P-2026-09-28-2250, merge sim-mixin-owner into alfonso-frontend-jjtl
- `95ff2ae75` docs: RC-33 (the Chat: line) and RC-34 (add-only gate) in decisions and P16
- `8082dbd55` docs: Status flip and log entry for the log-addonly-gate merge (P-2026-09-28-2211)
- `27b2090db` docs: R-SIM-90, Entry, Exit, Action and Guard multi-valued (ratified, deferred after MODELS)
- `5c8270c97` docs: log entry and Status flip, R-SIM-89 mixin owner fix (P-2026-09-28-2230)
- `68dbbc1fb` fix(sim): a mixin owner's feature warns, not incompatible (R-SIM-89) (P-2026-09-28-2230)
- `18e63e184` docs: discovery report, R-SIM-89 mixin verdict table before/after (P-2026-09-28-2230)
- `8296abeb1` docs: R-SIM-89 (mixin owners, ratified) and prompt P-2026-09-28-2230
- `d3dbacb36` merge: log-addonly-gate into alfonso-frontend-jjtl (P-2026-09-28-2211)
- `7f2a76413` docs: add prompt P-2026-09-28-2211, merge log-addonly-gate into alfonso-frontend-jjtl
- `fdb1e4390` docs: Status flip and log entry for check:addonly stage 2 (P-2026-09-28-2001)
- `160b00d2a` feat(harness): check:addonly compares whole entries, not lines (P-2026-09-28-2001)
- `ca43d6326` docs: Status flip and log entry for the sim-summary-fixes merge (P-2026-09-28-2143)
- `e70ee1aaa` merge: sim-summary-fixes into alfonso-frontend-jjtl (P-2026-09-28-2143)
- `79c77cb58` docs: add prompt P-2026-09-28-2143, merge sim-summary-fixes into alfonso-frontend-jjtl
- `a8b9b96e9` docs: Status flip and log entry for check:addonly (P-2026-09-28-2001)
- `65b8763a7` feat(harness): check:addonly refuses add-only log rewrites (P-2026-09-28-2001)
- `f4528d984` docs: log entry and Status flip for the M2 summary fixes (P-2026-09-28-2000)
- `434ba5a52` fix(sim): the declarations hint requires a readable value (S8) (P-2026-09-28-2000)
- `ff9aef558` fix(sim): warn when a stored simEvent goes ignored (S7) (P-2026-09-28-2000)
- `83f5f9cca` fix(sim): dependent proposals follow a kept Node/Transition (S6) (P-2026-09-28-2000)
- `dd1d9906f` docs(prompts): P-2026-09-28-2001 add-only log gate
- `846e13a73` docs(prompts): P-2026-09-28-2000 sim-summary-fixes (S6, S7, S8)
- `247a93549` docs: session checkpoint 2026-09-28, third (C-2026-09-28-1120)
- `ac62f6463` docs: Status flip and log entry for the sim-input-variables merge (P-2026-09-28-1914)
- `680af3bb2` merge: sim-input-variables into alfonso-frontend-jjtl (P-2026-09-28-1914)
- `122576568` docs: add prompt P-2026-09-28-1914, merge sim-input-variables into alfonso-frontend-jjtl
- `2230df5f1` docs: Status flip and log entry, sim-input-variables took the trunk (P-2026-09-28-1837)
- `016a03e86` docs: R-SIM-88 amended, input variables merge before the freeze (P-2026-09-28-1120)
- `e259b94ec` merge: sim-input-variables takes alfonso-frontend-jjtl (P-2026-09-28-1837)
- `9f25631fa` docs: add prompt P-2026-09-28-1837, merge alfonso-frontend-jjtl into sim-input-variables
- `7b3e1cae0` docs: Status flip and log entry for the lane-outcome-reminder merge (P-2026-09-28-1826)
- `ef8356005` merge: lane-outcome-reminder into alfonso-frontend-jjtl (P-2026-09-28-1826)
- `e52c38e82` docs: add prompt P-2026-09-28-1826, merge lane-outcome-reminder into alfonso-frontend-jjtl
- `ca1862b1f` docs: Status flip and log entry for the RC-20 reminder lane (P-2026-09-28-1545)
- `c24a91000` feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)
- `2161d7ac0` docs: add prompt P-2026-09-28-1545, lane-run appends the RC-20 closing line
- and 51 more: `git log --oneline 447e4239b..fb044365b`

Measured by `lane-run merge` at 2026-09-28 23:33, trunk at `fb044365b`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 80b4397ea`: 1 conflict: `docs/log-inbox/simulation.md`.
- Files changed since the base: 3 on the branch side, 86 on the trunk side; on both sides: `docs/log-inbox/simulation.md`.
- `git diff --name-only 447e4239b 80b4397ea -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_1025_prompt_scenes_after_staging_merge.md` (eseguito 2026-09-28 · lane fast · `69f7dbea1` (discovery report) · quattro scene identiche a `888ea9a9d`, docking ok su entrambe le tab, nessun bisect necessario).
- `git worktree list`: `scenes-base` in `/Users/alfonso/jjodel-w-scenes`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-09-28-2333/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `80b4397ea` is the tip of `scenes-base`; the prompt files of the branch read `Status: eseguito` at `80b4397ea`; `git worktree list` shows `scenes-base` only in `/Users/alfonso/jjodel-w-scenes`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 80b4397ea` (measured above: 1 conflict: `docs/log-inbox/simulation.md`). `git diff --name-only 447e4239b 80b4397ea -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 447e4239b alfonso-frontend-jjtl` with `git diff --name-only 447e4239b 80b4397ea` (measured above: `docs/log-inbox/simulation.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-33` (trunk), `RC-34` (trunk), `R-SIM-87` (trunk), `R-SIM-88` (trunk), `R-SIM-89` (trunk), `R-SIM-90` (trunk); control: `- **R-SIM-91**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — discovery: four demo scenes read identical after the staging merge (P-2026-09-28-1025)` once (branch).
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-28 (pomeriggio): `else` senza fratelli e variabili di input (R-SIM-87, R-SIM-88)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-09-28 (evening): mixin owners in the roles dialog (R-SIM-89)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1324)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): trace index and lane monitor, stage 1 (P-2026-09-27-1030)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1543)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: lane-outcome-reminder into alfonso-frontend-jjtl (P-2026-09-28-1826)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): check:addonly refuses add-only log rewrites (P-2026-09-28-2001)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — ticket: check:addonly cannot refuse 447e4239b, the incident that motivated it` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): check:addonly compares whole entries, not lines (P-2026-09-28-2001)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — ticket: e2448cf61 permanently fails check:addonly --range, by design, unresolved` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: log-addonly-gate into alfonso-frontend-jjtl (P-2026-09-28-2211)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — task: the four demo projects built headless and exported for Alfonso's own Import (P-2026-09-28-1015)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the simulator backlog cut into parallel lanes (P-2026-09-27-1625)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: simulation-engine into alfonso-frontend-jjtl (P-2026-09-28-1300)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: demo-prep into alfonso-frontend-jjtl (P-2026-09-28-1236)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: panel badge and dialog pill share one verdict (P-2026-09-28-0140)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-badge-pill into alfonso-frontend-jjtl (P-2026-09-28-1423)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: an else with no sibling is a defect at Reset, R7 (P-2026-09-28-0100)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-1539)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: input variables for the simulator, S1-S4 (P-2026-09-28-0034)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: alfonso-frontend-jjtl into sim-input-variables (P-2026-09-28-1837)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-input-variables into alfonso-frontend-jjtl (P-2026-09-28-1914)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: the M2 summary fixes S6, S7, S8 (P-2026-09-28-2000)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-summary-fixes into alfonso-frontend-jjtl (P-2026-09-28-2143)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — fix: mixin owner is a warning, not incompatible (R-SIM-89) (P-2026-09-28-2230)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-mixin-owner into alfonso-frontend-jjtl (P-2026-09-28-2250)` once (trunk).
4. `git merge --no-ff --no-commit 80b4397ea`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: scenes-base into alfonso-frontend-jjtl (P-2026-09-28-2333)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `80b4397ea` in `/Users/alfonso/jjodel-w-scenes`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard fb044365b` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the scenes-base merge (P-2026-09-28-2333)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-scenes`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.

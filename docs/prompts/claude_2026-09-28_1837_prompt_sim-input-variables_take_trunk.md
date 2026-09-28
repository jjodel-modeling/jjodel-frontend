# Prompt: sim-input-variables takes the trunk before its own merge

Prompt-ID: P-2026-09-28-1837
Chat: C-2026-09-28-1120
Lane: full (merge of the trunk into the branch; 5 conflicts: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-input`, branch `sim-input-variables`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-input`, branch `sim-input-variables`, `git log -1` is the commit that adds this file (its parent `f15692c00`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-1837 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `7b3e1cae0` into `sim-input-variables` with one merge commit, `--no-ff`, in the shape of `417b39053` (the last merge commit on `sim-input-variables`; read its body first). Merge base `e54999b0b`. The trunk brings, since the base, 19 commits:

- `7b3e1cae0` docs: Status flip and log entry for the lane-outcome-reminder merge (P-2026-09-28-1826)
- `ef8356005` merge: lane-outcome-reminder into alfonso-frontend-jjtl (P-2026-09-28-1826)
- `e52c38e82` docs: add prompt P-2026-09-28-1826, merge lane-outcome-reminder into alfonso-frontend-jjtl
- `ca1862b1f` docs: Status flip and log entry for the RC-20 reminder lane (P-2026-09-28-1545)
- `c24a91000` feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)
- `2161d7ac0` docs: add prompt P-2026-09-28-1545, lane-run appends the RC-20 closing line
- `df0487f94` docs: P16 names the trace monitor; ratification addendum, dark theme dropped (P-2026-09-28-1120)
- `707f472a9` docs: Status flip and log entry for the harness-trace merge (P-2026-09-28-1543)
- `19f8ae493` merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1543)
- `4db841a99` docs: add prompt P-2026-09-28-1543, merge harness-trace into alfonso-frontend-jjtl
- `2e401d51c` docs: Status flip and log entry for the sim-bridge-off-else merge (P-2026-09-28-1539)
- `18620166a` merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-1539)
- `e222d8ec9` docs: add prompt P-2026-09-28-1539, merge sim-bridge-off-else into alfonso-frontend-jjtl
- `0913b4c3f` docs: R-SIM-88 header on one line, docs:digest exit 0 (P-2026-09-28-1120)
- `58d168441` docs: close the trace monitor stage 1 lane (P-2026-09-27-1030)
- `7d2c53599` feat(harness): trace index and lane monitor, stage 1 (P-2026-09-27-1030)
- `b63c57571` docs: log entry and Status for R7, else with no sibling (P-2026-09-28-0100)
- `ee84361f3` feat(harness): lane-run keeps a copy of every lane input (P-2026-09-27-1030)
- `d1df46ab4` feat(sim): an else with no sibling is a defect at Reset, R7 (P-2026-09-28-0100)

This branch brings, 8 commits:

- `f15692c00` docs(sim): log entry and Status for the input variables (P-2026-09-28-0034)
- `b15fe4484` docs(spec): input variables, a third input of the step, S4 (P-2026-09-28-0034)
- `2033b731d` feat(sim): the input dialog and the input form of a Data row, S3 (P-2026-09-28-0034)
- `4884a57c3` feat(sim): the bridge asks the inputs a press reads, S2 (P-2026-09-28-0034)
- `ffcd0d5ae` feat(sim): input declarations in the core and codec, S1 (P-2026-09-28-0034)
- `417b39053` Merge branch 'alfonso-frontend-jjtl' into sim-input-variables
- `011157c2b` docs: sim input variables discovery (P-2026-09-28-0034)
- `ac7f5db80` docs: add prompt P-2026-09-28-0034, sim input variables discovery

Measured by `lane-run merge --trunk-into` at 2026-09-28 18:37, trunk at `7b3e1cae0`:

- `git merge-tree --write-tree --name-only sim-input-variables 7b3e1cae0`: 5 conflicts: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts`.
- Files changed since the base: 25 on the branch side, 22 on the trunk side; on both sides: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts`.
- `git diff --name-only e54999b0b f15692c00 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-28_0034_prompt_sim_input_variables.md` (eseguito 2026-09-28 · lane sim-input-variables · Phase 1 011157c2b; Phase 2 ffcd0d5ae, 4884a57c3, 2033b731d, b15fe4484 · verifica visiva non eseguita a mano: crops in ~/.jjodel-lanes/shots_input/ · not merged: after 2026-10-04 (R-SIM-88)).
- `git worktree list`: `sim-input-variables` in `/Users/alfonso/jjodel-w-input`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts`

## COME

1. Preconditions above, plus: `7b3e1cae0` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `7b3e1cae0` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only sim-input-variables 7b3e1cae0` (measured above: 5 conflicts: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts`). The four code conflicts are expected and this lane resolves them (Alfonso, 2026-09-28: the branch merges before the freeze, not after 2026-10-04). Both sides add behaviour to the same files: the trunk brings R7 (R-SIM-87, `d1df46ab4`: an `else` with no sibling is a defect at Reset, one new `CompileDefect.reason` literal) and R-SIM-86 (`runBag`); the branch brings the `input` form (R-SIM-88: input declarations, the read-only halt, the bridge `asks`). Resolve by keeping both sides whole: every rule, reason literal, export and test of each side survives, nothing is rewritten beyond what the two sides need to coexist. If a hunk cannot keep both behaviours (the two sides contradict each other, not just touch the same lines), stop with `Outcome: question`, the hunk quoted and one `Recommended:` line. A conflict in any other file outside `docs/decisions.md` and `docs/log-inbox/*.md`: stop with `Outcome: question`.
3. `git merge --no-ff --no-commit 7b3e1cae0`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-SIM-88` (trunk); control: `- **R-SIM-89**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: input variables for the simulator, S1-S4 (P-2026-09-28-0034)` once (branch).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): trace index and lane monitor, stage 1 (P-2026-09-27-1030)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: harness-trace into alfonso-frontend-jjtl (P-2026-09-28-1543)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — feat(harness): lane-run appends the RC-20 closing line to every input (P-2026-09-28-1545)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-09-28 — merge: lane-outcome-reminder into alfonso-frontend-jjtl (P-2026-09-28-1826)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — feat: an else with no sibling is a defect at Reset, R7 (P-2026-09-28-0100)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-28 — merge: sim-bridge-off-else into alfonso-frontend-jjtl (P-2026-09-28-1539)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`, `frontend/src/model/simulation/stcChecks.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-input-variables takes alfonso-frontend-jjtl (P-2026-09-28-1837)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane sim-input-variables · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/simulation.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, sim-input-variables took the trunk (P-2026-09-28-1837)` (P16, RC-17). `Outcome: done`. The merge of `sim-input-variables` into the trunk gets its own prompt (`lane-run merge sim-input-variables --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.

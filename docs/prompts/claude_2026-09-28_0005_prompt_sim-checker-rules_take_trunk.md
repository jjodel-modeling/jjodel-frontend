# Prompt: sim-checker-rules takes the trunk before its own merge

Prompt-ID: P-2026-09-28-0005
Chat: C-2026-09-27-1437
Lane: full (merge of the trunk into the branch; 2 conflicts: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/problems/registry.ts` measured)
Status: eseguito 2026-09-28 · lane sim-checker-rules · 5dd16be7e · verifica visiva non eseguita: la chat ha dato il GO senza l'hard-stop del passo 8, 2026-09-28 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-w-rules`, branch `sim-checker-rules`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-rules`, branch `sim-checker-rules`, `git log -1` is the commit that adds this file (its parent `2b815a87b`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-28-0005 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `e87df1ff6` into `sim-checker-rules` with one merge commit, `--no-ff`, in the shape of `6d8129aae` (the last merge commit on `sim-checker-rules`; read its body first). Merge base `93e964141`. The trunk brings, since the base, 64 commits:

- `e87df1ff6` docs: Status flip, RC-31 and log entry for the enum-step-b merge (P-2026-09-27-2327)
- `c030871ff` merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-2327)
- `4273433d9` docs: add prompt P-2026-09-27-2327, merge enum-step-b into alfonso-frontend-jjtl
- `e529b6c7f` docs: Status flip for the sim-halt-line merge (P-2026-09-27-2248)
- `ff4bc0988` merge: sim-halt-line into alfonso-frontend-jjtl (P-2026-09-27-2248)
- `2c3a38c29` docs: add prompt P-2026-09-27-2248, merge sim-halt-line into alfonso-frontend-jjtl
- `b071c168a` docs(sim): R-SIM-63 narrowed for the halt line, demo script, Status flip (P-2026-09-27-2225)
- `31851507b` docs: log entry and Status flip for the halt line lane (P-2026-09-27-2225)
- `1ec1e8138` docs: ratification memo of Alfonso's four answers of 22:20 (P-2026-09-27-2225)
- `e0e6ee5e4` fix(sim): the halt line reads whole in the halted state (P-2026-09-27-2225)
- `ef51b71ae` docs: add prompt P-2026-09-27-2225, the halt line reads whole in the halted state
- `d88e70e0e` docs: session checkpoints 2026-09-27 _5 and _6
- `babc1ee45` docs: Status flip for the sim-demo-script-modal merge (P-2026-09-27-2146)
- `ff5855d74` merge: sim-demo-script-modal into alfonso-frontend-jjtl (P-2026-09-27-2146)
- `0650c17c2` docs: add prompt P-2026-09-27-2146, merge sim-demo-script-modal into alfonso-frontend-jjtl
- `34c2f7013` docs(sim): demo script §5 after R-SIM-85, Status flip (P-2026-09-27-2105)
- `0224e7df4` docs(sim): demo script walks the Simulation roles dialog (P-2026-09-27-2105)
- `7145f1fc6` docs: add prompt P-2026-09-27-2105, demo script walks the Simulation roles dialog
- `22aa888de` docs: Status flip, R-SIM-85 and log entry for the sim-modal merge (P-2026-09-27-2049)
- `5eccdd4d2` merge: sim-modal into alfonso-frontend-jjtl (P-2026-09-27-2049)
- `bf49c11b6` docs: add prompt P-2026-09-27-2049, merge sim-modal into alfonso-frontend-jjtl
- `78afc0378` docs(sim): Status flip, the Simulation roles modal verified (P-2026-09-27-1740)
- `ebe2054f8` fix(sim): the first-open footer aligns with the roles footer (P-2026-09-27-1740)
- `1b498b6c1` docs(sim): Status flip and log entry, Simulation roles modal Phase 2 (P-2026-09-27-1740)
- `e34323517` feat(sim): user profiles and compatible selects in the modal, slice C (P-2026-09-27-1740)
- `038ddee4b` docs: Status of P-2026-09-27-1806, visual check passed (RC-23)
- `4908f2fa1` docs(views): enum step B Phase 2 closure (P-2026-09-27-1806)
- `90ae1d75b` feat(editor-v2): flag saved non-class types and supertypes in M2 (P-2026-09-27-1806)
- `b582ca7d4` feat(sim): the Simulation roles modal, system presets, slice B (P-2026-09-27-1740)
- `fa3199b42` docs: Status flip for the sim-demo-script-e1e2 merge (P-2026-09-27-1801)
- `a64bf5755` fix(editor-v2): no model write or DEdge for a non-class edge end (P-2026-09-27-1806)
- `c185ae373` fix(joiner): skip a non-class subclass when a feature is added (P-2026-09-27-1806)
- `8939401a0` feat(model): refuse a non-class reference type or supertype (P-2026-09-27-1806)
- `cbfb7bfad` merge: sim-demo-script-e1e2 into alfonso-frontend-jjtl (P-2026-09-27-1801)
- `2f4ae0e66` docs(enum-step-b): Layer Impact Report for Phase 2 (P-2026-09-27-1806)
- `196e071e7` docs: add prompt P-2026-09-27-1801, merge sim-demo-script-e1e2 into alfonso-frontend-jjtl
- `fb6b945a1` docs: add prompt P-2026-09-27-1806, enum step B Phase 2
- `c5da297cb` docs: Status flip for the enum-step-b merge (P-2026-09-27-1751)
- `c17f27d76` merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-1751)
- `645703645` feat(sim): the pure layer of the Simulation roles modal, slice A (P-2026-09-27-1740)
- and 24 more: `git log --oneline 93e964141..e87df1ff6`

This branch brings, 17 commits:

- `2b815a87b` docs(sim): P2b closure, R-SIM-70 extended, log entry, Status (P-2026-09-27-2235)
- `8beb4b28e` feat(sim): the checker rules R1-R5 (P2b) (P-2026-09-27-2235)
- `6d8129aae` merge: sim-derived-recursion into sim-checker-rules (P-2026-09-27-2235)
- `a4300095c` docs: add prompt P-2026-09-27-2235
- `811cb4ee5` docs(sim): checker gap P2a closure, log entry, Status (P-2026-09-27-1805)
- `e6d25ef5d` docs(sim): S3 closure, R-SIM-74 amended, log entry, Status (P-2026-09-27-1727)
- `0412501ef` feat(sim): guard and action checks in the problems registry (P-2026-09-27-1805)
- `d2a19ccab` feat(sim): the run orders derived attributes per element (P-2026-09-27-1727)
- `805c8ecdd` feat(sim): derived dependencies per element over frozen M (P-2026-09-27-1727)
- `4bbe3790a` docs(sim): Layer Impact Report for the checker gap Phase 2 (P-2026-09-27-1805)
- `4cc0c4c20` docs: add prompt P-2026-09-27-1805, checker gap Phase 2
- `a9acb6634` docs(sim): chat answers the checker gap discovery (P-2026-09-27-1726)
- `be8ad89a7` docs(sim): guard and action checks in the problems list discovery (P-2026-09-27-1726)
- `8baee76b6` docs(sim): Alfonso answers the derived recursion discovery (P-2026-09-27-1727)
- `4868359c9` docs(sim): well-founded recursion in derived attributes discovery (P-2026-09-27-1727)
- `21394e437` docs: add prompt P-2026-09-27-1727, sim_derived_recursion discovery
- `d1d45b9d3` docs: add prompt P-2026-09-27-1726, sim_checker_gap discovery

Measured by `lane-run merge --trunk-into` at 2026-09-28 00:05, trunk at `e87df1ff6`:

- `git merge-tree --write-tree --name-only sim-checker-rules e87df1ff6`: 2 conflicts: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/problems/registry.ts`.
- Files changed since the base: 21 on the branch side, 67 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/problems/registry.ts`.
- `git diff --name-only 93e964141 2b815a87b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-09-27_1726_prompt_discovery_sim_checker_gap.md` (eseguito 2026-09-27 · lane sim-checker-gap · measured on d1d45b9d3; the report is in the commit that carries this line (a commit cannot name its own sha)), `claude_2026-09-27_1727_prompt_discovery_sim_derived_recursion.md` (eseguito 2026-09-27 · lane sim-derived-recursion · d2a19ccab), `claude_2026-09-27_1805_prompt_sim_checker_gap_phase2.md` (eseguito 2026-09-27 · lane sim-checker-gap · 0412501ef (P2a; P2b not started, question to the chat)), `claude_2026-09-27_2235_prompt_sim_checker_rules.md` (eseguito 2026-09-27 · lane sim-checker-rules · 8beb4b28e).
- `git worktree list`: `sim-checker-rules` in `/Users/alfonso/jjodel-w-rules`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/editor-v2/problems/registry.ts`

## COME

1. Preconditions above, plus: `e87df1ff6` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `e87df1ff6` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only sim-checker-rules e87df1ff6` (measured above: 2 conflicts: `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/problems/registry.ts`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit e87df1ff6`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-31` (trunk), `R-SIM-85` (trunk); control: `- **R-SIM-86**` none.
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: guard and action checks in the problems list, S16 (P-2026-09-27-1726)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: guard and action checks in the problems registry, P2a (P-2026-09-27-1805)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: well-founded recursion in derived attributes, S3 (P-2026-09-27-1727)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: derived attributes ordered per element over frozen M, S3 (P-2026-09-27-1727)` once (branch).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the checker rules R1-R5 at Reset, P2b (P-2026-09-27-2235)` once (branch).
   - `docs/decisions.md`: the heading `### Decisione 2026-09-27: merges before the freeze (RC-31)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisioni 2026-09-27: il dialogo Simulation roles entra nella demo (R-SIM-85)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: E2, Bound from a bounded exploration and the activity-final row (P-2026-09-27-1611)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the run state on the canvas, S15, G3 canvas side (P-2026-09-27-1647)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: demo script after E1 and E2 (P-2026-09-27-1738)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — discovery: the Simulation roles modal, S11b and S11c, Phase 1 (P-2026-09-27-1740)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — feat: the Simulation roles modal, S11b and S11c, Phase 2 (P-2026-09-27-1740)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — merge: sim-modal into alfonso-frontend-jjtl (P-2026-09-27-2049)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — docs: demo script walks the Simulation roles dialog (P-2026-09-27-2105)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-09-27 — fix: the halt line reads whole in the halted state (P-2026-09-27-2225)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-27 — docs(views): enum step B discovery, load, undo/redo and replay against the guarded setters (P-2026-09-27-1645)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-27 — feat(model): enum step B Phase 2, model guards, B5 and the classifier-kind producer (P-2026-09-27-1806)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-27 — merge: enum-step-b into alfonso-frontend-jjtl (P-2026-09-27-2327)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/simulation.md`, `frontend/src/components/editor-v2/problems/registry.ts`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: sim-checker-rules takes alfonso-frontend-jjtl (P-2026-09-28-0005)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 2 with the §17 set (14); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `npx vitest run --reporter=dot`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane sim-checker-rules · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)`, pathspec after `--`, subject `docs: Status flip, sim-checker-rules took the trunk (P-2026-09-28-0005)`. No log entry. `Outcome: done`. The merge of `sim-checker-rules` into the trunk gets its own prompt (`lane-run merge sim-checker-rules --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.

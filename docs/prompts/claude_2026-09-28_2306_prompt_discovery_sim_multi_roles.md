# Prompt: discovery, R-SIM-90 (Entry, Exit, Action and Guard multi-valued)

Prompt-ID: P-2026-09-28-2306
Chat: C-2026-09-28-1936
Lane: discovery (read-only, simulation engine across modules and the roles dialog). Tier: heavy.
Status: eseguito 2026-09-28 · lane sim-multi-roles · discovery measured on d73f17383; the report is in the commit that carries this line (a commit cannot name its own sha)

Worktree: `~/jjodel-w-multi`, branch `sim-multi-roles` (cut by the chat from `alfonso-frontend-jjtl` at `fb044365b`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-multi`, branch `sim-multi-roles`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

R-SIM-90 (ratified 2026-09-28, in `docs/decisions.md`) makes `simEntry`, `simExit`, `simAction` and `simGuard` multi-valued: a list of attributes, a plain string read as a one-element list; actions are the union of the assignments of every bound attribute the instance's class carries; the guard is the conjunction, an attribute not carried contributing `true`. Each element is judged by `judge` (R-SIM-89). Alfonso wants it in the MODELS build before the freeze of 2026-10-01 (evening). The `.smv` generation is out (deferred after Malaga). A parallel lane is merging the outputs engine slice (`sim-outputs-accepting`, R-SIM-50/51/52) into the trunk now: it touches `netCompile.ts`, `netStep.ts`, `netTypes.ts`, `roleCatalog.ts`; this discovery must plan around it (Phase 2 will start from the trunk after that merge).

Goal: a Phase 2 plan precise enough to implement in one lane, with the risks for the four demo scenes measured, and the open points each with a `Recommended:` line.

## DOVE (read-only)

- `frontend/src/model/simulation/`: `roleCatalog.ts`, `netCompile.ts` (the reading of the keys, about `:51`), `netStep.ts`, `bindingCompat.ts`, `profileBinder.ts`, the codec of the Trigger list (R-SIM-38 precedent: how a multi-valued key is stored and read), `stcChecks.ts` (where a double assignment is or could be reported), and their tests.
- `frontend/src/components/editor-v2/sim/`: `SimRolesModal.tsx`, `simRolesDraft.ts`, `simRoleStatus.ts`, `SimulationPanel.tsx` (the rows and selects of the four roles, S10 filtering, the pill and badge verdicts).
- The four demo scenes: which of the four roles each binds today, and how (the preset fixtures of the existing tests; the exports in `/Users/alfonso/jjodel-demo-exports/` are `DProject` records, read-only).
- Report: `docs/discovery/discovery_2026-09-28_sim_multi_roles.md` (naming per `CLAUDE.md`), opening with `## 0. Answer in brief`, at most 40 lines. The only file this lane writes, plus this prompt's Status and a log entry in `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, the discovery report rules), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, and R-SIM-17, R-SIM-24, R-SIM-38, R-SIM-86..R-SIM-90.
2. Answer, with [M] measured or [R] read tags and file:line:
   a. Storage: how the Trigger list is encoded in the bag and decoded; can the four keys reuse it unchanged; what a saved single string reads as; what Apply and one undo write.
   b. Engine: every site that reads the four keys; the change to union (actions) and conjunction (guard); where an attribute not carried by the class is skipped today (the R-SIM-89 test in `actionEvaluator.test.ts`); how R-SIM-50/51 (outputs, single-valued) coexist.
   c. Double assignment: where it is detected today (step or Reset); what changes with several attributes; a `Recommended:` on a static defect at Reset when two attributes carried by the same class write the same target (not ratified yet).
   d. Verdicts: `judge` per element; the verdict of the role (worst element? any incompatible?); the pill and the badge.
   e. The dialog: the multi-select as chips, fixed height, no layout shift, the existing design tokens and components to reuse (grep; no new dependency); keyboard and accessible names; what the four demo scenes' dialogs show before and after (they must read the same when a scene binds one attribute per role).
   f. The binder: does `bindProfile` propose one attribute or several; recommend.
   g. Tests to write first; files to touch, with a size estimate; the order relative to the outputs merge; the conflicts expected with `sim-outputs-accepting`.
3. Do not write code. Probes allowed only as gitignored `_tmp_*` scripts under `npx tsx`, no dev server.
4. Commit the report, the log entry and this prompt's Status in one docs commit. Stop with `Outcome: hard-stop` (or `question` if a point cannot be recommended), the sha, and §0 of the report.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, dark-theme work.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-90 (with the Guard amendment), R-SIM-89, R-SIM-38, R-SIM-17, R-SIM-24.
- `docs/discovery/discovery_2026-09-28_sim_mixin_verdicts.md`; the R-SIM-89 tests.

# Prompt: discovery, the faces of Accepting and outputs, their M2 rows, and the four hidden presets

Prompt-ID: P-2026-09-29-0239
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the simulation panel, the roles dialog, the profiles). Tier: heavy.
Status: eseguito 2026-09-29 · lane discovery sim-outputs-faces-disc · measured on 07dd278e3; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop

Worktree: `~/jjodel-w-faces`, branch `sim-outputs-faces-disc` (cut by the chat from `alfonso-frontend-jjtl` at `c2560b69e`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-faces`, branch `sim-outputs-faces-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

The engine reads Accepting and the role-bound Moore and Mealy outputs since the merge of `sim-outputs-accepting` (R-SIM-91..93 on the trunk; discovery `docs/discovery/discovery_2026-09-27_sim_outputs_accepting.md`, §0). What is still missing, per that discovery: (1) the M2 rows: `ROLE_SPECS` has no select for `simAccepting`, `simStateOutput`, `simTransitionOutput`, so DFA reads `Missing: Accepting.` with nothing to fix it; (2) the faces: «accepting» in the status row, the Moore output beside the marking line, the Mealy output in «Last step»; (3) the `off`-key resolver (S5): check whether R-SIM-86 (a role `off` reads as unbound) already covers it on the trunk; (4) the four hidden presets (DFA, NFA, Moore, Mealy) shown in the preset list. Alfonso wants everything in the MODELS build before the freeze (2026-10-01 evening), the `.smv` generation excepted. R-SIM-90 (multi-valued roles; the output roles stay single-valued) and R-SIM-94 (data on the model tab) are on the trunk and touch the same files.

Goal: a Phase 2 plan for one lane, with what changes on the four demo scenes' dialogs and panels (the preset list will show four more entries: say where and how), and the risks before the freeze.

## DOVE (read-only)

- `frontend/src/model/simulation/` (`roleCatalog.ts`, `simProfiles.ts`, `netCompile.ts`, `netStep.ts`, `netTypes.ts`), `frontend/src/components/editor-v2/sim/` (`SimRolesModal.tsx`, `simRoleStatus.ts`, `SimulationPanel.tsx`, `simBridge.ts`), their tests; the S4 discovery; R-SIM-50..52 as renumbered R-SIM-91..93, R-SIM-86, R-SIM-90, R-SIM-94 in `docs/decisions.md`.
- Report: `docs/discovery/discovery_2026-09-29_sim_outputs_faces.md`, opening with `## 0. Answer in brief`, at most 40 lines; plus this prompt's Status and a log entry in `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, and the rows named above.
2. Answer with [M]/[R] evidence and file:line: the three M2 rows (group, label, candidates, verdicts via `judge`); the three faces (exact texts, placement, fixed sizes, no layout shift); S5 today; the four presets (profile, where they appear, what `Checkable` means for each on a plain DFA/Moore/Mealy metamodel); what the four demo scenes show differently, line by line; a DFA and a Moore example metamodel to probe with.
3. Probes only as gitignored `_tmp_*` scripts under `npx tsx`, no dev server.
4. `Recommended:` Phase 2 file list and order, and on timing. Name any point that is Alfonso's decision.
5. One docs commit. Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file.

## RIFERIMENTI

- The S4 discovery; R-SIM-86, R-SIM-90..94.

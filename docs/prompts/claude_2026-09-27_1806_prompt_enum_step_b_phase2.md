# Prompt: Phase 2 of P-2026-09-27-1645, enum step B (additions-only guard, B5) and the S24 producer

Prompt-ID: P-2026-09-27-1806
Chat: C-2026-09-27-1437
Lane: full (Phase 2 of the discovery P-2026-09-27-1645; critical zone: VersionFixer.tsx, canvasToJjom.ts)
Status: eseguito 2026-09-27 · lane enum-step-b · 90ae1d75b · verifica visiva passata 2026-09-27 (chat, RC-23)

Worktree: `~/jjodel-gate`, branch `enum-step-b` (continues the discovery branch), a fresh session started by `lane-run --critical-zone-goahead P-2026-09-27-1806` (RC-30: Alfonso's standing go-ahead of 2026-09-27 00:58; the Layer Impact Report is the first step and is committed before any critical-zone edit). Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `enum-step-b`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Implement the Phase 2 slices that `docs/discovery/discovery_2026-09-27_enum_step_b.md` recommends, in its order, with the decisions recorded at its end (Alfonso's ratifications of 2026-09-27 and the chat's answers). Alfonso decided at 17:53 that Phase 2 follows Phase 1 in cascade.

## DOVE

Ownership map for the parallel Phase 2 lanes of 2026-09-27 (binding; read-only access to everything else):
- sim-modal (P-2026-09-27-1740): SimulationPanel.tsx, simulation-panel.scss, SimRolesModal.*, simRolesDraft.*.
- sim-derived-recursion (P-2026-09-27-1727): derivedEvaluator.ts, guardContext.ts, actionEvaluator.ts, subsetChecker.ts, the jjel evaluator files, simBridge.ts and its test.
- sim-outputs-accepting (P-2026-09-27-1725): netTypes.ts, netCompile.ts, netStep.ts and their tests (engine slice only; the face slices wait for sim-modal's merge).
- sim-canvas-state (P-2026-09-27-1647): nodes/ObjectNode.tsx, sim/simRunState.ts, editor-v2/types.ts, styles/tokens/ (slice A1 only; A2 waits for sim-modal).
- sim-checker-gap (P-2026-09-27-1805): problems/** except UniquenessProblemSync, stcChecks.ts, the mount in EditorV2.tsx.
- enum-step-b (P-2026-09-27-1806): joiner/classes.ts, joiner/proxy.ts, LModelElement.tsx, VersionFixer.tsx, canvasToJjom.ts, problems/UniquenessProblemSync.tsx.
A file owned by another lane is read-only for you; if your slice needs it, stop with Outcome: question and a Recommended: line.

## COME

1. Read `CLAUDE.md` and the report whole; write the Layer Impact Report for every critical-zone file you will touch into `docs/discovery/lir_2026-09-27_enum_step_b.md` and commit it first.
2. Rules: tests first where logic is involved; one code commit per slice; gates after each slice (typecheck with the 14 known errors, vitest on the folders you touch, build); verify every new identifier is free with a global grep; English text, no em dashes; Bootstrap Icons and design tokens only for any UI. Merge policy (Alfonso 2026-09-27): Phase 2 runs now, in cascade after Phase 1; this branch is NOT merged on the trunk before 2026-10-04 unless the chat says so, because Alfonso ratified its merge after MODELS. Close with one docs commit (log-inbox entry, Status line updated), then Outcome: hard-stop with the shas, the counts and, for any visible change, probe crops in light and dark in ~/.jjodel-lanes/shots_<slug>/ for the chat's RC-23 check.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a file of another lane.

## RIFERIMENTI

- The discovery report above; `docs/decisions.md`; `docs/PROTOCOL.md` P13, P14, P16; RC-17, RC-21..26, RC-30.

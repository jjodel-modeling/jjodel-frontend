# Prompt: discovery, the Simulation pill gated by Advanced mode and a metamodel «Semantic type», and the Jjodie/pill placement

Prompt-ID: P-2026-09-29-1040
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the canvas overlay buttons, the Properties panel, the simulation profile key). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-simgate`, branch `sim-gate-disc` (cut by the chat from `alfonso-frontend-jjtl` at `0fbb550ea`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-simgate`, branch `sim-gate-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29, decided (before the freeze):

1. **Placement.** On the canvas, the Jjodie button (round, dark, robot icon) and the «Simulation» pill (play icon) sit badly together: Jjodie too high and too big. Jjodie goes lower and a bit smaller; the pill aligns with it (same baseline or a clean stack, fixed gap), no overlap with the canvas content, no layout shift.
2. **Visibility.** The Simulation pill shows only when **both**: the interface is in **Advanced** mode, and the metamodel (for a model: its metamodel) has a **Semantic type** set. The Semantic type is a new field in the metamodel's Properties panel (Advanced only): `None` or one of the eight presets of the Profile select (`PANEL_PROFILE_IDS`). Choosing a preset writes the existing `simProfile` key, the same one the roles dialog writes (no new persisted key if possible); `None` removes the pill (say what happens to an existing role bag: kept, recommended). The roles dialog stays as the place to bind roles.

The demo scenes start with no `sim*` keys (the exports carry none): after this change every scene needs Advanced mode and the Semantic type set before the pill appears. The demo script must be updated in the Phase 2 lane, re-measured.

Goal: the facts and a Phase 2 plan.

## DOVE (read-only)

- The component(s) that render Jjodie's floating button and the Simulation pill on the M2 and M1 canvases (grep `Simulation`, `jjodie`, the robot icon class), their SCSS, their positions and z-index.
- `isAdvancedMode` / `useInterfaceMode` and how other features gate on it.
- The metamodel Properties panel (`src/components/panels/`), how it renders Advanced-only fields and writes model properties, one undo step.
- `simProfile` read and write sites (`simRoleStatus.ts`, `SimRolesModal.tsx`, `SimulationPanel.tsx`, `simBridge.ts`), the preset list.
- The demo script's first steps per scene (`docs/demo/models_2026_simulator_demo.md`).
- Report: `docs/discovery/discovery_2026-09-29_sim_gate_and_placement.md`, opening with `## 0. Answer in brief`, at most 40 lines; plus this prompt's Status and a log entry in `docs/log-inbox/simulation.md`.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, critical zone, naming), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, the R-SIM rows on the profile and the panel, R-SIM-95.
2. Answer with [M]/[R] evidence and file:line: current positions and sizes (px) of both elements; the proposed values on the 8 px grid; where the gate goes (one predicate, used by both canvases); the Properties field (label «Semantic type», options, write path, undo); what writing `simProfile` from Properties does to the dialog and the panel; what `None` does; the extra steps per demo scene and their count.
3. Measure with gitignored `_tmp_*` scripts under `npx tsx` if useful; no dev server.
4. `Recommended:` Phase 2 file list and order; files it shares with the running lane `sim-guard-word` (`simBridge.ts`, the demo script): say which. Name any point that is Alfonso's decision.
5. One docs commit. Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## RIFERIMENTI

- R-SIM-95 (presets); the demo script; `CLAUDE.md` on progressive disclosure (Basic/Advanced).

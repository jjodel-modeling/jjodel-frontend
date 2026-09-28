# Prompt — Simulation engine, slice 0: foundations (pure core, per-model run-state, one "is a")

**Date**: 2026-09-14 01:40
**Type**: feat, Phase 2 (implementation). Discovery already done and committed:
`docs/discovery/discovery_2026-09-13_simulation_engine_state.md` and
`docs/discovery/discovery_2026-09-13_jjel_eval_context.md`. Read both before starting; every
path and line below comes from them.
**Spec**: `docs/spec/claude_spec_2026-09-13_computational_model.md` (ratified; §9 is the plan).
**Decisions**: `docs/decisions.md`, R-SIM-7..R-SIM-15 (2026-09-14).
**Lane**: simulation engine. Not before the 3.0 release of 2026-09-15.

## Where this runs (branch and worktree)

The main working tree is on `validation-skeleton` with two dirty files of another lane and
cannot switch branch. Work in a **separate worktree** on a new branch from the trunk:

```
git worktree add ../jjodel-sim -b simulation-engine alfonso-frontend-jjtl
```

(`git worktree list` shows an old `../jjodel-release` worktree marked prunable; leave it alone.)
Everything below happens in `../jjodel-sim`. `sim/` is byte-identical between the two branches
(discovery §6), so the reports apply unchanged.

## Why this slice exists

Step 1 (events) and step 3 (unified cycle) of the plan both change the step. Today the step is
inline in `SimulationPanel.tsx:270-288` and the run-state is one global `Set<string>`
(`sim/simRunState.ts:17`). Changing semantics inside a React handler with no tests is how the
fire-all became unverifiable. This slice moves the machinery into a pure, tested core **without
changing behaviour**, so that the next slices change a function with tests, not a handler.
Behaviour-preserving is the contract: the fire-all stays, for now, exactly as it is (R-SIM-7
replaces it in step 3, not here).

## What to do (COSA), in three commits with a hard stop after each

### Commit 1 — the pure core, behaviour-preserving

Create `frontend/src/model/simulation/` (R-SIM-14; mirror the layout of `model/validation/`,
read it first). No React, no store imports, no imports from `components/`. Only raw data in,
data out.

- `types.ts`: the configuration and the STC descriptor as data.
  - `SimConfiguration = { marking: ReadonlySet<string>; event: null }` for now (boolean kind;
    `event` is a placeholder typed `null` until step 1; do not model values yet).
  - `StcDescriptor = { kind: 'boolean'; roles: { initial, terminal, ownedTransitions, nextState,
    node?, transition? } }` where each role holds the pointer string read today from the six flat
    keys (`SimulationPanel.tsx:36-73`). Keep the key names as they are; add nothing.
  - `StepLabel = { fired: string[]; deactivated: string[]; activated: string[] }`, the record of
    what the step did (the first form of spec §4.5; it grows later).
- `stcFromRoles.ts`: `stcFromRoles(state: Record<string, unknown> | undefined): StcDescriptor | null`,
  returning `null` when the four engine keys are not all set (same rule as `rolesComplete`, `:223`).
- `step.ts`: `stepFlowchartBoolean(config, stc, view): { next: SimConfiguration; label: StepLabel }`
  reproducing **exactly** today's `Step` handler (`:270-288`, discovery §4): terminal freeze
  (any marked terminal → no-op), all outgoing transitions of all marked instances fire,
  dangling targets vanish, source deactivated even when all targets dangle, activation wins over
  deactivation. `view` is a small read interface you define in `types.ts` (something like
  `{ exists(id): boolean; isInstanceOf(id, classId): boolean; outgoingTargets(id): string[] }`)
  so the core never touches `idlookup` or L proxies directly. Also `initialConfiguration(stc, view, ids)`
  reproducing `Reset` (`:250-257`) and `runStatus(config, stc, view)` reproducing `:235-248`
  (the four strings, same rules, including the deduced quirks in discovery §4).
- `__tests__/step.test.ts`: lock the current behaviour with a fake `view`: linear chain, fork,
  join, dangling target, terminal freeze, instance with no outgoing (stays marked, status
  `Deadlock` while others progress), empty configuration. These tests are the regression net for
  step 3; write the quirks as tests named as quirks, not as features.

Hard stop 1: `npm run typecheck` and the new tests green. Nothing in `sim/` touched yet.

### Commit 2 — the panel calls the core, and the run-state is per model (R-SIM-13)

- `sim/simRunState.ts`: replace the single `Set` with `Map<modelId, SimConfiguration>`. Keep the
  exported names and signatures **additive**: `isSimActive(objectId)` stays boolean (true if any
  model's marking holds it), `getSimActiveIds()` gains an optional `modelId` and without it
  returns the union (document that the union is transitional), `simReset`/`simApplyStep`/`simClear`
  gain a leading `modelId` parameter with the old positional call still compiling only if you
  keep an overload; prefer changing the three internal call sites in `SimulationPanel.tsx`
  (`:256`, `:287`, `:221`) and no overload. One global `version` stays (R-MK-6 is out of scope).
- `sim/SimulationPanel.tsx`: `Reset`, `Step` and `runStatus` delegate to the core through an
  adapter `view` built on `idlookup` and the L proxy in the panel file (the impure side stays
  here, as `*Adapter.ts` does for the D-graph). Remove the inline logic they replace; do not
  touch the M2 face, `ROLE_SPECS`, `collectMetaOptions`, the SCSS, or the status strings.
- `simClear()` on unmount (`:221`) clears **its own** model only.

Hard stop 2: typecheck, all tests, and a **visual smoke** on `http://localhost:3000`: open the
flowchart example used for the 2026-08-17 memo, configure nothing new, run Reset / Step / Stop
and see the same highlights and status as before this slice. Declare it in the log entry; if
you cannot run it, say so and stop.

### Commit 3 — one notion of "is a" (R-SIM-8)

Replace the exact-id matches `instanceof === roles.simInitial` / `simTerminal` (now inside the
adapter's `isInstanceOf`) with ancestry-aware matching. First `grep -rn "isKindOf\|allSuperclasses\|superclasses" frontend/src --include=*.ts --include=*.tsx`
and reuse an exported **pure** helper if one exists outside `editor-v2/viewpoint/ir/` (that
folder is critical zone: import from it only if the helper is already exported for reuse and
importing it pulls no React or store; otherwise write a small pure `isKindOf` in
`model/simulation/` over the raw `DClass` `extends` chain and note the duplication in the log).
Add a test: a subclass of the initial metaclass is initial.

Hard stop 3: typecheck, tests, log entry. Then stop; step 1 (events) is a separate prompt.

## Where (DOVE)

New: `frontend/src/model/simulation/{types.ts,stcFromRoles.ts,step.ts,__tests__/step.test.ts}`
and possibly `isKindOf.ts`. Modified: `frontend/src/components/editor-v2/sim/simRunState.ts`,
`frontend/src/components/editor-v2/sim/SimulationPanel.tsx`. Nothing else. In particular **not**:
`nodes/ObjectNode.tsx`, anything under `editor-v2/viewpoint/ir/`, `joiner/classes.ts`,
`reducer.ts`, `jjel/*`, `jjscript/*`, `model/validation/*`.

## How (COME)

- Before any new identifier, grep the codebase for it (`model/simulation`, `SimConfiguration`,
  `StcDescriptor`, `StepLabel`, `isKindOf`, `stepFlowchartBoolean`).
- Minimal diffs; no renames of existing identifiers; no refactor of `SimulationPanel.tsx` beyond
  the delegation. The `sim-active` class and the `'mark'` channel keep working unchanged because
  `isSimActive` keeps its contract.
- Commits: `feat: ...`, one line, English; `git add <files>` by name.
- `docs/claude-code-log.md`: one entry per commit, newest-first under the header, with
  **Regressions**, **Out-of-scope changes**, **Layer Impact Report: not-required** (no critical
  zone file touched; if commit 3 imports from `viewpoint/ir/`, say which export and why it is
  safe), **Smoke visivo** with what was seen.
- If anything in the discovery reports turns out wrong on the trunk (a line moved, a name
  differs), correct the fact in the log entry and continue; do not silently adapt.

## References

- `CLAUDE.md`, `docs/PROTOCOL.md`.
- `docs/discovery/discovery_2026-09-13_simulation_engine_state.md` §2, §3, §4, §7 (step 3), §8.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §2, §3, §9.
- `docs/decisions.md` R-SIM-1..R-SIM-15.
- `frontend/src/model/validation/` as the layout precedent for a pure core.

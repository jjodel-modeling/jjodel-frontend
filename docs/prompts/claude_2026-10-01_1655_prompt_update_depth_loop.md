# Prompt: Phase 1 and 2 in cascade, dragging on a derived viewpoint kills the canvas with «Maximum update depth exceeded»

Prompt-ID: P-2026-10-01-1655
Chat: C-2026-10-01-1640
Lane: Phase 1 then Phase 2 in cascade (critical zone possible; Layer Impact Report before any edit there; go-ahead RC-30 given at launch). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-updatedepth`, branch `update-depth-loop`, created from the trunk `alfonso-frontend-jjtl` at `4b018b82b`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-updatedepth`, branch `update-depth-loop`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, on 3001 (trunk `4b018b82b`, version 2.229), project «Notation Demo» (metamodels ER and FlowChart, model `model_1` conforming to FlowChart, five derived viewpoints: «metamodel_1 (derived)», «ER (derived)», three «FlowChart (derived)»), was moving something on the canvas of `model_1` under a «FlowChart (derived)» viewpoint (id `Pointer1790855204794_USER_263`). The whole editor pane went to the `<Try>` fallback: «Maximum update depth exceeded», toast «Error in View: Unknown». He says it is not the first time. A demo at MODELS (Málaga, merges until 2026-10-07) cannot survive this.

Evidence captured from his tab (`window.tryreport`, 2026-10-01 14:49:48Z):

- Component stack, innermost first: `StoreUpdater` (@xyflow/react) < `Wrapper` < `ReactFlow` < `HighlightProvider` < `EditorV2Inner` (EditorV2.tsx) < `BatchProvider` < `ReactFlowProvider` < `EditorV2` < `ActiveEditorProvider` < `EditorSwitch` < `ModelTabComponent`.
- Error stack: `checkForNestedUpdates` < `scheduleUpdateOnFiber` < `forceStoreRerender` < `handleStoreChange` < xyflow store `setState` < `setNodes` < (xyflow, StoreUpdater layout effect) < `commitHookEffectListMount` < `commitLayoutEffectOnFiber` < `commitLayoutEffects` < `commitRoot` < `performSyncWorkOnRoot` < `flushSyncCallbacks`.

Reading of the chat, to be verified, not assumed: `StoreUpdater` pushes the `nodes` prop into the React Flow store in a layout effect whenever its reference changes. Fifty nested synchronous commits mean that something hands EditorV2 a new `nodes` array on every commit from inside the layout phase, so each commit schedules the next one. The prime suspect is `useContentDrivenSize` (`viewpoint/ir/useContentSize.ts`): a `useLayoutEffect` with no dependency array that calls `setNodes`, with a write budget (`MAX_UNACCEPTED_WRITES = 3`) that is reset to 0 whenever the target size changes (`if (!sameTarget) unaccepted.current = 0`). If the intrinsic measurement alternates between two values during a drag (or two vertices, or the hook and another writer, alternate), the budget never trips and the loop is unbounded. Other candidates to rule in or out by measurement: any EditorV2 layout effect or `onNodesChange` path that rebuilds the nodes array unconditionally, the IR edge/junction code merged on 2026-09-30 (`activity-decision-merge`, `irJunctions.ts`), the unmount drop of P-2026-09-30-1625 (`f031d4948`), `useJjomSelection.ts` (edge-click-properties, `35d8c8e89`). A chat repro in a background Chrome tab did not trigger it; a background tab runs no ResizeObserver and no rAF, so that negative says nothing.

1. Reproduce. Build a FlowChart-like model with derived viewpoints (DemoFlowB and «Derive viewpoint» for each notation it offers: generic, flowchart, Activity (UML); add the R-VP Petri and statechart ones if they apply) and drag every node with real pointer motion (Playwright `mouse.down`/`mouse.move` with `steps >= 30`/`mouse.up`, a visible page so ResizeObserver runs), slow and fast, also dragging a node across or onto edges, onto a junction, and a resize handle. Count, per drag, the synchronous nested commits and who calls `setNodes` (instrument with a temporary wrapper, never committed). Record the minimal sequence that crashes. If no sequence crashes in a bounded effort (about 20 minutes of probing), say so, keep the counters, and still close the unbounded paths found by reading.
2. Root cause with file and line: which writer, why it does not converge, why it is synchronous.
3. Fix: no sequence of user gestures can drive a nested-update loop from the IR sizing path or from EditorV2's nodes plumbing. A writer in a layout effect must converge or yield after a bounded number of writes whatever the measurement does (oscillation included), and yielding must leave a usable canvas, not a white one. Behaviour that is correct today (derived sizes, `isResized` precedence, the unmount drop of P-2026-09-30-1625, size parity in the default viewpoint) stays as it is. No change to the persisted model; if the fix needs one, stop with `Outcome: question`.
4. A safety net is welcome only in addition to the root-cause fix, never instead of it: if the editor still crashes for an unforeseen loop, the error must stay inside the canvas and say so, without taking the rail and the tabs with it. Recommend it in the report; implement it only if it is small and inside EditorV2.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-10-01_update_depth_loop.md` with the objective, files read (full paths), the reproduction (sequence, counters, which `setNodes` caller), the root cause with file and line, dependencies and risks, the Layer Impact Report if the critical zone is involved, questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless a question has no single recommendation, or the fix touches `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts` beyond what the report names.

Phase 2: the files the report names (expected: `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` and its tests; `EditorV2.tsx` only if the report names it), a log entry in `docs/log-inbox/views.md`, this prompt's Status.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the size contract (`shapeRegistry.ts`, `viewpoint/ir/useContentSize.ts`), `docs/discovery/discovery_2026-08-15_cablaggio_taglia_da_contenuto.md`, the report of P-2026-09-30-1625 (`discovery_2026-09-30_derived_size_leak.md`), and the xyflow `StoreUpdater` and `useReactFlow().setNodes` in `node_modules/@xyflow/react` to confirm the reading above.
2. Reproduce with `lane-run probe` on a free port (not 3000, 3001, 3003), light theme, isolated profile; report, committed.
3. Tests first: a unit test in which the measurement alternates between two sizes on successive commits and the hook stops writing within the budget (it fails on `4b018b82b`); the existing `useContentSizeUnmount` tests stay green. Mutation bench on the fix; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: the crashing sequence from step 1 replayed after the fix, 0 crashes over at least 20 repetitions per derived viewpoint; crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_updatedepth_crops/` (gitignored); the four demo scenes in the default viewpoint 0 px from `4b018b82b`, and the derived viewpoints of DemoFlowB 0 px at rest (the fix must not change a settled size).
6. Commits: `fix:` code and tests, `docs:` report, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crash counters before and after, the mutation score, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

`useContentSize.ts` (budget `MAX_UNACCEPTED_WRITES`, `sameTarget` reset); P-2026-09-30-1625 (`f031d4948`, unmount drop); P-2026-09-30-2220 (`530c18a7e`, activity decision/merge, `irJunctions.ts`); P-2026-09-30-2105 (`35d8c8e89`, `useJjomSelection.ts`); `Try.tsx` (`TryFallbackGuard`, P-2026-09-30-1540); @xyflow/react v12 `StoreUpdater`.

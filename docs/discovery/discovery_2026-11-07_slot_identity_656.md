# Discovery — ticket #656: the identity slot of objects created by JjScript and on the canvas

- Prompt-IDs: P-2026-11-07-0654 (`docs/prompts/claude_2026-11-07_0654_prompt_slot_identity_656_discovery.md`, session
  47b95570, stopped at the context ceiling with its measurements in `~/.jjodel-lanes/P-2026-11-07-0654/handoff.md`) and
  P-2026-11-07-0720 (`docs/prompts/claude_2026-11-07_0720_prompt_slot_identity_656_continuation.md`, session ff21fbcc).
- Tree: `~/jjodel-w-slot656`, branch `slot-identity-656`, HEAD `22cea3e4b`. Code identical to `8df0859f2`, where every
  measurement was taken (`git diff --stat 8df0859f2 HEAD -- frontend` is empty).
- Executor: Opus 5.5 (`claude-opus-5-5`).
- Ticket: https://github.com/jjodel-modeling/jjodel-lanes/issues/656. Decisions: R-TXT-45, R-TXT-46, R-TXT-56.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real
files.

## 1. Objective

#656 has two parts that `docs/discovery/discovery_2026-11-07_textual_name_slot.md` (§5.2-5.4, §6.1, §8 N1 and N5) left
open. (1) Option B: `create instance of C "h"` names `DObject.name` and `initialName` but never writes the identity slot,
so conformance CHECK 2 flags the object and the XMI export omits its name. Design the executor's write and measure it.
(2) The canvas case N5: an object dropped on the v2 canvas has an empty slot and only its auto-name. Compare options
(a) seed, (b) read fallback, (c) leave. Then classify the files, write the final Layer Impact Report, plan the lanes and
recommend one answer per decision.

## 2. Hypotheses under test

| # | hypothesis | verdict | evidence |
|---|---|---|---|
| H1 | On HEAD a console create leaves the slot raw `[]`, CHECK 2 flags it and XMI omits the name | **holds** | §4 S1 HEAD |
| H2 | An executor write of the slot after the create, awaited, yields `["x"]`, CHECK 2 clean, XMI `name="x"`, one Undo | **holds** | §4 S1 await / settle |
| H3 | A deferred (not awaited) write is as correct and cheaper | **falsified** | §4 S4, S6a: overwrites a textual `set` in 5/10 |
| H4 | Forcing the pending commit (`settlePendingWrites`) instead of polling makes the awaited write cost one macrotask | **falsified on cost, holds on correctness** | §4 S3: 16.8 s / 13.6 s for 50, not ~6.2 s / ~0.1 s |
| H5 | With option A in, the textual `set h.name` after the create stays idempotent (no second undo step, no storm) | **holds** | §4 S4: +1 undo entry, Applied, conformance clean in every variant |
| H6 | Canvas (b), read fallback in CHECK 2 and XMI, clears both with no write and heals old models | **holds**, with one inconsistency | §4 S5, O |
| H7 | A canvas create is its own undo step | **falsified** (outside #656) | §9 |

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-slot656/frontend/src/jjscript/executor/commands/instance.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/jjscript/executor/elementWaiter.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/model/logicWrapper/LModelElement.tsx`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/joiner/classes.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/model/conformance/ConformanceValidator.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/services/export/XMIService.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/components/editor-v2/sync/canvasToJjom.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/components/editor-v2/EditorV2.tsx`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/components/editor-v2/problems/conformanceToProblems.ts` (consumer check)
- `/Users/alfonso/jjodel-w-slot656/frontend/src/redux/reducer/reducer.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/redux/action/action.ts`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/codegen/textual/ui/PreviewBar.tsx`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/codegen/textual/textApply.ts`
- `/Users/alfonso/jjodel-w-slot656/docs/discovery/discovery_2026-11-07_textual_name_slot.md`
- `/Users/alfonso/jjodel-w-slot656/frontend/src/model/CLAUDE.md` (§3.12, §9), `/Users/alfonso/jjodel-w-slot656/CLAUDE.md`
  (§3.1, §3.2), `/Users/alfonso/jjodel-w-slot656/docs/decisions.md` (R-TXT-45, R-TXT-46, R-TXT-56, RC-15, RC-19)
- Caller search (explorer subagent, session 47b95570): every file in §5.4.

## 4. Measurements (all measured on `8df0859f2`)

Probe: `~/.jjodel-lanes/P-2026-11-07-0654/probe.mjs`, copied with a log summary added to
`~/.jjodel-lanes/P-2026-11-07-0720/probe.mjs`. Playwright, offline user, the portprobe metamodel (`Module.name [1..1]`,
`Port.name [0..1]`). HEAD served on :3656 from the lane tree, the prototype on :3657 from the temporary worktree
`~/jjodel-w-slot656-proto` (removed). Prototype flags on `window.__p656`: `exec` = `await` (poll the slot every 15 ms,
then write), `defer` (write from a `setTimeout`, not awaited), `settle` (`await settlePendingWrites()`, then write; poll
only as a fallback); `canvasSeed`; `readFallback`. Final prototype diff: `~/.jjodel-lanes/P-2026-11-07-0720/proto.diff`
(3 files, +46 −2; the `settle` branch is the 0720 addition).

Logs (under `~/jjodel-w-slot656/.agent-logs/`): HEAD `probe656-head2-20261107-070330.log`,
`probe656-head3-20261107-071026.log`; await + canvasSeed `probe656-protoA-20261107-070500.log`; defer + readFallback
`probe656-protoB-20261107-070744.log`, `probe656-protoB2-20261107-070907.log`, `probe656-protoB3-20261107-071132.log`;
settle `probe656-settle1-20261107-072024.log`. Every run ends `DONE`; page errors are monaco `Canceled` only, plus one
`identical assignment` console line in the settle run (S4 below).

**R. Readiness.** The `$name` slot of a fresh `DObject.new` resolves 106-297 ms later (174-279 in the settle run): the
300 ms batch of `U.UpdatingTimer`.

**S1. Console `create instance of Module "x1"`** (`JjScriptService.execute`, no undo group):

| | raw slot | CHECK 2 | XMI | undo entries | one Undo |
|---|---|---|---|---|---|
| HEAD | `[]` | `missing_required_attr` | `<Module/>`, no name | +1 | removes x1 |
| await | `["x1"]` (waited 307 ms) | clean | `name="x1"` | +1 | removes x1 |
| settle | `["x1"]` (waited 58 ms, 0 polls) | clean | `name="x1"` | +1 | removes x1 |

**S3. 50 creates**, wall time of the run:

| variant | applyTextEdit (one undo step) | console loop (no group) | slots written | undo | one Undo |
|---|---|---|---|---|---|
| HEAD | 6194 ms (7285 first run) | 71 ms (53, 171) | 0/50 | +1 | removes all 50 |
| await | 19078 ms | 15499 ms | 50/50 | +1 | removes all 50 |
| defer | 6083 / 4738 / 2651 ms | 100 / 61 / 73 ms | 50/50 | +1 | removes all 50 |
| settle | 16831 ms | 13640 ms | 50/50 | +1 | removes all 50 |

Settle detail: after `settlePendingWrites()` the slot was already there for 38/50 (applyTextEdit) and 43/50 (console)
creates, at most one 15 ms poll otherwise; the wait per create was 57-747 ms. The time is the commit, not the wait for
the slot: on HEAD the 50 creates of a console loop share one 300 ms batch, forcing a commit per create serializes 50
commits (≈270 ms each in the console loop). Settle saves ≈12 % against await and stays ≈190× the HEAD console loop.

**S4. Text tab apply with option A in** (the tab emits `set cpu.name = "cpu"`, `set Port_1.name = "instr"`,
`set Port_2.name = ""` …):

| variant | dispatches | `name` writes | `values` writes | undo | status | conformance | Port rows |
|---|---|---|---|---|---|---|---|
| HEAD | 10 | 6 | 9 | +1 | Applied | clean | instr, `[""]` |
| await | 13 | 12 | 9 | +1 | Applied | clean | instr, `[""]` |
| defer | 11 | 12 | 9 | +1 | Applied | clean | **`["Port_2"]`, `["Port_1"]`**: the deferred write overwrote the `set` |
| settle | 14 | 11 | 9 | +1 | Applied, then Up to date | clean | instr, `[""]` |

In the settle run the same-value `set cpu.name = "cpu"` hits a slot already committed, and `setValueAtPosition` answers
`identical assignment` (`LModelElement.tsx:7932`: `if (oldval === val) return { success: false, reason: "identical
assignment" };`), logged once to the console from `proxy.ts` `set`. Harmless (status Applied, no extra undo step), but a
new console error the lane must silence or accept.

**S6a. The race, 5×** (`create Module "r1kK"; set r1kK.name = "renamedK"; create Port "P9kK" in cpu.inputs;
set P9kK.name = ""` in one applyTextEdit): HEAD 10/10 keep the `set` value; defer 5/10 end with the handle; **settle
10/10**. The await variant was not run through S6a (its probe predates the step); its correctness there is inferred,
not measured. **S6b** console create then set back to back: correct in every variant (1 sample each).

**S5. Canvas** (`canvasToJjom.syncCreateObject` on the model's graph, direct call):

- HEAD: raw `[]`; label, tree and `$name.value` read `Module_0`; CHECK 2 flags it; XMI omits the name. **No undo entry is
  added** (§9).
- (a) seed (run from the probe in the same tick, because the hook refuses an edit to `canvasToJjom.ts`): raw
  `["Module_0"]` after 533 ms, CHECK 2 clean, XMI `name="Module_0"`, no extra undo entry (undo isolation confounded by
  §9).
- (b) readFallback: raw stays `[]`, CHECK 2 clean, XMI `name="Module_0"`.

**O. An old object** (`DObject.new(…, 'old1')`, no seed, as a model saved before any fix): HEAD and (a) flag it and omit
its name; (b) clears CHECK 2 and exports `name="old1"` (`data.name`), while `$name.value` and Properties read `Module_0`
(`initialName`, `LModelElement.tsx:7806-7808`). So (b) as prototyped is inconsistent with `get_values`: it must read
`initialName || name` as `get_values` does, not `data.name`.

## 5. Findings (read, `8df0859f2`)

### 5.1 The create and the set path

- `instance.ts:686-692`: `const dObject = (DObject as any).new(metaclass.id, container ? container.slot.id :
  targetModel.id, container ? DValue : DModel, instanceName, true);` with the comment at `:684` «do NOT wrap in outer
  TRANSACTION».
- `instance.ts:701-703`: `if (explicitInstanceName && dObject) { (dObject as any).initialName = explicitInstanceName; }`
- `instance.ts:715-716`: `registerHandle(instanceName, dObject.id); if (container) registerPendingChild(container.slot.id,
  dObject.id);`
- `instance.ts:410-414`: `async function settlePendingWrites(): Promise<void> { const { COMMIT } = await
  import('../../../redux/action/action'); COMMIT(undefined, false); await new Promise<void>((resolve) =>
  setTimeout(resolve, 0)); }`, documented at `:396-404` as «the interval's own call made now».
- `instance.ts:1088-1102`: `set` writes `featureProxy.value = primitive` inside `TRANSACTION('JjScript: Set instance
  attribute')`; `:169-177` `hasReadyInstance`; `elementWaiter.ts:18-19` poll 30 ms, max 500 ms.

### 5.2 The core

- `LModelElement.tsx:6104-6113` `DObject.new`: names `data.name`, `ret.initialName = computedDefaultName`. The slots are
  made by `set_instanceof` → `_forceConformity` (`:6717-6756`) in the persist callbacks (`joiner/classes.ts:643-651`,
  `:796`), so they exist only after the commit: this is why the write must wait (R).
- `LModelElement.tsx:6513-6538` `set_name` populates an empty slot via AFTER_UPDATE; `:7436-7471` `addObject` seeds on
  `setTimeout(UpdatingTimer*2)`; `:3246-3252` `identityAttribute`; `:6219` `get_name` falls back to `data.name`;
  `:7790-7808` `get_values` falls back to `writtenEmpty ? o.name : (o.initialName || o.name)`.

### 5.3 Raw readers and the canvas

- `ConformanceValidator.ts:180-188` CHECK 2 judges `__raw.values`; `XMIService.ts:309-310` `const rawValues: any[] =
  (feature.__raw?.values || []) as any[]; if (rawValues.length === 0) continue;`.
- `components/editor-v2/problems/conformanceToProblems.ts` consumes `validateConformance`: a change to CHECK 2 reaches
  the problems overlay (a §3.1 directory) through its output, without touching its files.
- `canvasToJjom.ts:1499-1538` `syncCreateObject`; callers `EditorV2.tsx:962, 2283, 2526, 2584, 3308`; a precedent of a
  deferred slot write after a canvas create at `EditorV2.tsx:2290-2326`.
- `PreviewBar.tsx:60-70` `applyAsOneStep` closes its group after flush + 300 ms + flush; `reducer.ts:1127-1158` the undo
  group; `reducer.ts:1344-1348` `const mergeTolerance = U.UpdatingTimer*1.5; … if (pastDelta && delta.timestamp -
  pastDelta.timestamp < mergeTolerance) return false;`.

### 5.4 Callers the executor change reaches

Through `executeCreateInstance`: the Jodie console (`jjscriptProvider.ts:38`, no undo group); Jodie chat
(`ChatMessages.tsx:541`, no group: ScriptBlock, ConsumerProposal); `applyAsOneStep` (`PreviewBar.tsx:89`): ScriptTab
`:305`, Refactoring `:117`, Text tab `textApply.ts:91`, New model from text `openTextualTab.tsx:191` (nested in
`:181/:212`); nested commands `let.ts:54`, `forall.ts:72`, `add.ts:34`. Not reached: effectsPlanner (plans only), the
codegen engine, jjform, RAG, JjTL (0 jjscript hits). Unmounted: `JjScriptConsole.tsx:51`, `ScriptExecutionWindow.tsx`.
Tests: only `m1Containment.test.ts:130` calls `executeCreateInstance`; 16 test files contain `create instance of`. These
absences come from the explorer's search in session 47b95570 (positive control: the hits above, same search), not
re-run in this session.

## 6. Classification against CLAUDE.md §3.1 and §3.2

| file | §3.1 table | §3.2 trigger | note |
|---|---|---|---|
| `frontend/src/jjscript/executor/commands/instance.ts` | no | **yes** as RC-15 reads it: a creator (`DObject.new`) in source, a new slot write and a forced COMMIT next to it | executor fix; LIR §7 |
| `frontend/src/jjscript/executor/__tests__/…` (new test) | no | no | test |
| `frontend/src/model/conformance/ConformanceValidator.ts` | no | no | canvas (b); its output feeds `editor-v2/problems/` (§3.1) via `conformanceToProblems.ts` |
| `frontend/src/services/export/XMIService.ts` | no | no | canvas (b) |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | **yes** | **yes** | canvas (a) only. The critical-zone hook refused an Edit to it even in the temporary worktree (RC-19), so (a) was prototyped from the probe |
| `frontend/src/codegen/textual/textDiff.ts`, `modelLines.ts` | no | no | option A, unchanged by this ticket |

## 7. Layer Impact Report — recommended executor fix (final, from the measurements)

```
LAYER IMPACT REPORT (executor: `create instance of C "h"` writes the identity slot)

Layers touched:
  [x] D-layer (Redux raw data)
  [x] L-layer (computed proxies) — read only
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges) — indirectly, the label
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

D-layer
  - What changes: for a create with an explicit handle, on a class with an identity attribute, the identity DValue
    gets [handle]; the executor awaits settlePendingWrites() after DObject.new, then writes $<ident>.value inside a
    TRANSACTION holding only that SetFieldAction-family write (rule 12: no creator inside it). Poll fallback ≤ 60×15 ms.
  - What does NOT change: DObject.new, initialName, data.name; auto-named creates (no handle); classes without an
    identity attribute; the set path.
  - Cross-layer interaction: slot→name propagation fires a direct SetFieldAction on 'name' with the same value
    (terminal, model/CLAUDE.md §3.12).
  - Side-effect safety: measured inside the run's undo step in all callers measured (console +1, applyTextEdit +1,
    one Undo removes objects and slots). The forced COMMIT flushes the app's pending block early: measured cost
    ≈270 ms per named create (§4 S3), and a later same-value `set` now logs `identical assignment`.
L-layer
  - What changes: nothing in code; get_name / get_values now read a written slot instead of the fallback.
  - What does NOT change: the fallbacks themselves.
Canvas v2-flow
  - What changes: nothing in code; the label reads the same name as before.

Smoke-test scenarios (localhost:3001):
  1. Jodie console: `create instance of Module "x"` → Properties name = x; Problems panel has no missing name for x;
     Export XMI contains name="x"; one Undo removes x.
  2. Jodie console, a 10-line script of named creates → completes (≈3 s expected), 10 objects named, one Undo per
     console line as today.
  3. Text tab: type `Module cpu { input instr : Word(32) input : Bool }` → status Applied, Problems clean, the
     nameless Port stays nameless, one Undo removes the whole edit.
  4. Text tab: create then rename in the same edit (`Module a {}` applied, then rename a → b) → b persists.
  5. New model from text with ~20 objects → model opens, all named, no console error other than the known ones.
  6. Canvas: drop a Module → unchanged behaviour (not touched by this lane).
  7. Save, reload, reopen the model → names and slots identical.

Uncertain about propagation: the ScriptTab and Refactoring paths (applyAsOneStep) were not probed directly; they share
the applyTextEdit path that was.
```

## 8. Canvas options (N5)

| option | user sees (tree / label / Properties / Problems / export) | old saved model | files |
|---|---|---|---|
| (a) seed the slot at the canvas create | Module_0 everywhere; Problems clean; export name | unhealed (O: still flagged) | `canvasToJjom.ts` (§3.1, §3.2) |
| (b) CHECK 2 and XMI read a never-written slot as `get_values` does | Module_0 everywhere; Problems clean; export name | healed with no migration | `ConformanceValidator.ts`, `XMIService.ts` + tests |
| (c) leave | Module_0 on screen; Problems flags `[1..1]` name; export omits it | unchanged | none |

(b) must read `writtenEmpty ? data.name : (initialName || data.name)`, the `get_values` fallback (`LModelElement.tsx:
7806-7808`), not `data.name` as prototyped (§4 O), and only for a slot never written (raw `[]`): a slot written `[""]`
stays nameless (R-TXT-45, R-TXT-46 D1).

## 9. Outside #656: a canvas create never gets its own undo step

Measured (§4 S5, HEAD): `syncCreateObject` leaves `statehistory` at the same length (`{"user":33,"all":33}` before and
after in the settle run; undoDelta 0 on HEAD), and one Undo reverted the previous entry while `Module_0` stayed. Read:
`reducer.ts:1280` `if (!shouldMerge && (delta.vertexs || delta.graphvertexs || delta.graphelements || delta.edgepoints
|| delta.edges || delta.graphs)) shouldMerge = true;` — every delta that touches a vertex is merged into the previous
entry, so the drop of a new object (which creates a vertex) folds into whatever the user did before. **Recommended: a
ticket of its own** (redux, not #656): a delta that creates a DObject should not be merged by the vertex rule.

## 10. Lane plan (≤ 5 files each)

1. **L1, executor write (this ticket, §3.2 trigger, LIR §7).** `instance.ts`, one new test under
   `frontend/src/jjscript/executor/__tests__/`, and `m1Containment.test.ts` if it pins the create's effects. Write
   awaited via `settlePendingWrites()` + poll fallback, only for an explicit handle on a class with an identity
   attribute. Gates: typecheck, build, the jjscript and codegen/textual suites; the probe rerun (S1, S3, S4, S6a).
2. **L2, canvas option (b).** `ConformanceValidator.ts`, `XMIService.ts`, their tests (≤ 4 files). No §3.1 file.
3. **Ticket** for §9 (reducer.ts undo merge).

## 11. Decisions, one recommendation each

- **D1. Where the executor's write goes.** In `executeCreateInstance`, after `registerHandle`, awaited.
  **Recommended: the awaited write via `settlePendingWrites()`** (correct on every measured check, 12 % cheaper than
  polling), not the deferred one (falsified, §4 S4/S6a). Cost ≈270 ms per named create; an alternative not measured:
  collect the handles and write every still-empty slot once at the end of the run (one commit per run), worth a probe
  in L1 before the code if 50-object scripts matter.
- **D2. Ship (1) and (2) together.** **Recommended: separately**, L1 then L2: different layers, different risk, and (b)
  alone already clears CHECK 2 and the export for objects created from script with no slot.
- **D3. Canvas option.** **Recommended: (b)**, with the `get_values` fallback: no critical-zone file, heals old models,
  consistent with R-TXT-45 D1.
- **D4. Old models.** **Recommended: leave them**, as R-TXT-46 D8; (b) covers them on read.
- **D5. Option A's textual `set h.name`.** **Recommended: keep it**: idempotent (+1 undo entry, Applied, §4 S4), and the
  only writer for nameless and renamed objects; its only new effect is the `identical assignment` console line.

## 12. Risks

- The forced COMMIT flushes the app's pending block in the middle of a run, which `applyAsOneStep` did not do before
  for creates (it already does for `set`): measured safe on undo grouping in S1/S3/S4, not measured on the ScriptTab and
  Refactoring paths.
- ≈270 ms per named create makes long scripts slow (50 creates: 13.6 s at the console, against 71 ms today).
- The await variant's race (S6a) was not measured; settle's was (10/10).
- (b) makes CHECK 2 and the export disagree with the raw D state on purpose: a reader of `__raw.values` elsewhere still
  sees `[]`.

## 13. Open questions for Alfonso

1. Is ≈270 ms per named create acceptable, or should L1 first probe the end-of-run batch write (D1)?
2. L1 and L2 separately, L1 first (D2)?
3. Canvas (b), with the `get_values` fallback (D3)?
4. Open the §9 undo ticket?
5. The `identical assignment` console line on a same-value `set`: accept, or silence it in L1?

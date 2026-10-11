# Discovery — #168 C1, JjScript reference writes and the chat prompt (Phase 1)

**Prompt-ID**: P-2026-10-02-1255
**Prompt file**: `docs/prompts/claude_2026-10-02_1255_prompt_168_c1_executor_prompt.md`
**Session**: 75f49196-eacb-4b79-a7b1-8e4e5f5a57e4 (from `~/.jjodel-lanes/P-2026-10-02-1255/session.txt`)
**Tree / HEAD**: `/Users/juridirocco/development/jjodel-168-exec`, branch `168-exec`, `a70f54af5` ("docs(#168): lane prompt C1, reference writes and the chat prompt")
**Executor**: Anthropic Claude Opus 5.5
**Stato**: Phase 1, read-only on the code. No tracked file under `frontend/` modified. Two probes, gitignored, not committed: `frontend/scripts/smoke/_tmp_168_c1_baseline.ts` and `_tmp_168_c1_window.ts`, both run with `node frontend/scripts/lane-run.mjs probe "$PWD" <probe> --port 3046 --id P-2026-10-02-1255`. Logs in `~/.jjodel-lanes/P-2026-10-02-1255/`.

This report is a set of hypotheses with evidence, not a definitive reference. A reader acting on it rereads the real files and, where a number matters, reruns the probes. MEAS = measured in this phase on `a70f54af5`; READ = code reading only; SIM = a write issued from the page in the form the fix would use, not the fix itself (Phase 2 re-measures through the real diff).

---

## 0. Answer in brief

- **G4 reproduced** (MEAS G4): `set sG.lead = p1`, then 400 ms later `set sG.lead = p2`, leaves `[p1, p2]` on a 0..1 reference.
- **The lost write is wider than M0 measured.** The app keeps a transaction open all the time (`transactionDepthLevel === 1`, MEAS T1-T3) and commits it every `U.UpdatingTimer` = 300 ms (`reducer.ts:1444`). It does not commit after one `setTimeout(0)`. A link reaches the store 170-300 ms after `execute()` returns, in one dispatch (MEAS T4: 272 ms). So the earlier of two `set`s on one multi-valued slot is lost:
  - in one script, in a `do … end` block (R1) and in a `forall` (R2: 3 iterations, 1 value left);
  - **through Jodie's own Run button**, whose 20 ms pacing (`ScriptBlock.tsx:139`, `:526`) is shorter than the window (R3, two runs, 1 value left).
- **`= null` does not clear today** (MEAS U1, U2, UL). It reports `"Cleared reference"`, yet `lead [p1]` stays `[p1]` in three runs out of three. `people [p1, p2]` becomes `[p1]` or `[]`, depending on what else lands in the same commit. The cause is in the write: `refProxy.values = []` (`instance.ts:759`) shrinks through `'-='` with `undefined` (`LModelElement.tsx:8020-8021`). The reducer drops that change because it never sets `gotChanged` (`reducer.ts:304`, `:331`, `:422`). This falsifies the premise «`= null` svuota lo slot come oggi».
- **Upper bound**: it is read as `refProxy.instanceof.upperBound`. That gives the same value as `metaclass.allReferences` (MEAS UB1). `addReference` defaults it to 1 (MEAS), and the chat context omits it when it is 1 (`JsonModelService.ts:530`).
- **Containment by create + set works** (MEAS K1, K2, including inside one `do … end` with no pause). The child moves into the slot and stays listed in `model.objects`, which is the canvas-gesture form under option (d).
- `add`/`remove` never touch an M1 slot: `remove p1 from sX.people` gives `ELEMENT_NOT_FOUND` (MEAS X). **`set x.ref -= y` APPENDS `y`**, because the operator is parsed (`parser.ts:570-584`) and ignored at M1 (MEAS X).
- **Recommended design** (§6). Before reading the slot, drain the open block with the codebase's own idiom: `COMMIT(undefined, false)` plus one macrotask (`reducer.ts:1591-1592`). Measured to keep both values (W1). A pure `referenceWrite.ts` then plans the write: single replaces, multi appends. For a slot that must shrink, it removes by value (`'-='` with the id, the R-DEL-4 form) and re-fathers a removed containment child to the model, as `_clearValueAtPosition` does. All five SIM arms pass (V1-V5).
- **The per-run cursor M0 recommended was measured wrong** in two cases the flush gets right. A→B→A on a single reference leaves `[p2]` instead of `[p1]` (W2), because the core skips an "identical assignment" against the stale store. Replacing a single containment twice leaves `kB` fathered to a slot that lists `kC` (W3).
- Rule 12 holds: no creator goes inside any `TRANSACTION`, and `COMMIT` is the interval's own call made earlier (§7). The undo history did not grow with the flush (MEAS W5: 1 entry in both arms).
- Prompt draft in §8. A consumer section is gated by text inside `{{#if projectContext}}`, because the template engine only receives `projectContext` (`AIProviderService.ts:81`).

Decisions awaiting Juri (RC-26): question 1 (it changes when queued writes reach the store) and question 2 (it changes the committed behaviour of a branch outside «solo il ramo di collegamento»).

1. Lost write: drain before reading (flush), or the per-run cursor?
   Recommended: flush: one `COMMIT(undefined, false)` plus a macrotask before the read in the link branch, measured W1/W2/W3; no module state.
2. `= null` does not clear: fix it here, in the unlink branch of `instance.ts`, with the same removal step?
   Recommended: yes, in C1: same file and pure module, measured SIM V1/V4; otherwise rule (d) promises what the runtime does not do.
3. A single slot already overfilled by G4: should a replace drop the extra values too?
   Recommended: yes, the same removal step inside the link branch (SIM V2/V3), so that "replaces" holds on projects G4 already wrote.
4. `+=`, `-=`, `add`, `remove` at M1: forbid them in the prompt now, and make the executor refuse them in a later lane?
   Recommended: yes, prompt rule now (§8); file a ticket for an executor refusal (`-=` silently appends).
5. Consumer section: gate it in the text, inside `{{#if projectContext}}`, rather than with a template variable outside the DOVE?
   Recommended: yes, a textual gate on a top-level `environment` object; a `{{#if environment}}` variable can follow with lane A/D.
6. Apply the §8 draft as the text of the `feat` commit?
   Recommended: yes, as written, with the (d) line kept only if question 2 is yes.

---

## 1. Hypotheses under test

1. **H1** (M0 Q3, G4): «`set` on a single-valued reference appends». **HOLDS** (MEAS G4).
2. **H2** (M0 Q3, prompt §Contesto): «two `set`s on one slot in one script, with no pause, can lose the first; the cause is `setTimeout(0)` at `action.ts:349`». **HOLDS for the loss, FALSIFIED for the cause and the extent.** The dispatch is `setTimeout(0)`, but the actions are queued in a block that stays open and is committed every 300 ms (§3.2). The loss therefore also happens through the Run button's 20 ms pacing (R3), which M0's contrast of 400 ms could not see.
3. **H3** (prompt §COSA, M0 recommendation): «an accumulating cursor over the script's pending writes fixes the loss». **PARTLY FALSIFIED.** It fixes the plain append (SIM, same form as W1's second half), but it is measured wrong on A→B→A (W2) and on a single containment replaced twice (W3). The core's own reads of `c.data` stay stale inside the window, and no cursor reaches them.
4. **H4** (Juri, 2026-10-02): «`= null` empties the slot, as today». **FALSIFIED** (MEAS U1/U2/UL, §3.4).
5. **H5** (prompt §Contesto, option d): «`create instance of Figlio "f"` at the root, then `set padre.rif = f`, produces the canvas-gesture state». **HOLDS** (MEAS K1, K2; the state equals CL1/CL2 of the R report: father = slot, still in `model.objects`).
6. **H6** (Phase 1 step 3): «`remove`/`add` have the same problem at M1». **FALSIFIED as stated**: they never reach an M1 slot (MEAS X). A worse sibling was found: `-=` is parsed and ignored, so it appends.
7. **H7** (own, written into the baseline probe): «one macrotask after `execute()` returns is enough to see the write». **FALSIFIED** (MEAS WIN1, WIN2, R4); the four FAILs of the baseline probe are this hypothesis and its corollary R3.

## 2. Files read

- In full: `CLAUDE.md`, `docs/PROTOCOL.md` (P1-P16), `frontend/src/jjscript/CLAUDE.md`, `frontend/src/model/CLAUDE.md`, `docs/discovery/discovery_2026-10-01_168_m0_measures.md`, `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`, `docs/discovery/2026-06-12_jjscript_m1_coverage.md`, `docs/log-inbox/jodie-consumer.md`, `frontend/src/jjscript/executor/commands/instance.ts`, `frontend/src/jjscript/executor/handleRegistry.ts`, `frontend/src/jjscript/services/JjScriptService.ts`, `frontend/src/jjscript/executor/commands/add.ts`, `frontend/src/constants/defaultPrompts.ts` (lines 1-290, 660-702: the chat prompt and the versions), the M0 probe `/Users/juridirocco/development/jjodel-168-measures/frontend/scripts/smoke/_tmp_168_m0_measures.ts` (read-only).
- By window: `docs/decisions.md` 1-60 and 3540-3830 (RC-*, R-S1-5, R-DEL-4) plus a grep for `168|jjscript`; `docs/discovery/discovery_2026-10-01_168_b_guard.md` 1-80; `docs/claude-code-log.md` 1-60; `frontend/scripts/smoke/README-probes.md` 1-45 and 125-320; `frontend/src/redux/action/action.ts` 80-260 and 290-380; `frontend/src/redux/reducer/reducer.ts` 100-125, 195-345, 1425-1445, 1584-1596; `frontend/src/model/logicWrapper/LModelElement.tsx` 1590-1620, 4200-4203, 7830-8080 (read-only); `frontend/src/jjscript/executor/executor.ts` 60-160, 260-285, 380-573; `frontend/src/jjscript/executor/commands/forall.ts` 1-140; `frontend/src/jjscript/executor/commands/remove.ts` 1-60; `frontend/src/jjscript/executor/commands/set.ts` 30-60; `frontend/src/jjscript/executor/commands/eval.ts` 600-680; `frontend/src/jjscript/parser/parser.ts` 999-1030 (and grep `operator`); `frontend/src/jjscript/components/ScriptBlock.tsx` 120-140, 355-540, 680-700, 1030-1060; `frontend/src/jjscript/components/ScriptExecutionWindow.tsx` 252-360; `frontend/src/components/Jodie/ChatMessages.tsx` 397-462; `frontend/src/services/PromptService.ts` 315-380; `frontend/src/services/export/JsonModelService.ts` 255-285, 425-450, 528-531; `frontend/src/api/persistance/projects.ts` 195-275; `docs/prompts/claude_2026-10-01_2301_prompt_168_a_context.md` 55-100.
- Lane A's branch, read with `git show 168-context:frontend/src/components/environment/consumerJodieContext.ts` (grep only, nothing written in its tree): the `environment` block shape at `:354-369` and `:408`.

## 3. Findings

### 3.1 G4 and where the upper bound lives

- MEAS G4: `["p1","p2"]` on `lead` (`upperBound = 1`) after two `set`s 400 ms apart.
- READ `instance.ts:839-841`, the link branch, unconditional on cardinality:
  ```
  const rawVals: any[] = refProxy.__raw?.values ?? [];
  const meaningful = rawVals.filter((v: any) => v != null && v !== '');
  refProxy.values = [...meaningful, targetInstance.id];
  ```
- MEAS UB1: for `lead`, `people`, `competencies` and `primary`, `refProxy.instanceof.upperBound` equals the value found by name in `metaclass.allReferences`, the walk `classifyMetaclassProperty` already does (`instance.ts:232-240`). `LReference.get_upperBound` is `return context.data.upperBound;` (`LModelElement.tsx:1594-1595`).
- MEAS FIX1_plain_default_upper: a reference made by `addReference` with no bound set reads `upper: 1`.
- READ `JsonModelService.ts:530`: `if (upperBound !== undefined && upperBound !== 1) out.upperBound = upperBound;`. The chat context therefore shows a single-valued reference by the **absence** of `upperBound`, which the prompt must say.
- READ `eval.ts:661`, the reading side's cardinality: `const isMany = ub === -1 || ub === '*' || (typeof ub === 'number' && ub > 1);`. Proposed: the write uses the same predicate (single = not many), so that JjEL's single value and the write agree. It differs from «exactly 1» only for `0` or `undefined`, which the default never produces.

### 3.2 The window: a block that stays open, committed every 300 ms

- READ `action.ts:329-330`: `if (t.hasBegun) { t.pendingActions.push(this); }`. Only otherwise `:349`: `setTimeout(()=>storee.dispatch({...this}), 0);`.
- READ `reducer.ts:1444`: `documentEventsIntervalId = setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`, with `U.tsx:177` `public static UpdatingTimer: number = 300;`. Already documented at `projects.ts:202`: «the app sits permanently at `transactionStatus.transactionDepthLevel === 1`».
- MEAS T1 (through `JjScriptService.execute`): at `start`, `{"depth":1,"begun":true,"pending":0}`. After `execute()` returns, `pending: 2` and `n: 0` until 157 ms. At 174 ms `n: 1, pending: 0`.
- MEAS T2 (`await TRANSACTION(...)` from the page): `n: 0` after the await and after one macrotask, then `n: 1` at 295 ms. T3 (bare proxy write): `n: 1` at 302 ms.
- MEAS T4 (store subscription): one dispatch in 800 ms, at 272 ms, and it carries the value.
- MEAS WIN (baseline): `{"afterAwait":0,"afterMicrotask":0,"afterOneMacrotask":0,"after50ms":0}`.
- README-probes' "values.length reads 1 at 50ms" (ENG1) was measured on `setValueAtPosition`, with a read timer scheduled before the commit. It does not describe this path, and should not be inherited.

### 3.3 The lost write, by the ways a run issues two `set`s (baseline, runs 3 and 4 identical)

| arm | how | `people` after 500 ms | evidence |
|---|---|---|---|
| R0 | two `execute()` back to back (M0's shape) | `[p2]` | MEAS |
| R1 | one script: `do set sR1.people = p1; set sR1.people = p2 end` (`executor.ts:273`, no pause) | `[p2]`, block reports `2/2` | MEAS |
| R2 | one script: `forall p in Person.allInstances do set sF.people = p` (`forall.ts:91`) | `[p3]`, forall reports `3/3` | MEAS |
| R3 | ScriptBlock's pacing replica, 20 ms between lines (`ScriptBlock.tsx:526`) | `[p2]` | MEAS |
| R4 | one macrotask between | `[p2]` | MEAS |
| R5 | one microtask between | `[p2]` | MEAS |
| W1 | `COMMIT(undefined, false)` plus one macrotask between | `[p1, p2]` | MEAS (window probe) |
| M0 | 400 ms between | `[p1, p2]` | M0 Q3-multi-ref-contrast |

- R3 replicates the loop rather than clicking a rendered `ScriptBlock`: rendering one needs a Jodie reply, which needs a provider. `handleJjScriptExecute` calls exactly `JjScriptService.execute(command, scope)` per line (`ChatMessages.tsx:437`), and the loop sleeps `BATCH_DELAY_MS = 20` between lines (`ScriptBlock.tsx:139`, `:526`). That is the replica. Whether two lines fall in one commit depends on timing: with a 300 ms period and a 20 ms step, most pairs do.
- `ScriptExecutionWindow.tsx:342` runs lines with no pause, but nothing mounts it. `command grep -rn '<ScriptExecutionWindow\|onOpenExecutionWindow=' frontend/src` matched only its own declaration (`:74`); the positive control is the same command matching `ScriptBlock` in `MarkdownRenderer.tsx:11` and `:103`.
- MEAS DUP: the same target twice, 400 ms apart, gives `["p1","p1"]`. There is no deduplication today.

### 3.4 The unlink branch (`= null`)

- READ `instance.ts:756-760`: `TRANSACTION('JjScript: Unlink reference', () => { const refProxy = ...; if (refProxy) { refProxy.values = []; } ...`.
- READ `LModelElement.tsx:8019-8022`, inside `set_values`: `let excess = c.data.values.length - val.length;` … `while (excess-- > 0) { SetFieldAction.new(c.data.id, 'values', undefined as any, '-=', true); }`.
- READ `reducer.ts:304-307`: with `newVal === undefined` the reducer splices a copy, but its local `indexes` stays empty. Then `:331`: `gotChanged = !!indexes.length;` and `:422`: `return gotChanged ? newRoot : oldStateDoNotModify;`. The removal survives only when another action in the same pass already changed the state.
- MEAS U1 (baseline runs 3 and 4) and UL (window probe): `lead [p1]` → `set sU1.lead = null` → `{"success":true,"message":"Cleared reference sU1.lead"}`, and the slot is still `[p1]` at 400 ms and at 2 s.
- MEAS U2: `people [p1, p2]` → `[p1]` (baseline, unlink alone in its commit) or `[]` (window probe, two unlinks in one commit). The result depends on what shares the commit.
- This is the trap `frontend/src/model/CLAUDE.md` §9.3 already measured for `slot.values = []` («does **not** empty a reference slot that already holds a value»). JjScript's unlink is that same write.

### 3.5 A shrink that works (SIM, window probe 13/13)

Removal by value: `SetFieldAction.new(slotId, 'values', id, '-=', true)` takes the reducer's by-value path (`reducer.ts:316-331`, `Uarr.findAllIndexes`). That path sets `gotChanged` and updates `pointedBy` (`:336`). It is the form R-DEL-4 already uses in `Dummy.get_delete`.

| arm | before | write (one `TRANSACTION`) | after |
|---|---|---|---|
| V1 | `people [p1, p2]` | `-=` p1, `-=` p2 | `[]` |
| V2 | `lead [p1, p2]` (overfilled 0..1) | `-=` p1, `-=` p2, then `values = [p3]` | `[p3]` |
| V3 | `lead [p1, p3]`, target p3 | `-=` p1 | `[p3]` |
| V4 | `competencies [kG]` | `-=` kG, `kG.father = model` | `[]`, kG father `DModel`, in `objects` |
| V5 | `primary [kH]` (comp, 0..1) | `-=` kH, `kH.father = model`, then `values = [kI]` | `[kI]`, kH `DModel`, kI in the slot |

- The re-father mirrors `_clearValueAtPosition`, `LModelElement.tsx:7855-7856`: `if (info.isContainment && oldTarget?.className === "DObject") { SetFieldAction.new(oldVal as Pointer<DObject>, "father", context.proxyObject.model.id, undefined, true); }`. The containment test is the core's: `get_containment(context) { return context.data.composition || context.data.aggregation; }` (`LModelElement.tsx:4202`).
- A root-born child (every JjScript child, R option d) never left `model.objects`, so after V4 or V5 it is a coherent root again. An `addObject` child would become an orphan. That is the same as `_clearValueAtPosition` today, and it is already ticketed by R.
- MEAS S2 (baseline): the form the current link would use for a replace, `values = [p3]` alone on `[p1, p2]`, gives `[p3, p2]`. Index 0 is overwritten and the tail stays (§3.4).

### 3.6 Cursor vs flush, emulated (window probe)

- W2, A→B→A on `lead`, committed `[p1]` first: cursor form (`values=[p2]`, then `values=[p1]` inside the window) → `["p2"]`; flush form → `["p1"]`. In the cursor form `get_setValueAtPosition` returns `"identical assignment"`, because `c.data.values[0]` is still `p1` (`LModelElement.tsx:7875`: `if (oldval === val) return { success: false, reason: "identical assignment" };`).
- W3, single containment replaced twice, committed `[kA]` / `[kD]` first: cursor form → slot `[kC]`, with `kB` fathered to `slot:primary@sP1` while the slot does not list it; flush form → slot `[kF]`, `kE` `DModel`.
- W5, with `U.userHasInteracted = true`: two links without a flush add 1 history entry and lose a value. Two links with a flush between them add 1 entry and keep both.

### 3.7 Containment by create + set

- MEAS K1 (Run pacing): `create instance of Competency "k1"`, then `set sK.competencies = k1` → k1 father `slot:competencies@sK`, the slot lists k1, and k1 is still in `model.objects`. That is the CL1/CL2 state of the R report.
- MEAS K2: `do create instance of Competency "k2"; set sK2.competencies = k2 end` (no pause, k2 not yet committed) → same state. The handle registry resolves k2 by id (`instance.ts:190-193`).
- MEAS S3: a single containment replaced through today's index-0 write. The evicted kA goes back to `DModel` and stays in `objects`, a coherent root.

### 3.8 `add`, `remove`, `+=`, `-=` at M1

- MEAS X: `set sX.people += p1` gives `"Linked sX.people → p1"`, `[p1]`. `set sX.people -= p1` gives `"Linked sX.people → p1"`, **`[p1, p1]`**. `remove p1 from sX.people` and `remove p1 from sX` both give `ELEMENT_NOT_FOUND`, `"Target element not found: p1"`.
- READ `parser.ts:570-584` parses `operator`; `instance.ts` never reads it: `command grep -n -E "operator" frontend/src/jjscript/executor/commands/set.ts frontend/src/jjscript/executor/commands/instance.ts` matched only `set.ts` (`:34`, `:101-105`, `:126`, the M2 branch), which is the positive control in the same run. `remove.ts` resolves with `resolveElement` (M2), and `add.ts:26-33` turns into `executeCreate`.

## 4. The consumer gate and the context shape

- READ `PromptService.ts:334-347`: variables are substituted first, then `/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g`, which is non-greedy, so an `{{#if}}` cannot be nested inside the existing `{{#if projectContext}}` (`defaultPrompts.ts:257-272`).
- READ `AIProviderService.ts:81`: `? { customVariables: { projectContext } }`. That is the only variable, so `{{#if environment}}` would need `AIProviderService.ts` or `Jodie.tsx` (outside the DOVE; `Jodie/**` is lane A's).
- READ (lane A, `git show 168-context:…/consumerJodieContext.ts:354-369`, `:408`): `out.environment = environmentOf(profile, documents, rules)`, with `{ profile: <name>, editableTypes: string[], readOnlyTypes: string[] }`, class names. It exists only with a resolved profile (`:384`: `if (!profile || !envelope …) return envelope;`). A developer context never carries it, so a textual gate on «a top-level `environment` object» separates the two audiences.
- READ `JsonModelService.ts:276`: `if (ref.composition || (ref as any).containment) out.containment = true;`. That is how the prompt can name «a class that is the type of a reference marked `containment: true`».

## 5. Where the lost write is reachable, by caller

Live callers of the executor, from `command grep -rn -E 'executeScript\(|executeBatch\(|JjScriptService\.execute\(' frontend/src` and `… '\bexecuteCommand\('`:

- `ChatMessages.tsx:437`, under ScriptBlock's run-all, step and recovery loops: reachable (R3; the step mode's gaps are a human's).
- `console/providers/jjscriptProvider.ts:21`, one typed command at a time: two commands typed within 300 ms only.
- `JjScriptConsole.tsx:51`, likewise.
- `forall` and `do … end` bodies, from any caller: reachable (R1, R2).
- `useMetamodelGeneration.ts:313` → `JjodieAPIImpl.ts:163`: not read beyond the call site, not measured.

## 6. Proposed design (text, NOT applied)

`frontend/src/jjscript/executor/referenceWrite.ts`, pure, no imports (node bench):

```ts
export function isManyValued(upperBound: unknown): boolean;      // eval.ts:661's predicate
export function meaningfulValues(raw: unknown): string[];         // instance.ts:840's filter
export interface ReferenceWritePlan { remove: string[]; write?: string[] }
export function planLink(current: readonly string[], targetId: string, many: boolean): ReferenceWritePlan;
//   many:   { remove: [], write: [...current, targetId] }                       (append; duplicates as today)
//   single: target in current -> { remove: distinct(current) minus target }     (no write: target stays)
//           otherwise         -> { remove: distinct(current), write: [targetId] }
export function planUnlink(current: readonly string[]): ReferenceWritePlan;   // { remove: distinct(current) }
```

`instance.ts`, link branch (and, if question 2 is yes, the unlink branch), in this order:

1. `COMMIT(undefined, false); await new Promise(r => setTimeout(r, 0));`, imported from `../../../redux/action/action` as `projects.ts:26` and `Navbar.tsx:49` do; the joiner barrel does not export it (`joiner/index.ts:210`). This is the interval's own call made now, and the drain idiom of `reducer.ts:1591-1592`.
2. Re-wrap the subject after the drain (`LPointerTargetable.fromPointer(lObject.id)`), so that `refProxy` reads the committed slot.
3. In one `TRANSACTION('JjScript: Link reference')`, for each id in `plan.remove`: `SetFieldAction.new(refProxy.id, 'values', id, '-=', true)`, plus `SetFieldAction.new(id, 'father', targetModel.id, undefined, true)` when `refProxy.instanceof.containment`. Then `if (plan.write) refProxy.values = plan.write;`, so a containment append still goes through `get_setValueAtPosition`'s re-father (K1).

Cost: one dispatch, so one reducer pass and one render, per reference `set`, instead of one every 300 ms. A 20-iteration `forall` timing goes in the Phase 2 probe. Other branches (attribute, create, delete) keep the open block. A `delete instance x` issued within 300 ms of a link to `x` may still leave a dangling id. That is READ only, general to every write, and is a ticket rather than part of C1.

Phase 2 tests, as the prompt lists them, with one change. «Two pending writes on one slot both stay» is not a property of the pure module under this design: the drain carries it. The probe kills it (R0-R3 back to one value), not vitest. The pure test chains `planLink` on its own output, and the mutation bench declares that limit.

## 7. Rule 12, sync layer, Layer Impact Report

- No creator (`DObject.new`, `DVertex.new`, `DVoidEdge.new2/3`) goes inside any `TRANSACTION` of the link or unlink branch: only `SetFieldAction` and `set_values`, whose nested actions are `SetFieldAction` (`LModelElement.tsx:7948-7962`, `:8012-8027`). That is the safe case Rule 12 names.
- `COMMIT(undefined, false)` wraps nothing. It closes and reopens the resting block (`action.ts:120-140`, `COMMIT`) exactly as the 300 ms interval does (`reducer.ts:1444`), only earlier. A creation queued by a preceding `create instance` lands at that moment instead of at the next tick. K2 shows today's create + set inside one block, and Phase 2 re-measures it through the diff.

```
LAYER IMPACT REPORT (proposed diff, §6)
Layers touched:
  [x] D-layer       queued writes reach the store at each reference set; '-=' by value on DValue.values
  [ ] L-layer       no proxy code changed
  [ ] JjOM          no
  [x] Canvas v2-flow indirect: useM1ReferenceEdges reconciles on slot values, so a removed or replaced target
                    now removes or moves its edge (not measured; no canvas opened in this phase)
  [ ] Canvas classic
  [ ] Sync layer    no code; Rule 12 safe (above)
  [ ] Persistence   no migration; slots overfilled by G4 are repaired only when a script writes them again
Smoke-test scenarios potentially affected: JjScript replace on an open M1 canvas (one edge, not two);
  Run of a multi-target script (all edges); `= null` (edges removed). Phase 2 probe covers the D-layer half.
```

## 8. Prompt draft (text, NOT applied; `defaultPrompts.ts`, backticks escaped in the source as today)

**a.** In `**Create an instance**`, replace «(root-level only — you cannot nest an instance inside another)» with:
«(it is created at the model root; to place it inside another instance, link it through a containment reference — see **Put an instance inside another** below)».

**b.** Rules (b)-(d) under «CRITICAL rules for references» become:

```
- (b) A **single-valued** reference holds one target: a new `set` on it REPLACES the previous target. In the context a reference is single-valued when it has no `upperBound` field (its upper bound is 1).
- (c) A **multi-valued** reference (`"upperBound": -1`, or a number greater than 1) collects targets: emit one `set` line per target; each one ADDS its target.
- (d) `set instanceName.referenceName = null` clears the whole reference slot.
```

**c.** New subsection after «Link a reference»:

```
**Put an instance inside another (containment):**
A reference marked `"containment": true` in the context OWNS its targets: setting it moves the target inside the parent. Create the child, then set the parent's containment reference, in the same script:
    create instance of Room "kitchen"
    set house1.rooms = kitchen
- If a class is the `type` of a reference marked `"containment": true`, its instances belong inside a parent: every `create instance` of that class MUST be followed, in the same script, by the `set` of the parent's containment reference. Never leave such an instance alone at the root.
- Rules (b) and (c) apply here too: a single-valued containment holds one child, and a new `set` replaces it (the previous child returns to the model root).
```

**d.** In «Forbidden in M1», the line «Creating an instance inside another instance (no containment/nesting at creation time).» becomes, together with one new line:

```
- Nesting at creation time (`create instance of X in Y`) is not supported: create the instance, then `set` the parent's containment reference.
- `+=` and `-=` on a reference, and the `add` / `remove` commands on instances: at this level they do not do what they say (`set x.ref -= y` ADDS `y`). To change a single-valued target, `set` it again; to empty a reference, set it to `null`.
```

**e.** New section inside `{{#if projectContext}}`, after «MODEL RECOMMENDATIONS (M1)»:

```
## END-USER MODE (only when the context has an `environment` block)

Apply this section ONLY when the context above contains a top-level `"environment"` object (`{ "profile", "editableTypes", "readOnlyTypes" }`). If it does not, ignore this section completely. If it does, this section takes precedence over YOUR ROLE, RESPONSE STYLE and every instruction about teaching metamodeling.

You are talking to the end user of an application built with Jjodel, not to a modeler or a developer.
- Use plain, everyday language, in the user's own language. Never say "M1", "M2", "metamodel", "metaclass", "instance" or "JjScript": call things by the type and field names the context shows ("a new Scenario", "its lead").
- A question (what, which, how many, why) gets an answer in prose, with no code block.
- A request to change something gets EXACTLY ONE ```jjscript block, introduced by one or two plain sentences saying what will change. The user decides whether to apply it.
- That block contains only `create instance of`, `set`, `delete instance` and `rename instance`, and follows every rule of M1 INSTANCE COMMANDS above.
- Every command acts on a type listed in `environment.editableTypes`: the class you create, rename or delete, and the instance before the dot in `set`. An instance of a type in `environment.readOnlyTypes` may appear only as the target of a reference that is NOT a containment. Never touch a type that does not appear in the context. If the request needs any of this, say plainly that it cannot be changed here, and give no block.
- Never emit metamodel commands (`create class`, `create attribute`, `create reference`, `create containment`, `create enum`, `create literal`, `extends`, `delete class`, `rename class`).
```

**f.** `DEFAULT_PROMPT_VERSIONS.chat`: `version: 5`, and append `{ version: 5, note: 'Single-valued reference set replaces; teach containment as create then set; add an end-user section gated on the environment block' }`.

## 9. Dependencies and risks

- The read-only reference to read-only targets in (e) follows lane B's guard: only `hidden` link targets are refused, and B's ticket on containment moving a `read` instance is the reason for «NOT a containment».
- The flush ties JjScript to the open-block model of `action.ts`/`reducer.ts:1444`. If that model changes (for example the interval is removed), the drain becomes a no-op plus one macrotask, and the loss returns. The Phase 2 probe is the guard; a vitest cannot see it (no store in the bench).
- Lane A's `environment` block is not on the trunk yet. The consumer section is inert until lane A merges, and correct on its own text after.
- Projects already saved with G4 overfilled slots or failed unlinks stay as they are until a script writes that slot again. Conformance keeps flagging them (`multiplicity_upper_exceeded`, M0).
- Not measured: an open M1 canvas during a replace or unlink (edges), and a 20-iteration `forall` duration with the drain. Both go in the Phase 2 probe.
- The baseline probe's 14/18 is quoted as is. Its four FAILs (WIN1, WIN2, R3, R4) are H7, falsified, and were left as written rather than turned green.
- Probe faults found and fixed during the phase: run 1 started the creates before `project.models` listed the model (7 creates refused «No active M1 model»). Fixed by asserting the setup (README-probes «Assert the setup»), and not used as evidence.

## 10. Decisions taken inside the lane

- Module name `frontend/src/jjscript/executor/referenceWrite.ts`, as the prompt proposed.
- Cardinality: the same predicate as `eval.ts:661`, so `upperBound` 1 (and the degenerate 0/`undefined`) replaces, while `-1`, `'*'` and `> 1` append.
- `set` keeps its messages and result shape; nothing exported from `instance.ts` changes.

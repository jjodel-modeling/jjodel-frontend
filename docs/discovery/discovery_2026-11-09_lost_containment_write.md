# Discovery: a containment write from syncCreateCompositionLink is sometimes lost

Prompt-ID: P-2026-11-09-1020. Chat: C-2026-11-06-2159. Front: dcn. Lane: discovery, read-only on `frontend/src`.
Prompt file: `docs/prompts/claude_2026-11-09_1020_prompt_lost_containment_discovery.md`. Session: `b1cd92b4-5257-4a44-ae99-0821cb908c8e`.
Tree: `~/jjodel-w-lostlink`, branch `lost-link-discovery`, HEAD `285600ecb`. Model: Anthropic Claude Opus 5.5.

This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it re-reads the real files. Claims are tagged MEAS (a run of this phase, on HEAD `285600ecb`) or READ (a file).

## 1. Objective and hypotheses under test

The DCN drone fixture lost about one containment link per build (5 of 5 runs on 2026-11-08, a different link each time, also on unmodified HEAD; log entry of P-2026-11-08-1939). This report says which write is lost, in which layer, under which condition, and who can hit it.

Hypotheses this discovery tries to falsify:

- **H1, read-modify-write over the open block.** `syncCreateCompositionLink` computes the next `values` from the store, while the previous write still sits in the app's permanently open transaction, so two appends in one commit window plan the same index and the second overwrites the first.
- **H2, the read only.** The link is not lost: the reader looks before the store has it.
- **H3, a later writer removes it.** The value lands, and something after it (the sync layer, the D-L proxy, a re-write) takes it out.
- **H4, the uniqueness gate of `addObject`.** The handoff of P-2026-11-08-2157 names it.

## 2. Files read

| File | Lines |
|---|---|
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | 1695-1804, plus grep of `:1682-1687` |
| `frontend/src/components/editor-v2/EditorV2.tsx` | 2250-2269, 2350-2362, 3405-3439 |
| `frontend/src/components/contextMenu/ContextMenu.tsx` | 388-398 |
| `frontend/src/model/logicWrapper/LModelElement.tsx` | 7400-7439, 7925-8120 |
| `frontend/src/redux/action/action.ts` | 88-247, 300-366 |
| `frontend/src/redux/reducer/reducer.ts` | 1120-1199, 1540-1564 |
| `frontend/src/joiner/proxy.ts`, `frontend/src/redux/store.tsx`, `frontend/src/common/U.tsx` | grep of `livePatches`, `liveStateChanges`, `UpdatingTimer` |
| `frontend/src/jjscript/executor/commands/instance.ts` | 398-427 |
| `frontend/src/components/project/nestedMaterialization.ts` | 365-394 |
| `frontend/scripts/probe/dcn-drone-fixture.ts` | 1-90, 300-385, 550-591, 716-745 |
| `frontend/scripts/probe/bpmn-lanes-fixture.ts` | 30-46, 196-308 |
| `frontend/scripts/lane-run.mjs` | 1753-1839 |
| `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md` | 78-104, 154-163 |
| `frontend/src/model/CLAUDE.md` | §9.3 |
| `docs/log-inbox/dcn.md` | 458-470, 516-529 |

## 3. The write path, traced

Every step read in the source; measures are in §4.

1. **The read.** `canvasToJjom.ts:1742-1744`, inside `TRANSACTION('EditorV2 create composition link', ...)`:
   `const rawVals: any[] = refProxy.__raw?.values ?? [];` then `const meaningful = rawVals.filter(...)` then `refProxy.values = [...meaningful, childObject.id];`. `__raw` is the D object the proxy wraps (`joiner/proxy.ts:323`), read from the store: `U.liveStateChanges` is `false` (`U.tsx:179`), so `livePatches` does not feed it.
2. **The write becomes per-index actions.** `LModelElement.tsx:8071-8072`: `set_values` calls `get_setValueAtPosition(c)(i, val[i], ...)` for each index. `:7931-7932`: `let oldval = c.data.values[index]; if (oldval === val) return { success: false, reason: "identical assignment" };`. So every index already equal is skipped and the only action left for an append is `:8011`: `SetFieldAction.new(c.data, 'values.' + index as any, val, '', isPtr)`, plus `father` on the child (`:7985`). The index is computed from the value array the caller read.
3. **The action does not reach the store.** `action.ts:336-337`: `if (t.hasBegun) { t.pendingActions.push(this); }`. The app sits permanently inside a block: `reducer.ts:1555`, `setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`, `U.tsx:178` `UpdatingTimer: number = 300`. `COMMIT` re-opens with `BEGIN()` (`action.ts:141`). The `TRANSACTION` of step 1 only moves the depth from 1 to 2 and back; it does not commit.
4. **The commit is itself deferred.** `FINAL_END` builds a `CompositeAction` and fires it (`action.ts:168-178`); with no block open, `fire` runs `setTimeout(()=>{ t.dispatchesInFlight--; storee.dispatch({...this}); }, 0);` (`action.ts:357`). So a write is in the store only after the next interval tick and one more macrotask, both of them delayed by any long task on the main thread.
5. **The edge is a separate write in the same block.** `DVoidEdge.new2` at `canvasToJjom.ts:1750`. It carries no index, so it cannot collide.

The prompt cites `reducer.ts` about 1148-1169 for the timer: those lines are now the undo group; the timer is at `reducer.ts:1555`, and `reducer.ts:1132` names it in a comment.

Consequence if H1 holds: two appends to one slot between two store updates both read length N, both plan `values.N`, and the reducer applies them in order: the earlier child is overwritten. The earlier child keeps its `father` and its edge, the slot does not hold it. The write lost is the **first** of a pair, never the last one of a slot.

**The same family, already measured elsewhere.** `instance.ts:405-408`: «A second `set` on the same slot inside that window read the old values and overwrote the first», fixed there for JjScript by `settlePendingWrites` (`COMMIT(undefined, false)`, one macrotask, then wait for `dispatchesInFlight`). `discovery_2026-10-02_168_c1_executor_prompt.md` §3.3 has the table: a macrotask or a microtask between two writes still loses, a `COMMIT` plus a macrotask does not, 400 ms does not.

**`addObject` (H4).** `LModelElement.tsx:7406-7416`: `checkNameUniqueness` refuses a duplicate name **before** creating, in `addObject` only. `syncCreateCompositionLink` does not go through `addObject`, and objects of this path come from `syncCreateObject`. A refusal would also leave no child object, while the lost link's child exists. H4 is out on reading; the probe writes through the same function and uses unique names.

**Why the fixture is on the edge.** `buildLinks` writes one link per `page.evaluate`, then pauses 300 ms (`bpmn-lanes-fixture.ts:301-302`, `ev` at `:201-207`). 300 ms is exactly the interval's period, so a write normally finds the previous one landed, and it fails to whenever the tick or its `setTimeout(0)` is late. `pkg.packagedElements` is written with one block of consecutive appends (`dcn-drone-fixture.ts:381`), `ownedAttributes` likewise (`:340`): the four slots of the ticket's losses all have consecutive appends in the plan.

READ, checked against H1's prediction that a lost write has an immediate same-slot successor: `p_TempSensor_value` is followed by `p_TempSensor_unit`, `p_WindSensor_speed` by `p_WindSensor_unit` (`dcn-drone-fixture.ts:270-271`, `:340`), `op_TempSensor_injectFailure` by `op_TempSensor_reset` (`:250`, `:342`), `Boolean` by the next entry of `packaged` (`:276`, `:328-329`, `:381`). None of the five losses of the ticket is the last write of its slot.

## 4. Measures

Probe: `frontend/scripts/probe/lost-containment-write.ts`, on its own Vite server (port 3096, `lane-run probe`). Metamodel `Named`, `Root` (containment `a`, `b`), `Leaf`. Each run is a new model in one project: 50 writes through `syncCreateCompositionLink`, one per `page.evaluate`, 300 ms pause as `buildLinks`, no settle: 15 on `R0.a`, 15 on `R1.a`, 20 alternating `R2.a` and `R3.a`. Each write records in its own evaluate what the slot held; the slots are read right after the last write, after 3 s and after 9 s more in total.

Ten runs, in three batches (load at most 20 at each start, as the prompt asks; other lanes moved it during the batches, up to 84 at the end of batch B, so load is not controlled). Batch A lacks the kept-link edge count, added for B and C. Run 11 is an eleventh run with the edge-removal trace. A preliminary run 0 is not counted: it found the `syncCommitBetween` effect below.

| run | writes ms | lost at 0 / 3 s / 9 s (D) | lost at 9 s (L) | stale successors |
|---|---|---|---|---|
| 1 | 15707 | 0 / 0 / 0 | 0 | 0 |
| 2 | 18600 | 0 / 0 / 0 | 0 | 0 |
| 3 | 21679 | 0 / 0 / 0 | 0 | 0 |
| 4 | 18620 | 3 / 2 / 2 | 2 | 2 |
| 5 | 15421 | 0 / 0 / 0 | 0 | 0 |
| 6 | 15379 | 0 / 0 / 0 | 0 | 0 |
| 7 | 15659 | 0 / 0 / 0 | 0 | 0 |
| 8 | 15338 | 0 / 0 / 0 | 0 | 0 |
| 9 | 15394 | 0 / 0 / 0 | 0 | 0 |
| 10 | 15610 | 0 / 0 / 0 | 0 | 0 |

**The two organic losses (run 4), MEAS.**

| lost link | write | slot position | successor saw previous? | successor `seen` | successor `pending` / `inFlight` | edges at 9 s | child `father` is the slot |
|---|---|---|---|---|---|---|---|
| `R1.a->B0` | 15 of 50 | 0 of 15, first | no | 0 | 0 / 1 | 0 | yes |
| `R1.a->B7` | 22 of 50 | 7 of 15, middle | no | 6 | 0 / 1 | 0 | yes |

Stale successors and lost links match one to one in every run (2 and 2 in run 4, 0 and 0 elsewhere). Each stale successor found an empty buffer and one dispatch in flight: the previous write had left the buffer, `action.ts:357`'s `setTimeout(0)` had not run. Neither lost write came back after 9 s, and both read lost in the D-layer and the L-layer. In run 4 one more link was absent at the immediate read and present at 3 s: a read taken too early, so this one is H2. Batch A did not record which link.

The rate differs from the ticket: 1 run of 10 here, against 5 of 5 on the fixture. The fixture's graph is larger and its plan longer; a shape difference that this probe does not reproduce. The cause does not rest on the rate.

**Arms, each pair of writes on empty slots, runs 1-11, MEAS.** Identical in all eleven runs. The edge columns come from runs 8-11, the only ones recording them per arm over time; `removed` is from run 11.

| arm | first / second in the slot | edges at 500 ms, 2 s, 6 s | `father` of both | `[useM1ReferenceEdges] removing` per write |
|---|---|---|---|---|
| `sameSlotSameTick` | lost / kept | 0 / 1 at all three | yes | 1 / 0 |
| `sameSlotMacrotask` (one `setTimeout(0)` between) | lost / kept | 0 / 1 | yes | 1 / 0 |
| `syncCommitBetween` (`COMMIT` synchronously after the first) | lost / kept | 0 / 1 | yes | 1 / 0 |
| `commitBetween` (macrotask, `COMMIT`, macrotask) | kept / kept | 1 / 1 | yes | 0 / 0 |
| `apart700` | kept / kept | 1 / 1 | yes | 0 / 0 |
| `otherContainer` (same tick) | kept / kept | 1 / 1 | yes | 0 / 0 |
| `sameContainerOtherRef` (same tick) | kept / kept | 1 / 1 | yes | 0 / 0 |

Controls (P12): `sameSlotSameTick` is the detector, it must read a loss and does; `commitBetween` must read none and does, on the same reader. The edge query discriminates: 50 of 50 kept links read an edge in runs 5-11 (batch A did not record it), and the losers read 0.

`syncCommitBetween` loses because `TRANSACTION` is `async` and closes after `await func()` (`action.ts:214`, `:221`, `:229`): a `COMMIT` called right after the write runs at depth 2, its `END` only returns to depth 1 and fires nothing (`action.ts:147`, `:154`). The flush needs a macrotask first.

Limits. One organic-loss run, with two losses. The arms prove the mechanism, not that every loss of the ticket went this way: the five losses of the ticket are consistent with it (§3) and were not re-run. Models accumulate in one project across a batch.

**Gates of the probe.** `npm run check:scripts` passed; `tsc --noEmit` on the probe exited 0.

## 5. Hypotheses, answered

- **H1, read-modify-write over the open block: holds.** MEAS: every organic loss has a successor that did not see it, one to one; same slot and no flush between loses the first in 11 of 11 runs; a flush between, or 700 ms, keeps both. READ: §3 steps 1-4.
- **H2, the read only: falsified for the losses, holds for one transient.** MEAS: lost links are still absent at 9 s, D and L alike. One link in run 4 was absent only at the immediate read.
- **H3, a later writer removes the value: falsified for the value; holds for the edge, as a consequence.** MEAS: the edge of each loser is removed by `useM1ReferenceEdges` (1 removal per losing write, 0 per kept one, run 11). READ `useM1ReferenceEdges.ts:158`: `const toDelete = managedM1Edges.filter(e => !validPairs.has(`${e.start}→${e.end}`));`. No edge is removed for a link whose value landed.
- **H4, the uniqueness gate of `addObject`: falsified on reading.** `syncCreateCompositionLink` does not call it. READ `canvasToJjom.ts:1734-1762`; the refusal at `LModelElement.tsx:7411-7415` also creates no object, while the lost child exists.

**The condition is the slot, not the container.** MEAS: two writes to one parent on two references keep both (`sameContainerOtherRef`).

## 6. Root cause

`syncCreateCompositionLink` plans the index of an append from the store (`canvasToJjom.ts:1742-1744`), while the previous append to that slot may still be in the open block or in the `setTimeout(0)` after the commit (`action.ts:336-337`, `:357`, `reducer.ts:1555`). Two appends then plan the same `values.N`, the second overwrites the first. The child keeps `father` pointing at a slot that does not hold it, and `useM1ReferenceEdges` deletes its edge, so the link disappears from the canvas too. The state is persisted as it is: nothing repairs it.

The fixture hits it because its 300 ms pause equals the commit period: a write arrives near the tick, and any write that lands between the tick and its dispatch reads the old slot.

## 7. Who can hit it

Callers. `command grep -n "syncCreateCompositionLink" -r frontend/src frontend/scripts -m 10`: in `frontend/src` the only calls are `EditorV2.tsx:2261` and `:3429`; the other hits are comments and the definition, which is the positive control of the search (`canvasToJjom.ts:1704`).

| who | through | reachable? | evidence |
|---|---|---|---|
| Scripted bursts | the fixtures (`buildLinks`) | yes | MEAS, ticket |
| Two quick drops or connects on one slot | `performContainmentDrop` (`EditorV2.tsx:2619`, `:5269`, into `:3429`), `:2261` | in principle: the second gesture must arrive before the first write is in the store, up to 300 ms plus any long task | READ; not measured with real gestures |
| Paste of several children | `pasteClipboard`, `EditorV2.tsx:3132-3171` | no call from the handler: it only calls `setNodes` and `setEdges` | READ of that window; any effect downstream of those setters was not traced |
| JjScript | `instance.ts:851`, `:1172`, `:1248` call `settlePendingWrites` before reading a slot | protected, by #168 | READ of the grep hits and of `:422-427`; its measures are in `discovery_2026-10-02_168_c1_executor_prompt.md` §3.3 |
| The same read-modify-write elsewhere | `canvasToJjom.ts:1687` (`syncSetReferenceValue` append, from `IRNodeContent.tsx:492`), `:1812` (`syncCreateReferenceLink`), `EditorV2.tsx:2360`, `ContextMenu.tsx:395`, `LModelElement.tsx:7425` | same shape, one write per gesture | READ; not measured. Search: `command grep -rnE "\.values *= *\[ *\.\.\."` over `components model jjform jjtl jjscript services`, which also returned the known site `canvasToJjom.ts:1744` |

Not every one of these reads the same way: `ContextMenu.tsx:395` reads the L getter rather than `__raw`, and `LModelElement.tsx:7425` reads `c.data.values`; both read the store.

## 8. Fix options

No option is applied. Each touches the critical zone or the core, so a Layer Impact Report is owed first (§3.2).

| option | what | layers | for | against |
|---|---|---|---|---|
| **A, overlay of queued appends** | one helper in the sync layer used by the append sites: `[...meaningful, ...queuedNotYetLanded, id]`, per slot, an entry dropped once the store holds it | sync (`canvasToJjom.ts`), `EditorV2.tsx` if `:2360` joins | synchronous signature kept; re-emits the earlier value at its own index, which is idempotent; no reducer change | a new module-level state; needs a bound for a write that never lands (an aborted transaction) |
| B, append in the reducer | `SetFieldAction.new(slot, 'values', id, '+=', true)` | D-layer write path | no read at all, so no window | must carry what `get_setValueAtPosition` does (`father`, detach from the old container, `isMirage`); a null hole stays ahead of the append, while today's write compacts it; `+=` on a `DValue.values` not measured |
| C, await the flush | macrotask, `COMMIT(undefined, false)`, macrotask, as `settlePendingWrites` | sync plus every caller | measured to work (`commitBetween`) | the function becomes async, and `EditorV2.tsx:3429` uses its return value synchronously |
| D, read through the buffer in `set_values` | the L-layer sees pending actions | L-layer, core (Rule 5) | every caller at once | widest blast radius: JjScript and every slot write change |
| E, harness only | wait for the slot after each write, or keep `repairContainment` | probes | no app risk | users stay exposed |

Rule 12 note, READ: `canvasToJjom.ts:1734` and `:1750` wrap `DVoidEdge.new2` in a `TRANSACTION`, which the rule forbids near the sync layer. It is not this cause: MEAS 50 of 50 kept links have their edge. Left alone.

## 9. Dependencies and risks

- A fix changes what reaches the store for a burst; undo merges writes by time window (`reducer.ts:1237`), so the undo of two quick drops must be re-checked.
- The probe's `sameSlotSameTick`, `sameSlotMacrotask` and `syncCommitBetween` arms should turn into kept / kept with a fix to the write; the arms assert the current behaviour and its detector check would then have to change with it.
- Existing saved projects may hold children whose `father` points at a slot that does not contain them. Not counted here.

## 10. Open questions

1. Which fix? Recommended: option A, in a critical-zone lane with a Layer Impact Report, the five append sites through one helper.
2. Is an idle-time check for saved projects wanted, for children whose `father` slot does not hold them? Recommended: count them on the demo exports first, decide after.
3. Does the fixture keep `repairContainment`? Recommended: keep it until the fix is merged, then remove it and make L-1 a failing check.
4. Should two quick real drops on one slot be measured before the fix? Recommended: yes, one probe through `performContainmentDrop` inside the fix lane, as its acceptance test.

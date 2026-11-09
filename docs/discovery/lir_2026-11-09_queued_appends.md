# Layer Impact Report: queued appends overlay for slot writes (option A)

Prompt-ID: P-2026-11-09-1227. Chat: C-2026-11-06-2159. Front: dcn. Session: `d8d0b42c-b86a-4ef2-938f-f3c659c69399`.
Tree: `~/jjodel-w-lostfix`, branch `lost-link-fix`, HEAD `f840dac52`. Cause and options: `docs/discovery/discovery_2026-11-09_lost_containment_write.md` §6-§10.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks): canvasToJjom.ts, a new module beside it, two callers
  [ ] Persistence (VersionFixer / jsxString)
```

No reducer, L-layer or core change is needed; no stop owed. Everything below is READ on HEAD unless marked otherwise.

## Sync layer

**What changes.** A new module `sync/slotAppendQueue.ts`, without imports from `joiner`, so a unit test can run it. `canvasToJjom.ts` binds it to the real store and exports `planSlotAppend(slot, id)`, which returns `[...meaningful values in the store, ...queued not yet landed, id]` and records `id` as queued for that slot. The array is assigned to `slot.values` as today: signatures and return values of the callers do not change.

Sites routed through it:

| site | today | note |
|---|---|---|
| `canvasToJjom.ts:1744` `syncCreateCompositionLink` | `[...meaningful, childObject.id]` | |
| `canvasToJjom.ts:1687` `syncSetReferenceValue`, append | `[...meaningful, targetObjectId]` | its `includes` no-op stays; a second append of an id still queued stays one entry, as today |
| `canvasToJjom.ts:1812` `syncCreateReferenceLink` | `[...meaningful, targetObject.id]` | |
| `EditorV2.tsx:2360` `writeSlot` | `[...meaningful, objId]` | |
| `contextMenu/ContextMenu.tsx:395` | `[...(l.values as LObject[]), child]` | see below |

`canvasToJjom.ts:1689`, the `replace` branch of `syncSetReferenceValue`, is not an append, but it calls `forgetSlotAppends(slot.id)`: without it, an entry queued before a replace would come back at the next append.

Path note. The prompt's DOVE names `frontend/src/components/editor-v2/ContextMenu.tsx`. That file has no append site: `command grep -nE "\.values *= *\[ *\.\.\."` over it returns nothing, and the same command returns the five known sites on the others. The site the prompt names (`ContextMenu.tsx` about 395) and the discovery report lists (§2, §7) is `frontend/src/components/contextMenu/ContextMenu.tsx:395`. That is the file touched, one site. It already imports from `../editor-v2/sync/canvasToJjom` (`:55`).

`ContextMenu.tsx:395` today reads the L getter, which pads with `undefined` under a lower bound (the comment at `canvasToJjom.ts:1736-1739`) and carries L objects. Through the helper it reads `__raw.values` and passes `child.id`, like the other four. A `child` that `addObject` refused (`undefined`) stays a no-op, by a guard at the site.

**What the overlay holds.** Per slot id (the `DValue` id), an ordered list of entries `{ id, buffer }`: the ids appended and not yet in the store, each with the transaction buffer that took its write.

**When an entry is dropped.** On two conditions, checked at every plan for that slot and at every store update for all slots (one `store.subscribe`, installed at the first plan):

1. **Landed:** the store's slot holds the id.
2. **The bound, a write that will never land:** the buffer that took the write has left and no dispatch is in flight. That is `entry.buffer !== t.pendingActions && t.dispatchesInFlight === 0`.

Why this bound and not a time. `FINAL_END` replaces `t.pendingActions` with a new array in both of its exits, the flush (`action.ts:177`) and the abort (`action.ts:161`), and those are the only exits; the other assignment (`action.ts:151`) needs a non-empty `actionstoPrepend`, which no caller in `frontend/src` passes (`command grep -rnE '\bEND\(\[[^]]|\bEND\([a-zA-Z]'`, whose one hit is the definition). `fire` decrements `dispatchesInFlight` in the same macrotask as `store.dispatch` (`action.ts:357`). So "the buffer has left, nothing in flight" means exactly that the write has been delivered to the reducer or thrown away: no store state can come later that holds it.

A timer fails on both sides. The commit is itself a timer, so a long task delays it by its own length: a short TTL drops an entry whose write is still coming and the bug is back, exactly where the fixture hits it. A long TTL keeps an entry whose write has been delivered, and a value removed or undone in the meantime comes back at the next append. The transaction's own lifecycle has neither failure and needs no constant.

Why a subscription and not only the check at plan. Dropping at the next plan alone would leave a landed entry waiting on a slot nobody appends to, for as long as that takes; if the value is later removed and an append happens to arrive while an unrelated dispatch is in flight, the entry would pass the bound and the removed value would return. Dropped at the store update that lands it, the entry never outlives its write. The listener costs one empty-map check per update when nothing is queued.

**What does NOT change.** `reducer.ts`, `action.ts`, `LModelElement.tsx` (`:7425` stays, as a ticket), the D-layer write actions, `DVoidEdge.new2` and its `TRANSACTION` at `canvasToJjom.ts:1734` and `:1805` (no TRANSACTION added, Rule 12), `set_values`, JjScript's `settlePendingWrites` (`instance.ts:422-427`, its writes do not go through these sites).

**Cross-layer interaction.** Reads only: `store.getState().idlookup` and `store.subscribe`; `window.transactionStatus`, the object `action.ts:103` publishes, because `pendingActions` has no exported accessor and `action.ts` is out of scope. In the D-layer the effect is what a burst leaves: both ids instead of the last.

**Side-effect safety.** The array of a burst re-emits a queued id at its own index. That was checked on each step of the write:

- `get_setValueAtPosition` (`LModelElement.tsx:7931-7932`): the store's index is still empty, so the second write of that index proceeds, as the first did.
- Detach from an old container (`:7975-7983`): keyed by value, reads the same old state, writes the same `undefined`.
- `_clearValueAtPosition` (`:7892`): the old value at that index is empty, nothing to evict.
- `father` (`:7985`): same value.
- Reducer (`reducer.ts:388`, `:411-414`): the second write sets the same value; `arrayDifference` over old and new is empty, so `pointedBy` gains nothing.

The ceiling of the protection. An id removed by an action still in the same open buffer as its own append would be re-emitted by an append planned before that buffer leaves: a window of at most one commit, inside one gesture sequence, on a value appended and removed within 300 ms. The removal paths are not routed through the queue.

`LModelElement.tsx:7425` and `applyMembershipOps` (`EditorV2.tsx:1793`) stay outside the overlay: the first by the prompt, the second because it is not in the report's list.

## Undo

The undo entry is a delta per dispatched composite, merged by `mergeTolerance` (`reducer.ts:1237`), and a delta that lengthens `objects` opens an entry of its own (`:1145`, `:1301`). The overlay adds to a composite only the re-emitted index of a value that either is already in the store (then no delta) or is written by the same composite (then the delta covers it). Expected, by case:

| case | today | with the overlay | undo restores |
|---|---|---|---|
| two appends in one composite | slot `[B]`, A lost | slot `[A, B]` | the empty slot, both |
| two appends in two composites | second overwrites A at N | second writes N+1 | `[A]`, then empty |

Measured, not assumed: the probe arm through `performContainmentDrop` reads the undo stack and each undo's effect, on the code before the sites are routed and after.

## Smoke scenarios potentially affected

- Two quick drops into one container: both children, both edges, one undo per drop as before. Reached by the new probe arm.
- Scripted bursts: `lost-containment-write.ts` arms and the 10-run burst; `dcn-drone-fixture.ts` L-1. Reached.
- Import Families.ecore, expect 8 edges Family/Member: M2 references, written by the importer and `useJjomSync` Step 3. None of the five sites is on that path. Not reached by these probes.
- Open an existing project: the queue is empty, no plan runs. Not reached by these probes.
- Save and reopen: the queue is not persisted; the state saved is the D-layer. Not reached by these probes.

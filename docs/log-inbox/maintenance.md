# log-inbox — lane «maintenance»

Entries written by the maintenance lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — ticket: M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`
**Ticket**: `metamodelClassSignature` in `frontend/src/components/editor-v2/hooks/useEditorMode.ts` keys the memoised `modeInfo` on, per class: id, name, abstract, singleton, own reference and attribute names, and (since P-2026-10-11-1025) superclass ids. It ignores a reference's type, containment (composition/aggregation), bounds, the `interface` flag and attribute types.

Editing any of these in the metamodel tab while the model tab stays mounted should leave `modeInfo` on the old value, which the M1 connect gesture, the palette and the drop gates read: same mechanism as the subclass bug fixed by P-2026-10-11-1025, which Alfonso reproduced by hand. This one is read from the code, not measured.

Detail: `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` §5.2.
**Priority**: medium
**Found in**: P-2026-10-11-1025

## 2026-10-11 — ticket: M1 canvas: xyflow refuses Transition→State over `target` after reopen
**Ticket**: Measured in 4 of 4 runs of `frontend/scripts/probe/subclass-edge-gesture.ts` (gesture B0t, three runs before the P-2026-10-11-1025 fix and one after): after reopening the model tab, dragging from a Transition's ghost source handle `left-0` to a State's `right-0` gives `isValid: false` in xyflow's connection state, so `onConnect` never fires and nothing is written. A0t (`left-1` to `right-0`) and B4 (`left-0` to `right-0`) are valid. No subclass is involved.

Seen only in the probe, not yet reproduced by hand; cause not investigated. First step: reproduce manually on the trunk.

Detail: `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` §5.3.
**Priority**: low
**Found in**: P-2026-10-11-1025

## 2026-10-11 — ticket: leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts
**Ticket**: `frontend/src/model/conformance/ConformanceGuard.ts:70` logs `[BUG-DIAG-GUARD] checkLinkCreation` on every M1 link creation (marker comment at `:47`). Seen in the console of every probe run of P-2026-10-11-1025.

Already listed on 2026-07-26 in `docs/discovery/discovery_2026-07-26_debug_console_logs.md` (row `[BUG-DIAG-GUARD]`, option (c), left out of scope on purpose: outside editor-v2, possibly entangled with the `featureTrace` array built upstream). It was never removed nor tracked since. `CLAUDE.md` §2: instrumentation is removed in a dedicated cleanup commit; check whether `featureTrace` goes with it.
**Priority**: low
**Found in**: P-2026-10-11-1025

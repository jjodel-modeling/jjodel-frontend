# log-inbox — lane «subclass-edge-gesture»

Entries written by the subclass-edge-gesture lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — fix(editor-v2): superclass ids in the M2 signature, M1 gesture on subclass instances (P-2026-10-11-1025)
**Prompt**: `claude_2026-10-11_1025_prompt_m1_edge_gesture_subclass_instances.md`, full lane on `~/jjodel-w-subclassedge` (branch `fix-subclass-edge-gesture`): Phase 1 read-only, reproduce the inert M1 connect gesture on instances of a subclass added while the model tab is mounted, name the derived value; Phase 2 GO for fix F1 in the same session: test first, the fix, gates, the probe as acceptance, three tickets written here as text.
**Files touched**: `a9a66c4b6`: `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` (new). `3207576ca`, `3f2a3e81f`: `frontend/src/components/editor-v2/hooks/__tests__/useEditorMode.test.ts` (new). `2e16e257d`: `frontend/src/components/editor-v2/hooks/useEditorMode.ts`. `233f0b46b`: `frontend/scripts/probe/subclass-edge-gesture.ts` (new). This commit: this inbox file (new), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (six files over six commits, above five (rule 19), each named by the prompt or the GO; no critical-zone file)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe 45/0 on 3141; npm run smoke on 3141: run 1 red, empty-project not reached on a cold-server goto timeout, run 2 after a 77 s warm-up green 12/0/3; the chat's visual check is pending)
**Notes**: Cause: useEditorMode's memo key lacked `extends`; F1 adds the superclass ids. Test red 5/7, green 7/7, then 8/8; bench 5/5 killed (count-for-ids survived 7 tests, killed by 3f2a3e81f). tsc 14 = baseline; vitest: the 9 known import failures + laneBoard.test.ts (child status null under load; alone 66/66); build 0. 3f2a3e81f's subject is 76 chars, over 72, not rewritten. Commit types chosen by the session (none named).
**Prompt document name**: 2026-10-11 10:25

**Ticket** (medium; proposed title «M1 canvas: the modeInfo signature misses reference type, containment, bounds and `interface`»): `metamodelClassSignature` in `frontend/src/components/editor-v2/hooks/useEditorMode.ts` keys `modeInfo` on, per class, id, name, abstract, singleton, own reference and attribute names and (from F1) superclass ids. A reference retyped under the same name, a composition or aggregation toggle, a bounds change, the `interface` flag or an attribute's type, written while the model tab is mounted, leaves `modeInfo` on the old value, which the M1 connect gesture, the palette and the drop gates read. Same mechanism as this lane, read and not measured. Detail: report §5.2.

**Ticket** (low; proposed title «M1 canvas: xyflow refuses Transition→State over `target` after reopen»): measured in 4 of 4 probe runs (three before F1, one after), gesture B0t of `frontend/scripts/probe/subclass-edge-gesture.ts`: from a Transition's ghost source handle `left-0` to a State's `right-0` (type source), xyflow's connection reads `isValid: false`, so onConnect never fires and nothing is written; A0t (`left-1` → `right-0`) and B4 (`left-0` → `right-0`) are valid. No subclass involved, cause not investigated. Detail: report §5.3.

**Ticket** (low; proposed title «leftover `[BUG-DIAG-GUARD]` console.log in ConformanceGuard.ts»): `frontend/src/model/conformance/ConformanceGuard.ts:70` logs `[BUG-DIAG-GUARD] checkLinkCreation` on every M1 link creation, with its marker comment at `:47`; `CLAUDE.md` §2 removes instrumentation in a dedicated cleanup commit. Seen in the console of every probe run. Detail: report §5.5.

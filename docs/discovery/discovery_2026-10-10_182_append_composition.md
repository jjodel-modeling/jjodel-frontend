## 0. Answer in brief

- **Prompt-ID** `P-2026-10-10-1230` (chat `C-2026-10-10-1223`), issue #182, worktree `jjodel-182`, HEAD `2aa9430ac`.
- **Answer.** The root cause is confirmed as the chat read it. `formWrite.appendSlotValue`
  (`frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts:259-277`) appends with a raw
  `SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr)` (`:268`). That action writes the slot's `values` and
  nothing else. `LValue.setValueAtPosition` (`LModelElement.tsx:7906-8006`) is the only path that, on a containment
  slot, re-fathers the target and evicts it from its old container. So a pointer appended to a composition slot
  leaves `father` where it was while the slot lists it.
- **Reproduced (BEFORE, probe `MODE=before`, exit 0, 0 page errors).** C1 (fresh target, same tick) and C2 (settled
  root): `{ok: true, changed: true}`, `father` is `DModel`, the element is in the model's roots, and `S1.pathway`
  lists it. So the bug stands as the issue describes it, in both timings; no stop condition of step 3 applies.
- **Two things BEFORE adds that the issue does not say.** C4: appending a pointer the slot already lists writes it a
  second time (length 2 to 3, result `changed: true`). C5: the core's loop refusal is bypassed, and the raw append
  writes a listing loop (`cp.sub = [cq]`, `cq.sub = [cp]`) with `{ok: true}`.
- **Reachability confirmed.** S0 (positive control): on `Scenario`, `shape.refs` holds `lead`, `team`, `spare` and
  `shape.children` holds `pathway`, `main`. So «New … & link» (`InstanceManagerTab.tsx:2319`,
  `ConfiguratorTab.tsx:315`) is never offered on a composition. The one user gesture that reaches the bug is the chip
  picker of `IRFormField.tsx` (`:347-349`, `:263`, `:510`); that path is established by reading, the probe calls
  `formWrite.appendValue` directly (it has no browser gesture).
- **Fix** (in `appendSlotValue` only): when `isPtr` and `fresh.instanceof?.composition === true`, write through
  `fresh.setValueAtPosition(rawValues(fresh).length, value, { isPtr: true })` and return `fromCore(verdict)`; a value
  the slot already lists is `writeUnchanged()`. Plain references, aggregations, shapeless slots and primitives keep
  the `'+='` line byte for byte. Controls G2 (aggregation) and R1 (plain reference) are measured unchanged BEFORE and
  must stay so AFTER.
- **Recommendation**: go on to Phase 2 in cascade. None of the four stop conditions of step 3 holds.

**Decisions awaiting Juri**

- Q1. BEFORE shows the raw append also duplicates a pointer on a plain reference or aggregation slot. The fix leaves
  that as it is (the prompt keeps those branches byte for byte). Recommended: leave it, outside #182; open a ticket
  only if a duplicate in a plain reference is a bug and not a legal multiset.
- Q2. Two appends to one composition slot in one propagation window target the same index (C6). Accepted by the
  prompt, written in the docblock, measured, not fixed. Recommended: keep, every caller issues one append per gesture.
- Q3. Undo of the new move is #177 territory (U1 measures it). Recommended: report only, no change here.

## 1. Hypothesis the discovery falsifies

H1: "`appendSlotValue` on a composition leaves the target's `father` where it was because the append is a raw `'+='`
and not a `setValueAtPosition`." Falsifiable by C1 and C2 BEFORE: if `father` were the slot after the raw append, H1
would be wrong. It is `DModel`, so H1 stands.

H2: "«New … & link» is not offered on a composition". Falsifiable by S0: if `pathway` or `main` were in `shape.refs`,
H2 would be wrong. They are not.

## 2. Files read

- `frontend/src/components/editor-v2/viewpoint/ir/formWrite.ts` (whole file)
- `frontend/src/model/logicWrapper/LModelElement.tsx` `:7865-8006` (`get_setValueAtPosition`), `:8107-8114`
  (`set_value`), comment `:7898-7905`
- `frontend/src/components/editor-v2/hooks/shapeAdapter.ts` `:48-118`, `frontend/src/jjform/shape.ts` (`RefShape`),
  `frontend/src/components/editor-v2/hooks/useEditorMode.ts:421`
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts:296-298`,
  `frontend/src/components/editor-v2/hooks/deleteDraw.ts:57,87-94`
- `docs/PROTOCOL.md` P4, P6, P9, P16; `docs/decisions.md` RC-32 and R-NEST-1..8; `CLAUDE.md` §3.1, §3.2, §5, §6,
  `frontend/src/model/CLAUDE.md` §3.13 and §9.3
- `docs/lir/lir_2026-10-10_174_load_purge.md` (format only)
- Probe: `frontend/scripts/smoke/_tmp_182_probe.ts` (gitignored), built on `_tmp_174_p2.ts`; log
  `~/.jjodel-lanes/P-2026-10-10-1230/probe-_tmp_182_probe.log`

## 3. Root cause, with file and line

`formWrite.ts:259-277`:

```ts
export function appendSlotValue(slot, value, isPtr): WriteResult {
    if (!slot) return writeRefused('no slot to append to');
    try {
        TRANSACTION(`form append ${slot.name ?? 'value'}`, () => {
            const fresh = slot.r ?? slot;
            SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr);   // :268
        });
    } ...
    U.isProjectModified = true;
    return writeDone();
}
```

`SetFieldAction ... '+='` appends to `values`. It does not touch the target's `father`, the old container's `values`,
or the pointer back-references the core maintains on a containment write. `setSlotValue` in the same file
(`:135-162`) goes through `fresh.setValueAtPosition(index, value, { isPtr })`, and the core does the rest: the loop
check at `LModelElement.tsx:7951-7952` (`"cannot create a containment loop"`), the detach from the old container at
`:7953-7960` and what follows. The two paths are the same write at two heights; the append took the lower one without
the container logic.

Predicate. `info.isContainment` is true for an aggregation as well as a composition, so the core cannot tell the
caller's intent; the form already classifies on `feature.composition === true` (`useFormWidgets.ts:298`,
`deleteDraw.ts:87`). The fix uses the same predicate, on the re-wrapped proxy: `fresh.instanceof?.composition`.

Consumers of the field that the bug leaves wrong (sub-rule §5, consumer check):

- the tree and the export read `model.objects` / roots: they show a root;
- the container's form reads the slot: it shows a child;
- the cascade is slot-based (R-NEST-5, `deleteDraw.ts:87-94`): deleting the container deletes it (arm D1, BEFORE:
  `c1` and `c2r` go with `S1`, and are roots until then).

## 4. Reachability table

| Call site | Reaches `appendSlotValue` with a pointer on a composition? | Evidence |
|---|---|---|
| `InstanceManagerTab.tsx:2319`, `ConfiguratorTab.tsx:315` («New … & link») | No | S0 runtime: `refs` = `lead:false, team:false, spare:false`; `children` = `pathway:true, main:true`; `shapeAdapter.ts:91` splits on `!r.containment`, `useEditorMode.ts:421` sets `containment: !!(ref.composition)` |
| `IRFormField.tsx:232` `appendAt`, from the chip picker `:510` | Yes | read: `onRequestAdd` at `:347-349` when `isMultivalued && isPointerValued`, `isPointerValued = isReference \|\| isComposition` at `:263`; `ListWidget` gives a composition no append (`:375`). Not exercised in a browser |
| `writeCtxLproxy.ts:141` `WriteCtx.appendValue` | No consumer today | read |

## 5. BEFORE column (probe `MODE=before`, all arms `MEAS` or control)

Fixture: metamodel `MM174`-shaped (`Scenario`, `Phase`, `Person`): `lead`/`spare` plain, `team` aggregation,
`pathway` composition `*`, `main` composition `0..1`, `Phase.sub` composition. Model `m182`, plus `m182c` for C5.

| Arm | Measured BEFORE | After must be |
|---|---|---|
| S0 | refs `lead,team,spare`; children `pathway,main` | same (asserted in both modes) |
| C1 fresh target, same tick | `link {ok:true,changed:true}`; `c1` father `DModel`, in roots, `S1.pathway` lists it once | `{ok:true,changed:true}`; father `S1.pathway`; once in `objects`; not a root |
| C2 settled root | `{ok:true,changed:true}`; father `DModel`, in roots, listed by `S1.pathway` | as C1 |
| C3 move from `S2.pathway` | `{ok:true,changed:true}`; father stays `S2.pathway`; listed by both `S1.pathway` and `S2.pathway` | father `S1.pathway`; `S2.pathway` no longer lists it |
| C4 already listed | `{ok:true,changed:true}`; raw length 2 to 3 (duplicate) | `{ok:true,changed:false}`; length unchanged |
| C5 loop | `{ok:true,changed:true}`; `cq.sub` lists `cp` (a listing loop); core direct: `{success:false, reason:"cannot create a containment loop"}` | `{ok:false}` with that reason; `cq.sub` and `cp.father` unchanged |
| C6 two appends, one tick | both `{ok:true,changed:true}`; raw `[c6a, c6b]`; both fathers `DModel` | MEAS only: reported, never asserted |
| G2 control, aggregation | father `DModel`, `S2.team` lists it | unchanged |
| R1 control, plain reference | father `DModel`, `S1.lead` lists it | unchanged |
| D1 `S1.delete()` | `c1`, `c2r` deleted with it; `P3` (plain) survives; 15 delete calls, no double delete; dangling `[]`; no console error | same |
| U1 append then one undo | history `[0,1,0]`; after undo the slot is empty, `u1k` stays a root; health clean | MEAS only (#177) |
| V1 vertices and edges | 1 vertex, 0 edges before and after; no canvas hook is mounted in the harness | MEAS only; D-layer state, not the rendered flow |
| E0 / CE | 0 page errors / 1 console error `init_dash` | no page error that BEFORE lacks; the same one console error |

The BEFORE run reproduced the bug in C1 and C2, so the cascade to Phase 2 is open.

## 6. Dependencies and risks

- Layer reach: the change is one function. It adds a reachable call into the core (`setValueAtPosition`) from the
  form's append, which already holds for set and clear (`setSlotValue`, `clearSlotValue`). Detail in
  `docs/lir/lir_2026-10-10_182_append_composition.md`.
- The `TRANSACTION` in `appendSlotValue` holds no creator (`DVertex.new`, `DVoidEdge.new2/new3`): CLAUDE.md rule 12
  does not apply.
- Index source: `setValueAtPosition` takes the index from the caller (`LModelElement.tsx:7898-7905`): C6.
- The probe has no canvas hook mounted: whether the node of a moved element is repainted under its new container is
  not measured here (V1); it is a visual item for Juri.

## 7. Decisions taken (unattended)

1. Predicate `fresh.instanceof?.composition === true`, as the prompt gives it; not `containment`.
2. Index `rawValues(fresh).length`.
3. A pointer the slot already lists is `writeUnchanged()`; this also closes the duplicate of C4 for compositions
   only.
4. `U.isProjectModified = true` only on `ok && changed` in the composition branch; the non-composition branch keeps
   its unconditional mark.
5. Probe kept out of the commit (`_tmp_*` is gitignored).

## 8. Open questions

See `## 0.` (Q1, Q2, Q3), each with its `Recommended:` line.

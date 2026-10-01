# Discovery — slice 5, the multi-instance preview of the Symbol Editor

Prompt-ID: P-2026-09-17-1425
Date: 2026-09-17 (Europe/Rome)
Branch: `validation-skeleton`, worktree `/Users/alfonso/jjodel`
Phase: Fase 1, read-only. No file was modified while writing this.

The prompt asks three questions and defines three conditions that would force a hard stop.
**None of the three holds.** The answers below say why, with the line that carries each fact.

---

## 1. Vertex to object

**It is a plain field read on the D-layer: `state.idlookup[vertexId].model`.**

`ObjectNode.tsx` never computes the `objectId` itself. It receives the whole resolution from
`useIRView(id, data.instanceOfClassId)` (`ObjectNode.tsx:107`) and reads `irResolution.objectId`
at the accessor call (`ObjectNode.tsx:900`,
`irResolution.compiled.form(irResolution.readCtx, irResolution.objectId)`).

The field is obtained inside the hook, twice, in the selector and in the memo, identically:

```
frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts:56    const objectId = lookup?.[vertexId]?.model;
frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts:108   const objectId = lookup?.[vertexId]?.model;
```

`lookup` is `state.idlookup` in both places (`:55`, `:107`). `vertexId` is the hook's first
argument, which `ObjectNode` passes as its React Flow node `id` — the same string the wrapper
carries in `data-id`, i.e. exactly what `readBox` already returns as `CanvasNodeBox.vertexId`
(`useCanvasNodeBox.ts:62-67`, and the header comment at `:18-20` states the identity).

**No L-proxy, no temporary id.** `DVertex.model` is a raw pointer string on the D-layer record;
the read is guarded by `typeof objectId !== 'string'` at both sites, which is the only failure
mode (a vertex whose `model` is absent). The §9.1 hazard — `DObject.new()` returning an id that
does not resolve in `store.getState()` — does not apply: these are persisted vertices already in
`idlookup`, not freshly created ones.

`ReadCtx` element ids are DObject ids and the file says so:
`irReadCtx.ts:12` — *"Element ids passed to ReadCtx are DObject ids (model layer), NOT vertex ids."*
So the mapping is mandatory, and it is one field.

## 2. Name of the instance

**`ReadCtx.getName(objectId)`** (`irReadCtx.ts:23`), which in production is the **draw**
implementation whichever backend is active: `makeReadCtx` returns `makeLproxyReadCtx` because
`IR_READ_BACKEND === 'lproxy'` (`irReadCtx.ts:15`), and that backend delegates identity to the
draw one — `getName: draw.getName` (`irReadCtxLproxy.ts:46`), with the reason given at `:43-45`
(identity is structural, not value-coerced).

The draw implementation (`irReadCtx.ts:166-174`) is a three-step fallback:

1. the value of the `name` **slot**, when it is a non-empty string — `getValue(elementId, 'name')`,
   i.e. `findFeatureRaw` walking `DObject.features` for a `DValue` whose `instanceof` is a
   feature named `name`;
2. otherwise `idlookup[elementId].name` — the **D-layer `DObject.name`**;
3. otherwise `initialName`; otherwise `null`.

**For an object whose class has no `name` feature**, step 1 misses (no slot) and step 2 answers:
`DObject.name` is set at creation and is not a feature of the metaclass, so the read returns the
instance's display name, not `null`. The comment at `:167-169` records why the slot comes first
(XMI import populates the slot without propagating onto `DObject.name` — the §3.12 asymmetry).

`null` (or `''`) is therefore rare but reachable — an unresolvable id, or a record with neither
`name` nor `initialName`. That is the case D8-a's `#1 / #2 / #3` fallback covers, and it is the
only case: a class without a `name` feature is **not** one of them.

## 3. Store access in the modal

**No new whole-`idlookup` subscription is needed.** The modal can build the `ReadCtx` the same way
`useIRView` does: `store.getState().idlookup` read **inside a memo**, with the *subscription*
carried by a primitive signature.

`useIRView` is the worked precedent, in one file:
- the subscription is a `useSelector` returning a **string** (`irResolve.ts:49-72`) — the IR
  signature plus, per object, `objectId`, `instanceof` and a `fid=JSON.stringify(values)` entry
  per feature slot;
- the `idlookup` itself is taken from `store.getState()` inside the `useMemo`
  (`irResolve.ts:103`, `:107`) and `makeReadCtx(lookup)` is called there (`:110`);
- `store` is imported from the joiner barrel (`irResolve.ts:13`).

`SymbolEditorModal.tsx` already imports that barrel (`:29`, `LPointerTargetable, U, LViewElement`),
so `store` costs it no new dependency, and it already owns two primitive-valued selectors of
exactly this shape — `manualSig` (`:209-216`) whose header comment states the discipline
verbatim ("as a primitive signature so the subscription cannot re-render the modal on unrelated
store updates"), and the `ir` selector (`:192-193`).

Subscribing to `s.idlookup` **would** have been the hard stop: the object is replaced on every
action, so a selector returning it re-renders the modal on every store write. It is not needed and
will not be written. The slice adds one more primitive selector — the per-instance feature
snapshot over the (at most 3) resolved objectIds, joined into one string — and derives the
`ReadCtx` from `store.getState()` beside it.

**Third stop condition, the test bench.** The new pure module imports only pure modules and can be
imported by vitest under node:
- `irCompile.ts` imports **types only** from `irTypes` plus `parsePathExpr` from `pathExpr`
  (`irCompile.ts:11-35`); `ir/__tests__/ir.test.ts:12` already imports it in the bench.
- `ui/ConditionalEditor/conditional.ts` imports types only (`conditional.ts:11`).
- `authoring/borderOverrides.ts` is pure by construction and already under test
  (`authoring/__tests__/borderOverrides.test.ts:18`).

Monaco enters through the `joiner` barrel, which `VertexAuthoringPanel.tsx` and
`SymbolEditorModal.tsx` import and the new module will not. That is the same split
`borderOverrides.ts` was created for (its header, `:4-11`).

---

## 4. Two facts the prompt supplied, re-checked

| Claim | Verified |
|---|---|
| `matchIndexOf` does not exist | `command grep -rn "matchIndexOf" frontend/src/ docs/` → 0 hits under `frontend/src/`, 10 in `docs/` (spec, decisions, this prompt and the 09-15 one). Positive control: the same command finds it in `docs/`, so the search has signal. |
| `previewInstances` is free | Same command → 1 hit, the prompt line proposing the name. Free in `frontend/src/`. |
| `compilePredicate` is not exported | `irCompile.ts:153`, `function compilePredicate(...)`, no `export`. |
| `compileConditional` resolves the three shapes | `irCompile.ts:244-263`: `undefined` → fallback; non-object or no `when`/`rules` → scalar; `when` → `then` / `else ?? fallback`; `rules` → first holding rule, else `default ?? fallback`. |
| `resolveCanvasNode` walks every mark and keeps the first | `useCanvasNodeBox.ts:50-59`. |

**Sink safety for `matchIndexOf`.** `compilePredicate` writes into two module-scoped sinks,
`crossPathSink` (`irCompile.ts:47`, read at `:131` behind a truthiness guard) and `channelSink`
(`:82`, written at `:198` through `?.`). Both are `null` outside a `compileView` /
`compileEdgeView` pass, and both call sites are already null-guarded, so calling
`compilePredicate` from `matchIndexOf` with a throwaway `deps` set writes nowhere and disturbs no
compile. It is also non-reentrant by the same argument the file makes at `:41-45`: `matchIndexOf`
is called from the modal, never from inside a compile.

## 5. One decision the prompt's file list does not settle — Border captions

D8-a defines the Border caption as *"the first row in `borderOverrideRows` order whose `when`
holds"*. `borderOverrideRows` returns `{ whenText, axes }` (`borderOverrides.ts:26-31`): the
pretty-printed text, **not** the `Predicate` the caption must evaluate. So the new module cannot
ask it which row holds.

`borderOverrides.ts` is **not** in the declared file list, so adding an optional `when` to
`BorderOverrideRow` — additive, two lines, and the obvious fix — would be a scope expansion.

**Taken, without expanding the scope**: the new module re-derives the ordered, de-duplicated
predicate list with the same first-seen scan (`BORDER_AXES` order, rules in order, structural
equality of `when` by its JSON), imports `BORDER_AXES` from `borderOverrides.ts` so the axis order
has one home, and formats the winner with the same `formatPredicate`. The duplicated scan is then
pinned by an **executed** equivalence test: on a fixture with divergent axes, the derived
predicates rendered through `formatPredicate` deep-equal `borderOverrideRows(border).rows.map(r =>
r.whenText)`. If the grouping ever changes on one side, that test goes red.

The one-optional-field alternative is better and is offered to Alfonso in the closing report; it is
not taken unilaterally.

## 6. What Fase 2 rests on

- vertex → object: `idlookup[vertexId].model`, one field, guarded on `typeof === 'string'`.
- instance name: `ReadCtx.getName(objectId)`, falling back to `#N` only on `null` / `''`.
- `ReadCtx`: `makeReadCtx(store.getState().idlookup)` inside a memo; the subscription is a joined
  primitive signature over the resolved objectIds, never `idlookup` itself.
- the pure helper stays out of the `joiner` barrel, so the bench can execute it.

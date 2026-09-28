# Discovery — the two preconditions of Fase 2 (edge and row entries in the v2 menu)

Date: 2026-09-16
Prompt: `docs/prompts/claude_2026-09-16_1115_prompt_rotta_archi_righe_decisioni.md`, Fase 2
Branch: `validation-skeleton`, HEAD `2bd474c43` (Fase 1 committed in `ca3fdaa99`)
Read-only: no file under `frontend/src` was modified. **No code was written: precondition 1 fails.**
Probe: `frontend/scripts/smoke/_tmp_refrow_dispatch.ts` (gitignored), run against the live dev server.

## Verdict

| Precondition | Outcome |
|---|---|
| 2. What `appliableTo` becomes for an edge view and for a row view | **PASSES** — an established mapping exists, nothing to invent |
| 1. Does a plain reference row dispatch `CHILD_CONTEXT_MENU`? | **FAILS** — there is no plain reference row at all; only the cross-metamodel ghost chip dispatches |

Per the prompt, the host decision was taken on the assumption that a reference row exists in the
class node, so **it has to be retaken**. Fase 2 is not started.

## 1. Precondition 2 — `appliableTo` (passes)

`newDefault` does not write the field directly: it derives it from the seed's kind, with the mapping
ratified on 2026-08-16 (`view/viewElement/view.tsx:181-188`):

```ts
function appliableToForIRKind(kind: unknown): DViewElement['appliableTo'] | undefined {
    switch (kind) {
        case 'vertex': return 'Vertex';
        case 'edge': return 'Edge';
        case 'row': return 'Field';
        default: return undefined;
    }
}
```

applied inside the `new2` callback at `:514-517`, next to the seed:

```ts
if (seed) {
    (d as any).ir = seed;
    const derived = appliableToForIRKind(seed.kind);
    if (derived) d.appliableTo = derived;
}
```

So: a `DReference` view → `ir.kind === 'edge'` → **`appliableTo: 'Edge'`**; a `DAttribute` view →
`ir.kind === 'row'` → **`appliableTo: 'Field'`** (the comment at `:175-177` explains `Field` as the
closest legacy analogue: an IR row is a compartment row). Whoever writes the two branches of
`createViewInWorkbench` reuses exactly this, as the prompt requires.

## 2. Precondition 1 — the reference row does not exist (fails)

### What the source says

`ClassNode.tsx` renders references **only** as cross-metamodel ghost targets (`:542` «Ghost targets:
cross-metamodel references drawn as in-node …»), and reads `data.references` only to type the chip
(`:608-612`). There is no per-reference row in the node body: the body renders attributes (`:747+`)
and operations (`:830+`), and nothing else.

### What the live app does (measured)

Fixture: metamodel `RefA` with class `State`, attribute `age`, a **same-metamodel** reference
`next: State → State`, and a **cross-metamodel** reference `toOther: State → Other` of metamodel
`RefB`. The attribute row is the positive control.

| Gesture | `CHILD_CONTEXT_MENU` dispatched | Detail | Menu that opened |
|---|---|---|---|
| right-click the attribute row `age` (**control**) | **1** | `{childKind: 'attr', childId: …USER_19}` | «Delete Attribute», «Help» |
| right-click the ghost chip `toOther` | **1** | `{childKind: 'ref', childId: …USER_22}` | «Delete reference» |
| right-click the `next` edge | **0** | — | «Convert to Inheritance», «Delete reference» |

Node anatomy at that moment, read from the DOM:

```
fieldRows:   ["age:EString"]
ghostChips:  ["OtherRefB"]
nodeText:    "toOther 0..1OtherRefBStateage:EString"
«next» as a row inside the node: found = false
edges on the canvas: 1
```

`next` is not in the node in any form: it is the single edge on the canvas. The control fired, so the
silence on `next` is a measurement and not a broken probe.

### Consequence

The `ref` branch of the v2 child menu is fed by the ghost chip alone, i.e. by
**cross-metamodel references only**. An entry added there would be invisible for every
same-metamodel reference, which is the ordinary case.

## 3. Facts that bear on the retake (no proposal)

- **The reference edge menu is reachable and already per-reference.** The branch
  `if (contextMenu?.edgeId)` in `EditorV2.tsx` (≈`:3357-3374`) opens on a plain reference edge —
  measured above — and offers «Convert to Inheritance» and «Delete reference». It holds the
  reference identity: `ReferenceEdgeData.reference` is a `MetaReference` (`types.ts:172-182`) whose
  `id` is the DReference id (`types.ts:85-95`).
- **The attribute half is unaffected.** The row entry would be reachable today through the `attr`
  branch, which the control proves alive. Caveat on notations: the attribute rows exist only when
  `notation !== 'er'` and the body is shown (`notation !== 'compact'`, `ClassNode.tsx:442-446`); in
  `er` the attributes are one joined string (`:739-745`) with no per-row handler, so the entry would
  be unreachable in that notation.
- **The creator gap of Fase B is unchanged**: `createViewInWorkbench` still has no `DAttribute` /
  `DReference` branch, and `newDefault` still resolves its own viewpoint.

## 4. Open questions for Alfonso

1. **Where does the edge entry go**, now that «the reference row» is not a thing: the edge context
   menu (reachable, holds the DReference id, already the place where a reference is deleted), the
   ghost chip alone (cross-metamodel only), or back to the tree rows?
2. **Does the row entry proceed on its own** in the `attr` branch, with the ER/compact notation
   caveat declared, or does it wait so the two land together?
3. Whether the two branches of `createViewInWorkbench` should be written now regardless, since both
   candidate hosts need them.

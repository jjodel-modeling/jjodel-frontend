# Layer Impact Report: expression fold, slice S1 of R-EXP-14

Prompt: P-2026-11-08-2345. Worktree `~/jjodel-w-exprcat`, branch `expression-catalog`. Written before the code (CLAUDE.md §3.2,
rule 19). Decisions: R-EXP-1..14. Report: `docs/discovery/discovery_2026-11-08_expression_catalog.md` §2.3, §3, §5.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)            one bag key written by a user gesture, see below; no creator, no sync write
  [ ] L-layer (computed proxies)          read only
  [x] JjOM (model entities)               `_state.exprBinding` on the metamodel, `_state.exprFold` on a viewpoint
  [x] Canvas v2-flow (ReactFlow nodes/edges)  folded objects get `hidden: true` through the existing pass
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)      untouched
  [x] Persistence (VersionFixer / jsxString)  bag keys only; no VersionFixer step, no jsxString
```

## For each touched layer

**JjOM, the two bag keys.**
- What changes: the metamodel gains the `_state` key `exprBinding`, a JSON string `{"v":1,...}`, written only by the «Import binding» gesture
  through `lmm.state = {exprBinding}`, the merging setter that `SimRolesModal.tsx:670` uses. A viewpoint created by «Derive fold viewpoint» carries
  `_state.exprFold = true`, set in the `newVP` callback before persist, as `createDerivedViewpoint` sets `_state` (R-VP-21).
- What does NOT change: DClass, DAttribute, DReference, DObject, DValue. No `SetFieldAction` in new code, no `DVertex.new`, no `DVoidEdge.new2/new3`.
- Cross-layer interaction: the key is not a `sim*` key, so `runSignature` does not fold it and a run is not interrupted.
- Side-effect safety: an unknown version is refused and unknown keys survive encode (R-EXP-3); a project without the key behaves as before.

**Canvas v2-flow, the hide.**
- What changes: `useIRContainment` unions one more set into `hidden`. The set is the objects under a declared slot, closed downward along compositions (R-EXP-5),
  only when the viewpoint carries `exprFold`. `decorateNodes` and `decorateEdges` are not changed; an edge whose end is folded is suppressed by their existing rule.
- What does NOT change: the vertex and edge records stay (R-EXP-10). `autoLayoutOnOpen` still counts every object. No node or edge is removed.
- Cross-layer interaction: `useIRContainment` needs an IR view in the viewpoint, so the derived viewpoint has one per owner class. With no `exprFold` the new set is
  empty before any model walk, and the gate at `useIRContainment.ts:198` reads as it did.
- Side-effect safety: `decoration`'s memo gains one dep, a string that is `''` when the viewpoint has no `exprFold`.

**IR, the text.**
- What changes: `TextSource` gains `{from:'expression', slot, caption?}` (R-EXP-13). `ReadCtx` gains the optional `getExpressionText` (rule 11). `objectSnapshotParts` appends the owner's expression text, because the memo signature covers only the object's own slots and a formula reads a subtree (report §2.3).
- What does NOT change: `path`, `literal` and `intrinsic` compile to what they compiled to; a snapshot of an object with no bound metamodel is byte-identical.
- Cross-layer interaction: the text is computed once per `idlookup` and read from a map (R-EXP-7); render never prints.
- Side-effect safety: a missing or invalid binding yields an empty set and empty text, and authoring states the reason (R-EXP-12).

**Persistence.** Both keys live in `_state`, which save and load carry unchanged, as `ontoBindings` (`bindingCodec.ts:15`). No VersionFixer step. Rule 14 is not engaged:
`DV.tsx` and `defaultViewTemplate.ts` are not touched.

## Trigger check (CLAUDE.md §3.2)

Not touched: `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`. No `DVertex.new`, `DVoidEdge.new2`,
`DVoidEdge.new3`, no `SetFieldAction` near sync. New D-layer creators: `DViewPoint.newVP` and `DViewElement.new2`, bare, as `createDerivedViewpoint`, no outer TRANSACTION (rule 12).
Touched from §3.1: `viewpoint/ir/` and `viewpoint/authoring/`, under the prompt's go-ahead.

## Files (rule 19)

New, pure, under `frontend/src/model/expression/`:

| File | What |
|---|---|
| `exprBinding.ts` | Types, decode and encode of `exprBinding` (R-EXP-3), the name-to-id resolution of a binding file, the check against the metamodel. |
| `exprPrinter.ts` | The printer: roles, precedence climbing, `parens`, per-row override, sharing names (R-EXP-2, R-EXP-6). |
| `exprBatch.ts` | The fold set and the slot text of a model in one pass, memoised on D-record identity (R-EXP-5, R-EXP-7), and the fold status (R-EXP-12). |
| `exprFoldViews.ts` | The IR documents of the fold viewpoint, one per owner class. |
| `bindings/brief.exprBinding.json` | The Brief binding, by name (R-EXP-13). |
| `__tests__/exprBinding.test.ts` | Codec: unknown version refused, unknown keys preserved. |
| `__tests__/exprPrinter.test.ts` | Printer: precedence, `parens`, override, sharing. |
| `__tests__/exprGolden.test.ts` | The 246 slots of `ddr4_closed_v` against `brief_view.py`, byte for byte (R-EXP-8). |
| `__tests__/fixtures/ddr4_closed_v.model.json` | Input of the golden test: Brief metamodel and kernel model. |
| `__tests__/fixtures/ddr4_closed_v.brief.txt` | Expected output of `brief_view.py`. |
| `__tests__/fixtures/gen_fixture.py` | How the two fixtures were made. |

Modified:

| File | What |
|---|---|
| `components/editor-v2/viewpoint/ir/irTypes.ts` | `TextSource` member; `CompiledLabel.expression?`. |
| `components/editor-v2/viewpoint/ir/irValidate.ts` | The new kind in `TEXT_SOURCE_KINDS` and in the source checks. |
| `components/editor-v2/viewpoint/ir/irCompile.ts` | The handlers of the new kind. |
| `components/editor-v2/viewpoint/ir/irReadCtx.ts` | Optional `getExpressionText`, injected into the draw backend. |
| `components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` | Injects it. |
| `components/editor-v2/viewpoint/ir/irResolveCore.ts` | The expression term of `objectSnapshotParts`. |
| `components/editor-v2/viewpoint/ir/useIRContainment.ts` | The fold set in `hidden`, one memo dep. |
| `components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | The expression label: wrapped, monospace, clamped, «show all». |
| `components/editor-v2/viewpoint/ir/irStyle.ts` | Its CSS. |
| `components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx` | The kind in the source select, a slot input. |
| `components/editor-v2/sim/DeriveViewpointDialog.tsx` | Status of the binding, «Import binding», «Derive fold viewpoint». |
| `utils/deriveViewpoint.ts` | `createExprFoldViewpoint`, `importExprBinding`. |

Existing tests are edited only if a pinned message lists the source kinds; any such edit is reported in the closing diff.

## Smoke-test scenarios potentially affected

- Open an existing project with an IR viewpoint: views render, labels unchanged (no `exprFold`, no binding).
- `bpmn-lanes` probe 12/12: containment, rows, lifted edges unchanged.
- Save and reopen with a binding: `_state.exprBinding` and `_state.exprFold` come back, the fold reapplies.
- Import `Brief.ecore` and `ddr4_closed_v.xmi`, bind, fold, Auto layout: 249 nodes, 248 edges, formulae in the owners, edit a constant and the owner's text follows.
- Metamodel with a broken binding: objects stay nodes, the dialog says why.

Propagation is not uncertain on the layers above; the one measured unknown is the open time with hidden nodes, recorded by the probe.

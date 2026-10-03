# Layer Impact Report: `node.[x]` read by IR views (R-SIM-108, interpreter side)

- Prompt-ID: `P-2026-10-03-0121` (chat `C-2026-10-02-2340`), Phase 2 of `P-2026-10-02-2345`
- Tree: `~/jjodel-w-simnoderead`, branch `sim-node-read`, HEAD `98c0ec37c` at the start
- Go-ahead: `lane-run --critical-zone-goahead P-2026-10-03-0121` (RC-30); `JJODEL_CRITICAL_ZONE_GOAHEAD` read in the
  session as `P-2026-10-03-0121`
- Source: `docs/discovery/discovery_2026-10-02_sim_node_presentation.md` §5 and §6, read at `8bd04b0c4` on
  `sim-node-disc`: that branch is not merged into `alfonso-frontend-jjtl`, so the report is not in this tree
- Why critical zone: Alfonso, 2026-10-03, «go» on the report's decision 2: `editor-v2/viewpoint/ir/` counts as a
  critical-zone edit, as R-MK-9 did

Committed before the first code edit, as RC-30 and the prompt ask. The report's §5 covered six code files; the engine
reader `presentationOf` (`netStep.ts`) and the run-state reader `getSimPresentation` (`simRunState.ts`) landed with Lane
A (`sim-state-model`, P-2026-10-03-0040). This lane consumes them and edits neither.

## 1. Files (rule 19: four code files and two test files, all in the prompt's DOVE)

| File | Change |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` | `presentationAttrOf(expr): string \| null`, through `parseExpressionStrict` and `STATE_RESERVED.presentationRoot` |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | `compilePath` compiles a recognized expression to a `getPresentation` read and declares `'mark'`; endpoints and `isKind.path` refuse it |
| `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` | `ReadCtx.getPresentation?(elementId, attr)`, optional; `makeDrawReadCtx` takes it injected beside `isMarked` |
| `frontend/src/components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` | `makeReadCtx` injects `getSimPresentation` in both backends |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/pathExpr.test.ts` | the 18-input corpus against the JjEL parser |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irPresentation.test.ts` (new) | compile cases, byte-identical views without `node.[x]`, refusals, the consumer test |

## 2. Report

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] IR compiler (pathExpr.ts, irCompile.ts)
  [x] Interpreter ReadCtx (irReadCtx.ts, irReadCtxLproxy.ts)
  [ ] Engine (netStep.ts), run state (simRunState.ts): read, not edited
```

- **IR compiler:**
  - What changes:
    - `presentationAttrOf(expr): string | null` in `pathExpr.ts`: the attribute when the JjEL parser, strict, reads
      `expr` as a `StateAccess` whose object is the identifier `STATE_RESERVED.presentationRoot`; otherwise `null`,
      never a throw. The IR accepts exactly what the engine accepts (report §2.1: a regex disagreed on 2 of 18).
    - In `compilePath`, a recognized expression compiles to `(ctx, id) => ctx.getPresentation?.(id, attr)`, with
      `featureNames` `[]`, no cross path, and `channelSink?.add('mark')`. Every surface that goes through
      `compilePath` reads it: node labels, `exists`, `empty`, comparisons, edge `center` and `template`, end labels,
      row segments.
    - Edge endpoints (`compileExpr` in `compileEdgeView`) refuse it with a message of their own.
  - What does NOT change:
    - `parsePathExpr`, `STEP_RE`, `FORBIDDEN_PATH`, `singleHopOf`: a `node.[x]` string still throws there, so
      `marked.path` keeps today's error, and `labelPathFeature` stays `null` (a `node.[x]` label is not editable).
    - `isKind.path` keeps today's error: its operand is compiled without the presentation branch.
    - The compiled shape of a view without `node.[x]`: `channels` absent, `dependencySet` and `crossPaths` as
      before, `irHash` and the cache key unchanged (the IR is not touched, the hash is of the IR).
    - No union member (R-J7, R-MK-1): `PathExpr` stays a string, `Predicate` and `TextSource` keep their members.
  - Cross-layer interaction: the channel `'mark'` is the one `marked` declares; `irResolveCore` already unions
    `channels` into `channelsInUse`, and the four resolvers already gate on it (`irResolve.ts` twice,
    `useIRContainment.ts`, `useIRFormView.ts`). None of them changes.
  - Side-effect safety: a presentation read adds nothing to `deps`, so `irCrossDeps` never concretizes it.
- **Interpreter ReadCtx:**
  - What changes: `getPresentation?(elementId, attr): unknown`, optional (rule 11). `makeDrawReadCtx(idlookup,
    isMarked, getPresentation)`, the third parameter defaulting to `undefined`, so a direct draw construction (the
    tests) reads `undefined`. `makeReadCtx` injects `getSimPresentation` in the draw backend and, through it, in the
    lproxy one, as it does `isSimActive`.
  - What does NOT change: `irReadCtx.ts` keeps zero imports (R-MK-4); the six call sites of `makeReadCtx`; every
    other method of `ReadCtx`.
  - Cross-layer interaction: `getSimPresentation` reads the shown configuration of the first run that knows the
    element (Lane A), outside Redux. Views never write it (R-SIM-6, R-SIM-18).
  - Side-effect safety: the reader does not bump; a read is a map lookup (report §2.5: 8.8 ns).
- **Absent value:** no run, Stop, another model's element, an attribute without `initial`: `undefined`. A label
  draws `''`, an edge template drops its caption, `exists` is false, a comparison is false. The default is the
  view's own `else`/`default` (report §2.3).
- **Persistence:** PathExpr stays a string and nothing of the run persists. A saved view with `node.[x]`, opened by
  a build without this lane, drops at compile with a warning (`irResolveCore` catch). R-B9: IR views have no
  VersionFixer.
- **Critical-zone files of §3.2:** none of `useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`,
  `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, nor the D-layer write paths.

## 3. Smoke scenarios potentially affected

- The four demo scenes on the default viewpoint: identical, no view reads `node.[x]`.
- A derived viewpoint with `marked`: unchanged.
- The report's probe, scene C rewritten on `node.[x]` (port 3070): the same counts as C, a label showing the
  stand-in value.
- Save, reopen: identical.

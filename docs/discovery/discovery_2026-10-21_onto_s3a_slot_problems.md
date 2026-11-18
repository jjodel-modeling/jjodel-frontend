# Discovery — S3a: missing and orphan slots as problems, «Sync slots» (Phase 1)

- Prompt-ID: P-2026-10-21-1405 (chat C-2026-10-21-1405, front `instance-of`, lane full)
- Prompt file: none (the chat has no shareable URL; Alfonso's words are kept with `--request`)
- Session id: not exposed to the session (`CLAUDE_SESSION_ID` unset)
- Tree: `~/jjodel-w-oi-s3a`, branch `oi-s3a`, HEAD `53834b0b2` (clean at start)
- Executor model: Opus 5.5 (`claude-opus-5-5`), effort xhigh
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

Tags: **[R]** read in a file at HEAD `53834b0b2`; **[M]** measured in this phase on the same HEAD.

## Objective

Plan S3a of the plan `discovery_2026-10-20_ontological_instantiation.md` §8: missing slots, orphan slots, O3 (two
slots for one feature) and O5 (a value of the wrong type) as live problems in the registry, never blocking a write;
a «Sync slots» action that creates only the missing slots in one undo entry. Answer Q1-Q6 of the prompt, give the Layer
Impact Report for `problems/` and the mount in `EditorV2.tsx`, and the Phase 2 oracle.

## Hypotheses under test, with verdicts

1. **H1 — S3a can write beside the existing producers without touching them, ValidationPill or the model-level drop.**
   Holds. The registry is kind-agnostic for every consumer; no consumer switches on `kind` exhaustively (Q1).
2. **H2 — missing and orphan come from the S1 reader as is; O3 and O5 need a new pure module, and no change to the S1
   reader's exported interface.** Holds. `slotDiff` gives missing and orphan; a duplicate slot is counted as *covered*,
   so O3 is not in it [M]; O5 needs the value kinds, which `instantiate.ts` already reads (Q2). No hard stop.
3. **H3 — the detection costs a few ms at 200 instances.** Holds [M]: 3.9 ms detect, 2.4 ms signature (Q2).
4. **H4 — «Sync slots» is one undo entry with the S2u group as it is.** Holds [R]: the group takes every write of the
   opening sender, whatever its kind (`reducer.ts:1283`), and «Sync slots» writes through the same `createInstance` path
   as S2. Bounded by the 10 s cap (Q3). No hard stop.
5. **H5 — no write path refuses the write that makes an O3 or O5.** Holds [R] for the paths read: the only refusals
   are linguistic (Q4).
6. **H6 — deleting the Property `isbn` leaves dune's slot in place.** Not settled. The reader tolerates both outcomes
   of a dangling pointer, but whether the D-layer delete cascades into the slot was not measured here (Q2, risk R1).

## Files read (full paths, windows)

- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/problems/registry.ts` (whole, 323 lines)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/problems/NodeProblemOverlay.tsx` (100-242)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/problems/ConformanceProblemSync.tsx` (whole)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/problems/conformanceToProblems.ts` (whole)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` (100-279)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/model/ontological/bindingReader.ts` (whole)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/model/ontological/bindingCodec.ts` (1-80)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/hooks/instantiate.ts` (52-589, the read and write halves; header 1-44 by grep)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts` (1-106, the `uml()` builder)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/hooks/createAdapter.ts` (499-552)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/model/logicWrapper/LModelElement.tsx` (6730-6769, 7277-7356; greps only otherwise)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/model/conformance/useConformance.ts` (28-82)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/redux/reducer/reducer.ts` (543-558, 1165-1216, 1278-1300; greps otherwise)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/src/components/editor-v2/EditorV2.tsx` (3340-3375; greps for the mount and the S2 entries)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/scripts/probe/uml-class-object-fixture.ts` (560-599, 855-874; greps)
- `/Users/alfonso/jjodel-w-oi-s3a/frontend/scripts/probe/onto-s2-instantiate.ts` (1-40)
- `/Users/alfonso/jjodel-w-oi-s3a/docs/discovery/discovery_2026-10-20_ontological_instantiation.md` (303-372, 447-577)
- `/Users/alfonso/jjodel-w-oi-s3a/docs/log-inbox/instance-of.md` (120-124)

Throwaway bench, deleted before the commit: `frontend/src/components/editor-v2/problems/__tests__/_tmp_s3a_bench.test.ts`
(the `uml()` builder of `instantiate.test.ts` copied, plus a prototype detector), run through
`node scripts/run-quiet.mjs s3a-bench -- npx vitest run <file>`, exit 0, log `.agent-logs/s3a-bench-20261021-152700.log`.

## Q1 — The registry today [R]

- **Kinds.** `export type NodeProblemKind = 'duplicate-name' | 'conformance' | 'validation' | 'classifier-kind' | 'simulation' | 'containment';`
  (`registry.ts:55`). S3a needs one more member; a union widening, priced and authorized by name in the Phase 2 prompt
  as the three before it (`registry.ts:29-53`).
- **Record.** `id, nodeId, kind, severity, title, description, relatedNodeIds, action?, conformance?, ownerModelId?,
  createdAt, resolvedAt?` (`registry.ts:88-131`). The registry does not enforce an id format (`registry.ts:12-18`).
- **Target.** `nodeId` only; the producer chooses the id space. Conformance registers twice, the DObject id for the
  tree and the resolved DVertex id for the canvas: «each violated object registers up to two entries»
  (`ConformanceProblemSync.tsx:13-15`, `:95-101`, resolver `vertexResolver.ts:58`). There is no viewpoint target.
- **Action.** `export interface NodeProblemAction { label: string; type: 'focus-node' | 'scroll-to-node' | 'custom'; targetNodeId?: string; }`
  (`registry.ts:57-61`). No `run`. The overlay: `const onAction = (p: NodeProblem) => { if (!p.action?.targetNodeId) return;`
  (`NodeProblemOverlay.tsx:158-159`), so a `'custom'` action with no target does nothing. The button renders when
  `p.action && !isResolved && actionLabel` (`:226`), the label is `p.action.label` unless a target is off-screen (`:194-198`).
  A `run?: () => void` on `NodeProblemAction` is an optional property (rule 11) plus one branch in `onAction`.
- **Rendering.** One block per problem: title, then the conformance rows or `p.description`, then the action button
  (`NodeProblemOverlay.tsx:191-235`). Only `kind === 'conformance'` is special-cased (`:193`).
- **Writers and clearing.** Producers call `registerProblem` / `markResolved` / `clearProblem`; a resolved entry is
  removed 5 s later (`registry.ts:20-24`, `:133`, `:179-187`). Revoke by owner: `getProblemIdsOwnedBy(kind, ownerModelId)`
  (`registry.ts:290`), used by `UniquenessProblemSync.tsx:184`, `:232`. Unmount clear: `ConformanceProblemSync.tsx:121-125`.
  Session-local, not Redux, «immune to undo/redo and not persisted» (`registry.ts:8-10`).
- **Mounts.** `EditorV2.tsx:4958-4961`: `UniquenessProblemSync`, `ConformanceProblemSync`, `SimCheckProblemSync`,
  `ValidationFreshnessSync`.
- **Consumers are kind-agnostic.** `useNodeProblems(` is read at `NodeProblemIndicator.tsx:19`, `IRForm.tsx:426`,
  `TreeViewContent.tsx:1093`, `InstanceDetail.tsx:362`; the indicator is drawn on IR nodes too
  (`ObjectNode.tsx:961-962`, before `<IRNodeContent`). `formDiagnostics.ts:95`: «Any other kind, `duplicate-name` today,
  is one unit with no field to attach to.» Search for a switch on kind: `command grep -rn ".kind === '(…six kinds…)'|NodeProblemKind"`
  over `src`, tests excluded: three hits, the only comparison is `NodeProblemOverlay.tsx:193` (positive control: that hit).
- **ValidationPill.** Unmounted: `// TODO: cleanup — ValidationPill is no longer rendered here (2026-08-26).`
  (`Toolbar.tsx:31`, also `:1155-1158`). S3a does not need it: its problems are per instance.
- **Model-level drop.** `if (!v.objectId || v.objectId === result.modelId) continue;` (`conformanceToProblems.ts:43`).
  It drops linguistic violations with no object; S3a produces none such (every finding has an instance), and it is the
  linguistic check, not the ontological one. S3a writes beside both, depends on neither.

## Q2 — Detection

**What the S1 reader gives [R].** `slotDiff(view, binding, instanceId)` returns `missing` (closure features with no
slot, closure order) and `orphans` (`{ slot, feature }`, `feature` `null` when the slot has none)
(`bindingReader.ts:154-170`). A slot is orphan when `feature === null || !inClosure.has(feature)` (`:166-167`). The
store adapter drops dangling ids: `.filter(isId).filter(t => get(t) !== undefined)` (`instantiate.ts:76`), so a
`definingFeature` pointing at a deleted Property reads as `null` and the slot is an orphan whether the delete clears the
pointer or leaves it dangling.

**What it does not give [M].** A second slot for an already-covered feature lands in `covered` again and is neither
orphan nor missing (`bindingReader.ts:166`); the prototype confirmed it: the duplicate `title` slot produced only the
`O3` finding. O5 needs the record's `valueKinds` and the type name: `valueKindFor` (`instantiate.ts:223-234`) is
private today.

**Shape.** A pure module `problems/instantiationToProblems.ts`, the convention of `conformanceToProblems.ts` and
`containmentToProblems.ts`, over `DGet` + `ontoReadView` (`instantiate.ts:52`, `:69`), importing the read half of
`instantiate.ts` (already vitest-safe: it imports the joiner only by dynamic `import()`, `instantiate.ts:11-12`, `:498-506`)
and `recordFor`, `slotDiff` from `bindingReader.ts`. Per instance of `modelObjectIds` whose `recordFor` is the
`object` record:
- missing: `slotDiff(...).missing`;
- orphan: `slotDiff(...).orphans`;
- O3: the second and later slot whose `definingFeature` is a feature already seen on the instance;
- O5: for each value of a slot whose feature has a type (`featureType`): only values whose metaclass is the `create`
  of one of the record's `valueKinds` are judged (so a `LiteralNull` is not, matching the fixture's
  `if (vc === 'LiteralNull') continue;`, `uml-class-object-fixture.ts:589`). A `primitive:<Type>` kind requires that
  metaclass; otherwise the `instance` kind requires an `InstanceValue` whose instance is classified by the type or a
  descendant over the record's generalization;
- cycles: `slotDiff(...).cycles`.
Links (`link` record) and enumeration literals (no record, R-OI-8, `bindingReader.ts:9-13`) are not judged in S3a;
O6 goes with S4 (plan §8).

**The S1 interface stays as is.** The «type or a descendant» walk for class-typed values needs the classifier's
ancestors; `generalsOf` is private (`bindingReader.ts:113`). The new module walks them itself over the same roles
(about ten lines). Decision taken below (D3); adding an export to `bindingReader.ts` is the alternative, and it would
add, not change, an exported symbol.

**Prototype [M].** On the `uml()` builder of `instantiate.test.ts:12-100` with dune (Book, 4 slots, 4 values), alice
(Member) and cityLib (Library): clean → `[]`. Then isbn removed, `pages : Integer` added to Book, a duplicate `title`
slot and a `LiteralString` beside dune's year:
```
[s3a] seeded [{"instance":"dune","kind":"missing","detail":"p_Book_pages"},{"instance":"dune","kind":"orphan","detail":"dune_s_p_Book_isbn:null"},{"instance":"dune","kind":"O5","detail":"p_Publication_year holds LiteralString"},{"instance":"dune","kind":"O3","detail":"p_Publication_title"}]
```

**Dependencies and trigger.** The detector reads: every M1 DObject (`instanceof`, `features`), every DValue's `values`
(slots, defining features, values, classifier pointers, `ownedAttributes`, generalizations), and the metamodel's
`_state.ontoBindings` (`instantiate.ts:98-103`). Every one of these is an M1 DValue change or the bag; the
conformance signature already walks the same set (`useConformance.ts:57-63`: `o${id}=…`, `v${id}=JSON(values)`) and
debounces 500 ms (`useConformance.ts:8`, `:79-112`). The producer: a `useSelector` signature of own (not pending)
DObject ids and DValue values plus the bag string, skipping pending creates as `UniquenessProblemSync.tsx:243-249` does;
a 300 ms debounce; the effect runs the pure detector over `store.getState().idlookup` and diffs the registry by owner.

**Cost [M]** (prototype detector + a signature pass of the same shape, 30 runs after 5 warm-ups, vitest node env):

| instances | idlookup keys | detect | signature |
|---|---|---|---|
| 4 (library) | 194 | 0.37 ms | 0.14 ms |
| 200 | 3653 | 3.89 ms | 2.42 ms |
| 1000 | 17790 | 26.37 ms | 16.36 ms |

**Budget.** At 200 instances: detect ≤ 10 ms per debounced run, signature ≤ 5 ms per dispatch. The signature runs on
every dispatch, like the conformance one: that is the real cost, and at 1000 instances two such selectors are ~33 ms
per dispatch. If a model that size is a target, the S3a selector should reuse a narrower signature (DValues of
`slotContainer`/`definingFeature`/`valueHolder`/`featureContainer` instances only); not needed for the library.

**In-flight instantiation.** An S2 instantiation and a «Sync slots» run for seconds and create slots one at a time
(`instantiate.ts:564-588`). A debounced run in the middle would flash a missing-slot problem, then a 5 s green
«Resolved». The producer defers while an instantiation is in flight and re-checks on a timer, since the end of a group
is not a store change. Decision D5 below.

## Q3 — «Sync slots»

- **What it creates.** For one instance: one slot per `slotDiff(...).missing` feature, in closure order, each with
  the default value `plannedValue` gives (`instantiate.ts:237-255`). Nothing else: orphans and duplicates are left
  alone (R-OI-9). The plan is pure (`syncSlotsPlan`, tested); the write reuses the slot loop of `synthesize`
  (`instantiate.ts:564-587`), extracted into a function both call, so S2 keeps its behaviour.
- **One undo entry [R].** `beginUndoGroup` opens a group for `DUser.current` (`reducer.ts:1188-1192`); every write
  of that sender joins: `if (openUndoGroup && openUndoGroup.sender === action.sender && U.userHasInteracted && …)`
  (`reducer.ts:1283`), the first pushes one entry and «the next ones rewrite that entry exactly» (`:1284-1289`).
  «Sync slots» uses `createInstance` (`createAdapter.ts:520-532`, `slot.addObject`), the S2 path, and waits with
  `seedLanded` (`instantiate.ts:370-377`) before `endUndoGroup`. No reducer change. Limit: `UNDO_GROUP_MAX_MS = 10000`
  (`reducer.ts:1165`), closed by `cap` at `:1282`; a sync of a handful of slots is well inside it (S2 makes four slots
  and values in one group); the probe records the duration.
- **Order.** The new slots are appended to the instance's list, not inserted at their closure position: dune after
  the acceptance reads `isbn(orphan), genre, title, year, pages`. A reorder write is possible and not worth it now.
- **Node box.** S2 gives the instance a manual box sized for its rows (`instantiate.ts:36-43`, `:453-494`); a fifth
  row would be clipped (the defect of ticket (b), `instance-of.md:74`). «Sync slots» grows the box, never shrinks it,
  with the same SetFieldAction-only TRANSACTION (rule 12), inside the group, awaited by `layoutLanded`. Decision D6.
- **Surfaces.** The missing-slot problem's action («Sync slots», `type: 'custom'`, `run`), and the instance node's
  context menu, beside «New instance» (`EditorV2.tsx:3356-3368`), shown when the instance has the `object` record,
  disabled with a tooltip when nothing is missing. Both call one function `syncSlots(instanceId)`.
- **Model-wide variant: not now.** 200 instances × one missing slot does not fit one group under the 10 s cap; it would
  need one entry per instance or a cap change (core). Recommended later, if asked.
- **Removing orphans: a later slice.** It deletes, needs a confirmation (R-OI-3, R-OI-9) and a delete path whose
  undo inside a group is exact; S3b is where orphan rows are drawn and the gesture belongs. Recommended: S3b or an S3c,
  not S3a (Question 2).

## Q4 — Never blocking [R]

- `createInstance` refuses only structurally: `metaclass "…" is not in this model`, `feature "…" is not on this
  object`, `model not found`, `the host created no instance`, or a caught exception (`createAdapter.ts:499`, `:529`,
  `:535`, `:541`, `:552`).
- `addObject` refuses only linguistically: a non-class schema (`LModelElement.tsx:7316-7318`) or one that does not
  extend the reference type: `if (isDValue && !lmetaclass.isExtending(this.get_type(c as Context) as LClass)) {`
  (`:7322-7325`). A second `Slot` in `slots : Slot [0..*]` and a `LiteralString` in `values : ValueSpecification [0..*]`
  (`uml-class-object-fixture.ts:76`, `:101`) both pass.
- No write path reads the bindings. `command grep -rln 'ontological/|bindingReader|bindingCheck|ontoBindings'` over
  `src` (`*.ts`, `*.tsx`): `EditorV2.tsx` (menus only, `:75-76`, `:3037`, `:3360`), `instantiate.ts`, and the
  `model/ontological` files and tests. Positive control: the hit list contains `bindingReader.ts` itself.
- The linguistic conformance runs after the fact, debounced (`useConformance.ts:79-112`); R-VAL rules run on command
  only (plan §3.5, `Toolbar.tsx:722-751` per that report).
- The fixture already makes both writes and keeps them: O5 by `s.$values.values = [a.v]` with a `LiteralString`
  (`uml-class-object-fixture.ts:860-863`), O3 measured as a finding of `runRules` (`:578`).

## Layer Impact Report (`problems/`, the mount in `EditorV2.tsx`, «Sync slots»)

```
LAYER IMPACT REPORT (Phase 1; owed again before any S3a diff)

Layers touched:
  [x] D-layer (Redux raw data)      — «Sync slots» only: new Slot and value objects through createInstance/addObject
                                       (the S2 path), and one SetFieldAction-only layout write on the instance's vertex
  [ ] L-layer (computed proxies)    — read through the existing proxies only (addObject); no proxy changed
  [ ] JjOM (model entities)
  [x] Canvas v2-flow                — the problem badge on the instance node (existing NodeProblemIndicator); the node
                                       box grown by «Sync slots»; child rows via the existing syncChildToFlow
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Undo history                  — used, not changed: one S2u group per «Sync slots»
  [x] Problems registry (session-local UI state, not Redux)

What changes:
  - registry.ts: NodeProblemKind gains 'instantiation'; NodeProblemAction gains run?: () => void (optional, rule 11).
  - NodeProblemOverlay.tsx: onAction calls action.run when present, then closes; the targetNodeId path unchanged.
  - new instantiationToProblems.ts (pure) and InstantiationProblemSync.tsx (producer, returns null).
  - EditorV2.tsx: one mount beside the four producers (:4958-4961); one node-menu entry beside «New instance».
  - instantiate.ts: syncSlots + syncSlotsPlan, the slot loop shared with synthesize, valueKindFor exported, an
    in-flight counter.
What does NOT change:
  - the six existing kinds and their producers; ConformanceProblemSync, UniquenessProblemSync, ValidationPill;
  - reducer.ts and the undo group; bindingReader.ts, bindingCodec.ts, bindingCheck.ts;
  - createAdapter.ts, addObject, every write guard; S2's instantiate output (slot order, boxes, one entry).
Cross-layer interaction:
  - the producer reads idlookup and writes only the registry, which is outside Redux: no action is dispatched, so no
    undo entry and no re-render loop through the store.
  - «Sync slots» writes the D-layer inside one group: one Cmd+Z removes the created slots and values, idlookup exact.
  - a missing slot that «Sync slots» creates turns the problem resolved on the next debounced run (markResolved).
Side-effect safety vs other layers:
  - a closure in the registry record (run) is session-local and never serialized (registry.ts:8-10).
  - the producer defers while an instantiation is in flight, so S2 shows no transient problem.
  - no creator inside an outer TRANSACTION (rule 12): createInstance opens its own; the layout write is
    SetFieldAction only.
CLAUDE.md 3.2 trigger files: none touched (useJjomSync.ts, syncState.ts, canvasToJjom.ts, portDistribution.ts,
  useM1ReferenceEdges.ts, VersionFixer.tsx); no DVertex.new / DVoidEdge.new2 / new3 literal is added.
Callers of the touched API: registerProblem/markResolved/clearProblem/getProblemIdsOwnedBy (five producers);
  useNodeProblems (NodeProblemIndicator, IRForm, TreeViewContent, InstanceDetail); NodeProblemOverlay (via the
  indicator only). None switches on kind exhaustively.
Risk: low for the registry and overlay (additive); medium for «Sync slots» (D-layer writes, group cap, node box).

Smoke-test scenarios potentially affected:
  - undo-inline-edit.ts cases unchanged (33/33 at 53834b0b2 per the S2u entry)
  - onto-s2-instantiate.ts unchanged (S2-0..S2-8, S2u); S2-6/S2-7 must see no S3a problem on a new instance
  - a model with no bindings: the producer registers nothing
  - existing problems (duplicate name, conformance) still render and their «Go to duplicate» still focuses
Uncertain about propagation? → R1 below.
```

## Phase 2 plan (rule 19: more than five files, confirmation asked)

| # | File | Change |
|---|---|---|
| 1 | `frontend/src/components/editor-v2/problems/registry.ts` | kind `'instantiation'`; `run?: () => void` on `NodeProblemAction` |
| 2 | `frontend/src/components/editor-v2/problems/NodeProblemOverlay.tsx` | `onAction`: `run` branch before the target check |
| 3 | `frontend/src/components/editor-v2/problems/instantiationToProblems.ts` (new) | pure detection: missing, orphan, O3, O5, cycles → findings |
| 4 | `frontend/src/components/editor-v2/problems/InstantiationProblemSync.tsx` (new) | producer: signature, debounce, in-flight deferral, dual anchors, revoke by owner, unmount clear |
| 5 | `frontend/src/components/editor-v2/EditorV2.tsx` | mount; node-menu «Sync slots» |
| 6 | `frontend/src/components/editor-v2/hooks/instantiate.ts` | `syncSlotsPlan`, `syncSlots`, shared slot loop, grow-only box, `valueKindFor` export, in-flight counter |
| 7 | `frontend/src/components/editor-v2/problems/__tests__/instantiationToProblems.test.ts` (new) | unit tests |
| 8 | `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts` | `syncSlotsPlan` tests |
| 9 | `frontend/scripts/probe/onto-s3a-slot-problems.ts` (new) | acceptance probe |
| 10 | `docs/discovery/assets/onto-s3a/` and `docs/log-inbox/instance-of.md` | assets, closing entry |

Problem records (one kind, `'instantiation'`; each also on the resolved DVertex id, as conformance does):
- `instantiation:missing:<instance>@<node>` — warning, «Missing slots», «No slot for pages», action «Sync slots»;
- `instantiation:orphan:<slot>@<node>` — error, «Orphan slot», «Its feature is gone» or «isbn is not a feature of
  Book»; also anchored on the slot id (tree, form);
- `instantiation:duplicate:<instance>:<feature>@<node>` — error, «Two slots for title»;
- `instantiation:value-type:<value>@<node>` — error, «year : Integer holds a LiteralString»;
- `instantiation:cycle:<sorted ids>@<classifier>` — error, on each classifier of the cycle (Question 3).

## Oracle for Phase 2

**Unit tests** (`instantiationToProblems.test.ts`, on the `uml()` builder):
1. clean library → no finding;
2. isbn deleted → dune: one orphan (feature `null`), no missing isbn;
3. pages added → dune: missing `pages`; Magazine instances unaffected;
4. a duplicate title slot → one O3, not an orphan, not two;
5. year holding a `LiteralString` → one O5; a `LiteralNull` → none;
6. genre holding an `InstanceValue` of `fiction` → none; of a Member instance → O5;
7. a link instance and an enumeration literal → never judged;
8. a cycle Publication ⇄ Book → reported once, the closure not followed.
`instantiate.test.ts`: `syncSlotsPlan` on dune with pages added gives exactly `[pages]` with its default; with
nothing missing gives `[]`; an orphan and a duplicate are not in it.

**Probe** `frontend/scripts/probe/onto-s3a-slot-problems.ts` (new, not an extension: `onto-s2-instantiate.ts` must stay
unchanged), the UML library imported as S2's probe does, bindings written as there:
- S3-0 baseline: no `instantiation:` id in `window._jjNodeProblems`;
- S3-1 delete Property isbn (class diagram): dune's isbn slot still in `idlookup`, an `instantiation:orphan:` entry on
  dune's object and vertex; DOM: the badge on dune's node;
- S3-2 «Add attribute» pages on Book: `instantiation:missing:` on dune, description names pages;
- S3-3 the overlay's «Sync slots»: one new Slot whose `definingFeature` is pages, no Slot or value deleted (id sets
  before/after), the missing entry resolved; dune's node holds five rows (DOM boxes);
- S3-4 one Cmd+Z: undo stack +1 then back, every created id gone from `idlookup`, the missing entry back;
- S3-5 the node menu «Sync slots» gives the same as S3-3;
- S3-6 a duplicate title slot (createInstance) and a LiteralString in year: both writes land (ids in `idlookup`) and
  both entries appear within 1 s;
- S3-7 page errors `[]`; then `undo-inline-edit.ts` and `onto-s2-instantiate.ts` run unchanged, all green.

**Mutation bench** (each must turn a test red):
- M1: O3 marks every slot as first seen (drop the seen-feature map) → test 4 red;
- M2: O5 judges against the slot's linguistic type (`ValueSpecification`) instead of the value kind → test 5 red;
- M3: `syncSlotsPlan` takes the whole closure instead of `missing` → the `syncSlotsPlan` test red (it would make O3);
- M4 (probe only): drop the `run` branch in `onAction` → S3-3 red.

## Dependencies and risks

- **R1 — delete cascade (not measured).** If deleting a Property also deletes the slots pointing at it, S3-1 cannot
  pass and R-OI-3 is broken by the core. The reader is safe either way (dangling ids read as `null`). Phase 2 runs S3-1
  first and stops with a question if the slot is gone.
- **R2 — group cap.** A sync longer than 10 s splits into two entries (`reducer.ts:1282`); the probe records the time.
- **R3 — signature cost on large models** (Q2 table); acceptable at the library and at 200 instances.
- **R4 — the shallow-merge ticket** (`instance-of.md:120`): a write outside the group, such as a late `pointedBy` sync
  after a pane click, may cost a second Cmd+Z; the probe focuses and waits for the store idle as S2's does.

## Decisions taken (unattended)

- D1 — one kind `'instantiation'` for all five findings, not five kinds; the finding is in the id and the title.
- D2 — severities follow the fixture's rules: missing a warning (`uml-class-object-fixture.ts:582`, `warn('O4'`),
  orphan, O3, O5 errors (`:577-578`, `:595`).
- D3 — `bindingReader.ts` untouched; the ancestor walk for class-typed O5 lives in the new module.
- D4 — S3a judges only instances whose most specific record is `object`; links are S4's.
- D5 — the producer defers while an S2 instantiation or a sync is in flight (a counter in `instantiate.ts`, not the
  reducer's `undoGroupState`, which its comment reserves for tests and the probe, `reducer.ts:1204`).
- D6 — «Sync slots» grows the instance's box inside the group, never shrinks it.
- D7 — new slots are appended, not reordered.

## Decisions awaiting Alfonso

1. Rule 19: confirm the ten-item file list of the Phase 2 plan. Recommended: yes.
2. Removing orphan slots: a later slice (S3b or S3c), confirmed action. Recommended: later, not S3a.
3. A cycle in the generalization: reported on each classifier of the cycle, as an error. Recommended: yes.
4. A model-wide «Sync slots»: not now. Recommended: not now.

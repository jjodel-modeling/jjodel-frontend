# Layer Impact Report: merge of `origin/staging` into the release 3.1 line (P-2026-10-12-0010, L1)

- Prompt-ID: `P-2026-10-12-0010` (chat `C-2026-10-11-1812`), front `release-3-2`, lane full (critical zone)
- Tree: `~/jjodel-w-rel31-staging`, branch `rel31-staging`, HEAD `5f25112c4` at the start
- Merged side: `origin/staging` at `cb595287622bed042ef3297930c6851a4ca62a88` after `git fetch origin` on 2026-10-12
  (unchanged since the 1812 report); merge base `799e9f50a`; 110 commits on the staging side, 547 on this side
- Go-ahead: RC-30, `--critical-zone-goahead P-2026-10-12-0010` (Alfonso, 2026-10-12 00:06)
- PR #184 (`staging-dam-merged`): still `OPEN`, `mergedAt: null` (M, `gh pr view 184`); not absorbed (NON FARE)
- Committed before the merge, as RC-30 and the prompt ask. Evidence for the 1812 analysis is not redone here.

## 0. Answer in brief

1. The merge changes one Persistence file and five IR-form files in the critical zone, all on the staging side only:
   this side has not touched any of them since the merge base, so the merge takes staging's text verbatim (§1).
2. **R1, the load purge against this side's graph code: no risk found (R).** Every graph creator on this side lists
   its record in the father's `subElements` (`joiner/classes.ts:1153`), every `subElements -=` deletes the record in
   the same transaction, and no vertex `model` or edge end is a synthetic id. The purge can remove only real ghosts.
   Verified after the merge by running the real function on every tracked `.jjodel` (§4).
3. **R2, `model.objects` now lists nested instances: one visual risk specific to this side (R).** Step 2bis of
   `useJjomSync` (shared, unchanged on both sides) gives every listed object a vertex at the next top-level grid
   cell. After the 2.230 migration, nested instances made by «Add» or `create ... in` gain a vertex there; under a
   graphVertex container (this side's R-GV) the hull or `self` frame stretches to reach it until Auto layout.
   Not a load error, not data loss. Measured in the probe and the fixture bench; recorded as a decision awaiting
   Alfonso, no code change in the merge (§3).
4. Text conflicts: `Jodie.tsx` (one import line each side), `defaultPrompts.ts` (both sides bumped the chat prompt to
   6 with different changelogs), `docs/decisions.md` (union). Clean but both-sided: `parser.ts`, `registry.ts`,
   `AISettingsContent.scss`.
5. Pre-merge baseline in this tree (M): typecheck 14 (the §17 set); vitest 8711 tests, 8707 passed, 4 failed
   (`criticalZone.test.ts`, the known ticket: `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-12-0010` leaks into the test;
   70/70 with it unset), 10 failed files = those plus the 9 known import reds.

## 1. Which critical-zone files the merge changes (M)

`git diff --stat HEAD origin/staging` intersected with CLAUDE.md §3.1 lists 42 files, but that diff runs both ways: it
also lists every critical-zone file this side changed since the merge base, which the merge does not touch. What the
merge brings is the staging side, `git diff 799e9f50a origin/staging`, 112 files. Its intersection with §3.1:

| file | §3.1 entry | staging | this side since `799e9f50a` |
|---|---|---|---|
| `frontend/src/redux/VersionFixer.tsx` | VersionFixer | +136 −0: step `2.229 -> 2.230` (#174, R-NEST-6) and `purgeDeadGraphElements` at every load (R-NEST-8) | none |
| `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` | `viewpoint/ir/` | +50 −5: optional `permissionOf` prop (#157 step B) | none |
| `.../viewpoint/ir/IRFormField.tsx` | `viewpoint/ir/` | +23 −3: optional `isLocked` prop | none |
| `.../viewpoint/ir/formPermissions.ts` | `viewpoint/ir/` | new, 116 lines, pure | none |
| `.../viewpoint/ir/formWrite.ts` | `viewpoint/ir/` | +31 −7: an append to a composition slot goes through `setValueAtPosition` (#182, R-NEST-9) | none |
| `.../viewpoint/ir/widgets/ListWidget.tsx` | `viewpoint/ir/` | +5 −2: optional `canRemove` | none |
| `.../viewpoint/ir/__tests__/formPermissions.test.ts` | `viewpoint/ir/` | new test | none |

Positive control of the intersection: `VersionFixer.tsx` is found by the same `command grep -E` over the same list (1).
No staging change to `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `sync/`, `portDistribution.ts`, `defaultViewTemplate.ts`,
`DV.tsx`, `viewpoint/authoring/`, `problems/`. Rule 14 does not fire (no default-view source changed).

Outside the §3.1 table but on the D/L layers, also staging-only (this side unchanged since the merge base):
`model/logicWrapper/LModelElement.tsx` (+44 −6: `DObject.listInModel`, `LModel.get_roots` filters by father,
`LValue.get_children_idlist` lists owned values, eviction appends to `objects`), `model/conformance/ConformanceValidator.ts`
(comment and visit perimeter), `editor-v2/hooks/deleteDraw.ts` (cascade rule), `joiner/environmentConfig.ts` (+34, additive).

Every file above is one-sided: the merge takes staging's text verbatim, so the risk is semantic (trunk code that meets
the new behaviour), not textual. Source files changed on both sides are five, none in §3.1: `Jodie.tsx`,
`defaultPrompts.ts` (text conflicts), `parser.ts`, `events/registry.ts`, `AISettingsContent.scss` (clean).

## 2. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data): model.objects lists nested instances (migration + creation); graph records purged at load
  [x] L-layer (computed proxies): LModel.roots filters by father; LValue children list owned values (delete cascade)
  [x] JjOM (model entities): an aggregation/containment append re-fathers through setValueAtPosition (#182)
  [x] Canvas v2-flow (ReactFlow nodes/edges): by data only (purged records are not painted)
  [ ] Canvas classic: by data only, same as v2-flow
  [ ] Sync layer (useJjomSync hooks): no code change on either side
  [x] Persistence (VersionFixer / jsxString): new step 2.229 -> 2.230; purge at every load; no jsxString change

Persistence / D-layer
  - What changes: a save at 2.229 or below runs 2.229 -> 2.230 (every DObject whose father chain reaches a DModel is
    appended to that model's objects, with its pointedBy, then objects is deduplicated); every load, at any version,
    runs purgeDeadGraphElements (ghost DVertex, unlisted DVertex/edge, edge with a dead end, what only they list).
    The format number becomes 2.230: saves written by 3.1 are 2.230, readable by beta, not by app (2.229).
  - What does NOT change: the 2.228 -> 2.229 step (byte-identical), every earlier step, jsxString, default views.
  - Cross-layer: the purge deletes graph records; every consumer that builds the canvas from subElements sees fewer
    records only if they were unlisted (see §3, risk R1). objects now lists nested instances; every consumer that
    read objects as roots sees more (risk R2).
  - Side-effect safety vs other layers: both functions are pure on the state, idempotent, run before LoadAction
    (no undo history). Staging's own LIRs: docs/lir/lir_2026-10-07_174_migration.md, lir_2026-10-10_174_load_purge.md.

L-layer / JjOM
  - What changes: LModel.roots = objects filtered by father.className === DModel; root = first root; LValue.children
    includes owned DObjects (delete cascades); eviction from a containment slot appends to model.objects; formWrite
    appends to a composition slot by setValueAtPosition (re-father, evict, refuse a loop).
  - What does NOT change: the auto-name path (getNamespaceOf), get_objects itself, the classic write paths.
  - Side-effect safety: staging's tests cover these (unq1AutoNameShadow, instanceManager*, permissionGuard,
    instanceDelete, m1Containment, versionfixer_2230_migration, versionfixer_load_purge).

IR form (viewpoint/ir)
  - What changes: three optional props; absent (every trunk caller) the form is the one without them.
  - What does NOT change: the trunk's IR rendering, graphVertex, edge synthesis.

Smoke-test scenarios potentially affected:
  - open a 2.229 save (scene_2_DemoPetri.jjodel) -> version 2.230 after load, no load error, canvas nodes > 0,
    the purge console line absent or with counts explained (probe, report §5)
  - export it and open the export (2.230) -> no load error, same canvas (probe)
  - the four default scenes and the M1 canvas of trunk features (graphVertex containment, derived viewpoints,
    object-as-edge) -> no vertex or edge lost at load (purge run on every tracked .jjodel fixture, report §4)
  - new project, smoke states -> unchanged (npm run smoke)

Uncertain about propagation? -> two points, measured in §3 and verified after the merge.
```

## 3. Semantic risks against this side's code

Both read by subagents on HEAD `5f25112c4` (R, not run), each with path:line and a positive control for every empty
search; the citations below are theirs, re-checked where marked.

### R1. The load purge meets this side's graph code: no risk found
- Listing is automatic: `frontend/src/joiner/classes.ts:1153`, in `Constructors.DGraphElement`, which every graph
  `new` calls: `this.setExternalPtr(thiss.father, "subElements", "+=");`. The one exception is a falsy father
  (`classes.ts:633` `if (!target) return this;`); every call site on HEAD passes a graph id.
- Every `subElements -=` deletes the record in the same transaction: `useM1ReferenceEdges.ts:196-197` (changed on
  this side), `canvasToJjom.ts:611-612`, `:713`, `:716`, `m1EdgeSweep.ts:109`, `:114`.
- The detach that makes unlisted records exists only on staging (`common/Dummy.ts`, «DETACHED from `subElements`, not
  deleted»); HEAD's `Dummy.ts:249-260` keeps the no-op. Collapse, `layoutByViewpoint`, `irEdgeLayout`, `irCollapsed`
  are scalar writes on vertices, not detaches.
- Vertex `model` is always an idlookup id (`canvasToJjom.ts:1264-1274`, `useJjomSync.ts:745-746`); edge ends come
  from the `subElements` scan or `dv.id` (`useJjomSync.ts:771-776`, `:979`).
- Call sites read: `DVertex.new` useJjomSync.ts:725, :757, canvasToJjom.ts:1274, :1317, :1361, :1464,
  ProjectEditor.tsx:1931; `DVoidEdge.new2` useJjomSync.ts:841, :931, :1039, useM1ReferenceEdges.ts:168,
  canvasToJjom.ts:269, :378, :1572, :1747, :1815. No callers of `DGraphVertex.new`, `DVoidVertex.new`,
  `DEdgePoint.new`, `DEdge.new`, `DExtEdge.new`, `DRefEdge.new` (control: the same grep found every `DVertex` site).
- What the purge can still remove on a trunk save: a vertex whose model element was deleted (a true ghost), and a
  vertex of `ProjectEditor.tsx:1789`/`:1931` whose object transaction aborted. Both are dead records.

### R2. `model.objects` lists nested instances: one visual risk, two output changes
- No consumer changed on this side since the merge base reads `objects` as roots: the simulator
  (`sim/simBridge.ts:140-152` `collectModelObjectIds`), codegen (`codegen/stcAccess.ts:90`,
  `codegen/target/js/access.ts:98`) and JjEL/JjScript pools (`jjscript/executor/commands/eval.ts:146`
  `allSubObjects`) follow `father` or scan the lookup; IR containment walks from the canvas nodes
  (`irContainment.ts:372`); ELK reads `parentOf`/`childrenOf`.
- `useJjomSync.ts` is byte-identical at the merge base, HEAD and staging. Step 2bis (`:743-757`) gives a vertex to
  every entry of `objects` that has none, at `x = 50 + col * COL_W`. At the merge base a nested instance got one only
  when listed (a `set`, the XMI import, `XMIService.ts:947`); after 2.230 every nested instance is listed.
- **A1 (at risk, this side only).** On this side a graphVertex container draws a hull around children kept at
  absolute positions (`irContainment.ts:4-6`, `IRContainmentHulls.tsx:48-61`), a `self` frame is «the box of its
  visible children» (`irContainment.ts:641`), and the open-time layout runs only on a graph never laid out
  (`autoLayoutOnOpen.ts:11`). An existing project with «Add» children under such a container, opened after the
  migration, shows those children at far grid cells and the container stretched to reach them, until Auto layout.
  The same already happens on HEAD for a root later `set` into a slot; staging makes it more common.
- **U1.** New vertices for «Add» siblings make `containment:unclaimed:*` problems appear (`irContainment.ts:445`,
  R-GV-2) where none did: what the spec says, new output.
- **U2.** A nested object-as-edge whose ends do not resolve used to be invisible (`irEdgeViews.ts:320-323`); it now
  has a vertex and is drawn as a node.
- **U3.** A container-to-child reference edge is drawn for «Add» children under a plain vertex
  (`useM1ReferenceEdges.ts:131`), as the `set` form already does; hidden under a graphVertex
  (`useIRContainment.ts:197`).

None of these is a load error or a data loss; none is fixed in the merge (NON FARE). The probe and the fixture bench
measure how many instances the migration lists and how many vertices they gain on the tracked saves.

## 4. How each is verified after the merge

| what | how | where it lands |
|---|---|---|
| staging's own tests in this tree | `npm run test` (full), counts against 8692 and the 9 import reds; the staging files `versionfixer_2230_migration`, `versionfixer_load_purge`, `consumerProposal`, `permissionGuard`, `m1Operators`, `formPermissions` by name | merge report, gate table |
| the purge on this side's saves | `VersionFixer.purgeDeadGraphElements` (the real function, joiner mocked as in staging's test) run on every tracked `.jjodel` (`frontend/scripts/probe/fixtures/*`, `frontend/public/examples/codegen/*`) after the real version chain: records removed per file, expected 0 | merge report §5, a temporary test outside the tracked tree |
| 2.229 and 2.230 open in the browser | probe on a dev server of this tree on 3141: version read, load error, VersionFixer console lines, canvas nodes, crop | merge report §5, lane folder |
| `model.objects` consumers | the AT RISK items of §3 re-read on the merged tree; any that is real is a stop with `Outcome: question`, not a fix in the merge | merge report |
| typecheck, build, smoke, check:docs, check:codegen-lazy | foreground, this tree | gate table |

The reservation at `VersionFixer.tsx:1193` («the first free number after 2.229», R-IRN-19 purge) becomes 2.231 with this
merge. No code edit: a ticket line in the merge report and in `docs/log-inbox/release-3-1.md`.

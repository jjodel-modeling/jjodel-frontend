# Layer Impact Report 2026-10-20: graphVertex hides the edges a container encloses (R-GV-18)

- Prompt-ID: P-2026-10-20-1420. Chat: C-2026-10-20-0839. Session `45ef2812`.
- Tree: `~/jjodel-w-gvedges`, branch `gv-enclosed-edges`, HEAD `68fd369ee` (the commit that adds the prompt).
- Critical-zone go-ahead: Alfonso, 2026-10-20 14:13, in chat C-2026-10-20-0839 (RC-30), Phase 1 waived; `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-10-20-1420` in the session.
- Written before any code diff (CLAUDE.md §3.2, RC-30). Every claim below is read in code at that HEAD unless marked measured.

## 0. Verdict

**One pure function changes, in the presentation pass of the v2-flow canvas.** `suppressChannelEdges`
(`viewpoint/ir/irContainment.ts:1005`) gains the enclosure rule after its channel step; it still only sets
`hidden: true` on edges it returns, and still drops only the stale channel edges of S3. No file of CLAUDE.md §3.2 is
edited: `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts` and
`VersionFixer.tsx` are neither edited nor called by the change. `useIRContainment.ts` is not touched.

## 1. Facts the design rests on

1. **One call site, after the lift.** `useIRContainment.ts:195-197`: `decorateEdges` (collapse lift) runs first, then
   `suppressChannelEdges(outEdges, model)`, both only when `model.containers.size > 0` or a row or view hides
   something. A container view without the R-GV keys never reaches the new rule with `edges: 'hide'`.
2. **The flag survives the edge-view pass.** `irEdgeViews.ts:201-226` `decorateReferenceEdges` returns either the edge
   itself or `applyEdgeStyle(e, …)`, which builds `{ ...e, … }` (`:55-56`): `hidden` is kept.
3. **`parentOf` is acyclic and holds winners only.** `resolveVisualParents` (`irContainment.ts:158-207`) refuses a link
   that would close a claim cycle (R-GV-2) and keeps one container per child, the innermost claimant; lost claims are
   in `multiClaimed`. The enclosure walk reads `parentOf` alone, so a container encloses what it draws, not what it
   lost.
4. **Endpoints are read as the canvas holds them.** The channel step resolves `model.objByVertex.get(e.source|target)`;
   the new rule does the same, so an edge lifted by a collapse is judged on its drawn ends: `Harness -> Activity`
   lifted to `Harness -> Role` stays hidden (the pool encloses the lane), `Activity -> Role` lifted to `Role -> Role`
   is already suppressed by `decorateEdges`.
5. **Hidden, not removed.** As the JSDoc of `suppressChannelEdges` explains, removal would change the edge array the
   object-as-edge synthesis and the handle passes read; a hidden edge keeps its handle slot, as the hidden channel
   edges already do (pre-existing, unchanged).

## 2. Layer Impact Report

```
LAYER IMPACT REPORT — P-2026-10-20-1420

Layers touched:
  [ ] D-layer (Redux raw data)       read only, through the containment model already built
  [ ] L-layer (computed proxies)     untouched
  [ ] JjOM (model entities)          untouched
  [x] Canvas v2-flow (ReactFlow)     `hidden` flag of instanceRef/composition edges in the presentation pass
  [ ] Canvas classic                 untouched
  [ ] Sync layer (useJjomSync hooks) untouched; no edge created, deleted or re-keyed
  [ ] Persistence (VersionFixer)     no persisted field, no migration
```

**Canvas v2-flow**
- What changes: with `containment.edges: 'hide'` on a container C, an `instanceRef` or `composition` edge between C and
  an object C encloses (its own claim, or a deeper one through the `parentOf` chain), in either direction, is returned
  with `hidden: true`. The walk follows `parentOf` from the other end upwards with a `seen` set (bounded by the
  number of objects even on a malformed model). Applies to every container that declares `hide`, whatever its
  channel (default, single-hop, multi-hop).
- What does NOT change: the channel step (R-GV-4) and its S3 drop of stale or duplicate channel edges, line for line;
  edges of any other type (`reference`, inheritance, synthetic object-as-edge); edges already hidden; edges between two
  objects of which neither encloses the other (siblings in one lane, a node and an object outside its container);
  every edge when no container declares `hide` (the function returns `edges` itself, as today).
- Cross-layer interaction: none. The function reads `model.containers[*].edges`, `model.parentOf` and
  `model.objByVertex`, already computed by `buildContainmentModel`.
- Side-effect safety vs other layers: no write to Redux, no edge creation or deletion, so the M1/M2 race-window
  guards (Rule 13) and the TRANSACTION rules (Rule 12) are not involved. Selection or editing of a hidden edge is as
  for any hidden channel edge today.

**Existing tests (requirement (d) of the prompt).** The R-GV-4 fixture of `irContainerLayout.test.ts:229-296` declares
`L` with `edges: 'hide'` and `parentOf t -> L`, so `t` is enclosed by `L`. Under R-GV-18 the edges `e2` (`L -> t`,
`owner`), `e4` (`t -> L`, reverse) and `e5` (`L -> t`, composition) are hidden besides the channel edge, on every case
that declares `hide` with `t` drawn inside `L`: four of the seven cases assert the exclusivity R-GV-18 amends
(«only that one», a multi-hop `hide` returning the same array). Unchanged on any reading of the rule; their expected
hidden sets are updated to the union and every other assertion (ids kept, S3 drops, lost claims, `show`, absent key,
type filter) stays as it is.

## 3. Smoke scenarios potentially affected

- «Jjodel harness», viewpoint «Harness / Lane process (BPMN)»: the 24 `Activity -> Role [performer]` and the 41
  `Harness -> * [activities|controlNodes]` edges hidden, the 42 flows still drawn (chat, after the merge, RC-23).
- BPMN fixture `frontend/scripts/probe/bpmn-lanes-fixture.ts`: lanes and pools draw as before; a sequence flow between
  two nodes of one lane, or across lanes, stays visible.
- Unchanged by construction, not re-measured: graphVertex views without `containment.edges`, the S1 hull scene,
  import Families.ecore, open of an existing project, save and reopen.

# Discovery 2026-10-10: whole-graph re-layout on open, root cause and fix

- Prompt-ID: P-2026-10-10-1155, `docs/prompts/claude_2026-10-10_1155_prompt_relayout_on_open_fix.md`, chat C-2026-10-10-0057
- Session: `0f426bba-f321-41c8-b64d-2af5d2a28b0b`
- Tree: `~/jjodel-w-relayout`, branch `relayout-on-open`, base HEAD `616344b3c`; fix `b58d8631f`, probe `12c329749`
- Executor: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it re-reads the real files.

## 0. Answer in brief

1. **Mechanism confirmed, read and measured.** `useJjomSync.ts:696` raises `justCreatedGraphRef` on every populate
   run that creates anything (a vertex, an edge, a stale-edge delete), not only on graph creation. The init callback
   (`EditorV2.tsx:514-521` at `616344b3c`) answers it with `handleAutoLayout()`, whose non-full branch runs ELK over
   every node and writes every position back under the active layout key (`:3804-3812`; the prompt's `:3808-3816`
   had drifted by four lines). Re-measured on `616344b3c`: the sentinel went 781,1010 → 141,530 and its record was
   rewritten (`assets/relayout-on-open/probe_base.log`).
2. **Purpose.** Added on 2026-03-10 (`45a83df9a`, an unrelated batch commit) as «If the graph was just auto-created,
   apply ELK layout first». The S4b fix of 2026-07-07 (`53df5d04c`) relies on it for the transformation flow:
   ProjectEditor creates the graph and every vertex on its own grid before the tab opens, and the open-time ELK is
   what lays the output out. No ratified decision requires a whole-graph layout on open; R-VP-45 fixes *which* ELK
   the first open runs, not *when*.
3. **Fix** (`b58d8631f`): `shouldAutoLayoutOnOpen(createdOnOpen, graphId, idlookup)` in
   `editor-v2/utils/autoLayoutOnOpen.ts`. The open-time layout runs only when the populate run created something
   **and** no vertex of the graph carries a layout record (`layoutByViewpoint`, any key). Tests 9/9, mutation bench
   9/9 killed.
4. **Acceptance, measured on `b58d8631f`** (`assets/relayout-on-open/probe_after.log`, `e3b_positions.json`):
   E3b 0 of 10 pre-existing nodes moved, 0 of 10 records changed, the sentinel's record byte-identical, ProbeRoot
   created at its Step 2bis seed 470,950; E3a 0 moved; E1 0 of 10 nodes on the default grid (ELK ran).
5. **One reading taken unattended.** The prompt's rule says «no persisted position». Read literally (any
   pre-existing vertex), it would stop laying out transformation outputs, whose vertices exist before the open with
   ProjectEditor's grid positions and no record (§A4). The fix reads «persisted position» as a layout record
   (R-LAY-14's record, not the seed). It satisfies E1, E3a and E3b and keeps S4b. Residual: a layout that lives only
   in the seeds (saved before slice 1b of 2026-08-24 and never touched in editor-v2 since, or written by the
   classic editor) is still re-laid out by a creating open, as today (§R1).

Decisions awaiting Alfonso: none of the RC-26 list. Decisions taken (unattended): at the end.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `useJjomSync.ts:696` raises the flag on any creating run | **Holds** [R]: it sits after an early exit that returns only when nothing is missing or stale (`:685-689`) |
| H2 | The init callback runs ELK on all nodes and writes every position under the active key | **Holds** [R] + [M] (base run, E3b) |
| H3 | The defect does not depend on nested objects | **Holds** [M]: E3b creates a root |
| H4 | A ratified decision requires a whole-graph layout on open | **Falsified** [R]: R-LAY-1..19 say nothing on it; R-VP-45 binds the function, not the trigger |
| H5 | «No persisted position» = «no vertex existed» is safe | **Falsified** [R]: the transformation flow (§A4) |
| H6 | Nothing on the open path writes a layout record before the decision | **Holds** [R]: the only writers are gestures and the auto-layout itself (§A5) |

## 2. Objective

Confirm the mechanism, list the flag's readers and writers, state the purpose of the open-time layout, then gate it
so that an open on a graph already laid out moves nothing and writes no record of a pre-existing vertex.

## 3. Files read (full paths under `frontend/src/` unless said)

`components/editor-v2/EditorV2.tsx` (`:480-560`, `:3660-3910`), `components/editor-v2/hooks/useJjomSync.ts`
(`:225-330`, `:420-900`, `:1150-1240`), `components/editor-v2/sync/canvasToJjom.ts` (`:40-135`),
`components/editor-v2/utils/reLayoutWatcher.ts` (header), `components/project/ProjectEditor.tsx` (`:1690-1720`,
`:1760-1800`, `:1880-1960`), `components/editor-v2/CLAUDE.md`, `docs/decisions.md` (R-LAY, R-VP-45, RC-21..28),
`docs/discovery/2026-07-07-s4b-recalc-bypass.md`, the nested-vertices report at `0cea4fd7a` (§D, addendum S0),
the probe at `d5b28a6b7`.

## A. Root cause

**A1. The writer.** `useJjomSync.ts:687-696` at `616344b3c`:

```
            && missingEdgeCount === 0 && missingM1EdgeCount === 0
            && staleCrossMMEdgeCount === 0
            && staleInheritanceEdgeCount === 0) return;
        ...
        creatingGraphRef.current = true;
        justCreatedGraphRef.current = true;
```

Any missing classifier vertex, object vertex, M2 or M1 edge, or any stale edge to delete, raises the flag.

**A2. The reader and the layout.** `EditorV2.tsx:513-521` at `616344b3c`:

```
            // If the graph was just auto-created, apply ELK layout first
            if (justCreatedGraphRef.current) {
                justCreatedGraphRef.current = false;
                if (autoLayoutRef.current) {
                    await autoLayoutRef.current();
                    ...
                    armReLayoutRef.current?.();
```

`autoLayoutRef.current = handleAutoLayout;` (`:3854`), called without `full`, so `:3804-3812`:

```
        const layoutedNodes = await computeElkLayout(currentNodes, currentEdges);
        setNodes(layoutedNodes);
        ...
        for (const n of layoutedNodes) {
            updates.push({ id: n.id, x: n.position.x, y: n.position.y });
        }
        if (updates.length > 0) syncPositionBatchToJjom(updates);
```

`syncPositionBatchToJjom` writes a record per vertex under `getActiveLayoutKey()` (`canvasToJjom.ts:100-111`). The
late-edge watcher armed at `:520` re-runs the same function once more when reference edges land.

**A3. Every reader and writer of `justCreatedGraphRef`.** Search `command grep -rn "justCreatedGraphRef"
frontend/src`, exit 0; positive control: the same search returns the declaration at `useJjomSync.ts:439`.

| Site (at `616344b3c`) | Role |
|---|---|
| `hooks/useJjomSync.ts:68` | type of the returned field |
| `hooks/useJjomSync.ts:439` | `const justCreatedGraphRef = useRef(false);` |
| `hooks/useJjomSync.ts:696` | writer, `true` |
| `hooks/useJjomSync.ts:1551` | returned to the caller |
| `EditorV2.tsx:510` | destructured |
| `EditorV2.tsx:514` | reader, inside the `onInitialized` callback |
| `EditorV2.tsx:515` | writer, `false` |

The callback fires once per initialization (`useJjomSync.ts:1219-1221`, guarded by `initializedRef`). A creating run
after the init (a JjScript create with the canvas open) leaves the flag raised and unread until the next init of the
same instance; the fix makes that stale flag inert on a laid-out graph too.

**A4. Purpose.** `git log -S justCreatedGraphRef -- frontend/src` returns one commit, `45a83df9a` (2026-03-10), whose
message is about the JjEL console: the flag came in a batch, with the comment «If the graph was just auto-created,
apply ELK layout first». The flag was already set on any creating run then (`45a83df9a:useJjomSync.ts:325-332`).
The case it serves today is the transformation flow, measured on 2026-07-07
(`docs/discovery/2026-07-07-s4b-recalc-bypass.md:35-37`: «`missingM1EdgeCount>0` … `justCreatedGraphRef.current=true`
… parte l'unico ELK») and the reason for `53df5d04c` (re-run once M1 edges materialize). In today's code:
`ProjectEditor.tsx:1701` `DGraph.new(0, dModel.id, undefined, undefined, graphId);`, `:1709`
`SetFieldAction.new(dGraph.id, 'graphStyle', 'v2-flow', '', false);`, `:1931`
`DVertex.new(0, pv.objectId, gid, gid, undefined, size);` on its own grid, and `:1898`
`DockManager.open2(LModel.fromD(modelToOpen));` 2000 ms later. So that graph has vertices with positions, and no
record, before the populate run. The only other pre-open creator of v2-flow vertices is `useJjomSync` itself
(search `command grep -rn "DVertex.new(\|DGraph.new("` over `frontend/src`, exit 0; the `canvasToJjom.ts` creators are
gestures on an open canvas, the `MetamodelTab`/`ModelTab` graphs are not v2-flow).

**A5. Ratified decisions.** No R-LAY row mentions an open-time layout (`docs/decisions.md:3311-3364`). R-VP-45
(`:5077-5082`, provisional): «The first-open layout and the late-edge re-layout (`autoLayoutRef`) keep today's
`computeElkLayout`, unchanged» — it binds the function, not the trigger. Writers of `layoutByViewpoint` (search over
`frontend/src`, exit 0): `canvasToJjom.ts:76`, reached from EditorV2's drag, resize, size-batch, reset-size and the
two auto-layout branches, and `MetamodelTab.tsx:125` (classic drop). None runs on the populate or init path, so the
records read when the decision is taken are the ones the graph had before the run.

## B. Fix

`b58d8631f`, three files: `editor-v2/utils/autoLayoutOnOpen.ts` (new, pure), its test (new), `EditorV2.tsx`
(import and the callback, `:514-526`; the drag-end and drop regions untouched).

```
            const createdOnOpen = justCreatedGraphRef.current;
            justCreatedGraphRef.current = false;
            if (autoLayoutRef.current && shouldAutoLayoutOnOpen(createdOnOpen, graphId, store.getState()?.idlookup ?? {})) {
```

The predicate: false when nothing was created; true when there is no graph; otherwise true only when no element
reached from the graph through `subElements` (nested vertices included, cycles and dangling ids tolerated) has a
`layoutByViewpoint` entry holding an object. The name was searched first (`shouldAutoLayoutOnOpen|autoLayoutOnOpen`
over `frontend/src frontend/scripts docs`: 1 hit, the prompt) with a positive control (`reduceReLayout`: 6 hits).

**Mutation bench** (each applied alone, vitest on the test file): no created gate, no graph → false, records ignored,
no recursion, empty dictionary counted as a record, all of idlookup instead of the graph, `__abstract__` key only,
keys instead of records, inverted — 9/9 killed. Not mutated: the `seen` set (the mutant does not terminate). The call
site is not importable in the bench (the `joiner` barrel); the probe covers it, the base run being its mutant.

## C. Measurements

Probe `frontend/scripts/probe/nested-vertices.ts` (`12c329749`: the `d5b28a6b7` probe plus `recRaw`, the stored
record as JSON, and an E3b line comparing every pre-existing record), run with `lane-run probe … --port 3155`,
1440x900, light, offline user. Both runs: exit 0, 0 page errors, 7 console errors, all `init_dash`, as in the S0 runs.

| | base `616344b3c` | after `b58d8631f` |
|---|---|---|
| E1 nodes on the default grid (50 + 420c, 50 + 300r) | 0 / 10 | 0 / 10 |
| E1 nodes with a record | 10 / 10 | 10 / 10 |
| E3a pre-existing nodes moved | 0 / 10 | 0 / 10 |
| E3b pre-existing nodes moved | 1 / 10 (sentinel 781,1010 → 141,530) | 0 / 10 |
| E3b records changed | 1 / 10 | 0 / 10 |
| E3b sentinel record after | `{"x":141,"y":530,"w":200,"h":120,"isResized":false}` | `{"x":781,"y":1010,"w":200,"h":120,"isResized":false}` (identical to before) |
| E3b ProbeRoot | vertex created, 470,950, no record | vertex created, 470,950, no record |

The base run is P12's discriminating control for the new record line: on the unfixed code it reports
`changedCount 1`. Assets: `docs/discovery/assets/relayout-on-open/probe_{base,after}.{log,json}`,
`e3b_positions.json` (per node, before and after, both runs).

## Dependencies and risks

- **R1. Seed-only layouts.** A graph none of whose vertices has a record is still re-laid out by a creating open:
  a layout saved before slice 1b (2026-08-24) and never touched in editor-v2 since, or one written only through the
  classic editor or the L-proxy (R-LAY-16). Same behavior as today, not a regression. Closing it needs a signal that
  tells such a graph from a transformation output (for instance «the graph has no persisted edge yet»); not done here,
  because it would change what an existing graph shows on open.
- **R2. New vertices on a laid-out graph land on the Step 2/2bis grid**, possibly far from their neighbours or over
  other nodes. Specified by the prompt; placement next to the container is a later slice.
- **R3. The transformation path was not run.** Its preservation rests on the read of §A4 and on the test «vertices
  with a birth position and no record → lay out».
- **R4.** The MODELS demo scenes were not re-measured. They change only if a demo's open creates something on a
  graph that has records; then it now keeps the records instead of re-running ELK.

## Open questions

1. Should R1 be closed in a lane of its own, with a fresh-graph signal beyond records?
2. Should the stale-flag path (§A3: a creating run after init, read at the next init) be closed at its writer, in a
   critical-zone lane on `useJjomSync.ts`?

## Decisions taken (unattended)

- «Persisted position» read as a layout record (`layoutByViewpoint`, any key), not the seed: the literal reading
  stops laying out transformation outputs (§A4, Rule 3). Any key rather than the active one: the prompt forbids
  writing any record of a pre-existing vertex, and it avoids a new read of the active viewpoint (R-LAY-19).
- The decision is read at callback time, not snapshotted at mount: H6 holds, and it needs no ref keyed on `modelid`.
- The late-edge re-layout is gated with it, since it is armed only on the allowed path.
- The probe changed beyond a parameter: one field and one MEAS line, additive, because E3b's criterion is
  byte-identity of the record and the probe read only its rounded x,y.
- No R- row written: `docs/decisions.md` is outside DOVE. The chat may register the reading above as an R-LAY row.

## Decisions awaiting Alfonso

None of the RC-26 list.

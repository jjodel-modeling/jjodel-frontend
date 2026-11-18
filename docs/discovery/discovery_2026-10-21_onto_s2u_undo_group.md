# Discovery — S2u: one undo entry per instantiation, tickets (a) and (c) (Phase 1)

- Prompt-ID: P-2026-10-21-0947 (chat C-2026-10-20-1835, front instance-of, lane full, Phase 1 read-only)
- Prompt file: `~/.jjodel-lanes/P-2026-10-21-0947/prompt.txt`
- Session: 015eDtjagjBtuPHhhhfUTTo5
- Tree: `~/jjodel-w-oi-s2u`, branch `oi-s2u`, HEAD `7999d5d5a` (clean at start)
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

Tags: **[read]** = read in a file in this phase; **[measured]** = measured in this phase, one run of the throwaway probe
`frontend/scripts/smoke/_tmp_s2u_undo_trace.ts` (gitignored, not committed) on `7999d5d5a`, Vite on port 3089, log
`~/.jjodel-lanes/P-2026-10-21-0947/probe-_tmp_s2u_undo_trace.log` (EXIT=0), data `/tmp/s2u-trace/trace.json`. The probe
wraps `store.dispatch` in the page and records, per dispatch, the history length before and after, PUSH or MERGE into the
top entry, the top entry's age, and which created ids the top entry's `idlookup` patch holds.

## Objective

Make one instantiation (instance, slots, values, its vertex at the click, its size in every viewpoint that draws it)
one undoable entry by construction, not by the 450 ms timing it relies on today (R-OI-12; tickets (a) and (c) of
`docs/log-inbox/instance-of.md:80` and `:99`). Phase 1: how the history groups today, the narrowest core change, where
the vertex writes fit, the oracle.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | An instantiation is one entry today because every write lands inside a 450 ms merge window. | **Falsified (partly).** The window is 450 ms but it is anchored at the entry's FIRST write and never slides; the writes after it merge because each carries a vertex/edge create, which `reducer.ts:1216` merges at any age (merges measured at 789-2401 ms). A write without a graph create after 450 ms pushes its own entry (Member: 2 entries). |
| H2 | One entry means one complete undo. | **Falsified.** The merge is shallow (`U.tsx:903`): a later delta's `idlookup` patch is dropped from the merged entry. Undo of the Book instantiation removed the instance and left its 4 slots and its vertex in `idlookup` (measured T2). |
| H3 | Ticket (a): `createVertexForObject` after `createInstance` breaks undo through timing. | **Falsified; the cause is structural.** The two calls fuse into one dispatch (async `TRANSACTION`), whose delta carries `vertexs`, so `:1216` merges it into the previous, unrelated entry (1753 ms old), and the shallow merge drops the instance's `idlookup` patch: 3 presses later the instance is still in the model (T4, T4z). |
| H4 | Ticket (c)'s second press (WIP) comes from the second viewpoint's index build delaying the size write past the window. | **Plausible, not measured on the WIP.** A size write is a SetFieldAction on `layoutByViewpoint` (no graph key), so past 450 ms from the entry's first write it pushes an entry (mechanism of H1). It is moot under the group of Q2. |
| H5 | An existing grouping API can hold an instantiation. | **Falsified.** `BEGIN`/`END`/`TRANSACTION` batch ACTIONS and freeze the store until `END`; `instantiate` polls the store between creates and Step 2bis needs the store to advance. `CombineHistoryAction` is dead code. |
| H6 | The vertex writes (Step 2bis, size, position) are deferred in a way a group cannot hold. | **Holds for an action-level group, falsified for a history-level one.** They land in the store while `instantiate` awaits them, so a group kept in the reducer's history absorbs them. |

## Files read (full paths, windows)

- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/redux/reducer/reducer.ts` 1155-1325 (history bookkeeping, `isRelevantChangeCheck`, `isOnlyTransientTopLevelChange`); grep for undo/merge
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/redux/action/action.ts` 80-260 (`BEGIN`/`END`/`COMMIT`/`TRANSACTION`), 308-357 (`Action.fire`), 700-720 (`CombineHistoryAction`)
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/redux/store.tsx` 70-85 (`statehistory`)
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/common/U.tsx` 896-906 (`objectMergeInPlace`), 178 (`UpdatingTimer`)
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/common/UObj.ts` 95-161 (`objectDelta`)
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/components/editor-v2/hooks/instantiate.ts` 8-37, 326-462
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/components/editor-v2/hooks/createAdapter.ts` 30-53, 340-359, 440-469
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/components/editor-v2/sync/canvasToJjom.ts` 1446-1470
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/components/editor-v2/hooks/useJjomSync.ts` 495-530, 728-787 (Step 2bis)
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/components/editor-v2/EditorV2.tsx` 3036-3063 (grep for `instantiate(`)
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/components/editor-v2/viewpoint/layout/vertexLayout.ts` 36-42, 119-125
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts` 1-60 and its test names
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/scripts/probe/onto-s2-instantiate.ts` 23-227, 272-301, 428-485
- `/Users/alfonso/jjodel-w-oi-s2u/frontend/scripts/probe/undo-inline-edit.ts` 1-40
- `/Users/alfonso/jjodel-w-oi-s2u/docs/log-inbox/instance-of.md` 74-104; `~/.jjodel-lanes/P-2026-10-21-0725/handoff.md`, `s2-5-wip.diff` (whole)

## Q1 — How the undo stack groups actions today

**The pipeline [read].** A write (L-API setter, `SetFieldAction.new`, a creator) builds an `Action` and calls `fire()`.
Inside a transaction it is queued; outside, it is dispatched on a timer, so every `fire()` outside a transaction is one
reducer call:

- `action.ts:329-331` «`if (t.hasBegun) { t.pendingActions.push(this); } else {`»; `:349` «`setTimeout(()=>storee.dispatch({...this}), 0);`»
- `action.ts:153-174` `FINAL_END` wraps the pending actions into one `CompositeAction` and fires it: one transaction = one dispatch.

**`TRANSACTION` is async [read], and that fuses neighbouring creators [measured].** `action.ts:210`
«`export async function TRANSACTION(name:string, func: ()=> void, ...): Promise<boolean> {`», `:217`
«`if (lenient || !t.hasAborted) await func();`», `:225` «`return END([]);`». `END` runs one microtask after `func`
returns, so a creator called synchronously after a `TRANSACTION`-opening call joins its batch. Measured T4:
`createInstance` alone is one dispatch of 24 actions (T3), `createInstance` + `createVertexForObject` is one dispatch of
30 (24 + the 6 of `DVertex.new`).

**One history decision per dispatch [read]** (`reducer.ts` `_reducer`, the `default:` branch):

- the window: `reducer.ts:1160` «`const mergeTolerance = U.UpdatingTimer*1.5;`», `U.tsx:178` «`public static UpdatingTimer: number = 300;`» = **450 ms**;
- the test: `reducer.ts:1284` «`if (pastDelta && delta.timestamp - pastDelta.timestamp < mergeTolerance) return false;`» (not relevant = merge), with the gates `:1283` `U.userHasInteracted` and `:1285` `statehistory.globalcanundostate`;
- the forced merge: `reducer.ts:1216` «`if (!shouldMerge && (delta.vertexs || delta.graphvertexs || delta.graphelements || delta.edgepoints || delta.edges || delta.graphs)) shouldMerge = true;`» — a delta that creates or deletes a graph element merges into the top entry **at any age**;
- the merge: `reducer.ts:1256` «`U.objectMergeInPlace(pastDelta, delta);`», whose body is `U.tsx:903` «`out[key] ?? (out[key] = o[key]);`»: top-level and older-wins. The entry keeps its first `timestamp` (so the window never slides: it is anchored at the entry's first write) and **drops the later delta's whole `idlookup` subtree** whenever the entry already has one, which is every model write.
- push: `reducer.ts:1264-1269`, both `statehistory[sender]` and `statehistory.all` (`store.tsx:76`).

**No existing grouping API holds a caller-defined span [read].** `BEGIN`/`END`/`COMMIT` (`action.ts:103-152`) and
`TRANSACTION` batch actions; the store does not change until `FINAL_END`. `CombineHistoryAction` (`action.ts:704-719`,
«`// todo: delete or find original idea back`») has its reducer case commented out (`reducer.ts:1165`). Absence of any
other undo-group API: `grep -rn -c -E "beginUndoGroup|endUndoGroup|UndoGroup|undoGroup"` over `redux joiner common
components` returned no file with a non-zero count; the same command with `TRANSACTION\(`, cut at `head -n 3`,
returned three files with a non-zero count, `store.tsx`, `VersionFixer.tsx`, `reducer.ts` (positive control).

**Which path each write takes [read + measured]:**

| Write | Path | Dispatches | History outcome today (measured) |
|---|---|---|---|
| `createInstance` (`createAdapter.ts:491`) | `addObject` → its own `TRANSACTION` around `DObject.new3` | 1 composite (24 actions) | PUSH (first write) |
| the seeding of the json slots | `addObject` `setTimeout(U.UpdatingTimer * 2)` = 600 ms (`createAdapter.ts:42-43`) | 1 composite (2-5 actions) | PUSH when it lands alone (T1 +1629 ms, T3 +599 ms, T4 +638 ms); MERGE when it shares a composite with a creator (T1b) |
| a slot / value create | `createInstance` → `addObject`, + the child vertex and composition edge of `createAdapter.ts:465-468`, fused | 1 composite (40-54 actions) | MERGE via `:1216` (has a graph create) |
| Step 2bis vertex (`useJjomSync.ts:757`) | `DVertex.new` bare, in the sync effect after the instance reaches the store | 1 composite (6) | MERGE via `:1216` (T1 age 302, T3 age 298) |
| sync-created edges after `instantiate` returned | Step 3 / M1 edges, `DVoidEdge` creators | 1 each (10-20) | MERGE via `:1216` into whatever is top (T1 3496 merged into the seeding entry) |
| the node size (`instantiate.ts:383`) | `TRANSACTION('Instantiate: node size')`, SetFieldAction only | 1, or fused | MERGE only if within 450 ms of the entry's first write or fused with a creator; else PUSH |
| `createVertexForObject` after `createInstance` (ticket (a)) | `DVertex.new`, fused into `createInstance`'s composite | 1 (30) | MERGE into the PREVIOUS entry via `:1216` (T4: age 1753 ms) |

**Measured traces** (t in ms from page instrumentation; op, history length, top entry's age):

- T1, `instantiate(Member)` (2 slots, `active` has a default value): 1697 PUSH 2→3 (instance) · 1998 MERGE age 302 (Step 2bis vertex) · 2485 MERGE age 789 · 2788 MERGE age 1092 · 3157 MERGE age 1460 · **3326 PUSH 3→4** (n=2, «slots.addObject() initializing values», the value's seeding) · 3496 MERGE into entry 4. **2 entries.**
- T1b, `instantiate(Book)` (4 slots, no default): 7097 PUSH 5→6, then 8 MERGEs at ages 300 to 2401 ms, every one carrying a graph create. **1 entry.** The entry's `idlookup` patch holds the instance (`true`) and none of the 4 slots nor the vertex (`false`).
- T2, Cmd+Z after T1b (after the probe's pane click and focus): press 1 POP 7→6 — the click's own entry (1 `idlookup` element), not the instantiation; press 2 POP 6→5 — the instance leaves the model and `idlookup`, **the 4 slots and the vertex stay in `idlookup`**; 190 ms later a sync PUSH 5→6 (n=8, `graph5.subElements`), i.e. a cleanup entry the next press would undo.
- T3, bare `createInstance`: PUSH · MERGE age 298 (Step 2bis vertex) · **PUSH at +599 ms** (seeding) · MERGE age 298 (edge): **2 entries** — S2-3m's «+2».
- T4, `createInstance` + `createVertexForObject(400, 300)`: one dispatch n=30, **MERGE into entry 9, age 1753 ms**; then a Step 2bis MERGE that creates a **second vertex** (1027 at 470,10250 beside 1025 at 400,300); PUSH at +638 ms (seeding). T4z: 3 presses, the instance still in the model. The duplicate's cause is not isolated (Step 2bis indexes `graph.subElements`, `useJjomSync.ts:525-529`; the fused vertex was not found there — hypothesis: the nested-creator loss of rule 12).

## Q2 — The narrowest core change

**An action-level group cannot work [read].** A `BEGIN` held across `instantiate` (or `TRANSACTION` with an async
callback, which `action.ts:217` already awaits) keeps every write pending until `END`: `waitFor`
(`instantiate.ts:330-337`) polls `store.getState()` for the DValues the constructors create, and never sees them before
its 6 s limit; Step 2bis never sees the instance; and it nests creators, the hazard of rule 12.

**Proposed: a history-level undo group in `reducer.ts` only; `action.ts` is not touched.**

```ts
// reducer.ts, beside the history bookkeeping
export function beginUndoGroup(): number            // opens a group for DUser.current; returns its id
export function endUndoGroup(id: number): void      // closes it (no-op on a stale id)
// module state: openGroup {id, sender, openedAt} | null; groupTail {entry, base: DState} | null
```

In `_reducer`, after `delta` is computed (`:1205-1209`), only when a group is involved:

1. `UndoAction` / `RedoAction` close any open group and clear `groupTail` before `doUndoRedo`.
2. Group open, same `action.sender`, gates open (`U.userHasInteracted`, `globalcanundostate`), older than `UNDO_GROUP_MAX_MS` (proposed 10 s) closes it:
   - no group entry yet: PUSH `delta` as a new entry even if it is within 450 ms of an unrelated entry or carries a graph create (today it would merge into that entry: ticket (a)); `groupTail = { entry: delta, base: oldState }`;
   - group entry on top: replace its contents with `Uobj.objectDelta(ret, groupTail.base)` (the exact delta from the state before the group, same shape as any entry, same object so both stacks see it), first `timestamp` kept.
3. Legacy path unchanged, except: when the legacy rule merges into an entry that is `groupTail.entry` (a late graph create after `endUndoGroup`, `:1216`), it uses the same exact replacement instead of `objectMergeInPlace`. Any PUSH clears `groupTail`.

Why exact replacement and not a deep merge of deltas: past states are not mutated (copy-on-write, asserted by
`reducerCopyOnWrite.test.ts`), so `objectDelta(ret, base)` recurses only into the paths changed since `base` and is,
by construction, the entry a single dispatch of the whole group would have produced.

**Cost on every other caller:** no caller but `instantiate` opens a group, so `openGroup` and `groupTail` stay `null`
and the reducer takes today's path after two null checks: same PUSH/MERGE decisions, same (shallow) merged contents.
Pinned by a test (Q4). **Critical zone (§3.2 list): none touched** — not `useJjomSync.ts`, `canvasToJjom.ts`,
`jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`. Core: `reducer.ts`
(approved 2026-10-21 09:46). The caller reaches it by `import('../../../redux/reducer/reducer')`, so the `joiner` barrel
is not touched either.

## Q3 — Can the vertex writes for (a) and (c) go inside the group?

**Yes, under the history-level group [read + measured].** The Step 2bis vertex is created by the sync after the
instance's dispatch reaches the store (T1: 301 ms later), while `instantiate` waits for it
(`instantiate.ts:377-380`); the size write follows in the same function. Both land before `endUndoGroup` and join the
entry. What the group cannot hold is what lands after it closes: the seeding (+600 ms after its create) and the sync's
later edges. Phase 2 therefore (i) awaits the seeding of the instance and of each value inside the group
(`waitFor` on the seeded fields, the plan knows them), and (ii) relies on step 3 above for late graph creates, which
`:1216` already merges at any age.

**Ticket (a), the position:** do not create the vertex (measured T4: fused composite, merged into the previous entry,
a duplicate from Step 2bis). Let Step 2bis create it and write `x, y` with the size in the one SetFieldAction-only
`TRANSACTION` of `sizeInstanceNode` (rule 12 safe), resolved per layout key by `resolveVertexLayoutWrite`
(`vertexLayout.ts:119`, `VertexLayout` has `x, y, w, h, isResized`, `:36-42`). The point comes from
`EditorV2.tsx:3051` `runInstantiate`, which today passes no point; the pane menu has `event.clientX/Y`
(`EditorV2.tsx:3040-3042`), converted with `screenToFlowPosition` (`:753`).

**Ticket (c), the size in every viewpoint:** the WIP's `sizingTargets` (`s2-5-wip.diff:85-96`) inside the group; its
measured 2-press regression is a timing effect the group removes. The WIP's S2-5o probe needs the zoom-to-fit the
handoff names (`handoff.md:11-12`).

The direct-write alternative (create the vertex record at creation with position and per-viewpoint sizes) is not
needed and is the one measured to duplicate the vertex.

## Q4 — Regression risk and the Phase 2 oracle

**Existing coverage [read]:**

- `frontend/scripts/probe/undo-inline-edit.ts` — 8 cases (row, label, direct, proxy, object, rename, batch-noop, batch-single): Cmd+Z restores, Cmd+Shift+Z reapplies. All single-write, no group: they exercise the legacy path.
- `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts` — the real `_reducer` in node (10 tests: previous state untouched, undo restores, redo reapplies). The bench Phase 2 extends.
- `frontend/scripts/probe/onto-s2-instantiate.ts` — S2-3, S2-3n, S2-3b, S2-3m. Its census walks `model.objects`, so it cannot see `idlookup` orphans (T2 shows them).
- `frontend/scripts/probe/object-edge-delete.ts` (Cmd+Z at `:350`, `:356`) and `io-board-lane1.ts` (history numbers, `:279`) read the history.

**Oracle for Phase 2:**

1. New `frontend/src/redux/reducer/__tests__/undoGroup.test.ts`, real `_reducer`: (a) no group: three writes at 0/500/1600 ms and a graph create give the same entries and the same merged contents as today (legacy pinned); (b) a group spanning a create, a graph create at 789 ms and a seeding at 1629 ms is 1 entry, undo restores the pre-group `idlookup` exactly (every created id absent), redo reapplies; (c) the group's first write within 450 ms of an unrelated entry pushes its own entry; (d) an undo inside an open group closes it; (e) a graph create after `endUndoGroup` merges exactly. Mutation bench in the commit message: shallow merge back → (b) dies; no first push → (c) dies.
2. Probe, both paths (pane cascade Book and Member; class-node «New instance» book3): +1 entry, 1 Cmd+Z, after it every created id (instance, slots, values, vertex, edges) absent from `idlookup`, and no PUSH in the 1.5 s after the press; the cascade instance's vertex at the click (±1 flow px); S2-5o: the class-node instance's node in the object diagram holds its header and 4 rows. Entries counted from before the probe's own pane click (T2: that click pushes one).
3. `undo-inline-edit.ts`: the 8 cases with the same PASS/FAIL as at `7999d5d5a`. `reducerCopyOnWrite.test.ts` green.
4. S2-3m: the bare `createInstance` leg unchanged (+2, outside any group); the `instantiate` leg +1.
5. Gates: typecheck 0, `instantiate.test.ts` and the new test green, build 0.

## Layer Impact Report (reducer.ts, action.ts)

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)  — history bookkeeping only, beside it
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)  — not modified; its writes during a group join the group's entry
  [ ] Persistence (VersionFixer / jsxString)

reducer.ts
  - What changes: two exported functions, module state for one open group and the last group entry, one branch in
    _reducer before the legacy push/merge, and the exact replacement when the legacy merge targets a group entry.
  - What does NOT change: DState shape, doreducer, CompositeAction reduction, copy-on-write, doUndoRedo/undo, the
    450 ms window, the :1216 forced merge, objectMergeInPlace for every non-group entry, MAX_HISTORY.
  - Callers: _reducer runs for every dispatch; beginUndoGroup/endUndoGroup are called by instantiate.ts only.
  - Cross-layer interaction: while a group is open, every same-sender dispatch that passes the history gates joins
    its entry, the sync's Step 2bis vertex and edges included.
  - Side-effect safety: without a group the path is today's (pinned by test 1a).
action.ts
  - Not touched. TRANSACTION/BEGIN/END/COMMIT and Action.fire keep their semantics.

Invariants: (I1) no group, no change; (I2) past states not mutated (the group's base relies on it, as undo does);
(I3) a group entry has the shape of one objectDelta; (I4) a group closes on endUndoGroup, on undo/redo, or after
UNDO_GROUP_MAX_MS; (I5) only the opening sender's writes join.

Risks: (R1) an unrelated write by the same user during the 2-3 s of an instantiation joins its entry; (R2)
collaborative: another sender's entry can sit above the group's in statehistory.all — order of first write kept,
declared, collaboration is off in the bench; (R3) objectDelta(ret, base) per group dispatch, proportional to paths
changed since base: measured in Phase 2 (reducer time per dispatch, group vs legacy); (R4) one extra DState retained
until the next push.

Smoke-test scenarios potentially affected:
  - an inline edit + Cmd+Z / Cmd+Shift+Z (undo-inline-edit.ts, 8 cases) — expect unchanged
  - drag a node, create a class, Cmd+Z — expect unchanged (legacy path)
  - New instance from the pane cascade and from a class node, Cmd+Z once — expect the model and idlookup as before
  - open existing project → views render; save → reopen → identical (history is not persisted: store.tsx:76 is a
    module object outside DState)
```

## Phase 2 plan

Files (7, rule 19: listed for confirmation):

1. `frontend/src/redux/reducer/reducer.ts` — core: the group (Q2).
2. `frontend/src/redux/reducer/__tests__/undoGroup.test.ts` — new, oracle 1.
3. `frontend/src/components/editor-v2/hooks/instantiate.ts` — `beginUndoGroup` before the first create, `endUndoGroup` in a `finally` after the seeding is awaited and the layout written; the layout write takes `{x, y}` at the click and the per-viewpoint sizes of the WIP.
4. `frontend/src/components/editor-v2/hooks/__tests__/instantiate.test.ts` — the pure parts (layout targets, the point).
5. `frontend/src/components/editor-v2/EditorV2.tsx` — `runInstantiate` passes the flow point of the pane menu (a few lines at `:3051`).
6. `frontend/scripts/probe/onto-s2-instantiate.ts` — oracle 2 and S2-5o with the zoom-to-fit (separate `chore(probe)` commit, P13).
7. `docs/log-inbox/instance-of.md` — the lane's entry (docs commit).

Order: reducer + test (mutation bench) → instantiate + EditorV2 → typecheck/build/tests → probe (both paths) and
`undo-inline-edit.ts` on the branch and at `7999d5d5a` → stop for the GO before commit.

## Pre-existing defects found (proposed tickets, not fixed in S2u)

1. The legacy merge drops a later delta's `idlookup` patch (`U.tsx:903` via `reducer.ts:1256`): every merged entry in the app undoes incompletely (T2: slots and vertex survive). Fixing it globally changes the undo of every merged write: own lane.
2. `reducer.ts:1216` merges any graph create into the top entry at any age: the root of ticket (a) (T4, 1753 ms).
3. `reducer.ts:1210` reads the user stack at the `all` stack's length: «`statehistory[action.sender].undoable[statehistory.all.undoable.length-1]`»; equal only while one sender writes.
4. `reducer.ts:1286` «`if (Object.keys(delta).length === 1) {`» never holds: `timestamp` and `timestampdiff` are set on the delta first (`:1207-1208`).
5. After an incomplete undo the sync pushes a cleanup entry (T2, +190 ms), which costs the user a dead press.
6. `createVertexForObject` right after `createInstance` yields two vertices for one object (T4); cause not isolated.

## Decisions awaiting Alfonso

1. The group lives in the reducer's history (`reducer.ts` only, `action.ts` untouched), not in `BEGIN`/`END`/`TRANSACTION`: yes?
2. Exact contents for group entries only, the legacy shallow merge kept elsewhere (defect 1 ticketed): yes, or fix it globally now?
3. Membership: same-sender writes while open join the group (R1), 10 s cap, undo/redo closes it: yes?
4. Class-node path: where the instance goes in the object diagram, where there is no click: Step 2bis grid (today), the object diagram's viewport centre, or beside the last instance of the class?
5. S2-3m «unchanged» read as: bare `createInstance` leg +2 unchanged, `instantiate` leg +1, presses may fall from 2 to 1: yes?
6. Phase 2 touches 7 files (list above): confirm.

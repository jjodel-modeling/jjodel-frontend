# Layer Impact Report: the JjScript settle waits for in-flight dispatches (T8f option A)

- Prompt-ID: P-2026-11-08-1759. Discovery: `docs/discovery/discovery_2026-11-08_t8f_reorder_hole.md` (commit `000a8f1f4`, branch `textual-t8e-match`).
- Core change, rule 5, approved by Alfonso on 2026-11-08 17:58 («si a tutto» on option A). Files: `frontend/src/redux/action/action.ts`, `frontend/src/jjscript/executor/commands/instance.ts`.
- Written before the diff. Read, not measured, unless marked.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)       what each action writes is unchanged; a read happens later
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Redux action dispatch (action.ts): not in the template; core, rule 5. A counter only
  [x] JjScript executor (instance.ts): not in the template; the settle before a slot read

action.ts:
  - What changes: Action.fire, on the branch that schedules the dispatch, counts it (+1 before the
    setTimeout, -1 as the first statement of its callback), and a new export reads the count.
  - What does NOT change: the dispatch stays a setTimeout(0); the payload, the order of the dispatches,
    the branch that buffers inside a transaction, the 300 ms interval (reducer.ts:1549), COMMIT, END,
    FINAL_END, the AT_TRANSACTION and AFTER_TRANSACTION queues.
  - The count cannot leak: the callback of a scheduled timer always runs and decrements before dispatch,
    so a dispatch that throws still leaves the count right.
  - The count covers every fire outside a transaction, not only composites: a single action fired alone
    is in flight in the same way.

instance.ts:
  - What changes: settlePendingWrites, after its own timer, polls until the count is 0, up to a bound of
    1000 ms. If the bound expires it warns once per page and returns.
  - Why 1000 ms: the worst fire-to-dispatch gap measured is 179.7 ms over 691 dispatches fired outside
    the settle (T8f report, F2, t8f-timeline3 and t8f-control). The bound is over five times that. Past
    it the read is as stale as it is today, so an expiry is the old behaviour plus a log line, never a
    hang; a longer bound would only make a pathological line slower.
  - What does NOT change: the COMMIT and the timer of the settle; what a line writes; the planning of a
    write (referenceWrite.ts); the reducer's write past the end (reducer.ts:285-289), left as it is.

Callers of settlePendingWrites (instance.ts, all M1 script lines):
  - :828  delete instance, before the delete plan reads the store
  - :1149 unlink, before the slot read
  - :1225 link (+=, -=, =), before the type check and the slot read
  Each one now waits for a dispatch in flight instead of reading past it. Nothing else differs: when no
  dispatch is in flight the loop does not iterate, and the settle costs what it cost.

Callers of the async flush COMMIT(undefined, false), none waits on the new count:
  - reducer.ts:1549 the interval; reducer.ts:1696
  - PreviewBar.tsx:51 flushPendingCommit (a 300 ms sleep follows it at the end of a run)
  - ProjectEditor.tsx:1756 (project open), :2134 and :2261 (nested creation, run undo step)
  - openTextualTab.tsx:183, :229, :236
  - instance.ts:412 the settle itself
  Their timing and behaviour do not change. The same in-flight window exists for those that read right
  after a flush and is out of this lane's scope: ticket material only if one is shown to fail.

AT_TRANSACTION callbacks, the reason the dispatch is async (action.ts:352 comment):
  - MTM.tsx:118, :395, :438, :453, :461, :476 (clearCache); Measurable.tsx:225; reducer.ts:1603.
  - They run in FINAL_END right after ca.fire(), before the dispatch macrotask. The dispatch stays async
    and FINAL_END is untouched, so their order against the dispatch is the same. The wait runs in the
    async continuation of a script line, never inside FINAL_END or a callback.

Cross-layer interaction: a script line reads the slot later, by the time an in-flight dispatch takes.
The sync layer sees the same actions in the same order.

Risk:
  - A line slows only when a dispatch is in flight at its settle, by the rest of that dispatch's wait;
    measured in the closing report (run time of a reorder before and after).
  - A steady stream of unrelated dispatches could hold the count above 0: the bound caps it at 1000 ms
    per line, and the log says so.
  - Vitest suites that mock action.ts with only COMMIT and reach the settle need the new export in the
    mock (m1Containment, m1Operators, m1SetLists, instanceDelete): a test-file edit, no behaviour.

Smoke-test scenarios potentially affected:
  - reorder of a multi-valued containment through the Text tab apply: no null hole, order as written
  - a script with link, unlink and delete instance lines on the same slot: as before, without stale reads
  - project open and the nested-object creation: untouched, COMMIT flush callers do not wait
  - undo of a script run as one step: same actions in the same order

Uncertain about propagation: no. Rule 12 untouched, no TRANSACTION added.
```

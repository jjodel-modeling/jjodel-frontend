# Discovery 2026-10-30: JjTL in the app, nested creations materialized one level deep only (P-2026-10-30-1335, Phase 1)

- Prompt-ID `P-2026-10-30-1335` (task), continued by `P-2026-10-30-1440` (run 2, report, LIR). Prompt files:
  `docs/prompts/claude_2026-10-30_1335_prompt_jjtl_nested_materialization.md` and the 1440 continuation. Chat
  `C-2026-10-30-1253`, front `release-3-2`. Sessions `402fd3eb-bff6-4866-9f6b-780cf72044ea` (code read, run 1, cut at
  the context ceiling, handoff `~/.jjodel-lanes/P-2026-10-30-1335/handoff.md`) and
  `e3d18de7-3dbf-4779-8780-b936eea0a595` (run 2, this report). Executor: Anthropic Claude Opus 5.5.
- Tree `~/jjodel-w-jjtlmat`, branch `jjtl-nested-materialization`. Code read at `37956343a`; HEAD `77b2af9b8` adds only
  the 1440 prompt file, so every line number below holds on both. No product file was changed.
- Tags: **M** measured by the probe in this phase, **R** read in a file. The probe is
  `docs/discovery/harness/probe_2026-10-30_jjtl_nested_materialization.mts` (verbatim copy of the gitignored
  `frontend/scripts/smoke/_tmp_jjtl_nested_probe.ts`, run 2 version). Logs and JSON outside the repo:
  `~/.jjodel-lanes/P-2026-10-30-1335/probe_phase1_run1.{log,json}` (run 1),
  `~/.jjodel-lanes/P-2026-10-30-1440/probe-_tmp_jjtl_nested_probe.log` and `probe_phase1_run2.json` (run 2).
- This report is a set of hypotheses with evidence; whoever uses it re-reads the real files.

## 0. Answer in brief

1. **The hypothesis holds (R).** The collection step reads only the instances the executor registers per rule, which
   are the roots; STEP 6c resolves each parent by name among the roots, creates the children and never reads their
   own `__nested` features. Every creation at depth 2 or more is dropped without a word.
2. **The created child's slots are NOT available synchronously (M, run 1 and run 2).** `addObject` returns an object
   that is in the store at once, but its `$kids` is `undefined` in the same tick, after a microtask, after a macrotask
   and through a fresh `L.fromPointer(id)`. The slot answers (a `DValue` in the store, `addObject` a function) after
   **90 to 316 ms** (17 objects measured, one batch of 12 included). Once there, it accepts a further `addObject`, and
   so does the next level: three levels built, each in the right slot. A recursive STEP 6c must therefore wait per
   level.
3. **Two things the recursion will meet, measured.** (a) `addObject` with an explicit `name` refuses a second sibling
   of the same name in one slot (same tick and later), with a «Validation failed» toast; a sibling created without a
   name and renamed through its `$name` slot becomes a duplicate silently. (b) `addObject({ name }, cls)` on a class
   with **no `name` attribute is refused outright** (schema mismatch), so today's invented name
   `${childClassName}_${n}` drops every nested object of a nameless class, **at depth 1 too**; `addObject({}, cls)`
   creates it, and depth 3 under it works.
4. **Attributes written by the returned id, one second later, land at depth 2, depth 3 and on a nameless object (M).**
5. **Extra defect (R):** the STEP 8 timer guard (1949-1950) does not list `pendingNestedCreations`, so a run whose roots
   carry no attribute and no reference never runs STEP 6c at all.

## 1. Hypotheses under test, with verdicts

| # | Hypothesis | Verdict | Evidence |
|---|------------|---------|----------|
| H1 | The collection step records nested creations only for the `__nested` values of the instances it iterates, i.e. the roots | **holds** (R) | §3 F1, F2 |
| H2 | STEP 6c resolves each parent by name among `lModel.objects`, creates each child, queues its attributes and stops; depth >= 2 dropped silently | **holds** (R) | §3 F3, F4 |
| H3 | After `addObject` returns, the child's `$<feature>` slot is available synchronously and accepts a further `addObject` | **falsified** for "synchronously" (M); **holds** for "accepts" once the slot appears (M) | §4 |

## 2. Files read

- `frontend/src/components/project/ProjectEditor.tsx` (windows 1430-1442, 1617-1668, 1743-1751, 1798-1881, 1940-2051,
  2091-2173, 2244-2258)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (get_addObject 7284-7466; windows 7340-7356, 7396-7408,
  7440-7462; `setValueAtPosition` 8000-8002 read by the previous session)
- `frontend/src/model/logicWrapper/nameUniqueness.ts` (17-24, 137-152)
- `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (96, 150-167, 255-268, 805-871)
- `frontend/src/jjtl/__tests__/nested-feature-creation.test.ts` (106-112)
- `frontend/src/jjtl/SPEC.md` (§9.2, 628-673)
- `frontend/src/redux/action/action.ts` (210-226), `frontend/src/redux/reducer/reducer.ts` (1126-1158, 1217-1221,
  1274-1300)
- `frontend/src/events/registry.ts` (163)
- `docs/decisions.md` (R-S1-2, 4100-4104)

## 3. Findings from the code (R)

**F1. Only rule-level instances are iterated.** `ProjectEditor.tsx:1751`:
`result.targetModel.instances.forEach((instances: any[], className: string) => {`. Nested objects are not registered
there: `src/jjtl/__tests__/nested-feature-creation.test.ts:110`, «Nested objects are not registered in `instances`:
they live in the feature of the object that owns them.»

**F2. The nested values found on a root are queued by the root's name.** `ProjectEditor.tsx:1857-1862`:

```
pendingNestedCreations.push({
    parentName: objectName,
    parentClassName: className,
    featureName: key,
    children,
});
```

`children` are the executor objects themselves, each still carrying its own `__nested` features; nothing walks them.

**F3. STEP 6c resolves the parent by name among the roots and creates one level.** `:1984`
`const matches = rootObjects.filter((o: LObject) => o.name === pending.parentName);`, with `rootObjects` from
`lModelN?.objects` (1980), the roots only (comment 1436-1441: «`LModel.objects` returns `data.objects`, i.e. the roots
only»). `:2016` `const created = slot.addObject({ name: childName }, childClassName);`. The loop body
(2002-2043) reads `child.__type`, `child.className`, `child.name` and the keys in `childClass.allAttributes`; no key
of `child` that holds `__nested` objects is read. **No warning names them.** The warning «is neither an attribute nor
a resolved reference nor a nested creation» (1875-1879) runs only for root instances. SPEC.md 669-670 states «Every
value that does not reach the model is now named.» That is false below depth 1.

**F4. Child attributes go by the returned id on a +1000 ms timer.** Queue declared at 1665-1668 (comment 1662-1664: «keyed by the
REAL id the primitive returned — never by name»), filled at 2032-2034, written at 2144-2169 through
`LPointerTargetable.fromPointer(pending.objectId)` and `writeAttribute` (2091-2115), which writes through the slot:
`feature.value = attrValue` (2114).

**F5. Invented names for nameless children.** `:2012-2014`:
`const childName = typeof child.name === 'string' && child.name ? child.name : \`${childClassName}_${nestedCreated}\`;`
The name is passed to `addObject` even when the class has no `name` attribute. §4 X4 measures the consequence.

**F6. The STEP 8 guard omits the nested queue.** `:1949-1950`:
`if ((pendingAttributeSets.length > 0 || pendingReferenceSets.length > 0 || pendingChildAttributeSets.length > 0) && createdModelId) {`.
STEP 6c (1965-2050) sits inside that timer. `pendingChildAttributeSets` is filled only inside STEP 6c, so it is always
empty when the guard runs. `pendingAttributeSets` holds a root's whitelisted attribute values, `name` included when the
class has one (1804-1818), so the defect bites only when no root has an attribute value and none a reference.

**F7. The sibling-name gate of `addObject`.** `LModelElement.tsx:7398-7407`: an explicit `constructorPointers.name` is
checked by `checkNameUniqueness({ father, name })`; on refusal
`toast.error(uniq.reason as string, { title: 'Validation failed' }); ... return lobj;`. The namespace (R-S1-1,
`nameUniqueness.ts:17-21`): «the set of SIBLINGS under the same father, whatever their metaclass ... the other
LObjects held in the same containment», same-tick creations included (`pendingChildrenOf`, 137). R-S1-2
(`docs/decisions.md:4100`) makes `LObject.set_name` a consumer of the same verdict. Writing `$name.value` (the slot
path, `setValueAtPosition`, `LModelElement.tsx:8000-8002`) is not gated.

**F8. Schema refusal.** `LModelElement.tsx:7348-7355`: when no subclass conforms to the json,
`Log.ee("addObject(schema) could not find a valid subtype of " + metaclass + ...); return lobj;`. A `name` key on a
class with no `name` attribute is such a json (§4 X4).

**F9. Output panel and the result's timing.** The panel is `outputMessages` of `JjtlDevelopmentEnv.tsx` (96), written
only by `addOutputMessage` (261-263). ProjectEditor dispatches `SystemEvents.JJTL_EXECUTION_RESULT` and returns the
result (2251-2254) before any STEP 8 timer fires; the env's listener (156-166) only calls
`setResultFromExternal(result, 0)` (trace), not `addOutputMessage`. Whatever STEP 6c learns reaches the console only.

**F10. TRANSACTION, undo, re-run.** `TRANSACTION` is async: `BEGIN(); ... await func(); ... return END([]);`
(`action.ts:210-226`). `beginUndoGroup`: 0 occurrences in `ProjectEditor.tsx` (`grep -c`; positive control, same
command on `reducer.ts`: 2). The group API exists (R-JJD-6, `reducer.ts:1126-1158`); outside a group deltas within
`U.UpdatingTimer*1.5` may merge (`reducer.ts:1219`). Every run writes a new model: `generateUniqueModelName`
(`ProjectEditor.tsx:1619`); `isExecutingTransformation = false` at 2254, before the timers.

## 4. Measurements (M)

Fixture, seeded at M2 by JjScript: `Root(name).nodes<> Node*`; `Node(name, label).kids<> Node*, .leaves<> Leaf*`;
`Leaf(value: EInt, no name).subs<> Node*`. Roots `r1..r6` made as STEP 6 makes them (`DObject.new(..., true)` in a
`TRANSACTION`); every nested object by `LValue.addObject`, from inside a `setTimeout`, as STEP 6c runs. Neutral names
only. Dev server on 3135 from this worktree, Chromium via Playwright, 0 page errors in both runs.

**Run 1** (session 402fd3eb, 2026-10-30 ~14:2x, 12 FAIL of 21 checks, most of them the expected "slot not there" — the
checks assumed synchronous slots). Measured: the returned child is in the store at once (`objInStore: true`), its
`$kids` is `undefined` synchronously, after a microtask, after `setTimeout 0`, and via a fresh `L.fromPointer(id)`;
present at 700 ms. A no-name sibling renamed via `$name.value = 'dup'` became `dup` beside an existing `dup`. X4-X6 of
run 1 inconclusive (they ran before the slot existed).

**Run 2** (this session, 2026-10-30, `DONE failures=2`, `EXIT=0`). The checks state the expected finding; a FAIL is a
finding.

| Exp. | What | Result |
|------|------|--------|
| X1 | slot timing per level, polling every 10 ms | child `$kids`: not usable in the same tick (re-measured); answers at **184 ms**. Grandchild created there, its slot at **316 ms**; great-grandchild at **290 ms**. `g1` sits in `n1.kids`, `gg1` in `g1.kids`. The proxy `addObject` returned also answers once the slot exists. |
| X2 | 12 children in one synchronous loop | 12 created; every slot answers at **92 ms**; slot order = creation order `c0..c11`. Undo counter `statehistory.all` delta 0: no signal (P12), undo not measured. |
| X3 | homonyms | same slot, same tick: first `ok`, second **refused**; same slot, 900 ms later: **refused**; toasts «Validation failed» / «Name "dup" already used by Object "dup"». Created with `{}`: `ok`, automatic name `Node_0`; then `$name.value = 'dup'`: `kids = ["dup","dup"]`, no toast. Same name in another slot of the same owner: **inconclusive**, the only other slot holds `Leaf`, refused for F8, not for the name. |
| X4 | class with no `name` attribute | `{ name: 'Leaf_0' }`: **refused** («could not find a valid subtype of Leaf conforming ot that schema», F8). `{}`: created, `name` reads `Leaf_0`; its `$subs` answers at 304 ms; a `Node` created there sits in `Leaf_0.subs`. |
| X5 | attributes by id, 1000 ms after creation | `label` at depth 2 and 3, `value` on the nameless `Leaf`: all written and read back. |

Time-to-slot over the 17 objects measured: 90 to 316 ms, clustered near 90, 185 and 300 ms. The cause of the
clustering is not established. Not measured: a batch of hundreds, or a page under the load of a large transformation.

## 5. What Phase 2 has to do, read against the findings

1. Walk the executor tree level by level: after a level's `addObject` calls, wait for the created children's slots,
   then create the next level against **the returned id** (F3, X1, X5). Root parents keep the name lookup and R-S1-5.
2. Create nested children without a name in the json when the class has no `name` attribute (F5, X4). Whether named
   classes do the same is question 2.
3. Keep `addObject` outside the STEP 6 TRANSACTION (CLAUDE.md §3.3, rule 12): it opens its own per call
   (comment 1966-1969). Attributes of every level on one pass after the last level (X5).
4. Count and name what is not placed (wrong feature, class not found, refusal, slot timeout) and send it to the
   output panel (F9, question 5).
5. Add the nested queue to the STEP 8 guard (F6, question 3).

## 6. Test strategy for Phase 2

- The store cannot load in vitest: `environment: 'node'`, and the `joiner` barrel reads `window` (CLAUDE.md §17,
  `frontend/src/jjtl/CLAUDE.md`). A three-level test with the real store is therefore a **browser probe**.
- Logic that does not need the store goes into a pure module under `frontend/src/components/project/` (the walker:
  level plan from the executor output, parent by returned id, name policy, per-level wait with an injected
  `waitSlot` and clock, unplaced accounting), tested in vitest with fake slots on the neutral fixture
  (root > child > grandchild > great-grandchild, two same-named siblings at depth 3, a nameless class at depth 2).
  Precedent: `frontend/src/model/nameLookup.ts` (CLAUDE.md §5, source-text tests are not a substitute).
- The before/after proof runs on the probe, extended to drive the real Execute path in the app, with the
  ProjectEditor diff reverted by `git apply -R` of a saved diff (no stash). The chat runs the confidential case by hand
  (visual checklist of the 1335 prompt).

## 7. Risks

- **R1 load.** The slot delay is measured on at most 12 objects per batch; a level of hundreds is not measured. A cap
  too tight drops a level; the warning and the panel report make that visible rather than silent.
- **R2 duplicates in the output.** If homonyms are materialized (question 2), the model holds same-named siblings;
  the uniqueness check of `editor-v2/problems/` is expected to flag them (not verified).
- **R3 user interaction during materialization.** Levels complete seconds after Execute returns (2254). A second
  Execute writes a new model (1619) and does not touch the first; editing the output model before the last level lands
  is not guarded today either (STEP 8 already runs +1000 ms).
- **R4 undo.** A run is not one undo step today (F10); deeper trees spread more deltas over more time. Not changed
  here.
- **R5 behaviour change at depth 1.** Dropping the invented name changes what depth-1 nested objects of a nameless
  class look like: today they are refused (X4), tomorrow created with the automatic name.

## 8. Open questions

1. Deferral per level: event or poll on the slot, and the timeout? Recommended: poll the created child by id every
   50 ms until every slot the next level needs answers, cap 3000 ms per level from that level's last creation (10x the
   316 ms measured), on timeout drop that subtree with a warning and count it as unplaced; no store-wide subscription.
2. Same-named siblings under R-S1-2: an explicit name is refused in one slot (X3). Recommended: create every nested
   object with `{}` and write `name` with the other attributes by id on the deferred pass (the slot path, X3, X5), so
   the output matches the executor's object by object; the problems overlay flags the duplicates.
3. STEP 8 condition at 1949: Recommended: add `pendingNestedCreations.length > 0` to the guard in Phase 2, one
   clause, leave `pendingChildAttributeSets.length > 0` in place (rule 9).
4. Nameless classes: Recommended: never send `name` to `addObject` for a class whose `allAttributes` has no `name`
   (subsumed by question 2 if `{}` is adopted for all), and accept the depth-1 behaviour change of R5.
5. How do unplaced objects reach the output panel? Recommended: a new constant in `events/registry.ts` (e.g. under
   `SystemEvents`), dispatched by ProjectEditor after the last level with `{ count, paths }`, a listener in
   `JjtlDevelopmentEnv.tsx` calling `addOutputMessage`; plus the SPEC §9.2 sentence corrected (F3). These are 3 files
   beyond the prompt's scope; with ProjectEditor, the walker module and its test the lane reaches 6 files (rule 19):
   approve the list at the hard stop.
6. SPEC.md is a doc inside `frontend/src`: one commit with the code, or a docs commit of its own (P13)?
   Recommended: a docs commit of its own, right after the code commit.
7. Undo grouping of a transformation run: Recommended: out of scope, a ticket for a later lane.

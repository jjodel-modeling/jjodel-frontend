# Discovery 2026-10-21 — useJjomSync re-transforms every vertex on every render (fix 1 of round 2)

- Prompt-ID: P-2026-10-21-0035 (chat C-2026-10-20-0839), Phase 1, read-only on product code
- Prompt: `docs/prompts/claude_2026-10-21_0035_prompt_jjomsync_incremental.md`
- Session: `84204e59-3a19-410d-884f-b7115f9bd0f3`
- Tree: `~/jjodel-w-jjomsync`, branch `jjomsync-incremental`, HEAD `6a4cc3116` (all measures on this version, plus the
  probe step of this lane)
- Executor: Anthropic Claude Opus 5.5 (session banner)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
  the real files.

## 1. Objective

Round 2 (`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md` §3.2, §3.3, §3.6) measured that the
incremental effect of `useJjomSync` re-transforms every vertex, because `prevModel` is forced to `{}`, and that it
runs 8 times in one drag with one store dispatch. Find (a) why `prevElements` sometimes holds the new element, with a
reproduction; (b) what the isSingleton bug was; (c) why the effect runs repeatedly during a drag; (d) the minimal
correct fix, its layers and regression risks, with the saving measured by ablation.

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `prevElements` holds the new element because something writes into the previous state's D-object in place | **holds** (§3.1, reproduced) |
| H2 | the isSingleton bug is GitHub issue #67 and its cause is H1 | **holds** (§3.2) |
| H3 | the repeated runs during a drag come from store dispatches the probe does not see | **falsified**: they come from `Date.now()` in the effect's deps, one run per host render (§3.3) |
| H4 | both workarounds can go now, because the cause of H1 was fixed in the reducer on 2026-10-03 | **partly**: H1's cause is gone (§3.1), but the forced refresh also masks dependencies the snapshot does not track (§3.5) |

## 3. Findings (measured unless tagged «read»)

### 3.1 Why `prevElements` sometimes held the new element (a)

«read»: the reducer copies a path segment only where the action's path diverges from the previous action's;
`frontend/src/redux/reducer/reducer.ts:97-104`:

```
if (alreadyPastDivergencePoint || key !== prevActionPathKey) {
    // se l'oggetto è stato già duplicato in una azione composita, non lo duplico 2 volte.
    ...
    current[key] = Array.isArray(current[key]) ? [...current[key]] : {...current[key]};
```

and a no-op action returns the state it received, dropping its copies (`reducer.ts:422`
`return gotChanged ? newRoot : oldStateDoNotModify;`). Until `ac64b213b` (2026-10-03, P-2026-10-03-1632) the previous
action was `actions[i-1]` even when that action was a no-op, so the next write on the same element reused copies that
did not exist and wrote into the previous state's object. Today (`reducer.ts:505-510`, `:547`):

```
// The previous action whose copies the next one reuses must be the last one that CHANGED the state: a no-op
// returns the state it got and drops its copies, so reusing its path would write into the previous state
let lastApplied: ParsedAction = undefined as any;
...
if (tmp !== newState) lastApplied = action;
```

Consequence for the sync: the previous state's DClass is mutated, so `elementSnapshots.get('model:'+id)` and
`prevElements.get('model:'+id)` are the same object (`useJjomSync.ts:1330-1332`); the `ch:` hash does not include
`isSingleton` or `final` (`useJjomSync.ts:1082-1101`), so the comparison at `:1338` skips the vertex, and since
`mapReferenceEqual` sees no changed entry, `elementSnapshots` does not even change and the effect does not run.

Reproduction (measured, temporary test `frontend/src/redux/reducer/__tests__/_tmp_singleton.test.ts`, built on the
harness of `reducerCopyOnWrite.test.ts`, deleted after the run): state with `C1 {className:'DClass', final:true,
isSingleton:false}`, one `CompositeAction` with `set('C1','isSingleton',true)` and `set('C1','final',true)` (the
shape `LClass.set_singleton` dispatches, `LModelElement.tsx:3039-3042`; sorted by path, `final` comes first and is a
no-op). Assertions: new state `isSingleton === true`, previous object `isSingleton === false`, new reference differs.
- current reducer: 1 passed (`.agent-logs/tmpsingleton-20261021-005413.log`);
- `reducer.ts` line restored to `const prevAction: ParsedAction = actions[i-1];` (temporary, reverted by
  `git checkout --`): 1 failed, `AssertionError: expected true to be false` on the previous object's `isSingleton`,
  i.e. the write landed in the previous state (`.agent-logs/tmpsingleton-pre-*.log`).

### 3.2 The isSingleton bug (b)

- GitHub issue #67, «Singleton attribute not applied on classes» (rik1599, closed): «In metamodel editor, if you set
  a class as Singleton directly, its view is updated correctly ... but if you toggle the Final flag before the
  Singleton flag the view is not updated.» This is exactly the §3.1 shape: with `final` already true, the `final`
  write inside `set_singleton` is the no-op that precedes `isSingleton`; set directly, `final` changes and the copy
  is made.
- Damiano's commits of 2026-05-21 («read», `git show`): `22a123a01` «Update useJjomSync.ts» adds
  `useJjomSync.ts:1331-1334`:
  ```
  // damiano: this is wrong. it is sometimes taking newElement instead. source of isSingleton bug
  let prevModel = prevElements.get(`model:${id}`);
  // forcing to update by giving it a different object, until it gets a better fix.
  prevModel = {} as any;
  ```
  `6d205bc9f` «missed a change to fix #67» adds `Date.now()` to the deps, `useJjomSync.ts:1533-1534`:
  ```
  }, [isJjomMode, elementSnapshots, subElementIds, scheduleFlush, Date.now()]);
  // todo: remove Date.now() from dependencies, it forces update to fix singleton issue but it's sub-optimal
  ```
  Both were needed together: the first makes every run re-transform every vertex, the second makes the effect run at
  all when the snapshot did not change (§3.1). Neighbours `8fad3db6c` «Fix bug #67» (one line in `PaletteData.tsx`)
  and `616e94fcd` (`classes.ts`, models from state) do not touch the sync.
- No test covers the #67 sequence (measured, `command grep` over `frontend/src` test files): 9 test files mention
  `isSingleton` (positive control: the search has signal); of the five under `editor-v2`, only
  `syncDeleteObjectAsEdge.test.ts` mentions `final`, and none mentions `#67`. `reducerCopyOnWrite.test.ts` covers the
  defect on the slot shape (`isMirage` + `values.N`), not on a class flag.

### 3.3 Why the effect runs repeatedly during a drag (c)

`Date.now()` changes on every render, so the effect runs after every render of its host, `EditorV2Inner`
(`EditorV2.tsx`, the only caller of `useJjomSync(`), whatever the store did. During a drag the host re-renders on
React Flow's own node changes (`useNodesState`, `EditorV2.tsx:480`), not on store dispatches. One run re-transforms
every vertex with 3051 `LObject.name` reads (the reference target names), measured as the difference between runs:

| dev, one run each | open | click 1 | click 2 | drag | commit | vp |
|---|---|---|---|---|---|---|
| baseline, long tasks ms | 6680 | 1197 | 1132 | 5496 | 2465 | 3154 |
| baseline, `LObject.name` reads | 72,309 | 8146 | 8141 | 50,854 | 38,950 | 14,242 |
| baseline, `EditorV2Inner` renders | 9 | 2 | 2 | 16 | 2 | 4 |
| D (`Date.now()` out), long tasks | 5031 | 1056 | 1041 | 2833 | 2346 | 2346 |
| D, reads | 47,901 | 5095 | 5090 | 5089 | 35,899 | 2038 |
| DP (both out), long tasks | 4842 | 549 | 695 | 2584 | 2042 | 2325 |
| DP, reads | 44,850 | 2055 | 2040 | **2049** | 32,849 | 2038 |

Reading: baseline drag 50,854 = 2038 + 16 × 3051, one run per host render (16), with one store dispatch (the drop);
a click is 2 runs (8146 = 2044 + 2 × 3051). Without `Date.now()` the drag is 1 run (5089 = 2038 + 3051). Without both,
only the vertex whose D-object changed is re-transformed (2049). Round 2's `sync` ablation (`prevModel` only) measured
2055 reads and 2297 ms: there the effect still ran 16 times, each run cheap. Probe:
`frontend/scripts/probe/large-model-click-profile.ts`, `CLICK_STEPS=open,drag,commit,vp`, logs
`~/.jjodel-lanes/P-2026-10-21-0035/probe-large-model-click-profile.log`, JSON
`frontend/.vite-cache/perfclick-jjs-{base-r1,abl-D-r1,abl-DP-r1}.json`. Dev single runs carry ±30 % (round 2 §3.6).
DP r2 and r3: see §3.6.

### 3.4 Where the time is not

The rename commit (2042-2465 ms) is still `detectDuplicateNames` (≈ 30k reads, fix 2 of round 2, other lane), and
the open still pays ≈ 42k reads outside the sync. Neither is in scope here.

### 3.5 What the forced refresh masks: dependencies the snapshot does not track (risk of H4)

«read»: the selector (`useJjomSync.ts:1065-1148`) tracks, per vertex, the vertex D-object, its model element
D-object, and a hash over the model element's children's `name`, `type` id, bounds, `abstract`, `composition` and
`values`, plus the enum literal names of the metaclass's attributes. The transformers read more
(`frontend/src/components/editor-v2/utils/jjomTransformers.ts`):

| Node | Read by the transformer, not in the snapshot |
|---|---|
| object (`:298-482`) | metaclass name `instanceOf.name` (:308); reference target names `rv.name` (:366-367; the hash has the target ids only); the M2 feature's `name`, `upperBound`, `lowerBound`, `derived`, `annotations`, `type.name` (:344-347, :407-409, :436, :446), read through `fv.instanceof`, not the DValue |
| class (`:89-225`) | `attr.type.name` and `p.type.name` (:102, :142; the hash has the type id), `defaultValueLiteral` (:103), `ref.type.name`, `ref.opposite.name` (:126-127), operation parameters (:138-143, not hashed), cross-metamodel ghost parents and targets (:161-195) |
| enum (`:230-262`) | literal `value` (:241) |

With `prevModel = {}` plus `Date.now()` all of these refresh at the next host render, which follows any change of
the snapshot. Without them they refresh only when the vertex's own entries change.

Measured, partly: a dev-only `audit` step added to the probe compares, for every rendered node, the `data` its node
component holds (props read off the fiber) with a fresh `jjomVertexToRFNode` of its vertex, after targeted writes
through L proxies (abstract syntax, `CLICK_VP=-`):
- at rest 0 stale of 407 (M1) and 0 of 46 (M2), baseline and DP: the comparison is clean;
- the attribute slot edit (positive control of a tracked dependency) refreshes in both;
- after renaming a reference target (`Alfonso`), the referencing node read back `Alfonso_r` in baseline and `Alfonso`
  in DP at the next step;
- the M2 «reference type renamed» row leaves 2 stale class nodes in baseline and DP alike (a hole that exists today);
- limits: the L-proxy writes land asynchronously (the synchronous check reads `not landed`, the next step sees the
  value), so the stale counts after renames depend on the 1.5 s wait and are not taken as a measure; the #67 row
  found no class of the fixture that is unextended, not final and without instances (`none`), so #67 is reproduced
  at the reducer (§3.1), not on the canvas.

### 3.6 Timing medians (DP)

Long tasks in ms, dev, DP r1, r2, r3 (`perfclick-jjs-abl-DP-r{1,2,3}.json`), against round 2's dev baseline median:

| Step | DP r1, r2, r3 | DP median | round 2 baseline median | this lane's baseline r1 |
|---|---|---|---|---|
| open | 4842, 6412, 4498 | 4842 | 6279 | 6680 |
| click 1 | 549, 830, 832 | 830 | 868 | 1197 |
| click 2 | 695, 789, 758 | 758 | 905 | 1132 |
| drag | 2584, 2766, 2535 | **2584** | 4422 | 5496 |
| commit | 2042, 2341, 2135 | 2135 | 1990 | 2465 |
| vp | 2325, 2504, 2638 | 2504 | 3233 | 3154 |

Name reads per drag 2049 in all three runs (acceptance ≤ 2100: met). Drag median 2584 ms: the acceptance «≤ 2.3 s
dev median» is **not met** by the removals alone; 2.3 s came from round 2's one `sync` run (2297). The rest of the
drag is outside the sync (round 2 §3.2: `measureIntrinsic`, proxy `get0`, `parsePathPoints`, xyflow). Commit is
within noise of the baseline (the commit's cost is `detectDuplicateNames`).

## 4. The fix (d)

Proposed for Phase 2 (files: `frontend/src/components/editor-v2/hooks/useJjomSync.ts`, a new pure module
`frontend/src/components/editor-v2/sync/vertexSnapshot.ts` and its test
`frontend/src/components/editor-v2/sync/__tests__/vertexSnapshot.test.ts`; the probe step is already committed):

1. Remove `Date.now()` from the deps (`:1533-1534`) and the `prevModel = {}` override (`:1331-1334`): the cause they
   worked around is fixed in the reducer (§3.1). Measured saving: drag reads 50,854 → 2049, long tasks 5496 → 2584
   (one run), click 1197 → 549, vp 3154 → 2325, open 6680 → 4842.
2. Move the per-vertex hash out of the selector into `vertexSnapshot.ts` (pure, `idlookup` in, number out, importable
   by vitest without the `joiner` barrel) and extend it with the raw reads of §3.5: metaclass name, reference target
   names, the M2 feature's name, bounds, `derived`, type name and annotation sources, attribute/reference/parameter
   type names, `defaultValueLiteral`, opposite name, operation parameters, enum literal values, ghost parent/target
   names. Raw `idlookup` reads, no proxy: the selector already runs on every dispatch.
3. Anti-bounce: a vertex skipped by `isCanvasUpdated` (`:1326`, 300 ms window, `sync/syncState.ts:78`) keeps its old
   entries in `prevElements` (`:1411-1424`) and was re-synced at the next host render. Without `Date.now()` it waits
   for the next snapshot change. Schedule one re-run after the window when a run skipped any id (a local tick state),
   instead of one run per render.

Layers: sync (`useJjomSync`) and canvas v2-flow (which nodes get patched). Not touched: D-layer writes, reducer,
L-layer, JjOM, persistence, edges (`jjomEdgeToRFEdge` path unchanged; edge entries keep their comparison).

Tests red first, executing code: (i) the pure hash changes for each dependency of §3.5 and stays equal for an
unrelated write (mutation bench: drop each term, one test dies per term); (ii) the #67 reducer shape as a regression
row in `reducerCopyOnWrite.test.ts` (out of the listed layer: needs the GO's consent); (iii) probe acceptance: drag
≤ 2.3 s dev median and ≤ 2100 name reads; click, open, vp not worse; audit rows at rest and after the renames with 0
stale after a longer wait.

## 5. Dependencies and risks

- Critical zone (`useJjomSync.ts`, CLAUDE.md §3.1): Layer Impact Report first in Phase 2 (RC-30).
- Stale nodes: any transformer read missing from the hash shows an old value until that vertex changes. The list in
  §3.5 is from reading three functions; a node type added later must extend the hash (the module's JSDoc says so).
- Singleton vertices (`isSingletonSuppressed`, `:1264`, `:1188`) only gate additions; unchanged by the fix.
- M1 slot edit refresh: tracked by the hash today (`values`), measured refreshing in DP.
- Containers R-GV-*: a container/child relation drawn from `father` or a children channel is a layout read, not in
  `jjomVertexToRFNode`; not measured here, the Phase 2 smoke must open a viewpoint with containers.
- Any other in-place write to the previous state (outside the reducer) would bring back H1 silently; none found, but
  the search was not exhaustive (a `c.data.x =` assignment on an L proxy would be one).

## 6. Not measured, with the reason

- #67 on the canvas: no candidate class in the fixture (§3.5); reproduced at the reducer.
- Production numbers for D and DP: one build per ablation (≈ 4 min each); round 2 shows dev 15-27 % slower.
- Whether a run of the sync without `Date.now()` misses the first render after a viewpoint switch that changes
  `graphInfo` but not `elementSnapshots`: the vp row refreshed (2038 reads = no run), and the init effect covers a new
  graph.

## 7. Open questions

1. GO for Phase 2 with the three files of §4, plus the regression row in `reducerCopyOnWrite.test.ts` (redux layer)?
2. Hash extension (§4.2) or a narrower fix (only the two removals, accepting the §3.5 staleness until a vertex changes)?
3. The 2 stale class nodes after a reference type rename exist today: fix them in this lane (same hash) or ticket?
4. Drag acceptance: keep ≤ 2.3 s dev median (not met by the removals: 2584 over three runs), or set it to ≤ 2.7 s
   with the read count ≤ 2100 as the hard criterion?

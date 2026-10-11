# Discovery — M1 edge gesture inert on instances of a subclass added while the model tab is open

- Prompt-ID: P-2026-10-11-1025 (`docs/prompts/claude_2026-10-11_1025_prompt_m1_edge_gesture_subclass_instances.md`), Phase 1, read-only
- Session: a6f00af3-004f-4c05-b449-4d796cb08aa3
- Tree: `~/jjodel-w-subclassedge`, branch `fix-subclass-edge-gesture`, HEAD `385058377` (two prompt-only docs commits on `cbbc1a204`)
- Executor: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

**H3 holds.** On the mounted model tab, the gesture reads `useEditorMode`'s memo (`modeInfo.allClasses`).
That memo is keyed on `metamodelClassSignature` (`useEditorMode.ts:120-185`). The signature lists each class's id,
name, abstract, singleton flag, and its *own* reference and attribute names. It does **not** list `extends`.
Adding a superclass link writes only `DClass.extends` (`LModelElement.tsx:3545`), so the signature does not change
and the memo is never recomputed. It keeps the pre-link ancestry: `Initial.references = []` (no inherited
`outgoing`/`substates`) and `State.concreteSubclasses = []`. `onConnectEnd` then gets no compatible reference from
`getCompatibleReferences` and returns silently (`EditorV2.tsx:1789-1790`). Reopening the tab remounts the hook, so
the memo is recomputed and the gesture works. The Properties panel works because `LValue.get_validTargets` reads
`isSuperClassOf` live on every render (`LModelElement.tsx:8133`).

**Measured** in the real app, dev server on 3141, three runs with identical verdicts (runs 3, 4, 5):
- Mounted tab, after `extends State` on Initial, Terminal and the pre-existing class Choice, gestures A1–A5 do
  nothing. In every case xyflow reports `isValid: true`, the drop lands on the target node, and there is no popup,
  no slot value, no D edge, no DOM edge and no console line.
- After closing and reopening the tab, gestures B1–B5 each create exactly one edge plus the slot value.
- State controls C0, A0, A0t and B0 work in both states.
- In-page, `getCompatibleReferences` over the memo returns `[]` for all five subclass pairs. Over a fresh
  `getMetaclassInfo` it returns `outgoing`, `source,target` and `substates`.

**H1 is falsified**: the gesture does use ancestry (`concreteSubclasses`), and it works once the memo is fresh.
**H4 is falsified**: no value is written and `guardLink` is never reached, so no pair guard is involved.

**Proposed fix F1** (one line, outside the critical zone): add the class's `extends` ids to the per-class part of
`metamodelClassSignature` in `frontend/src/components/editor-v2/hooks/useEditorMode.ts:182`. This follows the same
pattern as `83d2bb3fa` (feature names added for renames, 2026-07-28). No Layer Impact Report is required: the file
is not in `CLAUDE.md` §3.1, and there is no D-layer write.

**Phase 2 files**: `hooks/useEditorMode.ts`; `hooks/__tests__/useEditorMode.test.ts` (new, red first);
`frontend/scripts/probe/subclass-edge-gesture.ts` (new, the probe as acceptance); at closure, the inbox
`docs/log-inbox/subclass-edge-gesture.md` and the Status line.

**Questions**
1. F1 only, with the other signature gaps (§5.2) left to a ticket? Recommended: yes.
2. Commit the probe for Phase 2 acceptance, with B0t as a measure (§5.3)? Recommended: yes.
3. Ticket for B0t (xyflow `isValid: false`, no inheritance)? Recommended: yes, low priority.

## 1. Hypotheses under test

| Id | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| H3 | A memo, ref or cache on the model-canvas gesture path depends on the metamodel through a key that a superclass link does not change, so it keeps the pre-change ancestry | **holds** | §3.1 (read) and §4.2–4.4 (measured): `useEditorMode` memo, signature without `extends` |
| H1 | The gesture compares exact class identity instead of ancestry | **falsified** | `compositionCompat.ts:113-115` reads `concreteSubclasses`; B1–B5 work on fresh memo (measured) |
| H4 | The value is written but the pair guard (`hasCanvasEdgePair`) drops the edge | **falsified** | A1–A5: slot values unchanged, no `[BUG-DIAG-GUARD]` line, which `checkLinkCreation` prints whenever `handleM1ReferenceSelected` runs (`ConformanceGuard.ts:70`) |

## 2. Files read (full paths)

- `/Users/alfonso/jjodel-w-subclassedge/CLAUDE.md`, `docs/PROTOCOL.md` (whole), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/claude-code-log.md` (head), `docs/decisions.md` (R-SIM-8, R-MCID-1/2), `docs/log-inbox/stale-m1-edge.md`
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (whole, 529 lines)
- `frontend/src/components/editor-v2/EditorV2.tsx` lines 600-625, 696-697, 805-870, 1700-1960, 1980-2082, 2320-2470, 3672-3690, 4700-4830
- `frontend/src/components/editor-v2/utils/compositionCompat.ts` (whole), `utils/connectionValidity.ts` (whole)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` lines 209-289, 725-742, 1195-1260, 1491-1530, 1764-1830
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` lines 90-100, 260-315 (window); `components/M1ReferencePopup.tsx` lines 145-190
- `frontend/src/model/logicWrapper/LModelElement.tsx` lines 2705-2776 (DClass), 3150-3165, 3510-3600, 8111-8140
- `frontend/src/model/conformance/useConformanceGuard.ts` (whole, 61 lines)
- `frontend/src/components/abstract/DockManager.tsx` lines 20-60, 97-172; `components/abstract/tabs/TabDataMaker.tsx` lines 1-50; `components/abstract/tabs/InstanceManagerTab.tsx` lines 1608-1625
- `frontend/scripts/probe/stale-m1-edge.ts`, `scripts/probe/bpmn-lanes-fixture.ts` (gesture idiom), `scripts/smoke/states.ts` lines 1-40, 179-240, `scripts/lane-run.mjs` lines 1199-1330
- `frontend/src/__tests__/fixtures/xmi-m1/StateMachine.ecore`, `sample-StateMachine.xmi`
- `frontend/src/components/editor-v2/hooks/__tests__/useM1ReferenceEdges.test.ts` lines 1-80, `viewpoint/ir/__tests__/useContentSizeLoop.test.ts` lines 30-50 (test idiom for Phase 2)

## 3. Findings (read)

### 3.1 The derived value and its key

`frontend/src/components/editor-v2/hooks/useEditorMode.ts:182`, the per-class signature part (read):

```ts
            parts.push(`${id}:${cls.name}:${cls.abstract}:${cls.isSingleton}:${refCount}:${refNames}:${attrNames}`);
```

`refCount` and `refNames` come from `cls.allReferences ?? cls.references` on the **raw D object** (`:168`). A
`DClass` has no `allReferences` field (`LModelElement.tsx:2705-2776` declares `references` at `:2733` and
`extends` at `:2736`, and no `allReferences`), so this reads the class's own references only.

`useEditorMode.ts:226`, the memo's dependency list:

```ts
    }, [modelId, explicitMode, metamodelRefFromStore, metamodelClassSignature]);
```

`useEditorMode.ts:415` and `:430-438`: the memo body reads `cls.allReferences` on the **L-proxy**, which includes
inherited references (`LModelElement.tsx:3159-3161`, `get_allReferences` = own + inherited). It also reads
`cls.extends` to build `concreteSubclasses` (`:467-491`). Both values are correct when the memo runs. They go stale
because nothing makes the memo run after an `extends` write.

### 3.2 The write that should invalidate it

`frontend/src/model/logicWrapper/LModelElement.tsx:3545`, in `set_extends`:

```ts
            SetFieldAction.new(c.data, 'extends', list, "", true);
```

The M2 inheritance gesture reaches it through `canvasToJjom.ts:252-254`:

```ts
        TRANSACTION('EditorV2 create inheritance edge', () => {
            sourceClass.extends = [...currentExtends, targetClass.id];
        });
```

The only raw field that changes is `extends` on the subclass. Nothing in the signature reads it.

### 3.3 The gesture's use of the stale value

`EditorV2.tsx:1761-1790` (M1 branch of `onConnectEnd`):

```ts
            const mi = modeInfoRef.current;
...
                    const sourceMetaclass = mi.allClasses.find(c => c.id === sourceData.instanceOfClassId);
...
                        const compatibleRefs = getCompatibleReferences(
                            sourceMetaclass,
                            targetData.instanceOfClassId,
                            mi.allClasses,
                        );
...
                        if (compatibleRefs.length === 0 && connectMatches.length === 0) {
                            return; // no compatible refs — ignore
```

`modeInfoRef.current = modeInfo` is reassigned on every render (`EditorV2.tsx:696-697`). The ref is not stale. The
value it holds is.

`compositionCompat.ts:108-115`: the source side reads `sourceMetaclass.references` (stale: no inherited refs). The
target side reads `declaredTargetClass.concreteSubclasses` (stale: subclass missing):

```ts
    for (const ref of sourceMetaclass.references) {
...
        const isMatch = ref.targetClassId === targetMetaclassId
            // Subclass match: target metaclass is a concrete descendant of the declared target
            || declaredTargetClass.concreteSubclasses.some(sub => sub.id === targetMetaclassId);
```

So both directions in Alfonso's report fail: **from** a subclass instance (no inherited reference) and **to** a
subclass instance (not a descendant).

### 3.4 Why the Properties panel works

`LModelElement.tsx:8133`, in `LValue.get_validTargets`, which the panel calls on each render:

```ts
            if (!isShapeless) validObjects = validObjects.filter((obj) => (type as LClass).isSuperClassOf(obj.instanceof, true))
```

This is a live L-proxy read with no memo. Measured: `propertiesOffersTarget: true` for every A-gesture (§4.4).

### 3.5 Other reads on the path, cleared

- `useConformanceGuard.ts:27-35`: `guardLink` resolves the model and metamodel on each call. No cache.
- `canvasToJjom.ts:1764-1830` (`syncCreateReferenceLink`): reads `sourceObject['$' + referenceName]` live.
- `connectionValidity.ts:31`: `if (mode === 'model') return true;`. It does not filter by class.
- `matchConnectRules` (`EditorV2.tsx:1782-1787`) takes `mi.allClasses`, so it is fed the same stale value and is
  fixed by the same change.
- Not on this path, and not stale: `InstanceManagerTab.tsx:1614-1624` memoizes `getMetaclassInfo` on `idlookup`
  (any store change).

## 4. Findings (measured)

### 4.1 Probe

The probe is `frontend/scripts/smoke/_tmp_subclass_edge_gesture.ts`. It is gitignored, so no tracked file changed;
a copy is in `~/.jjodel-lanes/P-2026-10-11-1025/subclass_edge_gesture_probe.ts`. Logs are `probe-run3.log`,
`probe-run4.log` and `probe-run5.log` in the same folder, with JSON in `probe_subclass_edge_gesture.json`.

Setup: real app on its own dev server (`localhost:3141`, scratch config with `cacheDir /tmp/lane-vite-cache-3141`),
Playwright Chromium at 1440x900, basic mode, fresh project, `StateMachine.ecore` + `sample-StateMachine.xmi`
imported through the project page file inputs. The code under test is HEAD `385058377` (unmodified).

Sequence, matching Alfonso's report with both tabs open:

- **S1** Metamodel tab: class `Choice` created with `syncCreateClass`, the M2 palette drop's write.
- **S2** Model tab: Choice, State and Transition instances created in two empty canvas regions (`syncCreateObject`,
  the M1 drop's write). Control C0.
- **S3** Metamodel tab again, model tab hidden: `Initial` and `Terminal` created. `Initial`, `Terminal` and
  `Choice` get `extends State` through `syncInheritanceEdge`, the M2 inheritance gesture's write.
- **S4** Back to the model tab without reopening it: new Initial and Terminal instances, gestures A0–A5.
- **S5** Model tab closed (`DockManager.closeTab`) and reopened: new instances, gestures B0–B5.

Every gesture is a real pointer drag: hover on the source node's facing side, `mousedown` on its ghost source
handle, 14 moves, mouse up on the target's facing side. The probe reads xyflow's in-progress connection just before
mouse-up.

### 4.2 The memo stays stale while the tab is mounted (run 5, the same in runs 3 and 4)

S3, model tab hidden (`mounted: true, active: false`), after the three `extends` writes. The D-layer read live by
`liveClasses` says:

```
"Choice":{"extends":["State"],"allReferences":["outgoing","substates"]},"Initial":{"extends":["State"],"allReferences":["outgoing","substates"]},"Terminal":{"extends":["State"],"allReferences":["outgoing","substates"]}
```

The memo of the same tab says:

```
"State":{"refs":["outgoing","substates"],"subs":[]},..."Choice":{"refs":[],"subs":[]},"Initial":{"refs":[],"subs":[]},"Terminal":{"refs":[],"subs":[]}},"rootable":["StateMachine","Choice","Initial","Terminal"]
```

S4 (active again), after creating four instances and after the gestures: identical. S5 after reopen:

```
"State":{"refs":["outgoing","substates"],"subs":["Choice","Initial","Terminal"]},..."Choice":{"refs":["outgoing","substates"],"subs":[]},"Initial":{"refs":["outgoing","substates"],"subs":[]},"Terminal":{"refs":["outgoing","substates"],"subs":[]}},"rootable":["StateMachine"]
```

### 4.3 The gesture's decision, executed in the page

`getCompatibleReferences` over the memo and over a fresh `getMetaclassInfo`, S4, mounted tab:

```
"State->Transition":{"memo":["outgoing"],"fresh":["outgoing"]},"Transition->State":{"memo":["source","target"],"fresh":["source","target"]},"Initial->Transition":{"memo":[],"fresh":["outgoing"]},"Transition->Terminal":{"memo":[],"fresh":["source","target"]},"Initial->Terminal":{"memo":[],"fresh":["substates"]},"Terminal->Initial":{"memo":[],"fresh":["substates"]},"Choice->Transition":{"memo":[],"fresh":["outgoing"]}
```

S5, after reopen: memo and fresh are equal on all seven pairs.

### 4.4 Gestures (run 5; runs 3 and 4 give the same verdicts)

| Gesture | Tab state | xyflow `isValid` | Drop on target | Popup | Slot value | D edge | DOM edge | Properties offers target |
|---|---|---|---|---|---|---|---|---|
| C0 State→Transition `outgoing` | before change | true | yes | — | +1 | 1 | 1 | yes |
| A0 State→Transition `outgoing` | mounted, after | true | yes | — | +1 | 1 | 1 | yes |
| A0t Transition→State `target` | mounted, after | true | yes | source, target (picked) | +1 | 1 | 1 | yes |
| **A1** Initial→Transition `outgoing` | mounted, after | true | yes | — | **0** | **0** | **0** | yes |
| **A2** Transition→Terminal `target` | mounted, after | true | yes | **none** | **0** | **0** | **0** | yes |
| **A3** Initial→Terminal `substates` | mounted, after | true | yes | — | **0** | **0** | **0** | yes |
| **A4** Terminal→Initial `substates` | mounted, after | true | yes | — | **0** | **0** | **0** | yes |
| **A5** Choice→Transition `outgoing` | mounted, after | true | yes | — | **0** | **0** | **0** | yes |
| B0 State→Transition `outgoing` | reopened | true | yes | — | +1 | 1 | 1 | yes |
| B0t Transition→State `target` | reopened | **false** | yes | — | 0 | 0 | 0 | yes |
| B1 Initial→Transition | reopened | true | yes | — | +1 | 1 | 1 | yes |
| B2 Transition→Terminal | reopened | true | yes | source, target (picked) | +1 | 1 | 1 | yes |
| B3 Initial→Terminal | reopened | true | yes | — | +1 | 1 | 1 | yes |
| B4 Terminal→Initial | reopened | true | yes | — | +1 | 1 | 1 | yes |
| B5 Choice→Transition | reopened | true | yes | — | +1 | 1 | 1 | yes |

A1–A5 log no console line during the gesture. The controls that reach `handleM1ReferenceSelected` log
`[BUG-DIAG-GUARD] checkLinkCreation` (`ConformanceGuard.ts:70`), and A1–A5 do not. So these gestures stop before
the guard, at `EditorV2.tsx:1789-1790`.

The positive control is A0/A0t (P12). They run in the same mounted, stale tab, on the same region and the same
handle geometry, and they work. That shows the gesture mechanics work in that state; only the subclass endpoints
fail.

Both of Alfonso's variants reproduce:
- a new instance of a subclass created after the change (A1–A4);
- the superclass link added to an already existing class with an instance created before (Choice, A5).

### 4.5 Run-to-run stability

The same verdicts appear in runs 3, 4 and 5: A1–A5 inert, B1–B5 working, controls C0/A0/A0t/B0 working, B0t
refused. Each run exits with code 1 for the single B0t check (`FAILURES=1`).

## 5. Dependencies and risks

### 5.1 Effect of F1 beyond the gesture (what else re-derives)

Every consumer of `modeInfo` then gets the post-link view as soon as the link is written. Today they only get it
after a reopen. Read: `EditorV2.tsx:815-827` (singleton conformance), `:1710-1723` (`irPalette`), `:2334-2391`
(drop), `:2562-2564` (drag-over), `:3300-3306` (context-menu child options), `:4848` (`allClasses` prop).

A visible consequence, measured in S5: `rootable` changes from `[StateMachine, Choice, Initial, Terminal]` to
`[StateMachine]`. State is a containment target (`StateMachine.states`), so its new subclasses leave the root
palette. With F1 this happens in the mounted tab too, exactly as after a reopen today. This is convergence to the
remount behaviour, not new behaviour.

The signature gets one more short string per class. The selector already walks every class on each dispatch, so
the cost is negligible (read, not measured).

### 5.2 Gaps F1 does not close (read, not measured)

The per-class part also omits, read from `:168-182`:
- a reference's `type`: a retype that keeps the name and the count changes neither `refCount` nor `refNames`;
- `composition` and `aggregation` flags;
- `lowerBound` and `upperBound`;
- `cls.interface`, which `isAbstract` reads at `:443`;
- an attribute's type.

A metamodel edit of any of these, made while the model tab is mounted, would leave the gesture (and the palette)
on the old value. This is the same mechanism, but not Alfonso's report, and it was not measured here. See question 1.

### 5.3 B0t: a refusal by xyflow, unrelated to inheritance (measured, cause not investigated)

On the unmodified code, after reopen, Transition→State over the `target` reference is refused by xyflow itself. The
connection snapshot before mouse-up was:

```
"conn":{"inProgress":true,"isValid":false,"from":{"node":"Pointer1791713908452_USER_229","id":"left-0","type":"source"},"to":{"node":"Pointer1791713906638_USER_221","id":"right-0","type":"source"}}
```

So `onConnect` never fires. The same pair shape in the mounted tab (A0t: `from left-1 → to right-0`) is valid, and
B4 (`from left-0 → to right-0`) is valid. The difference is not explained here. It involves no subclass and does
not depend on the memo: the memo agrees with fresh in S5. The acceptance's "instances of State behave as before"
holds trivially for it, because it fails before any fix. See question 3.

### 5.4 Testability (Phase 2)

`useEditorMode.ts` imports `LPointerTargetable, store` from the joiner barrel, which does not import under vitest
(`window is not defined` through monaco, `CLAUDE.md` §17). The Phase 2 test follows the fake-barrel and hook-slot
idiom of `useM1ReferenceEdges.test.ts` and `useContentSizeLoop.test.ts`:
- `react-redux`'s `useSelector` reads a fake state;
- `useMemo` is emulated with React's `Object.is` comparison of deps, slot by slot;
- `LPointerTargetable.fromPointer` returns fake L-classes whose `allReferences` and `extends` are derived from the
  fake state.

The emulated memo is a modeling assumption and will be declared in the test header. Scenario:
1. Render with State (`outgoing: Transition`, `substates: State`), Transition (`source`, `target: State`) and
   Initial (no superclass).
2. Write `Initial.extends = [State]` into the fake state.
3. Render again.
4. Assert `Initial.references` ⊇ {outgoing, substates}, `State.concreteSubclasses` ∋ Initial, and
   `getCompatibleReferences` (real, pure) Transition→Initial = [source, target].

It is red today. The mutation bench drops the `extends` term from the signature and checks the test goes red.

### 5.5 Instrumentation left in the code (read, outside scope)

`ConformanceGuard.ts:47` and `:70` carry a `[BUG-DIAG-GUARD]` `console.log` on every link creation. `CLAUDE.md` §2
says instrumentation is removed in a dedicated commit. It is noted here, not touched.

## 6. Proposed fix F1 (Phase 2, after GO)

In `frontend/src/components/editor-v2/hooks/useEditorMode.ts`, per-class signature part (`:182`), append the raw
superclass ids so that an `extends` write re-derives `modeInfo`. Sketch:

```ts
            const supers = Array.isArray(cls.extends) ? cls.extends.join(',') : '';
            parts.push(`${id}:${cls.name}:${cls.abstract}:${cls.isSingleton}:${refCount}:${refNames}:${attrNames}:${supers}`);
```

Plus a comment line in the style of `:170-174`, naming this report.

- Not touched: the memo body, the dependency list, `EditorV2.tsx`, `compositionCompat.ts`, any sync-layer file.
- Exported interfaces: none changed.
- Layer Impact Report: not required. The file is not in `CLAUDE.md` §3.1, and the change does not write the D-layer
  or touch the sync layer.
- Files: listed in §0.

Gates: `npm run typecheck` (baseline 14), the new test red then green plus the mutation bench, `npm run test`
(the known nine import failures), `npm run build`, `npm run check:scripts` (probe), `npm run check:docs` (inbox).

Acceptance: the committed probe on its own port. With the fix, A1–A5 must each give 1 slot value, 1 D edge and 1
DOM edge, with A2 offering `source, target`. C0, A0, A0t and B0–B5 must still pass. B0t stays a measure (§5.3).

## 7. Open questions

1. Do we keep F1 to `extends` only and leave the §5.2 gaps to a ticket? Recommended: yes.
2. Do we commit the probe as `frontend/scripts/probe/subclass-edge-gesture.ts` for acceptance, with B0t as a
   measure? Recommended: yes.
3. Do we open a ticket for B0t (xyflow `isValid: false`, Transition→State after reopen)? Recommended: yes, low
   priority.
4. Do we open a ticket for the `[BUG-DIAG-GUARD]` instrumentation in `ConformanceGuard.ts`? Recommended: yes, low
   priority.

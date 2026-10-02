# Discovery 2026-10-02 — an IR name label keeps the old name after a canvas rename

Prompt-ID: P-2026-10-02-1645 (Phase 1, read-only) · prompt `docs/prompts/` file of the same ID, chat C-2026-10-01-2349
Session: started by `lane-run`, session id not exposed to the session · tree `~/jjodel-w-labelname`, branch `ir-label-name-refresh`, HEAD `19d48ee0b` (the docs commit that added the prompt), code at `adb5d9731` of `alfonso-frontend-jjtl`
Model: Claude Sonnet 5.5 (`claude-sonnet-5-5`, as the session banner shows it) · Tags: [R] read, [M] measured in this phase. A set of hypotheses with evidence, not a reference: whoever uses it re-reads the files.

## 0. Answer in brief

- **The chat's root cause holds** [R + M]. `useIRView`'s selector builds its signature from the IR signature, the object id, `dObject.instanceof` and the object's DValue slots; `dObject.name` is not in it. The memo reads `getName` through `makeReadCtx(store.getState().idlookup)` only when that signature changes. An object of a class with no `name` attribute has no slot that moves on a rename, so the signature is byte-identical before and after and the memo does not re-run. Measured on a verbatim copy of the selector (§3, M1): same signature after the rename. With a `name` attribute the slot moves with the name and the signature changes (M2), which is why only the attribute-less case is stale.
- **The metaclass-rename case is stale too** [M]. The signature carries the class id, not its name. After a rename of the class the signature is identical (M3) while `getMetaclassName` reads the new name; `metaclassName` and `qualifiedName` labels therefore draw the old class name. It is worse than a label: the IR index is keyed by metaclass NAME and `resolveIRView` matches on `self.name`, so a renamed class stops matching its view (M3: view `V1` before, no view after) and the stale memo keeps drawing it.
- **The row hook has the same gap** [M]. `useIRRowView` (`irResolve.ts:161-176`) builds the same snapshot without the name (M5: same signature after rename). Its fallback is the built-in `defaultRowViewIR`, «intrinsic name» (`irResolve.ts:156-157`), so a renamed containment child of a class with no `name` attribute keeps the old name in its row for the same reason.
- **Two sibling selectors already carry the name** [R]. `useIRFormView.ts:84` has `dObject.name ?? ''` and `SymbolEditorModal.tsx:287` has `${dObject?.name ?? ''}`. The comment at `useIRFormView.ts:79-82` states the assumption that was wrong: «useIRView can leave it out (a canvas label reads it through the accessor, whose value lands in the slot snapshot)». It holds only when the class declares a `name` attribute. The fix aligns the node and row selectors with these two.
- **Edge labels: a different subscription, same kind of gap, not measured** [R]. `compileTextSource` (`irCompile.ts:581-599`) lets an edge label (centre, template segment, end label) take `intrinsic name` / `metaclassName`. The decoration memo in `useIRContainment.ts:204` depends on `[nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep]`; `oaeSlotsSig` observes slots and cross deps, never a name. Whether a rename re-runs it depends on `nodes`/`edges` changing identity, which I did not measure. The file is outside the list: a ticket, and Phase 2's probe measures it if the demo scenes carry such an edge view.
- **Plan.** A pure function in `irResolveCore.ts` (additive) returns the snapshot parts; `useIRView` and `useIRRowView` both call it. New parts, appended after the existing ones so the old prefix is unchanged: the object's name as `getName` reads it from the D-layer (`name ?? initialName`) and its metaclass's name as `getMetaclassName` reads it. Both are O(1) lookups. The function is the thing a test can run, because `irResolve.ts` imports the joiner and does not load in the node bench.
- **Files for Phase 2: 2 source + 1 test, under rule 19** (§6). `irResolveCore.ts` is named by the prompt for exactly this case.

**Decisions taken (unattended):** the row hook is fixed with the node hook (same file, same selector kind, same measured gap; the prompt asked for the report to say whether it has the gap, the recommendation below is to fix it); the metaclass term is the class's OWN name, not the ancestry walk (the hot selector runs for every node on every store update, and `useIRContainment.ts:78-80` records the same «no ancestry walk in the hot selector» rule).
**Decisions awaiting Alfonso:** none on the recommended path.

**Questions** (numbered, one line each):
1. Fix `useIRRowView` in the same change, through the shared helper? **Recommended:** yes.
2. Metaclass term: the class's own name only, ancestors' names left as a known limit (a rename of a SUPERCLASS mid-session keeps an inherited match stale)? **Recommended:** yes, own name only, and file the superclass case as a low ticket.
3. Edge-label gap (`useIRContainment.ts`, outside the list): a ticket, not fixed here? **Recommended:** yes, a ticket entry in `docs/log-inbox/views.md`, priority medium if Phase 2's probe shows it stale, low otherwise.
4. The now-wrong comment at `useIRFormView.ts:79-82`: leave it (Rule 8, file not listed) and ticket it? **Recommended:** yes, folded into the ticket of question 3.

---

## 1. Hypotheses under test, with verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `dObject.name` is not in the `useIRView` signature, so a rename of an object whose class has no `name` attribute does not re-run the memo. | Holds [R], measured on a copy of the selector [M], §2.1, §3 M1 |
| H2 | With a `name` attribute the slot moves, so that case is not stale. | Holds [M], §3 M2 |
| H3 | `metaclassName` / `qualifiedName` go stale when the metaclass is renamed. | Holds [M], and the view match goes stale with them, §2.3, §3 M3 |
| H4 | Another reader of intrinsic text bypasses `useIRView` with the same gap. | Partly: `useIRRowView` has it [M]; the edge decoration memo may have it [R, not measured]; the form and Symbol-modal selectors do not, §2.4 |
| H5 | An unrelated object's rename must not move the signature. | Holds today [M, M4]; the fix must keep it, Phase 2 test |

## 2. Findings

### 2.1 The selector [R]

`frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts:60`:

```
        const snap: string[] = [irSig, objectId, dObject.instanceof ?? ''];
```

`:61-66` append `${fid}=${JSON.stringify(dv.values)}` for each feature id; `:70-71` append the cross-object signature. Nothing reads `dObject.name`. The memo below (`:101-120`) calls `makeReadCtx(lookup)` on a fresh `store.getState().idlookup` and `resolveIRView(...)`, so a re-run would read the new name; the only missing piece is the trigger.

The accessor, `irReadCtx.ts:166-174`:

```
        getName(elementId) {
            // Identity-binding parity: prefer the 'name' slot value when present
            ...
            const slotValue = getValue(elementId, 'name');
            if (typeof slotValue === 'string' && slotValue) return slotValue;
            const d = idlookup[elementId];
            return d?.name ?? d?.initialName ?? null;
        },
```

So the name an intrinsic label draws is the `name` slot when the class has one, else `d.name ?? d.initialName`. That is the exact set the signature must cover; the slot half is already covered, the D-layer half is not. `getMetaclassName` (`irReadCtx.ts:175-178`) reads `idlookup[cid]?.name` where `cid` is `dObject.instanceof`.

### 2.2 How a canvas rename writes [R]

`IRNodeContent.tsx:352-359` (`commitLabelEdit`) calls `syncNodeLabel(vertexId, editValue)`; `canvasToJjom.ts:665-676` sets `model.name = newName` on the L-proxy, which routes through the L-proxy `set_name`. `frontend/src/model/CLAUDE.md` §3.12 records that `set_name` writes `data.name` and, through the proxy assignment, the `name` slot (read there, not re-traced here). With no `name` attribute only `data.name` changes: the one field the signature does not read.

### 2.3 The metaclass [R + M]

`resolveIRView` (`irResolveCore.ts:280-`) takes `ancestry = classAncestry(idlookup, metaclassId)`, `self = ancestry[0]`, and looks the index up by `self.name` (`index.byMetaclass.get(self.name)`). The index is keyed by name (`getIRIndex`, `byMetaclass.set(mc, arr)`), with the pin check by class id on top (`pinAccepts`). A metaclass rename therefore changes the resolution itself, not only a label. The signature has `dObject.instanceof` (the id), so it does not move (M3).

### 2.4 The other readers [R + M]

Search: `command grep -rn 'JSON.stringify(dv.values)' src --include='*.ts' --include='*.tsx'` minus tests (the shell `grep` is the ugrep wrapper here, §5 of `CLAUDE.md`; `command grep` honours `--include`). Positive control through the same tool and flags: `command grep -rn 'crossDepsSignature' ...` returns 9 lines, so the search runs. The snapshot builders are six, all inspected:

| File:line | Carries the object's name? |
|---|---|
| `irResolve.ts:64` (`useIRView`) | no — the bug |
| `irResolve.ts:171` (`useIRRowView`) | no — same bug, M5 |
| `useIRFormView.ts:84-88` | yes: `dObject.name ?? ''` in the snapshot |
| `authoring/SymbolEditorModal.tsx:284-293` | yes: `${dObject?.name ?? ''}` in the part |
| `useIRContainment.ts:100` (`oaeSlotsSig`) | no, and it is a different subscription (edges) |
| `irCrossDeps.ts:165` (`crossDepsSignature`) | the cross-deps signature, appended by the other two |

Edge labels may take `intrinsic` text (`irCompile.ts:581-599`, `compileTextSource`; centre label `compileLabelText` `:613-630`; end labels `:636-641`). The decoration memo deps are at `useIRContainment.ts:204`. The other `getName` readers (`neighborhoodDraw`, `outlineDraw`, `multiDraw`, `createDraw`, `deleteDraw`, `instanceTable`, `instanceManagerModel`) belong to the Data Manager and the gesture drawers, with their own subscriptions; they are not IR canvas labels and are not touched.

## 3. Measurements [M]

A scratch test (`ir/__tests__/_tmp_labelname_measure.test.ts`, untracked, deleted before the first commit) holds a VERBATIM copy of the selector bodies of `irResolve.ts:49-72` and `:161-176`, because `irResolve.ts` imports the joiner and cannot load in the node bench. So these measure the selector's logic on the real `computeIRSignature`, `crossDepsSignature`, `resolveIRView`, `makeDrawReadCtx`, not the hook. The real hook is measured by Phase 2's probe. World: class `Plain` (no `name` attribute), class `Named` (with one), three objects, one vertex view for `Plain`; vitest 4.1.4, node environment, all six cases passed.

| Case | Result |
|---|---|
| M1 rename of an object of `Plain` | signature **unchanged**: stale; `makeDrawReadCtx.getName` reads `renamed` |
| M2 rename of an object of `Named` (`data.name` and the slot move) | signature **changed** |
| M3 rename of the class `Plain` to `Renamed` | signature **unchanged**; `getMetaclassName` reads `Renamed`; view resolved before `V1`, after none |
| M4 rename of an unrelated object | signature unchanged (as required) |
| M5 row selector, rename | signature **unchanged**: stale |

## 4. The fix [plan]

In `irResolveCore.ts`, one exported pure function:

```
objectSnapshotParts(lookup, objectId, irSig): string[] | null
```

It returns `null` when `lookup[objectId]` is absent. Otherwise `[irSig, objectId, instanceof ?? '', ...slots, 'n=' + JSON.stringify(name ?? initialName ?? ''), 'c=' + JSON.stringify(lookup[instanceof]?.name ?? '')]`, the new parts at the END so the existing prefix is byte-identical to today's. Name checked: `command grep -rn 'objectSnapshotParts' src` finds nothing; the control in the same tree is `crossDepsSignature` (9 hits). Both selectors in `irResolve.ts` call it and append the cross signature as before; their other early returns (`typeof objectId !== 'string'`, `!instanceOfClassId`) stay where they are.

Properties the tests pin: the signature changes when ONLY `dObject.name` changes; changes when ONLY the metaclass name changes; does not change on an unrelated object's rename or on an unrelated class's rename; unchanged when nothing changed.

## 5. Risks and dependencies

- No critical-zone file: `irResolve.ts` and `irResolveCore.ts` are on the 2.5 hot list (IR / Execution), not in §3.1. No sync-layer file, no D-layer write, no VersionFixer change: nothing persisted changes. Layer Impact Report: not-required.
- Re-render cost: the node re-renders on its own rename (the point) and on its class's rename (all nodes of that class, correctly). An unrelated rename must not move it: Phase 2 counts it in the probe.
- The signature string grows by two short parts per node on every store update; the selector already walks every feature of the object, so this is within noise.
- `useIRFormView.ts:79-82` is left stating something untrue after the fix (ticket, §0 Q4).

## 6. Phase 2 files (rule 19: under 5)

Source: 1. `viewpoint/ir/irResolve.ts` (the two selectors and one import name). 2. `viewpoint/ir/irResolveCore.ts` (the added function, additive).
Test: 3. `viewpoint/ir/__tests__/irObjectSnapshot.test.ts` (new).
Docs: this report, one row `R-IRN-39` in `docs/decisions.md`, a log entry (and the tickets) in `docs/log-inbox/views.md`, the prompt's Status.

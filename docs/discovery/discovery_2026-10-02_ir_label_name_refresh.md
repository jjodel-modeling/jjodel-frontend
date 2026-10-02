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

---

## 7. Addendum 2026-10-02, Phase 2 (P-2026-10-02-1645)

Added after the fix, `7c92ffc2c`; sections 0 to 6 above are as written in Phase 1. Tags as above: [R] read, [M] measured.

### 7.1 Correction to section 5 [R]

Section 5 says «No critical-zone file: `irResolve.ts` and `irResolveCore.ts` are on the 2.5 hot list, not in §3.1». That is wrong: the §3.1 table lists the directory `frontend/src/components/editor-v2/viewpoint/ir/` («IR execution rendering», `CLAUDE.md:172`), and both files sit in it. The §3.2 trigger list names other files (`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, D-layer write paths), so no Layer Impact Report was produced before the diff; the prompt named both files, which is the go-ahead of P5. The log entry marks the report `skipped`. What it would have said, read from the diff: layers touched are the L-layer read path (the selector reads raw `idlookup`, no write) and the canvas v2-flow (an `ObjectNode` and an `IRRow` memo re-run on two more triggers); the sync layer, the D-layer write paths and persistence are not touched; the smoke scenarios affected are the four demo scenes (0 px, 7.4) and an open-and-rename of an M1 object.

### 7.2 What was done

Code `7c92ffc2c`: `objectSnapshotParts(lookup, objectId, irSig)` in `irResolveCore.ts` (additive); `useIRView` and `useIRRowView` in `irResolve.ts` call it. Terms appended after the slot values: `n=` the name as `getName` reads it from the D-layer (`name ?? initialName ?? ''`), `c=` the metaclass's own name, both JSON-quoted. Test `ir/__tests__/irObjectSnapshot.test.ts`, 11 tests.

### 7.3 Mutation bench on `objectSnapshotParts` [M]

First pass 11/12: the survivor was M12, the inverted fallback (`initialName ?? name`). The fixtures had `name` or `initialName`, never both, and the inverted order is invisible then; the realistic object has both (a rename changes `name`, `initialName` stays), and the inverted order would have left the label stale. Test added: «follows name, not initialName, once both are set». Second pass 14/14 (M13 name term reads `initialName` only, M14 metaclass term reads the class id, added with it). Mutants: drop the name term, name term reads the metaclass name, name term reads every name, drop the `initialName` fallback, drop the metaclass term, metaclass term reads the object name, metaclass term reads every class name, no JSON quoting, drop the slot loop, swap the leading parts, drop the missing-object guard, inverted fallback, `initialName` only, class id instead of name. Each applied in place, tested, restored; file hash identical after. The hook wiring in `irResolve.ts` does not load in the bench (it imports the joiner), so no unit test executes it: the probe (7.4) does, and no source-text test stands in for it.

### 7.4 Gates and probe [M]

Gates on `7c92ffc2c`: typecheck exit 2, 14 errors, the §17 set by file and code; vitest 262 files, 6507 tests passed, 0 failed, the 9 known files red at import (8 under one `window is not defined` block, 1 under another); build exit 0; `check:scripts` PASS (41 files, 4 `_tmp_*` probes); `check:addonly` clean.

Probe `frontend/scripts/smoke/_tmp_labelname_probe.ts` (gitignored), `lane-run probe` on port 3171, light theme (`setTheme` reported root `light`), 1600x1000, DPR 2. Before = `irResolve.ts` and `irResolveCore.ts` put back at `adb5d9731` for the run and restored from `HEAD` after (diff against `HEAD` 0 lines checked after each run); after = `HEAD`. Scene: a class `Plain` with no `name` attribute, `Named` with one, `Wild` drawn by a wildcard view with a `metaclassName` label, `Box` with two containment children drawn as default rows.

| Check | Before (`adb5d9731`) | After (`7c92ffc2c`) |
|---|---|---|
| A: double-click rename of `plain1` (no attribute): label after two frames, `msToShow`, +5 s, after a tab round trip | `plain1`, null, `plain1`, `plain1`; store holds `plain1_renamed` | `plain1_renamed`, 0 ms, `plain1_renamed`, `plain1_renamed` |
| A: memo re-runs of the renamed node (readCtx identity) | 0 | 1 |
| A: memo re-runs of every other node and row | 0 | 0 |
| B: the same on `named1` (with attribute), label at +5 s and after the tab round trip | `named1_renamed` | `named1_renamed` |
| C: class `Wild` renamed, `metaclassName` label | `Wild` at 8 s | `WildRenamed` at 0 ms and at +5 s |
| D: child `item1` renamed, its row | `item1` | `item1_renamed` |
| Four demo scenes (sm, petri, esm, flowB), `.react-flow` shot, Jodie launcher masked | | 0 px each |
| Verdict | 11 pass, 7 fail (the defect: A 4, C 2, D 1) | 21 pass, 1 fail |

The one failure in the after run is the probe's own check C «within two frames»: the label was stale at the two-frame read (about 33 ms) and correct at the next poll (`msToShow` 0), so the latency of a metaclass rename is under the Playwright round trip but not resolved finer. A's two-frame check passes. The positive control of the re-run measure is in the same run: the renamed node's 1 against the others' 0.

Two measures that do not say what the prompt hoped. Render counts: every `ObjectNode` renders on every commit, so all nodes read the same count (74 of 74 in the after run, 226 in the before run, whose window ran to the 8 s cap of `msUntil` because the label never changed): the count cannot show an unrelated re-resolve, and the memo re-run count above is the measure used. The name-attribute control lags: `getName` prefers the `name` slot to `DObject.name`, and the slot is written after, so the label follows at 644 ms (before) and 959 ms (after, a loaded machine); unchanged by this fix, and the «within one frame» claim holds for a class without the attribute only.

Probe flakes: three after runs died at start under a machine load of 131 to 60 (`page.goto` 240 s, `Failed to fetch dynamically imported module` twice, once after a 20 x 8 s warm-up, and `Execution context was destroyed`); the fourth ran at load 14 and is the one reported. The corner-clip lane recorded the same flakes.

### 7.5 Not measured, and tickets

- The edge-label gap (section 0, `useIRContainment.ts:204`) is unmeasured: the probe scene has no edge view. Ticket in `docs/log-inbox/views.md`, with the comment at `useIRFormView.ts:79-82`, now untrue.
- A rename of a SUPERCLASS mid-session leaves an inherited match stale (the metaclass term stops at the class itself, Q2). Low ticket.
- The metaclass half is measured in the page for the label only (C); that the view match itself follows a class rename was measured on the bench copy in Phase 1 (M3), not in the page.

### 7.6 Decisions

**Decisions taken (unattended):** Q1 to Q4 answered as recommended: the row hook fixed with the node hook through the shared helper (D shows it stale before and right after); the metaclass term stops at the class itself; the edge-label gap and the stale form-hook comment are tickets. Decision row `R-IRN-39` (provisional, unattended, RC-25). The prompt's Status line is left at `da eseguire`: the `status-flip` skill is user-only (`disable-model-invocation`), and a hand edit would route around it, so the flip is owed to the chat.
**Decisions awaiting Alfonso:** none on the recommended path.

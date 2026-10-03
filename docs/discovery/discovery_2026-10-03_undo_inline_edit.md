# Discovery: Cmd+Z does not revert an inline edit on the canvas

- Prompt-ID: `P-2026-10-03-1632` (chat `C-2026-10-03-1610`), prompt `docs/prompts/claude_2026-10-03_1632_prompt_undo_inline_edit.md`, Phase 1
- Session: `b035caf7-b186-4984-968e-29fe3e479f18`; executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- Tree: `~/jjodel-w-undoinline`, branch `undo-inline-edit`, HEAD `4cba26044` (the trunk `d2a1866b6` plus the prompt)
- Probe: `frontend/scripts/probe/undo-inline-edit.ts` (commit `d073925e7`), run by `lane-run probe … --port 3077`, light theme, logs in
  `~/.jjodel-lanes/P-2026-10-03-1632/` (`probe-undo-inline-edit_before.log`, `probe-undo-inline-edit.log`, two JSON)
- Layer Impact Report of the proposed fix: `docs/lir/lir_2026-10-03_undo_inline_edit.md`

A set of hypotheses with evidence, not a reference: who uses it downstream rereads the files. [M] measured in this
phase on `4cba26044`, [R] read.

## 0. Answer in brief

**Cause.** The reducer writes the new value into the state before it, so the undo delta never sees it. A slot write
emits `isMirage = false` beside `values.N` (`LModelElement.tsx:7958`). On a slot that already holds a value that
action is a no-op, and path order puts it first (`reducer.ts:495-501`). Its copies are thrown away when it changes
nothing (`reducer.ts:373-376`, `:422`). `values.N` still gets it as `prevAction` (`reducer.ts:506`) and skips copying
the segments they share (`reducer.ts:97`). So it writes into the **live** slot of the previous state, and
`Uobj.objectDelta(ret, oldState)` (`:1200`) pushes an entry holding `action_title` only.

**Not the canvas, not `Uobj`, not the 450 ms merge** [M]. The IR row, the path label, a direct
`syncUpdateFeatureValue`, the ObjectNode cell and a bare `L(o).$note.value =` with no outer TRANSACTION all fail:
the old state reads the new value and one Cmd+Z leaves it. The reducer alone reproduces it: a TRANSACTION with the
no-op `isMirage` then `values.0` fails, and the same TRANSACTION without the no-op restores, as the control rename
does. No delta merged. The 450 ms ticket is `U.objectMergeInPlace` across two dispatches: another cause, untouched.

**Smallest fix (A)** [M]. `CompositeActionReducer` passes as `prevAction` the last action whose copy changed the state
(`tmp !== newState`), not `actions[i-1]`: three lines in `reducer.ts`. Patched into the served module by the probe,
it makes all 35 checks pass, against 21 PASS and 12 FAIL unpatched. All eight cases restore on Cmd+Z and reapply on
Cmd+Shift+Z, the canvas text follows, and the old state stays untouched. Only the D-layer reducer changes.

**It is wider than the canvas.** Every `.value =` on a slot that already holds a value hits the defect: panels,
JjScript, anything with a no-op first `idlookup` action. (A) makes them all undoable and stops the mutation. Element
identity and `clonedCounter` then change on those writes, as on every other write. The alternatives:
(B) guard `c.data.isMirage &&` at `LModelElement.tsx:7958`, as `:8025` already does: outside DOVE, and the reducer
defect stays. (C) A bypass in `canvasToJjom.ts` that duplicates `setValueAtPosition`: fragile.

**Decisions taken (unattended).**
1. The probe adds `note : EString` to `Place` and an IR viewpoint in the page, for the path label (EString only,
   R-IRN-41); the fixture is a byte copy of the demo.
2. The probe raises the undo gate with a top-bar click: a pane click never sets `globalcanundostate` (§2.5).
3. The ObjectNode case is `t2.guard` under the default viewpoint (`Transition` is not drawn by the probe's viewpoint).

**Decisions awaiting Alfonso.** None from the RC-26 list. `reducer.ts` is not a §3.1 file, no exported interface
changes, and R-UNDO-5 is not amended. Rule 5 (core) is approved by the GO: DOVE names `reducer.ts`.

**Question for the chat.**
1. Fix (A) makes every slot write undoable, not only the canvas writes, against the prompt's «without changing undo
   for any other action»: adopt it?
   Recommended: adopt (A); it is the root cause in three lines, and (B) and (C) leave the previous state mutated.

## 1. Hypotheses under test

1. The value change is merged into another history entry. **Falsified** [M]: `mergeCounter` is null on every entry
   of both runs, and the delta of the write's own dispatch, before any merge, already lacks `idlookup` (§2.1).
2. `Uobj.objectDelta` misses the change. **Falsified as stated** [M]: `objectDelta` is correct. It compares two states
   whose `idlookup` is the same object, because the reducer wrote into the previous one (§2.2). The control write
   without the no-op gives a full delta through the same function.
3. The outer TRANSACTION of `syncUpdateFeatureValue` is the cause (the prompt's DOVE names `canvasToJjom.ts`).
   **Falsified** [M]: the `proxy` case (`L(p3).$note.value = 'delta'`, no outer TRANSACTION) fails the same way.
4. The no-op `isMirage = false` ahead of `values.N` in one batch is the cause. **Holds** [M]: `batch-noop` fails and
   `batch-single`, the same write without it, passes (§2.1). The patched run makes both pass (§2.4).
5. The 450 ms merge ticket has the same cause. **Falsified** [R]: it is `U.objectMergeInPlace` (`U.tsx:896-905`,
   shallow, first-wins) across two dispatches. This defect is inside one dispatch, and no measured delta merged.

## 2. Findings

### 2.1 The measure [M]

`lane-run probe /Users/alfonso/jjodel-w-undoinline frontend/scripts/probe/undo-inline-edit.ts --port 3077 --id
P-2026-10-03-1632`, DemoPetri imported from `frontend/scripts/probe/fixtures/scene_2_DemoPetri.jjodel` (`cmp`
identical to `~/jjodel-demo-exports/scene_2_DemoPetri.jjodel`), M1 `demoNet`. Each case: write, 2.5 s, read,
click an empty pane point, Cmd+Z, 2.5 s, read, Cmd+Shift+Z, 2.5 s, read. Values are the store's `values` of the
slot (`name` for the rename), depth is `statehistory[DUser.current].undoable.length`.

| case | write | before → written | after Cmd+Z | depth before/after undo | previous state's element changed |
|---|---|---|---|---|---|
| row | IR row `p1.tokens` | `[2]` → `["7"]` | `["7"]` | 2 → 1 | yes |
| label | IR path label `p1.note` | `["alpha"]` → `["beta"]` | `["beta"]` | 3 → 2 | yes |
| direct | `syncUpdateFeatureValue(p2,'note')` | `[]` → `["gamma"]` | `["gamma"]` | 4 → 3 | yes |
| proxy | `L(p3).$note.value =` | `[]` → `["delta"]` | `["delta"]` | 5 → 4 | yes |
| object | ObjectNode cell `t2.guard` | `["p3.[tokens] < 1"]` → `["x > 0"]` | `["x > 0"]` | 8 → 7 | yes |
| rename (control) | IR name label `lock` | `lock` → `lockX` | `lock` | 11 → 10 | no |
| batch-noop | TRANSACTION `isMirage=false`, `values.0=5` | `[1]` → `[5]` | `[5]` | 12 → 11 | yes |
| batch-single | TRANSACTION `values.0=9` | `[5]` → `[9]` | `[5]` | 13 → 12 | no |

Cmd+Shift+Z leaves every case at the written value. Where the undo restored nothing that proves nothing, and where
it restored, the redo reapplies. 21 PASS, 12 FAIL (`probe-undo-inline-edit_before.log`, `EXIT=1`). Page errors: only
`init_dash`, present at load.

The write's own dispatch, from the recorder (`store.subscribe`, the tail of `window.jjactions`, `Uobj.objectDelta(next,
prev)`). This is the same call as the reducer's, before any history bookkeeping:

```
row        EditorV2 set tokens  [idlookup.<slot>.isMirage=false, idlookup.<slot>.values.0=7]   delta keys [action_title]
proxy      note.setValue(0: index) [… .isMirage=false, … .values.0=delta]                      delta keys [action_description, action_title]
batch-noop probe noop-prefix    [… .isMirage=false, … .values.0=5]                              delta keys [action_title]
batch-single probe single       [idlookup.<slot>.values.0=9]                                    delta keys [idlookup, action_title], idlookup.<slot>: [values]
rename     lock.name            [idlookup.<obj>.name=lockX]                                     delta keys [idlookup, action_description, action_title]
```

Identity, read right after the write (`row`): `stateReplaced: true`, `elementReplaced: false`,
`previousStateElementChanged: true`. The root is new, the slot object is the old one, and the state before the
write now reads `["7"]`.

The 2026-10-02 ticket's figures (`aa04b92fb`, `_tmp_pathlabel_undo.ts`: «after Enter … topKeys ["action_title"]») are
the same entry. Its depth 11 to 10 is that action_title-only entry popping.

### 2.2 The mechanism [R], tied to the measure

The producer of the no-op, `frontend/src/model/logicWrapper/LModelElement.tsx:7954-7958`:

```
                outactions.set.push(()=>SetFieldAction.new(c.data, 'values.' + index as any, val, '', isPtr));
                ...
                if (info.setMirage !== false) SetFieldAction.new(c.data, 'isMirage', false, '', false);
```

`set_values` guards the same flag, `:8025`: `if (modified) c.data.isMirage && SetFieldAction.new(c.data, 'isMirage', false, '', false);`.

The order, `frontend/src/redux/reducer/reducer.ts:495-501`: `return U.stringCompare(a1.path, a2.path);`, so that
`idlookup.<slot>.isMirage` precedes `idlookup.<slot>.values.0`.

The previous action, `reducer.ts:505-506`:

```
    for (let i = 0; i < actions.length; i++) {
        const prevAction: ParsedAction = actions[i-1];
```

and its use, `reducer.ts:541-543`:

```
                let tmp: false | DState = deepCopyButOnlyFollowingPath(newState, action, prevAction, action.value);
                if (!tmp) return oldState; // rollback due to invalid action in transaction
                newState = tmp;
```

The skipped copy, `reducer.ts:96-107`: a segment is copied only `if (alreadyPastDivergencePoint || key !==
prevActionPathKey)`, with the comment «se l'oggetto è stato già duplicato in una azione composita, non lo duplico 2
volte». The discarded copy, `:373-376` («`current[key] === newVal`) { // value not changed gotChanged = false;`») and
`:422` `return gotChanged ? newRoot : oldStateDoNotModify;`.

The trace for `row`. `isMirage` copies `idlookup` and the slot into a fresh `newRoot`, finds `false === false` and
returns the old state, so the copies are lost. `values.0` gets `prevAction = isMirage`. It sees `idlookup` and the
slot as already copied and leaves them shared with the old state. Only `values` diverges (`isMirage` against
`values`), so `current['values'] = [...]` assigns a new array **into the old slot object**, and `['0'] = '7'` writes
it. The new root shares `idlookup` with the old root. `Uobj.objectDelta(ret, oldState, true, false)`
(`reducer.ts:1200`) therefore sees only `action_title` change, and the entry is pushed as relevant
(`reducer.ts:1259-1262`).

Rule of the defect: a batch whose first `idlookup` action, in path order, changes nothing makes the writes after it
land in the previous state. A slot write on a materialized slot is always such a batch. The rename is one action. The
identity-slot rename of R-UNDO-5 was measured complete on 2026-08-25 because its `DObject.name` write, a change,
copies `idlookup` first.

### 2.3 Why the canvas follows anyway [M][R]

The IR row and label texts updated on the write in every case (`p1 alpha tokens = 7 …`), because the compartment
signature rebuilds a string from `values` (`IRNodeContent.tsx` `compartmentSig`). A subscriber that compares the slot
object or its `clonedCounter` (`utils/UDComparator.ts:8`, «Extract id + clonedCounter (version) from Proxies») sees
no change, because the slot object and its counter are the old ones. This is read, not measured: no such
subscriber was probed.

### 2.4 The proposed fix, measured in flight [M]

`UI_PATCH=fix-reducer` rewrites the served `reducer.ts` (Playwright route, each rewrite asserted to match once):
`const prevAction = actions[i - 1];` becomes the last applied action, set when `tmp !== newState`. Same command,
`probe-undo-inline-edit.log` second run: **35 PASS, 0 FAIL, `EXIT=0`**. Every case has `previousStateElementChanged:
false`, Cmd+Z restores (`row` `[2]`, `label` `["alpha"]`, `direct` `[]`, `proxy` `[]`, `object` `["p3.[tokens] < 1"]`,
`batch-noop` `[1]`), Cmd+Shift+Z reapplies, and the canvas text follows (`p1 alpha tokens = 2 …` after undo). The
two controls are unchanged.

Why it is enough [R]. An action that changed the state left its path copies in `newState`, so the segments it shares
with the next action are fresh, by induction on the actions that changed. A no-op's copies are either discarded or
hang under a parent that is already fresh, so ignoring it as the previous action only costs an extra copy. The first
action, or one after only no-ops, gets `undefined` and copies its whole path (`prevAction?.pathArray[i]`, `:93`).

### 2.5 The undo gate in the probe [M][R]

`isRelevantChangeCheck` returns false until `statehistory.globalcanundostate` (`reducer.ts:1280`). The flag is raised
by `$(document).on("mouseup.jjodelDocEvents", …)` (`reducer.ts:1437-1441`). The first run clicked only the canvas:
`flags {"canUndo": false}` and depth 0 through all cases, so Cmd+Z had nothing to pop. React Flow's d3 handlers stop
the `mouseup` at the window in capture phase. That is read in d3-zoom, not measured; the measured part is that the
flag stayed false. A click on the top bar raises it (`canUndo: true`). A user who has clicked anywhere outside the
canvas has it raised, and the 2026-10-02 probe clicked at (800, 20) too. Not a product defect for this lane.

## 3. Files read

`frontend/src/redux/reducer/reducer.ts` (1-80, 83-423, 427-553, 599-740, 1119-1445, 1495-1520),
`frontend/src/redux/action/action.ts` (1-420, 560-720), `frontend/src/common/UObj.ts` (whole),
`frontend/src/common/U.tsx` (890-935), `frontend/src/redux/store.tsx` (60-130),
`frontend/src/model/logicWrapper/LModelElement.tsx` (6700-6740, 7836-8080),
`frontend/src/joiner/proxy.ts` (440-510),
`frontend/src/components/editor-v2/sync/canvasToJjom.ts` (1440-1640, 665-676),
`frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (280-420),
`frontend/src/components/editor-v2/viewpoint/ir/irLabelEdit.ts` (1-80),
`frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (395-445, 1005-1175, 1335-1380),
`frontend/src/components/editor-v2/panels/M1PropertiesPanel.tsx` (30-70),
`frontend/src/components/editor-v2/EditorV2.tsx` (1078-1100, 2585-2655),
`frontend/src/pages/components/Navbar.tsx` (1190-1232),
`docs/discovery/discovery_2026-08-24_undo_reducer_rename.md` (§0, §2.3-2.4, §8, §9),
`docs/discovery/discovery_2026-10-02_path_label_edit.md` (§2.3, §8), `docs/decisions.md` (R-UNDO-5, R-VP-28 caveat,
RC-14, RC-21, RC-25..RC-30), `docs/log-inbox/symbol-editor.md` (the ticket), `docs/PROTOCOL.md` (P1-P16).

Callers of `syncUpdateFeatureValue` [R], `command grep -rn` over `src` excluding tests:
`IRNodeContent.tsx:347` (row), `:361` (path label), `ObjectNode.tsx:411, 438, 1023, 1136`,
`M1PropertiesPanel.tsx:49`. Positive control of the same search: its definition `canvasToJjom.ts:1532` was
listed.

## 4. Dependencies and risks of fix (A)

- **Wider than the canvas.** The fix applies to every batch with a leading no-op, not only to inline writes. The
  panels, JjScript, JjTL and simulator writes of an existing slot become undoable as they should. That breaks the
  prompt's «without changing undo for any other action» in the direction of correctness. History depth does not
  change: those batches already pushed an `action_title` entry each. Question 1.
- **Identity.** After the fix such a write replaces `idlookup` and the element, as every other write does. Selectors
  and `UDComparator` will see writes they missed. The risk is code that relied, unknowingly, on the old state's
  objects reading the new value (stale snapshots or captured `c.data`). The Phase 2 net: full vitest, the probe, and
  the four demo scenes with default views compared to `d2a1866b6`.
- **Cost.** One more shallow copy of `idlookup` per affected batch: the cost every changing write already pays.
- **`clonedCounter`.** An element written by a no-op and then by a change in one batch can be copied twice (counter
  +2 instead of +1). It only rises, and nothing compares its exact value [R]: `proxy.ts:384`,
  `joiner/classes.ts:2310`, `UDComparator.ts`, `LazyOCL.ts:60` (which no longer uses it).
- **Bench.** `reducer.ts` imports the `joiner` barrel. Phase 2 must import it under `vi.mock` stubs (the idiom of
  `src/api/__tests__/projectsSaveVersionStore.test.ts`), plus `window`, `window.U` and `HTMLElement` stubs for its
  module-level reads (`reducer.ts:75-76`, `:1422`). If that import fails, the gap is stated and the probe is the
  only executing test (CLAUDE.md §5).
- **Not changed:** the 450 ms merge and its ticket, R-UNDO-5, `canvasToJjom.ts`, every `editor-v2/` file, the L-layer.

## 5. Phase 2 plan (if (A) is adopted)

Files, all in DOVE:
- `frontend/src/redux/reducer/reducer.ts`: in `CompositeActionReducer`, keep the last action whose copy changed the
  state, pass it as `prevAction`, and add a comment.
- New `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts`, red first:
  - a batch with a no-op `isMirage` and `values.0` leaves the old state unchanged;
  - its delta holds `idlookup.<slot>.values`;
  - `UndoAction` restores and `RedoAction` reapplies;
  - the same for the path-label shape;
  - the control batch without the no-op is unchanged;
  - one element is copied once per batch.
- The probe as committed. Docs: the LIR (written now, amended if needed), the Status flip, and the inbox entry under
  the ticket.

## 6. Open questions

1. Fix (A) in `reducer.ts`, which widens the effect beyond the canvas, against (B) the `isMirage` guard in
   `LModelElement.tsx` (outside DOVE) or (C) a canvas-only bypass in `canvasToJjom.ts`. Recommended: (A).

## 7. Phase 2 addendum (2026-10-03, same lane and session)

GO of the chat: question 1 answered with its recommendation (RC-21, unattended), fix (A); (B) and (C) not done.
Commits: trunk `49957d340` taken in `e2154ebaf` (lane-run and docs only), LIR amended `0eac2931b` before the edit,
fix `ac64b213b`. Measured on `ac64b213b` [M].

- **The fix**, `reducer.ts` `CompositeActionReducer`: `let lastApplied` before the loop, `const prevAction = lastApplied`,
  and `if (tmp !== newState) lastApplied = action;` before `newState = tmp;`. Six lines with the comment.
- **Tests first.** `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts` runs the real `_reducer` and the
  real `Uobj` under stubs of the `joiner` barrel and of the reducer's other imports. Its batches are the ones the
  probe recorded:
  - the IR row, the path label, the ObjectNode cell, and a non-canvas `L(o).note.value =` on a slot that holds a
    value;
  - a no-op on one element ahead of a write on another;
  - a root field changed ahead of the no-op.
  Each test asserts the previous state object is not mutated (snapshot and identity), the undo entry holds the
  slot, undo restores and redo reapplies. Controls: a single-action write, a rename, the first write of a mirage
  slot, one copy per element per batch, and an all-no-op batch. Before the fix 11 red and 4 green, after 15/15.
- **Mutation bench, 6/6 killed.** M1 `actions[i-1]` back (11 red). M2 set unconditionally (11). M3 condition
  inverted (12). M4 never set (1, copied once per batch). M5 `tmp !== oldState` (1, root field ahead of the no-op).
  M6 the check after the assignment (1). Each was applied in place, the test file run, and the file restored by
  copy (`cmp` identical).
- **Gates.**
  - Typecheck exit 2, the 14 of §17 by file and code.
  - Vitest 6990 passed and 4 failed in 278 files: the 9 known import reds, plus `scripts/hooks/__tests__/criticalZone.test.ts`
    4 red only because this session carries `JJODEL_CRITICAL_ZONE_GOAHEAD`; it passes 70/70 with `env -u`. A
    ticket is in the inbox entry.
  - Build exit 0.
- **Probe, step 2**, `lane-run probe … --port 3077`: **33/33**, all eight cases restore on Cmd+Z and reapply on
  Cmd+Shift+Z. The 35 of §2.4 included the two checks of the in-flight patch, which on the fixed tree match nothing
  by design. Crops, 4 per case: `~/.jjodel-lanes/P-2026-10-03-1632/crops/`, for example `row_1_before`
  (`tokens = 2`), `row_2_written` (`7`), `row_3_undone` (`2`), `row_4_redone` (`7`).
- **The four demo scenes** (`_tmp_undo_scenes.ts`, gitignored): DemoPEST, DemoPetri, DemoESM and DemoFlowB imported
  from `~/jjodel-demo-exports/`, the M1 in the default viewpoint, a `.react-flow` shot after fit view.
  - «before» serves `reducer.ts` with the fix reverted in flight. That is the `d2a1866b6` code, the only app file
    that differs; the revert was asserted once per load.
  - Every load opens with nodes and no console error but the load-time `init_dash`.
  - First pair: three scenes 0 px, DemoFlowB 891 px.
  - Control: the reverted code against itself (before against before2) gives DemoFlowB 881 px, the others 0. So
    DemoFlowB's edges vary run to run (box at 2x `[1067, 78, 1801, 510]`).
  - Second pair (before2 against after2): **all four 0 px**.
  - P12 control: two different scenes differ by 826428 px.

The inbox entry goes at the end of `docs/log-inbox/symbol-editor.md`, where the fold expects it. The prompt's
«append under the ticket» is read as «in the ticket's inbox», and the entry names the ticket. The `log-entry` skill
says to commit the inbox alone; P13 (RC-17) puts the Status flip and the entry in one closure commit, and the prompt
asks for that, so this commit follows P13.

### 7.1 Second trunk take (2026-10-03)

The trunk moved after the closure commit `bb7a3f985`, to `26b62ea01` (sim-polish, `editor-v2/sim/`). It was taken in
`22a3b33b4`, a clean merge, and everything was rerun there [M]:
- typecheck exit 2, the 14 of §17;
- vitest 7007 passed and 4 failed in 279 files: the 9 known import reds plus the 4 env-only reds of
  `criticalZone.test.ts`, 70/70 with `env -u`;
- build exit 0;
- probe 33/33, crops regenerated.

The scenes on the merged tree:
- Pairs `m-before` (fix reverted in flight, asserted) against `m-after` and `m-after2`: DemoPEST, DemoPetri and
  DemoESM 0 px.
- DemoFlowB renders in a few variants from run to run: 17, 870, 881 and 891 px between runs, the same box at the
  top of the canvas, 870 and 881 between two runs of the same reverted code.
- Byte comparison of the seven DemoFlowB shots (`cmp`): `before` = `m-after2` and `before2` = `after2`. Each variant
  the fixed reducer draws is byte-identical to one the `d2a1866b6` reducer draws.

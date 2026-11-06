# Discovery 2026-11-07 — S3-4's extra undo entry: a click in the problem overlay selects the node

- Prompt-ID: P-2026-11-07-0005 (diagnosis, `docs/prompts/claude_2026-11-07_0005_prompt_onto_s3_4_diagnosis.md`,
  session fc09b778, stopped at the context ceiling before this report; its handoff is
  `~/.jjodel-lanes/P-2026-11-07-0005/handoff.md`) and P-2026-11-07-0040 (fix, runs, this report,
  `docs/prompts/claude_2026-11-07_0040_prompt_onto_overlay_click_fix.md`, session 40d438a7).
- Tree: `~/jjodel-w-oi-s3a`, branch `oi-s3a`. Diagnosis on `6b52b905d`..`ccb3abd2b`; fix `72ad1753d`; runs on
  `72ad1753d`.
- Executor model: Opus 5.5 (`claude-opus-5-5`), both lanes.
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

Tags: **measured** = a run in one of the two lanes (which one is said); **read** = a file read. The P-2026-11-07-0005
measurements are reported from its handoff; their capture files are under `/tmp/P-2026-11-07-0005/`.

## 1. Objective

P-2026-11-06-2340's diagnostic run of `frontend/scripts/probe/onto-s3a-slot-problems.ts` on the default export
(`~/jjodel-demo-exports/uml/uml-class-object.jjodel`) went 7/8, S3-4 FAIL with `{"undo":[4,6,5],"created":12,
"stillThere":[],"missingBackMs":22}` (**measured** there, `~/.jjodel-lanes/P-2026-11-06-2340/probe-onto-s3a-slot-problems.log:34`):
one «Sync slots» added two undo entries instead of one, and one Cmd+Z took back only the upper one. Find the second
entry's origin, fix it, and show S3-4 green.

S3-4 (**read**, `frontend/scripts/probe/onto-s3a-slot-problems.ts:294-296`):

> `check('S3-4 one Cmd+Z: the undo stack +1 then back, every created id gone from idlookup, the missing entry back',`
> `    s31.undo === (s30.undo ?? -2) + 1 && s4.undo === s30.undo && created3.length > 0 && back4.length === 0 && r4.ok,`

## 2. Hypotheses and verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The extra entry is a write caused by the click on «Sync slots» itself, not by the sync. | **Holds** (read + measured, §3.1, §3.2) |
| H2 | That write is the node's selection: the click bubbles out of the overlay portal to ReactFlow's `onNodeClick`. | **Holds** (read §3.1; measured §3.2: `isSelected` / `_lastSelected` in the composite) |
| H3 | It becomes an entry of its own only when a COMMIT tick dispatches it before `syncSlots` opens its undo group (a race), otherwise it is folded into the group. | **Partly**: the folding is measured (two runs, §3.2); the unfolded ordering was not reproduced on demand (§3.3) |
| H4 | 329bda77e (the S3a tip before the L-chain) is equally exposed and its 8/8 was timing. | **Partly**: same code read (§3.4); not measured, the `329bda77e` runs of the handoff were never made |
| H5 | Stopping `click` at the overlay root removes the write, and S3-4 goes 8/8 consistently. | **Holds** (measured, §5: 3/3 runs 8/8, no selection write in the capture) |
| H6 | `dblclick` and `contextmenu` reach the node the same way. | **Holds** (read, §3.1) |

## 3. Findings

### 3.1 The path of the click (read)

The overlay is rendered by the dot, inside the node component, as a portal on `document.body`
(`frontend/src/components/editor-v2/problems/NodeProblemIndicator.tsx:69` `<NodeProblemOverlay`;
`NodeProblemOverlay.tsx:176` at `bfd8f29e1` `return createPortal(`). A React portal bubbles through the React tree,
not the DOM, so the node's handlers receive every bubbling event fired inside it. Before the fix the root stopped one
event (`NodeProblemOverlay.tsx:183` at `bfd8f29e1`):

> `onMouseDown={e => e.stopPropagation()}`

The dot stops its own click (`NodeProblemIndicator.tsx:35` `e.stopPropagation();`); the overlay's actions did not.
`onAction` runs the action and returns (`NodeProblemOverlay.tsx:160`):

> `if (p.action?.run) { p.action.run(); onClose(); return; }`

and the click goes on up to ReactFlow's node wrapper
(`frontend/node_modules/@xyflow/react/dist/esm/index.mjs:2240`, `@xyflow/react` as installed in this worktree):

> `onContextMenu: onContextMenuHandler, onClick: onSelectNodeHandler, onDoubleClick: onDoubleClickHandler,`

which calls the `onNodeClick` prop (`frontend/src/components/editor-v2/EditorV2.tsx:5094`
`onNodeClick={handleCanvasNodeClick}`; `:5055` `if (!isPreviewId(node.id)) jjomSelection.onNodeClick(event, node);`,
read by P-2026-11-07-0005), then `useJjomSelection.ts:223` `selectElement(node.id, modelid)` and the
`TRANSACTION('EditorV2 select', ...)` at `:95` (read by P-2026-11-07-0005): the `isSelected` / `_lastSelected` writes.

The same bubbling reaches two other handlers (H6):

- contextmenu: `EditorV2.tsx:5091` `onNodeContextMenu={handleCanvasNodeContextMenu}` wires the wrapper's
  `onContextMenuHandler` (`index.mjs:2150` `const onContextMenuHandler = onContextMenu`), so a right click inside the
  overlay opened the node's menu.
- dblclick and click on the node body: in the pill form the indicator is a child of the body
  (`frontend/src/components/editor-v2/nodes/ObjectNode.tsx:1197-1198`
  `onDoubleClick={handleDoubleClick}` / `onClick={() => { if (selected && !editing) setEditing(true); }}`, indicator at
  `:1202`): a double click in the overlay started a rename. The rectangle form has the same handlers at `:1290-1291`
  and its indicator at `:1272`; whether `:1272` sits inside that element was not read.
- `onNodeDoubleClick` is not wired in `EditorV2.tsx`: `command grep -n "onNodeDoubleClick\|onNodeContextMenu\|onNodeClick="`
  returned only `:3180`, `:5062`, `:5091`, `:5094` (the other two patterns are the positive control of the same search).

### 3.2 Where the selection lands (measured by P-2026-11-07-0005, on `ccb3abd2b`)

The undo mechanics (read by P-2026-11-07-0005): the store sends its writes on a 300 ms tick
(`reducer.ts:1527` `setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`, `U.tsx:178`), the
composite is dispatched in a `setTimeout(..., 0)` (`action.ts:349`); a delta outside a group more than 450 ms after the
top entry, and not `_lastSelected` alone, becomes an entry of its own (`reducer.ts:1358-1370`, `:1341-1345`).
`syncSlots` opens its group only after `queued()` and `await writeModules()`, seven dynamic imports
(`hooks/instantiate.ts:647-665`).

- Capture run 2 (natural click): 8/8, S3-4 `undo [4,5,4]`. No dispatch between the dot click (t=2) and the «Sync
  slots» click (t=737). The first composite at t=1072 (n=27) carries the sync's first writes and two selection writes,
  `SET_ME_FIELD idlookup.<dune vertex>.isSelected` and `SET_ROOT_FIELD _lastSelected`, with the stack
  `GraphDataElements select <- useJjomSelection selectElement <- onNodeClick <- EditorV2 handleCanvasNodeClick`.
  Pushed inside the open group, folded. `/tmp/P-2026-11-07-0005/cap-new-S3-4.json`.
- Capture run 3 (`CAP_FORCE_DELTA=5`, click 5 ms before a predicted tick): click 1067, tick 1081, the selection
  composite (n=2, created 1068) dispatched alone at 1089; the sync's first write was created at 1087, so the group was
  already open at 1089 and the entry was folded (lens 10 → 5 at `endUndoGroup`). 8/8. The 1 ms poll was starved from
  1069 to 1175, so the group's opening is bounded only by [1069, 1087]. `/tmp/P-2026-11-07-0005/cap-new-f5-*.json`.
- S3-5 (the node menu's «Sync slots», no overlay): no selection write in the capture.

### 3.3 The race (H3)

Both capture runs show the selection write born at the click and carried in the first composite after it. It joins
the sync's group whenever the group is open when that composite reaches the reducer; it becomes an entry of its own,
the `[4,6,5]` of P-2026-11-06-2340, when the tick and its `setTimeout 0` both fall between the click and
`beginUndoGroup`, a window that the `await writeModules()` stretches under load. The ordering that produces the
FAIL was **not reproduced on demand**: the handoff's planned run with `CAP_FORCE_DELTA=40 CAP_FORCE_COMMIT=1` was never
made. With the fix in place the question is moot: the click no longer writes anything (§4), so no ordering can add
an entry. The same write explains the 2026-10-21 M4 ticket (`docs/log-inbox/instance-of.md:145`, «an undo entry with
nothing created after a problem-dot click»): under M4 there was no group, so the selection was always +1.

### 3.4 329bda77e and the trunk (read by P-2026-11-07-0005)

- `329bda77e..HEAD`: overlay, indicator and `useJjomSelection` unchanged; `EditorV2` only wraps `onNodeClick` in
  `handleCanvasNodeClick`, same call. `syncSlots` has the same `await` before the group (`instantiate.ts:620-633`
  there). Same exposure by code; its 8/8 runs are timing (not measured).
- Trunk `~/jjodel-release` at `59947fc70`: the same portal with only `onMouseDown` stopped
  (`NodeProblemOverlay.tsx:174,181` there), no `hooks/instantiate.ts`, no «Sync slots». The S3a capture cannot run
  there, but the overlay's other actions («Scroll to duplicate», focus-node) select the node the same way.

## 4. The fix (`72ad1753d`, P-2026-11-07-0040)

`frontend/src/components/editor-v2/problems/NodeProblemOverlay.tsx:185-188` at `72ad1753d`:

> `onMouseDown={e => e.stopPropagation()}`
> `onClick={e => e.stopPropagation()}`
> `onDoubleClick={e => e.stopPropagation()}`
> `onContextMenu={e => e.stopPropagation()}`

with a two-line comment above `return createPortal(`. Canvas v2 UI only; no D-layer, sync, `reducer.ts` or
`EditorV2.tsx` change. The rejected alternative (core): treat `isSelected`-only deltas as transient in `reducer.ts`.

Test `frontend/src/components/editor-v2/problems/__tests__/NodeProblemOverlay.test.ts` (**measured**). Vitest runs in
`node` (`frontend/vitest.config.ts:14` `environment: 'node',`) and `frontend/node_modules` holds no `jsdom`,
`happy-dom` or `@testing-library` (`ls node_modules | command grep -E "^(react|react-dom|...|jsdom|happy-dom|...)$"`
listed `react` and `react-dom` only, the positive control of the same pipe). So the overlay is rendered by
`react-dom/server` with `createPortal` mocked to capture its element, and each event is driven along the captured tree
from the target up, as React bubbles it, to a spy standing for the node. The walk is the test's, not React's; the
handlers it calls are the overlay's own. A control case proves the walk reaches the spy when nothing stops it.

- Before the fix: 4 failed | 2 passed (6) (both click cases, dblclick, contextmenu; control and mousedown green).
- After: 6/6, and `hooks/__tests__/instantiate.test.ts` green beside it (2 files, 31 tests).
- Mutation bench (`~/.jjodel-lanes/P-2026-11-07-0040/bench.txt`): each of the four stops deleted alone is killed by the
  test that names it (click: 2 red; dblclick, contextmenu, mousedown: 1 red each); reverted, tree clean.
- Gates on the fix: typecheck exit 0; build exit 0 (only the known dynamic-import warning).

## 5. The three runs (H5)

**Holds** (measured, P-2026-11-07-0040, on `72ad1753d`, default export, `lane-run probe ... --port 3088`, one run per
call with the 1-minute load under 20 at start). Logs: `~/.jjodel-lanes/P-2026-11-07-0040/probe-onto-s3a-slot-problems.log`
(the three runs appended), split copies `/tmp/P-2026-11-07-0040/probe-run{1,2,3}.log`.

| Run | Result | S3-4 | Load 1-min start → end |
|---|---|---|---|
| 1 | 8/8, exit 0 | `{"undo":[4,5,4],"created":12,"stillThere":[],"missingBackMs":8}` | 18.21 → 16.30 |
| 2 | 8/8, exit 0 | `{"undo":[4,5,4],"created":12,"stillThere":[],"missingBackMs":6}` | 14.26 → 13.25 |
| 3 | 8/8, exit 0 | `{"undo":[4,5,4],"created":12,"stillThere":[],"missingBackMs":7}` | 14.19 → 15.38 |

Three green runs do not prove a race closed; the capture below shows the write that caused it is gone. One run of
P-2026-11-07-0005's instrumented capture (`/tmp/P-2026-11-07-0005/s34-capture.mts`, natural click,
`CAP_OUT=/tmp/P-2026-11-07-0040/cap-fix`): 8/8, S3-4 `undo [4,5,4]`. Occurrences of `isSelected` / `_lastSelected`
per capture file, counted with `command grep -o ... | wc -l`:

| Capture | `isSelected` | `_lastSelected` | First composite after the action click |
|---|---|---|---|
| `cap-new-S3-3.json` (P-2026-11-07-0005, before the fix; positive control) | 3 | 3 | t=1072 `"EditorV2 select"`, n=27 |
| `cap-fix-S3-3.json` (this lane, fix) | 0 | 0 | t=883 `"slots.addObject()"`, n=25 |
| `cap-fix-S3-4.json` / `cap-fix-S3-5.json` (fix) | 0 / 0 | 0 / 0 | — |

The 27 → 25 difference is the two selection writes. Before the fix that composite carried the selection's TRANSACTION
name, `EditorV2 select`, together with the sync's first writes (§3.2): folded only because the group was already open.

## 6. Dependencies and risks

- A click inside the overlay no longer reaches window-level bubble listeners either: React's `stopPropagation` stops
  the native event at the portal container. Capture-phase listeners (the overlay's own outside-mousedown, the Escape
  key) are unaffected. `mousedown` already behaved this way.
- A right click inside the overlay now shows the browser's menu instead of the node's.
- Not covered: keyboard. The wrapper has `onKeyDown: isFocusable ? onKeyDown : undefined` (`index.mjs:2240`), and
  that handler selects on the selection keys (`index.mjs:2177-2183` `if (elementSelectionKeys.includes(event.key) &&
  isSelectable) { ... handleNodeClick({`). Enter or Space on a focused overlay button would bubble its keydown there.
  Whether that path writes `isSelected` to the D-layer was not measured.

## 7. Proposed tickets

- uml-s3b probe setup: on `ccb3abd2b` the S3a probe on `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` gets
  past the viewpoint trigger and then aborts with `fixture ids missing ... "vertices":["Pointer..._USER_437"],
  "vid":null`: dune's one vertex is not drawn in the active pane after picking «UML object diagram» (measured by
  P-2026-11-07-0005, `~/.jjodel-lanes/P-2026-11-07-0005/probe-onto-s3a-slot-problems.log`). Cause not measured.
- Keyboard activation inside the overlay (§6), low.

## 8. Open questions

1. Should the keydown of the overlay's buttons also stop at the root (§6), in a lane of its own?
2. Does the trunk want the same four stops for its overlay actions (§3.4), as a cherry-pick of `72ad1753d` without the
   «Sync slots» test case?

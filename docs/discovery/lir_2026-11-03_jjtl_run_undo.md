# Layer Impact Report: a JjTL run is one undo step (P-2026-11-03-1435)

**Prompt-ID**: P-2026-11-03-1435. **Prompt**: `docs/prompts/claude_2026-11-03_1435_prompt_jjtl_run_undo.md` (commit `2d22414b0`).
**Chat**: C-2026-11-03-1020. **Tree**: `~/jjodel-w-jjtlundo`, branch `jjtl-run-undo`, HEAD `2d22414b0` at the start.
**Ticket**: #458. **Rules read**: R-PLG-5 (every Run is one undo step; R-RFB-12 is on branch `rfo`, not on the trunk),
R-JJD-6 (the undo group), R-UNDO-2 (the user's gesture opens the D-layer history, `textApply.ts:87-88`).

Written before any edit. Line numbers are those of `2d22414b0`. None of the files of `CLAUDE.md` §3.1 is edited, and
neither are the reducer, `action.ts` or `joiner/classes.ts`: the run calls the exported `beginUndoGroup` /
`endUndoGroup` (`reducer.ts:1136-1158`) and `COMMIT(undefined, false)` (`action.ts:120`), as `applyAsOneStep` does
(`PreviewBar.tsx:60-70`).

## Why Undo does nothing today (measured)

Probe `~/.jjodel-lanes/P-2026-11-03-1435/probe/undo.ts`, label `baseline-plain-b2_1`, on `2d22414b0`: the run adds 51
idlookup entries (11 objects, 11 vertices, the model, its graph), every action has sender `DUser.current`, and
`statehistory[DUser.current].undoable` is 0 before and after the run. Cmd+Z and Cmd+Shift+Z change nothing. The cause is
`isRelevantChangeCheck` (`reducer.ts:1347`): until `U.userHasInteracted` is raised (a pointerdown or keydown on a canvas,
`EditorV2.tsx:1218-1223`) no delta is relevant, and with no entry below there is nothing to merge into, so every delta
of the run is dropped. Clicking Execute in the JjTL tab does not raise it.

## What changes

The run raises `U.userHasInteracted` (the gesture opens the history, R-UNDO-2) and opens an R-JJD-6 undo group after the
executor has succeeded, just before the STEP 1 `TRANSACTION` (`ProjectEditor.tsx:1713`), with the pending batch
flushed first so a write queued before the click stays out of the group. A run that fails in the executor writes
nothing and opens no group. The group is not a TRANSACTION: it only marks the length of the user's undo stack and folds
the entries pushed since the mark, so it nests no creator (NN-12 holds).

The group closes after the last write, which is not one point today. Three things write after `handleExecuteTransformation`
returns: STEP 7 (`:1922-1943`, `DockManager.open2` at +2000 ms), the STEP 8 timer (`:1984-2357`, nested walk STEP 6c, the
nested attributes, STEP 8b pointers, through `nestedDone.then(...)`), and, once the tab mounts, `useJjomSync` Step 2bis
making one `DVertex.new` per object without a vertex (read, not edited). The closer waits, in order: the STEP 8 timer and
its chain; the STEP 7 deadline (+2000 ms from a point after STEP 7 is scheduled); then a quiet store, no dispatch for
800 ms (above the 300 ms batch interval), with the pending batch flushed on each turn; then it ends the group. A cap of
180 s ends the group in any case, so a stuck write-back cannot hold every later edit inside the run's step. An exception
in the run ends the group at once (after the quiet wait).

STEP 7 lines are not touched. STEP 8 gets two edits: one line at the top of its timer callback (it marks that the timer
ran) and the assignment of the `nestedDone.then(...)` chain to a variable. Branch `jjtl-output-tab-late` replaces STEP 7
with `openOutputTab`, called by STEP 8 when it ends (`.finally(...)` on the same chain), never before +2000 ms from its
own scheduling point. Composed: the assigned chain then includes `.finally(openOutputTab)`, whose timer is due at or
before this lane's deadline; the tab opens, `useJjomSync` writes the vertices, and the quiet wait keeps the group open
until they are in. The two diffs touch different lines of STEP 8 (the tab-late hunks are the `.finally`, the `else`, the
`catch` and the `!lModel` return); the merge is expected to be textual-clean, to be checked when both land.

## LAYER IMPACT REPORT

```
Layers touched:
  [x] D-layer (Redux raw data)        only the undo history around it (statehistory), no write added
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   indirectly: its vertex writes fall in the run's undo step
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)  not edited; its writes are grouped, not changed
  [ ] Persistence (VersionFixer / jsxString)

D-layer
  - What changes: the deltas of one run (model, graph, objects, values, vertices, the tab's EDITOR_TYPE_CHANGE, the
    canvas vertices) become one entry of statehistory[DUser.current]; U.userHasInteracted is true after a run.
  - What does NOT change: the actions, their order, their payloads; no TRANSACTION added; the reducer is not edited.
  - Cross-layer interaction: Undo reverts the model; ModelTab closes its tab when the model is gone
    (ModelTab.tsx:30, R-TXT-25 (1)), as for Create model.
  - Side-effect safety: an edit by the user while the group is open is folded into the run's step (measured below,
    not fixed); a second run started while the first group is open nests and both end as one step.

Canvas v2-flow
  - What changes: nothing in its code; its writes during the window are part of the step.
  - What does NOT change: guards, keys, vertex positions.
  - Side-effect safety: Redo brings back the vertices with the model (measured below).

Smoke-test scenarios potentially affected:
  - run, Undo: no output model, no tab, no vertices, idlookup equal to before the run
  - Redo: the model, its tree, attributes and references equal to after the run
  - a second run after an Undo; a run that fails in the executor; b10_8 and the time Undo blocks the page
  - after the run, a user edit is one more undo step (U.userHasInteracted now true)
```

# Discovery — Jjodie panel redesign: docked panel, canvas preview, editable scripts, live JjEL

- Prompt-ID: P-2026-10-24-0020 (Phase 1), report written by P-2026-10-24-0115 (continuation, docs only)
- Prompt files: `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`,
  `docs/prompts/claude_2026-10-24_0115_prompt_jjodie_panel_report_from_handoff.md`
- Sessions: d2a06543 (discovery, stopped at the AM-8 context ceiling before writing), f0d0630e (this report and the three open checks)
- Chat: C-2026-10-24-0020 · Front: jjodie-ui
- Tree: `~/jjodel-w-jjodiepanel`, branch `jjodie-panel`, cut at `627ed4d79`; this report written on HEAD `2dae21978`
  (docs-only commits on top of the cut, no source file changed since)
- Executor model: claude-opus-5-5
- Handoff of session d2a06543: `/Users/alfonso/.jjodel-lanes/P-2026-10-24-0020/handoff.md`

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the
real files.

**Provenance tags.** `read (d2a06543)` = read in the discovery session and carried from its handoff, not re-read here
(the P-2026-10-24-0115 prompt forbids re-verification); `read (f0d0630e)` = read in this session. Nothing in this report
was executed (`measured` would mark a run; there is none). Every line number refers to the tree at `627ed4d79`.

## Goal

Establish, for the six slices S1..S6 of the prompt, where the code lives, what the executor and the evaluator allow
today, whether the ghost preview and the dry run can be done without the critical zone and without mutating the live
model, and how the work splits into lanes.

## Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | The Jjodie panel can be docked to the right of the editor without a critical-zone file | holds (Q1, D1); the Properties overlay must be offset (Q1 addendum) |
| H2 | A script can be dry-run without mutating the live model | holds only as a pure planner; falsified for store-copy, live run+rollback and the `liveStateChanges` sandbox (Q2, D2) |
| H3 | `set` on a multi-valued feature overwrites today, so an `add` command is needed | falsified for M1 references: `set =` appends (Q2, D5); attributes not measured |
| H4 | Preview elements can be drawn without DValue/DVoidEdge objects and without sync files | holds (Q3, D3) |
| H5 | Multi-selection exists and can be subscribed to | partly: React Flow only, local to EditorV2, not published (Q4, D6) |
| H6 | JjEL evaluation can be aborted or bounded in time | falsified today; an additive deadline is feasible (Q5, D4) |
| H7 | An existing artifact type can hold a script file | falsified: S6 needs a new persisted field (Q6, A1) |

## Files read

Session d2a06543 (paths under `frontend/src/`): `App.tsx`, `components/Jodie/Jodie.tsx`, `components/Jodie/JodieWindow.tsx`,
`components/Jodie/JodieWindow.css`, `components/Jodie/JodieHeader.tsx`, `components/Jodie/ChatInput.tsx`,
`components/Jodie/ChatMessages.tsx`, `components/Jodie/consumerProposalModel.ts`, `components/Jodie/jodieJjelContext.ts`,
`components/Jodie/console/providers/jjelProvider.ts`, `components/common/MarkdownRenderer.tsx`,
`pages/components/Dashboard.tsx`, `pages/dashboard.scss`, `pages/components/LeftBar.tsx`,
`components/editor-v2/viewportInset.ts`, `components/editor-v2/EditorV2.tsx`, `components/editor-v2/hooks/useJjomSelection.ts`,
`components/editor-v2/edges/UnifiedEdge.tsx`, `jjscript/services/JjScriptService.ts`, `jjscript/executor/executor.ts`,
`jjscript/executor/runPasses.ts`, `jjscript/executor/referenceWrite.ts`, `jjscript/executor/commands/{set,copy,move,remove,instance,add,undoredo,eval}.ts`,
`jjscript/parser/parser.ts`, `redux/action/action.ts`, `redux/reducer/reducer.ts`, `common/U.tsx`, `joiner/proxy.ts`,
`joiner/classes.ts`, `model/logicWrapper/LModelElement.tsx`, `jjel/index.ts`, `jjel/evaluator/evaluator.ts`,
`jjel/evaluator/context.ts`, `model/megamodel.ts`, `components/megamodel/MegamodelView.tsx`,
`components/project/ProjectEditor.tsx`, `components/abstract/DockManager.tsx`, `components/abstract/TabDataMaker.tsx`,
`events/registry.ts`; `docs/decisions.md` (R-JS-1..15, 5622-5774). Windows as cited per finding; no file was read whole
except where the handoff says so.

Session f0d0630e: `frontend/src/types/jodie.ts:904-948` and `:200` (grep), `frontend/src/components/editors/PropertiesWithTreeView.tsx`
(grep over the file, plus 706-740), `frontend/src/components/editors/properties-with-tree-view.scss:1330-1369`; `docs/decisions.md` (grep `D-UI-1`).

---

## Q1 — Jjodie panel

All `read (d2a06543)` unless marked.

- Mount: `App.tsx:179` `{user && <Try><Jodie/></Try>}` — global, inside HashRouter, outside ProjectPage.
- `Jodie.tsx` (975 lines): `consoleMode` in memory (`:168`), code flavour in localStorage (`:170`); render `:930-972`:
  `JodieWindow` when open, else `JodieMinimized` (FAB); enter/exit transition `:897-928`.
- `JodieWindow.tsx` (506): floating, `position: fixed; z-index: 10000` (`JodieWindow.css:23-25`); position/size from
  `JodieConfig.current.position/size` (`:147-152`), saved at `:204-213`; 8-way resize handles `:423-434`; fullscreen
  (`:247-259`, exit `:262-270`, reset `:273-284`) is x=0, y=0, width 760, height = innerHeight; DEFAULT 760x520,
  MIN 320x400, MAX 1200x900 (`:90-102`). Executing toolbar `:456-468`. `<AIDisclaimer feature="chat"/>` at `:501`.
- `JodieHeader.tsx` (341): avatar, name, alive dot `:212-223`; `ProviderModelSelector feature="chat" compact` in the
  header `:224-228`; mode switch, segmented tablist `.jodie-mode-switch` `:234-250`; context chip
  `.jodie-metamodel-indicator` `:255-287`; right side Clear `:290-299`, Reset `:300-309`, Fullscreen `:310-319`,
  Close `:320-326`; JjEL sub-row "scope: self, model, classes" `:330-336`. No "new conversation" button and no overflow
  menu exist today; Clear is the nearest (search scope: the header file, d2a06543).
- `ChatInput.tsx` (871): composer `.jodie-composer` `:773`; mode glyph
  `<span class="jodie-code-prompt">{consoleMode}></span>` `:774` — the left-side slot for the S1 mode selector;
  textarea `:775-790`; JjEL submit clears the input at `:349-355` (S3 must keep it instead).
- Code blocks: `components/common/MarkdownRenderer.tsx` `CodeBlock` `:75-170`: header with language, `Run`
  (`.md-code-jjscript`, `:133-142`) and Copy; Run swaps the block for `<ScriptBlock code onExecute allowExecution onClose>`
  (`:109-120`); a consumer receives a `ConsumerProposal` (Apply/Discard list) `:103-106`. SyntaxHighlighter `:165`.
- `ChatMessages.tsx` (565): `MessageBubble` `:65-235`, `executeInScope` `:79-82`; offer card Run/Ask `:93-129`; the
  scope-bound executor callback `:470-520` runs each command through `JjScriptService.execute(command, scope)` `:495`,
  then `onJjScriptExecuted` `:515`.
- Layout host for docking: `pages/components/Dashboard.tsx` `ProjectDashboard` `:563-676`; grid
  `.dashboard-container two-column[ hide-leftbar]` `:652`; `<LeftBar>` plus `.project-dock-wrapper` (`<Dock/>` and
  `PropertiesWithTreeView mode='floating'`) `:653-667`; a TODO RightPanel slot `:668-672`. Grid CSS
  `pages/dashboard.scss:382-394` (240px 1fr / 1fr).

### Q1 addendum — the two open S1 checks, `read (f0d0630e)`

**Where the panel size is persisted.** `JodieConfig` is a class in `frontend/src/types/jodie.ts:906`, with
`position?: { x: number; y: number };` (`:911`) and `size?: { width: number; height: number };` (`:912`).
`save()` writes the whole object as JSON to localStorage: `localStorage.setItem(AI.STORAGE_GLOBAL_CONFIG, json);`
(`:928`), key `static STORAGE_GLOBAL_CONFIG: string = 'jjodie-credentials';` (`types/jodie.ts:200`). So "persisted per
user" today means per browser profile, not per account; no server-side user setting is involved. The rail next to it
does the same: `const STORAGE_KEY_OVERLAY_WIDTH = 'jjodel_property_overlay_width';`
(`PropertiesWithTreeView.tsx:62`, read `:302`, written `:310`). A dock width fits as an optional field on
`JodieConfig` (rule 11 allows adding an optional property to an exported class), saved through the existing `save()`.
Note: `save()` also cascades into every provider config (`:929-931`), so writing on every drag frame is to be avoided;
write on pointer-up, as `JodieWindow.tsx:204-213` does for position.

**How the Properties overlay is positioned.** It is viewport-anchored, not wrapper-anchored. The rail is portaled to
body: `// 'floating' (F2) portals the rail to <body>.` (`PropertiesWithTreeView.tsx:710`), and the comment at
`:716-718` reads `Portaled to <body> (position:fixed, tier z ~900) so it escapes the dock DOM.` The CSS,
`properties-with-tree-view.scss:1331-1349`: `.properties-tree-overlay { position: fixed;` … `right: 0;` (`:1344`,
"Flush with the viewport edge (D-UI-1)") … `z-index: 900;`. The canvas inset writer publishes
`const inset = overlayShown ? overlayWidth + 8 : 0;` and
`document.body.style.setProperty('--jj-canvas-right-inset', \`${inset}px\`);` (`PropertiesWithTreeView.tsx:654-655`),
plus `--jj-rail-width` (`:656`).

Consequence for S1 (D7): a Jjodie column in the dashboard grid shrinks the dock and the canvas, but the rail stays at
`right: 0` and would cover the Jjodie column. The rail's `right` must become the Jjodie dock width (a body-level
variable, default `0px`, declared in `styles/tokens/` per rule 28 and written at runtime by the Jjodie dock the way
`--jj-canvas-right-inset` is written). `--jj-canvas-right-inset` itself stays correct, because it is measured from the
right edge of the canvas, which moves left with the column. Whether `body[data-editor-type]` rules or the smoke
assertion A5 (`properties-tree-overlay` top) are affected is a Phase 2 check.

## Q2 — JjScript executor

All `read (d2a06543)`.

- Entry: `jjscript/services/JjScriptService.ts:27` `static async execute(input, scope)`; executor
  `jjscript/executor/executor.ts:54` `JjScriptExecutor`, `execute` `:76`, `executeAST` `:102-250`
  (waitForDependencies `:108-118`, profile guard `:124-138`, bound-scope guard `:143-157`, switch `:161-232`).
  Multi-pass run: `executor/runPasses.ts:183` (R-JS-3/5/7/8), called by `ScriptBlock.tsx:603` and `:955`.
- No run-level TRANSACTION: TRANSACTION appears only per command inside handlers (`commands/set.ts:112`, `copy.ts:85`,
  `move.ts:90`, `remove.ts:99,196`, `instance.ts:864,1003,1064,1151,1269`); `DObject.new` is not inside a TRANSACTION
  (`instance.ts:11`, `:601-617`).
- TRANSACTION is async and awaits its function (`redux/action/action.ts:210-226`); BEGIN/ABORT/COMMIT/END `:103-182`.
  The app keeps a BEGIN open and COMMITs every `U.UpdatingTimer` = 300 ms (`redux/reducer/reducer.ts:1445`,
  `common/U.tsx:178`); `settlePendingWrites` forces a COMMIT (`instance.ts:313-332`).
- Undo: one delta per relevant reducer change pushed to `statehistory[user].undoable` (`reducer.ts:1200-1265`); merging
  only for vertex/graph-only deltas (`:1212`); undo pop `:1130`. The JjScript `undo` command has its own closure stack
  (`executor.ts:56-57`, `commands/undoredo.ts:16-47`), unrelated to the app undo. No undo-group facility: grep
  `undoGroup|groupUndo|undoBatch|beginUndo|forceMerge` empty; positive control `statehistory` in `reducer.ts`, same
  invocation, found.
- Dry run: no clone or sandbox of the store exists. A dormant `U.liveStateChanges=false` (`common/U.tsx:179`) makes
  actions reduce into `transientProperties.livePatches` (`action.ts:326-328`), read by the proxies
  (`joiner/proxy.ts:58-64`): a global flag, in core, and the 300 ms global commit plus the async awaits would capture or
  discard unrelated user actions → rejected. Live run plus undo mutates the live model and triggers sync → rejected
  (a stop item of the prompt). Precedent for a pure planner: `components/Jodie/consumerProposalModel.ts`
  (`readProposal(code, world)` `:274`, world types `:40-76`, bench-importable, parses with `jjscript/parser/parser`,
  reads idlookup) and `jjscript/executor/referenceWrite.ts` (pure plan of a reference write). The planner must
  re-implement: create instance [in P.ref] (R-JS-9 checks), set attribute/reference (`=`, `+=`, `-=` per R-JS-12/13/14),
  rename, delete; for M2 scripts, create class/attribute/reference.
- `set` on multi-valued: an M1 reference `=` APPENDS (single-valued replaces), `+=` appends with a room check, `-=`
  removes (`jjscript/executor/referenceWrite.ts:1-30`, `instance.ts:15-24`, R-JS-13 `docs/decisions.md:5756-5760`).
  Attributes: `=` writes `featureProxy.value = primitive` (`instance.ts:1003-1014`); `+=`/`-=` on attributes are refused
  with `OPERATOR_NOT_SUPPORTED` (`:976-987`). The semantics of `=` on a multi-valued attribute (overwrite or set the
  first) were NOT measured.
- `add` exists but CREATES (M2 sugar → executeCreate): `commands/add.ts:19-30`, parser `parser/parser.ts:642-666`;
  `add X to s.ref` with an existing element is a parse error that suggests `set <Instance>.<reference> += X`
  (`:643-652`).
- Opposites at M1: no mirroring. `grep -c 'opposite'` on `jjscript/executor/commands/instance.ts` = 0 (control
  `containment` = 18, same file, same invocation); L-layer `LValue.get_opposite` read-only
  (`model/logicWrapper/LModelElement.tsx:7485`), intent comment `:6930`, no write-path mirror found. Not executed.
  In the state machine example the script has to write both `State.outgoing` and `Transition.source` (A3).

## Q3 — Canvas overlay

All `read (d2a06543)`.

- `components/editor-v2/EditorV2.tsx` (5080 lines): `<ReactFlow nodes={flowElements.nodes} edges={flowElements.edges}>`
  `:4768-4811`; `flowElements = useMemo(() => hideRunEvents(irContainment.nodes, irContainment.edges, simEvents, ...))`
  `:1667-1671` — the R-SIM-16/29 precedent, whose comment says the elements are "flagged hidden on the arrays handed to
  React Flow only, so nothing is written, laid out or persisted" (`:1662-1664`). Preview nodes and edges can be
  appended at the same point without D-objects.
- Children inside ReactFlow: dot-grid svg, `IRContainmentHulls` `:4824-4830`, MiniMap `:4837-4853` (uses
  `--jj-canvas-right-inset`). `@xyflow/react ^12.10.0`; `EdgeLabelRenderer` is used in `edges/UnifiedEdge.tsx:954`.
  Floating bar: sibling overlays already follow `</ReactFlow>` (`EdgeTypePopup` `:4856`, `M1ReferencePopup` `:4865`);
  `sim/SimCanvasLayer.tsx` is another canvas-layer precedent.
- Risks: `onNodesChange={handleNodesChange}` `:4771` and `onNodeClick={jjomSelection.onNodeClick}` `:4786` must ignore
  preview ids (`selectElement` on an unknown id: `LPointerTargetable.fromPointer` returns null and the function returns,
  `useJjomSelection.ts:85-86`); set `draggable:false, selectable:false, deletable:false, connectable:false`; the
  stableNodes guard `:1582-1605` must not treat preview ids as churn.
- `EditorV2.tsx` is not in the CLAUDE.md §3.1 critical list. No sync file is needed. No Layer Impact Report is owed.

## Q4 — Selection

All `read (d2a06543)`.

- Canonical: Redux root `_lastSelected = {node, view, modelElement}`, written by `useJjomSelection.ts` `selectElement`
  `:83-124` (TRANSACTION plus SetRootFieldAction `:112-116`, deselecting all others `:102-106`), `deselectAll`
  `:139-176`, on model open `:207-215`. Also the `CANVAS_ELEMENT_SELECTED` event (`:63-77`, registry
  `events/registry.ts:23`). Ids are D-pointers; the L-proxy comes from `LPointerTargetable.fromPointer` / `L.fromPointer`.
- JjEL `self` reads it: `jjscript/executor/commands/eval.ts:322-339` (`data`/`node` from `_lastSelected`),
  `components/Jodie/jodieJjelContext.ts:37-47` (`self = data`).
- Multi-selection: only React Flow's internal `node.selected` (`multiSelectionKeyCode="Shift"`,
  `SelectionMode.Partial`, `EditorV2.tsx:4800-4801`), local memo `selectedNodes`/`selectedEdges` `:1561-1562`; the
  comment at `:1564-1568` says RF `n.selected` tracks flow-initiated selection only. Not published outside EditorV2.
  Whether a shift-click selection survives `selectElement` deselecting the others in the D-layer is NOT measured: the
  first step of S3b is a probe.
- Subscription: `store.subscribe` / `useSelector` on `_lastSelected` (pattern at `EditorV2.tsx:1569-1571`,
  `JodieHeader.tsx:118`).

## Q5 — JjEL evaluator

All `read (d2a06543)`.

- Public API `jjel/index.ts`: `jjelEval(source, variables?)` `:85-101` (throws),
  `jjelEvalWithDiagnostics(source, variables?) → {value, warnings}` `:135-151`, synchronous; exports `JjelEvaluator`,
  `JjelEvaluationError`, `EvaluationContext` `:41-52`.
- Jodie wrapper: `jodieJjelContext.ts:64-77` `evaluateJjelInJodie(expr) → {ok,text,value,warnings}`; it rebuilds the full
  project context on every call through `buildEvalContext(ctx)` (`jjscript/executor/commands/eval.ts:122`);
  `wrapSelectedElement` is module-private (`eval.ts:915`), so a per-element `self` for multi-selection needs an additive
  optional parameter.
- Errors: parse → `Error('JjEL parse error: ...')` (`index.ts:141-146`); runtime
  `JjelEvaluationError(message, expression?, cause?)` (`jjel/evaluator/evaluator.ts:75-83`); a missing feature is NOT an
  error but a silent null plus the warning `property-not-found` (`evaluator.ts:620-641`, type `evaluator/context.ts:165-190`;
  other kinds `undefined-identifier`, `ambiguous-instance`) → maps directly to `not applicable to <Kind>`.
- No abort, no time bound, no worker: grep `maxSteps|MAX_STEPS|deadline|Worker\(` in `jjel/` empty; the same command
  found `class JjelEvaluationError` (positive control). Single dispatch `JjelEvaluator.evaluate(expr, ctx)`
  `evaluator.ts:212-215` = one checkpoint for a deadline. A worker is not viable: the context is L-proxies over the live
  store.
- Provider: `components/Jodie/console/providers/jjelProvider.ts:16-19`; Jodie handler `Jodie.tsx:501-510`.

## Q6 — Project artifacts

All `read (d2a06543)`.

- `DProject` (`joiner/classes.ts:3065-3119`): metamodels, models, graphs, viewpoints, `transformations: any[]` `:3101`,
  layout fields. No script field. Transformations are persisted as a plain JSON array through
  `SetFieldAction.new(project.id, 'transformations', next, '', false)` (`components/project/ProjectEditor.tsx:217-234`)
  and read with `|| []`; LeftBar reads `project.transformations` (`pages/components/LeftBar.tsx:321-322`).
- Megamodel: `model/megamodel.ts:15` `ArtifactType = 'metamodel'|'model'|'transformation'|'script'` — the `script` tag
  exists, nodes are derived at runtime and never persisted (`:1-9`); `MegamodelView.tsx:86-89` maps `script` to the
  transformation kind.
- Tabs: `components/abstract/DockManager.tsx:345` `openTransformation` (precedent for a script tab),
  `TabDataMaker.tsx:28-67`.
- Conclusion: S6 needs a new persisted field (A1). No VersionFixer migration is strictly needed if it is read with
  `|| []`, exactly as `transformations`. `joiner/classes.ts` is core (rule 5).

## Q7 — Estimates per slice, lanes, context fit

Estimates, not measurements. File counts include new files. "Fits one lane" is judged against the AM-8 ceiling that
stopped P-2026-10-24-0020 at 200k: the large files of this front are `EditorV2.tsx` (5080), `Jodie.tsx` (975),
`ChatInput.tsx` (871), `reducer.ts`; a lane that must read windows of two of them plus run a visual probe is the one
that overflowed. Rule: every slice runs as **code and gates** (lane a) then **probe and closure** (lane b, browser
check on 3000, DOM measures, log, Status) unless marked small.

| Slice | Files (expected) | Risk | Fits one lane? |
|---|---|---|---|
| S1a dock + resize + overlay offset | `Dashboard.tsx`, `pages/dashboard.scss`, `Jodie.tsx`, `JodieWindow.tsx` + `JodieWindow.css` (floating/maximize removed), `types/jodie.ts` (optional `dockWidth`), `properties-with-tree-view.scss` (`right`), `styles/tokens/` (new var) — 8 | medium: layout, rail offset, smoke A5 | no: code+gates, then probe (panel width, handle, rail edge) |
| S1b header + composer + code blocks | `JodieHeader.tsx`, `ChatInput.tsx` + its stylesheet, `MarkdownRenderer.tsx` styles (soft wrap, 4ch hanging indent), header styles — 4-5 | low-medium: moves controls, no new behaviour except the in-input mode selector | yes, if the probe is limited to the DOM measures of the prompt |
| S3a JjEL deadline | `jjel/evaluator/evaluator.ts`, `jjel/evaluator/context.ts` (optional `deadline`), a new test under `jjel/__tests__/` — 3 | low: additive, bench-testable | yes (no visual probe) |
| S3b multi-selection publish | `EditorV2.tsx` (publish `selectedNodes`), `events/registry.ts` (new event) — 2 | medium: shift-click vs `selectElement` not measured | yes, probe first then code |
| S3c live result UI | `Jodie.tsx`, `ChatInput.tsx`, new `JjelLiveResult.tsx` + stylesheet, `jodieJjelContext.ts`, `jjscript/executor/commands/eval.ts` (optional `self` parameter) — 6 | medium: debounce/pin/history state, rule 19 pause (>5 files) | no: code+gates, then probe (font sizes, colours, pin `aria-pressed`) |
| S4a effects planner | new module (e.g. `jjscript/executor/effectsPlanner.ts`, next to `referenceWrite.ts`) + tests — 2 | high: re-implements executor semantics; divergence from the executor is the main risk (the executor does not import in the bench, `window is not defined`, so a parity test needs the pure parts extracted) | yes (no visual probe), possibly two if M2 commands are included |
| S4b ghost preview + canvas bar | `EditorV2.tsx` (append to `flowElements`, ignore preview ids in handlers), new preview store module (`useSyncExternalStore`), new `PreviewBar.tsx` + stylesheet, preview node/edge styles — 4-5 | medium-high: EditorV2 handlers, stableNodes guard | no: code+gates, then probe (border `#06b6d4` dashed, bar text) |
| S2 collapsed script card | `MarkdownRenderer.tsx` (`CodeBlock` → card for jjscript), new `ScriptCard.tsx` + stylesheet, `ChatMessages.tsx` — 4 | medium: depends on S4a for the counts | no: code+gates, then probe |
| S4c Apply as one step | `ScriptBlock.tsx` / `runPasses.ts` (Apply path), `redux/reducer/reducer.ts` (undo group, A2) — 3 | high: core undo layer | yes for code; probe in its own lane; gated by A2 |
| S5 script editor | `Jodie.tsx` (view switch), new `ScriptEditorView.tsx` + stylesheet, a line-diff helper (no new dependency, rule 4), reuse of planner and preview store — 4 | medium | no: code+gates, then probe |
| S6 script as project file | `joiner/classes.ts` (`DProject.scripts`, A1), `pages/components/LeftBar.tsx`, `components/abstract/DockManager.tsx` (`openScript`), `TabDataMaker.tsx`, new script tab component, `model/megamodel.ts` / `MegamodelView.tsx`, tree section — 7-8 | medium-high: core field, tree view is a hot area (§2.5), rule 19 pause | no: S6a persistence + tab, S6b tree/megamodel listing + diff arrival (after S5), each with its probe |

**Parallel lanes (disjoint file sets).** Each wave's lanes touch disjoint files; a later wave depends on the earlier
ones through shared files (named).

1. Wave 1: S1a ∥ S3a ∥ S4a. Disjoint (dashboard/Jodie window/config/rail styles; `jjel/` only; a new `jjscript/` module).
2. Wave 2: S1b ∥ S3b. Disjoint (header/composer/markdown styles; `EditorV2.tsx` + `registry.ts`).
3. Wave 3: S3c ∥ S4b. S3c needs S1a+S1b (`Jodie.tsx`, `ChatInput.tsx`); S4b needs S3b (`EditorV2.tsx`) and S4a.
4. Wave 4: S2 (needs S1b for `MarkdownRenderer.tsx`, S4a, S4b) ∥ S4c (needs A2).
5. Wave 5: S5 (needs S2, S4b; touches `Jodie.tsx` after S3c), then S6a ∥ nothing, then S6b (needs S5 for the diff).

Serialization points: `Jodie.tsx` (S1a, S3c, S5), `ChatInput.tsx` (S1b, S3c), `EditorV2.tsx` (S3b, S4b),
`MarkdownRenderer.tsx` (S1b, S2). `events/registry.ts` is shared with other fronts: append-only, expect a trivial merge.
Parallel lanes need their own worktrees cut from `jjodie-panel` and merged back into it; nothing reaches the trunk
before 3.2 is released (prompt, Lane discipline).

The prompt's default order (S1, S3, S2+S4, S5, S6) is kept; the waves only say which parts of it can overlap.

---

## Dependencies and risks

- Planner/executor divergence (S4a): the effect chips and the preview are only as true as the planner. Mitigation: the
  planner covers the R-JS-9/12/13/14 rules by name, and the S4c Apply compares the planned effects with the real
  deltas after the run (count per metaclass) and reports a mismatch.
- Opposite references (A3): a generated script that writes only one end shows a preview with one end only, and Apply
  produces the same; the preview tells the truth, the model is incomplete.
- Undo granularity (A2): without an undo group, Apply is N undo steps, against the spec.
- Overlay offset (S1a): the rail's `right: 0` cites D-UI-1 ("Flush with the viewport edge (D-UI-1)",
  `properties-with-tree-view.scss:1341`); moving it by the Jjodie width keeps it flush with the window side of the
  canvas. `npm run decisions -- D-UI-1 --no-related` returns `not found: D-UI-1` (exit 1; positive control
  `RC-21` found by the same command), while `docs/decisions.md` cites D-UI-1 29 times (`grep -c`): there is no row to
  amend, so D7 is inside the lane (A4 records the reading).
- Not measured: multi-valued attribute `=` semantics; shift-click survival against `selectElement`.

## Decisions taken (unattended)

Each marked `ratified as recommended, unattended` (RC-21, RC-25). They are not yet written as rows in
`docs/decisions.md`: that file is outside this lane's scope; the project chat writes the rows, `provisional, unattended`.

1. D1 — Dock as a grid column of `.dashboard-container` in `ProjectDashboard` (portal target), not a fixed overlay: the
   editor must shrink (S1). Preferred over a body CSS variable plus padding. `ratified as recommended, unattended`
2. D2 — Dry run = a pure, read-only effects planner over idlookup (extending the `consumerProposalModel.readProposal`
   pattern); not live-run-and-rollback, not a BEGIN/ABORT sandbox, not `liveStateChanges`. `ratified as recommended, unattended`
3. D3 — Ghost preview drawn by appending synthetic nodes/edges to `flowElements` in `EditorV2.tsx` (the R-SIM-16/29
   `hideRunEvents` pattern), non-draggable, non-selectable, no D-object. No critical-zone file. `ratified as recommended, unattended`
4. D4 — JjEL timeout: an optional `deadline` on `EvaluationContext`, checked in `JjelEvaluator.evaluate`, additive;
   evaluation stays synchronous on the main thread (no worker: the context is L-proxies over the store).
   `ratified as recommended, unattended`
5. D5 — No `add` command for multi-valued features: the prompt's condition is false for M1 references (`set =` appends,
   `+=` exists). Only the formatter change (break after `in`) remains from the language note. Multi-valued attributes
   are re-checked in S4a before the planner encodes them. `ratified as recommended, unattended`
6. D6 — Multi-selection: publish React Flow's `selectedNodes` from EditorV2 through a new registry event
   (`events/registry.ts`), since `_lastSelected` is single-element. `ratified as recommended, unattended`
7. D7 (this session) — The Properties rail's `right` becomes the Jjodie dock width through a body variable declared in
   `styles/tokens/` (default `0px`) and written by the dock; `--jj-canvas-right-inset` is left as it is.
   `ratified as recommended, unattended`
8. D8 (this session) — The dock width persists as an optional `dockWidth` on `JodieConfig` (localStorage
   `jjodie-credentials`, per browser profile, like every Jodie preference and the rail width), written on pointer-up;
   the old `position`/`size` fields stay readable and unused (rule 9). `ratified as recommended, unattended`
9. D9 (this session) — Lane plan: the waves and the a/b split of Q7. `ratified as recommended, unattended`

## Decisions awaiting Alfonso

Items of the RC-26 list, of CLAUDE.md rule 5 (core), or of the prompt's «Stop and ask».

1. A1 — S6 needs a new persisted field `DProject.scripts` (a new persisted artifact type, in core `joiner/classes.ts`).
   Alternative: reuse `DProject.transformations` with a discriminator (not recommended: LeftBar and the transformation
   tab read that array as transformations).
   Recommended: add optional `DProject.scripts`, read with `|| []` like `transformations`, no VersionFixer migration.
2. A2 — S4 "Apply as one undoable step" needs a core change: undo is per reducer delta (`reducer.ts:1200-1265`), commits
   are batched every 300 ms (`reducer.ts:1445`), a run spans many batches, no grouping facility exists. Alternative
   without core change: Apply = N undo steps (degrades the spec).
   Recommended: a minimal undo group in `reducer.ts` — mark `statehistory[user].undoable.length` at Apply start and merge the deltas pushed until Apply end through the existing `U.objectMergeInPlace(pastDelta, delta)` path (`reducer.ts:1252`).
3. A3 — (not RC-26, report only) M1 opposite references are mirrored neither by the executor nor by the core write path;
   a script must write both `State.outgoing` and `Transition.source`. Changing that is core semantics, outside this front.
   Recommended: no change here; the planner warns when a script writes one end of an opposite pair, and the generator prompt is left as it is (scope out).
4. A4 — (not RC-26, report only) the rail is "flush with the viewport edge" by D-UI-1; with a docked Jjodie it is
   flush with the Jjodie column instead. D-UI-1 has no row in `docs/decisions.md` (query above), so nothing ratified
   is amended; the reading is reported so that a veto can catch it.
   Recommended: read D-UI-1 as "flush with the window side of the canvas" and proceed with D7.

## Open questions for the reader

1. D-UI-1 is cited but has no row: should it get one, worded for the docked Jjodie (A4)?
2. Should "per user" for the dock width mean per account (server-side settings) rather than per browser profile (D8)?
3. Should the planner include M2 commands in S4a, or ship M1 first and M2 as a follow-up lane?

# Discovery: textual syntax step E, T10 and synced selection (P-2026-11-06-2337)

Prompt: `docs/prompts/claude_2026-11-06_2337_prompt_textual_e_discovery.md`. Chat C-2026-11-03-1037, front `codegen`.
Branch `textual-e-sync` in `~/jjodel-w-texte`, from `8049bf81b`; HEAD at start `e1d7dc9a1` (this prompt's commit), tree
clean. Read only: no source file changed. Decisions in scope: R-TXT-34 (step E), R-TXT-17..22, RC-51, RC-17.

Every claim below says how it is known: **read** (the code at the cited line), **measured** (a command whose output is
quoted), or **design** (a proposal of this report).

## 1. Objective and hypotheses

Step E of `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md:27`: «T10 and synced selection. Scenario 2 and
selection synced between text and canvas, both ways, checked with a real canvas gesture. If it enters the critical zone:
Layer Impact Report and Alfonso's go-ahead.»

The report answers the seven questions of the prompt: what T10 and scenario 2 are (§3), text to canvas (§4), canvas to
text (§5), loops and timing (§6), the critical zone (§7), verification (§8), and the lane plan with decisions E1..En
(§9). Risks and open questions close it (§10).

Hypotheses at the start, each checked below:

- H1. T10 is not implemented: a diagram edit reprints the whole text and drops comments. **Confirmed** (§3.2).
- H2. Both channels between canvas and the outside already exist as events, so selection sync needs no change under
  `components/editor-v2/`. **Confirmed for nodes**, not for edges (§4.2, §5.1).
- H3. Selection sync needs no model write. **Confirmed**: React Flow's `selected` is local state; the optional
  `_lastSelected` write is a transient root key that never enters the undo history (§4.3).
- H4. No piece of step E touches a file of the CLAUDE.md 3.1 table or a 3.2 trigger. **Confirmed** (§7).

## 2. Files read

Plan, decisions, earlier reports and prompts:

- `/Users/alfonso/jjodel-w-texte/docs/sessioni/sessione_2026-11-03_textual_ide_plan.md` (whole)
- `/Users/alfonso/jjodel-w-texte/docs/sessioni/sessione_2026-11-01_default-textual-notation.md` (lines 105-106)
- `/Users/alfonso/jjodel-w-texte/docs/decisions.md` (R-TXT-17 to R-TXT-22, lines 7003-7040; R-TXT-34, line 7147)
- `/Users/alfonso/jjodel-w-texte/docs/discovery/discovery_2026-11-01_textual_viewpoint.md` (§A.6 and §A.7, lines 782-829)
- `/Users/alfonso/jjodel-w-texte/docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md` (T10 lines 193, 212, 228, 275, by grep)
- `/Users/alfonso/jjodel-w-texte/docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md` (§6 and the §8 table format)
- `/Users/alfonso/jjodel-w-texte/docs/prompts/claude_2026-11-01_2210_prompt_textual_syntax_design_discovery.md` (lines 1-60)

Text tab (`frontend/src/codegen/textual/`):

- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/ui/TextualTab.tsx` (lines 706-785, 1005-1484)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/ui/textualMonaco.ts` (lines 100-245)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/ui/openTextualTab.tsx` (lines 1-110)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/languageService.ts` (lines 41-110, 450-490)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/printer.ts` (lines 20-50, exports by grep)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/parser.ts` (comments and trivia, by grep: lines 143-180, 234-241, 397-421)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/textual/textDiff.ts` (exports by grep)

Canvas selection and the store:

- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/hooks/useJjomSelection.ts` (whole)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/utils/canvasSelection.ts` (whole)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/EditorV2.tsx` (lines 1160-1191, 1590-1648, 2795-2816, 3035-3050, 3095-3130)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (lines 1040-1061; `onDoubleClick` by grep)
- `/Users/alfonso/jjodel-w-texte/frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (lines 1195-1229)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/ui/canvasSelection.ts` (whole)
- `/Users/alfonso/jjodel-w-texte/frontend/src/codegen/ui/codeOrigins.ts` (`pickOnCanvas`, lines 84-91)
- `/Users/alfonso/jjodel-w-texte/frontend/src/events/registry.ts` (lines 18-30, 100-103)
- `/Users/alfonso/jjodel-w-texte/frontend/src/redux/reducer/reducer.ts` (lines 1250-1279, 1340-1384)
- `/Users/alfonso/jjodel-w-texte/frontend/node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts` (`ICursorSelectionChangedEvent`, by grep; Monaco 0.52.2)

Probes of earlier lanes (outside every tree), for the verification pattern:

- `/Users/alfonso/.jjodel-lanes/P-2026-11-05-0148/probe.mjs`, `/Users/alfonso/.jjodel-lanes/P-2026-11-06-2041/probe.mjs`,
  `/Users/alfonso/.jjodel-lanes/P-2026-11-02-0057/visual-check.mjs`, `/Users/alfonso/.jjodel-lanes/P-2026-11-02-0235/probe.mjs` (headers and gesture lines, by grep)

## 3. T10 and scenario 2

### 3.1 What they are (read, with sources)

- **Scenario 2** is named in the design prompt P-2026-11-01-2210, question 7
  (`docs/prompts/claude_2026-11-01_2210_prompt_textual_syntax_design_discovery.md:51`): «ending with the round trip of
  scenario 2 (edit in a diagram, text updated with its comments kept)». No document numbers a scenario 1 or 3 (a
  case-insensitive grep for `scenario` over `docs/decisions.md`, the textual session files and the textual discovery
  reports returns these two lines and the plan's line 27 only; positive control through the same command: the plan's
  own `Scenario 2` line is found).
- **T10** is the last row of the plan of §A.7 (`docs/discovery/discovery_2026-11-01_textual_viewpoint.md:814`):
  «T10 | T9, T6 | scenario 2: an edit in a diagram reprints only the changed spans, comments kept».
- The rule behind both is **R-TXT-20** (`docs/decisions.md:7018-7020`): «model-to-text updates (an edit in a diagram, a
  style change) rewrite only the spans of the objects that changed». The mechanism is sketched in §A.6
  (`discovery_2026-11-01_textual_viewpoint.md:789-793`): reprint each changed object's rule, keep its leading and
  trailing comments, replace its span; a rename also changes the referrers' text, so «changed objects» includes the
  objects whose reference tokens print the renamed name.
- Its prerequisites: T9 (concrete syntax tree with comment association) landed in step A (`parser.ts:143-180`
  `commentsOf`, `parser.ts:234-241` token trivia); T6 (apply an edited text) landed. The tolerant-parser report asked
  that the printer build the same tree (`discovery_2026-11-03_textual_tolerant_parser.md:228`); the print returns a
  lossless tree carrying model ids (`printer.ts:641`, `tree: treeOf(g, out, root)`; D report §6.1).

### 3.2 What happens today on a diagram edit (read)

1. The tab reads `state.idlookup` with `useSelector` (`TextualTab.tsx:1017`) and prints the model on every change
   (`modelReading`, line 1020).
2. When the print changes, the effect at `TextualTab.tsx:1420-1431` calls `onModelPrint(sync, view.text,
   editor.getValue(), applying)` (lines 300-303): `reprint` when the editor holds the agreed text, `keep` (stale) when
   it holds a pending edit.
3. `reprint` (lines 1192-1212) sets the whole value: `syncRef.current = { text: r.view.text, model: r.view.text }; if
   (editor.getValue() !== r.view.text) editor.setValue(r.view.text);`, then puts back the identity decorations of the
   new print.

So the agreed text, which after an application is the text **as typed** (`TextualTab.tsx:1276`, `syncRef.current = {
text, model: after.view.text }`), comments and layout included, is replaced by the bare print on the next diagram edit.
Every comment and every hand layout is lost. The D report measured the same thing (§6.1: `comment` counts 0 in
`printer.ts`, `textDiff.ts` and `TextualTab.tsx`, with positive controls). H1 holds.

### 3.3 What T10 needs (design)

The material is all there: the typed text's identity decorations (`carriedSpans`, `TextualTab.tsx:1142-1151`, model id
per span), its parse with comments and owners (`commentsOf`), the old print (`sync.model`) and the new print with its
spans (`r.base.spans`, `r.view.text`). What is missing is one pure function and its wiring.

**`reprintChanged` (new pure module `textReprint.ts`)**, inputs: the typed text and its spans by model id, the old print
and its spans, the new print and its spans. Output: the new text and its spans, or `null` (fall back to today's full
reprint). The algorithm, per object, top down from the roots of the new print:

1. The object's **own text** in a print is its span with its children's spans cut out. If the own text is equal in the
   old and the new print, the typed text of the object is kept for its own parts (comments and layout included), and the
   algorithm recurses into its children, in the new print's order, keeping the typed gaps between surviving neighbours.
2. If the own text differs (an attribute, a name, a reference token, a keyword of a changed style), the object is taken
   from the new print, its children still recursed into (so an unchanged child keeps its typed text), and the comments
   the typed parse attributes to the object itself (`commentsOf` owner) are put back by owner, leading before its first
   token, trailing at the end of its line: the D5 rule (D report §6.2).
3. An id in the new print and not in the old one (created on the canvas) is inserted from the new print, after its
   previous sibling's typed span, or first in the container's body.
4. An id in the old print and not in the new one (deleted on the canvas) is cut from the typed text with its leading
   trivia up to the previous line end; the comments it owned go with it (§A.6).
5. A rename needs nothing more: every referrer whose reference token prints the new name has a different own text in
   the new print, so rule 2 takes it. A move is a delete plus a create at the object level (rules 3 and 4), with the
   moved object's typed text carried when the same id appears under a new container.

`null` when an old-print id has no carried span (decorations collapsed), when the typed text is not the agreed one
(today's `keep` branch stays as it is: no three-way merge of a diagram edit into a pending text), or when the result
does not parse to the new model's objects (print-parse equality, the D report's check, §6.2). The fallback is today's
full reprint, so the worst case is today's behaviour.

**Why not the top level only.** A splice of top-level objects alone (the D report's range format, §6.2) degenerates to a
full reprint on every model with one root that contains everything, which is the common shape (a `program`, a `system`).
The recursion of rule 1 is what makes T10 keep comments there.

**How the text is replaced.** `setValue` of the spliced text, with the view state saved and restored as `reprint` does
today, and the identity decorations set from the spans the function returns. Not `executeEdits`: an edit on the editor's
own stack could be undone by Cmd+Z after the user typed (when the app-undo key is off), giving back the pre-diagram text,
which the pause would then apply, silently reverting the diagram edit. `setValue` clears the editor's stack, as today
(decision E3).

**A style change** (R-TXT-20 names it too) changes the own text of nearly every object, so T10 gives little there; it
falls under rule 2 everywhere and keeps the comments by owner, which is still more than today.

## 4. Text to canvas

### 4.1 What the Text tab knows at the cursor (read)

- **Identity spans with model ids**: `decorationsRef` (`TextualTab.tsx:1071`) holds one Monaco decoration per printed
  object, `NeverGrowsWhenTypingAtEdges` (line 1105), mapped to the object's **model id**; `carriedSpans()` (lines
  1142-1151) reads them back as `{ id, start, end }` at the current offsets, also while an edit is pending. Spans nest
  (an object before the objects it contains, `printer.ts` `TextPrintResult.spans`).
- **The outline and `pathAt`** (`languageService.ts:476-480`) give the nodes from the top to the innermost one at an
  offset, but their `id` is the **parsed** object's id (`OutlineNode.id`, line 458, «the parsed object's id»;
  `TextSymbol.id`, line 55), not the model's. They are the wrong key for the canvas; the carried spans are the right one.
- **`referencesAt`** (`languageService.ts:93`) answers «which tokens name the object at this offset», used by find
  references and the hover links. It is not needed for selection: the object under the caret is the innermost carried
  span, and a reference token under the caret belongs to its owner's span (selecting the target instead is decision E5).
- **Cursor events**: `editor.onDidChangeCursorSelection` is already wired (`TextualTab.tsx:1456`) to
  `handlers.current.cursor` (lines 1405-1409), today only for the held reference rewrite. Monaco 0.52.2's
  `ICursorSelectionChangedEvent` carries `source: string` and `reason: CursorChangeReason` (`editor.api.d.ts:3060`,
  `:3064`, measured by grep), which tell a mouse or keyboard move from an API move (`setPosition`, `setSelection`).

### 4.2 How the app selects an object on the canvas today (read)

Two paths, one with a model-adjacent write and one without:

1. **A click on a node** (`useJjomSelection.ts:217-226`) calls `selectElement` (lines 83-124): it marks every graph
   element in `syncState` (`markCanvasUpdatedBatch`, an anti-bounce for `useJjomSync`), opens `TRANSACTION('EditorV2
   select')`, calls `deselect`/`select` on the graph's L-elements (`isSelected` on D-objects of the graph), and writes
   `_lastSelected` with `SetRootFieldAction`. This is sync-adjacent (it imports `sync/syncState`) and writes D-objects.
   **Not to be reused** from the Text tab.
2. **The `SELECT_NODE` event** (`JjodelEvents.SELECT_NODE`, `registry.ts:24`), consumed by EditorV2
   (`EditorV2.tsx:1165-1189`): when `detail.modelId` is the canvas's model, it sets React Flow's local `selected` on the
   node whose id is `detail.nodeId`, clears the edges' selection, and brings the node into view (`revealViewport`, no
   move when it is already inside). No store write at all. Three callers already use it: the tree view
   (`TreeViewContent.tsx:1214-1225`, which also writes `_lastSelected` itself), the generator tab
   (`codegen/ui/canvasSelection.ts:180`), and the validation results (`ValidationResultsModal.tsx:87`).

The generator tab's mapping from a model element to a canvas node is `pickOnCanvas` (`codegen/ui/codeOrigins.ts:84-91`):
the node whose id is the element or whose `model` is the element, else the edge that stands for it, read from the ids
the model's pane draws (`modelPane`, `codegen/ui/canvasSelection.ts:34-39`).

### 4.3 The smallest way (design)

On a cursor move whose `source` is `mouse` or `keyboard` and that is not the cursor shift of a content change (the
lane measures which `reason` a typed character gives), after a short wait (150 ms, the outline's delay, so a held arrow
key does not animate the canvas per line):

1. the innermost carried span holding the caret gives a model id (none: nothing happens, the canvas keeps its
   selection, decision E4);
2. the same id as the last one sent: nothing;
3. else `pickOnCanvas(lookup, nodeIdsIn(modelPane(modelId)), edgeIdsIn(...), id)` gives the node; no node (the canvas
   is not docked, not shown, or draws the element as an edge): nothing;
4. `window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, { detail: { nodeId, modelId } }))`.

No model write: React Flow's `selected` is component state. The optional extra is the tree view's `_lastSelected`
write, so the Properties panel follows too (decision E2). It is a store write but not a model write and not an undo
step: `_lastSelected` alone is a transient top-level key that the reducer skips before any history bookkeeping
(`reducer.ts:1259-1261`, `isOnlyTransientTopLevelChange`, keys at line 1372) and that `isRelevantChangeCheck` refuses
(line 1352). The Text tab's own `useSelector` reads `state.idlookup` only (`TextualTab.tsx:1017`), so the write does not
re-render it.

Never `DockManager.open2` from a cursor move (the generator tab's `selectOnModelCanvas` does, line 158): it would bring
the canvas forward over the Text tab when they share a panel.

## 5. Canvas to text

### 5.1 Where a canvas selection can be read (read)

- **`JjodelEvents.CANVAS_SELECTION_CHANGED`** (`registry.ts:100-103`, R-JJD-3): EditorV2 publishes React Flow's
  selected **nodes** at most once per animation frame and only when the ordered list changes (`EditorV2.tsx:1608-1630`),
  with `{ modelId, nodeIds, elementIds }` (`editor-v2/utils/canvasSelection.ts:12-16`), `elementIds` the model elements
  behind the nodes, in selection order; an empty list on unmount (lines 1631-1638). It is read only: publishing writes
  nothing. One consumer today besides the publisher (`components/Jodie/JjelLiveResult.tsx`, by grep). This is the
  pattern of CLAUDE.md §8.7 (a CustomEvent and a local listener), and it carries exactly what the tab needs.
- **`_lastSelected.modelElement`** in the store (`useJjomSelection.ts:112-116`), written by a node click, an edge click
  (the element the edge stands for, R-ESEL-2), the tree view, the classic editor and a pane click (which points it at
  the model itself, line 160). Broader, but not a canvas signal only, and the tab's own optional write (E2) would echo
  through it.
- **Edges**: `CANVAS_SELECTION_CHANGED` lists nodes only (`selectedNodes`, `EditorV2.tsx:1605`); a click on a reference
  edge or an object drawn as an edge (`irobj_*`) is not published there, only through `_lastSelected`.

Recommendation: the event, nodes only in E (decision E6). The Text tab subscribes in a `useEffect` with
`window.addEventListener(JjodelEvents.CANVAS_SELECTION_CHANGED, ...)`, filtered on `detail.modelId === modelId`.

### 5.2 From an object to its span (read)

`carriedSpans()` again: the span whose `id` is the element id. It exists for every printed object, nameless ones
included (R-TXT-45 prints them with a `: <Class>` head); an object the print leaves out (`TextPrintReport.unprinted`,
`printer.ts:55-79`) has none. While an edit is pending the carried spans still map the objects the model had at the last
agreement (decorations follow the edits), so a canvas selection highlights the right text even in a stale tab.

### 5.3 Reveal and highlight in Monaco (read, design)

- `TEXTUAL_REVEAL_COMMAND` (`textualMonaco.ts:224-233`) calls `setPosition`, `revealLineInCenterIfOutsideViewport` and
  **`focus()`**. Focus would take the keyboard from the canvas (the next Delete would go to the text), and
  `setPosition` moves the caret. So the canvas path does not reuse the command; it reuses its two calls that are safe:
  a reveal, and nothing that moves the caret or the focus.
- **Highlight**: a decorations collection of its own (`editor.createDecorationsCollection`), separate from
  `decorationsRef` and `refDecorationsRef`, so the identity logic, the cut-and-paste tracking (`TextualTab.tsx:1361-1377`)
  and `carriedSpans` never see it. One decoration per selected element with a span: `className` for the whole span
  (a background), `isWholeLine: false`, plus an `overviewRuler` mark so a selection outside the viewport shows in the
  scroll bar. The class lives in `ui/TextualTab.scss`; its colour comes from an existing token (CLAUDE.md rules 27, 28).
- **Reveal**: `editor.revealRangeInCenterIfOutsideViewport` on the span of the last element in selection order (the
  one the user just clicked); it moves the scroll only, so no cursor event fires.
- **Keep across reprints**: the selected ids are kept in a ref and the highlight is set again after every `reprint`,
  every application (`apply`, lines 1286-1293) and every T10 splice, which replace the text or the identity spans.
- **Clear**: an empty `elementIds` (pane click, unmount) clears it. A caret move by the user does not clear it (the
  canvas selection is still what it is), unless it sends a new `SELECT_NODE`, whose echo replaces it (§6.1).

## 6. Loops and timing

### 6.1 Ping-pong (design, from the reads of §4 and §5)

The round trip text → canvas → text ends after one turn, for three independent reasons:

1. **The canvas path never moves the caret** (§5.3: highlight and scroll only), so it fires no cursor event and the
   text path never starts from it.
2. **The text path listens to user moves only**: `source` `mouse` or `keyboard`; `setPosition` and `setSelection` from
   code (an outline click, the reveal command, a reprint's `restoreViewState`) are `api` or `restoreState`. If decision
   E1 ever lets the canvas move the caret, this filter is what cuts the loop.
3. **Same id, nothing**: the text path keeps the last id it sent; `CANVAS_SELECTION_CHANGED` is not re-published for an
   unchanged list (`EditorV2.tsx:1621`, `sameIdList`).

The one echo that does happen: a caret move sends `SELECT_NODE(X)`, React Flow selects X, the publisher sends `[X]`, the
tab highlights X's span, where the caret already is. Harmless; the highlight then marks the object the caret is in, which
is what a reader expects. An outline click moves the caret by `setPosition` (an `api` source): whether it should select
on the canvas too is decision E7.

### 6.2 The pause-apply cycle

- A selection is never a model write, so it never touches `applyingRef`, the pause or the agreement. Neither path reads
  or changes `syncRef`.
- **A canvas selection during an unapplied edit**: the carried spans of the objects the model had still map (§5.2); a
  span the user deleted in the pending text has collapsed (`carriedSpans` drops a decoration with no range), so nothing
  is highlighted for it.
- **A caret move during an unapplied edit**: the innermost carried span may be an object the user is retyping; the
  canvas selects the model's object, which is right. A new object typed and not yet applied has no carried span; the
  caret then sits in its container's span, which is selected instead (acceptable; E4).
- **Typing**: the cursor moves with every character. Those moves must not select (§4.3); the lane measures the `source`
  and `reason` of a typed character and filters on them, else ignores a cursor event in the same task as a content
  change.
- **During `applying`** and during the path rewrite (`rewritingRef`) the text path waits: identity spans are replaced at
  the end of `apply` (lines 1289-1293); a selection read in between can map to a stale span.

### 6.3 Objects without a span

- **Created on the canvas since the last print**: with the agreed text, the print changes and the tab reprints (with T10,
  splices), so the object gets a span at once. With a pending edit the tab is stale and keeps the text (`keep`, lines
  1426-1430): the new object has no span until the text is applied or reprinted. The canvas selection then highlights
  nothing (decision E8: silent).
- **Nameless objects** are printed with spans (R-TXT-45), so they select both ways like any other.
- **Unprinted objects** (`TextPrintReport.unprinted`, `printer.ts:55-79`) have no span; the canvas selection highlights nothing.
- **Objects the canvas draws as an edge** (`irobj_*`) or not at all: `pickOnCanvas` finds no node; `SELECT_NODE` takes
  node ids only, so nothing is selected (E6).

### 6.4 The canvas must be on screen

The Text tab opens in the `models` group (`openTextualTab.tsx:84-89`, `DockManager.open('models', tab)`), the canvas's
group, so by default it is a sibling tab in the same panel and the canvas is not on screen while the text is. No
`cached` option is set in `components/abstract/` (measured: `command grep -rln cached components/abstract/` prints
nothing; positive control through the same command: `DockManager.tsx` counts 11 lines for `open2|static open`). The
reading of rc-dock is that an inactive tab's content is then unmounted, so EditorV2's `SELECT_NODE` listener is gone and
the text path does nothing; **not measured** here, the first visual lane measures it. Synced selection is therefore
useful with the two side by side: by a drag of the tab today, or by opening the Text tab beside the canvas, as the
generator tab does (`dockBeside`, `codegen/ui/canvasSelection.ts:76-88`): decision E9.

## 7. Critical zone

### 7.1 Every file each piece would touch, against CLAUDE.md §3.1 and §3.2

| Piece | Files changed | §3.1 table | §3.2 trigger | Read or imported, unchanged |
|---|---|---|---|---|
| T10 pure splice | `codegen/textual/textReprint.ts` (new), `__tests__/textReprint.test.ts` (new) | no | no | `parser.ts` (`commentsOf`, `parseText`), `printer.ts` types |
| T10 wiring | `codegen/textual/ui/TextualTab.tsx` (the `reprint` branch, the `TextSync` record gets an optional print-spans field) | no | no | none new |
| Text to canvas | `codegen/textual/selectionSync.ts` (new, pure: innermost span, last-id guard, event filter), `ui/TextualTab.tsx`, `__tests__/selectionSync.test.ts` (new) | no | no | `codegen/ui/codeOrigins.ts` `pickOnCanvas` (which imports `editor-v2/utils/edgeSelectionTarget`), `codegen/ui/canvasSelection.ts` `modelPane`, `events/registry.ts`; EditorV2's `SELECT_NODE` listener consumed as it is |
| Optional `_lastSelected` (E2) | same `ui/TextualTab.tsx` | no | no (`SetRootFieldAction` on a transient root key, outside `sync/`; not a creator, not `SetFieldAction`) | `joiner` `SetRootFieldAction` |
| Canvas to text | `ui/TextualTab.tsx`, `ui/TextualTab.scss` | no | no | `editor-v2/utils/canvasSelection.ts` (the payload type, read only) |
| Open beside the canvas (E9) | `ui/openTextualTab.tsx` | no | no | `codegen/ui/canvasSelection.ts` `dockBeside`, `shownCanvas` |

**No piece is inside.** No file of the §3.1 table is changed (`useJjomSync.ts`, `useM1ReferenceEdges.ts`,
`syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`, `VersionFixer.tsx`, `defaultViewTemplate.ts`, `DV.tsx`,
`viewpoint/authoring/`, `viewpoint/ir/`, `problems/`), none is imported newly, and no D-layer write path of §3.2 is
reached: no `DVertex.new`, `DVoidEdge.new2/new3`, no `SetFieldAction`, no `TRANSACTION`. The one store write (E2) is
the tree view's own pattern (`TreeViewContent.tsx:1216-1220`). Explicitly **not** reused: `useJjomSelection`
`selectElement`, which imports `sync/syncState` and writes `isSelected` on D-objects inside a `TRANSACTION`
(§4.2); reusing it would enter the zone.

What would enter it, and is left out of E: selecting edges from the text (`SELECT_NODE` takes nodes only; a new event
or an edge branch in `EditorV2.tsx:1165-1189` is under `components/editor-v2/`, not in the §3.1 table but a canvas-layer
change the prompt does not name, Rule 20) and publishing edge selections (`EditorV2.tsx:1605-1630`). Decision E6.

### 7.2 Layer Impact Report, draft for the one store write (E2)

Not required (no §3.2 trigger), drafted because `_lastSelected` is read by other layers and Alfonso may want it on file.

```
LAYER IMPACT REPORT (draft, E2: the Text tab writes _lastSelected on a caret move)

Layers touched:
  [x] D-layer (Redux raw data): the root key _lastSelected only
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges): React Flow's local `selected`, through SELECT_NODE (no store write)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)

D-layer:
  - What changes: _lastSelected = { node: '', view: '', modelElement: <id> }, as the tree view writes it.
  - What does NOT change: idlookup, isSelected of any graph element, the undo history (reducer.ts:1259-1261, 1352, 1372).
  - Cross-layer interaction: the Properties panel, Jodie and the palette read _lastSelected.modelElement
    (EditorV2.tsx:1640-1647); they follow the caret.
  - Side-effect safety: useJjomSync reads idlookup and graph sub-elements, not _lastSelected; the Text tab's
    useSelector reads idlookup only (TextualTab.tsx:1017), so no re-render loop.
Canvas v2-flow:
  - What changes: the selected node and, when it is outside, the viewport (revealViewport, 300 ms).
  - What does NOT change: D-objects, vertices, edges, positions.
  - Cross-layer interaction: React Flow's selection is published back (CANVAS_SELECTION_CHANGED), §6.1.
  - Side-effect safety: Delete in the canvas acts on React Flow's selection (EditorV2.tsx:2811-2815, 3124-3126), only
    for a key pressed inside the canvas's container, as after a click.

Smoke-test scenarios potentially affected:
  - click a node, then the tree view: Properties shows the last one clicked.
  - open a model, Jodie targets it (useJjomSelection.ts:207-215 unchanged).
  - a caret move in the text, then Cmd+Z in the canvas: undoes the last model change, not the selection.
```

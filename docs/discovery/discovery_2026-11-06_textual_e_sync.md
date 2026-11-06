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

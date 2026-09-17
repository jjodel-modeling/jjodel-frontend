# Slice 5: the multi-instance preview of the Symbol Editor

Prompt-ID: P-2026-09-17-1425
Chat: C-2026-09-17-1425
Status: da eseguire
Date: 2026-09-17 14:25 (Europe/Rome)
Type: feat (authoring UI)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: YES, with a conditional stop (see Fase 1)

Every reply you send on this prompt opens with `[P-2026-09-17-1425 · session <id>]` (CLAUDE.md §6.4).
If the `Status` line above does not read `da eseguire`, stop and say so.

## Contesto

Slices 1, 2, 3, 4a, 4b and the rules table on the shape axis (`e343242bd`) are closed with a visual
ACK. Slice 5 is the last one of the 1b round. Its specification already exists and is binding:
`docs/handoff/02-coder-spec.md` § "Slice 5" and `docs/handoff/decisions-symbol-editor-1b.md` § D8.
Read both before anything else. This prompt does not restate them; it adds what they could not know,
because the shape axis became a rules table only this morning, and it takes the decisions they left
open.

Measured on this branch at 14:22, check it still holds, do not re-derive it:

- `resolveCanvasNode` in `useCanvasNodeBox.ts` already walks every `.mm-node[data-viewid]` in
  the active dock pane and returns the first. `readBox` gives `{ w, h, vertexId }` with `vertexId`
  the `data-id` of the React Flow wrapper.
- `irCompile.ts:244-263` (`compileConditional`) resolves scalar, `{when, then, else}` and
  `{rules, default}`; `compilePredicate` (`:153`) is not exported. `matchIndexOf` does not exist
  (grep is empty).
- The accessors take `(readCtx, objectId)`: `ObjectNode.tsx:900` and `IRNodeContent.tsx:202`.
  `makeReadCtx(idlookup)` is at `irReadCtxLproxy.ts:62`.
- `SymbolEditorModal.tsx`: `currentAxesPreset` returns `null` when the form is not a
  string, which is what produces «Conditional form: no static preview» (`:448-449`). The single
  box, the manual-size signature and the size caption live at `:199-251` and `:415-450`.
- `SymbolBoxPreview.tsx` is a pure replica and declares per-instance conditional axes out of scope
  in its header.
- `borderOverrides.ts` is the pure module that groups border rules into OVERRIDES rows by
  structural equality of `when`; the nav badge and the table both read it.

## Decisioni prese in chat (not in the handoff docs)

**D8-a. The caption follows the active section.** One caption line per tile, and what it says
depends on the section selected in the nav:

- Symbol, Fill, Marker, when that axis is conditional: `<instance> · <predicate>` where the predicate
  is `formatPredicate(rules[i].when)` of the winning rule, `otherwise` when no rule wins. Symbol is
  new here and reads `otherwise` because its table closes with the «Otherwise» row, like Fill.
- Border, when at least one of the three axes is conditional: the winning row is the first row in
  `borderOverrideRows` order whose `when` holds for the instance on any axis; caption
  `<instance> · <that row's whenText>`, `base` when none holds.
- Every other case (Padding, Text, and Symbol/Fill/Marker/Border when their axis is scalar): the
  size caption of today, `captionForBox(...)`, per tile. That keeps the size information where it is
  the point and the state information where the rules are.

`<instance>` is the instance's `name` feature read through the same `ReadCtx`; when it has none,
`#1`, `#2`, `#3` in DOM order. The label drawn inside the box stays the view's label, as today.

**D8-b. Conditional form with 0 instances.** The symbolic glyph draws the form's fallback instead of
refusing: `else` for `{when, then, else}`, `default` for `{rules, default}`, and `'rect'` when that
is absent (the same fallback `compileConditional` receives at `irCompile.ts:305`). The caption stays
`symbolic preview · no node on canvas`. «Conditional form: no static preview» disappears.

**D8-c. The title stays «Custom symbol».** A conditional form matches no preset through `scalarOf`,
which is the rule slice 2 set for every axis. It is correct, not a defect. Do not touch
`recognizeSymbol` or the title logic; record the reason in the log entry.

**D8-d. Manual size is per instance.** Each tile applies the precedence the single box applies today
(manual D-layer size wins when valid, the DOM box otherwise), read on its own vertex in the layout in
force. Keep the subscription primitive: one string signature joining the per-vertex results, so the
modal does not re-render on unrelated store updates.

**D8-e. Fixed strip.** The strip keeps `PREVIEW_MAX_W` and `PREVIEW_MAX_H`: no height change, no
layout shift when the instance count goes from 1 to 3 or back. Each tile gets its share of the width
through `fitScale`, reduction only.

## Fase 1: discovery, read-only

Answer these three questions and save the report to
`docs/discovery/discovery_2026-09-17_slice5_preview_instances.md` (naming
`discovery_<date>_<description>.md`, create the folder if it is missing). The hard stop is not
complete until the file is written.

1. **Vertex to object.** How do you get from the wrapper's `data-id` (the vertex) to the `objectId`
   that `ObjectNode.tsx:900` passes to the accessors? Name the exact field and show the line where
   ObjectNode obtains it. If the answer needs the L-proxy or anything with a temporary id, say so.
2. **Name of the instance.** Which read gives the `name` feature through `ReadCtx`, and what it
   returns for an object whose class has no `name`.
3. **Store access in the modal.** Whether the modal can build `makeReadCtx` from a value it already
   subscribes to, or needs a new `useSelector`, and what that selector would re-render on.

**Stop and wait for the chat** only if one of these holds: the vertex to object mapping is not a
plain field read; building the `ReadCtx` requires subscribing to the whole `idlookup`; or the modal
cannot import what it needs without pulling Monaco into a module the tests must import. Otherwise
write the report, reply with its path and a five-line summary, and continue with Fase 2 in the same
session.

## Fase 2: COSA / DOVE / COME

Files (more than 3, so this is the declared list; anything else is a stop-and-ask):

1. `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`: export
   `matchIndexOf<T>(c: Conditional<T> | undefined, ctx: ReadCtx, id: string): number | null`.
   `null` for `undefined`, scalar, and no rule holding; `0` for a `{when, then, else}` whose
   predicate holds; the index of the first holding rule for `{rules, default}`. Reuse
   `compilePredicate` inside the module, pass a throwaway `deps` set. Additive: no change to
   `CompiledConditional`, to `compileConditional` or to any render path.
2. `frontend/src/components/editor-v2/viewpoint/authoring/useCanvasNodeBox.ts`: add
   `useCanvasNodeBoxes(viewId, max)` returning the boxes in DOM order, active pane only, with the same
   ResizeObserver discipline over every resolved wrapper and the same equality guard on the array.
   `useCanvasNodeBox` keeps its signature and its behaviour; make it element 0 only if that does not
   change a single observable of its current callers, otherwise leave it as it is.
3. A new pure module in `authoring/` for the per-instance resolution and caption (D8-a, D8-b),
   importable by the node test bench: no React, no Redux, no `joiner`. Choose the name after a global
   grep proves it free (`previewInstances.ts` was free at 14:22). It takes the IR shape, the active
   section, a `ReadCtx` and the instance ids, and returns per instance the resolved
   `{ form, fill, borderColor, borderWidth, borderStyle, marker }` plus the caption text.
4. `authoring/SymbolEditorModal.tsx` and, only if the tiles need it, `SymbolEditorModal.scss`: wire
   the boxes, the `ReadCtx`, the helper and the tiles; `currentAxesPreset` gains the D8-b fallback;
   remove the «no static preview» branch. The nav, the popover, `activeSection` and the footer of 4b
   do not move.
5. `authoring/SymbolBoxPreview.tsx`: receives resolved values and a caption. It stays a replica;
   update the «Declared limit» paragraph of its header so it no longer contradicts what it now draws.
6. Tests next to the existing ones in `__tests__/`: `matchIndexOf` on `undefined`, scalar,
   `{when, then, else}` true and false, `{rules}` with the first true rule winning over a later true
   one, none true; the helper on every D8-a branch, including Border with two rows holding (the
   first wins) and an instance with no `name`.

`VertexAuthoringPanel.tsx` is not in the list and must not be touched.

## Criteri di accettazione

1. A view with 3 instances satisfying different rules shows three tiles with three different,
   correct captions, in the Symbol, Fill, Marker and Border sections.
2. The same view in Padding or Text shows three size captions, and one resized instance reads
   `manual size` on its own tile only.
3. With 0 instances the strip is identical to today, except that a conditional form now draws its
   fallback glyph (D8-b).
4. Switching between 1 and 3 instances, or between sections, moves nothing outside the strip:
   same strip height, same panel position.
5. **Mutation bench, two of them, reported with counts.** (a) Make `matchIndexOf` return the last
   holding rule instead of the first: at least one test must go red. (b) Make the Border caption
   pick the last holding row: at least one test must go red. If either stays green, stop.
6. Usual gates: typecheck at the same baseline (33 at `e343242bd`) with none in the touched files,
   vitest green with the new tests counted separately from other lanes, build clean.

## Fuori scope

The Sample mode and its segmented control (D8, own ticket); multiple markers (D9); Padding and
Sizing sections of the mockup; the Properties rail covering the modal around 1600px (its own lane);
`recognizeSymbol` and the title (D8-c); any real IR render inside the preview.

## Disciplina di corsia

Log entry in `docs/log-inbox/symbol-editor.md`, never the active log. Assert the branch before
writing. Stage only your own files, one by one, and commit with the pathspec; check
`git diff --cached --name-only` against the list above before each commit. Code and docs in separate
commits: the discovery report and the log entry travel in docs commits. Other lanes' files in the
tree (the paper, jjscript) are not yours. In the same docs commit as the log entry, replace the
`Status: da eseguire` line of this prompt with `Status: eseguito 2026-09-17 · lane symbol-editor ·
<code sha>`. Visual verification is Alfonso's: list what he has to look at, in order, and leave
`Regressions` at `unknown`.

Commit messages, one line each:
`feat(editor-v2): multi-instance preview of the Symbol Editor (slice 5)` and
`docs: discovery and log entry for slice 5`.

# Prompt: vertex labels placed outside the symbol box (left, right, top, bottom)

Prompt-ID: P-2026-09-29-1245
Chat: C-2026-09-29-1230
Lane: full (two-phase: discovery now, Phase 2 in the same session after the chat's GO; label position type, compile, renderer, label editor, tests). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-labelout`, branch `label-outside-pos` (cut by the chat from `alfonso-frontend-jjtl` at `12ac29f74`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-labelout`, branch `label-outside-pos`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29: the label of a vertex symbol today can be placed at a few positions inside or on the box (`LabelPosition` in `irTypes.ts:58` reads `'top' | 'center' | 'inside' | 'bottom'`; he describes it as top, bottom, center, left, right: reconcile the two with evidence, including any other position list in the Symbol Editor). He wants four more positions **outside the box**: left, right, above (top-outside), below (bottom-outside). Typical use: a Petri place or transition with its name beside it, a UML actor with the name under the figure, a state or event circle labelled outside.

Target behaviour (the chat's reading, to confirm or correct in Phase 1):

1. New values added to the position type, never renaming the persisted ones (R-B9): proposed `'outside-top' | 'outside-bottom' | 'outside-left' | 'outside-right'` (grep first). Old IR stays valid and renders byte-identical.
2. An outside label does not enter the box size: the content-derived size ignores it, and the symbol keeps its size when the label moves outside. The label is drawn in the node's overflow area, centered on the side it belongs to, with an 8 px gap, no clipping by `overflow: hidden` on `.ir-node-content`, readable in light and dark themes.
3. Selection, hover and the resize handles still refer to the box, not the label. Edges attach to the box. Say whether edge routing or ELK layout should reserve room for the label (recommended for Phase 2: no reservation, a ticket if needed).
4. The label editor (`LabelEntryEditor.tsx`) offers the new values in its position select, grouped as «Inside» and «Outside» if the select supports groups, otherwise in a fixed order.
5. The Symbol Editor preview and the multi-instance preview show the outside label.

## DOVE

Phase 1 (read-only):
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`LabelPosition`, `LabelSpec`, the compiled label at about line 817), `irValidate.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `irStyle.ts`, `useContentSize.ts`, `shapeRegistry.ts`, `notationCatalog.ts` (presets that could use an outside label).
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`, `VertexAuthoringPanel.tsx`, `SymbolBoxPreview.tsx`, `SymbolEditorModal.tsx`.
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (overflow, selection outline, handles).
- Report: `docs/discovery/discovery_2026-09-29_label_outside_positions.md`, opening with `## 0. Answer in brief`, at most 40 lines: current positions and where each is rendered, the proposed values, the render strategy (absolute positioning inside the node wrapper vs a sibling element), what clips today and how to lift it, export/SVG impact if any, `Recommended:` Phase 2 file list and tests.

Coordination: lane P-2026-09-29-1230 (branch `symbol-default-size`) is in Phase 2 on `irTypes.ts`, `irValidate.ts`, `useContentSize.ts`, `IRNodeContent.tsx`, `VertexAuthoringPanel.tsx`, `SymbolBoxPreview.tsx`, `SymbolEditorModal.tsx`. List which of your Phase 2 files overlap. Phase 2 of this lane will start on a base that already contains that lane's commits (the chat says which in the GO); do not edit product files in Phase 1.

## COME

1. Read `CLAUDE.md` (§6, discovery rules, critical zone, naming), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-25, RC-26, R-B9.
2. Phase 1: answer with [M]/[R] evidence and file:line. Measure with gitignored `_tmp_*` scripts under `npx tsx` if useful; no dev server. One docs commit (report). Stop with `Outcome: hard-stop`, the sha and §0.
3. Phase 2, on GO: the files the report lists, minimal diff, design system (11 px labels, 8 px grid, no layout shift). Tests: validation accepts the new values and still accepts the old ones, round-trip, compile output per position, and the size derivation ignoring an outside label. Typecheck at the baseline the protocol names, build, vitest on touched files. Grep every new identifier and CSS class first. Code commit with a conventional one-line English message, `git add <specific files>` only; then one docs commit (log entry, Status flip with shas). Report with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», end with `Outcome: hard-stop` (awaiting the visual check) or `question`/`blocked`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file without an explicit go-ahead ID, renaming existing identifiers, CSS classes or persisted values, new dependencies.

## RIFERIMENTI

- R-B9 (persisted names never renamed); Symbol Editor 1b decisions (`docs/handoff/decisions-symbol-editor-1b.md`).
- Discovery of lane P-2026-09-29-1230: `docs/discovery/discovery_2026-09-29_symbol_default_size.md` on branch `symbol-default-size` (size derivation and `ir-sized`).

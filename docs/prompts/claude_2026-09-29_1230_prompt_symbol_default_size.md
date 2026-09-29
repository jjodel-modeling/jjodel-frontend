# Prompt: Symbol Editor, Sizing section, a default width and height for new instances

Prompt-ID: P-2026-09-29-1230
Chat: C-2026-09-29-1230
Lane: full (two-phase: a short discovery, then Phase 2 in the same session after the chat's GO; view IR field, Sizing section UI, the instance creation path, tests). Tier: heavy.
Status: eseguito 2026-09-29 · lane symbol-default-size · 6955e5c6d (report), 34c0ac422 · non fuso: hard-stop, verifica visiva alla chat
Worktree: `~/jjodel-w-symsize`, branch `symbol-default-size` (cut by the chat from `alfonso-frontend-jjtl` at `12ac29f74`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-symsize`, branch `symbol-default-size`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29: in the Symbol Editor (vertex view authoring, `VertexAuthoringPanel.tsx`, section «Sizing»), the author can set a **default width and height** for the symbol. Every **new instance** of the view is born with that size.

Target behaviour (the chat's reading, to confirm or correct with evidence in Phase 1):

1. Two numeric fields «Width» and «Height» (px, integers, empty = unset) in the Sizing section, next to «Resizable» and «Propagate size». Both empty: today's behaviour, unchanged (content-derived size, shape minimums from `shapeRegistry.ts`).
2. The value persists in the view IR as one new **optional** field on `VertexViewIR` (proposed name `defaultSize?: { width: number; height: number }`, grep that no such name exists; adding an optional property is allowed, changing existing ones is not). Validation in `irValidate.ts`: positive finite numbers, clamped to the shape's `minBoxWidth`/`minBoxHeight`; one field set and the other empty is allowed (the empty axis stays derived).
3. A new instance (created on the canvas, from the palette, or by any other creation gesture) takes the default size. Existing instances are not rewritten. An instance the user resizes by hand keeps its manual size as today; «Propagate size» keeps working as today.
4. One undo step for editing the fields, same write path as `resizable` (`patch({ ...draft, ... })`).

Open point for Phase 1 (decide with a `Recommended:`): the mechanism. (a) **Creation-time seed**: at instance creation, write the default as the instance's manual layout size (`isResized` true). Faithful to «every new instance», but likely touches the creation/sync path. (b) **Derivation floor**: in the size derivation (`useContentSize.ts` and the D-layer read in `SymbolEditorModal.tsx`), an instance without a manual size uses the default instead of (or as a floor under) the content-derived box. No layout write, no critical zone, but it also changes existing non-resized instances. Measure which files each option touches; if (a) needs a critical-zone file (`useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`), say so explicitly: that is Alfonso's decision (RC-26), and the chat will park it.

## DOVE

Phase 1 (read-only):
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (Sizing section, around line 865), `SymbolEditorModal.tsx` (size caption, manual vs derived).
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`VertexViewIR`, `resizable` at about line 472), `irValidate.ts`, `irDefaults.ts`, `irCompile.ts`, `irCreationSeed.ts`, `shapeRegistry.ts` (`ShapeSizing`), `useContentSize.ts`.
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts`, the node creation sites (palette drop, canvas create), where `isResized` and the layout size are written, the `PROPAGATE_VIEW_SIZE` handler.
- Report: `docs/discovery/discovery_2026-09-29_symbol_default_size.md`, opening with `## 0. Answer in brief`, at most 40 lines: the mechanism options with files touched, critical zone yes/no, `Recommended:` option, Phase 2 file list and tests.

Phase 2 (after the chat's GO): only the files the report lists, plus their tests under `__tests__/`, `docs/claude-code-log.md` (or the log inbox the protocol prescribes) and this prompt's Status line.

## COME

1. Read `CLAUDE.md` (§6, discovery rules, critical zone, naming), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-25, RC-26, and the Symbol Editor 1b handoff in `docs/handoff/` if relevant.
2. Phase 1: answer with [M]/[R] evidence and file:line. Measure with gitignored `_tmp_*` scripts under `npx tsx` if useful; no dev server. One docs commit (report). Stop with `Outcome: hard-stop`, the sha and §0.
3. Phase 2, on GO: implement the chosen mechanism with the minimal diff. UI follows the design system (11px labels, 8px grid, existing `Input`/`jj-field` components, no layout shift in the modal: the two fields sit on one row). Tests: IR validation (unset, both set, one set, below-minimum clamp, non-numeric rejected), round-trip of the IR field, and the creation path (a new instance gets the default; an existing one is untouched; a manually resized one keeps its size). `npm run build` (or the typecheck the protocol names) and the test suite green.
4. Grep every new identifier before introducing it. Commit code with a conventional one-line message in English, `git add <specific files>` only. Then one docs commit: log entry and the Status line flipped (date, lane, shas). Report with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», and end with `Outcome: hard-stop` (awaiting the visual check) or `question`/`blocked`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file without an explicit go-ahead ID, renaming existing identifiers or CSS classes, new dependencies.

## RIFERIMENTI

- Symbol Editor 1b decisions (`docs/handoff/decisions-symbol-editor-1b.md`), slice 1c (manual size of the layout in force wins over derivation).
- `JjodelEvents.PROPAGATE_VIEW_SIZE` and its handler.
- R-B9 (persisted shape names never renamed).

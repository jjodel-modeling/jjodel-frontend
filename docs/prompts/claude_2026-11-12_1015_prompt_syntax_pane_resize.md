# Syntax pane: let the user widen the textual syntax area

Prompt-ID: P-2026-11-12-1015
Chat: C-2026-11-12-1015
Status: to run
Lane: fast (UI layout fix, no critical-zone file)
Front: codegen
Depends: none
Request: none (Alfonso's words kept locally: "the textual syntax area is too small, I must be able to widen it")

## Context

The Text tab's Syntax mode (`SyntaxForm.tsx`) opens beside the canvas (E9, `dockBeside`, `BESIDE_SHARE = 0.45`). On a 1920px-class window the panel is about 580px wide. Inside it the form lays out three columns: the element list (`flex: 0 0 240px`, `SyntaxForm.scss` `&__list`), the field editor (`flex: 1; min-width: 0`, `&__editor`) and the preview (`width: previewWidth`, `PREVIEW_DEFAULT = 420`, `PREVIEW_MIN = 240`, no maximum). 240 + 420 already exceeds the panel, so the editor column, the one the user actually works in, collapses to a sliver of about 40px (labels cut to "Lar", "Sty", "Cla"). Measured from the trunk at 2cc5202b0.

There are two separate limits:

1. **Inside the form**: the preview splitter (`onSplitter`) clamps only the preview's minimum, never the editor's, and the default ignores the available width.
2. **The panel itself**: the Text tab is in dock group `models`, so the boundary between canvas and Text panel is rc-dock's 1px divider (`components/abstract/style.scss`). The 7px grab area added for generator panels (P-2026-10-25-1355, `TemplateEditorTab.scss`, selector scoped to `.dock-style-codegen`) does not apply to it. Whether that divider drags at all for the Text panel is to be verified in step 1.

## COSA

Make the syntax area widenable and never collapsed:

- **D1 (panel boundary)**: the divider between the canvas and the Text panel gets the same 7px grab area and hover affordance as the generator panel's divider, and dragging it resizes the Text panel. If the divider is hidden or blocked for this panel (for example by a `display: none` or an `!important` zeroing rule), lift that block for the Text panel only.
- **D2 (preview clamp)**: the field editor column keeps at least `EDITOR_MIN = 260px`. The preview splitter clamps the preview between `PREVIEW_MIN` and `main width - list width - EDITOR_MIN - splitter width`; when the panel is too narrow for both minimums, the editor wins and the preview shrinks to whatever is left (it may go below `PREVIEW_MIN`, never below 0).
- **D3 (default as ratio)**: the preview's default width becomes a share of the space right of the list (`PREVIEW_DEFAULT_RATIO = 0.45`), not a fixed 420px, and is re-clamped when the panel resizes (ResizeObserver on `.syntax-form__main`).
- **D4 (persistence and keyboard)**: reuse the conventions of `codegen/ui/splitter.tsx` (ratio stored in `localStorage` with try/catch, Left/Right by 16px when focused, double-click resets to the default). Reuse its exported helpers (`clampSplit`, and the read/write pattern) if they fit without changing their signatures; store under a new key `jjodel.textual.syntaxPreviewSplit`. Do not modify `splitter.tsx`'s exported API.
- **D5 (list column)**: leave the list at 240px. Out of scope.

## DOVE

- `frontend/src/codegen/textual/ui/SyntaxForm.tsx`
- `frontend/src/codegen/textual/ui/SyntaxForm.scss`
- the stylesheet that owns the canvas/Text divider rule: preferably `frontend/src/codegen/textual/ui/TextualTab.scss`; if the selector cannot be scoped from there, `frontend/src/codegen/ui/TemplateEditorTab.scss` (extend the existing rule's selector list, do not rewrite it)
- `docs/discovery/`, `docs/claude-code-log.md`, this prompt's `Status` line

Out of scope: `canvasSelection.ts` (`BESIDE_SHARE` stays 0.45), `openTextualTab.tsx` (the dock group stays `models`), `DockManager`, rc-dock, `TextualTab.tsx` (Text and EBNF modes), every critical-zone file.

## COME

1. **Short discovery, read-only.** Open the app on `http://localhost:3001/`, open a model's Text tab beside its canvas, switch to Syntax. Measure from the DOM: the panel width, the three columns' widths, the divider's computed width, `display`, `pointer-events`, and whether a pointer drag on it changes the panel width. Find the selector that reaches this divider without touching other `models` dividers (candidates: a `:has()` on the panel holding a `.syntax-form` or the Text tab's root class, as the codegen rule does with `.dock-style-codegen`). Save the report as `docs/discovery/discovery_2026-11-12_syntax_pane_resize.md` (objective, files read with full paths, measures, chosen selector, risks, open questions). No hard stop: continue to step 2 unless the divider turns out to need a change in an out-of-scope file, in which case stop and report.
2. Implement D2, D3, D4 in `SyntaxForm.tsx` / `.scss`. Before introducing `EDITOR_MIN`, `PREVIEW_DEFAULT_RATIO`, the storage key or any new CSS class, grep the codebase to confirm the name is free.
3. Implement D1 in the stylesheet chosen in step 1.
4. `npm run build` and the existing gates (including `scripts/gates/check-codegen-lazy.ts`) must be green.
5. Visual check in the browser, values from the DOM: at the default dock split the editor column is at least 260px; dragging the preview splitter to the far left stops with the editor at 260px; dragging the canvas/Text divider to the left widens the whole Syntax pane and the preview gains the room; reload keeps the preview ratio; double-click on the preview splitter resets it; the canvas/generator divider (a generator tab beside a canvas) is unchanged; other `models` dividers stay 1px.

No subagents, no background tasks, one probe run per tool call. Commit as soon as the gates are green.

## Lane discipline

- `git add` only the files listed in DOVE; never `git add .`.
- Commit: `fix(textual): keep the syntax editor column and let the syntax pane widen (P-2026-11-12-1015)`.
- Add the `docs/claude-code-log.md` entry and flip this prompt's `Status` to `executed <date> · <lane> · <sha>` in one docs-only commit.
- Close the report with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## RIFERIMENTI

- P-2026-10-25-1355 (7px divider for generator panels), P-2026-10-24-1515 (`splitter.tsx`), P-2026-11-07-1208 (E9, Text tab beside the canvas).
- CLAUDE.md, PROTOCOL.md.

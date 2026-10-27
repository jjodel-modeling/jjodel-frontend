# Prompt: simulator, redesign of the «Board of <machine>» editor (layout only)

Prompt-ID: P-2026-10-06-0100
Chat: C-2026-10-05-1110
Lane: full (Phase 2, visual; the design is fixed below and by R-SIM-143; a short inline check, no Phase 1 hard stop). Tier: heavy. Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Status: eseguito 2026-10-06 · lane sim-board-ui · f8bf48a5f · verifica visiva passata 2026-10-06
Worktree: `~/jjodel-w-boardui`, branch `sim-board-ui`, cut by the chat from `alfonso-frontend-jjtl` at `a9cc16bc7`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt and R-SIM-143) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-06-0100 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

The board editor is `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx` (793 lines, title `Board of ${modelName}` at line 230) with `SimBoardEditor.scss`; devices render in `simBoardDevices.tsx`, the front panel skin in `simBoardFace.ts` and `simBoardLook.ts`, the model in `model/simulation/boardCodec.ts` and `boardOutputs.ts`, the `.smv` lines wherever the editor shows them today (grep `nuXmv`, `Pulse LED`, `Columns`, `Accent`). Read R-SIM-110..136 and R-SIM-143 in `docs/decisions.md`. Alfonso asked (2026-10-06) for this redesign; it is a UI and layout change only: the board data model, its codec and persistence, the bindings, the output evaluation and the nuXmv generation stay as they are (no change in `boardCodec.ts`, `boardOutputs.ts`, the export). Alfonso authorised the merge after the chat's visual check (R-SIM-141); this lane does not merge.

Time budget: the session has a hard limit. Commit in two steps if needed (layout and preview first, list and inline editing second), each one green; keep the probe lean.

Inline check first (max 15 lines in the log entry): the current structure of the editor (header, Theme/Accent/Columns block, grid, device cards, side form, footer), which existing pieces already render a device as it looks at runtime (the front panel skin of R-SIM-130..133 is the likely source of the live preview: reuse it, do not draw devices twice), how ≥8 columns opens the board as a floating window over the canvas today, and the existing Jjodel button, input, dropdown and segmented components and tokens under `frontend/src/styles/tokens` that the new layout will reuse.

## COSA

Target layout (modal about 1080 px wide, 16 px radius, Jjodel slate tokens, Bootstrap Icons only, Inter and IBM Plex Mono as already loaded, sentence case, no emoji, no new colour outside the token set):

1. **Header, one row.** Title «Board of <machine>» and a one-line subtitle «The machine's environment, saved with the model.» On the right: a Theme dropdown with a small colour swatch (the accent lives in it: Auto plus 5 swatches), a Columns dropdown («8 cols», `bi-grid-3x3`), the close button. The separate Theme/Accent/Columns block leaves the body.
2. **Body, two columns, fixed height (about 500 px), no nested scrollbars.**
   - Left (flex 1, slate-100 background): a live preview of the board in the selected theme (e.g. Graphite: slate-800 panel, 14 px radius, soft shadow). Devices look as they will at runtime: Button a raised key with its label; LED a dot, glowing in the accent (or amber) when true in σ0, label below; Text display a dark screen with a mono cyan value and a small label; 7-segment, Switch, Slider, Keypad, Clock likewise. Empty cells faint (white at 0.03 alpha), not dashed boxes. CSS grid with explicit `grid-column`/`grid-row` and spans. Click selects (2 px cyan outline, offset 2 px, the canvas accent `#22d3ee`/`#06b6d4` as tokens), drag moves onto free cells, dragging an edge resizes. Helper line under the board: «Click a device to edit it. Drag to move; drag an edge to resize.»
   - Right (400 px, hairline left border): the device list. Header row: eyebrow «DEVICES · N» and a small secondary «Add» button opening a menu grouped Inputs (Button, Switch, Slider, Keypad, Clock) and Outputs (LED, Pulse LED, 7-segment, Text display, Config display), preview-only types marked «preview». Rows grouped under INPUTS and OUTPUTS sub-headers; a search field when N > 10. Each row: type icon (inputs blue `#2563eb`, outputs cyan `#0891b2`, as tokens), the full label (never cut mid-word), a mono one-line binding summary (ellipsis allowed), a chevron. Clicking a row selects the device (synced both ways with the preview) and expands it inline: Label field, binding field («Fires event» for inputs, «Reads expression» for outputs, mono, editable), the read-only nuXmv line (mono, slate-600) with a copy icon, a size segmented control (1×1 / 2×1 / 2×2), a delete icon. One row expanded at a time.
3. **Validation.** A binding naming an unknown event or variable shows an amber warning dot on the row and on the device in the preview, and a short message in the expanded row (reuse the existing binding resolution and its defect, do not write a new resolver).
4. **Footer (slate-50, hairline top).** Left: «Accent <value> · Preview shows the initial state σ0», plus when relevant «N bindings to review» in amber and «N unsaved changes». Right: Cancel (secondary), Apply (primary). Apply is enabled when there are changes; when disabled, a tooltip says why. The note that Pulse LED and the configuration display are not exported to nuXmv becomes a tooltip on those types (in the Add menu and on their rows), not permanent footer text.
5. **Keyboard.** Arrows move the selection on the board, Delete removes the selected device, Enter expands its row, Esc closes.
6. **Columns.** Keep today's behaviour: at 8 columns or more the board opens as a floating window over the canvas.

Grep every new identifier and class before adding it; keep existing class names as they are where they survive (rule: no renames of existing identifiers).

## Visual contract (template-task-visivi)

- Now: the current modal with the Theme/Accent/Columns block in the body and generic device cards.
- Then: the layout above.
- Unchanged: the run panel, the docked board and the front panel at runtime, the four demo scenes (`/Users/alfonso/jjodel-demo-exports/`, read-only), their exports reopened byte-identical (no codec change).
- Probe on a port 3080-3099 (never 3000, 3001, 3003): open the editor on a Microwave Oven board (a TIME text display 2×1, Cooking and Door open LEDs, Open, Add, Reset, Close buttons; use an existing export if one is under `/Users/alfonso/jjodel-demo-exports/` or `docs/`, otherwise build it in the probe on DemoESM); at 8 columns: no label truncated mid-word (measure `scrollWidth <= clientWidth` on every label), no inner scrollbar in the modal (`scrollHeight <= clientHeight` on body, preview and list), selection synced both ways, one row expanded, Apply disabled with its tooltip until a change, an unknown binding showing the amber dot in both places, drag move and resize on free cells, the keyboard keys. Crops at 600 px wide (gitignored) of the whole modal (collapsed list and one row expanded), the Add menu, a warning, and the 8-column floating window.

## Tests and gates

Tests first, red at the base, for the pure parts you add (selection sync, move and resize on free cells, the footer counters, the Apply rule, the keyboard map). Mutation bench on them. Then typecheck (baseline), vitest, build, `check:docs`, `check:addonly`. Commits: `test:`, `feat(sim):` (one or two), `probe:` if any, then the closure docs commit (log entry in `docs/log-inbox/simulation.md`, no Status flip: the flip waits for the chat's visual GO).

## HARD STOP

- If any step needs `boardCodec.ts`, `boardOutputs.ts` or the nuXmv generation to change, or `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/`, `VersionFixer.tsx`, `canvasToJjom.ts`, or changes an exported interface outside `sim/`: stop before editing, `Outcome: question`.
- After the code commits and the probe: `Outcome: hard-stop (visual check due)`. Do not merge.

## NON FARE

No change to the run panel, the slider, step back, scenarios, watches or coverage. No new dependency, no new colour outside the tokens, no emoji. No `git stash`, no `git add .`/`-A`/`-u`, no push, no files outside the worktree (no `/tmp` scratch files).

## RIFERIMENTI

R-SIM-110..136, R-SIM-141, R-SIM-143; Alfonso's request of 2026-10-06; `CLAUDE.md`; `template-task-visivi`.

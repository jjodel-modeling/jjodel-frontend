# Prompt: derived viewpoint name and the standard checkbox in the viewpoint panel
Prompt-ID: P-2026-10-03-1302
Chat: C-2026-10-01-1725
Lane: fast. Tier: light (UI and one util, no critical-zone file). Model: Sonnet 5, declared deviation from RC-16 (peripheral lane, RC-32 light tier).
Status: da eseguire
Worktree: `~/jjodel-w-vpname`, branch `viewpoint-panel-naming`, cut from the trunk at `c56f4fc63` (`frontend/node_modules` symlinked, P14).

## COSA
Two fixes from Alfonso's review of the derived viewpoints (MODELS demo, merge deadline on the trunk 2026-10-07; acceptance: looks finished, worthy of a commercial product).

1. **Name of a derived viewpoint.** `frontend/src/utils/deriveViewpoint.ts:59` builds `${metamodel.name} (derived)`, so two viewpoints derived from one metamodel with different notations both read `DemoFlowB (derived)`. Wanted: `<metamodel name> / <notation label>`, for example `DemoFlowB / Activity (UML)`, `DemoPetri / Petri net (classic)`, `Turnstile / Statechart (UML)`. The label is the `label` of the notation entry in `DERIVED_NOTATIONS` (`viewpoint/derive/notations.ts`, found by the notation id the derivation was called with; Generic reads `Generic`). A hidden notation entry (a lane running in parallel adds an optional `hidden` flag to the `stateMachine` entry) must still resolve by id, so look the label up through the full list. Viewpoints already saved keep their name, no migration (R-B9). If a viewpoint of that name already exists, the project's rule for duplicate model names applies: suffix ` (1)`, ` (2)`; reuse the helper the codebase already has for unique names, and only if there is none write the smallest local one.
2. **The `Border` control of the viewpoint panel is a native checkbox.** `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` lines about 176-184 render `<label className="wp-toggle"><span ...>Border</span><input type="checkbox" .../></label>`. The design system has `frontend/src/components/ui/Checkbox` (controlled, slate fill, cyan only on the focus ring). Replace the native input with that component: `checked={coloring.border}`, `onChange={(checked) => writeColoring({ border: checked })}`, `disabled={readOnly}`, `label="Border"`. Do not touch the «Color by metaclass» switch above it, and do not restyle anything else in the panel.

## DOVE
`frontend/src/utils/deriveViewpoint.ts`, `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx`, the test file of the util if one exists (add one if not), and the SCSS of the panel only if the new control needs a spacing rule (grep first, never rename a class). Nothing under `viewpoint/derive/` or `viewpoint/ir/`: lane P-2026-10-03-1300 edits `viewpointDerivation.ts` and `notations.ts` in another worktree.

## COME
1. Read `CLAUDE.md` (sections 3, 6, 17), `docs/PROTOCOL.md` P8, P16, RC-21/23, `deriveViewpoint.ts` whole, `ViewpointProperties.tsx` whole, `ui/Checkbox/Checkbox.tsx` and its CSS module, and how other panels import from `ui/`.
2. Grep `wp-toggle` across `frontend/src` before touching any style, and grep `(derived)` in tests and strings (the earlier check found no test that depends on it; confirm).
3. Implement both, one commit each with `(P-2026-10-03-1302)` in the subject. A test for the name (notation label, Generic, duplicate suffix).
4. Gates: `npm run typecheck` (baseline 14, known set), vitest of the touched folders with counts before and after, `npm run build`, `npm run check:docs`.
5. Visual evidence per RC-23: dev server of this worktree on port 3022 left running at the stop; crop of the viewpoint panel before (trunk) and after, the Border row at its place, label to the right of the box as the component draws it. Say if the row looks misaligned with the rows above it; do not fix alignment beyond what the component does without asking.
6. Docs commit: the log entry and this prompt's Status. No merge. Stop with a short report.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, port 3001, writes in any other tree, em dashes in docs and comments, renaming an existing identifier. Discovery report: none needed; if you find you need one, `docs/discovery/discovery_2026-10-03_viewpoint_panel_naming.md`.

## RIFERIMENTI
- `deriveViewpoint.ts:59` (the name), `:29` (the import of the notation helpers).
- `ViewpointProperties.tsx:176-184` (the native checkbox), `:164` (the Base color field, for the row style).
- `ui/Checkbox/Checkbox.tsx` (props: `checked`, `onChange(checked)`, `label`, `disabled`, `id`).

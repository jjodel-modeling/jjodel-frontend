# Symbol tab opens the Symbol Editor directly; "Form" tab relabelled "Layout"

Prompt-ID: P-2026-09-29-1826
Chat: C-2026-09-29-1826
Lane: fast (UI behaviour + one label, no IR change, no critical zone)
Status: eseguito 2026-09-29 · lane symbol-tab-modal · f8bd58ae0, 90e41df6a, 25d350167, 6e606fa3d · verifica visiva passata 2026-09-29 (lane Playwright probes on :3002, checks a-e and every rail tab bar; crops in frontend/scripts/smoke/_tmp_symtab/, gitignored) · non fuso
Model: claude-opus-5-5 (default from .claude/settings.json)

## COSA

Two changes in the view authoring panel (tab row: Applies to, Structure, Symbol, Form, Source).

1. **Symbol tab opens the modal.** Today, clicking the Symbol tab shows an intermediate pane (preset thumbnail, preset name and families, a Border row with a colour swatch, and an "Open symbol editor" button). Clicking that button opens the Symbol Editor modal. The intermediate pane goes away: activating the Symbol tab opens the Symbol Editor modal directly.

2. **Relabel "Form" to "Layout".** Label only, decided by Alfonso on 2026-09-29. The tab edits the FormSpec (the form rendering of the view). "Renderer", "Visual", "Format" and "Form layout" were considered and rejected. Since "layout" is also used for canvas auto-layout and IR layout defaults, add a tooltip on the tab: "How the element appears in forms" (grep first that no tooltip already exists on the tab row).

## Behaviour contract (item 1)

- The Symbol tab behaves as a trigger, not as a content tab. Clicking it (or Enter/Space when focused) opens the modal. It never becomes the active tab: the previously active tab stays selected underneath, so closing the modal (Esc, close button, backdrop, whatever the modal already supports) returns the user exactly where they were.
- Keyboard roving focus across the tab row (arrow keys, if implemented) must NOT open the modal; only explicit activation does.
- The Symbol tab carries a small trailing Bootstrap icon signalling that it opens a dialog: `bi-box-arrow-up-right` at 11px, same colour as the tab label. No layout shift: the tab row must not reflow when the icon is present.
- If the panel is opened programmatically with Symbol as initial tab (persisted last-tab state, deep link, etc.), fall back to the first content tab instead of auto-opening the modal on mount.
- Nothing shown in the removed pane may be lost. Phase 1 checks that every control in it (in particular the Border swatch `var(--color-inode-border)`) is reachable inside the modal. If one is not, STOP and report; do not move controls on your own.

## DOVE

To be confirmed by the discovery (Phase 1). Expected area: `editor-v2/viewpoint/authoring/`, around `VertexAuthoringPanel.tsx` and the component rendering the tab row. Locate with a global search for `Open symbol editor`, `Applies to` and the `Form` tab label. Only the files that own the tab row, the intermediate Symbol pane and the modal opening are in scope.

Out of scope: the Symbol Editor modal internals, the IR (`irTypes.ts`, FormSpec), any renaming of identifiers, CSS classes, keys or persisted values (`'form'`, `'symbol'` tab ids stay as they are), the docs site. Critical-zone files are not expected; if any appears in the diff, STOP.

## COME

Two-phase, fast lane.

**Phase 1 (read-only discovery).** Save the report in `docs/discovery/` as `discovery_2026-09-29_symbol_tab_opens_modal.md`. Contents: files read (full paths), the component owning the tab row and how tab state is held, where the modal open state lives, the list of controls in the intermediate pane and where each one lives in the modal, whether the last active tab is persisted, every occurrence of the "Form" label (UI strings, tooltips, docs strings inside `frontend/`), and the exact file list for Phase 2. Hard stop at the end of Phase 1 is a session boundary: continue to Phase 2 in the same session if all controls are reachable in the modal and the file list has at most 3 files; otherwise stop with `Outcome: question`.

**Phase 2 (implementation).**
- Reuse the existing modal open function; do not create a second modal instance.
- Remove the intermediate pane rendering; do not delete the component file if other code imports it (report it as dead code instead).
- Before introducing any new identifier or CSS class, grep the codebase for collisions.
- Relabel the tab string "Form" to "Layout" wherever it is the user-facing label of this tab. Leave ids and keys unchanged.
- `npm run build` and typecheck at baseline count; vitest at baseline.

**Visual check (by the project chat, built-in browser).** Open a viewpoint, select a vertex view: (a) click Symbol, the modal opens and the tab row still shows the previous tab as active; (b) close it, the pane underneath is the previous tab; (c) arrow-key through the tabs, no modal opens; (d) the tab row width and height are identical with and without the icon (measure `getBoundingClientRect()` of the tab row); (e) "Layout" fits without truncation at 1280px and 1600px panel widths.

## Lane discipline

- `git add <specific files>` only. Conventional commits in English, one line, e.g. `feat(authoring): open Symbol Editor directly from the Symbol tab (P-2026-09-29-1826)` and `feat(authoring): relabel Form tab as Layout (P-2026-09-29-1826)`, one concern per commit, with the `Model:` trailer.
- Tag the trunk tip `pre-symbol-tab-modal-2026-09-29` before merging.
- Log entry in `docs/claude-code-log.md` via the `log-entry` skill after the visual check; flip `Status` in this file per P13.
- Last line of every report: `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- Screenshot from Alfonso (2026-09-29): Symbol tab showing Rectangle preset, Border swatch, "Open symbol editor" button.
- `docs/handoff/decisions-symbol-editor-1b.md` (Symbol Editor decisions D1..D8).
- FormSpec addendum: `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`.
- CLAUDE.md design rules: Bootstrap Icons only, 11px secondary text, no layout shifts.

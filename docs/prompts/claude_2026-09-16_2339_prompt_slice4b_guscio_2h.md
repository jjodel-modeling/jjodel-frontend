# Slice 4b: the 2h shell of the Symbol Editor

Date: 2026-09-16 23:39 (Europe/Rome)
Type: feat (authoring UI)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: NO. The spec is `docs/handoff/02-coder-spec.md`, slice 4, the SHELL half only: slice 4a
(the Goal family and the cloud) is already in, and this prompt does not restate the spec.

## Perimetro: il guscio e nient'altro

In: the `variant='popover'` of `SymbolCatalogPicker` reusing the `'column'` path unchanged, the 1b
header (subtitle «View for X», the chip with the glyph, the preset name, the modified marker and
«Change…» that opens the popover, with the catalog column gone), the body as `nav sezioni (170px) |
panel` with the count badges, the 1b footer with «Revert to preset» moved down from the header and
«Done», and `applyPresetToShape(shape, preset, {keepRules})` with D7 and its checkbox in the popover
footer, default on.

**The mockup is ahead of the plan, and the extra is NOT in this slice.** Whatever the 2h image
shows, these are out and must not be built here: the «Applies to» metaclass dropdown inside the
modal, the «View name» field, the «Notations» chips with «+ Add», «Also used for», and «Modified from
preset: Fill, Border» with «Show diff». The notations row in particular is a MODEL question, not a
layout one: today the notation belongs to the catalog presets and recognition is derived on every
render and never stored (D10). Editable chips would say the opposite, and that decision has not been
taken. If you find yourself needing any of the five to make the shell work, STOP and say so.

## Le due cose che questa fetta può rompere in silenzio

1. **The Border badge must reuse slice 2's grouping**, `borderOverrideRows`, and not derive a second
   count of distinct predicates. Two derivations of the same number drift, and this one is visible.
   Since the badge makes that function load-bearing for something on screen, cover it with tests in
   this slice: it is the todo slice 2 left open, and it is now due.
2. **Slice 2's layout decision lives in a CSS rule that this slice rebuilds.** Today the anatomy is a
   two-column grid on `.ir-tab-body--appearance` with the Border section spanning both columns, and
   Alfonso verified that on screen today. Resolve the spec's ambiguity («scrolla/mostra») explicitly
   and say which you chose in the log:
   - if the nav SHOWS ONE SECTION at a time, reusing the `activeTab` visibility mechanism through an
     `activeSection` prop as the spec asks, then the two-column grid and the Border span no longer
     apply: remove the now-dead rule instead of leaving it, and say so;
   - if all the sections stay visible and the nav only scrolls, both stay, and the Border span must
     survive the new body structure and be re-verified.
   Do not fork the panel in either case: `activeSection` is an extra prop, exactly as `activeTab` is
   today.

## Criteri di accettazione

The spec's, for this half: the popover has its snapshot test; switching preset with `keepRules` on
leaves a fill with two rules intact AND writes nothing into `default` (D2); with `keepRules` off the
result is identical to today's behaviour. Plus: the badges read `rules.length` for Fill and Marker
when Conditional and `borderOverrideRows` for Border; the modal keeps its current width (the panel
gains room because the 264px catalog column becomes a 170px nav, which is the whole point); the
usual gates, typecheck at the same baseline with none in the touched files, vitest green, build
clean.

Visual verification is Alfonso's: when it is ready, list what he has to look at in order, and leave
`Regressions` at `unknown` until he answers.

## Disciplina di corsia

Log entry in `docs/log-inbox/symbol-editor.md`, never the active log. Assert the branch before
writing, stage only your own files one by one, never `git add .`, docs and code in separate commits.

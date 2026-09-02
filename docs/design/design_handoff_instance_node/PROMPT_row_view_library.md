# Task — Level 3: the Row view library

Nine value renderers, one shared implementation each, used identically by compartment rows and (where the value can be an object) by standalone canvas nodes. This is the level-3 work named in `README.md`, "Implementation order", point 1. It lands on top of the singleton pill (`ee0eb3bdb`, `eb9645761`), which is the first member of the library and the pattern to follow: a pure resolution module plus one presentational component with a `variant: 'node' | 'row'`.

Design reference: `Instance Node Proposal.dc.html`, section **Turno 5** (`5a` the library, `5b` collections and broken references, `5c` the inspector). Re-pull the bundle first.

## 1. The nine renderers

`5a` is the specimen; every geometry and colour value is in it. Ship all nine:

| Renderer | Trigger | Row form |
|---|---|---|
| `swatch` | type `Color`, parseable colour literal, or an enum whose every literal is a CSS colour name | 10px rounded square (inset hairline so white and pale values stay visible) + label |
| `enumChip` | attribute typed on an enumeration, literals not colours | slate-100 chip, 11px/500, radius 4px |
| `refPill` | reference or association to another object | cyan pill + `bi-link-45deg`, trailing `bi-arrow-up-right` when the target is also on canvas |
| `boolean` | `EBoolean` | 9px dot — filled slate-700 for true, hollow slate-300 border for false — plus the word. Legible in greyscale; **not** a checkbox (a checkbox implies an affordance the row doesn't have) |
| `numberUnit` | numeric type | value at 500 weight + unit in mono 11px slate-400. **The unit comes from a metamodel annotation only** — never inferred from the attribute name |
| `date` | date type | absolute ISO in mono 12px + relative age in 11px slate-400. Never relative alone: a model is a document, not a feed |
| `truncatedText` | string wider than the cell | one line, ellipsis, full value in `title` |
| `progress` | numeric **with declared min and max** | 64×4px track slate-200, fill slate-600, numeric value after. Without bounds it falls back to `numberUnit` |
| `code` | metamodel annotation only | IBM Plex Mono 12px on slate-100, radius 3px |

Plus `dash` for empty slots — the confirmed default, unchanged from `README.md`: the row stays, the dash is the information.

**No renderer introduces colour that isn't information.** Colour appears only where it *is* the datum (swatch), where it marks a navigable object (the existing cyan ref pill), or where it flags a state (broken reference). Everything else is slate.

## 2. Canvas parity applies to three renderers, not nine

`swatch`, `enumChip` and `refPill` are the only ones whose value can be an object in its own right, so they get a standalone canvas form — the singleton pill, already built, with the swatch square prepended for `swatch`. The other six render in rows only.

This is deliberate and belongs in a comment: a boolean or a date cannot exist as an instance on the canvas, it is a slot value. If a future notation needs one, it arrives as a new library member, not by widening these six.

## 3. Collections — fixed threshold of 4

Show the first 4 chips, then a clickable `+k` chip (`+3` for 7 values): white surface, hairline slate-300 border, slate-500 text, 600 weight. Clicking expands in place.

**4 is a fixed count, not an available-width fit.** An elastic threshold reflows the node on zoom and on any sibling resize, which makes the same model look different at two zoom levels — unacceptable on a canvas where position is meaningful. The `[k]` suffix keeps showing the true total (`[7]`) regardless of how many chips are rendered.

## 4. Broken references

A reference whose target was deleted: `bi-exclamation-circle-fill` at 11px in error red, then the last known target name in slate-400 with `line-through` in slate-300.

Not a filled red pill. A canvas can hold ten broken references after one delete; ten filled red pills read as a system failure rather than ten instances of one recoverable condition. The red icon carries the severity, the strikethrough carries the meaning, and the row stays quiet enough that the surrounding model is still readable. Do not reuse the cyan ref-pill treatment — a broken reference is not navigable.

## 5. The inspector — the whole ladder, not the outcome

`5c`. A dedicated inspector panel for the selected property, showing **all four rungs** of the detection ladder from `README.md`, in order:

1. Metamodel declaration
2. Value parsed syntactically
3. Enum whose every literal is a recognizable colour
4. Attribute name — tie-break only

Each rung shows what it found or why it didn't fire (`no annotation on color`, `"Green" is not a colour literal`). The winning rung is emphasized — slate-100 fill, 2px slate-700 left border, filled index badge — and states the evidence, not just the verdict (`all 3 literals of Palette are CSS colour names: Red, Green, Blue`). Rungs never reached render at slate-300 with `not evaluated`.

Footer: the resolved renderer shown in its actual row form, plus a **Change renderer** action.

**Why the whole ladder:** a heuristic that shows only its answer cannot be argued with, and the user's only recourse is to override every property by hand. Showing the discarded rungs is what makes rule 4 (attribute name) safe to keep in the ladder at all.

**A user override promotes to the metamodel, not the instance** — it becomes the rule-1 declaration and the ladder stops running for that property. Already specified in `README.md`; the inspector is where it is triggered.

## Acceptance

- All nine renderers render in one compartment specimen, both themes, at 100% and at 50% zoom.
- `swatch` on `#ffffff` and on `Yellow` is still visible (the inset hairline).
- A numeric attribute with no unit annotation shows no unit — and adding an annotation named like a unit to the *attribute name* changes nothing.
- A numeric attribute with min/max renders `progress`; removing either bound falls back to `numberUnit` with no other change.
- A 7-value collection shows 4 chips, `+3`, and `[7]`; the chip count does not change between zoom levels.
- Deleting a reference target turns the row to strikethrough + red icon without changing row height or the node's size.
- The inspector shows four rungs for a `color` property on a colour enum, rung 3 winning, rung 4 marked not evaluated.
- Overriding the renderer from the inspector writes to the metamodel and the ladder stops evaluating that property.

## Out of scope

Image thumbnails (dropped from v1 scope), the `+k` expanded state's own layout beyond in-place expansion, level-2 Structure-tab fields, and edge routing to pills.

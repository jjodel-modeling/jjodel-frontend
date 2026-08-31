# Form auto-layout + themes — specification

Status: ratified 31-08-2026; amended 31-08-2026 (FL1/FL4 arbitration, see "Amendments").

**This text is normative. The boards are illustrative.** `Form Auto Layout.dc.html` lives in the design project and not in this repository, so it cannot be diffed, cited by line, or checked by a test; where it and this text disagree, THIS TEXT decides, and the board is read as an example of the rules rather than as a source of them. That is the reverse of what the first draft of this line said, and the reversal is deliberate: FL1 measured three divergences between the board's hand-tuned rows and the rows the rules below produce (`docs/discovery/discovery_2026-08-31_fl1_divergenze_righe_attese.md`), and a rule that loses to a picture is not a rule. Companion boards, on the same footing: `Manager Admin Form Bottom.dc.html` (form below the table, ego-diagram neighborhood in the expandable row), `Manager Admin Form Modal.dc.html` (modal alternative, kept).

## Principle

The metamodel decides the form layout. A field never states its own width; the user never arranges fields. Corrections promote to the metamodel as annotations — the same ladder as the value renderers (metamodel type → annotation → syntactic parse → never the attribute name alone).

## Width classes (12-column grid)

| Type | Cols | Widget |
|---|---|---|
| boolean, enum ≤ 3 literals | 3 | toggle / segmented |
| int, float | 3 | mono input |
| date | 3 | mono input + calendar icon |
| datetime | 3 | mono input + clock icon |
| duration | 3 | mono input + unit suffix |
| color | 3 | swatch + hex (same swatch as the Row view) |
| string | 6 | text input |
| @code, expression | 6 | mono input |
| @email | 6 | input + inline validation check |
| @url | 6 | input + open-link affordance |
| reference 0..1 | 6 | picker |
| any 0..* (collection, multi ref) | 6 | chip input — **grows to 12 only when the chips overflow the 6-col container** |
| text (multiline), richtext | 12 | textarea, grows vertically |

## Packing rules (closed by choice)

1. Declaration order preserved; greedy fill per row.
2. The last **scalar** of a short row stretches to fill it. Multis never stretch by row position — only by their own chip overflow (measured: chip run width > 6-col container width → promote to 12). **A read-only or derived field never stretches either** (amendment, see below): the hole it leaves is admitted.
3. Sections come from the metamodel (attributes, then references). No per-field width, ever.
4. The registry is open: a new type = one new row in the map; the packing algorithm never changes.

## Themes

A theme is a named preset over exactly three fields, attached to the **viewpoint**, overridable per class through the same cascade as every other style field (metamodel → viewpoint → per-class). No second styling system.

| Preset | labelPlacement | density | sectionStyle |
|---|---|---|---|
| Comfortable (default) | top | comfortable | flat |
| Compact | left | compact | divided |
| Sectioned | top | comfortable | card |
| Dense | left | dense | none |

New theme = new preset over the same three fields; no new fields.

## Widgets = write-side Row views

Every widget is the write-side twin of a Row view: the same value renders identically in the table cell, in the node compartment, and in the form (one renderer, two sizes, read/write). A new value renderer therefore ships as a pair.

## Related manager decisions (this session)

- Left rail: metaclass entries use the generic categorical "C" badge, never domain-specific icons — the platform is generic.
- Instance form: below the table (chosen) or centered modal (kept as alternative); never a right rail — it diminishes the form.
- Content column: `max-width: 1300px`, centered — full-bleed tables degrade on large screens.
- Neighborhood: not in the form (form = write only). It lives on the table row expansion as a **1-hop ego-diagram** — fixed layout, non-interactive (click = select), textual list where space is narrow. Anything beyond 1 hop belongs to the canvas ("open in canvas").
- Table: empty columns hidden with an indicator; kind as tinted chips; multis as cyan reference pills.

## Amendments

### A1 — a read-only field never stretches (31-08-2026, FL1 arbitration, applied in FL4)

Rule 2 originally excluded only the multis from the stretch. It now excludes the
read-only and derived fields as well, and the row keeps the hole.

The reason is the one deviation 3 of `jjform/shape.ts` already states: a read-only cell
shows a value and offers no editor. Stretching it spends the free columns of a row on the
one field the user cannot touch, which reads as an invitation to type into it — the exact
misreading the lock glyph exists to prevent — and it does so at the expense of the field
that could have used the room. The hole is information, on the same argument rule 2
already makes for the multis: it says the metamodel put a derived attribute at the end of
a short row, which is a thing to go and fix in the metamodel rather than to paper over in
the packer.

Checkable form: `packRows` stretches the last field of a short row only when that field is
neither `growsOnOverflow` nor `readOnly`; a row ending in a read-only field reports
`free > 0`.

### A2 — the legacy `FormTheme` literals are mapped, never renamed (31-08-2026, FL4)

Two types spell `FormTheme`. `viewpoint/ir/irTypes.ts` has the four persisted PANEL SKINS
(`plain | card | compact | inspector`) plus `FormSpec.labelPlacement` (`above | left`);
`jjform/themes.ts` has the three-field preset of the "Themes" section above. The saved IR
has no VersionFixer (R-B9), so the persisted literals are definitive and are not renamed,
narrowed or removed.

They are reconciled by an ADAPTER, in one place
(`viewpoint/ir/formAutoLayout.ts`): the skin chooses a preset, and `labelPlacement`, when
the author stated it, is folded on top as a more-specific cascade layer. The saved IR stays
readable by every reader that already reads it; the new preset vocabulary stays the one the
renderer spends.

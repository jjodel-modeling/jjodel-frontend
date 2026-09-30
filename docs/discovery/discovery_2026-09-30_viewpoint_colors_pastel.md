# Discovery: «Color by metaclass» v2 (pastel swatches, per-metaclass overrides, reference-aware assignment)
Prompt-ID P-2026-09-30-2022 · `docs/prompts/claude_2026-09-30_2022_prompt_viewpoint_colors_pastel.md` · Chat C-2026-09-30-1815 · session `5c0f93cd-cfc0-4bc8-9920-33017689f99e` · tree `~/jjodel-w-vppastel`, branch `viewpoint-colors-pastel`, HEAD `f8aea9a8f` · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference. [M] measured in this phase, [R] read.

## 0. Answer in brief
- **Feasible in three source files, none in the critical zone.** The resolver keeps its signature and its output shape `{fill, text, stroke, border}`, so `ObjectNode.tsx` and `IRNodeContent.tsx` (§3.1) are not touched. Everything new is pure and lives in `metaclassPalette.ts` (§2) [R].
- **The graph is in the D shape the resolver already reads.**
  - The resolver runs inside `useSelector` with the whole state (`ObjectNode.tsx:142`).
  - References: `DClass.references` gives the reference ids, and each `DReference.type` gives the target class id.
  - Generalizations: `DClass.extends` gives the superclass ids.
  - Containment is a reference with `composition: true`, so it is already in `references` (§2.1).
- **Metaclass ids are stable across save and reload**, because LOAD takes the saved state as it is. They are not stable across a re-import of an `.ecore`, which creates new ids; an override then points at nothing and is ignored, as decided (§2.2) [R].
- **The `overrides` map is safe through the setter.** Its keys look like pointers (`Pointer_…`), but they are never inspected:
  - `__sanitizeValue` walks only one level and replaces only proxies and D objects.
  - `isPointer` of an object value is `false` (§2.3) [R].
- **The dropdown to reuse is `JjSelect`**, the shared react-select wrapper of the Property Panel. `formatOptionLabel` draws the swatch and the name; groups (one per metamodel) and a fixed width come from its `styles` prop. It adds no dependency (`react-select` is already in `package.json:61`) (§2.4) [R].
- **Palette tuned [M]:** 12 hexes, hue 30·k ± 0.8°. Their recomputed S is 55.1..69.2 and L 82.2..87.5. The minimum pairwise ΔE76 is 12.56. Black text wins on every swatch (§2.5).

**Phase 2 file list** (3 source files, 1 test, 1 doc comment; §4 has sizes):
- `metaclassPalette.ts`
- `__tests__/metaclassPalette.test.ts`
- `ViewpointProperties.tsx`
- `properties.scss`
- `view.tsx` (a doc-comment line on the field; the declaration itself is the `MetaclassColoring` interface, extended with an optional `overrides?`).

**Decisions taken (unattended, R-VP rows provisional)**
1. The greedy tie-break «swatch order» is counted from the seed, the + direction first (seed, +30°, −30°, +60°, …). This is the analogous order of R-VP-29, so a class with no assigned neighbour takes the next swatch in that order.
2. Past 12 classes, when no swatch is free, every swatch is a candidate. The key is the same, with «least used» inserted before the seed distance.
3. Only DECLARED references and `extends` make an edge. An inherited reference does not; a self-reference and a link to another metamodel's class are ignored.
4. The dropdown lists the classes of every metamodel of the open project (`state.m2models`), grouped by metamodel when there is more than one. The colours shown are those of the EDITED viewpoint, not the active one.
5. The resolver accepts any valid hex as an override (only the 12 are offered). An invalid value is ignored, like a missing id.
6. The border is `hsl(h, s, 55%)` of the fill, which replaces «L − 25». `metaclassPalette(base, count)` becomes the pastel analogous order (the assignment with no edges), which replaces the ±60° rule of R-VP-29. Both functions keep their names.

**Decisions awaiting Alfonso** (RC-26 list): none. The layout of the dropdown beside the swatches is a perceptual item for the visual GO (§3).

**Questions**: none without a single recommendation. The cascade to Phase 2 proceeds.

## 1. Hypotheses under test
| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | References, containments and generalizations can be read from the plain state the resolver receives | holds [R] | §2.1 |
| H2 | Metaclass ids survive save and reload | holds [R], except re-import | §2.2 |
| H3 | A nested map keyed by class ids passes the default setter unchanged, with no pointer bookkeeping | holds [R] | §2.3 |
| H4 | The panel has a dropdown to reuse that can draw a swatch per option | holds [R] | §2.4 |
| H5 | 12 swatches, hue every 30°, S 55..70, L 82..88 can be at least ΔE76 10 apart | holds [M] | §2.5 |
| H6 | The change needs a critical-zone file | falsified [R] | The resolver's output shape is unchanged: `ObjectNode.tsx:1181`, `:1239` and `IRNodeContent.tsx:493` consume `metaclassColoringVars(o)` and `o.text` only |

## 2. Findings
### 2.1 The metaclass graph from the resolver's state [R]
- `ObjectNode.tsx:142` `const metaclassColor = useSelector((state: any) => resolveMetaclassColoring(state, data.instanceOfClassId), shallowEqual);`
- `model/logicWrapper/LModelElement.tsx`:
  - `:2733` `references: Pointer<DReference, 0, 'N', LReference> = [];`
  - `:2735` `referencedBy: Pointer<DReference, 0, 'N', LReference> = [];`
  - `:2736` `extends: Pointer<DClass, 0, 'N', LClass> = [];`
  - `:3979` (DReference) `type!: Pointer<DClass, 1, 1, LClass>;`
  - `:4002` `composition: boolean = false;`
- The undirected graph needs forward links only. For a class A: for every `r` in `A.references`, the edge A–`idlookup[r].type`; for every `B` in `A.extends`, the edge A–B.
- The class list and its order are those of `metaclassOrder` (R-VP-29): `DModel.packages`, then per package its `classes` and `subpackages`, depth first.
- Risk, `frontend/src/model/CLAUDE.md` §3.6: forward-link collections can lag right after a parse. The selector re-runs on every dispatch, so the final state is right, and the previous lane already reads `packages` and `classes` this way. A backward-link scan (every `DReference` by `father`) would cost O(|idlookup|) per node per dispatch, and is not used.

### 2.2 Stable ids [R]
- `redux/reducer/reducer.ts:519-520` `case LoadAction.type: newState = action.value;`, which keeps the saved ids. The save path is generic (discovery 2026-09-30 metaclass colors, §3.3).
- Ids are made at creation by `DPointerTargetable.makeID` (`joiner/classes.ts:596`) and never on load.
- Undoing a class deletion brings the same id back, so its override applies again. Re-importing a metamodel, or duplicating one, gives new ids, and the old overrides are ignored.

### 2.3 The nested `overrides` map through the default setter [R]
- `joiner/classes.ts:2457` `let v: any = this.__sanitizeValue(v0, false, false);`
- For a POJO, `:2416-2420` replaces only values that are proxies or D objects (`val[k].__isProxy || val[k].id && val[k].className`), one level down. The nested map's hex values are strings and are kept.
- `:2469` `} else isPointer = Pointers.isPointer(v);` → `:1809` `return typeof val === "string" ? val.indexOf("Pointer") === 0 : false;`. For an object this is `false`, so no `PointedBy` entries are made, and the keys are never read as pointers.
- Consequence: deleting a class does not clean its override. That is the decided behaviour: the override is ignored.

### 2.4 The dropdown [R]
- `components/ui/JjSelect/JjSelect.tsx:12` «JjSelect — the single shared react-select wrapper for the Property Panel.» It is used by `Info.tsx:32` (`import { Button, EmptyState, Toggle, NumberInput, JjSelect, InfoTooltip } from '../ui';`).
- `:170-181`: it renders to `document.body` (`menuPortalTarget`, `menuPosition="fixed"`). The caller's `styles` are merged over its own by key.
- `properties.scss:86` `&__select { @extend .wp-field__input;` is the native-select class of this sheet (`DataManagerViewpointPanel.tsx:404`). A native `<select>` cannot draw a swatch inside its options, so it is not used.
- The project's metamodels: `redux/store.tsx:111` `m2models: Pointer<DModel, 0, 'N'> = [];`, read the same way by the tree view (`TreeViewContent.tsx` `const metamodelPointers = state.m2models || [];`).

### 2.5 The swatches [M]
- Measured by gitignored `frontend/scripts/smoke/_tmp_vppastel_pal2.mjs`.
- Method: a coordinate search over S 55..70 and L 82..88 in 0.5 steps. A candidate is kept only if its ROUNDED hex re-reads inside the ranges, with the hue within 1° of 30·k.
- Uniform settings for comparison: S 60 / L 85 gives a minimum of 8.02, and S 70 / L 82 gives 10.89. Both minima fall on the 240°/270° pair.

| hue | hex | S | L |
|---|---|---|---|
| 0 | `#f3cbcb` | 62.5 | 87.5 |
| 30 | `#f3dfcb` | 62.5 | 87.5 |
| 60 | `#ededc0` | 55.6 | 84.1 |
| 90 | `#d5f2b8` | 69.0 | 83.5 |
| 120 | `#b2f1b2` | 69.2 | 82.2 |
| 150 | `#baebd2` | 55.1 | 82.5 |
| 180 | `#cbf3f3` | 62.5 | 87.5 |
| 210 | `#cbdef0` | 55.2 | 86.9 |
| 240 | `#b2b2f1` | 69.2 | 82.2 |
| 270 | `#d6c0ed` | 55.6 | 84.1 |
| 300 | `#eeb5ee` | 62.6 | 82.2 |
| 330 | `#ebbad2` | 55.1 | 82.5 |

- The minimum pairwise ΔE76 is 12.56, on the pair 90/120.
- At L ≥ 82 the WCAG rule picks black: the first tuning run gave 11.27:1 at worst against black and 1.86:1 at best against white. Phase 2 tests this on the final hexes.
- With the default seed `#0ea5e9` (hue ≈ 199°), the nearest swatch is 210°.

## 3. The panel, planned
- Placement: under Border, while the toggle is on.
  - One field «Metaclass color»: a `JjSelect` of fixed width, with a 10 px swatch plus the name and an ellipsis.
  - Beside it, the 12 swatches as 16 px buttons in a row of fixed height; the current one carries a 2 px `#334155` outline, which takes no layout space.
  - Under them, «Reset» and «Reset all», 11 px text buttons, disabled (not hidden) when there is nothing to reset.
- Layout: if the measured panel width cannot hold the dropdown and 12 swatches on one line, the swatch row sits directly under the dropdown. The width is fixed, so nothing moves on selection. The probe measures it.
- Writes go through the L proxy's default setter as today, so each one is an undo step.

## 4. Phase 2 list and sizes
| File | Change | Size |
|---|---|---|
| `frontend/src/view/viewPoint/metaclassPalette.ts` | `PASTEL_SWATCHES`, seed swatch, graph, `assignMetaclassColors`, overrides in `readMetaclassColoring`, the resolver on the assignment, the panel's table, the border at L 55 | ~+170 / −60 |
| `frontend/src/view/viewPoint/__tests__/metaclassPalette.test.ts` | the palette block rewritten, plus graph, greedy, overrides and round trip | ~+200 / −90 |
| `components/editors/viewpoint/properties/ViewpointProperties.tsx` | dropdown, swatch row, Reset links | ~+90 |
| `components/editors/viewpoint/properties/properties.scss` | swatch row, swatch, option, reset links | ~+60 |
| `frontend/src/view/viewElement/view.tsx` | doc comment of `metaclassColoring?` (the type is imported) | +2 |

Edges would be cheap to colour by source or target (ticket, §6 of the closing report): the fill is resolved per class id, and an edge knows both ends.

## 5. Controls on the absences claimed
- `command grep -rn` over `frontend/src frontend/scripts` returns 0 for each new name: `PASTEL_SWATCHES`, `assignMetaclassColors`, `metaclassGraph`, `seedSwatch`, `metaclassColorTable`, `withMetaclassOverride`, `modelOfClass`, `hueDistance`, `wp-metaclass`, `wp-swatch`, `wp-field__swatch`, `wp-link`, `wp-field__reset`. Positive control: `wp-switch` returns 2 through the same loop [M].
- The critical-zone claim is H6: the three consumers of the resolver were found with `command grep -rn -E 'resolveMetaclassColoring|metaclassColoringVars|…' frontend/src '--include=*.ts' '--include=*.tsx'`, exit 0 [M].

## 6. Files read (under `/Users/alfonso/jjodel-w-vppastel/`)
- **Governance.**
  - `CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/model/CLAUDE.md` §3.6.
  - `docs/PROTOCOL.md`: P1-P9 and P16.
  - `docs/decisions.md`: RC-20..34 and R-VP-27..31.
  - `docs/discovery/discovery_2026-09-30_viewpoint_metaclass_colors.md`, whole.
- **Read whole:** `view/viewPoint/metaclassPalette.ts`, `ViewpointProperties.tsx`, `properties.scss`, `ui/JjSelect/JjSelect.tsx`.
- **Read in windows:**
  - `LModelElement.tsx:2705-2745, 3967-4010, 4989-5020`
  - `joiner/classes.ts:2404-2420, 2455-2510, 3040-3090, 3400-3420`
  - `reducer.ts:83-113, 290-345, 515-540`
  - `view.tsx:276-292`
  - `Info.tsx:1595-1615`
  - `TreeViewContent.tsx:3030-3075`
  - `MetaclassesStep.tsx:10-40`
  - `__tests__/metaclassPalette.test.ts:1-60` and its test titles
  - `__tests__/viewpointThemeHint.test.ts:1-60`
  - `~/jjodel-w-vpcolor/frontend/scripts/smoke/_tmp_vpcolor_common.ts:1-150` (probe kit, read only)

# Task — Singleton instance nodes render as pills

Extend the level-3 Row-view work already in progress. This is an **additive** change: no existing node configuration changes behavior, and the rectangular instance node specified in `README.md` stays exactly as it is for every non-singleton instance.

Design reference: `Instance Node Proposal.dc.html`, section **Turno 4** (options `4a`–`4d`), at the top of the file above Turno 3. Read it before writing code. It is a design prototype, not production code — recreate the treatment inside the Jjodel frontend using the existing SCSS token system under `frontend/src/styles/tokens/`, not by copying inline styles.

## Problem

Singleton instances (`Red`, `Green`, `Blue`, `Config` in the Shape model) are **not differentiated at all today** — they render as ordinary rectangles, `Red : Red`, with an empty compartment. Two defects:

1. **`Red : Red` is redundant.** For a singleton, name and type coincide (`joiner/classes.ts:942` — `addObject({name: d.name})` gives the instance the class's name at birth), so the type half of the header carries no information, and the empty compartment below it carries none either.
2. **There is no signal that the instance is a singleton**, which is real modeling information: the instance is the only member of its class.

**There is no existing cyan singleton treatment to remove.** An earlier draft of this prompt claimed one; that was wrong — the cyan in the source screenshot was selection state. The correct reading of that observation is the *constraint* below, not a defect to fix.

**Constraint that follows:** cyan is reserved for selection and always wins (`README.md`, "Selected state"). Do not differentiate singletons with a fill of any hue. The differentiation must live in shape and label.

## What to build

### 1. Shape resolution — on content, not on the flag

```
isSingleton === true && valuedSlotCount === 0   → pill
otherwise                                       → rectangle (existing node)
```

The flag is `DClass.isSingleton` (`LModelElement.tsx:2659`) — it is on the **metaclass**, not the view. `valuedSlotCount = slotRows.filter(r => !r.isEmpty).length`; it is **not** the `[k]` suffix count (`[k]` is per-slot, the values inside one multi-valued slot) nor the footer's count (that is the complement, `emptyRowCount`). A singleton *with* structure (a `Config` holding `debug = true`, `level = 2`) must stay a rectangle — a pill cannot host a compartment. In that case add a **cardinality badge**: an 18×18 circle before the name, `border: 1px solid <border>`, IBM Plex Mono 10px/600, slate-500, glyph `1`. See `4d`.

### 2. Pill geometry

- `padding: 7px 16px; border-radius: 999px`
- Surface `--color-surface` (white), `border: 1px solid <border-default>` (slate-300), shadow `0 1px 2px rgba(0,0,0,0.04)`
- `white-space: nowrap`, no compartment, no accent bar, **no colored fill in any state**
- Selected: `border-color: #0891b2` + `box-shadow: 0 0 0 3px rgba(6,182,212,0.18), 0 1px 2px rgba(0,0,0,0.04)` — identical to the rectangle's selected treatment, so selection reads the same on both shapes. See `4b`.
- Hover: `--color-bg-hover` fill, no lift (canvas objects don't translate).

### 3. Label resolution

```
firstAbstractDirectSuperclass(metaclass)
  ? `${superclass.name} : ${instance.name}`
  : instance.name
```

- Read direct superclasses from `DClass.extends` (`:2648`) — **not** `superclasses` or `extendsChain`, which are transitive and would surface an ancestor several levels up. Abstractness is the D-layer field `abstract`, **not** `isAbstract` (that name exists only as a transformer rename and reads `undefined` off `idlookup`).
- Only **direct** superclasses are considered, and only **abstract** ones. A concrete superclass does not qualify — it would name a set the instance could have been an ordinary member of, which is not the information we want to surface.
- With **more than one** abstract direct superclass, take the **first declared** one. The full list stays available in the inspector. This is a deliberate, accepted simplification — do not sort, disambiguate, or concatenate.
- Typography: superclass at `font-weight: 500; color: <text-secondary>` (slate-500), separator `:` at slate-300, instance name at `font-weight: 600; color: <text-primary>` with `text-decoration: underline; text-underline-offset: 3px`.
- **The underline goes on the instance name only, never on the whole run.** `Color : Red` must read as "a Red, which is a Color" — not as an instance literally named `Color : Red`. This is the same UML object-diagram rule already applied to the rectangle header; only its span changes.

### 4. Row/canvas parity

The same component renders the singleton as a value inside a compartment row and as a standalone node on canvas — this is the level-3 parity requirement from `README.md` ("a value must render identically whether it appears as a row inside a compartment or as a standalone Row-view node"). Exactly two differences are permitted between the two positions:

- **Scale** — inline rows use `font-size: 12px; padding: 2px 10px`; canvas nodes use `13px / 7px 16px`.
- **Underline** — present on the canvas node (it is an instance specification), absent on the inline row (it is a value in a slot).

Everything else — shape, border, surface, label resolution — comes from one shared implementation. See `4c`. If you find yourself writing the label logic twice, the component boundary is in the wrong place.

## Acceptance

- A `Red` singleton with abstract superclass `Color` renders as a white pill reading `Color : Red`, underline on `Red` only.
- A `Config` singleton with no abstract superclass and no valued slots renders as a white pill reading `Config`.
- The same `Config` with two valued slots renders as a rectangle with a `1` badge and a two-row compartment.
- Selecting any of the three produces the cyan border + ring and nothing else; deselecting restores the white surface with no residual tint.
- The `Blue` pill inside `Shape_0`'s `color` row and the `Blue` pill on canvas are visibly the same object at two scales.
- No cyan, violet, amber, or any categorical fill appears on a singleton in any state.
- `Shape_0`'s `cfg` row pointing at a **rectangular** `Config` (one with valued slots) still shows today's cyan reference pill, unchanged. Pill parity applies to the singleton's own rendering, not to reference rows that target it.
- Both themes: the pill surface stays opaque in dark mode, at rest and on hover.

## Decisions already taken — do not reopen

- **Target is the native `ObjectNode` branch.** `classic-object-view.scss` and `defaultViewTemplate.ts` are **out of scope**: no classic-view change, no `VersionFixer` migration, no critical-zone work. Un-migrated projects keep their current rendering.
- **Hover token approved as you proposed:** add an opaque `--color-inode-pill-hover` to both `_colors-light.scss` and `_colors-dark.scss`. Do not introduce `color-mix()`.
- **Perimeter approved as listed — all 7 files**, including reading the target's metaclass live from Redux via a serialized signature rather than widening `refTargets`. No Layer Impact Report needed.
- **Commit hygiene:** land the uncommitted instance-node slice as its own commit *before* starting this one, and leave `StatusBar.*` / `featureSignature.ts` out of both. The pill must be reviewable as a diff of its own.
- **A `Config` pill showing no type at all is intended.** For a singleton with no abstract superclass, the name is the complete label.
- **Parity is native-branch only.** IR reference widgets are unaffected.

## Out of scope

Edge routing to and from pills (anchor geometry on a fully-rounded shape is a separate problem), the inspector panel that lists the remaining abstract superclasses, and level-2 Structure-tab fields.

# Discovery 2026-10-02 — notation glyphs out of «Color by metaclass»

Prompt-ID: P-2026-10-02-2045 (`docs/prompts/claude_2026-10-02_2045_prompt_vp_glyph_nocolor.md`), chat C-2026-10-01-2220.
Session: `d884e107-39b8-4463-afde-a1270ef0e32e`. Tree `~/jjodel-w-vpglyph`, branch `vp-glyph-nocolor`, HEAD `c14dc0c67`
(docs only on top of `1ff8ab314`: the code read and measured is the trunk's at `1ff8ab314`). Executor: Opus 5.5 (`claude-opus-5-5`).
This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files.

## 0. Answer in brief

- **Glyph = a DERIVED vertex view (`ir.generated` set) drawn as a bar, as a circle filled in an ink, or as a circle
  with the `dot` / `dot-large` marker.** Nothing in the IR names a glyph: the derivation writes plain shape fields
  (`viewpointDerivation.ts:839,842,848,962`, catalogue presets `notationCatalog.ts:94,95,100,108`) [R]. Measured on
  the four demos × nine notations (§3): the rule picks every fork/join bar, initial disc and bull's-eye, both Petri
  transition bars, and no other node; the two Petri places (circle, white, no or conditional marker) stay out [M].
- **Predicate:** `isNotationGlyph(ir)` in `frontend/src/view/viewPoint/metaclassPalette.ts` (pure, no imports, the
  bench executes it), and `notationGlyphClasses(state, viewpointId): string[]` beside it for the panel. Both names
  are free (§1.3) [M].
- **One render point consults it:** `ObjectNode.tsx:960`, the only host that passes `colorOverride` to
  `IRNodeContent`: a glyph view gets none, so it paints exactly as with coloring off. The native paths (`:1185`,
  `:1243`) never draw a derived view and stay as they are. `IRNodeContent.tsx` changes only for the entry mark (Q5).
- **Palette untouched:** `assignMetaclassColors`, `resolveMetaclassColoring`, `metaclassColorTable` and every
  exported interface keep their code; glyph classes keep their slot, so no other class moves (§4).
- **Panel:** the edited viewpoint's glyph classes show an empty swatch in the dropdown, no swatch grid, and the
  hint «Not coloured: notation glyph.» under the row; «Reset» still removes a stale override.
- **DemoPEST on Statechart (UML) has no glyph node** [M]: its Initial is a named box with an entry dot drawn outside
  it (R-VP-22), the Terminal a double-bordered box. The only glyph there is the entry mark (Q5).
- **No persisted data, scene file or migration** is needed: the cascade to Phase 2 proceeds.
- Decision row: **R-VP-50**, not R-VP-40: `elk-layout-disc` (not merged) already holds R-VP-40..49 (§6) [M].

**Decisions awaiting Alfonso**: none beyond his visual GO (it changes what the demos show).

**Questions** (each adopted unattended under RC-21 as recommended; Alfonso can veto at the visual GO):
1. Scope: only derived views (`ir.generated`); a hand-authored view drawing the same shape keeps today's colouring.
   Recommended: derived only, as the prompt scopes the rule to the derived notations.
2. Petri net and Petri net (classic) transition bars are glyphs (solid ink, `#334155`).
   Recommended: yes, same rule as fork/join.
3. Palette slot of a glyph class. Recommended: kept; the class is simply not painted, no other class moves.
4. An override on a glyph class. Recommended: ignored for painting while the class is a glyph, kept in the data and
   in the assignment as today (no migration, nothing else moves).
5. The entry mark of a derived Initial (Statechart (UML)) sits on the canvas and is painted in the text colour when
   coloured: `#000000` in light, black on the dark canvas in dark. Recommended: it keeps the notation ink
   (`borderColor`), as an outside label keeps its ink (R-VP-30); the box stays coloured.
6. The named bull's-eye (Terminal under Petri net and Petri net (classic), preset `uml-final-state`, name at the
   bottom) matches the `dot` rule. Recommended: included, it is that notation's final bull's-eye.
7. Decision id. Recommended: R-VP-50, the next number free on every branch.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The IR marks a glyph explicitly (a key, a role name) | **falsified** — plain shape fields only (§2) |
| H2 | A shape-level rule separates glyphs from every other derived vertex | **holds** on 4 demos × 9 notations (§3) [M] |
| H3 | Only the IR render path can draw a glyph | **holds** — derived views render only through `IRNodeContent`, hosted only by `ObjectNode.tsx:960` |
| H4 | Excluding glyphs needs no palette change | **holds** — the exclusion is at the render point (§4) |
| H5 | Statechart (UML) has an initial-dot node | **falsified** — a box with an entry mark (§3) |
| H6 | The fix needs persisted data, a scene file or a migration | **falsified** — render-time only |

### 1.1 Files read (full paths under `frontend/src/`)

`view/viewPoint/metaclassPalette.ts` (whole), `view/viewPoint/__tests__/metaclassPalette.test.ts` (header),
`components/editor-v2/nodes/ObjectNode.tsx` (120-175, 925-975, 1170-1260),
`components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (180-300, 420-590),
`components/editors/viewpoint/properties/ViewpointProperties.tsx` (whole), `.../properties/properties.scss` (95-112, 168-270),
`components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (20-160, 330-420, 600-975),
`components/editor-v2/viewpoint/derive/notations.ts` (60-130, 315-325), `components/editor-v2/viewpoint/ir/notationCatalog.ts` (59, 94-108),
`components/editor-v2/viewpoint/ir/irTypes.ts` (495-530, 568-580, 893-899), `components/editor-v2/viewpoint/ir/irResolveCore.ts` (115-160),
`view/viewElement/view.tsx` (270-300, 326-341, 407-414), `utils/deriveViewpoint.ts` (40-90),
`components/editor-v2/nodes/__tests__/irSelectionRing.test.ts` (whole, the bench to reuse),
`components/editor-v2/viewpoint/derive/__tests__/activityUml.test.ts` (1-200, the four demo fixtures).
Docs: `CLAUDE.md` §3.1, §5, §6; `components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` P16; `docs/decisions.md` RC-20..34,
R-VP-24..39; `docs/discovery/discovery_2026-09-30_viewpoint_colors_pastel.md` §0.

### 1.2 Method

A gitignored script (`frontend/scripts/smoke/_tmp_vpglyph_enum.ts`, `npx tsx`) builds the four demo metamodels of
`activityUml.test.ts`, applies each demo's binding as the Simulation roles dialog does, and prints every derived
vertex document of `derivedDocuments` for each of the nine notations with `form`, `fill`, `border.color`, `marker`,
the labels and `entry` [M, on `c14dc0c67`].

### 1.3 Names free

`command grep -rn "isNotationGlyph\|NotationGlyph\|notationGlyph" src scripts --include='*.ts' --include='*.tsx' --include='*.mjs'`:
exit 1, no line. Positive control, same command for `resolveMetaclassColoring`: exit 0, 4 files.

## 2. How a node is drawn as a glyph today

No IR key says «glyph»; the derivation sets shape fields [R]:

- `viewpointDerivation.ts:839` `shape = { form: 'circle', fill: NAME_INK, border: ink(), labels: [] };` (Activity initial)
- `viewpointDerivation.ts:842` `shape = { form: 'circle', fill: SURFACE, border: ink(), marker: 'dot-large', labels: [] };` (Activity final)
- `viewpointDerivation.ts:848` `shape = { form: 'bar', fill: NAME_INK, border: ink(), labels: [] };` (fork, join)
- `viewpointDerivation.ts:962` `form: 'bar', fill: ink, border: { color: ink, width: 1, style: 'solid' },` (classic Petri transition, `ink` the catalogue fill)
- `viewpointDerivation.ts:368-369` `const bullseye = flow && (role === 'activityFinal' || ...)` / `const bar = flow && (role === 'fork' || role === 'join');`, `:381` `if (bar) shapeSpec.form = 'bar';`
- Presets: `notationCatalog.ts:59` `const INK = '#334155';`; `:94` `uml-initial-state` `values: { form: 'circle', fill: INK }`;
  `:95` `uml-final-state` `values: { form: 'circle', marker: 'dot' }`; `:100` `uml-fork-join` and `:108` `petri-transition` `values: { form: 'rect', fill: INK }`.
- The inks: `viewpointDerivation.ts:131` `const NAME_INK = 'var(--color-inode-name)';` and the catalogue `#334155`.
- Provenance: every derived view carries `ir.generated` (`notations.ts:324`); `irTypes.ts:509` says it is «Absent on
  every view written by hand». `ObjectNode.tsx:933` already reads it (R-VP-34): `const derivedView = !!(irResolution.compiled.ir as VertexViewIR).generated;`.

**Proposed predicate** (in `metaclassPalette.ts`, structural parameter, no import):

```ts
export function isNotationGlyph(ir: { kind?: unknown; generated?: unknown; shape?: { form?: unknown; fill?: unknown; marker?: unknown } } | null | undefined): boolean
// true iff ir.kind === 'vertex' && ir.generated && (form === 'bar'
//   || (form === 'circle' && (fill ∈ {'var(--color-inode-name)', '#334155'} || marker ∈ {'dot', 'dot-large'})))
```

A conditional form, fill or marker (an object) never matches: the classic Petri place's token marker is a
conditional (`{"rules":[...]}`, §3), so it stays a coloured place. The two ink strings duplicate two constants that
are not exported (`NAME_INK`, `INK`); a test on the real derivation pins them, so a renamed ink fails the bench.

`notationGlyphClasses(state, viewpointId)` mirrors the resolver's view index (`irResolveCore.ts:135`
`if (!d || d.viewpoint !== vp) continue;`): the class ids pinned (`authoringMetaclassPins`) by a glyph view of that
viewpoint and by no other node view of it.

## 3. Glyph candidates per derived notation [M]

From the enumeration (§1.2); «named» = one label, «nameless» = none. Every other vertex document is a white box,
diamond, stadium, parallelogram or the Petri place, fill `var(--color-inode-surface)`, and stays coloured.

| Notation | Glyph nodes (demo where measured) | Not glyphs worth noting |
|---|---|---|
| Activity (UML) | initial disc in NAME_INK, nameless; fork and join bars NAME_INK; final bull's-eye `dot-large`, nameless (DemoFlowB, DemoESM) | decision diamond (white), actions |
| Flowchart | initial disc `#334155`, nameless; fork, join bars `#334155`; terminal bull's-eye `dot`, nameless (DemoFlowB, DemoESM) | — |
| State machine | initial disc `#334155` (named on DemoESM, label at the bottom on the ink; nameless on DemoFlowB); bull's-eye `dot` (DemoFlowB); fork/join bars when bound | the Terminal box with a Trigger (double border) |
| Statechart (UML) | none in the four demos; fork/join bars and an activity-final bull's-eye only if bound (inherited from State machine) | the Initial: a named box with the entry mark (`entry=dot`), Q5 |
| Petri net | transition bar `#334155`, name centred (DemoPetri); Terminal bull's-eye `dot`, named (DemoESM, DemoFlowB) | the place: white circle, no marker |
| Petri net (classic) | transition bar `#334155` fill and border, name outside `e` (DemoPetri); named Terminal bull's-eye | the place: white circle, conditional token marker |
| Flowchart (ISO 5807), Generic, ER (Chen) | none | — |

Open case of the prompt: the classic Petri transition is a real metaclass with many instances; it is a solid ink bar
like fork/join, so it is a glyph (Q2). The R-VP-16 Petri transition is the same bar with the name on it.

The entry mark (`IRNodeContent.tsx:585-586`), today painted with `markerColor`:
`const markerColor = colorOverride ? colorOverride.text : (borderColorV || 'var(--border-default)');` (`:514`). It sits outside
the box, on the canvas: coloured, it reads `#000000` instead of the ink (`--color-inode-name`, `#0f172a` light,
`rgba(255, 255, 255, 0.92)` dark, `_colors-dark.scss:344`), so in dark it is black on the dark canvas [R].

## 4. Where the colour is applied, and what consults the predicate

| Point | Line (verbatim) | Change |
|---|---|---|
| `ObjectNode.tsx:142` | `const metaclassColor = useSelector((state: any) => resolveMetaclassColoring(state, data.instanceOfClassId), shallowEqual);` | none: per class, not per view |
| `ObjectNode.tsx:960` | `colorOverride={metaclassColor ?? undefined}` | **consults `isNotationGlyph(irResolution.compiled.ir)`**: a glyph gets `undefined` |
| `ObjectNode.tsx:1185`, `:1243` | the pill and the native card, `metaclassColoringVars(metaclassColor)` | none: native views, never derived |
| `IRNodeContent.tsx:258`, `:447`, `:487`, `:514` | fill, outline, text and tokens, marker colour from `colorOverride` | none: absent override paints «alone, as before» (prop doc, `:190-195`) |
| `IRNodeContent.tsx:585-586` | the entry mark, `fill={markerColor}` / `stroke={markerColor}` | Q5: a derived view's entry mark takes the uncoloured ink |
| `metaclassPalette.ts:369-383`, `:390-409` | resolver, table | none; the two new exports are added |
| `ViewpointProperties.tsx:80-91`, `:190-205` | the table → dropdown options, the swatch grid | glyph rows: empty swatch, no grid, hint |

`colorOverride=` has one host: `command grep -rn "colorOverride=" . --include='*.tsx'` under `src/`, exit 0, one line
(`ObjectNode.tsx:960`). Palette (prompt item 4) and overrides (item 5): the exclusion is at the render point, so
`assignMetaclassColors` sees the same ids, adjacency and overrides as at `1ff8ab314`, and every class keeps its
fill byte for byte; an override stored on a glyph class keeps using its swatch in the greedy, as today.

## 5. Layer Impact Report (`viewpoint/ir/` is in the §3.1 table)

```
LAYER IMPACT REPORT
Layers touched:
  [ ] D-layer  [ ] L-layer  [ ] JjOM  [x] Canvas v2-flow (ObjectNode, IRNodeContent paint)
  [ ] Canvas classic  [ ] Sync layer  [ ] Persistence
Canvas v2-flow — What changes: a derived glyph node receives no colorOverride; a derived view's
  entry mark paints in its border ink. What does NOT change: node sizes, handles, the resolver,
  the palette, any view, any IR key, any non-derived view. Cross-layer: reads idlookup/viewelements
  (selector), writes nothing. Side effects: none on sync (no action dispatched), none on save.
Smoke scenarios: DemoFlowB on Activity (UML), coloring on; DemoPEST on Statechart (UML); DemoPetri
  on Petri net (classic); the four demo scenes in the default viewpoint, coloring off, 0 px.
```

## 6. Dependencies and risks

- Decision id [M]: `git show alfonso-frontend-jjtl:docs/decisions.md | grep -c "R-VP-40"` → 0 (control: R-VP-39 → 1);
  a scan of every local branch finds `**R-VP-4x**` only on `elk-layout-disc` (`693f10008`, not an ancestor of the
  trunk): R-VP-40..49. So R-VP-50 (Q7).
- A saved derived viewpoint is covered without re-derivation: the predicate reads the stored `ir`.
- A user who edits a derived bar's fill keeps it a glyph (form `bar`), so it shows the user's fill uncoloured.
- `ViewpointProperties.tsx` does not import under vitest (`window is not defined`, the `joiner` barrel): its row state
  is measured by the probe; the pure halves (`notationGlyphClasses`, the table) by the bench.
- The ink strings are duplicated (§2); pinned by a test on the real derivation.

## 7. Open questions

See §0, questions 1-7, each with its `Recommended:` line adopted unattended (RC-21).

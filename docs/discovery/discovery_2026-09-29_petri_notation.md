# Discovery: the classic Petri net notation in the derived viewpoint

Prompt-ID P-2026-09-29-0925 · `docs/prompts/claude_2026-09-29_0925_prompt_discovery_petri_notation.md` · Chat C-2026-09-28-1936 · session `cd740a5d-d86b-4615-a9d2-57ead4a66e34` · tree `~/jjodel-w-petrinot`, branch `petri-notation-disc`, HEAD `103ada238` · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference: whoever uses it rereads the files. [M] = measured in this phase on `103ada238`, [R] = read, [A] = read by a read-only agent and not rechecked by me.

## 0. Answer in brief

- **Today, «Derive viewpoint» on DemoPetri meets 4 of 19 reference traits with the Petri roles bound, 1 of 19 without them** [M]. What matches: Place is a plain circle with a white fill (light theme) and no compartments, and Transition is a solid bar. Everything else differs (§5).
- **What the derivation alone can reach now** (no §3.1 file, no IR change) [M+R]: a dark 1 px stroke and line (`var(--color-inode-name)`); a small filled arrowhead (`closedArrow`, 8×8, the colour of the line); straight arcs (`routing: 'straight'`); italic names; tokens as a conditional marker (`dot` for one) plus a centre count label from a threshold up. Measured on DemoPetri: `lock` gets `dot`; `p1` gets `dots-2`, which the registry does not have, so nothing is drawn.
- **Data rows only, no type change.** 2 to 4 dots need new ids in `markerRegistry.ts`, an open vocabulary under `viewpoint/ir/`, a §3.1 directory.
- **Additive IR changes.** Each is a widened union or an optional key, with no `irVersion` bump, and `validateIR` already lets each new value through [M]:
  - **The name outside the shape** (the root blocker). Every label is an in-flow child, clipped twice by `overflow: hidden`. `StructureSpec.name.position: 'external'` is declared but no renderer reads it.
  - **A serif face.** `FontFamilyToken` is `sans | mono`, and no serif token exists.
  - **The thin bar.** There is no size field; a rect is floored at 140×40, and its wrapper at 200 px wide.
  - **The inhibitor circle.** There is no circle termination.
- **Out of reach before the freeze:** an arc that curves around a node (routing is per view, and straight or curved drops waypoints); the subscript `p₁`; the resting drop shadow; vertical bars; arc tips aimed at the circle's centre; dots for the run's marking (the run keeps its count badge).

Recommended: four lanes in sequence, all additive: (1) the derivation plus the dot rows; (2) the outside label plus serif; (3) a `bar` form plus a `hollowCircle` termination; (4) the derivation switched over to (2) and (3). Lanes 1-2 before the freeze; 3-4 only if lane 2 merges by 2026-10-01 12:00. Projected with the same trait table, not measured: 11/19 after lane 1, 14/19 after lane 2, 16/19 after lane 4.

**Decisions awaiting Alfonso** (RC-26)
1. The go-ahead to edit §3.1 files: `viewpoint/ir/` (`irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `irStyle.ts`, `shapeRegistry.ts`, `notationCatalog.ts`) and `viewpoint/authoring/` for lanes 2-3; for lane 1 only the rows in `markerRegistry.ts`, and without them lane 1 still ships `dot` for one token and a number from two. None is a §3.2 trigger, so the hook does not fire (RC-15 (2)).
2. The names of the new persisted vocabulary, permanent once saved (R-B9): `LabelPosition 'outside'` with `LabelSpec.anchor`, `FontFamilyToken 'serif'`, `ShapeForm 'bar'`, `EdgeTermination 'hollowCircle'`, and markers `dots-2`, `dots-3`, `dots-4`.

**Questions**
1. The outside name: a new label position with an anchor, or wire `StructureSpec.name.position: 'external'`, which has no placement? Recommended: the label position with an anchor; Place `nw`, Transition `e`.
2. Tokens: draw the model's initial marking as dots, or leave tokens to the run? During a run the dots disagree with the badge. Recommended: dots up to 4, a number from 5, and the badge unchanged.
3. Arc routing: `straight` for every arc, or `curved` for every arc? Recommended: `straight`.
4. Ink: `var(--color-inode-name)` for place borders, arcs and arrowheads, while the bar keeps the catalogue's `#334155`? Recommended: yes.
5. With no role binding (derived before Apply), keep today's boxes? Recommended: yes, key the notation on the Petri profile.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The derived Petri views already carry most of the classic notation. | **Falsified** [M]. 4/19 traits with roles bound, 1/19 without (§5). |
| H2 | The missing traits are reachable by changing only the derivation's output. | **Partly** [M+R]. The stroke, the line colour, the filled arrowhead, straight routing, italics and tokens (one dot, or a number) are reachable. The outside name, serif, the thin bar and the inhibitor circle are not. |
| H3 | A label can be placed outside the shape today. | **Falsified** [R+M]. `LabelPosition` is `'top' \| 'center' \| 'inside' \| 'bottom'`, all rendered in-flow inside a clipped box. The declared `NamePosition 'external'` is read by the authoring panel only. |
| H4 | Tokens can be drawn from the model today. | **Partly** [M]. A `marker` conditional over `$tokens.value` resolves per place on DemoPetri. Only one dot exists in the registry; a count can be shown through a conditional centre label. |
| H5 | The needed IR changes are additive. | **Holds** [M+R]. Each one is a union widening or an optional key. `validateIR` accepts `'outside'`, `'serif'`, `'bar'` and `'hollowCircle'` today (it checks routing, padding, cornerRadius and predicate ops only), so an older build degrades to the fallback rendering instead of rejecting the view. |

## 2. Files read (full paths under `/Users/alfonso/jjodel-w-petrinot/`)

`CLAUDE.md` (§3, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P4, P6, P13, P16), `docs/decisions.md` (RC-15 to RC-34, R-MCID-1/2, R-IRN-35), `docs/handoff/decisions-symbol-editor-1b.md` (D9, 2f sizing), `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md`, `docs/log-inbox/views.md` (the 0135, 0233 and 0111 entries), `docs/demo/models_2026_simulator_demo.md` (§1, §2.2, §4). Derivation: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (whole), its test (1-300), `frontend/src/utils/deriveViewpoint.ts` (whole). IR: `frontend/src/components/editor-v2/viewpoint/ir/{irTypes.ts (whole), IRNodeContent.tsx (whole), irStyle.ts (whole), notationCatalog.ts (whole), markerRegistry.ts (whole), irValidate.ts:20-50, irCompile.ts:228-236,558-566, irReadCtx.ts:15-48,140-200, shapeRegistry.ts:265-280,338-343,578-580, useContentSize.ts:114-118, structureCapabilities.ts:103}`. Canvas: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:912-971`, `nodes/instanceNode.scss:20-36`, `edges/UnifiedEdge.tsx:150-156,220-230,514-530,709-723,834-844`, `EditorV2.scss:2700-2708,2745-2751`, `_themes.scss:92-98,250-256`, `utils/jjomTransformers.ts:73-82`. Simulation overlay: `sim/SimNodeRunState.tsx` (whole), `sim/simNodeRunState.scss:1-100`. Tokens: `frontend/src/styles/tokens/_colors-light.scss` (26-34, 103, 235, 446-449), `_colors-dark.scss` (35, 142, 341-344), `_typography.scss:12-13`. Hook: `frontend/scripts/hooks/critical-zone.mjs:30-50`.

Two read-only Explore agents covered the edge renderer and the node sizing. I rechecked their key citations myself: `irCompile.ts:561-565`, `UnifiedEdge.tsx:223-228,514-530,834-844,709-723`, `EditorV2.scss:2703-2706,2746-2750`, `_themes.scss:252,256`, `jjomTransformers.ts:78-79`, `shapeRegistry.ts:272-278,340-342`, `ObjectNode.tsx:915-935,969`, `instanceNode.scss:27,35`. The citations marked [A] were not rechecked.

## 3. Measures (gitignored probes `frontend/scripts/smoke/_tmp_petrinot_*`, `git check-ignore` confirmed, data in `/tmp/petrinot/`)

- **Decode** (`_tmp_petrinot_decode.mjs`, `node`, EXIT=0). The four exports `~/jjodel-demo-exports/scene_*.jjodel` are read only; each file is byte-identical to its `.json` twin (`cmp`). DemoPetri has 107 lookup entries, 13 DObjects and 13 object vertices. `_state` is `{}` on the metamodel, and every vertex has `w 200 h 120 isResized false`, so no size is carried (`manualSizeOf` returns `{}`, `jjomTransformers.ts:79` `if (!eff.isResized) return {};`). The objects are places `p1 (tokens 2)`, `p2`, `p3` and `lock (1)`, transitions `t1..t3`, arcs `a1..a5` and the inhibitor `i1`, as in demo §2.2.
- **Derivation** (`_tmp_petrinot_derive.ts`, `npx tsx`, EXIT=0, `validateIR failures: 0`).
  - The roles come from `bindProfile(systemProfile('petri'))`, the same route as the derivation test: `simNode=Place, simInitialMarking=tokens, simTransition=Transition, simArc=Arc, simArcSource=src, simArcTarget=tgt, simArcWeight=weight, simInhibitorArc=InhibitorArc, simGuard=guard`.
  - Control: a conditional axis reaches the stubbed read context and throws, so the scalar reads are real.
  - Result: `TOTAL structure only: 1/19`, `TOTAL Petri roles bound: 4/19`.
- **Today's IR on the objects** (`_tmp_petrinot_tokens.ts`, `npx tsx`, EXIT=0). The read context is the pure draw backend; the live one is `'lproxy'` (`irReadCtx.ts:15`) and was not measured.
  - A Place view with `marker: {rules: eq $tokens.value 1..4 → dot, dots-2, dots-3, dots-4}` and a centre label `$tokens.value` visible when `gt 4` returns `{"ok":true}`.
  - Per object: `p1: tokens=[2] marker="dots-2" drawn=no`, `lock: tokens=[1] marker="dot" drawn=yes`, `p2`/`p3: marker=""`. A synthetic 7 gives `numberLabelVisible=true text=7`.
  - `validateIR` returns `{"ok":true}` on each of: label position `"outside"`, fontFamily `"serif"`, form `"bar"`, termination `"hollowCircle"`. Positive control: routing `"auto"` is rejected (`edge.routing must be one of orthogonal | straight | curved`).
- **Absence searches** (`rg` over `frontend/src`, exit codes recorded):
  - `font-serif|'serif'` exit 1; `hollowCircle|filledCircle` exit 1; `ir-label--outside` exit 1. Control `font-sans` exit 0.
  - `StructureSpec|.structure` hits only `viewpoint/authoring/{StructureGroups,VertexAuthoringPanel}.tsx`, its test and `irTypes.ts`. Two further hits, `joiner/ExecuteOnRead.ts:49` and `reducer.ts:1410-1414`, are an unrelated `.structure` field.
  - `--edge-color:` is not a CSS custom-property declaration in the source; it is an SCSS map key `'edge-color'` in `_themes.scss`. An `rg` for the literal `--edge-color:` found only `_color-schemes.scss`, the positive control `--color-inode-border:` was found, and the map key was then read.

## 4. Findings, element by element

Legend: **E** = expressible and rendered as asked; **D** = expressible, rendered differently; **N** = not expressible without an IR change.

| Element | Verdict | Evidence |
|---|---|---|
| Place: plain circle, no compartments, no header | **E** | `form: 'circle'` is written by the Petri preset (`notationCatalog.ts:106` `values: { form: 'circle' }`). The derivation adds no compartment to a circle (`viewpointDerivation.ts:90` `NO_COMPARTMENT ... 'circle'`). |
| Place: white fill | **E** (light) | `SURFACE = 'var(--color-inode-surface)'` (`viewpointDerivation.ts:63`), `#ffffff` in light (`_colors-light.scss:446`), `#334155` in dark (`_colors-dark.scss:341`). |
| Place: thin **dark** stroke | **D**, fixable in the derivation | 1 px is right, but the colour is `var(--color-inode-border)` (`viewpointDerivation.ts:64`), which is `$slate-300` `#cbd5e1` (`_colors-light.scss:447`), a light grey. `border.color` accepts any CSS string (`irTypes.ts:171`). The theme-aware ink is `--color-inode-name`: `$slate-900` in light (`:449`), `rgba(255, 255, 255, 0.92)` in dark (`_colors-dark.scss:344`). |
| Place: no drop shadow | **D**, not switchable | `.ir-node-content { ... box-shadow: 0 1px 3px var(--node-shadow), ... overflow: hidden; }` (`irStyle.ts:72`). Only SVG-painted forms drop it (`:106`, `:123`); `circle` is a CSS form (`shapeRegistry.ts:341` `painter: { kind: 'css' }`). |
| Name **outside**, upper left | **N** | `LabelPosition = 'top' \| 'center' \| 'inside' \| 'bottom'` (`irTypes.ts:57`). Labels are flex children of the shape: `className={`ir-label ir-label--${l.position}`}` (`IRNodeContent.tsx:559`). They are clipped by `.ir-node-content { overflow: hidden }` (`irStyle.ts:72`) and again by the wrapper `.mm-node.mm-object { ... overflow: hidden; }` (`instanceNode.scss:27`). `NamePosition = 'header-band' \| 'center' \| 'below' \| 'external'` (`irTypes.ts:418`) is read by no renderer, as the type itself says: «wiring them into `resolveInstanceNodeStyle` as the viewpoint layer is the render slice that follows» (`:407-409`). The precedent for escaping the clip is `SimNodeRunState`, mounted as a sibling of the wrapper (`ObjectNode.tsx:969`, `SimNodeRunState.tsx:17-18`). |
| Name: italic | **E**, not written | `fontStyle?: Conditional<'normal' \| 'italic'>` (`irTypes.ts:93`), rendered at `IRNodeContent.tsx:132` `if (cs.fontStyle) { ... s.fontStyle = v; }`. |
| Name: serif | **N** | `FontFamilyToken = 'sans' \| 'mono'` (`irTypes.ts:78`); `FONT_FAMILY_VAR = { sans: 'var(--font-sans)', mono: 'var(--font-mono)' }` (`IRNodeContent.tsx:112`). There is no serif token (§3). Additive: the union member, the map entry, a `--font-serif` in `styles/tokens/_typography.scss`, and the `TextStyleEditor` option [A: `TextStyleEditor.tsx:6-9`]. |
| Name: subscript index `p₁` | **N** | A `TextSource` is plain text (`irTypes.ts:71-74`). It would need a display transform on the label; that is out of scope. |
| Transition: solid bar | **E** (as a rect) | `petri-transition` is `{ form: 'rect', fill: INK }` (`notationCatalog.ts:108`), with `INK = '#334155'` (`:59`), slate-700 and not black. The derivation keeps the catalogue hex for recognition (`viewpointDerivation.ts:21-24`); the probe reads `recognized=[...petri-transition...]`. |
| Transition: thin, about 4:1 | **N** | The IR has no size: only `resizable?: boolean` (`irTypes.ts:471`). A rect uses `BOX_SIZING = { heightFactor: 1, minBoxWidth: 140, minBoxHeight: 40, minAspect: 0 }` (`shapeRegistry.ts:272`); the CSS floor is `.ir-node-content { min-width: 140px; min-height: 40px; }` (`irStyle.ts:81`) and the wrapper's is `min-width: 200px` (`instanceNode.scss:35`), which irStyle lifts only for geometric forms. Inferred, not measured: a derived bar is about 200×40, a thick 5:1 box. Orientation is horizontal only. |
| Transition: no text inside | **D** | The name is inside, at `bottom`, in `var(--color-text-inverse)` (`viewpointDerivation.ts:252-255`). Without an outside position the only alternative is no name at all. |
| Transition: name beside | **N** | As for the Place name. |
| Arc: thin **dark** line | **D**, fixable in the derivation | With no `line`, the stroke is `.reference-edge { stroke: var(--edge-color); stroke-width: 1; }` (`EditorV2.scss:2703-2706`), where `'edge-color': #94a3b8` (`_themes.scss:252`) is a mid grey. `line.color` is applied inline and takes `var(...)` (`UnifiedEdge.tsx:711` `...(irStroke ? { stroke: irStroke } : {})`). |
| Arc: small **filled** arrowhead | **D**, fixable in the derivation | The derivation writes `targetEnd: 'openArrow'` (`viewpointDerivation.ts:234`). `closedArrow` is `<path d="M 0 0 L 10 5 L 0 10 Z" className="reference-marker filled" style={irMarkerFillStyle} />`, drawn 8×8 (`UnifiedEdge.tsx:834-844`) and filled (`EditorV2.scss:2746-2750`). It takes the line colour once one is authored: `irMarkerFillStyle = irStroke ? { fill: irStroke, stroke: irStroke } : undefined` (`UnifiedEdge.tsx:721`). |
| Arc: straight when possible | **D**, fixable in the derivation | Absent routing is Manhattan (`irCompile.ts:565` `routing: e.routing ?? null`). `'straight'` runs `getStraightPath` (`UnifiedEdge.tsx:223-224`). |
| Arc: curved when it goes around | **N** | Routing is per view, not `Conditional` (`irTypes.ts:601`). `'curved'` is a Bezier between side handles (`UnifiedEdge.tsx:225-228`), and both non-orthogonal styles drop waypoints (`irTypes.ts:598-600`), so no detour can be drawn by hand. |
| Arc endpoints | **D**, aesthetic [A] | The side is chosen by the dominant axis (`irEdgeViews.ts:91-116`), and on a circle the handle is inset to the outline (`DynamicHandles.tsx:358-366`), not aimed at the centre. The agent infers a gap of about 4 px from the handle size (not measured). Opposite arcs between one pair sit at 1/3 and 2/3 of the side (`handlePosition.ts:251-252`). |
| Inhibitor arc: small circle | **N** | `EdgeTermination` is `'none' \| 'openArrow' \| 'closedArrow' \| 'hollowTriangle' \| 'filledDiamond' \| 'hollowDiamond'` (`irTypes.ts:540-546`). The marker switch has no circle (`UnifiedEdge.tsx:521-530`). Additive: a union member, a `<marker>` beside `:834`, and a case. |
| Tokens: dots | **D** for 1, **data row** for 2 to 4 | `marker?: Conditional<string>` (`irTypes.ts:208`), drawn in the border colour (`IRNodeContent.tsx:450-452`). `dot` exists (`markerRegistry.ts:83`). The registry is data: «Aggiungere un marker e' aggiungere una entry qui (D10: un dato in piu', non codice del motore)» (`:11-12`). Measured in §3. The `dot` glyph has radius 16 of 100, a third of the circle, so a 2-4 dot layout needs smaller dots. |
| Tokens: a number when many | **E**, not written | A `center` label with `$tokens.value` and `visible` `gt 4` (§3). |
| Tokens during a run | **D** | The run paints a count badge on the node's top-left corner (`SimNodeRunState.tsx:53-61`, `simNodeRunState.scss:33-36` `top: -10px; left: -10px;`). M0 dots drawn by the view would show beside it, and the badge sits where an upper-left name would go. |

## 5. Per derived view, today (Petri roles bound; §3 probe)

| View | Derived IR (excerpt) | Matches | Differs |
|---|---|---|---|
| Place | `circle`, `var(--color-inode-surface)`, border 1 `var(--color-inode-border)`, label `bottom` name | 3/8: circle, white, no compartments | light stroke; name inside; no italic, serif or subscript; no tokens; shadow |
| Transition | `rect`, `#334155`, label `bottom` name in inverse text | 1/5: solid bar | slate-700 not black; about 200×40 [inferred]; text inside; name not beside |
| Arc | `$src.value → $tgt.value`, `none → openArrow`, no line, no routing | 0/3 | mid-grey line; open arrowhead; Manhattan routing |
| InhibitorArc | the same as Arc (`role:inhibitorArc`) | 0/3 | as Arc, and an arrowhead instead of a circle |

Structure only (no binding stored, as in the export): Place and Transition become `rounded` boxes with a `top` header and an `attributes` compartment, and the arcs stay as above. Total 1/19.

## 6. Recommended Phase 2 (additive only; files and order)

1. **Lane 1, derivation plus dots** (fast lane; §3.1 only for the data rows).
   - Files: `viewpoint/derive/viewpointDerivation.ts` and its test; `viewpoint/ir/markerRegistry.ts` and `__tests__/markerRegistry.test.ts` (rows `dots-2`, `dots-3`, `dots-4`, small dots).
   - Under `shape === 'petri'` only:
     - Place: border `var(--color-inode-name)`, italic name, marker rules 1..4, centre count label from 5.
     - Arc: `line {color: var(--color-inode-name), width: 1}`, `closedArrow`, `straight`.
     - InhibitorArc: line and routing as Arc, `openArrow` kept until lane 3.
   - `controlFlow` stays byte-identical, so the test pins it.
2. **Lane 2, outside label plus serif** (full: §3.1, more than 3 files).
   - Files: `irTypes.ts` (`LabelPosition 'outside'`, `LabelSpec.anchor?` a compass value, absent `'s'`, `CompiledLabel.anchor`, `FontFamilyToken 'serif'`), `irCompile.ts`, `IRNodeContent.tsx` (skip outside labels in the flex; the serif map), `nodes/ObjectNode.tsx` (an outside-label layer as a sibling, the `SimNodeRunState` pattern), `irStyle.ts`, `styles/tokens/_typography.scss`, a test.
   - That is 7 files, so Rule 19 pauses the lane first. Authoring options (the label position select, `TextStyleEditor`) come after the freeze. Until then a derived view opened in the Symbol Editor shows an empty position select («Nota Select condiviso»).
3. **Lane 3, bar plus circle** (full: §3.1).
   - Files: `irTypes.ts` (`ShapeForm 'bar'`, `EdgeTermination 'hollowCircle'`), `shapeRegistry.ts` (a fixed thin box, no content floor), `irStyle.ts` (the `bar` floors lifted), `notationCatalog.ts` (a new row `petri-transition-bar`; `petri-transition` stays for saved views), `edges/UnifiedEdge.tsx` (the circle marker).
   - This lane shares `irTypes.ts` and `irStyle.ts` with lane 2, so it runs after it, not in parallel (RC-22).
4. **Lane 4, the derivation** switched to lanes 2 and 3: Place name `outside` `nw` in italic serif; Transition `bar` with name `outside` `e` and no inverse text, which also closes the dark-theme ticket of P-2026-09-29-0135; InhibitorArc `hollowCircle`. Two files.

Gates for each lane: typecheck at 14, vitest, build. Visual check for each lane: derive on DemoPetri after Apply, in light and dark, with the four demo scenes unchanged (RC-31).

## 7. Dependencies and risks

- **Everything is keyed on a stored Petri binding.** The export holds none; the scene binds on Apply (demo §2.2). Deriving before Apply gives boxes (§5).
- **Sizes are inferred, not measured.** This lane ran no dev server. The circle is about 66×66 by the agent's arithmetic from `ELLIPSE_SIZING` (`shapeRegistry.ts:276-278`, `GEOMETRIC_MIN_BOX_HEIGHT = 64` at `:267`). The rect is about 200×40 from the CSS floors. The agent also reads the `bottom` label on a circle as clipped by `border-radius: 50%` plus `overflow: hidden` [A]. Lane 1's visual check measures both.
- **Persisted vocabulary is permanent.** Saved IR has no VersionFixer (R-B9, restated at `irTypes.ts:292-293`). An older build renders the new values as fallbacks: `'outside'` gets no CSS and stays in the flex, `'serif'` becomes sans, `'bar'` becomes `FALLBACK` (`shapeRegistry.ts:579`), and `'hollowCircle'` gets no marker.
- **The critical-zone boundary.** `viewpoint/ir/` and `viewpoint/authoring/` are in the §3.1 table. The hook guards only the six §3.2 files and the D-layer creators (`critical-zone.mjs:37-47`), so it will not stop these lanes: the go-ahead is the gate.
- **The run badge.** An upper-left name and the top-left count badge compete for the same corner during a run (§4, the last row).

## 8. Decisions taken (unattended)

1. **The trait table (19 traits) is my reading of the reference as the prompt describes it.** The image itself was not available to this lane, and the table is the yardstick of §0 and §5.
2. **The inhibitor arc is scored on three traits** (line, straight, circle): its circle replaces the arrowhead rather than adding to it.
3. **Roles were rebuilt with `bindProfile`, as the derivation test does**, and not through `runBag`/`storedProfile`, which import the joiner. The bag lists the same nine keys the demo's Apply binds (demo §2.2: «9 of 10 roles matched»).

Decisions awaiting Alfonso and Questions: §0.

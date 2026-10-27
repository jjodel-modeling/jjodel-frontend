# Discovery: how far the concrete syntax can improve visually (default notation and derived viewpoints)

Prompt-ID P-2026-09-29-1227 · `docs/prompts/claude_2026-09-29_1227_prompt_discovery_visual_concrete_syntax.md` · Chat C-2026-09-28-1936 · session `43f9c27d-4899-4f31-8a92-e5834c0bc175` · tree `~/jjodel-w-visual`, branch `visual-syntax-disc`, HEAD `69e9bc245` · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference: whoever uses it rereads the files. [M] measured in this phase on `69e9bc245`, [P] read off a 2x pixel crop, [R] read by me, [A] read by a read-only agent and not rechecked.

## 0. Answer in brief

- **Derived views, against the textbook:** state machine (DemoPEST) 4.5/10, extended state machine (DemoESM) 5/11, activity (DemoFlowB) 4.5/10 [M]. Petri remains the benchmark (R-VP-16). The default notation scores 4/9 for M2 class boxes and 1.5/5 for M1 object boxes [M] (§2, §3; ✓ = 1, ~ = ½).
- **The largest gap is on the edges, not the nodes.** None of the 18 derived transitions or flows carries a label: no `event`, no `[guard]`, no `/ action` [M]. The derivation reads no trigger, guard or action role. Its only edge label is «the first string attribute»: `viewpointDerivation.ts:247` `attributesOf(c.id).find(a => a.type === SKETCH_TYPE.string)` [R]. Yet after Apply `simTrigger` is bound in PEST and ESM, `simGuard` and `simAction` in ESM and FlowB [M].
- **Legibility fails in three places** [M]: M2 class headers, white on `#7bafd4`, 2.4:1 (abstract 2.1:1); every edge outside Petri, `#94a3b8` on the `#f1f5f9` canvas, 2.34:1; M1 quiet text (`[k]`, `—`), 1.48:1.
- **Two notation defects in the default M2 and M1:** the generalization arrow paints as a downward «V» under the parent, its base hidden by the box [P]; the UML underline of `name : Class` is computed (`text-decoration-line: underline` on `.mm-object__name`) but not painted [M+P].
- **Reachable with IR data only (the derivation; no §3.1 file):**
  - labels from `simTrigger` / `simGuard`;
  - dark line ink on the control-flow kinds, as Petri already has;
  - a bull's-eye in ink (the marker takes the border colour, `IRNodeContent.tsx:452`);
  - centred names in boxes with no compartment;
  - fork and join as the existing `bar` form.
  - Projected, not measured: SM 7/10, ESM 7/11, activity 7/10.
- **Needs an IR change (§3.1, persisted vocabulary):**
  - `event [guard] / effect` and `entry / a`: `TextSource` has no concatenation (`irTypes.ts:72-75`).
  - A small initial dot and bull's-eye: the IR has no size field, and a circle is at least 64 px (`shapeRegistry.ts:267`).
  - Event objects hidden in a state machine view.
  - A decision diamond: there is no decision role.
  - Projected: SM 9/10, ESM 10/11, activity 9.5/10.

Recommended: before the freeze, lane V1 (derivation only, §5) alone. Lane V2 (renderer contrast and underline) goes before the freeze only if Alfonso approves its colours. The rest goes after the freeze, in the order of §5.

**Decisions awaiting Alfonso** (RC-26)
1. The §3.1 go-ahead for V4 (`viewpoint/ir/`), and for V3 if its diagnosis reaches `portDistribution.ts`.
2. Persisted vocabulary, permanent once saved (R-B9):
   - a `TextSource` template (literal and path parts);
   - the forms `dot` and `bullseye`, or one `size` field instead;
   - a hide option for a metaclass in a view;
   - a `simDecision` role.
3. The look of every canvas (V2): the M2 header text colour and the edge ink, both of which change every demo screenshot. Before or after the freeze?
4. The demo's named initial and terminal states (`locked`, `off`): a nameless dot and bull's-eye, or a named state box with a marker.

**Questions**
1. Run V1 before the freeze? Recommended: yes, as the only lane before the freeze; V2 only after decision 3.
2. Initial and terminal in state machines? Recommended: activity gets the nameless dot and bull's-eye. State machines keep the named box: Terminal with the existing `double` border (`irTypes.ts:174`, data only, in V1), Initial with a dot badge after V4.
3. Labels in V1: the event only, since there is no template until V4? Recommended: yes, with the guard as raw text on flows. Whether `$event.value` prints the event's name is not measured, and V1 measures it first.

## 1. Hypotheses, method, files

- **H1. Falsified:** «the derived non-Petri views are close to the textbook». They score 4.5 to 5 out of 10 or 11 (§2).
- **H2. Partly:** «the gap is closable by derivation data alone». This reaches 7/10 on the projection; labels with more than one part, symbol sizes and hidden events need the IR.
- **H3. Holds:** «the default notation has measurable legibility defects» (§3, §4).
- **Probe.** A lane probe on 3053 (`lane-run probe`), light theme, 1600×1000 at DPR 2:
  - Four demo scenes built by the probe kit's builder (`~/.jjodel-lanes/probe-kit/simgate/`, copied read-only), not imported.
  - Then Advanced, the Semantic type, the chip, Configure…, Apply, «Derive viewpoint», and the derived viewpoint picked in the toolbar.
  - Probe files: `frontend/scripts/smoke/_tmp_visual_{probe,check,common}.ts` and `_tmp_visual_scenario.js` (gitignored). Logs: `~/.jjodel-lanes/P-2026-09-29-1227/probe-_tmp_visual_{probe,check}.log`, every run `EXIT=0`. Data: `/tmp/visual/data{,2}/*.json`.
- **Files.** I read `viewpointDerivation.ts:93-97,247-258,277-280`, `irTypes.ts:72-75,174,603-606`, `irCompile.ts:100-137,492-512`, `IRNodeContent.tsx:452`, `shapeRegistry.ts:267,312`, `utils/deriveViewpoint.ts:35`, `UnifiedEdge.tsx:425`, `EditorV2.scss:2276-2295,2825`, `nodes/instanceNode.scss:96-108,141`, `editor-v2/_themes.scss:221,229,252`, `styles/tokens/_colors-light.scss:451` and `docs/DESIGN-SYSTEM.md:14-30` [R]. Two Explore agents covered the M2/M1 renderer and the IR vocabulary [A].
- **Absence searches.**
  - `rg "simTrigger|simGuard|simAction|simEntry|trigger|guard" viewpointDerivation.ts` exits 1. The control `rg -c "simInitialMarking|simNode|role"` on the same file exits 0 with 46.
  - Edge labels were counted on every `.react-flow__edge` of the derived canvases: 0 of 18 [M].

## 2. Derived viewpoints, trait by trait (✓ ~ ✗, n/a) [M unless tagged]

| Trait | SM | ESM | Act | Today | Needs |
|---|---|---|---|---|---|
| Node is a rounded rectangle | ✓ | ✓ | ✓ | `rounded`, 200×42, radius 10 px | — |
| Name centred in a box with no compartment | ~ | ~ | ~ | Label `top`, 13/600, in a 42 px box (`viewpointDerivation.ts:279` `position: boxed ? 'top' : 'bottom'`) | Derivation: `center` when there is no compartment |
| Initial: small filled dot, no name | ~ | ~ | ~ | 66×66 disc in `#334155`, with the name inside in white | IR: a fixed `dot` form; see Q2 |
| Final: bull's-eye | ~ | ~ | ~ | 66×66 ring and dot in `#cbd5e1`, 1.48:1 on white, name inside (`IRNodeContent.tsx:452` `markerColor = borderColorV`) | Derivation: border in ink; IR: size |
| Arrow with an open head | ✓ | ✓ | ✓ | `openArrow` on 5, 4 and 9 edges | — |
| Label `event` / `[guard]` / `/ action` | ✗ | ✗ | ✗ | 0 of 18 labelled | Derivation: one path; IR: a template for more than one part |
| Events are labels, not nodes | ✗ | ✗ | n/a | 3 Event boxes per SM; ESM also shows `name = coin` rows | IR: hide a metaclass |
| `entry / a` inside the state | n/a | ~ | n/a | A row `entry = —` | IR: template |
| Decision is a diamond | n/a | n/a | ✗ | `d1` is a rounded box | A role or a name rule (decision 2) |
| Fork and join are thin nameless bars | n/a | n/a | ~ | 200×42 rect in `#334155`, name inside | Derivation: `bar` (48×12, `shapeRegistry.ts:312`), no label |
| Self-loop is a small loop | ✓ | ✓ | n/a | Orthogonal loop of 123 px (t3, t4, tc) | — |
| Line ink at least 3:1 | ✗ | ✗ | ✗ | `#94a3b8`, 2.34:1; Petri uses `#0f172a`, 16.3:1 | Derivation: `line.color`, as Petri |
| Edges avoid nodes | ✗ | ✗ | ~ | t5 and ts cross `unlocked`; crossings 4 / 1 / 3 | Routing (renderer) |

## 3. Default notation, M2 class boxes and M1 object boxes [M unless tagged]

| Trait | Today | Evidence |
|---|---|---|
| M2 name compartment, rows `name : Type [m]` | ✓ | Name 13/500 centred; rows 12 px; bounds 11 px |
| M2 abstract is italic | ✓ | `PNode` is italic, header `#a8b5c4` |
| M2 header legible (at least 4.5:1) | ✗ | White on `#7bafd4` is 2.4:1 (`_themes.scss:221,229`); `#0f172a` on the same blue would be 7.6:1 |
| M2 generalization: hollow triangle touching the parent | ✗ | [P] a downward «V» under the parent. The marker is `M 0 0 L 12 5 L 0 10 Z`, 12×10, `orient auto`, `marker-end` |
| M2 composition: filled diamond at the container | ✓ | `diamond-filled` 12×8 at `State` |
| M2 roles and multiplicities at both ends | ~ | The role sits mid-edge in a chip; multiplicity only at the target [A: `UnifiedEdge.tsx:971`] |
| M2 line ink at least 3:1 | ✗ | `#94a3b8` on `#f1f5f9`, 2.34:1 (`_themes.scss:252` `'edge-color': #94a3b8`) |
| M2 labels free of collisions | ✗ | `source` × `target` overlap by 141.5 px² (FlowB). A path crosses a role chip 2 / 2 / 5 times (SM / ESM / FlowB). `UnifiedEdge.tsx:425` «No cross-edge de-overlap here» |
| M2 empty compartment | ~ | [P] an empty band under the header of classes with no members |
| M1 `name : Class` underlined | ~ | Computed `underline`, offset 3 px, span `display: block`; [P] no line painted. Clipping by its `overflow: hidden` is inferred, not traced |
| M1 slots `attr = value` | ~ | `instanceNode.scss:141` «the `=` is dropped entirely» |
| M1 links avoid objects | ✗ | Path samples inside other nodes: 26 / 0 / 47 / 27; crossing pairs 5 / 11 / 24 / 5 (SM / ESM / FlowB / Petri) |
| M1 link labels | ~ | Hidden by default. When shown, the 10 px labels sit on 5 / 0 / 8 / 6 nodes and are crossed 29 / 19 / 37 / 0 times |
| M1 quiet text (at least 4.5:1) | ✗ | `[k]` and `—` in `--color-inode-quiet` slate-300 (`_colors-light.scss:451`), 1.48:1; the reference pill 3.5:1 |

## 4. Cross-cutting [M unless tagged]

- **Type.** One family, Inter Variable, in five sizes:
  - M2: 13/500, 12, 11, and 10/500 on edge labels and multiplicities.
  - M1: the name at 14/600, rows at 13, pills at 12, `[k]` at 11.
  - IR: 13/600 or 13/400.
  - Edge labels are 10 px at every level (`EditorV2.scss:2825`), against «Secondary text | 11px | 400 | Labels» (`DESIGN-SYSTEM.md:22`). The M1 name at 14/600 departs from «Primary text | 13px | 500» (`:21`).
- **Ink and borders.** Three border systems: M2 `rgba(0,0,0,.12)`, M1 and IR `#cbd5e1`, Petri places `#0f172a`. Petri is the only derived kind with dark lines and a closed head.
- **Selection and hover.**
  - Selected: the M2 and IR node gets a 2 px sky-400 outline at 55 %; the M1 node a `#0891b2` border and ring; the M2 edge `#0284c7` at 1.5 px. None of them is `#0ea5e9`.
  - Hover changes nothing on edges at any level, nor on M2 and IR nodes; the M1 node gains a shadow.
  - A midpoint click on an M1 or derived edge showed no selected state (not rechecked; it may be a hit-test miss).
- **Spacing.** None of the 101 node positions sits on the 8 px grid (default placement at 50 + k·400/600 px). The rail `.properties-tree-overlay` (400 px) covers the right 29 % of the 1398 px canvas, so 1 to 3 nodes per view are partly hidden at first paint.
- **Routing.** Orthogonal everywhere, with 4 px corners and bridge arcs; 0 diagonal segments in the 96 painted paths of the M2, M1 and derived canvases.

## 5. Lanes, ranked by impact × cost

1. **V1, before the freeze, S, IR data only.** Files: `viewpoint/derive/viewpointDerivation.ts` and its test, plus `utils/deriveViewpoint.ts` if the profile id is needed (`:35` passes only the shape). Neither is in §3.1. Adds the labels from `simTrigger` / `simGuard`, control-flow ink, the bull's-eye in ink, `double` for Terminal, centred names, and nameless `bar` forks. The demo scenes do not change unless someone derives.
2. **V2, before or after the freeze (decision 3), S, renderer.** Files: `nodes/instanceNode.scss`, `EditorV2.scss`, `_themes.scss`, `styles/tokens/_colors-light.scss`. Changes: the M1 underline painted; M2 header text `#0f172a`; `--edge-color` slate-600 (6.9:1); quiet text slate-500 (4.76:1); edge labels at 11 px. The RC-31 scenes are re-run.
3. **V3, after, M.** A §5 discovery, then the fix, of the generalization marker (the tree bus in `UnifiedEdge.tsx`; it may reach `portDistribution.ts`, §3.1).
4. **V4, after, M-L, IR (§3.1).** A `TextSource` template for `event [guard] / effect` and `entry / a`; fixed `dot` and `bullseye` forms; edge-label text style; `hollowCircle` (R-VP-15, lane 3).
5. **V5, after, M.** Hide a metaclass in a view (the Events); the `simDecision` role, giving the diamond; initial and terminal chosen per profile.
6. **V6, after, L, renderer.** Cross-edge label de-overlap; both association ends; EOpposite pairs merged; edge hover; one selection accent; no empty band.
7. **V7, after, L.** Default placement snapped to the grid, and a layered layout for derived SM and activity views.

Crops (gitignored, `sips -Z 600`, rail hidden and zoomed to fit): `docs/discovery/harness/_tmp_visual_{sm,esm,flowB,petri}_{m2_default,m1_default,m1_labels,derived}.png`.

# Discovery — IR coverage of the view properties panel

- Prompt-ID: P-2026-11-11-1925 (chat C-2026-11-11-1925, front maintenance, lane full, discovery only)
- Prompt file: `docs/prompts/claude_2026-11-11_1925_prompt_ir_view_panel_coverage.md`
- Sessions: an earlier session of this lane (id not recorded in its handoff), `07f91980-fc2c-4500-a37b-9888d4a9db10`
  (continuation 1), `c916ef5f-5cb8-4549-8811-4284205aac35` (continuation 2, wrote this file)
- Tree: `~/jjodel-w-irpanel`, branch `ir-panel-coverage`, HEAD `bb7821a10` (all three sessions, tree clean, no code edited)
- Executor model (banner): Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the
  real files.

Tags: **read** = read in a file at `bb7821a10`; **measured** = a command run in this lane at `bb7821a10`, with its
result. File:line refers to `bb7821a10`.

## 0. Objective and hypotheses

Objective: for every field a view can carry in its IR (kinds `vertex`, `graphVertex`, `edge`, `row`), say whether the
properties panel of a view (EditorV2, viewpoint tree → view: tabs of `irTabs.tsx` plus the editors they open) has a
control that reads and writes it, or whether the field is reachable only through the read-only Source tab, or not at all.

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Every IR field of a view has a read/write control in the panel | **falsified** | 82 of 157 rows covered, 38 partial, 21 missing (§5) |
| H2 | Where a control exists, it reaches the full type | **falsified** | three cross-cutting limits X1-X3 (§1.0) make every Predicate, PathExpr and TextStyle slot partial |
| H3 | The gV panel has parity with the vertex panel on shared `ShapeSpec` keys | **falsified** | `padding`, `marker`, `entry`, `barThickness`, `text`, `badges`, `fieldCompartments` have no gV control (§1.2) |
| H4 | The missing rows are UI-only: `irValidate` already knows the keys | **partly** | 9 keys named by `irValidate`, 3 not (`placement`, `caption`, `persistWaypoints`) (§6) |
| H5 | The panel writes nothing outside the IR | **holds** for the IR | the non-IR writes are the DViewElement name, parenting and `irStash`, all intended (§4) |
| H6 | Some IR fields are reachable only from the canvas | **falsified** for the one write path found | `ObjectNode.tsx:788-799` duplicates a panel control (§1.5) |
| H7 | Spec and `irTypes.ts` agree | **falsified** | drift both ways (§3), including the v1.1 base that v1.2 incorporates by reference |
| H8 | The panel preserves fields it does not author | **falsified** for one field | `FieldSegmentEditor.tsx:64` drops `literal.style` on any edit of the text (§1.1 row V-53) |

## Files read

Normative: `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md`; its base `docs/spec/spec_2026-06-08_ir_schema_v1_1.md`
(incorporated by v1.2 §3 :40 «come v1.1 sez. 3» and §4 :50 «Come v1.1 sez. 4 ... con questi delta»; window read this
session: lines 137-241 of 531, plus the key sweep over the whole file); `claude_spec_2026-07-25_ir_row_dispatch_addendum.md`,
`claude_spec_2026-07-26_ir_edge_authoring_addendum.md`, `claude_spec_2026-07-27_ir_textstyle_addendum.md`,
`claude_spec_2026-08-28_ir_formspec_addendum.md`, `claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md`
(all under `docs/spec/`); `docs/decisions.md` (rows cited by id); `docs/ratifiche/claude_ratifiche_2026-07-26_eref_authoring.md`,
`docs/ratifiche/claude_ratifiche_2026-08-02_eobj_object_as_edge.md`.

Code (`A/` = `frontend/src/components/editor-v2/viewpoint/authoring/`, `IR/` = `frontend/src/components/editor-v2/viewpoint/ir/`,
`UI/` = `frontend/src/components/ui/`): `IR/irTypes.ts`, `IR/irValidate.ts`, `IR/structureCapabilities.ts`,
`IR/shapeRegistry.ts`; `A/irTabs.tsx`, `A/VertexAuthoringPanel.tsx`, `A/GraphVertexAuthoringPanel.tsx`,
`A/EdgeAuthoringPanel.tsx`, `A/RowAuthoringPanel.tsx`, `A/MatchingSection.tsx`, `A/ContainmentSection.tsx`,
`A/graphVertexAuthoring.ts`, `A/StructureGroups.tsx`, `A/FieldCompartmentListEditor.tsx`, `A/FieldSegmentEditor.tsx`,
`A/LabelListEditor.tsx`, `A/LabelEntryEditor.tsx`, `A/TextSourceEditor.tsx`, `A/TextStyleEditor.tsx`,
`A/TextStyleField.tsx`, `A/BadgeListEditor.tsx`, `A/FormAuthoringBody.tsx`, `A/SymbolEditorModal.tsx`;
`UI/ConditionalEditor/ConditionalEditor.tsx`, `UI/PathBuilder/PathBuilder.tsx`, `UI/PredicateBuilder/PredicateBuilder.tsx`,
`UI/PredicateBuilder/predicateDefaults.ts`; `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`,
`frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`. All paths resolved with `find` this session (each
returned exactly one file).

Abbreviations in the tables: VAP `A/VertexAuthoringPanel.tsx`, GVAP `A/GraphVertexAuthoringPanel.tsx`, EAP
`A/EdgeAuthoringPanel.tsx`, RAP `A/RowAuthoringPanel.tsx`, MS `A/MatchingSection.tsx`, CS `A/ContainmentSection.tsx`,
gVA `A/graphVertexAuthoring.ts`, SG `A/StructureGroups.tsx`, FCL `A/FieldCompartmentListEditor.tsx`, FSE
`A/FieldSegmentEditor.tsx`, LLE `A/LabelListEditor.tsx`, LEE `A/LabelEntryEditor.tsx`, TSE `A/TextSourceEditor.tsx`,
TST `A/TextStyleEditor.tsx`, TSF `A/TextStyleField.tsx`, BLE `A/BadgeListEditor.tsx`, FAB `A/FormAuthoringBody.tsx`,
CE `UI/ConditionalEditor/ConditionalEditor.tsx`, PB `UI/PathBuilder/PathBuilder.tsx`, PrB
`UI/PredicateBuilder/PredicateBuilder.tsx`. Spec: S11 v1.1, S12 v1.2, ROW, EDGE, TS (textstyle), FRM (formspec), GV
(graphVertex containment) addenda; dec = `docs/decisions.md`. «commit» = the panel's draft commit, used where a control has no dedicated
writer (pinned for the vertex panel only: VAP:140, :201, 300 ms).

## 1. Inventory and classification

### 1.0 Rules and cross-cutting limits (read)

- **Conditional<T>.** A control built on CE without `rulesTable` is `partial`: constant and when/then/else are editable,
  the `rules` form is a read-only chip. CE:93-96 «if (isRules && !rulesTable) { return <span ...> conditional (multiple
  rules, not yet editable)</span>»; with `rulesTable`, `RulesModeEditor` edits both forms (CE:113-126; CE:235-237
  «Conditional edits the normal form of `toRules` and writes through `fromRules`»). Basic mode shows «conditional (edit
  in Advanced mode)» (CE:102-104): progressive disclosure, not a gap.
- **X1, Predicate.** PrB offers 13 of 14 ops; `marked` (S12 §3 :46, R-MK-1/R-MK-10) has none: `predicateDefaults.ts:20-35`;
  PrB:295-302 names it slice M2; R-MK-9 (dec:2878-2885). Every Predicate slot is `partial`.
- **X2, PathExpr.** PB:45 «PathBuilder — grammar-constrained single-hop PathExpr authoring control»; PB:76-77 «TODO
  multi-hop seam (slice successiva)». A persisted multi-hop value parses to an empty feature (PB:37-38, `singleHopOf`) and
  is overwritten only by an explicit pick. S12 §3 :42 puts multi-hop in the contract. Every TextSource `path` and edge
  endpoint is `partial`. Exception: the gV channel has a multi-step builder (CS:180-201, «Then follow»).
- **X3, TextStyle.** The six Conditional axes use CE without `rulesTable` (TST:131-139); `letterSpacing` and
  `textTransform` (R-VP-20, `IR/irTypes.ts:130`, :132) have no control. Measured: `command grep -c -E
  'letterSpacing|textTransform'` over `A/*.ts*` → 0 in every file; positive control `fontWeight` → TSF 1, TST 2. Every
  TextStyle slot is `partial`. Controls: fontFamily TST:165-168, fontSize :187-188, fontWeight :221-222, fontStyle
  :241-242, underline :259-263, color :283-284; writer `setAxis` TST:51-58.
- **TextSource.** TSE:53-58 offers 4 `from` kinds (:14-19): intrinsic (:60-67), literal (:69-75), expression slot
  (:77-84), path (:86-94, PB). `caption` of the expression source (`IR/irTypes.ts:102` «{ from: 'expression'; slot:
  string; caption?: string }») has no control (§8).

### 1.1 `vertex` (67 rows)

| # | IR path | Type | Source | Class | Control | Writer | Note |
|---|---|---|---|---|---|---|---|
| V-1 | irVersion | string | S12 §4 :54 | out of scope by decision | — | — | migration stamp (S12 :16, :215); Decision 6 |
| V-2 | kind | enum | S11 §4.1 :142 | covered | irTabs.tsx:213-218 | `convertIRKind`, stash irTabs.tsx:190-191 | all four kinds |
| V-3 | metaclasses | `string[] \| '*'` | S12 :56 | covered | MS:108-111 (`*`), :77 (remove), picker | MS:76; :78-84 | |
| V-4 | authoringMetaclassPins | object | FRM :12 (named), R-MCID-1 | covered | MS picker | `withMetaclassPins` MS:78-84 | |
| V-5 | generated | object | R-VP-21 (dec:4700) | out of scope by decision | — | — | `IR/irTypes.ts:652` «Written by a derivation, never by hand»; Decision 6 |
| V-6 | predicate | Predicate | S12 :57 | partial | MS:148-158 | commit | X1 |
| V-7 | priority | number | S12 :58 | covered | MS:173-175 | commit | |
| V-8 | exclusive | boolean | S12 :59 | covered | MS:183-185 | commit | |
| V-9 | label | string | S12 :60 | covered | VAP:960 | commit | |
| V-10 | resizable | boolean | GV §2.6 :88 (as a vertex key) | covered | VAP:886-891 | commit | |
| V-11 | defaultSize.{width,height} | number | GV §2.6 :88 | covered | VAP:912-930 | VAP:460-470 | |
| V-12 | visible | `Conditional<boolean>` | GV §2.6 :88; P-2026-10-03-1304 Q7 | **missing** | — | — | gV has it (GVAP:434-443); §8 |
| V-13 | shape.form | `Conditional<ShapeForm>` | S11 §5.1 :179 | covered | VAP:653-663 (rulesTable) | commit | `bar` withheld by R-VP-16 (dec:4546-4548) |
| V-14 | shape.cornerRadius | `Conditional<number>` | R-IRN-35 | covered | VAP:681-715 (rulesTable) | commit; reset VAP:449-452 | |
| V-15 | shape.fill | `Conditional<string>` | S11 :181 | covered | VAP:729-739 | commit | |
| V-16..18 | shape.border.{color,width,style} | Conditional per axis | S11 :182 (whole), per-axis in code | covered | VAP:755-797 | `patchBorderAxis` VAP:432-440 | type drift §3.2 |
| V-19 | shape.marker | `Conditional<string>` | TS :127 (named, 2026-08-15) | covered | VAP:866-876 (rulesTable) | commit | |
| V-20 | shape.padding | PaddingToken | TS :117 | covered | VAP:843-858 (Advanced) | commit | |
| V-21 | shape.entry | EntryMark | R-VP-22 (dec:4758) | **missing** | — | — | §8 |
| V-22 | shape.barThickness | number | R-VP-57 (dec:5192) | **missing** | — | — | §8 |
| V-23 | shape.text | TextStyle | TS :109 | partial | VAP:968-975 (TST, `hideUnderline`) | TST:51-58 | X3; Underline hidden on purpose, TST:36-41 «The Symbol-text mount sets it» |
| V-24 | shape.labels[] | list | S11 :183 | covered | LLE:38-61 (add, remove, reorder) | onChange → commit | |
| V-25 | labels[].position | enum (6) | S11 :196 (4); R-VP-15 | covered | LEE:151-155 | `applyLabelPositionValue` LEE:61-68 | `header` and `orientation` are gV-only (LEE:152, :158 `allowHeader`) |
| V-26 | labels[].anchor | enum | R-VP-15 | covered | LEE:151-155 (outside n/s/w/e, :24-29) | LEE:61-68 | |
| V-27 | labels[].source | TextSource | S11 :197 | partial | TSE:53-94 | TSE onChange | X2; `caption` missing |
| V-28 | labels[].visible | `Conditional<boolean>` | S11 :198 | partial | LEE:199-208 (no rulesTable) | onChange | |
| V-29 | labels[].editable | `boolean \| {widget}` | S12 §5 | partial | LEE:183-188 (toggle); widget form = chip LEE:181-182 | `applyLabelEditable` LEE:86-90 | widget object not editable |
| V-30 | labels[].style | TextStyle | S11 :199; TS :44 | partial | LEE:211-217 (TSF) | TST:51-58 | X3 |
| V-31 | shape.badges[] | list | S11 :184 | covered | BLE:33-58 | onChange | |
| V-32 | badges[].icon | `Conditional<string>` | S11 :211 | partial | BLE:65-78 (no rulesTable) | onChange | |
| V-33 | badges[].position | enum (4) | S11 :212 | covered | BLE:83-87 (4 literals, :5-10) | onChange | S11 has a 5th literal, §3.2 |
| V-34 | badges[].visible | `Conditional<boolean>` | S11 :213 | partial | BLE:92-100 (no rulesTable) | onChange | |
| V-35 | badges[].tooltip | string | S11 :214 | covered | BLE:105-108 | onChange | S11 type Conditional, §3.2 |
| V-36 | structure.name.position | enum | R-STR-1 (dec:3566) | covered | SG:242-252 | `set()` SG:228 → `withStructure` :117-140 | literals per shape `IR/structureCapabilities.ts:132-141`; out-of-cap value kept as chip SG:258-264 |
| V-37 | structure.name.typeDisplay | enum | R-STR-1 | covered | SG:267-273 | same | |
| V-38 | structure.accentPlacement | enum | R-STR-1 | covered | SG:285-290 | same | |
| V-39 | structure.accent | string | R-STR-1 | covered | SG:302-305 | same | |
| V-40 | structure.compartment.mode | enum | R-STR-1 | covered | SG:312-317 | same | |
| V-41 | structure.compartment.columns | enum | R-STR-1 | covered | SG:333-342 | same | shown when mode ≠ `none` (SG:331) |
| V-42 | structure.emptyBehavior | enum | R-STR-1 | covered | SG:344-351 | same | same gate |
| V-43 | structure.edgeMarker | boolean | R-STR-1 | covered | SG:353-357 | same | same gate |
| V-44 | fieldCompartments[] | list | S11 :175 | covered | FCL:128-147 | onChange | mounted VAP:571-581 when `structureCaps.showsFieldCompartments` |
| V-45 | [].id | string | S11 :223 | covered | FCL:193 | onChange | |
| V-46 | [].title | string | S11 :224; FRM :187 | covered | FCL:198-202 | `withCompartmentTitle` FCL:81 | S11 type Conditional, §3.2 |
| V-47 | [].source.from | enum (3) | S11 :225 | covered | FCL:208-212 | `withCompartmentSource` FCL:45-49 | that writer drops `exclude` |
| V-48 | [].source.exclude | `string[]` | R-VP-20 | **missing** | — | — | §8 |
| V-49 | [].source.filter | Predicate | S11 :235 | partial | FCL:218-240 (isKind only); other predicates = chip :221-222 | `withChildFilter` FCL:57 | narrower than X1 |
| V-50 | [].rowFormat.segments | list | S11 :226 | covered | FCL:245-256 | onChange | |
| V-51 | segment kind | enum (4) | S12 §5 :80 | covered | FSE:55-59 | `forKind` FSE:58 | |
| V-52 | segment literal.text | string | S12 §5 | covered | FSE:62-65 | FSE:64 | |
| V-53 | segment literal.style | TextStyle | R-VP-20 (`IR/irTypes.ts:164`) | **missing** | — | — | **defect**: FSE:64 `onChange({ kind: 'literal', text: e.target.value })` rebuilds the segment and drops a persisted `style` (read this session) |
| V-54 | segment value.editable | `boolean \| {widget}` | S12 §5 :84 | partial | FSE:71-76 (toggle); widget = chip FSE:69-70 | `applyValueEditable` FSE:28-35 | |
| V-55 | [].rowFormat.style | TextStyle | TS :45 | partial | FCL:268-275 (TSF) | `withRowStyle` FCL:67 | X3 |
| V-56 | [].visible | `Conditional<boolean>` | S11 :227 | partial | FCL:288-296 (no rulesTable) | onChange | |
| V-57 | [].separator | boolean | S11 :228 | covered | FCL:279-283 | onChange | |
| V-58 | form.theme | enum (4) | FRM (`IR/irTypes.ts:371`) | covered | FAB:662-667 | `withFormKey` FAB:157-163 | |
| V-59 | form.labelPlacement | enum (2) | FRM (:373) | covered | FAB:672-677 | `withFormKey` | |
| V-60 | form.widgets | record | FRM (:383) | covered | FAB:540, :578, :601 | `withFormEntry` FAB:173-182 | `link` withheld: FAB:101-108 «declared in the vocabulary but has no rendering yet (spec addendum sez. 14)» |
| V-61 | form.features | record (3 literals) | FRM (:386) | covered | FAB:637-651 | FAB writers (not pinned separately) | |
| V-62 | form.basic | `string[]` | FRM (:388) | covered | FAB:510, :524, :705 | `withBasic` FAB:206-238; `withoutBasicName` :248-250 | |
| V-63 | form.order | `string[]` | FRM (:396) | out of scope by decision | — | — | R-DMV-2/3/4; Decision 7 |
| V-64 | form.labels | record | FRM (:401) | out of scope by decision | — | — | same |
| V-65 | form.hidden | `string[]` | FRM (:408) | out of scope by decision | — | — | same |
| V-66 | form.hosts.manager | object | FRM (:417) | out of scope by decision | — | — | R-VP-14 (dec:4517-4524); R-DMV-7 «`hosts.manager` e `FormHostOverride` sono morti» |
| V-67 | table.columns | `string[]` | R-VP-3 (superseded), R-DMV-3 (`IR/irTypes.ts:467`) | out of scope by decision | — | — | Decision 7 |

### 1.2 `graphVertex` (52 rows)

Rows V-2..V-4, V-7, V-8 have the same control (MS mounted at GVAP:280-287) and are not repeated in prose below; they are
counted. Writers in gVA (lines measured this session with `command grep -n '^export function (with|without)'`).

| # | IR path | Type | Source | Class | Control | Writer | Note |
|---|---|---|---|---|---|---|---|
| G-1 | irVersion | string | S12 :54 | out of scope by decision | — | — | Decision 6 |
| G-2 | kind | enum | S11 :143 | covered | irTabs.tsx:213-218 | `convertIRKind` | |
| G-3 | metaclasses | list or `*` | S12 :56 | covered | MS via GVAP:280-287 | MS:76 | |
| G-4 | authoringMetaclassPins | object | FRM :12 | covered | MS picker | MS:78-84 | |
| G-5 | generated | object | R-VP-21 | out of scope by decision | — | — | Decision 6 |
| G-6 | predicate | Predicate | S12 :57 | partial | MS:148-158 | commit | X1 |
| G-7 | priority | number | S12 :58 | covered | MS:173-175 | commit | |
| G-8 | exclusive | boolean | S12 :59 | covered | MS:183-185 | commit | |
| G-9 | label | string | S12 :60 | covered | GVAP:454 | commit | |
| G-10 | resizable | boolean | GV §2.6 | covered | GVAP:405-410 | commit | |
| G-11 | defaultSize.{width,height} | number | GV §2.6 | covered | GVAP:417-425 | `withDefaultSizeAxis` gVA:344 | |
| G-12 | visible | `Conditional<boolean>` | GV §2.6 | partial | GVAP:434-443 (no rulesTable) | `withVisible` gVA:281 | |
| G-13 | shape.form | `Conditional<ShapeForm>` | S11 :179 | covered | GVAP:309-319 (rulesTable; FORM_OPTIONS :33-44, no `bar`) | `withShape` gVA:321 | |
| G-14 | shape.cornerRadius | `Conditional<number>` | R-IRN-35 | partial | GVAP:325-333 (NumberInput, constant only) | gVA:321; reset `withoutCornerRadius` gVA:326 | `IR/shapeRegistry.ts:467-468` returns undefined for a non-number: a persisted Conditional reads «default» and the first edit overwrites it |
| G-15 | shape.fill | `Conditional<string>` | S11 :181 | covered | GVAP:340-350 (rulesTable) | gVA:321 | |
| G-16..18 | shape.border.{color,width,style} | Conditional per axis | S11 :182 | covered | GVAP:357-399 (rulesTable) | `withBorderAxis` gVA:332 | |
| G-19 | shape.padding | PaddingToken | TS :117 | **missing** | — | — | §8 |
| G-20 | shape.marker | `Conditional<string>` | TS :127 | **missing** | — | — | §8 |
| G-21 | shape.entry | EntryMark | R-VP-22 | **missing** | — | — | §8 |
| G-22 | shape.barThickness | number | R-VP-57 | **missing** | — | — | §8 |
| G-23 | shape.text | TextStyle | TS :109 | **missing** | — | — | no `<TextStyleField`/`<TextStyleEditor` in GVAP, §8 |
| G-24 | shape.badges | list | S11 :184 | **missing** | — | — | no `<BadgeListEditor` in GVAP, §8 |
| G-25 | shape.labels[] | list | S11 :183 | covered | GVAP:458-466 (LLE, `allowHeader`) | onChange | |
| G-26 | labels[].position | enum (6) | R-VP-15; GV §2.3 :62-67 (`header`) | covered | LEE:151-155 (with `header`) | LEE:61-68 | |
| G-27 | labels[].anchor | enum | R-VP-15 | covered | LEE:151-155 | LEE:61-68 | |
| G-28 | labels[].orientation | enum | GV §2.3 :62-67 (R-GV-5) | covered | LEE:158-166 (header only) | `applyLabelOrientation` LEE:74-77 | |
| G-29 | labels[].source | TextSource | S11 :197 | partial | TSE | TSE | X2, `caption` |
| G-30 | labels[].visible | `Conditional<boolean>` | S11 :198 | partial | LEE:199-208 | onChange | no rulesTable |
| G-31 | labels[].editable | `boolean \| {widget}` | S12 §5 | partial | LEE:183-188 | LEE:86-90 | widget chip |
| G-32 | labels[].style | TextStyle | S11 :199 | partial | LEE:211-217 | TST:51-58 | X3 |
| G-33 | fieldCompartments | list | S11 :175 (ShapeCap of gV, :143) | **missing** | — | — | no `<FieldCompartmentListEditor` in GVAP, §8 |
| G-34 | form | FormSpec | FRM; `IR/irTypes.ts:671` | **missing** | — | — | irTabs.tsx:68-71 «No Form tab: the container's FormSpec is not authored there in this slice»: a slice note, not a decision (Decision 9) |
| G-35 | table | TableSpec | R-DMV-3 (:678) | out of scope by decision | — | — | Decision 7 |
| G-36 | containment.children | PathExpr | S12 §8; GV | covered | CS:172-205 (Select + step PBs) | `withChannel` gVA:161, `withChannelStep` :294, `withoutLastChannelStep` :308 | the only multi-step builder |
| G-37 | containment.childFilter | Predicate | S12 §8 | partial | CS:235-255 (Advanced, isKind only) | `withChildFilter` gVA:168 | |
| G-38 | containment.layout.mode | enum | GV | covered | CS:208-214 | `withLayoutMode` gVA:190 | |
| G-39 | containment.layout.axis | enum | GV | covered | CS:257-266 | `withLayoutAxis` gVA:198 | Advanced from CS:232-233 (also G-40..G-42, G-45..G-52) |
| G-40 | containment.layout.header.side | enum | GV | covered | CS:269-276 | `withHeaderSide` gVA:203 | |
| G-41 | containment.layout.header.size | number | GV | covered | CS:277-282 | `withHeaderSize` gVA:210 | |
| G-42 | containment.layout.padding | number | GV | covered | CS:286-289 | `withLayoutPadding` gVA:217 | |
| G-43 | containment.layout.frame | ContainerFrame | GV :188 | in progress | — | — | in progress in P-2026-11-11-1110 (branch not audited) |
| G-44 | containment.layout.separator | PartitionSeparator | GV (5 hits) | **missing** | — | — | §8 |
| G-45 | containment.membership.mode | enum | GV | covered | CS:291-307 | `withMembershipMode` gVA:225 | |
| G-46 | containment.membership.create.ownerKind | string | GV | covered | CS:314-319 | `withMembershipCreate` gVA:236 | |
| G-47 | containment.membership.create.feature | string | GV | covered | CS:322-335 | gVA:236 | |
| G-48 | containment.edges | enum | GV | covered | CS:221-229 | `withChannelEdges` gVA:252 | |
| G-49 | containment.collapsible | boolean | S12 §8 | covered | CS:342-344 | `withCollapsible` gVA:257 | |
| G-50 | containment.collapsed.form | `Conditional<ShapeForm>` | S12 §8 | partial | CS:349-358 (constant Select, or chip) | `withCollapsedForm` gVA:274 | |
| G-51 | containment.collapsed.fill | `Conditional<string>` | S12 §8 | partial | CS:360-369 (constant, or chip) | `withCollapsedKey` gVA:264 | |
| G-52 | containment.collapsed.badge | BadgeSpec | S12 §8 | partial | CS:372-397 (icon and position only; chip if conditional) | gVA:264 | |

### 1.3 `edge` (27 rows)

| # | IR path | Type | Source | Class | Control | Writer | Note |
|---|---|---|---|---|---|---|---|
| E-1 | irVersion | string | S12 :54 | out of scope by decision | — | — | Decision 6 |
| E-2 | kind | enum | S11 :145 | covered | irTabs.tsx:213-218 | `convertIRKind` | |
| E-3 | metaclasses | list or `*` | S12 :56 | covered | EAP:600-641 (inline) | commit | |
| E-4 | authoringMetaclassPins | object | FRM :12 | covered | EAP:261-264 | EAP:261-264 | |
| E-5 | generated | object | R-VP-21 | out of scope by decision | — | — | Decision 6 |
| E-6 | reference | string | EDGE :54 (E-ref) | covered | EAP:658-661 | `setReference` EAP:440-453 | |
| E-7 | predicate | Predicate | S12 :57 | partial | EAP:670-689 (PrB :678) | commit | X1 |
| E-8 | priority | number | S12 :58 | covered | EAP:694-699 | commit | |
| E-9 | exclusive | boolean | S12 :59 | out of scope by decision | — | — | ratifica E-ref R-5 (`claude_ratifiche_2026-07-26_eref_authoring.md:11` «**`exclusive` omesso** dal panel edge finché il resolver non gli dà semantica sugli edge»); confirmed `claude_ratifiche_2026-08-02_eobj_object_as_edge.md:42`; EAP:163-164. Disagreement with EDGE D8 (:40), §3.4 |
| E-10 | label | string | S12 :60 | **missing** | — | — | §8 |
| E-11 | edge.source | PathExpr (+ `container` token) | S12 §7 :127 | partial | EAP:739-743 (mode), PB EAP:749-753 | `applyEndpoints` EAP:297-298 | X2; `container` covered via ENDPOINT_MODE_OPTIONS EAP:94-96 |
| E-12 | edge.target | same | S12 §7 | partial | EAP:763-767 | EAP:297-298 | X2 |
| E-13..15 | edge.line.{color,width,style} | Conditional | S12 §7 | partial | EAP:808-846 (no rulesTable) | `patchLine` EAP:477-478 | |
| E-16..17 | edge.terminations.{sourceEnd,targetEnd} | `Conditional<EdgeTermination>` | S12 §7 :134 (plain); slice E | partial | EAP:870, :874 via `renderEnd` :535-551 (no rulesTable) | `patchTerminations` EAP:479-480 | 14 ends, EAP:118-121; R-VP-24 |
| E-18 | edge.routing | enum (3) | S12 :135 | covered | EAP:850-855 | `setRouting` EAP:490-500 | `orthogonal` written as absent |
| E-19 | edge.curve | EdgeCurve | R-VP-22 (dec:4758) | **missing** | — | — | §8 |
| E-20 | edge.labels.center | TextSource | S12 §7 | partial | EAP:885-899 | commit | X2 |
| E-21 | edge.labels.placement | enum (3) | S12 :140 | **missing** | — | — | EAP:512 «`placement` (not authored here) survives»; §8 |
| E-22 | edge.labels.template | `TextSource[]` | R-VP-20 | **missing** | — | — | §8 |
| E-23 | edge.labels.style | TextStyle | TS §4 :47 | **missing** | — | — | §8 |
| E-24 | edge.labels.sourceEnd | `TextSource \| EdgeEndLabels` | R-VP-23; slice E | partial | EAP:910-941 (multiplicity/role, Advanced) | `setEndLabelPart` EAP:556-568 | X2 |
| E-25 | edge.labels.targetEnd | same | same | partial | EAP:910-941 | EAP:556-568 | X2 |
| E-26 | edge.persistWaypoints | boolean | S12 (4 hits) | **missing** | — | — | EAP:158 «Fields not touched here (... persistWaypoints) round-trip verbatim»; §8 |
| E-27 | form | FormSpec | `IR/irTypes.ts:850` | **missing** | — | — | FRM §2 places `form` on the row view; schema disagreement §3.4; Question 4 |

The edge «nature» Select (EAP:717-720) is UI state, not IR (EAP:149-153).

### 1.4 `row` (11 rows)

| # | IR path | Type | Source | Class | Control | Writer | Note |
|---|---|---|---|---|---|---|---|
| R-1 | irVersion | string | ROW; `IR/irTypes.ts:862` «"ir-1.0" — no bump» | out of scope by decision | — | — | Decision 6 |
| R-2 | kind | enum | ROW | covered | irTabs.tsx:213-218 | `convertIRKind` | |
| R-3 | metaclasses | list or `*` | ROW | covered | RAP:246, :327 (wildcard); RAP:352 (Select) | commit | |
| R-4 | authoringMetaclassPins | object | FRM :12 | covered | RAP:162 | RAP:162 | |
| R-5 | generated | object | R-VP-21 | out of scope by decision | — | — | Decision 6 |
| R-6 | predicate | Predicate | ROW | partial | RAP:367-377 | commit | X1 |
| R-7 | priority | number | ROW | covered | RAP:392-394 | commit | |
| R-8 | label | string | ROW | covered | RAP:446 | commit | |
| R-9 | template | `TextSource[]` | ROW (4 hits) | partial | RAP:408-424 (ListEditor + TSE) | commit | X2 |
| R-10 | visible | `Conditional<boolean>` | ROW :30 | partial | RAP:427-440: shown only when already present, no rulesTable | commit | cannot be added from absent |
| R-11 | style | TextStyle | TS :46 | partial | RAP:453-459 (TSF) | TST:51-58 | X3 |

### 1.5 Outside the panel (canvas)

Measured (earlier session): `command grep -rln "\.ir = " frontend/src`. The only canvas hit is
`frontend/src/components/editor-v2/nodes/ObjectNode.tsx:788-799`, `resetViewWidget`, which drops `form.widgets[feature]`:
the same write as V-60, so not canvas-only. Other hits (`deriveViewpoint.ts`, `lastViewpoint.ts`, `irDemoFixture.ts`,
`EnableIRPanel.tsx`, `A/SymbolEditorModal.tsx`, `DataManagerViewpointPanel.tsx:178`, :339, `unproxy.ts`, `view.tsx`,
`VersionFixer.tsx`) are creation, derivation or persistence and were not audited. Limit: this search sees only the
`.ir = ` assignment form; a write through `SetFieldAction` on an `ir` path would not appear in it.

## 2. Viewpoint-level fields (not gaps of the view panel)

| Field | Source | Note |
|---|---|---|
| ViewpointIR.irVersion, name, metamodel, views | S11 §4 :129; S12 §6 :96 | views list is managed by the viewpoint tree, not audited |
| interaction.palette / connect / containmentDrop | S12 §6 :96-113 | absent from `irTypes.ts` (comments only); S12 :116 «assente = derivato» makes absence normative |
| Editability commit path | S12 §5 :91 | a clause on the interpreter, not a field |
| Data Manager singleton theme and palette | R-DMV-4, R-SKIN-3 | the singleton is filtered out of the tree: `TreeViewContent.tsx:716-718` `.filter(ptr => ... !isDataManagerViewpointId(ptr))` |

## 3. Drift

### 3.1 Spec fields absent from `irTypes.ts`

| Field | Spec | Code evidence |
|---|---|---|
| ViewCommon.id? | S12 :55, S11 :153 | measured `\bid\?:` 0 hits in `irTypes.ts`; control `kind: 'name'` 1 |
| ViewCommon.migratedFrom? | S12 :61 | only in a comment, `irTypes.ts:537` |
| InteractionSpec | S12 :104-113 | comments only |
| FieldSegment value.path?, multiplicity, badge | S12 :83-87 | not in the code FieldSegment union (read in an earlier session; union around `irTypes.ts:164`) |
| edge labels.source / labels.target | S12 :137-139 | code has `sourceEnd`/`targetEnd` (`irTypes.ts:838-839`, R-VP-23) |
| `EndpointExpr` as a type | S12 :44, :127 | code keeps `PathExpr` (`irTypes.ts:745-750`, :783, :786) |
| VertexViewIR.surface | R-FORM-3, R-VP-12 (superseded by R-DMV-7) | measured `surface\??:` 0 hits |
| kinds `graph` and `field` | S11 :141, :144 | code kinds are vertex, graphVertex, edge, row (`irTypes.ts:550`, :648, :769, :863); `field` vs ROW not reconciled in any doc read |
| Shape.icon and form `'icon'` | S11 :179-180 | measured: `^\s*icon\??:` only `irTypes.ts:152` (BadgeSpec); ShapeForm `irTypes.ts:65-66` has no `'icon'` |
| Shape.minWidth / minHeight | S11 :185-186 | measured 0 hits; code has `defaultSize` instead |
| BadgeSpec.color | S11 :215 | measured: `^\s*color\??:` in the IR types at :126, :220, :788 (compiled :1066), none in BadgeSpec (:151-156) |
| RowSource `operations`, `features` (filter), `query` (path) | S11 :234-236 | code `irTypes.ts:180`: `attributes` (exclude), `references`, `children` (filter) |

### 3.2 Same field, different type

| Field | Spec | Code |
|---|---|---|
| shape.border | S11 :182 `Conditional<BorderSpec>` | per-axis `border.{color,width,style}`, each Conditional (`irTypes.ts:219-222`) |
| badges[].position | S11 :212, 5 literals incl. `inline` | 4 literals (`irTypes.ts:77`) |
| badges[].tooltip | S11 :214 `Conditional<string>` | `string` (`irTypes.ts:155`) |
| fieldCompartments[].title | S11 :224 `Conditional<string>` | `string` (`irTypes.ts:197`) |
| LabelSpec.position | S11 :196 / S12 :73, 4 literals | 6 (`irTypes.ts:71`; R-VP-15, R-GV-5) |
| ShapeForm | S11 :179, 6 literals | 11 (`irTypes.ts:65-66`) |
| edge terminations | S12 §7 :134 plain | `Conditional<EdgeTermination>` (`irTypes.ts:794`, slice E) |
| containment.layout | S12 §8 :160 required | optional (`irTypes.ts:689`, GV addendum) |

### 3.3 `irTypes.ts` fields named by no spec doc

Measured this session: a per-key `command grep -c` over the seven spec docs (S11, S12 and the five addenda), with a zsh
array (the earlier unquoted-variable sweep had failed silently, «File name too long»). Positive controls:
`persistWaypoints` 4 in S12, `labels` 5 in S11, `padding` 6/1/7 in TS/FRM/GV. Zero hits, or hits only in unrelated
prose (checked line by line: S11 `curve` = `'curved'` routing :305, :377; S11 `template` = jsxString prose; S12 `curve`
= :135 routing; EDGE `entry` = «entry-point» :54; GV `entry` = «entry and exit points» :196; GV `structure` = prose :165;
FRM `frame` = «framework» :167; S12 and ROW `table` = substrings of `editable`/`rootable`, S12 :77, :84, :90, :120,
ROW :66), for:

`structure` / StructureSpec (`irTypes.ts:513`, :579; R-STR-1), `table` / TableSpec (:449, :592; R-VP-3 superseded,
R-DMV-3), `generated` (:556; R-VP-21), `shape.entry` (:274; R-VP-22), `edge.curve` (:808; R-VP-22), `barThickness`
(:284; R-VP-57), Predicate `simActive` (:56; P-2026-10-19-0930), TextSource `expression` and `caption` (:102; R-EXP-2),
`letterSpacing` (:130) and `textTransform` (:132) (R-VP-20), `source.exclude` (:180; R-VP-20), `literal.style` (:164;
R-VP-20), `edge.labels.template` (:819; R-VP-20; the ROW `template` hits are the row view's own), `EdgeEndLabels` (:736;
slice E, P-2026-09-30-1810), the slice-E terminations (R-VP-24), `cornerRadius` (:247; R-IRN-35), ShapeForm `bar`
(:66; R-VP-16), `underline` (:127; R-IRN-30), `anchor` (:145; R-VP-15; S12 :153 «anchor su Field» is unrelated prose).
Also swept with no hit in any of the seven: the type names `TableSpec`, `StructureSpec`, `EdgeEndLabels`, `EntryMark`,
`EdgeCurve` (control `labels` 5/1/1/0/5/0/0).

Named by a spec but not defined there (corrected from continuation 1's list by this sweep): `authoringMetaclassPins`
(FRM :12), `FieldCompartmentSpec.title` (FRM :187), label `orientation` and the `header` position (GV §2.3 :62-67, defined there), vertex
`visible`/`resizable`/`defaultSize` (GV §2.6 :86-88 «The
`vertex` kind's three keys, with the same types, defaults and validation»), `shape.marker` (TS :127 «precedente:
`marker`, 2026-08-15»), edge `labels.style` (TS §4 :47).

Wrong citation: `irTypes.ts:127` `underline?: Conditional<boolean>; // ir-1.3 addendum sez. 7`; the TS addendum has no
`underline` (measured: 0 hits in all seven docs); source is R-IRN-30 (dec:1425).

### 3.4 Disagreements between sources (reported, not resolved)

1. FormSpec placement: FRM §2 puts `form` on the row view; `RowViewIR` has none (`irTypes.ts:861-881`); `EdgeViewIR`
   has one (:850); `irTabs.tsx:65-66` says «A row view and an edge view carry no `form` in the schema». Three positions.
2. Edge `exclusive`: EDGE D8 (:40) expected MatchingSection widened to the edge branch, `exclusive` included; ratifica
   E-ref R-5 omitted it from the panel.
3. v1.2 incorporates v1.1 §3-§4 by reference (S12 :40, :50), and most of §3.1/§3.2 above is v1.1 base the code moved
   away from without a doc recording it as superseded (none found in the docs read).

## 4. Orphans (panel writes outside the IR)

No control writes an IR key that `irTypes.ts` does not declare. Non-IR writes, all intended: the DViewElement name
(`irTabs.tsx:202`), parenting (`irTabs.tsx:242`, `ViewParentingFields`), the kind-switch stash `irStash`
(`irTabs.tsx:190-191`). Edge «nature» is UI state (EAP:149-153).

## 5. Totals

| Kind | Rows | covered | partial | missing | out of scope | in progress |
|---|---|---|---|---|---|---|
| vertex | 67 | 43 | 12 | 5 | 7 | 0 |
| graphVertex | 52 | 28 | 11 | 9 | 3 | 1 |
| edge | 27 | 6 | 11 | 7 | 3 | 0 |
| row | 11 | 5 | 4 | 0 | 2 | 0 |
| **total** | **157** | **82** | **38** | **21** | **15** | **1** |

Counted on the tables of §1 in this session. Rows sharing a control (border axes, line axes, terminations) count once
per IR path.

## 6. Proposed Phase 2 slices (recommendation only)

`irValidate` counts (measured in an earlier session, `command grep -c` on `IR/irValidate.ts`, 623 lines): letterSpacing 2,
textTransform 2, entry 4, barThickness 4, curve 5, template 5, exclude 5, separator 4, frame 4, cornerRadius 4; control
padding 11; `placement` 0, `caption` 0, `persistWaypoints` 0. `irValidate` has no generic unknown-key whitelist (only
`END_LABEL_KEYS` :282), so a key it does not name is accepted unchecked, not rejected. No slice needs VersionFixer: every
change is additive, and saved IR has no VersionFixer path (R-B9, `irTypes.ts:485`).

| Slice | Content | Risk |
|---|---|---|
| S0 | Defect: FSE:64 drops `literal.style`; spread the segment instead of rebuilding it | UI only, one line, ahead of everything |
| S1 | V-53 literal.style; V-48 source.exclude (and stop `withCompartmentSource` dropping it); V-12 vertex `visible` (copy gV); V-21/V-22 entry, barThickness; E-19 curve; E-22 labels.template; E-23 labels.style; X3 letterSpacing/textTransform | UI only; `irValidate` already names each key |
| S2 | `rulesTable` on the remaining CE mounts: labels/badges/compartment visible, badge icon, TextStyle axes, edge line and ends, gV visible; G-14 gV cornerRadius (also stops the silent overwrite); R-10 row visible add-from-absent | UI only, shared component already supports it |
| S3 | E-21 labels.placement, TextSource `caption`, E-26 persistWaypoints, E-10 edge view label | UI plus `irValidate` (no check today for the first three) |
| S4 | gV parity: G-19..G-24 shape keys, G-33 fieldCompartments, G-44 layout.separator; then G-43 frame once P-2026-11-11-1110 lands | UI only but larger; mounts existing editors in GVAP |
| S5 | Needs decisions first: gV and edge `form` (§3.4.1), edge `exclusive`, `marked` op (R-MK-9, slice M2), multi-hop PathBuilder, Conditional `collapsed.*`, widget-object `editable` | decision-gated |

## 7. Decisions

### Taken (unattended)

1. A CE mount without `rulesTable` is `partial` (§1.0).
2. X1, X2, X3 applied to every Predicate, PathExpr and TextStyle slot; the gV channel is the PathExpr exception.
3. `bar` (R-VP-16) and widget `link` (FRM sez. 14) withheld by decision, so V-13 and V-60 stay `covered` with a note.
4. `irVersion` and `generated` classed `out of scope by decision` from their documented nature, though no decision row
   says «not in the panel» (Question 1).
5. `form.order/labels/hidden`, `hosts.manager`, `table.columns` out of scope by R-DMV-2 (dec ~5329 «I viewpoint
   diagrammatici sono solo sintassi concreta ... nessuna sezione del manager vi appartiene più»), R-DMV-3, R-DMV-4,
   R-VP-14, R-DMV-7 (Question 2).
6. Edge `exclusive` out of scope by ratifica E-ref R-5.
7. gV `form` and edge `form` classed `missing`, not decisions: the irTabs note is a slice note (Question 3, 4).
8. `labels[].orientation` and the `header` position counted on gV only: LEE:158 gates both on `allowHeader`, and the
   vertex panel does not pass it.
9. Rows follow `irTypes.ts` (what the panel can write); v1.1 base keys absent from code are drift (§3.1), not panel gaps.
10. gV `containment.layout.frame` recorded as in progress, its branch not audited.

### Awaiting Alfonso

See the questions below.

## 8. Absence claims: searches and positive controls

All measured with `command grep` (BSD) at `bb7821a10`, in the earlier sessions of this lane unless marked.

| Claim | Search | Result | Positive control |
|---|---|---|---|
| no vertex `visible` control | `command grep -c -E 'draft\.visible\|visible:'` VAP | 1 = comment :745 | `padding` 4, `marker` 10 in VAP |
| no vertex entry / barThickness control | `entry`, `barThickness` in VAP | `entry` = loop var :277-281, comment :611; `barThickness` 0 | same |
| no gV padding/marker/barThickness/text/badges/compartments | `padding`, `marker`, `barThickness`, `<TextStyleField`, `<BadgeListEditor`, `<FieldCompartmentListEditor`, `<StructureGroups`, `<FormAuthoringBody` in GVAP | 0 each | `<LabelListEditor` :458, `<MatchingSection` :280 |
| no frame / separator control | `frame\|separator` in CS and gVA | exit 1 | `padding` 2 (CS), 9 (gVA) |
| no `exclude` / `literal.style` control | `exclude` in FCL, FSE | 0 / 0 | `style` 12 / 1 |
| no letterSpacing / textTransform control (this session's handoff) | `letterSpacing\|textTransform` over `A/*.ts*` | 0 | `fontWeight` TSF 1, TST 2 |
| no edge curve / template / labels.style / label / placement / persistWaypoints control | `edge\.curve\|curve:\|'arc'`, `labels\.template\|template:`, `labels\?\.style`, `draft\.label`, `placement`, `persistWaypoints` in EAP | 0, 0, 0, 0, comment :512 only, comment :158 only | `labels\?\.center` :505, :891 |
| no `caption` control | `caption` in `A/` | preview captions only (SymbolEditorModal.tsx:21-570, previewInstances.ts, SymbolBoxPreview.tsx) | read, not a grep control: the expression `slot` control TSE:77-84 |
| no form order/labels/hidden/hosts write | `next.order`, `next.labels`, `next.hidden`, `hosts`, `manager` in FAB | 0 each; `.order` 1 = `pruneForm` :143 | `widgets` writes FAB:540, :578 |
| spec keys of §3.3 (this session) | per-key `command grep -c` over seven docs, zsh array | see §3.3 | `persistWaypoints` 4 (S12), `labels` 5 (S11) |

## Dependencies and risks

- Lane P-2026-11-11-1110 (worktree `~/jjodel-w-gvframe`) touches CS/gVA for `frame`; S4 should start after it lands.
- S2 touches CE call sites in many editors: a shared visual regression surface (Symbol Editor modal, TextStyle popover).
- G-14 is a silent overwrite of a persisted Conditional, worth folding into S0 if the reader agrees.
- Line numbers from the earlier sessions were read at the same HEAD; reread before a Phase 2 diff.

## Questions

1. Confirm `irVersion` and `generated` stay out of the view panel. Recommended: yes, record it as a one-line decision row.
2. Confirm `form.order/labels/hidden`, `hosts.manager`, `table.columns` are out of the view panel by R-DMV-2/3/4/7. Recommended: yes.
3. Is gV `form` a gap to fill or a decision to keep it out? Recommended: decide in S5, keep `missing` until then.
4. Which schema holds for `form`: FRM §2 (row view), `irTypes.ts` (edge view), or irTabs.tsx:65-66 (neither)? Recommended: settle it before any edge or row Form tab.
5. Has the R-VP-16 freeze ended, so `bar` can enter the shape Select? Recommended: check with the freeze owner, no change until then.
6. Should edge `exclusive` enter the panel (EDGE D8 vs ratifica E-ref R-5)? Recommended: keep the ratifica until the resolver gives edges `exclusive` semantics.
7. Fix the FSE:64 `literal.style` loss (S0) as its own lane before S1? Recommended: yes, with G-14.
8. Are the v1.1 base keys absent from code (§3.1, §3.2) superseded, and where should that be recorded? Recommended: a spec erratum against v1.2 §3-§4.
9. Open multi-hop PathBuilder and the `marked` op as panel slices, or leave them to slice M2? Recommended: leave to M2.
10. Should `collapsed.*` and widget-object `editable` get Conditional / widget authoring? Recommended: only on a user request.

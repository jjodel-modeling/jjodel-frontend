# Phase 2 report: slice A4, the ER (Chen) notation
Prompt-ID P-2026-09-30-0440 · `docs/prompts/claude_2026-09-30_0440_prompt_a4_er_chen.md` · Chat C-2026-09-29-2230 · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, on the A1+A3 tip (`74995f429`, `6daba2e7f`, HEAD `47a7cceb1`) · executor Anthropic Claude Opus 5.5. [M] measured in this lane, [R] read.

## 0. Answer in brief
- **«ER (Chen)» added, the seventh notation** (code `7c2593c85`) [M]: no simulation profile; its table offers Entity,
  Relationship, Attribute, Key, prefilled by the new pure module `derive/erSignals.ts`. The six other notations derive the
  A1+A3 tip's documents byte for byte: 54 digests on the fixtures and the same 54 on the decoded exports.
- **Drawn from IR data plus two optional keys** (R-VP-23): the relationship is a `diamond` vertex view, so its object stays
  a node and its M1 reference edges stay on the canvas, styled by reference-as-edge views (no termination, the `arc` of
  R-VP-22): plain lines. `edge.labels.sourceEnd?` / `targetEnd?` (TextSource) carry the marks, anchored by
  `computeCardinalityAnchor`, in the halo style of `edge.labels.style`. No other key was needed.
- **Prefill on the three ERD exports** [M]: ERDLanguage ERD {Entity, Attribute, Relationship}, MDE ERD ×2 {Entity, Attribute,
  Relation}; Relational {Table, Column, ForeignKey}; Library and the four demos nothing (ER cannot be derived there).
- **ERDLanguage ERD as Chen, in the browser** [M]: 3 rectangles, 2 diamonds, 7 ellipses; `id2` and `id3` underlined (their
  `isKey`); 11 lines, no marker; marks `1`/`N` on `hasRole` (OneToMany) and `N`/`M` on `shares` (ManyToMany), each within 20
  flow px of its entity. The enum is compared by literal name: the L-proxy backend gives it.
- **MDE ERD as Chen** [M]: attributes held by composition keep the C rows inside the rectangle (Student `id : String`,
  `name : String`), relations diamonds with plain lines, no mark (no cardinality in that metamodel). Chen's ellipses for
  contained attributes are out of this slice (R-VP-23 (5)).
- **Default viewpoint** [M]: the four demo scenes 0 px from the A1+A3 tip's shots left of the rail, the Jodie launcher aside.
- **Gates** [M]: typecheck 14 (the §17 set); vitest 6144 passed (6093 + 51), the 9 known files red at import; build exit 0;
  mutation bench 56/57, the survivor equivalent; lane probe 27/27 on 3078.

**Decisions awaiting Alfonso** (RC-26): none. R-VP-23 is written under the delegation of 2026-09-29 evening and amends no row.

**Questions**
1. The M1 objects keep the default grid placement, so the Chen lines of ERDLanguage cross (the crops). A Chen layout (the
   relationship between its two entities, the attributes around their owner) is a layout lane, not a notation's.
   Recommended: leave it to a layout lane after the freeze.
2. The dialog's source changed by type only (`RoleId` → `NotationRoleId`, 5 lines), to hold the ER roles; the prompt allowed
   the dialog «only to list the new entry». Recommended: accept; listing needed no change, the type did.

## 1. Layer Impact Report (written before the first source edit)

Base: the notation discovery §1 rows 9 and 22, §2, §3 (`ee7206d0c`), R-B9, R-IRN-32, R-IRN-33, Rule 11,
R-VP-15..22, the A1+A3 report. Read: `irTypes.ts` (EdgeViewIR, the two substrates), `irCompile.ts`
(`compileEdgeView`, `compileTextSource`, the predicate `eq`), `irValidate.ts`, `irEdgeViews.ts`
(`decorateReferenceEdges`, `applyEdgeStyle`), `irResolveCore.ts` (`resolveEdgeView`: priority, then
specificity, a named `reference` +0.5), `useIRContainment.ts:166` (the reference pass is wired),
`UnifiedEdge.tsx` (the cardinality badge `:502`, the label portal, the arc), `edgeUtils.ts:1091`.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   -- irEdgeViews (two data keys), UnifiedEdge (two end labels)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the saved IR only: two optional keys; no VersionFixer, no jsxString
```

**How Chen is drawn with IR data.** The relationship is a vertex view (a `diamond`), so its object stays a
node and its M1 reference edges (`left`, `right`, `instanceRef`, `data.referenceName`) stay on the canvas,
as they do in the default viewpoint. They are styled by reference-as-edge views, the substrate the IR has
had since Fase 2c (`EdgeViewIR` without `source`/`target`, keyed on the SOURCE metaclass, `reference`
naming the feature): `terminations: none/none`, a 1 px line in the ink, `curve: 'arc'` (R-VP-22) so the
line runs between the handle centres, straight, with no router. An attribute that is a node (ERDLanguage's
`Attribute`) is an `ellipse` vertex view, and the owner's reference to it (`ownedAttributes`) is styled the
same way. The key is `TextStyle.underline` (ir-1.3, existing) as a Conditional on the key flag. No key is
added for any of this: the only new keys are the two end labels.

**Persistence (the saved `DViewElement.ir`).**
- What changes: two optional keys, spelled once and for good (R-B9, no VersionFixer for IR views):
  `EdgeViewIR.edge.labels.sourceEnd?: TextSource` and `EdgeViewIR.edge.labels.targetEnd?: TextSource`,
  styled by the same `edge.labels.style` as the centre label (R-VP-20 (5)). The derivation writes only
  `targetEnd` (the entity's end of a relationship line). The `_state` value `derivedNotation` and
  `ir.generated.notation` gain `erChen`; `derivedRole_<classId>` and `ir.generated.role` gain `entity`,
  `relationship`, `attribute`, `key`.
- What does NOT change: every key already persisted, `irVersion` (no bump, R-IRN-32), `structuralHash`
  and `irHash` of every IR without the keys (the compile adds the two accessors to its output only when
  declared, so the compiled key lists pinned by C2 stay as they are).
- Cross-layer: none; the IR is read by the compile, the index and the renderers only.
- Safety: absent keys render today's output byte for byte; a value that is not a text source renders as
  absent (the permissive render of R-B9-bis) and is refused by `validateIR`.

**Canvas v2-flow.**
- What changes, only where a key is present: (1) `irEdgeViews.applyEdgeStyle` writes `irSourceEndText`
  and `irTargetEndText` on the edge data, the resolved text, only when the view declares the key;
  (2) `UnifiedEdge` draws each non-empty one in the label portal, anchored by `computeCardinalityAnchor`
  (`edgeUtils.ts:1091`) at its end: the target end from the target point and side, the source end from the
  source point and side over the reversed points; for an arc the points are the arc's two ends (the handle
  centres), otherwise the drawn polyline, as the classic cardinality. Styled: the halo span of R-VP-20 when
  `irLabelStyle` is present, else the classic `edge-cardinality` badge. No SCSS change.
- What does NOT change: an edge without the keys (the portal condition gains `|| endLabelsVisible`, false
  for it; the two data keys are not written), the classic cardinality badge of M2 references,
  `portDistribution.ts`, `handlePosition.ts`, `DynamicHandles.tsx`, the classic canvas, the default notation.
- Cross-layer: none; the edge data is built per render by the decoration pass.
- Safety: the demo scenes in the default viewpoint render no IR view; measured below.

**Derivation (pure, `viewpointDerivation.ts`, `notations.ts`, new `erSignals.ts`).** A notation «ER (Chen)»
added to the list, with no simulation profile: its table offers four class roles, prefilled by the name
and structure signals of discovery §3. With no role on a class, that class keeps its Generic document.
Every other notation keeps its documents byte for byte (pinned below). The dialog's source changes by type
only: its role type widens from the simulation `RoleId` to the notation's (`RoleId` or an ER role), so the
table can hold the ER roles; it lists the new entry by mapping `DERIVED_NOTATIONS`, as before.

Smoke-test scenarios potentially affected:
- the four demo scenes in the default viewpoint, pixel-identical to the A1+A3 tip;
- every notation but ER (Chen) on the four demos and the ERD corpus, documents byte-identical to the tip;
- save → reopen of a derived viewpoint: the two keys round-trip as JSON (tested).

## 2. Measures

**Bench (vitest, node)** [M]. New `derive/__tests__/erChen.test.ts` (29), `ir/__tests__/irA4Keys.test.ts` (11),
`ir/__tests__/irA4Render.test.ts` (11); `notations.test.ts` and `DeriveViewpointDialog.test.ts` take the seventh entry. Red
first on the tip: 36 of the first 48 red (the three kill tests of the bench came after); green there only the tip pins and the pure signal tests (erSignals.ts had no caller yet).
Pins read on `47a7cceb1` before any source edit: the 54 documents of the six other notations on the nine corpus metamodels
(four demos with their applied binding, ERDLanguage ERD, Relational, Library, MDE ERD ×2) and the markup of four edges
without the keys (`dd74aa35ed4c82b5` a Chen line, `976256cd76a69d41` a diagonal one, `247b8c99275387f5` an orthogonal IR
edge with a centre label, `48bb31a6dd4bebda` an M2 reference with its cardinality badge).

**Decoded exports** (`frontend/scripts/smoke/_tmp_a4_real.ts`, gitignored, the C1 decode's data) [M]: `PIN` lines, 54 on the
tip and 54 after, `diff` empty; the Chen prefill and documents as in §0, 0 invalid; positive control (two digests differ).

**Mutation bench** (`frontend/scripts/smoke/_tmp_a4_bench.mjs`, gitignored) [M]: 56/57 killed, controls green before and
after (410 tests). Mutants: compile (either end dropped, ends swapped, any source, no deps), validator (ends open, literal and
intrinsic unchecked), edge data (no end, always, source written as target), UnifiedEdge (keys on classic edges, RF points for
an arc, source path not reversed, source at the target, gap 0, no halo, portal not mounted, portal always), signals
(composition only, no `type` needed, relationship by name only, entity first, key as substring, key outside attributes, flag
of any type, ends in declaration order, literal sides swapped, `one` unread, no slot per end), derivation (entity rounded,
medium name, no compartments, name always centred, relationship rect, attribute rect, no key underline, key class plain,
arrowed line, no arc, rows keep their role, no lines, lines to anything, never `M`, marks priority 0, marks at the source
end, marks unstyled, `M` priority 1, many without `exists`), notations (not listed, no roles, no signals, `canDerive` on the
profile, Generic documents, raw role label, no provenance role). The first run left seven survivors: five test gaps, closed
(a word holding `id` inside it, a key word outside the attributes, a string `idCode`, ends declared `to` then `from`, the
source end on a diagonal) and one equivalent under the order of the documents, removed by declaring `N` before `M` so the
priority decides. Survivor: `edge-empty-draws`, `(text) || undefined` against `(text)`, equivalent: every reader tests
truthiness and `''` renders nothing.

**Lane probe** (`lane-run probe`, port 3078, light, 1600×1000, DPR 2; `_tmp_a4_probe.ts` with `_tmp_a4_erdl.js`, log
`~/.jjodel-lanes/probe-2026-09-30/probe-_tmp_a4_probe.log`, EXIT=0, 27/27) [M]. The A1+A3 procedure: the C1 scenario's four
demos, MDE ERD (`_tmp_c1_erd.js`) and the C2 ERDLanguage built first, then the A4 ERDLanguage ERD with its `Type` and
`Cardinality` enums and the export's People model. No simulation bag is written.
- Default scenes `first` against the A1+A3 tip's `first`: 0 px left of the rail (x 1970) on all four; the rail differs
  (2641 px, the same on each: the rail's content) and the Jodie launcher (2441 px, masked); control SM against Petri 348100 px.
  `after` against `first`: 0 px left of the rail, the rail changed by the derivations (384779 px).
- The dialog on ERDLanguage ERD: seven notations, ER (Chen) last; rows Entity `entity`, Attribute `attribute`,
  Relationship `relationship`, NamedElement empty; note «Prefilled from the names and the structure.» 11 views, all `erChen`.
- Chen DOM: rectangles `4px`, ellipses `50%`, diamonds; names 14 px 600 `rgb(15, 23, 42)` on entities, 13 px 500 on the
  others; `text-decoration-line: underline` on `id2` and `id3` only; 11 edge paths 1 px `rgb(15, 23, 42)`, no
  `marker-start`/`marker-end`; end labels `1`, `N`, `N`, `M`, halo, 12 px 500 `rgb(100, 116, 139)`, nearest nodes Person
  11.5, Role 18.5, Person 13.5, Car 18.5 flow px.
- Generic on ERDLanguage ERD: no end label. MDE ERD as Chen: Student, Course, Professor rectangles with their rows, enrolls and
  teaches diamonds, 4 lines without markers.
- No page error. The source edit after the probe (the order of the `M` and `N` documents from slots) touches no document of
  the probe's metamodels, whose marks come from an enum or do not exist.
- Crops (`frontend/scripts/smoke/_tmp_a4_crops/`, gitignored): `a4_erdl_erChen_600.png`, `a4_erdl_erChen_all_600.png`,
  `a4_erdl_generic_600.png`, `a4_erdl_generic_all_600.png`, `a4_mde_erChen_600.png`, `a4_mde_erChen_all_600.png`,
  `a4_mde_generic_600.png`, `a4_mde_generic_all_600.png` (the `_all` ones zoomed out to 60 %: the fit control is retired).

**Read on the crops, not measured**: the objects keep the default grid placement, so on ERDLanguage the relationships sit
under the attributes and their lines cross (question 1); the diamonds are content-sized, small against the mockup's 120×64,
as A3's.

## 3. Lane choices (inside the prompt)
- The table holds the four class roles; the key flag and the cardinality are feature signals read on the classes the table
  binds, not rows of it (the table is metaclass → role).
- The entity signal takes a multi-valued plain reference as well as a composition, and the word `entity`: ERDLanguage's
  `ownedAttributes` is not a composition, and its Entity would otherwise have no role. Words are matched from their start
  (camel case and `_` split, R-VP-19), so `Valid`, `ValidatedValue`, `Correlation` take no role.
- A relationship holding attributes stays a relationship; a key class must sit under an attribute class.
- A class with no role, and a class the Generic notation draws as a row, keep their Generic document; an entity keeps
  Generic's compartments, its name then on top.
- The marks go at the entity's end (`targetEnd` of the relationship → entity line); per reference, one document per mark,
  the literals giving the same mark joined by `or`; a literal whose sides are not both read gives no mark for that side.
- The enum is compared by literal name, what the L-proxy backend (production, `IR_READ_BACKEND`) gives; the draw backend
  would read the literal's pointer, stated in the test's read context.
- End labels anchored at the arc's ends (the handle centres) with the chord as path, else at the handle point with the drawn
  polyline; the source end reads the path backwards.

## 4. Files (Rule 19: 14 files, all in the prompt's DOVE or their tests)
`irTypes.ts` (the two keys, the compiled accessors), `irCompile.ts` (compiled only when a text source), `irValidate.ts` (the
vocabulary), `irEdgeViews.ts` (`irSourceEndText`, `irTargetEndText`), `UnifiedEdge.tsx` (the end labels, gated),
`viewpointDerivation.ts` (`deriveChenViewpointIRs`), `notations.ts` (the entry, the roles, the prefill, the documents),
`erSignals.ts` (new), `DeriveViewpointDialog.tsx` (the role type); tests `erChen.test.ts`, `irA4Keys.test.ts`,
`irA4Render.test.ts` (new), `notations.test.ts`, `DeriveViewpointDialog.test.ts`. `edgeUtils.ts` is used, not changed
(`computeCardinalityAnchor` as it is). `portDistribution.ts`, `handlePosition.ts`, `DynamicHandles.tsx`, the sync hooks
untouched.

## 5. Files read (under `/Users/alfonso/jjodel-w-notations/`)
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (P16), `docs/decisions.md` (RC-20..34,
R-VP-15..22), discovery `ee7206d0c` (whole), the A1+A3 report, the mockup `er-A-chen.svg`; `irTypes.ts`, `irCompile.ts`,
`irValidate.ts`, `irEdgeViews.ts`, `irResolveCore.ts`, `irReadCtx.ts`, `irReadCtxLproxy.ts`, `edgeEndpoints.ts`,
`UnifiedEdge.tsx`, `edgeUtils.ts` (the cardinality anchor, the arc), `shapeRegistry.ts` (content sizing), `notationCatalog.ts`
(the ER presets), `viewpointDerivation.ts`, `notations.ts`, `DeriveViewpointDialog.tsx`, `utils/deriveViewpoint.ts`,
`metamodelSketch.ts`, `profileBinder.ts` (`SKETCH_TYPE`), `roleCatalog.ts`, `LModelElement.tsx` (the enum value getter) and
`joiner/classes.ts` (a proxy's `toString`); their tests.

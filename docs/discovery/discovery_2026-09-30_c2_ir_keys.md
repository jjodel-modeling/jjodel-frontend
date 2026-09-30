# Phase 2 report: slice C2, the text and edge-label IR keys of the generic notation
Prompt-ID P-2026-09-30-0150 · `docs/prompts/claude_2026-09-30_0150_prompt_c2_ir_keys.md` · Chat C-2026-09-29-2230 · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, on the C1 tip (`3ed86119f`, `ddfb24dc1`, HEAD `3ec98d486`) · executor Anthropic Claude Opus 5.5. [M] measured in this lane, [R] read.

## 0. Answer in brief
- **The five keys are in, optional, and absent changes nothing** [M]. `TextStyle.letterSpacing` (number, em) and `textTransform` (`uppercase | lowercase | none`), `exclude` on the `attributes` source, `style` on a `literal` segment, `edge.labels.template`, `edge.labels.style`. The irHash of 59 fixture views (3 factory defaults, 56 catalogue presets), the compiled key lists of the defaults and three render digests are the ones measured on the C1 tip before any edit.
- **The generic notation uses them** [M]: the eyebrow is the metaclass name as written, uppercased by `textTransform`, 0.08 em (0.8 px at 10 px in the DOM); the name slot draws no row (7 name rows on the corpus down to 0); the four edges C1 left unlabelled get a template (Arc, InhibitorArc, ControlFlow, Relationship: 5 labelled edges to 9); every labelled C edge draws the halo label (12 px, 500, `rgb(100, 116, 139)`, text-shadow in `rgb(241, 245, 249)`, no box).
- **Default viewpoint unchanged** [M]: on the four demo scenes, 12 of 12 shots pixel-identical to the C1 tip outside the Jodie launcher, 7 of them byte-identical; the other 5 differ only inside the launcher (2086 px each), whose pulse glyph animates between runs; positive control 744873 px.
- **Gates** [M]: typecheck 14 errors, the §17 set; vitest 5990 passed, the 9 known files red at import; build exit 0; lane probe 46/46 on 3072; mutation bench in §2.
- **One semantic the prompt did not name, taken in the lane** (§4, Q1): in a template, a value that resolves empty takes with it the literal right before it (its caption), so `weight = ` with no weight draws nothing and `«InhibitorArc»` stays.

Recommended: merge after the chat's visual check of the crops (§3); Q1 as taken.

**Decisions awaiting Alfonso** (RC-26): none new; R-VP-20 is written under the delegation of 2026-09-29 evening.

**Questions**
1. Keep the caption rule of `edge.labels.template` (§4 (1))? Recommended: yes; the alternative, plain concatenation as a row view, draws `guard = ` on 7 of the 9 DemoFlowB flows and `weight = ` on 3 of the 5 Petri arcs of the demo scenes.

## 1. Layer Impact Report (written before the first source edit)

Base: the notation discovery §2 (`ee7206d0c`), R-B9, R-IRN-32, R-IRN-33, Rule 11, the TextStyle addendum (TS3).

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)  -- the saved IR only: no VersionFixer, no jsxString
```

**Persistence (the saved `DViewElement.ir`).**
- What changes: five optional keys become legal in a saved IR, spelled once and for good (R-B9, no VersionFixer for IR views): `TextStyle.letterSpacing` (number, em) and `TextStyle.textTransform` (`'uppercase' | 'lowercase' | 'none'`); `exclude` (string[]) on the `attributes` compartment source; `style` (TextStyle) on a `FieldSegment` of kind `literal`; `edge.labels.template` (TextSource[]); `edge.labels.style` (TextStyle).
- What does NOT change: no existing key is renamed, removed or retyped (Rule 11: optional additions only); no `irVersion` bump; no migration (R-IRN-32); `irDefaults.ts` untouched, so the factory default views and `structuralHash`/`isMigratedDefaultView` (R-IRN-33) read the same bytes; `irHash` unchanged (same function, same input for an IR without the keys).
- Cross-layer interaction: the keys reach the canvas only through `compileView` / `compileEdgeView` (cached by `irHash`, so an IR carrying a key compiles apart from one without).
- Side-effect safety: an IR without the keys stringifies to the same bytes, hashes to the same value and compiles to the same compiled shape (no new compiled field is set when the key is absent). The authoring `setAxis` spreads the previous style, so an authored edit keeps the new axes.

**Canvas v2-flow.**
- What changes: `resolveTextStyle` emits `letter-spacing` and `text-transform` when declared (labels, compartments, dispatched rows, the node text root); a slot-mode `attributes` compartment drops the rows named in `exclude`; a literal segment with a style gets it inline on its span; an edge view with `labels.template` draws the concatenated template as its centre label (it wins over `center`); an edge view with `labels.style` draws the centre label without the box, with a halo in the canvas surface colour, 12 px 500 in the quiet ink by default, the authored axes inline (TS3 colour precedence: `style.color` > `line.color` > the class default; markers keep `irStroke`).
- What does NOT change: an absent key leaves the markup exactly as today (same class list, no `style` attribute where there was none); the classic label box (`.edge-label__text`, `EditorV2.scss:2825-2827`) is untouched; no handle, route, port or size computation changes (`irEdgeViews.ts` builds the same synthetic edges, with one more optional key on `data`).
- Cross-layer interaction: `irEdgeViews.applyEdgeStyle` resolves the edge label style to CSS on `e.data.irLabelStyle`, read only by `UnifiedEdge`'s IR-gated branch (`data.irEdgeViewId`). `resolveTextStyle` moves from `IRNodeContent.tsx` into the pure `irCompile.ts` so the pure `irEdgeViews.ts` can call it; `IRNodeContent` re-exports it under the same name (Rule 2), so `IRRow`'s import is unchanged.
- Side-effect safety vs other layers: no D-layer write, no L-proxy read or write, no sync hook, no `DVertex.new` / `DVoidEdge.new*`, no TRANSACTION. §3.10 not involved (no port distribution change).

**Derivation (`viewpointDerivation.ts`, not a layer of the template).** The generic notation (R-VP-19) writes the keys: the eyebrow as the metaclass name as written with `letterSpacing: 0.08`, `textTransform: 'uppercase'`; the slot rows `exclude: ['name']` on a class holding the identity slot; the four edge classes whose label is not expressible today get a template, and every labelled C edge the halo style. The role-keyed paths (R-VP-15..18) are unchanged byte for byte (digests pinned since C1).

**Smoke-test scenarios potentially affected.**
- The four demo scenes in the default viewpoint: nothing they render reads a new key, so byte-identical to the C1 tip (`ddfb24dc1`): measured by the lane probe, §3.
- «Derive viewpoint» with no role bound on the four demos and MDE ERD: the eyebrow, the edge labels and their halo change by design; crops in §3.
- Save and reopen: the keys survive a JSON round trip byte-identical (test, §2).

Uncertain about propagation: nothing left open; the one move (`resolveTextStyle`) is a pure function with one caller outside its file (`IRRow`), kept working by the re-export.

## 2. Tests
Written before the code and run on the C1 tip first: 44 red, the absent-case pins green once measured there (the irHash of the 59 fixture views, the compiled key lists, the markup digests `9f12c7a3feb02830`, `d2fb1fbf4d9180a1`, `880239314d2453e0`) [M].
- `ir.test.ts`: the pins; a round trip of a vertex and an edge carrying every key (byte-identical JSON, same irHash, `validateIR` ok); each key moves the irHash; compile and resolve of each key present and absent, permissive on values outside the vocabulary; the template (wins over `center`, the caption rule, literal-only, malformed falls back); `irEdgeViews` writes `data.irLabelStyle` only when declared, `{}` for an empty style.
- `irValidate.test.ts`: each key accepted on every surface it can sit on, and refused with a wrong type (a string or a Conditional spacing, `capitalize`, `exclude: 'name'` or on another source, a non-object literal or edge style, an empty or malformed template); an IR without the keys validates as before.
- `irC2Render.test.ts` (new, the `irCollapsedRender` bench): `IRNodeContent` and `UnifiedEdge` rendered with `renderToStaticMarkup`, joiner and write-back mocked, React Flow's portal rendered in place. Present and absent for each key; the absent markup is the C1 tip's by digest; TS3 colour precedence (`style.color` over `line.color`, the arrowhead keeps the line colour).
- `viewpointDerivation.test.ts`: the C1 counts updated (9 labelled edges, 0 name rows), the eyebrow as written with its two axes, the four templates, the halo style on every labelled edge, the sub-edge forms, the exclude only where the identity slot is, and the templates executed (`weight = 2`, `«InhibitorArc» weight = 3`, `guard = model.[count] < 2`, an unset guard no label, an unset inhibitor weight `«InhibitorArc»`).
- Mutation bench (`frontend/scripts/smoke/_tmp_c2_bench.mjs`, gitignored; each mutant one string in one source file, the four test files run, the original bytes written back from memory): **43/43 killed**, no survivor, controls green before and after (335/335). Per key: (1) spacing and case 7 (emit, unit, finite guard, compile, vocabulary); (2) exclude 3 (compile, source guard, render); (3) literal style 3; (4) template 6 (ignored, `center` wins, the caption rule three ways); (5) label style and halo 6 (compile, key always written, empty style dropped, halo class, TS3 precedence, IR gate); validator 7; derivation 11. The list is in the `feat` commit body.

## 3. Measures
- **Gates** [M] on the final tree: `npm run typecheck` exit 2, 14 errors, the §17 set by file and code; `npx vitest run` 5990 passed of 5990 (5942 at the C1 tip + 48 new), 235 files, the 9 known red at import; `npm run build` exit 0, the chunk-size warning only; `check:scripts` PASS (50 files).
- **Lane probe** [M], `lane-run probe` on 3072, light, 1600×1000 at DPR 2, log `~/.jjodel-lanes/P-2026-09-30-0150/probe-_tmp_c2_probe.log`. Baseline `base1` on the C1 tip code (7/7, EXIT=0), then the final code `after2` 46/46, EXIT=0. The scenes: the four demos (bags empty) built by the C1 scenario, MDE ERD, and ERDLanguage ERD (`_tmp_c2_erdl.js`, added to see the exclude and a fourth template on screen).
  - Eyebrow on every drawn node of the six scenes: textContent the class name as written, rendered text (`innerText`) uppercase, `letter-spacing: 0.8px` (0.08 em at 10 px), `text-transform: uppercase`, 10 px, 600, `rgb(100, 116, 139)`; the name label 14 px 600 `rgb(15, 23, 42)`, `letter-spacing: normal`.
  - Edge labels: DemoPEST and DemoESM `coin`, `push`, `stop`; DemoPetri `weight = 2` twice (a2, a3; a1, a4, a5 have no weight and no label) and `«InhibitorArc»` (i1 has no weight); DemoFlowB `guard = model.[count] < 2` and `guard = model.[count] >= 2` (the seven unguarded flows unlabelled); MDE ERD `enrolls`, `teaches`; ERDLanguage `cardinality = N:M`. Every one with the halo class, background `rgba(0, 0, 0, 0)`, 12 px, 500, `rgb(100, 116, 139)`, text-shadow in `rgb(241, 245, 249)` (the light `--canvas-bg`).
  - Rows: ERDLanguage Attribute `id` shows `type = String`, `isKey = true`, no `name = id` row; DemoPetri `p1` still `tokens = 2` in IBM Plex Mono 11 px quiet.
  - Default viewpoint, four demo scenes, three shots each (fresh, after an empty-viewpoint round trip, after the derived round trip): 12 of 12 with 0 differing pixels outside the Jodie launcher's rect `[26,1620,130,1724]` (shot pixels, measured from the DOM); 7 byte-identical, 5 differing by 2086 pixels inside the launcher only. Cause, measured on the first run: the launcher's pulse glyph is caught at another frame (crop `_tmp_c2_crops/zoom_jodie_sm_first.png`); the canvas does not read a C2 key. Control (P12): the same diff on two different scenes counts 744873 pixels outside the mask. MDE ERD and ERDLanguage are measured, not checked (not demo scenes).
  - Crops (`sips -Z 600`, gitignored): `frontend/scripts/smoke/_tmp_c2_crops/c2_{sm,petri,esm,flowB,erd,erdl}_derived_after2_600.png`, and the C1 tip's derived views beside them as `c2_*_derived_base1_600.png`.
- **Deviation, recorded**: the first full vitest run of the lane wrote its output to `/tmp/claude-501/c2_vitest.txt`, outside the worktree; moved into `frontend/scripts/smoke/_tmp_c2_logs/` at once, nothing else written outside.

## 4. Decisions taken in the lane
1. **The caption rule of `edge.labels.template`.** A value segment (path, intrinsic) that resolves empty draws nothing and takes with it the literal right before it; a literal elsewhere stays; a template left with no text draws no label, as an empty `center` path. Found by the first post-change probe: with an «every value empty, no label» rule the unset inhibitor lost its stereotype; with plain concatenation the demo scenes draw `guard = ` seven times and `weight = ` three times. Question 1.
2. **Scalars.** `letterSpacing` and `textTransform` are plain values, as the prompt names them, while the other TextStyle axes are Conditional; compiled through the same helper, so a later widening to `Conditional` is additive and changes no renderer.
3. **`exclude` governs the symbol only** and sits on the `attributes` source only (the validator refuses it elsewhere); the form host keeps every feature (R-FRM-1, `FormSpec.hidden` is the form's channel).
4. **The halo.** `.edge-label__text--halo` in `EditorV2.scss`: 12 px, 500, `var(--color-inode-quiet)` as the defaults, no background or padding, `text-shadow` 2 px and 4 px in `var(--canvas-bg)`, the codebase's halo idiom (the Petri bar, `irStyle.ts:215`) rather than `paint-order`, which paints the stroke over the text where it is not supported. The derivation writes the three axes too, so its label does not depend on the class defaults.
5. **`resolveTextStyle` moved to `irCompile.ts`**, so the pure `irEdgeViews.ts` resolves the edge label style where the read context is; `IRNodeContent` re-exports it, `IRRow` untouched. `IRRow` is in the prompt's DOVE but needed no change: the literal-segment style is the `FieldSegment` of `irTypes.ts:128`, rendered by `IRNodeContent`, not a row view's `TextSource`.
6. **Derivation.** The sub-edge template is `«Name»` then the caption and value of its reference or first slot, the space in the caption, so an unset value leaves the stereotype alone; a reference wins over a slot, as in C1. `exclude: ['name']` only on a class holding the identity slot.

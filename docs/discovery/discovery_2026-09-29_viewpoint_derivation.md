# Discovery: deriving a viewpoint (concrete syntax) from a metamodel into the view IR

Prompt-ID P-2026-09-29-0111 · `docs/prompts/claude_2026-09-29_0111_prompt_discovery_viewpoint_derivation.md` · Chat C-2026-09-28-1936 · session `d3d5b593-8e5e-480f-bd87-674f4c343f14` · tree `~/jjodel-w-viewgen`, branch `viewpoint-derivation`, HEAD `f55571b41` · executor Anthropic Claude Opus 5.5. A set of hypotheses with evidence, not a reference: whoever uses it rereads the files. [M] = measured in this phase on `f55571b41`, [R] = read.

## 0. Answer in brief

- **Yes: the deterministic derivation (Phase 2, no Jjodie) can be built now, additively, without touching a §3.1 file.** A gitignored prototype run under `npx tsx` derived one IR document per concrete class of the four demo metamodels: 22 views (17 vertex, 5 edge), **22/22 pass `validateIR`**, and replaying the resolver's ordering picks each class's own view 22/22. [M]
- **Fields filled deterministically.** Structure alone: 150 fields (6.8 per view). With the roles bound: 179 (8.1 per view: 115 from structure, 64 from roles). Slots left to Jjodie drop from 68 to 53 (3.1 to 2.4 per view). A field is one authored key of the provenance map; the constants `irVersion`, `kind` and `label` are not counted. [M]
- **Edges (d).** Structure alone recognises every edge class of the demos, 5/5. PEST and ESM `Transition` sit in `State` with one reference back into its hierarchy, giving source `'container'` and target `$nextState.value`. Petri `Arc` and `InhibitorArc`, and FlowB `ControlFlow`, have two single-valued non-containment references into one hierarchy. When roles are bound they give the same endpoints. [M]
- **Roles.** None of the four exports holds a binding: `_state` is `{}` on every metamodel and no `"sim*"` string appears [M]. The prototype built one with the existing pure `bindProfile(profile, sketchOfMetamodel(...))`. With it, 15 of the 17 vertex views get a preset from `notationCatalog.ts` (Initial, Terminal, the Fork/Join bar, Place, the Petri transition). FlowB `Decision` gets `node` and so a rounded box: its diamond can come only from its name, which is Jjodie's job. [M]
- **Priority (b) is not needed to make a subclass view beat its superclass.** The resolver already ranks an exact match above an inherited one (`irResolveCore.ts:297-303`). It also compares priority *before* specificity (`:68-70`), so a depth-based priority would beat any view the author later adds at priority 0. [R]
- **Provenance (e) works additively, on an existing precedent.** `migratedFrom` and `migratedHash` already live inside `ir` without being declared in `irTypes.ts`, and a structural hash tells an untouched view from an edited one (`irDefaults.ts:280-305`). A `generated` key passes `validateIR` [M]. Authoring edits spread the draft, so the key survives them (`VertexAuthoringPanel.tsx:425`) [R]. A regeneration can therefore overwrite only the views whose hash still matches.
- **Entry point (f).** Create a new viewpoint with bare calls, `newVP` and then one `new2` per view with `ir` set in the callback, as `irDemoFixture.ts:118-148` already does. No outer TRANSACTION (`viewpoint.ts:92-96`). The whole batch should undo in one step, because every `BEGIN` folds into one `FINAL_END` (`action.ts:210-226`). [R, inferred, not measured]
- **Quality (g).** Of 780 exports in `~/Downloads`, 3 carry hand-written IR views, all ERD. The derived `Relation` edge matches the hand-written «Logical Syntax v1» on source, target and terminations, and differs only on routing and line (aesthetic). It differs from the Chen «Concrete Syntax v1» by design: there Relation is a diamond node and Attribute an ellipse, so the notation decides, not the structure. [M]
- **Jjodie (Phase 3) will not be ready before the freeze.** Its one call uses a fixed chat prompt (`AIProviderService.ts:83`) and returns only JjScript. IR patches need a prompt type, an IR serializer, a patch parser and a per-item review UI (the `SuggestedMappingsPanel` pattern). [R]

Recommended: build Phase 2 before the MODELS freeze as one additive lane of 4 files (§6), none of them in §3.1. The demo scenes stay unchanged: nothing runs until the command is invoked, and the new viewpoint is not activated.

**Decisions awaiting Alfonso**
1. The name and shape of the provenance key inside `ir` (`generated: {by, rule, fields, hash}`). Saved IR has no VersionFixer (R-B9), so it is permanent once written. Either leave it undeclared, like `migratedFrom`, or declare it optional in `irTypes.ts`, which is a §3.1 file.
2. The fill of solid symbols: a token (`var(--color-inode-name)`, readable in dark) or the catalog's hex `#334155` (`notationCatalog.ts:59`). Measured: the token takes the preset out of the recognition set (`uml-initial-state` disappears), while the first match is `base-circle` either way.

**Questions**
1. Priority: leave it out and create views deepest first, or set it from depth as the prompt proposes? Recommended: leave it out and create deepest first.
2. Entry point: the context menu of the metamodel row in the tree, beside «Create View», or Navbar Tools → Metamodel Tools (disabled today)? Recommended: the tree context menu.
3. Activate the derived viewpoint when it is created? Recommended: no, only open its tab, as New Viewpoint does (`ProjectEditor.tsx:1204-1228`).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The IR can express, with no schema change, what a derivation needs: per-class vertex views, object-as-edge views, pins. | **Holds** [M]: 29/29 documents (22 demo, 7 ERD) pass `validateIR` with the existing types. |
| H2 | Priority from hierarchy depth is needed so that a subclass view beats its superclass. | **Falsified** [R]: specificity 2 (exact) beats 1 (inherited) at equal priority, `irResolveCore.ts:297-303`. Depth only breaks a tie between two ancestors, which never happens once every concrete class has its own view. |
| H3 | An edge class is recognisable from the metamodel (a Transition role, or two non-containment references into one hierarchy). | **Holds, with a third pattern** [M]: containment in X plus one reference into X's hierarchy (PEST, ESM). 5/5 demo edge classes, 2/2 ERD. |
| H4 | The simulation role binding is available as a source of forms on the demo projects. | **Partly** [M]: it is absent from the exports; `bindProfile` reconstructs it (7 to 10 roles bound per demo). |
| H5 | Provenance can be carried additively inside the IR. | **Holds** [M+R]: precedent `migratedFrom`/`migratedHash`; `validateIR` accepts an extra key. |
| H6 | A viewpoint plus N views can be created programmatically in one undo step without touching Default. | **Holds for creation [R], undo inferred and not measured.** |
| H7 | Colours can be CSS tokens only. | **Partly** [M]: neutral and edge tokens exist; the catalog's solid presets carry a hex, and a token fill drops them from recognition. |

## 2. Files read (full paths under `/Users/alfonso/jjodel-w-viewgen/`)

`CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` (P4, P6, P16); `docs/decisions.md` (RC-20, RC-21, RC-33, R-MCID-1/2, R-IRN-4/9/10, R-NV-1..4, R-SIM-89/90, R-B9); `docs/log-inbox/views.md`. IR: `frontend/src/components/editor-v2/viewpoint/ir/{irTypes,irValidate,irResolveCore,irCreationSeed,irDefaults,notationCatalog,symbolRecognition,pathExpr,irReadCtx,irDemoFixture}.ts`; `irCompile.ts:319-328,516-563`. Authoring: `viewpoint/authoring/SymbolEditorModal.tsx:1-60,375-400`, `VertexAuthoringPanel.tsx`, `EdgeAuthoringPanel.tsx` (the commit and patch sites). View layer: `frontend/src/view/viewElement/view.tsx:172-192,490-520,640-660,1882-1972`; `frontend/src/view/viewPoint/viewpoint.ts:88-136`; `frontend/src/redux/action/action.ts:208-226`. Canvas: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx:30-50,265-300,905-969`. Simulation: `frontend/src/model/simulation/{roleCatalog,profileBinder,simProfiles}.ts`, `frontend/src/components/editor-v2/sim/{metamodelSketch,SimulationPanel}.ts(x)`. Tokens: `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`, `_form-palettes.scss`. Entry points: `frontend/src/pages/components/Navbar.tsx:1521-1534`, `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:670-684`. AI: `frontend/src/types/jodie.ts:80`, `frontend/src/services/AIProviderService.ts:83`. Three read-only Explore agents covered viewpoint creation and undo, the role binding, and Jjodie; I re-checked their key citations (`viewpoint.ts:92-96`, `:129-136`, `action.ts:210-226`, `Navbar.tsx:1521-1534`, `jodie.ts:80`, `irDemoFixture.ts:118-148`) by reading them myself.

**Path correction.** The prompt's `frontend/src/ai/` does not exist. Jjodie lives in `frontend/src/services/`, `frontend/src/components/Jodie/`, `frontend/src/types/jodie.ts` and `frontend/src/jjodie-integration/`. The subject was unambiguous, so the lane read those instead of stopping (rule 15, declared here).

## 3. Measures (scripts gitignored under `frontend/scripts/smoke/_tmp_viewgen_*`, run with `npx tsx`/`node`, data decoded to `/tmp/viewgen/`)

- **Controls on the validator** [M]: `validateIR` on `defaultObjectViewIR()` returns `{"ok":true}`; with `padding:'huge'` it returns `{"ok":false,"error":"[ir] shape.padding must be one of small | normal | large, ..."}`; with an extra `generated: {...}` key it returns `{"ok":true}`. EXIT=0.
- **Demo exports** [M]: `state` is compressed with async-lz-string `compressToUTF16` (as `U.decompressState`, `common/U.tsx:425-426`). Each decoded state has `viewelements` 0 and `viewpoints ["Pointer_ViewPointDefault"]`. Metamodel `_state` is `[]`/`{}` on all four, and a `grep -o '"sim[A-Za-z]*"'` over the decoded states returns nothing. Positive control on the same files: `"DClass"` is found (18 in PEST).
- **Prototype** [M], `_tmp_viewgen_derive.ts`, EXIT=0, `validateIR failures: 0`, output excerpt:
  - PEST, roles: `vertex Initial prio=1 rule=role:initial det(struct=5,roles=4) jjodie=2 validateIR=ok [base-circle|bpmn-start-event]`; `edge Transition prio=0 rule=role:transition det(struct=3,roles=2) validateIR=ok [container -> $nextState.value]`.
  - Petri, structure only: `edge Arc rule=structure:two-refs [$src.value -> $tgt.value]`, `edge InhibitorArc prio=1 rule=structure:two-refs`.
  - FlowB, roles: `vertex Decision rule=role:node [base-rounded|bpmn-task]`, `vertex Fork rule=role:fork [base-rect|flow-process]`.
  - `TOTAL views=22 per mode; structure-only: struct=150 roles=0 jjodie=68; with-roles: struct=115 roles=64 jjodie=53`.
- **Recognition** [M], `_tmp_viewgen_recog.ts`: after `applyPresetToShape`, `uml-initial-state hex -> base-circle|bpmn-start-event|uml-initial-state|petri-place|goal-actor | token -> base-circle|bpmn-start-event|petri-place|goal-actor`. The same drop happens for `uml-fork-join` and `petri-transition`. `applyPresetToShape` writes `border.color '#334155'` when the shape has none, so the derivation has to set the border token first.
- **Hand-written viewpoints** [M], `_tmp_viewgen_scan.mjs` over 780 `~/Downloads/*.jjodel`: IR views were found in `ERDLanguage.jjodel` (ChenNotation, 3 vertex), `MDE _ ERD (1).jjodel` (Concrete Syntax v1, 3 vertex; Logical Syntax v1, vertex + row + edge) and `MDE _ ERD.jjodel` (3 vertex). Two files failed to parse. The scan's filter is its own positive control: it found these 3 files.

## 4. Findings by question

**(a) The IR fields**, with who fills each one. `S` = deterministic from structure, `R` = deterministic from roles, `J` = Jjodie or a human.

| Field | Who | Rule |
|---|---|---|
| `irVersion` | S | `'ir-1.2'`, as `defaultObjectViewIR()` (`irDefaults.ts`) |
| `kind` | S/R | `edge` if recognised (d), else `vertex` |
| `metaclasses` + `authoringMetaclassPins` | S | `[name]` + `{name: classId}` (R-MCID-1, `irTypes.ts:260`) |
| `exclusive` | S | `true`: `irResolveCore.ts:234` `if (ir.exclusive === false) continue;` |
| `priority` | S | absent (Q1), see (b) |
| `shape.form`, `border.width/style`, `marker` | R | from the role preset: initial `uml-initial-state`, terminal/activityFinal `uml-final-state`, fork/join `uml-fork-join`, node `uml-state` or, under Petri, `petri-place`, Petri transition `petri-transition` (`notationCatalog.ts:93-108`) |
| `shape.form` with no role | S then J | `'rounded'` by default, from the name by Jjodie (Decision → diamond, Attribute → ellipse) |
| `shape.fill`, `border.color` | S | `--color-inode-surface` / `--color-inode-border`; ink for solid presets (Decision 2) |
| hue per family | J | `--color-opt-1..7-{bg,border}` available (c) |
| `shape.labels` | S | intrinsic `name`; `top` for boxes, `bottom` for circle, diamond and solid symbols |
| `fieldCompartments` | S then J | `attributes` when the class has attributes and the form is a box; which ones to show is Jjodie's (`form.hidden`) |
| `edge.source/target` | R/S | roles `simSource`/`simNextState` (or `'container'` via `simOwnedTransitions`), `simArcSource`/`simArcTarget`; structure (d) |
| `edge.terminations` | S | `none`/`openArrow`, the compile defaults (`irCompile.ts:562-563`) |
| `edge.labels.center` | S then J | the first EString attribute; trigger or guard text is Jjodie's (a PathExpr cannot reach an intrinsic name through a hop, `pathExpr.ts:22`) |
| `edge.line`, `routing`, subclass decoration | J | the vocabulary has no circle termination for an inhibitor arc (`irTypes.ts:540-546`) |
| `structure`, `form`, `table`, `badges`, `text`, `padding`, `cornerRadius` | J | absent: the form's base applies (`irTypes.ts:182-186` «ABSENT IS NOT ZERO») |

**(b) Priority.** `compareCandidates` reads `(b.entry.compiled.priority - a.entry.compiled.priority) || (b.specificity - a.specificity) || (a.entry.declarationIndex - b.entry.declarationIndex)` (`irResolveCore.ts:68-70`). An exact match pushes `specificity: 2` and an ancestor `1` (`:297`, `:301`). Longest-path depth would be strictly greater on every subclass, so it is safe *within* the generated set. The cost is that it outranks a later hand-authored view at priority 0 on the same class. `declarationIndex` follows `state.viewelements` order (`:174-177`), so creating the views deepest first settles ancestor ties with no priority at all.

**(c) Tokens.** Neutral node tokens exist: `--color-inode-surface`, `--color-inode-border`, `--color-inode-name` (light `slate-900`, dark `rgba(255,255,255,0.92)`, `_colors-dark.scss:344`) and `--color-inode-header-fill` (`_colors-light.scss:446-449`). Edge tokens: `--color-edge-default` (`:235`) and the rest of that family. A categorical 7-hue palette, `--color-opt-N-{bg,border,fg}`, is validated for colour-vision deficiency in both modes (`_colors-light.scss:515-548`, dark `:401`) and used today by the form widgets (`jjform/optionColor.ts`). There is no "symbol ink" token: `--color-inode-name` is the theme-aware candidate. Adding one is a `styles/tokens` change, additive and outside this lane. Every hand-written view found uses hex colours (§3), so tokens-only is stricter than current practice.

**(d) Edges.** Three rules, in this order, all [M] on the demos:
1. **Role.** A class kind-of `simTransition` has source `$<simSource>.value`, or `'container'` when only `simOwnedTransitions` is bound (as `netCompile.ts:255-263` does for the engine), and target `$<simNextState>.value`. A class kind-of `simArc` uses `simArcSource`/`simArcTarget`.
2. **Two references.** A concrete class with two single-valued non-containment references whose types share an ancestor. Source and target are chosen by name (`src|source|from|…` / `tgt|target|to|next|…`), otherwise by declaration order.
3. **Contained reference.** A class held by X through a multi-valued composition, with exactly one single-valued reference into X's hierarchy, has source `'container'` (`CONTAINER_ENDPOINT`, R-B13, `irTypes.ts:562`).

The result is `kind:'edge'` with `edge.source`/`edge.target`: object-as-edge, where the object's node is hidden and a synthetic edge is drawn (`irTypes.ts:569-572`). The derived edges were not rendered in this lane (no dev server), so the canvas result is Phase 2's visual step.

**(e) Provenance.** Proposed shape, written only by the derivation: `generated: { by: 'derive-1', rule, fields: {<path>: <rule>}, hash }`. The hash comes from canonicalizing the ir without `generated` and the pins, as `structuralHash` does (`irDefaults.ts:287-292`). Regenerating a view means: hash equal, overwrite it; hash different, keep it (edited); key absent, keep it (hand-written). The key contains no `op`, as `irValidate.ts:77-95` requires. Per-field overwrite is possible with a hash per field; per-view is simpler and is what the precedent proved.

**(f) Creation.** `DViewPoint.newVP(name, cb, persist, id)` (`viewpoint.ts:129-136`) creates it; `DViewElement.new2(name, jsx, father, cb, persist, id)` creates a view with `ir` set in the callback, which runs before persist (`view.tsx:505-518`); `appliableTo` is derived from `ir.kind` by `appliableToForIRKind` (`view.tsx:181-187`, not exported). The default viewpoint is never touched: the father is the new viewpoint, and `Defaults.isSystemViewpoint` matches by pointer. The new viewpoint is not activated: `openViewpoint` only opens its tab (agent reading of `DockManager.tsx:253-275`). The IR branch of `ObjectNode` keeps the simulation overlay (`sim-active` at `:919`, `<SimNodeRunState>` at `:969`), so a derived viewpoint does not hide the run state. [R]

**(g) Comparison.** Against «Logical Syntax v1» (`MDE _ ERD (1)`): `Relation` as generated is `{"source":"$left.value","target":"$right.value","terminations":{"sourceEnd":"none","targetEnd":"openArrow"},"labels":{"center":{"from":"path","expr":"$name.value"}}}`, while the hand-written view has the same endpoints and terminations, `center: intrinsic name`, and adds `routing:'curved'`, `line: dotted #153af4 2`. `Entity` as generated is rounded with an `attributes` compartment; hand-written it is `rect` with `cornerRadius 8` and a `children` compartment plus an `Attribute` row view. A containment-to-row rule would close that gap and is not in the prototype. Against Chen («Concrete Syntax v1», `ERDLanguage` ChenNotation), the forms (diamond, ellipse) and the hex fills are notation knowledge, not structure. The demo scenes have no hand-written views to compare against, and the `InputOutputNode` example of the prompt appears in no export.

## 5. Dependencies and risks

- **Undo.** Undo as one step is inferred from `action.ts:210-226` and the 450 ms merge of the history (agent reading of `reducer.ts:1276-1279`), not measured. Phase 2 must check that one Ctrl+Z removes the whole viewpoint.
- **Fork/join bar.** It renders as an ink-filled box of content size: the IR carries no aspect ratio (`resizable` only, `irTypes.ts:471`), and size belongs to the per-viewpoint layout (R-LAY).
- **Concrete superclasses** (`namedElement` in MDE ERD, `ActivityNode` in FlowB) get their own view. That is harmless, but it adds views a human would not write.
- **Reading a stored binding.** The raw `lookup[mm]._state` is the source (`SimulationPanel.tsx:861-862`). The L-proxy resolves pointers into proxies (agent reading of `joiner/classes.ts:2353`).
- **Location of the module.** A new pure module under `viewpoint/derive/` sits outside the literal §3.1 list (`viewpoint/ir/`, `viewpoint/authoring/`). It only *imports* from `viewpoint/ir/`.
- **An unverified lead from an agent** (no ticket opened): `get_duplicate` defaults `deep = false` (`view.tsx:1883`, read), so `vp.duplicate()` from ProjectEditor and the Dashboard would copy no views.

## 6. Phase 2 file list (proposal)

1. `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, new and pure: `(lookup, metamodelId, bag | null) → { ir, classId }[]`, deepest first, with rules (a) and (d) and the stamp (e). It ports the prototype.
2. `frontend/src/components/editor-v2/viewpoint/derive/__tests__/viewpointDerivation.test.ts`, new: the four demo metamodels as inline lookups, `validateIR` on each view, endpoints and presets asserted, and a mutation bench per §5 (swapped source and target, a dropped hierarchy check, a dropped pin).
3. `frontend/src/utils/deriveViewpoint.ts`, new: `createDerivedViewpoint(metamodelId)`. It makes bare `newVP` and `new2` calls, writes `appliableTo` per view, sets `U.isProjectModified`, names the viewpoint `<MM> (derived)`, never touches Default or existing views, and does not activate.
4. `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`: one item «Derive viewpoint» in the metamodel row's menu (`:670-684`).
5. Optional: export `appliableToForIRKind` from `frontend/src/view/viewElement/view.tsx:181` so that `appliableTo` keeps one writer.

Gates: typecheck at 14, vitest, build. Visual step: the four scenes, Derive then activate, with Initial a filled circle, Terminal a bullseye, Transition an edge from state to state, Petri arcs as edges, one Ctrl+Z removes everything, light and dark.

## 7. Open questions

1. The provenance key: its name, and whether it is declared in `irTypes.ts` (Decision 1).
2. Token or hex fill for solid symbols (Decision 2).
3. Priority left out, with views created deepest first (Q1)?
4. The entry point: tree menu or Navbar (Q2)?
5. Activation on creation (Q3)?
6. A small deterministic name table (Decision/Choice/Gateway → diamond) now, or leave names to Jjodie in Phase 3?

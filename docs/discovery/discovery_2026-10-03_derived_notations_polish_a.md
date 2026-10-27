# Discovery 2026-10-03 — derived notations polish, pass 1 (derive/ only)

Prompt-ID: P-2026-10-03-1300 (`docs/prompts/claude_2026-10-03_1300_prompt_derived_notations_polish_a.md`), chat C-2026-10-01-1725.
Session: session unknown (the harness shows no id to the session). Tree `~/jjodel-w-dnotA`, branch `derived-notations-polish`,
HEAD `2e75c44ca` (code of the trunk at `c56f4fc63`, docs only on top). Executor: Sonnet 5.5 (`claude-sonnet-5-5`).
This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files. Tags: **[M]**
measured in this phase, **[R]** read from a file. Every [M] below was measured on HEAD `2e75c44ca`, dev server of this
worktree on 3021, light theme, «Color by metaclass» on, by the gitignored probe `frontend/scripts/smoke/_tmp_dnotA_measure.ts`
over the four scene files of `/Users/alfonso/jjodel-demo-exports/` (`/tmp/dnotA/measure_before.json`, screenshots
`/tmp/dnotA/shots_before/`).

## 0. Answer in brief

- Phase 1 and 2 run in one go, as the prompt says: this report is committed first, then the six items are implemented one
  commit per concern. The six items are all reachable inside `derive/`, `notations.ts` and the dialog.
- **Three premises of the prompt do not reproduce on this tree** [M], and the fixes are written to what is measured:
  1. Item 1: Generic does NOT show `name = coin` (it already writes `exclude: ['name']`, `viewpointDerivation.ts:585`). The rows are on
     **State machine and Statechart** (DemoESM `Event` instances) only.
  2. Item 3: the Petri net bar is **48×12** (node 50×14), not 20×8; 20×8 is that bar read at zoom 0.50 (24×6 on screen).
  3. Item 6: the Flowchart fork and join are **not pastel and not two colours**: both paint `rgb(51,65,85)`, because R-VP-50
     (`isNotationGlyph`) already keeps bars out of «Color by metaclass». What is left to do is size (48×12 to 120×7), ink and
     border. The stop condition of item 6 is not met.
- **Item 5 cause** [M]: a role-keyed compartment is built by `attributesCompartment()` (`:166`), which carries no `rowFormat.style`;
  its rows render Inter 13 px. Only the Generic notation sets mono 11 px (`:586`). The screenshot called «Generic Flow» was drawn by a
  role-keyed notation. DemoFlowB has no `name` attribute at all, so Alfonso's copy differs from the export.
- **Item 2 does not go where the prompt says.** `deriveViewpointForBinding` never sees the id `stateMachine`: `derivationRolesOf`
  passes `notation` only for four siblings (`notations.ts:322`). The one-line map lives there. Also, the dialog opens on
  `stateMachine` for the DemoESM binding (`PROFILE_NOTATION`, `notations.ts:189`), so hiding the entry needs the dialog to open on
  its visible twin (adopted, Q1).
- Decisions adopted, each vetoable at the visual GO: Q1 (dialog opens on the twin), Q2 (mono rows in role-keyed compartments),
  Q3 (a compartment left with no row is dropped, so the title centres). The `decisions.md` row amending R-VP-22 is owed and out of
  this prompt's scope (Q6).
- Baseline before any change: typecheck 14 errors (the §17 set, exit 2); vitest of the derive folder, the dialog's folder and the
  suites that execute the derivation: 22 files, 881 tests, all green.

## 1. Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | Generic, State machine and Statechart show `name = coin` under a title `coin` | **Partly.** Generic falsified; State machine and Statechart hold [M] |
| H2 | `deriveViewpointForBinding` sends `stateMachine` to `deriveViewpointIRs` | **Partly.** It reaches `deriveViewpointIRs` by the default branch, but never sees the id [R] |
| H3 | the Petri net transition is a bar of about 20×8 with the name inside | **Partly.** Name inside holds; size is 48×12 [M] |
| H4 | Flow Initial and Terminal are circles of about 64 px | **Holds** [M]: node 66×66, content 64×64 |
| H5 | guards render in sans in the flow notations; rows `name = a` render in sans though the code says mono | **Holds** for the guard (Inter 10 px). The row cause is found, §3.5 |
| H6 | fork and join are pastel bars of two colours (Color by metaclass fill) | **Falsified** on this tree [M] |

## 2. Objective

Make the derived notations look finished: six fixes that live in the notation definitions, none under `viewpoint/ir/`, none in the
critical-zone list of CLAUDE.md §3.1 (`viewpoint/derive/` is not in the table).

## 3. Findings

### 3.1 Item 1, the `name` row
- [R] `viewpointDerivation.ts:166-171`: `const attributesCompartment = (): FieldCompartmentSpec => ({ id: 'attributes', source: { from: 'attributes' },`.
  No exclusion. Users: `:404` (role-keyed boxes), `:671` (Statechart node, initial). The Generic path excludes at `:585`:
  `if (attributesOf(v.classId).some(isIdentity)) slots.source = { from: 'attributes', exclude: ['name'] };`.
- [R] `:388` `const compartment = boxed && !terminalBox && attributesOf(c.id).length > 0;` counts the identity slot as a row. Statechart `:657`
  already skips identity when deciding the compartment (`some(a => !isIdentity(a))`) but writes the bare compartment at `:671`.
- [M] DemoESM, `Event.name:Pointer_ESTRING` is the only `name` attribute of the four metamodels (sketch dump; positive control: the same dump
  lists `Place.tokens`, `Arc.weight`, `State.entry`). Generic: the three `Event` nodes have 0 compartments. State machine: `coin`, `push`,
  `stop` are 198×54 with one row `name = coin` in Inter 13 px; Statechart: the same. A class that is a role-keyed box with only the
  identity slot therefore also gets an EMPTY compartment once `name` is excluded, unless the compartment is dropped (Q3).
- Coverage: the unroled classes of every role-keyed notation (State machine, Statechart, Flowchart, ISO, Activity, Petri, Petri classic)
  come from `deriveViewpointIRs`, so one change there covers them; the roled nodes of ISO, Activity and Petri classic hold no compartment.

### 3.2 Item 2, State machine converges on Statechart
- [R] `notations.ts:322-324`: `const notation = choice.notation === 'statechart' || choice.notation === 'flowchartIso' || choice.notation === 'petriClassic' || choice.notation === 'activityUml' ? choice.notation : undefined;`
  `stateMachine` gets `undefined`, so `deriveViewpointForBinding` (`:1115-1125`) falls to its last line, `deriveViewpointIRs`.
- [R] `notations.ts:189-191`: `PROFILE_NOTATION` maps `extendedStateMachine`, `dfa`, `nfa`, `moore`, `mealy` to `'stateMachine'`, and `:200` a
  Trigger binding too; tests pin it (`notations.test.ts:324,370`, `activityUml.test.ts:251`: `DemoESM: 'stateMachine'`). With the
  entry hidden and no change here, the dialog opens on a hidden notation: the controlled `<select value="stateMachine">`
  (`DeriveViewpointDialog.tsx:91-94`) has no matching option.
- [R] `elkLayout.test.ts:332`: `for (const id of ['generic', 'stateMachine', 'petri', 'flowchartIso']) expect(layoutOf(id), id).toBeUndefined();`.
  The hidden entry keeps no layout profile, so a derivation under that id would draw Statechart arcs on the default spacing: the dialog
  must not produce it (Q1).
- [M] State machine today: Initial circle 66×66 with its name below, edge labels Inter 10 px; Statechart: Initial rounded box, labels
  Inter 12 px quiet. After the change both ids draw the Statechart.

### 3.3 Item 3, Petri bars
- [R] `shapeRegistry.ts:312` `export const BAR_SIZE: Size = { w: 48, h: 12 };` is the bar's size when the view declares none.
- [M] Petri net: bar node 50×14, content 48×12, label `t1` centre, inside; classic: node 10×44, content 8×42, label outside `anchor-e`, 12 px.
  A declared `defaultSize` sets the node box and the content is two px less (Activity bar declared 120×7 measures node 120×7, content 118×5).
- [M] Arc geometry on DemoPetri (screenshot `shots_before/DemoPetri_petri.png`): arcs enter a horizontal bar at its ends and leave by its
  top; the side below is free, so the label of the horizontal bar takes `anchor: 's'`. To be verified on the after run by a
  geometric check (label rect against the bar and against sampled points of every edge path).

### 3.4 Item 4, Flow Initial and Terminal
- [M] Flowchart: Initial node 66×66 (content 64×64, `rgb(51,65,85)`), Terminal bull's-eye 66×66. Activity (UML) declares 20×20 and 24×24
  (`viewpointDerivation.ts:769-771`). The change is `defaultSize` on the activity-flavoured Initial and the bull's-eye in `deriveViewpointIRs`
  (`:370`), not on the state machine's named Initial. The fill is not touched.

### 3.5 Item 5, guards in mono, and the sans rows
- [M] Flowchart guard label `model.[count] < 2`: Inter 10 px `rgb(15,23,42)`. Activity: IBM Plex Mono 11.5 px `rgb(51,65,85)` with brackets
  (`ACTIVITY_GUARD_STYLE`, `:795`). The flow guard is written at `:354-355`, no style; ISO's template at `:719`, `EDGE_LABEL_STYLE()`; Statechart
  restyles with `EDGE_LABEL_STYLE()` at `:653`, which would hide a guard style set at the source.
- Cause of the sans rows [M+R]: the host honours `rowFormat.style` (`irCompile.ts:534` `rowStyle: compileTextStyle(fc.rowFormat.style, deps)`).
  Generic's compartment sets it (`:586`, mono 11 quiet) and measures IBM Plex Mono 11 px (`entry = —` on DemoESM Generic). A role-keyed
  compartment does not (`:166`), and measures Inter 13 px (State machine, Statechart). So the rows in sans are role-keyed rows. The fix is inside
  `derive/`: the shared `attributesCompartment()` takes the Generic row style (Q2).
- [M] DemoFlowB declares no `name` attribute (`ControlFlow.guard`, `ControlFlow.effect` only), so `name = a` cannot come from the export: the
  copy Alfonso looked at differs, or the screenshot was taken on another build (Q5).

### 3.6 Item 6, fork and join
- [R] `metaclassPalette.ts:425-431` `isNotationGlyph`: `if (shape.form === 'bar') return true;`, and `ObjectNode.tsx:961`
  `colorOverride={metaclassColor && !isNotationGlyph(irResolution.compiled.ir) ? metaclassColor : undefined}`.
- [M] Flowchart with coloring on: both bars node 50×14, content 48×12, background `rgb(51,65,85)`, border `rgb(203,213,225)`. Activity with
  coloring on: node 120×7, content 118×5, background `rgb(15,23,42)`: a bar declared by the derivation paints its ink under coloring.
  The pastel of the prompt's description predates R-VP-50 or comes from a build without it. Not stopped: the item is implemented
  (`fill: NAME_INK`, border in the ink, `defaultSize: ACTIVITY_BAR_SIZE`), and the after run checks the paint under coloring.

## 4. What each fix changes (plan)

1. `attributesCompartment(hidesName)`; `deriveViewpointIRs` and Statechart pass it when the class holds the identity slot and the name label is the title;
   a role-keyed box with no row left has no compartment, its title centres (flow) as any box without attributes does.
2. `derivationRolesOf` maps the hidden id to its twin; `DerivedNotation.hidden?: true` on `stateMachine`; `initialNotation` and `dialogPrefill`
   speak the twin; the select lists the visible entries (and the current one if hidden, so no mismatch).
3. `PETRI_BAR_LONG = 56`, `PETRI_BAR_SHORT = 12`; `CLASSIC_BAR_SIZE` = 12×56 (name kept); Petri net bar declared 56×12, label outside `s` in `EDGE_LABEL_STYLE()`.
4. `defaultSize` 20×20 and 24×24 from the existing constants.
5. The guard label carries `ACTIVITY_GUARD_STYLE()` at the source; Statechart keeps a style the base document carries; ISO's plain label takes it, its yes and no words keep the label style.
6. Fork and join as Activity's bar.

## 5. Dependencies and risks

- Hash pins: `erChen.test.ts:198-246` pins structural hashes of derived documents per notation; items 1 to 6 and the State machine switch change
  several of them, to be re-measured and re-pinned, each with the reason. `notationGlyph.test.ts` pins which documents are glyphs: unchanged by design (bars, discs, bull's-eyes stay glyphs).
- A viewpoint already saved keeps its stored documents until it is derived again (R-VP-25's precedent); `_state.derivedNotation: 'stateMachine'` is read, never rewritten.
- `ACTIVITY_*` constants sit below `deriveViewpointIRs` in the file; they are read at call time, after the module has evaluated.

## 6. Files read

`CLAUDE.md` (§3, 6, 17, 21), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` (whole), `docs/claude-code-log.md` (top 60 lines),
`docs/decisions.md` (grep window for RC-20..26, R-VP-16, R-VP-22, R-B9), `docs/discovery/discovery_2026-10-02_vp_glyph_nocolor.md` (§0 only),
`docs/discovery/discovery_2026-09-29_petri_notation.md` (grep window on R-VP-16, bar; not read whole),
`frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (whole), `.../derive/notations.ts` (whole),
`frontend/src/components/editor-v2/sim/DeriveViewpointDialog.tsx` (whole), `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (bar parts),
`frontend/src/view/viewPoint/metaclassPalette.ts` (header, `isNotationGlyph`, `metaclassColoringVars`), `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (`:950-970`, `:1175-1250`),
grep windows on `irCompile.ts`, `IRNodeContent.tsx`, `nodeSizing.ts`, and the tests `notationGlyph.test.ts` (header, `:150-215`), `viewpointDerivation.test.ts`,
`notations.test.ts`, `activityUml.test.ts`, `erChen.test.ts`, `elkLayout.test.ts` (grep windows). `discovery_2026-09-29_derived_viewpoint_notations.md` was NOT opened.
Absence claims: `PETRI_BAR_LONG`, `PETRI_BAR_SHORT` and a `hidden` property are free in code (`command grep -rn` over `frontend/src`, `frontend/scripts`, `docs`: the only hits
are in the prompt file; positive control, same command: `CLASSIC_BAR_SIZE` 3 hits in `frontend/src`).

## 7. Questions

1. The dialog opens on `Statechart (UML)` when a stored binding or the latest derived viewpoint says `stateMachine` (a twin map, not in the prompt's text). Recommended: yes, adopted; without it the hidden entry is the one the user sees on DemoESM.
2. Role-keyed attribute rows take Generic's mono 11 px quiet style. Recommended: yes, adopted, it is the cause fix of item 5.
3. A role-keyed box whose only slot is `name` loses its compartment (its title centres), as Generic's already does. Recommended: yes, adopted; an empty compartment would draw a separator over nothing.
4. Item 4 says the Initial and Terminal «keep the fill of Color by metaclass»; R-VP-50 keeps glyph circles out of it, and the fill is untouched. Recommended: leave R-VP-50 as ratified.
5. Which build and which project did the screenshots come from (pastel bars, `name = a`, bars 20×8)? On `2e75c44ca` and the exports they do not reproduce. Recommended: judge on 3021.
6. A `decisions.md` row is owed: State machine drawn as Statechart (amends R-VP-22), and the polish decisions of this pass. Out of this prompt's scope. Recommended: the chat writes it from the closing report.

## Addendum 2026-10-03 — Phase 2 results (same Prompt-ID, written after the code)

Commits on `derived-notations-polish`: report `5e536da10`; item 1 `d55e87af8`; item 2 `c5e879925`; item 3 `94849c6b3`; item 4 `84e9dbdb4`;
item 5 `26fca4b5e`; item 6 `79e4caf6d`; the new tests `a3a94f230`. Measured on those commits, dev server of this worktree on 3021, light theme with
Color by metaclass on, the four scene files, probe `_tmp_dnotA_measure.ts` (gitignored; `/tmp/dnotA/measure_before.json`, `measure_after.json`; screenshots
light and dark in `/tmp/dnotA/shots_after/`). [M] throughout; the before and after runs show the same node and edge-text counts on every scene.

| Item | Before | After | Where to look |
|---|---|---|---|
| 1 | DemoESM State machine and Statechart: `Event` nodes 200×56, 1 compartment, row `name = coin`, title top | 200×42, 0 compartments, no row, title centred. Generic unchanged (0 rows before and after) | DemoESM, notations State machine and Statechart |
| 2 | State machine: Initial circle 66×66, labels Inter 10 px | State machine and Statechart: nodes and edge labels equal on DemoPEST and DemoESM. The real dialog lists 8 notations (no State machine) and opens on Statechart for DemoPEST and DemoESM | DemoPEST, DemoESM; the Derive dialog |
| 3 | Petri net bar node 50×14 (content 48×12), name centred; classic 10×44 | Petri net 56×12, name outside `anchor-s`: 0 of 2412 edge samples under any of the three labels, no bar overlap. Classic 12×56, name `anchor-e` | DemoPetri, notations Petri net and Petri net (classic) |
| 4 | Flowchart Initial and Terminal 66×66 | 20×20 (`rgb(51,65,85)`) and 24×24 (white, bull's-eye), fills untouched | DemoFlowB, Flowchart |
| 5 | Flowchart guard Inter 10 px `rgb(15,23,42)`; ISO Inter 12 px quiet; rows Inter 13 px | Flowchart and ISO guard IBM Plex Mono 11.5 px `rgb(51,65,85)` (Activity unchanged); State machine and Statechart rows IBM Plex Mono 11 px, as Generic's | DemoFlowB, Flowchart and ISO; DemoESM |
| 6 | Fork and join node 50×14, `rgb(51,65,85)`, border light grey | 120×7 (content 118×5), `rgb(15,23,42)`, border the same ink, equal to the Activity (UML) bars, with coloring on | DemoFlowB, Flowchart |

Tests: 53 new (`notationsPolishA.test.ts`), 35 red on the unmodified tree, the 18 that passed being controls and boundaries. Existing pins moved only where the
fix says they must: hash maps re-measured per file by a helper that prints every key it changes (it over-replaced one pin once, caught by the suite and restored),
the select's list, the initial notations, the four State machine glyphs, the named disc case of `irGlyphNoColor.test.ts` (re-pointed to a named Petri bull's-eye),
the Petri and flowchart box sizes. Mutation bench: 33 mutants, 30 killed by the new file, 2 by the dialog test, 1 equivalent survivor (the `nameless` guard of `hidesName`).
Gates: typecheck 14 errors, the same set as the baseline (exit 2); typecheck:scripts exit 0; vitest of the combined affected set 22 files 881 tests before, 23 files 935 after
(derive folder 5 files 305 tests, dialog folder 11 files 445 after); full vitest 276 files, 6937 tests passed, the nine known files red at import and no other;
build exit 0; check:docs and check:scripts exit 0.

Deviations from the prompt, all vetoable:
- Item 2 lives in `derivationRolesOf` (`notations.ts`), not in `deriveViewpointForBinding`, which never sees the id; the dialog opens on the twin (Q1). `deriveViewpointForBinding` is unchanged.
- Item 1 also drops a compartment left with no row (Q3), which moves the label of a role-keyed box from top to centre; item 5 changes every role-keyed attribute row, not only the guard (Q2).
- Three test files outside `derive/__tests__` and the dialog's folder moved with their pins: `nodes/__tests__/irGlyphNoColor.test.ts`, `nodes/__tests__/nodeSizing.test.ts`, `view/viewPoint/__tests__/notationGlyph.test.ts`.
- The prompt's screenshot facts for items 1 (Generic), 3 (size) and 6 (pastel) did not reproduce, see §0; the fixes were written to the measures.

Findings that outlive the lane:
- Petri net (classic) `t1`'s name is crossed by an arc: 8 of 2412 samples under the label with the old 10×44 bar (measured by mutating the constant back and restoring it from HEAD), 6 with 12×56. Pre-existing, so no regression; it is the open ticket of 2026-10-02 in `docs/log-inbox/views.md`, and routing and handle sides are the discovery lane P-2026-10-03-1304's.
- `npm run build` run while the dev server of the same tree is up left the server stale: after it the model tab opened with no canvas (0 nodes, no page error) until the server was restarted. `.vite-cache` is per tree, not per process (P14). The server left on 3021 was restarted after the last measure.
- A `decisions.md` row is owed (State machine drawn as Statechart, amending R-VP-22; the polish decisions). Not written here: out of the prompt's scope.

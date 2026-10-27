# Phase 2 report: slice D, the «Derive viewpoint» dialog, the notation binding and provenance
Prompt-ID P-2026-09-30-0255 · `docs/prompts/claude_2026-09-30_0255_prompt_d_derive_dialog.md` · Chat C-2026-09-29-2230 · tree `~/jjodel-w-notations`, branch `viewpoint-notations`, on the C2 tip (`2360515f4`, `97f91a7ac`, HEAD `c6913fbb9`) · executor Anthropic Claude Opus 5.5. [M] measured in this lane, [R] read.

## 0. Answer in brief
- **«Derive viewpoint» opens a dialog** (code `64ea9f216`) [M]: a notation select (Generic, State machine, Petri net,
  Flowchart) and, for the three role notations, a metaclass → role table prefilled by `bindProfile` with the stored
  simulation binding as bag, inverted per class, always editable; Generic has no table. The select opens on the
  latest derived viewpoint's notation, else the stored binding's, else Generic. On the four demos with Apply's
  binding it opens on State machine (DemoPEST, DemoESM), Petri net and Flowchart, each table equal to the binder's.
- **The notations apply only when picked** (amends R-VP-15 (5), R-VP-17): the dialog's default on the configured
  demos derives the role-keyed documents pinned since `58aa78ba9`, byte for byte; the same table with no stored bag
  derives the same documents; the simulation binding is read, never written (byte-identical before and after the
  derivation and the undo, in the tests and on the page).
- **Stored with the viewpoint** [M]: `_state` keys `derivedFrom`, `derivedNotation`, `derivedRole_<classId>`; every
  view carries `ir.generated = { by: 'derive-2', notation, role?, hash }`, `hash` its `structuralHash`, which now
  ignores `generated` (R-IRN-33). One undo step removes the viewpoint and its 5 views; not activated; tab opened.
- **Regeneration** [M]: the next «Derive viewpoint» opens on the latest derived viewpoint's notation and table, and
  creates a new viewpoint; the older one stays.
- **Default viewpoint unchanged** [M]: the four demo scenes, 12 of 12 shots byte-identical to the C2 tip.
- **Gates** [M]: typecheck 14 (the §17 set); vitest 6049 passed, the 9 known red at import; build exit 0; lane probe
  58/58 on 3074; mutation bench 44/45, the survivor equivalent (§2).

Recommended: merge after the chat's visual check of the crops (§3); questions 1 and 2 as taken.

**Decisions awaiting Alfonso** (RC-26): none new; R-VP-21 is written under the delegation of 2026-09-29 evening. It
amends R-VP-15 (5) and R-VP-17, which Alfonso ratified; the amendment is the one he chose on 2026-09-29 evening
(the dialog, a notation applies only when picked), recorded in the discovery's decision 2.

**Questions**
1. State machine picked on a metamodel whose table finds no Trigger draws the activity look (R-VP-17's test, «a
   binding with a Trigger is a state machine», kept unchanged as COSA 1 asks). Recommended: keep until slice A1
   keys the look on the notation picked.
2. The prefill keeps only the stored Node and Transition (the binder's S6); a class role picked by hand in the
   Simulation roles dialog (a different Initial, say) is proposed again by the binder, as COSA 2 defines it.
   Recommended: keep; the table is editable, and the stored binding stays the simulation's.

## 1. Layer Impact Report (written before the first source edit)

Base: the notation discovery §2 and §3 (`ee7206d0c`), R-B9, R-IRN-32, R-IRN-33, Rule 11, R-VP-19, R-VP-20.

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)       -- three flat `_state` keys on the NEW DViewPoint, set before persist
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)   -- reads nothing new; see below
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the saved IR and the saved `_state` only: no VersionFixer, no jsxString
```

**Persistence (the saved `DViewElement.ir`).**
- What changes: one optional key, `generated`, becomes declared on the view IR interfaces
  (`VertexViewIR`, `GraphVertexViewIR`, `EdgeViewIR`, `RowViewIR`), typed
  `{ by: string; notation: string; role?: string; hash: string }` and spelled once and for good
  (R-B9, no VersionFixer for IR views). The derivation writes it on every view it creates:
  `by: 'derive-2'`, the notation id picked in the dialog, the class's role in the dialog's table
  when it has one, and `hash`, the view's structural hash at creation.
- What does NOT change: no existing key is renamed, removed or retyped (Rule 11: an optional
  addition); no `irVersion` bump; no migration (R-IRN-32); `irHash` is the same function over the
  same bytes for every IR without the key, so every fixture hash and every compile-cache key of an
  existing view stays; the factory defaults of `irDefaults.ts` are untouched.
- `structuralHash` (`irDefaults.ts:287-293`) drops `generated` beside `migratedFrom`,
  `authoringMetaclassPins` and `migratedHash` (R-IRN-33): provenance describes the IR, it is not
  part of it. It is exported so the stamp and a future guard (regeneration after 2026-10-07,
  question 4 of the discovery) read one function. `isMigratedDefaultView` reads the same hash: no
  migrated default view carries `generated`, so no delegation verdict moves.
- Cross-layer interaction: none at read. The resolver, `compileView` / `compileEdgeView` /
  `compileRowView` and the renderers do not read `generated`; `validateIR` accepts an extra key
  (measured by the discovery, §4 controls) and is not changed.
- Side-effect safety: an IR carrying `generated` compiles apart from one without (its `irHash`
  differs), which only matters for the new views, created with it.

**D-layer (the new `DViewPoint`).**
- What changes: the derived viewpoint is created with `_state = { derivedFrom, derivedNotation,
  derivedRole_<classId>... }`, written in `newVP`'s callback before persist, the channel
  `viewpointType` already uses (`utils/deriveViewpoint.ts:55-59`). No `SetFieldAction`, no
  `set_state`: the keys are part of the created object.
- What does NOT change: the metamodel's `_state` (the simulation binding) is read, never written
  (COSA 3; measured byte-identical before and after, §2 and §3); no existing viewpoint or view is
  touched; the creation stays `DViewPoint.newVP` plus bare `DViewElement.new2` calls with no outer
  TRANSACTION (CLAUDE.md §3.3), so it folds into one undo step as today.
- Cross-layer interaction: the next «Derive viewpoint» on the same metamodel reads the `_state`
  of the latest derived viewpoint (order of the project's `viewpoints`) to prefill the dialog.
- Side-effect safety: no reader of a viewpoint's `_state` other than this dialog is known
  [R: a grep of `_state` over `frontend/src` finds only Info.tsx's JSON viewer showing it]; the
  validation viewpoint's own `_state` use is on another object. Deleting a derived viewpoint logs
  what deleting a plain one logs (§3, control).

**Canvas v2-flow.** No change: the dialog is a portaled modal mounted at the app root
(`App.tsx`), the tree row only dispatches the open event; the documents the derivation creates for
the role-keyed notations are byte-identical to today's for the same binding, and the generic ones
to C2's, `generated` aside (tests, §2). No handle, route, port or size computation is involved.

**Smoke-test scenarios potentially affected.**
- The four demo scenes in the default viewpoint: nothing they render reads a new key; pixel
  comparison with the C2 tip's shots (`_tmp_c2_crops/*_after2.png`), §3.
- «Derive viewpoint» on the four demos: the dialog opens (Generic on an empty bag, the matching
  notation on a stored binding), the derived viewpoint with the preselected notation and with
  Generic on DemoPEST; crops in §3.
- Undo: one step removes the viewpoint and every view it created (§3).
- Save and reopen: `generated` and the `_state` keys are plain JSON (round trip in §2).

Uncertain about propagation: nothing left open at the time of writing.

## 2. Tests and mutation bench
Written before the code and run on the C2 tip first: 9 failed and 2 files failed at collection (`notations.ts`,
`DeriveViewpointDialog.tsx` absent) [M]. Then green: 59 new tests (6049 passed in the full run, 5990 at the C2 tip).
- `derive/__tests__/notations.test.ts` (new, 39): the list and the roles each table offers; **the prefill of each of
  the four demos equals `bindProfile`'s output for the notation's profile, inverted** (DemoPEST, DemoESM: State node,
  Initial, Terminal, Transition; DemoPetri: Place node, Transition, Arc, InhibitorArc; DemoFlowB: ActivityNode node,
  InitialNode, FinalNode terminal, Fork, Join, ControlFlow transition); the select's notation from a stored binding
  (the eight system profiles, a user profile by `basedOn`, «Custom» by shape and Trigger, the exported empty bags on
  Generic); regeneration from the latest derived viewpoint's `_state` (order, other metamodels, deleted viewpoints,
  unknown notation, stale classes and roles dropped); the `_state` keys exactly; `ir.generated` on every view, its
  `hash` the view's `structuralHash`, stable when the stamp is included; `validateIR` ok; a JSON round trip;
  **the dialog's default choice on each configured demo derives the role-keyed documents pinned since `58aa78ba9`,
  byte for byte, provenance aside** (DemoPEST `99e03cfb52856542`, DemoPetri `d43f9d79bf78f9f4`, DemoESM
  `a9bd2541f1f94b09`, DemoFlowB `58aeb562c91a731f`), and Generic the C2 generic documents; the same table with no
  stored bag gives the same documents (the binding no longer decides); **the simulation binding and the whole lookup
  byte-identical after prefill, choice, state and documents, on a frozen lookup**.
- `derive/__tests__/viewpointDerivation.test.ts` (+7): `classRoles` read in place of the bag's class keys (the bag's
  own table reproduces the bag's documents on the four demos; an empty table draws no role; two classes can share a
  role); `rolesFromTable` (own entry, nearest superclass breadth first across branches, foreign ids, a cycle).
- `ir/__tests__/ir.test.ts` (+5): `structuralHash` ignores `generated` on a vertex and an edge, still moves on a real
  edit, `withMigratedHash`'s stamp is unchanged by it, a stamped migrated default carrying it still delegates;
  `irHash` of an IR without the key unchanged. The existing pins (59 fixture irHash, compiled defaults) untouched.
- `sim/__tests__/DeriveViewpointDialog.test.ts` (new, 8): the form rendered (`renderToStaticMarkup`, joiner and
  creator mocked): dialog role and title, the notation select with its `<label>`, **Generic hides the table**, one row
  per class with its `<label for>` and the prefill selected, the inherited role in the empty option, Derive disabled
  with no role, the footer's source line, the shared shell and Bootstrap icons only.
- **Mutation bench** (`frontend/scripts/smoke/_tmp_d_bench.mjs`, gitignored, the C2 harness): **44/45 killed**,
  controls 328/328 before and after. The survivor `roles-drawn-ignored` (the table's roles not filtered by what the
  derivation draws) is equivalent on this list: no offered profile edits Accepting, the only class role the binder
  binds and no derivation draws; it guards a future notation. The first run gave 40/44: `table-farthest-wins` was a
  mis-built mutant (`continue` is equivalent under single inheritance; rebuilt, plus `table-no-break`), and two real
  gaps (a user profile's `basedOn`, an uncleaned table reaching the derivation) were closed by three tests.
- Not reachable by the bench (the files do not import in node, CLAUDE.md §5): `utils/deriveViewpoint.ts` (the
  `_state` write, the one undo step, the tab), the dialog's portal (Esc, Enter, focus), the tree entry and the mount.
  The lane probe executes them (§3).

## 3. Measures
- **Gates** [M] on `64ea9f216`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code (twice, before and
  after the last test edits); `npx vitest run` 6049 passed of 6049, 237 files, the 9 known red at import (`window is
  not defined`); `npm run build` exit 0, the chunk-size warning only. Logs in `frontend/scripts/smoke/_tmp_d_logs/`.
- **Lane probe** [M], `lane-run probe` on 3074, light, 1600×1000 at DPR 2, `frontend/scripts/smoke/_tmp_d_probe.ts`,
  log `~/.jjodel-lanes/P-2026-09-30-0255/probe-_tmp_d_probe.log`: **58/58, EXIT=0**. The scenes: the C1 scenario's four
  demos (bags empty) plus C2's MDE ERD and ERDLanguage, as C2 built them.
  - Loop 1, C2's procedure with the derivation through the tree row's «Derive viewpoint» entry (right-click, the
    menu item) and the dialog: on each demo the dialog opens on Generic with no table and the focus on the notation
    select; Enter derives one viewpoint and closes it. **Default viewpoint: 12 of 12 shots (first, before, after)
    byte-identical to the C2 tip's** (`_tmp_c2_crops/c2_*_default_*_after2.png`); control (P12) 744873 px between two
    scenes.
  - Loop 2, the binding written as Apply writes it (`simProfile` and the binder's bound proposals): the dialog opens
    on stateMachine, petri, stateMachine, flowchart, each table the unit test's; every label 11 px with its control;
    footer «Prefilled from the simulation roles.»; Derive on top of its pixel (`elementsFromPoint`); light theme;
    icons `bi bi-x-lg`, `bi bi-magic`. Focus order on three demos: notation select, the role selects in order,
    Cancel, Derive; Escape closes, the bag untouched.
  - DemoPEST: Enter derives with State machine: one viewpoint, undo history 45 → 46, `_state` = `derivedFrom`,
    `derivedNotation`, four `derivedRole_` keys (State node, Initial, Terminal, Transition), 5 views each with
    `generated` (`derive-2`, `stateMachine`, a hash; a role on 4, none on Event), not activated, bag byte-identical.
    One undo (the Navbar's `UndoAction.new(1, user, false).commit()`): the viewpoint and its 5 views gone, history 45,
    bag byte-identical; the dialog then opens on the stored binding again. Derived again, then the regeneration: the
    dialog opens on State machine «Prefilled from the latest derived viewpoint.», its table; Generic selected hides
    the table; Derive clicked makes a second viewpoint (`derivedNotation: generic`, 2 keys, 5 views with `generated`,
    no role); the first stays; the next dialog opens on Generic; the bag byte-identical at the end.
  - Crops (`sips -Z 600`, gitignored): `frontend/scripts/smoke/_tmp_d_crops/d_{sm,petri,esm,flowB}_dialog_600.png`
    (bound), `d_sm_dialog_generic_600.png` (the exported bag), `d_sm_derived_stateMachine_600.png`,
    `d_sm_derived_generic_600.png`.
- **First probe run, 43/58, kept** (`probe-_tmp_d_probe.run1.log`): the 12 default shots differed only in the right
  rail (7 vs 5 metamodels: C2 had also built MDE ERD and ERDLanguage; the tree scrolled and hovered by the entry), the
  canvas left of the rail identical; and the probe's own undo call was malformed (`UndoAction.new()` without
  arguments, «unexpected action type»). Both were the probe's; fixed, rerun as above.
- **Console** [M]: no page error. The warnings `get__jjdependencies … unexpected pointedBy case ending with an object`,
  «Unexpected case in delete: viewpoint(s)» and «cannot find project id while deleting a viewpoint» come from the
  probe's `delete()` of the loop-1 viewpoints. Control (`_tmp_d_delete2.ts`, same port): a derived viewpoint and four
  built by hand from its views (no key, `_state` only, `generated` only, both) each log the same 5 + 7 lines on
  delete and each loses all 5 views: the keys of this slice do not cause them (the behaviour
  `DataManagerViewpointPanel.tsx:297` describes). «failed to get project» is in C2's run too.

## 4. Decisions taken in the lane
1. **Where the dialog lives.** `components/editor-v2/sim/`, beside SimInputDialog and SimDataModal, the two dialogs
   that already share SimRolesModal's shell (`sim-roles-modal*`): the «shared modal classes» are those; no shared
   modal class exists under `styles/` [M: grep]. Its own SCSS holds the size, the field and the rows.
2. **The table is read per class** (`DerivationRoles.classRoles`), not folded into a bag: a bag holds one class per
   role, the table may give a role to two classes. A class with no entry takes its nearest superclass's, breadth
   first (`rolesFromTable`), the same rule for the drawing and for `generated.role`, shown in the empty option
   («— (Node, inherited)»). With the bag's own classes as table the documents equal the bag's (test).
3. **The references the roles read** come from `bindProfile` with the table's Node and Transition as bag (S6), not
   from the stored binding; the dialog shows class roles only (COSA 2 names «a metaclass → role table»).
4. **The inversion**: catalog order, a class keeps its first role (a class named like both Initial and Terminal is
   Initial).
5. **A role notation with no class bound cannot be derived** (Derive off, «Give a class a role, or choose Generic»):
   with no role the role-keyed path would draw the retired boxes, and R-VP-19 gives that case to Generic.
6. **The notation of a stored binding**: its system profile (the four machines are state machines), the one a user
   profile is based on, else «Custom» by shape and Trigger (R-VP-17's test).
7. **The latest derived viewpoint** is the last in the project's `viewpoints` order whose `_state.derivedFrom` names
   the metamodel; one naming no known notation is ignored. Its stale entries (a class gone, a role the notation does
   not offer) are dropped.
8. **`structuralHash` exported** from `irDefaults.ts`, the scope's «if structuralHash needs the exclusion»: the stamp
   and a future guard read one function.
9. **Files** (14, rule 19, all in the prompt's DOVE): new `derive/notations.ts`, `sim/DeriveViewpointDialog.tsx`,
   `.scss`, two test files; changed `App.tsx` (mount), `events/registry.ts` (event), `TreeViewContent.tsx` (the
   entry, its now unused import removed), `utils/deriveViewpoint.ts` (the choice, `_state`; the stored-binding reader
   it held moved to `notations.ts`), `viewpointDerivation.ts`, `irTypes.ts`, `irDefaults.ts`, `ir.test.ts`,
   `viewpointDerivation.test.ts`.
10. **Outside the tree**, by `lane-run probe` as prescribed: its logs in `~/.jjodel-lanes/P-2026-09-30-0255/`, its
   vite cache `/tmp/lane-vite-cache-3074`.

## 5. Files read (under `/Users/alfonso/jjodel-w-notations/`)
`CLAUDE.md`, `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/styles/CLAUDE.md` (§7), `docs/PROTOCOL.md`
(P1-P16), `docs/decisions.md` (RC-20..RC-34, R-B9, R-SIM-8, R-VP-15..20), `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md`,
`docs/discovery/discovery_2026-09-30_c2_ir_keys.md`, `docs/log-inbox/views.md`; `utils/deriveViewpoint.ts`,
`viewpointDerivation.ts` and its test, `profileBinder.ts`, `simProfiles.ts`, `roleCatalog.ts`, `profileCodec.ts`,
`simRoleStatus.ts` (`storedProfile`), `simBridge.ts` (`runBag`), `simRolesDraft.ts` (`draftPatch`), `metamodelSketch.ts`,
`ValidationRulesModal.tsx`/`.scss`, `SimRolesModal.tsx`/`.scss`, `SimInputDialog.tsx`/`.scss`, `App.tsx`,
`events/registry.ts`, `TreeViewContent.tsx` (the context menu and the metamodel row), `irTypes.ts`, `irDefaults.ts`,
`irCompile.ts` (`irHash`), `irValidate.ts` (`validateIR`), `joiner/classes.ts` (`set_state`, `end`, `newVP`,
`get__jjdependencies`), `view/viewPoint/viewpoint.ts`, `redux/action/action.ts` (`UndoAction`), `ProjectEditor.tsx:1204-1228`,
`DataManagerViewpointPanel.tsx:285-310`, `frontend/scripts/lane-run.mjs` (probe), the C1 and C2 probes.

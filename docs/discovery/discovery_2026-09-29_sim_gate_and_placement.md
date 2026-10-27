# Discovery: the Simulation pill gated by Advanced mode and a «Semantic type», and the Jjodie/pill placement

## 0. Answer in brief

1. **Now** [R, E measured 09-27]: at 1600×1000 Jjodie is a fixed 58×58 circle at (230, 842), bottom 100 px, glyph 26 px, z 10000 (`JodieWindow.css:871-924`). The pill is a 107×32 chip inside the editor at (305, 919), left 304, bottom 16, z 850 in the dock (`simulation-panel.scss:45-57`). Jjodie ends 19 px above the pill's top. Their centres are 64 px apart, and the circle is 1.8× the pill's height.
2. **Proposed** (editor rule only, 8 px grid, E = editor bottom edge = 967): Jjodie 48×48 with a 24 px glyph, left 216 (rail 200 + 16), its bottom at E−16 (`bottom: calc(var(--jj-statusbar-height) + 17px)` = 49 px). Closed chip on Jjodie's centre line: bottom 24, left `200+16+48+16` = 280. The open panel keeps bottom 16. Result: Jjodie at (216, 903) and the chip at (281, 911), both centred on y 927, 16 px apart (17 with the editor's 1 px frame). Both are out of flow, so nothing shifts.
3. **Gate**: one pure predicate in `simRoleStatus.ts`, `simPillVisible(advanced, lookup, modelid, isModelMode)`. It is true when Advanced is on and `simProfile` is set (not empty) on the metamodel's bag: the M2 itself, or the `instanceof` of an M1. `advanced` comes from Redux `state.advanced`, which is what Navbar, Info and Toolbar read. `isAdvancedMode()` is not usable: it reads localStorage and gets no event within the same tab. The predicate is used once, at `EditorV2.tsx:4416`, which mounts the panel for both canvases. Unmounting clears the run (`SimulationPanel.tsx:318`).
4. **Properties field** «Semantic type»: in GENERAL of `builder.model` (`Info.tsx:481-483`), shown when `l.isMetamodel && advanced`. A select with `None` plus the eight `PANEL_PROFILE_IDS`. It writes `lmm.state = { simProfile: id }`, or `{ simProfile: undefined }` for None. `set_state` merges and deletes in one TRANSACTION, so one undo step (`joiner/classes.ts:2356-2402`). This is the same write as the panel (`SimulationPanel.tsx:348`) and the dialog (`SimRolesModal.tsx:492`). No new key.
5. **Dialog and panel** [M, 4/4 demo metamodels]: a dialog opened on the preset stored by Properties proposes the same bindings as today's picker path (7/10, 9/10, 10/13, 10/13). The patches are identical except for `simProfile`. The picker `What kind of model is this?` is skipped (`isFirstOpen` is false) and, behind the gate, can no longer be reached. Before Apply the M2 face reads `State machine · Checkable` with 7 proposals and Apply on, not `Custom · Not checkable`.
6. **`None`** removes `simProfile` only and keeps the role bag (recommended). Choosing the preset again restores everything. The pill hides on both tabs, and a running simulation is cleared. The Problems producer keys on role keys, not on the profile (`simCheckToProblems.ts:90-96`). It keeps reporting guard and action defects, now read under «Custom» (`simBridge.ts:145`).
7. **Demo**: Setup gains one click, Advanced (+1 if the browser never saw the tutorial), and loses the eight chip clicks: a chip no longer exists before its Semantic type is set. Each scene: metamodel in Properties 0/1, select 2, M2 chip 1, M1 chip 1, picker −2. That is +2..+3 clicks per scene, +8..+12 over the four scenes. The §2.1 Undo reads `State machine · Not checkable`, and in §2.4 the undo stack goes 2→3.

Recommended: Phase 2 as §6: one lane, 6 code files plus the demo script, cut from the trunk at or after `7fec9c966`.

Decisions awaiting Alfonso (each with a recommendation, RC-21):
- D1. Alignment: centre line (recommended), or shared bottom baseline (chip bottom stays 16, centres 8 px apart). Perceptual, for the GO.
- D2. Smaller Jjodie in editor tabs only (recommended), or on the dashboard as well.
- D3. `None` keeps the role bag (recommended), or clears every `sim*` key.
- D4. Semantic type chosen live in each scene (recommended, it becomes the «I say what kind of model this is» step), or set before the talk (−2 clicks per scene, no story).

Questions:
1. Should the Problems producer follow the gate too, hiding simulator defects in Basic mode or with None?
   Recommended: no, not in this lane (`editor-v2/problems/` is critical zone); a ticket.
2. The dialog's picker (`KINDS`, `isFirstOpen`) becomes unreachable. Should its code stay?
   Recommended: keep it with `// TODO: cleanup` (Rule 9).

---

- Prompt-ID `P-2026-09-29-1040`, `docs/prompts/claude_2026-09-29_1040_prompt_discovery_sim_gate_and_placement.md`, chat `C-2026-09-28-1936`.
- Session `0d5d6f3f-228e-476f-afe0-f745e4065ed5` (lane-run, tier heavy). Tree `~/jjodel-w-simgate`, branch `sim-gate-disc`, HEAD `ace820c30`, cut from the trunk at `0fbb550ea`. Executor: Opus 5.5 (`claude-opus-5-5`).
- This report is a set of hypotheses with evidence, not a reference. Readers downstream re-read the real files.
- Tags: **[M]** measured in this phase on `ace820c30` by gitignored `npx tsx` probes (§9). **[M date]** measured by an earlier lane and quoted. **[R]** read. No dev server was started (prompt, COME 3), so no pixel in this report was measured today.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Jjodie and the pill share a containing block, so aligning them is local CSS. | **Falsified [R].** Jjodie is `position: fixed` on the viewport, mounted at `App.tsx:177` outside the dock. The pill is `position: absolute` in `.editor-switch-container`, inside the dock (`simulation-panel.scss:9-12`). Alignment crosses containing blocks and depends on E = viewport bottom − 33 px. |
| H2 | One predicate at one mount site serves both canvases. | **Holds [R].** M1 and M2 are the same `EditorV2` with `isModelMode`, and there is one mount: `EditorV2.tsx:4416` `{modelid && <SimulationPanel modelid={modelid} isModelMode={isModelMode} />}`. |
| H3 | `isAdvancedMode()` is a reactive source for a render gate. | **Falsified [R].** `useInterfaceMode.ts:43-45` reads localStorage. The hook listens only to `storage` (`:67-78`), which fires in *other* tabs. Navbar writes Redux `advanced` and localStorage together (`Navbar.tsx:867-887`). The reactive readers use Redux: `Info.tsx:1812` `ret.advanced = state.advanced;`, `Toolbar.tsx:676` `useSelector((state: any) => !!state.advanced)`. |
| H4 | Writing `simProfile` alone from Properties leaves the dialog proposing what the picker path proposes. | **Holds [M] 4/4** (§5). |
| H5 | Nothing outside `editor-v2/sim/` reads `simProfile`. | **Holds [R].** `command grep -rn "storedProfile\|PROFILE_KEY\|decodeProfile\|simProfile" components model` minus `sim/`, `profileCodec`, `simProfiles`, `profileBinder` and tests leaves comments only. Control, same tool: `storedProfile` alone hits 6 files. |
| H6 | Removing the key (`None`) needs a new action or a core change. | **Falsified [R].** `set_state` removes a key given as `undefined`: `classes.ts:2385` `removedState[k] = true; // will be deleted by reducer`, then `'-='` inside the same TRANSACTION (`:2398-2401`). |
| H7 | Phase 2 shares a file with `sim-guard-word`. | **Partly [M git].** It shares the demo script, `docs/decisions.md` and `docs/log-inbox/simulation.md`. It does not share `simBridge.ts` or its test. That lane merged into the trunk at `7fec9c966`, after this branch was cut. |

## 2. Placement: current and proposed

**Jjodie** (`components/Jodie/JodieWindow.css`), [R]:
- `:871-891`: `.jodie-minimized { position: fixed; bottom: 100px; … left: 30px; z-index: 10000; width: 58px; height: 58px; … }`
- `:893-896`: `.jodie-minimized i { font-size: 26px; … }`
- `:898-902`: `:hover { transform: scale(1.1); … }`
- `:919-924`: `@media (min-width: 769px) { body:has(.editor-v2-palette) .jodie-minimized { left: calc(200px + 30px); } }`

The palette rail is 200 px in both M1 and M2 (`PalettePanel.tsx:126`, `:255`; `EditorV2.scss:1227-1228`).

**Pill** (`components/editor-v2/sim/simulation-panel.scss`), [R]:
- `:45-58`: `.sim-panel { position: absolute; left: calc(200px + 30px + 58px + 16px); bottom: 16px; z-index: 850; …`
- `:77-81`: `&__chip { … height: 32px;`
- The comment at `:47-54` records that the offset follows Jjodie's geometry. The dock is a stacking context, so nothing in the pill can paint over Jjodie: Jjodie must stay clear of the pill's open panel (`discovery_2026-09-24_sim_panel_faces.md`, Phase 2 section, [M 09-24]).

**Editor box** [M 09-24, 09-27]: at 1600×1000 the editor rect is `[1,51,1598,916]`, so E = 967. The panel measured «157.5 px high at top 793.5» (demo script §2.1), which puts its bottom at 951 = E−16. The chip width of 107 was measured on 09-24. The status bar token is `--jj-statusbar-height: 32px` (`styles/tokens/_layout.scss:19`), plus the 1 px frame.

| | now (x, y, w, h) | proposed |
|---|---|---|
| Jjodie (editor tabs) | 230, 842, 58, 58; centre y 871 | 216, 903, 48, 48; centre 927; glyph 24; hover 52.8 |
| chip (closed pill) | 305, 919, 107, 32; centre 935 | 281, 911, 107, 32; centre 927 (bottom 24) |
| open panel | left 305, bottom E−16 | left 281, bottom E−16 (unchanged) |
| gap Jjodie→pill | 17 px horizontal, 19 px vertical offset | 17 px horizontal (16 + frame), same centre line |

The alternative for D1 is a bottom baseline: the chip stays at bottom 16 and Jjodie's bottom sits at E−16, which leaves their centres 8 px apart. Only the dashboard rule (`:912-916`, `.leftbar`) and the <769 px default stay as they are (D2). No other bottom-left overlay exists in the editor. `EditorV2.tsx` has no `<Controls>`, only `<MiniMap>` (`:4218`), and `command grep "^\s*bottom:"` over the editor-v2 SCSS lists only node-anchored rules besides the pill.

## 3. The gate

- The pill's bag is read in `SimulationPanel.tsx:918-925`: `configModelId = isModelMode ? dModel.instanceof : modelid`, then `lookup[configModelId]._state` [R]. The predicate reuses the same rule.
- «Semantic type set» means that `simProfile` is not undefined, null or `''`. This is the first test of `storedProfile` (`simRoleStatus.ts:238-240`) and of `isFirstOpen` (`simRolesDraft.ts:141-145`). An unreadable value (D6) keeps the pill, so the panel's `The stored profile is not readable.` line stays reachable. A user profile made with «Save as…» (JSON) counts as set.
- The gate sits at the mount site, not inside the panel: `return null` inside the panel would keep a run and its canvas marks alive with no controls. At the mount site, unmounting runs `simClear(modelid)` (`SimulationPanel.tsx:318`; `simRunState.ts:198-202` «Removes one model's run (… reset on model change or unmount)»). Switching to Basic in the middle of a run therefore clears the run. The R-row should say so.
- The selector returns a boolean primitive: one lookup per dispatch, and no JSON.

## 4. The Properties field

- `builder.model` (`Info.tsx:454-505`) renders GENERAL (`:481-483`, Name only), DEPENDENCIES, and CONTENTS for a metamodel. `advanced` is passed in from `state.advanced` (`:1592-1593`, `:1812`). Other Advanced-only fields gate the same way, e.g. `:548` `{advanced && <PropertiesToggle … field={'serializable'} …/>}`.
- Following the file's own idiom (local components such as `TypeSelect` at `:301-319`), the field is a local `SemanticTypeField({ modelId })`. It reads the raw value through `useSelector((s) => s.idlookup[modelId]?._state?.simProfile)`, so a dialog Apply or an undo shows up at once. It writes through `LPointerTargetable.fromPointer(modelId).state = { simProfile: v ?? undefined }`.
- Options: `None`, then `PANEL_PROFILE_IDS.map(id => systemProfile(id).name)` (`simRoleStatus.ts:219-221`), which is the order of the panel select and the dialog header (`SimRolesModal.tsx:731`). A user profile or an unreadable value shows as a disabled current option, as the panel does (`SimulationPanel.tsx:632`).
- There are now three writers of the one key: the panel's Profile Apply, the dialog's Apply, and this field. Each is one TRANSACTION.

## 5. What the Properties write does to the dialog and the panel [M]

Probe `_tmp_simgate_paths.ts`, run on the sketches of the four demo metamodels (demo script §2), exit 0, `DIFFS 0`:

```
MEAS 2.1 PEST  firstOpen today:true next:false  match 7 of 10 / 7 of 10   status checkable/checkable  proposals 7/7   samePatchBesidesProfile:true
MEAS 2.2 Petri firstOpen today:true next:false  match 9 of 10 / 9 of 10   status checkable/checkable  proposals 9/9   samePatchBesidesProfile:true
MEAS 2.3 ESM   firstOpen today:true next:false  match 10 of 13 / 10 of 13 status checkable/checkable  proposals 10/10 samePatchBesidesProfile:true
MEAS 2.4 FlowB firstOpen today:true next:false  match 10 of 13 / 10 of 13 status checkable/checkable  proposals 10/10 samePatchBesidesProfile:true
```

The match lines equal the demo script's [M] lines (§2.1 to §2.4). The dialog's Apply then writes the bindings without `simProfile`, because an unchanged value is dropped (`simRolesDraft.ts:201`). `_tmp_simgate_summary.ts` gives the M2 face summary. For the empty bag it prints `Custom`, `notCheckable`, `Node, Transition, Next state, Initial or Initial marking, Source or Owned transitions`, which is the demo script's §1 line verbatim (the control). For `{simProfile:'stateMachine'}` it prints `State machine`, `checkable`, 7 proposals, `pending: true`. The Bound proposal of Petri (`boundEstimate`) needs the store and was not probed here.

`None` (D3): the role keys stay, so choosing the preset again gives the same state. A run on an open M1 tab is cleared by the unmount. Two readers keep reading the bag without the pill. `simCheckSignature` returns non-empty on any `CHECKED_ROLE_KEYS` key (`simCheckToProblems.ts:94`), and `runBag` resolves the profile as «Custom» (`simBridge.ts:145`, `:164`). For a user profile, None deletes its definition; one undo restores it.

## 6. Phase 2 plan

Recommended: one lane in this order. Six code files, above Rule 19's five, are listed here and must be listed in chat again before the first edit. No critical-zone file, and `simBridge.ts` is not needed.

1. `frontend/src/components/editor-v2/sim/simRoleStatus.ts` and `sim/__tests__/simRoleStatus.test.ts`: add `hasSemanticType(bag)` and `simPillVisible(advanced, lookup, modelid, isModelMode)`, tests first. Mutation bench: drop the `advanced` term, drop the bag term, read the M1's own bag instead of its metamodel's, treat `''` as set.
2. `frontend/src/components/editors/Info.tsx`: add the local `SemanticTypeField` and one line in GENERAL of `builder.model`.
3. `frontend/src/components/editor-v2/EditorV2.tsx:4416`: add the gate, `useSelector` plus the predicate.
4. `frontend/src/components/Jodie/JodieWindow.css:919-924`: in the editor rule, 48×48, glyph 24, left `200px + 16px`, bottom E−16. This is Jodie UI, an active area (§2.5).
5. `frontend/src/components/editor-v2/sim/simulation-panel.scss:45-58`: left `calc(200px + 16px + 48px + 16px)`, `&--closed` bottom 24, and the comment.
6. Docs: `docs/demo/models_2026_simulator_demo.md` (§1 Setup, the Apply steps of §2.1 to §2.4, the Undo lines; re-measured), `docs/decisions.md` (R-SIM-97, the next free id after R-SIM-96 on the trunk), the inbox entry, and the Status.

Commits: predicate+tests / field+gate / placement CSS / docs. Probe (`lane-run probe`):
- the gate truth table, Basic/Advanced × None/preset × M1/M2 (8 cells);
- one undo per Properties write;
- None during a run clears the run;
- the rects at 1600×1000, 1280×800 and 1024×768, and in each `data-layout-mode`;
- the 09-24 overlap scan, re-run;
- the four scenes re-walked.

Open branches checked for the six files and the demo script [M, `git diff --name-only <merge-base> <branch>`]: `sim-data-level`, `petri-notation-l2b` and `validation-skeleton` touch none of them. The others are merged.

## 7. Demo script: steps per scene

| | today | Phase 2 (D4 live) |
|---|---|---|
| Setup | open 8 chips (2 per scene) | Advanced 1 (+1 tutorial, `AdvancedModeTutorial.tsx:151-152`); no chips |
| per scene, M2 | Configure… 1, kind 1, Continue 1, Apply 1 = 4 (§2.1, §2.2 [M]) | metamodel in Properties 0/1, Semantic type 2, chip 1, Configure… 1, Apply 1 = 5/6 |
| per scene, M1 | (chip opened in setup) | chip 1 |
| delta | | +2..+3 per scene, +8..+12 in all |

Lines that change: §1 «Empty bag» and «Panel»; each scene's step 1 (picker gone, the Say line moves to Properties); the §2.1 Undo (`State machine · Not checkable`, then a second Cmd+Z hides the pill); §2.4 «the undo stack goes from 1 to 2» becomes 2 to 3. All of these are predictions until Phase 2 measures them.

## 8. Risks

- The alignment holds only while E = viewport − 33. A layout mode that changes the bottom chrome breaks it (§6 probe).
- A bag with roles and no `simProfile` (saved before R-SIM-55, or keys set by hand) shows no pill until its Semantic type is chosen.
- Hover grows Jjodie to 52.8 px, which leaves a 13.6 px gap.

## 9. Files read and probes

Read: `CLAUDE.md`; `docs/PROTOCOL.md` P16; `docs/decisions.md` RC-20, RC-21, RC-33, R-SIM-54, R-SIM-55, R-SIM-78, R-SIM-79, R-SIM-86, R-SIM-94, R-SIM-95; `docs/demo/models_2026_simulator_demo.md` §1 to §2.4; `docs/discovery/discovery_2026-09-24_sim_panel_faces.md` (Phase 2 section); `docs/discovery/discovery_2026-08-19_layout_rail_e_overlay.md` (rows on Jjodie). Under `frontend/src/`: `components/editor-v2/sim/{SimulationPanel.tsx,SimRolesModal.tsx,simRoleStatus.ts,simRolesDraft.ts,simBridge.ts,simRunState.ts,simulation-panel.scss}`, `components/Jodie/{Jodie.tsx,JodieMinimized.tsx,JodieWindow.css}`, `components/editor-v2/EditorV2.tsx` (windows `:4218`, `:4400-4420`), `components/editors/Info.tsx` (windows `:95-130`, `:301-321`, `:440-506`, `:1580-1600`, `:1805-1831`), `hooks/useInterfaceMode.ts`, `pages/components/Navbar.tsx:855-930`, `joiner/classes.ts:2345-2420`, `components/editor-v2/problems/{SimCheckProblemSync.tsx,simCheckToProblems.ts:90-96}`, `model/simulation/profileBinder.ts:30-70`, `styles/tokens/_layout.scss:19`, `components/StatusBar.scss:13`.

Probes (gitignored, `frontend/scripts/smoke/`): `_tmp_simgate_paths.ts` (EXIT=0) and `_tmp_simgate_summary.ts` (EXIT=0), both run with `npx tsx` on `ace820c30`.

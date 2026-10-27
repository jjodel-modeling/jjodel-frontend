# Report 2026-10-12: release 3.1, L4, version 3.1.0, CHANGELOG, decision row, RC-23 crops

- Prompt-ID `P-2026-10-12-0115` (`docs/prompts/claude_2026-10-12_0115_prompt_release_3_1_version.md`), chat
  `C-2026-10-11-1812`, front `release-3-2`, lane full (release commit on the merged trunk). Session
  `003020e7-4488-47a3-ae0f-bd783e0165e4`, unattended.
- Tree `~/jjodel-w-rel31-version`, branch `rel31-version`, start `4df0ef121` (the trunk with L1, L2 and L3 merged),
  `frontend/node_modules` symlinked to `~/jjodel/frontend/node_modules` (set up by the chat). Release commit
  **`4c681e535`** `chore(release): 3.1.0`.
- Executor: Claude Opus 5.5 (`claude-opus-5-5`). No subagent.
- Tags: **M** measured by a command run in this lane, **R** read in a file. Artefacts outside every tree:
  `~/.jjodel-lanes/P-2026-10-12-0115/` (`gates/` the gate outputs, `crops/` the 15 crops, `crop-scripts/` the
  Playwright scripts that made them).
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## 0. Answer in brief

**3.1.0 is committed on `rel31-version`; the combined tree was at its baselines before any edit, and the crops are
taken. One crop (D-A1) shows a difference against its control, for Alfonso's visual GO.**

1. Gates on `4df0ef121`, before any edit (M, §1): typecheck 14 (the §17 set); vitest 9026/9026, the 9 known import
   reds; build exit 0 without `VITE_CODEGEN`; smoke GREEN 12/12 on 3144 at the first run; `check:docs` 5/5;
   `check:codegen-lazy` ALL GREEN (off, on). No regression from the combination of L1, L2 and L3.
2. Version 3.1.0 (M, §2): `frontend/package.json:3`, `frontend/package-lock.json:3` and `:9`, `AboutDialog.tsx:79`.
   The footer reads the package version at build time (`v3.1.0 (5978)` measured on the release build). No other
   string shows «3.0.0» to the user; «Jjodel 3.0» stays in `WelcomeModal.tsx:52` and in an XMI import warning (DA-2).
3. CHANGELOG (§3): `## [3.1.0] - 2026-10-12`, Added / Changed / Fixed / Removed, `## [Unreleased]` empty above it.
4. Decision row (§4): **R-REL-1**, `docs/decisions.md:6063-6069`, before `## Superate`.
5. Crops (§5): 15 files, the ten items of the prompt plus two controls. **D-A1 shows something.** After «Add LaneSet»
   under the Sales lane, three edges enter the frame from outside it. After Auto layout, Sales' three flow nodes are
   laid out outside their lane. The control without the Add keeps them inside (10c against 10d).

**Decisions awaiting Alfonso**: DA-1 D-A1 as observed; DA-2 the WelcomeModal «Jjodel 3.0»; DA-3 the Petri crop's
token dots; DA-4 the row id and placement; DA-5 the visual GO on the 15 crops.

**Questions**
1. D-A1 shows in a different form from the one the LIR predicted (edges from outside the frame, then lane content
   pulled out by Auto layout; no stretched container). Ship 3.1.0 with it? Recommended: yes, and open a maintenance
   discovery that replays crops 10b/10c on `5f25112c4` (the trunk before L1) to tell whether the staging merge caused it.
2. Keep the WelcomeModal title «Jjodel 3.0» (and its seen-key) for 3.1.0? Recommended: yes; a 3.1 «What's new» is
   content of its own, not a version string.

## 1. Gates on the combined tree, before any edit (M, foreground, `4df0ef121`)

| gate | result | baseline |
|---|---|---|
| `npm run typecheck` | exit 2, **14** errors: `api/data.ts` TS2304×2 TS2322; `common/Dummy.ts` TS2307; `EditorV2.tsx` TS2339; `Measurable.tsx` TS2552, TS7053×4, TS2345; `ChatMessages.tsx` TS2322; `ProjectEditor.tsx` TS2769; `Dashboard.tsx` TS2339 | the §17 set |
| `npx vitest run` | exit 1; files 361 passed, **9 failed**, 370; tests **9026 passed of 9026**; 118 s | the 9 failed files are exactly the §17 import reds (`window is not defined` via monaco) |
| `npm run build` (no `VITE_CODEGEN`, `env \| grep -c VITE_` = 0, no `.env*` sets it) | exit 0, 55 s; only the chunk-size warning (plus Sass deprecations and `eval` notices) | exit 0 |
| `npm run smoke` (`SMOKE_URL=http://localhost:3144`, dev server of this tree) | **VERDICT GREEN**, 12 passed, 0 failed, 3 skipped (the declared empty-project gaps), first run; 3 baseline patterns reported IMPROVED («wrong project setup in navbar» 2→0, 2→0, 3→0, «remove from the baseline») | green |
| `npm run check:docs` | exit 0, 5/5 (A-E), 50 warnings, all inbox entries waiting to be folded | green |
| `npm run check:codegen-lazy` (both modes) | ALL GREEN: off 87 chunks, only `setting.ts` of `src/codegen/`, `assets/runner.worker-CKXSmFr8.js` named by no chunk; on 89 chunks, 19 generator modules in `CodePanel-BzPmCgro.js`, which names the worker | green |

- Counts against the lanes (R, their reports): L1 9022 tests, L2 +3 (`useAutoAnchorSubscription.test.ts`), L3 +1
  (the «off» case of `setting.test.ts`): 9026, as measured. The 4 `criticalZone.test.ts` reds of L1 are absent here:
  this session has no `JJODEL_CRITICAL_ZONE_GOAHEAD` (`env | grep -i JJODEL`, empty), which is the ticket's cause.
- After the version edit (M): build exit 0 (2 min 2 s), typecheck 14.
- Outputs: `~/.jjodel-lanes/P-2026-10-12-0115/gates/` (`typecheck.txt`, `vitest.txt`, `build.txt`, `smoke_run1.txt`,
  `check-docs-before.txt`, `codegen-lazy.txt`, `build_after.txt`, `typecheck_after.txt`).

## 2. Version strings

Search (M): `command grep -rn -E '3\.0\.0|v3\.0\b|"3\.0"|Jjodel 3\.0|JJODEL 3|jjodel_welcome_3' src scripts/smoke index.html`
from `frontend/`, tests excluded. Positive control: the same command finds `AboutDialog.tsx:79` `v3.0.0`.

| place | before | action |
|---|---|---|
| `frontend/package.json:3` | `"version": "3.0.0",` | → `3.1.0` |
| `frontend/package-lock.json:3` and `:9` (the root entry: top level and `packages[""]`) | `"version": "3.0.0",` | → `3.1.0`; no dependency entry touched |
| `frontend/src/pages/components/about/AboutDialog.tsx:79` | `<span className="about-dialog__version">v3.0.0</span>` | → `v3.1.0` |
| footer: `vite.config.ts:97` `__APP_VERSION__: JSON.stringify(pkg.version),` → `src/version.ts` → `StatusBarRightZone.tsx:102` `{VERSION_LABEL}` | read from the package | no edit; measured `v3.1.0 (5978)` on the release build |
| `WelcomeModal.tsx:52` `<div className="wm-hero-title" id="wm-title">Jjodel 3.0</div>` | shows «Jjodel 3.0», not 3.0.0 | unchanged (DA-2) |
| `WelcomeModal.tsx:4` `const STORAGE_KEY = 'jjodel_welcome_3_seen';`, `scripts/smoke/states.ts:186` | a key, not shown | unchanged (a new key would show the modal again to every user) |
| `services/export/XMIService.ts:959` «skipped (out of scope in Jjodel 3.0)» | a warning on XMI import | unchanged (not 3.0.0; a scope statement) |
| comments «pre-3.0.0 cleanup» (`ProjectEditor.tsx:723`, `:881`, `:888`, `useAvatar.ts:24`, two SCSS files) | code comments | unchanged |

Seen on the project page (M, crop work shots): the header shows the format as «v2.23» for 2.230, the project's
saved-format number, not the app version. Not changed.

## 3. CHANGELOG

`CHANGELOG.md:9` `## [Unreleased]` (empty), `:11` `## [3.1.0] - 2026-10-12`, `:98` `### Removed`, `:101` the
untouched `## [3.0.0]`. Sources: the `[Unreleased]` text of `c34a03ddb` (10-04), the inventory of the scope report
§8.1, the first-parent merges since `cb699ad58` and their `feat`/`fix` subjects (M, `git log --first-parent --merges`
then `git log <m>^1..<m>^2`), and the staging commits `799e9f50a..cb5952876` with their bodies (#157 A `04d04e100`,
B `a15298e79`; #168 `b3b9fcb9d`..`f4e2254e9`, `4d49a28b7`; #171 `474d445ec`; #173 `88b295f6d`, `a1f3cd5ca`; #174
`b9291259f`..`948ea2884`; #175 `cb02e6a2b`; #176 `ffeff2ec9`, `f3f6e7489`; #178 `e33c628b8`; #179 `e197edff0`; #182
`9e6ecb9cf`).

- The format sentence: «3.1 saves projects in format 2.230 and opens projects saved in formats 2.228 (3.0), 2.229 and
  2.230», plus «A project saved by 3.1 cannot be opened by an earlier version» (R: `VersionFixer.update` throws on an
  unknown version, scope report §3.5).
- The code generator appears once: «The code generator is not part of this release.» The JjEL template interpolation
  (`4eda9c793`, codegen groundwork, inert) is not listed.
- The dark-theme line moves from Known issues to `### Removed`; the Known issues heading, then empty, is dropped.
- The notation list was first written from `derive/notations.ts` and missed three entries. The Derive dialog lists
  eight (M, crop 02/03 work: `generic, statechart, petri, petriClassic, flowchart, flowchartIso, activityUml, erChen`).
  The release commit was amended once for it before anything referenced it: `fb8af485c` → `4c681e535`.
- Claims are user-facing wording of commit subjects and bodies (R). None was verified in a browser except those the
  crops show.

## 4. Decision row

`docs/decisions.md:6063` `## R-REL — release scope (decision 2026-10-11)`, `:6065` **R-REL-1**: «3.1.0 ships now from
the trunk with `origin/staging` absorbed and without the code generator (hidden behind the `VITE_CODEGEN` build
flag); the generator ships in 3.2. Amends R-GEN-1's «no separate 3.1 tag».» Placed after the last active row
(R-NEST-9) and before `## Superate` (`:6071`), because the file's header sends superseded decisions there. Id
`R-REL-1`, not `R-GEN-18`, because the codegen lanes of 3.2 number the R-GEN series
(`git log --all -S'R-GEN-18'` finds only a merge prompt naming it as absent; `R-REL` has no hit). R-GEN-1 itself is
not edited (DA-4).

## 5. Crops (RC-23), release build

`npm run build` from this tree (no `VITE_CODEGEN`), `npx vite preview --port 3144`, Playwright Chromium 1600×1000,
light, offline user seeded as the smoke does. The release build serves no `/src` module, so fixtures are imported
through the UI's own globals (`ProjectsApi.importFromText`, `DockManager.open2`), and every gesture is a click, drag or
key. Jodie talks to a Custom provider whose endpoint `https://mock-llm.invalid/v1/chat/completions` is answered by a
Playwright route, as the Jodie lane did (P-2026-10-10-0045 §7). Where noted, `jjodel.experimental.codegen='true'` and
`theme='dark'` were seeded before boot. Console errors in every run: only `init_dash`, which is in the smoke baseline.
Files in `~/.jjodel-lanes/P-2026-10-12-0115/crops/`. Described, not judged: the visual GO is Alfonso's.

| file | what it shows |
|---|---|
| `01a_new_project_default_class_view.png` | New project in Basic mode, «New metamodel», Class and Attribute dragged from the palette: `NewClass` with `attr_0 : EString` in the default class view; status bar «1 class · 1 attribute». |
| `01b_new_project_default_object_view.png` | Same project, «New model», `NewClass` dragged from Instances: `NewClass_0` with `attr_0 —` in the default object view; «1 instance · conforms to metamodel_1». |
| `02_symbol_editor_open.png` | DemoPetri, viewpoint derived as Petri net (classic), «View for Place» selected in the tree, Symbol tab: the Symbol modal above the rail, preview a circle, Shape Fixed «Circle», corner radius greyed with «Circle ignores the corner radius». |
| `03_sim_petri_classic_steps_and_drag.png` | DemoPetri: Simulation toggle on, profile «Petri net (P/T)» applied on the metamodel, viewpoint «DemoPetri / Petri net (classic)»; Reset, two Steps (choice t1): «Running · step 2 · ε: t1 (p1 → p2 ×2) fired», Marking «lock, p2 ×4»; then p3 dragged from (1073,176) to (1190,262): 0 canvas-error elements, 0 «Maximum update depth». p1 still draws two black dots while the Marking lists no p1 (DA-3). |
| `04_jjscript_run_m1_container_summary.png` | ESM fixture, new `model_1`, Jodie reply (mocked) with six M1 lines including `create instance of Transition "go" in idle.transitions`, Run: one «Script executed» modal, instances 0 → 4 (+4), 6 commands, 624 ms; behind it `idle`'s transitions slot lists `go` [1]. |
| `05_jodie_refuses_reserved_name.png` | Same fixture at M2; the mock answers `create reference copy in Loan type Book` twice: two model calls (the repair turn's roles `system,user,assistant,user`), the reply carries «Run and Step are refused: this script declares reserved identifiers, copy (line 3)»; Run pressed: «Script not executed: 1 error», «'copy' is a JjScript reserved word.», 0 commands; the metamodel's classes unchanged. |
| `06_settings_advanced_no_experimental.png` | Settings → Advanced with the codegen key `'true'`: Developer Options, Data Management, Danger Zone; no «Experimental» and no «Code generation» in the modal's text. |
| `07_m1_editor_advanced_no_code_pill.png` | `model_1` in Advanced mode, codegen key `'true'`: the toolbar from Undo to Hide panel; `[title="Code generation"]` 0 in Basic and 0 in Advanced; no request for `CodePanel-*.js` or `runner.worker-*.js` in the whole run. |
| `08_settings_appearance_no_dark.png` | Settings → Appearance with `theme='dark'` seeded before boot (at boot `html[data-theme]` null, the stored value `dark`): only «Coming Soon»; 0 `input[name="theme"]`, no «Dark» in the modal. |
| `09_about_v3.1.0.png` | Jjodel → About Jjodel: «v3.1.0», «MIT License»; the Jjodel menu stays open behind the dialog's backdrop. Footer «v3.1.0 (5978)». |
| `10a_gv_bpmn_before_add.png` | `gv-bpmn.jjodel` (store version after load `{"n":2.23,"conversionList":[2.229]}`), BPMN viewpoint: Shop with Sales and Warehouse, Customer, Supplier; 21 instances. |
| `10b_gv_bpmn_after_add_before_auto_layout.png` | Right-click on lane Sales → «Add LaneSet (childLaneSet)»: 22 instances, `LaneSet_0` in Sales' `childLaneSet` (store); no new vertex in the DOM, no frame resized; three edges now enter the frame from above the visible area onto Order received, Check order and In stock?, and orange problem dots appear on Order received and Check order. |
| `10c_gv_bpmn_after_auto_layout.png` | Toolbar Auto layout after the Add: Shop 480×192 px, Sales empty; Order received, Check order and In stock? laid out below and outside Shop; Ship and Shipped stay in Warehouse. |
| `10d_control_gv_bpmn_auto_layout_without_add.png` | Control, not in the prompt's list (P12): same file and gesture without the Add; Auto layout keeps Order received, Check order and In stock? in Sales, Ship and Shipped in Warehouse. |
| `10e_gv_bpmn_after_add_zoomed_out.png` | Control, not in the list: the Add again, zoomed out to 60 %: still no new vertex in the DOM; the three edges still start above the frame. |

The build behind the crops was made from the working tree after the version edit and before the commit. Its code is
identical to `4c681e535`; the only later change is CHANGELOG text. The footer therefore reads build `5978`, the count
at `4df0ef121`; a build from the commit reads `5979`.

## 6. Files

Changed and committed in `4c681e535`: `frontend/package.json`, `frontend/package-lock.json`,
`frontend/src/pages/components/about/AboutDialog.tsx`, `CHANGELOG.md`. Docs commit: `docs/decisions.md`, this report.
Log entry: `docs/log-inbox/release-3-1-version.md`, in a docs commit of its own (the `log-entry` skill, as L1-L3
did). The prompt's Status line is not flipped: the flip follows the visual GO (P13).

Read (full paths under `/Users/alfonso/jjodel-w-rel31-version/`): `CLAUDE.md`; `docs/PROTOCOL.md`;
`docs/discovery/discovery_2026-10-11_release_3_1_scope.md` (§0, §6-§10, decisions);
`docs/discovery/discovery_2026-10-12_rel31_staging_merge.md`; `..._rel31_staging_lir.md` (R2 A1, U1-U3);
`..._rel31_drag_hardening.md` (§0-§2); `..._rel31_codegen_flag.md` (§0-§2);
`docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md` (§7, addendum); `docs/decisions.md` (header,
R-GEN, tail); `CHANGELOG.md`; `frontend/package.json`; `frontend/package-lock.json` (1-12); `frontend/vite.config.ts`
(grep); `frontend/src/version.ts`; `AboutDialog.tsx` (70-90); `WelcomeModal.tsx` (40-60); `Navbar.tsx` (1330-1360);
`frontend/scripts/smoke/states.ts` (1-330, 526-540); `frontend/scripts/probe/petri-drag-loop.ts` (1-500);
`frontend/scripts/probe/jjscript-m1-containment.ts` (1-40, 285-345); `frontend/scripts/probe/bpmn-lanes-fixture.ts`
(1-40); `frontend/scripts/gates/check-codegen-lazy.ts` (grep); `TreeViewContent.tsx` (622-704, 1100-1135);
`DeriveViewpointDialog.tsx` (grep); `Info.tsx` (318-345, 515-540); `SimulationPanel.tsx` (940-1060);
`SimRolesModal.tsx` (grep); `types/jodie.ts` (grep, 470-500); `AIProviderService.test.ts` (30-70);
`jjscript/reservedIdentifiers.ts` (1-60); `derive/notations.ts` (80-105).

## 7. Dependencies and risks

- The 2.228 open is in the CHANGELOG on the strength of the 2.228 → 2.229 step's tests; no 3.0.0 save was opened end
  to end yet (L5, P-2026-10-12-0116).
- `assets/runner.worker-*.js` is still emitted in the 3.1 `dist` and named by no chunk (L3's DA1, measured again here).
- PR #184 (staging, format chain) was not re-checked by this lane.
- The crops cover one gesture per item; they are no regression sweep. The D-A1 difference (10c against 10d) has no
  cause yet: the Add, the 2.230 listing, or graphVertex membership. Not measured on the pre-L1 trunk.
- Outside the tree, left in place: `/tmp/r31v/` (scripts, work shots, a `node_modules` symlink to
  `~/jjodel/frontend/node_modules`). The dev server and `vite preview` on 3144 were started and stopped by this
  session. `dist/` and `.vite-cache/` are gitignored.

## Decisions taken (unattended)

1. Gates ran before any edit, in the foreground; the smoke ran on a dev server of this tree on 3144 (P14).
2. «The root entry only» of the lock read as its two root `version` fields (`:3` and `packages[""]` at `:9`).
3. «Jjodel 3.0» in the WelcomeModal and in the XMI warning not changed: neither shows 3.0.0 (the prompt's criterion).
4. CHANGELOG: one sentence added beyond the prompt («A project saved by 3.1 cannot be opened by an earlier
   version»); the empty Known issues heading dropped; the codegen template interpolation not listed.
5. The release commit amended once, before any reference to it, to correct the notation list (`fb8af485c` →
   `4c681e535`); the gates are unaffected (text only).
6. Decision row id `R-REL-1` and its place before `## Superate` (§4); R-GEN-1 left as written.
7. Crops: UI gestures on the release build, the Jodie provider mocked, the codegen key and a dark theme seeded where
   the item tests their absence; two controls (10d, 10e) added beyond the list; 01a and 01b in Basic mode, the rest
   in Advanced.
8. The inbox entry is committed alone, after this report (the `log-entry` skill and L1-L3's practice); the prompt's
   Status line is not flipped (P13: it follows the visual GO).

## Decisions awaiting Alfonso

- **DA-1** (what ships): D-A1 as observed in 10b/10c against 10d. Recommended: ship 3.1.0; open a maintenance
  discovery replaying 10b/10c on `5f25112c4` to tell whether the staging merge caused it.
- **DA-2** (what ships): the WelcomeModal title «Jjodel 3.0» and its seen-key stay. Recommended: keep for 3.1.0.
- **DA-3** (perceptual): in crop 03 p1 keeps two black token dots while the run's Marking has no p1. Recommended:
  judge at the GO; a maintenance ticket if the canvas should show the run's marking there.
- **DA-4** (a decision row): R-REL-1 as id and place, R-GEN-1 not annotated. Recommended: keep.
- **DA-5** (visual GO): the 15 crops of §5, on the RC-23 checklist. Recommended: the GO on 01-09, a separate verdict
  on 10.

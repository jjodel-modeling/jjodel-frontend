# Discovery — #186, the Endpoints section on the project page (Phase 1)

- **Prompt-ID**: P-2026-10-14-1101 (`docs/prompts/claude_2026-10-14_1101_prompt_186_endpoints.md`), chat `C-2026-10-14-1020`.
- **Session**: df3a3d1e-7f08-4d5b-a068-e06d1d9d9d1f (the id `lane-run` keeps in the lane folder, `session.txt`).
- **Tree**: `/Users/juridirocco/development/jjodel-186`, branch `feat/186-endpoints`, HEAD `2ce07f7fa`, clean.
- **Executor**: Anthropic Claude Opus 5.5.
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
  the real files.

## 0. Answer in brief

The section can be built as the plan says, with four corrections from the measures (`MODE=before`, `2ce07f7fa`):

1. **Mounting the steps writes today, but does not mark the project.** Opening «Editable metaclasses» on a
   project saved without an environment creates a `DEnvironmentConfig` (empty) and, when undo recording is on,
   one undo entry; `U.isProjectModified` stays `false`. On the project page, mounted for every developer, that
   would give every project an environment at its next save, and a Ctrl+Z that deletes it. Fix: drop the two
   mount effects and create the config in the first write (`toggle`, «Add role»). Every reader of the config
   already handles null.
2. **`ProjectEditor` is mounted in consumer mode**, under the Configurator page (by hashchange and after a
   reload). The section has to gate itself on `isConsumerMode()` and listen to `hashchange`, as `LeftBar` and
   `Dashboard` do.
3. **The steps' styles are global**: no rule is scoped under `.envgen-modal`, and a checklist appended to
   `<body>` renders as a grid. Nothing has to move.
4. **The wizard has a second door**: Navbar › Tools › «Configure Environment...» (Advanced mode, project open,
   at least one metamodel) opens it. `Navbar.tsx` is outside this lane, so R-CFG-4's «unreached» does not hold
   after this lane unless the listener in `ProjectEditor` changes too (Q1).

Recommendation (Phase 2, eight files, §7): one new `EndpointsSection` (tablist, two tabs, consumer gate,
`revealEndpointsSection()`), its stylesheet, a pure `endpointsModel.ts` (the fold) with its test. In the two
steps: create the config at the first write, use «Role» wording, fold the classes that are not selectable. The
left-bar entry calls `revealEndpointsSection()`. One mount line in `ProjectEditor` (two with Q1).

Decisions awaiting Juri (RC-26 items only):
1. Leaving the Navbar door open would amend R-CFG-4, which Juri ratified («the wizard stays in the code,
   unreached»). Q1 below closes the door without editing `Navbar.tsx`.

Questions:
1. Should the `OPEN_WIZARD` listener in `ProjectEditor.tsx:425-431` reveal Endpoints instead of opening the
   wizard? That is a hunk beyond «the section's mount».
   Recommended: yes; `revealEndpointsSection()` in the listener, the wizard and its event kept (rule 9), Navbar untouched.
2. Confirm the Phase 2 file list of §7 (eight files, rule 19).
   Recommended: confirm as listed.

What would falsify the recommendation: in `MODE=after`, the first click on a metaclass creates the config but
leaves `topLevelTypes` empty (the set lost to the create). The probe's A4 arm reads exactly that.

## 1. Hypotheses under test

- **H1**: the two steps can be mounted on the project page as they are. **Partly.** They render and are styled
  outside the modal (§4.4). Their mount effect writes (§4.2), so they cannot be mounted as they are.
- **H2**: opening a project with the section mounted would create an environment, mark it «Unsaved», and add an
  undo entry. **Partly.** Creation: holds. Undo entry: holds when undo recording is on. «Unsaved»: falsified,
  the flag stays `false` (§4.2).
- **H3**: a consumer never reaches the project page. **Falsified.** `ProjectEditor` is mounted under the
  Configurator page (§4.5).
- **H4**: the left-bar entry is the only door to the wizard. **Falsified.** The Navbar's Tools menu opens it
  too (§4.3).
- **H5**: the fold is a pure function of the rows and the marked ids. **Holds** (§4.6).

## 2. Objective

Measure the untouched code where the prompt asks (`MODE=before`, the oracle). Decide where the config gets
created, how the left-bar entry reaches the section, and where the fold lives. Plan Phase 2.

## 3. Files read

- `CLAUDE.md` (rules 1-28, §5, §6, §8, §17, §21), `frontend/src/styles/CLAUDE.md`, `docs/PROTOCOL.md` (P4, P6,
  P8, P9, P11, P12, P13, P16), `docs/decisions.md` (RC-17, RC-21, RC-25, RC-26, RC-48, R-CFG-1..4),
  `docs/ratifiche/claude_2026-10-14_memo_166_configurator.md`,
  `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md` (whole),
  `docs/log-inbox/standalone-environment.md` (whole: header only, no entry).
- Whole: `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `.../steps/ProfilesStep.tsx`,
  `.../envgen/EnvGenWizardModal.tsx`, `frontend/src/joiner/environmentConfig.ts`,
  `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/components/project/DocumentationSection.scss`,
  `frontend/src/components/environment/consumerMode.ts`, `frontend/src/components/abstract/tabs/ModelsSummaryTab.tsx`.
- Windows: `EnvGenWizardModal.scss` (1-37, 325-420, 800-922, and its selector outline);
  `joiner/classes.ts` (559-598, 655-698, 1325-1352, 3705-3800); `ProjectEditor.tsx` (1-300, 405-440, 470-520,
  1145-1170, 2600-2660, 2840-2985, 3120-3177, plus greps); `DocumentationSection.tsx` (1-60, its classes);
  `project-editor.scss` (1-30, 485-560); `Dock.tsx` (255-360); `DockManager.tsx` (100-160, 250-290);
  `Dashboard.tsx` (570-666); `Navbar.tsx` (380-430, 1515-1560, 1341, 1994); `ConfiguratorTab.tsx` (80-130, 398-415);
  `redux/reducer/reducer.ts` (1240-1300, 1436-1448); `redux/store.tsx` (70-90); `common/U.tsx` (205-245);
  `common/libraries/lastSaved.ts` (95-110); `components/topbar/LastSavedIndicator.tsx` (38-46);
  `components/ui/Checkbox/Checkbox.tsx` (52-75), `SegmentedControl.tsx` (118-150); `envgen/types.ts` (1-45);
  `styles/tokens/_colors-light.scss` (81-124, 376-395).
- The three mockups `~/.jjodel-lanes/assets/166/186_1_endpoints_section.png`, `186_2_roles_customize.png`,
  `186_3_editable_metaclasses.png`.
- Probe: `frontend/scripts/smoke/_tmp_186_probe.ts` (gitignored, `.gitignore:68`). Run through
  `lane-run probe … --port 3186`; log and oracle in `~/.jjodel-lanes/P-2026-10-14-1101/`
  (`probe-_tmp_186_probe.log`, `186_oracle_before.json`).

## 4. Findings

### 4.1 The probe and its runs (measured, `2ce07f7fa`)

Fixture MM186: Scenario, Phase, Learner, Vault, Topic (abstract), Note (only inside Scenario); Phase and Vault
are rootable explicitly. The project is saved **without** an environment, then opened fresh (goto + reload).
Advanced mode is seeded.

Three runs. Run 1 died on the probe's own selector: `Checkbox` renders `<label htmlFor={id}>` with no id when
none is passed (`Checkbox.tsx:54-68`), so the box has no accessible name; the probe now finds the row by its
label text. Run 2 had 1 FAIL, and it was the instrument's. `.appbar-last-saved` read `null` even after a write
that set the flag. The label comes from `formatLastSavedLabel(savedAt, !!(U as any).isProjectModified)`
(`LastSavedIndicator.tsx:41`), but it re-renders on its own tick, not on the static flag, so a read right after
a write is too early (P12). From run 3 on, the flag is the instrument and the label is reported, never asserted.
Run 3 had **0 failed checks, no page errors, EXIT=0**, with the same measures as run 2.

Undo recording needs `U.userHasInteracted` (`reducer.ts:1283` `if (!U.userHasInteracted) return false;`), and
only editor gestures set it (`MetamodelTab.tsx:141`, `EditorV2.tsx:1165`, `ConsumerProposal.tsx:134`). The
probe sets it and `statehistory.globalcanundostate` after the page settles, which is the worst case: a user who
touched an editor earlier in the session. The positive control A4 shows the instrument has signal: the first
write grows the undo stack 1 → 2.

| arm | measure (BEFORE) |
|---|---|
| A0 | fresh open, settled: `config null, modified false, label null, undoable 0` |
| A0.sections | `section-metamodels, -models, -transformations, -viewpoints, -documentation`; after Viewpoints: Documentation |
| A1 | left-bar «Configure environment» opens the wizard (`.envgen-modal`, title «Configure environment») |
| A2 | «Editable metaclasses» mounted, no write: **config created** (`topLevelTypes []`), `modified false`, `undoable 0 → 1` |
| A3 | «Profiles» mounted: the same config, no second entry |
| A4 | per contrasto, first toggle: `topLevelTypes [Scenario]`, `modified true`, `undoable 2` |
| B0 | MM186 rows: Scenario/Phase/Learner/Vault checked; Topic disabled «abstract, it has no instances of its own»; Note checked, enabled, «created inside Scenario: remove it» |
| C0 | no step rule scoped under `.envgen-modal`; mounted checklist `display grid`; a checklist appended to `<body>` `display grid, list-style none` |
| D0 | «profile» texts in the step: `h3 Profiles`, the description, `code #/project?id=…&profile=<id>`, `Add profile`, `No profiles yet.`, `@placeholder New profile name` (plus the wizard's own subtitle, nav item and step-dot title) |
| D1 | after Scenario→Read only, Phase→Hidden, Scenario→Editable: raw `typePermissions` = `["Phase=hidden"]` |
| D2 | link copied = `…/#/project?id=<pid>&profile=<prof>`, equal to the expected one; button «Copied!» |
| E0 | Navbar Tools › «Configure Environment...» is in the DOM and opens the wizard |
| F0/F1 | consumer (hashchange, and reload): Configurator page **and** `.project-editor` with `#section-viewpoints` mounted |
| F2 | back to developer by hashchange: Configurator gone, project page there |

### 4.2 The mount effect (read and measured)

- `MetaclassesStep.tsx:19-21` `useEffect(() => { if (projectId) DEnvironmentConfig.getOrCreate(projectId); }, [projectId]);`,
  and the same at `ProfilesStep.tsx:43-45`.
- `classes.ts:3743-3745` `static getOrCreate(...) { ... return DEnvironmentConfig.getForProject(pid) || DEnvironmentConfig.new(pid); }`.
  `.new` → `Constructors.persist` → `TRANSACTION('Create element', …)` with a `CreateElementAction`
  (`classes.ts:657-676`). Nothing in that path sets `U.isProjectModified`: the only writers are the steps'
  write handlers (`MetaclassesStep.tsx:50`, `ProfilesStep.tsx:81`), `markDirty` in `ProjectEditor.tsx:491-494`
  and the editor paths found by `command grep -rn 'isProjectModified'` (exit 0, 40 lines, the steps among them).
- Measured (A2): config created, flag `false`, one undo entry. So «Unsaved» does not light up. But the config
  sits in the state and the next save persists it, and a Ctrl+Z (with recording on) removes it.

**Where to create instead.** These are the only two writes that can run without a config:
- `MetaclassesStep` `toggle` (`:44-51`) today returns early with `if (!config) return;` (`:45`). New:
  `const cfg = config || DEnvironmentConfig.getOrCreate(projectId)` when `projectId` is set, then the same
  `SetFieldAction` on `cfg.id`.
- `ProfilesStep` `addProfile` (`:83-91`) also returns early on `!config` (`:84`), and its button is
  `disabled={!config}` (`:135`). New: the same create, and the button disabled only on `!projectId`.
- `renameProfile`, `deleteProfile` and `setPermission` need an existing role, so a config already exists.
- No outer `TRANSACTION` around create + set: `persist` opens its own (`classes.ts:696` «there is a
  transaction at .persist method, do not use BEGIN+END/TRANSACTION inside»). The two deltas fall inside the
  merge window of `isRelevantChangeCheck` (`reducer.ts:1281`, `mergeTolerance = U.UpdatingTimer*1.5`). Whether
  they land as one undo entry is measured in `MODE=after`, not assumed.

**What reads a null config meanwhile** (read). `command grep -rn 'getOrCreate\|findEnvironmentConfig(\|getForProject('`
hits `ProfilesStep.tsx:47`, `MetaclassesStep.tsx:23`, `ConfiguratorTab.tsx:90`, `LeftBar.tsx:297` (exit 0); the
helpers' own definitions are the positive control. All four are total on null:
- the steps render unchecked rows and «No roles yet.»;
- `visibleTopLevelTypes(null, …)` returns `[]` (`environmentConfig.ts:100-103`);
- the Configurator prints «No environment is configured for this project yet. … Open **Configure
  environment** in the project sidebar to set it up.» (`ConfiguratorTab.tsx:402-407`), which stays true once
  the entry leads to Endpoints.

Recommendation: create the config at the first write as above. Falsified if, in `MODE=after`, A4 reads a config
with an empty `topLevelTypes` after the first click.

### 4.3 The left-bar entry and the second door (read and measured)

- `LeftBar.tsx:500-503` `{!consumer && <div className="psb-action" onClick={() => window.dispatchEvent(new CustomEvent(EnvGenEvents.OPEN_WIZARD))}>`
  … `<span>Configure environment</span>`. The listener is `ProjectEditor.tsx:425-431`, the only caller of
  `setShowEnvGenWizard(true)` (`:428`; `command grep -n 'setShowEnvGenWizard'` → `:281, :428, :3136`).
- `Navbar.tsx:1543-1546` `{name: 'Configure Environment...', function: () => { window.dispatchEvent(new CustomEvent(EnvGenEvents.OPEN_WIZARD)); }`.
  It is inside Tools, shown when `!(isDashboard || !props.advanced || consumer)` (`:1526`) with
  `isDashboard = !project` (`:1341`) and at least one metamodel (`:1541`). Measured E0: the wizard opens.
- The page reaches a section today by id and `scrollIntoView`: `ProjectEditor.tsx:1159-1162`
  `document.getElementById('section-models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });` after
  one `requestAnimationFrame`.
- The rail asks the project page to activate first: `requestFromProjectEditor` (`LeftBar.tsx`, the
  `DockManager.activateProjectSummary()` call) because `project_summary` may not be the active tab.
  `DockManager.tsx:117-143` says the rail is visible on the summary tab and on the Documentation tab (`doc_*`).
  It is hidden when an editor tab is active (`Dashboard.tsx` `hideLeftBar`), so the entry is never clicked from
  an editor.

Recommendation: `EndpointsSection.tsx` exports `ENDPOINTS_SECTION_ID = 'section-endpoints'` and
`revealEndpointsSection()`. The function calls `DockManager.activateProjectSummary()`, then after two animation
frames calls `getElementById(…)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`. The left-bar entry
calls it. No new event: `events/registry.ts` is outside DOVE, and rule 25 forbids a hardcoded string. For the
Navbar door, Q1.

### 4.4 Markup and styles (read and measured)

- Neighbours: `ProjectEditor.tsx:2877` `<div className="project-section" id="section-viewpoints">` with
  `SectionHeader` (local, not exported, `count` required, `:118-175`). Documentation renders the header markup
  itself, without a count: `DocumentationSection.tsx:99-102` `<div className="project-section">` …
  `<h2 className="project-section-header__title documentation">DOCUMENTATION</h2>`, inside
  `ProjectEditor.tsx:2957` `<div id="section-documentation">`. The mockup shows «ENDPOINTS» with no count, so
  the section copies Documentation's markup.
- Steps' rules, measured C0: every `.envgen-checklist`, `.envgen-section-title`, `.envgen-profile-list`,
  `.envgen-btn`, `.envgen-mm-group`, `.envgen-perm-row` rule is top-level (`scopedUnderModal: []`); read at
  `EnvGenWizardModal.scss:331, 374, 815, 830, 867, 898`. The sheet is imported only by
  `EnvGenWizardModal.tsx:12`, which `ProjectEditor.tsx:38` imports through `../envgen`.
- The mockups show no step heading under the tabs: the description follows the tablist directly.
- Tablists exist elsewhere without keyboard handling (`codegen/ui/CodePanel.tsx:418-425`).
  `SegmentedControl.tsx:118-150` is the repo's roving-tabindex pattern (`tabIndex={selected ? 0 : -1}`, arrow
  keys).
- New prefix `endpoints-section` (classes) with ids `section-endpoints`, `endpoints-tab-*`, `endpoints-panel-*`.
  `command grep -rn 'endpoints-section\|section-endpoints\|endpoints-tab\|endpoints-panel\|EndpointsSection\|endpointsModel\|revealEndpoints\|ENDPOINTS_SECTION' frontend/src`
  exits 1 (absent). Control through the same tool: `section-viewpoints` gives 1 hit, exit 0.
- Tokens, all declared only in `styles/tokens/_colors-light.scss`, none in `styles/tokens.css`, so none of
  them is one of the double-declared names: `--color-selection-bg` (`:383`), `--color-selection-bar` (`:384`),
  `--color-text-tertiary` (`:100`), `--color-bg-hover` (`:84`); spacing `--space-1..4` (`_spacing.scss:14-17`),
  radius `--radius-sm` (`_radius.scss:14`). No variable is defined in the component (rule 28) and no legacy
  token is used (rule 27).
- The fold button can reuse the global `btn btn--ghost btn--xs` (`project-editor.scss:555`, `:593`), the
  section headers' secondary action. No new CSS in the steps, and no edit of the wizard's stylesheet, which is
  outside DOVE.

### 4.5 Consumer mode (measured)

`Dashboard.tsx:663-666` mounts `<ConfiguratorTab variant="page" …>` over the Dock, which «stays mounted
underneath». The Dock always pushes the summary tab (`Dock.tsx:292`, `:345`), and that tab renders
`ProjectEditor` (`ModelsSummaryTab.tsx:14`). Measured F0/F1: `.project-editor` and `#section-viewpoints` are
present in consumer mode, by hashchange and after a reload. So `EndpointsSection` must return `null` when
`isConsumerMode()` (`consumerMode.ts:22-24`) holds. It must re-read on `hashchange`, as `LeftBar.tsx:279-285`
does, because `ProjectEditor` does not re-render on a hash change. Otherwise the steps (and, before §4.2's fix,
the config creation) would run under every consumer.

### 4.6 The fold (read and measured)

Today every class is listed and the ones that cannot be offered are disabled:
`MetaclassesStep.tsx:84` `disabled={!!it.reason && !marked}`; reasons come from `topLevelReason`
(`environmentConfig.ts:149-161`). Measured B0: Topic disabled with its reason, Note marked with «…: remove it».

The helper goes in `frontend/src/components/project/endpointsModel.ts`, with zero imports so it loads under the
vitest node environment (`vitest.config.ts:14-16`, `include: ['src/**/__tests__/**/*.test.ts', …]`), and
outside `joiner/`:

```ts
export function splitSelectable<T extends { id: string; reason: string | null }>(
    items: readonly T[], marked: readonly string[],
): { shown: T[]; folded: T[] }   // shown: no reason, or marked; folded: a reason and not marked; input order kept
export function foldToggleLabel(count: number, open: boolean): string  // 'Show 3 not selectable' | 'Hide not selectable'
```

Tests (`__tests__/endpointsModel.test.ts`) and the mutation that kills each:
- **T1**, a row without a reason is shown. Killed by M2.
- **T2**, a row with a reason and not marked is folded. Killed by M2 and M4.
- **T3**, a row with a reason that is marked is shown. Killed by M1.
- **T4**, input order is kept in both lists, interleaved. Killed by M3.
- **T5**, every item lands in exactly one list. Killed by M4 and M5.
- **T6**, empty input gives empty lists, and a marked id absent from the items adds no row. Killed by M6.
- **T7**, the two label forms. Killed by M7.

The mutations, each commented out one at a time, with the test that must go red:
- M1 drop `|| marked.includes(id)`;
- M2 invert the reason test;
- M3 sort or reverse the output;
- M4 `shown = items`;
- M5 put the marked rows in `folded` too;
- M6 build rows from `marked`;
- M7 a hard-coded count in the label.

## 5. Dependencies and risks

- The parallel lane `P-2026-10-14-1100` (#187) touches neither these files nor `ProjectEditor.tsx`, per its
  DOVE as the prompt states (RC-22). It merges first.
- The steps are also the wizard's. After this lane the wizard (if it is still reachable, Q1) shows the «Role»
  texts and creates the config at the first write too. That is consistent, and its own header (out of DOVE)
  still says «by which profile» (`EnvGenWizardModal.tsx:140`), as do its nav label and step-dot title.
- The default name of a role added with an empty field changes from 'New profile' to 'New role'
  (`ProfilesStep.tsx:85`). It is a string stored on new roles only; no existing data changes.
- `components/project/EndpointsSection.tsx` importing `DockManager` adds no cycle: `ProjectEditor.tsx:25` and
  `LeftBar.tsx:12` already import it.
- Components that do not import under node (the section, the steps) get no source-text test (CLAUDE.md §5). The
  probe is their measure, and the gap goes in the log entry.

## 6. Decisions taken (unattended)

1. The config is created at the first write (`toggle`, «Add role»); the two mount effects go. That is the
   change COSA 2 asks for, not removal of unused code.
2. The fold helper lives in `components/project/endpointsModel.ts`, with zero imports and its test under
   `__tests__/`.
3. The fold button reuses `btn btn--ghost btn--xs`. Closed it reads «Show N not selectable», open «Hide not
   selectable», one per metamodel group that has folded rows. Not remembered across mounts.
4. The section copies Documentation's header markup without a count. Default tab: «Editable metaclasses» (the
   order of the work), not remembered. Tabs: `role="tablist"` with an `aria-label`; buttons with `role="tab"`,
   `aria-selected`, `aria-controls` and a roving `tabIndex`; ArrowLeft/ArrowRight/Home/End move and select;
   panel `role="tabpanel"`, `aria-labelledby`. Icons `bi-grid-1x2` and `bi-people` (the wizard's own,
   `types.ts:33-34`).
5. Inside the Endpoints panel the steps' `h3` is hidden by one rule in `EndpointsSection.scss`, as the mockups
   show; the tab names the panel. Revocable at the visual check.
6. `EndpointsSection` imports `../envgen/EnvGenWizardModal.scss` itself, so it does not depend on
   `ProjectEditor` importing the wizard. Vite loads a module once.
7. The consumer gate lives in the section (`isConsumerMode()` plus `hashchange`); the section returns `null`.
8. «Done» texts are reworded to «save it with Save or Ctrl+S» in both steps. The URL example keeps `profile=`
   (rule 2).

## 7. Phase 2 plan

Files (rule 19, eight):

| # | File | What changes |
|---|---|---|
| 1 | `frontend/src/components/project/EndpointsSection.tsx` (new) | the section, the tablist, the consumer gate, `ENDPOINTS_SECTION_ID`, `revealEndpointsSection()` |
| 2 | `frontend/src/components/project/EndpointsSection.scss` (new) | tabs and panel, tokens of §4.4; hides the steps' `h3` inside the panel |
| 3 | `frontend/src/components/project/endpointsModel.ts` (new) | `splitSelectable`, `foldToggleLabel` |
| 4 | `frontend/src/components/project/__tests__/endpointsModel.test.ts` (new) | T1-T7 |
| 5 | `frontend/src/components/project/ProjectEditor.tsx` | import and mount `<EndpointsSection />` between Viewpoints and Documentation; with Q1 = yes, the `OPEN_WIZARD` listener calls `revealEndpointsSection()` |
| 6 | `frontend/src/components/envgen/steps/MetaclassesStep.tsx` | no mount effect; create at the first toggle; wording; the fold per group |
| 7 | `frontend/src/components/envgen/steps/ProfilesStep.tsx` | no mount effect; create at the first «Add role»; every profile text says role (§4.1 D0) |
| 8 | `frontend/src/pages/components/LeftBar.tsx` | the «Configure environment» entry calls `revealEndpointsSection()` |

Docs, closure only and not committed until the GO: `docs/log-inbox/endpoints.md` (new) and the prompt's
`Status` line.

Commits (code), in order:
1. `feat(#186): fold helper for not selectable metaclasses`, files 3-4, with the bench in the body;
2. `feat(#186): steps write nothing at mount, Role wording, fold`, files 6-7;
3. `feat(#186): Endpoints section on the project page`, files 1, 2, 5 and 8.

Probe `MODE=after`, the same arms against the oracle: A0.order, A0.title, A1.c (in view and no wizard),
A2.c (both tabs mounted: no config, no flag, no undo entry), A3.tabs, A4 (the first write creates and sets,
falsifier of §4.2), B1-B3 (the fold), C1 (styled outside the modal), D1.c/D2.c (the same raw
`typePermissions` and the same link), D3-D5 (no «profile» but the URL, no «Done»), E0 (the Navbar door, after
Q1), F2.c/F3.c (no section in consumer mode, back in developer mode). The AFTER table goes beside the BEFORE one.

Gates, in the foreground from `frontend/` with exit codes: `npm run typecheck`, `npm run test`,
`npm run build`, `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`, and the committed
smoke through `_tmp_172_smoke.ts` (copied to a `_tmp_186_smoke` port guard if its 3172 check refuses 3186).

Visual checklist for Juri, each item read from the DOM:
1. Endpoints sits between Viewpoints and Documentation, with the same header style.
2. The two tabs switch with a click and with the arrow keys.
3. The active tab is light blue, as in the mockup.
4. Roles tab: «Add role», a role selected, the permission rows.
5. Editable metaclasses: «Show N not selectable» per group; Topic appears disabled after it is pressed.
6. «Configure environment» in the left bar scrolls to the section.
7. Perceptual: spacing and hierarchy against the mockups (Juri's judgement).

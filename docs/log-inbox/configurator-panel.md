# log-inbox — lane «configurator-panel» (#187)

Entries written by the #187 Configurator panel lane while sessions share this tree (P9, parallel
lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this
order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-15 — feat(#187): the Configurator panel and the consumer chrome
**Prompt**: `claude_2026-10-14_1100_prompt_187_configurator_panel.md`, full lane, director Juri (chat `C-2026-10-14-1020`): #187 steps 1 and 2 of the #166 plan. Phase 1 report `41d6f3e81`; Phase 2 after Juri's GO (ten files, composition creation only, the report's questions 2-5 as recommended): the consumer's app bar without Save, last-saved label and Basic/Advanced, the role chip beside «Configurator», and a panel of its own in place of `InstanceDetail` (Identity / Attributes / Components, field titles with cardinality labels, reference cards and pickers, composition cards, Save and the issues in its header).
**Files touched**: `e893f7191`: `frontend/src/pages/components/Navbar.tsx`, `frontend/src/components/environment/ConfiguratorTab.tsx`, `configuratorTab.scss`. `afecf5bd8`: `environment/configurator/panelModel.ts`, `configurator/__tests__/panelModel.test.ts`. `8f414c0e4`: `configurator/ConfiguratorPanel.tsx`, `PanelFields.tsx`, `PanelComponents.tsx`, `ComponentPicker.tsx`, `configuratorPanel.scss`. `95537be08`: `ConfiguratorTab.tsx`. Docs: `41d6f3e81` (the report), this inbox, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — measured: `_tmp_187_probe.ts` AFTER step 1 22/22 and step 2 78/78 against the BEFORE table (every gesture's raw values, the Data Manager's text and class census equal), `_tmp_187_157b.ts` 18/18, 0 page errors; typecheck 0 errors; vitest 9064 passed, the nine known files red at import; build exit 0; check:docs 5/5, check:addonly and check:scripts green; smoke 12/0/3. Not measured: the date, colour, duration, email and url widgets in the panel (same `IRFormField`, read); «+ Add» disabled on a bounded multi-valued composition (unit-tested in `panelModel`, not in the DOM).
**Out-of-scope changes**: no — ten files, the list Juri confirmed in the GO (rule 19)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO of 2026-10-17, in his browser on this tree's dev server (port 3187), developer overlay and the stand-alone link of role Edu on the MM172 fixture; before it the chat's independent probe `chat_187_independent.mts`, 12/12, no page error. The lane's own probes on the same server: the 14 criteria of #187 read from the DOM, overlay and stand-alone page with the role «Edu» (edit, read and hidden types); screenshots `187_after_s2_overlay.png`, `187_after_s2_page.png` in `~/.jjodel-lanes/P-2026-10-14-1100/`.
**Notes**: Dropped by Juri's decision: in the Configurator no pick of an existing element into a composition and no eviction to the root (the Data Manager keeps both). Changed on purpose: a read element renders without inputs (before, 4 tabbable controls inside the pointer-only gate). Decisions, measures: `docs/discovery/discovery_2026-10-14_187_configurator_panel.md`; tables and logs in the lane folder. No unit test of the panel (it does not load under node); its pure rules are `panelModel` (bench 14/14).
**Prompt document name**: 2026-10-14 11:00

**Ticket** (found by the probe, not fixed here): with the developer's Configurator overlay open over the Data Manager, both render the same field ids (`ir-field-<slotId>`, two per field measured), so a title's `<label for>` resolves to the Data Manager's control first; every input keeps its own `aria-label`, and the stand-alone page measures unique ids. The same duplication existed before (two `IRForm`s). Also: the delete confirmation (`DeleteDialog`, the host's) still says «profile», where R-CFG-4 says «Role» in the UI.

## 2026-10-17 — merge: feat/187-configurator-panel into staging (P-2026-10-17-0950)
**Prompt**: `claude_2026-10-17_0950_prompt_merge_feat-187-configurator-panel.md`, a direct merge by `lane-run merge --direct`, no session: `feat/187-configurator-panel` at `ce402506c` into `staging`, merge base `358a91da3`, 7 commits on the branch side.
**Files touched**: merge `5bf91bf01`: 13 files from the branch side (`docs/discovery/discovery_2026-10-14_187_configurator_panel.md`, `docs/log-inbox/configurator-panel.md`, `docs/prompts/claude_2026-10-14_1100_prompt_187_configurator_panel.md`, `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configurator/ComponentPicker.tsx`, `frontend/src/components/environment/configurator/ConfiguratorPanel.tsx`, `frontend/src/components/environment/configurator/PanelComponents.tsx`, `frontend/src/components/environment/configurator/PanelFields.tsx`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5bf91bf01` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9064 tests in 371 files, 9 red at import, hooks 681; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: passato — chat, unattended, 12/12: the chat's independent probe chat_187_merged.mts rerun on the merged tree (main tree vite on port 3190, MM172 fixture, developer overlay and role Edu), no page error; Juri's visual GO of 2026-10-17 was given on the lane tree (port 3187)
**Notes**: Rollback tag `pre-feat/187-configurator-panel` on `358a91da3` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-17-0950/result.json`.
**Prompt document name**: 2026-10-17 09:50

## 2026-10-27 — fix(#187, #186): the Configurator after @tmaog's test, R-CFG-6..9
**Prompt**: `claude_2026-10-20_1123_prompt_187_tmaog_round1.md`, full lane, director Juri (chat `C-2026-10-14-1020`). Phase 1 report `e9c5f232e`; Phase 2 after the GO of 2026-10-21 (eight files, questions 1 and 3 as recommended, question 2 by Juri: no «+ New» button under a filled single card). The extended level at any depth, references included (R-CFG-6); a × on every single reference (R-CFG-7); Save's colour and the remembered instance (R-CFG-9); Cancel and arrows in the Endpoints window (R-CFG-8).
**Files touched**: `dd23b757e`: `frontend/src/components/environment/configurator/panelModel.ts`, `configurator/__tests__/panelModel.test.ts`, `configurator/PanelComponents.tsx`, `configurator/ConfiguratorPanel.tsx`, `configurator/configuratorPanel.scss`. `0fd775d28`: `PanelComponents.tsx`, `ConfiguratorPanel.tsx`. `669ac5e65`: `frontend/src/components/environment/ConfiguratorTab.tsx`. `4bdf69ed6`: `frontend/src/components/project/EndpointsWindow.tsx`, `EndpointsWindow.scss`. Docs: `e9c5f232e` (the report), this inbox, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-10-14 11:00
**Causa**: (a)
**Regressions**: no — measured: `_tmp_187b_probe.ts` AFTER STEP=4 54/54 against BEFORE v2 (step 0, untouched tree); `_tmp_187_probe.ts` 78/78 (named adaptations: C1, D4 for «(none)»; pOpen, pRemove, S2.10a, S2.8c, S2.14c, the L1 locator for R-CFG-6), `_tmp_187_157b.ts` 17/17, `_tmp_186_probe.ts` 40/40 (port 3187, D2.c port-normalised), 0 page errors; typecheck 0; vitest 9077 passed, the nine files of §17 red at import; build exit 0; check:docs, check:addonly, check:scripts green.
**Out-of-scope changes**: no — eight files, the list Juri confirmed in the GO (rule 19)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO of 2026-10-27 on this tree's dev server (port 3187); the chat's independent probes `chat_187_on187b` 12/12 and `chat_187d_independent` 10/10, all green. The committed smoke is red on A4 only, 3/3 states: two console errors of the notifications widget, whose host `jjodel-notifications.alfonso-pierantonio.workers.dev` does not resolve from this machine (github.com does); environmental, the same errors on the untouched tree at step 0
**Notes**: Cost, dev build: Scenario_0 holds 8 element views instead of 2, one panel re-render (Expand PhA) 150.9 → 221 ms median (J2); a card expansion costs ~150 ms plus ~16 ms per card already open (J1). Declared: T1 held by teacher and cohost renders its field ids twice (GO 4). `PanelFields.tsx:72-73` still calls the expansion «child cards» (not in the list). Mutation bench of `canUnlink` 5/5. Measures: `docs/discovery/discovery_2026-10-20_187_tmaog_round1.md`, logs in the lane folder.
**Prompt document name**: 2026-10-20 11:23

**Ticket** (found by the probe, not this lane's, not investigated): after a reload of the stand-alone link (`&profile=`) on the probe's fixture, a `.loader-spinner` (`span.spinner-animated` inside `div.loader-spinner`) sits on top of the page centre over `div.configurator__detail`: measured by `elementsFromPoint(720, 450)` after NAV_MS in every K arm (Phase 1 run 4, step 0, steps 1-4); in Phase 1 run 3 a pointer click on an instance row waited 45 s and timed out against it, while DOM clicks (the same handlers) work. The project was saved with the model editor open in the dock.

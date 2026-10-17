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

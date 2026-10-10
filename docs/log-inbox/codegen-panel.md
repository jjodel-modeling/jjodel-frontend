# log-inbox — lane «codegen-panel»

Entries written by the code generation S5 lane on `codegen-panel` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — feat(codegen): experimental setting, lazy Code panel, navigable origin (P-2026-10-10-1825)
**Prompt**: `claude_2026-10-10_1825_prompt_codegen_s5_panel.md`, full lane on `~/jjodel-w-codegen-panel`, branch `codegen-panel`: slice S5 of the pilot (R-GEN-2, R-GEN-3, R-GEN-12, R-GEN-14; discovery §E, §H.3, §I.5). Setting with hook and registry event, checkbox in Settings → Advanced, one lazy mount and one «Code» pill in EditorV2, the panel (Templates, Output, Run, hover, click and canvas linking), the lazy gate, vitest, browser probe, crops, mutation bench.
**Files touched**: code `f95d0a44f`: `frontend/src/codegen/setting.ts`, `frontend/src/codegen/__tests__/setting.test.ts`, `frontend/src/codegen/ui/{CodePanel.tsx,CodePanel.scss,TemplateEditor.tsx}`, `frontend/scripts/gates/check-codegen-lazy.ts`, `frontend/scripts/probe/codegen-panel.ts` (all new); `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/events/registry.ts`, `frontend/src/pages/settings/AdvancedSettings.tsx`, `frontend/package.json`. This commit: `docs/log-inbox/codegen-panel.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. tsc 14, the base set; vitest base `d7ac77f87` 8052 tests in 330 files, slice 8064 in 331 (+12), the same 9 red at import; build exit 0; `check:codegen-lazy` ALL GREEN; `typecheck:scripts`, `check:scripts` exit 0; probe 41/41, node boxes of the four demo scenes 0 px against the base (temporary worktree at `d7ac77f87`, removed). Bench 6/6 killed (commit body).
**Out-of-scope changes**: no. Twelve files over two commits, above five (RC-11, rule 19): each in the prompt's DOVE, which is the confirmation; no tokens file was needed. No other path touched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 41/41 on 3086; 8 crops in `~/.jjodel-lanes/P-2026-10-10-1825/crops/`, light theme, sizes in the probe log; the visual GO of the chat and Alfonso is pending)
**Notes**: Deviations: the gate also reads Rollup module ids, the manifest lists chunks (M1 stays green on the manifest clause alone); `[data-id]` measured on the element's vertex, RF ids are DVertex ids; pill on M1 editors only; Run calls the exported main(); the pill's place is measured by observers in EditorV2's CodegenSlot, about 50 lines; R-GEN-14 edge path not exercised, no demo draws one. Probe open() forces a document load: in-place switching flaked on base and slice.
**Prompt document name**: 2026-10-10 18:25

**Ticket** (S4's, still open): load time counts against `timeoutMs`. The probe gave the first Run of each module 60000 ms; the later `while (true) {}` run stopped at 1598 ms on a 1500 ms timeout, warm. Untouched here (`runner/` is outside DOVE).

## 2026-10-10 — ticket: EditorV2's onKeyDown deletes the selection on Backspace typed in a TEXTAREA
**Ticket**: `EditorV2.tsx:2842-2851` (`f95d0a44f`) returns early for INPUT and SELECT only, so Backspace or Delete typed in a TEXTAREA (or a contenteditable) rendered inside the editor root, not portaled, runs `deleteSelected()` on the canvas selection. Measured by the bench of P-2026-10-10-1825 (M6): the code panel without its key isolation lost the selected node `tc`, 10 nodes to 9. The code panel stops propagation at its root; other textareas under the editor root are not audited.
**Priority**: medium
**Found in**: P-2026-10-10-1825

## 2026-10-10 — merge: codegen-panel into alfonso-frontend-jjtl (P-2026-10-10-2018)
**Prompt**: `claude_2026-10-10_2018_prompt_merge_codegen-panel.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-panel` at `715e7bee6` into `alfonso-frontend-jjtl`, merge base `21d8dc2e7`, 4 commits on the branch side.
**Files touched**: merge `601ec1379`: 13 files from the branch side (`docs/log-inbox/codegen-panel.md`, `docs/prompts/claude_2026-10-10_1825_prompt_codegen_s5_panel.md`, `frontend/package.json`, `frontend/scripts/gates/check-codegen-lazy.ts`, `frontend/scripts/probe/codegen-panel.ts`, `frontend/src/codegen/__tests__/setting.test.ts`, `frontend/src/codegen/setting.ts`, `frontend/src/codegen/ui/CodePanel.scss`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `601ec1379` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8078 tests in 331 files, 9 red at import, hooks 501; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: direct merge gates green: typecheck 14 = base, vitest 8078 tests in 331 files (9 red at import as base), build, check:docs/agents/scripts/addonly exit 0; visual GO by Alfonso 20:18 after RC-23 on 8 crops
**Notes**: Rollback tag `pre-codegen-panel` on `f753bf0d9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-2018/result.json`.
**Prompt document name**: 2026-10-10 20:18

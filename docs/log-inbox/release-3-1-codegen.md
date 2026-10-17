# Log inbox — release 3.1, L3 codegen flag

Entries for the release 3.1 lane L3 (front `release-3-2`, P-2026-10-12-0012), kept out of the active
`docs/claude-code-log.md` while parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-12 — feat(codegen): VITE_CODEGEN build flag hides the generator (P-2026-10-12-0012)
**Prompt**: `claude_2026-10-12_0012_prompt_release_3_1_codegen_flag.md`, release 3.1 L3: the generator behind a build flag read as `import.meta.env.VITE_CODEGEN === 'true'` (1812 report §2.7, D3), the lazy gate in an off and an on mode, the bundle measured both ways, a visual check on 3143.
**Files touched**: code `d7c1f3df3`: `frontend/src/codegen/setting.ts`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/pages/settings/AdvancedSettings.tsx`, `frontend/src/codegen/__tests__/setting.test.ts`, `frontend/scripts/gates/check-codegen-lazy.ts`. Report `ebd074dfe`: `docs/discovery/discovery_2026-10-12_rel31_codegen_flag.md`. This entry: `docs/log-inbox/release-3-1-codegen.md` (new).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane, DOM on 3143, 2/2 with a flag-on control; `npm run smoke` RED at run 1 (cold start, empty-project not reached), GREEN 12/12 at run 2
**Notes**: Partial: §2.7 expected the worker dropped too; Vite still emits runner.worker-*.js (1827 B) in the off build, named by no chunk, and only vite.config.ts can drop it (DA1). Flag read as the bare import.meta.env text under @ts-ignore: the (import.meta as any) idiom is invisible to vitest's env replacer (6/13 red). Benches: test 3/3; gate off 1 and off 3 red on an un-gated EditorV2. Type feat(codegen) chosen (P6). Codegen probes now need VITE_CODEGEN=true (DA2).
**Prompt document name**: 2026-10-12 00:12

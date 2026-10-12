# log-inbox — lane «codegen-examples»

Entries written by the code generation S8 lane on `codegen-examples` (P9, parallel lanes). Whoever
closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-11 — feat(codegen): the two lecture examples as importable project files (P-2026-10-11-1415)
**Prompt**: `claude_2026-10-11_1415_prompt_codegen_s8_importable_examples.md`, full lane on `~/jjodel-w-codegen-examples`, branch `codegen-examples`: slice S8. Discovery of the project export and import path, one importable file per lecture example written by the app's own export, a script that rebuilds them, a round-trip probe through the user's import, a node test, the READMEs for students, three crops, mutation bench.
**Files touched**: report `2cf1ae68c`: `docs/discovery/discovery_2026-10-11_codegen_importable_examples.md`. Code `4a7fb2755`: `frontend/public/examples/codegen/{turnstile,petri-producer-consumer}.jjodel`, `frontend/scripts/examples/build-codegen-examples.ts`, `frontend/scripts/probe/codegen-examples.ts`, `frontend/src/codegen/examples/__tests__/importable.test.ts` (all new); `frontend/src/codegen/examples/{turnstile,petri-producer-consumer}/README.md`. This commit: `docs/log-inbox/codegen-examples.md` (new).
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 20:29 (`claude_2026-10-10_2029_prompt_codegen_s6_oracle.md`: its ticket, no path in the app installs an example)
**Causa**: (a)
**Regressions**: no. tsc 14 errors, the §17 set; vitest `src/codegen` 18 files 329 tests on the base, 19 files 345 on the slice, all green; build exit 0, both files in `dist/examples/codegen/`, byte-identical; `check:codegen-lazy` ALL GREEN; `typecheck:scripts`, `check:scripts` exit 0. Probes: codegen-panel 46/46, codegen-oracle 35/35, codegen-check 43/43, unchanged; codegen-examples 71/71; build script 21/21. Bench 3 of 3 killed, survivors in the commit body.
**Out-of-scope changes**: no. Nine files over three commits, above five (RC-11, rule 19): each in the prompt's DOVE, taken as the confirmation. The bench mutated `src/common/U.tsx` and `src/pages/components/Project.tsx` for one run each; both restored, `git diff` empty, never committed.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 71/71 on 3097; crops `import_dashboard.png` 1360x420, `turnstile_check.png` 536x515, `petri_check.png` 536x515 in `~/.jjodel-lanes/P-2026-10-11-1415/crops/`, light theme; the RC-23 check of the chat and Alfonso's GO are pending)
**Notes**: Extension `.jjodel`, not `.jjodel.json`: the drop zone and the import menu accept no other (report F2). The prompt's `ExportImportMenu`/`ImportDropZone` are Ecore/XMI only and unmounted (F1). Imports are named `<name> copy`, then `copy2`. The Petri file keeps the scene's `demoNet`. Run passes at the default 2000 ms. The probe applies the README's mutation line as written. Report: `docs/discovery/discovery_2026-10-11_codegen_importable_examples.md`.
**Prompt document name**: 2026-10-11 14:15

**Ticket** (follow-up, gates): `typecheck:scripts` includes `smoke/` and `gates/` only, so `scripts/probe/` and the new `scripts/examples/` are not type-gated; the two new scripts were checked here by a gitignored tsconfig. Also read, not run: `ProjectEditor.tsx:561-573` downloads a `{format_version, metadata, project}` wrapper as `.jjodel` (button at `:2416`), which `importFromText` does not read (it expects `id` and `state` at the top level).

## 2026-10-11 — merge: codegen-examples into alfonso-frontend-jjtl (P-2026-10-11-1542)
**Prompt**: `claude_2026-10-11_1542_prompt_merge_codegen-examples.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-examples` at `06bf2dd10` into `alfonso-frontend-jjtl`, merge base `ec1a12ab0`, 5 commits on the branch side.
**Files touched**: merge `87d05057c`: 10 files from the branch side (`docs/discovery/discovery_2026-10-11_codegen_importable_examples.md`, `docs/log-inbox/codegen-examples.md`, `docs/prompts/claude_2026-10-11_1415_prompt_codegen_s8_importable_examples.md`, `frontend/public/examples/codegen/petri-producer-consumer.jjodel`, `frontend/public/examples/codegen/turnstile.jjodel`, `frontend/scripts/examples/build-codegen-examples.ts`, `frontend/scripts/probe/codegen-examples.ts`, `frontend/src/codegen/examples/__tests__/importable.test.ts`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `87d05057c` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8636 tests in 357 files, 9 red at import, hooks 662; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 on the S8 crops (import from the dashboard, Check green on turnstile 7 steps and Petri 8 steps), GO by Alfonso 15:37; all trunk gates green
**Notes**: Rollback tag `pre-codegen-examples` on `ee5c07c2f` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-11-1542/result.json`.
**Prompt document name**: 2026-10-11 15:42

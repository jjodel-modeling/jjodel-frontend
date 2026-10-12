# log-inbox — lane «maintenance»

Entries written by the maintenance lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-12 — fix(types): 11 of the 14 baseline typecheck errors cleared in six files (P-2026-10-12-2000)
**Prompt**: `claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md`, full lane (more than 3 files), one phase, director Juri (chat `C-2026-10-12-1955`), lane 1/3 of `chain-P-2026-10-12-2000` in the worktree `jjodel-tc0` on `fix/typecheck-baseline-zero`: six one-site edits that the compiler erases, typecheck measured before and after, the chat's oracle on the emitted JavaScript.
**Files touched**: `b3f44be17`: `frontend/src/common/Dummy.ts` (line 46 deleted), `frontend/src/components/Jodie/ChatMessages.tsx` (line 282), `frontend/src/components/editor-v2/EditorV2.tsx` (line 3350), `frontend/src/components/forEndUser/Measurable.tsx` (line 271), `frontend/src/components/project/ProjectEditor.tsx` (line 227), `frontend/src/pages/components/Dashboard.tsx` (line 599). This commit: this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — every gate read as expected on its complete output, with its exit status: typecheck exit 2 with 14 errors before (the §17 list) and exit 2 with 3 after, all in `src/api/data.ts` (TS2304 ×2, TS2322); vitest 9 files red at import (the nine of §17), 9037 tests green in 361 files; build exit 0; check:docs 5/5; check:addonly and check:scripts exit 0. The oracle printed six `IDENTICAL JS`. The built bundle is the same bytes: `npm run build` on HEAD's content and on the edited tree, both at `e76c59c55`, 3501 files of `dist`, sha256 equal one by one.
**Out-of-scope changes**: no — eight files, above five (rule 19, RC-11), the eight of the prompt's DOVE: `Dummy.ts`, `ChatMessages.tsx`, `EditorV2.tsx`, `Measurable.tsx`, `ProjectEditor.tsx`, `Dashboard.tsx`, one line each; this inbox; the prompt's Status line.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — P8 derogated by the prompt, the oracle is the reason: `_tmp_tc0_jsdelta.cjs HEAD`, control ok, six `IDENTICAL JS` under `ts.transpileModule` 5.9.3, each `source changed: true`, exit 0. Measured beyond it, because Vite transforms with esbuild and not with tsc: under esbuild 0.27.7 five files are byte-identical and `Dummy.ts` differs in 29 lines by one local rename (the top-level import `i` gone, esbuild no longer renames the file's local `i` to `i2`; `i2` replaced by `i` in the old output gives the new one exactly). No dev server, no browser.
**Notes**: Derogations declared by the prompt: P4 (no discovery phase, no hard stop) and P8 (no visual check). Eight files: the six code files, this inbox, the prompt's Status line. The P8 reason, «byte-identical JavaScript», holds for tsc's emit and for the built bundle; under esbuild, which Vite serves in dev, `Dummy.ts` is the same program with one local renamed: Juri decides whether that is enough. Slice 2 uses the same tsc oracle.
**Prompt document name**: 2026-10-12 20:00

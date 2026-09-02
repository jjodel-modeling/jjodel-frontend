## 2026-09-02 — fix(persistance): save riallinea project.__raw dopo il bump di versione
**Prompt**: VER1 (corsia L1, parallela) — `ProjectsApi.save` legge la versione da un `__raw`
stantio: due save espliciti sullo stesso `LProject` producono `1.1` due volte. Riprodurre con
una sonda contro il dev server, censire i lettori di `version`, correggere nel punto minimo,
test unitario accanto a quello DIRTY1 e invertire l'asserzione che il difetto lo registrava
com'era. Non toccare la regola ratificata 2026-08-24 (il silent save resta senza bump).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts`,
`frontend/src/api/__tests__/projectsSaveVersion.test.ts` (nuovo) — commit `1ac3b1863`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc --noEmit` **33** sull'output completo (baseline invariata), **0** nei
file toccati; `build` exit 0 col solo warning di chunk; `vitest` intera **3131 passati, 0
falliti**, i 9 file che non si raccolgono riverificati su un worktree staccato su HEAD e
risultati **identici** (stessa lista, `window is not defined` in `monaco-editor/.../window.js:14`
e `src/utils/PerformanceMetrics.ts:220`, nessuno dei due toccato).
**Out-of-scope changes**: no — l'inversione del test DIRTY1 è la stessa correzione, chiesta dal
prompt.
**Layer Impact Report**: not-required — nessun file della critical zone §3.1: `projects.ts` non
è in elenco, non passa da `useJjomSync`/`syncState`/`canvasToJjom`/`portDistribution`/
`VersionFixer`, e la scrittura D-layer che tocca è il `SetFieldAction` già presente, invariato.
**Smoke visivo**: non applicabile — nessun pixel cambia; la verifica è la sonda
`_tmp_ver1_verify.ts`, **5 FAIL su 7 prima, 0 su 7 dopo**, stabile su due corse.
**Notes**: La causa misurata: il reducer copia lungo il path (`reducer.ts:540`), quindi
`idlookup[id]` diventa un oggetto nuovo e il proxy resta agganciato al precedente —
`project.__raw === idlookup[id]` vero al baseline, falso dopo il primo save. Il fix riallinea
`project.__raw.version` dentro `if (!silent)`, dopo il `SetFieldAction`: non attraverso il
proxy, che sparerebbe un secondo delta d'undo. Scartata l'alternativa «il proxy rilegge sempre
da Redux»: è `proxy.ts`, cioè core (regola 5) e ogni entità dell'app. Censiti i lettori: nessuno
dipende dal valore stantio (`ProjectEditor.tsx:2152,725,753` riceve `project` da `connect`,
`Project.tsx:363,522,639` legge il DProject della dashboard, `projects.ts:399` è una guardia su
`!version`). Tre mutazioni tutte rosse: riallineamento rimosso 6 FAIL, riallineamento anche sul
silent 2 FAIL, `getNextVersionNumber` → identità 8 FAIL.
**Prompt document name**: PROMPT_VER1.md — 2026-09-02

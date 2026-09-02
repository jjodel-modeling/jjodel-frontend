## 2026-09-02 — fix(editor-v2): il gate dello Step 4 concorda con la passata che protegge (BOOT1)
**Prompt**: su un grafo creato da zero il bootstrap non produce archi — tre nodi radice, zero archi, ne' la containment ne' la reference.
**Files touched**: frontend/src/components/editor-v2/hooks/useJjomSync.ts, frontend/src/components/editor-v2/sync/m1EdgeGate.ts (nuovo), frontend/src/components/editor-v2/sync/__tests__/m1EdgeGate.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_boot1_verifyC.ts`: 10 PASS/3 FAIL prima, 13 PASS/0 FAIL dopo; canvas 3 nodi 2 archi; pageerror 0)
**Notes**: Il grafo esisteva: la premessa «mai avuto un grafo» e' falsa per lo stato osservato. Lo Step 4 e' protetto da un contatore calcolato prima che lo Step 2bis crei i vertici, quindi 0 su un grafo appena ripopolato; lo Step 3 non e' protetto e i suoi archi li disegna. L'asimmetria era il difetto. Referto: docs/discovery/discovery_2026-09-02_boot1_bootstrap_archi.md.
**Prompt document name**: 2026-09-02 (in chat)

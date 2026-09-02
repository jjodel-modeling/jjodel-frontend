## 2026-09-02 — fix(editor-v2): la create dal manager instanzia vertice e arco sul canvas
**Prompt**: VIEW1, corsia parallela a VER2 — un figlio di containment creato dal Data
Manager esisteva nel modello e non compariva sul canvas. Misurare la divergenza alla riga,
chi possiede l'identita', quanti canvas; scegliere fra (a) simmetria dei percorsi e (b) il
canvas autorita' sul layout, con il punto 3 come discriminante.
**Files touched**: `frontend/src/components/editor-v2/hooks/createAdapter.ts`,
`.../hooks/__tests__/createAdapterFlow.test.ts` (nuovo) — commit `783a8245d`.
Referto: `docs/discovery/discovery_2026-09-02_view1_create_manager_vertice.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: no — `tsc` 33 (baseline esatta, 0 nei due file), `build` exit 0, `vitest`
3147 verdi / 0 falliti (i 9 file `window is not defined` sono pre-esistenti, riverificati,
nessuno nel perimetro). Sonda 13/3 -> 16/0, `pageerror` 0 in entrambe le corse.
**Out-of-scope changes**: no — due file, pathspec esplicito al commit; staged EGO1 e il
perimetro VER2 (`api/persistance/`, `reducer.ts`) non toccati.
**Layer Impact Report**: produced — in chat prima del diff. D-layer (`DVertex.new`,
`DVoidEdge.new2` da un sito nuovo) e canvas v2-flow; nessun file di §3.1 modificato, le due
funzioni erano gia' esportate e gia' chiamate cosi' da `ContextMenu.tsx:371-372`.
**Smoke visivo**: passato — sonda guidata dalla UI vera del Data Manager, 16 PASS / 0 FAIL.
**Notes**: Scelto (a). (b) usciva dal perimetro di visita `model.objects`, ratificato in
CRUD3 F2, e voleva uno Step 4 che riparte sulle scritture di slot, che §3.5 vieta. Nessuna
nozione di canvas attivo esiste (grep vuoto, controllo positivo a 7 file): l'idioma e' primo
match, gia' in due posti. **Deroga P6 (RC-11)**: tipo di commit non indicato, scelto `fix`
invece di chiederlo. Aperto: figlio creato senza canvas non recuperato all'apertura.
**Prompt document name**: PROMPT_VIEW1.md — 2026-09-02

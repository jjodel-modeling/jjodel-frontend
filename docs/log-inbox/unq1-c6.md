## 2026-09-02 — fix(problems): l'appartenenza al modello e' un campo su NodeProblem
**Prompt**: UNQ1 C6, corsia L2 parallela — chiudere il terzo punto di §C5.4: un campo
opzionale additivo su `NodeProblem` che nomini il modello di appartenenza, scritto da
**entrambi** i produttori, e la revoca che lo usa al posto di `ownedIdsByModel`, se e solo
se tiene il caso dell'elemento cancellato che §C5.2 tiene.
**Files touched**: `frontend/src/components/editor-v2/problems/registry.ts`,
`.../problems/UniquenessProblemSync.tsx`, `.../problems/ConformanceProblemSync.tsx`,
`.../problems/__tests__/UniquenessProblemSync.test.ts` (commit `bc939442b`).
Referto in coda a `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (`e153c8fe2`).
Coda `7f8fa2242`: tre puntatori di riga della nota, scritti contro i file prima della
modifica. **Deroga RC-13 dichiarata (RC-11)**: quel commit tiene `registry.ts` e il referto
insieme — stessa correzione, sole righe di commento, ma e' un commit misto.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — sonda `_tmp_unq1c6.ts`: le sette righe della tabella di C5.3 verdi
prima **e** dopo, `pageerror` 0 in entrambe le corse; `tsc` 33 (baseline esatta, 0 nei
quattro file), `build` exit 0, `vitest` 3131 verdi / 0 falliti (i 9 file `window is not
defined` sono pre-esistenti, riverificati, nessuno nel perimetro).
**Out-of-scope changes**: no — quattro file, sotto la soglia dei cinque, pathspec esplicito
al commit; staged EGO1 e WIP VER1 in `api/persistance/` non toccati.
**Layer Impact Report**: not-required — il registro dei problemi e' una `Map` di modulo
lato UI: nessuna scrittura D-layer, nessun proxy L, nessun TRANSACTION, nessuna persistenza.
**Smoke visivo**: passato — sonda 22 PASS / 0 FAIL contro il dev server (prima: 15/7).
**Notes**: `ownerModelId`, non `modelId`: la conformance registra anche sull'id del
`DVertex`, che vive nel grafo non nel modello, e per l'unicita' il valore e' il `DModel` di
un metamodello quando e' un metamodello a essere aperto. Punto 4: `ownedIdsByModel`
**rimossa** — scritto alla registrazione, il campo tiene l'elemento cancellato perche'
l'owner e' nel dato. Test 7 -> 12, quattro mutazioni rosse. Censimento lettori, nome e
misure in §C6.1-C6.4 del referto. Deroga RC-13 in `7f8fa2242`, sopra.
**Prompt document name**: PROMPT_UNQ1-C6.md — 2026-09-02

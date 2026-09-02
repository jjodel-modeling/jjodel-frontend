## 2026-09-02 — chore(gates): Check B accetta solo la forma (x) per Causa
**Prompt**: CODA di chiusura L1–L4, punto 3 — Check B passava sia `**Causa**: (a)` sia
`**Causa**: a`. Restringere alla sola forma parentesizzata, misurando prima le conseguenze
su attivo e archivio. Hard stop se Check B scandisse anche l'archivio (il «no back-filling»
vieterebbe di emendare le entry pregresse).
**Files touched**: `frontend/scripts/gates/check-docs.ts` (commit `c9bd6112a`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run check:docs` **3/3, exit 0, 2 warning** prima e dopo, invariati.
Nessun file applicativo, nessun impatto su build o typecheck.
**Out-of-scope changes**: no — un solo file, pathspec esplicito.
**Layer Impact Report**: not-required — script di gate, nessun layer applicativo.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Check B scandisce il solo log attivo; l'archivio serve a risolvere `Corregge`,
non viene lintato: nessuna entry pregressa toccata, niente hard stop. `Corregge` non prende
una lettera ma `YYYY-MM-DD HH:mm`, già vincolato da `TIMESTAMP_PREFIX`: la restrizione vale
per la sola `Causa`. Forme in archivio: **118 `(x)`, 8 nude, 3 di prosa**. Controllo positivo
`Causa: e` → ERROR. Il gate non ha test: dichiarato, non creato.
**Prompt document name**: PROMPT_CODA_batch_L1-L4.md — 2026-09-02

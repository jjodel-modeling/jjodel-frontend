# Log inbox — default view parity (P-2026-09-18-2219)

Entries for the default-view-parity lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

## 2026-09-19 — feat(ir): object view default parity with abstract syntax
**Prompt**: `claude_2026-09-18_2219_prompt_default_view_parity.md` — Fase 1 discovery (hard stop),
poi Fase 2 a batch con GO espliciti in chat: S1 (`TextStyle.underline`) + `cornerRadius` +
parità del seed (bordo/etichetta/separatore), verifica S3 (`EnableIRPanel` delegava già a
`irDefaults.ts` per vertex ed edge — nessuna modifica), item 4 (terminazione dell'arco — già lo
stato del codice, nessuna modifica), fix della regressione trovata durante S5 sull'identità delle
view migrate.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`,
`irCompile.ts`, `IRNodeContent.tsx`, `irDefaults.ts`,
`viewpoint/ir/__tests__/ir.test.ts`, `docs/discovery/discovery_2026-09-18_default_view_parity.md`
(+ due probe non tracciati, lasciati nello scratchpad di sessione), `docs/decisions.md` (R-IRN-29..34).
Commit: `400095370`, `12ae8c41c`, `6ee6efcd5`, `971234d94`, `516afd310`.
**Outcome**: ✅ completed — parità del chrome misurata a zero delta (light e dark) su una object
view nuova; regressione sulle view migrate trovata durante la stessa sessione e corretta prima
della chiusura (`516afd310`).
**Corregge**: —
**Causa**: c — la modifica alla factory (`400095370`) non ha considerato la dipendenza di
`isMigratedDefaultView` sulla sua forma esatta; scoperta e corretta nello stesso task, non in un
task successivo.
**Regressions**: yes — vedi R-IRN-33. Ogni progetto migrato da `VersionFixer` 2.225→2.226
(`637a5e238`, 2026-07-18 in poi) ha smesso di delegare al renderer nativo dopo `400095370`/`6ee6efcd5`,
tornando a renderizzare via interprete IR sulla propria `ir` non aggiornata (raggio 4px, bordo
grigio, nessuna sottolineatura). Fix in `516afd310`: forma pre-batch congelata
(`LEGACY_OBJECT_VIEW_SNAPSHOT`), riconosciuta insieme a quella corrente. Tre nuovi test
verificati su mutation bench (§5): la sola forma pre-fix fa fallire esattamente il test che nomina
la regressione.
**Out-of-scope changes**: no — ogni file toccato era nominato da Alfonso nei GO di fase, incluso
`ir.test.ts` per il fix.
**Layer Impact Report**: not-required — nessuno dei file toccati e' nella critical zone di §3.1/§3.2
(`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
`useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `defaultViewTemplate.ts`, `DV.tsx`).
**Smoke visivo**: passato per una view nuova (verifica visiva di Alfonso dopo il batch 4, canvas
`:3001`, light e dark). Non ancora verificato a schermo per un progetto migrato pre-`400095370`
(R-IRN-34) — solo a livello di unità (`isMigratedDefaultView`).
**Notes**: durante la verifica del fix e' stato usato `git stash push -- irDefaults.ts` su albero
condiviso (violazione RC-13/§6.4), rilevato e corretto subito (pop immediato, nessun'altra corsia
toccata, verifica poi rifatta con `git show HEAD:<path>`). Dettaglio in R-IRN-33.
**Prompt document name**: 2026-09-18 22:19

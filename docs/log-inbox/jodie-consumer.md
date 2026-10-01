# log-inbox — lane «jodie-consumer» (#168)

Entries written by the #168 lanes (Jodie for the stand-alone consumer of #157) while sessions
share the trunk `feat/168-jodie-consumer` (P9, parallel lanes). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The
active log is not touched by these lanes.

---

## 2026-10-01 — feat(#168): JjScript rifiuta ciò che il profilo non consente (J5, lane B)
**Prompt**: P-2026-10-01-2302, #168 B (J5): nello stand-alone (`?profile=`) l'esecutore JjScript rifiuta per comando ciò che il profilo vieta (comandi M2, create/set/rename/delete su tipi non `edit`, link verso tipi `hidden`), con un modulo puro testato che legge `resolveTypePermission`; in developer mode esecuzione identica.
**Files touched**: `frontend/src/jjscript/executor/permissionGuard.ts` (nuovo), `frontend/src/jjscript/executor/__tests__/permissionGuard.test.ts` (nuovo), `frontend/src/jjscript/executor/executor.ts` — `b3b9fcb9d`; `docs/discovery/discovery_2026-10-01_168_b_guard.md` — `f1992b96a`; `docs/log-inbox/jodie-consumer.md` e la riga Status del prompt nel commit di chiusura.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — tsc 14, stesso insieme della baseline; build exit 0; vitest `src/jjscript` 492/492 (rosso solo il noto `context-binding.test.ts`); sonda 3043 17/17, con D1-D3 in developer mode.
**Out-of-scope changes**: no — 3 file di codice, il DOVE ristretto dal GO.
**Layer Impact Report**: not-required — nessun file di §3.1; `instance.ts` non toccato.
**Smoke visivo**: non applicabile — lane senza interfaccia; sonda `_tmp_168_b_guard.ts` su 3043, 17/17.
**Notes**: Le sette raccomandazioni del referto adottate da Juri nel GO. Profilo letto dal vivo in executeAST (JjodieAPIImpl chiama executeCommand senza il servizio), quindi types.ts e JjScriptService.ts intatti. Banco: 16/16 mutazioni uccise sul modulo puro (corpo di b3b9fcb9d); una sull'adattatore, link hidden non controllato, uccisa dalla sonda (C5). Developer mode per contrasto, non confronto con il codice pre-modifica. Due ticket sotto.
**Prompt document name**: 2026-10-01 23:02

## 2026-10-01 — ticket: in consumer le letture JjScript nominano istanze di tipi hidden
**Ticket**: Il guard di J5 consente `list`, `show`, `eval` e `validate` in consumer mode perché non scrivono il modello, ma il loro output può nominare istanze (e tipi) che il profilo marca `hidden`: nella console di Jodie o in una risposta eseguita il fruitore vede ciò che il Configurator gli nasconde. Va deciso con J2 (contesto filtrato dal profilo) se filtrare l'output o rifiutare le letture su tipi `hidden`. Soft gate come tutto #157 (D1).
**Priority**: medium
**Found in**: P-2026-10-01-2302
**Detail**: docs/discovery/discovery_2026-10-01_168_b_guard.md

## 2026-10-01 — ticket: delete a cascata e link di contenimento toccano elementi read o hidden
**Ticket**: Il permesso è della classe esatta dell'istanza, come nel Configurator (`InstanceDetail.tsx:474`). Due scritture vanno oltre: `delete instance x` di un tipo `edit` cancella a cascata i figli contenuti anche se di tipo `read` o `hidden` (`instance.ts:495`, canonical cascade), e `set a.parte = b` su un riferimento di contenimento può spostare `b` anche se è di tipo `read`. Né il guard di J5 né il Configurator lo controllano. Da decidere in J4, con la misura M0 sul contenimento.
**Priority**: medium
**Found in**: P-2026-10-01-2302
**Detail**: docs/discovery/discovery_2026-10-01_168_b_guard.md

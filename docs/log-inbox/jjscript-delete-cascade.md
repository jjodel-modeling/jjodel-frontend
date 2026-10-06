# log-inbox — lane «jjscript-delete-cascade» (#171)

Entries written by the #171 lane (JjScript `delete instance` leaves the contained elements with a
`father` that no longer resolves) on branch `fix/171-jjscript-delete-cascade`, main worktree.
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-06 — fix(#171): il delete JjScript di un contenitore cancella anche gli elementi contenuti
**Prompt**: chat di Juri: «passiamo alla risoluzione del 171», opzione (a) già scelta sulla issue: `instance.ts:537` passa da `.delete()` a `preflightFor` + `deletePlan` + `applyDelete`, lo stesso piano del Configurator; 1 file più il test, nessuna modifica al core. (b), core, in una corsia a parte con #174.
**Files touched**: `474d445ec`: `jjscript/executor/commands/instance.ts`, `jjscript/executor/__tests__/instanceDelete.test.ts` (nuovo). Docs: questa inbox. Branch da `881dbf15e`.
**Outcome**: ✅ completed
**Corregge**: 2026-07-16 23:22 (prompt «2026-07-16 instance_delete_dangling_refs», senza orario: ora del commit `6aaa31227`)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` output COMPLETO **14**, l'insieme di §17; vitest 5671 passati, i 9 file noti in errore d'import; `npm run build` exit 0; sonda 13/13; verificatore dello step A di #157 20/20 (percorso consumer invariato).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — `instance.ts` non è in §3.1; `deleteAdapter` e `shapeAdapter` solo chiamati, nessun TRANSACTION esterno (regola 12).
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12 (3 skip dichiarati); sonde `_tmp_171_verify.ts` 13/13 e `_tmp_157_close_verify.ts` 20/20 sul :3000 di questo albero. Nessuna UI toccata.
**Notes**: Verdetto dirty: nessuna scrittura prima, i puntatori entranti tolti per valore come prima. Drain `settlePendingWrites` prima del piano: senza, V3 rosso (link del `set` nella stessa raffica non visto). Sonda: 4 FAIL su 13 su `881dbf15e`, 13/13 dopo. Unit 8 test, banco 8/8. Messaggio e `affectedElements` contano i contenuti. Adapter importati lazy come `action.ts`: 2 avvisi Rollup «dynamically imported» nuovi, 5 già nella baseline.
**Prompt document name**: 2026-10-06 11:41 (chat)

**Ticket** (medium, da misurare): il guard del profilo (`permissionGuard.containedTypes`) segue `composition || aggregation` e gli slot senza feature; il piano (`deleteDraw.descendantsOf`) solo `composition`. Se un link `aggregation` ripadre il target (lo dice il commento di `executor.ts` su `LReference.containment`), cancellare il contenitore lascia quel figlio orfano anche nel Configurator e nel Data Manager. Materia della corsia (b) con #174 («con le relazioni di contenimento»).

**Ticket** (low): nella sonda, un riferimento semplice aggiunto al metamodello DOPO le composizioni non ha avuto lo slot nelle istanze create poi (4 run); aggiunto prima, sì. Visto solo via automazione (RC-8), non riprodotto a mano. E §17 dice «solo l'avviso chunk-size» per la build: la baseline stampa già 5 avvisi «dynamically imported», ora 7.

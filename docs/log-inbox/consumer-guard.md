# log-inbox — lane «consumer-guard» (#176)

Entries written by the #176 lane (the JjScript profile guard in the stand-alone environment) on
branch `fix/176-guard-set-after-create`, main worktree. Whoever closes the batch moves them into
`docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The active
log is not touched by this lane.

---

## 2026-10-06 — fix(#176): in consumer un set che nomina l'elemento appena creato passa il guard
**Prompt**: chat di Juri: «lavoriamo a risolvere la issue 176», punto 2 (un `set` subito dopo un `create` rifiutato come `PROFILE_UNRESOLVED`); soluzione già indicata: il guard ricava il tipo dal `create` dello stesso script, senza dipendere dai tempi dello store; locale in `executor.ts`, test puro; nessuna decisione aperta.
**Files touched**: `ffeff2ec9`: `jjscript/executor/executor.ts`, `jjscript/executor/permissionGuard.ts`, `jjscript/executor/__tests__/permissionGuard.test.ts`. Docs: questa inbox (nuova). Branch da `f1ec8e34f`.
**Outcome**: ✅ completed
**Corregge**: 2026-10-01 23:02 (`claude_2026-10-01_2302_prompt_168_b_guard.md`, lane B di #168)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` output completo **14**, l'insieme di §17; vitest 7894/7894, i 9 file noti rossi all'import; `npm run build` exit 0; sonda 17/17 con i controlli invariati (pausa 400 ms, target hidden, create hidden, developer).
**Out-of-scope changes**: yes — `permissionGuard.ts` oltre a `executor.ts`: `instanceType` vi si sposta perché il banco possa eseguirla (§5, `executor.ts` non si importa in node), più il nuovo `rememberCreated`.
**Layer Impact Report**: not-required — nessun file di §3.1; `instance.ts`, `dependencies.ts` e `handleRegistry.ts` non toccati.
**Smoke visivo**: non applicabile — nessuna interfaccia toccata; sonda `_tmp_176_verify.ts` (`JjScriptService.execute` con lo scope di Jodie) sul :3000 di questo albero, 6 FAIL su 17 prima, 17/17 dopo, zero errori di pagina.
**Notes**: Banco 7/7 sul modulo puro: fallback tolto, memoria prima dello store, fallback senza id, create fallito tenuto, ultima classe, niente controllo id, niente lista vuota. Il collegamento in executor.ts lo copre la sonda. La memoria vive nell'istanza dell'executor: se getExecutor la ricrea fra create e set, il guard rifiuta come prima. La pausa di C2 (f7fde9973) resta, serve all'undo (R-UNDO-5). Il punto 1 di #176 resta aperto.
**Prompt document name**: 2026-10-06 15:24 (chat)

## 2026-10-06 — fix(#176): in consumer le letture JjScript che stampano il modello sono rifiutate
**Prompt**: chat di Juri: «controlla il punto 1 se è chiuso, nel caso risolvi e chiudi la issue». Misurato aperto: in consumer `list`, `show`, `eval`, `validate` nominano il tipo e l'istanza hidden, dal servizio e da un'offerta «Run» di Jodie fatta in developer e cliccata dopo il passaggio al consumer senza ricarica. Scelta l'opzione «rifiutare» della issue, su tutte e quattro.
**Files touched**: `f3f6e7489`: `jjscript/executor/permissionGuard.ts`, `jjscript/executor/__tests__/permissionGuard.test.ts`. Docs: questa inbox. Branch `fix/176-guard-reads` da `96a840b4d`.
**Outcome**: ✅ completed
**Corregge**: 2026-10-01 23:02 (`claude_2026-10-01_2302_prompt_168_b_guard.md`, lane B di #168)
**Causa**: (a)
**Regressions**: no — typecheck 14, l'insieme di §17; build exit 0; vitest: rossi i 9 di baseline più 9 file in timeout sotto carico (load fino a 83), 7 verdi al rilancio, 2 file degli hook (`laneRun`, `laneRunDirect`, 6 test) ancora in timeout anche in sequenza: `frontend/scripts` identico fra `96a840b4d` e `f3f6e7489`, nessun import del guard. Sonda del punto 2 ancora 17/17.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile — nessuna interfaccia toccata; sonda `_tmp_176_reads.ts` sul :3000, 2 FAIL su 13 prima (R1 servizio, R2 offerta di Jodie a clic reali), 13/13 dopo.
**Notes**: Rifiuto con PROFILE_COMMAND_LOCKED, profilo trovato o no, prima di ogni altro controllo; help e block passano, developer invariato. Filtrare l'output non regge: eval raggiunge ogni istanza. Al fruitore non manca nulla: la lane D ha tolto la console, la C2 blocca i passi unsupported. Banco 5/5: rifiuto tolto, solo con profilo trovato, help rifiutato, eval escluso, rifiuto prima del controllo developer.
**Prompt document name**: 2026-10-06 15:24 (chat)

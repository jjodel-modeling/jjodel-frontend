# Prompt Claude Code — Landing migration VersionFixer `2.226 -> 2.227` (CRITICAL ZONE)

**Tipo**: fix (migration di schema). **Critical zone**: `frontend/src/redux/VersionFixer.tsx` è in CLAUDE.md §3.1 → serve **Layer Impact Report + hard stop + go-ahead esplicito di Alfonso prima del diff**. Il LIR è già prodotto (sotto): ripresentalo e ATTENDI go-ahead prima di scrivere.

## Contesto (già fatto, NON rifare)

Nella sessione cloud del 2026-07-21 sono già stati committati (branch `alfonso-frontend-jjtl`, se hai applicato le patch VersionFixer):
- Il **fix dei 2 push radici in `XMIService.ts`** (rami multi/single-root dell'import M1) — ecore-io 36/36 verde. NON toccare di nuovo XMIService.
- Il **prototipo provato** `frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts` (vitest 12/12): contiene la funzione `migrate_2226_to_2227` che è **il body esatto da inlineare**.
- Il discovery report `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`.

Questo prompt copre SOLO il landing del metodo migration in `VersionFixer.tsx`.

## COSA

Aggiungere il metodo `private ['2.226 -> 2.227'](s: DState): DState { ... }` alla classe `VersionFixer`, con la logica **identica** alla funzione `migrate_2226_to_2227` del file di test. `highestVersion` si aggiorna da solo dal nome del metodo (nessuna costante da bumpare).

La migrazione bonifica i salvataggi pre-fix `4811db8`:
- **FASE A** — dedup slot DValue per (DObject, meta-feature): dedup `features` per id; raggruppa per `instanceof` (skip undefined); superstite = **Opzione A** (slot non-mirage valorizzato); merge dei `values` dei loser (**Format B**, dedup pointer); rimozione loser; **riordino** di `features` secondo `metaClass.features` SOLO sugli oggetti bonificati.
- **FASE B** — dedup pointer: `DModel.objects` (radici) e `DValue.values` pointer-array (figli containment; solo se tutti i values risolvono a DObject).
- **FASE C** — pulizia (una passata) degli id rimossi da `s.values`, `metaFeature.instances`, `DGraphElement.model`, `pointedBy` (per secondo segmento del `source`), e reparent di `child.father` loser→survivor.

## DOVE

`frontend/src/redux/VersionFixer.tsx`, subito **dopo** il metodo `['2.225 -> 2.226']` (termina intorno a riga 1040) e **prima** della chiusura `}` della classe. Segui lo stile dei metodi esistenti (`['2.216 -> 2.217']`, `['2.217 -> 2.218']`): iterazione su `s.idlookup`, mutazione in place, `console.log('[VersionFixer 2.226 -> 2.227] ...')` con i conteggi, `return s`.

## COME

1. Copia il corpo di `migrate_2226_to_2227` dal file di test, **rimuovendo** lo scaffolding `export function`/`DStateLike` e usando la firma `(s: DState): DState`. Le helper interne (`dedupKeepFirst`, `isPointerArray`) restano funzioni locali dentro il metodo.
2. NON cambiare la logica: il file di test è la **spec eseguibile**. Se un tipo `DState` rende necessario un cast (`as any`) su campi non tipati (`e.isMirage`, `e.instances`, `e.pointedBy`, `e.model`, `e.father`), usalo puntualmente — non allargare lo scope.
3. NON aggiungere dipendenze, NON toccare altri metodi, NON rinominare nulla.
4. Aggiorna `docs/claude-code-log.md` a fine task (dopo conferma visiva di Alfonso).

## Gate

- `npm run typecheck` = baseline Δ0 (33 locale / 14 cloud).
- `npm run build`.
- `npx vitest run src/redux/__tests__/versionfixer_2227_migration.test.ts` → 12/12 (il test resta come guardia di regressione della logica; se lo adatti a importare il metodo reale, mantieni verdi gli stessi 12 casi).

## Smoke (Alfonso, localhost, hard refresh) — vedi discovery §Finding 5

1. Progetto sporco pre-fix → una sola riga per feature nel nativo e nell'IR; feature assenti dall'XMI restano una riga vuota singola.
2. Conteggio edge M1 invariato.
3. Edit in place di un attributo importato → cambia la riga visibile.
4. Save → reopen → nessuna modifica al secondo load (log migrazione assente).
5. Export XMI del modello bonificato identico all'export pre-bonifica.
6. Progetto pulito → log a zero, nessun cambiamento visivo.
7. Undo subito dopo il load → non riporta i duplicati.
8. Import XMI **fresco** (post fix radici) → `dModel.objects` con ogni radice UNA volta.

## LAYER IMPACT REPORT (già prodotto — ripresenta e attendi go-ahead)

```
LAYER IMPACT REPORT — VersionFixer ['2.226 -> 2.227']

Layers touched:
  [x] D-layer (Redux raw data)      — dedup/merge DValue, dedup DModel.objects, pulizia riferimenti
  [ ] L-layer (computed proxies)    — NON toccato
  [ ] JjOM (model entities)         — NON toccato
  [ ] Canvas v2-flow                — NON toccato
  [ ] Canvas classic                — NON toccato
  [ ] Sync layer (useJjomSync)      — NON toccato
  [x] Persistence (VersionFixer)    — nuovo metodo migration

Per il D-layer:
  - Cosa cambia: rimozione degli slot DValue mirage duplicati e dei loser Format B (merge dei values nel
    superstite); dedup delle radici same-id in DModel.objects e dei pointer figli nei containment; pulizia
    dei riferimenti pendenti (instances, s.values, pointedBy, DGraphElement.model, child.father).
  - Cosa NON cambia: nessuno slot valorizzato legittimo; nessun multivalue primitivo (dedup solo su pointer-array
    di DObject); progetti puliti = no-op (deep-equal, provato).
  - Interazione cross-layer: la migrazione gira in SaveManager.load PRIMA di LoadAction → L/JjOM/canvas/sync
    vedono già lo stato bonificato; nessun proxy, nessuna TRANSACTION, nessuna azione Redux.
  - Sicurezza side-effect: idempotente (secondo run = no-op, provato); "nessun id rimosso sopravvive" verificato
    via JSON.stringify (provato).

Smoke-test scenarios: gli 8 sopra (§Finding 5). Il criterio infallibile è già coperto dal test a funzione pura.

Incertezze: Format B multi-slot merge e pulizia pointedBy sono il 20% fragile — coperti dai test. Nessuna
incertezza di propagazione ad altri layer (gira pre-LoadAction).
```

## RIFERIMENTI

- Spec eseguibile: `frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts` (la funzione + i 12 casi).
- Discovery: `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`.
- CLAUDE.md §3.1 (critical zone), §3.2 (LIR), §3.9 (VersionFixer/jsxString), §9 (persistenza).
- Convenzioni migration: metodi `['2.216 -> 2.217']`, `['2.217 -> 2.218']` come template di stile.

## Nota diagnostica (NON in scope, per Alfonso)

Il test bed con 6 Transition: se hanno **id distinti** è un double import (la migration same-id NON lo fonde). Da chiarire in app prima di attribuirlo alla bonifica.

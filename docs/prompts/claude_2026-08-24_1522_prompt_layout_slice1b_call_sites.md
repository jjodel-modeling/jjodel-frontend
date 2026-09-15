# Prompt Claude Code — Layout per viewpoint, slice 1b: i call site passano dai resolver

**Corsia completa (RC-3), critical zone (`canvasToJjom.ts`, CLAUDE.md §3.2), effort xhigh.
Due fasi in questo stesso prompt: Fase A read-only con LIR, hard stop, GO di Alfonso in chat,
poi Fase B.** Leggere a inizio sessione: `CLAUDE.md`, `docs/decisions.md` (R-LAY-14..17 **come
emendate il 2026-08-24**), `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md`,
il modulo `components/editor-v2/viewpoint/layout/vertexLayout.ts` com'è a `aa558a19c` (con la
guardia anti-`undefined` nella materializzazione: non è nel prompt della 1a, è nel codice ed è
ratificata a voce), e `docs/claude-code-log.md`. Conflitti con CLAUDE.md o col registro:
segnalare e fermarsi.

## COSA

La slice 1b del layout per viewpoint: l'adapter impuro che calcola il viewpoint esclusivo
attivo, e i sette siti del censimento (memo di ratifica §1, tabella del memo proposta §4) che
passano da `readVertexLayout` / `resolveVertexLayoutWrite`. Dopo questa slice un gesto di
disposizione sotto un viewpoint esclusivo scrive il record di quel viewpoint; senza viewpoint
esclusivo attivo tutto scrive sugli scalari, **comportamento byte-identico a oggi**.

## FASE A (read-only) — verifica dei siti e Layer Impact Report

Il censimento dei sette siti viene da `discovery_2026-08-24_layout_d1_d8_d10.md` §4 e ha più di
un giorno: prima del diff va riverificato riga per riga. Produrre il LIR in
`docs/reports/2026-08-24-lir-layout-slice1b.md` (modello: il LIR di M1,
`docs/reports/2026-08-18-lir-m1-marcatura-predicato-ir.md`), con:

1. **Verifica sito per sito** (citazioni `file:riga` correnti): le scritture di
   `canvasToJjom.ts` (posizione :46-47, :59-60; taglia e reset :78-80, :92, :105-107), le
   letture di `jjomTransformers.ts` (:50-57 `manualSizeOf`, :173-174, :219-220, :241-242), il
   drop di `MetamodelTab.tsx:138-139`, gli override di `LVoidVertex`
   (`GraphDataElements.tsx:1403-1425`).
2. **La domanda nuova, da misurare prima di decidere**: instradare gli override di `LVoidVertex`
   significa importare il modulo (o l'adapter) **da `model/dataStructure/`**. L'arco
   `model/` → `components/editor-v2/` esiste già nel repo o sarebbe nuovo? Misurare (grep sugli
   import di `model/**`, controllo positivo). Se è nuovo, il LIR espone le opzioni SENZA
   sceglierle (aprire l'arco; lasciare gli override sugli scalari come `set_size`, dichiarati;
   altro) e la scelta è di Alfonso al GO. **Non instradare `LVoidVertex` di propria iniziativa
   se l'arco è nuovo.**
3. **Impatto per layer** (D-layer, reducer, joiner, editor-v2, classico), rischi, e il piano dei
   diff file per file.
4. Se la verifica dei siti diverge dal censimento: addendum in coda a
   `discovery_2026-08-24_layout_slice1a_sede_resolver.md` (R-E/E-1), non un report nuovo.

**Hard stop: LIR committato ed esposto in chat. Fase B solo dopo il GO esplicito di Alfonso.**

## FASE B (dopo il GO) — implementazione

### File (elenco da confermare nel LIR; oltre 3 file, Regola 19: riesporli all'hard stop)

1. `components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts` — **nuovo, impuro**, sul
   modello `irResolve.ts` accanto a `irResolveCore.ts` (R-LAY-16 emendata):

   ```ts
   /** Impure adapter at the store boundary. Maps BOTH "no active viewpoint" AND
    *  "active viewpoint is not exclusive" to null BEFORE the pure module: null means
    *  "the abstract-syntax record" (R-LAY-16). Exclusivity is the direct read of
    *  isExclusiveView on the viewpoint D-object (lastViewpoint.ts:96, selectors.ts:558):
    *  no reusable predicate exists (discovery slice 1a §5.2). */
   export function getActiveExclusiveVpId(): string | null;
   ```

   Legge `state.viewpoint` (la sorgente di `irResolveCore.ts:139`), risolve
   `idlookup[vp]`, ritorna `vp` se `!!d.isExclusiveView`, altrimenti `null`. Niente test
   unitario (serve lo store; la copertura è la verifica visiva, dichiararlo nella entry di log).
2. `components/editor-v2/sync/canvasToJjom.ts` — le scritture passano da
   `resolveVertexLayoutWrite(src, patch, getActiveExclusiveVpId())`:
   `target:'scalars'` → le `SetFieldAction` per scalare **esattamente come oggi**;
   `target:'dictionary'` → **una** action dentro la stessa `TRANSACTION`:
   `SetFieldAction.new(vId, 'layoutByViewpoint', {[vpId]: record}, '+=', false)`
   (la semantica `'+='` è documentata nel doc del modulo: merge per chiave,
   `reducer.ts:240-252`; su campo assente agisce come `'='`, `:186-188`).
3. `components/editor-v2/utils/jjomTransformers.ts` — le letture passano da
   `readVertexLayout(raw, getActiveExclusiveVpId())`: le tre coppie di posizione e
   `manualSizeOf`.
4. `components/abstract/tabs/MetamodelTab.tsx:138-139` — il drop passa dallo stesso resolver
   (clausola «classico governato», R-LAY-16). Su un metamodello il selettore di viewpoint non è
   reso per design, quindi l'esito atteso è sempre `target:'scalars'`: dichiararlo in un
   commento di una riga.
5. `GraphDataElements.tsx:1403-1425` — **solo secondo l'esito della domanda 2 del LIR e la
   scelta di Alfonso al GO.** Se resta sugli scalari, si dichiara nel commento come `set_size`.
6. `utils/lastViewpoint.ts:64-68` — aggiornare l'enumerazione dei lettori della root nel
   commento (entra `vertexLayoutAdapter.ts`). Solo il commento.
7. `docs/claude-code-log.md` — entry.

**Non si tocca**: `set_size` (`GraphDataElements.tsx:668-685`, appartiene a `LGraphElement` e
instradarlo toccherebbe gli edge point: resta dichiarato, R-LAY-16), `storeSize`, il modulo puro
`vertexLayout.ts` (se un cambio sembra servire, fermarsi e chiedere), `VersionFixer.tsx`,
`joiner/classes.ts`.

### Verifiche prima del commit

- Grep di collisione: `vertexLayoutAdapter`, `getActiveExclusiveVpId` — attesi 0, controllo
  positivo, glob quotati.
- Gate pieni: `npx tsc --noEmit` 33 byte-identico; `npx vitest run` (baseline 1342 passed, 9
  suite rosse note); `npm run build` exit 0; `npm run check:docs` (rosso pre-esistente del
  Check C dichiarato, non corretto).
- Un solo commit: `feat(layout): route vertex layout through per-viewpoint resolvers (slice 1b)`.
  `git add` dei soli file elencati.

## VERIFICA VISIVA (Alfonso, hard stop dopo il commit)

Su `http://localhost:3001/`, hard refresh, un **modello** (sul metamodello il selettore non è
reso), due viewpoint esclusivi `A` e `B`:

1. **Read-through e divergenza** (R-LAY-15): sposta un nodo sotto `A`; attiva `B` → il nodo è
   dov'era in sintassi astratta; spostalo sotto `B`; torna ad `A` → è dove l'ha lasciato `A`;
   disattiva tutto → la sintassi astratta non si è mai mossa.
2. **Primo gesto di solo drag** (l'emendamento): sotto `B` sposta senza ridimensionare → la
   taglia resta quella efficace, nessun collasso o buco.
3. **⌘Z**: dopo lo spostamento sotto `A`, undo → il nodo torna (copre la lettura statica del
   reducer, discovery §4.5).
4. **Reload** (`location.reload()`, non il solo cambio di hash): salva, ricarica → i record per
   viewpoint sopravvivono.
5. **Regressione zero senza viewpoint**: senza viewpoint attivo tutto si comporta come prima.
6. **Non-obiettivo dichiarato**: un resize via proxy L (`set_size`) scrive sulla sintassi
   astratta qualunque sia il viewpoint attivo: atteso, non regressione.

La entry di log si chiude a `Smoke visivo: passato` solo dopo la conferma di Alfonso.

## RIFERIMENTI

- `docs/decisions.md`: R-LAY-14..17 emendate, R-LAY-9, R-LAY-11, R-LAY-13, RC-3, R-E/E-1,
  Regola 19.
- `docs/ratifiche/claude_2026-08-24_memo_ratifica_layout_slice1.md` (§7, addendum).
- `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md` (§4 scrittura, §5
  adapter e sorgente) e `discovery_2026-08-24_layout_d1_d8_d10.md` §4 (censimento).
- Modulo a `aa558a19c`: `viewpoint/layout/vertexLayout.ts` e i suoi 19 test.
- Baseline: tsc 33; vitest 1342 passed, 9 suite rosse; build exit 0.

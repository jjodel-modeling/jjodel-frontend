# Discovery 2026-08-30 — S4: `WriteCtx`, e la raccolta che era gia' avvenuta

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD al momento della misura `ada72b3ef`
**Prompt**: «S4: WriteCtx — il motore scrive per contratto», dato in chat, non depositato.
Quarta slice della sequenza del referto `b9ca883fc` (§6), dopo S1a/S1b, S2 e S3.
**Perimetro dichiarato dal prompt**: `jjform/writeCtx.ts` (nuovo, zero import),
`editor-v2/hooks/writeCtxLproxy.ts` (nuovo), il motore che riceve il ctx **dove la
sostituzione e' meccanica**, il contratto §5, la convergenza dei verdetti **decisa
misurando**.

---

## 1. La risposta, in breve

- **Il contratto e' sei metodi e non porta nessun tipo dell'host.** `WriteCtx` sta in
  `jjform/writeCtx.ts` con un solo import — `WriteResult` dal fratello `write.ts` — nella
  forma esatta di `irReadCtx.ts`. R-WCX-1.
- **La slice ha raccolto, non riscritto.** Ogni metodo e' una funzione che gia' esisteva.
  I sorgenti gia' vivi toccati sono **quattro** — `jjform/{delete,index}.ts`,
  `hooks/{createAdapter,deleteAdapter}.ts` — e in nessuno cambia un argomento, una
  TRANSACTION o un ordine.
- **Il motore scrive, e lo fa contro un host che non e' jjodel.** `applyPlanWrites(ctx,
  plan)` in `jjform/delete.ts` e' l'unica inversione **meccanica** trovata; le altre due
  sono dichiarate e rimandate con la loro ragione (§4).
- **La convergenza dei verdetti si chiude misurando, e la misura dice di non unificare.**
  R-WCX-4, §3.
- **Misurato a schermo**: sonda `_tmp_s4_verify.ts`, **21/21 ALL GREEN, zero errori di
  pagina**, ripetuta due volte con lo stesso esito. `npm run smoke` **12/0/3 GREEN**.

---

## 2. Cosa e' diventato cosa

| Metodo di `WriteCtx` | Da dove viene | Diff |
|---|---|---|
| `setValue` / `clearValue` / `appendValue` | `formWrite.{setValue,clearValue,appendValue}` (S3) | **zero**: gia' per `(objectId, featureKey)`, gia' `WriteResult` |
| `setName` | `formWrite.setObjectName` | **zero** |
| `create` | `createAdapter.applyCreate`, meta' inferiore | estratta in `createInstance(modelId, cls, ownerId, childKey, seed)`; `applyCreate` resta il traduttore del draft e delega |
| `delete` | il corpo del ciclo di `deleteAdapter.runDeletes` | spostato in `writeCtxLproxy.deleteInstance`; `runDeletes` lo chiama, la conta e' identica |

Il `modelId` e' argomento di costruzione (`makeWriteCtx(modelId)`) e non del metodo:
`create` prende la metaclasse per **nome**, perche' e' quello che il motore ha
(`MetamodelShape` e' chiavata per nome), e risolvere quel nome a un id di `DClass` richiede
un modello. Stessa scelta di `makeReadCtx(idlookup)`. Un ctx costruito senza modello scrive,
rinomina e cancella; solo `create` rifiuta, **dichiarandolo** invece di lanciare.

### 2.1 La direzione delle dipendenze, e perche' `delete` ha traslocato

`deleteAdapter` deve consumare il ctx (§4), quindi non puo' essere anche il posto da cui il
ctx importa: sarebbe un ciclo `deleteAdapter -> writeCtxLproxy -> deleteAdapter`. La
primitiva `delete` — l'unica che non aveva una funzione propria, essendo il corpo di un
ciclo — vive percio' in `writeCtxLproxy`, e `runDeletes` la chiama. Le due `continue` mute
del ciclo diventano verdetti: id gia' sparito = `{ok:true, changed:false}` (una cascata lo
incontra ogni volta che il core ha tolto un figlio per conto suo), id che non risolve =
rifiuto con reason. La conta non si muove: si incrementa sul solo `changed`, che e'
esattamente il ramo che prima arrivava a `deleted++`.

---

## 3. La convergenza dei verdetti — misurata, e NON presa (R-WCX-4)

S2 aveva annotato tre forme con `{ok, reason}` e rimandato la decisione a S4 «quando la
domanda diventa rispondibile». La misura, `command grep` su `frontend/src`:

- **`collidingWith`** (S1a): 8 occorrenze in `frontend/src` prima di questa slice, di cui 2
  nel docstring di `write.ts` che annotava questa stessa convergenza (11 dopo, perche'
  `writeCtx.ts` cita la decisione); **2 lettori veri** — `nameUniqueness.ts:163` e
  `LModelElement.tsx:6302` (il toast del reparent). Trasporta `LObject[]`: metterlo su
  `WriteResult` darebbe a `jjform/` il suo **primo tipo dell'host**, cioe' la fine della
  portabilita' che quel tipo esiste per servire.
- **`candidates`** (S1b): vive su un verdetto di **risoluzione**, non di scrittura —
  `jjscript/executor/commands/instance.ts:146` e la mappa di ambiguita' JjEL
  (`jjel/evaluator/context.ts:209`), il cui lettore e' la copy della console. Nessuno
  scrittore del censimento ne produce uno; nessun consumatore di uno scrive.

Verdetto: `WriteResult` resta `{ok, changed, reason}`; le due estensioni restano dove sono;
cio' che converge e' `{ok, reason}`, la parte che attraversa il contratto, e `reason` e'
l'unico canale del rifiuto — **verbatim**. Conseguenza voluta: **zero consumatori cambiati,
zero copy cambiata**, che e' cio' che il prompt chiedeva. L'alternativa (campi opzionali per
entrambe) avrebbe aggiunto a un tipo portabile due campi che nessun percorso di scrittura
popola.

---

## 4. Il motore che riceve il ctx: una presa, due rimandi

Il prompt limitava l'inversione a «SOLO dove e' una sostituzione meccanica».

**Presa — `jjform/delete.applyPlanWrites(ctx, plan)`.** Le due iterazioni che stavano in
`applyDelete` risolvevano `lOwner['$' + key]` e poi chiamavano `formWrite`; il ctx risolve
la stessa espressione, nello stesso istante, dentro `formWrite.setValue`. Cambia **chi tiene
il ciclo**, non cosa fa. Le delete restano nell'adapter: portano una dilazione che e' un
numero di questo host (R-FORM-11), e al contratto va l'obbligo, non i millisecondi.

**Rimandata — `multiAdapter.applyBulk`.** Il suo `BulkResult` distingue `missing` (lo slot
non si risolve sull'istanza) da `refused` (l'host rifiuta). Attraverso il ctx le due
arrivano come lo stesso `{ok:false}` con reason diverse, e distinguerle richiederebbe di
**far combaciare la stringa** o di allargare `WriteResult` — cioe' la confusione che S2
esiste per togliere. Non e' meccanica: dichiarata.

**Rimandata — `createAdapter.applyCreate`.** La scrittura sotto e' gia' la primitiva
(`createInstance`). Quello che resta e' la **traduzione del draft**: campi non toccati
scartati, stringhe tipate per tipo dell'attributo. E' pura e apparterrebbe al motore, ma
spostarla e' un trasloco, non una sostituzione. Dichiarata.

Entrambe stanno nel contratto §5.1bis, non solo qui.

---

## 5. Il test che rende la portabilita' una misura

`jjform/__tests__/writeCtx.test.ts`: un `WriteCtx` su un `Record<id, {cls, name, slots}>`
JSON — nessun proxy, nessuno store, nessun framework — e `applyPlanWrites` che ci fa
atterrare piani costruiti da `deletePreflight`/`deletePlan` veri. Sette casi: reassign,
clear che lascia un **buco** e non accorcia, `dirty` che non scrive nulla, rifiuto
riportato verbatim **con l'altro passo applicato lo stesso** (per contrasto), piano
`blocked` non applicato a meta', no-op contato come `unchanged`, e le altre cinque
primitive soddisfatte dallo stesso host JSON.

Fino a oggi R-FORM-2 era **strutturale**: la directory non ha import, quindi *potrebbe*
girare altrove. Qui una seconda implementazione riceve davvero le scritture del motore.

---

## 6. La misura a schermo

Sonda `_tmp_s4_verify.ts` (tsx, sorgente vivo via Vite, nessun mock). **21/21 ALL GREEN,
zero errori di pagina**, due corse identiche.

- **A. le sei primitive** dal ctx, sul D-graph vivo: `setValue` atterra; **lo stesso valore
  in un tick separato** e' `{ok:true, changed:false}`; la feature assente e' un rifiuto con
  la sua reason (controllo di segno opposto di A.1); `setName` rinomina e la seconda volta
  e' un no-op; `create` semina e il nome arriva **sia** su `DObject.name` **sia** sullo slot
  identita' (`{name:"Nato", nameSlot:["Nato"]}`); `appendValue` accoda `["hot","cold","warm"]`
  e `clearValue(1)` lascia `["hot", null, "warm"]` — **lunghezza 3**, il buco di R-FORM-7.
- **B. la catena del manager cambiata**: `preflightFor` -> `deletePlan({reassignTo})` ->
  `applyDelete`, cioe' `InstanceManagerTab:1002-1015`. Subito dopo la chiamata il bersaglio
  e' **ancora vivo** (la dilazione di R-FORM-11 misurata, non assunta); dopo, il referrer e'
  ripuntato sul candidato e il bersaglio e' sparito. Controllo di segno opposto nella stessa
  corsa: un piano `dirty` ha 0 reassign e 0 clear e cancella comunque.
- **C. la create del manager**: `applyCreate` con un draft crea l'istanza col nome e la
  reference seminati; controllo opposto, una metaclasse inesistente torna `null` e non crea.
- **D. il gesto vero sul rail**: edit di `label` -> lo store porta `["dal-rail-s4"]`;
  rinomina dal titolo -> `"Rinominato"`. Screenshot `_tmp_s4_verify_rail.png`.

### 6.1 Due FAIL che erano della sonda, e cosa hanno insegnato

La prima corsa e' uscita **3 FAIL su 21**, tutti e tre della sonda:

1. **I no-op misurati nello stesso `evaluate`.** Due `setValue` con lo stesso valore in un
   tick solo tornano entrambi `changed:true`: la seconda rilegge lo slot **prima** che la
   prima sia propagata (§9.2). Corretto misurando il no-op in un tick separato — la regola
   «assert the setup, do not wait for it» di `README-probes.md`, applicata al verdetto
   invece che al padre.
2. **Il gruppo Identity non c'era** (`#ir-field-name = 0`), e non e' un difetto: `IRForm`
   rende quel gruppo **solo quando la metaclasse NON ha lo slot `name`** (`IRForm.tsx:221`),
   altrimenti renderebbe due controlli per la stessa identita'. La fixture dava `name` a
   ogni classe. Corretto aggiungendo una metaclasse **senza** `name` — il solo gesto che
   passa davvero da `setObjectName`.

Entrambe sono la stessa lezione del referto di S1b: una sonda che *aspetta* riporta un verde
ogni volta che l'attesa e' bastata quel giorno.

---

## 7. Cancelli

- `npm run typecheck`: **33 = baseline**, conta presa sull'**output completo** (exit 2 come
  la baseline). Nessuna delle 33 righe nomina un file toccato.
- `npm run build`: exit **0**, solo il chunk-warning.
- `npx vitest run`: **2112 passed / 0 failed** — 2105 di baseline **+7 esatti**, i sette casi
  nuovi — coi 9 file rotti all'import = baseline nota.
- `npm run smoke`: **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per
  stato.

---

## 8. Limiti di questa misura

- **`validTargets` non c'e'** (S5). Finche' non c'e', il motore non puo' offrire un picker
  per conto proprio, e il contratto lo dice invece di lasciarlo scoprire.
- **`applyPlanWrites` e' l'unico scrittore del motore.** Le altre due inversioni sono
  dichiarate (§4), non fatte: chi legge il contratto non deve dedurre che il motore scriva
  gia' ovunque.
- **La sonda non passa dai bottoni del manager**, ma dalle sue stesse funzioni
  (`preflightFor`/`deletePlan`/`applyDelete`/`applyCreate`) con la fixture costruita a mano;
  il gesto vero e' misurato sul rail (D). Il dialogo del manager resta coperto dalle sonde di
  12d/12bc.
- **`addSlotValue`** resta senza chiamanti e senza posto nel ctx: appende un **vuoto
  tipato**, che e' un gesto («Add row») che non esiste. Il `TODO: cleanup` di S2 e' ancora la
  riga giusta.

# Layer Impact Report — layout per viewpoint, slice 1b (i call site passano dai resolver)

**Tipo**: Layer Impact Report (CLAUDE.md §3.2), obbligatorio prima del diff perché la slice
tocca `components/editor-v2/sync/canvasToJjom.ts` (critical zone, §3.1).
**Base**: branch `alfonso-frontend-jjtl`, HEAD `474809b55`, working tree pulito all'avvio
(`git status --short` vuoto).
**Governanti**: R-LAY-9, R-LAY-11, R-LAY-13, R-LAY-14..17 **come emendate il 2026-08-24**
(`docs/decisions.md:1724-1740`), RC-3, R-E/E-1, Regola 19.
**Materiale di partenza**: censimento di `discovery_2026-08-24_layout_d1_d8_d10.md` §4 e
tabella del memo di proposta §4, **riverificati riga per riga** in questa fase (§1 sotto);
`discovery_2026-08-24_layout_slice1a_sede_resolver.md` §4-§5; modulo puro
`components/editor-v2/viewpoint/layout/vertexLayout.ts` a `aa558a19c`, letto integralmente
inclusa la guardia anti-`undefined` di `resolveVertexLayoutWrite` (righe 119-123).
**Fetta**: un solo commit (adapter impuro + instradamento dei call site).

---

## 0. In sintesi — le tre cose che il prompt non sapeva

| # | Attesa del prompt | Misura |
|---|---|---|
| A | «le tre coppie di posizione e `manualSizeOf`» in `jjomTransformers.ts` | **Incompleta.** Le coppie di posizione sono **quattro** (manca `objectVertexToRFNode`, `:347-348`) e i siti di lettura della **taglia** sono **tre**, non uno: `manualSizeOf` (`:50-57`), il ramo package `:243-244` (che non passa da `manualSizeOf`) e `computeOptimalHandles` (`:406-413`). Dettaglio §1.2. |
| B | L'arco `model/` → `components/editor-v2/` | **Sarebbe nuovo.** L'arco `model/` → `components/` esiste (2 occorrenze in tutto: un `import type` e un import di valore), ma **nessuna** punta a `editor-v2/`, e nessuna delle due parte da `GraphDataElements.tsx` verso un modulo di valore. Misura e opzioni al §2 — **non scelgo**. |
| C | Il piano di verifica visiva §1 («attiva `B` → il nodo è dov'era in sintassi astratta») | **Non passerà come scritto.** Un cambio di viewpoint **non ri-trasforma** i nodi: `useJjomSync.ts` non nomina mai `viewpoint` (0 occorrenze, controllo positivo `modelid` = 27) e la ri-trasformazione integrale è armata solo dal cambio di `modelid` / uscita da JjOM mode / unmount. La lettura per viewpoint è corretta ma **osservabile solo dopo un reload o una mutazione del vertice**. Analisi e opzioni al §4 — **non scelgo**. |

Nessuna delle tre tocca l'impianto ratificato. A e C cambiano il testo che la Fase B eseguirebbe.

---

## Baseline misurate prima del diff

| Gate | Comando | Valore |
|---|---|---|
| typecheck | `npx tsc --noEmit`, output **integrale**, `command grep -c "error TS"` | **33**, exit 2 (baseline dichiarata CLAUDE.md §17) |
| test | `npx vitest run`, output integrale su file | **1342 passed**, **9 file rossi** / 52 verdi (61), exit 1 |

Conteggi presi su output completo, mai su una finestra `tail`/`head` (CLAUDE.md §5).

---

## 1. Verifica sito per sito (citazioni correnti a `474809b55`)

### 1.1 Scritture — `components/editor-v2/sync/canvasToJjom.ts` — **censimento confermato**

`command grep -nE "SetFieldAction\.new\([^,]+, *'(x|y|w|h|isResized)'" components/editor-v2/sync/canvasToJjom.ts`
→ exit 0, **11 righe**, esattamente le citate:

| Funzione | Righe | Campi | Ha già `markCanvasUpdated` |
|---|---|---|---|
| `syncPositionToJjom` (`:43`) | **46-47** | `x`, `y` | sì (`:44`) |
| `syncPositionBatchToJjom` (`:55`) | **59-60** | `x`, `y` (in loop) | sì, batch (`:57`) |
| `syncSizeToJjom` (`:75`) | **78-80** | `w`, `h`, `isResized`←`true` | sì (`:76`) |
| `syncSizeResetToJjom` (`:90`) | **92** | `isResized`←`false` | sì (`:91`) |
| `syncSizeBatchToJjom` (`:101`) | **105-107** | `w`, `h`, `isResized`←`true` (in loop) | sì, batch (`:103`) |

Tutte e cinque scrivono con `vertexId` (una stringa), **non** con il D-object: per materializzare
il record completo servirà leggere la sorgente dallo store. `canvasToJjom.ts` importa già `store`
dal barrel (`:27`) e lo usa in 9 punti (`:253`, `:435`, `:526`, `:925`, `:982`, `:1019`, `:1206`,
`:1293`, `:1612`): `store.getState().idlookup[vertexId]` è idioma di casa, non un arco nuovo.

`syncIREdgeLayoutToJjom` (`:113-130`) scrive `irEdgeLayout` e resta **fuori** perimetro: la
distinzione del censimento §4.4 regge a codice letto.

### 1.2 Letture — `components/editor-v2/utils/jjomTransformers.ts` — **censimento incompleto (finding A)**

`command grep -n "manualSizeOf\|raw\.x\|raw\.y\|raw\.w\|raw\.h" components/editor-v2/utils/jjomTransformers.ts`
→ exit 0. Elenco completo dei siti che leggono geometria di vertice:

| Sito | Righe | Cosa legge | Nel censimento? |
|---|---|---|---|
| `manualSizeOf` (dichiarata `:50`) | **50-57** | `raw.isResized`, `raw.w`, `raw.h` | sì |
| `classVertexToRFNode` — posizione | **172-174** | `raw.x`, `raw.y` | sì |
| `classVertexToRFNode` — taglia | `:184` | `manualSizeOf(raw)` | via `manualSizeOf` |
| `enumVertexToRFNode` — posizione | **218-220** | `raw.x`, `raw.y` | sì |
| `enumVertexToRFNode` — taglia | `:226` | `manualSizeOf(raw)` | via `manualSizeOf` |
| `packageVertexToRFNode` — posizione | **240-242** | `raw.x`, `raw.y` | sì |
| `packageVertexToRFNode` — **taglia** | **243-244** | `raw.w`, `raw.h`, default 400/300, **NON** passa da `manualSizeOf` (va in `style.width/height`) | **no** |
| `objectVertexToRFNode` — posizione | **346-348** | `raw.x`, `raw.y` | **no** |
| `objectVertexToRFNode` — taglia | `:354` | `manualSizeOf(raw)` | via `manualSizeOf` |
| `computeOptimalHandles` | **404-413** | `sRaw.x/y/w/h`, `tRaw.x/y/w/h`, default 180/80 | **no** |

Tre siti in più dei censiti. Il peso dei tre è diverso:

- **`objectVertexToRFNode` `:346-348` — bloccante se omesso.** È il transformer dei nodi **M1**,
  cioè esattamente lo scenario della verifica visiva (un *modello*, non un metamodello). Non
  instradarlo significa che sul modello le posizioni per viewpoint non si vedrebbero mai, mentre
  si vedrebbero su classi ed enum: lo stesso campo persistito letto con due contratti diversi
  nello stesso file. Va instradato.
- **`packageVertexToRFNode` `:243-244` — coerenza.** Il package è l'unico nodo la cui taglia non
  è gated da `isResized`: legge `w`/`h` con default. Se il record per viewpoint porta `w`/`h` e
  qui si continua a leggere gli scalari, un package spostato **e** ridimensionato sotto un
  viewpoint mostrerebbe la posizione del viewpoint e la taglia della sintassi astratta.
- **`computeOptimalHandles` `:404-413` — coerenza degli ancoraggi.** Sceglie gli handle dalla
  geometria di sorgente e destinazione. Sotto un viewpoint con posizioni divergenti, gli handle
  verrebbero scelti sulle posizioni della sintassi astratta: archi ancorati dal lato sbagliato
  pur con i nodi al posto giusto. Non è un guasto di persistenza, è un difetto visivo derivato.

Tutti e tre stanno **dentro un file già elencato dal prompt** (`jjomTransformers.ts`): instradarli
non allarga la lista dei file, allarga l'elenco delle righe dentro un file dichiarato. Lo espongo
qui e lo porto al GO come **domanda 1** (§7), perché il prompt enumera «le tre coppie di posizione
e `manualSizeOf`» e questa è una divergenza dal testo, non dall'impianto.

Nota di forma: `raw` è `vertex.__raw ?? vertex`, cioè il D-object. Soddisfa **strutturalmente**
`VertexLayoutSource` (`vertexLayout.ts:44-47`) senza cast né adattatore: `readVertexLayout(raw, vp)`
si applica direttamente.

### 1.3 Drop del classico — `components/abstract/tabs/MetamodelTab.tsx` — **confermato, con una nota**

```
MetamodelTab.tsx:137   TRANSACTION('Set drop position', () => {
MetamodelTab.tsx:138       SetFieldAction.new(tm.node!.__raw, 'x', dropX, '', false);
MetamodelTab.tsx:139       SetFieldAction.new(tm.node!.__raw, 'y', dropY, '', false);
MetamodelTab.tsx:140   });
```

Righe **138-139** confermate. Differenza rispetto a `canvasToJjom`: il primo argomento è il
**D-object** (`tm.node!.__raw`), non l'id — quindi la sorgente per la materializzazione è già in
mano, nessuna lettura dello store. Sul metamodello il selettore di viewpoint non è reso
(`EditorSwitch.tsx:54` / `Toolbar.tsx:233`, `isMetamodel` ⇒ `shownViewpointId = ''`), quindi
l'esito atteso è **sempre** `target: 'scalars'`: è la clausola «classico governato, non esente»
di R-LAY-9/R-LAY-16, e va dichiarata in un commento di una riga come chiede il prompt.

### 1.4 Override del proxy L — `model/dataStructure/GraphDataElements.tsx` — **confermato, off-by-one**

Il blocco è **1398-1425**, non 1403-1425: `1398-1401` è il commento, `1402` è `get_x`, `1403` è
`set_x`, `1425` chiude `set_h`. Le otto funzioni leggono e scrivono `context.data.<campo>`
direttamente, bypassando il view layer (lo dice il commento `:1399-1401`).

Fatto rilevante per il GO, misurato: **nessuno chiama queste funzioni per nome.** Sono raggiunte
dal proxy come accesso a proprietà (`lvertex.x`), quindi un censimento dei consumatori per grep su
`get_x(` non ha segnale — la ricerca su `components/`, `model/`, `view/`, `common/` non produce un
solo call-site per nome fuori da `GraphDataElements.tsx` stesso. Il perimetro reale dei lettori è
«chiunque abbia un `LVertex`»: renderer classico, view utente in `jsxString`, JjScript. Questo è
un argomento **contro** l'instradamento in questa slice, indipendente dalla questione dell'arco:
non è misurabile in anticipo che cosa cambierebbe a schermo.

Nota già a registro e confermata a codice letto: `set_size` sta su `LGraphElement`
(`GraphDataElements.tsx:135`, dichiarazione `:668`), i cui `get_x`/`set_x` a `:445-458` delegano a
`get_size`/`set_size`; `LVoidVertex` (`:1356`) li **ridichiara**. Instradare `set_size`
toccherebbe anche gli edge point: resta dichiarata, non instradata (R-LAY-16).

---

## 2. La domanda nuova — l'arco `model/` → `components/editor-v2/` (finding B)

### 2.1 La misura

`command grep -rnE "^import .*from ['\"].*components/" model/` → exit 0, **2 righe in tutto**:

```
model/dataStructure/GraphDataElements.tsx:60   import type {Tooltip} from "../../components/forEndUser/Tooltip";
model/logicWrapper/LModelElement.tsx:94        import { toast } from "../../components/Toast";
```

Controllo positivo: `command grep -rcE "^import " model/**` ha segnale (12 import in
`GraphDataElements.tsx`, 11 in `LModelElement.tsx`, ecc.), quindi il **2** non è il silenzio di
una ricerca rotta.

Lettura: l'arco `model/` → `components/` **esiste** e in un caso porta un **valore** (`toast`).
Ma **verso `editor-v2/` è zero**, e l'unico arco che parte da `GraphDataElements.tsx` è
`import type` — erased al compile, nessun arco a runtime.

### 2.2 Il costo che la misura aggiunge: un ciclo a runtime

L'adapter è **impuro per costruzione**: gli serve `store`. Le due vie:

- `import { store } from '.../joiner'` (come `irResolve.ts:13`) — ma `joiner/index.ts:191`
  ri-esporta proprio da `model/dataStructure/GraphDataElements`. Se `GraphDataElements.tsx`
  importasse l'adapter si formerebbe il ciclo
  `GraphDataElements → vertexLayoutAdapter → joiner/index → GraphDataElements`.
- `import { store } from '.../redux/createStore'` (`joiner/index.ts:209` mostra che il modulo
  vero è quello) — evita il barrel ma non l'arco `model/` → `editor-v2/`.

Il ciclo non è fatale in ESM e l'adapter leggerebbe `store` **dentro** la funzione (non al
top-level), ma è un arco nuovo in un file che oggi verso `components/` ha solo un `import type`.

### 2.3 Nota: la riga ratificata ha già preso posizione su questo arco

R-LAY-14, emendamento del 2026-08-24: «sul `DVertex` il tipo è il literal strutturale inline,
come i precedenti `ghostOffsets` e `irEdgeLayout`, **per non aprire l'arco `model/` →
`editor-v2/`**». La slice 1a ha pagato una duplicazione di tipo per tenere quell'arco chiuso.

### 2.4 Le opzioni, **senza sceglierle**

- **(a) Non instradare `LVoidVertex` in questa slice.** Gli override restano sugli scalari e si
  **dichiarano** in commento, come `set_size`. Costo: sotto un viewpoint esclusivo, una lettura o
  scrittura via proxy L vede la sintassi astratta — stessa forma del non-obiettivo già dichiarato
  per `set_size` nella verifica visiva (punto 6 del prompt), estesa a `get_x/set_x/…`. Beneficio:
  arco chiuso, coerenza con la scelta di R-LAY-14, e nessun cambiamento di lettura su un
  perimetro di consumatori che il §1.4 misura **non censibile**.
- **(b) Aprire l'arco.** `GraphDataElements.tsx` importa `vertexLayoutAdapter` + `vertexLayout`.
  Costo: arco nuovo `model/` → `editor-v2/` con import di valore, ciclo del §2.2, e un cambio di
  lettura su un insieme di consumatori non misurabile in anticipo. Beneficio: il proxy L smette
  di essere un buco nel resolver unico di R-LAY-16.
- **(c) Sede neutra per il solo adapter** (es. `utils/`, accanto ad `activateViewpoint`, dove
  `collectViewCssDescriptors` è il precedente esatto — `lastViewpoint.ts:79-102`). L'arco
  diventerebbe `model/` → `utils/`, che è più tenue di `model/` → `editor-v2/`. Costo: contraddice
  la sede scelta al punto 4 dell'addendum §7 del memo («accanto al resolver, modello
  `irResolve.ts`/`irResolveCore.ts`»), quindi vorrebbe un emendamento a R-LAY-16. Non risolve il
  §1.4 (il perimetro dei lettori resta non censibile).

**Raccomandazione, non decisione**: (a). L'argomento che pesa di più non è l'arco, è il §1.4:
instradare `get_x` cambia la lettura per un insieme di consumatori che non so enumerare, dentro
una slice il cui criterio di accettazione è «byte-identico senza viewpoint esclusivo». La
questione dell'arco è la seconda ragione, non la prima. **Domanda 2 al GO (§7).**

---

## 3. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)                    — un campo nuovo scritto, nessuno rimosso
  [ ] L-layer (computed proxies)                  — solo se il GO sceglie (b) al §2.4
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)      — in LETTURA (jjomTransformers)
  [x] Canvas classic                              — drop di MetamodelTab, esito atteso 'scalars'
  [x] Sync layer (useJjomSync hooks)              — canvasToJjom, in SCRITTURA
  [ ] Persistence (VersionFixer / jsxString)      — nessuna migrazione, nessun bump (R-LAY-15)
```

### D-layer (Redux raw data) — toccato in scrittura

- **Cosa cambia**: sotto viewpoint esclusivo attivo, le cinque funzioni di `canvasToJjom`
  smettono di emettere `SetFieldAction` su `x`/`y`/`w`/`h`/`isResized` e ne emettono **una** su
  `layoutByViewpoint`, con `'+='` e valore `{ [vpId]: record }`.
- **Cosa NON cambia**: senza viewpoint esclusivo attivo le action emesse sono **le stesse di
  oggi**, stesso ordine, stessi argomenti, stesso `undefined` come modo e stesso `false` come
  quinto parametro. È il criterio di regressione zero del prompt.
- **Regole §3.3**: nessun creator entra o esce. Le cinque `TRANSACTION` restano quelle di oggi e
  restano «pure-action» (solo `SetFieldAction`): il caso **SAFE** dichiarato in §3.3. Nessun
  `DVertex.new` / `DVoidEdge.new2` / `new3` è coinvolto, quindi la Regola 12 non ha superficie.
  La `TRANSACTION` di `MetamodelTab.tsx:137` idem.
- **Interazione cross-layer**: il `'+='` su oggetto è merge superficiale per chiave
  (`reducer.ts:240-252`), su campo assente agisce come `'='` (`reducer.ts:186-188`): niente
  seeding, i record degli altri viewpoint sopravvivono. Undo: il reducer fotografa il dizionario
  intero prima del merge (`reducer.ts:242`, riapplicato `:1127-1157`), quindi ⌘Z riporta il
  dizionario, non la sola chiave — granularità voluta (R-LAY-16, lettura statica ratificata).
- **Sicurezza rispetto agli altri layer**: il campo è opzionale e nasce assente; `JSON.stringify`
  lo omette finché è `undefined` (`ProjectEditor.tsx:563-565` serializza il D-object intero,
  nessuna allowlist). I progetti esistenti restano conformi senza migrazione.

### L-layer (proxy) — NON toccato nell'opzione (a), toccato nell'opzione (b)

- **(a)**: `LVoidVertex.get_x/set_x/…` (`:1402-1425`) e `LGraphElement.set_size` (`:668-685`)
  restano sugli scalari, **dichiarati** in commento. Nessuna riga di `model/` cambia.
- **(b)**: cambierebbero lettura e scrittura per ogni consumatore del proxy, insieme non censibile
  (§1.4). In quel caso il LIR va **riemesso** prima del diff, perché il layer passa da non toccato
  a toccato in lettura e scrittura.

### Canvas v2-flow (ReactFlow) — toccato in LETTURA

- **Cosa cambia**: i siti del §1.2 leggono l'effettivo invece che lo scalare. `position` e
  `style.width/height` del nodo RF diventano funzione del viewpoint attivo.
- **Cosa NON cambia**: la forma dei `Node` prodotti, i `data`, gli id, il cache di `useJjomSync`.
  Nessun campo nuovo nei tipi RF, nessuna interfaccia esportata modificata (Regola 11 intatta).
- **Interazione cross-layer**: `useJjomSync` ri-trasforma un vertice quando il riferimento al
  D-object cambia (`:1349`, `prevD === dElement` ⇒ `continue`). Scrivere `layoutByViewpoint`
  cambia quel riferimento, quindi il ramo «modifiche» (`:1357-1381`) rilegge e confronta
  `rfNode.position` con l'esistente. L'anti-bounce (`markCanvasUpdated`, già presente in tutte e
  cinque le funzioni) continua a coprire il rimbalzo durante il gesto: non lo tocco.
- **Sicurezza**: se il GO sceglie di **non** instradare `objectVertexToRFNode` (§1.2), lo stesso
  campo verrebbe letto con due contratti nello stesso file. Lo segnalo come rischio, non come
  fatto compiuto.

### Canvas classic — toccato in un punto solo

- **Cosa cambia**: `MetamodelTab.tsx:138-139` passa dal resolver. Esito atteso **sempre**
  `'scalars'` sul metamodello (§1.3): a schermo, nulla.
- **Cosa NON cambia**: la `TRANSACTION`, il retry a 10 tentativi (`:141-144`), il `setTimeout`.
- **Perché lo si tocca lo stesso**: R-LAY-9/R-LAY-16, «governato e non esente». Un secondo
  scrittore con contratto proprio sullo stesso campo persistito è precisamente ciò che la riga
  vieta.

### Sync layer — toccato, ma solo `canvasToJjom.ts`

- **Cosa NON cambia**: `useJjomSync.ts`, `syncState.ts`, `portDistribution.ts`,
  `useM1ReferenceEdges.ts` non sono nel diff. Nessuna dipendenza di effetto toccata (§3.5), nessun
  guard di edge toccato (§3.4), nessun bucket key toccato (§3.10).

### Persistenza — NON toccata

- Nessuna migrazione, **nessun bump nemmeno no-op**: un bump rigenera in blocco le default view
  non toccate (`VersionFixer.tsx:133-143`), R-LAY-15 lo vieta esplicitamente. Nessun `jsxString`
  toccato, quindi la Regola 14 non ha superficie.

---

## 4. Il rischio principale — il read-through non è osservabile al cambio di viewpoint (finding C)

### 4.1 La misura

- `command grep -c "viewpoint" components/editor-v2/hooks/useJjomSync.ts` → **0**, exit 1.
  Controllo positivo, stesso comando su `modelid` → **27**. La ricerca ha segnale.
- La ri-trasformazione integrale (`:1192-1232`, il ramo `if (initializedRef.current) return`) è
  armata solo da: cambio di `modelid` (`:1181-1188`), uscita da JjOM mode (`:1168-1177`), unmount
  (`:1538-1548`). Nessuno dei tre scatta cambiando viewpoint.
- Il ramo incrementale «modifiche» (`:1336-1400`) salta l'elemento quando il riferimento al
  D-object è identico (`:1349`). Cambiare viewpoint non tocca nessun `DVertex`.
- `EditorSwitch.tsx:54` legge `state.viewpoint`, ma il cambio non rimonta `EditorV2` (stesso
  elemento, nessuna `key`; l'effetto `:101-109` cambia solo `editorMode`).
- La posizione di un nodo RF vive nello stato di React Flow, non nell'IR: `useIRView` ridisegna il
  contenuto del nodo al cambio di viewpoint, non lo **sposta**.

### 4.2 Conseguenza concreta sul piano di verifica del prompt

La prova 1 («sposta un nodo sotto `A`; attiva `B` → il nodo è dov'era in sintassi astratta»)
**fallisce come scritta**, e fallirebbe anche se il diff fosse perfetto: il nodo resterebbe dove
l'ha lasciato il drag finché qualcosa non forza una ri-trasformazione. La prova 4 (**reload**)
invece è quella che misura davvero il contratto, e passerebbe.

Non è un difetto del diff proposto: è un pezzo mancante della funzione. La 1b, come è scritta nel
prompt, produce **persistenza corretta senza resa reattiva**.

### 4.3 Le opzioni, **senza sceglierle**

- **(a) Accettare e dichiarare.** La 1b chiude la persistenza; la resa al cambio di viewpoint è
  una 1c. La verifica visiva della 1b si riscrive: la prova 1 diventa «sposta sotto `A`, attiva
  `B`, **ricarica** → il nodo è in sintassi astratta; torna ad `A`, ricarica → è dove `A` l'ha
  lasciato». Costo: una funzione a metà a schermo per la durata di una slice. Beneficio: il
  perimetro resta quello dichiarato, `useJjomSync.ts` non si tocca.
- **(b) Armare la ri-trasformazione nella 1b.** Serve un effetto che, al cambio di
  `state.viewpoint`, azzeri `initializedRef` (o ripatchi le posizioni dal cache). Costo:
  `useJjomSync.ts` entra nel diff — **critical zone**, file non elencato dal prompt, e il LIR
  andrebbe riemesso su un perimetro diverso. Va anche capito che cosa fare dello stato di
  sessione non persistito (un drag non ancora scritto) e dell'anti-bounce.
- **(c) Slice 1b come da prompt + una 1c immediata** che fa (b) con un prompt suo, in corsia
  completa, con il suo LIR.

**Raccomandazione, non decisione**: (c), che è (a) più un impegno. Serve però che la verifica
visiva della 1b sia riscritta come in (a): altrimenti la slice viene dichiarata fallita per una
prova che misura una funzione che non le appartiene. **Domanda 3 al GO (§7).**

---

## 5. Piano dei diff, file per file (Regola 19: **6 file**, riesposti qui)

Nell'opzione (a) del §2.4 — cioè **senza** `GraphDataElements.tsx` — i file sono **6**, oltre la
soglia di 5 della Regola 19: elenco chiuso qui sotto, con che cosa cambia in ciascuno, e la
conferma va data al GO insieme alle tre domande del §7.

1. **`components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts`** — *nuovo, ~25 righe.*
   Un solo export, `getActiveExclusiveVpId(): string | null`: legge `store.getState()`, prende
   `state.viewpoint` (la sorgente di `irResolveCore.ts:139`, R-LAY-11: nessuna seconda lettura
   dell'attivazione), risolve `state.idlookup[vp]`, ritorna `vp` se `!!d.isExclusiveView`,
   altrimenti `null`. Nessun test unitario (servirebbe lo store; la copertura è la verifica
   visiva — dichiarato nella entry di log). Il commento cita `lastViewpoint.ts:96` e
   `selectors.ts:558` come le due letture dirette esistenti del predicato.
2. **`components/editor-v2/sync/canvasToJjom.ts`** — *5 funzioni, righe 43-108.* Ognuna calcola
   `const src = store.getState().idlookup[vertexId]`, chiama
   `resolveVertexLayoutWrite(src, patch, getActiveExclusiveVpId())` e ramifica: `'scalars'` →
   **le `SetFieldAction` di oggi, invariate**; `'dictionary'` → **una**
   `SetFieldAction.new(vertexId, 'layoutByViewpoint', { [vpId]: record }, '+=', false)` dentro la
   **stessa** `TRANSACTION`. `markCanvasUpdated` resta dov'è. Guardia: `src` assente ⇒ ramo
   scalari (comportamento di oggi), mai un throw dentro una `TRANSACTION`.
3. **`components/editor-v2/utils/jjomTransformers.ts`** — i siti del §1.2. Quanti, dipende dalla
   domanda 1: minimo le 3 coppie + `manualSizeOf` come da prompt; raccomandato **tutti e sette**.
4. **`components/abstract/tabs/MetamodelTab.tsx`** — righe 137-140. `tm.node!.__raw` è già la
   sorgente; commento di una riga sull'esito atteso `'scalars'`.
5. **`utils/lastViewpoint.ts`** — righe 64-68, **solo il commento**: l'enumerazione dei lettori
   della root passa da quattro a cinque (entra `vertexLayoutAdapter.ts`).
6. **`docs/claude-code-log.md`** — entry.

**Non si tocca**: `vertexLayout.ts` (modulo puro — se servisse un cambio, mi fermo e chiedo),
`set_size` (`GraphDataElements.tsx:668-685`), `storeSize`, `VersionFixer.tsx`, `joiner/classes.ts`,
`useJjomSync.ts`, `syncState.ts`, `portDistribution.ts`.
Nell'opzione (b) del §2.4 il settimo file sarebbe `model/dataStructure/GraphDataElements.tsx`
(righe 1402-1425) e questo LIR andrebbe riemesso (§3, L-layer).

---

## 6. Scenari di smoke potenzialmente affetti

- **Regressione zero senza viewpoint** (il criterio della slice): aprire un metamodello, muovere e
  ridimensionare, ricaricare → identico a oggi. Sul metamodello `getActiveExclusiveVpId()` è
  `null` per costruzione (selettore non reso), quindi ogni ramo è `'scalars'`.
- **Viewpoint attivo ma NON esclusivo** (decorativo): l'adapter mappa su `null` **prima** del
  modulo puro. Va provato, perché è l'unico ramo dove «viewpoint attivo» e «scalari» convivono.
- **Drop dal Tree View / palette sul classico** (`MetamodelTab`): la posizione di drop deve
  restare quella di oggi.
- **Import Ecore** (es. Families.ecore): nessun vertice ha `layoutByViewpoint`, tutte le letture
  cadono sugli scalari. Nessun edge coinvolto.
- **Auto-layout ELK** (`EditorV2.tsx:3249`, persiste via `syncPositionBatchToJjom`): sotto un
  viewpoint esclusivo scriverebbe **N record completi**, uno per vertice, una action ciascuno
  dentro la stessa `TRANSACTION`. Va guardato per il volume, non per la correttezza.
- **Propagate size** (`syncSizeBatchToJjom`, da `EditorV2.tsx:1004`): stesso discorso.
- **⌘Z** dopo un gesto sotto viewpoint: ripristina il dizionario intero (`reducer.ts:242`).
- **Salva → riapri**: i record per viewpoint sopravvivono senza migrazione.
- **Non-obiettivo dichiarato**: resize via proxy L (`set_size`, e nell'opzione (a) anche
  `LVoidVertex.set_w/set_h`) scrive sulla sintassi astratta qualunque sia il viewpoint attivo.

---

## 7. Domande al GO (nessuna decisa qui)

1. **Perimetro delle letture in `jjomTransformers.ts`** (§1.2): le 4 coppie di posizione +
   `manualSizeOf` + package `:243-244` + `computeOptimalHandles` `:404-413` (raccomandato), oppure
   le sole 3 coppie + `manualSizeOf` come enumera il prompt? Nel secondo caso i nodi **M1**
   (`objectVertexToRFNode`) restano sulla sintassi astratta e la verifica visiva su un *modello*
   non può passare.
2. **`LVoidVertex` `:1402-1425`** (§2): (a) resta sugli scalari e si dichiara — raccomandato;
   (b) si apre l'arco `model/` → `editor-v2/` e il LIR si riemette; (c) adapter in sede neutra.
3. **Osservabilità al cambio di viewpoint** (§4): (a) accettare e riscrivere la prova 1 della
   verifica visiva in termini di reload; (b) armare la ri-trasformazione dentro questa slice,
   allargando il perimetro a `useJjomSync.ts`; (c) 1b come da prompt + 1c dedicata —
   raccomandato.

---

## 8. Grep di collisione (già eseguito)

`command grep -rn "vertexLayoutAdapter\|getActiveExclusiveVpId" --include="*.ts" --include="*.tsx" frontend/src`
→ exit 1, **0 occorrenze**. Controllo positivo sullo stesso comando con `readVertexLayout` →
2 file con segnale (`vertexLayout.ts` ×3, `vertexLayout.test.ts` ×13). Glob quotati, `command grep`
(BSD) perché il `grep` interattivo è un wrapper `ugrep` che ignora `--include` (CLAUDE.md §5).

---

## 9. File letti

```
frontend/src/components/editor-v2/sync/canvasToJjom.ts            (1-130; grep integrale delle SetFieldAction)
frontend/src/components/editor-v2/utils/jjomTransformers.ts       (1-70, 160-260, 335-425)
frontend/src/components/editor-v2/hooks/useJjomSync.ts            (1168-1232, 1260-1400, 1530-1550; grep viewpoint/modelid)
frontend/src/components/editor-v2/EditorV2.tsx                    (155-180, 3200-3250, 3355-3380; grep viewpoint)
frontend/src/components/editor-v2/viewpoint/layout/vertexLayout.ts (integrale)
frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts        (1-30)
frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts    (110-150)
frontend/src/components/abstract/tabs/MetamodelTab.tsx             (125-150)
frontend/src/components/abstract/tabs/EditorSwitch.tsx             (40-145)
frontend/src/model/dataStructure/GraphDataElements.tsx             (1-70 import, 440-460, 1350-1440, 1690-1710)
frontend/src/utils/lastViewpoint.ts                                (40-105)
frontend/src/joiner/index.ts                                       (92, 191, 204, 209)
docs/decisions.md                                                  (11, 20, 1703-1755)
docs/ratifiche/claude_2026-08-24_memo_ratifica_layout_slice1.md    (§1, §7)
docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md (integrale)
docs/discovery/discovery_2026-08-24_layout_d1_d8_d10.md            (§4)
docs/claude-code-log.md                                            (prime 40 righe, coda)
```

Nessun sorgente modificato in questa fase. `git status --short` vuoto alla chiusura del report.

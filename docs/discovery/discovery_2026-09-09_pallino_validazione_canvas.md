# Discovery — il pallino rosso sulle istanze che violano (fetta 1)

**Data**: 2026-09-09 · **Ramo**: `validation-skeleton` · **Fase 1, READ-ONLY**
**Normativa**: `docs/spec/claude_spec_2026-09-08_user_defined_validation.md`, serie R-VAL in
`docs/decisions.md`, `docs/claude_milestone_validazione_scheletro.md`
**Esito**: nessun file modificato oltre a questo referto e alla entry di log.

---

## 0. In una riga

Il badge sul canvas e' gia' agnostico rispetto al `kind`: non serve dichiarare niente. Manca una
cosa sola e una sola, l'**ancoraggio**: `publishValidationProblems` registra sotto l'id del
**DObject**, il badge del canvas e' montato sull'id del **DVertex**. L'invalidazione invece **non
esiste** in nessuna forma riusabile, e va introdotta: il registro non conosce il concetto di
«vecchio», i due produttori esistenti non ne hanno bisogno perche' ricalcolano da soli, e
`clearValidationProblems` e' un punto d'innesto gia' scritto che **nessuno chiama**.

---

## 1. Il doppio ancoraggio di `ConformanceProblemSync`

### 1.1 Il codice che lo fa

`frontend/src/components/editor-v2/problems/ConformanceProblemSync.tsx`, due pezzi.

Il risolutore, righe 59-70 — costruisce una mappa `DObject id -> DVertex id` scandendo i
`subElements` del grafo aperto:

```typescript
function buildVertexResolver(graphId: string | null | undefined): (objectId: string) => string | null {
    if (!graphId) return () => null;
    const lookup = store.getState().idlookup ?? {};
    const graph = lookup[graphId] as { subElements?: string[] } | undefined;
    const subEls = graph?.subElements ?? [];
    const map = new Map<string, string>();
    for (const id of subEls) {
        const ge = lookup[id] as { className?: string; model?: string } | undefined;
        if (ge?.className === 'DVertex' && ge.model) map.set(ge.model, id);
    }
    return (objectId: string) => map.get(objectId) ?? null;
}
```

La doppia registrazione, righe 109-115 — **due chiamate a `register` per lo stesso aggregato**:

```typescript
for (const agg of aggregates) {
    // TreeView surface: key by the DObject id.
    register(agg.objectId, agg);
    // Canvas surface: key by the resolved DVertex id (distinct from the object id).
    const vertexId = resolveVertex(agg.objectId);
    if (vertexId && vertexId !== agg.objectId) register(vertexId, agg);
}
```

`register` (righe 86-107) scrive la stessa `NodeProblem` con `id = ${kind}:${nodeId}`, quindi le
due voci differiscono solo per `nodeId` e per l'id derivato. Entrambe portano `ownerModelId`.

Il commento in testa al file (righe 10-16) dichiara la ragione: le due superfici indicizzano il
registro su **spazi di id diversi**.

### 1.2 Non e' filtrato per `NodeProblemKind` — e non lo e' da nessuna parte

Il filtro non esiste, ne' qui ne' a valle. `useNodeProblems(nodeId)` restituisce **tutte** le voci
di quel nodo, di qualunque `kind` (`useNodeProblems.ts:10-16` -> `getNodeProblemsSnapshot`,
`registry.ts:255`). La separazione fra i produttori e' realizzata **per spazio di id e per
`ownerModelId`**, mai per `kind` sul lato lettura. L'unico uso di `kind` in lettura e'
`getProblemIdsOwnedBy(kind, ownerModelId)` (`registry.ts:273`), che serve al **ritiro** di un
produttore, non al disegno.

### 1.3 Vincoli del risolutore, da conoscere prima di copiarlo

- **E' privato**, e lo e' apposta: il commento (righe 53-57) dice che duplica
  `findVertexIdForObject` di `canvasToJjom.ts`, che non e' esportata, «so no critical-zone file is
  modified». Una terza copia e' esattamente la cosa da non fare.
- **E' istantanea**: legge `store.getState()` al momento della `useEffect`, non e' reattiva.
- **E' limitata al grafo aperto**: un oggetto senza vertice in quel grafo non ottiene la voce
  canvas. E' anche il motivo per cui la mappa e' `model -> id` e non l'inverso: piu' grafi
  potrebbero contenere un vertice dello stesso oggetto, e la scelta e' «quello del grafo aperto».

---

## 2. Un `kind` nuovo: i badge lo mostrano gia'

**Risposta: si', gia' oggi, senza dichiarare niente.** `'validation'` e' gia' membro dell'unione
(`registry.ts:38`, aggiunto allo Step 3 con la motivazione scritta nel commento sopra).

I punti che assumono l'insieme dei `kind`, tutti censiti:

| Punto | Che cosa assume | Effetto su un kind nuovo |
|---|---|---|
| `registry.ts:38` | l'unione `NodeProblemKind` | va aggiunto il membro — **gia' fatto** per `'validation'` |
| `registry.ts:273` `getProblemIdsOwnedBy` | filtra per `kind` | serve al ritiro del produttore, non al disegno |
| `NodeProblemOverlay.tsx:193` | `p.kind === 'conformance' && p.conformance?.length` | un altro kind cade sul ramo `else`: rende `p.description` come riga unica |
| `formDiagnostics.ts:87-98` | ramifica sulla **presenza** di `p.conformance`, non sul kind | nessuno; il commento dice «duplicate-name today» ed e' invecchiato, non sbagliato |
| `NodeProblemIndicator.tsx` | niente | del tutto agnostico: severita', conteggio, titolo, overlay |
| `TreeViewContent.tsx:898-914` (`EntityRow`) | niente | del tutto agnostico |

Quindi il pallino accenderebbe **oggi**, se la voce fosse chiavata sull'id del vertice.

### 2.1 Dov'e' davvero il buco

`validationToProblems.ts:77` registra **solo** sotto `v.instanceId`, che e' l'id del DObject, e il
commento in testa al file (righe 26-34) lo dichiara come scelta dello scheletro:

> `nodeId` e' l'id del **DObject**, non quello del DVertex. […] Qui la seconda non serve: lo
> scheletro **non mette indicatori sul canvas**.

L'id del nodo React Flow e' l'id del DVertex: `EditorV2.tsx:795-796` e `1981-1982` costruiscono
`{ id: vertexId, type: 'objectNode' }`, e `ObjectNode` passa quel `id` a
`<NodeProblemIndicator nodeId={id} />` in tutti e tre i rami di render che ha (riga 920 ramo IR,
1151 ramo pill, 1217 ramo rettangolo — nessun ramo di primo livello ne e' privo).

**Conseguenza misurata, e piu' larga di quanto il commento dice**: oggi la voce chiavata sul
DObject non accende nemmeno l'albero, per una **istanza M1**. L'unica riga dell'albero che chiama
`useNodeProblems` e' `EntityRow` (`TreeViewContent.tsx:898`), usata per modelli, package, classi,
feature, view, viewpoint, trasformazioni e metamodelli. Le istanze M1 le disegna `InstanceRow`
(`TreeViewContent.tsx:988-1090`), che costruisce a mano il proprio
`<div className="tree-row tree-row--feature">` e **non chiama `useNodeProblems`**. Il triangolo
dell'albero e' quindi una superficie M2.

L'unico consumatore odierno di una voce chiavata sul DObject di un'istanza M1 e' il **rail delle
proprieta'**: `IRForm.tsx:371`, `useNodeProblems(objectId)`, che alimenta il riassunto
«N errors / N warnings» via `collectFormDiagnostics`. Cioe': la registrazione attuale non e'
sprecata, ma la superficie che accende non e' quella che il commento suggerisce.

### 2.2 Chi risolve il vertice, nella fetta 1

`publishValidationProblems` e' una **funzione**, non un componente montato, e il suo chiamante e'
`Toolbar.handleValidate` (`Toolbar.tsx:705-711`). `ToolbarProps` **non ha `graphId`**
(interfaccia alle righe 32-100 circa: nessun campo di quel nome; `command grep -n "graphId"
Toolbar.tsx` non restituisce nulla). `EditorV2` ce l'ha in scope e lo passa gia' a
`ConformanceProblemSync` sulla stessa riga in cui rende la `Toolbar` (`EditorV2.tsx:4223-4224`).

Tre strade, in ordine di debito crescente:

1. **Passare il risolutore dall'alto**: `publishValidationProblems(ownerModelId, violations,
   resolveVertex?)`. Additiva, non tocca nessun file di §3.1, e lascia la conoscenza del grafo dove
   gia' vive. Richiede un prop `graphId` sulla `Toolbar` (una riga in `EditorV2`), oppure che
   `EditorV2` costruisca il risolutore e lo passi come callback.
2. **Estrarre il risolutore in un modulo condiviso** sotto `problems/`, importato da entrambi i
   produttori. Piu' pulito nel lungo periodo, ma tocca `ConformanceProblemSync` — che e' fuori dal
   perimetro dichiarato di questa fetta e va negoziato.
3. **Terza copia dentro `validationToProblems.ts`.** Da non fare: sarebbe la terza scrittura della
   stessa scansione, dopo quella privata di `canvasToJjom.ts` e quella di
   `ConformanceProblemSync`.

### 2.3 Limite dichiarato: l'istanza che non e' un nodo

Un oggetto M1 puo' essere reso come **edge sintetico** (object-as-edge, id `irobj_*`,
`EditorV2.tsx:419`, `1920-1980`, `2039`). In quel caso non esiste nessun `ObjectNode`, quindi
nessun `NodeProblemIndicator`, e nessun id sotto cui registrare il pallino lo farebbe comparire.
Va dichiarato come limite della fetta, non aggirato: il segnale su un edge e' un'altra superficie.

---

## 3. Invalidazione — la domanda che conta

### 3.1 Non esiste, e la ricerca e' controllata

- **Il registro non conosce «vecchio»**: `NodeProblem` (`registry.ts:71-114`) ha `createdAt` e
  `resolvedAt`, e nient'altro di temporale. Nessun campo `stale`, nessuna API che lo esprima.
- **I due produttori esistenti non ne hanno bisogno**, e questa e' l'asimmetria che il prompt
  nomina: sono **funzioni della firma**. `UniquenessProblemSync` ricalcola su una firma
  `useSelector` su `id + name + father`; `useConformance` su una firma mirata piu' 500 ms di
  debounce (`useConformance.ts:45-77, 79-117`). Il loro badge e' fresco per costruzione, non per
  disciplina. La validazione gira **a comando** e quindi non ha nessuna delle due proprieta'.
- **`clearValidationProblems` esiste e non e' chiamata da nessuno.**
  `validationToProblems.ts:99-101`. Controllo eseguito con controllo positivo sullo stesso
  comando: `command grep -rn "clearValidationProblems" frontend/src --include="*.ts"
  --include="*.tsx"` restituisce **1 riga**, la sua definizione; lo stesso comando su
  `publishValidationProblems` ne restituisce **3** (definizione, import, chiamata). Il punto
  d'innesto e' scritto, con tanto di commento che dice a cosa serve — «serve quando l'esito
  precedente non e' piu' vero e non c'e' un giro nuovo che lo dica» — e non e' cablato.
- **`AFTER_TRANSACTION` non e' una sottoscrizione**: `redux/action/action.ts:235` accoda in
  `after_transaction`, e `DO_AFTER_TRANSACTION_NOT_FOR_USERS` (riga 242) svuota la coda a ogni
  transazione. E' un one-shot. La spec §9 ha gia' iscritto il difetto vero: non dice **quali**
  oggetti sono cambiati.
- **Il registro non ha un ritiro per kind**: l'unica enumerazione esportata e'
  `getProblemIdsOwnedBy`, che e' esattamente quello su cui `clearValidationProblems` e'
  costruita.

Conclusione: **l'invalidazione va introdotta**. Non c'e' niente da riusare se non il punto
d'innesto gia' scritto.

### 3.2 Tre forme, con il loro prezzo

**(a) Ritirare — le voci spariscono.** Un `ValidationStalenessSync` montato accanto agli altri due
produttori in `EditorV2.tsx:4223`, con una firma `useSelector` della stessa forma di
`useConformance`; al cambio, `clearValidationProblems(modelid)`.
*Costo*: minimo. Nessuna modifica al registro, all'indicatore o al foglio di stile; usa la
funzione morta.
*Prezzo vero*: il pallino sparisce **in silenzio**, e l'utente non distingue «l'ho sistemata» da
«non lo so piu'». Nota che `markResolved` sarebbe **peggio** di `clearProblem` qui: accenderebbe il
verde con il suo transitorio di 5 s, cioe' direbbe «sistemata» quando la verita' e' «non
ricontrollata».

**(b) Marcare — le voci restano, spente.** Un `stale?: boolean` opzionale su `NodeProblem`
(proprieta' opzionale additiva, ammessa dalla Regola 11), un `markStale(kind, ownerModelId)` nel
registro, una quarta variante del pallino (cavo/grigio) e una riga nell'overlay che dice «esito di
un giro precedente».
*Costo*: il piu' alto dei tre, e **non e' nel pallino**. Tocca `registry.ts`,
`NodeProblemIndicator.tsx` + `.scss`, `NodeProblemOverlay.tsx`, e soprattutto
`formDiagnostics.ts:85`, che oggi conta **ogni voce non risolta**: una voce stale continuerebbe a
sommare nel riassunto del rail come un errore vivo, che e' il difetto che si voleva chiudere,
spostato di una superficie.
*Guadagno*: e' l'unica delle tre che dice la verita' all'utente.

**(c) Rivalutare — il problema si toglie invece di dichiararlo.** E' la riga che la spec stessa
scrive per la fetta 1: «comando esplicito piu' rivalutazione totale con debounce all'inerzia»
(§9), ripetuta in §11.
*Costo*: `buildEvalContext` e' O(oggetti x feature) e **senza cache**
(`validationContext.ts:47`). Misurabile prima di scegliere: `runValidationOnModel` restituisce gia'
`elapsedMs` (`validationContext.ts:207, 220`), quindi il budget si legge senza scrivere una riga.
La spec dichiara anche la via d'uscita: «se lo sfora, si degrada al solo comando esplicito invece
di rallentare l'editing» — nel qual caso si ricade su (a) o (b).

Le tre non si escludono: (c) con un budget sforato **diventa** (a) o (b), e (b) e' il modo onesto
di degradare.

### 3.3 Un vincolo che vale per tutte e tre: la firma deve coprire anche le REGOLE

Qualunque sia la forma scelta, il segnale non e' solo il modello. Modificare il corpo di una
regola, spegnerla, o cancellare il viewpoint invecchia i pallini **esattamente come** una modifica
al modello. `collectValidationRules` (`validationContext.ts:83-102`) legge da `idlookup` il
`DValidationViewpoint` e i suoi `DValidationRule` (`id`, `name`, `context`, `body`, `message`,
`enabled`). Una firma costruita sul solo modello mancherebbe tutto questo in silenzio — cioe'
riprodurrebbe, un piano piu' in la', il difetto di R-VAL-17.

---

## 4. Il badge: testo e molteplicita'

### 4.1 Piu' regole su una stessa istanza: gia' rappresentabile

`validationProblemId` (`validationToProblems.ts:51-53`) usa la **forma lunga**
`${kind}:${nodeId}:${ruleId}`, con il commento che cita R-VAL-12 per nome. Quindi N regole violate
dalla stessa istanza = **N voci distinte sullo stesso `nodeId`**, senza collisione. Il registro le
raggruppa per nodo in `rebuildSnapshots` (`registry.ts:136-156`).

### 4.2 Che cosa mostra, esattamente

| Superficie | Che cosa dice | Riferimento |
|---|---|---|
| Tooltip del pallino | **solo il titolo della PRIMA voce** (`problems[0].title`, cioe' il nome della regola), o `'Resolved'` | `NodeProblemIndicator.tsx:26, 53, 63-64` |
| Numero sul pallino | `voci attive .reduce((n,p) => n + (p.conformance?.length ?? 1), 0)` — una voce di validazione vale **1**, quindi 3 regole violate mostrano «3» | `NodeProblemIndicator.tsx:48-51` |
| Colore | severita' massima fra le attive; oggi ogni violazione e' `'error'`, quindi **sempre rosso** | `NodeProblemIndicator.tsx:11-16`; `validationToProblems.ts:83` |
| Popover (al click) | **tutte** le voci del nodo, un blocco ciascuna: titolo = `p.title` (nome regola), corpo = `p.description` (messaggio della regola) | `NodeProblemOverlay.tsx:190-237, 224` |

La molteplicita' e' quindi leggibile **nel popover**, non nel tooltip. Il tooltip e' nativo
(`title` + `aria-label`), quindi niente HTML e niente elenco.

### 4.3 Tre limiti misurati, da mettere in conto alla fetta

1. **«Prima voce» e' l'ordine di registrazione, non la severita'.** `problems[0]` viene dall'ordine
   di inserimento nella `Map` del modulo. Su un nodo con voci di conformance e di validazione
   insieme, quale titolo finisce nel tooltip e quale id apre l'overlay non e' governato da
   nessuna regola: `NodeProblemIndicator.tsx:26-27` apre l'overlay su `problems[0].id`.
2. **Il numero somma i produttori senza distinguerli.** Un nodo con 2 violazioni di conformance e
   2 di validazione mostra «4», e il popover e' l'unico posto dove si vede di che cosa sono fatte.
3. **Il popover non ha altezza massima.** `NodeProblemOverlay.scss` (misurato: 175 righe,
   controllo positivo `command grep -c "node-problem-overlay"` = 3) dichiara `min-width: 220px` e
   `max-width: 320px` e **nessun `max-height`, nessun `overflow`**. Dieci violazioni su un nodo
   producono dieci blocchi, e l'unica difesa e' `clampInViewport`
   (`NodeProblemOverlay.tsx:67-72`), che sposta il pannello ma non lo accorcia. Con R-VAL-12 questo
   caso smette di essere teorico.

---

## 5. Costo: il canvas si ridisegna da solo

**Nessun evento serve.** Il registro e' una sorgente `useSyncExternalStore`: `registerProblem` ->
`rebuildSnapshots()` -> `notify()` (`registry.ts:194-209`), e ogni `NodeProblemIndicator` montato
(uno per `objectNode`), ogni `EntityRow` dell'albero e ogni `IRForm` sono sottoscrittori. La
`rebuildSnapshots` conserva l'identita' dell'array per nodo quando il contenuto non cambia
(`registry.ts:146-150`), quindi `useSyncExternalStore` si ferma su `Object.is` e **solo i nodi la
cui voce e' cambiata rirenderizzano**.

Il costo non e' nella lettura, e' nella **scrittura**:

- `publishValidationProblems` chiama `registerProblem` **una volta per violazione**
  (`validationToProblems.ts:76-90`), e **ogni** chiamata fa una `rebuildSnapshots()` completa su
  tutto il registro piu' una `notify()` a **tutti** i listener. Con V violazioni, P voci gia' nel
  registro e L sottoscrittori: O(V x P) di ricostruzione e V x L invocazioni di listener, in una
  raffica sincrona.
- Il ritiro e' una seconda raffica: `markResolved` ricostruisce e notifica anch'essa per id
  (`registry.ts:235-246`).

Oggi e' invisibile — il comando e' esplicito e i modelli dello scheletro sono piccoli. **Diventa
la cosa da misurare nel momento esatto in cui si sceglie la strada (c) del §3.2**, la
rivalutazione all'inerzia. La mitigazione ovvia e' un'API di batch sul registro (registra molte,
ricostruisci una volta, notifica una volta): e' una modifica al registro, e appartiene alla fetta
che decide di pagarla.

Costo separato e gia' iscritto: la corsa in se'. `buildEvalContext` e' O(oggetti x feature) senza
cache (`validationContext.ts:45-50`), una volta per comando.

---

## 6. Che cosa serve, in minimo, per il pallino rosso

In ordine, e con il file:

1. **L'ancoraggio doppio** in `validationToProblems.ts`: seconda `registerProblem` sotto l'id del
   DVertex risolto, sul modello di `ConformanceProblemSync.tsx:109-115`. Con il risolutore passato
   dall'alto (§2.2, strada 1), piu' un `graphId` sulla `Toolbar`.
2. **La regola di invalidazione**, da decidere in chat: §3.2, tre forme con i loro prezzi. E'
   l'unica voce che non e' meccanica.
3. **Il tetto del popover**, se si accetta R-VAL-12 sul canvas: `max-height` + `overflow-y` in
   `NodeProblemOverlay.scss`. Una riga e mezza, ma tocca un foglio condiviso con gli altri due
   produttori.

Fuori, e da dichiarare, non da risolvere: l'istanza resa come edge sintetico (§2.3); le due
severita' (oggi tutto `'error'`, `validationToProblems.ts:83`), che il piano milestone elenca
esplicitamente sotto «Fetta 1 completa».

---

## 7. Nota su un commento invecchiato

`ConformanceProblemSync.tsx:11-13` dice «the TreeView row uses the DObject id». E' vero per la
meta' M2 dell'albero (`EntityRow`), ed e' falso per le istanze M1, che `InstanceRow` disegna senza
mai chiamare `useNodeProblems` (§2.1). Non e' un difetto di quel produttore — la conformance
riguarda oggetti M1 e il suo pallino sul canvas funziona — ma un lettore che progetti la fetta 1
su quella frase conclude che l'albero gia' si accende, e non e' cosi'. Segnalato qui e non
corretto: la Fase 1 e' READ-ONLY.

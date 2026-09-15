# Discovery — Timing dell'executor JjScript (M1) — Fase 1 (read-only)

**Data**: 2026-07-06
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery, read-only. **Nessun fix applicato.** Solo strumentazione `// TEMP-DISCOVERY` (non committata).
**Sintomo**: script M1 di ~189 comandi (`create instance` + `set`) → ~519 s (≈ 2.7 s/comando).

> HARD STOP rispettato: questo documento chiude la Fase 1. Nessuna modifica ai timeout,
> al polling, al sync. La Fase 2 (fix) parte solo dopo analisi dei numeri in chat.

---

## 0. Executive summary

Il tempo per comando ha **due componenti distinte**, entrambe reali:

1. **Attesa fissa dead-poll di ~500 ms su OGNI `set` M1** — bug confermato staticamente.
   Il pre-check `waitForDependencies` risolve la dipendenza `target` (il nome dell'istanza)
   con resolver che **non guardano `model.objects`**, dove vivono le istanze M1. L'istanza
   *esiste già* (creata da un comando `create` precedente) ma è **invisibile al waiter** →
   polling fino a `MAX_WAIT_MS = 500 ms`, poi warning, poi il comando riesce comunque
   (perché l'handler M1 usa un lookup diverso, `findInstanceByName`, che invece guarda
   `model.objects`). Le `create instance` **non** pagano l'attesa (0 dipendenze required).
   Contributo stimato: ~95 `set` × 500 ms ≈ **~47 s** — reale ma **non sufficiente** a
   spiegare i 519 s.

2. **~2.2 s/comando non spiegati dal waiter** — vanno misurati. Ipotesi dominante:
   **re-render + reconciliation del canvas per comando, con costo che cresce col numero di
   istanze (O(n) per comando → O(n²) sullo script)**. Ogni `DObject.new` / `SetFieldAction`
   fa dispatch Redux → aggiornamento store → re-render dei componenti sottoscritti, incluso
   `useJjomSync` (Step 4) che ricostruisce nodi/edge su TUTTE le istanze. La strumentazione
   serve a confermare/quantificare questa seconda componente.

La strumentazione emette due righe `[JjScript-TIMING]` per comando (una dal waiter/executor,
una dal loop UI) da cui si ricava il breakdown `parse / wait / apply / settle / total`.

---

## 1. Localizzazione dell'executor

L'executor JjScript **non** sta in `src/jjtl/` (quello è JjTL, altro linguaggio).
Path reale: `frontend/src/jjscript/executor/`.

```
frontend/src/jjscript/
├── executor/
│   ├── executor.ts        ← classe JjScriptExecutor, executeAST(), executeBatch/Script
│   ├── elementWaiter.ts   ← waitForDependencies() — QUI il timeout fisso 500 ms
│   ├── dependencies.ts    ← extractDependencies() — cosa aspetta ogni comando
│   ├── resolvers.ts       ← resolveElement / resolveElementInMetamodel (M2-only!)
│   ├── utils.ts           ← getProject / getTargetMetamodel / getActive{Model,Level}
│   └── commands/
│       ├── create.ts      ← executeCreate → routing M1 a instance.ts
│       ├── instance.ts    ← executeCreateInstance / executeSetInstance (path M1 reale)
│       └── set.ts         ← executeSet → routing M1 a instance.ts
├── services/JjScriptService.ts   ← execute(): risolve level/model/metamodel per comando
└── components/ScriptBlock.tsx    ← runner UI batch (loop per-comando + BATCH_DELAY)
```

---

## 2. Timeout / delay trovati (tabella)

| # | File:riga | Valore | Condizione | Cosa aspetta |
|---|-----------|--------|-----------|--------------|
| T1 | `executor/elementWaiter.ts:17` | `MAX_WAIT_MS = 500` | Solo se il comando ha dipendenze `required` **non risolvibili** | Cap massimo del polling delle dipendenze |
| T2 | `executor/elementWaiter.ts:16` | `POLL_INTERVAL_MS = 30` | Idem | Intervallo tra un poll e il successivo (~17 poll fino al cap) |
| T3 | `components/ScriptBlock.tsx:92` | `BATCH_DELAY_MS = 20` | Tra un comando e il successivo (non dopo l'ultimo) | Pacing visivo del loop UI |
| T4 | `components/ScriptBlock.tsx:234` | `2000` | Reset icona "copiato" | Irrilevante per l'esecuzione |

**Nota su T1/T2 — è già un wait-until-resolvable, non un `setTimeout` cieco.**
`waitForDependencies` (`elementWaiter.ts:45-87`) fa `while (elapsed < MAX_WAIT_MS)`,
ricontrolla `findUnresolved` ad ogni giro e **ritorna appena tutto è risolvibile**
(`waitedMs: 0` se già risolto). Il design è corretto; il problema è che per le istanze M1
la risoluzione **non riesce mai** (§3), quindi degenera nell'attesa piena di 500 ms.

**Nessun `setTimeout(…, 1000)` "deferred attribute" nel path M1.** Il pattern §9.2 di
CLAUDE.md (deferred 1000 ms) è usato altrove (es. `ProjectEditor` per la JjTL), **non**
in `executeCreateInstance`/`executeSetInstance`, che scrivono in modo sincrono.

---

## 3. Il bug del pre-check: perché ogni `set` paga 500 ms

### 3.1 Dipendenza estratta per `set`
`executor/dependencies.ts:77-85` — per `set X.prop = v`:
```ts
deps.push({ name: args.target, role: 'target', required: true });   // ← X, REQUIRED
if (isQualifiedName(args.value)) deps.push({ name: args.value, role: 'value-reference', required: false });
```
`args.target` è il **nome dell'istanza** `X` (la proprietà è in `args.property`, separata).
Quindi ogni `set` ha una dipendenza **required** sul nome dell'istanza.

### 3.2 Il waiter prova a risolvere `X` con resolver M2-only
`elementWaiter.ts:96-111` → `findUnresolved` chiama, in ordine:
`resolveElementInMetamodel(dep.name, targetMetamodel)` poi `resolveElement(dep.name, project)`.

- `getTargetMetamodel` (`utils.ts:287-306`) ritorna il **metamodello M2**, non il modello M1.
- `resolveElementInMetamodel` / `resolveElement` (`resolvers.ts`) discendono solo queste
  collezioni: `packages, subPackages, classifiers, classes, attributes, references,
  operations, parameters, literals, enumerators` (righe 124-129, 285-290, 335-339).
  **`objects` / `instances` NON sono nell'elenco.** Le istanze M1 (DObject in
  `model.objects`) non vengono mai visitate.

Risultato: `X` è **strutturalmente irrisolvibile** dal waiter → `findUnresolved` la ritorna
sempre come non risolta → il `while` gira i 500 ms pieni → `executor.ts` logga
`[JjScript] Unresolved dependencies after 500ms: …` (executor.ts, ramo `!allResolved`) →
prosegue comunque.

### 3.3 Poi il comando riesce, con un lookup DIVERSO
`commands/instance.ts:101-104` — l'handler M1 reale usa:
```ts
function findInstanceByName(model, instanceName) {
    const objects = (model as any).objects ?? [];      // ← QUI sì, guarda model.objects
    return objects.find(o => o?.name === instanceName) ?? null;
}
```
Quindi l'istanza **c'è** e viene trovata: il `set` va a buon fine. I 500 ms sono **puro
tempo morto** speso a cercare nel posto sbagliato qualcosa che esiste già.

### 3.4 Le `create instance` NON pagano l'attesa
`create instance of X "name"` (parser `parser.ts:256-283`, `parseCreateOptions:333`):
`elementType='instance'`, `name=X`, `parent=undefined`, `options.defaultValue='name'`.
`dependencies.ts:146-160` (`extractCreateDependencies`): il parent è pushato solo se
`args.parent` è settato **e** l'elementType è tra
`attribute/reference/containment/composition/operation/parameter/literal` (non `instance`);
`options` non ha `type/superClass/returnType/opposite/exceptions`. → **0 dipendenze** →
`waitForDependencies` ritorna `waitedMs: 0` all'istante. Confermato staticamente.

**Conseguenza netta**: l'attesa fissa colpisce **solo i `set`**, ~500 ms l'uno. Con ~95 set
≈ 47 s. Non spiega i 519 s → cercare il resto nell'apply/re-render (§5).

---

## 4. Pipeline per comando (mappa in lettura)

Runner più probabile per lo scenario (script generato mostrato in chat Jodie):
`Jodie ChatMessages` → `MarkdownRenderer` → `ScriptBlock`.

```
ScriptBlock.handleExecute()  [ScriptBlock.tsx:308-427]
  loop for i in commands:                         ── nessun yield esplicito oltre agli await
    ├─ setLineStates(running)   → re-render UI console
    ├─ await onExecute([cmd])   = handleJjScriptExecute  [ChatMessages.tsx:316-366]
    │     └─ await JjScriptService.execute(cmd)   [JjScriptService.ts:61-100]
    │           ├─ getActiveLevel()               [utils.ts:171]  ─┐ risolti PER COMANDO:
    │           ├─ getActiveModel()               [utils.ts:126]   │ store.getState() +
    │           ├─ getActiveMetamodel()           [utils.ts:61]    │ DockManager.getLayout()
    │           └─ executeCommand(…level,modelId,mmId) ────────────┘ (costo minore ma non nullo)
    │                 └─ executor.execute()        [executor.ts:64]
    │                       ├─ parse(input)                    ◄── PARSE
    │                       └─ executeAST()        [executor.ts:90]
    │                             ├─ extractDependencies()
    │                             ├─ await waitForDependencies()  ◄── WAIT (0 su create, ~500 su set)
    │                             └─ switch(command):
    │                                   create → executeCreate → executeCreateInstance  [instance.ts:154]
    │                                             └─ DObject.new(...)                     ◄── APPLY (dispatch Redux)
    │                                   set    → executeSet → executeSetInstance         [instance.ts:431]
    │                                             └─ TRANSACTION { featureProxy.value = … } ◄── APPLY (dispatch Redux)
    ├─ setLineStates(success)   → re-render UI console
    ├─ await sleep(BATCH_DELAY_MS=20)   ─── durante questo yield gira il commit React ◄── SETTLE (re-render/sync)
    └─ (loop)
```

### Punti di costo sospetti (in ordine di impatto atteso)

1. **SETTLE / re-render + sync per comando** *(sospetto principale, da misurare)*.
   L'`apply` (dispatch) è sincrono e veloce; il costo vero è il **re-render asincrono** che
   parte dal dispatch e blocca il main thread durante lo `sleep(20)` e oltre. Con il modello
   che cresce, ogni re-render costa di più → **crescita superlineare**. Contatto critico:
   `useJjomSync` (§6).
2. **WAIT dead-poll 500 ms su ogni `set`** *(confermato, ~47 s totali)*.
3. **Risoluzione contesto per comando** in `JjScriptService.execute` (`getActiveModel`/
   `getActiveMetamodel` → `DockManager.dock.getLayout()` + `store.getState()`), ripetuta
   189 volte. Costo unitario piccolo, ma non nullo; da tenere d'occhio nei numeri.
4. **`setLineStates` (React) due volte per comando** nel loop UI: due re-render della sola
   console (lista righe) per comando. Minore, ma cresce con `lineStates.length`.

### Risposte alle 4 domande della Fase 1
1. **L'attesa è su tutti i comandi o solo le create?** → Solo dove c'è una dipendenza
   `required` irrisolvibile: in pratica **solo i `set`** (~500 ms l'uno). Le `create instance`
   hanno 0 dipendenze → 0 attesa.
2. **Funzione di lookup per nome (file+firma)?** → **Due funzioni diverse, ed è il punto**:
   - Pre-check: `findUnresolved` → `resolveElementInMetamodel(QualifiedName, LModel)` /
     `resolveElement(QualifiedName, LProject)` in `resolvers.ts` — **M2-only, NON guarda
     `objects`**.
   - Handler M1 reale: `findInstanceByName(model: LModel, instanceName: string)` in
     `instance.ts:101` — **guarda `model.objects`**.
   Non è la stessa funzione: il pre-check e l'esecuzione usano risolutori incoerenti.
3. **Cosa scatena il re-render dopo ogni comando?** → Il dispatch Redux (`DObject.new` /
   `SetFieldAction` / write sul proxy dentro `TRANSACTION`) aggiorna lo store; i componenti
   sottoscritti si ri-renderizzano. Per il canvas v2 il contatto è `useJjomSync` (§6): un
   sync incrementale che, alla creazione di istanze/edge, rifà lavoro proporzionale al numero
   di istanze. **Non c'è sospensione del sync durante lo script.**
4. **Blocca il main thread tra un comando e l'altro?** → Il loop **cede** il controllo (gli
   `await` su executor e su `sleep(20)` sono yield reali), quindi la UI non è del tutto
   congelata; ma **ogni re-render è sul percorso critico** e blocca il main thread mentre
   avviene. Non c'è batching/`requestIdleCallback`: un re-render per comando.

---

## 5. Dove va il tempo non spiegato dal waiter (da confermare coi numeri)

- Waiter: ~500 ms × #set. Con 189 comandi ~metà `set` → ~47 s.
- Residuo: 519 − 47 ≈ **472 s** (~2.5 s/comando) → **apply + settle**.
- L'`apply` sincrono è tipicamente sub-ms/pochi ms (un dispatch). Quindi il residuo è quasi
  tutto **settle (re-render/sync)**, e l'ipotesi è che **cresca con l'indice del comando**
  (più istanze = re-render più caro). La strumentazione `iter` per riga permette di
  verificare la crescita: se `iter` aumenta con `line`, è O(n²) da re-render/sync.

---

## 6. Contatti con useJjomSync (SOLO mappatura — zona critica, non toccata)

`frontend/src/components/editor-v2/hooks/useJjomSync.ts` è ZONA CRITICA (CLAUDE.md §3).
Contatti rilevanti per lo script M1 (mappati in lettura, **nessuna modifica**):

- **Step 4** ha dipendenze effetto che includono `modelObjectCount` (CLAUDE.md §3.5). Ogni
  `create instance` cambia il conteggio istanze → l'effetto di sync ri-scatta e riconcilia
  nodi/edge del canvas su tutte le istanze presenti → costo O(n) per comando.
- **`useM1ReferenceEdges.ts`** (supplemento allo Step 4 per i valori reference M1 popolati
  post-mount, CLAUDE.md §3.5) ascolta i cambi di valore M1: ogni `set X.ref = "Y"` che
  popola uno slot reference può innescare creazione/riconciliazione di edge con le stesse
  guardie (`hasCanvasEdgePair`).
- **`syncState.ts`** (`hasCanvasEdgePair`/`markCanvasEdgePair`) è la mappa di dedup edge
  consultata dalla riconciliazione.

**Implicazione per la Fase 2**: qualunque intervento che tocchi la sospensione/il debounce
del sync durante lo script (idea di design "sospendi sync + flush finale") richiede un
**Layer Impact Report** (CLAUDE.md §3.2) e va deciso separatamente. In questa fase: solo
mappatura, nessuna modifica a questi file.

---

## 7. Strumentazione aggiunta (TEMP-DISCOVERY, non committata)

Due punti, tutte le righe marcate `// TEMP-DISCOVERY`. **Da rimuovere prima di qualsiasi
commit; nessun `git add`.**

### 7.1 `frontend/src/jjscript/executor/executor.ts`
- `execute()`: misura `parse` (attorno a `parse(input)`) e lo memorizza in `this._tParseMs`.
- `executeAST()`: misura `wait` (attorno a `waitForDependencies`) e `apply` (attorno allo
  `switch`), poi logga per comando:
  ```
  [JjScript-TIMING] cmd=<create|set|…> parse=<ms> wait=<ms> apply=<ms> total=<ms> in="<primi 60 char>"
  ```
  `total` = parse + (wait + apply + overhead executeAST). **Non include** il re-render (che è
  asincrono e avviene dopo il ritorno del comando).

### 7.2 `frontend/src/jjscript/components/ScriptBlock.tsx`
- Loop di `handleExecute()`: misura il **wall-clock per comando** (dall'inizio iterazione a
  dopo lo `sleep(BATCH_DELAY_MS)`), che **assorbe il re-render** avvenuto durante il pacing:
  ```
  [JjScript-TIMING] line=<n> iter=<ms> cmd="<primi 60 char>"
  ```
  Da cui: **settle ≈ iter − (executor.total) − BATCH_DELAY_MS(20)**.

> Nota: la riga `line=… iter=…` la emette **solo il runner ScriptBlock** (es. script mostrato
> in chat Jodie). La riga `cmd=… parse/wait/apply/total` la emette **sempre l'executor**,
> qualunque sia il runner. Se lo script viene lanciato in modo "Step" o dopo uno "Skip", la
> riga `iter` non compare (loop diverso), ma la riga executor sì.

---

## 8. Come raccogliere i numeri (istruzioni per Alfonso)

1. Assicurati che il dev server sia su **http://localhost:3001/** (`npm start`).
2. Apri la **console del browser** (DevTools) e nel filtro incolla `JjScript-TIMING`.
3. Apri un modello **M1** (editor istanze) con il suo metamodello di conformità caricato.
4. Esegui lo script M1 di prova (i ~189 `create instance` + `set`) dal punto in cui lo usi
   di solito (pulsante **Run** del blocco JjScript in chat Jodie, oppure il runner batch).
5. A fine esecuzione, **copia tutte le righe `[JjScript-TIMING]`** dalla console e incollale
   in chat di progetto. Utile anche: registra un **Performance profile** (DevTools →
   Performance) di ~10-20 s durante l'esecuzione, per vedere se il main thread è dominato da
   re-render/commit React.

### Cosa guarderemo nei numeri
- **`wait` sui `set`**: atteso ~500 ms costante → conferma il dead-poll. Se è 0, l'ipotesi §3
  va rivista (istanza risolta per altra via).
- **`wait` sulle `create`**: atteso ~0 → conferma che l'attesa non le tocca.
- **`apply`**: atteso pochi ms → se alto, il costo è nel dispatch/handler, non nel render.
- **`iter` in funzione di `line`**: se cresce con l'indice → conferma il costo re-render/sync
  O(n²) (sospetto principale). Se è piatto → il costo è dominato da `wait` costante.
- **`iter − total − 20` (settle)**: la quota di re-render/sync per comando.

---

## 9. Hard stop

Fine Fase 1. **Non** modificare `MAX_WAIT_MS`, **non** implementare polling su
`findInstanceByName`/`model.objects`, **non** toccare `useJjomSync`/`useM1ReferenceEdges`/
`syncState`. Rimuovere la strumentazione `TEMP-DISCOVERY` prima di ogni commit.

### Direzioni per la Fase 2 (NON implementate ora — solo per orientare la discussione)
1. **Rendere risolvibili le istanze M1 nel pre-check** (o saltare il wait quando `level==='M1'`
   e il ruolo è `target`), così i `set` non pagano più 500 ms. Opzioni: aggiungere `objects`
   alle collezioni dei resolver **oppure** un percorso di risoluzione M1 dedicato che usi
   `findInstanceByName`. Da valutare l'impatto su altri comandi.
2. **Zero attesa sui `set`** (gli script generati emettono tutte le create prima dei set),
   coerente con l'idea di design già discussa.
3. **Sospendere/debounce il sync canvas durante lo script con flush finale** — **zona
   critica**: richiede Layer Impact Report e decisione separata. È il candidato per abbattere
   il residuo O(n²) del re-render, ma solo se i numeri confermano che lì sta il costo.
4. **Yield periodico** ogni N comandi per non ingolfare il main thread (secondario rispetto a
   1-3).

Priorità dettata dai numeri: se `iter` cresce con `line`, la leva grossa è (3); se `wait`
domina, la leva grossa è (1)/(2).

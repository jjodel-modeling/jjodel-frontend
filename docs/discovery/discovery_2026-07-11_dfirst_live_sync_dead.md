# Discovery — Le scritture D-first (JjScript/JjTL) non si propagano MAI live al canvas v2-flow

**Data**: 2026-07-11
**Tipo**: Discovery SOLO (Fase 1) — READ-ONLY, nessuna modifica al sorgente
**Branch**: alfonso-frontend-jjtl
**Zona**: critical zone §3.1 (`useJjomSync.ts`) — analisi statica + git archaeology + 2 subagent Explore
**Esito**: hard stop rispettato. Fase 2 su prompt separato.

---

## 0. Nota di metodo (onestà — CLAUDE.md §5.1 / §21.3)

I Passi 2–3 del prompt (instrumentazione `[diagJJS]` + esecuzione live su localhost:3001
digitando comandi nella console JjScript e leggendo i log) **non sono stati eseguiti**:
richiedono un umano che digiti nella console del browser e legga l'output — capacità che
questo agente non ha. L'analisi qui è **statica** (lettura del codice + git blame) più
**due subagent Explore** su (A) il meccanismo di commit/notify dello store e (B) l'esecuzione
JjScript + il listener tree-view. L'**evidenza runtime già raccolta da Alfonso** (le 4
osservazioni sotto) è stata incorporata e NON ripetuta. L'instrumentazione pronta-da-incollare
per il Passo 3 è in §7, così il `git diff` resta pulito (nessuna instrumentation committata).

Dove l'analisi statica non può distinguere due sotto-ipotesi, lo dico esplicitamente e
fornisco l'esperimento discriminante.

---

## 1. Obiettivo

Spiegare perché, con un metamodello (classi A, B) aperto nell'editor v2, i comandi JjScript
D-first non producono **nessun** aggiornamento live del canvas, mentre tutto si materializza
alla riapertura del tab e il tree-view si aggiorna live dopo ogni comando.

---

## 2. Evidenza runtime (da Alfonso — da NON rifare)

1. `B extends A` → D-layer aggiornato (`A.subclasses === [B]`), **nessun** edge di inheritance live.
2. `create class Temp` → **nessun** nodo live. Apparentemente nessun effetto.
3. Chiusura + riapertura tab → canvas COMPLETO: nodo Temp, edge B→A, tutto corretto.
4. Il tree-view si aggiorna live dopo **ogni** comando.

---

## 3. Risposta alla domanda primaria — quale anello è rotto

**Ci sono DUE modalità di fallimento distinte**, con anelli rotti diversi. Non è una singola
causa.

### 3.1 Modalità 1 — `extends` (e `remove extends`): dep-gap, EFFECT MAI RI-ESEGUITO (root cause definitiva, statica)

L'array di dipendenze dell'effect di auto-populate è:

```
useJjomSync.ts:942
[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelRefTypeSig, modelObjectCount]
```

`B extends A` esegue **una sola** `SetFieldAction.new(childElement, 'extends', parentElement.id, '+=', true)`
(`extends.ts:143`). Questo scrive `B.extends`. **Nessuna** delle 7 dipendenze osserva il campo
`extends`:
- `subElementIds.length` — invariato (nessun vertex/edge aggiunto al grafo);
- `modelClassCount` (`:313-324`) — conta `pkg.classes` + `pkg.enumerators`, non `extends`;
- `modelRefCount` (`:328-343`) / `modelRefTypeSig` (`:358-387`) — solo `references`;
- `modelObjectCount` (`:305-309`) — M2, zero oggetti.

Quindi **l'effect non ri-esegue** → la Step 3 inheritance (`:717-736`), unico punto che crea il
`DVoidEdge` con `isExtend`, non gira mai live. L'edge nasce solo al remount (l'effect gira
incondizionatamente al mount).

Conferma incrociata sull'altro effect (incremental sync): anche il change-detector
`elementSnapshots` **non** hash-a `extends`. Le chiavi hash-ate sono
`['attributes','references','operations','literals','features']` (`:965`) + i literal enum;
`extends` è assente. Quindi neppure il ramo "property change" (`:1200-1267`) rileva la modifica.

Questo dep-gap è **documentato esplicitamente** nel codice UI-first:
`canvasToJjom.ts:119-120` — *"The auto-populate effect's dependencies (modelClassCount,
subElementIds.length) do NOT include the extends array, so the effect won't fire between the two."*

> **Anello rotto (Modalità 1)**: `useJjomSync.ts:942` (deps) — nessun termine sensibile a
> `extends`. Airtight, statico. La candidata `modelExtendsSig` (simmetrica a `modelRefTypeSig`)
> è corretta *per l'aggiunta*, ma **insufficiente per la rimozione** — vedi §5.3.

### 3.2 Modalità 2 — `create class`: l'effect RI-ESEGUE, la rottura è A VALLE della creazione del vertex

Questa è la parte contro-intuitiva. Al contrario di `extends`, `create class` **muove** una
dipendenza: `modelClassCount`. Prova a catena:

1. `create class Temp` → `DClass.new(name, ..., father=pkg, persist=true)` (`create.ts:302-311`),
   con `getDefaultParent` che risolve `packages[0]` del metamodello attivo (`utils.ts:263-266`) →
   Temp finisce nel **package radice**, in `pkg.classes`.
2. Il tree-view legge la stessa lista via `buildPackageData(lPkg)` → `lPkg.classes` →
   `LPackage.get_classes` che legge **il raw forward-link** `context.data.classes`
   (`LModelElement.tsx:1896-1902`, riga `1897 if(!context.data.classes.length) return []`).
   Il tree mostra Temp live (osservazione 4) ⟹ **il raw `pkg.classes` È aggiornato**.
3. `modelClassCount` legge lo stesso raw array: `count += (pkg.classes ?? []).length` (`:321`,
   `state.idlookup[pkgId].classes`). Stesso dato del tree ⟹ **`modelClassCount` passa 2→3**.
4. Subagent-store conferma il modello di commit: azioni bufferate e flush-ate da un
   `setInterval(COMMIT, 300ms)` (`redux/reducer/reducer.ts:1445`, `U.UpdatingTimer=300`) via
   `setTimeout(0)` dispatch (`redux/action/action.ts:349`); lo store è un `createStore` redux
   puro (`redux/createStore.ts`) sotto `<Provider store={store}>` (`index.tsx:94`) → **ogni**
   subscriber (tree via `connect`, editor via `useSelector`) è notificato ad ogni commit. Inoltre,
   dentro **un solo** `DClass.new`, `father` (payload della `CreateElementAction`) e
   `pkg.classes += id` (`setExternalPtr` in `_persistCallbacks`) stanno nella **stessa**
   `CompositeAction` → committano insieme (nessun lag inter-campo per una singola classe).

Quindi EditorV2 ri-renderizza e l'effect ri-esegue. Traccia dell'effect (settled store,
grafo esistente, hasGraph=true):

- `:394` `creatingGraphRef.current` = false a riposo → pass.
- `:402` `modelClassCount===3` → pass.
- `:439` visitElement da `rawModel.packages` → classifierEntries = [A, B, Temp].
- `:527` `missingClassifiers` = [Temp] (Temp non ha vertex).
- `:615` nothing-to-do exit: `missingClassifiers.length===1` → **non** scatta.
- `:624` `creatingGraphRef.current = true`.
- `:639-658` Step 2 → **`DVertex.new(0, Temp.id, graphId, graphId, undefined, size)` VIENE ESEGUITO** (`:654`).

**Nessun early-exit blocca la creazione del vertex di Temp.** L'effect ri-esegue e crea il
`DVertex` — deterministicamente.

> **Anello rotto (Modalità 2)**: **A VALLE** di `useJjomSync.ts:654` (`DVertex.new`). Il vertex
> viene creato; ciò che fallisce è la **proiezione live** del nuovo `DVertex` sul canvas. Due
> candidati deterministici sopravvivono all'analisi statica (§3.3); distinguerli richiede il
> discriminante runtime del Passo 3.

Nota: il remount **non** è un discriminante. Sia "effect mai eseguito live" sia "effect eseguito
ma non proiettato" producono canvas-completo-al-remount, perché l'effect al mount gira
incondizionatamente e ricostruisce/ri-proietta contro uno store ormai assestato.

### 3.3 Modalità 2 — i due candidati a valle (deterministici) e i loro discriminanti

Il fallimento riportato è **deterministico** (mai live, sempre al remount). Un fallimento da
pura race sarebbe intermittente. I due candidati deterministici:

**(c1) Vertex creato + proiettato ma FUORI VIEWPORT.** L'incremental sync proietta il nodo, ma
la posizione è una griglia calcolata su `existingCount` (`:647-651`,
`x = 50 + col*COL_W`, con `COL_W=420`) — per la 3ª classe `x≈890`. La creazione *incrementale*
**non** invoca fitView/autoLayout: quel path scatta solo su creazione del grafo via
`justCreatedGraphRef` (`EditorV2.tsx:347-354`). Un nodo live può quindi atterrare fuori dalla
viewport corrente e restare invisibile finché il remount (init + autoLayout con fitView) non
ricompone la vista. → *"Invisibile, non assente."*
  - **Discriminante**: dopo `create class`, fai zoom-out / fitView manuale o ispeziona lo stato
    RF `nodes`. Se Temp compare → è (c1).

**(c2) Vertex creato ma NON proiettato.** L'incremental sync (`:1111`) non renderizza il nuovo
subElement — o perché `graph.subElements` (raw forward-link letto da `graphInfo`, `:287`) non
entra nella finestra one-shot giusta, o per la coreografia rAF/`creatingGraphRef` (§4). Il path
remount lo prende perché l'init effect (`:1064`, `LGraph.fromPointer(graphId).nodes`) fa un
transform completo incondizionato su store assestato.
  - **Discriminante**: dopo `create class` (prima del remount) ispeziona
    `windoww.store.getState()` → il `DGraph` v2-flow ha guadagnato un subElement vertex per Temp?
    - **SÌ** + fitView non lo mostra → (c2): creato ma non proiettato.
    - **NO** → l'effect NON ha creato il vertex live (contraddirebbe la traccia §3.2 →
      ri-verificare `modelClassCount` e `creatingGraphRef` con l'instrumentazione §7).

Ipotesi **leading**: (c1) o (c2), con (c2) più coerente col "sembra nessun effetto". Non
risolvibile senza il Passo 3.

---

## 4. Fattori aggravanti a valle (dal subagent-store, per la Fase 2)

Anche quando l'effect ri-esegue, la proiezione live è fragile per design:

- **Commit asincrono ~300ms coalescente**: `setInterval(COMMIT,300)` (`reducer.ts:1445`) +
  `setTimeout(0)` (`action.ts:349`). JjScript risolve sul microtask **prima** che lo store
  committi (`handleRegistry.ts:9-12`, `create.ts:350`). Cascata multi-tick: create-class-commit →
  effect crea vertex → vertex-commit → incremental sync proietta.
- **One-shot senza retry**: l'effect di auto-populate reagisce a una singola transizione di
  `modelClassCount`; non ha l'hack `Date.now()` che ha invece l'incremental sync (`:1396-1397`,
  auto-descritto "sub-optimal"). Se quella singola occasione è mangiata dal gate, non ritenta.
- **Self-gate 150ms**: `creatingGraphRef.current=true` (`:624`) resettato a `+150ms` (`:940`);
  coalescing rAF (`:245-258`, il cui commento incolpa proprio `action.ts:349`/`reducer.ts:1381`).
- **JjScript detached da React batching**: executor `async`, nessun event handler React attorno,
  nessuna `TRANSACTION`/`batch` nell'executor (`executor.ts`); a differenza di panel-edit/drag che
  girano dentro handler React e (per il drag) si vedono subito lato RF via write-back
  anti-bounced (`isCanvasUpdated`, `:1204`).

Perché **canvas-first funziona** e **D-first no**: il drop/drag crea il nodo RF **direttamente**
sul canvas (ottimistico) e poi scrive in JjOM con `markDropCreated`/`markCanvasUpdated` per
**sopprimere** la duplicazione del sync (`EditorV2.tsx:1411`, `syncState.ts`). Il nodo visibile
non dipende dalla pipeline di sync. La direzione D-first invece dipende interamente dai selector
raw-forward-link + dall'effect one-shot, che non scattano prontamente.

---

## 5. Domande secondarie (solo lettura, per la Fase 2)

### 5.1 Idempotenza delle Step 1–4 su re-fire a grafo popolato — SÌ, sicura

- Step 2 vertici: `missingClassifiers = filter(!vertexIdByModelId.has(e.id))` (`:527`) → crea solo i mancanti.
- Step 3 inheritance: guard `!existingEdgeKeys.has(ek) && !hasCanvasEdgePair(ek)` (`:723`);
  `existingEdgeKeys` costruito da subElements (`:471-499`) + rfEdgeCache (`:505-511`) + scan
  idlookup (`:517-524`).
- Step 3 references: chiave composita `refId:src→tgt` + `classifyRefEdgeReconcile` → `nothing`
  quando coerente (`:873`).
- Step 4 M1: chiave composita `metaId:src→tgt` (`:920`).
- Nothing-to-do exit (`:615-618`) short-circuita quando tutti i contatori missing sono 0.

→ Aggiungere una dep sensibile a `extends` (Fase 2) NON duplica elementi esistenti.

### 5.2 Race col path UI se si aggiunge una dep extends-sensibile — protetta da `markCanvasEdgePair`

Il path UI `syncCreateInheritance` (`canvasToJjom.ts:85-148`) esegue in quest'ordine:
1. `TRANSACTION` set `sourceClass.extends` (`:121-123`);
2. `markCanvasEdgePair(src,tgt)` (`:128`) — **prima** del create;
3. `DVoidEdge.new2(...isExtend)` (`:130-138`);
4. `markCanvasUpdated(edgeId)` (`:141`).

Se la Fase 2 aggiunge `modelExtendsSig`, l'effect potrebbe scattare fra (1) e (3). Ma la guard
Step 3 controlla `hasCanvasEdgePair(ek)` (`:723`), e il mark è già stato messo al passo (2)
(sincrono, prima ancora che il commit extends notifichi ~300ms dopo) → **l'effect salta il
duplicato**. È esattamente lo scenario che il commento `canvasToJjom.ts:125-127` anticipa.
→ Nessuna race, il duplicato è impedito.

### 5.3 `remove extends` D-first — PEGGIO di add: nessun reconcile cancella l'edge → EDGE ZOMBIE

`remove extends from B` → `SetFieldAction.new(classElement, 'extends', [], '=', false)`
(`remove.ts:191`; special-case `__extends__` a `:44`). Svuota `B.extends`.

- Nessuna dep osserva `extends` → effect non scatta live (come Modalità 1).
- **Critico**: anche se scattasse, la Step 3 **solo crea** inheritance edge (`:717-736`); **non
  esiste** alcun ramo che **cancella** un `DVoidEdge` isExtend il cui `extends` di supporto è
  stato rimosso. Il pool di reconcile (`existingRefEdgesByRefId`) **esclude** gli inheritance
  edge (`:455`, `:481-482`, via `isM2ReferenceEdge`).
- Al remount, l'init effect trasforma `lGraph.edges` (`:1075`) che **include ancora** il
  `DVoidEdge` isExtend orfano (nessuno l'ha cancellato) → `jjomEdgeToRFEdge` lo rende inheritance
  (`jjomTransformers.ts:438,541`) → **edge zombie B→A** che sopravvive sia live sia al remount.

→ Il fix Fase 2 per `extends` deve gestire **anche la rimozione** (delete dell'edge orfano),
simmetrico al ramo delete del reference-reconcile (`:779-784`, `:866-869`). Una semplice
`modelExtendsSig` che fa solo *creare* i mancanti sistema l'add ma **non** il remove.

### 5.4 Il commento `canvasToJjom.ts:117-121` — da aggiornare in Fase 2

Il commento afferma *"the effect won't fire between the two"* basandosi sul dep-gap. Con
`modelExtendsSig` la premessa diventa **falsa**: l'effect *può* scattare fra la TRANSACTION
extends e il `DVoidEdge.new2`. Il commento va riscritto: la sicurezza si sposta da "l'effect non
scatta" a "l'effect può scattare ma `hasCanvasEdgePair` (`:128`, messo prima) blocca il
duplicato".

---

## 6. Bozza Layer Impact Report (per il fix Fase 2)

Il fix Fase 2 toccherà la critical zone (`useJjomSync.ts`) → LIR obbligatorio. Bozza:

```
LAYER IMPACT REPORT (bozza — fix Modalità 1: extends add+remove live)

Layers touched:
  [x] D-layer (Redux raw data)   → legge extends; il ramo REMOVE scrive DeleteElementAction su edge orfani
  [x] Sync layer (useJjomSync)   → nuovo selettore modelExtendsSig + dep in :942 + ramo Step 3 delete inheritance
  [x] Canvas v2-flow             → edge inheritance aggiunti/rimossi live
  [ ] L-layer                    → solo read (LPointerTargetable.fromPointer)
  [ ] JjOM                       → read-only
  [ ] Canvas classic             → invariato
  [ ] Persistence (VersionFixer/jsxString) → NESSUNA (no default-view, no jsxString)

Per layer:
  - modelExtendsSig: hash di (childClassId → extends[] ordinati), traversal identico a
    modelRefTypeSig (:358-387); idempotente (stesso set → stesso numero).
  - Step 3 delete: per ogni classe, se un DVoidEdge isExtend persistito punta a un target NON
    più in extends → DeleteElementAction dentro TRANSACTION (idioma :779-784), + rimozione RF
    edge da cache/canvas (idioma :791-793). §3.3 OK: il corpo non contiene .new() creatori.
  - Cross-layer: markCanvasEdgePair protegge il path UI (§5.2); commento :117-121 da aggiornare.

Smoke-test:
  - B extends A (D-first) → edge B→A live, 1 solo edge (no duplicato), sopravvive al remount.
  - remove extends from B (D-first) → edge B→A sparisce live E al remount (no zombie).
  - Crea inheritance via UI drag (path canvas-first) → nessun duplicato (hasCanvasEdgePair).
  - Families.ecore import → invariato (nessun extends spurio).

Modalità 2 (create class) NON è coperta da questo LIR — è un problema di proiezione a valle
(§3.3), da risolvere separatamente DOPO il discriminante runtime.
```

---

## 7. Instrumentazione pronta (Passo 3 — NON applicata, per `git diff` pulito)

Da incollare temporaneamente in `useJjomSync.ts` per eseguire il discriminante (rimuovere a fine
sessione; nessun commit — CLAUDE.md §2):

- **Ingresso effect + snapshot deps** (dopo `:393 useEffect(() => {`):
  `console.log('[diagJJS] effect enter', {modelid, hasGraph, subLen: subElementIds.length, classCount: modelClassCount, refCount: modelRefCount, refSig: modelRefTypeSig, objCount: modelObjectCount, creating: creatingGraphRef.current});`
- **Ogni early-exit**: `:394` (`return creatingGraphRef`), `:402` (`return classCount0`), `:443`
  (`return no-classifiers`), `:615` (`return nothing-to-do`) — un log con etichetta dell'exit.
- **Step 2/3**: prima di `:654 DVertex.new` → `console.log('[diagJJS] DVertex.new', entry.id)`;
  prima di `:724`/`:814`/`:922 DVoidEdge.new2` → log con gli id.
- **Render effects**: ingresso `:1034` init e `:1111` incremental →
  `console.log('[diagJJS] render effect', {snapLen: elementSnapshots?.size, subLen: subElementIds.length});`
- **executeCreate** (`create.ts`, dopo `:311`): `console.log('[diagJJS] created class', newClass.id, 'father', parentId);`

Scenario: metamodello A/B aperto, `create class Temp2` → leggere la sequenza (selector muove?
effect entra? quale exit? Step 2 crea vertex? render effect gira?), poi
`windoww.store.getState()` per verificare il subElement del vertex (discriminante §3.3), poi
fitView manuale (discriminante c1/c2). Ripetere con `Temp2 extends A` (atteso: effect NON entra).

---

## 8. Esito git archaeology — NON è una regressione recente

- Deps effect (`:942`): commit `1702aca3d5` (2026-05-29, aggiunta `modelRefTypeSig`). Stabile da
  fine maggio.
- Selector `modelClassCount` (`:313-324`): `45a83df9a5` (2026-03-10) — commento *"triggers
  repopulation when model data arrives in store after script execution"*.
- Incremental sync deps con `Date.now()` (`:1396`): `6d205bc9f` (2026-05-21, Damiano).
- I commit June/July su editor-v2 (layout, handle registry, waiter M1, cross-MM ref, retarget
  type, setZoom, label) **non toccano** deps/selectors/pipeline di proiezione D-first.

**Conclusione**: il dep-gap `extends` (Modalità 1) e la fragilità one-shot della proiezione D-first
(Modalità 2) sono **strutturali e di lunga data**, non una rottura recente. Il commento del
selector prova che lo scenario script→canvas live era *progettato*; l'analisi del subagent-store
(commit ~300ms coalescente + one-shot senza retry + JjScript detached) indica che era
**intermittente/inaffidabile fin dall'inizio**, non funzionante-poi-rotto. La premessa del prompt
("presumibilmente funzionante") va corretta in "progettato ma mai affidabile live".

---

## 9. Domande aperte per Alfonso (chat di progetto)

1. **Discriminante Modalità 2 (serve il tuo browser)**: dopo `create class Temp`, in devtools
   `windoww.store.getState()` → il `DGraph` v2-flow ha un subElement vertex per Temp? E un
   fitView/zoom-out manuale lo rivela? Questo separa (c1 fuori-viewport) / (c2 non-proiettato) /
   (effect-non-scattato). Senza questo, la Fase 2 su create-class è cieca.
2. **Direzione del fix Modalità 1**: `modelExtendsSig` + ramo Step 3 delete (add+remove
   simmetrici) resta dentro l'architettura selector-driven. In alternativa un hook dedicato
   `useM1ReferenceEdges`-style per l'inheritance. Quale preferisci?
3. **`JjScriptEvents.EXECUTED` come nudge canvas**: il prompt vieta di aggiungere un listener
   canvas senza discussione. Il subagent-tree ha confermato che quel listener nel tree-view è
   **solo cosmetico** (glow 1.2s, `TreeViewPanelContext.tsx:241-243`), NON un refresh dati — il
   tree vive di Redux `connect` come il canvas. Quindi aggiungere il listener al canvas darebbe
   solo un pulse, non i dati. Se vogliamo un nudge esplicito post-script servirebbe un
   force-resync mirato, non il semplice riuso dell'evento. Da decidere in Fase 2.
4. **Zombie `remove extends`**: confermi che il fix deve includere la cancellazione dell'edge
   orfano (§5.3), o `remove extends` è fuori scope Fase 2?

---

## 10. HARD STOP

Fase 1 completa. Nessun sorgente modificato, nessuna instrumentation committata, `git diff` sui
file sorgente pulito. La Fase 2 sarà autorizzata con prompt separato dopo l'analisi di questo
report in chat.

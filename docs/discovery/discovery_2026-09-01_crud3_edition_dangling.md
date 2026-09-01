# CRUD3 F1 — Edition_0 esiste per l'albero e non per il validatore

Discovery. Zero file di prodotto toccati. Le misure vengono da due sonde
`_tmp_` non committate (`.gitignore:66`):

- `frontend/scripts/smoke/_tmp_crud3_recon.ts` — **12 PASS / 0 FAIL**, il gesto
  UI vero («Add Edition» dalla barra children del manager) e la struttura che
  produce;
- `frontend/scripts/smoke/_tmp_crud3_red.ts` — **10 PASS / 0 FAIL**, la
  riproduzione del ROSSO sul canvas, la linea del tempo di Q4 e i due form di Q5.

Zero `pageerror` in entrambe.

---

## 0. La causa, in una riga

`joiner/classes.ts:774-784`. Il costruttore di `DObject` appende il nuovo
oggetto a **una sola** collezione, e sceglie in base al tipo del padre:

```ts
DObject(instanceoff?: DObject["instanceof"]): this {
    let thiss: DObject = this.thiss as any;
    if (thiss.father) {
        if (this.fatherType!.cname === "DModel") {
            this.setExternalPtr(thiss.father, "objects", "+=");     // :778
        }
        else {
            // object containing object is not in any direct child collection. access through values
            this.setExternalPtr(thiss.father, "values", "+=");      // :782
        }
    }
```

Il padre di un create contenuto e' lo **slot**, non il modello —
`LModelElement.tsx:7171`:

```ts
father = isContainment ? c.data.id : this.get_model(c).id;
```

Quindi un'istanza nested **non entra mai** in `DModel.objects`. E il perimetro
del validatore e' esattamente quella collezione — `ConformanceValidator.ts:27`,
`:40-43`:

```ts
const objects: LObject[] = model.objects || [];        // :27
...
const objectIds = new Set<string>();                   // :40
for (const obj of objects) {
    if (obj?.id) { objectIds.add(obj.id); objectById.set(obj.id, obj); }   // :43
}
```

e CHECK 6 chiede l'appartenenza a quel Set — `ConformanceValidator.ts:488-499`:

```ts
for (const refId of referencedIds) {
    if (!objectIds.has(refId)) {
        violations.push({ ..., violationType: 'dangling_reference', severity: 'error',
            message: `Object "${objName || objId}": reference "${ref.name}" points to non-existent object "${refId}"` });
    }
}
```

`LModel.objects` e' la collezione D grezza, senza discesa —
`LModelElement.tsx:5662-5666`:

```ts
protected get_objects(context: Context, includeCrossReferences: boolean = false): this['objects'] {
    let ret: LObject[] = context.data.objects.map((pointer) => LPointerTargetable.from(pointer));
    ...
}
```

**Ogni istanza contenuta e' dangling per CHECK 6, per costruzione.** Non e' una
race, non dipende dai due modelli omonimi, non dipende dal gesto.

Il messaggio misurato dalla sonda e' parola per parola quello dello screenshot:

```
Object "Book_1": reference "editions" points to non-existent object "Pointer1788295711594_USER_4803"
```

---

## 1. Q1 — chi risolve e chi no

Fixture: `Book.editions : Edition[0..*]` COMPOSITION, `Book.sequel : Book[0..1]`
reference pura (il per contrasto). `Book_1` e `Book_2` root, `Edition_0` creata
dalla barra children su `Book_1`.

| Lettore | Path di lookup | riga:colonna | Vede `Edition_0`? |
|---|---|---|---|
| **Albero (TreeView)** | primo livello da `m1.objects`, poi discesa per **slot** con `LObject.subObjects` | `TreeViewContent.tsx:2523` (`m1.objects`), `buildInstanceForest` `:2322-2331` (`obj.subObjects`); commento della causa gia' scritto a `:2308-2312` | **SI'** |
| **Chip sul canvas** | valori grezzi dello slot risolti dal **proxy L**, che risolve sul lookup **globale**; un puntatore non risolto diventa `broken: true` | `jjomTransformers.ts:363-393` (`fv.__raw?.values` + `fv.values`), decisione `ObjectNode.tsx:626-633`, resa `valueRenderer.ts:634-637` | **SI'**, risolto (nessun `brokenRef`) |
| **Form nested (`IRForm`)** | `objectId` nudo, risolto sul lookup globale; le diagnostiche arrivano dal registro per `objectId` | `InstanceManagerTab.tsx:2864` e `:2898` (`<IRForm objectId={childId} />`), `useNodeProblems.ts:10` | **SI'** come soggetto; **nessun problema** a suo nome |
| **Validatore (conformance)** | **perimetro modello**: `model.objects`, senza discesa | `ConformanceValidator.ts:27`, `:40-43`, CHECK 6 `:488-499` | **NO** |
| **Mount dei nodi sul canvas** | itera `rawModel.objects` dal lookup grezzo | `useJjomSync.ts:636`, `:666`, `:759`, `:1032`; stessa sorgente in `useM1ReferenceEdges.ts:69`, `:131`, `m1EdgeSweep.ts:81`, `IRNodeContent.tsx:293` | **NO** — nessun `DVertex` |

Misurato (`_tmp_crud3_recon.ts` arm F):

```
{"validatorPerimeter":["Book_1","Book_2"],"validatorSeesEdition":false,
 "treeSeesEdition":true,"globalLookupHasEdition":true,
 "hasVertex":false,"vertexOfBook1":true}
```

`vertexOfBook1: true` e' il controllo positivo del quarto rigo: la sonda sa
distinguere «nessun vertice» da «non ho guardato».

La spaccatura e' netta e ha un nome: **due lettori usano il perimetro del
modello (`DModel.objects`), tre usano il grafo (lookup globale o discesa per
slot)**. `irContainment.ts:79-83` la dichiara gia', in prosa, sull'altro lato:

> «The walk therefore also reaches the nested form (`father = DValue`), whose
> objects are absent from DModel.objects and have no DVertex».

---

## 2. Q2 — dove sta l'oggetto

Sonda `_tmp_crud3_recon.ts`, arm C-D. Fixture con **due modelli M1 omonimi**,
entrambi `model_1` (voluti — Alfonso, 2026-09-01), stessa M2. Gesto: pick(Book)
nella rail, riga `Book_1` nella tabella, **«Add Edition» dalla barra children**,
nome `Edition_0` nel modale, commit.

```
{"edId":"Pointer1788294939129_USER_42",
 "edName":"Edition_0",
 "instanceofName":"Edition",
 "fatherKind":"DValue",
 "fatherId":"Pointer1788294912542_USER_30",
 "fatherOwner":"Book_1",
 "listedBy":["Book_1.editions"],
 "inObjects":       {"A":false,"B":false},
 "inAllSubObjects": {"A":true, "B":false}}
```

Riga per riga:

- **`father`** e' il `DValue` dello slot `editions` di `Book_1`, non un modello.
- **`instanceof`** e' `Edition`, la metaclasse giusta.
- **`objects`**: **nessuno** dei due modelli lo elenca. Non «quello sbagliato»:
  nessuno.
- **`allSubObjects`**: **A si', B no.** Il modello e' determinato correttamente,
  perche' `_getallSub` (`LModelElement.tsx:5796-5824`) filtra su `l.model.id`,
  che risale la catena `father`. Il modello attivo al momento del gesto era A, e
  l'oggetto e' finito in A.

**Controlli positivi nello stesso giro**: `A1` (i due `model_1` sono omonimi e
distinti), `B1` (`Book_1` e `Book_2` **sono** in `DModel.objects` di A — quindi
la sonda sa leggere quella collezione), `C0` (il soggetto selezionato e'
`Book_1`), `C1` (la barra offre «Add Edition»).

**I due omonimi non c'entrano.** Il difetto si riproduce identico con **un solo
modello** (`_tmp_crud3_red.ts`, che ne ha uno solo: `R1a` PASS).

---

## 3. Q3 — come `createInstance` sceglie il modello

Il path, misurato leggendo il codice e confermato dal gesto:

```
InstanceManagerTab.tsx:2970  <button class="instance-manager__add">  ->  openCreate(child.of, subjectId, child.key)
InstanceManagerTab.tsx:2045  applyCreate(modelid, shapeCtx.shape(), draft)
createAdapter.ts:484         createInstance(modelId, cls.key, draft.ownerId, draft.childKey, seed)
createAdapter.ts:411-420     const slot = lOwner['$' + childKey] ?? lOwner.features.find(f => f.name === childKey)
                             created = slot.addObject(json, classId, true)
LModelElement.tsx:7156-7171  get_addObject: father = isContainment ? c.data.id : this.get_model(c).id
LModelElement.tsx:7277       DObject.new3(constructorPointers, ..., isDModel ? DModel : DValue, true)
joiner/classes.ts:774-784    father DModel -> objects += ;  altrimenti -> values +=
```

**Il modello e' scelto per PUNTATORE, mai per nome.** `modelid` e' la prop del
tab (`InstanceManagerTab.tsx:158`, `:1307`, usato a `:2045`), un pointer che arriva dal
`DockManager`. Nessun `find(m => m.name === ...)` in tutto il path.

L'unica risoluzione **per nome** e' quella della **metaclasse**, e resta dentro
il modello gia' scelto — `createAdapter.ts:131-133`:

```ts
export function classIdOf(modelId: string, className: string): string | null {
    return classesByName(modelId)[className]?.id ?? null;
}
```

Con due M1 omonimi il primo match sarebbe stato un coin flip: **non lo e'**,
perche' nessuno cerca per nome. `inAllSubObjects {A:true, B:false}` (§2) e' la
misura che lo chiude: l'oggetto e' nel modello del gesto, non in un omonimo.

Nota collaterale, non un difetto ma una trappola: `IRForm.tsx:241` costruisce il
suo `WriteCtx` con `makeWriteCtx()` **senza modelId**, quindi la `create` da
dentro la form rifiuta con `'this write context has no model to create in'`
(`writeCtxLproxy.ts:152-155`). Il create passa solo dalla barra del manager, che
il `modelid` ce l'ha. E' coerente col commento a `InstanceManagerTab.tsx:2916-2931`
(«A BAR BESIDE THE FORM, not an Add inside the form's own»).

---

## 4. Q4 — la race di deferral: **ipotesi scartata**

`_tmp_crud3_red.ts`, arm R3. Badge di errore sul canvas (`.node-problem-dot`),
letto a t=0 e a ogni finestra di debounce da 500 ms:

| t | badge di errore | nodi montati |
|---|---|---|
| 0 ms | **1** (`node-problem-dot--error` su `Book_1`) | 2 |
| +500 | 1 | 2 |
| +1000 | 1 | 2 |
| +1500 | 1 | 2 |
| +3500 | 1 | 2 |

E dopo la **ricarica** del progetto (arm R3b):

```
{"editionAlive":true,"book1Alive":true,"inObjectsA":false,"fatherKind":"DValue"}
badge: node-problem-dot--error --counted   (2 dangling, il conteggio segue)
```

Il rosso e' presente al primo campione, non guarisce in nessuna finestra, e
sopravvive alla ricarica con la stessa struttura. **Non e' un transitorio.**

Il perche' e' anche strutturale, non solo osservato: la firma di
`useConformance` (`useConformance.ts:47-77`) copre **ogni** `DObject` e **ogni**
`DValue` del lookup, quindi il create nested fa ri-partire il validatore
subito — che ricalcola, e ritrova lo stesso stato.

**Controlli nello stesso giro**: `R5` (nessun badge PRIMA del create nested — lo
strumento sa dire zero) e `R2`, il per contrasto vero:

> `Book_1.sequel = Book_2`, una reference **pura** verso una **root**:
> **zero badge**. Stesso CHECK 6, stessa macchina, bersaglio dentro
> `DModel.objects`. Verde.

Il confronto R2/R1 isola la variabile a una sola: **dove sta il bersaglio**, non
che tipo di reference sia.

---

## 5. Q5 — perche' il form nested dice «No issues»

**L'indice e' lo stesso. Non c'e' un secondo difetto.**

Registro unico (`problems/registry.ts`), riempito da `ConformanceProblemSync`
(`EditorV2.tsx:4224`), che registra **per `objectId`** e, in piu', per l'id del
`DVertex` quando c'e' — `ConformanceProblemSync.tsx:94-97`:

```ts
register(agg.objectId, agg);
const vertexId = resolveVertex(agg.objectId);
if (vertexId && vertexId !== agg.objectId) register(vertexId, agg);
```

L'aggregazione e' per `v.objectId` (`conformanceToProblems.ts:41-47`), e CHECK 6
scrive `objectId: objId` — **il REFERRER**, cioe' `Book_1`, non il bersaglio.
`IRForm` legge `useNodeProblems(objectId)` per il proprio soggetto e distribuisce
per nome della feature (`formDiagnostics.ts:61-90`).

Quindi le due schermate dicono cose diverse su **oggetti diversi**, ed e'
corretto. Misurato con i due form montati insieme nel manager
(`_tmp_crud3_red.ts` R4):

```
[{"name":"Book_1",  "summary":"2 errors",
  "msgs":["editions 0..* E Edition_0 E Edition_1 Object \"Book_1\": reference \"editions\" points to non-existent object \"Pointer…_4803\""]},
 {"name":"Edition_0","summary":"1 warning","msgs":[]},
 {"name":"Edition_1","summary":"1 warning","msgs":[]}]
```

Da leggere insieme: la riga `editions` di `Book_1` mostra **il chip risolto
`Edition_0` E il messaggio «points to non-existent object» sulla stessa riga**.
E' il fatto dello screenshot, ridotto a una riga sola: il chip risolve sul
lookup globale, il messaggio nasce dal perimetro del modello.

`R6b` chiude la coda: creata una seconda `Edition`, il verdetto di `Book_1`
passa da «1 error» a «2 errors» — l'indice si aggiorna, non e' congelato.

**Correzione a una mia lettura intermedia.** In un giro avevo misurato
`.dock-tabpane-active .editor-v2` assente sul viewpoint Data Manager e stavo per
registrare un secondo difetto («il manager non ricalcola»). E' falso: il
selettore era ristretto al pannello attivo. Globalmente `.editor-v2` c'e'
(`editorAnywhere: 1`) in un pannello dock inattivo, `ConformanceProblemSync`
gira, e `R6b` lo dimostra sul comportamento. Registrato qui perche' l'errore era
di misura, non di prodotto.

---

## 6. Osservazione residua, non spiegata

Dopo il secondo create, `Edition_0` e `Edition_1` portano **«1 warning»**
ciascuna, e il messaggio **non atterra su nessun campo** (`msgs: []`): finisce
nel *residue* di `formDiagnostics.ts:36`, che e' la casella delle violazioni di
livello classe. Non puo' venire da CHECK 6, perche' il validatore quegli oggetti
non li visita affatto (§1). Il produttore piu' probabile e' `UniquenessProblemSync`,
che ha registro proprio — ma **non l'ho misurato**, e non lo scrivo come causa.

E' fuori dal perimetro delle cinque domande. Va misurato prima di toccarlo.

---

## 7. Candidati, col costo. Nessuno raccomandato qui

Il prompt chiede la causa e i candidati, non un fix. Elencati con il costo
misurato o con la ragione per cui il costo non e' misurabile da qui.

**C1 — allargare il perimetro del validatore ad `allSubObjects`.**
Una riga: `ConformanceValidator.ts:27`, `model.objects` -> `model.allSubObjects`.
Costo: `_getallSub` (`LModelElement.tsx:5796-5824`) fa una **scansione completa
del lookup** per ogni chiamata, e il validatore gira su ogni firma cambiata
(debounce 500 ms). Su un modello grande e' O(lookup) per validazione invece di
O(roots). Non misurato: la fixture qui ha 2 root. Va misurato prima.
Secondo effetto, e forse il piu' importante: il validatore comincerebbe a
**visitare** gli oggetti nested, che oggi non visita — quindi comparirebbero
violazioni nuove su oggetti che oggi non ne producono nessuna. E' un cambio di
copertura, non solo di perimetro.

**C2 — perimetro solo per CHECK 6.** Lasciare il ciclo su `objects` e costruire
`objectIds` da una discesa per slot (la stessa che fa `walkContainment` in
`irContainment.ts:210-240`, gia' scritta e gia' testata). Piu' stretto di C1: non
allarga la copertura, chiude solo il falso positivo. Costo: una discesa per
validazione, limitata alle composition, piu' l'accoppiamento del validatore a un
modulo di `editor-v2/`.

**C3 — mettere l'oggetto nested anche in `DModel.objects`.** Tocca
`joiner/classes.ts:774-784`, cioe' il costruttore D. **Fuori dalla corsia veloce
e dentro la critical zone**: `DModel.objects` e' la sorgente da cui
`useJjomSync` monta i vertici (`:636`, `:1032`), quindi ogni istanza contenuta
prenderebbe un `DVertex` sul canvas. Cambia il prodotto visibile, non solo il
verdetto. Costo: un Layer Impact Report pieno, e non e' un candidato «piccolo»
travestito da tale.

**C4 — non fare niente sul validatore, e dichiarare il vincolo.** CHECK 6 e'
scritto per il modello piatto; il containment nested e' arrivato dopo. Registrare
che il perimetro e' `objects` e che la violazione su un target contenuto e' un
falso positivo noto. Costo zero, debito esplicito.

---

## 8. La domanda residua per Alfonso

Una sola, e decide fra C1 e C2:

> **Il validatore deve VISITARE gli oggetti nested, o solo VEDERLI come
> bersagli legittimi di una reference?**

Sono due cose diverse e oggi non ne fa nessuna. «Vederli» chiude questo bug e
niente altro (C2). «Visitarli» e' la posizione corretta a rigore — un'istanza
contenuta e' un'istanza del modello, e oggi nessuno controlla la sua
conformita' — ma fa comparire in un colpo solo tutte le violazioni degli oggetti
nested esistenti, su progetti gia' salvati. Il secondo e' un cambio di
copertura da pianificare, non un fix da infilare in questo giro.

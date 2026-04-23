# Attribute Co-Evolution (M2 → M1) — Analisi Fase 1

**Data:** 2026-04-23
**Scope:** Editor v2 (React Flow + JjOM)
**Fase:** 1 — diagnosi, zero modifiche al codice
**Esito:** Mescolato. L'infrastruttura **esiste come stub non implementato**. L'auto-creazione di DValue su add attributo funziona già al livello del framework. La parte di soft-delete + rehydrate per remove non è mai stata in stato funzionante.

---

## TL;DR

| Scenario | Stato attuale | Gap |
|----------|--------------|-----|
| **Add** attributo: slot su istanze esistenti | ✅ Funziona (framework joiner) | Nessun rehydrate da OrphanStore |
| **Add** attributo: slot su istanze nuove | ✅ Funziona (lazy placeholder ObjectNode) | — |
| **Remove** attributo: cleanup DValue | ⚠️ **Rotto** (zombie DValue in idlookup) | DValue con `instanceof` dangling, non cancellati |
| **Remove** attributo: soft-delete + restore | ❌ Non implementato | OrphanStore è stub disabilitato |
| Rename attributo | ✅ Funziona trasparente | Identità DAttribute preservata → DValue validi |

**Tipo di intervento:** Implementazione da zero per remove. Add richiede solo uno strato sottile di rehydrate sui DValue già auto-creati dal framework.

---

## 1.1 Git archaeology

### `useOrphanFeatures.ts`

- **Commit di introduzione:** `45a83df9a57da34e9182ba07c4e0400288e334f5`
- **Data:** 2026-03-10 14:01:17 +0100
- **Autore:** Alfonso Pierantonio
- **Messaggio:** "Fix JjEL Console implicit context: allow unqualified property access on selected node" (messaggio fuorviante — è un commit squashed/misc che ha introdotto anche questo file stub)
- **Contenuto all'introduzione:** 69 righe, **identico al contenuto attuale** — già disabilitato:
  ```ts
  // DIAGNOSTIC: OrphanStore temporarily disabled to isolate undo/attr_0 bug
  export function useOrphanFeatures(_modelid, _nodes): void {
    return; // no-op
  }
  ```
- **Elementi scaffolded ma inutilizzati nel file stub:** `OrphanFeature` type, `OrphanStore` type alias, funzione `useClassAttrSig()` definita ma mai chiamata.

### Ricerca su altri hook plausibili

Nessuno di `useAttributeRemoval.ts`, `useAttributeAddition.ts`, `useAttributeCoEvolution.ts` è mai esistito:

```bash
git log --all --oneline -S "useAttributeRemoval" ...    # → vuoto
```

### Conclusione

**Non c'è implementazione precedente funzionante in git history da cui fare restore.** Il file è nato già come no-op stub. Il commento suggerisce che l'autore aveva un'implementazione in mano che ha temporaneamente disabilitato durante un debug di un bug su undo + "attr_0", ma quel codice **non è mai stato committato**. L'intervento è quindi **implementazione da zero** — non regressione.

Il fatto che il file sia wirato (`EditorV2.tsx:338`) conferma la pianificazione, non l'esistenza di una versione funzionante.

---

## 1.2 Mappa dei punti di intervento

### Entry points — Aggiunta attributo al metamodello

| # | File | Trigger | Azione |
|---|------|---------|--------|
| 1 | `components/editor-v2/panels/PropertiesPanel.tsx:487-491` | Click "+" nel panel | `syncAddAttribute(node.id)` |
| 2 | `components/editor-v2/nodes/ClassNode.tsx:192` | Shortcut dentro ClassNode | `syncAddAttribute(id)` |
| 3 | `components/contextMenu/ContextMenu.tsx:315` | Menu contestuale "Add Attribute" | `lClass.addAttribute(suggestedName)` diretto |

Tutti confluiscono in `LClass.addAttribute(name?, type?)` — il quale crea un `DAttribute` via `DAttribute.new3()` + `CreateElementAction`.

**Propagazione automatica alle istanze — framework joiner**
`frontend/src/joiner/classes.ts:703-743` (metodo init `DStructuralFeature()`, eseguito in catena di costruzione di DAttribute):

```ts
// "When a feature is added in m2, i loop instanced m1 objects to add that feature as a DValue."
for (let pointer in alreadyParsed /* la classe + tutte le sottoclassi */) {
    for (let instanceObjPtr of alreadyParsed[pointer].instances) {
        thiss._derivedSubElements.push(
            _DValue.new3({
                name: undefined,
                instanceof: thiss.id,
                father: instanceObjPtr,
            }, undefined, false)
        );
    }
}
```

Risultato: ogni istanza M1 della classe (e delle sue sottoclassi) riceve automaticamente un nuovo `DValue` con `instanceof = newAttrId, values = []`. **Il gap di rehydrate è solo sul valore iniziale** — i DValue sono creati ma vuoti.

### Entry points — Rimozione attributo dal metamodello

| # | File | Trigger | Azione |
|---|------|---------|--------|
| 1 | `components/editor-v2/panels/PropertiesPanel.tsx:506-510` | Bottone "x" | `syncRemoveAttribute(attrId, node.id)` |
| 2 | `components/editor-v2/EditorV2.tsx:2046-2067` | Context menu "Delete Attribute" | `syncRemoveAttribute(...)` + aggiornamento RF nodes |

`syncRemoveAttribute` in `sync/canvasToJjom.ts:471-482`:
```ts
TRANSACTION('EditorV2 remove attribute', () => {
    DeleteElementAction.new(lAttr.__raw ?? lAttr);
});
```

**⚠️ Nota critica:** usa `DeleteElementAction.new()` **diretto**, NON `lAttr.delete()`. Questo bypassa `Dummy.get_delete` (`common/Dummy.ts:50-242`), che è il punto in cui avviene il cascade corretto.

**Cascade che NON viene eseguito** (perché `DeleteElementAction` diretto salta la logica L-proxy):

`Dummy.ts:199-201`:
```ts
case 'instanceof': // all elements being instance of a removed element are also removed
    lObj.delete();
    break;
```

Se `syncRemoveAttribute` usasse `lAttr.delete()`, tutti i DValue con `instanceof = attrId` verrebbero cascade-eliminati via ricorsione.

**Risultato attuale di `DeleteElementAction.new()` diretto:**
- `state.idlookup[attrId]` → rimosso
- Il reducer (`PointedBy.remove`) aggiorna gli indici inversi ma **non scrive sul campo `instanceof` delle DValue**
- `state.idlookup[dValueId].instanceof` → resta uguale a `attrId` (puntatore dangling)
- Visivamente: `ObjectNode.tsx:50-63` chiama `lookup[attrId]` in `liveFeatureNameSig` → undefined → la feature viene filtrata dal rendering (nascosta silenziosamente)
- I DValue restano zombie in Redux: invisibili ma presenti. Non vengono ripuliti da alcun path.

### Hook pattern — riferimento `useClassRemoval.ts`

`useClassRemoval` è un hook **imperativo**, non un listener:
- Ritorna `{ handleClassRemoval }` — una callback
- Viene invocata da EditorV2 in risposta a un evento utente specifico (tasto Delete o context menu)
- Snapshot per undo prima dell'azione (`takeSnapshot()`)
- Side effects esplicitamente descritti: collapse gerarchia, remove edge, orphan instance via `SetFieldAction`, remove nodo RF, sync JjOM
- Tutto dentro `TRANSACTION(...)` per atomicità

**Non è un selector-driven hook.** Non osserva lo store per diff-based detection.

### Pattern giusto per attribute co-evolution

Per gli attributi, gli ingressi sono **molteplici e di natura diversa** (UI button, context menu, import T2M, azioni AI via `JjodieActionExecutor`, `suggestOnClass`). Wrappare ogni path singolarmente come `useClassRemoval` lascerebbe buchi.

Il pattern corretto è **selector-driven**: osservare le firme degli `class.attributes` in Redux, calcolare diff (added vs removed), applicare la logica di co-evolution su qualsiasi cambiamento rilevato. Questo è esattamente lo scheletro che `useOrphanFeatures` stub ha iniziato con `useClassAttrSig` — una serialized signature di tutti gli attributi per classi con istanze.

### Istanza creation — letture live?

ObjectNode legge Redux live tramite 3 selector:

| Selector | File:riga | Cosa legge |
|----------|-----------|-----------|
| `liveMetaclassInfo` | `ObjectNode.tsx:36-43` | Nome + singleton della metaclasse |
| `liveFeatureNameSig` | `ObjectNode.tsx:50-63` | Feature esistenti → DAttribute.name live |
| `metaclassAttrSig` | `ObjectNode.tsx:86-116` | TUTTI gli attributi della metaclasse, tipo, enum literals |

Poi `missingAttributes` memo (`ObjectNode.tsx:118-146`) calcola gli attributi **senza DValue** ancora valorizzato → mostra placeholder con default value inline.

**Nessuna cache da invalidare.** Istanze nuove e pre-esistenti ricevono lo stato del metamodello via selector Redux. Il framework auto-crea i DValue, ObjectNode auto-rende i placeholder. **Nulla da fare in Fase 2 su questo fronte.**

`jjomTransformers.ts:211-273` è il punto dove, durante un full transform, i feature vengono riletti da `lObject.features` (DValue). Anche questo è già live perché legge da proxy L (che punta a Redux idlookup).

### Slot representation — come è fatto un "slot" d'istanza

`frontend/src/components/editor-v2/types.ts:145-154`:
```ts
export interface FeatureValueRow {
    id: string;                       // DValue id
    featureName: string;              // DAttribute.name (snapshot)
    featureKind: 'attribute' | 'reference';
    featureTypeId?: string;           // DClassifier id (per enum co-evolution)
    typeName?: string;                // DClassifier name (per enum header)
    value: string;                    // valore display
    enumLiterals?: Array<{ name: string; value: number }>;
}
```

Questa è la projection view-layer. Nel data-layer la struttura è:

- `DObject.features: Pointer<DValue>[]` — array di riferimenti
- `DValue`:
  - `instanceof: Pointer<DAttribute | DReference>` — pointer al feature del metamodello
  - `values: any[]` — array di valori (anche per upperBound=1 è sempre un array)
  - `father: Pointer<DObject>`
  - `name?` — tipicamente undefined; il name è derivato da `instanceof.name`

**Aggiungere uno slot** = creare una `DValue.new3({instanceof: attrId, father: objectId})`. **Rimuovere uno slot** = `DeleteElementAction.new(dValueId)` o `lValue.delete()`.

### OrphanStore — schema attuale

**Non esiste uno schema salvato.** Il tipo `OrphanStore` nello stub (riga 28) è `Map<string, OrphanFeature[]>` con chiave `attributeName` e value `{vertexId, value}[]`. **Incompleto:**

- Non include `className` → collisioni tra classi con stessi nome attributo
- Non include `attrType` → impossibile il match richiesto `{className, attrName, attrType}`
- `vertexId` invece di `objectId` (DObject) → confuso con node RF; meglio persistere l'ID del DObject framework

Lo schema proposto dall'utente è corretto e strettamente più ricco. Non c'è compatibilità da preservare (non esiste codice che legga OrphanStore oltre lo stub stesso).

---

## 1.3 Redux bus vs React Flow canvas state

**Confermato: Redux è il layer corretto.**

Evidenze:
- `useClassRemoval` opera su Redux (`SetFieldAction` su `DObject.instanceof`) — NON sugli RF nodes direttamente. Il model canvas riflette il cambiamento via `useJjomSync` che rebuilda gli `ObjectNodeData` da Redux state.
- `ObjectNode` legge live tramite `useSelector` — è un pure projection di Redux.
- Gli RF nodes in `data.features` sono una snapshot ma vengono ricostruiti ad ogni sync cycle da `jjomTransformers.jjomObjectToRFNode`.
- Gli hook `useOrphanFeatures` stub, per forza di destino, usa `useSelector` (pattern corretto).

Nessun segnale contrario nel codice.

**Implicazione per Fase 2:** l'hook deve:
1. Usare `useSelector` per rilevare change a `DClass.attributes`
2. Usare `TRANSACTION` + `DeleteElementAction` / `SetFieldAction` per applicare cleanup/rehydrate
3. NON toccare `setNodes/setEdges` direttamente — il sync layer aggiorna il canvas da solo

---

## 1.4 Punti aperti e rischi

### File da toccare

| File | Motivazione | Estensione |
|------|-------------|-----------|
| `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts` | Stub da trasformare in implementazione reale | Principale — add/remove co-evolution + OrphanStore ref-based |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | `syncRemoveAttribute` usa `DeleteElementAction.new()` diretto → bypassa cascade. Da valutare se intercettare PRIMA della delete (per capture values) o lasciare al hook rilevare post-facto | Modifica minore — decisione di design in Fase 2 |

### Nuovi file

**Raccomandazione: zero nuovi file.** L'esistente `useOrphanFeatures.ts` è il posto giusto. Non c'è ragione di separare.

### Edge case e rischi

1. **Rename attributo — NON è remove+add.** `syncUpdateAttribute(attrId, 'name', newName, _)` modifica il campo `name` sulla stessa `DAttribute`, preservando l'`id`. I DValue restano legati correttamente. **Nessuna azione co-evolution necessaria.** *Rischio*: se in futuro il rename dovesse usare delete+create (non oggi), la co-evolution restorerebbe erroneamente i valori solo se il tipo matcha — accettabile come fallback.

2. **Class removal vs attribute OrphanStore cleanup.** Se l'utente elimina la classe C che contiene l'attributo A:
   - `useClassRemoval` non tocca gli attributi esplicitamente — ma al momento in cui syncDeleteVertex cascata la cancellazione del DClass, `Dummy.get_delete` itera su `lDeleted.children` che include gli attributi → ognuno fa il proprio delete, cascade sui DValue via `case 'instanceof'`
   - L'OrphanStore avrebbe quindi entry per attributi di una classe che **non esiste più** → leak
   - **Serve cleanup cross-entry:** quando una classe è rimossa, eliminare tutte le entry OrphanStore con quel `className`. Gestire in `useOrphanFeatures` osservando anche la lista delle classi, NON toccando `useClassRemoval`

3. **Type mismatch al rehydrate.** Se l'attributo viene ri-creato con tipo diverso (es. era `EInt`, ricreato come `EString`), i valori orphan vanno scartati. Decisione già presa dall'utente: scartare, non forzare conversione.

4. **Enum type mismatch.** Caso specifico: attributo `Gender` era di tipo `Enum1` con literal `MALE/FEMALE`, ricreato come `Enum2` con literal `M/F`. Type id diverso → entry OrphanStore scartata. Corretto.

5. **Undo/redo — il bug storico.** Il commento nel file stub ("to isolate undo/attr_0 bug") indica che un'implementazione precedente causava problemi con undo quando un attributo aveva nome `attr_0` (il default di `createAttribute`). Ipotesi: la logica rehydrate veniva eseguita durante un undo che ripristinava lo stato pre-add → doppia creazione di DValue, o valori sovrascritti. **Rischio concreto:** la Fase 2 deve gestire l'interazione con undo. Due opzioni:
   - a) Memoizzare per evitare esecuzioni ridondanti
   - b) Tenere l'OrphanStore fuori dallo store Redux (useRef session-local) — cosa che lo stub già stabilisce, e che è compatibile con undo perché l'OrphanStore è lato UI, non lato dato
   
   La scelta `useRef` non Redux-persistente è corretta e già presa nello stub. **Mantenere.**

6. **Multiple classes con stesso nome attributo.** Per evitare collisioni cross-class, la chiave deve essere `{classId, attrName, attrType}` — usare `classId` non `className` perché:
   - Il className può cambiare (rename class) senza perdere identità
   - Tuttavia se la classe viene eliminata e ricreata con stesso nome, sarebbe preferibile che i vecchi orphan NON vengano restorati (classe "logicamente diversa")
   - Quindi `classId` è più preciso semantemente
   
   **Decisione proposta:** usare `classId` come chiave. Documentare. Lo schema utente dice `className` — suggerisco modifica.

7. **Attributi dichiarati su superclasse.** Se `classA` ha attributo `x` ereditato da `superclassS` dove `x` è dichiarato, e si rimuove `x` da `S`:
   - Il framework cascade elimina DValue con `instanceof = xAttrId` su TUTTE le istanze di S e sottoclassi
   - L'OrphanStore dovrebbe essere indicizzato per `{classId dove è dichiarato, attrName, attrType}` oppure `{attrId}`
   - Se si usa `attrId` (ID univoco del DAttribute) come chiave, è più semplice e naturale — ma l'attrId cambia se l'attributo viene ri-creato
   - L'utente chiede match su `{className, attrName, attrType}` → stesso attrName su classi diverse sono entry distinte. OK.
   - **Caveat:** se rimuovo un attributo ereditato, le istanze della sottoclasse perdono il DValue. Al re-add su `S`, il nuovo DAttribute avrà stesso name/type. Il hook deve rehydrate per tutte le istanze di S *e sottoclassi*. Usando `classId = S.id`, le istanze delle sottoclassi non vengono trovate direttamente per `instanceof === S.id`. Devo estendere la ricerca usando `extendedBy` chain.

### Collisione con `useClassRemoval`

- **Nessuna collisione di logica.** `useClassRemoval` tocca DObject.instanceof e sincronizza RF. Attributo co-evolution tocca DValue del DObject.
- **Interazione richiesta:** quando useClassRemoval esegue un delete di classe, le entry OrphanStore per quella classe devono essere rimosse. Questo si può fare SENZA modificare `useClassRemoval` — il selector in `useOrphanFeatures` può rilevare `classIds that disappeared` e pulire le entry.

---

## 1.5 Proposta di naming

### Scelta: estendere `useOrphanFeatures.ts` (Opzione A)

**Motivazioni:**

- Il file esiste già, è wirato in `EditorV2.tsx:338`, la documentazione in cima descrive già l'intento (soft-delete + restore).
- Add e remove sono due lati della stessa protezione di co-evolution — dovrebbero condividere stato (l'OrphanStore stesso) e lifecycle.
- Opzione C (due hook separati per add + remove) è sbilanciata: il lato **add non ha bisogno di un hook dedicato** — il framework crea già i DValue. L'hook interviene solo al momento del rehydrate, che è un singolo side-effect ridotto. Spezzare in due hook crea asimmetria di volume di codice e duplicazione di selector.
- Opzione B (rename a `useAttributeCoEvolution.ts`) è una modifica ortogonale che può essere fatta separatamente se il nome "OrphanFeatures" risulta confuso in futuro. Suggerisco di non farla contestualmente all'implementazione per tenere il diff chirurgico.

### Schema proposto per l'hook

```
useOrphanFeatures(modelid, nodes)
├── useSelector → serialized signature of (classId, attrId, attrName, attrType) tuples per class
├── useRef → OrphanStore (session-local, no persistence, no Redux)
└── useEffect on signature diff:
    ├── detect {removedAttrs}: tuple exists in prev snapshot, missing now
    │   └── capture values from DValue.values before they disappear
    │   └── store as entry: {classId, attrName, attrType, valuesByObjectId, removedAt}
    │   └── ensure dangling DValues are cleaned up via DeleteElementAction
    │       (needed because syncRemoveAttribute bypasses Dummy cascade)
    ├── detect {addedAttrs}: tuple missing before, exists now
    │   └── match against OrphanStore by {classId, attrName, attrType}
    │   └── if match: for each object instance, find the auto-created DValue
    │       (identified by instanceof === newAttrId) and populate values
    │       via SetFieldAction. Remove entry from OrphanStore.
    │   └── if no match or type mismatch: no-op (framework already created empty DValue)
    └── detect {removedClasses}: entire class gone
        └── remove all OrphanStore entries with that classId
```

### Chiave OrphanStore raccomandata

```ts
type OrphanAttributeEntry = {
    kind: 'attribute';
    classId: string;          // ⚠️ classId, non className — più preciso
    className: string;        // a titolo diagnostico, per toast/log
    attrName: string;
    attrType: string;         // DClassifier.id (per DataType) o DEnumerator.id
    valuesByObjectId: Map<string, unknown[]>;  // perché DValue.values è sempre array
    removedAt: number;        // Date.now() per debug/expiry futura
};

type OrphanStore = Map<string, OrphanAttributeEntry>; // key = `${classId}:${attrName}:${attrType}`
```

Differenze rispetto allo schema proposto dall'utente:
- `classId` aggiunto (evita ambiguità rename/ricreazione classe)
- `valuesByObjectId` invece di `valuesByInstanceId` — solo terminologia (DObject = istanza, rinominato per coerenza con joiner naming)
- `valuesByObjectId` tiene array, non singolo valore — perché DValue.values è sempre array (upperBound > 1 possibile)

### Note Redux action naming

Per chiarezza: **"attributeAdded"/"attributeRemoved" non sono action type Redux esistenti.** L'hook non ascolta action nominali — osserva stato via selector. L'intent del prompt originale ("listener su Redux action") va riformulato: l'hook reagisce a cambi di stato derivati da sequenze di `CREATE_ELEMENT`/`DELETE_ELEMENT`/`SET_FIELD`, visti tramite la signature selector.

---

## 1.6 Quadro architetturale di sintesi

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Metamodel (M2) add attribute                      │
│                                                                      │
│  UI trigger                                                          │
│  ├── PropertiesPanel "+"         → syncAddAttribute(vertexId)       │
│  ├── ContextMenu "Add Attribute" → lClass.addAttribute(name)        │
│  └── ClassNode inline             → syncAddAttribute(vertexId)       │
│                                                                      │
│            ▼                                                         │
│  LClass.addAttribute(name?, type?)                                   │
│            ▼                                                         │
│  DAttribute.new3(...) ─┬─ CreateElementAction                        │
│                        └─ DStructuralFeature() init hook             │
│                               │                                      │
│                               ▼                                      │
│            FOR each existing instance of class + subclasses:        │
│            DValue.new3({instanceof: newAttrId, values: []})          │
│                                                                      │
│  [GAP] Nessun rehydrate da OrphanStore — value resta []             │
│                                                                      │
│  ObjectNode (live selector via Redux):                               │
│  ├── coveredAttrIds ← liveFeatureNameSig                             │
│  ├── missingAttributes ← metaclassAttrSig - coveredAttrIds           │
│  └── render existing DValues + lazy placeholders                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    Metamodel (M2) remove attribute                   │
│                                                                      │
│  UI trigger                                                          │
│  ├── PropertiesPanel "x"         → syncRemoveAttribute(attrId, _)   │
│  └── ContextMenu "Delete Attr."  → syncRemoveAttribute(attrId, _)   │
│                                                                      │
│            ▼                                                         │
│  TRANSACTION('EditorV2 remove attribute', () => {                    │
│      DeleteElementAction.new(lAttr.__raw);  ⚠️ bypassa Dummy         │
│  });                                                                 │
│            ▼                                                         │
│  Reducer: idlookup[attrId] = undefined                               │
│            PointedBy.remove → aggiorna indici inversi                │
│                                                                      │
│  [GAP] DValue.instanceof === attrId ancora presente                  │
│        → DValue zombie in idlookup                                   │
│        → ObjectNode li filtra silenziosamente (lookup fails)         │
│        → Nessuna entry in OrphanStore                                │
│        → Nessun restore possibile                                    │
│                                                                      │
│  [COSA DOVREBBE SUCCEDERE]                                           │
│  1. PRIMA della delete: capture DValue.values per istanza            │
│  2. Salvataggio in OrphanStore: {classId, attrName, attrType, ...}   │
│  3. Cleanup DValue: DeleteElementAction su ciascun DValue zombie     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Risposte sintetiche alle domande del prompt

> Quali action Redux vengono dispatched quando un attributo viene aggiunto/rimosso?

- Add: `CreateElementAction` sul nuovo DAttribute + side-effect callback che dispatch `CreateElementAction` per ogni DValue auto-creato + `SetFieldAction('+=', attributes)` sul DClass padre
- Remove: `DeleteElementAction` sul DAttribute. **Nessuna** azione automatica sui DValue (bypasso `Dummy.get_delete`)

> Hook pattern?

Selector-driven (non imperativo come `useClassRemoval`). Pattern: `useSelector(classAttrSignature)` + `useEffect` con diff su snapshot precedente + `useRef` per OrphanStore session-local.

> Instance creation legge live o ha cache?

Legge live via selector. **Nessuna cache da invalidare.**

> Come è rappresentato uno slot?

`DValue { instanceof: Pointer<DAttribute>, values: any[], father: Pointer<DObject> }` in `DObject.features[]`. Pure data, serializzabile, Redux-managed.

> OrphanStore schema estensibile?

Schema attuale: stub incompleto (non esiste entry reale). Riprogettare come `Map<${classId}:${attrName}:${attrType}, OrphanAttributeEntry>` dove `valuesByObjectId: Map<string, unknown[]>`. Nessuna compatibilità da mantenere.

---

## Decisioni richieste prima di Fase 2

1. **Conferma naming:** estendere `useOrphanFeatures.ts` (Opzione A) o rinominare in `useAttributeCoEvolution.ts` (Opzione B)?
2. **Conferma chiave OrphanStore:** `classId` (raccomandato) o `className` (schema originale)?
3. **Conferma cleanup DValue zombie:** la rimozione attributo lascia DValue dangling. Fase 2 deve anche ripulirli con `DeleteElementAction` dopo aver copiato i valori in OrphanStore. Confermi?
4. **Conferma lifecycle OrphanStore:** session-local (`useRef`, si perde su F5 / unmount — raccomandato, coerente con stub originale)? O persistere su Redux per sopravvivere a unmount?
5. **Conferma bug storico undo/attr_0:** accettare il rischio di riattivare il bug originale e affrontarlo contestualmente con cura nei test manuali? O indagare prima leggendo commit in zona (ma git non ha l'implementazione precedente — dovremmo rigenerarla e testare)?

## Fuori scope (delegati ad altri prompt come da prompt originale)

- Name sync bidirezionale `data.name` ↔ `$name.value` — Prompt 2
- Uniqueness validation nome — Prompt 3
- Context menu "Add ..." disabled su upperBound reached — Prompt 4
- Rinomina attributo come caso a sé — **non necessario**: l'analisi qui conferma che rename preserva identità DAttribute, quindi è trasparente. Nessun prompt aggiuntivo richiesto.

---

**Fine Fase 1. In attesa di conferma sul report prima di procedere con Fase 2.**

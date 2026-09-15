# Discovery — Righe attributo duplicate dopo import XMI (slot DValue mirage + import)

**Data**: 2026-07-19
**Branch analizzato**: `alfonso-frontend-jjtl` @ `853f434` (clone del repo pushato, analisi read-only in sessione Cowork cloud)
**Tipo**: diagnosi con evidenze, nessun fix. Da committare in `docs/discovery/` col prossimo giro di Claude Code.

---

## Obiettivo

Diagnosticare la duplicazione di righe attributo (una valorizzata, una vuota) sui nodi M1 dopo import XMI: individuare dove nascono slot `DValue` duplicati nel D-layer e verificare se i renderer (nativo e IR) li mostrano entrambi.

## File letti

- `frontend/src/services/export/XMIService.ts` (import M1: righe 506-1130)
- `frontend/src/api/data.ts` (EcoreParser: righe 140-680)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (DObject/LObject/DValue: righe 5700-6540, 200-280)
- `frontend/src/joiner/classes.ts` (Constructors: righe 550-820, 1391-1530)
- `frontend/src/redux/reducer/reducer.ts` (righe 110-225, 420-560)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (righe 239-349)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (righe 60-170, 358, 460)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (righe 1-120)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (righe 1353-1379)
- `frontend/src/components/project/ProjectEditor.tsx` (righe 860-930)
- `frontend/src/redux/VersionFixer.tsx` (grep mirato)

## Code path import XMI

Entry point UI: `ProjectEditor.tsx:892` → `XMIService.importM1FromFile` (`XMIService.ts:516`) → `importM1FromXML` (`XMIService.ts:535`). Catena:

1. Parse XML → JSON (`xmlToJson`, riga 553), risoluzione metamodello via xmlns (`getMetamodelByNsURI`, riga 571).
2. `DModel.new` (riga 589), poi per ogni istanza radice: `DObject.new(metaClass.id, dModel.id, DModel, undefined, true)` (righe 642/663). `persist=true` e Constructors **non** in pausa: persistenza immediata, elemento per elemento.
3. Pass 1: `processInstance` (riga 675) → `processAttribute` (759), `processContainment` (762).
4. Pass 2: `resolveReferences` (679) → `populateReferenceValue` (1101).

Creazione slot nell'import (tutte e tre le vie creano DValue **nuovi**, mai riusano slot esistenti):
- attributi primitivi: `DValue.new(undefined, metaFeature.id, values, dObject.id, true, false)` — `XMIService.ts:826`
- containment: `DValue.new(..., [], parentDObject.id, true, false)` — `XMIService.ts:923`
- reference non-containment: `DValue.new(..., targets, sourceDObject.id, true, false)` — `XMIService.ts:1116`

## Creazione slot: import vs factory

**La factory crea già gli slot da sola.** `DObject.new` con `instanceoff` (`LModelElement.tsx:5734`) passa per `Constructors.DObject` (`classes.ts:771-783`), che registra `setWithSideEffect("instanceof", ...)` (`classes.ts:633-641`): al momento della persistenza (`Constructors.persist`, `classes.ts:648-676`) il callback assegna `instanceof` via proxy L → `LObject.set_instanceof` (`LModelElement.tsx:6283`) → **`_forceConformity` (`LModelElement.tsx:6314-6333`)**: per ogni `allAttributes` + `allReferences` della metaclasse non già coperta da uno slot esistente, crea un **DValue "mirage"** vuoto (`addValue(undefined, id, [], true)`, riga 6330 → `DValue.new(..., isMirage=true)`, riga 6261).

Il dedup interno di `_forceConformity` (riga 6326) guarda gli slot **già presenti** in `features` al momento dell'assegnazione di `instanceof`.

**Meccanismo di duplicazione nell'import XMI M1:**

1. `XMIService.ts:642/663`: `DObject.new` persiste subito; `features` è vuoto (gli slot dell'import non esistono ancora). `_forceConformity` non trova nulla da dedupare e crea **uno slot mirage vuoto per OGNI feature della metaclasse**.
2. Solo dopo, `processInstance` crea il **secondo** slot non-mirage con i valori (`XMIService.ts:826/923/1116`), agganciato a `features` via `SetFieldAction "features" '+='` (`Constructors.DValue`, `classes.ts:801`). Il reducer `+=` appende senza dedup (`reducer.ts:179-198`).

Risultato: per ogni feature presente nel file XMI l'oggetto ha **due DValue con lo stesso `instanceof`**: uno mirage con `values: []` (riga vuota) e uno import valorizzato (riga piena). Le feature assenti dal file hanno solo lo slot mirage (una riga vuota: comportamento atteso).

**Perché il path EcoreParser non duplica.** `EcoreParser.parse` (`data.ts:170-195`) lavora con `Constructors.paused = true` (riga 178): costruisce tutto e persiste alla fine (riga 187). Quando il callback `instanceof` scatta, gli slot espliciti esistono già e sono risolvibili anche se non ancora nello store, grazie a `pendingCreation` (`classes.ts:573`, risoluzione `classes.ts:1496`): il dedup di `_forceConformity` funziona. L'import XMI M1 invece persiste ogni DObject **prima** di costruire i suoi slot: il dedup non può funzionare per costruzione.

Nota secondaria: i push diretti post-persist (`XMIService.ts:643, 664, 827, 924, 952-953`) su oggetti D locali sono con ogni probabilità dead-write; non causano il sintomo ma sono ridondanti e fragili.

## Lato rendering

Entrambi i renderer mostrano tutti gli slot, senza filtro `isMirage` né dedup per feature:

- **Nativo**: `jjomTransformers.ts:259-321` itera `lObject.features` e produce una riga per DValue; slot con `values: []` → `value: ''` (287-288). `lObject.features` → `get_children` (`LModelElement.tsx:6353-6356` → `5876-5899`): dedup solo per id di DValue, non per feature; nessun filtro mirage (esiste solo in `get_truechildren`, 5835-5839, che nessun renderer usa). I placeholder "missingAttributes" di ObjectNode (143-169) coprono solo feature senza alcuno slot: non c'entrano.
- **IR**: `IRNodeContent.tsx:44-77` legge direttamente `dObject.features` e crea una riga per ogni DValue risolvibile. Nessun controllo su `isMirage`.

Nessun dedup a valle maschera il problema: entrambi i renderer mostrano riga vuota + riga valorizzata. Differenza solo di ordinamento: il nativo raggruppa per feature (duplicate adiacenti), l'IR segue l'ordine raw (prima il blocco mirage, poi il blocco import).

**Effetto collaterale sull'editing**: `syncUpdateFeatureValue` (`canvasToJjom.ts:1353-1379`) scrive via `lObject['$'+featureName].value`; il getter `$feature` (`LModelElement.tsx:217-236`) restituisce il **primo** child con quel nome, verosimilmente lo slot mirage. Editare la riga valorizzata potrebbe aggiornare la riga vuota (da confermare in app).

## Ipotesi di root cause (confidenza: ALTA)

`XMIService.importM1FromXML` crea ogni DObject con `instanceoff` e persistenza immediata: `_forceConformity` istanzia subito uno slot mirage vuoto per ogni feature. L'import poi crea un secondo slot non-mirage per ogni feature presente nel file, senza riusare né dedupare i mirage. I due slot coesistono nel D-layer e vengono renderizzati entrambi da nativo e IR. La duplicazione **persiste al save/load** (i DValue vivono in idlookup serializzato; `VersionFixer.tsx` non ha migrazioni di dedup, solo `removeNullPtrs` su features, riga 285).

Confidenza alta: meccanismo deterministico dal codice, spiega esattamente il sintomo in entrambi i renderer. Unico anello non eseguito: conferma runtime.

## Passi di verifica in app per Alfonso (5 minuti)

1. **Conteggio slot su oggetto importato** (DevTools console, dopo un import XMI):

```js
const s = windoww.store.getState();
const objs = Object.values(s.idlookup).filter(e => e.className === 'DObject');
const obj = objs[objs.length - 1]; // o cerca per nome
console.table(obj.features.map(fid => {
  const v = s.idlookup[fid];
  return { fid, feature: s.idlookup[v?.instanceof]?.name, isMirage: v?.isMirage, values: JSON.stringify(v?.values) };
}));
```

Conferma attesa: per ogni feature presente nell'XMI, **due righe** con lo stesso `feature`: una `isMirage: true, values: []` e una valorizzata.

2. **Controprova con oggetto da UI**: creare dalla palette un'istanza della stessa metaclasse e rilanciare lo snippet sul suo id: attesi slot **unici** per feature, tutti `isMirage: true`.

3. **Test dell'editing incrociato**: sul nodo importato, editare in place la riga valorizzata e osservare quale riga cambia. Se cambia la riga vuota, è confermato che `$feature` risolve lo slot mirage per primo.

## Direzioni di fix candidate

1. **Riuso dello slot mirage (preferita, chirurgica)**: in `processAttribute`/`processContainment`/`populateReferenceValue`, prima di `DValue.new` cercare in `dObject.features` uno slot con lo stesso `instanceof` e scrivere i valori lì (SetFieldAction su `values`), allineandosi al write-path UI. Tocca solo `XMIService.ts`.
2. **Allineamento al pattern EcoreParser**: costruire l'intero M1 con `Constructors.paused = true` e persistere in blocco alla fine. Più aderente all'architettura ma più invasivo (timing della persistenza, interazione con useJjomSync).

Un dedup solo lato rendering mascherebbe il problema lasciando slot spurii nel D-layer e nei salvataggi: sconsigliato. Valutare una migrazione VersionFixer di bonifica per i progetti già salvati con duplicati.

## Domande aperte

- I progetti già salvati dopo import XMI contengono duplicati persistiti: serve una migrazione di bonifica o basta il fix sull'import?
- `useJjomSync` Step 4 / `useM1ReferenceEdges` iterano gli slot reference: con slot duplicati gli edge risultano corretti perché il mirage è vuoto, ma verificare che un futuro write sul mirage non crei edge doppi.
- I push diretti post-persist in `XMIService.ts` (643, 664, 827, 924, 952-953): confermare che siano dead-write in tutti i timing.
- Il path legacy `XMIService.importFromXML` (XMI con metamodello embedded, via EcoreParser in pausa) dall'analisi statica non duplica, ma non è stato eseguito.

# Discovery 2026-08-30 — censimento dei `.delete()` per proxy stale

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `cb26bdf33`
**Prompt**: «Censimento dei 67 `.delete()` per proxy stale» — aprire la domanda lasciata da
`discovery_2026-08-30_6_rform10_controesempio.md` §3: quanti siti tengono un proxy avvolto
in una fase precedente? Solo discovery: zero fix.
**Sonda** (non committata, non in `npm run smoke`):
`frontend/scripts/smoke/_tmp_delete_census_canvas.ts`.
**Esito**: **un solo (c), ed è quello già noto** — il fixture `RowViewSmoke`. Zero (c) in
codice di prodotto. Ma il numero di partenza era sbagliato e il criterio del referto
precedente era più largo del vero: entrambi corretti qui.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep`
risolve in questa shell.

---

## 0. Due correzioni prima del censimento

### 0.1 I siti sono 43, non 67

Il referto R-FORM-10 §3 scrive «`.delete()` compare in **67** punti di `frontend/src` fuori
dai test». Il numero è il conteggio di righe di `command grep -rn "\.delete()"`, e **24 di
quelle righe sono commenti** — `docs/`, JSDoc e note inline che *nominano* `.delete()`
senza chiamarlo. Separati meccanicamente (occorrenza preceduta da `//` o da `*` di blocco):

```
TOTALE righe        : 67
menzioni in commento: 24
CHIAMATE VERE       : 43
```

Su HEAD `cb26bdf33` il totale è ancora 67 righe: nessun delta rispetto alla misura del
referto precedente, solo una lettura più stretta dello stesso dato. Il filtro `--exclude`
sui test non cambia nulla: `command grep -rn "\.delete()"` dà 67 con e senza, cioè non ci
sono chiamate `.delete()` nei test sotto `src`.

**La correzione conta**: 24 su 67 è il 36% del campione, e un censimento che le classificasse
produrrebbe 24 verdetti su righe che non eseguono niente.

### 0.2 Il criterio di rischio è più stretto di «scritture interposte»

Il prompt definisce (c) come «avvolto in una fase precedente **con possibili scritture
interposte**». Letto il codice, la condizione è più stretta, e la differenza cambia la
classificazione di quasi tutti i siti.

`get__jjdependencies` (`joiner/classes.ts:2104-2148`) fa due cose diverse con due fonti
diverse:

```typescript
const data = context.data;          // lo SNAPSHOT del wrap
let s = store.getState();           // lo store VIVO
for (let pointedBy of data.pointedBy) {          // ← elenco dallo snapshot
    let followPath = U.followPath(s, pathArr);   // ← risolto sul vivo
    ...
    for (let v of lastValArr){
        if (v !== context.data.id) continue;     // ← e deve valere ancora l'id
```

Quindi:

- un puntatore **rimosso** dopo il wrap: è ancora nell'elenco, ma il path risolto sul vivo
  non porta più all'id → scartato. **Corretto.**
- un puntatore **aggiunto** dopo il wrap: non è nell'elenco → mai visto. **È il difetto.**

**(c) non è «scritture interposte»: è «una scrittura interposta che AGGIUNGE un puntatore
entrante al morente».** Una scrittura che ne toglie, o che tocca altro, è innocua per
costruzione. Questo è ciò che rende (b) una classe ampia e (c) una classe quasi vuota.

### 0.3 Una rete di sicurezza già scritta, e per due campi soltanto

`Dummy.get_delete` porta un blocco che qualcuno aveva già messo lì per questo problema
(`common/Dummy.ts:104-116`), verbatim:

> Safety net: directly remove from father's collection. The pointedBy-based loop below
> handles this too (field 'objects' at case line 170), but **if pointedBy data is stale or
> incomplete, the Pointer would be left dangling.**

Copre `father.objects` (per un `DObject`) e `father.features` (per un `DValue`) — cioè il
containment. **Non copre `values`**, cioè gli slot di riferimento. L'esposizione residua è
esattamente quella che R-FORM-10 descrive, e la rete esistente ne è la prova che il modo di
guasto era già noto in una sua metà.

## 1. La classificazione, 43 siti

Criterio: **(a)** proxy avvolto nello stesso tratto di codice della delete, senza nulla in
mezzo; **(b)** avvolto prima, ma senza alcuna scrittura interposta che aggiunga un puntatore
entrante — sicuro oggi per costruzione del flusso, non per una garanzia strutturale;
**(c)** avvolto in una fase precedente con una scrittura interposta che aggiunge un
puntatore entrante.

| file:riga | proxy da | classe | perché |
|---|---|---|---|
| `common/Dummy.ts:85` | `lDeleted.children`, letto lì | a | cascata interna |
| `common/Dummy.ts:165,215,236` | `L.wrap(pointer)` nel ciclo | a | avvolto per ogni dipendenza |
| `common/Dummy.ts:254` | `lDeleted.nodes` (getter sullo snapshot) | b | `nodes` è mappa transiente del classic editor |
| `model/…/LModelElement.tsx:6505` | `context.proxyObject.features`, letto lì | a | `_removeConformity` |
| `model/…/LModelElement.tsx:2926,2928` | `LPointerTargetable.fromPointer(vertexId)` | a | `set_singleton`, ciclo vertici |
| `model/…/LModelElement.tsx:2931` | `instances`, catturato prima | b | in mezzo solo delete di vertici = rimozioni |
| `model/…/LModelElement.tsx:555` | `context.proxyObject` | b | `targetRemoved`, contesto reattivo |
| `model/…/LModelElement.tsx:3536` | `o.allChildren` prima del ciclo | **b, il più vicino a (c)** | `o.addValue(...)` **scrive** in mezzo — vedi §2 |
| `components/…/canvasToJjom.ts:398` | `vertexProxy.model`, letto lì | a | rifiuto singleton, esce subito |
| `components/…/canvasToJjom.ts:440,461` | `vertexProxy.model` a inizio funzione | b | in mezzo `extends` filtrato + `DeleteElementAction` = rimozioni |
| `components/…/canvasToJjom.ts:513` | `fromPointer(refId)` sulla riga sopra | a | |
| `components/…/canvasToJjom.ts:515` | `fallbackRefProxy`, più vecchio | b | ramo di ripiego |
| `components/…/canvasToJjom.ts:742` | `fromPointer(attrId)` a inizio funzione | b | in mezzo `captureAttributeOrphanValues` = sola lettura |
| `components/…/deleteAdapter.ts:148` | `fromPointer(id)` **dentro il ciclo** | a | il percorso del manager |
| `components/contextMenu/ContextMenu.tsx:689,690` | `L.from(...)` due righe sopra | a | scorciatoia da tastiera |
| `components/TreeViewSidebar/TreeViewContent.tsx:1422,1835` | catturato al render | b | nessuna scrittura in mezzo |
| `components/TreeViewSidebar/TreeViewContent.tsx:1824` | catturato al render | b | `lView.name = …` in mezzo: scrive **sul morente**, non un puntatore verso di lui |
| `components/project/ProjectEditor.tsx:1167,1175,1189` | catturato al render | b | in mezzo solo `DockManager.closeTabs…` (UI) |
| `pages/components/Dashboard.tsx:448,469,497` | catturato al render (`.map`) | b | pagina-elenco: nessuna affordance che crei puntatori |
| `pages/components/catalog/Catalog.tsx:330` | `props.projects` filtrati, ciclo con `await` | b | le iterazioni precedenti rimuovono, non aggiungono |
| `pages/components/Project.tsx:204` | `data` di pagina | b | |
| `common/UX.tsx:119` | parametro, delete **dopo un `await` di conferma** | **b, la finestra più lunga** | il modale blocca l'interazione — vedi §4 |
| `services/JjodieActionExecutor.ts:153,240,338` | `find(...)` sulla riga sopra | a | ma dentro una `TRANSACTION` esterna, vedi §4 |
| `jjscript/…/instance.ts:410` | `resolveInstanceHandle` a `:372` | b | in mezzo solo validazioni |
| `jjscript/…/delete.ts:115` | `resolveElement` a `:51` | b | in mezzo `checkDependencies` (letture) + delete di vertici (rimozioni) |
| `jjscript/…/delete.ts:214` | `vertexProxy` nel ciclo | b | in mezzo delete di archi = rimozioni |
| `examples/RowViewSmoke/index.ts:296` | `LProject.fromPointer(…)` inline | a | |
| **`examples/RowViewSmoke/index.ts:506`** | **`byName` costruito a `:396-400`, riferimenti scritti a `:410`** | **c** | **confermato: è il contro-esempio di R-FORM-10** |
| `examples/StateMachine/index.ts:90` | campo statico di lunga vita | b | cancella un intero progetto |
| `examples/StateMachine/index.ts:164` | campo statico `this.reset` | b | **due `SetFieldAction '-='` a mano prima della delete**: rimozioni, non aggiunte |
| `api/persistance/projects.ts:190` | `L.from(project.id)` sulla riga sopra | a | |

**Conteggio: (a) 17 · (b) 25 · (c) 1.** Il solo (c) è nel fixture, non in codice di prodotto,
ed era già confermato a schermo il 2026-08-30.

## 2. Il candidato che non lo è: `_fixExtendInstances`

`LModelElement.tsx:3505-3540` è l'unico punto di prodotto con la forma
**wrap → scrittura → delete**:

```typescript
let allChildren = o.allChildren;                       // ← wrap
for (let added of deepFeatureAddedID) o.addValue(...); // ← SCRITTURA
...
let lval: LValue = allChildren[i] as LValue;
lval.delete();                                          // ← delete
```

Non è (c), per due ragioni indipendenti che si controllano a vicenda:

1. `addValue` **appende** a `o.features`. L'unico puntatore entrante di `lval` è
   `idlookup.<o>.features.<i>`, e un append non sposta l'indice `i`: il path dello snapshot
   risolve ancora su `lval`. Nessuna aggiunta *verso* `lval`.
2. Anche se lo spostasse, `lval` è un `DValue` e il campo è `features`: è **esattamente** uno
   dei due coperti dalla rete di sicurezza di §0.3.

È il sito da rileggere per primo se qualcuno cambierà `addValue` in una scrittura posizionale
invece che in un append.

## 3. Il percorso più usato, misurato end-to-end

Una classificazione statica non basta per il percorso che gli utenti battono ogni giorno.
`_tmp_delete_census_canvas.ts` misura `canvasToJjom.syncDeleteVertex` (chiamato da
`EditorV2.tsx:2424` e `:2459`, cioè dal tasto Delete sulla selezione) nella sequenza che
renderebbe (c) osservabile **se esistesse**: il canvas monta prima, il riferimento entrante
si scrive dopo, e solo allora si cancella il bersaglio col gesto vero.

```
PASS  il canvas e' montato (controllo positivo)  .mm-object = 8
slot PRIMA del gesto: {"len":1,"resolves":["Config_main"],"dangling":0}
PASS  il nodo e' a schermo (controllo positivo)  [data-id="…_107"] = 1
DOPO il gesto: {"slot":{"len":0,…,"dangling":0},"targetVivo":false,"nodiASchermo":7}
PASS  il bersaglio e' stato davvero cancellato
PASS  nessun puntatore appeso: lo slot del referente e' vuoto
```

Pulito: `syncDeleteVertex` avvolge dentro la funzione
(`LPointerTargetable.fromPointer(vertexId)`), quindi al momento del gesto, e la scrittura
precedente è nello snapshot. Otto nodi prima, sette dopo — la delete è avvenuta davvero, e
la misura non è nulla.

**E il rilevatore ha segnale.** «Nessun (c)» vale solo se la sonda saprebbe vederne uno.
Nella stessa corsa un (c) è costruito a mano — proxy avvolto prima della scrittura — e la
sonda lo vede rosso:

```
controllo negativo, DOPO: {"slot":{"len":1,"resolves":[null],"dangling":1},"targetVivo":false}
PASS  CONTROLLO NEGATIVO: un (c) costruito a mano viene visto come appeso
```

ALL GREEN, zero errori di pagina, una sola corsa senza boot multipli.

## 4. Cosa mostra la superficie, se un (c) capitasse

Domanda 3 del prompt. Per il solo (c) esistente la risposta è già misurata nel referto
precedente §5, e **non è muta**:

- **tabella dell'instance manager**: cella `broken`, classe `instance-manager__broken`,
  distinta da `missing` (slot required vuoto) — `InstanceManagerTab.tsx:100-119`.
- **nodo del canvas**: `brokenRef`, col nome ricordato da `brokenRefMemory` e non con l'id
  accorciato.

Cioè: sulle reference il degrado è **visibile**, al contrario del caso `DTypedElement` e al
contrario dell'orfano invisibile di R-FORM-9. Il motivo è strutturale: un puntatore appeso
lascia una prova nello slot, mentre un `father` rotto fa sparire l'elemento dalle liste.

**Il rovescio, e non è coperto da nessuna misura**: se il (c) cadesse su un campo che **non**
è `values` — `classes`, `subElements`, `instances`, `packages` — la voce resterebbe in una
collezione senza risolvere, e lì il degrado è muto come quello di R-FORM-9. Nessun sito (c)
di quel tipo esiste oggi; se ne nascesse uno, non ci sarebbe nulla a schermo a dirlo.

**Due osservazioni fuori dalla classificazione**, entrambe misurate leggendo il codice e
nessuna delle due oggetto di questo censimento:

- `JjodieActionExecutor.ts:143,153` e i suoi due gemelli chiamano `.delete()` **dentro una
  `TRANSACTION` esterna**, mentre `Dummy.get_delete` apre la propria. È il rischio di §3.3
  di `CLAUDE.md`, non quello dell'orologio del wrap. Segnalato, non verificato.
- `common/UX.tsx:119` è la finestra wrap→delete più lunga del codebase: un `await` su un
  dialogo di conferma, quindi tempo umano arbitrario. È (b) perché il modale blocca
  l'interazione e nulla può scrivere nel frattempo — una garanzia della UI, non del D-layer.

## 5. Se un giorno servisse il fix — forma, non applicazione

I (c) confermati in prodotto sono **zero**, quindi non c'è nulla da riparare oggi. Le due
forme possibili, per la ratifica del design e non per questa sessione:

1. **Ri-wrap prima della delete.** `Dummy.get_delete` rileggerebbe `pointedBy` dallo store
   invece che da `context.data`. Una riga, e chiude il modo di guasto alla radice per tutti
   i 43 siti insieme. Rischio: `get_delete` è usata da ogni classe L, e il referto di
   R-FORM-11 mostra che l'ordine delle scritture attorno alla delete è già delicato — una
   lista di dipendenze più lunga può far scattare `-=` che oggi non scattano.
2. **Invariante nel costruttore del proxy.** Non praticabile senza cambiare la natura del
   `Proxy`: il target è il D del wrap per progetto (`joiner/classes.ts:277`), ed è ciò che
   rende le letture coerenti dentro un render. Renderlo vivo cambierebbe semantica ovunque,
   non solo nella delete.

La 1 è locale e verificabile; la 2 è una riscrittura del D-L. Se il design volesse una terza
via minima: estendere la rete di sicurezza di §0.3 dal solo `father` anche a `values`,
cioè fare un `-=` diretto sugli slot che l'`idlookup` mostra puntare al morente. Costa una
scansione, ma è confinata alla delete e non tocca il proxy.

## 6. Cosa NON è verificato

- **Il ri-wrap di React per gli 11 siti catturati al render** (`Dashboard`, `ProjectEditor`,
  `TreeViewContent`, `Catalog`, `Project`). Sono (b) perché nei loro flussi nessuna
  affordance aggiunge un puntatore al morente fra il render e il click, **non** perché sia
  stato misurato che React ri-avvolge. Se una di quelle pagine acquistasse una scrittura di
  riferimento senza re-render, diventerebbe (c) senza che nulla lo segnali.
- **I percorsi JjScript e Jodie a schermo**: classificati staticamente, non esercitati.
- **Le collezioni diverse da `values`**: nessun (c) esiste oggi, quindi il degrado muto
  descritto in §4 non è stato osservato, solo dedotto dalla forma della cascata.
- **`R-SMK-2`**, citata dal prompt come regola di gate sullo smoke, **non esiste in
  `docs/decisions.md`** (controllo positivo: la stessa ricerca trova `R-FORM-10`). Ne è stata
  applicata la sostanza — corsa singola, nessun boot multiplo, dichiarato in §3.

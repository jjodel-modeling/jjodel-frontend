# Discovery — Layout per viewpoint, D1..D8 e D10 (Fase 1, read only)

**Data di esecuzione**: 2026-08-24 (la sessione è partita il 2026-08-23 sera e ha attraversato la
mezzanotte; il prompt ammette «data del giorno di esecuzione»)
**Branch**: `alfonso-frontend-jjtl`, **HEAD** `d916a04f9`
**Prompt**: `docs/prompts/claude_2026-08-22_1705_prompt_layout_per_viewpoint_d1_d8_d10.md`, con il
**Riallineamento del 2026-08-23 (sera)**, che prevale sul corpo dove diverge
**Protocollo**: P1..P10 con **deroga dichiarata su P8** (fase read only)
**Esito**: D1..D8 e D10 **eseguite**, per la prima volta dopo tre sessioni fermate su D0, Q0 e D9.
Zero righe di codice toccate. Hard stop al §14.

---

## 0. Premesse dichiarate prima delle misure

### 0.1 Passo zero — passato

```
command grep -c "R-LAY"  docs/decisions.md   → 19   (atteso 19)
command grep -c "R-IRN"  docs/decisions.md   → 62   (atteso 62, controllo positivo)
command grep -c "R-DEAD" docs/decisions.md   → 11   (atteso 11, controllo positivo aggiuntivo)
```

Tre valori su tre coincidono con quelli del riallineamento. Le dodici righe `R-LAY-1..12` sono state
lette **dal file** (`docs/decisions.md:1692-1714`), non dal riassunto del prompt.

### 0.2 L'addendum §8 non esiste — dichiarazione dovuta

Il prompt cita in RIFERIMENTI «questo memo e il suo addendum §8». Il memo
(`docs/ratifiche/claude_2026-08-22_memo_ratifica_layout_per_viewpoint.md:109-127`) dichiara §8
**perduto e chiuso**, non lacunoso in attesa: «Non è una lacuna in attesa di essere colmata: è chiuso
così», con la clausola operativa «chi lo legge lo dichiara nel report e procede sul resto».

Questo report lo dichiara e procede. **Nessuna risposta qui sotto poggia su §8**, e dove una domanda
avrebbe potuto poggiarci (D6, la natura di `Eroute`) il §7 lo dice esplicitamente.

### 0.3 Divergenza fra corpo e riallineamento sulla sede del report

Il corpo (Vincoli) impone per `R-E/E-1` di **non** creare un file nuovo ma di aggiungere un addendum
in coda a `discovery_2026-08-22_layout_per_viewpoint.md`. Il riallineamento dispone invece un file
nuovo in `docs/discovery/` con naming standard. **Prevale il riallineamento**, come il prompt
stabilisce e come l'istruzione di esecuzione ha confermato.

Lo spirito di `R-E/E-1` è comunque rispettato: il report del 22 è stato letto (1144 righe, struttura
e sezioni pertinenti) e il **confronto punto per punto** sta al §12. Nessuna sua riga è stata
riscritta.

### 0.4 Gradi di certezza — la convenzione di questo report

Il prompt impone di distinguere, perché la discovery precedente ha sbagliato proprio qui su D2. In
questo report:

- **[MISURATO]** — ho eseguito qualcosa e letto il risultato: un `grep` il cui output è riportato, o
  una sonda eseguita su dati reali. È il grado di D8 e dei censimenti.
- **[TRACCIATO]** — ho letto il codice e seguito la catena, **senza eseguirlo**. La stragrande
  maggioranza delle risposte semantiche (che cosa fa `set_size`, che cosa legge editor-v2) è di
  questo grado. Non è una misura a runtime.
- **[CITAZIONE]** — riporto ciò che un documento afferma, senza verifica indipendente.

Dove un'affermazione è di grado inferiore a quello che la domanda meriterebbe, è detto sul posto.

### 0.5 Strumento

`command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep --ignore-files`. Ogni asserzione di
assenza porta il controllo positivo **nella stessa invocazione** (`R-RAIL-28`), glob quotati.
`src/examples/` è stato escluso da quasi tutte le ricerche di codice perché contiene **dump
serializzati di progetti** (fino a 559 KB su una riga sola) che inquinano ogni conteggio: dove
l'esclusione c'è, è dichiarata. Gli stessi dump sono invece **il dato** di D8.

Una sonda Python è stata eseguita **in scratchpad di sessione** per D8 (§9), su copia in memoria dei
dump: il repo non è stato toccato.

---

## 1. D1 — La sede attuale

**Risposta: posizione e taglia stanno insieme, sullo stesso oggetto, come quattro scalari
fratelli.** [TRACCIATO]

`frontend/src/model/dataStructure/GraphDataElements.tsx`:

| Classe | Riga | Campi |
|---|---|---|
| `DGraphElement` | 78 | `x` (93), `y` (94), `zIndex` (95), `w` (96), `h` (97), `view` (100), `anchors` (104), `isSelected` (88) |
| `DVertex extends DGraphElement` | 1662 | **ridichiara** `x` (1678), `y` (1679), `w` (1680), `h` (1681); **aggiunge** `isResized` (1682), `zoom` (1677), `snap` (1683), `ghostOffsets` (1685), `ghostParentOffsets` (1687), `irEdgeLayout` (~1690), `irCollapsed` (~1697) |

Tre fatti che contano per il fronte:

1. **Insieme, non separate.** `x, y, w, h` sono quattro campi scalari sullo stesso oggetto D. Non
   c'è un sotto-oggetto «layout» da indicizzare in blocco: indicizzare per viewpoint significa
   toccare quattro campi, o introdurre il contenitore che oggi non esiste.
2. **Il campo è sul vertice, non sul view element.** Il vertice è l'oggetto di canvas
   (`DGraphElement`), distinto dall'elemento di modello (`model`, riga 87) e dalla view (`view`,
   riga 100, molteplicità `1,1`).
3. **`isResized` è la metà semantica della taglia.** `w/h` esistono sempre (ogni `DVertex` nasce con
   una taglia di default); `isResized` è ciò che distingue «taglia scelta da un umano» da «taglia di
   default mai toccata». Vedi D5 (§6).

**La persistenza passa dallo stesso campo per entrambe**: `x/y` e `w/h` sono campi dello stesso
oggetto nello stesso `idlookup`, serializzati insieme. Confermato sui dump reali al §9.

---

## 2. D2 — L'asse per view esiste già?

Questa è la domanda che il prompt dichiara capace di cambiare il fronte, e la risposta misurata **lo
cambia**, ma non nella direzione che il prompt anticipava.

### 2.1 Sull'asse dei *vertici*: non esiste — e questo conferma le tre citazioni, misurandole

Il prompt chiede una misura, non una citazione. Ecco la misura. [TRACCIATO — lettura del codice,
non esecuzione]

**La chiave del lookup del graph**, `useJjomSync.ts:282`, verbatim:

```typescript
const matching = dGraphs.find(g => g?.model === modelid && (g as any).graphStyle === 'v2-flow');
```

La chiave è **(id del modello, stile del graph)**. Nessun viewpoint compare nell'espressione.

**I siti di creazione**, tutti, senza parametro di viewpoint:

```
MetamodelTab.tsx:162      DGraph.new(0, model.id)
ModelTab.tsx:31           DGraph.new(0, model.id)
useJjomSync.ts:717        DGraph.new(0, modelid)
ProjectEditor.tsx:1676    DGraph.new(0, dModel.id, undefined, undefined, graphId)
useJjomSync.ts:741,773    DVertex.new(0, <idElementoModello>, graphId, graphId, undefined, size)
canvasToJjom.ts:1091,1134,1178,1281   idem
```

Un graph per (modello, stile), un vertice per elemento di modello dentro quel graph: **una sola
quadrupla `x,y,w,h` per elemento di modello**, e nessun asse su cui farla variare.

**Controllo positivo che dà forza alla misura**: il D-layer *sa già* indicizzare un campo per un
discriminante, e lo fa sulla stessa classe. `DGraphElement.isSelected` (riga 88) è
`Dictionary<Pointer<DUser>, boolean>` — indicizzato **per utente**. `anchors` (104) è
`Dictionary<string, GraphPoint>`. Su `DVertex`, `ghostOffsets` (1685) è indicizzato per `refId` e
`ghostParentOffsets` (1687) per id di classe. Quando questo codebase vuole un asse, scrive un
dizionario. Su `x/y/w/h` non l'ha scritto.

Conseguenza: indicizzare i vertici per viewpoint **non è creare un asse concettuale nuovo**, è
cambiare la forma di quattro campi da scalare a dizionario, con un idioma già in uso a tre righe di
distanza. È molto meno del «lavoro di un ordine di grandezza diverso» che il prompt paventava.

### 2.2 Sull'asse delle *view*: esiste, è completo, ed è vivo

**Questo è il finding principale della sessione.** [TRACCIATO]

`frontend/src/view/viewElement/view.tsx:1462`, verbatim:

```typescript
protected size!: Dictionary<Pointer<DModelElement> | Pointer<DGraphElement>, GraphSize>; // use getSize, updateSize;
```

**La view ha già un dizionario di layout indicizzato per elemento.** E non è una struttura orfana: è
implementata su tutti e due i versi, con catena di fallback.

**Scrittura** — `LViewElement.get_updateSize` (`view.tsx:1681-1718`):

```typescript
let vp = c.proxyObject.viewpoint;
if (!c.data.storeSize) {
    if (vp?.storeSize) return vp.updateSize(id, size);
    return false;
}
...
if (!newSize.equals(vsize)) SetFieldAction.new(c.data.id, "size." + id as any, newSize);
```

**Lettura** — `get_getSize` (`view.tsx:1721-1738`):

```typescript
if (view.storeSize){ ret = view.size[id]; if (ret) return ret; }
let vp = c.proxyObject.viewpoint;
if (vp && view.id !== vp.id && vp.storeSize){ ret = vp.size[id]; if (ret) return ret; }
return undefined;
```

La catena è **view → viewpoint → (undefined, e allora si ricade sugli scalari D)**. Cioè: il layout
per viewpoint, che la serie `R-LAY` si propone di progettare, **è già scritto**, con la chiave che
`R-LAY-6` sceglie (l'id del viewpoint) e la sede che una delle tre candidate propone (dizionario su
`DViewPoint`).

**L'interruttore.** Il gate è `storeSize`, booleano su view e su viewpoint
(`view.tsx:287`, `:1402`), etichettato `__info_of__storeSize` (`view.tsx:1403`) **«bind sizes to
view»**, e vale `false` di default (`joiner/classes.ts:1118`, `thiss.storeSize = false`).

**Ed è raggiungibile a schermo.** Catena tracciata a ritroso fino a una superficie viva:

```
Info.tsx:1349            <ViewData … />                 (pannello Properties, superficie viva)
  → ViewData.tsx:177     <GenericNodeData viewID={view.id} readonly={readOnly} />
    → GenericNodeData.tsx:13  import NodeData from "./NodeData"
      → NodeData.tsx:39-40    checked={!!view?.storeSize}  onChange={val => setField('storeSize', val)}
```

Questa non è la trappola di `NestedView`: `Info.tsx` è la superficie che `R-LAY-12` ha misurato viva,
e `ViewData` ha cinque consumatori vivi (misurato nel fronte `R-DEAD`).

### 2.3 Il fatto che rovescia una premessa di R-LAY-9

**Editor-v2 non usa quella macchina, per progetto esplicito.** [TRACCIATO]

`GraphDataElements.tsx:1398-1401`, commento verbatim nel codice:

```
// Direct getter/setter overrides for x, y, w, h.
// The inherited LGraphElement.get_x() goes through get_size() → view.getSize()
// which doesn't work in editor-v2 (ReactFlow). These overrides read/write
// directly from the D-object data, bypassing the view layer.
```

Sono gli override su `LVoidVertex` (classe che apre a `GraphDataElements.tsx:1356`), righe
1403-1425: `get_x` è `return context.data.x`, `set_x` è un `SetFieldAction` diretto. Il confronto:

| | Renderer classico (`LGraphElement`, 443-559) | editor-v2 (`LVoidVertex`, 1403-1425 + `jjomTransformers`) |
|---|---|---|
| lettura di `x` | `get_x` → `get_size` → `view.getSize(id)` → **dizionario per view/viewpoint**, poi fallback | `raw.x` diretto (`jjomTransformers.ts:173-174, 219-220, 241-242`) |
| scrittura di `x` | `set_x` → `set_size` → `view.updateSize(...)` **prima**, scalari D solo se quella torna `false` | `SetFieldAction` diretto su `'x'` (`canvasToJjom.ts:46-47`) |
| taglia | idem, via `size` | `manualSizeOf(raw)` su `raw.isResized/w/h` (`jjomTransformers.ts:50-57`) |

**Quindi: il renderer che ha già il layout per viewpoint è quello classico; editor-v2, che
`R-LAY-9` elegge a perimetro perché «attivazione e resa coincidono», è l'unico dei due che
quell'asse lo scavalca.** R-LAY-9 tratta il classico come il caso scomodo da governare. Misurato, è
il classico ad avere già la macchina, e editor-v2 a non averla.

Non è una raccomandazione — è il finding che il prompt chiede di dichiarare come tale. Che cosa
farne (accendere `storeSize` per editor-v2, oppure portare l'asse sui vertici e lasciare due
meccanismi, oppure unificare) è decisione d'architettura, fuori perimetro di questa fase.

---

## 3. D3 — I lettori

Censimento. [TRACCIATO]

| Lettore | Path:riga | Legge |
|---|---|---|
| `LGraphElement.get_x/get_y/get_w/get_h` | `GraphDataElements.tsx:445,447,450,452` | derivato: `get_size` |
| `LGraphElement.get_size` | `GraphDataElements.tsx:497`, con `view.getSize` a `:559` | **dizionario della view**, poi fallback |
| `LVoidVertex.get_x/get_y/get_w/get_h` | `GraphDataElements.tsx:1403,1409,1415,1421` | **D layer grezzo** (`context.data.x`) |
| `jjomTransformers` posizione | `jjomTransformers.ts:173-174, 219-220, 241-242` → `position: {x, y}` (183, 225) | **D layer grezzo** (`raw.x`, `raw.y`) |
| `jjomTransformers.manualSizeOf` | `jjomTransformers.ts:50-57` | **D layer grezzo**, gate su `raw.isResized` |
| `useContentDrivenSize` | `useContentSize.ts:101` | `idlookup[vertexId].isResized` (solo il flag), poi **sessione** |
| `LVertex.get_startEndPoint` | `GraphDataElements.tsx:1015` | derivato: `get_size` |

**Il fatto strutturale**: due stack di accessori paralleli sugli stessi quattro campi, uno che passa
dalla view e uno che la scavalca. Un lettore che non sa da quale stack proviene il numero che ha in
mano non può sapere se sta guardando un valore per-viewpoint o condiviso.

---

## 4. D4 — Gli scrittori

Censimento completo, che il prompt esige **prima** della domanda sui percorsi fuori censimento.
[MISURATO per l'enumerazione, TRACCIATO per la semantica]

### 4.1 Gli scrittori diretti sul D layer

```
command grep -rnE --include="*.ts" --include="*.tsx" "SetFieldAction\.new\([^,]+, *'(x|y|w|h|isResized)'" src
```

exit 0, 13 righe, tutte in due file:

| Sito | Campi |
|---|---|
| `MetamodelTab.tsx:138-139` | `x`, `y` — drop nel renderer classico |
| `canvasToJjom.ts:46-47` (`syncPositionToJjom`) | `x`, `y` |
| `canvasToJjom.ts:59-60` (`syncPositionBatchToJjom`) | `x`, `y` |
| `canvasToJjom.ts:78-80` (`syncSizeToJjom`) | `w`, `h`, `isResized`←true |
| `canvasToJjom.ts:92` (`syncSizeResetToJjom`) | `isResized`←false |
| `canvasToJjom.ts:105-107` (`syncSizeBatchToJjom`) | `w`, `h`, `isResized`←true |

### 4.2 I chiamanti, e `handleAutoLayout`

Il prompt impone `handleAutoLayout` come punto di partenza e avverte di fidarsi del nome, non del
numero. **Confermato**: la dichiarazione è a `EditorV2.tsx:3249`, non `:3262` — `:3262` è la riga
della sua chiamata a `syncPositionBatchToJjom`.

```
syncPositionToJjom       ← EditorV2.tsx:3600, :3617
syncPositionBatchToJjom  ← EditorV2.tsx:3262 (handleAutoLayout), :3590
syncSizeToJjom           ← EditorV2.tsx:3632
syncSizeResetToJjom      ← EditorV2.tsx:2341
syncSizeBatchToJjom      ← EditorV2.tsx:1004
```

**`handleAutoLayout` non è uno scrittore fuori censimento**: calcola con ELK, applica in sessione con
`setNodes`, e persiste passando dal censito `syncPositionBatchToJjom`. La preoccupazione del prompt
su questo punto è risolta in negativo.

### 4.3 Sì, esiste un percorso di scrittura fuori dai censiti

È la risposta alla domanda che il prompt pone e dichiara non rispondibile senza il censimento.
[TRACCIATO]

**I setter proxy dell'L-layer.** `GraphDataElements.tsx:446-461`:

```typescript
set_x(val, context) { return this.set_size({x:val}, context); }
set_y(val, context) { return this.set_size({y:val}, context); }
set_w(val, context) { return this.set_size({w:val}, context); }
set_h(val, context) { return this.set_size({h:val}, context); }
set_position(val, c) { ... }
```

e il funnel `set_size` (`:668-685`), che ha una proprietà che nessuno degli scrittori censiti ha:

```typescript
TRANSACTION((isAutosize?'autosize ': 'resize ')+this.get_name(c), ()=>{
    if (view.updateSize(c.data.id, size)) return true;      // ← esce qui se la view assorbe
    if (size.x !== c.data.x && size.x !== undefined) SetFieldAction.new(c.data.id, "x", size.x, ...);
    ...
```

**Una scrittura attraverso il proxy può non raggiungere mai gli scalari del D layer**: se
`view.updateSize` torna `true` (cioè se `storeSize` è acceso su view o viewpoint) il valore finisce
nel dizionario della view e la riga `SetFieldAction.new(..., "x", ...)` non viene eseguita.

Il proxy è raggiungibile da chiunque abbia un `LVertex`: JjScript, le view utente in `jsxString`, il
renderer classico. È lo stesso funnel che oggi implementa il layout per viewpoint (§2.2). Per il
fronte è la notizia buona e quella cattiva insieme: **c'è un punto solo da insegnare alla chiave**,
ma i sei siti censiti al §4.1 lo aggirano.

### 4.4 Nota su `syncIREdgeLayoutToJjom`

Il prompt chiede se la distinzione regga. **Regge**: `canvasToJjom.ts:122` scrive `irEdgeLayout`,
che per dichiarazione di campo (`GraphDataElements.tsx`, su `DVertex`) è *«Persisted IR
object-as-edge layout overrides (side pins + Manhattan waypoints), carried by the hidden
edge-object's vertex»*. Non tocca `x/y/w/h` di un nodo. Vedi però §7: il fatto che viaggi sullo
stesso `DVertex` è esattamente ciò che rende osservabile l'asimmetria di D6.

---

## 5. D5 — La metà persistita della taglia

**`R-LAY-4` regge, e la verifica non è la citazione del commento.** [MISURATO]

Il report del 22 (§A.3.3) cita il commento di `useContentSize.ts:80-93` come prova. Un commento è
documentazione. La verifica indipendente è il **censimento degli scrittori del §4.2**:
`useContentSize.ts` **non compare** fra i chiamanti di `syncSizeToJjom`, `syncSizeBatchToJjom` o
`syncSizeResetToJjom`. I suoi due riferimenti a quei nomi (`:85`, `:92`) sono dentro il commento.
La taglia derivata non raggiunge il D layer perché **non chiama nessuno degli scrittori**, non
perché un commento lo dica.

Il gate: `useContentSize.ts:103`, `const active = hasSizeSupplement(desc) && !isResized;`.

Il filtro di persistenza: `EditorV2.tsx:3486`, `(c) => c.type === 'dimensions' && (c as any).resizing !== undefined`,
e `EditorV2.tsx:3661`, `if (c.resizing !== undefined) return true; // user resize`. Il report del 22
citava `:3485-3487`; a `d916a04f9` la riga è `:3486`, con il commento a `:3483-3484`.

---

## 6. D6 — Gli edge

### 6.1 `Eroute` non esiste nel codice

```
command grep -rni --include="*.ts" --include="*.tsx" "eroute" src   → 2 righe, entrambe "rerouted"/"reroute"
                                                                      (useAutoAnchor.ts:312, Geom.ts:618)
command grep -rni --include="*.ts" --include="*.tsx" "irEdgeLayout" src → 30 righe   (controllo positivo)
```

Il controllo positivo ha segnale; il soggetto non c'è. **`E-route` è un id di serie a registro**, non
un campo persistito: compare in `docs/decisions.md` come titolo di sezione («Edge IR — arco
espressività … ed E-route»). La domanda del prompt («qual è la natura di `Eroute`») ha come risposta
misurata: non è una natura di dato, è un nome di arco decisionale. Questa è una delle domande che
avrebbero potuto poggiare su §8; non poggiandoci nessuna decisione, si chiude qui.

### 6.2 Il layout persistito sugli edge, e l'asimmetria

Sugli edge il layout persistito è `irEdgeLayout` (side pins + waypoints) e `irCollapsed`, entrambi
campi **di `DVertex`** — quello del vertice-oggetto nascosto che porta l'edge IR. `R-LAY-3` li lascia
**condivisi fra viewpoint**; `R-LAY-1` rende `x/y` **per viewpoint**.

**L'asimmetria produce uno stato incoerente osservabile, e la sua forma è precisa**: dopo il fronte,
lo stesso `DVertex` porterebbe due campi con due contratti di chiave diversi — `x/y` risolti per
viewpoint, `irEdgeLayout` no. Un waypoint è un offset su un segmento i cui estremi sono posizioni di
nodo: se le posizioni cambiano con il viewpoint e l'offset no, **lo stesso waypoint cade in un punto
diverso in ogni viewpoint**. [TRACCIATO: dedotto dalla forma dei campi, `waypoints: {segmentIndex,
offset}[]`, e dalla loro coabitazione su `DVertex`. **Non riprodotto a schermo**: è il limite
principale di questa risposta.]

---

## 7. D7 — Versione e migrazione

[MISURATO per i nomi, TRACCIATO per il meccanismo]

`highestVersion` non è una costante: `VersionFixer.tsx:34` la dichiara `0` e `:105` la calcola come
`Math.max` sui **nomi dei metodi** adapter. Gli ultimi sei:

```
2.222 -> 2.223   (:919)
2.223 -> 2.224   (:957)
2.224 -> 2.225   (:985)
2.225 -> 2.226   (:998)
2.226 -> 2.227   (:1056)
2.227 -> 2.228   (:1188)
```

**Versione corrente: `2.228`**, l'ultimo adapter presente. Coerente con l'avvertenza del prompt:
`2.228` è in corso e non ancora spedita (`R-IRN-19`, `R-IRN-20`), quindi **non propongo un numero**.

**Forma della migrazione**, descritta e non proposta: un adapter `2.22x -> 2.22x+1` che itera
`idlookup`, e per ogni entità con `className` in `DVertex`/`DVoidVertex` trasforma i quattro scalari
nella forma indicizzata, usando come chiave iniziale la sentinella di D10.a (§10). Il precedente
strutturale più vicino è `2.227 -> 2.228` (`:1188`), che normalizza un campo su tutti i progetti. La
migrazione è **a senso unico**: nessun adapter inverso riporta un dizionario a scalare, quindi il
downgrade di un progetto migrato non è previsto.

---

## 8. D8 — Il costo in stato, misurato su progetti reali

[MISURATO — sonda eseguita in scratchpad su dump reali; il repo non è stato toccato]

Il prompt chiede di non stimare e, se manca un progetto, di fermarsi su questa sola domanda. **Un
progetto reale c'è**: `frontend/src/examples/` contiene dump `DState` serializzati completi. Sonda
Python, parse JSON, conteggio per `className`:

| | `statechartplus.ts` | `conflictsimulation.ts` |
|---|---|---|
| bytes di stato serializzato | 559 496 | 345 867 |
| entità in `idlookup` | 349 | 223 |
| `DVertex` + `DGraph` | 57 | 19 |
| `DViewPoint` | 3 (**esclusivi: 0**) | 2 (**esclusivi: 0**) |
| `DViewElement` | 22 | 23 |
| entità con `storeSize = true` | **0** | **0** |
| bytes di `x/y/w/h/isResized` | 5 142 | 1 693 |
| **quota del layout sullo stato** | **0,92 %** | **0,49 %** |

**Il fattore moltiplicativo.** Indicizzare per viewpoint esclusivo moltiplica quella quota per il
numero di viewpoint esclusivi che effettivamente portano un record. Su questi due progetti il layout
è **sotto l'1 %** dello stato persistito: anche a dieci viewpoint esclusivi si resta sotto il 10 %,
e il termine dominante della persistenza resta altrove (`jsxString` delle view e i registri). Il
costo in stato **non è il vincolo** che decide la sede.

**Tre limiti da dichiarare, e sono seri:**

1. **I dump sono d'epoca** (11 novembre 2025) e **non hanno campo `version`**: precedono il
   versionamento corrente. Sono una misura della *forma* e della *proporzione*, non dello stato di un
   progetto moderno.
2. **Hanno zero viewpoint esclusivi.** Il moltiplicatore reale — quanti viewpoint esclusivi ha un
   progetto vero — **non è misurabile da questi dati**. La quota per-viewpoint è misurata; il numero
   di viewpoint per cui moltiplicarla no.
3. `storeSize = true` non compare mai: la macchina del §2.2 è implementata e **in questi progetti non
   è mai stata accesa**. Non ho potuto misurare il costo reale della sede «dizionario sulla view»,
   perché nessun campione la esercita.

Non ho accesso ai progetti in `localStorage` di un browser, che è dove vivono quelli veri. Se il
moltiplicatore reale conta per la decisione, **quella misura resta da fare e non è surrogabile da
questi dump**.

---

## 9. D10.a — La sentinella

[MISURATO]

### 9.1 Che valori assume oggi il campo

`joiner/classes.ts:2899` e `:2924`: `activeViewpoint: Pointer<DViewPoint, 0, 1> = null`. Dopo la
slice 2 di `2.228` il vuoto è `null` — misurato **com'è ora**, come il riallineamento impone.

### 9.2 Una sentinella da riusare esiste

`common/Defaults.ts:43`: `static Pointer_ViewPointDefault: Pointer<DViewPoint> = 'Pointer_ViewPointDefault'`,
e `Defaults.ts:27` la mette in `Defaults.viewpoints`. È già usata come marcatore del caso «sintassi
astratta / default» in due letture vive: `lastViewpoint.ts:147` e `view.tsx:374`, entrambe nella
forma `activeVP.id !== Defaults.Pointer_ViewPointDefault`.

**Non serve inventare una sentinella**: il caso «sintassi astratta» ha già un id di sistema, che è
una stringa e quindi una chiave di dizionario valida — a differenza di `null`, che chiave non è. La
domanda del prompt («esiste già una sentinella da riusare?») ha risposta affermativa e misurata.

### 9.3 La collisione c'è, ed è di grafia

Il prompt chiede di cercare la collisione. Cercata, e **trovata**, in una forma che non è quella
attesa: non una sentinella che collide con un id reale, ma **due grafie della stessa sentinella**.

```
codice:  Pointer_ViewPointDefault → 12 file      Pointer_DefaultViewPoint → 0 righe
```

Il codice conosce **solo** `Pointer_ViewPointDefault`. Ma i dump reali (occorrenze contate con
`grep -o`, perché i dump sono su una riga sola e `grep -c` conterebbe 1):

| dump | `Pointer_ViewPointDefault` | `Pointer_DefaultViewPoint` |
|---|---|---|
| `statechartplus` | 43 | **3** |
| `conflictsimulation` | 0 | **20** |
| `second` | 0 | **21** |
| `sequence` | 0 | **21** |
| `shapes` | 37 | 0 |

**Tre progetti su cinque portano un id di viewpoint di default che il codice corrente non match­a
mai**, e uno li porta entrambi. E non c'è migrazione:

```
command grep -n "Pointer_DefaultViewPoint" src/redux/VersionFixer.tsx   → nessuna riga
controllo positivo: "Pointer_ViewPointDefault" in VersionFixer.tsx      → 1
```

**Perché conta per il fronte**: se la chiave del layout è la sentinella, un progetto il cui viewpoint
di default è serializzato come `Pointer_DefaultViewPoint` non viene riconosciuto come «il default», e
il suo record finisce sotto una chiave che nessun lettore interrogherà. È esattamente il «difetto
silenzioso» che D10.a chiede di cercare, e non richiede di inventare nulla per manifestarsi: basta
aprire uno di quei tre progetti.

**Limite dichiarato**: i dump sono d'epoca (§8), quindi questa potrebbe essere una divergenza storica
già superata nei progetti vivi. **Non l'ho potuto verificare**, e la verifica è a un `grep` di
distanza da chi abbia in mano un progetto salvato di recente.

---

## 10. D10.b — La sopravvivenza del record

**Il record sopravvive per costruzione. `R-LAY-5` è gratis.** [TRACCIATO]

Il percorso completo, come il prompt lo chiede:

1. **Chi decide che l'elemento non rende.** `irResolveCore.getIRIndex` (`irResolveCore.ts:134-146`)
   legge `state.viewpoint` e costruisce un indice per metaclasse. È una funzione di sola lettura che
   produce una struttura in memoria: non emette azioni, non tocca `idlookup`.
2. **Chi cancella un record.** `syncDeleteVertex` è l'unico distruttore, e i suoi chiamanti sono tre,
   tutti gesti espliciti di cancellazione: `EditorV2.tsx:2248`, `EditorV2.tsx:2283`,
   `useClassRemoval.ts:268`. **Nessuno è agganciato al filtro di resa.**
3. **Chi azzera i campi.** Nessuno. Il censimento completo degli scrittori (§4.1) contiene sei siti,
   e ognuno scrive un valore reale: non esiste un percorso che riporti `x/y/w/h` a zero o a
   `undefined` fuori dalla cancellazione dell'intero vertice. Questa è evidenza dal censimento, più
   forte di un `grep` negativo.

Un elemento che smette di rendere semplicemente non riceve un nodo React Flow; il suo `DVertex` e i
suoi quattro scalari restano in `idlookup`. Al ritorno nel viewpoint, il nodo viene ricostruito da
quegli stessi campi (`jjomTransformers.ts:173-174`).

**Conseguenza per la ratifica**: `R-LAY-5` non descrive un comportamento da difendere con un test,
descrive lo stato di fatto. Diventerà una riga da difendere **solo se** la sede scelta introducesse
una potatura dei record per viewpoint non più attivi — cosa che oggi non esiste e che nessuna delle
tre candidate richiede.

---

## 11. Confronto punto per punto con il report del 22 (R-E/E-1)

Letto `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md` (1144 righe). Nessuna sua riga
riscritta.

| Sezione del 22 | Rapporto con questo report |
|---|---|
| §3 (D0), §3.1-3.5 — R-2 e la decisione del 19/7 | Non toccata. Questo report non rimette in discussione D0. |
| §A.3.3 — «perché la taglia diverge e la posizione no» | **Confermata, e la prova è cambiata di grado**: il 22 citava il commento di `useContentSize`; qui la conferma viene dal censimento degli scrittori (§5), che è evidenza indipendente dal commento. |
| §A.3.1-A.3.2 — angolo, anti-collisione | Non rimisurate: fuori dalle domande D1..D8/D10. |
| §A.4.2 — «convivono, nessuno sovrascrive l'altro» | Coerente con §10: nessun percorso di cancellazione legato alla resa. |
| §B.4, §B.6 — `NestedView` come writer | **Superate** dal riallineamento e da `R-LAY-12`: codice morto, non contato fra le superfici vive. Nessuna risposta qui sopra vi passa. |
| §5 — «cosa NON è stato accertato» | Questo report chiude D1..D8 e D10; restano aperti i punti del §13. |
| **Assente nel report del 22** | Il dizionario `size` per view/viewpoint e il gate `storeSize` (§2.2). È il finding nuovo di questa sessione: il report del 22 non lo nomina. |

---

## 12. Ciò che NON è stato accertato

Elencato perché il prompt lo esige e perché un report che non lo fa mente per omissione.

1. **Il moltiplicatore reale di D8.** Misurata la quota del layout (<1 %), non il numero di viewpoint
   esclusivi di un progetto vero: i dump disponibili ne hanno zero. Serve un progetto da
   `localStorage`.
2. **Nulla è stato eseguito a runtime.** Tutte le risposte semantiche sono [TRACCIATO]: catene di
   codice lette, non eseguite. In particolare non ho osservato una scrittura passare da
   `view.updateSize` con `storeSize` acceso.
3. **L'asimmetria di D6 non è stata riprodotta a schermo** (§6.2): la sua forma è dedotta dai campi.
4. **La collisione di grafia (§9.3) non è verificata sui progetti vivi**, solo su dump d'epoca.
5. **`storeSize` acceso non è mai stato osservato**, né nei dump né a schermo: so che l'interruttore è
   raggiungibile, non che qualcuno l'abbia mai usato.
6. **Non ho misurato il renderer classico all'opera.** L'affermazione «il classico ha già il layout
   per viewpoint» è tracciata sul codice degli accessori, non osservata.

---

## 13. Hard stop

Fase 1 chiusa. Nessuna sede scelta, nessuno schema proposto, nessun numero di versione suggerito,
nessuna riga di codice toccata — i tre divieti del prompt sono rispettati.

I due findings che cambiano il tavolo, e che vanno discussi prima di qualunque scelta di sede:

1. **L'asse per viewpoint esiste già** (§2.2), completo su lettura e scrittura, con la chiave che
   `R-LAY-6` ha scelto, e un interruttore raggiungibile a schermo — spento di default e mai acceso in
   nessun campione.
2. **È il renderer classico ad averlo, non editor-v2** (§2.3), che `R-LAY-9` elegge a perimetro. La
   premessa «il classico è il caso scomodo da governare» è rovesciata dalla misura.

L'analisi avviene in chat, a partire da questo report.

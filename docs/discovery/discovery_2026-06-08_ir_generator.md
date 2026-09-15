# Discovery — Generatore AI di viewpoint sintattici (IR ir-1.0)

**Data**: 2026-06-08
**Tipo**: discovery read-only (nessuna modifica al codice)
**Input**: sezione 9 del documento *"Schema formale dell'IR — Generazione AI di viewpoint sintattici (v1)"* (2026-06-08).
**Scopo**: verificare contro il codice reale i 5 punti che gàtano la **spec del generatore** (non lo schema). Distinguere assunti confermati da assunti contraddetti, con citazioni `file:line`.

> Tutte le citazioni sono state verificate. I quattro claim più carichi di conseguenze (formato `appliableToClasses`, pattern OCL `instanceof.id`, rendering ricorsivo GraphVertex, esistenza di `explicitApplicationPriority`/`isExclusiveView`) sono stati riletti direttamente nel sorgente, non solo riportati dagli agenti.

---

## 0. Sommario esecutivo — verdetti

| # | Punto sez. 9 | Verdetto | Impatto sullo schema/generatore |
|---|---|---|---|
| 1 | Formato di `appliableToClasses` (ClassRef) | **Schema ERRATO** | Non è un qualified name (`"UML::Class"`). È un `cname` jjodel (`'DObject'`, `'DModel'`, `'DClass'`...). Per viewpoint M1 è quasi sempre `['DObject']` + discriminazione metaclasse nel predicato. |
| 2 | Capacità di `EdgeOverlay.tsx` | **Schema parz. confermato** | Esistono **3 renderer di edge** con capacità diverse. L'edge UML completo (terminazioni + routing + 3 label) **esiste già** ma solo nel path classico `DV.tsx`/`palette`, non in `EdgeOverlay`. Flow-v2 non legge `view.*` per gli edge. |
| 3 | GraphVertex e modello GraphElement | **Schema ERRATO (premessa sez. 7)** | Il rendering ricorsivo del contenimento **esiste già oggi** nel classic editor. Manca però un enum di layout-mode (free/vertical/horizontal/grid). |
| 4 | Tipi `DViewElement`, `priority`, campo `ir` | **Schema ridondante** | `priority` ed `exclusive` **già esistono** (`explicitApplicationPriority`, `isExclusiveView`). `ir?` è additivo a costo ~nullo (serializzazione generica). |
| 5 | Target di abbassamento del predicato | **RISOLTO** | Il runtime valuta **OCL** (`oclCondition` via `@stekoe/ocl.js`) e **JS arbitrario** (`jsCondition` via `new Function`). JjEL **non** è cablato. Target consigliato: OCL, con JS come escape. |

**Tre conseguenze strutturali per lo schema** (dettaglio in §6):
1. Il selettore "M2 → classe" dello schema (`appliesToClasses`) non corrisponde alla realtà: la metaclasse utente si lega via predicato `self.instanceof.id`, non via `appliableToClasses`. La tripletta `(kind, appliesToClasses, predicate)` va rimappata.
2. La grammatica chiusa di `Predicate` abbassa naturalmente verso **OCL**, non verso il dialetto vincolato del template (che riguarda solo `jsxString`).
3. Il piano "graphVertex piatto in v1 + placeholder v1.1" della sez. 7 è basato su una premessa falsa: il rendering annidato esiste già.

---

## 1. Formato runtime di `appliableToClasses` (ClassRef)

### Tipo dichiarato
- D-layer: `view/viewElement/view.tsx:215` → `appliableToClasses!: string[]; // class names: DModel, DPackage, DAttribute...`
- L-layer: `view/viewElement/view.tsx:892` (passthrough, nessuna trasformazione D→L; getter a `:1606` ritorna `c.data.appliableToClasses || []`).
- Costruttore: `joiner/classes.ts:1079` (`appliableToClasses: string[] = []`).

### Valore concreto — `cname` jjodel, non qualified name
I valori sono i `cname` delle classi del modello dati jjodel, enumerati in `EModelElements` (`joiner/classes.ts:3933–3951`):
```
'DModel' | 'DPackage' | 'DClass' | 'DEnumerator' | 'DEnumLiteral' |
'DOperation' | 'DParameter' | 'DAttribute' | 'DReference' |
'DStructuralFeature' | 'DObject' | 'DValue'
```
Assegnati come `cname` in `model/logicWrapper/LModelElement.tsx:7730–7772`. Esempi in `redux/defaults/views.ts` (`['DModel']`, `['DPackage']`, `['DClass']`, `['DObject']`, `['DValue']`…).

### Il punto che ribalta lo schema: livello M1 vs M2
**`appliableToClasses` NON porta la metaclasse utente.** Porta il livello della piramide jjodel. La metaclasse utente (es. "State", "Entity") si seleziona nel **predicato**.

Prova diretta dalla viewpoint reale `StateMachine` (`examples/StateMachine/views/index.ts:19–64`) — un viewpoint sintattico generato da un metamodello, cioè esattamente il nostro caso d'uso:
```ts
// view del modello:
d.appliableToClasses = ['DModel'];
d.oclCondition = 'context DModel inv: self.isMetamodel = false';

// view di OGNI nodo (state, Command, Event, Transition):
d.appliableToClasses = ['DObject'];
d.oclCondition = `context DObject inv: self.instanceof.id = '${ptr+name}'`;
```
Tutti i nodi M1 sono `DObject`; la metaclasse si discrimina con `self.instanceof.id = '<pointer della DClass>'`.

### Selettore di match
`redux/selectors/selectors.ts:356–373` risolve ogni stringa via `RuntimeAccessibleClass.get(cname)` e confronta col `cname` dell'elemento (`EXACT_MATCH` / `INHERITANCE_MATCH` se sottoclasse / `IMPLICIT_MATCH` se array vuoto = wildcard). Stringhe non-`cname` ritornano `undefined` → nessun match + warning.

Path secondario (solo edge L2): `components/edgeOverlay/EdgeOverlay.tsx:497–515` è più permissivo (accetta anche id-pointer e `{id,name}`); `InfoData.tsx:144` scrive lì `classifier.id`. Questo è l'unico path che accetta pointer; **il selettore principale no**.

### Raccomandazione ClassRef
- `type ClassRef = string`, ma con **due semantiche da distinguere nello schema**:
  - **Livello jjodel** (cosa scrivere in `appliableToClasses`): quasi sempre `'DObject'` per viewpoint su modelli M1; `'DModel'`/`'DPackage'`/`'DClass'` per view a livello metamodello.
  - **Metaclasse utente** (cosa il viewpoint vuole davvero distinguere): è il **pointer/id della DClass** (es. `Pointer_state`), che il generatore abbassa in una clausola OCL `self.instanceof.id = '<pointer>'`.
- → Il campo IR `appliesToClasses` dovrebbe portare il **pointer/id della metaclasse utente**, e il generatore lo abbassa in: `DViewElement.appliableToClasses = ['DObject']` **+** clausola `instanceof.id` in `oclCondition`. Vedi §6.1.

---

## 2. Capacità di rendering degli edge — TRE renderer

Esistono tre pipeline di rendering edge con capacità molto diverse. **Questo è il fattore decisivo per la spec edge del generatore.**

### 2a. Classico `DV.tsx` (`palette` + `bendingMode`) — UML completo
Renderer pieno. Legge `view.palette` (con `head`/`tail` = path SVG arbitrari, `stroke-color`, `stroke-width`, `dashing`, `fill`), `view.bendingMode`, `view.edgeHeadSize`/`edgeTailSize`, `view.labels`/`longestLabel`.
- **Terminazioni**: libreria `EdgeHead` (`common/DV.tsx:1121–1196`): open arrow, hollow triangle (extension), hollow/filled diamond (aggregation/composition), cardinalità `[0]`/`[1]`/`[0..*]`/`[0..1]`/`[1..*]`, "nessuna" (path vuoto), **path SVG custom**. Seconda libreria UI in `components/editors/markerPresets.ts` + `EdgeMarkerEditorModal.tsx`.
- **Linea**: colore (hex qualsiasi), width (px qualsiasi), `dashing` (qualsiasi `stroke-dasharray`). CSS in `DV.tsx:788–800`.
- **Routing**: enum `EdgeBendingMode` (`joiner/types.ts:125–136`): `Line`, `Manhattan` (orthogonal, con node-avoidance in `edges/routing/classic/points.ts`), `Bezier_quadratic/cubic/QT/CS`, `Elliptical_arc`. Default edge = `Manhattan` (`DV.tsx:1057`).
- **Label**: **3 posizioni** — start (`label-start`, `DV.tsx:885`), end (`label-end`, `:892`), per-segmento/centro (`:900`). Posizionamento settoriale via `usageDeclarations`.

### 2b. `EdgeOverlay.tsx` (L2 classic, overlay SVG più recente) — ridotto
Legge i campi "schema L2": `isEdge`, `edgeSource`, `edgeTarget`, `edgeRouting`, `edgeStrokeColor`, `edgeStrokeWidth`, `edgeStrokeStyle`, `edgeLabel` (`view/viewElement/view.tsx:271–286`).
- **Terminazioni**: **NESSUNA** (no marker).
- **Linea**: colore limitato a **6 token semantici** (`default|accent|success|warning|danger|muted`, `EdgeOverlay.tsx:67–74`), width clampata `[0.5,10]`, stile `solid|dashed|dotted`.
- **Routing**: `manhattan-rounded` (default) | `straight` | `bezier`.
- **Label**: **una sola, al centro** (`edgeLabel`, espressione JjEL valutata a render, `EdgeOverlay.tsx:251–255,412–424`). No label start/end.

### 2c. Flow v2 (`components/editor-v2/edges/UnifiedEdge.tsx`) — nessuna customizzazione
- Marker SVG **hardcoded** (`UnifiedEdge.tsx:541–588`), Manhattan fisso, colori via classi CSS.
- **Non legge alcun campo `view.*` per gli edge.** Tipo/forma/colore derivano da dati M2 (`DReference.kind/name/lowerBound/upperBound`) o sono hardcoded.

### Tabella gap (capacità EdgeSpec vs realtà)
| Capacità EdgeSpec | DV.tsx (palette) | EdgeOverlay (L2) | Flow v2 |
|---|---|---|---|
| Terminazioni (open/closed/triangle/diamond) | ✅ + custom path | ❌ | ✅ ma hardcoded, non da view |
| Routing straight/orthogonal/bezier | ✅ tutti | ✅ tutti | ❌ solo Manhattan fisso |
| Stroke color | ✅ hex | ⚠️ 6 token | ❌ |
| Stroke width | ✅ | ✅ (0.5–10) | ❌ |
| Stroke dash (solid/dashed/dotted) | ✅ arbitrario | ✅ | ❌ |
| Label center | ✅ | ✅ (JjEL) | ✅ (`ref.name`) |
| Label source-end | ✅ | ❌ | ❌ |
| Label target-end | ✅ | ❌ | ⚠️ solo badge cardinalità |

### Conseguenza per il generatore
- L'affermazione dello schema ("terminazioni/routing/multi-label probabilmente non ancora nell'overlay") è **vera per `EdgeOverlay`**, ma **falsa per il path classico `DV.tsx`/`palette`**, che già supporta l'edge UML completo.
- → Per "edge UML completi" il generatore deve targettizzare il path **`palette` + `bendingMode` + `edgeHeadSize/TailSize` + `labels`** (DV.tsx), **non** i campi `edge*` di EdgeOverlay. EdgeSpec.terminations e le 3 label mappano su `palette.head`/`palette.tail` e sui 3 slot label di DV.tsx.
- **Da decidere in spec** (follow-up §8): quale dei due path classico è quello vivo nel prodotto attuale? Se il prodotto rende gli edge con EdgeOverlay, terminazioni e multi-label richiedono prima un upgrade del substrato (→ v1.1). Se rende con DV.tsx, sono disponibili subito.
- Se l'editor target è **flow-v2**, la customizzazione edge via IR **non è possibile oggi** (nessuna lettura `view.*`). Confermato l'avvertimento della sez. 9.2 dello schema.

---

## 3. Modello GraphElement e GraphVertex

Tutte le classi in `model/dataStructure/GraphDataElements.tsx`.

### Gerarchia (D-layer)
```
DPointerTargetable → DGraphElement (id, graph, model, subElements, father, x/y/w/h, view)
  ├── DGraph             (+ zoom, offset, grid, graphStyle)
  ├── DVoidVertex (+isResized,snap) → DEdgePoint, DVertex
  ├── DGraphVertex       (campi di DGraph E DVoidVertex/DVertex)
  └── DVoidEdge (+start,end,midPoints,anchors) → DEdge → DExtEdge, DRefEdge
```
- **Non esiste una classe `DField`**: "Field" è una *modalità di rendering* (`Vertex.tsx:556`, `Field` passa `isField=true`); il `mapStateToProps` cade su `DGraphElement` (`Vertex.tsx:475`).
- **"GraphVertex = Graph + Vertex" è reale**: `DGraphVertex` (`:1735`) eredita strutturalmente da entrambi; ereditarietà runtime doppia registrata (`:1827–1830`): `set_extend(DGraph, DGraphVertex)` **e** `set_extend(DVertex, DGraphVertex)`. L-layer via mixin `MixOnlyFuncs(LG, LV)` (`:1792`). `get_innerGraph` (`:412`) tratta `DGraphVertex` come `DGraph` (si comporta da contenitore).

### Categoria `appliableTo` (il discriminatore `kind`)
`view/viewElement/view.tsx:216` (D) e `:899` (L):
```
'Any' | 'Graph' | 'GraphVertex' | 'Vertex' | 'Edge' | 'EdgePoint' | 'Field'
```
Il setter (`:1576`) mappa su `forceNodeType`, consumato da `DefaultNode.tsx:132` per scegliere il componente. **7 categorie runtime; i 5 `kind` dell'IR ne usano 5** (mancano `Any` e `EdgePoint` — ok, l'IR è un sottoinsieme).

### Contenimento e rendering ricorsivo — ESISTE GIÀ (contraddice sez. 7)
- Storage: `DGraphElement.subElements` (`:91`, `Pointer<DGraphElement,0,'N',LGraphElement>`), inverso `father`.
- **Rendering ricorsivo presente oggi** nel template package (`common/DV.tsx:1331–1332` e `defaultPackage` `:1354`):
  ```jsx
  {data.children.map(c => <DefaultNode key={c.id} data={c} />)}
  ```
  `data.children` → `get_subElements`; ogni figlio rende via `<DefaultNode>` che riseleziona il componente giusto. Un `DPackage` rende le `DClass` contenute come nodi Vertex al suo interno. Il livello è gestito da `upperLevel`/`node.state.level` (≥1 = figli, 0 = summary).
- **Manca un enum di layout-mode** (`free|vertical|horizontal|grid`): il layout è puramente CSS (`package-children`) + coordinate assolute `x/y`. `LayoutSpec.mode` dell'IR **non ha un campo di backing** → va realizzato in SCSS generato, oppure degradato a "free/assoluto".

### Conseguenza
- Il piano sez. 7 "graphVertex piatto + placeholder 'rendering in v1.1'" rappresenterebbe una **regressione volontaria** rispetto al classic editor, non un suo riflesso fedele. Se si punta alla parità col classico, il rendering ricorsivo è in scope da v1 (ed è già disponibile come substrato).
- `LayoutSpec.mode` resta non supportato a livello dato: o lo si emette come SCSS, o lo si dichiara degradato.

---

## 4. Tipi `DViewElement`, priority, exclusive, campo `ir`

### Dichiarazioni e default
- Tipo D-layer completo: `view/viewElement/view.tsx:163–354`. L-layer: `:357–fine` (accessor `get_`/`set_` per ogni campo).
- Default di costruzione: `joiner/classes.ts` `Constructors.DViewElement(...)` `:1077–1238` (unico punto autoritativo).

### `priority` → ESISTE: `explicitApplicationPriority`
- Dichiarazione `view.tsx:224` (`number`). Default `undefined` (`classes.ts:1106`, auto-calcolato).
- Usato nello score finale: `selectors.ts:417–436` (`getFinalScore`), fallback euristico `(jsCondition.length||1)+(oclCondition.length||1)` quando `undefined`. Sort `classes.ts:4064–4088` (`mainViews.sort((a,b)=>b.score-a.score)`).
- → Il `priority?` dell'IR è un **duplicato**: abbassare su `explicitApplicationPriority`, non aggiungere un campo nuovo.

### `exclusive` → ESISTE: `isExclusiveView`
- Dichiarazione `view.tsx:193` (`boolean`). Default **`true`** (`classes.ts:1107`).
- Semantica: `true` = main view (una sola rende, la massima per score); `false` = decorativa/overlay (stackabile). Split in `classes.ts:4076`.
- → `exclusive?` dell'IR mappa diretto su `isExclusiveView`. **Attenzione al default**: nel runtime è `true`.

### Campo `ir?` — additivo a costo quasi nullo
- Serializzazione **generica**: `ProjectsApi.save()` (`api/persistance/projects.ts:94–116`) → `U.compressedState()` (`common/U.tsx:427–441`) fa `JSON.stringify` su tutto `state.idlookup`. **Nessun allowlist/denylist di campi.** `jsxString` è solo una `string` che viaggia con lo stringify. Un nuovo `ir?` viaggia allo stesso modo, automaticamente.
- Modifiche minime per aggiungere `ir?`:
  1. Dichiarazione D-layer in `view.tsx` (come gli altri opzionali, es. `constants?`).
  2. Dichiarazione L-layer + accessor passthrough se serve.
  3. (Opzionale) init in `Constructors.DViewElement`. Per un opzionale `undefined` va bene non inizializzarlo.
  4. **VersionFixer** solo se serve un backfill con valore non-`undefined` su progetti salvati (per `ir?` opzionale **non serve**). Riferimenti: migrazione `2.214 -> 2.215` (backfill `edgeRouting`).
- → Costo reale: **1–2 file**, nessuna registrazione di serializzazione.

---

## 5. Target di abbassamento del predicato — RISOLTO

### Due campi predicato indipendenti
- `oclCondition: string` (`view.tsx:218`) — **OCL** via `@stekoe/ocl.js`.
- `jsCondition: string` (`view.tsx:219`) — **JS arbitrario** via `new Function`.

Entrambi corrono dopo il gate metaclasse (`appliableToClasses`); se presenti, entrambi devono passare (lo score è un prodotto).

### Meccanismi di valutazione
- **OCL**: `selectors.ts:596` → `OCL.test(data, dview, node)` → `ocl/ocl.tsx:127–143` (`OclEngine.create()`, cache per-view, oggetto valutato = proxy L-layer). Formato: `context <DClass> inv: <expr su self.*>`.
- **JS**: compilato in `reducer/reducer.ts:950–977` (`new Function(paramStr, body)`), invocato in `selectors.ts:728` con `{data, node, view, constants}`. Ritorno: `true`/numero>0 = match (il numero diventa priorità); altrimenti mismatch. **JS pieno e moderno** (`?.`, `??`, `let`/`const`, arrow): il dialetto vincolato vale **solo** per `jsxString`, non per `jsCondition`.

### JjEL non è cablato
Zero import di JjEL in `redux/`, `view/`, `ocl/`. `PredicateEditor.tsx:54` ha una tab "JjEL" ma il write-back è un TODO no-op. **Emettere JjEL verrebbe silenziosamente scartato.**

### Esempi reali
- `oclCondition`: `context DObject inv: self.instanceof.id = 'Pointer_state'` (StateMachine), `context DModel inv: self.isMetamodel = false`, `context DObject inv: self.name = 'obj_1'`, `context DClass inv: true` (defaults).
- `jsCondition`: `return data?.instanceof?.isSingleton` (`defaults/views.ts:640`); filtro graph-layer in `store.tsx:368`.

### Target consigliato
- **Primario: `oclCondition`** (stringa OCL invariante). È il canale stabilito; tutti i predicati M1 esistenti lo usano. Forma: `context <DClassLivello> inv: <bool su self.*>`.
  - Discriminazione metaclasse: `self.instanceof.id = 'Pointer_<id>'`.
  - Accesso slot M1: `self.$<feature>.value`.
- **Escape: `jsCondition`** (corpo JS) per ciò che OCL non esprime.
- **Mapping della grammatica chiusa IR → OCL** (§6.2): `and/or/not` → `and/or/not`; `eq/neq/lt/...` → `= / <> / < ...`; `exists path` → `not self.<path>.oclIsUndefined()` (o `->notEmpty()` per collezioni); `empty path` → `->isEmpty()`; `isKind class` → `self.instanceof.id = '<pointer>'`; `PathExpr $f.value` → `self.$f.value`, `$f.values[n]` → `self.$f.values->at(n+1)` (1-based OCL, **da verificare** nel subset @stekoe).

---

## 6. Impatti sullo schema IR

> Lo schema persistito può restare invariato nella forma; questi sono aggiustamenti di **semantica e di mapping** che la spec del generatore deve recepire. Dove serve un cambio di campo, è segnalato.

### 6.1 Rivedere la tripletta dei selettori
La realtà jjodel ha **due assi**, non tre come nello schema:
- `kind` → `appliableTo` ✅ (invariato).
- **Livello jjodel** (`appliableToClasses`): per viewpoint M1 è `['DObject']` quasi sempre; `['DModel']` per la view-radice del modello. Il generatore lo deriva dal `kind` + dal fatto che si rende un modello M1.
- **Metaclasse utente + filtro M1** (`predicate`): TUTTO ciò che lo schema mette in `appliesToClasses` *e* in `predicate` confluisce nell'`oclCondition`. La metaclasse è una clausola `instanceof.id`; i filtri M1 (es. `isInitial`) sono clausole aggiuntive in AND.

Raccomandazione concreta: mantenere `appliesToClasses: ClassRef[]` nell'IR con **semantica "metaclasse utente"** (serializzata come pointer/id della DClass), e documentare che il generatore la **abbassa** in `appliableToClasses=['DObject']` + clausola OCL `instanceof.id`. Il multi-view per sottotipo (`isKind`) usa lo stesso meccanismo.

### 6.2 Predicate → OCL (non dialetto vincolato, non JjEL)
La sez. 7 dello schema lega la grammatica chiusa al "dialetto vincolato del template engine". **Correggere**: il dialetto vincolato riguarda `jsxString` (i template), non il predicato. Il predicato si abbassa in **OCL**. Aggiornare la sez. 9.5/§6 dello schema con il mapping di §5 qui sopra.

### 6.3 `priority` ed `exclusive`: riusare, non aggiungere
Mappare su `explicitApplicationPriority` e `isExclusiveView`. Rimuovere dalla tabella di mapping (sez. 6 dello schema) le note "campo esistente o nuovo": **esistono entrambi**. Nota: `isExclusiveView` default `true`.

### 6.4 GraphVertex: il rendering ricorsivo è disponibile
Riscrivere la sez. 7: il contenimento annidato **non** è un taglio v1.1 forzato — esiste già nel substrato. Resta aperto solo `LayoutSpec.mode` (nessun campo dato; va in SCSS o degradato). Il placeholder "contiene N elementi" diventa una scelta di prodotto, non un vincolo tecnico.

### 6.5 Edge: scegliere il substrato
EdgeSpec completo (terminazioni + routing + 3 label) mappa sul path `palette`/`bendingMode` di DV.tsx, non su EdgeOverlay. La spec del generatore deve dichiarare **quale path** emette e degradare di conseguenza (vedi §8, follow-up: quale renderer è vivo).

### 6.6 `ir?` come master persistito: nessun ostacolo
Confermato additivo, serializzazione generica. Procedere come da sez. 8 dello schema (campo opzionale + eventuale VersionFixer solo per backfill, non necessario).

---

## 7. Impatti sulla spec del generatore (sintesi operativa)

1. **Emissione `appliableToClasses`**: derivare dal `kind`/livello, non dalla metaclasse. Per nodi M1 → `['DObject']`.
2. **Emissione predicato**: comporre `oclCondition = context DObject inv: self.instanceof.id = '<pointer>' [and <clausole M1>]`. JS solo come escape.
3. **Lowering grammatica chiusa → OCL**: implementare il transpiler `Predicate → OCL` (mapping §5). Verificare il subset di `@stekoe/ocl.js` (collezioni, `->at`, `oclIsUndefined`).
4. **`priority`/`exclusive`**: scrivere `explicitApplicationPriority` e `isExclusiveView`.
5. **Edge**: targettizzare `palette`+`bendingMode`+`edgeHeadSize/TailSize`+label DV.tsx per UML completo; oppure `edge*` di EdgeOverlay con degrado dichiarato (no terminazioni, 1 label, 6 colori). Decisione in §8.
6. **GraphVertex**: emettere contenimento ricorsivo reale (supportato); `LayoutSpec.mode` → SCSS o degrado dichiarato.
7. **`jsxString`**: resta nel dialetto vincolato (no `?.`/`??`, ternari, `var`, solo componenti registrati) — invariato rispetto allo schema.

---

## 8. Follow-up / domande residue prima della spec

1. **Renderer edge vivo nel prodotto**: il classic editor attuale rende gli edge con `DV.tsx`/`palette` (UML completo) o con `EdgeOverlay` (ridotto)? Questa singola risposta determina se "edge UML completi" sono v1 o v1.1. *(Read-only: tracciare quale componente monta gli edge nel canvas classico attualmente in uso.)*
2. **Editor target della feature**: i viewpoint generati vengono renderizzati nel classic editor o nel flow-v2? Se flow-v2, gli edge `view.*` sono ignorati oggi → la customizzazione edge è bloccata a monte.
3. **Subset OCL di `@stekoe/ocl.js`**: confermare supporto di `->at(n)` (1-based?), `->isEmpty()`/`->notEmpty()`, `oclIsUndefined()`, navigazione `self.$feature.values`. Determina la completezza del transpiler `Predicate → OCL`.
4. **Serializzazione di ClassRef**: il pointer della DClass usato in `instanceof.id` ha forma `Pointer_<name>` (esempi StateMachine) o `DClass_<hash>` (path InfoData)? Fissare l'unica forma che il generatore emette.
5. **`LayoutSpec.mode`**: decidere se realizzarlo in SCSS generato (vertical/horizontal/grid via flexbox/grid CSS) o dichiararlo non supportato in v1.

---

## 9. File chiave (per la spec del generatore)

| Area | File:posizione |
|---|---|
| Tipi `DViewElement` (D/L) | `view/viewElement/view.tsx:163–354` (D), `:357–` (L); `appliableToClasses :215/:892`, `appliableTo :216/:899`, `oclCondition :218`, `jsCondition :219`, `explicitApplicationPriority :224`, `isExclusiveView :193`, campi edge `:244–286` |
| Default di costruzione | `joiner/classes.ts:1077–1238` (`Constructors.DViewElement`) |
| `cname` validi | `joiner/classes.ts:3933–3951` (`EModelElements`); assegnazioni `model/logicWrapper/LModelElement.tsx:7730–7772` |
| Selettore match | `redux/selectors/selectors.ts:356–373` (metaclasse), `:417–436` (score), `:596` (OCL), `:718–728` (JS) |
| Valutazione OCL | `ocl/ocl.tsx:127–143` (`OCL.test`/`filter`) |
| Compilazione JS | `redux/reducer/reducer.ts:950–977` |
| Viewpoint reale di riferimento | `examples/StateMachine/views/index.ts:19–64` |
| Default views | `redux/defaults/views.ts` |
| Edge classico (UML completo) | `common/DV.tsx:601–1066` (`edgeView`, `EdgeHead`), routing `edges/routing/classic/{markers,points,segments,labels}.ts`, enum `joiner/types.ts:125–136` |
| Edge overlay L2 (ridotto) | `components/edgeOverlay/EdgeOverlay.tsx` |
| Edge flow-v2 (no view.*) | `components/editor-v2/edges/UnifiedEdge.tsx` |
| GraphElement model | `model/dataStructure/GraphDataElements.tsx` (`DGraphVertex :1735–1830`, `subElements :91`, `get_innerGraph :412`) |
| Rendering ricorsivo package | `common/DV.tsx:1314–1358` |
| Selezione componente da `appliableTo` | `graph/defaultNode/DefaultNode.tsx:132–165`; fattori in `graph/vertex/Vertex.tsx` |
| Persistenza/serializzazione | `api/persistance/projects.ts:94–116`, `common/U.tsx:427–441` |
| VersionFixer (riferimento backfill) | `redux/VersionFixer.tsx` (`2.214 -> 2.215`) |

---

*Discovery read-only. Nessun file sorgente modificato. Prossimo passo suggerito: chiudere i 5 follow-up della §8 (read-only), poi scrivere la spec del generatore e/o aggiornare lo schema (sez. 6/7/9) coi correttivi della §6.*

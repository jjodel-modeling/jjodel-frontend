# PROMPT: Jjodel Editor V3 — Complete Redesign

> **Istruzioni:** Questo prompt e autocontenuto. Contiene TUTTO il contesto necessario per progettare un nuovo editor v3 per Jjodel. Leggilo interamente prima di iniziare. NON scrivere codice — produci un **design document dettagliato** con architettura, componenti, interfacce TypeScript, e piano di implementazione fase per fase.

---

## 1. CONTESTO DEL PROGETTO

**Jjodel** e un metamodeling tool open-source (React 18 + TypeScript strict + Redux + Vite + SCSS). Permette di:

- Creare **metamodelli** (M2): definizioni di strutture con classi, attributi, riferimenti, operazioni, enumeratori
- Creare **modelli** (M1): istanze conformi ai metamodelli — ogni oggetto e un'istanza di una classe M2
- Definire **viewpoint**: notazioni visuali custom tramite JSX (pattern IIFE) con CSS e event handlers
- Eseguire trasformazioni model-to-model (JjTL)

L'app e live su https://app.jjodel.io/

### Stato Attuale: Due Editor Coesistenti

**Editor V1 (Legacy):**
- ~11.500 LOC TS + ~15.900 LOC SCSS
- Rendering SVG custom con jQuery UI drag
- Supporta metamodelli, modelli E viewpoint completo
- Tech debt critico: monoliti (Info.tsx 1.243 righe, graphElement.tsx 1.582 righe), 50+ @ts-ignore, tight coupling, untestabile
- Il viewpoint/JSX funziona ma e intrecciato con il rendering grafico

**Editor V2 (React Flow):**
- ~29.300 LOC con architettura modulare
- Basato su `@xyflow/react`
- Supporta SOLO metamodelli (classi, enum, package, relazioni)
- 5 notazioni (UML, Simplified, Compact, Wireframe, ER), 9 color schemes, dark/light
- Sync bidirezionale JjOM<->Canvas funzionante
- Manhattan routing con A* obstacle avoidance
- Undo/redo, copy/paste, alignment tools
- **Manca completamente:** model editing, viewpoint/JSX

### Obiettivo V3

Creare un **nuovo editor unificato** che:
1. Gestisca sia metamodelli (M2) che modelli (M1) con la stessa architettura
2. Supporti il sistema viewpoint/JSX per notazioni custom
3. Mantenga le migliori innovazioni di V2 (React Flow, sync layer, routing)
4. Sia modulare, testabile, e estendibile
5. Riduca la complessita complessiva rispetto a V1+V2 combinati

---

## 2. DATA LAYER — Il modello dati che l'editor DEVE supportare

L'editor NON gestisce il data layer — interagisce con esso. Ecco le strutture chiave:

### 2.1 Gerarchia delle Classi D* (Data — serializzabili in Redux)

```
DPointerTargetable (base)
├── DModelElement (abstract)
│   ├── DNamedElement
│   │   ├── DModel          — root container (M2 o M1)
│   │   ├── DPackage        — container per classi
│   │   ├── DObject         — istanza M1 di una DClass
│   │   └── DValue          — valore di attributo/riferimento su un DObject
│   ├── DTypedElement
│   │   ├── DAttribute      — definizione attributo (in DClass)
│   │   ├── DReference      — definizione riferimento (in DClass)
│   │   ├── DOperation      — metodo di una classe
│   │   └── DParameter      — parametro di un'operazione
│   ├── DClassifier
│   │   ├── DClass          — classe nel metamodello
│   │   ├── DDataType       — tipo primitivo
│   │   └── DEnumerator     — definizione enum
│   └── DAnnotation
│
└── DGraphElement (layer di visualizzazione, albero separato)
    ├── DGraph              — container root per la visualizzazione
    ├── DVoidVertex
    │   ├── DVertex         — nodo rettangolare (rappresenta un DClass, DObject, etc.)
    │   └── DEdgePoint      — punto di bend su un edge
    ├── DGraphVertex        — graph annidato (graph + vertex)
    └── DVoidEdge
        ├── DEdge           — connessione con path SVG
        ├── DExtEdge        — ereditarieta
        └── DRefEdge        — riferimento
```

### 2.2 Layer di Visualizzazione — Proprieta Layout dei Nodi Grafici

Il layer grafico e SEPARATO dal modello dati. Ogni DModel ha un DGraph associato che contiene DVertex e DEdge per la visualizzazione. L'editor V3 DEVE leggere e scrivere queste proprieta.

**DGraphElement (base di tutti gli elementi grafici):**
```typescript
{
    id: Pointer<DGraphElement>;
    graph: Pointer<DGraph>;          // grafo parent
    model?: Pointer<DModelElement>;  // quale elemento del modello visualizza
    father: Pointer<DGraphElement>;  // parent container
    subElements: Pointer<DGraphElement>[]; // figli

    // === POSIZIONE E DIMENSIONI ===
    x: number;                       // posizione X (coordinate grafo)
    y: number;                       // posizione Y (coordinate grafo)
    w: number;                       // larghezza
    h: number;                       // altezza

    // === STACKING ===
    zIndex: number;                  // default 100. Piu alto = sopra gli altri

    // === ZOOM ===
    zoom: GraphPoint;                // fattore di scala {x, y}

    // === ANCORE (punti di connessione per edge) ===
    anchors: Dictionary<string, GraphPoint>; // ancore nominate, valori in % della dimensione nodo
    // Esempio: { "north": {x: 0.5, y: 0}, "south": {x: 0.5, y: 1}, "east": {x: 1, y: 0.5} }

    // === STATO VISIVO ===
    state: GObject;                  // dizionario CSS/styling dinamico (rotation, opacity, transforms, etc.)
    view: Pointer<DViewElement>;     // riferimento alla view che definisce aspetto/forma/ancore di default

    // === SELEZIONE ===
    isSelected: Dictionary<Pointer<DUser>, boolean>; // selezione per utente
    favoriteNode: boolean;           // nodo primario per elementi multi-rappresentazione

    // === CONNESSIONI ===
    edgesIn: Pointer<DEdge>[];       // archi entranti
    edgesOut: Pointer<DEdge>[];      // archi uscenti
}
```

**DGraph (container root):**
```typescript
{
    // ...eredita DGraphElement...
    offset: GraphSize;               // posizione di scroll/pan {x, y, w, h}
    zoom: GraphPoint;                // zoom del viewport
    graphStyle: string;              // 'v2-flow' per Editor v2, vuoto per classic
}
```

**DVertex (nodo rettangolare):**
```typescript
{
    // ...eredita DGraphElement (x, y, w, h, anchors, state, view, zIndex, zoom)...
    isResized: boolean;              // flag: e stato ridimensionato manualmente (vs auto-sized da view)
}
```

**DVoidEdge / DEdge (connessione):**
```typescript
{
    // ...eredita DGraphElement...
    start: Pointer<DGraphElement>;   // vertice sorgente
    end: Pointer<DGraphElement>;     // vertice destinazione

    // === PUNTI DI BEND ===
    midPoints: InitialVertexSize[];  // specifiche per generare DEdgePoint
    midnodes: Pointer<DEdgePoint>[]; // nodi di bend effettivi (sub-elementi)

    // === ANCORE SPECIFICHE PER ARCO ===
    anchorStart?: string | {x, y};   // ancora specifica al vertice sorgente (nome o offset)
    anchorEnd?: string | {x, y};     // ancora specifica al vertice destinazione

    // === LABEL ===
    longestLabel?: string;           // funzione che ritorna il testo label piu lungo
    labels?: string;                 // funzione che ritorna tutte le label

    // === TIPO DI ARCO ===
    isExtend: boolean;               // ereditarieta
    isReference: boolean;            // riferimento/associazione
    isValue: boolean;                // composizione/valore
    isDependency: boolean;           // dipendenza
}
```

**DEdgePoint (punto di bend su un edge):**
```typescript
{
    // ...eredita DVoidVertex (x, y, w, h)...
    father: Pointer<DVoidEdge>;      // edge parent
    currentCoordType?: CoordinateMode; // sistema di coordinate
}

// 5 sistemi di coordinate per i bend point:
enum CoordinateMode {
    "absolute"             // coordinate pixel dirette
    "relative%"            // % lungo il path dell'edge (0 = start, 1 = end)
    "relativeOffset"       // offset da start E end
    "relativeOffsetStart"  // offset solo da start
    "relativeOffsetEnd"    // offset solo da end
}
```

**DGraphVertex (nodo con grafo annidato — per package):**
```typescript
{
    // Combina DGraph + DVertex:
    // Da DVertex: x, y, w, h, isResized (dimensione esterna del "contenitore")
    // Da DGraph: zoom, offset (zoom e scroll del grafo INTERNO)
    // Usato per package che contengono sotto-elementi
}
```

**Tipi Geometrici:**
```typescript
class GraphPoint {
    x: number;           // coordinata X nel grafo
    y: number;           // coordinata Y nel grafo
}

class GraphSize {
    x: number;           // posizione X
    y: number;           // posizione Y
    w: number;           // larghezza
    h: number;           // altezza
    // Metodi: tl(), tr(), bl(), br(), ct(), cb(), cl(), cr(), cc() (angoli e centri)
}
```

**Risoluzione Dimensioni:**
```
Dimensione visualizzata = element.isResized
    ? element.{x,y,w,h}           // dimensioni esplicite
    : view.defaultVSize            // dimensioni di default dalla DViewElement
```

**Coordinate Grafo vs Viewport:**
- `GraphPoint`/`GraphSize` sono in coordinate del grafo (indipendenti dallo zoom)
- `Point`/`Size` sono in coordinate viewport/DOM (pixel reali sullo schermo)
- La conversione avviene tramite `LGraph.get_coord(htmlSize)` e zoom cumulativo

**Il campo `view` e cruciale:** E il `Pointer<DViewElement>` che determina:
- Dimensioni di default se non ridimensionato manualmente
- Forma/rendering dell'elemento
- Definizioni ancore (dove gli edge si collegano)
- Stili CSS di base
- Comportamento drag/resize

### 2.3 Campi Chiave delle Classi del Modello

**DModel:**
```typescript
{
    id: Pointer<DModel>;
    name: string;
    isMetamodel: boolean;       // true = M2, false = M1
    instanceof?: Pointer<DModel>; // M1 → punta al suo M2
    packages: Pointer<DPackage>[];
    objects: Pointer<DObject>[];  // solo in M1
    models: Pointer<DModel>[];    // modelli figli
}
```

**DClass:**
```typescript
{
    id: Pointer<DClass>;
    name: string;
    abstract: boolean;
    interface: boolean;
    father: Pointer<DPackage>;
    attributes: Pointer<DAttribute>[];
    references: Pointer<DReference>[];
    operations: Pointer<DOperation>[];
    extends: Pointer<DClass>[];   // superclassi
    instances: Pointer<DObject>[]; // back-ref a istanze M1
}
```

**DObject (istanza M1):**
```typescript
{
    id: Pointer<DObject>;
    name: string;
    instanceof?: Pointer<DClass>; // M1 object → M2 class
    father: Pointer<DModel> | Pointer<DValue>;
    features: Pointer<DValue>[];  // valori di attributi/riferimenti
}
```

**DValue (valore di attributo/riferimento):**
```typescript
{
    id: Pointer<DValue>;
    name: string;
    instanceof: Pointer<DAttribute | DReference>; // a quale feature M2 corrisponde
    values: PrimitiveType[] | Pointer<DObject | DEnumLiteral>[]; // scalari o puntatori
    father: Pointer<DObject>;
}
```

**DAttribute:**
```typescript
{
    id: Pointer<DAttribute>;
    name: string;
    type: Pointer<DClassifier>;  // EString, EInt, EBoolean, etc.
    father: Pointer<DClass>;
    lowerBound: number;          // 0
    upperBound: number;          // 1 (singolo), -1 (many)
    defaultValueLiteral: string;
}
```

**DReference:**
```typescript
{
    id: Pointer<DReference>;
    name: string;
    type: Pointer<DClass>;       // classe target
    father: Pointer<DClass>;
    lowerBound: number;
    upperBound: number;
    composition: boolean;
    aggregation: boolean;
    opposite?: Pointer<DReference>; // bidirezionale
}
```

**DGraph:**
```typescript
{
    id: Pointer<DGraph>;
    model: Pointer<DModelElement>; // quale modello visualizza
    zoom: GraphPoint;
    offset: GraphSize;
    // contiene DVertex e DEdge come subElements
}
```

**DVertex:**
```typescript
{
    id: Pointer<DVertex>;
    graph: Pointer<DGraph>;
    model: Pointer<DModelElement>; // quale elemento del modello visualizza
    x: number; y: number; w: number; h: number;
    subElements: Pointer<DGraphElement>[];
}
```

### 2.3 Layer di Logica (L* — Proxy)

Ogni D* ha un wrapper L* (`LModel`, `LClass`, `LObject`, etc.) che:
- Risolve automaticamente i `Pointer<>` in oggetti
- Fornisce computed properties (es. `lClass.allSuperclasses`)
- Intercetta setter per generare Redux actions

**Accesso:**
```typescript
const lModel = LPointerTargetable.fromD(modelId) as LModel;
const lObject = lModel.objects.find(o => o.name === "alice");
const className = lObject.instanceof.name; // risolve il pointer automaticamente
```

### 2.4 Azioni Redux

```typescript
// Modifica campo singolo
SetFieldAction.new(objectId, 'fieldName', value, accessModifier, isPointer);
// accessModifier: '' (replace), '+=' (add to array), '-=' (remove from array)

// Modifica stato root
SetRootFieldAction.new('graphs', graphId, '+=', true);

// Transazione atomica
TRANSACTION('Description', () => {
    // multiple actions eseguite atomicamente
});
```

### 2.5 Pattern Critico: ID Temporanei

`DObject.new()` e `DClass.new()` ritornano ID temporanei che NON sono immediatamente disponibili in Redux. Per accedere agli oggetti appena creati:

```typescript
// SBAGLIATO:
const obj = store.getState()[dObject.id]; // undefined!

// CORRETTO: dopo la TRANSACTION, usa il proxy LModel
setTimeout(() => {
    const lModel = LPointerTargetable.fromD(modelId) as LModel;
    const lObj = lModel.objects.find(o => o.name === objectName);
    (lObj as any)['$attrName'].value = attrValue;
}, 1000);
```

---

## 3. SISTEMA VIEWPOINT/JSX — Come funziona in V1

### 3.1 Struttura Dati

Un **Viewpoint** (`DViewPoint`) contiene un insieme di **View** (`DViewElement`). Ogni View ha 5 tab editabili:

**DViewElement campi principali:**
```typescript
{
    // Tab 1: CONSTANTS — valutate una volta
    constants?: string;           // corpo funzione che ritorna un oggetto

    // Tab 2: OBSERVED PROPERTIES — rivalutate ad ogni cambio dati
    usageDeclarations?: string;   // funzione (ret) => { ret.prop = data.something; }

    // Tab 3: TEMPLATE — codice JSX
    jsxString!: string;           // il template JSX scritto dall'utente

    // Tab 4: STYLING — CSS/SCSS
    css!: string;
    palette!: PaletteType;        // variabili CSS

    // Tab 5: EVENTS
    onDragStart!: string;
    onDragEnd!: string;
    whileDragging!: string;
    onResizeStart/End!: string;
    events!: Dictionary<string, string>; // eventi custom

    // Applicabilita
    appliableToClasses!: string[];
    appliableTo!: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'Field';
    oclCondition!: string;        // OCL selector
    jsCondition!: string;         // JS selector

    // Relazioni
    viewpoint!: Pointer<DViewPoint>;
    subViews!: Dictionary<Pointer<DViewElement>, number>; // viste annidate
    father?: Pointer<DViewElement>;
}
```

### 3.2 Pipeline di Compilazione JSX

```
JSX String (utente scrive nel Tab Template)
    ↓
DSL.parser(jsxString)          — parse del JSX
    ↓
UX.parseAndInject(parsed, dv)  — inietta dipendenze
    ↓
new Function(paramStr, body)   — compila a funzione JS
    ↓
JSXFunction(context)           — esegue con contesto → React.ReactNode
```

Il `paramStr` e una destructuring dei parametri dal contesto:
```javascript
'{data, node, view, views, component, constants, usageDeclarations, ...allConstants, ...allUD}'
```

### 3.3 Contesto Disponibile nel JSX

Quando l'utente scrive JSX nel Tab Template, ha accesso a:

| Variabile | Tipo | Descrizione |
|-----------|------|-------------|
| `data` | LModelElement | L'elemento del modello visualizzato |
| `node` | LGraphElement | Il nodo grafico (posizione, dimensioni) |
| `view` | LViewElement | La view corrente |
| `views` | LViewElement[] | Stack di viste decorative |
| `component` | GraphElementComponent | Il componente React (V1) |
| `constants` | Object | Output del Tab Constants |
| `usageDeclarations` | Object | Output del Tab Observed Properties |
| Tutte le costanti | spread | Accessibili direttamente per nome |
| Tutte le UD | spread | Accessibili direttamente per nome |

### 3.4 Componenti JSX Disponibili

| Componente | Scopo |
|------------|-------|
| `<View>` | Wrapper principale — applica styling CSS |
| `<Vertex>` | Renderizza un nodo grafico |
| `<Edge>` | Renderizza un arco |
| `<SubView>` | Annida un'altra view |
| `<Graph>` | Container di un grafo |
| `<Field>` | Renderizza un campo editabile |
| `<Input>` | Input editabile collegato a proprieta del modello |
| `<Text>` | Testo semplice |
| `<Image>` | Immagine con sizing |
| `<Toggle>` | Checkbox/switch per booleani |
| `<Selector>` | Dropdown per enum/riferimenti |

### 3.5 Esempio Completo di Viewpoint

**Constants Tab:**
```javascript
() => ({
    primaryColor: '#0ea5e9',
    borderRadius: '8px',
    showDetails: true
})
```

**Observed Properties Tab:**
```javascript
(ret) => {
    ret.displayName = data.name || 'Unnamed';
    ret.attrCount = data.attributes ? data.attributes.length : 0;
    ret.isAbstract = data.isAbstract === true;
}
```

**Template Tab (JSX):**
```jsx
<View className={'class-node'}>
    <div className={'header'}>
        {isAbstract && <span className={'badge'}>Abstract</span>}
        <h3>{displayName}</h3>
    </div>
    <div className={'body'}>
        {attrCount > 0 && (
            <ul className={'attrs'}>
                {data.attributes.map((attr, i) => (
                    <li key={i}>{attr.name}: {attr.type}</li>
                ))}
            </ul>
        )}
    </div>
</View>
```

**Styling Tab (CSS):**
```scss
&.class-node {
    border: 2px solid var(--primaryColor);
    border-radius: var(--borderRadius);
    background: white;
    .header { background: var(--primaryColor); color: white; padding: 8px; }
    .body { padding: 8px; }
    .badge { font-size: 10px; text-transform: uppercase; opacity: 0.7; }
}
```

**Events Tab:**
```javascript
onDragEnd: (e, node, position) => {
    console.log(`${data.name} moved to ${position.x}, ${position.y}`);
}
```

### 3.6 Limitazioni del JSX in V1

- NO optional chaining (`?.`) — usare `&&`
- NO nullish coalescing (`??`)
- NO fragment shorthand (`<>`) — usare array `[]`
- Errori di compilazione mostrati inline nel rendering

---

## 4. MODEL EDITING (M1) — Come funziona in V1

### 4.1 Creazione di un Modello da un Metamodello

```typescript
function createM1(project: LProject, metamodel: LModel) {
    let name = U.increaseEndingNumber('model_1', ...);
    const dModel = DModel.new(name, metamodel.id, false, true);
    //                               ^^^^^^^^^^^^^ instanceof = M2
    //                                              ^^^^^ isMetamodel = false
    project.models = [...project.models, LModel.fromD(dModel)];
}
```

### 4.2 Creazione di un'Istanza (DObject)

```typescript
const dObject = DObject.new(
    personClass.id,  // instanceof → DClass
    modelId,         // father → DModel M1
    DModel,          // fatherType
    "alice",         // name
    true             // persist
);
```

Quando si imposta `instanceof`, `_forceConformity()` crea automaticamente un `DValue` per ogni attributo e riferimento della classe M2.

### 4.3 Setting Valori sulle Istanze

```typescript
// Via proxy L* (metodo corretto):
const lObj = lModel.objects.find(o => o.name === "alice");
(lObj as any)['$age'].value = 30;
(lObj as any)['$name'].value = "Alice Smith";
```

### 4.4 Differenze M2 vs M1 nell'Editor

| Aspetto | M2 (Metamodello) | M1 (Modello) |
|---------|-------------------|--------------|
| Palette | Elementi strutturali (Class, Attribute, Reference, Enum) | Classi del metamodello come istanziabili |
| Crea | DClass, DAttribute, DReference, DPackage | DObject (istanza), DValue (valori) |
| Nodi nel grafo | Classi come box con attributi | Oggetti come box con slot di valore |
| Archi nel grafo | Ereditarieta, riferimenti (definizione) | Link tra istanze (valori di riferimento) |
| isMetamodel | true | false |

### 4.5 Punto Critico per V3

In V1, l'editing M1 NON ha una palette drag-and-drop — le istanze vengono create programmaticamente. In V3, la palette DEVE adattarsi al contesto:
- In M2: mostra Class, Attribute, Reference, Enum, Package
- In M1: mostra le classi del metamodello come elementi istanziabili (drag per creare DObject)

### 4.6 Rendering dei Modelli (M1) attraverso Viewpoint

Questo e il cuore del sistema: i viewpoint definiscono COME le istanze M1 vengono visualizzate. Senza viewpoint, un DObject e solo un box generico. Con viewpoint, diventa una notazione custom (diagramma UML, state machine, form, widget, ecc.).

**Come funziona il matching View → Istanza M1:**

1. **Ogni DViewElement ha criteri di applicabilita:**
   ```typescript
   {
       appliableToClasses: string[];  // es. ["Person", "Address"] — nomi classi M2
       appliableTo: 'Any'|'Graph'|'GraphVertex'|'Vertex'|'Edge'|'Field';
       oclCondition: string;          // es. "self.isAbstract = false" — filtro OCL
       jsCondition: string;           // es. "data.attributes.length > 0" — filtro JS
   }
   ```

2. **Quando si renderizza un DObject (istanza M1), il sistema:**
   - Prende il viewpoint attivo (selezionato dall'utente o default)
   - Filtra le view applicabili: `appliableToClasses` contiene la classe dell'oggetto?
   - Valuta `oclCondition` e `jsCondition` per ulteriore filtraggio
   - Seleziona la view con `explicitApplicationPriority` piu alta
   - Il campo `view` del DVertex punta alla DViewElement selezionata

3. **Nel JSX del viewpoint, `data` e l'LObject (istanza M1):**
   ```jsx
   // Nel Template tab del viewpoint per la classe "Person":
   <View className={'person-card'}>
       <div className={'header'}>{data.name}</div>
       <div className={'body'}>
           {/* Accesso ai valori degli attributi via features */}
           {data.features.map((feat, i) => (
               <div key={i} className={'field'}>
                   <span className={'label'}>{feat.instanceof.name}:</span>
                   <span className={'value'}>{feat.values.join(', ')}</span>
               </div>
           ))}
       </div>
       {/* Accesso ai riferimenti */}
       {data.features.filter(f => f.instanceof.className === 'DReference').map((ref, i) => (
           <div key={i} className={'reference'}>
               → {ref.values.map(v => v.name).join(', ')}
           </div>
       ))}
   </View>
   ```

4. **I componenti built-in permettono editing interattivo delle istanze:**
   ```jsx
   // <Field> renderizza un campo editabile collegato a un DValue
   <Field feature={data.features.find(f => f.name === 'age')} />

   // <Input> per input diretto su una proprieta
   <Input value={data.name} onChange={(v) => { data.name = v; }} />

   // <Selector> per riferimenti (dropdown con istanze compatibili)
   <Selector feature={data.features.find(f => f.name === 'manager')}
             options={/* istanze di Person nel modello */} />
   ```

5. **SubView per composizione gerarchica:**
   ```jsx
   // Un DObject "Company" ha riferimenti a DObject "Employee"
   <View className={'company'}>
       <h3>{data.name}</h3>
       {data.features.find(f => f.name === 'employees').values.map((emp, i) => (
           // SubView renderizza ogni Employee con la SUA view dedicata
           <SubView key={i} data={emp} />
       ))}
   </View>
   ```

**Il flusso completo M2 → Viewpoint → M1:**
```
1. Utente crea metamodello M2 (classi: Person, Address)
2. Utente crea viewpoint con view per Person e view per Address
   - View Person: JSX che mostra nome, eta, indirizzo come card
   - View Address: JSX che mostra via, citta, CAP inline
3. Utente crea modello M1 conformante al metamodello
4. Utente drag-drop "Person" dalla palette → crea DObject istanza
5. Editor V3 trova la view applicabile per DObject.instanceof = Person
6. Esegue il JSX della view con data = LObject (l'istanza)
7. L'utente vede la notazione custom (card con campi editabili)
8. L'utente edita i valori inline tramite <Field>, <Input>, <Selector>
9. I componenti built-in scrivono i DValue via proxy L*
```

**Requisito critico per V3:** Il viewpoint rendering DEVE funzionare dentro React Flow custom nodes. Ogni nodo React Flow che rappresenta un DObject deve:
- Trovare la view applicabile
- Compilare ed eseguire il JSX
- Renderizzare l'output dentro il nodo
- Generare Handle dinamici per le ancore definite dalla view
- Supportare resize se la view lo permette (`resizable`, `adaptWidth`, `adaptHeight`)
- Cachare il JSX output e ri-eseguire solo quando `data` o `usageDeclarations` cambiano

---

## 5. PATTERN DA V2 DA PRESERVARE

### 5.1 React Flow Integration

```typescript
// Libreria: @xyflow/react
import {
    ReactFlow, Background, MiniMap,
    useNodesState, useEdgesState, useReactFlow,
    ReactFlowProvider, SelectionMode, ConnectionMode,
    type Node, type Edge, type NodeTypes, type EdgeTypes
} from '@xyflow/react';

// Registrazione node/edge types
const nodeTypes: NodeTypes = { classNode: ClassNode, enumNode: EnumNode, packageNode: PackageNode };
const edgeTypes: EdgeTypes = { reference: UnifiedEdge, inheritance: UnifiedEdge };
```

### 5.2 Sync Bidirezionale JjOM <-> Canvas

**JjOM → Canvas (useJjomSync):**
- Cache per elemento: confronto reference equality
- Anti-bounce: elementi scritti dal canvas vengono saltati nella sync inversa
- Hash FNV-1a dei figli per lightweight change detection
- Aggiornamenti chirurgici: solo nodi/archi cambiati vengono sostituiti

**Canvas → JjOM (canvasToJjom):**
- `markCanvasUpdated(id)` PRIMA di scrivere in Redux
- TRANSACTION wrapping per atomicita
- Lazy drag sync: scrive posizione su drag END (non durante)

**Anti-bounce pattern critico:**
```typescript
// 1. Canvas scrive posizione
markCanvasUpdated(vertexId);
TRANSACTION('drag', () => {
    SetFieldAction.new(vertexId, 'x', newX);
    SetFieldAction.new(vertexId, 'y', newY);
});

// 2. JjOM sync riceve update ma SKIPA il vertice marcato
if (isCanvasUpdated(id)) continue;
```

### 5.3 Edge Routing (Manhattan + A*)

- Side-aware: calcola segmenti basati su sourceSide/targetSide
- Casi: opposite sides (1-5 segmenti), adjacent (2-3), same side (3)
- Crossing detection con bridge arcs
- Tree layout per multi-inheritance

### 5.4 Auto-Anchor con Hysteresis

- Logica angolare con dead-zone 30°-60°
- Pinning: endpoint manuali non vengono ricalcolati
- Deconfliction bidirezionale (A→B e B→A su lati opposti)
- Threshold 30% per evitare jitter

### 5.5 Undo/Redo

- Stack past/future con useRef (non useState — evita re-render)
- Snapshot JSON.stringify prima di ogni azione
- MAX_HISTORY = 50
- Clear future su nuova azione

### 5.6 Edge Deduplication

V2 ha un wrapper `setEdges` che deduplica per ID. Essenziale per evitare duplicati quando il sync layer crea edge gia esistenti nel canvas.

---

## 6. REQUISITI FUNZIONALI PER V3

### 6.1 Core Editor

- [ ] Editing metamodelli (M2): classi, attributi, riferimenti, operazioni, enum, package
- [ ] Editing modelli (M1): istanze di classi, valori di attributi, link tra istanze
- [ ] Switch fluido M2/M1 nella stessa architettura
- [ ] Palette adattiva al contesto (M2 vs M1)
- [ ] Inline editing: doppio click per editare nomi, attributi, valori
- [ ] Drag-and-drop: dalla palette al canvas per creare elementi
- [ ] Drag-to-connect: per creare relazioni/link
- [ ] Multi-select con alignment e distribution
- [ ] Undo/redo completo
- [ ] Copy/paste/duplicate con remapping ID
- [ ] Context menu (right-click)
- [ ] Snap to grid (toggle)
- [ ] Zoom, pan, fit view
- [ ] **Minimap** — navigatore viewport in basso a destra, mostra overview del diagramma intero con rettangolo viewport trascinabile. React Flow ha `<MiniMap>` built-in da customizzare con colori nodo per tipo (classe, enum, package, istanza)
- [ ] Node resize con drag handles (corner/edge handles)
- [ ] Lasso/marquee selection (React Flow lo supporta nativamente con `selectionMode`)
- [ ] Keyboard shortcuts completi (Delete, arrow keys per nudge, Tab tra elementi, Ctrl+A select all, Escape deselect, shortcuts palette)

### 6.2 Validazione e Navigation

- [ ] **Connection validation** — prevenire connessioni invalide (ereditarieta circolare, tipi incompatibili, auto-riferimento dove non permesso)
- [ ] **Validation markers** — icone errore/warning sui nodi (classe senza nome, cardinalita invalida, constraint OCL violato)
- [ ] **Properties Panel** — pannello laterale per editare TUTTE le proprieta dell'elemento selezionato (non solo inline)
- [ ] **Search/Filter** — cerca elementi per nome/tipo nel canvas, evidenzia risultati, naviga al match
- [ ] **Outline/Model Explorer** — tree view della struttura modello in sidebar, sincronizzato con selezione canvas
- [ ] **Breadcrumb navigation** — per DGraphVertex (grafi annidati): mostra percorso corrente e permette navigazione up/down
- [ ] **Auto-layout** — algoritmi di disposizione automatica (tree, hierarchical, force-directed) applicabili all'intero diagramma o alla selezione
- [ ] **Export diagram** — esporta come SVG, PNG, PDF
- [ ] **Tooltip/Hover info** — info dettagliate on hover (tipo, cardinalita, vincoli)
- [ ] **Layers/Visibility toggle** — mostra/nascondi categorie (attributi, operazioni, riferimenti, ereditarieta)

### 6.3 Viewpoint System

- [ ] Editor per viewpoint con 5 tab: Constants, Observed Properties, Template (JSX), Styling (CSS), Events
- [ ] Compilazione JSX → funzione eseguibile (sandboxed)
- [ ] Componenti JSX built-in: View, Field, Input, Text, SubView, etc.
- [ ] Preview live del viewpoint durante l'editing
- [ ] Applicazione viewpoint ai nodi del canvas (sia M2 che M1)
- [ ] Selezione viewpoint attivo per la visualizzazione
- [ ] Supporto subView (viste annidate)
- [ ] CSS scoped per view
- [ ] Event handlers custom

### 6.3 Visualizzazione

- [ ] Notazioni multiple (UML, Simplified, Compact, Wireframe, ER + custom via viewpoint)
- [ ] Color schemes multipli
- [ ] Dark/light theme
- [ ] Manhattan edge routing con curve
- [ ] Self-loop rendering
- [ ] Multi-inheritance tree layout
- [ ] Crossing detection con bridge arcs

### 6.4 Integrazione

- [ ] Sync bidirezionale con Redux/JjOM (come V2 ma esteso a M1)
- [ ] Supporto per DGraph persistence (posizioni salvate)
- [ ] Compatibilita con DockManager (tab system dell'app)
- [ ] Props: `modelid`, `mode` (metamodel/model), `viewpointId`

### 6.5 Non-Funzionali

- [ ] Performance: fluido con 500 nodi
- [ ] Desktop-first (1280px+)
- [ ] Accessibilita (WCAG AA best-effort)
- [ ] Testabilita: componenti isolati, hook testabili separatamente
- [ ] Bundle size: lazy loading dove possibile

---

## 7. VINCOLI DI DESIGN

### 7.1 Design System (dal CLAUDE.md)

```scss
// Colori
$slate-900: #0f172a;  $slate-800: #1e293b;  $slate-700: #334155;
$slate-400: #94a3b8;  $slate-200: #e2e8f0;
$cyan-500: #0ea5e9;   $cyan-400: #22d3ee;   $cyan-600: #0891b2;
$success: #10b981;    $warning: #f59e0b;     $error: #ef4444;

// Buttons: gradiente Slate, MAI cyan per background
// Font Code: 'IBM Plex Mono', Monaco, Consolas, monospace
// Grid: 8px
// Icone: SOLO Bootstrap Icons (bi bi-*)
```

### 7.2 Convenzioni

- Componenti: PascalCase
- Hook: camelCase con prefix `use`
- File SCSS: kebab-case
- TypeScript strict mode
- Import order: React → librerie → componenti interni → types → styles

### 7.3 Librerie Permesse

- `@xyflow/react` (React Flow) — gia in uso
- `react-redux` + Redux — gia in uso
- `bootstrap-icons` — gia in uso
- `monaco-editor` — per viewpoint code editing
- **NON aggiungere** altre librerie UI senza approvazione

---

## 8. COSA DEVI PRODURRE

### 8.1 Design Document con:

1. **Architettura ad alto livello** — diagramma dei componenti, flusso dati, confini dei moduli
2. **Struttura directory** — organizzazione file/cartelle del nuovo editor
3. **Interfacce TypeScript** — tutti i tipi per node data, edge data, context, etc.
4. **Componenti principali** — nome, responsabilita, props, dipendenze per ciascuno
5. **Sistema di nodi** — come i node types gestiscono M2 (classi) e M1 (istanze) e viewpoint
6. **Sistema di edge** — come gli edge types gestiscono ereditarieta, riferimenti, link M1
7. **Palette adattiva** — come cambia tra M2 e M1
8. **Viewpoint rendering pipeline** — come il JSX viene compilato e renderizzato dentro React Flow nodes
9. **Sync layer** — architettura del sync bidirezionale JjOM<->Canvas (evoluzione di V2)
10. **Layout mapping** — come TUTTE le proprieta di DVertex/DEdge vengono mappate a React Flow e viceversa:
    - Posizione (x, y) e dimensioni (w, h) ↔ React Flow node position/style
    - zIndex ↔ React Flow zIndex
    - Ancore nominate (Dictionary percentuale) ↔ React Flow Handle components
    - Campo `state` (CSS dict: rotation, opacity, transforms) ↔ React Flow node style
    - Campo `view` (Pointer a DViewElement) → determina default size, forma, ancore, stili
    - `isResized` flag → logica per usare dimensioni esplicite vs default da view
    - DEdge midPoints/midnodes con CoordinateMode ↔ waypoints React Flow
    - DEdge anchorStart/anchorEnd ↔ sourceHandle/targetHandle
    - DGraphVertex (grafo annidato) ↔ sub-flow o expand/collapse
11. **Piano di implementazione** — fasi ordinate con dipendenze, dalla piu critica alla meno

### 8.2 Per ogni componente, specifica:

- Nome e path file
- Props interface
- State interno
- Hook utilizzati
- Come interagisce con JjOM
- Come interagisce con altri componenti

### 8.3 Per il viewpoint rendering, specifica:

- Come React Flow custom nodes ospitano output JSX
- Come il contesto viene costruito (data, node, view, constants, UD)
- Sandboxing della compilazione JSX
- Come i componenti built-in (View, Field, etc.) vengono registrati
- Come il CSS scoped viene applicato
- Come gli eventi vengono collegati

### 8.4 Problemi da risolvere esplicitamente:

1. **Come un singolo node type gestisce sia DClass (M2) che DObject (M1)?**
   - Opzione A: node type unico con rendering condizionale
   - Opzione B: node types separati con base comune
   - Opzione C: viewpoint come renderer universale (default viewpoint per M2, custom per M1)

2. **Come la palette sa cosa mostrare?**
   - In M2: elementi strutturali fissi
   - In M1: legge le classi dal metamodello e le offre come istanziabili
   - Con viewpoint: potenzialmente custom palette items

3. **Come il viewpoint JSX si integra con React Flow?**
   - Il JSX compilato deve renderizzarsi DENTRO un React Flow custom node
   - Il node deve comunque supportare handles per le connessioni
   - Il resize e il drag devono funzionare
   - I componenti JSX built-in (Field, Input, etc.) devono poter modificare il modello

4. **Come gestire l'undo/redo quando le azioni toccano sia canvas che JjOM?**
   - V2 fa snapshot solo del canvas state
   - V3 deve coordinare undo/redo tra canvas E Redux

5. **Come gestire le performance con viewpoint JSX su 500 nodi?**
   - Ogni nodo esegue una funzione compilata
   - Caching, memoization, viewport culling

6. **Come mappare il layout DVertex <-> React Flow Node?**
   - DVertex ha: `x, y, w, h, zIndex, anchors (Dictionary<string, GraphPoint>), state (CSS dict), view (Pointer), isResized, zoom`
   - React Flow Node ha: `position: {x, y}`, `data`, `style`, `zIndex`
   - Le ancore in JjOM sono nominate con valori percentuali (`{x: 0.5, y: 0}` = centro-top)
   - React Flow usa Handle components con posizione (top/bottom/left/right) + offset
   - Il campo `state` di DVertex contiene proprieta CSS dinamiche (rotation, opacity, transforms, etc.)
   - Il campo `view` determina dimensioni di default, forma, ancore di default, stili base
   - `isResized` distingue dimensioni esplicite vs default dalla view
   - **Servono transformer bidirezionali** che preservino tutte queste proprieta

7. **Come gestire DGraphVertex (grafi annidati)?**
   - Un DGraphVertex e un nodo che contiene un sotto-grafo (usato per package)
   - Ha proprieta di DVertex (posizione/dimensione esterna) + proprieta di DGraph (zoom/offset interni)
   - React Flow supporta sub-flows ma con limitazioni
   - Opzioni: nesting nativo React Flow, expand/collapse, pannello separato

8. **Come gestire i 5 sistemi di coordinate per DEdgePoint?**
   - I bend point degli edge possono usare: absolute, relative%, relativeOffset, relativeOffsetStart, relativeOffsetEnd
   - React Flow usa coordinate assolute per i waypoint
   - Serve conversione bidirezionale tra CoordinateMode e coordinate assolute
   - La conversione dipende dalle posizioni di start/end dell'edge

9. **Come mappare le ancore nominate di JjOM ai Handle di React Flow?**
   - JjOM: `anchors: { "north": {x:0.5, y:0}, "customPoint": {x:0.3, y:0.7} }` — arbitrarie, percentuali
   - React Flow: Handle con `position` enum (Top/Bottom/Left/Right) + offset CSS
   - V2 usa un pool pre-allocato (top-source-0..3, right-source-0..3)
   - V3 deve supportare ancore arbitrarie definite dalla view (viewpoint puo definire ancore custom)
   - Servono Handle dinamici generati dalle ancore del DVertex/DViewElement

---

## 9. ANTI-PATTERN DA EVITARE

- **Monoliti:** Info.tsx di V1 (1.243 righe). Max 300 righe per componente.
- **Sync loop infiniti:** Senza anti-bounce, canvas write → Redux update → canvas re-read → loop
- **@ts-ignore:** Zero tolleranza. Tipizza tutto.
- **jQuery/DOM manipulation:** Tutto via React. Niente `.querySelector()` per stato.
- **new Function() non sandboxed:** Il viewpoint JSX DEVE essere isolato (errori non crashano l'editor)
- **Coupling con V1:** V3 non deve importare NULLA da `components/editors/` (V1)
- **Over-engineering:** Inizia semplice, estendi dopo. Non progettare per requisiti ipotetici.

---

## 10. PUNTO DI PARTENZA SUGGERITO

Se aiuta, ecco una possibile struttura iniziale (da validare/modificare nel design):

```
frontend/src/components/editor-v3/
├── EditorV3.tsx              — orchestratore principale
├── types.ts                  — tutti i tipi
├── constants.ts              — costanti condivise
├── nodes/
│   ├── MetamodelNode.tsx     — rendering DClass/DEnum/DPackage
│   ├── InstanceNode.tsx      — rendering DObject (M1)
│   ├── ViewpointNode.tsx     — rendering via viewpoint JSX
│   └── shared/               — componenti condivisi tra nodi
├── edges/
│   ├── UnifiedEdge.tsx       — tutti i tipi di arco
│   └── edgeRouting.ts        — algoritmi di routing
├── panels/
│   ├── AdaptivePalette.tsx   — palette M2/M1 adattiva
│   └── PropertiesPanel.tsx   — pannello proprieta
├── viewpoint/
│   ├── ViewpointCompiler.ts  — compilazione JSX → funzione
│   ├── ViewpointRenderer.tsx — rendering del JSX compilato
│   ├── ViewpointContext.ts   — costruzione contesto
│   ├── BuiltInComponents.tsx — View, Field, Input, Text, SubView, etc.
│   └── ViewpointEditor/      — editor per i 5 tab
├── sync/
│   ├── useJjomSync.ts        — JjOM → Canvas
│   ├── canvasToJjom.ts       — Canvas → JjOM
│   └── antiBounce.ts         — meccanismo anti-bounce
├── hooks/
│   ├── useEditorMode.ts      — M2 vs M1 mode
│   ├── useHistory.ts         — undo/redo
│   ├── useAutoAnchor.ts      — calcolo ancore
│   └── useAlignment.ts       — alignment tools
├── toolbar/
│   ├── Toolbar.tsx
│   └── AlignmentToolbar.tsx
├── context-menu/
│   └── ContextMenu.tsx
└── styles/
    ├── editor-v3.scss
    ├── _themes.scss
    ├── _notations.scss
    └── _color-schemes.scss
```

---

**RICORDA:** Non scrivere codice implementativo. Produci un design document esaustivo che permetta di implementare V3 fase per fase con fiducia architetturale.

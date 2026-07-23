# Discovery 2026-07-23 — resize/sizing dei nodi e affordance per-asse

**Tipo**: Fase 1, read-only. Nessuna modifica al codice, nessuno staging, nessun commit.
**Branch**: `alfonso-frontend-jjtl` — HEAD `a29ecc4ab`.
**Perimetro**: `frontend/src/**` (tutti i path sono relativi a `frontend/src/` salvo dove indicato).

---

## 0. Obiettivo

Capire perché un nodo default della vista **Object** allargato col bounding box cresce solo in
larghezza e non in altezza (frame fantasma delle maniglie), e stabilire se la direzione
"un asse `adapt*=true` non espone maniglia su quell'asse" sia implementabile e cosa rompa.

---

## 1. FINDING BLOCCANTE — l'editor classico non esiste più su questo branch

Il sintomo è descritto come appartenente all'**editor classico**, con la card
`.jjodel-classic-object`. **Quel percorso di rendering non è più presente nel working tree.**

Due commit, entrambi **antenati di HEAD** (verificato con `git merge-base --is-ancestor`):

| commit | data | effetto |
|---|---|---|
| `197b6c3d0` | 2026-07-18 | `feat: classic shutdown — flow-only EditorSwitch, remove classic mounts and mode toggle` |
| `e86c276f8` | 2026-07-19 | `refactor: purge classic barrel and delete classic editor perimeter graph/ (de-entanglement stages 4+5)` — cancella `src/graph/` (`graphElement.tsx`, `Vertex.tsx`, `Shapes.tsx`, `damedge.tsx`, `DefaultNode.tsx`), `components/edgeOverlay/EdgeFallbackCard.tsx`, `editors/TemplatePreview.tsx` |

Conferme sul working tree attuale:

- `components/abstract/tabs/EditorSwitch.tsx:111-141` — **entrambi** i rami di `return`
  montano `<EditorV2>`. Il commento a `:123-129` è esplicito: *"the classic/split modes are no
  longer reachable — EditorV2 renders the flow editor for every model"*. Il tipo
  `EditorViewMode = 'flow' | 'classic' | 'split'` e la preferenza in localStorage sopravvivono
  ma sono **ignorati** (`TODO: cleanup` a `:128`).
- `frontend/src/graph/` non esiste. `find`/`git ls-files` per `*graphElement*` → 0 risultati
  tracciati.
- Nessun JSX produce `.GraphContainer`: le uniche occorrenze sono selettori CSS
  (`styles/style.scss:107`, `styles/diagram.scss:687,880`) e `querySelector` difensivi
  (`utils/keyboardShortcuts.ts:50`, `Measurable.tsx:554`, `view/viewElement/view.tsx:865`).
- `common/graphComponentRegistry.ts:6` — il registry dei componenti graph-element **non ha più
  scrittori**. Gli unici accessi sono in lettura (`GraphDataElements.tsx:471,2631`,
  `joiner/classes.ts:4192,4196`), quindi `get_component()` restituisce sempre `undefined`.

**Conseguenza operativa**: il sintomo descritto non è riproducibile su questo codice.
Le ipotesi 1-5 del prompt descrivono una pipeline che oggi è **codice morto**
(dettaglio in §5). Quello che l'utente vede è quasi certamente il nodo **`ObjectNode` di
editor-v2**, visivamente identico per costruzione: `styles/classic-object-view.scss:1-2` dichiara
*"visual parity with the flow editor (editor-v2)"*, stesso header `nome : Tipo` e stesse righe
`attr = valore`, stesso set di token di palette.

Il resto del report risponde alle Q1-Q5 **su due colonne**: **(A)** il percorso vivo (editor-v2),
dove il fix andrebbe scritto; **(B)** il percorso classico ricostruito da git, per chiudere le
ipotesi del prompt.

---

## 2. File letti

Working tree (`frontend/src/`):

```
components/abstract/tabs/EditorSwitch.tsx
components/editor-v2/nodes/ObjectNode.tsx
components/editor-v2/nodes/ClassNode.tsx (parziale)
components/editor-v2/utils/jjomTransformers.ts
components/editor-v2/hooks/useJjomSync.ts (parziale)
components/editor-v2/sync/canvasToJjom.ts (parziale)
components/editor-v2/EditorV2.tsx (parziale)
components/editor-v2/EditorV2.scss (parziale)
components/editor-v2/_themes.scss (parziale)
components/editor-v2/viewpoint/ViewpointRenderer.tsx
components/forEndUser/Measurable.tsx (integrale)
components/forEndUser/Aliases.tsx
components/editors/views/data/NodeData.tsx
components/editors/views/data/GenericNodeData.tsx (riferimento)
components/editors/views/ViewData.tsx (riferimento)
components/editors/viewpoint/properties/ViewProperties.tsx (parziale)
model/dataStructure/GraphDataElements.tsx (parziale: 445-720, 860-880, 1330-1400)
view/viewElement/view.tsx (parziale: 232-238, 1010-1030, 1500-1575)
joiner/classes.ts (parziale: 1170-1200)
redux/defaults/views.ts (parziale, tutti i blocchi flag)
common/Geom.ts (parziale)
common/graphComponentRegistry.ts
common/sharedTypes.tsx (parziale)
common/UX.tsx (parziale)
utils/defaultViewTemplate.ts (parziale)
styles/view.scss, styles/classic-object-view.scss (integrali)
```

Dipendenze (`frontend/node_modules/`): `@xyflow/react@^12.10.0` — `dist/esm/index.mjs`
(NodeWrapper, applyNodeChanges, NodeResizer/NodeResizeControl), `dist/base.css`;
`@xyflow/system/dist/esm/index.js`.

Da git (file cancellati, estratti a `e86c276f8^`): `frontend/src/graph/graphElement/graphElement.tsx`
(1548 righe), `frontend/src/graph/vertex/Vertex.tsx` (585 righe).

---

## 3. Q1 — Applicazione size → style

### 3.A Percorso vivo (editor-v2) — **qui c'è l'asimmetria**

Il vertice Object viene tradotto in nodo React Flow da
`components/editor-v2/utils/jjomTransformers.ts` → `objectVertexToRFNode` (`:243-339`).
Il ritorno è:

```ts
// jjomTransformers.ts:328-338
return {
    id: vertex.id,
    type: 'objectNode',
    position: { x, y },
    data: { label, instanceOfClassName, instanceOfClassId, features },
};
```

**Nessun `style`, nessun `width`, nessun `height`.** Il confronto è netto con
`packageVertexToRFNode` (`:212-235`), l'**unico** transformer che legge `raw.w`/`raw.h` e li
scrive come stile:

```ts
// jjomTransformers.ts:216-232
const w = typeof raw.w === 'number' ? raw.w : 400;
const h = typeof raw.h === 'number' ? raw.h : 300;
return { …, style: { zIndex: -1, width: w, height: h }, … };
```

Idem per `classVertexToRFNode` (`:160-174`) e `enumVertexToRFNode` (`:199-209`): nessuno stile.
Gli altri tre punti di creazione di `objectNode` in `EditorV2.tsx` (`:688-700`, `:1832-1841`,
`:2687-2697`) costruiscono il nodo a mano e **omettono anch'essi** `width`/`height`/`style`.

Chi porta allora le dimensioni nel DOM? React Flow, non il codice Jjodel:

1. `NodeResizer` (`ObjectNode.tsx:374-380` ramo IR, `:422-428` ramo nativo) monta 4 linee + 4
   maniglie d'angolo. Al drag emette una change `{type:'dimensions', resizing:true,
   setAttributes, dimensions:{width,height}}` (`@xyflow/react/dist/esm/index.mjs:4729-4742`).
2. `applyNodeChanges` scrive `element.width`/`element.height` **top-level sul nodo** quando
   `setAttributes` è truthy (`index.mjs:686-699`).
3. `NodeWrapper` compone lo stile inline del wrapper: `{ zIndex, transform, pointerEvents,
   visibility, ...node.style, ...inlineDimensions }` (`index.mjs:2232-2240`), dove
   `inlineDimensions` deriva da `node.width`/`node.height`.

Quindi **entrambe** le dimensioni finiscono inline — ma **sul wrapper `.react-flow__node`, non
sulla card**. L'asimmetria nasce un livello più sotto, ed è puramente CSS:

- `.mm-node` (`EditorV2.scss:1208-1220`) dichiara solo `min-width:140px; min-height:40px`.
  L'estrazione completa del blocco (1208 → chiusura) **non contiene** `width:100%`,
  `height:100%` né `position`.
- `div.mm-node.mm-object` è un box **block-level in flusso normale** dentro
  `.react-flow__node` (`base.css:177-186`: `position:absolute; box-sizing:border-box`), che
  dopo il resize ha width **e** height esplicite.
- Regola CSS di base: per un block-level in flusso, `width:auto` → **riempie** la larghezza del
  containing block; `height:auto` → **si adatta al contenuto**.

→ **La larghezza segue il resize gratuitamente; l'altezza no.** È esattamente il sintomo.
Non serve nessuna ipotesi su `w` applicata e `h` non applicata: nel percorso vivo **nessuna delle
due** viene applicata alla card, e la larghezza "funziona" solo come effetto collaterale del
layout block.

**Bug distinto emerso qui** (segnalazione, non oggetto della Fase 1): il resize di un Object
**viene persistito ma non riletto**. `EditorV2.tsx:3608-3615` intercetta le change `dimensions`
con `resizing` e chiama `syncSizeToJjom(c.id, w, h)` → `canvasToJjom.ts:72-78` scrive `w` e `h`
in D-layer. Ma `objectVertexToRFNode` non li rilegge mai. In sessione le dimensioni sopravvivono
perché la riconciliazione di `useJjomSync.ts:1358-1375` patcha solo `data`/`position`/`style` e
non tocca `node.width`/`node.height`; **a un rebuild completo o al reload il resize di un Object
è perso.** Per `packageNode` no, perché passa da `style`. Da confermare a runtime.

### 3.B Percorso classico (storico, `graphElement.tsx` a `e86c276f8^`)

L'ipotesi 4 del prompt — *"la `w` diventa `width` inline mentre la `h` no"* — è **falsa** per il
renderer classico come esisteva alla cancellazione. Il codice era **simmetrico**:

```tsx
// graphElement.tsx:1195-1216 (file cancellato)
let isResized = vertex.isResized;
classes.push(isResized ? 'isResized' : 'notResized');
let adaptWidth  = this.props.view.adaptWidth;
let adaptHeight = this.props.view.adaptHeight;
if (isResized || !this.props.view.adaptWidth) {
    styleoverride.width = size.w + 'px';
    styleoverride['--width'] = size.w + 'px';
}
else styleoverride.width = undefined;
if (isResized || !this.props.view.adaptHeight) {
    styleoverride.height = size.h + 'px';
    styleoverride['--height'] = size.h + 'px';
}
else styleoverride.height = undefined;

if (this.props.isVertex && !Debug.lightMode && !isResized && (adaptWidth || adaptHeight) && this.countRenders >= 0)
    AT_TRANSACTION(()=> { this.props.node.adaptSize(size, this.props.view, {w: adaptWidth, h: adaptHeight}); });
```

Semantica: finché il vertice **non** è stato resizato a mano, l'asse `adapt*=true` non riceve
pixel espliciti e `adaptSize` rimisura; al primo resize manuale `isResized` diventa `true`
(scritto in `Vertex.tsx` nel `start` del resizable, vedi §4.B) e **da lì in poi entrambi gli assi
ricevono pixel espliciti**, `adapt*` incluso. Cioè: la vista Object classica, dopo un resize,
sarebbe cresciuta anche in altezza. Un secondo punto di applicazione, sul `<view>` interno, era
`graphElement.tsx:1401-1404` (`viewStyle.width = view.adaptWidth` / `viewStyle.height =
view.adaptHeight`, con lo storico valore stringa `'fit-content'` suggerito dal commento a
`joiner/classes.ts:1188`).

---

## 4. Q2 — Wiring delle opzioni jQuery UI

### 4.A Stato vivo — `Measurable` non ha più consumatori di resize

`components/forEndUser/Measurable.tsx` è intatto e compilato, ma:

- `defaultOptions.draggable` contiene il `disabled` **commentato** a `:55`
  (`// disabled: !(view.draggable),}`) — **confermato**, esattamente com'era nel prompt.
- `defaultOptions.resizable = {}` a `:57` — **confermato**. Nessuna derivazione di `handles`.
- `afterUpdateSingle(type)` (`:311-344`) costruisce le opzioni: parte da `props[optionkey]`
  (`:325-327`), cabla i 3 eventi via `makeEvent` (`:340`), fa `U.objectMergeInPlace(options,
  defaultOptions)` (`:342`) e applica `($measurable)[type](options)` (`:343`). Il ramo di
  spegnimento è a `:320-324` (`.resizable('disable')` se la prop è falsy).

**Chi passa `resizable` a `Measurable` oggi**: nessuno per i nodi del grafo. Ricerca esaustiva
su `frontend/src/`:

| sito | cosa passa | stato |
|---|---|---|
| `common/DV.tsx:1374-1375, 1741, 1787` | `resizable={true}/{false}` | dentro **stringhe** jsxString / blocchi commentati |
| `common/DV.tsx:1222, 1358` | `<Scrollable graph={node}>` (pan) | dentro jsxString |
| `ScrollableComponent` (`Measurable.tsx:528`) | solo `draggable`, per il pan | il componente non è montato da nulla di vivo |

I jsxString di `DV.tsx` erano valutati dalla pipeline `DSL.parser → UX.parseAndInject → new
Function` guidata da `graphElement.tsx`, oggi cancellata. L'unico valutatore di jsxString vivo è
`components/editor-v2/viewpoint/ViewpointRenderer.tsx:17`, che compila con
`new Function('React', 'data', …)`: nello scope **non** esistono `Measurable`, `Scrollable`,
`View`, quindi un template classico ci lancerebbe un errore (catturato a `:19-25`). È usato solo
da `ClassNode.tsx:423-437` quando `data.jsxString` è valorizzato.

**Fattibilità della derivazione di `handles`** (risposta alla domanda, se `Measurable` tornasse
vivo): sì, tecnicamente. `afterUpdateSingle` è il punto unico di merge, e `handles`/`disabled`
sono opzioni jQuery UI legittime. Ma `Measurable` **non riceve `view`** — le sue props
(`MeasurableOwnProps`, `:650-675`) non includono né `view` né `nodeid` (l'interfaccia
`MeasurableInjectProps` a `:646-649` esiste ma **non è nel tipo delle props**: `MeasurableAllProps`
a `:688` la esclude deliberatamente). Servirebbe quindi che il chiamante calcoli gli handles e li
passi dentro `resizable={{handles: 'e,w'}}`, non che `Measurable` li derivi. È la scelta più
pulita anche perché `Measurable` è generico e non deve conoscere le viste.

### 4.B Percorso classico — `Vertex.tsx` **non** usava `Measurable`

Ipotesi 5 del prompt parzialmente da correggere: i vertici classici **non passavano da
`Measurable`**. `Vertex.tsx` (cancellato) cablava jQuery UI direttamente su `$(html)`:

- `setVertexProperties()` `:106-120` legge `view.draggable` e `view.resizable` in
  `isDraggable`/`isResizable`.
- Draggable: `:122-212`. `disabled: !(isDraggable)` a `:139`, con commento *"this does not work,
  i think because once set the first time the whole declaration is not re-applied"*. Lo spegnimento
  effettivo passava da `$measurable.draggable('disable')` a `:124`.
- Resizable: `:222-358`. `:223-228` è il ramo enable/disable su `isResizable`.
  `this.resizableOptions` (`:230-355`) contiene `helper`, `start`, `resize`, `stop` — **e nessun
  `handles`**, quindi jQuery UI applicava il default `'e,s,se'` (tre maniglie: destra, basso,
  angolo). Nessun `disabled` nelle opzioni: solo le chiamate imperative `.resizable('disable'/'enable')`.
- `isResized` veniva messo a `true` nel `start`, `:242`:
  `if (!this.props.node.isResized) this.props.node.isResized = true; // set only on manual resize`.
  Il campo vive in `GraphDataElements.tsx:1341,1372,1682,1731,1768,1824` con
  `get/set_isResized` a `:868-875` e `:1388-1395`, default `false` in `joiner/classes.ts:1342`.
- Il codice per riconoscere l'asse dalla maniglia (`ui-resizable-se`, `n`/`s`, `e`/`w`, `nw`,
  `ne`) esiste a `:296-337` ma è **interamente dentro un blocco commentato**.

---

## 5. Q3 — Maniglie e frame di selezione

### 5.A Percorso vivo

I quadrati sono le maniglie di **React Flow**, non un overlay Jjodel e non jQuery UI.

- Markup: `NodeResizer` (`index.mjs:4835-4839`) espande in 4 `NodeResizeControl` con
  `variant: Line` su `XY_RESIZER_LINE_POSITIONS = ['top','right','bottom','left']` e 4 con
  variante handle su `XY_RESIZER_HANDLE_POSITIONS = ['top-left','top-right','bottom-left',
  'bottom-right']` (`@xyflow/system/dist/esm/index.js:3072-3073`).
- Classi applicate da Jjodel: `lineClassName="node-resize-line"`,
  `handleClassName="node-resize-handle"` (`ObjectNode.tsx:377-379` e `:425-427`).
- Stile: `EditorV2.scss:1017-1043` (linee: `opacity:0 !important`, hit-area 4px, rivelate
  all'hover con `--accent-muted`) e `:1047-1058` (maniglie: 8×8, `border-radius:2px`,
  `background: var(--resize-handle-bg)`, `border: 2px solid var(--resize-handle-border)`).
- Token: `components/editor-v2/_themes.scss:123-124` (light: `#0ea5e9` / `#1e293b`) e
  `:269-270` (dark: `#0284c7` / `#ffffff`). **Non** esistono `--color-handle-border/bg/hover`
  citati nel prompt.

**Cosa dimensiona il frame** — risposta diretta alla domanda: né la size memorizzata né il rect
della card. `.react-flow__resize-control` è `position:absolute` (`base.css:413-415`) e le linee
usano `height:100%` / `width:100%` / `top:100%` / `left:100%` (`base.css:470-504`), le maniglie
`left:0|100%`, `top:0|100%` (`:433-456`). Tutto risolve contro il **containing block**, cioè il
primo antenato posizionato. Poiché `.mm-node` è `position: static` (verificato: nessun `position`
nel blocco), quell'antenato è `.react-flow__node` — che ha l'altezza del resize.

→ **Il frame traccia il wrapper, la card è più bassa: quello è il box fantasma.**

Corollario importante per la Fase 2: **sopprimere le maniglie su un asse NON elimina da solo il
frame fantasma su quell'asse.** Se il wrapper conserva `node.height` da un resize precedente, la
linea `bottom` (a `top:100%`) resta dov'è anche senza maniglia. Servono due mosse indipendenti:
(a) non esporre l'affordance, (b) far sì che il wrapper non porti un'altezza esplicita
divergente dal contenuto — oppure far riempire la card (`height:100%` su `.mm-node`), che è la
soluzione minimale e simmetrica al comportamento già corretto della larghezza. Le due scelte
danno UX opposte (card che abbraccia il contenuto vs card che riempie il box) e vanno decise.

### 5.B Percorso classico

Maniglie = `.ui-resizable-handle` / `.ui-resizable-<dir>` di jQuery UI (la logica di parsing di
quelle classi è in `Vertex.tsx:296-299`, commentata). Il "frame" di resize era l'helper
`'resize-shadow selected-by-me'` (`Vertex.tsx:231`), stilato in `styles/view.scss:26-28`
(`.resize-shadow { outline: 1px dotted var(--color-text-primary) }`) e `:30-32`
(`.selected-by-me { outline: 2px dashed var(--color-accent) }`). Entrambe le classi
**esistono ancora** in `view.scss` ma nessuno le applica più.

---

## 6. Q4 — Read path dei flag adapt e loop-guard

### 6.A `adaptWidth`/`adaptHeight` oggi non sono letti da nessun renderer

Grep esaustivo su tutte le directory sorgente (`components/ joiner/ view/ model/ redux/ common/
utils/ styles/ jjel/ jjtl/ jjscript/ services/ hooks/`). Elenco **completo** delle occorrenze:

| sito | natura |
|---|---|
| `view/viewElement/view.tsx:233-234` | dichiarazione campo D |
| `view/viewElement/view.tsx:1014-1021` | dichiarazione campo L + `__info_of__` |
| `joiner/classes.ts:1187-1188` | default base: `adaptWidth=false`, `adaptHeight=true //'fit-content'` |
| `redux/defaults/views.ts:171,319,543,646,671,768` | inizializzazione per-view |
| `components/editors/views/data/NodeData.tsx:59-60,69-70,106,115` | toggle + gating dei campi Default Width/Height |
| `components/editors/viewpoint/properties/ViewProperties.tsx:177-178` | toggle |
| `model/dataStructure/GraphDataElements.tsx:590-591` | **commentate** |
| `model/dataStructure/GraphDataElements.tsx:652-653` | **scritture** del loop-guard |
| `styles/classic-object-view.scss:49` | commento |

**Nessun consumatore in lettura che piloti il rendering.** L'unico che esisteva era
`graphElement.tsx:1201-1215` (§3.B). Oggi i due flag sono **inerti**: si possono togglare dal
pannello, si persistono, non cambiano nulla.

### 6.B `adaptSize` è codice morto

`GraphDataElements.tsx:581-582` (stub) e `:584-665` (`get_adaptSize`). **Zero call site** in tutto
il repo (`grep -rn "adaptSize" frontend/src` → solo le righe di quel file). L'unico chiamante era
`graphElement.tsx:1215`.

Ne segue che `canTriggerSet {w,h}` non viene mai popolato da nessuno con valori diversi dal
default `{w:true, h:true}` (firme a `:489`, `:494`, `:497`, `:501`, `:537`, `:585`), e che
`Size.of()` (`common/Geom.ts:615`, `getBoundingClientRect` a `:641`) non viene più invocato per
l'autosize dei nodi. Va notato che `get_adaptSize` avrebbe comunque un **early return** a `:598`:
legge l'HTML da `this.get_component(c)?.html?.current`, e `get_component` (`:471`) legge
`graphComponentRegistry`, che come detto in §1 non ha più scrittori → sempre `undefined`.
Doppia morte.

### 6.C Loop-guard — non può scattare, ma la sua semantica va conosciuta

Blocco a `GraphDataElements.tsx:629-658` (il prompt indicava ~642-658: la finestra esatta parte
dal commento `// check for resize loops` a `:629`). Meccanica: `transientProperties.node[id].
sizeHistory` accumula un campione ogni `U.UpdatingTimer`; se in `ObservationRange = 3` campioni
(`:639`) entro `ObservationTime = 3 * 1.2 * U.UpdatingTimer` (`:641`) si contano
`MaxChangesInRange = 2` variazioni di `w`/`h` (`:640`, `:644-649`), allora `:650-657`:

```ts
TRANSACTION('disabling autosize for view ' + view.name, ()=>{
    view.adaptWidth = false;
    view.adaptHeight = false;
})
```

Due proprietà da tenere presenti per il futuro: (1) è **globale sulla view**, non sul nodo — un
singolo vertice oscillante spegne l'autosize per **tutte** le istanze di quella view;
(2) spegne **entrambi** gli assi insieme, quindi è incompatibile con una semantica per-asse e
andrebbe rivisto contestualmente.

**Rischio che il fix lo faccia scattare per errore: nullo allo stato attuale**, perché il guard
vive dentro `adaptSize`, che non viene chiamato. Torna rilevante solo se la Fase 2 reintroduce
una misurazione con riscrittura in store.

---

## 7. Q5 — Default per-view e superfici di edit

### 7.1 Tabella dei flag delle viste built-in (`redux/defaults/views.ts`)

Default di base applicati a ogni `DViewElement` da `joiner/classes.ts:1183-1188`:
`draggable=true`, `resizable=true`, `adaptWidth=false`, `adaptHeight=true`,
`defaultVSize = GraphSize(0,0,140.68,32.53)`.

| riga | view | override | effettivo |
|---|---|---|---|
| 44 | **Model** (Graph) | `draggable=false; resizable=false` (`:49`) | non trascinabile né resizabile |
| 120 | **Package** (GraphVertex) | nessun `adapt*`; `defaultVSize = defaultPackageSize` (`:148`) | **adaptW=false, adaptH=true**, resizable=true |
| 169 | **Class** | `adaptWidth=true; adaptHeight=true` (`:171-172`) | content-defined su entrambi |
| 317 | **Enum** | `adaptWidth=true; adaptHeight=true` (`:319-320`) | content-defined su entrambi |
| 419 | **Attribute** | nessuno | base |
| 443 | **Reference** | nessuno | base |
| 466 | **Operation** | nessuno | base |
| 508 | **Parameter** | nessuno | base |
| 528 | **Literal** | nessuno | base |
| **541** | **Object** | `adaptWidth=true; adaptHeight=true` (`:543-544`) | **content-defined su entrambi** ← la view del sintomo |
| 644 | **Singleton** | `adaptWidth=false; adaptHeight=false` (`:646`) **poi** `adaptWidth=true; adaptHeight=true` (`:671`) | **true/true** — vedi nota |
| 694 | **Value** (Field) | nessuno | base |
| 758 | **EdgePoint** | `resizable=false` (`:760`); `adaptWidth=true; adaptHeight=true` (`:768`) | non resizabile, content-defined |
| 793 | **Anchors** | nessuno | base |

**Nota su Singleton**: le due assegnazioni sono nello stesso initializer, quindi `:646` è
**sovrascritta** da `:671` ed è codice morto. Sembra un residuo, non una scelta — da chiarire
prima di costruirci sopra una regola per-asse.

**Viste che oggi sono free-resizable (`adapt*` non entrambi true) e che il fix deve lasciare
invariate**: Package, Attribute, Reference, Operation, Parameter, Literal, Value, Anchors — tutte
con `adaptWidth=false` (base) → maniglia orizzontale attesa; `adaptHeight=true` (base) → maniglia
verticale **non** attesa sotto la regola proposta. Attenzione: nessuna vista built-in ha oggi
`adaptWidth=false && adaptHeight=false`, quindi **nessuna** avrebbe il set completo di maniglie
su entrambi gli assi. Il "container/`DPackage`" citato nel prompt come esempio di vista free ha in
realtà `adaptHeight=true` per ereditarietà dal default base — e in editor-v2 è l'unico nodo le cui
dimensioni sono realmente applicate via `style` (§3.A). Il rischio di regressione visiva si
concentra lì.

### 7.2 Dove vive il pannello properties delle viste

Due superfici distinte, entrambe vive:

1. **Properties / Tree View** — `components/editors/Info.tsx:1208` monta `<ViewData>`
   (`components/editors/views/ViewData.tsx`) quando la selezione è un `DViewElement`;
   `ViewData.tsx:110` monta `<GenericNodeData>` → `GenericNodeData.tsx:45` monta `<NodeData>`
   solo se `isVertex`. I toggle stanno in `components/editors/views/data/NodeData.tsx`:
   Store Size, Lazy Update, **Adapt Width** (`:56-64`), **Adapt Height** (`:66-74`),
   **Draggable** (`:76-84`), **Resizable** (`:86-94`), Snap, e i campi Default Width /
   Default Height mostrati **solo** se il rispettivo `adapt*` è falso (`:106`, `:115`).
   Questo gating è già l'embrione della semantica per-asse voluta.
2. **Viewpoint Workbench** — `components/editors/viewpoint/WorkbenchProperties.tsx:58` monta
   `properties/ViewProperties.tsx`, con `BehaviorToggle` per Adapt width/height a `:177-178`.

Nota di contesto: `ViewData.tsx` risulta modificato nel working tree (sessione concorrente,
`git status` all'apertura). Non l'ho toccato.

---

## 8. Catena DOM effettiva del vertice Object (editor-v2, percorso vivo)

```
div.react-flow__nodes                                   [container, non posizionato dai nodi]
└ div.react-flow__node.react-flow__node-objectNode[.selected][.draggable]
  │   base.css:177-186 → position:absolute; box-sizing:border-box
  │   style inline (NodeWrapper, index.mjs:2232-2240):
  │     zIndex, transform: translate(Xpx,Ypx), pointerEvents, visibility,
  │     ...node.style        ← per objectNode è undefined
  │     ...inlineDimensions  ← width/height DA node.width/node.height, scritti
  │                            SOLO dal NodeResizer (index.mjs:686-699)
  │   ► PORTA LE DIMENSIONI IN PIXEL. È il containing block di tutto ciò che segue.
  │
  └ div.mm-node.mm-object[.selected][.mm-object--orphan][hl-*]      ← ObjectNode.tsx:420
    │   EditorV2.scss:1208-1220 → min-width:140px; min-height:40px
    │   NIENTE width/height/position   ► width = auto (riempie) · height = auto (contenuto)
    │   ► È LA CARD VISIBILE. Non porta dimensioni esplicite.
    │
    ├ div.react-flow__resize-control.line.{top,right,bottom,left}.node-resize-line   ×4
    │   base.css:470-504 → position:absolute; width/height:100%; top/left:0|100%
    │   ► risolvono contro .react-flow__node (mm-node è static) = FRAME FANTASMA
    ├ div.react-flow__resize-control.handle.{top|bottom}.{left|right}.node-resize-handle ×4
    │   base.css:433-456 + EditorV2.scss:1047-1058 → 8×8, --resize-handle-bg/-border
    ├ (DynamicHandles → .react-flow__handle.mm-anchor ×N)
    ├ [span.singleton-badge]  ·  [NodeProblemIndicator]
    ├ div.mm-node__header.mm-object__header                          ← ObjectNode.tsx:441
    │   EditorV2.scss:1247-1257 (padding 4px 8px; min-height:22px) + 1640-1643
    │   └ span.mm-node__name.mm-object__name
    │       ├ span.mm-object__instance-name   {name}
    │       ├ span.mm-object__separator        " : "
    │       └ span.mm-object__class-name      {metaclassName}
    └ div.mm-node__body > div.mm-node__fields > righe "attr = valore"
```

Ramo IR (`ObjectNode.tsx:365-418`, quando `useIRView` risolve e la view non è una default
migrata): **identico** per wrapper, `NodeResizer`, `DynamicHandles` e classi — cambia solo il
contenuto (`IRNodeContent`). Qualunque intervento su maniglie/sizing va applicato a **entrambi i
rami**, altrimenti diverge.

Per completezza: la card classica `<view class="view root object jjodel-classic-object">` prodotta
da `utils/defaultViewTemplate.ts:154-172` via `components/forEndUser/Aliases.tsx:10-20` **non
viene renderizzata da nulla** oggi (§1). `styles/view.scss:8-11` (`.root { height:100%; width:100% }`)
resta nel bundle ma non ha più un antenato con altezza esplicita che la risolva.

---

## 9. Rischi individuati

**R1 — Il fix va scritto su `ObjectNode.tsx`/`EditorV2.scss`, non su `Measurable.tsx`.**
Il perimetro di lettura del prompt (`Measurable`, `graphElement`, `adaptSize`, `views.ts`) è quasi
tutto codice morto. Toccarlo produrrebbe zero effetti osservabili — è esattamente il fallimento
descritto in CLAUDE.md §5.1 ("verify consumers before assuming an output is load-bearing").

**R2 — Sopprimere le maniglie non elimina il frame fantasma.** Vedi §5.A: le linee del resizer
sono ancorate al wrapper. Il frame residuo va risolto o facendo riempire la card
(`height:100%` su `.mm-node`), o impedendo che il wrapper porti un'altezza divergente. Sono
due UX diverse e la scelta è di Alfonso (domanda D1).

**R3 — `.mm-node` è condiviso da tutti i tipi di nodo.** `ClassNode`, `EnumNode`, `PackageNode`,
`ObjectNode`, il ramo IR e il ramo `viewpoint-wrapper` usano la stessa classe base
(`EditorV2.scss:1208`). Aggiungere `height:100%` lì tocca **tutti** i nodi del canvas, incluso
`packageNode` che è l'unico con `style.width/height` reali e con figli annidati — regressione
plausibile sui container. Una regola scopata (`.react-flow__node-objectNode > .mm-node`) limita
il raggio ma introduce asimmetria fra tipi di nodo.

**R4 — Un cambio di `position` su `.mm-node` ha effetti collaterali.** Passare `.mm-node` a
`position:relative` riporterebbe frame e maniglie sulla card, ma cambierebbe anche il containing
block di `.singleton-badge`, di `.ir-collapse-chip` (`ObjectNode.tsx:400-402`,
`position:'absolute'; bottom:2; right:4`), del `NodeProblemIndicator` e dei `.react-flow__handle`
delle ancore. Da verificare visivamente su tutti i tipi di nodo prima di adottarlo.

**R5 — `NodeResizer` non è configurabile per-asse; serve scendere a `NodeResizeControl`.**
La firma di `NodeResizer` (`index.mjs:4835`) non espone quali posizioni montare: itera sempre
tutte e 8. Ma `NodeResizeControl` accetta `position`, `variant` e `resizeDirection`
(`index.mjs:4731`: `resizeDirection === 'horizontal' ? 'width' : 'height'` → `setAttributes`
parziale). Quindi la regola `f(view.resizable, adaptWidth, adaptHeight)` è **implementabile** in
editor-v2 sostituendo `<NodeResizer>` con un set calcolato di `<NodeResizeControl>`. Costo: due
punti di montaggio per `ObjectNode` (ramo nativo + ramo IR) più gli altri 4 tipi di nodo se si
vuole coerenza; `NodeResizeControl` non è oggi importato da nessuna parte.

**R6 — I flag `adapt*` non arrivano a `ObjectNode`.** Il componente riceve `NodeProps<ObjectNodeType>`;
la `data` (`ObjectNodeData`) non contiene `viewId` né i flag. `useIRView` risolve una view IR ma
solo per il ramo IR. Per pilotare le maniglie da `view.adaptWidth/adaptHeight` servirebbe un
canale nuovo (campo in `ObjectNodeData` popolato da `jjomTransformers`, oppure lettura Redux nel
componente). È il pezzo di plumbing più sostanzioso del fix e va dimensionato prima di partire.

**R7 — VersionFixer**: **non necessario** se il fix resta su CSS/TSX di editor-v2. Diventa
necessario solo se si cambiano i default in `redux/defaults/views.ts` (i valori sono persistiti
nei `DViewElement` dei progetti salvati e `updateDefaultView` rigenera solo le view rimaste
default) o se si tocca un jsxString (CLAUDE.md §3.9, rule 14). Da tenere fuori dalla Fase 2 se
possibile.

**R8 — Resize dell'Object non riletto** (§3.A, in coda). Bug preesistente e indipendente, ma se
la Fase 2 fa dipendere il layout dalla size memorizzata lo rende visibile. Da confermare a runtime
prima di decidere se includerlo.

---

## 10. Domande aperte per Alfonso

**D1 — Su quale editor stai osservando il sintomo?** La risposta cambia tutto il resto. Se è
l'editor che si apre normalmente oggi, è `ObjectNode` di editor-v2 e il perimetro del prompt va
riscritto. Se invece stai guardando un build vecchio, una tab deployata o un altro branch, dimmi
quale: il codice classico esiste solo in git prima di `e86c276f8` (2026-07-19).

**D2 — Qual è il comportamento voluto per l'Object, precisamente?** Due letture incompatibili
della stessa frase "niente box fantasma":
  (a) **card che abbraccia il contenuto** — nessuna maniglia, altezza e larghezza sempre dal
      contenuto, il wrapper non porta mai dimensioni esplicite. Coerente con `adapt*=true`, ma
      significa che **l'utente non può più allargare un Object** (oggi può, in larghezza).
  (b) **card che riempie il box** — le maniglie restano, la card cresce con il wrapper su
      entrambi gli assi. Elimina il fantasma senza togliere affordance, ma contraddice
      `adaptWidth=true`.
Serve un criterio di accettazione verificabile meccanicamente (CLAUDE.md §5.1), del tipo:
*"dopo un drag della maniglia bottom-right, il rect DOM di `.mm-object` e quello di
`.react-flow__node` coincidono entro ±1px su entrambi gli assi"* — oppure *"le maniglie non sono
presenti nel DOM e il rect di `.react-flow__node` uguaglia lo scrollHeight del contenuto"*.

**D3 — La regola per-asse deve valere su tutti i tipi di nodo o solo su `objectNode`?**
Estenderla a `classNode`/`enumNode` (entrambi `adapt*=true/true`, §7.1) toglierebbe loro le
maniglie: è voluto? `packageNode` (`adaptWidth=false, adaptHeight=true`) sotto la regola
perderebbe la maniglia verticale pur essendo il container che si ridimensiona di più.

**D4 — I flag `adapt*`/`resizable`/`draggable` sono ancora la fonte di verità voluta?**
Oggi sono inerti (§6.A): il pannello li mostra e li salva, nessuno li legge. Le alternative sono
(i) ricablarli fino a editor-v2 (R6), (ii) esprimere il sizing nell'IR e deprecare i flag legacy,
(iii) hardcodare il comportamento per tipo di nodo e nascondere i toggle. Prima di scrivere
plumbing vorrei sapere quale delle tre è la direzione.

**D5 — Il doppione di Singleton (`views.ts:646` sovrascritta da `:671`) è un bug o un residuo
voluto?** Se è un bug, la Singleton è oggi content-defined su entrambi gli assi quando forse
doveva essere free.

**D6 — Il resize perso al reload (R8/§3.A) è un sintomo che hai già osservato?** Se sì, è
probabilmente lo stesso problema visto da un'altra angolazione e conviene trattarlo insieme.

---

## 11. Nota di metodo

Tutte le conclusioni sopra derivano da lettura di codice e CSS, **non da osservazione a runtime**.
In particolare l'affermazione centrale di §3.A/§5.A — che `.mm-node` non riceve altezza e che il
frame è ancorato a `.react-flow__node` — è una deduzione dalle regole CSS, non una misura.
CLAUDE.md §5.1 impone di riprodurre lo stato cattivo sul codice corrente prima di costruirci
sopra un fix: la Fase 2 dovrebbe aprire un Object, selezionarlo, trascinare la maniglia
bottom-right e leggere `getBoundingClientRect()` di `.react-flow__node` e di `.mm-object`,
confermando che le altezze divergono e le larghezze no.

**HARD STOP.** Nessuna modifica al codice in questa fase.

---

## 12. Decisioni ratificate da Alfonso (2026-07-23, dopo la lettura del report)

**D1 — Editor**: il sintomo è su **editor-v2**. Il perimetro di lettura del prompt originale
(`Measurable.tsx`, `adaptSize`, `graphElement.tsx`, `redux/defaults/views.ts`) è **scartato**:
è codice morto (§1, §6). Il fix vive in `components/editor-v2/nodes/*.tsx` + `EditorV2.scss`.

**D2 — Semantica**: **regola per-asse** `f(view.resizable, adaptWidth, adaptHeight)`. Un asse
content-defined non espone maniglia su quell'asse **e** non riceve dimensione esplicita sul
wrapper (le due mosse di R2 insieme: senza la seconda il frame fantasma resta).

**D3 — Perimetro**: `objectNode`, `classNode`, `enumNode`. **`packageNode` escluso** — resta
com'è oggi, con `NodeResizer` invariato e `style.width/height` da `jjomTransformers.ts:228-232`.

**D4 — Sorgente dei valori**: **opzione 3, hardcode per tipo di nodo**, con l'**opzione 2
(sizing espresso nell'IR) annotata come destinazione**. I flag legacy restano inerti e i toggle
del pannello properties vanno nascosti o marcati come non operativi (mentirebbero).

### 12.1 Lettura combinata di D2 + D4 (da confermare in apertura di Fase 2)

D2 e D4 sembrano in conflitto: la prima dice "pilota dai flag della view", la seconda "non
cablare i flag". La lettura coerente è:

> la **semantica** è per-asse come in D2; la **sorgente** dei due booleani per-asse non è
> `view.adaptWidth/adaptHeight` letti a runtime (niente plumbing R6), ma una costante per tipo
> di nodo che **replica i valori che quelle view hanno oggi** in `views.ts`. Quando il sizing
> passerà nell'IR (destinazione annotata), quella costante diventa il punto unico da sostituire.

### 12.2 Conseguenza diretta della combinazione scelta

Dalla tabella §7.1, i tre tipi in perimetro hanno **tutti** `adaptWidth=true, adaptHeight=true`.
Sotto la regola per-asse questo significa, senza eccezioni:

| tipo | config | maniglie risultanti |
|---|---|---|
| `objectNode` | true / true | **nessuna** |
| `classNode` | true / true | **nessuna** |
| `enumNode` | true / true | **nessuna** |
| `packageNode` | fuori perimetro | invariate (tutte e 8) |

→ **Il resize a mano sparisce dal canvas per Object, Class ed Enum.** Resta solo sui Package.
È l'implicazione più pesante della combinazione D2+D3+D4 e va confermata esplicitamente prima
di scrivere codice.

Il feedback di selezione **non** si perde: `.mm-node.selected` (`EditorV2.scss:1222-1225`) e
`.mm-object.selected` (`:1707-1710`) danno bordo accent + box-shadow, indipendenti dal resizer.
Le maniglie erano un indicatore aggiuntivo, non l'unico.

### 12.3 Siti di montaggio in perimetro

Cinque `<NodeResizer>` da trattare (`packageNode:64` escluso):

| file | riga | ramo |
|---|---|---|
| `nodes/ObjectNode.tsx` | `:374-380` | ramo IR |
| `nodes/ObjectNode.tsx` | `:422-428` | ramo nativo |
| `nodes/ClassNode.tsx` | `:426-432` | ramo `viewpoint-wrapper` (`data.jsxString`) |
| `nodes/ClassNode.tsx` | `:480` | ramo nativo |
| `nodes/EnumNode.tsx` | `:158` | unico |

**Assunzione dichiarata**: il ramo IR di `ObjectNode` è trattato **insieme** al ramo nativo. Non
era selezionato esplicitamente in D3, ma è lo stesso tipo di nodo: lasciarlo fuori farebbe
comportare l'Object in modo diverso a seconda che una view IR risolva o no. Da vetare
esplicitamente se non è quello che vuoi.

### 12.4 Questione di scoping aperta per l'apertura della Fase 2

Con tutti e tre i tipi a `true/true`, l'**unico** ramo esercitato è "nessuna maniglia". La
macchina per-asse (sostituzione di `NodeResizer` con `NodeResizeControl` + `resizeDirection`,
R5) resterebbe **codice non esercitato** finché l'IR non produrrà configurazioni miste.

Due strade:
  - **(i) minimale** — montare condizionalmente `NodeResizer` (0 o 8 maniglie) e rimandare la
    granularità per-asse a quando serve. Diff piccolo, nessun import nuovo, nessun codice morto.
  - **(ii) generale** — costruire subito il set calcolato di `NodeResizeControl`, così la
    granularità per-asse è pronta e l'IR dovrà solo fornire i booleani.

Raccomandazione: **(i)**, coerente con la rule 6 di CLAUDE.md ("don't over-engineer simple
features") e con D4 che ha scelto esplicitamente la strada senza plumbing. La (ii) diventa
giustificata quando esiste almeno una configurazione mista reale.

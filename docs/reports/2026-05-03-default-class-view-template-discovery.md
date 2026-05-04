# Discovery: default class view template + interaction states

**Data**: 2026-05-03
**Branch**: alfonso-frontend-jjtl
**HEAD commit**: c45ab704294474f70266b5e0aeae36327184c447

---

## 1. Path di generazione

Esistono **due** path di generazione attivi sul branch corrente che producono lo stesso layout placeholder ("Name: …" + "To add information here, edit the view …"). Si differenziano per chi li chiama, per la registrazione del CSS iniziale, e per la fase storica del codice.

### 1A. Path primario (moderno) — usato dai context menu visibili oggi

- **File**: `frontend/src/utils/lastViewpoint.ts:152-164`
- **Funzione**: `createViewInWorkbench(elementId, elementName, className): boolean`
- **Crea il DViewElement** con `DViewElement.new2(viewName, jsxString, dViewpoint, callback, persist=true)` (view.tsx:280-287). Il callback imposta `oclCondition`, `appliableTo`, `appliableToClasses`, `css_MUST_RECOMPILE = true` ma **non** popola `d.css` né `d.palette`.
- **Nome generato**: `'View for ' + (elementName || 'unnamed')` (lastViewpoint.ts:147).
- **Risoluzione del viewpoint padre**: `resolveParentViewpoint()` (lastViewpoint.ts:63-94) — priorità: ultimo viewpoint editato in workbench → `LProject.getProject().activeViewpoint` → `Defaults.viewpoints[0]`.
- **Mapping per `className` argomento**:
  - `DClass` → `oclCondition: context DObject inv: self.instanceof.id = '${id}'`, `appliableTo: 'Vertex'`, `appliableToClasses: ['DObject']` (la view si applica alle istanze M1)
  - `DEnumerator` → `appliableTo: 'Vertex'` su `DEnumerator` self
  - `DModel` → `appliableTo: 'Graph'`
  - `DPackage` → `appliableTo: 'GraphVertex'`
- **Invocata da**:
  - `frontend/src/components/contextMenu/ContextMenu.tsx:640` — handler `addViewToWorkbench` (keybind / voce ctxmenu)
  - `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:68` — context menu della tree sidebar
  - `frontend/src/components/editor-v2/EditorV2.tsx:2302` — context menu del flow editor (visibile solo se `node?.type === 'classNode' || 'enumNode'`, etichetta `Create View [in "<vpName>"]`, icona `bi-eye`)

### 1B. Path legacy — keybind storici "Add View"

- **File**: `frontend/src/view/viewElement/view.tsx:289-375`
- **Funzione**: `LViewElement.newDefault(forData?: DModelElement | DGraphElement, forSelf: boolean = false): DViewElement`
- **Crea il DViewElement** sempre via `DViewElement.new2(...)` ma **popola anche** `d.css` (con regole `&>.root { border, gradient, min-width: 180px, ... }`) e `d.palette` (3 entry: `background-`, `border-color-`, `color-`).
- **Nome generato**: `'View for ' + l.name` se `forData` ha un nome (view.tsx:363), altrimenti `view_<className>0` con increment sufix.
- **OCL query** condizionale: per `DModel`/`DClass` usa `instanceof.id = …` (instances), per `DAttribute`/`DReference` usa `DValue inv: self.instanceof.id`, per gli altri usa `self.id = …`.
- **Invocata da**:
  - `ContextMenu.tsx:615, 618, 625, 628` — handler `addViewSelf` e `addViewInstances` (keybind dispatcher `addViewKeybind` a riga 644-650 sceglie l'una o l'altra in base a `cname`)

### Quale dei due genera il placeholder che l'utente vede

Quando l'utente apre il context menu sul nodo di una metaclasse e clicca **"Create View"** (label dinamica `Create View [in "<vpName>"]`, icona `bi-eye`), parte il **path 1A** (`createViewInWorkbench`). Il path 1B esiste ancora ma è raggiungibile solo via keystroke/menu legacy. Entrambi producono lo stesso layout visivo di placeholder; differiscono per il CSS iniziale (1A non popola `d.css`, 1B sì).

---

## 2. Template attuale

### jsxString completo

**Path 1A — `createViewInWorkbench` (lastViewpoint.ts:152-164)**:

```jsx
<View className={'root bg-white p-1'}>
    <div className={'header'}>
        {!data ? null :
            <label className={'input-container mx-2'}>
                <b className={'object-name'}>Name:</b>
                <Input data={data} field={'name'} hidden={true} autosize={true} placeholder={'enter name'}/>
            </label>
        }
    </div>
    <div className={'body'}>To add information here,<br/> edit the view<br/>"{view.name}"</div>
    {decorators}
</View>
```

**Path 1B — `LViewElement.newDefault` (view.tsx:290-305)**: identico per struttura, comincia con un commento `/* Jjodel Default View 2.1 */` e poi ripete lo stesso markup. Inoltre `newDefault` allega un CSS iniziale (view.tsx:315-333):

```scss
&>.root {
    border: 2px solid var(--border-color-1)!important;
    border-radius: 4px;
    background: linear-gradient(-45deg, var(--background-1) 0%, var(--background-2) 100%);
    color: var(--color-1);
    min-width: 180px;

    &>.header { border-bottom: 1px solid var(--border-color-1); }

    &>.body {
        text-align: center;
        height: auto;
        padding: 5px;
    }
}
```

(Le variabili `--background-1`, `--border-color-1`, `--color-1` provengono dalla `palette` impostata sullo stesso DViewElement; sono token "scoped per view", non globali.)

### Scope variabili runtime

Il template viene parsato e wrappato in una funzione runtime via `new Function(paramStr, body)` in `redux/reducer/reducer.ts:993-995`, dove `paramStr = '{' + Object.keys(allContextKeys).join(',') + '}'`.

`allContextKeys` parte da `contextFixedKeys` (definito in `frontend/src/graph/graphElement/sharedTypes/sharedTypes.tsx:220-238`, popolato da `EdgeOwnProps`, `EdgeStateProps`, `VertexOwnProps`, `VertexStateProps`) ed è esteso con i nomi dichiarati in `transientProperties.view[vid].constantsList` e `UDList`. Il context viene poi popolato runtime in `GraphElementComponent.getJSXContext` (`frontend/src/graph/graphElement/graphElement.tsx:647-661`) con `{...this.props, ...tv.constants, ...tnv.usageDeclarations, component, otherViews, constants, usageDeclarations, props}`.

Variabili effettivamente usate dal placeholder:

| Variabile | Tipo | Da dove proviene |
|-----------|------|------------------|
| `data` | `LModelElement` (es. `LObject` per il branch `DClass`) | redux state props (sharedTypes:48) — l'elemento M1 a cui la view si applica |
| `view` | `LViewElement` | redux state props (sharedTypes:38) — il DViewElement stesso (per `view.name`) |
| `decorators` | `(ReactNode \| ReactElement)[]` | iniettato in `renderView` (graphElement.tsx:1367) — array delle altre view non-exclusive applicate al nodo |

Variabili presenti nello scope ma **non usate** dal placeholder (utili al redesign):

| Variabile | Tipo | Note |
|-----------|------|------|
| `node` | `LGraphElement` | l'oggetto grafo (`LVoidVertex` per Vertex / `LEdge` per Edge); ha `node.isSelected` (Dictionary user→boolean) e `node.zIndex` |
| `views` | `LViewElement[]` | tutte le view applicabili; `view` ne è una |
| `nodeid` / `dataid` / `viewid` / `viewsid` / `parentviewid` | `Pointer<…>` | ID iniettati come props |
| `isVertex` / `isEdge` / `isGraph` / `isGraphVertex` / `isEdgePoint` / `isField` / `isVoid` | `boolean` | tipo del nodo correntemente in render |
| `parentnodeid` / `graphid` / `parentViewId` / `htmlindex` | `Pointer<…>` / `number` | iniettati dal framework |
| `viewpoint` | `LViewPoint` | il viewpoint root (sharedTypes:148, 209) |
| `isEdgePending` | `{ user: LUser, source: LClass }` | flag di drag-edge |
| `component` | `GraphElementComponent` | self-reference all'istanza React |
| `props` / `state` / `stateProps` / `ownProps` | `GObject` | snapshot dei props per debug |
| `constants` / `usageDeclarations` / `otherViews` | `GObject` | API runtime del template engine |

### Componenti template engine disponibili

I componenti utilizzabili nel jsxString vengono **registrati su `windoww`** (alias di `window`) in `frontend/src/joiner/ExecuteOnRead.ts:101-120`. La registrazione parte da `Componentss = import * from '../joiner/components'` e dal mapping su `windoww[k]`. Il fallback aggiuntivo (`*Component → *` senza il suffisso) è applicato alle voci che terminano con `Component`. La risoluzione del tag JSX a una funzione React passa per `factory: 'React.createElement'` (UX.tsx:441) → `windoww[name]`.

Lista dei componenti registrati come `<Tag>` user-facing (estratta da `cname = '...'` nei file in `frontend/src/components/forEndUser/`):

| Componente | File di registrazione | Note |
|------------|----------------------|------|
| `View` | `forEndUser/Aliases.tsx:19` | Wrapper root; emette `<view className={'view ' + className + ' ' + classNameAdd}>` (lowercase `<view>` custom element). `classNameAdd` viene iniettato dal framework con `Pointer_View_<id>` per CSS scoping. |
| `Input`, `TextArea`, `Select`, `Edit` | `forEndUser/Input.tsx:560-563` | Field connessi a `data`+`field`, supportano `hidden`, `autosize`, `placeholder` |
| `Color` (`ColorComponent`, `ColorConnected`) | `forEndUser/Color.tsx:238-240` | |
| `ContextMenu`, `ContextMenuC`, `ContextualEntry` | `forEndUser/ContextMenu.tsx:64-66` | Voci di menu contestuale |
| `Control`, `Slider`, `Toggle`, `Zoom`, `Panel`, `Panell`, `MetaElementPicker` (+ `*Component` paralleli) | `forEndUser/Control.tsx:652-666` | Pannelli e controlli laterali |
| `CountryPicker` (+ varianti) | `forEndUser/CountryPicker.tsx:391-393` | |
| `Function` (alias `FunctionComponent`) | `forEndUser/FunctionComponent.tsx:479-481` | |
| `Grid`, `GridComponent` | `forEndUser/grid.tsx:197-198` | Griglia di sfondo grafo |
| `GenericInput` | `forEndUser/GenericInput.tsx:276-277` | |
| `Image` (interna) | `forEndUser/Image.tsx:41-43` | |
| `Measurable`, `Scrollable`, `Draggable`, `Resizable`, `Rotatable`, `Viewport`, `ViewPort`, `Pan`, `Scalable`, `Transformable`, `Interactive` | `forEndUser/Measurable.tsx:624-636` | Wrapper interaction |
| `T2M`, `M2T` | `forEndUser/MTM.tsx:639-641` | Model⇄text bridges |
| `DefaultNode` | (ricerca su `windoww['DefaultNode']` da fare a parte; risolto come node renderer dei child) | Usato in DV.tsx per ricorrere su sub-element (`<DefaultNode key={c.id} data={c} />`) |
| `Edge`, `Tooltip`, `ClassicZoomBridge`, ecc. | registrati similmente; vedi DV.tsx per call sites | |

Il pattern di registrazione globale dell'elenco completo si trova in `ExecuteOnRead.ts:101-120`:

```ts
let wComponents: GObject = {...Components}
for (let key in wComponents) {
    let index = key.indexOf("Component")
    if (index === -1) continue;
    let newkey = key.substring(0, index);
    if ((Components as any)[newkey]) continue;
    (wComponents as any)[newkey] = (Components as any)[key];
}
windoww.Components = wComponents;
for (let k in wComponents) {
    if (windoww[k] && windoww[k] !== wComponents[k]) { console.warn(...); }
    else windoww[k] = wComponents[k];
}
```

### Hook usage nel template

**NO**: il template è una stringa che viene parsata da `JSXT.fromString(jsxString, {factory: 'React.createElement'})` (UX.tsx:441) e wrappata in una funzione costruita con `new Function('{vars}', 'return (...)')` (reducer.ts:995). Questa funzione viene chiamata a ogni render per produrre un `ReactNode`, non è essa stessa un componente React: i hook (`useState`, `useEffect`, ecc.) **non** sono utilizzabili — verrebbero invocati in un contesto dove non c'è `dispatcher` di React, e React lancerebbe `Hook can only be called inside the body of a function component`. Coerente con il vincolo template engine documentato in sessione 2026-05-01_3.

Inoltre il template literal (back-tick) viene processato anche da `DSL.parser(...)` in `reducer.ts:993` prima di passare a `UX.parseAndInject` — non è scope React, è puro JSX-to-React-createElement compilato runtime.

### Stili nel template

- **className**: Sì — il placeholder usa solo classi:
  - `'root bg-white p-1'` su `<View>` (root + Bootstrap utility classes)
  - `'header'` / `'body'` / `'object-name'` su elementi figli
  - `'input-container mx-2'` sul `<label>` (Bootstrap utility class `mx-2`)
- **Inline style**: NO nel placeholder. Path 1B aggiunge styling tramite `d.css` su variabili palette — non dentro il jsxString, ma fuori (campo separato del DViewElement compilato in CSS scoped).
- **Classi referenziate** e dove sono definite:

| Classe | Definita in | Note |
|--------|------------|------|
| `view` | `forEndUser/Aliases.tsx:16` (iniettata) | classe sempre presente sul root della `<View>` |
| `root` | `frontend/src/styles/view.scss:8-11` (`height: 100%; width: 100%`) | usata come ancora di scoping; in `diagram.scss` esistono varianti `.root.feature`, `.root.feature.attribute-row`, ecc. (308-369) |
| `bg-white`, `p-1`, `mx-2` | Bootstrap utility (caricato globalmente) | white background, padding 0.25rem, horizontal margin 0.5rem |
| `header` / `body` / `object-name` / `input-container` | **Non definite globalmente** per il placeholder | `grep -rn "\.object-name\|\.input-container" frontend/src/styles/` non restituisce match dedicati al placeholder. Lo styling effettivo viene dalla cascade di `view.scss` + `diagram.scss` ma non c'è una regola specifica del template — è il motivo per cui appare "grezzo". |

---

## 3. VersionFixer

- **File**: `frontend/src/redux/VersionFixer.tsx`
- **Versione corrente**: **2.211** (registrata via metodo `private ['2.210 -> 2.211']` a riga 605; `setup()` a riga 79-102 deduce `highestVersion` come massimo dei target nei nomi dei metodi)
- **Pattern di registrazione**: ogni migration è un metodo dell'istanza `VersionFixer` con nome formato `'<from> -> <to>'`. `setup()` itera `Object.getOwnPropertyNames(VersionFixer.prototype)`, splitta per `' -> '`, valida i numeri e popola `versionAdapters[from] = {n: to, f: methodRef}`. La pipeline `update()` (riga 104-151) applica le migration in catena finché non raggiunge `highestVersion`.

### Pattern di migration (esempio recente)

```tsx
// 2.210 → 2.211: M1 node rendering aligned to flow editor
// (header order + emphasis, feature operator =, value italic, no bottom padding).
// No data migration; auto-refresh of default views regenerates view.css from views.ts
// and jsxString templates from DV.tsx.
private ['2.210 -> 2.211'](s: DState): DState {
    return s;
}
```

Esempio di migration con dati (da `'2.205 -> 2.206'`, riga 502-519):

```tsx
private ['2.205 -> 2.206'](s: DState): DState {
    if (!s.RECOMPILE_LANGUAGE) s.RECOMPILE_LANGUAGE = [];
    for (let e of Object.values(s.idlookup) as any[]) {
        if (!e || typeof e !== 'object' || !e.className || !e.id) continue;
        if (!e.__childrenToSort) e.__childrenToSort = [];
        if (e.className === 'DParameter' && e.type) {
            let type = this.d(e.type, s);
            if (type && type.className === 'DOperation') e.type = Pointers.ESTRING;
        }
        if (e.className === 'DValue' && e.name?.toLowerCase() === 'name' && e.values[0]) {
            let o: DObject = this.d(e.father, s);
            if (o) o.name = e.values[0];
        }
    }
    return s;
}
```

### Match della view stale

Il refresh delle default view è separato dalle singole funzioni di migration: avviene una volta sola in `VersionFixer.update()` (VersionFixer.tsx:128-139), dopo aver eseguito tutta la catena di migration:

```tsx
// update default views (only actual view elements, skip DClass/DPackage/etc.)
for (let k in s.idlookup) {
    let e = s.idlookup[k];
    if (!e || typeof e !== 'object') continue;
    let cn = (e as any).className;
    if (cn !== 'DViewElement' && cn !== 'DViewPoint') continue;
    let v: DViewElement|DViewPoint = e as any;
    if (v.className.includes("View") && v.version !== VersionFixer.highestVersion && !v.clonedCounter){
        // NB: for untouched views clonedCounter is undefined, not 0.
        LViewElement.updateDefaultView(v, s);
    }
}
```

`LViewElement.updateDefaultView()` è in `frontend/src/view/viewElement/view.tsx:1728-1746`:

```tsx
static updateDefaultView(v: DViewElement | DViewPoint, state?: DState): void {
    let s = state || store.getState();
    let newView: DViewElement | DViewPoint = Defaults.defaultViewPointsMap[v.id] || Defaults.defaultViewsMap[v.id];
    if (!newView) return; // not a default view
    newView = {...newView} as DViewElement & DViewPoint;
    newView.css_MUST_RECOMPILE = true;
    newView.pointedBy = PointedBy.merge(newView, v);
    newView.subViews = {...newView.subViews, ...v.subViews};
    s.idlookup[v.id] = newView;
    if (state) return; // skip dispatch, LoadAction will be called later
    transientProperties.view[v.id] = new ViewTransientProperties();
    SetRootFieldAction.new('VIEWS_RECOMPILE_all', v.id, '+=', false);
}
```

**Logica di match**: la stale view viene **sostituita per ID** con `Defaults.defaultViewsMap[v.id]` (canonical default registrato a setup time). I criteri di applicabilità sono:

1. `className === 'DViewElement' || 'DViewPoint'` (filtro su classe)
2. `v.className.includes("View")` (filtro tautologico ma esplicito)
3. `v.version !== VersionFixer.highestVersion` (la view non è già aggiornata)
4. `!v.clonedCounter` (la view non è stata duplicata/personalizzata dall'utente — se l'utente l'ha clonata, è considerata "user-owned" e non viene toccata)
5. `Defaults.defaultViewsMap[v.id]` esiste (la view è registrata come canonical default)

**⚠️ Implicazione critica per il redesign**: le view create da `createViewInWorkbench` (path 1A) **non** vengono inserite in `Defaults.defaultViewsMap`. Hanno `id` runtime generato (non `Pointer_View<staticName>`), quindi `Defaults.defaultViewsMap[v.id]` è `undefined` e `updateDefaultView` ritorna immediatamente. **Aggiornare il jsxString del placeholder in `lastViewpoint.ts` modificherà solo le view create *dopo* la modifica; le view già esistenti nei progetti salvati conserveranno il vecchio template.**

Stesso ragionamento si applica al path 1B (`LViewElement.newDefault`): il DViewElement è creato con `id` runtime (non statico), quindi non è registrato come canonical default.

Per migrare le view già esistenti nei progetti, servirebbe una migration che **fa string-replace** del vecchio jsxString con quello nuovo, simile a quanto avviene in `'2.207 -> 2.208'` (VersionFixer.tsx:563-565):

```tsx
e.uri.split('jodel-react').join('jjodelreact');
```

oppure un approccio analogo a `'2.206 -> 2.207'` (riga 532-535) che fa `JSON.stringify(s) → split/join → JSON.parse(s)`.

---

## 4. Stato di selezione

### 4.1 Flow editor

**Meccanismo**: React Flow (`@xyflow/react`) passa la prop `selected: boolean` ai custom node component. I node component compongono manualmente la classe `'selected'` nel `className`.

**Snippet rappresentativo** (`frontend/src/components/editor-v2/nodes/ClassNode.tsx:23, 246`):

```tsx
function ClassNode({ id, data, selected }: NodeProps<ClassNodeType>) {
    // ...
    return (
        <div
            className={`mm-node mm-class ${selected ? 'selected' : ''} ${isAbstract ? 'abstract' : ''} ${isSingleton ? 'singleton' : ''} ${dragOver ? 'drop-target' : ''}`}
            // ...
        >
```

Lo stesso pattern in `ObjectNode.tsx`, `EnumNode.tsx`, `PackageNode.tsx` (tutti destructurano `selected` e lo accodano al className). `ClassNode.tsx:215` ha anche una variante `viewpoint-wrapper` con `${selected ? 'selected' : ''}`.

**Regole CSS esistenti per `.selected` nei nodi flow** (in `frontend/src/components/editor-v2/EditorV2.scss`):

| Riga | Selettore | Stile |
|------|-----------|-------|
| 1088 | `.react-flow__node.selected .mm-anchor.mm-anchor--connected` | tweak ancore |
| 1193 | `.mm-node` → `&.selected` | `border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--accent-muted), 0 4px 16px var(--node-shadow-deep, ...)` |
| 1210 | `.mm-node.viewpoint-wrapper` → `&.selected` | `outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 4px` |
| 1396, 1418, 1510 | varianti per altri tipi di nodo | ognuno con border-color o outline accent |
| 1749 | `&.selected` annidato | tweak interni |
| 1844, 1858, 1891 | edge-related | |
| 1927 | `.react-flow__edge.selected .react-flow__edge-path` | stile edge selected |

Il pattern stilistico ricorrente: `border-color: var(--color-accent)` + `box-shadow: 0 0 0 2px var(--accent-muted), …`. Coerente con il punto chiarito nella discovery `2026-05-01-active-editor-zoom-diagnostic.md`: `--color-accent` resolva a slate-700 (`#334155` light / `#94a3b8` dark), **non** a cyan. L'unico cyan `#0ea5e9` su token attivi è `--color-toolbar-btn-active-text`.

### 4.2 Classic editor

**Meccanismo**: la selezione classica è **per-utente** (multi-collab). Vive nel campo `DGraphElement.isSelected: Dictionary<Pointer<DUser>, boolean>` (Dictionary userID → boolean). `GraphElementComponent` ne deriva due classi CSS che vengono iniettate sul root del template renderizzato.

**Snippet rappresentativo** (`frontend/src/graph/graphElement/graphElement.tsx:1280-1289, 1418-1431`):

```tsx
/// set classes
if (this.props.node) {
    let isSelected: Dictionary<Pointer<DUser>, boolean> = this.props.node.__raw.isSelected;
    if(isSelected) {
        if (isSelected[DUser.current]) { // todo: better to just use css attribute selectors [data-userselecting = "userID"]
            classes.push('selected-by-me');
            if (Object.keys(isSelected).length > 1) classes.push('selected-by-others');
        } else if (Object.keys(isSelected).length) classes.push('selected-by-others');
    }
}
classes.push(this.props.data?.className || 'DVoid');
// ... poi più sotto, riga 1418:
classes.push("mainView", dv.id);
classes.push(...subViewsID);
// ... le `classes` vengono appese al rawRElement (root del template) con anche:
//   "data-userselecting": JSON.stringify(props.node?.isSelected || {})  (riga 1431)
```

Le classi vengono iniettate sul `rawRElement` (cioè il `<View>` root del jsxString del template — UX.tsx riinietta classes su `injectProps.className`). Il `<View>` di Aliases.tsx già combina `classNameAdd` (iniettato dal framework) con `className` user-defined; l'iniezione di `selected-by-me` arriva attraverso questo stesso meccanismo.

**Regole CSS esistenti per la selezione classic**:

- `frontend/src/styles/view.scss:24-34`:
  ```scss
  .resize-shadow { outline: 1px dotted var(--color-text-primary); }
  .selected-by-me { outline: 2px dashed var(--color-accent); }
  .selected-by-others { outline: 2px dashed var(--color-info); }
  ```
- `frontend/src/styles/diagram.scss:755-775` (più strutturate, con varianti per Vertex/GraphVertex):
  ```scss
  .selected-by-me {
    outline: 1px dashed var(--color-accent, #5B8266);
    outline-offset: 1px;
    &.Vertex, &.GraphVertex {
      box-shadow: 0 0 0 2px var(--color-accent-muted, rgba(91, 130, 102, 0.12)), var(--shadow-sm);
    }
  }
  .selected-by-others {
    outline: 1px dashed var(--color-info, #3b82f6);
    outline-offset: 1px;
    &.Vertex, &.GraphVertex {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12), var(--shadow-sm);
    }
  }
  ```
- `frontend/src/styles/diagram.scss:616-622, 831-834`: override per `.Edge` (rimuove outline, gestisce con stroke).
- `frontend/src/graph/graphElement/graphElement.tsx:1431` aggiunge anche l'attributo `data-userselecting={JSON.stringify(props.node?.isSelected || {})}` sul root, **non ancora sfruttato in CSS** (nota TODO `// todo: better to just use css attribute selectors [data-userselecting = "userID"]`).

**Divergenza naming chiave**: il flow editor usa `'.selected'`, il classic editor usa `'.selected-by-me'`. Per il redesign che vive in SCSS esterno servono **due selettori paralleli** (oppure un unico selettore composto come `.selected, .selected-by-me`).

### 4.3 Convenzioni esistenti

**File SCSS dedicati ai nodi default**:

| File | Scope |
|------|-------|
| `frontend/src/styles/view.scss` (37 righe) | Importato in `App.tsx:3`. Definisce `.root` (height/width 100%), `.selected-by-me`, `.selected-by-others`, override `.default.DPackage > .root`. Importa `./variables`. |
| `frontend/src/styles/diagram.scss` (~900 righe) | Stile dei nodi classic per tipo (`.class`, `.enumerator`, `.package`, `.feature`, `.attribute-row`, `.reference-row`, `.operation-row`), edge, label, selection states (`.selected-by-me`/`.selected-by-others` riga 755), dark theme overrides (riga 783+), edge positioning. Hover patterns abbondanti (`grep ':hover'` → 14 occorrenze: righe 50, 143, 227, 259, 283, 317, 378, 461, 487, 592-593, 640). |
| `frontend/src/components/editor-v2/EditorV2.scss` (~2000 righe) | Stile flow editor (`.mm-node`, `.mm-class`, `.react-flow__*`). Selezione tramite `&.selected`. |
| `frontend/src/components/editor-v2/nodes/*.tsx` | Custom node components — non hanno SCSS dedicati per il content, condividono `EditorV2.scss`. |

**Naming convention prevalente**: kebab-case in CSS, applicato sia ai nodi flow (`.mm-node`, `.mm-class`, `.react-flow__node`) sia al classic (`.selected-by-me`, `.attribute-row`, `.reference-row`, `.section-separator`). Esiste un prefisso `.mm-` per il flow editor (mm = metamodel?). Il classic non ha prefisso dedicato.

Per il jsxString interno del template, la convenzione attuale è anch'essa kebab-case (es. `'object-name'`, `'input-container'`, `'features-section'`, `'attributes-section'`, `'class-body'`). Le utility classes Bootstrap (`bg-white`, `p-1`, `mx-2`, `me-1`) sono usate inline nei jsxString di DV.tsx e nel placeholder.

**Pattern cyan accent (`#0ea5e9` / `--color-cyan-*` / `--color-accent`) già in uso**:

- `frontend/src/components/editor-v2/EditorV2.scss`: `var(--color-accent)` su righe 140, 293, 367, 440, 446, 452, 475, 636, 711, 995, 1094, 1163, 1194, 1199, 1211, 1638, 1684, 1751, 1978, 1985 — usato per border-color, color, outline degli stati selected/active/hover dei nodi flow. **Importante**: alcuni file (questo incluso) hanno fallback `var(--color-accent, #0ea5e9)` ma il fallback non è mai attivato in pratica perché il token è sempre definito (slate-700 light, slate-400 dark) — vedi `2026-05-01-active-editor-zoom-diagnostic.md` Sintomo 1.
- `frontend/src/styles/tokens/_colors-light.scss:279`: `--color-toolbar-btn-active-text: #0ea5e9` — l'unico token semantico cyan vero.
- `frontend/src/styles/diagram.scss:755, 766`: `outline: 1px dashed var(--color-accent, #5B8266)` (fallback sage), `var(--color-info, #3b82f6)` (blu) — convenzioni divergenti dal flow.

Coerente con CLAUDE.md: cyan riservato a focus/active/link, mai a background. `--color-accent` è il token semantico **slate**. Per applicare cyan come pill background del tipo (richiesta del redesign "Minimal clean") va usato un token nuovo o un literal `#0ea5e9` documentato come eccezione.

---

## 5. Aspetti collaterali

- **Bootstrap Icons in jsxString runtime**: **NO nel placeholder**. Sì in altri jsxString di `DV.tsx`: `bi-exclamation-diamond-fill` (DV.tsx:1304, default error), `bi-1-square` (1420, singleton icon su class), `bi-arrow-up`/`-down`/`-left` (1443/1445/1448, inheritance/refs indicators), `bi-explicit-fill` (1544, enum), `bi-box-arrow-up-right` (1573, external feature). Sì anche nel context menu del flow editor (`bi-eye` per la voce "Create View", EditorV2.tsx:2292). Le `bi bi-*` funzionano dentro un jsxString runtime perché il CSS Bootstrap Icons è caricato globalmente.
- **Styling del default class view**: **className-only** nel placeholder. Inline styles **assenti** nel template generato da `createViewInWorkbench`. Inline styles **presenti** in altri template di DV.tsx (es. `DefaultView.class()` riga 1366-1373 ha `style={{...}}` con `--outlineColor`, `--borderColor`, `fontFamily`).
- **Larghezza fissa nel template**: **NO** nel placeholder generato da `createViewInWorkbench` — non ci sono `width`/`min-width` né nello jsxString né nel CSS (perché `d.css` non viene popolato). La width sarà `auto` (contenuto + padding `p-1` di Bootstrap).
  Il path 1B (`LViewElement.newDefault`) imposta invece `min-width: 180px` nel CSS attached (view.tsx:320).

---

## 6. Nota libera

### Osservazioni utili al redesign

1. **Due path generano lo stesso layout placeholder, ma con CSS divergenti.** Se il redesign aggiorna lo jsxString in `lastViewpoint.ts`, andrebbe aggiornato in parallelo anche `view.tsx:289-305` (path 1B) per evitare drift. In alternativa, valutare di rimpiazzare il path 1B con una chiamata a `createViewInWorkbench` (i call site sono pochi: 4 in `ContextMenu.tsx` per i keystroke).

2. **Migration delle view già esistenti.** Come segnalato in §3, `updateDefaultView` non aggiorna le view create runtime. Per propagare il nuovo placeholder ai progetti già salvati serve una migration esplicita in `VersionFixer` (es. `'2.211 -> 2.212'`) che:
   - itera `s.idlookup`, filtra `DViewElement` con jsxString che contiene la firma del placeholder vecchio (es. il letterale `"To add information here,<br/> edit the view"` o `'<View className={\'root bg-white p-1\'}>'`)
   - sostituisce in-place con il nuovo jsxString
   Oppure una migration "string-replace globale" sullo stato serializzato (pattern `'2.207 -> 2.208'`).

3. **Naming divergenza flow vs classic per la selezione.** Per evitare di duplicare le regole nel SCSS del redesign:
   - opzione A: applicare entrambi i selettori `&.selected, &.selected-by-me { ... }` nel SCSS
   - opzione B: aggiungere un'inietzione di `selected` (oltre a `selected-by-me`) nel `GraphElementComponent.componentRender` per uniformare. **Sconsigliato** perché `selected` (senza qualifier) è semantica multi-utente debole — il classic gestisce intenzionalmente "selected by current user" vs "selected by collaborators".
   - opzione C: usare il TODO già lasciato in graphElement.tsx:1284 (`[data-userselecting = "userID"]`) e introdurre selettori CSS attribute-based; richiede però tooling di matching cross-user.

4. **`<View>` aggiunge `'view'` come classe sempre presente.** Aliases.tsx:16 fa `'view ' + className + ' ' + addClasses`. Quindi il SCSS può puntare a `view.root` o `.view.root` — al momento `view.scss:8` usa solo `.root` che è troppo generico (può collidere con altre `.root` nel codebase). Il CSS scoping `.Pointer_View_<id>` (iniettato come `classNameAdd`) è il meccanismo "ufficiale" per limitare il blast radius — ma vale solo per CSS settato in `d.css` per quel DViewElement specifico, non per il SCSS globale. Per il redesign in SCSS esterno, suggerisco un selettore tipo `view.root.placeholder-default` (aggiungendo una classe `placeholder-default` al jsxString) per ancorare le regole senza colliderre con altre `.root`.

5. **Il `<View>` runtime emette `<view>` lowercase (custom HTML element).** Aliases.tsx:17. Il browser lo accetta come "unknown element" senza semantica — rendering identico a `<div>` ma con `display:inline` di default (HTML5 unknown → inline). Il classic CSS si appoggia probabilmente al `display` dichiarato sul container, non sul `<view>` element.

6. **Scope conoscibile lato template engine**. Nel paper/doc finale del redesign, mettere in chiaro che le variabili runtime accessibili (oltre a `data`/`view`/`decorators`) includono `node`, `views`, `viewpoint`, `isVertex`, ecc. — sono stati storicamente sottoutilizzati dai placeholder ma utili: ad esempio `node.isSelected[DUser.current]` permetterebbe di inserire interaction-state hint nel template stesso (es. mostrare un'icona "edit" solo quando selezionato). Non è strettamente necessario per il redesign attuale (gli interaction states andranno in SCSS esterno) ma utile da segnalare.

7. **Nessun bug evidente individuato durante la lettura.** Il pattern di selezione classic è coerente, il VersionFixer è ben strutturato, i due path di generazione coesistono in modo pulito (anche se sarebbe più sano consolidarli a uno).

# Discovery — Identity binding nome istanza ↔ slot `name`
**Data**: 2026-05-25
**Branch**: alfonso-frontend-jjtl
**Eseguito da**: Claude Code (sola lettura)

## Sintesi esecutiva

Il binding bidirezionale slot `name` ↔ `DObject.name` **esiste già nel codice oggi**, ma con caratteristiche divergenti rispetto alla specifica prevista:

1. **Matching identity è già implicito ma case-INsensitive** (`name.toLowerCase() === 'name'`), senza verifica di tipo `EString`, senza verifica di cardinalità `[0..1]`. Vive in 4 punti: `LValue.get_values` (read fallback), `LValue.get_setValueAtPosition` (write propagation), `LObject.get_name` / `set_name`, `Selectors.getName`.
2. **Esiste già `DAttribute.isID: boolean`** ma è commentato `// ? exist in ecore as "iD" ?` e **non è collegato** all'import/export Ecore né a logica di binding identity. Esposto solo come toggle UI generico ed in JjScript.
3. **`DObject.name` è un campo persistente reale** (non derivato): un campo `initialName` separato **non esiste**; il fallback verso `data.name` quando lo slot è vuoto è una proprietà emergente del codice di lettura, non del modello dati.
4. **Counter auto-naming generico esiste già** (`DPointerTargetable.defaultname` → `<ClassName>_<N>`), ma viene **bypassato dal v2-flow** (`syncCreateObject` passa sempre `obj_<timestamp>`); usato invece dall'import XMI/Ecore e da `LValue.addObject`/`LModel.addObject` (classic editor).
5. **VersionFixer ha già una migration analoga** (2.205 → 2.206) che propaga `DValue(name).values[0]` → `DObject.name`; può essere usata come riferimento.

Conseguenza: il "core" dell'identity binding è già funzionante in modo non strutturato e silenzioso. La feature richiesta è in larga parte una **formalizzazione + ristretto delle condizioni di match + introduzione di `initialName` per separare cleanly l'auto-name dal valore dello slot**.

---

## 1. Struttura DObject.name

### Dove vive
- **D-layer** `DObject` in `frontend/src/model/logicWrapper/LModelElement.tsx:5651` (`extends DModelElement // extends DNamedElement, m1 class instance`)
  - Campo top-level: `name!: string` (LModelElement.tsx:5661)
  - Eredita slot tramite mixin `DNamedElement` (LModelElement.tsx:1115-1137)
- **L-layer** `LObject` in `frontend/src/model/logicWrapper/LModelElement.tsx:5687` (`extends LNamedElement`)
  - Campo top-level: `name!: string` (LModelElement.tsx:5704)

### Getter L-layer (LObject.get_name) — già "slot-aware"

`LModelElement.tsx:5730-5732`:
```typescript
protected get_name(context: Context): this['name'] {
    return (context.proxyObject as GObject)['$name']?.value || context.data.name || context.proxyObject.instanceof?.name;
}
```

Ordine di fallback:
1. `$name?.value` — valore primario dello slot M1 (LValue.value)
2. `context.data.name` — campo persistente DObject.name
3. `context.proxyObject.instanceof?.name` — nome della classe M2 (extremo fallback)

### Setter L-layer — esistono **2 set_name** che convergono

#### Base `LPointerTargetable.set_name` — `frontend/src/joiner/classes.ts:2136-2161`

```typescript
protected set_name(val: this["name"], c: Context): boolean {
    let name = val;
    if (c.data.name === name) return true;
    const father: LPointerTargetable = (c.proxyObject as LModelElement).father;
    if (father) {
        const check = (father as LModelElement).children?.filter((child) => {
            return child.id !== c.data.id && (D.fromPointer(child.id) as DNamedElement).name === name;
        });
        if (check.length > 0) {
            toast.error(`Element name "${name}" is already taken in this scope`, ...);
            return true;
        }
    }
    TRANSACTION(this.get_name(c)+'.name', ()=>{
        let nameattribute = (c.proxyObject as any).$name;
        if (nameattribute && nameattribute.className === 'LValue') {
            nameattribute.value = val;          // ← write slot
        }
        SetFieldAction.new(c.data, 'name', name, '', false);  // ← write DObject.name
    }, undefined, val)
    return true;
}
```

#### Override `LObject.set_name` — `frontend/src/model/logicWrapper/LModelElement.tsx:5987-6012`

Stessa semantica del base, sostituisce la validazione di sibling-name con `validateNameUniqueness` (vedi `frontend/src/model/logicWrapper/nameUniqueness.ts:79-88`).

### Setter LClass.set_name aggiunta — `LModelElement.tsx:3054-3059`

```typescript
protected set_name(val: this["name"], context: Context): boolean {
    if (context.data.name === val) return true;
    super.set_name(val, context);
    SetRootFieldAction.new('ClassNameChanged.'+context.data.id, val, '', false);
    return true;
}
```

Dispatcha evento globale `ClassNameChanged.<id>` per refresh di UI dipendenti.

### LModel.set_name è speciale — `LModelElement.tsx:5300-5317`

Per LModel **non scrive sullo slot** (LModel è top container, non ha slot `name` propri). Solo `SetFieldAction.new(c.data, 'name', val, '', false)` + aggiornamento del tab title.

### Conclusione punto 1

- `name` è un campo **top-level di DObject** (non subobject)
- Il proxy L-layer ha **già** un setter unico (con override gerarchici) che scrive su entrambi i lati
- Non c'è un "set_name disperso": tutte le scritture passano dal proxy `set_name` o dalla scrittura diretta del DValue.values via `setValueAtPosition`

---

## 2. Counter naming auto

### Implementazione esistente

`frontend/src/joiner/classes.ts:1424-1443`:
```typescript
static defaultname<L>(startingPrefix: string | ((meta:L)=>string),
                     father?: Pointer | DPointerTargetable | ((a:string)=>boolean),
                     metaptr?: Pointer | null): string {
    let lfather: LModelElement;
    if (father) {
        if (typeof father === "string" || (father as any).className) {
            lfather = LPointerTargetable.wrap(father as DModelElement) as LModelElement;
            if (!lfather) return (typeof startingPrefix === "string" ? startingPrefix : "unnamed_elem");
            if (typeof startingPrefix !== "string") {
                let meta = LPointerTargetable.from(metaptr as Pointer);
                startingPrefix = startingPrefix(meta as L);
            }
            const childrenNames: (string)[] = lfather.childNames;
            return U.increaseEndingNumber(startingPrefix + '0', false, false, (newname) => childrenNames.indexOf(newname) >= 0);
        }
        ...
    }
    return startingPrefix + "1";
}
```

- Per ogni nuovo elemento, calcola `<startingPrefix>0`, `<startingPrefix>1`, ... finché non trova un nome libero rispetto a `father.childNames`.
- Convenzione: `startingPrefix` per `DObject.new` è `(meta) => (meta?.name || "obj") + "_"`, quindi per la classe `Department` produce `Department_1`, `Department_2`, …
- **Per progetto**: no, è **per father (scope locale)**. Per un DObject di una classe X istanziato nel DModel M, il counter parte da 0 e cerca il primo numero libero tra le `childNames` di M.

### Chiamata in `DObject.new`

`LModelElement.tsx:5668-5681`:
```typescript
public static new(instanceoff?: DObject["instanceof"], father?: DObject["father"],
                  fatherType?: typeof DModel | typeof DValue, name?: DNamedElement["name"],
                  persist: boolean = true): DObject {
    if (!name) name = this.defaultname(((meta: LNamedElement) => (meta?.name || "obj") + "_"),
                                       father, instanceoff);
    let ret = new Constructors(new DObject('dwc'), father, persist, fatherType)
        .DPointerTargetable().DModelElement()
        .DNamedElement(name).DObject(instanceoff).end();
    return ret;
}
```

`defaultname` viene chiamato **solo se `name` è falsy**.

### Quando il counter NON viene usato — AMBIGUO/divergente

#### v2-flow `syncCreateObject` (canvasToJjom.ts:1137)
```typescript
const name = objectName || `obj_${Date.now().toString(36).slice(-4)}`;
```
Se `objectName` non è fornito, **costruisce un nome timestamp-based** (`obj_<4chars>`) prima di chiamare `DObject.new`. Quindi `defaultname` **non viene mai invocato** dal v2-flow editor.

Conseguenza pratica: l'auto-naming `Department_1, _2, _3` **non avviene** quando si crea un'istanza dal v2-flow. Si ottiene invece `obj_lk5j`, `obj_lk5m`, … Per la feature identity binding questo è da uniformare.

#### XMI import (`XMIService.ts:629, 650`)
```typescript
const dObject: DObject = DObject.new(metaClass.id, dModel.id, DModel, undefined, true);
```
Passa esplicitamente `undefined` → triggera `defaultname` → `<className>_<N>`.

#### Ecore (.ecore) import (`api/data.ts:588`)
```typescript
let dObject: DObject = DObject.new(meta?.id, parent.id, parentType, json["name"] as string || "obj_1");
```
Tenta di leggere `json["name"]` (chiave dell'XML interpretato come JSON). Se assente, **literal `"obj_1"`** (non `defaultname`). Vedi sezione 7 per dettaglio.

#### Classic editor via `LValue.addObject` (`LModelElement.tsx:6850-6852`)
```typescript
TRANSACTION(this.get_name(c as any)+'.addObject()', () => {
    let dobj = DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true);
    ...
})
```
`DObject.new3` chiama `defaultname` se `constructorPointers.name` è assente (LModelElement.tsx:5677). Conseguenza: il classic editor usa l'auto-naming corretto.

### Conclusione punto 2

- **Counter "per scope (father)"** già esistente in `defaultname`
- **Generatore di prefisso class-aware** già esistente in `DObject.new/new3`
- **AMBIGUO**: il v2-flow usa un naming alternativo (`obj_<timestamp>`) che bypassa `defaultname`. La feature identity binding dovrà uniformare il path v2-flow.

---

## 3. Rename handlers

Tutte le scritture su `DObject.name` (o equivalente proxy L-layer) sono state mappate.

### 3.1 v2-flow canvas — doppio click su titolo box istanza

`frontend/src/components/editor-v2/nodes/ObjectNode.tsx:186-217`

```typescript
const handleDoubleClick = useCallback(() => { setEditing(true); }, []);

const commitName = useCallback(() => {
    setEditing(false);
    if (name !== lastCommittedName.current) {
        lastCommittedName.current = name;
        editorContext?.takeSnapshot();
        setNodes((nds) => nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, label: name } } : n
        ));
        syncNodeLabel(id, name);  // ← write sync
    }
}, [id, name, setNodes, editorContext]);
```

Pipeline: `commitName` → `syncNodeLabel(id, name)` → `canvasToJjom.ts:355-366`:
```typescript
export function syncNodeLabel(vertexId: string, newName: string): void {
    const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
    const model = vertexProxy?.model;
    if (model) {
        model.name = newName;  // ← L-proxy setter (set_name)
    }
}
```

API usata: **proxy setter assignment** (`lObject.name = X`) → `set_name` cascade (vedi punto 1).

### 3.2 v2-flow canvas — doppio click su titolo box classe (M2)

`frontend/src/components/editor-v2/nodes/ClassNode.tsx:137-170`

Identica struttura a ObjectNode (`handleDoubleClick` → `commitName` → `syncNodeLabel`). Stesso punto di scrittura `canvasToJjom.ts:361`. Differenza: `vertexProxy.model` è un **LClass** anziché LObject → triggera `LClass.set_name` (LModelElement.tsx:3054).

### 3.3 v2-flow — Properties panel M1 (`M1PropertiesPanel.tsx:31-36`)

```typescript
const commitName = useCallback(() => {
    if (name !== nodeData.label) {
        onNodeChange(selectedNode.id, { label: name });
        syncNodeLabel(selectedNode.id, name);  // ← stesso syncNodeLabel
    }
}, [...]);
```

Stesso path di 3.1.

### 3.4 Classic editor — Properties panel (Info.tsx)

`frontend/src/components/editors/Info.tsx:285-294`:
```typescript
static named(data: LModelElement, ...): ReactNode {
    return (<>
        ...
        <div className="jj-field">
            <label className="jj-field-label">Name <span className="jj-field-required">*</span></label>
            <Input data={data} field={'name'} type={'text'} />
        </div>
    </>);
}
```

Pipeline: `Input` component → `onBlur/confirmValue` → `data['name'] = serializeValue(newValue)` (Input.tsx:243) → L-proxy setter `set_name`.

API: **proxy setter assignment** sul campo `name`.

### 3.5 TreeViewSidebar — solo View, NON Object

`frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:1284-1313`

L'inline rename del TreeView **funziona solo per `DViewElement`**, non per istanze M1:
```typescript
const submitRenameView = useCallback((lView: LViewElement) => {
    const newName = renameValue.trim();
    if (newName && newName !== lView.name) {
        lView.name = newName;  // L-proxy setter, undo-tracked
    }
    ...
}, [renameValue, isFirstRename]);
```

**AMBIGUO**: non sono stati trovati handler di rename M1 direttamente nel TreeViewSidebar. Il rename istanza nel tree probabilmente passa attraverso il Properties panel selezionando il nodo.

### 3.6 Rename programmatico

#### Import (Ecore/XMI)
- XMI: `DObject.new(..., undefined, true)` → defaultname (`<className>_<N>`); poi slot `name` popolato via `DValue.new` con i valori XML → propagazione automatica al DObject.name via `setValueAtPosition` (line 7399-7401, sez. 8)
- Ecore: `DObject.new(..., json["name"] as string || "obj_1", ...)` → da chiave JSON o literal

#### JjTL execution (`frontend/src/components/project/ProjectEditor.tsx:1585`)
```typescript
const dObject = DObject.new(targetClass.id, dModel.id, DModel, objectName, true);
```
`objectName` è il nome calcolato dalla transformation.

#### JjScript (`frontend/src/jjscript/executor/commands/instance.ts:225`)
```typescript
// DObject.new(instanceof, father, fatherType, name, persist)
```
Passa `name` dal comando utente.

### Conclusione punto 3

**Tutte le scritture su DObject.name** convergono su uno dei due path:
1. Proxy L-layer `set_name` (TreeView, Info, sync v2-flow tramite `model.name = X`)
2. `setValueAtPosition` sullo slot `name` (Info panel value editor, XMI/Ecore import via DValue.new — vedi punto 8)

Entrambi i path scrivono già su **entrambi** i lati (slot LValue + DObject.name field). Il binding è bidirezionale di fatto. Quello che cambierà con la feature è:
- Restringere il match (case-sensitive + tipo EString + cardinalità [0..1])
- Aggiungere `initialName` come campo separato
- Rendere `DObject.name` derivato (getter computato)

---

## 4. Slot editor Properties panel

### Componente che renderizza lo slot M1

`frontend/src/components/editors/Info.tsx:587-806` — metodo `static value(...)` della classe `builder`.

Struttura del rendering (riferimento `tab` mode, linea 773-806):
```jsx
<div className="jj-slot">
    <div className="jj-slot-header">
        <span className="jj-slot-name">{data.name}</span>
        <span className="jj-slot-multiplicity">[{lower}..{upper}]</span>
        <span className="jj-slot-type">{typeName}</span>
        {(upperBound === -1 || filteredValues.length < upperBound) && (
            <button className="jj-slot-add" onClick={add}>+</button>
        )}
    </div>
    <div className="jj-slot-values">
        {filteredValues.length === 0 ? <div className="jj-slot-empty">No values</div> : valueslist}
    </div>
</div>
```

Per ogni valore della lista, viene reso un `<Input>` (attribute) o `<select>` (reference/enum) seguito dal pulsante `"×"` (`Info.tsx:762-764`):
```jsx
{!isSingleRequired && (
    <button className="jj-slot-value-delete" onClick={() => {remove(index, isPtr)}} title="Remove value">×</button>
)}
```

### Scrittura sul slot (edit)

`Info.tsx:626-647` — funzione `changeDValue`:
```typescript
function changeDValue(evt, index, isPointer) {
    TRANSACTION('change value (sidebar)', ()=>{
        value = value.r;
        let target = evt.target as HTMLInputElement;
        let inputValue = field === 'checkbox' ? target.checked : target.value;
        if (inputValue === 'undefined') inputValue = undefined;
        ...
        let result = value.setValueAtPosition(index, inputValue, {isPtr: isPointer});
    })
}
```

API usata: **`LValue.setValueAtPosition(index, val, {isPtr})`**. Wrap in TRANSACTION manuale.

### Clear dello slot (×)

`Info.tsx:617-625` — funzione `remove`:
```typescript
const remove = (index: number, isPointer: boolean | undefined) => {
    value = value.r;
    if (isPointer === undefined) isPointer = Pointers.isPointer(filteredValues[index].rawValue);
    let result = value.setValueAtPosition(index, undefined, {isPtr: isPointer});
}
```

API usata: **`setValueAtPosition(index, undefined, {isPtr})`** — passare `undefined` come val ↔ clear.

NB: `setValueAtPosition` apre la propria TRANSACTION internamente (LModelElement.tsx:7392), quindi `remove` non avvolge esplicitamente.

### Add nuovo valore (+)

`Info.tsx:613-616` — funzione `add`:
```typescript
const add = () => {
    value = value.r;
    SetFieldAction.new(value.id, 'values', U.initializeValue(feature?.type), '+=', false);
}
```

API usata: **`SetFieldAction.new('+=')`** diretto sul DValue.values, NON `setValueAtPosition`. Path divergente rispetto a edit/remove.

### È generico o specializzato?

Generico per tutti gli EAttribute (la branching avviene su `feature.type.name` per scegliere `field='text'|'number'|'checkbox'|'date'`). NESSUN path specializzato per `name` o per identity. Le specializzazioni in `setValueAtPosition` (sez. 8) sono nel modello, non nel componente UI.

### Conclusione punto 4

- Slot editor centralizzato in `Info.tsx::builder.value(...)`
- "×" clear → `setValueAtPosition(index, undefined, {isPtr})`
- Edit → `setValueAtPosition(index, value, {isPtr})` dentro TRANSACTION manuale (potenzialmente nested — vedi sez. 10)
- Nessun path specializzato per EAttribute name; il binding identity entra in gioco dentro `setValueAtPosition` (sez. 8) e non nel componente UI

---

## 5. Template default classe canvas

### Default jsxString per oggetto M1

`frontend/src/common/DV.tsx:1678-1701` — metodo `DefaultView.object()`:
```jsx
<View className={'root object'}>
    <div className={'header'}>
        <div style={{textDecoration: 'underline'}}>
            <span style={{fontWeight: 500, textDecoration: 'underline'}}>
                {data.$name ?
                    <Input data={data.$name} field={'value'} hidden={true} autosize={true} placeholder={'name'} /> :
                    <Input data={data} field={'name'} hidden={true} autosize={true} placeholder={'name'} />
                }:&nbsp;
                {data.instanceof ? data.instanceof.name : 'Object'}
            </span>
        </div>
    </div>
    <hr/>
    <div className={'object-children'}>
        {level >= 2 && data.features.map(f => <DefaultNode key={f.id} data={f} />)}
    </div>
    {decorators}
</View>
```

### Default jsxString per slot/value M1

`DV.tsx:1705-1718` — metodo `DefaultView.value()`:
```jsx
<View className={'root value d-flex'}>
    {instanceofname && <label className={'d-block ms-1 name'}>{instanceofname}</label>}
    {!instanceofname && <Input className='name' data={data} field={'name'} hidden={true} autosize={true} />}
    <label className={'d-block ms-1 values_str'}
           style={{color: constants[typeString] || 'gray', fontStyle: 'italic'}}>
        = {valuesString}
    </label>
    {decorators}
</View>
```

Dove `valuesString` è una proprietà del LValue (`get_valuesString` → `valuestring_impl` LModelElement.tsx:7249) che ritorna **una stringa joinata dei valori dello slot** (tra cui rientra anche il fallback su `DObject.name` quando lo slot è vuoto, via la branca read di sez. 8).

### Risposta esplicita alla domanda

**Il body LEGGE dallo slot** tramite `valuesString` proprietà del LValue (proxy). Lo slot value è ottenuto via `get_values(c)`, che applica il **read fallback** descritto al punto 8: se lo slot ha `upperBound===1 && !ret[0] && name?.toLowerCase() === 'name'`, ritorna `DObject.father.name`.

**Conferma del sospetto dello screenshot**:
- Title `DISIM : Department` → il template object usa `data.$name ?` (linea 1687). Se `$name` esiste e ha valore (anche se via fallback automatico), mostra Input bound a `$name.value`. Altrimenti (se `$name` non esiste come LValue, p.e. classe senza EAttribute `name`), mostra Input bound a `data.name`. In entrambi i casi il display passa attraverso `LObject.get_name` o `LValue.get_value`, che invocano lo stesso fallback.
- Body `name = DISIM` → il `DefaultNode` su ogni feature renderizza il **value template** (sopra), che mostra `instanceofname` + `= valuesString`. Quando lo slot `name` è "empty" in Properties panel, in realtà `valuesString` non è vuoto **per via del fallback al DObject.name**: il flag `!ret[0]` triggera il return `ret[0] = o.name` (LModelElement.tsx:7208). Quindi appare `name = DISIM` anche se l'utente "non ha mai scritto DISIM nello slot".

**Il sospetto è corretto**: il template che mostra `name = DISIM` con slot Properties "empty" è una conseguenza del **fallback nel read path** (`LValue.get_values`), non di una logica esplicita del template. Una volta che la feature implementerà `initialName` separato e renderà `data.name` come derivato, questo comportamento dovrà essere ridiscusso.

### File del template

- Path esatto: **`frontend/src/common/DV.tsx`**
- Template object generato da `DefaultView.object()` chiamato in `DV.objectView()` (linea 568)
- Il jsxString **non è** in `defaultViewTemplate.ts` — quel file definisce il template di **DViewElement nuove generate da context menu** (`createViewInWorkbench`), che è una DV diversa, più recente, "minimal clean v2.3"
- Il template object di DV.tsx viene scritto nel DState all'inizializzazione tramite `redux/defaults/views.ts:560-632` (metodo `.object()` chiamato con `Defaults.Pointer_ViewObject`)

### Conclusione punto 5

- **2 sorgenti di jsxString default convivono**: `DV.tsx` (Pointer_ViewObject/ViewValue/ViewClass, default classico cuore) e `defaultViewTemplate.ts` (`DEFAULT_VIEW_JSX_STRING`, usato solo per view nuove create da context menu)
- Il title della box istanza nel classic canvas usa `data.$name ? slot : data.name` (preferenza esplicita allo slot)
- Il body lista le features come DefaultNode → per ogni LValue mostra `instanceofname + ' = ' + valuesString`
- Lo screenshot iniziale del prompt è coerente con il **fallback nel read path** di `LValue.get_values` (sez. 8), non con il template

---

## 6. Creation handler M1

### Dove vengono create istanze M1 (D-layer)

`DObject.new` definito in `LModelElement.tsx:5668-5681`. Override `DObject.new3` linea 5676-5681. Costruisce un DObject via `Constructors`, applica chain `DPointerTargetable().DModelElement().DNamedElement(name).DObject(instanceoff)`.

### Entry point principali per creation istanze M1 (per superficie utente)

#### v2-flow drag-drop creazione object node

`frontend/src/components/editor-v2/sync/canvasToJjom.ts:1121-1160` — `syncCreateObject(graphId, metaclassId, x, y, objectName?)`:
```typescript
const name = objectName || `obj_${Date.now().toString(36).slice(-4)}`;
const dObject = (DObject as any).new(
    metaclassId,   // which class to instantiate
    modelId,       // parent model
    DModel,        // fatherType — MUST be DModel
    name,          // instance name
    true           // persist
);
```

- TRANSACTION: **bare loop** (NO outer TRANSACTION), per documentazione esplicita a `canvasToJjom.ts:1111` ("Do NOT wrap DObject.new in an outer TRANSACTION"). `DObject.new` apre la propria TRANSACTION via `Constructors.persist`.

#### Classic editor — context menu / sidebar "Add Object"

Passa per `LValue.addObject` / `LModel.addObject` → `DObject.new3` (LModelElement.tsx:6852). Esempio in `LModelElement.tsx:6851`:
```typescript
TRANSACTION(this.get_name(c as any)+'.addObject()', () => {
    let dobj = DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true);
    ...
});
```

**AMBIGUO**: questo wrap in TRANSACTION potrebbe sembrare in violazione della regola CLAUDE.md §3.3 contro TRANSACTION + `DObject.new` nested. Tuttavia il codice esiste in stato apparentemente working da molto tempo — la regola si applica strettamente alle "sync-adjacent files" (useJjomSync etc.). `LValue.addObject` non è sync-adjacent. Verificare prima di toccarlo.

#### Import XMI/Ecore

Sezione 7. Senza `name` esplicito → `defaultname`.

#### JjTL execution `ProjectEditor.tsx:1583-1586`
```typescript
const objTimingLabel = `[TIMING] DObject.new #${instancesCreated} (${className})`;
console.time(objTimingLabel);
const dObject = DObject.new(targetClass.id, dModel.id, DModel, objectName, true);
console.timeEnd(objTimingLabel);
```
`objectName` calcolato dalla transformation (può essere `objectName = "obj_" + N` o derivato dall'attributo source).

#### JjScript `instance.ts:225-240`
Passa `name` dal comando utente.

### Conclusione punto 6

- Pipeline diversa per ogni entry point. Convergenza minima.
- Nome alla creazione:
  - v2-flow: **`obj_<timestamp>`** (non usa defaultname)
  - classic editor: **defaultname** (`<className>_<N>`) via `DObject.new3`
  - XMI import: **defaultname** (`<className>_<N>`) — name=undefined
  - Ecore import: literal `"obj_1"` o `json["name"]`
  - JjTL: nome calcolato dalla transformation
- `DObject.new` apre la propria TRANSACTION internamente
- **AMBIGUO**: in `LValue.addObject` (LModelElement.tsx:6851) `DObject.new3` è wrappato in una outer TRANSACTION, apparente violazione della regola §3.3, in realtà tollerato perché non è sync-adjacent. Da chiarire.

---

## 7. Ecore import istanze

### Pipeline Ecore (`.ecore` interpretato come instance, sebbene il file sia tipicamente M2)

`frontend/src/api/data.ts:583-622` — `EcoreParser.parseDObject(json, parent, parentType, meta, generated)`:
```typescript
let dObject: DObject = DObject.new(meta?.id, parent.id, parentType, json["name"] as string || "obj_1");
generated.push(dObject); dObject.father = parent.id;
if (parent) {
    if (parentType === DModel) (parent as DModel).objects.push(dObject.id);
    else (parent as DValue).values.push(dObject.id);
}
// Per ogni feature del JSON XML:
for (let key in json) {
    switch(key) {
        case ECoreObject.xmi_version: ...
        case ECoreObject.xmlns_xmi: ...
        default: // feature name
            let val = json[key];
            if (!val) continue;
            if (key[0] === EcoreParser.XMLinlineMarker) key = key.substring(1);
            ...
            let metafeature = meta && (meta as any)["@"+key];
            ...
            EcoreParser.parseDValue(key, values, dObject, metafeature, generated);
    }
}
```

E in `parseDValue` (data.ts:624-633):
```typescript
let dValue: DValue = DValue.new(meta ? undefined : name, meta?.id, [], parent.id, true, false);
generated.push(dValue); dValue.father = parent.id;
parent.features.push(dValue.id);
if (meta && meta.className === DAttribute.cname) { dValue.values = jsonvalues; return generated; }
```

### Dove l'EAttribute `name` viene popolato (M1 slot)

L'EAttribute `name` del file XML/Ecore viene **scritto come slot M1** tramite il loop su tutti i feature in data.ts:596-620. Quando `key === "name"`, viene chiamato `EcoreParser.parseDValue("name", [valore], dObject, lAttributeName, generated)`, che crea un `DValue` e setta `dValue.values = jsonvalues`.

In parallelo, **`DObject.name` viene popolato direttamente** dal valore di `json["name"]` (data.ts:588). Quindi **entrambi i campi finiscono con lo stesso valore**.

### Pipeline XMI (M1 puro)

`frontend/src/services/export/XMIService.ts:629, 650`:
```typescript
const dObject: DObject = DObject.new(metaClass.id, dModel.id, DModel, undefined, true);
```
Passa `undefined` come name → `defaultname` produce `<className>_<N>` (e.g. `Department_1`).

Poi `XMIService.processInstance` → `processAttribute` (XMIService.ts:757-815) per ogni attributo XML:
```typescript
const dValue: DValue = DValue.new(undefined, metaFeature.id as any, values, dObject.id, true, false);
(dObject.features as Pointer<DValue>[]).push(dValue.id);
```

Per l'EAttribute `name`, il `DValue.values` viene popolato dal valore XML (`["DISIM"]`). **`DObject.name` rimane `Department_1`** (l'auto-generato). Quindi:

| | DObject.name | slot `name` LValue.values |
|---|---|---|
| Dopo XMI import | `Department_1` (auto) | `["DISIM"]` (da XML) |
| Dopo Ecore import | `DISIM` (da `json["name"]`) | `["DISIM"]` (da feature loop) |

### AMBIGUO

I due importer **divergono** su `DObject.name`:
- XMI: lascia il defaultname; lo slot identity contiene il valore "vero"
- Ecore: scrive `DObject.name` direttamente dal valore XML; lo slot identity contiene lo stesso valore in duplicazione

Entrambi i comportamenti sono "compatibili" perché il `LValue.get_values` fa fallback su `DObject.name` quando lo slot è vuoto (sez. 8), ma in caso di XMI import, dopo la migration identity binding, l'`initialName` dovrebbe essere `Department_1` (autogenerato) mentre lo slot identity `name` deve avere il valore `"DISIM"` (dal file).

Per Ecore l'attuale doppia scrittura sarà ridondante: o popoliamo solo lo slot (e initialName resta autogenerato), o popoliamo solo DObject.name e poi la migration lo trasla a initialName. Da discutere.

---

## 8. Identity attribute matching attuale

### Riconoscimento "speciale" dell'EAttribute nominato `name`

Esistono **già** vari punti in cui il codice fa matching speciale su un slot/EAttribute il cui nome è `name`. Sempre **case-INSENSITIVE** (`.toLowerCase() === 'name'`).

#### 8.1 LValue.get_values — READ FALLBACK (LModelElement.tsx:7205-7209)

```typescript
case ShortAttribETypes.EString:
case ShortAttribETypes.EDate:
    mapperfunc = v => v ? v + '' : ''
    if (withmetainfo) ret.forEach(...);
    else ret = ret.map(mapperfunc);
    if (!ret[0] && (dmeta?.upperBound === 1 || (!dmeta && ret.length <= 1))
        && typestr === ShortAttribETypes.EString && context.data.name?.toLowerCase() === 'name') {
        let o = DObject.fromPointer(context.data.father);
        if (o && o.name) ret[0] = o.name;
    }
    break;
```

Quando lo slot è vuoto E è di tipo EString E è upperBound=1 E si chiama "name" (case-insensitive) → ritorna il `DObject.father.name` come fallback. Questo è il meccanismo che produce `name = DISIM` nel template anche con slot empty.

#### 8.2 LValue.setValueAtPosition — WRITE PROPAGATION (LModelElement.tsx:7399-7401)

```typescript
TRANSACTION(lname+'.setValue('+index+': index)', ()=>{
    outactions.clear.push(()=>this._clearValueAtPosition(c, index, info, true));
    outactions.set.push(()=>SetFieldAction.new(c.data, 'values.' + index as any, val, '', isPtr));
    if (index === 0 && lname?.toLowerCase() === 'name' && c.data.father) {
        outactions.set.push(()=> SetFieldAction.new(c.data.father, 'name', val, '', false));
    }
    ...
})
```

Quando scriviamo `slot.value = X` E lo slot è chiamato "name" (case-insensitive) E è posizione 0 → propaga lo scritto a `DObject.father.name`.

#### 8.3 LObject.get_name — preferenza slot (LModelElement.tsx:5730-5732)

Vedi punto 1. Lettura ordine: `$name?.value || data.name || instanceof.name`.

#### 8.4 LObject.set_name / LPointerTargetable.set_name — write bidirezionale

Vedi punto 1. Setter scrive su entrambi (slot + DObject.name).

#### 8.5 Selectors.getName (selectors.ts:299-310)

```typescript
static getName(d: DPointerTargetable | LPointerTargetable | string, s: DState): string {
    if (!d) return d;
    if (typeof d === 'string') return d;
    d = (d as LPointerTargetable).__raw || d;
    if (d.className !== DObject.cname) return (d as DNamedElement).name;
    let dobject: DObject = d as DObject;
    for (let feat_id of dobject.features) {
        let feat: DNamedElement | undefined = s.idlookup[feat_id] as any;
        if (feat && feat.name.toLowerCase() === 'name') return feat.name;
    }
    return dobject.name;
}
```

⚠ BUG/AMBIGUO: questo metodo ritorna `feat.name` (= "name", il nome dell'EAttribute) anziché il valore dello slot. Probabilmente un bug. Dovrebbe essere `feat.values[0]` o equivalente. Da verificare prima della feature.

### Flag `iD` (EMF) — già esistente

**`DAttribute.isID: boolean = false`** in LModelElement.tsx:4132 (D-layer) e :4191 (L-layer).
- Commento esplicito: `// ? exist in ecore as "iD" ?` (entrambi i punti)
- Get/set: `LAttribute.get_isID` / `set_isID` LModelElement.tsx:4246-4254
- **Copiato in duplicate()** (LModelElement.tsx:4230): `de.isID = context.data.isID;`

#### Punti dove `isID` viene LETTO

- `frontend/src/components/editors/Info.tsx:455` — toggle UI: `<PropertiesToggle data={data} field={'isID'} label="ID" />`
- `frontend/src/common/DV.tsx:129` — template Handlebars dell'Attribute view: `{{#if isID}}id {{/if~}}` (puramente decorativo)
- `frontend/src/jjscript/executor/commands/set.ts:164, 226` — esposto nei JjScript commands come `iD` / `id`

#### Punti dove `isID` NON viene letto

- **NON viene letto dall'import Ecore** (`api/data.ts`)
- **NON viene letto dall'import XMI** (`services/export/XMIService.ts`)
- **NON viene scritto dall'export Ecore** (`generateEcoreJson_impl` LModelElement.tsx:4195-4206)
- **NON viene scritto dall'export XMI**

Quindi il flag esiste solo come "metadato fluttuante", non è collegato al ciclo di vita import/export né al meccanismo identity binding implicito.

### Risposta alla domanda 8

- Sì, **il matching identity esiste già** nel codice ma in modo:
  - case-INsensitive
  - implicito (non c'è un metodo `isIdentity()` esposto, ma un check inline su `name?.toLowerCase() === 'name'`)
  - sparso in 5+ punti (sez. 8.1-8.5)
- **`isID` esiste** come campo ma è dato morto rispetto al ciclo import/export e al binding identity. Non è il punto dove leggere "questa è la EAttribute identity".
- Per la feature identity binding del nuovo contract (case-SENSITIVE + tipo EString + cardinalità [0..1]), serve **introdurre una nuova helper** (e.g. `LClass.identityAttribute: LAttribute | undefined` o equivalente, basata sul match strict) e rifattorizzare i 5+ punti per consultarla.

---

## 9. VersionFixer stato attuale

### File e numerazione

Path: **`frontend/src/redux/VersionFixer.tsx`**

- `private static highestVersion: number = 0;` (linea 28) — calcolato automaticamente dai metodi
- Compute in `VersionFixer.setup()`, linea 76-99: scorre i metodi `private [...] -> [...]` e tiene il massimo.
- Top-level: `VersionFixer.highestVersion` non da settare manualmente

### Convenzione di naming

`private ['<from> -> <to>'](s: DState): DState { ... return s; }`

Pattern visto su tutte le migration:
- Dichiarate con string-key method syntax
- Accettano `s: DState`, mutano in-place
- Ritornano `s` alla fine

### Lista migration recenti (in ordine cronologico ai linee di file)

| Versione | Linea | Cosa fa |
|---|---|---|
| `2.205 -> 2.206` | 503-520 | **Propaga `DValue(name).values[0]` → `DObject.name`** (più simile alla feature target, ottima reference) |
| `2.211 -> 2.212` | 616-643 | Migra DViewElement jsxString a "minimal clean v2.2" |
| `2.213 -> 2.214` | 669-687 | Migra DViewElement jsxString a "v2.3 (L2 isEdge)" |
| `2.214 -> 2.215` | 695-... | Aggiunge campo `edgeRouting` a DViewElement/DViewPoint |
| `2.215 -> 2.216` | 715-... | (vedi file) |
| `2.216 -> 2.217` | 769-795 | Seeds 5 nuovi DProject layout fields |

**Ultima migration**: `'2.216 -> 2.217'` (VersionFixer.tsx:769).
**Prossima migration da aggiungere**: `'2.217 -> 2.218'` (o oltre se serve catena).

### Esempio canonico — migration 2.205 → 2.206 (linea 503-520)

```typescript
private ['2.205 -> 2.206'](s: DState): DState {
    if (!s.RECOMPILE_LANGUAGE) s.RECOMPILE_LANGUAGE = [];
    for (let e of Object.values(s.idlookup) as any[]) {
        if (!e || typeof e !== 'object' || !e.className || !e.id) continue;
        if (!e.__childrenToSort) e.__childrenToSort = [];
        // fix parameter having default type "operation"
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

**Pattern utile per la feature identity binding**:
1. Itera su tutto `s.idlookup`
2. Filtra per `className === 'DValue'` e `e.name === 'name'` (anche case-sensitive serve switch)
3. Per ogni match, accedi al father DObject via `this.d(e.father, s)` e applica la trasformazione

### Dove va aggiunta una nuova migration

Convenzione del file: **aggiungere prima della `}` finale della classe**, dopo l'ultima migration esistente (ora `2.216 -> 2.217` linea 769-795).

`highestVersion` viene calcolato automaticamente dal nome del metodo, quindi:
- aggiungere `private ['2.217 -> 2.218'](s: DState): DState { ... return s; }` dopo linea 795
- nessuna costante da bumpare
- nessun registry da aggiornare

### Conclusione punto 9

- Ultima version: **2.217**
- Convenzione metodo: `private ['<from> -> <to>'](s: DState): DState`
- `highestVersion` calcolato automaticamente, no manual update
- **Reference migration esistente per identity binding**: `'2.205 -> 2.206'` — molto vicina alla logica target, può essere usata come template per la nuova migration

---

## 10. Pattern L-layer slot setter

### Esempio canonico (non `name`) — edit di un attribute slot dal v2-flow

`frontend/src/components/editor-v2/sync/canvasToJjom.ts:1222-1248`:
```typescript
export function syncUpdateFeatureValue(
    objectVertexId: string,
    featureName: string,
    newValue: string | number | boolean | null,
): void {
    try {
        const lVertex: any = LPointerTargetable.fromPointer(objectVertexId);
        const lObject = lVertex?.model;

        if (!lObject) {
            console.warn('[canvasToJjom] syncUpdateFeatureValue: no model for vertex', objectVertexId);
            return;
        }

        TRANSACTION(`EditorV2 set ${featureName}`, () => {
            const featureProxy = (lObject as any)['$' + featureName];
            if (featureProxy) {
                featureProxy.value = newValue;  // ← slot setter
            } else {
                console.warn('[canvasToJjom] syncUpdateFeatureValue: feature proxy not found:', featureName);
            }
        });
    } catch (err) {
        console.warn('[canvasToJjom] Failed to update feature value:', err);
    }
}
```

API usata: **`(lObject)['$' + featureName].value = newValue`** wrap in TRANSACTION manuale.

### Sequenza interna (sotto il cofano)

L'assegnazione `featureProxy.value = newValue` triggera il proxy setter `LValue.set_value`:

`LModelElement.tsx:7509-7516`:
```typescript
protected set_value(val: D["values"][0], c: Context): boolean {
    let v: ValueDetail = this.get_value(c, false, false, false, true, true);
    let val_id = (val as any)?.id || val;
    if (Pointers.isPointer(val_id) && c.data.values.includes(val_id as any) && this.get_isContainment(c)) { return true; }
    let r = this.get_setValueAtPosition(c)(v?.index || 0, val_id || val);
    Log.e(!r.success,  r.reason);
    return r.success;
}
```

Delega a `setValueAtPosition(0, val)` (LModelElement.tsx:7312-7411).

`setValueAtPosition` apre **la sua propria TRANSACTION** (linea 7392) — quindi `syncUpdateFeatureValue` finisce in **TRANSACTION nested**.

⚠ La regola CLAUDE.md §3.3 sconsiglia TRANSACTION nested in sync-adjacent code. **`canvasToJjom.ts:1237-1244` è sync-adjacent E wrappa in TRANSACTION un `featureProxy.value = X` che apre TRANSACTION internamente**. Da verificare se è sicuro (esiste da tempo, runtime non noto rotto). Tecnicamente la regola dice "non wrappare DVertex.new / DVoidEdge.new2 in TRANSACTION", non specificamente proxy setter. Ma è un pattern da monitorare.

### Sequenza completa per slot edit

```
featureProxy.value = newValue
    └─ LValue.set_value(val, c)
        └─ setValueAtPosition(0, val)
            ├─ TRANSACTION 'lname.setValue(0: index)' {
            │   ├─ clear actions
            │   ├─ SetFieldAction.new(c.data, 'values.0', val, '', isPtr)
            │   ├─ [if lname.toLowerCase() === 'name' && c.data.father]
            │   │     SetFieldAction.new(c.data.father, 'name', val, '', false)  ← identity binding write
            │   └─ }
            └─ outactions.set + outactions.clear
```

### Slot dispatcher centrale?

**Sì, esiste**: `LValue.get_setValueAtPosition` (LModelElement.tsx:7312-7411) è **il punto unico** dove tutte le mutazioni di slot M1 transitano.

Tutti gli edit di slot (Info panel, v2-flow, JjScript, transformation execution) convergono qui — direttamente o via `set_value`/`set_values`.

Componenti UI che scrivono direttamente sul singolo DValue.values con `SetFieldAction.new('values', val, '+=')` (es. Info.tsx:615 `add()`) **bypassano** il dispatcher e quindi anche la propagazione identity binding. Questo è un AMBIGUO/divergenza da notare.

### Conclusione punto 10

- Pattern principale: **proxy setter** `(lObject)['$' + featureName].value = X` → set_value → setValueAtPosition
- TRANSACTION manuale esterna **convive** con TRANSACTION interna in `setValueAtPosition` (sync-adjacent, da monitorare)
- `setValueAtPosition` è il punto di convergenza centrale; lì avviene la propagazione identity → DObject.father.name
- Path divergente: `SetFieldAction.new(value.id, 'values', X, '+=')` (linea 615 di Info.tsx) bypassa il dispatcher; eventuali nuove regole identity dovranno applicarsi anche qui

---

## Ambiguità e rischi

### A. Match identity case-insensitive vs case-sensitive
Il codice attuale matcha `name?.toLowerCase() === 'name'` in 5 punti (sez. 8.1, 8.2, 8.5, VersionFixer.tsx:514, Selectors.getName). La nuova specifica dichiara case-SENSITIVE. Cambio comportamento per progetti esistenti dove c'è un EAttribute "Name" o "NAME" — restano scollegati dall'identity binding. Da verificare se ci sono modelli reali con tale convenzione.

### B. Selectors.getName può essere un bug
`selectors.ts:307` ritorna `feat.name` (il nome dell'EAttribute, sempre "name") anziché `feat.values[0]` (il valore vero dello slot). Suspect bug. Da chiarire con utente prima di rifattorizzare.

### C. `isID` flag esiste ma è dato morto
`DAttribute.isID` esiste, ha get/set, è esposto in UI e JjScript, ma:
- NON viene letto dall'import Ecore/XMI
- NON viene scritto dall'export Ecore/XMI
- NON entra nel meccanismo identity attuale (sez. 8)

Decidere se la feature usa `isID` come marker esplicito (riusando il campo esistente) o introduce un nuovo concetto.

### D. Doppia sorgente di jsxString default
Le istanze M1 usano il template `DV.tsx::DefaultView.object()` (Pointer_ViewObject, applied to DObject.cname). Le DViewElement nuove generate da context menu usano `DEFAULT_VIEW_JSX_STRING` di `defaultViewTemplate.ts`. **Toccando uno, l'altro non si aggiorna**. Se la feature richiederà migration jsxString, **vanno toccati entrambi i sorgenti + 1 migration in VersionFixer**.

### E. v2-flow vs classic editor naming divergence
`syncCreateObject` (v2-flow) usa `obj_<timestamp>` ignorando `defaultname`. Classic editor via `LValue.addObject` usa `defaultname`. Per la feature, da uniformare al `defaultname`-style `<className>_<N>` per consistency, oppure documentare la divergenza.

### F. TRANSACTION nested in sync-adjacent code
`canvasToJjom.ts:1237` wrappa `featureProxy.value = X` in TRANSACTION; `setValueAtPosition` apre la sua. Sembra funzionare, ma a stretto rigore §3.3 va monitorato. Toccando questo path per la feature, valutare se rimuovere il wrap esterno.

### G. Ambiguità su naming `DObject.name` post-feature
La feature dichiara `DObject.name` come **derivato**: `slot.value || initialName`. Ma molti consumer leggono direttamente `DObject.name` (campo persistente) senza passare dal proxy (es. `Selectors.getName` selectors.ts:309 e analoghi a 1170+ siti in tutta la codebase, sebbene molti passino dal proxy). Rendere il campo derivato implica:
- Renderlo un getter computato a livello D-layer (non più campo persistente) — sarebbe **breaking** per JSON serialization, redux state shape, undo/redo
- OPPURE: mantenerlo come campo cached, aggiornato in scrittura, ma con `initialName` come backing per il caso "slot vuoto"

Discutere la strategia.

### H. Migration per progetti con auto-name "DISIM" già scritto su DObject.name
I progetti pre-feature hanno `DObject.name = "DISIM"` (es. dall'Ecore import in cui json["name"] è valorizzato). La feature richiede:
- `initialName` = nome autogenerato `Department_1`
- `DObject.name` derivato (`slot.value || initialName`)
- Slot identity popolato a "DISIM"

Migration logica: PER OGNI DObject:
1. Se esiste un DValue figlio chiamato "name" con values[0], assicurarsi che `initialName` sia generato (autoname `<className>_<N>` sul namespace del father)
2. Se NON esiste, allora il valore `DObject.name` corrente diventa `initialName` (o spostato in slot)

**Strategia da concordare**: l'utente ha detto "Migrazione progetti vecchi: silenziosa". OK ma in che direzione: preservare il display ("DISIM") sempre, accettando che initialName può essere `Department_1`? Discutere.

### I. v2-flow ObjectNode editing in 3 punti, sincronizzazione vs Sequence
- `ObjectNode.tsx:186-217`: double-click title bar
- `M1PropertiesPanel.tsx:31-36`: Properties panel name input
- (Hypothetical) `EditorV2.tsx`: select+F2 rename

Tutti convergono su `syncNodeLabel(id, name)` → `model.name = X`. **OK, convergenza presente**. Da verificare in implementation che non ci sia un 4° path (es. inline rename via keyboard) che invece scriva direttamente su DObject.name bypassando il proxy.

---

## File toccati

NESSUNO (sessione di sola lettura).

---

## Comandi grep principali usati

```bash
# Discovery DObject e set_name
grep -ln "class DObject\b" frontend/src/
grep -n "class DObject\|class LObject\|class DNamedElement\|class LNamedElement" frontend/src/model/logicWrapper/LModelElement.tsx
grep -rn "set_name\b\|protected set_name" frontend/src/

# Rename handlers
grep -rn "\.name\s*=\|set_name\|setName(" frontend/src/components/
grep -rn "syncNodeLabel\|syncRename" frontend/src/components/editor-v2/

# Slot editor
grep -n "setValueAtPosition\|get_setValueAtPosition" frontend/src/model/logicWrapper/LModelElement.tsx
grep -n "remove\|setValueAtPosition" frontend/src/components/editors/Info.tsx

# Default view templates
grep -rn "DEFAULT_VIEW_JSX_STRING\|defaultViewTemplate" frontend/src/
grep -n "class DefaultView\|static class\b\|static object\b\|static value\b" frontend/src/common/DV.tsx

# DObject.new
grep -rn "DObject\.new\|DObject\.new2\|DObject\.new3" frontend/src/

# Ecore/XMI parsers
grep -n "DObject\|name = obj\.name" frontend/src/services/export/XMIService.ts
grep -n "DObject\|json\[.name.\]" frontend/src/api/data.ts

# Identity attribute matching
grep -rn "isID\|\.iD\b\|isIdentity" frontend/src/
grep -rn "\.name === 'name'\|\.name === \"name\"\|featName === 'name'\|name === 'name'\|toLowerCase.*'name'" frontend/src/

# VersionFixer
grep -n "private \[.*->\|highestVersion" frontend/src/redux/VersionFixer.tsx
```

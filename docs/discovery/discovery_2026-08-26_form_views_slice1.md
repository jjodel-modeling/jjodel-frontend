# Discovery — Form rendering delle view, Slice 1 (host = rail Properties)

**Data**: 2026-08-26
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: Fase 1, read-only. Nessun file sotto `frontend/` toccato.
**Prompt**: `docs/prompts/claude_2026-08-26_2017_prompt_form_views_fase1.md` (nome dichiarato dal prompt in chat)
**Protocollo**: P1..P10. P4 (report su file) chiude la fase.

---

## 0. Due path del prompt non esistono — nessuno dei due blocca

La regola 15 di `CLAUDE.md` dice: path citato che non esiste → STOP. Entrambi i casi qui sono
errori di battitura su file che esistono altrove e sono identificati senza ambiguità, quindi la
discovery è proseguita e i due errori sono riportati qui in cima invece che in fondo.

| Il prompt cita | Non esiste | Il file vero |
|---|---|---|
| `docs/design/handoff_2026-08-26_form_views/README.md` | sì | `docs/design/design_handoff_jjodel_form_views/README.md` (stesso contenuto: README + `Jjodel Form Views.dc.html` + `support.js`) |
| `frontend/src/components/editor-v2/VersionFixer.tsx` | sì | `frontend/src/redux/VersionFixer.tsx` (la sede che `CLAUDE.md` §3.1 e §19.1 già dichiarano) |

Un terzo path del prompt è sbagliato in modo più interessante e non è una battitura:
**`frontend/src/components/editor-v2/Select.tsx` non esiste**. L'unico `Select.tsx` del repo è
`frontend/src/components/ui/Select/Select.tsx`, e non è un controllo isolato: fa parte di una
libreria di form già completa. Vedi finding 8 — cambia il piano della Slice 1 più di ogni altro
risultato di questa discovery.

**Ipotesi che questa discovery stava falsificando**: che la form fosse in gran parte codice nuovo.
Falsificata su due assi (il kit `components/ui/` e la derivazione widget già scritta in
`Info.value`) e confermata su uno (la diagnostica per campo, che oggi non esiste).

---

## 1. Obiettivo

Preparare l'implementazione della Slice 1: `FormSpec` additivo nell'IR, interprete che rende una
`CompiledView` come form, host nel rail Properties. Rispondere alle 12 domande del prompt con
path, riga e citazione; mappare i token dell'handoff; proporre la forma di `FormSpec` e il piano
dei file.

---

## 2. File letti (path completi, tutti relativi a `/Users/alfonso/jjodel/`)

Handoff e protocollo
- `docs/design/design_handoff_jjodel_form_views/README.md` (113 righe, letto integralmente)
- `docs/PROTOCOL.md`, `CLAUDE.md`, `docs/claude-code-log.md` (ultime 10 entry)

IR
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (527)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (573, letto §1-360 e le firme)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (182, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (209, `useIRView` integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (455, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` (37, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (224)

Authoring
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (commit path)
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`

Problems
- `frontend/src/components/editor-v2/problems/registry.ts` (integrale)
- `frontend/src/components/editor-v2/problems/useNodeProblems.ts` (integrale)
- `frontend/src/components/editor-v2/problems/conformanceToProblems.ts` (integrale)
- `frontend/src/components/editor-v2/problems/ConformanceProblemSync.tsx`
- `frontend/src/components/editor-v2/problems/NodeProblemIndicator.tsx`, `ValidationPill.tsx`
- `frontend/src/model/conformance/ConformanceTypes.ts`, `ConformanceValidator.ts` (grep mirato)

Rail e proprietà
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (1004)
- `frontend/src/components/editors/Info.tsx` (1624, letto §1-960 = tutta la parte M1)
- `frontend/src/components/editors/properties-with-tree-view.scss` (grep token)

Write path
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (§595-700, §1460-1560)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (grep mirato: `LValue` §7190-7280, §7578-7810)

UI kit e token
- `frontend/src/components/ui/index.ts` (integrale), `Field/Field.tsx`,
  `SegmentedControl/SegmentedControl.tsx`, `Select/Select.tsx`
- `frontend/src/styles/tokens/` (11 file: `_typography`, `_radius`, `_shadows`, `_spacing`,
  `_transitions`, `_colors-light`, `_colors-dark`, `index.scss`)
- `frontend/src/styles/tokens.css`, `frontend/src/styles/variables.scss`
- `frontend/src/components/editor-v2/_themes.scss`, `_color-schemes.scss`
- `frontend/src/common/entityMeta.ts`, `frontend/src/common/featureSignature.ts`
- `frontend/src/hooks/useInterfaceMode.ts`, `frontend/src/components/abstract/tabs/EditorSwitch.tsx`
- `frontend/package.json`, `frontend/index.html`, `frontend/src/redux/VersionFixer.tsx`

---

## 3. Findings

### Finding 1 — Il pannello proprietà attuale

**Componente**: `frontend/src/components/editors/Info.tsx`, montato dal rail
`frontend/src/components/editors/PropertiesWithTreeView.tsx:940`.

**Selezione**: Redux root field, non un context e non un evento.

```ts
// PropertiesWithTreeView.tsx:456
const selectedElementId = useSelector((state: any) => state._lastSelected?.modelElement || '');
```

Scritto con `SetRootFieldAction.new('_lastSelected' as any, {...})` (`Info.tsx:327`). Esiste anche
un **pin** (`effectivePin`, `:433`) che sovrascrive la selezione: il soggetto effettivo del
Properties è `effectivePin?.modelElement ?? selectedElementId`, non la selezione nuda. La form
deve leggere lo stesso soggetto effettivo, altrimenti con un pin attivo mostra l'elemento
sbagliato — è la stessa trappola già misurata nel fix del doppio header del 2026-08-25.

**Lettura dei valori**: L-proxy, mai `DValue.values` diretto.

```ts
// Info.tsx:617-619
const object: LObject = LObject.fromPointer(data.id);
for (const feature of object.features) { ... }        // feature : LValue
// Info.tsx:704
let value: LValue = LValue.fromPointer(data.id);
const feature: LStructuralFeature = LStructuralFeature.fromPointer(value.instanceof?.id);
```

**Scrittura**: `LValue.setValueAtPosition`, dentro una `TRANSACTION` esplicita, **senza debounce**
(commit sul `change` dell'input).

```ts
// Info.tsx:748-760
function changeDValue(evt, index, isPointer) {
    TRANSACTION('change value (sidebar)', ()=>{
        value = value.r;
        let inputValue = field === 'checkbox' ? target.checked : target.value;
        ...
        let result = value.setValueAtPosition(index, inputValue, {isPtr: isPointer});
    })
}
```

Add e remove sono due percorsi distinti e già scritti:

```ts
// Info.tsx:733-735  (add)
SetFieldAction.new(value.id, 'values', U.initializeValue(feature?.type), '+=', false);
// Info.tsx:736-741  (remove)
value.setValueAtPosition(index, undefined, {isPtr: isPointer});
```

**`isProjectModified`**: `Info.tsx` non lo tocca **mai**. Verificato con grep sull'intero file:
zero occorrenze. È il todo 2 del 25/8 citato dal prompt, e la misura lo conferma: le scritture del
rail non marcano il progetto come modificato. `IRNodeContent.tsx` invece lo fa, a mano e
condizionato al cambio reale (`:186`, `U.isProjectModified = true`). **La Slice 1 deve replicare il
comportamento di `IRNodeContent`, non quello di `Info`**: altrimenti aggiunge una terza superficie
di scrittura che non sporca il progetto, peggiorando il bug invece di lasciarlo com'è.

**Toggle Basic/Advanced**: esiste, ma è **globale e in Redux**, non locale al pannello.

```ts
// PropertiesWithTreeView.tsx:346-347
// Expert/Advanced mode — controls visibility of NODE section
const advanced = useSelector((state: any) => state.advanced);
// :354-357  «The Basic/Advanced control lives in the app bar (Navbar), which also owns the ... Redux `advanced`»
```

In parallelo esiste un secondo asse, `useInterfaceMode` (`frontend/src/hooks/useInterfaceMode.ts`),
persistito su `localStorage['jjodel.interfaceMode']` con default `'basic'`. Due meccanismi per lo
stesso concetto. Vedi finding 9 e domanda aperta A2.

---

### Finding 2 — Write path dell'edit inline (il contratto della Slice 1)

`IRRow.tsx` **non scrive nulla**: 37 righe, sola lettura per costruzione.

> `IRRow.tsx:5` — «Read-only (spec R2 P2: no selection, no inline editing — nothing but rendering).»

L'edit inline delle righe sta in `IRNodeContent.tsx`, ed è questo:

```ts
// IRNodeContent.tsx:183-192
const commitRowEdit = useCallback(() => {
    if (editingRow) {
        const before = rows.attributes.find(r => r.key === editingRow.key) ?? ...;
        syncUpdateFeatureValue(vertexId, editingRow.name, editValue);
        if (!before || before.value !== editValue) U.isProjectModified = true;
        setEditingRow(null);
    }
}, [editingRow, editValue, vertexId, rows]);
```

`syncUpdateFeatureValue` vive in `frontend/src/components/editor-v2/sync/canvasToJjom.ts:1472`:

```ts
export function syncUpdateFeatureValue(objectVertexId, featureName, newValue) {
    const lVertex = LPointerTargetable.fromPointer(objectVertexId);
    const lObject = lVertex?.model;
    TRANSACTION(`EditorV2 set ${featureName}`, () => {
        const featureProxy = (lObject as any)['$' + featureName];
        if (featureProxy) featureProxy.value = newValue;
    });
}
```

**Tre limiti misurati, tutti decisivi per la Slice 1.**

1. **È chiavizzato sul `vertexId`, non sull'oggetto.** Il rail seleziona un `DObject` che può non
   avere un `DVertex` (elemento scelto nell'albero, grafo chiuso, oggetto non sulla tela). Con un
   `vertexId` assente la funzione esce con un `console.warn` e la scrittura si perde in silenzio.
2. **Scrive `.value`, cioè la posizione 0.** Nessun accesso per indice: una feature multivalore
   (`tags [0..5]`, `outgoing [0..*]`) non è scrivibile da qui. Il mockup ne ha tre.
3. **Non ha add/remove.** Il chip "Add", la `x` di rimozione e il disabilitato al limite superiore
   non hanno alcuna controparte.

**Contratto proposto per la Slice 1** — e non è `syncUpdateFeatureValue`:

> La form scrive attraverso **`LValue`**, con le tre operazioni di `Info.tsx`:
> `slot.setValueAtPosition(i, v, {isPtr})` per il set e il clear,
> `SetFieldAction.new(slot.id, 'values', U.initializeValue(type), '+=', false)` per l'add,
> ciascuna dentro la propria `TRANSACTION`, più `U.isProjectModified = true` condizionato al
> cambio reale come in `IRNodeContent.tsx:189`.

Non è un percorso parallelo: `syncUpdateFeatureValue` **converge sullo stesso punto**, perché
`lObject['$feature'].value = v` passa per `LValue.set_value` → `setValueAtPosition`
(`LModelElement.tsx:7807`, `let r = this.get_setValueAtPosition(c)(v?.index || 0, val_id || val)`).
La form usa il gradino sotto, dove l'indice e il flag puntatore sono esprimibili. È lo stesso
livello che usano già il pannello proprietà (`Info.tsx:759`) e l'esecutore JjTL
(`ProjectEditor.tsx:1962`), quindi resta **un solo write path** ai sensi della decisione 5 del
prompt.

---

### Finding 3 — Stato dell'IR dopo TS2, e dove entra `form`

Le interfacce (`irTypes.ts`), in forma abbreviata ai campi che contano:

```ts
export interface VertexViewIR {                    // :319
    irVersion: string; kind: 'vertex';
    metaclasses: string[] | '*';
    authoringMetaclassPins?: AuthoringMetaclassPins;
    predicate?: Predicate; priority?: number; exclusive?: boolean;
    label?: string; resizable?: boolean;
    shape: ShapeSpec;
    fieldCompartments?: FieldCompartmentSpec[];
}
export interface GraphVertexViewIR { /* :344 — idem + containment: {...} */ }
export interface EdgeViewIR { /* :400 — idem + reference?, edge: {source,target,line,...} */ }
export interface FieldCompartmentSpec {            // :132
    id: string;
    source: { from: 'attributes' } | { from: 'references' } | { from: 'children'; filter?: Predicate };
    rowFormat: { segments: FieldSegment[]; style?: TextStyle };
    visible?: Conditional<boolean>; separator?: boolean;
}
export type FieldSegment =                         // :125
    | { kind: 'name' } | { kind: 'type' }
    | { kind: 'value'; editable?: boolean | { widget: 'text'|'textarea'|'select'|'checkbox'|'color' } }
    | { kind: 'literal'; text: string };
export interface TextStyle { fontFamily?; fontSize?; fontWeight?; fontStyle?; color?  /* :95, ogni asse Conditional */ }
export interface ShapeSpec { form; fill?; border?; marker?; padding?; text?; labels?; badges?  /* :151 */ }
export interface RowViewIR { irVersion; kind:'row'; metaclasses; template: TextSource[]; visible?; style?  /* :472 */ }
```

**Nota che `FieldSegment.value.editable` porta già un vocabolario di widget**
(`'text'|'textarea'|'select'|'checkbox'|'color'`), identico a quello di `LabelSpec.editable`
(`:105`). `WidgetKind` della bozza del prompt deve essere un **superset compatibile** di questi
cinque nomi, non un vocabolario nuovo che ne diverge: sono già persistiti in view salvate.

**Firma di `compileView`** (`irCompile.ts:294`):

```ts
export function compileView(viewId: string, ir: NodeViewIR): CompiledView {
    const key = `${viewId}:${irHash(ir)}`;
    const cached = compileCache.get(key); if (cached) return cached;
    ...
}
```

`irHash` (`:285`) è un djb2 su `JSON.stringify(ir)` **intero**: un campo `form` aggiunto entra
automaticamente nella chiave di cache, quindi una modifica alla form invalida il compile senza
alcun intervento. Nessun rischio di cache stantia.

**Reattività** — `useIRView` (`irResolve.ts:48`) costruisce una firma stringa:

```ts
const snap: string[] = [irSig, objectId, dObject.instanceof ?? ''];
for (const fid of dObject.features) {
    const dv = lookup?.[fid];
    if (dv && Array.isArray(dv.values)) snap.push(`${fid}=${JSON.stringify(dv.values)}`);
}
const crossSig = crossDepsSignature(lookup, vertexId);
return crossSig ? `${snap.join(';')};X${crossSig}` : snap.join(';');
```

Lo snapshot degli slot è **non filtrato dal dependency set** (commento a `:54-56`: «Kept
unconditional ... to avoid a resolve inside the selector; objects have few features»). Per la form
è esattamente ciò che serve: la form legge *tutte* le feature, non solo quelle citate dai
PathExpr, e la firma già le copre tutte.

**Il problema**: `useIRView` è chiavizzato sul **`vertexId`** (`lookup[vertexId].model` → objectId).
Il rail non ne ha uno garantito. Ma il precedente per la variante esiste già ed è a due passi:
`useIRRowView(childObjectId)` (`irResolve.ts:160`) fa la stessa cosa **chiavizzata sull'id del
DObject**, e `resolveIRView(objectId, instanceOfClassId, index, readCtx, lookup)` non chiede il
vertice. Quindi `useIRFormView(objectId)` è `useIRRowView` con `resolveIRView` al posto di
`resolveRowView`: ~40 righe, nessuna invenzione.

**Dove entra `form` nel compile senza toccare il resto**: un solo blocco additivo in `compileView`,
accanto a `padding`/`text`, e un solo campo su `CompiledView`. `form` non contiene PathExpr da
compilare in accessor (i widget sono derivati dal metamodello, non da espressioni), quindi
**non tocca `deps`, `crossPathSink`, `channelSink`**, cioè nessuno dei tre meccanismi delicati.
Se `FormSpec` restasse dichiarativo puro, il compile può anche limitarsi a `form: ir.form ?? null`
— un passthrough.

---

### Finding 4 — Row dispatch e sorgenti di riga

`FieldCompartmentSpec.source.from` ammette esattamente tre valori: `attributes`, `references`,
`children`. Confermato dal tipo (`irTypes.ts:139`), dal compile (`CompiledFieldCompartment.source`,
`:509`) e dall'editor di authoring:

```ts
// FieldCompartmentListEditor.tsx:16
const KNOWN_SOURCES: readonly string[] = ['attributes', 'references', 'children'];
```

**Non esiste una source da espressione.** Un `from` sconosciuto è preservato verbatim ma reso come
badge read-only (`isKnownCompartmentSource`, `:23`).

**Come sono trattate oggi riferimenti e containment nelle righe** — e qui c'è il risultato che
orienta la Slice 1:

```ts
// IRNodeContent.tsx:139-146
const kind = feat.className === 'DReference' ? 'R' : 'A';
...
const row = { key: fid, name, typeName, value, editableValue: kind === 'A' };
if (kind === 'R') references.push(row); else attributes.push(row);
```

`editableValue: kind === 'A'`. **Un riferimento non è mai editabile inline sulla tela**, qualunque
cosa dica il `FieldSegment.editable` della view: il gate `row.editableValue &&
(seg as any).editable !== false` (`:406`) è già falso sul primo termine. Il valore mostrato è il
nome dell'oggetto puntato, risolto nella firma (`:144`, `if (typeof v === 'string' &&
lookup?.[v]?.name) return lookup[v].name`).

Il **containment** non ha un trattamento proprio in modalità slot: una reference con
`composition: true` cade nel bucket `references` come le altre. Il secondo canale, `source:
'children'`, è dispatch-mode e va da un'altra parte: risolve i figli di containment e li rende
ciascuno con la propria row view (`rowRenderedChildren` → `IRRow`), **senza editing**.

**Conseguenza per la Slice 1**: il reference picker e la children list **non possono nascere da
righe esistenti**. Le righe non sanno esprimere né la scelta di un target né l'espansione inline
di un sotto-form, e la modalità che oggi rende i figli è dichiaratamente read-only. Sono un
**asse nuovo di `FormSpec`** — che è la ragione per cui il campo `features?: Record<PathExpr,
FeatureTreatment>` della bozza del prompt è giusto e non ridondante.

Nota utile: `Info.value` **distingue già** i quattro casi (`isAttribute`, `isEnumerator`,
`isReference`, `isComposition`, `Info.tsx:770-790`) con la classificazione corretta —
`composition` spegne `isReference`. È quella classificazione, non quella di `IRNodeContent`, che la
form deve riusare.

---

### Finding 5 — Accesso al metamodello per derivare i widget

**Tutto già scritto**, in `Info.value` (`Info.tsx:703-800`). Non è una API da progettare, è un
blocco da estrarre.

Da `LObject` a slot e feature:

```ts
const object: LObject = LObject.fromPointer(data.id);
object.features                                  // LValue[]  — gli slot
const value: LValue = LValue.fromPointer(f.id);
const feature: LStructuralFeature = LStructuralFeature.fromPointer(value.instanceof?.id);
```

**Nomi reali dei campi** e come si leggono, con la riga della definizione:

| Fatto | Come si legge | Definizione |
|---|---|---|
| tipo primitivo | `feature.type.name` → `'EString'`, `'EInt'`, `'EBoolean'`, `'EDate'`, `'EFloat'`, `'EDouble'`, `'EChar'`, `'ELong'`, `'EShort'`, `'Byte'` | `Info.tsx:710-719` |
| lower bound | `feature.__raw.lowerBound`, oppure `slot.lowerBound` | `LModelElement.tsx:7222` |
| upper bound | `feature.__raw.upperBound` (`-1` = illimitato) | `LModelElement.tsx:7221` |
| enum | `feature.className === 'DAttribute' && feature.type.className === 'DEnumerator'` | `Info.tsx:779-781` |
| literal dell'enum | `slot.validTargetsJSX` / `slot.validTargetOptions` | `LModelElement.tsx:7115` |
| riferimento | `feature.className === 'DReference'` | `Info.tsx:774` |
| containment | `(feature as LReference).composition === true` | `Info.tsx:776`, getter `:4140` |
| target del riferimento | `feature.type` (LClass), candidati via `slot.validTargetOptions` | `LModelElement.tsx:7115` |
| derived / changeable | `slot.derived`, `slot.changeable` | `LModelElement.tsx:7205`, `:7212` |

**La molteplicità è leggibile senza costi nascosti.** `LValue` la espone direttamente e la
delega è una lettura di campo, non una scansione:

```ts
// LModelElement.tsx:7221-7222
protected get_upperBound(context) { return this.get_fromlfeature(context.proxyObject.instanceof, "upperBound"); }
protected get_lowerBound(context) { return this.get_fromlfeature(context.proxyObject.instanceof, "lowerBound"); }
// :7196
protected get_fromlfeature(meta, key) { return meta ? (meta as any)[key] : undefined as any; }
```

Un solo hop `instanceof` e un accesso a proprietà. `Info.value` per prudenza legge `__raw`
(`Info.tsx:721`, `feature.__raw.upperBound`), che salta anche il proxy: è la via più economica e
la Slice 1 può copiarla.

**Trappola già codificata, da non reintrodurre.** Il getter L-layer `.values` **imbottisce di
`undefined`** quando `length < lowerBound`; la lettura corretta per contare i valori reali è
`__raw.values` filtrato:

```ts
// canvasToJjom.ts:1543-1546
// Read from __raw.values ... instead of the L-layer .values getter, which pads empty
// slots with `undefined` when length < lowerBound. That padding caused new targets to
// land at index 1+ instead of index 0 for [1..1] references.
const rawVals = refProxy.__raw?.values ?? [];
const meaningful = rawVals.filter((v) => v != null && v !== '');
```

Il contatore "N di M" del marcatore di molteplicità e il gate del chip "Add" al limite superiore
**devono** contare su `meaningful`, non su `.values.length`, o mostrano un valore vuoto come pieno
su ogni feature `[1..1]` non ancora valorizzata — cioè proprio lo stato "Required empty"
dell'artboard 3a.

**Derivazione widget → tipo** (mappa già esistente, `Info.tsx:710-719`, da riusare verbatim):

| Tipo | `field` | Widget del mockup |
|---|---|---|
| `EChar` | `text`, `maxLength: 1` | text |
| `EInt`/`ELong`/`EShort`/`Byte` | `number`, step 1 | number stepper |
| `EFloat` | `number`, step 0.1 | number stepper |
| `EDouble` | `number`, step 0.01 | number stepper |
| `EBoolean` | `checkbox` | checkbox |
| `EDate` | `date` | (non nel mockup) |
| default | `text` | text |

Il mockup aggiunge due widget che **non** sono derivabili dal tipo: `textarea` JjEL (mono 12px,
44-56px) e `link`. `entryAction` e `guard` sono `EString` come `name`. Sono un override
d'autore per costruzione — e la bozza del prompt lo prevede già con `widgets?: Record<PathExpr,
WidgetKind>`. Vedi domanda aperta A4.

---

### Finding 6 — Registry problems: c'è la severità, manca la feature

**API** (`problems/registry.ts`):

- Produttori: `registerProblem(p: NodeProblem)`, `clearProblem(id)`, `clearProblemsByNode(nodeId)`,
  `markResolved(id)`.
- Consumatori: `useNodeProblems(nodeId)`, `useActiveOverlayId()`, `useIsHighlighted(nodeId)`
  (`useNodeProblems.ts`, tutti `useSyncExternalStore` → **reattivi**, con snapshot per nodo
  memoizzati per identità di array).
- Store: `Map` a livello di modulo, session-local, immune a undo/redo, non persistito.

**Chiavizzazione**: per **nodo**, mai per feature.

```ts
// registry.ts:41-53
export interface NodeProblem {
    id: string; nodeId: string;
    kind: 'duplicate-name' | 'conformance';
    severity: 'warning' | 'error';
    title: string; description: string; relatedNodeIds: string[];
    conformance?: ConformanceProblemDetail[];
    createdAt: number; resolvedAt?: number;
}
```

`nodeId` è **doppio** per costruzione: lo stesso oggetto è registrato due volte, una sotto l'id del
`DObject` (per l'albero) e una sotto quello del `DVertex` (per la tela).

> `ConformanceProblemSync.tsx:9-15` — «the TreeView row uses the DObject id, the canvas ObjectNode
> uses the DVertex id ... each violated object registers up to two entries».

**Ottima notizia per il rail**: la registrazione sotto l'id del `DObject` **esiste già**, quindi
`useNodeProblems(objectId)` funziona senza vertice, e il riepilogo "N errors, N warnings"
dell'header della form è a portata. Il conteggio si fa esattamente come lo fa il badge della tela:

```ts
// NodeProblemIndicator.tsx:48-50
const count = problems.filter(p => p.resolvedAt === undefined)
                      .reduce((n, p) => n + (p.conformance?.length ?? 1), 0);
```

**Cattiva notizia, ed è il vero buco della Slice 1: il nome della feature si perde in cabina.**

L'origine ce l'ha:

```ts
// ConformanceTypes.ts:38-65
export interface ConformanceViolation {
    objectId: string; objectName?: string;
    violationType: ... | 'missing_required_attr' | 'multiplicity_below_min'
                   | 'attr_multiplicity_upper_exceeded' | 'invalid_enum_literal'
                   | 'dangling_reference' | 'reference_target_type_mismatch' | ...;
    severity: ViolationSeverity; message: string;
    metamodelElementName?: string;
}
```

e `ConformanceValidator.ts` lo popola con il **nome della feature** in tutti i check per-feature —
`metamodelElementName: attr.name` (`:187, 239, 283, 297, 320, 346`), `ref.name`
(`:395, 407, 431, 444, 457`) — e con il nome della classe solo nei due check di classe
(`:108, 122`).

L'aggregatore però lo **butta via**:

```ts
// conformanceToProblems.ts:50-54
agg.violations.push({
    violationType: v.violationType,
    severity: v.severity,
    message: v.message,
});   // <- metamodelElementName non copiato
```

`ConformanceProblemDetail` (`registry.ts:33-37`) ha tre campi e nessuno è la feature.

**Il minimo da aggiungere** (e non c'è alternativa che non sia un secondo validatore, vietato dalla
decisione 4): un campo **opzionale** `featureName?: string` su `ConformanceProblemDetail`, e la sua
copia nell'aggregatore. Due righe, additive, con una sola nota: la chiave è il **nome**, non un id,
quindi il match con la feature del form è per nome — coerente con il resto del codebase, dove anche
`syncUpdateFeatureValue` e `resolveReferenceIdByName` (`canvasToJjom.ts:1552`) lavorano per nome.

`editor-v2/problems/` è in critical zone (`CLAUDE.md` §3.1). Vedi finding 12.

**Cosa il registry non dà, e va dichiarato invece che dato per scontato**: gli stati "Dirty"
(modificato non salvato) e "Read-only derived" dell'artboard 3a non sono diagnostiche di
conformance. Il primo è stato locale del form (`dirtyFields`, già previsto dal README), il secondo
si legge dal metamodello (`slot.derived`, `slot.changeable`). Nessuno dei due passa dal registry.

---

### Finding 7 — Mappa dei token

**Quale sistema usa oggi chi.** Sono **tre**, più una quarta cosa che non è un sistema:

| Sistema | Path | Namespace | Chi lo usa |
|---|---|---|---|
| (A) semantico | `styles/tokens/*.scss` (11 file) | `--color-text-primary`, `--text-sm`, `--radius-sm`, `--shadow-md`, `--duration-fast` | caricato da `App.scss:6` |
| (B) primitivo | `styles/tokens.css` | `--color-slate-500`, `--input-height-base`, `--radius-base`, `--font-size-sm` | caricato da `App.tsx:8`; **è quello che usa il kit `components/ui/`** |
| (C) editor | `components/editor-v2/_themes.scss` (mappe SCSS → 4 selettori) | `--node-bg`, `--border-default`, `--surface-1`, `--color-accent` | **è quello che usa `irStyle.ts`** |
| (—) | `components/editors/properties-with-tree-view.scss:63-75` | `$color-bg-primary: #ffffff;` `$transition-fast: 150ms ease;` | variabili **SCSS locali con esadecimali cablati**, non `var()` |

`irStyle.ts` usa (C): `var(--node-bg)`, `var(--border-default)`, `var(--color-accent)`
(`irStyle.ts:72, 144, 159`). Il kit `ui/` usa (B): `var(--color-slate-700)`, `var(--input-height-base)`,
`var(--radius-base)`. **Lo stylesheet del rail non usa nessuno dei tre.**

Questo è il problema di progetto più concreto della Slice 1, e va deciso prima di scrivere una riga
di SCSS: riusare i componenti `ui/` porta (B) dentro il rail; scrivere lo stile della form in (A)
lo mette accanto a componenti che parlano (B). Vedi domanda aperta A1.

**Divergenze fra (A) e (B) — misurate oggi, il prompt le dava per 27 sovrapposti / 13 divergenti.**
Numeri veri: `tokens.css` dichiara **151** nomi, `tokens/*.scss` ne dichiara **370**, i nomi in
comune sono **15**, e **tutti e 15 divergono**. Gli archi di ritiro citati in `tokens.css:11-18`
hanno ridotto la sovrapposizione da 27 a 15 senza chiudere il disallineamento. Confronto
luce-contro-luce (`tokens.css` vs `_colors-light.scss`, non vs il file dark):

| Nome | `tokens.css` | `styles/tokens/` |
|---|---|---|
| `--color-bg-primary` | `#ffffff` | `$slate-50` = `#f8fafc` |
| `--color-bg-secondary` | `#f8fafc` | `#ffffff` |
| `--color-border-primary` | `#e2e8f0` | `$slate-300` = `#cbd5e1` |
| `--color-border-secondary` | `#cbd5e1` | `$slate-250` |
| `--color-border-focus` | `#06b6d4` | `$slate-500` = `#64748b` |
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)` | `0 1px 2px rgba(0,0,0,.05)` |
| `--shadow-md` | `0 4px 6px -1px …` | `0 4px 12px rgba(0,0,0,.08)` |
| `--shadow-lg` | `0 10px 15px -3px …` | `0 8px 24px rgba(0,0,0,.12)` |
| `--shadow-xl` | `0 20px 25px -5px …` | `0 16px 48px rgba(0,0,0,.16)` |
| `--transition-fast` | `150ms ease` | `var(--duration-fast) var(--ease-out)` = `150ms cubic-bezier(0,0,.2,1)` |
| `--transition-slow` | `300ms ease` | `var(--duration-slow) var(--ease-in-out)` = `400ms …` |
| `--z-modal` | `1050` | `9999` |
| `--z-modal-backdrop` | `1040` | `9000` |
| `--z-sticky` | `1020` | `100` |
| `--z-tooltip` | `1070` | `1050` |

Le prime due righe si **invertono** i valori: usare `--color-bg-primary` intendendo "bianco" dà
`#f8fafc` sotto (A) e `#ffffff` sotto (B). `--color-border-primary` e `--color-border-secondary`
si invertono allo stesso modo. `--shadow-md` è **esattamente** l'ombra del popover dell'handoff
(`0 4px 12px rgba(0,0,0,0.08)`) — ma solo nella versione (A).

**Mappa handoff → token, sistema (A) salvo dove indicato.**

Colori — testo, superfici, bordi

| Handoff | Token | Stato |
|---|---|---|
| `#0f172a` testo primario | `--color-text-primary` | ✅ `_colors-light.scss:98` |
| `#475569` label 11px | `--color-text-secondary` | ✅ `:99` (= `$slate-700`… **attenzione**: `#334155`, non `#475569`) |
| `#475569` (esatto) | `--color-text-tertiary` = `$slate-600` | ✅ `:100` — **è questo il nome giusto per la label** |
| `#64748b` titoli sezione plain | `--color-text-tertiary` (`$slate-600` = `#475569`) | ⚠️ nessun ruolo semantico vale `#64748b`; il primitivo è `--color-slate-500` (B) |
| `#94a3b8` multiplicity, eyebrow | `--color-text-disabled` = `$slate-400` | ✅ `:102` (nome semanticamente storto per questo uso) |
| `#e2e8f0` bordo input | `--color-border-secondary` = `$slate-250` | ⚠️ `$slate-250` ≠ `#e2e8f0`; il valore esatto è `$slate-200` |
| `#cbd5e1` bordo checkbox, dashed | `--color-border-primary` = `$slate-300` | ✅ `:90` |
| `#ffffff` fondo input | `--color-bg-secondary` | ✅ `:81` |
| `#f8fafc` fondo pannello card | `--color-bg-primary` | ✅ `:80` |
| `#f1f5f9` chip, track segmented | `--color-bg-tertiary` = `$slate-100` | ✅ `:82` |
| `#fcfdfe` slot riepilogo | — | ❌ **manca**, nessun token in nessuno dei tre sistemi |
| `#334155` accento slate, focus | `--color-accent` | ✅ `:118` (`$slate-700`) |

Colori — semantica e selezione

| Handoff | Token | Stato |
|---|---|---|
| `#ef4444` bordo errore | `--color-error` | ✅ `:143` |
| `#b91c1c` testo errore | `--color-error-hover` (`$red-600`) | ⚠️ `$red-600` è `#dc2626`, non `#b91c1c` — manca il grado 700 |
| `#f59e0b` bordo warning | `--color-warning` | ✅ `:161` |
| `#b45309` testo warning | — | ❌ **manca** (amber-700) |
| `#0ea5e9` punto required / dirty | `--color-sky-500` **(B)** | ⚠️ esiste solo nel sistema primitivo, `tokens.css:52` |
| `#06b6d4` selezione canvas | `--color-canvas-accent` | ✅ `_colors-light.scss:205` |
| `#0891b2` barra sinistra selezione | `--color-selection-bar` | ✅ `:377` |
| `#e0f7fa` fondo riga selezionata | `--color-selection-bg` | ✅ `:376` |

Badge entità — **conflitto di progetto, non una lacuna**

L'handoff prescrive `State` "S" = `#fef3c7 / #b45309` («model amber»). Il token esistente per la
stessa cosa è:

```scss
// _colors-light.scss:338-339
--color-entity-object-bg: #F4E5EA;
--color-entity-object-fg: #6B4B56;
```

Rosa, non ambra, e generato in OKLCH nell'arco R-RAIL-30 (`entityMeta.ts:5-9`: «la scala entity ha
una sorgente sola ... i cinque campi di colore che questo file esponeva non avevano consumatori ed
erano divergenti dai token»). Adottare l'ambra dell'handoff **rifà divergere** ciò che quell'arco ha
unificato, e il badge dell'oggetto nel form sarebbe di un colore diverso dallo stesso badge
nell'albero a 300px di distanza. Vedi domanda aperta A3.

Dimensioni

| Handoff | Token | Stato |
|---|---|---|
| font 16 / 13 / 12 / 11 / 10 px | `--text-*`: 11, 13, 15, 18, 24, 32 | ⚠️ ci sono 11 e 13; **mancano 10, 12, 16** |
| altezze controlli 28 / 26 / 24 px | `--input-height` 40, `-sm` 32, `-lg` 48 (A); `--input-height-base` 40 (B); `variables.scss:17` 36 | ❌ **nessuna delle tre esiste** — la scala parte da 32 |
| raggi 3 / 4 / 6 / 8 | `--radius-sm` 4, `--radius-md` 8, `--radius-lg` 12 | ⚠️ ci sono 4 e 8; **mancano 3 e 6** |
| griglia 4px, padding 12 / 24 | `--space-1` 4 … `--space-3` 12 … `--space-6` 24 | ✅ `_spacing.scss:13-24` |
| focus ring `0 0 0 3px rgba(51,65,85,.15)` | — | ❌ **manca**; il colore è `--color-accent` |
| ombra popover `0 4px 12px rgba(0,0,0,.08)` | `--shadow-md` (A) | ✅ `_shadows.scss:35` — **solo in (A)** |
| motion 150ms ease-out | `--transition-fast` (A) | ✅ `_transitions.scss:36` — in (B) è `150ms ease`, curva diversa |

**Token da aggiungere** (in entrambi i file `_colors-light` e `_colors-dark`, per la regola 28 e
la §7.2 di `CLAUDE.md`): `--color-bg-summary` (`#fcfdfe`), `--color-error-text` (`#b91c1c`),
`--color-warning-text` (`#b45309`), `--color-marker-required` (`#0ea5e9`, oppure promuovere
`--color-sky-500` dal sistema primitivo al semantico); e fuori dai colori
`--control-height-sm/md/lg` (24/26/28), `--radius-xs` (3px), `--radius-control` (6px),
`--focus-ring` (`0 0 0 3px rgba(51,65,85,0.15)`), `--text-2xs` (10px), `--text-md` (12px),
`--text-title` (16px).

**Font**

- **IBM Plex Mono è caricato**, ma da Google, non dal pacchetto:
  `_typography.scss:83` — `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap')`,
  ed è il primo nome di `--font-mono` (`:16`). Nessun `@fontsource` per Plex in `package.json`
  (l'unico è `@fontsource-variable/inter`, importato da `index.tsx:8`). Il commento a `:78-79` lo
  dichiara: «IBM Plex Mono: ancora da Google. Portarlo in locale richiede una dipendenza nuova e
  non e' stato fatto qui». Conseguenza operativa: **offline i pesi 400/500/600 non risolvono** e la
  resa cade su Monaco. Non blocca la Slice 1; va detto perché il mockup usa il mono per
  molteplicità, JjEL, valori derivati e conteggi, cioè ovunque.
- Inter: self-hosted, `@fontsource-variable/inter@^5.2.6`, importato. ✅

**Bootstrap Icons**: installato **1.13.1** (`package.json:32`, verificato in
`node_modules/bootstrap-icons/package.json`), l'handoff chiede v1.13. Tutti i 16 glifi elencati
esistono in `node_modules/bootstrap-icons/font/bootstrap-icons.css` — verificati uno per uno con
`grep '^\.bi-<nome>::before'`: `chevron-down`, `chevron-up`, `chevron-right`, `x`, `plus`, `dash`,
`search`, `x-circle-fill`, `exclamation-triangle-fill`, `check-circle`, `lock-fill`, `link-45deg`,
`diagram-3`, `ui-checks`, `eye`, `info-circle`. Zero mancanti.

---

### Finding 8 — Controlli condivisi: il kit esiste già ed è quasi completo

Il risultato che cambia di più il piano. `frontend/src/components/ui/` è una libreria di form con
barrel export (`ui/index.ts`), CSS Modules per componente, e props tipizzate esportate.

| Controllo del mockup | Esiste | Path | Verdetto |
|---|---|---|---|
| segmented Basic/Advanced | ✅ | `ui/SegmentedControl/SegmentedControl.tsx` | **riusabile così com'è**: `options`, `value`, `onChange`, `ariaLabel`, tastiera con frecce già implementata |
| checkbox stilizzata | ✅ | `ui/Checkbox/` | riusabile |
| campo con label + messaggio | ✅ | `ui/Field/Field.tsx` | **adattabile**: monta `Label` + children + `HelpText`/`ErrorText`, ma il messaggio **non è uno slot ad altezza fissa** — è condizionale (`{error && <ErrorText/>}`), quindi produce layout shift. Va aggiunto uno slot 16px sempre riservato: è il vincolo duro della decisione 7 |
| select | ✅ | `ui/Select/Select.tsx` | **adattabile**, con la trappola sotto |
| number stepper | ✅ | `ui/NumberInput/` | da verificare se ha i due segmenti `-`/`+` dentro il bordo; altrimenti adattabile |
| input di testo | ✅ | `ui/Input/` | riusabile |
| textarea | ✅ | `ui/Textarea/` | riusabile (il mono 12px è stile) |
| toggle | ✅ | `ui/Toggle/` | riusabile |
| lista editabile | ✅ | `ui/ListEditor/` | candidato per reference list / value list — da valutare |
| sezione di form | ✅ | `ui/FormSection/` | candidato per i temi `plain` / `card` |
| empty state | ✅ | `ui/EmptyState/` | riusabile per l'artboard 4a |
| tooltip informativo | ✅ | `ui/InfoTooltip/` | riusabile |
| chip / pastiglia | ⚠️ | nessun componente; `ui/index.ts:75` ha `// export { Badge }` commentato | **da scrivere** |
| popover ancorato | ❌ | nessun primitivo generico. I precedenti sono ad-hoc: `EdgeTypePopup.tsx`, `M1ReferencePopup.tsx` (entrambi con la superficie chiara approvata il 26/8) | **da scrivere**, prendendo la superficie e i glifi da `EdgeTypePopup.scss` |
| campo di ricerca | ⚠️ | il rail ne ha uno, `.tree-search` in `properties-with-tree-view.scss`, ma non estratto | **da scrivere** o estrarre |
| reference picker | ❌ | **non esiste in nessuna forma**. Il classico usa una `<select>` nuda (`Info.tsx:840-845`) | **da scrivere** |

**La trappola di `Select.tsx`.** Il prompt la cita a `:111`; misurato, la riga è **113**:

```tsx
// components/ui/Select/Select.tsx:113
<option value="">{placeholder}</option>
```

È **incondizionata**: viene sempre anteposta, anche quando `placeholder` è `undefined` (in tal caso
l'opzione esiste con etichetta vuota). Ogni `onChange` della form deve quindi mappare `''` sul
default della feature, mai scriverlo come valore. Ha già morso una volta: il vocabolario chiuso di
`edge.routing` in `irValidate.ts` esiste per questa ragione, e lo dice —

> `irValidate.ts:139-141` — «the values this rule exists to catch (**the empty string of a Select
> placeholder**, an AI provider's guess, a direct store edit) are outside the declared union».

---

### Finding 9 — Persistenza della modalità

Le preferenze UI per utente stanno **tutte** in `localStorage`, senza un wrapper comune. Inventario
completo delle chiavi (30, estratte con grep su `localStorage.getItem/setItem`):

`_jj_update_date`, `_jjRecent`, `console_height`, `debug-mode`, `debug`, `editor-v2-color-scheme`,
`editor-v2-notation`, `jjodel_console_footer_height`, `jjodel_console_language`,
`jjodel_layout_mode`, `jjodel_tree_view_open`, `jjodel_vertical_console_height`,
`jjodel-avatar-color`, `jjodel-dismissed-notifications`, `jjodel-quick-tips-state`,
`jjodel.customPalettes`, `jjodel.editorPrefs.<modelid>`, `jjodel.highlightMode`,
`jjodel.interfaceMode`, `jjodel.showBackground`, `jjodel.showEdgeLabels`, `jjodel.showGrid`,
`jjodel.showMinimap`, `jjodie-settings`, `jjtl-*`, `projectModified`, `theme`, `user`.
In `PropertiesWithTreeView.tsx` altre cinque, tutte `jjodel_property_*`.

**Quattro convenzioni di naming coesistono** (`jjodel_snake`, `jjodel.dotted`, `jjodel-kebab`,
`editor-v2-*`). La più recente e la sola con un idioma **per-scope** è quella dotted, dichiarata
come idioma documentato:

```ts
// components/abstract/tabs/EditorSwitch.tsx:15
// (`jjodel.editorPrefs.${modelid}`), following the documented idiom in ...
const raw = localStorage.getItem('jjodel.editorPrefs.' + modelid);   // :24
localStorage.setItem('jjodel.editorPrefs.' + modelid, JSON.stringify(next));  // :35
```

**Chiave proposta**: `jjodel.formPrefs.<viewId>`, valore JSON `{"mode":"basic"|"advanced"}`.
Un oggetto e non una stringa nuda, così i temi e lo stato di collasso delle sezioni (inspector)
entrano poi senza una seconda chiave. Il fallback quando la chiave manca **non** è `'basic'`
cablato: è `getInterfaceMode()` (`hooks/useInterfaceMode.ts:23`), così una form mai aperta eredita
la modalità globale dell'utente invece di contraddirla.

Attenzione: il rail oggi ha **due** nozioni di "advanced" — `state.advanced` in Redux
(`PropertiesWithTreeView.tsx:347`, pilotato dalla Navbar) e `jjodel.interfaceMode` in
localStorage. Il README ne chiede una terza, per view. Tre assi per lo stesso concetto è una
decisione da prendere, non da subire. Vedi domanda aperta A2.

---

### Finding 10 — Collisioni di nomi: nessuna

Cercato con `command grep` (BSD grep, non il wrapper `ugrep --ignore-files` della shell — vedi
`CLAUDE.md` §5, dove `--include` è letto come nome di file e i path gitignorati sono saltati in
silenzio), su tutto `frontend/src`, includendo `*.ts`, `*.tsx`, `*.scss`.

**Controlli positivi** (senza i quali questi zeri non provano niente): `CompiledView` → **23**
occorrenze; `ir-compartment` → **7**; `ir-row` → **16**. Le ricerche hanno segnale.

| Nome | Occorrenze | Esito |
|---|---|---|
| `FormSpec` | 0 (exit 1) | libero |
| `WidgetKind` | 0 (exit 1) | libero |
| `FormHost` | 0 (exit 1) | libero |
| `IRForm` | 0 (exit 1) | libero |
| `IRField` | 0 (exit 1) | libero |
| `useIRForm` | 0 (exit 1) | libero |
| `formSpec` | 0 (exit 1) | libero |
| `FormTheme` | 0 (exit 1) | libero |
| `FeatureTreatment` | 0 (exit 1) | libero |
| `.ir-form`, `.ir-form__section` | 0 (exit 1) | libero |
| `.ir-field`, `.ir-field__`, `.ir-field--` | 0 (exit 1) | libero |
| `.ir-picker` | 0 (exit 1) | libero |

**Tutti i nomi proposti dal prompt sono disponibili.** Due note comunque:

- `FormSection` **esiste** (`components/ui/FormSection/`). Non collide con `ir-form__section`, ma
  se la Slice 1 riusa quel componente i due nomi convivono a 3 righe di distanza: preferire
  `ir-form__group` per la classe, o riusare `FormSection` e non inventare la classe.
- `Field` esiste come componente (`ui/Field`). `IRField` non collide, ma la coppia
  `<Field>` / `<IRField>` nello stesso file si legge male. Nome alternativo: `IRFormField`.

Fuori da `frontend/src` (altri `.scss`/`.css` del progetto, esclusi i `node_modules`): zero
occorrenze delle tre classi.

---

### Finding 11 — `validateIR` e `VersionFixer`: nessun bump, con **un** avvertimento

**`validateIR` NON rifiuta chiavi sconosciute.** È permissivo per costruzione: applica quattro
regole mirate (vocabolario degli operatori di predicato, `shape.padding`, `edge.routing`,
endpoint dell'edge) e poi usa il **compile come validatore**:

```ts
// irValidate.ts:172-179
try {
    if (ir.kind === 'edge') compileEdgeView(viewId, ir as EdgeViewIR);
    else if (ir.kind === 'row') compileRowView(viewId, ir as RowViewIR);
    else compileView(viewId, ir);
    return { ok: true };
} catch (e) { return { ok: false, error: ... }; }
```

`compileView` legge i campi che conosce e ignora il resto. Un `form?: FormSpec` passa senza che
`validateIR` sappia della sua esistenza. **`form` non va registrato** perché non c'è un registro
di chiavi da aggiornare.

**L'avvertimento, ed è concreto.** Una regola di `validateIR` è **generica e cammina su tutto l'IR**:

```ts
// irValidate.ts:74-80
const op = (node as { op?: unknown }).op;
if (typeof op === 'string' && !Object.prototype.hasOwnProperty.call(VALID_PREDICATE_OPS, op)) return op;
for (const value of Object.values(node as Record<string, unknown>)) { ... ricorsione ... }
```

Il commento la motiva: «`op` is a key of `Predicate` and of nothing else in the schema (measured on
irTypes.ts)». **`FormSpec` non deve introdurre una chiave `op` con valore stringa** in nessun punto
della sua struttura, o l'intera view viene rifiutata dall'authoring con un errore che parla di
operatori di predicato. La bozza del prompt non ne ha; è un vincolo da mettere per iscritto ora,
prima che qualcuno aggiunga un `op: 'contains'` a un filtro dei candidati del picker.

**Bump di `DState.version.n` / entry in `VersionFixer`: no.** Un campo opzionale assente su tutte
le view salvate significa "usa il default", che è esattamente il comportamento di prima. I tre
precedenti citati dal prompt lo dicono nel codice, non solo nei log:

- `marker` (15/8) — `irTypes.ts:166-172`: «Additive optional field: no irVersion bump, no
  VersionFixer migration (same precedent as authoringMetaclassPins)».
- `ShapeSpec.padding` (25/8) — `irTypes.ts:180-183`: «Absent = 'normal'. Additive optional field:
  no irVersion bump, no migration (same precedent as `marker`)».
- `RowViewIR.style` / `FieldCompartmentSpec.rowFormat.style` (ir-1.3) — `:146`: «Additive optional
  field: no irVersion bump, no migration».

Il criterio generale è in `irTypes.ts:408` e altrove come **R-B9**: l'IR salvato **non ha un
VersionFixer**, quindi ogni nome persistito è definitivo e ogni campo nuovo deve essere opzionale.
Corollario per la Slice 1: i literal di `FormTheme`, `WidgetKind` e `FeatureTreatment` sono
**irreversibili** una volta scritti su una view salvata. Vanno decisi con quella consapevolezza.

`VersionFixer.tsx` (`frontend/src/redux/`, l'ultima migrazione è `'2.227 -> 2.228'` a `:1188`)
non va toccato. Precedente pertinente: `'2.225 -> 2.226'` (`:998`) **aggiunge** `e.ir` alle view di
default classiche ed è idempotente (`:1027`, `if (e.ir !== undefined || e.irLegacyClassic) continue`)
— quella è la forma che servirebbe *se* un giorno si volesse seminare una `form` di default su
view esistenti. Non nella Slice 1.

---

### Finding 12 — Critical zone

**`useJjomSync.ts`: NO.** La Slice 1 non lo apre. La form legge da `idlookup` via `useSelector` e
scrive via `LValue`, e nessuno dei due passa dal sync. Il sync reagisce a `graph.subElements` e ai
contatori M2, non ai valori degli slot — è esattamente il limite del passo 4 documentato in
`CLAUDE.md` §3.5, e qui gioca a favore: una scrittura di slot dalla form non risveglia il sync.

**`portDistribution.ts`: NO.** Nessuna geometria, nessun handle, nessun arco.

**`canvasToJjom.ts`: NO**, se il contratto del finding 2 viene adottato (`LValue` invece di
`syncUpdateFeatureValue`). Se invece si scegliesse `syncUpdateFeatureValue`, il file resterebbe
comunque solo *letto*, non modificato — ma la Slice 1 sarebbe monca (niente multivalore, niente
add/remove, rotta senza vertice).

**`editor-v2/problems/`: SÌ, e qui mi fermo.** È in critical zone per `CLAUDE.md` §3.1
(«Validation overlay with own registry — touches canvas»), e il finding 6 mostra che la Slice 1 ha
bisogno di **due righe additive** lì dentro:

1. `registry.ts` — `featureName?: string` su `ConformanceProblemDetail`;
2. `conformanceToProblems.ts` — la sua copia in `agg.violations.push({...})`.

**Serve il Layer Impact Report di §3.2 prima della Fase 2**, e il perimetro dichiarato sarà questo:
due campi opzionali su un tipo e una riga di copia, zero cambi di comportamento per i consumatori
esistenti (`NodeProblemIndicator` conta `p.conformance?.length`, non i campi; `NodeProblemOverlay`
rende `message`). Nessun `.new()`, nessuna `TRANSACTION`, nessuna scrittura Redux: la modifica è a
un tipo e a una funzione pura, che ha già i suoi test
(`problems/__tests__/`, il commento di `conformanceToProblems.ts:4-6` dice che è estratta apposta
per essere testabile senza React/Redux).

**Nota di scope (regola 1b)**: `model/conformance/` **non** va toccato — `metamodelElementName` è
già popolato all'origine. Il buco è solo nell'aggregatore.

---

## 4. Proposta: `FormSpec` in `irTypes.ts`

Correzioni alla bozza del prompt, ciascuna con la ragione misurata sopra.

```ts
/**
 * FormSpec (2026-08-26) — supplemento OPZIONALE che descrive come la stessa view
 * si rende come form con widget editabili, invece che come simbolo sulla tela.
 * Una view può avere solo `shape`, solo `form`, o entrambi.
 *
 * Additivo: nessun bump di irVersion, nessuna migrazione VersionFixer (stesso
 * precedente di `marker`, `ShapeSpec.padding`, `RowViewIR.style`). L'IR salvato
 * non ha un VersionFixer (R-B9): ogni literal qui sotto è definitivo.
 *
 * VINCOLO — nessuna chiave `op` con valore stringa può comparire dentro questa
 * struttura, a nessuna profondità: `irValidate.findUnknownPredicateOp` cammina
 * su tutto l'ir e tratta ogni `op` stringa come un operatore di predicato,
 * rifiutando l'intera view. Vedi irValidate.ts:74.
 */
export type FormTheme = 'plain' | 'card' | 'compact' | 'inspector';

/**
 * Vocabolario dei widget. I primi cinque nomi sono ESATTAMENTE quelli già
 * persistiti da FieldSegment.value.editable e LabelSpec.editable (irTypes.ts:105,
 * :127): superset compatibile, mai un vocabolario divergente.
 * 'number', 'reference' e 'link' sono nuovi.
 */
export type WidgetKind =
    | 'text' | 'textarea' | 'select' | 'checkbox' | 'color'   // già persistiti altrove
    | 'number' | 'reference' | 'link';                        // nuovi

/** Come si rende una feature di riferimento o di containment. */
export type FeatureTreatment = 'inline' | 'list' | 'hidden';

export interface FormSpec {
    /** Assente = 'plain' nel rail, 'card' nel documento (raccomandazione 3 dell'handoff:
     *  il default DIPENDE dall'host, quindi non si materializza qui). */
    theme?: FormTheme;
    /** Assente = 'above'. 'left' è onorato solo dal tema 'compact' (raccomandazione 1). */
    labelPlacement?: 'above' | 'left';
    /**
     * Override del widget derivato dal tipo. Chiave: il NOME della feature, non un
     * PathExpr. Ragione: la form enumera gli slot di self (LObject.features), non
     * naviga; un PathExpr multi-hop qui non avrebbe un valore scrivibile, e la
     * chiavizzazione per nome è quella che usano già syncUpdateFeatureValue,
     * resolveReferenceIdByName e le diagnostiche di conformance
     * (metamodelElementName). Assente = derivato dal tipo (spec IR v1.2 §10).
     */
    widgets?: Record<string, WidgetKind>;
    /** Riferimenti e figli di containment. Stessa chiavizzazione per nome.
     *  Assente = 'inline' per upperBound 1, 'list' per i multivalore. */
    features?: Record<string, FeatureTreatment>;
    /** Feature visibili in Basic. Assente = euristica lowerBound >= 1.
     *  Nomi di feature, non PathExpr, per la stessa ragione di `widgets`. */
    basic?: string[];
}
```

E su ciascuna delle tre interfacce di view, un solo campo:

```ts
export interface VertexViewIR      { ...; shape: ShapeSpec; fieldCompartments?: ...; form?: FormSpec; }
export interface GraphVertexViewIR { ...; containment: {...};                        form?: FormSpec; }
export interface EdgeViewIR        { ...; edge: {...};                               form?: FormSpec; }
```

**Tre differenze rispetto alla bozza del prompt, tutte dal codice:**

1. **`Record<PathExpr, …>` → `Record<string, …>`.** `PathExpr` è un `type PathExpr = string`
   (`irTypes.ts:20`), quindi la firma non cambia tipo — ma cambia il **contratto**. Un `PathExpr`
   promette che il valore sia navigabile e compilabile in accessor; la form enumera `LObject.features`
   e scrive per indice su uno slot. Chiamarlo `PathExpr` inviterebbe `$ref.value.name`, che non è
   scrivibile. Il nome nudo è ciò che l'intero codebase già usa come chiave di feature.
2. **`WidgetKind` allineato ai cinque literal già persistiti.** La bozza ne proponeva sette con
   `'text'|'textarea'|'number'|'checkbox'|'select'|'reference'|'link'` — manca `'color'`, che
   `FieldSegment.value.editable` persiste già oggi. Due vocabolari divergenti per la stessa cosa,
   entrambi irreversibili per R-B9, sarebbero un debito da subito.
3. **`theme` senza default materializzato nel compile.** `padding` materializza `'normal'` in
   compile (`irCompile.ts:314`) perché il default è unico. Qui no: la raccomandazione 3 dice plain
   nel rail e card nel documento, cioè il default è **dell'host**. Il compile deve lasciare
   `undefined` e l'host decidere, o la Slice 3 troverà ogni view già cablata su `plain`.

**Nel compile** (`irCompile.ts`, dentro `compileView`, accanto a `padding`/`text`) — un passthrough,
nessuna compilazione:

```ts
// FormSpec non contiene PathExpr né Predicate: niente accessor, niente `deps`,
// nessun crossPath, nessun channel. Passa così com'è.
const form = ir.form ?? null;
```

e su `CompiledView`: `/** FormSpec dichiarata dalla view; null quando non ne dichiara. */ form: FormSpec | null;`

---

## 5. Piano dei file della Slice 1

Scope: artboard 1a/1b, 2a-2d, 3a. Host: **tab nuovo** accanto al Properties nel rail, non
sostituzione.

### Da creare (11 file)

| File | Cosa fa | Diff stimata |
|---|---|---|
| `editor-v2/viewpoint/ir/IRForm.tsx` | Interprete: prende `CompiledView` + `objectId`, enumera gli slot, applica `basic`/`features`, rende le sezioni per compartimento (Identity/Behavior/… ← `fieldCompartments`), applica il tema. Header con badge + nome + metaclasse + segmented + slot riepilogo 32px. | ~260 |
| `editor-v2/viewpoint/ir/IRFormField.tsx` | Un campo: label row (label + punto required + molteplicità mono), widget, **slot messaggi 16px sempre riservato**. Nome `IRFormField` e non `IRField` per non affiancare `<Field>` di `ui/`. | ~150 |
| `editor-v2/viewpoint/ir/useFormWidgets.ts` | Derivazione widget ← metamodello. Porta la mappa tipo→field di `Info.tsx:710-719` e la classificazione attributo/enum/riferimento/composition di `:770-790`. Legge `__raw.lowerBound`/`__raw.upperBound`. Applica gli override di `form.widgets`. | ~140 |
| `editor-v2/viewpoint/ir/useFormDiagnostics.ts` | Diagnostica per campo: `useNodeProblems(objectId)` → raggruppa per `featureName` → `{severity, message}[]` per feature + conteggi per il riepilogo. Nessun validatore nuovo. | ~90 |
| `editor-v2/viewpoint/ir/useIRFormView.ts` | `useIRRowView` (`irResolve.ts:160`) chiavizzato sull'objectId, con `resolveIRView` al posto di `resolveRowView`. In alternativa: 40 righe dentro `irResolve.ts`, che però è già a 209 — meglio a parte. | ~60 |
| `editor-v2/viewpoint/ir/formWrite.ts` | Il contratto del finding 2, in un posto solo: `setSlotValue(slot, i, v, isPtr)`, `addSlotValue(slot, type)`, `removeSlotValue(slot, i, isPtr)`, ciascuna con `TRANSACTION` e `U.isProjectModified` condizionato. | ~90 |
| `editor-v2/viewpoint/ir/widgets/` (5 file) | `TextWidget`, `NumberStepperWidget`, `CheckboxWidget`, `SelectWidget`, `TextareaWidget`. Sottili: avvolgono `ui/Input`, `ui/NumberInput`, `ui/Checkbox`, `ui/Select`, `ui/Textarea` normalizzando `''` → default (finding 8) e l'altezza al tema. | ~55 l'uno, ~275 |
| `editor-v2/viewpoint/ir/ReferencePicker.tsx` | Da scrivere. Input con badge + nome + chevron; popover con search 28px e candidati 26px da `slot.validTargetOptions`; tastiera type/frecce/Enter. Superficie e glifi da `EdgeTypePopup.scss`. | ~230 |
| `editor-v2/viewpoint/ir/irFormStyle.scss` | I quattro temi, la label row, lo slot 16px, lo slot 32px, gli stati di validazione. **SCSS, non iniezione runtime**: `irStyle.ts` inietta perché genera una classe *per view*; qui lo stile è per tema, statico. | ~380 |
| `editor-v2/viewpoint/ir/__tests__/useFormWidgets.test.ts` | La derivazione widget è pura: dieci tipi primitivi, enum, riferimento, composition, i tre bordi di molteplicità, gli override. | ~180 |

### Da toccare (5 file)

| File | Cosa cambia | Diff |
|---|---|---|
| `editor-v2/viewpoint/ir/irTypes.ts` | `FormTheme`, `WidgetKind`, `FeatureTreatment`, `FormSpec`; `form?: FormSpec` sulle tre interfacce; `form: FormSpec \| null` su `CompiledView`. Solo aggiunte di proprietà opzionali (regola 11 rispettata). | +55 |
| `editor-v2/viewpoint/ir/irCompile.ts` | Una riga in `compileView` (`const form = ir.form ?? null;`) e una nel literal di ritorno. | +4 |
| `editors/PropertiesWithTreeView.tsx` | Barra tab sopra `Info` (`Properties` \| `Form`), stato locale, `IRForm` nel secondo ramo. Il tab `Form` compare solo se il soggetto è un `DObject` e `useIRFormView` risolve. | +70 |
| `editor-v2/problems/registry.ts` | **critical zone** — `featureName?: string` su `ConformanceProblemDetail`. | +2 |
| `editor-v2/problems/conformanceToProblems.ts` | **critical zone** — copia di `v.metamodelElementName` in `featureName`. | +1 |

### Token (2 file, sempre in coppia — §7.2)

`styles/tokens/_colors-light.scss` e `_colors-dark.scss`: i token mancanti del finding 7. ~+30 in
totale. Le dimensioni non-colore (altezze 24/26/28, raggi 3/6, focus ring, 10/12/16px) vanno in
`_spacing.scss` / `_radius.scss` / `_typography.scss` / `_shadows.scss`. ~+20.

**Totale: 11 nuovi + 7 toccati = 18 file.** Oltre la soglia di 5 della regola 19: la Fase 2 va
aperta elencandoli e chiedendo conferma. Diff stimata **~2100 righe**, di cui ~1850 nuove e ~130 in
file esistenti.

**Suggerimento di taglio, se 18 file sono troppi in un colpo.** Un 1a che chiude gli artboard 1a/1b
+ 2a con **8 file** (`IRForm`, `IRFormField`, `useFormWidgets`, `useIRFormView`, `formWrite`, i tre
widget di testo/numero/checkbox), tema `plain` soltanto, senza picker, senza liste, senza
diagnostica (slot messaggi riservato ma sempre vuoto). Poi 1b con gli altri tre temi, il picker,
le liste e i due file di `problems/` — che è anche l'unico pezzo che chiede il Layer Impact Report,
e isolarlo lo rende più leggibile. **Raccomandato.**

---

## 6. Dipendenze e rischi

| # | Rischio | Evidenza | Mitigazione |
|---|---|---|---|
| R1 | **`syncUpdateFeatureValue` scelto per "riusare il percorso della tela" romperebbe metà del mockup** | `canvasToJjom.ts:1472` — vertexId, `.value` (indice 0), niente add/remove | Contratto `LValue` del finding 2; nota nel prompt di Fase 2 che è *lo stesso* percorso, un gradino sotto |
| R2 | **La feature del problema non arriva al campo** | `conformanceToProblems.ts:50-54` la scarta | Due righe additive in critical zone, con LIR |
| R3 | **Tre sistemi di token, il rail non ne usa nessuno** | finding 7; `properties-with-tree-view.scss:63-75` sono `$var` con esadecimali | Decidere A1 **prima** dello SCSS |
| R4 | **Layout shift** — `ui/Field` rende il messaggio in modo condizionale | `Field.tsx:60-66`, `{error && <ErrorText/>}` | Slot 16px in `IRFormField`, non delegato a `Field`; gate di smoke che misura l'altezza del campo con e senza messaggio |
| R5 | **`''` del `Select` scritto come valore** | `Select/Select.tsx:113` incondizionato | Normalizzazione dentro `SelectWidget`, non in ogni chiamante |
| R6 | **`.values` imbottito** falsa il conteggio della molteplicità | `canvasToJjom.ts:1543-1546` | Contare `__raw.values` filtrato; test sul caso `[1..1]` vuoto |
| R7 | **D15, last-writer-wins fra rail e modal entro 300ms** | citato dal prompt; il commit dell'authoring è debounced (`VertexAuthoringPanel.tsx:144-153`) | La form scrive M1, l'authoring scrive `view.ir`: **non sono lo stesso dato**. Il rischio è reale solo per la Slice 2 |
| R8 | **`isProjectModified` non aggiornato** | `Info.tsx`: zero occorrenze | Replicare `IRNodeContent.tsx:189`; **non** estendere la correzione a `Info.tsx` (fuori scope, regola 1) |
| R9 | **IBM Plex Mono da CDN** | `_typography.scss:83` | Nessuna azione nella Slice 1; il fallback Monaco regge. Da segnalare, non da risolvere |
| R10 | **Un `op` stringa dentro `FormSpec` rifiuta la view intera** | `irValidate.ts:74-80` | Vincolo scritto nel doc-comment di `FormSpec`; un test che valida una view con `form` popolata |
| R11 | **I literal sono irreversibili** (R-B9, niente VersionFixer sull'IR) | `irTypes.ts:408` | Chiudere `WidgetKind`/`FormTheme` in chat prima di scrivere |

---

## 7. Domande aperte per Alfonso

**A1 — Quale sistema di token per lo SCSS della form?** (blocca lo SCSS, non il resto)
Tre opzioni. (a) `styles/tokens/` semantico: coerente con la §7.2 di `CLAUDE.md` e ha già
`--shadow-md` = l'ombra esatta del popover, ma i componenti `ui/` che la form riusa parlano
`tokens.css`, quindi nello stesso campo convivono due namespace. (b) `tokens.css` primitivo: allineato
al kit, ma è il file in **ritiro** (`tokens.css:11-18`) e ha `--shadow-md` sbagliato per l'handoff.
(c) `editor-v2/_themes.scss`: è quello che usa `irStyle.ts`, cioè il vicino di casa dell'interprete,
ma la form vive nel rail, fuori da `.editor-v2` — anche se le mappe sono emesse anche su `:root`
proprio per i portal (`_themes.scss:11-17`). **Mia raccomandazione: (a)**, aggiungendo i token
mancanti, e i componenti `ui/` lasciati parlare il loro namespace senza toccarli.

**A2 — Tre assi Basic/Advanced.** Oggi: `state.advanced` (Redux, Navbar) e `jjodel.interfaceMode`
(localStorage). Il README ne chiede un terzo per view. Il toggle della form deve (a) essere
indipendente, (b) inizializzare da `interfaceMode` e poi divergere per view (proposta del finding 9),
o (c) pilotare quello globale? La (c) farebbe cambiare il pannello proprietà accanto quando si tocca
il segmented della form: sconsigliata.

**A3 — Badge entità ambra vs rosa.** L'handoff dice `State` "S" = `#fef3c7 / #b45309`; il token
esistente per `object` è `#F4E5EA / #6B4B56`, generato in OKLCH da R-RAIL-30 e unificato apposta
(`entityMeta.ts:5-9`). Adottare l'ambra rifà divergere quella scala e mette due colori per lo stesso
badge a 300px di distanza nella stessa colonna. Tenere i token, o cambiare la scala, o l'ambra è
riservata alla **metaclasse** e il rosa all'**oggetto**?

**A4 — `textarea` JjEL: come si sa che è JjEL?** `entryAction` e `guard` sono `EString` come `name`.
Nel mockup hanno mono 12px, 44-56px e l'hint "JjEL". Il tipo non lo dice. Tre vie: (a) override
d'autore in `form.widgets` (funziona, ma va scritto su ogni view); (b) una convenzione sul nome del
tipo (fragile); (c) un flag sul metamodello. Per la Slice 1 propongo (a) — è quello che
`form.widgets` esiste per fare — ma va detto, perché significa che la "default form" di uno
Statechart **non** mostra JjEL come JjEL finché l'autore non lo dichiara.

**A5 — Il tab `Form` è sempre visibile?** Ipotesi mia: compare solo quando il soggetto è un `DObject`
e `useIRFormView` risolve una view. Su una `DClass` (M2) o senza viewpoint IR attivo, il rail mostra
solo `Properties`, come oggi. Confermi?

**A6 — Taglio 1a/1b.** 18 file in un colpo sfondano la regola 19. Preferisci il taglio in due passi
del §5 (8 file senza picker/liste/diagnostica, poi il resto con il LIR isolato), o una Fase 2 unica
con l'elenco confermato in apertura?

**A7 — Le sezioni della form vengono dai `fieldCompartments`?** L'handoff dice «sections map to the
view's compartments: Identity, Behavior, Transitions, Substates». Ma i compartimenti oggi hanno
`source` fra tre valori e un `id`, non un titolo: `FieldCompartmentSpec` (`irTypes.ts:132`) non ha
un campo `label`. Le sezioni prendono il titolo dall'`id` del compartimento (che è una stringa
d'autore, quindi utilizzabile), o serve un `title?: string` — un secondo campo additivo, in una
struttura diversa da `FormSpec`?

---

## 8. Hard stop

Fase 1 chiusa. Nessun file sotto `frontend/` creato o modificato. La Fase 2 non parte finché non
arrivano il go-ahead e almeno le risposte ad **A1**, **A6** e **A7** — le sole tre che cambiano il
piano dei file invece del contenuto dei file.

Il Layer Impact Report di §3.2 per `editor-v2/problems/` va prodotto in chat prima di qualunque
diff, anche se il perimetro è di tre righe.

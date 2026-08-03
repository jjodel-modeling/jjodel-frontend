# Discovery READ-ONLY: stato e azioni — dove scrivono gli eventi, su sintassi astratta e concreta

**Data**: 2026-08-03. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD locale `c9b961343` (30 commit non pushati sopra `origin/alfonso-frontend-jjtl` = `07cee5219`). Working tree con WIP estraneo (lane TextStyle: `ObjectNode.tsx`, `LabelEntryEditor.tsx`, `TextStyleEditor.tsx`, `irStyle.ts`, `TextStyleField.tsx`, `MegamodelView.tsx`, `_form-system.scss`, più i PDF/tex del paper), lasciato intatto. Uniche scritture: questo report + l'entry in `docs/claude-code-log.md`. Nessun edit al codice, nessuno stash/checkout, nessun `git add .`.

**Documento prompt**: 2026-08-03 16:28 `prompt_discovery_state_actions_events`.

## Obiettivo

Mappare, con `file:riga` verificati a HEAD, il comportamento reale e il substrato disponibile per **stato mutabile** e **azioni** nell'IR: cosa fa oggi il tab Events, quali write path canonici esistono verso la sintassi astratta, quale stato di sintassi concreta è già cablato caso per caso, se esiste un substrato generico riusabile, quali canali di reattività il codice già offre, dove si innesterebbe un namespace di stato nelle espressioni, e quanto costerebbe una vista di copertura delle feature.

**Non** si propone uno schema e **non** si progetta la soluzione. La sezione finale elenca le strade praticabili senza sceglierne una.

---

## File letti (path completi, tutti sotto `/Users/alfonso/jjodel`)

**Tab e authoring di view**: `frontend/src/components/editors/views/ViewData.tsx` (248, integrale), `frontend/src/components/editors/views/data/CustomData.tsx` (157, integrale), `frontend/src/components/editors/languages/Js.tsx` (`:1-90`), `frontend/src/components/editors/viewpoint/properties/ViewProperties.tsx` (`:1-60`, `:300-360`), `frontend/src/components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx` (`:1-60`).

**Definizione e logica della view**: `frontend/src/view/viewElement/view.tsx` (`:160-260`, `:1060-1270`, grep integrali su `events`/`VIEWS_RECOMPILE`).

**Compilazione ed esecuzione degli handler**: `frontend/src/redux/reducer/reducer.ts` (`:730-760`, `:880-1000`, `:1040-1090`), `frontend/src/common/sharedTypes.tsx` (integrale, 238), `frontend/src/joiner/classes.ts` (`:2205-2340`, `:4010-4110`, `:1420-1430`), `frontend/src/model/dataStructure/GraphDataElements.tsx` (`:85-95`, `:150-162`, `:355-375`, `:880-925`, `:1662-1740`), `frontend/src/common/U.tsx` (`:205-240`, `:425-450`, `:2420-2480` — blocco commentato).

**Write path canonici (critical-adiacente, sola lettura)**: `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`:1-140`, `:533-580`, `:1390-1430`), `frontend/src/model/logicWrapper/LModelElement.tsx` (`:7405-7540`), `frontend/src/jjscript/executor/commands/instance.ts` (`:570-610`), `frontend/src/model/conformance/ConformanceValidator.ts` (`:1-40`), `frontend/src/model/conformance/useConformance.ts` (`:20-60`), `frontend/src/components/editor-v2/hooks/useHistory.ts` (`:1-70`), `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` (`:1-60`), `frontend/src/api/persistance/projects.ts` (`:85-120`), `frontend/src/components/topbar/SaveManager.ts` (`:1-80`).

**IR core**: `irTypes.ts` (378, integrale), `irCompile.ts` (501, integrale), `irResolveCore.ts` (362, integrale), `irReadCtx.ts` (147, integrale), `irReadCtxLproxy.ts` (54, integrale), `irResolve.ts` (`:1-120`), `irEdgeInteraction.ts` (129, integrale), `irCollapseState.ts` (62, integrale), `irValidate.ts` (25, integrale), `useIRContainment.ts` (`:1-180`), `IRNodeContent.tsx` (`:1-150`), `IRRow.tsx` (integrale), grep su `irStyle.ts`, `irDefaults.ts`, `irCrossDeps.ts`.

**Canvas**: `frontend/src/components/editor-v2/EditorV2.tsx` (`:125-180`, `:1310-1375`), `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (`:380-460`), `frontend/src/components/editor-v2/nodes/ClassNode.tsx` (`:70-210`, `:400-445`), `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (`:95-120`), `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx` (31, integrale), `frontend/src/components/abstract/tabs/EditorSwitch.tsx` (`:39-130`).

**Proxy e persistenza**: `frontend/src/joiner/proxy.ts` (`:200-470`), `frontend/src/redux/VersionFixer.tsx` (`:825-860`, elenco integrale dei nomi di metodo).

**Widget di authoring PathExpr**: `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` (`:1-90`), `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx` (`:40-110`).

**Documenti**: `CLAUDE.md`, `docs/PROTOCOL.md` (indice), `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (§5, §12, §13), `docs/claude-code-log.md` (ultime entry), `frontend/src/events/registry.ts`.

---

# Findings

## 1. Il tab Events: cosa è, cosa persiste, chi lo esegue

### 1.1 Elenco reale dei sotto-tab

`ViewData.tsx:65-142` costruisce la lista. L'elenco atteso dal prompt è **confermato**, con le condizioni di visibilità:

| Tab | id | Condizione | Componente | Riga |
|---|---|---|---|---|
| Apply to | `apply-to` | sempre | `InfoData` | `ViewData.tsx:68-74` |
| Template | `template` | `isV` (non viewpoint) | `TemplateData` | `:75-83` |
| IR | `ir` | `showIRTab` (`:61`) | `VertexAuthoringPanel` / `RowAuthoringPanel` / `EdgeAuthoringPanel` / `EnableIRPanel` | `:84-105` |
| Style | `style` | sempre | `PaletteData` | `:106-114` |
| **Events** | `events` | `isV` | **`EventsData` = `./data/CustomData`** | **`:115-123`** |
| Options | `options` | `isV` | `GenericNodeData` | `:124-132` |
| Components | `components` | `isVP` (solo viewpoint) | `ComponentsTab` | `:133-141` |

Nota di naming: il componente del tab Events si chiama `CustomData.tsx` ed è importato con alias `EventsData` (`ViewData.tsx:18`). Il tab è montato da `Info.tsx:1208` (`<ViewData ...>`), raggiungibile dal pannello Properties quando si seleziona una view nel Tree.

### 1.2 Componente e campi scritti

`frontend/src/components/editors/views/data/CustomData.tsx` (157 righe) rende **due sezioni**:

- **Default Events** (`CustomData.tsx:29-46`): sette `JsEditor`, uno per campo, su `onDataUpdate`, `onDragStart`, `whileDragging`, `onDragEnd`, `onResizeStart`, `whileResizing`, `onResizeEnd`. Ciascuno scrive **un campo stringa dedicato** del `DViewElement` (`view.tsx:242-251`), tramite `data[field] = js` in `Js.tsx:46-47` (`blur()`).
- **Custom Events** (`CustomData.tsx:52-127`): mappa nome→corpo su un unico campo dizionario `DViewElement.events` (`view.tsx:252`), tipo `Dictionary<DocString<"functionName">, DocString<"functionBody">>`.

**Forma del dato**: stringa di codice JS. Per i default events è il *corpo* di una funzione (`reducer.ts:1074` fa `new Function(paramStr, str)` — `str` è il corpo). Per i custom events è invece un'**espressione di funzione completa**: il template inserito da `addEvent` è `'(parameter1, parameter2) => {\n\t// example...\n}'` (`CustomData.tsx:20`) e il reducer la avvolge come `'return (' + dv.events[key] + ')(..._params)'` (`reducer.ts:943`). Le due forme non sono intercambiabili: un default event scritto come arrow function non verrebbe invocato.

**Semantica di scrittura del dizionario**: `view.events = newevent` è un **merge (patch)**, non una sostituzione. `LViewElement.set_events` (`view.tsx:1219-1251`) fa `SetFieldAction.new(c.data, 'events', val, '+=', false)`. Per questo la cancellazione passa da `newEvent[k] = undefined` (`CustomData.tsx:109-111`) e il rename scrive `{[newname]: body, [k]: undefined}` (`CustomData.tsx:99-102`).

**Effetto collaterale non ovvio**: `set_events` **riscrive anche `usageDeclarations`** (`view.tsx:1226-1249`), inserendo/rimuovendo righe `ret.<nome> = node.events.<nome>; // @autogenerated, do not edit` dopo il marker `// ** declarations here ** //`. Se il marker manca la UD viene lasciata intatta (`continue` a `:1238`).

### 1.3 Chi compila e chi esegue

**Compilazione** — reducer, non componente:

- `set_events` accoda `SetRootFieldAction.new('VIEWS_RECOMPILE_events', {vid, keys}, '+=', false)` (`view.tsx:1223-1226`).
- Il reducer consuma la coda a `reducer.ts:915-960`: per ogni chiave costruisce `paramStr = '{' + Object.keys(allContextKeys).join(',') + '}, ..._params'` e `body = 'return (' + dv.events[key] + ')(..._params)'`, quindi `tv.events[key] = new Function(paramStr, body)` (`:945`). Il risultato vive in `transientProperties.view[vid].events` (dichiarato in `classes.ts:4105`), **non** in Redux.
- I sette default events seguono il ramo `DViewElement.MeasurableKeys` (`view.tsx:170-171`), compilati a `reducer.ts:1056-1084` in `transientProperties.view[vid][key]`.
- Ricompilazione a caduta: un cambio di `usageDeclarations` ricompila jsx + events + tutti i measurable (`reducer.ts:909-911`); al load, `SaveManager.load` accoda tutte le `RecompileKeys` per ogni view (`SaveManager.ts:44-52`).

Il meccanismo è quindi **`new Function` su stringa**, non eval né template engine né registrazione DOM.

**Esecuzione** — qui il quadro cambia:

- L'unico consumatore delle funzioni compilate è `LGraphElement.get_events` (`GraphDataElements.tsx:906-923`), cioè `node.events` in codice JSX utente. Unisce le `events` di main view + stack views (`:913`) e restituisce wrapper che iniettano il contesto: `ret[k] = (..._params) => orig[k](lastContext, ..._params)` (`:918`).
- `LViewElement.get_events` (`view.tsx:1214-1218`) è **deliberatamente disattivato**: logga `Log.exx("use node.events instead")` e ritorna `{}`.
- Il `lastContext` è `tn.viewScores[mainview.id].evalContext` (`GraphDataElements.tsx:915`).

### 1.4 Il tab Events è oggi **inerte** — tre catene indipendenti lo confermano

Questo è l'esito principale della sezione 1, ed è un esito valido: cambia la decisione a valle.

**(a) `evalContext` non viene mai assegnato.** Grep esaustivo su tutto `frontend/src` (`*.ts`, `*.tsx`, `*.js`, escluso `jjtl/` che ha un `evalContext` omonimo e non correlato) restituisce **solo** dichiarazioni e letture:

- `classes.ts:4030` — `ViewScore.evalContext!: GObject;` (dichiarazione)
- `classes.ts:4056` — `NodeTransientProperties.evalContext!: GObject;` (dichiarazione)
- `sharedTypes.tsx:19-25` — dentro un **blocco commentato** (il `/*` si apre a `sharedTypes.tsx:18`, `class GraphElementStatee {/*`)
- `GraphDataElements.tsx:915` — lettura
- `Console.tsx:813` — lettura

Nessun sito di scrittura. Il primo argomento passato all'handler compilato è quindi `undefined`, e il destructuring `function({a,b,c}, ..._params)` su `undefined` lancia `TypeError`.

**(b) Nessuno invoca `JSXFunction`.** `transientProperties.view[vid].JSXFunction` è assegnata in `reducer.ts:1007` (e a `:1017`/`:1079` come renderer d'errore) ma **mai chiamata**: grep su `JSXFunction` restituisce solo `classes.ts:4107` (dichiarazione) e i cinque siti in `reducer.ts`. Senza esecuzione del jsxString non esiste il codice utente che chiamerebbe `node.events.x()`.

**(c) L'editor classico è spento.** `EditorSwitch.tsx:118-124` documenta la "Classic shutdown (Fase 5a, decisione B 2026-07-17)": le modalità classic/split non sono più raggiungibili, `EditorV2` rende il flow editor per ogni modello. Non esiste più alcun componente che renda un vertice via jsxString: la ricerca di `Vertex.tsx` / `GraphElement*.tsx` / `DefaultNode*` non trova file.

**Corollario**: l'unico rendering di `jsxString` ancora vivo è `ViewpointRenderer.tsx:12-29`, usato da `ClassNode.tsx:424-437` (ramo `data.jsxString`, lato M2). Il suo contesto è **completamente diverso**: `new Function('React', 'data', 'return (' + jsxString + ')')` (`ViewpointRenderer.tsx:17`) — in scope ci sono **solo `React` e `data`**. Niente `node`, niente `view`, niente `events`, niente `usageDeclarations`. Un handler del tab Events non è raggiungibile nemmeno da lì.

Anche il codice residuo che chiamava gli handler dei default events (`U.tsx:2464`, `:2468`, `doMeasurableEvent`) è dentro un blocco commentato che si chiude a `U.tsx:2478`; `doMeasurableEvent` non esiste come metodo in nessun file.

Il tab Events resta quindi una superficie di **authoring e persistenza funzionante** (scrive, ricompila, sopravvive al save/load) sopra un **runtime rimosso**.

### 1.5 Quali identificatori sarebbero in scope in un handler

Domanda comunque rilevante per il futuro, perché determina il tetto di ciò che un'azione potrebbe fare. Lo scope è **calcolato a runtime** come `allContextKeys = contextFixedKeys ∪ tv.constantsList ∪ tv.UDList` (`reducer.ts:938-941`), e diventa il pattern di destructuring del primo parametro.

- `contextFixedKeys` — `sharedTypes.tsx:220-238`. Costruito enumerando (`for...in`) istanze di `EdgeOwnProps`, `EdgeStateProps`, `VertexOwnProps`, `VertexStateProps` più un literal esplicito che aggiunge: `constants`, `usageDeclarations`, `component`, `htmlindex`, `state`, `props`, `stateProps`, `ownProps`, `otherViews`, `decorators`. Poi `delete contextFixedKeys.class`.
  **Caveat verificabile solo a runtime**: `frontend/tsconfig.json:5` ha `"target": "ES2020"`, quindi `useDefineForClassFields` è `false` e i campi dichiarati senza inizializzatore (`node!: LGraphElement`, `view!: LViewElement`, `start!`, `end!`, `viewpoint!`, `data?`, `children?` …) **non vengono emessi** e `for...in` non li vede. Sopravvivono solo i campi con inizializzatore: `isField` (`sharedTypes.tsx:98`, `:184`, `:129`), `isVertex` (`:185`), `isEdge` (`:130`). Il set fisso effettivo è quindi molto più piccolo di quanto la lettura delle classi suggerisca. Non ho potuto eseguire l'app per confermarlo: **lo marco come incertezza**, non come fatto.
- `tv.constantsList` — `reducer.ts:857`: `Object.keys(transientProperties.view[vid].constants)`, cioè le chiavi che l'autore ha dichiarato nel campo `constants` della view.
- `tv.UDList` — `reducer.ts:879`: nomi estratti per regex dal corpo di `usageDeclarations` (le righe `ret.<nome> = ...`).

Il canale documentato per portare `node`/`view`/`data` in scope è quindi `usageDeclarations`, ed è esattamente ciò che `set_events` auto-genera (`view.tsx:1232`): `ret.<evento> = node.events.<evento>`. La documentazione utente in `view.tsx:1210-1213` conferma il contratto d'uso: *"Custom events callable through JSX user interaction, eg: `<div onClick={()=>view.eventname()} />`"*.

### 1.6 Validità su nodo IR-authored

Domanda in parte assorbita da 1.4 (nessun handler gira), ma le assunzioni sul DOM restano documentabili perché sono ciò che si romperebbe se il canale venisse riattivato così com'è.

Il DOM classico è indirizzato per **attributi HTML** risaliti lungo la catena dei parent:

- `DViewElement.PtrFromHtml` (`view.tsx:177-184`) cerca `target.attributes.viewid`.
- `DGraphElement.nodePtrFromHtml` (`GraphDataElements.tsx:?`, blocco `:1698-1716` dell'estratto letto) cerca `attributes.nodeid`; `graphPtrFromHtml` cerca `attributes.graphid`.

Il nodo IR-authored emette invece (`ObjectNode.tsx:393-396`):

```
className = "mm-node mm-object ... ir-view-<viewId> [ir-resizable] [ir-sized]"
data-viewid = <viewId>
```

Due rotture concrete:
1. **`data-viewid` ≠ `viewid`**. `PtrFromHtml` legge `attributes.viewid`; il DOM IR espone `data-viewid`. Il lookup fallisce. (Grep su `editor-v2`: `data-viewid` compare **solo** a `ObjectNode.tsx:395`; nessun `nodeid`/`graphid` è emesso da alcun nodo v2-flow.)
2. **Nessun `nodeid`/`graphid`**. Qualsiasi handler che risalga al nodo o al grafo dal DOM non trova nulla in v2-flow, IR o non IR.

Inoltre la struttura interna è `.ir-node-content` con `.ir-row` per le righe (`IRNodeContent.tsx:99`, `IRRow.tsx:23`), incompatibile con qualunque selettore scritto per il markup classico.

**Segnalo come possibile bug/incoerenza, senza correggerlo**: `data-viewid` è l'unica forma emessa e nessun consumatore la legge (grep: zero lettori di `data-viewid`). È un attributo scritto e mai letto.

---

## 2. Write path verso la sintassi astratta

### 2.1 Le API canoniche

| API | Firma | `file:riga` |
|---|---|---|
| `syncUpdateFeatureValue` | `(objectVertexId: string, featureName: string, newValue: string\|number\|boolean\|null) => void` | `canvasToJjom.ts:1400-1425` |
| `syncNodeLabel` | `(vertexId: string, newName: string) => void` | `canvasToJjom.ts:533-544` |
| `LValue.setValueAtPosition` | `(index, val, info?, outactions?, lname?) => {success, reason?}` | `LModelElement.tsx:7433-7532` (getter `get_setValueAtPosition`); dichiarazione pubblica `:7405` |
| `SetFieldAction.new` | `(target, field, value, op?, isPtr?)` | usato ovunque; pattern in `CLAUDE.md` §8.4 |
| JjScript `set` (attributo) | comando `set` → `featureProxy.value = primitive` | `jjscript/executor/commands/instance.ts:584-597` |
| JjScript `set` (reference) | `refProxy` | `instance.ts:632`, `:692` |

**Nota**: `syncUpdateFeatureValue` non è un write path nuovo, è una **facciata**. `canvasToJjom.ts:1414-1421` risolve `lVertex.model` e assegna `(lObject)['$' + featureName].value = newValue` dentro un `TRANSACTION`. L'assegnazione entra in `LValue.set_value` (`LModelElement.tsx:7630-7634`) che delega a `get_setValueAtPosition(c)(index, val)`. **`setValueAtPosition` è il punto di convergenza reale** di tutti i write path M1: canvas, Properties panel, JjScript e Info.tsx passano tutti di lì.

`syncNodeLabel` è diverso: scrive `model.name = newName` (`canvasToJjom.ts:539`), cioè `LObject.set_name`, che scrive **entrambi i lati** dell'identity binding (nome + slot `name`) — vedi `CLAUDE.md` §3.12. Non confondere le due direzioni: slot→nome è sempre `SetFieldAction` diretta (`LModelElement.tsx:7517-7519`, dentro `setValueAtPosition`: `if (index === 0 && lname?.toLowerCase() === 'name' && c.data.father) SetFieldAction.new(c.data.father, 'name', val, '', false)`).

### 2.2 Undoable? Con quale sistema?

Il progetto ha **due sistemi di undo indipendenti e non comunicanti**:

**(A) Undo Redux (D-layer)** — `redux/action/action.ts:686-700` (`UndoAction`), `reducer.ts:1118-1155` (`doUndoRedo`), `:1319` (`undo`). Basato su delta di stato accumulati per utente in `statehistory[forUser].undoable`, cap di lunghezza a `reducer.ts:77`. Ogni `SetFieldAction` dentro un `TRANSACTION` finisce in un delta.
→ **`syncUpdateFeatureValue`, `syncNodeLabel`, `setValueAtPosition`, JjScript `set`: tutti undoable con questo sistema** (tutti passano da `TRANSACTION`). JjScript marca esplicitamente `undoable: true` nel result (`instance.ts:608`).

**(B) Undo canvas (v2-flow)** — `hooks/useHistory.ts:23-70`. Snapshot **puramente locali** di `nodes`/`edges` di React Flow (`JSON.parse(JSON.stringify(getNodes()))`, `:32-33`), `MAX_HISTORY = 50` (`:17`). Alimentato da `takeSnapshot()` chiamato manualmente nei gesture handler di `EditorV2.tsx` (~15 siti: `:994`, `:1488`, `:1669`, `:1934`, `:2073`, `:2220`, `:2243`, `:2267`, …).
→ **Non copre i write M1 di `IRNodeContent`**: `commitRowEdit` (`IRNodeContent.tsx:123-128`) e `commitLabelEdit` (`:130-135`) **non chiamano `takeSnapshot()`**. Un edit inline su un nodo IR è annullabile solo dall'undo Redux, non dall'undo del canvas.

I due sistemi non sono sincronizzati: un `undo` Redux non ripristina lo stack canvas e viceversa. Rilevante per qualunque "azione" futura che tocchi entrambi i piani.

### 2.3 Validazione di conformità M2

**Nessun write path la attraversa.** `validateConformance` (`ConformanceValidator.ts:18-20`) è dichiarata *"Pure function … Read-only — no side effects, no state mutations"* (`:14-17`) ed è invocata solo da `useConformance.ts:101`, in un `useEffect` con debounce 500 ms su una signature Redux (`useConformance.ts:45-60`). È **osservazione a posteriori**, non un gate.

I controlli che `setValueAtPosition` fa davvero sono più deboli e sono **strutturali**, non di conformità:
- loop di containment: `LModelElement.tsx:7477-7479` (`"cannot create a containment loop"`);
- tipo di literal enum: `:7465-7467`;
- Date su tipi non-stringa: `:7505-7511`;
- **per i primitivi, checks espliciti "loose"**: `:7501` — *"loose checks, i can assign any primitive to any primitive (will cast on get)"*. Multiplicità, `lowerBound`/`upperBound`, tipo dell'attributo **non** sono verificati in scrittura.
- il type check sul target di una reference è **disabilitato**: `:7473-7474` è commentato con `damiano todo: enable and implement isExtending`.

Quindi: i write path canonici **scavalcano** la conformità M2; la conformità la rileva dopo, come problema diagnostico (`conformanceToProblems.ts`).

### 2.4 Dirty flag e salvataggio

**`TRANSACTION` non marca il progetto dirty.** Grep su `isProjectModified` in `redux/action/action.ts`, `redux/reducer/reducer.ts`, `joiner/classes.ts`: **zero occorrenze**. Il flag `U.isProjectModified` (`U.tsx:211`) è impostato a mano in due soli punti applicativi: `MetamodelTab.tsx:150-151` (drop di un elemento) e `ProjectEditor.tsx:486`. Viene azzerato in `SaveManager.ts:34`, `projects.ts:111`, `Navbar.tsx:491`, `:514`.

→ **`syncUpdateFeatureValue` / `syncNodeLabel` / JjScript `set` non marcano il progetto come modificato** e non fanno scattare il warning `beforeunload` (`U.tsx:225-238`).

Il salvataggio effettivo ha due innesti:
- esplicito (Ctrl+S / toolbar) → `SaveManager.save()` → `ProjectsApi.save` (`projects.ts:92-115`);
- `scheduleLayoutSave()` (`useLayoutAutosave.ts:23`), debounce 1000 ms (`:21`), gated su `user.autosaveLayout !== false` (`:36-40`), che chiama lo stesso `ProjectsApi.save`. È invocato dai gesture handler del canvas e dai due punti di persistenza IR (`ObjectNode.tsx:435`, `EditorV2.tsx:1332`) — **non** dagli edit inline di `IRNodeContent`.

### 2.5 Verifica della clausola spec v1.2 §5

La spec (`spec_2026-07-18_ir_schema_v1_2.md:86`) dichiara: *"Il commit passa dal path canonico delle azioni esistente (stesso write path dei widget di EditorV2: `syncUpdateFeatureValue` / `SetFieldAction` via canvasToJjom), MAI da write path nuovi."*

**Verificato: la clausola è rispettata.** I punti esatti di scrittura:

| Superficie | Riga di commit | Write path |
|---|---|---|
| Label intrinseca (`editsName`) di un nodo IR | `IRNodeContent.tsx:132` | `syncNodeLabel(vertexId, editValue)` |
| Segmento `value` di una riga slot-mode | `IRNodeContent.tsx:125` | `syncUpdateFeatureValue(vertexId, editingRow.name, editValue)` |

Il gate di editabilità è compilato staticamente:
- `editsName` calcolato a `irCompile.ts:308-310` (`source.from === 'intrinsic' && (prop === 'name' || prop === 'qualifiedName') && editable !== false`), consumato a `IRNodeContent.tsx:196`, `:215`.
- Editabilità del segmento a `IRNodeContent.tsx:257`: `row.editableValue && seg.editable !== false`, dove `editableValue = (kind === 'A')` (`:99`) — cioè **solo gli attributi**, mai le reference.

**Zero write path nuovi introdotti.** Due precisazioni onestamente rilevanti:

1. **`FieldSegment.value` non ha `path`.** La spec §5 lo prevede (`{ kind: 'value'; path?: PathExpr; editable?… }`), l'implementazione no (`irTypes.ts:96`). La riga è risolta per **posizione nello slot**, non per PathExpr: il commit usa `editingRow.name`, che viene dalla scansione dei `dObject.features` in `compartmentSig` (`IRNodeContent.tsx:70-91`). Non è una violazione della clausola sul write path, ma è un delta schema↔implementazione da registrare.
2. **Le label di edge IR non hanno write path** e la superficie è stata **rimossa** anziché lasciata morta: `UnifiedEdge.tsx:105-113`, `const labelEditable = !isIREdge`, con il commento che spiega perché `syncEdgeRefProperty` non può raggiungerle (un id sintetico `irobj_<objectId>` non è un pointer JjOM; su un reference edge decorato rinominerebbe la `DReference` M2). Commit `c9b961343`.
3. **Le righe row-dispatch sono read-only per contratto**: `IRRow.tsx:4` — *"Read-only (spec R2 P2: no selection, no inline editing)"*.

---

## 3. Censimento dello stato già esistente sulla sintassi concreta

### 3.1 Tabella

Legenda **scope**: *per-vertex* = vive su una `DVertex`, che appartiene al `DGraph` del modello → **condiviso fra tutti i viewpoint** che rendono quel modello. *per-view* = dichiarato nell'`ir` di un `DViewElement`. *per-sessione* = modulo singleton in memoria.

| # | Voce | Dove vive il dato | Chi scrive | Chi legge | Scope | Durata | Proxy L | VersionFixer |
|---|---|---|---|---|---|---|---|---|
| 1 | `DVertex.irEdgeLayout` | D-layer, campo opzionale su `DVertex` — `GraphDataElements.tsx:1690-1694` | `syncIREdgeLayoutToJjom` → `SetFieldAction` (`canvasToJjom.ts:105-116`, scrittura a `:114`), chiamata da `persistIREdgeLayout` (`EditorV2.tsx:1325-1334`) | idratazione one-shot in `EditorV2.tsx:1353-1359` → `hydrateIREdgeAnchorOverrides` | **per-vertex, condiviso fra viewpoint** | **persistito** col progetto | via `_defaultGetter` (vedi 3.3) — nessun `get_irEdgeLayout` | **no** (additivo, `undefined` = routing derivato) |
| 2 | `DVertex.irCollapsed` | `GraphDataElements.tsx:1696` | `syncIRCollapsedToJjom` (`canvasToJjom.ts:118-124`, scrittura a `:123`), da `ObjectNode.tsx:434` e `IRContainmentHulls.tsx:101` | `EditorV2.tsx:1360` → `hydrateCollapsed` | **per-vertex, condiviso fra viewpoint** | **persistito** | idem | **no** (additivo, `undefined` = expanded) |
| 3 | `DVertex.ghostOffsets` | `GraphDataElements.tsx:1685`, `{[refId]: {dx,dy}}` | `ClassNode.tsx:99` (`SetFieldAction` in `TRANSACTION`) | `ClassNode.tsx:79` (init da `data`), `:551`; `jjomTransformers.ts:130`, `:144` | **per-vertex** (M2) | **persistito** | idem | **sì ma vuota**: `2.218 -> 2.219` (`VersionFixer.tsx:835-838`), *"Default-absent … bump only"* |
| 4 | `DVertex.ghostParentOffsets` | `GraphDataElements.tsx:1687`, `{[classId]: {dx,dy}}` | `ClassNode.tsx:164` | `ClassNode.tsx:151`, `:461`, `:509`; `jjomTransformers.ts:111`, `:120` | **per-vertex** (M2) | **persistito** | idem | **sì ma vuota**: `2.219 -> 2.220` (`VersionFixer.tsx:840-843`) |
| 5 | `irEdgeInteraction.ts` — `anchorOverrides` | `Map<objectId, IRAnchorOverride>` modulo singleton, `irEdgeInteraction.ts:29` | `setIREdgeAnchorOverride` (`:39-43`), `hydrateIREdgeAnchorOverrides` (`:89-97`) | `getIREdgeAnchorOverride` (`:45`), consumato in `useIRContainment.ts:152-155` | **per-sessione, globale all'app** (non per-grafo, non per-viewpoint) | **sessione** | n/a | n/a |
| 6 | `irEdgeInteraction.ts` — `selectedSynthetic` | `Set<edgeId>`, `:30` | `setSyntheticEdgeSelected` (`:99`), `clearSyntheticEdgeSelection` (`:107`) | `isSyntheticEdgeSelected` (`:113`), `useIRContainment.ts:160-161` | **per-sessione, globale** | **sessione** | n/a | n/a |
| 7 | `irCollapseState.ts` — `collapsed` | `Set<objectId>`, `irCollapseState.ts:11` | `toggleCollapsed` (`:24`), `hydrateCollapsed` (`:40`) | `isCollapsed` (`:20`), `getCollapsedSet` (`:30`); consumatori `ObjectNode.tsx:428/434/438/439`, `IRContainmentHulls.tsx:98/101`, `EditorV2.tsx:1850`, `useIRContainment.ts:145` | **per-sessione, globale** | **sessione** | n/a | n/a |
| 8 | `EdgeViewIR.edge.persistWaypoints` | dentro `DViewElement.ir` — `irTypes.ts:213`; compilato a `irCompile.ts:443` (`?? true`) | authoring dell'IR (`EdgeAuthoringPanel`) | `isIREdgeLayoutPersistable` (`EditorV2.tsx:159-172`, lettura a `:169`), usato a `:1329` (write gate) e `:1353` (hydration gate) | **per-view** (dichiarativo) | **persistito** dentro `ir` | via `ir` (GObject opaco) | **no** — `ir?` è additivo e serializzato genericamente (spec §12) |
| 9 | `irLayoutHydratedGraphs` | `Set<graphId>` modulo singleton, `EditorV2.tsx:139` | `EditorV2.tsx:1345` | `EditorV2.tsx:1341` | per-sessione | sessione | n/a | n/a |

Altre voci trovate con grep, di natura diversa e riportate per completezza:
- `irCrossDeps.ts` — registry per-sessione dei dependency set cross-oggetto (`publishCrossDeps` `:114`, `getPublishedCrossDeps` `:119`, epoch reset `:144`). È **cache di reattività**, non stato utente.
- `compileCache` / `edgeCompileCache` / `rowCompileCache` (`irCompile.ts:273`, `:402`, `:454`) e `indexCache` (`irResolveCore.ts:91`) — memoization pura.

### 3.2 Lo scope: deliberato o accidentale?

**Le voci 1–4 hanno tutte lo stesso scope, e quello scope è "per-vertex, condiviso fra viewpoint".** Non c'è divergenza fra `irEdgeLayout` e le altre: una `DVertex` appartiene al `DGraph` del modello (`GraphDataElements.tsx:1672-1673`, `graph!: Pointer<DGraph>`), non a un viewpoint. Il viewpoint non entra mai nella chiave.

Distinguo però **deliberato** da **ereditato**:

- Per `irEdgeLayout` e `irCollapsed` la scelta è **esplicita e documentata**: `canvasToJjom.ts:99-104` cita il "ghostOffsets pattern, discovery 2026-07-19", ed `EditorV2.tsx:135-139` spiega la disciplina di idratazione una-tantum. La decisione 2026-07-19 citata nel prompt è confermata dal codice.
- Per `ghostOffsets`/`ghostParentOffsets` lo scope è **ereditato**: sono nate per i chip ghost cross-metamodello lato M2 (`ClassNode.tsx:77`, `:146-149`), dove il problema "stesso vertice, viewpoint diversi" non si pone perché i metamodelli non hanno viewpoint IR. Non è una decisione presa contro l'alternativa — è l'unico posto dove metterle. Le due voci IR hanno poi **copiato quel pattern**, ed è lì che lo scope diventa una scelta con conseguenze.

**Conseguenza da mettere sul tavolo (non un bug, un limite di design)**: due viewpoint IR diversi applicati allo stesso modello condividono `irCollapsed` e `irEdgeLayout`. Collassare un contenitore nel viewpoint A lo collassa anche in B, se in B esiste una view che rende quell'oggetto come `graphVertex` collassabile. Lo stesso vale per i pin di lato e i waypoint di un object-as-edge.

**Asimmetria aggiuntiva**: le voci 5–7 (i singleton) sono **globali all'app**, non per-grafo. `collapsed` è un `Set` di `objectId`; `anchorOverrides` è una `Map` di `objectId`. Aprire due modelli in tab diversi condivide questi set. Non ho trovato reset su cambio di modello o di viewpoint (`clearSyntheticEdgeSelection` esiste ma azzera solo la selezione). La guardia `irLayoutHydratedGraphs` (voce 9) impedisce la ri-idratazione ma **non** ripulisce lo stato al cambio di grafo. **Lo segnalo come comportamento che sembra un bug, senza correggerlo**: in una sessione con più modelli aperti, lo stato di collasso non è isolato per modello. Non ho potuto riprodurlo (sessione read-only, nessun avvio dell'app): resta un'ipotesi da confermare a runtime, non un fatto verificato.

### 3.3 Esposizione al proxy L

Nessuna delle quattro voci D-layer ha un `get_X`/`set_X` su `LVertex` (`GraphDataElements.tsx:1711-1735`: la classe dichiara solo i campi ereditati e nessun accessor). Sono raggiungibili tramite il **default getter**: `proxy.ts:419` chiama `this.lg._defaultGetter(logicContext, propKey)`, e `LGraphElement._defaultGetter` (`GraphDataElements.tsx:361-366`) fa:

```typescript
if (k in c.data) return this.__defaultGetter(c, k);
// if value not found in node, check in view.
return (this.get_view(c) as any)?.[k];
```

**Trappola documentabile**: quando il campo è assente sulla `DVertex` (caso normale, sono tutti opzionali), la lettura **cade sulla view**. `lVertex.irCollapsed` con `irCollapsed` non impostato non ritorna `undefined` per la via breve: ritorna `view.irCollapsed`, cioè un getter su `DViewElement`. Oggi è innocuo perché nessun nome collide. Diventa un problema il giorno in cui un campo di stato su `DVertex` avesse lo stesso nome di un campo di `DViewElement`: la lettura di uno stato "non impostato" restituirebbe silenziosamente il valore della view. È un vincolo reale sulla scelta dei nomi di qualunque campo nuovo su `DVertex`.

In scrittura, `TargetableProxyHandler.defaultSetter` (`proxy.ts:294-297`) fa `SetFieldAction.new(targetObj, propKey, value)` — ma il codice IR **non** usa questa via: scrive direttamente `SetFieldAction` dentro `TRANSACTION` (`canvasToJjom.ts:114`, `:123`).

### 3.4 Perché le migrazioni sono vuote

Il pattern è consolidato e vale la pena esplicitarlo, perché è il precedente citato nel prompt: `VersionFixer.tsx:835-843` mostra due migrazioni che sono `return s;` puro, con il commento *"Default-absent (undefined → {} consumer-side), so no per-instance seeding is needed — bump only."*. `irEdgeLayout`/`irCollapsed` non hanno nemmeno quello. La conclusione operativa: **un campo opzionale additivo su una classe D non richiede migrazione** finché `undefined` significa "comportamento attuale".

---

## 4. Esiste un substrato generico?

**Sì. Esiste, è documentato, e non è nuovo: `_state` / `.state` su `DPointerTargetable`.**

### 4.1 Dove vive

- **Campo D**: `DPointerTargetable._state: GObject = {}` — `joiner/classes.ts:1427`. Essendo sulla radice della gerarchia, è presente su **ogni** oggetto D: `DVertex`, `DViewElement`, `DViewPoint`, `DObject`, `DValue`, `DClass`, …
- **Accessor L**: `LPointerTargetable.get_state` (`classes.ts:2233-2237`) e `set_state` (`classes.ts:2238-2285`), più `clearState` (`classes.ts:2211-2219`).
- **Dichiarazione sul lato L dei nodi grafo**: `LGraphElement._state!: GObject<"proxified">` — `GraphDataElements.tsx:156`; ripetuta su `LVoidVertex` (`:1370`), e altre due classi (`:1106`, `:2757`, `:2806`).
- **Alias secondario**: `DGraphElement.state!: GObject; // DMap` — `GraphDataElements.tsx:91`. Campo distinto da `_state`, apparentemente residuo di un design "DMap" mai completato (`DMap`/`LMap` sono esportati da `joiner/index.ts:185` ma la coppia è commentata in `ExecuteOnRead.ts:42`). **Non usarlo come substrato senza prima capirlo**: non ho trovato scritture.

### 4.2 Contratto, dalla documentazione inline

`classes.ts:2221-2229`, `__info_of___state`, testo mostrato all'utente nell'editor:

> *"A space where the user can store informations for their operations/views. Example: The Validation viewpoint uses it to store validation messages through onDataUpdate events, check them for live examples. values are set in a http patch approach, `this.state = {varname: "value"}` will set this.state.varname without changing other pre-existing values. as such `this.state = {}` does nothing. To remove a single entry, use `this.state = {varname: undefined}`. To empty the whole state, use `this.clearState()`. WARNING! do not set proxies in the state, set pointers instead."*

È **letteralmente** il caso d'uso del prompt: stato dichiarato dall'utente, scritto da eventi, letto dalle view.

### 4.3 Vincoli di forma

- **Semantica patch, non replace** (`set_state`, `classes.ts:2246-2282`): calcola il delta rispetto a `c.data._state`, emette `SetFieldAction(… '+=')` per le aggiunte e `SetFieldAction(… '-=')` per le rimozioni (`:2281-2282`). Assegnare `{}` è un no-op.
- **Solo oggetti**: `typeof val !== "object"` → `Log.ee("state can only be assigned with an object or undefined")` (`:2257`).
- **Sanitizzazione automatica dei proxy**: `__sanitizeValue` (`classes.ts:2286-2304`) converte proxy/oggetti-D in **pointer id** (`return val.id`), ricorsivamente su array e chiavi di primo livello. Preserva `IPoint`/`ISize`. È il motivo del *"do not set proxies, set pointers"*.
- **Risoluzione in lettura**: `get_state` (`:2233-2236`) passa da `__shallowSolver(data._state, true, true)`, che **ri-wrappa i pointer in proxy L** (`classes.ts:2320-2334`) — sia nei valori di array, sia nelle chiavi di oggetto. Quindi scrivi pointer, leggi proxy.
- **Nessun vincolo di schema oltre questi**: chiavi e valori sono liberi.

### 4.4 Serializzazione

**Verbatim, nessuno schema che scarti chiavi sconosciute.** La catena: `SaveManager.save` (`SaveManager.ts:31-37`) → `ProjectsApi.save` (`projects.ts:92-115`) → `U.compressedState` (`U.tsx:427-441`).

`compressedState` fa (`:429-440`):
```typescript
const state = {...store.getState()};
// filtra solo i DProject diversi da quello corrente
state.idlookup = idlookup;
let str = JSON.stringify(state);
return await compressToUTF16(str);
```

È un `JSON.stringify` dell'**intero stato**, senza whitelist di campi. L'unica manipolazione è l'azzeramento di `isSelected` (`:432`) e il filtro sui `DProject` estranei (`:433`). Il reload passa da `SaveManager.load` (`:39-56`) → `VersionFixer.update` → `LoadAction`.

**Conclusione**: qualunque oggetto di forma libera su un oggetto D — `_state`, o un campo nuovo — sopravvive al round-trip **byte per byte**. Non esiste uno schema di serializzazione che possa scartarlo. È lo stesso meccanismo per cui `DViewElement.ir?: GObject` (`view.tsx:214`) è persistito senza migrazione: *"serialization is generic, no VersionFixer needed (spec IR sez. 8)"*.

I `hiddenkeys` di `proxy.ts:220-225` (`jsxString`, `pointedBy`, `clonedCounter`, …) **non** filtrano la persistenza: agiscono solo sui getter `json`/`__json`/`deepJson` (`proxy.ts:325-331`). `_state` non è fra loro, e anzi il getter `json` lo rinomina in `state` (`proxy.ts:329`).

### 4.5 Il caveat che rende questo finding meno netto di quanto sembri

`_state` è **implementato e documentato**, ma i suoi unici consumatori storici sono componenti dell'era jsxString, oggi irraggiungibili per gli stessi motivi della sezione 1.4:

- `forEndUser/Panel.tsx:173`, `:178`, `:236`, `:241`, `:247` — `props.node.state = {...}`
- `forEndUser/ControlPanel.tsx:14` — `node.state = {showPanel: !showPanel}`
- `contextMenu/ContextMenu.tsx:245-248` — esempio d'uso in un `onDataUpdate` (`data.state = {oldQuantity: qt, …}`)

Nessun consumatore in `editor-v2/`. Grep su `\.state = {` in tutto `frontend/src`: nessuna occorrenza sotto `components/editor-v2/`.

Quindi: il meccanismo esiste ai livelli D e L, è action-based e undoable (passa da `TRANSACTION`, `classes.ts:2279-2283`), ma il suo write path **non è esercitato dal codice vivo**. Prima di appoggiarci un design va verificato a runtime che `SetFieldAction` con `'+='`/`'-='` su `_state` si comporti come documentato — non l'ho potuto fare in sessione read-only.

### 4.6 Se invece si volesse un campo nuovo: quanto costa

Precedente diretto, misurato: `irEdgeLayout` e `irCollapsed` (2026-07-19) sono stati aggiunti a `DVertex` **senza alcuna migrazione**. Costo effettivo:

1. dichiarazione del campo opzionale (`GraphDataElements.tsx:1690-1696`, 7 righe con commento);
2. writer nel path canonico (`canvasToJjom.ts:105-124`, 20 righe, due funzioni);
3. lettore/idratazione (`EditorV2.tsx:1340-1364`);
4. **`VersionFixer`: nulla**. `undefined` = comportamento precedente.

Il precedente `ghostOffsets` mostra la variante conservativa: migrazione presente ma vuota (`VersionFixer.tsx:835-838`), solo per bumpare la versione e lasciare traccia. `highestVersion` è dedotto dai nomi dei metodi (`CLAUDE.md` §3.9), quindi anche una migrazione `return s` sposta la versione — scelta di tracciabilità, non di necessità tecnica.

Vincoli da rispettare in ogni caso:
- il campo deve essere **opzionale** e `undefined` deve significare "comportamento attuale";
- il nome **non deve collidere** con un campo di `DViewElement` se sta su `DVertex` (fall-through del `_defaultGetter`, §3.3);
- se il campo è un oggetto di forma libera, la serializzazione lo preserva (§4.4) e il proxy lo espone via `_defaultGetter` con `__shallowSolver(v, true, false)` — che **ri-wrappa gli array di pointer in proxy** ma non le chiavi di oggetto (`classes.ts:2314-2317`, `solveObjectKeys = false`). Semantica diversa da `get_state`, che usa `true, true`.

---

## 5. Reattività: cosa fa ridisegnare la notazione

### 5.1 Il canale dell'`ir`: `computeIRSignature`

`irResolveCore.ts:76-89`. Costruisce una stringa `<viewpointId>|<vid>:<refToken(ir)>|…` iterando `state.viewelements` e tenendo solo le view del viewpoint attivo che hanno un `ir`. `refToken` (`:65-69`) è una `WeakMap` da **identità di riferimento** dell'oggetto `ir` a un token progressivo.

Conseguenze precise:
- la signature cambia quando cambia il viewpoint, quando una view IR è aggiunta/rimossa, o quando **l'oggetto `ir` viene rimpiazzato** (il D-layer sostituisce il riferimento a ogni scrittura);
- **una mutazione in-place dell'`ir` non è rilevata** (la `WeakMap` restituirebbe lo stesso token);
- **è viewpoint-wide**: un commit su una singola view invalida `indexCache` (`irResolveCore.ts:91`) per l'intero viewpoint e fa ri-risolvere **tutte** le view. Limite noto, confermato dal codice: `getIRIndex` ricostruisce l'indice completo (`:94-207`) e il ciclo di style lifecycle (`:193-198`) cancella le entry di segnature precedenti dello stesso viewpoint.

**Uno stato che cambia a ogni click non può passare di qui.** Confermato.

### 5.2 Come propagano oggi i singleton di sessione

Entrambi usano lo stesso pattern: contatore `version` + `Set<listener>` + `useSyncExternalStore`.

| Store | Bump | Hook | Consumatori |
|---|---|---|---|
| `irCollapseState` | `bump()` `:15-18`, da `toggleCollapsed` `:26`, `hydrateCollapsed` `:47` | `useCollapseVersion` `:60-62` | `ObjectNode.tsx:67`, `IRContainmentHulls.tsx:31`, `useIRContainment.ts:71` |
| `irEdgeInteraction` | `bump()` `:34-37`, da `setIREdgeAnchorOverride` `:42`, `hydrate…` `:96`, `setSyntheticEdgeSelected` `:104`, `clearSyntheticEdgeSelection` `:110` | `useEdgeInteractionVersion` `:127-129` | `useIRContainment.ts:72` |

Il re-render risultante:
- `ObjectNode` si iscrive **senza usare il valore** (`ObjectNode.tsx:67`, chiamata nuda `useCollapseVersion();`) — è una subscription pura per il re-render. Ogni toggle ri-renderizza **tutti** gli `ObjectNode` montati.
- `useIRContainment` ha `collapseVersion` e `edgeInteractionVersion` fra le dipendenze del `useMemo` finale (`:71-72`), quindi ricalcola l'intera decorazione di nodi ed edge (`:113-180`): containment model, hidden set, row-dispatch, decorazione reference-edge, sintesi object-as-edge.
- `IRContainmentHulls.tsx:31` si iscrive per ridisegnare le hull.

Costo: **globale, non incrementale**. Un click di collasso ricalcola la decorazione per l'intero canvas. Funziona perché i toggle sono rari.

### 5.3 Canali a granularità più fine che il codice già offre

**Sì, ne esistono, e sono già in uso.** Elenco senza sceglierne uno:

1. **Subscription Redux per-nodo via signature stringa** — `useIRView` (`irResolve.ts:48-71`). Il selettore compone `irSig + objectId + instanceof + <ogni fid>=<JSON dei values>` più la signature cross-deps. `useSelector` ri-renderizza solo se la stringa cambia. **Granularità: singolo nodo, singolo slot.** Costo: il selettore gira a ogni azione Redux; è dichiaratamente non filtrato per dependency set ("kept unconditional … objects have few features", `:53-55`).
2. **Stessa tecnica per-riga** — `useIRRowView` (`irResolve.ts:104+`), consumato da `IRRow.tsx:19`. Documentato a `irResolve.ts:110-113`: *"Own feature-snapshot subscription … so the row re-renders on a change to the CHILD without a forced re-render of the host node"*. **Granularità: singolo figlio containment.**
3. **Signature dei compartimenti** — `IRNodeContent.tsx:70-91` (`compartmentSig`) e `:110-114` (`rowChildSig`): selettori che producono stringhe e si invalidano solo sul contenuto rilevante.
4. **Registry cross-deps** — `irCrossDeps.ts`, pubblicazione two-phase (`publishCrossDeps` `:114`, `crossDepsSignature` `:159`), con cap di fan-out `CROSS_FANOUT_CAP = 100` (`:37`) ed epoch reset sul cambio di viewpoint (`:144`, chiamato da `useIRContainment.ts:117`). È l'infrastruttura già pronta per far invalidare un nodo su un valore che **non è suo**.
5. **`useSyncExternalStore` su singleton** — il pattern di §5.2; granularità "tutti i sottoscrittori", ma zero costo su Redux.
6. **CustomEvent + `useState` locale** — pattern canonico del progetto per il cross-cutting (`CLAUDE.md` §8.7), registry a `events/registry.ts:7-110`. **Attenzione al piano**: questi sono eventi *infrastrutturali dell'app* (`jjodel:toggle-grid`, `jjodel:selectNode`, …), un piano diverso dagli eventi *user-facing della view* del tab Events. Non vanno confusi.
7. **`DGraphElement.contextMenu` / transientProperties** — canale non-Redux già esistente, ma non ha hook di sottoscrizione.

**Punto critico, da mettere in chiaro**: se lo stato dichiarato vivesse in `_state` su un oggetto D (§4), **nessuno dei canali attuali lo osserverebbe**. La signature di `useIRView` (`irResolve.ts:56-67`) snapshotta `dObject.instanceof` e i `values` dei `DValue`; non tocca `_state`. Quella di `useIRContainment` (`:76-108`) idem. `computeIRSignature` guarda solo `d.ir`. Una scrittura su `_state` **non farebbe ridisegnare nulla** senza estendere almeno un selettore.

---

## 6. Namespace nelle espressioni

### 6.1 Dove vivono parser e valutatore

| Cosa | `file:riga` |
|---|---|
| **Parser `PathExpr`** | `irCompile.ts:47-74` — `parsePathExpr`. **Non esportato.** |
| Regex dei costrutti vietati | `irCompile.ts:37` — `FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/` |
| Regex di uno step | `irCompile.ts:39` — `STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/` |
| **Valutatore `PathExpr`** | `irCompile.ts:111-148` — `compilePath`, che restituisce la closure `CompiledAccessor` (`:113-136`) |
| Navigazione hop non-terminale | `irReadCtx.ts:70-82` — `navigateRefHop`, esposto come `ReadCtx.getRef` |
| **Valutatore `Predicate`** | `irCompile.ts:164-223` — `compilePredicate` |
| Operandi (path \| literal) | `irCompile.ts:154-162` — `compileOperand` |
| **Valutatore `Conditional<T>`** | `irCompile.ts:225-244` — `compileConditional` (tre forme: valore nudo, `{when,then,else}`, `{rules,default}`) |
| Valutatore `TextSource` | `irCompile.ts:380-400` — `compileTextSource`; label vertice inline a `:288-312` |
| Valutatore `TextStyle` | `irCompile.ts:253-262` — `compileTextStyle` |
| Contratto di lettura | `irReadCtx.ts:17-32` — `interface ReadCtx` (6 metodi) |
| Backend draw | `irReadCtx.ts:111-146` — `makeDrawReadCtx` |
| Backend lproxy + switch | `irReadCtxLproxy.ts:19-54` — `makeLproxyReadCtx`, `makeReadCtx` |
| Costante di switch | `irReadCtx.ts:15` — `IR_READ_BACKEND: 'lproxy' \| 'draw' = 'lproxy'` |

Nota architetturale utile: **niente viene interpretato a render-time**. `irCompile.ts:6-8` — *"The interpreter never walks the IR tree at render time: PathExprs become accessor closures over ReadCtx, Predicates become boolean closures, Conditionals become value functions."* Ogni innesto va fatto in compilazione, non in valutazione.

### 6.2 `makeReadCtx` ha già un posto per valori non-modello?

**No, e la risposta è netta.** `makeReadCtx(idlookup)` (`irReadCtxLproxy.ts:52-54`) prende **un solo argomento**, l'`idlookup`. `ReadCtx` (`irReadCtx.ts:17-32`) ha esattamente sei metodi, tutti a firma `(elementId, …)` e tutti che risolvono contro `idlookup`. Non c'è un campo, una mappa o un parametro opzionale in cui infilare valori esterni.

Le costruzioni di `ReadCtx` nel codice sono cinque, tutte `makeReadCtx(state.idlookup)` o `makeReadCtx(lookup)`: `irResolve.ts:85`, `IRNodeContent.tsx:113`, `useIRContainment.ts:124`, `EditorV2.tsx:169`, più le occorrenze nei test. Il `ReadCtx` viene poi **propagato per prop** fino ai renderer (`IRNodeContent` lo riceve come prop, `IRNodeContentProps.readCtx`, `:49`).

### 6.3 Punti d'innesto praticabili, con il costo di ciascuno

Elencati, non raccomandati.

**(I) Secondo prefisso riconosciuto dal parser** — es. `@nome` accanto a `$feature`.
- Tocca: `STEP_RE` (`irCompile.ts:39`), `parsePathExpr` (`:47-74`, il ramo `tok.startsWith('$')` a `:57`), `ParsedPath` (`:41-45`, serve un discriminante), `compilePath` (`:111-148`, il loop `:116-134` e la raccolta `featureNames` a `:60`), `ReadCtx` (nuovo metodo).
- **Effetto collaterale da non sottovalutare**: `featureNames` alimenta il `dependencySet` (`irCompile.ts:160`, `:292`, `:363`), che a sua volta alimenta l'`oaeSlotsSig` di `useIRContainment.ts:85-88` e i `crossPaths`. Se un nome di stato finisse in `dependencySet`, la reattività lo cercherebbe fra i `DValue` dell'oggetto e non lo troverebbe (silenzioso, nessun errore). Serve un canale di dipendenze separato.
- Vantaggio: il gate `FORBIDDEN_PATH` (`:37`) resta invariato e la micro-grammatica resta chiusa.
- Costo di authoring: `PathBuilder` (`PathBuilder.tsx:69-77`, `parseExpr` `:29-37`) e `PredicateBuilder` (`resolvePathLiteralType` `:52-63`) hanno **regex proprie e duplicate** per il parsing single-hop. Ognuna andrebbe estesa. Sono tre parser indipendenti dello stesso linguaggio (`irCompile.parsePathExpr`, `PathBuilder.parseExpr`, `PredicateBuilder` regex inline): un innesto ne tocca tre.

**(II) Contesto di valutazione esteso** — aggiungere metodi a `ReadCtx` e un argomento a `makeReadCtx`.
- Tocca: `interface ReadCtx` (`irReadCtx.ts:17-32`), `makeDrawReadCtx` (`:111-146`), `makeLproxyReadCtx` (`irReadCtxLproxy.ts:19-50`), `makeReadCtx` (`:52-54`), e i **cinque call site** di §6.2.
- Vantaggio: nessuna modifica alla grammatica; il gate `FORBIDDEN_PATH` non si tocca; i test del compilatore restano validi.
- Svantaggio: senza un prefisso, un valore di stato non è distinguibile da una feature nell'IR serializzato. Chi legge l'IR non può dire se `$foo` è uno slot o uno stato.
- **Nota di rischio**: `ReadCtx` è passato per prop e catturato in closure compilate e **cachate** (`compileCache`, `irCompile.ts:273`, chiave `viewId:irHash(ir)`). Le closure ricevono il `ctx` come argomento a ogni chiamata (`CompiledAccessor = (ctx, elementId) => unknown`, `irTypes.ts:329`), quindi non c'è staleness sul `ctx`. Ma la cache **non** si invalida su un cambio di forma del `ReadCtx`: un `ReadCtx` esteso e uno no producono le stesse closure.

**(III) Estendere `Predicate` con un operatore dedicato** — es. `{ op: 'stateEq', key, value }`.
- Tocca: il tipo `Predicate` (`irTypes.ts:24-31`), `compilePredicate` (`irCompile.ts:164-223`, uno `case` nuovo), `PredicateBuilder` (UI). **Non tocca** `parsePathExpr` né `PathExpr`.
- Vantaggio: il più contenuto sul parser; `compileConditional` (`:225-244`) lo eredita gratis perché delega a `compilePredicate` (`:233`, `:238`).
- Svantaggio: lo stato sarebbe leggibile **solo dentro un predicato**, non come sorgente di testo di una label (`TextSource`, `irTypes.ts:50-53`) né come valore diretto.

**(IV) Estendere `TextSource` con una variante** — es. `{ from: 'state'; key: string }` accanto a `path`/`literal`/`intrinsic`.
- Tocca: `irTypes.ts:50-53`, `compileTextSource` (`irCompile.ts:380-400`), il ramo label inline (`:288-307`), `TextSourceEditor.tsx:13-17` (`FROM_OPTIONS`) e `:37-44` (`changeFrom`).
- Complementare a (III): copre la lettura, non la condizione.

**(V) `DViewElement.ir` come contenitore anche della dichiarazione** — il campo è `GObject` (`view.tsx:214`), quindi un blocco `state` dichiarativo entrerebbe **senza toccare alcun tipo D e senza migrazione**. Il costo si sposta interamente sul compilatore e sul validatore (`irValidate.ts:16-25` guida `compileView`/`compileEdgeView`/`compileRowView`, quindi il gate esiste già).

**Vincolo reale che preclude una strada**: la valutazione di espressioni **arbitrarie** (JS) dentro l'IR. `FORBIDDEN_PATH` (`irCompile.ts:37`) vieta `?.`, `??`, `?`, `:`, `(`, `)`; `STEP_RE` (`:39`) accetta solo `$identificatore`, `value`, `values`, `values[N]`. La chiusura della micro-grammatica non è una limitazione accidentale ma la premessa dell'architettura "compila una volta, nessuna interpretazione a render-time" (`irCompile.ts:6-8`) e della tracciabilità delle dipendenze (`dependencySet`/`crossPaths`, che esistono **perché** il linguaggio è analizzabile staticamente). Reintrodurre espressioni arbitrarie ucciderebbe entrambe.

---

## 7. Copertura delle feature (sezione additiva)

### 7.1 Tutti i siti in cui un `ir` può riferire una feature del metamodello

Elenco completo, con il **punto di lettura in compilazione** (dove il riferimento viene tradotto in accessor). Ho distinto i riferimenti **diretti** (una `PathExpr` esplicita) da quelli **indiretti** (una `PathExpr` annidata dentro un `Predicate` di un `Conditional`).

| # | Sito | Tipo | Diretto/indiretto | Punto di lettura |
|---|---|---|---|---|
| 1 | `shape.labels[].source` (`from: 'path'`) | `TextSource` | diretto | `irCompile.ts:290-293` |
| 2 | `shape.labels[].visible` | `Conditional<boolean>` | indiretto | `irCompile.ts:311` → `compileConditional` `:225` |
| 3 | `shape.labels[].style.*` (5 assi) | `Conditional<…>` | indiretto | `irCompile.ts:253-262` |
| 4 | `shape.form` | `Conditional<ShapeForm>` | indiretto | `irCompile.ts:284` |
| 5 | `shape.fill` | `Conditional<string>` | indiretto | `irCompile.ts:285` |
| 6 | `shape.badges[].icon` | `Conditional<string>` | indiretto | `irCompile.ts:315` |
| 7 | `shape.badges[].visible` | `Conditional<boolean>` | indiretto | `irCompile.ts:317` |
| 8 | `predicate` (matching della view) | `Predicate` | indiretto | `irCompile.ts:283` (vertex), `:412` (edge), `:475` (row) |
| 9 | `fieldCompartments[].visible` | `Conditional<boolean>` | indiretto | `irCompile.ts:332` |
| 10 | `fieldCompartments[].source.filter` (`from: 'children'`) | `Predicate` | indiretto | `irCompile.ts:329-331` |
| 11 | `containment.childFilter` (graphVertex) | `Predicate` | indiretto | `irCompile.ts:340` |
| 12 | `containment.collapsed.form` / `.fill` | `Conditional` | indiretto | `irCompile.ts:342-343` |
| 13 | `containment.collapsed.badge.icon` / `.visible` | `Conditional` | indiretto | `irCompile.ts:345-346` |
| 14 | `edge.source` (object-as-edge) | `PathExpr` | **diretto** | `irCompile.ts:414-420` |
| 15 | `edge.target` (object-as-edge) | `PathExpr` | **diretto** | `irCompile.ts:414-421` |
| 16 | `edge.line.color` / `.width` / `.style` | `Conditional` | indiretto | `irCompile.ts:433-435` |
| 17 | `edge.labels.center` | `TextSource` | diretto | `irCompile.ts:441` → `compileTextSource` `:380-400` |
| 18 | `row.template[]` (segmenti) | `TextSource[]` | diretto | `irCompile.ts:476` |
| 19 | `row.visible` | `Conditional<boolean>` | indiretto | `irCompile.ts:477` |

**Precisazioni rispetto alla lista attesa nel prompt**:
- *"sorgente dei compartimenti"*: `FieldCompartmentSpec.source` (`irTypes.ts:109`) è un enum di tre valori (`attributes` / `references` / `children`), **non** un riferimento a una feature nominata. La selezione delle feature è per categoria, non per nome. L'unico riferimento a feature nel ramo `children` è il `filter` opzionale (riga 10 della tabella).
- *"segmenti dei compartimenti"*: `FieldSegment` (`irTypes.ts:93-97`) ha quattro kind — `name`, `type`, `value`, `literal` — e **nessuno di essi porta una `PathExpr`**. La riga è risolta per posizione nello slot a render-time (`IRNodeContent.tsx:93-103`), non per path. La spec §5 prevedeva `{ kind: 'value'; path?: PathExpr }`: **non implementato** (già segnalato in §2.5).
- *"template di una row view"*: sì, riga 18. Sono `TextSource[]`, quindi possono contenere `PathExpr` (`from: 'path'`).

**Terreno scoperto rispetto a una vista di copertura**: le feature usate **indirettamente** (righe 2-13, 16, 19) passano tutte da `compilePredicate`/`compileConditional`, che aggiungono i nomi al `Set<string> deps` condiviso. Quindi il `dependencySet` finale **le include già**.

### 7.2 Esiste un walker generico dell'IR?

**No.** Non esiste alcun visitor, walker o normalizzatore che attraversi un `AnyViewIR` in modo generico.

Cosa esiste invece:
- `compileView` / `compileEdgeView` / `compileRowView` (`irCompile.ts:275-374`, `:404-450`, `:464-494`) — attraversano l'IR **per compilarlo**, non per ispezionarlo. Ogni ramo è scritto a mano.
- `irHash(ir)` (`irCompile.ts:266-271`) — `JSON.stringify` + djb2. Attraversa tutto ma è opaco (produce una stringa).
- `validateIR` (`irValidate.ts:16-25`) — **riusa il compilatore come validatore**, sfruttando il fatto che `compilePath` lancia su path invalidi (`irCompile.ts:48-49`, `:56`, `:63`, `:66`, `:72`). Nessuna logica di traversata propria.
- `ensureViewCss(viewId, ir)` (`irStyle.ts:136`) — legge un sottoinsieme fisso (`staticCssFor`, `:124`).

**Il surrogato che esiste già**: `CompiledView.dependencySet: string[]` (`irTypes.ts:316`, popolato a `irCompile.ts:363`) è documentato come *"Feature names read by every PathExpr in this view (flat; includes hop and terminal names)"*. Equivalenti su `CompiledEdgeView` (`:265`, popolato a `:445`) e `CompiledRowView` (`:295`, popolato a `:487`). Copre **tutti** i 19 siti della tabella, diretti e indiretti, perché ogni ramo di compilazione passa il `Set deps` condiviso.

Complemento: `CompiledView.crossPaths: CompiledCrossPath[]` (`irTypes.ts:318`) porta la **struttura** dei path multi-hop (catena di hop + terminale), non solo i nomi piatti (`irCompile.ts:142-146`).

Per una vista di copertura, `dependencySet` risponde a "quali feature usa questa view"; **non** risponde a "quale sito le usa" (è piatto) né a "quale path non risolve più" (i nomi non sono verificati contro la metaclasse).

### 7.3 Esiste una funzione che estrae il nome della feature da un `PathExpr`?

**Sì, tre — tutte private, nessuna riusabile così com'è.**

| Funzione | `file:riga` | Esportata? | Copertura |
|---|---|---|---|
| `parsePathExpr` | `irCompile.ts:47-74` | **no** | Completa: multi-hop, `featureNames: string[]`, `steps` con `take`. È la canonica. |
| `parseExpr` | `PathBuilder.tsx:29-37` | **no** (locale al modulo) | Solo **single-hop**, regex `/^\$([A-Za-z_][A-Za-z0-9_]*)(?:\.(value\|values(?:\[(\d+)\])?))?$/`. Ritorna `{feature, take, index}`. Su multi-hop ritorna `{feature: ''}`. |
| regex inline in `resolvePathLiteralType` | `PredicateBuilder.tsx:57` | no | Solo il **primo** identificatore: `/^\$([A-Za-z_][A-Za-z0-9_]*)/`. Documentata come *"Single-hop only (mirrors PathBuilder's authoring scope)"* (`:51`). |

`compilePath` (`irCompile.ts:111`) **restituisce** `featureNames` insieme all'accessor, ma non c'è modo di ottenere solo i nomi senza compilare.

**Costo di una vista di copertura, come somma dei tre punti sopra**: nessun walker da scrivere se `dependencySet` è sufficiente (già disponibile, zero costo); un walker nuovo se serve la localizzazione per sito; l'export di `parsePathExpr` (una riga) se serve l'analisi di un singolo path fuori dalla compilazione. La duplicazione dei tre parser è il debito da mettere in conto in ogni caso.

---

# Rischi individuati

**R1 — Il tab Events è una superficie di authoring senza runtime.** Un utente può scrivere handler, salvarli, riaprire il progetto e ritrovarli. Non verranno mai eseguiti. Non c'è alcun avviso in UI. Il tab è visibile per ogni view non-viewpoint (`ViewData.tsx:115-123`), incluse le view IR. `ViewProperties.tsx:325-357` mostra addirittura un pallino "attivo" verde per gli handler definiti. (§1.4)

**R2 — `evalContext` mai assegnato.** Anche riattivando un percorso di esecuzione, il primo argomento degli handler compilati è `undefined` e il destructuring lancia. Qualsiasi riuso del canale events richiede prima di ricostruire la costruzione del contesto, che non esiste più in nessuna forma. (§1.4a)

**R3 — Scope condiviso fra viewpoint per lo stato IR persistito.** `irCollapsed` e `irEdgeLayout` su `DVertex` sono visti da tutti i viewpoint del modello. Deliberato per `irEdgeLayout` (2026-07-19), ereditato senza decisione esplicita per gli altri. (§3.2)

**R4 — Singleton di sessione globali all'app, non per-grafo.** `collapsed`, `anchorOverrides`, `selectedSynthetic` sono `Set`/`Map` di modulo senza reset sul cambio di modello. Ipotesi non riprodotta (sessione read-only): con più modelli aperti lo stato di collasso potrebbe non essere isolato. Da verificare a runtime prima di trattarla come fatto. (§3.2)

**R5 — Fall-through del `_defaultGetter` da vertice a view.** `GraphDataElements.tsx:361-366`: un campo assente su `DVertex` viene cercato su `DViewElement`. Vincola i nomi di ogni campo nuovo su `DVertex`. (§3.3)

**R6 — `_state` implementato ma non esercitato.** Il substrato generico esiste ai livelli D e L con semantica documentata, ma i suoi soli consumatori sono componenti jsxString irraggiungibili. Il write path `SetFieldAction` con `'+='`/`'-='` su `_state` non è coperto da alcun test né da codice vivo. (§4.5)

**R7 — Nessun canale di reattività osserva `_state`.** Le signature di `useIRView`, `useIRRowView`, `useIRContainment` e `computeIRSignature` guardano `ir`, `instanceof` e i `values` dei `DValue`. Una scrittura su `_state` non ridisegna nulla. (§5.3)

**R8 — Tre parser indipendenti dello stesso linguaggio.** `irCompile.parsePathExpr` (canonico, multi-hop), `PathBuilder.parseExpr` (single-hop), regex inline in `PredicateBuilder`. Ogni estensione della grammatica ne tocca tre e può divergere in due. (§6.3, §7.3)

**R9 — `dependencySet` come canale unico e non tipizzato.** Se un namespace di stato producesse nomi che finiscono in `dependencySet`, la reattività li cercherebbe fra i `DValue` dell'oggetto e non li troverebbe. Fallimento **silenzioso**: nessun errore, nessun warning, la view semplicemente non si aggiorna. (§6.3-I)

**R10 — `data-viewid` scritto e mai letto.** `ObjectNode.tsx:395` emette `data-viewid`; `DViewElement.PtrFromHtml` (`view.tsx:179`) legge `viewid`. Nessun consumatore di `data-viewid` esiste. Attributo morto e, se qualcuno lo prendesse per il canale di lookup, fuorviante. (§1.6)

**R11 — Delta spec↔implementazione su `FieldSegment.value.path`.** La spec v1.2 §5 lo dichiara, `irTypes.ts:96` non lo ha. Il commit di una riga usa il nome dello slot, non un path. (§2.5, §7.1)

**R12 — Gli edit inline IR non passano da `takeSnapshot()` né marcano il progetto dirty.** `IRNodeContent.tsx:123-135` non chiama né `takeSnapshot()` né `scheduleLayoutSave()`, e `TRANSACTION` non tocca `U.isProjectModified`. Un edit di label o di valore su un nodo IR non è annullabile dall'undo del canvas e non attiva il warning di uscita. (§2.2, §2.4)

---

# Domande aperte per Alfonso

**Q1 — Il tab Events va dichiarato morto, riparato o sostituito?** Sono tre decisioni diverse con costi diversi. Riattivarlo richiede di ricostruire `evalContext` (che non esiste più in nessuna forma) o di inventare un contesto nuovo per il flow editor. Sostituirlo significa che il piano "azioni" nasce dentro l'IR e il tab diventa legacy da marcare in UI. Lasciarlo com'è significa accettare R1.

**Q2 — Lo stato dichiarato deve essere per-viewpoint o condiviso fra viewpoint?** Il codice oggi risponde "condiviso" per tutto ciò che è persistito (§3.2). Se la risposta cambia, cambia la chiave del substrato, e `DVertex` smette di essere il posto giusto.

**Q3 — Lo stato dichiarato deve sopravvivere al reload o è view state come lo zoom?** Il codice ha entrambi i regimi, e li usa **contemporaneamente sulla stessa informazione**: il collasso vive nel singleton di sessione (runtime source of truth) *e* su `DVertex.irCollapsed` (idratato una volta). Un modello di stato nuovo deve dire se replica questo doppio regime o ne sceglie uno.

**Q4 — Stato su sintassi astratta e stato su sintassi concreta: un meccanismo o due?** `_state` esiste su `DPointerTargetable`, quindi *tecnicamente* copre entrambi (sta su `DObject` come su `DVertex`). Ma la semantica è diversa: uno stato sulla sintassi astratta è dato del modello (esportabile? conforme? incluso in un diff?), uno sulla sintassi concreta è preferenza di rendering. Un meccanismo unico li rende indistinguibili in serializzazione.

**Q5 — Uno stato dichiarato deve essere leggibile dentro un `Conditional`, o solo scrivibile da un'azione?** Le due cose hanno costi molto diversi (§6.3): solo scrittura non tocca il linguaggio; lettura in `Conditional` tocca almeno tre parser.

**Q6 — R4 (isolamento per modello dei singleton) va verificato ora o rimandato?** È l'unica ipotesi di questo report che richiede di far girare l'app. Se il modello di stato futuro sostituisce quei singleton, verificarla è lavoro sprecato; se li estende, è un prerequisito.

**Q7 — R12 (undo e dirty flag degli edit IR) rientra in questo workstream o è un fix a sé?** È indipendente dal modello di stato ma tocca lo stesso codice (`IRNodeContent`), quindi la sequenza dei prompt cambia a seconda della risposta.

---

# Opzioni praticabili

Elencate, **non ordinate per preferenza e senza raccomandazione**. Per ciascuna: cosa toccherebbe, se richiede migrazione, quale rischio introduce.

### Opzione A — `_state` come substrato, nessun campo nuovo

Usare `_state`/`.state` (§4) come contenitore dello stato dichiarato, sia su `DObject` (sintassi astratta) sia su `DVertex` (sintassi concreta).

- **Tocca**: nessuna classe D, nessun tipo. Serve un writer nel path canonico (analogo a `syncIRCollapsedToJjom`) e almeno un lettore. Serve estendere una signature di reattività (R7).
- **Migrazione**: **no**. Il campo esiste sulla radice della gerarchia, `get_state` è `undefined`-safe (`classes.ts:2234`).
- **Rischi**: R6 (write path non esercitato — va verificato a runtime prima), R7 (nessuna reattività), Q4 (astratto e concreto diventano indistinguibili in serializzazione: entrambi finiscono in `_state`).
- **A favore**: la semantica patch, la sanitizzazione dei proxy e la risoluzione in lettura sono già scritte e documentate; è undoable via Redux gratis.

### Opzione B — Campo dichiarativo dentro `DViewElement.ir`, valori in `_state`

Separare **dichiarazione** (nell'`ir`, che l'autore edita) da **valori** (in `_state`, runtime).

- **Tocca**: `irTypes.ts` (tipo nuovo), `irCompile.ts` (compilazione della dichiarazione), `irValidate.ts` (gratis, delega al compilatore), un pannello di authoring.
- **Migrazione**: **no** per la dichiarazione (`ir?: GObject` è già additivo e serializzato genericamente, spec §12); **no** per i valori (Opzione A).
- **Rischi**: R7, R9 se i nomi di stato finissero nel `dependencySet`, Q5 (la lettura in `Conditional` è un secondo lavoro, non compreso qui).
- **A favore**: il gate di validazione esiste già; la separazione dichiarazione/valori rende esplicito cosa è authoring e cosa è runtime.

### Opzione C — Campi cablati nuovi su `DVertex`, come `irCollapsed`

Continuare il pattern esistente: un campo opzionale per ogni caso d'uso.

- **Tocca**: `GraphDataElements.tsx` (dichiarazione), `canvasToJjom.ts` (writer), `EditorV2.tsx` (idratazione), per **ogni** nuovo caso.
- **Migrazione**: **no** (precedente misurato: `irEdgeLayout`/`irCollapsed`, §3.4).
- **Rischi**: R5 (collisione di nomi con `DViewElement`), R3 (scope condiviso fra viewpoint), e soprattutto **non risolve il problema del prompt**: nulla di ciò che l'autore dichiara diventa dichiarabile. È la linea di base contro cui misurare le altre.

### Opzione D — Namespace di stato nelle espressioni, via prefisso

Un secondo prefisso (`@nome`) riconosciuto da `parsePathExpr`.

- **Tocca**: `irCompile.ts:37,39,41-74,111-148` + `ReadCtx` + i tre parser duplicati (`PathBuilder.tsx:29-37`, `PredicateBuilder.tsx:57`) + i widget di authoring.
- **Migrazione**: no.
- **Rischi**: R8 (tre parser da tenere allineati), R9 (contaminazione del `dependencySet`, fallimento silenzioso — richiede un canale di dipendenze separato, non riusabile da `crossPaths`).
- **A favore**: lo stato diventa leggibile ovunque una `PathExpr` è ammessa (19 siti, §7.1) con un solo innesto; il gate `FORBIDDEN_PATH` resta invariato.

### Opzione E — Namespace di stato via contesto di lettura esteso

Estendere `ReadCtx` invece della grammatica.

- **Tocca**: `irReadCtx.ts:17-32,111-146`, `irReadCtxLproxy.ts:19-54`, e i **cinque** call site di `makeReadCtx` (§6.2).
- **Migrazione**: no.
- **Rischi**: nell'IR serializzato uno stato è indistinguibile da una feature; nessun gate impedisce di dichiarare uno stato che ombreggia una feature reale. La `compileCache` non discrimina fra `ReadCtx` esteso e non esteso.
- **A favore**: non tocca il linguaggio né i tre parser; i test del compilatore restano validi.

### Opzione F — Operatore di predicato dedicato

`{ op: 'stateEq', … }` in `Predicate`.

- **Tocca**: `irTypes.ts:24-31`, `irCompile.ts:164-223` (un `case`), `PredicateBuilder`.
- **Migrazione**: no.
- **Rischi**: copertura parziale — lo stato è leggibile solo in condizione, non come testo di label; se poi serve anche la lettura diretta, si finisce comunque in D o E, con due meccanismi coesistenti.
- **A favore**: l'innesto più piccolo misurabile; `compileConditional` lo eredita gratis (`irCompile.ts:233,238`).

### Opzione G — Azioni come nuovo costrutto IR, senza riusare gli eventi

Un blocco `actions` nell'IR, compilato in closure con un vocabolario **chiuso** di operazioni (scrivi feature, scrivi stato, toggle), senza JS arbitrario.

- **Tocca**: `irTypes.ts`, `irCompile.ts`, i renderer (`IRNodeContent`, `IRRow`, `UnifiedEdge`) per l'aggancio ai gesti, authoring.
- **Migrazione**: no (dentro `ir`).
- **Rischi**: superficie ampia; si sovrappone concettualmente al tab Events (Q1 va risolta prima, altrimenti coesistono due modelli di azione).
- **A favore**: rispetta il vincolo architetturale di §6.3 (nessuna interpretazione a render-time, dipendenze analizzabili staticamente) e passa dai write path canonici di §2.1 senza inventarne di nuovi, come impone la spec §5.

### Opzione H — Riattivare il canale events

Ricostruire `evalContext` e un percorso di esecuzione per il flow editor.

- **Tocca**: `evalContext` (da inventare, §1.4a), un runtime che invochi gli handler, il DOM/aggancio dei gesti (§1.6), verosimilmente `sharedTypes.tsx` per lo scope.
- **Migrazione**: no.
- **Rischi**: alto. Reintrodurrebbe `new Function` su stringa utente dentro il flow editor, cioè esattamente ciò che la Fase 5a ha spento; l'analizzabilità statica delle dipendenze (`dependencySet`, `crossPaths`) sarebbe impossibile per gli handler.
- **Vincolo che la rende poco praticabile**: `ViewpointRenderer.tsx:17` — l'unico compilatore jsxString vivo espone **solo `React` e `data`**. Non c'è un contesto ricco su cui appoggiarsi: andrebbe costruito da zero.

### Strada preclusa da un vincolo reale

**Espressioni JS arbitrarie dentro l'IR.** Vietata da `FORBIDDEN_PATH` (`irCompile.ts:37`) e `STEP_RE` (`:39`). Il vincolo non è cosmetico: l'architettura "compila una volta, nessuna interpretazione a render-time" (`irCompile.ts:6-8`) e l'intero apparato di reattività (`dependencySet` `irTypes.ts:316`, `crossPaths` `:318`, `irCrossDeps.ts`) esistono **perché** il linguaggio è analizzabile staticamente. Reintrodurre espressioni arbitrarie renderebbe impossibile sapere cosa una view legge, e quindi quando ridisegnarla.

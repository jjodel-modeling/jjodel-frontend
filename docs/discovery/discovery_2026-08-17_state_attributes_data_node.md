# Discovery 2026-08-17 — `data.state` e `node.state`: semantica reale degli attributi di stato

**Tipo**: discovery read-only (Fase 1). Nessuna modifica al codice.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `3a6436ff6`. Working tree con la sola
`docs/discovery/discovery_2026-08-17_tab_sync_loop.md` non tracciata (stessa sessione, altro filo).
**Obiettivo**: rispondere alle otto domande del prompt sulle semantiche reali dei due bag di stato,
con citazione file:riga per ogni affermazione, prima di scrivere il memo di design del pannello di
controllo autorato dal viewpoint (caso d'uso: state machine con State/Transition/Event).

---

## Sintesi in cinque righe

1. `data.state` e `node.state` **non sono due meccanismi**: sono lo stesso campo `_state` della
   classe base D (`DPointerTargetable`), letto attraverso lo stesso getter L, applicato a due
   entità diverse (`data` = `LModelElement`, `node` = `LGraphElement`).
2. Il bag **è persistito** nel salvataggio, **entra nell'undo history**, e in un progetto
   collaborativo **viaggia sul socket** come qualunque scrittura di modello.
3. **Nessuno dei due mondi di rendering attivi oggi lo legge.** L'interprete IR non conosce il
   namespace `state`; il motore jsx che lo conosceva non gira più.
4. Il caso d'uso della state machine **esiste già come prototipo** in `forEndUser/Control.tsx`
   (reset / step / stop su `o.state = {active: …}`), ma è raggiungibile solo dallo scope dei
   template jsx, cioè oggi non è montabile.
5. L'assunzione «`node.state` è per istanza di view» **è falsa oggi**: il DGraphElement è
   indicizzato per `(model, graph)` e il grafo si risolve per `model + graphStyle`, non per
   viewpoint.

---

## Metodo, e un avvertimento sulle ricerche

Tutte le ricerche di questa discovery sono state fatte con `command grep` per bypassare il wrapper
`ugrep --ignore-files` della shell (CLAUDE.md §5). `command grep` qui risolve a BSD grep 2.6.0.

**Una ricerca ha fallito silenziosamente durante la sessione e va registrata**, perché è
esattamente il modo di fallimento che la regola descrive. Il primo grep sul namespace `state`
dentro `editor-v2/viewpoint/ir/` è tornato vuoto:

```
command grep -rn "'state'\|\"state\"\|\.state\b" --include="*.ts" --include="*.tsx" .../ir/
→ 0 righe
```

Il controllo positivo sulla stessa cartella (`command grep -rnE "state"`) ha dato **73 righe in 18
file**. Il pattern precedente usava `\b`, non supportato dalla BRE di BSD grep in quella
alternanza: la ricerca non era negativa, era rotta. La conclusione «l'IR non risolve `state`» del
§Q5 è ricostruita su altre basi (lettura integrale della grammatica PathExpr e dell'interfaccia
ReadCtx, più grep `-E` con controllo positivo su `shape`), non su quel silenzio.

Ogni asserzione di assenza in questo report porta il proprio controllo positivo, dichiarato in linea.

---

## File letti

Core / D-L:
- `frontend/src/joiner/classes.ts` — :281-296 (`attemptWrap`), :1044-1074 (`Constructors.DGraphElement`),
  :1385 (`_state`), :2168-2176 (`clearState`), :2178-2187 (doc inline), :2191-2195 (`get_state`),
  :2196-2243 (`set_state`), :2244-2262 (`__sanitizeValue`), :2277-2294 (`__shallowSolver`),
  :2905-2996 (`DProject`), :3214-3222 (`LProject.get_state`/`set_state`)
- `frontend/src/joiner/proxy.ts` — :322-331 (`json`/`deepJson` rimappa `_state` → `state`)
- `frontend/src/model/dataStructure/GraphDataElements.tsx` — :77-133 (`DGraphElement`), :91, :156,
  :1033-1090 (`DGraph`), :1050, :1106, :1334, :1370, :1696 (`irCollapsed`), :2736, :2757, :2780, :2806
- `frontend/src/common/sharedTypes.tsx` — :36-54 (`GraphElementReduxStateProps`), :89-107
  (`GraphElementOwnProps`), :119-152 (`Edge*Props`), :203-217 (`VertexStateProps`), :220-239
  (`contextFixedKeys`)
- `frontend/src/common/Dummy.ts` — :640-655 (T2M instrada `_state` su `set_state`)

Persistenza / reducer / sync:
- `frontend/src/common/U.tsx` — :427-441 (`compressedState`)
- `frontend/src/components/topbar/SaveManager.ts` — :31-57
- `frontend/src/api/persistance/projects.ts` — :94-110
- `frontend/src/redux/reducer/reducer.ts` — :77 (`MAX_HISTORY`), :114-260 (modificatori `+=` / `-=`,
  `isObjectMerge`), :586 (`UDRegexp`), :632-641 (`Collaborative.send`), :855-913 (compilazione UD),
  :1118-1160 (undo/redo), :1160-1270 (delta e history), :1273-1287 (`isRelevantChangeCheck`)
- `frontend/src/components/collaborative/Collaborative.ts` — :16-29 (`ignoredRootFields`), :39-51
  (`canSend`), :71-88 (`send`), :91-103 (`filterSender`)
- `frontend/src/components/collaborative/CollaborativeAttacher.tsx` — :11
- `frontend/src/redux/action/action.ts` — :300-311, :548-569 (`skipCollaborative`)

Rendering IR:
- `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` — intero (84 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` — intero (165 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — 425 righe, scansione dei campi
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` — intero (191 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts` — intero (62 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irCrossDeps.ts` — :1-60
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` — :99-151
- `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx` — intero (31 righe)
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx` — :405-445
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — :270-302, :436-450, :698-726
- `frontend/src/components/editor-v2/hooks/useHistory.ts` — intero (83 righe)
- `frontend/src/components/editor-v2/EditorV2.tsx` — :137, :1362-1365
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — :140

Rendering legacy e consumatori del bag:
- `frontend/src/utils/UDComparator.ts` — :1-120, :200-273
- `frontend/src/view/viewElement/view.tsx` — :805-840, :1317-1325
- `frontend/src/redux/store.tsx` — :355-400
- `frontend/src/redux/defaults/views.ts` — :30-39
- `frontend/src/common/DV.tsx` — :1-80, :1055-1100, :1354, :1397, :1528-1533
- `frontend/src/components/forEndUser/Control.tsx` — :225-300, :375-460, :465-570
- `frontend/src/components/forEndUser/ControlPanel.tsx` — :1-20
- `frontend/src/components/editors/MetaData.tsx` — intero (55 righe)
- `frontend/src/components/editors/Info.tsx` — :1478-1535, :1561-1593
- `frontend/src/components/editors/views/data/TemplateData.tsx` — intero (86 righe)
- `frontend/src/components/editors/views/data/CustomData.tsx` — :1-60
- `frontend/src/components/project/ProjectEditor.tsx` — :95-110, :1676-1712
- `frontend/src/components/abstract/tabs/MetamodelTab.tsx` — :150-210
- `frontend/src/joiner/components.tsx` — :1-45
- `frontend/src/joiner/ExecuteOnRead.ts` — :15, :94-121 (registrazione dei componenti su `windoww`)
- `frontend/src/components/abstract/Dock.tsx` — :280

Spec e discovery correlate:
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` — §6, §9, §13
- `docs/discovery/discovery_2026-08-17_tab_sync_loop.md` — F2, F3, F4 (stessa giornata)

---

## Q1 — Definizione e ownership

### Il campo è uno solo, sulla classe base D

```
frontend/src/joiner/classes.ts:1385      _state: GObject = {};
```

`_state` è dichiarato su **`DPointerTargetable`**, la radice di tutti gli elementi D. Non esiste una
slice separata dello store, e non c'è niente di specifico a `DObject` o a `DViewElement`: ogni
oggetto che finisce in `idlookup` ha il proprio bag — `DObject`, `DValue`, `DClass`, `DModel`,
`DGraphElement`, `DVertex`, `DViewElement`, `DViewPoint`.

La superficie utente è il proxy L:

```
classes.ts:2191-2195   get_state(context)  → __shallowSolver(context.data._state, true, true)
classes.ts:2196-2243   set_state(val, c)   → merge/patch via SetFieldAction '+=' e '-='
classes.ts:2168-2176   clearState()        → SetFieldAction "_state" = {}
```

La documentazione inline (`classes.ts:2179-2187`, `__info_of___state`) è la specifica autoritativa
scritta dall'autore:

> A space where the user can store informations for their operations/views.
> Example: The Validation viewpoint uses it to store validation messages through onDataUpdate events.
> values are set in a http patch approach, `this.state = {varname: "value"}` will set
> `this.state.varname` without changing other pre-existing values. as such `this.state = {}` does
> nothing. To remove a single entry, use `this.state = {varname: undefined}`. To empty the whole
> state, use `this.clearState()`.
> **WARNING! do not set proxies in the state, set pointers instead.**

### Struttura: bag free-form, piatto, senza namespacing

Il tipo è `GObject`, cioè dizionario stringa → `any`. Nessuna tipizzazione, nessun namespace,
nessuna convenzione di prefisso applicata dal codice. Le ridichiarazioni sui proxy L grafici
(`GraphDataElements.tsx:156, 1106, 1370, 2757, 2806`, tutte `_state!: GObject<"proxified">`) sono
solo dichiarazioni di tipo: il campo resta quello della base.

### `data` e `node` sono due nomi dello stesso meccanismo

Nello scope dei template, i due identificatori vengono dalle props del componente grafico:

```
sharedTypes.tsx:47-48    node!: LGraphElement;      data?: LModelElement;   (GraphElementReduxStateProps)
sharedTypes.tsx:204      node!: LVoidVertex;                                (VertexStateProps)
sharedTypes.tsx:144      node!: LEdge;                                      (EdgeStateProps)
sharedTypes.tsx:90       data?: Pointer<DModelElement> | LModelElement;     (GraphElementOwnProps)
```

`data` è la sintassi astratta (elemento di modello), `node` la sintassi concreta (istanza di
canvas). Entrambi passano dallo stesso `LPointerTargetable.get_state` / `set_state`.

### Attenzione: nel codice ci sono TRE campi diversi che si chiamano `state`

Questo è materiale da memo, perché la collisione di nome è già costata tempo in questa discovery.

| # | Campo | Dove | Che cos'è |
|---|-------|------|-----------|
| 1 | `DPointerTargetable._state` | `classes.ts:1385` | **il bag**, esposto come `.state` sul proxy L |
| 2 | `DGraphElement.state` (+ `DGraph`, `DVoidVertex`, `DEdge`, `DExtEdge`) | `GraphDataElements.tsx:91, 1050, 1334, 2736, 2780` | **dichiarato e mai scritto**: vestigiale |
| 3 | `DProject.state: string` | `classes.ts:2938` (e `:3029`) | **lo stato compresso dell'intero progetto**, niente a che vedere col bag |

Per il #2: l'unica assegnazione è commentata (`classes.ts:1055`,
`// thiss.state = {id: thiss.id+".state", className: thiss.className};`) — è l'opzione 2 scartata
nel commento di design dentro `set_state` (`classes.ts:2199-2204`). Il getter legge `_state`, non
`state`. Controllo: `command grep -rnE "thiss\.state\s*=|\.state\s*=\s*\{"` dà 8 righe, tutte o
commenti/doc o `this.state = {…}` di componenti React classici; nessuna scrittura su `DGraphElement.state`.

Per il #3: `LProject.get_state` legge `context.data.state` (`classes.ts:3214-3216`), e quel campo è
riempito da `U.compressedState` (`U.tsx:427-441`) via `projects.ts:107-108`. Un `project.state` non
è un bag di stato: è il progetto serializzato e compresso.

---

## Q2 — Persistenza

**Sì, il bag è serializzato al salvataggio ed entra nel D-layer. Non resta in sessione.**

La catena:

```
SaveManager.save()            SaveManager.ts:31-38
  → ProjectsApi.save(project) projects.ts:94-110
    → U.compressedState()     U.tsx:427-441
      → JSON.stringify(state) U.tsx:439
```

`compressedState` copia **ogni** oggetto di `idlookup` verbatim (`U.tsx:431-435`). L'unico campo
ripulito prima della serializzazione è `isSelected` (`U.tsx:432`). `_state` è un campo ordinario
del D-object, quindi finisce nella stringa compressa insieme al resto.

Il bag è anche parte della superficie JSON del modello, in entrambe le direzioni:
- in uscita: `proxy.ts:329` — `if (ret._state) ret.state = ret._state;` dentro il ramo
  `json` / `__json` / `deepJson` / `__deepJson`;
- in ingresso: `Dummy.ts:649` — `case '_state': thiss.set_state(v, c); continue;` nel percorso T2M.

**Contrasto utile per il design.** La funzione più vicina a «stato di vista effimero» scritta di
recente ha scelto la strada opposta: il collasso dei container IR vive in un **singleton di modulo**
(`irCollapseState.ts:11-13`, «Kept outside Redux by design: collapse is a per-user ephemeral view
state, like zoom») più un campo D **dedicato** per la persistenza, `DVertex.irCollapsed`
(`GraphDataElements.tsx:1696`, scritto da `canvasToJjom.ts:140`, idratato una volta sola da
`EditorV2.tsx:1362-1365`). Il bag `_state` non è stato usato.

---

## Q3 — Scritture e transazioni

### Sì, passano da TRANSACTION

```
classes.ts:2238-2241
  TRANSACTION(this.get_name(c)+'.state', ()=>{
      if (Object.keys(newState))     SetFieldAction.new(c.data, "_state", newState, '+=', false);
      if (Object.keys(removedState)) SetFieldAction.new(c.data, "_state", removedState, '-=', false);
  })
```

È una TRANSACTION di **sole azioni**, senza creator (`.new()` / `.new2()` / `.new3()`): rientra nel
pattern dichiarato sicuro anche in zona sync da CLAUDE.md §3.3.

Nota di costo: `set_state` apre **una transazione per assegnazione**. Un ciclo che scrive su N
oggetti — come `Control.tsx:265`, `.forEach((o) => {o.state = {[activeFieldName]: false}})` —
produce N transazioni e quindi fino a N passi di undo distinti.

### Semantica di merge: patch shallow di un livello

`set_state` (`classes.ts:2205-2242`) calcola due delta: `newState` (chiavi cambiate) e
`removedState` (chiavi assegnate a `undefined` e già presenti). Il reducer applica `+=` su un valore
oggetto come merge shallow:

```
reducer.ts:240-248
  if (isObjectMerge) {
      oldValue      = {...current[key]};
      current[key]  = {...current[key]};
      for (let subkey in newVal) { … current[key][subkey] = newVal[subkey]; }
  }
```

Un solo livello viene copiato. I sotto-oggetti restano gli stessi riferimenti (vedi Q8.3).

Il doppio delta esiste perché il reducer ignora `undefined`: il commento a `classes.ts:2221` lo
dichiara («reducer is ignoring undefined anyway, so i would need to set the whole obj instead of a
delta»). Da qui la seconda azione `-=`.

### Sanitizzazione in scrittura, risoluzione in lettura

- scrittura: `__sanitizeValue` (`classes.ts:2244-2262`) converte proxy e D-object in id (pointer),
  ricorsivamente su array e su un livello di oggetto.
- lettura: `__shallowSolver(val, true, true)` (`classes.ts:2277-2294`) fa `{...val}` e passa **ogni
  chiave** a `attemptWrap` (`classes.ts:281-296`), che su una stringa tenta
  `LPointerTargetable.fromPointer(v)` e restituisce il proxy se risolve (`return ret || v`).

### Undo history Redux: sì, ci entra

Il delta di history è generico, calcolato sull'intero stato:

```
reducer.ts:1198   let delta = Uobj.objectDelta(ret, oldState, true, false);
reducer.ts:1259-1263   statehistory[user].undoable.push(delta); … (cap MAX_HISTORY, reducer.ts:77)
```

Non c'è nessuna esclusione per campo. Le uniche esclusioni sono tre **chiavi top-level** transienti
(`dragging`, `_lastSelected`, `contextMenu`) e **solo** quando sono l'unica variazione
(`isRelevantChangeCheck`, `reducer.ts:1273-1287`; fast path `isOnlyTransientTopLevelChange`,
`reducer.ts:1194`). Una scrittura su `_state` è un `SetFieldAction` dentro `idlookup`: entra nel
delta e diventa annullabile con Ctrl+Z esattamente come una modifica di modello.

### History di React Flow: no, non la vede

`useHistory.ts:30-40` fa snapshot solo di `nodes` ed `edges` di React Flow, con
`JSON.parse(JSON.stringify(...))`. `_state` non è nel `data` dei nodi RF, quindi non entra nella
history del canvas. Le due history sono indipendenti e non coordinate.

### Un percorso di scrittura alternativo, già in produzione

`ProjectEditor.tsx:1699` scrive `_state` **senza** passare da `set_state`:

```typescript
SetFieldAction.new(dModel.id, '_state', { generatedBy: {…} }, '', false);
```

Modificatore `''` = sostituzione, non merge. Sta dentro la TRANSACTION
`'Execute Transformation: Create Target Model'` (`ProjectEditor.tsx:1656`), che è una transazione
di sole azioni e quindi rispetta §3.3. Oggi è innocuo perché il modello è appena creato e il bag è
vuoto, ma è un precedente da non imitare.

---

## Q4 — Sync fra tab e client

**Un solo canale, condizionato al tipo di progetto; e per due tab dello stesso utente, nessuno.**

`unsafereducer` inoltra **ogni** azione che passa dal reducer:

```
reducer.ts:641   if (Collaborative.online) Collaborative.send(action);
```

`Collaborative.online` diventa vero solo dopo `Collaborative.connect`, chiamata da un solo sito
(`CollaborativeAttacher.tsx:11`), montato solo per progetti `collaborative`.

Il filtro in uscita (`Collaborative.canSend`, `Collaborative.ts:39-51`) scarta tre cose:
`action.sender !== DUser.current`, `action.skipCollaborative`, e i `SetRootFieldAction` sui 13 campi
UI di `ignoredRootFields` (`Collaborative.ts:16-29`: `debug`, `logs`, `contextMenu`,
`_lastSelected`, `tooltip`, `alert`, …).

**Un `SetFieldAction` su `_state` non è filtrato da nessuna di queste tre.** `set_state` chiama
`SetFieldAction.new(c.data, "_state", newState, '+=', false)` con cinque argomenti: il sesto
parametro `skipCollaborative` (`action.ts:567-569`) resta `undefined`. Quindi in un progetto
collaborativo **ogni scrittura di stato viene trasmessa a tutti i partecipanti**, con la stessa
macchina del modello. Non è locale.

Fra due tab dello stesso browser e stesso utente: niente. Nessun `BroadcastChannel`, nessun evento
`storage` per lo stato modello, nessun `window.opener` (misurato stamattina nella discovery
`discovery_2026-08-17_tab_sync_loop.md`, F2, con i grep dichiarati lì); e comunque `filterSender`
(`Collaborative.ts:91-103`) scarta in ricezione tutto ciò che ha `sender === DUser.current`.

---

## Q5 — Reattività

La risposta si spacca in due mondi, e **in nessuno dei due il bag è reattivo per costruzione oggi**.

### (a) Il mondo legacy jsx: il meccanismo esisteva, e non gira più

Il meccanismo era `usageDeclarations`. Il reducer compila la dichiarazione in una funzione
transiente:

```
reducer.ts:867-913   tv.UDFunction = new Function(paramStr, 'return ('+dv.usageDeclarations+')(ret)')
```

Lo scope dichiarato includeva `state` accanto a `data`, `node`, `view`, `constants`:

```
view.tsx:823      "(ret)=>{ // scope contains: data, node, view, constants, state\n" …
store.tsx:376     `(ret)=>{ // scope: data, node, view, state,` …
contextFixedKeys  sharedTypes.tsx:220-239  — include "state": true
```

Il confronto fra due UD successive è `UDComparator.ts`, con la scorciatoia
`keysToCheck = ['data', 'node', 'view']` a `:251`. E il commento in `view.tsx:829` documenta
l'idioma: *«if you want your node re-rendered every time, add a dependency to `ret.state = state;`
or `ret.update = Math.random();`»*.

**Oggi la funzione non viene mai eseguita.** `command grep -rn "UDFunction(" frontend/src` esce con
codice 1; controllo positivo sulla stessa forma di ricerca: `UDFunction` compare **4 volte**
(`classes.ts:4066` dichiarazione, `reducer.ts:874, 895, 904` assegnazioni). Nessun call site.

Coerente col resto della dismissione del classico:
- gli handler di view non girano: nessun call site per `onDataUpdate` (solo
  `view.tsx:1319` getter e `:1322` setter), e la UI lo dichiara da sé —
  `CustomData.tsx:30-34`: *«Handlers defined here are saved with the view, but the current editor
  does not execute them. Their execution channel belonged to the classic editor, which has been
  retired.»*;
- il template non ha interprete: `TemplateData.tsx:22-27`, *«This template is no longer
  interpreted»*;
- l'unico renderer jsx rimasto in editor-v2 è irraggiungibile: `ClassNode.tsx:424` entra nel ramo
  `ViewpointRenderer` solo `if (data.jsxString)`, e `data.jsxString` non ha nessun sito di
  assegnazione in `editor-v2/` (dichiarato opzionale in `types.ts:125`, mai scritto). E comunque
  `ViewpointRenderer.tsx:17` compila con scope `('React', 'data')` — **`node` non c'è** — e con
  `data` legato al node data di React Flow, non a un proxy L.

### (b) Il mondo IR: il namespace `state` non esiste

La grammatica PathExpr accetta un solo insieme di passi:

```
pathExpr.ts:23   STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/
pathExpr.ts:31-58 parsePathExpr — throw su qualunque token fuori da quell'insieme
```

Cioè `$feature`, `.value`, `.values`, `.values[N]`. Non c'è modo di scrivere `state.x` in un
PathExpr: verrebbe rifiutato con `[ir] invalid PathExpr step "state"`.

L'interfaccia di lettura dell'interprete non espone il bag:

```
irReadCtx.ts:17-32   ReadCtx = { getValue, getValues, getName, getMetaclassName, isKindOf, getRef }
```

Il tipo dello schema non ha alcun concetto di interazione autorata:
`command grep -nE "interaction|action|onClick|command|button" irTypes.ts` → **0 righe** su 425;
controllo positivo con lo stesso comando: `shape` → **8 righe**. `irInteraction.ts` non è un
sotto-schema autorato ma un piano **derivato** dalle view (palette / connect / drop,
`irInteraction.ts:53-89`), coerente con la spec §6 che definisce `InteractionSpec` solo su questi
tre gesti.

La reattività IR è agganciata alle **DValue**, non agli elementi:
- firma sui feature slot dell'oggetto (`IRNodeContent.tsx:99-138`, `compartmentSig` / `rowChildSig`);
- dependency set cross-oggetto concretizzato in id di DValue (`irCrossDeps.ts:1-28`).

E la spec §9 è **normativa in senso restrittivo**: *«L'interprete DEVE invalidare il render di un
elemento quando cambia una feature nel suo dependency set, e NON DEVE re-renderizzare per feature
fuori dal set»*. Un `state` reattivo richiederebbe quindi di estenderlo esplicitamente: non è una
svista, è fuori perimetro per costruzione.

### (c) Che cosa reagisce davvero, oggi

I componenti React `connect`-ati che leggono il bag dal proxy L. Il re-render arriva dal ciclo
Redux ordinario: il `SetFieldAction` rimpiazza l'oggetto **e** `idlookup`
(`classes.ts:1762, 1843, 1884`: `state.idlookup = {...state.idlookup}`), quindi i `connect` che
risolvono quell'elemento ricalcolano. Due esempi vivi:

- **`MetaData.tsx:16-18`** — tab «Metadata», montato in `Dock.tsx:280`. Legge e scrive
  `props.data.state.icon` con `mapStateToProps` su `_lastSelected.modelElement` (`:32-42`). È il
  precedente più pulito della forma «pannello React che legge e scrive `data.state` con
  reattività».
- **`Info.tsx:1487-1504`** — pannello Properties, sezione «Advanced» (solo advanced mode): mostra
  `ddata._state` come JSON via `JsonViewer`, con riepilogo delle prime tre chiavi nell'header.

---

## Q6 — Usi attuali

Percorsi reali trovati, con lo stato di raggiungibilità:

| # | Path | File:riga | Vivo? |
|---|------|-----------|-------|
| 1 | `data.state.icon` | `MetaData.tsx:16-18` | **sì** (tab Metadata, `Dock.tsx:280`) |
| 2 | `dModel._state.generatedBy` | scritto `ProjectEditor.tsx:1699`, letto `:101` | **sì** (dashboard progetto) |
| 3 | `data.instanceof.state['initial'\|'terminal'\|'node'\|'ownedTransitions'\|'nextState']` | `Control.tsx:244-248`, scritto da `MetaElementPicker` `:419-420` | no (solo scope template) |
| 4 | `o.state = {active: true\|false}` su `data.model.allSubObjects` | `Control.tsx:265, 270, 280, 287-293` | no (solo scope template) |
| 5 | `node.state.showPanel` | `ControlPanel.tsx:10, 14` | no |
| 6 | `node.state.level` / `node.state.colorIndex` | `DV.tsx:1354, 1397, 1528, 1533` | no (sorgente stringa jsx) |
| 7 | `node.state.level/grid/snap`, `node.graph.state.*` | `redux/defaults/views.ts:30-39` | no (UD non eseguite) |
| 8 | `data.state.description` | `Info.tsx:443` | no — tutti e 7 i chiamanti di `builder.named` passano `skipTitle = true` (`Info.tsx:479, 507, 532, 544, 554, 586, 600`; `grep -c "\.named("` → 7, nessuna occorrenza fuori da `Info.tsx`) |
| 9 | `node.view.state.contextualEntries` | `Control.tsx:453-457` | no (commentato) |
| 10 | `data.state.oldQuantity / editN / requiresValidation` | `ContextMenu.tsx:244-249` | no (stringa di esempio `onDataUpdate`) |

**Il #3 e il #4 meritano attenzione: sono il caso d'uso del prompt, già prototipato.**
`Control.tsx:236-373` è un pannello di controllo di simulazione per state machine, con la stessa
architettura in due strati che Alfonso sta disegnando:

- **configurazione sul metamodello**: quando `props.data.isMetamodel`, il pannello mostra
  «Control Flow Aspect» e cinque `MetaElementPicker` (`:349-358`) che scrivono nel bag della M2 i
  puntatori alle metaclassi/reference che giocano i ruoli `node`, `initial`, `terminal`,
  `transition`, `ownedTransitions`, `nextState`;
- **esecuzione su M1**: `resetSimulation` / `step` / `stop` (`:259-299`) leggono quei ruoli dal bag
  del metamodello e scrivono un flag `active` nel bag delle istanze, navigando
  `o['$'+ownedTransition].values` → `t['$'+nextState].value`. **Nessuna scrittura sul modello**:
  l'invariante «la simulazione non tocca il modello» è già rispettata da questo prototipo.

Il pannello è esportato allo scope dei template (`joiner/components.tsx:41`, riversato su
`windoww` da `ExecuteOnRead.ts:94-121`) e non ha alcun altro sito di montaggio: con il motore jsx
spento è codice conservato, non codice attivo.

**Contrasto rilevante**: il collasso IR — la feature di «stato non-modello» più recente — non usa il
bag. Sta in `irCollapseState.ts` (singleton di modulo + `useSyncExternalStore`) più il campo
dedicato `DVertex.irCollapsed`. È la scelta di design opposta, ed è la più recente.

---

## Q7 — Scoping

### `data.state`: condiviso. Confermato.

Il bag sta su `DPointerTargetable` (`classes.ts:1385`) e il getter legge `context.data._state`
(`classes.ts:2191-2195`). Non c'è nessuna dimensione viewpoint, editor o utente nella chiave. Un
elemento di modello ha **un** bag, visibile identico da qualunque viewpoint e qualunque editor.

### `node.state`: **non è per istanza di view. Smentito.**

Il DGraphElement è indicizzato per `(model, graph)`:

```
GraphDataElements.tsx:85-87
   id!:    Pointer<DGraphElement>;
   graph!: Pointer<DGraph>;
   model?: Pointer<DModelElement>;
```

e il grafo si risolve per **modello + `graphStyle`**, non per viewpoint:

```
useJjomSync.ts:277-296    dGraphs.find(g => g?.model === modelid && g.graphStyle === 'v2-flow')
MetamodelTab.tsx:206-208  graphs.filter(g => g.model === ret.model?.id && g.graphStyle !== 'v2-flow')[0]
```

Entrambi prendono il **primo** match. Ne segue che per un modello esistono al massimo due grafi
(uno v2-flow e uno classico), non uno per viewpoint. **Cambiare viewpoint non forka il vertice**:
`node.state` sopravvive al cambio di viewpoint ed è condiviso fra i viewpoint che rendono lo stesso
modello nello stesso editor.

La separazione «`data.state` condiviso / `node.state` per-viewpoint» che il design assume oggi
**non esiste nel codice**. Esiste una separazione diversa e più debole: `data.state` è per elemento
di modello, `node.state` è per elemento-di-modello-nel-canvas. Se due tab aprono lo stesso modello
nello stesso stile di editor, condividono anche i `node.state`.

---

## Q8 — Rischi

**R1 — Nessun namespacing, e lo spazio è già affollato.** Bag piatto, chiavi arbitrarie, nessun
prefisso imposto. Chiavi già in uso nel codice, tutte nello stesso spazio e su ogni elemento:
`icon`, `generatedBy`, `active`, `initial`, `terminal`, `node`, `transition`, `ownedTransitions`,
`nextState`, `level`, `grid`, `snap`, `colorIndex`, `showPanel`, `contextualEntries`,
`description`, `oldQuantity`, `editN`, `requiresValidation`. Una simulazione che usasse `active`
collide con `Control.tsx`.

**R2 — In lettura, ogni stringa viene tentata come pointer.** `attemptWrap` (`classes.ts:281-296`)
chiama `LPointerTargetable.fromPointer(v)` su qualunque valore stringa e ritorna il proxy se
risolve. Salvare `state.currentStateId = '<id di un DObject>'` restituisce un **proxy L**, non la
stringa. È simmetrico e voluto (`__sanitizeValue` converte i proxy in id in scrittura, e il doc
dice «do not set proxies in the state, set pointers instead»), ma è una trappola per chi salva
identificatori come stringhe pensando di rileggerli tali.

**R3 — Le mutazioni annidate bypassano tutto il macchinario.** `get_state` restituisce una copia
**shallow** (`__shallowSolver`, `classes.ts:2286-2291`: `{...val}`), e anche il merge del reducer
copia un solo livello (`reducer.ts:242-243`). I sotto-oggetti sono gli stessi riferimenti
dell'oggetto in Redux. Quindi `obj.state.foo.bar = 1` **muta lo store in place**: nessuna azione,
nessun delta, nessun undo, nessun re-render, nessuna propagazione collaborativa, e una
denormalizzazione silenziosa dello store. Il codice `ContextualEntry` (`Control.tsx:453-457`, oggi
commentato) faceva esattamente questo:
`props.node.view.state.contextualEntries[props.title] = {...}`.

**R4 — Nessuna garbage collection, e il bag è persistito e trasmesso.** L'unico strumento è
`clearState()` (`classes.ts:2168-2176`), che azzera tutto. Non c'è scadenza, né pulizia alla
chiusura, né distinzione fra chiavi effimere e durevoli. `state.icon` è già un esempio di chiave
orfana: scritta e riletta solo dentro `MetaData.tsx` (grep `state.icon` → 2 hit, entrambi lì),
nessun renderer la consuma, e viene salvata in ogni progetto.

**R5 — Un rimosso non è distinguibile da un assente, e la via raw sostituisce invece di fondere.**
Il reducer ignora `undefined` (commento a `classes.ts:2221`), da cui la seconda azione `-=`. Chi
scrive raw con modificatore `''` — come `ProjectEditor.tsx:1699` — **sostituisce il bag intero**.

**R6 — Costo su salvataggio e undo.** Il bag entra nella `JSON.stringify` dell'intero stato a ogni
salvataggio (`U.tsx:439`) e in ogni delta di undo (cap `MAX_HISTORY`, `reducer.ts:77`). Una
simulazione che scrive a ogni step riempie l'undo di passi di simulazione mescolati alle modifiche
di modello: l'utente che preme Ctrl+Z dopo dieci step annulla gli step, non la sua ultima edit. Non
esiste un opt-out per l'undo analogo a `skipCollaborative` (`action.ts:300, 567-569`), che invece
esiste per il canale collaborativo e non è usato da `set_state`.

**R7 — Lo scoping assunto dal design non è quello reale** (Q7): `node.state` non è per viewpoint.

**R8 — Una transazione per assegnazione.** `set_state` apre una `TRANSACTION` a ogni scrittura
(`classes.ts:2238`); un ciclo su N oggetti produce N transazioni e fino a N passi di undo.

**R9 — Il canale di esecuzione degli eventi non esiste.** Il design presuppone «bottoni che
triggerano eventi». Gli handler di view sono conservati e non eseguiti
(`CustomData.tsx:30-34`, nessun call site per `onDataUpdate`), l'IR non ha alcun concetto di
azione autorata (Q5b), e i componenti `forEndUser` sono raggiungibili solo dallo scope jsx spento.
Non è un rischio del bag: è un pezzo mancante a monte del bag.

---

## Dipendenze individuate

- **Il bag e il ciclo Redux sono la stessa cosa.** Qualunque decisione su reattività, undo,
  persistenza e sync del bag è una decisione sul ciclo Redux: non c'è un livello intermedio dove
  intervenire senza toccare `set_state` (core, `joiner/classes.ts`) o senza introdurre un canale
  parallelo.
- **La spec IR §9 vincola.** Se il pannello deve leggere `state` da espressioni IR, servono tre
  cose coordinate: estensione della grammatica PathExpr (`pathExpr.ts`), estensione di `ReadCtx`
  (`irReadCtx.ts`), estensione del dependency set (`irCrossDeps.ts` + le firme in
  `IRNodeContent.tsx`). Sono tre file della critical zone §3.1.
- **Se invece il pannello è un componente React fuori dall'IR** (la forma `MetaData.tsx`), non
  serve toccare niente dell'interprete: `connect` + proxy L bastano già oggi. È l'opzione di gran
  lunga più economica, ed è già dimostrata funzionante in produzione.
- **`Collaborative`**: un cambio di comportamento sul canale (es. non trasmettere lo stato di
  simulazione) passa da `canSend` / `skipCollaborative`, cioè da `Collaborative.ts` e dalle firme
  di `SetFieldAction` — zona sync.

---

## Domande aperte per Alfonso

1. **Persistenza — voluta o subita?** Oggi il bag è salvato con il progetto. Un progetto salvato a
   metà simulazione riapre a metà simulazione, e lo stato di simulazione entra nel diff del
   salvataggio. Il collasso IR ha scelto il singleton di modulo proprio per evitarlo. La
   simulazione va persistita, o serve un canale effimero?

2. **Undo — la simulazione deve stare nella history?** Oggi ci sta obbligatoriamente e si mescola
   alle edit di modello. Non esiste un opt-out per azione (esiste solo per il collaborativo). Se la
   risposta è no, è una modifica al core del reducer o al costruttore delle azioni: da decidere
   prima di scrivere il memo, perché cambia l'architettura del pannello.

3. **Collaborativo — uno step di simulazione arriva agli altri partecipanti?** Oggi sì, in un
   progetto `collaborative`. È il comportamento voluto (simulazione condivisa) o va tagliato?

4. **Scoping — `node.state` non è per viewpoint** (Q7). Il design lo assume. Se la separazione per
   viewpoint serve davvero, va costruita: non c'è oggi, e la chiave naturale (`viewpointId`) non
   compare in nessuna delle due entità.

5. **Namespacing — si accetta il bag piatto?** Nessun supporto nel codice per prefissi o
   sottospazi; le chiavi collidono su un unico livello. Una convenzione (`state.sim.*`) sarebbe
   solo disciplina, non garanzia — e con la copia shallow di R3 un sotto-oggetto `sim` sarebbe
   proprio il caso in cui le mutazioni annidate scappano.

6. **Il pannello è dentro o fuori l'IR?** Sono due lavori di taglia molto diversa: fuori
   (componente React `connect`-ato tipo `MetaData`) non tocca la critical zone; dentro (namespace
   `state` risolvibile nelle espressioni IR) tocca PathExpr, ReadCtx e il dependency set, con la
   spec §9 da emendare.

7. **Da dove viene il canale di esecuzione degli eventi?** Il bottone che triggera un evento non ha
   oggi nessun runtime: gli handler di view sono inerti per dichiarazione esplicita della UI, e lo
   schema IR non ha azioni. Questo pezzo va progettato prima o insieme al bag, non dopo.

8. **`Control.tsx` — si riparte da lì o si riscrive?** Il prototipo copre configurazione sul
   metamodello ed esecuzione su M1 con l'invariante «non toccare il modello» già rispettata. È
   codice conservato e non raggiungibile: la scelta fra recuperarlo e riscriverlo cambia molto il
   perimetro di una eventuale Fase 2.

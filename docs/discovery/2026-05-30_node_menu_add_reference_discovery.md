# Mini-discovery — context menu del nodo e affordance "Add reference" (Fase 1, READ-ONLY)

**Nome documento prompt**: 2026-05-30 — discovery_node_menu_add_reference
**Branch**: `alfonso-frontend-jjtl`
**Modalità**: sola lettura. Nessun file sorgente modificato. Citazioni `file:riga` verificate sul working tree.

## Sintesi esecutiva

Il menu del nodo sul canvas v2-flow e il punto in cui vive `addReference` sono in **due editor diversi**:
- Il menu del nodo v2-flow e' costruito da `getContextMenuItems()` in `EditorV2.tsx:2162` e reso dal `ContextMenu` **locale di editor-v2** (`./ContextMenu`, import a `EditorV2.tsx:35`). Non contiene "Add reference"/"Add attribute".
- `addReference` e' esposto **solo nell'editor classico** (ModelTab/MetamodelTab): via l'overlay AI-Suggest/memorec del `contextMenu/ContextMenu.tsx`, via la FeaturesPalette (drag), e via shortcut da tastiera `r`. Nessuno dei tre vive nel v2-flow.

Il menu del nodo v2-flow **gia' mischia** operazioni di vista e di modello (Delete passa per la co-evoluzione del modello; per gli objectNode c'e' gia' un blocco "Add <child>" che crea istanze M1). Quindi aggiungere "Add reference" (operazione di modello) **non sarebbe anomalo** rispetto al pattern gia' presente, e la `LClass` del nodo e' risolvibile col pattern gia' usato nello stesso file. Fatti sotto; decisione in chat.

---

## M1 — Componente del context menu del nodo (v2-flow)

**Costruzione voci**: `getContextMenuItems(): ContextMenuItem[]` in `EditorV2.tsx:2162`. Ramo "single node" a `EditorV2.tsx:2238`:
```typescript
if (contextMenu?.nodeId) {
    const node = getNodes().find(n => n.id === contextMenu.nodeId);   // :2239  → RF node (DVertex)
    const items: ContextMenuItem[] = [];
    ...
}
```
**Rendering**: `ContextMenu` **locale di editor-v2** (non il classico), import a `EditorV2.tsx:35` (`import ContextMenu, { type ContextMenuItem } from './ContextMenu'`), montato via `createPortal` a `EditorV2.tsx:3217-3221` (`items={getContextMenuItems()}`).

**Voci del menu single-node** (`EditorV2.tsx:2285-2412`), nell'ordine osservato da Alfonso:

| Voce | Azione | Livello |
|---|---|---|
| Edit | `disabled: true`, tooltip "Available in classic editor" (`:2287-2291`) | vista (disabilitata) |
| Duplicate | `duplicateNode(nodeId)` (`:2295`) | **vista** (vedi M4) |
| Delete | `deleteNode(nodeId)` (`:2301`) | **modello** (vedi M4) |
| Up / Down | `disabled: true`, classic-only (`:2305-2315`) | vista (disabilitata) |
| Disable auto-sizing | `disabled: true`, classic-only (`:2318-2322`) | vista (disabilitata) |
| Help | `HELP_OPEN` event (`:2325-2336`) | UI |
| Explain this | `EXPLAIN_OPEN` event (`:2338-2386`) | UI (legge `node.data`) |
| Create View | `createViewInWorkbench(...)` (solo classNode/enumNode, `:2390-2411`) | **vista** (crea DViewElement) |

Per gli **objectNode** in model mode c'e' inoltre, in testa alla lista, un blocco "composition children" che crea istanze M1 (`:2243-2281`, vedi M4).

**Dati disponibili al componente**: ha il **RF node** (`node.id` = id del DVertex; `node.data` = dati di presentazione), **non** direttamente la `LClass`. Ma la `LClass` e' **risolvibile** dal nodo, ed e' gia' fatto in questo file:
- Create View (`:2403-2405`):
  ```typescript
  const vertexProxy: any = LPointerTargetable.fromPointer(node.id);
  const modelElement = vertexProxy?.model;          // ← LClass
  const classId = modelElement?.id ?? node.id;
  ```
- Composition objectNode (`:2248-2249`):
  ```typescript
  const dVertex = LPointerTargetable.fromPointer(node.id) as any;
  const sourceObjectId = dVertex?.model?.id ?? dVertex?.__raw?.model ?? node.id;
  ```

**Nessuna voce "Add reference"/"Add attribute"** nel menu del nodo v2-flow: confermato (le voci sono quelle in tabella).

---

## M2 — Dove e' esposto `addReference` oggi

Tutte le vie sono nell'**editor classico**, mai nel v2-flow.

### (a) `ContextMenu.tsx:320` — overlay AI-Suggest / memorec (editor classico)
- File `contextMenu/ContextMenu.tsx`, montato in `ModelTab.tsx:42` (`<ContextMenu graph={graphid}/>`) e `MetamodelTab.tsx:172`. (Anche `Vertex.tsx`/`graphElement.tsx` lo usano via `ShowContextMenu`.)
- `addReference` **non** ha una voce diretta. Si raggiunge solo dal flusso AI-Suggest:
  - per un `DClass`, voce "AI Suggest" (`ContextMenu.tsx:501-508`, `onClick={structuralFeature}` -> `MemoRec.structuralFeature`), gated su `!U.isOffline()` (`:500`);
  - le raccomandazioni popolano `memorec.data` (`:571-580`); cliccarne una setta `suggestedName`;
  - compare l'overlay "Add &lt;name&gt; as: Attribute / Reference" (`:582-596`), e "Reference" chiama `suggestOnClass(false)`:
    ```typescript
    const suggestOnClass = (isAttribute:boolean) => {           // :316
        const lClass: LClass = (ldata as LClass);
        if (isAttribute) lClass.addAttribute(suggestedName);
        else lClass.addReference(suggestedName);                // :320
        close();
    }
    ```
- Gating effettivo: editor classico + `ddata.className === 'DClass'` + online + flusso AI-Suggest. **Non esiste un "Add reference" semplice** nemmeno nel classico; e' sempre mediato dalla suggestion.

### (b) `featureDefinitions.ts:78` — FeaturesPalette (editor classico)
- Voce palette `id:'reference'`, `dragType:'FEATURE_REFERENCE'`, `defaultData:{name:'newReference', type:null, containment:false}` (`featureDefinitions.ts:70-82`).
- `FeaturesPalette` (sidebar collassabile, elementi **trascinabili**) e' montata **solo** in `MetamodelTab.tsx:186` (`<FeaturesPalette />`) — editor classico del metamodello.
- Il drop di un sub-feature **sul canvas e' un no-op**: `MetamodelTab.tsx:92-96` ritorna early per `FEATURE_ATTRIBUTE/REFERENCE/OPERATION/LITERAL` ("they need a parent Class"). La reference si crea solo droppando **su una classe** (Vertex classico).

### (c) Shortcut da tastiera (editor classico)
- `graphElement.tsx:909`: con il focus su un elemento del grafo classico, tasto `r` -> `this.props.data?.addChild("reference")` (analoghi: `a`,`o`,`l`,`p`,`c`,`e`,`q`).

**Conclusione M2**: nel **v2-flow** non c'e' alcuna via per `addReference` se non il gesto canvas drag-arco (`onConnect`, target on-canvas) gia' mappato nella discovery precedente. Le tre vie sopra sono tutte classic-only.

---

## M3 — Fattibilita' di "Add reference"/"Add attribute" nel menu del nodo

**Accesso alla LClass**: SI'. Dal `node.id` (id del DVertex) si ottiene la `LClass` con `LPointerTargetable.fromPointer(node.id).model`, **gia' fatto** nello stesso file (Create View `:2403-2405`, composizione objectNode `:2248-2249`). La stessa risoluzione che usa `ContextMenu.tsx` per ottenere `lClass` da `ldata` e' replicabile qui partendo dal nodo.

**Punto di innesto**: la lista `items` del ramo single-node (`EditorV2.tsx:2285-2412`) e' un array a cui si fanno `push`/spread. Una voce nuova che, gated su `node?.type === 'classNode'`, risolva `lClass` come sopra e chiami `lClass.addReference(name)` (eventualmente `lClass.addAttribute(name)`) si inserisce **senza toccare la logica delle altre voci**. Esiste gia' un **precedente strutturale** di voci che creano modello, appese in testa a questa stessa lista: il blocco composition-children per objectNode (`:2243-2281`, `onClick: () => createCompositionChild(...)`).

**Nota di portata**: `addReference` crea **solo la feature nel modello**. Non crea da solo un edge sul canvas; il sync renderizza un arco solo se il target e' un vertice on-canvas (per il caso cross-mm vale quanto detto nella discovery `2026-05-29_reference_cross_mm_creation_discovery.md`: serve l'overlay visivo, non l'edge). Quindi "Add reference" da menu produrrebbe una reference editabile dal pannello, eventualmente con `type` di default = la classe stessa (`get_type` fallback, `LModelElement.tsx:1404`), da ritypizzare.

---

## M4 — Coerenza vista/modello

Il menu del nodo v2-flow **gia' contiene sia operazioni di vista sia operazioni di modello**:

**Operazioni di vista (o disabilitate)**
- Edit, Up, Down, Disable auto-sizing: `disabled: true`, classic-only.
- **Duplicate** -> `duplicateNode` (`EditorV2.tsx:1809-1828`): **pura vista**. Aggiunge un nuovo RF node con id `${type}_${Date.now()}` (`:1817`), nessuna creazione di elemento di modello.
- **Create View** -> `createViewInWorkbench` (`:2400-2408`): operazione di vista (crea un DViewElement nel workbench).

**Operazioni che toccano il modello (gia' presenti)**
- **Delete** -> `deleteNode` (`EditorV2.tsx:1773-1792`): in JjOM mode su classNode passa per `handleClassRemoval(nodeId)` (`:1779`, co-evoluzione del modello); altrimenti rimuove il nodo e fa `syncDeleteVertex(nodeId)` (`:1789`). Quindi **muta il modello**.
- **Composition "Add &lt;child&gt;"** (objectNode, model mode) -> `createCompositionChild` (`:2104-2118`) -> `syncCreateObject(graphId, childClass.id, ...)` (`:2118`): **crea un DObject** (istanza M1). Voce di **creazione di modello** gia' presente in questa stessa lista.

**Fatto rilevante per la decisione**: "Add reference" e' un'operazione di modello su `LClass`. Inserirla nel menu del nodo **non introdurrebbe una mescolanza nuova** vista/modello: il menu gia' espone Delete (co-evoluzione modello) e, per gli objectNode, "Add child" (creazione istanze M1). Esiste quindi un precedente diretto nello stesso punto di codice. (Resta il fatto descrittivo che oggi, per le **classi M2**, le uniche voci che toccano il modello sono Delete; la creazione di feature M2 non e' mai stata esposta qui — e' sempre vissuta nel classico, vedi M2.)

---

## Aperto / Da decidere in chat

1. **Se aggiungere "Add reference"/"Add attribute" al menu del nodo v2-flow.** Tecnicamente fattibile e coerente col pattern esistente (M3, M4): nuova voce gated su `classNode`, risoluzione `LClass` via `LPointerTargetable.fromPointer(node.id).model`, riuso di `lClass.addReference`/`addAttribute`. Decisione di prodotto: esporre la creazione di feature M2 nel v2-flow (oggi assente) o tenerla nel classico.
2. **Relazione con il caso cross-mm.** "Add reference" da menu crea la feature ma non l'arco; per il target cross-mm resta aperto l'overlay visivo (ghost-target) della discovery precedente. Le due cose sono indipendenti: la voce di menu risolve la *creazione/discoverability*, l'overlay risolve la *visualizzazione*.
3. **Default `type` della reference appena creata.** `addReference(name)` senza type lascia `type` al fallback (la classe stessa). Da decidere se va bene creare "vuota" e far scegliere il target dal pannello, o se la voce di menu deve aprire subito un picker.
4. **UX/posizionamento nella lista.** Se si procede, dove collocare la voce (vicino a Create View? sezione dedicata?) e se aggiungere anche Attribute/Operation per simmetria con la FeaturesPalette classica.

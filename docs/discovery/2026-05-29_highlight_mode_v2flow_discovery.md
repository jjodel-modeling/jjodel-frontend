# Discovery — Highlight Mode (v2-flow / ReactFlow)

**Tipo:** Fase 1 — discovery READ-ONLY. Nessuna modifica al codice (solo questo report).
**Branch:** `alfonso-frontend-jjtl`
**Data:** 2026-05-29
**Fonte di verità:** `CLAUDE.md`.

---

## ⚠️ Finding architetturale chiave (leggere prima di tutto)

La premessa di D1 — «il selettore *Theme* è già una config di rendering **persistente** [nel progetto]» — **non è confermata dal codice**. Il `Theme`/`colorScheme` è persistito **solo in `localStorage`** (chiave `editor-v2-color-scheme`), è **editor-wide / cross-progetto**, non tocca lo stato Redux del progetto, non vive su alcun `DObject`/`DViewElement`/`DGraph`/`DViewPoint`, non è in alcun `jsxString`, e **non ha** migrazione `VersionFixer`. Vedi D1 per il trace completo.

Conseguenza diretta per la decisione di design «lo stato è persistente nel progetto, persistiamo solo gli ID dei seed»:

- **Il Theme NON è il template giusto da imitare** per la persistenza-nel-progetto del seed set. È il template giusto solo per la parte *ephemeral UI* (l'on/off del mode, se accettiamo che non viaggi col file di progetto).
- Nel v2-flow esistono **due meccanismi di persistenza distinti**, e la feature ne tocca entrambi:
  1. **Toggle UI ephemeral** — `localStorage` + `CustomEvent` dispatch dal menubar → `addEventListener` nell'editor. È il pattern di *tutti* i toggle del menu View (vedi D2). **Non** entra nel file di progetto.
  2. **Stato persistito nel progetto** — campo additivo su un'entità D (`DProject` o `DViewElement`/`DViewPoint`) + **migrazione `VersionFixer`** (vedi D6). È l'unico meccanismo che sopravvive a save/reopen del progetto. Il template più vicino al «set di ID» è `DProject.expandedTreeNodes` (un `string[]` di id, migrazione `2.215 -> 2.216`).

Quindi il design «seed persistiti nel progetto» richiede il meccanismo (2), che **nessun** toggle del menu View usa oggi. Questo va deciso in Fase 2 (vedi §Sintesi).

---

## D1 — Persistenza del Theme

### D1.1 — Componente che renderizza il dropdown Theme

`frontend/src/components/editor-v2/components/ColorSchemeSelector.tsx`

- Opzioni "main": `MAIN_OPTIONS` a **righe 22–28** — `Default` (23), `Monochrome` (24), `High Contrast` (26), `Print` (27).
- Opzioni "palette": `PALETTE_OPTIONS` a **righe 30–36** — `Sapphire` (31), `Amethyst` (32), `Jade` (33), `Terracotta` (34), `Crimson` (35).
- Trigger UI con label `Theme: {current.name}` a **riga 114**; selezione gestita da `handleSelect(id)` a **righe 79–83**, che chiama la prop `onColorSchemeChange(id)`.
- Il tipo `ColorScheme` è importato da `../types` (riga 2).

Il dropdown è montato dalla `Toolbar` del v2-flow; la prop è cablata in `EditorV2.tsx` come `onColorSchemeChange={setColorScheme}` (riportato dal subagente attorno a EditorV2.tsx:3100 — non riletto riga per riga in questa sessione, vedi §Incertezze).

### D1.2 — Percorso di scrittura dello stato (evento → stato → forma persistita)

**Non c'è Redux.** Il percorso è interamente React-state + `localStorage`:

1. utente clicca un'opzione in `ColorSchemeSelector.tsx` → `handleSelect(id)` (riga 79) → `onColorSchemeChange(id)` (riga 80).
2. In `EditorV2.tsx` la prop è il setter di stato React `setColorScheme` (stato dichiarato a **EditorV2.tsx:689**).
3. Un `useEffect` scrive su `localStorage` ad ogni cambio: **EditorV2.tsx:694–696** → `localStorage.setItem('editor-v2-color-scheme', colorScheme)`.

Nessun `SetFieldAction`/`SetRootFieldAction`/`TRANSACTION` coinvolto.

### D1.3 — Dove viene salvato

`localStorage`, chiave **`editor-v2-color-scheme`**.

- Lettura iniziale (al mount): **EditorV2.tsx:689–692** — `const saved = localStorage.getItem('editor-v2-color-scheme')`, validato contro `VALID_SCHEMES` (688), fallback `'default'`.
- Applicazione a runtime: classe CSS sul div root dell'editor — **EditorV2.tsx:3077** — `scheme-${colorScheme}` (concatenata a `theme-${theme}`, `notation-${notation}`, ecc.).

**Non** è su `DObject`/`DViewElement`/`DGraph`/`DViewPoint`, **non** è in Redux `idlookup`, **non** è in un `jsxString`. È preferenza UI puramente locale al browser.

> Nota di disambiguazione: nella stessa className di riga 3077 compare anche `theme-${theme}`. Quel `theme` è il **light/dark mode applicativo** (token `styles/tokens/`), concetto distinto dal `colorScheme` (palette di rendering dell'editor). La domanda D1 riguarda `colorScheme`.

### D1.4 — Scope

**Editor-wide / cross-progetto.** Chiave `localStorage` piatta senza namespace di diagramma/view/modello; una sola variabile `colorScheme` in `EditorV2` governa tutto il rendering. Non è per-diagramma, né per-viewpoint, né per-modello.

### D1.5 — VersionFixer

**Nessuna migrazione** per il colorScheme/Theme (coerente: non è stato di progetto). Vedi D6 per la versione corrente e i template realmente rilevanti.

---

## D2 — Menu View del menubar principale

### D2.1 — Componente del menubar

`frontend/src/pages/components/Navbar.tsx` — funzione `NavbarComponent`.

I quattro menu top-level sono definiti in un unico array `items: MenuEntry[]`:
- `Edit` — **Navbar.tsx:1383**
- `View` — **Navbar.tsx:1395**
- `Tools` — **Navbar.tsx:1459** (`isDashboard ? null : {name: 'Tools', …}`)
- `Analyze` — **Navbar.tsx:1495**

L'array è renderizzato via `<MainMenu items={items} />` (riportato dal subagente attorno a Navbar.tsx:1775).

### D2.2 — Voci del menu View

Definite come array di oggetti `MenuEntry` in **Navbar.tsx:1396–1455**. Forma di una voce (tipo `MenuEntry`, definito a righe ~423–433):

```typescript
{
    name: string,
    function?: () => any,
    icon?: ReactNode,
    shortcutPills?: string[],
    subItems?: (MenuEntry|undefined|null)[],
    disabled?: boolean,
    // ...
}
```

Esempio concreto (Zoom-in, righe 1403–1408):

```typescript
{name: 'Zoom-in',
    function: () => performGraphZoom(metamodels, 'in'),
    icon: <i className="bi bi-zoom-in" />,
    shortcutPills: formatShortcutPills(SHORTCUTS.ZOOM_IN),
    disabled: isDashboard
}
```

Il rendering della singola voce avviene in `makeEntry()` (Navbar.tsx ~356–406): label + icona + eventuale chevron submenu / shortcut pills.

### D2.3 — Pattern toggle/checkable: **ESISTE GIÀ**

I toggle nel menu View usano il carattere checkmark Unicode `✓` (✓) appeso alla label quando attivi, e un'icona Bootstrap che cambia fill/outline. Esempi nel menu View:

| Voce | Riga | Stato letto da | Toggle handler |
|------|------|----------------|----------------|
| Show singleton instances | 1424–1428 | `useState` ← `localStorage['jjodel.showSingletons.${tab.id}']` (634–638) — **per-tab** | `toggleShowSingletons` (651–659) |
| Show edge labels | 1429–1434 | `useState` ← `localStorage['jjodel.showEdgeLabels']` (664–666) — **globale** | `toggleShowEdgeLabels` (667–674) |
| Show background | 1435–1440 | `useState` ← `localStorage['jjodel.showBackground']` (676–678) — **globale** | `toggleShowBackground` (679–686) |
| Show dot grid | 1441–1446 | `useState` ← `localStorage['jjodel.showGrid']` (688–690) — **globale** | `toggleGridVisible` (691–698) |
| Debug Mode | 1448–1454 | **Redux** `props.debug` | `SetRootFieldAction.new('debug', !props.debug)` dentro `TRANSACTION` (1450) |

**Meccanismo di comunicazione verso l'editor** (canonico per i toggle del canvas): l'handler nel Navbar scrive `localStorage` **e** dispatcha un `CustomEvent` tipizzato dal registry. Esempio `toggleShowEdgeLabels` (667–674):

```typescript
const next = !prev;
localStorage.setItem('jjodel.showEdgeLabels', String(next));
window.dispatchEvent(new CustomEvent(JjodelEvents.TOGGLE_EDGE_LABELS, { detail: { show: next } }));
```

Lato editor, `EditorV2.tsx` ha il proprio `useState` (mirror localStorage) **e** ascolta l'evento:
- listener registrati a **EditorV2.tsx:470–476** (`TOGGLE_GRID`, `TOGGLE_EDGE_LABELS`, `TOGGLE_BACKGROUND`) e **629** (`TOGGLE_SINGLETONS`).
- stati locali a EditorV2.tsx:458–461 (grid/edge labels), 605 (singletons).

Gli eventi sono nel registry `frontend/src/events/registry.ts`: `TOGGLE_SINGLETONS` (18), `TOGGLE_EDGE_LABELS` (19), `TOGGLE_BACKGROUND` (20), `TOGGLE_GRID` (21). **Non esiste** ancora un evento highlight; un nuovo `TOGGLE_HIGHLIGHT_MODE` andrebbe aggiunto qui (regola CLAUDE.md §8.6: no stringhe `'jjodel:...'` hardcoded).

**Nota di scope importante:** *nessuno* di questi toggle del menu View è persistito **nel file di progetto**. Sono o `localStorage` (browser-globale, oppure per-tab per i singleton) o un root field Redux (`debug`). Vedi §Finding chiave e D6.

---

## D3 — Rendering nodi ed edge v2-flow: punti di iniezione

### D3.1 — Componenti nodo

`nodeTypes` definito in **EditorV2.tsx:92–97**, passato a `<ReactFlow nodeTypes={nodeTypes} … />` (~EditorV2.tsx:3007):

```typescript
const nodeTypes: NodeTypes = {
    classNode: ClassNode,       // frontend/src/components/editor-v2/nodes/ClassNode.tsx
    enumNode: EnumNode,         // nodes/EnumNode.tsx
    packageNode: PackageNode,   // nodes/PackageNode.tsx
    objectNode: ObjectNode,     // nodes/ObjectNode.tsx  (M1: istanza di metaclasse)
};
```

`ClassNode` riceve i dati via `NodeProps<ClassNodeType>` → destruttura `{ id, data, selected }` (ClassNode.tsx:23). `data` è popolato in fase di assembly (vedi D3.3).

Shape `ClassNodeData` (`types.ts:64–73`): `label`, `isAbstract`, `isSingleton?`, `attributes`, `references?`, `operations?`, `jsxString?`, **`[key: string]: unknown`** (riga 72 — consente campi extra senza modificare l'interfaccia).

### D3.2 — Componenti edge

`edgeTypes` definito in **EditorV2.tsx:100–105**: tutti e 4 i tipi (`reference`, `inheritance`, `composition`, `instanceRef`) puntano a **`UnifiedEdge`** (`frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`).

`UnifiedEdge` riceve i dati via `EdgeProps` → `{ id, source, target, data, selected, label, type, … }` (UnifiedEdge.tsx:110–125). Shape dei `data` (`types.ts`):
- `ReferenceEdgeData` (116–122), `InheritanceEdgeData` (124–130) — M2;
- `CompositionEdgeData` (158–165), `InstanceReferenceEdgeData` (167–174) — M1.

Tutte e 4 hanno **`[key: string]: unknown`** (121, 129, 164, 173).

### D3.3 — Assembly nodes/edges (JjOM → RF) — CRITICAL ZONE, sola lettura

File: `frontend/src/components/editor-v2/utils/jjomTransformers.ts`.

- Batch: `transformJjomGraph(vertices, edges)` → `{ nodes, edges }` (**518–535**).
- Dispatch nodo: `jjomVertexToRFNode(vertex)` (~298–316) → instrada a `classVertexToRFNode` / `enumVertexToRFNode` / `packageVertexToRFNode` / `objectVertexToRFNode`.
- Nodo classe: `classVertexToRFNode(vertex)` (**38–128**); l'oggetto restituito (con `data`) è a **115–127**:

```typescript
return {
    id: vertex.id,            // ← id RF = id pointer JjOM (vedi D3.4)
    type: 'classNode',
    position: { x, y },
    data: { label, isAbstract, isSingleton, attributes, references, operations },
};
```

- Edge: `jjomEdgeToRFEdge(edge)` (**379–513**). Oggetti edge costruiti a: composition 407–420, instanceRef 423–435, reference M2 467–477, inheritance 480–491, fallback 494–512. Tutti `{ id: edge.id, source: startVertex.id, target: endVertex.id, type, data }`.

> CLAUDE.md §3.1/§3.3: `jjomTransformers.ts` è adiacente alla sync zone; `transformJjomGraph` è invocato da `useJjomSync.ts`. Iniettare qui significa che i flag si ricalcolano solo quando la sync ri-trasforma → vedi D3.5 per l'alternativa che evita la critical zone.

### D3.4 — Keying edge + adiacenza

- Edge id = `edge.id` (pointer dell'`DEdge` JjOM). `source`/`target` = **id dei nodi** = `vertex.id` (id pointer JjOM del vertice; per i nodi classe è l'id del `DClass`/vertice, per M1 l'id del `DObject`/vertice). Confermato: `classVertexToRFNode` ritorna `id: vertex.id` (riga 116) e `jjomEdgeToRFEdge` ritorna `source: startVertex.id`, `target: endVertex.id`.
- **Coerenza con i seed:** il click di selezione usa `node.id` come `elementId` (`selectElement(node.id, modelid)`, vedi D4). Quindi un seed set = `string[]` di `node.id` è coerente, stabile e persistibile.
- **Adiacenza a livello ReactFlow: NON esiste** una struttura precostruita (nessun `edgesByNode`). Per la chiusura 1-hop a render-time si filtra l'array `edges`:

```typescript
const incident = edges.filter(e => e.source === id || e.target === id);
const opposite = incident.map(e => (e.source === id ? e.target : e.source));
```

- **Adiacenza a livello JjOM (alternativa):** `DVertex.edgesIn` / `DVertex.edgesOut` esistono (joiner/classes.ts, inizializzati ~1042–1043, mantenuti ~1017–1018). Ma per il design «recompute a render-time» lo scan dell'array `edges` RF è la via più semplice e diretta.

### D3.5 — Punto di iniezione `dimmed`/`highlighted` (candidati)

Tre opzioni, in ordine di "lontananza dalla critical zone":

- **Opzione B (consigliata per allinearsi al design «recompute at render»): className calcolata a render-time** nei componenti `ClassNode`/`UnifiedEdge`, leggendo lo stato highlight da un context/store dedicato (o da `useStore` di ReactFlow). Pro: non tocca `jjomTransformers.ts`/sync, separazione pulita. Contro: serve plumbing di un context/selector che oggi non c'è (i componenti ricevono dati solo via `data`).
- **Opzione C (ibrida, anche valida): patch di `node.data`/`edge.data` via `setNodes`/`setEdges`** in un `useEffect` dell'editor che reagisce al cambio del seed set, **senza** passare dal transform. Sfrutta `[key: string]: unknown` (nessuna modifica alle interfacce). Evita la critical zone. Pro: aggiornamenti mirati. Contro: bisogna assicurare che la sync (`useJjomSync`) non sovrascriva i flag al successivo re-transform (interazione da verificare in Fase 2).
- **Opzione A (sconsigliata): iniezione in `data` dentro `jjomTransformers.ts`** (115–127 e i blocchi edge 407–512). Pro: un solo punto. Contro: è critical zone (§3.1/§3.3), e il transform è guidato dalla sync, non dal cambio di seed → richiederebbe far ri-fire la sync sul cambio di highlight, indesiderabile.

In tutte le opzioni, **non serve modificare le interfacce** `ClassNodeData`/`*EdgeData`: l'index signature `[key: string]: unknown` già ammette un campo `dimmed?: boolean` / `highlighted?: boolean` (conforme a CLAUDE.md §2/§4.2 — al più si aggiunge una optional property).

---

## D4 — Comportamento attuale del click su nodo

### D4.1 — Handler

- A livello `<ReactFlow>`: `onNodeClick={jjomSelection.onNodeClick}` — **EditorV2.tsx:3004**.
- Implementazione: `useJjomSelection.ts` → `onNodeClick` (**215–221**):

```typescript
const onNodeClick = useCallback((_event, node) => {
    _event.stopPropagation();
    if (isJjomMode && modelid) selectElement(node.id, modelid);
}, [isJjomMode, modelid]);
```

- `ClassNode.tsx` **non** ha un `onClick` di selezione a livello nodo; i suoi `onClick` interni (righe ~265, 299, 321, 354, 376, 398) riguardano solo l'editing inline dei campi.

### D4.2 — Cosa fa la selezione

`selectElement(elementId, modelid)` in `useJjomSelection.ts:96–137`:
1. **Anti-bounce** (105–106): `markCanvasUpdatedBatch(allIds)` su tutti i sub-element del grafo, così `useJjomSync` non ri-trasforma per un cambio di sola selezione.
2. **`TRANSACTION('EditorV2 select', …)`** (108–130): deseleziona gli altri sub-element (115–119), seleziona l'elemento cliccato (`lElement.select(DUser.current)`, 122), e aggiorna il root field `_lastSelected` (`SetRootFieldAction.new('_lastSelected', { node, view:'', modelElement })`, 125–129).
3. **Notifica viewpoint** (133): `notifyElementSelected(elementId)`.

Il pannello Properties (Info.tsx) reagisce separatamente a `_lastSelected.modelElement`, non direttamente nell'handler.

**Implicazione per il seed-toggle:** in highlight-mode ON, il branch più pulito è **dentro `onNodeClick` (useJjomSelection.ts:215–221)**: se il mode è ON → aggiungi/rimuovi `node.id` dal seed set (e *eventualmente* salta `selectElement` o lo si esegue comunque, decisione di UX da prendere in Fase 2); se OFF → comportamento attuale invariato. Attenzione: `onNodeClick` fa `stopPropagation()`, quindi il pane-click (deselect) non interferisce.

---

## D5 — Concetti di highlight/selezione preesistenti (anti-collisione)

Esistono già pattern riutilizzabili/parziali; nessuno è un "highlight mode" generico per articolo. Da **evitare** i seguenti nomi già in uso (lista deduplicata; CLAUDE.md §4.3):

**Classi CSS / className già usate (editor-v2):**
- `.selected` — selezione nativa ReactFlow; EditorV2.scss (molteplici: 1193, 1210, 1396, 1418, 1510, 1749, 1844, …) + vari `.tsx`.
- `.highlighted` — usata per la navigazione da tastiera nel dropdown `InlineTypeSelect` (InlineTypeSelect.tsx:121,135; EditorV2.scss:1746). **Nome già occupato.**
- `.active` — stato UI toolbar/dropdown (EditorV2.scss:286,291,365,…; ColorSchemeSelector usa `active`, vedi 123/155/179).
- `.drop-target` — target drag-over (ClassNode.tsx:246, EnumNode/ObjectNode, EditorV2.scss).
- `.abstract`, `.singleton` — stile tipo-nodo (ClassNode.tsx:246, EditorV2.scss:1364/1374).
- `.mm-object--orphan`, `.mm-object--problem-highlighted` — overlay problemi M1 (ObjectNode.tsx:340; NodeProblemIndicator.scss). **`problem-highlighted` è un concetto di "highlight" già esistente ma dedicato ai problemi**, da non confondere/riusare.
- prefissi `.mm-node__*`, `.mm-field__*` — struttura interna nodi.

**Identificatori JS già usati:**
- `selected` (prop NodeProps), `highlighted` (state in InlineTypeSelect.tsx:17), `isProblemHighlighted` / `useIsHighlighted()` (useNodeProblems.ts:26 — sistema "problem" M1), `isSelected` (flag D-object), `dragOver` (ClassNode.tsx).

**Variabili CSS token già usate** (non riusare con altro significato): `--accent-muted`, `--text-muted`, `--text-dim`, `--color-accent`, `--surface-hover`, `--accent-subtle`, `--field-row-hover`.

**Nomi suggeriti non collidenti** (da validare con grep globale prima dell'uso in Fase 2, regola §4.3): prefisso `hl-` → `.hl-seed`, `.hl-neighbor`, `.hl-dimmed`; eventuale classe editor-wide `.highlight-mode` sul div root (EditorV2.tsx:3077, accanto a `scheme-*`/`show-edge-labels`). Verificare che `.highlight-mode`/`hl-*` non collidano (al momento liberi nei file letti; grep da rifare in Fase 2).

---

## D6 — VersionFixer e template di persistenza nel progetto

La condizione letterale di D6 («solo se il tema persiste con un meccanismo che ha richiesto una migrazione») **non si verifica**: il tema è `localStorage`-only, niente migrazione. Tuttavia il punto è centrale per la feature, perché il **seed set va persistito nel progetto** → serve un campo D + migrazione `VersionFixer`. Riporto quindi i template realmente rilevanti.

File: `frontend/src/redux/VersionFixer.tsx`.

- **Versione più alta corrente: `2.218`** — metodo `private ['2.217 -> 2.218']` a **riga 804** (popola `DObject.initialName`). `highestVersion` è derivato automaticamente dai nomi-metodo (CLAUDE.md §3.9), quindi una nuova migrazione sarebbe **`2.218 -> 2.219`**.
- Migrazioni recenti rilevanti come **template**:
  - **`2.214 -> 2.215`** (righe **695–708**) — aggiunge il campo scalare additivo `edgeRouting` su **`DViewElement` / `DViewPoint`** (default `'manhattan-rounded'`). Template per un **campo per-view**.
  - **`2.215 -> 2.216`** (righe **715–763**) — introduce `DProject.expandedTreeNodes`, un **`string[]` di id** (sezioni sintetiche + id di metamodelli/package/classi/modelli), idempotente (skip se già array). **È il template più vicino al seed set** (array di id di elementi su un'entità persistita).
  - `2.216 -> 2.217` (769–795) — campi layout su `DProject`. `2.217 -> 2.218` (804–829) — `initialName`.

**Forma del pattern di migrazione** (da `2.215 -> 2.216`): iterare `s.idlookup`, filtrare per `e.className` dell'entità host, **skip idempotente** se il campo è già presente, altrimenti seedare il default; loggare il conteggio.

**Decisione di scope da prendere in Fase 2** (vedi Sintesi): host del campo seed = `DProject` (uno-set-per-progetto, shape identica a `expandedTreeNodes`) **oppure** `DViewElement`/`DViewPoint` (uno-set-per-view, scope identico a `edgeRouting`). La feature è pensata per figure d'articolo di un diagramma specifico → per-view è semanticamente più corretto, ma per-project è più semplice. Non risolvibile in sola lettura senza chiarire quale entità rappresenti "il diagramma corrente" nel v2-flow (vedi §Incertezze).

---

## Sintesi per la Fase 2 (decisioni aperte)

1. **Persistenza spezzata in due meccanismi** (conferma del Finding chiave):
   - on/off del mode → pattern toggle ephemeral del menu View (`localStorage` + `CustomEvent` via registry). NON nel file di progetto. *Oppure* lo si rende persistente anch'esso, ma allora va sul campo D (vedi sotto).
   - seed set → campo D + migrazione `VersionFixer 2.218 -> 2.219`, shape `string[]` di `node.id`, template `DProject.expandedTreeNodes`.
2. **Scope del seed set:** `DProject` (semplice) vs `DViewElement`/`DViewPoint` (per-view, semanticamente coerente con figure d'articolo). **Decisione richiesta.**
3. **Punto di iniezione del flag visivo:** Opzione B (className a render-time da context/store) o C (patch `node.data`/`edge.data` via `setNodes`/`setEdges` su effect), entrambe fuori dalla critical zone. Opzione A (transform) sconsigliata.
4. **Chiusura 1-hop:** ricalcolo a render-time scandendo l'array `edges` RF (`source`/`target` = `node.id`); nessuna struttura di adiacenza RF preesistente da riusare.
5. **Click-to-seed:** branch in `useJjomSelection.onNodeClick` (215–221) gated su mode ON; OFF = comportamento attuale invariato. UX da definire: il seed-click deve anche selezionare (Properties) o solo seedare?
6. **Naming anti-collisione:** evitare `.highlighted`/`.selected`/`.active`/`problem-highlighted`; usare prefisso `hl-` (grep di conferma in Fase 2). Nuovo evento `TOGGLE_HIGHLIGHT_MODE` nel registry (`events/registry.ts`), no stringa hardcoded.

---

## Incertezze / non verificato in questa sessione

- **Cablaggio prop `onColorSchemeChange` / montaggio `ColorSchemeSelector`** in `EditorV2.tsx` (~3100) e `EditorV2.tsx:3004/3007` (props `<ReactFlow>`): riportati dal subagente, righe esatte non rilette una-a-una qui. La sostanza (localStorage-only, listener TOGGLE_*) è invece verificata direttamente da me su EditorV2.tsx:458–476, 605–631, 688–696, 3077.
- **Quale entità D rappresenta "il diagramma/view corrente" nel v2-flow** (per scegliere l'host del seed set tra `DViewElement`/`DViewPoint`/`DGraph`/`DProject`): non risolto in sola lettura. `edgeRouting` vive su `DViewElement`/`DViewPoint`; va confermato in Fase 2 quale di questi è 1:1 col diagramma aperto.
- **Interazione patch-flag ↔ re-transform della sync** (Opzione C): da verificare che `useJjomSync` non azzeri i flag `dimmed`/`highlighted` al successivo re-transform (l'anti-bounce `markCanvasUpdatedBatch` suggerisce che la sync può ri-trasformare su cambi di stato; comportamento da accertare in Fase 2).
- I numeri di riga sono snapshot al 2026-05-29 sul branch `alfonso-frontend-jjtl`.

---

## HARD STOP

Discovery completata. Nessuna modifica al codice, nessuna implementazione avviata. In attesa di analisi in chat per la Fase 2.

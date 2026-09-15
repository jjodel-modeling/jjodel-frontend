# Discovery (READ-ONLY) — Persisting ghost-target chip offset on the D-layer

**Tipo**: discovery read-only, hard stop. Nessuna modifica al codice.
**Branch**: `alfonso-frontend-jjtl`
**Data**: 2026-06-04
**Scope**: raccogliere i fatti per progettare la persistenza dell'offset di drag del ghost-target chip sul D-layer (sul `DVertex` sorgente, keyed per `refId`). L'implementazione è oggetto di un prompt separato.
**Decisione già presa (non riaperta qui)**: persistere su `DVertex` sorgente, keyed per `refId`, mirror di `DVertex.x/y`.

> Riferimenti ancorati per **nome di simbolo** (i numeri di riga sono indicativi, verificati in sessione e citati come comodità).

---

## D1 — Schema `DVertex` e pattern dei campi persistiti

**Classe e dichiarazione.** Il vertice del canvas è `DVertex extends DGraphElement`, dichiarata in `model/dataStructure/GraphDataElements.tsx` (`export class DVertex` ~:1663). I campi coordinate/size sono **plain class fields**, senza decoratori per-campo:

```ts
// GraphDataElements.tsx — class DVertex
x!: number;
y!: number;
w!: number;
h!: number;
isResized!: boolean;
zoom!: GraphPoint;          // <-- campo OGGETTO
snap?: GraphPoint;          // <-- campo OGGETTO opzionale
subElements!: Pointer<DGraphElement, 0, 'N', LGraphElement>;   // array (di pointer)
isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;   // dictionary string-keyed
```

**Esistono campi persistiti il cui tipo è oggetto/array (non primitivo, non pointer)?** Sì, più d'uno ed è idiomatico:
- `zoom!: GraphPoint` e `snap?: GraphPoint` su `DVertex` — `GraphPoint` è un oggetto `{x, y}`.
- `grid?: {x?: number, y?: number, type?: "polar"|"cartesian", "center"?: TLCoord, visible?: boolean}` sulla sibling `DGraphVertex` (`GraphDataElements.tsx` ~:1757) — **inline object literal** dichiarato direttamente come campo persistito. È l'esempio più pulito di "campo oggetto dichiarato e salvato as-is".
- `isSelected!: Dictionary<...>` — un campo **dizionario string-keyed** (stessa forma di un `Record<string, {dx,dy}>`); nota però che `isSelected` viene azzerato in fase di save (vedi D2), quindi non è un esempio di "persistito as-is".

**Implicazione**: un campo `Record<string, {dx: number; dy: number}>` (es. `ghostOffsets`) su `DVertex` è **idiomatico** — `grid` e `zoom`/`snap` dimostrano che oggetti dichiarati direttamente come campi vengono serializzati senza wiring extra. Non serve ripiegare su una stringa JSON.

---

## D2 — Round-trip di serializzazione

**Meccanismo.** La serializzazione di un D-field è **automatica**: qualunque proprietà dichiarata sull'oggetto D in `idlookup` finisce nel salvataggio, senza registry/whitelist/decoratore di opt-in.

- Save: `U.compressedState(dproject)` (`common/U.tsx` ~:427) fa `const state = {...store.getState()}`, poi copia **wholesale** ogni entry di `idlookup` (`idlookup[pointer] = object`), saltando solo gli altri `DProject` e azzerando `isSelected`, e infine `JSON.stringify(state)`. **Nessun filtro per campo.**
- Load: `LoadAction` reducer (`redux/reducer/reducer.ts`, `case LoadAction.type` ~:517) fa `newState = action.value` — **replace integrale** dello state.

**Prova per precedente**: `x`/`y`/`w`/`h` sono semplici `number` dichiarati, senza registrazione, e **sopravvivono al reload** (le posizioni dei nodi persistono). Lo stesso path serializza un nuovo campo `ghostOffsets` scritto via `SetFieldAction` sul `DVertez.__raw` (entra in `idlookup` → entra nel JSON → ripristinato dal `LoadAction`).

**Campi NON persistiti — come si fa (per contrasto)**: i dati transient sono tenuti **fuori** dai campi del D-object, in uno store separato `transientProperties`. Su `DGraphElement` (`GraphDataElements.tsx` ~:201-209) `transient!: NodeTransientProperties` è un **getter** (`get_transient(c) { return transientProperties.node[c.data.id] || {}; }`) e `set_transient` lancia `cannotSet('transient')`. Cioè: per rendere qualcosa non-persistente lo si instrada in `transientProperties`, non come campo dichiarato.

**Conclusione D2**: aggiungere un campo dichiarato su `DVertex` è **sufficiente** perché sopravviva al reload. Nessun wiring aggiuntivo. (L'unica ragione per cui `AnchorConfig` e l'offset attuale NON persistono è che vivono in React state / non sono mai scritti sul D-layer, non perché manchi un opt-in.)

---

## D3 — `VersionFixer`: `highestVersion` corrente e forma della migration

**Versione corrente.** L'ultimo metodo di migrazione è **`'2.217 -> 2.218'`** (`redux/VersionFixer.tsx` ~:804; la classe si chiude subito dopo, ~:831 — nessun metodo successivo). Quindi `highestVersion = 2.218`. La prossima sarebbe **`'2.218 -> 2.219'`**.

**Auto-derivazione.** `VersionFixer.setup()` (~:80) itera `Object.getOwnPropertyNames(VersionFixer.prototype)`, fa `[from,to] = k.split(' -> ')` e setta `highestVersion = Math.max(highestVersion, to)`, registrando `versionAdapters[from] = {n:to, f}`. **Nessuna costante separata da bumpare**: basta aggiungere il metodo.

**`update()` (~:105)** scorre la catena da `s.version.n` finché `currVer !== highestVersion`, e **fa `Log.exDev` se manca un adapter consecutivo** ("missing version adapter"). Quindi un metodo per ogni gradino DEVE esistere; non si può saltare un numero.

**Serve iterare le istanze `DVertex` o basta il bump?** Per un campo **nuovo, opzionale, con default `undefined`/vuoto**: **basta il bump** (`return s` no-op). Motivo: un campo assente su un vertice esistente si legge come `undefined`, e il consumer (ClassNode) defaulta a `{}` (vedi D5/D7). Le due migration recenti **iterano** (`'2.216 -> 2.217'` semina `layoutPropertyPanelWidth=400` ecc.; `'2.217 -> 2.218'` calcola `initialName`) **solo perché vogliono un default concreto non-undefined**. Qui il default desiderato È l'assenza/`{}`, quindi:

```ts
// forma minima sufficiente (proposta, NON implementare ora)
private ['2.218 -> 2.219'](s: DState): DState { return s; }
```

Nota: la coda di `update()` che ricompila i default view (`if (cn === 'DViewElement' && v.version !== highestVersion) LViewElement.updateDefaultView(...)`, ~:131-139) riguarda solo i `DViewElement`/jsxString — **irrilevante** per un campo numerico/oggetto su `DVertex`. Nessun bump di `version` per-istanza richiesto sui vertici.

---

## D4 — Lifecycle di drag in `ClassNode` (dove scrivere su drag-end)

**Handler.** In `components/editor-v2/nodes/ClassNode.tsx`, il blocco "Ghost-target drag" (~:62-100). Componente: `function ClassNode({ id, data, selected, width, height }: NodeProps<ClassNodeType>)` (~:30) — **`id` è l'id del nodo RF, 1:1 con l'id del `DVertex` sorgente** (lo conferma `classVertexToRFNode`, che setta `id: vertex.id`, vedi D6).

- **down** `onGhostPointerDown(e, refName)` (~:70): `stopPropagation`, `setPointerCapture`, salva in `ghostDragRef.current = { refName, startX, startY, baseDx, baseDy }`.
- **move** `onGhostPointerMove(e)` (~:77): `dx = baseDx + (clientX - startX)/zoom`, `dy = baseDy + (clientY - startY)/zoom` (zoom da `getViewport().zoom`), `setGhostOffsets(prev => ({...prev, [d.refName]: {dx, dy}}))`.
- **up (DRAG-END)** `onGhostPointerUp(e)` (~:86):

```ts
const onGhostPointerUp = useCallback((e: React.PointerEvent) => {
    if (!ghostDragRef.current) return;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    ghostDragRef.current = null;
}, []);
```

Questo è il **punto unico** dove iniettare la write di persistenza (`SetFieldAction` sul `DVertex` `id`). Nota di design per il prompt successivo: l'handler oggi azzera `ghostDragRef.current` **prima** di usarlo; per scrivere occorre leggere `const d = ghostDragRef.current; const off = ghostOffsets[d.refName]` **prima** del null-out, e mappare `refName → refId` (il `refId` arriva via `GhostTargetInfo`, vedi D6). Il valore finale dell'offset è già in `ghostOffsets[refName]` (aggiornato durante il move). La write dovrebbe specchiare `syncPositionToJjom` (`sync/canvasToJjom.ts` ~:42): `TRANSACTION(...) { SetFieldAction.new(vertexId, 'ghostOffsets', map, undefined, false) }`.

**Reset.** `onGhostReset(refName)` (~:93, su double-click) elimina la chiave da `ghostOffsets`. Per la persistenza, anche il reset dovrà scrivere il D-layer (rimuovere la chiave `refId` dalla mappa salvata) — segnalato come secondo write-site.

**`id` disponibile nell'handler**: sì, `id` è prop di `ClassNode` e in scope in tutti gli handler (closure component-level).

---

## D5 — Lettura dell'offset al mount

**Come `ClassNode` accede oggi ai dati derivati dal `DVertex`.** **Solo `props.data` e `props.id`** (più gli hook RF `useReactFlow`/`getViewport` e i context `useEditorContextSafe`/`useNodeHighlightClass`). Gli import di `ClassNode.tsx` (~:1-17) **non** includono `joiner`/`LPointerTargetable`/`fromPointer`; grep in file conferma **zero** occorrenze di `LPointerTargetable`/`fromPointer`/`__raw`. `ClassNode` **non risolve mai un L-proxy dal node id**: legge tutto da `props.data` (label, attributes, references, ghostParents, ghostTargets) e le coordinate arrivano già risolte come `position` del nodo RF (calcolate in `classVertexToRFNode` da `raw.x/raw.y`).

**Confronto path**:
- **(a) L-proxy in `ClassNode`** (`LPointerTargetable.fromPointer(id)` → leggere `ghostOffsets`): introdurrebbe in `ClassNode` un pattern **nuovo** (import `joiner`, accesso proxy) che oggi non esiste, ed esporrebbe alla gotcha nota del L-proxy ("getter ritorna `{}` quando stale") che `jjomTransformers` evita di proposito usando `vertex.__raw`. Meno idiomatico, più fragile.
- **(b) Pass-through via `data`**: `classVertexToRFNode` legge il nuovo campo dal `raw` (stesso identico pattern di `const raw = vertex.__raw ?? vertex; const x = raw.x` ~:146-148) e lo veicola in `data` (es. attaccando l'offset salvato a ciascun `GhostTargetInfo`, già costruito per-ref con `ref.id` disponibile). `ClassNode` lo legge da `props.data` come fa per tutto il resto.

**Raccomandazione D5**: **path (b)**. È coerente con il modo in cui `ClassNode` consuma esclusivamente `props.data`, specchia esattamente il path già usato per `x/y` e `ghostTargets`, e tiene la lettura del `__raw` confinata in `jjomTransformers` (dove la gotcha del proxy è già gestita). Il bridging `refId ↔ refName` è gratuito: al transform site sono disponibili sia `ref.id` sia `ref.name`.

---

## D6 — `GhostTargetInfo` e disponibilità di `ref.id`

**`ref.id` al construction site.** In `classVertexToRFNode` (`jjomTransformers.ts`), il loop dei ghost target (~:126-142) itera `lClass.references` e usa `ref.name`, `ref.lowerBound`, `ref.type` ecc. Lo **stesso** `ref.id` è già letto poco sopra, nello stesso file e dalla stessa collezione `lClass.references`, nel mapping delle reference: `id: ref.id ?? \`ref_${refs.length}\`` (~:70). Quindi `ref.id` è **stabile e disponibile** al punto di costruzione di `GhostTargetInfo`: aggiungere `refId: ref.id` è una **lettura puramente additiva**.

**Forma attuale di `GhostTargetInfo`** (`components/editor-v2/types.ts` ~:72-78): `{ refName, targetName, targetMetamodel, cardinality, targetFullname }` — **nessun `id`** (mentre `GhostParentInfo` ~:64-69 ha `id`). `ClassNodeData.ghostTargets?: GhostTargetInfo[]` è opzionale (~:90).

**Sicurezza dell'aggiunta.** È un'interfaccia TS con tipizzazione strutturale: aggiungere un campo **opzionale** (`refId?: string`) o anche obbligatorio non rompe i consumer esistenti, che leggono i campi correnti. I consumer di `GhostTargetInfo` sono il construction site (`jjomTransformers`) e il rendering in `ClassNode` (mappa `ghostTargets`, usa `gt.refName/targetName/targetMetamodel/cardinality`); nessuno fa un check esaustivo della shape (no `Object.keys` length-check, no switch esaustivo). Aggiunta **safe**.

---

## D7 — Profilo di re-render di `ClassNode` / rischio loop

**Memoization.** `ClassNode` è `export default ClassNode` (~:724), **NON** wrappato in `React.memo`; registrato come `classNode: ClassNode` in `EditorV2.tsx` (~:95). ReactFlow re-renderizza il nodo quando cambiano `data`, `selected`, `position`, dimensioni.

**Cosa guida i re-render**:
- `props.data` cambia ad ogni re-transform di `useJjomSync` → `setNodes` (qualunque mutazione di modello/grafo rigenera gli oggetti nodo, quindi `data`, inclusi `ghostTargets`).
- `selected`, `width`/`height` da RF.
- useState locali: `editing`, `name`, `dragOver`, `editingField`, `editValue`, **`ghostOffsets`**, `ghostOriginY`, `ghostChipSize`.

**Stato dell'offset oggi**: `const [ghostOffsets, setGhostOffsets] = useState<Record<string,{dx,dy}>>({})` (~:67) — inizializzato a `{}` e **mutato solo dagli handler di drag**. **Non esiste alcun `useEffect` che ri-sincronizzi `ghostOffsets` da `data`.** Quindi oggi nessun clobber.

**Rischio loop con la persistenza (path b)**: una write su drag-end (`SetFieldAction` sul `DVertex`) → update Redux → re-transform `useJjomSync` → nuovo `data` con l'offset aggiornato → re-render di `ClassNode`. Il pericolo si materializza **solo se** si aggiunge un `useEffect([data...])` (o un initializer non-lazy) che ri-legge l'offset da `data` ad ogni render, sovrascrivendo uno stato di drag in corso o appena concluso.

**Mitigazione di design (proposta, non implementare)**:
- inizializzare `ghostOffsets` **una sola volta al mount** con il lazy initializer di `useState` (`useState(() => buildFromData(data.ghostTargets))`), NON con un effect che rifà il sync ad ogni cambio di `data`;
- la write di drag-end è idempotente rispetto al re-render successivo (il nuovo `data` porta lo stesso offset appena scritto), e poiché il lazy initializer gira solo al mount, il re-render non resetta lo stato;
- esiste già nel file un precedente per "distinguere le nostre write da quelle esterne": `lastCommittedName = useRef(data.label)` (~:52) per il rename. Uno schema analogo (ref-guard) è disponibile se in futuro servisse, ma con l'init-once non è necessario per gli offset.

**Nota write semantics**: la write dovrebbe specchiare `x/y` (`SetFieldAction.new(id, 'ghostOffsets', map, undefined, false)` dentro una `TRANSACTION`, come `syncPositionToJjom`). L'ultimo argomento `false` è lo stesso usato per `x/y` in `canvasToJjom.ts` (~:45-46).

---

## Recommendation

Tre punti, come da richiesta (solo proposte, nessun codice di implementazione):

1. **Tipo del campo su `DVertex`: oggetto annidato `Record<string, {dx: number; dy: number}>`**, NON stringa JSON. Ragione (D1/D2): campi oggetto dichiarati sono già idiomatici e persistono nativamente — `grid?: {...}` su `DGraphVertex` e `zoom/snap: GraphPoint` su `DVertex` sono precedenti diretti; la serializzazione è automatica per qualunque campo dichiarato (`compressedState` copia gli oggetti `idlookup` wholesale, `LoadAction` fa replace integrale), provata da `x/y`. Una stringa JSON aggiungerebbe encode/decode manuale senza alcun beneficio. Chiave della mappa = **`refId`** (decisione presa; sopravvive al rename, a differenza di `refName`).

2. **Read path al mount: (b) attraverso `data`**, non L-proxy in `ClassNode`. Ragione (D5): `ClassNode` consuma esclusivamente `props.data`/`props.id` e non risolve mai L-proxy; `classVertexToRFNode` legge già `vertex.__raw` per `x/y` (gestendo la gotcha del proxy stale) ed è il posto naturale per leggere `raw.ghostOffsets` e veicolarlo in `data` (attaccando `refId` + offset a ciascun `GhostTargetInfo`, additivo e safe per D6). Path (a) introdurrebbe un pattern proxy nuovo e fragile in `ClassNode`.

3. **Migration shape: bump-only (`'2.218 -> 2.219'` con `return s`)**, NON iterate-and-init. Ragione (D3): `highestVersion` corrente è 2.218; serve un metodo per il gradino successivo (la catena di `update()` fallisce se manca un adapter consecutivo), ma il default desiderato del nuovo campo è l'assenza (`undefined` → `{}` lato consumer), quindi non occorre seminare le istanze `DVertex` esistenti. Le migration recenti iterano solo perché volevano default concreti non-undefined; qui non è il caso.

---

## Appendice — File toccati

Solo questo report (`docs/discovery/2026-06-04_ghost_offset_persistence_discovery.md`) e l'entry in `docs/claude-code-log.md`. **Nessun file di codice è stato modificato.**

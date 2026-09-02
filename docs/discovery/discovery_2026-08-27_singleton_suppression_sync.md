# Discovery — coerenza della soppressione dei singleton nel sync (fronte β, Fase 1)

**Data**: 2026-08-27
**Branch**: `alfonso-frontend-jjtl`, HEAD `73aef31c9`
**Fase**: 1 di un two-phase. Read-only: nessun file di prodotto toccato, nessun `git add`.
**Prompt**: `docs/prompts/claude_2026-08-27_1220_prompt_singleton_discovery_beta.md` (2026-08-27 12:20)
**Ratifiche**: R-SGL-2, R-SGL-9(g), R-SGL-10(6)
**Precedente**: `docs/discovery/discovery_2026-08-26_singleton_reference_select.md` §6 (D5) e §9. Citato, non riscritto.

---

## 0. Ipotesi da falsificare, e l'esito

Il prompt consegna cinque difetti come fatti e chiede di spiegarli. Quattro reggono. **Uno no**, e
la sua caduta cambia il disegno:

> «React Flow scarta in silenzio gli archi il cui nodo target sparisce.»

**Falso.** React Flow non scarta niente: l'arco resta in `edges`, resta nello store, e smette solo
di essere disegnato. La misura «archi RF da 9 a 7» è quindi un conteggio del **DOM**, non dello
stato. Se lo stato non perde gli archi, allora al `show` quei due archi **devono tornare da soli**,
e la riga del prompt «l'arco scartato da RF non torna perché la cache lo crede presente» descrive
un meccanismo che non c'è. §3.3.

Ne segue un secondo esito, più scomodo: il caso 2 (arco creato mentre il target è nascosto) **non è
spiegato** da nessun percorso che ho letto. Tutti e tre i cancelli che potrebbero fermarlo lo
lasciano passare. §3.4.4. Non progetto la Fase 2 su un meccanismo che non ho trovato: §9, Q1, con la
sonda che lo chiude in una riga.

> **Natura delle misure.** Lettura statica del sorgente e del bundle di `@xyflow/react` in
> `node_modules`, più ricerche con exit status ed elenco del comando. Nessuno scenario eseguito nel
> browser: le misure del 26/8 sera sono di Alfonso, citate come sue.

---

## 1. Obiettivo

Spiegare i cinque difetti, pesare i tre disegni di §4 del prompt, raccomandarne uno, e abbozzare il
Layer Impact Report della Fase 2.

---

## 2. File letti (path completi)

Prodotto:

- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (225-275, 430-445, 655-680, 755-775, 826-845, 915-935, 1167-1250, 1244-1345, 1440-1470, 1530-1588)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` (intero, 199 righe)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/hooks/useClassRemoval.ts` (221-280)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/syncState.ts` (150-179)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx` (368-372, 445-495, 628-700, 714-866, 1262, 4070-4100)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/utils/jjomTransformers.ts` (480-500)
- `/Users/alfonso/jjodel/frontend/src/pages/components/Navbar.tsx` (639-664, 1486)

Libreria, per D3:

- `/Users/alfonso/jjodel/frontend/node_modules/@xyflow/react/dist/esm/index.js` (2288-2325, 2716-2724, 2800-2860) — versione **12.10.2**, da `node_modules/@xyflow/react/package.json`; `package.json` del progetto dichiara `^12.10.0`
- `/Users/alfonso/jjodel/frontend/node_modules/@xyflow/system/dist/esm/index.js` (15, `error008`)

Documentazione: `CLAUDE.md`; `docs/decisions.md` (R-SGL, R-RAIL-28, R-RAIL-31); `docs/claude-code-log.md` (coda);
`docs/discovery/discovery_2026-08-26_singleton_reference_select.md` §6 e §9; `docs/benchmarks/README.md` e
`docs/benchmarks/2026-07-19_baseline_m3_run1.json`.

---

## 3. Findings per domanda

### 3.1 D1 — Il mount (difetto 4): **non è una race, è un'omissione**

L'ordine c'è, ed è quello che il prompt ipotizza: `useJjomSync` è chiamato a `EditorV2.tsx:461`,
quindi i suoi quattro effetti (`:436` Step 4, `:1167` init, `:1244` incrementale, `:1573` cleanup)
sono **registrati prima** dell'effetto del toggle, dichiarato a `EditorV2.tsx:714`; React esegue gli
effetti nell'ordine di dichiarazione.

**Ma l'ordine non conta**, perché il blocco di soppressione al mount non tocca lo stato RF. Righe
`EditorV2.tsx:836-859`, per intero nella parte che agisce:

```ts
const initialShow = localStorage.getItem(`jjodel.showSingletons.${modelid}`) === 'true';
if (!initialShow) {
    ...
    for (const seId of subElements) {
        ...
        if (dClass?.isSingleton) {
            suppressSingleton(seId);
        }
    }
}
```

Nessun `setNodes`. Il blocco **popola il Set e basta**: i nodi che l'init ha già messo in RF restano
a schermo qualunque sia l'ordine, e i nodi che l'init non ha ancora messo verranno filtrati a
`:1204`. Non è una condizione di corsa da vincere: è un ramo che non ha mai avuto il pezzo che
serviva. Osservabile solo quando l'init arriva prima, che è il caso comune (entrambi gli effetti
sono guardati da `graphId` e diventano eseguibili nello stesso commit, dove vince l'ordine di
dichiarazione).

Lo scenario in cui **non** si vede: `isModelMode` (da `useEditorMode`, calcolato a `:493`, cioè
**dopo** la chiamata al hook) è falso nel commit in cui `graphId` arriva. L'effetto del toggle esce
subito (`:715`, `if (!isJjomMode || !graphId || !isModelMode) return;`) e rientra a un commit
successivo, quando l'init ha già finito — stesso esito. Non ho trovato un percorso in cui il Set sia
popolato prima del primo `setNodes` dell'init.

**Il Set è globale e il cleanup lo svuota tutto.** `syncState.ts:159`, `const suppressedSingletonIds
= new Set<string>();` — un solo Set di modulo, nessuna chiave di modello. Il cleanup a
`EditorV2.tsx:862-865` chiama `clearSuppressedSingletons()`, e le deps sono
`[isJjomMode, graphId, isModelMode, modelid, setNodes, getNodes]`. Con **due editor montati insieme**
(modalità split, o due tab modello vive contemporaneamente) il rimontaggio o il cambio di deps di uno
azzera anche le soppressioni dell'altro, che da quel momento mostra i suoi singleton finché qualcosa
non rifà il giro. In sequenza (una tab chiusa, poi l'altra aperta) il danno non si vede, perché il Set
viene ripopolato dal blocco di mount della tab nuova — ma solo per i vertici già in `subElements`.

### 3.2 D2 — Cosa sa la cache dopo `hide`

Il ramo `hide` (`EditorV2.tsx:811-833`) fa `suppressSingleton(vid)` e
`setNodes(nds => nds.filter(...))`. Non tocca `rfNodeCache`, `rfEdgeCache`, `prevSubElementsRef`, e
non fa `setEdges`. Conseguenze, una per una:

**(a) `show` rimette i nodi, gli archi no.** Il ramo `show` (`:734-810`) reidrata i nodi con
`jjomVertexToRFNode` + `setNodes`; degli archi non parla. **Ma** — vedi §3.3 — gli archi non sono
mai usciti dallo stato RF, quindi tornano visibili da soli quando il nodo rientra. La conseguenza
(a) come formulata dal prompt **non si verifica**: da chiarire con la sonda di §9 Q1.

**(b) cancellazione a D-layer di un arco incidente mentre è nascosto** — innocua. L'arco esce da
`subElements`, il ramo rimozioni a `:1331-1336` fa `rfEdgeCache.current.delete(id)` → `removedEdgeIds`
→ il filtro a `:1517` opera su un arco che **è** ancora in `edges` (§3.3), quindi lo toglie davvero.
Nessuno stato sporco.

**(c) spostamento del vertice nascosto** (da JjScript, non da UI) — innocua ma inerte. `patchedNodePositions`
finisce nella patch che a `:1460-1470` fa `prev.map(...)` sullo stato RF: il nodo non c'è, il map non
lo trova, la patch si perde. Al `show` il nodo viene ricostruito da `jjomVertexToRFNode`, che legge
la geometria dal D-layer: la posizione nuova arriva comunque. **Sporca la cache**, però:
`rfNodeCache` conserva il nodo con la posizione vecchia fino al `show`, che lo sovrascrive.

**(d) anti-bounce.** `isCanvasUpdated(id)` a `:1339` salta le proprietà degli elementi marcati; è per
i drag e non interagisce con la soppressione.

**Riassunto**: l'unico stato realmente incoerente dopo `hide` è `rfNodeCache`, che tiene nodi non
renderizzati. Non produce un difetto osservabile perché ogni percorso che li rilegge passa dal
D-layer. La cache degli archi non diverge affatto, perché gli archi non escono da RF.

### 3.3 D3 — Cosa fa React Flow con un arco senza nodo: **lo rende invisibile, non lo rimuove**

Tre punti, in `@xyflow/react@12.10.2`, `dist/esm/index.js`:

**(1) Quali archi arrivano al renderer** — `useVisibleEdgeIds` (`:2295-2320`):

```js
function useVisibleEdgeIds(onlyRenderVisible) {
    const edgeIds = useStore(useCallback((s) => {
        if (!onlyRenderVisible) {
            return s.edges.map((edge) => edge.id);
        }
        ...
```

Con `onlyRenderVisibleElements` non impostata — e **non lo è**: `command grep -rn
"onlyRenderVisibleElements" frontend/src` esce 1, controllo positivo `<ReactFlow` presente a
`EditorV2.tsx:4070` — il ramo preso è il primo: **tutti** gli id, endpoint mancanti compresi.

**(2) Perché la console tace** — il selettore di posizione di `EdgeWrapper` (`:2818-2825`):

```js
const sourceNode = store.nodeLookup.get(edge.source);
const targetNode = store.nodeLookup.get(edge.target);
if (!sourceNode || !targetNode) {
    return { zIndex: edge.zIndex, ...nullPosition };
}
```

Ritorno secco, **nessun `onError`**. `error008` («Couldn't create edge for … handle id») vive in
`@xyflow/system/dist/esm/index.js:15` ed è emesso da `getEdgePosition` per un **handle** mancante,
non per un nodo mancante: qui `getEdgePosition` non viene nemmeno chiamato. Il silenzio è per
costruzione.

**(3) Perché sparisce dal DOM** — `EdgeWrapper` (`:2851-2853`):

```js
if (edge.hidden || sourceX === null || sourceY === null || targetX === null || targetY === null) {
    return null;
}
```

`nullPosition` (`:2716-2723`) ha tutte le coordinate a `null`, quindi il componente non rende nulla.
Il componente d'arco custom non viene mai invocato: il `return null` è a monte.

**Conclusione**: l'arco resta in `edges` (che è React state, `useEdgesState` a `EditorV2.tsx:370`) e
nello store; sparisce solo il suo elemento DOM. Quindi:

- la misura «9 → 7» è un conteggio di `.react-flow__edge` nel DOM, non di `getEdges()`;
- **il ramo `hide` non ha bisogno di un `setEdges` esplicito** per nascondere gli archi: già non si
  vedono. Lo vorrebbe solo se si volesse tenere lo stato RF allineato per principio;
- **al `show` gli archi devono tornare da soli.**

### 3.4 D4 — Il percorso incrementale (difetto 2)

**3.4.1 Il guard.** `:1302`:

```js
if (rfEdge && currentIds.has(rfEdge.source) && currentIds.has(rfEdge.target)) {
```

`currentIds = new Set(subElementIds)` (`:1249`), che contiene i vertici soppressi. L'init invece
filtra sul `nodeCache`, dal quale i soppressi sono già usciti (`:1204` `if (isSingletonSuppressed(v.id))
continue;`, poi `:1211` `nodeCache.has(...)`). L'asimmetria del report B §6.1 è confermata alla riga.

**3.4.2 Aggiungere `!isSingletonSuppressed(...)` a `:1302`** allineerebbe i due percorsi, ma
**dato §3.3 non serve a niente di visibile**: l'arco già non si disegna. Servirebbe solo a tenere
`edges` pulito. E introdurrebbe il problema che il prompt anticipa: l'arco non entra in
`rfEdgeCache`, quindi al `show` qualcuno deve aggiungerlo.

**3.4.3 Il contratto minimo del ramo `show`**, se si prende quella strada: per ogni vertice
rivelato, rileggere `lGraph.edges`, tenere gli archi con `start` o `end` fra i rivelati e l'altro
capo già in `rfNodeCache`, passarli per `jjomEdgeToRFEdge`, e inserirli **sia** in `rfEdgeCache`
**sia** in RF con un `setEdges`. `deduplicateInheritanceEdges` (`:1565`) **non** entra: dedup solo
`type === 'inheritance'`, e gli archi M1 di reference hanno `type` diverso — ma va applicata comunque
se si riusa il percorso dell'init, che la chiama sull'intero array.

**3.4.4 Il difetto 2 non è spiegato.** Ho verificato i tre cancelli che potrebbero fermare l'arco
creato mentre il target è nascosto, e **nessuno lo ferma**:

| Cancello | Riga | Esito per l'arco nuovo |
|---|---|---|
| `if (inCache) continue;` | `:1294` | l'id è nuovo, non è in cache → passa |
| `jjomEdgeToRFEdge` ritorna null? | `jjomTransformers.ts:486-493` | null solo se l'arco manca o `start`/`end` non risolvono; un vertice soppresso risolve → **non** null |
| `currentIds.has(source/target)` | `:1302` | entrambi in `subElements` → passa |
| `if (!isDropCreated) addedEdges.push(rfEdge)` | `:1318-1320` | `useM1ReferenceEdges` chiama `markCanvasEdgePair`, **mai** `markDropCreated` → `isDropCreated` falso → push |

Per lettura, l'arco **dovrebbe** entrare in `rfEdgeCache` e in `edges`, e al `show` comparire. La
misura dice che al `show` gli archi erano 9 e non 10. Delle due l'una: o la misura contava il DOM in
un momento in cui il nodo `Config` non era ancora montato, o esiste un quarto meccanismo che non ho
trovato. **Non progetto la Fase 2 su questo**: §9 Q1 dà la sonda.

**3.4.5 Un dettaglio che pesa su ogni disegno.** Le deps dell'effetto incrementale, `:1568`:

```js
}, [isJjomMode, elementSnapshots, subElementIds, scheduleFlush, Date.now()]);
// todo: remove Date.now() from dependencies, it forces update to fix singleton issue but it's sub-optimal
```

`Date.now()` cambia a ogni render: **l'effetto incrementale gira a ogni render**, e il commento dice
che è stato messo lì proprio «to fix singleton issue». Qualunque disegno che si appoggi
all'incrementale per riparare eredita questa frequenza; e qualunque disegno che renda superflua quella
dipendenza dovrebbe dirlo, perché toglierla è un guadagno indipendente.

### 3.5 D5 — Il guard morto (difetto 5)

`:670` e `:764`, identici:

```js
if (vertexIdByModelId.has(objId)) continue;
if (isSingletonSuppressed(objId)) continue;
```

`objId` viene da `rawModel.objects` (id di `DObject`); il Set contiene id di `DVertex`
(`EditorV2.tsx:816` e `:857`, entrambi con `seId`/`vid` presi da `graph.subElements`). Sempre falso.
Mascherato dalla riga sopra finché il vertice esiste; si scopre nel caso «singleton senza vertice +
nascosti», dove Step 4 crea il vertice, l'incrementale a `:1280` lo vede non soppresso (id nuovo, mai
messo nel Set) e il nodo compare col toggle spento.

**Cosa serve per esprimere la semantica voluta**: (1) la metaclasse dell'oggetto è singleton — un
lookup, `idlookup[dObj.instanceof]?.isSingleton`, già disponibile dentro il hook; (2) il modello è in
stato «nascosti» — oggi **non** raggiungibile dal hook.

Le due vie per (2):

| Via | Costo | Rischio |
|---|---|---|
| **Flag per modello in `syncState`** (`hideSingletonsForModel(modelId)` / `areSingletonsHidden(modelId)`), seminato da EditorV2 dove già semina il mirror | ~12 righe in `syncState.ts`, 2 chiamate in `EditorV2.tsx`; il hook legge una funzione di modulo, **nessuna dep nuova** | Basso. Ma è stato di modulo non reattivo: un cambio di flag non risveglia Step 4 da solo — accettabile, perché al toggle è il ramo `show`/`hide` a muovere i nodi |
| **Argomento nuovo di `useJjomSync`** | firma pubblica del hook + una dep in Step 4 | **Alto**: §3.5 di `CLAUDE.md` dice che le deps di Step 4 sono chiuse e che «non "fixare" le deps». Un booleano nuovo lì dentro fa rifare Step 4 a ogni toggle, con creazione di vertici |

Nomi verificati liberi: `command grep -rn "hideSingletonsForModel\|areSingletonsHidden\|setSingletonVisibility" frontend/src`
esce **1** (nessun riscontro); controllo positivo sullo stesso comando con `isSingletonSuppressed` = **6** riscontri.

### 3.6 D6 — `useM1ReferenceEdges` non dipende dallo stato RF: confermato

`command grep -n "setNodes\|setEdges\|getNodes\|getEdges\|rfNodeCache\|rfEdgeCache\|useReactFlow\|Node\[\]\|Edge\[\]"
frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` restituisce **una sola riga, la 14**,
che è **dentro il docblock** («…setEdges) handles rendering without modification»). Controllo
positivo con lo stesso comando su `useJjomSync.ts`: **15** riscontri.

Nel merito: `vertexByModel`, `existingKeys` e `managedM1Edges` si costruiscono tutti da
`rawGraph.subElements` (`:104-121`); `validPairs` dai valori degli slot (`:142-148`); il reconcile
(`:156`) confronta due insiemi di id del D-layer. **Il hook non va toccato**, ed è giusto che crei il
`DVoidEdge` anche verso un target nascosto: il D-layer deve avere l'arco (R-SGL-2).

### 3.7 D7 — Precedente di API imperativa restituita da un hook: **c'è**

`useClassRemoval.ts:221-279` prende `setNodes`, `setEdges`, `getNodes`, `getEdges` come argomenti e
ritorna `{ handleClassRemoval }` (`:278`), che EditorV2 chiama a `:2381` e `:2429`. Dentro, tocca RF
direttamente:

```ts
setEdges(eds => applyDistribution(eds.filter(e => !edgeIdSet.has(e.id))));
...
setNodes(nds => nds.filter(n => n.id !== nodeId));
```

`useOrphanFeatures` (`:298`) non ritorna funzioni.

**Limite del precedente**: `useClassRemoval` non possiede cache. Una funzione che aggiorni **le cache
di `useJjomSync`** non ha precedenti — ma quelle cache sono di `useJjomSync`, e il posto giusto per
toccarle è dentro di lui. Due precedenti interni al hook fanno già esattamente la coppia
cache+RF per gli archi: `:835` e `:926`, il secondo con la motivazione scritta:

```ts
const removedEdgeIds = new Set(crossDecision.deleteEdgeIds);
for (const staleId of removedEdgeIds) rfEdgeCache.current.delete(staleId);
setEdges(prev => prev.filter(e => !removedEdgeIds.has(e.id)));
```

> «setEdges is safe here — unlike setNodes it does not trigger the re-measure loop (see :135)» (`:922-924`)

---

## 4. I tre disegni

### (i) Visibilità posseduta dal hook

`useJjomSync` espone `setSingletonVisibility(vertexIds, visible)` (nome libero, §3.5). `hide`: toglie
nodi e archi incidenti da RF e dalle cache, marca il Set. `show`: smarca, rilegge da `lGraph`, rimette
in cache e in RF. EditorV2 `:734-833` chiama al posto dei `setNodes` diretti; il mount `:836-859`
chiama con `visible=false` **dopo** l'init, il che chiude il difetto 4 a prescindere dall'ordine.

- **File**: `useJjomSync.ts` (funzione nuova + `return`), `EditorV2.tsx` (tre chiamate), `syncState.ts` (invariato).
- **Righe**: ~55 in `useJjomSync.ts`, ~25 in meno in `EditorV2.tsx`. Sotto la soglia di 60 del prompt, di poco.
- **Risolve**: 4 (per costruzione), 1 e 3 (rendendo esplicito ciò che §3.3 dice avvenire da sé), 2 se abbinato al filtro a `:1302`.
- **Lascia aperto**: 5, e il Set globale di §3.1.
- **Rischio critical zone**: medio-alto. Aggiunge un'API imperativa a un hook di 1588 righe che oggi espone solo un ref, e `setNodes` dentro il hook è la cosa che il commento a `:130-137` addita come causa del loop di re-measure. La funzione dovrebbe passare da `pendingNodePatchRef` + `scheduleFlush` (`:246-259`), non da `setNodes` diretto.

### (ii) Predicato derivato invece del Set di vertici

`syncState` tiene un Set di **modelId**; `isSuppressed(entity)` si calcola: vertice il cui `model` è
un `DObject` la cui metaclasse ha `isSingleton` e il cui modello è nel Set.

- **File**: `syncState.ts`, `useJjomSync.ts` (i cinque call site), `EditorV2.tsx` (semina).
- **Righe**: ~30.
- **Risolve**: **5 per costruzione** — a `:670`/`:764` il predicato interroga l'oggetto e la sua metaclasse, non il vertice, quindi la domanda «due specie di id» sparisce. Rende inutile la scansione di `subElements` al mount (`:840-858`, ~18 righe che vanno via).
- **Lascia aperto**: 1, 2, 3, 4 da solo.
- **Costo per ciclo**: due lookup in `idlookup` per chiamata. Chiamate per ciclo incrementale su M1 con N vertici: `:1280` una per id **aggiunto** (non per vertice: il ramo è dentro `if (!prevIds.has(id))`), quindi 0 nel caso stazionario; `:1204` N ma solo all'init; `:670` e `:764` una per oggetto **senza vertice**, di norma 0. **Nel caso stazionario è zero.** Il costo esiste solo ai gesti strutturali.
- **Rischio**: basso. È una sostituzione di predicato, nessun `setNodes`/`setEdges` nuovo.

### (iii) Re-init completo al toggle

`initializedRef.current = false` e l'init rifà il full transform.

- **Risolve**: 1, 2, 3, 4 senza pensarci.
- **Costo**: `setNodes`/`setEdges` interi più re-measure di tutti i nodi. Ordine di grandezza dal benchmark M3 del 2026-07-19 (`2026-07-19_baseline_m3_run1.json`): `t_mount_flow_nodes_ms` = **17 996 ms** per 500 nodi, `t_edges_settle_ms` = **148 292 ms**. Il toggle non paga l'import, ma paga il montaggio e l'assestamento degli archi: su un M1 grande è una pausa di secondi **a ogni click**, e il menu è advanced ma il gesto è ripetibile.
- **`fitView`**: non evitabile senza toccare la firma. La callback a `EditorV2.tsx:461` fa `if (!restoredViewportRef.current) fitViewRef.current?.();` (`:478`), e `restoredViewportRef` è calcolato **una volta** al primo render (`:450`, guardia `=== undefined`). Con un viewport salvato il fit non parte; senza, a ogni toggle il viewport salta. Metà degli utenti lo vedrebbe.
- **Rischio**: basso sul codice, alto sull'esperienza.

### Raccomandazione: **(ii) prima, da sola; (i) solo se la sonda di §9 Q1 dice che serve**

Motivi, in ordine:

1. **(ii) è l'unico disegno che chiude un difetto che nessun altro chiude** (il 5), e lo chiude per
   costruzione invece che con un controllo in più. Elimina anche codice (la scansione al mount).
2. **§3.3 toglie il lavoro a (i).** Se gli archi non escono mai da `edges`, i difetti 1 e 3-per-il-caso-1
   sono descrizioni del DOM, non incoerenze di stato: la parte di (i) che rimette gli archi al `show`
   riparerebbe qualcosa che non è rotto. Resta il difetto 4, che (ii) **non** chiude da solo — ma il
   difetto 4 si chiude con **due righe**: un `setNodes(filter)` nel blocco di mount, gemello di quello
   del ramo `hide`. Non serve un'API nuova nel hook per quello.
3. **(iii) è il fallback giusto ma il prezzo è misurato e alto** (18 s di mount per 500 nodi su M3), e
   il salto di viewport è visibile.
4. Il rischio di (i) non è la lunghezza: è che introduce `setNodes` dentro `useJjomSync` fuori dal
   percorso `pendingNodePatchRef`/`scheduleFlush` che esiste proprio per non far esplodere il
   re-measure (`:136`, `:246-259`). Farlo bene costa più delle ~55 righe stimate.

**Quindi**: Fase 2 = (ii) + il `setNodes` mancante al mount + il filtro a `:1302` per igiene dello
stato. Se la sonda mostra che il caso 2 ha una causa che (ii) non tocca, si riapre (i) limitata al
solo `show` degli archi.

---

## 5. Bozza del Layer Impact Report (Fase 2, disegno raccomandato)

```
LAYER IMPACT REPORT — soppressione dei singleton come predicato per modello

Layers touched:
  [ ] D-layer      — NESSUNA scrittura. Il fronte è di sola visibilità.
  [ ] L-layer      — nessun proxy toccato
  [ ] JjOM         — nessuna entità creata o distrutta
  [x] Canvas v2-flow — un setNodes in più al mount; il filtro degli archi in incrementale
  [x] Sync layer   — useJjomSync: i cinque call site del predicato; syncState: Set di modelId
  [ ] Persistence  — nessuna migrazione

Sync layer — cosa cambia:
  `suppressedSingletonIds` (Set di vertici) diventa un Set di modelId; `isSingletonSuppressed(vertexId)`
  diventa `isSuppressed(entityId)` derivato (vertice → model → DObject → metaclasse.isSingleton, più
  il modello nel Set). I call site :670 e :764 iniziano a funzionare per la prima volta.
  NON cambia: Step 4 e le sue deps (§3.5 di CLAUDE.md), useM1ReferenceEdges (§3.6), il D-layer.
Cross-layer:
  Il D-layer resta la sorgente: l'arco verso un singleton nascosto continua a esistere (R-SGL-2),
  ed è giusto. La visibilità è una proiezione, mai una cancellazione.
Nessun `.new()` avvolto: nessuna TRANSACTION nuova, nessuna azione D.

Smoke:
  - Families.ecore, singleton visibili e nascosti al mount → zero nodi singleton con chiave `false`
  - assegnazione da select con nascosti, poi show → arco 1/1
  - arco tirato con visibili, poi hide, poi show → arco 1/1, cache coerente
  - reload con chiave `false` → zero nodi singleton, senza il doppio click di oggi
  - spegnimento di `isSingleton` con singleton nascosti (R-SGL-2) → oggetto, vertice e archi via,
    nessun residuo in cache
  - singleton SENZA vertice + nascosti → Step 4 non crea il vertice (è il difetto 5, che diventa
    verificabile per la prima volta)
```

---

## 6. Dipendenze e rischi

1. **Il difetto 2 non è spiegato** (§3.4.4). Progettare la Fase 2 senza chiuderlo significa accettare
   che uno dei cinque possa sopravvivere. La sonda costa una riga (§9 Q1).
2. **`Date.now()` nelle deps dell'incrementale** (`:1568`): l'effetto gira a ogni render, e il TODO
   dice che è lì per «a singleton issue». Se (ii) chiude quella issue, la dipendenza va rimossa — ma
   è un cambio di frequenza di un effetto in critical zone e merita la sua misura, non un tolto-e-via.
3. **Il Set globale con due editor** (§3.1): (ii) lo migliora (un Set di modelId è naturalmente
   per-modello) ma il `clearSuppressedSingletons()` nel cleanup va rivisto, o continuerà a svuotare
   anche le voci dell'altro editor.
4. **Nessuna suite copre la soppressione**: `command grep -rln "isSingletonSuppressed\|suppressSingleton"
   frontend/src` restituisce 3 file, **nessuno** sotto `__tests__` (controllo positivo: lo stesso
   comando con `portDistribution` restituisce anche i suoi test). La prova resta la verifica visiva.

---

## 7. Domande aperte per Alfonso

**Q1 — La sonda che chiude il difetto 2, e conferma §3.3.** Con i singleton nascosti, in console:
`window.__m1RefEdgesDebug = true` (il flag esiste, `useM1ReferenceEdges.ts:162`), poi prima e dopo
l'assegnazione dalla select: `rf.getEdges().length` e `document.querySelectorAll('.react-flow__edge').length`.
Se lo stato cresce e il DOM no, §3.3 è confermata e il difetto 2 è solo di rendering. Se lo stato non
cresce, c'è il quarto meccanismo e va cercato prima di progettare. Stessa coppia di numeri a `hide` e
a `show` chiude anche i difetti 1 e 3.

**Q2 — (ii) da sola, o (ii)+(i)?** La mia raccomandazione è (ii) più due righe al mount. Dipende da Q1:
se il caso 2 è di rendering, (i) non ha lavoro da fare.

**Q3 — Il `Date.now()` a `:1568` entra nel perimetro?** Toglierlo è un guadagno indipendente ma cambia
la frequenza di un effetto in critical zone. Fronte suo, o dentro β con la sua misura?

**Q4 — `clearSuppressedSingletons()` nel cleanup.** Con (ii) diventa «togli questo modelId», non
«svuota tutto». Confermi che il comportamento voluto è per-modello anche quando un solo editor è
montato?

**Q5 — Il difetto 5 vale la spesa?** Si manifesta solo con un singleton **senza vertice** e i
singleton nascosti. Dopo il commit A quello stato è raro (le istanze nascono col loro vertice). Se
non vale, (ii) perde la sua ragione principale e la raccomandazione cambia in «due righe al mount e
basta».

---

## 8. Note di metodo

- Asserzioni di assenza, ciascuna col comando e il controllo positivo (R-RAIL-28): `onlyRenderVisibleElements`
  in `frontend/src` → exit 1, controllo `<ReactFlow` presente a `EditorV2.tsx:4070`; dipendenze RF in
  `useM1ReferenceEdges.ts` → 1 riga, dentro un commento, controllo 15 righe su `useJjomSync.ts`; nomi
  nuovi liberi → exit 1, controllo `isSingletonSuppressed` = 6; suite sulla soppressione → 3 file,
  nessuno in `__tests__`, controllo `portDistribution` che i suoi test li ha.
- Glob quotati nei comandi (R-RAIL-31).
- Ricerche via `command grep` (BSD grep), non il wrapper `ugrep` interattivo, quando usano `--include`
  o devono raggiungere `node_modules` (che il wrapper salta perché gitignored).
- I numeri di riga sono di HEAD `73aef31c9`. Quelli del prompt combaciano tutti tranne il blocco di
  mount, che il prompt dà a `:837-858` e sta a **`:836-859`**.

---

## Addendum 1 — sonda di §7 Q1, eseguita dalla chat con il Chrome di Alfonso (2026-08-27, 12:35-12:55)

Strumento: una funzione iniettata nella pagina che legge, a ogni passo, quattro livelli distinti:
il D-layer (`DGraph.subElements`, archi), lo stato base di React Flow (`useEdgesState`/`useNodesState`
in `EditorV2Inner`, letti dai hook della fiber), gli array decorati che arrivano a `<ReactFlow>`
(dopo `useIRContainment`, `decorateReferenceEdges`, `synthesizeObjectAsEdges`), e il DOM
(`.react-flow__node`, `.react-flow__edge`). Le misure del 26/8 leggevano solo il DOM.

**Scoperta di metodo**: fra stato base e `<ReactFlow>` c'è una pipeline di decorazione. Nel
fixture Class Diagram i 18 archi di base diventano 2 archi decorati (compartimento `children` +
object-as-edge). Contare `.react-flow__edge` misura la decorazione, non il sync.

### A. Fixture State Machine v1 / model_1 (Class Diagram), singleton Integer, String, Boolean, più una seconda istanza Integer_0 (anomalia pre-A)

| Passo | D archi | base nodi (singleton) | base archi (orfani) | RF archi | DOM nodi singleton | DOM archi | chiave |
|---|---|---|---|---|---|---|---|
| apertura, viewpoint Class Diagram v1 | 18 | 16 (4) | 18 (0) | 2 | **4** | 2 | `false` |
| 1° click (ramo `show`, a vuoto) | 18 | 16 (4) | 18 (0) | 2 | 4 | 2 | `true` |
| 2° click (`hide`) | 18 | 12 (0) | 18 (**7**) | 2 | 0 | 2 | `false` |
| 3° click (`show`) | 18 | 15 (**3**) | 18 (3) | 2 | 3 | 2 | `true` |
| viewpoint Abstract syntax, stesso stato | 18 | 15 (3) | 18 (3) | 18 | 3 | 15 | `true` |
| `hide` | 18 | 12 (0) | 18 (7) | 18 | 0 | **11** | `false` |
| `show`, +1,5 s | 18 | 15 (3) | 18 (3) | 18 | 3 | 11 | `true` |
| stesso stato, +qualche secondo | 18 | 15 (3) | 18 (3) | 18 | 3 | **15** | `true` |

Letture:

- **Difetto 4 riprodotto all'apertura**: chiave `false`, quattro nodi singleton a schermo, menu senza
  spunta. Primo click a vuoto, come previsto da §3.1.
- **§3.3 confermata**: a `hide` lo stato base non perde archi (18 → 18, 7 orfani), `<ReactFlow>` ne
  riceve ancora 18, il DOM scende a 11. Nessun `setEdges`.
- **A `show` gli archi tornano da soli**, ma non subito: a +1,5 s il DOM è ancora a 11, dopo qualche
  secondo è a 15. Il nodo appena rimesso deve essere misurato prima che `EdgeWrapper` abbia le
  coordinate. **La misura «RF 0» del 26/8 era un conteggio DOM preso prima del measure**: il caso 1
  del difetto 3 non è un difetto.
- **Difetto nuovo (6)**: il ramo `show` rimette **un vertice per metaclasse**: `existingVertexIds`
  è una `Map<metaclassId, vertexId>` (`EditorV2.tsx:738`), l'ultimo scrive sopra il primo. Con due
  istanze di Integer, `Integer` (quella puntata da tutte le reference `id`) resta nascosta, torna
  solo `Integer_0`; i suoi 3 archi restano orfani e il vertice resta nel Set. Stato pre-A, ma il ramo
  perde dati a schermo.

### B. Fixture dd / model_1 (quello della verifica B), viewpoint test VP, singleton Red, Green, Blue, Config

| Passo | D archi | base nodi (singleton) | base archi (orfani) | RF archi | DOM archi | chiave |
|---|---|---|---|---|---|---|
| apertura, dopo settle | 4 | 6 (4) | 4 (0) | 4 | 4 | `true` |
| `hide` | 4 | 2 (0) | 4 (**4**) | 4 | 0 | `false` |
| select su `Shape_1.cfg` → `(none)` | 4 | 2 (0) | 4 (4) | 4 | 0 | `false` |
| `×` sul pannello Slots di `cfg`, +1,5 s | 4 | 2 (0) | 4 (4) | 4 | 0 | `false` |
| idem, +3 s | **3** | 2 (0) | **4** (4) | 4 | 0 | `false` |
| idem, +5 s, popover riaperto | 3 | 2 (0) | 4 (4) | 4 | 0 | `false` |
| click su `Config` nella select | **renderer bloccato** | | | | | |

Letture:

- **`(none)` nella select non ha svuotato `cfg`** (`values` invariato, riga invariata). Il `×` del
  pannello Slots sì (`values: [null]`). Da verificare se è la select o il mio click; non è di β.
- **Cancellazione a D-layer con singleton nascosti non arriva a RF**: dopo il reconcile di
  `useM1ReferenceEdges` il D-layer ha 3 archi, lo stato base ne ha ancora 4, e ci resta per almeno
  5 secondi. Contraddice §3.2(b), che per lettura dava il percorso rimozioni (`:1331-1336`) come
  funzionante. Non so se è specifico dei singleton nascosti (il target dell'arco era soppresso) o
  generale: la prova con singleton visibili non è stata fatta perché subito dopo il renderer si è
  bloccato.
- **Il difetto 2 (assegnazione con nascosti) non è stato misurato**: il blocco è arrivato prima del
  click su `Config`.

### C. Due blocchi del renderer, senza output in console

1. Fixture A, viewpoint cambiato da Abstract syntax a Class Diagram v1 con singleton visibili ma
   `Integer` ancora soppresso nel Set e 3 archi orfani nello stato base.
2. Fixture B, singleton nascosti, 4 archi orfani nello stato base di cui uno **stale** (cancellato
   a D-layer, ancora in RF), popover della select aperto. Il blocco è iniziato fra due sonde
   riuscite, senza azione dalla chat.

Fattore comune misurato: archi nello stato base senza nodo. Console muta in entrambi i casi (ultima
riga `[useContentDrivenSize] size write not adopted by the store` un minuto prima). Il tab del caso
2 è stato lasciato aperto e bloccato perché Alfonso possa catturare lo stack da DevTools (pausa
dell'esecuzione). **Finché lo stack non c'è, la direzione della Fase 2 non è decidibile**: se il
loop sta nella decorazione o negli anchor che ricevono un arco senza nodo, la cura è tenere lo stato
RF privo di archi orfani (disegno (i) intero, filtro a `:1302`, `setEdges` nel ramo `hide`), cioè
l'opposto della raccomandazione di §4.

### Conseguenze sulla raccomandazione di §4

- §3.3 regge: la parte «archi» di (i) non serve **se** gli archi orfani nello stato RF sono innocui.
- Il difetto 6 e il difetto 4 sono entrambi nel ramo `show`/mount di `EditorV2.tsx`, fuori dal hook.
- La rimozione a D-layer che non arriva a RF (B, +3 s) è un difetto del percorso incrementale o
  della sua frequenza, da spiegare per lettura prima di toccare `:1302`.
- Il blocco del renderer è prioritario su tutti e cinque i difetti del prompt.

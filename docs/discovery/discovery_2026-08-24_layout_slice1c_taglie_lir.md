# Discovery + Layer Impact Report — layout per viewpoint, slice 1c (le taglie)

**Data**: 2026-08-24 · **Commit letto**: `e1241a62a` (codice a `cd8363ccc`, invariato)
**Corsia**: RC-3 completa, critical zone (`useJjomSync.ts`) · **Effort**: xhigh
**Vale come**: discovery report (CLAUDE.md P2/P4) **e** Layer Impact Report (CLAUDE.md §3.2).
**Fase**: 1, read-only. Nessun file di codice toccato.

---

## 0. In sintesi — cosa il prompt non sapeva

Tre cose, tutte misurate qui.

1. **La root cause (1) del prompt è confermata alla lettera**, e la citazione va corretta di
   due righe: il ramo è `useJjomSync.ts:1356-1377`, il confronto di taglia `:1364-1370`
   riguarda **solo** `style.width/height` (il `packageNode`), e `width`/`height` top-level non
   compaiono né nel confronto né nel patch differito (`:1423-1460`). Il `rfNodeCache` contiene
   **solo** output del trasformatore (tre soli writer: `:1216`, `:1284`, `:1378`), mai il nodo
   React Flow misurato: il confronto trasformatore-contro-cache è quindi legittimo e scatta una
   volta sola per transizione di layout.
2. **L'ipotesi sul reload è in larga parte falsa, e comunque irrilevante.** `state.viewpoint` è
   un campo radice di `DState` (`redux/store.tsx:160`), quindi **fa parte dello snapshot
   persistito** ed è già ripristinato prima che qualunque componente monti. Il difetto si vede
   quindi **anche col reload**, ma non per la ragione ipotizzata: si vede perché la taglia non
   viene *mai* ripropagata, non perché nasca sulla chiave sbagliata. Resta una finestra stretta
   e reale in cui i nodi nascono sulla chiave dello snapshot (§2), che il fix (1) chiude
   comunque.
3. **Il fix (1) da solo non basta per le forme con supplemento, e la ragione è nuova.**
   `useContentDrivenSize` legge `isResized` **dal seme** (`useContentSize.ts:101`). Dopo la
   rettifica del 2026-08-24 il seme non è più riscritto da editor-v2, quindi quel flag è falso
   sotto **ogni** layout: la derivazione da contenuto è oggi attiva anche su un nodo
   ridimensionato a mano, e combatterebbe il patch della slice 1c a ogni commit. I punti (2) e
   (3) del prompt non sono rifiniture: senza di essi il punto 6 della verifica visiva fallisce
   e il budget `MAX_UNACCEPTED_WRITES` viene bruciato. **Vanno nello stesso diff.**

Una quarta cosa, minore: **il refresh degli archi non serve** (§4). React Flow rimisura da sé e
ricalcola gli `handleBounds`, purché il patch tolga `measured` — cosa che entrambi i precedenti
del repo già fanno.

---

## Baseline misurate prima del diff

| Gate | Valore |
|---|---|
| `npm run typecheck` | **33** errori, lista salvata (`/tmp/tsc-baseline-1c.txt`), conteggio su output **completo**, exit 2 |
| `npx vitest run` | **1342 passed**, **9 suite** fallite in import (`window is not defined`), 52 passate su 61 |
| `@xyflow/react` | dichiarato `^12.10.0`, installato **12.10.2** (`node_modules/@xyflow/react/package.json:3`) |

---

## 1. Verifica della root cause (1) — **confermata**

### 1.1 Il ramo «property changes on existing elements»

`hooks/useJjomSync.ts:1356-1377`, citazione corrente:

```ts
1356  if (isVertexClassName(className)) {
1357      const rfNode = jjomVertexToRFNode(lProxy);
1358      if (rfNode) {
1359          const existing = rfNodeCache.current.get(id);
1360          if (existing) {
1362              const posChanged = rfNode.position.x !== existing.position.x
1363                              || rfNode.position.y !== existing.position.y;
1364              // Check if size changed (packageNode uses style.width/height)
1365              const newW = (rfNode.style as any)?.width;
...
1369              const sizeChanged = (newW !== undefined || oldW !== undefined)
1370                               && (newW !== oldW || newH !== oldH);
1372              if (!posChanged) rfNode.position = existing.position;
1373              if (!sizeChanged && existing.style) rfNode.style = existing.style;
1375              if (posChanged) patchedNodePositions.set(id, rfNode.position);
1376              if (sizeChanged && rfNode.style) patchedNodeStyles.set(id, rfNode.style as Record<string, any>);
1377          }
1378          rfNodeCache.current.set(id, rfNode);
```

Il confronto `:1364-1370` legge `rfNode.style?.width`. L'unico trasformatore che scrive
`style.width/height` è `packageVertexToRFNode` (`utils/jjomTransformers.ts:279-284`). Gli altri
tre — classe, enum, oggetto — mettono la taglia **top-level**, per spread di `manualSizeOf`:

```
jjomTransformers.ts:210   ...manualSizeOf(raw),   // classNode
jjomTransformers.ts:253   ...manualSizeOf(raw),   // enumNode
jjomTransformers.ts:385   ...manualSizeOf(raw),   // objectNode
```

`rfNode.width` / `rfNode.height` non compaiono **da nessuna parte** in `useJjomSync.ts`: né nel
confronto, né in `patchedNodeData/Positions/Styles`, né nel patch differito.

### 1.2 Il patch differito

`:1423-1460`. Tre sole mappe attraversano la chiusura:

```
1423  const hasNodeChanges = addedNodes.length > 0 || removedNodeIds.size > 0
1424      || patchedNodeData.size > 0 || patchedNodePositions.size > 0 || patchedNodeStyles.size > 0;
1433  const _patchedNodePositions = new Map(patchedNodePositions);
1434  const _patchedNodeStyles = new Map(patchedNodeStyles);
1443  if (_patchedNodeData.size > 0 || _patchedNodePositions.size > 0 || _patchedNodeStyles.size > 0) {
1446      const newPos = _patchedNodePositions.get(n.id);
1447      const newStyle = _patchedNodeStyles.get(n.id);
```

Il nodo React Flow conserva quindi il `width`/`height` che aveva: quello scritto dal
`NodeResizer` via `applyNodeChanges`, o da `useContentDrivenSize`, o dalla costruzione
iniziale. **Confermato: al cambio di layout la posizione segue e la taglia no.**

### 1.3 `rfNodeCache` contiene output del trasformatore, mai il nodo misurato

Censimento completo dei writer (`command grep -n "rfNodeCache" hooks/useJjomSync.ts`):

| Riga | Operazione | Sorgente |
|---|---|---|
| 264 | `useRef(new Map())` | — |
| 1171, 1182, 1540 | `.clear()` | reset |
| 1216 | `rfNodeCache.current = nodeCache` | `jjomVertexToRFNode` (`:1205`) |
| 1277 | `.has(id)` | lettura |
| 1284 | `.set(rfNode.id, rfNode)` | `jjomVertexToRFNode` (`:1280`) |
| 1328 | `.delete(id)` | rimozione |
| 1359 | `.get(id)` | lettura |
| 1378 | `.set(id, rfNode)` | `jjomVertexToRFNode` (`:1357`) |

Nessun writer parte da `getNodes()`, da `nodes` o da un `NodeChange`. **Confermato**: un
confronto `rfNode.width` contro `existing.width` confronta due letture del trasformatore, cioè
due letture del record di layout, e scatta **solo** quando cambia la taglia effettiva del
layout — mai quando l'umano trascina il `NodeResizer`, mai quando `useContentDrivenSize`
scrive. È la stessa disciplina che regge già `posChanged`.

Corollario operativo: il patch è **one-shot per transizione**. Alla riga `:1378` la cache viene
aggiornata con lo stesso `rfNode`, quindi al giro successivo il confronto è falso e il patch non
si ripete, anche se l'effetto gira a ogni render (`Date.now()` in dipendenza, `:1528`).

---

## 2. Ipotesi sul reload — **falsa nella causa, vera nell'esito**

### 2.1 Chi ripristina `state.viewpoint`, e quando

`state.viewpoint` è un **campo radice di `DState`**:

```
redux/store.tsx:160   viewpoint: Pointer<DViewPoint> = '';
```

Essendo campo radice, sta nello snapshot persistito del progetto ed è ripristinato con esso,
**prima** che qualunque componente monti. Non c'è quindi un «ripristino successivo» generale.

L'unico scrittore è `activateViewpoint` (`utils/lastViewpoint.ts:70`,
`SetRootFieldAction.new('viewpoint', …)`), con quattro chiamanti:
`EditorSwitch.tsx:93`, `Toolbar.tsx:245`, `NestedView.tsx:112` e `:316`.

Il solo chiamante di montaggio è `EditorSwitch.tsx:85-95`, che riattiva il viewpoint salvato
**per-modello** in `localStorage` e dichiara nel proprio commento (`:83-84`) esattamente questa
architettura: «A missing or deleted viewpoint is a graceful no-op: the snapshot-restored,
project-global viewpoint is left untouched».

### 2.2 La finestra che resta

Gli effetti React montano figlio-prima-del-padre: gli effetti di `EditorV2` (e quindi l'effetto
di inizializzazione di `useJjomSync`, `:1203-1207`) girano **prima** dell'effetto di montaggio
di `EditorSwitch`; e la dispatch di Jjodel è asincrona (`setTimeout(fn, 0)`, `action.ts:349`,
citato a `useJjomSync.ts:213-216`). Quindi:

- se il viewpoint dello snapshot **coincide** con quello salvato in `localStorage` per quel
  modello — il caso normale — i nodi nascono già sulla chiave giusta e non c'è finestra;
- se **divergono**, i nodi nascono sulla chiave dello snapshot e la riattivazione arriva dopo.

**Esito**: il difetto delle taglie **si vede anche col reload**, ma non per l'ordine di
ripristino — si vede perché la taglia non viene mai ripropagata a valle della costruzione
iniziale (§1). La finestra di §2.2 è reale ma stretta, e il fix (1) la chiude comunque: alla
prima esecuzione del ramo property-change dopo la riattivazione, `rfNode.width` differisce dalla
cache e il patch scatta.

Nota collaterale (non un obiettivo): `state.viewpoint` singolare **non** è ripulito da
`VersionFixer` (il commento a `EditorSwitch.tsx:81-82` lo dichiara: è la forma plurale
`state.viewpoints` a esserlo). Un puntatore a un viewpoint cancellato è già gestito in modo
difensivo da `getActiveLayoutKey` (`vertexLayoutAdapter.ts:58-59`: `idlookup` a vuoto →
sintassi astratta).

---

## 3. Censimento dei lettori di `isResized` / `w` / `h` fuori dal resolver

**Controllo positivo del grep.** `command grep -rn "readVertexLayout" --include="*.ts"
--include="*.tsx" .` da `frontend/src` restituisce 14 righe su 4 file noti (il modulo, il suo
test, `jjomTransformers.ts:33,55`): il comando ha segnale. Il grep di `isResized` sullo stesso
comando esce `EXIT=0` con 62 righe; senza `--exclude-dir=node_modules` produce 2.7 MB, prova che
`command grep` (BSD) **entra** in `node_modules` — al contrario del `grep` interattivo, che è un
wrapper di `ugrep --ignore-files` (CLAUDE.md §5). Tutti i conteggi qui sotto sono su output
completo.

### 3.1 `isResized` — 62 occorrenze, 12 siti di lettura reali

| Sito | Cosa legge | Decisione | Motivo |
|---|---|---|---|
| `viewpoint/ir/useContentSize.ts:101` | `s.idlookup[vertexId].isResized` | **INSTRADARE** | Gate della derivazione da contenuto. Legge il seme, che editor-v2 non riscrive più: oggi è falso sotto ogni layout (§5.1). |
| `viewpoint/authoring/SymbolEditorModal.tsx:160-162` | `raw.isResized`, `raw.w`, `raw.h` | **INSTRADARE** | `manualSig`: l'anteprima del Symbol Editor mostra la taglia manuale. Stessa gate di `manualSizeOf`. |
| `utils/jjomTransformers.ts:76` | `eff.isResized` | già instradato | `manualSizeOf` passa da `effectiveLayoutOf`. |
| `sync/canvasToJjom.ts:125,141,158` | patch `{isResized}` | già instradato | `resolveLayoutWriteFor` + `getActiveLayoutKey`. |
| `sync/canvasToJjom.ts:130,144,162` | `SetFieldAction` sugli scalari | già instradato | Ramo `'scalars'`, raggiungibile solo se il D-object non si risolve. |
| `viewpoint/layout/vertexLayout.ts` (varie) | il resolver stesso | — | — |
| `joiner/classes.ts:1300` | `thiss.isResized = false` | **DICHIARARE** | Default di costruzione del seme. Corretto così: il seme nasce non ridimensionato. |
| `model/dataStructure/GraphDataElements.tsx:868-874`, `1388-1394` | accessor del proxy L | **DICHIARARE** | Non-obiettivo già ratificato (GO 1b, emendamento a R-LAY-16). Il resize via proxy scrive sul seme. |
| `components/editors/NodeEditor.tsx:564` | campo `field="isResized"` | **DICHIARARE** | Editor classico, scrive attraverso il proxy L: stesso non-obiettivo. |
| `components/contextMenu/ContextMenu.tsx:444-445`, `675` | `gn.isResized` (proxy L) | **DICHIARARE** | Idem: passa dal proxy, non dal D-object. |
| `viewpoint/authoring/useCanvasNodeBox.ts:19` | solo commento | — | Non legge il campo; restituisce il `vertexId` al chiamante. |
| `examples/*.ts` | fixture JSON | — | Dati, non codice. |

### 3.2 `w` / `h` letti direttamente dal D-object

`command grep -rnE "idlookup\[[^]]+\]\??\.(w|h|x|y)\b|raw\??\.(w|h)\b|__raw\??\.(w|h)\b"` su
`components/ model/ view/ utils/ pages/`, escluse le fixture: **4 righe, 2 siti**.

| Sito | Decisione | Motivo |
|---|---|---|
| `SymbolEditorModal.tsx:161-162` | **INSTRADARE** | Già in §3.1. |
| `utils/ViewportCulling.ts:193-194` (`getElementBounds`) | **DICHIARARE** | Il modulo ha **un solo** importatore, `index.tsx:108`, per side-effect (`import './utils/ViewportCulling';`), e `getElementBounds` non ha chiamanti. Codice morto: instradarlo sarebbe una modifica inerte fuori perimetro (CLAUDE.md §5, sotto-regola «verify consumers»). |

**Nessun altro sito.** In particolare: nessun esportatore (`services/export/`), nessun servizio,
nessun `polymetricLayouts.ts` (che lavora su una struttura ad albero propria — già misurato
nell'addendum §10.3 della 1b). Il censimento del prompt era corretto e completo.

---

## 4. Cosa fa React Flow 12.10.2 con `width`/`height` nuovi o tolti

Misurato sul sorgente installato.

1. **La taglia inline del nodo** viene da `node.width ?? node.style?.width`
   (`@xyflow/react/dist/esm/index.mjs:1926`). Cambiare o togliere `width` cambia quindi
   subito la box DOM per class/enum/object, che non hanno `style.width`.
2. **La geometria che gli archi usano** viene da `getNodeDimensions`
   (`@xyflow/system/dist/esm/index.js:771-776`):
   `node.measured?.width ?? node.width ?? node.initialWidth ?? 0`. **`measured` vince.**
   Lasciare un `measured` stantìo terrebbe gli archi sulla taglia vecchia fino al giro
   successivo dell'osservatore. → **togliere `measured` non è opzionale, in entrambi i rami.**
3. **Togliere `measured` azzera gli `handleBounds`**: `parseHandles`
   (`system:1571-1573`) ritorna `undefined` quando il nodo non ha `handles` espliciti e
   `userNode.measured` è assente; `adoptUserNodes` (`system:1630`) lo ripone nel lookup.
4. **La rimisura è automatica.** Ogni nodo è osservato da un `ResizeObserver`
   (`react:2021-2045`, `useNodeObserver` a `:2054-2067`), il cui callback chiama
   `updateNodeInternals`. In `updateNodeInternals` (`system:1826-1852`) il predicato è
   `dimensions.width && dimensions.height && (dimensionChanged || !node.internals.handleBounds
   || update.force)`: con `measured` azzerato **entrambi** i primi due congiunti sono veri, e
   `handleBounds` viene ricalcolato da `getHandleBounds` sul DOM appena dipinto.
5. **Non c'è write-back.** Il cambio di dimensione generato dall'osservatore arriva a
   `handleNodesChange` come `{type:'dimensions', resizing: undefined}`, e il filtro di
   persistenza (`EditorV2.tsx:3482-3486`) richiede `resizing !== undefined`. Nessun loop.

**Conclusione — il refresh esplicito degli archi NON serve.** Il doppio `rAF` +
`updateNodeInternals` di `resetNodeSize` (`EditorV2.tsx:2344`) è una cintura in più su una
bretella che il punto 4 dimostra già allacciata; replicarlo dentro `useJjomSync` costerebbe un
`useStoreApi()` nuovo nella critical zone per un guadagno non misurato.

**Piano dichiarato**: nessun `updateNodeInternals` nel diff. Se il punto 3 della verifica visiva
mostra handle staccati, si aggiunge come follow-up mirato — `useJjomSync` è chiamato da
`EditorV2.tsx:417`, cioè dentro il `ReactFlowProvider` (lo stesso componente usa
`useStoreApi()` a `:576`), quindi il rimedio è disponibile e a un import di distanza.

---

## 5. Interazioni

### 5.1 `useContentDrivenSize` — il vero motivo per cui (2)+(3) stanno nello stesso diff

`useContentSize.ts:101-103`:

```ts
const isResized = useSelector((s: any) => !!s?.idlookup?.[vertexId]?.isResized);
const active = hasSizeSupplement(desc) && !isResized;
```

Dopo la rettifica del 2026-08-24 il seme non è più riscritto da editor-v2, quindi
`idlookup[vertexId].isResized` è **falso sotto ogni layout** su ogni progetto che non lo avesse
già vero prima della 1b. Conseguenza misurabile a schermo, **oggi, senza slice 1c**: su una forma
con supplemento (ellisse, cerchio, rombo) la derivazione da contenuto resta attiva anche dopo un
resize manuale — un difetto vivo, non introdotto qui.

Con il solo fix (1), il quadro peggiora: il patch metterebbe la taglia manuale sul nodo e
`useContentDrivenSize`, ancora `active`, la riscriverebbe al commit successivo. Il suo budget
(`MAX_UNACCEPTED_WRITES = 3`, `:78`) verrebbe consumato in tre commit e il hook cederebbe con un
`console.warn` (`:180`) — cioè: taglia manuale ignorata, console sporca. Esattamente il punto 6
della verifica visiva.

Con (3) applicato il quadro torna coerente:

| Transizione | `manualSizeOf` | patch | `active` di `useContentDrivenSize` |
|---|---|---|---|
| layout non ridimensionato → resta | `{}` (null) | nessuno (null vs null) | vero: deriva, la sua scrittura non è contrastata |
| non ridimensionato → ridimensionato | `{w,h}` | set `width/height`, drop `measured` | diventa **falso**: il hook si azzera (`:128-132`) e cede |
| ridimensionato → non ridimensionato | `{}` | drop `width/height/measured` | diventa **vero**: `curW == null` → `ours` (`:153-154`) → misura → scrive una volta → il commit dopo conferma → `unaccepted = 0` |

Nessuna oscillazione: il patch è one-shot per transizione (§1.3) e non si ripete finché il
layout non cambia di nuovo.

### 5.2 Anti-bounce `isCanvasUpdated`

`useJjomSync.ts:1337` salta l'intero ramo property-change per un id marcato. `syncSizeToJjom`
(`canvasToJjom.ts:123`) chiama `markCanvasUpdated` prima della TRANSACTION, con finestra
`BOUNCE_WINDOW_MS = 300` (`syncState.ts:78`). Durante e subito dopo un gesto di `NodeResizer` il
patch **non** può scattare: nessuna lotta col resizer. Alla scadenza della finestra il
trasformatore rilegge lo stesso record appena scritto, quindi il confronto contro la cache è
falso e non succede nulla. Invariato dal diff.

### 5.3 Undo

`useHistory` è una storia di sessione su nodi/archi RF; `takeSnapshot` è preso dai gesti
(`EditorV2.tsx:3488-3489`, dentro `if (hasDragEnd || hasResize)`). **Un cambio di layout non è
un gesto e non prende snapshot**: corretto e voluto — ⌘Z non deve annullare un cambio di
viewpoint. I due difetti dell'undo dell'addendum §10.4 della 1b (snapshot a fine gesto,
`handleUndo` che non riscrive su JjOM) restano preesistenti e **fuori perimetro**: dichiarati,
non risolti.

### 5.4 `packageNode`

Non toccato: la sua taglia passa da `style.width/height` (`jjomTransformers.ts:279-284`), è già
per layout via `effectiveLayoutOf` (`:268`) ed è già patchata via `patchedNodeStyles`
(`useJjomSync.ts:1376`). Il nuovo confronto top-level è ortogonale: per un `packageNode`
`rfNode.width` è sempre `undefined` da entrambi i lati, quindi `topSizeChanged` è sempre falso.

---

## 6. LAYER IMPACT REPORT

```
Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
```

### D-layer — **NON toccato**
- Cosa cambia: nulla. Nessuna `SetFieldAction`, nessun `TRANSACTION`, nessun `.new()` nel diff.
- Cosa NON cambia: forma di `DVertex`, `layoutByViewpoint`, gli scalari-seme, il reducer.
- Interazione cross-layer: il diff è **solo in lettura** sul D-layer, attraverso il resolver.
- Sicurezza: la Regola 12 (TRANSACTION annidate) non è in gioco — non si creano elementi.

### L-layer (proxy) — **NON toccato**
- `set_size`, `set_w`, `set_h`, `set_isResized` restano sugli scalari. Non-obiettivo ratificato.
- `SymbolEditorModal` e `useContentSize` leggono **il D-object dal `useSelector`**, mai il proxy:
  instradarli non attraversa il layer L.

### JjOM — **NON toccato**

### Canvas v2-flow — **toccato in scrittura sui nodi**
- Cosa cambia: i nodi RF di tipo class/enum/object ricevono `width`/`height` (con `measured`
  tolto) quando la taglia del layout in forza cambia, e li perdono quando il layout in forza non
  è ridimensionato.
- Cosa NON cambia: `position` (già patchata), `style` (già patchato), `data`, `id`, `type`, gli
  archi, gli handle assegnati da `applyDistribution`.
- Interazione cross-layer: React Flow rimisura e ricalcola gli `handleBounds` da sé (§4); il
  cambio di dimensione risultante non innesca persistenza (`resizing === undefined`, §4.5).
- Sicurezza: il patch è one-shot per transizione (§1.3); il canale è lo stesso `pendingNodePatchRef`
  già in uso, quindi resta coalescato nel `requestAnimationFrame` di `scheduleFlush` (`:246-259`).

### Canvas classic — **NON toccato**

### Sync layer — **toccato, solo `useJjomSync.ts`**
- `canvasToJjom.ts` non cambia. `syncState.ts` non cambia. `portDistribution.ts` non cambia.
- Il diff è **additivo**: una mappa nuova, un confronto nuovo, un ramo nuovo nel patch differito.
  Nessuna riga esistente cambia semantica. Il `Date.now()` in dipendenza (`:1528`) e la guardia
  `prevModel = {}` (`:1344`) restano **come sono**: sono un fronte loro.

### Persistenza — **NON toccata**
- Nessuna migrazione, nessun bump di versione, nessun `jsxString`. Coerente con R-LAY-15 come
  emendata (un bump rigenererebbe in blocco le default view non toccate,
  `VersionFixer.tsx:133-143`).

### Scenari di smoke potenzialmente affetti
- Aprire un progetto esistente **senza** dizionario di layout: sotto ogni layout si deve vedere
  la taglia di oggi, seme compreso se `isResized` era già vero (prova 5).
- Aprire un **metamodello**: chiave `__abstract__`, nessun selettore di viewpoint. Zero cambiamenti
  visibili attesi.
- Import `Families.ecore` → 8 archi Family↔Member: non toccato (nessuna riga di edge nel diff).
- Resize con `NodeResizer` + reload: la taglia deve tornare (regressione zero sulla 1b).
- «Reset size» → il nodo stringe il contenuto (percorso `resetNodeSize` invariato).
- Forme con supplemento (ellisse, rombo): §5.1, prova 6.

**Incertezze residue**: nessuna che blocchi. La sola cosa non misurabile senza DOM è il
comportamento del patch a schermo — dichiarata al §8.

---

## 7. Piano dei diff, file per file — **4 file** (Regola 19: sotto soglia, nessuna espansione)

Il piano del prompt è confermato senza correzioni sostanziali. Le sole precisazioni sono di riga.

### 7.1 `components/editor-v2/hooks/useJjomSync.ts` — **critical zone**

Quattro punti, tutti additivi.

1. `:1261` — dichiarare `const patchedNodeSizes = new Map<string, {width:number;height:number}|null>();`
   accanto a `patchedNodePositions`.
2. `:1370` — dopo il calcolo di `sizeChanged`, aggiungere il confronto top-level esattamente
   nella forma del prompt (`newSize`/`oldSize`/`topSizeChanged`), e `patchedNodeSizes.set(id, newSize)`
   accanto a `:1375`. **Non** aggiungere il ramo `if (!topSizeChanged) rfNode.width = existing.width`:
   `rfNode` va in cache così com'è (`:1378`), è l'output del trasformatore e deve restarlo.
3. `:1423-1434` — `hasNodeChanges` include `patchedNodeSizes.size > 0`; copia locale
   `_patchedNodeSizes`.
4. `:1443-1456` — nel `result.map`, gestire l'`id` presente in `_patchedNodeSizes` con
   `has()` (non con la verità del valore: `null` è un valore legittimo). Con un oggetto:
   `{...n, width, height, measured: undefined}`. Con `null`: destrutturare via
   `const { width, height, measured, ...rest } = n as any` e ritornare `rest`, le stesse tre
   chiavi di `resetNodeSize` (`EditorV2.tsx:2334-2335`).

Nessun'altra riga del file cambia.

### 7.2 `components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts`

`getLayoutKeyOf(state: any): string` con il corpo attuale di `getActiveLayoutKey`;
`getActiveLayoutKey()` diventa `return getLayoutKeyOf(store.getState())`. Nessun rename.
**Collisione verificata**: `command grep -rn "getLayoutKeyOf" …` esce `EXIT=1`, nome libero.

### 7.3 `components/editor-v2/viewpoint/ir/useContentSize.ts:101`

```ts
const isResized = useSelector((s: any) =>
    !!readVertexLayout((s?.idlookup?.[vertexId] ?? {}) as any, getLayoutKeyOf(s)).isResized);
```
Il selettore legge `s.viewpoint` attraverso la chiave, quindi si riesegue al cambio di layout
senza dipendenze aggiuntive, e continua a restituire un **primitivo**. Import nuovi: due (il
modulo puro e l'adapter). L'adapter tira `store` dal joiner: verificato che **nessun test**
importa `useContentSize.ts` (i due riferimenti in `shapeRegistry.ts:375` e
`shapeRegistry.test.ts:365` sono commenti), quindi nessuna suite nuova diventa rossa.

### 7.4 `components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx:158-163`

`manualSig` passa da `readVertexLayout(raw ?? {}, getLayoutKeyOf(s))`, stessa gate
(`isResized` più entrambe le dimensioni positive) e stessa firma primitiva `'WxH' | ''`.

**Arco di dipendenza**: `viewpoint/ir/` e `viewpoint/authoring/` → `viewpoint/layout/`, interno a
editor-v2, cartelle sorelle. Lo stesso arco che `utils/jjomTransformers.ts:33-34` già percorre.

---

## 8. Test

- **Nuovo**: `viewpoint/layout/__tests__/vertexLayoutAdapter.test.ts` per `getLayoutKeyOf` su
  stato sintetico — nessun viewpoint (`''`, `null`, `undefined`), viewpoint non esclusivo,
  viewpoint esclusivo, `idlookup` mancante, `state` nullo. **Nota di purezza**: il file importa
  l'adapter, che importa `store` dal joiner; se questo rendesse rossa una decima suite, il test va
  in un file gemello che replica la funzione, oppure si rinuncia. Verifica al primo `vitest run`
  del diff, e in caso l'esito si dichiara invece di forzarlo.
- **Non testabile**: la logica del patch in `useJjomSync` richiede DOM e store React Flow.
  Dichiarato, non aggirato.
- `__tests__/vertexLayout.test.ts` (19 test) non cambia: il modulo puro non è toccato.

## 9. Gate previsti a fine Fase 2

`npm run typecheck` → 33, lista **byte-identica** (`diff` vuoto contro `/tmp/tsc-baseline-1c.txt`).
`npx vitest run` → 1342 passed (più i nuovi), stesse 9 suite rosse.
`npm run build` → exit 0, solo il warning di chunk-size.
`npm run check:docs` → verde.

## 10. File letti

`CLAUDE.md`; `docs/decisions.md` (RC-3, RC-7..RC-10, R-LAY-14..17 come emendate);
`docs/reports/2026-08-24-lir-layout-slice1b.md` (§0-§10.6);
`docs/claude-code-log.md` (coda); `hooks/useJjomSync.ts` (1-60, 221-300, 1180-1480, 1528-1545);
`utils/jjomTransformers.ts` (1-130, 190-300, 370-395, 440);
`viewpoint/layout/vertexLayout.ts`, `vertexLayoutAdapter.ts` (interi);
`viewpoint/ir/useContentSize.ts` (intero); `viewpoint/authoring/SymbolEditorModal.tsx` (140-200);
`sync/canvasToJjom.ts` (90-170); `sync/syncState.ts` (1-115);
`EditorV2.tsx` (417, 575-576, 1110-1225, 1600-1650, 2323-2347, 3440-3510);
`utils/lastViewpoint.ts` (intero); `components/abstract/tabs/EditorSwitch.tsx` (40-120);
`redux/store.tsx` (86-160); `utils/ViewportCulling.ts` (170-200);
`node_modules/@xyflow/react/dist/esm/index.mjs` (2020-2135, 1920-1930);
`node_modules/@xyflow/system/dist/esm/index.js` (365-385, 771-780, 1560-1660, 1800-1860).

---

## 11. Domande al GO (nessuna decisa qui)

1. **Refresh degli archi**: il §4 conclude che non serve e propone di ometterlo. Confermi, o
   preferisci la cintura del precedente `resetNodeSize` (un `useStoreApi()` in più in
   `useJjomSync`)?
2. **Test dell'adapter**: se il nuovo file rende rossa una decima suite, preferisci il file
   gemello puro o la rinuncia al test?
3. Il resto del piano di Fase 2 è quello del prompt, confermato riga per riga.

**HARD STOP.** Fase 2 solo dopo il GO esplicito.

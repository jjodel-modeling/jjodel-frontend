# Prompt Claude Code: layout per viewpoint, slice 1c (taglie). La taglia segue il layout in forza

**Corsia completa (RC-3), critical zone (`useJjomSync.ts`, CLAUDE.md §3.2), effort xhigh.
Due fasi in questo stesso prompt: Fase 1 read-only con LIR salvato su file, hard stop, GO di
Alfonso in chat, poi Fase 2.** Leggere a inizio sessione: `CLAUDE.md`, `docs/decisions.md`
(R-LAY-14..17 come emendate il 2026-08-24), `docs/reports/2026-08-24-lir-layout-slice1b.md`
(addendum §10 incluso), `vertexLayout.ts` e `vertexLayoutAdapter.ts` com'erano a `cd8363ccc`,
e `docs/claude-code-log.md`. Conflitti con CLAUDE.md o col registro: segnalare e fermarsi.

## COSA

Difetto riprodotto a schermo da Alfonso dopo `cd8363ccc`: **la taglia di un nodo è la stessa
sotto ogni viewpoint e in sintassi astratta**, mentre la posizione è per layout. Lo strato D è
corretto (le scritture di `canvasToJjom.ts` e le letture di `jjomTransformers.ts` sono per
layout, come dichiarato al commit). Il difetto è a valle, nel ponte JjOM → React Flow, ed è
localizzato alla riga; questa slice lo chiude.

Il claim «la slice 1c decade» dell'addendum §10 vale per le **posizioni**, non per le taglie:
il ri-trasformare ogni vertice a ogni render (`Date.now()` nelle dipendenze,
`useJjomSync.ts:1528`) ripropaga la posizione ma non la taglia, per la ragione sotto. Questa
slice è quindi la 1c ristretta alle taglie.

### Root cause (letta in chat sul codice a `cd8363ccc`, da riverificare in Fase 1)

1. **`useJjomSync.ts:1357-1377`, ramo «property changes on existing elements».** Quando un
   vertice esistente viene ri-trasformato, sul nodo React Flow vengono ripropagati solo
   `position` (confronto `posChanged`, :1361-1362), `style` (confronto `sizeChanged` su
   `style.width/height`, che riguarda il solo `packageNode`, :1364-1373) e `data`. Il
   **`width`/`height` top-level** che `manualSizeOf` (`jjomTransformers.ts:70-80`) produce per
   class/enum/object **non viene mai confrontato né patchato**: il nodo conserva il
   `width`/`height` che aveva (dal `NodeResizer`, via `applyNodeChanges`, o dalla creazione).
   Effetto: al cambio di layout la posizione segue, la taglia resta quella dell'ultimo gesto,
   sotto qualunque chiave. È esattamente il sintomo osservato.
2. **Due lettori di `isResized`/`w`/`h` che leggono ancora gli scalari** (il seme), fuori dai
   sette siti del censimento 1b: `useContentSize.ts:101`
   (`s.idlookup[vertexId].isResized`, gate della taglia derivata dal contenuto per le forme con
   supplemento) e `SymbolEditorModal.tsx:156-162` (`manualSig` su `raw.isResized/w/h`). Con il
   seme non più riscritto da editor-v2, questi due leggono un `isResized` che nessun gesto
   nuovo tocca: la derivazione da contenuto e l'anteprima del Symbol Editor non vedono la
   taglia manuale del layout in forza.

Ipotesi da misurare, non da assumere: sul **reload**, se la prima costruzione dei nodi
(`useJjomSync.ts:1203-1207`) avviene prima del ripristino di `state.viewpoint` da
`project.activeViewpoint`, i nodi nascono con la taglia della chiave `__abstract__` e il
ripristino successivo ripropaga solo le posizioni. Se è così, il difetto si vede anche col
protocollo «reload dopo ogni cambio viewpoint» del GO della 1b, e la (1) lo chiude comunque.

## FASE 1 (read-only): LIR su `useJjomSync.ts` e censimento

Produrre **un solo file**, che vale sia da discovery report (obbligatorio, CLAUDE.md) sia da
Layer Impact Report per la critical zone:
`docs/discovery/discovery_2026-08-24_layout_slice1c_taglie_lir.md`. Modello per la parte LIR:
`docs/reports/2026-08-24-lir-layout-slice1b.md`. Contenuto minimo, con citazioni `file:riga`
correnti:

1. **Verifica della root cause (1)**: il ramo :1357-1377 e il patch differito
   :1427-1460 (`patchedNodeData/Positions/Styles`, `pendingNodePatchRef`). Confermare che
   `width`/`height` top-level non attraversano il patch. Confermare che `rfNodeCache` conserva
   l'output del trasformatore (non il nodo React Flow misurato), così un confronto
   trasformatore-contro-cache scatta solo quando cambia la taglia effettiva del layout.
2. **Ipotesi sul reload**: ordine tra prima costruzione dei nodi e ripristino di
   `state.viewpoint` all'apertura del progetto (chi lo ripristina, quando, `lastViewpoint.ts`
   e chiamanti). Esito: «si vede anche col reload» oppure «solo in sessione», con la prova.
3. **Censimento dei lettori di `isResized`/`w`/`h` fuori dal resolver**, con controllo
   positivo del grep (`command grep` con glob quotati, vedi checkpoint del 24/8): attesi
   `useContentSize.ts:101` e `SymbolEditorModal.tsx:156-162`; enumerare ogni altro. Per
   ciascuno: instradare o dichiarare, con motivo.
4. **Cosa fa React Flow** (`@xyflow/react`, versione da `package.json`) quando un nodo
   esistente riceve `width`/`height` nuovi, e quando gli vengono **tolti** insieme a
   `measured`: il precedente è `resetNodeSize` (`EditorV2.tsx:2330-2347`), che toglie le tre
   chiavi e poi chiama `updateNodeInternals` in doppio rAF perché gli archi seguano. Misurare
   se il flush di `useJjomSync` ha accesso a `updateNodeInternals` o a un equivalente
   (`DynamicHandles`?), o se la ri-misura di RF basta agli archi.
5. **Interazioni**: anti-bounce `isCanvasUpdated` (un resize dal canvas marca il vertice, il
   round trip non deve combattere il `NodeResizer` durante il gesto); `useContentDrivenSize`
   che scrive `width/height` in sessione per le forme con supplemento (se il patch toglie le
   chiavi al cambio layout, il hook deve riderivare, non oscillare: il suo budget
   `MAX_UNACCEPTED_WRITES` regge?); undo (`takeSnapshot` è dei gesti, un cambio layout non è un
   gesto: dichiarare, non risolvere; i due difetti dell'undo dell'addendum §10 restano fuori).
6. **Impatto per layer** (D-layer: zero atteso; reducer: zero; editor-v2: `useJjomSync`,
   `useContentSize`, `SymbolEditorModal`; classico: zero), rischi, piano dei diff file per
   file. Se emergono file oltre i quattro sotto, Regola 19: elencarli all'hard stop.

**Hard stop: report committato (`git add` del solo file) ed esposto in chat. Fase 2 solo dopo
il GO esplicito di Alfonso.**

## FASE 2 (dopo il GO): implementazione

Design proposto; il LIR può correggerlo, e il GO lo fissa.

### File (Regola 19: quattro, da confermare nel LIR)

1. **`components/editor-v2/hooks/useJjomSync.ts`**, ramo esistente :1357-1377 e patch
   differito :1427-1460, diff minimo accanto a `patchedNodePositions`:

   ```ts
   // Per-layout size (slice 1c): manualSizeOf puts width/height top-level on the
   // transformer output; compare transformer against cache, like position.
   const newSize = rfNode.width !== undefined && rfNode.height !== undefined
       ? { width: rfNode.width, height: rfNode.height } : null;
   const oldSize = existing.width !== undefined && existing.height !== undefined
       ? { width: existing.width, height: existing.height } : null;
   const topSizeChanged = (newSize === null) !== (oldSize === null)
       || (newSize !== null && oldSize !== null
           && (newSize.width !== oldSize.width || newSize.height !== oldSize.height));
   if (topSizeChanged) patchedNodeSizes.set(id, newSize);
   ```

   Nel patch differito, per ogni `id` in `_patchedNodeSizes`: con un oggetto, `{...n, width,
   height}` e `measured` tolto; con `null`, togliere `width`, `height`, `measured` (le stesse
   tre chiavi di `resetNodeSize`, :2334-2335), così il nodo torna a stringere il contenuto.
   `hasNodeChanges` include `patchedNodeSizes.size > 0`. Dopo il flush, il refresh degli archi
   secondo l'esito del punto 4 del LIR (doppio rAF + `updateNodeInternals` per gli id patchati,
   o niente se la ri-misura basta). Nessun'altra riga del file cambia: il `Date.now()` nelle
   dipendenze e la guardia `prevModel = {}` (:1344) restano come sono, sono un fronte loro.
2. **`components/editor-v2/viewpoint/layout/vertexLayoutAdapter.ts`**: aggiungere una
   variante che accetta lo stato, per i selettori, senza rinominare nulla:

   ```ts
   /** Same as getActiveLayoutKey, on a state already in hand (for useSelector). */
   export function getLayoutKeyOf(state: any): string;
   ```

   `getActiveLayoutKey()` delega a `getLayoutKeyOf(store.getState())`. Verificare con grep che
   il nome sia libero.
3. **`components/editor-v2/viewpoint/ir/useContentSize.ts:101`**: il selettore legge
   `readVertexLayout(raw, getLayoutKeyOf(s)).isResized` (con `raw = s.idlookup[vertexId]`,
   guardia su assente). Il selettore legge `s.viewpoint` attraverso la chiave, quindi si
   riesegue al cambio layout senza altre dipendenze.
4. **`components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx:156-162`**: `manualSig`
   passa da `readVertexLayout(raw, getLayoutKeyOf(s))`, stessa gate di `manualSizeOf`
   (entrambe le dimensioni positive), stessa firma primitiva.

Import: `readVertexLayout` dal modulo puro, `getLayoutKeyOf` dall'adapter; l'arco
`viewpoint/ir/` e `viewpoint/authoring/` → `viewpoint/layout/` è interno a editor-v2.

### Non-obiettivi (dichiarati, non risolti)

- Il proxy L (`set_size`, `set_w`, `set_h`, `LVoidVertex`) resta sugli scalari (GO della 1b,
  emendamento a R-LAY-16 a carico della chat).
- Undo: i due difetti dell'addendum §10 e l'interazione con il cambio layout.
- `Date.now()` nelle dipendenze e `prevModel = {}` in `useJjomSync.ts`.
- La taglia `style.width/height` del `packageNode` (:243-244), già per layout via
  `effectiveLayoutOf` e già patchata via `patchedNodeStyles`.

### Gate

`tsc` con lista **byte-identica** alla baseline (33, `diff` vuoto), vitest **1342 passed** con
le stesse 9 suite rosse, build exit 0, `check:docs`. Se un test nuovo senza DOM ha senso per
`getLayoutKeyOf` (stato sintetico: nessun viewpoint, viewpoint non esclusivo, esclusivo,
`idlookup` mancante), aggiungerlo a `__tests__/vertexLayout.test.ts` o a un file gemello
nell'adapter; la logica del patch in `useJjomSync` non si testa senza DOM, e lo si dichiara.

### Verifica visiva (Alfonso, dopo il commit di Fase 2, hard refresh)

1. Sotto il viewpoint esclusivo `A`: ridimensiona un nodo. Passa a sintassi astratta **senza
   reload**: il nodo torna alla taglia da contenuto. Torna ad `A`: ridimensionato.
2. Reload sotto `A`: ridimensionato. Reload sotto sintassi astratta: da contenuto.
3. Ridimensiona lo stesso nodo anche sotto `B` con una taglia diversa; alterna `A`, `B`,
   astratta: tre taglie distinte, gli archi seguono senza handle staccati.
4. «Reset size» sotto `A`: `A` torna da contenuto, `B` conserva la sua.
5. Regressione zero su un progetto senza dizionario (mai toccato dopo la 1b): sotto ogni
   layout si vede la taglia di oggi, seme compreso se `isResized` era già vero.
6. Forma con supplemento (ellisse, rombo) in un viewpoint: ridimensiona, poi cambia layout e
   torna: la derivazione da contenuto riparte sotto il layout non ridimensionato, senza
   oscillazioni (console pulita da write ripetute).

### Chiusura

Entry in `docs/claude-code-log.md` (dopo la conferma visiva), commit `fix(layout): ...` con
`git add` dei soli file toccati, esito in chat con la lista dei file e l'esito gate per gate.

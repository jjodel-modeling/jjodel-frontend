# Discovery (read-only) — Read-back della size degli object node IR (persistenza resize al reload)

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl` (ahead of origin — numeri di riga confermati sui file reali)
**Tipo**: discovery Fase 1 (read-only). Nessun edit al codice, nessun commit, nessun tocco al WIP.
**Nome documento prompt**: 2026-07-28 20:56

---

## Obiettivo

Stabilire come far sopravvivere al reload la size di un object node IR ridimensionato, **senza
rompere il content-hug** dei box mai ridimensionati, e — obiettivo n.1 — verificare l'insight:
emettere la size come **`width`/`height` TOP-LEVEL** sul nodo RF (non `style`)
- **(a)** compone con `ir-sized` (Commit 2) → al load il box rende alla size salvata;
- **(b)** **NON** risveglia il gate `sizeChanged` di `useJjomSync` → niente critical zone, niente LIR.

## Verdetto in una riga

**(a) e (b) CONFERMATE.** L'emissione top-level compone con `ir-sized` e non tocca il gate (che
guarda `style`). La fetta è **leggera**: perimetro atteso = **solo `objectVertexToRFNode`**, **niente
LIR**. Persistenza D-layer end-to-end **confermata**.

## File letti / analizzati (path completi)

Diretti: `hooks/useJjomSync.ts` (gate + patch, **critical zone, sola lettura**),
`utils/jjomTransformers.ts` (`objectVertexToRFNode`/callers), `EditorV2.tsx` (build nodi),
+ findings ereditati da `discovery_2026-07-28_size_geometry_reconciliation.md`.
Via agente read-only (persistenza): `sync/canvasToJjom.ts`, `model/dataStructure/GraphDataElements.tsx`,
`common/U.tsx`, `api/persistance/projects.ts`, `redux/reducer/reducer.ts`, `topbar/SaveManager.ts`,
`redux/VersionFixer.tsx`.

---

## Findings

### Q1 — Discriminante content-hug vs persistito

`DVertex.w/h` sono **campi D-layer persistiti** (non getter): `GraphDataElements.tsx:96-97` (base
`DGraphElement`, `w!: number; h!: number`), ridichiarati `:1680-1681` su `DVertex`. (Le `w/h` L-layer
a `:174-175` sono commentate `// fittizi` = derivate; le D-layer sono le raw persistite, target di
`SetFieldAction`.)

**Ma non sono defaultate alla creazione** → per un object node mai ridimensionato `raw.w/raw.h` sono
**`undefined`/assenti** (non 0, non un default): `defaultVertexSize = undefined`
(`GraphDataElements.tsx:1088`), `DVoidVertex` (`joiner/classes.ts:1323`) setta x/y ma non w/h quando
`defaultVSize` è undefined. Diventano numeri **solo** dopo `syncSizeToJjom` (resize).

`objectVertexToRFNode` legge `raw = vertex.__raw ?? vertex` e `raw.x/raw.y` (`jjomTransformers.ts:243`,
lettura x/y ~:324-326) e **non** emette width/height/style (return `:328`). → la Fase 2 legge
`raw.w/raw.h` **allo stesso punto** ed emette top-level **solo quando `typeof === 'number'`**.

**Contrasto con `packageVertexToRFNode`** (`:221-232`): usa un **fallback numerico 400/300**
(`typeof raw.w === 'number' ? raw.w : 400`). Per gli object node **"assente" deve significare NON
emettere** (nessun fallback numerico), altrimenti ogni box mai ridimensionato riceverebbe una size
esplicita e perderebbe il content-hug.

### Q2 — Emissione TOP-LEVEL e composizione con `ir-sized` → (a) CONFERMATA

Catena: `objectVertexToRFNode` emette `width`/`height` **top-level** (come già fanno `NodeResizer` e la
propagazione, `EditorV2.tsx:993-995` `n.width/n.height`) → il nodo è costruito via
`jjomVertexToRFNode` sia sul path di **add/iniziale** (`useJjomSync.ts:1205`, aggiunto as-is a
`:1460-1461`) sia in `EditorV2.tsx:660` → React Flow rispetta `width/height` top-level come dimensione
del nodo e la espone in `nodeLookup` → `ObjectNode` legge
`useStore(s => s.nodeLookup.get(id)?.width != null && ...height != null)` (Commit 2) → `hasExplicitSize`
true → marker **`ir-sized`** → `.mm-node.ir-sized { min:0; width/height:100% }` + `.mm-node.ir-sized
.ir-node-content { min:0 }` (irStyle.ts) → il box riempie e rende **alla size salvata**.

**Conferma indiretta forte**: la propagazione già scrive top-level `n.width/n.height` e il marker
`ir-sized` (Commit 2, appena landato) già lo legge da `nodeLookup.get(id).width` — quindi
"top-level → nodeLookup.width → ir-sized" è un percorso **già funzionante**. → **(a) TRUE**.

### Q3 — Risveglio del gate `useJjomSync` → (b) CONFERMATA (il verdetto critico)

Il gate `sizeChanged` (`useJjomSync.ts:1364-1370`, **sola lettura**) confronta **esclusivamente**
`rfNode.style.width/height`:
```
const newW = (rfNode.style as any)?.width;  // :1365
...
const sizeChanged = (newW !== undefined || oldW !== undefined) && (newW !== oldW || newH !== oldH); // :1369-1370
```
E l'applicazione della patch (`:1443-1458`) applica **solo** `data`/`position`/`style`:
```
...(newData ? { data: newData } : {}), ...(newPos ? { position: newPos } : {}), ...(newStyle ? { style: newStyle } : {}), // :1451-1453
```
**Mai** width/height top-level. Gli object node continuano a **non** emettere `style`. Quindi
emettere width/height **top-level**:
- non entra nel confronto `sizeChanged` (che guarda `style`) → il gate resta **dormiente**;
- non viene ri-patchato sui nodi esistenti (la patch tocca solo data/pos/style) → **nessun loop**;
- sul path di **add/iniziale** (`:1460-1461`) il nodo è aggiunto as-is con la sua width/height
  top-level → al **load** il nodo nasce già dimensionato.

→ **(b) TRUE**: l'emissione top-level **non risveglia** il gate né alcun reconcile. **Niente critical
zone, niente LIR.**

**Caveat (scope boundary)**: poiché la patch degli **esistenti** non tocca width/height top-level, un
cambio **live** di `raw.w/h` in JjOM (dopo il load) **non** verrebbe propagato ai nodi già montati via
`useJjomSync`. Il read-back funziona sul path **load/add** — che è **esattamente** il caso reload. La
sync live cross-editor della size resterebbe fuori (non è il requisito).

### Q4 — Preservazione content-hug + interazione Commit 1/2

- **Emit only-if-present** (Q1): un box mai ridimensionato → nessun `raw.w/h` → nessuna emissione →
  content-hug preservato, con il **floor Commit-1** su `.ir-node-content` (`min-width:140; min-height:40`)
  che chiude l'edge-gap. ✓
- **`nodeSizing.ts`** (`NODE_SIZING_DEFAULTS.objectNode = {adaptWidth:true, adaptHeight:true}`,
  `isNodeResizable`, `SHAPE_MIN_SIZE`): una `width/height` **esplicita** top-level fa usare a RF quella
  dimensione (adapt di fatto disattivato per **quel** nodo); i box senza size esplicita restano
  content-hug. Il gate `isNodeResizable(canResize)` per montare il `<NodeResizer>` è invariato.
- **Nodo ricaricato con size < 40px**: al load ha width/height top-level → `ir-sized` →
  `.mm-node.ir-sized .ir-node-content { min:0 }` (Commit 2) azzera il floor Commit-1 → rende **sotto**
  i 40px. ✓ Composizione con Commit 1/2 **coerente**.

### Q5 — Persistenza end-to-end → CONFERMATA (YES)

- **Write**: `syncSizeToJjom` scrive `DVertex.w/h` via `SetFieldAction` in TRANSACTION
  (`canvasToJjom.ts:72-78`; batch `:84-93`).
- **Serialize**: `U.compressedState` (`common/U.tsx:427-441`) fa `JSON.stringify` dell'intero
  `idlookup` (ogni D-record DVertex con le sue `w/h` number incluse), invocato dal save
  (`api/persistance/projects.ts:107-108`), persistito su localStorage/backend.
- **Load**: `reducer.ts:1564-1570` → `SaveManager.load` (`topbar/SaveManager.ts:44,56-57`) →
  `VersionFixer.update` → `LoadAction` → `reducer.ts:518-519` rimpiazza `idlookup` **wholesale**.
- **Nessun clear/migrate**: `VersionFixer.removeNullPtrs('DVertex', [...])` (`VersionFixer.tsx:291`,
  `:364-398`) itera **solo** le chiavi pointer nominate (`instances/instanceof/node/model/annotations/graph/subElements`);
  `w/h` non sono in lista → intatte. Le migration DVertex (`:835/:840` ghostOffsets) non toccano w/h.

→ dopo resize + save + reload, `vertex.__raw.w/.h` sono **numeri** in `idlookup`. La size è rileggibile
dal transformer.

### Q6 — Gate `resizable` nel read-back (proposta, NON decisa)

`objectVertexToRFNode` **non** conosce la view IR risolta né il flag `resizable`: la risoluzione IR
avviene **a valle** in `ObjectNode` (`useIRView`), non nel transformer. Quindi il transformer non può
gaterare direttamente sul flag. Opzioni:
- **(i) Emit se `raw.w/h` presenti, a prescindere dal flag** (più semplice/leggera): onora qualunque
  size persistita. Edge case: una view portata a `resizable:false` (o undefined) con un vecchio `w/h`
  sul DVertex renderebbe alla vecchia size + `ir-sized`. Comportamento "onora la geometria persistita".
- **(ii) Gate a valle in `ObjectNode`**: ma il transformer ha già messo width/height top-level →
  `ir-sized` è già attivo; `ObjectNode` dovrebbe **stripparle/override** quando `!resizable` (più
  complesso, tocca il render-side).
- **(iii) Write-side**: azzerare `DVertex.w/h` quando si disattiva `resizable` (pulizia alla fonte).
- **Raccomando (i)** per la fetta minima, segnalando l'edge case "stale size su view non-resizable".
  Decisione ad Alfonso.

### Q7 — Verdetto perimetro + critical-zone

- Se **Q6 = (i)**: perimetro = **`utils/jjomTransformers.ts` (`objectVertexToRFNode`)** soltanto (legge
  `raw.w/raw.h` accanto a x/y, emette top-level `width/height` se number). → **niente LIR**.
- Se si vuole il gate `resizable` a valle (Q6-ii): + `nodes/ObjectNode.tsx` (non critical zone). → **niente LIR**.
- `hooks/useJjomSync.ts` **NON** entra in gioco (Q3: l'emissione top-level non risveglia il gate
  `style`-based). → **niente LIR.**

**Verdetto**: fetta **leggera**, **1 file** (transformer) nel caso base, **fuori critical zone**,
**LIR non richiesto**.

---

## Verdetto sull'insight top-level

- **(a) top-level compone con `ir-sized`**: **TRUE** (percorso già funzionante via propagazione + Commit 2).
- **(b) top-level NON risveglia il gate**: **TRUE** (il gate confronta `style`, la patch tocca solo
  data/pos/style; top-level è invisibile al gate e non ri-patchato). → **niente critical zone / LIR.**

## Strategia content-hug

Emissione **condizionata** a `typeof raw.w === 'number' && typeof raw.h === 'number'` (mai un fallback
numerico come packageNode). Assente → nessuna emissione → content-hug + floor Commit-1. Preserva
class-diagram a compartimenti e ogni object node auto-misurato.

## File che la Fase 2 dovrà toccare (proposta)

| File | Ruolo | Critical zone |
|---|---|---|
| `utils/jjomTransformers.ts` (`objectVertexToRFNode`) | leggere `raw.w/raw.h` accanto a x/y; emettere `width/height` top-level **solo se number** | no |
| `nodes/ObjectNode.tsx` | **solo se** Q6-ii (gate `resizable` a valle) | no |
| `docs/claude-code-log.md` | entry | no |

**Fuori scope**: `hooks/useJjomSync.ts` (Q3: non serve), `portDistribution.ts`, `canvasToJjom.ts`
(già scrive w/h), `irStyle.ts`/`ObjectNode` marker (Commit 1/2 già landati/compongono), `irTypes.ts`
(niente schema nuovo — la size vive già su DVertex.w/h).

## Rischi

- **Live sync boundary (Q3 caveat)**: il read-back copre load/reload, non la propagazione live di un
  cambio `raw.w/h` cross-editor a runtime. Se in futuro serve, richiederebbe di patchare width/height
  top-level anche sui nodi esistenti in `useJjomSync` → **quello** entrerebbe in critical zone (LIR).
- **Stale size su view non-resizable (Q6)**: con l'opzione (i), una view che aveva una size e poi
  passa a `resizable:false` continuerebbe a rendere alla size persistita. Decidere se onorare o pulire.
- **Interazione col resizer floor**: verificata a livello CSS (Commit 2 azzera il min sotto `ir-sized`);
  confermare a schermo che una size < SHAPE_MIN_SIZE persistita renda correttamente.

## Domande aperte per Alfonso

1. **Gate `resizable` (Q6)**: read-back per qualunque `w/h` persistito (opzione i, minima) o solo per
   view `resizable` (ii/iii)? Come trattare una size stantia su una view non più resizable?
2. **Scope live sync**: confermi che basta il read-back su load (reload), senza la propagazione live
   cross-editor della size (che sarebbe critical zone)?
3. **Emit condizionale**: OK gate `typeof number` (assente → non emettere), coerente con la strategia
   content-hug?

---

## Hard stop

Report scritto. **STOP.** Nessun edit al codice, nessun commit, nessun `git add`. L'analisi prosegue
in chat da questo documento.

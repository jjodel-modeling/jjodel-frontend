# Discovery 2026-07-27 — read-back della size per gli object node (persistenza resize al reload)

> **Fase 1 di un two-phase. Read-only.** Nessun edit al codice di feature, nessun commit.
> Questo report mappa come emettere la size di un object node dal transformer senza rompere il
> content-hug, riconcilia `style.width/height` vs `width/height` top-level, e valuta il risveglio
> del gate `useJjomSync`. Branch: `alfonso-frontend-jjtl`.

## Obiettivo (Fase 2, NON implementata ora)

Far si' che un object node ridimensionato (w/h persistiti sul DVertex) **rilegga** la size al
reload/rebuild e la mantenga, **senza rompere il content-hug** dei box a compartimenti mai
ridimensionati. Prima la persistenza (questo read-back), poi la propagazione (feature separata,
`discovery_2026-07-27_size_propagation.md`).

## File letti / analizzati (path completi)

- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`objectVertexToRFNode`, `packageVertexToRFNode`, `classVertexToRFNode`, `computeOptimalHandles`)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (initial build, incremental sync, gate `sizeChanged`, patch surgico)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (`syncSizeToJjom`, `createVertexForObject`, `syncCreateObject`)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR, `useIRView`, `canResize`, `NodeResizer`)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (`NODE_SIZING_DEFAULTS`, `isNodeResizable`, `defaultResizableForForm`)
- `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` (full project save)
- `frontend/src/components/editor-v2/EditorV2.tsx` (resize handler `:3543-3552`, `resetNodeSize` `:2255-2266`, rate-limiter `:3569-3600`)
- `frontend/src/model/dataStructure/GraphDataElements.tsx` (classe `DVoidVertex`, campi `x/y/w/h/isResized`, `DVoidVertex.new`, `set_isResized`)
- `frontend/src/joiner/classes.ts` (costruttore `Constructors.DVoidVertex`, `isResized = false`)
- `frontend/src/joiner/types.ts` (`InitialVertexSizeObj`)
- `frontend/src/components/contextMenu/ContextMenu.tsx` (toggle `isResized` — auto-sizing classic)

---

## Q1 — Discriminante content-hug vs fixed: **`isResized`, non la presenza di w/h**

### I campi w/h esistono SEMPRE (con default), quindi NON discriminano il resize

Il DVertex e' `DVoidVertex` (`GraphDataElements.tsx:1319`), con i campi **top-level**:

```ts
// GraphDataElements.tsx:1337-1341
x!: number;
y!: number;
w!: number;
h!: number;
isResized!: boolean;
```

Il costruttore (`classes.ts:1323-1355`, `Constructors.DVoidVertex`) imposta **sempre**
`isResized = false` (`:1342`) e scrive w/h **solo se** il `defaultVSizeObj` li fornisce
(`:1351-1355`):

```ts
// classes.ts:1342
thiss.isResized = false;
// ...
// classes.ts:1354-1355
if (defaultVSizeObj.w !== undefined) thiss.w = defaultVSizeObj.w;
if (defaultVSizeObj.h !== undefined) thiss.h = defaultVSizeObj.h;
```

**Ma gli object node creati in v2-flow ricevono SEMPRE w/h di default.** `createVertexForObject`
(`canvasToJjom.ts:1239-1255`) usa default `w = 200, h = 80` e costruisce una `GraphSize`:

```ts
// canvasToJjom.ts:1244-1249
w: number = 200,
h: number = 80,
): string | false {
    try {
        const size = new GraphSize(x, y, w, h);
        const dv = DVertex.new(0, dObjectId, graphId, graphId, undefined, size);
```

`syncCreateObject` la chiama senza w/h (`canvasToJjom.ts:1318`: `createVertexForObject(graphId,
dObject.id, x, y)`), quindi ogni object node nasce con `raw.w = 200, raw.h = 80` **anche se rende
content-hug** (perche' `objectVertexToRFNode` oggi non li rilegge — nota Q1 di
`size_propagation.md`). **Conclusione**: `typeof raw.w === 'number'` e' **vero anche per i box mai
ridimensionati** → usarlo come gate romperebbe il content-hug di tutti gli object node
(diventerebbero fissi 200×80).

### Il discriminante corretto e' `isResized`

`isResized` e' `false` alla costruzione e diventa `true` **solo** su resize esplicito (o
"Disable auto-sizing" del ContextMenu classic). E' il flag semantico gia' esistente per
"content-hug vs dimensione fissa":

```ts
// ContextMenu.tsx:443-444
if (gn.isResized) ContextEntry('asize', icon['contract'], 'Restore auto-sizing', () => {gn.isResized = false; ...}, []);
else ContextEntry('nasize', icon['expand'], 'Disable auto-sizing', () => {gn.isResized = true}, []);
```

Setter L-layer canonico (`GraphDataElements.tsx:1389-1396`): `set_isResized` → `SetFieldAction.new(c.data.id, "isResized", val)`.

**Confronto con `packageVertexToRFNode`** (`jjomTransformers.ts:221-222`): per i package "assenza =
fallback numerico" (default 400/300). Per gli object node la logica va **rovesciata**: "assenza di
resize (`isResized !== true`) = **non emettere** width/height" (content-hug), non un fallback
numerico. La presenza numerica di w/h **non** basta come segnale.

**Emendamento richiesto in Fase 2**: `syncSizeToJjom` oggi scrive **solo** w/h, **non** `isResized`
(`canvasToJjom.ts:72-78`). Perche' esista qualcosa da rileggere, il write-path del resize deve
anche settare `isResized = true` (vedi Q7).

---

## Q2 — `style.width/height` vs `width/height` top-level: **emettere TOP-LEVEL**

### Come RF risolve la size in questo codebase

- `packageVertexToRFNode` emette **`style.width/height`** (`jjomTransformers.ts:228-232`).
- Il **NodeResizer scrive `width`/`height` top-level** sul nodo RF (via `applyNodeChanges`).
  Confermato verbatim dal commento di `resetNodeSize` (`EditorV2.tsx:2250-2254`):

  ```ts
  // drag writes explicit width/height on the node (top-level, via applyNodeChanges);
  // object/class/enum have no transformer style size, so dropping those keys lets
  // the card hug its content again (the `.mm-node { height:100% }` rule goes inert
  // once the wrapper has no explicit height).
  ```

  e dal destructuring che ripristina il content-hug rimuovendo **le chiavi top-level**:

  ```ts
  // EditorV2.tsx:2260
  const { width, height, measured, ...rest } = n as any;
  ```

- Il content-hug in editor-v2 nasce dall'**assenza** di width/height sul nodo RF: RF misura il DOM e
  `.mm-node { height:100% }` resta inerte. Con width/height presenti (top-level **o** style) il
  wrapper e' dimensionato e `.mm-node` lo riempie.

Quindi **entrambe** le forme dimensionano il box; la differenza e' *quale* campo osservano gli altri
attori: il **resizer** e `resetNodeSize` lavorano su **top-level**; il **gate `sizeChanged`** e
`packageVertexToRFNode` su **style**.

### Decisione: object node → **top-level `width`/`height`**

`objectVertexToRFNode` deve emettere **top-level `width`/`height`** (NON `style`), gated su
`isResized`. Motivi:

1. **Unica sorgente di verita'.** Il resizer scrive top-level, `resetNodeSize` cancella top-level;
   emettendo top-level anche il transformer, i tre attori toccano **lo stesso campo** — nessun
   conflitto style/top-level.
2. **Nessun clobber dei resize in-sessione.** Il patch surgico applica solo `data`/`position`/`style`
   (`useJjomSync.ts:1449-1454`) — **non** tocca `width`/`height` top-level. Quindi un property-change
   (es. edit di un feature value) non sovrascrive la size ridimensionata a mano.
3. **Gate `sizeChanged` resta dormiente** (legge `style`, `useJjomSync.ts:1365-1370`) → **nessun
   nuovo rischio di reconcile/loop** (vedi Q3). Emettere `style` invece **sveglierebbe** il gate e
   creerebbe due sorgenti (style dal patch, top-level dal resizer) sullo stesso wrapper.

Emettere `style` come i package sarebbe coerente col gate ma introdurrebbe il conflitto style-vs-top-level
proprio nel momento del resize manuale. **Top-level e' la scelta a minor rischio.**

---

## Q3 — Risveglio del gate `useJjomSync`: **con top-level NON si sveglia → nessun rischio**

Il gate (`useJjomSync.ts:1364-1376`) calcola `sizeChanged` **solo su `style.width/height`**:

```ts
// useJjomSync.ts:1364-1370
// Check if size changed (packageNode uses style.width/height)
const newW = (rfNode.style as any)?.width;
const newH = (rfNode.style as any)?.height;
const oldW = (existing.style as any)?.width;
const oldH = (existing.style as any)?.height;
const sizeChanged = (newW !== undefined || oldW !== undefined)
                 && (newW !== oldW || newH !== oldH);
```

Con la decisione Q2 (emettere **top-level**), `objectVertexToRFNode` **non produce `style`** →
`newW/oldW` restano `undefined` → `sizeChanged === false` → il gate **resta dormiente per gli object
node, esattamente come oggi**. Il read-back avviene **solo** al full-transform (initial build,
`useJjomSync.ts:1203-1227`, e node-add `:1279-1285`), non tramite patch surgico.

### Ordine eventi durante un resize manuale (con Fase 2 attiva)

1. NodeResizer scrive `width`/`height` **top-level** sul nodo RF (in-sessione, via `applyNodeChanges`).
2. `onNodesChange` → ramo resize (`EditorV2.tsx:3543-3552`) → `syncSizeToJjom(id, w, h)` scrive
   `DVertex.w/h` (+ `isResized = true` in Fase 2), con `markCanvasUpdated(id)` (anti-bounce).
3. `useJjomSync` durante l'anti-bounce **salta** l'elemento nel pass property-change
   (`useJjomSync.ts:1337`: `if (isCanvasUpdated(id)) continue;`) → nessun re-transform immediato.
4. A anti-bounce scaduto, un eventuale re-transform produce top-level width/height **ma il patch
   surgico li ignora** (applica solo data/position/style, `:1449-1454`) → la size in-sessione (dal
   resizer) **non viene toccata**.

**Verdetto rischio**: con emissione **top-level**, **nessun conflitto** tra valore del resizer e
valore ripatchato, **nessun loop di rimisura** (il gate non si attiva, il patch non tocca top-level).
Il rischio esisterebbe SOLO se si scegliesse di emettere `style` e/o svegliare il gate — scelta
**sconsigliata**. `useJjomSync.ts` **non va toccato** in Fase 2 (resta sola-lettura).

---

## Q4 — Preservazione del content-hug: OK per tutti e tre i casi

`NODE_SIZING_DEFAULTS.objectNode = {adaptWidth:true, adaptHeight:true}` (`nodeSizing.ts:11`) e'
consumato **solo** da `isNodeResizable` (`:24-29`) per decidere se **montare** il NodeResizer —
**non** controlla la size resa. La size resa dipende dall'assenza/presenza di width/height sul nodo
RF (Q2). Quindi una width/height esplicita e la mappa adapt **coesistono**: l'adapt gestisce il
montaggio del resizer, la width/height esplicita disattiva il content-hug visivo (come un resize
manuale, `resetNodeSize` comment `:2250-2254`).

- **(a) Box a compartimenti mai ridimensionati** (`isResized === false`): il transformer **non
  emette** width/height → content-hug preservato. ✓
- **(b) Altri object node auto-misurati** (`isResized === false`): idem, invariati. ✓
- **(c) Package node**: `packageVertexToRFNode` (`jjomTransformers.ts:215-237`) e' **fuori scope** —
  non legge `isResized`, continua a emettere `style.width/height` con default 400/300; Fase 2 tocca
  **solo** `objectVertexToRFNode`. Nessun impatto. ✓

**Strategia**: emettere width/height **solo quando `raw.isResized === true`**; l'assenza di resize
significa "non emettere" (non un fallback numerico). Questo preserva il content-hug a prescindere
dai w/h "stale" (200×80) scritti alla creazione.

---

## Q5 — Gate `resizable`: il transformer NON conosce la view → gate su `isResized` soltanto

`objectVertexToRFNode(vertex)` (`jjomTransformers.ts:243-244`) ha in scope **solo** la L-proxy
`vertex`; **non** risolve la IR view ne' il flag `resizable`. La risoluzione IR avviene **render-time
in `ObjectNode`** via `useIRView(id, data.instanceOfClassId)` (`ObjectNode.tsx:50`), **dopo** il
transform; `canResize` e' calcolato li' (`ObjectNode.tsx:378-381`).

**Chi chiama `objectVertexToRFNode`** (via `jjomVertexToRFNode`): initial build
(`useJjomSync.ts:1205`), node-add (`:1279`), patch surgico (`:1357`), e `EditorV2.tsx:658`/`:3289` —
in **tutti** i casi solo la L-proxy `vertex` e' in scope, mai la view risolta.

**Raccomandazione**: gate del read-back **solo su `raw.isResized`**, senza risolvere la view nel
transformer. Razionale: `isResized` diventa `true` **solo** se il resizer era montato, cioe' se la
view era `resizable` (o forma geometrica) al momento del resize — quindi un nodo `isResized` era
resizable per costruzione. Rileggerne la size e' coerente.

- **Costo alternativa "gate su resizable nel transformer"**: richiederebbe `getIRIndex(store.getState())`
  + `resolveIRView` **per ogni object vertex** dentro una funzione pura, accoppiando il transformer
  all'indice IR + store. E' lo stesso costo che `ObjectNode` paga gia' per-render, ma sposta un
  concern render-time in un transformer puro → **smell architetturale**. Sconsigliato per Fase 2.
- **Edge case** (view resa non-resizable *dopo* un resize): il nodo resterebbe fisso per via di
  `isResized` stale. Raro e discutibilmente accettabile (l'utente aveva ridimensionato esplicitamente).
  Se Alfonso vuole gating stretto sul `resizable` corrente, e' una scelta piu' grande (view lookup o
  strip render-time) → **domanda aperta**.

---

## Q6 — Persistenza e reload end-to-end: confermato (con l'aggiunta di `isResized`)

1. **Resize** → `EditorV2.tsx:3543-3552` → `syncSizeToJjom(c.id, w, h)`.
2. **Write D-layer**: `syncSizeToJjom` (`canvasToJjom.ts:72-78`) scrive `DVertex.w/h` via
   `SetFieldAction`; **Fase 2 aggiunge `isResized = true`** nella stessa TRANSACTION.
3. **Serializzazione**: `useLayoutAutosave` (`useLayoutAutosave.ts:31-60`) → `ProjectsApi.save(project)`
   (`:50`) — full project save che serializza `state.idlookup`, incluso il DVertex con `w`, `h`,
   `isResized` (campi top-level su `DVoidVertex`, `GraphDataElements.tsx:1337-1341`). Sono `SetFieldAction`
   su idlookup → **persistiti**.
4. **Reload** → initial build `useJjomSync.ts:1203-1227`: per ogni vertice `jjomVertexToRFNode(v)`
   (`:1205`) e `setNodes(rfNodesToSet)` (`:1227`) verbatim. Con il fix, `objectVertexToRFNode`
   rilegge `raw.isResized` + `raw.w/raw.h` ed emette **top-level width/height** → RF rende alla size
   persistita. ✓

Il punto di rilettura e' `useJjomSync.ts:1205` (initial build) e `:1279` (node-add); il punto di
scrittura e' `canvasToJjom.ts:72-78` (`syncSizeToJjom`).

---

## Q7 — Verdetto critical-zone + perimetro Fase 2

### File che la Fase 2 dovra' toccare (proposta)

| File | Modifica | Critical-zone |
|------|----------|:---:|
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | `objectVertexToRFNode`: se `raw.isResized === true` e `raw.w/raw.h` sono `number`, emettere **top-level `width`/`height`**; altrimenti nulla (content-hug) | no (transformer di render; propaga al layer Canvas v2-flow) |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | `syncSizeToJjom`: aggiungere `SetFieldAction.new(vertexId, 'isResized', true, ...)` nella TRANSACTION esistente | **SI'** (§3.1) |

`hooks/useJjomSync.ts` (critical zone) **NON va toccato**: con l'emissione top-level il gate resta
dormiente e non serve svegliarlo. `ObjectNode.tsx` e `nodeSizing.ts` **non** vanno toccati per il
read-back minimo.

**Nota architetturale su `syncSizeToJjom`**: settare `isResized` **qui** (non in EditorV2) fa si' che
sia il resize manuale sia la **futura feature di propagazione** (che riusa `syncSizeToJjom`, cfr.
`size_propagation.md` Q4) impostino `isResized` in modo uniforme → i target propagati diventano
fissi e sopravvivono al reload "gratis". E' l'home corretto.

### VERDETTO CRITICAL-ZONE — **LIR OBBLIGATORIO in Fase 2**

Motivazione: (1) la Fase 2 **scrive nel D-layer** un campo aggiuntivo (`DVertex.isResized`) via
`SetFieldAction near sync` in `canvasToJjom.ts`, file **critical-zone §3.1** — rientra nella regola
20 ("change che propaga a D-layer/sync → pausa e report") e §3.2 ("D-layer write paths ...
`SetFieldAction` near sync"). (2) La modifica al transformer **propaga al layer Canvas v2-flow**
(nuova geometria emessa). (3) Effetto **cross-editor**: `isResized = true` scritto in v2-flow cambia
la semantica del vertice anche nell'editor **classic** ("Disable auto-sizing"), da annotare nel LIR
come interazione cross-layer (JjOM + classic). Sono 2 file (< soglia 5), ma con write critical-adjacent.

**Pattern TRANSACTION**: sicuro — `syncSizeToJjom` usa solo `SetFieldAction` su campi esistenti
(nessun `.new()` costruttore wrappato, quindi §3.3 non violata); `markCanvasUpdated` gia' interno
evita il bounce.

---

## Sintesi decisione (per il prompt di implementazione)

- **Discriminante**: `raw.isResized === true` (NON la presenza di w/h — inaffidabile per i default
  200×80 di `createVertexForObject`).
- **Forma emessa**: **top-level `width`/`height`** (NON `style`) — unica sorgente di verita' col
  resizer/`resetNodeSize`, gate `sizeChanged` resta dormiente, nessun rischio reconcile/loop.
- **Write path**: `syncSizeToJjom` deve anche settare `isResized = true` (canvasToJjom.ts, critical).
- **Non toccare**: `useJjomSync.ts`, `ObjectNode.tsx`, `nodeSizing.ts`, `packageVertexToRFNode`.

## Rischi

- **Default 200×80 stale**: se per errore si gate sulla presenza di w/h invece che su `isResized`,
  tutti gli object node diventano fissi 200×80 (content-hug rotto). E' l'errore piu' probabile.
- **Cross-editor `isResized`**: un resize in v2-flow disabilitera' l'auto-sizing del vertice anche
  nel classic. Semanticamente corretto ma e' un cambio di comportamento del classic → LIR.
- **Edge case view→non-resizable dopo resize**: `isResized` stale mantiene il box fisso (Q5).

## Domande aperte per Alfonso

1. **Gate resizable**: accetti il gate su `isResized` soltanto (semplice, il transformer non risolve
   la view), oppure vuoi gating stretto sul flag `resizable` corrente della view (piu' costoso: view
   lookup nel transformer o strip render-time)?
2. **Cross-editor `isResized`**: OK che un resize in v2-flow imposti "auto-sizing disabilitato" anche
   nell'editor classic (stesso campo `DVertex.isResized`)?
3. **Home del write `isResized`**: in `syncSizeToJjom` (copre anche la futura propagazione, ma tocca
   canvasToJjom.ts critical-zone) — confermi? L'alternativa (settarlo in EditorV2 via `set_isResized`)
   evita canvasToJjom ma duplica il write path e non copre la propagazione.

---

**HARD STOP** — report scritto. Nessun edit al codice di feature, nessun commit, nessun `git add`.

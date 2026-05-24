# Discovery — Edge anchoring regression (v2-flow)

**Data**: 2026-05-25
**Branch**: `alfonso-frontend-jjtl`
**Modalità**: READ-ONLY (nessuna modifica al codice)
**Trigger**: regressione di anchoring edge nel v2-flow editor osservata anche con 1–2 edge in scena
**Prompt**: discovery sui fix recenti di `portDistribution.ts` (`:source`/`:target` bucketing) e identificazione del punto preciso da correggere

---

## Sommario

**Ipotesi favorita: C (root cause diversa)**. La regressione descritta dall'utente (source endpoint molto sbilanciato verso un angolo, target leggermente sfalsato dal centro) **non** è causata dai due fix recenti di `portDistribution.ts` (`89e67dc65`, `cdcef4456`) ma dal commit **fratello** `db7be7a25` ("role-aware physical positioning of handles in DynamicHandles", 2026-05-21 17:25). Quel commit ha sostituito la formula di posizionamento delle ancore in `DynamicHandles.tsx` con una formula segregata per ruolo che colloca le source nella prima metà del lato (centro a ~6.25% per `index=0`) e le target nella seconda metà (centro a ~56.25% per `index=0`). Per nodi con **un solo edge** su un dato `(side, role)`, l'ancora compare quindi vicino a un angolo invece che al centro del lato, generando l'illusione che l'edge esca da un lato sbagliato. I due fix di `portDistribution.ts` sono coordinati con questa scelta (separano le buckets per ruolo per consentire al meccanismo) ma non sono di per sé il punto da modificare.

---

## 1. portDistribution.ts

File: `frontend/src/components/editor-v2/utils/portDistribution.ts` (298 righe complessive).

### 1.1 Firma e contratto

`computePortDistribution(edges, nodeIds, nodePositions?)` restituisce due mappe (`portDistribution.ts:61-68`):

- `edgeHandles: Map<edgeId, { sourceHandle: string; targetHandle: string }>` — handle IDs **indicizzati** (es. `top-0`, `bottom-1`)
- `nodeHandles: Map<nodeId, Record<Side, PortInfo[]>>` — config delle handle per nodo, con `position` 0–1 lungo il lato

La funzione **non decide il side**: legge il side già esistente nell'`edge.sourceHandle`/`edge.targetHandle` via `getBaseSide` (`portDistribution.ts:37-44`), che estrae il prefisso prima del `-` e default-a `'right'` se l'input è null/undefined. Decide solo l'**indice** entro un lato.

### 1.2 Dove la chiave bucket è stata modificata con i suffissi `:source` / `:target`

STEP 1 di `computePortDistribution`, righe **78** e **111**:

```typescript
// Sorgente (portDistribution.ts:78)
const sourceKey = `${edge.source}:${sourceSide}:source`;

// Target (portDistribution.ts:111)
const targetKey = `${edge.target}:${targetSide}:target`;
```

Prima del commit `89e67dc65` (vedi §4) le chiavi erano `${edge.source}:${sourceSide}` e `${edge.target}:${targetSide}`: source e target che insistevano sullo stesso lato di uno stesso nodo confluivano in un unico bucket.

### 1.3 Calcolo dell'offset (position)

STEP 4 di `computePortDistribution` (`portDistribution.ts:189-235`) compila `nodeHandles[nodeId][side]` come lista di `PortInfo`. La posizione viene **prima** lasciata a `0` e **poi** ricomputata uniformemente sul totale dopo il merge dei due bucket (source+target) sullo stesso `(nodeId, side)`:

```typescript
// portDistribution.ts:228-235
for (const config of nodeHandles.values()) {
    for (const side of ['top', 'right', 'bottom', 'left'] as Side[]) {
        const n = config[side].length;
        config[side].forEach((port, i) => {
            port.position = n === 1 ? 0.5 : (i + 1) / (n + 1);
        });
    }
}
```

Caso `n === 1` → `position = 0.5` (centro lato). Caso `n > 1` → distribuzione uniforme. Questo è il calcolo **dichiarato** dall'algoritmo: lo segnalo perché è importante per la valutazione delle ipotesi (§5).

### 1.4 Scelta del side: non avviene qui

La funzione **non** sceglie il side. Lo riceve già deciso a monte (via il prefisso di `edge.sourceHandle`/`edge.targetHandle`). Il fallback è hard-coded a `'right'` quando l'handle è null/undefined (`portDistribution.ts:38`) e, alla fine, gli edge senza source/target assegnato durante STEP 3 cadono sui default `'right-0'` / `'left-0'` (`portDistribution.ts:184-185`).

### 1.5 Costanti e fallback

- `MAX_HANDLES_PER_SIDE = 4` (riga 258) — usata da `getNextFreeHandleIndex` e da `DynamicHandles` per allocare il pool DOM.
- Default side `'right'` quando `handleId` mancante o non riconosciuto (riga 38, 43).
- Default edge handle `'right-0'` / `'left-0'` quando STEP 3 non popola accumulatore (righe 184-185).

### 1.6 `getNextFreeHandleIndex`

Funzione separata (`portDistribution.ts:267-294`): dato `(nodeId, side, role, existingEdges)` ritorna il primo indice 0..3 libero per quel ruolo su quel lato. Già aggiornata in passato per essere role-aware (parametro `role`).

---

## 2. Call site di `computePortDistribution`

Due call site, entrambi **destrutturano solo `edgeHandles`** scartando `nodeHandles`:

| File:riga | Funzione/ruolo | Input | Output usato |
|-----------|----------------|-------|--------------|
| `frontend/src/components/editor-v2/EditorV2.tsx:790` | `applyDistribution` (`useCallback`) — usata da ogni `setEdges` per riassegnare gli handle indicizzati dopo qualsiasi modifica della topologia | `edgeList` (RF edges correnti), `nodeIds`, `positions` (calcolato da `buildNodePositions` su `getNodes()`) | Solo `edgeHandles`. L'output è usato per produrre un nuovo array di RF edges con `sourceHandle`/`targetHandle` aggiornati, solo se diversi da quelli correnti (`EditorV2.tsx:793-803`). |
| `frontend/src/components/editor-v2/utils/edgeUtils.ts:905` | `computeDistributedHandles` (wrapper) — esposto per consumatori esterni | `edges`, `nodePositions?` | Solo `edgeHandles`. Restituisce direttamente la mappa. |

### 2.1 Chi consuma `nodeHandles`

**Nessuno**: `grep -rn nodeHandles frontend/src` restituisce 7 hit, **tutti dentro `portDistribution.ts`**. La parte ritornata `nodeHandles` non ha alcun consumer nell'app. Conseguenza diretta: STEP 4 di `computePortDistribution` (che `cdcef4456` ha sistemato per unire i bucket source+target) produce **dato morto**.

`DynamicHandles.tsx` (riga 33 in poi) non importa `computePortDistribution`: legge gli edge via `useEdges()` e calcola la propria mappa `activeHandles` (`DynamicHandles.tsx:58-70`) come `Set<string>` di handleId attivi, deducendo posizioni e ruolo da una formula locale (§3.4).

### 2.2 Chi chiama `applyDistribution`

`applyDistribution` viene chiamata da **15 punti** in `EditorV2.tsx` (e da `useClassRemoval.ts:249`), in ognuna delle seguenti circostanze:
- creazione edge via drag-from-handle (M2: `EditorV2.tsx:1284`, M1: `:1397`)
- ricongiunzione/handover endpoint (`:1429`)
- pannelli di co-evoluzione e contraction/expansion gerarchia (`:1683`, `:1703`, `:1726`, `:1740`)
- ricalcolo anchor su drag nodo (`:2738`, `:2899`)
- ridistribuzione palette/drop (`:2576`)
- “safety net” reattiva in `useLayoutEffect` (`:849-869`) che si attiva se la fingerprint di topologia cambia senza un'esplicita `applyDistribution`

In tutti i casi: la funzione **preserva il side** già presente nell'edge e cambia solo l'indice, perché `computePortDistribution` legge il side via `getBaseSide`.

---

## 3. Logica di scelta del side

Il side viene deciso **prima** di `applyDistribution`, in punti diversi a seconda del tipo di edge e del modo (M1/M2).

### 3.1 `useAutoAnchor.ts` — picker geometrico

File: `frontend/src/components/editor-v2/hooks/useAutoAnchor.ts`.

- `computeBestAnchors(sourceRect, targetRect, isSelfReference, edgeType?, currentSourceSide?, currentTargetSide?)` (`useAutoAnchor.ts:142-214`): logica angular dead-zone con `Math.atan2`. Self-ref → `right/top` fissi. Inheritance → `top/bottom` fissi. Reference → angoli `<30°` orizzontale, `>60°` verticale, in mezzo dead-zone (tiene i side correnti se disponibili, altrimenti nearest-side).
- `computeBestAnchorsWithContext(...)` (`useAutoAnchor.ts:472-611`): stesso picker con scoring per occupancy + mixed-type penalty + same-side penalty + tie-break (`SIDE_PREFERENCE`). Inheritance → forzato `top/bottom` (`:486-488`). Self-ref → `right/top`.
- `computeAnchorsWithHysteresis(edges, nodeRects, contextEdges?)` (`useAutoAnchor.ts:271-436`): per ogni edge applica isteresi 30°–60° + bidirectional deconfliction. Inheritance → enforce `top/bottom` (`:331-339`). Self-ref → `right/top`. Pinned anchor → freeze totale (`:315-323`).
- `useAutoAnchor()` (`:618`) espone `getOptimalAnchors(sourceId, targetId, edgeType?, existingEdges?)` (`:621-649`) che restituisce sempre **base sides** (`{ sourceHandle: 'right', targetHandle: 'left', ... }`), **senza indice**.

### 3.2 Punti di assegnazione iniziale di `sourceHandle`/`targetHandle`

| File:riga | Contesto | Logica side |
|-----------|----------|-------------|
| `EditorV2.tsx:1195-1208` | `handleEdgeTypeSelected` (M2 drag-from-handle, inheritance/reference) | Inheritance → hardcoded `top`/`bottom`. Reference → `getOptimalAnchors`. |
| `EditorV2.tsx:1256-1257` | stesso flow — assegnazione finale `${side}-${index}` | Side da §3.1, indice da `getNextFreeHandleIndex` (`:1212-1213`) |
| `EditorV2.tsx:1349-1355` | `handleM1ReferenceSelected` (M1 drag-from-handle) | Side da `getOptimalAnchors`, indice da `getNextFreeHandleIndex` |
| `EditorV2.tsx:1385-1386` | stesso M1 — assegnazione finale | come sopra |
| `EditorV2.tsx:2078-2089` | composition link co-evolution (figlio aggiunto da context-menu) | side hardcoded `right`/`left` ("Child is to the right"). `mode: 'auto'` (non pinned). |
| `EditorV2.tsx:2713-2714` | post-drag node, dentro `setEdges` su `onNodesChange` | side dal risultato di `computeAnchorsWithHysteresis(:2698)` |
| `EditorV2.tsx:2888-2889` | `recalculateAnchors` (chiamata da `SegmentHandles` post-drag waypoint) | side dal risultato di `computeAnchorsWithHysteresis(:2864)`; inheritance enforced top/bottom (`:2872-2875`) |
| `utils/jjomTransformers.ts:355-371` | `computeOptimalHandles` — usata da `jjomEdgeToRFEdge` (lettura iniziale da JjOM) | Inheritance → `top-0`/`bottom-0`. Reference → asse dominante (`dy` vs `dx`). Restituisce direttamente handleId **con `-0`** (non solo il side). |

### 3.3 Anchor mode `'pinned'` vs `'auto'`

Gli edge creati da drag-from-handle in M2/M1 vengono salvati con `sourceAnchor.mode = 'pinned'` (`EditorV2.tsx:1210-1211`, `:1352-1353`). `computeAnchorsWithHysteresis` rispetta i pinned (`useAutoAnchor.ts:315-323`): se anche un solo endpoint è pinned, freeze totale. Gli edge da JjOM (`jjomTransformers.ts`) **non** settano `sourceAnchor`/`targetAnchor` → `getAnchorConfig` defaulta a `{ mode: 'pinned', side: getBaseSide(handleId) }` (`useAutoAnchor.ts:262`). Anche questi sono effettivamente "pinned" dopo il primo load.

Per gli edge `composition` aggiunti via co-evolution (`EditorV2.tsx:2094-2095`) il mode è invece `'auto'` → soggetti a re-routing dell'hysteresis.

### 3.4 DynamicHandles — posizionamento fisico (chiave per la regression)

`DynamicHandles.tsx:182-274` renderizza `MAX_HANDLES_PER_SIDE = 4` handle per lato (pool DOM) per ogni `Side`. Per ciascun `index` 0..3 calcola:

```typescript
// DynamicHandles.tsx:209-210
const sourcePercent = (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
const targetPercent = 0.5 + (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
```

Per `index = 0` (handle “0” di una side, attivato dalla prima edge):
- source → `sourcePercent = 0.0625` = **6.25%** dall'origine del lato (cioè a un ottavo dell'estensione, vicino al primo angolo)
- target → `targetPercent = 0.5625` = **56.25%** dall'origine (poco oltre la metà)

Per `index = 1, 2, 3` riempie regolarmente la metà di pertinenza.

L'assegnazione `isSourceRole`/`isTargetRole` (`:216-217`) è derivata dalla mappa `handleRoles` (`:74-87`) e seleziona quale dei due `<Handle>` (uno `type="target"`, uno `type="source"`) ottiene lo stile "connected" (`:239-252`). Per ogni `handleId` vengono renderizzati **entrambi** i `<Handle>` con stili differenti: il non-attivo prende `inactiveStyle` (`left/top: 50%` ma `visibility: hidden`).

**Conseguenza**: per un nodo con **un solo edge** su un dato lato (es. `University.top` con `sourceHandle = 'top-0'`), il `<Handle type="source">` viene posizionato a `left: 6.25%` (cioè vicino all'angolo top-left). Per `targetHandle = 'bottom-0'` su `namedElement`, il `<Handle type="target">` viene a `left: 56.25%` del lato bottom (leggermente a destra del centro).

Pre-`db7be7a25` il calcolo era diverso (vedi §4.3): per un solo handle attivo, `position = 0.5` → ancora **al centro del lato**.

---

## 4. Commit del fix recente

### 4.1 `89e67dc65cef4eb24849fc91e0911034516aa1a7`
**Data**: 2026-05-21 15:50
**Titolo**: `fix(editor-v2): role-aware handle bucketing in computePortDistribution`
**File modificati**: `frontend/src/components/editor-v2/utils/portDistribution.ts`, `docs/claude-code-log.md`

Diff sintetico (sole 2 righe logiche):
```diff
- const sourceKey = `${edge.source}:${sourceSide}`;
+ const sourceKey = `${edge.source}:${sourceSide}:source`;
...
- const targetKey = `${edge.target}:${targetSide}`;
+ const targetKey = `${edge.target}:${targetSide}:target`;
```

Effetto: STEP 1 separa per ruolo i bucket di gruppi che insistono sullo stesso `(nodeId, side)`. Conseguenza in STEP 3: source e target su uno stesso lato di uno stesso nodo possono entrambi avere `index = 0` (handleId `top-0` può comparire come source per un edge e come target per un altro, sullo stesso nodo, sullo stesso lato).

### 4.2 `cdcef445693393b994b8eebca56283201c328aee`
**Data**: 2026-05-21 17:00
**Titolo**: `fix(editor-v2): union node handles across source/target buckets in STEP 4`
**File modificati**: `frontend/src/components/editor-v2/utils/portDistribution.ts`, `docs/claude-code-log.md`

Diff sintetico (~20 righe logiche):
- Rimpiazza l'assegnazione `config[side] = ports` con un append-only deduplicato su `handleId`.
- Sposta il calcolo `position` in un loop di "ricomputo uniforme" dopo il merge dei due bucket (riga 228–235), con caso speciale `n === 1 → 0.5`.

**Nota critica**: l'output `nodeHandles` di questa STEP non è consumato da alcun call site (§2.1). Il fix è formalmente corretto come algoritmo ma non ha un impatto runtime osservabile diretto.

### 4.3 `db7be7a258b9b14d14aa39fec7cb3c98304ebbe3` (commit "fratello")
**Data**: 2026-05-21 17:25 (~25 minuti dopo `cdcef4456`)
**Titolo**: `fix(editor-v2): role-aware physical positioning of handles in DynamicHandles`
**File modificati**: `frontend/src/components/editor-v2/components/DynamicHandles.tsx`

Questo commit **non** è nominato nel prompt ma è la **terza** modifica della serie role-aware (insieme a `89e67dc65` e `cdcef4456`). Diff sintetico:

- Rimpiazza `activeHandles` da `Map<handleId, position>` a `Set<handleId>` (la posizione non è più memorizzata).
- Rimpiazza il calcolo `position = isActive ? activePosition : 0.5` con il calcolo role-aware:
  ```typescript
  const sourcePercent = (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
  const targetPercent = 0.5 + (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
  ```
- Aggiunge `handleRoles: Map<handleId, Set<'source'|'target'>>` per decidere quale `<Handle>` ottiene `mm-anchor--connected`.

Pre-diff: per un solo handle attivo su un lato `position = 0.5` (centro). Post-diff: per `index = 0` la source va a 6.25%, la target a 56.25%, indipendentemente da quante handle siano attive sul lato.

Il commit message riconosce esplicitamente il trade-off: *"on mono-directional sides, half of the side remains empty (acceptable)"*.

### 4.4 Riepilogo

I tre commit sono coordinati e formano un'unica modifica concettuale (visione "8 anchor per lato in caso bidirezionale"):

1. `89e67dc65` — separa i bucket per ruolo (logica indici)
2. `cdcef4456` — ripara STEP 4 perché il bucket-split rendeva inconsistente il merge (dato morto in pratica)
3. `db7be7a25` — separa fisicamente le posizioni in DOM (CSS)

Solo il terzo ha effetti visibili sul rendering. I primi due preparano il contratto a livello di handleId, ma il rendering effettivo (DynamicHandles) consuma solo `edge.sourceHandle`/`edge.targetHandle` e ignora `nodeHandles`.

---

## 5. Valutazione ipotesi

### Ipotesi A — la scelta del **side** è corretta, ma l'**offset** all'interno del bucket non coordina source e target

**Non supportata**. L'offset in STEP 4 di `computePortDistribution` (`portDistribution.ts:228-235`) ricomputa uniformemente `position` sul totale del bucket merged. Caso `n === 1 → 0.5` (centro). Ma — punto cruciale — **questo offset non viene consumato da nessuno** (§2.1): `DynamicHandles.tsx` calcola la propria posizione localmente (§3.4). Quindi la matematica di STEP 4, corretta o meno, non incide sul rendering.

### Ipotesi B — la scelta del **side** a monte usa la chiave vecchia o un default

**Non supportata**.

- Il side è deciso da `getOptimalAnchors` (e suoi helper `computeBestAnchors`/`computeBestAnchorsWithContext`) o, per inheritance, è hardcoded `top/bottom` (`EditorV2.tsx:1197-1198`, `useAutoAnchor.ts:156-158`, `:332-339`, `:486-488`).
- Nessuna di queste funzioni costruisce chiavi `${node}:${side}` o `${node}:${side}:${role}`. Il bucketing della `portDistribution.ts` è interno alla funzione e non viene riusato a monte.
- Per gli edge inheritance descritti dall'utente (`University → namedElement`), il side source è **forzato** a `top` indipendentemente dalla geometria; non c'è path che possa restituire `left`.
- Il fallback `'right-0'`/`'left-0'` di `portDistribution.ts:184-185` non scatta finché STEP 3 popola correttamente l'accumulatore, e popola sempre per gli edge con `sourceHandle`/`targetHandle` non null.

### Ipotesi C — root cause diversa: posizionamento fisico in DynamicHandles

**Supportata**. Evidenze:

- `DynamicHandles.tsx:209-210` (post-`db7be7a25`) colloca la source di `index = 0` al 6.25% del lato e la target di `index = 0` al 56.25% — indipendentemente dal numero di edge presenti su quel lato.
- Pre-`db7be7a25`: per un solo edge la position era 0.5 (centro). La conversione da "centro" a "6.25%" è uno shift di ~44% lungo il lato.
- Il sintomo riferito dall'utente combacia esattamente:
  - "source completamente sbilanciato" → 6.25% è all'estremità sinistra/superiore del lato, visivamente quasi sull'angolo. Per un lato `top` con singola source, l'ancora compare vicino all'angolo top-left, generando l'illusione di un "exit from left".
  - "target leggermente sfalsato" → 56.25% è poco oltre la metà, scostamento minore ma visibile.
- L'asimmetria dei due sintomi (source = grande shift, target = piccolo shift) combacia con l'asimmetria delle due formule (`+ 0.0625` vs `+ 0.5625`).
- Vale per inheritance e reference allo stesso modo, perché il calcolo in DynamicHandles ignora il tipo di edge — combacia con "si verifica sia su edge di extends sia su reference".
- Si manifesta alla creazione perché è proprio quando l'handle `(side, 0)` entra in `activeHandles` per la prima volta — combacia con "al momento della creazione dell'edge, non dopo spostamenti".

Conferma incrociata sui `nodeHandles`: il commit `cdcef4456` (STEP 4 merge) e il commit `db7be7a25` (positioning role-aware) sono stati scritti come se i due meccanismi si parlassero, ma in realtà `DynamicHandles` non legge mai `nodeHandles`. Il fix `cdcef4456` non avrebbe avuto effetti runtime indipendentemente dalla situazione descritta dall'utente.

---

## 6. Proposta di fix (a livello concettuale, NON di codice)

Il punto da modificare è `DynamicHandles.tsx`, nella formula di posizionamento per handle attive (`:209-210`), non `portDistribution.ts`.

**Direzione concettuale**: rendere il posizionamento role-aware **contestuale** alla densità del lato. Quando un dato `(side)` ha effettivamente entrambi i ruoli attivi su uno o più `index`, mantenere la segregazione `prima metà / seconda metà` (per evitare la collisione visiva del problema che `db7be7a25` voleva risolvere). Quando invece su quel lato è presente **solo** il ruolo source (o solo target), la posizione di quegli handle dovrebbe ricadere su una distribuzione uniforme `(i + 1) / (n + 1)` su tutto il lato (caso `n = 1 → 0.5`, cioè centro), come pre-`db7be7a25`.

Questa modifica preserva il fix originale di `db7be7a25` per i casi denso-bidirezionali (Families.ecore: 4+4 su `Member.left`) ma elimina il sintomo della regression per i casi mono-direzionali sparsi (1 edge in scena). Il dato di partenza per decidere quale formula applicare è già disponibile internamente a `DynamicHandles`: la mappa `handleRoles` (`:74-87`) e il set `activeHandles` (`:58-70`) consentono di derivare in modo cheap, per ciascun lato, l'occupancy per ruolo.

Implicazione collaterale: `nodeHandles` continuerebbe a essere dato morto. Va valutato (separatamente) se questa parte di `portDistribution.ts` ha ancora valore o se rimuoverla per ridurre la superficie del codice. Non rientra nello scope di questa discovery.

**Cosa non fare** (per chiarezza):
- **non** revertire `89e67dc65` né `cdcef4456`: separare i bucket per ruolo resta corretto per consentire `top-0` di esistere come source per un edge e target per un altro edge sullo stesso nodo.
- **non** revertire `db7be7a25` in blocco: rompe lo split delle 8 ancore in casi denso-bidirezionali (Families.ecore) che il commit ha sistemato.

---

## Hard stop

Nessun hard stop incontrato. La discovery è rimasta nel perimetro previsto (lettura `portDistribution.ts`, call sites, side picker, e correlazione con commit fratello `db7be7a25` che è stato necessario aprire per spiegare il sintomo). Il fix richiederà l'edit di `DynamicHandles.tsx` — fuori scope di questa discovery.

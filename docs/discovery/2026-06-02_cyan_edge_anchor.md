# Discovery (READ-ONLY) — Ancoraggio lato sorgente dell'edge cyan cross-metamodel

**Documento prompt**: 2026-06-02 (incollato in chat)
**Tipo**: discovery (sola lettura) — FASE 1
**Branch**: `alfonso-frontend-jjtl`
**Data esecuzione**: 2026-06-02
**Modalità**: nessuna modifica al codice, nessun commit, nessun fix.

---

## ⚠️ DUE HARD STOP ATTIVATI — leggere prima di tutto

Il prompt parte da un modello mentale che **non corrisponde al codice corrente**. Due delle tre
condizioni di hard-stop previste dal prompt sono scattate:

### HS-2 — `selectOptimalSidesForEdges` NON ESISTE

`grep -rn "selectOptimalSidesForEdges" frontend/src` → **0 occorrenze**. Anche le varianti
(`OptimalSides`, `selectOptimal`, `chooseSide`, `pickSide`, `optimalSide`) non trovano nulla di
pertinente nel path v2-flow. La funzione è stata **rinominata / ristrutturata**.

**Nome/architettura attuale** (tutto in `hooks/useAutoAnchor.ts`):
| Simbolo attuale | Riga | Ruolo | Quando gira |
|---|---|---|---|
| `getOptimalAnchors` (da `useAutoAnchor()`) | `useAutoAnchor.ts:624` | side per **un** edge alla **creazione** | onConnect M2 (`EditorV2.tsx:1299`), connect M1 (`:1448`) |
| `computeAnchorsWithHysteresis` | `useAutoAnchor.ts:274` | side per **N** edge con isteresi + deconflict bidirezionale | **sul drag** (`EditorV2.tsx:2858`) e recalc singolo (`:3024`) |
| `computeBestAnchorsWithContext` | `useAutoAnchor.ts:475` | scoring geometrico + occupancy (cuore della scelta lato) | chiamata dalle due sopra |
| `getOptimalAnchorsForAllEdges` | `useAutoAnchor.ts:659` | esportata ma **nessun call-site osservato** (grep) | — (dato morto apparente) |

**La premessa del prompt è falsa**: la side-selection **non** gira nel path di import dentro
`useJjomSync.ts`. Il grep di `computeAnchorsWithHysteresis`/`getOptimalAnchors` matcha **solo**
`useAutoAnchor.ts` ed `EditorV2.tsx`, **mai** `useJjomSync.ts`. Il ricalcolo del lato vive nei
**drag handler di EditorV2**, non nel sync.

### HS-3 — Il "cyan edge" NON è un edge (e non punta a un nodo)

L'edge cyan cross-metamodel **non è un ReactFlow edge** e il "nodo proxy/placeholder tratteggiato
`A / metamodel_2`" **non è un nodo**. È un **overlay in-node**: un `<svg>` statico + un chip CSS
disegnati dentro il DOM del `ClassNode` sorgente (lo *stub ghost-target*). Vedi §2.

Conseguenza: `useAutoAnchor`, `portDistribution`, gli handle ReactFlow e qualunque side-selection
**non lo toccano affatto** — non perché filtrato, ma perché non è mai entrato nel grafo RF.

> Per disciplina (CLAUDE.md §5.1, hard-stop del prompt) la discovery si **ferma alla produzione di
> questo report**. Tutte e 6 le domande hanno comunque risposta documentata sotto, perché la verità
> era raggiungibile senza "cercare equivalenti a tentativi" — l'architettura reale è emersa diretta
> dal grep e da una discovery preesistente sullo stesso oggetto.

**Discovery precedente sullo stesso stub** (fortemente raccomandata come lettura parallela):
`docs/discovery/2026-05-31_ghost_target_drag_discovery.md`. Quel documento descrive lo stub allo
stato **committato**; nel frattempo il working tree ha reso il chip **trascinabile** (vedi §7).

---

## 1. Mappa del ciclo di vita del "lato" — due regimi distinti

Esistono **due meccanismi di ancoraggio completamente separati**, e il bug vive interamente nel
secondo:

### Regime A — edge RF reali (reference same-MM grigie, inheritance, composition, instanceRef)
Il "lato" è:
- l'**handle id** RF `sourceHandle`/`targetHandle` sull'oggetto edge (es. `right-0`, `top-0`); il
  lato-base si estrae con `getBaseSide` (`useAutoAnchor.ts:243`);
- specchiato in `edge.data.sourceAnchor`/`targetAnchor` = `AnchorConfig { mode, side }`
  (`types.ts:129-132`), con `mode ∈ {'auto','pinned'}`.

**È ricalcolato a ogni drag** (vedi §Q6) e alla creazione. NON persistito nel D-layer (0 scritture
anchor in `canvasToJjom.ts` — confermato dalla discovery 2026-05-31 §7.1). `mode:'pinned'` (solo da
drag manuale dell'endpoint) lo congela.

### Regime B — connettore cyan (stub ghost-target, cross-MM)
**Non c'è handle, non c'è `edge.side`, non c'è `AnchorConfig`.** Il "lato sorgente" è una **costante
CSS**: il contenitore `.ghost-target-stub` è ancorato a `left: 100%` (bordo destro del nodo,
`EditorV2.scss:1401`) e il connettore SVG parte da `left:0; top:50%` locale (`:1455-1457`), cioè
**sempre dal bordo destro del nodo**, a metà altezza. L'origine `(0,0)` del `<line>` è hardcoded
(`ClassNode.tsx:366`). Solo l'**estremità** del segmento `(endX,endY)` segue l'offset di drag del
chip (`ClassNode.tsx:342-343`, `:366-367`). Il lato sorgente **non è derivato dalla geometria** e
**non viene mai ricalcolato** né sul drag del nodo né sul drag del chip.

---

## 2. Risposte alle 6 domande (ognuna con evidenza `file:riga`)

### Q1 — Dove vive il "lato" di un edge? Statico o ricalcolato?
- **Regime A**: handle id RF + `data.sourceAnchor/targetAnchor` (`types.ts:129-132`,
  `useAutoAnchor.ts:243`). **Ricalcolato** (drag + creazione). Effimero (non in Redux).
- **Regime B (cyan)**: nessun campo "lato". Costante CSS = bordo destro del nodo
  (`EditorV2.scss:1401` `left:100%`; `:1455-1457` `left:0; top:50%`; origine `(0,0)` a
  `ClassNode.tsx:366`). **Statico per costruzione.**

### Q2 — Chi chiama `selectOptimalSidesForEdges`?
**Funzione inesistente** (HS-2). Call-site degli equivalenti attuali:
- `getOptimalAnchors` (creazione): `EditorV2.tsx:1299` (onConnect M2), `:1448` (connect M1).
- `computeAnchorsWithHysteresis` (drag/recalc): `EditorV2.tsx:2858` (in `handleNodesChange`),
  `:3024` (recalc singolo edge).
- **`useJjomSync.ts`: nessun call-site di side-selection** (il grep non lo tocca). La side-selection
  **non** è nel path di import. Lo stub cyan non passa da nessuna di queste funzioni.

### Q3 — `useAutoAnchor`: trigger, edge iterati, filtri, drag vs init?
- `useAutoAnchor()` (`:621`) è un **provider di funzioni** (deps `[nodes]`, `:651`/`:703`), non un
  effect: non "gira" da solo, lo invocano i chiamanti.
- Sul **drag**, `computeAnchorsWithHysteresis` (`:274`) è invocata da `handleNodesChange`
  (`EditorV2.tsx:2858`). Itera `edgesToRecalculate` = `currentEdges` filtrati per *(source o target è
  un nodo mosso)* AND `!oaaOptimized` AND non creato negli ultimi 300ms (`EditorV2.tsx:2846-2854`).
- Discriminazione interna **per tipo di edge**: self-ref → `right/top` (`:304`); pinned → congelato
  (`:318`); inheritance → `top/bottom` forzato (`:334`); altrimenti reference con scoring
  (`:374-396`). **Nessun filtro "cyan/cross-MM"**: gli edge cross-MM non sono mai in `edges`.
- Gira **sul drag** (e su recalc singolo `:3024`), **non** come effect di init. I lati iniziali
  vengono da creazione/load.

### Q4 — Come si identifica il cyan edge? C'è un filtro che lo esclude dal ricalcolo?
- **Non è un edge type.** È node-data: `data.ghostTargets: GhostTargetInfo[]` (`types.ts:72-78`,
  `:90`), calcolato in `classVertexToRFNode` (`jjomTransformers.ts:126-142`), discriminatore cross-MM
  `ref.type.model.id !== lClass.model.id` (`:130`, via L-proxy).
- **Non c'è un filtro che lo esclude dal ricalcolo**: l'edge che *sarebbe* esistito è **soppresso
  alla costruzione** — `jjomEdgeToRFEdge` ritorna `null` per le reference cross-MM
  (`jjomTransformers.ts:491-494`). Quindi non c'è alcun edge da ricalcolare. I 4 edge type reali
  mappano tutti a `UnifiedEdge` (`EditorV2.tsx:107-110`); il cyan non è nessuno di essi.

### Q5 — Il target è un nodo proxy/placeholder? L'auto-anchor lo salta?
- **No: non esiste alcun nodo.** Il chip tratteggiato `A / metamodel_2` è un elemento CSS
  (`.ghost-target-stub__chip`, bordo `1px dashed var(--color-canvas-accent)`,
  `EditorV2.scss:1463-1480`) dentro il DOM del `ClassNode` sorgente. Niente DVertex, niente RF node,
  niente id (`GhostTargetInfo` non porta id, `types.ts:72-78`). Ogni RF node è 1:1 da un DVertex
  (discovery 2026-05-31 §5.2). L'auto-anchor non "salta i nodi proxy": **non ci sono nodi** — il
  costrutto vive **fuori** dal grafo node/edge di ReactFlow.

### Q6 — Edge grigi: ricalcolano il lato sul drag? Per quale path?
**Sì.** Gli edge grigi (reference same-MM) sono RF edge reali (`UnifiedEdge`). Sul drag del nodo,
`handleNodesChange` (passato a `<ReactFlow onNodesChange>` a `EditorV2.tsx:3132`):
1. costruisce `nodeRects` da `getNodes()` + posizioni dei `changes` (`:2826-2842`);
2. filtra gli edge che toccano i nodi mossi (`:2846`);
3. esegue `computeAnchorsWithHysteresis` (`:2858`);
4. riscrive `sourceHandle`/`targetHandle` + `data.sourceAnchor/targetAnchor` (`:2871-2881`).

Quindi il lato dell'edge grigio è ricalcolato **live** sul drag.

---

## 3. Perché il cyan è fuori dal giro (citazioni)

1. **Soppressione alla sorgente**: `jjomEdgeToRFEdge` → `return null` per reference cross-MM
   (`jjomTransformers.ts:494`). L'edge non entra mai in `edges`.
2. **Drag recalc opera solo su `currentEdges`**: `handleNodesChange` filtra `currentEdges`
   (`EditorV2.tsx:2846`); ciò che non è in `edges` non è candidato → il cyan non è mai ricalcolato.
3. **Lato cyan = costante CSS**: `.ghost-target-stub { left:100% }` (`EditorV2.scss:1401`) +
   connettore `left:0; top:50%` + origine `(0,0)` (`ClassNode.tsx:366`) → emana **sempre** dal bordo
   destro del nodo, indipendentemente dalla posizione del chip.

---

## 4. Asimmetria cyan vs grigi (path a confronto)

| | Edge grigio (same-MM) | Connettore cyan (cross-MM) |
|---|---|---|
| Natura | RF edge (`UnifiedEdge`) | `<svg>` statico in `ClassNode` |
| Presente in `edges`? | Sì | **No** (soppresso `jjomTransformers.ts:494`) |
| Lato sorgente | handle id + `AnchorConfig`, geometrico | costante CSS = bordo destro nodo |
| Ricalcolo sul drag | **Sì** (`EditorV2.tsx:2858`) | **Mai** |
| Target | DVertex / RF node reale | chip CSS, nessun nodo, nessun id |

---

## 5. Cosa produce *davvero* il sintomo (correzione al modello del prompt)

Il sintomo ("l'edge taglia il corpo del nodo / diagonale") **non** nasce dal drag del **nodo** ma dal
drag del **chip**. Motivo: l'overlay è figlio DOM del nodo (assoluto, ancorato al bordo destro);
trascinando il **nodo** Loan, overlay+connettore+chip traslano **insieme** → la geometria relativa
non cambia, il connettore resta un segmento orizzontale di 24px. La geometria relativa cambia **solo**
quando l'utente trascina il **chip** (feature `__draggable` introdotta nel working tree, §7):
`endX/endY` seguono l'offset (`ClassNode.tsx:342-343`) ma **l'origine resta `(0,0)` al bordo destro**
(`:366`). Quindi:
- chip a destra (offset 0) → linea orizzontale → corretto;
- chip in alto-sinistra → origine al bordo destro + estremo in alto-sinistra → la linea attraversa il
  corpo del nodo;
- chip sotto → diagonale.

> Caveat §5.1 (non fidarsi delle fixture a memoria): i tre stati descritti nel prompt come "drag dello
> stesso nodo Loan" vanno **riprodotti sul codice corrente** per confermare se l'utente ha trascinato
> il **chip** (ipotesi forte qui) o il **nodo**. Il meccanismo sopra spiega il sintomo solo nel primo
> caso. Da verificare prima di qualunque fix.

---

## 6. Ipotesi di fix minimale (DESCRITTA, non implementata)

Il "lato sorgente" del connettore cyan va reso **funzione della direzione del chip**, anziché
costante "bordo destro". Tutto resta **dentro `ClassNode.tsx` + `EditorV2.scss`** (geometria SVG/DOM),
stessa famiglia del calcolo arrowhead già presente (`ClassNode.tsx:344-352`):

- **Opzione 1 (origine sul bordo del nodo verso il chip)**: scegliere il punto di partenza del `<line>`
  sul bordo del nodo più vicino alla direzione `(endX,endY)` (destro / alto / basso / sinistro),
  invece di `(0,0)` fisso. Richiede conoscere la geometria del nodo rispetto al contenitore
  `.ghost-target-stub` (oggi ancorato a `left:100%`, quindi l'origine `(0,0)` ≡ bordo destro): per
  emanare da altri lati il contenitore o l'origine andrebbero riferiti al box del nodo, non al solo
  bordo destro.
- **Opzione 2 (clip al bordo)**: mantenere l'origine concettuale al centro nodo ma **troncare** la
  linea al bordo del nodo, così non taglia mai il corpo. Più piccola, meno "corretta" semanticamente.
- **Opzione 3 (ortogonale)**: routing manhattan breve (esce dal bordo nella direzione dominante, poi
  gira verso il chip) — coerente con lo stile degli edge RF ma più codice.

Nessuna di queste tocca `useAutoAnchor`, `portDistribution`, gli handle RF o `useJjomSync`: il
problema è **puramente di rendering dell'overlay**.

---

## 7. Stato del working tree (rilevante per il fix)

`git status` all'avvio: **modificati e non committati**
`ClassNode.tsx` + `EditorV2.scss` (feature "chip trascinabile"), più questo doc untracked.

- `ClassNode.tsx`: aggiunto stato locale `ghostOffsets` (in-session, **non** persistito, `:60-99`
  ca.), handler pointer (`onGhostPointerDown/Move/Up`, reset su doppio click), markup del chip
  `.ghost-target-stub__draggable nodrag` con `transform: translate(endX,endY)` (`:371-373`), e
  connettore SVG con geometria dipendente dall'offset (`:342-368`).
- `EditorV2.scss`: nuovo `&__draggable`; `&__connector` da `width/height` fissi → `position:absolute;
  left:0; top:50%; overflow:visible`; `&__chip` ora `cursor:grab` + `touch-action:none`; `&__arc`
  marcato `// TODO: cleanup — no longer used` (`:1419-1424`).

⚠️ Un prompt di fix deve decidere se **costruire sopra il WIP** o rebasare; il sintomo descritto è una
**conseguenza diretta** di questa feature non committata. Inoltre, da NON toccare per scope: `&__arc`
(dead, TODO già presente) e `getOptimalAnchorsForAllEdges` (export senza call-site osservato).

---

## 8. Layer Impact Report — PRELIMINARE (per il fix, non per questa discovery)

```
LAYER IMPACT REPORT (fix connettore cyan — preliminare)

Layers touched:
  [ ] D-layer (Redux raw data)          — NO
  [ ] L-layer (computed proxies)        — NO
  [ ] JjOM (model entities)             — NO
  [x] Canvas v2-flow (ReactFlow)        — SÌ, ma SOLO overlay in-node (no node/edge RF)
  [ ] Canvas classic                    — NO
  [ ] Sync layer (useJjomSync hooks)    — NO
  [ ] Persistence (VersionFixer/jsxStr) — NO

Canvas v2-flow:
  - Cosa cambia: geometria del <svg> connettore + regole .ghost-target-stub*
    in ClassNode.tsx ed EditorV2.scss.
  - Cosa NON cambia: ghostTargets data (jjomTransformers.ts), soppressione
    edge cross-MM (jjomEdgeToRFEdge:494), handle RF, useAutoAnchor,
    portDistribution, edge grigi.
  - Interazione cross-layer: nessuna — lo stub è node-data derivata + DOM.
  - Side-effect safety: l'offset è local state in-session (non persistito),
    nessuna scrittura D-layer, nessuna TRANSACTION, nessun DVoidEdge.new2,
    nessun edge-pair guard (syncState non coinvolto).

Rischi sul sync layer: NESSUNO. Il cyan non genera DVoidEdge; il reconcile
cross-MM (useJjomSync.ts:767-795) cancella eventuali DVoidEdge stale e NON è
toccato da un cambio di geometria del connettore.

Race-window: NESSUNA — niente creazione edge, niente new2, niente syncState.

File candidati Fase 2: ClassNode.tsx, EditorV2.scss (SOLO questi).
Critical-zone (useJjomSync/portDistribution/useAutoAnchor/canvasToJjom/
VersionFixer): NON toccati.
Migrazione VersionFixer: NON richiesta (overlay effimero, non jsxString).
```

---

## Sintesi fattuale

| Aspetto | Esito |
|---|---|
| `selectOptimalSidesForEdges` | **Inesistente** → `useAutoAnchor.ts` (`getOptimalAnchors`, `computeAnchorsWithHysteresis`) |
| Side-selection in `useJjomSync` (import path) | **Falso** — vive nei drag handler di `EditorV2.tsx` |
| Cyan = RF edge verso nodo proxy | **Falso** — overlay SVG/CSS in-node, nessun edge, nessun nodo |
| Discriminatore cross-MM | `ref.type.model.id !== lClass.model.id` (`jjomTransformers.ts:130`) |
| Edge cross-MM soppresso | `jjomEdgeToRFEdge:494` (`return null`) |
| Lato sorgente cyan | costante CSS = bordo destro nodo (`EditorV2.scss:1401`, `ClassNode.tsx:366`) |
| Grigi ricalcolano sul drag | **Sì** (`EditorV2.tsx:2858`, `handleNodesChange`) |
| Causa del sintomo | chip trascinabile (WIP) con origine connettore fissa al bordo destro |
| Fix | rendering-only in `ClassNode.tsx` + `EditorV2.scss`; zero critical-zone |

Nessuna modifica al codice. Nessun commit. Solo fatti con riferimenti `file:riga`.

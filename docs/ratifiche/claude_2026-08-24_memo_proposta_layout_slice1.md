# Memo di proposta, 2026-08-24 01:50: la slice 1 del layout per viewpoint

**Stato: PROPOSTA, non ratificata.** Scritto dall'architetto nella notte fra il 23 e il 24, su mandato
di lavoro autonomo meccanico. Niente qui è a registro. Le righe marcate «R-LAY-14 (candidata)» e
seguenti sono testi pronti per la ratifica, da leggere come domande. Base: `R-LAY-1..13`,
`discovery_2026-08-24_layout_d1_d8_d10.md` (D1..D8, D10),
`discovery_2026-08-24_layout_fase1b_storesize_runtime.md`.

## 1. Che cosa è già deciso, e vincola

| Vincolo | Da |
|---|---|
| Posizione, taglia scelta e `isResized` per viewpoint esclusivo | R-LAY-1, R-LAY-4 |
| La sintassi astratta ha un record proprio | R-LAY-2 |
| Chiave = id del viewpoint esclusivo attivo, con sentinella per la sintassi astratta | R-LAY-6 |
| Solo i viewpoint esclusivi hanno un record | R-LAY-8 |
| Perimetro editor-v2; classico governato, non esente | R-LAY-9 (emendata) |
| Sede: asse nuovo sul vertice; record `GraphSize`; `storeSize` intatto e fuori | R-LAY-13 |
| Il record non si cancella quando l'elemento non rende | R-LAY-5 (gratis, D10.b) |
| Edge: `irEdgeLayout` resta condiviso | R-LAY-3 |

## 2. La forma del campo (proposta)

Su `DVertex` (`GraphDataElements.tsx:1662`), un campo nuovo, opzionale, accanto ai quattro scalari:

```ts
/** Per-viewpoint layout, keyed by the id of the exclusive viewpoint that was active when the
 *  gesture happened (R-LAY-6). Absent key = fall back to the scalars x/y/w/h/isResized. */
layoutByViewpoint?: Dictionary<Pointer<DViewPoint>, VertexLayout>;
```

con `VertexLayout = { x: number; y: number; w: number; h: number; isResized: boolean }`, cioè
`GraphSize` (R-LAY-13) più `isResized` (R-LAY-4). È l'idioma che il D-layer usa già a tre righe di
distanza (`isSelected` per utente, `ghostOffsets` per `refId`: D2, §2.1 del report).

**I quattro scalari restano e diventano il record della sintassi astratta.** È la scelta che
risolve D10.a senza sentinella: il caso «nessun viewpoint attivo» non è una chiave del dizionario,
è il campo che c'è già. Conseguenze, tutte a favore:

- **Zero migrazione** per i progetti esistenti: il dizionario nasce assente, i vecchi valori sono
  già dove devono stare. D7 non chiede un numero di versione.
- **La collisione di grafia di D10.a (§9.3) non tocca il layout**: `Pointer_ViewPointDefault` e
  `Pointer_DefaultViewPoint` non entrano mai nel dizionario, perché il vuoto non ha chiave.
  Resta un difetto dell'adapter (prompt delle 00:50), separato.
- **R-LAY-2 è soddisfatta** letteralmente: il record della sintassi astratta è proprio, non
  condiviso; sono gli altri a non ricadervi *in scrittura*. In lettura sì (punto 3), ed è la
  scelta da ratificare.

Alternativa scartata e perché: chiave sentinella `Defaults.Pointer_ViewPointDefault` nel dizionario
(D10.a §9.2 la propone). Costa una migrazione dei quattro scalari dentro il dizionario per ogni
vertice di ogni progetto, e porta la grafia doppia dentro la chiave del layout. Più uniforme, più
fragile.

## 3. Lettura: il fallback (da ratificare)

Un viewpoint esclusivo appena attivato non ha record. Due opzioni:

**(a) Read-through.** Se `layoutByViewpoint[vp]` manca, si legge dagli scalari. Il primo gesto
sotto `vp` scrive il record e da lì i due divergono. Vantaggio: aprire un viewpoint mostra il
diagramma com'era, non un ammasso a (0,0). Svantaggio: finché nessuno tocca il nodo sotto `vp`,
muoverlo in sintassi astratta lo muove anche sotto `vp`. È accettabile e coerente con l'intuizione
«parte da dove stava», ma va scritto.

**(b) Copia al primo accesso.** All'attivazione di `vp`, se manca il record, si copia dagli scalari
per ogni vertice reso. Nessuna dipendenza residua, ma una scrittura di massa a ogni prima
attivazione, e un record per ogni elemento anche se mai toccato (contro lo spirito di D8, pur
restando sotto l'1%).

**Proposta: (a).** Una sola riga di lettura, nessuna scrittura implicita, D8 invariato.

## 4. Chi scrive, chi legge: i punti da toccare

Dal censimento di D4 (§4.1-4.2), tutti in editor-v2:

| Sede | Oggi | Con la slice 1 |
|---|---|---|
| `canvasToJjom.ts:46-47, 59-60` (posizione) | `SetFieldAction` su `x`, `y` | passa da un resolver unico `writeVertexLayout(vertexId, patch, activeVp)` |
| `canvasToJjom.ts:78-80, 92, 105-107` (taglia, reset) | `SetFieldAction` su `w`, `h`, `isResized` | idem |
| `jjomTransformers.ts:173-174, 219-220, 241-242` (lettura posizione) | `raw.x`, `raw.y` | `readVertexLayout(raw, activeVp)` con il fallback (3a) |
| `jjomTransformers.ts:50-57` (`manualSizeOf`) | `raw.isResized/w/h` | idem |
| `MetamodelTab.tsx:138-139` (drop nel classico) | `SetFieldAction` su `x`, `y` | stesso resolver: è la clausola «governato» di R-LAY-9 |
| `GraphDataElements.tsx:1403-1425` (override `LVoidVertex`) | scalari diretti | stesso resolver, in lettura e scrittura |
| `set_size` proxy (`GraphDataElements.tsx:668-685`) | `view.updateSize` poi scalari | **non si tocca** nella slice 1 (R-LAY-13: `storeSize` fuori perimetro); dichiarato come percorso che scrive sugli scalari, cioè sulla sintassi astratta, qualunque sia il viewpoint attivo |

Il resolver legge il viewpoint attivo da **una sola sorgente**: `activateViewpoint` è l'unico
scrittore (R-LAY-11, R-LAY-12), quindi `state.viewpoint` o `project.activeViewpoint` sono
equivalenti; scegliere quello che `irResolveCore.ts:139` già usa, per non aprire una seconda
lettura.

**`canvasToJjom.ts` è in critical zone** (CLAUDE.md §3.2): la slice 1 è two-phase con Layer Impact
Report, non corsia veloce. `jjomTransformers.ts` non è in lista ma è il lettore della stessa coppia:
va nel LIR come file toccato.

## 5. Affettatura proposta

- **Slice 1a**: il campo su `DVertex` più i due resolver come modulo puro (`viewpoint/ir/` o
  `sync/`, da decidere in Fase 1) con test unitari **senza DOM** (il modulo non importa il joiner:
  è la lezione della Fase 1b). Nessun call site cambia. Zero effetto a schermo.
- **Slice 1b**: i sette siti della tabella passano dai resolver. LIR. Verifica visiva di Alfonso:
  due viewpoint esclusivi, spostare un nodo sotto `A`, attivare `B`, il nodo è dove stava in
  sintassi astratta (3a); spostarlo sotto `B`; tornare ad `A`: è dove l'aveva lasciato `A`;
  sintassi astratta: mai mossa. Ricaricare: tutto sopravvive.
- **Slice 2** (fuori da questo memo): il classico oltre il drop, e la sorte di `storeSize`.

## 6. Righe candidate per il registro

**R-LAY-14 (candidata)** — Sede: `DVertex.layoutByViewpoint`, dizionario opzionale indicizzato
dall'id del viewpoint esclusivo attivo, record `{x, y, w, h, isResized}`. I quattro scalari
esistenti sono il record della sintassi astratta: la sentinella di R-LAY-6 è l'assenza di chiave,
non un id. Nessuna migrazione.

**R-LAY-15 (candidata)** — Lettura read-through: in assenza di record per il viewpoint attivo si
leggono gli scalari; il primo gesto sotto quel viewpoint crea il record. Nessuna copia implicita.

**R-LAY-16 (candidata)** — Scrittori e lettori passano da un resolver unico, modulo puro senza
dipendenze dal joiner, testato senza DOM. `set_size` del proxy L resta sugli scalari e viene
dichiarato, non instradato, finché `storeSize` è fuori perimetro.

## 7. Fuori dal layout, ma toccati stanotte

**Gate «Create View» (fronte UX di R-LAY-11), proposta.** I tre gate `!!getLastEditedViewpointId()`
(`TreeViewContent.tsx:483`, `ContextMenu.tsx:487`, `:531`) leggono una variabile che nessuno scrive
più. Il menu del canvas, misurato il 23/8, offre «Create View in "VP prova"» leggendo la sorgente
giusta. Rimedio proposto: i tre gate leggono la stessa sorgente del menu del canvas, e
`lastEditedViewpointId` con i suoi due setter senza chiamanti va nel censimento di R-DEAD (slice
propria, non la 1). Prompt piccolo, corsia veloce, dopo il «vai».

**RC-8, RC-9, RC-10.** Il testo delle tre clausole non è nel repo: il memo del 22 cita solo «la
clausola di processo (b)» come quella che avrebbe evitato la perdita di §8. Ricostruzione
candidata, da confermare a voce e non da iscrivere così: (a) un comportamento osservato solo via
automazione non è un difetto del prodotto finché un umano non lo riproduce a mano, `Causa (g)`
(regola del 23/8, oggi solo in una entry di log); (b) memo e prompt consegnati in chat si mettono a
terra nel repo lo stesso giorno, altrimenti non vincolano; (c) chi trova citato un documento
inesistente lo dichiara e procede sul resto; una decisione che poggiava solo su quello si rifà, non
si ricostruisce (clausola §8 del memo del 22). Se (a) o (c) non erano le clausole del 22, dillo:
meglio due numeri liberi che due righe inventate.

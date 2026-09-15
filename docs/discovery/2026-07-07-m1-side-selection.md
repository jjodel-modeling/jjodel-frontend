# Discovery S4 — Selezione del lato (side selection) per edge M1 al load

**Data**: 2026-07-07 12:00
**Tipo**: discovery Fase 1, **READ-ONLY** (nessuna modifica a file sorgente committata)
**Critical-zone coinvolta**: `useM1ReferenceEdges.ts`, `useJjomSync.ts` (§3.1) — **solo letti**. Adiacenti letti: `useAutoAnchor.ts`, `jjomTransformers.computeOptimalHandles`, `portDistribution.ts`, `EditorV2.tsx`.
**Fixture**: modello M1 di `Families` — `Pierantonio:Family`, `Member_0`, `Member_1`, reference `father`/`mother` (Family→Member).
**Metodo**: lettura statica con `file:funzione:riga` + **harness headless** (`_sideSelectionCapture.test.ts`, temporaneo, **rimosso**) che esegue il codice di produzione reale (`jjomEdgeToRFEdge`→`computeOptimalHandles` per il load; `computeAnchorsWithHysteresis` per il drag).
**HARD STOP**: al termine del documento. La Fase 2 (fix) parte solo dopo go-ahead esplicito, con prompt separato.

---

## 0. TL;DR — verdetto sulla root cause

Il difetto **non è unico**: i tre casi si spiegano con **due meccanismi distinti**, entrambi riprodotti eseguendo il codice reale.

- **Casi A e C — POSIZIONI STANTIE (load-freeze).** Il lato è scelto **una sola volta**, al primo build RF dell'edge, da `computeOptimalHandles` (`jjomTransformers.ts:374-420`) sulle **posizioni del vertice in quell'istante**. Per le istanze M1 appena create quelle posizioni sono quelle **a griglia** assegnate da `useJjomSync` Step 2bis (`:665-692`, `x=50+col·420`, `y=50+row·300`) — **non** il layout finale. Il lato viene poi **congelato**: la sync incrementale preserva l'handle esistente (`useJjomSync.ts:1259-1260`), e **nessun percorso al load/onInit/ELK ricalcola il lato** (`applyDistribution` e `handleAutoLayout` fanno solo re-indexing, non ri-scelgono il lato). Risultato: se l'ordine-griglia mette Family a destra dei Member, `computeOptimalHandles` produce `left/right`; poi ELK sposta Family a sinistra e i Member a destra → **U-turn**. **Riprodotto**: griglia-Family-last → `left/right` (= osservato); ricalcolo alle posizioni finali → `right/left` (corretto).
- **Caso B — OCCUPANCY-OVERFLOW sul drag.** La firma osservata è **same-side** (`right/right`, U wrap-around). Questo **non può** venire dal load: `computeOptimalHandles` ritorna **solo coppie opposte** (mai stesso lato). Nasce dal **percorso di drag**: `computeBestAnchorsWithContext` (`useAutoAnchor.ts:471-610`) include candidati **same-side U** e, quando il lato geometricamente corretto è **affollato**, la penalità di occupancy lo scavalca e sceglie la U. **Riprodotto**: Family con 4 reference uscenti tutte pre-assegnate a `right` → gli edge centrali finiscono `left/left` (U) pur avendo i target a destra.

**Non è**: (a) **anchor pinnati** — gli edge M1 derivati da slot value nascono **senza** `sourceAnchor`/`targetAnchor` → `mode:'auto'` (`useAutoAnchor.ts:249-262`), quindi rerouting-abili; solo i disegni manuali M1 pinnano (`EditorV2.tsx:1531-1532`). (b) **dead-zone** come causa primaria: la dead-zone 30°–60° (`:385-391`) può *congelare* un lato sbagliato **solo se un ricalcolo gira** (drag), ma al load nessun ricalcolo gira affatto — quindi è al più un contributo secondario sul drag.

**Nota di validità (§5.1)**: le coordinate usate nell'harness sono **rappresentative** degli screenshot, non i pixel esatti. Il **meccanismo** è provato (righe citate + esecuzione del codice reale); i **valori esatti** dei tre casi vanno confermati in Fase 2 catturando dallo store live `posizioni + ordine di rawModel.objects + edge.data.{sourceAnchor,targetAnchor}.mode`.

---

## 1. Risposte alle 6 domande

### Q1 — Chi assegna i lati agli edge M1 e quando (creazione + load)?

**Chi**: `computeOptimalHandles(sourceVertex, targetVertex, isInheritance)` (`jjomTransformers.ts:374-420`), invocata da `jjomEdgeToRFEdge` (`:439`) per **ogni** edge (M1 e M2). Logica = **asse dominante** puro sulle posizioni:

```
dx = tcx - scx ; dy = tcy - scy
if |dy| >= |dx|:  dy<0 → top/bottom ; dy>=0 → bottom/top     // verticale
else:             dx>0 → right/left ; dx<=0 → left/right      // orizzontale
```

Legge le coordinate da `vertex.__raw.{x,y,w,h}` (fallback `w=180,h=80`). **Ritorna sempre una coppia OPPOSTA** (mai same-side). Non consulta gli edge fratelli, non ha occupancy, non ha dead-zone.

**Quando (creazione da trasformazione/import/JjScript)**:
1. Le istanze M1 sono create come `DObject` **senza** `DVertex`.
2. `useJjomSync` **Step 2bis** (`:661-692`) crea i vertici mancanti a **posizione griglia** (`GraphSize(x,y,200,120)`, `x=50+col·COL_W`, `y=50+row·ROW_H`; config `COLS=3, COL_W=420, ROW_H=300` a `:79-81`). Con 3 istanze → cella 0,1,2, stessa riga (y=50) → arrangiamento **orizzontale** nell'ordine di `rawModel.objects`.
3. **Step 4 / `useM1ReferenceEdges`** creano i `DVoidEdge` per gli slot reference.
4. Il **full build** (`useJjomSync.ts:1075-1081`) chiama `jjomEdgeToRFEdge(e)` → `computeOptimalHandles` sulle **posizioni-griglia** → lati calcolati e messi nell'`rfEdgeCache`.
5. onInit (`EditorV2.tsx:340-356`): se `justCreatedGraphRef`, gira **ELK auto-layout** (`handleAutoLayout`, `:2818-2836`) che **riposiziona** i nodi — ma **NON ricalcola i lati** (vedi Q2).

**I nodi M1 sono creati a default e riposizionati dopo? Sì.** Griglia (Step 2bis) → ELK/utente. **I lati vengono ricalcolati dopo il riposizionamento? NO** — restano quelli calcolati sulle posizioni-griglia stantie.

**Quando (load di progetto salvato)**: le posizioni vertice sono **persistite** nel D-layer, quindi al full build `computeOptimalHandles` legge le posizioni **corrette** → lati corretti. **Il bug si auto-guarisce al reload di un progetto salvato** (a patto che il layout sia stato salvato). Il difetto vive nel flusso **crea/trasforma/importa → auto-layout**, non nel reload.

### Q2 — Perché nessun ricalcolo corregge?

`computeAnchorsWithHysteresis` (l'unico ricalcolo che **ri-sceglie il lato**) è invocato in **soli due punti**, entrambi **drag-only**:
- `EditorV2.tsx:2995` — dentro `onNodesChange`, per gli edge che toccano un nodo **mosso** (`movedNodeIds`).
- `EditorV2.tsx:3164` — `recalculateAnchors`, chiamato da SegmentHandles dopo un drag di segmento.

**Nessun percorso al load/onInit/ELK lo invoca.** I due percorsi non-drag chiamano `applyDistribution`:
- onInit (`:354`) → `applyDistribution(eds)`.
- ELK auto-layout (`handleAutoLayout`, `:2834`) → `applyDistribution(eds)`.

E `applyDistribution` (`:880-985`) **non ri-sceglie il lato**: chiama `computePortDistribution`, che **prende il lato dall'handle esistente** (`portDistribution.ts:74-78,111` via `getBaseSide`, `:37-40`) e riassegna **solo l'indice** `${side}-${i}`. Quindi dopo ELK i nodi si spostano ma i **lati restano congelati**.

Il congelamento è rafforzato dalla sync incrementale: per un edge **già in cache** i lati sono **preservati** (`useJjomSync.ts:1259-1260`: `rfEdge.sourceHandle = existing.sourceHandle`), scartando ciò che `jjomEdgeToRFEdge` ricalcolerebbe con le posizioni correnti. (Un edge che *nasce dopo* il layout — es. slot settato più tardi — passa da `:1162` con posizioni correnti → lato corretto: il difetto è timing-dipendente, colpisce gli edge materializzati **prima** che gli endpoint raggiungano la posizione finale.)

**Dead-zone**: quando un ricalcolo *gira* (drag), nel range 30°–60° la hysteresis **mantiene il lato corrente** (`:385-391`) usando `currentSource.side` = il lato stantio → può **perpetuare** un lato sbagliato attraverso i drag in quella banda angolare. È un contributo secondario, **non** la causa al load (dove nessun ricalcolo gira).

### Q3 — Anchor pinnati?

**Gli edge M1 reference derivati da slot value NON sono pinnati.** `jjomEdgeToRFEdge` (`:470-482`) produce `type:'instanceRef'`/`'composition'` con `data:{referenceName, referenceId}` — **nessun** `sourceAnchor`/`targetAnchor`. `getAnchorConfig` (`useAutoAnchor.ts:249-262`) su `data` senza anchor ritorna `{mode:'auto', side: getBaseSide(handle)}` → **auto**, quindi la hysteresis **può** riroutarli (`:314` freeza solo se `mode==='pinned'`).

Chi pinna: **solo i disegni manuali** M1 (`handleM1Connect`, `EditorV2.tsx:1531-1532,1560`) e le creazioni M2 interattive (`:1389-1390`), che scrivono `{mode:'pinned', side}`. `father`/`mother` vengono dai **dati del modello** (slot), non da disegno manuale → **auto**.

**Verifica in Fase 2**: catturare `edge.data.sourceAnchor?.mode`/`targetAnchor?.mode` dei tre edge; atteso `undefined`/`auto`. Se risultasse `pinned`, cambierebbe il quadro (ma il codice di creazione non scrive pin per gli slot-edge).

### Q4 — Trace numerico del caso B

Posizioni finali rappresentative: `Family(350,300)`, `Member_0(700,80)` (alto-destra), `Member_1(50,560)` (basso-sinistra); size 200×120 → centri `Family(450,360)`, `M0(800,140)`, `M1(150,620)`.

**`computeOptimalHandles@finale`** (eseguito):
- `father` Family→M0: `dx=350, dy=-220` → `|dx|>|dy|`, `dx>0` → **`right/left`** (opposta corretta: target sul lato sinistro di M0, rivolto verso Family).
- `mother` Family→M1: `dx=-300, dy=260` → `|dx|>|dy|`, `dx<0` → **`left/right`** (target sul lato destro di M1).

Quindi **con le posizioni correnti il lato-sorgente sarebbe corretto/opposto**. L'osservato di B è invece **same-side** (`father` `right/right`) e `mother` target su un lato non rivolto verso il source. **`computeOptimalHandles` non può produrre same-side** (ritorna solo coppie opposte — confermato eseguendo tutti e 4 i rami). Perciò la firma di B **non viene dal load** ma dal **drag**:

**`computeAnchorsWithHysteresis@drag` con occupancy** (eseguito): Family con 4 reference uscenti (father/mother/sons/daughters) tutte pre-assegnate a `right-0`, target sparsi a destra:

```
e0 (Family→M0): right / left
e1 (Family→M1): left  / left     ← same-side U (target a DESTRA, ma sceglie sinistra e wrappa)
e2 (Family→M2): left  / left     ← same-side U
e3 (Family→M3): right / left
```

Gli edge **centrali** finiscono **`left/left`**: con il lato `right` di Family affollato (4 edge), la penalità di occupancy (`30/edge`, `useAutoAnchor.ts:588`) scavalca il gap geometrico e vince il candidato **same-side U** (`:565-568`). È esattamente la firma di B (wrap-around same-side), con il verso che dipende da quale lato è affollato e dalla geometria. **Verdetto Q4**: il calcolo alle posizioni correnti dà il lato **opposto giusto**; la U same-side è un **artefatto del percorso drag/occupancy**, non del load né delle posizioni stantie.

### Q5 — Riproduzione minima (load vs move di 1px)

Eseguito sul codice reale. Layout Caso A/C: `Family(100,300)` centro-sinistra, `Member_0(600,100)`, `Member_1(600,500)`.

| stato | father (Family→M0) | mother (Family→M1) | fonte |
|-------|--------------------|--------------------|-------|
| **LOAD** — `computeOptimalHandles` su **griglia** (ordine Family-last: `Family(890,50)`,`M0(50,50)`,`M1(470,50)`) | **`left / right`** | **`left / right`** | griglia stantia → **= osservato (U-turn)** |
| **LOAD** — griglia ordine Family-first (`Family(50,50)`,`M0(470,50)`,`M1(890,50)`) | `right / left` | `right / left` | dipende dall'ordine `rawModel.objects` |
| **MOVE/ricalcolo** — `computeOptimalHandles` alle **posizioni finali** | **`right / left`** | **`right / left`** | **corretto** |

**La differenza è diagnostica**: stessa funzione, stesse posizioni finali → lato **corretto** (`right/left`); il difetto è che al load il lato è calcolato sulle **posizioni-griglia** (`left/right`) e **mai ricalcolato**. Un move di 1px innesca `onNodesChange`→`computeAnchorsWithHysteresis` (`:2995`) che ricalcola alle posizioni correnti → **guarisce** (per gli angoli fuori dalla dead-zone). **Conferma: la causa dei casi A/C è "nessun recalc del lato al load/ELK".**

Nota sull'**ordine-griglia**: perché A/C osservino `left/right`, Family deve avere indice-griglia **maggiore** di entrambi i Member (Family più a destra al build). È l'unica variabile non verificata staticamente (dipende dall'ordine di `rawModel.objects`, cioè da come la trasformazione/import crea i `DObject`); da confermare catturando l'ordine live. Il meccanismo (lato = funzione delle posizioni-griglia, congelato) **non** dipende da quale ordine esca.

### Q6 — Punti di aggancio Fase 2 + rischi

| # | Leva | File | Critical-zone / LIR | Invasività | Copre | Rischi |
|---|------|------|---------------------|-----------|-------|--------|
| **1 (raccomandata)** | **Recalc one-shot dei lati non-pinned al load/onInit e dopo ELK** — sostituire/anticipare il `applyDistribution(eds)` di `handleAutoLayout` (`EditorV2.tsx:2834`) e dell'onInit (`:354`) con un ricalcolo lato (`getOptimalAnchorsForAllEdges` o `computeAnchorsWithHysteresis`) **prima** del re-index | `EditorV2.tsx` (solo) | **No** (EditorV2 non è §3.1) → **LIR not-required** | **bassa/media** | **A, C** (e, se si usa `getOptimalAnchorsForAllEdges`/`computeBestAnchors`, anche B: `computeBestAnchors` non ha il candidato same-side → niente U spurie) | Rispettare pinned (già gestito `:314`) e inheritance top/bottom (`:330`); azzerare/coerenziare i waypoint sul cambio-lato (R2, come il drag `:3016`); non degradare S1 (i lati alimentano `portDistribution`/`bundleSpread`: lati opposti frontali → S1 preservato/migliorato — **rieseguire** `bundleSpread.test.ts` 10/10 + `handlePosition.test.ts`) |
| **2** | **Ridurre l'occupancy-overflow** in `computeBestAnchorsWithContext` — alzare `sameSidePenalty` (`:596`) o gate della U sul lato opposto realmente inutilizzabile, così un lato opposto geometricamente corretto non venga abbandonato solo per affollamento | `useAutoAnchor.ts` | **No** → LIR not-required | **media** | **B** | Interagisce con l'uso legittimo della U (coppie inheritance+ref `:498`, grafi densi); coperto dai test di occupancy esistenti; tarare la soglia |
| **3 (sconsigliata)** | Rendere la scelta-lato **reattiva alla posizione** nel sync layer (`useM1ReferenceEdges`/`useJjomSync`) | critical-zone | **Sì** → **LIR obbligatorio** | **alta** | tutti | **R1 re-render cascade** (scartato consapevolmente 2026-05-27), R2 waypoint/segmentIndex, R3 pinned; sconsigliata |

**Raccomandazione**: **Leva 1** (recalc one-shot al load/ELK, in `EditorV2.tsx`, fuori critical-zone). Se si usa `getOptimalAnchorsForAllEdges` (geometry-only + deconfliction, **niente** candidato same-side) copre A/C **e** neutralizza B senza toccare la heuristica di occupancy; in alternativa `computeAnchorsWithHysteresis` + **Leva 2** per governare l'occupancy. La scelta tra le due varianti dipende da quanto si vuole preservare lo spreading multi-lato dell'occupancy sui nodi ad alto grado — da decidere in chat.

---

## 2. Tabella dei tre casi

| Caso | Layout finale | Osservato | Atteso (criterio) | Handle al LOAD (`computeOptimalHandles`) | `mode` anchor persistito | Meccanismo |
|------|---------------|-----------|-------------------|------------------------------------------|--------------------------|------------|
| **A** | Family centro-sx; M0 alto-dx; M1 basso-dx | `father`,`mother`: **source=left** (U-turn), target a destra | source=`right` (se `centerX(t)−centerX(s)>dead-zone`) | griglia Family-last → **`left/right`** (congelato) | `auto` (atteso; slot-edge non pinnati) | **load-freeze** (posizioni-griglia stantie, nessun recalc) |
| **B** | diagonale: M0 alto-dx; M1 basso-sx | `father`: **`right/right`** (U same-side); `mother`: target su lato non frontale | `father`→target left/bottom di M0; `mother`→target top di M1; mai U se un lato frontale è libero | `computeOptimalHandles@finale` = **`right/left`** (opposta) — la same-side **non** viene dal load | `auto` (atteso) | **drag occupancy-overflow** (`computeBestAnchorsWithContext` U-shape; riprodotto: lato affollato → `left/left`) |
| **C** | zoom su edge selezionato (come A) | source=`left` con ricciolo | source=`right` | griglia Family-last → **`left/right`** (congelato) | `auto` (atteso) | **load-freeze** (= Caso A) |

**Handle "persistiti"**: gli handle **non** sono persistiti nel D-layer (ricalcolati ad ogni `applyDistribution`/build). Persistiti sono **posizioni** (`scheduleLayoutSave`, `EditorV2.tsx:3066`) e, se presente, `data.{sourceAnchor,targetAnchor}` (mode). Per gli slot-edge M1 il mode è `auto`.

---

## 3. Inventario trigger di scelta-lato (esaustivo)

| Percorso | Funzione | file:line | Ri-sceglie il lato? |
|----------|----------|-----------|---------------------|
| Full build (load) | `jjomEdgeToRFEdge`→`computeOptimalHandles` | `useJjomSync.ts:1075-1081` · `jjomTransformers.ts:439` | **Sì**, sulle posizioni correnti (griglia per M1 freschi), poi **congelato** |
| Sync incrementale (edge nuovo) | `jjomEdgeToRFEdge` | `useJjomSync.ts:1162` | Sì (posizioni al momento della materializzazione) |
| Sync incrementale (edge esistente) | preserva handle da cache | `useJjomSync.ts:1259-1260` | **No** (congela) |
| onInit | `applyDistribution` | `EditorV2.tsx:354` | **No** (solo re-index) |
| ELK auto-layout | `applyDistribution` | `EditorV2.tsx:2834` | **No** (solo re-index) |
| Drag nodo | `computeAnchorsWithHysteresis` | `EditorV2.tsx:2995` | **Sì** (guarisce; dead-zone può congelare 30°–60°) |
| Drag segmento | `computeAnchorsWithHysteresis` | `EditorV2.tsx:3164` | **Sì** |

---

## 4. Onestà intellettuale / limiti

- Coordinate dell'harness **rappresentative**, non i pixel esatti degli screenshot; il **meccanismo** è provato (righe + esecuzione del codice reale), i **valori esatti** dei tre casi vanno confermati in Fase 2 (capture live: posizioni, ordine `rawModel.objects`, `edge.data.*.mode`).
- **Ordine-griglia**: variabile non verificata staticamente (dipende dalla creazione dei `DObject`); non altera il meccanismo.
- Casi **A/C riprodotti e spiegati** (load-freeze). Caso **B riprodotto** come occupancy-overflow del percorso drag; il verso esatto (`right/right` vs `left/left`) dipende dal set completo di edge di Family e dallo storico drag — da confermare col grafo reale.
- Harness temporaneo `_sideSelectionCapture.test.ts` **creato, usato e rimosso**; nessuna strumentazione committata; nessun file sorgente modificato.

## HARD STOP

Fine del documento. Nessuna modifica a sorgente, nessuna strumentazione committata. La Fase 2 (fix — Leva 1 raccomandata) parte **solo** dopo go-ahead esplicito di Alfonso con prompt separato, e deve iniziare **catturando lo stato live** (posizioni + ordine oggetti + mode anchor) dei tre casi sul modello reale.

## Riferimenti

- `docs/discovery/2026-07-06-anchor-ordering-manhattan.md` (S4 sospetto aperto, pipeline 5 stadi, LIR/rischi R1–R6)
- `docs/discovery/2026-07-07-family-member-capture.md` (harness di cattura, S1 post-fix, S6)
- CLAUDE.md §3.1 (critical-zone), §3.5 (`useM1ReferenceEdges`/Step 4), §5.1 (specifica formale + riproduci-prima + non validare i sort leggendo il comparator)
- Fuori scope: S6 (pairing same-side), S1 (già fixato), S2 label, Phase B lane router, merge eOpposite.

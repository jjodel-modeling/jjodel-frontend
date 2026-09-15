# Discovery S7 — Center-pinning dell'inheritance vs ordine geometrico degli anchor sullo stesso lato

**Data**: 2026-07-07 20:53
**Tipo**: discovery Fase 1, **READ-ONLY** (nessuna modifica a file sorgente)
**Critical-zone coinvolta**: `portDistribution.ts` (§3.10) in sola lettura; il fix proposto vive in `handlePosition.ts` + `useTreeLayout.ts` (fuori critical-zone di scrittura).
**Fixture**: metamodello M2 "hospital" (Person, Patient, Doctor, Visit, Prescription). Casi P (Patient.top) e D (Doctor.top).
**Harness**: `scratchpad/s7_harness.mjs` (non committato) — riproduce le frazioni e conta gli incroci.
**HARD STOP**: al termine di questo documento. La Fase 2 (implementazione + riscrittura dei test sull'invariante nuovo) parte solo dopo go-ahead esplicito.

---

## Conferma live (Fase 2 · Step A) — 2026-07-07 22:27

Go-ahead Fase 2 concesso (Opzione a). Impossibile pilotare l'app dal CLI (nessun
Playwright/Puppeteer, nessuna fixture hospital committata, nessun accesso alla console del
browser; il dev server jjodel è però vivo su `localhost:3000`). Decisione presa in chat: **riproduzione
eseguibile contro le funzioni sorgente REALI** (non il port scratchpad della Fase 1). Harness temporaneo
`__tests__/s7_repro.tmp.test.ts` — eseguito con vitest, **non committato, poi rimosso**. Coordinate nodo =
approssimazioni da screenshot (§5.1: la conferma visiva finale resta il gate di Alfonso); i fatti di
**ordinamento/pinning** provati qui sono scene-independent e girano su codice di produzione.

Pipeline reale esercitata: `computePortDistribution` (indici reali) → `computeSideEndpoints` →
`computeSidePositions` (le frazioni sotto esame) → `computeHandlePositionForNode` (landing ramo, path
senza posizioni come lo chiama `useTreeLayout`) → `computeTreeConnectorPath` (geometria albero → barY).

**Output reale (identico all'harness Fase 1 §0/§5):**

```
[Case P] Patient.top  (REAL computeSidePositions)
   top-0:source  inheritance  opp=Person     oppX= 230  frac=0.500  x=555   (CENTRO, pinnato)
   top-0:target  reference    opp=Container  oppX= 510  frac=0.333  x=507
   => bus 230→555 attraversa containment@507  → 1 incrocio

[Case D] Doctor.top   (REAL computeSidePositions)
   top-0:source  inheritance  opp=Person       oppX= 230  frac=0.500  x=995  (CENTRO, pinnato)
   top-0:target  reference    opp=Visit        oppX= 700  frac=0.250  x=910
   top-1:target  reference    opp=Prescription oppX=1300  frac=0.750  x=1080
   => bus 230→995 attraversa doctor→Visit@910  → 1 incrocio
```

**Risultati:**

1. **Root cause CONFERMATA su codice di produzione.** Con reference presenti sul lato,
   `computeSidePositions` REALE pinna l'inheritance a **0.500** (P e D) e colloca le reference sugli slot
   esterni — esattamente la firma dell'incrocio. **La riproduzione NON smentisce** la root cause (nessun
   HARD STOP Step A). Nota: containment e inheritance condividono `top-0` (ruoli/bucket distinti:
   `top-0:source` vs `top-0:target`), come previsto dalla Q2 (fan-out/fan-in su una porta).
2. **Grouped vs single: UN SOLO albero.** Il predicato di `useTreeLayout.ts:65-75` (copia fedele)
   raggruppa `group(Person) = [inh-doctor, inh-patient]`, `length=2` → `isGrouped=true`. Nessun ramo è
   escluso (nessun anchor pinnato non-standard). Patient e Doctor sono **due rami dello stesso albero**.
3. **Anomalia barY risolta strutturalmente.** Un singolo albero Person→{Patient,Doctor} produce **UNA
   sola barY** (`computeTreeConnectorPath` reale: `barY=370` nel layout canonico; entrambi i rami
   atterrano al centro: `landing Patient.x=555`, `Doctor.x=995`). Di conseguenza le y osservate
   **420 (P)** e **1100 (D)** **non possono essere entrambe la barra di questo albero**. Spiegazione: le
   due catture provengono da un **layout diverso/più sciolto o da due screenshot separati** (Person
   ravvicinato sopra ciascun figlio → barra vicina al figlio: ~420 sopra Patient, ~1100 sopra Doctor),
   **non** da un'esclusione dal grouping (che non avviene). **Il fix non dipende da questa risoluzione**:
   corregge `childX` in `computeSidePositions`, consumato identico da entrambi i rendering (ramo tree via
   `computeHandlePositionForNode` e handle via DynamicHandles). La conferma visiva esatta delle y resta il
   gate di Alfonso.

> **Onestà**: le coordinate nodo sono ipotesi da screenshot; ciò che gira su codice reale è
> l'**ordinamento** (pinning 0.5, slot esterni, indici da `computePortDistribution`, grouping, barY unica
> per albero). Il gate visivo su `localhost:3000` conferma le y reali e l'assenza di incroci post-fix.

---

## 0. Sintesi (TL;DR) — leggere prima di tutto

**Root cause confermata.** L'endpoint inheritance sul lato del figlio è **pinnato alla frazione
0.5 (centro)** per costruzione, in `computeSidePositions` (`handlePosition.ts:266-268`), **fuori**
dall'ordinamento geometrico che governa le reference (`byGeometry`, `:230-235`). Quando la
direzione di uscita del ramo/bus inheritance è **laterale** (il parente è di lato, non sopra al
figlio), il pin al centro produce un'**inversione strutturale** che nessun ordinamento delle sole
reference può sanare: il bus orizzontale che dal centro va verso il parente **taglia** la verticale
di ogni reference che sta *tra il centro e il parente*.

La causa **non** è un comparator sbagliato né la selezione lato: è che l'inheritance non partecipa
all'ordinamento. La firma dei due casi P e D è identica.

**Verdetto**: **ipotesi del prompt confermata**. Il posizionatore ordina geometricamente solo le
reference (`ref` in `byGeometry`) e pinna l'inheritance (`inh` in `bySortKey` → 0.5). Fix =
**far partecipare l'inheritance all'ordinamento geometrico** per il centroide del parente.

**Cattura statica (harness)** — riproduce l'osservato e verifica il fix:

| caso | CURRENT (pin center) | incroci | PROPOSED (geometrico) | incroci |
|------|----------------------|---------|-----------------------|---------|
| **P** Patient.top | inh@**555** (centro), containment@507 | **1** (containment@507) | inh@**507** (leftmost), containment@603 | **0** |
| **D** Doctor.top | doctor@910, inh@**995** (centro), prescribedBy@1080 | **1** (doctor→Visit@910) | inh@**910** (leftmost), doctor@995, prescribedBy@1080 | **0** |

**Accoppiamento critico per il fix (R4, non negoziabile).** Il landing del ramo tree
(`useTreeLayout` → `computeHandlePositionForNode`, `handlePosition.ts:293`) chiama
`computeSidePositions` **SENZA `nodePositions`**, mentre DynamicHandles lo chiama **CON**
(`DynamicHandles.tsx:112`). Oggi coincidono solo perché l'inheritance è geometry-independent
(0.5 con o senza posizioni). **Se l'inheritance diventa geometry-aware senza propagare
`nodePositions` dentro `computeHandlePositionForNode`, il ramo tree atterra a una frazione diversa
da dove l'handle è disegnato** → ricompare il bypass che la discovery 2026-05-25 aveva chiuso.
Il fix è a due punti coordinati: `computeSidePositions` **e** il threading di `nodePositions`
attraverso `useTreeLayout`/`computeHandlePositionForNode`.

---

## 1. La pipeline del landing inheritance (chi decide cosa)

```
                                       ┌────────── rendering handle (dot) ──────────┐
DynamicHandles.tsx:96-116                                                            │
  nodePositions = imperativo dallo store (:103-109)                                  │
  sidePositionsBySide[side] = computeSidePositions(                                  │
        computeSideEndpoints(edges,nodeId,side),  nodePositions )   ← CON posizioni  │  (:112)
        → Map<'handleId:role', 0..1>                                                 │
  sourcePercent = map['handleId:source'] ?? 0.5   (:241)  → CSS top/left %           │
                                                                                     ┘
                                       ┌───── landing del ramo tree (grouped) ───────┐
useTreeLayout.ts:99-136 (isGrouped = group.length>1)                                 │
  per ogni figlio:                                                                   │
    childHandleId = edge.sourceHandle ?? `${sourceSide}-0`      (:120)               │
    handlePos = computeHandlePositionForNode({edges: allEdges, …, handleId})  (:121) │
    branches.push({ childX: handlePos.x, childY, edgeId })      (:132)               │
  computeTreeConnectorPath(targetX,targetY,branches,…)          (:135)               │
                                                                                     ┘
computeHandlePositionForNode  handlePosition.ts:281-305
    positions = computeSidePositions(computeSideEndpoints(edges,nodeId,side))  (:293)  ← SENZA posizioni
    percent   = positions.get(`${handleId}:${role}`) ?? 0.5                    (:294)
    x = nodeX + percent*nodeWidth  (top/bottom)                                (:298-303)
```

**Nota (edge inheritance NON grouped)**: `treeGeometry` è `null` se `group.length ≤ 1`
(`useTreeLayout.ts:99`, `:78-79`). Un singolo figlio→parente è disegnato come `UnifiedEdge`
Manhattan; il suo `sourceX` arriva **misurato da RF** dal DOM dell'handle, che DynamicHandles ha
piazzato a `sourcePercent` (= 0.5 pinnato). **Quindi grouped e non-grouped atterrano entrambi al
centro** per lo stesso motivo (pin in `computeSidePositions`); il fix li corregge entrambi.
I casi P e D hanno Person con 2 figli (Patient+Doctor) → `group.length=2` → **grouped** → il ramo
passa da `computeHandlePositionForNode` (path senza posizioni). *Vedi Q4 sull'accoppiamento.*

---

## 2. Risposte alle 6 domande

### Q1 — Chi decide la x di landing del ramo inheritance sul lato del figlio? È una variabile o due calcoli che devono coincidere?

**Decisore unico della *frazione*: `computeSidePositions` (`handlePosition.ts:184-271`)**, blocco
di pinning inheritance `:266-268`:

```typescript
inh.forEach((e, i) => { result.set(key(e), 0.5 + (i - (M - 1) / 2) * step); });
```

Con un solo endpoint inheritance sul lato (M=1, i=0) → `0.5 + 0 = 0.5` → **centro**, **a prescindere
da `nodePositions`** (l'inheritance è filtrato in `inh` e ordinato con `bySortKey`, geometry-blind,
`:240`). Nessun calcolo concorrente: né `useTreeLayout` né `computeTreeConnectorPath` calcolano la
frazione; la consumano.

- **Grouped**: `useTreeLayout.ts:121-130` invoca `computeHandlePositionForNode`, che ritorna
  `handlePos.x = nodeX + percent*nodeWidth` con `percent = 0.5` → `childX = centro` (`:132`).
- **Non-grouped**: RF misura il DOM piazzato da DynamicHandles a `sourcePercent = 0.5`.

**La x del bus orizzontale e la x del landing sono la STESSA variabile**, non due calcoli da far
coincidere. Il ramo tree è una L a 4 punti (`edgeUtils.ts:1171`):

```
M parentX trunkStartY  L parentX barY  L childX barY  L childX childY
```

`childX` è: (a) l'estremo del segmento **orizzontale** (`L childX barY`) e (b) la x del segmento
**verticale** di landing (`L childX childY`). Un'unica `childX = branches[i].childX = handlePos.x`.
L'orizzontale corre da `childX` a `parentX`; il landing è a `childX`. Coincidono per costruzione.
**È esattamente qui che nasce l'incrocio**: `childX` è pinnato al centro, ma `parentX` è di lato →
l'orizzontale attraversa lo spazio *tra* centro e parente, dove stanno le reference "interne".

### Q2 — Perché il pin al centro è load-bearing (R4)? Chi assume 0.5?

Tre consumer/vincoli assumono l'inheritance centrata; solo **due** sono realmente load-bearing:

1. **[LOAD-BEARING] L'invariante "no-thread" tra ramo e handle** — `handlePosition.ts:237-239`
   (commento esplicito):
   > *"Inheritance stays on bySortKey (centered, geometry-independent) so the tree-branch path and
   > the rendered handle agree without threading positions through useTreeLayout."*
   Il pin al centro è **il meccanismo** che consente a `computeHandlePositionForNode` di **NON**
   passare `nodePositions` (`:293`) e comunque coincidere con DynamicHandles (che le passa,
   `DynamicHandles.tsx:112`). 0.5 == 0.5 banalmente. **Togli il pin → i due path divergono** a meno
   di propagare le posizioni (vedi Q4). *Questa è la ragione strutturale di R4.*

2. **[LOAD-BEARING, ma solo un test] Il lock di regressione** — `handlePosition.test.ts:81-91`
   (`'inheritance is centered (0.5) and identical with/without positions'`) asserisce
   `toBeCloseTo(0.5)` **e** l'uguaglianza con/senza posizioni. È l'unico test che cambia invariante
   (elencato in Q6). Nessun altro test lo tocca.

3. **[NON load-bearing] Il tree connector geometrico** — `computeTreeConnectorPath`
   (`edgeUtils.ts:1104-1181`) **NON assume** `childX = centro`: prende `branches[].childX` come dato,
   ordina per `childX` (`:1119`), estende la barra a includere `parentX`
   (`barLeftX/barRightX`, `:1140-1141`) e disegna a quel `childX`. **Segue automaticamente** qualsiasi
   frazione (adatta barra e rami). Non si sfasa se il landing si sposta — anzi è ciò che rende il fix
   possibile senza toccarlo. (Il "doppio calcolo divergente" temuto dal prompt **non esiste** lato
   geometria: unica `childX`. Il vero rischio di divergenza è Q4, tra i **due** call-site di
   `computeSidePositions`.)

**Cosa si sfasa concretamente se il landing si sposta a frazione ≠ 0.5** senza altre modifiche:
il ramo tree (path senza posizioni, `:293`) resta a 0.5, l'handle disegnato (con posizioni) va alla
frazione geometrica → **il ramo non atterra più sul dot**. Regressione del bypass 2026-05-25.
**Rimedio**: threading di `nodePositions` (Q4). Il tree connector, i marker, e la persistenza non si
rompono.

**Corner case — fan-in/fan-out condividono UNA porta.** `portDistribution.ts:81-99` (source side) e
`:115-130` (target side) collassano *tutte* le inheritance da/verso lo stesso `(nodo, side)` in **un
solo** PortGroup → un solo `handleId` → `computeSideEndpoints` dedup per `${handleId}:${role}` →
**M=1 sul lato figlio** nella pratica. Il cluster multi-parente (M≥2) in `:266-268` è di fatto un
percorso raro (richiederebbe inheritance sorgente *e* target sullo stesso lato). Per S7, M=1: il fix
si semplifica (nessun cluster da preservare).

### Q3 — L'inheritance può entrare nell'ordinamento geometrico? Con quale sort key?

**Sì.** La chiave naturale, **coerente con come già ordinano le reference**, è il **centroide del
nodo opposto** — per l'inheritance, il **parente** — sull'asse del lato (`centerX` su top/bottom,
`centerY` su left/right). È esattamente `oppositeCoord` in `byGeometry` (`handlePosition.ts:197-202,
230-235`); l'informazione **è già disponibile**: `computeSideEndpoints` popola `oppositeNodeId`
(`:137-149`) anche per l'inheritance (`e.target` per il source, `e.source` per il target), e
`nodePositions` è già passato da DynamicHandles.

Verifica che la chiave produca l'ordine atteso (harness §0):

- **Caso P** (Patient.top): oppX = {Person **230**, container **510**} → asc → inheritance **leftmost**
  (0.333), containment a destra (0.667). ✔
- **Caso D** (Doctor.top): oppX = {Person **230**, Visit **~700**, Prescription **~1300**} → asc →
  inheritance **leftmost** (0.25), doctor (0.5), prescribedBy (0.75). ✔

**Direzione del bus vs centroide del parente** (nota del prompt: *"il centroide del padre può essere
fuorviante per bus lunghi"*). In entrambi i casi il parente (Person@230) è **nettamente** a sinistra
dell'intero nodo figlio → tutti gli slot sono a destra di `parentX` → tutti i rami escono a sinistra
→ lo slot **leftmost** minimizza l'attraversamento. Il centroide del parente **è** la direzione di
uscita in questo regime. La chiave-centroide fallirebbe solo se il parente cadesse *dentro* la banda
x del figlio (bus quasi verticale, direzione ambigua) — ma lì l'incrocio è comunque minimo e
l'ordine è irrilevante. **Raccomandazione**: centroide del parente come chiave primaria (riuso di
`byGeometry`); il "primo waypoint / segno di `parentX−childX`" è un raffinamento non necessario per
P/D, da tenere in riserva se emergesse un caso patologico di bus lungo con inversione.

`computeSidePositions` **ha già** tutto il necessario (endpoint con `oppositeNodeId` + `nodePositions`).
Serve solo **non filtrare** l'inheritance fuori da `ref`/`byGeometry`. Nessun dato nuovo da passare a
DynamicHandles; **sì** da passare a `computeHandlePositionForNode` (Q4).

### Q4 — Coerenza col tree connector: `useTreeLayout` segue in automatico o diverge? Punto di accoppiamento.

**Diverge — non segue in automatico.** È l'accoppiamento più delicato del fix.

- `DynamicHandles.tsx:112` chiama `computeSidePositions(…, nodePositions)` → **CON** geometria.
- `useTreeLayout.ts:121` → `computeHandlePositionForNode(…)` → `handlePosition.ts:293`
  `computeSidePositions(computeSideEndpoints(edges, nodeId, side))` → **SENZA** geometria.

Oggi coincidono perché l'inheritance è pinnata (0.5 in entrambi). **Rendendo l'inheritance
geometry-aware, il ramo (senza posizioni) userebbe il fallback `bySortKey`** (role/index) mentre
l'handle (con posizioni) userebbe `byGeometry` → **frazioni diverse** → il ramo non atterra sul dot.

**Punto di accoppiamento esatto da chiudere in Fase 2**:
1. `computeHandlePositionForNode` (`handlePosition.ts:281-305`): aggiungere un parametro opzionale
   `nodePositions?: Map<string, NodePosition>` e propagarlo a `computeSidePositions` (`:293`).
2. `useTreeLayout` (`hooks/useTreeLayout.ts:121-130`): costruire la `nodePositions` (ha già
   `allNodes`, `:59` — stesso pattern di `DynamicHandles.tsx:103-109`) e passarla alla chiamata.
   `computeTreeConnectorPath` (`:135`) non cambia: consuma `childX` già geometrico.

**È la stessa funzione** (`computeSidePositions`) su **due call-site** con input diverso: la coerenza
non è automatica, va garantita passando lo stesso `nodePositions` a entrambi. Il fallback senza
posizioni deve restare (input degeneri / test 31-39): se manca il centroide, `byGeometry` degrada a
`byPairStable`→`bySortKey` (già così, `:223-235`).

### Q5 — Cattura statica dei due casi (harness)

`scratchpad/s7_harness.mjs` porta 1:1 l'ordinamento di `computeSidePositions` (CURRENT) e una
variante PROPOSED (inheritance foldata in `byGeometry`, M trattato come 0), poi conta gli incroci
(reference con verticale a `refX` strettamente tra `parentX` e `inhX`). Coordinate = approssimazioni
da screenshot (§5.1: ipotesi).

```
===== Case P — Patient.top (parentX=Person≈230) =====
endpoint            oppX  | CURRENT frac  x   | PROPOSED frac  x
inh→Person           230  | 0.500        555 | 0.333         507
containment          510  | 0.333        507 | 0.667         603
CURRENT : inhX=555  crossings=1 [containment@507]
PROPOSED: inhX=507  crossings=0 []

===== Case D — Doctor.top (parentX=Person≈230) =====
doctor→Visit         700  | 0.250        910 | 0.500         995
inh→Person           230  | 0.500        995 | 0.250         910
prescribedBy→Presc  1300  | 0.750       1080 | 0.750        1080
CURRENT : inhX=995  crossings=1 [doctor→Visit@910]
PROPOSED: inhX=910  crossings=0 []
```

**Interpretazione**: in entrambi i casi il CURRENT riproduce l'osservato (inheritance al centro,
1 incrocio con la reference "interna"); il PROPOSED sposta l'inheritance allo slot leftmost e porta
gli incroci a **0**, con l'ordine atteso da §0 (P: inh, containment; D: inh, doctor, prescribedBy).
Le reference "interne" (containment, doctor→Visit) migrano verso destra/centro; questo può introdurre
un piccolo jog orizzontale in cima alla loro verticale, ma **non genera nuovi incroci** con
l'inheritance (verticale a destra di `inhX`, fuori dalla banda `[parentX, inhX]`).

> **Onestà (§5.1)**: le y osservate (barY≈420 caso P vs ≈1100 caso D) sono incoerenti con **una
> sola** barY per un unico albero Person→{Patient,Doctor}. O i due figli sono a quote molto diverse,
> o (meno probabile) un ramo è escluso dal grouping (anchor pinnato, `useTreeLayout.ts:68-73`) e reso
> come `UnifiedEdge`. **Non cambia la root cause** (il landing viene comunque da `computeSidePositions`
> in entrambi i rendering), ma **Fase 2 deve riprodurre sul live** e confermare grouped-vs-single per
> ciascun caso prima di scrivere il fix (non fidarsi di fixture a memoria).

### Q6 — Punti di aggancio Fase 2 (invasività, rischi, test che cambiano)

| # | Opzione | Dove | Invasività | Test che cambiano invariante | Rischi |
|---|---------|------|-----------|------------------------------|--------|
| **(a)** | **Inheritance partecipa a `byGeometry`** (fold in `ref`, M→0) | `handlePosition.ts:240-268` (togliere il filtro `inh`, ordinare tutti gli N con `byGeometry`, distribuzione uniforme `(k+1)/(N+1)`) **+** threading `nodePositions` in `computeHandlePositionForNode` (`:281-305`) e `useTreeLayout` (`:121-130`) | **media** (2 file, no critical-zone scrittura) | **`handlePosition.test.ts:81-91`** (inheritance non più 0.5 con reference presenti) — riscrivere sull'invariante nuovo. **Nuovo test**: inheritance ordinata per centroide parente (P e D). | R4 (Q4): se non si fa il threading → ramo divergente. Singleton inheritance resta 0.5 automaticamente (N=1). |
| **(b)** | **Eccezione minima**: pin al centro SOLO se il lato non ha altri endpoint | `handlePosition.ts:240-268` (branch `if (R===0) pin; else fold in geometry`) | **bassa** | Stesso test 81-91 (con reference → non più 0.5). Il caso *inheritance sola* resta 0.5. | Superflua: (a) già dà 0.5 al singleton (N=1 → `(0+1)/(1+1)=0.5`). L'eccezione è ridondante; **preferire (a)**. |
| **(c)** | Sort key = **direzione del bus** (segno `parentX−childX` / primo waypoint) invece del centroide | come (a), ma comparator custom per l'inheritance | **media/alta** | come (a) + eventuale test sulla direzione | Più robusto per bus lunghi patologici, ma per P/D **equivalente** al centroide (Q3). Over-engineering allo stato attuale. |

**Test che NON cambiano** (devono restare verdi): `handlePosition.test.ts` 12-25 (cross-role ref),
31-39 (fallback role-primary), 43-78 (same-role geometry), 96-105 (tie no edgeId), 107-115 (singleton),
118-133 (empty/missing), 136-194 (pair-stable). Blast radius sui test = **1 invariante** (81-91) + 1
nuovo.

**Impatto `useTreeLayout`**: solo il threading di `nodePositions` (Q4). `computeTreeConnectorPath`,
la ricerca `findClearBarY`, i marker, la registrazione crossing → invariati.

**Rischio per i casi già corretti**: S1 (Z-corridor), il bundle frontale `byPairStable`, la
regression suite reference-only → **non toccati**: `byGeometry`/`byPairStable` per le reference
restano identici; cambia solo che l'inheritance entra nello stesso ordinamento invece di essere
estratta. La `collision-freedom` (`handlePosition.ts:170-178`) è **rafforzata**: con M=0 tutti gli
endpoint cadono su slot uniformi distinti `(k+1)/(N+1)`, senza il caso "cluster+outer".

**Raccomandazione**: **Opzione (a)** — foldare l'inheritance in `byGeometry` con chiave-centroide del
parente **+** threading `nodePositions` in `computeHandlePositionForNode`/`useTreeLayout`. È il fix
minimo che chiude la root cause e mantiene l'invariante ramo↔handle. (b) è ridondante, (c) prematura.

---

## 3. Layer Impact Report (fix proposto — Fase 2)

```
Layers touched (dal fix Opzione (a)):
  [ ] D-layer / L-layer / JjOM / Persistence — NO
  [x] Canvas v2-flow (handle rendering + tree branch landing)
  [ ] Sync layer (useJjomSync) — NO
Files: handlePosition.ts (computeSidePositions, computeHandlePositionForNode),
       useTreeLayout.ts (threading nodePositions). portDistribution.ts: solo lettura.
Cross-layer: computeSidePositions è consumato da DynamicHandles (rendering) e da
       useTreeLayout via computeHandlePositionForNode. Il threading di nodePositions
       mantiene i due call-site coerenti (R4).
Side-effect safety: nessuna scrittura D/JjOM; nessun TRANSACTION; nessun DVoidEdge.new2.
       Posizionatori puri + un parametro opzionale. Fuori critical-zone di scrittura.
Smoke-test Fase 2:
  - hospital M2: Patient.top e Doctor.top → 0 incroci inheritance×reference.
  - Families.ecore (reference-only frontale) → invariato (zero-crossing byPairStable).
  - classe con sola inheritance → generalization ancora centrata (0.5).
  - albero multi-figlio: ramo atterra sul dot (ramo==handle) dopo il threading.
```

**Critical-zone**: `portDistribution.ts` (§3.10) è **solo letto**; il fix non lo tocca. `handlePosition.ts`
e `useTreeLayout.ts` non sono nella lista critical-zone di scrittura di §3.1 (sono consumer puri).
Nessun requisito §3.3/§3.4 (nessuna TRANSACTION, nessun `DVoidEdge.new2`). LIR quindi = **prodotto qui,
per completezza**; il fix è a basso rischio di propagazione.

---

## 4. Verdetto

1. **Root cause**: l'inheritance è pinnata a 0.5 in `computeSidePositions` (`handlePosition.ts:266-268`)
   e **non partecipa** all'ordinamento geometrico delle reference (`byGeometry`, `:230-241`). Con bus
   laterale, il segmento orizzontale centro→parente taglia le reference interne. **Confermata** su P e D
   (harness: 1 incrocio ciascuno, azzerato dal fold geometrico).
2. **Il pin è load-bearing per un solo motivo strutturale** (R4): tiene coerenti i **due** call-site di
   `computeSidePositions` (DynamicHandles con posizioni, `computeHandlePositionForNode` senza) senza
   dover propagare `nodePositions` in `useTreeLayout`. Il tree connector **non** dipende dal centro.
3. **Fix raccomandato**: Opzione (a) — inheritance in `byGeometry` per centroide del parente **+**
   threading `nodePositions` in `computeHandlePositionForNode`/`useTreeLayout`. Invasività **media**,
   fuori critical-zone di scrittura, 1 test da riscrivere (`handlePosition.test.ts:81-91`) + 1 nuovo.

---

## HARD STOP

Fermata dopo questo documento. Nessuna modifica a sorgente, nessun test riscritto (i test
sull'invariante nuovo si decidono in Fase 2, con prompt separato, dopo la decisione in chat).
**Fase 2 deve iniziare riproducendo sul live** i casi P/D (grouped-vs-single, barY reali) prima di
scrivere il fix.

## Riferimenti

- `docs/discovery/2026-07-06-anchor-ordering-manhattan.md` — pipeline 5 stadi, `byGeometry`/`byPairStable`, R4.
- `docs/discovery/2026-05-27_anchor_ordering_inversion.md` — origine di `computeSidePositions` role→geometry (Opzione A), known limitation drag.
- `docs/discovery/2026-05-25_inheritance_anchor_distribution.md` — il bypass `childCenterX` del tree connector (chiuso da `computeHandlePositionForNode`).
- CLAUDE.md §3.1 (critical-zone), §3.10 (role-aware bucket / `nodeHandles` morto), §5.1 (specify + reproduce).
- Tassonomia: S1 Z-corridor (fixato), S4 side-selection (fixato, S4b in corso), S6 pairing U (fix pendente), **S7 inheritance center-pinning (questa)**, S2 label (pendente).

# Routing degli archi — Fase A: riproduzione e misura

> 2026-08-25. Punto 1 della board «Jjodel Canvas Redesign», riaperto con specifica
> formale. **Nessuna modifica al sorgente**: questa fase misura e basta.
> Sonda: `frontend/scripts/smoke/_tmp_routing.ts` (gitignored, come tutte le `_tmp_`).
> Baseline dei path sani: `frontend/scripts/smoke/_tmp_routing_baseline.json` (idem).

---

## 1. Metodo

Fixture costruita dentro la pagina, due classi che esistono solo nella sonda:
M2 `Alpha --betas--> Beta`; M1 con `a1` (Alpha), `b1` (Beta) collegati, piu' `c1`
(una seconda istanza di Beta, senza archi) che fa da terzo nodo frapposto.
Nessun progetto esistente aperto, nessun literal di metaclasse nell'implementazione.

Perimetro dichiarato: il ramo **ortogonale**, quello che `computeManhattanPath` serve.
La sonda gira in sintassi astratta, senza viewpoint IR attivo: e' lo stesso ramo di
codice (`UnifiedEdge.tsx:200`), e la variante IR non ortogonale
(`getStraightPath`/`getBezierPath`, R-B9/R-B12) e' fuori perimetro per prompt.

I criteri girano sul path **finale letto dal DOM** — cioe' dopo waypoint,
`applyBundleSpread`, arrotondamento degli spigoli e archi-ponte — campionato ogni 2px
con `getPointAtLength`, che attraversa anche gli archi:

- **F1**: nessun campione dentro il rect di un nodo visibile gonfiato di 4px, esclusi
  i primi e gli ultimi 8px di arco (lo stub perpendicolare in uscita e in entrata).
- **F2**: fuori dagli stub, distanza minima di ogni campione dai rect di source e
  target >= 8px.

### 1.1 Due correzioni di metodo, entrambe misurate

**I nodi vanno mossi trascinandoli.** La prima versione della sonda scriveva `x`/`y`
sul `DVertex`. Misurato: con la scrittura diretta i lati degli ancoraggi restano
quelli calcolati per la configurazione precedente — la riselezione passa dai gesti di
drag (`useAutoAnchor`) — e il path misurato non e' quello che l'utente vedrebbe. Con
quel metodo il caso «target a ovest», che e' sano, risultava rosso con la retta che
passava dentro **entrambi** i corpi: un falso positivo prodotto dalla sonda, non dal
prodotto. Sostituito con un trascinamento vero del mouse, quel caso e' verde.

**Il canvas aggancia a una griglia da 16px**, e la presa del mouse deve stare sulla
fascia alta del nodo (il corpo ospita controlli `nodrag`: afferrandolo al centro il
trascinamento non parte affatto) e su un punto che appartiene davvero a quel nodo
(con due box sovrapposti il `mousedown` finisce sul vicino: la sonda lo verifica con
`elementFromPoint` prima di premere). Di conseguenza la validita' di un caso **non**
si giudica sulle coordinate chieste ma sulla **geometria reale**: sovrapposizione dei
box per F1a, `c1` dentro il corridoio per F1b, gap orizzontale negativo per F2.

---

## 2. Risultati

Esito della corsa del 2026-08-25: **R0 5/5 verdi, F1a / F1b / F2 rossi**.

| caso | geometria misurata | esito |
|---|---|---|
| R0-est | a1(96,272) b1(496,272) | nessuna intersezione, clearance 14px |
| R0-ovest | a1(464,272) b1(96,272) | nessuna intersezione, clearance 12,1px |
| R0-sud | a1(384,160) b1(416,416) | nessuna intersezione, clearance 13,1px |
| R0-nord | a1(384,416) b1(624,176) | nessuna intersezione, clearance 12,1px |
| R0-allineato | a1(96,272) b1(560,272) | nessuna intersezione, clearance 12,1px |
| **F1a** | a1(272,288) b1(352,304), box sovrapposti | **30 campioni dentro a1 e 30 dentro b1, fino a 25,6px di profondita'; clearance 0** |
| **F1b** | a1(96,304) b1(624,176), c1(352,304) nel corridoio | **55 campioni dentro c1, fino a 26,5px; clearance dai propri box 12,6px** |
| **F2** | a1(272,304) b1(384,304), gap orizzontale −28px | **9 campioni dentro a1 e 9 dentro b1, fino a 22px; clearance 0** |

Tutti i nodi sono 140x53. Screenshot: `_tmp_routing_F1a.png`, `_tmp_routing_F1b.png`,
`_tmp_routing_F2.png` accanto alla sonda.

---

## 3. A quale ramo appartiene ciascun rosso

I tre rossi **non** stanno tutti nel caso «target non davanti», che il prompt indicava
come perimetro della variante piccola. Ricostruzione dai numeri, path per path.

### F1a — `routeOppositeV`, ramo `targetInFront === false` (`edgeUtils.ts:196-216`)

Path reso: `M 342 345 → 342 375 → 382 375 → 382 270 → 422 270 → 422 300`.
L'ancoraggio sorgente sta sul **fondo** di a1 (342, 345: y appena sotto il bordo
inferiore 341), quello di destinazione sulla **cima** di b1 (422, 300: y appena sopra
304). Lati `bottom → top`, `goingDown = true`, `ty(300) > sy(345)` falso ⇒ U-detour:
`detourY = max(sy,ty)+30 = 375`, `midX = (342+422)/2 = 382`, `entryDetourY = min−30 = 270`.
Numeri identici al reso. Il segmento verticale `x = 382` da y 375 a y 270 attraversa
**entrambi** i corpi, perche' 382 cade dentro la fascia x di a1 (272..412) e di b1
(352..492). La U esiste, ma e' costruita su un padding fisso di 30px che con i box
sovrapposti non aggira nulla.

### F2 — `routeOppositeH`, stesso ramo, **degenere**: la U collassa in una retta

Path reso: `M 416 330.5 L 380 330.5`. Una retta di 36px. Ancoraggi: destra di a1
(416 = 272+140+4) e sinistra di b1 (380 = 384−4), quindi `right → left`,
`goingRight = true`, `tx(380) > sx(416)` falso ⇒ di nuovo il ramo U-detour, che
produce sei punti: (416, 330.5), (446, 330.5), (446, 330.5), (350, 330.5),
(350, 330.5), (380, 330.5). **Tutti alla stessa y**, perche' `sy === ty` e la U e'
espressa solo in X: `cleanPoints` li riconosce collineari, li elimina tutti tranne il
primo e l'ultimo, e resta un segmento che entra da destra in a1, esce a sinistra da
b1 e taglia in mezzo i due corpi.

Questo e' il caso piu' insidioso dei tre: **la U non protegge proprio quando i due
nodi sono alla stessa altezza**, cioe' nella disposizione piu' comune.

### F1b — `routeOppositeH`, ramo `targetInFront === true` (Z-shape)

Path reso: `M 240 330.5 → 426/430 330.5 → 430 206.5 → 620 202.5`, con
`midX = (240+620)/2 = 430`: e' esattamente lo Z a tre segmenti. Il caso e' **sano**
per i due estremi (clearance 12,6px dai propri box) e rosso per il terzo nodo: il
tratto orizzontale a y = 330,5 da x 240 a 430 passa dentro `c1` (352..492 x 304..357).
Nessun ramo del router puo' evitarlo: la funzione non riceve nemmeno i rect dei propri
estremi, tanto meno quelli degli altri nodi.

---

## 4. Perimetro del fix — conferma e correzione

### 4.1 Il call site e' uno solo, e i rect ce li ha gia'

`computeManhattanPath` (`edgeUtils.ts:90-99`, sei scalari: due coppie di coordinate e
due lati) ha **un solo chiamante vivo**: `UnifiedEdge.tsx:200`. Gli altri due sono
`edges/__tests__/bundleSpread.test.ts` (test) e `edges/ManhattanEdge-toDelete.tsx`,
che nessuno importa (verificato con grep sull'intero `frontend/src`).

In quel componente i rect sono **gia' in mano**, senza letture nuove del root state
(R-LAY-19 rispettata):

- estremi: `useInternalNode(source)` / `useInternalNode(target)` piu' `getNodeRect`,
  gia' usati li' per `bundleCenter` (`:233`) e per il self-loop (`:300`);
- tutti i nodi: `getNodes()` da `useReactFlow()` (`:135`), gia' chiamato nella memo
  delle intersezioni fra archi (`:279`) — lettura imperativa dello store della tela,
  locale al tab, senza sottoscrizione nuova.

### 4.2 La variante piccola come formulata copre due rossi su tre

«Rettangoli a `computeManhattanPath` per il caso *target non davanti*» chiude F1a e F2,
che vivono entrambi in quel ramo. **Non** chiude F1b, che sta nel ramo sano e ha
bisogno dei rect di **tutti** i nodi, non dei due estremi. Sono due decisioni distinte,
ed e' Alfonso a scegliere quale entra in Fase B:

- **(i) solo estremi** — firma con i due rect, correzione dei due rami U-detour
  (orizzontale e verticale). Rischio contenuto, F1b resta aperto.
- **(ii) estremi + nodi visibili** — la funzione (o un passaggio dopo di essa) riceve
  anche la lista dei rect. Copre tutti e tre, costa un parametro in piu' e una
  decisione su cosa fare quando il corridoio e' occupato.

### 4.3 Forma consigliata: un passaggio a valle, non tre rami riscritti

I tre rossi stanno in tre rami diversi (U verticale, U orizzontale degenere, Z sana
con ostacolo), e le U falliscono per due motivi diversi (padding fisso da 30px;
collasso per collinearita' quando `sy === ty`). Riscrivere ramo per ramo moltiplica le
occasioni di toccare un caso sano. La forma che mantiene **R0 byte-identico per
costruzione** e' invece: produrre la polilinea come oggi, verificare il criterio F1/F2
sui rect, e ri-instradare **solo se violato**. Il ramo sano non viene neppure
attraversato.

---

## 5. Punti aperti che la Fase B deve decidere

1. **Dove agganciare il passaggio a valle.** Il criterio si misura sul path finale, ma
   `applyBundleSpread` viene dopo il router e sposta il corridoio centrale degli archi
   paralleli: un anti-collisione applicato su `rawPoints` puo' essere annullato dallo
   spread. Va misurato con due archi paralleli fra gli stessi nodi, caso che questa
   fase non ha coperto.
2. **Waypoint utente (R-B10).** Quando ci sono, vincono: l'evitamento non deve
   toccarli. Il caso «R0 con waypoint» **non e' stato misurato** in questa fase — la
   maniglia di segmento si afferra solo su un arco selezionato, gesto non eseguito in
   questa corsa. Va coperto in Fase B, ed e' l'unico buco dichiarato di R0.
3. **Confronto byte-identico di R0.** Il baseline salvato porta, per ogni caso, il
   path e le posizioni dei tre nodi. I trascinamenti agganciano alla griglia ma non
   sono perfettamente riproducibili fra corse: il confronto in Fase B vale **solo se
   le posizioni registrate coincidono**, altrimenti la sonda deve riposizionare finche'
   non coincidono. Un `d` diverso su posizioni diverse non e' una regressione.
4. **Fuori perimetro, ma da non confondere col routing**: la saturazione del pool di
   handle (>4 per lato, `portDistribution.ts`) e la scelta dei lati
   (`useAutoAnchor`). Nessuno dei tre rossi misurati qui dipende da loro: in tutti e
   tre i casi i lati scelti sono quelli giusti per la disposizione, ed e' il tracciato
   fra i due ancoraggi a essere sbagliato.

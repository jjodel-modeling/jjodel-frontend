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

---

# Fase B — implementazione e verifica (2026-08-25)

GO di Alfonso sull'**opzione (ii)**, estremi + nodi visibili, con la **forma a valle**
vincolante: router intatto, criterio sulla polilinea, ri-instradamento solo se violato.

## 6. Cosa e' stato scritto

Due file di sorgente, piu' un test.

**`utils/edgeUtils.ts`** — in coda, un blocco nuovo che non tocca nulla di esistente:

- `pathBlockingRects(points, rects)` — i rettangoli attraversati dalla polilinea,
  esclusa la finestra di stub di 8px alle due estremita'. Lista vuota = criterio
  rispettato. E' lo stesso criterio della sonda, portato dentro il prodotto.
- `avoidNodeRects(points, rects)` — il passaggio a valle. Se non c'e' violazione
  **ritorna lo stesso riferimento** ricevuto; altrimenti tenta **un solo**
  ri-instradamento e, se anche quello viola, torna l'originale.
- `routeAroundRects` (interna) — ri-instradamento ortogonale su una griglia di
  corsie: ascisse e ordinate candidate sono quelle degli stub e dei bordi degli
  ostacoli scostati di una clearance, che e' la griglia minima che contiene un
  ottimo ortogonale attorno a rettangoli assiali. Dijkstra con costo
  `lunghezza + penale di svolta + penale di corsia stretta`. La penale di corsia
  stretta e' la forma generale della politica «si aggira dal lato con piu' spazio
  libero»: vale anche quando gli ostacoli sono piu' di uno, dove il confronto fra due
  soli lati non sarebbe definito.

Costanti: clearance 8px (criterio F2), corsie posate a 9px (il criterio chiede
`>= 8`, non `> 8`), rilevazione a 7,5px (mezzo pixel sotto, cosi' una corsia posata a
distanza di sicurezza non si auto-denuncia al ricontrollo), tetto di 10 ostacoli.

**`edges/UnifiedEdge.tsx`** — una memo nuova, `routedPoints`, fra `spreadPoints` e
`spreadPath`; i tre consumatori della polilinea (registrazione per gli incroci,
rilevazione incroci, path finale) leggono la nuova. I rect vengono da `getNodes()`,
la stessa lettura imperativa gia' usata per gli incroci: nessun lettore nuovo del
root state (R-LAY-19). Il passaggio si applica **dopo lo spread**, che e' dove il
criterio si misura, e non si applica affatto a self-loop, archi IR non ortogonali e
archi con waypoint dell'utente (R-B10).

**`utils/__tests__/nodeAvoidance.test.ts`** — cinque prove sulle geometrie misurate.

## 7. Verifica

Sonda `_tmp_routing.ts`, corsa del 2026-08-25: **12/12 PASS**.

| caso | prima (Fase A) | dopo |
|---|---|---|
| R0 ×5 | nessuna intersezione | nessuna intersezione |
| F1a box sovrapposti | 30 campioni dentro a1, 30 dentro b1 | **nessuna, clearance 9px** |
| F1b terzo nodo | 55 campioni dentro c1 | **nessuna, clearance 12,1px** |
| F2 U su box adiacenti | 9 + 9 campioni, clearance 0 | **nessuna, clearance 9px** |
| F2-degenere | — | criterio insoddisfacibile, si tiene il path del router |
| W1a waypoint | non misurato | il trascinamento della maniglia cambia il tracciato |
| W1b waypoint vs evitamento | non misurato | **path identico con c1 nel corridoio** |
| P1 archi paralleli + ostacolo | non misurato | nessuno dei due archi attraversa un corpo |

Test unitari: 5/5. Il primo e' quello che regge R0 — `avoidNodeRects` ritorna
**lo stesso riferimento** quando non c'e' violazione, quindi ogni memo a valle
produce la stessa stringa e un caso sano e' byte-identico per costruzione.

### 7.1 Perche' R0 non si confronta byte a byte fra due corse

Il confronto proposto in Fase A e' stato eseguito e poi **ritirato**, con la misura:
a parita' di posizioni finali dei nodi, due corse diverse possono scegliere lati
d'ancoraggio diversi (misurato su R0-sud: stesse coordinate, `M 528 186.5 …` in una
corsa e `M 454 217 …` nell'altra). La scelta dipende dai gesti di trascinamento, non
solo dalla geometria finale, quindi il `d` cambia per ragioni che col fix non
c'entrano e un confronto fra corse produrrebbe rossi falsi. La byte-identita' e' stata
spostata dove e' deterministica: l'identita' di riferimento nel test unitario. A
schermo resta il criterio, che su R0 e' verde.

### 7.2 Tre punti aperti della Fase A, chiusi

1. **Waypoint utente**: misurato. Si seleziona l'arco cliccando sul tracciato (il
   punto medio in coordinate di flusso convertito in coordinate schermo: il click al
   centro del bounding box di un path a Z cade fuori dal tratto), si trascina la
   maniglia di segmento, il tracciato cambia; poi si porta il terzo nodo nel
   corridoio e il tracciato **non cambia di un byte**. I waypoint vincono, R-B10
   rispettata.
2. **bundleSpread**: misurato sul canvas **M2**, non M1 — due referenze fra la stessa
   coppia di istanze danno un arco solo (chiave per coppia, CLAUDE.md §3.4), mentre
   sul metamodello la chiave e' composita e le due `DReference` producono due archi
   che lo spread distribuisce davvero. Con un terzo nodo nel corridoio, nessuno dei
   due archi attraversa un corpo: il passaggio a valle applicato **dopo** lo spread
   e' la collocazione giusta, e non serve dichiarare un limite.
3. **Confronto a posizioni coincidenti**: superato dal punto 7.1.

## 8. Limiti dichiarati

1. **Ancoraggio sepolto.** Quando un ancoraggio nasce a meno di 8px dal corpo
   dell'altro nodo — box molto sovrapposti alla stessa altezza — il criterio e'
   insoddisfacibile: qualunque tracciato che parta da li' e' dentro un corpo oltre la
   finestra di stub. Il codice se ne accorge (lo stub del ri-instradamento nascerebbe
   dentro un ostacolo) e tiene il path del router. E' il caso `F2-degenere`, ed e' la
   politica «corridoio saturo ⇒ si degrada» applicata alla lettera.
2. **Trigger di ricalcolo.** L'evitamento si ricalcola sugli stessi trigger della
   rilevazione degli incroci (la propria polilinea e l'array degli archi). Un nodo
   **senza archi** trascinato dentro il corridoio aggiorna il tracciato al primo
   ricalcolo utile, non a ogni frame del trascinamento. Renderlo reattivo vorrebbe
   una sottoscrizione ai nodi, cioe' la `useNodes()` rimossa per il trickle di
   rendering: non si tocca senza una misura sua.
3. **Un solo giro, tetto di 10 ostacoli.** Per prompt e per prudenza: niente cicli di
   tentativi, e sopra i 10 rettangoli in gioco non e' piu' un corridoio.

## 9. Nota di metodo sulla sonda

I trascinamenti fallivano in modo silenzioso quando il punto di presa finiva **sotto
il pannello delle proprieta'** (misurato: presa a x≈1141-1236, fuori dalla tela). La
sonda ora se ne accorge con `elementFromPoint`, lo scrive, e ritenta dopo un
«Fit to view». Senza quel ritentativo tre casi su dodici misuravano una geometria che
non era quella dichiarata — e uno di essi (F1a) risultava rosso per la posizione
sbagliata, non per il codice.

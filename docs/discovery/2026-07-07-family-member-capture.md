# Cattura doppia Family↔Member — S1 (post-fix) + S6 (same-side U-detour)

**Data**: 2026-07-07 00:45
**Tipo**: cattura + specifica (Fase 2 v2, Step A + Step C analisi)
**Relazione con la Fase 2 v1**: il fix S1 è **già committato** su questo branch
(`80b3e2d58 fix: align bundle spread offset with geometric anchor order`; cattura pre-fix in
`docs/discovery/2026-07-06-family-member-capture.md`, **6 incroci**). Su decisione di Alfonso
("build on top") il fix esistente NON viene rifatto: questo documento (a) ne verifica l'esito su un
layout **diagonale** come evidenza post-fix, e (b) produce l'analisi **S6** (same-side) — solo analisi.
**Metodo**: harness headless che guida la pipeline reale (`computePortDistribution` →
`computeSideEndpoints`/`computeSidePositions` → `computeManhattanPath` → l'`applyBundleSpread`
**attuale committato**). Strumentazione temporanea (`_capture2.test.ts`), **rimossa** dopo la
trascrizione.

---

## 1. Layout D (diagonale/frontale) — S1 post-fix

Family `(0,0,180×120)`, Member `(500,220,180×120)`; 8 reference (4 containment + 4 eOpposite,
id `a..h` interlacciati) su lati frontali `right↔left`, path a Z a 4 punti.

| edge | dir | sF | tF | meanY | **trunkX** | pts |
|------|-----|----|----|-------|-----------|-----|
| a | right→left | 0.111 | 0.111 | 123.3 | 368.0 | 4 |
| b | left→right | 0.222 | 0.222 | 136.7 | 360.0 | 4 |
| c | right→left | 0.333 | 0.333 | 150.0 | 352.0 | 4 |
| d | left→right | 0.444 | 0.444 | 163.3 | 344.0 | 4 |
| e | right→left | 0.556 | 0.556 | 176.7 | 336.0 | 4 |
| f | left→right | 0.667 | 0.667 | 190.0 | 328.0 | 4 |
| g | right→left | 0.778 | 0.778 | 203.3 | 320.0 | 4 |
| h | left→right | 0.889 | 0.889 | 216.7 | 312.0 | 4 |

**Incroci = 0.** `trunkX` strettamente monotòno (368→312) nell'ordine fisico (`meanY` crescente),
frazioni allineate sui due lati (`sF==tF`, `byPairStable`). **S1 confermato risolto** dal fix
committato (baseline pre-fix: 6 incroci con `trunkX` non monotòno). Coincide con la regression suite
`edges/__tests__/bundleSpread.test.ts` (opposite-H/opposite-V → 0 incroci).

**Criterio d'accettazione Step B** — SODDISFATTO (già committato): "zero incroci nel bundle frontale a
Z" ✔ + "offset monotòni nella frazione fisica" ✔. Nessun nuovo codice S1 in questo task.

---

## 2. Layout H (stessa quota) — S6

Family `(0,0,180×120)`, Member `(1400,0,180×120)`, stessa quota. Assegnazione lati **come osservata**
(screenshot 2026-07-06): 3 frontali + 2 top/top + 3 bottom/bottom (non riprodotta la logica di
`useAutoAnchor`).

### 2.1 Per-edge

| edge | lati | sF | tF | pts | rawDepth (routeSameSide) | spreadDepth (post applyBundleSpread) |
|------|------|----|----|-----|--------------------------|--------------------------------------|
| f1 | right→left | 0.250 | 0.250 | 2 | — (retta, snap) | — |
| f2 | left→right | 0.500 | 0.500 | 2 | — | — |
| f3 | right→left | 0.750 | 0.750 | 2 | — | — |
| t1 | top→top | 0.333 | 0.333 | 4 | **-30.0** | -12.0 |
| t2 | top→top | 0.667 | 0.667 | 4 | **-30.0** | -12.0 |
| b1 | bottom→bottom | 0.250 | 0.250 | 4 | **150.0** | 177.0 |
| b2 | bottom→bottom | 0.500 | 0.500 | 4 | **150.0** | 150.0 |
| b3 | bottom→bottom | 0.750 | 0.750 | 4 | **150.0** | 123.0 |

### 2.2 Intervalli orizzontali same-side (X dei due anchor) e incroci

| bundle | intervalli `[minX, maxX]` | verdetto | incroci misurati | C(k,2) |
|--------|---------------------------|----------|------------------|--------|
| frontale (f1,f2,f3) | rette a quote distinte | parallele | **0** | — |
| top (t1,t2) | `[60,1460] [120,1520]` | interlacciati | **0** (vedi §2.3) | 1 |
| bottom (b1,b2,b3) | `[45,1445] [90,1490] [135,1535]` | **tutti e 3 interlacciati** | **3** `b1×b2, b1×b3, b2×b3` | **3** |

Gli intervalli bottom riproducono il pattern dello screenshot (`[90,1440] [148,1500] [205,1560]`).

### 2.3 Nota sul bundle top (0 misurati vs C(2,2)=1)

t1/t2 hanno intervalli interlacciati ma `applyBundleSpread` (attuale) ha assegnato loro la **stessa
profondità** (-12, artefatto della simmetria della fixture: shear opposto compensa esattamente
l'offset di `meanX`). A profondità identica i due tratti orizzontali sono **collineari sovrapposti**:
non un incrocio a X pulito (il contatore conta solo intersezioni interne H×V), ma comunque un difetto
visivo. Con profondità distinte (caso bottom) l'incrocio è netto. La legge C(k,2) vale quindi per
profondità distinte; il caso top è degenere per la fixture.

---

## 3. Risposte alle 4 domande S6 (Step C — solo analisi)

**Q1 — Cosa scagliona le profondità delle U same-side?**
NON `routeSameSide`: per `bottom` la profondità è `detourY = Math.max(sy, ty) + DETOUR_PADDING`
(`edgeUtils.ts:242-244`, `DETOUR_PADDING=30` a `:16`); con nodi alla stessa quota tutti gli anchor
bottom condividono la stessa `sy=ty` → **rawDepth costante** (150 per tutti; -30 per tutti i top).
Lo scaglionamento viene interamente da **`applyBundleSpread`** (`edges/bundleSpread.ts:76-86`, ramo
`isMiddleHorizontal`): spreadDepth 177/150/123. *(Nello screenshot pre-fix 2026-07-06 — 352/380/460 —
lo scaglionamento veniva dal vecchio offset per indice `directionSign*(idx+idx+1)*6`; il modulo
responsabile è comunque `applyBundleSpread`, non `routeSameSide`.)*

**Q2 — L'accoppiamento dei rank sui due lati è monotòno (leftmost↔leftmost)?**
**Sì, monotòno → intervalli INTERLACCIATI.** `byGeometry` pareggia (unico nodo opposto) → subentra
`byPairStable(edgeId)` → **stesso rank sui due lati** (`handlePosition.ts:223-235`). Sul bottom la X
dell'anchor Family cresce col rank (45→90→135) E quella Member cresce nello stesso ordine
(1445→1490→1535): leftmost-Family accoppiato con leftmost-Member. Per **0 incroci** servirebbero
intervalli **annidati** (leftmost-Family ↔ rightmost-Member: `b1[45,1535]`, `b3[135,1445]`) →
richiede rank **invertito su un lato** per i bundle same-side.

**Q3 — Gli incroci coincidono con C(k,2) degli intervalli parzialmente sovrapposti?**
**Sì per il bottom**: 3 edge, 3 coppie tutte interlacciate → C(3,2)=3 = 3 misurati (`b1×b2,b1×b3,b2×b3`).
Top: 2 interlacciati → C(2,2)=1 atteso, 0 misurati per il caso degenere §2.3 (profondità uguali →
sovrapposizione collineare invece di incrocio pulito). La legge regge per profondità distinte.

**Q4 — Si può invertire il pairing same-side senza toccare `handlePosition.ts`?**
Punto chiave: l'incrocio è causato dall'**interlacciamento delle X degli anchor** (le frazioni), non
dalla profondità. `applyBundleSpread`/`UnifiedEdge` possono muovere **solo la profondità del detour**,
non la X degli anchor (fissata a monte da `computeSidePositions`) → **un fix puro dentro
`UnifiedEdge`/`bundleSpread` è impossibile** per S6. Il pairing va cambiato a monte. Opzioni:
- **A — `byPairStable` topology-aware**: rilevare la coppia di lati same-side e invertire il rank sul
  lato target. Tocca `handlePosition.ts` (critical-zone, fuori scope qui) — **invasività alta**;
  impatta il posizionatore condiviso (`DynamicHandles` + `useTreeLayout`), servono test dedicati.
- **B — `laneRank` additivo via `edge.data`**: calcolare in `applyDistribution` (`EditorV2.tsx`, dove
  già vivono `cardShift`/`roleShift`) un rank same-side col pairing invertito, consumato nel ramo
  same-side dello spread. Nessun tocco a `handlePosition.ts`; **invasività media** (`EditorV2` +
  consumer). *(NB: `EditorV2.tsx` non è nella lista toccabili di questo task.)*
- Nota: oltre al pairing servono **profondità monotòne col livello di annidamento** (contenitore = U
  più profonda) — anch'esse governabili in B via il `laneRank`.

**Verdetto Q4**: il fix S6 richiede **necessariamente** un cambio del pairing a monte (A o B); non è
ottenibile con la sola profondità. Raccomandata **B** (media invasività, fuori dalla critical-zone)
rispetto ad A (alta, critical-zone) — da decidere in chat con prompt separato.

---

## 4. Scope / HARD STOP

- **S1**: già risolto e committato; qui solo evidenza post-fix (layout D = 0 incroci).
- **S6**: **solo analisi** (questo Step C). Nessuna implementazione in questo task. Il fix (Opzione B
  raccomandata) è un prompt separato.
- Fuori scope confermato: S2 (label de-overlap), S3/Phase B lane router, S4 side escape al load, leva
  (c) merge eOpposite.
- Strumentazione di cattura rimossa prima del commit. Nessuna modifica a file sorgente in questo task
  (il fix S1 era già committato).

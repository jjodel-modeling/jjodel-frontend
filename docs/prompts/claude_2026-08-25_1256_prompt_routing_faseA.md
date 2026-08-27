# Prompt — routing archi, riapertura con specifica (Fase A)

> Branch: `alfonso-frontend-jjtl`. Area: editor-v2, routing degli archi.
> Riapre il punto 1 rinviato nella partizione della Fase 1 canvas.

---

## Specifica ricevuta (Alfonso, 2026-08-25)

Perimetro: la **variante piccola** gia' individuata, cioe' dare a
`computeManhattanPath` i rettangoli dei nodi. I floating edges restano esclusi. La
saturazione del pool di handle (>4 per lato, `portDistribution.ts`) e' un fronte
diverso e non entra.

Due modi di fallire, su fixture sintetica (M2 `Alpha --betas--> Beta`, M1 con istanze
posizionate ad hoc, route ortogonale):

**F1 — attraversamento del corpo.** *Osservato*: con i box di source/target
sovrapposti o parzialmente sovrapposti il path Manhattan attraversa il corpo di uno
dei due nodi (o di un terzo frapposto): `computeManhattanPath` riceve solo i quattro
scalari degli endpoint e i due lati (`edgeUtils.ts:92-99`), nessun rettangolo.
*Atteso*: nessun segmento del path finale attraversa l'interno di un rettangolo nodo.
*Criterio meccanico*: per ogni arco, test segmento-rettangolo sul path **finale**
(dopo waypoint, bundleSpread, archi-ponte) contro i rect di TUTTI i nodi visibili
gonfiati di 4px, ammessi solo i primi/ultimi 8px di stub. Zero intersezioni = PASS.

**F2 — U-detour su box adiacenti.** *Osservato*: caso `targetInFront === false`
(`routeOppositeH`, `edgeUtils.ts:150`) con box vicini: la U/Z e' calcolata su distanze
che non esistono piu' e i segmenti di ritorno passano sopra i corpi o a distanza
< 4px. *Atteso*: la U/Z aggira i due box con clearance minima. *Criterio*: come F1,
piu' distanza perpendicolare minima di ogni segmento dai rect di source/target >= 8px
fuori dagli stub.

**R0 — non regressione sui casi sani (il criterio piu' importante).** Per una griglia
di casi standard (target davanti, box distanti, i quattro orientamenti, con e senza
waypoint utente) il path DEVE restare **identico**: snapshot dei `d` prima/dopo,
confronto stringa. L'evitamento si attiva solo quando F1/F2 sarebbero violati.

### Fase A — riprodurre e misurare, senza fix

1. Sonda `_tmp_routing.ts` con fixture sintetica e posizioni che riproducono F1
   (sovrapposizione parziale, terzo nodo frapposto) e F2 (box adiacenti, target
   dietro). Screenshot per ciascun caso.
2. Eseguire i criteri: attesi ROSSI su F1/F2, VERDI su R0, che fissa il baseline.
3. Riportare i numeri e confermare o correggere il perimetro del fix: quali rami di
   `computeManhattanPath` vanno toccati, quali call site passano i rect, e se i rect
   sono disponibili li' senza lettori nuovi del root state.

**Fermarsi dopo la Fase A** con il report; il GO per la Fase B arriva dopo.

### Vincoli

- Nessun cambio a: scelta dei lati (`useAutoAnchor`), deconfliction,
  `portDistribution`, `handlePosition`, persistenza waypoint (R-B10: i waypoint utente
  vincono sull'evitamento).
- Variante IR non ortogonale (R-B9/R-B12): fuori perimetro.
- R-LAY-19: i rect arrivano dai nodi React Flow gia' in mano al chiamante.
- Metamodel-independence, zero literal, sonda gitignored, fixture in pagina.
- Gate soliti; `check:docs` altrui fuori scope; commit per pathspec, `StatusBar.*` e
  `featureSignature.ts` fuori.

---

## Esito

Misura e conclusioni in `docs/discovery/discovery_2026-08-25_routing_faseA.md`.
In sintesi: R0 5/5 verdi, F1a / F1b / F2 rossi con i numeri; i tre rossi stanno in
**tre rami diversi**, quindi la variante piccola come formulata (solo il caso «target
non davanti») ne chiude due su tre e lascia fuori il terzo nodo frapposto. Il call
site vivo e' uno solo e ha gia' i rect senza letture nuove del root state. Nessuna
riga di sorgente toccata in questa fase.

# Spec — Posizionamento label e cardinalità degli edge (analisi per casi)

> Stato: **specifica di design approvata**, base per riscrivere i prompt di
> implementazione (ex Fase 2b/2c). Data: 2026-05-31. Branch: `alfonso-frontend-jjtl`.
> Area: rendering edge v2-flow. **Non** critical-zone.
>
> Discovery di riferimento (Fase 1, read-only): `docs/discovery/2026-05-31_edge_label_anchoring.md`.
> Prompt derivati: `docs/2026-05-31_phase2b_edge_label_per_edge.md` (2b'),
> `docs/2026-05-31_phase2c_edge_label_deoverlap.md` (2c).

## Decisione di fondo

Ruolo e cardinalità **non** si raggruppano. Vivono in due zone distinte:

- **Ruolo** (la parte larga, es. `newAssociation`) → al **midpoint per lunghezza
  d'arco** dell'edge, dove i percorsi si aprono a ventaglio e c'è spazio.
- **Cardinalità** (minuscola, es. `0..*`, `1`) → all'**estremità target**, appena
  fuori dal box, posizione canonica UML.

### Perché questo split (e non il gruppo unito)
Con box piccoli e più edge convergenti su uno stesso lato, all'estremità non c'è
spazio per le label larghe: 4 `newAssociation` non ci stanno sotto a un box piccolo,
4 `0..*` sì. Mandando il ruolo (largo) al midpoint e lasciando solo la cardinalità
(minuscola) all'estremità si risolvono entrambi i problemi, e sparisce il garble
ruolo↔cardinalità (es. `0..*uthors`) perché i due tipi di annotazione non condividono
più la stessa zona. È in pratica una **riparazione del design originale** dello
strumento (ruolo a metà, cardinalità all'estremità): i difetti veri erano il midpoint
instabile (segmento più lungo) e l'assenza di de-overlap.

## Cosa si etichetta, per tipo di edge

| Tipo edge | Ruolo | Cardinalità | Note |
|---|---|---|---|
| reference | midpoint | estremità target | caso base |
| composition / aggregation | midpoint | estremità target | il diamante è un marker SVG al source, indipendente |
| generalization | nessuno | nessuna | solo "ISA" in ER, al midpoint |
| M1 (reference / instanceRef) | midpoint, hover-visible | soppressa | come oggi |
| self-loop | ancoraggio dedicato sull'angolo del loop | idem | fuori dalle regole sotto |

## Regola — Ruolo

- **Ancoraggio**: midpoint per lunghezza d'arco del path (stabile, definito per
  qualsiasi polilinea). Sostituisce il "midpoint del segmento più lungo".
- **De-overlap**: tra ruoli che si toccano, scorrimento **lungo il proprio edge**
  (uno verso source, l'altro verso target). Riguarda soprattutto edge paralleli tra
  la stessa coppia (bundle); edge tra coppie diverse hanno midpoint già separati.
- **Offset dalla linea**: piccolo offset perpendicolare al segmento su cui cade il
  midpoint, così il testo non sta sopra la linea.

## Regola — Cardinalità

- **Ancoraggio**: estremità target. Posizionata **appena fuori dal box** all'altezza
  dell'handle di ingresso, con ancoraggio per spigolo (per i 4 lati) così resta fuori
  dal rettangolo qualunque sia il testo. È in larga parte ciò che
  `computeCardinalityPosition` già fa; va garantita la clearance dal box.
- **De-overlap**: minimo, **per `(nodo target, lato)`**. Le cardinalità sono minuscole;
  quando due sullo stesso lato si toccherebbero (box molto piccolo, molti edge), si
  scalano leggermente in profondità (stagger). Non serve nulla di sofisticato.
- **Lati**: top/bottom → la cardinalità sta appena sopra/sotto il bordo, all'x
  dell'handle; left/right → appena a sinistra/destra, all'y dell'handle.

## Classi di collisione e regola che le copre

| Collisione | Coperta da |
|---|---|
| ruolo ↔ box | midpoint (il ruolo è lontano dal box) |
| ruolo ↔ linea edge | offset perpendicolare del ruolo |
| ruolo ↔ ruolo | de-overlap lungo l'edge (bundle) |
| cardinalità ↔ box | ancoraggio per spigolo della cardinalità |
| cardinalità ↔ cardinalità | de-overlap per `(target, lato)` |
| ruolo ↔ cardinalità | **eliminata by design** (zone separate) |

## Casi residui (decisi)

1. **Edge cortissimo tra box piccoli, molti edge.** Il midpoint cade in uno spazio
   minuscolo. Accettato con TODO: il ruolo galleggia accanto all'edge invece di
   garblarsi. Raro, non risolvibile localmente.
2. **Contesa d'angolo** (cardinalità verso lo spigolo che incontra quella del lato
   perpendicolare). Accettato con TODO; eventuale clamp futuro.
3. **Label sopra un nodo terzo non collegato.** Dipende dal layout globale. Fuori
   scope.
4. **Leva strutturale (futura, critical-zone).** Spingere il routing a far entrare i
   reference da left/right invece che top/bottom riduce la pressione. Tocca
   `portDistribution.ts`: non in questo giro.

## Mappatura sul codice (riferimenti dalla discovery)

- **Ruolo**: `computeLabelPosition` (`edgeUtils.ts:792-814`) cambia da "midpoint del
  segmento più lungo" a "midpoint per lunghezza d'arco". Il render resta il `<div
  className="edge-label">` (`UnifiedEdge.tsx:667-692`); **non** si fonde con la
  cardinalità.
- **Cardinalità**: `computeCardinalityPosition` (`edgeUtils.ts:824-844`) resta
  all'estremità; garantire clearance dal box (ancoraggio per spigolo per lato). Render
  `<div className="edge-cardinality">` (`UnifiedEdge.tsx:695-706`) invariato come
  struttura.
- **De-overlap**: pass per-`(target, lato)` per le cardinalità in `applyDistribution`
  (`EditorV2.tsx:826-847`, non critical-zone), che scrive un `data.labelShift`; lo
  stacking dei ruoli per bundle riusa l'indice handle già presente
  (`LABEL_SPREAD_PX`). Niente tocco a `portDistribution.ts` / `useJjomSync.ts`.
- **Self-loop / ISA**: invariati.

## Cosa questo supera

- Il gruppo unito ruolo+cardinalità (R1 dei prompt precedenti): abbandonato.
- L'ancoraggio dell'intero gruppo all'estremità (Fase 2 / 2b): abbandonato.

## Validazione (verifica visiva, notazione UML)

- **Modello library**: ogni cardinalità all'estremità del proprio target; ogni ruolo
  a metà edge; nessuna sovrapposizione ruolo↔cardinalità.
- **Stress model** (A con 4 edge entranti da B/C/D/NewClass su lato piccolo): le 4
  cardinalità leggibili e raggruppate sotto ad A; i 4 ruoli `newAssociation` spostati
  ai midpoint e separati; niente garble.
- Generalization senza ruolo/cardinalità; composition con diamante intatto; self-loop
  identico; editing inline del ruolo funzionante.

## Prossimo passo
Da questo spec derivano due prompt Claude Code:
- **2b'** (per-edge): ruolo → midpoint arc-length + offset linea; cardinalità →
  clearance per spigolo all'estremità. Nessun de-overlap cross-edge.
- **2c** (assembly): de-overlap cardinalità per `(target, lato)` in `applyDistribution`
  + scorrimento ruoli per bundle.

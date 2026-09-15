# Discovery P5: verifica dei preset di notazione sulle specifiche

**Data**: 2026-08-15
**Autore**: sessione Cowork (chat di progetto)
**Obiettivo**: chiudere P5 (sessione 2026-08-14 §5) per il sottoinsieme di preset
esprimibile con i primitivi correnti (5 contorni, bordo `solid|dashed|dotted|double`
+ `width`, 16 marker, `fill`), prima di congelarlo nella tabella dati del picker
(`notationCatalog.ts`). L'inventario dei 90 simboli resta il quadro; qui si
verifica SOLO cio' che entra nel catalogo v1.

## Fonti consultate

- BPMN 2.0: reference Camunda (camunda.com/bpmn/reference), guida drawio
  (drawio.com/blog/bpmn-2-0), Flowable BPMN constructs. Concordi sui punti sotto.
- UML 2.5.1 (state machine notation), Chen ER (convenzioni consolidate nei testi),
  ISO 5807 (flowchart), reti di Petri (notazione classica): decomposizioni
  standard non controverse, verificate incrociando le fonti sopra dove toccano
  gli stessi simboli.

## Decomposizioni verificate (entrano nel catalogo v1)

| Preset | Contorno | Bordo | Marker | Fill | Nota |
|---|---|---|---|---|---|
| BPMN start event | circle | solid 1 | — | — | cerchio sottile singolo |
| BPMN intermediate event | circle | double 3 | — | — | doppio cerchio sottile |
| BPMN end event | circle | solid 3 | — | — | cerchio spesso singolo |
| BPMN message event | circle | solid 1 | envelope | — | variante catch (v. limiti) |
| BPMN timer event | circle | solid 1 | clock | — | |
| BPMN signal event | circle | solid 1 | triangle | — | catch = triangolo vuoto |
| BPMN error event | circle | solid 1 | lightning | — | catch = saetta vuota |
| BPMN exclusive gateway | diamond | solid 1 | x | — | |
| BPMN parallel gateway | diamond | solid 1 | plus | — | |
| BPMN inclusive gateway | diamond | solid 1 | circle | — | cerchio grasso nel rombo |
| BPMN complex gateway | diamond | solid 1 | asterisk | — | |
| BPMN task | rounded | solid 1 | — | — | |
| BPMN service task | rounded | solid 1 | gear | — | |
| BPMN user task | rounded | solid 1 | person | — | |
| BPMN script task | rounded | solid 1 | document | — | |
| BPMN loop / multi-instance | rounded | solid 1 | loop / bars | — | marker di attivita' |
| UML state | rounded | solid 1 | — | — | |
| UML initial pseudostate | circle | solid 1 | — | #334155 | cerchio pieno |
| UML final state | circle | solid 1 | dot | — | bullseye |
| UML shallow history | circle | solid 1 | history | — | H |
| UML deep history | circle | solid 1 | history-deep | — | H* |
| UML choice | diamond | solid 1 | — | — | |
| UML use case | ellipse | solid 1 | — | — | |
| Flowchart process (ISO 5807) | rect | solid 1 | — | — | |
| Flowchart decision (ISO 5807) | diamond | solid 1 | — | — | |
| Petri place | circle | solid 1 | — | — | |
| Petri marked place | circle | solid 1 | dot | — | token |
| Petri transition | rect | solid 1 | — | #334155 | barra piena |
| ER entity | rect | solid 1 | — | — | |
| ER weak entity | rect | double 3 | — | — | doppio rettangolo |
| ER relationship | diamond | solid 1 | — | — | |
| ER identifying relationship | diamond | double 3 | — | — | doppio rombo |
| ER attribute | ellipse | solid 1 | — | — | |
| ER derived attribute | ellipse | dashed 1 | — | — | ellisse tratteggiata |
| ER multivalued attribute | ellipse | double 3 | — | — | doppia ellisse |

I preset `double` portano `width: 3` nei DATI, non nel motore: sotto i 3px il
double CSS non mostra due linee (vincolo nativo gia' documentato nel pannello).

## Esclusi dal v1, con la ragione

- **Contorni assenti**: terminatore (stadio), dato/IO (parallelogramma),
  preparazione (esagono), archivio dati (cilindro), package (folder), nota
  (angolo piegato). Arrivano con `pathTemplate` / poligoni; i preset relativi si
  aggiungono come righe di tabella, zero codice.
- **BPMN event-based gateway**: pentagono dentro doppio cerchio nel rombo, non
  esprimibile con i marker attuali.
- **ISO 5807 predefined process**: rettangolo con SOLE barre verticali doppiate;
  il `double` raddoppia tutti e quattro i lati, quindi mapparlo sarebbe
  sbagliato. Escluso per onesta', arriva con gli ornamenti (Fase 4).
- **ER key attribute**: nome sottolineato, e' tipografia della label, non un
  asse forma.
- **BPMN manual task (mano)**: nessun glifo `hand` in tabella v1.

## Limite dichiarato: throw contro catch

Nella specifica BPMN i marker degli eventi **throwing sono pieni** e i
**catching vuoti** (message start = busta vuota, message end = busta piena). I
16 glifi v1 sono stroke-only salvo `dot`, quindi i preset evento coprono la
variante **catch**; le varianti throw richiedono la versione campita dei glifi
(un flag `fill` per marker gia' previsto dal formato `MarkerPath`). Registrato
come estensione naturale della tabella, non come difetto del motore.

## Esito

P5 chiusa per il perimetro v1: 36 preset verificati, 5 notazioni. La tabella
`notationCatalog.ts` implementa esattamente questa lista; ogni riga fuori
perimetro e' esclusa, non approssimata.

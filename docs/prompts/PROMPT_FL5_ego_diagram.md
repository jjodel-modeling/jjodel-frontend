# PROMPT 2 — FL5: ego-diagramma del neighborhood nella riga espandibile (PARALLELO a FL4)

> Depositato a valle dell'esecuzione (RC-9). Testo ricevuto in chat il 2026-08-31,
> verbatim.

La riga espansa della tabella del manager mostra «Neighborhood · 1 hop»: un mini-diagramma fisso incoming → oggetto → outgoing. Referenza visiva: Manager Admin Form Bottom.dc.html (progetto di design, illustrativa; le regole qui sotto sono normative). Non duplica il canvas: layout fisso, zero pan/zoom/drag, unica interazione il click sul nodo.

Cosa c'è

Modulo puro egoNeighborhood.ts (stesso vincolo di shape.ts/layout.ts: zero import da store/D-graph/React, importabile sotto vitest): da istanza + shape produce { incoming: NodeRef[], subject, outgoing: NodeRef[], counts: { incoming, outgoing, referencedBy } }. 1 hop esatto; referencedBy è un conteggio, non nodi.
Componente di resa: tre colonne (incoming allineati a destra, soggetto al centro, outgoing allineati a sinistra), frecce SVG statiche con punta piena, curve a ventaglio quando i nodi per lato sono >1.
Cap per lato: max 4 nodi, oltre → nodo sintetico «+n more» che porta al canvas (stesso link di «open in canvas»).
Nodi vicini: card bianca, bordo #e2e8f0, radius 8, nome 12/500 + tipo 10.5 slate-400, hover = shadow che sale (token DS). Soggetto: bg #ecfeff, bordo #a5f3fc, ring rgba(6,182,212,0.12), «Nome : Classe» 13/600 sottolineato + «this object» in #0e7490 — la selezione è cyan perché è vocabolario del canvas, non del chrome.
Click su un nodo vicino = selezione di quell'istanza nella tabella (stessa azione della riga: espande e carica la form). Nessun'altra interazione.
Footer: «N incoming · M outgoing · referenced by K show all» — «show all» apre il canvas filtrato, non espande il diagramma.
Header riga: eyebrow «NEIGHBORHOOD · 1 HOP» + a destra «click a node to select it · open in canvas».
Vuoti: zero incoming → colonna assente e freccia assente (non colonna vuota); oggetto isolato → solo il soggetto + footer «0 incoming · 0 outgoing».

Test attesi

Modulo puro: fixture StateMachine (Running: 1 incoming start, 2 outgoing Transition_0/stop, referencedBy 3) produce esattamente quei set; cap a 4 con 6 outgoing → 4 + more: 2; isolato → set vuoti.
Il componente non importa nulla dal canvas (asserzione di import, come per il registro FL3).
Click sul vicino invoca la selezione con l'id giusto; «+n more» e «show all» invocano l'apertura canvas, non la selezione.

Fuori scope: edge label / condizioni sulle frecce, 2+ hop, layout force-directed, qualunque editing dal diagramma. Outline 10b, canvas 1b.

Coordinamento: parallelo a FL4. File contesi da NON toccare: jjform/index.ts, il renderer IRForm, irFormStyle.scss. Stile in foglio proprio (pattern FL3). Se il punto di innesto nella riga espandibile appartiene a un file che FL4 sta toccando, fermati e dichiaralo nel referto invece di committare. Committa con pathspec, log con la sola tua entry, protocollo del 2026-08-30; l'export nel barrel (se serve) nello stesso passo in cui crei il modulo — lezione FL2/FL3.

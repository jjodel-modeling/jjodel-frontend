# Ratifiche — Stato UI dei pannelli e forma della barra a tab

**Data**: 2026-08-05
**Input**: `docs/discovery/discovery_2026-08-05_panel_state_lifting.md` (`f83252d06`) più l'addendum §10-§14 (`a80d282a5`).
**Rapporto con le ratifiche del 2026-08-04**: emenda l'invariante 3 ("smontare un tab non resetta nulla"). Il fine resta, il mezzo cambia.

## R-A — Strada B: la barra monta tutti i pannelli e nasconde gli inattivi

**Deciso**: la barra rende tutti i tab e nasconde quelli non attivi. Nessun sollevamento di stato, nessuna riga toccata nei rami E-ref (`9bd8cad9a`) ed E-obj (`d1dc55649`).

**Perché il mezzo cambia**. L'invariante del 2026-08-04 diceva "lo stato UI locale va sollevato nel pannello", cioè la forma A+C. Era scritta assumendo che la barra smontasse, perché è il pattern di casa e allora non sapevamo altro. Il fine di quella riga non era il sollevamento: era **che nessun lavoro dell'autore si perda cambiando tab**. La strada B lo ottiene a costo zero sul codice verificato, quindi il fine è servito meglio dal mezzo nuovo. Non è un ripensamento, è la stessa invariante con un'implementazione migliore.

**Perché non A adesso**, pur essendo A architetturalmente più pulita: costa 5 file, cioè la soglia della regola 19, e tocca esattamente `applyEndpoints` e `changeNature`, che **in questo momento sono modificati da WIP non committato di un'altra sessione**. Sollevare `sourceExpr`/`targetExpr` fuori da quel componente mentre qualcun altro ne riscrive la semantica è il modo più efficiente di produrre un conflitto che nessuna delle due sessioni è in grado di revisionare. A resta disponibile, adottabile per sotto-editor e in un momento in cui quel file è fermo.

**Il costo in DOM non è un costo**: i circa 645 elementi del caso peggiore sono quanto si monta **già oggi**, perché il tab IR attuale è il pannello intero. La strada B non aggiunge niente che non sia in DOM adesso.

**Vincoli di implementazione**, tutti da citare nel prompt:

1. **`display: none` per i tab inattivi, mai `visibility: hidden` né `opacity: 0`.** Le altre due lasciano i controlli nell'ordine di tabulazione e producono una trappola da tastiera: l'autore tabula dentro un tab che non vede.
2. **La key di remount resta a livello di pannello.** Al cambio di view lo stato locale si azzera, ed è corretto: è il cambio di view a essere un evento di reset, non il cambio di tab. La strada B non deve coprire quel caso e non è un suo limite.
3. **Verifica visiva mirata sul popover di `TextStyleField`**: il listener `mousedown` in cattura tratta il click su un header di tab come "fuori" e si auto-chiude. È il comportamento voluto, ma va visto una volta.
4. **Regola anti-drift, da mettere in `CLAUDE.md`**: nei sotto-editor dell'authoring non si introducono `autoFocus`, `focus()` o `scrollIntoView`. Oggi sono zero occorrenze in tutto l'albero authoring e in `components/ui/`, ed è la premessa che rende B sicura. Il giorno che qualcuno ne aggiunge uno, B si rompe in silenzio su un tab nascosto.

**Precedente nuovo, accettato**: nessuno dei tre host a tab del codebase usa questo pattern. È un costo reale ma minore, e va dichiarato nel commit invece che nascosto.

## R-B — Niente badge di errore per-tab nella v1

La discovery ha trovato che manca il precedente **e** manca il canale: `.view-editor-tab` (`nestedView.scss:3606-3628`) non ha slot per decorazioni, l'unico pattern d'errore del design system è di campo (`ui/Input/Input.tsx:94-136`), e soprattutto `validateIR` ritorna **una stringa senza coordinate di campo**. Non c'è modo di sapere quale tab è responsabile.

**Deciso**: la v1 non ha badge per-tab. Al loro posto:

1. **Una striscia di errore a livello di pannello, sempre visibile qualunque sia il tab attivo.** Zero canale nuovo: è dove gli `ErrorText` già vivono oggi.
2. **I tre messaggi cross-tab noti nominano il tab nel testo.** "Imposta una metaclasse nel tab Applies to" costa una stringa e risolve i tre casi reali senza costruire un meccanismo generico su coordinate che non esistono.

**Follow-up separato**: dare coordinate di campo al risultato di `validateIR`, e solo dopo valutare i badge. Costruire un badge senza coordinate significherebbe indovinare il colpevole, che è peggio del non averlo.

## R-C — La micro-slice 2.1 si allarga e cambia ruolo

`edgeAuthoring.test.ts` non importa componenti ma **rispecchia per copia tre pezzi di logica del pannello**: `isUsableEndpointExpr` (`:130`), `nextEdgeForEndpoints` (`:195`), `dropEndpoints` (`:209`). Cambiare le firme dei sotto-editor non rompe niente; cambiare la logica di `applyEndpoints` o `changeNature` rompe i mirror. Che è esattamente quello che sta succedendo nel working tree adesso.

**Deciso**: 2.1 non è più solo l'estrazione di `isUsableEndpointExpr`. Estrae **tutti e tre** in un modulo puro importabile, e **sale di priorità**: non è più solo prerequisito di F3, è prerequisito del WIP in corso su `EdgeAuthoringPanel`. Finché i mirror restano copie, ogni modifica alla semantica dei capi ha due punti di verità e i test raccontano il vecchio.

## R-D — Il WIP su `applyEndpoints` emenda R-1 di E-obj e va ratificato prima di essere committato

Il working tree contiene una modifica non committata che implementa la raccomandazione §2.4 del report: `applyEndpoints` non droppa più entrambe le chiavi, lascia l'IR intatto e mostra un avviso di divergenza.

Questo **cambia una decisione ratificata**. R-1 di E-obj (2026-08-02) diceva che i due capi entrano insieme o non entrano, e che un IR con un capo solo non è producibile dalla UI, perché il discriminante di natura è strutturale (`isObjectAsEdge = !!(source && target)`) e un capo solo produrrebbe una reference-as-edge viva con un PathExpr inerte. La modifica non tocca quella proprietà (l'IR resta senza capi finché non sono due), ma introduce uno **stato di divergenza dichiarata** fra UI e IR che prima non esisteva.

**Deciso**: la modifica non si committa finché la divergenza dichiarata non è ratificata come emendamento esplicito di R-1, con la sua semantica scritta: quando l'avviso compare, quando sparisce, cosa succede al cambio di view, e cosa vede l'autore che riapre il pannello.

**Effetto collaterale positivo, già registrato in §14 del report**: con la divergenza dichiarata, lo stato di categoria (c) diventa uno stato **visibile**, quindi portarlo attraverso i tab è meno pericoloso di quanto il report assumesse. Rafforza R-A, non la indebolisce.

## R-E — Due convenzioni di processo

**E-1. Ogni prompt di discovery dichiara il comportamento in caso di report preesistente.** Formula da includere: "se al path indicato esiste già un report, non riscriverlo: leggilo per intero, confronta OQ per OQ, e aggiungi in coda un addendum con le sole cose non coperte". Claude Code lo ha fatto spontaneamente e correttamente su un report di 672 righe che esisteva da undici minuti; va reso regola invece che lasciato al giudizio.

**E-2. Prima di scrivere un prompt di discovery, la chat chiede lo stato di `docs/discovery/`.** La chat non vede il working tree né i commit non pushati, e questa volta ha scritto un prompt per un lavoro già fatto. Costa una riga di domanda e previene una duplicazione intera.

## Effetto sul backlog

- **1.2 chiuso.** Report più addendum, decisioni R-A e R-B prese.
- **1.5** procede sulla strada B, con i quattro vincoli di R-A.
- **2.1** sale di priorità e si allarga (R-C).
- **Nuovo item**: ratifica dell'emendamento a R-1 di E-obj prima del commit del WIP (R-D).
- **Nuovo item, basso**: coordinate di campo in `validateIR`, prerequisito dei badge per-tab (R-B).
- **`CLAUDE.md`**: aggiungere la regola anti-drift su `autoFocus`/`focus()`/`scrollIntoView` nei sotto-editor dell'authoring (R-A vincolo 4).

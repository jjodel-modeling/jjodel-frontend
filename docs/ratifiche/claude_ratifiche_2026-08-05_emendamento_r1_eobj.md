# Ratifica — Emendamento a R-1 di E-obj: dalla scrittura atomica alla divergenza dichiarata

**Data**: 2026-08-05
**Emenda**: R-1 di `claude/ratifiche_2026-08-02_eobj_object_as_edge.md`.
**Input**: descrizione semantica del WIP su `EdgeAuthoringPanel.tsx` e `edgeAuthoring.test.ts`, letta dal diff, con `file:riga`.

## Verdetto

**L'emendamento è piccolo e si accetta**, perché la proprietà per cui R-1 esisteva è intatta: `applyEndpoints` resta l'unico scrittore, scrive entrambe le chiavi o nessuna, e nessun percorso di UI produce un IR con un capo solo. Il discriminante strutturale (`isObjectAsEdge = !!(source && target)`) resta quindi sempre corretto e la natura sempre ri-derivabile.

Cambia il resto della regola:

- **Conservato**: la coppia **arriva** insieme.
- **Scambiato**: la coppia non **se ne va** più su input incompleto. Uscire da object-as-edge è ora soltanto `changeNature('reference')`. In cambio si ammette una divergenza fra UI e IR, resa dichiarata invece che silenziosa.

Il guadagno è sostanziale e va messo agli atti: **un edit su un campo non può più cambiare la notazione dell'intera view**. Nella forma precedente, guastare un capo faceva sparire la linea dal canvas. Questo è un comportamento che nessun editor dovrebbe avere.

## La domanda sul canvas: chiusa

Avevo segnalato come caso decisivo la transizione da coppia valida a capo rotto, temendo una divergenza fra pannello e **canvas** di ordine diverso da quella fra pannello e IR. La descrizione la chiude: il canvas continua a rendere la coppia che l'IR contiene davvero, e il pannello mostra un edit non ancora applicato. È la semantica normale di qualunque editor con commit, non uno stato stale. **Non serve alcun avviso sull'edge**: l'avviso nel pannello è sufficiente e sta dove sta la modifica.

## Le quattro condizioni per il commit

Nessuna è strutturale: sono tutte questioni di **cosa l'autore viene a sapere**. Tre riguardano stringhe e una condizione, la quarta un commento.

**C-1. Il caso A non deve restare silenzioso.** Coppia committata più un capo svuotato: alla riapertura il seed ripristina la coppia e l'edit dell'autore viene scartato senza traccia. La perdita si è spostata dal dato all'edit, che è un miglioramento, ma resta silenziosa. Il messaggio di divergenza deve quindi dichiarare **la conseguenza**, non solo lo stato: che finché i capi non sono di nuovo entrambi validi l'IR conserva la coppia precedente, e che uscendo dal pannello la modifica incompleta viene scartata. È una stringa.

**C-2. Il caso B deve avere un avviso proprio.** Nessuna coppia committata e un solo capo digitato: `endpointsDiverge` è falso perché manca `hasCommittedPair`, quindi non compare nulla, e uscendo il testo digitato è perso. Non è una divergenza (non c'è niente con cui divergere), è **lavoro non salvato**, e va detto come tale: una condizione in più e una stringa che avverte che con un capo solo non viene salvato niente. Lo scaffold completo dei due capi resta F2, questa è la sua parte minima e onesta.

**C-3. Il messaggio non deve promettere una persistenza non avvenuta.** `hasCommittedPair` legge il **draft**, non l'IR persistito, e il testo dice "i capi salvati": nella finestra dei 300 ms di debounce è falso. Riformulare senza rivendicare il salvataggio.

**C-4. Il commento a `edgeAuthoring.test.ts:166-176` descrive un percorso di codice cancellato** ("Mirrors applyEndpoints' incomplete branch: drop of the keys"). Il ramo incompleto non droppa più. Il test passa ma è mal etichettato, e la stessa asserzione è già fatta correttamente a `:271-278`. Rietichettare nel commit del WIP; la deduplicazione va con 2.1.

## Il buco di copertura, ed è la ragione per cui 2.1 atterra insieme

I due mirror aggiunti dal WIP (`nextEdgeForEndpoints`, `dropEndpoints`) rispecchiano la sola metà rivolta all'IR. La metà omessa sono `setSourceExpr`/`setTargetExpr`, che nella nuova semantica girano **prima** della guardia e sono l'unica cosa che accade su coppia inutilizzabile.

Detto altrimenti: **il comportamento nuovo introdotto da questo WIP non ha un solo test**. Una modifica alla semantica di una decisione ratificata che atterra con copertura zero proprio sulla parte cambiata non è accettabile, e la causa non è pigrizia ma il vincolo noto per cui i test non possono importare i componenti.

La via d'uscita è già a backlog: **2.1**, l'estrazione dei tre helper in un modulo puro importabile, allargata alla metà di stato locale. Non è più igiene, è l'unico modo di testare la semantica nuova.

**Deciso**: il WIP e 2.1 **atterrano insieme**, stessa sessione, due commit consecutivi (prima l'estrazione, poi la semantica che la usa) oppure uno solo se la diff resta leggibile. Questo scioglie anche il blocco che avevo posto ieri: i due lavori toccano gli stessi due file, quindi la risposta non è congelarli ma unirli.

## Nota di design da conservare

`validateIR` resta **muto** per tutto lo stato divergente, ed è corretto: un IR con la coppia intatta è valido, la divergenza è una condizione di UI. Non va mai instradata attraverso `validateIR`, che ha per contratto l'IR e non il pannello. Questo conferma anche R-B di ieri: la striscia di errore di pannello e gli avvisi di stato sono due canali distinti e devono restare tali.

## Effetto sul backlog

- **Nuovo ordine di atterraggio**: 2.1 allargata → WIP con C-1..C-4 → verifica visiva → commit. Solo dopo parte 1.5.
- **F2** eredita da C-2 la sua parte minima già fatta, e resta responsabile dello scaffold completo.
- **R-1 di E-obj** va marcata come emendata nel documento originale, con rinvio a questo file.

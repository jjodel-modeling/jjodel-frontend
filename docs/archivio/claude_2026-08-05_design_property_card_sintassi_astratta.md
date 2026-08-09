# Property card della sintassi astratta: findings e stato del design

**Data**: 2026-08-05
**Filone**: redesign UI/UX, parallelo all'arco della partizione dei tab IR (nessun file in comune finche' non si implementa).
**Perimetro deciso da Alfonso**: tutti e quattro i casi di selezione, cioe' metaclasse (M2), feature (attributo e reference), istanza M1, package e metamodello.
**Metodo**: mockup before/after prima, poi discovery, poi implementazione.

## Stato

Solo una decisione e' ratificata: il controllo di scelta. Tutto il resto del mockup e' proposta in attesa di ratifica.

Artefatti prodotti in chat (HTML, consegnati ad Alfonso):

- `mockup_property_card_v2.html`, i quattro casi before/after piu' la spec del controllo. Sostituisce la v1.
- `varianti_elemento_scelta.html`, le otto varianti valutate con la tabella dei criteri.
- `chip_scelta_finale.html`, la variante chip poi scartata a favore del segmented.

## Decisione ratificata

**D1 (2026-08-05) — Controllo di scelta: segmented in rilievo.** Track `slate-100`, radius 8, padding 2, gap 2; segmento radius 6, padding 4/12, font 12; scelto con fondo bianco, ombra `0 1px 2px rgba(15,23,42,.14)`, testo `slate-900` peso 600; glifo colorato `cyan` solo sul segmento scelto; hover che alza il solo testo a `slate-700` senza fondo; focus da tastiera con anello `rgba(51,65,85,.18)`, cioe' il focus state gia' in uso nel progetto, distinto dal cyan della selezione.

Vale per Kind (sia sulla reference sia sulla metaclasse) e per Cardinality. Vale come pattern unico per ogni futura scelta fra pochi valori.

Alternative scartate: chip outline (raccomandata dall'architetto, scartata da Alfonso); underline, perche' la sottolineatura cyan significa gia' "tab attivo" nell'editor; pillola con spunta, perche' si allarga alla selezione e sposta le altre, contro il vincolo di non avere layout shift; solid slate, perche' userebbe il colore del focus per dire selezione.

**Due vincoli che nascono con D1, non rinegoziabili senza rivedere la decisione:**

1. Il track va dichiarato `flex-wrap: wrap` con `width: fit-content` e `max-width: 100%`. Il pannello Properties e' ridimensionabile; senza questa regola il fondo grigio si spezza in due blocchi quando manda a capo. E' parte della definizione del componente, non una rifinitura.
2. L'ultimo segmento della cardinalita' e' `Custom…` con i puntini di sospensione, che apre gli stepper esistenti sotto il controllo. I puntini sono la convenzione che dice "apre altro": senza, il segmented promette di esaurire la scelta al suo interno e non lo fa.

**Distinzione fra i due pattern di selezione**: segmented per la scelta esclusiva fra poche alternative; chip token azzurre per gli insiemi multipli e aperti, cioe' oggi solo `Extends`. Tenere separate le due forme evita di ripetere il problema delle cinque implementazioni di checkbox gia' censite nel pannello.

## Findings sul codice e sugli screenshot

Fonte: `frontend/src/components/editors/Info.tsx` su `alfonso-frontend-jjtl` (letto via raw GitHub, quindi puo' divergere dal working tree) piu' i quattro screenshot del 5 agosto, build `v3.0.0-beta (2317)`.

- **[ALTA, da confermare] La sezione INHERITANCE della metaclasse non contiene l'ereditarieta'.** `Extends` e' renderizzato solo sotto `advanced && hasDependencies`. Nello screenshot del metamodello "Depends from models" e' vuoto, quindi in un metamodello che non dipende da altri modelli il campo non compare mai e la relazione di ereditarieta' non e' dichiarabile dalla card. Conferma richiesta ad Alfonso: la modalita' Advanced era attiva quando ha catturato la card della classe. Se si', e' un bug di gating e ha priorita' sul redesign.
- **[MEDIA] Stati illegali rappresentabili.** `Composition` e `Aggregation` sono due booleani indipendenti, quindi entrambi accesi e' uno stato raggiungibile. Stessa forma per `Abstract` e `Interface` sulla metaclasse.
- **[MEDIA] Composition e' sepolta.** Determina la struttura ad albero del modello e sta in fondo alla card, sotto gli otto flag Ecore della sezione ADVANCED.
- **[MEDIA] Tre sezioni indistinguibili per nome** sull'attributo: ADVANCED, FLAGS, ADVANCED STATE, chiuse e in fila.
- **[BASSA] Ridondanza sul metamodello**: i tile OVERVIEW ripetono i conteggi di CONTENTS, e sono la copia non cliccabile.
- **[BASSA] Peso visivo invertito**: "View Analytics" e' l'unico bottone scuro pieno dei quattro casi, per una funzione che porta fuori dal pannello.
- **[BASSA] Breadcrumb ambiguo**: sulla classe rende "State Machine › State Machine › State", modello e package omonimi distinti dalla sola icona. Profondita' variabile fra i casi (sulla feature parte dal package).
- **Asimmetria di contenuto**: il metamodello elenca il proprio contenuto, la metaclasse no.

## Proposta non ancora ratificata

Struttura a quattro sezioni fisse, sempre nello stesso ordine, su tutte le card: `DEFINITION`, poi `CONTENTS` o `FEATURES`, poi `MODIFIERS`, poi `RUNTIME STATE`. Oggi i nomi di sezione sono nove.

`MODIFIERS` assorbe FLAGS e ADVANCED e resta chiusa, con il conteggio degli attivi in testata ("8 · 3 attivi") cosi' non serve aprirla per sapere se dentro c'e' qualcosa di acceso. Il nome `Behavior` e' escluso: e' prenotato da R-1..R-9 per il tab State piu' Actions delle view.

Nessun controllo viene rimosso dalla proposta: cambia dove sta e quanto pesa.

## Domande aperte

- **Cos'e' la barra `> NODE`** in fondo a tutte e quattro le card. Se e' l'aggancio alla sintassi concreta, allora le due property card convivono nello stesso scroll e il confine fra i due filoni va deciso prima di implementare.
- **`DAttribute` ha un valore di default?** Non trovato in `Info.tsx`. Se non esiste, esce dal mockup e diventa un item di backlog.
- **`DReference` ha una reference opposta?** Non trovata. Se il modello dati non ha `opposite`, la bidirezionalita' non e' dichiarabile dalla card.
- **La modalita' Advanced era attiva** allo screenshot della metaclasse (vedi finding ALTA).
- **Autorita' dei venticinque interruttori**: quanti hanno un consumatore nel runtime. Sospetti principali `volatile`, `transient`, `unsettable`, `changeable`, `isIoT`, `partial`, `rootable`. E' la stessa classe di problema del tab Template, che accetta edit, li persiste e non produce effetti. La collocazione in MODIFIERS e' giusta sia che restino sia che vadano tolti, quindi il redesign non e' bloccato; la decisione su cosa rimuovere si'.

## Prossimi passi

1. Chiudere le quattro domande fattuali sopra (`NODE`, `opposite`, default value, stato di Advanced).
2. Ratificare o emendare la struttura a quattro sezioni.
3. Discovery read-only sull'autorita' dei controlli, indipendente e non bloccante. Report in `docs/discovery/` con naming `discovery_<data>_<descrizione>.md`.
4. Prompt di implementazione, partendo dal solo controllo di scelta, che e' isolato e verificabile a vista.

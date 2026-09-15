# Estensione del design system a tutta la piattaforma: piano

**Data**: 2026-08-05
**Origine**: ratifica del controllo di scelta sulla property card della sintassi astratta, allargata a decisione di piattaforma.
**Strategia ratificata**: migrazione per componente, trasversale.
**Fonte di verita' ratificata**: pagina viva nel repo.
**Perimetro**: deciso dall'architetto su delega, sezione 1.

## 0. Il rischio che questo piano esiste per evitare

Nel solo pannello Properties convivono oggi **cinque implementazioni di controllo booleano** (`ui/Checkbox`, `ui/Toggle`, `.bool-toggle`, `<input>` nativi legacy, `.viewpoint-checkbox`) e **tre scale di spacing** (i token `--space-*`, i `jj-*` di `_form-system.scss`, la scala privata di `nestedView.scss`). Sono numeri gia' misurati, non stime.

Un design system introdotto senza sostituire nulla diventa la sesta implementazione e la quarta scala. Il valore di questo lavoro non sta nel dichiarare il canone, che costa un pomeriggio, ma nel **rimuovere le alternative** e nel **rendere impossibile reintrodurle**. Ogni slice che non chiude una divergenza va considerata incompleta.

## 1. Perimetro: tutta la piattaforma, meno due zone di esclusione

Con il taglio per componente, escludere una superficie significa lasciare viva un'implementazione della primitiva che si sta unificando, cioe' non chiudere la divergenza. Quindi il perimetro sono **tutte e quattro le superfici**: pannelli laterali, chrome dell'editor, superfici fuori dall'editor, overlay e dialoghi.

Due eccezioni, entrambe motivate da fatti e non da prudenza generica.

**Zona congelata: cio' che l'arco tab IR sta toccando.** Le classi `.view-editor-tab*` non si rinominano (vincolo del kickoff), e le slice 1.5 e 1.6 riscrivono la barra dei tab e rimuovono i tab morti. `EdgeAuthoringPanel.tsx` ha WIP non committato. Finche' quell'arco non atterra, queste superfici si leggono e non si toccano. Vale anche per l'estetica: due mani sullo stesso file in parallelo producono conflitti che costano piu' del beneficio.

**Zona rinviata: Templates ed Explore.** Templates renderizza una pagina senza nodi, Explore e' "coming soon". Verificato il 2026-08-04. Applicare un design system a superfici che non mostrano nulla e' lavoro che nessuno vede, e la lezione di metodo di quella stessa data dice di verificare che una cosa sia viva prima di spenderci sopra.

**Consegue un vincolo sul censimento**: prima di dichiarare il perimetro definitivo va verificato quali route sono raggiungibili dall'utente e quali no. La lista sopra e' quella che risulta dal knowledge base, non da una misura fatta sul codice oggi.

## 2. Le primitive, in ordine di attacco

L'ordine segue il rapporto fra danno prodotto e costo di chiusura, non la comodita' implementativa.

**P1. Controllo di scelta (segmented).** Non esiste ancora, quindi e' additivo e non ha migrazione. Va per primo perche' e' gia' ratificato, perche' sblocca la property card, e perche' e' l'occasione naturale per creare la pagina viva insieme al primo componente che ci finisce dentro. Spec completa in `claude/2026-08-05_design_property_card_sintassi_astratta.md`.

**P2. Controllo booleano.** Cinque implementazioni, il danno maggiore gia' misurato. Richiede prima una decisione semantica, sezione 3.

**P3. Select e dropdown.** `JjSelect` convive con `<select>` nativi e con select ad hoc dentro `builder.value()`. La riduzione a una primitiva sola e' meccanica una volta deciso il canone.

**P4. Sezione collassabile.** `CollapsibleSection` del Properties contro le altre forme di disclosure sparse. Basso rischio, alta resa visiva.

**P5. Header di pannello.** `.props-header` e i suoi modifier sono gia' condivisi fra due consumatori con esigenze divergenti, che e' il motivo per cui esiste `.props-header--view`. Va affrontato dopo P4 perche' il pattern giusto dipende da come si compongono le sezioni.

**P6. Spacing e token.** La piu' diffusa e la meno visibile presa singolarmente: tre scale in convivenza. Va per ultima perche' e' l'unica che tocca praticamente ogni file, quindi conviene farla quando le primitive sopra hanno gia' ridotto il numero di posti dove lo spacing viene deciso a mano.

Regola trasversale: **una primitiva per volta, mai due in lavorazione insieme**, come gia' vale per le slice edge che atterrano tutte in `UnifiedEdge.tsx`.

## 3. Decisione da prendere prima di P2: toggle o checkbox

Il 28 luglio `ui/Checkbox` era stato dichiarato canone. Il codice e' poi andato in direzione opposta: gli screenshot del 5 agosto mostrano toggle pill ovunque nel Properties, e nessuna checkbox. Prima di unificare va detto quale delle due vince, altrimenti l'unificazione sceglie per inerzia.

**Proposta, da ratificare.** La forma segue la semantica, non la superficie.

- **Toggle pill**: proprieta' booleana di un elemento, che si applica nell'istante in cui la cambi e descrive uno stato persistente di quell'elemento. Tutto il Properties ricade qui: `abstract`, `final`, `unique`, `derived`.
- **Checkbox**: selezione di elementi dentro un insieme, oppure opzione dentro un form che si conferma con un submit. Liste multi selezione, filtri, dialoghi di conferma.

Con questa regola le cinque implementazioni diventano due, la distinzione si spiega in una riga, e nessuno deve chiedersi quale usare. Emenda esplicitamente la dichiarazione del 28 luglio, che ratificava una primitiva senza dichiarare quando l'altra fosse legittima.

## 4. La pagina viva

Route interna montata sempre e non linkata dalla UI di produzione, raggiungibile per URL. Nasce con P1 e cresce di una sezione a ogni primitiva chiusa.

Per ogni componente mostra, nell'ordine: **tutti gli stati** (riposo, hover, focus da tastiera, attivo, non disponibile, errore dove esiste); **le varianti dimensionali**; il comportamento **a contenitore stretto**, che e' il caso in cui il segmented si rompe e in cui quasi tutti i controlli mentono; e la **regola d'uso in una riga**, cioe' quando si usa quel componente e quando no.

Il valore non e' la vetrina. E' che il terzo attore, Claude Code, puo' leggerla prima di scrivere, e che una divergenza diventa visibile nel momento in cui la si introduce invece che sei mesi dopo su uno screenshot.

Vincolo: la pagina renderizza **i componenti veri importati dal codice di produzione**, mai copie. Una vetrina che ridichiara il markup e' un quarto posto dove le cose divergono.

## 5. La regola anti drift

Senza questa, il piano produce una piattaforma coerente che ricomincia a divergere alla prima feature. Va aggiunta a `CLAUDE.md` come regola numerata, nella stessa forma delle altre.

Contenuto minimo: prima di introdurre un controllo di form, un bottone, una sezione collassabile o un valore di spacing, Claude Code verifica se la primitiva esiste gia' nella pagina viva e la riusa; se ritiene che serva una primitiva nuova, si ferma e lo chiede invece di scriverla; i valori cromatici e di spaziatura si prendono dai token e non si scrivono in cifre; nessuna classe SCSS nuova che ridefinisca un aspetto gia' coperto da una primitiva.

Il progetto ha gia' il precedente giusto: la regola sulla verifica dei nomi prima di introdurne di nuovi esiste perche' le collisioni CSS non danno errori di compilazione e si scoprono a ore di debug di distanza. Questa e' la stessa regola applicata alla forma invece che al nome.

## 6. Sequenza operativa

1. **Censimento trasversale delle primitive**, discovery read only su tutta la piattaforma. Prompt separato, gia' pronto. Verifica anche quali superfici sono vive, prima di fissare il perimetro definitivo.
2. **Ratifica della regola toggle o checkbox** (sezione 3) sulla base dei numeri del censimento.
3. **P1 piu' pagina viva**, in un solo arco: la primitiva nuova e il posto dove si guarda nascono insieme.
4. **Regola anti drift in `CLAUDE.md`**, subito dopo, non alla fine: da quel momento ogni nuova feature nasce conforme e il debito smette di crescere mentre lo si ripaga.
5. **P2, P3, P4, P5, P6**, una per volta, ciascuna con la sua sezione nella pagina viva e la rimozione delle implementazioni che sostituisce.

I punti 1 e 2 non toccano codice. Il punto 3 e' additivo. Il primo punto che rimuove qualcosa e' il 5, ed e' li' che serve il gate visivo di Alfonso a ogni commit.

## 7. Cosa questo piano non decide

Non decide la struttura a quattro sezioni della property card, che resta proposta in attesa di ratifica. Non decide il destino dei venticinque interruttori, che dipende dalla misura di autorita'. Non tocca la palette ne' la tipografia, che sono gia' fissate e non risultano in discussione: il problema misurato non e' quali valori usare, e' che gli stessi valori vengono espressi in tre modi diversi.

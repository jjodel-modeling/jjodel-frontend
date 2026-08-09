# Partizione dei tab IR: proposta di ratifica sui cinque punti aperti

**Data**: 2026-08-04 16:05
**Input**: discovery tab map committata in `79a0d90c2` più la riconciliazione di Claude Code sulla proposta `claude/proposta_2026-08-04_tab_ir_partizione.md`.
**Stato**: posizioni argomentate, in attesa di ratifica di Alfonso. Nessuna implementazione.

## Correzioni accettate

**Correzione 1, `appliableToClasses` non è un seed una tantum: accettata, ed era un errore mio.** Avevo generalizzato dal commento in `MatchingSection.tsx:32-33` e dal ramo di seed in `EnableIRPanel`, senza guardare il memo di `VertexAuthoringPanel.tsx:118-123`. Il campo è un **pin di identità** vivo a ogni memo, ed è l'unica cosa che impedisce al PathBuilder di leggere le feature della classe sbagliata quando due metamodelli del progetto dichiarano una classe omonima. La riga della proposta secondo cui Applies to per una view IR contiene "cioè niente" è sbagliata e va cassata.

**Correzione 2, Style dipende da un toggle: accettata**, con una riformulazione che cambia la decisione (vedi R-2).

**Correzione 3, `isEdge` morto come dato e vivo come gate: accettata** senza riserve.

**Nota sul delta a tre viewpoint: accettata.** Se il codice che ammette viewpoint attivo, Default e decorativi vive dentro `getAppliedViewsNew` e quella funzione non ha chiamanti, non è un delta vivo e non va raccontato come tale in UI. Applies to mostra il viewpoint e se è attivo, senza spiegare un confronto con un comportamento che in editor-v2 non è mai esistito.

---

## R-1 (Applicable to) — Il pin di identità entra nell'IR come campo additivo; il controllo classico si rimuove

**Posizione**: `metaclasses` resta una lista di nomi e la semantica del resolver non si tocca. Accanto, un campo **opzionale e additivo** che porta i pointer risolti, scritto dal pannello quando l'autore sceglie una metaclasse e letto **solo** dal livello di authoring per pinnare la classe target del PathBuilder. Assente, si cade sul match per nome, cioè il legacy behaviour di oggi. `Applicable to` sparisce come controllo.

**Perché non tenere il controllo classico** (opzione a). Il tab dichiara "restrict this view to specific metamodel element types", ma sulle view IR quella funzione non esiste più: nessuno legge `appliableToClasses` per filtrare. L'unica funzione rimasta è disambiguare un'omonimia. Tenerlo significa lasciare in piedi un controllo la cui etichetta dice una cosa e il cui effetto ne fa un'altra, che è esattamente la bugia di interfaccia che R-2 di E-obj ha rifiutato quando due voci di kind producevano lo stesso seed. In più mantiene due liste di metaclassi su due superfici diverse, libere di divergere in silenzio: l'autore aggiunge una metaclasse in Applies to e il pin resta sulla vecchia.

**Perché non far accettare pointer a `metaclasses`** (opzione b). Il resolver matcha per nome risalendo l'ancestry M2 (`classAncestryNames`). Accettare pointer significa cambiare la semantica di risoluzione, toccare `irCompile` e `irResolveCore`, e mettere a rischio le view già persistite. È esattamente il tipo di modifica che la mappa di copertura tiene sotto "slice separata che può invalidare view persistite".

**Costo dell'opzione scelta**: additiva, retrocompatibile, nessun bump di `irVersion` (precedente: l'addendum edge del 26 luglio, additivo senza bump), nessuna migration, resolver invariato. Il campo va dichiarato per quello che è, metadato di authoring, così non diventa il prossimo `edge.routing` dichiarato-inerte che qualcuno un giorno prova a leggere.

**Se sbaglio**: è l'unico dei cinque punti con un costo funzionale reale. Sbagliare qui significa PathBuilder che legge le feature della classe omonima sbagliata, cioè il bug della discovery 2026-07-23 §9 che torna. Per questo il pin va scritto **prima** di rimuovere il controllo classico, non dopo, e la rimozione va in un commit separato dalla sua introduzione.

---

## R-2 (Style) — Nessuna migration; il tab si rimuove, il campo resta, il conflitto diventa ispezionabile

**Riformulazione, ed è il punto**: `cssIsGlobal = true` non è un bug, è un **canale di theming non dichiarato**. La cascata che ridipinge `.ir-node-content` funziona perché l'IR consuma di proposito i token del design system (`background: var(--node-bg)`, `irStyle.ts:44`). Una palette globale che ridefinisce `--node-bg` sul body non sta sfondando l'IR: sta usando il meccanismo di theming che l'IR espone deliberatamente.

Ne discende che **la via del namespacing non funziona** e va scartata subito, prima che qualcuno la proponga come fix da una riga: rendere l'IR immune (`--jj-ir-node-bg`) significa renderlo non tematizzabile, e il fallback (`var(--jj-ir-node-bg, var(--node-bg))`) lascia passare la cascata esattamente come prima. Immunità e tematizzabilità sono la stessa proprietà vista da due lati.

**Posizione, in tre parti**:

1. **Nessuna migration** che spenga `cssIsGlobal` sui progetti salvati. Cambiare il rendering di un progetto esistente senza che l'autore lo chieda è il punto di non ritorno che stiamo evitando altrove, ed è peggio del rischio che chiude.
2. **Il tab Style si rimuove dalle view IR, il campo resta persistito e round-trippa.** Coerente con il trattamento di `jsxString`.
3. **Il conflitto diventa ispezionabile in Source**: per la view corrente, se porta CSS con `cssIsGlobal` attivo, Source lo mostra e nomina le chiavi di palette che ombreggiano le custom property consumate dall'IR. Questo trasforma un override invisibile in un override leggibile, che è la regola già scritta nella spec §10, "mai sparizioni silenziose: ogni degrado ha un artefatto visibile o un log".

**Micro-slice separata, non dentro il lavoro sui tab**: un rilevamento all'attivazione del viewpoint che logga una warning quando una view del viewpoint attivo ha `cssIsGlobal` e definisce una chiave che ombreggia un token consumato dall'IR. Serve perché Source copre la view che stai guardando, non quella di un'altra view che ti sta ridipingendo il canvas.

**Domanda che resta aperta e che nessuno può chiudere per lettura**: se il theming di viewpoint è una capacità che vogliamo, allora la sua casa non è il tab di una view, è l'editor del viewpoint. Decisione separata, da non prendere adesso.

---

## R-3 (Basic/Advanced) — Confermato: i tab non si gatano, tranne Source

Concordo, e l'argomento di Claude Code è migliore del mio: oggi Row ed Edge non leggono `advanced` affatto, e in Basic il matching di una vertex view è irraggiungibile da ogni punto della UI. La partizione non espone superfici nuove, chiude un buco e unifica tre politiche divergenti.

**Precisazione da mettere agli atti**: dopo la partizione, `advanced` sopravvive **solo** come gate sui rami `Conditional`, mai su sezioni o tab. Diventa un gate per-controllo, uniforme, con una sola regola da ricordare: in Basic si autora un valore, in Advanced anche la condizione che lo sceglie.

---

## R-4 (Lingua) — Inglese, e le stringhe interne in una pass separata

Concordo. Vincolo accettato: le classi SCSS `.view-editor-tab*` non si rinominano.

**Aggiunta**: i nomi dei tab sono inglesi in questo lavoro, ma le stringhe italiane dentro `RowAuthoringPanel`, `EdgeAuthoringPanel` e `MatchingSection` **non** si traducono nello stesso commit. Un commit che è insieme strutturale e di traduzione produce una diff in cui il reviewer non distingue le due cose, e la regola di scope esiste per evitarlo. Traduzione in una pass sua, dopo.

---

## R-5 (La partizione a 5 supera la ratifica a 3) — Confermato, con la mappa

Confermo, e vale la pena mettere agli atti **perché** il 3 non ha tenuto, altrimenti fra un mese sembrerà un ripensamento.

Non ha tenuto per il test degli orfani: i capi dell'edge e il selettore di natura non stanno in Shape (non sono aspetto) e non stanno in Content (non sono contenuto). Sono topologia, cioè come la view si aggancia ad altri elementi. La stessa terza categoria che ospita i `fieldCompartments` del vertex e ospiterà il `containment` del graphVertex. Questa è la conclusione a cui la riconciliazione arriva indipendentemente da due direzioni, il che è il miglior segnale che abbiamo.

Mappa di migrazione dalla ratifica del 2026-08-03:

- `Shape` → **Structure** (compartimenti, natura, capi, reference, containment) più **Appearance** (forma, fill, border, resizable, badge, linea, terminazioni)
- `Content` → **Text** (label del vertex con text style, template della row, label center dell'edge)
- `Applies to` → invariato nel nome, più la breadcrumb `viewpoint › parent › questa view` in sola lettura e, sotto R-1, il pin di identità
- **Source** → nuovo, sola lettura, Advanced
- `Events` legacy marcato → si rimuove dalle view IR
- `Behavior` → invariato: nasce col modello di stato, fuori da questo lavoro

---

## R-6 (Minori) — Due sì e un no

**Sì**: il ramo "authoring non ancora disponibile" (`ViewData.tsx:95-101`) è irraggiungibile e si cancella. Il gate `view.isEdge !== true` in `showIRTab` resta: la sostituzione della barra riguarda le view con `ir`, il gate governa l'ingresso all'IR per tutte le altre.

**No, o meglio non da solo**: `graphVertex` in `showIRTab`. La riga costa poco, ma senza una sezione containment dentro Structure apre un tab che non sa autorare niente, e in un lavoro il cui senso è **sottrattivo** aggiungere una superficie vuota è una contraddizione nei termini. Va insieme alla sezione, oppure non va. Dato che oggi una graphVertex view si crea solo da console, il costo del rinvio è nullo e il momento giusto è la prima slice dopo la partizione.

---

## Cosa resta aperto dopo queste ratifiche

1. **Verifica a runtime su `cssIsGlobal = true`** (Q1 del report): un minuto, e decide se R-2 punto 3 è sufficiente o se serve anche il rilevamento subito invece che come micro-slice.
2. **Discovery sul sollevamento dello stato UI** dai sotto-editor al pannello: invariata, ed è l'unico punto in cui la partizione tocca codice già verificato (rami E-ref ed E-obj).
3. **Bug dei due Select su `father`** (`InfoData.tsx:306,323`, replicato in `ViewProperties.tsx:121-133`): indipendente, va in lista bug aperti, non si corregge dentro questo lavoro.
4. **Theming di viewpoint**: se è una capacità voluta, dove vive. Non adesso.

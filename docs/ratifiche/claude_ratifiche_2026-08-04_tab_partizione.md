# Ratifiche — Partizione dei tab per le view IR-authored

**Data**: 2026-08-04
**Ratificate da**: Alfonso, in chat.
**Fonti**: discovery tab map v2 committata in `79a0d90c2`; riconciliazione di Claude Code sulla proposta di chat; `claude/proposta_2026-08-04_tab_ir_partizione.md`; `claude/mappa_parametri_tab_ir.md`.
**Rapporto con la ratifica del 2026-08-03**: la supera. La barra `Applies to · Shape · Content` è sostituita dalla partizione qui sotto (R-5).

## Premessa: il bivio è chiuso

La partizione **sostituisce** la barra di `ViewData` per le view con `ir`, non si annida dentro il tab IR. La discovery ha stabilito che per una view IR-authored nessuno legge `template` (`GraphElementComponent` rimosso, `classicSlot` mai passato, `data.jsxString` mai popolato), `events` (già R-1), `options` (flag non cablati, griglia hardcoded, Snap `readOnly` fisso). E `getAppliedViewsNew` non ha chiamanti in `frontend/src`, quindi Apply-to non è letto **per nessuna view**, non solo per quelle IR. Non c'è niente da annidare.

Corollario messo agli atti: il codice che ammette tre viewpoint (attivo, Default, decorativi) vive dentro quella funzione morta. Non è un delta vivo rispetto all'IR e non va raccontato come tale in UI.

## R-1 — Il pin di identità entra nell'IR come campo additivo

`appliableToClasses` **non** è un seed una tantum: `VertexAuthoringPanel.tsx:118-123` lo rilegge a ogni memo per pinnare per identità la metaclasse target del PathBuilder. `ir.metaclasses` è una lista di nomi, `appliableToClasses` una lista di pointer: quando due metamodelli del progetto dichiarano una classe omonima, il pin è l'unica cosa che impedisce di leggere le feature della classe sbagliata (mitigazione del bug della discovery 2026-07-23 §9; il fallback per nome è etichettato legacy nel codice).

**Deciso**: `metaclasses` resta una lista di nomi e la semantica del resolver non si tocca. Accanto, un campo **opzionale e additivo** che porta i pointer risolti, scritto dal pannello quando l'autore sceglie una metaclasse e letto **solo** dal livello di authoring. Assente, si cade sul match per nome, cioè il comportamento di oggi. `Applicable to` si rimuove come controllo.

Scartate: tenere il controllo classico (etichetta che dice una cosa ed effetto che ne fa un'altra, più due liste libere di divergere in silenzio); far accettare pointer a `metaclasses` (cambia la semantica di risoluzione, tocca `irCompile` e `irResolveCore`, può invalidare view persistite).

**Vincoli**: additivo, retrocompatibile, nessun bump di `irVersion`, nessuna migration, resolver invariato. Il campo va dichiarato come metadato di authoring, per non diventare il prossimo `edge.routing` dichiarato-inerte. **Sequenza obbligata**: il pin si scrive **prima** di rimuovere il controllo classico, in un commit separato dalla rimozione. È l'unico punto della partizione con un costo funzionale se sbagliato.

**Trappola da mettere nel prompt di implementazione (2026-08-04)**: `isMigratedDefaultView` (`irDefaults.ts:128-145`) decide la delega al rendering nativo confrontando `irHash(canonicalize(ir meno migratedFrom))` con l'hash di `defaultObjectViewIR()`. Scrivere il pin su una view migrata **ne cambia l'hash**, quindi la view smette di delegare e passa all'interprete IR: su un progetto migrato è quasi tutto il parco view. Due uscite, entrambe accettabili, da scegliere nel prompt: o il pin si scrive **solo su azione esplicita dell'autore**, o `canonicalize` lo **esclude** come già fa con `migratedFrom`. Va deciso prima, non scoperto alla verifica visiva.

## R-2 — Style: nessuna migration, tab via, campo che resta, conflitto ispezionabile in Source

**Emendamento del 2026-08-04, task 1.1 chiuso in `709004102`.** La misura su pagina isolata (catena esatta: concatenazione del selettore `view.tsx:864-866`, `BASE_CSS` di `irStyle.ts`, paint inline `IRNodeContent.tsx:157-180`) ha **confermato metà** della lettura originale e **falsificato l'altra metà**. Il testo qui sotto è quello corretto; la formulazione precedente ("una palette `node-bg` ridipinge il nodo per pura cascata") era sbagliata e va considerata ritirata.

- **Confermato**: con `cssIsGlobal = true` il testo `body { .ir-node-content { … !important } }` parsa come **CSS Nesting nativo** e batte il paint inline dell'interprete. Misurato: `background-computed rgb(9,9,9)`, cioè la regola annidata, non l'inline `rgb(50,50,50)`.
- **Falsificato**: il canale delle **variabili** di palette è quasi chiuso. `--node-bg`, `--border-default` e le due ombre sono dichiarate su `.editor-v2.theme-*` (`_themes.scss:40,186`), cioè su un antenato più vicino al nodo di quanto lo sia `body`, quindi una ridefinizione su `body` è schermata. Misurato: `--node-bg` vale il valore del tema al nodo e il valore della palette solo su `body`. Il canale funziona **solo per i token di `:root`**, e fra quelli che l'IR consuma il solo `--color-accent` (misurato: `outline-color rgb(0,255,0)`).

**Il vettore da sorvegliare è quindi il testo CSS, non i nomi delle palette.**

Ne discende una **aggravante** trovata durante la misura: il css di default che ogni `DViewElement` riceve alla creazione (`classes.ts:1125-1170`) è **già scritto in forma annidata con `&` e già pieno di `!important`**. Era LESS per il compilatore classico; oggi è CSS Nesting nativo iniettato raw, inerte solo perché il selettore locale non matcha. Non è quindi un escape hatch autorato da pochi: è testo dormiente presente su **tutte** le view.

Messo agli atti perché non venga riproposto come fix da una riga: **il namespacing non funziona**, ma per una ragione più netta di quella che avevo dato. Contro il vettore reale (regola annidata con `!important`) è semplicemente irrilevante, perché `!important` batte l'inline a prescindere dal nome della variabile. E contro il canale delle variabili sarebbe sproporzionato, dato che quel canale si riduce a `--color-accent`: renderlo immune significherebbe rendere l'IR non tematizzabile per chiudere una superficie di un token.

**Deciso**:

1. **Nessuna migration** che spenga `cssIsGlobal` sui progetti salvati. Cambiare il rendering di un progetto esistente senza che l'autore lo chieda è un punto di non ritorno peggiore del rischio che chiuderebbe.
2. Il tab Style **si rimuove** dalle view IR; il campo resta persistito e round-trippa verbatim, come `jsxString`.
3. Source **espone** il conflitto per la view corrente: se porta CSS con `cssIsGlobal` attivo, lo dichiara e mostra le regole annidate con `!important` che possono battere il paint dell'interprete. Regola di riferimento: spec §10, mai sparizioni silenziose.

**Micro-slice 3.6, e non è più "fuori da questo lavoro"**: rilevamento all'attivazione del viewpoint con warning quando una view del viewpoint attivo ha `cssIsGlobal` vero e un `view.css` che contiene una regola annidata con `!important`. La misura l'ha resa **più semplice** di come era formulata (rilevamento sul testo, non scansione per collisione di nomi) e insieme **più urgente**, per via del css di default dormiente su tutte le view.

**Sequenza deciso il 2026-08-04**: **3.6 precede 1.6**. Rimuovere il tab Style lasciando vivo il canale misurato significa togliere la superficie da cui accorgersene mentre il canale resta attivo, e la popolazione esposta non è un caso raro ma il parco view intero. Se per qualunque ragione 1.6 dovesse partire prima, la finestra va accettata **per iscritto** nel prompt, non lasciata implicita.

**Misura ancora da fare, una riga sullo stesso harness**: a cosa risolve il **css di default** di una view quando `cssIsGlobal` è vero, dato che `&` si risolve rispetto al prefisso `body`. Se dipinge `body` è rumore; se raggiunge i nodi, 3.6 smette di essere una micro-slice.

**Domanda lasciata aperta di proposito**: se il theming di viewpoint è una capacità voluta, la sua casa è l'editor del viewpoint, non il tab di una view. Non si decide adesso.

## R-3 — I tab non si gatano, tranne Source

Concordato su un argomento che rafforza la proposta: oggi Row ed Edge non leggono `advanced` affatto, e in Basic il matching di una vertex view è irraggiungibile da ogni punto della UI. La partizione non espone superfici nuove, chiude un buco e unifica tre politiche divergenti.

**Deciso**: dopo la partizione `advanced` sopravvive **solo** come gate sui rami `Conditional`, mai su sezioni o tab. Diventa un gate per-controllo con una regola sola: in Basic si autora un valore, in Advanced anche la condizione che lo sceglie. Source resta Advanced-only.

## R-4 — Lingua inglese, traduzione delle stringhe interne in una pass separata

I nomi dei tab sono in inglese, coerenti con i tab esistenti in `ViewData.tsx` e con la §7 del design system. Le classi SCSS `.view-editor-tab*` **non si rinominano** (regola 2).

**Deciso**: le stringhe italiane dentro `RowAuthoringPanel`, `EdgeAuthoringPanel` e `MatchingSection` non si traducono nello stesso commit. Un commit insieme strutturale e di traduzione produce una diff in cui il reviewer non distingue le due cose.

## R-5 — La partizione a 5 supera la ratifica a 3

Il 3 non ha tenuto per il **test degli orfani**: i capi dell'edge e il selettore di natura non stanno in Shape (non sono aspetto) e non stanno in Content (non sono contenuto). Sono topologia, la stessa categoria che ospita i `fieldCompartments` del vertex e ospiterà il `containment` del graphVertex. La riconciliazione ci arriva da due direzioni indipendenti.

Mappa di migrazione:

- `Shape` → **Structure** (compartimenti; natura, capi e reference dell'edge; containment del graphVertex) più **Appearance** (forma, fill, border, resizable, badge, linea, terminazioni)
- `Content` → **Text** (label del vertex con text style, template della row, label center dell'edge)
- `Applies to` → invariato nel nome, più la breadcrumb `viewpoint › parent › questa view` in sola lettura e, sotto R-1, il pin di identità
- **Source** → nuovo, sola lettura, Advanced
- `Events` legacy marcato → si rimuove dalle view IR
- `Behavior` → invariato: nasce col modello di stato, fuori da questo lavoro

Matrice di riempimento: vertex tutti e quattro; graphVertex tutti e quattro; row solo `Applies to` e `Text` (Structure e Appearance **nascosti**, non disabilitati: una row non ha geometria per costruzione); edge tutti e quattro, con Structure che cambia contenuto secondo la natura.

## R-6 — Minori

**Si fa**: cancellazione del ramo irraggiungibile "authoring non ancora disponibile" (`ViewData.tsx:95-101`). Il gate `view.isEdge !== true` in `showIRTab` **resta**: `isEdge` è morto come dato ma vivo come gate, e governa l'ingresso all'IR per le view senza `ir`.

**Non si fa ora**: `graphVertex` in `showIRTab`. La riga costa poco, ma senza la sezione containment dentro Structure apre un tab che non sa autorare niente, e in un lavoro sottrattivo aggiungere una superficie vuota è una contraddizione. Va insieme alla sezione. Oggi una graphVertex view si crea solo da console, quindi il rinvio costa zero.

## Invarianti implementative

- **Un solo draft, a livello di pannello.** I tab sono viste sul medesimo oggetto. Se il draft si frammenta saltano la scrittura atomica dei capi (R-1 di E-obj), la convenzione del drop della chiave e il round-trip verbatim dei campi non autorati.
- **Un solo debounce di commit** (300 ms, a livello di pannello). Cambiare tab non è un evento di commit.
- **Smontare un tab non resetta nulla**: lo stato UI locale dei sotto-editor (caso noto: `sourceExpr`/`targetExpr` prima della scrittura atomica in `EdgeAuthoringPanel`) va sollevato nel pannello.
- **`validateIR` resta l'unico gate del commit.** Gli ErrorText informativi restano informativi.
- **La validazione vive a livello di pannello, i tab la riflettono.** Un tab non valida per conto suo. Tre dipendenze diventano cross-tab e vanno segnalate con badge sull'header più striscia di pannello: PathBuilder disabilitato per assenza di metaclasse; wildcard più natura object; ambiguità di metaclasse fra metamodelli.

## Prossimi passi

1. **Discovery sul sollevamento dello stato UI** dai sotto-editor al pannello (invariante 3). È l'unico punto in cui la partizione tocca codice già verificato, cioè i rami E-ref ed E-obj. Report in `docs/discovery/` col naming `discovery_<data>_<descrizione>.md`.
2. **Verifica a runtime su `cssIsGlobal = true`** (Q1 del report della tab map): un minuto, e decide se la micro-slice di rilevamento sale di priorità.
3. **Implementazione**, in commit separati e nell'ordine: pin di identità → rimozione di `Applicable to` → partizione della barra → rimozione dei tab morti.

## Todo aperti generati da queste ratifiche

- **[bug, indipendente]** I due Select "Viewpoint" e "Parent view" scrivono lo stesso campo `father` senza setter custom (`InfoData.tsx:306,323`; `Input.tsx` cade su `data[field] = …`). Scegliere un viewpoint riparenta e perde il parent precedente (`set_father`, `view.tsx:1456`, con `SetFieldAction('subViews', …, '-=')` sul vecchio parent). Replicato in `ViewProperties.tsx:121-133`. Non si corregge dentro il lavoro sui tab.
- **[micro-slice]** Rilevamento del conflitto `cssIsGlobal` all'attivazione del viewpoint (R-2).
- **[slice successiva]** `graphVertex`: sezione containment in Structure più la riga in `showIRTab` (R-6).
- **[igiene]** `claude/mappa_sintassi_concreta.md` è stale: dichiara ancora la rehydration del viewpoint selector come blocco più costoso del progetto, chiusa come non riproducibile il 2026-08-04.

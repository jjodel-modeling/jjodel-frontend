# Ratifiche: design system di piattaforma, dopo il censimento

**Data**: 2026-08-05
**Base**: `docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md` (nel repo, HEAD `85fc8aa3e`).
**Sostituisce** le parti corrispondenti di `claude/2026-08-05_piano_design_system_piattaforma.md`, che resta valido su strategia e principi.

## Cosa ha cambiato il censimento

Tre assunzioni del piano sono cadute e vanno registrate, perche' erano il fondamento della stima.

**La piattaforma e' molto piu' piccola di quanto sembri.** Su 21 pagine del ramo autenticato, **17 sono morte**: raggiungibili ma vuote (Templates, Explore, Archive, Community), inerti da admin (UsersInfo, ProjectsInfo, News), oppure senza alcun link e raggiungibili solo digitando l'hash (Settings, Updates, Profile, Notes, Recent, i tre banchi di prova, i due harness di riproduzione). Morti anche il GlobalDrawer intero, sette modali e le modalita' editor classic e split. Il perimetro vero e' **tre superfici**.

**Il debito e' molto piu' grande di quanto stimato.** Le cinque implementazioni di controllo booleano misurate a luglio sul solo Properties sono **quattordici** sulla piattaforma. I bottoni: 39 `ui/Button` contro 228 usi di `.btn*` contro **631 `<button>` nudi**, cioe' un bottone di sistema ogni sedici scritti a mano, e 192 famiglie di classi. Le scale di spacing sono **quattro**, i vocabolari tipografici **tre**, con 2 698 dichiarazioni di `font-size` su 128 valori distinti e solo il cinque percento espresso via token.

**Il censimento ha trovato un bug di prodotto.** `src/styles/tokens/index.scss:106-112` nasconde globalmente ogni `<input type="checkbox">` (`opacity: 0`, dimensioni azzerate, `pointer-events: none`) e il blocco che avrebbe dovuto ridisegnarlo e' commentato. Restano attive solo le regole di stato, che colorano uno pseudo elemento mai dimensionato. Le trenta occorrenze di checkbox nativo in ventuno file sono visibili solo dove il componente si ridefinisce lo stile: diciannove file SCSS lo fanno, gli altri no.

## Decisioni

**DS-1 — Perimetro definitivo: tre superfici.** `#/allProjects` con dashboard, card, catalog, LeftBar e Navbar; `#/project` con dock, tab Metamodel, Model e Documentation, canvas flow, pannello Properties, pannello Viewpoints e pannelli di authoring IR; le **modali** (UnifiedSettings, CreateProject, NewViewpoint, NewTransformation, ExecuteTransformation, Import summary, EdgeMarkerEditor, EnvGenWizard, dialoghi JjTL). Tutto il resto e' misurabile e non vale la misura. Resta ferma la zona congelata su cio' che l'arco tab IR sta toccando.

**DS-2 — Colore dello stato acceso: cyan `#0ea5e9`.** Ratificato il 5 agosto. Vince lo stato di fatto: zero call site da toccare contro trentuno, e sul track di un toggle il colore porta informazione, mentre uno slate scuro dentro una card grigia si confonde con il disabilitato. **`CLAUDE.md` §7.1 va emendato**, non il codice. Va rimosso anche il commento di `Checkbox.module.css:38`, che giustifica la scelta opposta citando lo stesso "design system A": due file della stessa cartella non possono invocare la stessa autorita' per decisioni contrarie.

**DS-3 — Rimozione del codice morto: si', separando le feature non cablate.** Un commit `chore` porta via cio' che ha zero call site ed e' duplicato o dichiarato obsoleto nel nome: `ui/VerticalToggle`, `.jjodel-switch`, `.form-toggle`, `.jjtl-dialog__toggle-switch` (classe senza CSS), `forEndUser/Selector`, `MySelect`, `DropDownButton`, `ModeSystem` intero (`CollapsibleSection`, `ModeToggle`), `useAdvancedSections`, `MegamodelModal-toDelete`, `ElementPropertiesDrawer`, `BottomDrawer`, `JjodieWidget`, `src/examples/`, il CSS di `.editor-mode-toggle` e `.jj-segmented-control`. Rischio quasi nullo per definizione, e la superficie da migrare cala di circa un terzo: i booleani da 14 a 9, le select da 9 a 5.

**Restano in sospeso, non si toccano**: `ExportImageMenu`, `ExportImportMenu`, `ProviderSelector` (due copie). Sono feature scritte e mai cablate, non duplicati. L'export immagine in particolare e' una capacita' che il prodotto non espone: va deciso se cablarla o ritirarla, ed e' una decisione di prodotto, non di pulizia.

**DS-4 — La prima slice e' il bug delle checkbox.** Precede il design system perche' e' un difetto che l'utente subisce oggi, e perche' migrare i controlli booleani sopra una regola che li nasconde significherebbe migrare verso qualcosa che poi sparisce. Fase 1 di verifica mirata, hard stop, poi fix.

**DS-5 — Toggle e checkbox, la regola semantica resta.** Toggle pill per una proprieta' booleana che si applica nell'istante in cui la cambi; checkbox per selezionare elementi in un insieme o per un form con submit. Conseguenza operativa: **`ui/Checkbox` si tiene** nonostante zero call site, ed e' la destinazione dei trenta `<input>` nativi che ricadono nel secondo caso. Non e' una primitiva inutile, e' una primitiva mai adottata.

**DS-6 — Token: `tokens/` e' il canone, `tokens.css` viene assorbito.** Oggi `App.tsx:8` importa `tokens.css` e `App.scss:6` importa `tokens/index.scss`: due sistemi caricati insieme, nessuno alias dell'altro, e i CSS Module di `ui/` usano il secondo vocabolario mentre la documentazione presenta il primo come unica fonte. L'assorbimento va in due tempi, perche' i due casi non hanno lo stesso rischio.

*Spacing: rename sicuro.* `--spacing-*` diventa alias di `--space-*`. I valori coincidono, quindi nessun impatto visivo. Unica avvertenza tecnica: `--space-*` e' in rem e `--spacing-*` in px, quindi l'equivalenza regge finche' il font size di root resta a 16px. L'alias va commentato dicendo esattamente questo.

*Tipografia: non e' un rename.* `--text-sm` vale 13px e `--font-size-sm` ne vale 12; `--text-base` 15px contro 13px. Stesso nome logico, pixel diversi. Unificare cambia il rendering, quindi e' un intervento con verifica a vista, in una slice sua, dopo lo spacing e mai insieme.

**DS-7 — Il segmented parte da E1 con semantica corretta.** La base e' `.appbar-mode-switch` (`Navbar.tsx:1933`), la piu' matura per struttura, ma **la semantica ARIA va cambiata**: ne' `aria-pressed`, che descrive un pulsante a due stati, ne' `role="tablist"` di E2, che descrive la navigazione fra pannelli. Kind e Cardinality sono un input di valore a scelta esclusiva, quindi `role="radiogroup"` con figli `role="radio"` e `aria-checked`. Il resto della spec resta quello ratificato: track grigio, elemento scelto in rilievo bianco, glifo cyan solo sullo scelto, `flex-wrap` dichiarato, ultimo segmento `Custom…`.

**DS-8 — La vetrina non nasce da zero.** Si estende `TokenPreview` (`src/pages/TokenPreview.tsx`, gia' su `#/test-tokens`, gia' con toggle light e dark e sezioni per colori, tipografia, spacing, ombre, raggi) montandoci dentro `FormExample` (`src/components/ui/examples/FormExample.tsx`, oggi orfano e gia' scheletro di una pagina componenti). Route `#/design-system`, `test-tokens` mantenuta come alias. **Nessuna voce di menu**: e' una superficie di lavoro, non di prodotto, e si raggiunge per URL. Il riferimento va in `CLAUDE.md` cosi' Claude Code la consulta prima di scrivere.

**DS-9 — `forEndUser/` esce dal perimetro.** La domanda aperta OQ-1 del report, cioe' se i template `jsxString` siano ancora valutati, e' gia' chiusa da una misura del 4 agosto: nessuna pipeline viva legge il `jsxString`, e l'unico ramo che lo nomina (`ClassNode.tsx:424`) non riceve mai input popolato. I controlli di `forEndUser/` non vengono quindi renderizzati da nessuna parte, e la sottostima segnalata dal report non si verifica. Restano fuori dal design system e diventano candidati a una rimozione futura, insieme al capitolo legacy.

**DS-10 — I conteggi vanno riproiettati prima di dimensionare.** Tutti i numeri del censimento sono su `src/` intero, che include diciassette pagine morte su ventuno. Sono quindi un limite superiore, non la taglia del lavoro. Ogni slice, prima di partire, ricalcola le proprie occorrenze sulle sole tre superfici di DS-1. E' l'estensione naturale della lezione del 4 agosto: non basta verificare che il corpus sia vivo una volta, va fatto a ogni misura che serve a decidere.

## Sequenza aggiornata

1. **Slice 0, checkbox invisibili.** Verifica mirata delle trenta occorrenze sul perimetro vivo, con verdetto visibile o invisibile per ciascuna; hard stop; poi rimozione della regola globale e migrazione contestuale dei call site legittimi a `ui/Checkbox`. Non si puo' fare a meta': togliere il nascondimento senza migrare fa riapparire checkbox native non stilizzate.
2. **`chore` di rimozione del codice morto** (DS-3), che riduce di un terzo tutto cio' che viene dopo.
3. **Emendamenti a `CLAUDE.md`**: §7.1 sul colore acceso, §7.2 sul conteggio dei residui `--accent` (dichiara uno, ne esistono trentuno in sette file), regola anti drift, riferimento alla vetrina.
4. **Segmented piu' vetrina**, insieme: la primitiva nuova e il posto dove la si guarda.
5. **P2 booleani**, ora che la regola globale non li nasconde piu' e il canone di colore e' deciso.
6. **P3 select**, **P4 disclosure**, **P5 header**, **P6 spacing** poi tipografia poi colore.

I punti 1, 2 e 3 non sono design system: sono le condizioni perche' il design system attecchisca. Saltarli significa costruire sopra un pavimento che si muove.

## Emendamenti a CLAUDE.md, in dettaglio

- **§7.1, colore acceso**: da «Active `#334155` (slate, not cyan)» a cyan `#0ea5e9` sul track del toggle acceso, con la regola generale che il cyan segna lo stato attivo e lo slate resta il colore strutturale di testo, bordi e focus.
- **§7.1, spacing**: la scala dichiarata («Grid: 8px base, padding 8/12/16/24») non corrisponde alla base 4px di nessuna delle implementazioni. Va allineata a `--space-*`.
- **§7.2, residui legacy**: «1 residual `var(--accent)`» va corretto in trentuno occorrenze su sette file, con l'elenco.
- **Regola anti drift, nuova**: prima di introdurre un controllo di form, un bottone, una sezione collassabile o un valore di spacing, verificare la vetrina e riusare; se serve una primitiva nuova, fermarsi e chiedere; nessun colore o misura scritti in cifre dove esiste un token.

## Cosa resta aperto

- **Destino delle tre feature non cablate** (export immagine, export e import, provider selector): cablare o ritirare.
- **Le tre chiavi di localStorage sul tree view** (`jjodel_tree_view_open`, `jjodel_treeview_visible`, `jjodel_property_tree_view_width`), scritte da tre file diversi: non verificato se convergano.
- **Nessun test copre le primitive**: zero storie, nessuna suite di rendering sotto `ui/`. Una migrazione trasversale non ha rete, e la rete oggi e' la verifica visiva di Alfonso a ogni commit. Vale la pena valutare se la vetrina possa diventare anche il posto dove si guardano le regressioni.
- **La struttura a quattro sezioni della property card** resta proposta, non ratificata.

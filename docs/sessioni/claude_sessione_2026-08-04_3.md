# Sessione 2026-08-04 (3) — Partizione dei tab IR: dalla mappa dei parametri alle ratifiche

## Stato a fine sessione

La sessione è partita da una domanda di inventario (quali parametri vanno definiti nel tab IR, per ogni tipologia) ed è arrivata a una **ratifica completa della partizione dei tab** per le view IR-authored. L'arco è chiuso: inventario, proposta, discovery eseguita da Claude Code, riconciliazione, ratifiche R-1..R-6.

La barra per una view IR-authored è **`Applies to · Structure · Appearance · Text · Source`** e **sostituisce** la barra di `ViewData`, non si annida. La ratifica a tre tab del 2026-08-03 (`Applies to · Shape · Content`) è superata.

Nessuna implementazione. Nessun commit prodotto in questa chat; l'unico commit citato, `79a0d90c2`, è il report della discovery tab map eseguita da Claude Code e non contiene nulla della proposta.

## Decisioni prese

Tutte in `claude/ratifiche_2026-08-04_tab_partizione.md`, qui in sintesi.

- **R-1, pin di identità della metaclasse.** `metaclasses` resta una lista di nomi, semantica del resolver invariata; un campo **additivo e opzionale** porta i pointer risolti, scritto dal pannello e letto solo dal livello di authoring. `Applicable to` si rimuove come controllo. Sequenza obbligata: il pin si scrive **prima** della rimozione, in un commit separato. Unico punto della partizione con costo funzionale se sbagliato.
- **R-2, Style e `cssIsGlobal`.** Nessuna migration sui progetti salvati; tab rimosso; campo persistito che round-trippa; il conflitto diventa ispezionabile in Source. Riformulazione che ha cambiato la decisione: non è un bug, è un **canale di theming non dichiarato**, perché l'IR consuma di proposito i token del design system. Corollario agli atti: il namespacing delle custom property **non funziona**, perché immunità e tematizzabilità sono la stessa proprietà vista da due lati.
- **R-3, disclosure.** I tab non si gatano, tranne Source (Advanced-only). `advanced` sopravvive solo come gate sui rami `Conditional`. Unifica tre politiche oggi divergenti: Row ed Edge non leggono `advanced` affatto, e in Basic il matching di una vertex view è irraggiungibile.
- **R-4, lingua.** Nomi dei tab in inglese. Le classi SCSS `.view-editor-tab*` non si rinominano. Le stringhe italiane dentro i pannelli si traducono in una pass separata, mai nello stesso commit della struttura.
- **R-5, cinque tab superano tre.** Il 3 è caduto sul **test degli orfani**: i capi dell'edge e il selettore di natura non sono aspetto e non sono contenuto, sono topologia. Mappa: `Shape` → Structure più Appearance; `Content` → Text; più Source nuovo. Per la row, Structure e Appearance sono **nascosti**, non disabilitati.
- **R-6, minori.** Si cancella il ramo irraggiungibile `ViewData.tsx:95-101`; il gate `view.isEdge !== true` resta. `graphVertex` in `showIRTab` **non** entra da solo: senza la sezione containment aprirebbe un tab che non sa autorare niente, e il lavoro è sottrattivo.

Invarianti implementative messe agli atti: un solo draft e un solo debounce a livello di pannello; smontare un tab non resetta nulla; la validazione vive nel pannello e i tab la riflettono; `validateIR` resta l'unico gate del commit.

## Bug risolti

Nessuno. Sessione di analisi e decisione.

## Bug nuovi / Todo

- **[MEDIA, indipendente]** I due Select "Viewpoint" e "Parent view" scrivono **lo stesso campo** `father` senza setter custom (`InfoData.tsx:306,323`; `Input.tsx` cade su `data[field] = …`). Il primo maschera la differenza in lettura con `getter={() => vpid}`. In scrittura scegliere un viewpoint riparenta la view sotto la radice e **perde il parent view precedente**, senza dichiararlo (`set_father`, `view.tsx:1456`, con `SetFieldAction('subViews', …, '-=')` sul vecchio parent). Replicato in `ViewProperties.tsx:121-133`. Da correggere fuori dal lavoro sui tab.
- **[micro-slice]** Rilevamento del conflitto `cssIsGlobal` all'attivazione del viewpoint, con warning quando una view del viewpoint attivo ombreggia un token consumato dall'IR. Source copre la view che stai guardando, non quella che ti sta ridipingendo il canvas.
- **[slice successiva]** `graphVertex`: sezione containment in Structure più la riga in `showIRTab`. Oggi si crea solo da console, quindi il rinvio costa zero.
- **[igiene]** `claude/mappa_sintassi_concreta.md` è **stale**: dichiara ancora la rehydration del viewpoint selector come blocco singolo più costoso del progetto, chiusa come non riproducibile il 2026-08-04.

## Documenti prodotti

Tutti nel knowledge base:

- `claude/mappa_parametri_tab_ir.md` — inventario dei parametri per vertex, row, reference-as-edge, object-as-edge, ricavato dai sorgenti a HEAD. Distingue tre livelli di obbligo: **S** schema, **V** validazione, **F** funzionale silenzioso.
- `claude/proposta_2026-08-04_tab_ir_partizione.md` — proposta di partizione, poi emendata con viewpoint e parent view. Superata nei punti aperti dalle ratifiche, resta valida come materiale.
- `claude/2026-08-04_prompt_discovery_tab_map_v2.md` — prompt Claude Code, discovery read-only.
- `claude/2026-08-04_proposta_ratifiche_tab_partizione.md` — posizioni argomentate sui cinque punti.
- `claude/ratifiche_2026-08-04_tab_partizione.md` — **il documento di riferimento** per l'implementazione.

## Prompt generati per Claude Code

- `2026-08-04_prompt_discovery_tab_map_v2.md` — ✅ la discovery è stata eseguita, report committato in `79a0d90c2`. Sostituiva `2026-07-24_prompt_discovery_tab_map_ir_authored.md`, che era di epoca solo-vertex e non è più valido.

## Prompt pendenti

- **Discovery sul sollevamento dello stato UI** dai sotto-editor al pannello: da scrivere. È l'unico punto in cui la partizione tocca codice già verificato, cioè i rami E-ref ed E-obj.
- Restano invariati i pendenti delle sessioni precedenti non toccati qui (discovery undo dei valori di modello, micro-slice `isUsableEndpointExpr`, scaffold object-as-edge F2, risalita al parent F3).

## Prossimi passi

1. **Verifica a runtime su `cssIsGlobal = true`** (Q1 del report della tab map): un minuto, decide se la micro-slice di rilevamento sale di priorità.
2. **Prompt della discovery sul sollevamento dello stato UI**, poi esecuzione e hard stop.
3. **Implementazione della partizione**, in commit separati e in quest'ordine: pin di identità → rimozione di `Applicable to` → partizione della barra → rimozione dei tab morti. La verifica visiva non deve dover distinguere una regressione della barra da una regressione di ciò che la barra non mostra più.
4. Aprire i todo di cui sopra (bug `father`, micro-slice CSS, graphVertex, allineamento della mappa di copertura).

## Info strutturali scoperte

Verificate sui sorgenti a HEAD del branch `alfonso-frontend-jjtl`, e in parte confermate dalla discovery di Claude Code.

**Resolver IR e applicabilità**
- `irResolveCore.ts:99-113` scarta ogni view con `d.viewpoint !== state.viewpoint`. Il campo D `DViewElement.viewpoint` (`view.tsx:239`, denormalizzato) è **l'unico parametro fuori dall'IR** che decide l'ingresso nell'indice: sta sopra `metaclasses`, `predicate` e `priority`.
- `father`, `subViews`, `fatherChain`, `allSubViews`: **zero occorrenze** in `editor-v2/viewpoint/`. Nel classic il peso di `subViews` è un moltiplicatore di score (`selectors.ts:422,434`).
- `getAppliedViewsNew` (`selectors.ts:609`) **non ha chiamanti** in `frontend/src`. Apply-to non è letto per nessuna view. Il codice che ammette tre viewpoint (attivo, Default, decorativi, `:552-559`) vive dentro quella funzione morta: non è un delta vivo.
- `appliableToClasses` **è vivo** come pin di identità: `VertexAuthoringPanel.tsx:118-123` lo rilegge a ogni memo per pinnare per identità la metaclasse target del PathBuilder. `ir.metaclasses` sono nomi, `appliableToClasses` sono pointer.

**Tab classici, verdetto della discovery**
- `template`: non letto per nessuna view (`GraphElementComponent` rimosso in `graphComponentRegistry.ts:4`, `classicSlot` mai passato, `ClassNode.tsx:424` legge `data.jsxString` che nessuno popola).
- `events`: non letto (già R-1).
- `options`: nessun campo letto (`nodeSizing.ts:2-5` flag non cablati, griglia hardcoded a 24px, Snap `readOnly` fisso).
- `style`: dipende da `cssIsGlobal`. Locale (default, `classes.ts:1175`) emette `.{viewId}`, classe inesistente nel DOM v2, quindi inerte. Globale emette `body` e le palette diventano custom property globali che ridipingono `.ir-node-content` per cascata (`irStyle.ts:44`).
- `isEdge`: morto come dato, vivo come gate in `showIRTab` (`ViewData.tsx:61`).
- `showIRTab` non elenca `graphVertex`, benché `irResolveCore.ts:167` lo compili. Il ramo "authoring non ancora disponibile" (`ViewData.tsx:95-101`) è irraggiungibile.

**Schema e validazione**
- `validateIR` è un wrapper di tre righe sulla compilazione vera. L'unico throw strutturale esplicito è `[ir] row view requires a non-empty template`. `metaclasses` non è controllato per nessuna tipologia.
- `isObjectAsEdge = !!(sourceExpr && targetExpr)` (`irCompile.ts:391`): la natura dell'edge non è un campo. Una object-as-edge con `metaclasses: '*'` o `[]` passa la validazione e non finisce in nessun bucket, senza warning.
- Divergenze pannello contro compile: `separator` mostrato false quando assente ma con default reale **true** (`separator !== false`); seed row di `EnableIRPanel` con `metaclasses: []` contro `defaultRowViewIR()` con `'*'`.

## Cronologia

Apertura sull'inventario dei parametri del tab IR per tutte le tipologie. Lettura dei sorgenti a HEAD invece che ricostruzione dalle spec, scelta che ha pagato: spec e codice divergono in più punti, e `validateIR` valida molto meno di quanto il nome prometta.

Dalla domanda successiva, se i parametri si partizionino in sottoinsiemi, nasce la proposta a cinque tab, costruita sulle quattro domande dell'autore invece che sulla struttura del JSON IR. La verifica sul viewpoint e sul parent view fa emergere che il resolver IR filtra su un unico campo e ignora la gerarchia di view, e fa emergere per caso il bug dei due Select su `father`.

La discovery tab map viene eseguita da Claude Code e committata. La riconciliazione conferma le quattro affermazioni non verificate della proposta, chiude il bivio a favore della sostituzione, e produce tre correzioni: `appliableToClasses` vivo e non seed (errore mio, generalizzato da un commento senza guardare il memo), Style che dipende da un toggle, `isEdge` morto come dato e vivo come gate.

Chiusura con le posizioni sui cinque punti aperti e la ratifica di Alfonso su R-1 e R-2, gli unici due contesi. Gli altri erano allineamenti, non decisioni.

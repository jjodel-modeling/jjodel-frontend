# Tech Debt — jjodel

Registro dei debiti tecnici noti. Ogni entry deve indicare: data, origine, stato attuale, fix strutturale raccomandato, effort stimato, riferimenti.

---

## Dual undo-system (editor-v2 RF history vs Redux state-delta)

**Registrato:** 2026-04-23
**Origine:** fix interim bug "undo/attr_0" tramite disabilitazione rename branch in `reconcileJjomAfterUndoRedo` (`frontend/src/components/editor-v2/sync/canvasToJjom.ts`).
**Stato attuale:** Opzione 4 applicata. Rename branch per `DAttribute` disabilitato (codice commentato, non rimosso). Ctrl+Z non revoca più rename inline di attributi (regressione minore accettata). Info-panel rename non viene più corrotto da undo successivi.
**Fix strutturale raccomandato:** Opzione 3 del report — estendere `useHistory` per catturare uno snapshot Redux ID-keyed (subset di `idlookup`) assieme al RF snapshot, applicare restore atomico di entrambi al undo/redo, rimuovere `reconcileJjomAfterUndoRedo` del tutto. Alternative in ordine di completezza:
- Opzione 1 (interim più chirurgico): integrare `editorContext?.takeSnapshot()` dentro `Info.tsx` quando è aperto su un nodo editor-v2, mantenendo l'architettura attuale.
- Opzione 2: sostituire `useHistory` con `UndoAction.new` / `RedoAction.new` di Redux come single source of truth. Rischio regressioni perché Redux cattura anche transient view state.
**Effort stimato:** 2-3 giorni per Opzione 3 (prompt dedicato futuro).
**Riferimenti:**
- `docs/reports/2026-04-23-undo-attr-zero-analysis.md`
- `docs/reports/2026-04-23-attribute-coevolution-analysis.md`
- Commit di disabilitazione branch: [da inserire dopo commit]

---

## Unificazione delle palette entity pannello/tree

**Registrato:** 2026-08-10
**Origine:** passo 3 dell'arco rail destro (R-RAIL-25). Il consumo dei token `--color-entity-*` nel badge del pannello proprietà è stato tentato e fermato al confronto dei valori.
**Stato attuale:** il pannello colora i badge da `frontend/src/styles/components/_form-system.scss:1251-1259` (nove modificatori `.jj-type-badge--*`, esadecimali inline), il tree da `frontend/src/common/entityMeta.ts`, ora tokenizzato in `--color-entity-*` dal commit `4d215ff0e`. In light **nessuno dei quattro kind di C9.1 coincide** e **attribute ed enum sono invertiti**: l'ambra che nel pannello significa «attributo» è il token di `enum`, lo smeraldo che significa «enum» è il token di `attribute`. Le altre due divergono di famiglia (reference rosa vs ciano, operation violetto vs indaco).
**Fix strutturale raccomandato:** è una **decisione di design**, non una migrazione di sorgente: va scelta quale delle due palette è quella giusta per l'app, e poi allineata l'altra. Il raggio d'azione è l'app e non il rail — `_form-system.scss` è importato globalmente da `styles/style.scss:2` e `.jj-type-badge` è vivo anche in `frontend/src/components/editors/views/ViewData.tsx:221` — quindi non è un intervento che possa entrare di straforo in un arco di redesign di un pannello.
**Priorità:** media.
**Effort stimato:** mezza giornata per l'allineamento meccanico una volta presa la decisione; la decisione è la parte cara.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-25, R-RAIL-9 (annotazione), R-RAIL-26
- `docs/discovery/discovery_2026-08-10_rail_fase0.md` — nota sulle tre palette entity

---

## Portata parziale del restyle del tree pane

**Registrato:** 2026-08-11
**Origine:** passo 4 dell'arco rail destro (R-RAIL-7). I quattro valori di restyle sono stati applicati a `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (commit `df8850653`), e il perimetro di selettori fissato dalla ratifica lascia fuori una parte delle righe del tree.
**Stato attuale:** «nome 13px peso 500» e «peso 600 sul selezionato» agiscono su `.tree-row__name`, cioè le righe di nodo (`TreeViewContent.tsx:654`) e le rule e gli helper JjTL (`:1470`, `:1479`). Le righe di istanza e di feature usano un'altra classe, `.tree-feature__name` (`tree-view-sidebar.scss:1899`), e restano a **11px** senza peso dichiarato; il peso 600 non le raggiunge nemmeno per via della selezione, perché marcano lo stato selezionato con `tree-row__content--selected` (`TreeViewContent.tsx:718`) e non con `tree-row--selected`. Il suffisso di tipo invece le raggiunge, perché `.tree-feature__type` è in perimetro e rende in mono su istanze e feature. Ne risulta, sulle righe di feature, un nome a 11px accanto a fratelli a 13px.
**Fix strutturale raccomandato:** è una **decisione di design**, non una svista di implementazione: R-RAIL-7 elencava quattro valori su quattro selettori e sono stati applicati esattamente quelli. Va deciso nell'arco 2 se uniformare `.tree-feature__name` a `.tree-row__name` — allineando anche la classe di selezione, che è la parte non banale — oppure se la differenza fra righe di struttura e righe di istanza è voluta, e in quel caso documentarla.
**Priorità:** bassa — disomogeneità visiva, non difetto funzionale.
**Effort stimato:** un'ora per allineare i due valori tipografici; la parte cara è la selezione, che passerebbe da `tree-row__content--selected` a `tree-row--selected` e tocca il markup di `TreeViewContent`, oggi fuori scope.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-7, R-RAIL-15
- `docs/claude-code-log.md` — entry del 2026-08-11, nota (14)
- `docs/discovery/discovery_2026-08-11_rimando_blocco_altezze.md`

---

## Validità degli `@import` di Google Fonts in `_typography.scss`

**Registrato:** 2026-08-11
**Origine:** verifica della nota (15) dell'entry di log del 2026-08-11, che dava IBM Plex Mono per non caricato. L'affermazione è falsa — l'import c'è — ma la verifica ha fatto emergere una questione di validità che nessuno aveva posto.
**Stato attuale:** `frontend/src/styles/tokens/_typography.scss` carica i due font applicativi con `@import url(...)` da Google Fonts: Inter a `:81`, IBM Plex Mono a `:84`. Entrambi seguono **cinque** blocchi `:root { }` dello stesso file (`:11`, `:27`, `:41`, `:54`, `:64`). Per specifica CSS un `@import` che compare dopo una regola di stile è invalido e viene scartato dal parser: i due sopravvivono solo se il bundler li risale in testa alla CSS emessa. Non è decidibile leggendo il sorgente. Nota accessoria: il commento di sezione a `:72` dice «Load Inter and JetBrains Mono», ma l'import è di IBM Plex Mono; JetBrains Mono arriva da `frontend/index.html:11`, per gli editor Monaco.
**Fix strutturale raccomandato:** prima si misura, poi si decide. Verifica: DevTools, tab Network, filtro `fonts.googleapis`, hard refresh su `localhost:3001`. Due richieste: i font si caricano, la voce si chiude senza debito e resta solo il commento da correggere. Zero richieste: non si carica nemmeno Inter, quindi il difetto è di tipografia globale e non del solo suffisso mono, la voce va promossa da backlog a bug, e il fix è spostare i due `@import` in testa al file oppure in `index.html` accanto a JetBrains Mono, dove la validità non dipende dal bundler.
**Priorità:** media in attesa della misura; alta se la misura dà zero richieste.
**Effort stimato:** cinque minuti la verifica; mezz'ora lo spostamento, se serve.
**Riferimenti:**
- `frontend/src/styles/tokens/_typography.scss:70-84`
- `docs/claude-code-log.md` — entry del 2026-08-11, nota (15), e la sua correzione nell'entry del passo 6
- `docs/decisions.md` — R-RAIL-5, clausola C5.3

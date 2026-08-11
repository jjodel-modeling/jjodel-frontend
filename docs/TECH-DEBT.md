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

---

## I campi di colore di `entityMeta.ts` sono codice morto

**Registrato:** 2026-08-11
**Origine:** passo 3 dell'arco 2 del rail destro. Il commit D del passo 2 — che doveva far consumare `entityMeta.ts` ai token — è stato saltato proprio per questa misura: non c'è niente da far consumare, perché nessuno legge quei campi.
**Stato attuale:** `frontend/src/common/entityMeta.ts` espone `ENTITY_META` (interfaccia `EntityMeta`, `:35-47`) con cinque campi di colore per kind — `color`, `badgeBg`, `badgeText`, `badgeBgDark`, `badgeTextDark` — e tre helper, `entityColor`, `entityIcon`, `entityIsAbstract`. Misurato l'11 agosto con `command grep -rn` su `frontend/src`: **zero** consumatori di `ENTITY_META` fuori dal file, **zero** chiamanti dei tre helper. L'unico importatore vivo è `frontend/src/components/common/ElementBadge.tsx:9`, che prende soltanto `resolveEntityType` e `entityLetter` — cioè la parte semantica, non quella cromatica. Il `badgeBg` letto in `frontend/src/pages/components/Navbar.tsx:290` è il campo omonimo di `constants/documentTypes.ts`, un oggetto diverso, già tokenizzato. Restano riferimenti a `entityMeta` in commenti: `_colors-light.scss:329-330`, `_colors-dark.scss:235`, `documentTypes.ts:44`.
**Fix strutturale raccomandato:** cancellare i cinque campi di colore dall'interfaccia e dalle diciotto voci di `ENTITY_META`, e i tre helper senza chiamanti, tenendo `EntityType`, `resolveEntityType` ed `entityLetter`. Prima però va sciolto l'equivoco dei commenti nei due file di token, che dichiarano di ricopiare `entityMeta` verbatim: dopo la rigenerazione OKLCH della scala (R-RAIL-30) non è più vero, e i commenti vanno riscritti nello stesso passo, altrimenti la cancellazione fa sparire l'unico posto dove quei valori sono ancora leggibili.
**Priorità:** media — non è un difetto visibile, è una sorgente di verità apparente che invita a modifiche inerti.
**Effort stimato:** un'ora, più la riscrittura dei tre commenti.
**Riferimenti:**
- `frontend/src/common/entityMeta.ts:35-47`, `:60`
- `frontend/src/components/common/ElementBadge.tsx:9`
- `docs/decisions.md` — R-RAIL-30

---

## Il teal duplicato per copia indipendente in dodici file

**Registrato:** 2026-08-11
**Origine:** passo 3 dell'arco 2. Cercando i consumatori della scala entity sono emerse due coppie teal ripetute a mano, che nessuno consuma da `entityMeta.ts` né dai token.
**Stato attuale:** misurato l'11 agosto, **dopo** i commit `70409831e` e `0f1197a7e`. Le due coppie sono `#CCFBF1 / #0D9488` (Teal-100 / Teal-600) e `#E1F5EE / #0F6E56`. Compaiono come coppia bg/fg adiacente in sei file vivi — `components/abstract/tabs/tab-title.scss:83-84`, `components/common/element-badge.scss:85-86` e `:98-99` (entrambe le coppie), `pages/components/navbar.scss:1819-1820`, `components/editor-v2/_color-schemes.scss:176` e `:185` (come `--enum-header-bg` / `--enum-accent`, minuscolo), `components/megamodel/MegamodelView.scss:261-262`, `components/project/project-editor.scss:695-696` e `:795` — più `common/entityMeta.ts:84-85` e `:187-188`, che è morto (voce precedente). Occorrenze singole, non in coppia: `components/abstract/tabs/EditorSwitch.scss:52`, `components/editor-v2/EditorV2.scss:481`, `components/editors/views/nestedView.scss:2942`, `pages/components/navbar.scss:1774`, `components/Jodie/ActionSuggestion.css:87`, `constants/avatarConfig.ts:14`. Dodici file in tutto. **Correzione a quanto scritto nel prompt del passo:** i due fogli del rail non sono più fra questi — `tree-view-sidebar.scss` e `properties-with-tree-view.scss` consumano i token da questo passo, e il `#0D9488` che stava in `properties-with-tree-view.scss:925` non c'è più; in compenso `_color-schemes.scss` e `EditorSwitch.scss` non erano nell'elenco e ci sono.
**Fix strutturale raccomandato:** non è una migrazione meccanica, perché i dodici usi non significano tutti la stessa cosa: `element-badge` e `tab-title` sono badge di entità e vanno ai token entity; `_color-schemes.scss` colora l'header degli enum sul canvas ed è un'altra scala; `avatarConfig.ts` è una tavolozza di avatar e non c'entra. Prima si classifica uso per uso, poi si tokenizza solo ciò che è colore di entità.
**Priorità:** media.
**Effort stimato:** mezza giornata, di cui la classificazione è la parte cara.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-30
- `docs/claude-code-log.md` — entry del 2026-08-11, passo 3 dell'arco 2

---

## Commento fuorviante a `documentTypes.ts:44`

**Registrato:** 2026-08-11
**Origine:** passo 3 dell'arco 2, verifica dei consumatori della scala.
**Stato attuale:** `frontend/src/constants/documentTypes.ts:44` dice «Pink from common/entityMeta.ts viewpoint entry (badgeBg: #FCE7F3, badgeText: #DB2777)». I due valori corrispondono ancora alla voce `viewpoint` di `entityMeta.ts:93-94`, ma la voce `viewpoint` di `documentTypes.ts` consuma i token da `:55-56` e non quei letterali, `entityMeta` è morto (prima voce di questo registro), e nella scala rigenerata il viewpoint non è più rosa: è un alias della famiglia contenitori, cioè slate. Il commento indica quindi una sorgente che non è consultata e un colore che non è quello reso. Stessa specie del commento a `_typography.scss:72`, di cui alla voce sugli `@import`.
**Fix strutturale raccomandato:** cancellare la prima riga del commento. Le righe successive (`:45-50`) sono la nota TODO sul wiring di `onCreate`, che è viva e va tenuta.
**Priorità:** bassa.
**Effort stimato:** due minuti, da accodare al primo passo che tocchi il file.
**Riferimenti:**
- `frontend/src/constants/documentTypes.ts:44-56`
- `frontend/src/common/entityMeta.ts:93-94`

---

## Il colore non distingue più i cinque tipi nel menu «New document»

**Registrato:** 2026-08-11
**Origine:** passo 3 dell'arco 2. È la superficie che ha fatto nascere R-RAIL-32: i cinque tipi di documento vi compaiono come fratelli simultanei, e la regola di famiglia dei contenitori non l'aveva prevista.
**Stato attuale:** `frontend/src/constants/documentTypes.ts:14-69` definisce cinque tipi — metamodel, model, transformation, viewpoint, refactoring — e tutti e cinque sono alias della famiglia contenitori nella scala rigenerata, quindi condividono una coppia sola: in light `#E2EAF5 / #45566F`, in dark `#242E3D / #BBCEE8`. `Navbar.tsx:290` rende il badge con `background: entry.badgeBg` e `color: entry.badgeColor`, cioè cinque pastiglie identiche. **Precisazione rispetto a come la voce era stata formulata:** i cinque tipi restano distinguibili, perché il badge porta la lettera (`M`, `m`, `T`, `V`, `R`, da `:20/29/38/54/63`) e accanto ci sono etichetta e descrizione (`Navbar.tsx:292-298`). Ciò che si è perso è il colore come canale di tipo, non la leggibilità del menu. Seconda superficie con lo stesso effetto, trovata nello stesso passo: le icone del tree, dove metamodel, package e model-M1 collassano sulla stessa coppia e restano separate dalla sola lettera (`M`, `P`, `m` corsivo).
**Fix strutturale raccomandato:** decidere se il colore deve tornare a portare il tipo su queste due superfici. Se sì, il canale è **un'icona per tipo, non la tinta**: la sfumatura dentro la famiglia è già stata misurata e scartata, cinque gradini di chiarezza sulla tinta 257 distano 0.016 in OKLab, sotto il percepibile a distanza. Se no, la voce si chiude documentando che nei contenitori il tipo è portato da lettera ed etichetta.
**Priorità:** media — è una decisione di design aperta, non un difetto.
**Effort stimato:** la decisione; poi mezza giornata se si va sulle icone per tipo.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-30, R-RAIL-32
- `frontend/src/constants/documentTypes.ts:14-69`
- `frontend/src/pages/components/Navbar.tsx:288-298`

---

## I selettori entity dei glifi nel tree non producono colore a video

**Registrato:** 2026-08-11
**Origine:** passo 3 dell'arco 2. I commit `70409831e` e `0f1197a7e` hanno portato gli undici kind a `-fg` con fondo trasparente; la verifica visiva dell'11 agosto ha mostrato che nel tree i glifi restano monocromi.
**Stato attuale:** il CSS dichiara un colore per tipo che a video non si vede. Causa **non accertata** — questa voce non la diagnostica, la registra: possibile mancata ereditarietà di `color` sul glifo, specificità superiore altrove, oppure selettore che non colpisce la superficie viva. Con R-RAIL-33 l'esito a video è quello **voluto**, quindi non c'è difetto da riparare; il problema è che il foglio dichiara un'intenzione che non realizza, e chiunque legga quei selettori in futuro li «correggerà», riportando il colore nel tree contro R-RAIL-33.
**Fix strutturale raccomandato:** **rimuovere i selettori, non farli funzionare.** I tre blocchi sono `tree-view-sidebar.scss:649-709` (light) e `:1054-1064` (dark), più `properties-with-tree-view.scss:919-931` (la copia viva). La rimozione va fatta misurando la resa prima e dopo, non leggendo il CSS: se un glifo prendesse colore da uno di quei blocchi, togliendolo lo perderebbe, e la verifica a video è l'unica che lo dice. Vanno tenuti fuori dalla rimozione le righe viewpoint e view-leaf (`:1481-1498`), che sono a pastiglia per progetto e consumano i token da prima dell'arco.
**Priorità:** media — nessun effetto visibile, ma è una trappola per il passo successivo.
**Effort stimato:** un'ora, di cui la maggior parte è la verifica a video prima e dopo.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-33, R-RAIL-28 e il suo emendamento
- `docs/claude-code-log.md` — entry del 2026-08-11, passo 3 dell'arco 2, e questa chiusura

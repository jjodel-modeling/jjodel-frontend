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
**Stato attuale:** **chiusa il 2026-08-12, misurata.** I font si caricano su entrambi i percorsi. In produzione i due `@import` sono le prime cose in `frontend/dist/assets/index-*.css`, subito dopo `@charset "UTF-8"` e prima di qualunque regola. In sviluppo, misurato su un progetto vite minimo che importa quel solo partial, lo `<style>` iniettato espone due `CSSImportRule` come prime due regole e le due richieste a `fonts.googleapis.com` partono. Il rialzo è della compilazione Sass, non del bundler, quindi vale su entrambi i percorsi. Controprova sulla stessa macchina: uno `<style>` in cui l'`@import` segue una regola di stile perde l'import dal CSSOM e non emette richieste, quindi la misura sa distinguere i due esiti.
**Fix strutturale raccomandato:** nessuno sul caricamento. Resta il commento a `frontend/src/styles/tokens/_typography.scss:72`, che dice «Load Inter and JetBrains Mono» mentre l'import a `:84` è di IBM Plex Mono; JetBrains Mono arriva da `frontend/index.html:11` per Monaco. Correzione già prevista nel passo 6.
**Priorità:** chiusa.
**Effort stimato:** cinque minuti la verifica; mezz'ora lo spostamento, se serve.
**Riferimenti:**
- `frontend/src/styles/tokens/_typography.scss:70-84`
- `docs/discovery/discovery_2026-08-12_harness_visivo_e_scala_entity_nel_tree.md` §6.2
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

## I selettori entity del tree colorano il contenitore, non il glifo

**Registrato:** 2026-08-11
**Origine:** passo 3 dell'arco 2. I commit `70409831e` e `0f1197a7e` hanno portato gli undici kind a `-fg` con fondo trasparente; la verifica visiva dell'11 agosto ha mostrato che nel tree i glifi restano monocromi.
**Stato attuale:** causa **accertata** il 2026-08-12. Il glifo è `<span class="tree-node__icon tree-DClass"><i class="bi bi-…"></i></span>`. I selettori entity mettono `color` sul `<span>`; a dipingere è l'`<i>`, che prende il colore da una regola globale, `frontend/src/styles/style.scss:790-791`, `i.bi { color: var(--font-color-1) }`, cioè `#0F172A`. Una dichiarazione diretta batte l'ereditarietà a qualunque specificità stia il genitore, quindi il colore entity non raggiunge mai il pixel. Misure: sul `<span>` `.tree-DClass` computa `rgb(122, 64, 86)`; sull'`<i>` dentro di esso, `rgb(15, 23, 42)`. Rimuovendo i tre blocchi e ricostruendo, il `<span>` passa a `rgb(14, 165, 233)` e la schermata resta **identica**: 153.258 pixel campionati, zero diversi, delta massimo 0. I tre blocchi sono `tree-view-sidebar.scss:634-694` (light: ogni kind dichiara `color` **più** `background-color`, non solo il colore), `:1038-1050` (dark) e `properties-with-tree-view.scss:999-1015` (copia del pannello, che vince per specificità (0,3,0) su entrambe le proprietà). Restano fuori le righe viewpoint e view-leaf, `tree-view-sidebar.scss:1466-1472` e `:1477-1483`, che sono pastiglie e colorano il **fondo** del `<span>`, quindi funzionano; è la stessa eccezione che l'emendamento (2) a R-RAIL-33 ha appena messo a registro.
**Fix strutturale raccomandato:** rimuovere i tre blocchi, in esecuzione di R-RAIL-33. La previsione «nessun effetto visibile» della formulazione precedente era **giusta**, ed è ora misurata: si può fare senza rischio visivo. Ordine: i tre blocchi insieme, in un commit solo. Rimuovere la sola copia del pannello lascerebbe vincere il blocco light del foglio del tree, che dichiara anche un `background-color`, e quello un pixel lo muove. Da non fare in questo giro: far arrivare il colore al glifo. Richiederebbe di disinnescare `i.bi` nel perimetro del rail, che è un cambio globale, e farebbe emergere la quarta palette della voce seguente.
**Priorità:** bassa — nessun effetto a video, è igiene del foglio in esecuzione di R-RAIL-33.
**Effort stimato:** un'ora, di cui la maggior parte è la verifica a video prima e dopo.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-33 e il suo emendamento (2), R-RAIL-28 e il suo emendamento, R-RAIL-36
- `docs/discovery/discovery_2026-08-12_harness_visivo_e_scala_entity_nel_tree.md` §4
- `docs/claude-code-log.md` — entry del 2026-08-11, passo 3 dell'arco 2, e questa chiusura

---

## La firma del guscio properties copre due kind su undici

**Registrato:** 2026-08-12
**Origine:** passo 4 dell'arco 2, D5. La decisione dichiarava la copertura parziale e chiedeva di aprire la voce contestualmente all'implementazione.
**Stato attuale:** `elementSignature` (`frontend/src/components/editors/Info.tsx:883-896`) rende un chip per tre dei kind che `getElementTypeInfo` (`:847-874`) riconosce: `DAttribute` e `DReference` con il suffisso di tipo `: EString [0..1]`, `DClass` col conteggio delle feature possedute. Gli altri **otto** — `DModel`, `DPackage`, `DEnumerator`, `DOperation`, `DParameter`, `DEnumLiteral`, `DObject`, `DValue` — ritornano stringa vuota e non rendono alcun chip, per scelta dichiarata: vuoto significa riga non renderizzata, mai un segnaposto. La riga 2 del guscio resta comunque montata quando c'è il breadcrumb, quindi la geometria non oscilla. `DObject` e `DValue` sono gli oggetti M1 e passano dal guscio come gli altri: l'esclusione di `useNewDesign` (`:1208`) riguarda il form sottostante, non l'header.
**Fix strutturale raccomandato:** decidere kind per kind quale sia la riga che il tree dà e il pannello non ripete, non inventare una firma per simmetria. Tre casi hanno una risposta già scritta altrove e sono i primi da fare: `DObject`, per cui il tree rende `: {metaclassName}` (`TreeViewContent.tsx:721`) e basterebbe estendere `common/featureSignature.ts` con quel secondo formatter; `DParameter`, che ha tipo e bound come le feature e riuserebbe `formatFeatureSignature` senza aggiungere nulla; `DEnumerator`, per cui il conteggio dei literal è l'analogo esatto del conteggio feature delle metaclassi. Restano senza risposta ovvia `DModel`, `DPackage`, `DOperation`, `DEnumLiteral`, `DValue`: per questi la voce si può chiudere anche dichiarando che non hanno firma.
**Priorità:** media — nessun difetto a video, ma la copertura parziale è una decisione a scadenza, non uno stato stabile.
**Effort stimato:** mezza giornata per i tre casi con risposta già scritta, più la decisione sugli altri cinque.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-7 (il suffisso di tipo del tree), R-RAIL-26
- `frontend/src/common/featureSignature.ts`
- `frontend/src/components/editors/Info.tsx:847-874`, `:881-895`
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:721`, `:766`

---

## `.jj-context-bar` dichiara un fondo che nessuno dei suoi consumatori vuole

**Registrato:** 2026-08-12
**Origine:** passo 4 dell'arco 2, D4. Lo hard stop A5 del prompt era scattato proprio su questo: la classe che porta il fondo è condivisa.
**Stato attuale:** `frontend/src/styles/components/_form-system.scss:1197-1206` porta `background: #f1f5f9` e `border-bottom: 1px solid #e2e8f0`; entrambi i consumatori li spengono, `viewParenting.scss:158-162` per il ramo view e `properties-with-tree-view.scss` per il guscio dopo questo passo. Quando tutti i consumatori spengono la stessa proprietà, la proprietà va tolta dalla base e non spenta due volte. Non risolta qui perché il foglio è globale, importato da `styles/style.scss:2` (R-RAIL-25). Conteggio aggiornato dopo il passo 4: le occorrenze di `jj-context-bar` sono **18** su cinque file, e i consumatori che montano il contenitore restano **due** — `Info.tsx:1329` e `ViewParentingFields.tsx:76`; le altre sedici sono definizioni di regola e sotto-elementi `__segment` / `__sep`, e **non sono state contate una per una**. Vanno contate prima di togliere qualcosa dalla base.
**Fix strutturale raccomandato:** censire le sedici occorrenze non-contenitore, verificare che nessuna dipenda dal fondo, poi togliere `background` e `border-bottom` dalla base e ritirare le due neutralizzazioni. La verifica è a video su entrambe le superfici, non sulla lettura del CSS.
**Priorità:** media.
**Effort stimato:** un'ora, quasi tutta di censimento e verifica visiva.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-25
- `frontend/src/styles/components/_form-system.scss:1197-1206`
- `frontend/src/components/viewParenting/viewParenting.scss:158-162`
- `frontend/src/components/editors/properties-with-tree-view.scss` — blocco dell'identity block

---

## `.props-header__icon` è senza consumatori

**Registrato:** 2026-08-12
**Origine:** passo 4 dell'arco 2, D1. Il markup dell'icona è uscito dal guscio, la regola CSS è rimasta.
**Stato attuale:** `frontend/src/components/editors/info-improvements.scss:880-890` definisce `.props-header__icon` (glifo a 20px, colore), più la variante dark a `:816`. L'unico consumatore era `Info.tsx`, riga rimossa dal commit `d729c9a2f`; l'header del view editor (`ViewData.tsx:212`) usa `.props-header` ma non quella classe. Non rimossa nello stesso passo perché R-RAIL-26 tiene `info-improvements.scss` fuori dall'arco e la regola 9 vieta di togliere il codice apparentemente morto senza mandato.
**Fix strutturale raccomandato:** **rimuoverla, non ricollegarla.** L'icona è stata tolta per decisione — il badge di tipo porta già kind, testo e colore, e nel guscio l'elemento è isolato — non per errore. Stessa specie della voce sui selettori entity dei glifi nel tree: CSS che dichiara un'intenzione senza consumatori, e che il passaggio successivo rischia di «riparare» riportando ciò che una ratifica aveva tolto.
**Priorità:** bassa.
**Effort stimato:** dieci minuti, da accodare al primo passo autorizzato a toccare `info-improvements.scss`.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-26 (il foglio fuori dall'arco), R-RAIL-16
- `frontend/src/components/editors/info-improvements.scss:816`, `:880-890`

---

## La sezione `NODE` non appartiene alla famiglia delle altre sezioni

**Registrato:** 2026-08-12
**Origine:** passo 4 dell'arco 2, coda. Osservazione a pannello intero, fuori dal perimetro del passo. **Voce di backlog, non di debito**: registrata qui perché il repo non ha un file di backlog separato, e questo è il registro più vicino.
**Stato attuale:** `GENERAL`, `INHERITANCE`, `FLAGS` e `ADVANCED STATE` condividono una forma sola; `NODE` no — grigio invece che nero, filo orizzontale che attraversa la riga, chevron a sinistra invece che a destra. La sezione vive nel guscio e non nell'inspector per ratifica esplicita (R-RAIL-12: spostarla cambierebbe *quando* compare, non solo dove), quindi la difformità è di resa, non di collocazione.
**Fix strutturale raccomandato:** decidere se `NODE` entra nella famiglia delle altre sezioni o se la differenza è voluta perché la sezione appartiene al guscio e non al form — e in quel caso documentarla. Da guardare prima che la difformità si consolidi.
**Priorità:** backlog — nessun difetto, una difformità visiva su una sezione gated su `advanced`.
**Effort stimato:** la decisione; poi un'ora scarsa se si allinea.
**Riferimenti:**
- `docs/decisions.md` — R-RAIL-12, R-RAIL-24
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — blocco `properties-node-section`

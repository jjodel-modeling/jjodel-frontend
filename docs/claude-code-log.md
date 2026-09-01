# Claude Code Session Log

Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.

## 2026-09-01 — fix(form): il lato destro della select torna al chevron (FL10)
**Prompt**: MICRO in chat, dal referto FL9 §8. La regola di densita' scrive
`padding-right: var(--ir-form-pad-x)` sulla select e sovrascrive i 36px di
`Select.module.css:55`; escludere il lato destro dalla densita' oppure `max()` fra i due,
dichiarando la via col computed style nei quattro preset. Verifica: testo lungo che non
finisce sotto il chevron, FL8/FL9 intatti.
**Files touched**: `editor-v2/viewpoint/ir/irFormStyle.scss` (una regola nuova),
`editor-v2/viewpoint/ir/__tests__/irFormControlPadding.test.ts` (blocco FL10, 6 casi, ora
15) e il referto `docs/discovery/discovery_2026-09-01_fl10_chevron_reserve.md`. Le sonde
`scripts/smoke/_tmp_fl10_*.ts` non sono committate: `.gitignore:66` ignora
`frontend/scripts/smoke/_tmp_*` per disegno.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (123 righe, exit 2 =
baseline invariata); `npm run build` exit **0**, solo il warning di chunk noto; suite
`viewpoint/ir/__tests__/` + `jjform/__tests__/` **759/759**. Unita' provata contro TRE
mutazioni (36 -> 32, regola rimossa, riserva estesa anche agli input): 2 / 5 / 5 rossi,
verde al ripristino in tutte e tre.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`, nessuna scrittura verso lo store: il delta e' una dichiarazione CSS.
**Smoke visivo**: passato — `_tmp_fl10_verify.ts` **10/10**, zero errori di pagina, quattro
preset in UN caricamento (before = la regola pre-FL10 rimessa a runtime). Geometria: il gap
fra content box e chevron da **-17 / -18 / -17 / -19** a **+9 ovunque**. Pixel: con
un'etichetta lunga l'inchiostro nella banda del chevron era salito a un centinaio, ora e'
**identico al caso corto** (40/52). FL8 intatto (zero <40px, zero overflow), FL9 intatto (il
content box verticale resta >= la riga). Con la regola tolta dal foglio la sonda va rossa su
ACCETTAZIONE 1 e 2.
**Notes**: le due vie del prompt misurate entrambe, e sono **equivalenti** (36px, gap +9 in
tutti e quattro): scelta la piu' corta, `max()` non compra nulla perche' a densita' 8/9/10 il
primo argomento non puo' vincere. Il 36 e' ripetuto ma non silenzioso: il test legge anche
`Select.module.css` e cade se i due numeri divergono. Bug della sonda corretto: le etichette
originali si rileggono a ogni giro, non si tengono in una globale.
**Prompt document name**: MICRO FL10 riserva del chevron (in chat) — 2026-09-01 15:05


## 2026-09-01 — fix(form): il testo delle select sta nel content box (FL9)
**Prompt**: MICRO in chat. Dallo screenshot il testo delle `<select>` delle form IR e'
tosato in basso; discovery minima obbligatoria (computed height, padding-block, line-height,
font-size del widget FL3 e da quale regola arrivano) prima del fix, con verifica su TUTTI e
quattro i preset e non solo su quello a schermo. Sospetto nominato: altezza ridotta dal
density theme con padding pensato per l'altezza piena.
**Files touched**: `editor-v2/viewpoint/ir/irFormStyle.scss` (una regola nuova, 21 righe
commento compreso), `editor-v2/viewpoint/ir/__tests__/irFormControlPadding.test.ts` (nuovo,
9 casi) e il referto `docs/discovery/discovery_2026-09-01_fl9_select_text_clip.md`. Le tre
sonde `scripts/smoke/_tmp_fl9_*.ts` non sono committate: `.gitignore:66` ignora
`frontend/scripts/smoke/_tmp_*` per disegno.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (123 righe, exit 2 =
baseline invariata, zero errori nuovi in `viewpoint/ir`); `npm run build` exit **0**, solo
il warning di chunk noto; suite `viewpoint/ir/__tests__/` + `jjform/__tests__/` **753/753**.
Unita' nuova provata contro TRE mutazioni (padding 3px, blocco spostato prima della regola
di densita', blocco rimosso): 1 rosso, 1 rosso, suite che non colleziona affatto; verde al
ripristino.
**Out-of-scope changes**: no — il perimetro dichiarato era il foglio del widget e il fix sta
li'. Il fix copre pero' anche gli `input` ad altezza fissa oltre alle `select`: stessa riga
di CSS, stessa altezza, stesso taglio, e ripararne una sola avrebbe lasciato l'altra tagliata.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`, nessuna scrittura verso lo store: il delta e' una dichiarazione CSS.
**Smoke visivo**: passato — `_tmp_fl9_verify.ts` **15/15**, zero errori di pagina, quattro
preset in UN solo caricamento (before = la regola committata, rimessa a runtime). Banda di
testo dipinta, misurata sui PIXEL dentro il padding box: Comfortable e Sectioned **10 -> 14**
su 14, Compact **10 -> 13** su 13, Dense 14 -> 14 (non tagliava). Geometria di celle, campi,
etichette, controlli e riga del messaggio IDENTICA before/after nei quattro preset, `formH`
compreso. FL8 intatto: zero controlli sotto i 40px, zero overflow. Con il blocco rimosso dal
foglio la sonda va rossa su ACCETTAZIONE 1.
**Notes**: il sospetto del prompt e' ESCLUSO dalla misura — Dense, il preset che indicava,
e' l'unico che non tagliava; a tagliare erano Comfortable e Sectioned, quelli col padding
piu' generoso. Causa vera: il padding di densita' dato a controlli ad altezza gia' fissa,
dove con `border-box` non e' spaziatura ma taglio. Il Range chiesto dal prompt non esiste su
una `<select>` chiusa (le `<option>` non sono renderizzate): misura sui pixel, referto §5.
**Prompt document name**: MICRO FL9 select tosate (in chat) — 2026-09-01 14:30


## 2026-09-01 — fix(manager): il pannello Columns si legge a colpo d'occhio (10k-dd)
**Prompt**: richiesta a schermo, senza documento — «puoi fare questo dropdown un po' piu' slick?»
con screenshot del pannello Columns aperto su `State`.
**Files touched**: `abstract/tabs/{InstanceManagerTab.tsx, instanceManagerTab.scss}`,
`__tests__/instanceManager10k.test.ts` (+8 casi) e `__tests__/instanceManager10i.test.ts` (2
asserzioni emendate), tutti in **51f9741b1**; questa entry a parte. Commit costruito con indice
privato (`GIT_INDEX_FILE`), albero verificato pulito prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` **2940 passati / 0 falliti**, suite `tabs/` **387/387**,
`npm run typecheck` **33** invariata, `npm run build` exit **0**. Gli otto casi nuovi provati con
SEI mutazioni (nascoste non smorzate, classe `--off` tolta dal TSX, testata sparita, nota tornata a
slate-300, raggio tornato letterale, hover tornato a `bg-tertiary`): 1/1/1/1/2/1 rossi, verde al
ripristino in tutte e sei.
**Out-of-scope changes**: no — le due asserzioni di 10i sono il seguito obbligato del delta (una
pinna il raggio che ho cambiato, l'altra si e' rotta per la lunghezza del JSX).
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero `TRANSACTION`.
**Smoke visivo**: passato — `_tmp_10kdd_measure.ts`, zero errori di pagina. Before: pannello
**190x252**, righe 24px, font 12px, checkbox 16px, `gap: 2px`, raggio 6px, ombra 2/6, nota a
**43px** dall'etichetta. After: 200x252, `gap: 0`, raggio 8px, ombra 4/12, etichette nascoste in
muted, testata «3 of 9 shown».
**Notes**: lo screenshot era un ritaglio INGRANDITO — le misure erano gia' quelle del DS, e il
difetto era la gerarchia: nove righe uguali, e per sapere quali colonne sono a schermo bisognava
leggere nove caselle. Un difetto mio trovato nell'after: avevo smorzato la nota a slate-300,
~1.6:1 su bianco. La finestra `slice(at, at + 2600)` di 10i e' la versione in positivo del
«divieto senza giurisdizione».
**Prompt document name**: (richiesta inline, senza documento) — 2026-09-01 14:31


## 2026-09-01 — fix(manager): il bordo sinistro torna sulla card della form (10k-ter)
**Prompt**: emendamento in chat, un punto solo: dallo screenshot la card della form non
mostra il lato sinistro. Il prompt nominava DUE sospetti alternativi — la banda di
`__form-head`, che con i margini negativi poteva coprire l'hairline, oppure un hairline a
0.5px arrotondato a zero dal renderer — e chiedeva esplicitamente di MISURARE prima di
scegliere (`getBoundingClientRect` di card vs banda), con verifica a sonda sui quattro
bordi dipinti.
**Files touched**: `abstract/tabs/instanceManagerTab.scss` (rimossa la riga
`&__main > .instance-manager__pane + .instance-manager__pane { border-left: 0 }`, piu' il
commento che ne registra il perche'), `__tests__/instanceManager10h.test.ts` (asserzione
ratificata rovesciata) e `__tests__/instanceManager10k.test.ts` (blocco nuovo «10k-ter»,
4 casi); questa entry a parte. La sonda `scripts/smoke/_tmp_10kter_border_verify.ts` non
e' committata: `.gitignore:66` ignora `frontend/scripts/smoke/_tmp_*` per disegno.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 00:20 (10h, prompt inline: la riga tolta e' di quella slice)
**Causa**: (c)
**Regressions**: no — `npm run typecheck` **33** su output COMPLETO (124 righe, exit 2 =
baseline invariata); `npm run build` exit **0**, solo il warning di chunk noto; suite
`abstract/tabs/__tests__/` **387/387** sull'albero fuso. Blocco nuovo provato contro
QUATTRO mutazioni (reset rimesso, lato sinistro con `--color-form-border-strong`, margini
della banda a -20, padding di `__form-inner` a 18): 2/2/2/1 rossi, verde al ripristino in
tutte e quattro.
**Out-of-scope changes**: no — ma un'asserzione RATIFICATA di 10h e' rovesciata: pinnava
il reset con la motivazione «senza, la form prenderebbe un bordo verticale che nella
colonna impilata non ha senso», vera finche' i pannelli non erano card (10e).
**Layer Impact Report**: not-required — nessun file di §3.1, nessun trigger di §3.2. Zero
creatori D, zero `TRANSACTION`, zero scritture: il delta e' una dichiarazione CSS tolta.
**Smoke visivo**: passato — `_tmp_10kter_border_verify.ts`, **before 10/4, after 14/0**,
rieseguita **14/0** sull'albero fuso, zero errori di pagina, stesso strumento su tutti i
giri. Misura a `deviceScaleFactor: 1` per disegno (caso peggiore per un hairline) e sui
PIXEL dello screenshot, decodificati a mano con `zlib` (nessuna dipendenza nuova). Bordo
sinistro: `0px none rgb(15, 23, 42)` -> `1px solid rgb(226, 232, 240)`; ΔL* dal desk
**1.82 -> 6.41**, cioe' da «solo il salto bianco-card / desk» a «il pixel del bordo c'e'»,
allineato agli altri tre lati. Banda: `left` da 754 (sul bordo) a 755 (dentro).
**Notes**: entrambi i sospetti del prompt ESCLUSI dalla misura — i margini negativi
valevano gia' esattamente il padding, e il bordo non era sub-pixel ma ASSENTE. Concorrenza:
il mio hunk sullo `.scss` e' stato spazzato dentro `3ab498458` (10k-chiusura, sessione
parallela sullo stesso file); nulla perso o duplicato, ma il mio commit `182d1bb19` porta
percio' i soli due file di test.
**Prompt document name**: emendamento bordo card form (in chat) — 2026-09-01 14:20

## 2026-09-01 — feat(toolbar): il picker delle sintassi diventa un listbox custom (NAV2)
**Prompt**: `docs/prompts/PROMPT_NAV2_picker_listbox.md`. Il `<select>` nativo diventa un
dropdown con icona per voce e selezione cyan; la logica di NAV1 (sentinella, routing,
convergenza sul tab) non si tocca; accessibilita' alla pari col nativo; il pannello non
dev'essere tosato; la `<option disabled>` diventa una hairline.
**Files touched**: `editor-v2/{Toolbar.tsx, EditorV2.scss, dataManagerOption.ts}` e
`editor-v2/__tests__/dataManagerPicker.test.ts`; a parte, fuori perimetro,
`scripts/benchmarks/bench_baseline.mjs` (vedi Out-of-scope). Referto e prompt in un commit
loro, questa entry per pathspec.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (baseline invariata,
zero errori nuovi in `editor-v2/`); `npm run build` exit **0**, solo il warning di chunk
noto; `npx vitest run` **2932 passati / 0 falliti**, i 9 file rossi in raccolta sono il
muro noto `window is not defined` (jjtl/jjscript/utils, nessuno in editor-v2). Suite
NAV1/NAV2 **39/39**, provata con SEI mutazioni (via `aria-activedescendant`; voce del
manager davanti ai viewpoint; hex del mock al posto dei token; `scroll` rimosso in bolla;
focus ring spento; type-ahead disattivato): una rossa ciascuna, controllo verde.
**Out-of-scope changes**: **yes, una, dichiarata**. `bench_baseline.mjs:199` e' l'UNICO
call site committato del picker (le altre 26 occorrenze sono sonde `_tmp_*` ignorate da
git) e pilotava il controllo con `selectOption` dietro una guardia `count() > 0`: senza
intervento sarebbe andata a zero **in silenzio**, saltando l'attivazione del viewpoint e
riportando `classic_toggle_found: 0` come se il toggle fosse sparito. Riparato in un
commit separato, per staccarlo in una riga se la decisione e' un'altra.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`, nessuna scrittura nuova verso lo store.
**Smoke visivo**: passato — `_tmp_nav2_verify.ts` **43/43**, zero errori di pagina, chiaro
e scuro. Le 22 asserzioni della sonda NAV1 ci sono tutte, rimappate (il referto §7 dice
quali cambiano di selettore e perche'); provata con una mutazione a quattro teste
(separatore a `role=option`, `aria-activedescendant` via, ArrowUp inerte, fondo della
selezione cambiato): 8 rosse, comprese tutte e quattro le mirate.
**Notes**: la board citata dal prompt non esiste nel repo (RC-10: dichiarato, proceduto
sulla prosa normativa). Rifiutati due token con la misura in mano: `--shadow-dropdown`
(alias di `--shadow-lg`, fra i nomi che `tokens.css` ridichiara, e senza variante scura) e
`--color-bg-elevated` (traslucido in scuro). Il precedente riusato NON e' il pannello
Columns ma `computeListStyle`, gia' condiviso da tre controlli. Referto:
`discovery_2026-09-01_nav2_picker_listbox.md`.
**Prompt document name**: PROMPT_NAV2_picker_listbox.md — 2026-09-01 13:55


## 2026-09-01 — fix(manager): il pannello Columns esce dalla clip della card (10k-chiusura)
**Prompt**: emendamento 10k-CHIUSURA. Il pannello Columns era tagliato dall'`overflow:
hidden` della card tabella. Ordine di preferenza dato dal prompt: (1) portale su
`document.body` posizionato dal rect del bottone, (2) `position: fixed` senza portale.
Divieto esplicito: NON togliere l'`overflow: hidden` dalla card (romperebbe i raccordi dei
raggi, asseriti da 10k). Piu' la domanda sulle caselle del pannello e la verifica per
sonda con `elementFromPoint` (trappola nota dei rect), z-index sopra la form card,
click-fuori ancora funzionante, non-regressione 10i.
**Files touched**: `abstract/tabs/InstanceManagerTab.tsx` (import di `createPortal`,
`COLUMNS_PANEL_MAX_W` + `computeColumnsPanelStyle`, due stati nuovi — `columnsPanelRef` e
`columnsRect` — l'effetto di chiusura esteso a scroll/resize, il pannello dentro
`createPortal`), `abstract/tabs/instanceManagerTab.scss` (blocco `&__columns-panel`:
`fixed`, `z-index: 30`, `max-width`, via le coordinate; commento del wrapper aggiornato),
`__tests__/instanceManager10i.test.ts` (due asserzioni riallineate + tre `it` nuovi) e
`__tests__/instanceManagerFl6.test.ts` (un'asserzione ristretta di perimetro), in
**3ab498458**; questa entry a parte. La sonda `scripts/smoke/_tmp_10kchiusura_verify.ts`
non e' committata: `.gitignore:66` ignora `frontend/scripts/smoke/_tmp_*` per disegno.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 00:20 — 10i, il prompt inline che introdusse il pannello
**Causa**: (c)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO); `npm run build` exit 0, solo il warning di chunk noto; suite
`abstract/tabs/__tests__/` **387/387**; `npm run smoke` **GREEN**, 12 passed / 0 failed / 3
skipped. Le asserzioni nuove provate contro SETTE mutazioni (foglio a `absolute`;
`max-width` divergente dalla costante del TSX; click-fuori tornato a interrogare il solo
`columnsRef`; `openUp` costante; scroll non in cattura; portale senza `document.body`;
una coordinata rimessa nel foglio): 1 rosso ciascuna, verde al ripristino in tutte e sette.
**Out-of-scope changes**: no — `instanceManagerFl6.test.ts` non era nominato dal prompt ma
il suo `expect(TSX).not.toContain('window.innerWidth')` era su TUTTO il file, e un popover
`fixed` DEVE misurare il viewport per non uscirne: l'asserzione e' ristretta al blocco
della soglia dell'ego, che e' cio' che FL6 dichiara. Nessun sorgente fuori perimetro.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`, zero scritture. Il delta e' dove vive un nodo del DOM.
**Smoke visivo**: passato — `_tmp_10kchiusura_verify.ts`, **before 49/7, after 56/0**, zero
errori di pagina, stesso strumento su entrambi i lati. Il criterio e'
`document.elementFromPoint` sul centro dell'ULTIMA voce, dopo averla portata in vista con
`scrollTop`: nel before il punto (1577, 468) restituisce `instance-manager__collapsed` —
li' il pannello era stato tagliato — e nell'after restituisce
`instance-manager__columns-item`. Il before sfora anche il viewport a destra (1672 su
1600), che l'after chiude col clamp. Le caselle 16x16 / raggio 4 / bordo `#cbd5e1` /
spuntata `#334155` risultano IDENTICHE nei due giri: la regola di 10k e' su classi BEM
piatte, non discendenti di `.instance-manager`, e raggiunge il portale per costruzione —
il sospetto del prompt e' misurato e infondato.
**Notes**: due rettifiche al disegno della sonda, entrambe §5. (1) La fixture di 10i (sei
colonne) NON riproduce il difetto: il pannello finiva a 335px contro un fondo card a 433 e
il before sarebbe passato. Servono dodici attributi in piu' su `State`. (2) L'ultima voce
non e' colpibile nemmeno dopo il fix se non la si porta in vista con `scrollTop`: il
pannello ha `max-height` e scorre da se', e quel rosso avrebbe parlato dello scorrimento.
**Prompt document name**: emendamento 10k-CHIUSURA (in chat) — 2026-09-01 13:50


## 2026-09-01 — fix(manager): Export e New salgono in testata, e i tre rossi che ho committato (10k-CHIUSURA)
**Prompt**: `docs/prompts/PROMPT_10k_ritocchi_giro2.md`, punto 2 **emendato alle 13:21** — due
minuti dopo il commit del primo giro. Non piu' solo titolo e sottotitolo fuori dalla card: riga di
testata col soggetto a sinistra e `Export` + `+ New State` a destra, card che comincia dalla
toolbar, toolbar ridotta a filtro/segmented/indicatore/Columns con gli ultimi due a destra, e il
caso «0 istanze» da arbitrare perche' 10j lascia la testata accesa.
**Files touched**: `abstract/tabs/{InstanceManagerTab.tsx, instanceManagerTab.scss}` in
**4180819c3**; `__tests__/instanceManager{10i,10j}.test.ts` (3 asserzioni riallineate) in
**f18c03d9e**; §11 del referto e il prompt emendato in **a3d27017e**; questa entry a parte.
Commit costruiti con un **indice privato** (`GIT_INDEX_FILE`), vedi Notes.
**Outcome**: ⚠️ partial — spedito e verde, ma con un commit rotto in mezzo (vedi Regressions).
**Corregge**: 2026-09-01 12:30 — 10k, il suo punto 2 nella versione emendata due minuti dopo
**Causa**: (f)
**Regressions**: **yes, e mie**. `4180819c3` e' andato in HEAD con **tre test rossi** di 10i/10j.
La suite intera era girata PRIMA del giro (2885/0) e dopo ho girato solo la suite 10k e la sonda,
che non toccano quelle due. Il rilievo e' arrivato dalla corsia 10k-bis, non da me. Chiusi in
`f18c03d9e`, entrambe le riallineate provate per mutazione (tolta la guardia; Export rimesso nella
barra): una rossa ciascuna. Stato finale: `npx vitest run` **2904 passati / 0 falliti** (9 file
rossi in raccolta, il noto `window is not defined`), suite `tabs/` **380/380**, `npm run
typecheck` **33** invariata, `npm run build` exit **0**.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero `TRANSACTION`.
**Smoke visivo**: passato — `_tmp_10k_verify.ts` portata da 49 a 60 asserzioni, **before 53/5,
after 60/0**, zero errori di pagina. I cinque rossi del before sono le cinque asserzioni nuove.
Misurato: Export `x 1510` e New in testata sul rigo del titolo, barra ridotta a
`["search","segmented","hidden-cols","columns-wrap"]` con Columns a filo destro (`right 1572`), e a
zero istanze `newCount: 0` con la sola CTA del cartello.
**Notes**: due lezioni oltre la slice. (1) `4180819c3` era prima `fcc200d11`, che prese l'indice
CONDIVISO — §6.1 copre il contenuto sbagliato in un file conteso, non la finestra fra `git add` e
`git commit`; con tre sessioni sull'albero la finestra e' il rischio dominante, e la chiude un
indice privato. (2) Il punto 3 del primo giro era sbagliato e l'ha corretto un'altra corsia
(`5bcc56abe`): la mia sonda misurava il VALORE della banda, non la sua differenza dal desk.
Referto §11.
**Prompt document name**: PROMPT_10k_ritocchi_giro2.md — 2026-09-01 13:21


## 2026-09-01 — fix(manager): la banda dell'header form prende un token suo (10k-bis)
**Prompt**: emendamento 10k-bis, un punto solo: l'header della card form
(`&__form-head`) non staccava dal desk. Due leve insieme — fondo un gradino piu' scuro,
hairline a `--color-form-border-strong`. Terza leva (titolo a 600, metaclasse a chip
pastello) subordinata dal prompt a «solo se il pixel dice che non basta». Verifica
richiesta: sonda con contrasto MISURATO banda-vs-desk e banda-vs-corpo card.
**Files touched**: `abstract/tabs/instanceManagerTab.scss` (blocco `&__form-head`: due
dichiarazioni piu' il commento) e `__tests__/instanceManager10k.test.ts` (blocco «10k
punto 3»), in **5bcc56abe**; questa entry a parte. La sonda
`scripts/smoke/_tmp_10kbis_verify.ts` non e' committata: `.gitignore:66` ignora
`frontend/scripts/smoke/_tmp_*` per disegno.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 12:30
**Causa**: (c)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO, 124 righe); `npm run build` exit **0**, solo il warning di chunk noto; suite
`abstract/tabs/__tests__/` su HEAD fuso **380/380**. Le due asserzioni ratificate di 10k
sul form-head sono riscritte (il fondo che pinnavano e' il difetto che l'emendamento
chiude), piu' un controllo positivo nuovo sul desk. Suite provata con QUATTRO mutazioni
(fondo a `form-panel`, fondo a `bg-hover`, hairline a `form-border`, desk portato anche
lui a `bg-tertiary`): 1/1/1/1 rossi, verde al ripristino in tutte e quattro.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun trigger di §3.2. Zero
creatori D, zero `TRANSACTION`, zero scritture: il delta e' due dichiarazioni CSS.
**Smoke visivo**: passato — `_tmp_10kbis_verify.ts`, **before 13/4, after 17/0**, zero
errori di pagina, stesso strumento su entrambi i lati. La misura e' ΔL* (CIE, sRGB→Lab
D65) sui `backgroundColor` COMPUTATI: banda-vs-desk **0 → 1.83** (nel before esattamente
zero, i due lati erano lo stesso token), banda-vs-corpo card **1.82 → 3.65**,
filetto-vs-banda **6.41 → 11.49**. Leva facoltativa NON fatta: il titolo era gia' a 600
(misurato, X7) e il pixel dice che le due leve bastano; scelta confermata da Alfonso.
**Notes**: due rettifiche al prompt. (1) «--color-bg-hover (#f1f5f9)» sono due token diversi: `bg-hover` e' $slate-150 (#e9eff6), `bg-tertiary` e' $slate-100 (#f1f5f9). Il foglio aveva gia' ratificato la distinzione due volte a commento, e usa `bg-tertiary` per le superfici a riposo. (2) Soglia A6 alzata da 4 a 8: a 4 passava in entrambi i giri. La (c) per esteso, e l'incidente di concorrenza con `ecore` (mio indice sporco finito in fcc200d11, da loro resettato; nulla perso), nel messaggio di 5bcc56abe.
**Prompt document name**: emendamento 10k-bis (in chat) — 2026-09-01 13:15


## 2026-09-01 — feat(toolbar): «Data manager» in coda al picker delle sintassi (NAV1)
**Prompt**: `docs/prompts/PROMPT_NAV1_data_manager_picker.md` — il manager entra nel
selettore delle viste come «Data manager», in coda dopo un separatore, e la scelta deve
portare alla STESSA vista del tab dell'header riusando la via che lo apre oggi. Discovery
prima del codice (Regola 15 doppia): vocabolario del picker, consumatore della scelta,
simmetria picker/tab, e fermata se il picker avesse assunzioni «solo sintassi». Fuori
scope: `InstanceManagerTab.tsx`/`.scss` (10k in volo), il rail del mock, la persistenza.
**Files touched**: `editor-v2/dataManagerOption.ts` (nuovo, zero import: sentinella,
etichetta, separatore, `isDataManagerOption`), `editor-v2/Toolbar.tsx` (le due opzioni in
coda al `<select>` + l'intercettazione in `handleViewpointChange`), la suite nuova
`editor-v2/__tests__/dataManagerPicker.test.ts` (18 casi), il referto
`docs/discovery/discovery_2026-09-01_nav1_data_manager_picker.md` e il documento di prompt
a terra (RC-9), in `ccb2c0774`; questa entry a parte. Pathspec obbligata: l'albero portava
il lavoro di 10k su `InstanceManagerTab.tsx`/`.scss` e su `PROMPT_10k_*`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO, non su una finestra); `npm run build` exit **0**, solo il noto warning di chunk;
`npx vitest run` **2903 passati / 0 falliti**, 9 file rossi in raccolta tutti il noto
`window is not defined`. La suite nuova provata contro DUE mutazioni del sorgente
(intercettazione spostata DOPO `activateViewpoint`: 2 rossi; voce messa PRIMA dei
viewpoint: 3 rossi), verde al ripristino.
**Out-of-scope changes**: no — il prompt non elencava file (discovery-first); il perimetro
consegnato e' picker + routing, e `InstanceManagerTab` non e' stato aperto.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`. La sentinella non raggiunge mai `state.viewpoint`: e' il punto di §C2.
**Smoke visivo**: passato — `npm run smoke` **GREEN**, 12 passed / 0 failed / 3 skipped.
Ma il gate vero e' la sonda `_tmp_nav1_verify.ts`, **17/17 ALL GREEN, zero errori di
pagina**: nessuno dei tre stati dello smoke contiene un M1 col picker, e uno schermo che
non puo' contenere il soggetto tace come un soggetto assente (§5). Coperti l'ordine in
coda, il separatore disabilitato, l'assenza su M2, il gesto, la convergenza su UN tab con
la porta del rail, e il tab del manager ancora aperto dopo il ritorno alla sintassi.
**Notes**: due reperti di metodo, un giro rosso ciascuno (referto §5). (1)
`visible=true` sceglie il pane sbagliato: rc-dock lascia i pane inattivi nel DOM traslati
fuori schermo con `getClientRects()` non vuoto — misurato x = -857 — e il primo giro dette
un B2 FAIL falso. Scoping su `.dock-tabpane-active`. (2) La fixture `rowviews` non offre
viewpoint selezionabili (l'unico e' di sistema, filtrato dal picker): l'asserzione
sull'ordine era vera a vuoto, ora c'e' il controllo positivo 0b e la semina.
**Prompt document name**: PROMPT_NAV1_data_manager_picker.md — 2026-09-01 13:16

## 2026-09-01 — fix(manager): i nove ritocchi del giro 2, e lo stretch di FL1 che si ferma a meta' (10k)
**Prompt**: `docs/prompts/PROMPT_10k_ritocchi_giro2.md` — nove punti di superficie e copy su uno
screenshot di `sample-StateMachine`, pattern 10h/10i (sonda before/after, asserzioni su computed
style). Checkbox fuori stile, titolo dentro la card, header form senza banda, colonna NAME doppia,
`entryAction` a tutta larghezza, CHILDREN+ADD CONTAINED, nodo owner attaccato all'arco, copy del
sottotitolo, passata slick a soli token DS. Fuori scope: motore, outline, ENG2/UX1, dark mode.
**Files touched**: `jjform/layout.ts` + `__tests__/layout.test.ts` in **a219f91e5**;
`jjform/{egoNeighborhood,create}.ts` + i due test in **8f046987f**;
`abstract/tabs/{InstanceManagerTab.tsx, instanceManagerTab.scss, instanceTable.ts}`,
`__tests__/instanceManager10d.test.ts` (1 asserzione rovesciata), la suite nuova
`__tests__/instanceManager10k.test.ts` (37 casi), il referto
`docs/discovery/discovery_2026-09-01_10k_ritocchi_giro2.md` e il prompt in **170a6d3fb**; questa
entry a parte. Pathspec obbligata: NAV1 stava scrivendo su `Toolbar.tsx` nello stesso albero.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO); `npm run build` exit **0**, solo il warning di chunk noto; `npx vitest run` **2885
passati / 0 falliti**, 9 file rossi in raccolta tutti il noto `window is not defined`. Suite nuova
provata con OTTO mutazioni (hover che vince su `:checked`, hover di riga tornato a `bg-tertiary`,
pannello che non marca il doppione, eyebrow rimesso, doppione fuori dal canale, `STRETCH_MAX` a 12,
banda dell'owner tornata a `EGO_ROW_GAP`, copy vecchio): 1/1/2/1/1/6/2/2 rossi, verde al ripristino
in tutte e otto.
**Out-of-scope changes**: yes — sei file fuori dai tre dichiarati miei nel «Coordinamento»
(`instanceTable.ts`, `layout.ts`, `create.ts`, `egoNeighborhood.ts` e i loro test), autorizzati da
Alfonso prima di scrivere insieme alla via del punto 5. Piu' una asserzione ratificata di 10d
rovesciata: pinnava la testata DENTRO la card, che e' esattamente cio' che il punto 2 disfa.
**Layer Impact Report**: not-required — nessun file di §3.1 e nessun trigger di §3.2. Zero creatori
D, zero `TRANSACTION`, zero scritture: il delta e' CSS, JSX e tre funzioni pure.
**Smoke visivo**: passato — `_tmp_10k_verify.ts`, **before 20/29, after 49/0**, zero errori di
pagina, stesso strumento su entrambi i lati (i sei sorgenti in stash per il giro before). Misure
per punto: checkbox 20x20 nativo -> 16x16 DS con riempimento `rgb(51,65,85)`; testata da dentro la
card a `[63,108]` sopra una card che parte a 120; banda della form da `rgba(0,0,0,0)` a
`rgb(248,250,252)` e da `[768,1572]` a `[754,1586]`; `ths` da due `name` a uno, indicatore «5
columns hidden»; `entryAction` span **9 -> 6**, 583px -> 386px contro i 189px di `timeout`; tre
intestazioni sui figli -> una; gronda dell'owner **12 -> 24px**; copy «Contained in StateMachine».
Non regressioni 10i/10j/DS3 verdi in ENTRAMBI i giri.
**Notes**: il punto 5 non era del manager: e' la regola 2 di FL1, ratificata, che stirava l'ultimo
scalare di una riga corta. Emendamento **A2** (`STRETCH_MAX = 6`) scelto da Alfonso fra tre vie,
quattro asserzioni ratificate riscritte, raggio d'azione ogni form dell'app. Tre token del prompt
rettificati: `--color-border` non esiste, `--color-bg-secondary` e `--shadow-sm` sono fra i 15
dichiarati due volte. Referto §1, §3, §8.
**Prompt document name**: PROMPT_10k_ritocchi_giro2.md — 2026-09-01 12:30


## 2026-09-01 — test(smoke): la `link` condivisa che asserisce la forma che posa (ENG2)
**Prompt**: `docs/prompts/PROMPT_ENG2_probe_link_gate.md` — chiudere il secondo punto di
ENG1 §B.6: una `link` condivisa in `states.ts` che asserisca la forma costruita invece di
ricalcolare l'indice dallo store, la migrazione delle sonde che usano la forma pericolosa,
e il contratto del chiamante pinnato come SOLO COMMENTO su `get_setValueAtPosition`.
Fuori scope: ogni modifica di codice a `LModelElement.tsx` e `action.ts`, OQ-2/OQ-4.
**Files touched**: `frontend/scripts/smoke/states.ts` (export `link` + `LinkResult`),
`frontend/scripts/smoke/README-probes.md` (nuova sotto-sezione), `frontend/src/model/
logicWrapper/LModelElement.tsx` (**otto righe di commento, zero codice**) e il referto
`docs/discovery/discovery_2026-09-01_eng2_probe_link_gate.md`, in `de7a916f3`; questa entry
a parte. Le sonde `_tmp_eng2_verify.ts` (nuova) e `_tmp_10g_{measure,verify}.ts` (migrate)
restano non committate: `.gitignore:66`. Pathspec — l'indice portava lavoro di UX1, che si e'
committato da se' in `e3fbbcb08`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 09:05 — ENG1, il punto §B.6 che quel referto lascio' aperto per progetto
**Causa**: (g)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO); `states.ts` sta fuori da `include: src`, verificato a parte con `tsc --noEmit`
mirato, exit **0**; `npm run build` exit **0**; `npx vitest run` **2843 passati / 0 falliti**,
9 file rossi in raccolta tutti il noto `window is not defined`; `npm run check:docs` 3/3.
`link` provata con UNA mutazione (cursore rimosso, indice riletto dallo store): 3/16 rossi,
tutti sull'arm dentro la finestra; verde al ripristino.
**Out-of-scope changes**: no — i due file del prompt, il commento, il referto.
**Layer Impact Report**: not-required — `LModelElement.tsx` non e' in §3.1 e il delta e' un
commento: zero creatori D, zero `TRANSACTION`, zero comportamento.
**Smoke visivo**: passato — `npm run smoke` **GREEN**, 12 passed / 0 failed / 3 skipped, un
boot per stato. Sonda `_tmp_eng2_verify.ts` **16/16 PASS, zero errori di pagina**, con la
forma pericolosa tenuta nella STESSA esecuzione come controllo positivo (perde ancora un
valore, lascia ancora l'orfano). `_tmp_10g_verify.ts` dopo la migrazione **24/24**, riga
«orfani misurati» vuota; `_tmp_10g_measure.ts` 12 nodi su 12, zero duplicati.
**Notes**: due reperti. (1) La `link` leggeva `refDef.containment`, campo legacy (§3.8): il
D-layer scrive `composition`, e il per contrasto si accendeva su scritture corrette — 3/16
rossi alla prima esecuzione. (2) Le sonde 10c..10f NON sono migrate: posano `raw` e
asseriscono l'outline, che `father` costruisce; cambiare il posatore cambia il soggetto e
ritira numeri gia' ratificati. Referto §4 e §7. P6: tipo di commit non indicato dal prompt,
scelto `test(smoke)` e dichiarato.
**Prompt document name**: PROMPT_ENG2_probe_link_gate.md — 2026-09-01 12:35

## 2026-09-01 — feat(properties): l'hint del viewpoint non attivo sotto il Form theme (UX1)
**Prompt**: `docs/prompts/PROMPT_UX1_theme_hint_inactive.md` — chiudere il punto aperto di
STYLE2 §8: il select «Form theme» scrive il viewpoint SELEZIONATO nell'albero, `IRForm` legge
quello ATTIVO, e se divergono la scelta appare inerte. Una riga di hint sotto il select, copy
asciutto sentence case, solo nel caso divergente, sorgente riusata (`state.viewpoint`) e non
derivata una seconda volta. Fuori scope: attivazione automatica, skin legacy, ogni altra
superficie.
**Files touched**: `editors/viewpoint/properties/ViewpointProperties.tsx` (`useSelector` su
`state.viewpoint`, il predicato, il `<p>` sotto il select),
`editors/viewpoint/properties/properties.scss` (`&__hint`, additiva) e la suite nuova
`editors/viewpoint/properties/__tests__/viewpointThemeHint.test.ts` (16 casi), piu' il
documento di prompt a terra (RC-9), in `e3fbbcb08`; questa entry a parte. Pathspec obbligata:
una sessione parallela teneva modificati `scripts/smoke/states.ts` e `README-probes.md`.
Indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 09:35 (STYLE2) — il punto che il suo referto §8 lascio' aperto
**Causa**: (a)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO, `EXIT=2`); `npm run build` exit **0**; `npx vitest run` **2843 passati / 0 falliti**
(2827 + i 16 nuovi), 9 file rossi in raccolta tutti il noto `window is not defined`. Suite
propria provata con SEI mutazioni (gate rimosso, condizione invertita, guardia sul valore
vuoto rimossa, select disabilitato fuori dal viewpoint attivo, seconda sorgente via
`LProject`, regola SCSS rimossa): 1/1/1/1/2/2 rossi, verde al ripristino in tutte e sei.
**Out-of-scope changes**: yes — uno, dichiarato: `properties.scss`. Il prompt diceva
«`ViewpointProperties.tsx` + test, zero file condivisi»; un hint senza regola avrebbe reso a
13px nero, indistinguibile da una seconda etichetta. Misurato che il foglio NON e' condiviso:
`wp-field` e `workbench-properties` compaiono solo in quei due file (4 occorrenze, tutte
nella cartella), e `wp-field__hint` non esisteva da nessuna parte. La regola e' additiva.
**Layer Impact Report**: not-required — nessun file di §3.1 e nessun trigger di §3.2: zero
creatori D, zero `TRANSACTION`, zero scritture. Il delta e' una lettura di `state.viewpoint` e
un ramo JSX.
**Smoke visivo**: passato — `_tmp_ux1_verify.ts` sull'app vera, **13/13 ALL GREEN, exit 0,
zero errori di pagina**. Caso ATTIVO 0 hint; DIVERGENTE per costruzione (secondo viewpoint
creato con `DViewPoint.newVP` e attivato) 1 hint con la copy esatta, `<p>` 12px `#64748b`
sotto il select contro i 13px dell'etichetta; DIVERGENTE per assenza (`state.viewpoint` `""`)
1 hint — la guardia `!!activeViewpointId` tiene; ritorno all'attivo 0 hint, il controllo di
segno opposto. PER CONTRASTO il select scrive in ENTRAMBI (`Compact` nell'attivo, `Dense` nel
divergente) e scrive sul viewpoint SELEZIONATO, con quello attivo rimasto `null`; mai
`disabled` in nessuno dei tre stati.
**Notes**: il primo giro della sonda usci' «ATTIVO: nessun hint» VERDE con il pannello
ASSENTE — zero hint perche' zero DOM: `Info` non monta senza una tab aperta. L'ha preso il
controllo positivo, non il criterio. La suite legge il SORGENTE e non monta il componente:
misurato, importarlo muore in raccolta con `window is not defined` (la barrel `joiner` arriva
a monaco), precedente `irFormLabelColumn.test.ts`.
**Prompt document name**: PROMPT_UX1_theme_hint_inactive.md — 2026-09-01 12:05

## 2026-09-01 — feat(manager): l'empty state della metaclasse vuota, e la card che scende sotto il prima (10j)
**Prompt**: due giri. (1) «Slice 10j — empty state della metaclasse vuota, SERIALE»: il cartello
parla del MODELLO mentre e' la metaclasse a essere vuota, la card riempie l'altezza, la barra
«Select an instance to edit it» resta a tabella vuota, filtro/segmented/indicatore/Columns
galleggiano su zero righe; dichiarare la scelta su Export. (2) «10j-CHIUSURA»: applicare le due
leve che il referto §1 aveva misurato e lasciato aperte — gronda 48 -> 24px e riga di toolbar
spenta a zero istanze — arbitrando «resta la testata» = titolo + sottotitolo.
**Files touched**: `abstract/tabs/{InstanceManagerTab.tsx, instanceManagerTab.scss}` e
`abstract/tabs/__tests__/instanceManager10c.test.ts` (1 asserzione riallineata) — **il delta del
primo giro e' dentro `dc6ae5c52`**, vedi Notes; le due leve, la suite nuova
`__tests__/instanceManager10j.test.ts` (28 casi) e il referto
`docs/discovery/discovery_2026-09-01_10j_empty_metaclass.md` in `3c805d777`; questa entry a
parte. Pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 06:20 — prompt inline «Slice 10j», il punto 2 che il suo referto §1
lascio' aperto (quel giro non ebbe entry: questa la sostituisce e la estende)
**Causa**: (a)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO, `EXIT=2`); `npm run build` exit **0**; `npx vitest run` **2827 passati / 0 falliti**,
9 file rossi in raccolta tutti il noto `window is not defined`. Suite 10j provata con DUE
mutazioni (gronda tornata a 48px, condizione riportata dai figli alla riga sempre resa): 1/2
rossi, verde al ripristino in entrambe.
**Out-of-scope changes**: no — i due sorgenti della superficie, la suite nuova, il referto. La
suite 10c del primo giro e' l'espansione dichiarata nel referto §6.
**Layer Impact Report**: not-required — nessun file di §3.1. Zero creatori D, zero
`TRANSACTION`: il delta e' una dichiarazione CSS e una condizione JSX che sale sul contenitore.
**Smoke visivo**: passato — `_tmp_10j_verify.ts`. Primo giro **before 29/19, after 55/0**; giro
di chiusura, sonda portata a 59 asserzioni, **after 59/0**, zero errori di pagina. **Cartello
185px, card 271px**, contro i 298px del prima della slice e i 347px del primo after. Le tre
asserzioni nuove: la card contro i 298 del prima, la riga di toolbar ASSENTE, il «New» assente
con la CTA che lo ripete. Non-regressioni sulla collezione piena verdi in tutti i giri.
**Notes**: `dc6ae5c52`, intitolato «(10i)», **committo' l'albero e non l'indice**: porta anche
il delta 10j dei due sorgenti e il riallineo di 10c, quindi dichiara meno di cio' che contiene.
Il log e' add-only (R-RAIL-45): l'entry 10i resta com'e' e la rettifica si legge qui. La
misura richiesta dal punto 2 alzava la card di 49px invece di abbassarla — il chrome tolto
stava tutto sulla riga del «New», che restava. Referto §1 e §7.
**Prompt document name**: PROMPT_10j_chiusura.md — 2026-09-01 10:20

## 2026-09-01 — fix(form): la colonna etichetta e' un cap, e la cella stretta impila il campo (FL8)
**Prompt**: «FL8: colonna etichetta fissa vs celle del packer (fix, PARALLELO)» — chiudere il
reperto di STYLE1 §7: nei due preset a etichetta laterale il rail a 400px lasciava 7.8px al
controllo. Due leve, con l'ordine dichiarato: (a) colonna etichetta flessibile, (b) fallback a
etichetta sopra sotto una soglia derivata dalla width_map. Fuori scope: il picker del tema
(STYLE2), `layout.ts`/`themes.ts`/width_map, il manager.
**Files touched**: `editor-v2/viewpoint/ir/irFormStyle.scss` (il blocco `[data-label-placement=
"left"]` e una regola nuova), `editor-v2/viewpoint/ir/__tests__/irFormLabelColumn.test.ts`
(**nuovo**, 18 casi) e il referto `docs/discovery/discovery_2026-09-01_fl8_colonna_etichetta.md`,
in `57d36a10e`; questa entry a parte. Pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 09:10 — STYLE1, il reperto che il suo referto §7 lascio' aperto
**Causa**: (c)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO); `npm run build` exit **0**; `npx vitest run` **2825 passati / 0 falliti**, 9 file
rossi in raccolta tutti il noto `window is not defined`. Suite propria provata con CINQUE
mutazioni (cap tornato fisso, floor rimosso, soglia a 120px, containment estesa ai preset a
etichetta sopra, `text-align` dell'etichetta impilata rimosso): 2/2/6/2/2 rossi, verde al
ripristino in tutte e cinque.
**Out-of-scope changes**: no — il foglio del prompt, la sua suite nuova, il referto.
**Layer Impact Report**: not-required — nessun file di §3.1. Il delta e' CSS.
**Smoke visivo**: passato — `_tmp_fl8_verify.ts`, **18/18 PASS, exit 0, zero errori di pagina**.
Soggetto `allNine_valued` (14 campi / 3 gruppi / 7 righe) nel rail a 400px. Before riprodotto
(4 schiacciati e 2 in overflow per preset laterale, tracce `72px 7.75px`), after 0 e 0 nei
QUATTRO preset, minimo controllo da 7.8px a 63.5px. Comfortable e Sectioned identici al before
rettangolo per rettangolo (14 celle, 14 campi, `formH` 811.2 / 914.2). Geometria `14/3/7`
invariata sotto tutti e quattro.
**Notes**: before e after misurati nello STESSO caricamento, iniettando a runtime la grammatica
committata: una sessione parallela scriveva su `IRForm.tsx` (09:57) e `formAutoLayout.ts`
(09:59) mentre la sonda girava, e due giri separati avrebbero confrontato due codici diversi.
Spedite entrambe le leve: (a) da sola SODDISFA il criterio dichiarato ma lascia i tre sintomi
del prompt (select sotto la freccia, stepper senza campo, etichetta troncata). Referto §4.
**Prompt document name**: PROMPT_FL8_rail_label_column.md — 2026-09-01 09:35


## 2026-09-01 — feat(form): il rung viewpoint del tema, e il tab Style che non esisteva (STYLE2)
**Prompt**: `docs/prompts/PROMPT_STYLE2_viewpoint_theme_rung.md` — via **2** del referto
STYLE1 §5: campo D nuovo a livello viewpoint, `resolveFormTheme` che guadagna quella
sorgente, precedenza view > viewpoint > default ciascun gradino testato, select «Form
theme» nel tab Style del viewpoint. Dichiarato SERIALE dopo FL8. Fuori scope: nuovi temi,
il rung metamodello, la skin legacy, il manager.
**Files touched**: `view/viewElement/view.tsx` (campo `formTheme?`),
`editor-v2/viewpoint/ir/formAutoLayout.ts` (quarto strato + `isFormThemeName`),
`editor-v2/viewpoint/ir/IRForm.tsx` (lettura del rung, e l'eyebrow statico sotto
`chrome.eyebrow`), `editors/viewpoint/properties/ViewpointProperties.tsx` (il select),
`editor-v2/viewpoint/ir/__tests__/formAutoLayout.test.ts` (32 -> 40 casi) e il referto
`docs/discovery/discovery_2026-09-01_style2_viewpoint_rung.md`, in `8b63d1e0d`; questa
entry a parte. Pathspec obbligata: l'indice conteneva il lavoro di un'altra sessione.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 09:10 (STYLE1) — ne sblocca il select, fermo per mancanza di una
write surface
**Causa**: (a)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO, `EXIT=2`); `npm run build` exit **0**; `npm run test` **2825 passati / 0
falliti**, 9 file rossi in raccolta tutti il noto `window is not defined`. Suite propria
provata con CINQUE mutazioni (strato viewpoint scartato, precedenza invertita, guardia
rimossa, `skin` ridefaultata a `plain`, rung per-classe scartato): 2/2/1/2/3 rossi, verde
al ripristino in tutte e cinque.
**Out-of-scope changes**: yes — due, entrambi misurati e nel referto. (1) il select sta in
`ViewpointProperties.tsx` e non in `PaletteData.tsx`: `<ViewData>`, che possiede il tab
Style, e' montato in UN posto (`Info.tsx:1394`) e quel posto e' il ramo `else` di `isVP` —
un viewpoint non ci arriva mai, il reperto 2 di STYLE1 aveva letto il ramo interno di
`ViewData` e non il montaggio. (2) una riga in `IRForm.tsx`: l'intestazione statica
«Identity» passa sotto `chrome.eyebrow` come le sezioni.
**Layer Impact Report**: not-required — nessun file di §3.1 e nessun trigger di §3.2: il
campo D e' additivo e opzionale, zero creatori, zero `TRANSACTION`, la scrittura e' la
stessa assegnazione su proxy L con cui `viewpointType` e' scritto da due anni. Il permesso
di §5 Regola 5 (core, `view.tsx`) e' il prompt stesso.
**Smoke visivo**: passato — `_tmp_style2_verify.ts` sull'app vera, **30/30 ALL GREEN, exit
0, zero errori di pagina**. Soggetto `allNine_valued`, rail 400px. I QUATTRO preset per via
reale, la via contratto di STYLE1 sparita: Comfortable `top|comfortable|flat|14px|811.2px`,
Compact `left|compact|divided|8px|659.2px`, Sectioned `top|comfortable|card|14px|811.2px`,
Dense `left|dense|none|6px|11.5px|580.2px`, eyebrow 3/3/3/**0**. Un giro end-to-end vero dal
`<select>` con Playwright (seleziona viewpoint, sceglie Dense, riseleziona l'oggetto).
Precedenza a schermo: viewpoint=Dense + view=`plain` rende Comfortable, + view=`compact`
rende Compact, tolto il tema della view il viewpoint torna a vincere. Non-regressione due
volte: firma del before identica a quella committata da STYLE1, e tolto il campo il DOM
torna identico campo per campo. `"Cosy"` nel campo risolve come nessuna opinione. Geometria
`14/3/7` sotto tutti e quattro.
**Notes**: Causa (a): il prompt dava per esistente il tab Style del viewpoint. Terzo reperto:
la firma Dense «0 eyebrow» di STYLE1 era una misura della SONDA — la sua via contratto
nascondeva a mano ogni `.ir-form__group-title`, inclusa quella statica che React rendeva
comunque. Sul percorso vero uscivano 1. Corretto: `eyebrow:false` viene solo da `none`, che
viene solo da `Dense`, irraggiungibile fino a questa slice — nessun comportamento committato
degradato. Referto §2, §5, §7.
**Prompt document name**: PROMPT_STYLE2_viewpoint_theme_rung.md — 2026-09-01 09:55


## 2026-09-01 — fix(core): il rifiuto dell'auto-composizione dice il vero, e l'orfano del doppio append ha un nome
**Prompt**: «ENG1: due difetti del core sul containment, PARALLELO a 10j-chiusura». (A) fix:
`LReference.set_containment` sul ramo auto-composizione (`father === type`) logga il warning,
NON scrive e restituiva `true`; censire prima chi legge il ritorno, il rifiuto in se' resta.
(B) DISCOVERY-FIRST: l'orfano lasciato da due append consecutivi su `Cooler.states`
(`Off.father` sullo slot, slot a `["Broken"]`), riprodurre prima di toccare, correggere solo
se il fix e' locale e a blast radius dichiarato. Fuori scope: la sweep di 10g, OQ-4 del
2026-07-27, ogni superficie manager.
**Files touched**: `model/logicWrapper/LModelElement.tsx` (**una** riga di `return`, piu' il
commento che porta la misura) e `model/__tests__/setContainmentVerdict.test.ts` (**nuovo**,
11 casi) in `b7d9c4c10`; il referto
`docs/discovery/discovery_2026-09-01_eng1_containment_core.md` in `f1b8a6f69`; questa entry
a parte. Tre commit, tutti con pathspec, indice verificato vuoto prima e dopo ciascuno.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, `EXIT=2`); `npm run build` exit **0**; `npx vitest run` **2799 passati / 0
falliti**, 9 file rossi = i noti `window is not defined`, nessuno di questa slice. Suite
propria provata con SEI mutazioni (`return true` restaurato, warning rimosso, no-op che
rende `false`, guardia allargata ad `aggregation`, il trap del proxy che propaga il
verdetto, un quarto chiamante di `set_containment`): 2/1/2/4/1/1 rossi, verde al ripristino
in tutte e sei.
**Out-of-scope changes**: no — il file del prompt, la sua suite nuova, il referto.
**Layer Impact Report**: not-required — `LModelElement.tsx` non e' in §3.1 ne' fra i trigger
di §3.2, e il delta e' un `return`: zero creatori D, zero `TRANSACTION`, zero
`SetFieldAction`. Il permesso di §5 Regola 5 (core) e' il prompt stesso.
**Smoke visivo**: passato — `_tmp_eng1_measure.ts` sull'app vera, fixture StateMachine/State.
Arm A: 6/6 PASS, incluso il controllo positivo (`states` riceve composition) e il contrasto
(`aggregation` sullo stesso auto-riferimento PASSA: il `return false` non ha allargato il
rifiuto). Arm B: gli unici 4 FAIL sono le riproduzioni volute (A1x2, A3, A5); A2/A4/A6/A7/A8
verdi. Zero errori di pagina. Nessuna superficie visiva toccata.
**Notes**: Il censimento chiude A senza consumer: il trap `set` di `proxy.ts:476-483` scarta
il verdetto, e quel `return true` a mano e' anche cio' che impedisce alla correzione di far
lanciare l'assegnazione. «Riproduci in unit test» non e' eseguibile: `LModelElement.tsx` non
importa sotto vitest, riverificato. B chiude come referto perche' la correzione ovvia — la
lettura dallo store vivo — non funziona: dentro la finestra lo store e' stantio quanto
`context.data`. Referto §0, §A.1, §B.4-B.6.
**Prompt document name**: prompt inline (non depositato) — 2026-09-01 09:05


## 2026-09-01 — docs(form): i quattro preset guardati, e il select che non ha dove scrivere (STYLE1)
**Prompt**: «STYLE1 — selettore tema form nel tab Style + formSpec di verifica (PARALLELO)»:
chiudere il debito di FL4 (i 4 preset rendono ma nessuno li ha mai visti) con (1) un select
«Form theme» nel tab Style che scriva dove FL2 ha stabilito che il tema risolve, e (2) una
sonda che applica i 4 preset su una form reale e cattura 4 screenshot. Clausola di arresto
esplicita nel prompt: «se FL2 non ha lasciato una write surface, fermati e riporta».
**Files touched**: `docs/discovery/discovery_2026-09-01_style1_tema_form.md` (**nuovo**);
questa entry in commit a parte. **Zero file sorgente toccati.**
**Outcome**: ⚠️ partial — (2) fatto e verde, (1) **fermato** dalla clausola del prompt.
**Corregge**: 2026-08-31 18:45 (PROMPT_FL4_integration.md — ne chiude il debito di verifica)
**Causa**: a
**Regressions**: no — nessun sorgente modificato, quindi nulla da far regredire. Verificato in
positivo comunque, sull'app viva: senza scelta di tema il DOM della form e' identico al before,
e per contrasto rimosso il tema dopo quattro cambi torna identico.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, e nessun file di alcun tipo:
il diff e' un solo documento.
**Smoke visivo**: passato — `_tmp_style1_verify.ts` sull'app vera, **23/23 ALL GREEN, exit 0,
zero errori di pagina**. Soggetto `allNine_valued` (14 campi / 3 gruppi / 7 righe) nel rail a
400px. Quattro preset, quattro firme distinte, quattro screenshot: Comfortable
`top|comfortable|flat|14px|811px`, Compact `left|compact|divided|8px|566px`, Sectioned
`top|comfortable|card|14px|914px`, Dense `left|dense|none|6px|536px`, eyebrow 3/3/3/**0**.
Geometria identica sotto tutti e quattro: il tema non muove un campo.
**Notes**: Causa (a): la premessa del prompt — «cascata metamodel -> viewpoint» — e' una
firma di funzione, non una struttura dati: i due livelli non hanno sorgente nel grafo D.
Tre reperti in `discovery_2026-09-01_style1_tema_form.md` (§3, §4, §7): Style e form in
due rami esclusivi dello stesso `if`; `Dense` irraggiungibile da ogni scrittura; Compact e
Dense non si leggono nel rail (4 controlli sotto i 40px, il piu' stretto a 7.8px, contro
0). L'ultimo va aperto come slice propria.
**Prompt document name**: prompt inline STYLE1, nessun documento — 2026-09-01 09:10


## 2026-09-01 — fix(manager): il quinto eyebrow traccia come gli altri (DS3)
**Prompt**: «DS3: quinto eyebrow `&__draft-label` a 0.04em (micro, PARALLELO)» — chiudere la
divergenza che il referto 10i §4 aveva rilevato e LASCIATO, portando `&__draft-label` alle
dichiarazioni eyebrow (11px/600/uppercase/0.08em, colore muted), aggiornando il test di 10i da
«fissa la divergenza» ad «afferma la convergenza», con sonda visiva before/after. Fuori scope:
gli altri 13 eyebrow, un token `--tracking-eyebrow`, tabella ed empty state (10j).
**Files touched**: `abstract/tabs/instanceManagerTab.scss` (il solo blocco `&__draft-label`),
`abstract/tabs/__tests__/instanceManager10i.test.ts` (36 -> 39 casi) e il referto
`docs/discovery/discovery_2026-09-01_ds3_draft_label.md`, in `db7e7610a`; questa entry a parte.
Pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 00:20 — slice 10i, la divergenza che il suo referto §4 lascio' aperta
**Causa**: (a)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
COMPLETO); `npm run build` exit **0**; `npm run test` **2799 passati / 0 falliti**, 9 file rossi
in raccolta tutti il noto `window is not defined`. I 3 test rossi dell'entry sulle icone bi
(`10c` ×2, `10d` ×1) sono tornati VERDI: erano causati da 10i non committata in albero, e ora
10i è in `dc6ae5c52`. Suite propria provata con TRE mutazioni (ritorno a 0.04em, colore che
converge a muted, dichiarazione rimossa): 1/1/1 rossi, verde al ripristino in tutte e tre.
**Out-of-scope changes**: no — il blocco nominato dal prompt e il test che il prompt cita.
**Layer Impact Report**: not-required — nessun file di §3.1. Il delta è UNA dichiarazione CSS.
**Smoke visivo**: passato — `_tmp_ds3_verify.ts`, fixture StateMachine rootable con tre chiavi
di lunghezza diversa: **before 15 PASS / 3 FAIL**, **after 18 PASS / 0 FAIL**, zero errori di
pagina in entrambi i giri; blocchi 0 e 2 verdi in entrambi, solo il blocco 1 vira. Verificato
anche nell'INCHIOSTRO, non nel solo computed style: la larghezza del nodo di testo presa con un
`Range` (il rect dell'elemento avrebbe dato la CELLA, che col tracciato non cambia — un falso
negativo che sarebbe passato per misura). `name` 34.92->36.69, `entryAction` 83.78->88.63,
`documentation` 103.94->109.66: delta +1.77/+4.85/+5.72px contro un predetto N*0.44 di
1.76/4.84/5.72, tre su tre entro 0.01px. Non-regressioni verdi in entrambi i giri: il suffisso
tipo/cardinalità che NON eredita il tracciato, le intestazioni di 10i, l'eyebrow del pannello,
il titolo del dialogo.
**Notes**: la divergenza era DOPPIA. Oltre al tracciato, il colore: form-section (slate-500,
4.76:1 su bianco) contro form-muted (slate-400, 2.59:1). Chiesto e deciso di NON convergerlo —
è la `<label>` di un campo a 11px, muted la manderebbe sotto AA. Il prompt indicava
`irFormStyle` e un «badge draft sporco»: il grep dice `instanceManagerTab.scss`, e non c'è
stato sporco. Referto §1, §3 e §6.
**Prompt document name**: prompt inline «DS3 — quinto eyebrow» — 2026-09-01 09:10

## 2026-09-01 — fix(manager): le icone dei pulsanti ereditano il colore del pulsante
**Prompt**: «in tutti i pulsanti color slate scuro le icone bi non sono in bianco, devono
essere color bianco». Schermo indicato dopo domanda: la testata della tabella dell'instance
manager — il primario «+ New <Cls>» e gli altri controlli pieni della stessa barra.
**Files touched**: `abstract/tabs/instanceManagerTab.scss` (in `dd8098827`) e
`abstract/tabs/__tests__/instanceManagerIconInherit.test.ts` (**nuovo**, 13 casi, in
`04cc1cb49`); log a parte. DUE commit invece di uno per l'incidente d'indice sotto.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, `EXIT=2`); `npm run build` exit **0**; vitest **2756 passati / 3 falliti**, e i 3
rossi NON sono di questa correzione: sono `instanceManager10c` (×2) e `instanceManager10d`
(×1), che asseriscono il TSX e il foglio come li lascia la slice **10i di un'altra sessione,
non committata in albero** — l'unico `rgba(` in piu' e' il `box-shadow` del suo pannello
Columns, e il mio delta non aggiunge ne' esadecimali ne' `rgba` fuori dai commenti (che i
test spogliano). 11 file rossi = i 9 noti `window is not defined` piu' quei due. Suite propria
provata con SEI mutazioni (via la regola dal primario, senza l'hover, `#fff` al posto di
`inherit`, via la regola da Export, regola larga a livello di tab, `!important`): 2/1/2/1/1/3
rossi, verde al ripristino in tutte e sei.
**Out-of-scope changes**: no — il foglio del perimetro indicato e la sua suite.
**Layer Impact Report**: not-required — nessun file di §3.1. Il delta e' due dichiarazioni CSS.
**Smoke visivo**: passato — `_tmp_biwhite_verify.ts`, fixture StateMachine/State/Transition:
**before 10 PASS / 4 FAIL**, **after 14 PASS / 0 FAIL**, zero errori di pagina. «+ New»:
icona `rgb(15,23,42)` -> `rgb(255,255,255)`, uguale al `color` del pulsante, e bianca anche
sotto hover. Export: `rgb(15,23,42)` -> `rgb(71,85,105)`, cioe' il colore della propria
etichetta. Verificato anche nel PIXEL, decodificando i PNG: al centro del glifo `+`
(1440,148) il before e' `(18,27,46)` — il punto piu' SCURO del riquadro — e l'after
`(231,233,235)`, il piu' chiaro. Non-regressioni verdi in entrambi i giri: i tre confini di
10h, i badge lettera di 10f, il badge «C» del rail, le righe della tabella.
**Notes**: due reperti di metodo nel referto. Una prima sonda su cinque stati aveva trovato
UNA sola icona non bianca, e non era questa: `__new` si rende solo con una metaclasse
ROOTABLE selezionata, e nessuno stato la selezionava — uno stato senza il soggetto da' lo
stesso silenzio di un soggetto che non c'e'. E `--font-color-1` e' dichiarato su `body`, non
su `:root`: letto sulla radice torna vuoto e fa dichiarare inerte una regola viva. Ho
commesso entrambi gli errori prima di correggerli.
**Prompt document name**: prompt inline, nessun documento — 2026-09-01 00:45

## 2026-09-01 — feat(manager): le intestazioni in maiuscolo e il pannello Columns (10i)
**Prompt**: «Slice 10i — intestazioni UPPERCASE + bottone Columns, micro, SERIALE»: i punti
3-4 di 10h rimasti fuori dal suo commit. (1) le intestazioni di colonna prendono l'eyebrow
del DS — 11px/600, letter-spacing 0.04-0.1em, slate-400 — col case fatto dal CSS e non da
stringhe riscritte, token typography e zero valori nuovi; (2) un bottone «Columns» accanto
all'indicatore delle vuote, popover di checkbox per colonna, le auto-nascoste unchecked con
nota «empty» e spuntabili per forzarle visibili, l'indicatore che conta solo le
non-overridate, `name` non disattivabile, persistenza per metaclasse nello stato UI del tab,
card DS con chiusura click-fuori/Esc, export sulle colonne visibili. Fuori scope dichiarato:
icone bi sui bottoni scuri (sessione parallela), convergenza literal amber, doppio «name».
**Files touched**: `abstract/tabs/{InstanceManagerTab.tsx, instanceManagerTab.scss,
instanceTable.ts}`, `abstract/tabs/__tests__/instanceManager10i.test.ts` (**nuovo**, 36 casi),
`abstract/tabs/__tests__/instanceManager10c.test.ts` (2 asserzioni riallineate) e il referto
`docs/discovery/discovery_2026-09-01_10i_uppercase_columns.md` in `dc6ae5c52`; la rotazione
del log in `2ad458ed2`, questa entry a parte. Due commit, entrambi con pathspec, indice
verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit **0**; `npx vitest run` **2759 passati / 0 falliti**, 9 file
rossi = i noti `window is not defined`. Suite propria provata con CINQUE mutazioni
(`text-transform` rimosso, `autoHiddenColumnKeys` senza override, `isColumnVisible` scritta
con `||`, voce `name` sbloccata, nota `empty` che segue la spunta): 3/3/3/1/1 rossi, verde al
ripristino in tutte e cinque.
**Out-of-scope changes**: no — i tre sorgenti della superficie, la suite nuova, le due
asserzioni di 10c che la slice stessa supera, il referto. Sei file: sopra la soglia di
Regola 19, e non ho fatto la pausa — dichiarato qui.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`: il delta e' due dichiarazioni CSS, quattro
funzioni pure e uno stato React.
**Smoke visivo**: passato — `_tmp_10i_verify.ts` sull'app vera, DUE giri con i tre sorgenti
riportati a `HEAD` per il before: **before 15 PASS / 6 FAIL**, **after 43 PASS / 0 FAIL**,
zero errori di pagina in entrambi. Controlli positivi e non-regressioni 3a-3f verdi in
ENTRAMBI i giri; l'unica che vira e' 3g, che misura il maiuscolo sotto filtro. A schermo:
`text-transform: uppercase` su ogni `th` visibile con `textContent` ancora `entryAction`,
11px/600/0.88px/`rgb(148,163,184)` identici all'eyebrow del pannello, spunta che riporta una
vuota fra le intestazioni, indicatore 4 -> 3, persistenza che sopravvive al giro su
`Transition` e ritorno. Ritagli `_tmp_10i_{before,after}_1_headers` e
`_tmp_10i_after_{2_panel,3_forced,4_persisted,5_selected,6_filtered,7_dark_panel}`.
**Notes**: Tre scarti prompt/repo misurati prima di scrivere (§0 del referto): non esiste un
token nella banda chiesta, e `0.08em` e' letterale per ratifica di R-RAIL-10; tre delle
quattro dichiarazioni c'erano gia'. Una misura ha cambiato il diff: la guardia ovvia su
`name` resuscitava il doppione noto — «non disattivabile» e' sulla COLONNA, non sulla
casella. Divergenza rilevata e LASCIATA: `&__draft-label` a 0.04em, fuori perimetro.
**Prompt document name**: prompt inline (non depositato) 2026-09-01 00:20

## 2026-09-01 — feat(tokens): la coppia model esce dai contenitori e torna ambra (DS-1)
**Prompt**: «Slice DS1 — la coppia entity-model vira ad amber, SERIALE lato token, parallela
a 10h»: `--color-entity-model-{bg,fg}` esce dall'alias sulla famiglia contenitori (R-RAIL-30)
e prende i quattro valori dell'opzione (A) gia' ratificata — H 85, grado saturo, `#F3E8D3 /
#6B5110` in chiaro e `#3B2B06 / #E4C992` in scuro. I tre lettori virano nella stessa corsa,
gate visivo sui pastelli affiancati (se `model` ed `enum` sono indistinguibili la slice si
ferma su (C)), e §2.2 del DS aggiornata perche' documento e token non divergano di nuovo.
**Files touched**: `styles/tokens/{_colors-light.scss,_colors-dark.scss}`,
`styles/__tests__/entityModelAmberDs1.test.ts` (**nuovo**, 21 casi), `docs/DESIGN-SYSTEM.md`
§2.2 e il referto `docs/discovery/discovery_2026-09-01_ds1_model_ambra.md` in `f4aa22df1`;
log a parte. Un commit di codice, con pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, `EXIT=2`); `npm run build` exit **0**; `npx vitest run` **2710 passati / 0
falliti**, 9 file rossi = i noti `window is not defined`, nessuno di questa slice. Suite
propria provata con SEI mutazioni (alias restaurato, tinta a H 70 sotto il pavimento, grado
di croma tenue, `package` de-aliasato, consumatore a letterale, `model-fg` scuro uguale a
`enum-fg`): 2/4/5/1/2/4 rossi, verde al ripristino in tutti e sei.
**Out-of-scope changes**: no — i due fogli token, la suite nuova, la sezione del DS che il
prompt inline aggiunge al perimetro, il referto.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`: il delta e' quattro dichiarazioni CSS.
**Smoke visivo**: passato — `_tmp_ds1_verify.ts` sull'app vera, girata DUE volte con lo
stesso file e i due fogli token riportati a `HEAD` per il giro before (non `git stash`: 10h
stava scrivendo in `instanceManagerTab.scss` nella stessa corsa): **before 27 PASS / 4 FAIL**,
**after 31 PASS / 0 FAIL**, zero errori di pagina in entrambi, due temi per giro. Le tre
superfici misurate a computed style: rail Properties `rgb(243,232,211)/rgb(107,81,16)`,
badge `m` dell'outline identico — vira per EREDITA', `instanceManagerTab.scss` non toccato —
e menu «New document» identico; in scuro `rgb(59,43,6)/rgb(228,201,146)` su tutte e tre. Il
gate percettivo passa: nel before `MODEL` e `METAMODEL` erano lo stesso pixel, nell'after
`model` legge oliva-oro contro il pesca di `enum` e il tortora di `literal`. Ritagli
`_tmp_ds1_{before,after}_{light,dark}_2_strip.png` e `_1_rail` / `_3_outline`.
**Notes**: I numeri del prompt sono stati ricalcolati da zero in OKLab, non copiati: tornano
tutti, pavimento compreso. Due correzioni alla sonda e non al prodotto, nel referto §4. Un
reperto per la slice a valle: il commento di `EditorV2.scss:797` motiva il proprio letterale
con l'alias che DS-1 ha appena falsificato. Con questa entry le attive salgono a 44: la
rotazione oltre le 40 resta dovuta come commit a se'.
**Prompt document name**: PROMPT_ds1_entity_model_amber.md — 2026-09-01 00:15

## 2026-09-01 — fix(manager): il confine fra il rail e la colonna centrale (10h)
**Prompt**: «Slice 10h — ritocchi visuali del manager, giro 1, micro, SERIALE»: (1) il rail
METACLASSES/VIEWS finisce senza confine contro il fondo desk della colonna centrale —
aggiungere la stessa hairline che divide il rail sinistro dell'app dal pannello Model
outline, MISURANDO quel bordo invece di inventarne uno, e facendo portare al rail la classe
separatore se esiste; (2) verificare che i TRE confini verticali del manager usino lo stesso
token, dichiararli nel referto, allineare chi diverge nella stessa corsa.
**Files touched**: `abstract/tabs/instanceManagerTab.scss`,
`abstract/tabs/__tests__/instanceManager10h.test.ts` (**nuovo**, 18 casi) e il referto
`docs/discovery/discovery_2026-09-01_10h_confini_manager.md` in `011d77476`; log a parte.
Un commit di codice, con pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, `EXIT=2`); `npm run build` exit **0**; vitest **2710 passati / 0 falliti** (2671 di
10g, piu' i 18 nuovi e i 21 di DS-1 in albero da un'altra sessione), 9 file rossi = i due
noti errori di collection `window is not defined` (monaco, `PerformanceMetrics.ts:220`),
nessuno di questa slice. Suite propria provata con SETTE mutazioni (via l'estensione a
`__main`, letterale al posto del token, 2px, `border-right` locale sul rail,
`--color-form-border-strong`, via il reset dei pannelli impilati, variabile CSS nel foglio):
2/3/3/3/3/1/1 rossi, verde al ripristino in tutte e sette.
**Out-of-scope changes**: no — il foglio del perimetro, la sua suite e il referto.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`: il delta e' un selettore esteso e una
dichiarazione sola in un foglio SCSS.
**Smoke visivo**: passato — `_tmp_10h_verify.ts` sull'app vera, fixture StateMachine/State/
Transition, girata DUE volte con lo stesso file e la slice in `git stash`: **before 21 PASS /
5 FAIL**, **after 26 PASS / 0 FAIL**, zero errori di pagina in entrambi; i 5 rossi del before
sono esattamente il blocco di contrasto. I tre confini dopo: `1px solid rgb(226,232,240)`
tutti e tre, letti sull'elemento che dipinge (`.leftbar` a destra, `__pane--classes` e
`__main` a sinistra); prima il terzo era `0px none`. Verificato ANCHE nel pixel, decodificando
i PNG: una colonna sola di `(226,232,240)` a x = 239 / 541 / 741, alle altezze y = 300/500/700
— nel before x=741 passava da bianco a `(248,250,252)` senza confine. Non-regressioni verdi in
ENTRAMBI i giri: fondo desk, card con bordo/raggio/ombra pari, filtro 6 -> 1 righe, badge
lettera di 10f, badge «C» 18x18, selezione a UNA riga (l'invariante di 10g); e i confini non
cambiano ne' sotto selezione ne' sotto filtro. Con l'outline chiuso il confine nuovo resta e
il rail, primo pannello, non prende bordo a sinistra. Ritagli
`_tmp_10h_{before,after}_{1_rest,2_selected,3_filtered,4_no_outline,5_dark}.png`.
**Notes**: due reperti, entrambi nel referto §2 e §5. `--color-border-subtle`, il token che
il prompt ipotizzava, NON esiste: stringa vuota sulla radice, e un `var()` su quel nome
avrebbe riprodotto il difetto. E il confine del rail dell'app (`dashboard.scss:990`) scrive
`#e2e8f0` LETTERALE: in chiaro nessuna divergenza di colore, in scuro resta chiaro mentre i
due del manager seguono il token. Non allineato: quel blocco e' tutto letterale e senza tema
scuro. Segnalato, fuori perimetro.
**Prompt document name**: prompt inline, nessun documento — 2026-09-01 00:20

## 2026-08-31 — fix(manager): un nodo per istanza nell'outline (10g)
**Prompt**: «Slice 10g — un nodo per istanza nell'outline, micro, SERIALE dopo 10f»: il
reperto di 10e (18 nodi per 12 istanze, la selezione ne accende due) va prima MISURATO —
quale delle tre ipotesi (ref non-containment camminate / `ownerOf` con piu' candidati /
istanza raggiungibile sia come root sia come figlio) — e poi corretto sulla regola «una
istanza rende UNA volta, sotto il suo owner di containment reale», riusando il resolver
condiviso se esiste. Chiesto anche un verdetto sulla nota di FL7 su `substates`.
**Files touched**: `editor-v2/hooks/outlineDraw.ts`,
`editor-v2/hooks/__tests__/outlineDraw.test.ts` (17 -> 30 casi) e il referto
`docs/discovery/discovery_2026-08-31_10g_outline_doppi.md` in `0277d7bf8`; log a parte.
Un commit di codice, con pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, `EXIT=2`); `npm run build` exit **0**; vitest **2671 passati / 0 falliti** (2658
di 10f piu' i 13 nuovi), 9 file rossi = i noti `window is not defined`, nessuno di questa
slice. Suite propria provata con SEI mutazioni (via il filtro `ownerOf`, via il dedup
`emitted`, via la sweep, sweep incondizionata, `emitted` solo oltre la radice, `broken`
filtrato come un vivo): 8/2/2/2/1/3 rossi, verde al ripristino in tutti e sei.
**Out-of-scope changes**: no — il modulo del perimetro, la sua suite e il referto.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori
D, zero `TRANSACTION`, zero `SetFieldAction`: il delta e' un filtro e una sweep dentro una
funzione pura di `idlookup`.
**Smoke visivo**: passato — `_tmp_10g_verify.ts` sull'app vera, girata DUE volte con lo
stesso file e la slice in `git stash`: **before 16 PASS / 8 FAIL**, **after 24 PASS / 0
FAIL**, zero errori di pagina in entrambi. Nodi a schermo **14 -> 12** su 11 istanze;
ripetute `Idle`x2/`Running`x2/`start`x2 -> **nessuna**; `Off`, che nel before **non
compariva affatto**, torna visibile una volta; il click su `Idle` accende **due** righe
prima e **una** dopo. Non-regressioni verdi in ENTRAMBI i giri: nodo modello primo, badge
lettera di 10f (`["S","T","m"]`), «+» presente, mono a destra su ogni istanza, form
montata. Ritagli `_tmp_10g_{before,after}_{1_rest,2_selected}.png`.
**Notes**: causa = ipotesi (c), ma per costruzione: radici da `father`, figli dai `values`,
due sorgenti che nulla faceva concordare. (a) e (b) escluse dalla misura. La nota di FL7 su
`substates` e' spiegata e fuori causa: `LReference.set_containment` RIFIUTA
l'auto-composizione (`father === type`) e restituisce `true`, quindi la shape dice il vero
e la correzione, se serve, sta nel core. Dettaglio nel referto §3.
**Prompt document name**: prompt inline, nessun documento — 2026-08-31 23:20

## 2026-08-31 — feat(manager): il badge lettera dell'outline, il vocabolario del rail (10f)
**Prompt**: «Slice 10f — badge lettera nell'outline, come il rail, micro, SERIALE»: ogni riga
sostituisce l'icona col badge quadrato lettera del DS (16×16, raggio 4, lettera 10/700),
lettera = iniziale maiuscola della metaclasse, coppia colore = `class` — un solo colore di
famiglia, la lettera distingue; nodo modello con badge `m` e coppia model. Riga e densita' di
10e invariate, classe in mono a destra invariata. Chiesto anche un verdetto sul chip
flottante `s0` dello screenshot.
**Files touched**: `abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss}`,
`abstract/tabs/__tests__/instanceManager10f.test.ts` (**nuovo**, 22 casi) e
`__tests__/instanceManager10e.test.ts` in `67f0d54a1`; log a parte. Un commit di codice, con
pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: 2026-08-31 22:20
**Causa**: (f)
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit **0**; vitest **2658 passati / 0 falliti** (2642 di 10e, meno
6 asserzioni invertite nella sua suite, piu' i 22 nuovi), 9 file rossi = i noti `window is not
defined`, nessuno di questa slice. Suite propria provata con 5 mutazioni (badge 16→18, via
`toUpperCase`, coppia model→class, esadecimale ambra nel foglio, `icon()` reintrodotta): 1
rosso ciascuna, verde al ripristino.
**Out-of-scope changes**: yes — `instanceManager10e.test.ts`, committato un'ora prima. Due dei
suoi describe asseriscono il glifo che questa slice toglie. Invertiti in asserzioni di ASSENZA
invece che cancellati, come 10c fece con `instanceManagerFl6.test.ts`: un test tolto non dice
niente il giorno in cui qualcuno riscrive la riga che aveva tolto. Le due cose che 10f non
tocca — i glifi di 10b spariti, il triangolo di 12d — restano positive.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`: il delta e' una regola SCSS, due funzioni pure in
`OutlinePanel` e un ternario nel JSX.
**Smoke visivo**: passato — `_tmp_10f_verify.ts` sull'app vera, fixture StateMachine/State/
Transition, girata DUE volte con lo stesso file e la slice in `git stash`: **before 15 PASS /
13 FAIL**, **after 28 PASS / 0 FAIL**, zero errori di pagina in entrambi. Badge istanza
`rgb(252,225,234)`/`rgb(122,64,86)` — gli stessi `rgb` del badge «C» del rail, letti nella
stessa corsa; badge modello `rgb(226,234,245)`/`rgb(69,86,111)`, cioe' NON ambra; 16×16 contro
i 18 del rail, raggio 4px dal token, 10px/700; lettere distinte `["S","T"]` (prima: `[null]`);
la collisione State/StateMachine misurata presente e risolta dalla colonna mono. Non-regressioni
verdi in ENTRAMBI i giri: righe 28px, insetti 14/30/46, hover `rgb(233,239,246)`, coppia di
selezione intera, mono 11px slate-500, «+» presente. Ritagli `_tmp_10f_{before,after}_*.png`.
Quattro asserzioni passano a vuoto nel «before» (confronti contro `null` e `every` su lista
vuota): valgono solo nell'«after», ed e' detto qui perche' non contino come contrasto.
**Notes**: il reperto e' di coordinamento, non di codice. Il prompt dichiarava «sessione
singola, seriale» e dava 10e per fatto; 10e era invece IN CORSO negli stessi due file —
scritture misurate alle 22:56:52 e 22:58:54, fra una mia lettura e la successiva. Fermato tutto
prima di scrivere una riga, e atteso `3ccd749b9`. Un commit con pathspec avrebbe portato il
diff non testato di 10e sotto il mio messaggio. Il chip `s0`: artefatto, il `title` nativo
della riga.
**Prompt document name**: prompt inline, nessun documento — 2026-08-31 22:55

## 2026-08-31 — feat(manager): l'outline nel DS, e una misura per la colonna centrale (10e)
**Prompt**: «Slice 10e — conformita' dell'outline + misura della colonna centrale, micro,
SERIALE»: icone da `entityMeta` col foreground della coppia di entita', nodo modello con
la sua coppia e nome 12/600, classe in mono 11 slate-500 (arbitrato A4), coppia di
selezione verificata, «+» raggiungibile da tastiera, riga 28px, indent 16, hover
`--color-bg-hover`; e le due card a `max-width: 1300px` centrate, con la tabella che
abbraccia il contenuto invece di riempire la pagina. Prima azione: rotazione del log.
**Files touched**: rotazione del log in `817da5e75` (`docs/claude-code-log{,-archive}.md`);
`abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss}` e
`abstract/tabs/__tests__/instanceManager10e.test.ts` (**nuovo**, 35 casi) in `3ccd749b9`;
referto in `00585d2eb`; log a parte. Tre commit, tutti con pathspec, indice verificato
vuoto prima e dopo ciascuno.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, `EXIT=2`); `npm run build` exit **0**; vitest **2642 passati / 0 falliti** (2607
prima piu' i 35 nuovi), 9 file rossi = i noti `window is not defined`, nessuno di questa
slice. Suite propria provata con 5 mutazioni (icona, min-height, hover, cinturino, flex):
2/1/1/1/1 rossi, verde al ripristino.
**Out-of-scope changes**: no — i due file del perimetro piu' la loro suite.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`: il delta e' regole SCSS, la funzione `icon` di
`OutlinePanel` e due modificatori di classe.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12/0/3**, corsa quiescente, un boot per
stato, `moved: nothing`; e NON probante per questa slice (nessuno stato di `states.ts`
monta il manager). La misura che la riguarda e' `_tmp_10e_verify.ts` sull'app vera, fixture
StateMachine/State/Transition, girata DUE volte con lo stesso file e la slice in `git
stash`: **before 36 PASS / 17 FAIL**, **after 53 PASS / 0 FAIL**, zero errori di pagina in
entrambi. Glifi `bi-diagram-3` `rgb(122,64,86)` sulle istanze e `bi-box` `rgb(69,86,111)`
sul modello (prima: tutti `rgb(15,23,42)`); righe 28px, insetti 14/30/46; hover
`rgb(233,239,246)`; «+» raggiunto al 68° Tab con `:focus-visible` vero; card a 1300 esatti
e centrate a 2200px di viewport; footer a 8px dall'ultima riga (prima: 388). Ritagli
`_tmp_10e_{before,after}_*.png`.
**Notes**: il reperto non era nella lista dei sette. La regola di 10b
`&__outline-icon { color: … }` e' (0,1,0) e **non dipinge**: `styles/style.scss:788`
dichiara `i.bi` a (0,1,1) e il glifo dell'albero E' un `<i class="bi">`. Morta da quando
e' stata scritta. Da qui il selettore a (0,3,0), che deve battere anche `i.bi:hover`. Per
esteso, con i tre difetti di sonda e il duplicato dell'outline (fuori scope), in
`docs/discovery/discovery_2026-08-31_outline_conformita_10e.md`.
**Prompt document name**: prompt inline, nessun documento — 2026-08-31 22:20

## 2026-08-31 — feat(manager): il fondo desk e le due card della colonna centrale (10d)
**Prompt**: «Slice 10d — sfondo e card del manager, micro, SERIALE»: la colonna a destra
del rail passa dal bianco pieno al fondo app; tabella e pannello form diventano due card
gemelle (bianco, raggio 12, hairline, ombra) separate dal fondo, testata dentro la card e
footer come suo bordo inferiore; il rail resta com'e'; il sottotitolo perde «Created from
the container's form». Solo chrome, zero logica.
**Files touched**: `abstract/tabs/{instanceManagerTab.scss,InstanceManagerTab.tsx}`,
`abstract/tabs/__tests__/instanceManager10d.test.ts` (**nuovo**, 17 casi),
`__tests__/instanceManager10c.test.ts` e `styles/tokens/_shadows.scss` in `10e6382d1`;
referto in `d7c64de5d`; log a parte. Due commit di contenuto, entrambi con pathspec,
indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit **0**; vitest **2607 passati / 0 falliti** (2590 prima piu'
i 17 nuovi), 9 file rossi = i noti `window is not defined`, nessuno di questa slice. Suite
propria provata con 5 mutazioni (fondo desk, ombra, bordo della form, footer non sbordato,
sottotitolo vecchio): 1 rosso ciascuna, verde al ripristino.
**Out-of-scope changes**: yes — `styles/tokens/_shadows.scss`, un file che il prompt non
nomina. Ci si arriva dalla Regola 28, che vuole le variabili CSS in `tokens/` e mai nel
foglio del componente, e da una misura: `--shadow-sm` e' dichiarato sia in `tokens/` sia in
`styles/tokens.css` con valori diversi, e a schermo dipingeva quello di tokens.css. Il
delta e' una riga per tema piu' il commento.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`: il delta e' regole SCSS, una riga di JSX che
legge un `useMemo` gia' esistente, e due file di test.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12/0/3**, corsa quiescente, un boot per
stato, `moved: nothing`; e NON probante per questa slice (nessuno stato di `states.ts` monta
il manager). La misura che la riguarda e' `_tmp_10d_verify.ts` sull'app vera, fixture
Heater/Cooler, girata DUE volte con lo stesso file e la slice in `git stash`: **before
15 PASS / 14 FAIL**, **after 29 PASS / 0 FAIL**, zero errori di pagina in entrambe. I 14
rossi del before sono il contrasto e sono le asserzioni della slice; i 15 verdi i controlli
positivi e le non-regressioni. `main.bg` `rgb(248,250,252)` con radice bianca e rail
trasparente; gronda 12 e stacco 12; footer `bottom` a `table.bottom-1` e largo
`table.w-2`; form collassata 34px con raggio e ombra, aperta 387px; riga espandibile 1,
ego 1, outline 18, overflow orizzontale 0.
**Notes**: un reperto vale il resto. `--shadow-sm` non dipinge `--shadow-sm`: e' fra i nomi
dichiarati due volte, e a schermo davano l'ombra di `tokens.css`. Trovato solo perche' la
sonda legge lo stile calcolato — leggere `_shadows.scss` e' leggere il comparatore (§5). Da
qui il ruolo nuovo `--shadow-desk-card`. Per esteso, col giro «before», in
`docs/discovery/discovery_2026-08-31_manager_chrome_10d.md`.
**Prompt document name**: PROMPT_10d_manager_chrome.md 2026-08-31 23:40

## 2026-08-31 — feat(manager): il rail, la testata, il footer e lo stato di riposo (10c)
**Prompt**: `docs/prompts/PROMPT_10c_manager_parity.md` — parita' di superficie con la
board: badge «C» e sezione VIEWS nel rail, testata a 24px con provenienza, filtro sul nome,
segmented sull'enum discriminante, indicatore delle colonne vuote, Export, footer con
conteggio e paginazione, preselezione della metaclasse piu' popolata, empty state unico,
pannello form collassabile. Motore invariato, A3 portata a termine. Seriale.
**Files touched**: `abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss,instanceTable.ts}`,
`abstract/tabs/__tests__/instanceManager10c.test.ts` (**nuovo**, 69 casi) e
`__tests__/instanceManagerFl6.test.ts` in `d448573ff`; referto, prompt e log in `docs/`.
Un commit di codice, con pathspec, indice verificato vuoto prima e dopo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit **0**; vitest **2590 passati / 0 falliti**, 9 file rossi = i
noti `window is not defined`, nessuno di questa slice. Suite propria 69/69, provata con 5
mutazioni (1/2/3/1/1 rossi, verde al ripristino).
**Out-of-scope changes**: yes — due file oltre i «tuoi». `instanceTable.ts`: la logica nuova
e' pura e nel TSX non sarebbe provabile (il file muore all'import sotto node, via monaco);
sono nove funzioni in coda, zero righe esistenti toccate. `instanceManagerFl6.test.ts`: due
asserzioni che 10c supera per costruzione — `colSpan` ora conta `shownColumns` (stessa
affermazione, nome nuovo) e «Unsaved changes», che FL6 asseriva presente, e' invertita in
un'asserzione di assenza invece che cancellata.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction` aggiunti: la slice legge la shape e la `idlookup`
che il tab gia' sottoscrive, e scrive solo stato locale di React.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12/0/3**, corsa quiescente, `moved:
nothing`, e NON probante per questa slice (nessuno stato di `states.ts` monta il manager).
La misura che la riguarda e' `_tmp_10c_verify.ts` sull'app vera, fixture `Heater` estesa con
un enum vero e una colonna mai valorizzata: **50 PASS / 0 FAIL / 0 errori di pagina**. Badge
18×18 con `rgb(252,225,234)`/`rgb(122,64,86)` — i token, non una palette locale; «warm» ∩
normal = 1 riga e «warm» ∩ final = 0 (un OR ne avrebbe date due); pannello form 33px
collassato → 372px espanso; paginazione assente a 6 righe, «Page 1 of 2» a 66.
**Notes**: quattro reperti e un punto aperto, per esteso in
`docs/discovery/discovery_2026-08-31_manager_parity_10c.md`. (1) Un'asserzione di ASSENZA non
puo' leggere i commenti. (2) L'A3 va scoped: «Discard» esiste anche nel multi-form di 12b,
dove un draft c'e' davvero. (3) La colonna `name` e' due cose, e l'indicatore nasconde la
feature. (4) `+ New` assente su `State` e' la regola rootable, non un difetto.
**Prompt document name**: PROMPT_10c_manager_parity.md 2026-08-31 22:40

## 2026-08-31 — feat(jjform): il nodo owner nell'ego-diagramma (FL7)
**Prompt**: `docs/prompts/PROMPT_FL7_ego_owner.md` — l'ego-diagramma della riga
espandibile guadagna il padre di contenimento: `owner` nel risultato, scatola
sopra-a-sinistra con sottoetichetta «owner», legame senza freccia, precedenza id
invariata, gruppo «owner» in testa al fallback testuale. Parallela a 10b.
**Files touched**: `jjform/{egoNeighborhood.ts,__tests__/egoNeighborhood.test.ts}`,
`abstract/tabs/{EgoDiagram.tsx,egoDiagram.scss,__tests__/egoDiagram.test.ts}`
(`3637bfbaa`); `abstract/tabs/InstanceManagerTab.tsx` (`b5112fddf`); referto,
prompt e log in `docs/`. Tre commit, tutti con pathspec, indice verificato vuoto
prima e dopo ciascuno. `jjform/index.ts` **non toccato**: nessun tipo nuovo
esportato, il barrel esporta gia' `Ego`, `EgoNode`, `EgoSide`, `EgoLayout`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su
output completo); `npm run build` exit 0; vitest **2520 passati / 0 falliti**,
9 file rossi = i noti errori all'import, nessuno di questa slice; suite proprie
**56/56** (39 al referto FL5), provate con 5 mutazioni (4/2/1/1/1 rossi, verde al
ripristino).
**Out-of-scope changes**: yes — `InstanceManagerTab.tsx` non e' fra i «file tuoi»
del prompt, che anzi elenca «la tabella» fra i file da non toccare; ma il prompt
chiede anche il gruppo «owner» nel fallback, che vive li'. Le due clausole non
possono valere entrambe: portata in chat prima di scrivere, scelta l'opzione
«farlo, in un commit separato» perche' la collisione con 10b resta una riga.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero
creatori D, zero `TRANSACTION`, zero `SetFieldAction` aggiunti: l'owner era gia'
nell'ingresso (`egoInputOf` passa `referencedBy` verbatim, contenimento incluso e
marcato) e il modulo lo scartava un rigo sotto. Nessun walk nuovo, nessuna
modifica alla firma delle prop, quindi il mount nella riga espandibile e' restato
fuori dal perimetro come il prompt prescrive.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12/0/3**, corsa quiescente, e
NON probante per questa slice (nessuno stato di `states.ts` monta il manager).
Cio' che la riguarda e' la sonda `_tmp_fl7_verify.ts` sull'app vera, fixture
`Heater` + `Cooler`: **20 PASS / 0 FAIL / 0 errori di pagina** — scatola owner
sopra (378<=464) e a sinistra (915<971) del soggetto, tooltip
`Owner: Heater : StateMachine — via states`, UNA retta senza `marker-end` in
`$slate-300` contro le sei frecce che la punta ce l'hanno, footer uguale alla
colonna referenced-by (4 e 4), `Off` con owner `Cooler` e non `Heater`, `Heater`
rootable senza scatola ne' linea, click che porta la form sull'owner, e a 900px i
gruppi `[owner, incoming, this object, outgoing]`.
**Notes**: tre scoperte. (1) `Region_main` non esiste nel codice: e' della board
13a, l'owner di `Running` e' `Heater`. (2) Caso non nominato: l'owner tagliato dal
cap riprende la banda, o sparirebbe dietro un «+n more». (3) Fuori perimetro:
`substates` (auto-riferimento) resta `composition: false` dove `states` diventa
`true`. Piu' l'incidente di concorrenza con 10b, chiuso senza perdite. Per esteso
in `docs/discovery/discovery_2026-08-31_fl7_ego_owner.md`.
**Prompt document name**: PROMPT_FL7_ego_owner.md 2026-08-31 21:15

## 2026-08-31 — fix(manager): l'outline di containment, ri-letto dopo FL6 (10b)
**Prompt**: «Slice 10b — outline di containment nel manager, PARALLELO a FL7»: pannello
«Model outline», riga con icona/nome/classe/«+», menu dei child-slot leciti, create dal
motore esistente, selezione condivisa, innesto da decidere misurando la struttura
post-FL6. **Reperto principale**: la slice e' gia' a terra dal 2026-08-30 (commit
`8c0caef49`, entry a `docs/claude-code-log.md:400`) e sopravvive intatta a FL5/FL6.
Undici clausole su tredici gia' soddisfatte, verificate una per una in tabella
nell'addendum al referto. Non rifatte: rifarle sarebbe riscrivere codice verificato
(Regola 3). Chiuse le due che mancavano davvero.
**Files touched**: `abstract/tabs/instanceManagerTab.scss` (una regola: la barra
`--color-selection-bar` sul nodo selezionato) e `abstract/tabs/__tests__/instanceManagerOutline.test.ts`
(**nuovo**, 15 casi) in `757d1057d`; l'addendum a
`docs/discovery/discovery_2026-08-30_outline_containment_10b.md` in `a60039bc3`; log a
parte. `InstanceManagerTab.tsx` **non toccato**.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo, exit 2 come da baseline); `npm run build` exit **0**; vitest **2503 passati / 0
falliti** (2488 prima piu' i 15 nuovi), 9 file rossi = i noti `window is not defined`,
nessuno di questa slice. La sola asserzione sul foglio provata per mutazione: tolta la
`box-shadow`, 1 rosso; ripristinata, 15 verdi.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro; zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction`. Il delta e' una regola SCSS e un file di test.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12/0/3**, corsa quiescente, un boot per
stato, `moved: nothing`; e NON probante per questa slice (nessuno stato di `states.ts` monta
il manager: dice che nulla e' regredito). La misura che la riguarda e' il CSS emesso da
`npm run build`, dove la regola compare come
`.instance-manager__outline-node--selected{background:var(--color-selection-bg);box-shadow:inset 2px 0 0 var(--color-selection-bar)}`.
**Notes**: Due incidenti. (1) Tipo del commit non nel prompt: scelto invece di chiederlo
(deroga a P6). (2) `git add` piu' `git commit` nudo ha inglobato cinque file messi in indice
da FL7 fra il mio controllo e il mio add — la patologia di §6.1. Rilevato subito,
`reset --soft`, indice di FL7 restituito intatto, ricommit con pathspec. Divergenza aperta
sul mono della metaclasse: addendum A4 del referto.
**Prompt document name**: 10b (prompt in chat, non depositato) 2026-08-31 20:45

## 2026-08-31 — feat(manager): la form sotto la tabella e la riga espandibile (FL6)
**Prompt**: `docs/prompts/PROMPT_FL6_manager_layout.md` — la form lascia la quarta
colonna e prende il pannello sotto la tabella (contenuto a 1300px centrato); la riga
diventa espandibile e ospita l'ego-diagramma di FL5; l'aside del vicinato di 13a viene
rimosso; fallback a lista testuale sotto una soglia MISURATA; export di
`egoNeighborhood` nel barrel.
**Files touched**: `jjform/index.ts`;
`editor-v2/hooks/{neighborhoodDraw.ts,__tests__/neighborhoodDraw.test.ts}`;
`abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss,__tests__/instanceManagerFl6.test.ts}`
(l'ultimo NUOVO); piu' referto e prompt in `docs/`. Regola 19 **rispettata**: sei file
elencati in chat con cosa cambia in ciascuno, go-ahead ricevuto. Due commit, pathspec,
indice verificato vuoto prima e dopo ciascuno.
**Outcome**: ✅ completed
**Corregge**: 2026-08-31 18:37 — FL5, di cui questa slice innesta il componente rimasto
scollegato (suo punto aperto 1) e chiude anche i punti 2 (fallback) e 4 (barrel).
**Causa**: a
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit 0; vitest **2488 passati / 0 falliti**, 9 file rossi = i
noti `window is not defined`, nessuno di questa slice; suite proprie **54/54**, provate
con 7 mutazioni (7 rossi, verde al ripristino).
**Out-of-scope changes**: no — i sei file sono quelli concordati. `EgoDiagram.tsx` NON
toccato (fuori scope per il prompt): il suo import per path resta, ed e' l'ultima riga
aperta del punto 4 di FL5.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori
D, zero `TRANSACTION`, zero `SetFieldAction` aggiunti: `egoInputOf` e' pura e legge
`makeDrawReadCtx` + `filledSlotValues` + `referencedBy`, le tre sorgenti che 13a componeva
gia'. Nessun walk nuovo.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12/0/3**, corsa quiescente, e NON
probante per questa slice (nessuno stato di `states.ts` monta il manager: dice che nulla
e' regredito). Cio' che la riguarda e' la sonda `_tmp_fl6_verify.ts` sull'app vera,
fixture Heater: **24 PASS / 0 FAIL / 0 errori di pagina** — form sotto la tabella e
centrata a <=1300px, aside assente, una sola riga espansa col nastro, il click su un
vicino sposta selezione+espansione+form, il fallback stretto rende la lista senza
scorrimento (residuo 0px), la create passa ancora dalla sua dialogue. Misura di contorno:
il CSS emesso contiene ora **31** occorrenze di `ego-diagram` (erano **0** al referto FL5,
perche' nulla importava il componente) e **0** di `pane--graph`.
**Notes**: due clausole del prompt non erano applicabili come scritte, entrambe risolte e
dichiarate — Save/Discard senza motore (la form scrive diritto; deciso in chat: resi nome,
metaclasse, badge e Delete) e la riga 1 attesa, che somma 15 su 12 con `kind` stringa e
vale con `kind` corta (dimostrato ritipizzandola). Due difetti CSS veri trovati dalla
sonda, chiusi. Per esteso in
`docs/discovery/discovery_2026-08-31_fl6_riassetto_manager.md`.
**Prompt document name**: PROMPT_FL6_manager_layout.md 2026-08-31 19:30

## 2026-08-31 — feat(manager): l'ego-diagramma a un salto della riga espandibile (FL5)
**Prompt**: `docs/prompts/PROMPT_FL5_ego_diagram.md` — il vicinato di un'istanza come
nastro fisso incoming → oggetto → outgoing dentro la riga espansa della tabella del
manager. Modulo puro `egoNeighborhood.ts`, componente di resa con frecce SVG a ventaglio,
cap a 4 per lato con nodo sintetico «+n more», click = selezione. Parallelo a FL4, file
contesi dichiarati.
**Files touched**: `jjform/{egoNeighborhood.ts,__tests__/egoNeighborhood.test.ts}`;
`components/abstract/tabs/{EgoDiagram.tsx,egoDiagram.scss,__tests__/egoDiagram.test.ts}`
— tutti NUOVI, `7289443ba`; referto e prompt `7fa39ed37`. Tre commit, pathspec, indice
verificato vuoto prima e dopo ciascuno. Regola 19 **rispettata**: 8 file elencati in chat
con cosa cambia in ciascuno, go-ahead ricevuto sulle due domande aperte. **Zero file
esistenti modificati**: i tre contesi (`jjform/index.ts`, `IRForm.tsx`,
`irFormStyle.scss`) non sono toccati, e nemmeno `InstanceManagerTab.tsx` — vedi Notes.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: a
**Regressions**: no — nessun file esistente modificato, zero token toccati; `npm run test`
2456 passati / 0 falliti (9 file rossi = i noti `window is not defined`, nessuno di questa
slice); `npm run smoke` GREEN 12/0/3, corsa quiescente.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro, zero creatori D,
zero TRANSACTION, zero SetFieldAction. Il modulo ha un import solo, di tipo, da `./shape`;
il componente riceve due callback e non sa in cosa scrivono, e non importa niente da
`editor-v2/`, `joiner/` o `redux/` (asserito nel test, con positivo di controllo).
**Smoke visivo**: non applicabile — `EgoDiagram` non e' montato da nessuna superficie
(l'innesto e' bloccato, vedi Notes), quindi non c'e' pixel da guardare: **misurato**, il CSS
emesso da `npm run build` contiene **0** occorrenze di `ego-diagram`, perche' nulla importa
il componente. Il foglio e' verificato a parte con `npx sass`, exit 0, 32 regole. Smoke
girato lo stesso, GREEN 12/0/3, a dimostrare che nulla e' regredito. Gate a 3 valori:
`npm run typecheck` **33** (baseline invariata, conteggio su output completo),
`npm run build` exit **0**, vitest **39/39** sulle due suite nuove.
**Notes**: ⚠️ per l'innesto: la riga espandibile NON esiste (`InstanceManagerTab.tsx:1747`
rende un tbody piatto, form nel pannello destro), e il file che la ospiterebbe confina con
FL4. Non innestato e dichiarato, come il prompt prescrive e come confermato in chat.
`Manager Admin Form Bottom.dc.html` non e' nel repo (RC-10): terzo board di questo handoff.
Quattro punti aperti e le 5 mutazioni (5 rossi) in
`docs/discovery/discovery_2026-08-31_fl5_ego_diagramma.md`.
**Prompt document name**: PROMPT_FL5_ego_diagram.md 2026-08-31 18:37

## 2026-08-31 — feat(editor-v2): l'auto-layout della form, cucito (FL4)
**Prompt**: `docs/prompts/PROMPT_FL4_integration.md` — cucire i tre moduli nel renderer
della IRForm: griglia a 12 colonne da FL1, tema da FL2, widget dal registro di FL3.
Overflow dei multi misurato a runtime con isteresi, nessuna width per-campo e nessuna
opzione di layout nella UI, riconciliazione dei due `FormTheme`, emendamento regola 2
(readOnly non si stretcha), stessa geometria per la form di edit e per il draft di create.
**Files touched**: `jjform/{layout.ts,__tests__/layout.test.ts}` (`b3da09dba`);
`editor-v2/viewpoint/ir/{formAutoLayout.ts,useChipOverflow.ts,__tests__/formAutoLayout.test.ts,IRForm.tsx,IRFormField.tsx,useFormWidgets.ts,irFormStyle.scss}`
e `abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss}` (`beeea12ae`);
`docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md` piu' i tre
`PROMPT_FL{2,3,4}*.md` untracked (`349b32961`). Tre commit, tutti con pathspec e indice
verificato a mano prima di ciascuno. `jjform/index.ts` **non toccato**: FL4 non aggiunge
export al barrel, quindi la lezione del fan-out FL1/FL2 non aveva nulla da coordinare.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` **33** (baseline invariata, conteggio su output
completo); `npm run build` exit 0 (solo chunk-size preesistente); vitest **2442 passati /
0 falliti**, 9 file rossi = i noti `window is not defined`, nessuno di questa slice; le due
suite proprie 40/40 e 32/32.
**Out-of-scope changes**: yes — `useFormWidgets.ts` e i due file di
`abstract/tabs/` non erano nominati nel prompt. Il primo perche' il rung 2 della scala
(`jjodel/renderer=…`) non era raggiungibile senza portare le annotazioni sul descrittore
(due proprieta' aggiunte, `featureId` e `annotations`, nessuna esistente toccata); i secondi
perche' il test atteso «la form del draft di create e la edit usano lo stesso layout» non e'
verificabile senza toccare la `DraftDialog`, che e' li'. Nessun altro file allargato.
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro. Zero creatori D,
zero `TRANSACTION`, zero `SetFieldAction` aggiunti: le scritture restano quelle gia'
committate di `formWrite.ts`, raggiunte dagli stessi due indirizzi `(objectId, field.name)`.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12 passed / 0 failed / 3 skipped**,
«quiescent run, single boot per state». La prima corsa era uscita **VOID** («the tree moved
under the run: added src/components/abstract/tabs/__tests__/egoDiagram.test.ts»): causa
accertata, la sessione FL5 parallela sull'ego-diagramma, non questa slice; ripetuta ad albero
fermo dopo i tre commit. Il VOID e' riportato, non nascosto (P8). Non probante per la
geometria: nessuno stato di `states.ts` monta una form, quindi lo smoke dice che nulla e'
regredito e non che la griglia sia giusta. Misura che invece la riguarda: il CSS emesso da
`npm run build` contiene ora **16** occorrenze di `ir-datefield` e **6** di
`ir-chipinput__pill`, che in FL3 erano **0** perche' nulla importava il registro — l'innesto
e' verificato dal bundle, non dedotto.
**Notes**: Due pixel cambiati su superficie committata, voluti e commentati nei file:
`.ir-form__group` passa da 12px a `--ir-form-row-gap` (14px), perche' e' la density di FL2 a
governare il ritmo; `.ir-form--compact` ridichiara `--ir-form-label-col: 88px`, senza cui la
regola nuova per `labelPlacement: left` vincerebbe per specificita'. Regola 19: 12 file
elencati a fine sessione, non prima — nessun interlocutore in background.
**Prompt document name**: PROMPT_FL4_integration.md 2026-08-31 18:45

## 2026-08-31 — feat(editor-v2): i widget estesi come gemelli write-side (FL3)
**Prompt**: `docs/prompts/PROMPT_FL3_widgets.md` — i widget estesi della form come
meta' write delle Row view: date/datetime, duration, color, @email, @url, textarea
che cresce, chip input per tags e multi-ref. Logica pura in `jjform/`, registro
`{ nome: componente }` che FL4 cuce, quattro stati per widget. Parallelo a FL1/FL2,
file disgiunti.
**Files touched**: `jjform/{widgetValue.ts,__tests__/widgetValue.test.ts}`;
`editor-v2/viewpoint/ir/widgets/{widgetProps.ts,DateWidget.tsx,DurationWidget.tsx,ColorWidget.tsx,ValidatedTextWidget.tsx,GrowTextWidget.tsx,ChipInputWidget.tsx,index.ts,formWidgets.scss,__tests__/extendedWidgets.test.ts}`;
`styles/tokens/{_colors-light.scss,_colors-dark.scss}` (+2 ruoli, solo aggiunte).
Tre commit, pathspec: `d60275228` (modulo puro, anticipato — vedi Causa),
`1c5bfb01e` (widget + registro + stile + test + token), `7db1ed8bf` (referto).
Regola 19 **rispettata**: 16 file elencati in chat con cosa cambia in ciascuno,
go-ahead ricevuto con le tre ratifiche. **Zero widget esistenti toccati**:
`TextWidget` e `ChipsWidget` restano come sono, e il perche' e' nelle testate dei due
componenti nuovi che li affiancano. `irFormStyle.scss` **non toccato**: e' di FL2.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: e
**Regressions**: no — nessun file esistente modificato salvo i due di token, in sola
aggiunta; `npm run test` 2382 passati / 0 falliti (9 file rossi = i noti
`window is not defined`, nessuno di questa slice); `npm run smoke` GREEN 12/0/3.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro, zero
creatori D, zero TRANSACTION, zero SetFieldAction: i widget ricevono callback e non
sanno in cosa scrivono. Nessuno importa `joiner/`, per costruzione.
**Smoke visivo**: non applicabile — i widget non sono ancora innestati nel renderer
(l'innesto e' FL4), quindi non c'e' pixel da guardare: misurato, il CSS emesso da
`npm run build` contiene **0** occorrenze di `ir-datefield`/`ir-chipinput__pill`,
perche' nulla importa ancora il registro. Il foglio e' verificato a parte con
`npx sass`, exit 0, 81 regole. `npm run smoke` girato lo stesso, GREEN 12/0/3, a
dimostrare che nulla e' regredito. Gate a 3 valori: `npm run typecheck` **33**
(baseline invariata, conteggio su output completo), `npm run build` exit **0**,
vitest **71/71** sulle due suite nuove.
**Notes**: Causa (e): `c98f47d3c` (FL2) ha inglobato la modifica non committata di
questa sessione a `jjform/index.ts`, lasciando HEAD a esportare da un
`./widgetValue` non tracciato — un checkout pulito non compilava. Chiuso committando
subito il modulo puro. Reperto §F12. Le 39 verdi al primo colpo sono state messe
alla prova con due mutazioni: 3 rossi, i tre attesi. `@url` nasce senza gemello read
(§F5), dichiarato e asserito nel test. Referto:
`docs/discovery/discovery_2026-08-31_fl3_widget_estesi.md`.
**Prompt document name**: PROMPT_FL3_widgets.md 2026-08-31 16:58

## 2026-08-31 — feat(jjform): i temi della form come preset in cascata (FL2)
**Prompt**: `docs/prompts/PROMPT_FL2_themes.md` — un tema e' un preset nominato su
ESATTAMENTE tre campi (`labelPlacement`, `density`, `sectionStyle`), quattro preset dalla
tabella della spec, `resolveTheme` che fonde PER CAMPO nella stessa cascata degli altri
style field (metamodello → viewpoint → per-classe), costanti nominate per la resa. Modulo
puro in `jjform/`. Fuori scopo dichiarato: packing (FL1), widget (FL3), UI di scelta.
**Files touched**: `frontend/src/jjform/themes.ts` e
`frontend/src/jjform/__tests__/themes.test.ts` (nuovi, `eb49bed4e`);
`frontend/src/jjform/index.ts` (soli export in coda, `c98f47d3c`);
`docs/discovery/discovery_2026-08-31_fl2_temi_form.md` (`01eb50051`). Quattro file, tre
commit, tutti con pathspec e indice verificato vuoto prima e dopo ciascuno.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun consumatore esiste ancora (FL4 e' il primo); `npm run smoke`
GREEN 12/0/3 su corsa quiescente, `npm run build` verde.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro; il modulo ha
ZERO import, quindi zero propagazione a D-layer, L-layer, sync, JjOM o persistenza.
**Smoke visivo**: passato — `npm run smoke` **GREEN 12 passed / 0 failed / 3 skipped**,
«quiescent run, single boot per state». Una prima corsa era uscita **VOID** («the tree
moved under the run: modified src/jjform/index.ts»): causa accertata, la sessione FL1
parallela che scriveva sullo stesso `index.ts`; ripetuta a albero fermo dopo il commit di
FL1. Il VOID e' riportato, non nascosto (P8). Gate a 3 valori sull'albero corrente:
`npm run typecheck` **33** (baseline invariata, conteggio su output completo, exit 2 come
da baseline), `npm run build` verde (solo chunk-size preesistente), vitest **2311/0**
(9 file rossi = i noti `window is not defined` di monaco, zero test eseguiti in essi).
Unita' proprie: `themes.test.ts` **26/26**.
**Notes**: Due reperti, entrambi in `discovery_2026-08-31_fl2_temi_form.md` (§3, §2).
(1) `FormTheme` esiste gia', `irTypes.ts:211`, altro significato e letterali DEFINITIVI
(R-B9): non toccato, i due tipi convivono in moduli diversi come gia' `AccentPlacement`;
riconciliarli e' di FL4. (2) La board dichiarata autoritativa, `Form Auto Layout.dc.html`,
non esiste in repo; prompt e spec concordano sui preset, quindi non blocca. Le 26 unita'
girate contro sei versioni difettose: 1, 3, 2, 1, 1, 2 rossi.
**Prompt document name**: PROMPT_FL2_themes.md 2026-08-31 10:40

## 2026-08-31 — feat(jjform): registro delle width e packer del form auto-layout (FL1)
**Prompt**: `docs/prompts/PROMPT_FL1_widthmap_packing.md` — registro tipo→`{span, widget}`
e packing a 12 colonne come modulo PURO in `jjform/`, sulla specifica ratificata
`docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`. Fuori scopo
dichiarato: temi (FL2), widget (FL3), rendering e misura dell'overflow (FL4).
**Files touched**: `frontend/src/jjform/layout.ts` (nuovo),
`frontend/src/jjform/__tests__/layout.test.ts` (nuovo, 37 unita'),
`frontend/src/jjform/index.ts` (solo il blocco di export FL1) — commit `5fafd3ecf`,
pathspec esplicito. `index.ts` e' condiviso con la sessione FL2 in volo: committata la sola
mia parte con il pattern §6.1 (checkout HEAD, riapplico il mio blocco, commit, ripristino
la copia combinata), quindi il blocco `themes` di FL2 resta nel working tree e non e' entrato
nel mio commit. Log, prompt e referto in due commit docs a parte.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: a
**Regressions**: no — `npx tsc --noEmit` **33** (baseline invariata, conteggio su output
completo), `npm run build` verde (solo il warning chunk-size preesistente), vitest su
`src/jjform` **216/0** su 9 file (le 37 nuove piu' le 179 preesistenti, temi di FL2 inclusi).
Modulo non ancora cablato da nessuna superficie: l'integrazione e' FL4.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro; `jjform/` non
importa nulla, zero creatori D, zero `TRANSACTION`, zero `SetFieldAction`.
**Smoke visivo**: passato — `npm run smoke` GREEN 12/0/3, run quiescente. Non probante per
questa slice: nessuno stato di `states.ts` monta una form, e FL1 non ha superficie visiva.
**Notes**: ⚠️ per tre divergenze fra le «righe attese» del prompt e le regole della
specifica, che il modulo segue: span di `kind`, il «buco 3» contro la regola 2, e `tags`+
`outgoing` in due sezioni. `Form Auto Layout.dc.html`, dichiarato autoritativo dalla
specifica, non esiste nel repo. Misure, positivo di controllo e domande aperte in
`docs/discovery/discovery_2026-08-31_fl1_divergenze_righe_attese.md`.
**Prompt document name**: PROMPT_FL1_widthmap_packing.md 2026-08-31 11:05

## 2026-08-31 — feat(manager): il riquadro di vicinato nel manager (13a)
**Prompt**: «13a: il riquadro di vicinato nel manager», dato in chat e non depositato in
`docs/prompts/`, a valle della ratifica di design R-13A-1 e del disegno
`13a Diagramma Embedded.dc.html` **opzione 1a** (untracked a inizio sessione, committato con
il referto). Perimetro dal prompt: vista derivata dallo store — owner a 1 livello, refs
uscenti a 1 salto, referenced-by entranti dalla risalita di 2b — read-only piu' navigazione,
nodi resi col motore che esiste (`detectValueRenderer`), click = terzo emettitore di
`subjectId`, «Open in canvas» come innesto del canvas vero. Fuori scopo dichiarato: drag,
edge-draw, create dal riquadro, layout persistito, piu' di 1 salto, 1b intero.
**Files touched**: `jjform/{neighborhood.ts,index.ts,__tests__/neighborhood.test.ts}`,
`editor-v2/hooks/{neighborhoodDraw.ts,neighborhoodAdapter.ts,__tests__/neighborhoodDraw.test.ts}`,
`abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss}` (commit `f17241936`);
`docs/discovery/discovery_2026-08-31_vicinato_manager_13a.md` + il disegno in `5cf0a7b49`;
log a parte. Otto sorgenti: Regola 19 **rispettata** — elenco presentato in chat con cosa
cambia in ciascuno, e conferma ricevuta (con le tre scelte di design: quinto pannello a
destra del dettaglio, primo attributo non-`name` come valore saliente, attesa ~2 s senza
toast). Sonde `frontend/scripts/smoke/_tmp_13a_verify.ts`, `_tmp_13a_race.ts` e i tre png
(non committate, gitignored). Ogni commit con pathspec; `git status --porcelain` e indice
verificati prima: indice vuoto, l'albero portava solo i `docs/prompts/*` untracked d'inizio
sessione. **`docs/decisions.md` non toccato**: e' della parallela dichiarata dal prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — le tre superfici esistenti invariate: la collezione della tabella non
cambia al click sul riquadro («Config · 3 instances» prima e dopo), l'outline segue la stessa
selezione, `npm run smoke` GREEN 12/0/3, zero errori di pagina.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 nel perimetro (`viewpoint/ir/` e
`useJjomSync.ts` letti, mai scritti), zero creatori D, zero `TRANSACTION`, zero
`SetFieldAction`: il riquadro legge. L'unica scrittura del gesto e' un CustomEvent.
**Smoke visivo**: passato — `_tmp_13a_verify.ts`, **27 controlli ALL GREEN**, zero errori di
pagina: pannello montato come quinto (`outline|classes|table|detail|graph`), uscenti a destra
con la chiave `cfg` sull'arco, entranti a sinistra, owner sopra e incolonnato con la chiave
`kids`, nodo broken col token della tabella, istanza sola con la frase, click su un vicino che
muove form+tabella+outline, riparentamento riflesso, «Open in canvas» che seleziona il
VERTICE (controllo negativo: non l'id dell'oggetto). Piu' `npm run smoke` GREEN.
Gate a 3 valori: `npx tsc --noEmit` **33** (baseline invariata, conteggio su output completo),
`npm run build` verde (solo il warning chunk-size preesistente), vitest **2248/0** (+34 unita',
9 file rossi = i noti `window is not defined`).
**Notes**: Ipotesi di Fase 1 falsificata in Fase 2 e misurata: l'evento `SELECT_NODE` esiste
ma il suo spazio di id e' quello dei VERTICI, e il vertice nello store non basta — compare a
532 ms mentre il nodo React Flow entra nel DOM a 949 ms, e un dispaccio nel mezzo va perduto.
L'adapter aspetta il nodo montato. Reperto collaterale non toccato (Regola 1): la Tree View
emette l'id del DObject, quindi la sua selezione su canvas per le istanze M1 non puo'
funzionare. Referto §6 e §11.
**Prompt document name**: prompt inline (non depositato) 2026-08-31 01:00

## 2026-08-31 — fix(editor-v2): la firma del badge salta le pendenti
**Prompt**: «Micro: la firma del badge salta le pendenti», dato in chat e non depositato in
`docs/prompts/`. Applicare il fix (b) ratificato da `discovery_2026-08-31_badge_riconciliazione.md`
§5: una riga nel `useSelector` di `UniquenessProblemSync`, le chiavi pendenti (non proprie)
saltate dalla firma. `includePending` resta `false` (R-BDG-2/R-TCK-2, R-GT-2 intatto). Piu' la
correzione di R-M2U-6 in `decisions.md`, commit docs separato.
**Files touched**: `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` (la
riga `hasOwnProperty` piu' la nota in testa, che descriveva il difetto come «ritardo di una
scrittura»), `docs/decisions.md`, `docs/claude-code-log.md`. Sonda
`frontend/scripts/smoke/_tmp_badge_fix_verify.ts` (non committata, gitignored). Due commit,
pathspec; indice verificato vuoto prima, albero coi soli `docs/prompts/*` untracked d'inizio
sessione — nessuna sessione parallela.
**Outcome**: ✅ completed
**Corregge**: 2026-08-30 22:55 (S1-M2, il limite R-M2U-6 «ritardo di una scrittura»)
**Causa**: c
**Regressions**: no — le celle D4R/L4R/L4Rn restano a 4 come prima, M1 e M2; controllo negativo
(2 create con nomi distinti) registro fermo a 0; zero errori di pagina.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 toccato, nessun creatore, nessuna
TRANSACTION, nessuna SetFieldAction: sola lettura sul D-layer dentro un `useSelector`.
**Smoke visivo**: passato — `_tmp_badge_fix_verify.ts`, M2 e M1, 5 celle per livello, **0 FAIL**.
Gate a 3 valori: `npm run typecheck` **33** (baseline invariata, conteggio su output completo),
`npm run build` verde (solo il warning chunk-size preesistente),
`m2NameUniqueness.test.ts` **39/39**.
**Notes**: Causa (c): la diagnosi «`idlookup` e' un Proxy che non elenca le pendenti» era
un'assunzione, falsificata due volte a misura. Test = cella D2 senza poke: registro **2 gia' a
200 ms**, M2 e M1 (prima: 0 a oltranza); sulla stessa corsa la firma vecchia e' inerte al commit
(`-1068118749 -> -1068118749`), la nuova cambia. Costo sul diff (150/154 chiavi): M2 0.042
ms/chiamata contro 0.053, M1 0.0405 contro 0.0395 — pari, come il referto prevedeva.
**Prompt document name**: prompt inline (non depositato) 2026-08-31 00:57

## 2026-08-31 — docs(discovery): il ritardo del badge, riconciliato in una corsa
**Prompt**: «Riconciliazione: il ritardo del badge, due misure opposte», dato in chat e non
depositato in `docs/prompts/`. Le due misure del 31-08 sullo stesso scenario con esiti opposti —
sessione A (`_tmp_m2u6_verify.ts`, non committata): registro pieno senza scrittura successiva;
sessione B (referto `0d2354da9` §4): registro 0 a 9 s. Tre richieste: una sonda che copra
entrambe le forme variando UNA variabile alla volta, la spiegazione del reperto di A
(`addObject({}, classId, true)` che non ritorna), e il verdetto con la causa vera e il fix col
costo. **Solo discovery: zero fix.**
**Files touched**: `docs/discovery/discovery_2026-08-31_badge_riconciliazione.md` (nuovo),
`docs/claude-code-log.md`. Sonde `frontend/scripts/smoke/_tmp_badge_recon.ts` e
`_tmp_badge_recon2.ts` (non committate, gitignored). **Zero file sorgente toccati.** Commit con
pathspec; `git status --porcelain` e indice verificati prima: indice vuoto, l'albero portava solo
i `docs/prompts/*` untracked d'inizio sessione — nessuna sessione parallela.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (sola lettura)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (nessun file di §3.1 toccato; sola lettura)
**Smoke visivo**: non applicabile — nessun cambiamento da guardare. Le due sonde girano
sull'app viva, 2 livelli x 5 celle piu' 15 campioni a 200 ms: **0 FAIL, zero errori di pagina**.
**Notes**: Non sono in conflitto: sono due celle. L'unica variabile che ribalta l'esito e' una
scrittura di nome DOPO la create — A ne aveva una (la rinomina, che su una pendente si posa un
tick dopo). Numero, livello, porta e slot: misurati inerti. Causa: non l'enumerazione — la firma
e' gia' finale nel tick della create e non cambia piu' al commit. Notifica mancata, non ritardo.
`detect` a mano rende 2 col registro a 0. Fix e costo in §5 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-31 00:00

## 2026-08-31 — fix(core): il namespace vede le create del proprio tick
**Prompt**: «Tick-fix: defaultname vede le create del proprio tick», depositato in chat, a valle
di `discovery_2026-08-30_uniqueness_m2.md` §5(b) e `discovery_2026-08-30_s1m2_una_regola.md` §3.
L'ipotesi che portava — «`idlookup` e' un Proxy la cui enumerazione non elenca le pendenti,
rendile enumerabili» — **e' stata falsificata dalla Fase 1 e il prompt lo prevedeva**: `idlookup`
non e' un Proxy, e' un oggetto il cui `__proto__` e' `DPointerTargetable.pendingCreation`
(`reducer.ts:639`), e il `for...in` le pendenti **le elenca gia'** (115 contro 112 own key,
misurato). Cio' che non le vede sono le **collezioni** da cui ogni namespace e' costruito
(`pkg.classes` 6->6, `pkg.children` 8->8, `childNames` senza il nome nuovo, nello stesso tick).
Il fix resta alla fonte — un indice delle pendenti letto dove il namespace e' **deciso** — ma
**non tocca `idlookup`**, quindi nessun censimento dei suoi lettori era dovuto.
**Files touched**: `frontend/src/model/logicWrapper/nameUniqueness.ts` (`pendingChildrenOf`,
`NamespaceOptions.includePending`, innesto in `getNamespaceOf` e `getM2NamespaceOf`, opt-out nei
due `detect*`), `frontend/src/joiner/classes.ts` (`defaultname`, **una** implementazione per 35
chiamate), `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` (solo commento:
la diagnosi «Proxy» era sbagliata, e la scelta del badge e' ora dichiarata),
`frontend/src/model/__tests__/m2NameUniqueness.test.ts` (+17 unita', +`DPointerTargetable` nel
mock). Piu' `docs/discovery/discovery_2026-08-31_tick_fix_defaultname.md`. Quattro sorgenti,
sotto la Regola 19. Sonde non committate: `_tmp_tick_recon.ts`, `_tmp_tick_recon2.ts`,
`_tmp_tick_verify.ts` (19/0), `_tmp_tick_import.ts` (7/0), `_tmp_tick_residue.ts`.
**Outcome**: ✅ completed
**Corregge**: 2026-08-30 22:55 (S1-M2, la diagnosi del Proxy)
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessuno dei quattro file e' in §3.1, e non c'e' nessun
percorso di scrittura D: `pendingCreation` e' letto e mai scritto, zero creatori, zero
`TRANSACTION`, zero `SetFieldAction`. Il quadro dei layer sta comunque nel referto §3 e nella
chiusura in chat, ma non e' stato scritto prima del diff e non lo dichiaro come tale.
**Smoke visivo**: passato — `npm run smoke` 12/0/3 VERDICT GREEN, corsa quiescente, un boot per
stato, `moved: nothing`.
**Notes**: 4 `addClass()` in un tick danno `Concept_0..3`; a tick separati identico a oggi. Il
badge resta **INVARIATO** per scelta (`detect*` lascia `includePending` a `false`): un parse
tiene tutto in `pendingCreation` fino a `persist`, R-GT-2, e contarlo lampeggerebbe a ogni
import. Variante misurata e non spedita. Gate: tsc 33 = baseline, build 0, vitest 2214/0 (+17),
smoke GREEN, 4 mutazioni -> 8/2/3/1 rossi. Misure, import e limiti nel referto citato.
**Prompt document name**: Tick-fix defaultname (in chat) 2026-08-31 00:00

## 2026-08-31 — docs(discovery): l'import Ecore da UI e' vivo, misurato dal gesto
**Prompt**: «Discovery: l'import Ecore da UI e' morto end-to-end?», dato in chat e non depositato in `docs/prompts/`. Quattro domande: la catena anello per anello, da quando, l'inventario per rianimare il legacy, e se il test end-to-end di `parseDAnnotation` diventa scrivibile. Zero fix dichiarati nel prompt.
**Files touched**: `docs/discovery/discovery_2026-08-31_import_ecore_catena.md` (nuovo), `docs/claude-code-log.md`. Sonde `frontend/scripts/smoke/_tmp_ecore_chain.ts`, `_tmp_ecore_converters.ts`, `_tmp_ecore_converters2.ts` e `_tmp_ecore_chain.png` (non committate, gitignored). Zero file sorgente toccati. Commit con pathspec; `git status --porcelain` e indice verificati prima: indice vuoto, nessuna sessione parallela sui miei file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (nessun file di §3.1 toccato; sola lettura)
**Smoke visivo**: passato. `_tmp_ecore_chain.ts` guida il gesto reale — «Import» -> «Import Ecore (.ecore)» -> `FileChooser` -> fixture: **9/9 ALL GREEN**, zero errori di pagina. Store 0->1 `DModel`, 11->12 `DClass`, **0->4 `DAnnotation`** con le `source` esatte; modale «Import successful, Attributes 4».
**Notes**: Ipotesi falsificata su entrambi i capi. Le due misure del 30-08 erano vere ma su un percorso legacy e mai cablato: `importEcore_click` non ha chiamanti in nessun commit della storia. `xml2jsonobj` funzionava fino a `47a4b5b10` (2025-11-09), rotto da un refuso di un token; la via viva nasce dopo (`de518e89d`) e non ci e' mai passata. Il picker **e' pilotabile**: corregge il §8 del referto `dtypedelement` del 30-08, che non ha chiave timestamp. Inventario nel referto §6.
**Prompt document name**: 2026-08-31 00:00

## 2026-08-30 — feat(manager): l'outline di containment nel manager (10b)
**Prompt**: «10b — Fase 2 approvata (8 file confermati, Regola 19)», dato in chat e non depositato in `docs/prompts/`. A valle di `docs/discovery/discovery_2026-08-30_outline_containment_10b.md` (Fase 1) e del disegno `Q8 Catalogo vs Outline.dc.html`, **opzione 1b**, dichiarato referenza dal prompt. Perimetro dal prompt: `outlineDraw.ts` che compone `childrenIn`/`ownerOf`/`childCount`; il modello del menu estratto dal JSX di `childSlots`, **una fonte** per catalogo e outline; `subjectId` allargato a «riga viva OPPURE DObject vivo del modello»; il fixture coi 4 livelli piu' il ghost, col puntatore morto reso come **nodo broken** e non sparito in silenzio.
**Files touched**: `jjform/{outline.ts,index.ts,__tests__/outline.test.ts}`, `editor-v2/hooks/{outlineDraw.ts,__tests__/outlineDraw.test.ts}`, `abstract/tabs/{InstanceManagerTab.tsx,instanceManagerTab.scss}` (commit `8c0caef49`); `docs/discovery/discovery_2026-08-30_outline_containment_10b.md` + `docs/design/design_handoff_instance_node/Q8 Catalogo vs Outline.dc.html` in `7a6ed3c17`; log a parte. Sonda `frontend/scripts/smoke/_tmp_10b_verify.ts` e il png (non committati, gitignored). Ogni commit con pathspec, `git status --porcelain` e indice verificati prima: **nessuna sessione parallela**, l'albero portava solo i miei file piu' i `docs/prompts/*` untracked d'inizio sessione.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe, exit 2 come la baseline), **zero** righe nominano un file toccato, con controllo positivo sulla stessa ricerca; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2197 passed / 0 failed**, **+35 esatti** (18+17, i due file nuovi) sui 2162 di stamattina, coi 9 file rotti all'import = baseline nota. Le 35 unita' girate anche contro **sei** versioni difettose dei due moduli — blocked messo in `entries`, depth di default a 3, `rootMenu` senza il filtro `root`, filtro di liveness sui figli, figli ordinati alfabeticamente, `outlineRoots` senza `ownerOf` — con **2, 1+1, 3, 2, 3 e 5 rossi**, 0 sul ripristino.
**Out-of-scope changes**: no. Sette sorgenti = i sette del referto. L'ottavo file del referto e' questo log. Aggiunto ai due commit dichiarati un file che il referto non elencava: il **disegno** `Q8 Catalogo vs Outline.dc.html`, untracked a inizio sessione, committato perche' il codice lo cita per path e una citazione che non risolve e' esattamente il difetto che §5 descrive. **Regola 19: pausa PRESA** in Fase 1 — gli 8 file elencati con cosa cambia in ciascuno, e confermati dall'utente prima di scrivere una riga.
**Layer Impact Report**: **not-required** — nessuno dei sette file e' in §3.1. Zero creatori, zero `TRANSACTION`, zero `SetFieldAction`: la create passa da `openCreate` invariata, e l'unico contatto col D-layer e' in **lettura** (`idlookup`, per risalita di `father`, §3.6). `viewpoint/ir/` non toccato (la form si monta gia'), `problems/` non toccato (coordinamento con S1-M2).
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato. La misura della slice e' pero' la sonda `_tmp_10b_verify.ts`, **21/21 ALL GREEN, zero errori di pagina**, sul modello vivo aperto dalla sua affordance: i **quattro livelli** con l'indentazione del mock (14 / 30 / 46 / 62, 16px per livello); il ghost reso **broken** a 78 e per contrasto senza «+» e senza chevron; la chiusura di un nodo che nasconde i **discendenti**, non i soli figli; `subjectId` allargato misurato **per contrasto** (tabella su `Config`, nodo `AllNine` cliccato: la form si monta, l'intestazione della tabella **non cambia**); la sincronia gratis (tabella su `AllNine`, riga evidenziata da sola); i menu (modello: sole rootable concrete, astratta e singleton assenti da entrambe le meta'; istanza: il solo `kids`); la create dall'albero che apre la **stessa** `DraftDialog` col padre giusto e atterra (8 -> 9 DObject, nuovo nodo al quinto livello); e lo **stesso slot** misurato con posto e poi pieno, dove la voce sparisce e compare la frase.
**Notes**: Due reperti e due dichiarazioni, tutti nel poscritto del referto (`discovery_2026-08-30_outline_containment_10b.md`, punti 2-5): `childrenIn` non era il passo di ricorsione dell'albero; un singleton non e' mai `root`, quindi quel ramo di `newInstanceReason` e' irraggiungibile dal menu del modello; il chevron e' un'aggiunta al mock; la delete resta fuori dall'albero.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 23:15

## 2026-08-30 — fix(core): una regola di uniqueness per i nomi M2 (S1-M2)
**Prompt**: «S1-M2: una regola di uniqueness per i nomi M2», dato in chat e non depositato in `docs/prompts/`. A valle di `discovery_2026-08-30_uniqueness_m2.md` (tre regole discordanti, create che non ne applica nessuna, 15 consumatori) e delle sei decisioni ratificate. Precedente formale S1a (`f32c5a4d3`). Perimetro dal prompt: UNA funzione di verdetto per M2 **decidendo misurando** fra modulo gemello ed estensione parametrica; create e rename allo stesso verdetto; `defaultname` chiuso qui **o** dichiarato e rimandato; badge esteso a M2; duplicati preesistenti mai riscritti. LIR prima del diff, pausa Regola 19.
**Files touched**: `model/logicWrapper/nameUniqueness.ts`, `joiner/classes.ts`, `model/logicWrapper/LModelElement.tsx`, `jjscript/executor/commands/rename.ts`, `editor-v2/problems/UniquenessProblemSync.tsx`, `editor-v2/hooks/useClassRemoval.ts`, `model/__tests__/m2NameUniqueness.test.ts` (nuovo) — commit `e6239176f`; `docs/decisions.md` (R-M2U-1..6) + `docs/discovery/discovery_2026-08-30_s1m2_una_regola.md` (nuovo) in `510254495`; log a parte. Sonde `scripts/smoke/_tmp_s1m2_{recon,recon2,verify}.ts` (non committate, gitignored). Ogni commit con pathspec, `git status --porcelain` e indice verificati vuoti prima: **nessuna sessione parallela**, l'albero portava solo i miei file piu' i `docs/prompts/*` untracked d'inizio sessione.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe, exit 2 come la baseline), nessuna delle 33 righe nomina un file toccato; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2162 passed / 0 failed**, **+22 esatti** (il file nuovo) sui 2140 di ieri, coi 9 file rotti all'import = baseline nota. Le 22 unita' girate anche contro **tre** versioni difettose del modulo (pool ristretto al package, feature senza ereditate, confronto case-insensitive): **3, 2 e 2 rossi**, 0 sul ripristino. Sonda `_tmp_getbyname_key.ts` di `3eed585dd` **rigirata non modificata: 14/14, 0 FAIL**.
**Out-of-scope changes**: **yes** — `editor-v2/hooks/useClassRemoval.ts`, settimo file oltre ai sei della pausa. Motivo misurato, non supposto: la ricopia delle feature nelle sottoclassi gira **prima** che la superclasse sparisca, quindi ogni copia risultava ombreggiata e **rifiutata** da R-M2U-4 (lista `["shLabel"]`, `addAttribute` -> `null`, `ownAttributes` invariati) — una perdita di dati silenziosa introdotta dalla slice. La ricopia passa ora da `D*.new`, la porta del caricamento, che il disegno lascia non gatata. Dichiarato qui, in `docs/decisions.md` R-M2U-4 e nel referto §G, invece che fatto scivolare nel diff. **Regola 19: pausa PRESA** sui sei file, con LIR, prima di scrivere una riga.
**Layer Impact Report**: **produced** — in chat PRIMA del diff. L e JjOM (chi puo' nascere), zero D-layer, zero sync: nessun creatore aggiunto o spostato, nessuna TRANSACTION nuova o annidata (§3.3), il gate **prima** della TRANSACTION dove ce n'era gia' una. `canvasToJjom.ts` non toccato ma con 7 chiamate ai primitivi gatati: le sue create senza nome non incontrano il gate, le due con nome gia' calcolano un `uniqueName`. L'import Ecore costruisce con `D*.new` e non passa da nessuno degli undici — R-S1-4 soddisfatto per costruzione.
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato. La misura della slice e' pero' la sonda `_tmp_s1m2_verify.ts`, **26/26 ALL GREEN, zero errori di pagina**, sul metamodello vivo aperto dalla card: i tre contro-esempi con verdetto **identico** su create e rename; cross-package rifiutato; quasi-omonimo creato **col toast** (`differs only by case`); shadowing rifiutato **col padre nella reason**; classe e datatype omonimi conviventi; badge **4 su 4** sulle `Concept_0`; e `useClassRemoval` misurato **per contrasto** (via primitivo L rifiutata, via `D*.new` atterrata).
**Notes**: Reperto: `idlookup` e' un Proxy che risolve le create pendenti per id ma **non le enumera**, quindi nessun namespace-check vede una create dello stesso tick — il duplicato di propagazione di `defaultname` si rimanda al tick-fix, misurato. Lo stesso Proxy ritarda il badge di una scrittura, a M1 come a M2. §3, §C e §3.1 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 22:55

## 2026-08-30 — feat(form): validTargets nel contratto, e la sequenza WriteCtx si chiude (S5)
**Prompt**: «S5: validTargets nel contratto — la sequenza si chiude», dato in chat e non depositato in `docs/prompts/`. Ultima slice della sequenza del referto `b9ca883fc`, dopo S4. Perimetro dal prompt: `validTargets(objectId, featureKey)` nel contratto **decidendo misurando** se sta su `WriteCtx` o su un ReadCtx affiancato; `writeCtxLproxy` che la implementa **delegando** a `get_validTargets` (la garanzia resta del core, R-FORM-13); il picker che legge le opzioni via `(objectId, key)`; `field.slot` VIA se senza lettori; contratto §5 e punto 6 nella copia **TRACCIATA**. LIR in chat PRIMA del diff.
**Files touched**: `jjform/{writeCtx.ts,index.ts,__tests__/writeCtx.test.ts}`, `editor-v2/hooks/writeCtxLproxy.ts`, `editor-v2/viewpoint/ir/{formWrite.ts,useFormWidgets.ts,IRForm.tsx,IRFormField.tsx,widgets/ReferenceWidget.tsx,widgets/ListWidget.tsx,__tests__/useFormWidgets.test.ts}` (commit `4139e8db2`); `docs/decisions.md` (R-WCX-5) + `docs/design/design_handoff_instance_node/form-engine-contract.md` + `docs/discovery/discovery_2026-08-30_s5_validtargets.md` (nuovo) in `17969cd1f`; log a parte. Sonde `scripts/smoke/_tmp_s5_{recon,recon2,recon3,probe,verify}.ts` e i png (non committate, gitignored). Ogni commit con pathspec, `git status --porcelain` verificato prima: **zero file condivisi** con la sessione parallela (micro core, `api/data.ts` + `LModelElement.tsx`, atterrata a meta' sessione).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (exit 2 come la baseline), nessuna delle 33 righe nomina un file toccato, con controllo positivo sulla stessa ricerca; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2140 passed / 0 failed**, **+7 esatti** i casi nuovi, coi 9 file rotti all'import = baseline nota.
**Out-of-scope changes**: no. Undici file sorgente: i quattro nominati dal prompt piu' i sette che «il picker legge le opzioni via (objectId, key)» richiede. **Regola 19: pausa PRESA** — elenco dei file e le due decisioni (collocazione, perimetro) portate all'utente prima di scrivere una riga, e confermate.
**Layer Impact Report**: **produced** — in chat PRIMA del diff. Solo L e solo in LETTURA: `validTargets` delega a `get_validTargets`, zero creatori, zero TRANSACTION, zero `SetFieldAction`. Nessun percorso di scrittura cambia.
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato. Sonda `_tmp_s5_verify.ts` **13/13 ALL GREEN** sul sorgente vivo: id e ordine identici al vecchio percorso dal proxy; R-FORM-13 per contrasto (`kids` containment 2 candidati senza il contenitore, `mate` stesso tipo 4 col contenitore) su un figlio vero col padre asserito; totalita' (feature ignota, oggetto ignoto, attributo, enum coi suoi letterali). Sonda `_tmp_s5_probe.ts` **16/16 ALL GREEN** dal gesto su **manager e rail**, e la stessa sonda girata sull'albero **pre-S5** (stash dei soli miei file) misura il difetto.
**Notes**: Reperto: il caso stantio era di **una superficie su due**. Pre-S5 il rail riapriva il picker su `["Config_main"]` (il candidato nato a form aperta assente), mentre il manager era gia' fresco perche' ri-renderizza per conto suo. S5 non toglie solo lo snapshot: toglie la dipendenza dalla superficie. `FormFieldDescriptor.slot` misurato a **zero lettori** e rimosso; il parametro di `describeSlot` resta. §1, §3.4 e §4 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 21:55

## 2026-08-30 — fix(core): tre righe, e le sonde di ieri rigirate come misura
**Prompt**: «Micro core: A1 (get_type), paused senza try/finally, getByName rotto», dato in chat e non depositato in `docs/prompts/`. Tre fix ratificati a valle dei discovery del 30-08 sera, nella stessa slice perche' due condividono `LModelElement.tsx`. Perimetro dal prompt: **TRE commit sorgente separati**, uno per fix; per ciascuno il caso del referto rifatto verde, un contrasto e la non-regressione della zona; gate completi una volta sola in coda; per il fix 3, **rigirare i consumatori a valle** e dichiarare cio' che cambia a schermo.
**Files touched**: `model/logicWrapper/LModelElement.tsx` (due hunk, in due commit distinti: `4c77efef8` e `3eed585dd`), `api/data.ts` (`65cfd1dcc`), i tre test nuovi `model/__tests__/{getTypeFallback,getByNameKey}.test.ts` e `api/__tests__/parserPaused.test.ts` (uno per commit sorgente), `docs/discovery/discovery_2026-08-30_micro_core_tre_fix.md` (nuovo) + `docs/decisions.md` (R-GT-1, R-GT-2, R-M2-2) in `975c94b0f`, log a parte. Sonde `_tmp_gettype_window.ts` (preesistente, **non modificata**), `_tmp_getbyname_key.ts` e `_tmp_gbn_recon.ts` (nuove, non committate, gitignored). **Zero file condivisi** con la sessione parallela S5 (`jjform/`, `hooks/writeCtxLproxy.ts`, `viewpoint/ir/formWrite.ts`): `git status --porcelain` verificato prima di ogni commit e indice verificato vuoto, ogni commit con pathspec.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (126 righe, exit 2 come la baseline); le 3 righe di `api/data.ts` sono le preesistenti a numeri spostati di +14, **zero** righe nominano `LModelElement.tsx`. `npm run build` exit **0**, solo il chunk-warning. `npx vitest run` **2140 passed / 0 failed**, coi 9 file rotti all'import = baseline nota; **21 esatti** sono i miei, i restanti +7 sui 2112 di ieri vengono dall'albero in volo di S5. Ogni suite girata anche contro la **propria** versione difettosa (1, 2 e 2 rossi): un test verde su entrambe non misura niente.
**Out-of-scope changes**: no. Due sorgenti, entrambi del prompt. `docs/decisions.md` e' l'unico file che il prompt non nomina per path — nomina le sigle R-GT-1 e R-M2-2, che li' non esistevano ancora: la ratifica e' stata scritta, e a R-GT-2 e' stata assegnata una sigla nuova perche' il prompt non ne dava una al fix del `paused`. **Regola 19: 8 file > 5, pausa non presa** — il prompt enumera i tre fix, i test, i tre commit, il referto e il log; lista dichiarata in chat prima del diff invece che fatta scivolare.
**Layer Impact Report**: **produced** — in chat PRIMA del diff. L su `get_type` e `_impl_getByName` (nessuna scrittura, nessuna azione emessa), D solo su `Constructors.paused`, il flag che decide se una `CreateElementAction` parte; nessuna `TRANSACTION` aggiunta o annidata (§3.3), nessun creatore spostato.
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato. La misura vera dei fix e' pero' un'altra: la sonda `_tmp_gettype_window.ts` **rigirata non modificata**, prima su `HEAD` pristine (`git show HEAD:<path>`, stessa giornata e stesso fixture) e poi sul fix — **10/10 ALL GREEN** prima, **7/10** dopo, e i tre FAIL sono esattamente i tre `check` che asserivano il difetto (`.type` da `ProbePerson` a `EObject`; `paused` da `false→true` a `false→false`; la create successiva da `committed:false` a `true`), con le sette righe della finestra del parser identiche numero per numero e 0 righe di warning in entrambe. Sonda nuova `_tmp_getbyname_key.ts` **14/14 ALL GREEN** col fix, 9/14 pristine, zero errori di pagina.
**Notes**: Due reperti che cambiano la risposta alla domanda 3 del prompt. (1) Il gradino 2 di `get_type` **non** beneficia del fix 3: `model` e' dichiarata e mai assegnata (`this.get_model(c)` scarta il ritorno), in `get_type` come in `set_type` — misurato per discriminazione su `'EInt'`, dichiarato e non corretto. (2) L'unico consumatore vivo e' `edgeCandidate.ts:59`, e li' il comportamento e' **nuovo**, non osservato a schermo. §4.1, §5 e §5.1 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 21:05

## 2026-08-30 — feat(form): WriteCtx, il contratto delle sei primitive (S4)
**Prompt**: «S4: WriteCtx — il motore scrive per contratto», dato in chat e non depositato in `docs/prompts/`. Quarta slice della sequenza del referto `b9ca883fc` (§6), dopo S3. Perimetro dal prompt: `jjform/writeCtx.ts` a zero import dell'host, `hooks/writeCtxLproxy.ts` che RACCOGLIE le funzioni esistenti, il motore che riceve il ctx **solo dove la sostituzione e' meccanica**, contratto §5, convergenza dei verdetti **decisa misurando**. LIR in chat PRIMA del diff.
**Files touched**: `jjform/{writeCtx.ts,__tests__/writeCtx.test.ts}` (nuovi), `jjform/{delete.ts,index.ts}`, `editor-v2/hooks/{writeCtxLproxy.ts (nuovo),createAdapter.ts,deleteAdapter.ts}` (commit `3adc9613a`), `docs/decisions.md` (R-WCX-1..4) + `docs/discovery/discovery_2026-08-30_s4_writectx.md` (nuovo, `29debeca8`), log a parte. **`docs/prompts/form-engine-contract.md` §5 riscritta ma NON committata**: il file e' untracked nel repo (come tutti i `docs/prompts/*` di questa serie) e non e' mio da tracciare — vedi Notes. Sonda `scripts/smoke/_tmp_s4_verify.ts` + `_tmp_s4_verify_rail.png` (non committate, gitignored). Ogni commit con pathspec; `git status --porcelain` verificato prima di ciascuno: **zero file condivisi**, e all'inizio della sessione l'albero portava solo i miei quattro modificati.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (exit 2 come la baseline, conta presa sull'output intero), nessuna delle 33 righe nomina un file toccato; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2112 passed / 0 failed**, **+7 esatti** (i sette casi nuovi) sui 2105 di baseline, coi 9 file rotti all'import = baseline nota.
**Out-of-scope changes**: no. Sette file sorgente, tutti nominati dal prompt o richiesti da quelli che nomina. **Regola 19: 7 file > 5, pausa NON presa** — il prompt enumera lui stesso `writeCtx.ts`, `writeCtxLproxy.ts`, i tre file del motore e il contratto, quindi la lista era gia' confermata; dichiarata in chat prima del diff invece che fatta scivolare.
**Layer Impact Report**: **produced** — in chat PRIMA del diff. Solo L, e solo su CHI chiama le primitive: `addObject`, `.delete()` e `formWrite` restano gli stessi con gli stessi argomenti e lo stesso ordine, nessuna TRANSACTION aggiunta o annidata, la dilazione `U.UpdatingTimer * 2` di R-FORM-11 intatta. Le uniche differenze osservabili sono due testi di `console.warn` su rami che gia' solo loggavano.
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato. Sonda `_tmp_s4_verify.ts` **21/21 ALL GREEN, zero errori di pagina**, due corse identiche, sorgente vivo via Vite senza mock: A le sei primitive dal ctx (no-op `{ok:true,changed:false}` in un tick separato, feature assente rifiutata con reason, create che semina il nome **sia** su `DObject.name` **sia** sullo slot, `clearValue` che lascia `["hot",null,"warm"]` lungo 3); B la catena del manager `preflightFor -> deletePlan -> applyDelete` col referrer ripuntato e il bersaglio vivo DENTRO la finestra della dilazione e sparito dopo, piano `dirty` per contrasto; C `applyCreate` col draft, e una metaclasse inesistente che torna `null`; D il gesto sul rail, edit e rinomina.
**Notes**: Il contratto non e' committato perche' `docs/prompts/form-engine-contract.md` risulta **untracked** (`git status` d'inizio sessione): la modifica e' sul disco, il file resta da tracciare a chi possiede quella serie. Due FAIL della prima corsa erano della sonda: i no-op misurati nello stesso `evaluate` (§9.2) e `#ir-field-name = 0`, perche' `IRForm` rende il gruppo Identity **solo** se la metaclasse non ha lo slot `name` (`IRForm.tsx:221`). §3, §4 e §6.1 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 18:50

## 2026-08-30 — discovery: l'unicita' dei nomi a M2, la matrice dei consumatori
**Prompt**: «Discovery: l'unicita' dei nomi a M2», depositato in `docs/prompts/PROMPT_discovery_uniqueness_m2.md`. Quattro domande: la regola M2 e dove vive; i consumatori che risolvono per nome e su quale pool; se la divergenza create/rename di S1 e' costruibile a M2; se `defaultname` puo' duplicare e se il badge copre M2. Zero fix.
**Files touched**: `docs/discovery/discovery_2026-08-30_uniqueness_m2.md` (nuovo), `docs/prompts/PROMPT_discovery_uniqueness_m2.md` (nuovo), `docs/claude-code-log.md`. **Zero sorgenti.** Una sonda non committata, `frontend/scripts/smoke/_tmp_m2_uniqueness.ts` (20 check, ALL GREEN, zero errori di pagina).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — sola lettura, zero diff di sorgente. La sonda scrive solo sullo stato in memoria di un contesto browser usa-e-getta.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Tre regole M2, non una (core `classes.ts:2166`; `LModel.set_name`; JjScript `rename.ts:138`, per-kind, case-insensitive, che bypassa `set_name`). La create non ne applica nessuna. Divergenza misurata in tre forme in una corsa. Due buchi: i `DDataType` non sono in `pkg.children`, le feature ereditate non entrano nel namespace. Reperto autonomo: `getClassByName`/`getEnumByName` ritornano sempre `null` (chiave `$nome` vs chiave nuda). Dettagli nel referto.
**Prompt document name**: PROMPT_discovery_uniqueness_m2.md 2026-08-30 19:06

## 2026-08-30 — discovery: la finestra transitoria del parser Ecore, misurata
**Prompt**: «Discovery: la via (A) di get_type — il padre nella finestra transitoria», depositato in `docs/prompts/PROMPT_discovery_gettype_via_a.md`. Tre domande: chi legge `.type` fra `DReference.new(undefined)` e la scrittura del campo; cosa ne fa; se il gradino 3 di `get_type` ha ancora chiamanti fuori dalla finestra. Zero fix.
**Files touched**: `docs/discovery/discovery_2026-08-30_gettype_finestra_parser.md` (nuovo), `docs/prompts/PROMPT_discovery_gettype_via_a.md` (nuovo), `docs/claude-code-log.md`. **Zero sorgenti.** Una sonda non committata, `frontend/scripts/smoke/_tmp_gettype_window.ts` (15 check, ALL GREEN, zero errori di pagina).
**Outcome**: ✅ completed
**Corregge**: 2026-08-30 14:15 (PROMPT_seed_dreference.md)
**Causa**: (c)
**Regressions**: no — sola lettura, zero diff di sorgente.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: L'assunzione del referto del 30-08 («nella finestra `type === undefined` e' il contratto») e' falsificata: `DReference.new` mette il padre al posto del tipo assente prima del costruttore, quindi `data.type` non e' mai falsy e il gradino 3 non scatta sul percorso del parser. La finestra e' leggibile (`reducer.ts:639`) ma sincrona: 0 dispatch. Import end-to-end finalmente esercitato. Due reperti collaterali nel referto §1 e §5.
**Prompt document name**: PROMPT_discovery_gettype_via_a.md 2026-08-30 19:06

## 2026-08-30 — chore(smoke): 142 png orfane rimosse, e il cwd che le scriveva
**Prompt**: «Micro igiene: png orfane + due reperti nel README-probes», dato in chat e non depositato in `docs/prompts/`. Due parti: (1) verificare che le ~142 `_tmp_*.png` in `frontend/` fossero tutte untracked e da sonda, poi rimuoverle, fermandosi se qualcosa non matcha il pattern o risulta tracked; (2) due aggiunte a `README-probes.md` dai reperti del 30-08 sera — l'annidamento apparente (`composition = true` + `slot.addObject()` nello stesso `evaluate`) e il fixture rowviews senza oggetti annidati. Solo pulizia + docs, zero sorgenti, entry nello stesso minuto, pathspec.
**Files touched**: `frontend/scripts/smoke/README-probes.md` (+56/-4), e la rimozione di 142 `frontend/_tmp_*.png` (mai tracciate: non compaiono in nessun commit). **Zero sorgenti, zero `src/`, zero sonde.** Indice verificato vuoto (`git diff --cached --name-only`) prima del commit; commit con pathspec.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — il diff è un solo `.md` e una rimozione di artefatti non tracciati. Verificato prima di cancellare che nessun file tracciato nominasse quei png: gli unici riferimenti stanno dentro sonde `_tmp_*.ts` (a loro volta ignorate) e sono `page.screenshot({path})`, cioè scritture, non letture. Controllo positivo sullo stesso grep (`_tmp_s1bmicro_recon`, 5 hit) perché un silenzio non è una misura. Cancelli di compilazione non pertinenti e non girati; `npm run check:docs` sul log.
**Out-of-scope changes**: **yes** — la sezione «Naming, and where the ignore rule actually reaches», che il prompt non nominava fra le due aggiunte. Motivo: quella sezione descriveva le 142 png **al presente**, e rimuoverle rendeva il documento falso sull'albero corrente. Riscritta con la misura di oggi. Dichiarato qui invece che fatto scivolare nel diff.
**Layer Impact Report**: not-required — nessun file di §3.1, nulla sotto `src/`.
**Smoke visivo**: non applicabile — nessuna modifica di resa. Al posto suo, la verifica preventiva chiesta dal prompt: 142 file in `frontend/`, **142 su 142** matchano `_tmp_*.png` (0 fuori pattern), **0 tracciati** — con controllo positivo, `git ls-files -- '*.png'` ne elenca 59 nel repo, nessuno `_tmp_*`, quindi lo zero è un negativo vero e non una ricerca rotta. `git check-ignore` exit 1: non erano nemmeno ignorate. Campione visivo su due (`_tmp_rstr6_canvas.png` 1600×1100, canvas Jjodel con la detection ladder; `_tmp_orphans2_after_dark_props.png` 400×1077, pannello Info in dark): screenshot dell'app, non altro. Nomi in 21 gruppi coerenti (20 × 7 `orphans2_*` + 2 `rstr6_*`).
**Notes**: Reperto non richiesto e non risolto: i siti di atterraggio sono **tre**, non uno. Oltre alle 142 in `frontend/`, restano **10** png orfane in `scripts/smoke/` (radice del repo) e **2** sotto il path doppio `frontend/scripts/smoke/scripts/smoke/`. Stessa causa — `path:` relativo risolto su una cwd che la sonda non controlla — e la regola `.gitignore:66` non raggiunge nessuno dei due. Fuori dal perimetro dichiarato: non rimossi, tabellati nel README e riportati in chat per decisione.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 19:05

## 2026-08-30 — fix(form): l'indirizzo che sopravvive allo slot sostituito (S3)
**Prompt**: «S3: `IRFormField` indirizza per (objectId, key)», dato in chat e non depositato in `docs/prompts/`. Terza slice della sequenza WriteCtx (referto `b9ca883fc` §2.3 e §sequenza): l'unico scrittore che passava un proxy L vivo era `IRFormField`. Layer Impact Report PRIMA del diff, come chiesto dal richiamo (S2 lo scrisse dopo). Due superfici a schermo, verdetti di S2 intatti, filtro del picker verificato per contrasto.
**Files touched**: `editor-v2/viewpoint/ir/{formWrite.ts,IRFormField.tsx,IRForm.tsx}` (commit `93ac53fce`), `docs/discovery/discovery_2026-08-30_s3_indirizzamento_per_id.md` (nuovo, `afb660ee9`), log a parte. Sonde `scripts/smoke/_tmp_s3_{recon,probe,verify}.ts` e i 3 `.png` (non committate, gitignored). **Zero file condivisi** con le sessioni parallele (micro jjscript `eval.ts`, README sonde): `git status --porcelain` verificato prima di ogni commit, ogni commit con pathspec.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (conta presa sull'output intero, non su una coda), nessuna delle 33 righe nomina un file toccato; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2105 passed / 0 failed**, coi 9 file rotti all'import = baseline nota.
**Out-of-scope changes**: no. Tre file sorgente, tutti nominati dal prompt. Regola 19 non in gioco (3 < 5).
**Layer Impact Report**: **produced** — in chat PRIMA del diff. Solo L, e solo su COME si ottiene il proxy: nessun creatore, nessuna TRANSACTION aggiunta o annidata, le stesse azioni sugli stessi id. Le tre funzioni per proxy restano per i tre adapter, che risolvono una riga prima della chiamata.
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato. Sonda PRIMA del fix `_tmp_s3_probe.ts` **ALL GREEN**: slot sostituito sotto la form, `setSlotValue` col proxy catturato torna `{ok:true, changed:true}` e il valore non e' in nessuno slot — riuscita, dice, e persa in silenzio; controllo opposto nella stessa corsa, per id atterra. Sonda DOPO `_tmp_s3_verify.ts` **ALL GREEN, 16 asserzioni, zero errori di pagina**: A il caso stantio dalle due vie; B la feature assente ora rifiutata con reason (`feature "nonesiste" is not on this object any more`) e la presente che passa nello stesso istante; C **rail** (tab Form) edit dal gesto -> store `["dal-rail"]`; D **manager** stesso gesto -> `["dal-manager"]`; E picker invariato **per contrasto** — `peer` (ref semplice) offre `P0,P2,P1` e la scelta atterra, `owner` (containment singolo) sullo stesso oggetto offre `P2` soltanto.
**Notes**: L'ipotesi del prompt e mia — proxy stantio sui VALORI — **non regge**: misurata, varia fra corse (D-object a volte mutato in luogo, a volte sostituito), quindi quel caso della sonda misura e non asserisce. Il difetto deterministico e' il proxy stantio sullo SLOT. `field.slot` resta nel descriptor: lo legge `describeSlot`, ed e' il pezzo di S5. §2, §3 e §5 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 18:35

## 2026-08-30 — feat(jjel): il produttore nomina i candidati, e la lista arriva a schermo
**Prompt**: «Micro: `buildEvalContext` produce i candidati», dato in chat e non depositato in `docs/prompts/`. Colma il residuo dichiarato da `480934fea` (§reperto): `candidates` esisteva su mappa, variante del warning e copy, ma nessun produttore lo scriveva, quindi il ramo con la lista non era raggiungibile a schermo. Perimetro: `jjscript/executor/commands/eval.ts:329-344`, forma esportata `AmbiguousInstanceCandidate` (id + className + path — pool cross-modello, il path distingue), nessun troncamento nel produttore (il taglio a 5 resta nel formatter), sonda aggiornata col controllo negativo che resta.
**Files touched**: `jjscript/executor/commands/eval.ts` (unico sorgente, commit `0ba0fe290`), `docs/discovery/discovery_2026-08-30_s1b_micro_produttore_candidati.md` (nuovo, `a3c6b00e4`), log a parte con la rotazione P9. Sonde `scripts/smoke/_tmp_s1bmicro_{recon,recon2,recon3}.ts` e `_tmp_s1b_jjel_candidates.ts` coi 2 `.png` (non committate). **Zero file condivisi** con la sessione parallela, che tiene `viewpoint/ir/{IRForm.tsx,IRFormField.tsx,formWrite.ts}` modificati **e messi in stage**: verificato su `git status --porcelain` prima di ogni commit, e ogni commit fatto con pathspec proprio perche' l'indice non e' mio.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero, exit 2 come la baseline), e nessuna delle 33 righe nomina `eval.ts`; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2105 passed / 0 failed**, coi 9 file rotti all'import = baseline nota; `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, un boot per stato, `moved: nothing`.
**Out-of-scope changes**: no. Un solo sorgente, quello del perimetro.
**Layer Impact Report**: not-required — nessun file di §3.1. Nessun `.new()`, nessuna TRANSACTION, nessuna scrittura sul D-graph: il diff legge `idlookup`, costruisce stringhe e non emette azioni.
**Smoke visivo**: **passato**. `_tmp_s1b_jjel_candidates.ts` **19/19 ALL GREEN, zero errori di pagina**, dal gesto (console Jjodie in modo Code, sorgente vivo via Vite): fase A due omonimi con path **diversi** — `Ambiguous instance name Dup_x (2 matches): smoke_model/Dup_x (AllNine), smoke_model/allNine_valued/Dup_x (Config). Use the qualified form AllNine.Dup_x.`, tre segmenti sul secondo, cioe' il salto sull'owner ha funzionato; fase B col sesto omonimo `(6 matches)`, cinque path nominati e `and 1 more`. Due controlli negativi (un identificatore ignoto stampa la sua riga senza lista ne' conteggio; un nome unico resta muto) e due positivi (canvas montato, blocco `warnings.map` vivo).
**Notes**: Reperto che ha cambiato la sonda, non il ricordo: `composition = true` e `slot.addObject()` nello stesso `evaluate` producono una RADICE, non un figlio (§9.2) — la prima corsa e' uscita 1 FAIL su 19, col path a due segmenti. La correzione non e' stata attendere di piu' ma **asserire il father**, cosi' un annidamento apparente fallisce invece di passare in silenzio. §2 e §3 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 18:20
## 2026-08-30 — docs(smoke): il README delle sonde, e ogni convenzione con la sua misura
**Prompt**: «Micro: README delle sonde a schermo», dato in chat e non depositato in `docs/prompts/`. Raccogliere i reperti di metodo delle sonde che si stavano perdendo nei referti: il gotcha `__name`, le convenzioni gia' in uso ricavate dai referti del 30-08 (non inventate), e il precedente del fixture. Scelta dichiarata fra file nuovo e sezione del README esistente. Solo documentazione, zero sorgenti, zero smoke, entry di log nello stesso minuto, pathspec.
**Files touched**: `frontend/scripts/smoke/README-probes.md` (nuovo, 234 righe) e `frontend/scripts/smoke/README.md` (+4 righe: un rimando in testa e una riga nella tabella dei file). **Zero sorgenti, zero sonde, zero `src/`.** Scelta: **file separato**, perche' `README.md` documenta lo strumento committato (tre stati, cinque asserzioni, baseline) mentre le sonde sono l'opposto — usa e getta, non committate, per-slice; il rimando evita che il file nuovo resti introvabile.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file eseguibile toccato, il diff e' due `.md`. Cancelli non pertinenti e non girati; `npm run check:docs` sul log.
**Out-of-scope changes**: **yes** — `README.md`. Il prompt offriva l'alternativa (file nuovo **o** sezione del README), non entrambi: ho preso il file nuovo e aggiunto 4 righe di rimando al vecchio. Dichiarato qui invece che fatto scivolare nel diff.
**Layer Impact Report**: not-required (nessun file di §3.1; nulla sotto `src/`)
**Smoke visivo**: non applicabile — nessuna modifica di resa.
**Notes**: Due scarti prompt/repo. (1) Il FAIL «selezione per indice su tabella ordinata per nome» e' della sonda **12bc** (referto `slice12bc` §4), non di 2c: il referto 2c non contiene la stringa `FAIL`. Citato corretto. (2) Il gotcha `__name` e' documentato **una volta sola** nei referti (`s1b` §Sonda); l'ho **ri-misurato** con l'esbuild del repo invece di citare una conta non verificabile. Conte che derivano dichiarate con l'ora.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 18:00
## 2026-08-30 — fix(form): WriteResult al posto del boolean, e il rifiuto che si vede (S2)
**Prompt**: «S2: `WriteResult` al posto del boolean in `formWrite`», dato in chat e non depositato in `docs/prompts/`. Seconda slice della sequenza WriteCtx (referto `b9ca883fc` §4.2 e §6). Ordine imposto: PRIMA esercitare il difetto letto-e-mai-provato, poi chiuderlo. `WriteResult {ok, changed, reason}` in `jjform/` a zero import, le 5 funzioni di `formWrite` lo tornano, i chiamanti del censimento lo consumano, `addSlotValue` da decidere, convergenza con S1a/S1b annotata e NON presa.
**Files touched**: `jjform/write.ts` (nuovo) + `jjform/index.ts`, `editor-v2/viewpoint/ir/{formWrite.ts,IRFormField.tsx,IRForm.tsx}`, `editor-v2/hooks/{multiAdapter.ts,deleteAdapter.ts}`, `docs/discovery/discovery_2026-08-30_s2_writeresult.md` (nuovo). Sonde `scripts/smoke/_tmp_s2_{probe,verify}.ts` e i 3 `.png` (non committate). Commit sorgenti + docs con pathspec, log a parte. **Zero file condivisi** con la sessione parallela, che tiene `jjel/`, `Jodie/ChatMessages.tsx` e `types/jodie.ts` modificati: verificato su `git status --porcelain` prima di ogni commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (conta presa sull'output intero, non su una coda), e nessuna delle 33 righe nomina un file toccato; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2105 passed / 0 failed**, coi 9 file rotti all'import = baseline nota; `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, un boot per stato.
**Out-of-scope changes**: no. Sette file sorgente, tutti nominati dal prompt o dal censimento che cita.
**Layer Impact Report**: **skipped** — il report esiste (§4 del referto) ma e' stato scritto DOPO il diff, non prima. `viewpoint/ir/` e' in critical zone (§3.1): la clausola e' quella, e va marcata onestamente. Contenuto: nessuna TRANSACTION aggiunta/rimossa/annidata, nessun creatore in gioco, nessuna azione emessa in piu' o in meno; cambia solo il tipo di ritorno e la condizione di `U.isProjectModified`.
**Smoke visivo**: **passato**. Sonda PRIMA del fix `_tmp_s2_probe.ts` **ALL GREEN**: il difetto misurato — `setSlotValue` torna `true`, `isProjectModified` `false -> true`, slot `[]` prima e `[]` dopo, mentre il core dice `{success:false, reason:"cannot create a containment loop"}`. Sonda DOPO `_tmp_s2_verify.ts` **ALL GREEN, 18 asserzioni, zero errori di pagina**: A il ciclo ora dichiarato con la reason verbatim e progetto non marcato, B no-op `{ok:true, changed:false}` e progetto non marcato, C scrittura riuscita identica a prima, D **dal gesto** — rinomina verso un nome occupato: il campo mostra `Name "b_one" already used by Object "b_one"`, `aria-invalid`, nessun pallino di dirty, nome nello store invariato; D.2 controllo opposto, il nome libero passa e il messaggio sparisce. Screenshot `_tmp_s2_verify_refused.png` (messaggio in linea **e** toast del core insieme).
**Notes**: Il rifiuto del ciclo **non e' costruibile dalla UI** — misurato col controllo positivo: nella stessa lista del picker il bersaglio legale c'e', l'antenato no (R-FORM-13). Da qui la via programmatica, autorizzata dal prompt. Reperto: `setValueAtPosition` usa `success:false` anche per il no-op (`identical assignment`), quindi la mappatura separa le due reason verbatim. `addSlotValue` **si allinea e non muore**. Regola 19 non rispettata: 7 file, pausa non presa. §1, §2.2 e §6 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 18:15

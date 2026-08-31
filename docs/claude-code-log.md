# Claude Code Session Log

Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.

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
## 2026-08-30 — feat(jjel): i candidati nominati, e il produttore che ancora non li nomina
**Prompt**: «Micro: i candidati nominati nell'ambiguita' JjEL», dato in chat e non depositato in `docs/prompts/`. Micro-slice ratificata a valle della Fase 1 di S1b: JjEL gia' DICHIARA l'ambiguita' (rifiuta il binding, registra `{count, sampleClass}`, avvisa); manca il nome dei candidati. Perimetro dichiarato: `jjel/evaluator/context.ts:152-175`, `jjel/evaluator/evaluator.ts:236-245`, `types/jodie.ts:932-937`. La mappa porta i candidati (id + metaclasse + path — il pool JjEL e' `allSubObjects` cross-modello, il path DISTINGUE, misura S1b §5); `kind: 'ambiguous-instance'` li espone; la copy li elenca (primi 5 + «and N more»); warning pedagogico e controllo negativo restano.
**Files touched**: `jjel/evaluator/context.ts`, `jjel/evaluator/evaluator.ts`, `types/jodie.ts`, `components/Jodie/ChatMessages.tsx`, `jjel/__tests__/ambiguous-instance.test.ts`, `docs/discovery/discovery_2026-08-30_s1b_micro_candidati_jjel.md` (nuovo). Sonde `scripts/smoke/_tmp_s1b_{recon,recon2,jjel_candidates}.ts` e il `.png` (non committate). Commit sorgenti `2b77263e5`, docs a parte, log a parte, tutti con pathspec. **Zero file condivisi** con le due sessioni parallele: S1b Fase 2 e' atterrata a meta' slice (`8b4abecbf`..`dd25b59ce`, quattro file jjscript piu' `ProjectEditor.tsx`) e S2 tiene `jjform/`+`ir/` modificati — verificato su `git status --porcelain` prima di ogni commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero), rigirato anche DOPO l'atterraggio della sessione parallela; l'unica riga che nomina un file toccato e' la `TS2322` pre-esistente di `ChatMessages.tsx`, spostata da `:246` a `:262` dalle 16 righe inserite — stessa riga di codice, verificata contro `git show HEAD:` prima di dichiararla tale. `npm run build` exit **0**, solo il chunk-warning. `npx vitest run` **2105 passed / 0 failed** coi 9 file rotti all'import = baseline nota.
**Out-of-scope changes**: **yes** — `ChatMessages.tsx`, quarto file, non nei tre del perimetro. E' l'unico sito che stampa `CodeWarning`: senza, «la copy li elenca» non sarebbe realizzabile e `candidates` sarebbe una dead write (§5). Dichiarato in §2 del referto, non fatto scivolare nel diff.
**Layer Impact Report**: not-required — nessun file di §3.1. Nessun `.new()`, nessuna TRANSACTION, nessuna scrittura sul D-graph: il diff e' tipi, un forward di campo e una riga di copy.
**Smoke visivo**: **passato**. `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, un boot per stato — alla seconda corsa: la prima e' uscita **VOID** con causa nominata (`4 change(s) while 'advanced-mode' was open`, tutti file della sessione parallela, zero miei). Sonda `_tmp_s1b_jjel_candidates.ts` **8/8 ALL GREEN, zero errori di pagina**: il ramo ambiguo si accende su due omonimi veri e stampa `Ambiguous instance name allNine_valued (2 matches). Use the qualified form Config.allNine_valued.` — byte per byte la copy di prima. Controllo positivo nella stessa corsa (un identificatore ignoto stampa la sua riga: il blocco render vive dopo l'estrazione del componente) e controllo negativo (nessun «and N more» senza produttore).
**Notes**: Il reperto che delimita la slice: l'unico produttore della mappa e' `jjscript/eval.ts:329-344`, e **S1b Fase 2 e' atterrata senza riempirlo**. Oggi `candidates` e' sempre `undefined`, quindi il ramo con lista non e' raggiungibile a schermo — coperto dai test unitari, dichiarato e non aggirato. Resta da assegnare. §1 e §4 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 17:55
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
## 2026-08-30 — fix(jjscript): l'ambiguita' dichiarata nei consumatori della risoluzione per nome (S1b)
**Prompt**: «S1b: l'ambiguita' dichiarata nei consumatori della risoluzione per nome», dato in chat in due tempi (Fase 1, poi Fase 2 con le tre domande decise). Il documento nominato `docs/prompts/PROMPT_s1b_ambiguita_dichiarata.md` **non esiste nel repo**: cercato con controllo positivo prima di chiedere. Ratifica registrata come **R-S1-5**, non R-S1-3 come diceva il prompt — nel frattempo S1a aveva committato R-S1-3 con altro significato.
**Files touched**: `jjscript/executor/commands/instance.ts`, `jjscript/executor/elementWaiter.ts`, `jjscript/__tests__/{handleRegistry,elementWaiter}.test.ts` (commit `8b4abecbf`), `components/project/ProjectEditor.tsx` (`e85b9ac0d`), allineamento sigla (`f952bee05`), `docs/decisions.md` + referto (`f7a1a3234`), log a parte. **Zero diff in `eval.ts`** — vedi Notes. Sonda `_tmp_s1b_verify.ts` (non committata). **Zero file condivisi** con le due sessioni parallele (S2 su `formWrite`/IR/adapters, micro-jjel su `jjel/`+`jodie.ts`), verificato con `comm -12` prima di ogni commit.
**Outcome**: ⚠️ partial — quattro punti su cinque cablati e misurati; il quinto («`Class.Name` ambiguo: registrato, non piu' muto») **non e' soddisfacibile dentro il perimetro** e non e' stato scritto.
**Corregge**: —
**Causa**: (a)
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (l'unica riga che nomina un file toccato e' `ProjectEditor.tsx(220,67)`, gia' nei 33 di §17); `npx vitest run` **2100 passed / 0 failed**, **+7 esatti** contati con `git show HEAD:` prima e dopo, coi 9 file rotti all'import = baseline nota; `npm run build` exit 0 col solo chunk-warning. Il rifiuto di `delete`/`set` sull'ambiguo **cambia comportamento committato ed e' voluto** (R-S1-5), non e' una regressione.
**Out-of-scope changes**: no. `elementWaiter.ts` e' fuori dal perimetro della Fase 1 ma la Fase 2 lo include esplicitamente.
**Layer Impact Report**: not-required — nessun file di §3.1. `ProjectEditor.tsx` guadagna una guardia di lettura **prima** di una scrittura gia' esistente: nessun creatore, nessuna TRANSACTION, nessun write path della sync toccato.
**Smoke visivo**: **passato**. Prima corsa **VOID** (S2 ha salvato `IRForm.tsx`, `IRFormField.tsx`, `deleteAdapter.ts`, `multiAdapter.ts` dentro la finestra, nominati da RUN VALIDITY); ripetuta su albero fermo → **GREEN 12/0/3, `moved: nothing`, un boot per stato**. Sonda `_tmp_s1b_verify.ts` **11/11 ALL GREEN, zero errori di pagina**, sul modulo VERO importato dal sorgente vivo via Vite (nessun mock): `delete CLK` ambiguo non cancella (`DObject` 10 -> 10, entrambi vivi), `set CLK.widthPx` ambiguo non scrive, e **per contrasto** lo stesso `set` dopo disambiguazione passa e scrive (`[] -> [42]`) — senza il contrasto, «non scrive» sarebbe stato verificato contro uno slot gia' vuoto.
**Notes**: Due reperti hanno cambiato il diff. (1) Il binding nudo di JjEL era **gia' implementato**; registrare `Class.Name` sarebbe stata una **scrittura morta** — unico lettore `evaluator.ts:231`, ramo Identifier, e l'accesso a proprieta' (`:513-538`) non consulta mai la mappa. (2) `[]` e' truthy: la firma a lista rompeva `elementWaiter:115` **senza errore di compilazione**. §2, §3 e §9 del referto.
**Prompt document name**: prompt inline (non depositato; il nome citato non esiste nel repo) 2026-08-30 17:20
## 2026-08-30 — fix(core): una regola di uniqueness, e la create che smette di saltarla (S1a)
**Prompt**: «S1a: una funzione di uniqueness per create e rename», dato in chat e non depositato in `docs/prompts/`. Ratifica R-S1-1..4 a valle del censimento `discovery_2026-08-30_s1_uniqueness_consumatori.md`: il namespace e' quello del CORE, la (B) globale e' respinta, 12a e' emendata. UNA funzione di verdetto `{ok, reason}` dove entrambe le vie la attraversano; `set_name` ne diventa consumatore a comportamento invariato; la create smette di saltarla, col punto d'ingresso da **trovare misurando**; il draft del manager cede la sua regola per-classe via adapter; duplicati preesistenti dichiarati, mai riscritti.
**Files touched**: `model/logicWrapper/nameUniqueness.ts`, `model/logicWrapper/LModelElement.tsx`, `components/editor-v2/hooks/{createAdapter.ts,createDraw.ts}`, `jjform/create.ts` + 1 test, `docs/decisions.md` (serie R-S1 nuova), `docs/discovery/discovery_2026-08-30_s1a_una_funzione_uniqueness.md` (nuovo). Sonda `scripts/smoke/_tmp_s1a_verify.ts` e il suo `.png` (non committati). Commit sorgenti `f32c5a4d3`, docs `c3aca9e53`, log a parte. **Zero file condivisi** con la sessione parallela S1b (`jjscript/`, `eval.ts`, `instance.ts`, `ProjectEditor.tsx`, `scripts/smoke/`): verificato su `git status --porcelain` prima di ogni commit, ogni commit con pathspec.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero, non una coda), e nessuna delle 33 righe nomina un file toccato; `npm run build` exit **0**, solo il chunk-warning; `npx vitest run` **2093 passed / 0 failed**, **+1 esatto** sulle 2092, coi 9 file rotti all'import = baseline nota; `npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, un boot per stato.
**Out-of-scope changes**: no. Sei file sorgente, tutti nominati dal prompt o strettamente richiesti (il test segue il messaggio che cambia).
**Layer Impact Report**: produced — in chat prima del diff. Layer toccato: solo L. Nessun creatore avvolto, nessuna TRANSACTION aggiunta o annidata: il gate sta **prima** della `TRANSACTION` di `:7134` (§3.3 non in gioco).
**Smoke visivo**: **passato**. `_tmp_s1a_verify.ts` **ALL GREEN, zero errori di pagina**: i due contro-esempi dell'ortogonalita' danno verdetto **identico** su create e rename (stesso slot classi diverse -> entrambi rifiutano; stessa classe due slot dello stesso owner -> entrambi accettano), il caso divergente originale non e' piu' costruibile (create radice rifiutata, 12 -> 12), il badge continua ad accendersi sul duplicato preesistente, e il toast del rename porta la frase di sempre. Tre controlli negativi nella stessa corsa (nome libero accettato in tre posizioni diverse), perche' una regola che rifiutasse tutto darebbe verde sul criterio principale.
**Notes**: Il punto d'ingresso e' `LValue.get_addObject`, **non** `DObject.new`/`new3`: da li' passa anche il caricamento, e rifiutare li' vorrebbe dire che un modello con duplicati preesistenti non si apre. Due reperti che hanno cambiato la sonda, non il ricordo: misurare a zero ms misura la latenza; e scrivere il solo `DObject.name` **non** fabbrica un duplicato visibile, perche' `get_name` legge lo slot d'identita' prima. §2, §5 e §6 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 17:50
## 2026-08-30 — test(smoke): ritaratura della baseline, il debito delle 44 risulta pagato
**Prompt**: «Micro: ritaratura della baseline smoke», dato in chat e non depositato in `docs/prompts/`. Ritarare su corsa quieta, aggiornare la sezione «Known debt» del README con la data, e provare con 3 corse GREEN consecutive piu' un diff che mostri SOLO le rimozioni attese — fermandosi e riportando se sparisce altro.
**Files touched**: frontend/scripts/smoke/console-baseline.json, frontend/scripts/smoke/README.md (commit unico `b2ffb9163`), docs/claude-code-log.md. **Zero sorgenti.** Nessun file condiviso con le sessioni parallele, che tengono sei file di `src/` modificati e che questa sessione non ha toccato.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Nessun file eseguibile toccato: il diff e' un JSON generato piu' una voce di README. La baseline **scende**, quindi A4 diventa piu' stretta, mai piu' larga.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (nessun file di §3.1)
**Smoke visivo**: **3 corse GREEN consecutive** sulla baseline nuova, 12/0/3, exit 0. Prima di quelle, due VOID **della sessione parallela**: `src/model/logicWrapper/nameUniqueness.ts` salvato dentro la finestra, 2 boot per stato e 4 asserzioni rosse per aritmetica su una conta raddoppiata. La guardia ha nominato il file e ha rifiutato di chiamarlo rosso — e' il caso per cui e' stata scritta il 30-08.
**Notes**: Diff verificato **meccanicamente**, non a occhio: 1 pattern rimosso (6/18/20 = 44), 0 aggiunti, 0 conteggi cambiati sui 12 comuni, e fuori da `patterns` cambiano solo `generatedAt` e `commit`. La condizione di stop del prompt non e' scattata. In «Known debt» la voce resta **barrata e datata** invece che cancellata: un debito pagato e' un fatto diverso da un debito mai esistito, e A4 quelle 44 le portava come margine fantasma.
**Prompt document name**: 2026-08-30 17:15
## 2026-08-30 — discovery: S1 si ferma sulla prima misura, cinque consumatori la reggono
**Prompt**: «S1: una regola di uniqueness, in un posto», dato in chat e non depositato in `docs/prompts/`. Prima slice della sequenza WriteCtx (referto `b9ca883fc` §5.1 e §6). Il prompt impone una misura PRIMA del fix — il censimento di chi consuma l'unicita' del nome M1 — con condizione di arresto esplicita: se almeno un consumatore richiede la regola larga (class-agnostic), fermarsi e riportare con l'evidenza, perche' la scelta risale al design.
**Files touched**: docs/discovery/discovery_2026-08-30_s1_uniqueness_consumatori.md (nuovo, 320 righe), docs/claude-code-log.md. **Zero sorgenti, zero sonde.** Commit del referto `3354fb0da`, log a parte. Nessun file condiviso con la sessione parallela, che ha committato la coda smoke (`39e5b3f2c`, `959d50c4f`, `68e2d7748`) mentre questa sessione leggeva: verificato su `git status --porcelain` prima del commit.
**Outcome**: ⚠️ partial — la Fase 1 e' completa e la condizione di arresto del prompt e' **verificata**, quindi il fix non e' stato scritto. Non e' una slice mancata: e' l'esito che il prompt prevedeva per questo ramo.
**Corregge**: —
**Causa**: (a)
**Regressions**: no — nessun file eseguibile toccato, nessun comando di scrittura eseguito. Gate non pertinenti e non girati (sola lettura); `npm run check:docs` sul log.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (sola lettura; nessuna modifica a sync/D-L)
**Smoke visivo**: non applicabile — nessuna modifica di resa.
**Notes**: Cinque consumatori vivi risolvono un'istanza M1 per nome in modo class-agnostic: due **scrivono** su quella risoluzione, uno **cancella** (`delete X`), tutti con un `.find` muto senza ramo per l'ambiguita'. Due reperti oltre il prompt: il binding di JjEL chiede uno scope che **nemmeno il core copre**, e le due regole non sono annidate ma **ortogonali**. Allinearsi a 12a spegnerebbe un badge committato (Regola 3). §2-§4 del referto. Tipo di commit per precedente di `b9ca883fc`.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 17:30
## 2026-08-30 — test(smoke): la guardia su calibrate, e il numero vero delle assertion
**Prompt**: «Coda smoke: calibrate con guardia + README», dato in chat e non depositato in `docs/prompts/`. Chiudere i due residui di `627ac1a0f`: (1) `calibrate.ts` guadagna la guardia di quiescenza — ritaratura valida solo su corsa quieta, altrimenti VOID senza scrivere; (2) README, «four assertions» -> il numero vero e una riga sulla regola che ora e' codice; (3) valutare e dichiarare l'estensione della radice sorvegliata a `vite.config.ts` + `index.html` + `public/`.
**Files touched**: frontend/scripts/smoke/{calibrate.ts,quiescence.ts,run.ts} (commit `39e5b3f2c`), frontend/scripts/smoke/README.md (commit `959d50c4f`), docs/claude-code-log.md. **Zero file di `src/`.** Nessun file condiviso con le sessioni parallele (R-DEL-4 su `Dummy.ts`, discovery WriteCtx).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo**, e zero righe di errore nominano `scripts/` (fuori dal program di tsconfig, verificato non assunto); `npm run build` exit 0 col solo chunk-warning.
**Out-of-scope changes**: no. `quiescence.ts` e una riga di report in `run.ts` sono richiesti dal punto 3 del prompt: senza, la riga «watched:» dichiarerebbe meno di cio' che sorveglia.
**Layer Impact Report**: not-required (nessun file di §3.1; il diff e' interamente sotto `scripts/`)
**Smoke visivo**: i tre test attesi tutti verdi. Perturbata (`touch public/favicon.ico` a 30 s dall'avvio) -> **VOID, exit 3, baseline byte-identica** (md5 `85a71c22…` prima e dopo), file nominato `modified public/favicon.ico`; il touch non ha cambiato contenuto (md5 del favicon identico, `git status` vuoto). Quieta -> baseline scritta, exit 0. **`npm run smoke` 5 corse consecutive: 5/5 GREEN, 12/0/3, exit 0** con la radice allargata.
**Notes**: Radice allargata dopo aver **misurato il costo**, non assumendolo: 4756 file in 22-25 ms contro 1379 in 9-13, ~50 ms su una corsa di minuti. Reperto da non perdere: la ritaratura quieta **abbassa** la baseline di 44 «two children with the same key» (6/18/20) — il debito che il README dava «to be verified» risulta pagato. Baseline **ripristinata e non committata**: abbassarla tocca anche la sezione «Known debt», fuori dallo scope dichiarato. Decisione ad Alfonso.
**Prompt document name**: 2026-08-30 16:45
## 2026-08-30 — docs: cosa serve a `WriteCtx`, e la doppia verita' che gia' diverge
**Prompt**: «Discovery: cosa serve a WriteCtx (la migrazione del motore in `jjform/`)». Quattro domande: inventario delle scritture degli adapter sul D-graph (firma, dilazioni, transazionalita', per sito); minimo comune che le copra senza importare il D-graph, con bozza di `WriteCtx` e mappa sito->metodo; cosa NON puo' migrare e per ciascuna se resta fuori per design o va dichiarata nel contratto; il costo della doppia verita'. Sola lettura, bozza nel referto e non nel sorgente, sequenza di slice proposta.
**Files touched**: docs/discovery/discovery_2026-08-30_writectx_migrazione_motore.md (nuovo, 410 righe), docs/claude-code-log.md. **Zero sorgenti, zero sonde.** Commit del referto `b9ca883fc`, log a parte.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file eseguibile toccato, nessun comando di scrittura eseguito. Gate non pertinenti e non girati (sola lettura); `npm run check:docs` 3/3 sul log.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (sola lettura; nessuna modifica a sync/D-L)
**Smoke visivo**: non applicabile — nessuna modifica di resa. Il perimetro letto (`IRForm`, montato da `InstanceManagerTab` **e** da `PropertiesWithTreeView`) e' registrato nel referto §2.2 perche' la slice S3 proposta tocchera' entrambe le superfici e lo smoke andra' girato su tutte e due.
**Notes**: Il reperto che decide: tre siti su quattro indirizzano gia' per `(id, chiave)`, solo `IRFormField` passa un proxy L vivo. Tre garanzie da dichiarare nel contratto: filtro containment-loop del picker, rifiuto in scrittura (`formWrite` torna `boolean` dove il core torna `{success, reason}`), doppio legame dell'identita'. Una **divergenza** misurata, non duplicazione: la uniqueness del nome — core al rename su tutto il namespace, motore alla create sui soli fratelli di stessa metaclasse.
**Prompt document name**: PROMPT_writectx_discovery.md (prompt inline; il documento non esiste in `docs/prompts/`) 2026-08-30 16:10
## 2026-08-30 — fix(core): R-DEL-4, la safety net di get_delete estesa a values
**Prompt**: «Fix R-DEL-4: la safety net di `get_delete` estesa a `values`», dato in chat e non depositato in `docs/prompts/`. La via minima ratificata a valle del censimento `.delete()` (referto del 30-08, terza opzione di §5): non la rilettura di `pointedBy` in `get__jjdependencies`, che tocca ogni classe L in una zona dove l'ordine e' delicato (R-FORM-11, resta a registro), ma l'estensione della rete gia' presente in `Dummy.get_delete` dal solo `father` anche a `values`. Vincoli: misurare il costo PRIMA, non toccare il contratto di `undefined` ne' l'ordine delle scritture.
**Files touched**: `frontend/src/common/Dummy.ts` (un blocco, 22 righe), `docs/decisions.md` (R-DEL-4 nuova), `docs/discovery/discovery_2026-08-30_rdel4_values_safety_net.md` (nuovo), `docs/claude-code-log.md`. Sonde `scripts/smoke/_tmp_rdel4_{cost,verify}.ts` e `_tmp_rdel4_verify.png` (non committate). Commit sorgente `c35d6822a`, docs `56c044bba`, log a parte. **Zero file condivisi** con la sessione parallela, che tiene `scripts/smoke/{README.md,calibrate.ts,quiescence.ts,run.ts}` modificati e che questa sessione non ha toccato: verificato su `git status --porcelain` prima di ogni commit, e ogni commit fatto con pathspec.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero, non una coda); l'unica riga che nomina `Dummy.ts` e' la `TS2307` di riga 46, pre-esistente e gia' nella lista dei 33 di CLAUDE.md §17. `npm run build` exit **0**, zero righe di errore, solo il chunk-warning. `npx vitest run` **2092 passed / 0 failed**, identico all'entry precedente, coi 9 file rotti all'import = baseline nota.
**Out-of-scope changes**: no. Un solo file sorgente, quello nominato dal prompt.
**Layer Impact Report**: not-required. `common/Dummy.ts` **non e' in §3.1** e non e' un file della sync: e' il D-L, e il diff vi aggiunge una scrittura della stessa forma di una gia' presente due righe piu' su, dentro la stessa `TRANSACTION` e nella stessa posizione relativa. Nessun `.new()` / `.new2()` / `.new3()` aggiunto: la §3.3 non e' in gioco.
**Smoke visivo**: **passato**. `npm run smoke` **12 passed / 0 failed / 3 skipped, VERDICT GREEN**, corsa quiescente (`moved: nothing`), un boot per stato. Sonda dedicata `_tmp_rdel4_verify.ts` **12/12 ALL GREEN, zero errori di pagina**: il (c) del fixture passa da `dangling 1` a `dangling 0`; il percorso fresco misurato col **gesto vero** (click sul nodo + `Delete`, 13 nodi -> 12) resta a slot vuoto; la cascata `father` e' invariata (13 `DValue` figli morti su 13, l'oggetto fuori da `m1.objects`); la matrice 2x2 di R-FORM-10 rigirata vede la colonna «stale» convergere a quella «fresco» in entrambe le cardinalita', mentre lo scarto snapshot/store resta misurabile (`6` contro `7`) — il difetto e' coperto a valle, non mascherato. Due contrasti nella stessa corsa: lo slot valorizzato **non** e' toccato e quello mai scritto resta vuoto, perche' una rete che svuotasse tutto darebbe lo stesso verde sul criterio principale.
**Notes**: Il costo e' stato preso **prima** del diff, sull'albero senza rete: 0.005 ms sull'`idlookup` da 112 voci, 0.57 a 10k, 4.72 a 50k, 23.75 a 200k; end-to-end 0.33 ms per delete intera su 30 in fila. Due cose dichiarate e non chiuse: la cascata resta O(N x |idlookup|), e la variante «`pointedBy` vivo» costa 0.0005 ms ma **non** e' stata scelta — e' l'indice che la rete esiste per compensare. §2 e §5 del referto.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 17:00
## 2026-08-30 — feat(nodes): missing sul nodo, e la delimitazione di R-FORM-10
**Prompt**: dato in chat, non depositato in `docs/prompts/`. Due lavori, commit separati: (1) applicare a `decisions.md` la delimitazione di R-FORM-10 gia' ratificata dal design (§4 del referto del 30-08), senza riscrivere la parte che resta vera; (2) far arrivare `missing` al nodo — `SlotShape` guadagna `required` dall'adapter, la guardia entra in `detectValueRenderer` fra `dash` e `brokenRef` come UNA decisione, il nodo la riceve dalla ladder (precedente R-STR-6 (B)).
**Files touched**: editor-v2/nodes/{valueRenderer.ts, RowValue.tsx, instanceNode.scss, ObjectNode.tsx} + 1 test, editor-v2/{types.ts, utils/jjomTransformers.ts}, abstract/tabs/{instanceTable.ts, InstanceManagerTab.tsx} + 1 test, docs/decisions.md (R-FORM-10 delimitata, R-FORM-15 nuova), docs/discovery/discovery_2026-08-30_missing_sul_nodo.md (nuovo), docs/claude-code-log.md. Sonda `scripts/smoke/_tmp_missing_verify.ts` e i tre `.png` (non committati). Commit `eae3af0fa` (delimitazione), `a42e9f2b8` (sorgenti), `f9b3390aa` (docs), log a parte. **Zero file condivisi** con le sessioni parallele (R-SMK-3 su `scripts/smoke/`, atterrata come `627ac1a0f`; censimento `.delete()` in sola lettura, `98860ca1f`/`d8d3439a5`), verificato su `git status` prima di ogni commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npx vitest run` **2092 passed / 0 failed**, **+10 esatti** sulle 2082, coi 9 file rotti all'import = baseline nota; typecheck **33 = baseline su output completo**, e nessuno dei 33 cade nei file toccati (grep sulla lista intera, non su una finestra); build exit 0 col solo chunk-warning; `npm run smoke` **12/0/3 VERDICT GREEN**.
**Out-of-scope changes**: no. Il perimetro e' di 10 file, oltre i 5 della Regola 19: elencato con cosa cambia in ciascuno e **confermato prima del diff**. L'estensione rispetto alla lettera del prompt sono i due file della tabella, ed e' la ragione della slice — vedi Notes.
**Layer Impact Report**: not-required — nessun file di §3.1. `jjomTransformers.ts` e' un transformer di sola lettura D->nodi RF e il diff vi aggiunge un campo opzionale; nessun write path della sync e' toccato.
**Smoke visivo**: **passato**, `_tmp_missing_verify.ts` ALL GREEN in **entrambi** i modi, zero errori di pagina. Nativo, IR e tabella danno la stessa classificazione sui tre stati (required-vuoto -> `missingRequired`, pointer appeso -> `brokenRef`, mai-scritto non-required -> `dash`). Contrasto: `lowerBound` 1 -> 0 riporta il trattino e **non** muove `brokenRef`; la view che chiede `textarea` non vince sullo stato. Ritagli `_tmp_missing_{native,ir,table}.png`. **Dichiarato**: la corsa di `npm run smoke` ha eseguito `run.ts`/`assertions.ts` allora non committati della sessione R-SMK-3 (poi `627ac1a0f`), quindi il verdetto vale per quell'albero e non per lo smoke a HEAD.
**Notes**: Il reperto che ha cambiato il diff: la divergenza non era una mancanza del nodo ma una **seconda copia della regola** — la tabella decideva con una guardia davanti allo switch, il motore non lo sapeva. Aggiungerne una alla ladder lasciando quella dov'era avrebbe prodotto due regole che oggi concordano e domani no: da qui i due file in piu' nel perimetro. Il contrasto `dash` e' stato misurato, non ricordato. §2 e §5 di `discovery_2026-08-30_missing_sul_nodo.md`.
**Prompt document name**: prompt inline (non depositato) 2026-08-30 16:00
## 2026-08-30 — test(smoke): la terna che rende lo smoke certificabile (R-SMK-3)
**Prompt**: «R-SMK-3: la terna che rende lo smoke certificabile». Implementare insieme, non in alternativa, le tre contromisure di §9 di `discovery_2026-08-30_6_smoke_flaky.md`: guardia di quiescenza sulle mtime di `src` (corsa **nulla**, non rossa), conteggio boot per stato (`[vite] connecting...` > 1 -> nulla), scarto delle chiavi `debug|[vite] …` da A4. Verdetto a tre valori. Solo `frontend/scripts/smoke/`, zero sorgente app.
**Files touched**: scripts/smoke/quiescence.ts (**nuovo**, 116 righe: `snapshotSrc`/`diffSnapshots`/`describeChanges`, root `frontend/src`), scripts/smoke/assertions.ts (+`VITE_CLIENT_KEY_PREFIX`/`isViteClientKey`/`countBoots`/`MAX_BOOTS_PER_STATE`, filtro su entrambi i lati in `assertConsoleAgainstBaseline`), scripts/smoke/run.ts (snapshot per finestra di stato, blocco RUN VALIDITY, verdetto e exit code), scripts/smoke/README.md, docs/claude-code-log.md. Commit sorgente `627ac1a0f`, log a parte. **Zero sorgente app, zero `states.ts`, zero `console-baseline.json`.**
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero, non una coda); `npm run typecheck:scripts` **138 errori, tutti e 138 nei `_tmp_*` non committati, 0 nei file committati** (controllo positivo: 138 righe di errore su 148); `npm run build` exit **0**, zero righe di errore, solo il chunk-warning; `npx vitest run` **2092 passed / 0 failed** coi 9 file rotti all'import = baseline nota. Nessun test importa lo smoke: le occorrenze di `scripts/smoke` sotto `src/` sono commenti che citano le sonde, verificate una per una.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (nessun file di sync/D-L; `scripts/` sta fuori da `include: ["src"]`)
**Smoke visivo**: è l'oggetto della slice, ed è il criterio d'accettazione. **Riproduzione del 30-08**: doppio `touch` su `joiner/classes.ts` a +12s/+18s, md5 `6d19220b…` **identico prima e dopo** -> la corsa esce **VOID, exit 3**, non rossa, e nomina la causa due volte in modo indipendente — `moved: modified src/joiner/classes.ts while 'empty-project' was open` e `boots: empty-project=3`. **Cinque corse verdi consecutive** (F_02..F_06) 12/0/3 exit 0, `moved: nothing`, `boots 1/1/1`. In mezzo, tre nulle non provocate dalla sessione parallela, una delle quali (E_03) sotto la vecchia imbracatura sarebbe stata **rossa con A1/A2 «canvas ABSENT»**: erano quattro salvataggi dentro la finestra, ora nominati.
**Notes**: F_01 e' **VOID con `12 passed, 0 failed, 3 skipped`**: una corsa che sarebbe sembrata verde non certifica, perche' l'albero si e' mosso — il punto di «un nullo non e' un pass». Residui dichiarati, non chiusi: `calibrate.ts` non porta la guardia (ritarare solo dopo un GREEN, nota nel README); la radice sorvegliata e' `src`, quindi `index.html`, `public/` e `vite.config.ts` restano scoperti. Tipo di commit non indicato dal prompt: `test(smoke):` per precedente di `5ac2449e6`.
**Prompt document name**: PROMPT_smoke_R-SMK-3.md (prompt inline; il documento non esiste in `docs/prompts/`) 2026-08-30 15:30
## 2026-08-30 — discovery: censimento dei `.delete()` per proxy stale
**Prompt**: «Censimento dei 67 `.delete()` per proxy stale», dato in chat e non depositato in `docs/prompts/`. Aprire la domanda di §3 di `discovery_2026-08-30_6_rform10_controesempio.md`: quanti siti tengono un proxy avvolto in una fase precedente? Classificazione statica in (a)/(b)/(c) per distanza wrap->delete, sonda a schermo SOLO sui (c), verdetto per sito in tabella, forma del fix proposta e non applicata. Solo discovery: zero modifiche a sorgente.
**Files touched**: docs/discovery/discovery_2026-08-30_censimento_delete_proxy_stale.md (nuovo), docs/claude-code-log.md. **Zero sorgenti.** Sonda `_tmp_delete_census_canvas.ts` (non committata). Commit del referto `98860ca1f`, log a parte. Nessun file condiviso con le sessioni parallele, che tengono `scripts/smoke/{assertions,run}.ts` modificati e che questa sessione non ha toccato.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file eseguibile toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (lettura del core, zero diff)
**Smoke visivo**: `_tmp_delete_census_canvas.ts` **ALL GREEN**, zero errori di pagina, corsa singola senza boot multipli. `npm run smoke` non rigirato: zero modifiche a sorgente da gateare.
**Notes**: Corregge due numeri del referto R-FORM-10 del 30-08 (non un prompt, quindi `Corregge` resta `—`). I siti sono **43, non 67**: 24 righe contate erano commenti. E (c) non e' «scritture interposte» ma «una scrittura che AGGIUNGE un puntatore entrante»: `get__jjdependencies` elenca dallo snapshot ma risolve ogni path sullo store vivo. Verdetto **(a) 17 · (b) 25 · (c) 1**, l'unico (c) e' il fixture. `syncDeleteVertex` pulito, col controllo negativo che prova il segnale.
**Prompt document name**: 2026-08-30 16:10
## 2026-08-30 — feat(jjform): multi-selezione e ricorsione inline, con due misure che hanno cambiato il diff
**Prompt**: `docs/prompts/PROMPT_12bc_multiselect_recursion.md`. Le due regole restanti del motore form: 12b (Mixed dichiarati, identita' mai bulk, delete multipla su preflight unico) e 12c (un livello di children inline, poi drill-in col breadcrumb), piu' il filtro containment-loop «su percorso raggiungibile». Vincoli: ordine delle scritture bulk misurato prima (R-FORM-11), motore in `jjform/` a zero import, divisione `*Draw`/`*Adapter`.
**Files touched**: jjform/{multi.ts, nav.ts, index.ts} + 2 test (nuovi), editor-v2/hooks/{multiDraw.ts, multiAdapter.ts} + 1 test (nuovi), abstract/tabs/InstanceManagerTab.tsx, abstract/tabs/instanceManagerTab.scss, docs/discovery/discovery_2026-08-30_slice12bc_multiselect_recursion.md (nuovo), docs/decisions.md (R-FORM-12..14), form-engine-contract.md §5.3 (due copie, md5 identici), docs/claude-code-log.md. Sonde `_tmp_12bc_{measure,q1,verify}.ts` e 4 `.png` (non committate). Commit sorgenti `8fb085d9e`, docs `372512796`, log a parte. **Zero file condivisi** con la sessione parallela (`ff9ee37e4`, `2e176e0e5`, `53f4fc01f`: soli documenti), verificato su `git diff --name-only`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npx vitest run` **2082 passed / 0 failed**, **+69 esatti** sulle 2013, coi 9 file rotti all'import = baseline nota; typecheck **33 = baseline su output completo**, zero errori nei file toccati; build exit 0 col solo chunk-warning; `npm run smoke` 12/0/3.
**Out-of-scope changes**: no per i sorgenti (9 file, il perimetro confermato). Espansione dichiarata sui soli **documenti**: `decisions.md` e le due copie del contratto, che e' la convenzione di ogni slice R-FORM.
**Layer Impact Report**: not-required — **la critical zone non e' toccata**. L'inline di 12c era pianificato dentro `IRFormField.tsx` (§3.1) e non ci e' andato: le form annidate le monta il manager, stesso precedente della barra «Add contained».
**Smoke visivo**: **passato, 25/25 ALL GREEN**, zero errori di pagina, sonda `_tmp_12bc_verify.ts` che COSTRUISCE il containment mancante nel fixture (`kids : AllNine` composition, catena a tre livelli) invece di darlo per presente. Mixed «(ALFA, BETA)» coi distinti e il contrasto su un campo concorde (0 etichette); scrittura bulk → entrambe a 777, il campo non toccato invariato, i nomi identici prima e dopo; inline al livello 1, drill-in con breadcrumb a 2 e poi a 3 segmenti, i figli che diventano LINK dal secondo livello (link 1, inline 0), il click sul primo segmento che torna alla radice in un colpo; delete multipla con UN dialogo, «Delete 2 AllNines?»; containment-loop per contrasto sul percorso vivo. Ritagli `_tmp_12bc_{multi,delete,inline,drill}.png`.
**Notes**: Tre scarti prompt/repo misurati prima di scrivere, in §0 del referto: il file di design citato **non contiene** la specifica (controllo positivo a segnale), il design nasconde **anche i children**, `R-2C-3` non esiste come ratifica. Due misure hanno cambiato il diff: le scritture bulk **non** vanno differite (0 perse su 3), e il filtro containment-loop sul percorso di edit e' **gia'** del core — non l'ho spostato (Regola 3). Dettagli e i due FAIL di sonda nel referto.
**Prompt document name**: PROMPT_12bc_multiselect_recursion.md 2026-08-30 15:00

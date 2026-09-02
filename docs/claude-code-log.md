# Claude Code Session Log

Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.

**Incidenti — sanatoria batch L1–L4 (2026-09-02).** Tre commit del batch portano un
contenuto che il loro messaggio non descrive. Nessun rewrite di history: e' stato un
rewrite su albero condiviso a causare il secondo incidente. Formato «SHA -> contenuto reale».

- `50de03252` — messaggio: «la entry SAVE1-bis, il timer che non sopravvive all'errore».
  Contenuto reale: la sola entry **DIRTY1**.
- `f278cf4fb` — messaggio: «la entry DIRTY1, scritta dalla corsia L4». Contenuto reale:
  le entry **SAVE1-bis + DIRTY1**, entrambe.
- `ed5c80daa` — referto UNQ1 C5 che cita l'hash del codice sbagliato (`46a38022`, tolto dal
  ramo dal `reset` di un'altra corsia). Corretto in `ca0adaf95`, che lo riporta a `4bde4359`.

## 2026-09-02 — fix: UNQ1 C5, la revoca duplicate-name resta nel modello scandito
**Prompt**: UNQ1 C5 — la revoca tocca solo le entry il cui owner appartiene al modello che
l'effetto sta scansionando (referto §A.4: revoca globale, produttore per modello, `:160-164`
— aprire M2 cancella le entry M1, e non tornano). Nessuna modifica alla firma, nessun rescan
aggiunto. Perimetro: `UniquenessProblemSync.tsx` + test, NON `LModelElement.tsx` (corsia L1).
Verifica con due collisioni vere insieme, per nome ESPLICITO, before/after.
**Files touched**: `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx`,
`frontend/src/components/editor-v2/problems/__tests__/UniquenessProblemSync.test.ts` (nuovo),
`docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (referto C5, commit a parte).
La sonda `scripts/smoke/_tmp_unq1_c5.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` su output COMPLETO **33**, la baseline esatta, **0**
nei file toccati; `npm run build` exit **0** col solo avviso di chunk-size noto; `npm run
test` intera **3118/3118** passati, 0 falliti. I 9 file che non si raccolgono sono i `window
is not defined` pre-esistenti, fuori da questo perimetro. Due mutazioni: revoca su tutti gli
owned set (il globale di prima) **3 rossi**, ciclo di revoca rimosso **4 rossi**.
**Out-of-scope changes**: no — due file di codice, entrambi nel perimetro. Commit per
pathspec: l'indice conteneva staged di altre corsie (`api/persistance/projects.ts`,
`egoDiagram.*`), non toccati.
**Layer Impact Report**: not-required — nessun file della lista di §3.2 e nessuna scrittura D:
il registro e' una `Map` di modulo, UI-only, immune a undo/redo e non persistita. La
directory `problems/` compare in §3.1, ma il diff non tocca canvas, JjOM ne' D-layer.
**Smoke visivo**: non applicabile — nessun pixel cambia. Misura sul registro con
`_tmp_unq1_c5.ts`, stesso strumento sui due lati, zero `pageerror` in entrambi: **before 9
PASS / 3 FAIL, after 12 PASS / 0 FAIL**. Entry M1 attive dopo l'apertura della tab M2 da **0
a 3**, al ritorno su M1 da **0 a 3**, dopo il rename di uno dei tre da **0 a 2**; le 2 entry
M2 restano 2 in ogni passo di entrambe le corse (controllo). Il before ottenuto ripristinando
il solo file da `git show HEAD:` e rimettendolo a posto da una copia, senza `stash` (RC-13).
**Notes**: `ownedIdsByModel`, `Map` di modulo per-modello: nessun campo su `NodeProblem`,
quindi `registry.ts` e il produttore della conformance restano fermi. Cade
`getRegistryState()`, che leggeva `window._jjNodeProblems` e in env `node` tornava vuota —
per cui la revoca era intestabile. Il corpo dell'effetto e' spostato in
`reconcileDuplicateProblems`, esportata per il test. Aritmetica: per una coppia il rename ne
revoca **due** (2 -> 0); il decremento chiede tre omonimi. Dettaglio nel referto C5.
**Prompt document name**: 2026-09-02 09:20

## 2026-09-02 — fix: UNQ1 F2, l'auto-nome non ombreggia piu' il nome vero di un nested
**Prompt**: UNQ1 F2 — (A) `get_name` (:6081): slot identita' con `values []` -> `data.name`,
auto-nome solo se anche `data.name` e' vuoto, previo censimento dei lettori che contano
sull'auto-nome in finestra; (B) `defaultname`: per un padre `DValue` di containment il
namespace e' quello di `getNamespaceOf`, non `lfather.childNames`; `get_children_idlist` non
si tocca. C1 scartato. Perimetro: `LModelElement.tsx` + il suo test, NON
`UniquenessProblemSync.tsx` (corsia L2).
**Files touched**: `frontend/src/model/logicWrapper/LModelElement.tsx`,
`frontend/src/model/__tests__/unq1AutoNameShadow.test.ts` (nuovo),
`docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (referto F2, commit a parte).
La sonda `scripts/smoke/_tmp_unq1f2_verify.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline esatta, **0**
nel file toccato; `npm run build` exit **0** col solo avviso di chunk-size noto; `npx vitest
run` intera **3118/3118** passati, 0 falliti. I 9 file che non si raccolgono sono i `window is
not defined` pre-esistenti, riverificati sul `LModelElement.tsx` di HEAD: falliscono identici
senza la correzione. Tre mutazioni: guardia di A resa inerte 3 rossi, namespace di B svuotato
3 rossi, `get_name` riportato a HEAD rosso sull'ancoraggio.
**Out-of-scope changes**: no — due file di codice, entrambi nel perimetro. Commit per
pathspec: l'indice conteneva staged di altre corsie (`api/persistance/projects.ts`,
`UniquenessProblemSync.tsx`), non toccati.
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx` e' L-layer
puro; nessuna scrittura D nuova, nessuna TRANSACTION, nessun creatore aggiunto.
**Smoke visivo**: passato — `_tmp_unq1f2_verify.ts` **before 4 PASS / 4 FAIL, after 8 PASS /
0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. Nella finestra i
campioni con `raw != proxy` passano da **9 a 0**; il secondo `Add` senza rinomina da
`Edition_0` a **`Edition_1`**; i duplicate-name attivi col modello aperto da **2 a 0**; le due
root restano `Book_0`/`Book_1` in entrambe le corse (controllo). Il before ottenuto
ripristinando il solo file da `git show HEAD:` e rimettendolo a posto da una copia, senza
`stash` (RC-13).
**Notes**: censimento di A: i tre lettori di `initialName` (`instanceTable.ts:127`,
`shapeDraw.ts:205`, `irReadCtx.ts:173`) lo chiedono tutti **dopo** il nome, nel caso che la
correzione lascia intatto; nessun bloccante. C1 non presa: `get_children_idlist` resta non
ridefinito su `LValue`, e la domanda di §8 del referto resta aperta. Dettaglio, mutazioni e
i tre punti ancora aperti nel referto F2 del discovery citato sopra.
**Prompt document name**: 2026-09-02 00:20


## 2026-09-02 — refactor: «Save & Exit» passa dall'helper, il timer non sopravvive (SAVE1-bis)
**Prompt**: SAVE1-bis — `SaveAndCloseProject` (`Navbar.tsx:508`) usa `saveProjectWithFeedback`
e poi chiude. Il conteggio di «Request timed out» in `Navbar.tsx` va a 0 e il test SAVE1 che
lo pinnava va aggiornato. Opzione all'helper solo se serve. Perimetro: Navbar.tsx,
`common/libraries/saveProject.tsx`, test. NON `api/persistance.ts` (corsia L4).
**Files touched**: `frontend/src/pages/components/Navbar.tsx`,
`frontend/src/common/libraries/saveProject.tsx` (solo commenti),
`frontend/src/common/libraries/__tests__/saveProject.test.ts`. Le sonde
`scripts/smoke/_tmp_save1bis_{verify,diag}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 23:20 (SAVE1)
**Causa**: (a)
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3118/3118** passati, i 9
file rossi falliscono in import (`window is not defined`) e sono preesistenti. Le due non
regressioni che il passaggio poteva rompere sono misurate a schermo su ENTRAMBI i lati (1a,
1b verdi in before e after). Quattro mutazioni sul codice nuovo: tolto il `return` sul
fallimento 1/15 rosso, cambiato l'argomento della chiamata 2/15, reintrodotto un timeout in
Navbar 1/15, chiusura spostata dentro l'`if` 1/15.
**Out-of-scope changes**: no — tre file, tutti nel perimetro. Nessuna opzione aggiunta
all'helper: non serviva, il chiamante sequenzia sul `Promise<boolean>` gia' esistente.
**Layer Impact Report**: not-required — nessun file di §3.1; l'unica scrittura D e'
`SetRootFieldAction('isLoading')` dentro l'helper, che c'era gia'.
**Smoke visivo**: passato — `_tmp_save1bis_verify.ts` **before 21 PASS / 1 FAIL, after 22
PASS / 0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. L'unico rosso
del before e' 2e, che e' il difetto: dopo un errore di salvataggio arrivava, dieci secondi
piu' tardi, un «Request timed out» spurio (il vecchio `clearTimeout` stava solo sul ramo di
successo). Il before gira sui sorgenti di HEAD ripristinati da `git show` e rimessi da una
copia, **senza `git stash`** (RC-13).
**Notes**: la (a) e' del perimetro di SAVE1, non della sua esecuzione: diceva «due call
site». `U.isProjectModified = false` rimosso e non riscritto: lo azzera gia' `ProjectsApi.save`
(`projects.ts:133`) e poi `CloseProject` (`Navbar.tsx:498`). Al primo giro la sonda dava 5 rossi
FALSI: `window` sostituito a meta' misura, strumenti morti che leggevano zero ovunque. Riarmati
via `addInitScript`, contatori in `sessionStorage` per attraversare il reload della chiusura.
**Prompt document name**: SAVE1-bis (in chat) — 2026-09-02 09:00

## 2026-09-02 — fix(persistance): il dirty flag non lo azzera l'autosave silenzioso (DIRTY1)
**Prompt**: DIRTY1, dal referto SAVE1. In `ProjectsApi.save` la riga che azzera
`U.isProjectModified` sta fuori da `if (!silent)`: dopo un drag di nodo il progetto risulta
pulito e l'avviso «Unsaved changes» alla chiusura non scatta. L'azzeramento entra nel ramo
`!silent`, nessun altro cambio a `save`, before/after. Non `Navbar.tsx` (corsia L3).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts` (nuovo).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 23:20 (SAVE1)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3091/3091** test passati
(3082 + i 9 nuovi), i 9 file rossi falliscono in import (`window is not defined`) e sono
preesistenti. Nessun chiamante dipendeva dall'azzeramento silenzioso: `saveProject.tsx` e le
tre voci di SAVE1 chiamano `save(project)` senza `opts`, quindi esplicito; l'unico
`{silent:true}` e' `useLayoutAutosave.ts:59`. I gate girano su albero condiviso con altre
corsie (vedi Notes).
**Out-of-scope changes**: no — due file, entrambi nel perimetro. Il commento del metodo,
che elencava `U.isProjectModified` fra le cose identiche nei due casi, e' aggiornato nello
stesso file: lasciarlo sarebbe stato falso.
**Layer Impact Report**: not-required — nessun file di §3.1; la modifica toglie una
scrittura su uno static di `U`, non ne aggiunge nel D-layer.
**Smoke visivo**: non applicabile. La misura e' il test, ESEGUITO e non letto: `projects.ts`
si importa in `environment: node` doppiati i suoi import e stubbato il `window` che
dereferenzia a modulo (`:453`), quindi il flag e' letto DOPO una chiamata vera a `save`.
**Before 6 PASS / 3 FAIL, after 9 PASS / 0 FAIL**, stesso file sui due lati; i 3 rossi del
before sono le sole asserzioni sul silent save. Quattro mutazioni tutte rosse: riga rimossa
4/9, condizione invertita 5/9, ramo Offline/Online saltato 6/9, version bump anche sul
silent 1/9.
**Notes**: riga misurata `api/persistance/projects.ts:133:9` — il prompt citava
`api/persistance.ts`, che non esiste (regola 15). Il difetto `version` che non avanza fra
due `save` sullo stesso `__raw` e' fuori perimetro: registrato in un test che lo asserisce
COM'E' (`1.1` due volte), cosi' il giorno che verra' corretto quel test diventa rosso.
Altre corsie comparse in albero a meta' sessione: constatate e lasciate, commit per
pathspec sull'indice altrui gia' staged (RC-13).
**Prompt document name**: DIRTY1 (in chat) — 2026-09-02 00:20

## 2026-09-02 — discovery: appendice UNQ1 F1, il «2» del tree conta figli (Q5/Q6)
**Prompt**: aggiunta a UNQ1 F1, dallo screenshot post CHECK 6: Book_0 con due figli
rinominati a nomi distinti, badge 2 nel tree, form «No issues», canvas pulito. Q5 il badge
aggrega i problemi dei discendenti sul padre, e da quale registro; Q6 il badge resta dopo
save + reload. Zero file di prodotto, sonde `_tmp_unq1_*`, nessun fix.
**Files touched**: `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (appendice
§A.0-§A.6 in coda al referto esistente, R-E/E-1: non riscritto). Zero prodotto. Le sonde
`scripts/smoke/_tmp_unq1_{badge,ctrl,form}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato; le sonde girano contro il dev server
e non modificano sorgenti, zero `pageerror` in tutte e tre.
**Out-of-scope changes**: no — un solo file, il referto.
**Layer Impact Report**: not-required — discovery read-only, nessun diff su §3.1.
**Smoke visivo**: non applicabile. Sonde: `_tmp_unq1_badge` 14/16, `_tmp_unq1_ctrl` 7/9,
`_tmp_unq1_form` 3/4. I due rossi di `_tmp_unq1_ctrl` sono il difetto di §A.4 scritto come
comportamento corretto; i due di `_tmp_unq1_badge` sono un controllo positivo che NON e'
partito (misura rotta, non un negativo) e sono stati rifatti in `_tmp_unq1_ctrl`, dove
passa; quello di `_tmp_unq1_form` e' l'asserzione che cercava «duplicate» dove la form
rende «1 warning».
**Notes**: il badge conta figli, non problemi: `instance.children.length`
(`TreeViewContent.tsx:891`), misurato 2/3/5 su padri con 0/0/2 entry attive. `FeatureRow`
non legge `_jjNodeProblems`; l'unico lettore dell'albero e' `EntityRow` (`:719-720`), per
il proprio id. I warning non sopravvivono al rename. Dopo il reload il badge resta perche'
restano i figli. Due fatti nuovi in §A.4 e §A.5. Referto per il resto.
**Prompt document name**: UNQ1 F1 aggiunta (in chat) — 2026-09-02 00:00

## 2026-09-01 — discovery: il duplicate-name che sopravvive a nomi diversi (UNQ1 F1)
**Prompt**: UNQ1 Fase 1, dal fatto lasciato aperto da CRUD3 F2 §A.3.3. Quattro domande con
misura: la sequenza dei nomi dal costruttore al primo render, il lifecycle di
`UniquenessProblemSync`, quale collezione e' «this scope», e se il caso si riproduce sulle
root. Zero file di prodotto, sonde `_tmp_unq1_*`, nessun fix.
**Files touched**: `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (nuovo).
Zero prodotto. Le sonde `scripts/smoke/_tmp_unq1_{recon,stale,transient,slot,roots}.ts` non
sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato. Le sonde girano contro il dev server e
non modificano sorgenti; zero `pageerror` in tutte e cinque.
**Out-of-scope changes**: no — un solo file, il referto.
**Layer Impact Report**: not-required — discovery read-only, nessun diff su §3.1.
**Smoke visivo**: non applicabile. Sonde: `_tmp_unq1_recon` 6/8, `_tmp_unq1_stale` 11/12,
`_tmp_unq1_transient` 3/4, `_tmp_unq1_roots` 3/3. I rossi sono asserzioni scritte come il
comportamento CORRETTO: sono la riproduzione del difetto, non un guasto della sonda.
**Notes**: nasce col nome giusto; il produttore lo legge sbagliato e non revoca.
`LObject.get_name` (`LModelElement.tsx:6081`) legge lo slot identita' prima di `data.name`;
lo slot, seminato in differita, per >=425 ms rende l'auto-nome, che per un padre `DValue` e'
SEMPRE `X_0`. La firma di `UniquenessProblemSync` legge il D grezzo: firma e scan vedono due
stati diversi, lo scan gira una volta sola e sbagliata. Root immuni. Referto per il resto.
**Prompt document name**: UNQ1 F1 (in chat) — 2026-09-01 23:55


## 2026-09-01 — feat(manager): «Save project» in testata, un salvataggio per tre chiamanti (SAVE1)
**Prompt**: SAVE1 — un bottone secondario «Save project» a sinistra di Export nell'header
di `InstanceManagerTab`, che chiami la stessa funzione di File -> Save Project e Ctrl/Cmd+S.
Non duplicare il blocco di `Navbar.tsx:1381-1400`: estrarlo in un helper e farlo usare dai
tre call site. Stato: disabilitato a progetto pulito **se** il dirty flag e' leggibile in
modo affidabile, altrimenti sempre attivo e dichiarato.
**Files touched**: `frontend/src/common/libraries/saveProject.tsx` (nuovo),
`frontend/src/common/libraries/__tests__/saveProject.test.ts` (nuovo),
`frontend/src/pages/components/Navbar.tsx`,
`frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`,
`frontend/src/components/abstract/tabs/instanceManagerTab.scss`. La sonda
`scripts/smoke/_tmp_save1_verify.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3081/3081** test passati
(3067 + i 14 nuovi), i 9 file rossi falliscono in import (`window is not defined`) e sono
preesistenti. Le due non regressioni che l'estrazione poteva rompere sono misurate a schermo,
non dedotte: Ctrl/Cmd+S e la voce File salvano ancora, contati sulla chiamata e non sul suo
effetto. Quattro mutazioni: tolto `clearTimeout` 1/14 rosso, tolto il reset di `isLoading`
2/14, cambiata la classe del bottone 1/14, la scorciatoia che bypassa l'helper 2/14.
**Out-of-scope changes**: no — cinque file, tutti nel perimetro dichiarato dal prompt
(«InstanceManagerTab.tsx, Navbar.tsx, il file dell'helper, test»); il foglio di stile e il
componente contano come unita' logica (RC-11). `SaveAndCloseProject` (`Navbar.tsx:508`) e' la
quarta copia storica del blocco e NON e' stata toccata: il prompt dice «due call site».
**Layer Impact Report**: not-required — nessun file di §3.1; l'helper non scrive nel D-layer
oltre a `SetRootFieldAction('isLoading')`, che e' l'azione che c'era gia'.
**Smoke visivo**: passato — `_tmp_save1_verify.ts` **before 7 PASS / 7 FAIL, after 14 PASS /
0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. I blocchi 0 e 3
(controlli positivi e non regressioni) verdi in ENTRAMBI i giri: sono loro che lo rendono
una misura. Il before gira sui sorgenti di HEAD ripristinati da `git show` e rimessi da una
copia, **senza `git stash`** (RC-13).
**Notes**: dirty flag misurato e SCARTATO, come il prompt prevede: `U.isProjectModified` e'
uno static (`U.tsx:211`) azzerato senza azione ne' evento, e `IRForm.tsx:344` dichiara gia'
che sottoscriverlo non e' possibile. Sempre attivo, spento solo in volo. Due difetti
pre-esistenti misurati e non toccati, annotati nella sonda: il flag lo pulisce anche
l'autosave silenzioso, e `version` non avanza fra due save vicini.
**Prompt document name**: SAVE1 (in chat) — 2026-09-01 23:20


## 2026-09-01 — fix(conformance): CHECK 6 chiede l'esistenza al grafo (CRUD3 F2)
**Prompt**: CRUD3 Fase 2 sul referto di F1, decisione ratificata «vederli, non visitarli».
Il perimetro di VISITA resta `model.objects`; cambia solo il test di ESISTENZA del
bersaglio in CHECK 6, col lookup gia' usato dai lettori che risolvono. Perimetro:
`ConformanceValidator.ts` + il suo test; il costruttore D non si tocca. Piu' tre voci di
appendice e il testo del warning di §6 misurato PRIMA del rimedio.
**Files touched**: `frontend/src/model/conformance/ConformanceValidator.ts`,
`frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts`, e l'appendice a
`docs/discovery/discovery_2026-09-01_crud3_edition_dangling.md`. Le sonde
`scripts/smoke/_tmp_crud3_{warn,f2_verify,visit}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**, zero `error`; `npx vitest run` intera **3067/3067**
test passati, i 9 file rossi falliscono in import (`window is not defined`, jjtl/jjscript/utils)
e sono preesistenti. Il rimedio e' MONOTONO per costruzione: `resolvedOnGraph` toglie
violazioni e non ne aggiunge, quindi `dopo ⊆ prima` in ogni stato, slot oltre `upperBound`
compresi (il proxy tronca, l'insieme e' piu' piccolo, la violazione resta). Tre mutazioni:
3/67, 1/67, 3/67 rossi sui test giusti.
**Out-of-scope changes**: no — un file di prodotto, il suo test, l'appendice al referto.
**Layer Impact Report**: not-required — nessun file di §3.1; il validatore legge il D-layer
e il proxy L in sola lettura, zero scritture, zero TRANSACTION, zero creatori.
**Smoke visivo**: passato — `_tmp_crud3_f2_verify.ts` **12/12 in entrambe le direzioni**,
girata due volte (before coi sorgenti di HEAD ripristinati da `git show`, nessun `git stash`).
Badge sul canvas 1 -> 0 sul nested, `sequel`->root resta 0 in tutte e due; form di Book_1
da «1 error» a «No issues» col chip `Edition_0` ancora risolto; tiene dopo la ricarica.
Zero `pageerror`.
**Notes**: il barrel NON e' importato: il test gira in `environment: node` e la sua
intestazione dichiara la convenzione; il proxy che serve, il validatore ce l'ha gia'.
Non e' un `Corregge`: F2 continua F1 (referto ✅), non lo rimedia. R-CR3 misurata: 69
oggetti su 87 (79.3%) delle fixture M1 sono nested, e allargando la visita si accende il
100% di quelli del fixture (3/3). Il warning di §6 e' `duplicate-name`, non conformance, e
resta dopo il rimedio. Tutto in appendice al referto, §A.1-A.3.
**Prompt document name**: CRUD3 F2 (in chat) — 2026-09-01 23:15


## 2026-09-01 — discovery: Edition_0 esiste per l'albero e non per il validatore (CRUD3 F1)
**Prompt**: CRUD3 Fase 1, cinque domande con misura (Q1 i cinque lettori, Q2 dove sta
l'oggetto su fixture a due modelli omonimi, Q3 come `createInstance` sceglie il modello,
Q4 la race di deferral, Q5 il form nested che dice «No issues»). Read-only sul prodotto,
sonde `_tmp_`, nessuna ipotesi di fix nel referto.
**Files touched**: `docs/discovery/discovery_2026-09-01_crud3_edition_dangling.md` (nuovo).
Zero file di prodotto. Le sonde `scripts/smoke/_tmp_crud3_{recon,red}.ts` non sono
committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, nessun file di prodotto letto in
scrittura. Le due sonde girano contro il dev server e non modificano sorgenti.
**Out-of-scope changes**: no — un solo file, il referto.
**Layer Impact Report**: not-required — discovery read-only, nessun diff su §3.1.
**Smoke visivo**: non applicabile — nessuna modifica visiva. Le sonde:
`_tmp_crud3_recon.ts` **12/12**, `_tmp_crud3_red.ts` **10/10**, zero `pageerror` in
entrambe.
**Notes**: causa a `joiner/classes.ts:774-784` — un `DObject` col padre `DValue` va in
`values`, mai in `objects` — mentre il perimetro del validatore E' `model.objects`
(`ConformanceValidator.ts:27`). Q4 scartata: rosso a t=0, a +3500 e dopo ricarica, col per
contrasto verde. Q5: indice unico, la violazione e' del referrer. I due `model_1` omonimi
non c'entrano. Il resto — tabella Q1, misure, una lettura intermedia corretta, la residua,
i candidati col costo — nel referto.
**Prompt document name**: CRUD3 F1 (in chat) — 2026-09-01 22:30


## 2026-09-01 — docs(log): rotazione P9, le ventitre' entry oltre la quarantesima (DOCS1)
**Prompt**: DOCS1 — «ruota il log oltre le 40 voci». La soglia di P9 e' 40 e il file attivo
era a 62 dopo la chiusura di IRF1 e di CRUD2 Fase 2; le rotazioni precedenti l'avevano
segnalata ma non eseguita, perche' la corsia era di un'altra slice.
**Files touched**: `docs/claude-code-log.md` (62 -> 40 voci), `docs/claude-code-log-archive.md`
(1002 -> 1025 voci, piu' la nota di rotazione datata). Nessun sorgente.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato. Lo spostamento e' verificato per
costruzione e non a occhio: l'attivo e' un PREFISSO byte a byte di quel che era (nessuna
riga aggiunta, `git diff --numstat` da' `0 548`), l'archivio conserva integro il suo
contenuto precedente come prefisso, e le 70225 byte uscite dall'attivo sono identiche a
quelle entrate nell'archivio (sha256 `5681e6a69f6017ef` da entrambe le parti).
**Out-of-scope changes**: no — i due file del log, nient'altro.
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile — task documentale. `npm run check:docs` **3/3**.
**Notes**: taglio per POSIZIONE; al confine posizione e timestamp concordano senza
inversione (ultima tenuta 20:45, prima spostata 19:30). Tutte e 62 avevano un timestamp ben
formato: i due criteri sono stati confrontati, non scelti. Le inversioni interne al blocco
sono pre-esistenti e restano — appeso nell'ordine del file attivo, verbatim, come
`cc802fea2`. Il dettaglio e' nella nota di rotazione in testa al blocco archiviato.
**Prompt document name**: DOCS1 (in chat) — 2026-09-01 21:45


## 2026-09-01 — fix(form): la form vede cambiare un'annotation della metafeature (IRF1)
**Prompt**: IRF1, dal difetto pre-esistente misurato da TXT1 Fase 2 §6.1. Riproduzione
PRIMA come sonda, col contrasto sulla chiave vecchia; sottoscrizione di `IRForm` estesa
alla sorgente delle annotation della metafeature per la via meno invasiva, senza
ristrutturare il recompute; Layer Impact Report col censimento di chi altro legge quelle
deps; delta di re-render misurato su un gesto non pertinente.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (import del
prefisso, il selettore `annotationSignature`, la dep nella memo, l'intestazione che diceva
«Reactivity comes entirely from `useIRFormView`»), il test nuovo
`viewpoint/ir/__tests__/irFormAnnotationSubscription.test.ts`, e il referto
`docs/discovery/discovery_2026-09-01_irf1_annotation_subscription.md`. La sonda
`scripts/smoke/_tmp_irf1_verify.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 19:30 — TXT1 Fase 2, il punto §6.1 che il suo referto dichiaro' non riparato
**Causa**: (c)
**Regressions**: no — su HEAD fuso con CRUD2: `npx tsc --noEmit` **33** su output COMPLETO,
exit 2 (baseline invariata, zero errori nei file toccati); `npm run build` exit **0**, zero
`error`, solo il warning di chunk noto; `vitest` su `viewpoint/ir/` + `nodes/` + `jjform/`
**983/983**. Sonde TXT1: `_tmp_txt1_verify.ts` **21/21 ALL GREEN**, `_tmp_txt1_recon.ts`
14/16 coi soli bracci 4 e 5b, l'inversione gia' dichiarata dalla Fase 2. Sei mutazioni sui
punti portanti: 1/1/1/1/2 rossi sulle unita' e — la piu' importante — la firma sul solo
array di puntatori misurata SULL'APP, verde su B e C e **rossa su D**, che e' la cecita'
prevista mostrata invece che affermata.
**Out-of-scope changes**: no — un file di prodotto piu' il test piu' il referto.
**Layer Impact Report**: produced — in chat e in §5 del referto, prima del diff. D-layer in
sola LETTURA (zero scritture, zero TRANSACTION, zero creatori); il solo layer modificato e'
il render IR. `useIRFormView` non e' toccato: allargarne la firma avrebbe fatto ri-risolvere
`resolveIRView` e ripubblicare le cross-deps per una larghezza.
**Smoke visivo**: passato — `_tmp_irf1_verify.ts` **12/12 ALL GREEN**, zero errori di pagina,
NESSUN nudge in nessun braccio. Prima del rimedio 3 rossi: `multiline` e `renderer=swatch`
lasciavano la form ferma oltre il budget di 6000 ms mentre lo store portava gia' la
dichiarazione. Dopo: growtext a 12 colonne in **264 ms**, swatch a 3 colonne in **254 ms**,
ritorno all'input dopo il clear in **252 ms**.
**Notes**: (c) perche' la diagnosi ereditata era la memo, e la memo non c'entra: `slots` e'
`get_features`, un array nuovo a ogni lettura — referto §1. Costo misurato, non stimato, con
un contatore tolto prima del commit: +1 render prima e +1 dopo su un gesto non pertinente,
0 e 0 a riposo. Il `clear` non tocca `annotations` (1 -> 1 puntatori, `source` -> `''`): §4.2.
Un `git stash push` fallito in silenzio ha fatto aprire al `pop` lo stash di luglio: riparato,
stash list intatta, §14.
**Prompt document name**: IRF1 (in chat) — 2026-09-01 20:15


## 2026-09-01 — feat(manager): la cardinalita' nel modale, e l'aggregation non sfratta piu' (CRUD2 F2)
**Prompt**: CRUD2 fase 2, go-ahead sul referto
`discovery_2026-09-01_crud2_cardinalita_aggancio.md`. Tre punti gia' decisi (multi-selezione
via (b), §2.5 corretto nella scrittura, §2.6 gate astratto in `addChildReason`) piu' un
punto 4 da misurare PRIMA di tutto: il passaggio alla sintassi astratta dopo lo sfratto.
**Files touched**: `jjform/{create.ts, outline.ts, index.ts, writeCtx.ts}`,
`editor-v2/hooks/createAdapter.ts`, `abstract/tabs/{InstanceManagerTab.tsx,
instanceManagerTab.scss}` + i tre di test (`jjform/__tests__/{create,outline,writeCtx}.test.ts`)
e §7 del referto. Le sonde `_tmp_crud2{e,f,g}_*.ts` non sono committate (`.gitignore:66`).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (baseline invariata);
`npm run build` exit **0**, solo il warning di chunk noto; `npx vitest run` **3061/3061**
test verdi, con i **9** file rossi all'import che sono i pre-esistenti (misurato per
contrasto: con la modifica in stash, gli stessi 9 file e 3035 test). Sette mutazioni sui
blocchi nuovi (dedup tolto, append invece di replace, `draftTargets` che ignora `refsMany`,
`value` che porta il primo pick, gate astratto rimosso, gate dopo l'upper bound, outline che
ignora la shape): 1/2/5/1/4/1/2 rossi, verde al ripristino.
**Out-of-scope changes**: no — ma **SETTE** file di prodotto, sopra la soglia della regola 19:
elencati con cosa cambia in ciascuno nel referto §7.5, tutti conseguenza diretta dei tre
punti autorizzati.
**Layer Impact Report**: not-required — nessun file di §3.1; zero righe nel core, zero
`TRANSACTION` nuove, zero creatori annidati.
**Smoke visivo**: passato — `_tmp_crud2g_verify.ts` **13/13**, zero errori di pagina; lo
stesso file coi sette sorgenti da HEAD da' **7/13**, i sei rossi esattamente sugli arm della
nuova semantica e i sette controlli verdi. `_tmp_crud2e_absyntax.ts` **11/11**,
`_tmp_crud2f_agg.ts` **5/5**.
**Notes**: ⚠️ per il punto 4, non per il codice. Il renderer **digerisce** il buco `[null]`:
0 errori, canvas montato, sopravvive alla ricarica — quindi l'errore dell'utente e' un TERZO
path e risale (referto §7.1). §2.5 chiuso **senza toccare il core**: `setValueAtPosition`
espone gia' `info.isContainment`, misurato §7.2; costo dichiarato, la sola aggregation paga
una seconda deferral. Il lower bound resta «almeno un valore» — ora alzabile, ma e' decisione
di merito non richiesta (§7.3).
**Prompt document name**: CRUD2 FASE 2 (in chat) — 2026-09-01 20:30


## 2026-09-01 — feat(form): `jjodel/multiline` porta un EString alla textarea che cresce (TXT1)
**Prompt**: TXT1 fase 2, go-ahead sul referto
`docs/discovery/discovery_2026-09-01_txt1_annotation_multiline.md`. Decisioni gia' prese:
quinta chiave del carrier, terza famiglia di parsing (booleana), rung 2 **dopo** il blocco
renderer; i due toggle possono stare accesi insieme, con un hint invece di un divieto;
`FormWidget.textarea` (GrowTextWidget) e non `WidgetKind.textarea` (JjEL); emendamento A3
alla spec con la collisione di id A2 dichiarata; commento stale in testa a
`rowViewAnnotations.ts` corretto; braccio 3.0 della sonda di Fase 1 girato di verso.
**Files touched**: `editor-v2/nodes/{rowViewAnnotations.ts, displayAnnotationFields.ts,
DisplayAnnotations.tsx}`, `jjform/layout.ts`, `editor-v2/viewpoint/ir/IRForm.tsx`,
`docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md` + i tre di test
(`jjform/__tests__/layout.test.ts`, `nodes/__tests__/{rowViewAnnotations.test.ts,
displayAnnotationFields.test.ts}`) e il referto di Fase 2. Le sonde
`scripts/smoke/_tmp_txt1_{recon,verify}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO, exit 2 (baseline
invariata, zero errori nei file toccati); `npm run build` exit **0**, solo il warning di
chunk noto; suite `nodes/__tests__/` + `jjform/__tests__/` + `ir/__tests__/` **943/943**.
I gate girano sull'albero che porta anche AUTO1 F2, atterrato in parallelo: dichiarato.
Sette mutazioni sui punti portanti (chiave tolta dall'unione, rung 2b prima del rung 1,
precedenza del renderer invertita, valore coerciuto invece che scartato, gate del tipo
tolto, gating sganciato da `textual`, hint incondizionato): 7/2/1/1/1/3/1 rossi, 476/476 al
ripristino.
**Out-of-scope changes**: no — sei file di prodotto/spec piu' i tre di test, tutti dentro i
nove del perimetro dichiarato. `useFormWidgets.ts` NON toccato: era l'incrocio con AUTO1
(riga 314) e non serviva — `describeSlot` chiama gia' `parseRowViewAnnotations`, quindi la
quinta chiave arriva al descriptor da sola. AUTO1 ha emendato quella riga nello stesso
albero; i due diff non si sovrappongono.
**Layer Impact Report**: produced — in chat prima del diff. Layer toccati: lettore delle
annotation, scala delle larghezze (rung 2), render della form IR (§3.1). Nessun layer D/L,
JjOM, sync, canvas o persistenza.
**Smoke visivo**: passato — `_tmp_txt1_verify.ts` **23/23 ALL GREEN**, zero errori di
pagina: la cella passa da 184px a 375px (6 -> 12 colonne) con `textarea.ir-growtext` e senza
l'hint JjEL; il `\n` sopravvive a `VersionFixer.update` + `LoadAction`; quattro preset senza
clip (`scrollHeight <= clientHeight`, 52/52); `renderer=code` vince e togliendolo la
growtext torna, con nessuna delle due dichiarazioni cancellata. `_tmp_txt1_recon.ts` 14/16:
i due rossi sono i bracci 4 e 5b, che asserivano la PRESENZA del buco — inversione attesa e
dichiarata, non una regressione.
**Notes**: la sonda ha trovato due cose non riparate qui, argomentate in
`discovery_2026-09-01_txt1_fase2_multiline.md` §6.1-6.2 e §9. La form non si ridisegna sulla
scrittura di un'annotation (deps di `IRForm`); misurato per contrasto identico su
`jjodel/renderer`, quindi pre-esistente e in critical zone. E il ri-impacchettamento delle
righe non e' il tetto violato: fra i campi che si muovono nessuno cresce.
**Prompt document name**: PROMPT_TXT1_multiline_textarea.md — 2026-09-01 19:30

## 2026-09-01 — feat(manager): un attributo ID di tipo EInt si numera da se' (AUTO1)
**Prompt**: AUTO1 fase 2, go-ahead sul referto
`docs/discovery/discovery_2026-09-01_auto1_id_autoincrement.md`. Tre decisioni gia' prese:
il campo ID sparisce dal modale di create, lo scan e' per `attr.id` sui DValue, il seed sta
dentro il json di `createInstance` con gate `isID && EInt` su seed E read-only, `newDraft`
intatto.
**Files touched**: `jjform/{shape.ts, create.ts}`,
`components/editor-v2/hooks/{shapeDraw.ts, createDraw.ts, createAdapter.ts}`,
`components/editor-v2/viewpoint/ir/useFormWidgets.ts` + i tre di test
(`jjform/__tests__/create.test.ts`, `hooks/__tests__/createDraw.test.ts`,
`ir/__tests__/useFormWidgets.test.ts`). La sonda `scripts/smoke/_tmp_auto1_verify.ts` non e'
committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (baseline invariata);
`npm run build` exit **0**, solo il warning di chunk noto; suite `jjform/` + `hooks/` +
`viewpoint/ir/` + `abstract/tabs/` **1337/1337**. I tre blocchi nuovi provati contro SEI
mutazioni (gate senza la clausola EInt; `draftableAttrs` che non esclude; scan senza il
guard sui valori; scan senza `Number.isFinite`; scan non indicizzato sull'attributo;
sequenza che parte da 0; form che ignora il flag): 4/1/1/1/5/1/1 rossi, verde al ripristino.
**Out-of-scope changes**: no — i 6 file autorizzati dal referto piu' i 3 di test.
**Layer Impact Report**: produced — in chat prima del diff. Layer **D** (sola lettura: uno
scan di `idlookup` per `className === 'DValue' && instanceof === attrId`, lo stesso spazio di
CHECK 11 `ConformanceValidator.ts:366-377`) e **JjOM** (una chiave in piu' nel json che
`createInstance` gia' passa ad `addObject`). Zero TRANSACTION nuove, zero creatori annidati.
**Smoke visivo**: passato — `_tmp_auto1_verify.ts` **21/21 ALL GREEN**, zero errori di
pagina; lo stesso file girato coi 6 sorgenti ripristinati da HEAD da' **13/21**, con gli 8
rossi esattamente sugli arm della nuova semantica e i 13 controlli verdi. Sequenza 1,2,3 su
tre create; 42 del chiamante non sovrascritto e la create dopo riparte da 43; una sola
`DAttribute` su due rami fratelli (Book/Disc) da' 1,2,3; il modale di create non mostra
`code` e mostra `title/slug/weight`.
**Notes**: un solo gate (`jjform/shape.isAutoIdAttr`) letto dai tre consumatori, o il campo
nascosto nel draft e quello bloccato nella form divergono. Le scelte che il diff non spiega
— campo assente per scelta, `featureFlags` non allargata, import profondo, scan non filtrato
per modello, sequenza da 1, il giro «prima» annullato e rifatto — stanno in
`discovery_2026-09-01_auto1_id_autoincrement.md` §8, scritta qui. Log a 59 voci contro la
soglia P9 di 40: rotazione non fatta, §8.8.
**Prompt document name**: AUTO1 fase 2 (in chat) — 2026-09-01 19:00


## 2026-09-01 — fix(persistence): `highestVersion` non e' piu' azzerato dall'ordine statico (VF1)
**Prompt**: VF1 (in chat), dal referto TXT1 §7. In `VersionFixer` i campi statici si
inizializzano in ordine di dichiarazione: `versionAdapters = setup()` porta `highestVersion`
a 2.228, la riga dopo lo rimette a 0. `update()` salta `setup()` (adapter truthy, `:112`) e
cicla `while (currVer !== 0)` — «missing version adapter from "2.228"» su uno stato gia'
all'ultima versione. Test prima del fix, censimento dei lettori, Layer Impact Report.
**Files touched**: `frontend/src/redux/VersionFixer.tsx` (le due righe scambiate + il commento
che spiega perche' l'ordine e' portante). La sonda `scripts/smoke/_tmp_vf1_verify.ts` non e'
committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (baseline invariata);
`npm run build` exit **0**, solo il warning di chunk noto; `src/redux/__tests__/` **44/44**.
La sonda VF1 e' scritta PRIMA del fix e misurata rossa: 4 bracci su 8 rossi (B, C, D, F) con
i tre controlli verdi; dopo lo scambio **8/8 ALL GREEN**, zero errori di pagina. Braccio H
(non-regressione richiesta): stato dell'app -> JSON -> `update()` -> **byte-identico**,
114634 = 114634.
**Out-of-scope changes**: no — un solo file di prodotto.
**Layer Impact Report**: produced — in chat prima del diff. Layer **Persistence**, unico
toccato. Lettori censiti (`command grep -rn "highestVersion|highestversion" src/`, 13 esiti):
`:119` (il while, il difetto), `:140` (`v.version !== highestVersion`), `get_highestversion()`
per i tre lettori esterni `joiner/classes.ts:1160`, `:4094`, `redux/store.tsx:104`;
`api/DTO/UpdateProjectRequest.ts:54` e' commentato. `update()` ha un solo chiamante fuori
classe: `components/topbar/SaveManager.ts:56`.
**Smoke visivo**: passato — `_tmp_vf1_verify.ts` 8/8; `_tmp_txt1_recon.ts` 17/18, l'unico
rosso e' il braccio 3.0, che asserisce la PRESENZA del difetto (`cold === 0`): ora legge
2.228. E' l'inversione attesa, non una regressione; i 17 restanti, giro salva/ricarica
compreso, restano verdi. La sonda TXT1 non e' committata e non e' stata modificata.
**Notes**: nell'app il fix e' inerte all'osservazione — `DState.new()` al boot valuta
`store.tsx:104`, che ripara il campo prima di `SaveManager.load`. Sparisce la latenza: ogni
via che raggiunga `update()` prima di un `new DState()` moriva. Secondo sintomo chiuso: a 0,
`:140` rigenerava ogni view non toccata a ogni caricamento (braccio F). Il `= 0` resta:
`setup()` accumula con `Math.max`. Perche' non e' un test vitest, e la via scelta: intestazione
di `scripts/smoke/_tmp_vf1_verify.ts`.
**Prompt document name**: VF1 (in chat) — 2026-09-01 18:30


## 2026-09-01 — feat(manager): i chip di enum della tabella prendono il colore (PILL2)
**Prompt**: «non vedo nessun pill colorato», con screenshot. Le pill dello screenshot sono
i chip di enum della tabella del Manager (`instance-manager__chip`), non le ref pill della
form IR colorate un'ora prima: **avevo colorato la superficie sbagliata**. Stessa palette,
stesso modulo, superficie giusta.
**Files touched**: `abstract/tabs/{instanceTable.ts, InstanceManagerTab.tsx,
instanceManagerTab.scss}` e `abstract/tabs/__tests__/instanceTable.test.ts` (blocco nuovo,
5 casi, ora 38). La sonda `scripts/smoke/_tmp_pill2_verify.ts` non e' committata
(`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 16:30
**Causa**: (a)
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (baseline invariata);
`npm run build` exit **0**, solo il warning di chunk noto; suite `abstract/tabs/__tests__/`
+ `jjform/__tests__/` **714/714**. Blocco nuovo provato contro TRE mutazioni (slot anche al
multivalore, fallback a 1 invece di `undefined`, lista di alternative fasulla): 1/2/3
rossi, verde al ripristino.
**Out-of-scope changes**: no — quattro file, sotto la soglia della regola 19.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`: si calcola un indice e si aggiunge una classe.
**Smoke visivo**: passato — `_tmp_pill2_verify.ts` **9/9**, zero errori di pagina, chiaro e
scuro. Colonna `stroke`: `SOLID`/`DASHED`/`DOTTED` escono slot 1/2/3, tre fondi distinti in
entrambi i temi; lo stesso letterale e' sempre dello stesso colore.
**Notes**: lo slot e' l'indice del letterale nella PROPRIA enumerazione, non una posizione
globale: `High` e' lo stesso colore in ogni colonna tipata sulla stessa enum, e due enum
diverse possono riusare uno slot — non sono alternative fra loro. Un enum multivalore resta
neutro (il testo e' una giunzione). Due errori della sonda corretti: il fixture aveva un
solo letterale in uso, e la prima messa in scena scriveva su `tint`, che rende SWATCH e non
chip — la colonna a chip si legge ora dal DOM.
**Prompt document name**: «non vedo nessun pill colorato» (in chat) — 2026-09-01 17:20




## 2026-09-01 — docs(discovery): CRUD2 fase 1, la cardinalita' conferma e l'orfano no
**Prompt**: CRUD2 (in chat), due difetti dal prodotto del 01-09, discovery-first su
entrambi. 1) i dropdown delle associazioni ignorano la cardinalita'; 2) il child creato
da «+ Add <Cls>» non sarebbe legato al parent, con errore al passaggio alla sintassi
astratta.
**Files touched**: `docs/discovery/discovery_2026-09-01_crud2_cardinalita_aggancio.md`
(nuovo) e questa entry. **Zero file di codice**: la Fase 2 attende il go-ahead e due
decisioni di merito (referto §4). Le sonde `scripts/smoke/_tmp_crud2_*.ts` non sono
committate (`.gitignore:66`).
**Outcome**: ⚠️ partial — il punto 1 e' mappato per intero; il punto 2 e' FALSIFICATO
nella forma descritta e resta aperto in attesa dello stato dell'utente.
**Corregge**: —
**Causa**: (a)
**Regressions**: no — nessun file di codice toccato, nessun gate da muovere.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — fase read-only, zero scritture committate.
**Smoke visivo**: non applicabile — nessun delta visivo. La misura e' a sonda, quattro
giri: `_tmp_crud2_recon.ts` 8/8, `_tmp_crud2_recon2.ts` 9/9 (padre alla radice, padre
contenuto, ritorno alla sintassi astratta, ricarica: zero errori di pagina in tutti),
`_tmp_crud2_recon3.ts` 5/6 (l'arm H resta non misurato, dichiarato),
`_tmp_crud2_recon4.ts` 4/5 con il difetto nuovo misurato.
**Notes**: la premessa del punto 2 non regge: `InstanceManagerTab.tsx:2890` passa gia'
`(child.of, subjectId, child.key)`, e l'orfano e' impossibile per costruzione —
`useEditorMode.ts:421` classifica con `!!composition`, `LModelElement.tsx:7168` scrive il
father con `composition || aggregation`. La stessa divergenza al contrario da' pero' un
difetto misurato, e un secondo reperto tocca `addChildReason`. Decisioni aperte, reperti
nuovi e motivo dell'arresto nel referto: §1.6, §2.5, §2.6, §4, §5.
**Prompt document name**: CRUD2 cardinalita' e aggancio (in chat) — 2026-09-01 17:10


## 2026-09-01 — feat(form): una tinta per alternativa sulle pill dei riferimenti (PILL)
**Prompt**: «colora le pill», chiarito in chat: schema con molti colori, distinti fra
opzioni **alternative fra loro**; ciclatura oltre la palette; perimetro alle sole pill
della form IR; slot per posizione nella lista di opzioni. Perimetro di 12 file elencato e
confermato prima di scrivere (regola 19).
**Files touched**: `styles/tokens/{_colors-light,_colors-dark}.scss`,
`jjform/{optionColor.ts (nuovo), index.ts}`,
`editor-v2/viewpoint/ir/{IRFormField.tsx, irFormStyle.scss}`,
`editor-v2/viewpoint/ir/widgets/{widgetProps.ts, ChipInputWidget.tsx, ReferenceWidget.tsx,
ReferencePicker.tsx, formWidgets.scss}`, `jjform/__tests__/optionColor.test.ts` (nuovo).
La sonda `scripts/smoke/_tmp_pill_verify.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (123 righe, exit 2 =
baseline invariata); `npm run build` exit **0**, solo il warning di chunk noto; suite
`jjform/__tests__/` + `viewpoint/ir/__tests__/` **775/775**. Unita' nuova (16 casi) provata
contro QUATTRO mutazioni (slot fisso a 1, fallback a 1 invece di `null`, indice ripartito
per gruppo, spazio iniziale della classe tolto): 8/2/1/2 rossi, verde al ripristino.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`, nessuna scrittura verso lo store: si aggiunge una classe e si leggono token.
**Smoke visivo**: passato — `_tmp_pill_verify.ts` **16/16**, zero errori di pagina, chiaro e
scuro, su nove candidati messi in scena. Sette colori distinti sulle prime sette
alternative, l'ottava riprende la prima, il filtro non ridipinge le superstiti, un valore
fuori lista non prende slot.
**Notes**: **sette** slot e non otto: escluse le tre famiglie di stato del DS, otto tinte
ordinate non superano i pavimenti (validatore dataviz: CVD ΔE 12.5 / 10.4, normale 21.7 /
17.8). Testo al passo 700 e non 600 — a 600 quattro slot stavano sotto AA sulla propria
velatura, il cyan committato compreso (3.54:1). Due errori della sonda corretti:
`LModel.addObject` non crea, e il fixture produce OMONIMI (confronto per sottosequenza).
**Prompt document name**: «colora le pill» (in chat) — 2026-09-01 16:30



## 2026-09-01 — fix(manager): l'ego-diagramma si centra e respira (EGO1)
**Prompt**: MICRO in chat, con screenshot del 01-09. Nella riga espansa il grafo
dell'ego-diagram e' appoggiato a sinistra anche con spazio libero a destra, e il respiro
sopra/sotto e' scarso (eyebrow NEIGHBORHOOD e riga dei conteggi addosso ai nodi). Il grafo
si centra alla sua larghezza naturale, NON si allarga; passo verticale da token del DS;
`EGO_OWNER_GAP` (10k p7) non si tocca.
**Files touched**: `abstract/tabs/egoDiagram.scss` (due dichiarazioni: `gap` e
`margin-inline`), `__tests__/egoDiagram.test.ts` (blocco 4, +5 casi, ora 24) e il referto
`docs/discovery/discovery_2026-09-01_ego1_centraggio_respiro.md`. `instanceManagerTab.scss`
NON toccato: il nastro ha un foglio proprio da FL5. Le sonde
`scripts/smoke/_tmp_ego1_*` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` **33** su output COMPLETO (123 righe, exit 2 =
baseline invariata, zero errori in `abstract/tabs`); `npm run build` exit **0**, solo il
warning di chunk noto piu' le deprecation sass e il `bordr` gia' a HEAD in
`properties-with-tree-view.scss:1210`; suite `abstract/tabs/__tests__/` + `jjform/__tests__/`
**693/693**. I 5 casi nuovi provati contro CINQUE mutazioni (gap tornato a 6px,
`margin-inline` rimosso, centraggio con `justify-content` sul contenitore che scorre, 24px
ricopiato nel foglio, `width: 100%` sul frame): 1 rosso ciascuna, verde al ripristino.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — nessun file di §3.1, zero creatori D, zero
`TRANSACTION`, nessuna scrittura verso lo store: il delta e' due dichiarazioni CSS.
**Smoke visivo**: passato — `_tmp_ego1_verify.ts`, before **14/20** (i 6 rossi sono i punti
1 e 2, mirati), after **20/20**, zero errori di pagina in entrambi. Scarto dei centri
**-289.5px -> 0** a 1600, **-129.5 -> 0** a 1280, **-195.5 -> 0** su `Running`; aria sopra e
sotto **6px -> 12px**; larghezza del disegno **168px identica** (si centra, non si allarga).
Overflow (scatola stretta sotto la larghezza del grafo) IDENTICO before/after: frame a
sinistra, `scrollWidth` 356 > `clientWidth` 260, nessun clip nuovo. 10k p7 **24px -> 24px**,
FL6 degrada ancora in lista a 620.
**Notes**: il punto discrezionale e' uno solo, dichiarato nel referto §2: `--space-2` (8px)
e' il primo token sopra il 6px letterale ma vale +2px per lato, che non risponde al difetto;
si e' preso `--space-3` (12px), un gradino sopra il token su cui il 6px si appoggiava.
Scelto `margin-inline` e non `justify-content` perche' in un contenitore che scorre il
secondo taglia l'inizio del contenuto. Corsie: nessun file in comune con AUTO1 Fase 2.
**Prompt document name**: MICRO EGO1 centraggio e respiro (in chat) — 2026-09-01 16:15


## 2026-09-01 — docs(discovery): TXT1, il carrier regge e tre premesse no (Fase 1)
**Prompt**: `docs/prompts/PROMPT_TXT1_multiline_textarea.md`. Corsia DISCOVERY-FIRST con
clausola d'arresto: il grafo D porta metadati per-attributo scrivibili e persistiti, oggi,
senza toccare il core? Nessun codice prima del referto (P4).
**Files touched**: `docs/discovery/discovery_2026-09-01_txt1_annotation_multiline.md` e
questa entry. **Zero file di codice**: la Fase 2 attende il go-ahead. Le sonde
`scripts/smoke/_tmp_txt1_*.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed (Fase 1)
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, nessun gate da muovere.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — fase read-only, zero scritture committate.
**Smoke visivo**: non applicabile — nessun delta visivo. La misura e' a sonda:
`_tmp_txt1_recon.ts` **18/18 ALL GREEN**, zero errori di pagina, piu' `_tmp_txt1_vfx.ts` per
diagnosticare un braccio.
**Notes**: clausola d'arresto **superata**: scrittura, rilettura, JSON, VersionFixer e
LoadAction misurati verdi (trasporto backend non esercitato, dichiarato). Ma tre premesse
del prompt cadono: `parseDAnnotation` **e' implementata** e produce gia' il nostro formato
di filo dai details Ecore; il round-trip perde sull'**export**; `featureFlags` sta in
`shapeDraw.ts`. Trovato fuori perimetro un difetto latente di `VersionFixer` (referto §7).
**Prompt document name**: PROMPT_TXT1_multiline_textarea.md — 2026-09-01 15:35


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


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

## 2026-09-09 — docs: §9.3, gli slot di reference si scrivono in un altro modo, e sbagliare e' muto
**Prompt**: task docs autonomo, fuori dalla corsia, solo file normativi. Iscrivere in `CLAUDE.md`
nella famiglia §9.1 la misura dello step di chiusura: una reference M1 si scrive con
`slot.values = [id]`, mentre `slot.value = <id>` e `slot.value = <oggetto L>` non lanciano e non
scrivono; per gli attributi `slot.value = <primitivo>` funziona. Nominare esplicitamente
l'aggravante: il fallimento e' muto, quindi una sonda che scrive cosi' misura uno stato che non ha
mai creato. Verificare con grep se la cosa e' gia' detta altrove e correggere li' invece di
duplicare.
**Files touched**: `CLAUDE.md` (§9.3 nuova, 33 righe), `AGENTS.md` (rigenerato). Questa entry nello
stesso commit, come chiede il prompt. `frontend/src/jjtl/AGENTS.md` rigenerato e **identico**,
quindi non compare nel diff.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec. `npm run check:agents` PASS su
entrambi i generati; `npm run check:docs` 3/3 con i 2 warning pre-esistenti. Build e suite non
eseguite: nessun sorgente toccato.
**Out-of-scope changes**: no — `AGENTS.md` e' il generato che RC-7 e §17 impongono di includere
nello stesso commit della sorgente.
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile — solo documentazione. La misura iscritta non e' nuova: viene
dalla sonda del giro precedente, che l'ha prodotta eseguendo le quattro forme in sequenza su uno
slot vero (`probe_2026-09-09_semaforo_end_to_end.mts`).
**Notes**: Il grep preventivo dice che la cosa NON era detta da nessuna parte: `CLAUDE.md` §9.1 e
§9.2 mostrano `['$' + attr].value = v`, che e' giusto per gli **attributi** e resta, e §3.12 parla
dello slot di identita'. Niente da correggere altrove, quindi sezione nuova e non riscrittura.
Iscritto anche il corollario in lettura: `slot.values` sulla proxy L torna gli oggetti avvolti e
non gli id, che e' l'altra meta' dello stesso inciampo.
**Prompt document name**: 2026-09-09 01:10

## 2026-09-09 — docs: il semaforo del libro, giro end to end dall'authoring
**Prompt**: chiusura della fetta, voci 3 e 4 di un documento di milestone, in un giro solo.
Semaforo del libro in offline; viewpoint creato dall'interfaccia; le tre invarianti della Tabella
7.5 scritte dall'authoring, la terza nella forma corretta; una quarta nella forma originale del
libro lasciata li'; Validate con il terzo numero che conta le non valutabili; stato iniziale tolto
e rimesso; estensione verificata con un secondo modello. Tre schermate per la sezione 5.5. Nessuna
modifica al codice: se il giro scopre un difetto si riferisce e ci si ferma.
**Files touched**: `docs/discovery/discovery_2026-09-09_semaforo_end_to_end.md` (nuovo, 11 sezioni),
`docs/discovery/harness/probe_2026-09-09_semaforo_end_to_end.mts` (nuova, 6 blocchi) e questa entry.
**Nessun file di codice.** Tre figure scritte come artefatti ignorati accanto alla sonda, path nel
referto §8.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `git status --porcelain frontend/src` vuoto a fine giro, con controllo
positivo sullo stesso comando senza pathspec, che elenca i due file nuovi. Nessun gate di build o
suite: giro di sola misura, dichiarato nel referto §11.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: passato, **13 PASS 0 FAIL**, piu' tre catture. Sul semaforo sano i numeri sono
`0 / 0 / 3`; tolto lo stato iniziale diventano `3 / 0 / 3` con le tre voci di `oneInitialState`;
rimesso tornano `0 / 0 / 3`. Con una seconda macchina a stati nel progetto restano `0`.
**Notes**: Rilievo dichiarato in §0 del referto: `docs/archivio/claude_milestone_validazione_scheletro.md`
**non esiste** (tre ricerche con controllo positivo). Non mi sono fermato perche' il prompt descrive
il giro per esteso; se «voci 3 e 4» erano altro, il giro va rifatto. Misura utile alle prossime
sonde: una reference M1 si scrive con `slot.values = [id]`, mentre `slot.value = <id>` e
`slot.value = <oggetto>` non lanciano e non scrivono.
**Prompt document name**: 2026-09-09 00:30

## 2026-09-09 — feat(validation): Step 4, l'authoring minimo delle regole
**Prompt**: Step 4 come da prompt di Fase 2. Un punto da cui creare, editare e cancellare regole
su una classe scelta, Monaco per il corpo, contesto dichiarato in testa (`self: <Classe>`), le
ereditate in sola lettura e distinte dalle proprie. NON nel rail di destra (R-VAL-1, R-VAL-11).
**Files touched**: nuovi `model/validation/validationRuleSets.ts` (puro),
`model/validation/validationAuthoring.ts` (le tre scritture),
`model/validation/__tests__/validationRuleSets.test.ts` (11 test),
`components/validation/ValidationRulesModal.tsx` e `.scss`; modificati `events/registry.ts`
(+1 evento), `editor-v2/Toolbar.tsx` (bottone, handler e il selettore di Advanced), `App.tsx`
(mount). Poi la sonda e questa entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3403 verdi / 0 falliti (erano 3393: +10, i nuovi), 9 file
rossi `window is not defined`, gli stessi. `tsc --noEmit` 33 = baseline §17, 0 nei file toccati.
`build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: yes — **deroga alla regola 19 dichiarata (RC-11): 8 file**, elencati
sopra con cosa cambia in ciascuno. Nient'altro fuori da quella lista.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato, sonda Playwright **13 PASS 0 FAIL** piu' tre screenshot: apertura dal
bottone vero, ereditate visibili e non selezionabili, giro completo di scrittura riletto dal
D-layer, cancellazione con conferma che toglie entrambe le meta' del legame. Controllo positivo
che discrimina (P12): sulla superclasse la sezione delle ereditate NON esiste.
**Notes**: Due difetti trovati dalla sonda e corretti nel giro. (1) La firma della `useSelector`
delle regole non comprendeva la collezione del viewpoint: creazione e aggancio arrivano in commit
distinti, quindi «New rule» scriveva nel D-layer e il riquadro restava vuoto. (2) Il rail delle
Properties dipingeva **sopra** il modale nella fascia di destra, con il bottone di cancellazione
inerte; risolto col portale su `document.body`. Il pixel contro il numero: il fondale calcolava
gia' 1050 contro 900.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-09 — fix(jjscript): l'estensione si restringe dentro buildEvalContext
**Prompt**: correzione dell'estensione, opzione (b), R-VAL-16 / spec §8.2, commit separato prima
dello Step 4. Parametro opzionale su `buildEvalContext`, default identico a oggi, shell costruite
gia' ristrette e non ricostruite ne' mutate dopo, restrizione su tutti e quattro i posti mappati
compresa la mappa delle ambiguita'. Nessun altro sito di chiamata toccato. Cinque criteri di
accettazione tutti misurati, prova di mutazione compresa. Gate pieni perche' il modulo e' condiviso.
**Files touched**: `jjscript/executor/commands/evalExtent.ts` (nuovo, il selettore puro),
`jjscript/executor/commands/eval.ts` (parametro opzionale piu' la riga che restringe il pool),
`jjscript/index.ts` (+1 export di tipo), `jjscript/__tests__/evalExtent.test.ts` (nuovo, 6 test),
`model/validation/validationContext.ts` (il chiamante e la sua intestazione). Poi la sonda
aggiornata e questa entry. **I quattro chiamanti storici NON sono toccati**: la console via
`executeEval`, i comandi `let` e `forall` di JjScript, e Jjodie (`jodieJjelContext.ts`). Nessuno
passa un secondo argomento — enumerati con un grep sull'intero `frontend/src`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-08 16:50
**Causa**: (c)
**Regressions**: no — `npx vitest run` 3393 verdi / **0 test falliti** (erano 3387: +6, i nuovi),
9 file rossi `window is not defined`, gli stessi identici. `tsc --noEmit` 33 = baseline §17, 0 nei
file toccati. `build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato. Sonda di R-VAL-15 rieseguita: **da 4 PASS 2 FAIL a 7 PASS 0 FAIL**, con
i due rossi diventati verdi e i verdi rimasti verdi. Piu' una prova di mutazione (P12): tolta la
restrizione dal selettore, la suite passa da 6/6 a 3 rossi.
**Notes**: I cinque criteri, uno per uno: (1) invariante del libro verde e `State.instances.size ==
2` verde; (2) controllo positivo invariato, `isInitial` viola su una delle due istanze; (3)
`self.instanceOf == State` tiene ancora per identita'; (4) default immutato, provato sull'IDENTITA'
dell'array — una copia sarebbe gia' un cambiamento; (5) mutazione rossa. Aggiunto un blocco di
simmetria su SM_B che il prompt non chiedeva: la restrizione segue il modello aperto.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-09 — docs: la verifica di R-VAL-15 e' ROSSA, l'estensione e' il progetto
**Prompt**: verifica piccola e bloccante prima dello Step 4, R-VAL-15 / spec §8.2. Due modelli
della stessa lingua nello stesso progetto, uno stato iniziale ciascuno, e
`(forall s in State.instances such that s.isInitial).size == 1` eseguita dal comando Validate sul
modello aperto: deve NON violare. Se rossa, riferire PRIMA di correggere, perche' la correzione
tocca `buildEvalContext`, condiviso con console, JjScript e Jjodie.
**Files touched**: `docs/discovery/harness/probe_2026-09-09_estensione_perimetro_validato.mts`
(nuova) e questa entry. **Nessun file di codice**: giro di sola misura, come chiedeva il prompt.
**Outcome**: ⚠️ partial — la misura e' completa, la correzione non e' stata scritta perche' il
prompt la subordina a una decisione.
**Corregge**: —
**Causa**: (c)
**Regressions**: no — `git status --porcelain frontend/src` vuoto a fine giro, con controllo
positivo sullo stesso comando senza pathspec, che elenca la sonda. Nessun gate di build o suite:
nessun diff di sorgente da difendere.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: passato per sonda, **4 PASS 2 FAIL**, e i due rossi sono il risultato cercato:
`State.instances.size == 2` viola e la prima invariante del libro viola su un modello che ha UN
solo stato iniziale. Controllo positivo che discrimina (P12): una terza regola viola su UNA sola
delle due istanze del modello aperto, quindi il comando ha girato, ha visto SM_A e non ha
iterato SM_B.
**Notes**: Il perimetro delle ISTANZE validate e' giusto (R-VAL-14 regge); a essere di progetto e'
l'ESTENSIONE che la quantificazione attraversa. Misurato anche, prima di qualunque correzione,
l'invariante che una correzione non deve rompere: `self.instanceOf == State` tiene per identita' di
riferimento, quindi le shell delle classi vanno modificate sul posto e non ricostruite. Tre opzioni
di correzione riportate in chat, nessuna scritta.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — feat(validation): Step 3, il comando e la lista
**Prompt**: GO Step 3 con R-VAL-14 (spec §8.1): la superficie dichiara TRE numeri —
violazioni, regole inattive, valutazioni non valutabili — e il terzo e' un contatore, non voci
del registro. Perimetro il modello aperto. Resto invariato: comando esplicito, nessun debounce,
nessun `AFTER_TRANSACTION`, `ValidationPill` non si ripara, niente indicatori sul canvas quindi
l'ancoraggio doppio di R-M2U resta fuori e alla lista basta l'id elemento.
**Files touched**: nuovi `model/validation/validationContext.ts`,
`editor-v2/problems/validationToProblems.ts`, `editor-v2/problems/ValidationResultsModal.tsx` e
`.scss`; modificati `editor-v2/problems/registry.ts` (+1 membro nella union),
`events/registry.ts` (+1 evento), `editor-v2/Toolbar.tsx` (bottone e handler), `App.tsx` (mount).
Poi `docs/discovery/harness/probe_2026-09-08_validation_skeleton_step3.mts` e questa entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3387 verdi / 0 falliti, 9 file rossi `window is not
defined`, gli stessi di prima. `tsc --noEmit` 33 = baseline §17, 0 nei file toccati. `build`
exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: yes — **deroga alla regola 19 dichiarata (RC-11): 8 file**, elencati
sopra con cosa cambia in ciascuno. Nessuno fuori da quella lista; `EditorV2.tsx` non e' toccato
perche' il produttore non e' un componente montato ma una funzione chiamata dal comando.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato, sonda Playwright **13 PASS 0 FAIL** piu' tre screenshot: fixture
costruita dall'app, click sul BOTTONE vero, i tre numeri letti a schermo (1 violazione, 1 regola
inattiva, 2 non valutabili), una sola voce nel registro, e il controllo positivo che DISCRIMINA
per P12 — cambiato il modello, le violazioni passano da 1 a 2.
**Notes**: Misura non scontata: un booleano opzionale **mai scritto** vale `null`, non `false`,
quindi la regola su quell'istanza esce NON VALUTABILE e non violata. Argomentata nel blocco G
della sonda. Costo del comando su 5 regole x 2 istanze: 9 ms, contesto compreso. Scostamento
dichiarato: quando una regola non compila il modale lo dice in una riga, perche' il canale di
authoring non esiste ancora e l'alternativa e' il silenzio.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — feat(validation): Step 2, il valutatore
**Prompt**: GO opzione (a) — `redux/store.tsx` non si tocca, la cartella di stato resta con le
altre 18, la riparazione generale resta iscritta e non si apre qui. Poi Step 2 come da prompt di
Fase 2 con R-VAL-13: modulo puro senza import verso il joiner, raccolta lungo la gerarchia
(R-VAL-12), `self` l'istanza, tri-stato al confine con i tre ingressi, verdetto che pretende un
booleano e non converte nulla, test unitari incluse le tre invarianti del libro. Nuovo in
normativa: P12, il controllo positivo deve discriminare.
**Files touched**: `frontend/src/model/validation/validationEvaluator.ts` (nuovo),
`frontend/src/model/validation/__tests__/validationEvaluator.test.ts` (nuovo, 24 test). Questa
entry a parte. **Nessuna riga di `redux/store.tsx`**, come da opzione (a).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` 3387 verdi / **0 test falliti** (erano 3363: +24, i nuovi),
9 file rossi per `window is not defined`, gli stessi identici di prima. `tsc --noEmit` 33 errori =
baseline §17, **0** sotto `model/validation`. `build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. Il modulo non importa `joiner`, e
questa e' una proprieta' verificabile: gira nella suite, che `validationTypes.ts` non puo' fare.
**Smoke visivo**: non applicabile — modulo puro, nessuna superficie. Al posto suo i 24 test che lo
ESEGUONO, piu' una **prova di mutazione** (P12 applicato alla suite invece che a una sonda):
introdotta in `verdict()` proprio la truthiness che R-VAL-13 vieta — array non vuoto -> vero — la
suite passa da 39/39 a **3 rossi**, e ripristinata torna verde. Una suite che non discrimina la
regola che difende sarebbe decorazione.
**Notes**: La terza invariante del libro finisce fra le non valutabili, e il test lo mostra accanto
alla forma corretta: `forall t in coll: pred` su un modello ROTTO produce zero violazioni, mentre
`coll.all(t => pred)` sullo stesso modello ne produce una. E' il costo di R-VAL-13, gia' dichiarato
nella spec §5.1. Altra conseguenza scritta nel modulo: `self.owner?.name != ""` su un'istanza senza
`owner` non compra un verdetto, esce non valutabile per il terzo ingresso.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — docs: la verifica sulle cartelle di stato, e perche' la correzione non si fa
**Prompt**: precedenza sullo Step 2. Sanare `state.validationviewpoints` e `state.validationrules`
come array in `redux/store.tsx`, additivo, **con verifica obbligatoria prima di scrivere**: un
progetto salvato senza quelle chiavi, ricaricato, le trova? Se il ripristino e' in blocco la chiave
arriva `undefined` e rompe in un altro modo. Se serve toccare `VersionFixer`: hard stop, non farla,
riferire. Inoltre, senza aprire corsie: dichiarare in commento che `VALIDATION_VIEWPOINT_ID` e' una
scorciatoia dello scheletro e non la forma (R-VAL-2 multiplo, al contrario di R-DMV-1 singleton), e
iscrivere che cancellare un viewpoint lascia le regole orfane.
**Files touched**: `frontend/src/model/validation/validationTypes.ts` (solo commenti: +24 sul
puntatore fisso, +9 sulle regole orfane), `docs/TECH-DEBT.md` (due entry nuove),
`docs/discovery/harness/probe_2026-09-08_cartelle_di_stato_al_reload.mts` (nuova) e questa entry.
**Nessuna riga di `redux/store.tsx`**: la correzione non e' stata scritta, ed e' il punto della entry.
**Outcome**: ⚠️ partial — la verifica e' completa, la correzione e' ferma per la condizione che il
prompt stesso poneva.
**Corregge**: —
**Causa**: (c)
**Regressions**: no — nessuna riga di codice eseguibile toccata (solo commenti). `tsc --noEmit` 33
errori = baseline §17; `vitest run src/model/validation` 15/15 verdi.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; `redux/store.tsx` letto e NON modificato.
**Smoke visivo**: passato per sonda, **9 PASS 0 FAIL**: riproduce la cartella-stringa, la vede
sopravvivere a salva+ricarica, toglie dallo snapshot una chiave **dichiarata** su `DState`
(`edgepoints`) e la fa passare dal percorso di caricamento vero, e passa in rassegna tutte le classi D.
**Notes**: Ripristino **in blocco**: `edgepoints`, dichiarata su `DState` e tolta dallo snapshot,
torna `undefined`. Completare la correzione vuol dire una migrazione: hard stop come da prompt.
E non e' un difetto della validazione — 20 classi D su 44 sono nella stessa condizione,
`DAnnotation` e i tre edge comprese. Le due entry nuove di `docs/TECH-DEBT.md` argomentano tutto.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — feat(validation): Step 1, il modello dello scheletro
**Prompt**: Step 1 del prompt di Fase 2 dopo il GO su D1=(b). `DValidationViewpoint` e
`DValidationRule` come tipi paralleli, non `DViewElement` e senza supertipo comune (R-VAL-6-bis);
campi della regola name/context/body/message/enabled, nessuna severita'; il viewpoint nasce alla
prima scrittura come il Data Manager Viewpoint, senza migrazione e senza bump di `DState.version.n`
se si resta additivi, e se un bump serve dichiararlo e fermarsi.
**Files touched**: `frontend/src/model/validation/validationTypes.ts` (nuovo, 4 classi + find/ensure),
`frontend/src/model/validation/__tests__/validationTypes.test.ts` (nuovo, 15 test),
`frontend/src/joiner/index.ts` (+3, un export). Poi, in commit separati:
`docs/TECH-DEBT.md` (il todo iscritto su richiesta),
`docs/discovery/harness/probe_2026-09-08_validation_skeleton_step1.mts` (nuova) e questa entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — suite `npx vitest run` 3363 test verdi / 0 falliti, 9 file rossi per
`window is not defined`; **baseline misurata nello stesso giro** togliendo le tre modifiche e
rimettendole da copia (mai `git stash`, RC-13): 3348 verdi, gli stessi 9 file rossi. Delta +15,
che sono i test nuovi. `tsc --noEmit` 33 errori, cioe' la baseline di §17 esatta, 0 sotto i file
toccati. `build` exit 0 col solo avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `joiner/index.ts` tocca solo la lista
degli export; nessun campo aggiunto a una classe D esistente.
**Smoke visivo**: passato, per sonda invece che a occhio: la suite gira in `environment: node` e il
modulo importa `joiner`, che scrive su `window`, quindi il test unitario e' sul SORGENTE e la sonda
Playwright fa il resto — **24 PASS 0 FAIL** su registrazione D<->L, nascita alla prima scrittura,
le due direzioni del legame, la proxy L e il giro salva-ricarica-rileggi. Tre controlli positivi.
**Notes**: Un rilievo da decidere, riportato in chat e non sanato: `state.validationviewpoints`,
la cartella derivata dal className in `reducer.ts:466`, resta una **stringa** perche' `DState` non
la dichiara, mentre `viewpoints` e `viewelements` sono array letti come tali in 8 siti. Nessuno
legge la nostra oggi (0 occorrenze). Sanarla sono 2 righe additive in `redux/store.tsx`, fuori dal
perimetro del prompt: regola 20, si riporta e ci si ferma.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — docs: Step 0, il verdetto booleano delle regole di validazione
**Prompt**: Step 0 del prompt di Fase 2 (scheletro della validazione definita dall'utente),
READ-ONLY con hard stop. Misurare ESEGUENDO l'evaluator: il tipo di ritorno delle tre invarianti
della Tabella 7.5 del libro; che cosa restituisce `forall ... : pred` con almeno un elemento falso
e come si converte a booleano; lo stesso su collezione vuota; se esista gia' una funzione
`JjelValue -> boolean` e quale regola applichi. Il linguaggio non si tocca.
**Files touched**: `docs/discovery/discovery_2026-09-08_verdetto_booleano.md` (nuovo, 11 sezioni),
`docs/discovery/harness/probe_2026-09-08_jjel_verdetto_booleano.mts` (nuova, 8 blocchi). Nessun file
di codice. Ramo nuovo `validation-skeleton` da `alfonso-frontend-jjtl`, come chiede il prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec, che elenca i due file nuovi.
Nessun gate di build o suite: giro read-only senza diff di sorgente, dichiarato nel referto §11.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile. Al posto suo la sonda consegnata, che ESEGUE parser ed evaluator
JjEL su un contesto della forma di `buildEvalContext` (P11): **42 PASS 0 FAIL**, con sette controlli
positivi a esito noto sulla fixture, senza i quali un elenco di esiti sorprendenti sarebbe
indistinguibile da un modello vuoto.
**Notes**: L'ipotesi del prompt e' confermata sulla terza invariante e imprecisa sulla prima: INV1 e
INV2 sono booleane, solo INV3 restituisce un array. `[false]` e' vero per tutte le vie misurate —
`if`, `not`, `and`, `implies`, `Boolean()` — e `[]` e' falso per JjEL e vero per il `Boolean()` di
JjTL/JjScript: due difetti opposti, e due regole gia' in circolo che divergono su un valore.
Nessun convertitore esportato. Tre domande aperte in §10, D1 bloccante per lo Step 2.
**Prompt document name**: 2026-09-08 16:50

## 2026-09-08 — docs: micro-discovery, l'estensione del difetto keyword-dopo-il-punto
**Prompt**: micro-discovery READ-ONLY, nessun fix. Misurare l'estensione del difetto nel lexer JjEL
per decidere se la correzione sia prerequisito della validazione definita dall'utente o corsia
laterale: elenco completo delle keyword, esito per ciascuna dopo un punto misurato eseguendo il
parser, esistenza di un controllo che impedisca di chiamare una feature come una keyword, confronto
con la tabella JjTL. Referto piu' sonda in `docs/discovery/harness/`. Il lexer non si tocca.
**Files touched**: `docs/discovery/discovery_2026-09-08_keyword_dopo_il_punto.md` (nuovo, 251 righe),
`docs/discovery/harness/probe_2026-09-08_jjel_keyword_after_dot.mts` (nuova, 7 blocchi). Nessun file
di codice.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` vuoto a
fine giro con controllo positivo sullo stesso comando senza pathspec. Nessun gate di build o suite:
giro read-only, dichiarato nel referto §11.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile. Al posto suo la sonda consegnata, che ESEGUE lexer, parser ed
evaluator JjEL e il lexer JjTL (P11): **16 PASS 0 FAIL**, con le due tabelle IMPORTATE dal sorgente
e non trascritte, e due controlli positivi separati — otto nomi non-keyword che devono parsare e
`checkNameShape` su input che deve rifiutare.
**Notes**: Cinque ipotesi falsificate (referto §2). Il difetto non e' di `forAll`: rompono **18
keyword su 18** in navigazione, 15/18 come identificatore nudo, 25/25 sul lexer JjTL. Ma `type`,
`name` e `value` non sono keyword e parsano, e `a["<kw>"]` funziona su tutte e 18 fino alla lettura
del valore. Verdetto: **corsia laterale**. Nessun controllo impedisce di chiamare una feature come
una keyword, a nessuno dei tre livelli cercati. Tre domande aperte in §10.
**Prompt document name**: 2026-09-08 17:40

## 2026-09-08 — docs: §12.6 dice il vero su `forall` in JjEL
**Prompt**: task docs autonomo, fuori dalla corsia validazione, solo file .md. `CLAUDE.md` §12.6
dichiara `coll.forAll(x: pred)`; la discovery del 2026-09-08 punto 7 la falsifica. Sostituire la
forma, segnalare `x: pred` come non supportata e `forAll` come rotta nel lexer, cercare la stessa
forma negli altri documenti normativi ed elencare le occorrenze. Nessun fix di codice.
**Files touched**: `CLAUDE.md` (§12.6: riga di tabella + nota nuova di 16 righe), `AGENTS.md`
(rigenerato), `frontend/src/jjtl/SPEC.md` (§12.2, riga di Known Bugs), `frontend/src/jjtl/CLAUDE.md`
(Known limitations, primo bullet), `frontend/src/jjtl/AGENTS.md` (rigenerato). Questa entry a parte.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `git status --porcelain frontend/src` limitato
ai tre .md dichiarati, con controllo positivo sullo stesso comando senza pathspec. `npm run
check:agents` PASS su entrambi i generati; `npm run check:docs` 3/3 con i 2 warning pre-esistenti.
Build e suite non eseguite: nessun sorgente toccato.
**Out-of-scope changes**: yes — i due `AGENTS.md`, rigenerati e inclusi nello stesso commit come
impongono RC-7 e §17, non erano nella lista del prompt. Deroga alla regola 19 dichiarata: 6 file,
di cui 2 generati e 1 la entry di log. Nient'altro fuori dalla lista.
**Layer Impact Report**: not-required — nessun file di §3.1, nessun sorgente.
**Smoke visivo**: non applicabile — solo documentazione. Al posto suo una sonda fuori albero (P11)
che ESEGUE parser ed evaluator JjEL sulle forme prima di scriverle nel documento: `coll.forAll(x =>
pred)` fallisce come `coll.forAll(x: pred)` (`1:9 Expected property name after '.'`), `getCollectionMethod('forAll')`
e' assente, `coll.all(x => pred)` parsa e valuta `false` sul fixture. Controllo positivo nello stesso giro.
**Notes**: Scostamento dichiarato: il prompt chiedeva `coll.forAll(x => pred)`, che la sonda mostra
fallire allo stesso modo — `forAll` non e' un metodo di collezione e il lexer lo prende per keyword
comunque. Scritto `coll.all(x => pred)`. Terzo errore nella stessa cella: JjEL `forall` non e' un
quantificatore booleano ma una comprehension, per decisione esplicita
(`docs/spec/concern_languages.md:53`). `PROTOCOL.md` e `docs/spec/` non contengono la forma.
**Prompt document name**: 2026-09-08 17:05

## 2026-09-08 — docs: discovery della validazione definita dall'utente (Fase 1 + addendum)
**Prompt**: Fase 1 read-only two-phase piu' addendum, otto punti: forma del registry dei problemi e
innesto per un produttore nuovo; firma/contesto/tri-stato di JjEL; dependency set esposto o esponibile;
come si aggiunge un elemento contenuto in una classe M2 (VersionFixer, round trip .ecore); aggancio a
fine transazione; se la radice del modello sia tipata; stato di allInstances e di `.forAll`; se la chiave
del registro ammetta uno scope non ancorato. Referto obbligatorio, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-08_validazione_definita_utente.md` (nuovo, 834
righe). Nessun file di codice.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato; `git status --porcelain frontend/src` vuoto a fine
giro, con controllo positivo sullo stesso comando senza pathspec (che elenca il referto). Nessun gate di
build o suite eseguito: dichiarato nel referto §6.3.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx`, `joiner/classes.ts`,
`redux/reducer/reducer.ts` e `VersionFixer.tsx` letti e non modificati.
**Smoke visivo**: non applicabile — Fase 1 read-only. Al posto suo, due sonde fuori albero che ESEGUONO
lexer/parser/evaluator JjEL (P11) e non ne leggono il sorgente; output integrale nel referto §4.2 e §5.3,
con controlli positivi (`forall … in …` e `exists` a 0 errori) accanto ai casi che falliscono.
**Notes**: Sei ipotesi del prompt falsificate, tabellate in §3bis del referto, che le argomenta tutte:
`DModel.instanceof` e' `Pointer<DModel>` e non `Pointer<DClass>`; `NodeProblem.nodeId` e' obbligatorio e
la violazione di modello non ha oggi superficie; JjEL non ha tri-stato e la navigazione su assente lancia;
`.forAll` riprodotto su JjEL diretto piu' un secondo difetto non iscritto, che rende `CLAUDE.md §12.6`
falsa. Sette domande aperte in §7, D1 e D3 bloccanti per la forma della Fase 2.
**Prompt document name**: 2026-09-08 16:30

## 2026-09-06 — fix(jjtl): accept newlines in helper bodies and before else
**Prompt**: un `helper` con il corpo su righe separate non parsa mai nell'app (Monaco e Validate:
"Expected expression" sulla `{`), nemmeno nelle forme documentate in SPEC §3.4 e §13.2. Decisione
di Alfonso: procedere col rischio minore. Fix stretto nel parser interno di espressioni, non il
cambio dei call site.
**Files touched**: `frontend/src/jjtl/parser/parser.ts` (+17: due `skipNewlines()` in `helper()`,
lookahead `isElseAfterNewlines()` in `ifThenElse()`), `frontend/src/jjtl/__tests__/helper-multiline.test.ts`
(nuovo, 9 test); poi `docs/discovery/discovery_2026-09-06_jjtl_helper_body_newlines.md`,
`docs/prompts/claude_2026-09-06_1500_prompt_jjtl_helper_body_newlines.md` e questa entry nel
commit docs.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `vitest run src/jjtl` 116 verdi / 0 falliti (era 107, +9), i 7 file
`window is not defined` pre-esistenti invariati. `tsc --noEmit` 14 errori, 0 sotto `src/jjtl/`
(baseline "scattered" di §17 su filesystem case-sensitive). `build` exit 0 col solo avviso di
chunk-size. Un `NEWLINE` non seguito da `else` termina ancora un `:=` (test dedicato).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo parser JjTL.
**Smoke visivo**: non applicabile — da verificare a mano da Alfonso: incollare l'helper, la
sottolineatura sulla `{` sparisce, Validate 0 errori.
**Notes**: Root cause (report F1): l'app non passa mai il sorgente al parser (`JjtlEditor.tsx:57`,
`useJjtlParser.ts:61`), quindi la delega a JjEL non è mai esercitata dall'app, solo dai test.
Passare `source` ai call site è il fix di prospettiva ma cambia il parser di tutte le espressioni
`:=`/`where`/`let`: decisione aperta, discovery a due fasi (F5). Verificato sul clone cloud, file
portati sul Mac via bridge, commit dalla shell nativa.
**Prompt document name**: 2026-09-06 15:00

## 2026-09-06 — feat(jjtl): istanze sorgente contenute e creazione annidata nelle feature (Fase 2)
**Prompt**: GO Fase 2 con sette decisioni ratificate (D1..D7): feature risolta contro il metamodello e mai validata come classe, `forall` dentro il wrapper e a livello di regola con lookup della feature e fallback dichiarato, deref di `{__ref}` nel forall e su `parent`, enumerazione sempre di tutti gli oggetti del modello sorgente, write-back degli annidati come DObject contenuti, messaggi che non mentono, due limiti del parser. Deroga alla regola 19 dichiarata nel GO. HARD STOP dopo il commit 4 per la verifica visiva.
**Files touched**: `frontend/src/components/project/ProjectEditor.tsx` (commit 1 `f428e1470`, commit 4 `3d6b16e14`); `frontend/src/jjtl/parser/parser.ts` (`63131b0fb`); `frontend/src/jjtl/executor/executor.ts` (`cde18558b`); nuovi `frontend/src/jjtl/executor/__tests__/contained-sources.test.ts` (4 test), `frontend/src/jjtl/executor/__tests__/nested-creation-into-features.test.ts` (23 test), `frontend/src/jjtl/parser/__tests__/forall-and-value-mappings.test.ts` (11 test); `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/CLAUDE.md`, `frontend/src/jjtl/AGENTS.md` (`454773e8b`). Questa entry a parte.
**Outcome**: ✅ completed
**Corregge**: 2026-09-06 14:40 (prompt di Fase 1, discovery)
**Causa**: —
**Regressions**: no — `npm run build` exit 0 col solo avviso di chunk-size a ogni commit; `npx tsc --noEmit` 33 su output completo, la baseline esatta di §17, misurata prima e dopo ogni commit (salita a 34 una volta, per un `result.stats` possibly undefined in un test nuovo, chiusa prima del commit); `vitest run src/jjtl` 141 verdi contro i 107 di partenza, con gli **stessi 7 file rossi in import** pre-esistenti, invariati.
**Out-of-scope changes**: yes — `frontend/src/jjtl/AGENTS.md`, rigenerato e incluso nello stesso commit come impone RC-7 e §17; non era nella lista del GO. Nient'altro fuori dalla lista dichiarata.
**Layer Impact Report**: not-required — nessun file di §3.1. `LValue.addObject` apre una TRANSACTION propria attorno a `DObject.new3` (verificato a `LModelElement.tsx:7336` prima di scrivere il diff, come chiedeva D5): la creazione degli annidati sta quindi FUORI dalla TRANSACTION di STEP 6, come `DVertex.new`. `LModelElement.tsx` e `useJjomSync.ts` letti e non toccati.
**Smoke visivo**: passato — verifica manuale di Alfonso su `ERDLanguage` a `localhost:3000`, ACK esplicito in chat sui quattro commit di codice. Automatico: banco delle mutazioni (P11) su 10 mutazioni, tutte rosse — 4 sul parser (skipNewlines nel forall, IDENTIFIER fra le chiavi, ramo delle coppie in coda, case IDENTIFIER in `literal()`) e 6 sull'executor (nome della feature in scrittura, deref di `{__ref}`, errore sul `-> Class` a livello di regola, lookup della feature, marcatore `__nested`, applicazione delle coppie).
**Notes**: Debito dichiarato: il commit 4 (write-back) **non ha test automatici** — ProjectEditor non ha banco, la copertura è la verifica manuale. Due todo da aprire fuori da questo giro: i 7 file `window is not defined` (fra cui `forall-mapping.test.ts`, quindi nove test `forall` non girano); e `.forAll(x: pred)` che non parsa mai sulla via dell'app. Entrambi in SPEC §12.2 e in `jjtl/CLAUDE.md`. Le due deroghe a D5/D7 sono iscritte in SPEC §9.2 come design.
**Prompt document name**: 2026-09-06 15:20

## 2026-09-06 — docs: discovery delle istanze sorgente contenute e della creazione annidata JjTL (Fase 1)
**Prompt**: Fase 1 read-only two-phase: confermare il percorso `ProjectEditor` → `executor.execute` e se `allSubObjects` sia la sorgente giusta (con `_containerId`/`parent`); tracciare come parsano ed eseguono `-> feature { … }`, `-> Class { … }` e `forall … -> Class { … }`, e come gli annidati diventino DObject; verificare i limiti del parser elencati. Referto obbligatorio, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-06_jjtl_contained_sources_nested_creation.md` (nuovo, 452 righe). Nessun file di codice.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `frontend/src` pulito a fine giro (verificato con `git status --porcelain frontend/src`, vuoto, con controllo positivo sullo stesso comando senza pathspec). Nessun gate di build o suite eseguito: dichiarato nel referto §10.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx` e `joiner/classes.ts` letti e non modificati, come impone il perimetro.
**Smoke visivo**: non applicabile — Fase 1 read-only. Al posto suo, quattro sonde fuori albero che ESEGUONO lexer/parser/executor (P11) e non ne leggono il sorgente; misure in referto §4.2, §6.3, §7.
**Notes**: Due findings cambiano la forma della Fase 2, entrambi nel referto: togliendo il warning su `columns` nessuna delle tre forme crea un Column, perche' gli annidati non entrano in `targetModel.instances` e STEP 6 li scarta (§6); e `forall a in ownedAttributes` itera involucri `{__ref}`, non oggetti, quindi i Column nascerebbero a null (§8 R2, fuori prompt). H4 falsificata (§7.1, §7.3). Confermato il NEWLINE prima di `->` nel forall: chiude F5 del referto 2026-09-04. Sei domande aperte in §9.
**Prompt document name**: 2026-09-06 14:40

## 2026-09-05 — feat(rail): la select «Palette» del Data Manager (R-SKIN slice C, chiude la Fase 2)
**Prompt**: GO emendato R-SKIN Fase 2, slice C: select «Palette» nel `DataManagerViewpointPanel` sotto «Form theme», stesso `writeViewpoint`, default `Slate`. Sonda end-to-end su B+C su tabella e drawer; negativo: un progetto senza `formPalette` identico a oggi. HARD STOP dopo il commit.
**Files touched**: `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` — commit `8116e35da`. Sonda a parte: `probe_2026-09-05_rskin_sliceC_select.mts` (nuova).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` 33 su output completo (baseline esatta §17), `npm run build` exit 0 col solo avviso di chunk-size, vitest 1782/1782 su `components/editors`, `components/editor-v2`, `components/abstract`, `components/TreeViewSidebar`. `viewpointThemeHint.test.ts` verde: `ViewpointProperties.tsx` non e' stato toccato. Banco delle mutazioni (P11), due giri: la select che scrive sempre il nome (niente `undefined` su `Slate`) -> D1 rosso, e D2 resta verde, che e' la ragione per cui D1 esiste; la select spostata SOPRA «Form theme» -> A1 rosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `ensureDataManagerViewpoint` dentro `writeViewpoint` resta una chiamata NUDA (§3.3).
**Smoke visivo**: passato — sonda `probe_2026-09-05_rskin_sliceC_select.mts`, **15 PASS 0 FAIL**, il giro intero dalla porta dell'utente. A: la select c'e' SOTTO «Form theme» (ordine, non sola presenza), quattro opzioni in ordine di catalogo, legge `Slate` col singleton assente, e aprire il rail non materializza. B: scelta `Paper`, il singleton nasce `dataManager` + `isExclusiveView: true` col nome scritto nel campo. C: nel manager la tabella E il drawer portano i valori calibrati di Paper (Q2, misurata stavolta dal gesto e non da console). D: rimessa `Slate`, il campo torna ASSENTE e le due superfici tornano a `:root`.
**Notes**: Scostamento dichiarato dal controllo gemello: nessun sentinella `__inherit__`. `Slate` e' l'ASSENZA di palette — l'unico nome senza regole nel foglio — quindi sceglierlo scrive `undefined`, e la lista non porta due voci con un solo effetto visibile e due stati persistiti diversi. Fuori corsia, gia' registrato nella entry A+B: in dark il rail sinistro e l'outline restano chiari, ed e' il tema scuro dell'app, non la palette.
**Prompt document name**: 2026-09-04 23:30

## 2026-09-05 — feat(manager): le quattro palette della form del Data Manager (R-SKIN, slice A+B)
**Prompt**: GO emendato R-SKIN Fase 2. Slice A: registro chiuso `palettes.ts` (nomi, default `Slate`, guardia, `paletteAttr`) e campo `formPalette?` su `DViewElement` accanto a `formTheme`, nessuna migrazione. Slice B: i nove token in `styles/tokens/_form-palettes.scss`, DUE regole per palette (light e `:root[data-theme="dark"]`), `data-palette` su `.instance-manager`. Poi calibrazione a schermo all'HARD STOP, light e dark.
**Files touched**: slice A — `frontend/src/jjform/palettes.ts` (nuovo), `frontend/src/jjform/index.ts`, `frontend/src/jjform/__tests__/palettes.test.ts` (nuovo), `frontend/src/view/viewElement/view.tsx`, commit `08abf6355`. Slice B — `frontend/src/styles/tokens/_form-palettes.scss` (nuovo), `frontend/src/styles/tokens/index.scss`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, commit `a8c8aae45`. Calibrazione di Paper — `_form-palettes.scss`, commit `f3459a29f`. Sonda a parte: `b30fbdf66`, riallineata alle attese calibrate nel commit docs di questo giro.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` 33 su output completo (baseline esatta §17), `npm run build` exit 0 col solo avviso di chunk-size, `vitest run src/jjform` 364/364 su 13 file. Nessun progetto senza `formPalette` cambia: `Slate` non ha regole, e' `:root` (blocchi A e D della sonda).
**Out-of-scope changes**: yes — due deroghe dichiarate, vedi Notes.
**Layer Impact Report**: not-required — nessun file di §3.1. `InstanceManagerTab.tsx` legge un campo in piu' da `idlookup`, nessuna scrittura.
**Smoke visivo**: passato — sonda `probe_2026-09-05_rskin_sliceB_palettes.mts`, **18 PASS 0 FAIL** dopo la calibrazione, piu' gli otto screenshot (quattro palette in light, quattro in dark). Q2 misurata dove serviva: `getComputedStyle` su una cella della TABELLA e su un controllo del DRAWER danno gli stessi valori per ogni palette, cioe' una scrittura copre due superfici. R2 esercitato: in dark le tre palette portano i valori scuri, non quelli chiari.
**Notes**: Deroga 1: il riesporto sta in `jjform/index.ts`, non in `joiner/index.ts` come diceva la slice A — `InstanceManagerTab` importa da `jjform`, a specchio di `formTheme`, e `joiner` resta intatto. Deroga 2: `--color-form-summary` scritto per tutte e tre le palette. Fuori corsia, da registrare: in dark il rail sinistro e l'outline restano chiari — e' lo stato del tema scuro dell'app, non della palette.
**Prompt document name**: 2026-09-04 23:30

## 2026-09-04 — fix(jjtl): accept newlines inside nested object creation
**Prompt**: la forma multiriga di object creation (`-> attr {` a capo `-> Class {`, quella
documentata in SPEC §3.3) produce `targetClass = attr` senza errori di parsing né di Validate;
gli oggetti annidati non vengono creati. Discovery sintetica obbligatoria, poi fix minimo in
`attributeMapping()` e `objectCreation()`, test di parsing, suite `jjtl` e build.
**Files touched**: `frontend/src/jjtl/parser/parser.ts` (+7, due `skipNewlines()`),
`frontend/src/jjtl/__tests__/nested-object-creation.test.ts` (nuovo, 5 test) in `1c567930d`;
`docs/discovery/discovery_2026-09-04_jjtl_nested_object_creation.md`,
`docs/prompts/claude_2026-09-04_1850_prompt_jjtl_nested_object_creation_newlines.md` e questa
entry nel commit docs successivo.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `vitest run src/jjtl` 107 verdi / 0 falliti (era 102 su HEAD, +5 nuovi); i
7 file `window is not defined` (monaco, `environment: 'node'`) sono pre-esistenti, riverificati su
un worktree pulito a HEAD. `tsc --noEmit` 14 errori, 0 sotto `src/jjtl/` (i 14 "scattered" della
baseline §17; i 19 di casing non compaiono su filesystem case-sensitive). `build` exit 0 col solo
avviso di chunk-size.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo parser JjTL.
**Smoke visivo**: non applicabile — da verificare a mano da Alfonso: SM2PN (docs), forma
multiriga, Validate + Execute, attesi 7 mapping, 0 warning nel Trace, archi presenti.
**Notes**: Root cause confermata (report F1, F2). `forAllMapping()` non ha il difetto, non
toccato (F5). Validate è solo `parse()`: il controllo delle classi target vive in
`executor.validateTargetClasses` come warning a runtime, todo fuori scope (F3). Il ramo
"nested mapping body" non corrisponde a nessuna sintassi in SPEC né nei test; lasciato, da
decidere in chat (F4). Deroga a §6 del prompt ("un solo commit"): `CLAUDE.md` §6.4 vieta docs e
codice nello stesso commit, quindi due commit.
**Prompt document name**: 2026-09-04 18:50

## 2026-09-05 — docs: discovery delle skin della form del Data Manager (R-SKIN, Fase 1)
**Prompt**: Fase 1 read-only di R-SKIN: falsificare H1..H6 (colori diretti nella form, censimento dei token, `--color-form-*` in entrambi i file colori, dove vive la regola `[data-skin]`, il pattern di `formTheme` per `formSkin`, la tabella dentro o fuori la skin), referto con `file:riga` e tabella token × skin, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-04_form_skins.md` (nuovo, 529 righe) — commit `715054349`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, `frontend/src` pulito a fine giro. Nessun comando di build o test eseguito, dichiarato nel referto §15.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 implicato; `VersionFixer.tsx` non letto e non necessario (`formSkin?` additivo come `formTheme`).
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: **H6 falsificata**, ed e' il finding: `instanceManagerTab.scss` legge `--color-form-*` su **143 righe**, quindi una skin agganciata a `.ir-form` cambierebbe il drawer e non la tabella sopra di esso. `.instance-manager` e' antenato di `.ir-form`: un attributo, entrambi. Secondo finding: la parola «skin» e' gia' presa (`LegacySkin`, `LEGACY_SKIN_PRESET`, `ir-form--plain` sulla stessa radice). Sei domande, due chiuse in discovery.
**Prompt document name**: 2026-09-04 23:02

## 2026-09-05 — feat(ir): la view di classe svuotata si pota (R-DMV slice F, chiude la Fase 2)
**Prompt**: GO emendato R-DMV Fase 2, slice F: `pruneForm` esteso a `order`/`labels`/`hidden` (non `basic`), potatore separato per `table` sull'ir, e la view del singleton svuotata (ne' `form` ne' `table`) che si rimuove facendo sparire la classe dall'albero. Test su `pruneForm` e sul potatore.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx`, `.../ir/irPrune.ts` (nuovo), `.../ir/__tests__/irPrune.test.ts` (nuovo), `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` — commit `317ec973b`. Sonda a parte: `acd5c72d6`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest **3293/3293** sull'intera suite (0 test rossi; restano i 9 file che muoiono all'import di monaco in `environment: node`, pre-esistenti). Banco delle mutazioni (P11), tre giri: `pruneForm` che non pota `order`/`hidden` -> 2 rossi; `pruneForm` che pota anche `basic` -> 1 rosso; `isPrunableClassView` che ignora lo `shape` -> 1 rosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `DeleteElementAction` e `SetRootFieldAction` sono chiamate NUDE, nessun creator annidato (§3.3).
**Smoke visivo**: passato — sonda `probe_2026-09-05_rdmv_sliceF_prune.mts`, 7 PASS 0 FAIL, confronto dentro il giro (stesso progetto, stessa classe): scritto -> la view c'e' e la classe compare; tolto -> la view sparisce da `idlookup`, la classe esce dall'albero e torna lo stato vuoto, il VIEWPOINT resta; riscritto -> la view rinasce UNA sola.
**Notes**: Due misure che il referto non aveva. `lView.delete()` su una view del singleton e' un **no-op silenzioso** (logga «unexpected pointedBy case ending with an object» da `get__jjdependencies`: `subViews` e' un Dictionary): si usa `DeleteElementAction`. E `DeleteElementAction` lascia l'id in `state.viewelements`, che alla RIscrittura lo duplicava — due righe per una classe. Il `-=` sul root chiude il giro. Dettaglio nel commento di `writeForm`.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(sidebar): la sezione «Data Manager», sempre presente (R-DMV slice E)
**Prompt**: GO emendato R-DMV Fase 2, slice E: sezione «Data Manager» sempre presente in `TreeViewContent.tsx` con lo stato vuoto ratificato, classi personalizzate con le feature toccate e l'override accanto, «columns» quando fissato, esclusione da `syntaxVps`/`validationVps`/`otherVps`, la voce che seleziona il singleton o il suo stub (Q4/Q6), materializzazione al primo write dal pannello. Un test di sorgente sul modello dei `instanceManager10*`.
**Files touched**: `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`, `.../TreeViewSidebar/tree-view-sidebar.scss`, `.../TreeViewSidebar/__tests__/dataManagerSection.test.ts` (nuovo), `frontend/src/components/editors/Info.tsx`, `.../editors/viewpoint/properties/DataManagerViewpointPanel.tsx` — commit `5ae652227`. Sonda a parte: `d0546abcb`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 1811/1811 su `src/components` (17 nuovi). Banco delle mutazioni (P11): spostata la guardia del singleton DOPO i tre rami del partizionamento, 2 test su 17 rossi; ripristinata.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — sonda `probe_2026-09-04_rdmv_sliceE_sidebar.mts`, 17 PASS 0 FAIL, che chiude anche la verifica della slice D dalla porta dell'utente (RC-8). A: singleton assente, la sezione c'e' con lo stato vuoto. B: la voce apre il pannello sullo STUB e NON materializza. C: la prima scrittura crea i due gradini insieme, `dataManager` + `isExclusiveView: true`. D: l'albero elenca `Sensor > note = Code`, il singleton non e' fra i viewpoint e il contatore resta 1.
**Notes**: `SectionNode` prende due prop opzionali (`onLabelClick`, `labelTitle`) usate dalla sola sezione Data Manager: le altre stanno per un insieme e non hanno niente da selezionare. Lo stub e' letto in `Info.tsx` dal pointer GREZZO (`viewId`) e non dal proxy: `LViewElement.fromPointer` di un id inesistente rende un proxy senza `__raw`, che non distingue «niente selezionato» da «selezionato ma non ancora nato».
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(rail): DataManagerViewpointPanel, il rail del singleton (R-DMV slice D)
**Prompt**: GO emendato R-DMV Fase 2, slice D: pannello nuovo per il singleton (nome, Form theme senza hint, selettore di metaclasse, tabella feature -> widget su `rowsForMetaclass` + `offeredOverrides`, materializzazione alla prima scrittura), `Info.tsx` che dispaccia su `isDataManagerViewpoint`. Niente segmented Type, niente `theme`/`labelPlacement` per view (Q5). HARD STOP dopo il commit.
**Files touched**: `frontend/src/components/editors/viewpoint/properties/DataManagerViewpointPanel.tsx` (nuovo), `.../properties/DataManagerViewpointPanel.scss` (nuovo), `frontend/src/components/editors/Info.tsx` — commit `367a23c45`. Sonda a parte: `316675476`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 1749/1749 su `components/editors`, `components/editor-v2`, `components/abstract`. `viewpointThemeHint.test.ts` verde: `ViewpointProperties.tsx` non e' stato toccato, ed e' la ragione per cui il pannello e' un componente separato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `ensureDataManagerViewpoint` e `DViewElement.new2` sono due chiamate NUDE, nessuna TRANSACTION esterna (§3.3).
**Smoke visivo**: passato — sonda end-to-end `probe_2026-09-04_rdmv_sliceD_rail_panel.mts`, 19 PASS 0 FAIL, piu' lo screenshot del rail. A: il singleton rende il pannello nuovo, il segmented Type e l'hint NON ci sono (positivo di controllo su un viewpoint ordinario, dove il segmented c'e'). B: la prima scrittura crea la view di classe che prima non c'era, e il reset RIMUOVE la chiave `form`. C: il picker mostra esattamente `[Abstract syntax, Ordinary syntax, Data manager]`, il megamodello e la dashboard non lo nominano, ciascuno con il proprio positivo.
**Notes**: **Scostamento da R-DMV-3, dichiarato**: la view di classe porta uno `shape: {form:'rect'}` minimo. Misurato: un ir `vertex` senza `shape` fa lanciare `compileView` (`irCompile.ts:305`), `getIRIndex` scarta la view con `[ir] compile failed` e l'indice torna `null`. Il primo gradino della materializzazione resta non esercitato: la porta d'ingresso e' la voce di sidebar della slice E, e senza di essa il pannello si raggiunge solo con il singleton gia' creato.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — fix(tests): le due asserzioni sul mount di IRForm allineate a host="manager"
**Prompt**: commit a parte, dichiarato fuori dalla corsia R-DMV: allineare `instanceManagerOutline.test.ts:155` e `instanceManager10c.test.ts:541` al mount che il sorgente porta da `40142a4f3` (R-VP slice 1, commit 2), cioe' `<IRForm objectId={formSubjectId ?? subjectId} host="manager" />`.
**Files touched**: `frontend/src/components/abstract/tabs/__tests__/instanceManagerOutline.test.ts`, `frontend/src/components/abstract/tabs/__tests__/instanceManager10c.test.ts` — commit `8f8bd41d8`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-03 23:20
**Causa**: (c)
**Regressions**: no — vitest 84/84 sui due file. Nessun sorgente applicativo toccato: la stringa attesa e' stata allineata al codice, non il contrario.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — due file di test.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: I due rossi erano in albero da `40142a4f3`, che aggiunse `host="manager"` ai due mount del drawer e non aggiorno' le asserzioni di sorgente che li citano verbatim; la sua entry dichiarava gia' `Out-of-scope changes: yes`. Trovati dalla suite intera girata nella slice C di R-DMV e riportati nell'hard stop prima di essere sanati, non dopo.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(manager): la tabella e il drawer leggono dal singleton (R-DMV slice C)
**Prompt**: GO emendato R-DMV Fase 2, slice C: `ensureDataManagerViewpoint` / `findDataManagerViewpoint` con id fisso `Pointer_ViewPointDataManager` (Q3), e i tre punti di lettura portati sul singleton — la tabella (`InstanceManagerTab`), la view del drawer e il rung del tema della form (`IRForm`, host `manager`). HARD STOP prima della slice D.
**Files touched**: `frontend/src/view/viewPoint/viewpoint.ts`, `frontend/src/joiner/index.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` — commit `3b349b03d`. Sonda a parte: `6fc43ed43`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size. Suite intera: 3253/3255, 2 rossi PRE-ESISTENTI e non causati qui (`instanceManagerOutline.test.ts:155`, `instanceManager10c.test.ts:541` asseriscono un mount di `IRForm` senza `host="manager"`, che il sorgente porta da `40142a4f3`; verificato con `git show HEAD:` e diff vuoto su quella riga), piu' 9 file che falliscono all'import di monaco in `environment: node`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1. `newVP` apre la propria TRANSACTION e non e' avvolta (§3.3).
**Smoke visivo**: passato — sonda end-to-end `probe_2026-09-04_rdmv_sliceC_singleton_read.mts` sul dev server, 10 PASS 0 FAIL, piu' la verifica di Alfonso. A: singleton assente, colonne `[tint, threshold, tags]`, nessun avviso, e aprire il manager NON lo crea (R-DMV-6). B: `table.columns` nel viewpoint ATTIVO, tabella invariata. C: la stessa chiave nel SINGLETON, `[tags, threshold, tint]` e nessuna colonna persa.
**Notes**: B rosso prima / C verde e' cio' che rende la misura una misura: da solo, B non distinguerebbe «legge dal singleton» da «non legge piu' niente». Primo giro C1 rosso per la FIXTURE: `DViewElement.new2` prende il PADRE, e una stringa fa cadere il fallback su `Pointer_ViewPointDefault` in silenzio — lo stato che non si e' formato letto come comportamento (CLAUDE.md §5). Documentato nella sonda.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(ir): viewpoint esplicito e opzionale su computeIRSignature e getIRIndex (R-DMV slice B)
**Prompt**: GO emendato R-DMV Fase 2, slice B: parametro `viewpointId` opzionale su `computeIRSignature` e `getIRIndex` (default l'attivo, i 19+16 chiamanti invariati), propagato nei tre punti di `useIRFormView`; test della cache per la domanda Q3 (id fisso, due progetti in sequenza).
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`, `.../ir/useIRFormView.ts`, `.../ir/__tests__/irIndexViewpoint.test.ts` (nuovo) — commit `a30217722`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 552/552 su tutta la cartella `viewpoint/ir/` (23 file, 6 nuovi). Banco delle mutazioni (P11), due giri: `getIRIndex` che ignora `viewpointId` -> 3 rossi su 6; `computeIRSignature` che lo ignora -> 4 rossi su 6.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile — nessun chiamante cambia comportamento: il default del parametro e' il viewpoint attivo, canvas / manager / drawer identici. La verifica end-to-end arriva con la slice C, che e' il primo passaggio di un viewpoint diverso.
**Notes**: Q3 misurata e non dedotta: `indexCache` e' chiavata sulla sola signature, che porta un `refToken` per ogni oggetto ir (WeakMap sull'identita'), quindi due progetti in sequenza con lo stesso `Pointer_ViewPointDataManager` danno due chiavi diverse. Asserito anche che indicizzare il singleton non sfratta l'indice dell'attivo (R7 del referto).
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — feat(viewpoint): il tipo dataManager e la sua esclusione dalle liste (R-DMV slice A)
**Prompt**: GO emendato R-DMV Fase 2, slice A: valore nuovo `'dataManager'` di `ViewpointType`, predicato unico, e i quattro filtri (picker della Toolbar, MegamodelView, Dashboard, dashboard di progetto). L'esclusione arriva prima della cosa da escludere: non esiste mai una finestra in cui il singleton compare dove non deve.
**Files touched**: `frontend/src/view/viewPoint/viewpoint.ts`, `frontend/src/joiner/index.ts`, `frontend/src/components/editor-v2/Toolbar.tsx`, `frontend/src/components/megamodel/MegamodelView.tsx`, `frontend/src/pages/components/Dashboard.tsx`, `frontend/src/components/project/ProjectEditor.tsx` — commit `15c289f37`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, `dataManagerPicker.test.ts` 39/39 (il test asserisce sul sorgente di `Toolbar.tsx`, incluso `'}, [modelId]);'`: le deps non cambiano). Nessun `switch` esaustivo su `ViewpointType` in albero, verificato con grep sui 4 consumatori.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile in questa slice — nulla crea ancora il singleton, quindi nessuna lista puo' cambiare contenuto. Verificato invece nella slice C, blocco A: il singleton non esiste e la tabella e' identica.
**Notes**: **Deroga regola 19** (6 file, RC-11). Due nomi e un oggetto: `viewpointType` dice COSA e si legge da un `DViewElement`, `DATA_MANAGER_VIEWPOINT_ID` dice QUALE e si legge dove viaggia solo un id (`MegamodelView` prende `{id, name}`). Il singleton NON entra in `Defaults.viewpoints`: quella lista e' cio' che lo store semina all'avvio, e R-DMV-6 lo vuole nato alla prima scrittura. Nessun test: `viewpoint.ts` tira monaco via `joiner` e non si importa in `environment: node`, misurato con una sonda.
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — refactor(ir): ManagerSpec diventa TableSpec, prima che un progetto la scriva (R-DMV-3)
**Prompt**: GO emendato R-DMV Fase 2, slice 0 (ex slice G, promossa in testa): rinomino puro della chiave dell'ir e dei suoi identificatori, da sola nel commit. `manager?: ManagerSpec` -> `table?: TableSpec` sui due node ir, `managerViews.ts` -> `tableViews.ts`, `resolveManagerSpec` -> `resolveTableSpec`, `ManagerViewResolution` -> `TableViewResolution`, test rinominato, warn `[manager]` -> `[table]`.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `.../ir/managerViews.ts` -> `.../ir/tableViews.ts` (rinominato), `.../ir/__tests__/managerViews.test.ts` -> `.../ir/__tests__/tableViews.test.ts` (rinominato), `frontend/src/components/abstract/tabs/instanceTable.ts`, `.../tabs/__tests__/instanceTable.test.ts`, `.../tabs/InstanceManagerTab.tsx` — commit `b7f069389`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size, vitest 55/55 sui due file di test (`tableViews` 10, `instanceTable` 45). Banco delle mutazioni (P11): rimesso `(ir as NodeViewIR).manager` al posto di `.table` in `tableViews.ts`, 9 test su 10 rossi; ripristinato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; nessun campo persistito cambia di forma perche' nessun progetto porta ancora la chiave (R-B9, referto §9 con positivo di controllo).
**Smoke visivo**: non applicabile — rinomino puro, nessun pixel cambia (dichiarato dal GO).
**Notes**: **Deroga regola 19** (6 file, RC-11): i sei enumerati dalla risposta Q1 del GO. `hosts.manager` / `FormHostOverride` non toccati (R-DMV-7). `managerResolution` resta il nome della variabile locale (regola 2). Grep finale su `frontend/src` = 0; su `docs/discovery/harness` restano 2 righe di prosa nella sonda **non tracciata** `probe_2026-09-03_rvp_slice1_manager_columns.mts`, WIP di un'altra corsia, non toccata (RC-13).
**Prompt document name**: 2026-09-04 15:59

## 2026-09-04 — docs: discovery del Data Manager Viewpoint singleton (R-DMV, Fase 1)
**Prompt**: Fase 1 read-only di R-DMV: falsificare H1..H6 (dove marcare il singleton, il picker come porta, l'indice del manager, il rail, i punti di esclusione, `pruneForm`), referto con `file:riga` e citazioni verbatim, proposta di affettatura della Fase 2, hard stop prima di qualunque codice.
**Files touched**: `docs/discovery/discovery_2026-09-04_data_manager_viewpoint.md` (nuovo, 807 righe) — commit `65b8fb6b8`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato, Fase 1 read-only. Nessun comando di build o test eseguito, dichiarato nel referto §15.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1 letto in scrittura; `VersionFixer.tsx` letto in sola lettura per la domanda 6 (risposta: nessuna migrazione).
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Falsificate H4 (il segmented «Type» del rail declassa il singleton; `FormAuthoringBody` vuole un `draft` e un `target` che nel rail non esistono) e H5 nei numeri (duplicazione e cancellazione hanno due punti ciascuna, non uno). Finding portante §2.3: `isExclusiveView` false renderebbe le view del singleton DECORATIVE su ogni canvas classico (`selectors.ts:552-559`). R-B9 verificata con positivo di controllo: la chiave `manager` si puo' ancora rinominare in `table`.
**Prompt document name**: 2026-09-04 15:45

## 2026-09-04 — refactor(rail): via la scheda Form, il Data Manager e' l'unico host (R-VP-14)
**Prompt**: rimozione integrale della scheda Form del rail (Properties | Form, 2026-08-26): il pannello di destra torna al solo rendering classico (`Info`). Nessuna modifica a `IRForm`, `formHosts.ts`, alla prop `host` ne' al Data Manager (R-VP-14). Corsia veloce RC-3, due file, nessuna critical zone.
**Files touched**: `frontend/src/components/editors/PropertiesWithTreeView.tsx`, `frontend/src/components/editors/properties-with-tree-view.scss` — commit `c582c2bbb`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei due file), `build` exit 0, warning solo le deprecazioni Sass pre-esistenti (`@import`, `darken()`, global builtin) e l'avviso di chunk-size; zero righe `error`. vitest non eseguito: nessun test cita `inspectorTab` o `inspector-tabs`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — quattro controlli: oggetto M1 selezionato → nessuna barra di tab, Properties classico come prima del 2026-08-26; DClass selezionato → identico a oggi; sezione NODE in Advanced ancora presente; Data Manager, drawer invariato.
**Notes**: Verifica preventiva §2 sul working tree: `import IRForm` :6, `formSubjectId` :544 (solo il mount :1110), `formSubjectIsObject` :547-550 (barra e mount), `inspectorTab` :551 con l'effetto :554-556, barra :1084-1107, ternario :1109-1115, guardia :1120 — nessun altro consumatore. Via anche il commento :536-539, solo sulla scheda; `selectedElementId` resta (:556, :557, :816). SCSS :2497-2537 intero, `grep inspector-tabs` → 0. Senza la guardia NODE torna sugli oggetti, voluto.
**Prompt document name**: 2026-09-04 15:09

## 2026-09-04 — feat(form): order, labels, hidden e hosts.manager su FormSpec (R-VP slice 1, commit 2)
**Prompt**: GO emendato R-VP slice 1 Fase 2, commit 2: tre chiavi additive su `FormSpec` (`order`, `labels`, `hidden`), override per host `hosts.manager` (`FormHostOverride`), `resolveFormSpec` pura in `formHosts.ts`, prop `host` su `IRForm` dichiarata dai tre mount, `hidden` nello stesso `continue` di `features: 'hidden'`, `order` su `visible` prima di `buildFormSections`.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `.../ir/formHosts.ts` (nuovo), `.../ir/__tests__/formHosts.test.ts` (nuovo), `.../ir/IRForm.tsx`, `.../ir/IRFormField.tsx`, `.../ir/useFormWidgets.ts`, `.../ir/__tests__/useFormWidgets.test.ts`, `.../ir/__tests__/irValidate.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/editors/PropertiesWithTreeView.tsx` — commit `40142a4f3`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei dieci file), `build` exit 0 col solo avviso di chunk-size (Node 23), vitest 95/95 sui quattro file di test (10 nuovi `formHosts`, 4 nuovi `useFormWidgets`, 2 nuovi `irValidate`).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: passato — `localhost:3000`, `Form 1b fixture`, `Running : State`, hard refresh dopo il commit. Drawer del manager (Advanced): `Time-out (s)`, `kind`, `name`, `isHistory`, `On entry`, `depth`; `tags` assente. Rail (scheda Form, Advanced): `timeout` con label normale, `kind`, `On entry`, `tags` presente. Pannello Properties classico invariato. Tabella invariata (R-VP-9).
**Notes**: **Deroga regola 19** (10 file, RC-11). **Scope oltre il GO, dichiarato**: `IRFormField.tsx:455` è l'unico punto che stampa la label (`field.name`), una riga (`field.label ?? field.name`) con `label?` opzionale sul descrittore, valorizzato solo se l'autore lo dichiara. Il rail passa `host="rail"` esplicito. `widgets: { kind: 'text' }` nell'override resta select: `kind` è enum e `overrideIsCompatible` lo rifiuta, ladder pre-esistente. Dettaglio: addendum §9 del referto.
**Prompt document name**: 2026-09-03 23:20

## 2026-09-03 — feat(manager): ManagerSpec.columns sulla view di classe (R-VP slice 1, commit 1)
**Prompt**: GO emendato R-VP slice 1 Fase 2, commit 1: `ManagerSpec { columns? }` su `VertexViewIR`, `orderColumns` pura in `instanceTable.ts`, lettura di `manager` dall'indice per la sola view senza predicato (R-VP-11), warn una volta per classe. Niente `sort` (R-VP-10), niente `irCompile`/`CompiledView`.
**Files touched**: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (solo `export` di `pinAccepts` e `compareCandidates`), `frontend/src/components/editor-v2/viewpoint/ir/managerViews.ts` (nuovo), `frontend/src/components/editor-v2/viewpoint/ir/__tests__/managerViews.test.ts` (nuovo), `frontend/src/components/abstract/tabs/instanceTable.ts`, `frontend/src/components/abstract/tabs/__tests__/instanceTable.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` — commit `85db1612c`. Docs a parte: `b28c370de` (ratifiche R-VP, memo, referto, GO).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc` 33 su output completo (baseline esatta), `build` exit 0 col solo avviso di chunk-size (Node 23), vitest 55/55 sui due file di test (10 nuovi in `managerViews`, 7 nuovi in `instanceTable`).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1; zero import di `useJjomSync`/`portDistribution` nel manager (referto §6).
**Smoke visivo**: passato — su `localhost:3000`, progetto `Form 1b fixture`, metaclasse `State`: senza `manager` tabella identica; `manager` su una view con `predicate` → un solo warn `[manager]` e colonne invariate; tolto il predicato e `columns: ['tags','timeout','kind']` → NAME, TAGS, TIMEOUT, KIND, poi le altre nell'ordine di prima, tutte visibili, «1 column hidden» invariato.
**Notes**: **Deroga regola 19** (7 file, RC-11): `irResolveCore.ts` entra solo per due `export`. **Deviazione dal GO, dichiarata**: `manager?` anche su `GraphVertexViewIR` (stesso bucket `byMetaclass`, `irResolveCore.ts:210`); `EdgeViewIR` fuori. Build con Node 18 fallita per `crypto.hash`: (g), sparita con Node 23. Commit dalla shell nativa del Mac, lock residui rimossi a mano da Alfonso. Dettaglio nell'addendum §8 del referto `discovery_2026-09-03_rvp_slice1_manager_section.md`.
**Prompt document name**: 2026-09-03 23:20

## 2026-09-03 — docs: discovery on AI surfaces, providers and system prompts
**Prompt**: inventario read-only delle superfici AI (Jjodie, trasformazioni, documentazione, altro), del pannello Providers e dei system prompt, per la sezione «AI in Jjodel» dei docs.
**Files touched**: `docs/discovery/discovery_2026-09-03_ai_surfaces_inventory.md` (nuovo), `docs/claude-code-log.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice letto in scrittura, Fase 1 read-only.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile — deroga P8 dichiarata nel prompt, nessun pixel cambia.
**Notes**: `frontend/src/ai/` non esiste (client: `services/AIProviderService.ts`, registro `types/jodie.ts`): regola 15 dichiarata, non applicata come stop perche' trovare quei path era l'oggetto della discovery. Il blocco di entry del prompt e' in italiano e privo di sei campi di §21.2: scritto nel formato canonico. Findings nel referto, §2-§6.
**Prompt document name**: 2026-09-03 22:20

## 2026-09-03 — docs(log): §6.1 chiusura batch 2026-09-02 (BOOT1, VIEW1, VER2, SAVE2, DOC2)
**Prompt**: §6.1 di chiusura del batch del 2 settembre a repo fermo: spostare verbatim le otto
entry dalle cinque inbox al log attivo, cancellare le inbox, committare il checkpoint del 3/9 e
questo prompt, accertare (non chiudere) lo stato di EGO1 in indice. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` + `docs/log-inbox/` cinque file rimossi
(`c1118d86c`), `docs/sessioni/sessione_2026-09-03_ricostruzione.md` +
`docs/prompts/claude_2026-09-03_1143_chiusura_61_inbox_e_checkpoint.md` (`d9e2480cb`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (a)
**Regressions**: no — nessun file di codice toccato. `check:docs` 3/3 con le stesse 2 warning
pre-esistenti (i due `Corregge: 2026-09-01 23:20` di SAVE1-bis e DIRTY1) prima e dopo ogni
commit; nessuna warning nuova dalle otto entry spostate.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Due premesse del prompt smentite dalla misura, entrambe innocue. (1) Il log attivo
teneva 10 entry, non 9: attivo 10 -> 18 con le otto, non 17; rotazione comunque saltata
(soglia 40). (2) **EGO1: l'indice e' vuoto** — `git diff --cached` a zero al gate, nessun
revert staged da accertare; l'hard stop del punto 4 non ha oggetto. Entry spostate verbatim,
nessun emendamento; nessun file di appoggio, nessuna copia del log (RC-13-bis).
**Prompt document name**: 2026-09-03 11:43

## 2026-09-02 — fix(topbar): l'ultimo salvataggio si legge da ogni tab (DOC2)
**Prompt**: DOC2 punto 4 — l'indicatore di SAVE2 sta nella tab sbagliata: l'autosave lo innesca il canvas, ma lo stato si legge solo dal Data Manager.
**Files touched**: `frontend/src/components/topbar/LastSavedIndicator.tsx` (nuovo), `frontend/src/common/libraries/lastSaved.ts`, `frontend/src/common/libraries/__tests__/lastSaved.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/abstract/tabs/instanceManagerTab.scss`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/components/navbar.scss` — commit `defb3a112`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (a)
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei sette file), `build` exit 0 col solo avviso di chunk-size, `vitest` 3216 verdi / 0 falliti (era 3207; i 9 file `window is not defined` sono pre-esistenti, riverificati su HEAD).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1, nessuna scrittura D-layer: si consuma un CustomEvent gia' emesso.
**Smoke visivo**: passato — sonda `_tmp_doc2_smoke.ts` sull'app vera, 15 PASS / 0 FAIL, `pageerror` 0. Trascinamento reale su v2-flow -> autosave alla quiete -> «Saved just now» in topbar; Data Manager a zero occorrenze; sporco «Unsaved, last saved just now».
**Notes**: Spostato, non duplicato: una resa sola. `formatLastSavedLabel`/`subscribeLastSaved` escono da `lastSaved.ts` perche' i test li ESEGUANO — le asserzioni sul sorgente di SAVE2 erano verdi con l'indicatore nella tab sbagliata (P11). 3 mutazioni, 2 rossi ciascuna. **Deroga regola 19** (7 file, RC-11) e ai test di SAVE2, che il punto 4 rende falsi. Topbar 50px, non 60 come dice il prompt (`_layout.scss:17`, `b4cba749e`).
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs: P11 e il censimento dei numeri normativi stantii (DOC2)
**Prompt**: DOC2 punti 2 e 3 — normare la sonda che non esegue il soggetto, e censire i numeri normativi rimasti indietro.
**Files touched**: `docs/PROTOCOL.md`, `docs/discovery/discovery_2026-09-02_doc2_numeri_stantii.md` (nuovo) — commit `29322514d`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — solo documenti; `check:docs` 3/3 con 2 warning before e after, `check:agents` PASS, `AGENTS.md` non si e' mosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: P11 in coda e non dentro P7/P8: i prompt citano le clausole per numero e inserirla in mezzo rinumererebbe le citazioni. Fuori dal blocco di P9 verificato byte a byte; `P1..P10` in testa diventa `P1..P11`. Censimento: 3 voci stantie su 8 verificate — il `1000ms` ricopiato in `projects.ts:105`, il totale `vitest` 3147 dei prompt (reale 3207), il range `P1..P9` di `CLAUDE.md`. Nessuna corretta: e' una lista.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs(editor-v2): il docstring dell'autosave punta alla costante (DOC2)
**Prompt**: DOC2 punto 1 — il blocco ratificato di `useLayoutAutosave.ts` dice ancora «fires 1000ms after the gesture» dopo SAVE2.
**Files touched**: `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` — commit `1a4502151`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — il diff e' un solo blocco di commento; `tsc` 33 su output completo, 0 nel file toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — commento, nessun codice eseguibile.
**Smoke visivo**: non applicabile
**Notes**: Il ragionamento sulla silenziosita' non e' riscritto: vale a fortiori a 15 s, che e' piu' lontano di 1000 ms dalla finestra di coalescing. Il numero non e' duplicato — il blocco cita `AUTOSAVE_DEBOUNCE_MS`/`AUTOSAVE_MAX_WAIT_MS`, che vivono in `useLayoutAutosave.ts` stesso (:71, :84) e **non** in `layoutAutosaveScheduler.ts` come diceva il prompt. `CLAUDE.md` non toccato: nessun hard stop.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — feat(editor-v2): l'ultimo salvataggio in testata al Data Manager (SAVE2)
**Prompt**: diradare l'autosave del layout, togliergli la notifica, e mostrare da qualche parte quando il progetto e' stato salvato l'ultima volta.
**Files touched**: frontend/src/components/abstract/tabs/InstanceManagerTab.tsx, frontend/src/components/abstract/tabs/instanceManagerTab.scss, frontend/src/common/libraries/__tests__/lastSaved.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_save2_smoke.ts`, 12 PASS/0 FAIL: «Saved just now» in testata, «Unsaved, last saved just now» col progetto sporco; slate 11px, nessuno sfondo; pageerror 0)
**Notes**: `lastModified` non torna in Redux dopo un save (la sola `SetFieldAction` sta in `Offline.getAll`), e rimettercelo sarebbe un passo di undo per autosave: il timestamp vive in `common/libraries/lastSaved.ts` come `U.isProjectModified` vive su `U`, con evento a ogni scrittura. Riusa `formatRelativeTime` di `types/activity`; nessun quinto formatter. Etichetta «Unsaved» e non la coppia vietata in questo file da A3 di 10c.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(persistance): l'autosave si dirada e smette di notificare (SAVE2)
**Prompt**: diradare l'autosave del layout, togliergli la notifica, e mostrare da qualche parte quando il progetto e' stato salvato l'ultima volta.
**Files touched**: frontend/src/api/persistance/projects.ts, frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts, frontend/src/components/editor-v2/hooks/layoutAutosaveScheduler.ts (nuovo), frontend/src/common/libraries/lastSaved.ts (nuovo), frontend/src/events/registry.ts, frontend/src/api/__tests__/projectsSaveNotification.test.ts (nuovo), frontend/src/components/editor-v2/hooks/__tests__/layoutAutosaveScheduler.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_save2_smoke.ts`: 5 gesti in 10 s -> 0 salvataggi durante, 1 alla quiete, silenzioso, 0 toast; save esplicito -> 1 toast; pageerror 0)
**Notes**: Misurato prima di scegliere N: un save silenzioso costa 235 ms (mediana su 5), tutti in `U.compressedState`, su 499 voci di `idlookup` — 10 gesti a 2 s producevano 6 serializzazioni complete. Trigger (a) idle a 15 s con tetto a 120 s; (b) intervallo+dirty scartato perche' l'orologio puo' cadere fra due gesti. 7 mutazioni tutte rosse. Fuori perimetro: `events/registry.ts` per la regola 25; nessun `git add -A`.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(editor-v2): il gate dello Step 4 concorda con la passata che protegge (BOOT1)
**Prompt**: su un grafo creato da zero il bootstrap non produce archi — tre nodi radice, zero archi, ne' la containment ne' la reference.
**Files touched**: frontend/src/components/editor-v2/hooks/useJjomSync.ts, frontend/src/components/editor-v2/sync/m1EdgeGate.ts (nuovo), frontend/src/components/editor-v2/sync/__tests__/m1EdgeGate.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_boot1_verifyC.ts`: 10 PASS/3 FAIL prima, 13 PASS/0 FAIL dopo; canvas 3 nodi 2 archi; pageerror 0)
**Notes**: Il grafo esisteva: la premessa «mai avuto un grafo» e' falsa per lo stato osservato. Lo Step 4 e' protetto da un contatore calcolato prima che lo Step 2bis crei i vertici, quindi 0 su un grafo appena ripopolato; lo Step 3 non e' protetto e i suoi archi li disegna. L'asimmetria era il difetto. Referto: docs/discovery/discovery_2026-09-02_boot1_bootstrap_archi.md.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(editor-v2): la create dal manager instanzia vertice e arco sul canvas
**Prompt**: VIEW1, corsia parallela a VER2 — un figlio di containment creato dal Data
Manager esisteva nel modello e non compariva sul canvas. Misurare la divergenza alla riga,
chi possiede l'identita', quanti canvas; scegliere fra (a) simmetria dei percorsi e (b) il
canvas autorita' sul layout, con il punto 3 come discriminante.
**Files touched**: `frontend/src/components/editor-v2/hooks/createAdapter.ts`,
`.../hooks/__tests__/createAdapterFlow.test.ts` (nuovo) — commit `783a8245d`.
Referto: `docs/discovery/discovery_2026-09-02_view1_create_manager_vertice.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: no — `tsc` 33 (baseline esatta, 0 nei due file), `build` exit 0, `vitest`
3147 verdi / 0 falliti (i 9 file `window is not defined` sono pre-esistenti, riverificati,
nessuno nel perimetro). Sonda 13/3 -> 16/0, `pageerror` 0 in entrambe le corse.
**Out-of-scope changes**: no — due file, pathspec esplicito al commit; staged EGO1 e il
perimetro VER2 (`api/persistance/`, `reducer.ts`) non toccati.
**Layer Impact Report**: produced — in chat prima del diff. D-layer (`DVertex.new`,
`DVoidEdge.new2` da un sito nuovo) e canvas v2-flow; nessun file di §3.1 modificato, le due
funzioni erano gia' esportate e gia' chiamate cosi' da `ContextMenu.tsx:371-372`.
**Smoke visivo**: passato — sonda guidata dalla UI vera del Data Manager, 16 PASS / 0 FAIL.
**Notes**: Scelto (a). (b) usciva dal perimetro di visita `model.objects`, ratificato in
CRUD3 F2, e voleva uno Step 4 che riparte sulle scritture di slot, che §3.5 vieta. Nessuna
nozione di canvas attivo esiste (grep vuoto, controllo positivo a 7 file): l'idioma e' primo
match, gia' in due posti. **Deroga P6 (RC-11)**: tipo di commit non indicato, scelto `fix`
invece di chiederlo. Aperto: figlio creato senza canvas non recuperato all'apertura.
**Prompt document name**: PROMPT_VIEW1.md — 2026-09-02

## 2026-09-02 — fix: il riallineamento di `save` non scrive piu' sull'oggetto vivo dello store
**Prompt**: VER2 — misurare quando il riallineamento di `ProjectsApi.save` colpisce `idlookup[id]` invece di un target detached, misurarne il danno, correggere solo se il danno si misura.
**Files touched**: frontend/src/api/persistance/projects.ts, frontend/src/api/__tests__/projectsSaveVersionStore.test.ts, docs/discovery/discovery_2026-09-02_ver2_riallineamento_save.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: yes
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Non e' il divergence point: l'app sta stabilmente a `transactionDepthLevel === 1` (`reducer.ts:1443` + `BEGIN()` in `COMMIT`), l'azione va in coda e la scrittura colpisce l'oggetto vivo SEMPRE. Misurato: bump fuori dal delta e dalla history (Δ`clonedCounter` 0, Δundo 0, contro +1/+1 del controfattuale). Regressione dichiarata (RC-11): due save entro 300ms condividono un numero. Misure, alternative scartate e residuo in `discovery_2026-09-02_ver2_riallineamento_save.md`.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs(log): §6.1 chiusura batch VER1 / UNQ1-C6
**Prompt**: §6.1 di chiusura del batch VER1 / UNQ1-C6 a repo fermo, seriale: spostare le tre
entry dalla inbox al log attivo, committare i prompt untracked, iscrivere RC-13-bis in
PROTOCOL, ruotare il log se oltre soglia, e accertare (non chiudere) lo stato di EGO1 in
indice. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` + `docs/log-inbox/` (`8875ddc7f`),
`docs/prompts/` cinque prompt (`be35fde2e`), `docs/PROTOCOL.md` (`7b930bd07`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (e)
**Regressions**: no — nessun file di codice toccato. `npm run check:docs` **3/3, 2 warning**
prima e dopo ciascun commit; Check A resta PASS dopo l'aggiunta di RC-13-bis, che sta fuori
dal blocco verificato byte a byte.
**Out-of-scope changes**: yes — questa entry stessa e' un sesto commit oltre i cinque punti
del prompt, che non ne prevedeva una: P9 la richiede e la sua omissione e' gia' stata la
CODA del batch precedente.
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Deroga dichiarata: la `Notes` di VER1 era 878 caratteri, Check C in ERROR;
accorciata sotto il cap citando `1ac3b1863`. Entry del batch corrente, stessa sessione, non
back-filling. Attivo 6 -> 9 entry, rotazione saltata (soglia 40). Accertamento EGO1: l'indice
non tiene lavoro in volo, tiene un **revert staged** (-295 righe, la discovery cancellata);
albero e HEAD identici byte a byte, test 24/24. Indice lasciato come trovato.
**Prompt document name**: PROMPT_6.1_chiusura_VER1_C6.md — 2026-09-02

## 2026-09-02 — fix(problems): l'appartenenza al modello e' un campo su NodeProblem
**Prompt**: UNQ1 C6, corsia L2 parallela — chiudere il terzo punto di §C5.4: un campo
opzionale additivo su `NodeProblem` che nomini il modello di appartenenza, scritto da
**entrambi** i produttori, e la revoca che lo usa al posto di `ownedIdsByModel`, se e solo
se tiene il caso dell'elemento cancellato che §C5.2 tiene.
**Files touched**: `frontend/src/components/editor-v2/problems/registry.ts`,
`.../problems/UniquenessProblemSync.tsx`, `.../problems/ConformanceProblemSync.tsx`,
`.../problems/__tests__/UniquenessProblemSync.test.ts` (commit `bc939442b`).
Referto in coda a `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (`e153c8fe2`).
Coda `7f8fa2242`: tre puntatori di riga della nota, scritti contro i file prima della
modifica. **Deroga RC-13 dichiarata (RC-11)**: quel commit tiene `registry.ts` e il referto
insieme — stessa correzione, sole righe di commento, ma e' un commit misto.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — sonda `_tmp_unq1c6.ts`: le sette righe della tabella di C5.3 verdi
prima **e** dopo, `pageerror` 0 in entrambe le corse; `tsc` 33 (baseline esatta, 0 nei
quattro file), `build` exit 0, `vitest` 3131 verdi / 0 falliti (i 9 file `window is not
defined` sono pre-esistenti, riverificati, nessuno nel perimetro).
**Out-of-scope changes**: no — quattro file, sotto la soglia dei cinque, pathspec esplicito
al commit; staged EGO1 e WIP VER1 in `api/persistance/` non toccati.
**Layer Impact Report**: not-required — il registro dei problemi e' una `Map` di modulo
lato UI: nessuna scrittura D-layer, nessun proxy L, nessun TRANSACTION, nessuna persistenza.
**Smoke visivo**: passato — sonda 22 PASS / 0 FAIL contro il dev server (prima: 15/7).
**Notes**: `ownerModelId`, non `modelId`: la conformance registra anche sull'id del
`DVertex`, che vive nel grafo non nel modello, e per l'unicita' il valore e' il `DModel` di
un metamodello quando e' un metamodello a essere aperto. Punto 4: `ownedIdsByModel`
**rimossa** — scritto alla registrazione, il campo tiene l'elemento cancellato perche'
l'owner e' nel dato. Test 7 -> 12, quattro mutazioni rosse. Censimento lettori, nome e
misure in §C6.1-C6.4 del referto. Deroga RC-13 in `7f8fa2242`, sopra.
**Prompt document name**: PROMPT_UNQ1-C6.md — 2026-09-02

## 2026-09-02 — fix(persistance): save riallinea project.__raw dopo il bump di versione
**Prompt**: VER1 (corsia L1, parallela) — `ProjectsApi.save` legge la versione da un `__raw`
stantio: due save espliciti sullo stesso `LProject` producono `1.1` due volte. Riprodurre con
una sonda contro il dev server, censire i lettori di `version`, correggere nel punto minimo,
test unitario accanto a quello DIRTY1 e invertire l'asserzione che il difetto lo registrava
com'era. Non toccare la regola ratificata 2026-08-24 (il silent save resta senza bump).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts`,
`frontend/src/api/__tests__/projectsSaveVersion.test.ts` (nuovo) — commit `1ac3b1863`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc --noEmit` **33** sull'output completo (baseline invariata), **0** nei
file toccati; `build` exit 0 col solo warning di chunk; `vitest` intera **3131 passati, 0
falliti**, i 9 file che non si raccolgono riverificati su un worktree staccato su HEAD e
risultati **identici** (stessa lista, `window is not defined` in `monaco-editor/.../window.js:14`
e `src/utils/PerformanceMetrics.ts:220`, nessuno dei due toccato).
**Out-of-scope changes**: no — l'inversione del test DIRTY1 è la stessa correzione, chiesta dal
prompt.
**Layer Impact Report**: not-required — nessun file della critical zone §3.1: `projects.ts` non
è in elenco, non passa da `useJjomSync`/`syncState`/`canvasToJjom`/`portDistribution`/
`VersionFixer`, e la scrittura D-layer che tocca è il `SetFieldAction` già presente, invariato.
**Smoke visivo**: non applicabile — nessun pixel cambia; la verifica è la sonda
`_tmp_ver1_verify.ts`, **5 FAIL su 7 prima, 0 su 7 dopo**, stabile su due corse.
**Notes**: Causa misurata: il reducer copia lungo il path (`reducer.ts:540`), `idlookup[id]`
diventa un oggetto nuovo e il proxy resta sul precedente. Nessun lettore dipende dal valore
stantio. Tre mutazioni rosse (6, 2, 8 FAIL). Censimento, alternativa scartata e motivazione
in `1ac3b1863` e nel commento di `projects.ts:140-162`. Notes accorciata in §6.1 sotto il cap
§21.2: entry del batch corrente, stessa sessione, non back-filling.
**Prompt document name**: PROMPT_VER1.md — 2026-09-02

## 2026-09-02 — chore(gates): Check B accetta solo la forma (x) per Causa
**Prompt**: CODA di chiusura L1–L4, punto 3 — Check B passava sia `**Causa**: (a)` sia
`**Causa**: a`. Restringere alla sola forma parentesizzata, misurando prima le conseguenze
su attivo e archivio. Hard stop se Check B scandisse anche l'archivio (il «no back-filling»
vieterebbe di emendare le entry pregresse).
**Files touched**: `frontend/scripts/gates/check-docs.ts` (commit `c9bd6112a`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run check:docs` **3/3, exit 0, 2 warning** prima e dopo, invariati.
Nessun file applicativo, nessun impatto su build o typecheck.
**Out-of-scope changes**: no — un solo file, pathspec esplicito.
**Layer Impact Report**: not-required — script di gate, nessun layer applicativo.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Check B scandisce il solo log attivo; l'archivio serve a risolvere `Corregge`,
non viene lintato: nessuna entry pregressa toccata, niente hard stop. `Corregge` non prende
una lettera ma `YYYY-MM-DD HH:mm`, già vincolato da `TIMESTAMP_PREFIX`: la restrizione vale
per la sola `Causa`. Forme in archivio: **118 `(x)`, 8 nude, 3 di prosa**. Controllo positivo
`Causa: e` → ERROR. Il gate non ha test: dichiarato, non creato.
**Prompt document name**: PROMPT_CODA_batch_L1-L4.md — 2026-09-02

## 2026-09-02 — docs(log): chiusura batch L1–L4 (sanatoria, log-inbox, rotazione)
**Prompt**: §6.1 di chiusura del batch L1–L4 a repo fermo, seriale: bonificare l'indice
condiviso, verificare le tre sonde temporanee, scrivere la nota di sanatoria dei commit
mal-messaggiati, correggere la `Causa` di SAVE1-bis, iscrivere in P9 la regola log-inbox
per le corsie parallele, ruotare il log se oltre soglia. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` (nota di sanatoria, `ff74cee8e`),
`docs/PROTOCOL.md` + `docs/log-inbox/.gitkeep` (regola log-inbox, `061453e65`),
`docs/claude-code-log.md` + `docs/claude-code-log-archive.md` (rotazione P9, `0838a303f`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (e)
**Regressions**: no — nessun file di codice toccato, nessun gate di build coinvolto.
`npm run check:docs` (da `frontend/`) **3/3, exit 0** prima e dopo ciascuno dei tre commit,
con i 2 warning non bloccanti preesistenti su `Corregge` di SAVE1-bis e DIRTY1.
**Out-of-scope changes**: no — tre commit tematici, ciascuno per pathspec esplicito.
L'indice conteneva staged della corsia EGO1: lasciato intatto, mai `git add .`.
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: `Corregge` resta `—`: la sessione non rifà il lavoro di una corsia, ne sana il
registro; `Causa` `(e)` è la concorrenza su albero condiviso. La `Causa` di SAVE1-bis non
andava corretta: portava già `(a)` dal commit che ha scritto l'entry (`f278cf4fb`). Le tre
sonde `frontend/scripts/smoke/_tmp_*` cadono in `.gitignore:66`, nessuna promossa.
Rotazione: attivo 49 -> 5, archivio 1025 -> 1069, verbatim per data. Nessun rewrite.
**Prompt document name**: PROMPT_CHIUSURA_batch_L1-L4.md — 2026-09-02

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


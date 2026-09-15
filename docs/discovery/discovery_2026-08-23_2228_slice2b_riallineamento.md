# Discovery 2026-08-23: riallineamento della slice 2b e accertamento di `R-LAY-10`

Prompt: `docs/prompts/claude_2026-08-23_1425_prompt_2228_slice2b_commit2b.md`.
Normativo di riferimento: `docs/prompts/claude_2026-08-18_1656_prompt_2228_fase2.md`, sezione
«Commit 2b».
Branch `alfonso-frontend-jjtl`, base `b6357101b`.

---

## 0. Obiettivo

Due cose, entrambe di misura.

1. **Riallineare** le premesse del prompt del 18 al codice del 23, riga per riga, prima di scrivere
   il diff. Il prompt del 23 ne riverifica cinque e ne dichiara una cambiata; questo report verifica
   tutte quelle citate, e ne trova **quattro in più** già chiuse che nessuno dei due prompt segnala.
2. **Accertare `R-LAY-10`**: quanti scrittori ha il viewpoint attivo, se `state.viewpoint` e
   `DProject.activeViewpoint` possano divergere, e se questo commit chiuda la divergenza. Obbligo di
   referto, non di rimedio.

---

## 1. File letti (path completi)

- `CLAUDE.md`, `docs/PROTOCOL.md`
- `docs/decisions.md`, righe 779-1035 (`R-IRN-11..26`) e 1668-1693 (`R-LAY-1..10`)
- `docs/prompts/claude_2026-08-18_1656_prompt_2228_fase2.md` (intero)
- `docs/discovery/discovery_2026-08-18_2228_seed_e_activeviewpoint.md` §5.1-5.5
- `docs/discovery/discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.3
- `docs/discovery/discovery_2026-08-19_2228_2b_perimetro_activeviewpoint.md` §4-§9
- `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md` §B.5, §B.7, §B.8
- `frontend/src/joiner/classes.ts` (1175-1190, 2895-2930, 3010-3020, 3340-3370)
- `frontend/src/common/Defaults.ts` (1-120)
- `frontend/src/utils/lastViewpoint.ts` (30-230)
- `frontend/src/view/viewElement/view.tsx` (330-450)
- `frontend/src/redux/selectors/selectors.ts` (529)
- `frontend/src/components/editors/views/NestedView.tsx` (75-150, 305-400, 519-550)
- `frontend/src/components/editor-v2/EditorV2.tsx` (3044-3062)
- `frontend/src/components/editor-v2/Toolbar.tsx` (193-235)
- `frontend/src/api/persistance/projects.ts` (300-347)
- `frontend/src/redux/VersionFixer.tsx` (1-165, 1056-1180)
- `frontend/src/redux/store.tsx` (104)
- `frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts` (modello del test nuovo)

---

## 2. Il fatto che cambia la forma del task: **il commit 2b-i è già in repo**

Il prompt del 23 parla di «commit 2b» al singolare e ne elenca sette file. `R-IRN-25`
(`decisions.md:996`, ratificata il 2026-08-19, cioè **dopo** il prompt del 18 e **prima** di quello
del 23) spezza però 2b in due, e il primo è committato:

```
363e121c0 refactor(viewpoint): activeViewpoint a 0..1, siti riparati (R-IRN-25)   2026-08-19 18:27
```

`git merge-base --is-ancestor 363e121c0 HEAD` → vero. Il commit tocca cinque file di codice
(`classes.ts`, `NestedView.tsx`, `selectors.ts`, `lastViewpoint.ts`, `view.tsx`) e chiude tutti i
sei siti di dereferenziazione più il vincolo di `Pack1`.

Nessuno dei due prompt lo nomina, e `docs/claude-code-log.md` **non ha una entry per quel commit**
(ricerca eseguita: `command grep -n "R-IRN-25\|0..1, siti riparati\|2b-i" docs/claude-code-log.md`
→ zero righe; controllo positivo: lo stesso file contiene 44 entry e la entry del 2a del
2026-08-19 è a riga 294). È una lacuna P9 arretrata, segnalata qui e non sanata in questo task.

**Conseguenza operativa**: quello che il prompt del 23 chiede è, di fatto, il **commit 2b-ii** come
`R-IRN-25` lo definisce — «porta a `null` il fallback del getter e **entrambi** gli inizializzatori,
e aggiunge adapter e test di `R-IRN-20`» — più `R-IRN-23` su `newDefault`, che `R-IRN-25` non
enumera ma senza cui il flip a `null` introduce un crash (vedi §3, riga `view.tsx:373-375`).
Il perimetro dichiarato dal prompt e il perimetro residuo coincidono; cambiano solo i file
effettivamente toccati, che sono **tre** invece di sette, più il test nuovo.

---

## 3. Riallineamento, riga per riga

Sette righe le riverifica il prompt del 23. Le riverifico tutte, e aggiungo i siti che 2b-i ha già
chiuso.

| Sito | Premessa del prompt del 18 | Stato misurato il 2026-08-23 | Azione in questo commit |
|---|---|---|---|
| `classes.ts:2899` | `Pointer<…,1,1> = Defaults.viewpoints[0]` → `0,1 = null` | il tipo è **già** `0,1` (2b-i); il valore è ancora `Defaults.viewpoints[0]` | **sì**, solo il valore |
| `classes.ts:2924` | idem | idem | **sì**, solo il valore |
| `classes.ts:3017` | — | già `LViewPoint \| null` (2b-i) | no |
| `classes.ts:3353` | il getter perde `\|\| Defaults.viewpoints[0]` | invariato, il fallback c'è ancora | **sì** |
| `classes.ts:3355-3361` | «verificare che il setter regga `null`» | regge: firma `Pack1<NonNullable<…>> \| null`, cast sul solo ramo `null`, commento in loco (2b-i); `Pointers.from` apre con `if (!data) return null` (`classes.ts:1671-1675`) e dichiara l'overload `from(data: null \| undefined): null` | **no**, verifica soltanto |
| `classes.ts:1181` | «prima bocca del rubinetto» | già `getProject()?.activeViewpoint?.id \|\| Defaults.viewpoints[0]` (2b-i): null-safe. Il `\|\|` residuo **non è un difetto da chiudere qui**: `R-IRN-16(b)` dichiara il rubinetto ancora aperto e accettato, e `Defaults.viewpoints[0]` risolve perché la slice 1 ha tenuto il contenitore `Default` | **no** |
| `lastViewpoint.ts:146-152` | terzo fallback di `resolveParentViewpoint` + due chiamanti | riga 146 già `LViewPoint \| null \| undefined` (2b-i). I chiamanti sono **due**, cercati per nome: `lastViewpoint.ts:215` (guardia `if (!resolved)` + toast) e `EditorV2.tsx:3049` (`disabled: !resolved`, label alternativa). Entrambi trattano già `null` | **no** |
| `view.tsx:339-340` | «seconda bocca del rubinetto», i due default di `new2` | invariati, e **non leggono `activeViewpoint`**: leggono `father.viewpoint` e `Defaults.viewpoints[0]`. Fuori dal blast radius del flip | **no** |
| `view.tsx:373-375` | `newDefault` riscritto per il caso vuoto | riga 373 già `LViewPoint \| null \| undefined` (2b-i), ma il **ramo `else` è invariato** e risolve `Defaults.Pointer_ViewModel`, che dopo il ritiro del seed non esiste in un progetto nuovo → `fromPointer` restituisce `undefined` senza loggare (`canThrow` false) → TypeError su `parentView.subViews` a `view.tsx:377`. Finché il getter fa fallback il ramo non è raggiungibile; **il flip a `null` lo rende raggiungibile** | **sì** (`R-IRN-23`) |
| `selectors.ts:529` | `project.activeViewpoint.id` senza `?.` | già `project.activeViewpoint?.id` con tipo `\| undefined` (2b-i). Il prompt del 23 lo dichiara e la misura conferma | **no** |
| `NestedView.tsx:82` | dereferenziazione da riparare | già `Pointer<DPointerTargetable> \| undefined = project.activeViewpoint?.id` (2b-i) | **no** |
| `NestedView.tsx:544` (oggi 546) | `ret.active = ret.project.activeViewpoint` | `StateProps.active` già `LViewPoint \| null` con `TODO: cleanup` (2b-i) | **no** |
| `NestedView.tsx:110-111, 314-315` | «legge e scrive» | invariati. Sono i due scrittori di `R-LAY-10`, §4 | **no**, referto soltanto |
| `projects.ts:338` | «agire secondo §5.4, che non dice quello che la riga sembra dire» | invariata. `R-IRN-26` decide: il campo top-level **non si tocca**, `Offline.getAll` neppure. Dopo il flip l'inizializzatore è `null`, quindi lo scarto in rilettura produce già il valore voluto | **no**, per ratifica |

**Nessuna premessa smentita.** Il prompt del 23 dice «quattro tengono, una è cambiata»; la misura
completa dice che **quattro delle righe che il prompt del 18 dava da toccare sono già chiuse da
2b-i** oltre alla riga di `selectors.ts` che il prompt del 23 già segnala, e che due
(`classes.ts:1181`, `view.tsx:339-340`) sono descritte come «bocche del rubinetto» ma non richiedono
intervento in questa passata.

### 3.1 Il diff che ne risulta

Tre file di codice più un test nuovo:

1. `frontend/src/joiner/classes.ts` — i due inizializzatori a `null`; il getter perde il fallback.
2. `frontend/src/view/viewElement/view.tsx` — `newDefault` cade sul viewpoint `Default` e non più
   sulla view `Model` (`R-IRN-23`).
3. `frontend/src/redux/VersionFixer.tsx` — adapter `['2.227 -> 2.228']`.
4. `frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts` — file nuovo (`R-IRN-20`).

**Layer Impact Report**: non riprodotto. Esiste ed è
`docs/discovery/discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.3, riletto prima del diff. Il
prompt del 18 vieta esplicitamente di rifarlo.

### 3.2 Due errori di tipo emersi scrivendo, e come sono chiusi

Il primo tentativo del getter, `LViewPoint.fromPointer(context.data.activeViewpoint) as any as
this['activeViewpoint']`, ha prodotto **un errore nuovo**, `classes.ts(3358,39) TS2345`: il
parametro di `fromPointer` non ammette `null`. Chiuso con il cast **sull'argomento**
(`context.data.activeViewpoint as any`), non con una guardia: a runtime
`LPointerTargetable.wrap` apre con `if (!data || (data as any).__isProxy) return data as any`
(`classes.ts:258-259`), quindi `null` entra e `null` esce. Tipo e runtime dissentono sul nome del
vuoto, non sulla sua verità — §5.1 della Fase 1 lo aveva già misurato.

Il secondo è nel test: `version?: { n: number }` non ammetteva `date` e `conversionList`
(`TS2353`). Allargata la sola interfaccia locale del test.

---

## 4. L'accertamento di `R-LAY-10`

### 4.1 Quanti scrittori esistono (domanda 1)

Ricerche eseguite su `frontend/src`, con `command grep` (BSD grep, non il wrapper `ugrep` della
shell interattiva, che ignora `--include`), `examples/` escluso a valle, e **controllo positivo
nella stessa invocazione**.

| Ricerca | Comando | Risultato |
|---|---|---|
| Assegnazioni a `.activeViewpoint` | `command grep -rnI --include="*.ts" --include="*.tsx" -E "\.activeViewpoint[[:space:]]*=[^=]" .` | 3 righe: `NestedView.tsx:111`, `NestedView.tsx:315`, `projects.ts:338` |
| `SetFieldAction` sul campo | `command grep -rnI … -E "SetFieldAction[^;]*activeViewpoint" .` | 2 righe: `classes.ts:3361` (dentro `set_activeViewpoint`), `lastViewpoint.ts:60` (dentro `activateViewpoint`) |
| Chiamanti di `set_activeViewpoint` | `command grep -rnI … "set_activeViewpoint" .` | 1 riga, la dichiarazione. Il setter si raggiunge solo per assegnazione via proxy |
| `SetRootFieldAction` su `'viewpoint'` | `command grep -rnI … -E "SetRootFieldAction[^;]*'viewpoint'" .` | **1 riga**: `lastViewpoint.ts:69` |
| **Controllo positivo** (assegnazioni) | stesso `-E` su `\.lastModified[[:space:]]*=[^=]` | 4+ righe in `api/DTO/` e `api/persistance/` — il pattern ha segnale |
| **Controllo positivo** (root) | `command grep -rnIc "SetRootFieldAction" .` | 10+ file con conteggio non nullo (`App.tsx`, `classes.ts` ×7, `proxy.ts` ×2, …) — il pattern ha segnale |

**Esito.** Il campo persistito `DProject.activeViewpoint` ha **due meccanismi** di scrittura:
`activateViewpoint` (`SetFieldAction` diretta, fuori da `TRANSACTION` per scelta documentata a
`lastViewpoint.ts:42-45`) e il setter L, raggiunto da **due** siti,
`NestedView.tsx:111` e `:315`. La root `state.viewpoint` ha **un solo** scrittore in tutto
`frontend/src`, `activateViewpoint` (`lastViewpoint.ts:69`).
`projects.ts:338` scrive un campo di DTO e non lo stato: `GetAllProjects.ts` non dichiara
`activeViewpoint` e `DProject.new2` non lo legge (`R-IRN-26`, Fase 1 §5.4). Non è uno scrittore
dello stato.

Il terzo livello, `lastEditedViewpointId` (`lastViewpoint.ts:15`), è una variabile di modulo non
persistita, letta da `resolveParentViewpoint` e `hasWorkbenchVP`: non è una sorgente
dell'attivazione (§B.5 del report del 22, confermato).

### 4.2 La divergenza è possibile, e per quale percorso utente (domanda 2)

**Sì, ed è già viva oggi**: non la introduce questo commit.

`NestedView.tsx:111` e `:315` eseguono `project.activeViewpoint = ptr as any`, che passa dal setter
L e scrive **solo** il campo del progetto. `state.viewpoint` resta al valore precedente perché il
suo unico scrittore, `activateViewpoint`, non viene invocato.

I comandi che ci arrivano sono **tre**, tutti nel pannello classico «Viewpoints» (host
`NestedView`, `TabDataMaker.tsx:7,37`; aperto sullo schermo di Alfonso, confermato il 2026-08-19 in
`R-IRN-25`). Ricerca eseguita: `command grep -n 'type="radio"\|select(d.id)\|isVP &&
d.isExclusiveView' components/editors/views/NestedView.tsx` → sette righe, elencate qui per intero.

- **radio «viewpoint esclusivo»** nell'header del box, `NestedView.tsx:147-150`
  (`<input type="radio" name="active-viewpoint" … onChange={() => select(d.id)}>`) → il `select`
  di riga 109, che scrive a **111**;
- **doppio click sulla riga**, `NestedView.tsx:341`
  (`onDoubleClick={(e) => {select(d.id)}}`, commento in loco «activate anche con il dblclick»);
- **toggle «Click to activate»**, `NestedView.tsx:364-381` (`onClick` a 372, `onKeyDown` a 380),
  gated su `isVP && d.isExclusiveView`.

Gli ultimi due passano dal `select` di riga 313, che scrive a **315**. Il prompt e `R-LAY-10`
nominano due righe di scrittura, ed è esatto; i **gesti** che le raggiungono sono tre, e il doppio
click non era censito da nessuno dei documenti letti.

Effetto: dopo uno di questi due gesti il **renderer classico** (che legge `activevpid` da
`project.activeViewpoint`, `selectors.ts:529,556`) vede il nuovo viewpoint, mentre **editor-v2 e
l'IR** (che leggono la root, `irResolveCore.ts:117,139`) e il **selettore della toolbar**
(`Toolbar.tsx:202`) restano sul precedente. Il selettore della toolbar, che è l'altra superficie di
attivazione, chiama invece `activateViewpoint` e tiene le due allineate.

**Non verificato a runtime.** È una lettura di codice: due percorsi tracciati fino al gesto UI, con
gli scrittori enumerati e i lettori enumerati, ma nessuna esecuzione. Resta quindi al livello di
evidenza che `R-LAY-10` chiedeva di alzare — «tracciato a codice e non verificato a runtime» — e lo
alza solo di quanto una lettura può: dice **dove** guardare e **quale gesto** riprodurre, non che sia
riprodotto. La verifica di Alfonso può chiuderlo in trenta secondi: attivare un viewpoint dal
pannello classico, poi leggere `windoww.store.getState().viewpoint` e
`windoww.store.getState().idlookup[<progetto>].activeViewpoint` nella stessa esecuzione.

### 4.3 Dopo questo commit (domanda 3)

**La divergenza resta possibile.** Non è chiusa per costruzione e richiede un intervento che questo
commit **non fa**.

Il flip a `null` non tocca il numero degli scrittori: cambia solo il valore che sopravvive quando
non ne ha scritto nessuno. Anzi, il flip rende la divergenza **più osservabile**, perché prima
`get_activeViewpoint` copriva ogni vuoto con `Pointer_ViewPointDefault` e le due variabili
sembravano concordi anche quando non lo erano.

**Il rimedio è a due righe più un import, e sta dentro un file già dichiarato nella tabella del
prompt.** Sostituire `project.activeViewpoint = ptr as any` con `activateViewpoint(ptr)` nei due
`select` di `NestedView.tsx` renderebbe `activateViewpoint` l'unico scrittore di entrambe, che è
esattamente la «sola sorgente» che `R-LAY-10` pone come condizione di sblocco del fronte layout.
Il prompt prescrive di **fermarsi e chiedere** in questo caso: fermato, e chiesto — vedi §6.

Da valutare prima di scriverlo, e non risolto qui: `activateViewpoint` scrive con `SetFieldAction`
diretta invece che dal setter L, «to avoid async TRANSACTION batching issues that caused the
SetRootFieldAction to interfere with the project.activeViewpoint update»
(`lastViewpoint.ts:42-45`, verbatim). Instradare `NestedView` su quella funzione cambia quindi anche
il **meccanismo** di scrittura di quei due gesti, non solo il numero di campi scritti. Va verificato
a schermo, non per lettura.

---

## 5. Gate misurati

Tutti su output completo, exit status registrato.

| Gate | Baseline | Misurato | Esito |
|---|---|---|---|
| `npx tsc --noEmit` | exit 2, **33** errori, `sha256 e8f17cee…21e` | exit 2, **33** errori, `sha256 e8f17cee…21e` | **identico byte a byte** (`diff` vuoto) |
| `npm run build` | exit 0 | exit 0, solo il warning di chunk-size | identico |
| `npm run test` | 1315 passati, 9 suite rosse su 59 | **1323** passati, 9 rosse su **60** | +8 test e +1 file: sono i nuovi. Le 9 rosse sono le note (`window is not defined` in raccolta) |
| test nuovo isolato | — | 8/8 passati, 115ms | pass |
| `npm run smoke` | 10 passati, 0 falliti, 2 skip (misura del 2026-08-19) | **12** passati, **0** falliti, **3** skip | lo scarto è di `5ac2449e6` («A5 guards the chrome stack»), landato dopo 2b-i; non di questo diff |
| `npm run check:docs` | 3/3 | 3/3 | pass |
| `npm run check:agents` | pass | pass | pass |

**Quello che i gate non coprono, dichiarato invece che dato per coperto.** I tre stati di
`frontend/scripts/smoke/states.ts` creano un progetto ex novo da `createProject`: **nessuno apre un
progetto salvato**, quindi lo smoke non passa mai da `SaveManager.load` e non esercita né
`VersionFixer.update`, né gli adapter, né la normalizzazione degli stati persistiti. È esattamente
il perimetro dell'adapter di questo commit. La sola verifica automatica del fronte è il test vitest
nuovo, che gira sulla **copia** del corpo (`R-IRN-20`), non sul codice spedito.

Anche il flip del getter è fuori dalla copertura: il typecheck ne certifica i tipi, non il
comportamento, e nessuno smoke apre il selettore su un progetto vecchio.

---

## 6. Domande aperte per Alfonso

1. **`R-LAY-10`, il rimedio.** Instrado i due `select` di `NestedView.tsx` su `activateViewpoint`
   (due righe più un import), chiudendo la divergenza e con essa la condizione di sblocco del fronte
   layout? Va in un commit suo, non in questo, e ha bisogno della verifica a schermo descritta in
   §4.3 — il cambio di meccanismo di scrittura è la parte che una lettura non copre.
2. **La entry di log mancante del commit `363e121c0`** (2b-i). La scrivo in arretrato quando si
   ruota il log, o resta la lacuna dichiarata qui?
3. **Il difetto preesistente di persistenza** che il prompt cita come
   `discovery_2026-08-19_slice2_activeviewpoint.md` — quel path **non esiste** in repo. Il documento
   che porta la misura è `discovery_2026-08-19_2228_2b_perimetro_activeviewpoint.md` §4, e la
   discrepanza store/blob vi è registrata come aperta e fuori perimetro (`R-IRN-26`, ultima frase).
   Confermi che è quello, così il prompt del 23 si corregge alla fonte?
4. **`classes.ts:1181` e `view.tsx:339-340`** restano con `|| Defaults.viewpoints[0]`: una view
   creata senza viewpoint attivo continua a nascere dentro il `Default` seminato. È il rubinetto che
   `R-IRN-16(b)` dichiara aperto e accettato. Confermi che resta fuori da `2.228`?

---

## 7. Verifica funzionale, per Alfonso

Elencata qui come chiede il prompt. Nessuna di queste è coperta da un gate.

1. Un progetto con un **viewpoint di sistema** salvato come attivo si apre con il selettore su
   «Abstract syntax» e senza `--active`.
2. Un progetto con un **viewpoint utente** attivo si apre invariato.
3. Creare una view dal «+» del tree e dal menu contestuale del canvas, **con e senza** viewpoint
   attivo: nessun TypeError, e la view nasce nel padre atteso. È il test di `R-IRN-23`: senza la
   riscrittura di `newDefault` il caso «senza viewpoint attivo» cadrebbe su `Pointer_ViewModel`,
   che non esiste più.
4. Riaprire due volte: `conversionList` cresce **una volta sola**, `version.n` resta `2.228`.
5. Il selettore si comporta come dopo il 2a, metamodelli compresi: nessun `<select>` vuoto, nessun
   warning React di controllo non controllato.
6. **Difetto preesistente da non scambiare per una regressione**: `DProject.activeViewpoint` non
   viene persistito correttamente sul percorso misurato il 2026-08-19. Citato, non riparato qui.
   Riferimento: `discovery_2026-08-19_2228_2b_perimetro_activeviewpoint.md` §4 e `R-IRN-26`.

---

## 8. Stato

Commit 2b-ii scritto, gate tutti verdi e typecheck identico byte a byte alla baseline.
**HARD STOP** prima della verifica visiva di Alfonso e prima del commit 2c
(`NestedView.tsx:396`, `R-IRN-22`/`R-IRN-24`), che non è stato anticipato.
Il rimedio di `R-LAY-10` è **accertato e non scritto**, in attesa della risposta alla domanda 1.

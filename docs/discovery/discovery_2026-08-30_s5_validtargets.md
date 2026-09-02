# S5 — `validTargets` nel contratto, e la sequenza WriteCtx che si chiude

2026-08-30. Ultima slice della sequenza aperta dal referto `b9ca883fc`
(`discovery_2026-08-30_writectx_migrazione_motore.md`), dopo S1a/S1b, S2, S3, S4.
Ratifica: **R-WCX-5**. Referto senza indice, per la regola della serie.

---

## 1. La decisione chiesta dal prompt: WriteCtx o un ReadCtx affiancato

Il prompt chiedeva di decidere **misurando** e di dichiarare il perche'. La misura non e'
un conteggio di chiamanti — oggi il chiamante e' uno solo — ma una domanda su cosa la
primitiva ENUMERA.

`validTargets(id, key)` non enumera il modello. Enumera gli **argomenti leciti** di
`setValue`/`appendValue` su quel `(id, chiave)`: il suo dominio e' l'argomento di una
scrittura, e il suo criterio di correttezza e' il **rifiuto dello stesso host**. Su questo
la misura c'e', ed e' quella di S2: `setValueAtPosition` rifiuta il ciclo di contenimento
con `{success:false, reason:"cannot create a containment loop"}` (`LModelElement.tsx:7656`),
e `get_validTargets` toglie dal picker esattamente quei candidati. Sono i due lati di una
sola regola. Un adapter che implementasse `WriteCtx` senza `validTargets` offrirebbe
precisamente i bersagli che lo stesso ctx poi rifiuta; metterla su un contesto separato
rende quella divergenza **esprimibile** — un host puo' implementare l'una e non l'altra e
avere due firme verdi.

Contro: «le opzioni sono lettura». Vero, e il tipo lo dice — non c'e' `WriteResult`, non
c'e' verdetto, l'offerta e' TOTALE e `[]` e' una risposta. Ma la lettura di stato
dell'istanza ha gia' il suo posto (`ReadCtx`, `irReadCtx.ts`), e questa non e' quella:
`ReadCtx` risponde «cosa TIENE questo elemento», `validTargets` risponde «cosa potrebbe
tenere, secondo chi lo scrive». Aggiungere a `jjform/` un secondo contesto per un metodo
solo avrebbe obbligato a passare i due sempre in coppia, che e' il modo strutturale di
lasciarli divergere.

**Deciso: su `WriteCtx`.** R-WCX-5.

## 2. La forma: piatta, con `group?`

Il prompt dava la firma come `{id, label}[]`. Il core pero' risponde raggruppato
(`get_validTargetOptions`, `LModelElement.tsx:7871`: `Free Objects`, `Bound Objects`,
`Literals of <enum>`), e il picker **rende** quelle intestazioni come testo secondario
quando i gruppi sono piu' d'uno (`ReferencePicker.tsx:146`).

Buttarle avrebbe cambiato la resa; portarle come struttura annidata avrebbe messo nel
contratto una decisione di rendering. La forma adottata e' la terza:
`TargetOption { id, label, group? }` — **piatta**, come chiedeva il prompt, con
un'etichetta opzionale. Un host senza raggruppamento ritorna una lista piana e non perde
niente; chi rende raggruppa (`useFormWidgets.groupTargets`, ordine di prima apparizione,
che e' l'ordine del core: free prima di bound).

## 3. Cosa e' stato misurato, e cosa dicono le misure

### 3.1 Il contratto risponde quello che rispondeva il proxy

Sonda `_tmp_s5_verify.ts`, sorgente vivo via Vite, nessun mock, **13/13 ALL GREEN, zero
errori di pagina**.

- A.1 controllo positivo: il vecchio percorso (`slot.validTargetOptions`) offre 2 candidati
  su `cfg` di `allNine_valued` — un'offerta vuota avrebbe reso verde qualunque confronto.
- A.2 attraverso il contratto: **stessi id, stesso ordine**.
- A.3 le intestazioni sopravvivono all'appiattimento (`Free     Objects`, spazi del core
  inclusi, verbatim).

### 3.2 R-FORM-13 e' ancora dentro, ed e' ancora per-istanza — per contrasto

Costruito sul vivo, non ricordato: due reference dello **stesso tipo** su `AllNine`,
`kids` containment e `mate` no; un figlio vero creato dentro `allNine_valued` attraverso lo
slot di containment, con il padre **asserito** (`father` = il `DValue`, non il `DModel` —
la trappola documentata in `README-probes.md`, «assert the setup, do not wait for it»).

| offerta a un figlio di `allNine_valued` | candidati | il contenitore c'e'? |
|---|---|---|
| `kids` (containment) | **2** | **no** — sarebbe un ciclo |
| `mate` (stesso tipo, non containment) | **4** | **si'** — non puo' chiudere niente |

Il ramo negativo non e' un vuoto: nella stessa corsa l'istanza estranea (`allNine_noref`) e'
offerta da `kids`. Un filtro che rifiutasse tutto sarebbe uscito verde sul solo criterio
principale.

### 3.3 Totalita'

`C.1..C.4`: feature inesistente `[]`, oggetto che non risolve `[]`, attributo semplice `[]`,
attributo **enum** -> i suoi letterali (`SOLID`, `DASHED`, `DOTTED`). L'ultimo e' il secondo
consumatore della stessa primitiva: la select di un enum e il picker di una reference
chiedono la stessa cosa allo stesso metodo, come gia' facevano attraverso il proxy.

### 3.4 Il caso stantio, esteso alle OPZIONI — e il reperto

Sonda `_tmp_s5_probe.ts`: solo DOM e store, **nessun import di quello che S5 aggiunge**,
cosi' lo stesso file gira sull'albero PRIMA e DOPO ed e' comparabile. Un contesto browser
per superficie (con manager e rail vivi insieme `.ir-field` conta 28 e `.ir-ref` pesca il
controllo del tab nascosto: si misurerebbero due form riportandone una).

Il gesto: form aperta su `allNine_valued`, si legge l'offerta di `cfg`; poi **da un'altra
via** nasce un altro `Config` — nessuna scrittura sul soggetto, quindi la firma di
`useIRFormView` (`[irSig, objectId, instanceof, name, valori dei propri slot]`) non lo vede;
poi si riapre il picker.

| albero | manager | rail |
|--------|---------|------|
| pre-S5 | `[Config_main, Config_old, Config_manager]` — **gia' fresco** | `[Config_main]` — **stantio** |
| post-S5 | fresco | fresco |

**Il reperto**: il difetto era di **una superficie su due**, non di entrambe. Il manager
ri-renderizza per conto suo quando il modello acquista un'istanza, quindi ricalcolava le
opzioni; il rail no. L'ipotesi «le opzioni sono uno snapshot» era giusta, ma la sua
manifestazione dipendeva dall'host che monta la form — cioe' dalla superficie. Cio' che S5
toglie non e' soltanto lo snapshot: e' la **dipendenza dalla superficie**. Dopo, le due
rispondono allo stesso modo perche' chiedono al momento in cui aprono, non a quello in cui
qualcun altro ha deciso di ri-renderizzare.

Corsa post-S5: **16/16 ALL GREEN**, zero errori di pagina, su entrambe le superfici.

### 3.5 Portabilita': l'host finto che soddisfa l'obbligo

`jjform/__tests__/writeCtx.test.ts` (S4) portava un `WriteCtx` su un `Record` JSON. S5 gli
aggiunge `validTargets` — e non una finta qualunque: il fake host tiene un `owner` per
istanza e **sottrae la propria catena di antenati** quando la feature contiene. Sono quaranta
righe di oggetti semplici, e sono la dimostrazione che l'obbligo di R-FORM-13 e'
soddisfacibile da qualcosa che non e' il layer L. Il motore (`targetOptions`) consuma
quell'offerta senza sapere niente di come e' filtrata. 5 casi nuovi, 12/12 nel file.

## 4. `field.slot`: censimento, poi rimozione

S3 aveva lasciato `slot` nel descriptor «perche' lo legge `describeSlot`». Misurato oggi,
`command grep` su tutto `frontend/src`: il campo `FormFieldDescriptor.slot` ha **zero
lettori**. Le uniche occorrenze sono il produttore che lo scrive e due commenti
(`IRFormField.tsx:23,151`, `IRForm.tsx:348`). Controllo positivo sulle stesse ricerche:
`slot` compare 30 volte in `useFormWidgets.test.ts` (i costruttori di fixture) e `.slot`
esiste in `instanceTable`, `valueRenderer`, `ObjectNode` — su altri tipi. Il silenzio e'
quindi un negativo vero.

Cio' che lo leggeva davvero era `readOptions(slot)`, e S5 lo ha sostituito. Quindi il
**campo** e' rimosso; il **parametro** di `describeSlot` resta, perche' nome, bounds e
valori continuano a venire da li'.

## 5. Cosa NON e' entrato

- **`SelectWidget` non prende il thunk.** I letterali di un enum dipendono dal metamodello,
  non dalla gerarchia dell'istanza, e una modifica al metamodello muove `irSig`, che e'
  nella firma: la form ri-renderizza. Dare anche a lui una lettura all'apertura sarebbe
  stato codice senza un modo di guasto.
- **`ListWidget` tiene DUE letture, e non e' una svista.** `options` al render decide lo
  stato del bottone Add («No candidates left» deve essere giusto PRIMA del gesto);
  `getOptions` decide la lista quando il popover si apre. Una sorgente, due momenti.
- **Il filtro non e' stato spostato nel motore.** Sarebbe stato barattare una garanzia
  verificata con una nostra (R-FORM-13). Il contratto lo NOMINA e basta.

## 6. Cancelli

`npm run typecheck` **33 = baseline** su output completo, nessuna delle 33 righe nomina un
file toccato (controllo positivo: `Dashboard` compare, quindi la ricerca leggeva davvero).
`npm run build` exit **0**, solo il chunk-warning. `npx vitest run` **2140 passed / 0
failed** coi 9 file rotti all'import = baseline nota; +7 sono i casi nuovi (5 in
`writeCtx.test.ts`, 2 in `useFormWidgets.test.ts`), il resto della differenza rispetto ai
2112 di S4 e' della sessione parallela, atterrata nel frattempo. `npm run smoke`
**12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per stato.

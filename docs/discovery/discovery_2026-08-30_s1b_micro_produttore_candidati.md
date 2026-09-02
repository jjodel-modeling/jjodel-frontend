# Discovery 2026-08-30 — Micro S1b: il produttore nomina i candidati

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`. Misure prese a HEAD `9130cac3c`, con la sessione
parallela che tiene modificati `viewpoint/ir/{IRForm.tsx,IRFormField.tsx,formWrite.ts}` —
**zero file condivisi** con questa slice.
**Prompt**: «Micro: `buildEvalContext` produce i candidati», dato in chat, non depositato in
`docs/prompts/`. Perimetro dichiarato: `jjscript/executor/commands/eval.ts:329-344`.

**Cosa chiude**: il residuo dichiarato da `480934fea` (§reperto) e dal referto
`discovery_2026-08-30_s1b_micro_candidati_jjel.md` §1 e §4 — `candidates` esisteva su
mappa, variante del warning e copy, ma **nessun produttore lo scriveva**, quindi il ramo con
la lista non era raggiungibile a schermo. Ora lo e', ed e' misurato dal gesto.

**Strumento**: `command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep --ignore-files`.

---

## 1. Il diff: due modifiche, non una

**(a) Il raggruppamento passa dagli handle agli INDICI del pool.** Nominare un candidato
richiede il proxy L (`rawM1Objects[j]`) — l'handle piatto non porta ne' `father` ne' `__raw`,
e il suo `instanceOf` e' `null` quando la classe non sta in `classByName`. I due array sono
allineati per costruzione (`allInstancesJjel = rawM1Objects.map(...)`, `eval.ts:147`), quindi
l'indice e' l'unica cosa che serve. `sampleClass` continua a leggersi dall'handle: la copy
della forma qualificata non cambia di un byte.

**(b) Un walker di containment**, `buildContainmentPath`, accanto a `resolveParentHandle`, di
cui riusa la catena grezza a 2 salti gia' verificata: `DObject.__raw.father` -> DValue (slot
di containment) -> `DValue.father` -> owner DObject; quando il father NON e' un DValue si e'
arrivati al DModel, e il suo nome apre il path. I nomi degli owner si leggono dal proxy L, non
dal D: dopo §3.12 il nome visualizzato puo' vivere nello slot d'identita', e il path deve
leggersi come si legge a schermo.

Tre cautele, tutte con una ragione misurabile e non stilistica:

- **il leaf e' `nm`, la chiave del raggruppamento, non `raw.name`** — una feature d'utente puo'
  ombreggiare `name` sull'handle (`fillInstanceSlots`), e il path deve finire col nome che il
  lettore ha digitato;
- **niente troncamento nel produttore** — il taglio a 5 vive in `formatAmbiguousCandidates`, e
  `count` resta l'autorita' su quanti sono (puo' superare `candidates.length`: un candidato
  senza id viene saltato);
- **`candidates` assente, non vuoto**, quando non c'e' nulla da nominare: la distinzione su cui
  poggia la copy («nessun nome disponibile» vs «nominato nessuno»).

Costo: il walk gira **solo sui nomi ambigui**, mai sul pool intero.

## 2. La fixture non ha oggetti annidati — misurato, non ricordato

`_tmp_s1bmicro_recon.ts` su `rowviews`: **7 DObject, tutti e sette con `father` = DModel**
(`smoke_model`). Nessuno annidato. Con sole radici ogni path esce `smoke_model/<nome>` e il
salto sull'owner **non verrebbe mai esercitato**: la sonda proverebbe meta' del walker
credendo di provarlo tutto.

Da qui la fabbrica: la sonda rende `cfg` una composizione e crea un oggetto dentro
`allNine_valued`. Verificato che l'annidato entra davvero nel pool JjEL — `allSubObjects` del
modello M1 lo elenca (`_tmp_s1bmicro_recon2.ts`).

Reperto collaterale, gia' noto e riconfermato: solo `Config` ha l'attributo `name`, quindi solo
i suoi oggetti hanno lo slot d'identita'. La sonda rinomina **per via doppia** — `$name.value`
dove lo slot c'e', `SetFieldAction` diretta su `'name'` dove non c'e' — e nessuna delle due
passa da `set_name`, che dopo S1a rifiuterebbe il duplicato. E' il duplicato **preesistente**
che questa feature esiste per descrivere.

## 3. Il reperto che ha cambiato la sonda: l'annidamento apparente

Scrivere `composition = true` e chiamare `slot.addObject(...)` **nello stesso `evaluate`**
produce un oggetto **radice**, non annidato: `get_addObject` legge `composition` per decidere
se il father e' lo slot o il modello (`LModelElement.tsx:7056`), e a zero ms dalla scrittura
legge ancora `false` — la latenza di propagazione di CLAUDE.md §9.2.

Misurato in tre passaggi, non dedotto:

| dove | father dell'oggetto creato |
|------|----------------------------|
| `recon2`, due `evaluate` separati con attesa | **DValue**, owner `allNine_valued` |
| `recon3`, un solo `evaluate` | **DModel** |
| sonda, prima versione (un solo `evaluate`) | path `smoke_model/Dup_x`, due segmenti — il FAIL |

La prima corsa della sonda e' uscita **1 FAILURE su 19**, e il fallimento era della sonda, non
del produttore. La correzione non e' stata «aspettare di piu'» e basta: e' stata **asserire il
father**, cosi' che un annidamento apparente fallisca invece di passare in silenzio. Un
controllo che non c'era e' il vero esito di questo reperto.

## 4. Cosa la sonda prova adesso — e cosa no

`_tmp_s1b_jjel_candidates.ts`, **19/19 ALL GREEN, zero errori di pagina**, dal gesto (console
Jjodie in modo Code, sul sorgente vivo servito da Vite):

- **fase A, due omonimi con path DIVERSI**: `Ambiguous instance name Dup_x (2 matches):
  smoke_model/Dup_x (AllNine), smoke_model/allNine_valued/Dup_x (Config). Use the qualified
  form AllNine.Dup_x.` — tre segmenti sul secondo: il salto sull'owner ha funzionato;
- **fase B, il sesto omonimo**: `(6 matches)`, cinque path nominati e `and 1 more`. Il taglio
  del formatter si vede a schermo per la prima volta;
- **due controlli negativi**: un identificatore ignoto stampa la sua riga **senza** lista ne'
  conteggio; un nome **unico** (`Config_main`) non produce alcun warning;
- **due controlli positivi**: il canvas montato, e il blocco `warnings.map` che stampa ancora
  (senza, «nessuna lista» sarebbe vero anche a render morto).

Limiti, dichiarati e non aggirati:

- **gli omonimi stanno in UN modello.** Il pool e' cross-modello per costruzione e il caso a due
  modelli e' coperto dal test unitario (`ambiguous-instance.test.ts`), non dalla sonda:
  fabbricare un secondo M1 a runtime costa piu' di cio' che proverebbe. Il ramo acceso e' lo
  stesso — il walker si ferma al DModel in entrambi i casi, e il nome del modello e' il primo
  segmento.
- **il path e' copy, non un'espressione.** `smoke_model/allNine_valued/Dup_x` non e' incollabile
  nella console: la forma qualificata suggerita resta `Class.Name`. Nessuna slice lo promette.
- **`Class.Name` ambiguo resta fuori.** Il punto 4 del perimetro di S1b Fase 1 non e' toccato
  qui, come non lo era prima.

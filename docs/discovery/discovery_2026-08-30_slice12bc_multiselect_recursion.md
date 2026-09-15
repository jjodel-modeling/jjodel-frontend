# Slice 12b/12c — multi-selezione e ricorsione inline, misurate

**Data**: 2026-08-30
**Prompt**: `docs/prompts/PROMPT_12bc_multiselect_recursion.md`
**Corsia**: motore `jjform/` + adapter + manager. Nessun file della critical zone.
**Sonde** (non committate): `_tmp_12bc_measure.ts`, `_tmp_12bc_q1.ts`, `_tmp_12bc_verify.ts`.

---

## 0. Tre scarti fra il prompt e il repo, misurati prima di scrivere

### 0.1 Il file autoritativo citato non contiene la specifica

Il prompt indica `CRUD Manager Simulation.dc.html` come referenza per i Turni 12b e
12c. **Misurato**: quel file porta `mixed` **0**, `multi` **0**, `breadcrumb` **0**,
`drill` **0**, `12b` **0**, `12c` **0**. **Controllo positivo sullo stesso file e con
lo stesso comando**: `openModal` **6**, `META` **9** — la ricerca ha segnale, e
l'assenza e' un'assenza.

La specifica sta in **`Instance Node Proposal.dc.html`**, Turno 12 (`mixed` 2,
`breadcrumb` 2, `drill` 8). E' quella usata, ed e' citata per esteso nelle intestazioni
di `jjform/multi.ts` e `jjform/nav.ts` invece che parafrasata.

### 0.2 Il design nasconde anche i children, non solo l'identita'

Il prompt chiede l'esclusione della sola identita'. Il design dice, testualmente:
«Name and children are hidden: identity is never bulk-edited» e «Nome e containment
spariscono». Chiede inoltre due cose che il prompt non nomina: il **terzo stato del
toggle** («Active — 2 on · 1 off») e il Mixed che **elenca i valori distinti**
(«Mixed (Green, Red, Blue)»). Implementate tutte e tre.

### 0.3 `R-2C-3` non esiste

Il prompt cita «R-2C-3» come la ratifica del filtro containment-loop. **Misurato**:
zero occorrenze in `docs/decisions.md` — controllo positivo, `R-FORM-9` trovato 2 volte
nello stesso file con lo stesso comando. L'unica occorrenza nel repo e' dentro il prompt
stesso. Il **contenuto** pero' esiste, in `form-engine-contract.md` §6 «Chiuso dalla
2c», ed e' quello verificato: il filtro sta in `createDraw.candidatesFor`
(`isContainment` + `excludeIds` = `containmentChain(owner)`).

---

## 1. Il filtro containment-loop era GIA' vivo, e non l'ho spostato

Il prompt dice «qui il filtro containment-loop diventa vivo» e chiede il test per
contrasto «su percorso raggiungibile». La misura ha risposto prima del diff.

Il picker che `IRForm` monta legge `slot.validTargetOptions`
(`useFormWidgets.readOptions:146`) → `get_validTargetOptions` → `get_validTargets`, che
per un `LValue` e' l'override di `LModelElement.tsx:7871`, dove il core **ha gia'** il
filtro.

**La prima misura non aveva segnale, ed e' un reperto di metodo.** Chiedeva se il picker
dello slot `cfg` offrisse il proprio contenitore: non lo offriva, ma `cfg` e' tipizzata
`Config` e un `AllNine` non e' un `Config` — il contenitore era escluso **dal tipo**, non
dal filtro. Un controllo che non distingue le due cause non e' un controllo.

Rifatta con una reference **auto-referenziale** (`kids : AllNine`, composition), cosi'
ogni `AllNine` e' candidato legittimo per tipo (`_tmp_12bc_q1.ts`):

| lettura | opzioni | offre il contenitore? |
|---|---|---|
| A — prima della catena (controllo positivo) | 2 (`broken`, `noref`) | — |
| B — dopo aver messo `valued` dentro `broken` | **1** (`noref`) | **no** |
| C — contrasto su `cfg`, stesso tipo, NON containment | 3 | **si'** |

Zero errori di pagina. **Verdetto: il core filtra, sul percorso di edit.**

**Conseguenza sul diff: non ho deviato il picker sull'adapter.** Sostituire una garanzia
del core, verificata, con una nostra e' esattamente cio' che la Regola 3 vieta, e non
comprerebbe niente. `candidatesFor` resta dov'e', al servizio della create;
il test per contrasto della slice e' su percorso vivo ed e' nella sonda di accettazione,
dove misura il comportamento che l'utente incontra davvero.

## 2. Le scritture bulk NON vanno differite, ed e' misurato

R-FORM-11 differisce le delete di 12d di `U.UpdatingTimer * 2` perche', emesse in un
tick, scrittura e delete atterrano nell'ordine sbagliato e un valore si perde. Il timore
ovvio era che una scrittura **bulk** — N istanze, una chiave, un tick — perdesse valori
allo stesso modo.

**Misurato** (`_tmp_12bc_measure.ts`): tre `setValueAtPosition` sulla stessa feature di
tre istanze diverse, emesse in un solo tick, **0 perse su 3**; le stesse tre dilazionate
di `U.UpdatingTimer`, **0 perse su 3**. Identiche.

I due casi differiscono in natura, ed e' perche' la misura viene cosi': il pericolo di
12d sono **due operazioni su UNO slot** (una scrittura posizionale, poi una cascata che
rimuove per valore dallo stesso array), mentre un bulk sono N operazioni su N slot
**distinti**, che non si toccano gli array a vicenda. Nessuna dilazione aggiunta: un
ritardo che nessuno ha misurato e' un ritardo che nessuno potra' piu' togliere.

---

## 3. Cosa e' stato scritto

### Motore (`jjform/`, zero import — l'invariante di R-FORM-4 regge)

- **`multi.ts`** — `multiModel` (campi comuni, `mixed` coi valori **distinti**, tri-state
  booleano coi conteggi, esclusione identita'/children/read-only **con motivo**),
  `bulkPlan` (eventi per i soli campi toccati), `bulkExclusionReason`, `willApplyTo`,
  `unionPreflight` (la delete multipla).
- **`nav.ts`** — `INLINE_DEPTH_LIMIT = 1`, `rendersInline`, `drillInto`/`drillOut`/
  `truncateTo`, `breadcrumbOf`, `crumbLabel`.

Due regole che valgono la pena di essere nominate, perche' sono garanzie e non
convenzioni:

- **`bulkPlan` rifiuta `name` e i children una seconda volta**, al confine dell'evento,
  anche se la UI li manda. Una UI che nasconde un controllo e' una convenzione; un piano
  che non emette l'evento e' una garanzia.
- **Non toccato = non scritto.** `touched` e' una mappa esplicita, non «i campi il cui
  valore differisce»: e' cio' che lascia misto un campo misto dopo una scrittura su un
  altro campo.

### Adapter (la divisione di R-FORM-5 mantenuta)

- **`multiDraw.ts`** (puro, testabile) — `multiInstanceOf`/`multiInstancesOf`,
  `sameMetaclass`, `childrenIn`, `navStepOf`, `pathTo`.
- **`multiAdapter.ts`** (impuro) — `applyBulk`, che riporta `written`/`unchanged`/`missing`
  invece di assumere.

**Un difetto vero trovato dalla prova, non dalla lettura**: la prima `pathTo` attaccava
`childKey` al passo **sbagliato** — la strada risultava sfalsata di uno
(`['ports','filters',null]` invece di `[null,'ports','filters']`). Lo slot appartiene al
passo appena messo, non al successivo. Il test lo ha preso al primo giro. Il fixture del
test porta di proposito un `DValue` con `name: 'NOT_THE_FEATURE_NAME'`, perche' il nome
della feature sta su `instanceof` e non sul `DValue`: una prova che passasse leggendo
`slot.name` leggerebbe quello.

### UI (`InstanceManagerTab.tsx` + il foglio)

Selezione a set con colonna checkbox e select-all **sulle sole righe visibili**; la
`MultiForm`; il breadcrumb; l'inline a un livello; il `MultiDeleteDialog`.

**L'inline non tocca la critical zone, e questa e' una riduzione di perimetro rispetto al
piano.** Il piano prevedeva chirurgia in `IRFormField.tsx` (§3.1). La resa nidificata sta
invece nel pane del manager, come `IRForm` annidate: e' lo stesso precedente che il
commento gia' in `InstanceManagerTab` motiva per la barra «Add contained» — dare al
gruppo children della form un secondo comportamento vuol dire infilare una callback
attraverso `IRForm` → `IRFormField` → `ListWidget`, tre componenti che questo tab
**ospita immutati** (2a) e che monta anche il rail del canvas. Stessa cucitura, stessa
ragione, e `viewpoint/ir/` resta intoccato.

---

## 4. Le prove

**69 prove nuove**, tutte di comportamento (i moduli a zero import sono caricabili sotto
vitest — e' la ragione per cui il motore sta in `jjform/`):
`multi.test.ts` 33, `nav.test.ts` 15, `multiDraw.test.ts` 21.

**Sonda di accettazione** `_tmp_12bc_verify.ts`: **25/25 ALL GREEN, zero errori di
pagina**. Il fixture RowViewSmoke non ha ne' containment ne' profondita': la sonda li
**costruisce** a runtime (`kids : AllNine` accesa a composition, catena
`valued → broken → noref`) e lo dichiara invece di darlo per presente.

I cinque test attesi dal prompt, uno per uno:

1. **Mixed** — «Mixed (ALFA, BETA)» coi valori distinti; per contrasto, un campo su cui
   le due concordano non dichiara Mixed (0 etichette su `widthPx`). Scrittura di
   `widthPx` → **entrambe** a 777 (prima 240/240); `description`, non toccato, resta
   `ALFA`/`BETA`.
2. **Identita'** — `name` **assente** dai 13 campi offerti; i nomi delle due istanze sono
   identici prima e dopo la scrittura bulk.
3. **Ricorsione** — livello 1 **inline** (1 `inline-child`, 2 form nel pane); drill-in →
   breadcrumb `allNine_valued: AllNine > allNine_broken: AllNine`; al livello 2 i figli
   sono **link** e non piu' inline (link 1, inline 0); livello 3 → breadcrumb a 3
   segmenti; un click sul primo segmento torna alla radice **in un colpo**.
4. **Containment-loop, per contrasto, su percorso vivo** — il contenitore non e' offerto,
   se stesso nemmeno, il terzo (lecito) si'.
5. **Delete multipla** — **un** dialogo (`.instance-manager__scrim` = 1), intitolato
   «Delete 2 AllNines?», cioe' l'insieme e non un'istanza.

**Due FAIL della prima esecuzione erano della sonda, non del codice**, e vanno a
verbale perche' sono lo stesso errore: selezionavo le righe per **indice** mentre la
tabella e' ordinata per nome (`broken`, `noref`, `valued`), quindi misuravo una coppia
diversa da quella su cui avevo scritto ALFA/BETA. Corretta la selezione per nome, verdi.
Il terzo FAIL era un'aspettativa sbagliata: `AllNine` **non dichiara un attributo
`name`**, quindi su quel fixture l'esclusione dell'identita' non ha niente da escludere —
comportamento giusto, e la meta' identita' resta pinnata dalla prova unitaria.

**Limite dichiarato**: la sonda nasconde `.notification-widget` e `.donation-banner`,
che intercettavano i click (misurato: `Apply to 2` irraggiungibile per 30s). E' il
puntatore che deve arrivare al bottone, non un cambio di comportamento.

## 5. I gate

`npx vitest run` **2082 passed / 0 failed**, **+69 esatti** sulle 2013, coi 9 file rotti
all'import = baseline nota. `npm run typecheck` **33 = baseline su output completo**,
**zero** errori nei file toccati. `npm run build` exit 0 col solo chunk-warning.
`npm run smoke` **12 passed / 0 failed / 3 skipped**.

Sullo smoke il prompt avvertiva di un 11/1/3 «flaky ambientale». Non l'ho incontrato:
verde in ogni esecuzione. La sessione parallela che ha chiuso quel fronte
(`ff9ee37e4`, `discovery_2026-08-30_6_smoke_flaky.md`) conclude che **non e' flaky**, ed
e' coerente con quanto misurato qui.

## 6. Espansione di perimetro, dichiarata

Oltre ai 9 file del piano confermato, la slice tocca `docs/decisions.md` (R-FORM-12..14) e
`docs/design/design_handoff_instance_node/form-engine-contract.md` (§5.3, e la copia
gemella in `docs/prompts/`), che e' la convenzione di ogni slice della serie R-FORM. Solo
documenti, additivi.

## 7. Cosa resta fuori, per scelta

- **Il bulk di un multivalore**: 12b edita un CAMPO, e un campo e' un controllo. Un
  `0..*` non ha un valore unico su cui essere misto — «Mixed (Green, Red, Blue)» descrive
  tre istanze in disaccordo su un valore, non un'istanza che ne tiene tre. Letto e
  scritto in posizione 0; il motore non emette eventi per una lista.
- **Outline 10b, diagramma 13a, valutazione dei derived** — fuori scope per prompt.
- **`candidatesFor` resta inerte** anche dopo questa slice, per la ragione di §1: il
  percorso che l'avrebbe accesa e' gia' presidiato dal core. L'altro percorso che il
  contratto §6 nomina — «sposta qui un figlio esistente» — non e' ancora offerto da
  nessuna superficie.

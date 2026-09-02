# CRUD2 — cardinalità nei dropdown di create, e l'aggancio del figlio al padre

**Data**: 2026-09-01 · **Slice**: CRUD2, Fase 1 (discovery-first, zero file di codice toccati)
**Perimetro letto**: `jjform/create.ts`, `jjform/shape.ts`, `jjform/writeCtx.ts`,
`components/editor-v2/hooks/createAdapter.ts`, `shapeAdapter.ts`, `shapeDraw.ts`,
`useEditorMode.ts`, `components/abstract/tabs/InstanceManagerTab.tsx`,
`model/logicWrapper/LModelElement.tsx` (`LValue.get_addObject`, `set_values`,
`LReference.get_containment`), `widgets/ReferencePicker.tsx`.
**Sonde** (non committate, `.gitignore:66`): `scripts/smoke/_tmp_crud2_recon.ts`,
`_tmp_crud2_recon2.ts`, `_tmp_crud2_recon3.ts`, `_tmp_crud2_recon4.ts`.
**Precedenti letti e non rifatti**: AUTO1 (`discovery_2026-09-01_auto1_id_autoincrement.md` §2,
la mappa della via di create), ENG1 (§A `set_containment`, §B il doppio append),
ENG2 (§2 il contratto «un gesto»).

**Esito in una riga.** Il punto 1 è confermato in ogni dettaglio e la via è misurata.
Il punto 2 **non si riproduce e non può riprodursi come descritto**: la CTA porta già
padre e feature, e per costruzione non può cadere sul ramo non-containment. Ma la stessa
lettura, girata al contrario, produce un difetto **misurato** che ha la forma esatta del
referto utente — e sta nel dropdown del punto 1, non nella CTA.

---

## 1. Il punto 1: la cardinalità c'è già nella shape, il controllo la ignora

### 1.1 Dove vive la cardinalità — nella shape, non nel grafo D

`FeatureShapeBase` (`jjform/shape.ts:78-93`) porta già tutto:

```ts
lower: number;
/** -1 means unbounded. Kept raw rather than normalised so a multiplicity label
 *  can print `*` and the upper-bound gate can test it honestly. */
upper: number;
/** `upper !== 1` — the feature holds a list, whatever its bounds. */
many: boolean;
/** `lower >= 1` — the required marker. */
required: boolean;
```

Costruito da `shapeDraw.refShape` da `MetaclassReference.upperBound/lowerBound`. **Nessuna
lettura nuova dal grafo D è necessaria**: la domanda del prompt («upperBound su
AttrShape/RefShape o da leggere dal grafo D») ha la prima risposta.

`draftModel` (`create.ts:305-341`) la porta fino al campo:
`multiplicity: multiplicity(r)`, `required: r.required`. Il modale la **stampa** già
(`instance-manager__draft-card`: `Transition [0..*]`) e **non la usa** per scegliere il
controllo.

### 1.2 Il controllo, misurato

`InstanceManagerTab.tsx:296-309`, ramo `f.kind === 'ref'`: una `<select>` sempre, con una
`<option value="">Select a {typeName}…</option>` e una option per candidato.

Misura a schermo (`_tmp_crud2_recon.ts`, fixture State con `outgoing: Transition [0..*]`,
`owner: StateMachine [1..1]`, `substates: State [0..*]`):

```
{"label":"outgoingTransition [0..*]","tag":"select","multiple":false,"type":"select-one",
 "options":["Select a Transition…","t1"],"chips":0}
{"label":"owner*StateMachine [1..1]","tag":"select","multiple":false,"type":"select-one",
 "options":["Select a StateMachine…","sm1"],"chips":0}
```

Tre campi reference, tre `select-one`, `multiple=false`, **zero chip** in tutto il modale.
Il `[0..*]` è a schermo accanto all'etichetta e non cambia nulla del controllo.

### 1.3 Il draft tiene UN bersaglio per feature

`Draft.refs: Record<string, string>` (`create.ts:53-68`), `setDraftRef` sostituisce,
`DraftField.value: string`. Portare N valori significa **aggiungere** — non cambiare —
una forma: `Draft` e `DraftField` sono interfacce esportate, e la regola 11 ammette solo
proprietà **opzionali** nuove (p.es. `refsMany?: Record<string, string[]>` accanto a
`refs`, `values?: string[]` accanto a `value`). Nessuna delle due firme esistenti va
toccata.

### 1.4 Il lower bound: la nozione di required ESISTE già

La domanda del prompt («verifica se il draft ha già la nozione di required») ha risposta
**sì**, su entrambi i lati:

- `FeatureShapeBase.required = lower >= 1`;
- `validateDraft` (`create.ts:251-291`) la applica **anche alle reference**:
  `if (r.required && !(draft.refs[r.key] ?? '').trim()) errors[r.key] = 'Required by cardinality …'`;
- il modale rende l'asterisco (`instance-manager__req`) e disabilita Create.

Misurato: con `owner [1..1]` non scelto, `Create` è **disabled: true**; scelto il
candidato, **disabled: false**. Nessuna slice di validazione nuova serve.

Resta una lettura da ridiscutere, **dichiarata e non decisa qui**: l'intestazione di
`create.ts` (lettura 2) motiva «`lower >= 1` vale come "almeno un valore", non come
"almeno `lower` valori"» con *«A draft offers one control per feature, so a `2..*` could
never be satisfied»*. Con la multi-selezione quella premessa cade, e un `2..*` diventa
esprimibile. Cambiare la regola è una decisione di merito, fuori dal perimetro di questa
slice se non richiesta.

### 1.5 La scrittura: `set_values` con l'array intero È già un gesto solo

Il contratto ENG2 («un gesto, non N append») è **soddisfatto per costruzione** dalla via
esistente, e non richiede nulla di nuovo nel core. `LValue.set_values`
(`LModelElement.tsx:7896-7913`):

```ts
val = (Array.isArray(val0) ? val0 : [val0]) as D["values"];
…
TRANSACTION(this.get_fullname(c)+'.values', ()=>{
    for (let i = 0; i < val.length; i++) {
        let out = this.get_setValueAtPosition(c)(i, val[i], …);
```

Due conseguenze misurabili sul sorgente:

1. un valore **non-array** viene normalizzato a `[v]` — è per questo che l'attuale
   `seed[r.key] = target` (stringa) funziona;
2. un array di N scrive N indici **dentro una sola TRANSACTION**, con gli indici assegnati
   dal chiamante sull'array che ha in mano. È esattamente l'arm A8 di ENG1 §B.2, l'unica
   forma verde, e la ragione per cui la `link` di ENG2 è scritta così.

Quindi la scrittura del punto 1 è: `seed[r.key] = [id1, id2, …]`, che arriva a
`feature.values = json[key]` (`LModelElement.tsx:7321`) e da lì a `set_values`. Nessuna
TRANSACTION esterna, nessun creatore annidato (CLAUDE.md §3.3 / regola 12): `addObject`
apre la propria e il seeding è dentro la sua `setTimeout`.

**Il costo di tipo, dichiarato**: `seed` è oggi
`Readonly<Record<string, string | number | boolean>>` in **due** posti che devono restare
d'accordo — `WriteCtx.create` (`jjform/writeCtx.ts:214`) e `createAdapter.createInstance`.
Ammettere N valori vuol dire allargarli entrambi (`| readonly string[]`). È un
allargamento di parametro, additivo per i chiamanti esistenti; non è la modifica di
un'interfaccia che la regola 11 vieta, ma **tocca il contratto S4** e va dichiarato nel
prompt di Fase 2.

### 1.6 Il multi-picker da riusare: NON esiste

Il prompt dice «se esiste già un multi-picker — `ReferencePicker` o affine — riusalo».
Misurato: **`ReferencePicker` è mono-selezione**. `commit` (`ReferencePicker.tsx:118-122`)
fa `onPick(c.value)` e poi `onClose()`; le props sono `value: string`, `onPick(id)`,
`onClear()`. Non ha nozione di insieme selezionato.

Il pattern del repo per una reference multivalore **in edit** è la coppia
`ChipInputWidget` (i chip dei valori, rimozione singola) + `ReferencePicker` aperto
dall'Add, **un valore per gesto**. Il `DraftDialog` **non** lo condivide, e lo dichiara:

> *«The CONTROLS stay the draft's own. A draft has no slots and no write path … while
> every extended widget of FL3 commits through one. Sharing the geometry and not the
> controls is the line that keeps this dialogue transactional.»*
> (`InstanceManagerTab.tsx:274-278`)

Quindi la Fase 2 ha **due vie, e la scelta è di merito**:

- **(a)** riusare `ReferencePicker` dal modale aggiungendogli una modalità multi
  (props nuove opzionali, `selected: string[]`, `onToggle`), e rendere i chip nel modale.
  Costo: si tocca un componente della critical zone (`viewpoint/ir/`, §3.1) che ha già
  **quattro** consumatori, e che in questo momento è **modificato in albero da un'altra
  corsia** (vedi §5).
- **(b)** tenere il controllo dentro il modale — chip + una `<select>` che aggiunge —
  senza toccare `viewpoint/ir/`. Costo: un secondo controllo di selezione nel repo, che è
  proprio ciò che il prompt vuole evitare; guadagno: la linea transazionale del
  `DraftDialog` resta dov'è e il perimetro non entra in critical zone.

Nessuna delle due è ovvia; il referto non la sceglie.

---

## 2. Il punto 2: la premessa cade, e cade due volte

### 2.1 La CTA porta GIÀ padre e feature

`InstanceManagerTab.tsx:2890`:

```tsx
onClick={() => openCreate(child.of, subjectId, child.key)}
```

Il «sospetto informato» del prompt — *«la CTA passa da `openCreate(classShape.key, null,
null)` … anche quando il contesto È un containment con parent noto»* — è **falso per
questa CTA**. I due `openCreate(classShape.key, null, null)` del file (`:2196` testata,
`:2431` cartello dell'empty state) sono le superfici **rootable**, dove i null sono
corretti, e `instanceManager10j.test.ts:101` pinna che siano esattamente due.

Le tre superfici e le loro chiamate sono già pinnate da
`instanceManagerOutline.test.ts:105-111`.

### 2.2 Quattro arm misurati, tutti verdi

`_tmp_crud2_recon.ts` (via `DockManager.openManager`) e `_tmp_crud2_recon2.ts` (via il
picker della toolbar, che è la via dell'utente: «Data manager» apre un **terzo tab**,
`TabDataMaker.instanceManager`).

| arm | cosa | esito |
|---|---|---|
| B | padre alla RADICE — `sm1.states`, Add State | `s1.father = DValue(states)`, `states.values = [s1]` |
| C | padre CONTENUTO — `s1.actions`, Add Action | `a1.father = DValue(actions)`, `actions.values = [a1]` |
| D | ritorno alla sintassi astratta (linguetta del modello) | 0 errori di pagina, canvas montato |
| E | ricarica del progetto | i figli sopravvivono, 0 errori |

**17 PASS / 0 FAIL fra i due giri, zero errori di pagina, zero errori di console nuovi**
in ciascun arm. Il controllo positivo di ogni arm è la CTA stessa: «Add State» è a schermo
e l'istanza nasce — quindi il silenzio sugli errori è un silenzio misurato, non un comando
che non ha girato.

### 2.3 Perché non può riprodursi: due letture della stessa parola, e una contiene l'altra

Gli slot che la barra CHILDREN offre vengono da `ClassShape.children`, riempito in
`shapeAdapter.ts:91`:

```ts
for (const r of cls.references) (r.containment ? children : refs).push(refShape(idlookup, r));
```

e `MetaclassReference.containment` è, in `useEditorMode.ts:421`:

```ts
containment: !!(ref.composition),
```

Il ramo che scrive il father è invece, in `LValue.get_addObject`
(`LModelElement.tsx:7168`):

```ts
let isContainment: boolean = (isDValue && this.get_containment(c as Context)) || isDModel;
…
father = isContainment ? c.data.id : this.get_model(c).id;
```

con `LReference.get_containment` (`:4164`):

```ts
get_containment(context) { return context.data.composition || context.data.aggregation; }
```

`{composition}` ⊂ `{composition ∨ aggregation}`. **Ogni slot che la barra offre cade
necessariamente sul ramo containment**, e il father viene scritto. L'orfano descritto non
è raro: è impossibile per questa via.

### 2.4 Anche il ramo auto-composizione è vuoto

Il prompt teme la CTA di un self-containment rifiutato. Misurato (`recon` arm 0b): quando
`set_containment` rifiuta (ENG1-A), `composition` resta **false** →
`MetaclassReference.containment` è false → la reference finisce in `ClassShape.refs`,
**non** in `children` → **la barra non offre nessuna CTA**. Nel modale `substates` compare
come campo reference (`substatesState [0..*]`, una select), che è il posto giusto per una
non-containment.

Forzando `composition: true` con una `SetFieldAction` diretta (la forma di un modello
importato, che non passa dal setter rifiutante — `_tmp_crud2_recon3.ts` fixture H) la
reference torna in `children` e la via è quella nominale di §2.3. L'arm H **non è stato
esercitato fino in fondo** e va dichiarato: la fixture non è riuscita a produrre
un'istanza di `State` da cui partire, perché la containment del suo contenitore era tipata
sull'astratta (§2.6) e ha creato un `Node`. Il ramo resta **non misurato**.

### 2.5 Quel che invece ROMPE il containment dal modale — e ha la forma del referto

La stessa divergenza di §2.3, letta al contrario. Una reference di sola **aggregation**
(`aggregation: true, composition: false`) sta in `ClassShape.refs`, quindi il modale la
offre come dropdown «scegli un bersaglio» — ma la via di scrittura la tratta da
containment e **riassegna il father del bersaglio**.

Misurato, `_tmp_crud2_recon4.ts`, fixture `StateMachine.states` (composition) +
`Group.members` (aggregation pura), con `s1` già dentro `sm1.states`:

```
PRIMA  s1.father = DValue(states)   states.values  = ["s1"]
DOPO   s1.father = DValue(members)  states.values  = [null]
                                    members.values = ["s1"]
```

Il gesto è: catalogo → «+ New Group» → nel modale si sceglie `s1` in `members` → Create.
`s1` **esce dal suo contenitore** e lo slot del padre resta con un **buco** (`[null]`), che
è la forma che `formWrite.clearSlotValue` lascia e che `childSlotCount` conta escludendo.
Zero errori di pagina: il chiamante non ha modo di accorgersene, come in ENG1 §B.1.

Questo è **il** difetto misurato del modale di create sul containment. Non è quello che il
prompt descrive, e sta nel dropdown del punto 1 invece che nella CTA del punto 2 — motivo
per cui i due punti, che il prompt separava, hanno in realtà lo stesso file al centro.

Tre vie possibili, **nessuna scelta qui**, perché la prima tocca il core e la terza cambia
una regola di modellazione:
- allineare `useEditorMode.ts:421` a `composition || aggregation` (la barra CHILDREN
  offrirebbe anche le aggregation: cambia la superficie, non solo il classificatore);
- escludere le aggregation dai `draftableRefs` (un controllo su un valore che la via di
  scrittura tratta da containment è «un controllo che mente», la motivazione che
  `draftableAttrs` già usa);
- lasciare il grafo com'è e dichiarare l'aggregation come un secondo padre legittimo.

### 2.6 Difetto adiacente, misurato: la CTA su una metaclasse ASTRATTA

`addChildReason` (`jjform/create.ts:180-187`) guarda `readOnly` e l'upper bound. **Non
guarda `abstract`**, mentre `newInstanceReason` lo fa (`:148`, *«Abstract metaclass — it
has no direct instances»*).

Misurato (`_tmp_crud2_recon3.ts`, `StateMachine.nodes : Node[0..*]` con `Node` astratta e
`State` concreta che la estende): la barra offre **«Add Node»**, il modale si apre, Create
produce

```
{"n":"n1","cls":"Node","abstract":true,"fatherKind":"DValue","inSlot":true}
```

un'istanza di una **classe astratta**, correttamente agganciata. `createInstance` passa
`forceCreation: true`, che per disegno instanzia *la* metaclasse chiesta e non un
sottotipo — la scelta giusta per la CTA rootable, che però qui non ha il gate che quella
ha. Il ritorno alla sintassi astratta non produce errori (0 errori di pagina), quindi il
difetto è di modello, non di rendering. Fuori dal perimetro dichiarato del prompt: si
segnala, non si corregge.

---

## 3. Misure che non erano chieste e vanno comunque dichiarate

- **I figli contenuti non prendono un nodo sul canvas M1.** In tutte le fixture il canvas
  della sintassi astratta ha misurato `nodes: 1` (la sola istanza radice) con 2 e 3
  oggetti nel modello. Non è stato indagato se sia per disegno; è fuori perimetro e viene
  qui perché è l'unica cosa che, a schermo, «non si vede» dopo una create dalla form.
- **`idl[m1].objects` è `[]`** nelle fixture di `recon2`/`recon4` mentre gli oggetti
  esistono e hanno `father` corretto; in `recon` conteneva l'istanza radice. Non
  approfondito.

---

## 4. Domande aperte, per il prompt di Fase 2

1. **Il punto 2 non ha un difetto da correggere nella forma descritta.** Serve dall'utente
   l'**errore esatto** («il passaggio alla sintassi astratta va in errore»: testo, e se
   compare in console o come schermata) e la **forma del metamodello** (la reference è
   `composition` o `aggregation`? la metaclasse figlia è astratta?). Le quattro arm di §2.2
   sono la prova che la via nominale è sana; quel che manca è lo stato dell'utente.
2. **Punto 1, via (a) o (b)** di §1.6 — la sola decisione che blocca la scrittura del
   codice.
3. **§2.5**: quale delle tre vie, o nessuna (slice a parte).
4. **§1.5**: si allarga il tipo di `seed` in `WriteCtx.create` **e** in `createInstance`, o
   la multi-selezione passa per un canale separato?

---

## 5. Stato dell'albero — il motivo dell'arresto (P6)

Due condizioni, entrambe verificate, impediscono di passare alla Fase 2 senza go-ahead:

1. **AUTO1 Fase 2 non è in albero.** Il prompt dichiara CRUD2 «SERIALE dopo AUTO1 Fase 2 —
   stesso perimetro create». Misurato: `command grep -rn "isID" createAdapter.ts jjform/`
   → **zero righe**, con controllo positivo sullo stesso comando
   (`Info.tsx:177` lo trova). Il referto AUTO1 stesso è **untracked**
   (`docs/discovery/discovery_2026-09-01_auto1_id_autoincrement.md`), cioè la Fase 1 non è
   stata committata (regola 16 / P4).
2. **Il working tree porta il lavoro non committato di un'altra corsia**, e due dei suoi
   file sono nel perimetro di CRUD2: `frontend/src/jjform/index.ts` (modificato) e
   `frontend/src/components/editor-v2/viewpoint/ir/widgets/ReferencePicker.tsx`
   (modificato) — quest'ultimo è proprio il componente che la via (a) del §1.6 vorrebbe
   estendere. Insieme a `optionColor.ts` (untracked), `IRFormField.tsx`,
   `ChipInputWidget.tsx`, `ReferenceWidget.tsx`, `widgetProps.ts`, i due fogli di token e
   `egoDiagram.scss`/`egoDiagram.test.ts` di EGO1 già committato.

---

## 6. File letti, con i punti citati

| file | righe citate |
|---|---|
| `jjform/shape.ts` | 78-93 (`FeatureShapeBase`), 95-118 (`AttrShape`/`RefShape`), 186-189 (`multiplicity`) |
| `jjform/create.ts` | 53-68 (`Draft`), 122 (`draftableAttrs`), 129 (`draftableRefs`), 146-148 (`newInstanceReason`, ramo astratta), 180-187 (`addChildReason`), 251-291 (`validateDraft`), 305-341 (`draftModel`) |
| `jjform/writeCtx.ts` | 86-93 (`CreateResult`), 194-215 (`WriteCtx.create`) |
| `createAdapter.ts` | 213-262 (`createInstance`), 274-297 (`applyCreate`), 148-172 (`draftContext`) |
| `shapeAdapter.ts` | 62-102 (root/containedIn/children) |
| `shapeDraw.ts` | 70-74 (`featureFlags`), 137-155 (`refShape`) |
| `useEditorMode.ts` | 413-427 (`MetaclassReference`), 493-505 (rootable) |
| `InstanceManagerTab.tsx` | 254-278 (docstring `DraftDialog`), 296-309 (il ramo `ref`), 1760-1762 (`openCreate`), 1834 (`outlineCreate`), 1962-1976 (`commitDraft`), 2196 / 2431 (le CTA rootable), 2890 (la CTA CHILDREN) |
| `LModelElement.tsx` | 4164 (`LReference.get_containment`), 7168-7171 (`isContainment`/`father`), 7295-7328 (il seeding differito), 7342-7345 (`LValue.get_containment`), 7896-7913 (`set_values`) |
| `widgets/ReferencePicker.tsx` | 30-44 (le props), 118-122 (`commit`) |

---

## 7. Fase 2 — quel che e' stato scritto, e le due risposte che mancavano

Aggiunto il 2026-09-01 al termine dell'implementazione (go-ahead sul prompt «CRUD2 FASE 2»).
I §1-6 sopra sono la mappa di Fase 1 e restano com'erano.

### 7.1 Punto 4 — il renderer DIGERISCE il buco: il caso utente e' un terzo path

Prima di ogni riga di codice, come il prompt chiedeva. Sonda
`scripts/smoke/_tmp_crud2e_absyntax.ts` (non committata, `.gitignore:66`): si costruisce
lo stato del §2.5 dal modale — `s1.father` spostato su `members`, `sm1.states = [null]` —
e si torna alla sintassi astratta.

```
DOPO lo sfratto      s1.father = DValue(members)   sm1.states.values = [null]
ritorno al canvas    nodes: 2, edges: 0, error boundary: nessuno, 0 pageerror
dopo la ricarica     nodes: 2,            error boundary: nessuno, 0 pageerror
```

**11 PASS / 0 FAIL, zero errori di pagina.** Il controllo positivo e' nello stesso giro: il
ritorno alla sintassi astratta e' fatto DUE volte, una col grafo sano (monta 1 nodo, zero
errori) e una col buco, cosi' che il verde sul secondo non sia il verde di uno strumento
spento. Gli unici errori di console sono il rumore di boot (`init_dash`, «wrong project
setup in navbar {projectid: null}»), presenti anche nel giro di controllo.

**Conseguenza dichiarata**: lo sfratto del §2.5 non produce l'errore che l'utente riporta.
Il buco `[null]` e' renderizzato senza rumore, prima e dopo un salva/ricarica. Il caso
dell'utente e' quindi un **terzo path**, ancora non identificato, e la domanda 1 del §4
resta aperta e risale: servono il testo esatto dell'errore e la forma del metamodello.
La misura sopra e' stata conservata come **asserzione di non-regressione**: il buco deve
continuare a rendersi.

### 7.2 §2.5 — esiste una via NON-core, ed e' quella presa

La domanda che decideva il rango: si puo' distinguere containment da aggregation senza
toccare `set_values` o `LReference.get_containment`? Misurato,
`scripts/smoke/_tmp_crud2f_agg.ts`, **5/5**, tre bracci sulla stessa fixture:

| arm | scrittura | father del bersaglio |
|---|---|---|
| A | `$members` nel json (la via di oggi), aggregation | **si muove** su `members` — il difetto |
| C | `$sees` nel json, reference PURA | resta su `states` |
| B | `setValueAtPosition(0, id, {isContainment: false})` | **resta** su `states`, `{success:true}` |

Due letture, entrambe portanti. **C** dice che il difetto e' della sola aggregation e non
di ogni non-composition: una reference pura seminata per la stessa via non sposta niente.
**B** dice che il core espone gia' l'interruttore: `info.isContainment` e' DERIVATO da
`LReference.containment` solo quando il chiamante lo lascia indefinito.

Percio' il fix vive tutto in `createAdapter.ts`: le chiavi di aggregation escono dal json
(`aggregationKeys`) e sono scritte a parte con `isContainment: false` (`writeApart`),
indici del chiamante, mai ri-derivati dallo store (ENG1 §B.4). **Zero righe nel core**, e
la decisione di rango non e' stata spesa.

**Il costo, dichiarato e non nascosto**: quella e' l'unica scrittura che paga una SECONDA
deferral. Il json non puo' trasportare `info`, quindi un'aggregation non puo' salire sulla
deferral che `addObject` gia' paga; gli slot pero' esistono dal costruttore, non dal
seeding, quindi l'attesa e' la stessa finestra, schedulata a `UpdatingTimer * 3` perche'
atterri dopo il seeding a `* 2` invece di corrergli contro. `createInstance` ritorna prima
che quei valori siano in store: un chiamante che legga lo slot in modo sincrono lo trova
vuoto. Ogni altro valore — attributi, l'auto-id di AUTO1, composition e reference pure —
continua ad arrivare con la create.

### 7.3 Punto 1 — via (b), e perche' non la (a)

Chip + select DENTRO il modale, `viewpoint/ir/` non toccato. La ragione non e' il costo:
e' la riga che il `DraftDialog` dichiara di se stesso — «sharing the geometry and not the
controls is the line that keeps this dialogue transactional». `ReferencePicker` e' mono-
selezione e ogni widget di FL3 committa attraverso uno slot; un draft non ha slot e non ha
via di scrittura. La (a) avrebbe portato un componente della critical zone dentro un
dialogo che non scrive.

La forma dei dati, e il motivo per cui e' una MAPPA IN PIU' e non un allargamento:
`Draft.refsMany?: Record<string, string[]>` e `DraftField.values?: string[]` sono
proprieta' **opzionali** nuove (regola 11); allargare `refs` a `string | string[]` avrebbe
cambiato un'interfaccia esportata. E `newDraft` **non** semina `refsMany`: la mappa nasce
al primo pick, cosi' che un draft fresco resti byte-identico a prima — le due asserzioni
ratificate che lo pinnano (`instanceManagerOutline.test.ts:115-116`, il `toEqual` del
draft vuoto in `create.test.ts`) restano verdi senza essere toccate.

Per una feature con `upper !== 1` `refsMany` e' l'UNICA sorgente e `refs[key]` resta `''`:
le due mappe non descrivono mai la stessa feature. `draftTargets(draft, ref)` e' la
lettura unica per entrambe le cardinalita', ed e' cio' che tiene `validateDraft` **una
regola sola** invece di due — «almeno un valore», la lettura 2 dell'intestazione, non e'
cambiata.

La scrittura e' `seed[key] = [id, …]`, un solo `set_values` sull'array intero, cioe' la
forma verde di ENG1 §B.2. Il tipo di `seed` e' allargato a `| readonly string[]` nei due
posti che il §1.5 aveva dichiarato — `WriteCtx.create` e `createAdapter.createInstance` —
piu' `SeedValue`, dichiarato una volta in `createAdapter` perche' la primitiva, il suo
helper di auto-id (AUTO1) e il traduttore del draft non possano divergere.

**Il lower bound resta «almeno un valore».** Con la multi-selezione un `2..*` diventa
esprimibile e la premessa dell'intestazione di `create.ts` («a draft offers one control
per feature») e' caduta — ma alzare la regola e' una decisione di merito che il prompt non
ha chiesto. Registrato come commento sul punto, non applicato.

### 7.4 §2.6 — il gate su due superfici, o le due divergono

`addChildReason(child, count, target?)`: il terzo argomento e' la metaclasse su cui lo
slot e' TIPATO, ed e' opzionale — un chiamante che non sappia risolverla ottiene il
verdetto che otteneva prima, perche' la sua assenza non e' la prova che la classe sia
concreta. Il gate sta **prima** dell'upper bound: fra due rifiuti si stampa quello che non
cambia cancellando un valore.

Il gate e' cablato in **due** posti, ed e' il motivo per cui `outline.ts` entra nel
perimetro: la barra CHILDREN (`InstanceManagerTab.childSlots`) e il menu «+» dell'outline
(`jjform/childMenu`, che guadagna un `shape?` opzionale). Cablarne uno solo avrebbe fatto
una superficie offrire «Add Node» mentre l'altra lo rifiuta, che e' esattamente la
divergenza che l'intestazione di `outline.ts` dichiara di voler evitare («the SAME two
functions»).

### 7.5 Perimetro: SETTE file di prodotto, sopra la soglia della regola 19

Dichiarato, non nascosto. La regola 19 chiede di elencarli quando superano i cinque:

| file | cosa cambia |
|---|---|
| `jjform/create.ts` | `Draft.refsMany?`, `DraftField.values?`, `setDraftRefMany`, `draftTargets`, il gate astratto in `addChildReason`, `validateDraft` e `draftModel` che leggono entrambe le cardinalita' |
| `jjform/outline.ts` | `childMenu` prende `shape?` e passa il target al gate (§7.4) |
| `jjform/index.ts` | due export nuovi (`setDraftRefMany`, `draftTargets`) |
| `jjform/writeCtx.ts` | `create`'s `seed` allargato a `\| readonly string[]` (§1.5) |
| `editor-v2/hooks/createAdapter.ts` | `SeedValue`, la lista intera in `applyCreate`, `aggregationKeys` + `writeApart` (§7.2) |
| `abstract/tabs/InstanceManagerTab.tsx` | il controllo a chip nel modale, il gate astratto sulle due superfici |
| `abstract/tabs/instanceManagerTab.scss` | le tre regole del controllo a chip; nessun token nuovo (regola 28) |

I primi sei sono conseguenza diretta dei tre punti autorizzati; il settimo e' il foglio
accoppiato al componente che il sesto modifica. Nessun file fuori da questa lista.

### 7.6 La misura, prima e dopo

`scripts/smoke/_tmp_crud2g_verify.ts` (non committata), stessa app, stessa fixture, due
giri: **7/13 coi sette sorgenti ripristinati da HEAD**, **13/13 con la modifica in albero**,
zero errori di pagina in entrambi. I sei rossi del «prima» sono esattamente gli arm della
nuova semantica; i sette verdi sono i controlli, che nel «prima» dimostrano che lo
strumento aveva segnale.

Nel «prima», misurato: `members` offriva una `select-one` «Select a State…», due pick
scrivevano **un solo valore**, e il commit lasciava `s0.father = members` con
`sm1.states = [null]`. Nel «dopo»: due chip, `members` con **due** valori, i tre father
invariati, `sm1.states` senza buchi, e — per contrasto nello stesso giro — un `setValue`
su una COMPOSITION che sposta ancora il father, come deve.

---

## 8. Domande aperte per Alfonso

Aggiunta il 2026-09-01 con DOCS1-bis. Due domande sole: sono quelle che la Fase 2 **non**
poteva chiudere da sé, e nessuna delle due è un dettaglio implementativo. Le domande del §4
sono chiuse — 2 da R-CR2-4, 3 dalla via non-core del §7.2, 4 dall'allargamento del §7.3 —
tranne la prima, che è la prima qui sotto.

### 8.1 Punto 4 — servono il testo esatto dell'errore e la forma del metamodello

Lo stato che il §2.5 produce **si rende senza rumore**. Misurato in §7.1: con
`sm1.states = [null]` e `s1.father` spostato, il ritorno alla sintassi astratta monta il
canvas (2 nodi), non lascia alcun error boundary e non produce un solo errore di pagina;
lo stesso vale dopo un salva/ricarica. Il controllo positivo è nello stesso giro.

Quindi l'errore riportato — «il passaggio alla sintassi astratta va in errore» — **non è
questo path**, e non è nemmeno quello del §2.2, dove quattro arm sono verdi. È un terzo
path, e per raggiungerlo servono due cose che solo chi ha visto l'errore può dare:

1. **il testo esatto dell'errore**, e dove compare: console, toast, o schermata piena;
2. **la forma del metamodello** su cui è successo: la reference in gioco è `composition`,
   `aggregation` o pura? la metaclasse figlia è astratta? la cardinalità?

Senza (2) la riproduzione resta una ricerca cieca: le tre forme si comportano in modo
diverso e ognuna ha già la sua misura in questo referto. Con (2) la sonda esiste già —
`_tmp_crud2e_absyntax.ts` va riparametrata, non riscritta.

### 8.2 Il lower bound: con la multi-selezione un `2..*` è esprimibile — si alza la regola?

**È una decisione di merito, e non è stata presa.**

L'intestazione di `jjform/create.ts` motiva la regola attuale — `lower >= 1` vale come
«almeno un valore», non come «almeno `lower` valori» — con una premessa che la Fase 2 ha
fatto cadere: *«a draft offers one control per feature, so a `2..*` could never be satisfied
and the commit would be blocked forever»*. Con i chip il draft offre N bersagli per feature,
e un `2..*` **si può** soddisfare prima del commit.

Le due strade, con il costo di ciascuna:

- **lasciare com'è.** Un `2..*` si crea con un bersaglio e si completa nella form di edit.
  Costo: il modale accetta un'istanza che la validazione di conformità marcherà come non
  conforme un istante dopo — due verdetti sullo stesso oggetto, che è la divergenza che
  R-S1-3 ha chiuso altrove.
- **alzarla a «almeno `lower` valori»**, sulle sole feature multivalore. Costo: `validateDraft`
  smette di essere una regola sola e diventa due (la mono resta «almeno uno», che è la stessa
  cosa solo perché `lower` vale 1); e un metamodello con un `3..*` senza abbastanza candidati
  in campo rende il create **impossibile** invece che incompleto — oggi quel caso si crea e
  si completa dopo.

La seconda è coerente con la cardinalità dichiarata; la prima è coerente con il resto del
modale, che non ha mai bloccato su ciò che si può finire dopo. Il referto non sceglie.

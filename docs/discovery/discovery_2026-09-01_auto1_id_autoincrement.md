# Discovery — AUTO1: auto-increment per attributi ID (EInt, unique, read-only)

Data: 2026-09-01. Prompt: `AUTO1` (inline, DISCOVERY-FIRST). Nessun codice scritto
prima di questo referto.

---

## 1. Il flag ID nel grafo D — ESITO 1 DEI TRE: c'e' ed e' scrivibile

`DAttribute.isID: boolean = false` (`model/logicWrapper/LModelElement.tsx:4339`), con il
commento originale `// ? exist in ecore as "iD" ?`. Non e' un campo derivato ne' calcolato:
e' un campo D di prima classe, con il suo accessore L completo.

- lettura: `LAttribute.get_isID` (`:4565`) -> `context.data.isID`;
- scrittura: `LAttribute.set_isID` (`:4566-4572`) -> `TRANSACTION` + `SetFieldAction.new(c.data, 'isID', val)`;
- copia: `:4545` lo propaga (`de.isID = context.data.isID`);
- dichiarazione L: `LAttribute.isID` (`:4398`).

**La UI lo scrive.** `components/editors/Info.tsx:176-178` dichiara
`ATTRIBUTE_ID_FLAG = [{ field: 'isID', label: 'ID', icon: 'bi-key', hint: 'identifies
instances', advancedOnly: true }]`, reso da `FlagChip` (`:193-206`), il cui `onClick` fa
`(data as any)[def.field] = !on` — cioe' l'assegnazione sul proxy che entra in `set_isID`.
E' un flag in **advanced mode**, accanto a `derived` / `changeable` / `unique`.

Quindi il primo dei tre esiti del prompt: **c'e' ed e' scrivibile dall'editor del
metamodello -> si procede.** Nessun campo nuovo, nessuna decisione di schema.

Non e' letto solo dalla UI: `common/DV.tsx:130` (`{{#if isID}}id {{/if~}}`) e la
validazione (§4).

## 2. Dove nascono i valori iniziali dell'istanza

La catena, misurata:

```
InstanceManagerTab.openCreate      -> jjform.newDraft            (draft puro, nessuna scrittura)
InstanceManagerTab (Create)        -> createAdapter.applyCreate  (draft -> seed, tipizzazione)
createAdapter.applyCreate          -> createAdapter.createInstance  (LA primitiva del contratto)
writeCtxLproxy (S4)                -> createAdapter.createInstance  (secondo chiamante)
createInstance                     -> LValue.get_addObject(json, classId, true)
LValue.get_addObject               -> DObject.new3(constructorPointers)   [dentro TRANSACTION propria]
                                   -> setTimeout(U.UpdatingTimer * 2) -> TRANSACTION -> feature.values = json[key]
```

Due letture che il prompt chiedeva esplicitamente:

- **`jjform/create.ts` NON e' la via di scrittura.** E' il motore puro (zero import oltre
  ai tipi di `shape.ts`): produce un `Draft`, che e' un valore. Il punto in cui i valori
  iniziali dell'istanza nascono davvero e' `createAdapter.createInstance` -> `addObject`.
  `create.ts` decide *quali campi il draft offre*; `createAdapter` decide *cosa viene
  scritto*. Il perimetro del prompt («create.ts») copre percio' la meta' della decisione,
  non quella della scrittura.
- **Non passa da `setValueAtPosition`.** Il seeding di `addObject`
  (`LModelElement.tsx:7295-7328`) assegna l'array intero: `(lobj)["$" + key].values =
  json[key]`, cioe' `LValue.set_values`, una volta per feature. Il contratto del chiamante
  di ENG2 («un indice per gesto») **non e' in gioco qui**: non c'e' nessun append per
  indice da coordinare.
- Il seeding e' **differito** di `U.UpdatingTimer * 2` con la motivazione gia' scritta in
  loco («Constructor.setPtr actions are not executed yet»), che e' la stessa di CLAUDE.md
  §9.2. Passare il valore *dentro il json della create* significa quindi **una sola**
  deferral, non due: e' il modo in cui `createAdapter` gia' passa `name` e gli altri slot.

## 3. Read-only in form

`changeable: boolean = true` **esiste** nel grafo D (`DAttribute`, `:4322`), e IRForm lo
legge gia': `viewpoint/ir/useFormWidgets.ts:314`

```ts
const isReadOnly = isDerived || feature?.changeable === false;
```

`IRFormField.tsx:330-335` rende il ramo: `field.isReadOnly && !field.isMultivalued` ->
`<div className="ir-field__readonly">` col valore, nessun controllo. C'e' anche il badge a
`:456` e l'esclusione dal tab-order in `formAutoLayout.ts:403`.

Quindi il secondo ramo del prompt: **il read-only del campo ID e' DERIVATO dal flag ID**,
una condizione aggiunta a quella riga, non un campo nuovo e non una scrittura di
`changeable = false` sul metamodello (che sarebbe una modifica al modello dell'utente).

**Gating**: il read-only segue il seed, non il flag da solo. Un attributo `isID` di tipo
non-EInt non viene seedato, e renderlo read-only lo renderebbe **inscrivibile per sempre**.
La condizione e' quindi `isID === true && typeName === 'EInt'`, la stessa del seed.

## 4. L'unicita' e' GIA' validata — nessuna slice nuova

`model/conformance/ConformanceValidator.ts` CHECK 11:

- accumulo a `:366-377`: `if (attr.isID === true)` raccoglie i valori non vuoti per
  `attr.id`;
- post-pass a `:504-524`: `duplicate_id_value`, severity `error`, **una violazione per
  ciascuna** istanza coinvolta, messaggio `Duplicate value "<v>" for id attribute "<a>"
  shared by N instances: ...`.
- test: `model/conformance/__tests__/ConformanceValidator.test.ts:317-350, 428-441`
  (inclusa la porta `isID` di default `false` che non accumula nulla).
- reattivita': `useConformance.ts:42,53,67` include `isID` nella firma che rifa' il conto.

**Conseguenza sulla semantica del seed.** CHECK 11 raggruppa per **id dell'attributo**, non
per metaclasse. Un attributo ereditato ha UN solo `DAttribute.id` condiviso da tutta la
gerarchia: lo spazio dei valori che la validazione considera e' quindi gia' «gerarchia
condivisa = spazio ID condiviso», esattamente la regola che il prompt decide per il seed.

Ne segue la definizione dello scan (e non e' una scelta estetica): **il massimo si calcola
sulle istanze dell'ATTRIBUTO, non su quelle della metaclasse**. Scandire per `DValue` con
`instanceof === attrId` copre per costruzione i sottotipi, i rami fratelli, e il caso in
cui l'attributo e' dichiarato su una superclasse astratta e si crea un sottotipo — dove uno
scan sulla sola chiusura `classe + sottoclassi concrete` della classe del draft
**mancherebbe** i fratelli. Seed e validazione leggono cosi' lo stesso spazio, e non
possono divergere.

## 5. `AttrShape` non porta il flag

`jjform/shape.ts` `AttrShape` (`:92-100`) ha `type`, `enum`, `typeName` + la base con
`lower/upper/many/required/derived/readOnly`. **Nessun `isID`.** Il costruttore e'
`shapeDraw.attrShape` (`:106-134`), che legge le flag dal grafo D via
`featureFlags(idlookup, a.id)` (`:70-74`, `derived` e `changeable` letti direttamente da
`idlookup[featureId]`). `isID` si legge dallo stesso posto e con lo stesso gesto —
`MetaclassAttribute` (`useEditorMode.ts:62-73`) **non** va toccato.

`draftableAttrs` (`create.ts:122-124`) filtra `!a.derived && !a.readOnly` con la
motivazione «un controllo su un valore che la via di scrittura rifiutera' e' un controllo
che mente». Un attributo auto-ID e' lo stesso caso: il valore lo genera il motore.
Escluderlo di la' lascia la colonna in tabella (`tableFeatures` legge `cls.attrs`, non
`draftableAttrs`) e toglie solo il controllo dal modale di create.

## 6. Rischi e vincoli misurati

- **Non toccare `newDraft`.** Due asserzioni ratificate lo pinnano alla firma attuale:
  `instanceManagerOutline.test.ts:116` (`toContain('setDraft(newDraft(shapeCtx.shape(),
  clsName, ownerId, childKey))')`) e `:115` / `instanceManager10c.test.ts:470` (un solo
  sito di chiamata). Il seed **non** passa dal draft: passa dalla create.
- **Nessuna TRANSACTION esterna.** `addObject` apre la propria attorno a `DObject.new3`
  (CLAUDE.md §3.3 / regola 12). Il delta non ne apre nessuna: aggiunge una chiave al `json`
  che `createInstance` gia' passa.
- **Valori esistenti mai riscritti.** Lo scan e' in sola lettura; l'unica scrittura e' la
  chiave nuova nel json della create.
- **Seed solo se il chiamante non ha gia' un valore.** `createInstance` ha due chiamanti
  (`applyCreate` e `writeCtxLproxy`): un valore esplicito nel `seed` vince sul generato.
- **Costo.** Uno scan di `idlookup` per gesto di create. Misurato altrove in questo repo:
  0.57 ms a 10k voci.

## 7. Fuori perimetro, dichiarato

UI del flag ID nell'editor del metamodello (esiste gia', §1); validazione di unicita'
nuova (esiste gia', §4); riciclo/compattazione dei buchi; ID composti o stringa; le altre
vie di create (`canvasToJjom.syncCreateObject`, JjScript `create`), che passano da
`DObject.new` e non da `addObject`.

---

## 8. Fase 2 — cosa e' stato scritto, e le scelte che il codice non spiega da solo

Aggiunto il 2026-09-01 al termine dell'implementazione. Il referto sopra e' la mappa di
Fase 1 e resta com'era; questa sezione registra le decisioni prese scrivendo, perche'
nessuna di esse si legge dal diff.

### 8.1 Il campo ID SPARISCE dal modale di create — scelta, non omissione

`draftableAttrs` (`jjform/create.ts`) esclude un attributo `isID` su `EInt` con lo stesso
argomento con cui gia' escludeva i derivati: **un controllo su un valore che il draft non
governa e' un controllo che mente**. Qui il motivo e' un passo piu' avanti: la via di
scrittura non *rifiuterebbe* il valore, lo *sovrascriverebbe*. Il numero che l'attributo
prendera' e' deciso dal modello nell'istante della create, quindi qualunque cosa il draft
mostrasse sarebbe una **previsione** — e una previsione resa come campo pieno si legge come
un fatto. E' il pattern della colonna `AUTO_INCREMENT` in MySQL: assente dalla `INSERT`,
presente nella riga.

La colonna resta in tabella (`tableFeatures` legge `cls.attrs`, non `draftableAttrs`) e il
campo resta nella form dell'istanza, in sola lettura. **Non e' un settimo file**: nessuna
modifica a `InstanceManagerTab`, che rende quel che `draftModel` gli passa.

Registrato qui perche' l'assenza di quel campo somiglia a una dimenticanza, e reintrodurlo
significherebbe reintrodurre la bugia.

### 8.2 Un solo gate, letto da tre posti

`isAutoIdAttr(a) === (a.isID === true && a.typeName === 'EInt')` sta in `jjform/shape.ts`,
fra gli helper derivati, e lo leggono i tre consumatori: chi nasconde il controllo nel
draft, chi semina il valore nella create, chi rende il campo read-only nella form. Tre
copie di una condizione a due clausole sono tre occasioni di divergere.

La **seconda clausola non e' decorazione**: `isID` da solo bloccherebbe un identificatore
`EString`, che nessuno sa generare, rendendolo **inscrivibile per sempre**.

### 8.3 `isID` non e' stato ripiegato dentro `featureFlags`

Sarebbe stato il gesto simmetrico a `derived`/`changeable`, e sarebbe stato sbagliato per
due motivi misurati: `featureFlags` serve anche `refShape`, e una reference non porta la
flag; e il suo oggetto di ritorno e' pinnato da un `toEqual` **esatto**
(`instanceTable.test.ts:199-204`), che un campo in piu' avrebbe fatto rosso senza che
niente fosse peggiorato. `attrShape` legge `idlookup[a.id].isID` direttamente — stesso
posto, stesso gesto, nessuna asserzione verde spesa.

### 8.4 Import profondo di `jjform/shape`, e perche' non del barrel

`createAdapter.ts` e `useFormWidgets.ts` importano `isAutoIdAttr` da `'…/jjform/shape'` e
non da `'…/jjform'`. Esportarlo dal barrel avrebbe aperto `jjform/index.ts` come **settimo**
file di prodotto, fuori dal perimetro autorizzato. L'import profondo e' gia' il precedente
della cartella (`shapeDraw.ts:25`, `EgoDiagram.tsx:10`), e il modulo raggiunto e' lo stesso.

### 8.5 Lo scan non e' filtrato per modello

`maxIdValue` (`createDraw.ts`) scandisce ogni `DValue` con `instanceof === attrId`, senza
chiedere a quale `DModel` appartenga. Due modelli sullo stesso metamodello condividono
dunque il massimo: la sequenza e' **monotona su entrambi** e non puo' collidere **dentro**
nessuno dei due — che e' il solo scope su cui CHECK 11 emette un verdetto. Filtrare per
modello avrebbe voluto un `modelOfObject` per slot e avrebbe comprato un numero piu' basso,
non uno piu' sicuro.

Valori non numerici **scartati**, non coerciti: `Number('')` vale 0, e 0 e' un massimo. Un
attributo con soli valori vuoti risponde `null` — che e' diverso da 0 — e la sequenza
riparte da 1. La misura sta nell'unita' `createDraw.test.ts`, provata contro la mutazione
che toglie il guard.

### 8.6 La sequenza parte da 1, e i buchi restano spesi

`nextIdValue` = massimo + 1, e 1 quando non c'e' ancora nulla di numerico. Nessun riciclo:
un id assegnato e poi cancellato resta speso, che e' cio' che rende il numero stabile per
chiunque se lo sia annotato. Un massimo negativo avanza comunque di uno (−3 → −2): la regola
e' «dopo il piu' grande», e schiacciare a 1 riemetterebbe un valore che un modello scritto a
mano puo' gia' avere.

### 8.7 La misura, prima e dopo

Sonda `scripts/smoke/_tmp_auto1_verify.ts` (non committata, `.gitignore:66`), girata due
volte sulla stessa app: coi sei sorgenti ripristinati da `HEAD` **13 PASS / 8 FAIL**, con la
modifica in albero **21 PASS / 0 FAIL**, zero errori di pagina in entrambi i giri. Gli 8
rossi del «prima» sono esattamente gli arm della nuova semantica; i 13 verdi sono i controlli
positivi, che nel «prima» dimostrano che lo strumento aveva segnale.

Il primo tentativo di giro «prima» e' stato **annullato e rifatto**: `for f in $FILES` non
divide le parole in zsh, quindi nessun file era stato ripristinato e quel 21/21 era un
secondo giro del «dopo». E' registrato qui perche' un ripristino che non avviene produce lo
stesso silenzio di un ripristino che non serviva.

### 8.8 Fuori perimetro, rilevato passando

`docs/claude-code-log.md` e' a **59 voci**: P9 fissa a 40 la soglia di rotazione verso
`docs/claude-code-log-archive.md`. La condizione precede questo task (58 voci prima della
sua) e la rotazione non e' stata fatta qui: e' una corsia sua.

# Discovery 2026-08-30 — cosa serve a `WriteCtx`, e cosa non puo' attraversarlo

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `217d5c956`
**Prompt**: «Discovery: cosa serve a WriteCtx (la migrazione del motore in `jjform/`)».
Il contratto (punto aperto 5) tiene `jjform/` aperta per il solo TIPO; il motore ci arriva
quando `WriteCtx` e' deciso. Quattro domande: l'inventario delle scritture, il minimo comune,
cosa non puo' migrare, il costo della doppia verita'. **Zero fix, sola lettura.**
**File letti per intero**: `jjform/{shape,create,delete,multi,nav,index}.ts`,
`editor-v2/viewpoint/ir/formWrite.ts`, `editor-v2/hooks/{createAdapter,deleteAdapter,multiAdapter}.ts`,
`editor-v2/viewpoint/ir/{IRFormField.tsx,useFormWidgets.ts,irReadCtx.ts}`,
`model/logicWrapper/nameUniqueness.ts`, piu' le sezioni indicate di
`model/logicWrapper/LModelElement.tsx` (7035-7200, 7582-7680, 7853-7900, 6505-6525, 6230-6310),
`docs/prompts/form-engine-contract.md`, la serie R-FORM di `docs/decisions.md`.
**Esito**: **`WriteCtx` e' piu' vicino di quanto sembri e piu' stretto di quanto basti.** Sei
primitive coprono ogni scrittura inventariata, e tre siti su quattro indirizzano gia' per
`(id, chiave)`. Ma il contratto deve dichiarare tre cose che oggi nessuno dichiara, e c'e'
una **divergenza misurata** — non una duplicazione — fra la uniqueness del motore e quella
del core.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep`
risolve in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.
**Nota metodologica, perche' e' costata due misure sbagliate**: la shell di questa sessione
riporta la cwd alla root del repo a ogni chiamata. Due ricerche «vuote» in questo referto
erano `No such file or directory`, non assenze; sono state rifatte da `frontend/` e il
controllo positivo e' esplicito dove l'esito e' negativo.

---

## 1. La risposta, in breve

- **L'inventario e' chiuso e piccolo**: **otto** funzioni scrivono sul D-graph in questo
  perimetro, e **cinque** di esse sono `formWrite.ts`. Una delle cinque, `addSlotValue`,
  non ha **nessun chiamante** (§2.4).
- **Il minimo comune sono sei primitive**, tutte indirizzabili per `(instanceId, featureKey,
  index)`. Tre siti su quattro indirizzano gia' cosi'; l'unico che passa un **proxy L vivo**
  e' `IRFormField`, ed e' l'unico costo di migrazione vero (§3).
- **Tre garanzie non possono restare implicite.** Il filtro containment-loop del picker, il
  rifiuto in scrittura, e il doppio legame dell'identita': se il contratto non le dichiara, un
  adapter non-jjodel produce modelli che questo host rifiuterebbe (§4).
- **La doppia verita' esiste gia', e ha una divergenza misurabile**: uniqueness del nome. Il
  core la controlla sul RENAME su un namespace, il motore sulla CREATE su un altro. Le due non
  coincidono, e una create puo' produrre uno stato che un rename successivo rifiuterebbe (§5).

---

## 2. L'inventario delle scritture

### 2.1 La tabella

Ogni punto in cui questo perimetro tocca il D-graph. `frontend/src/` implicito.

| # | Sito | Firma | Primitiva D | TRANSACTION | Dilazione |
|---|---|---|---|---|---|
| 1 | `…/ir/formWrite.ts:52` | `setSlotValue(slot, index, value, isPtr?)` | `LValue.setValueAtPosition(index, value, {isPtr})` | **propria** | no |
| 2 | `…/ir/formWrite.ts:103` | `clearSlotValue(slot, index, isPtr?)` | `setValueAtPosition(index, undefined, {isPtr})` | **propria** | no |
| 3 | `…/ir/formWrite.ts:131` | `addSlotValue(slot)` | `SetFieldAction(slot.id,'values', U.initializeValue(type),'+=',false)` | **propria** | no |
| 4 | `…/ir/formWrite.ts:155` | `appendSlotValue(slot, value, isPtr)` | `SetFieldAction(slot.id,'values', value,'+=',isPtr)` | **propria** | no |
| 5 | `…/ir/formWrite.ts:183` | `setObjectName(objectId, name)` | `lObject.name = name` (setter L) | **del setter** | no |
| 6 | `…/hooks/createAdapter.ts:193` | `applyCreate(modelId, shape, draft)` | `slot.addObject(json, classId, true)` / `lModel.addObject(…)` | **di `addObject`** | **si', interna**: seeding degli slot a `U.UpdatingTimer*2` (`LModelElement.tsx:7188`) |
| 7 | `…/hooks/deleteAdapter.ts:188` | `applyDelete(plan)` | N× (1), N× (2), poi `proxy.delete()` per id | **di ciascuna** | **si', condizionata**: `U.UpdatingTimer*2` sulle sole delete, e **solo se** il piano ha scritto prima (R-FORM-11) |
| 8 | `…/hooks/multiAdapter.ts:65` | `applyBulk(plan)` | N× (1) a `index 0` | **di ciascuna** | **no**, e la differenza con (7) e' misurata (R-FORM-12) |

**Nessuna funzione apre una TRANSACTION esterna**, e in tutti e tre gli adapter il motivo e'
scritto nell'intestazione: `addObject` e `get_delete` aprono la propria attorno a un creatore,
e avvolgerle sarebbe l'annidamento della Regola 12 / §3.3.

### 2.2 I chiamanti

```
formWrite (1)(2)(4)  <- IRFormField.tsx:99,102,105,216   (form di UNA istanza)
formWrite (5)        <- IRForm.tsx:295                    (rinomina dal titolo)
formWrite (1)(2)     <- deleteAdapter.ts:198,208          (reassign / clear del piano)
formWrite (1)        <- multiAdapter.ts:77                (una setValue per istanza)
applyCreate          <- InstanceManagerTab.tsx:1055
applyDelete          <- InstanceManagerTab.tsx:1015,1044
applyBulk            <- InstanceManagerTab.tsx:881
```

Due fatti che contano per la migrazione:

- **`InstanceManagerTab.tsx` (1472 righe) non ha nessuna scrittura diretta.** Cercate
  `TRANSACTION`, `SetFieldAction`, `.delete()`, `addObject`, `isProjectModified`: zero
  occorrenze. Controllo positivo sullo stesso comando e sullo stesso file: `useMemo`, 21.
  La superficie di scrittura e' gia' interamente negli adapter.
- **`IRForm` e' montato da DUE superfici**: `InstanceManagerTab.tsx:53` e
  `PropertiesWithTreeView.tsx:6`, cioe' il manager **e il rail destro**. Toccare
  l'indirizzamento di `IRFormField` tocca entrambe.

Anche i widget sono puliti: `widgets/{ListWidget,ChipsWidget,ReferenceWidget}.tsx` non
contengono `TRANSACTION`, `SetFieldAction`, `setValueAtPosition` ne' `.delete()` (esito
negativo, controllo positivo sugli stessi file: 8, 5 e 3 occorrenze di
`onCommit|onAppend|onRemove|onPick`). Scrivono per callback, mai da soli.

### 2.3 L'indirizzamento — il reperto che decide `WriteCtx`

Le stesse due primitive sono raggiunte in **due modi diversi**:

```
deleteAdapter.ts:193   const slot = lOwner?.['$' + step.featureKey];     // (instanceId, key)
multiAdapter.ts:71     const slot = lOwner?.['$' + ev.key];              // (instanceId, key)
createAdapter.ts:225   const slot = lOwner?.['$' + draft.childKey] ?? …  // (instanceId, key)

IRFormField.tsx:99     setSlotValue(field.slot, index, …)                // PROXY L VIVO
```

`FormFieldDescriptor` (`useFormWidgets.ts:266`) porta `slotId` (l'id della `DValue`), `name`
(il nome della feature) e `slot` (il proxy). **Non porta l'id dell'oggetto**, che pero'
`IRForm` ha gia' — lo passa a `setObjectName` (`IRForm.tsx:295`).

Cioe': **tre siti su quattro sono gia' nella forma che `WriteCtx` vuole**, e il quarto ha
tutto quello che gli serve per esserlo, a un `objectId` di distanza. Non e' una riscrittura,
e' un cambio di argomento.

### 2.4 Un reperto laterale: `addSlotValue` non ha chiamanti

`formWrite.addSlotValue` e' definita ed esportata; l'unica occorrenza del nome fuori dal
proprio corpo e' un riferimento nel docstring di `appendSlotValue`. Cercata su tutto `src/`
senza filtri (esito con match, quindi la ricerca ha segnale: 3 righe, tutte in `formWrite.ts`).
Il suo docstring dice «Written for Slice 1a but exercised by 1b»: la 1b la esercita con
`appendSlotValue`, che appende un valore **noto**, mentre questa appende un vuoto tipato.

**Non rimossa** (Regola 9): e' l'unica funzione che sa produrre il vuoto tipato di
`U.initializeValue`, cioe' l'unico posto dove quella conoscenza vive nel perimetro form. Va
segnata come `// TODO: cleanup` o rianimata da un gesto «Add row» — non decisa qui.

---

## 3. `WriteCtx` — la bozza (tipi soli, non nel sorgente)

Modellata su `ReadCtx` (`irReadCtx.ts:17`), che e' il precedente misurato: indirizza per
`elementId` + `featureName`, non espone mai un proxy, e ha **zero import**.

```ts
/** Esito di una scrittura. `changed:false` non e' un errore: e' il valore che c'era gia'. */
export interface WriteResult {
    ok: boolean;
    changed: boolean;
    /** Motivo del rifiuto dell'host. Popolato quando ok === false. */
    reason?: string;
}

export interface CreateResult {
    ok: boolean;
    /** Id opaco della nuova istanza, o null. */
    id: string | null;
    reason?: string;
}

/** Un candidato per una feature di riferimento, come l'host lo consente OGGI,
 *  per QUESTA istanza. Non e' derivabile dalla sola shape: vedi §4.1. */
export interface TargetOption { id: string; label: string; group?: string; }

export interface WriteCtx {
    // ── valori ───────────────────────────────────────────────────────────────
    /** Scrive `value` alla posizione `index` della feature. `isPtr` dice se il
     *  valore e' un puntatore (reference, letterale di enum) o un primitivo. */
    setValue(id: string, key: string, index: number,
             value: string | number | boolean | null, isPtr: boolean): WriteResult;

    /** Svuota la posizione `index`. Il contratto DICHIARA che questo lascia un
     *  BUCO e non accorcia l'array (R-FORM-7): `instanceData` deve poterlo
     *  rappresentare, e un adapter che accorcia non fa round-trip. */
    clearValue(id: string, key: string, index: number, isPtr: boolean): WriteResult;

    /** Appende un valore gia' noto in coda alla feature. */
    appendValue(id: string, key: string,
                value: string | number | boolean, isPtr: boolean): WriteResult;

    // ── identita' ────────────────────────────────────────────────────────────
    /** Primitiva A SE', non `setValue(id,'name',…)`: in questo host il nome ha un
     *  doppio legame (CLAUDE.md §3.12) e lo scrive il solo setter L. Vedi §4.3. */
    setName(id: string, name: string): WriteResult;

    // ── ciclo di vita ────────────────────────────────────────────────────────
    /** `ownerId`/`childKey` entrambi null = radice. `seed` sono i valori che
     *  viaggiano CON la create (contratto §5.1): l'host puo' avere una sola
     *  finestra per scriverli. */
    create(cls: string, ownerId: string | null, childKey: string | null,
           seed: Readonly<Record<string, string | number | boolean>>): CreateResult;

    /** Cancella UNA istanza. La cascata di containment NON e' qui: e' del piano
     *  (R-FORM-9), che elenca i discendenti dal piu' profondo. */
    delete(id: string): WriteResult;

    // ── cio' che il motore non puo' calcolare ────────────────────────────────
    /** I bersagli che questo host accetta per QUESTA istanza e QUESTA feature.
     *  Obbligatorio: vedi §4.1. Un adapter che non sa fare di meglio ritorna
     *  ogni istanza conforme per tipo, e lo dichiara. */
    validTargets(id: string, key: string): readonly TargetOption[];
}
```

**Obbligo di sequenza, che non e' un metodo.** Il motore emette piani **ordinati**
(`DeletePlan`: prima `reassign`, poi `clear`, poi `deletes` dal piu' profondo). Il contratto
deve dire che l'host applica i passi **in ordine e in modo che ciascuno sia osservabile dal
successivo**. In jjodel questo costa una dilazione di `U.UpdatingTimer*2` fra una scrittura di
slot e una delete (R-FORM-11) e **nessuna** fra N scritture su N slot distinti (R-FORM-12).
Sono numeri di questo host: non vanno nel motore, ma l'obbligo si'. Un adapter che applica in
parallelo perde un valore, e lo perde in silenzio.

### La mappa sito → metodo

| Sito di oggi | Metodo di `WriteCtx` | Costo del cambio |
|---|---|---|
| `IRFormField.tsx:99` `setSlotValue(field.slot, i, v, isPtr)` | `setValue(objectId, field.name, i, v, isPtr)` | **il solo vero costo**: far scendere `objectId` nel descriptor o nelle props |
| `IRFormField.tsx:102` `clearSlotValue` | `clearValue(objectId, field.name, i, isPtr)` | idem |
| `IRFormField.tsx:105` `appendSlotValue` | `appendValue(objectId, field.name, v, isPtr)` | idem |
| `IRFormField.tsx:216` `setSlotValue(…,0,v,true)` (enum) | `setValue(objectId, field.name, 0, v, true)` | idem |
| `IRForm.tsx:295` `setObjectName(objectId, next)` | `setName(objectId, next)` | rinomina, indirizzamento gia' giusto |
| `deleteAdapter.ts:198` reassign | `setValue(step.instanceId, step.featureKey, step.index, step.to, true)` | **zero**: e' gia' la firma |
| `deleteAdapter.ts:208` clear | `clearValue(step.instanceId, step.featureKey, step.index, true)` | **zero** |
| `deleteAdapter.ts:148` `proxy.delete()` | `delete(id)` | **zero** |
| `multiAdapter.ts:77` bulk | `setValue(ev.id, ev.key, 0, ev.value, ev.isPtr)` | **zero** |
| `createAdapter.ts:234/238` `addObject` | `create(cls, ownerId, childKey, seed)` | **zero** nella firma; il `json` `$`-prefissato resta traduzione dell'adapter |
| `useFormWidgets.readOptions(slot)` → `slot.validTargetOptions` | `validTargets(objectId, key)` | medio: oggi legge dal proxy |

---

## 4. Cosa NON puo' migrare, e per ciascuna il verdetto

La domanda non e' «resta o va», ma «resta **in silenzio** o resta **dichiarata**». Un adapter
non-jjodel deve sapere cosa gli si chiede.

### 4.1 Il filtro containment-loop del picker (R-FORM-13) — **il contratto la deve dichiarare**

`LValue.get_validTargets` (`LModelElement.tsx:7853`) fa due cose che nessuna shape puo' fare:

```ts
let containerObjectsID = this.get_fatherList(c).map(lm => lm.id);
if (isContainment) validObjects = validObjects.filter(obj => !containerObjectsID.includes(obj.id));
if (!isShapeless) validObjects = validObjects.filter(obj => (type as LClass).isSuperClassOf(obj.instanceof, true))
```

Il primo filtro e' **per-istanza** — legge la catena dei padri di QUESTO oggetto — e per
questo e' assente dalla shape, non approssimato (Q4 sciolta). Il form lo consuma senza
saperlo: `useFormWidgets.readOptions:148` legge `slot.validTargetOptions`, cioe' il getter del
core, attraverso il proxy.

**Se `WriteCtx` non porta `validTargets`, il motore perde il filtro nel momento in cui perde
il proxy.** Non e' una perdita teorica: `createDraw.candidatesFor` esiste, ma R-FORM-13 lo ha
ratificato **inerte** proprio perche' il core fa gia' il lavoro, e sostituirlo «sarebbe
barattare una garanzia verificata con una nostra». Quindi: metodo obbligatorio nel contratto,
implementazione del solo host.

### 4.2 Il rifiuto in scrittura — **resta fuori, ma `WriteResult.reason` la deve esporre**

`setValueAtPosition` e' l'ultima rete:

```
LModelElement.tsx:7656   return {success: false, reason: "cannot create a containment loop"};
```

e la sua firma (`:7582`) e' `{success: boolean, reason?: string}`. **Oggi quel verdetto viene
buttato via**: `formWrite.setSlotValue` (`:66`) chiama `fresh.setValueAtPosition(index, value, {isPtr})`
senza leggerne il ritorno, e poi ritorna `true` perche' il valore PRIMA era diverso — e mette
`U.isProjectModified = true`. Letto nel sorgente, non esercitato a runtime (task in sola
lettura): **una scrittura rifiutata dal core viene riportata come riuscita**.

Non e' un difetto da correggere qui, ed e' esattamente la ragione per cui `WriteCtx` deve
tornare `{ok, changed, reason}` e non un `boolean`: il tipo attuale non ha un posto dove
mettere «l'host ha detto di no».

### 4.3 Il doppio legame dell'identita' (§3.12) — **primitiva a se'**

`setObjectName` passa dal setter L perche' quel setter scrive **entrambi** i lati (`data.name`
e lo slot `name`), e CLAUDE.md §3.12 vieta la direzione inversa. Se `setName` fosse
`setValue(id, 'name', 0, …)` il motore starebbe scrivendo lo slot e basta, e le due meta'
divergerebbero. Resta una primitiva separata, e il contratto deve dire **perche'**, altrimenti
il primo adapter che «semplifica» la riunisce a `setValue`.

Nota misurata sul percorso di create: `addObject` costruisce `{...json, father}`
(`:7056`) e lo passa a `DObject.new3` (`:7135`), quindi sulla CREATE il nome **non passa da
`set_name`**. Le due meta' arrivano per due strade diverse. E' il presupposto di §5.

### 4.4 La conformita' di tipo del bersaglio — **non e' una garanzia: e' un debito**

La riga che la imporrebbe in scrittura e' **commentata**:

```
LModelElement.tsx:7652
// if (info.instanceof && info.type && (!(lvalmeta as LClass)?.isExtending(info.type)))
//     return {success: false, reason: "target is not of correct type"}; damiano todo: enable and implement isExtending
```

Quindi la conformita' e' filtrata dal solo **picker** (§4.1). Un motore che scrivesse per id
senza passare dal picker potrebbe piazzare un bersaglio di tipo sbagliato e il core lo
accetterebbe. Va nel contratto come **limite dichiarato dell'host**, non come garanzia su cui
il motore possa contare.

### 4.5 Le altre, in breve

| Garanzia | Dove sta oggi | Verdetto |
|---|---|---|
| Singleton non cancellabile | `LObject.get_delete` (`:6510`): logga e ritorna | Gia' nel preflight come `blocked`. `WriteResult.reason` su `delete` basta |
| Cascata di containment | **l'adapter**, non il core (R-FORM-9) | Gia' del motore (`deletePlan`). Nessun obbligo nuovo |
| Rimozione per valore vs buco | core accorcia con `'-='` (R-FORM-10); `clearValue` buca (R-FORM-7) | **Dichiarata**, ed e' gia' nel contratto §2 |
| `forceCreation` / scelta della sottoclasse per schema | `addObject` (`:7096`) | Da dichiarare: `create` crea **la** metaclasse chiesta, mai una sua sottoclasse |
| `U.isProjectModified` | `formWrite` ×5, `createAdapter:245` | Fuori dal motore per design: e' stato dell'host |
| `U.UpdatingTimer` | dilazioni (6)(7) | Fuori dal motore; resta l'**obbligo di sequenza** (§3) |
| `U.initializeValue(type)` | `addSlotValue` (`:137`) | Il vuoto tipato serve al motore se quella funzione rinasce. Oggi inerte (§2.4) |

---

## 5. Il costo della doppia verita'

Il precedente e' R-FORM-15: la tabella teneva `missingRequired` come **guardia davanti allo
switch della cella**, cioe' una seconda copia di una regola che il motore poteva prendere una
volta sola. La correzione non fu spostare la guardia: fu farla **decidere** a
`detectValueRenderer` e farla **ricevere** a entrambe le superfici. Questo e' il metro.

### 5.1 Uniqueness del nome — **una divergenza, non una duplicazione**

Le due regole esistono entrambe, e **non dicono la stessa cosa**.

| | Motore | Core |
|---|---|---|
| Dove | `jjform/create.ts`, alimentata da `createDraw.siblingNames:158` | `nameUniqueness.getSiblingNamespace`, chiamata da `LObject.set_name` (`LModelElement.tsx:6235`) |
| Namespace | `instancesUnder(idlookup, modelId, {classId}, ownerId)` — **stessa classe, stesso owner** (`createDraw.ts:124-141`) | radice: **tutti** gli oggetti del modello, qualunque classe; contenuta: **tutti** gli `LObject` dello stesso slot di containment |
| Quando | alla **create** | al **rename** (e al reparent, `:6296`) |
| Effetto | il commit resta bloccato, messaggio nel draft | hard-block + `toast.error` |

Due differenze, entrambe osservabili:

1. **Il filtro di classe.** Il motore confronta solo i fratelli della stessa metaclasse; il
   core confronta tutti. Un draft `State` chiamato `X` sotto `O`, con un `Transition` gia'
   chiamato `X` sotto `O`: il motore lo accetta, il core rifiuterebbe lo stesso nome a un
   rename.
2. **Il momento.** Sulla create il nome viaggia dentro `constructorPointers`
   (`:7056` → `DObject.new3`, `:7135`) e **non** passa da `set_name`: la validazione del core
   non gira affatto. Quindi la create puo' produrre uno stato che il rename successivo dello
   stesso oggetto, allo stesso nome, rifiuterebbe.

E' il reperto piu' costoso del referto, ed e' esattamente la forma di R-FORM-15: **due copie
di una regola, che hanno gia' iniziato a divergere.** La migrazione la deve chiudere prima di
aggiungere altro, e la chiusura ha una sola forma coerente col precedente: **una decisione
sola**, presa dal motore, alimentata da un namespace che l'adapter fornisce — cioe' una
`siblings(id | ownerId)` su `ReadCtx`/`WriteCtx`, non due liste calcolate due volte.

*Non misurato a runtime* (task in sola lettura): le due righe sopra sono lette nel sorgente.
Una prova per contrasto — creare `X:State` e `X:Transition` sotto lo stesso owner, poi
rinominare — e' il primo passo della slice che chiude il punto.

### 5.2 `validTargets` contro `candidatesFor` — convergenza gia' ratificata, e da non riaprire

Il motore ha `createDraw.candidatesFor` con il proprio filtro di catena; il core ha
`get_validTargets` con il suo. R-FORM-13 ha ratificato che la copia del motore resta
**inerte** e che il percorso di EDIT usa il core. Se `WriteCtx` porta `validTargets` (§4.1) la
convergenza resta una sola riga di contratto; se non lo porta, il motore e' costretto a
usare la propria copia e la ratifica si ribalta **senza che nessuno lo decida**.

### 5.3 La chiusura di conformita' — due implementazioni, zero controlli in scrittura

`createAdapter.conformanceClassIds` costruisce la chiusura da
`getMetaclassInfo(...).concreteSubclasses`; il core la ricalcola con
`isSuperClassOf(obj.instanceof, true)` dentro `get_validTargets` (`:7875`). Due
implementazioni della stessa domanda, e — §4.4 — il write path non ne applica **nessuna**.
Sono la stessa regola scritta due volte in due layer che non si parlano.

### 5.4 Buco contro accorciamento — convergenza sana, purche' dichiarata

`jjform` conta i valori «significativi» saltando i buchi (`shape.ts:167`, `create.ts:163`,
`delete.ts:27`), perche' `clearSlotValue` ne lascia. E' una conoscenza del core replicata nel
motore, ma qui e' **corretta**: e' parte del formato di `instanceData` (contratto §2), quindi
il motore deve conoscerla per definizione. Va solo tenuta in **un** posto quando il motore
migra, non ricopiata in ogni funzione che conta.

---

## 6. Sequenza di slice proposta

Ordinata per rischio crescente, ciascuna verificabile da sola.

- **S1 — chiudere la doppia verita' sulla uniqueness (§5.1).** Nessun `WriteCtx` ancora: una
  sola decisione, un solo namespace, misurata per contrasto. Va prima perche' e' l'unico
  reperto che **peggiora** mentre si aspetta.
- **S2 — `WriteResult` al posto di `boolean` in `formWrite`.** Le cinque funzioni tornano
  `{ok, changed, reason}` e leggono il verdetto di `setValueAtPosition` (§4.2). Puramente
  additiva sui chiamanti, e senza di essa `WriteCtx` nasce col tipo sbagliato.
- **S3 — `IRFormField` indirizza per `(objectId, key)`.** Il solo costo strutturale (§2.3),
  e tocca **due** superfici (manager e rail): lo smoke va girato su entrambe.
- **S4 — `WriteCtx` come interfaccia in `jjform/`, con l'adapter `writeCtxLproxy`
  che la implementa.** Forma di `irReadCtx` / `irReadCtxLproxy`: il tipo senza import, l'impuro
  iniettato. A questo punto e' una rinomina, non una migrazione.
- **S5 — `validTargets` dentro `WriteCtx`** (§4.1) e `readOptions` che smette di leggere dal
  proxy. Ultima perche' e' quella che tocca il picker, cioe' l'unica con resa visibile.
- **Fuori sequenza**: `addSlotValue` (§2.4) — decidere se muore o rinasce, in un chore a parte.

---

## 7. Limiti di questa misura

- **Sola lettura, per vincolo.** Tre affermazioni sono lette nel sorgente e **non esercitate**:
  che una scrittura rifiutata viene riportata come riuscita (§4.2), che la create non passa da
  `set_name` (§4.3), e la divergenza di namespace (§5.1). Ciascuna ha il proprio `file:riga`;
  nessuna ha una sonda.
- **Il perimetro e' la form, non tutto jjodel.** Canvas, JjScript, JjTL e l'importer scrivono
  sul D-graph per vie proprie (`canvasToJjom`, i comandi, l'executor) e non sono in questo
  inventario. `WriteCtx` non pretende di coprirli.
- **`nav.ts` non scrive** e non compare nella tabella: e' navigazione pura.
- **La bozza di `WriteCtx` non e' stata compilata.** E' un tipo in un documento, non un file:
  la firma di `create` in particolare nasconde la traduzione del `seed` nel `json`
  `$`-prefissato, che resta lavoro dell'adapter e va provata quando esiste.
- **I numeri di riga citati dai docstring esistenti sono scivolati.** `createAdapter.ts` e
  `form-engine-contract.md` §5.1 citano `LModelElement.tsx:7153` per il `setTimeout` del
  seeding e `:7095` per la scelta della sottoclasse: misurati su questo HEAD stanno a
  **7188** e **7096**. Il core e' cambiato sotto le citazioni. Non corretti qui — sono file
  fuori perimetro — ma vanno rimessi in bolla da chi tocchera' quei docstring.
- **HEAD si e' mosso durante la lettura** (la sessione parallela committa su
  `editor-v2/` e `jjform/`): i numeri di riga valgono per `217d5c956`.

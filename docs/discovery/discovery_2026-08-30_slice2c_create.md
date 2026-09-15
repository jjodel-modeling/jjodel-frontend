# Discovery — slice 2c: create di istanze nell'instance manager

Data: 2026-08-30. Fase esplorativa di una slice di implementazione (P4): il prompt
porta gia' la specifica, questa e' la misura di **dove** e **con quale primitiva**
si scrive, piu' la risposta al punto aperto 6 del contratto.

## 0. Ipotesi che la discovery sta falsificando

1. «La create di un'istanza si fa con `DObject.new`, come la fa il canvas.» —
   **falsa per il caso contenuto**, e inutilmente povera per quello root.
2. «Il filtro containment-loop e' una regola di sola lettura, da approssimare a
   livello di shape.» — **falsa**: esiste gia' due volte nel core, ed e' per-istanza
   in entrambe.
3. «Il draft puo' scrivere gli attributi in modo sincrono subito dopo la create.» —
   **falsa**: il seeding dei valori e' differito, e il core lo differisce da solo.

## 1. File letti

- `docs/design/design_handoff_instance_node/CRUD Manager Simulation.dc.html` (intero)
- `docs/design/design_handoff_instance_node/form-engine-contract.md`
- `frontend/src/jjform/{shape.ts,index.ts}`
- `frontend/src/components/editor-v2/hooks/{shapeAdapter.ts,shapeDraw.ts}`
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (tipi `MetaclassInfo`)
- `frontend/src/components/abstract/tabs/{InstanceManagerTab.tsx,instanceTable.ts,instanceManagerModel.ts,instanceManagerTab.scss}`
- `frontend/src/components/editor-v2/viewpoint/ir/{formWrite.ts,IRForm.tsx,useFormWidgets.ts}`
- `frontend/src/model/logicWrapper/LModelElement.tsx` (DObject, LValue.get_addObject, get_validTargets, setValueAtPosition, get_fatherList)
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (syncCreateObject)
- `frontend/src/jjscript/executor/commands/instance.ts`
- `frontend/src/joiner/classes.ts` (`LPointerTargetable.getCollection`)

## 2. Findings

### 2.1 La primitiva di create e' `addObject`, non `DObject.new`

`LValue.get_addObject` (`LModelElement.tsx:7035`) e' definita una volta e serve **due**
riceventi: `LModel.addObject` (`:5307`, `get_addObject` che delega a
`LValue.singleton.get_addObject.call(this, c)` a `:5310`) e `LValue.addObject`
(`:7019`). La firma e' `(json, metaclass?, forceCreation?) => LObject`.

Verbatim, `:7134`:

```ts
TRANSACTION(this.get_name(c as any)+'.addObject()', () => {
    let dobj = DObject.new3(constructorPointers, () => { }, isDModel?DModel:DValue, true);
```

e prima, `:7043`:

```ts
father = isContainment ? c.data.id : this.get_model(c).id;
```

Cioe': chiamata su un `DValue` di containment, il padre del nuovo oggetto **e' lo slot**,
e l'append a `slot.values` lo fa il costruttore — `LPointerTargetable.getCollection`
(`joiner/classes.ts:2551`) verbatim:

```ts
case 'DObject': return parentCname === 'DModel' ? 'objects' : (parentCname === 'DValue' ? 'values' : '');
```

Quindi **owner e `children[childKey]` sono scritti dalla stessa chiamata**, e l'invariante
della sezione 2 del contratto (`owner` ridondante con `children`) non ha bisogno di una
seconda scrittura che potrebbe divergere. `DObject.new` (`:5892`) non lo fa: prende
`father`/`fatherType` gia' risolti e non conosce lo slot. `canvasToJjom.syncCreateObject`
(`:1370`) e il comando JjScript `create` (`instance.ts:287`) usano `DObject.new` perche'
creano **solo root** (`fatherType` sempre `DModel`); il commento a `canvasToJjom.ts:1421`
lo dice esplicitamente: il path corretto per un figlio e' «the classic ContextMenu after
`LValue.addObject`, which already auto-appends to parent.values via the containment father».

`forceCreation: true` e' necessario: senza, `:7095` sceglie la sottoclasse per match di
schema (`getInstantiableClasses`), mentre il manager deve istanziare **la metaclasse che
l'utente ha scelto**. Con `forceCreation` la riga `:7093` assegna `constructorPointers.instanceof`
dal parametro e basta.

### 2.2 Il seeding dei valori e' differito dal core stesso

`:7153` verbatim:

```ts
// because at current time Constructor.setPtr actions are not executed yet. so dobject.features is empty, [...]
setTimeout(()=>TRANSACTION(this.get_name(c as any)+'.addObject() initializing values', ()=>{
```

con ritardo `U.UpdatingTimer * 2`. E' la stessa regola che `CLAUDE.md` §9.2 impone a chi
crea e poi scrive. Conseguenza per la slice: **il draft passa i valori come `json` alla
create**, non li scrive dopo. Le chiavi `json` sono risolte contro `lmetaclass.childNames`
(`:7157`-`:7176`), con la variante `$key` prioritaria; una chiave che e' anche proprieta'
di `DObject` — `name` — finisce sia in `constructorPointers.name` (per lo spread
`{...json, father}` a `:7045`) sia nello slot, che e' esattamente il doppio binding
dell'identita' di §3.12.

### 2.3 Il filtro containment-loop esiste gia' due volte, ed e' per-istanza

Lettura (offerta dei candidati), `LValue.get_validTargets` `:7871`:

```ts
let containerObjectsID: Pointer[] = this.get_fatherList(c).map(lm => lm.id);
let validObjects = (isCrossRef ? m1.allCrossSubObjects : m1.allSubObjects)
if (isContainment) validObjects = validObjects.filter(obj => !containerObjectsID.includes(obj.id));
```

Scrittura (rifiuto), `LValue.setValueAtPosition` `:7654`:

```ts
if (info.isContainment) {
    if ((info.fatherList as LPointerTargetable[]).map(father => father.id).includes(val))
        return {success: false, reason: "cannot create a containment loop"};
```

Due fatti che decidono la collocazione:

- il filtro si applica **solo alle feature di containment** (`if (isContainment)`), non a
  ogni reference: una reference non-containment non puo' chiudere un ciclo di contenimento;
- l'input e' `fatherList` (`:559`), la catena dei padri **dell'istanza**, che per un draft
  non esiste ancora. La catena corretta per un draft contenuto e' quella del **proprietario**:
  `owner` piu' i suoi antenati. Questo e' un fatto dell'adapter, che ha l'istanza in mano.

### 2.4 Quello che il manager gia' ha, e che la slice non riscrive

`instanceManagerModel.instancesOfClass` (match esatto su `instanceof`) e
`instanceCountsByClass` danno i siblings e i conteggi; `instanceTable.tableRow` da' la riga
di round-trip; `IRForm` e' gia' montato sul soggetto selezionato. `uninstantiableReason`
gia' porta la causa dell'astratta, con l'idioma «causa a fondo riga» che il prompt chiede
di riusare.

## 3. Dipendenze e rischi

- `addObject` apre la propria `TRANSACTION` e chiama `DObject.new3` dentro: **non va
  avvolta** in una transazione esterna (CLAUDE.md rule 12/§3.3). Nessun file di §3.1 e'
  toccato: il manager non e' sync layer.
- Il seeding differito significa che la riga in tabella compare **subito** (l'oggetto
  esiste) ma i valori arrivano dopo `U.UpdatingTimer * 2`. Un test end-to-end sui valori
  deve attendere; i test unitari della slice sono sul modulo puro e sul filtro, non sul
  timer.
- `LValue.addObject` rifiuta con `Log.ee` se lo slot implementa un attributo (`:7049`) o se
  la metaclasse non estende il tipo dello slot (`:7080`). Entrambi i casi sono esclusi a
  monte dalla shape, ma l'errore e' silenzioso per l'utente: la UI riporta il `null` di
  ritorno come fallimento della create.

## 4. Domande aperte

1. Il `lower > 1` di una feature multivalore non e' soddisfacibile da un draft che offre
   un solo valore. La slice valida `lower >= 1` come «almeno un valore» e lo dichiara,
   invece di bloccare per sempre il commit.
2. Il gate del design «Add Transition non disponibile finche' non esiste uno State»
   (dipendenza fra un ref required e la popolazione di un'altra collezione) e' una regola
   di offerta piu' fine di quella che il prompt chiede; non e' in questa slice.

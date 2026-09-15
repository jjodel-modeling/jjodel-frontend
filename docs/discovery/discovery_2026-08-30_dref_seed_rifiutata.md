# Il seed della DReference rifiutata — misurato, e la via scelta

**Data**: 2026-08-30
**Corsia**: core (`joiner/classes.ts`)
**Prompt**: `docs/prompts/PROMPT_seed_dreference.md`
**Residuo che chiudeva**: `discovery_2026-08-30_dtypedelement_type_resolution.md` §4
**Sorgenti toccati**: `joiner/classes.ts` (un ramo), `joiner/__tests__/dTypedElement.test.ts`
(5 prove nuove). Quattro sonde non committate (`_tmp_dref_seed_measure.ts`,
`_tmp_dref_seed_p2.ts`, `_tmp_dref_seed_p3.ts`, `_tmp_dref_seed_verify.ts`).

---

## 0. Il verdetto in una riga

Il D-graph **tollera** un tipo assente su una DReference — `undefined`, `null` e `''`
atterrano nello store e la sync fa la cosa giusta (non crea l'edge). Il **L-layer no**:
`LTypedElement.get_type` ha un terzo gradino che, quando `data.type` e' falsy, restituisce
**il padre**. Ogni consumatore legge dal L: export Ecore, payload JSON, riga del canvas,
validazione. Sostituire il seed nel solo `Constructors.DTypedElement` sposta il valore
sbagliato di un layer e non cambia **niente** di cio' che si vede.

E' esattamente la condizione di arresto che il prompt aveva scritto: *«Se nessun valore
assente e' tollerato senza fix a valle, fermati e riporta»*. Nessun valore assente lo e',
e la misura e' stata portata ad Alfonso invece che a un diff.

Esiste pero' un candidato **non assente** che passa tutti e tre i test attesi dal prompt
restando dentro il perimetro dichiarato: `Pointer_EOBJECT`. Le due vie, col loro costo,
stanno in §6. **Alfonso ha scelto (B)**, e §8 misura il risultato.

---

## 1. Le due implementazioni dello stesso seed

Il seed «il padre» non e' scritto in un posto solo. E' scritto in due, in due layer, e
finora se ne conosceva uno.

| sito | layer | riga |
|---|---|---|
| `joiner/classes.ts:944` `Constructors.DTypedElement` | D (costruttore) | `case 'DReference': type = this.fatherPtr …` |
| `model/logicWrapper/LModelElement.tsx:1407` `LTypedElement.get_type` | L (getter) | `return LPointerTargetable.fromPointer(c.data.className === 'DReference' ? c.data.father : 'Pointer_ESTRING')` |

Il secondo e' **il piu' importante dei due**, perche' e' quello che i consumatori leggono.
Il primo decide solo che cosa finisce nello store; il secondo decide che cosa vede
chiunque chieda `.type` a un proxy. Finche' il secondo resta, il valore sbagliato
sopravvive a qualunque cambio del primo.

Nota di simmetria: il getter riproduce **anche** l'asimmetria del costruttore, `ESTRING`
per tutto il resto e il padre per una reference. Le due righe sono la stessa decisione,
scritta due volte.

---

## 2. Che cosa tollera il D-graph — misurato

Sonda `_tmp_dref_seed_measure.ts`, blocco B: su una DReference reale si scrive il campo D
con `SetFieldAction.new(refId, 'type', <candidato>, '', true)`, si **attende**, e si
rilegge. La colonna «atterrata» confronta il valore riletto con quello di partenza: senza
di essa la sonda misura quattro volte lo stato precedente, ed e' quello che ha fatto la sua
prima versione (dentro un solo `page.evaluate` il dispatch non ha ancora prodotto lo stato
nuovo). Il referto qui sotto e' la seconda.

| candidato | atterrata | resta nello store | `get_type` risponde | getter derivati |
|---|---|---|---|---|
| `undefined` | si' | `undefined` | **il padre** | `classType=`il padre |
| `null` | si' | `null` | **il padre** | `classType=`il padre |
| `''` | si' | `''` | **il padre** | `classType=`il padre |
| `Pointer_EOBJECT` | si' | `DClass:EObject` | `DClass:EObject` | `classType=EObject` |

Nessuna scrittura ha sollevato eccezioni; **zero errori di pagina** oltre a quello di boot
gia' noto (`failed to get project {project: null}`). `setPtr` ammette per costruzione un
valore falsy — `(this.thiss)[property] = value; if (!value) return;` salta la sola
registrazione di `pointedBy` — quindi l'assenza non e' un caso patologico per il D-layer:
e' gia' raggiungibile oggi, quando una DReference viene costruita senza padre.

**La riga che decide la slice e' la terza colonna contro la quarta.** Il campo D accetta
l'assenza; il getter la annulla.

---

## 3. Che cosa ne fanno i consumatori — misurato

Stessa sonda, blocco C, con i servizi veri importati dal module graph di Vite
(`EcoreService.exportToXML`, `JsonModelService.buildMetamodelDocument`) e le due righe
esatte con cui `jjomTransformers.ts:122,127` costruisce la riga del canvas.

**Controllo positivo prima di leggere qualunque assenza** (CLAUDE.md §5): il documento
Ecore misura 3967 byte, contiene `name="<classe di servizio>"`, contiene
`ecore:EReference`; il payload JSON misura 2044 byte e contiene la classe di servizio. La
prima versione della sonda dava «riga non trovata» su tutte e quattro le righe **senza
controllo**: era il modello sbagliato, non un'assenza.

| candidato | export Ecore | JSON | canvas (`targetClassId`) | sync (edge M2) |
|---|---|---|---|---|
| `undefined` | `eType="#//<il padre>"` | `{"name":"<il padre>"}` | il padre | nessun edge |
| `null` | `eType="#//<il padre>"` | `{"name":"<il padre>"}` | il padre | nessun edge |
| `''` | `eType="#//<il padre>"` | `{"name":"<il padre>"}` | il padre | nessun edge |
| `Pointer_EOBJECT` | `eType="ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject"` | `{"name":"EObject"}` | `Pointer_EOBJECT` | verso EObject, che non ha vertice → nessun edge |

Due letture vanno lette insieme, perche' sono di layer diversi e dicono cose opposte:

- **la sync legge il D** (`useJjomSync.ts:882`, `typeof refObj.type === 'string' ? … : null`,
  poi `if (!targetId) continue`). Sull'assenza fa **gia' la cosa giusta**: non inventa un
  edge. E' l'unico consumatore che oggi non viene ingannato, perche' e' l'unico che non
  passa dal proxy.
- **tutti gli altri leggono il L**, e vedono il padre.

Terzo reperto, fuori dal perimetro e non corretto: `jjscript/executor/commands/validate.ts:280`
controlla `if (!ref.type)` per emettere `MISSING_TYPE`. `validateElement` cammina sui proxy
L, quindi il predicato passa da `get_type`. **Misurato** su una DReference col campo D a
`undefined`: `!l.type === false`. Il controllo `MISSING_TYPE` e' **irraggiungibile**, ed e'
irraggiungibile per la stessa riga che questa slice voleva togliere. Regola 9: dichiarato,
non toccato.

---

## 4. Il round-trip di `Pointer_EOBJECT` — misurato, non argomentato

`api/data.ts:336` porta un ramo di import per l'esatta stringa
`"ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject"`
**commentato via**, e due righe sotto c'e' un `Log.ex(!target, "LinkAllNames() can't find
type target")`. Letto cosi', un `.ecore` che porta EObject non dovrebbe rientrare. Il
commento sopra al ramo morto sostiene il contrario — che `rewriteXPathPointers` riscrive i
tipi di riflessione a monte. Le due letture non si possono arbitrare leggendo.

Sonda `_tmp_dref_seed_p3.ts`: esporta il metamodello con due reference — una tipata
`Pointer_EOBJECT`, una col padre come controllo — e **ri-importa lo stesso XML** con
`EcoreService.importFromXML`.

```
esportate:
  <eStructuralFeatures xsi:type="ecore:EReference" name="rEobj"   eType="ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject"/>
  <eStructuralFeatures xsi:type="ecore:EReference" name="rFather" eType="#//ScratchRT_1788092824834"/>

re-import: success, errors: []

rilette dopo il re-import:
  rEobj   -> type Pointer_EOBJECT              (EObject)
  rFather -> type Pointer1788092828572_USER_143 (la classe reimportata)

errori di pagina: 0
```

Il ramo commentato e' morto perche' il caso e' gia' risolto a monte, come il commento
diceva. **Il round-trip di EObject e' stabile**: esce canonico EMF, rientra
`Pointer_EOBJECT`, zero errori. La riga `rFather` e' il controllo che l'esperimento aveva
segnale.

---

## 5. Censimento dei chiamanti, riverificato su HEAD

Chi puo' raggiungere il ramo del **rifiuto** (un tipo che risolve a `DEnumerator` o
`DDataType` mentre `thiss.className === 'DReference'`), cioe' chi oggi riceve *il padre*
per questa via.

| sito | che cosa passa a una DReference | tocca il rifiuto? |
|---|---|---|
| `api/data.ts:914` parseDReference | `undefined` | no — e' il seed muto, contratto pinnato |
| `jjscript/.../create.ts:473` | `undefined` | no |
| `LModelElement.tsx:4034` duplicate reference | `context.data.type` di una reference esistente | no — puo' essere solo cio' che c'era |
| `components/editor-v2/sync/canvasToJjom.ts:333` | `targetClass.id`, una DClass | no |
| `components/editor-v2/hooks/useClassRemoval.ts:164` | `ref.type?.id ?? ref.__raw?.type` | no — propaga l'esistente |
| `services/JjodieActionExecutor.ts:279` | `targetClass.id` da `findClassByName` | no |
| `EditorV2.tsx:3121`, `ContextMenu.tsx:321` | nessun tipo | no |
| `examples/StateMachine/*`, `examples/RowViewSmoke/index.ts:130` | id di DClass | no |

**Zero chiamanti in albero raggiungono il rifiuto.** Il ramo e' raggiungibile dall'API
pubblica — `lClass.addReference(nome, <id di un enum>)` — e dalla console, ed e' cosi' che
le sonde lo esercitano. Il censimento del 30-08 diceva che nessuno pinnava il valore
sbagliato; riverificato, e' piu' forte di cosi': nessuno ci arriva.

Conseguenza operativa: **il blast radius di cambiare il seed del rifiuto e' zero siti di
chiamata**; cambia il contratto dell'API, non il comportamento di codice esistente. Il
seed del percorso `undefined` — quello da cui dipende il parser Ecore — e' un ramo diverso
e resta intatto in ogni scenario.

---

## 6. Le due vie, col loro costo

### (A) L'assenza — `type` non scritto sul rifiuto

Quello che il prompt chiedeva alla lettera: «un valore che dichiari l'assenza invece di
inventare un bersaglio».

- Il D-layer la tollera (§2), la sync fa gia' la cosa giusta (§3).
- **Non basta**: serve toccare `LTypedElement.get_type` a `LModelElement.tsx:1407`,
  altrimenti export, JSON, canvas e validazione continuano a vedere il padre e la slice
  non cambia un pixel ne' un byte di `.ecore`.
- Il fix a valle non e' una riga: `get_classType` / `get_enumType` / `get_primitiveType`
  fanno `type.isClass` **senza guardia** (`LModelElement.tsx:1360-1372`), e su un `type`
  assente lanciano. Vanno guardati insieme.
- Rischio non misurato, e dichiarato tale: `get_type` **non sa distinguere** «rifiutata» da
  «non ancora scritta». Sono lo stesso `data.type === undefined`. Cambiarlo cambia anche la
  finestra transitoria del parser Ecore, fra `DReference.new(undefined, …)` e la scrittura
  di `.type` subito dopo. Chi legga `.type` in quella finestra oggi riceve il padre; dopo
  riceverebbe l'assenza. Non ho un modo di esercitare l'import Ecore da sonda — e' lo
  stesso limite gia' dichiarato in §8 del referto del 30-08 — quindi **non dichiaro quella
  finestra verificata**.
- Perimetro: 2 sorgenti, uno dei quali core L-layer. Serve il Layer Impact Report (§3.2), e
  il prompt aveva dichiarato «zero file condivisi (`joiner/classes.ts` + test)».

### (B) `Pointer_EOBJECT` — il bersaglio piu' debole, non il contenitore

- Passa **tutti e tre i test attesi** dal prompt: il tipo non e' piu' il padre; e' uniforme
  sulle tre forme di enum; e il `.ecore` non punta piu' al contenitore (§4, con round-trip
  misurato).
- **Zero fix a valle**: il valore e' un classifier vero, quindi `get_type` lo restituisce al
  primo gradino e i tre getter derivati reggono (§2).
- Non tocca la sync: EObject non ha vertice sul canvas, quindi nessun edge; e non ha
  `model` (misurato: `LPointerTargetable.fromPointer('Pointer_EOBJECT').model?.id` e'
  `undefined`), quindi il ramo `targetCrossMM` di `useJjomSync.ts:899` — che cancellerebbe
  edge persistiti — **non scatta**. Misurato `crossMMifEOBJECT: false`.
- Perimetro: 1 sorgente, `joiner/classes.ts`, piu' i test. Esattamente quello dichiarato.
- **Il costo, dichiarato**: EObject e' un bersaglio, non un'assenza. Dice «un oggetto
  qualunque», che nel vocabolario EMF e' la cosa piu' vicina a «bersaglio non specificato»
  che un puntatore a classifier possa dire — ma resta un bersaglio, e il prompt chiedeva
  di non inventarne. E `MISSING_TYPE` (§3) resterebbe irraggiungibile: con EObject la
  reference **ha** un tipo, quindi il controllo non tornerebbe vivo nemmeno per sbaglio.

---

## 7. Perche' mi sono fermato prima di scegliere

La condizione di arresto scritta nel prompt e' verificata alla lettera: nessun valore che
dichiari l'assenza e' tollerato senza un fix a valle, e il fix a valle e' in un secondo
file core di un secondo layer, con una finestra di rischio che non so misurare.

La via (B) non e' esclusa dall'arresto — e' dentro il perimetro e passa i test — ma
sostituisce un bersaglio sbagliato con un bersaglio debole invece che con un'assenza, e
questa e' una scelta di semantica del modello, non una conseguenza della misura. La misura
arriva fin qui e si ferma: **la scelta fra (A) e (B) era di Alfonso**, e la sua risposta e'
stata (B).

Quello che la misura ha gia' deciso, e che vale per entrambe le vie: il seed del rifiuto e'
scritto in **due** posti, e finora se ne conosceva uno.

---

## 8. La via (B), scritta e misurata

Il diff e' un ramo solo, in `joiner/classes.ts`. La condizione nomina **anche** la
className, perche' quel `case 'DReference'` e' pure il `default` dello switch e allargarlo
agli altri typed element non e' cio' che e' stato misurato:

```ts
type = (requested !== undefined && thiss.className === 'DReference')
    ? Defaults.Pointer_EOBJECT
    : (this.fatherPtr as Pointer<DClass> || undefined);
```

`Defaults.Pointer_EOBJECT` e non la stringa: e' la stessa costante con cui `redux/store.tsx`
crea la metaclasse m3.

### 8.1 La tabella dopo

Sonda `_tmp_dref_seed_verify.ts`, che legge ogni riga **al D e al L**.

| input | su | D `__raw.type` | L `.type` | e' il padre? |
|---|---|---|---|---|
| enum id | DReference | **EObject** | **EObject** | no |
| enum name | DReference | **EObject** | **EObject** | no |
| enum proxy | DReference | **EObject** | **EObject** | no |
| nome inesistente | DReference | **EObject** | **EObject** | no |
| datatype id | DReference | *riga saltata* | — | — |
| class id | DReference | Config | Config | no |
| class proxy | DReference | Config | Config | no |
| pointer primitivo canonico | DReference | EInt | EInt | no |
| `undefined` | DReference | **il padre** | **il padre** | **SI** |
| enum id | DAttribute | Palette | Palette | no |
| `undefined` | DAttribute | EString | EString | no |

Verdetti meccanici della sonda: *il rifiuto non e' piu' il padre* **OK**; *il rifiuto e'
uniforme* **OK** (`DClass:EObject` su 4 forme); *`undefined` e' ancora il padre* **OK**.

**La riga saltata e' dichiarata, non nascosta**: `LPackage` non espone `addDataType`, quindi
il DDataType di servizio non e' creabile da sonda e quella riga non e' stata misurata. Il
ramo che avrebbe esercitato — `requested !== undefined` su una reference — e' lo stesso della
riga «nome inesistente», che e' verde; ma il caso specifico `DDataType -> DReference` resta
**pinnato dal solo test statico**, non da una misura.

Le righe di console che nominano `DTypedElement` sono **4**, esattamente i quattro rifiuti
misurati: il rifiuto continua a dichiararsi, e la riga `undefined` resta muta. Errori di
pagina: 1, quello di boot gia' noto.

### 8.2 Il round-trip

```
esportata: <eStructuralFeatures xsi:type="ecore:EReference" name="v1"
             eType="ecore:EClass platform:/plugin/org.eclipse.emf.ecore/model/Ecore.ecore#//EObject"/>
punta al contenitore? no
re-import: ok, errors: []
```
Controllo positivo sullo stesso documento: 4239 byte, contiene `ecore:EReference`.

### 8.3 Le prove

5 test nuovi in `dTypedElement.test.ts`, che diventa 17. **Controllo positivo**: riportando
`classes.ts` a HEAD, **4 dei 5 falliscono**. Il quinto — «EOBJECT e' il puntatore canonico,
non una stringa scritta a mano» — passa anche su HEAD, ed e' corretto che sia cosi': e' un
invariante, non un cambio, esattamente come i 2 su 12 della tornata precedente.

### 8.4 I gate

`npx vitest run` **2013 passed / 0 failed**, +5 esatti sulle 2008 della sessione precedente,
coi 9 file rotti all'import = baseline nota. `npm run typecheck` **33 = baseline su output
completo** (contato sull'output intero, non su una coda), **zero** errori nei due file
toccati. `npm run build` exit 0 col solo chunk-warning. `npm run smoke` **12 passed / 0
failed / 3 skipped** = baseline.

Nota sull'albero: durante i gate una sessione parallela ha committato tre volte
(`28a26fe34`, `09ef17a06`, `d0861186b` — brokenRef sul ramo IR), toccando fra l'altro
`examples/RowViewSmoke/index.ts`, cioe' **il fixture su cui girano queste sonde**. **Zero
file condivisi** col diff di questa slice (verificato su `git diff --name-only`). La sonda
di verifica e i due gate sensibili sono stati **rigirati sull'albero unito**: tabella
identica riga per riga, stessi tre verdetti, stesso round-trip, `vitest` 2013/0 e `smoke`
12/0/3 invariati. Le misure di §8 valgono quindi per l'albero che porta anche il loro
lavoro, non solo per quello di partenza.

### 8.5 Cosa resta aperto, e non e' stato toccato

- `LTypedElement.get_type` gradino 3 (`LModelElement.tsx:1407`) **rimette ancora il padre**
  per ogni `data.type` falsy. Con (B) nessuno ci arriva piu' per la via del rifiuto, ma la
  riga e' li' e vale per la finestra transitoria del parser Ecore. E' la via (A), non
  scelta.
- `validate.ts:280` `MISSING_TYPE` resta **irraggiungibile** (§3), e con (B) lo resta per
  costruzione: una reference rifiutata *ha* un tipo. Regola 9: dichiarato, non rimosso.

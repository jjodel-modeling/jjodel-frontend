# Discovery 2026-08-30 — S1, la prima misura: chi consuma l'unicita' del nome M1

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `62e36b0b6`
**Prompt**: «S1: una regola di uniqueness, in un posto» — prima slice della sequenza WriteCtx
(`b9ca883fc`, §5.1 e §6). Il prompt impone una **misura prima del fix**: il censimento dei
consumatori dell'unicita' del nome, con una condizione di arresto esplicita —
«se **almeno uno** richiede la regola larga → fermati e riporta con l'evidenza: la scelta risale
al design».

**Esito**: **la misura ferma la slice.** Non uno ma **cinque** consumatori vivi richiedono la
regola **class-agnostic**, e tre di essi la richiedono su uno scope **piu' largo di entrambe le
regole esistenti**. Il fix «una regola, un posto» resta la forma giusta, ma **quale** regola non e'
piu' derivabile dal codice: nessuna delle due candidate del referto soddisfa i consumatori
misurati, e allinearsi a 12a **rimuoverebbe** un controllo committato e reso a schermo (Regola 3).
Zero diff di sorgente.

**File letti per intero**: `model/logicWrapper/nameUniqueness.ts`,
`jjform/create.ts`, `jjscript/executor/commands/eval.ts` (§ rilevanti + la doppia passata di
binding), `components/editor-v2/problems/UniquenessProblemSync.tsx`.
**Sezioni lette**: `LModelElement.tsx` 285-340, 5556-5610, 5688-5715, 6220-6320, 7035-7200;
`joiner/classes.ts` 2015-2075, 2150-2200; `jjscript/executor/commands/instance.ts` 95-135,
365-378, 460-495, 543-552, 680-700; `editor-v2/hooks/createAdapter.ts` 140-260;
`editor-v2/hooks/createDraw.ts` 100-170; `abstract/tabs/InstanceManagerTab.tsx` 940-1000;
`jjel/evaluator/context.ts` 140-215; `jjel/evaluator/evaluator.ts` 218-250;
`services/export/{XMIService,EcoreService}.ts` (ricerca mirata su nome-come-chiave).

**Strumento**: `command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep --ignore-files` a cui
`grep` risolve in questa shell (`type grep` → shell function). Ogni asserzione di **assenza** porta
il proprio controllo positivo, dichiarato in linea.

---

## 1. La risposta, in breve

1. **Cinque consumatori vivi risolvono un'istanza M1 per nome, in modo class-agnostic.** Tre di
   essi **scrivono** sulla base di quella risoluzione, e uno **cancella** (§2).
2. **La regola stretta (12a: stessa classe + stesso owner) non basta a nessuno di loro.** Sotto 12a
   un `delete X` di JjScript puo' cancellare un'istanza diversa da quella intesa, e un
   `set A.ref = X` puo' legare il bersaglio sbagliato — silenziosamente, senza errore (§2.1, §2.4).
3. **Ma nemmeno la regola del core basta.** Il binding per nome di JjEL vive sul pool
   `allSubObjects` di **tutti** i modelli M1 del metamodello: uno scope piu' largo del namespace
   del core sia per le radici sia per i contenuti (§2.2). Il core lo copre per le radici e **non**
   per i nidificati di owner diversi.
4. **Le due regole non sono una piu' larga dell'altra: sono ortogonali.** Nessuna delle due
   contiene l'altra, e il referto del 30-08 le descriveva come annidate. Il contro-esempio in
   entrambe le direzioni e' in §3.
5. **Allinearsi a 12a e' una degradazione, non un allineamento.** La regola larga non e' solo
   controllata al rename: e' **resa a schermo di continuo** da `UniquenessProblemSync`, montato
   nella root di EditorV2. Restringerla spegne un badge committato su una classe di duplicati che
   oggi segnala (§2.5, §4).

---

## 2. Il censimento — chi consuma, e cosa gli serve

Perimetro della domanda: chi risolve **un'istanza M1** (non una metaclasse, non una feature) a
partire da un **nome**. `frontend/src/` implicito.

| # | Consumatore | Sito | Scope della ricerca | Class-agnostic? | Owner | Serve la regola larga? |
|---|---|---|---|---|---|---|
| 1 | `findInstanceByName` | `jjscript/executor/commands/instance.ts:108-110` | `model.objects` = le radici | **si'** | radici | **si'** |
| 2 | `resolveInstanceHandle` (5 comandi) | `instance.ts:129`, chiamato a `:372, :461, :547, :692` | idem | **si'** | radici | **si'** |
| 3 | binding «nudo» per nome (JjEL) | `jjscript/executor/commands/eval.ts:321-341` | pool `allSubObjects` di **ogni** modello M1 (`:106-111`) | **si'** | **tutti** | **si', e piu' larga di entrambe** |
| 4 | binding qualificato `Class.Name` | `eval.ts:215-225` | istanze **dirette** della classe, model-wide | no (per-classe) | **tutti** | no, ma **owner-agnostic** |
| 5 | seeding differito degli attributi/riferimenti | `components/project/ProjectEditor.tsx:1888, 1929, 1956` | `lModel.objects` | **si'** | radici | **si'** |
| 6 | badge duplicati sul canvas | `editor-v2/problems/UniquenessProblemSync.tsx:62` → `detectDuplicateNames` | il namespace del core | **si'** | — | rispecchia la regola scelta |
| — | export/import XMI | `services/export/XMIService.ts:303, 344, 1184-1213` | `xmi:id` (pointer, o l'id originale ri-mappato) | — | — | **no** |
| — | I/O Ecore | `services/export/EcoreService.ts` | solo M2 | — | — | **no** |
| — | `Selectors.getByName` / `getByName2` | `redux/selectors/selectors.ts:311, 331` | `DModel`/`DClass`/`DEnumerator`/`DGraph`/`DViewPoint` | — | — | **no, mai M1** |

Vivi, verificato per import e chiamata: `buildEvalContext` ha **quattro** chiamanti
(`eval.ts:30`, `let.ts:125`, `forall.ts:32`, `Jodie/jodieJjelContext.ts:39`);
`UniquenessProblemSync` e' montato a `EditorV2.tsx:4223`.

### 2.1 `findInstanceByName` — una riga, e decide cinque comandi

```
jjscript/executor/commands/instance.ts:108
export function findInstanceByName(model: LModel, instanceName: string): any | null {
    const objects = (model as any).objects ?? [];
    return objects.find((o: any) => o?.name === instanceName) ?? null;
}
```

`.find` **class-agnostic**, **primo che passa vince**, nessun avviso in caso di omonimia.
`model.objects` sono le radici: `addObject` mette `father = this.get_model(c).id` solo quando il
contenitore non e' un containment (`LModelElement.tsx:7055`), quindi i nidificati stanno nei
`values` dello slot e non in `objects`.

I comandi che ci passano sopra, tutti attraverso `resolveInstanceHandle` (che prova prima il
registro di handle di sessione, e **ricade** su questa riga per ogni istanza pre-esistente allo
script — `:129`):

- `delete <nome>` — `:372`. **Distruttivo.**
- `set <nome>.<attr> = …` — `:461` e `:547`.
- `rename <nome> to <nuovo>` — `:461`, piu' il controllo di conflitto a `:475`, che e' esso stesso
  un `findInstanceByName` class-agnostic sulle radici.
- `set <nome>.<ref> = <nomeBersaglio>` — `:692`: **il bersaglio di un riferimento e' risolto per
  nome**, class-agnostic.

Sotto la sola regola 12a (stessa classe + stesso owner) due radici di metaclassi diverse possono
chiamarsi entrambe `X`. Allora `delete X` cancella la prima delle due in ordine di `objects`, e
`set A.ref = X` lega la prima delle due. Nessuno dei due percorsi ha un ramo per l'ambiguita': il
codice non sa che esiste.

### 2.2 Il binding per nome di JjEL — lo scope piu' largo di tutti

Il pool su cui il contesto e' costruito:

```
jjscript/executor/commands/eval.ts:106-111
const m1models: any[] = (metamodel as any).instances || [];
const rawM1Objects: any[] = [];
for (const m of m1models) {
    const objs = (m as any).allSubObjects || (m as any).objects || [];
    for (const obj of objs) rawM1Objects.push(obj);
}
```

`allSubObjects` e' **tutti** i `DObject` del modello, radici e nidificati
(`LModelElement.tsx:5692` → `_getallSub`), e il ciclo lo fa su **ogni** modello M1 del metamodello.

Il binding, e cosa succede all'omonimia:

```
jjscript/executor/commands/eval.ts:329-341
for (const [nm, a] of instancesByName) {
    if (a.length === 1) {
        if (!(nm in variables)) variables[nm] = a[0];
    } else {
        …
        ambiguousInstances.set(nm, { count: a.length, sampleClass });
    }
}
```

Due nomi uguali **non** producono una risoluzione sbagliata: producono la **perdita** del binding
per entrambi, piu' un avviso pedagogico che l'evaluator emette al primo uso
(`jjel/evaluator/evaluator.ts:231-245`, `kind: 'ambiguous-instance'`).

E' il comportamento corretto, ed e' anche la prova che **il progetto ha gia' deciso, altrove, che
l'omonimia fra istanze di classi diverse e' un difetto**: se non lo fosse, questo ramo non
esisterebbe. Lo scope che JjEL vorrebbe unico e' pero' piu' largo del namespace del core: il core
non confronta mai due nidificati di owner diversi.

### 2.3 Il binding qualificato `Class.Name` — per-classe, ma non per-owner

```
jjscript/executor/commands/eval.ts:222-225
for (const [nm, a] of directByName) {
    if (a.length !== 1) continue;   // ambiguous within class -> unbound
    if (nm in classObj) continue;   // structural key wins
    classObj[nm] = a[0];
}
```

`directByName` e' costruito sulle **istanze dirette** della classe, prese dal pool model-wide
(`:215-221`), quindi **senza** filtro di owner. Due `State` chiamati `X` sotto owner diversi
lasciano `State.X` non legato. La regola 12a li **permette** (owner diversi ⇒ non sono siblings),
quindi 12a non basta nemmeno alla forma qualificata, che pure e' quella «per-classe».

### 2.4 Il seeding differito di `ProjectEditor` — un consumatore che scrive

Il pattern di CLAUDE.md §9.2, in produzione:

```
components/project/ProjectEditor.tsx:1888
const lObject = objects.find((o: LObject) => o.name === pending.objectName);
…
:1956
const targetLObj = objects.find((o: LObject) => o.name === targetName);
const targetRealId = targetLObj.id;
feature.setValueAtPosition(ri, targetRealId, { isPtr: true });
```

Class-agnostic su `lModel.objects`. La seconda riga **scrive un puntatore** verso l'oggetto trovato
per nome: un'omonimia fra radici di classi diverse non da' un errore, da' un riferimento che punta
altrove. Lo stesso pattern e' documentato come canonico in `examples/RowViewSmoke/index.ts:206`.

### 2.5 Il badge duplicati — la regola larga e' gia' resa a schermo

```
editor-v2/problems/UniquenessProblemSync.tsx:11-13 (intestazione)
 * Duplicates never arise via LObject.set_name / set_father (hard-blocked …),
 * so this producer exists specifically to surface pre-existing duplicates
 * loaded from the model or introduced by paths that bypass setters.
```

«paths that bypass setters» **e' il percorso di create**. Cioe': il duplicato che la create produce
oggi **viene gia' segnalato** dal canvas, con la regola larga, a ogni cambio della firma
`id:name:father` su tutti i `DObject` (`:45-55`). Non e' un difetto invisibile: e' un difetto
visibile che due superfici raccontano in modo diverso — il manager lo accetta, il canvas lo marca.

### 2.6 Le assenze, con il loro controllo positivo

- **`Selectors.getByName`/`getByName2` non e' mai usato su `DObject`.** Censimento del primo
  argomento su tutto `src`: 8 chiamate con una classe D, e sono
  `DClass ×2`, `DEnumerator ×3`, `DGraph`, `DModel`, `DViewPoint`. Controllo positivo: lo stesso
  comando (`command grep -rn "getByName(D" src`) restituisce **8** righe; la ricerca ristretta a
  `getByName(DObject` esce con **exit 1** e zero righe. La ricerca ha segnale, il soggetto non c'e'.
- **XMI non usa il nome come chiave per le istanze.** Le referenze sono scritte e risolte per
  `xmi:id` (`:303, :344`, e la risoluzione a `:1184-1213`, che dichiara **non supportati** i path
  EMF `//@feature.idx`). L'unica mappa `nameToId` del file (`:892`) e' sui **letterali di enum**
  (M2), non sulle istanze.
- **Ecore e' M2.** Ricerca mirata su `objects|DObject|M1|instance` in `EcoreService.ts`: le uniche
  occorrenze sono `instanceClassName` e `XMLSchema-instance`. Nessun percorso M1.

---

## 3. Le due regole non sono annidate: sono ortogonali

Il referto del 30-08 §5.1 le descrive come «il core su tutti i fratelli, il motore sui soli
fratelli di stessa metaclasse», che suggerisce l'annidamento. La lettura dei due namespace dice
altro.

**Core** — `nameUniqueness.getSiblingNamespace:51-73`:

| caso | namespace |
|---|---|
| radice (`father` e' il `DModel`) | `father.allSubObjects` — **tutti** i `DObject` del modello, radici **e** nidificati, qualunque classe |
| nidificato (`father` e' la `DValue`) | gli `LObject` **dello stesso slot**, qualunque classe |

**Motore** — `createDraw.instancesUnder:124-143` + `ownerOf:145-152`, alimentato con
`new Set([classId])` da `siblingNames:158-167`:

| caso | namespace |
|---|---|
| radice (`ownerId === null`) | le istanze **della stessa classe** il cui owner e' null |
| nidificato | le istanze **della stessa classe** sotto **lo stesso owner OGGETTO** — `ownerOf` fa **un salto** attraverso lo slot e ritorna il `DObject` proprietario, quindi il namespace **attraversa gli slot diversi dello stesso owner** |

Due contro-esempi, in direzioni opposte, entrambi leggibili nelle righe sopra:

- **Il core rifiuta, il motore accetta.** `State` chiamato `X` e `Transition` chiamato `X`, nello
  **stesso** slot di containment. Core: stesso slot ⇒ collidono. Motore: classi diverse ⇒ non sono
  siblings.
- **Il motore rifiuta, il core accetta.** Due `State` chiamati `X` in **due slot diversi dello
  stesso owner**. Motore: stessa classe, stesso owner ⇒ collidono. Core: slot diversi ⇒ namespace
  diversi.

Nessuna delle due contiene l'altra. «Allineare il core al motore» non e' quindi un restringimento
di una regola sola: e' la sostituzione di una regola con un'altra che **permette** cose che oggi
sono rifiutate **e ne rifiuta** altre che oggi passano. Sono due cambi di comportamento, non uno.

Terza asimmetria, gia' nel referto e qui confermata: il motore usa **un** `classId`
(`createAdapter.draftContext` → `classIdOf(modelId, cls.key)`), senza chiusura sulle sottoclassi.
Due istanze di `State` e di `SubState extends State` con lo stesso nome sotto lo stesso owner
passano entrambe le regole del motore, e `Class.Name` di JjEL le vede comunque come **una**
collisione, perche' `allInstances` include le sottoclassi (`eval.ts:186-206`).

---

## 4. Perche' la scelta risale al design, e non al codice

Il prompt prevedeva due esiti. Nessuno dei due si e' verificato in forma pura.

- **«Nessun consumatore richiede la regola larga → vince 12a»**: falsificato. Cinque la richiedono,
  e due lo fanno su percorsi che **scrivono** o **cancellano**.
- **«Almeno uno la richiede → la scelta risale al design»**: verificato, **ma con un reperto in
  piu' che il prompt non prevedeva**: il consumatore piu' esigente (§2.2) chiede uno scope che
  **nemmeno il core copre**. Adottare la regola del core non chiude il punto: lo chiude per le
  radici e lo lascia aperto per i nidificati di owner diversi.

Restano tre vincoli che il design deve pesare, e che sono misure, non opinioni:

1. **Regola 3 — comportamento committato.** La regola larga non e' solo un `if` nel core: e' resa
   a schermo di continuo da `UniquenessProblemSync` (§2.5). Restringerla a 12a spegne un badge che
   oggi si accende. E' una degradazione, quale che sia il merito della regola stretta.
2. **La forma del fix regge comunque.** «Una regola, un posto», con la create che smette di saltare
   la verifica e dichiara `{ok, reason}`, e' indipendente da **quale** regola si sceglie: la
   funzione unica esiste gia' (`validateNameUniqueness`), ed e' gia' consumata da tre siti (rename,
   reparent, badge). Manca il quarto, la create — che oggi passa da `constructorPointers` →
   `DObject.new3` (`createAdapter.ts:210, 234, 238` → `LModelElement.tsx:7055, 7135`) e non
   attraversa mai `set_name`.
3. **Nessuna migrazione, in ogni caso.** I duplicati esistenti restano leggibili: `detectDuplicateNames`
   li dichiara gia' oggi, e nessuno dei percorsi letti riscrive un nome per conto proprio.

### Le tre forme che la decisione puo' prendere

Non ratificate — sono l'ordine del giorno, non una proposta preferita dal referto.

- **(A) Il core vince, il motore si allinea.** `siblingNames` smette di filtrare per classe e
  diventa il namespace di `getSiblingNamespace`. Chiude §2.1, §2.5 e §3 primo contro-esempio;
  **non** chiude §2.2 e §2.3 (nidificati di owner diversi, e `Class.Name` cross-owner). Costo: il
  motore perde la purezza sul punto, o l'adapter gli passa il namespace gia' risolto — che e'
  esattamente la `siblings(id | ownerId)` su `ReadCtx` proposta dal referto §5.1.
- **(B) Il namespace del pool.** Una sola regola su tutto il modello M1, class-agnostic e
  owner-agnostic: lo scope che JjEL gia' assume. Chiude tutti e cinque i consumatori. E' pero' il
  vincolo **piu' stretto sull'utente** — vieta due `Member` chiamati `John` in due `Family`
  diverse, che e' un modello legittimo in Families.ecore.
- **(C) Due regole dichiarate, una sola implementazione.** Il namespace resta quello del core, e i
  consumatori che vogliono di piu' (JjScript, JjEL) **dichiarano l'ambiguita'** invece di
  risolverla — cioe' `findInstanceByName` guadagna il ramo che `buildEvalContext` ha gia'
  (`a.length !== 1 ⇒ non risolvere`). Non e' una terza regola: e' la stessa, piu' un rifiuto
  esplicito dove oggi c'e' un `.find` muto.

L'opzione (C) e' l'unica che non tocca cosa l'utente puo' nominare, e l'unica che rende
**dichiarato** il rifiuto invece che silenzioso — che e' la stessa forma di §4.2 del referto
(`WriteResult.reason` al posto di un `boolean`). E' anche l'unica che chiede lavoro fuori dal
perimetro di S1.

---

## 5. Limiti di questa misura

- **Sola lettura, per scelta della slice.** Nessuna sonda a runtime: le cinque righe di risoluzione
  per nome sono **lette nel sorgente**, non esercitate. In particolare non sono stati costruiti a
  schermo i due contro-esempi di §3, ne' il `delete X` ambiguo di §2.1. Il prompt li chiede come
  test **della fase 2**, che non e' iniziata.
- **Il perimetro e' l'istanza M1.** Il censimento non copre l'unicita' dei nomi M2 (classi,
  feature, package), che ha una regola propria — la `set_name` base di
  `joiner/classes.ts:2166-2181`, su `father.children`, class-agnostic — e i suoi consumatori
  (`_impl_getByName`, `getByFullPath`, l'export Ecore) non sono stati mappati.
- **`getByPath`/`getByFullPath` letti ma non classificati.** `classes.ts:2025-2035` risolve per
  accesso a proprieta' (`curr[arr[0]]`), quindi dipende dal proxy handler e non da un `.find` per
  nome; non e' stato tracciato fino in fondo perche' il punto di ingresso
  (`LModelElement.tsx:302`) parte da un `DModel`, non da un'istanza.
- **Il numero di riga vale per `62e36b0b6`.** Il referto di ieri avvertiva che HEAD si muove sotto
  le citazioni; le sue righe su `LModelElement.tsx` sono state ricontrollate una per una e in
  questo referto sono ri-misurate, non ricopiate.

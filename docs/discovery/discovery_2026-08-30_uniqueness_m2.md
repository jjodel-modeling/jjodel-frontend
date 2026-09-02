# L'unicita' dei nomi a M2 — la regola, i consumatori, la divergenza

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `d50b299a0`
**Prompt**: «Discovery: l'unicita' dei nomi a M2»
**Perimetro che chiude**: `discovery_2026-08-30_s1_uniqueness_consumatori.md` §5, secondo
punto («il censimento non copre l'unicita' M2, che ha una regola propria e i suoi consumatori
non sono stati mappati»)
**Sorgenti toccati**: **nessuno**. Una sonda non committata,
`frontend/scripts/smoke/_tmp_m2_uniqueness.ts` (20 check, **ALL GREEN**, zero errori di pagina).

---

## 0. Il verdetto in cinque righe

1. A M2 ci sono **tre** regole di unicita', non una: quella del core (`classes.ts:2166`, sui
   `father.children`, **case-sensitive**), quella di `LModel.set_name` (i nomi dei modelli,
   globale), e quella di JjScript `rename` (`rename.ts:138`, **per-kind e case-insensitive**,
   su un percorso che **non passa dal core**).
2. **La create non ne applica nessuna.** `addClass`, `addEnumerator`, `addPackage`,
   `addAttribute`, `addReference`, `addOperation`, `addLiteral` chiamano `D*.new` diretto.
   Misurato: due classi `DupProbe` nello stesso package, e un attributo e una reference
   `dupfeat` nella stessa classe.
3. **La divergenza di S1 esiste identica a M2**, e nella stessa direzione: la create accetta
   cio' che il rename, subito dopo, rifiuta. Misurato in una sola corsa.
4. **`defaultname` a M2 puo' produrre duplicati** per due ragioni distinte: una strutturale
   (i `DDataType` non sono in `pkg.children`, quindi `datatype_0` due volte, sempre) e una di
   propagazione (quattro `addClass()` nello stesso tick danno quattro `Concept_0`; a tick
   separati danno `Concept_1..3`).
5. **Il badge non copre M2**: `detectDuplicateNames` cammina `model.allSubObjects` e
   `UniquenessProblemSync` scarta ogni `className !== 'DObject'`. Misurato: registro vuoto
   con quattro duplicati M2 in campo.

E un reperto che vale da solo: **`LModel.getClassByName` e `getEnumByName` ritornano sempre
`null`** — anche su un nome unico. Misurato, con controllo positivo (§4.1).

---

## 1. La regola del core: `father.children`, case-sensitive, class-agnostic

`LPointerTargetable.set_name` (`joiner/classes.ts:2166-2191`) e' l'unico gate M2:

```ts
const father = (c.proxyObject as LModelElement).father;
if (father) {
    const check = (father as LModelElement).children?.filter((child) =>
        child.id !== c.data.id && (D.fromPointer(child.id) as DNamedElement).name === name);
    if (check.length > 0) { toast.error(`Element name "${name}" is already taken in this scope`, …); return true; }
}
```

Tre proprieta', tutte load-bearing:

- **Il namespace e' `father.children`**, cioe' quello che il padre dichiara come figli —
  non «i fratelli» in senso generico.
- **Il confronto e' esatto**: `name === name`, case-sensitive.
- **Il rifiuto ritorna `true`.** Il chiamante non distingue «scritto» da «rifiutato»: la
  refusal e' solo un toast. E' la stessa forma che S2 sta sostituendo con `WriteResult`.

### 1.1 Chi eredita questa `set_name`, e chi la sovrascrive

`command grep -rn "set_name"` su `frontend/src` ritorna 27 righe. Le definizioni sono 7:

| sito | classe | che cosa fa |
|---|---|---|
| `joiner/classes.ts:2166` | `LPointerTargetable` (base) | **la regola M2** |
| `joiner/classes.ts:2852` | `LUser` | nessun controllo |
| `joiner/classes.ts:3259` | `LProject` | nessun controllo |
| `LModelElement.tsx:3137` | `LClass` | `super` + `SetRootFieldAction('ClassNameChanged.…')` |
| `LModelElement.tsx:4323` | `LAttribute` | `super` + inferenza del tipo dal nome |
| `LModelElement.tsx:5522` | `LModel` | **regola propria**: nome unico fra **tutti** i modelli dello store |
| `LModelElement.tsx:6230` | `LObject` | la regola M1 (`nameUniqueness.ts`) |

Quindi ogni elemento M2 che non sia un `DModel` — package, classi, enum, datatype, attributi,
reference, operazioni, parametri, literal — passa dalla riga 2166, `LClass` e `LAttribute`
inclusi (entrambi chiamano `super` per primo).

### 1.2 I namespace concreti, letti dai `get_children_idlist`

| elemento rinominato | padre | `children` = | esclude |
|---|---|---|---|
| DClass, DEnumerator, DPackage | DPackage | annotations + **subpackages + classes + enumerators** (`LModelElement.tsx:1961`) | **i `DDataType`** |
| DAttribute, DReference, DOperation | DClass | annotations + **attributes + references + operations** (`:3129`) | le feature **ereditate** |
| DParameter | DOperation | annotations + exceptions + parameters (`:2424`) | — |
| DEnumLiteral | DEnumerator | annotations + literals (`:4756`) | — |
| DPackage di primo livello | DModel | annotations + packages (metamodello) (`:5540`) | — |
| DDataType | DPackage | **non compare in nessun `children`** | se stesso |

Due buchi strutturali, entrambi misurati in §3: i `DDataType` non sono figli di nessuno ai
fini del nome, e la classe non guarda le feature che eredita.

---

## 2. La create: nessuna regola, in nessun punto

`get_addClass` / `get_addEnumerator` / `get_addPackage` (`LModelElement.tsx:1870-1894`) e i
loro omologhi su `LClass` non hanno alcun controllo: costruiscono e basta.

```ts
protected get_addClass(context: Context): this["addClass"] {
    return (name?, …) => LPointerTargetable.fromD(DClass.new(name, …, context.data.id, true));
}
```

Le altre vie di create M2 sono JjScript (`jjscript/executor/commands/create.ts:302, 414, 473,
582, 669, 706`, tutte `D*.new` dirette) e l'import Ecore (§4.5). **Controllo positivo della
ricerca**: `command grep -rnE "already exists|DUPLICATE|already taken" jjscript/` ritorna 13
righe — quindi il grep ha segnale — e **nessuna** di esse sta in `create.ts`.

Misura, sul metamodello vivo del fixture RowViewSmoke:

| azione | esito |
|---|---|
| `pkg.addClass('DupProbe')` ×2 | **due** DClass `DupProbe` |
| `pkg.addClass('FreeProbe')` (controllo negativo) | una sola, come atteso |
| `cls.addAttribute('dupfeat')` + `cls.addReference('dupfeat')` | **entrambe**, stesso nome, stessa classe |

---

## 3. La divergenza create/rename, misurata in una corsa

Il contro-esempio che S1 costruisce a M1 e' costruibile a M2 **in tre forme**, tutte nella
stessa esecuzione, che e' la forma «per contrasto» che il precedente impone.

| # | costruito con la create | ripetuto col rename | verdetti |
|---|---|---|---|
| 1 | due `DupProbe` nello stesso package: **accettato** | `FreeProbe`.name = `'DupProbe'`: **rifiutato**, il nome resta `FreeProbe`, i `DupProbe` restano 2 | **divergono** |
| 2 | attributo `dupfeat` + reference `dupfeat` nella stessa classe: **accettato** | `freefeat`.name = `'dupfeat'`: **rifiutato**, il nome resta `freefeat` | **divergono** |
| 3 | classe e `DDataType` omonimi nello stesso package | classe.name = `'DtProbe'` (nome di un DDataType): **accettato**, ora coesistono | **concordano, entrambe permissive** |

La riga 3 e' il buco di §1.2: `pkg.children` non elenca i datatype. **Controllo positivo**:
nella stessa misura `pkg.__raw.datatypes` conta **3** e la composizione di `pkg.children` per
className e' `{DClass: 13, DEnumerator: 2}` — zero `DDataType`. L'assenza e' misurata contro
una presenza.

Nota sul canale del rifiuto: le righe di console `already taken in this scope` sono **0**.
Il rifiuto arriva solo come toast in UI (`toast.error`), non passa dalla console: chi guarda
i log non lo vede, e chi chiama il setter riceve `true`.

---

## 4. I consumatori — la matrice

Perimetro: chi risolve un elemento **M2** (classificatore o feature) a partire da un **nome**.
`frontend/src/` implicito. Le righe misurate portano il valore letto sul campo con due
`DupProbe` in campo.

| # | consumatore | sito | pool | case | omonimia: chi vince | assume unicita'? |
|---|---|---|---|---|---|---|
| 1 | `LModel.getClassByName` / `getEnumByName` | `LModelElement.tsx:5760-5767` → `_impl_getByName:5768` | `classes` / `enumerators` del modello | insensitive (per intenzione) | **nessuno: ritorna sempre `null`** (§4.1) | — |
| 2 | chiavi `$nome` sugli array nominati | `U.toNamedArray` (`U.tsx:2081`), `U.mergeNamedArray` (`:2030`) | la collezione | sensitive | **l'ULTIMO** (misurato) | si', silenziosamente |
| 3 | `Selectors.getByName2` | `selectors.ts:311` | **tutto `idlookup`**, filtrato per className | insensitive di default | **il PRIMO** in ordine di `idlookup` (misurato) | si', silenziosamente |
| 4 | `Selectors.getByName` → `getByField` | `selectors.ts:331, 336` | tutti i D di quella classe | insensitive | **il PRIMO** (misurato) | si', silenziosamente |
| 5 | `Constructors.resolveClassifier` (il tipo per nome) | `classes.ts:880` | via `getByName2` | insensitive | come 3 | si' |
| 6 | `LTypedElement.get_type` gradino 2 | `LModelElement.tsx:1388, 1395` | `model.getClassByName`/`getEnumByName`, **oppure** `Selectors.getByName` se `model` e' null | insensitive | vedi 1: con `model` presente **non risolve mai** | si' |
| 7 | JjScript `resolveByNameInMetamodel` | `jjscript/executor/resolvers.ts:154-190` | **tutto il metamodello**, ricorsivo su 10 collezioni | **insensitive** | il PRIMO, `results[0]` | si', e su un pool piu' largo di ogni regola |
| 8 | JjScript `findClassInMetamodel` | `resolvers.ts:63-92` | `metamodel.classes` + i package | **insensitive** | il PRIMO | si' |
| 9 | JjScript `rename` M2 — `checkNameConflict` | `commands/rename.ts:138-172` | `element.parent.<collezione per kind>` | **insensitive** | rifiuta | e' una **regola**, non un lettore (§4.2) |
| 10 | `LModel.getClassByNameSpace` | `LModelElement.tsx:5747-5757` | `pkg.classes` del package con quell'uri | sensitive | il PRIMO (`filter(...)[0]`) | si' |
| 11 | import Ecore, risoluzione `#//Nome` | `api/data.ts:296-304` (`nameMap`) | il documento in corso di parse | sensitive | **l'ULTIMO** (misurato, §4.5) | si', con un warning |
| 12 | IR authoring, endpoint per nome | `editor-v2/viewpoint/ir/irInteraction.ts:138-139` | `edgeClass.references` | sensitive | il PRIMO | si' |
| 13 | JjTL, classe target per nome | `jjtl/executor/jjodelConverter.ts:425` | `metamodel.classes` | sensitive | il PRIMO | si' |
| 14 | Jodie, classe per nome | `services/JjodieActionExecutor.ts:614` | `project.classes` — **cross-metamodello** | sensitive | il PRIMO | si', su un pool ancora piu' largo |
| 15 | Documentation service | `services/DocumentationService.ts:853, 869` | `classes` / `attributes` | sensitive | il PRIMO | si' |
| — | export Ecore | `LModelElement.tsx:1834-1835` (`generateEcoreJson`) | — | — | **scrive entrambi** (misurato: 2 occorrenze di `"DupProbe"`) | no, li propaga |
| — | outline / rail | `TreeViewSidebar/`, `editor-v2/panels/` | — | — | — | **no**: nessuna risoluzione per nome. **Controllo positivo**: lo stesso grep su quei percorsi trova `M1PropertiesPanel.tsx:83` (`l.name === attr.value`), quindi aveva segnale |

**Il reperto di sintesi**: i due risolutori piu' usati **scelgono duplicati opposti**. Con due
`DupProbe`, `Selectors.getByName2` ha restituito il **primo** (`…_118`) e la chiave
`pkg.classes.$DupProbe` il **secondo** (`…_119`). Nessuno dei due dichiara l'ambiguita'.

### 4.1 `getClassByName` e `getEnumByName` non risolvono mai — misurato

```ts
_impl_getByName(collection, name, caseSensitive = false) {
    name = name.trim();
    if (collection[name]) return collection[name];        // <- chiave NUDA
    …
    for (let k of Object.keys(collection)) collection[k.toLowerCase()] = collection[k];
    return collection[name.toLowerCase()] || null;
}
```

Le collezioni sono costruite da `U.toNamedArray` / `U.mergeNamedArray`, che scrivono
**`"$" + name`**. `collection['FreeProbe']` e' quindi `undefined`; il giro in minuscolo
produce `'$freeprobe'`, non `'freeprobe'`; il ritorno e' `null`.

| chiamata | risultato |
|---|---|
| `mm.getClassByName('DupProbe')` (nome omonimo) | `null` |
| `mm.getClassByName('FreeProbe')` (**nome unico**) | `null` |
| `mm.getClassByName('$FreeProbe')` — **controllo positivo** | `Pointer…_120`, la classe giusta |

Il controllo positivo e' la meta' che rende la misura una misura: la funzione non e' rotta in
generale, e' la convenzione della chiave a non combaciare. Due chiamanti in albero ne
dipendono: `get_type` gradino 2 (`LModelElement.tsx:1388, 1395`) e
`components/editors/views/data/edgeCandidate.ts:59`. **Dichiarato, non corretto** (regola 9);
il referto gemello di oggi (`discovery_2026-08-30_gettype_finestra_parser.md` §7) lo cita come
vincolo per chi tocchera' `get_type`.

### 4.2 JjScript `rename`: una seconda regola, che non passa dal core

`commands/rename.ts:79-118` risolve l'elemento, chiama `checkNameConflict`, e poi scrive:

```ts
TRANSACTION('JjScript: Rename element', () => { SetFieldAction.new(element, 'name', newName); });
```

E' una **scrittura diretta sul campo D**: `set_name` non viene mai invocata, quindi la regola
del core non gira su questo percorso. L'unico gate e' `checkNameConflict`, che sceglie la
collezione dei fratelli **per kind** e confronta in **minuscolo**.

Il predicato, ricostruito sui proxy vivi dentro la sonda (dichiarato: e' il predicato, non il
comando — l'esecutore JjScript non e' raggiungibile dal global):

| caso | fratelli visti | verdetto JjScript | verdetto del core |
|---|---|---|---|
| attributo → `'DUPFEAT'` con un `dupfeat` presente | 2 (`parent.attributes`) | **conflitto** | **accetta** (case-sensitive) |
| classe → `'dupprobe'` con `DupProbe` presente | 18 (`parent.classifiers`) | **conflitto** | **accetta** |
| package → un nome qualunque | **0** (`parent.subPackages`) | mai conflitto | dipende dai `children` |

Le prime due righe sono la divergenza di case, misurata nei due sensi. La terza e' un ramo
morto: il getter e' `subpackages` / `allSubPackages`, `parent.subPackages` e' `undefined`,
`siblings` resta `[]`. **Controllo positivo**: gli altri due rami dello stesso predicato, sulla
stessa esecuzione, restituiscono 2 e 18 fratelli — la ricostruzione ha segnale, e' il ramo
package a non averne.

Reperto sulla forma di `element.parent`, contro l'attesa: `parent` **non** e' l'array grezzo
del campo D (`DPackage.parent: Pointer[] = []`), ma un oggetto con `classifiers` —
`isArray: false, hasClassifiers: true` misurato. Il predicato e' quindi vivo per classi,
enum, feature e literal, e morto solo per i package.

### 4.3 `LModel.set_name`: la terza regola, e la piu' larga

`LModelElement.tsx:5522-5540` confronta il nuovo nome con **tutti** i modelli di
`state['models']` — M1 e M2 insieme, nessuno scope di progetto. Rifiuta con un toast e, a
differenza della base, **non scrive nulla e non lo dice al chiamante** (ritorna `true` in
entrambi i rami). Non e' stato esercitato dalla sonda: **dichiarato non misurato**.

### 4.4 Il badge

`UniquenessProblemSync.tsx:47-55` costruisce la firma di reattivita' scartando
`raw.className !== DObject.cname`, e `detectDuplicateNames` (`nameUniqueness.ts:174-187`)
cammina `model.allSubObjects`. Entrambi M1-only per costruzione.

Misurato: con due `DupProbe`, due `dupfeat`, due `datatype_0` e quattro `Concept_0` in campo,
`window._jjNodeProblems` e' **vuoto**. Nessun `duplicate-name`. **Controllo positivo del
metodo**: la stessa lettura, nella sonda S1a del 30-08, aveva registrato un `duplicate-name`
su un duplicato M1 fabbricato — il registro non e' inerte, e' M1-only.

### 4.5 L'import e l'export Ecore

L'import **accetta** due `EClass` omonime e le tiene distinte; l'unico segnale e' un warning:

```
api/data.ts:303   else Log.w(!!nameMap[typeprefix + name], "found 2 elements with same name", …);
api/data.ts:304   nameMap[typeprefix + name] = dobj;      // sovrascrive
```

La riga 304 e' quella che decide: **l'ultimo omonimo vince** la risoluzione di ogni
`eType="#//Nome"`, `extends`, `eOpposite` del documento.

Misurato su un `.ecore` con due `EClass Twin` (una con `markerA`, l'altra con `markerB`) e un
`Pointer2Twin.toTwin` con `eType="#//Twin"`:

| | |
|---|---|
| elementi prodotti | 8, nessun errore |
| classi `Twin` | **2**, distinte (`[markerA]`, `[markerB]`) |
| `toTwin.type` risolve a | **la seconda** (indice 1) |
| righe `found 2 elements with same name` | **1** |

Sul lato export, `mm.crossEcore` del metamodello con due `DupProbe` contiene **2** occorrenze
di `"DupProbe"` (e `"FreeProbe"`, controllo positivo che il documento e' quello giusto): il
round-trip conserva il duplicato e sposta la scelta sul re-import, dove vince l'ultimo.

E il posto dove il conflitto *dovrebbe* essere risolto esiste ed e' vuoto:
`EcoreParser.fixNamingConflicts` (`api/data.ts:412`) e' `{ // todo:4 final }`.

---

## 5. `defaultname` a M2 — due modi di produrre un duplicato

`DPointerTargetable.defaultname` (`classes.ts:1454-1471`) incrementa un suffisso finche' il
nome non e' fuori da `lfather.childNames`, cioe' **lo stesso namespace del rename**. In teoria
create-senza-nome e rename concordano. In pratica no, per due ragioni diverse.

**(a) Strutturale — i `DDataType`.** Il padre e' il package, e `pkg.children` non elenca i
datatype (§1.2). Due `DDataType.new(undefined, pkgId)` prendono **entrambi `datatype_0`**, e
lo prenderanno sempre, a qualunque distanza di tempo. Misurato.

**(b) Di propagazione — tutto il resto.** `childNames` legge `context.data.classes`, che si
popola con la `SetFieldAction` del `_persistCallback`: nello stesso tick non e' ancora li'.
Misurato, con il contrasto nella stessa corsa:

| | nomi ottenuti |
|---|---|
| quattro `pkg.addClass()` nello **stesso** `evaluate` | `Concept_0, Concept_0, Concept_0, Concept_0` |
| tre `pkg.addClass()` in **tick separati** (2.5 s) | `Concept_1, Concept_2, Concept_3` |

La seconda riga e' il controllo che la regola funziona: il duplicato di (b) e' la latenza di
CLAUDE.md §9.2, non la regola. Ma e' raggiungibile da ogni percorso che crea in batch — un
import, un seeding, una macro JjScript, un `applyCreate` multiplo.

Questo corregge in parte quanto S1a §2.2 dichiarava («per un root il namespace coincide con
quello del core»): coincide **come insieme**, non **come istante**.

---

## 6. Le risposte alle quattro domande, in breve

1. **Qual e' la regola oggi e dove vive.** Il core: `classes.ts:2166`, su `father.children`,
   case-sensitive, class-agnostic *dentro quella lista*, applicata **solo al rename**. Piu'
   due regole che non ne dipendono: i nomi dei modelli (`LModelElement.tsx:5522`) e JjScript
   `rename` (`rename.ts:138`, per-kind e case-insensitive, che scrive bypassando `set_name`).
   Create e rename **non concordano**.
2. **I consumatori.** Quindici siti in albero risolvono per nome a M2 (§4). Tutti assumono
   unicita'; nessuno dichiara l'ambiguita'. Due di loro, sullo stesso duplicato, scelgono
   elementi **diversi**. Uno — `getClassByName` — non risolve mai, nemmeno senza ambiguita'.
3. **La divergenza esiste anche a M2**, in tre forme, misurate per contrasto (§3).
4. **`defaultname` a M2 puo' duplicare** in due modi (§5), e il badge **non copre M2** (§4.4).

---

## 7. Proposta di slice, con costo e rischio

Non ratificata: e' l'ordine del giorno. Le tre forme sono ordinate per costo crescente, e la
prima e' indipendente dalle altre due.

### (M2-a) Chiudere i due buchi del namespace — costo minimo, nessuna scelta di design

1. `LPackage.get_children_idlist` (`LModelElement.tsx:1961`) aggiunge `context.data.datatypes`.
   Chiude la riga 3 di §3 e il caso (a) di §5 in una riga. **Rischio**: `children` e'
   consumato anche da `defaultname` e dal Tree View; un datatype in piu' nella lista dei figli
   di un package e' semanticamente corretto (lo e' gia' in Ecore) ma **cambia** cio' che quei
   due mostrano. Da misurare prima di scrivere.
2. `fixNamingConflicts` (`api/data.ts:412`) smette di essere uno stub, o viene rimossa
   dichiarando che l'import accetta i duplicati. Oggi il suo nome promette una cosa che non
   fa, che e' il modo in cui questo difetto e' rimasto invisibile.

### (M2-b) Una regola, un posto — la forma di S1a portata a M2

`nameUniqueness.ts` e' M1-only per costruzione (`LObject`, `allSubObjects`, `DValue`). La
forma da riusare non e' il modulo, e' il **disegno**: `getNamespaceOf(father)` +
`checkNameUniqueness({father, name, excludeId}) → {ok, reason}`, con il namespace M2 che e'
gia' scritto in un posto solo (`get_children_idlist`). I consumatori diventerebbero tre:
`set_name` (rename, gia' li'), i sette `add*` del layer L (create), e JjScript `rename`, che
smetterebbe di avere una regola propria.

**Costo**: un modulo nuovo accanto a `nameUniqueness.ts`, sette punti di innesto nel L-layer,
un file JjScript. Sopra i 5 file: corsia completa, Layer Impact Report, pausa e conferma
(regola 19).
**Rischio dichiarato**: gli `add*` sono la porta anche del **caricamento** — import, seeding,
fixture. Un rifiuto li' significa «un metamodello con duplicati preesistenti non si apre»,
che e' esattamente il vincolo che S1a ha dovuto rispettare a M1. Il gate va quindi sul **nome
esplicito**, prima del `defaultname`, e mai dentro `D*.new`.

### (M2-c) L'ambiguita' dichiarata, invece che risolta — la forma (C) di S1

I quindici consumatori di §4 non hanno bisogno che l'unicita' sia **imposta**: hanno bisogno
che l'omonimia non sia **muta**. La forma e' quella che `buildEvalContext` ha gia' a M1
(`eval.ts:329-344`): con `a.length !== 1` il binding non si crea, e l'errore nomina i
candidati. Applicata a M2 significa: `getByName2`, `getClassByName`, `resolveByNameInMetamodel`
ritornano un rifiuto esplicito invece del primo (o dell'ultimo) elemento.

E' l'unica delle tre che **non cambia cio' che l'utente puo' nominare**, e l'unica che
trasforma quindici scelte silenziose in quindici rifiuti leggibili. E' anche la piu' costosa,
perche' tocca quindici siti.

**Prerequisito comune a (b) e (c), e da fare comunque**: riparare o ritirare
`_impl_getByName` (§4.1). Finche' `getClassByName` ritorna `null` per costruzione, ogni
discorso sull'unicita' del suo pool e' teorico.

---

## 8. Limiti dichiarati

- **Il comando JjScript `rename` non e' stato eseguito**: l'esecutore non e' raggiungibile dal
  global, e la sonda ha ricostruito il **predicato** `checkNameConflict` sui proxy vivi. Le
  tre righe di §4.2 sono quindi misure del predicato, non del comando. La divergenza di case
  che ne segue e' inferita da quel predicato piu' la lettura del write path
  (`SetFieldAction` diretta), non osservata a schermo.
- **`LModel.set_name` non e' stato esercitato** (§4.3).
- **`getClassByNameSpace` non e' stato misurato in condizioni utili**: nel fixture
  `pkg.__raw.uri` e' la stringa vuota, quindi la chiamata ritorna `null` per il package, non
  per l'omonimia. Dichiarato, non concluso.
- **Un solo package, un solo metamodello.** I casi cross-package (due classi omonime in
  package diversi, che il core **permette** e che il consumatore 3 e il 7 vedono come una
  collisione) sono stati letti, non costruiti.
- **Nessuna misura sulle feature ereditate**: che `cls.children` non includa le feature della
  superclasse e' letto in `get_children_idlist:3129`, non esercitato con una gerarchia.
- **Il numero di riga vale per `d50b299a0`**, riletto su quel commit.
- **Zero modifiche ai sorgenti.** L'unico artefatto e' la sonda, non committata
  (`.gitignore:66`, verificato con `git check-ignore -v`, exit 0).

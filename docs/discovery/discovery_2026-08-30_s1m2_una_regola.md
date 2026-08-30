# S1-M2 — una regola di uniqueness per i nomi M2: dove si innesta, e cosa la misura vieta

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `ed278b4ce`
**Prompt**: «S1-M2: una regola di uniqueness per i nomi M2», a valle di
`discovery_2026-08-30_uniqueness_m2.md` e delle sei decisioni ratificate del 30-08.
**Precedente formale**: S1a (`f32c5a4d3`), `nameUniqueness.checkNameUniqueness`.
**Ipotesi che questa fase falsifica**: «il duplicato di `defaultname` nello stesso tick si
chiude spostando il namespace-check su una scansione di `idlookup`».
**Esito**: **falsificata, e con una misura che vale oltre questa slice** — `idlookup` e' un
Proxy la cui `get` risolve le create pendenti ma la cui **enumerazione non le elenca**
(§3). Nessun risolutore di namespace basato su scansione o su collezione puo' vedere una
create dello stesso tick. Il duplicato di propagazione **si rimanda**, dichiarato.

**Sorgenti toccati in questa fase**: nessuno. Due sonde non committate,
`frontend/scripts/smoke/_tmp_s1m2_recon.ts` (13 check, **ALL GREEN**, 0 errori di pagina) e
`_tmp_s1m2_recon2.ts` (5 check, **2 FAIL che SONO la misura**, 0 errori di pagina).

---

## 1. Il pool «metamodello intero» e' raggiungibile, e da dove

Misurato (`_tmp_s1m2_recon.ts`, R1/R1b):

| misura | valore |
|---|---|
| catena dei `father` da una `DClass` | `DClass:Config -> DPackage:Smoke -> DModel:Smoke` |
| `LModel.allSubPackages` | `["Smoke"]`, e dopo `pkg.addPackage('SubPkgProbe')` -> `["Smoke","SubPkgProbe"]` |
| classi viste dal pool | `Smoke/Config … Smoke/AllNine, SubPkgProbe/CrossProbe` |
| `LPackage.datatypes` | getter L **presente** (array), distinto da `classes`/`enumerators` |
| `LPackage.classifiers` | 8 = 6 classi + 2 enum (+ datatypes, qui 0) |

Quindi la decisione 2 (pool = metamodello) e la 3 (datatype = namespace separato) hanno
entrambe un getter L che le esprime senza aggiungere nulla al core: si sale di `father` fino
a `className === 'DModel'`, e da li' `allSubPackages`.

**Controllo positivo**: `SubPkgProbe/CrossProbe` compare nel pool solo dopo che il
subpackage e' stato creato; prima il pool ne conteneva 6 e non 10.

## 2. Le feature ereditate ci sono gia' (decisione 4)

Costruita a runtime una gerarchia (`SupProbe` con `inheritedFeat`, `SubProbe extends SupProbe`):

| getter su `SubProbe` | valore |
|---|---|
| `ownAttributes` | `[]` |
| `allAttributes` | `["inheritedFeat"]` |
| `children` | `[]` — **per contrasto**: e' il namespace di oggi, e non la vede |

`allAttributes`/`allReferences`/`allOperations` (`LModelElement.tsx:3080-3090`) sono
`own ++ inherited` sull'`extendsChain`. La decisione 4 e' quindi un cambio di **sorgente del
namespace**, non un algoritmo nuovo.

## 3. Il reperto che decide `defaultname`: `idlookup` non enumera le create pendenti

`_tmp_s1m2_recon.ts` R2 aveva prodotto due misure che non possono essere entrambe vere di un
oggetto ordinario: `idlookup[nuovoId]` presente col nome giusto, e una scansione di
`Object.values(idlookup)` per lo stesso nome a **0**. `_tmp_s1m2_recon2.ts` (S1/S2) le ha
separate, nello stesso `evaluate` di `pkg.addClass('TickProbe')`:

| misura | valore |
|---|---|
| `Object.keys(idlookup).length` prima / dopo la create | **112 / 112** |
| `idlookup[nuovoId]` | **presente**: `{className:'DClass', name:'TickProbe', father:'…_10'}` |
| `Object.keys(idlookup).includes(nuovoId)` | **false** |
| `Object.values(idlookup).some(e => e === raw)` | **false** |
| scansione per `{className:'DClass', name:'TickProbe'}` | **0** |
| `LPointerTargetable.fromPointer(nuovoId).name` | `'TickProbe'` |
| le stesse misure dopo l'assestamento (**per contrasto**) | tutte presenti, `scanHit = 1` |

`idlookup` e' un Proxy la cui trap `get` risolve la creazione pendente e la cui `ownKeys` non
la elenca. Il colpo diretto per id vede; **nessuna enumerazione vede**.

Conseguenza operativa, misurata e non dedotta (S3): quattro `pkg.addClass()` senza nome nello
stesso `evaluate`, con una scansione di `idlookup` eseguita **prima di ciascuna**, danno cinque
scansioni identiche — `[[],[],[],[],[]]` — e quattro nomi `Concept_0`. Il namespace-check
dell'auto-nome **non puo'** vedere le create precedenti, qualunque sia la sorgente che
interroga: collezione (`pkg.classes`), `children`, o scansione di `idlookup`.

**Il duplicato di propagazione di `defaultname` richiede quindi il tick-fix, ed e' rimandato**,
esattamente nella forma che il prompt prevede.

### 3.1 Il duplicato *strutturale* (`datatype_0` x2) non e' raggiungibile in produzione

L'altro caso di `discovery_…_uniqueness_m2.md` §5(a) e' costruito dalla sonda chiamando
`DDataType.new(undefined, pkgId)`. Censimento in albero: `command grep -rn "DDataType.new"`
ritorna **2 righe**, `api/data.ts:868` e un test. La riga di produzione passa un nome esplicito
(`this.read(json, ECoreNamed.namee, 'DataType_1')` — il fallback e' un letterale, non
`defaultname`), e **non esiste** un `addDataType` a livello L (`command grep -rn "addDataType"`
-> 0 righe; controllo positivo: lo stesso grep su `addEnumerator` ritorna 11 righe).

Quindi il caso (a) si chiude come **non raggiungibile**, non come corretto. Cio' che questa
slice gli da' comunque e' un namespace: il rename di un `DDataType` oggi confronta contro
`father.children`, che i datatype non elenca, e passera' invece per il namespace datatype.

## 4. Il badge: sotto quale id, e cosa non si accende

- I nodi ReactFlow, **anche a M1**, portano l'id del **`DVertex`**, non quello del `DObject`:
  misurato, 4 nodi su 4 `className: 'DVertex'`, ciascuno col campo `model` che punta al
  `DObject` (`_tmp_s1m2_recon2.ts` S4).
- `UniquenessProblemSync` registra `nodeId = obj.id`, cioe' l'id del **DObject**.
- `NodeProblemIndicator` e' montato con `nodeId={id}`, l'id del nodo RF, e **solo dentro
  `ObjectNode.tsx`** (3 siti). `ClassNode.tsx` non lo monta affatto.
- `ConformanceProblemSync` registra invece **due volte**: sull'id del DObject (tree view) e
  sull'id del `DVertex` risolto (canvas), con un commento che lo dice
  (`ConformanceProblemSync.tsx:92-97`).

Quindi il pallino del duplicato **non compare sul canvas nemmeno a M1**: e' un difetto
preesistente e indipendente da questa slice. La decisione 6 parla del **registro**, ed e' il
registro che questa slice estende — con la stessa forma degli M1, cioe' l'id dell'elemento.
Il doppio innesto alla `ConformanceProblemSync` e la resa in `ClassNode` **non** entrano:
sono un perimetro che il prompt non apre. Dichiarato qui.

## 5. La forma dell'innesto, e il censimento dei chiamanti

### 5.1 Il rename

Un solo sito attraversa **tutti** i rename M2: `LPointerTargetable.set_name`
(`joiner/classes.ts:2166`). `LClass.set_name` e `LAttribute.set_name` chiamano `super` per
primo; `LModel` e `LObject` hanno regole proprie e non passano di qui; `LUser`/`LProject` non
controllano nulla.

Il secondo percorso e' JjScript `rename` (`commands/rename.ts:79-118`), che **non** passa da
`set_name`: `checkNameConflict` (per-kind, case-insensitive) e poi `SetFieldAction` diretta.
La decisione 1 lo riallinea. Misurato (`_tmp_s1m2_recon.ts` R4): l'elemento che
`resolveElement` restituisce e' il proxy L (`className: 'DClass'`, `father: DPackage`,
`parent` un oggetto con `classifiers`), e `name` e' una proprieta' scrivibile sul proxy —
quindi `element.name = newName` e' disponibile e passa da `set_name`.

### 5.2 La create

Non esiste un `get_addObject` per M2: i primitivi sono **nove**, distribuiti su quattro
riceventi.

| ricevente | primitivo | riga |
|---|---|---|
| `LPackage` | `get_addPackage`, `get_addClass`, `get_addEnumerator` | 1884, 1894, 1904 |
| `LClass` | `get_addAttribute`, `get_addReference`, `get_addOperation` | 3197, 3215, 3220 |
| `LEnumerator` | `get_addLiteral` | 4772 |
| `LOperation` | `get_addParameter` | 2406 |
| `LModel` | `get_addPackage` | 5073 |

`get_addChild` (`:810`) e' un instradatore che chiama questi, non una porta indipendente:
gatare i nove copre anche lui. `LModel.get_addClass` (`:5083`) delega a `get_package(c).addClass`.

Chiamanti in albero, censiti (`command grep` sui nove nomi, esclusi `__tests__`, i falsi
positivi jQuery di `U.tsx`/`GraphDataElements.tsx` e `ohm.ts`): **25 righe**, in
`EditorV2.tsx`, `hooks/useClassRemoval.ts`, `sync/canvasToJjom.ts` (7), `ContextMenu.tsx`,
`DV.tsx`, `Navbar.tsx`, `services/JjodieActionExecutor.ts` (6), `examples/` (StateMachine,
RowViewSmoke). **Nessun importatore Ecore**: `EcoreParser` costruisce con `D*.new` diretta,
quindi il vincolo R-S1-4 («i duplicati preesistenti si aprono sempre») e' soddisfatto per
costruzione, come a M1.

**Rischio identificato e da misurare in fase 2**: `useClassRemoval.ts:145` ricopia le feature
ereditate nelle sottoclassi quando la superclasse viene rimossa. Con la decisione 4 (no
shadowing) quella `addAttribute` puo' trovarsi a competere con la feature ancora vista come
ereditata, se la rimozione dell'`extends` non si e' ancora propagata (§3): il rifiuto
diventerebbe **perdita di dati**. Va misurato per contrasto prima di considerare la slice
chiusa.

## 6. Dove va il codice, e perche' non due copie

`nameUniqueness.ts` e' M1 per costruzione (`LObject`, `allSubObjects`, `DValue`), ma
`UniquenessVerdict` e `refusalReason` — la **forma** del verdetto e la **frase** del rifiuto —
sono le due cose che non devono esistere in due esemplari. La sezione M2 va quindi **nello
stesso modulo**, con:

- `getM2NamespaceOf(father, kind, excludeId?)` — il namespace, una `switch` su sei generi;
- `checkM2NameUniqueness({father, kind, name, excludeId})` — il verdetto, che riusa
  `refusalReason` e ritorna lo stesso `UniquenessVerdict` (piu' un `warning?` opzionale per il
  quasi-omonimo della decisione 1).

I generi e i loro pool:

| genere | classNames | namespace | rispetto a oggi |
|---|---|---|---|
| `classifier` | `DClass`, `DEnumerator` | tutte le classi + enum di `model.allSubPackages` | **allargato** (era il package) |
| `datatype` | `DDataType` | tutti i datatype di `model.allSubPackages` | **nuovo** (non ne aveva) |
| `feature` | `DAttribute`, `DReference`, `DOperation` | `allAttributes ++ allReferences ++ allOperations` della classe | **allargato** (erano le sole proprie) |
| `package` | `DPackage` | `father.children` | **invariato** |
| `literal` | `DEnumLiteral` | `father.children` | **invariato** |
| `parameter` | `DParameter` | `father.children` | **invariato** |

Le tre righe «invariato» sono deliberate: la decisione 2 nomina le classi, la 4 le feature.
Restringere o allargare gli altri tre generi non e' stato deciso, e cambiarli spegnerebbe o
irrigidirebbe un controllo committato (Regola 3).

**Rischio di ciclo di import, dichiarato**: `joiner/classes.ts` dovra' importare
`model/logicWrapper/nameUniqueness.ts`, che importa `../../joiner`. Il ciclo e' innocuo in ESM
finche' nessuno dei due esegue qualcosa a livello di modulo — e nameUniqueness non lo fa — ma
e' un'assunzione, non una misura: va verificata con `npm run build` **e** a schermo, non solo
col typecheck. Se si rompe, il ripiego e' un modulo foglia a soli import di tipo.

## 7. Cosa cambia a schermo, dichiarato prima

1. La frase del rifiuto M2 passa da `Element name "X" is already taken in this scope` a quella
   condivisa con M1, `Name "X" already used by <Tipo> "<Nome>"`. E' il prezzo di «una sola
   frase per tutti i consumatori» (S1a §4); senza, la create e il rename descriverebbero la
   stessa collisione in due modi.
2. Due classi omonime in package diversi dello stesso metamodello, oggi accettate, vengono
   **rifiutate** (decisione 2). E' un cambio di comportamento committato, voluto.
3. Un attributo che ombreggia una feature del padre viene **rifiutato** (decisione 4), col
   padre nominato nella `reason`.
4. Una create M2 con nome esplicito gia' occupato **non crea piu' l'elemento** e ritorna
   `undefined`, come `addObject` a M1 dopo S1a.
5. JjScript `rename` M2 diventa **case-sensitive**: `classe -> 'dupprobe'` con `DupProbe`
   presente, oggi rifiutato, passera'.

## 8. Limiti dichiarati di questa fase

- Le sonde girano su un solo metamodello (`Smoke`) e un solo progetto. Il caso cross-metamodello
  della decisione 2 («stesso nome in metamodelli diversi e' lecito») e' **letto**, non costruito.
- `LModel.set_name` (i nomi dei modelli, `LModelElement.tsx:5522`) resta la terza regola e
  **non e' toccata**: non e' un nome M2 dentro un metamodello.
- Il comando JjScript `rename` non e' stato eseguito nemmeno qui (l'esecutore non e'
  raggiungibile dal global): la misura R4 riguarda la **forma dell'elemento risolto**, non il
  comando.
- Il numero di riga vale per `ed278b4ce`.

---

# Addendum di Fase 2 — cio' che la scrittura ha cambiato, e le due misure che l'hanno corretta

**Sorgenti toccati**: 6 (i cinque della pausa Regola 19 + **`useClassRemoval.ts`**, §G qui
sotto: espansione di perimetro dichiarata, non silenziosa), piu' il test nuovo.
**Sonda**: `frontend/scripts/smoke/_tmp_s1m2_verify.ts` — **26/26 ALL GREEN, zero errori di
pagina**, sul metamodello vivo del fixture aperto dalla card della dashboard.
**Unita'**: `frontend/src/model/__tests__/m2NameUniqueness.test.ts` — **22/22**.

## A. La forma scelta: estensione, non modulo gemello

Il prompt lasciava la scelta fra «una funzione per M2» e «estensione parametrica di
`checkNameUniqueness`», da decidere **misurando quale minimizza le copie**. Misura:

| forma | copie di `refusalReason` | copie di `UniquenessVerdict` | rami di namespace |
|---|---|---|---|
| modulo gemello | **2** | 2 (o un terzo modulo foglia) | 3 + 6 |
| estensione parametrica di `checkNameUniqueness` | 1 | 1 | 3 **e** 6 in una sola `switch`, con un argomento `kind` che a M1 non significa niente |
| **sezione M2 nello stesso modulo** (scelta) | **1** | **1** | 3 e 6, in due funzioni con firme oneste |

La seconda riga e' quella che il prompt nominava per prima e non e' stata presa: unificare
i due verdetti in una firma sola costringe M1 a portare un parametro `kind` che il suo
namespace non usa, e la `switch` risultante avrebbe nove rami invece di sei. La terza
tiene una sola copia di cio' che non deve esistere in due — la **frase** e la **forma** —
e due risolutori di namespace, che e' esattamente il numero di namespace che esistono.

`refusalReason` ha guadagnato un terzo parametro opzionale (`inheritedFrom`) invece di una
seconda frase: il consumatore che stampa `reason` alla lettera continua a funzionare.

## B. I generi, e i tre che NON cambiano

Undici primitivi di create, cinque riceventi, un solo gate (`m2CreateRefused`,
`LModelElement.tsx`). Due primitivi che il censimento di Fase 1 non aveva elencato sono
emersi leggendo il file e sono gatati come gli altri: `LReference.get_addClass` (4079) e
`LAttribute.get_addEnumerator` (4477) — entrambi costruiscono un classificatore il cui
padre **non e' il ricevente** ma il package, e per il primo il gate sta **prima** della
`TRANSACTION` che gia' esisteva (§3.3).

`package`, `literal` e `parameter` restano su `father.children`. Non e' un residuo: e' la
Regola 3. Le decisioni ratificate allargano i classificatori e le feature, e spostare in
silenzio lo scope degli altri tre avrebbe cambiato un controllo committato e reso a schermo
senza che nessuno lo avesse deciso.

## C. Il badge si accende — e la misura del ritardo

`detectM2DuplicateNames` produce **esattamente 4** voci sulle quattro `Concept_0`, e sulle
quattro classi giuste. Ma la prima corsa le misurava a **0**, e la diagnosi ha aggiunto un
reperto al §3 di questo referto invece di un fix:

| misura | valore |
|---|---|
| le quattro sono in `idlookup` (colpo diretto) | si' |
| **enumerate** in `idlookup`, dopo 9 s | si', 4 |
| in `pkg.classes` | si', 4 |
| voci `duplicate-name` nel registro | **0** |
| lo stesso registro dopo **una scrittura qualunque** | **4**, sulle nostre 4 |

La firma di reattivita' del produttore legge l'**enumerazione** di `idlookup` al momento
della notifica Redux, e a quel momento le create pendenti non sono elencate (§3). Dopo,
nessuna nuova notifica arriva finche' non arriva un'altra scrittura. Il badge quindi si
accende **una scrittura dopo**, non mai.

E' **preesistente e indipendente dal livello**: la meta' M1 legge la stessa firma, quindi
un duplicato M1 creato senza una scrittura successiva resta ugualmente invisibile.
Dichiarato nel sorgente e qui; non riparato, perche' e' lo stesso tick-fix di §3.

## D. Il quasi-omonimo, dal canale giusto

Il warning non e' un `console.warn`: e' un toast, misurato sul `CustomEvent`
`JjodelEvents.TOAST` e non nel DOM.

```
{"priority":"warning","message":"Name \"ceprobe\" differs only by case from \"CeProbe\" in the same scope"}
```

Con il controllo negativo nella stessa corsa: un nome senza quasi-omonimi non produce
nessun warning, e un **rifiuto** non ne porta mai uno.

## E. La `reason` dello shadowing nomina il padre

```
Name "shLabel" already used by Attribute "shLabel" inherited from Class "ShSup"
```

e, per contrasto, la stessa feature sulla classe che la **dichiara** non nomina nessun
padre. Le due frasi vengono dalla stessa funzione.

## F. Il cross-metamodello resta NON misurato

Il fixture ha **un solo** metamodello (`count: 1, names: ["Smoke"]`, misurato). Il ramo
della sonda esiste e si e' auto-dichiarato `SKIP` invece di passare a vuoto. La copertura
di quel caso e' l'unita': `checkM2NameUniqueness` con il padre in un altro `DModel` accetta,
e lo stesso nome nel primo metamodello rifiuta — controllo positivo nello stesso test.

## G. `useClassRemoval` — il rischio di Fase 1 era reale, ed e' misurato

L'ipotesi di §5.2 («il rifiuto diventerebbe perdita di dati») **non era teorica**.

| misura | valore |
|---|---|
| gerarchia `ShSup{shLabel}` <- `ShSub` | asserita, non attesa |
| lista che la co-evoluzione ricopierebbe | `["shLabel"]` |
| `subClass.addAttribute('shLabel')` | **`null`** — rifiutata |
| `ShSub.ownAttributes` dopo | `["shOwn"]` — la feature **non c'e'** |

La causa e' l'ordine, non la regola: la ricopia gira **prima** che la superclasse sparisca,
quindi in quell'istante la sottoclasse eredita ancora tutto cio' che sta per perdere, e
R-M2U-4 rifiuta ogni copia — correttamente nei propri termini. Il risultato sarebbe stato
una co-evoluzione che non copia nulla e feature perse alla rimozione, **in silenzio**.

**La forma scelta, dichiarata**: la ricopia passa da `DAttribute.new` / `DReference.new` /
`DOperation.new` dirette, cioe' **la stessa porta del caricamento**, che il disegno
ratificato lascia deliberatamente non gatata (import, seeding, fixture: scritture che
**riproducono** uno stato, non che ne propongono uno). Il gate resta sul primitivo L, dove
arrivano i gesti d'utente. La guardia `existing*Names` del sito non e' toccata e continua a
rendere la ricopia idempotente.

Misurato **per contrasto** nella stessa corsa: via il primitivo L la copia e' rifiutata
(`id: null`, `own: ["shOwn"]`); via `D*.new` atterra (`own: ["shOwn","shLabel"]`). E il
badge, subito dopo, conta **5** duplicati invece di 4 — la quinta voce e' proprio lo
`shLabel` che la ricopia ha appena creato, che e' la risposta giusta: la co-evoluzione
produce un'omonimia strutturale, e il registro la dichiara invece di impedirla.

**Questa e' l'espansione di perimetro della slice**: un settimo file oltre ai sei della
pausa Regola 19. Non e' scivolata nel diff — e' qui, nel log alla voce
`Out-of-scope changes: yes`, e la ragione e' che consegnare la slice senza di essa avrebbe
significato consegnare una perdita di dati misurata.

## H. Il ciclo di import, verificato e non assunto

`joiner/classes.ts` importa ora `model/logicWrapper/nameUniqueness.ts`, che importa
`../../joiner`. Il ciclo esiste. Verificato che sia innocuo **a schermo** e non solo col
typecheck: `npm run build` exit 0, `npm run smoke` VERDICT GREEN, e la sonda gira il
sorgente vivo via Vite con **zero errori di pagina**. Il ripiego a modulo foglia non e'
servito.

## I. I gate

`npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero, exit 2
come la baseline), e **nessuna** delle 33 righe nomina un file toccato. `npm run build`
exit **0**, solo il chunk-warning. `npx vitest run` **2162 passed / 0 failed**, **+22
esatti** (il file nuovo) sui 2140 di ieri, coi 9 file rotti all'import = baseline nota.
`npm run smoke` **12/0/3 VERDICT GREEN**, corsa quiescente, `moved: nothing`, un boot per
stato. Sonda `_tmp_getbyname_key.ts` (`3eed585dd`) **rigirata non modificata: 14/14, 0 FAIL**.

Le 22 unita' sono state girate anche contro **tre versioni difettose** del modulo, una
mutazione per volta, perche' una suite verde su entrambe non misura niente:

| mutazione | rossi |
|---|---|
| pool dei classificatori ristretto al package | **3** |
| feature senza le ereditate | **2** |
| confronto case-insensitive | **2** |
| modulo ripristinato | **0** (22/22) |

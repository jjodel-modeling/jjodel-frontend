# UNQ1 F1 — il duplicate-name che sopravvive a nomi diversi

Discovery. Zero file di prodotto. Quattro sonde `_tmp_` non committate
(`.gitignore:66`), tutte contro il dev server, zero `pageerror` in tutte:

| sonda | esito | cosa misura |
|---|---|---|
| `_tmp_unq1_recon.ts` | 6 PASS / 2 FAIL | Q1-Q4 in prima battuta |
| `_tmp_unq1_stale.ts` | 11 PASS / 1 FAIL | il per contrasto `Alpha`/`Beta` e la ripetizione letterale di CRUD3 |
| `_tmp_unq1_transient.ts` | 3 PASS / 1 FAIL | raw contro proxy, campionato a 25 ms |
| `_tmp_unq1_slot.ts` | — (misura) | dentro lo slot identita', nella finestra |
| `_tmp_unq1_roots.ts` | 3 PASS / 0 FAIL | il raggio: le root |

I FAIL sono asserzioni scritte come **il comportamento corretto**: rosse
apposta, sono la riproduzione del difetto.

---

## 0. La risposta secca

**Nasce gia' col nome giusto. Il produttore lo legge sbagliato: registra su una
lettura che non descrive lo stato, e poi non revoca perche' la firma non cambia
piu'.**

E i due difetti che CRUD3 aveva visto mescolati sono **una causa sola vista da
due lati**: per un padre `DValue` il contatore dell'auto-nome non avanza mai.

---

## 1. La causa, in tre righe di codice

**(a)** `LObject.get_name` legge **prima lo slot identita'**, e solo dopo
`data.name` — `LModelElement.tsx:6081-6083`:

```ts
protected get_name(context: Context): this['name'] {
    return (context.proxyObject as GObject)['$name']?.value || context.data.name || context.proxyObject.instanceof?.name;
}
```

**(b)** Lo slot identita' e' seminato in differita (`addObject` semina i valori
del `json` su un `setTimeout`, cfr. `createAdapter.ts:42`). Finche' non e'
seminato i suoi `values` sono **vuoti** e il suo `value` rende **l'auto-nome**.
Misurato, campione a 25 ms:

```
data=Edition_1   init=Edition_0   slotValue="Edition_0"   slotRaw=[]
data=Beta        init=Edition_0   slotValue="Edition_0"   slotRaw=[]
```

Lo store grezzo ha gia' il nome giusto; il proxy no.

**(c)** L'auto-nome di un nested e' **sempre `<Metaclasse>_0`**, perche'
`defaultname` cerca i nomi occupati in `lfather.childNames`
(`joiner/classes.ts:1473-1478`), che per un padre `DValue` e' **vuoto**:
`LValue` non ridefinisce `get_children_idlist`, quindi il `get_childNames` di
base (`LModelElement.tsx:497`) non trova nulla e
`U.increaseEndingNumber(prefix + '0', …)` restituisce sempre lo zero.

Misura diretta di (c), sullo stesso giro:

| | `initialName` |
|---|---|
| primo nested | `Edition_0` |
| secondo nested | `Edition_0` |
| terzo nested | `Edition_0` |
| prima root | `Book_0` |
| seconda root | **`Book_1`** ← il contatore avanza |

Il commento di S1a in `get_addObject` (`LModelElement.tsx:7257-7262`) lo aveva
gia' dichiarato — «whose namespace for a NESTED object is empty (`LValue` does
not override `get_children_idlist`)» — e lo lasciava aperto. Questa e' la sua
conseguenza a valle.

**Composizione.** `detectDuplicateNames` (`nameUniqueness.ts:300-313`) confronta
`obj.name` con `sibling.name` **attraverso i proxy L**. Nella finestra ogni
nested appena creato si legge `<Metaclasse>_0`. Se un fratello porta davvero
quel nome — ed e' quello che si ottiene cliccando Add e non rinominando — lo
scan vede due nomi uguali e registra.

---

## 2. Q1 — la sequenza dei nomi

Campionamento a 25 ms sullo slot `editions`, secondo figlio creato con nome
esplicito. Le due coppie sono in **Book diversi**, quindi namespace diversi:
nessuna delle due puo' interferire con l'altra.

**P1, i nomi di CRUD3** — primo `Edition_0`, secondo `Edition_1`:

```
t=0..50   raw [Edition_0]              proxy [Edition_0]              pend: Edition_1
t=75..500 raw [Edition_0, Edition_1]   proxy [Edition_0, Edition_0]   ← 17 campioni
assestato raw [Edition_0, Edition_1]   proxy [Edition_0, Edition_1]
```

**P2, per contrasto** — primo `Alpha`, secondo `Beta`:

```
t=0..250   raw [Alpha]         proxy [Alpha]              pend: Beta
t=275..500 raw [Alpha, Beta]   proxy [Alpha, Edition_0]   ← la stessa finestra
assestato  raw [Alpha, Beta]   proxy [Alpha, Beta]
```

Tre fatti che questi due blocchi fissano:

1. **Nessun rename.** `data.name` porta il nome chiesto dal primo campione in
   cui l'oggetto esiste (`Edition_1`, `Beta`); prima e' in `pendingCreation`,
   gia' col nome giusto. Non nasce `Edition_0` e non viene rinominato.
2. **La finestra c'e' in entrambe le coppie**, e dura almeno **425 ms**
   (17 campioni × 25 ms; si chiude entro i 7 s del controllo successivo — il
   limite superiore non e' misurato). In quella finestra il proxy rende
   l'auto-nome.
3. **Solo P1 collide**, perche' solo in P1 il fratello gia' presente si chiama
   davvero `Edition_0`. In P2 il proxy legge `[Alpha, Edition_0]`: due nomi
   diversi, nessuna entry. Il difetto e' invisibile ogni volta che nessun
   fratello porta l'auto-nome.

Registro a stato assestato, P1:

```
{soggetto:"Edition_0", testo:"Edition_0", resolved:false, collideCon:["Edition_1"]}
{soggetto:"Edition_1", testo:"Edition_0", resolved:false, collideCon:["Edition_0"]}
```

P2: `[]`.

Il `testo` e' la `description` congelata alla registrazione, e nomina
`Edition_0` anche nella entry il cui soggetto si chiama `Edition_1`: e' la firma
della lettura sbagliata, perche' `description` usa
`LPointerTargetable.fromPointer(nodeId)?.name` (`UniquenessProblemSync.tsx:134-139`).

**Chi assegna cosa**: il default e' `DObject.new3` (`LModelElement.tsx:6015-6017`)
via `DPointerTargetable.defaultname`; l'esplicito arriva da `get_addObject`
attraverso `constructorPointers = {...json, father}` (`:7172`). Nessuno rinomina:
`createAdapter` e AUTO1 non entrano in questo percorso.

---

## 3. Q2 — il lifecycle del produttore

`UniquenessProblemSync` registra a ogni corsa dell'effetto e revoca per
differenza: gli id non piu' nello scan vanno a `markResolved`
(`UniquenessProblemSync.tsx:157-165`), con TTL 5 s in `registry.ts`.

**La revoca funziona**, misurata: forzata una collisione vera con una
`SetFieldAction` diretta sul campo `name` e poi disfatta, la entry passa a
`resolved: true` e sparisce.

Non scatta **qui** perche' l'effetto non ri-parte. La sua dipendenza e' la firma
`sig`, costruita sul lookup **grezzo** — `${id}:${raw.name}:${raw.father}`,
`UniquenessProblemSync.tsx:95-117` — che porta gia' `Edition_1` quando lo scan
legge `Edition_0` dal proxy. Firma e scan **osservano due stati diversi**: la
firma raggiunge il suo valore definitivo prima che lo scan giri, quindi lo scan
gira una volta sola, sulla lettura sbagliata, e non c'e' un secondo cambio di
firma che lo faccia ripartire.

E' la stessa forma del difetto che l'intestazione di quel file gia' descrive per
i pending creates («a MISSED NOTIFICATION, with no upper bound»), su una
sorgente diversa: li' erano le collezioni a essere indietro rispetto alla firma,
qui e' il nome letto dal proxy.

**Corollario misurato**: una scrittura qualunque che cambi la firma fa ripartire
lo scan e corregge il registro. Il falso positivo resta finche' nessuno tocca
nulla.

---

## 4. Q3 — lo scope

`getNamespaceOf` (`nameUniqueness.ts:168-201`) decide in un punto solo. Per un
padre `DValue` prende il ramo `resolveLObjectsFromLValue` (`:74-79`), cioe' i
`values` dello **slot di containment**.

Misurato: ogni nested ha `fatherKind: DValue`, `fatherSlot: editions`, e
`fratelliNelloSlot` e' l'elenco dei valori dello slot. **I due Edition sono
fratelli legittimi nello stesso scope**, e la regola di unicita' li' e' giusta.

Quindi **no**: non e' «solo Q2». La collisione **non e' mai stata vera nei
dati**, nemmeno per un istante — `data.name` ha sempre portato nomi distinti.
Era vera solo nella lettura. E' un falso positivo pieno, non una collisione vera
non revocata.

Controllo nello stesso giro: `Q3-ctrl` a stato assestato il proxy riporta lo
stesso nome del lookup grezzo per tutti e tre i nested — lo strumento sa
distinguere i due, e li vede coincidere quando devono coincidere.

---

## 5. Q4 — le root sono immuni, e il perche' e' la stessa causa

Due `Add Book` dalla tabella: nomi `Book_1`, `Book_0`, `Book_2`, tutti distinti,
**zero duplicate-name**.

E il caso costruito apposta per farlo scattare — una root chiamata
esplicitamente `Book_0`, cioe' l'auto-nome, e poi una seconda root con nome
esplicito diverso:

```
campioni  Book_0|Book_0|"Book_0"|["Book_0"]  ;;  Zeta|Book_1|"Book_1"|[]
registro  []
```

La finestra **c'e' anche per la root** (`Zeta` si legge `Book_1` dal proxy per
tutta la finestra, slot vuoto), ma il nome di ripiego e' `Book_1` e non
`Book_0`: **il contatore ha avanzato**, perche' per un padre `DModel` il
namespace di `defaultname` e' popolato. Nessuna collisione, zero entry.
`campioniInFinestra: 0`.

Le root sono immuni perche' l'auto-nome e' unico. I nested no perche' e' sempre
lo zero. Un difetto solo, guardato da due lati.

---

## 6. Il terzo fatto, che e' vero e non e' un falso positivo

Due `Add Edition` **senza rinominare** producono due oggetti chiamati **davvero
`Edition_0`** entrambi, dalla nascita e per sempre:

```
Q1a  nomi finali ["Edition_0","Edition_0"]   nomeSubito: "Edition_0" per entrambi
E    con due auto-nomi, due entry attive sui due Edition_0, e NON tocca Alpha/Beta
```

Qui il duplicate-name **e' corretto** ed e' l'unica cosa che segnala il problema
vero: `defaultname` non sa contare dentro uno slot. Il gate di S1a non lo ferma
perche' e' esplicitamente sospeso sull'auto-nome
(`LModelElement.tsx:7257-7262`), altrimenti rifiuterebbe il secondo `Add` di
ogni slot di containment.

---

## 7. Candidati, col costo. Nessuno raccomandato qui

**C1 — dare a `LValue` un `get_children_idlist`.** Un override che restituisca i
`values` di tipo `DObject`. Chiude **entrambi** i lati: il contatore avanza
(niente piu' due `Edition_0` veri) e il nome di ripiego nella finestra diventa
unico (niente piu' falso positivo). E' la causa, non il sintomo.
Costo: `children` e' letto da `defaultname`, da `childNames`, dalla `get_children`
di base e da chiunque navighi i figli — allargarlo su `LValue` cambia il
significato di «figlio» per una classe che finora non ne aveva. Serve un
censimento dei consumatori prima, e non e' locale.

**C2 — invertire l'ordine in `get_name`.** `data.name || $name.value || …`.
Chiude solo il falso positivo, non i due `Edition_0` veri. Costo: e' il cuore
del binding identita' di §3.12, dove la direzione slot → nome e' load-bearing;
invertire la preferenza di lettura tocca ogni superficie che mostra un nome.
**Critical zone**, Layer Impact Report obbligatorio.

**C3 — far leggere allo scan il D-layer invece del proxy.** `detectDuplicateNames`
confronta `idlookup[id].name`. Firma e scan tornerebbero a guardare lo stesso
stato, che e' il difetto strutturale di §3. Chiude il falso positivo e lascia
intatti i due `Edition_0` veri (che continuerebbero a essere segnalati, giusto).
Costo: `nameUniqueness.ts` e' condiviso con il gate di `set_name` e con M2, e i
suoi test mockano `../../joiner` — un accesso al lookup grezzo va iniettato, non
importato.

**C4 — non fare niente sul nome e revocare piu' spesso.** Aggiungere alla firma
qualcosa che cambi anche dopo la semina dello slot, cosi' lo scan ri-parte e si
autocorregge. Costo: cura il sintomo lasciando in piedi la lettura sbagliata, e
allarga una firma che gira su ogni azione. Sconsigliato per come e' scritto, ma
e' il piu' piccolo.

---

## 8. La domanda residua per Alfonso

Una:

> **Un `LValue` di containment ha figli?**

C1 dice di si' e chiude tutto in un punto; C2 e C3 dicono di no e curano il
sintomo dove lo si vede. Oggi la risposta implicita del codice e' «no» — `LValue`
non ridefinisce `get_children_idlist` — ma `getNamespaceOf` risponde «si'» per
conto suo (`resolveLObjectsFromLValue`), e `LObject.subObjects` pure. Sono gia'
due punti che sanno discendere uno slot mentre il terzo, `defaultname`, non lo sa.
La domanda e' se vada unificato li' o lasciato tre volte.

---

# Appendice — Q5 / Q6 (aggiunta 2026-09-02, dallo screenshot del 2026-09-01 post CHECK 6)

Fatto riportato: `Book_0` con due figli `Edition` rinominati a mano «prima
edizione» / «seconda edizione», badge **2** sul padre nel tree, form «No issues»,
canvas pulito. Due domande: il badge aggrega i problemi dei discendenti (Q5), e
sopravvive a save + reload (Q6).

Tre sonde nuove, non committate (`.gitignore:66`), zero `pageerror` in tutte e tre:

| sonda | esito | cosa misura |
|---|---|---|
| `_tmp_unq1_badge.ts` | 14 PASS / 2 FAIL | Q5 e Q6 sul DOM reso, piu' il caso dello screenshot |
| `_tmp_unq1_ctrl.ts` | 7 PASS / 2 FAIL | il controllo positivo che alla prima mancava, e lo scope della revoca |
| `_tmp_unq1_form.ts` | 3 PASS / 1 FAIL | chi legge il registro nella form: il padre e il figlio a confronto |

I 2 FAIL di `_tmp_unq1_badge` sono il suo arm D — un controllo positivo che **non
e' partito** (0 entry registrate): non un negativo, una misura rotta, rifatta in
`_tmp_unq1_ctrl` dove passa. I 2 FAIL di `_tmp_unq1_ctrl` sono asserzioni scritte
come il comportamento corretto: sono §A.4. L'unico FAIL di `_tmp_unq1_form` e' un
difetto della sua asserzione, non della misura: cercava la parola «duplicate» nel
testo della form, che invece rende il **conteggio** («1 warning»); la misura sotto
sta in §A.5 e dice cio' che serve.

---

## A.0 La risposta secca

**Il badge non conta problemi: conta figli.** E i due warning **non sono
sopravvissuti** al rename — il registro si svuota. Cio' che resta sullo schermo e'
un numero che non ha mai parlato di problemi, e che vale 2 perche' i figli sono
due.

---

## A.1 Q5 — da dove viene il «2»

La riga di un'istanza M1 e' una `FeatureRow`, e `FeatureRow` **non legge nessun
registro**. Il numero e' `instance.children.length`
(`TreeViewContent.tsx:891`), reso solo quando `hasChildren` (`:856`), in
slate-300 nella colonna destra (`tree-view-sidebar.scss:1924-1932`; sotto i 400px
di rail e' `display:none`, `:1943`). I figli sono quelli che
`buildInstanceForest` (`:2322`) raccoglie da `LObject.subObjects` (`:2342-2352`),
cioe' il containment — la stessa discesa dello slot di §4, non il registro.

L'**unico** consumatore di `_jjNodeProblems` nell'albero e' `EntityRow`
(`:719-720`), e il suo scope e' l'id della propria riga: `useNodeProblems(expandKey)`,
nessuna aggregazione sui discendenti. Rende un **triangolo**, mai un numero
(`:786`); `problems.length > 1` allunga solo il tooltip con `(+N more)`, e sempre
sullo **stesso** nodo. `FeatureRow` non chiama `useNodeProblems` affatto: le
righe M1 non hanno indicatore di problema, ne' sul padre ne' sui figli.

Misure, tutte a stato assestato con la rail a 560px:

| padre | figli | entry attive nel registro | badge letto |
|---|---|---|---|
| `Book_0` dopo il rename | 2 | 0 | **2** |
| `Libro_pulito`, nomi distinti dalla nascita | 3 | 0 | **3** |
| `Libro_pulito` + due auto-nomi (collisione VERA) | 5 | 2 | **5** |

Se contasse i problemi direbbe 0, 0, 2. Dice 2, 3, 5. E nei tre stati
`document.querySelectorAll('.tree-problem-icon')` ha **totale 0**.

**Controllo positivo** (`_tmp_unq1_ctrl` arm 2), perche' uno zero da un
`querySelector` e' indistinguibile da un selettore sbagliato: costruito un
metamodello con due classi omonime — `addClass('Book')` due volte le accetta
entrambe, arm 0 — e aperta la tab M2, il produttore registra sulle due `DClass` e
le **righe M2 dipingono l'icona**, `data-severity="warning"`, con
`aria-label="Name \"Book\" is also used by another element in this scope."`.
L'albero sa dipingere un problema: il silenzio sulle righe M1 e' un'assenza vera.

Quindi, alla lettera delle due domande di Q5: **no**, non aggrega; e **no**, non
legge quel registro — non ne legge nessuno.

---

## A.2 Il rename revoca (e il fatto riportato non si conferma)

Ripetuto il caso dello screenshot: `Book_0`, due nested creati con i nomi di
CRUD3 (`Edition_0`, `Edition_1`), poi rinominati. Le due strade dell'interfaccia
misurate **entrambe**, una per figlio: `l.name = …` (`set_name`, scrive campo e
slot, §3.12) e `l['$name'].value = …` (lo slot diretto, che e' cio' che scrive la
form).

```
prima del rename   2 entry attive   {Edition_0 ← "Edition_0"} {Edition_1 ← "Edition_0"}
dopo il rename     registro []      raw e proxy d'accordo su «prima/seconda edizione»
```

E' il corollario di §3 che si avvera: il rename cambia la firma, lo scan riparte,
e stavolta proxy e D-layer concordano. **I due warning non sopravvivono a nomi
diversi.** Il «2» che sopravvive e' il conteggio dei figli.

---

## A.3 Q6 — save + reload

Il registro e' una `Map` di modulo (`registry.ts:79`), esposta su `window` per il
debug (`:94`), dichiarata «session-local … not persisted» dalla sua intestazione:
un reload la azzera per costruzione. Cio' che il reload non decide e' se il
produttore la **ricostruisca uguale**, ed e' quello che la sonda misura —
`ProjectsApi.save(project)` (offline, `projects.ts:113`), poi `page.reload()`
vero, non una navigazione di hash, poi riapertura della tab M1:

```
badge sul padre        2 -> 2          (i figli sono ancora due: il numero e' loro)
i due rinominati       0 entry -> 0    nessun falso positivo al load
i due «Edition_0»      2 entry -> 2    la collisione VERA torna, ricostruita da zero
```

Il controllo che rende leggibile la misura: dopo il reload i due figli si chiamano
ancora «prima edizione» / «seconda edizione», raw e proxy d'accordo — il progetto
e' stato davvero salvato e riletto.

Risposta: **il badge resta, e non dice niente sui problemi**. Il registro invece
non e' persistente e viene ricalcolato; il ricalcolo al load **non riproduce il
falso positivo**, e quindi la finestra di lettura sbagliata di §1 e' un artefatto
del **percorso di creazione** (la semina in differita dello slot), non del
percorso di caricamento. Delle due letture che Q6 proponeva, vale la prima: il
difetto e' in-session, e la sola cosa che sopravvive al reload e' una collisione
che nei dati e' vera.

---

## A.4 Un terzo fatto, non chiesto: la revoca e' globale, il produttore e' per modello

Misurato in `_tmp_unq1_ctrl` arm 3, con **due collisioni vere** contemporanee, una
per livello (due `Edition_0` in M1, due `Book` in M2):

```
tab M1 aperta          2 entry M1
apro la tab M2         2 entry M2   e le due M1 SPARISCONO
                       (nello stato i due Edition_0 ci sono ancora: 3a-ctrl)
torno sulla tab M1     restano le 2 M2, le 2 M1 NON tornano
```

Il meccanismo e' nel ciclo di revoca (`UniquenessProblemSync.tsx:160-164`): la
`Map` e' una sola per la sessione, ma ogni produttore tratta come propria
**qualunque** entry di kind `duplicate-name` e marca risolto tutto cio' che il
**suo** scan non desidera. L'editor M2, montato con il suo `modelid`, scandisce
solo M2 e cancella le entry di M1; e non tornano, perche' l'effetto di M1 riparte
solo su cambio di firma, non su cambio di tab.

Costo: un warning M1 **vero** puo' sparire per il resto della sessione solo
perche' l'utente e' passato dal metamodello. E' un difetto distinto da quello di
§1-§5 e vive in un punto diverso; non e' toccato dai candidati C1..C4.

---

## A.5 Chi lo vede davvero: la form dell'OGGETTO, e nient'altro

Lo screenshot dice «No issues» sulla form di `Book_0`, e la domanda che ne segue
non e' se la form sbagli ma **chi legge**. `IRForm` chiama
`useNodeProblems(objectId)` (`IRForm.tsx:334`) — per il **solo** oggetto
selezionato, come `EntityRow`, senza aggregazione — e `collectFormDiagnostics`
manda il `duplicate-name` nel residuo, contato ma senza campo a cui attaccarsi
(`formDiagnostics.ts:95-98`). Misurato sui due lati, con il falso positivo attivo
(2 entry) e la form aperta dalla tab «Form» dell'inspector
(`PropertiesWithTreeView.tsx:1109` — senza quel click la form non e' nel DOM
affatto, ed e' cosi' che il primo giro della sonda ha misurato zero):

```
form di Book_0        «No issues»    ← lo screenshot, e ha ragione: le entry sono sui figli
form di Edition_0     «1 warning»    ← il falso positivo, visibile qui e solo qui
```

Quindi il quadro dello screenshot torna per intero, tessera per tessera: il badge
conta i figli, la form del padre dice il vero perche' il padre non ha entry, il
canvas tace per il disallineamento di chiavi che l'intestazione di
`UniquenessProblemSync` gia' dichiara (entry sull'id dell'elemento, indicatore
montato sull'id del DVertex), e i due warning stavano — prima del rename — nella
form dei due figli, che nello screenshot non era aperta.

## A.6 Cosa cambia per i candidati di §7

Niente su C1..C4: il falso positivo esiste ancora, riprodotto qui (2 entry attive
prima del rename), e resta visibile dove §A.5 lo misura. Cambia solo il **raggio**:
non e' un'infezione diffusa dell'interfaccia, e' una riga nella form del singolo
oggetto in collisione, che sparisce al primo rename.

Che vale anche al contrario, ed e' il fatto piu' scomodo di questa appendice: la
collisione **vera** di §6 — due `Edition_0` prodotti da due Add senza rinomina —
sta esattamente nello stesso unico posto. Sull'albero non compare (§A.1), sul
canvas nemmeno, e sopravvive al reload (§A.3). Il primo lettore che si
aggiungera' (una `useNodeProblems` in `FeatureRow`, o l'allineamento delle chiavi
sul canvas) accendera' insieme il vero e il falso.

**C5, nuovo** — restringere la revoca al proprio modello: il produttore conosce il
suo `modelid`, le entry no. Costo: aggiungere un campo alle entry (o un prefisso
all'id) tocca `registry.ts`, il produttore della conformance che scrive nella
stessa mappa, e i loro test. Non raccomandato qui: e' il difetto di §A.4, non
quello per cui UNQ1 e' stata aperta.

---

# Referto UNQ1 F2 — la correzione, e la strada che non e' stata presa

Aggiunto 2026-09-02. Commit del codice `a8260a83`, perimetro
`model/logicWrapper/LModelElement.tsx` piu' il suo test. `UniquenessProblemSync.tsx`
non e' toccato: e' la corsia L2. **C1 scartato** — la domanda di §8 resta aperta e
questa correzione non la risponde: un `LValue` di containment continua a NON avere
figli per chiunque legga `children`.

## F2.1 Cosa e' cambiato, in due punti

**A — `LObject.get_name` (:6081).** Uno slot identita' i cui `values` grezzi sono
l'array vuoto cede a `context.data.name`. L'auto-nome resta il ripiego del solo caso
in cui anche `data.name` e' vuoto. Uno slot **popolato** vince come prima: la
direzione slot -> nome di §3.12 di CLAUDE.md non e' toccata, ed e' il caso che il
test tiene fermo per primo.

La lettura grezza passa da `slot.__raw.values`, lo stesso idioma che `set_name` usa
gia' a :6385 per scavalcare proprio questo ripiego di lettura. Solo l'array
letteralmente vuoto conta come vuoto: uno slot che tiene davvero `''` — un nome
cancellato di proposito — non e' il caso misurato in §1(b) e resta come era.

**B — `DObject.autoName`, nuovo (:6024).** I due creatori (`new`, `new3`) calcolavano
il default con `DPointerTargetable.defaultname`, che per un padre `DValue` legge un
namespace vuoto (§1c). Ora il solo caso `DValue` passa da `getNamespaceOf`
(`nameUniqueness.ts:168`) — il punto unico dove lo scope M1 e' deciso, e che quello
slot lo sa gia' scendere — e ne consegna i nomi a `U.increaseEndingNumber` nella sua
forma a predicato. Un padre `DModel` resta sulla strada di prima, byte per byte.

**Cosa NON e' cambiato**, ed e' il punto: `get_children_idlist` non e' stato allargato
a `LValue`. C1 chiudeva gli stessi due lati ma cambiava il significato di «figlio» per
una classe che finora non ne aveva, e il suo costo era il censimento dei lettori di
`children`. Qui i punti che sanno scendere uno slot restano tre — `getNamespaceOf`,
`LObject.subObjects`, e ora l'auto-nome che si appoggia al primo — invece di due su
tre. Meno di quanto §8 chiedeva, e senza il censimento che non e' stato fatto.

## F2.2 Il censimento che la correzione A doveva fare prima

Richiesto dal prompt: i lettori di `get_name` che contano sull'auto-nome **in
finestra**. La differenza esiste solo quando lo slot e' `[]` **e** `data.name` e'
pieno: prima si otteneva l'`initialName`, ora `data.name`.

Chi vuole l'auto-nome lo chiede per nome, e sempre **dopo** il nome:

| riga:col | espressione |
|---|---|
| `components/abstract/tabs/instanceTable.ts:127:16` | `String(target.name ?? target.initialName ?? '')` |
| `components/editor-v2/hooks/shapeDraw.ts:205:28` | `owner.name ?? owner.initialName ?? ''` |
| `components/editor-v2/viewpoint/ir/irReadCtx.ts:173:20` | `d?.name ?? d?.initialName ?? null` |

Tutti e tre scendono all'`initialName` solo quando il nome e' vuoto, ed e' esattamente
il caso che la correzione lascia intatto. Nessun altro lettore confronta `.name` con
`initialName`, e nessuno cerca la forma `<Metaclasse>_<N>`: la ricerca sull'albero
(`TreeViewContent`), sul canvas e sui chip non ha prodotto occorrenze.
`ConformanceValidator.ts:165` legge apposta il grezzo per non farsi mascherare dal
ripiego, e non passa da qui. Nessun bloccante: si e' proceduto.

Fuori perimetro e non toccato, ma da registrare: `jjscript/executor/commands/instance.ts`
(:379, :592) scrive `initialName` con il nome esplicito proprio per aggirare l'ordine
che A cambia. Dopo A quelle due scritture sono ridondanti, non dannose — tengono
`initialName` allineato a `name`. Rimuoverle e' un giro suo.

## F2.3 Le misure

**Sonda** `scripts/smoke/_tmp_unq1f2_verify.ts`, non committata (`.gitignore:66`), contro
il dev server, zero `pageerror` in entrambe le corse. Il prima e' stato ottenuto
ripristinando il solo `LModelElement.tsx` da `git show HEAD:` e rimettendolo a posto da
una copia — **nessuno `stash`** (RC-13, §6.4).

| | prima (HEAD) | dopo |
|---|---|---|
| A campioni con `raw != proxy` nella finestra | **9** su 9 con lo slot pieno | **0** |
| A esempio del campione sbagliato | `raw [Edition_0, Edition_1]` / `proxy [Edition_0, Edition_0]` | — |
| B secondo `Add` senza rinomina | `Edition_0` | **`Edition_1`** |
| B nomi finali nello slot | `[Edition_0, Edition_0]` | `[Edition_0, Edition_1]` |
| C duplicate-name attivi, M1 aperto | **2** | **0** |
| D controllo, due root senza nome | `Book_0`, `Book_1` | `Book_0`, `Book_1` |
| totale | 4 PASS / 4 FAIL | **8 PASS / 0 FAIL** |

I 4 FAIL del prima non sono un guasto della sonda: sono le asserzioni scritte come il
comportamento corretto, ed e' quello che le rende una misura invece di un rituale. D e
A-ctrl passano in **entrambe** le corse — il controllo positivo che dice che lo
strumento sa distinguere il grezzo dal proxy e che le root non sono state toccate.

Va detto dove la misura di A e' piu' stretta di quanto sembri: dei 20 campioni a 25 ms,
gli 11 iniziali vedono lo slot con **un solo** valore, e su quelli l'asserzione non si
pronuncia. La finestra utile qui e' stata di 9 campioni, non di 17 come in §2; il
confronto prima/dopo su quei 9 e' netto e basta a questa correzione, ma il limite
superiore della finestra continua a non essere misurato.

**Unit test** `model/__tests__/unq1AutoNameShadow.test.ts`, 20 casi, verdi.
`LModelElement.tsx` non e' importabile sotto vitest (`window is not defined` da monaco,
via la barrel `joiner`), e i tre test che lo precedono per questo si fermano al
confronto testuale. Qui il corpo dei due metodi viene **letto dal file**, i tipi
cancellati da esbuild — la stessa cancellazione della build — e il risultato eseguito
con le sole dipendenze libere iniettate: gira il sorgente committato, non una sua
parafrasi. Anche `U.increaseEndingNumber` e' quello vero, estratto allo stesso modo,
perche' iniettarne un'imitazione avrebbe misurato l'imitazione.

**Mutazioni**, perche' venti verdi non dicono da soli di essere sensibili:

| mutazione | esito |
|---|---|
| `rawValues.length === 0` -> `=== -1` (la guardia di A non scatta mai) | **3 rossi**, fra cui i due casi della finestra |
| il namespace di B svuotato, con `getNamespaceOf` ancora chiamato | **3 rossi**, tutti i casi del contatore |
| `get_name` riportato alla riga di HEAD | rosso sull'ancoraggio: il test chiede di essere aggiornato invece di misurare un altro soggetto |

**Gate**: `tsc` 33, la baseline esatta, 0 nel file toccato; `build` exit 0 con il solo
avviso di chunk-size gia' noto; `vitest` 3118 test verdi, 0 falliti. I 9 file che non
si raccolgono sono i `window is not defined` pre-esistenti, riverificati sul
`LModelElement.tsx` di HEAD: falliscono identici anche senza questa correzione.

## F2.4 Cosa resta aperto

Niente di quanto qui e' stato chiuso tocca gli altri due difetti che il referto ha
isolato, e vanno lasciati scritti perche' non sembrino risolti:

- **§A.4, la revoca globale.** Un warning M1 vero sparisce per il resto della sessione
  se l'utente passa dalla tab M2. C5 vive in `registry.ts` e nel produttore, non qui.
- **§A.1 e §A.5, chi legge.** Il badge del tree conta figli, non problemi, e una
  collisione vera resta visibile nella sola form dell'oggetto. Il primo lettore che si
  aggiungera' accendera' insieme il vero e il falso — con la differenza che dopo questa
  correzione il falso, nel percorso di creazione, non si accende piu'.
- **§8, la domanda di merito.** Un `LValue` di containment ha figli? Qui si e' risposto
  «non serve deciderlo per chiudere UNQ1», che non e' una risposta.

---

# Referto UNQ1 C5 — la revoca scopata al modello scansionato

Aggiunto 2026-09-02. Commit del codice `4bde4359`, perimetro
`components/editor-v2/problems/UniquenessProblemSync.tsx` piu' il suo test, nuovo.
`registry.ts` **non** e' toccato, e nemmeno `LModelElement.tsx`: quella e' la corsia
del referto F2 qui sopra. Chiude §A.4, e nient'altro.

## C5.1 Cosa e' cambiato, in un punto

Il ciclo di revoca (`:160-164` di HEAD) leggeva il registro intero e marcava risolta
ogni entry di kind `duplicate-name` che il **proprio** scan non desiderava. Ora legge
`ownedIdsByModel`, una `Map<modelid, Set<problemId>>` di modulo: il produttore revoca
solo gli id che ha registrato **per il modello che sta scandendo**, e in fondo alla
corsa vi riscrive il proprio `desiredIds`.

Tutto il resto e' fermo. La firma di reattivita' non cambia di un carattere, i due
`detect*DuplicateNames` sono chiamati come prima e nessuno scan e' aggiunto: il corpo
dell'effetto e' **spostato** in `reconcileDuplicateProblems(modelid)`, esportata perche'
il test possa chiamarla — sotto `vitest` l'ambiente e' `node`, e montare il componente
vorrebbe un DOM che la suite non ha. L'effetto e' diventato una riga che la chiama.

Cade con il ciclo anche `getRegistryState()`, che esisteva per servirlo e per nient'altro.
Vale la pena dire cosa nascondeva: leggeva `window._jjNodeProblems`, e in ambiente `node`
`typeof window === 'undefined'` le faceva restituire una `Map` vuota. Un test della
revoca, prima, avrebbe iterato il nulla e sarebbe stato verde per costruzione.

## C5.2 Perche' non un campo sulle entry, e perche' non un lookup

C5 nel referto costava «un campo alle entry (o un prefisso all'id)», cioe' `registry.ts`
piu' il produttore della conformance che scrive nella stessa `Map`, piu' i loro test. Non
serve: una entry `duplicate-name` su un elemento del modello M puo' averla scritta **solo**
il produttore montato su M, che e' l'unico a scandire M. L'appartenenza esiste gia', non
scritta da nessuna parte — e la contabilita' del produttore la rende esplicita senza
toccare il tipo condiviso.

La `Map` e' di modulo e non un `useRef` di proposito: una tab che si smonta e torna deve
ancora riconoscere le entry che il **suo** modello ha lasciato, o una collisione risolta a
tab chiusa non verrebbe revocata mai piu'.

L'alternativa scartata e' risalire il padre di `entry.nodeId` fino al `DModel` e
confrontarlo con `modelid`. Legge piu' letteralmente «l'owner appartiene al modello», e
perde un caso che la contabilita' tiene: un elemento **cancellato** non risale piu' a
nessun modello, quindi nessun produttore lo rivendicherebbe e la sua entry resterebbe nel
registro per sempre. Con `ownedIdsByModel` l'id era nostro, qualunque cosa sia successa
all'elemento che nominava — ed e' un caso del test.

## C5.3 Le misure

**Sonda** `scripts/smoke/_tmp_unq1_c5.ts`, non committata (`.gitignore:66`), contro il dev
server, zero `pageerror` in entrambe le corse. Il prima e' stato ottenuto ripristinando il
solo `UniquenessProblemSync.tsx` da `git show HEAD:` e rimettendolo a posto da una copia —
**nessuno `stash`** (RC-13, §6.4).

Lo stato: **tre** nested omonimi in M1 e **due** classi omonime in M2, vivi insieme. I nomi
sono espliciti, scritti con `SetFieldAction` sul campo `name` del D-layer — il percorso «che
scavalca i setter» per cui il produttore esiste. Non dipendono dal default-name, che la
corsia F2 stava correggendo nello stesso albero: dopo quella correzione due `Add` non
producono piu' due `Edition_0`, e una sonda che ci contasse sopra non misurerebbe piu' nulla.

| entry attive | prima (HEAD) | dopo |
|---|---|---|
| M1, con la sola tab M1 aperta | 3 | 3 |
| M1, subito dopo aver aperto la tab M2 | **0** | **3** |
| M2, nello stesso istante | 2 | 2 |
| M1, tornando sulla tab M1 | **0** | **3** |
| M1, dopo il rename di uno dei tre | **0** | **2** |
| M2, nello stesso istante | 2 | 2 |
| M1, dopo il rename del secondo | 0 | 0 |
| totale | **9 PASS / 3 FAIL** | **12 PASS / 0 FAIL** |

I 3 FAIL del prima sono asserzioni scritte come il comportamento corretto. Le altre nove
passano in entrambe le corse, e due meritano di essere lette per quello che sono: «le entry
M2 non sono state toccate dal produttore M1» passava **anche prima**, perche' con la sola
tab M2 aperta per ultima il produttore M1 non ripartiva affatto; e «nessuna entry M1 attiva
dopo il secondo rename» passava prima **a vuoto**, perche' non ce n'erano piu' da revocare.
Il controllo che regge la misura e' l'ultimo: la collisione M1 e' ancora vera nello stato
mentre le entry erano sparite (`3a-ctrl` di §A.4, ripetuto qui).

Sull'aritmetica che il prompt si aspettava — «risolvere una in M1 -> 1». Per una **coppia**
non e' cosi': la collisione e' una proprieta' dei due, e rinominarne uno revoca **entrambe**
le entry, 2 -> 0. Il decremento si vede solo con tre omonimi, ed e' il motivo per cui la
sonda ne semina tre: 3 -> 2 al primo rename, 2 -> 0 al secondo, quando i rimasti tornano a
essere due e smettono insieme.

**Unit test** `components/editor-v2/problems/__tests__/UniquenessProblemSync.test.ts`, 7
casi, verdi. La barrel `joiner` e' finta — tre `cname`, il dizionario dei pending e
`fromPointer` — e tutto il resto gira vero: i due `detect*`, il registro, il diff. Le
collisioni del fixture sono per nome esplicito, sulle stesse forme duck-typed che i
risolutori leggono sul campo (l'idioma di `model/__tests__/m2NameUniqueness.test.ts`). Ogni
caso riparte da un grafo di moduli fresco: sia la `Map` del registro sia la contabilita'
sono di modulo, e un test che le ereditasse misurerebbe l'ordine del file.

**Mutazioni**, perche' sette verdi non dicono da soli di essere sensibili:

| mutazione | esito |
|---|---|
| revoca su **tutti** gli owned set (il globale di prima, riscritto senza `window`) | **3 rossi**: l'apertura della seconda tab, il ritorno, e la revoca del proprio |
| ciclo di revoca rimosso del tutto | **4 rossi**: le due risoluzioni, il vicino di kind, l'elemento cancellato |

**Gate**: `tsc` 33, la baseline esatta, 0 nei file toccati; `build` exit 0 con il solo
avviso di chunk-size gia' noto; `vitest` 3118 test verdi, 0 falliti. I 9 file che non si
raccolgono sono i `window is not defined` pre-esistenti, indipendenti da questo perimetro.

## C5.4 Cosa resta aperto

- **§A.1 e §A.5, chi legge.** Invariati: il badge dell'albero conta figli, le righe M1 non
  hanno indicatore, e una collisione si vede nella sola form dell'oggetto. Questa correzione
  non aggiunge un lettore — rende solo vero cio' che quell'unico lettore mostra.
- **Il disallineamento di chiavi sul canvas** (entry sull'id dell'elemento, indicatore sull'id
  del `DVertex`) resta dov'era, dichiarato nell'intestazione del produttore.
- **Le entry continuano a non portare un modello.** Se un domani un terzo produttore scrivesse
  `duplicate-name` sulla stessa `Map`, la contabilita' per produttore resterebbe corretta ma
  la domanda «di chi e' questa entry» tornerebbe a non avere risposta nel dato. Il campo su
  `NodeProblem` resta il rimedio vero, e resta non fatto.

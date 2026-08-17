# Memo di ratifica — La marcatura come predicato dell'IR

**Data**: 2026-08-18
**Origine**: estensione futura dichiarata da R-SIM-4 («il namespace `state` nelle espressioni
IR ... emenda la spec §9 e tocca `pathExpr.ts` + `irReadCtx.ts` + `irCrossDeps.ts` +
`IRNodeContent.tsx`»), aperta in chat Cowork dopo la ratifica della serie R-J.
**Base di evidenza**: `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md`
(Q5b, Q8 R1..R9), più lettura diretta di `irTypes.ts:24-36`, `irCompile.ts:126-185`,
`irReadCtx.ts:17-32`, `pathExpr.ts:23`, `sim/simRunState.ts`.
**Stato**: proposta di ratifica.

---

## Il punto di partenza, e la trappola che ha cambiato il disegno

R-SIM-4 chiama l'estensione «namespace `state`», e la lettura letterale porta a esporre alle
espressioni IR il bag `_state`. **Quella lettura non produce la feature che la motiva.**

Il run-state della simulazione **non è** nel bag: R-SIM-1 lo ha messo apposta fuori da Redux, in
`frontend/src/components/editor-v2/sim/simRunState.ts` (90 righe, Set di id più version counter,
`isSimActive` / `getSimVersion` / `useSimVersion` su `useSyncExternalStore`). Nel bag `data.state`
del M2 c'è la sola **configurazione** dei ruoli (R-SIM-2: `simNode`, `simInitial`, …). Un
`state.active` che leggesse `_state` tornerebbe vuoto, sempre.

Sono due oggetti diversi con due profili di rischio opposti. Il bag persistito porta con sé
l'intera lista Q8 della discovery: spazio piatto e già affollato di 19 chiavi in uso (R1),
stringhe riavvolte in proxy L in lettura (R2), mutazioni annidate che bypassano azioni, delta,
undo, socket e re-render (R3), nessuna garbage collection su un bag persistito e trasmesso (R4),
undo che si riempie di passi di simulazione mescolati alle edit di modello (R6). Il singleton non
ne porta nessuno, per costruzione.

**E una seconda misura ha cambiato il meccanismo, non solo la sorgente.** `Predicate`
(`irTypes.ts:24-31`) è già un'unione taggata chiusa che contiene un operatore **strutturale** non
esprimibile come path: `{ op: 'isKind'; class: string; path?: PathExpr }`, compilato in
`irCompile.ts:154-163` con la forma «se c'è `path` risolvilo e interroga il target, altrimenti
interroga l'elemento corrente». È l'asse progettato per questa classe di domande. La marcatura
entra lì, non nella grammatica delle espressioni.

---

## R-MK-1 — La marcatura è di prima classe nell'IR, ed è un predicato, non un valore

Si introduce l'operatore `{ op: 'marked'; path?: PathExpr }` in `Predicate`, sul precedente
esatto di `isKind`. **Non** un identificatore nudo `run.active`, **non** un allargamento di
`STEP_RE`, **non** un membro d'unione accanto a `PathExpr`.

Rationale, in quest'ordine:

1. **Una marcatura è booleana per costruzione.** Non c'è un «valore» da interpolare in una label:
   l'elemento è marcato o non lo è. Modellarla come valore leggibile crea una superficie che
   nessun caso d'uso chiede.
2. **`Predicate` è l'asse giusto e ha già il precedente.** `isKind` fa esattamente questo: pone
   una domanda strutturale sull'elemento senza passare dal path. La simmetria è totale, incluso
   il `path?` opzionale per interrogare un altro elemento invece di quello corrente.
3. **Funziona sulla grammatica di oggi.** La feature non aspetta J2, che è la fetta rischiosa
   della serie R-J e resta deliberatamente non calendarizzata.
4. **R-J7 resta intatta.** Vieta nuovi membri d'unione *di `PathExpr`*; un operatore di
   `Predicate` non lo è, e la grammatica delle espressioni non si tocca di una riga.

Guadagno immediato e non teorico: `marked` compone con `and` / `or` / `not` e si innesta in
**ogni** `Conditional<T>` già nello schema (`fill`, `color`, `visible`, `marker`, `form`,
`lineColor`, `lineWidth`, `lineStyle`, `fontWeight`, …). «Colora di rosso lo stato attivo»,
«ingrossa il bordo della transizione che scatta», «mostra questo compartimento solo quando
l'oggetto è marcato» diventano autorabili su ogni asse senza superficie nuova oltre a una voce
nel `PredicateBuilder`.

## R-MK-2 — La sorgente è la marcatura effimera, mai il bag persistito

`isMarked` legge il singleton di run-state (R-SIM-1), **mai** `_state`. Il bag resta invisibile
alle espressioni IR.

Rationale: tutti i rischi Q8 sono proprietà del bag persistito, nessuno del singleton. E
l'asimmetria di costo è netta: esporre `_state` più avanti è una ratifica additiva; ritirarlo
dopo che dei viewpoint salvati ci dipendono è una migrazione con VersionFixer su view che per
R-B9 non ne hanno uno.

## R-MK-3 — Il nome è neutro. `marked`, non `sim`

Il costrutto è una marcatura, non un dettaglio di simulazione. Nel filone sulla classificazione
dinamica intensionale il tipo dinamico è funzione della marcatura del modello, e «la sintassi
concreta reagisce al tipo dinamico» è precisamente ciò che questo operatore rende autorabile.
Chiamarlo `sim` incatenerebbe un costrutto generale a uno dei suoi usi.

**Punto di estensione riservato e non implementato**: un futuro `mark?: string` per marcature
nominate, con default sull'unica marcatura di oggi. Si dichiara qui perché la forma dello schema
lo permetta senza rottura; non si scrive ora.

## R-MK-4 — `ReadCtx` cresce di `isMarked(elementId): boolean`

Un metodo, semantica totale (nessun `null`: non marcato è `false`), lookup su Set nel singleton.

**Coordinamento, esplicito perché sono tre ratifiche sullo stesso punto di crescita**: R-B14
riserva la superficie di `ReadCtx` «all'estensione `state` (R-SIM-4)» — questa ratifica *è*
quell'estensione, nella forma che la discovery ha reso possibile; R-J5 vuole aggiungere
`getParent` allo stesso posto. Chi arriva secondo rilegge la superficie prima di scrivere.

Il vincolo dominante di R-J5 vale identico qui: il contesto di valutazione dell'IR è un
adattatore lazy sul `ReadCtx` e non materializza il modello. `isMarked` non lo viola.

## R-MK-5 — Il dependency set acquisisce UNA nozione di dipendenza non-feature: i canali dichiarati

Insieme chiuso, allargabile per ratifica, con **due membri alla nascita**:

- `mark` — il version counter del singleton (`getSimVersion`);
- `container` — il debito dichiarato da R-B16, che **si chiude qui** invece di prendersi una
  ratifica propria.

Due vincoli di forma, entrambi load-bearing:

- **I canali sono un insieme separato dal feature set, mai pseudo-feature prefissate.** Il feature
  set viene concretizzato in id di DValue da `irCrossDeps` (`irCrossDeps.ts:1-28`): una
  pseudo-feature `@mark` avvelenerebbe quella concretizzazione con un id che non esiste.
  Operativamente, `compilePredicate` riceve un secondo insieme accanto a `deps`.
- **Emendamento alla spec §9**: il dependency set ha due parti, feature e canali dichiarati. La
  clausola restrittiva («NON DEVE re-renderizzare per feature fuori dal set») si conserva su
  entrambe: niente re-render per un canale non dichiarato dall'elemento.

## R-MK-6 — La granularità di v1 è grossa, ed è dichiarata

Un bump di canale invalida **ogni** elemento che quel canale lo dichiara: uno step di simulazione
re-renderizza tutti i nodi la cui view legge `marked`. È lo stesso ordine di grandezza
dell'highlight di oggi (R-SIM-3, hook di versione al wrapper del nodo), quindi non è una
regressione: è il costo corrente reso autorabile.

Limite dichiarato, non bug. La granularità per elemento è un raffinamento futuro con ratifica
propria, da aprire **su una misura e non su un'intuizione**.

## R-MK-7 — Fallback espliciti, come vuole la spec §10

Elemento senza marcatura: `false`, mai `undefined`. `path` che si esaurisce: `false`, con la
ragione visibile nella diagnostica di authoring. Nessun default silenzioso, e `marked` non lancia:
un IR malformato mostra l'errore in authoring come le altre regole di `validateIR`.

## R-MK-8 — L'highlight di R-SIM-3 non si rimuove ora

La classe `sim-active` su `ObjectNode` resta: è il comportamento di default per i viewpoint che
non autorano `marked`. Il suo ritiro è una fetta separata con ratifica propria, da aprire solo
quando `marked` ha un consumatore reale. R-SIM-3 è committato e verificato a schermo, e
comportamento verificato non si degrada (CLAUDE.md, regola 3).

---

## Cosa NON si decide qui

- **Leggere `_state` dalle espressioni IR.** Rinviato, con ratifica propria e con le mitigazioni
  per Q8 R1..R6 come prerequisito, non come nota.
- **Marcature nominate** (`mark?: string`). Riservate in R-MK-3, non implementate.
- **Scrivere la marcatura dalla notazione.** L'IR resta in sola lettura sulla marcatura, che
  continua a scriversi solo dal pannello. Q8 R9 è netto: il canale di esecuzione di azioni
  autorate non esiste affatto (nessun call site per gli handler di view, `irTypes.ts` non ha
  alcun concetto di azione). È un pezzo mancante a monte, non una decisione da prendere qui.
- **Granularità per elemento** dell'invalidazione da canale (R-MK-6).
- **Simulazione condivisa**: già parcheggiata da R-SIM-4, canale socket dedicato.

## Staging

| Fetta | Contenuto | Rischio |
|---|---|---|
| **M1** | `ReadCtx.isMarked` sui due backend; `{op:'marked'}` in `irTypes.ts` + `irCompile.ts`; insieme dei canali separato da `deps`; emendamento spec §9. **Nessuna UI di authoring.** Test. | medio, **critical zone** |
| **M2** | `PredicateBuilder`: voce «È marcato», con `path` opzionale e diagnostica | basso, UX |
| **M3** | `container` migra sul canale e chiude il debito di R-B16 | alto, tocca il sync |

**M1 e M3 sono in critical zone** (`editor-v2/viewpoint/ir/` per M1, `useJjomSync` /
`useM1ReferenceEdges` per M3, CLAUDE.md §3.1): corsia completa, two-phase con discovery report in
`docs/discovery/`, **Layer Impact Report obbligatorio prima del diff**, effort xhigh.

L'ordine non è negoziabile su un punto: **M2 dopo M1**. Un'UI che autora un operatore che
l'interprete non compila ancora produce IR salvato che non rende, e per R-B9 le view IR non hanno
VersionFixer per ripulirlo.

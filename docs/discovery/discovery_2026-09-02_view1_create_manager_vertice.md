# VIEW1 — la create dal Data Manager non instanziava il vertice sul canvas

Data 2026-09-02. Branch `alfonso-frontend-jjtl`. Commit del codice `783a8245d`, perimetro
`components/editor-v2/hooks/createAdapter.ts` piu' il suo test, nuovo. Due file.

**Ipotesi che questa discovery falsifica**: «il canvas sbaglia a disegnare un figlio creato
dal manager». Falsa. Al canvas mancava il `DVertex` da disegnare: non stava fallendo a
disegnarne uno.

## 1. La divergenza, misurata

Sonda `frontend/scripts/smoke/_tmp_view1_verify.ts` (`.gitignore:66`, non committata),
contro il dev server, `pageerror` 0 in ogni corsa. Modello `Book --editions*--> Edition`,
composition, `Edition.isbn` [1..1] per dare qualcosa da dire alla conformance.

Le strade sono **tre**, non due. Il prompt ne nomina due e attribuisce l'arco alla strada
del canvas: `syncCreateObject` (`canvasToJjom.ts:1371-1410`) chiama in realta' il solo
`createVertexForObject` (`:1405`), e `createCompositionEdgeForObjects` (`:1423`) ha un solo
chiamante in tutto il repo, `ContextMenu.tsx:372`. L'arco della strada canvas viene da una
terza funzione, `syncCreateCompositionLink` (`:1573`), via `EditorV2.tsx:2897`.

| | M — manager | C — canvas | X — context menu |
|---|---|---|---|
| entry point | CTA «Add Edition» -> `writeCtxLproxy.ts:154` -> `createInstance` `:379` | `EditorV2.tsx:2866` `createCompositionChild` | `ContextMenu.tsx:381` |
| crea l'oggetto con | `slot.addObject(json, classId, true)` `:420` | `syncCreateObject` `:2880` (`DObject.new`, father `DModel`) | `LValue.addObject` |
| vertice | **nessuno** | `createVertexForObject` `:1405` | `createVertexForObject` `:371` |
| arco | **nessuno** | `syncCreateCompositionLink` `:2897` | `createCompositionEdgeForObjects` `:372` |

La fotografia dei due figli, sui quattro assi chiesti dal punto 1 (misura, non lettura):

| | `DObject` | `father` | in `model.objects` | `DVertex` | `DEdge` | in `$editions.values` |
|---|---|---|---|---|---|---|
| **M** (prima) | c'e' | `DValue` | **no** | **null** | **null** | si' |
| **M** (dopo) | c'e' | `DValue` | **no** | `…USER_36` | `…USER_37` | si' |
| **C** | c'e' | `DValue` | **si'** | `…USER_39` | `…USER_40` | si' |

**La causa e' in quella colonna centrale.** `useJjomSync` Step 2 itera `rawModel.objects`
(`useJjomSync.ts:759`) e un annidato non e' in quella collezione **per costruzione**: il
costruttore di `DObject` appende a `model.objects` solo se il padre e' il `DModel`, e alle
`values` dello slot altrimenti (`joiner/classes.ts:774-784`, citato verbatim in
`ConformanceValidator.ts:525-528`) — verificato riga per riga: `fatherType.cname === "DModel"`
-> `objects`, altrimenti -> `values`, con il commento «object containing object is not in any
direct child collection». E il padre di un contenuto **e'** lo slot: `addObject` passa
`father: c.data.id` a `DObject.new3` a `LModelElement.tsx:6995`. Il chip si vede perche' legge
lo slot; il nodo no perche' non c'era un `DVertex`.

*Nota sui puntatori altrui*: sia `ConformanceValidator.ts:529` sia `createAdapter.ts:19`
citano quella riga come `LModelElement.tsx:7171` e `:7043`, e nessuna delle due oggi ci
arriva (`:7171` e' un commento su un match di sottoclassi, `:7043` un `get_derived_write`).
Sono derive pre-esistenti in file fuori perimetro: constatate, non corrette.

Da notare, e non corretto qui: **C produce la forma anomala**, non M. Il suo figlio e' in
`model.objects` *e* ha `father = DValue` — una radice riparentata, che resta elencata fra le
radici. M ha la forma canonica. Il fix quindi non copia C: gli aggiunge gli artefatti del
grafo lasciando la forma del modello dov'e'.

## 2. Chi possiede l'identita'

- **`findVertexIdForObject` risolve per id del `DObject`**, non per chiave di storage:
  `canvasToJjom.ts:1347-1357`, `ge.className === 'DVertex' && ge.model === objectId`, sopra
  `graph.subElements`. Il `DVertex` porta l'id dell'oggetto nel proprio campo `model`.
- **Un figlio del manager non riceve alcuna entry di conformance**, ne' sull'id
  dell'oggetto ne' su quello del vertice. Misurato, e **non e' un difetto**: il perimetro di
  visita del validatore e' `model.objects`, ratificato in CRUD3 F2 e scritto in chiaro a
  `ConformanceValidator.ts:534` — «a nested object is a legitimate TARGET, it is not
  something this validator walks». La prima versione della sonda asseriva il contrario ed e'
  stata corretta: l'asserzione era sbagliata, non il codice.
- Il figlio di C, che *e'* in `model.objects`, ne riceve una — sull'id del `DObject`, e
  (quando il vertice esiste) anche sull'id del `DVertex`, che e' il disallineamento di
  chiavi gia' tracciato. Misurato qui, non toccato.

## 3. Quanti canvas, e come si ottiene quello attivo

- **Non esiste** una nozione di canvas attivo. `activeGraph`, `focusedGraph`,
  `currentGraph`: zero occorrenze in `frontend/src`. Controllo positivo sullo stesso comando
  e sullo stesso corpus, con `graphStyle` aggiunto all'alternanza: 7 file. La ricerca ha
  segnale, quindi il silenzio e' un risultato.
- L'idioma committato e' **primo match** su `state.graphs` filtrato per
  `model === modelId && graphStyle === 'v2-flow'`, in **due** posti: `ContextMenu.tsx:356` e
  `useJjomSync.ts:282`.
- **Zero canvas**: caso reale, misurato (3d). Un modello la cui tab non e' mai stata aperta
  ha zero grafi v2-flow. `syncChildToFlow` esce senza scrivere.
- **N canvas**: primo match, come nei due siti esistenti. Attenzione a cosa si conta:
  `state.graphs` elenca lo **stesso id piu' volte** (misurato: 2 entry, **1** grafo
  distinto). Le entry non sono i grafi, e una sonda che contasse le entry leggerebbe due
  canvas dove ce n'e' uno.

## 4. Il candidato scelto, e quello scartato

**Scelto (a) — simmetria dei percorsi.** `createInstance` crea vertice e arco dopo
`addObject`, come `ContextMenu.tsx:347-373` fa gia' dopo `LValue.addObject`. Il punto 3 lo
rende ammissibile: la semantica con zero o N canvas non va **inventata**, esiste gia' ed e'
committata in due posti. Costo reale, misurato: **nessun file della critical zone e'
modificato** — `createVertexForObject` e `createCompositionEdgeForObjects` sono gia'
esportate (`:1326`, `:1423`) e gia' chiamate cosi' dal ContextMenu; l'unica novita' e' un
import. Nessun `TRANSACTION` avvolge i creatori (rule 12 / §3.3): le due funzioni sono
chiamate dopo il ritorno di `addObject`, esattamente come dal ContextMenu.

**Scartato (b) — il canvas autorita' sul layout.** Il render dovrebbe trattare un figlio di
containment senza vertice come da posizionare. Ma per *trovarlo* deve uscire da
`model.objects`, che e' il perimetro **ratificato** (CRUD3 F2), e per *reagire* alla sua
comparsa serve uno Step 4 che riparta sulle scritture di slot — cioe' esattamente cio' che
CLAUDE.md §3.5 vieta in quelle parole («Do not "fix" Step 4 deps to include M1 value
counters»). Sarebbe un cambio in `useJjomSync.ts`, critical zone, piu' un hook nuovo sul
modello di `useM1ReferenceEdges`. Molto piu' grande, e contro due vincoli scritti.

Il discriminante del punto 3 **non** ha escluso (a): una nozione affidabile di grafo del
modello esiste, ed e' quella che il codice gia' usa. Se non fosse esistita, (a) sarebbe
caduto e lo si sarebbe detto invece di inventarne una.

## 5. Le misure

Sonda, prima e dopo, entrambe **attraverso la UI vera** del Data Manager (apertura tab,
picker, riga `Book`, CTA «Add Edition», draft, commit):

| | prima (`783a8245d^`) | dopo |
|---|---|---|
| il `DObject` esiste, e il valore e' nello slot | PASS | PASS |
| **il figlio ha un vertice** | **FAIL** | PASS |
| **e l'arco di containment** | **FAIL** | PASS |
| **e il vertice avvolge proprio quel `DObject`** | **FAIL** | PASS |
| un solo grafo v2-flow distinto, ed e' quello del primo match | PASS | PASS |
| zero grafi per un modello mai aperto | PASS | PASS |
| il perimetro di conformance e' quello ratificato | PASS | PASS |
| **totale** | **13 PASS / 3 FAIL** | **16 PASS / 0 FAIL** |

`pageerror` 0 in entrambe. Il prima e' stato ottenuto con
`git checkout 783a8245d^ -- createAdapter.ts` e rimesso a posto con `git checkout HEAD --`:
solo git, nessuna copia su disco, nessuno `stash` (RC-13-bis).

**Una nota sulla sonda, che e' la lezione del giro.** La prima versione chiamava
`slot.addObject` direttamente. Con il fix in albero la misura non si muoveva di un PASS — e
la sonda aveva ragione: stava misurando il percorso **interno** all'adapter e saltava
`createInstance`, cioe' la funzione in discussione. Una sonda che scavalca il soggetto da'
lo stesso identico output di un fix che non funziona.

**Unit test** `hooks/__tests__/createAdapterFlow.test.ts`, 6 casi, verdi. Non esisteva un
test di `createAdapter.ts`, e il motivo e' nella sua intestazione: e' la meta' impura e non
e' importabile sotto vitest (la barrel raggiunge monaco, che dereferenzia `window`
all'import). Stessa barrel finta di `UniquenessProblemSync.test.ts`. I due scrittori del
canvas sono **spie**, non stub: l'asserzione non e' «un vertice esiste» ma «il vertice
avvolge QUESTO figlio su QUESTO grafo», che solo gli argomenti mostrano.

**Mutazioni**, quattro, tutte rosse:

| mutazione | esito |
|---|---|
| creazione del **vertice** rimossa | **3 rossi / 6** |
| creazione dell'**arco** rimossa | **1 rosso / 6** |
| `vertexOf` ritorna sempre un id fisso (la lookup cieca) | **3 rossi / 6** |
| la guardia sul solo figlio contenuto rimossa (anche le radici) | **1 rosso / 6** |

**Gate**: `tsc --noEmit` **33**, la baseline esatta, **0** nei due file toccati; `build`
exit 0 con il solo avviso di chunk-size noto; `vitest` **3147 verdi, 0 falliti**; i **9**
file che non si raccolgono sono i `window is not defined` pre-esistenti, nessuno nel
perimetro.

## 6. Cosa resta aperto

- **Punto 5, la ↗ per chip.** Non fatto: registrato e basta, come il prompt consente. La
  freccia resta una per riga e con due chip non puo' dire quale.
- **La forma anomala della strada C.** Il suo figlio sta in `model.objects` *e* ha
  `father = DValue`. E' una radice riparentata che resta elencata fra le radici, e la
  conformance la visita mentre non visita la gemella creata dal manager. Misurato qui, fuori
  perimetro (`EditorV2.tsx` non e' in questo giro).
- **Il figlio creato senza canvas aperto.** `syncChildToFlow` esce senza scrivere, e alla
  successiva apertura della tab `useJjomSync` **non** lo recupera, perche' itera
  `model.objects`. Il figlio resta corretto nel modello e invisibile sul canvas finche'
  qualcuno non lo crea di nuovo. E' il residuo onesto di (a), e la sua chiusura e'
  esattamente (b) — con il costo dichiarato in §4.
- **Il disallineamento di chiavi** entry sull'id dell'elemento / indicatore sull'id del
  `DVertex`: misurato in §2, non toccato.
- **`state.graphs` con id duplicati.** 2 entry, 1 grafo. Non indagato: nessun consumatore
  noto ne soffre, perche' tutti e tre i siti prendono il primo match.

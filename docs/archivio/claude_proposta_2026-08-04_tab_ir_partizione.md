# Partizione del tab IR in tab tematici: proposta

**Data**: 2026-08-04
**Stato**: proposta di chat, da ratificare. Nessuna implementazione.
**Base**: `claude/mappa_parametri_tab_ir.md` (parametri reali a HEAD del branch `alfonso-frontend-jjtl`).

## Il criterio di partizione

I sottoinsiemi non si ricavano dalla struttura del JSON IR, che è un albero con annidamenti accidentali (`shape.labels[].style` sta sotto shape, ma è testo; `resizable` sta top-level, ma è aspetto). Si ricavano dalle domande che l'autore si pone, che sono quattro e sempre le stesse per tutte e quattro le tipologie:

1. A cosa si applica questa view?
2. Che cosa è, strutturalmente: cosa contiene, a cosa si aggancia?
3. Che aspetto ha?
4. Che testo mostra?

Quattro domande, quattro tab, più un quinto tab diagnostico. La partizione è **per concern, non per tipologia**: gli stessi quattro tab per vertex, row e edge, con payload diversi. L'alternativa (un set di tab per kind) è scartata perché costringe a reimparare la mappa del pannello a ogni tipologia e perché il 70% dei parametri è comune.

## I cinque sottoinsiemi

Nomi proposti in inglese, coerenti con la lingua dei docs e con i titoli di sezione del `VertexAuthoringPanel`. Oggi il codice è incoerente (vertex in inglese, row ed edge in italiano); la partizione è l'occasione per chiuderla in un verso solo.

### 1. Applies to

Quando la view si applica. È il tab non vuoto per ogni tipologia ed è quello su cui si apre il pannello, perché quasi tutto il resto dipende da `metaclasses[0]`.

| Parametro | vertex | row | edge-ref | edge-obj |
|---|---|---|---|---|
| `metaclasses` (toggle wildcard, lista, add) | sì | sì | sì (metaclasse sorgente) | sì (metaclasse dell'oggetto), wildcard disabilitato |
| `predicate` | sì | sì | sì | sì |
| `priority` | sì | sì | sì | sì |
| `exclusive` | sì | assente dal tipo | non autorato (R-5) | non autorato (R-5) |
| `visible` (gate dell'intera view) | no | sì | no | no |

`visible` della row view sta qui e non in Text: è un conditional che decide se la riga esiste, non come è formattata. Oggi la sezione appare solo se il campo è già presente nell'IR, il che la rende di fatto invisibile; il tab è l'occasione per esporla sempre, con drop della chiave quando resta al default.

### 2. Structure

Che cosa è la view: cosa contiene e a cosa si aggancia. È il tab che raccoglie tutto ciò che tocca **altri elementi del modello**.

| Parametro | vertex | row | edge-ref | edge-obj |
|---|---|---|---|---|
| `fieldCompartments[]` (id, source, filter children, segments, separator, visible) | sì | no | no | no |
| natura (selettore, non è un campo IR) | no | no | sì | sì |
| `reference` | no | no | sì | nascosto |
| `edge.source` / `edge.target` (capi, scrittura atomica) | no | no | assenti per definizione | sì |
| `containment` (graphVertex, oggi senza pannello) | futuro | no | no | no |

Due scelte da mettere ai voti:

- **`reference` sta qui e non in Applies to**, pur essendo parte della chiave di matching (metaclasse sorgente più refName). Motivo: dal punto di vista dell'autore, `reference` e i capi sono le due risposte alternative alla stessa domanda, "cos'è che fa la linea". Il selettore di natura decide quale delle due è viva, e deve stare accanto a entrambe.
- **Natura e capi sono co-locati per necessità, non per gusto**: la natura è derivata (`isObjectAsEdge = !!(source && target)`), e cambiarla droppa le chiavi dell'altro substrato. Separarli su due tab significherebbe una scrittura atomica che attraversa un cambio di tab, cioè un modo perfetto per rompere R-1.

### 3. Appearance

Come si vede, testo escluso.

| Parametro | vertex | row | edge (entrambe) |
|---|---|---|---|
| `shape.form` | sì | no | no |
| `shape.fill` | sì | no | no |
| `shape.border` (color, width, style) | sì | no | no |
| `resizable` + Propagate size | sì | no | no |
| `shape.badges[]` (icon, position, visible, tooltip) | sì | no | no |
| `edge.line` (color, width, style) | no | no | sì |
| `edge.terminations` (sourceEnd, targetEnd) | no | no | sì |
| `edge.routing` (oggi inerte) | no | no | futuro |

Per la row questo tab è **strutturalmente vuoto e va nascosto, non disabilitato**. Una row non ha geometria per costruzione, non "non ce l'ha ancora". La regola generale: si disabilita un controllo dentro un tab quando la cosa impedita esiste nel modello ma non è esprimibile ora (precedente R-4, wildcard su object-as-edge); si nasconde un tab intero quando la tipologia non potrà mai popolarlo.

### 4. Text

Tutto ciò che produce caratteri sullo schermo. È l'unica vera unificazione della partizione: le tre tipologie usano già lo stesso `TextSourceEditor`.

| Parametro | vertex | row | edge |
|---|---|---|---|
| `shape.labels[]` (position, source, editable, visible) | sì | no | no |
| `shape.labels[].style` (TextStyle su 5 assi) | sì | no | no |
| `template[]` (TextSource, non vuoto) | no | sì | no |
| `edge.labels.center` | no | no | sì |
| `edge.labels.placement` (oggi non autorato) | no | no | futuro |

Estensione naturale a costo quasi zero, una volta che il tab esiste: portare `TextStyle` anche sulla label center dell'edge e sui segmenti del template, che oggi non ce l'hanno.

### 5. Source (Advanced)

JSON dell'IR, read-only in v1. Non è un tab di authoring: è il posto dove diventano visibili i campi che oggi fanno round-trip verbatim e che nessuna UI mostra, cioè `irVersion`, `kind`, `migratedFrom`, `edge.routing`, `edge.persistWaypoints`, `edge.labels.placement`, `exclusive` sulle edge, le varianti `editable: {widget}`, i predicate "avanzati" ridotti a chip.

Oggi quei campi esistono, influenzano il rendering e sono invisibili. Un tab read-only li rende ispezionabili senza autorarli, che è esattamente il compromesso giusto finché non si decide se autorarli.

## Matrice di riempimento

| | Applies to | Structure | Appearance | Text | Source |
|---|---|---|---|---|---|
| vertex | pieno | compartments | pieno | labels | ro |
| graphVertex (futuro) | pieno | compartments + containment | pieno | labels | ro |
| row | pieno | **nascosto** | **nascosto** | template | ro |
| edge reference | pieno | natura + reference | linea + terminazioni | label center | ro |
| edge object | pieno | natura + capi | linea + terminazioni | label center | ro |

La row resta con due soli tab di authoring. Non è un difetto della partizione: è la partizione che dice la verità su cos'è una row view, cioè un template di testo con una regola di applicabilità e niente altro.

## Il vero costo del passaggio a tab

Non è il refactor. È che **tre dipendenze oggi visibili nello stesso scroll diventano invisibili**.

1. **PathBuilder disabilitato per assenza di metaclasse.** Il widget vive in Text o Structure, la causa vive in Applies to. L'hint attuale ("imposta una metaclasse per abilitare i path sulle feature") smette di bastare: deve nominare il tab.
2. **Wildcard più natura object.** L'errore nasce dall'incrocio fra `metaclasses` (Applies to) e la natura (Structure). Serve un badge di errore sull'header del tab che possiede il campo colpevole, più una striscia di errore a livello di pannello.
3. **Ambiguità di metaclasse fra metamodelli.** Oggi è un ErrorText in testa al pannello; con i tab deve restare a livello di pannello, non finire dentro un tab.

Regola generale che ne discende: **la validazione resta a livello di pannello, i tab la riflettono**. Un tab non valida per conto suo.

## Invarianti implementative da non violare

- **Un solo draft, a livello di pannello.** I tab sono viste sul medesimo oggetto, non stati locali. Se il draft si frammenta per tab, saltano la scrittura atomica dei capi (R-1), la convenzione del drop della chiave e il round-trip verbatim dei campi non autorati.
- **Il debounce di commit resta uno solo** (300 ms, a livello di pannello). Cambiare tab non è un evento di commit.
- **Smontare un tab non deve resettare nulla.** Lo stato UI locale che oggi vive nei sotto-editor (per esempio `sourceExpr`/`targetExpr` dei capi prima della scrittura atomica) va sollevato nel pannello, altrimenti passare a un altro tab con un capo solo impostato lo perde.
- **`validateIR` resta l'unico gate del commit.** Gli ErrorText informativi (wildcard object, capo su `.values`) restano informativi.

## Due decisioni che servono prima di scrivere il prompt

**Basic/Advanced sopravvive ai tab?** Oggi Advanced nasconde tre sezioni intere del vertex (Field compartments, Badges, Matching). Con i tab, nascondere per Advanced un tab intero significa che un utente in Basic non scopre mai che i compartimenti esistono. Raccomandazione: **i tab non si gatano** (tranne Source, Advanced-only), e Advanced continua a gatare solo i rami `Conditional` dentro i tab. È un cambio di comportamento rispetto a oggi e va ratificato esplicitamente, perché espone in Basic superfici che oggi sono nascoste.

**Lingua delle label.** Inglese (coerente con docs e con il pannello vertex) oppure italiano (coerente con row, edge e MatchingSection). Vanno allineate comunque: la partizione rende l'incoerenza attuale molto più visibile, perché i nomi dei tab sono l'unica etichetta sempre a schermo.

## Cosa questa partizione sblocca

- **graphVertex diventa economico.** Oggi non ha pannello. Con i tab è "vertex, più `containment` in Structure": nessuna nuova impalcatura.
- **Le estensioni hanno una casa già decisa.** Routing configurabile e `persistWaypoints` in Appearance; filtro per-reference e reference non-containment in Structure; editing inline delle righe in Text; decorative views in Applies to (è `exclusive`); rules editor ovunque vivano i `Conditional`.
- **La riga "authoring chiuso" della mappa di copertura diventa verificabile per costruzione**: un tab vuoto per una tipologia è una domanda a cui quella tipologia non risponde, e si vede.

## Emendamento: viewpoint e view parent in "Applies to"

Domanda di Alfonso del 2026-08-04. La risposta è sì per il viewpoint, sì ma con un'etichetta diversa per il parent, e la verifica sul codice ha fatto emergere due cose che cambiano il perimetro della proposta.

### Il viewpoint è la condizione di applicabilità più esterna, e oggi non è nel pannello

`irResolveCore.ts:99-113` itera la lista piatta `state.viewelements` e scarta ogni view con `d.viewpoint !== state.viewpoint`. Il campo D `DViewElement.viewpoint` (`view.tsx:239`, pointer 1..1, denormalizzato) è quindi l'unico parametro fuori dall'IR che decide se la view entra o no nell'indice del resolver. Sta **sopra** `metaclasses`, `predicate` e `priority`: se il viewpoint non è quello attivo, gli altri tre non vengono nemmeno valutati.

Mostrare le condizioni interne e nascondere quella esterna è la ragione per cui "ho impostato tutto giusto e non si vede niente" è un sintomo così frequente. In Applies to va quindi esposto, come prima riga: il viewpoint di appartenenza e se coincide con quello attivo.

Va detto anche un delta semantico rispetto al classic, che l'autore non ha modo di indovinare: il resolver IR ammette **un solo viewpoint**, quello attivo. Il classic ne ammette tre (attivo, `Pointer_ViewPointDefault`, e i viewpoint decorativi non esclusivi: `selectors.ts:552-559`). Una view IR in un viewpoint decorativo non rende, punto.

### Il parent view non è un parametro di applicabilità per l'IR

`father` (`view.tsx:273`) e il suo opposite `subViews` (`view.tsx:224`, mappa pointer → peso) **non sono letti da nessuna parte** dentro `editor-v2/viewpoint/`: grep di `father`, `subViews`, `fatherChain`, `allSubViews` sulla cartella restituisce zero. Nel classic invece il peso di `subViews` è un moltiplicatore di score (`selectors.ts:422` e `:434`, `pvScore`).

Metterlo in Applies to come campo autorabile ripeterebbe l'errore che R-5 ha evitato con `exclusive`: esporre un controllo che nessun resolver legge. Ma nasconderlo del tutto sarebbe altrettanto sbagliato, perché non è inerte: `set_father` riallinea `viewpoint` a `dfather.viewpoint` (`view.tsx:1456`). Riparentare dentro lo stesso viewpoint è inerte per l'IR; riparentare fuori sposta la view dentro o fuori dall'indice.

Forma proposta: **una breadcrumb read-only** in cima ad Applies to, `viewpoint › [parent view] › questa view`, con lo stato "attivo / non attivo" sul viewpoint e una nota che il parent non entra nella risoluzione IR. Non due Select.

### Finding: "Viewpoint" e "Parent view" sono lo stesso campo

In `InfoData.tsx` il Select "Viewpoint" (`:306`) e il Select "Parent view" (`:323`) hanno entrambi `field={'father'}` e nessun `setter` custom, quindi ricadono entrambi su `data[field] = ...` (`Input.tsx:252-254`) e finiscono in `LViewElement.set_father`. Il primo maschera la cosa in lettura con `getter={() => vpid}`, che mostra la radice derivata anche quando `father` punta a una view intermedia.

In scrittura sono la stessa tendina due volte: scegliere un viewpoint riparenta la view sotto la radice e **perde il parent view** precedente, senza che l'UI lo dichiari. Lo stesso pattern, senza il Select viewpoint, è replicato in `ViewProperties.tsx:70-73,121-133`.

È un bug di UI su un campo unico, indipendente dalla partizione a tab. Va tracciato a parte.

### Conseguenza sul perimetro: la collisione con i tab di ViewData

Qui la domanda smette di essere "aggiungiamo due campi" e diventa una questione di scope. `ViewData.tsx:34` dichiara già una barra di tab: `apply-to | template | style | events | options | components | ir`. Per una view IR, il tab **"Apply to"** mostra `appliableToClasses`, `oclCondition`, `jsCondition`, `explicitApplicationPriority`, `isExclusiveView`: tutti campi che il resolver IR **non legge mai** (verificato: grep zero su `editor-v2/viewpoint/`; `appliableToClasses` serve solo a seminare `ir.metaclasses` una tantum in `EnableIRPanel.tsx:34-46`). `MatchingSection.tsx:32-33` lo dice già in una HelpText.

Quindi oggi una view IR ha due superfici di applicabilità contemporaneamente visibili, una vera e una inerte, e la partizione a tab dell'IR le metterebbe una dentro l'altra: una barra di tab annidata in un tab. Non è una rifinitura, è la cosa da decidere prima.

Raccomandazione: per una view con `ir`, la partizione **sostituisce** la barra di tab di ViewData invece di annidarsi dentro il tab IR. Applies to assorbe ciò che di Apply-to resta vero (cioè niente, per l'IR: solo la breadcrumb viewpoint/parent e il nome della view), e i tab classici che l'IR non usa spariscono per quelle view. Resta da stabilire, con evidenza, quali fra `style` (PaletteData), `events`, `options` e `template` siano ancora letti per una view IR.

Quella evidenza è esattamente l'oggetto di un prompt già in coda e mai eseguito: `claude/2026-07-24_prompt_discovery_tab_map_ir_authored.md` (tab map delle view IR-authored). Va eseguito **prima** di questa partizione, non dopo: senza di esso non si può decidere se i tab IR sostituiscono o si annidano.

## Prossimo passo suggerito

Non un prompt di implementazione, e nell'ordine seguente.

1. **Eseguire la tab map IR-authored** (`claude/2026-07-24_prompt_discovery_tab_map_ir_authored.md`, in coda dal 24 luglio). Decide se la partizione sostituisce o si annida, che è il bivio da cui dipende tutto il resto.
2. **Discovery sul sollevamento dello stato UI** dai sotto-editor al pannello (invariante 3): è l'unico punto dove la partizione può richiedere di riscrivere codice già verificato, cioè i rami E-ref ed E-obj.
3. **Aprire un todo separato** per la collisione `father` in `InfoData.tsx:306,323` e `ViewProperties.tsx:121-133`, che è un bug indipendente da questa proposta.

Entrambe le discovery salvano il report in `docs/discovery/` col naming `discovery_<data>_<descrizione>.md`.

# Discovery — Layout per viewpoint, Fase 1 (read only)

**Data**: 2026-08-22
**Branch**: `alfonso-frontend-jjtl`
**Prompt document name**: 2026-08-22 10:30
**Protocollo**: `docs/PROTOCOL.md` P1..P10, deroga dichiarata su P8 (fase read only, nessuna modifica, nessuno smoke).
**Esito**: **arresto su D0.** Una decisione viva sul tema esiste. D1..D8 **non eseguite**.

---

## 1. Obiettivo e ipotesi falsificata

**Obiettivo della fase** (dal prompt): stabilire dove sta oggi il layout dei model element, chi lo
legge, chi lo scrive, e se un asse per viewpoint esista gia'. Nessuna implementazione, nessun
progetto di soluzione.

**Ipotesi che la discovery stava per falsificare**: che il layout sia oggi unico per progetto per
accidente storico — cioe' che nessuno lo abbia mai deciso, e che indicizzarlo per viewpoint sia
quindi una scelta di progetto ancora aperta.

**L'ipotesi e' falsificata alla prima domanda, ma non nel verso atteso.** Il layout condiviso fra
viewpoint non e' un accidente: e' una decisione presa da Alfonso il **2026-07-19**, confermata dal
codice, e **ri-ratificata come premessa portante** il **2026-08-03** dentro R-2. La motivazione
messa a verbale e' l'esatto contrario della tesi che apre questo fronte: il layout e' dichiarato
proprieta' **del disegno del modello**, non della rappresentazione.

Il prompt prescrive per questo caso l'arresto: *«Se ne trovi una viva, fermati qui, scrivi il report
con la sola D0 e segnala.»*

---

## 2. File letti (path completi)

Letti per intero:

- `/Users/alfonso/jjodel/CLAUDE.md`
- `/Users/alfonso/jjodel/docs/PROTOCOL.md`
- `/Users/alfonso/jjodel/docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md`

Letti in sezione (righe citate sotto):

- `/Users/alfonso/jjodel/docs/decisions.md` (righe 138-170, 758-775, 1070-1090; scansione a blocchi `R-` su tutto il file)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md` (righe 6, 125-127)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-08-03_state_actions_events.md` (righe 227-254, 532)
- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-08-17_state_attributes_data_node.md` (righe 498-512)
- `/Users/alfonso/jjodel/docs/ratifiche/claude_ratifiche_2026-08-05_3_canonicalize_e_risalita_parent.md` (righe 98-106)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (righe 110-130)
- `/Users/alfonso/jjodel/docs/claude-code-log.md` (coda)

Elencati e non aperti: l'indice di `/Users/alfonso/jjodel/docs/ratifiche/` (44 file) e di
`/Users/alfonso/jjodel/docs/spec/`.

---

## 3. D0 — Registro: la decisione esiste ed e' viva

### 3.1 Finding primario — R-2, ratificato il 2026-08-03

`docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md:26-28`, verbatim:

```
## R-2 — Scope dello stato concreto: default per-viewpoint, condivisione dichiarata

Il caso gia' deciso indica la regola. `irEdgeLayout` e' condiviso fra viewpoint perche' il layout
e' proprieta' del disegno del modello, con la stessa semantica delle posizioni dei nodi (decisione
2026-07-19, confermata dal codice). Il collasso e' cosa diversa: e' proprieta' di come si sta
guardando adesso, e due viewpoint sullo stesso modello hanno ragioni legittime per divergere.
```

Tre cose da leggere con attenzione, perche' cambiano il peso del finding.

1. **La frase sul layout non e' cio' che R-2 ratifica.** R-2 ratifica lo scope dello *stato
   dichiarato* (`docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md:30`, verbatim:
   *«lo stato dichiarato sulla sintassi concreta e' **per-viewpoint per default**»*). Il layout
   compare come **premessa**, come «il caso gia' deciso» da cui la regola viene derivata per
   contrasto.
2. **Proprio per questo la premessa e' portante.** R-2 usa il layout-condiviso come il polo fisso
   contro cui misura il collasso. Ribaltare il layout a per-viewpoint non lascia R-2 intatta:
   ne toglie il termine di paragone.
3. **La generalizzazione alle posizioni dei nodi e' esplicita nel testo**, non dedotta: *«con la
   stessa semantica delle posizioni dei nodi»*. Il verbale non parla solo di `irEdgeLayout`.

Lo stesso memo, riga 34, verbatim:

```
Questo trasforma R3 del report (scope condiviso ereditato senza decisione) da accidente in
decisione. Non retroagisce su `irCollapsed` e `irEdgeLayout` esistenti: quelli restano come sono
finche' il dogfooding non dimostri che il collasso condiviso e' una frizione reale.
```

E l'intestazione del memo, riga 3, verbatim: *«Le decisioni qui sotto sono ratificate da Alfonso il
2026-08-03 e valgono come vincoli per le slice future. Non vanno ridiscusse nei prompt: chi le
contraddice segnala il conflitto e si ferma.»*

### 3.2 La decisione a monte — 2026-07-19

`docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md:6`, verbatim:

```
**Decisione a monte (Alfonso, 2026-07-19)**: persistenza su campi opzionali additivi del DVertex —
edge sintetico sul DVertex del nodo nascosto dell'oggetto; collasso sul DVertex del contenitore.
Layout condiviso tra viewpoint, niente entità nuove, niente VersionFixer, rispetto di
`persistWaypoints: false`, scrittura solo via write path canonico a fine gesto, undo/redo
funzionante.
```

Stesso file, righe 125-127, verbatim — e qui compare la **motivazione strutturale**, che e'
esattamente il territorio della D2 del prompt:

```
### 3.6 Layout condiviso tra viewpoint — meccanismo confermato

Il DGraph v2-flow è **per modello** (`useJjomSync.ts:282`: `g.model === modelid && graphStyle ===
'v2-flow'`), non per viewpoint. I viewpoint decorano lo stesso canvas → campi sul DVertex
condivisi tra viewpoint, stessa semantica delle posizioni. Se un altro viewpoint rende l'oggetto
come nodo, i campi restano inutilizzati ma agganciati a un'identità viva (il DVertex si cancella
con l'oggetto → nessun orfano).
```

**Avvertenza sul valore di questa citazione.** E' la conclusione di una discovery del 2026-07-19,
cioe' un'ipotesi con evidenza a quella data (P4: *«Il report e' un insieme di ipotesi con evidenze,
non un riferimento definitivo»*), e la riga `useJjomSync.ts:282` **non e' stata riverificata in
questa sessione** — la verifica appartiene alla D2, che non e' stata eseguita. Non la si tratti
come misura corrente.

### 3.3 Conferma indipendente nel codice

Il commento che ancora la decisione al codice vivo,
`frontend/src/components/editor-v2/sync/canvasToJjom.ts:116-121`, verbatim:

```
/**
 * Persist the IR object-as-edge layout override (side pins + waypoints) on the
 * hidden edge-object's DVertex. Written whole at gesture end (ghostOffsets
 * pattern); no markCanvasUpdated — the field is not read by the position
 * transformers (discovery 2026-07-19).
 */
```

### 3.4 Prove che la decisione e' viva, non superata

Tre riscontri, tutti posteriori al 2026-08-03.

- `docs/ratifiche/claude_ratifiche_2026-08-05_3_canonicalize_e_risalita_parent.md:102`, verbatim:
  *«Restano aperte, e non sono toccate qui: R-2 (collasso condiviso fra viewpoint), R-9»*.
  R-2 e' censita come **aperta**, quindi non chiusa e non superata.
- `docs/discovery/discovery_2026-08-17_state_attributes_data_node.md:501-504`, verbatim:
  *«Ne segue che per un modello esistono al massimo due grafi (uno v2-flow e uno classico), non uno
  per viewpoint. **Cambiare viewpoint non forka il vertice**: `node.state` sopravvive al cambio di
  viewpoint ed è condiviso fra i viewpoint che rendono lo stesso modello nello stesso editor.»*
  Cinque giorni fa il meccanismo descritto nel 2026-07-19 §3.6 risultava ancora quello.
- `docs/discovery/discovery_2026-08-03_state_actions_events.md:247`, verbatim: *«Le voci 1-4 hanno
  tutte lo stesso scope, e quello scope e' "per-vertex, condiviso fra viewpoint". [...] una
  `DVertex` appartiene al `DGraph` del modello (`GraphDataElements.tsx:1672-1673`, `graph!:
  Pointer<DGraph>`), non a un viewpoint. Il viewpoint non entra mai nella chiave.»*

Nessuna occorrenza, in tutto `docs/`, di un documento che revochi o emendi il punto.

### 3.5 La decisione non e' a registro in `docs/decisions.md`

`docs/decisions.md` **non contiene** la serie R-1..R-9 del memo 2026-08-03 sullo stato e le azioni.
Il file cita R-6 di quel memo di rimbalzo, da dentro un'altra decisione — `docs/decisions.md:1077`,
verbatim: *«ed e' la ragione per cui R-6 (2026-08-03) vieta JS e non vieta questo»* — ma le entry
proprie non ci sono. La serie `R-B` del 2026-08-03 (edge IR) e' a registro, quella dello stato no.

Questo e' un **difetto del registro, non della decisione**: il memo di ratifica e' l'artefatto
autorevole (P10), ed e' esplicito nel dichiararsi vincolante. Ma significa che una grep su
`decisions.md` — che e' il primo posto dove un prompt manda a guardare — **non trova questo
vincolo**, ed e' plausibilmente il motivo per cui il fronte e' stato aperto in contraddizione con
esso. Vale la pena segnalarlo a parte.

### 3.6 Ricerche eseguite (R-RAIL-28)

`grep` qui e' `command grep` (BSD grep 2.6.0-FreeBSD), non il wrapper `ugrep` della shell
interattiva, per le ragioni in CLAUDE.md §5. Comandi completi e output:

| # | Comando (cwd `/Users/alfonso/jjodel/docs`) | Output |
|---|---|---|
| 1 | `command grep -in "<t>" decisions.md` per `t` in `layout, posiz, coordinat, taglia, size, notation, dimension, resize, "x, y", bendpoint` | hit solo incidentali; `bendpoint` e `"x, y"` exit 1 |
| 2 | `command grep -n -i "viewpoint" decisions.md \| command grep -i -E "layout\|posizion\|taglia\|size\|coordinat\|geometr"` | **exit 1** — nessuna co-occorrenza di riga |
| 3 | `awk` a blocchi `- **R-` su `decisions.md`, filtro co-occorrenza viewpoint x layout-ish | 1 blocco, R-B16, per il solo match incidentale di `size`; nessuna decisione sul tema |
| 4 | `command grep -rli -E "layout per viewpoint\|layout_per_viewpoint\|notation model\|per-viewpoint layout" .` | **exit 1** |
| 5 | `command grep -rn "irEdgeLayout" .` | 27 hit, che hanno prodotto il finding |
| 6 | `command grep -rn -i "condivis" --include="*.md" . \| command grep -i "viewpoint"` | 18 hit, che hanno prodotto §3.4 |
| 7 | `command grep -rli "<t>" ratifiche/` per `t` in `layout, posizion, taglia, notation, isResized, resizing, "x e y", coordinat` | `notation`, `isResized`, `resizing`, `"x e y"`: **exit 1**; gli altri 9-16 file |

**Controlli positivi**, ciascuno sullo stesso comando della ricerca che valida:

- comando 2, denominatori: `command grep -ci "viewpoint" decisions.md` -> **105**;
  `command grep -ci "layout" decisions.md` -> **2**. Entrambi i termini sono presenti nel file, la
  co-occorrenza a exit 1 e' quindi un'assenza reale, non una grep rotta. Nota: `layout` a 2 sole
  occorrenze in 1671 righe e' di per se' il segnale che il tema **non e' a registro**.
- comando 7: `command grep -rli "viewpoint" ratifiche/ | wc -l` -> **17** file. Le quattro ricerche
  a exit 1 girano sullo stesso corpus che risponde 17 su un altro termine.
- comando 4: `command grep -rli "activeViewpoint" .` -> 10+ file. La grep ricorsiva su `docs/`
  produce segnale.

Il controllo positivo obbligatorio richiesto dal prompt su **D2 e D8 non e' stato eseguito**,
perche' D2 e D8 non sono state eseguite.

---

## 4. Dipendenze e rischi

- **Rischio primario, di processo.** La proposta L-7 del prompt («sede: mappa sulla sede attuale»)
  e piu' in generale l'intero fronte si muovono contro R-2 e contro la decisione 2026-07-19. Non e'
  un dettaglio di implementazione da riconciliare in Fase 2: e' il presupposto. Procedere senza
  scioglierlo produrrebbe una slice che «chi la contraddice segnala il conflitto e si ferma»
  (memo, riga 3) — cioe' un arresto piu' tardi e piu' caro.
- **Rischio di registro.** La serie di ratifiche 2026-08-03 sullo stato non e' in `decisions.md`
  (§3.5). Finche' resta fuori, altri prompt possono ripartire contro lo stesso vincolo senza
  accorgersene. La riparazione e' indipendente da questo fronte e utile comunque.
- **Dipendenza dichiarata dal prompt e non verificata**: L-8 mette il fronte dopo la slice 2 di
  `2.228` (`activeViewpoint` a 0..1). Non verificata in questa sessione.
- **Il costo in stato (D8) resta ignoto.** Se l'asse per viewpoint venisse adottato, il fattore
  moltiplicativo sullo stato persistito non e' misurato. Non e' un rischio teorico: la persistenza
  passa da `localStorage` con `compressToUTF16`.
- **Nessun rischio tecnico introdotto da questa sessione**: zero file di codice modificati, zero
  scritture in critical zone.

---

## 5. Cosa NON e' stato accertato

Da dire per esteso, perche' l'arresto e' precoce e il report non deve leggersi come piu' informato
di quanto sia. **D1..D8 non sono state eseguite.** In particolare restano ignoti:

- la sede attuale di posizione e taglia sul D layer, e se stiano insieme o separate (D1);
- **se l'asse per view esista gia'** (D2). §3.2 e §3.4 riportano che secondo tre documenti — del
  19/7, del 3/8 e del 17/8 — il `DGraph` e' per modello e il vertice non si forka per viewpoint.
  **Sono citazioni di documenti, non misure di questa sessione**, e il prompt chiede su D2 una
  misura con controllo positivo. Chi riprende non tratti §3.2 come risposta a D2;
- lettori e scrittori di posizione e taglia (D3, D4), incluso se esista un percorso di scrittura
  fuori da quelli noti;
- taglia umana, `isResized`, il filtro su `resizing !== undefined` (D5);
- il layout persistito sugli edge oltre a `irEdgeLayout`, e la natura di `Eroute` (D6);
- versione corrente di `DState.version.n` e forma della migrazione (D7);
- il costo in stato su un progetto reale (D8).

---

## 6. Domande aperte per l'architetto

Le tre domande prescritte dal prompt, piu' quella che l'arresto solleva.

**Q0 (nuova, ed e' quella che blocca).** R-2 del 2026-08-03 e la decisione 2026-07-19 dicono che il
layout e' proprieta' del disegno del modello, condivisa fra viewpoint, «con la stessa semantica
delle posizioni dei nodi». La tesi che apre questo fronte dice l'opposto. **La decisione si intende
revocata?** Se si', serve una revoca esplicita a verbale, perche' R-2 la usa come termine di
paragone e non sopravvive intatta al ribaltamento. Se no, il fronte si chiude qui.
Il memo del 2026-08-03 prevede una porta di riapertura, riga 34: *«finche' il dogfooding non
dimostri che il collasso condiviso e' una frizione reale»* — porta scritta per il **collasso**, non
per il layout. Se il fronte nasce da frizione osservata nell'uso, e' quella la strada, e conviene
mettere l'evidenza a verbale prima del progetto.

**Q1 — Se l'asse per view esiste gia' (D2), qual e' il campo giusto da indicizzare e quale resta
condiviso?**
*Non rispondibile.* D2 non e' stata eseguita. Quello che si puo' dire, e solo come indizio da
verificare, e' che tre documenti indipendenti (2026-07-19 §3.6, 2026-08-03 §247, 2026-08-17 §502)
concordano nel dire che l'asse per view **non** e' materializzato: il `DGraph` e' per modello, e
`DVertex.graph` e' `Pointer<DGraph>`. Se cosi' fosse, la domanda non avrebbe un campo da
indicizzare ma richiederebbe di **creare** l'asse — che e' un lavoro di ordine di grandezza diverso
da quello che L-7 («mappa sulla sede attuale») presuppone. Va misurato, non dedotto.

**Q2 — Quale delle otto proposte L-1..L-8 il codice contraddice?**
*Rispondibile solo in parte, e non dal codice ma dal registro.* Nessuna delle otto e' stata
confrontata col codice, perche' D1..D8 non sono state eseguite. Ma **L-1..L-7 presuppongono tutte
che il layout debba essere per viewpoint**, e questo presupposto e' cio' che la decisione viva
nega. Non e' una contraddizione fra una proposta e il codice: e' fra l'intero fronte e un verbale.
L-8 (sequenza rispetto a `2.228`) e' l'unica indipendente dal punto, e resta non verificata.

**Q3 — C'e' un percorso che scrive layout senza passare dagli scrittori censiti in D4?**
*Non rispondibile*: D4 non e' stata eseguita, quindi non esiste un censimento rispetto a cui
misurare un «fuori». L'unico scrittore incontrato incidentalmente e' `syncIREdgeLayoutToJjom`
(`frontend/src/components/editor-v2/sync/canvasToJjom.ts:122`), che scrive dentro `TRANSACTION`
(riga 130, verbatim: `TRANSACTION('EditorV2 IR edge layout', () => {`) e riguarda il layout degli
edge sintetici, non la posizione dei nodi.

---

## 7. Hard stop

Raggiunto su D0, come prescritto. Nessun file di codice modificato. Nessun progetto proposto.
Nessun branch aperto. La ripresa di D1..D8 attende la risposta dell'architetto a **Q0**.

---

# Addendum Fase 1bis: i tre fatti di Q0

**Data**: 2026-08-22 (seconda sessione)
**Prompt document name**: 2026-08-22 11:45
**Deroga**: P8 non si applica (fase read only, nessuna modifica al codice, nessuno smoke).
**Perimetro**: solo Q0.a..Q0.d. D1..D8 restano sospese. **Nessuna risposta a Q0.**

## A.0 Esito sull'ipotesi

L'ipotesi da falsificare era: *la decisione del 2026-07-19 e' stata presa su un dominio che nel
frattempo e' cambiato, e il codice spedito oggi la contraddice gia' in due punti.*

**Confermata sul dominio, confermata su un punto di contraddizione, e il secondo punto e' piu'
debole di come l'ipotesi lo descrive.** In sintesi, prima delle prove:

| | esito |
|---|---|
| il dominio e' cambiato | **si'**, due volte e in date verificabili: l'authoring object-as-edge e' del **2026-08-02** (`d1dc55649`), la taglia derivata dal contenuto del **2026-08-15** (`115e8484d`). Entrambe **dopo** il 2026-07-19 |
| primo punto di contraddizione (taglia) | **confermato**, e sta scritto nel codice |
| secondo punto (`Eobj`) | **non e' una contraddizione**: e' un caso che la decisione non prevedeva e che il codice gestisce per convivenza, non per conflitto |

Una precisazione che cambia il bersaglio, e va detta subito perche' regge tutto il resto.
**La contraddizione non colpisce la decisione del 2026-07-19, colpisce la sua generalizzazione del
2026-08-03.** La decisione del 19/7 parla di `irEdgeLayout` e `irCollapsed` su `DVertex`, e su
quelli e' rispettata. E' il memo del 3/8 che la estende a «il layout» come categoria unica, «con la
stessa semantica delle posizioni dei nodi»: e' quella frase che il codice del 15/8 contraddice,
perche' spedisce una taglia derivata per notazione, cioe' per viewpoint.

## A.1 File letti in questa sessione (path completi)

- `/Users/alfonso/jjodel/docs/discovery/discovery_2026-07-19_persistenza_edge_sintetici.md` (righe 1-12)
- `/Users/alfonso/jjodel/docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md` (righe 20-40)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` (intero, 201 righe)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (righe 215-240, 465-495; indice dei simboli su tutto il file)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/__tests__/shapeRegistry.test.ts` (righe 225-258)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (righe 30-110)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/utils/jjomTransformers.ts` (righe 170-190, 236-258; indice su `position`, `isResized`)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx` (righe 405-440, 3249-3345, 3478-3492)
- `/Users/alfonso/jjodel/frontend/src/model/dataStructure/GraphDataElements.tsx` (righe 85-110, 148-182)
- `/Users/alfonso/jjodel/frontend/src/common/Geom.ts` (righe 660-700)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (indice su `hidden`, riga 266)

Tutti in sola lettura. Nessun file di codice modificato.

## A.2 — Q0.a. Le citazioni integrali

### A.2.1 `discovery_2026-07-19_persistenza_edge_sintetici.md`, righe 3-9

Righe 1-2 sono il titolo e una riga vuota; do le tre che precedono la 6 e le tre che seguono, come
richiesto, verbatim e senza elisioni:

```
**Data**: 2026-07-19
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: Fase 1, discovery read-only. Nessuna modifica al codice. HARD STOP a report scritto.
**Decisione a monte (Alfonso, 2026-07-19)**: persistenza su campi opzionali additivi del DVertex — edge sintetico sul DVertex del nodo nascosto dell'oggetto; collasso sul DVertex del contenitore. Layout condiviso tra viewpoint, niente entità nuove, niente VersionFixer, rispetto di `persistWaypoints: false`, scrittura solo via write path canonico a fine gesto, undo/redo funzionante.

---

## 0. Obiettivo
```

**Il fatto che il prompt chiedeva di stabilire, senza interpretarlo.** «Layout condiviso tra
viewpoint» **non e' una proposizione autonoma**. E' il terzo elemento di un elenco separato da
virgole, dentro una riga di intestazione del documento etichettata `**Decisione a monte**`, che
elenca sei vincoli di seguito: `Layout condiviso tra viewpoint, niente entita' nuove, niente
VersionFixer, rispetto di persistWaypoints: false, scrittura solo via write path canonico a fine
gesto, undo/redo funzionante`. Gli altri cinque sono tutti vincoli di costo e di disciplina
implementativa. Non c'e' un paragrafo che argomenti il punto, e non c'e' una sezione dedicata: la
riga sta fra `**Tipo**` e `---`, cioe' nel blocco di metadati che apre il file.

Per completezza va detto che una proposizione autonoma sul tema **esiste** nello stesso documento,
ma e' §3.6 (righe 125-127, gia' citata nel corpo del report), ed e' **la discovery che conferma il
meccanismo**, non il testo della decisione. La distinzione conta: §3.6 argomenta da un fatto di
codice (`il DGraph v2-flow e' per modello`), la riga 6 no.

### A.2.2 `claude_ratifiche_2026-08-03_state_actions_events.md`, righe 20-40

Verbatim, senza elisioni (le righe 21-40 nel file; la 20 e' la prima riga di R-1):

```
Riattivare il canale events (Opzione H del report) richiederebbe di ricostruire `evalContext` da zero e di reintrodurre `new Function` su stringa utente dentro il flow editor, cioe' esattamente cio' che la Fase 5a ha spento. Ucciderebbe inoltre l'analizzabilita' statica delle dipendenze (`dependencySet`, `crossPaths`), che e' il fondamento della reattivita' IR.

Il modello di azione nascera' dentro l'IR (Opzione G). Il tab Events resta come superficie legacy.

**Conseguenza immediata e indipendente**: R1 del report e' una trappola utente attiva oggi. Il tab accetta codice, lo persiste, lo ricompila, e `ViewProperties.tsx:325-357` mostra un indicatore di stato "attivo" per gli handler definiti. Va marcato subito (slice 3), senza attendere il resto del capitolo. Nessuna rimozione del tab, nessuna rimozione dei campi, nessun tocco alla persistenza: solo onesta' verso chi lo apre.

## R-2 — Scope dello stato concreto: default per-viewpoint, condivisione dichiarata

Il caso gia' deciso indica la regola. `irEdgeLayout` e' condiviso fra viewpoint perche' il layout e' proprieta' del disegno del modello, con la stessa semantica delle posizioni dei nodi (decisione 2026-07-19, confermata dal codice). Il collasso e' cosa diversa: e' proprieta' di come si sta guardando adesso, e due viewpoint sullo stesso modello hanno ragioni legittime per divergere.

**Ratificato**: lo stato dichiarato sulla sintassi concreta e' **per-viewpoint per default**. La condivisione fra viewpoint e' una scelta esplicita dichiarata nell'IR (`shared: true` o equivalente), mai un default implicito.

Implementazione attesa additiva: `_state` sul carrier con namespace per viewpoint nella chiave; il flag dichiarato collassa il namespace. Nessuna entita' nuova.

Questo trasforma R3 del report (scope condiviso ereditato senza decisione) da accidente in decisione. Non retroagisce su `irCollapsed` e `irEdgeLayout` esistenti: quelli restano come sono finche' il dogfooding non dimostri che il collasso condiviso e' una frizione reale.

## R-3 — Persistenza: doppio regime dichiarato, default non persistito
```

## A.3 — Q0.b. L'asimmetria taglia / posizione e' viva a schermo

### A.3.1 (1) La posizione persistita e' un **angolo**, non un centro

Tre righe, tre livelli.

**Scrittura.** `frontend/src/components/editor-v2/sync/canvasToJjom.ts:43-49`, verbatim:

```typescript
export function syncPositionToJjom(vertexId: string, x: number, y: number): void {
    markCanvasUpdated(vertexId);
    TRANSACTION('EditorV2 drag', () => {
        SetFieldAction.new(vertexId as any, 'x' as any, x, undefined, false);
        SetFieldAction.new(vertexId as any, 'y' as any, y, undefined, false);
    });
}
```

**Lettura.** `frontend/src/components/editor-v2/utils/jjomTransformers.ts:172-183`, verbatim
(estratto contiguo, il commento incluso perche' e' la ragione del `__raw`):

```typescript
    const raw = vertex.__raw ?? vertex;
    const x = typeof raw.x === 'number' ? raw.x : 0;
    const y = typeof raw.y === 'number' ? raw.y : 0;
```
```typescript
        position: { x, y },
        ...manualSizeOf(raw),
```

`position` in React Flow e' l'**angolo alto-sinistra** del nodo: e' il contratto della libreria, e il
codice non applica nessuna traslazione fra il campo D e `position` (le due righe sopra sono
l'identita').

**Conferma indipendente nel modello geometrico del progetto.** `frontend/src/common/Geom.ts:680-685`,
verbatim:

```typescript
    public static fromPoints(firstPt: GraphPoint, secondPt: GraphPoint): GraphSize {
        const minX = Math.min(firstPt.x, secondPt.x);
        const maxX = Math.max(firstPt.x, secondPt.x);
        const minY = Math.min(firstPt.y, secondPt.y);
        const maxY = Math.max(firstPt.y, secondPt.y);
        return new GraphSize(minX, minY, maxX - minX, maxY - minY); }
```

`GraphSize(x, y, w, h)` costruita da `minX, minY` piu' le estensioni: `x, y` e' l'angolo alto-sinistra.

**Conseguenza, che e' il punto della domanda**: una taglia maggiore cresce **verso il basso a
destra**. L'angolo alto-sinistra resta fisso, il bordo destro e quello inferiore avanzano. Non c'e'
crescita simmetrica che ammortizzi meta' della differenza.

### A.3.2 (2) Non esiste anti collisione fra nodi. Nessuno snap, nessun reflow che assorba

**Prima, un errore di misura commesso in questa sessione e corretto, perche' e' il caso da manuale
di CLAUDE.md §5.** La prima batteria di ricerche e' stata scritta cosi':

```
command grep -rniI "$t" --include=*.ts --include=*.tsx .
```

e ha risposto **0 per tutti gli undici termini**, `dagre` ed `elkjs` inclusi. Era una ricerca
rotta: zsh non espande `--include=*.ts` senza virgolette e aborta con `no matches found`. Riscritta
con i glob quotati, gli stessi undici termini danno `dagre` **15**, `elkjs` **3**, `autoLayout`
**18**. **Un auto layout ELK esiste e girava mentre la ricerca diceva che non esisteva.** Ogni
asserzione di assenza qui sotto e' quella della seconda batteria, con il controllo positivo nella
stessa invocazione.

**Ricerche dichiarate** (cwd `/Users/alfonso/jjodel/frontend/src`, `command grep` = BSD grep
2.6.0-FreeBSD, non il wrapper `ugrep` della shell):

```
command grep -rniI "<termine>" --include="*.ts" --include="*.tsx" components/editor-v2/ | wc -l
```

| termine | hit | esito |
|---|---|---|
| `avoidOverlap` | 0 | assente |
| `separateNodes` | 0 | assente |
| `pushApart` | 0 | assente |
| `repel` | 0 | assente |
| `resolveOverlap` | 0 | assente |
| `noOverlap` | 0 | assente |
| `declutter` | 1 | **non pertinente**: `nodes/ClassNode.tsx:546`, riguarda un connettore di edge |
| `nudge` | 6 | **non pertinente**: tutte e sei sono lo scostamento perpendicolare della **label** di un edge (`edges/UnifiedEdge.tsx:46-48`, `utils/edgeUtils.ts:791`) |
| `collision` | 34 (repo), tutte in editor-v2 su handle/anchor | **non pertinente**: `utils/handlePosition.ts:173` — *«Collision-freedom is by construction: N endpoints on N distinct uniform slots»* — riguarda gli **handle**, non i box dei nodi |

**Controllo positivo, stessa invocazione e stesso perimetro**: `applyDistribution` -> **43** hit. Il
comando ha segnale sulla cartella su cui le nove ricerche rispondono zero o non pertinente.

**Lo snap esiste ma non e' un assorbitore.** `frontend/src/components/editor-v2/EditorV2.tsx:3840-3841`,
verbatim:

```tsx
                snapToGrid={snapEnabled}
                snapGrid={[16, 16]}
```

E' lo snap di trascinamento di React Flow: vincola dove l'utente **lascia** un nodo a una griglia di
16px. Non conosce gli altri nodi e non interviene quando a cambiare e' la taglia.

**L'auto layout esiste, ed e' l'unica cosa che potrebbe assorbire — ma non si innesca al cambio di
viewpoint.** `handleAutoLayout` (`EditorV2.tsx:3249-3303`) ricalcola con ELK e riscrive **tutte** le
posizioni sul D layer (`:3262`, verbatim: `if (updates.length > 0) syncPositionBatchToJjom(updates);`).
Ha due soli innesti:

1. il bottone in toolbar — `EditorV2.tsx:3953`, verbatim: `onAutoLayout={handleAutoLayout}`;
2. il ramo `justCreated` alla prima init — `EditorV2.tsx:421-428`, verbatim:

```typescript
            if (justCreatedGraphRef.current) {
                justCreatedGraphRef.current = false;
                if (autoLayoutRef.current) {
                    await autoLayoutRef.current();
                    // The M1 reference edges materialize asynchronously AFTER this first
                    // layout; watch for them and re-run the layout once when they land.
                    armReLayoutRef.current?.();
                    return; // autoLayout already does fitView + distribution
                }
            }
```

Nessuno dei due e' il cambio di viewpoint. E anche se lo fosse, non sarebbe un assorbitore ma un
sostituto: sovrascriverebbe il layout dell'utente su tutto il grafo.

**Conclusione di (2)**: la collisione **resta possibile**. Nulla la previene e nulla la corregge.

### A.3.3 Perche' la taglia diverge per viewpoint mentre la posizione no — sta scritto nel codice

`frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts:80-93`, verbatim. E' la prova
piu' diretta dell'asimmetria, ed e' il commento che il codice si porta addosso:

```
/**
 * Keep the React Flow node sized after the content of its IR view.
 *
 * The size is written in session only, on the same channel the size propagation
 * uses (top-level width/height with `measured` reset). Nothing reaches the
 * D-layer: `syncSizeToJjom` would raise `isResized`, which is exactly the flag
 * that tells `manualSizeOf` a human chose that size, and the derived size is a
 * function of the content, to be recomputed rather than stored. That also means
 * no write-back loop: the persistence filter in EditorV2 keys on
 * `resizing !== undefined`, which a programmatic write never sets.
 *
 * A manual resize wins and switches the derivation off for that vertex, because
 * it raises `isResized`; "Reset size" clears the flag and gives the derived size
 * back.
 */
```

Il gate, riga 103, verbatim: `const active = hasSizeSupplement(desc) && !isResized;`.

Il filtro di persistenza citato dal commento e' vivo, `EditorV2.tsx:3485-3487`, verbatim:

```typescript
            const hasResize = changes.some(
                (c) => c.type === 'dimensions' && (c as any).resizing !== undefined
            );
```

**Quindi**: la taglia derivata e' funzione del contenuto reso, cioe' della notazione, cioe' del
viewpoint, e vive **in sessione**; la posizione e' persistita e condivisa. Le due meta' del «layout»
hanno gia' oggi due regimi diversi. Perimetro onesto: la derivazione vale per le forme con
supplemento (`hasSizeSupplement`: ellisse, cerchio, rombo); le forme il cui contorno riempie il box
restano al content-hug CSS (`shapeRegistry.ts:222-223`, verbatim: *«Shapes whose outline fills the box:
no supplement, so the sizing rule is the identity up to the existing CSS floors»*), che pero'
dipende anch'esso dal contenuto reso, quindi dal viewpoint, per un'altra strada.

### A.3.4 (3) La misura

(1) e (2) lasciano la collisione possibile, quindi il caso non e' impossibile e la misura va fatta.

**Da dove vengono i numeri, e cosa sono.** Non li ho prodotti io a runtime: li prendo da
`frontend/src/components/editor-v2/viewpoint/ir/__tests__/shapeRegistry.test.ts:235-249`, il cui
titolo e', verbatim, `'riproduce gli otto casi misurati sull applicazione'`. Sono **otto misure
prese sull'app in esecuzione** e committate come golden. Verbatim:

```typescript
        const cases: Array<[ShapeForm, number, number, number, number]> = [
            ['ellipse', 27, 14, 39, 48],
            ['ellipse', 114, 14, 120, 48],
            ['ellipse', 188, 14, 197, 48],
            ['ellipse', 60, 43, 85, 61],
            ['diamond', 27, 14, 39, 48],
            ['diamond', 114, 14, 161, 48],
            ['diamond', 188, 14, 266, 48],
            ['diamond', 60, 43, 120, 86],
        ];
```

Le colonne sono `[forma, contentW, contentH, boxW, boxH]`.

**Il caso minimo.** Un model element il cui contenuto reso misura **188 x 14** px. Viewpoint A lo
rende `ellipse`, viewpoint B lo rende `diamond`. Stesso oggetto, stesso inchiostro, stessa `x`
persistita.

| | box in A (ellipse) | box in B (diamond) | delta |
|---|---|---|---|
| 188 x 14 | **197 x 48** | **266 x 48** | **+69 px in larghezza** |
| 60 x 43 | **85 x 61** | **120 x 86** | **+35 px larghezza, +25 px altezza** |

**L'aritmetica della collisione**, con l'angolo alto-sinistra fisso (A.3.1). Due nodi affiancati,
contenuto 188 x 14, posti in viewpoint A a `x = 0` e `x = 220`. In A: il primo occupa `[0, 197]`, il
secondo parte a 220, **gap di 23 px**. In B, senza che nessuno abbia toccato una posizione: il primo
occupa `[0, 266]`, il secondo parte sempre a 220, **sovrapposizione di 46 px**. Il secondo nodo
entra nel primo per 46 px su 266, cioe' il 17% della sua larghezza.

La soglia esatta: due nodi con questo contenuto restano separati in entrambi i viewpoint solo se la
distanza fra gli angoli sinistri e' **>= 266**, cioe' il box del viewpoint piu' largo. Un utente che
dispone il diagramma in A vede 197 e non ha modo di sapere che deve lasciarne 266.

**Il limite di questa misura, dichiarato.** I numeri sono misure reali dell'app ma **prese in altra
sede e in altra data** (golden del 2026-08-15), e l'aritmetica della sovrapposizione e' mia,
derivata dai due box e dall'ancoraggio all'angolo. **Non ho aperto l'app in questa sessione**: la
fase e' read only con P8 in deroga. Vale come CLAUDE.md §5 impone di leggerla — una misura di
contratto, non una misura a schermo. La prova a schermo (aprire un modello, cambiare viewpoint fra
due notazioni di taglia diversa, misurare i due `getBoundingClientRect`) resta da fare e costa
pochi minuti quando il fronte riprende.

Una cautela ulteriore. Le due righe usate come caso minimo sono `ellipse` e `diamond`, cioe' due
forme che nel viewpoint A e B avrebbero taglia diversa **solo se la notazione cambia forma**. Il
caso e' quindi legittimo ma non e' il piu' generale: la stessa asimmetria si presenta, con numeri
che non ho, ogni volta che due viewpoint rendono contenuti di ingombro diverso nella stessa forma.

## A.4 — Q0.c. `Eobj` e il layout condiviso

### A.4.1 (1) La divergenza e' raggiungibile oggi

Si', e da poco. Il commit che apre l'authoring e' `d1dc55649`, **2026-08-02**, verbatim dal messaggio:

```
feat(editor-v2): object-as-edge authoring in the edge view panel

The edge panel now authors both substrates. The nature is not a field of
the IR and none is added: a view IS object-as-edge exactly when both
endpoint PathExprs are present, so the panel derives it and keeps it in
UI state.
```

Da quel commit un autore compila i due endpoint nel pannello edge e la view **e'** object-as-edge.
Niente vieta a un secondo viewpoint di avere una view vertex sulla stessa classe: sono due
`DViewElement` distinti in due viewpoint distinti. La divergenza e' quindi raggiungibile per
composizione di due atti di authoring entrambi supportati.

**Non ho eseguito il percorso utente end-to-end**: e' una lettura del substrato di authoring, non
una verifica a runtime. La distinzione fra «lo schema lo prevede» e «l'utente ci arriva» e' risolta
dal commit sopra, che e' authoring, non schema; ma il click-through non e' stato fatto.

### A.4.2 (2) Che cosa succede al layout persistito: **convivono**, nessuno sovrascrive l'altro

Il meccanismo di soppressione della forma nodo e' una **maschera di sessione**, non una scrittura.
`frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts:266`, verbatim:

```typescript
    const outNodes = nodes.map(n => (edgeObjectVertices.has(n.id) && !n.hidden ? { ...n, hidden: true } : n));
```

`hidden` e' un campo del nodo React Flow. Il D layer non viene toccato: `x`, `y`, `w`, `h`,
`isResized` restano sulla `DVertex` esattamente come erano. Non c'e' cancellazione, e non ho trovato
nessun percorso che azzeri quei campi al passaggio di forma.

I due layout finiscono quindi su **campi diversi dello stesso carrier**:

| forma | dove vive il layout | campo |
|---|---|---|
| nodo | `DVertex` | `x`, `y`, `w`, `h`, `isResized` |
| edge | la **stessa** `DVertex` (del nodo nascosto) | `irEdgeLayout` (`sourceSide`, `targetSide`, `waypoints`) |

Non collidono perche' non condividono un campo. Tornando alla forma nodo, `hidden` torna falso e la
posizione riemerge invariata. E' la stessa cosa che la discovery del 19/7 aveva previsto in §3.6
(*«i campi restano inutilizzati ma agganciati a un'identita' viva»*), qui verificata sull'altro verso
del passaggio.

**Conseguenza per il fronte, senza proporre niente**: la forma del record di layout di un oggetto
gia' oggi **dipende dal viewpoint**, perche' dipende dalla forma in cui quel viewpoint lo rende.
Non e' una contraddizione della decisione del 19/7 — quella decisione ha messo `irEdgeLayout`
proprio li' — ma e' un fatto che la formula «il layout e' proprieta' del disegno del modello» non
descrive: qui non c'e' un layout, ce ne sono due, e quale sia attivo lo decide il viewpoint.

### A.4.3 (3) Datazione rispetto al 2026-07-19

```
b8eeedb27 2026-07-18 feat: IR edge views — reference-as-edge styling and object-as-edge synthesis
e0414a452 2026-07-18 fix: object-as-edge endpoints via lproxy objects + identity-slot name parity
a5a322e75 2026-07-20 feat(editor-v2): wire IR connect gesture (object-as-edge) and containment drop
d1dc55649 2026-08-02 feat(editor-v2): object-as-edge authoring in the edge view panel
65b979ede 2026-08-17 feat(editor-v2): container endpoint for object-as-edge views (slice 2a)
```

(`git log --all --grep="object-as-edge" -i`; il file `irEdgeViews.ts` e' creato da `b8eeedb27`,
verificato con `--diff-filter=A`.)

**La risposta ha due meta' e vanno tenute separate.** La **sintesi** object-as-edge e' del
**2026-07-18**, un giorno **prima** della decisione: il codice c'era. L'**authoring** e' del
**2026-08-02**, due settimane **dopo**: fino ad allora un utente non poteva creare una view
object-as-edge dal pannello. Al momento della decisione, quindi, la divergenza nodo/edge fra due
viewpoint esisteva nello schema e nel motore, ma non era una cosa che un autore potesse produrre.
Il dominio su cui la decisione e' stata presa e' cambiato il 2 agosto.

## A.5 — Q0.d. R-2 **cita**, non poggia

Letto il ragionamento e non la frase: la premessa del layout condiviso e' un **termine di paragone**,
non un presupposto da cui la conclusione discende.

La struttura di R-2 e' un contrasto in tre mosse. (i) *«Il caso gia' deciso indica la regola»* pone il
layout come polo condiviso; (ii) *«Il collasso e' cosa diversa: e' proprieta' di come si sta guardando
adesso»* stacca il collasso da quel polo; (iii) il **Ratificato** conclude: *«lo stato dichiarato
sulla sintassi concreta e' per-viewpoint per default»*.

Il passaggio che regge (iii) e' (ii), ed e' una proposizione **sullo stato**, non sul layout: lo
stato dichiarato e' per-viewpoint perche' e' proprieta' di come si sta guardando adesso. Se cadesse
(i) — se cioe' il layout risultasse anch'esso per-viewpoint — la conclusione non verrebbe
falsificata: verrebbe **estesa**, perche' il default per-viewpoint diventerebbe uniforme invece che
per contrasto. Un default non ha bisogno che esista un'eccezione per essere il default.

Resta una dipendenza minore, e la segnalo perche' esiste davvero: il meccanismo di deroga ratificato
subito dopo (*«La condivisione fra viewpoint e' una scelta esplicita dichiarata nell'IR (`shared:
true` o equivalente)»*) perderebbe il suo esempio canonico. Perderebbe l'esempio, non la funzione:
il flag serve a dichiarare la condivisione di qualunque stato, e il layout ne era l'illustrazione,
non la giustificazione.

**Rettifica a quanto ho scritto nella Fase 1.** Nel corpo del report, §3.1 punto 2, avevo scritto che
*«Ribaltarla non lascia R-2 intatta: ne toglie il termine di paragone»*. Letto il ragionamento come
Q0.d chiede, la formulazione e' troppo forte: **le toglie il termine di paragone e le lascia intatta
la conclusione**. R-2 non va rimisurata se la premessa cade.

## A.6 Domande aperte lasciate da questo addendum

1. La misura a schermo di A.3.4 non e' stata presa (fase read only). Un'apertura dell'app con due
   viewpoint di forma diversa sullo stesso modello la chiuderebbe in pochi minuti, e vale la pena
   farla prima di decidere Q0: e' la differenza fra una sovrapposizione dedotta e una vista.
2. Il percorso utente di A.4.1 e' dedotto dal substrato di authoring, non eseguito.
3. Fuori dal perimetro di questo prompt ma emerso leggendo: `handleAutoLayout` **riscrive tutte le
   posizioni sul D layer** (`EditorV2.tsx:3262`). E' uno scrittore di layout di massa che la Fase 1
   non aveva censito perche' D4 non e' stata eseguita. Chi riprendera' D4 parta da li'.

## A.7 Hard stop

Raggiunto alla fine di Q0.d. Nessuna proposta, nessun progetto, nessuna revoca. Nessun file di
codice modificato. D1..D8 restano sospese in attesa della risposta dell'architetto a Q0.

---

# Addendum Fase 1 ripresa: D9 e D1..D8

**Data**: 2026-08-22 (terza sessione)
**Prompt document name**: 2026-08-22 14:20
**Deroga**: P8 non si applica (fase read only, nessuna modifica al codice, nessuno smoke).
**Esito**: **HARD STOP CONDIZIONATO SCATTATO su D9.** Piu' viewpoint **possono** essere applicati
contemporaneamente al rendering. **D1..D8 non eseguite**, come prescrive il prompt.

## B.0 Due cose in testa, in ordine di urgenza

### B.0.1 La condizione di arresto e' verificata

`frontend/src/redux/selectors/selectors.ts:552-559`, verbatim — il commento e' dell'autore, non mio:

```typescript
            // don't match exclusive views from other vp
            let dvp: DViewPoint = DPointerTargetable.fromPointer(dview.viewpoint, state);
            let oldVpMatch: number = tnv.viewPointMatch;
            // console.log("vp matching " +vid, {vid, dvp, activevpid });
            if (dvp.id === activevpid) tnv.viewPointMatch = ViewEClassMatch.VP_Explicit;
            else if (dvp.id === 'Pointer_ViewPointDefault') tnv.viewPointMatch = ViewEClassMatch.VP_Default;
            else if (!dvp.isExclusiveView) tnv.viewPointMatch = ViewEClassMatch.VP_Decorative;
            else tnv.viewPointMatch = ViewEClassMatch.VP_MISMATCH;
```

Il ramo che conta e' il terzo: **un viewpoint non esclusivo entra nel rendering senza essere
attivo**, per il solo fatto di esistere nel progetto. Solo il quarto ramo esclude, e esclude i soli
viewpoint **esclusivi e non attivi**. Il commento dell'autore lo dice per intero: *«don't match
exclusive views from other vp»* — quelle non esclusive, da altri vp, **matchano**.

L'insieme applicato al rendering in un dato istante e' quindi:

```
{ viewpoint attivo }  ∪  { Pointer_ViewPointDefault }  ∪  { ogni viewpoint non esclusivo del progetto }
```

Non e' un id. La chiave del layout, se seguisse cio' che rende, non sarebbe un id.

### B.0.2 `R-LAY` e il memo di ratifica **non esistono nel repo**

Il prompt chiede di rileggere la serie `R-LAY` righe 1..7 in `docs/decisions.md` e di non fidarsi del
riassunto. Ho ubbidito, e non c'e' niente da rileggere.

| ricerca (cwd `/Users/alfonso/jjodel`) | output |
|---|---|
| `command grep -c "R-LAY" docs/decisions.md` | **0**, exit 1 |
| `command grep -rl "R-LAY" docs/` | **nessun file**, exit 1 |
| `find docs -iname "*layout_per_viewpoint*"` | **solo questo report**; il memo `docs/ratifiche/claude_2026-08-22_memo_ratifica_layout_per_viewpoint.md` non esiste |
| `ls docs/ratifiche/ \| grep -i "2026-08-22"` | vuoto, exit 1 |

**Controlli positivi, stessi comandi**: `command grep -c "R-IRN" docs/decisions.md` -> **57**;
`command grep -rl "R-RAIL-28" docs/` -> **3 file**; `find docs/ratifiche -iname "*memo_ratifica*" |
wc -l` -> **13**. I comandi hanno segnale sui file su cui `R-LAY` risponde zero.

Working tree pulito, `HEAD` = `b65849183` (l'addendum di Fase 1bis), nessun commit di terzi
intervenuto.

**Come va letto, senza sovrainterpretare.** Non sto dicendo che la ratifica non sia avvenuta: il
prompt la riporta e il direttore la dichiara, e per P10 il Project Knowledge tiene lo stato corrente
mentre il repo tiene la storia. Sto dicendo che **la sua copia nel repo manca**, quindi ogni verifica
di questa sessione contro `R-LAY-1..7` sarebbe stata una verifica contro un testo che non ho potuto
leggere. Non ho verificato nulla contro `R-LAY`, e dove il prompt chiede di farlo (domanda aperta 3)
lo dichiaro invece di simularlo.

E' lo stesso schema gia' visto il 2026-08-17 con `R-SIM` (entry di log del 2026-08-17): un fronte
ratificato in chat, il repo indietro di un passo. Vale la pena chiudere il travaso prima della
prossima slice, perche' `R-LAY-6` — a quanto riporta il prompt — e' proprio la riga che vieta di
implementare, ed e' la meno utile da tenere in un solo posto.

## B.1 Ipotesi e obiettivo

**Obiettivo**: eseguire D9 e, se non scattava l'arresto, D1..D8.

**Ipotesi che D9 falsifica**: che l'attivazione di un viewpoint sia esclusiva, cioe' che in ogni
istante un solo viewpoint governi la resa, e che `activeViewpoint` sia quindi la chiave naturale di
un eventuale layout indicizzato.

**Falsificata.** L'ipotesi e' vera **del controllo di attivazione** e falsa **della resa**: il
controllo scrive un id singolo, il renderer classico ne applica tre categorie insieme. La distanza
fra le due cose e' il finding di questa sessione.

## B.2 File letti (path completi)

- `/Users/alfonso/jjodel/docs/decisions.md` (ricerche su `R-LAY`; nessun blocco da leggere)
- `/Users/alfonso/jjodel/frontend/src/redux/selectors/selectors.ts` (righe 410-440, 535-585)
- `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts` (righe 1116, 2895-2930, 3345-3365, 3990-4076)
- `/Users/alfonso/jjodel/frontend/src/utils/lastViewpoint.ts` (righe 1-165)
- `/Users/alfonso/jjodel/frontend/src/view/viewPoint/viewpoint.ts` (righe 1-60)
- `/Users/alfonso/jjodel/frontend/src/components/editors/views/NestedView.tsx` (righe 78-140, 355-375, 490-525)
- `/Users/alfonso/jjodel/frontend/src/components/project/ProjectEditor.tsx` (righe 1179-1216, 2615-2680)
- `/Users/alfonso/jjodel/frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (righe 483-500, 555-575, 2285-2335)
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (righe 100-175)

Tutti in sola lettura.

## B.3 — D9.1. Il componente, l'handler, e tre occhi che non sono quello che sembrano

Il prompt parla di «un'icona a occhio» per viewpoint. Nel codice `bi-eye` compare tre volte in zona
viewpoint, e **nessuna delle tre e' il comando di attivazione**. Vale la pena separarle, perche' e'
esattamente il tipo di deduzione-dal-nome che il prompt vieta.

| occorrenza | file:riga | che cosa fa davvero |
|---|---|---|
| badge di tipo nell'albero | `TreeViewContent.tsx:564` | voce di una tabella di icone: `'tree-viewpoint': { icon: 'bi-eye', label: 'Viewpoint' }`. Decorativa |
| icona di testata del pannello | `NestedView.tsx:500` | dentro `viewpoints-header__icon`, accanto al titolo `Viewpoints`. Decorativa |
| bottone azione in ProjectEditor | `ProjectEditor.tsx:2667-2669` | `title="View"`, ma **apre per l'authoring**, non attiva |

Il terzo e' il piu' insidioso, perche' ha `title="View"`. Verbatim, `ProjectEditor.tsx:2666-2670`:

```tsx
                                        <button className="icon-btn" title="View"
                                                onClick={() => handleOpenViewpoint(vp)}>
                                            <i className="bi bi-eye" />
                                        </button>
```

E il corpo dell'handler, `ProjectEditor.tsx:1179-1182`, verbatim — letto, non dedotto dal nome:

```typescript
    const handleOpenViewpoint = async (vp: LViewPoint) => {
        // TODO: redirect to panels/viewpoint-editor
        DockManager.openViewpoint(vp);
    };
```

Apre una tab. Non tocca `activeViewpoint`.

**Il comando vero e' un interruttore, non un occhio.** `NestedView.tsx:364-376`, verbatim:

```tsx
                    {isVP && d.isExclusiveView && (
                        <div className="viewpoint-active-toggle" onClick={preventClick}>
                            <Tooltip tooltip={isActive ? 'Active viewpoint' : 'Click to activate'} inline={true} position={'top'} offsetY={10}>
                                <div
                                    className={`vp-toggle ${isActive ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        select(d.id);
                                    }}
                                    role="switch"
                                    aria-checked={isActive}
```

Due cose da notare, entrambe portanti.

1. Il gate e' `isVP && d.isExclusiveView`: **i viewpoint overlay non hanno alcun interruttore.** Non
   si attivano perche' non ne hanno bisogno — rendono comunque (B.0.1).
2. `role="switch"` con `aria-checked={isActive}`, e `isActive` e' definito a `NestedView.tsx:130`,
   verbatim: `let isActive = d.id === activeViewpointId;`. Un confronto di uguaglianza contro un id
   solo.

L'handler, `NestedView.tsx:110-111`, verbatim:

```typescript
            const previousViewpoint = project.activeViewpoint;
            project.activeViewpoint = ptr as any;
```

Assegnazione singola. Il resto della funzione e' logging di attivita'.

## B.4 — D9.2. Lo stato scritto e' un id singolo; l'insieme che rende e' derivato

**Quello che si scrive e' un id.** `frontend/src/joiner/classes.ts:2899`, verbatim, e la riga 2924 e'
identica su `DProject`:

```typescript
    activeViewpoint: Pointer<DViewPoint, 0, 1> = Defaults.viewpoints[0];
```

Cardinalita' `0, 1`. Il setter, `classes.ts:3355-3362`, scrive un valore solo dentro `TRANSACTION`:

```typescript
        TRANSACTION(this.get_name(c)+'.activeViewpoint', ()=>{
            SetFieldAction.new(c.data.id, 'activeViewpoint', val, '', true);
```

E il percorso alternativo, `utils/lastViewpoint.ts:59-69`, scrive **due** campi con lo stesso id
singolo, deliberatamente fuori da `TRANSACTION` (verbatim, commento compreso perche' e' la ragione):

```typescript
    if (projectId) {
        SetFieldAction.new(projectId, 'activeViewpoint', viewpointId || null, '', true);
    }
```
```typescript
    SetRootFieldAction.new('viewpoint', viewpointId || null, '', true);
```

**Quello che rende e' un insieme, e non e' memorizzato da nessuna parte: e' ricalcolato a ogni
scoring** dai quattro rami di `selectors.ts:556-559`. Quanti elementi puo' contenere: `1 + 1 + K`,
dove K e' il numero di viewpoint non esclusivi del progetto — cioe' **illimitato dal punto di vista
dello schema**, perche' nulla limita quanti viewpoint overlay un progetto possa avere.

Chi lo legge: `NodeTransientProperties.sort` (`joiner/classes.ts:4051-4076`), che dei punteggi cosi'
calcolati fa due liste. Verbatim, `classes.ts:4060-4063`:

```typescript
            const score = tnv.finalScore = Selectors.getFinalScore(tnv, vid, pv, dview);
            if (!(score > 0)) continue; // do not flip to <=, because undefined and NEGATIVE_INFINITY always compute to false.
            (dview.isExclusiveView ? mainViews : decorativeViews).push( {element:vid, score, view: LPointerTargetable.fromD(dview)} );
```

I pesi che entrano nel prodotto, `joiner/classes.ts:3995-3998`, verbatim:

```typescript
    static VP_MISMATCH: number = Number.NEGATIVE_INFINITY;
    static VP_Default = 1;
    static VP_Decorative = 1;
    static VP_Explicit = 2;
```

Il viewpoint attivo pesa il doppio del Default e degli overlay, ma **non li spegne**: e' un fattore
moltiplicativo in `getFinalScore` (`selectors.ts:434`, verbatim: `return entry.viewPointMatch *
entry.metaclassScore * pvScore * explicitprio + defualtViewMalus;`), non un filtro. Solo
`VP_MISMATCH`, che vale `-Infinity`, esce dalla gara — e la riga 4061 e' scritta apposta per
quell'infinito negativo, come dice il suo commento.

## B.5 — D9.3. `activeViewpoint`, `state.viewpoint` e `getLastEditedViewpointId()`: tre cose diverse

Il prompt avverte sul precedente di `hasWorkbenchVP`. L'avvertimento e' fondato e c'e' un terzo
livello che non era nominato.

| variabile | dove vive | chi la scrive | chi la legge |
|---|---|---|---|
| `DProject.activeViewpoint` | **D layer, persistito** — `classes.ts:2899`, `Pointer<DViewPoint, 0, 1>` | `set_activeViewpoint` (`classes.ts:3355`) e `activateViewpoint` (`lastViewpoint.ts:60`) | il renderer **classico**, via `activevpid` in `selectors.ts:556` |
| `state.viewpoint` | **root dello stato Redux** | solo `activateViewpoint` (`lastViewpoint.ts:69`) | **editor-v2 / IR**: `irResolveCore.ts:117` e `:139` |
| `lastEditedViewpointId` | **variabile di modulo in memoria** — `lastViewpoint.ts:15`, verbatim: `let lastEditedViewpointId: string | null = null;` | `setLastEditedViewpoint` | `resolveParentViewpoint` (`lastViewpoint.ts:135`) e `hasWorkbenchVP` |

`hasWorkbenchVP`, `TreeViewContent.tsx:483`, verbatim: `const hasWorkbenchVP =
!!getLastEditedViewpointId();`. Non ha niente a che vedere con l'attivazione: dice solo se in questa
sessione l'utente ha aperto un viewpoint in workbench, e serve ad abilitare la voce «Create View».
Non e' persistita e non sopravvive a un reload.

Le prime due sono scritte insieme e restano allineate perche' hanno **un solo scrittore comune**
(`activateViewpoint`), che pero' e' deliberatamente **fuori da `TRANSACTION`** — commento verbatim
a `lastViewpoint.ts:43-45`:

```
 * Uses direct SetFieldAction instead of the L-proxy setter to avoid async
 * TRANSACTION batching issues that caused the SetRootFieldAction to interfere
 * with the project.activeViewpoint update.
```

Ma **non hanno un solo scrittore in assoluto**: `NestedView.tsx:111` e `:315` scrivono
`project.activeViewpoint = ptr` direttamente, senza passare da `activateViewpoint`, quindi
**senza aggiornare `state.viewpoint`**. Il toggle del viewpoint classico muove la variabile che
legge il renderer classico e lascia ferma quella che legge editor-v2. Non l'ho verificato a runtime
e non e' oggetto di questo prompt: lo registro come rischio in B.8, non come finding chiuso.

## B.6 — D9.4. Che cosa vede il canvas. E l'asimmetria fra i due renderer

### B.6.1 Renderer classico: un main piu' una pila

`joiner/classes.ts:4071-4073`, verbatim:

```typescript
        tn.mainView = mainViews[0]?.view;
        tn.validMainViews = mainViews.map((s)=> s.view); // this have duplicates of newly created elements
        tn.stackViews = decorativeViews.map((s)=> s.view);
```

Il canvas vede, **per ogni nodo**: **una** main view — la esclusiva col punteggio piu' alto fra
quelle sopravvissute — piu' **tutte** le decorative con punteggio positivo, ordinate per punteggio
(`classes.ts:4065-4066`, verbatim: `decorativeViews.sort((s1, s2)=> s2.score - s1.score);`, idem per
`mainViews`). La dichiarazione del campo lo mette per iscritto, `classes.ts:4031`, verbatim:

```typescript
    stackViews!: LViewElement[]; // for each parentview, an array of Decorative Views[] sorted by score (including parent view influence).
```

Quindi: **la main view viene da un viewpoint solo** (l'attivo, o il Default, o un overlay se e' lui
a portare l'unica esclusiva applicabile), **ma le decorative impilate sopra possono venire da
viewpoint diversi contemporaneamente**, senza che l'utente abbia attivato nulla.

### B.6.2 editor-v2 / IR: un viewpoint solo, e il confronto e' secco

`components/editor-v2/viewpoint/ir/irResolveCore.ts:139-155`, verbatim (estratto contiguo):

```typescript
    const vp = state.viewpoint as string;
```
```typescript
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== vp) continue;
```

Un solo id, un confronto di disuguaglianza, `continue`. Stessa forma nella firma di invalidazione,
`irResolveCore.ts:117-125`, verbatim:

```typescript
export function computeIRSignature(state: any): string {
    const vp = state.viewpoint;
    if (!vp) return '';
    const lookup = state.idlookup;
    const parts: string[] = [vp];
    const list: string[] = state.viewelements ?? [];
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== vp) continue;
```

**Le due meta' dell'applicazione hanno due semantiche di viewpoint diverse**, e la differenza non e'
di grado: editor-v2 e' esclusivo per costruzione, il classico e' cumulativo per costruzione. Nessuna
delle due e' un bug — sono due modelli — ma un layout «indicizzato per viewpoint» ha bisogno di
sapere quale dei due sta descrivendo, e la risposta non e' la stessa.

### B.6.3 Perche' questo ferma D1..D8

Il prompt lo anticipa e ha ragione: *«In quel caso la chiave del layout non e' un id ma un insieme e
R-LAY-1 va riformulata»*. Aggiungo la ragione che ho misurato, che e' un po' peggiore di come la
condizione era formulata: la chiave non e' nemmeno un insieme stabile, perche' **l'insieme che rende
non e' memorizzato**. E' ricalcolato per nodo, per view, a ogni scoring, e dipende da `metaclassScore`,
`pvScore` e `explicitprio` oltre che dal viewpoint. Due nodi dello stesso modello, nello stesso
istante, possono avere pile decorative diverse.

Eseguire D1..D8 adesso significherebbe censire lettori e scrittori (D3, D4) e misurare un costo (D8)
contro un contratto di chiave che non regge. Mi fermo qui.

## B.7 Quello che questa sessione **non** ha accertato

D1..D8 **non eseguite**. In particolare restano ignote la sede dei campi (D1), la molteplicita'
misurata dei graph element per view (D2 — e resta valido l'avvertimento dell'addendum di Fase 1bis:
i tre documenti che dicono «il DGraph e' per modello» sono citazioni, non misure), lettori e
scrittori (D3, D4), la meta' persistita della taglia (D5), lo stato dei waypoint (D6), versione e
migrazione (D7), il costo in stato (D8).

Non ho verificato nulla contro `R-LAY-1..7`, per la ragione di B.0.2.

## B.8 Dipendenze e rischi

- **Rischio di contratto**: `R-LAY-1`, per come il prompt la riassume, poggia su una chiave a id
  singolo. B.0.1 la contraddice sul renderer classico. Va riformulata prima che D1..D8 abbiano un
  bersaglio.
- **Rischio di disallineamento fra i due scrittori dell'attivazione** (B.5): `NestedView.tsx:111` e
  `:315` scrivono `project.activeViewpoint` senza aggiornare `state.viewpoint`. Se confermato a
  runtime, il viewpoint attivo per il classico e quello attivo per editor-v2 possono divergere. **Non
  verificato a runtime**, registrato come rischio.
- **Rischio documentale** (B.0.2): il travaso della ratifica dal KB al repo e' in arretrato di un
  passo. Precedente identico: `R-SIM`, 2026-08-17.
- **Nessun rischio tecnico introdotto**: zero file di codice modificati.

## B.9 Domande aperte per l'architetto

Le tre prescritte dal prompt, piu' quella che l'arresto solleva.

**Q4 (nuova, ed e' quella che blocca).** Il layout va indicizzato su **cio' che si attiva** o su
**cio' che rende**? Sono due cose diverse e il codice le tiene separate. Se si sceglie cio' che si
attiva, la chiave e' `activeViewpoint`, e' un id, e L-1 regge — al prezzo che il layout non descrive
la resa effettiva, perche' le decorative di altri viewpoint continuano a impilarsi sopra. Se si
sceglie cio' che rende, la chiave non e' un id ne' un insieme stabile, ed e' il caso in cui il fronte
va ripensato. Notare che **su editor-v2 le due risposte coincidono** (B.6.2): la divergenza e' tutta
del renderer classico, e quanto pesi dipende da quanto il classico sia ancora un bersaglio.

**Q1 — Sulla base di D1 e D2, qual e' la sede giusta del record, e perche' le altre due sono
peggiori?**
*Non rispondibile, e il prompt stesso vieta di scegliere una sede.* D1 e D2 non sono state eseguite.
Va aggiunto che la domanda presuppone tre candidate (sede attuale, tabella di progetto, dizionario su
`DViewPoint`) tutte indicizzate da un id: se Q4 si risolve verso «cio' che rende», nessuna delle tre
e' esprimibile cosi' com'e' scritta.

**Q2 — Esiste un percorso che scrive layout senza passare dagli scrittori censiti in D4?**
*Non rispondibile*: D4 non e' stata eseguita, quindi non c'e' un censimento rispetto a cui definire
un «fuori». Resta agli atti dall'addendum di Fase 1bis l'unico scrittore emerso incidentalmente e non
previsto dal prompt originale, `handleAutoLayout` (`EditorV2.tsx:3262`), che il prompt di oggi ha
infatti promosso a punto di partenza di D4.

**Q3 — Quale delle righe `R-LAY-1..7` il codice contraddice o rende piu' cara?**
*Non rispondibile per indisponibilita' della fonte* (B.0.2): le sette righe non sono nel repo e non le
ho lette. Sulla sola `R-LAY-1` come il prompt la riassume — chiave `viewpointId | ABSTRACT` — il
finding B.0.1 e' pertinente e la contraddice **sul renderer classico**, non su editor-v2. Sulle altre
sei non dico nulla: non le ho viste. Quando il memo sara' nel repo, questa domanda si richiude in
pochi minuti.

## B.10 Hard stop

Raggiunto su D9, per la condizione dichiarata nel prompt. Nessuna proposta di progetto, nessuna scelta
di sede, nessuno schema, nessun codice. D1..D8 attendono la riformulazione della chiave.

---

# Addendum Fase 1: D1..D8 e D10

**Data**: 2026-08-22 (quarta sessione)
**Prompt document name**: 2026-08-22 17:05
**Esito**: **arresto al PASSO ZERO.** `R-LAY` non e' a registro. D1..D8 e D10 **non eseguite**.

Il prompt prescrive: *«Se il primo torna 0, fermati: la serie non e' a registro e questo prompt non ha
le sue premesse. Scrivi una riga nel report e restituisci il controllo.»* Questa e' quella riga.

**Misura** (cwd `/Users/alfonso/jjodel`, `command grep` = BSD grep, non il wrapper `ugrep`):

| comando | output |
|---|---|
| `command grep -c "R-LAY" docs/decisions.md` | **0** |
| `command grep -c "R-IRN" docs/decisions.md` | **57** ← controllo positivo, coincide col valore atteso dal prompt |
| `command grep -rl "R-LAY" . --exclude-dir=node_modules --exclude-dir=.git` | **solo `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md` e `docs/claude-code-log.md`**, cioe' questo stesso report e la sua entry di log, che la citano per segnalarne l'assenza |
| `command grep -rl "R-IRN" . --exclude-dir=node_modules --exclude-dir=.git \| wc -l` | **41** ← controllo positivo, stessa invocazione |
| `find docs/ratifiche -iname "*2026-08-22*"` | **vuoto** |
| `find docs/ratifiche -iname "*2026-08-1*" \| wc -l` | **19** ← controllo positivo, stessa invocazione |

Il memo `docs/ratifiche/claude_2026-08-22_memo_ratifica_layout_per_viewpoint.md`, citato in
RIFERIMENTI insieme al suo addendum §8, non esiste. Working tree pulito, `HEAD` = `caa08d91d`, nessun
commit di terzi fra la sessione precedente e questa.

**Nota, la stessa gia' scritta in B.0.2 e non ripetuta oltre**: non sto affermando che la ratifica non
sia avvenuta. Il prompt riassume dieci righe `R-LAY-1..10` e cita fatti che solo il direttore poteva
stabilire (l'emendamento del 19/7, la chiusura di D9 su R-LAY-6 e R-LAY-8, il perimetro di R-LAY-9, il
divieto di R-LAY-10). Manca il **travaso nel repo**, non la decisione. E' la seconda volta oggi sullo
stesso fronte, dopo l'arresto delle 14:20.

D1..D8 e D10 sono pronte a partire e non dipendono da altro che dall'iscrizione della serie.

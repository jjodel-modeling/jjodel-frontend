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

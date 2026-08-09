# Backlog Jjodel — vista ordinata al 2026-08-04

**Natura del documento**: snapshot di pianificazione, **non** documento vivo. La fonte canonica resta `contesto_progetto.md` (sezioni "Prossimi passi" e "Bug aperti"); questa è una vista ordinata che consolida anche i todo generati dalle ratifiche di oggi. Da fondere in `contesto_progetto.md` al prossimo aggiornamento, non da mantenere in parallelo.

**Taglie**: XS una riga o poco più; S un commit scoped; M una slice con discovery e verifica visiva; L un arco su più slice.

---

## 1. Arco in corso: partizione dei tab (chiude F1)

Decisioni già ratificate in `claude/ratifiche_2026-08-04_tab_partizione.md`. È l'unico arco con le decisioni chiuse e nulla di aperto se non l'esecuzione.

| # | Task | Taglia | Dipendenze |
|---|---|---|---|
| 1.1 | Verifica a runtime su `cssIsGlobal = true` (Q1 del report tab map) | XS | nessuna, un minuto |
| 1.2 | Discovery sul sollevamento dello stato UI dai sotto-editor al pannello | M | prompt da scrivere |
| 1.3 | Pin di identità della metaclasse come campo additivo nell'IR (R-1) | S | 1.2 |
| 1.4 | Rimozione di `Applicable to` come controllo | S | **1.3 landata**, commit separato |
| 1.5 | Partizione della barra in `Applies to · Structure · Appearance · Text · Source` | M | 1.2, 1.3 |
| 1.6 | Rimozione dei tab morti (template, events, options, style) dalle view IR | S | 1.5, commit separato |
| 1.7 | Cancellazione del ramo irraggiungibile `ViewData.tsx:95-101` (R-6) | XS | può viaggiare con 1.5 |

Vincolo di sequenza non negoziabile: 1.3 prima di 1.4, e 1.6 separato da 1.5, altrimenti la verifica visiva non distingue una regressione della barra da una regressione di ciò che la barra non mostra più.

## 2. Frizioni di authoring dal dogfooding (F2, F3)

Hanno precedenza sull'arco edge v2 per ratifica del 2026-08-04: il collo di bottiglia osservato è scrivere un edge, non renderlo meglio.

| # | Task | Taglia | Note |
|---|---|---|---|
| 2.1 | Micro-slice `isUsableEndpointExpr`: estrarre la guardia in un modulo puro importabile | S | **prerequisito di F3**. Oggi è la quinta copia della grammatica PathExpr, con il mirror letterale nel test |
| 2.2 | **F2**, scaffold dell'object-as-edge: esporre i due capi da riempire invece di rendere con la sintassi di default | M | preceduta dalla verifica di cosa rende oggi uno stato con un solo endpoint |
| 2.3 | **F3**, risalita al parent di composition negli endpoint | M | bloccata dalla decisione di sintassi (vedi Decisioni sospese) e da 2.1 |

## 3. Bug e debiti di correttezza

| # | Task | Priorità | Taglia |
|---|---|---|---|
| 3.1 | **Undo dei valori di modello**: discovery su se esista un canale Redux e cosa costi farci entrare gli edit inline | ALTA | M |
| 3.2 | Bug dei due Select su `father` (`InfoData.tsx:306,323`, `ViewProperties.tsx:121-133`): scegliere un viewpoint perde il parent view precedente | MEDIA | S |
| 3.3 | `handleReconnect` scrive fuori da `TRANSACTION` (`EditorV2.tsx:1883-1886`) | ⚠️ | S |
| 3.4 | Reconnect su reference multi-valore: `slot.value` con semantica single-value su slot `upperBound = -1` | ⚠️ | S, emerge coi capi `$ref.values[0]` |
| 3.5 | `validateIR` senza cross-check: gli IR ibridi restano accettabili da console | ⚠️ | M, tocca `irCompile` e `irValidate`, può invalidare view persistite |
| 3.6 | Rilevamento del conflitto `cssIsGlobal`: warning quando una view del viewpoint attivo ha `cssIsGlobal` vero e un `view.css` con regola annidata più `!important` (R-2 emendata) | ⚠️ **precede 1.6** | S |
| 3.7 | `registerEdgePath` è un registry globale condiviso con gli edge classici | ⚠️ | rilevante per E-route, non prima |
| 3.8 | Guardia sul cambio valore nei commit inline IR (`commitRowEdit`/`commitLabelEdit`) | BASSA | XS, declassata: torna a contare quando 3.1 atterra |
| 3.9 | Doppia registrazione del listener `beforeunload` (`U.tsx:226`), dev-only | BASSA | XS |

## 4. Espressività delle righe

Il capitolo che la mappa di copertura indica come il vero residuo di authoring, dopo che vertici, righe ed edge hanno tutti un pannello.

| # | Task | Taglia |
|---|---|---|
| 4.1 | Operation, row view con parametri, più fix del multi-compartment `children` reso per-compartment | L |
| 4.2 | Editing inline delle righe (oggi read-only per decisione P2) | M |
| 4.3 | Filtro per-reference (`{childId, refName}`) | S |
| 4.4 | Reference non-containment con guardia di profondità | M |

## 5. Arco edge v2

Ordine deciso invariato, ma dietro F2 e F3. Nessuna entra nella critical zone; atterrano tutte in `UnifiedEdge.tsx`, mai due in lavorazione insieme. Dettaglio in `claude/ratifiche_2026-08-03_edge_expressiveness_decisioni.md`.

| # | Task | Taglia |
|---|---|---|
| 5.1 | E-mark | M |
| 5.2 | E-lab | M |
| 5.3 | E-route | M, dipende da 3.7 |

Fuori scope v1, con Layer Impact Report: persistenza del layout per reference-as-edge, target-metaclass nella chiave di matching, edge M2 nel path IR.

## 6. Capitolo stato e azioni (tab Behavior)

Ratificato R-1..R-9 il 2026-08-03, non ancora aperto. È il recupero di una capacità persa, non una feature nuova: il tab Events è una superficie di authoring sopra un runtime rimosso, e `_state` su `DPointerTargetable` (`joiner/classes.ts:1427`) esiste già con la semantica che serve.

| # | Task | Taglia |
|---|---|---|
| 6.1 | Spec di schema derivata da R-1..R-7 | M |
| 6.2 | Implementazione del modello di stato e del vocabolario di azioni | L |
| 6.3 | Tab **Behavior** nella barra partizionata | S, dopo 1.5 e 6.2 |

## 7. Estensioni della sintassi concreta

| # | Task | Taglia |
|---|---|---|
| 7.1 | `graphVertex`: sezione containment in Structure più la riga in `showIRTab` (R-6) | M, prima slice naturale dopo la partizione |
| 7.2 | Famiglia poligonale di shape | M |
| 7.3 | Decorative views | M, dipende dal comportamento di `exclusive` nel resolver |
| 7.4 | Rules editor (rules multi-branch oggi preservate come chip read-only) | L |
| 7.5 | Reattività cross-object v1.2 | M |
| 7.6 | Theming di viewpoint, se è una capacità voluta: casa nell'editor del viewpoint, non nel tab di una view | da decidere prima di stimare |

## 8. Redesign UI (filone parallelo)

| # | Task | Taglia |
|---|---|---|
| 8.1 | Fase INSTANCES, C3 e C4 | M, attendono il mockup |

## 9. Igiene

| # | Task | Taglia |
|---|---|---|
| 9.1 | Allineare `claude/mappa_sintassi_concreta.md`: dichiara ancora la rehydration del viewpoint selector come blocco più costoso, chiusa il 2026-08-04 | XS |
| 9.2 | Rettifica delle due entry di log malformate del 2026-08-03 (i 4 errori del gate), più **bug del gate stesso**: `check-docs.ts:268` costruisce l'insieme di risoluzione col nome intero del prompt document (`known.add(n.trim())`) ma `:313` risolve `Corregge` sul solo prefisso timestamp (`known.has(m[1])`), quindi ogni nome con annotazione dopo l'ora risulta irrisolto. Warning non bloccante, ma falsa la lettura del gate | S |
| 9.3 | `.claude/scheduled_tasks.lock` fuori dall'indice | XS |
| 9.4 | Normalizzare la posizione di `ir/pathExpr.ts` quando R-5 estenderà la grammatica | XS |
| 9.5 | Rimozione di `JjodieWidget`, morto con zero import | XS |
| 9.6 | Adiacenze del selector viewpoint: doppia lista root, filtro che inghiotte i failure senza log, create su id esistente come no-op silenzioso | S |

## Decisioni sospese che bloccano del lavoro

- **Sintassi della risalita al parent (F3)**, tipata o non tipata. Proposta non ratificata: nominare la feature di composizione (`$^transitions`) invece del tipo del parent, perché l'inverso di una containment è verificabile staticamente sul metamodello. **Blocca 2.3.**
- **R-2, collasso condiviso fra viewpoint**: aperta, senza evidenza sotto.
- **R-9, isolamento per modello dei singleton di sessione**: parcheggiata in attesa di un'occasione d'uso reale.

---

## Ordine consigliato per le prossime tre sessioni

**Sessione A, chiudere F1.** 1.1 (un minuto), poi 1.2 e la sua analisi, poi 1.3 e 1.4 in commit separati. È l'unico arco con le decisioni già chiuse: lasciarlo a metà significa tenere aperto un capitolo in cui i documenti dicono una cosa e il prodotto un'altra.

**Sessione B, 1.5 più 1.6, e in parallelo 3.1.** La partizione va verificata a video commit per commit. La discovery sull'undo è read-only, sta in una chat sua e non compete per la verifica visiva: è il candidato naturale per riempire i tempi morti fra un hard stop e l'altro.

**Sessione C, F2 e F3.** Con 2.1 come primo commit, perché è prerequisito e costa poco. F3 non parte finché la sintassi della risalita non è ratificata: se la decisione non arriva prima, la sessione fa F2 e si ferma.

Fuori da questo orizzonte restano il capitolo stato e azioni (6) e l'espressività delle righe (4), che sono i due archi grossi, e che conviene aprire solo con la barra partizionata già in produzione: entrambi aggiungono superfici, e aggiungere superfici a una barra che stiamo ancora sottraendo è il modo più efficiente di annullare il lavoro di F1.

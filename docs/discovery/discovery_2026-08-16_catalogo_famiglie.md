# Discovery: riorganizzazione del catalogo per famiglie semantiche (D24, D26 parziale)

**Data**: 2026-08-16 00:12
**Prompt**: `docs/prompts/claude_2026-08-15_2345_prompt_riorganizzazione_catalogo_famiglie.md`
**Fase**: 1 (read-only). Nessuna modifica effettuata.
**HEAD all'avvio**: `887881766`, branch `alfonso-frontend-jjtl`, working tree pulito (untracked deliberati `.claude/settings.local.json`, `_to_delete/`).

## Obiettivo

Rispondere alle 7 domande del prompt: censimento dei preset, rappresentabilita' della prima ondata D26, modello dati per la famiglia, stato dei chip, sopravvivenza dei recenti, convenzioni delle label, collisioni di nomi.

## File letti (integralmente salvo indicato)

- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (172 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/notationCatalog.test.ts` (165 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolCatalogPicker.tsx` (247 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx` (338 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.scss` (indice classi via grep)
- `frontend/src/components/editor-v2/viewpoint/ir/shapeRegistry.ts` (chiavi del registry via grep: rect, rounded, ellipse, circle, diamond)
- `docs/claude-code-log.md` (entry recenti), `docs/decisions.md` (coda)

## Findings

### F1. Censimento: 36 preset, 5 notazioni

BPMN 17 (7 eventi, 4 gateway, 6 task), UML 7 (6 state machine + use case), Flowchart 2, Petri net 3, ER 7. Ordine sezioni corrente = prima apparizione in tabella (BPMN, UML, Flowchart, Petri net, ER).

**Finding chiave, ricalibra il memo D26**: la matrice "tipi di evento" e "tipi di task" BPMN e' GIA' in tabella come asse `marker` (message/timer/signal/error event; service/user/script/loop/multi-instance task), verificata in P5 per le varianti catch. La condizione di riapertura dei badge scritta in D26 riguarda quindi le varianti throw (glifi campiti), i boundary/non-interrupting e i marker multipli, non i tipi base, che esistono gia'.

### F2. Tabella di rimappatura proposta (36 esistenti + 7 nuovi = 43)

| Famiglia | Preset | Tag mostrato |
|----------|--------|-----|
| **Base** (5, nuovi) | base-rect, base-rounded, base-ellipse, base-circle, base-diamond | nessuno (famiglia pura) |
| **Process** (29) | i 17 BPMN; uml-state, uml-initial-state, uml-final-state, uml-shallow-history, uml-deep-history, uml-choice; petri-place, petri-marked-place, petri-transition; uml-use-case (v. domanda 4); nuovi: uml-flow-final, uml-fork-join | BPMN / UML / Petri net |
| **Data** (7) | i 7 ER | nessuno |
| **Flowchart** (2) | flow-process, flow-decision | nessuno |

Nuovi preset rappresentabili OGGI (nessun tocco al registry):
- `uml-flow-final` (Flow final AD): form circle + marker x (entrambi esistenti)
- `uml-fork-join` (Fork/Join AD·SM): form rect + fill INK (idioma identico a petri-transition)
- i 5 base: forme pure senza marker

Della prima ondata D26 risultano GIA' esistenti: Stato, Inizio, Fine, Storia (shallow e deep), Decisione (uml-choice + flow-decision), Gateway inclusivo.

**Rimandati a D25** (forma mancante indicata): Azione e Terminator (stadio), Invio/Ricezione segnale (pentagoni), Data object (pagina), Data store e Database (cilindro), I/O (parallelogramma), event-based gateway (composito), predefined process (rect a bande), famiglia Obiettivi i* (stadio, esagono, nuvola). Terminate SM e Junction esclusi: il primo non e' un contorno, il secondo duplica il valore di initial-state.

### F3. Modello dati: campo opzionale, indice nuovo affiancato

- `SymbolPreset` e' interfaccia esportata → regola 11 (solo proprieta' opzionali): si aggiunge `readonly family?: CatalogFamily`. Tutte le righe di tabella lo dichiarano; l'opzionalita' protegge il preset sintetico `__current-axes` di `SymbolEditorModal.currentAxesPreset` (notation `''`, senza famiglia), che resta intatto.
- `CatalogSection`/`catalogSections` (esportati, 5 test dedicati) NON si modificano: si affianca `CatalogFamilySection` + `catalogFamilySections(query, notation)` con la notazione piegata nel filtro dei preset (i totali restano a cardinalita' piena). `catalogSections` resta col suo contratto e i suoi test (regole 9 e 11).
- Ordine famiglie: costante dichiarata `CATALOG_FAMILIES` (non prima-apparizione).

### F4. Chip: da nascondi-sezione a filtro nei preset

Oggi `visibleSections` nasconde le sezioni di altre notazioni (con sezioni=notazioni era equivalente al filtro). Con le famiglie il chip attivo deve filtrare le tile DENTRO le sezioni: sezioni svuotate dal filtro nascoste, espansione forzata (stessa sospensione del collasso gia' scritta per la ricerca), contatori = match a filtro attivo, totali altrimenti. I chip restano derivati da `CATALOG_NOTATIONS`: con i preset Base che dichiarano notation `'Base'`, il chip Base entra da solo, zero special-case (v. domanda 3).

### F5. Recenti: sopravvivono per costruzione

Id invariati per tutti i 36 esistenti; risoluzione via `getCatalogPreset` non cambia. I 7 id nuovi non collidono (verifica su tabella: unicita' testata).

### F6. Lingua e convenzioni

UI del picker in inglese ('All notations', 'Recent', 'No symbol matches...'; label preset inglesi). Label famiglia proposte: **Base, Process, Data (ER), Flowchart**. Footer modale da adeguare: oggi `{N} presets · {M} notations`, proposta `{N} presets · {F} families`.

### F7. Collisioni: nessuna

Controllo positivo eseguito (grep `CATALOG_NOTATIONS` → 4 file attesi; GNU grep 3.7 della VM). Identificatori liberi: `CatalogFamily`, `CATALOG_FAMILIES`, `catalogFamilySections`, `CatalogFamilySection`, classe SCSS `symbol-catalog__tag`. "family" compare solo in commenti e in `fontFamily` (irTypes).

## Rischi e note

1. **Recognition**: i 5 preset Base entrano nell'insieme dei match di `recognizeSymbol` (un rect nudo oggi matcha gia' er-entity e flow-process, quindi il multi-match e' semantica corrente; Base aggiunge un match, nessun cambio di natura).
2. **Test P5 da aggiornare**: l'assert «le cinque notazioni» (`['BPMN','ER','Flowchart','Petri net','UML']`) va esteso con `'Base'`: e' un test di integrita' dei dati, evolve coi dati.
3. **Collasso default**: oggi prima notazione espansa (`CATALOG_NOTATIONS.slice(1)`); diventa prima famiglia espansa (`CATALOG_FAMILIES.slice(1)`). Quale famiglia sta prima e' la domanda 1.
4. La variante `disclosure` non tocca sezioni ne' chip (usa `filterCatalog` + Select): resta byte-identica e funziona invariata.
5. Gate attesi: typecheck 14 (Linux, elenco identico), **vitest baseline 1230** (aggiornata dopo l'anteprima D8, non piu' 1221), build exit 0.

## Perimetro previsto per la Fase 2 (5 file)

1. `viewpoint/ir/notationCatalog.ts` (campo family, 7 righe nuove, CATALOG_FAMILIES, indice nuovo)
2. `viewpoint/ir/__tests__/notationCatalog.test.ts` (integrita' family + test indice nuovo + assert P5 esteso)
3. `viewpoint/authoring/SymbolCatalogPicker.tsx` (variant column: sezioni per famiglia, chip a filtro, tag condizionale)
4. `viewpoint/authoring/SymbolEditorModal.scss` (classe `symbol-catalog__tag`)
5. `viewpoint/authoring/SymbolEditorModal.tsx` (solo footer del catalogo)

## Domande per Alfonso (hard stop)

1. **Sezione aperta di default**: Base o Process? (D18 ratifico' «prima sezione aperta»; la prima ora sarebbe Base, ma Process e' la piu' usata)
2. **Conferma dei 7 preset nuovi**: 5 Base + Flow final + Fork/Join (gli altri D26 esistono gia'; il resto slitta a D25 con la forma mancante)
3. **Preset Base nel catalogo**: duplicano deliberatamente la faccia wizard (il form axis e' gia' editabile sotto); la ridondanza e' voluta (ricercabilita', ingresso per principianti) o Base resta fuori dal catalogo?
4. **Collocazione di uml-use-case**: proposta Process (tag UML); alternative: futura famiglia Obiettivi (D25) o futura Structure
5. **Label famiglia**: Base, Process, Data (ER), Flowchart confermate?

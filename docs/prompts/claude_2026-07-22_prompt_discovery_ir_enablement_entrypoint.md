# Prompt Claude Code — Discovery: enablement e matching top-level della IR (metaclasses/predicate/priority/exclusive)

**Tipo**: discovery (read-only, nessuna modifica)
**Data**: 2026-07-22
**Fase**: propedeutica a un'eventuale B2c (non ancora ratificata)

## COSA

Durante la review architetturale di B2b-ii è emerso un punto poco chiaro: la tab "Apply to" (oclCondition/jsCondition/appliableToClasses) non ha alcun effetto sul matching di una view IR (`ir.kind === 'vertex'`) — confermato via codice, `resolveIRView` in `irResolveCore.ts` usa solo `ir.metaclasses`/`ir.predicate`/`ir.priority`/`ir.exclusive`. Una prima ricerca mirata (grep manuale, non sistematica, limitata a `frontend/src/components/editor-v2/viewpoint/` e `frontend/src/components/editors/`) non ha trovato:

1. Nessun controllo UI in `VertexAuthoringPanel.tsx` che scriva `draft.metaclasses` (viene solo letto, per risolvere le feature del PathBuilder).
2. Nessun controllo UI in nessun file di `authoring/` che editi il `predicate` top-level della view (diverso dai Predicate/Conditional di campo wireati in B2b-ii, che vivono dentro `shape`/`labels`/`badges`/`fieldCompartments`).
3. Nessun controllo UI per `priority` o `exclusive` top-level.
4. Nessun punto che, all'attivazione della IR su una view esistente, copi `appliableToClasses` dentro `ir.metaclasses` (il seed è sempre `defaultObjectViewIR()`, che usa `metaclasses: '*'`).
5. Nessuna implementazione della "Fase 4 inverse migration" citata nei commenti di `irDefaults.ts` (`migratedFrom: 'classic-default'`) — sembra un concetto pianificato ma non ancora costruito.

Questa discovery deve **verificare o smentire** questi 5 punti con una ricerca sistematica sull'intero `frontend/src` (la mia era parziale, limitata a due cartelle), e in più chiarire come è popolata oggi l'unica istanza IR effettivamente funzionante nel repo: la viewpoint di test "IR Test Bed" / "IR State" (quella usata come fixture nei gate visivi di B2a/B2b-i/B2b-ii).

## DOVE (scope — solo lettura, nessuna modifica)

- `frontend/src/**` (ricerca sistematica, non limitata a `editor-v2/viewpoint` e `editors/`)
- In particolare, verificare se esistono punti di enablement/creazione IR in: `frontend/src/redux/` (actions/reducers), `frontend/src/model/` (DViewElement, LViewElement), componenti di menu/context-menu/toolbar (dock, tree, canvas), qualunque file che referenzi `defaultObjectViewIR` oltre a quelli già noti.
- Localizzare il fixture/dataset della viewpoint "IR Test Bed" / "IR State": file di seed, script di init, o dati hardcoded, e riportarne il path esatto.

**Nessuna modifica al codice.** Questo è un task di sola lettura.

## COME

1. Leggere `CLAUDE.md` e `docs/claude-code-log.md` (ultime entry) per contesto, come da convenzione.
2. Ricerca sistematica (`grep -r` o equivalente) su tutto `frontend/src` per:
   - `defaultObjectViewIR` (tutti gli usage, non solo quelli già noti in `irDefaults.ts` e `VertexAuthoringPanel.tsx`)
   - `ir.metaclasses =` / `metaclasses:` in scrittura (non lettura) al di fuori di `irDefaults.ts`
   - `ir.predicate` in scrittura
   - `kind: 'vertex'` / `kind:'vertex'` (tutte le occorrenze)
   - `migratedFrom`
   - qualunque azione/handler con un nome tipo "enable IR", "create IR view", "abilita IR", "new IR view" (anche in italiano o varianti)
3. Se viene trovato un punto di enablement non ancora noto, riportarne il comportamento esatto: cosa scrive in `view.ir`, se copia `appliableToClasses` o altri campi della view classica, dove si trova nell'albero dei componenti (menu, bottone, altro).
4. Se NON viene trovato alcun punto di enablement (conferma dei miei 5 punti), dirlo esplicitamente — è un finding valido quanto trovarne uno.
5. Localizzare e riportare il file/i file che definiscono la viewpoint "IR Test Bed" / "IR State" usata nei gate visivi B2a/B2b-i/B2b-ii, e come i suoi `ir.metaclasses`/`ir.predicate` sono popolati (hardcoded in un fixture, seed script, altro).
6. Verificare se `PredicateBuilder`/`ConditionalEditor` (costruiti in B2b-i, wireati in B2b-ii) sarebbero già riusabili così come sono per editare il `predicate` top-level della view (stesso tipo `Predicate`), o se servirebbe un adattamento — nota tecnica, non implementare nulla.

## RIFERIMENTI

- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` — `defaultObjectViewIR()`, seed `metaclasses: '*', priority: 0, exclusive: true`, nessun `predicate`.
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — schema `VertexViewIR` (campi `metaclasses`, `priority`, `exclusive`, `predicate`).
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — legge `draft.metaclasses` (riga ~89) solo per risolvere le `PathBuilderFeatures`, non lo scrive mai.
- `frontend/src/components/editors/views/data/InfoData.tsx` — tab "Apply to" classico (`appliableToClasses`, `oclCondition`, `jsCondition`, `explicitApplicationPriority`, `isExclusiveView`), confermato non consultato dal resolver IR.
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` — `resolveIRView`, usa solo `ir.metaclasses`/`ir.predicate` via `index.byMetaclass`/`compiled.predicate`.
- `frontend/src/components/ui/PredicateBuilder/`, `frontend/src/components/ui/ConditionalEditor/` — componenti generici già pronti (B2b-i), potenzialmente riusabili per il predicate top-level.

## Discovery report (obbligatorio)

Salvare in `docs/discovery/discovery_2026-07-22_ir_view_enablement_entrypoint.md` (se esiste già un file con questo nome per oggi, usare suffisso `_2`). Struttura minima: obiettivo, file letti/analizzati (path completi), findings per ciascuno dei 6 punti sopra, dipendenze/rischi individuati, domande aperte per Alfonso.

## Hard stop

Nessuna implementazione in questo task. Al termine: solo il discovery report su file, nessun commit di codice (il log `docs/claude-code-log.md` può essere aggiornato con l'entry standard per questo task, tipo `docs:`, ma senza toccare altro). Attendere review in chat prima di qualunque prompt di implementazione successivo (l'eventuale B2c dipende dalla decisione di Alfonso tra le opzioni discusse: estendere Apply-To per le view IR, spostare metaclasses/predicate/priority/exclusive dentro il tab IR, o lasciare la lacuna per ora).

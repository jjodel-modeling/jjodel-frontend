# Prompt Claude Code: undo in editor-v2, chiusura. L'autosave di layout diventa silenzioso

**Corsia veloce, un solo passaggio, effort high. Due file, nessuna critical zone.** Leggere a inizio
sessione: `CLAUDE.md`, `docs/prompts/claude_2026-08-24_1910_go_fase2_undo_editor_v2.md` (il GO
della Fase 2, con addendum), il report `docs/discovery/discovery_2026-08-24_undo_editor_v2_layout.md`
(§12 incluso), e `docs/claude-code-log.md`. Conflitti con CLAUDE.md: segnalare e fermarsi.

## COSA

La verifica visiva del commit `398a71293` (Alfonso, 2026-08-24 sera) ha dato: spostamento e
multi-selezione si disfano ma servono **due** ⌘Z; la rinomina di un elemento non si disfa mai, e
ogni ⌘Z o click sul pulsante **salva il progetto**; taglia, cambio di layout e progetto intonso
passano. Causa unica, letta in chat:

`scheduleLayoutSave` (`hooks/useLayoutAutosave.ts:50`) chiama `ProjectsApi.save`, che oltre a
serializzare **scrive nello store** il numero di versione incrementato
(`api/persistance/projects.ts:103-104`, `:114`: `SetFieldAction.new(dProject.id, 'version',
nextVersion, '', false)`). Quella scrittura arriva 1000 ms dopo il gesto, oltre la finestra di
coalescenza di 450 ms, e diventa un passo di undo a sé. Il primo ⌘Z disfa il bump di versione,
invisibile; e siccome l'osservatore dello stack (`EditorV2.tsx`, misura 2 del GO) chiama
`scheduleLayoutSave` dopo ogni undo, un secondo passo di versione viene spinto un secondo dopo:
premendo ⌘Z più lentamente di un secondo si disfa ogni volta solo l'ultimo bump, e il gesto vero
non si raggiunge mai. È il caso della rinomina.

Decisione di Alfonso (2026-08-24, 22:50): **la versione del progetto avanza solo al salvataggio
esplicito** (⌘S, toolbar). L'autosave di layout è un salvataggio silenzioso: serializza, non
incrementa la versione, non scrive nello store.

## DOVE e COME

1. **`api/persistance/projects.ts`, `ProjectsApi.save`** (`:94`): parametro opzionale
   additivo, `opts?: { silent?: boolean }`. Con `silent` vero: nessun `getNextVersionNumber`,
   `dProject.version` resta quello corrente, e la `SetFieldAction` di `:114` non viene emessa.
   Tutto il resto invariato: `lastModified`, i contatori, `compressedState`, `Offline`/`Online`,
   `U.isProjectModified = false`. Con `silent` assente, comportamento **byte-identico** a oggi:
   gli altri chiamanti (`SaveManager.ts:33`, `examples/StateMachine/index.ts`, sei siti) non
   cambiano e non si toccano.
2. **`components/editor-v2/hooks/useLayoutAutosave.ts:50`**: `ProjectsApi.save(project,
   { silent: true })`. Aggiornare il commento di testa del hook (dice che riusa il percorso di
   salvataggio esistente: vale ancora, con la clausola «senza bump di versione»).

Nessuna riga in `EditorV2.tsx`: l'osservatore dello stack resta com'è e, con il salvataggio
silenzioso, non alimenta più lo stack che osserva.

## Non-obiettivi (dichiarati)

- Il reducer, `isRelevantChangeCheck`, la finestra di 450 ms.
- L'attivazione di un viewpoint come passo di undo: dichiarata a registro dalla chat (R-UNDO-4),
  decisione core in backlog. Un ⌘Z dopo un cambio di viewpoint che riporta al viewpoint
  precedente è **atteso**.
- La granularità dell'undo su una rinomina digitata (se il pannello scrive a ogni tasto, un ⌘Z
  potrebbe togliere un carattere alla volta): si osserva nella prova 2 e si dichiara, non si
  risolve qui.

## Gate

`tsc` byte-identico alla baseline (33, con il solo spostamento di riga già noto in
`EditorV2.tsx`), vitest 1349 passed con le stesse 9 suite rosse, build exit 0, `check:docs`
(le tre entry rosse preesistenti restano affar di Alfonso).

## Verifica visiva (Alfonso, hard refresh)

1. Sposta un nodo, **un** ⌘Z: torna dov'era. ⌘⇧Z: torna spostato.
2. Rinomina un oggetto dal pannello, **un** ⌘Z: nome di prima su canvas e tree. ⌘⇧Z: nome
   nuovo. Se il nome torna indietro di un carattere per volta, segnalarlo: è la granularità
   dichiarata sopra, non un fallimento.
3. Multi-selezione: tre nodi spostati insieme, un ⌘Z, tornano tutti.
4. Ridimensiona, ⌘Z, reload: la taglia di prima persiste (il salvataggio silenzioso salva
   davvero).
5. Versione: annota la versione del progetto, fai quattro o cinque drag, aspetta qualche secondo:
   la versione non è cambiata. ⌘S: avanza di uno scatto.
6. Nessuna tempesta di salvataggi: dopo un solo spostamento, premi ⌘Z cinque volte lentamente
   (più di un secondo tra l'una e l'altra): il nodo torna al primo, poi non succede più niente,
   e in console o nel pannello rete c'è al più un salvataggio dopo il primo ⌘Z.
7. Cambia viewpoint, ⌘Z: torna al viewpoint precedente. Atteso (R-UNDO-4).

## Chiusura

Entry in `docs/claude-code-log.md` dopo l'esito di Alfonso, anche per il commit `398a71293` se
non ancora scritta (`Corregge: 2026-08-24 19:10`). Commit `fix(persistence): silent layout
autosave without version bump` con `git add` dei soli due file. Il file
`docs/prompts/claude_2026-08-24_1910_go_fase2_undo_editor_v2.md` è in staging dalla sessione
precedente: committarlo per pathspec in un commit `docs:` separato, prima del diff.

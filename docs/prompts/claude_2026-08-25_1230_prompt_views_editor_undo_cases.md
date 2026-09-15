# Prompt Claude Code: allineamento del fronte views-editor alla serie R-UNDO

**Corsia veloce, soli documenti, nessuna modifica al codice. Effort high.** Una discovery breve
con report obbligatorio in `docs/discovery/`, poi hard stop. Leggere a inizio sessione:
`CLAUDE.md`, `docs/decisions.md` (serie **R-UNDO-1..6**, nuova di oggi, e **R-LAY-19**),
l'addendum **§9** di `docs/discovery/discovery_2026-08-24_undo_reducer_rename.md` per intero
(contiene il formato reale dei delta e le sonde usate), e `docs/claude-code-log.md`. Conflitti con
CLAUDE.md o col registro: segnalare e fermarsi. Prima di tutto: `git status --short` e `git log
--oneline -12`, e riportarli nel report; nel frattempo la chat ha committato `4ef0db973`
(ritiro del kill-switch), `861101d61` (§9), `8694fd443` (R-UNDO), `0d26682a2` e `26ad1fc9c`.

## COSA

Da stamattina l'undo del D-layer in editor-v2 è **attivo** (R-UNDO-2): ogni dispatch entro i
450 ms di coalescenza del reducer viene fuso nel precedente con `U.objectMergeInPlace`, che è
superficiale e first-wins sulla chiave `idlookup`. R-UNDO-5 fissa la regola: **nessun gesto di
editor-v2 può affidarsi a due dispatch entro 450 ms con sotto-alberi `idlookup` diversi**; chi ne
ha bisogno passa da una `TRANSACTION` sola o dichiara il rischio. Il fronte views-editor
(`c740c5bcc`, `1ac33a4f5`, più le modifiche non committate) ha introdotto gesti che vanno
censiti contro questa regola. Un dato misurato da tenere presente: un delta di selezione
(`EditorV2 select`/`deselect`) **non è solo radice**; porta `_lastSelected` alla radice **e**
`idlookup[nodo].isSelected` (più `clonedCounter`) nel sotto-albero. «Radice ≠ idlookup, quindi
innocuo» non vale come argomento.

## DISCOVERY (read-only)

1. **Censimento dei gesti.** Per ogni ingresso e azione del fronte views-editor (almeno: «Create
   view for X» dal canvas e dalla toolbar, «Edit view · <nome>», `DockManager.openView`, la
   riapertura della rail collassata, e qualsiasi altro gesto aggiunto nei commit sopra o nel
   working tree) elencare, in ordine temporale, **ogni action dispatchata**: creatore o
   `SetFieldAction`/`SetRootFieldAction`, campo, dentro quale `TRANSACTION` (nome, file:riga),
   e se parte in modo sincrono, in `AFTER_UPDATE`/`AFTER_TRANSACTION`, o con un timer. Il
   numero di dispatch per gesto è il dato che conta.
2. **Verdetto per gesto.** Se un gesto produce un solo dispatch: conforme. Se ne produce due o
   più entro 450 ms: scrivere **cosa perde il delta fuso** (la chiave `idlookup` del primo vince
   per intero; le chiavi di radice assenti nel primo si aggiungono) e cosa farebbe un ⌘Z
   subito dopo. Classificare: innocuo (ciò che si perde è irrilevante o viene comunque
   rimosso dall'undo), da dichiarare (perdita visibile ma accettabile), o da chiudere con una
   `TRANSACTION` sola (perdita di stato reale). Per «Create view for X» l'ipotesi da verificare
   è: `DViewElement.new2` (idlookup) seguito da `_lastSelected` (radice + `isSelected` in
   idlookup): la fusione perde solo l'`isSelected` di un nodo che l'undo cancella comunque.
   Confermare o smentire sul codice.
3. **`irResolve.ts` e gli altri file non committati** (`Navbar.tsx`, `UnifiedEdge.tsx`,
   `ObjectNode.tsx`, `events/registry.ts`, `EditorV2.tsx/.scss`): per ciascuno, dire se la
   modifica introduce un **nuovo lettore di `state.viewpoint`** (vietato da R-LAY-19, la chiave
   si riceve come parametro o dal context) e se tocca la `signature` di `useIRView` o il
   `readCtx` (fronte R-UNDO-6: se sì, dirlo, perché quel fronte ha un prompt suo in arrivo e i
   due non devono incrociarsi).
4. **Il viewport in localStorage** con `getActiveLayoutKey()`: confermare che non c'è nessuna
   scrittura nello store (quindi nessun passo di undo) e che la chiave arriva dall'adapter, non
   da `state.viewpoint` letto direttamente.

**Report obbligatorio**: `docs/discovery/discovery_2026-08-25_views_editor_undo_cases.md`, con
obiettivo, file letti (path completi), la tabella gesto → dispatch → verdetto del punto 2, i
findings dei punti 3 e 4, rischi, domande aperte per Alfonso. Nessuna modifica al codice, anche
se un caso risultasse «da chiudere»: la chiusura è un prompt suo. Commit del solo report:
`docs: undo cases of the views-editor front against R-UNDO-5`. Commit di questo prompt:
`docs: prompt for the views-editor undo census`. Entry nel log (`Corregge: —`, `Causa: —`).
**Hard stop.**

## Dopo l'hard stop (non Claude Code)

La chat misura a runtime il caso «Create view for X» con le sonde del §9 (lettura del delta in
cima a ogni notifica dello store) e scrive sotto R-UNDO-5 la riga «casi dichiarati» con l'esito;
i casi «da chiudere», se ce ne sono, diventano prompt di corsia veloce.

## RIFERIMENTI

- `docs/decisions.md`: R-UNDO-1..6 (2026-08-25), R-LAY-19 (regola immediata sui lettori di
  `state.viewpoint`).
- `docs/discovery/discovery_2026-08-24_undo_reducer_rename.md`: §2.3 (fusione), §9 (misura e
  formato dei delta).
- `frontend/src/redux/reducer/reducer.ts:1277` (`isRelevantChangeCheck`, `mergeTolerance =
  U.UpdatingTimer * 1.5`), `U.objectMergeInPlace`.
- `frontend/src/redux/action/action.ts`: `TRANSACTION`, `COMMIT`, `AFTER_UPDATE`, `Action.fire`
  (con `hasBegun` le action vanno in `pendingActions` e partono a `FINAL_END` come
  `CompositeAction`: un dispatch solo).
- Fronte views-editor: `c740c5bcc`, `1ac33a4f5`, e il prompt
  `docs/prompts/claude_2026-08-25_0930_prompt_views_editor_fase2_ingressi.md`.

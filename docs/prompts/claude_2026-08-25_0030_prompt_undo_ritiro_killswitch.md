# Prompt Claude Code: messa a terra della sessione del 24/8 e ritiro del kill-switch dell'undo

**Corsia veloce, due parti in sequenza, effort high. Parte A: soli commit, nessun codice. Parte B:
un file, una riga.** Leggere a inizio sessione: `CLAUDE.md`, `docs/decisions.md` (R-LAY-19, nuova),
`docs/sessioni/sessione_2026-08-24_2.md`, l'addendum §8 di
`docs/discovery/discovery_2026-08-24_undo_reducer_rename.md`, e `docs/claude-code-log.md`.
Conflitti con CLAUDE.md o col registro: segnalare e fermarsi. Prima di tutto: se ci sono
`.git/*.lock` vuoti e orfani, verificare che nessun git giri e rimuoverli (li lascia il bridge di
Cowork, che non può cancellare file).

## COSA

La misura a runtime del 24/8 alle 23:55 (addendum §8, fatta dalla chat con il browser sul progetto
«test layout») ha stabilito che **l'undo del D-layer funziona e non corrompe lo stato**: rinomina
= un delta, ⌘Z via `Navbar` riporta il nome con riferimento nuovo e senza marcatori, la rinomina
successiva scrive D-layer e tree. Il sintomo della prova 2 (nome fermo sul canvas) è un difetto
**IR preesistente e indipendente dall'undo**: la `signature` di `useIRView` (`irResolve.ts:49-71`)
non contiene `DObject.name`, quindi il `readCtx` resta sull'`idlookup` stantio; fronte suo, prompt
a parte. Il kill-switch `5a75b2e09` era una precauzione contro una corruzione che non esiste e si
ritira.

## PARTE A: commit per pathspec, un commit per file, nessuna modifica al contenuto

1. `docs/discovery/discovery_2026-08-24_undo_reducer_rename.md` (addendum §8 della chat):
   `docs: runtime measurement addendum to the reducer undo discovery`.
2. `docs/decisions.md` (R-LAY-19 e header R-LAY): `docs: R-LAY-19 canvas-scoped viewpoint as
   layout slice 2`.
3. `docs/sessioni/sessione_2026-08-24_2.md`: `docs: session checkpoint 2026-08-24 (2)`.
4. `docs/prompts/claude_2026-08-24_1910_go_fase2_undo_editor_v2.md` **solo se** `git status` lo
   mostra ancora in staging o modificato; altrimenti niente.
5. Questo prompt: `docs: prompt for kill-switch retirement`.

Le modifiche estranee nel working tree (`StatusBar.*`, `TreeViewSidebar/*`) **non si toccano**:
non sono di questo fronte, restano come sono. Riportare in chat `git status --short` dopo i
commit.

## PARTE B: ritiro del kill-switch

`components/editor-v2/EditorV2.tsx`, `markUserInteracted`: la riga `if (!U.userHasInteracted)
U.userHasInteracted = true;` torna attiva. Il commento sopra viene riscritto in tre righe: il flag
è il gate dell'undo del D-layer (`isRelevantChangeCheck`, `reducer.ts:1277`); il kill-switch del
24/8 è stato ritirato dopo la misura dell'addendum §8 del report sul reducer; la sede resta il
primo pointerdown/keydown sul pannello, per non registrare le scritture programmatiche del boot.
Nessun'altra riga cambia.

Gate: `tsc` byte-identico alla baseline (33), vitest 1349 passed con le stesse 9 suite rosse,
build exit 0. Commit `fix(editor-v2): retire the undo kill-switch after the runtime measurement`,
`git add` del solo file.

## Verifica visiva (Alfonso, hard refresh, server sulla porta 3000)

Le sette prove del prompt delle 22:55 del 24/8, con una sola differenza: la **prova 2 si giudica
su tree e pannello proprietà**, non sul canvas, che resta fermo sulla rinomina finché il fronte IR
non è chiuso. Per ricordare: (1) spostamento, un ⌘Z, ⌘⇧Z; (2) rinomina dall'editor inline del
nodo, un ⌘Z: nome di prima nel tree e nel pannello; (3) multi-selezione; (4) taglia e reload;
(5) versione ferma sui drag, avanza con ⌘S; (6) cinque ⌘Z lenti dopo uno spostamento, un solo
salvataggio; (7) cambio viewpoint e ⌘Z: torna al viewpoint precedente, atteso finché R-LAY-19
non porta il viewpoint di tela fuori dal D-layer.

## Chiusura

Entry nel log per il commit della Parte B con `Corregge: 2026-08-24 23:30` e `Causa: (c)`
(la lettura statica aveva previsto una corruzione che la misura ha smentito). Le righe R-UNDO le
scrive la chat dopo l'esito delle prove.

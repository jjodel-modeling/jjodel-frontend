# Prompt Claude Code: undo in editor-v2, kill-switch immediato e discovery sul reducer

**Due parti in sequenza. Parte A: corsia veloce, un file, un commit, subito. Parte B: discovery
read-only sul core, report obbligatorio in `docs/discovery/`, hard stop.** Effort xhigh per la B.
Leggere a inizio sessione: `CLAUDE.md`, i prompt e i GO del 2026-08-24 sull'undo (`_1845_`,
`_1910_`, `_2255_`), il report `docs/discovery/discovery_2026-08-24_undo_editor_v2_layout.md`,
e `docs/claude-code-log.md`.

## COSA

Verifica visiva di `952d3cb94` (Alfonso, 2026-08-24, 23:20): sei prove su sette passano (un solo
⌘Z per spostamento e multi-selezione, taglia persistita, versione ferma sui drag e avanzata da
⌘S, nessuna tempesta di salvataggi). La prova 2 fallisce in modo grave: **dopo una rinomina di
un oggetto e un ⌘Z, il nome non torna indietro e da quel momento le scritture successive
sull'attributo non si riflettono più né sul canvas né sul tree view**. Il tree non passa da
editor-v2: il difetto è nello stato, cioè nel reducer. Con `U.userHasInteracted` sempre falso
nessuno l'aveva mai visto, perché lo stack era sempre vuoto: alzando il flag in editor-v2
(`398a71293`) abbiamo esposto un difetto latente del D-layer undo su una modifica non
geometrica. RC-8: riprodotto da un umano, è un difetto.

## PARTE A: kill-switch (subito, un commit)

`components/editor-v2/EditorV2.tsx`, `markUserInteracted`: non alzare più `U.userHasInteracted`.
Non cancellare la funzione né i due handler in cattura: il corpo diventa un no-op con un
commento che dice perché (D-layer undo corrompe lo stato su una rinomina, prova 2 del
2026-08-24, report della Parte B) e che rimanda a questo prompt. Effetto: lo stack del D-layer
resta vuoto, ⌘Z e i pulsanti tornano no-op (i pulsanti sono già guardati sullo stack), il
salvataggio silenzioso resta. Gate: `tsc` byte-identico, vitest 1349 con le stesse 9 rosse,
build 0. Commit `fix(editor-v2): do not raise userHasInteracted until the D-layer undo is
fixed`, `git add` del solo file. Entry nel log. **Poi la Parte B, nella stessa sessione.**

## PARTE B: discovery read-only sul D-layer undo

Report: `docs/discovery/discovery_2026-08-24_undo_reducer_rename.md`. Nessuna modifica al
codice. Contenuto minimo, con citazioni `file:riga`:

1. **Cosa scrive una rinomina.** Percorso dal pannello proprietà (o dal tree) fino allo store
   per `name` di un `DObject` e di un `DClass`: quali `SetFieldAction`, in quante transazioni,
   con quali campi derivati (indici per nome, `ClassNameChanged`, `VIEWS_RECOMPILE_*`, cache di
   proxy). Se il pannello scrive a ogni tasto, dirlo: conta per la granularità e per il merge.
2. **Come viene registrato il delta.** `reducer.ts:1198-1265`: `Uobj.objectDelta(ret, oldState,
   true, false)`, i marcatori interni del formato (`__jjObjDiff`, `__jjObjDiffIsArr`,
   `__jjisEmpty`, chiavi `_-`), e la fusione con i delta successivi non rilevanti
   (`_lastSelected`, `dragging`, `contextMenu` vengono **fusi** nel delta precedente da
   `U.objectMergeInPlace`, `:1246`, con `mergeRecompileArr` disattivato da un `return` a
   `:1225`). Quale forma ha il delta di una rinomina dopo una selezione o un click.
3. **Come viene applicato all'undo.** `undo()` a `:1319-1340`: `Uobj.applyObjectDelta(state,
   delta, false)` e il `delta2` per il redo. Leggere `Uobj.applyObjectDelta` e `objectDelta`
   (`common/Uobj*`): cosa fa il terzo argomento `false` (clona o muta?), come tratta stringhe,
   array di puntatori e i marcatori del punto 2. Ipotesi da verificare, non da assumere:
   (a) lo stato dopo l'undo condivide riferimenti con quello di prima e i subscriber non vedono
   il cambiamento; (b) l'undo lascia nello stato un marcatore del formato delta che le scritture
   successive non sovrascrivono; (c) l'undo ripristina un indice derivato (nome → id) a un valore
   stantio e le viste risolvono per nome. Per ciascuna: coerente o no con il sintomo (nessuna
   reazione alle scritture successive, sul tree come sul canvas), e come si discrimina.
4. **`VIEWS_RECOMPILE_all`** (`:1147`): chi lo consuma, se editor-v2 o il tree lo leggono, e se
   un valore array al posto di `true` cambia qualcosa.
5. **Il classico.** Il D-layer undo è raggiungibile nel renderer classico dopo un drop
   (`MetamodelTab.tsx:164`): il difetto vale anche lì? Lettura statica; la prova a schermo è di
   Alfonso, se il report la ritiene utile, con protocollo scritto (rinomina nel classico dopo un
   drop, ⌘Z, poi una seconda rinomina).
6. **Procedura di cattura a runtime per Alfonso**, senza codice aggiunto se possibile: se lo
   store è esposto su `window` (cercare `windoww`, `window.store`, `Debug`), i comandi da
   incollare in console prima e dopo il ⌘Z per confrontare `idlookup[id]` (stringificato) e
   l'identità dei riferimenti. Se non è esposto, dire cosa servirebbe (una riga dev-only,
   proposta e non applicata).
7. **Perimetro del rimedio.** Se la causa è in `Uobj` o nel reducer, è core: il report espone
   le opzioni senza sceglierle, con stima di diff e rischio per ciascuna, incluse
   (i) correggere l'applicazione del delta, (ii) registrare i delta in una forma diversa per i
   campi stringa, (iii) tenere il D-layer undo spento in editor-v2 e tornare a una storia di
   sessione per la sola geometria (il design A1 del prompt delle 18:45, che qui non era
   praticabile per la cattura di `Navbar` ma diventa la scelta se il core non si tocca).

**Hard stop: report committato ed esposto in chat. Nessuna Parte C senza GO.**

## Non-obiettivi

Toccare il reducer, `Uobj`, `Navbar`; rimuovere gli handler in cattura o l'osservatore dello
stack; il salvataggio silenzioso (resta, è giusto a prescindere).

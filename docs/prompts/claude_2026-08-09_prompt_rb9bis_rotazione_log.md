# Prompt Claude Code: R-B9-bis a verbale + rotazione del log

**Nome del documento prompt**: 2026-08-09 22:43
**Tipo**: docs (due commit solo-docs, bisecabili)
**Branch**: `alfonso-frontend-jjtl`
**Vincolo generale**: CLAUDE.md è la fonte di verità; se questo prompt lo contraddice, segnala il conflitto e fermati. Leggi `docs/claude-code-log.md` a inizio sessione come da convenzione.

## Contesto

Il round di chiusura delle voci 5 e 6 è completo: locale e origin sono allineati a `3fdb4c14f`, zero commit ahead. Restano due debiti amministrativi:

1. Il principio **R-B9-bis**, emerso dalla chiusura di irValidate (`1cee0e252`), non è ancora a verbale in `docs/decisions.md`.
2. `docs/claude-code-log.md` ha superato di 3 entry la soglia di rotazione (20).

Nel working tree sono attesi e NON vanno toccati: 2 file CSS della serie U modificati non committati e 2 path docs non tracciati. Niente `git add .` in nessun passo: solo i file elencati sotto, aggiunti per nome.

## Verifica d'ingresso (hard stop se fallisce)

1. `git log --oneline origin/alfonso-frontend-jjtl..HEAD` → attesi **0 commit**. Se non è 0, fermati e riporta in chat.
2. `git status --porcelain` → attese solo le voci del residuo noto (2 CSS serie U modificati, 2 path docs non tracciati). Qualunque altra voce: fermati e riporta.

## COSA — Commit 1: R-B9-bis in decisions.md

**File toccato**: solo `docs/decisions.md`.

1. Leggi il file intero. Individua la voce R-B9 e il formato delle entry (id, data, struttura, lingua). Se R-B9 non esiste nel registro o il formato è ambiguo: **HARD STOP**, riporta in chat senza scrivere nulla.
2. Aggiungi la voce R-B9-bis nella posizione coerente col registro (adiacente a R-B9 o dove il formato colloca le voci derivate), adattando al formato esistente questo contenuto normativo, senza alterarne il significato:

   > **R-B9-bis** (2026-08-09, dalla chiusura irValidate, commit `1cee0e252`). Le regole di validazione dell'IR vivono nel percorso di authoring (`validateIR`, chiamato dai soli quattro pannelli di authoring), mai nel percorso di render (`compile*`): il render resta permissivo verso i dati già persistiti, l'authoring applica il vocabolario. Ogni nuova regola di validazione IR va collocata giudicando il caso con questo criterio (authoring-time vs render-time), non per analogia col primo pattern incontrato nel codebase. Precedente: la regola sul routing (R-B9) innestata in `compileEdgeView` avrebbe scartato in silenzio le view già persistite con routing `''` che oggi rendono ortogonali (`UnifiedEdge.tsx:142`); in `validateIR` blocca i nuovi valori invalidi senza toccare il pregresso. Vocabolario unico esportato: `VALID_ROUTING_VALUES`.

   Regole di scrittura: niente em dash, niente filler. Non toccare altre voci del file, non rimuovere placeholder esistenti.
3. `npm run check:docs` → atteso 2/2 coi due warning noti. Se fallisce: fermati e riporta.
4. `git add docs/decisions.md`, poi commit: `docs: record R-B9-bis in decisions.md`

## COSA — Commit 2: rotazione del log (con l'entry di questo task)

**File toccati**: solo `docs/claude-code-log.md` e `docs/claude-code-log-archive.md`.

1. Aggiungi a `docs/claude-code-log.md` l'entry di questo task nel formato standard (data, tipo `docs`, prompt in una riga, file toccati, esito, nome documento prompt "2026-08-09 22:43"). Rispetta l'ordine esistente del file: se le entry sono in ordine cronologico inverso l'entry va in testa, se cronologico va in coda.
2. Conta le entry (blocchi che iniziano con `## `). Mantieni nel file attivo solo le **20 più recenti**; sposta tutte le più vecchie in `docs/claude-code-log-archive.md`, byte per byte, preservando l'ordine cronologico dell'archivio. Se l'archivio non esiste, crealo con un'intestazione minima (`# Claude Code log (archivio)` più una riga che rimanda al file attivo).
3. Verifica di conservazione: file attivo con esattamente 20 entry, archivio con tutte le entry rimosse, conteggio totale (attivo + archivio) invariato rispetto a prima della rotazione più l'entry nuova. Nessuna entry riformattata.
4. `npm run check:docs` → atteso 2/2 coi due warning noti.
5. `git add docs/claude-code-log.md docs/claude-code-log-archive.md`, poi commit: `docs: rotate claude-code-log entries beyond 20 to archive`

## Push (con guardia)

1. `git log --oneline origin/alfonso-frontend-jjtl..HEAD` → attesi **esattamente 2 commit**, con i messaggi esatti dei due commit qui sopra. Numero o messaggi diversi (commit estranei, commit mancanti): **HARD STOP**, riporta senza pushare.
2. `git status --porcelain` → di nuovo solo il residuo noto. Altrimenti **HARD STOP**.
3. `git push` semplice sul branch corrente (nessun force, nessun'altra ref, nessun tag).
4. Riporta in chat: range pushato (`vecchioHEAD..nuovoHEAD`), conteggio entry attive e archiviate, esito dei due `check:docs`.

## Cosa NON fare

- Non toccare i 2 CSS della serie U né i 2 path docs non tracciati.
- Non modificare file sorgente: il task è solo-docs.
- Nessun refactoring opportunistico: niente riformattazione di entry esistenti del log, niente ritocchi ad altre voci di decisions.md.
- Niente `git add .`, mai.

## RIFERIMENTI

- `contesto_progetto.md`, consolidamento del 2026-08-09 notte: round chiuso, tip `3fdb4c14f`, residuo working tree censito.
- Chiusura irValidate: commit `1cee0e252` (regola in `validateIR`, `VALID_ROUTING_VALUES` esportata, quattro test verdi).
- R-B9: vocabolario routing `orthogonal|straight|curved` (voce 3, commit `7450eb256`).
- Precedente di formato per i micro-commit sul registro: `e9e6d1ccd` (D-4-9 + nota Select).
- Convenzione di rotazione del log: CLAUDE.md e regole di progetto (soglia 20 entry, archivio in `docs/claude-code-log-archive.md`).
- Precedente di metodo per il pre-push: `git log --oneline origin/alfonso-frontend-jjtl..HEAD` come fonte primaria, mai ricostruzione dalla memoria della chat.

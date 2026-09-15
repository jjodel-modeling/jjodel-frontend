# Prompt Claude Code: rotazione standard del log a 20 entry attive

**Nome del documento prompt**: 2026-08-10 20:00
**Tipo**: docs (un solo commit, solo-docs)
**Branch**: `alfonso-frontend-jjtl`
**Vincolo generale**: CLAUDE.md è la fonte di verità; se questo prompt lo contraddice, segnala il conflitto e fermati. Leggi `docs/claude-code-log.md` a inizio sessione come da convenzione.
**Vincolo di chiusura**: **niente push**. Il task finisce al commit. Il push lo decide Alfonso in un passo separato.

## Contesto

`docs/claude-code-log.md` ha superato la soglia di rotazione: alla chiusura della sessione precedente risultava a **22 entry attive** contro le 20 di soglia. Aggiungendo l'entry di questo task si arriva a 23, quindi vanno archiviate le **3 più vecchie** (il numero esatto va ricontato sul file, non assunto da questo prompt).

Sul branch è atteso **un solo commit ahead di origin**: `4d215ff0e` (C9.1, token entity). Questo task ne aggiunge un secondo e si ferma lì, senza pushare né l'uno né l'altro.

Nel working tree può esserci residuo noto non committato (file CSS della serie U, path docs non tracciati). Non va toccato. Niente `git add .` in nessun passo: solo i due file elencati sotto, aggiunti per nome.

## Verifica d'ingresso (hard stop se fallisce)

1. `git log --oneline origin/alfonso-frontend-jjtl..HEAD` → atteso **esattamente 1 commit**, `4d215ff0e`. Numero o sha diversi: fermati e riporta in chat senza scrivere nulla.
2. `git status --porcelain` → attese solo voci di residuo noto (CSS serie U modificati, path docs non tracciati). Qualunque file sorgente inatteso in stage o modificato: fermati e riporta.

## COSA

Un solo commit, due file toccati: `docs/claude-code-log.md` e `docs/claude-code-log-archive.md`. Nessun altro file, nessun sorgente.

## DOVE

- File attivo: `docs/claude-code-log.md`
- Archivio: `docs/claude-code-log-archive.md`

## COME

### 1. Entry di questo task nel log attivo

Aggiungi a `docs/claude-code-log.md` l'entry di questo task nel formato standard: data, tipo `docs`, prompt riassunto in una riga, file toccati, esito, **Nome del documento prompt**: `2026-08-10 20:00`.

Rispetta l'ordine esistente del file: se le entry sono in ordine cronologico inverso l'entry va in testa, se cronologico va in coda. Non dedurre l'ordine dalla prima entry: guardalo su almeno tre entry consecutive.

### 2. Determinare il progressivo del lotto

Leggi `docs/claude-code-log-archive.md` **prima di scrivere**.

- Se l'archivio numera i lotti (intestazioni tipo «lotto N», o equivalente), **ricava N dal file**: il nuovo lotto è l'ultimo progressivo presente più uno. Non assumere che sia il ventesimo: il numero lo detta l'archivio, non questo prompt.
- Se l'archivio non ha numerazione di lotti, **non introdurla**: appendi le entry archiviate seguendo esattamente la convenzione già in uso nel file.
- Se l'archivio non esiste, crealo con un'intestazione minima (`# Claude Code log (archivio)` più una riga che rimanda al file attivo) e, in quel caso soltanto, parti dal lotto 1.

Se il formato dell'archivio è ambiguo o incoerente fra le sue parti: **HARD STOP**, riporta in chat senza scrivere.

### 3. Rotazione

1. Conta le entry del file attivo (blocchi che iniziano con `## `) **dopo** l'aggiunta al passo 1.
2. Mantieni nel file attivo solo le **20 più recenti**. Sposta tutte le più vecchie nell'archivio, **byte per byte**, preservando l'ordine cronologico dell'archivio.
3. Nessuna entry va riformattata, riscritta, accorciata o «corretta» nello stile durante lo spostamento. Il testo che esce dal file attivo entra nell'archivio identico.

### 4. Verifica di conservazione

- File attivo: **esattamente 20 entry**.
- Archivio: contiene tutte e sole le entry rimosse, più quelle che già conteneva.
- Conteggio totale (attivo + archivio) = conteggio prima della rotazione + 1 (l'entry nuova). Se non torna: **HARD STOP**, riporta senza committare.

### 5. Gate

`npm run check:docs` → atteso **2/2** coi due warning noti.

Nota: `frontend/scripts/gates/check-docs.ts` valida il **formato** delle entry, trattini lunghi delle intestazioni inclusi. Sono formato, non stile: non vanno «corretti» applicando le regole di scrittura dei documenti. Se il gate fallisce, il problema è nella struttura di ciò che hai scritto, non nella punteggiatura da normalizzare.

### 6. Commit e stop

```
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: rotate claude-code-log entries beyond 20 to archive"
```

Poi **fermati**. Non pushare, non aprire altri task.

Riporta in chat: numero del lotto usato (e da dove l'hai ricavato), quante entry archiviate, conteggio attivo/archivio prima e dopo, esito di `check:docs`, sha del commit e conferma che i commit ahead di origin sono ora 2.

## Cosa NON fare

- **Niente push.** Nessun `git push`, nessun force, nessun tag.
- Non toccare il residuo del working tree (CSS serie U, path docs non tracciati).
- Non modificare file sorgente: il task è solo-docs.
- Niente `git add .`, mai.
- Nessun refactoring opportunistico: niente riformattazione di entry esistenti, niente riordino, niente normalizzazione di trattini o maiuscole nel log o nell'archivio.
- Non inventare una numerazione di lotti se l'archivio non ce l'ha.

## RIFERIMENTI

- Convenzione di rotazione: CLAUDE.md e regole di progetto (soglia 20 entry attive, archivio in `docs/claude-code-log-archive.md`).
- Precedente identico di metodo: `claude/2026-08-09_prompt_rb9bis_rotazione_log.md`, commit 2 («rotazione del log»). Da lì vanno riusati i passi di conteggio e la verifica di conservazione; **non** il blocco push, che qui non si applica.
- Ultima rotazione eseguita: commit `569f787` (chiusura Slice C).
- Stato d'ingresso: `claude/sessione_CORRENTE.md`, sessione 2026-08-10_3 — ahead di un solo commit `4d215ff0e`, log attivo a 22 entry, rotazione dichiarata dovuta.
- Gate: `frontend/scripts/gates/check-docs.ts`, atteso 2/2 coi due warning noti.

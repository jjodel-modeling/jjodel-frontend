# Prompt — §6.1 di chiusura: otto entry dalle inbox al log, checkpoint del 3/9, stato di EGO1

**Nome del documento prompt**: 2026-09-03 11:43
**Tipo**: docs (nessun file applicativo)
**Effort**: medium (task documentale fuori dalla critical zone)

Leggi `CLAUDE.md` (blocco NON-NEGOTIABLE, §6.1, §6.4) e `docs/PROTOCOL.md` (P9 con la regola
log-inbox e RC-13-bis, P10) prima di iniziare. Il precedente da imitare è la entry
`## 2026-09-02 — docs(log): §6.1 chiusura batch VER1 / UNQ1-C6` in testa a
`docs/claude-code-log.md`: stesso tipo di giro, stessa disciplina.

## COSA

Chiudere il batch del 2 settembre (corsie BOOT1, VIEW1, VER2, SAVE2, DOC2) a repo fermo:
spostare le otto entry dalle cinque inbox al log attivo, cancellare le inbox, committare il
checkpoint di sessione del 3/9 già presente nel working tree, accertare lo stato di EGO1 in
indice e fermarsi. Nessuna rotazione: il log ha 9 entry più la nota di sanatoria, con le otto
nuove e quella di chiusura arriva a 18, sotto la soglia 40 di P9.

## DOVE

File toccati, e nessun altro:

- `docs/claude-code-log.md` (in scrittura)
- `docs/log-inbox/boot1.md`, `doc2.md`, `save2.md`, `ver2.md`, `view1.md` (cancellati con
  `git rm`)
- `docs/sessioni/sessione_2026-09-03_ricostruzione.md` (untracked, da aggiungere)
- `docs/prompts/claude_2026-09-03_1143_chiusura_61_inbox_e_checkpoint.md` (questo file,
  untracked, da aggiungere)

`_to_delete/` e `.claude/settings.local.json` sono untracked deliberati: non toccarli, non
aggiungerli.

## COME

### 0. Gate d'ingresso

```
GIT_OPTIONAL_LOCKS=0 git status --porcelain
GIT_OPTIONAL_LOCKS=0 git diff --cached --name-only
npm run check:docs
```

Atteso: HEAD `9a1090a82`; untracked i due file sopra più `_to_delete/` e
`.claude/settings.local.json`; in indice il solo revert della corsia EGO1 (vedi punto 4);
`check:docs` 3/3. Se in indice c'è altro, o se ci sono modifiche non staged a file tracciati,
**STOP** e riporta: un'altra corsia sta lavorando.

Se `find .git -maxdepth 3 -name '*.lock'` trova lock, spostali in `_to_delete/git-locks/`
(non cancellarli) prima di ogni comando git che scrive.

### 1. Le otto entry nel log (commit 1)

Le inbox contengono, per corsia:

| Inbox | Entry | Commit di codice |
|---|---|---|
| `doc2.md` | `fix(topbar): l'ultimo salvataggio si legge da ogni tab (DOC2)` | `defb3a112` |
| `doc2.md` | `docs: P11 e il censimento dei numeri normativi stantii (DOC2)` | `29322514d` |
| `doc2.md` | `docs(editor-v2): il docstring dell'autosave punta alla costante (DOC2)` | `1a4502151` |
| `save2.md` | `feat(editor-v2): l'ultimo salvataggio in testata al Data Manager (SAVE2)` | `93dd3a6bf` |
| `save2.md` | `fix(persistance): l'autosave si dirada e smette di notificare (SAVE2)` | `4bc765e85` |
| `boot1.md` | `fix(editor-v2): il gate dello Step 4 concorda con la passata che protegge (BOOT1)` | `4100d3d02` |
| `view1.md` | `fix(editor-v2): la create dal manager instanzia vertice e arco sul canvas` | `783a8245d` |
| `ver2.md` | `fix: il riallineamento di save non scrive piu' sull'oggetto vivo dello store` | `12e06b2ba` |

Sono tutte datate 2026-09-02. Vanno **verbatim**, senza emendare un carattere (RC-12), inserite
subito sotto la riga di regola e la nota di sanatoria in testa al file, sopra la entry
`§6.1 chiusura batch VER1 / UNQ1-C6`, nell'ordine della tabella (newest-first per commit di
codice, R-RAIL-45). Lo spostamento si fa leggendo ogni inbox e incollando il blocco nel log,
poi `git rm` delle cinque inbox. Niente file di appoggio in `/tmp`, niente copia del log
(RC-13-bis).

Verifica: `grep -c '^## ' docs/claude-code-log.md` deve dare 17 (9 + 8); `npm run check:docs`
3/3. Se Check B segnala una entry senza `Causa` nella forma `(x)`, **non correggerla**: la
entry resta verbatim e il difetto va nel campo `Notes` della entry di chiusura (punto 3).

```
git add -- docs/claude-code-log.md docs/log-inbox/
git commit -m "docs(log): §6.1, le otto entry del batch 2026-09-02 dalle inbox al log" -- docs/claude-code-log.md docs/log-inbox/
```

### 2. Checkpoint e prompt (commit 2)

```
git add -- docs/sessioni/sessione_2026-09-03_ricostruzione.md docs/prompts/claude_2026-09-03_1143_chiusura_61_inbox_e_checkpoint.md
git commit -m "docs(sessioni): checkpoint del 3/9, ricostruzione 28/8-2/9, e prompt §6.1" -- docs/sessioni/sessione_2026-09-03_ricostruzione.md docs/prompts/claude_2026-09-03_1143_chiusura_61_inbox_e_checkpoint.md
```

Non modificare il checkpoint: è il documento dell'architetto (HARNESS-DOCS §2).

### 3. Entry di chiusura (commit 3)

Una entry P9 in testa al log per questo giro, formato §21.2 di CLAUDE.md, con `Causa` nella
forma `(x)` (Check B). `Corregge: —`, `Layer Impact Report: not-required`, `Smoke visivo: non
applicabile`. In `Notes` (max 500 caratteri): il conteggio delle entry prima e dopo, l'esito
di `check:docs` a ogni commit, ed eventuali warning di Check B sulle entry spostate.

```
git add -- docs/claude-code-log.md
git commit -m "docs(log): entry della §6.1 del batch 2026-09-02" -- docs/claude-code-log.md
```

### 4. EGO1 in indice — HARD STOP, non chiudere

In indice c'è un revert della corsia EGO1 (un discovery report, circa -295 righe), constatato e
lasciato dalla chiusura VER1/C6. **Non fare `git reset`, non fare `git restore --staged`, non
committarlo.** Riporta:

```
GIT_OPTIONAL_LOCKS=0 git diff --cached --stat
GIT_OPTIONAL_LOCKS=0 git diff --cached | head -40
GIT_OPTIONAL_LOCKS=0 git log --oneline -3 -- <path del file in indice>
```

e fermati. La decisione (tenere il revert e committarlo con un messaggio suo, oppure
riportare l'indice a HEAD) è di Alfonso e arriva con un GO separato.

### 5. Report di chiusura

Diff dei tre commit (`git show --stat`), output di `check:docs` dopo il terzo commit, `git
status --porcelain` finale, e l'output del punto 4. Nessun push: lo fa Alfonso dal Mac.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9 (regola log-inbox, RC-13-bis, soglia di rotazione 40, formato entry)
- `CLAUDE.md` §6.1 (pathspec al commit), §6.4 (RC-13: docs e codice separati, niente stash,
  staged altrui intoccabile), §21.2 e §21.3 (formato e autovalutazione della entry)
- Precedente: entry `2026-09-02 — docs(log): §6.1 chiusura batch VER1 / UNQ1-C6`, commit
  `8875ddc7f`, `be35fde2e`, `f0b14430d`
- Checkpoint: `docs/sessioni/sessione_2026-09-03_ricostruzione.md`, sezione «Bug nuovi / Todo»
  punto 1

## Vincoli ribaditi

- Solo `docs/`. Se un comando ti porta a toccare un file sotto `frontend/`, fermati.
- `git add` e `git commit` sempre con pathspec esplicito (regola 17, §6.1). Mai `git add .`.
- Niente `git stash`, niente `git pull`/`rebase`/`merge`, niente backup su disco.
- Le entry spostate non si emendano, neanche per un typo.
- Log aggiornato a fine task (punto 3); questo prompt è già a terra in `docs/prompts/`.

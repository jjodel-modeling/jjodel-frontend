# Commit dell'archiviazione del Project Knowledge, e clausola P10

> **Nome del documento prompt**: 2026-08-15 01:40

Protocollo: `docs/PROTOCOL.md` — clausole P1..P9 applicabili.
Deroga: P4 non si applica (nessuna fase esplorativa: la discovery è già stata fatta e il suo esito è
in `docs/archivio/triage_kb_2026-08-15.md`).
Deroga: P7 non si applica (nessun file di codice toccato, la build non è influenzata).
Deroga: P8 non applicabile (smoke non ancora implementato, e comunque nessun cambio visivo).

Leggi `CLAUDE.md`. Branch: `alfonso-frontend-jjtl`.

## Contesto (non rifare l'analisi)

Il Project Knowledge del progetto era arrivato a 339 documenti. Una sessione Cowork ha eseguito la
bonifica: 60 documenti mai archiviati sono stati copiati nel repo secondo la mappa del triage
2026-08-09, 22 patch sono state scartate di proposito, e 335 documenti sono stati cancellati dal KB
dopo aver verificato che le copie nel repo fossero integre. Il resoconto completo è in
`docs/archivio/triage_kb_2026-08-15.md`, già scritto su disco.

Quei file sono **untracked**. Nessuno di essi è codice. Questo task li committa, aggiorna il log e
scrive una clausola nel protocollo.

## COSA — Commit 1: archiviazione

**Passo 0, obbligatorio.** Esegui `git status --porcelain docs` e leggi l'elenco. Attendi di trovare
untracked in `docs/prompts/`, `docs/ratifiche/`, `docs/sessioni/`, `docs/archivio/`,
`docs/archivio/artefatti/` e `docs/discovery/`, con nomi che iniziano per `claude_`, `discovery_`,
`triage_kb_` o `template-`.

**Se compare un file tracciato modificato, o un untracked che non rientra in questi schemi, fermati
e segnalalo.** Sul repo lavorano sessioni concorrenti: un file che non riconosci non è tuo.

Poi:

```
git add docs/prompts docs/ratifiche docs/sessioni docs/archivio docs/discovery
git status --porcelain --cached docs    # rileggi cosa hai messo in staging, prima di committare
```

Path di cartella espliciti, mai `git add .` (P6). Se lo staging contiene qualcosa che non era
nell'elenco del passo 0, svuotalo con `git restore --staged` e segnala.

Commit message:

```
docs(archivio): archive the remaining chat documents from the project knowledge
```

## COSA — Commit 2: clausola P10 nel protocollo

**File**: `docs/PROTOCOL.md`, un solo file.

Aggiungi in coda alle clausole, subito dopo `## P9 — Prompt log` e **prima** della riga `---` che
precede la «Nota di implementazione per P8», questa sezione, verbatim:

```markdown
## P10 — Dove vivono i documenti

Il Project Knowledge tiene lo stato corrente, il repo tiene la storia. Sei documenti nel KB, per
nome: `contesto_progetto.md`, `sessione_CORRENTE.md`, `spec_attive.md`, `INDICE_ARCHIVIO.md`,
`template-ir-authoring`, `template-task-visivi`.

Tutto il resto si salva in `docs/`: prompt in `docs/prompts/`, memo di ratifica in
`docs/ratifiche/`, checkpoint in `docs/sessioni/`, discovery in `docs/discovery/`, materiale di
lavoro in `docs/archivio/`, allegati non testuali in `docs/archivio/artefatti/`. Il prefisso è
`claude_` ovunque tranne che per i discovery report, che seguono il naming di P4.

Archiviare non è ripulire: la copia nel repo e la cancellazione dal KB sono due passi distinti, e
un documento lasciato in entrambi i posti continua a competere in retrieval con la propria versione
più recente. Storia in `docs/archivio/triage_kb_2026-08-15.md`.
```

Poi aggiorna la riga di versione in testa al file da `Versione: 1.0 (2026-08-01)` a
`Versione: 1.1 (2026-08-15)`, e la riga da mettere in testa ai prompt da `clausole P1..P9` a
`clausole P1..P10`.

Non toccare nient'altro di `PROTOCOL.md`. Non riformattare le clausole esistenti.

Commit message:

```
docs(protocol): add clause P10 on where documents live
```

## COSA — Commit 3: entry di log

**File**: `docs/claude-code-log.md`, in testa secondo l'ordine newest-first per giorno (R-RAIL-45).

```
## 2026-08-15 — docs: archive chat documents and add protocol clause P10
**Prompt**: commit dell'archiviazione del Project Knowledge (60 documenti) e clausola P10 in PROTOCOL.md
**Files touched**: docs/prompts/*, docs/ratifiche/*, docs/sessioni/*, docs/archivio/*, docs/discovery/*, docs/PROTOCOL.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: il KB è passato da 339 documenti a 6; le 22 patch di luglio sono state scartate di proposito
**Prompt document name**: 2026-08-15 01:40
```

Commit message:

```
docs(log): log the knowledge base cleanup
```

Verifica che `npm run check:docs` passi. Se il gate rifiuta l'entry, correggi il formato senza
cambiare la sostanza e riportalo.

## HARD STOP

Dopo il Commit 3, **fermati**. Non pushare. Riporta:

1. l'elenco esatto dei file entrati nel Commit 1, per cartella e con il conteggio;
2. il diff di `docs/PROTOCOL.md`;
3. l'esito di `check:docs`;
4. `git log --oneline -4` e `git status --porcelain`.

## NON FARE

- **Non ruotare il log.** Ha 34 entry contro una soglia di 20, ed è un debito noto, ma sullo stesso
  file lavorano sessioni concorrenti. La rotazione è un task a sé, da fare quando il repo è fermo.
- **Non toccare `_to_delete/`**, e non provare a cancellarlo: dal bridge non si cancella, e da qui
  non serve.
- **Non aggiungere `.claude/settings.local.json` a `.gitignore`** in questo task: è un todo aperto,
  ma non è questo il commit.
- Non toccare alcun file sotto `frontend/`.

## RIFERIMENTI

- `docs/archivio/triage_kb_2026-08-15.md`: resoconto della bonifica, già su disco.
- `docs/archivio/triage_kb_2026-08-09.md`: il triage precedente, che definì la mappa di
  archiviazione qui applicata.
- `docs/PROTOCOL.md`: clausole P1..P9, P6 per le regole di commit, P9 per il formato del log.
- `CLAUDE.md` §21.2 e §21.3: formato dell'entry di log e semantica dei campi di autovalutazione.

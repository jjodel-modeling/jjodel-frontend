# Prompt Claude Code — Archivio KB nel repo (2026-08-09)

## COSA

Creare la struttura di archivio documentale in `docs/` e committare i file migrati dal Project Knowledge di Claude.ai. Nessuna modifica al codice sorgente. Task in corsia veloce (RC-3): fuori dalla critical zone, nessuna discovery necessaria.

## DOVE

Repo: `jjodel-frontend`, branch `alfonso-frontend-jjtl`.

Cartelle da creare (se non esistono già):

```
docs/prompts/
docs/sessioni/
docs/ratifiche/
docs/spec/
docs/spec/parcheggiate/
docs/archivio/
docs/archivio/artefatti/
```

`docs/discovery/` esiste già per protocollo: non toccarla, non spostarci nulla che non ci sia già.

## COME

Precondizione: Alfonso ha già copiato i file scaricati dal Project Knowledge nelle cartelle di destinazione secondo la mappa del manifest `triage_kb_2026-08-09.md`. Il tuo compito è verifica, igiene e commit; non decidi tu la collocazione dei file.

1. Verifica che le cartelle esistano e contengano file. Se una cartella prevista è vuota, segnala e prosegui: non è un errore bloccante.
2. Igiene duplicati, solo per `docs/discovery/` e `docs/spec/`: se un file in arrivo ha lo stesso nome di uno già presente, confronta con `diff`. Se identico, scarta la copia in arrivo. Se diverso, NON sovrascrivere: rinomina la copia in arrivo con suffisso `_kb` e segnala nel log. Nessuna fusione automatica.
3. Aggiungi un `README.md` di una riga in `docs/prompts/`, `docs/sessioni/`, `docs/ratifiche/` e `docs/archivio/` che dichiara il ruolo della cartella (esempio per prompts: "Prompt Claude Code eseguiti, archiviati dal Project Knowledge. L'esito è tracciato in docs/claude-code-log.md."). Stile: una o due frasi, niente filler.
4. Verifica in `decisions.md` che le decisioni delle ratifiche archiviate abbiano copertura. Non fare audit riga per riga: controlla per campionamento le tre ratifiche più recenti (2026-08-05_3, 2026-08-05_2, 2026-08-04 tab partizione). Se una decisione ratificata non compare in `decisions.md`, NON aggiungerla tu: segnala nel report finale con riferimento puntuale.
5. Commit con staging chirurgico, un concern per commit:
   - `docs: add documentation archive structure migrated from project knowledge` (cartelle, README, file archiviati)
   - Se hai rinominato duplicati: commit separato `docs: flag divergent duplicates from knowledge base import`
   - Usa `git add docs/prompts docs/sessioni docs/ratifiche docs/spec docs/archivio` (path espliciti). MAI `git add .` o `git add -A`.
6. `npm run build` NON necessario: nessun file sorgente toccato. Verifica solo che `git status` non mostri file inattesi fuori da `docs/` prima del commit.
7. Aggiorna `docs/claude-code-log.md` con l'entry standard (data, tipo docs, prompt ricevuto in una riga, file toccati come conteggio per cartella, esito).

## Hard stop

Al termine, riporta: conteggio file per cartella, eventuali duplicati divergenti rinominati, eventuali decisioni ratificate senza copertura in `decisions.md`. Nessun push: la decisione di push resta ad Alfonso.

## RIFERIMENTI

- Manifest di triage: `triage_kb_2026-08-09.md` (fornito da Alfonso insieme ai file)
- `CLAUDE.md` (fonte di verità sulle convenzioni; in caso di conflitto con questo prompt, segnala)
- `docs/claude-code-log.md` (leggere a inizio sessione)
- `decisions.md` (registro decisioni ratificate)

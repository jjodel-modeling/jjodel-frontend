# Prompt Claude Code: gate di identità del blocco protocollo + linter del claude-code-log

**Nome del documento prompt**: 2026-08-02 15:31
**Tipo**: chore (infrastruttura di gate)
**Modalità**: two-phase, discovery read-only con report obbligatorio, hard stop, poi implementazione scoped.

## Contesto

Il task precedente ha introdotto due campi nel formato entry di `docs/claude-code-log.md`, `Corregge` e `Causa`, replicando il blocco template in `CLAUDE.md`, `AGENTS.md` e `docs/PROTOCOL.md`. L'identità byte a byte del blocco fra `CLAUDE.md` e `docs/PROTOCOL.md` è stata dichiarata vincolo critico, ma oggi è garantita solo da un comando lanciato a mano una volta. Per la coppia `CLAUDE.md` / `AGENTS.md` esiste un generatore che riallinea; per la coppia con `PROTOCOL.md` non esiste niente.

Questo task rende il vincolo eseguibile: uno script nella batteria dei gate che fallisce se il blocco diverge, e che nello stesso passaggio valida i valori dei nuovi campi nel log. Un vocabolario chiuso senza enforcement resta chiuso per poche settimane.

Il task NON tocca lo smoke, NON tocca `frontend/scripts/smoke/states.ts`, NON riapre l'allowlist.

---

## FASE 1: discovery (read-only)

Nessuna modifica a file in questa fase, con la sola eccezione della creazione del discovery report.

### Domande a cui il report deve rispondere

1. **Infrastruttura di script**: path della cartella degli script di gate; come sono definiti `smoke` e `typecheck:scripts` in `package.json` (comando esatto, runtime usato, tsconfig di riferimento, glob dei file coperti). Un nuovo script `.ts` messo dove rientra automaticamente in `typecheck:scripts`?

2. **Ancore del blocco template**: prima e ultima riga del blocco in `CLAUDE.md` e in `docs/PROTOCOL.md`, con numeri di riga e testo verbatim; se il blocco è dentro un fence e con quale info string. Contare con grep quante volte l'ancora di inizio compare in ciascun file: se compare più di una volta, dirlo, perché cambia la strategia di estrazione.

3. **Nomi dei campi come sono atterrati**: riportarli verbatim, senza tradurli e senza normalizzarli. Servono tutti, non solo i due nuovi.

4. **Vocabolario di `Causa`**: elencare i valori ammessi esattamente come scritti in §21.3, e dire se §21.3 li dichiara chiusi o esemplificativi.

5. **Regola di compilazione di `Corregge`** come scritta oggi in §21.3: quale referente prescrive (descrizione libera, intestazione di entry, timestamp del documento prompt, altro) e quale valore sentinella prevede quando il task non corregge niente. **Se la regola atterrata prescrive un referente diverso dal timestamp del documento prompt, non modificarla: segnalare il conflitto nel report e fermarsi.** La decisione D1 della ratifica assume il timestamp come chiave, ma CLAUDE.md è fonte di verità e ha la precedenza.

6. **Stato del log**: `docs/claude-code-log.md` e `docs/claude-code-log-archive.md`, numero di entry, formato reale delle intestazioni, e presenza di entry che già deviano dal template (campi mancanti, ordine diverso, valori fuori vocabolario). Serve per calibrare il linter e per sapere quanto rumore produrrebbe se applicato retroattivamente.

7. **Generatore di AGENTS.md**: esiste, dove, come si invoca, è deterministico? Rigenerando in una copia temporanea, `AGENTS.md` in HEAD risulta byte-identica alla proiezione corrente di `CLAUDE.md`? Non sovrascrivere il file reale.

8. **Smoke skipped**: quali sono i due test skipped e perché. Costo zero, serve solo a chiudere una domanda aperta.

9. **Collisioni di nomi**: verificare con ricerca globale che il nome scelto per lo script npm e per il file non siano già in uso.

### Discovery report (OBBLIGATORIO)

Salvare il report in `docs/discovery/discovery_2026-08-02_gate_protocol_identity_log_linter.md`. Se la cartella non esiste, crearla. Contenuto minimo: obiettivo, file letti con path completi, findings, dipendenze e rischi, domande aperte.

L'hard stop di Fase 1 non è completo finché il report non è scritto su file. L'analisi in chat parte dal report salvato, non dal riassunto in sessione.

### HARD STOP

Fermarsi qui. Nessun file toccato oltre al report. Attendere il go-ahead.

---

## FASE 2: implementazione (solo dopo go-ahead)

### COSA

Uno script che esegue due check indipendenti, riporta l'esito di **entrambi** e poi esce non-zero se almeno uno fallisce. Non fail-fast al primo errore: un run deve dare il quadro completo.

**Check A, identità del blocco.** Estrae il blocco template da `CLAUDE.md` e da `docs/PROTOCOL.md` usando le ancore verificate in Fase 1 e confronta byte a byte. Fallisce se i due blocchi differiscono, se una delle due estrazioni è vuota, o se l'ancora di inizio compare più di una volta in uno dei due file. Le ultime due condizioni sono la guardia contro il falso positivo che il confronto manuale non copre: due estrazioni vuote sono identiche fra loro e passerebbero silenziosamente.

**Check B, linter del log.** Per ogni entry di `docs/claude-code-log.md` con data maggiore o uguale a 2026-08-02: i campi `Corregge` e `Causa` devono essere presenti; il valore di `Causa` deve appartenere al vocabolario chiuso; il valore di `Corregge` deve essere o il valore sentinella o un timestamp nel formato prescritto. Le entry con data anteriore alla soglia sono ignorate, senza warning: non si back-fillano e non devono generare rumore.

Sul bersaglio di `Corregge`: se il formato è malformato, errore. Se il formato è valido ma il timestamp non corrisponde al campo "nome del documento prompt" di nessuna entry nel log attivo o nell'archivio, warning non bloccante, perché l'entry bersaglio può essere legittimamente non loggata.

Messaggi azionabili in entrambi i check: file, entry (intestazione), campo, valore trovato, valori ammessi.

### DOVE

| File | Cosa cambia |
|---|---|
| nuovo script `.ts` nella cartella script di gate | il file nuovo, unico artefatto di codice |
| `package.json` | un nuovo script npm che lo invoca |
| `docs/PROTOCOL.md` | una riga di puntatore a §21.3 di CLAUDE.md per le regole di compilazione, **fuori dal blocco identico** |
| `CLAUDE.md` e `AGENTS.md` | il nuovo comando aggiunto alla batteria dei gate, **solo se esiste già una lista di gate**; se non esiste, non toccare i due file e segnalarlo |
| `docs/claude-code-log.md` | entry di questo task |

Nient'altro.

### COME (vincoli)

- Nessuna nuova dipendenza esterna. Solo standard library e il runtime già usato dagli altri script.
- Il puntatore in `docs/PROTOCOL.md` va **fuori** dal blocco template. Se finisce dentro, rompe esattamente il vincolo che questo task esiste per proteggere. Rieseguire il confronto dopo l'edit.
- Non duplicare le regole di §21.3 dentro `PROTOCOL.md`: un secondo punto di verità sarebbe un secondo punto di deriva, e il Check A copre solo il blocco template.
- Non rinominare campi, valori, script npm o classi esistenti.
- Non riformattare `CLAUDE.md`, `AGENTS.md`, `PROTOCOL.md` oltre a quanto elencato sopra. Zero refactoring opportunistico.
- Non toccare `frontend/scripts/smoke/` in nessun modo.
- Il linter legge il log e basta: non lo modifica, non lo riordina, non lo normalizza.
- Lo script deve rientrare in `typecheck:scripts`. Se la sua posizione naturale non ci rientra, aggiornare l'include del tsconfig degli script e dichiararlo nel report finale.

### Gate

- `npm run build` pulito
- `npx tsc --noEmit`: baseline 33, deve restare 33
- `npm run typecheck:scripts` pulito
- `npm run smoke` verde (atteso 10 passed / 0 failed / 2 skipped)
- il nuovo comando verde sul repo allo stato attuale

**Se il nuovo comando è rosso, non aggiustare il log o i documenti per farlo passare.** Riportare cosa fallisce e fermarsi: un gate rosso al primo run è un'informazione, e va letta prima di essere silenziata.

### Entry di log

Compilare `Corregge` e `Causa` secondo §21.3. Se nessun valore della tassonomia descrive un intervento di enforcement preventivo, **segnalarlo invece di forzare il valore più vicino**: la tassonomia è nuova e la sua copertura non è ancora provata sul campo.

### Commit

Hard stop prima del commit, per conferma di Alfonso. Poi `git add` dei soli file elencati nella tabella DOVE più il discovery report. Mai `git add .`, mai `git commit -a`. Controllare `git status` prima di committare: se in staging compare altro, de-stageare e ripartire.

Messaggio: `chore(gates): add protocol block identity check and log linter`

---

## RIFERIMENTI

- `CLAUDE.md` §21.3, fonte di verità sul formato entry e sui valori ammessi. In caso di conflitto con questo prompt, prevale CLAUDE.md e il conflitto va segnalato.
- `docs/PROTOCOL.md`, blocco template da mantenere byte-identico.
- Ratifica di chat: `ratifiche_2026-08-02_log_fields_corregge_causa.md` (decisioni D1 e D4 in particolare).
- Report del task precedente (introduzione di `Corregge` e `Causa`, restringimento allowlist smoke).
- Convenzione discovery report: `docs/discovery/discovery_<YYYY-MM-DD>_<descrizione_snake_case>.md`.

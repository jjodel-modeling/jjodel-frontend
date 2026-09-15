# Prompt Claude Code: manutenzione del log, rotazione del venticinquesimo lotto

Data: 2026-08-28 15:50. Branch `alfonso-frontend-jjtl`. Repo `~/jjodel`, root del repo come cwd.
Effort: high. Task documentale, nessun file applicativo.

Leggi `CLAUDE.md` per intero e `docs/PROTOCOL.md` P9 prima di iniziare. Leggi `docs/HARNESS-DOCS.md`
righe 255-275 (ordinamento e rotazione del log). Leggi il preambolo di
`docs/claude-code-log-archive.md` (dalla riga 1 alla prima intestazione `## 2026-`), che descrive i
lotti precedenti e il formato del paragrafo di lotto.

## COSA

Riportare `docs/claude-code-log.md` alla forma prevista da P9 e far tornare verde `npm run check:docs`
senza emendare nessuna entry. Tre interventi, in quest'ordine:

1. Rimuovere dal log attivo un blocco di 450 entry che l'archivio contiene già byte per byte, più un
   frammento orfano, entrambi reintrodotti dal merge `70e920492` (2026-08-24, `staging` in
   `alfonso-frontend-jjtl`).
2. Ruotare in archivio le entry con data di heading precedente al 2026-08-27 (venticinquesimo lotto),
   verbatim.
3. Rimettere le entry restanti in ordine newest-first per giorno (R-RAIL-45) e scrivere in testa al
   file la regola, così le sessioni smettono di appendere in coda.

Il gate passa a verde per rotazione, non per emendamento: le otto entry che oggi lo tengono rosso e
le tre che generano warning sono tutte datate fra il 2026-08-03 e il 2026-08-26 ed escono con il
lotto, come da decisione del 2026-08-17 (le violazioni pregresse escono col ciclo ordinario, §21.3
«no back-filling» resta in vigore, `check-docs.ts` non si tocca). Il taglio è per data ed è dovuto
da tempo (115 entry reali contro soglia 40); non è scelto per coprire quelle entry. Questo va
dichiarato nel paragrafo di lotto, come fece il ventitreesimo.

## DOVE

File toccati, e solo questi:

- `docs/claude-code-log.md`
- `docs/claude-code-log-archive.md`
- `docs/PROTOCOL.md` (una frase in P9, fuori dal blocco verificato byte a byte)

Nessun altro file. Non toccare `CLAUDE.md`, non toccare `frontend/scripts/gates/check-docs.ts`.
Gli script di supporto che scrivi (Python o Node) vivono in `/tmp`, non nel repo.

## GATE D'INGRESSO

Tutte e tre le condizioni, altrimenti hard stop e segnala:

1. Repo fermo: nessun'altra sessione Claude Code sta scrivendo sul working tree. Alfonso lo conferma
   nel messaggio con cui lancia questo prompt. Se `git log -1 --format=%h` cambia fra l'inizio e la
   fine del task, hard stop: la rotazione va rifatta da capo su repo fermo.
2. `git status --porcelain -- docs/claude-code-log.md docs/claude-code-log-archive.md docs/PROTOCOL.md`
   vuoto. Il resto del tree (cantiere instance-node, file untracked in `docs/`) si dichiara nella nota
   finale e non blocca.
3. Baseline del gate, da salvare in `/tmp/check-docs-before.txt`:
   `cd frontend && npm run check:docs > /tmp/check-docs-before.txt 2>&1; cd ..`
   Atteso: `1/3 check(s) passed, 3 warning(s)`, Check A PASS, Check B con 5 errori su 4 entry
   (tre `Corregge` in prosa del 2026-08-26 alle righe 68, 120, 133; `Corregge` e `Causa` assenti
   sull'entry del 2026-08-03 alla riga 7795), Check C con 4 errori (Notes di 617, 545, 3314, 583
   caratteri su entry del 2026-08-25, 2026-08-23, 2026-08-23, 2026-08-25). Se la baseline è
   diversa, hard stop: qualcuno ha toccato il log dopo la misura del 2026-08-28 15:45.

Misure di partenza da confermare: 565 intestazioni `^## 20` nel log attivo, 818 in archivio.

## COME

Lavora per intestazione, mai per numero di riga: le righe citate qui sono un aiuto per orientarsi e
valgono per HEAD `ee0eb3bdb`, ma il criterio di taglio è sempre il testo dell'heading. Sposta righe,
non riscriverle: ogni entry che cambia file deve arrivare byte per byte identica, e lo verifichi.

### Passo 1: verifica meccanica della duplicazione

Scrivi uno script in `/tmp` che spezza i due file in entry (un'entry va dall'heading `^## \d{4}-\d{2}-\d{2}`
alla riga prima dell'heading successivo, coda di righe vuote esclusa) e confronta.

Attese, tutte da confermare prima di cancellare qualsiasi cosa:

- Nel log attivo, il blocco che va dall'heading
  `## 2026-05-21 — fix: directional spread to separate paths and labels of mirrored edges`
  (riga 1149) fino alla riga prima dell'heading
  `## 2026-07-31 — refactor: contesto chat Jjodie come JSON jjodel-metamodel trimmed (pilota)`
  (riga 7775) contiene esattamente 450 intestazioni.
- Ognuna delle 450 esiste nell'archivio con lo stesso heading e corpo identico byte per byte.
- Nessuna entry del log attivo fuori da quel blocco ha un heading presente in archivio.
- Subito prima del blocco, in coda all'entry
  `## 2026-08-17 — docs: rotazione del log a 20 entry attive (ventitreesimo lotto)`, dopo il suo
  `**Prompt document name**: 2026-08-17 23:35`, ci sono quattro righe che non le appartengono:
  una riga `**Notes**: creato branch \`tree-editor#88\`; ...`, una riga
  `**Prompt document name**: 2026-05-25 HH:mm`, una riga vuota, una riga `---`. È la coda dell'entry
  `## 2026-05-25 — fix(tree-view): remove all tooltips from tree editor (issue #88)`, che l'archivio
  contiene per intero (verifica che la riga Notes orfana sia identica a quella dell'entry in archivio).

Se anche una sola attesa non torna (una entry in più o in meno, un corpo che differisce di un byte),
hard stop con il dettaglio. Non cancellare nulla.

### Passo 2: rimozione del blocco duplicato e del frammento orfano

Rimuovi dal log attivo le 450 entry del blocco e le quattro righe orfane. Niente va in archivio da
questo passo: c'è già. Verifica: 565 - 450 = 115 intestazioni nel log attivo, nessuna presente in
archivio, e l'entry della ventitreesima rotazione termina ora con la sua riga
`**Prompt document name**: 2026-08-17 23:35`.

### Passo 3: rotazione, venticinquesimo lotto

Criterio: resta nel log attivo ogni entry la cui data di heading è `>= 2026-08-27`; tutte le altre
vanno in archivio. Attese: 21 entry restano (1 nel blocco superiore, l'entry `fix(settings): il
modale Settings torna a 1120 di larghezza`; 20 nel blocco inferiore, 15 del 2026-08-27 e 5 del
2026-08-28), 94 si spostano.

Perché per data di heading e non per posizione o per «Prompt document name»: il file attivo ha oggi
due ordini in parallelo, un blocco in testa prepended (2026-08-27 in giù fino al 2026-08-17) e una
coda appended (2026-08-25 in su fino al 2026-08-28), quindi la posizione non è un ordine; e i
«Prompt document name» portano suffissi descrittivi senza ora, sentinelle e forme in prosa, quindi
non discriminano. La data di heading è l'unico campo presente e ben formato su tutte le 115 entry.

Le 94 si appendono in coda all'archivio, verbatim, nell'ordine in cui stanno nel file attivo: prima
il blocco superiore (dall'entry `## 2026-08-26 — fix(editor-v2): il gruppo comandi è solo zoom, ...`
fino alla ventitreesima rotazione inclusa), poi le tre entry Jjodie (2026-07-31, 2026-08-01,
2026-08-03), poi le entry 2026-08-25 e 2026-08-26 del blocco inferiore. Fra l'ultima entry
dell'archivio e la prima appesa lascia la stessa spaziatura che l'archivio usa già fra entry.

Misura e dichiara le inversioni: per ogni entry tenuta con un «Prompt document name» a timestamp
ben formato, confronta con il timestamp più recente fra le entry spostate. Ne conosco almeno una: la
tenuta `feat(ir): la riga reference verso un singleton si assume ...` porta `2026-08-26 18:20`,
mentre fra le spostate c'è `2026-08-26 20:17`. Elencale tutte nel paragrafo di lotto: sono entry
scritte il giorno dopo il prompt che chiudono, non un errore di taglio.

Controlla, a titolo di verifica e non come criterio, che le undici entry segnalate dal gate nella
baseline (otto errori, tre warning) stiano tutte fra le 94 spostate.

Paragrafo di lotto nel preambolo dell'archivio, in inglese come i precedenti, dopo il paragrafo
«Twenty-fourth batch». Deve dire, in questo ordine: il numero (twenty-fifth), la data, il criterio
(heading date, cutoff 2026-08-27) e perché posizione e prompt name non erano usabili; i conteggi
(active 565 to 22, archive 818 to 912, of which 450 removed as already archived and 94 moved);
la causa della duplicazione (`70e920492`, merge of `staging`, re-imported 450 entries already
archived plus the orphan tail of the 2026-05-25 entry, all verified byte-identical and dropped, not
moved); le tre entry Jjodie che arrivano da `staging` e che l'archivio non aveva; le inversioni
misurate; che le otto entry che tenevano rosso il gate escono verbatim con il lotto per la decisione
del 2026-08-17 e che il taglio è per data e dovuto, non scelto per coprirle; e una riga che dichiara
che la ventitreesima rotazione esce con questo lotto, mentre il paragrafo del ventiquattresimo la
indicava come «first moved» (restò nel file attivo: il dato era impreciso, non lo si corregge).
Stile: frasi brevi, niente em dash nel testo che scrivi.

### Passo 4: ordine del log attivo e regola in testa

Le 21 entry tenute vanno in ordine newest-first per giorno (R-RAIL-45): prima le 5 del 2026-08-28,
poi le 16 del 2026-08-27. Dentro lo stesso giorno mantieni l'ordine relativo che le entry hanno oggi;
l'entry del blocco superiore (`fix(settings): il modale Settings torna a 1120`) diventa la prima del
gruppo 2026-08-27. Un'entry, una riga vuota, l'entry successiva: come il resto del file.

Sotto la riga `# Claude Code Session Log`, dopo una riga vuota, aggiungi questa riga (in inglese,
è materiale pubblico del repo), poi una riga vuota:

`Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.`

Il parser del gate ignora tutto ciò che precede la prima intestazione `## 20`: verifica comunque che
i conteggi di Check B e C non cambino per via di questa riga.

### Passo 5: PROTOCOL.md, una frase

In P9, la frase «Al termine di ogni task, aggiungi un'entry a `docs/claude-code-log.md`.» diventa
«Al termine di ogni task, aggiungi un'entry in testa a `docs/claude-code-log.md` (newest-first per
giorno, R-RAIL-45).». Nient'altro. Il blocco di formato che segue è confrontato byte a byte con
`CLAUDE.md` §21.2 da Check A: non toccarlo, e Check A deve restare PASS. Se in `CLAUDE.md` trovi
una frase equivalente sul dove aggiungere l'entry, non modificarla: segnalala nella nota finale.

### Passo 6: entry di rotazione

In testa al log attivo, subito sotto la riga di regola, la tua entry. Il formato è il blocco di
`CLAUDE.md` §21.2, copiato dal file (l'heading e il sentinella usano U+2014, come da formato).
Contenuto:

```
## 2026-08-28 — docs: rotazione del log a 22 entry attive (venticinquesimo lotto), rimosse 450 entry reimportate dal merge 70e920492
**Prompt**: manutenzione del log: rimozione del blocco reintrodotto dal merge di staging (450 entry già in archivio, byte per byte, più il frammento orfano dell'entry 2026-05-25), rotazione per data di heading con cutoff 2026-08-27, ordine newest-first per giorno ripristinato, regola scritta in testa al file e in P9.
**Files touched**: docs/claude-code-log.md, docs/claude-code-log-archive.md, docs/PROTOCOL.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: <max 500 caratteri: conteggi prima/dopo dei due file, gate da 1/3 a 3/3, numero di inversioni dichiarate nel preambolo, rimando al paragrafo «Twenty-fifth batch» per il resto>
**Prompt document name**: 2026-08-28 15:50
```

Dopo l'entry il log attivo ha 22 intestazioni.

## GATE D'USCITA

Tutti, nell'ordine; il primo che fallisce è hard stop con il dettaglio, senza tentare aggiustamenti:

1. Conservazione: l'insieme degli heading distinti (attivo ∪ archivio) dopo è uguale a quello prima
   più il solo heading dell'entry di rotazione. Conteggi attesi: attivo 22, archivio 912, distinti
   934 = 933 + 1. Per ognuna delle 94 entry spostate, corpo identico byte per byte fra il file di
   partenza (leggilo da `git show HEAD:docs/claude-code-log.md`) e l'archivio. Per ognuna delle 21
   tenute, corpo identico fra HEAD e il file nuovo.
2. `cd frontend && npm run check:docs > /tmp/check-docs-after.txt 2>&1; cd ..`:
   `3/3 check(s) passed, 0 warning(s)`. Se restano warning, elencali nella nota finale: non sono
   bloccanti, ma con il taglio a 2026-08-27 me ne aspetto zero.
3. `git diff --stat` tocca esattamente i tre file di DOVE.
4. `git diff docs/PROTOCOL.md` mostra una sola riga cambiata.

## COMMIT

```
git add docs/claude-code-log.md docs/claude-code-log-archive.md docs/PROTOCOL.md
git commit -m "docs: log rotation (25th batch), drop 450 entries re-imported by merge 70e920492"
```

Mai `git add .` o `git add -A`: il tree ha modifiche e file untracked di altri cantieri. Non pushare.

## HARD STOP

Uno solo, a fine task, con la nota finale che contiene: gli output di `/tmp/check-docs-before.txt`
e `/tmp/check-docs-after.txt` in forma riassunta (le righe di riepilogo e i conteggi di Check B e C),
i conteggi di conservazione, l'elenco delle inversioni dichiarate, l'esito del controllo sulle undici
entry segnalate, lo stato del resto del working tree (`git status --porcelain` intero), l'eventuale
frase equivalente trovata in `CLAUDE.md`, e ogni deviazione da questo prompt con il motivo.

Nessun discovery report: il task non ha fase esplorativa, la misura è stata fatta in chat via bridge
il 2026-08-28 alle 15:45 su HEAD `ee0eb3bdb`; il passo 1 la ripete come verifica.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9 (righe 89-108): soglia 40, formato entry, rotazione.
- `CLAUDE.md` §21 (righe 907-960): formato, cap Notes 500, `Corregge`/`Causa`, no back-filling.
- `docs/HARNESS-DOCS.md` righe 264-270: ordinamento newest-first per giorno (R-RAIL-45), rotazione a
  repo fermo.
- `frontend/scripts/gates/check-docs.ts`: `ENTRY_HEADING`, `LINT_FROM_DATE = 2026-08-02`,
  `NOTES_LINT_FROM_DATE = 2026-08-19`, il parser ignora le righe prima del primo heading, l'archivio
  serve solo a risolvere le chiavi `Corregge`.
- Archivio, preambolo: paragrafi dei lotti 2°-5° (criteri di taglio) e 23°-24° (gate verde per
  rotazione, conteggi).
- Merge `70e920492` (2026-08-24): `git show --stat 70e920492 -- docs/claude-code-log.md` mostra
  +6660 righe, che sono le 450 entry, il frammento orfano e le tre entry Jjodie.
- Precedente dell'entry finita nel file sbagliato (`df7559254`, corretta da `aa93e9665`): i path del
  log si scrivono sempre dalla root del repo.

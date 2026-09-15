# Prompt Claude Code: RC-7, igiene dei gate (allineamento del generato, resolver di check:docs, baseline tsc)

**Documento prompt**: 2026-08-06 19:10
**Tipo**: tooling più docs. Voce 1 della coda nuova ratificata il 2026-08-06, con movente misurato.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Corsia**: veloce (RC-3). Nessun file di `src/` coinvolto, fuori critical zone. Resta una Fase 0 di re-ancoraggio breve: i path reali del generatore di `AGENTS.md` e di `check-docs.ts` non sono mai stati mappati in un prompt precedente e i numeri di riga citati vengono da una lettura ormai datata. Esecuzione in un'unica sessione: se le regole di uscita non scattano, la Fase 1 parte senza round-trip in chat.

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root del repo. In caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` per il contesto recente. Possibile entry di un micro-commit docs su `docs/viewpoint-codebase-map.md` §3 (rider ratificato, eseguito fuori da questa coda): può essere atterrato o no. Non interferisce con questa voce; prenderne atto nel report.
3. Leggere `docs/decisions.md`: contiene i vincoli attivi; questo prompt vi aggiunge una riga in chiusura.
4. Nel working tree può esserci `CLAUDE-BAK-NOT-TO-USE.md` untracked in root: NON toccarlo, né `git add` né cancellazione (la rimozione è un'azione manuale riservata ad Alfonso). Nessuno stash, checkout o reset. Ogni `git add` è per file espliciti, mai `git add .`.
5. Per questa voce non è prevista verifica visiva. Se per qualsiasi ragione servisse il dev server: http://localhost:3000/ (vite fissa `port: 3000`; eventuali riferimenti a 3001 nei documenti storici sono errati).

## CONTESTO (autocontenuto)

Tre difetti di igiene della catena dei gate, tutti misurati:

1. **`AGENTS.md` è un documento generato e resta indietro in silenzio.** Due volte in tre giorni: dal 2 al 5 agosto (nota 3 della voce 2 della coda precedente, commit `f15a22bd2`; dentro c'era una regola NON-NEGOTIABLE) e di nuovo tra la voce 3 e il preflight della voce 5 (il rinvio della regola 16 non era mai arrivato nel generato; diff di 2 righe, riallineato con `363f8166d`). Nessun gate se ne accorge. La risposta ratificata (RC-7) è un fix di classe, non un altro riallineamento puntuale: un gate che rigenera in temp e confronta.
2. **Il resolver di `check:docs` ha due chiavi che non combaciano.** Alla riga oggi nota come 268, `check-docs.ts` costruisce l'insieme dei documenti col nome file intero; alla riga oggi nota come 313 risolve i riferimenti sul solo prefisso timestamp. Le due chiavi non si incontrano mai: da qui i 4 warning noti, tutti falsi positivi (i documenti esistono). I numeri di riga vanno ri-ancorati, non presi per buoni.
3. **La baseline tsc è descritta nei log in modo incompleto** (soltanto i 19 errori di casing). La baseline reale è 33: 19 casing più 14 sparsi (api/data.ts ×3, Measurable ×6, Dummy, EditorV2:2886, ChatMessages:246, ProjectEditor:220, Dashboard:570). Il rischio concreto: una sessione futura conta 33, legge 19 e tratta 14 errori preesistenti come regressioni proprie, o all'inverso usa il numero sbagliato per mascherare regressioni vere.

Vincoli di cornice: RC-7 ratificata in `claude/sessione_2026-08-05_5.md`; corsia veloce fuori critical zone (RC-3); le decisioni vincolanti vivono nel repo (RC-4, `docs/decisions.md`).

## FASE 0: re-ancoraggio breve e fotografia

Fase read-only sul codice. È ammessa l'esecuzione controllata di generatore e checker; se un run modifica `AGENTS.md` nel working tree, fotografare il diff nel report e ripristinare con `git restore AGENTS.md` (un diff non vuoto a HEAD è un dato, vedi regole di uscita).

1. **(a) Script e catena.** In `package.json`: nome reale dello script che genera `AGENTS.md` (atteso qualcosa come `gen:agents`), nome e wiring di `check:docs`, esistenza di uno script aggregato dei gate o di hook (husky, pre-commit). Come e dove la catena dei gate è documentata (per esempio in `CLAUDE.md`).
2. **(b) Generatore.** Path reale dello script, sorgenti da cui genera (solo `CLAUDE.md`? anche altri file, per esempio `docs/decisions.md`?), destinazione, eventuale supporto già presente per un output path alternativo. Determinismo: due run consecutivi producono lo stesso contenuto byte per byte (confrontare gli hash di `AGENTS.md` dopo ciascun run, poi ripristinare se serve).
3. **(c) check-docs.ts.** Path reale; ri-ancorare con `file:riga` a HEAD i due punti (costruzione dell'insieme, risoluzione dei riferimenti) e la chiave usata da ciascuno. Eseguire `check:docs` e fotografare i warning correnti: attesi esattamente i 4 noti, con la loro identità precisa.
4. **(d) tsc.** Eseguire il type-check reale del repo (`npx tsc --noEmit` o lo script equivalente) e fotografare il conteggio per file: atteso 33 totale, ripartito come da CONTESTO. Poi grep di dove i log descrivono la baseline (cercare `casing`, `19`, `tsc` in `docs/claude-code-log.md` e in eventuali altri punti: `CLAUDE.md`, script dei gate) ed elencare le occorrenze.
5. **(e) Fotografia git.** `git log --oneline` dal 2026-08-05 a HEAD e `git status`; HEAD atteso `5fcef39ef` o un successivo micro-commit docs (il rider). Elencare i file sporchi.
6. **(f) Collisioni di nomi.** Grep globale preventivo per i nuovi identificatori previsti: script npm `check:agents`, file `check-agents.ts` (o i nomi coerenti con le convenzioni reali trovate in (a)).

**DISCOVERY REPORT OBBLIGATORIO**: salvare in `docs/discovery/discovery_2026-08-06_rc7_gates_reanchor.md` con: obiettivo; file letti (path completi); esito punto per punto (a..f) con i `file:riga`; dipendenze e rischi; domande aperte per Alfonso. La Fase 0 non è conclusa finché il report non è scritto; l'eventuale hard stop scatta DOPO il report.

**REGOLE DI USCITA (hard stop condizionato).** Fermarsi dopo il report, senza toccare codice, e riportare in chat se una qualsiasi è vera:

1. Il generatore di `AGENTS.md` non esiste come script rintracciabile, oppure `AGENTS.md` non risulta interamente generato da sorgenti.
2. La rigenerazione non è deterministica.
3. La regen a HEAD produce un diff non vuoto su `AGENTS.md` che NON si spiega con un commit recente ai sorgenti (per esempio il rider). Se invece il diff è il riflesso banale di un commit recente, non è un blocco: si rigenera con lo script ufficiale e si include `AGENTS.md` nel commit di questa voce, dichiarandolo nella sintesi (è il gate che fa il suo lavoro in anticipo).
4. I warning di `check:docs` non sono i 4 attesi, oppure la meccanica delle due chiavi non corrisponde a quella descritta (fix già avvenuto o causa diversa).
5. Il totale tsc non è 33, o la ripartizione differisce dal CONTESTO: possibili regressioni o fix nel frattempo, serve una decisione prima di descrivere una baseline.
6. Il generatore non è parametrizzabile con un edit minimale per scrivere su un path alternativo e non offre già un modo pulito per farlo. Niente acrobazie copy/restore dentro il gate e niente duplicazione della logica di generazione: in quel caso si propone, non si implementa.
7. Un file bersaglio della Fase 1 è sporco con WIP non appartenente a questa voce.
8. Qualsiasi altra assunzione del CONTESTO non regge a HEAD.

Se nessuna regola scatta, procedere direttamente alla Fase 1.

## FASE 1: implementazione

### COSA

1. **Gate `check:agents` (allineamento del generato).**
   - Aggiungere al generatore un parametro opzionale di output path, con default il comportamento attuale invariato. Edit minimale.
   - Nuovo script `check-agents.ts` (stessa cartella e stesso pattern di `check-docs.ts`; nomi definitivi confermati dal punto (f)): invoca il generatore verso una directory temporanea di sistema (mai dentro il repo), confronta byte per byte con l'`AGENTS.md` presente in root, cioè lo stato che finirebbe nel commit.
   - Identici: exit 0, una riga di esito. Diversi: exit code non zero, messaggio operativo (il comando esatto di regen da eseguire e l'indicazione di includere `AGENTS.md` nel commit) più un estratto del diff (prime ~20 righe).
   - Il gate non modifica mai il working tree e pulisce i propri file temporanei.
   - Wiring nella catena reale mappata in (a), allo stesso livello di `check:docs`: stesso script aggregato, stesso hook, o stessa sequenza documentata. Se l'aggancio richiede un edit a `CLAUDE.md` (catena documentata lì), l'edit è limitato alla sola sezione della catena dei gate e `AGENTS.md` va rigenerato con lo script ufficiale nello stesso commit. Nessun altro edit a `CLAUDE.md`: in particolare la questione delle 142 righe ricostruite è una decisione sospesa che NON appartiene a questa voce.
2. **Fix del resolver di `check:docs`.** Chiave unica: il nome file intero, sia nella costruzione dell'insieme sia nella risoluzione dei riferimenti. Diff minimale al punto individuato in (c), nessuna riscrittura dello script. Esito atteso: i 4 warning spariscono; un riferimento davvero rotto continua a produrre warning (test 5 sotto).
3. **Correzione della descrizione della baseline tsc.** Nei punti trovati in (d), correggere la descrizione che funge da riferimento corrente in: 33 errori preesistenti, 19 di casing più 14 sparsi, con l'elenco dei 14 come da CONTESTO. Le entry storiche del log non si riscrivono nella loro narrativa: se le occorrenze incomplete vivono solo dentro entry datate, la correzione sta nell'entry di chiusura di questo task, che diventa il riferimento canonico da qui in avanti. Se uno script dei gate codifica un numero atteso di errori, aggiornarlo a 33 con la ripartizione in commento.
4. **Niente altro.** Nessun file di `src/`, nessun rename di identificatori esistenti, nessun refactoring dei checker oltre il fix puntuale. Se qualcosa oltre il perimetro sembra necessario, fermarsi e riportare.

### DOVE

File bersaglio attesi (la Fase 0 conferma i path reali): `package.json`; il nuovo `check-agents.ts` accanto a `check-docs.ts`; `check-docs.ts`; lo script generatore (solo il parametro di output); `docs/claude-code-log.md`; `docs/decisions.md` (riga in chiusura); eventuali: il file della catena aggregata dei gate, `CLAUDE.md` (sola sezione della catena) con conseguente `AGENTS.md` rigenerato. Ogni file oltre questi va elencato e motivato prima di toccarlo.

### COME

- Diff minimale, zero refactoring opportunistico, mai rinominare identificatori esistenti. TypeScript tipizzato.
- **Test obbligatori**, con output incollato nella sintesi finale:
  1. Gate positivo: stato allineato, `check:agents` verde.
  2. Gate negativo: append di una riga di prova a `AGENTS.md`, gate rosso col messaggio operativo, poi `git restore AGENTS.md`.
  3. Determinismo end-to-end: due run consecutivi del gate, stesso esito.
  4. `check:docs`: dai 4 warning della fotografia di Fase 0 a 0 warning.
  5. `check:docs` negativo: file temporaneo in `docs/` con un riferimento a un documento inesistente, warning presente, poi rimozione del file temporaneo.
  6. tsc invariato: 33 errori prima e dopo, stessa ripartizione.
  7. `npm run build` verde e catena gate completa verde (incluso il nuovo `check:agents`).
- A fine task `git status` pulito, salvo l'eventuale `CLAUDE-BAK-NOT-TO-USE.md` (che resta com'è) e i file del commit.
- **Un solo commit**: `chore(tooling): add AGENTS.md alignment gate, fix check:docs resolver, correct tsc baseline note` (una riga; adeguare il fraseggio allo stile del log se differisce). `git add` dei soli file toccati, elencati uno per uno. Niente push: il push lo decide Alfonso.

## Chiusura

1. Sintesi in chat: esito dei 7 test con evidenza, elenco dei file toccati con una riga ciascuno, eventuale diff reale di `AGENTS.md` incontrato in Fase 0 e come è stato gestito, domande aperte.
2. Entry in `docs/claude-code-log.md` secondo il formato standard: tipo `chore`, nome del documento prompt "2026-08-06 19:10 RC-7 igiene dei gate", file toccati, esito. L'entry riporta la baseline tsc completa (33 = 19 casing più 14 sparsi, con l'elenco) come riferimento canonico.
3. In coda a `docs/decisions.md` una riga per RC-7: i documenti generati sono verificati dai gate (`check:agents`: regen in temp più confronto con lo stato in root); i riferimenti di `check:docs` si risolvono sul nome file intero. Se i sorgenti del generatore includono `decisions.md` stesso, rigenerare `AGENTS.md` nello stesso commit: il nuovo gate ne darà evidenza.

## RIFERIMENTI

- Nel repo: `CLAUDE.md`; `docs/claude-code-log.md`; `docs/decisions.md`; commit di movente: `363f8166d` (riallineamento `AGENTS.md` al preflight), `f15a22bd2` (nota 3: primo disallineamento misurato), `648de9a72` (normalizzazione del log, `check:docs` 2/2 con i 4 warning residui noti).
- Nel KB di progetto (tracciabilità; non servono per eseguire, questo prompt è autocontenuto): `contesto_progetto.md` (Bug aperti, prima voce), `claude/sessione_2026-08-05_5.md` (ratifica RC-7), `claude/verifica_2026-08-06_voce5_chiusura_coda.md` (preflight che ha scoperto il secondo disallineamento).

---

## Nota di archivio (2026-08-07, a esecuzione avvenuta)

Questa copia è la **revisione 1** (pre Fase 0). L'esecuzione reale ha seguito la **revisione 2 post Fase 0** più l'addendum riportato sotto. Differenze sostanziali della rev 2 rispetto al testo qui sopra, tutte imposte dalla misura di Fase 0:

- Fix del resolver in direzione **prefisso timestamp su entrambi i lati** (V2), non «nome file intero»: la lettera di questo documento, eseguita sui dati reali, dà 5 warning invece di 4 (V1) — non ne chiude nessuno e ne rompe due che oggi risolvono.
- Esito atteso di `check:docs`: **da 4 warning a 1**, non a 0. Il residuo `2026-07-18 00:00` è un riferimento genuinamente irrisolto e resta a suonare come prova vivente del test negativo.
- Baseline tsc: la composizione entra in **`CLAUDE.md` §17, forma compatta** (33 = 19 casing più 14 sparsi con l'elenco), non nella sola entry di log.
- **8 test** obbligatori (non 7) e messaggio di commit `chore(tooling): add AGENTS.md alignment gate, fix check:docs resolver key`.

Esito: **commit unico `a6058b805`**, 9 file col report di Fase 0 incluso (P4); il decimo file condizionale (`frontend/src/jjtl/AGENTS.md`) non necessario, il regen non lo muove. Verificato sull'evidenza primaria il 2026-08-07 (repo collegato): 8 test verdi, tsc 33 Δ0, build 0, gate mai scrivente. Riferimenti: entry di log 2026-08-06 «RC-7 igiene dei gate», riga RC-7 in `docs/decisions.md`, report `docs/discovery/discovery_2026-08-06_rc7_gates_reanchor.md` (con rettifica dichiarata in coda).

## ADDENDUM (ratifiche e note, 2026-08-06) — consegnato in coda al prompt

```
1. Le due decisioni aperte sono ratificate come il prompt assume: il warning residuo
   2026-07-18 00:00 resta a suonare (prova vivente del test 6); la composizione della
   baseline entra in CLAUDE.md §17, forma compatta.
2. HEAD: 5fcef39ef è l'atteso, ma se sopra c'è il micro-commit docs del rider
   (viewpoint-codebase-map §3) è previsto e benigno. Qualsiasi altro delta: fermarsi
   e riportare.
3. Se il regen tocca anche frontend/src/jjtl/AGENTS.md, quel file entra nel commit
   (decimo file: dichiararlo nell'elenco di conferma di regola 19).
4. Il generatore sta nella root, il gate in frontend/scripts/gates: verificare il cwd
   dell'invocazione del generatore dalla temp (node ../scripts/generate-agents.mjs o
   npm run dalla root) prima del test 1, col report di Fase 0 alla mano.
```

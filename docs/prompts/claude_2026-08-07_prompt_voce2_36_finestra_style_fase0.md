# Prompt Claude Code: passo 0 docs più Fase 0 della 3.6 (finestra Style)

**Documento prompt**: 2026-08-07 16:49
**Tipo**: docs (passo 0, due micro-commit) più discovery read-only (Fase 0 della micro-slice 3.6). Voce 2 della coda nuova ratificata il 2026-08-06.
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Corsia**: veloce (RC-3) per il passo 0: solo docs, fuori critical zone. La 3.6 vera è two-phase: questa sessione esegue SOLO la Fase 0 e si ferma al report. L'implementazione arriva come emendamento dopo le decisioni in chat. NESSUN file di `src/` va modificato in questa sessione.

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root. In caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` (prima entry: RC-7 del 2026-08-06) e `docs/decisions.md` (vincoli attivi, inclusa la riga RC-7).
3. HEAD atteso: `a6058b805` (commit unico RC-7), eventualmente già pushato. Qualsiasi altro delta sopra HEAD: fermarsi e riportare. Nel working tree può esserci `.claude/settings.local.json` untracked: ignorarlo, mai `git add`.
4. Ogni `git add` per file espliciti, mai `git add .`. Nessuno stash, checkout o reset. Niente push: lo decide Alfonso.
5. Verifica visiva non prevista. Dev server, se mai servisse: http://localhost:3000/.

Conteggio file della sessione (regola 19): attesi 5 in tre commit (mappa, `CLAUDE.md`, `AGENTS.md`, log, report di discovery). Se il regen del commit B muove anche `frontend/src/jjtl/AGENTS.md` si arriva a 6: in quel caso elencare i file con la modifica di ciascuno e attendere conferma prima di procedere.

## PASSO 0: due micro-commit docs, subito

Nessuna dipendenza dalla Fase 0; si eseguono per primi, in due commit separati.

### Commit A: `docs/viewpoint-codebase-map.md` §3

Il §3 è fermo al 2026-03-28: descrive i sei sub-tab legacy come se valessero per tutte le view. Dal 2026-08-06 (commit `fd92b3d1c` più `e15eb5081`) è vero solo per le view classic.

- Leggere il file intero prima di toccarlo; riscrivere il solo §3 perché dica la verità corrente:
  - Le view IR (campo `ir` presente) hanno una barra propria a cinque tab: Applies to, Structure, Appearance, Text, Source (strada B; tutti i tab montati, `display: none` sugli inattivi).
  - Ricollocazione R-H: Name, Viewpoint e Parent view vivono in testa ad Applies to; il tab Source è read-only e visibile solo in Advanced.
  - I sei sub-tab legacy restano esatti per le sole view classic (senza `ir`).
  - Verificare i nomi e i fatti a HEAD (per esempio in `irTabs.tsx`) invece di fidarsi di questo prompt.
- Stile: fattuale e asciutto, coerente col resto del file. Nessuna em dash. Le altre sezioni non si toccano.
- Commit: `docs: refresh viewpoint-codebase-map §3 for the IR five-tab bar`

### Commit B: `CLAUDE.md` riga 5, gate della rigenerazione

La riga 5 di `CLAUDE.md` dice ancora di verificare la rigenerazione di `AGENTS.md` con `npm run check:docs`; dopo RC-7 il gate giusto è `npm run check:agents` (nota 10 dell'entry RC-7: fuori perimetro lì, di competenza qui).

- Edit puntuale della sola riga: sostituire `check:docs` con `check:agents` nella frase della rigenerazione. Nessun altro edit a `CLAUDE.md`: in particolare le 142 righe ricostruite restano una decisione sospesa che non appartiene a questa voce.
- L'edit trascina la rigenerazione: `npm run gen:agents` nello stesso commit, con `AGENTS.md` incluso (ed eventuale `frontend/src/jjtl/AGENTS.md` se il regen lo muove, dichiarandolo come da regola 19).
- Commit: `docs: point AGENTS.md regeneration check to check:agents`

Gate dopo i due commit: `npm run check:agents` verde sul committato; `npm run check:docs` verde con l'unico warning residuo noto (`2026-07-18 00:00`), che resta e non va "sistemato". `typecheck` e `build` non sono richiesti da modifiche docs, ma se eseguiti non devono peggiorare (baseline tsc: 33, composizione in `CLAUDE.md` §17).

## CONTESTO della 3.6 (autocontenuto)

La partizione 1.5 (barra a cinque tab, 2026-08-06) ha tolto alle view IR la superficie Style: il sub-tab legacy Style resta raggiungibile solo sulle view classic. Ma il canale misurato di R-2 è vivo: una view con `cssIsGlobal = true` e regole CSS annidate con `!important` ridipinge i nodi IR del canvas, e dalla 1.5 l'autore non ha più una superficie da cui accorgersene o rimediare. La popolazione esposta è il parco view intero, perché il css di default dormiente viaggia con le view generate dal tool. Mitigazione ratificata per iscritto (2026-08-06, finestra accettata): rilevamento sul TESTO del css all'attivazione del viewpoint, con warning. Vincoli: niente motore CSS, niente nuove dipendenze, predicato testuale. Il tab Source è la sede già ratificata da R-2 per dichiarare il conflitto: è una candidata per la superficie del warning, non una decisione presa.

## FASE 0: discovery read-only sul canale Style

Rispondere con `file:riga` a HEAD; nessuna modifica a file sorgente. Esecuzione controllata dell'app ammessa solo per osservare (nessuna scrittura).

1. **(a) Il canale.** Dove vive `cssIsGlobal` (campo di `DViewElement`?), dove il css di una view viene iniettato o applicato a runtime, con quale scoping (globale vs per-nodo). Il percorso esatto per cui una regola annidata `!important` di una view arriva a ridipingere un nodo IR.
2. **(b) L'attivazione.** Il punto unico (o i punti) in cui un viewpoint diventa attivo, e quale insieme di view è rilevante da scansionare in quel momento (le view del viewpoint attivato? tutte le view applicate del progetto?). Choke point candidato per il rilevamento.
3. **(c) Il corpus.** Che css portano le view di default (`defaultViewTemplate.ts`): quante view di un progetto tipico hanno testo css non vuoto, e che valore ha `cssIsGlobal` di default. Se il corpus dei progetti reali è a portata, una stima della popolazione che farebbe scattare il predicato.
4. **(d) Il predicato.** Proposta di predicato testuale minimo (per esempio: `cssIsGlobal === true` E testo con `!important` dentro una regola annidata), con analisi di falsi positivi e falsi negativi sul corpus del punto (c). Niente parsing CSS completo.
5. **(e) Le superfici del warning.** Censimento delle superfici esistenti con `file:riga`: registry dei problems (`components/editor-v2/problems/`), sistema toast (pattern CustomEvent più useState, §8.7), striscia d'errore di pannello, tab Source (sede R-2). Per ciascuna: costo di aggancio, visibilità al momento dell'attivazione, rischio di rumore. Nessuna scelta: opzioni per Alfonso.
6. **(f) Il costo.** Ordine di grandezza della scansione del testo all'attivazione su un progetto grande (riferimento: 1550 view nel censimento di agosto); se servono memoizzazione o debounce.
7. **(g) Collisioni.** Grep preventivo dei nuovi identificatori plausibili (nome del modulo di rilevamento, chiave di problem o di evento) secondo le convenzioni reali trovate in (e).

**DISCOVERY REPORT OBBLIGATORIO**: salvare in `docs/discovery/discovery_2026-08-07_style_window_channel.md` con: obiettivo; file letti (path completi); esito punto per punto (a..g) con i `file:riga`; dipendenze e rischi; domande aperte per Alfonso. La Fase 0 non è conclusa finché il report non è scritto. Il report entra in un commit proprio (`docs: discovery on the style window channel (3.6 phase 0)`), mai lasciato untracked (P4).

**HARD STOP.** Dopo il report e il suo commit: fermarsi. Nessun file di `src/` in questa sessione. Le decisioni (predicato definitivo e superficie del warning) si prendono in chat sulla base del report; la Fase 1 arriva come emendamento a questo prompt.

Regole di uscita anticipate (fermarsi e riportare anche prima del report se una è vera): il canale descritto nel CONTESTO non esiste più a HEAD (per esempio `cssIsGlobal` rimosso o già neutralizzato); una superficie di warning per questo caso esiste già; qualsiasi altra assunzione del CONTESTO non regge.

## Chiusura

1. Sintesi in chat: esito dei due commit del passo 0 (con hash), findings chiave della Fase 0 (canale, choke point, opzioni di superficie), domande aperte.
2. Entry in `docs/claude-code-log.md` nel formato §21.2, con onestà sui campi §21.3. Per il commit B: `Corregge` può citare "2026-08-06 19:10 RC-7 igiene dei gate" se lo si legge come rimedio della nota 10 (fuori perimetro dichiarato, non esito ⚠️ o ❌); in dubbio, `—` con nota. Per la Fase 0: entry docs di discovery come da prassi.
3. Nessuna riga nuova in `docs/decisions.md` in questa sessione: le decisioni della 3.6 arrivano dopo la chat.

## RIFERIMENTI

- Nel repo: `CLAUDE.md` (§17 gate; §8.7 pattern CustomEvent più useState; §3.1 come mappa dei file critici, nessuno dei quali va toccato); `docs/claude-code-log.md` (entry RC-7, in particolare note 9 e 10); `docs/decisions.md` (riga RC-7, serie R-B); `docs/viewpoint-codebase-map.md`; `frontend/src/utils/defaultViewTemplate.ts`; `frontend/src/components/editor-v2/problems/`; commit `fd92b3d1c` ed `e15eb5081` (barra a cinque), `a6058b805` (RC-7).
- Nel KB di progetto (tracciabilità, non servono per eseguire: questo prompt è autocontenuto): `contesto_progetto.md` (coda nuova, voce 2), `claude/review_2026-08-06_barra_15_cinque_tab.md` (Source, punto 4: sede R-2), `claude/sessione_2026-08-06_2.md`.

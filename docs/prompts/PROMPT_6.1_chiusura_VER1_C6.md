# PROMPT — §6.1 chiusura batch VER1 / UNQ1-C6 (SERIALE, repo fermo)

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`, cwd root del repo (`check:docs` gira da `frontend/`). Leggi `CLAUDE.md`, `docs/PROTOCOL.md` P9 (blocco di formato + regola log-inbox `061453e65`), §21.3, RC-13 §6.4.

Task documentale più pulizia: **nessun file applicativo cambia**, con l'unica eccezione dichiarata al punto 5. Alfonso conferma repo fermo. Registra HEAD a inizio sessione; se cambia prima della fine, hard stop.

Corsie chiuse in codice: VER1 (`1ac3b1863`), UNQ1-C6 (il commit `fix(problems)`, leggilo da `git log` — non lo ricordo di preciso, quindi **non fidarti di uno SHA scritto qui che non hai verificato**).

Cinque punti, in quest'ordine, un commit per punto.

## 1. Entry inbox → log attivo

`docs/log-inbox/` contiene tre entry, scritte dalle corsie: `coda-L1-L4.md`, `ver1.md`, `unq1-c6.md`. Elenca ciò che trovi davvero — se sono più o meno di tre, dichiaralo e trattale tutte.

Spostale in testa a `docs/claude-code-log.md`, **verbatim**, ordine newest-first (R-RAIL-45), sotto la nota di sanatoria che resta preambolo dell'header. Non riscrivere il testo delle entry: se una viola il formato P9, **dichiarala e spostala com'è** — correggerla qui sarebbe back-filling su lavoro di un'altra sessione. Poi cancella i tre file, lasciando `.gitkeep`.

Baseline `npm run check:docs` in un file **fuori** da `/tmp` di job (usa `git show HEAD:docs/claude-code-log.md` se ti serve il prima — mai una copia su disco): attesa 3/3 con 2 warning. Dopo lo spostamento: se compaiono warning nuovi, dichiarali senza emendare; se compare un **errore**, hard stop.

Commit, pathspec `docs/claude-code-log.md docs/log-inbox/`: `docs(log): entry VER1, UNQ1-C6 e coda L1–L4 dalla inbox`.

## 2. Prompt untracked (RC-9)

`git status --porcelain docs/prompts/`. Attesi quattro: `PROMPT_CHIUSURA_batch_L1-L4.md`, `PROMPT_CODA_batch_L1-L4.md`, `PROMPT_VER1.md`, `PROMPT_UNQ1-C6.md`, più questo. Committali verbatim — sono i prompt del batch, non si riscrivono nemmeno dove il testo si è rivelato sbagliato (i tre errori noti: path sonde senza `frontend/`, «§6.1 di PROTOCOL» dove PROTOCOL è P1..P10, `Corregge` descritto come lettera). Se vuoi annotarli, una riga in coda al file, non un edit al corpo.

Qualsiasi altro untracked in `docs/` → dichiara, non toccare (`discovery_2026-09-01_ego1_centraggio_respiro.md` è WIP EGO1: resta).

Commit: `docs(prompts): prompt del batch VER1 / UNQ1-C6 e code L1–L4`.

## 3. RC-13-bis — ripristino solo da git

Terzo incidente della stessa classe in due batch (un `git stash` incrociato, un `log-backup.md` stale, un `cp` da `/tmp` di job che ha sovrascritto il log con una copia pre-rotazione). In `docs/PROTOCOL.md`, accanto a RC-13 §6.4, **fuori** dal blocco verificato byte a byte (Check A deve restare PASS — verificalo dopo):

> Il ripristino di un file tracciato si fa **solo** con `git checkout HEAD -- <path>`. Nessun backup del working tree su disco, nessun file di appoggio in `/tmp` riusato fra sessioni, nessun `git stash`: sono i tre modi in cui il lavoro di un'altra corsia è stato perso o sovrascritto.

Commit: `docs(protocol): RC-13-bis, ripristino solo da git`.

## 4. Rotazione P9, se dovuta

`grep -c '^## 20'` sul log attivo dopo il punto 1. Se > 40, rotazione per data di heading come nel venticinquesimo lotto (`docs/prompts/claude_2026-08-28_1550_log_manutenzione_rotazione_25.md`), verbatim, commit a sé, con la verifica di identità byte a byte già usata in `0838a303f` (attivo = prefisso del precedente, sha256 delle byte uscite = entrate). Se ≤ 40, dichiara il conteggio e salta — atteso ~9, quindi il salto è l'esito probabile.

## 5. EGO1 — decidere, non trascinare

EGO1 è in indice da giorni: `docs/discovery/discovery_2026-09-01_ego1_centraggio_respiro.md` (staged **e** con una copia untracked, verifica), `__tests__/egoDiagram.test.ts`, `egoDiagram.scss`. Il referto VER1 nota che il test modificato è in albero e non su HEAD: contribuisce +5 test al conteggio `vitest`, cioè lo stato dei gate del batch dipende da lavoro non committato.

Non chiudere la corsia e non completare il lavoro. Fai solo l'accertamento e **riporta**, senza committare i file applicativi:

- `git diff --cached --stat` e `git diff --stat` sui tre path: cosa è staged, cosa è modificato oltre lo staged.
- Il test modificato passa? I 5 test in più sono nuovi o rinominati?
- Lo `.scss` è coerente col discovery, o il discovery descrive uno stato più avanzato del codice?

Se e solo se i tre path sono coerenti fra loro e i gate passano, **proponi** il commit e fermati: la decisione è di Alfonso. Se sono incoerenti, dichiara cosa manca. In entrambi i casi l'indice resta come l'hai trovato.

## Referto

Per punto: fatto / saltato / hard stop, con SHA. Più: `check:docs` before/after, conteggio entry attive prima e dopo, esito di Check A dopo il punto 3, e l'accertamento EGO1 del punto 5. HEAD iniziale e finale.

## Fuori perimetro — registrare, non toccare

**VER2** (nuovo, dal referto VER1): dopo il fix `project.__raw === idlookup[id]` torna vero, quindi il riallineamento a volte scrive **direttamente sull'oggetto vivo dello store** fuori dal reducer. Non può divergere — scrive il valore che il `SetFieldAction` ha appena messo — ma il perché non è misurato (`deepCopyButOnlyFollowingPath` e il suo `prevAction`). Da aprire come corsia: misurare quando ricopia, e decidere se il riallineamento va guardato (`if (raw !== idlookup[id])`) o se la scrittura diretta è accettabile e va dichiarata.

Poi: §A.1/§A.5 lettori (badge dell'albero, righe M1, collisione visibile nella sola form), disallineamento chiavi canvas (entry sull'id dell'elemento, indicatore sull'id del `DVertex`). Merito per Alfonso, fermo da cinque batch: §8 `get_children_idlist`, tense error text + metamodel shape, `2..*` multi-reference.

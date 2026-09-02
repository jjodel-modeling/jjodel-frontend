# PROMPT — CHIUSURA batch L1–L4: indice, sonde, sanatoria log, regola log-inbox (SERIALE, repo fermo)

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`, root del repo come cwd. Task documentale più pulizia d'indice: **nessun file applicativo cambia**. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` P9 e §6.1, §21.3.

Le quattro corsie del batch sono chiuse in codice: UNQ1 F.2 (`a8260a835`), UNQ1 C5 (`4bde4359`), SAVE1-bis (`10281c7b2`), DIRTY1 (`4400a510f`). Alfonso conferma che nessun'altra sessione scrive sul tree. Se `git log -1 --format=%h` cambia fra inizio e fine, hard stop.

## 1. Indice condiviso

`git diff --cached --stat`. Atteso in indice: **solo EGO1** (i suoi file, staged da giorni, non si toccano). Per tutto il resto, caso per caso:

- `frontend/src/api/persistance/projects.ts` — se il delta staged è **identico a HEAD** (già in `4400a510f`) → `git restore --staged`. Se porta righe nuove → hard stop, dichiara il diff: è lavoro di L4 non committato.
- `UniquenessProblemSync.tsx` + test — stesso criterio contro `4bde4359`.
- Qualsiasi altro path → dichiara, non toccare.

## 2. Sonde temporanee

Tre sonde: `scripts/smoke/_tmp_save1bis_verify.ts`, `_tmp_unq1f2_verify.ts`, `_tmp_unq1_c5.ts`. Verifica con `git check-ignore -v` che tutte cadano in `.gitignore:66`. Quelle ignorate restano sul disco. Se una **non** è ignorata (path diverso, es. `_tmp_save1bis_verify.ts` non in `scripts/smoke/`): `git status` la mostra untracked → cancellala dal disco, non promuoverla. Dichiara path ed esito per ciascuna.

## 3. §6.1 finale sul log

Il log è stato toccato da tre corsie in parallelo con due incidenti. Un solo edit, un solo commit.

**3a. Nota di sanatoria.** In `docs/claude-code-log.md`, nella sezione incidenti (se non c'è, in testa dopo la regola R-RAIL-45), tre righe, formato «SHA → contenuto reale»:

- `50de03252` — messaggio: SAVE1-bis. Contenuto: entry **DIRTY1**.
- `f278cf4fb` — messaggio: DIRTY1. Contenuto: entry **SAVE1-bis + DIRTY1**.
- `ed5c80da` — referto C5 con hash del codice errato; corretto in `ca0adaf9`.

Nessun rewrite di history: è il rewrite su albero condiviso che ha causato il secondo incidente.

**3b. `Causa` di SAVE1-bis.** `npm run check:docs` è rosso sul file intero per una sola entry: SAVE1-bis ha `Causa` in prosa dove §21.3 vuole la lettera nuda. Correggi **solo quel campo**, alla lettera che la prosa descrive (leggi la prosa, scegli la lettera, dichiara la scelta). Deroga esplicita al «no back-filling»: l'entry è di questo batch, non pregressa.

**3c. Gate.** `npm run check:docs` → atteso `3/3`, 0 warning. Baseline prima dell'edit in `/tmp/check-docs-before.txt`.

Commit a sé: `docs(log): sanatoria batch L1–L4 + Causa SAVE1-bis`.

## 4. Regola log-inbox

`docs/PROTOCOL.md`, §6.1, una frase fuori dal blocco verificato byte a byte:

> A corsie parallele, `docs/claude-code-log.md` si tocca **solo** nella §6.1 di chiusura batch, da una sessione sola a repo fermo. Ogni corsia scrive la propria entry in `docs/log-inbox/<lane>.md`; chi chiude il batch le sposta nel log verbatim e cancella l'inbox.

Crea `docs/log-inbox/.gitkeep`. Commit a sé: `docs(protocol): regola log-inbox per corsie parallele`.

## 5. Rotazione P9, se dovuta

Conta `^## 20` nel log attivo. Se > 40, rotazione per data di heading come nel venticinquesimo lotto (`claude_2026-08-28_1550_log_manutenzione_rotazione_25.md`), verbatim, commit a sé. Se ≤ 40, dichiara il conteggio e salta.

## Referto finale

Per punto: fatto / saltato / hard stop, con SHA. Più: stato indice dopo il punto 1, `check:docs` before/after, conteggio entry.

## Fuori perimetro — non toccare, solo registrare

Prossimo batch: **VER1** (`save` legge `version` da `project.__raw`, test pinnato in albero da invertire), **UNQ1-C6** (campo modello su `NodeProblem`), §A.1/§A.5 lettori, disallineamento chiavi canvas. Merito per Alfonso: §8 (`get_children_idlist`), tense error text + metamodel shape, `2..*` multi-reference.

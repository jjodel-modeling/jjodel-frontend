# PROMPT — CODA chiusura batch L1–L4: entry mancante, prompt untracked, Check B `(a)` (SERIALE, repo fermo)

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`, root del repo come cwd. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` P9, `docs/HARNESS-DOCS.md` righe 255-275, e la testa di `docs/claude-code-log.md` (regola R-RAIL-45 + nota di sanatoria `ff74cee8e`).

HEAD atteso `0838a303f`. Alfonso conferma repo fermo. Se HEAD cambia fra inizio e fine, hard stop. Tre punti, tre commit, in quest'ordine. Nessun file applicativo cambia; l'unico script toccato è un gate.

## 1. Entry di log della sessione di chiusura

La sessione che ha prodotto `ff74cee8e` / `061453e65` / `0838a303f` non ha scritto la propria entry. Scrivila tu, in testa all'attivo (newest-first, R-RAIL-45), formato P9 completo: heading `## 2026-09-02 — docs(log): chiusura batch L1–L4 (sanatoria, log-inbox, rotazione)`, i tre SHA nel corpo, `Causa` a lettera nuda **fra parentesi** `(x)`, `Corregge` a lettera nuda, Notes sotto soglia Check C. Il **Prompt document name** è quello della sessione di chiusura (`PROMPT_CHIUSURA_batch_L1-L4.md`, 2026-09-02), non questo.

Non riscrivere le cinque entry esistenti. `npm run check:docs` → atteso 3/3, 2 warning (baseline in `/tmp/check-docs-before.txt`; se la baseline è diversa da 3/3 / 2 warning, hard stop).

Commit a sé, pathspec `docs/claude-code-log.md`: `docs(log): entry della sessione di chiusura L1–L4`.

## 2. Prompt untracked (RC-9)

`git status --porcelain docs/prompts/` → atteso il solo `PROMPT_ENG2_probe_link_gate.md`. Leggilo: se è un prompt completo (ha COSA/DOVE/COME o equivalente) committalo verbatim; se è un frammento, dichiara e non committare. Qualsiasi altro untracked in `docs/` → dichiara, non toccare.

Commit a sé: `docs(prompts): ENG2 probe link gate`.

## 3. Check B — `Causa`/`Corregge` accettano solo `(x)`

`frontend/scripts/gates/check-docs.ts`, Check B. Oggi passa sia `**Causa**: (a)` sia `**Causa**: a`: un'entry del 2026-09-01, ora in archivio, porta la forma senza parentesi ed è passata verde. Il formato canonico è **con** parentesi (verifica sulla maggioranza delle entry in archivio e dichiara il conteggio: quante `(x)`, quante `x` nude, quante altre forme).

Restringi la regex al solo `\(([a-z])\)` per entrambi i campi. Conseguenze da misurare **prima** del commit, sull'attivo e sull'archivio:

- Attivo (6 entry dopo il punto 1): atteso 0 nuovi errori. Se ne compare uno, è su un'entry di questo batch: correggi il solo campo e dichiaralo (deroga §21.3 già motivata nel prompt di chiusura: entry del batch corrente).
- Archivio: Check B non lo scandisce (verifica nel codice e dichiara). Se lo scandisce, hard stop: la restrizione farebbe rosso su entry pregresse e il «no back-filling» vieta di emendarle — in quel caso non toccare il gate, riporta e basta.

Test del gate: se `check-docs.ts` ha un test, aggiungi il caso `Causa: a` → errore e `Causa: (a)` → pass. Se non ha un test, dichiaralo, non crearne uno adesso.

Commit a sé, pathspec sul solo gate (+ test se esiste): `chore(gates): Check B accetta solo la forma (x) per Causa/Corregge`. Questo commit **è** un cambio a uno script: scrivi la sua entry di log in `docs/log-inbox/coda-L1-L4.md` (regola `061453e65`), non nell'attivo — la sposta la prossima §6.1.

## Referto finale

Per punto: fatto / saltato / hard stop, con SHA. Più: `check:docs` before/after per ogni commit, conteggio forme `Causa` in archivio, HEAD finale.

## Fuori perimetro — non toccare, solo registrare

EGO1 staged (intatto). Prossimo batch: VER1, UNQ1-C6, §A.1/§A.5 lettori, disallineamento chiavi canvas. Merito per Alfonso: §8 `get_children_idlist`, tense error text + metamodel shape, `2..*` multi-reference.

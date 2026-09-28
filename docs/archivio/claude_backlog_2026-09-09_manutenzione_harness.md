# Backlog di manutenzione dell'harness, dopo il 15 settembre

Scritto il 2026-09-09. Materiale di lavoro (HARNESS-DOCS §4.8), non normativo: i vincoli che ne
discendono nascono quando una voce viene chiusa e ratificata, non qui.

Origine: ricognizione del 9/9 che ha confrontato `HARNESS-DOCS.md` 1.1 (18/8) con lo stato reale del
repo. Due voci sono gia' chiuse quella sera e restano qui solo come storia: l'allineamento del range
delle clausole P (`16b1e3d20`) e la ricostruzione di `contesto_progetto.md` dal `git log`.

Le voci sono ordinate per quanto bloccano il resto, non per fatica.

---

## 1. Rotazione del prompt log — ALTA

`docs/claude-code-log.md` ha **61 entry attive** contro la soglia di **40** fissata in `PROTOCOL.md`
P9 (misurato il 9/9 dal Check C di `check:docs`). L'invariante 7 di HARNESS-DOCS dice che sopra
quaranta il ciclo e' rotto e serve un triage, non una deroga.

- Corsia **esclusiva**: nessun altro giro tocca il file mentre e' in corso (RC-13).
- A repo fermo, perche' sullo stesso file lavorano sessioni concorrenti.
- Criterio di spostamento: **verbatim, nell'ordine del file attivo** (RC-12), verso
  `docs/claude-code-log-archive.md`.
- Lo staging in un file denso segue il pattern di `CLAUDE.md` §6.1, che pero' e' in tensione con
  RC-13-bis (vedi voce 7).
- Verifica: `npm run check:docs` da `frontend/`, che stampa il conteggio corrente.

## 2. Il naming dei prompt, e la catena `Corregge` — ALTA

Dal 30/8 i prompt vanno a terra come `PROMPT_<sigla>.md` **senza orario** (`8c600cb92`), le corsie
dell'1 e 2 settembre non hanno un file prompt, e i prompt del 9/9 tornano al naming con l'orario.
Due regimi convivono nella stessa cartella.

Il regime senza orario **rompe la catena `Corregge`**, che si risolve sul prefisso
`YYYY-MM-DD HH:mm` (RC-7), e con essa la misura del tasso di successo al primo colpo, che alimenta
il materiale in `docs/mde-intelligence-2026/`. Sintomo gia' visibile: `check:docs` emette due
warning non bloccanti per un `Corregge` ben formato che non risolve su nessun documento prompt.

Da decidere in un verso o nell'altro, e da iscrivere in `decisions.md`:

- **(a)** riallineare al naming `claude_<YYYY-MM-DD>_<HHmm>_prompt_<slug>.md` e accettare il debito
  sui prompt gia' a terra senza orario;
- **(b)** ratificare `PROMPT_<sigla>.md` come deroga permanente, e allora dichiarare che la misura
  del primo colpo si abbandona, oppure sostituirla con un'altra chiave stabile.

Non decidere e' la terza opzione, ed e' quella in corso da dieci giorni.

## 3. Check D in `check:docs` — MEDIA, ma e' la voce che chiude le altre

`HARNESS-DOCS` §6 elenca quattro punti che nessun gate verifica e che restano disciplina: la riga in
`decisions.md` per ogni memo, l'orario nel nome del prompt, il KB a sei file, il discovery report
scritto prima dell'hard stop. Sono anche i quattro punti dove il file dichiarava che l'harness aveva
gia' ceduto almeno una volta. Dal 18/8 **tre su quattro hanno ceduto di nuovo**; regge solo il KB,
l'unico presidiato da una regola esplicita e contata.

La lettura onesta e' che su questi punti la disciplina non ha funzionato e non funzionera'.
Proposta, la piu' economica: un **check D** che

- rifiuti un `Corregge` che non risolve su un documento prompt esistente (oggi e' warning);
- segnali i file in `docs/prompts/` senza timestamp risolvibile;
- confronti il range citato in `CLAUDE.md` e in `HARNESS-DOCS.md` con il massimo `## P<n>` presente
  in `PROTOCOL.md`, cosi' che la deriva chiusa il 9/9 non possa tornare in silenzio.

Il terzo punto vale da solo: quattro file citavano quattro numeri diversi della stessa serie, e
nessuno se n'era accorto per dieci giorni.

## 4. Il gate del merge di `validation-skeleton` — ALTA, ma e' la prima cosa dopo il 15

Tre fatti misurati il 9/9 da mettere nel gate **prima** del merge, non da scoprire durante:

- **16 dei 50 commit del ramo hanno gia' una patch equivalente sul tronco** (`git cherry`
  `alfonso-frontend-jjtl validation-skeleton`): sono i commit di documentazione dell'architetto,
  committati due volte, una per corsia.
- **`CLAUDE.md` diverge fra i due rami di 54 righe**: la §9.3 sugli slot di reference vive solo sul
  ramo. Una correzione normativa su un ramo di feature.
- **`ValidationRulesModal.tsx` e `.scss` sono modificati in albero e non esistono sul tronco**:
  finche' restano cosi', git rifiuta il checkout e lo switch di ramo e' materialmente bloccato.

Da qui discende anche una domanda di processo: se i commit di documentazione vanno su entrambe le
corsie per costruzione, il gate del merge deve dirlo, oppure la pratica deve cambiare.

## 5. HARNESS-DOCS 1.3 — MEDIA

La 1.2 del 9/9 ha toccato solo il range delle clausole P. Resta da fare, in un giro solo:

- **La gerarchia dei normativi (§5) non elenca i quattro documenti nuovi**: contratto del motore
  form (`docs/design/design_handoff_instance_node/form-engine-contract.md`), spec di auto-layout
  (`form-autolayout-spec.md`) e i due README di handoff. Sono normativi nei fatti, R-FORM-4
  (l'invariante zero import) vive li' dentro, e oggi un conflitto fra loro e `decisions.md` non ha
  una risposta scritta.
- **I numeri sono fermi al 18/8**: `vitest` 1315 contro 3207 misurati il 2/9, e i conteggi delle
  cartelle. Misurati il 9/9: prompts 339, discovery 404, ratifiche 52, sessioni 61, spec 12,
  archivio 33; `decisions.md` 3178 righe; log 61 entry attive.
- **§4.4 non elenca le serie nate dopo**: R-STR, R-FORM, R-WCX, R-DEL, R-S1, R-GT/R-M2, R-M2U,
  R-CR2, R-VP, R-DMV, R-SKIN, R-VAL.
- **§4.7 dice «inerte» del contratto della taglia delle forme**, che e' cablato e verificato a
  schermo dal 15/8 (`115e8484d`). L'affermazione e' falsa e va corretta insieme alla voce 6.
- **§11 descrive una pratica abbandonata sul bridge**: oggi dal bridge non si committa, si legge con
  `GIT_OPTIONAL_LOCKS=0` (verificato il 9/9: nessun lock residuo dopo `log`, `diff`, `status`,
  `cherry`) e i commit si fanno dalla shell nativa del Mac via `osascript do shell script`. Va
  aggiunto anche che `package.json` sta in `frontend/`, non nella root.
- La 1.3 si scrive **dopo il merge**, perche' il merge cambia i fronti e altrimenti si riscrive due
  volte.

## 6. Promozione del contratto della taglia delle forme — MEDIA

`contentRect` / `boxForContent` / `boxForContentNumeric` / `boxFromIntrinsic` / `hasSizeSupplement`
in `shapeRegistry.ts`, consumatore unico `viewpoint/ir/useContentSize.ts`, decisioni D8..D13. La
condizione di promozione ad addendum della v1.2 e' **soddisfatta dal 15/8** e il file in
`docs/spec/` non c'e' ancora. Le quattro invarianti da riportare sono gia' scritte in
`spec_attive.md`, sezione «Contratto della taglia delle forme».

## 7. Debiti minori, da chiudere quando si passa di li'

- **Le serie D** (forme, simboli, dashboard) sono ancora solo nei memo e non in `decisions.md`: e'
  il debito di registro piu' vecchio aperto, e una decisione che non sta in `decisions.md` non
  vincola l'esecutore (invariante 4).
- **DOC1 residuo**: il commento `1000ms` in `frontend/src/api/persistance/projects.ts:105`; e la
  tensione fra `CLAUDE.md` §6.1 (righe 460 e 466, il backup in `/tmp` per lo staging del log) e
  RC-13-bis, che i file in `/tmp` li vieta fra sessioni. Una delle due va emendata: o §6.1 propone
  un pattern che non usa `/tmp`, o RC-13-bis distingue il temporaneo dentro un comando dal
  temporaneo fra sessioni.
- **`spec_attive.md`** va riletto contro i quattro normativi nuovi insieme alla voce 5.

---

## Cosa non c'e' qui

La manutenzione del prodotto (verdetto di conformita' globale, `Info.tsx:647`, il tetto del popover,
`hasContent`) sta in `contesto_progetto.md` fra i fronti attivi. Questo file e' solo l'harness.

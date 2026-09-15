# Sessione 2026-08-06 — E-route in deroga, avvio della coda arco A

Checkpoint (v3: audit voce 1, gate su HEAD, voce 3 eseguita). Sostituisce v1 e v2 della
stessa giornata. La sessione copre: notte (02:30, E-route), mattina (11:30, coda).

## Stato a fine sessione

- **E-route landata: commit `423f19f01`** (amend di `5b2cb2f60`, che è orfano: stesso
  contenuto, corretta solo la entry di log col campo smoke visivo). Checklist visiva verde.
  Routing autorabile degli edge IR (`orthogonal|straight|curved`, UI Manhattan/Direct/Bezier,
  assente ≡ orthogonal), entrambe le nature. ATTENZIONE: `contesto_progetto.md` e
  `mappa_sintassi_concreta.md` citano ancora lo SHA pre-amend `5b2cb2f60`: correggerli in
  `423f19f01` alla prossima consolidazione.
- **Voce 1 della coda: già eseguita in precedenza**, scoperto dal guard della fotografia al
  rilancio. Commit `59dfb096d` (refactor, modulo puro `viewpoint/ir/edgeEndpoints.ts`) e
  `d8159c2f0` (fix, C-1..C-4 + B-5). Audit sul codice a HEAD: tutto conforme, B-5 toccava tre
  pannelli non uno. Due debiti dichiarati e parcheggiati: test duplicato (non più mirror,
  importa la funzione vera) e stringa B-5 triplicata (candidata a costante quando i pannelli
  si unificano).
- **Voce 3 eseguita** (fuori ordine, prima della voce 2; nessun danno: CLAUDE.md root era
  pulito e l'edit è una riga appesa alla regola 16, senza rinumerazioni): commit `061be4b5c`,
  `docs/decisions.md` seminato (73 righe). **R-B12 chiuso**: ramo attivo = gli edge non
  ortogonali non registrano nulla e il crossing detection li ignora (`UnifiedEdge.tsx:263`
  con commento di motivazione; report re-anchor `:264`, consumatori saltati `:281-282`).
  **Nuovo pendente: `AGENTS.md` disallineato**: l'intestazione di CLAUDE.md prescrive
  `npm run gen:agents` a ogni sua modifica; Claude Code ha rispettato la lista chiusa dei
  tre file e ha segnalato il conflitto invece di risolverlo da solo.
- **Gate rieseguiti su HEAD `423f19f01`**: tsc 33 = baseline Δ0 (0 nel perimetro); vitest
  1081 verdi, 9 suite `window is not defined` = baseline (perimetro viewpoint: 200/200);
  build exit 0; `check:docs` exit 0 **ma solo grazie all'albero sporco** (vedi sotto).
- **Working tree**: `docs/claude-code-log.md` sporco con la normalizzazione di Causa sulle
  due entry 2026-08-03 (è ciò che rende verde `check:docs`; su contenuto committato il gate
  sarebbe ancora rosso); untracked `CLAUDE-BAK-NOT-TO-USE.md`. Il WIP Jsx/ViewData/
  TemplateData non esiste più. **La modifica pendente a `CLAUDE.md` root non è più visibile**:
  o è stata committata (trappola `.gitignore` forse già scattata: le 156 righe vivrebbero solo
  nel `frontend/src/jjtl/CLAUDE.md` ignorato) o revertita. Da accertare prima della voce 2.
- Remoto: alla verifica delle 02:45 i commit di inizio agosto erano solo locali. Push da fare.

## Decisioni prese

- **Deroga d'ordine (Alfonso)**: E-route subito, in parallelo alla coda arco A, prima di
  F2/F3 e di E-mark/E-lab. Select del routing solo testo in v1.
- **Voce 3 arricchita**: `docs/decisions.md` semina anche le decisioni E-route e apre
  "Superate" con D3. Il prompt (v. sotto) obbliga a scrivere il ramo attivo del gate
  `registerEdgePath` verificandolo nel codice.
- **Micro-commit del log prima della voce 2** (direttiva data, da eseguire): la
  normalizzazione non committata va committata da sola
  (`docs: normalize Causa in two 2026-08-03 log entries`), altrimenti ogni commit successivo
  che tocca il log se la trascina dentro. Rende inoltre verde `check:docs` sul committato.
- **Voce 2 adattiva**: prima di eseguirla, `git log --oneline -5 -- CLAUDE.md` +
  `git check-ignore -v frontend/src/jjtl/CLAUDE.md` + esistenza del file jjtl. Se lo
  sfoltimento è già in main, il commit di voce 2 diventa `.gitignore` più
  `frontend/src/jjtl/CLAUDE.md` (recupero delle 156 righe), senza `CLAUDE.md` root; la sanity
  sul contenuto resta obbligatoria. `CLAUDE-BAK-NOT-TO-USE.md` non si tocca (Alfonso lo
  elimina a mano a coda chiusa).

## Bug nuovi / Todo

- **[BASSA] `bordr` non è una proprietà CSS**: warning esbuild in build, un typo da qualche
  parte negli stili, uno stile non applicato. Da localizzare con grep quando capita.
- **[XS igiene] Descrizione della baseline tsc incompleta nei log**: dicono "casing Settings/
  più Dashboard.tsx:570", in realtà 19 casing + 14 sparsi (api/data.ts ×3, Measurable ×6,
  Dummy, EditorV2:2886, ChatMessages:246, ProjectEditor:220, Dashboard:570).
- **[XS, registrato] 4 warning `check:docs`** della stessa forma (Corregge senza Prompt
  document name corrispondente: 2026-08-05 13:10 ×2, 2026-07-18, 2026-08-04 15:25), coerenti
  col bug noto del resolver (`check-docs.ts:268` vs `:313`).
- **[nota] E-route ha toccato `irTypes.ts` e `irEdgeViews.ts` solo nei commenti**: deviazione
  innocua dal perimetro dichiarato, registrata qui.
- ~~Domanda aperta: ramo attivo del gate `registerEdgePath`~~ **CHIUSA con la voce 3**:
  nessuna registrazione per gli edge non ortogonali, il crossing detection li ignora.
  Registrato in `docs/decisions.md`.
- **[precisione check:docs]** Su contenuto committato, Check B fallisce su **3** entry, non 2:
  le due del 2026-08-03 più la entry migration del 2026-08-05 (Corregge `2026-07-18` senza
  orario). È esattamente ciò che la normalizzazione pendente nel working tree corregge.

## Documenti aggiornati

- `contesto_progetto.md` (deroga; poi chiusura E-route) e `claude/mappa_sintassi_concreta.md`
  (Routing ✅, rehydration allineata): **entrambi con lo SHA pre-amend, da correggere**.
- Questo checkpoint (v2).

## Prompt generati / riconsegnati

- `claude/2026-08-06_prompt_eroute_routing_autorabile.md` — ✅ eseguito (`423f19f01`)
- `claude/2026-08-06_prompt_voce3_decisions_md.md` — **aggiornato con lo SHA post-amend**,
  da eseguire DOPO la voce 2
- Voce 1 riconsegnata con nota di rilancio — ✅ consumata come audit (guard della fotografia
  ha fermato la riesecuzione; gate riconfermati su HEAD)
- Voce 2 riconsegnata (`2026-08-05_prompt_voce2_trappola_gitignore.md`) — da eseguire con
  l'adattamento descritto sopra

## Prossimi passi

1. **Micro-commit della normalizzazione del log** (ancora non fatto: al commit della voce 3
   è stata tenuta fuori dallo staging col pattern §6.1 e riapplicata, byte-identica).
2. **Voce 2 adattiva** (come sopra): resta anche da accertare che fine abbia fatto la
   modifica pendente a CLAUDE.md root (committata, con trappola scattata sulle 156 righe, o
   revertita).
3. **Micro-commit `chore: regenerate AGENTS.md`** (`npm run gen:agents` + `git add AGENTS.md`)
   DOPO la voce 2: copre in un colpo l'edit di voce 3 e l'eventuale edit di voce 2.
4. Scrittura del prompt della voce 4 (barra 1.5 su strada B), in chat nuova: leggere prima
   `ratifiche_2026-08-04_tab_partizione.md` per la partizione esatta dei tab.
5. Voce 5: verifica visiva unica e chiusura coda (poi RC-7). Push del branch.
6. In chat: consolidare contesto + mappa (SHA `423f19f01`, voce 1 e voce 3 chiuse, R-B12
   chiuso, bug nuovi, AGENTS.md).

## Cronologia

Notte: richiesta "style degli edge" riconosciuta come E-route (discovery 2026-08-03,
R-B1..R-B12 già ratificate); deroga d'ordine decisa da Alfonso; prompt due-fasi generato ed
eseguito, checklist verde. Mattina: avvio coda; il rilancio della voce 1 scopre che era già
eseguita (i due commit con i messaggi esatti della Chiusura); audit sul codice conforme; gate
rieseguiti su HEAD tutti in baseline; risolto il giallo `423f19f01` = amend di `5b2cb2f60`;
aggiornato il prompt della voce 3; direttive per micro-commit log e voce 2 adattiva. Poi:
voce 3 eseguita fuori ordine ma senza danni (`061be4b5c`, decisions.md 73 righe, R-B12
chiuso sul secondo ramo, rinvio in regola 16), AGENTS.md segnalato disallineato; questo
checkpoint v3.

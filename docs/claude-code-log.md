# Claude Code Session Log

Newest-first per day (R-RAIL-45, docs/HARNESS-DOCS.md): a new entry goes right under this line. Never append at the bottom.

**Incidenti — sanatoria batch L1–L4 (2026-09-02).** Tre commit del batch portano un
contenuto che il loro messaggio non descrive. Nessun rewrite di history: e' stato un
rewrite su albero condiviso a causare il secondo incidente. Formato «SHA -> contenuto reale».

- `50de03252` — messaggio: «la entry SAVE1-bis, il timer che non sopravvive all'errore».
  Contenuto reale: la sola entry **DIRTY1**.
- `f278cf4fb` — messaggio: «la entry DIRTY1, scritta dalla corsia L4». Contenuto reale:
  le entry **SAVE1-bis + DIRTY1**, entrambe.
- `ed5c80daa` — referto UNQ1 C5 che cita l'hash del codice sbagliato (`46a38022`, tolto dal
  ramo dal `reset` di un'altra corsia). Corretto in `ca0adaf95`, che lo riporta a `4bde4359`.

## 2026-09-03 — docs: discovery on AI surfaces, providers and system prompts
**Prompt**: inventario read-only delle superfici AI (Jjodie, trasformazioni, documentazione, altro), del pannello Providers e dei system prompt, per la sezione «AI in Jjodel» dei docs.
**Files touched**: `docs/discovery/discovery_2026-09-03_ai_surfaces_inventory.md` (nuovo), `docs/claude-code-log.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice letto in scrittura, Fase 1 read-only.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: non applicabile — deroga P8 dichiarata nel prompt, nessun pixel cambia.
**Notes**: `frontend/src/ai/` non esiste (client: `services/AIProviderService.ts`, registro `types/jodie.ts`): regola 15 dichiarata, non applicata come stop perche' trovare quei path era l'oggetto della discovery. Il blocco di entry del prompt e' in italiano e privo di sei campi di §21.2: scritto nel formato canonico. Findings nel referto, §2-§6.
**Prompt document name**: 2026-09-03 22:20

## 2026-09-03 — docs(log): §6.1 chiusura batch 2026-09-02 (BOOT1, VIEW1, VER2, SAVE2, DOC2)
**Prompt**: §6.1 di chiusura del batch del 2 settembre a repo fermo: spostare verbatim le otto
entry dalle cinque inbox al log attivo, cancellare le inbox, committare il checkpoint del 3/9 e
questo prompt, accertare (non chiudere) lo stato di EGO1 in indice. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` + `docs/log-inbox/` cinque file rimossi
(`c1118d86c`), `docs/sessioni/sessione_2026-09-03_ricostruzione.md` +
`docs/prompts/claude_2026-09-03_1143_chiusura_61_inbox_e_checkpoint.md` (`d9e2480cb`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (a)
**Regressions**: no — nessun file di codice toccato. `check:docs` 3/3 con le stesse 2 warning
pre-esistenti (i due `Corregge: 2026-09-01 23:20` di SAVE1-bis e DIRTY1) prima e dopo ogni
commit; nessuna warning nuova dalle otto entry spostate.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Due premesse del prompt smentite dalla misura, entrambe innocue. (1) Il log attivo
teneva 10 entry, non 9: attivo 10 -> 18 con le otto, non 17; rotazione comunque saltata
(soglia 40). (2) **EGO1: l'indice e' vuoto** — `git diff --cached` a zero al gate, nessun
revert staged da accertare; l'hard stop del punto 4 non ha oggetto. Entry spostate verbatim,
nessun emendamento; nessun file di appoggio, nessuna copia del log (RC-13-bis).
**Prompt document name**: 2026-09-03 11:43

## 2026-09-02 — fix(topbar): l'ultimo salvataggio si legge da ogni tab (DOC2)
**Prompt**: DOC2 punto 4 — l'indicatore di SAVE2 sta nella tab sbagliata: l'autosave lo innesca il canvas, ma lo stato si legge solo dal Data Manager.
**Files touched**: `frontend/src/components/topbar/LastSavedIndicator.tsx` (nuovo), `frontend/src/common/libraries/lastSaved.ts`, `frontend/src/common/libraries/__tests__/lastSaved.test.ts`, `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx`, `frontend/src/components/abstract/tabs/instanceManagerTab.scss`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/components/navbar.scss` — commit `defb3a112`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (a)
**Regressions**: no — `tsc` 33 su output completo (baseline esatta, 0 nei sette file), `build` exit 0 col solo avviso di chunk-size, `vitest` 3216 verdi / 0 falliti (era 3207; i 9 file `window is not defined` sono pre-esistenti, riverificati su HEAD).
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required — nessun file di §3.1, nessuna scrittura D-layer: si consuma un CustomEvent gia' emesso.
**Smoke visivo**: passato — sonda `_tmp_doc2_smoke.ts` sull'app vera, 15 PASS / 0 FAIL, `pageerror` 0. Trascinamento reale su v2-flow -> autosave alla quiete -> «Saved just now» in topbar; Data Manager a zero occorrenze; sporco «Unsaved, last saved just now».
**Notes**: Spostato, non duplicato: una resa sola. `formatLastSavedLabel`/`subscribeLastSaved` escono da `lastSaved.ts` perche' i test li ESEGUANO — le asserzioni sul sorgente di SAVE2 erano verdi con l'indicatore nella tab sbagliata (P11). 3 mutazioni, 2 rossi ciascuna. **Deroga regola 19** (7 file, RC-11) e ai test di SAVE2, che il punto 4 rende falsi. Topbar 50px, non 60 come dice il prompt (`_layout.scss:17`, `b4cba749e`).
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs: P11 e il censimento dei numeri normativi stantii (DOC2)
**Prompt**: DOC2 punti 2 e 3 — normare la sonda che non esegue il soggetto, e censire i numeri normativi rimasti indietro.
**Files touched**: `docs/PROTOCOL.md`, `docs/discovery/discovery_2026-09-02_doc2_numeri_stantii.md` (nuovo) — commit `29322514d`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — solo documenti; `check:docs` 3/3 con 2 warning before e after, `check:agents` PASS, `AGENTS.md` non si e' mosso.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: P11 in coda e non dentro P7/P8: i prompt citano le clausole per numero e inserirla in mezzo rinumererebbe le citazioni. Fuori dal blocco di P9 verificato byte a byte; `P1..P10` in testa diventa `P1..P11`. Censimento: 3 voci stantie su 8 verificate — il `1000ms` ricopiato in `projects.ts:105`, il totale `vitest` 3147 dei prompt (reale 3207), il range `P1..P9` di `CLAUDE.md`. Nessuna corretta: e' una lista.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs(editor-v2): il docstring dell'autosave punta alla costante (DOC2)
**Prompt**: DOC2 punto 1 — il blocco ratificato di `useLayoutAutosave.ts` dice ancora «fires 1000ms after the gesture» dopo SAVE2.
**Files touched**: `frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts` — commit `1a4502151`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — il diff e' un solo blocco di commento; `tsc` 33 su output completo, 0 nel file toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — commento, nessun codice eseguibile.
**Smoke visivo**: non applicabile
**Notes**: Il ragionamento sulla silenziosita' non e' riscritto: vale a fortiori a 15 s, che e' piu' lontano di 1000 ms dalla finestra di coalescing. Il numero non e' duplicato — il blocco cita `AUTOSAVE_DEBOUNCE_MS`/`AUTOSAVE_MAX_WAIT_MS`, che vivono in `useLayoutAutosave.ts` stesso (:71, :84) e **non** in `layoutAutosaveScheduler.ts` come diceva il prompt. `CLAUDE.md` non toccato: nessun hard stop.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — feat(editor-v2): l'ultimo salvataggio in testata al Data Manager (SAVE2)
**Prompt**: diradare l'autosave del layout, togliergli la notifica, e mostrare da qualche parte quando il progetto e' stato salvato l'ultima volta.
**Files touched**: frontend/src/components/abstract/tabs/InstanceManagerTab.tsx, frontend/src/components/abstract/tabs/instanceManagerTab.scss, frontend/src/common/libraries/__tests__/lastSaved.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_save2_smoke.ts`, 12 PASS/0 FAIL: «Saved just now» in testata, «Unsaved, last saved just now» col progetto sporco; slate 11px, nessuno sfondo; pageerror 0)
**Notes**: `lastModified` non torna in Redux dopo un save (la sola `SetFieldAction` sta in `Offline.getAll`), e rimettercelo sarebbe un passo di undo per autosave: il timestamp vive in `common/libraries/lastSaved.ts` come `U.isProjectModified` vive su `U`, con evento a ogni scrittura. Riusa `formatRelativeTime` di `types/activity`; nessun quinto formatter. Etichetta «Unsaved» e non la coppia vietata in questo file da A3 di 10c.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(persistance): l'autosave si dirada e smette di notificare (SAVE2)
**Prompt**: diradare l'autosave del layout, togliergli la notifica, e mostrare da qualche parte quando il progetto e' stato salvato l'ultima volta.
**Files touched**: frontend/src/api/persistance/projects.ts, frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts, frontend/src/components/editor-v2/hooks/layoutAutosaveScheduler.ts (nuovo), frontend/src/common/libraries/lastSaved.ts (nuovo), frontend/src/events/registry.ts, frontend/src/api/__tests__/projectsSaveNotification.test.ts (nuovo), frontend/src/components/editor-v2/hooks/__tests__/layoutAutosaveScheduler.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_save2_smoke.ts`: 5 gesti in 10 s -> 0 salvataggi durante, 1 alla quiete, silenzioso, 0 toast; save esplicito -> 1 toast; pageerror 0)
**Notes**: Misurato prima di scegliere N: un save silenzioso costa 235 ms (mediana su 5), tutti in `U.compressedState`, su 499 voci di `idlookup` — 10 gesti a 2 s producevano 6 serializzazioni complete. Trigger (a) idle a 15 s con tetto a 120 s; (b) intervallo+dirty scartato perche' l'orologio puo' cadere fra due gesti. 7 mutazioni tutte rosse. Fuori perimetro: `events/registry.ts` per la regola 25; nessun `git add -A`.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(editor-v2): il gate dello Step 4 concorda con la passata che protegge (BOOT1)
**Prompt**: su un grafo creato da zero il bootstrap non produce archi — tre nodi radice, zero archi, ne' la containment ne' la reference.
**Files touched**: frontend/src/components/editor-v2/hooks/useJjomSync.ts, frontend/src/components/editor-v2/sync/m1EdgeGate.ts (nuovo), frontend/src/components/editor-v2/sync/__tests__/m1EdgeGate.test.ts (nuovo)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (sonda `_tmp_boot1_verifyC.ts`: 10 PASS/3 FAIL prima, 13 PASS/0 FAIL dopo; canvas 3 nodi 2 archi; pageerror 0)
**Notes**: Il grafo esisteva: la premessa «mai avuto un grafo» e' falsa per lo stato osservato. Lo Step 4 e' protetto da un contatore calcolato prima che lo Step 2bis crei i vertici, quindi 0 su un grafo appena ripopolato; lo Step 3 non e' protetto e i suoi archi li disegna. L'asimmetria era il difetto. Referto: docs/discovery/discovery_2026-09-02_boot1_bootstrap_archi.md.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — fix(editor-v2): la create dal manager instanzia vertice e arco sul canvas
**Prompt**: VIEW1, corsia parallela a VER2 — un figlio di containment creato dal Data
Manager esisteva nel modello e non compariva sul canvas. Misurare la divergenza alla riga,
chi possiede l'identita', quanti canvas; scegliere fra (a) simmetria dei percorsi e (b) il
canvas autorita' sul layout, con il punto 3 come discriminante.
**Files touched**: `frontend/src/components/editor-v2/hooks/createAdapter.ts`,
`.../hooks/__tests__/createAdapterFlow.test.ts` (nuovo) — commit `783a8245d`.
Referto: `docs/discovery/discovery_2026-09-02_view1_create_manager_vertice.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: no — `tsc` 33 (baseline esatta, 0 nei due file), `build` exit 0, `vitest`
3147 verdi / 0 falliti (i 9 file `window is not defined` sono pre-esistenti, riverificati,
nessuno nel perimetro). Sonda 13/3 -> 16/0, `pageerror` 0 in entrambe le corse.
**Out-of-scope changes**: no — due file, pathspec esplicito al commit; staged EGO1 e il
perimetro VER2 (`api/persistance/`, `reducer.ts`) non toccati.
**Layer Impact Report**: produced — in chat prima del diff. D-layer (`DVertex.new`,
`DVoidEdge.new2` da un sito nuovo) e canvas v2-flow; nessun file di §3.1 modificato, le due
funzioni erano gia' esportate e gia' chiamate cosi' da `ContextMenu.tsx:371-372`.
**Smoke visivo**: passato — sonda guidata dalla UI vera del Data Manager, 16 PASS / 0 FAIL.
**Notes**: Scelto (a). (b) usciva dal perimetro di visita `model.objects`, ratificato in
CRUD3 F2, e voleva uno Step 4 che riparte sulle scritture di slot, che §3.5 vieta. Nessuna
nozione di canvas attivo esiste (grep vuoto, controllo positivo a 7 file): l'idioma e' primo
match, gia' in due posti. **Deroga P6 (RC-11)**: tipo di commit non indicato, scelto `fix`
invece di chiederlo. Aperto: figlio creato senza canvas non recuperato all'apertura.
**Prompt document name**: PROMPT_VIEW1.md — 2026-09-02

## 2026-09-02 — fix: il riallineamento di `save` non scrive piu' sull'oggetto vivo dello store
**Prompt**: VER2 — misurare quando il riallineamento di `ProjectsApi.save` colpisce `idlookup[id]` invece di un target detached, misurarne il danno, correggere solo se il danno si misura.
**Files touched**: frontend/src/api/persistance/projects.ts, frontend/src/api/__tests__/projectsSaveVersionStore.test.ts, docs/discovery/discovery_2026-09-02_ver2_riallineamento_save.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (c)
**Regressions**: yes
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Non e' il divergence point: l'app sta stabilmente a `transactionDepthLevel === 1` (`reducer.ts:1443` + `BEGIN()` in `COMMIT`), l'azione va in coda e la scrittura colpisce l'oggetto vivo SEMPRE. Misurato: bump fuori dal delta e dalla history (Δ`clonedCounter` 0, Δundo 0, contro +1/+1 del controfattuale). Regressione dichiarata (RC-11): due save entro 300ms condividono un numero. Misure, alternative scartate e residuo in `discovery_2026-09-02_ver2_riallineamento_save.md`.
**Prompt document name**: 2026-09-02 (in chat)

## 2026-09-02 — docs(log): §6.1 chiusura batch VER1 / UNQ1-C6
**Prompt**: §6.1 di chiusura del batch VER1 / UNQ1-C6 a repo fermo, seriale: spostare le tre
entry dalla inbox al log attivo, committare i prompt untracked, iscrivere RC-13-bis in
PROTOCOL, ruotare il log se oltre soglia, e accertare (non chiudere) lo stato di EGO1 in
indice. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` + `docs/log-inbox/` (`8875ddc7f`),
`docs/prompts/` cinque prompt (`be35fde2e`), `docs/PROTOCOL.md` (`7b930bd07`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (e)
**Regressions**: no — nessun file di codice toccato. `npm run check:docs` **3/3, 2 warning**
prima e dopo ciascun commit; Check A resta PASS dopo l'aggiunta di RC-13-bis, che sta fuori
dal blocco verificato byte a byte.
**Out-of-scope changes**: yes — questa entry stessa e' un sesto commit oltre i cinque punti
del prompt, che non ne prevedeva una: P9 la richiede e la sua omissione e' gia' stata la
CODA del batch precedente.
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Deroga dichiarata: la `Notes` di VER1 era 878 caratteri, Check C in ERROR;
accorciata sotto il cap citando `1ac3b1863`. Entry del batch corrente, stessa sessione, non
back-filling. Attivo 6 -> 9 entry, rotazione saltata (soglia 40). Accertamento EGO1: l'indice
non tiene lavoro in volo, tiene un **revert staged** (-295 righe, la discovery cancellata);
albero e HEAD identici byte a byte, test 24/24. Indice lasciato come trovato.
**Prompt document name**: PROMPT_6.1_chiusura_VER1_C6.md — 2026-09-02

## 2026-09-02 — fix(problems): l'appartenenza al modello e' un campo su NodeProblem
**Prompt**: UNQ1 C6, corsia L2 parallela — chiudere il terzo punto di §C5.4: un campo
opzionale additivo su `NodeProblem` che nomini il modello di appartenenza, scritto da
**entrambi** i produttori, e la revoca che lo usa al posto di `ownedIdsByModel`, se e solo
se tiene il caso dell'elemento cancellato che §C5.2 tiene.
**Files touched**: `frontend/src/components/editor-v2/problems/registry.ts`,
`.../problems/UniquenessProblemSync.tsx`, `.../problems/ConformanceProblemSync.tsx`,
`.../problems/__tests__/UniquenessProblemSync.test.ts` (commit `bc939442b`).
Referto in coda a `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (`e153c8fe2`).
Coda `7f8fa2242`: tre puntatori di riga della nota, scritti contro i file prima della
modifica. **Deroga RC-13 dichiarata (RC-11)**: quel commit tiene `registry.ts` e il referto
insieme — stessa correzione, sole righe di commento, ma e' un commit misto.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — sonda `_tmp_unq1c6.ts`: le sette righe della tabella di C5.3 verdi
prima **e** dopo, `pageerror` 0 in entrambe le corse; `tsc` 33 (baseline esatta, 0 nei
quattro file), `build` exit 0, `vitest` 3131 verdi / 0 falliti (i 9 file `window is not
defined` sono pre-esistenti, riverificati, nessuno nel perimetro).
**Out-of-scope changes**: no — quattro file, sotto la soglia dei cinque, pathspec esplicito
al commit; staged EGO1 e WIP VER1 in `api/persistance/` non toccati.
**Layer Impact Report**: not-required — il registro dei problemi e' una `Map` di modulo
lato UI: nessuna scrittura D-layer, nessun proxy L, nessun TRANSACTION, nessuna persistenza.
**Smoke visivo**: passato — sonda 22 PASS / 0 FAIL contro il dev server (prima: 15/7).
**Notes**: `ownerModelId`, non `modelId`: la conformance registra anche sull'id del
`DVertex`, che vive nel grafo non nel modello, e per l'unicita' il valore e' il `DModel` di
un metamodello quando e' un metamodello a essere aperto. Punto 4: `ownedIdsByModel`
**rimossa** — scritto alla registrazione, il campo tiene l'elemento cancellato perche'
l'owner e' nel dato. Test 7 -> 12, quattro mutazioni rosse. Censimento lettori, nome e
misure in §C6.1-C6.4 del referto. Deroga RC-13 in `7f8fa2242`, sopra.
**Prompt document name**: PROMPT_UNQ1-C6.md — 2026-09-02

## 2026-09-02 — fix(persistance): save riallinea project.__raw dopo il bump di versione
**Prompt**: VER1 (corsia L1, parallela) — `ProjectsApi.save` legge la versione da un `__raw`
stantio: due save espliciti sullo stesso `LProject` producono `1.1` due volte. Riprodurre con
una sonda contro il dev server, censire i lettori di `version`, correggere nel punto minimo,
test unitario accanto a quello DIRTY1 e invertire l'asserzione che il difetto lo registrava
com'era. Non toccare la regola ratificata 2026-08-24 (il silent save resta senza bump).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts`,
`frontend/src/api/__tests__/projectsSaveVersion.test.ts` (nuovo) — commit `1ac3b1863`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `tsc --noEmit` **33** sull'output completo (baseline invariata), **0** nei
file toccati; `build` exit 0 col solo warning di chunk; `vitest` intera **3131 passati, 0
falliti**, i 9 file che non si raccolgono riverificati su un worktree staccato su HEAD e
risultati **identici** (stessa lista, `window is not defined` in `monaco-editor/.../window.js:14`
e `src/utils/PerformanceMetrics.ts:220`, nessuno dei due toccato).
**Out-of-scope changes**: no — l'inversione del test DIRTY1 è la stessa correzione, chiesta dal
prompt.
**Layer Impact Report**: not-required — nessun file della critical zone §3.1: `projects.ts` non
è in elenco, non passa da `useJjomSync`/`syncState`/`canvasToJjom`/`portDistribution`/
`VersionFixer`, e la scrittura D-layer che tocca è il `SetFieldAction` già presente, invariato.
**Smoke visivo**: non applicabile — nessun pixel cambia; la verifica è la sonda
`_tmp_ver1_verify.ts`, **5 FAIL su 7 prima, 0 su 7 dopo**, stabile su due corse.
**Notes**: Causa misurata: il reducer copia lungo il path (`reducer.ts:540`), `idlookup[id]`
diventa un oggetto nuovo e il proxy resta sul precedente. Nessun lettore dipende dal valore
stantio. Tre mutazioni rosse (6, 2, 8 FAIL). Censimento, alternativa scartata e motivazione
in `1ac3b1863` e nel commento di `projects.ts:140-162`. Notes accorciata in §6.1 sotto il cap
§21.2: entry del batch corrente, stessa sessione, non back-filling.
**Prompt document name**: PROMPT_VER1.md — 2026-09-02

## 2026-09-02 — chore(gates): Check B accetta solo la forma (x) per Causa
**Prompt**: CODA di chiusura L1–L4, punto 3 — Check B passava sia `**Causa**: (a)` sia
`**Causa**: a`. Restringere alla sola forma parentesizzata, misurando prima le conseguenze
su attivo e archivio. Hard stop se Check B scandisse anche l'archivio (il «no back-filling»
vieterebbe di emendare le entry pregresse).
**Files touched**: `frontend/scripts/gates/check-docs.ts` (commit `c9bd6112a`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run check:docs` **3/3, exit 0, 2 warning** prima e dopo, invariati.
Nessun file applicativo, nessun impatto su build o typecheck.
**Out-of-scope changes**: no — un solo file, pathspec esplicito.
**Layer Impact Report**: not-required — script di gate, nessun layer applicativo.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: Check B scandisce il solo log attivo; l'archivio serve a risolvere `Corregge`,
non viene lintato: nessuna entry pregressa toccata, niente hard stop. `Corregge` non prende
una lettera ma `YYYY-MM-DD HH:mm`, già vincolato da `TIMESTAMP_PREFIX`: la restrizione vale
per la sola `Causa`. Forme in archivio: **118 `(x)`, 8 nude, 3 di prosa**. Controllo positivo
`Causa: e` → ERROR. Il gate non ha test: dichiarato, non creato.
**Prompt document name**: PROMPT_CODA_batch_L1-L4.md — 2026-09-02

## 2026-09-02 — docs(log): chiusura batch L1–L4 (sanatoria, log-inbox, rotazione)
**Prompt**: §6.1 di chiusura del batch L1–L4 a repo fermo, seriale: bonificare l'indice
condiviso, verificare le tre sonde temporanee, scrivere la nota di sanatoria dei commit
mal-messaggiati, correggere la `Causa` di SAVE1-bis, iscrivere in P9 la regola log-inbox
per le corsie parallele, ruotare il log se oltre soglia. Nessun file applicativo.
**Files touched**: `docs/claude-code-log.md` (nota di sanatoria, `ff74cee8e`),
`docs/PROTOCOL.md` + `docs/log-inbox/.gitkeep` (regola log-inbox, `061453e65`),
`docs/claude-code-log.md` + `docs/claude-code-log-archive.md` (rotazione P9, `0838a303f`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (e)
**Regressions**: no — nessun file di codice toccato, nessun gate di build coinvolto.
`npm run check:docs` (da `frontend/`) **3/3, exit 0** prima e dopo ciascuno dei tre commit,
con i 2 warning non bloccanti preesistenti su `Corregge` di SAVE1-bis e DIRTY1.
**Out-of-scope changes**: no — tre commit tematici, ciascuno per pathspec esplicito.
L'indice conteneva staged della corsia EGO1: lasciato intatto, mai `git add .`.
**Layer Impact Report**: not-required — solo documentazione.
**Smoke visivo**: non applicabile — nessun pixel cambia.
**Notes**: `Corregge` resta `—`: la sessione non rifà il lavoro di una corsia, ne sana il
registro; `Causa` `(e)` è la concorrenza su albero condiviso. La `Causa` di SAVE1-bis non
andava corretta: portava già `(a)` dal commit che ha scritto l'entry (`f278cf4fb`). Le tre
sonde `frontend/scripts/smoke/_tmp_*` cadono in `.gitignore:66`, nessuna promossa.
Rotazione: attivo 49 -> 5, archivio 1025 -> 1069, verbatim per data. Nessun rewrite.
**Prompt document name**: PROMPT_CHIUSURA_batch_L1-L4.md — 2026-09-02

## 2026-09-02 — fix: UNQ1 C5, la revoca duplicate-name resta nel modello scandito
**Prompt**: UNQ1 C5 — la revoca tocca solo le entry il cui owner appartiene al modello che
l'effetto sta scansionando (referto §A.4: revoca globale, produttore per modello, `:160-164`
— aprire M2 cancella le entry M1, e non tornano). Nessuna modifica alla firma, nessun rescan
aggiunto. Perimetro: `UniquenessProblemSync.tsx` + test, NON `LModelElement.tsx` (corsia L1).
Verifica con due collisioni vere insieme, per nome ESPLICITO, before/after.
**Files touched**: `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx`,
`frontend/src/components/editor-v2/problems/__tests__/UniquenessProblemSync.test.ts` (nuovo),
`docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (referto C5, commit a parte).
La sonda `scripts/smoke/_tmp_unq1_c5.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` su output COMPLETO **33**, la baseline esatta, **0**
nei file toccati; `npm run build` exit **0** col solo avviso di chunk-size noto; `npm run
test` intera **3118/3118** passati, 0 falliti. I 9 file che non si raccolgono sono i `window
is not defined` pre-esistenti, fuori da questo perimetro. Due mutazioni: revoca su tutti gli
owned set (il globale di prima) **3 rossi**, ciclo di revoca rimosso **4 rossi**.
**Out-of-scope changes**: no — due file di codice, entrambi nel perimetro. Commit per
pathspec: l'indice conteneva staged di altre corsie (`api/persistance/projects.ts`,
`egoDiagram.*`), non toccati.
**Layer Impact Report**: not-required — nessun file della lista di §3.2 e nessuna scrittura D:
il registro e' una `Map` di modulo, UI-only, immune a undo/redo e non persistita. La
directory `problems/` compare in §3.1, ma il diff non tocca canvas, JjOM ne' D-layer.
**Smoke visivo**: non applicabile — nessun pixel cambia. Misura sul registro con
`_tmp_unq1_c5.ts`, stesso strumento sui due lati, zero `pageerror` in entrambi: **before 9
PASS / 3 FAIL, after 12 PASS / 0 FAIL**. Entry M1 attive dopo l'apertura della tab M2 da **0
a 3**, al ritorno su M1 da **0 a 3**, dopo il rename di uno dei tre da **0 a 2**; le 2 entry
M2 restano 2 in ogni passo di entrambe le corse (controllo). Il before ottenuto ripristinando
il solo file da `git show HEAD:` e rimettendolo a posto da una copia, senza `stash` (RC-13).
**Notes**: `ownedIdsByModel`, `Map` di modulo per-modello: nessun campo su `NodeProblem`,
quindi `registry.ts` e il produttore della conformance restano fermi. Cade
`getRegistryState()`, che leggeva `window._jjNodeProblems` e in env `node` tornava vuota —
per cui la revoca era intestabile. Il corpo dell'effetto e' spostato in
`reconcileDuplicateProblems`, esportata per il test. Aritmetica: per una coppia il rename ne
revoca **due** (2 -> 0); il decremento chiede tre omonimi. Dettaglio nel referto C5.
**Prompt document name**: 2026-09-02 09:20

## 2026-09-02 — fix: UNQ1 F2, l'auto-nome non ombreggia piu' il nome vero di un nested
**Prompt**: UNQ1 F2 — (A) `get_name` (:6081): slot identita' con `values []` -> `data.name`,
auto-nome solo se anche `data.name` e' vuoto, previo censimento dei lettori che contano
sull'auto-nome in finestra; (B) `defaultname`: per un padre `DValue` di containment il
namespace e' quello di `getNamespaceOf`, non `lfather.childNames`; `get_children_idlist` non
si tocca. C1 scartato. Perimetro: `LModelElement.tsx` + il suo test, NON
`UniquenessProblemSync.tsx` (corsia L2).
**Files touched**: `frontend/src/model/logicWrapper/LModelElement.tsx`,
`frontend/src/model/__tests__/unq1AutoNameShadow.test.ts` (nuovo),
`docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (referto F2, commit a parte).
La sonda `scripts/smoke/_tmp_unq1f2_verify.ts` non e' committata (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline esatta, **0**
nel file toccato; `npm run build` exit **0** col solo avviso di chunk-size noto; `npx vitest
run` intera **3118/3118** passati, 0 falliti. I 9 file che non si raccolgono sono i `window is
not defined` pre-esistenti, riverificati sul `LModelElement.tsx` di HEAD: falliscono identici
senza la correzione. Tre mutazioni: guardia di A resa inerte 3 rossi, namespace di B svuotato
3 rossi, `get_name` riportato a HEAD rosso sull'ancoraggio.
**Out-of-scope changes**: no — due file di codice, entrambi nel perimetro. Commit per
pathspec: l'indice conteneva staged di altre corsie (`api/persistance/projects.ts`,
`UniquenessProblemSync.tsx`), non toccati.
**Layer Impact Report**: not-required — nessun file di §3.1. `LModelElement.tsx` e' L-layer
puro; nessuna scrittura D nuova, nessuna TRANSACTION, nessun creatore aggiunto.
**Smoke visivo**: passato — `_tmp_unq1f2_verify.ts` **before 4 PASS / 4 FAIL, after 8 PASS /
0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. Nella finestra i
campioni con `raw != proxy` passano da **9 a 0**; il secondo `Add` senza rinomina da
`Edition_0` a **`Edition_1`**; i duplicate-name attivi col modello aperto da **2 a 0**; le due
root restano `Book_0`/`Book_1` in entrambe le corse (controllo). Il before ottenuto
ripristinando il solo file da `git show HEAD:` e rimettendolo a posto da una copia, senza
`stash` (RC-13).
**Notes**: censimento di A: i tre lettori di `initialName` (`instanceTable.ts:127`,
`shapeDraw.ts:205`, `irReadCtx.ts:173`) lo chiedono tutti **dopo** il nome, nel caso che la
correzione lascia intatto; nessun bloccante. C1 non presa: `get_children_idlist` resta non
ridefinito su `LValue`, e la domanda di §8 del referto resta aperta. Dettaglio, mutazioni e
i tre punti ancora aperti nel referto F2 del discovery citato sopra.
**Prompt document name**: 2026-09-02 00:20


## 2026-09-02 — refactor: «Save & Exit» passa dall'helper, il timer non sopravvive (SAVE1-bis)
**Prompt**: SAVE1-bis — `SaveAndCloseProject` (`Navbar.tsx:508`) usa `saveProjectWithFeedback`
e poi chiude. Il conteggio di «Request timed out» in `Navbar.tsx` va a 0 e il test SAVE1 che
lo pinnava va aggiornato. Opzione all'helper solo se serve. Perimetro: Navbar.tsx,
`common/libraries/saveProject.tsx`, test. NON `api/persistance.ts` (corsia L4).
**Files touched**: `frontend/src/pages/components/Navbar.tsx`,
`frontend/src/common/libraries/saveProject.tsx` (solo commenti),
`frontend/src/common/libraries/__tests__/saveProject.test.ts`. Le sonde
`scripts/smoke/_tmp_save1bis_{verify,diag}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 23:20 (SAVE1)
**Causa**: (a)
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3118/3118** passati, i 9
file rossi falliscono in import (`window is not defined`) e sono preesistenti. Le due non
regressioni che il passaggio poteva rompere sono misurate a schermo su ENTRAMBI i lati (1a,
1b verdi in before e after). Quattro mutazioni sul codice nuovo: tolto il `return` sul
fallimento 1/15 rosso, cambiato l'argomento della chiamata 2/15, reintrodotto un timeout in
Navbar 1/15, chiusura spostata dentro l'`if` 1/15.
**Out-of-scope changes**: no — tre file, tutti nel perimetro. Nessuna opzione aggiunta
all'helper: non serviva, il chiamante sequenzia sul `Promise<boolean>` gia' esistente.
**Layer Impact Report**: not-required — nessun file di §3.1; l'unica scrittura D e'
`SetRootFieldAction('isLoading')` dentro l'helper, che c'era gia'.
**Smoke visivo**: passato — `_tmp_save1bis_verify.ts` **before 21 PASS / 1 FAIL, after 22
PASS / 0 FAIL**, stesso strumento sui due lati, zero `pageerror` in entrambi. L'unico rosso
del before e' 2e, che e' il difetto: dopo un errore di salvataggio arrivava, dieci secondi
piu' tardi, un «Request timed out» spurio (il vecchio `clearTimeout` stava solo sul ramo di
successo). Il before gira sui sorgenti di HEAD ripristinati da `git show` e rimessi da una
copia, **senza `git stash`** (RC-13).
**Notes**: la (a) e' del perimetro di SAVE1, non della sua esecuzione: diceva «due call
site». `U.isProjectModified = false` rimosso e non riscritto: lo azzera gia' `ProjectsApi.save`
(`projects.ts:133`) e poi `CloseProject` (`Navbar.tsx:498`). Al primo giro la sonda dava 5 rossi
FALSI: `window` sostituito a meta' misura, strumenti morti che leggevano zero ovunque. Riarmati
via `addInitScript`, contatori in `sessionStorage` per attraversare il reload della chiusura.
**Prompt document name**: SAVE1-bis (in chat) — 2026-09-02 09:00

## 2026-09-02 — fix(persistance): il dirty flag non lo azzera l'autosave silenzioso (DIRTY1)
**Prompt**: DIRTY1, dal referto SAVE1. In `ProjectsApi.save` la riga che azzera
`U.isProjectModified` sta fuori da `if (!silent)`: dopo un drag di nodo il progetto risulta
pulito e l'avviso «Unsaved changes» alla chiusura non scatta. L'azzeramento entra nel ramo
`!silent`, nessun altro cambio a `save`, before/after. Non `Navbar.tsx` (corsia L3).
**Files touched**: `frontend/src/api/persistance/projects.ts`,
`frontend/src/api/__tests__/projectsSaveDirty.test.ts` (nuovo).
**Outcome**: ✅ completed
**Corregge**: 2026-09-01 23:20 (SAVE1)
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` su output COMPLETO **33**, la baseline, **0** nei
file toccati; `npm run build` exit **0**; `npx vitest run` intera **3091/3091** test passati
(3082 + i 9 nuovi), i 9 file rossi falliscono in import (`window is not defined`) e sono
preesistenti. Nessun chiamante dipendeva dall'azzeramento silenzioso: `saveProject.tsx` e le
tre voci di SAVE1 chiamano `save(project)` senza `opts`, quindi esplicito; l'unico
`{silent:true}` e' `useLayoutAutosave.ts:59`. I gate girano su albero condiviso con altre
corsie (vedi Notes).
**Out-of-scope changes**: no — due file, entrambi nel perimetro. Il commento del metodo,
che elencava `U.isProjectModified` fra le cose identiche nei due casi, e' aggiornato nello
stesso file: lasciarlo sarebbe stato falso.
**Layer Impact Report**: not-required — nessun file di §3.1; la modifica toglie una
scrittura su uno static di `U`, non ne aggiunge nel D-layer.
**Smoke visivo**: non applicabile. La misura e' il test, ESEGUITO e non letto: `projects.ts`
si importa in `environment: node` doppiati i suoi import e stubbato il `window` che
dereferenzia a modulo (`:453`), quindi il flag e' letto DOPO una chiamata vera a `save`.
**Before 6 PASS / 3 FAIL, after 9 PASS / 0 FAIL**, stesso file sui due lati; i 3 rossi del
before sono le sole asserzioni sul silent save. Quattro mutazioni tutte rosse: riga rimossa
4/9, condizione invertita 5/9, ramo Offline/Online saltato 6/9, version bump anche sul
silent 1/9.
**Notes**: riga misurata `api/persistance/projects.ts:133:9` — il prompt citava
`api/persistance.ts`, che non esiste (regola 15). Il difetto `version` che non avanza fra
due `save` sullo stesso `__raw` e' fuori perimetro: registrato in un test che lo asserisce
COM'E' (`1.1` due volte), cosi' il giorno che verra' corretto quel test diventa rosso.
Altre corsie comparse in albero a meta' sessione: constatate e lasciate, commit per
pathspec sull'indice altrui gia' staged (RC-13).
**Prompt document name**: DIRTY1 (in chat) — 2026-09-02 00:20

## 2026-09-02 — discovery: appendice UNQ1 F1, il «2» del tree conta figli (Q5/Q6)
**Prompt**: aggiunta a UNQ1 F1, dallo screenshot post CHECK 6: Book_0 con due figli
rinominati a nomi distinti, badge 2 nel tree, form «No issues», canvas pulito. Q5 il badge
aggrega i problemi dei discendenti sul padre, e da quale registro; Q6 il badge resta dopo
save + reload. Zero file di prodotto, sonde `_tmp_unq1_*`, nessun fix.
**Files touched**: `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` (appendice
§A.0-§A.6 in coda al referto esistente, R-E/E-1: non riscritto). Zero prodotto. Le sonde
`scripts/smoke/_tmp_unq1_{badge,ctrl,form}.ts` non sono committate (`.gitignore:66`).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — nessun file di codice toccato; le sonde girano contro il dev server
e non modificano sorgenti, zero `pageerror` in tutte e tre.
**Out-of-scope changes**: no — un solo file, il referto.
**Layer Impact Report**: not-required — discovery read-only, nessun diff su §3.1.
**Smoke visivo**: non applicabile. Sonde: `_tmp_unq1_badge` 14/16, `_tmp_unq1_ctrl` 7/9,
`_tmp_unq1_form` 3/4. I due rossi di `_tmp_unq1_ctrl` sono il difetto di §A.4 scritto come
comportamento corretto; i due di `_tmp_unq1_badge` sono un controllo positivo che NON e'
partito (misura rotta, non un negativo) e sono stati rifatti in `_tmp_unq1_ctrl`, dove
passa; quello di `_tmp_unq1_form` e' l'asserzione che cercava «duplicate» dove la form
rende «1 warning».
**Notes**: il badge conta figli, non problemi: `instance.children.length`
(`TreeViewContent.tsx:891`), misurato 2/3/5 su padri con 0/0/2 entry attive. `FeatureRow`
non legge `_jjNodeProblems`; l'unico lettore dell'albero e' `EntityRow` (`:719-720`), per
il proprio id. I warning non sopravvivono al rename. Dopo il reload il badge resta perche'
restano i figli. Due fatti nuovi in §A.4 e §A.5. Referto per il resto.
**Prompt document name**: UNQ1 F1 aggiunta (in chat) — 2026-09-02 00:00


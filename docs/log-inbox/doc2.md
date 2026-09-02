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

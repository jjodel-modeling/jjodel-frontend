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

**Incidente — discovery parallele del 2026-09-13.** Due sessioni sullo stesso albero, entry
scritte nello stesso file prima di committare.

- `46f4f584d` — messaggio: «the simulation engine state discovery and its log entry».
  Contenuto reale: il report del motore e **due** entry, la sua e quella della discovery JjEL
  (`claude_2026-09-13_0100_...`), gia' su disco al momento del commit.
- `2d420c64f` — il solo report JjEL; la sua entry era gia' in `46f4f584d`.
  Lezione: due corsie parallele committano il log una alla volta, ciascuna dopo aver riletto la
  testa; lo stesso file non si mette in due commit sovrapposti.

**Incidente — log committato da un'altra corsia, 2026-09-16.** `9f0843325`, messaggio «log entry for
the Create View gate fix»: contenuto reale **due** entry, la sua e quella della discovery
rail/modale, gia' in albero e non in stage al momento del commit. Stesso schema del 2026-09-13.
Nessun rewrite: la entry resta dov'e', il suo commit non la nomina.

## 2026-10-01 — merge: activity-bar-7 into alfonso-frontend-jjtl (P-2026-10-01-2254)
**Prompt**: `claude_2026-10-01_2254_prompt_merge_activity-bar-7.md`, a direct merge by `lane-run merge --direct`, no session: `activity-bar-7` into `alfonso-frontend-jjtl`; the worker stopped `blocked` on one red vitest gate and left the merge commit `93dd39879`; closed by hand by the chat (P9).
**Files touched**: merge `93dd39879` from the branch side (P-2026-10-01-2230: `viewpointDerivation.ts`, `activityUml.test.ts`, the report, R-VP-36, the entry in this inbox, the prompt); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `93dd39879` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6411 tests in 258 files, 9 red at import, 1 failed, files not as expected `reLayoutWatcher.test.ts` and `getByNameKey.test.ts`; build exit 0; check:docs, check:agents, check:scripts, check:addonly exit 0. The gates ran at load average about 300 with swap 31.4 of 32 GB (four lanes and the worker at once). Re-run of the two files on `93dd39879` at load 6.7, 23:25: 13 passed, 0 failed. Load-induced.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: accepted by the chat on the lane's DOM measures (fork and join node 7×120, painted 5×118; four default scenes 0 px); crops not inspected by the chat, Alfonso's look pending.
**Notes**: Rollback tag `pre-activity-bar-7` on `ac3890b7e` (RC-31). Worker and gates: `~/.jjodel-lanes/P-2026-10-01-2254/result.json`. A saved derived viewpoint keeps the 5 px bar until deleted and derived again. Ticket: the merge gate ran a full vitest while four lanes ran; the lane auto rule of no new lane above load 20 does not cover a merge worker, which should wait for the load too.
**Prompt document name**: 2026-10-01 22:54
## 2026-10-01 — fix(derive): Activity fork and join bar declared 7 px (P-2026-10-01-2230)
**Prompt**: `claude_2026-10-01_2230_prompt_activity_bar_7px.md`, light tier, Phase 1 and 2 in cascade on `~/jjodel-w-forkbar`, branch `activity-bar-7`. Alfonso's answer of 2026-10-01 to the 2026-09-30 question, «7»: `ACTIVITY_BAR_SIZE` 5×120 to 7×120, so the bar paints 5×118 instead of 3×118. Decision row R-VP-36, amending R-VP-26 (2) on the thickness only.
**Files touched**: report `690ca002e`: `docs/discovery/discovery_2026-10-01_activity_bar_7px.md`. Code `c3b0556d6`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, `.../derive/__tests__/activityUml.test.ts`, `frontend/src/components/editor-v2/nodes/__tests__/nodeSizing.test.ts`. This commit: the report (Phase 2 addendum), `docs/decisions.md` (R-VP-36), this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 17:20 (`claude_2026-09-30_1720_prompt_activity_sizes.md`, its open item (b): the bar paints 3 px at the declared 5)
**Causa**: (a)
**Regressions**: no. Gates on `c3b0556d6`: typecheck exit 2, 14 errors, the §17 set; vitest 258 files, the known 9 red at import, 6411 of 6411 tests passed; build exit 0. Tests 2 of 47 red first, then green. Mutation bench 16/16, controls 243/243. Probe on 3090, light: base (constant at 5) 8/8 and after 17/17; the four default scenes 0 px, byte-identical to the base run.
**Out-of-scope changes**: no — seven files over two commits, above five (RC-11, rule 19): the three code files and the four docs files, each named in the prompt's DOVE, which is taken as the confirmation; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required (`viewpoint/derive/` is not in the §3.1 table)
**Smoke visivo**: passato (lane probe 17/17, crops in `frontend/scripts/smoke/_tmp_forkbar_crops/`, gitignored; the visual GO of the chat and Alfonso is pending)
**Notes**: Fork and join measured node 7×120, painted 5×118. A saved derived viewpoint keeps 5 until derived again (R-VP-25's precedent); report H3, read not run. The base probe ran with the constant temporarily at 5, restored, `git diff HEAD` empty. The merge waits for the visual GO. Report: `docs/discovery/discovery_2026-10-01_activity_bar_7px.md`.
**Prompt document name**: 2026-10-01 22:30

## 2026-10-01 — merge: update-depth-loop into alfonso-frontend-jjtl (P-2026-10-01-2029)
**Prompt**: `claude_2026-10-01_2029_prompt_merge_update-depth-loop.md`, a direct merge by `lane-run merge --direct`, no session: `update-depth-loop` at `347eeb6c1` into `alfonso-frontend-jjtl`, merge base `4b018b82b`, 4 commits on the branch side.
**Files touched**: merge `a952056bb`: 6 files from the branch side (`docs/discovery/discovery_2026-10-01_update_depth_loop.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-10-01_1655_prompt_update_depth_loop.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useContentSizeLoop.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a952056bb` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6411 tests in 258 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat smoke on 3001 (Chrome, light): Notation Demo / model_1 loads on the trunk with the fix, 12 nodes and 12 edges rendered, no Maximum update depth, no CanvasErrorBoundary fallback, no console error. The crash itself was verified by the lane probe (0/7 fresh pages, 240 drags, 0 crashes; scenes 9/9 byte-identical). GO.
**Notes**: Rollback tag `pre-update-depth-loop-P-2026-10-01-2029` on `649feda48` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-01-2029/result.json`.
**Prompt document name**: 2026-10-01 20:29

## 2026-10-01 — ticket: criticalZone.test.ts reads the ambient go-ahead variable
**Ticket**: Four tests of `frontend/scripts/hooks/__tests__/criticalZone.test.ts` (permission_mode, RC-19) fail when the full suite runs inside a lane launched with `--critical-zone-goahead`: `JJODEL_CRITICAL_ZONE_GOAHEAD` leaks from the session into the test. 70/70 with the variable unset. The test should clear it in its own setup.
**Priority**: low
**Found in**: P-2026-10-01-1655

## 2026-10-01 — ticket: the trigger of the update-depth cascade is still unconfirmed
**Ticket**: The «Maximum update depth exceeded» of P-2026-10-01-1655 was reproduced 4/10 on fresh pages (hand-made FlowChart, Generic derived viewpoint, the third drag) and measured as a useSyncExternalStore consistency cascade (`updateStoreInstance → forceStoreRerender`, 60/60 stacks) with EditorV2's `edges` state moving on every nested render; neither the subscriber nor the edges writer was named before the fix made it unreproducible (0/7). The probe's uSES recorder is ready; re-run it on `4b018b82b` code to name both.
**Priority**: medium
**Found in**: P-2026-10-01-1655
**Detail**: docs/discovery/discovery_2026-10-01_update_depth_loop.md (§3.4, §9)

## 2026-10-01 — fix(editor-v2): bound size writes, keep edges, catch canvas loops (P-2026-10-01-1655)
**Prompt**: `claude_2026-10-01_1655_prompt_update_depth_loop.md`, Phase 1 then 2, heavy, RC-30 go-ahead. «Maximum update depth exceeded» dragging under a «FlowChart (derived)» viewpoint: reproduce, root cause, fix, a canvas safety net. Stopped by the chat at 120 min; resumed with its order (report first, 20 min to confirm, else close every unbounded path).
**Files touched**: docs `14c343ac4`: `docs/discovery/discovery_2026-10-01_update_depth_loop.md`. Code `140a5d366`: `viewpoint/ir/useContentSize.ts`, `viewpoint/ir/__tests__/useContentSizeLoop.test.ts` (new), `EditorV2.tsx`. This commit: this entry, the report's addendum, the Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: unknown — `npx tsc --noEmit` 14, the §17 set; vitest 6365 passed, 4 red in `criticalZone.test.ts` only under this session's `JJODEL_CRITICAL_ZONE_GOAHEAD` (70/70 unset), the 9 known import reds; build exit 0; mutation bench 6/6; scenes 9/9 byte-identical to the pre-fix code.
**Out-of-scope changes**: no — the files the report names (§5).
**Layer Impact Report**: produced (report §6, committed in `14c343ac4` before the diff)
**Smoke visivo**: passato — probe, unattended: 0/7 fresh-page crashes (before 4/10), 240 drags on four derived viewpoints 0 crashes, nested depth max 3; Alfonso's GO pending (RC-23)
**Notes**: Root cause not confirmed: the loop is a useSyncExternalStore consistency cascade with EditorV2's edges moving on every nested render; the hook wrote 0 times in it. The fix closes the reachable unbounded paths and adds `CanvasErrorBoundary`; the residual risk is in the report §9. EditorV2's two changes are covered by the probe only (the file does not import in the bench).
**Prompt document name**: 2026-10-01 16:55

## 2026-10-01 — fix(#157): solo i tipi creabili alla radice hanno «New» e si possono segnare (R3); guida di test corretta (R7)
**Prompt**: chat di Juri: «prosegui con r3 e r7», con lo screenshot di Certification Design (CompetencyCluster dentro Domain, Activity dentro AssessmentBlueprint). Referto: `discovery_2026-10-01_157_r3_rootable_types.md` (`ef8defa3b`).
**Files touched**: `3ae38ec33`: `joiner/environmentConfig.ts`, `joiner/__tests__/environmentConfig.test.ts`, `envgen/steps/MetaclassesStep.tsx`, `envgen/EnvGenWizardModal.scss`, `environment/ConfiguratorTab.tsx`. Fuori dal repo: guida #157 issuecomment-5814908905 aggiornata; issue #166 aperta su richiesta di Juri.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (c)
**Regressions**: no — `npx tsc --noEmit` **14**, insieme della baseline; build exit 0; unit 32/32; sonde 157/158 28/28 e R5 18/18 rieseguite.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; `LClass.rootable` solo letto.
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12; sonda R3 15/15 con screenshot del wizard.
**Notes**: Misurato prima del fix: «New» su Phase (composta da Scenario) creava `Phase_1` alla radice, su una classe astratta un'istanza astratta, senza errore (`forceCreation`). Regola = `LClass.rootable` del core (rispetta l'override del metamodello), non quella del Data Manager. Banchi: senza il gate del Configurator 2 rossi, senza `disabled` nel wizard 1 rosso.
**Prompt document name**: 2026-10-01 (chat)
## 2026-10-01 — feat(#157): il link stand-alone atterra sul Configurator (R5)
**Prompt**: chat di Juri: «passiamo a R5». Decisione UX e mockup di @tmaog (#157, 2026-09-29), quattro scelte di Juri e conferma dei 7 file. Referto: `discovery_2026-10-01_157_r5_consumer_landing.md` (`f404550ec`).
**Files touched**: `984eb7e1b`: `pages/components/Dashboard.tsx`, `pages/dashboard.scss`, `environment/ConfiguratorTab.tsx`, `environment/configuratorTab.scss`, `pages/components/LeftBar.tsx`, `pages/components/Navbar.tsx`, `events/registry.ts`. Sonde `_tmp_157_r5_verify.ts`, `_tmp_157_r5_shots.ts`, non committate.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (a)
**Regressions**: no — `npx tsc --noEmit` **14**, insieme della baseline; build exit 0; 6 test che leggono i file toccati 166/166; sonda 157/158 adattata 28/28.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; solo shell (pagina, colonna, Navbar) ed eventi.
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12; sonda R5 17/17 ×4; screenshot chiaro/scuro. GO di Alfonso da raccogliere (P8).
**Notes**: Il Dock resta montato sotto la pagina (`visibility`), così togliere `&profile=` torna al developer senza ricarica (R9). Due falsi rossi della sonda, entrambi suoi: `hasText` legge il testo maiuscolo del CSS; attendere il flag «Unsaved» già spento faceva ricaricare a salvataggio in corso (P12, ora sentinella `lastModified`). A margine: `dashboard.scss` non ha tema scuro, la LeftBar resta chiara.
**Prompt document name**: 2026-10-01 (chat)

## 2026-10-01 — fix(#157): «Create model» tiene aperto il Configurator; smoke e sonda Playwright sui seguiti del re-test
**Prompt**: chat di Juri: «ho installato Playwright per gli smoke test, verifica il corretto funzionamento». Smoke P8 e una sonda dedicata alle tre corsie del 2026-10-01 (#157 A e B, #158 C).
**Files touched**: `6d35280cd`: `pages/components/Navbar.tsx` (`createM1` con `open` opzionale, default true), `environment/ConfiguratorTab.tsx` (`open` false). Sonda `scripts/smoke/_tmp_157_158_verify.ts`, non committata (`_tmp_*`).
**Outcome**: ✅ completed
**Corregge**: 2026-10-01 16:01 (chat, corsia A)
**Causa**: (c)
**Regressions**: no — sonda 28/28 sul codice corretto; `npm run smoke` GREEN 12/12 prima e dopo la correzione; `npx tsc --noEmit` **14**, stesso insieme della baseline; `npm run build` exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1; `createM1` cambia solo se apre l'editor.
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12 (3 skip dichiarati); sonda Playwright 28/28, console nella baseline.
**Notes**: La sonda ha trovato il difetto: `createM1` apriva l'editor, che nasconde la LeftBar ospite del Configurator (A8 FAIL prima, PASS dopo). Verificati: New per modello del tipo, messaggi dev/consumer/read-only, Save in topbar, wizard → «Unsaved», Done salva, Escape no, link stand-alone dopo reload, Back oltre Phase_0, click sulla riga. A margine: `Checkbox` ha `<label htmlFor={id}>` senza id, il nome non attiva la casella.
**Prompt document name**: 2026-10-01 (chat)

## 2026-10-01 — fix(#157): New per tipo nel modello del suo metamodello; il wizard dichiara il progetto non salvato e Done salva
**Prompt**: chat di Juri: stato di #157/#158 dopo il re-test di @tmaog del 2026-09-29, poi «implementiamo le modifiche segnalate». Decisioni in chat (referto §7): messaggio + «Create model» solo developer, Done salva, Save in topbar per tutti. Referto: `discovery_2026-10-01_157_158_tmaog_retest_followups.md` (`8ec6bf30a`).
**Files touched**: `6b7891bae`: `joiner/environmentConfig.ts`, `joiner/__tests__/environmentConfig.test.ts`, `environment/ConfiguratorTab.tsx`, `environment/configuratorTab.scss`. `dd5fc3663`: `envgen/steps/MetaclassesStep.tsx`, `envgen/steps/ProfilesStep.tsx`, `envgen/EnvGenWizardModal.tsx`, `pages/components/Navbar.tsx`, `pages/components/navbar.scss`, `common/libraries/__tests__/saveProject.test.ts`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (c)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14**, lo stesso insieme della baseline (diff vuoto); vitest environmentConfig 26, saveProject/lastSaved/projectsSaveDirty 46 passati; `npm run build` exit 0 dopo ogni commit. UI non esercitata a runtime.
**Out-of-scope changes**: yes — 10 file in due corsie; `saveProject.test.ts` non era nel referto §4: conta i chiamanti di `saveProjectWithFeedback` in Navbar, da 3 a 4.
**Layer Impact Report**: not-required — nessun file di §3.1 modificato; `createAdapter`, `deleteAdapter` e `createM1` solo chiamati.
**Smoke visivo**: non eseguito — né Playwright né Puppeteer in `node_modules`, nessun dev server; checklist consegnata in chat.
**Notes**: Causa del New inerte: `models[0]` per tutti i tipi, non R3. `modelsForType` risolve per metamodello; lista su tutti i modelli del tipo, New nel primo. Banco: senza il filtro `instanceof` 2/5 test nuovi rossi. Causa (c) anche per B: il copy «saved immediately» e nessuna scrittura del wizard accendeva `U.isProjectModified`.
**Prompt document name**: 2026-10-01 (chat)

## 2026-10-01 — merge: staging-sync into alfonso-frontend-jjtl (P-2026-10-01-2344)
**Prompt**: `claude_2026-10-01_2344_prompt_merge_staging-sync.md`, a direct merge by `lane-run merge --direct`, no session: `staging-sync` (the trunk at `ac3890b7e` plus `origin/staging` at `98ebb132e`, P-2026-10-01-2240) into `alfonso-frontend-jjtl`; the worker stopped `blocked` on two red gates and left the merge commit `54a9b0a12`; closed by hand by the chat (P9).
**Files touched**: merge `54a9b0a12` from the branch side (39 commits of Juri Di Rocco, #157 Configurator and role environments, #158 Data Manager UX, #147 custom provider model; the `LeftBar.tsx` resolution and the report of P-2026-10-01-2240; `076d7da3a`, Status lines on the two #157 prompts from staging); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `54a9b0a12` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6442 tests in 258 files, 9 red at import, 1 failed (`scripts/gates/__tests__/traceMonitor.test.ts`, «a port with a listener is refused»), re-run alone at 23:59: 9/9 passed, the same flake P-2026-10-01-2240 measured on the pre-merge code; build exit 0; check:docs exit 1 on Check D only (42 active entries against 40), cleared by the rotation that follows this commit; check:agents, check:scripts, check:addonly exit 0. Alfonso said yes in chat (23:40) to the «Save» button staging adds to the app bar (RC-26, the demo screen).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: on the branch by P-2026-10-01-2240 (four default scenes 0 px outside the Jjodie button, Data Manager 10/10, Configurator 3/3, left bar 3/3, R-SIM-94 3/4 with one Cancel timeout not reproduced); not repeated on the trunk.
**Notes**: Rollback tag `pre-staging-sync` on `4b9bc5836` (RC-31). Worker and gates: `~/.jjodel-lanes/P-2026-10-01-2344/result.json`. Tickets: `traceMonitor.test.ts` fails under full-suite load; the R-SIM-94 Cancel timeout; nothing pushed.
**Prompt document name**: 2026-10-01 23:44
## 2026-10-01 — merge: origin/staging into staging-sync (P-2026-10-01-2240)
**Prompt**: `claude_2026-10-01_2240_prompt_staging_sync.md`, Phase 1 then Phase 2 in cascade: reintegrate origin/staging (Juri's #157, #158, #147) on `staging-sync`, a branch off the trunk at `ac3890b7e`, both intents kept, gates at baseline.
**Files touched**: `298ce7242`: `docs/discovery/discovery_2026-10-01_staging_sync.md`. `fdfd89ddd` (merge): the 40 staging-side files, conflicts resolved in `frontend/src/pages/components/LeftBar.tsx` and `docs/claude-code-log.md`. This commit: the report's Phase 2 addendum, this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — lane-run probe on 3241, light: scenes 0 px outside Jjodie's button, Data Manager 10/10, Configurator 3/3, left bar 3/3, R-SIM-94 3 of 4 runs; chat check pending
**Notes**: Typecheck 14, vitest 6442/6442 (9 import-red), build 0, check:addonly clean, check:docs D red (42 > 40, union, RC-14). Regressions unknown: one 30 s timeout on the R-SIM-94 dialog's Cancel, not reproduced in two reruns. Details: `docs/discovery/discovery_2026-10-01_staging_sync.md`, Phase 2 addendum.
**Prompt document name**: 2026-10-01 22:40

## 2026-10-01 — merge: jjscript-requeue into alfonso-frontend-jjtl (P-2026-10-01-1926)
**Prompt**: `claude_2026-10-01_1926_prompt_merge_jjscript-requeue.md`, a direct merge by `lane-run merge --direct`, no session: `jjscript-requeue` at `4b001baed` into `alfonso-frontend-jjtl`, merge base `4b018b82b`, 8 commits on the branch side.
**Files touched**: merge `7fcef0bda`: 14 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-01_jjscript_requeue.md`, `docs/log-inbox/jjscript.md`, `docs/prompts/claude_2026-10-01_1725_prompt_jjscript_requeue.md`, `frontend/src/jjscript/__tests__/runFigures.test.ts`, `frontend/src/jjscript/__tests__/scriptValidator.test.ts`, `frontend/src/jjscript/components/RunSummaryDialog.scss`, `frontend/src/jjscript/components/RunSummaryDialog.tsx`, and 6 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7fcef0bda` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6402 tests in 257 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat visual check on the branch tip 4b001baed (localhost:3002, three scoped Jjodie scripts: success summary with line 13 resolved on retry, error summary, dialog fits the Jjodie window); the trunk side changed no file, so the merged tree carries the same code
**Notes**: Rollback tag `pre-jjscript-requeue` on `4b018b82b` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-01-1926/result.json`.
**Prompt document name**: 2026-10-01 19:26
## 2026-10-01 — feat(jjscript): Run defers unresolved commands, one summary closes every Run (P-2026-10-01-1725)
**Prompt**: `claude_2026-10-01_1725_prompt_jjscript_requeue.md`, full lane on `~/jjodel-w-jjsrequeue`, branch `jjscript-requeue`. Petri net script of 2026-10-01: line 9 refused `'Node' is not in 'metamodel_1'` with no wait. R-JS-2 scoped wait, R-JS-3 passes with deferral, R-JS-4 forward refusal out of Run, R-JS-5 no pause, R-JS-6 one summary modal. GO amendment: a deferred `set` superseded by a later succeeded `set` of the same feature is final, not an error.
**Files touched**: report `96c8d4756`: `docs/discovery/discovery_2026-10-01_jjscript_requeue.md`. `5fa749339`: `frontend/src/jjscript/executor/elementWaiter.ts`, `executor/__tests__/elementWaiterScope.test.ts` (new). `daba6e27e`: `executor/runPasses.ts` (new), `executor/__tests__/runPasses.test.ts` (new), `__tests__/scriptValidator.test.ts`, `components/ScriptBlock.tsx`. `1315e15c4`: `components/runFigures.ts` (new), `__tests__/runFigures.test.ts` (new), `components/RunSummaryDialog.tsx` and `.scss` (new), `components/ScriptBlock.tsx`. Closure commit: `docs/decisions.md` (R-JS-2..6), this file (new), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates green: typecheck 14, the known set, before and after. vitest `src/jjscript` went from 454 passed in 16 of 17 files to 496 passed in 19 of 20; `context-binding` is red at import (known). Build exit 0. The `ScriptBlock` wiring and the dialog have no executing test, because the file does not import under the bench, and the visual check is pending.
**Out-of-scope changes**: no. Nine code files, above Rule 19's five: listed in report §6 and confirmed by the GO. The two `runFigures` files, the `elementWaiterScope` test and `RunSummaryDialog` amend the prompt's DOVE in the report, and the GO adopted them.
**Layer Impact Report**: not-required
**Smoke visivo**: non eseguito — the chat runs the visual check on the Petri net script (step 12: no dev server, no probe in this lane)
**Notes**: Mutation benches, in-memory apply and restore: waiter 6/6 killed, `runPasses` 14/15 (R8 equivalent: the Map is filled in line order), `runFigures` 12/12. Repro of the root cause and all D-decisions: report §3.1 and §7. `skipMatchingCreateLiteral` is no longer offered by Run (D7). A stopped Run shows no summary (D11).
**Prompt document name**: 2026-10-01 17:25

**Ticket** (T1, low): `ScriptExecutionWindow` and `JjScriptConsole` are mounted nowhere. Both only appear as exports (`components/index.ts`, `jjscript/index.ts`). Decide whether to adopt `runPasses` and the summary there, or to retire them. Report §3.4.

**Ticket** (T2, medium): the only recovery rule never fires under Jjodie. `RecoveryContext.metamodel` comes from `resolvedTarget`, which is `null` for every Jjodie reply (`ScriptBlock.tsx`, `errorRowFor`), so `literalInAttributeRule` returns at `rules.ts:97`. Read, not measured in the app. Report §3.4.

**Ticket** (T3, medium): the inner `catch` around an `async` `TRANSACTION` is dead. Sites: `set.ts:137-144`, `move.ts:107-114`, `copy.ts:111-118`, `remove.ts:114-121` and `:207-214`. A callback that throws is aborted and never resolves its handler's Promise, so a Run would hang on that command, before and after this lane.

**Ticket** (T4, medium): three silent successes give a Run nothing to defer.
- `create reference … opposite X` drops `opposite`.
- `set r.opposite = X` writes the bare string (`set.ts:406-409`).
- `create class N in P` with P unresolved gets a null father.

**Ticket** (T5, low): `TEMP-DISCOVERY` timing lines are still in the tree and are not this lane's. Sites: `executor.ts:69-73`, `:100-110`, `:141`, `:215-222`. In `ScriptBlock.tsx` they moved verbatim into `executeLine`.

**Ticket** (T6, low): `skippedLinesAsEditorLines` (`components/summaryLines.ts`) has no production caller left, now that `ScriptBlock` no longer mounts the old dialog summary. It is kept under Rule 9, and its test still runs.

**Visual check** (chat, 3002, two scoped Jjodie scripts): passed except the summary dialog. It did not fit the Jodie window: 646 px tall in a 518 px overlay, title and Close clipped. Fixed in `b42924613`: the dialog is capped to its overlay, the content scrolls (`RunSummaryDialog.scss` only). Check of the fix: to the chat.

**Ticket** (T7, low): under R-JS-3 the `PARENT_NOT_FOUND` suggestion «Make sure the parent was created earlier in the script.» (`errors.ts:183`) is misleading, because a forward reference is retried. It still shows on every final `PARENT_NOT_FOUND` whose handler gives no suggestion of its own. Ticket only, no change (chat, 2026-10-01).

## 2026-10-01 — fix(#158): Back torna alla form che era a schermo; il click sulla riga selezionata apre e chiude il vicinato
**Prompt**: chat di Juri: i due seguiti chiesti da @tmaog nella verifica del 2026-09-29 (P3: Back da Antonio deve tornare a Scenario; P5: tutta la riga, non solo il chevron). Referto: `discovery_2026-10-01_157_158_tmaog_retest_followups.md` (`8ec6bf30a`), corsia C.
**Files touched**: `a48ac55c0`: `jjform/nav.ts`, `jjform/index.ts`, `jjform/__tests__/nav.test.ts`, `abstract/tabs/InstanceDetail.tsx`, `abstract/tabs/InstanceManagerTab.tsx`, `abstract/tabs/__tests__/instanceManagerFl6.test.ts`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-28 17:05 (chat, corsia data-manager-ux)
**Causa**: (a)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14**, insieme della baseline; vitest `src/components/abstract/tabs` + `src/jjform` 796 passati; `npm run build` exit 0. UI non esercitata a runtime.
**Out-of-scope changes**: no — i 6 file dichiarati nel referto §4 e confermati prima di scrivere.
**Layer Impact Report**: not-required — nessun file di §3.1; `jjform/nav.ts` è puro, `NavStep` guadagna solo una proprietà opzionale (Rule 11).
**Smoke visivo**: non eseguito — né Playwright né Puppeteer in `node_modules`, nessun dev server; checklist consegnata in chat.
**Notes**: Il figlio inline entra nel path come passo attraversato (`passThrough`): il breadcrumb lo nomina, `backOf` lo salta; cliccato nel breadcrumb diventa una form (`standOn`). Banchi: `backOf` senza ciclo 1 rosso, `standOn` senza clear 2 rossi, `clickRow` ridotto a `selectOnly` 1 rosso (test a testo sorgente aggiornato). Causa (a): P3 del 2026-09-28 aveva scelto l'opposto.
**Prompt document name**: 2026-10-01 (chat)
## 2026-09-30 — merge: activity-decision-merge into alfonso-frontend-jjtl (P-2026-09-30-2220)
**Prompt**: `claude_2026-09-30_2220_prompt_merge_activity-decision-merge.md`, full lane rendered by `lane-run merge`: `activity-decision-merge` at `ea7702a83` into `alfonso-frontend-jjtl` at `79cf837a7`, one `--no-ff` merge commit, merge base `120d97c01`, 39 commits on the branch side against 9 on the trunk (this prompt's included).
**Files touched**: merge `530c18a7e`: the 84 files of the branch side, one resolved by union (`docs/log-inbox/views.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `530c18a7e`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6360 passed in 254 files, 0 failed, the 9 known red at import (expected 6360: trunk 6020 + branch 340); hooks 344 (trunk 344); build exit 0; check:docs 4/4; check:agents PASS; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat `C-2026-09-30-1932`: Alfonso visual GO on activity-decision-merge; `_tmp_actdec_probe.ts` 31/31 on `91333202f`; merge gates green on `530c18a7e`.
**Notes**: Rollback tag `pre-activity-decision-merge` on `34c4df57a` (RC-31), set by `lane-run`. Union: `docs/log-inbox/views.md`, the trunk's 4 headings then the branch's 16, both sides pure appends. Probes 32/32 once, control R-VP-36 absent. Branch count 6337 in 253 files measured read-only in `jjodel-w-actdec`. The Status parenthetical carries the chat's GO, not the template's morning-digest text: the GO reports Alfonso's visual GO.
**Prompt document name**: 2026-09-30 22:20

## 2026-09-30 — merge: activity-decision-merge takes alfonso-frontend-jjtl (P-2026-09-30-2143)
**Prompt**: `claude_2026-09-30_2143_prompt_activity-decision-merge_take_trunk.md`, full lane rendered by `lane-run merge --trunk-into`: the trunk `alfonso-frontend-jjtl` at `120d97c01` into `activity-decision-merge` at `865f53378`, one `--no-ff` merge commit, merge base `62f4ac3fc`, 72 trunk commits against 36 on the branch (RC-14).
**Files touched**: merge `91333202f`: the 63 files of the trunk side, two of them resolved by union (`docs/decisions.md`, `docs/log-inbox/views.md`). This commit: this entry, the Status of this prompt, and the second Status flip of `claude_2026-09-30_1935_prompt_activity_decision_merge.md` asked by the chat's GO.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `91333202f`: typecheck exit 2, 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6337 passed in 253 files (trunk 5997 + branch 340), 0 failed, the 9 known red at import; hooks 344 (trunk 344); build exit 0; check:docs 4/4; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: yes — the second Status flip of P-2026-09-30-1935, outside step 9's list, named by the chat's GO.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat: the branch probe re-run on `91333202f` (3094), `_tmp_actdec_probe.ts` 31/31, no page errors; visual GO by Alfonso.
**Notes**: Union in the prescribed order: R-VP-27..31 (trunk) before R-VP-19..26 and 32..35 (branch); the branch's 2026-09-29 entry follows the trunk's 2026-09-30 ones. Vitest expectation stated as 6336 from a static count; the run gave 6337: one `it` in `erChen.test.ts` runs over two models, so the branch adds 340 (its record: 6245 - 5905). The merge carries the trunk's `canvasToJjom.ts` as its lane left it, no hand edit. Docs read end to end by a subagent.
**Prompt document name**: 2026-09-30 21:43

## 2026-09-30 — feat(views): Activity decision/merge, guard patch, token inside (P-2026-09-30-1935)
**Prompt**: `claude_2026-09-30_1935_prompt_activity_decision_merge.md`, Phase 1 and 2 in cascade on `activity-decision-merge`. Alfonso's review of the Activity (UML) view of DemoFlowB: explicit decision and merge, guards in UML brackets, the token inside the node, action border and bars, the «2», the axis.
**Files touched**: report `d34cded42` + §6 in this commit: `docs/discovery/discovery_2026-09-30_activity_decision_merge.md`. Code `d2e4e7959`: `viewpoint/ir/irJunctions.ts` (new), `viewpoint/ir/irEdgeViews.ts`, `edges/UnifiedEdge.tsx`, `viewpoint/derive/viewpointDerivation.ts`, `sim/SimNodeRunState.tsx`, `sim/simNodeRunState.scss`, `nodes/ObjectNode.tsx`, tests `irJunctions.test.ts` (new), `irActivityRender.test.ts` (new), `activityUml.test.ts`. This commit: the report, `docs/decisions.md` (R-VP-32..35), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 15:52 claude_2026-09-30_1552_prompt_activity_uml_notation.md
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no — fourteen files, all in the DOVE and named by the report (§3): the ten of `d2e4e7959`, the report, `docs/decisions.md`, `docs/log-inbox/views.md`, the prompt file.
**Layer Impact Report**: produced
**Smoke visivo**: lane probe on 3093 31/31, light; the visual GO is the chat's (pending)
**Notes**: Precondition holds (one transition per plain edge, one per step). Typecheck the known 14; vitest 6244/6245 + the 9 known at import, 2 files red under load green alone; build 0; bench 48/50 (the two ObjectNode mutants, probe-only). Documents 79/81 identical, 2 with the guard style. Default scenes 0 px from 30f3d8a81. Points 4-6 change no code (R-VP-35). Report §6.
**Prompt document name**: 2026-09-30 19:35

**Ticket** (observations, low): (1) a decision whose trunk side is shared with an entry sits on the side's slot, 6 px off the action's axis (DemoFlowB with Decision read as an Action). (2) the explicit decision is 36 px, the synthetic 28. (3) the guard overlap between `work` and `d1` persists (the ticket of P-2026-09-30-1552). (4) `ObjectNode.tsx`'s wiring of the inside token is covered by the probe only: the file does not import in the bench.

## 2026-09-30 — fix(views): the Activity final draws the dot-large disc (P-2026-09-30-1720, resume)
**Prompt**: the chat's resume of P-2026-09-30-1720: question 1 of the hard stop adopted (RC-21), scope extended to `viewpointDerivation.ts` (the Activity final's marker, the stale floor comments) and `activityUml.test.ts`; question 2 (the bar painted 3 px) to Alfonso.
**Files touched**: code `ea4a7ae19`: `viewpoint/derive/viewpointDerivation.ts`, `derive/__tests__/activityUml.test.ts`, `nodes/__tests__/nodeSizing.test.ts`. This commit: the report's §7, this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-09-30 15:52 claude_2026-09-30_1552_prompt_activity_uml_notation.md
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no — the two files the GO added and `nodeSizing.test.ts` of the first DOVE.
**Layer Impact Report**: produced
**Smoke visivo**: lane probe on 3087 19/19, light; the visual GO is the chat's, the bar's 3 px Alfonso's (pending)
**Notes**: Bull's-eye as derived: disc 14 px on the 24 px node. Documents: 78 of 81 lists identical to ca3e41a92, the 3 Activity lists equal with dot -> dot-large. Gates: typecheck 14; vitest 6209/6213 (known 9 + 4 criticalZone, 70/70 unset); build 0; bench 19/19. The earlier entry of this lane stays as written (add-only, RC-34): this one completes it. Report §7.
**Prompt document name**: 2026-09-30 17:20

## 2026-09-30 — fix(views): declared sizes unfloored, radius clamp at half, dot-large (P-2026-09-30-1720)
**Prompt**: `claude_2026-09-30_1720_prompt_activity_sizes.md`, Phase 1 and 2 in cascade on `viewpoint-notations`. The three limits the Activity (UML) lane left (R-VP-26): the 24 px floor on declared sizes, the bull's-eye disc, the radius clamp at a quarter.
**Files touched**: report `b65be5594` + §6 in this commit: `docs/discovery/discovery_2026-09-30_activity_sizes.md`. Code `3805796be`: `nodes/nodeSizing.ts`, `viewpoint/ir/shapeRegistry.ts`, `viewpoint/ir/markerRegistry.ts`, their three tests. This commit: the report, this entry, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: 2026-09-30 15:52 claude_2026-09-30_1552_prompt_activity_uml_notation.md
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no — nine files, all in the DOVE: the six of `3805796be`, the report, `docs/log-inbox/views.md`, the prompt file.
**Layer Impact Report**: produced
**Smoke visivo**: lane probe on 3087 19/19, light; the visual GO is the chat's (pending)
**Notes**: Typecheck the known 14; vitest 6209/6213, the 9 known files and 4 criticalZone from the go-ahead variable (70/70 unset); build exit 0; bench 16/16. Partial: the Activity final still names `dot` (6.4 px disc): `dot-large` measured 14 px in session, the switch is `viewpointDerivation.ts:837`, outside the DOVE, asked. Default scenes 0 px from 21345bbba.
**Prompt document name**: 2026-09-30 17:20

**Ticket** (observations, low): (1) the bar paints 3 px at the declared 5: the wrapper's transparent 1 px each side, as every IR node; a painted 5 is `defaultSize` 7. (2) Flows stop 5 px short of every symbol (the router's end offset), more visible on the thin bars. (3) `viewpointDerivation.ts:768`, `:775-777`, `:871-873` still describe the 24 px floor.

## 2026-09-30 — ticket: DemoFlowB's two guard labels overlap in Activity (UML)
**Ticket**: Derived as «Activity (UML)» on the demo layout, `[model.[count] < 2]` and `[model.[count] >= 2]` overlap by 796 px², both between `work` and `d1`, where the orthogonal router runs `f3` and the first leg of `f4` side by side around the 36 px diamond (read on the crop). The notation writes the labels right; their placement is the router's. For the layout lane after the freeze, or a label offset per parallel segment.
**Priority**: medium
**Found in**: P-2026-09-30-1552
**Detail**: docs/discovery/discovery_2026-09-30_activity_uml_notation.md

## 2026-09-30 — ticket: Activity (UML) sizes held by render floors outside the notation
**Ticket**: «Activity (UML)» writes the specified sizes; three draw otherwise. `defaultBoxFor` (`nodes/nodeSizing.ts:73`) floors every authored `defaultSize` axis at `SHAPE_MIN_SIZE` (24): the fork/join bar 5×120 draws 24×120 (visible 22×118, a slab, what Alfonso called «i join sono quelli delle reti di petri»), the initial 20 draws 24. The bull's-eye's inner disc is the registry `dot` (radius 16 of 100, `markerRegistry.ts:83`), about 7 px in a 24 px circle where the mockup has 14. A per-form floor (the bar none, a circle 12) is one line and also fixes the classic Petri bar (the A2 ticket); a larger disc is one registry row. Both change what the demo shows: Alfonso decides (RC-26).
**Priority**: high
**Found in**: P-2026-09-30-1552
**Detail**: docs/discovery/discovery_2026-09-30_activity_uml_notation.md

## 2026-09-30 — feat(views): the Activity (UML) notation, DemoFlowB and DemoPEST preselection (P-2026-09-30-1552)
**Prompt**: `claude_2026-09-30_1552_prompt_activity_uml_notation.md`, Phase 1 then Phase 2 in cascade, heavy, critical zone possible (LIR first, go-ahead), on `~/jjodel-w-notations` branch `viewpoint-notations`: after Alfonso's review of DemoFlowB, «Activity (UML)» beside the flowcharts (initial dot, rounded action, hollow diamond, bar, bull's-eye, `[guard]`), DemoFlowB opening on it and DemoPEST on Statechart (UML), R-VP-26.
**Files touched**: docs `e63ea6d73`: the Phase 1 report. Code `ca3e41a92` (6 files): `viewpoint/derive/notations.ts`, `viewpointDerivation.ts`; tests `activityUml.test.ts` (new), `notations.test.ts`, `erChen.test.ts`, `sim/__tests__/DeriveViewpointDialog.test.ts`. This commit: the report's §6, `docs/decisions.md` (R-VP-26), this entry and two tickets, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no — on `ca3e41a92`: typecheck exit 2, 14 errors, the §17 set; vitest 6201 (6173 + 28), the 9 known files red at import and 4 hook tests red from the lane's go-ahead variable (70/70 unset); build exit 0. Red first: 35 of 260. The eight other notations: 72/72 lists on the exports identical to the A2 tip. Mutation bench 44/45, the survivor equivalent.
**Out-of-scope changes**: no — the two source files and their tests, in the prompt's DOVE; no IR file, no dialog source.
**Layer Impact Report**: produced (report §1, committed in `e63ea6d73` before the first source edit)
**Smoke visivo**: passato (lane probe 22/22 on 3084, light: the four demo scenes byte-identical to the A2 tip's shots) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_actuml_crops/actuml_flowB_{activityUml,flowchartIso}_600.png`, close-ups `actuml_flowB_activityUml_{decision,bars}.png`
**Notes**: Partial because three sizes miss the spec by render floors outside the DOVE: the bar draws 24×120 (5 asked), the initial 24 (20), the bull's-eye's disc is the registry dot (≈7 px, 14 asked); radius 14 draws 10.5. The two guard labels overlap 796 px² (router). No new IR key. One scratch file went to `/tmp`, deleted (report §6). Detail in `docs/discovery/discovery_2026-09-30_activity_uml_notation.md`.
**Prompt document name**: 2026-09-30 15:52

## 2026-09-30 — ticket: the classic Petri bar draws 24 px wide, the defaultSize floor
**Ticket**: «Petri net (classic)» writes `defaultSize: { width: 10, height: 44 }` on the transition bar (mockup A); `defaultBoxFor` (`nodes/nodeSizing.ts:73`) floors every authored axis at `SHAPE_MIN_SIZE` (24), so the bar draws 24×44 (visible 22×42). A per-form floor (the bar: none) is one line in a file outside A2's DOVE; the IR has no orientation, so every classic bar is upright.
**Priority**: medium
**Found in**: P-2026-09-30-1521
**Detail**: docs/discovery/discovery_2026-09-30_a2_petri_classic_open_arrows.md

## 2026-09-30 — ticket: a derived viewpoint's node size outlives it on the default canvas
**Ticket**: After a derived viewpoint is shown and the default viewpoint is activated again, the M1 nodes keep the size the derived view's size hook wrote on the React Flow node: DemoPetri's places 66×66 (the R-VP-16 circle) instead of 200×78, DemoFlowB's `d1` 54×66 (the ISO diamond) instead of 200×50; positions, edges and markers unchanged. Measured on 3081 by the A2 probe; both notations predate A2, which changes only their arrowhead. `useContentDrivenSize` (`useContentSize.ts`) drops its size only while its IRNodeContent is mounted, which the default view is not. Visible in the demo when a presenter derives a viewpoint and goes back.
**Priority**: high
**Found in**: P-2026-09-30-1521
**Detail**: docs/discovery/discovery_2026-09-30_a2_petri_classic_open_arrows.md

## 2026-09-30 — feat(views): Petri net (classic) and open arrowheads in the derived notations, slice A2 (P-2026-09-30-1521)
**Prompt**: `claude_2026-09-30_1521_prompt_a2_petri_classic_open_arrows.md`, Phase 1 then Phase 2 in cascade, heavy, critical zone (LIR first, go-ahead), on `~/jjodel-w-notations` branch `viewpoint-notations`: after Alfonso's review of 2026-09-30, «Petri net (classic)» after mockup A beside R-VP-16 with `EdgeTermination 'hollowCircle'`, DemoPetri preselecting it (R-VP-24); open arrowheads in every derived notation (R-VP-25); the ratification line of R-VP-21.
**Files touched**: docs `618e4e958`: the Phase 1 report. Code `f603f28e8` (12 files): `viewpoint/ir/irTypes.ts`, `irValidate.ts`, `edges/UnifiedEdge.tsx`, `viewpoint/authoring/EdgeAuthoringPanel.tsx`, `viewpoint/derive/viewpointDerivation.ts`, `notations.ts`; tests `irValidate.test.ts`, `irA2Render.test.ts` (new), `notations.test.ts`, `viewpointDerivation.test.ts`, `erChen.test.ts`, `DeriveViewpointDialog.test.ts`. This commit: the report's §6, `docs/decisions.md` (R-VP-24, R-VP-25, the R-VP-21 line), this entry and two tickets, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `f603f28e8`: typecheck exit 2, 14 errors, the §17 set; vitest 6173 (6144 + 29), the 9 known files red at import and 4 hook tests red from the lane's go-ahead variable (70/70 unset, ticket of P-2026-09-29-2122); build exit 0. Red first: 39 of 297. Moved pins predicted on `2cde09984`'s code, 25/25 equal. Mutation bench 36/36.
**Out-of-scope changes**: no — the 12 files of `f603f28e8` are the prompt's DOVE and their tests; `irCompile`, `irEdgeViews` and `DeriveViewpointDialog.tsx` needed no change.
**Layer Impact Report**: produced (report §1, committed in `618e4e958` before the first source edit)
**Smoke visivo**: passato (lane probe 29/31 on 3081, light: the four demo scenes byte-identical to the A4 tip's shots; the 2 FAIL are the default scenes after a derived-viewpoint round trip, the size ticket below) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_a2_crops/a2_{petri_classic,petri_rvp16,sm_statechart,flowB_flowchartIso,esm_generic}_600.png`
**Notes**: The bar draws 24×44, not 10×44: `defaultSize` is floored at 24 (ticket). DemoPEST and DemoFlowB still open on State machine and Flowchart (R-VP-22), not on the notations the demo uses: awaiting Alfonso (report §0). The panel's «Hollow circle» option has no executed test (monaco in the bench). Two logs went to `/tmp`, moved into the tree (report §6). Report, rows, entry and Status in one docs commit, as the prompt asks.
**Prompt document name**: 2026-09-30 15:21

## 2026-09-30 — feat(views): the ER (Chen) notation and the edge end labels, slice A4 (P-2026-09-30-0440)
**Prompt**: `claude_2026-09-30_0440_prompt_a4_er_chen.md`, Phase 2 slice A4 of the notation discovery, heavy, critical zone (LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: «ER (Chen)» with no simulation profile, its table prefilled by name and structure signals (new `erSignals.ts`), relationship as a diamond node with plain lines, ellipse attributes with the key underlined, two optional IR keys (`edge.labels.sourceEnd` / `targetEnd`), R-VP-23.
**Files touched**: code `7c2593c85`: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irEdgeViews.ts`, `edges/UnifiedEdge.tsx`, `viewpoint/derive/viewpointDerivation.ts`, `notations.ts`, `erSignals.ts` (new), `sim/DeriveViewpointDialog.tsx`; tests `erChen.test.ts`, `irA4Keys.test.ts`, `irA4Render.test.ts` (new), `notations.test.ts`, `DeriveViewpointDialog.test.ts`. This commit: the report, R-VP-23, this entry, the Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `7c2593c85`: typecheck exit 2, 14 errors, the §17 set; vitest 6144 passed (6093 + 51), the 9 known files red at import; build exit 0. Red first on the tip (36 of 48). The six other notations: 54 digests identical to the tip on fixtures and on the decoded exports. Mutation bench 56/57, the survivor equivalent.
**Out-of-scope changes**: no — the DOVE files and their tests; the dialog changed by type only (report §0 question 2).
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs)
**Smoke visivo**: passato (lane probe 27/27 on 3078, light; the four demo scenes 0 px from the A1+A3 tip left of the rail) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_a4_crops/a4_{erdl,mde}_{erChen,generic}{,_all}_600.png`
**Notes**: Rule 19: 14 files (report §4). MDE ERD's contained attributes keep the C rows (R-VP-23 (5)). The enum is compared by literal name, as the L-proxy backend reads it. The M1 grid placement makes the lines cross (report §0, question 1). Detail in `docs/discovery/discovery_2026-09-30_a4_er_chen.md`.
**Prompt document name**: 2026-09-30 04:40

## 2026-09-30 — feat(views): Statechart (UML) and Flowchart (ISO 5807) notations, slices A1 and A3 (P-2026-09-30-0355)
**Prompt**: `claude_2026-09-30_0355_prompt_a1_a3_notations.md`, Phase 2 slices A1 and A3 of the notation discovery, heavy, critical zone (LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: two notations beside State machine and Flowchart, two optional IR keys (`shape.entry`, `edge.curve: 'arc'`), the three C3 edge causes fixed for arc edges only, R-VP-22.
**Files touched**: code `74995f429`: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irEdgeViews.ts`, `IRNodeContent.tsx`, `irStyle.ts`, `edges/UnifiedEdge.tsx`, `utils/edgeUtils.ts`, `viewpoint/derive/viewpointDerivation.ts`, `notations.ts`; tests `irA1Keys.test.ts`, `irA1Render.test.ts` (new), `notations.test.ts`, `DeriveViewpointDialog.test.ts`, `shapeRegistry.test.ts`. This commit: the report, R-VP-22, this entry, the Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (d)
**Regressions**: no — on `74995f429`: typecheck exit 2, 14 errors, the §17 set; vitest 6093 passed (6049 + 44), the 9 known files red at import; build exit 0. Red first on the D tip, pins read there. Mutation bench 46/46.
**Out-of-scope changes**: no — the DOVE files and their tests; two existing tests changed with the list and the CSS (report §1, §4).
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs)
**Smoke visivo**: fallito (probe 15/23 on 3076: 7 are the procedure, rail and bag, read in report §2; 1 is a tip at 1.01 px against ≤ 1) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_a1a3_crops/a1a3_{sm_statechart,sm_stateMachine,flowB_flowchartIso,flowB_flowchart}_600.png`
**Notes**: Rule 19: 15 files, listed in report §4. Default scenes 0 px from the D tip left of the rail (4 of 4). Arrow tips 1.00-1.01 px from the visible border: the wrapper's transparent 1 px border. `stop` crosses `unlocked` on the demo layout; the ISO diamond is content-sized. No Decision role in the catalogue. Detail in `docs/discovery/discovery_2026-09-30_a1_a3_notations.md`.
**Prompt document name**: 2026-09-30 03:55

## 2026-09-30 — feat(views): the Derive viewpoint dialog, notation binding and provenance, slice D (P-2026-09-30-0255)
**Prompt**: `claude_2026-09-30_0255_prompt_d_derive_dialog.md`, Phase 2 slice D of the notation discovery, heavy, one §3.1 key (`ir.generated`, LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: «Derive viewpoint» opens a dialog (notation select, metaclass → role table prefilled by the binder), the binding kept in the derived viewpoint's `_state`, `ir.generated` on every view; R-VP-21.
**Files touched**: code `64ea9f216`: new `viewpoint/derive/notations.ts`, `sim/DeriveViewpointDialog.tsx`, `sim/DeriveViewpointDialog.scss`; `App.tsx`, `events/registry.ts`, `TreeViewSidebar/TreeViewContent.tsx`, `utils/deriveViewpoint.ts`, `viewpoint/derive/viewpointDerivation.ts`, `viewpoint/ir/irTypes.ts`, `viewpoint/ir/irDefaults.ts`; tests `notations.test.ts` (new), `DeriveViewpointDialog.test.ts` (new), `viewpointDerivation.test.ts`, `ir.test.ts`. This commit: `docs/discovery/discovery_2026-09-30_d_dialog.md` (new), `docs/decisions.md` (R-VP-21), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `64ea9f216`: typecheck exit 2, 14 errors, the §17 set; vitest 6049 passed (5990 + 59), the 9 known files red at import; build exit 0. Red first on the C2 tip: 9 failed, 2 files at collection. Role-keyed documents equal the pins of `58aa78ba9` through the dialog's default. Default viewpoint of the four demos byte-identical to the C2 tip, 12/12. Mutation bench 44/45, the survivor equivalent.
**Out-of-scope changes**: no — the 14 files are the prompt's DOVE (the dialog next to the dialogs whose shell it shares, `editor-v2/sim/`).
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3074 (light, 1600×1000) 58/58 EXIT=0, crops `frontend/scripts/smoke/_tmp_d_crops/d_{sm,petri,esm,flowB}_dialog_600.png`, `d_sm_dialog_generic_600.png`, `d_sm_derived_{stateMachine,generic}_600.png`
**Notes**: Rule 19: 14 files, listed in report §4 (9). A first probe run (43/58) failed on the probe's own fixture and undo call, not the code; kept as `probe-_tmp_d_probe.run1.log`. Delete-time console warnings measured as pre-existing by a control (report §3). Two questions with Recommended answers in report §0.
**Prompt document name**: 2026-09-30 02:55

## 2026-09-30 — feat(ir): text and edge-label IR keys for the generic notation, slice C2 (P-2026-09-30-0150)
**Prompt**: `claude_2026-09-30_0150_prompt_c2_ir_keys.md`, Phase 2 slice C2 of the notation discovery, heavy, critical zone `viewpoint/ir/` (LIR first), on `~/jjodel-w-notations` branch `viewpoint-notations`: five optional IR keys (letterSpacing, textTransform, the attributes exclude, a literal segment style, the edge label template and style), used by the generic notation; R-VP-20.
**Files touched**: code `2360515f4`: `viewpoint/ir/irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `IRNodeContent.tsx`, `irEdgeViews.ts`, `edges/UnifiedEdge.tsx`, `EditorV2.scss`, `viewpoint/derive/viewpointDerivation.ts`; tests `ir.test.ts`, `irValidate.test.ts`, `irC2Render.test.ts` (new), `viewpointDerivation.test.ts`. This commit: `docs/discovery/discovery_2026-09-30_c2_ir_keys.md` (new), `docs/decisions.md` (R-VP-20), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `2360515f4`: typecheck exit 2, 14 errors, the §17 set by file and code; vitest 5990 passed (5942 + 48), the 9 known files red at import; build exit 0. Red first on the C1 tip: 44. Absent-case pins measured there. Mutation bench 43/43. Default viewpoint of the four demos pixel-identical to the C1 tip outside the Jodie launcher, 12/12.
**Out-of-scope changes**: no
**Layer Impact Report**: produced (report §1, written before the first source edit; committed with the docs, as the prompt's commit plan says)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3072 (light, 1600×1000) 46/46 EXIT=0, crops `frontend/scripts/smoke/_tmp_c2_crops/c2_{sm,petri,esm,flowB,erd,erdl}_derived_after2_600.png`
**Notes**: IRRow is in the DOVE and untouched (the literal style is the FieldSegment's). Lane choice, Q1 of the report: a template value that resolves empty takes its caption. Byte identity failed only on the Jodie launcher's animated glyph (report §3). One vitest log went to /tmp, moved into the tree at once.
**Prompt document name**: 2026-09-30 01:50

## 2026-09-30 — feat(views): the generic structural notation (variant C) derived with no role bound, slice C1 (P-2026-09-29-2350)
**Prompt**: `claude_2026-09-29_2350_prompt_c1_generic_notation.md`, Phase 2 slice C1 of the notation discovery, heavy, on `~/jjodel-w-notations` branch `viewpoint-notations`: variant C as derivation data with no role bound (rules 1-6), tests first, mutation bench, lane probe, R-VP-19.
**Files touched**: code `3ed86119f`: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts`, its test `derive/__tests__/viewpointDerivation.test.ts`, `frontend/src/utils/deriveViewpoint.ts`. This commit: `docs/decisions.md` (R-VP-19), this entry, the Status line of the prompt file. Probes `frontend/scripts/smoke/_tmp_c1_*` and crops `_tmp_c1_crops/` gitignored, not committed.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `3ed86119f`: `npx tsc --noEmit` exit 2, 14 errors, the §17 set by file and code; derive file 107 passed (36 red first); full `npx vitest run` 5942 passed, the 9 known files red at import; `npm run build` exit 0, chunk-size warning only. Role-keyed digests pinned on `58aa78ba9`, structure-only pins unchanged. Mutation bench 42/43, the survivor an equivalent mutant.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no §3.1 file: `viewpoint/derive/` is outside `viewpoint/ir/` and `viewpoint/authoring/`)
**Smoke visivo**: pending — chat, RC-23; lane probe on 3071 (light, 1600×1000) 50/50 EXIT=0, crops `frontend/scripts/smoke/_tmp_c1_crops/c1_{sm,petri,esm,flowB,erd}_derived_600.png`
**Notes**: Turnstile box 198 px: the 200 px floor of `.mm-node.mm-object` (`instanceNode.scss:35`), not `irStyle.ts:82`. The session stopped at 00:25 on ENOTFOUND (network) and was resumed; nothing lost. Default canvas: an empty-viewpoint round-trip leaves it byte-identical; any derived viewpoint round-trip re-routes M1 reference edges, the trunk's boxes too; after C it equals the boxes case byte for byte, 5/5.
**Prompt document name**: 2026-09-29 23:50

**Ticket** (observation, low, not a ticket of its own): visiting a derived viewpoint and returning to the default one re-routes some M1 reference edges of the default canvas (DemoPEST `coin`↔`t1`, `push`↔`t2`), with the trunk's own derived boxes as well; an empty viewpoint does not. Not investigated; a candidate for slice C3's edge-port work.

## 2026-09-30 — merge: canvas-export-fix into alfonso-frontend-jjtl (P-2026-09-30-2205)
**Prompt**: `claude_2026-09-30_2205_prompt_merge_canvas-export-fix.md`, a direct merge by `lane-run merge --direct`, no session: `canvas-export-fix` at `3c9a078ce` into `alfonso-frontend-jjtl`, merge base `31999a630`, 5 commits on the branch side.
**Files touched**: merge `088e4c385`: 6 files from the branch side (`docs/discovery/discovery_2026-09-30_canvas_export_broken.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_2035_prompt_canvas_export_fix.md`, `frontend/src/components/abstract/tabs/MetamodelTab.tsx`, `frontend/src/services/CanvasExportService.ts`, `frontend/src/services/__tests__/CanvasExportService.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `088e4c385` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6020 tests in 242 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Checked by the chat: lane probe 154/154 on the four exports (M2, M1, derived IR M1), on-screen canvas 0 px change after the exports, M2 PNG viewed by the chat (nodes, edges, white background). Merge changes the export path only, no demo content.
**Notes**: Rollback tag `pre-canvas-export-fix` on `120d97c01` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2205/result.json`.
**Prompt document name**: 2026-09-30 22:05

## 2026-09-30 — ticket: each canvas export logs two console errors and embeds every font in the SVG
**Ticket**: html-to-image reads `cssRules` of every stylesheet to embed the fonts; the cross-origin Google Fonts sheet throws `SecurityError`, which the library catches and logs: 2 `console.error` per render (measured on 3142, every option). The export succeeds. The same embedding makes the SVG file 3 to 15 MB on the demo models, and the SVG is HTML inside a `foreignObject`: it opens in a browser, not as editable vectors.
**Priority**: low
**Found in**: P-2026-09-30-2035
**Detail**: docs/discovery/discovery_2026-09-30_canvas_export_broken.md

## 2026-09-30 — ticket: Copy to clipboard likely refused by Safari after the canvas render
**Ticket**: `CanvasExportService.copyToClipboard` awaits the html-to-image render (1-3 s) before `navigator.clipboard.write`, so the write happens after the click's user activation. Chromium accepts it (measured); Safari's rule refuses such a write (not measured here), and the user gets the alert «Copy Failed ... Use Export as PNG instead». Making Safari work needs a `ClipboardItem` whose value is the blob's Promise, created inside the click.
**Priority**: low
**Found in**: P-2026-09-30-2035
**Detail**: docs/discovery/discovery_2026-09-30_canvas_export_broken.md

## 2026-09-30 — fix(export): canvas export works in all four options, M2 and M1 (P-2026-09-30-2035)
**Prompt**: `claude_2026-09-30_2035_prompt_canvas_export_fix.md`, Phase 1 then 2 in cascade, fast lane on `~/jjodel-w-canvasexport` branch `canvas-export-fix`. File > Export Canvas did nothing in any option (PNG, JPEG, SVG, Copy to clipboard): find the cause per option, make each produce the whole diagram on white, the chosen format reaching the service.
**Files touched**: docs `f3ed74cea`: `docs/discovery/discovery_2026-09-30_canvas_export_broken.md` (new). Code `0d6987661`: `frontend/src/services/CanvasExportService.ts`, `frontend/src/components/abstract/tabs/MetamodelTab.tsx`, `frontend/src/services/__tests__/CanvasExportService.test.ts` (new); `078cfb5f8`: the same test, one case. This commit: the report's Phase 2 addendum, this entry, two tickets, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npm run typecheck` exit 2, 14 errors, the §17 set by file and code (on `078cfb5f8`); `npx vitest run` 6004 passed, the 9 known files red at import (on `0d6987661`); `npm run build` exit 0. Unit 23/23, red first (18 of 21). Mutation bench 21/22 on `0d6987661`, 26/26 on `078cfb5f8`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: pending — chat, RC-23; lane probe on 3142 (light) 154/154: DemoESM M2, demoESM M1, demoFlowB M1 under its derived IR viewpoint, four options each via the File menu; files `frontend/scripts/smoke/_tmp_canvas_export/phase2/`
**Notes**: Causes: `canvasRef` on no element since `197b6c3d0`; no M1 listener; options dropped since `260e1a0ce`; element export cropped, grey, half-res; html-to-image 1.11.13 leaves SVG children unstyled; SVG background translated (addendum). Adopted as recommended (RC-21): report §0 Q1-Q4. Not in `decisions.md`: outside this lane's DOVE.
**Prompt document name**: 2026-09-30 20:35

## 2026-09-30 — merge: loader-over-rail into alfonso-frontend-jjtl (P-2026-09-30-2120)
**Prompt**: `claude_2026-09-30_2120_prompt_merge_loader-over-rail.md`, a direct merge by `lane-run merge --direct`, no session: `loader-over-rail` at `fb6826c1a` into `alfonso-frontend-jjtl`, merge base `45ff6c290`, 3 commits on the branch side.
**Files touched**: merge `f5f9f4f23`: 4 files from the branch side (`docs/discovery/discovery_2026-09-30_loader_over_rail.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_2025_prompt_loader_over_rail.md`, `frontend/src/components/loader/Loader.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f5f9f4f23` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5997 tests in 241 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on lane 2025 measures: with the overlay up the rail centre returns div.loader-spinner and is dimmed (74,75,75); navbar menu above the rail without loader; merge gates green
**Notes**: Rollback tag `pre-loader-over-rail` on `6fddac6b7` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2120/result.json`.
**Prompt document name**: 2026-09-30 21:20

## 2026-09-30 — ticket: user menu Dashboard throws on Collaborative.client.off when no collaborative session was opened
**Ticket**: user menu > Dashboard runs `Collaborative.client.off('pullAction')` (`Navbar.tsx:2019`), but `Collaborative.client` is assigned only in `Collaborative.connect()` (`Collaborative.ts:55`): on a project that never connected it throws `Cannot read properties of undefined (reading 'off')` and does not navigate. Observed by automation only (probe, offline session, non-collaborative project), not yet reproduced by hand (RC-8).
**Priority**: low
**Found in**: P-2026-09-30-2025
**Detail**: docs/discovery/discovery_2026-09-30_loader_over_rail.md

## 2026-09-30 — fix(loader): the save overlay covers the Properties rail (P-2026-09-30-2025)
**Prompt**: `claude_2026-09-30_2025_prompt_loader_over_rail.md`, fast lane, measure then fix, on `~/jjodel-w-loaderz` branch `loader-over-rail`. While saving, the dark loading overlay dimmed canvas, left rail and top bar, but the right Properties rail stayed bright on top of it.
**Files touched**: code `b46af6f27`: `frontend/src/components/loader/Loader.tsx` (portal onto `document.body`). This commit: `docs/discovery/discovery_2026-09-30_loader_over_rail.md` (new), this entry and a ticket, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `b46af6f27`: typecheck exit 2, 14 errors, the §17 set by file and code; build exit 0; vitest 5949 passed, 0 failed, the 9 §17 files red at import plus `irSelectionRing.test.ts`, 5/5 passing, its `afterAll` `browser.close()` timed out at 10 s (load average 110, `Loader.tsx` outside its graph). Probe on 3071: open, navigation, `U.navigating`, rail and user menu unchanged; the four scenes 0 px outside the Jodie glyph box (report §4.4).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: pending — chat (RC-23); lane probe before/after, rail centre `div.jj-conformance-bar` → `div.loader-spinner`, pixel 248,250,252 → 74,75,75; crops in `frontend/scripts/smoke/_tmp_loaderz_crops/` (gitignored)
**Notes**: Root cause: `#root` is `position: fixed` (`index.scss:31`), a stacking context at level 0 of body, and the loader lived inside it while the rail is a body child at 900 (D-UI-14). The save is too fast to catch in the probe (2.1 ms, no `isLoading` transition): the overlay was forced with the flag `saveProject.tsx:63` sets. No z-index, class or rail change.
**Prompt document name**: 2026-09-30 20:25

## 2026-09-30 — merge: edge-click-properties into alfonso-frontend-jjtl (P-2026-09-30-2105)
**Prompt**: `claude_2026-09-30_2105_prompt_merge_edge-click-properties.md`, a direct merge by `lane-run merge --direct`, no session: `edge-click-properties` at `1079a9740` into `alfonso-frontend-jjtl`, merge base `45ff6c290`, 4 commits on the branch side.
**Files touched**: merge `35d8c8e89`: 8 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-09-30_edge_click_properties.md`, `docs/log-inbox/views.md`, `docs/prompts/claude_2026-09-30_1940_prompt_edge_click_properties.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/hooks/useJjomSelection.ts`, `frontend/src/components/editor-v2/utils/__tests__/edgeSelectionTarget.test.ts`, `frontend/src/components/editor-v2/utils/edgeSelectionTarget.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `35d8c8e89` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 5997 tests in 241 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on lane 1940 DOM measures: M1 ref click shows DValue slot, object-as-edge shows DObject, M2 ref unchanged, 4 demo scenes 0 px; merge gates green
**Notes**: Rollback tag `pre-edge-click-properties` on `31999a630` (RC-31). Union: `docs/log-inbox/views.md`. Worker and gates: `~/.jjodel-lanes/P-2026-09-30-2105/result.json`.
**Prompt document name**: 2026-09-30 21:05

## 2026-09-30 — ticket: an inheritance edge click shows the empty panel, a lifted edge click shows nothing
**Ticket**: After R-ESEL-2 an inheritance edge still writes `_lastSelected.modelElement = ''` (the DEdge has no `model`) and the Properties panel reads «No element selected»; an IR-lifted edge `<id>__irlift` (collapsed container) has no D-object behind it and a click changes nothing. Options: inheritance → the subclass (its INHERITANCE section); lifted → the slot of the original source (`data.irSourceObjectId`), first of a deduplicated bundle. Also: an M1 edge is pair-keyed, so two references of one object to the same target show the first slot.
**Priority**: low
**Found in**: P-2026-09-30-1940
**Detail**: docs/discovery/discovery_2026-09-30_edge_click_properties.md


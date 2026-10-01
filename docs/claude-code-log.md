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


## 2026-09-28 — docs(#157): triage del feedback di test di @tmaog + piano di rimedio
**Prompt**: Tommaso ha testato le nuove feature e riportato sulla issue #157 esiti e problemi; fare un piano per risolverli.
**Files touched**: `docs/discovery/discovery_2026-09-28_157_triage_feedback_tmaog.md` (nuovo), `docs/claude-code-log.md`. Nessun file di codice.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (d)
**Regressions**: no — analisi read-only, nessun sorgente toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessuna modifica di codice.
**Smoke visivo**: non applicabile
**Notes**: I 4 sintomi MAGGIORI (Configurator bianco, hidden non nasconde, New su read-only, profili assenti al riapri) sono **UN** guasto: config/profilo non risolti a runtime ⇒ `resolveTypePermission(null,…)` = `'edit'`. Il trim LeftBar/Navbar regge perché dipende solo da `?profile=`. FALSIFICATA l'ipotesi della raggiungibilità: `U.compressedState` serializza tutto l'idlookup. R0 discrimina: progetto non salvato (M1) vs config duplicata da `getOrCreate` (M2). F4b rinviata dopo R1.
**Prompt document name**: 2026-09-28 (chat)

## 2026-09-23 — docs: piano #157 (Configurator + ambienti jjodel per ruolo)
**Prompt**: pianificare la feature della #157 in modalità "standalone"/ambienti per ruolo; analisi del sistema (sintassi concreta + data manager) e piano incrementale a fasi; scrivere il documento di planning, rispondere alla issue #157 linkando il doc e chiedendo approvazione a Tommaso, preparare il prompt di corsia della Fase 0, approfondire il punto entità/VersionFixer prima di scrivere.
**Files touched**: `docs/discovery/discovery_2026-09-23_157_standalone_configurator.md` (nuovo), `docs/prompts/claude_2026-09-23_1200_prompt_157_fase0a_environment_config.md` (nuovo), `docs/claude-code-log.md` (questa entry). Commento su issue #157 (jjodel-modeling/jjodel-frontend).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — solo documentazione, nessun sorgente toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — task di pianificazione, nessun file di §3.1.
**Smoke visivo**: non applicabile
**Notes**: Decisioni prese: D1 enforcement solo-frontend (soft), D2 stesso progetto + ruolo in URL, D3 entità dedicata (non campi su DProject). Piano a 6 fasi (F0..F5). Approfondimento: entità persistite in `joiner/classes.ts` (non `megamodel.ts`), aggancio via `father` + scan idlookup, VersionFixer NON necessario in F0 (create lazy). Doc su branch `docs/157-standalone-configurator-plan`. Prompt F0a pronto.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-18 — docs: trasporto normativo, passo 2 di P-2026-09-18-2110
**Prompt**: passo 2 di P-2026-09-18-2110 (emenda P-2026-09-18-1930): portare sul tronco tre dei
quattro delta normativi misurati a `fbcbcb820` contro questo tronco (`7bc6c7365`) — §9.3 di
CLAUDE.md, le due righe `P1..P9`→`P1..P12`, il trailer `Model:` di PROTOCOL.md P6 con la versione
1.1→1.2. La frase di rotazione di P9 (`npm run log:rotate`) non viaggia: lo script non esiste su
questo tronco (RC-10).
**Files touched**: `CLAUDE.md`, `docs/PROTOCOL.md`, `AGENTS.md` (rigenerato, regola 1c).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — solo CLAUDE.md/PROTOCOL.md e la loro proiezione, nessun sorgente toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Conteggi: CLAUDE.md 63444 char (era 60208, +3236, atteso ~3200), PROTOCOL.md 14258
char. Tre gate, tutti exit 0: `gen:agents` (2 scritti, 0 skippati), `check:agents` PASS (2/2
allineati), `check:docs` PASS (3/3, 2 warning preesistenti non correlati, `Corregge` del
2026-09-02). Worktree gia' su `alfonso-frontend-jjtl`: la premessa "prunable" del prompt era
superata, non ricreato. Commit `32dbe1ef8`.
**Prompt document name**: 2026-09-18 21:10
## 2026-09-24 — feat(#157): «Copy stand-alone link» per profilo (Fase 4a)
**Prompt**: «procede con la prossima fase» → F4, diviso in F4a (link, procedo ora) e F4b (assegnazione profilo→utente, tocca D/L → semantica da confermare).
**Files touched**: `frontend/src/utils/shareUtils.ts`, `frontend/src/components/envgen/steps/ProfilesStep.tsx`. Referto discovery + questa entry in commit docs separato (§6.4/P13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 2 file.
**Layer Impact Report**: not-required — nessun file di §3.1; util pura + view (ProfilesStep). F4b (assegnazione) tocca D/L → fase separata.
**Smoke visivo**: non eseguito — passi di verifica consegnati all'utente.
**Notes**: Nuova `getStandaloneEnvironmentUrl(projectId, profileId)` in shareUtils (usa `window.location.origin`, link valido anche in locale; `getPublicProjectUrl` invariata). ProfilesStep: bottone «Copy stand-alone link» nel detail del profilo (riusa `copyToClipboard`), feedback «Copied!» 1.5s. F4b (profilo→utente) rinviata: tocca DProfile/LProfile (Rule 20 + LIR), semantica da decidere (metadata vs auto-risoluzione da email, §5). Referto nel discovery.
**Prompt document name**: 2026-09-24 14:00

## 2026-09-24 — feat(#157): trim della Navbar in consumer mode (Fase 3b)
**Prompt**: «continua con la fase successiva» → F3b, trim della Navbar in consumer mode. Due decisioni comportamentali confermate dall'utente prima di scrivere (New Model tenuto, New Project nascosto).
**Files touched**: `frontend/src/pages/components/Navbar.tsx`. Referto discovery + questa entry in commit docs separato (§6.4/P13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione (smoke consegnato all'utente).
**Out-of-scope changes**: no — 1 file.
**Layer Impact Report**: not-required — nessun file di §3.1; solo view/shell (Navbar).
**Smoke visivo**: non eseguito — passi di verifica consegnati all'utente.
**Notes**: In consumer mode (`?profile=`, D2) la Navbar nasconde: File→New Project e File→New→Metamodel (New Model **tenuto**, decisione utente); menu Tools (Configure Environment/Metamodel Tools/Polymetric); menu Analyze (validazione/analytics/debug); e le tab developer (metamodel/viewpoint/transformation) dalla strip (difesa a valle dei guard DockManager di F3). Reattività via listener hashchange (come F3-A). Soft (D1). Referto: discovery_2026-09-24_157_fase3b_navbar_trim.md.
**Prompt document name**: 2026-09-24 14:00

## 2026-09-24 — fix(#157): shell reattiva a ?profile= all'uscita dal consumer mode
**Prompt**: «mi sembra sia scomparso un menù»; tornando all'URL senza profilo la UI restava ristretta. Diagnosi (§5) + fix minore, esteso alla LeftBar su conferma esplicita dell'utente.
**Files touched**: `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/components/dock/MyRcDock.tsx`, `frontend/src/components/abstract/Dock.tsx`. Codice in commit separato (§6.4/RC-13); questa entry in commit docs.
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (d)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione (smoke consegnato all'utente).
**Out-of-scope changes**: no — 3 file; l'estensione alla LeftBar (oltre al solo pannello) è stata approvata dall'utente prima di procedere (deroga dichiarata, RC-11).
**Layer Impact Report**: not-required — nessun file di §3.1; solo view/shell (LeftBar/Dock/MyRcDock), nessun D-layer/sync/persistenza.
**Smoke visivo**: non eseguito — app non avviata; passi di verifica consegnati all'utente.
**Notes**: Causa (A) reattività: `isConsumerMode()` legge l'hash live ma LeftBar/DockManager valutavano solo al render (F3 dichiarava il follow-up). LeftBar: listener hashchange → re-render, sezioni developer tornano. Dock: su transizione consumer→developer chiama il nuovo `PinnableDock.forceEditorTypeBroadcast()` (resetta `_lastActiveId`+`_detectActiveTabChange`) → `body[data-editor-type]` si risincronizza, pannello Properties torna se un editor è aperto (no-op su dashboard).
**Prompt document name**: 2026-09-24 11:47

## 2026-09-23 — feat(#157): shell consumer ristretta da ?profile= (Fase 3, primo taglio)
**Prompt**: procedi al prossimo step (F3). Perimetro confermato dall'utente: LeftBar + guardie DockManager (Navbar = F3b).
**Files touched**: `frontend/src/components/environment/consumerMode.ts` (nuovo), `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/components/abstract/DockManager.tsx`. Referto e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 3 file, perimetro concordato (Navbar rinviata a F3b).
**Layer Impact Report**: produced — nel referto (view/shell + guard DockManager; nessun file §3.1, nessun D/sync/persistenza).
**Smoke visivo**: non eseguito — app non avviata.
**Notes**: `isConsumerMode()`=`!!U.getHashParam('profile')` (helper condiviso, letto live). In consumer: LeftBar nasconde sezioni Metamodels/Transforms/Viewpoints, item Megamodel e azione «Configure environment»; restano Models + «Open Configurator». DockManager: `open2` rifiuta i metamodelli in consumer (modelli ok), `openViewpoint` rifiuta del tutto. Soft (D1). Reattività: letto al render; toggle live via hashchange = follow-up. Referto: discovery_2026-09-23_157_fase3_consumer_shell.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): indicatore del profilo attivo nel Configurator (diagnostica)
**Prompt**: l'utente riporta «New non disabilitato, posso modificare» ma non è chiaro se il profilo dell'URL arriva; serviva rendere visibile lo stato.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configuratorTab.scss`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (d)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 2 file del ConfiguratorTab.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — l'indicatore serve proprio all'utente per lo smoke.
**Notes**: Header del Configurator: chip «Profile: <nome>» quando `?profile=` risolve un profilo, altrimenti «No profile — full access» (grigio). List-head: badge «Read only» quando il tipo selezionato è `read` per il profilo. Rende visibile perché New è/non è disabilitato: se il chip dice «No profile» il parametro URL non arriva (stripping o profilo di altro progetto); se mostra il nome ma New resta attivo è mismatch di chiavi. Nessuna modifica alla logica del gate.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): permessi profilo come SegmentedControl (discoverability)
**Prompt**: l'utente non trovava i controlli Editable/Read only/Hidden (erano dropdown poco evidenti); console conferma profilo con `perms: {}` (mai impostati).
**Files touched**: `frontend/src/components/envgen/steps/ProfilesStep.tsx`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (d)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 1 file.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — in attesa del test utente.
**Notes**: Nello step Profiles la scelta del permesso per-tipo passa da `<Select>` (tendina, default «Editable», poco scopribile) a `SegmentedControl` con i tre stati sempre visibili «Editable | Read only | Hidden» (controllo canonico D1). Write path invariato (`setPermission`→SetFieldAction su typePermissions). Nessun effetto sui pointer salvati.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): lettura del profilo dall'URL robusta e reattiva (F2)
**Prompt**: diagnosi utente in console: `profileIdFromUrl: null` mentre il profilo esiste; F2 non applica i permessi.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (c)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 1 file.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — in attesa del test utente sull'edit live dell'URL.
**Notes**: `profileIdFromUrl` ora usa `U.getHashParam('profile')` (il parser canonico dell'app, lo stesso di `getProjectID_URL`) invece del parse manuale; il profileId è tenuto in `useState` e aggiornato su `hashchange` e all'apertura del pannello, così l'edit live di `?profile=` aggiorna il gate senza reload. Sospetto residuo (da confermare): la navigazione al progetto (`R.navigate('/project?id=..')`) potrebbe rimuovere `&profile=` dall'hash — se il test conferma, è un fix di preservazione a parte.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): applicazione permessi del profilo nel Configurator (Fase 2)
**Prompt**: passa alla fase successiva (F2). + tracciare il cleanup di metamodelId/metamodelInfo e ricordarlo a fine feature.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configuratorTab.scss`. Referto (addendum F2 + nota cleanup §7.1) e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 2 file del ConfiguratorTab.
**Layer Impact Report**: not-required — nessun file di §3.1 toccato; il gate read-only è ESTERNO a IRForm (che è §3.1): wrapper `pointer-events:none`, non modifiche al form.
**Smoke visivo**: non eseguito — app non avviata; il fix compila.
**Notes**: Runtime: `resolveTypePermission(profile, typeId)` — `hidden` già filtrato dalla top-bar (F1 `visibleTopLevelTypes`); `read` → New disabilitato + IRForm in gate read-only (banner + `.configurator__ro-body{pointer-events:none}`, scroll sulla colonna detail); `edit` → pieno. Soft-frontend (D1): UX non sicurezza (nascondere dati a un profilo = backend, fuori scope). Per-campo rinviato. Cleanup metamodelId/metamodelInfo tracciato in §7.1 del referto di consolidamento, da rimuovere a feature completa.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): rimossa la selezione del metamodello dallo step General
**Prompt**: in General rimuovere la selezione del metamodello (l'ambiente copre tutto il progetto, non un singolo metamodello).
**Files touched**: `frontend/src/components/envgen/steps/GeneralStep.tsx`, `frontend/src/components/envgen/EnvGenWizardModal.tsx`, `frontend/src/components/envgen/hooks/useEnvGenWizard.ts`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (a)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 3 file dello stesso step/hook.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — screenshot utente; il fix compila.
**Notes**: Tolti la select «Source Metamodel», l'info box del metamodello (props `metamodels`/`metamodelInfo` di GeneralStep e loro passaggio nel modale) e la validazione «Source metamodel is required» nell'hook (General passa col solo nome). Il campo `EnvGenGeneral.metamodelId` resta nel tipo (default '', innocuo); il metamodelInfo memo dell'hook resta ma inutilizzato (Rule 9).
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): etichetta «metamodello:metaclasse» negli step del wizard
**Prompt**: nello step «Editable metaclasses» le metaclassi omonime di metamodelli diversi (es. due `iSQD_Profile`) sono indistinguibili; etichettare `metamodello:metaclasse`.
**Files touched**: `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `frontend/src/components/envgen/steps/ProfilesStep.tsx`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (a)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione (segnalato da screenshot utente).
**Out-of-scope changes**: no — 2 step del wizard.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — screenshot fornito dall'utente mostra il problema; il fix compila.
**Notes**: Entrambi gli step ora iterano `LProject.getProject().metamodels` (LModel `.name`+`.classes`) e mostrano `${metamodel.name}:${class.name}`. Il ConfiguratorTab runtime resta con nomi brevi (leggibilità fruitore). I pointer salvati (topLevelTypes/typePermissions) restano id di classe: cambia solo l'etichetta.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — refactor(#157): merge del configuratore nel wizard EnvGen + rename role→profile
**Prompt**: esiste una bozza (wizard EnvGen); farne UN solo configuratore fondendo F0/F1, rinominare role→profile, tenere gestione profili + metaclassi editabili, rimuovere gli step concrete-syntax/tech-stack/output, riquadrare come modalità stand-alone (non generazione). Consolidare le prime 2 fasi.
**Files touched**: envgen (`EnvGenWizardModal.tsx`/`.scss`, `hooks/useEnvGenWizard.ts`, `types.ts`, nuovi `steps/MetaclassesStep.tsx`+`steps/ProfilesStep.tsx`), `joiner/{classes.ts,environmentConfig.ts,index.ts,__tests__/environmentConfig.test.ts}`, `components/environment/ConfiguratorTab.tsx`, `pages/components/{LeftBar.tsx,Navbar.tsx}`; rimossi `components/environment/EnvironmentConfigModal.tsx`+`.scss`. Referto e log in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (f)
**Regressions**: unknown — `npx vitest` env config **21/21**; `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI del wizard non esercitata a runtime in questa sessione (le parti metaclassi/profili sono le stesse di F0b, già confermate dall'utente).
**Out-of-scope changes**: no — 15 file, tutti conseguenza diretta del merge richiesto (deroga RC-11 dichiarata; piano e stima file confermati prima di procedere).
**Layer Impact Report**: not-required — nessun file di §3.1; scritture via SetFieldAction/`.new()` (self-transaction), nessun canvas/sync.
**Smoke visivo**: non eseguito — app non avviata; type-safe e compilante.
**Notes**: Persistenza: metaclassi+profili sullo stato di progetto (DEnvironmentConfig/DProfile, live), general/design/features restano su localStorage (EnvGenPersistence) immutati. Rename role→profile con back-compat (findProfile accetta legacy 'DRole'; profileIdsOf legge legacy 'roles'). Modale F0b assorbito in due step del wizard e rimosso; azione LeftBar e Navbar aprono il wizard (EnvGenEvents.OPEN_WIZARD). Footer "Generate"→"Done". Referto: discovery_2026-09-23_157_consolidation_envgen_merge.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): Configurator screen, primo taglio overlay (Fase 1)
**Prompt**: passare a F1 (Configurator screen) dopo lo smoke ok di F0b. Scelta UX confermata dall'utente: overlay dal LeftBar (non tab del Dock).
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx` (nuovo), `frontend/src/components/environment/configuratorTab.scss` (nuovo), `frontend/src/pages/components/LeftBar.tsx`. Referto e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 3 file (coppia componente+scss + aggancio LeftBar); nessun tocco a InstanceManagerTab/DockManager.
**Layer Impact Report**: not-required — nessun file di §3.1; riuso di helper/adapter esistenti (`instancesOfClass`, `IRForm`, `applyCreate`), `applyCreate` chiamata bare (editor-v2 §3.3, nessuna TRANSACTION esterna).
**Smoke visivo**: non eseguito — app non avviata; UI type-safe e compilante ma non provata a mano. Criterio (tipo→istanze→New crea e apre) da verificare a runtime.
**Notes**: Overlay full-screen (createPortal→body) da azione «Open Configurator» nel project sidebar. Top-bar = visibleTopLevelTypes(config F0, ruolo da ?role); lista via instancesOfClass sul primo modello del progetto; dettaglio via IRForm; New = makeShapeCtx→newDraft→applyCreate (bare). Sola lettura della config; gating read/edit rinviato a F2; picker modello e tab-vero rinviati a F1b. Referto: discovery_2026-09-23_157_fase1_configurator.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): mini-UI Environment config (Fase 0b)
**Prompt**: passare alla Fase 0b — mini-UI per il language developer per marcare i tipi top-level e creare/editare i ruoli con permessi per-tipo. Niente PR.
**Files touched**: `frontend/src/components/environment/EnvironmentConfigModal.tsx` (nuovo), `frontend/src/components/environment/environmentConfigModal.scss` (nuovo), `frontend/src/pages/components/LeftBar.tsx`. Referto (addendum) e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione (app non avviata).
**Out-of-scope changes**: no — 3 file (coppia componente+scss come unità logica + l'aggancio nel LeftBar).
**Layer Impact Report**: not-required — nessun file §3.1; UI classica, scritture via SetFieldAction/DRole.new (self-transaction), nessun edge di canvas.
**Smoke visivo**: non eseguito — app non avviata; la UI compila ed è type-safe ma non provata a mano. Criterio (marca 4 tipi + crea 2 ruoli persistenti) da verificare a runtime.
**Notes**: Modale portallato (createPortal→body) aperto da un'azione del project sidebar (LeftBar). Config letta via findEnvironmentConfig su idlookup (lazy getOrCreate all'apertura), scritture SetFieldAction replace; topLevelTypes da LProject.classes; permessi hidden/read/edit su DRole.typePermissions (solo override, default edit). Delete ruolo = unreference (TODO cleanup entità). Referto: discovery_2026-09-23_157_fase0a_entity_pattern.md addendum F0b.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): entità DEnvironmentConfig/DRole (Fase 0a, schema + read/write)
**Prompt**: eseguire il prompt di corsia della Fase 0a (docs/prompts/claude_2026-09-23_1200_prompt_157_fase0a_environment_config.md): entità di configurazione ruoli/ambienti, solo schema dati e read/write, nessuna UI. Hard-stop di approvazione sciolto dal committente.
**Files touched**: `frontend/src/joiner/classes.ts`, `frontend/src/joiner/index.ts`, `frontend/src/joiner/environmentConfig.ts` (nuovo), `frontend/src/joiner/__tests__/environmentConfig.test.ts` (nuovo). Referto e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` sul file nuovo **17/17**; `npm run typecheck` output COMPLETO **14** errori pre-esistenti (baseline file noti), **0** nei file toccati; `npm run build` `✓ built` col solo warning chunk-size.
**Out-of-scope changes**: no — 4 file, tutti previsti dal prompt F0a.
**Layer Impact Report**: not-required — nessun file di §3.1; nuova entità D/L, nessuna scrittura sync/portDistribution, `.new()` self-gestisce la sua TRANSACTION (nessun creator dentro TRANSACTION esterna, §3.3/§3.4 fuori portata).
**Smoke visivo**: non applicabile — F0a non ha UI.
**Notes**: Entità agganciata al progetto via `father` + scan idlookup (nessun campo su DProject/DState); create lazy (`getOrCreate`), nessun VersionFixer. Logica pura (scan/permessi) in `joiner/environmentConfig.ts`, testabile senza `window`. Gotcha: `static get` collide con `RuntimeAccessibleClass.get` (TS2417) → rinominato `getForProject`. Referto: discovery_2026-09-23_157_fase0a_entity_pattern.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-18 — docs: trasporto normativo, passo 2 di P-2026-09-18-2110
**Prompt**: passo 2 di P-2026-09-18-2110 (emenda P-2026-09-18-1930): portare sul tronco tre dei
quattro delta normativi misurati a `fbcbcb820` contro questo tronco (`7bc6c7365`) — §9.3 di
CLAUDE.md, le due righe `P1..P9`→`P1..P12`, il trailer `Model:` di PROTOCOL.md P6 con la versione
1.1→1.2. La frase di rotazione di P9 (`npm run log:rotate`) non viaggia: lo script non esiste su
questo tronco (RC-10).
**Files touched**: `CLAUDE.md`, `docs/PROTOCOL.md`, `AGENTS.md` (rigenerato, regola 1c).
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

## 2026-09-26 — chore: fold the inboxes and rotate the log at 40, close two harness tickets (P-2026-09-26-2350)
**Prompt**: `claude_2026-09-26_2350_prompt_log_fold_rotate.md`, fast lane, exclusive on `~/jjodel-release` (RC-12). The active log sat at 40 with 19 entries waiting in the inboxes: fold and rotate with `npm run log:rotate`, verbatim, and close on the way the `P1..P15` ticket and the unwritten `bash-guard` observation of P-2026-09-26-2245.
**Files touched**: `13ebde1e6`: `CLAUDE.md` (lines 14 and 108), `AGENTS.md` (regenerated, the same two lines), `docs/log-inbox/harness.md` (one ticket). `c5a669c2e`, script-written: `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`, `docs/log-inbox/harness.md`, `simulation.md`, `versionfixer.md`. This commit: this entry, the archive (second rotation), the prompt's Status line.
## 2026-09-28 — docs(#157): triage del feedback di test di @tmaog + piano di rimedio
**Prompt**: Tommaso ha testato le nuove feature e riportato sulla issue #157 esiti e problemi; fare un piano per risolverli.
**Files touched**: `docs/discovery/discovery_2026-09-28_157_triage_feedback_tmaog.md` (nuovo), `docs/claude-code-log.md`. Nessun file di codice.
**Outcome**: ✅ completed
**Corregge**: 2026-09-24 14:00
**Causa**: (d)
**Regressions**: no — analisi read-only, nessun sorgente toccato.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessuna modifica di codice.
**Smoke visivo**: non applicabile
**Notes**: I 4 sintomi MAGGIORI (Configurator bianco, hidden non nasconde, New su read-only, profili assenti al riapri) sono **UN** guasto: config/profilo non risolti a runtime ⇒ `resolveTypePermission(null,…)` = `'edit'`. Il trim LeftBar/Navbar regge perché dipende solo da `?profile=`. FALSIFICATA l'ipotesi della raggiungibilità: `U.compressedState` serializza tutto l'idlookup. R0 discrimina: progetto non salvato (M1) vs config duplicata da `getOrCreate` (M2). F4b rinviata dopo R1.
**Prompt document name**: 2026-09-28 (chat)

## 2026-09-24 — feat(#157): «Copy stand-alone link» per profilo (Fase 4a)
**Prompt**: «procede con la prossima fase» → F4, diviso in F4a (link, procedo ora) e F4b (assegnazione profilo→utente, tocca D/L → semantica da confermare).
**Files touched**: `frontend/src/utils/shareUtils.ts`, `frontend/src/components/envgen/steps/ProfilesStep.tsx`. Referto discovery + questa entry in commit docs separato (§6.4/P13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 2 file.
**Layer Impact Report**: not-required — nessun file di §3.1; util pura + view (ProfilesStep). F4b (assegnazione) tocca D/L → fase separata.
**Smoke visivo**: non eseguito — passi di verifica consegnati all'utente.
**Notes**: Nuova `getStandaloneEnvironmentUrl(projectId, profileId)` in shareUtils (usa `window.location.origin`, link valido anche in locale; `getPublicProjectUrl` invariata). ProfilesStep: bottone «Copy stand-alone link» nel detail del profilo (riusa `copyToClipboard`), feedback «Copied!» 1.5s. F4b (profilo→utente) rinviata: tocca DProfile/LProfile (Rule 20 + LIR), semantica da decidere (metadata vs auto-risoluzione da email, §5). Referto nel discovery.
**Prompt document name**: 2026-09-24 14:00

## 2026-09-24 — feat(#157): trim della Navbar in consumer mode (Fase 3b)
**Prompt**: «continua con la fase successiva» → F3b, trim della Navbar in consumer mode. Due decisioni comportamentali confermate dall'utente prima di scrivere (New Model tenuto, New Project nascosto).
**Files touched**: `frontend/src/pages/components/Navbar.tsx`. Referto discovery + questa entry in commit docs separato (§6.4/P13).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione (smoke consegnato all'utente).
**Out-of-scope changes**: no — 1 file.
**Layer Impact Report**: not-required — nessun file di §3.1; solo view/shell (Navbar).
**Smoke visivo**: non eseguito — passi di verifica consegnati all'utente.
**Notes**: In consumer mode (`?profile=`, D2) la Navbar nasconde: File→New Project e File→New→Metamodel (New Model **tenuto**, decisione utente); menu Tools (Configure Environment/Metamodel Tools/Polymetric); menu Analyze (validazione/analytics/debug); e le tab developer (metamodel/viewpoint/transformation) dalla strip (difesa a valle dei guard DockManager di F3). Reattività via listener hashchange (come F3-A). Soft (D1). Referto: discovery_2026-09-24_157_fase3b_navbar_trim.md.
**Prompt document name**: 2026-09-24 14:00

## 2026-09-24 — fix(#157): shell reattiva a ?profile= all'uscita dal consumer mode
**Prompt**: «mi sembra sia scomparso un menù»; tornando all'URL senza profilo la UI restava ristretta. Diagnosi (§5) + fix minore, esteso alla LeftBar su conferma esplicita dell'utente.
**Files touched**: `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/components/dock/MyRcDock.tsx`, `frontend/src/components/abstract/Dock.tsx`. Codice in commit separato (§6.4/RC-13); questa entry in commit docs.
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (d)
**Regressions**: unknown — `npx tsc --noEmit` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione (smoke consegnato all'utente).
**Out-of-scope changes**: no — 3 file; l'estensione alla LeftBar (oltre al solo pannello) è stata approvata dall'utente prima di procedere (deroga dichiarata, RC-11).
**Layer Impact Report**: not-required — nessun file di §3.1; solo view/shell (LeftBar/Dock/MyRcDock), nessun D-layer/sync/persistenza.
**Smoke visivo**: non eseguito — app non avviata; passi di verifica consegnati all'utente.
**Notes**: Causa (A) reattività: `isConsumerMode()` legge l'hash live ma LeftBar/DockManager valutavano solo al render (F3 dichiarava il follow-up). LeftBar: listener hashchange → re-render, sezioni developer tornano. Dock: su transizione consumer→developer chiama il nuovo `PinnableDock.forceEditorTypeBroadcast()` (resetta `_lastActiveId`+`_detectActiveTabChange`) → `body[data-editor-type]` si risincronizza, pannello Properties torna se un editor è aperto (no-op su dashboard).
**Prompt document name**: 2026-09-24 11:47

## 2026-09-23 — feat(#157): shell consumer ristretta da ?profile= (Fase 3, primo taglio)
**Prompt**: procedi al prossimo step (F3). Perimetro confermato dall'utente: LeftBar + guardie DockManager (Navbar = F3b).
**Files touched**: `frontend/src/components/environment/consumerMode.ts` (nuovo), `frontend/src/pages/components/LeftBar.tsx`, `frontend/src/components/abstract/DockManager.tsx`. Referto e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 3 file, perimetro concordato (Navbar rinviata a F3b).
**Layer Impact Report**: produced — nel referto (view/shell + guard DockManager; nessun file §3.1, nessun D/sync/persistenza).
**Smoke visivo**: non eseguito — app non avviata.
**Notes**: `isConsumerMode()`=`!!U.getHashParam('profile')` (helper condiviso, letto live). In consumer: LeftBar nasconde sezioni Metamodels/Transforms/Viewpoints, item Megamodel e azione «Configure environment»; restano Models + «Open Configurator». DockManager: `open2` rifiuta i metamodelli in consumer (modelli ok), `openViewpoint` rifiuta del tutto. Soft (D1). Reattività: letto al render; toggle live via hashchange = follow-up. Referto: discovery_2026-09-23_157_fase3_consumer_shell.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): indicatore del profilo attivo nel Configurator (diagnostica)
**Prompt**: l'utente riporta «New non disabilitato, posso modificare» ma non è chiaro se il profilo dell'URL arriva; serviva rendere visibile lo stato.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configuratorTab.scss`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (d)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 2 file del ConfiguratorTab.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — l'indicatore serve proprio all'utente per lo smoke.
**Notes**: Header del Configurator: chip «Profile: <nome>» quando `?profile=` risolve un profilo, altrimenti «No profile — full access» (grigio). List-head: badge «Read only» quando il tipo selezionato è `read` per il profilo. Rende visibile perché New è/non è disabilitato: se il chip dice «No profile» il parametro URL non arriva (stripping o profilo di altro progetto); se mostra il nome ma New resta attivo è mismatch di chiavi. Nessuna modifica alla logica del gate.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): permessi profilo come SegmentedControl (discoverability)
**Prompt**: l'utente non trovava i controlli Editable/Read only/Hidden (erano dropdown poco evidenti); console conferma profilo con `perms: {}` (mai impostati).
**Files touched**: `frontend/src/components/envgen/steps/ProfilesStep.tsx`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (d)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 1 file.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — in attesa del test utente.
**Notes**: Nello step Profiles la scelta del permesso per-tipo passa da `<Select>` (tendina, default «Editable», poco scopribile) a `SegmentedControl` con i tre stati sempre visibili «Editable | Read only | Hidden» (controllo canonico D1). Write path invariato (`setPermission`→SetFieldAction su typePermissions). Nessun effetto sui pointer salvati.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): lettura del profilo dall'URL robusta e reattiva (F2)
**Prompt**: diagnosi utente in console: `profileIdFromUrl: null` mentre il profilo esiste; F2 non applica i permessi.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (c)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 1 file.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — in attesa del test utente sull'edit live dell'URL.
**Notes**: `profileIdFromUrl` ora usa `U.getHashParam('profile')` (il parser canonico dell'app, lo stesso di `getProjectID_URL`) invece del parse manuale; il profileId è tenuto in `useState` e aggiornato su `hashchange` e all'apertura del pannello, così l'edit live di `?profile=` aggiorna il gate senza reload. Sospetto residuo (da confermare): la navigazione al progetto (`R.navigate('/project?id=..')`) potrebbe rimuovere `&profile=` dall'hash — se il test conferma, è un fix di preservazione a parte.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): applicazione permessi del profilo nel Configurator (Fase 2)
**Prompt**: passa alla fase successiva (F2). + tracciare il cleanup di metamodelId/metamodelInfo e ricordarlo a fine feature.
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx`, `frontend/src/components/environment/configuratorTab.scss`. Referto (addendum F2 + nota cleanup §7.1) e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 2 file del ConfiguratorTab.
**Layer Impact Report**: not-required — nessun file di §3.1 toccato; il gate read-only è ESTERNO a IRForm (che è §3.1): wrapper `pointer-events:none`, non modifiche al form.
**Smoke visivo**: non eseguito — app non avviata; il fix compila.
**Notes**: Runtime: `resolveTypePermission(profile, typeId)` — `hidden` già filtrato dalla top-bar (F1 `visibleTopLevelTypes`); `read` → New disabilitato + IRForm in gate read-only (banner + `.configurator__ro-body{pointer-events:none}`, scroll sulla colonna detail); `edit` → pieno. Soft-frontend (D1): UX non sicurezza (nascondere dati a un profilo = backend, fuori scope). Per-campo rinviato. Cleanup metamodelId/metamodelInfo tracciato in §7.1 del referto di consolidamento, da rimuovere a feature completa.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): rimossa la selezione del metamodello dallo step General
**Prompt**: in General rimuovere la selezione del metamodello (l'ambiente copre tutto il progetto, non un singolo metamodello).
**Files touched**: `frontend/src/components/envgen/steps/GeneralStep.tsx`, `frontend/src/components/envgen/EnvGenWizardModal.tsx`, `frontend/src/components/envgen/hooks/useEnvGenWizard.ts`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (a)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione.
**Out-of-scope changes**: no — 3 file dello stesso step/hook.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — screenshot utente; il fix compila.
**Notes**: Tolti la select «Source Metamodel», l'info box del metamodello (props `metamodels`/`metamodelInfo` di GeneralStep e loro passaggio nel modale) e la validazione «Source metamodel is required» nell'hook (General passa col solo nome). Il campo `EnvGenGeneral.metamodelId` resta nel tipo (default '', innocuo); il metamodelInfo memo dell'hook resta ma inutilizzato (Rule 9).
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — fix(#157): etichetta «metamodello:metaclasse» negli step del wizard
**Prompt**: nello step «Editable metaclasses» le metaclassi omonime di metamodelli diversi (es. due `iSQD_Profile`) sono indistinguibili; etichettare `metamodello:metaclasse`.
**Files touched**: `frontend/src/components/envgen/steps/MetaclassesStep.tsx`, `frontend/src/components/envgen/steps/ProfilesStep.tsx`. Questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (a)
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. Non riverificato a runtime in questa sessione (segnalato da screenshot utente).
**Out-of-scope changes**: no — 2 step del wizard.
**Layer Impact Report**: not-required — nessun file §3.1.
**Smoke visivo**: non eseguito — screenshot fornito dall'utente mostra il problema; il fix compila.
**Notes**: Entrambi gli step ora iterano `LProject.getProject().metamodels` (LModel `.name`+`.classes`) e mostrano `${metamodel.name}:${class.name}`. Il ConfiguratorTab runtime resta con nomi brevi (leggibilità fruitore). I pointer salvati (topLevelTypes/typePermissions) restano id di classe: cambia solo l'etichetta.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — refactor(#157): merge del configuratore nel wizard EnvGen + rename role→profile
**Prompt**: esiste una bozza (wizard EnvGen); farne UN solo configuratore fondendo F0/F1, rinominare role→profile, tenere gestione profili + metaclassi editabili, rimuovere gli step concrete-syntax/tech-stack/output, riquadrare come modalità stand-alone (non generazione). Consolidare le prime 2 fasi.
**Files touched**: envgen (`EnvGenWizardModal.tsx`/`.scss`, `hooks/useEnvGenWizard.ts`, `types.ts`, nuovi `steps/MetaclassesStep.tsx`+`steps/ProfilesStep.tsx`), `joiner/{classes.ts,environmentConfig.ts,index.ts,__tests__/environmentConfig.test.ts}`, `components/environment/ConfiguratorTab.tsx`, `pages/components/{LeftBar.tsx,Navbar.tsx}`; rimossi `components/environment/EnvironmentConfigModal.tsx`+`.scss`. Referto e log in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: 2026-09-23 12:00
**Causa**: (f)
**Regressions**: unknown — `npx vitest` env config **21/21**; `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI del wizard non esercitata a runtime in questa sessione (le parti metaclassi/profili sono le stesse di F0b, già confermate dall'utente).
**Out-of-scope changes**: no — 15 file, tutti conseguenza diretta del merge richiesto (deroga RC-11 dichiarata; piano e stima file confermati prima di procedere).
**Layer Impact Report**: not-required — nessun file di §3.1; scritture via SetFieldAction/`.new()` (self-transaction), nessun canvas/sync.
**Smoke visivo**: non eseguito — app non avviata; type-safe e compilante.
**Notes**: Persistenza: metaclassi+profili sullo stato di progetto (DEnvironmentConfig/DProfile, live), general/design/features restano su localStorage (EnvGenPersistence) immutati. Rename role→profile con back-compat (findProfile accetta legacy 'DRole'; profileIdsOf legge legacy 'roles'). Modale F0b assorbito in due step del wizard e rimosso; azione LeftBar e Navbar aprono il wizard (EnvGenEvents.OPEN_WIZARD). Footer "Generate"→"Done". Referto: discovery_2026-09-23_157_consolidation_envgen_merge.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): Configurator screen, primo taglio overlay (Fase 1)
**Prompt**: passare a F1 (Configurator screen) dopo lo smoke ok di F0b. Scelta UX confermata dall'utente: overlay dal LeftBar (non tab del Dock).
**Files touched**: `frontend/src/components/environment/ConfiguratorTab.tsx` (nuovo), `frontend/src/components/environment/configuratorTab.scss` (nuovo), `frontend/src/pages/components/LeftBar.tsx`. Referto e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione.
**Out-of-scope changes**: no — 3 file (coppia componente+scss + aggancio LeftBar); nessun tocco a InstanceManagerTab/DockManager.
**Layer Impact Report**: not-required — nessun file di §3.1; riuso di helper/adapter esistenti (`instancesOfClass`, `IRForm`, `applyCreate`), `applyCreate` chiamata bare (editor-v2 §3.3, nessuna TRANSACTION esterna).
**Smoke visivo**: non eseguito — app non avviata; UI type-safe e compilante ma non provata a mano. Criterio (tipo→istanze→New crea e apre) da verificare a runtime.
**Notes**: Overlay full-screen (createPortal→body) da azione «Open Configurator» nel project sidebar. Top-bar = visibleTopLevelTypes(config F0, ruolo da ?role); lista via instancesOfClass sul primo modello del progetto; dettaglio via IRForm; New = makeShapeCtx→newDraft→applyCreate (bare). Sola lettura della config; gating read/edit rinviato a F2; picker modello e tab-vero rinviati a F1b. Referto: discovery_2026-09-23_157_fase1_configurator.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): mini-UI Environment config (Fase 0b)
**Prompt**: passare alla Fase 0b — mini-UI per il language developer per marcare i tipi top-level e creare/editare i ruoli con permessi per-tipo. Niente PR.
**Files touched**: `frontend/src/components/environment/EnvironmentConfigModal.tsx` (nuovo), `frontend/src/components/environment/environmentConfigModal.scss` (nuovo), `frontend/src/pages/components/LeftBar.tsx`. Referto (addendum) e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npm run typecheck` output COMPLETO **14** pre-esistenti (0 nei file toccati); `npm run build` `✓ built`. UI non esercitata a runtime in questa sessione (app non avviata).
**Out-of-scope changes**: no — 3 file (coppia componente+scss come unità logica + l'aggancio nel LeftBar).
**Layer Impact Report**: not-required — nessun file §3.1; UI classica, scritture via SetFieldAction/DRole.new (self-transaction), nessun edge di canvas.
**Smoke visivo**: non eseguito — app non avviata; la UI compila ed è type-safe ma non provata a mano. Criterio (marca 4 tipi + crea 2 ruoli persistenti) da verificare a runtime.
**Notes**: Modale portallato (createPortal→body) aperto da un'azione del project sidebar (LeftBar). Config letta via findEnvironmentConfig su idlookup (lazy getOrCreate all'apertura), scritture SetFieldAction replace; topLevelTypes da LProject.classes; permessi hidden/read/edit su DRole.typePermissions (solo override, default edit). Delete ruolo = unreference (TODO cleanup entità). Referto: discovery_2026-09-23_157_fase0a_entity_pattern.md addendum F0b.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-23 — feat(#157): entità DEnvironmentConfig/DRole (Fase 0a, schema + read/write)
**Prompt**: eseguire il prompt di corsia della Fase 0a (docs/prompts/claude_2026-09-23_1200_prompt_157_fase0a_environment_config.md): entità di configurazione ruoli/ambienti, solo schema dati e read/write, nessuna UI. Hard-stop di approvazione sciolto dal committente.
**Files touched**: `frontend/src/joiner/classes.ts`, `frontend/src/joiner/index.ts`, `frontend/src/joiner/environmentConfig.ts` (nuovo), `frontend/src/joiner/__tests__/environmentConfig.test.ts` (nuovo). Referto e questa entry in commit docs separato (§6.4).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — `npx vitest run` sul file nuovo **17/17**; `npm run typecheck` output COMPLETO **14** errori pre-esistenti (baseline file noti), **0** nei file toccati; `npm run build` `✓ built` col solo warning chunk-size.
**Out-of-scope changes**: no — 4 file, tutti previsti dal prompt F0a.
**Layer Impact Report**: not-required — nessun file di §3.1; nuova entità D/L, nessuna scrittura sync/portDistribution, `.new()` self-gestisce la sua TRANSACTION (nessun creator dentro TRANSACTION esterna, §3.3/§3.4 fuori portata).
**Smoke visivo**: non applicabile — F0a non ha UI.
**Notes**: Entità agganciata al progetto via `father` + scan idlookup (nessun campo su DProject/DState); create lazy (`getOrCreate`), nessun VersionFixer. Logica pura (scan/permessi) in `joiner/environmentConfig.ts`, testabile senza `window`. Gotcha: `static get` collide con `RuntimeAccessibleClass.get` (TS2417) → rinominato `getForProject`. Referto: discovery_2026-09-23_157_fase0a_entity_pattern.md.
**Prompt document name**: 2026-09-23 12:00

## 2026-09-18 — docs: trasporto normativo, passo 2 di P-2026-09-18-2110
**Prompt**: passo 2 di P-2026-09-18-2110 (emenda P-2026-09-18-1930): portare sul tronco tre dei
quattro delta normativi misurati a `fbcbcb820` contro questo tronco (`7bc6c7365`) — §9.3 di
CLAUDE.md, le due righe `P1..P9`→`P1..P12`, il trailer `Model:` di PROTOCOL.md P6 con la versione
1.1→1.2. La frase di rotazione di P9 (`npm run log:rotate`) non viaggia: lo script non esiste su
questo tronco (RC-10).
**Files touched**: `CLAUDE.md`, `docs/PROTOCOL.md`, `AGENTS.md` (rigenerato, regola 1c).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Dry run at `6d0eaf9fc`: fold 19, move 19, nothing refused. Write at `13ebde1e6`: harness 10, simulation 5, versionfixer 5 folded (20), 20 moved, active 40, archive 1202 to 1222; each inbox keeps its preamble, archive +445/-0 above its previous first entry, log preambles unchanged. This entry makes 41; one more `--rotate --write` moves the oldest, 40 again. `check:docs` 4/4 at each commit; `check:agents` green.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Closed: `CLAUDE.md still cites P1..P15` by `13ebde1e6`. Written down: `bash-guard reads the merge state from the payload cwd only` (ticket, low, open). The first `git commit` hit the settings `ask`, not granted; resumed on Alfonso's word. The fold drops the blank line after an inbox's last entry: headings with none above, log plus archive, 54 before, 56 after; `check:docs` does not see it.
**Prompt document name**: 2026-09-26 23:50

## 2026-09-26 — ticket: one Back after a cancelled navigation stays on the same project
**Ticket**: After "Stay on page", `R.navigate` rewrites the entry that setting the hash pushed back to the shown URL (`location.replace`), so the history holds that URL twice. Measured (P5 of `982581260`): entries `[A, A]` at index 1; one `history.back()` is a same-document traverse that stays on A, with no `U.resetState` and the editor mounted. Accepted by Q5 of P-2026-09-25-1905; recorded so that a later history change knows it.
**Priority**: low
**Found in**: P-2026-09-25-1905
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§5 risk 2)
## 2026-09-26 — ticket: no unload warning after a canvas edit
**Ticket**: The `beforeunload` warning is enabled only by `ProjectEditor.tsx:409` and disabled when that component unmounts; `ProjectEditor` is the summary tab (`ModelsSummaryTab`). Measured by hand by Alfonso on 2026-09-26 (3003, `982581260`, Chrome): add a class in the canvas, click the logo: no browser prompt, the dashboard opens, the class is gone. Either the summary tab is unmounted while an editor tab is active (rc-dock) and the handler with it, or the canvas creation path does not set `U.isProjectModified` (`createAdapter.ts:547` and `formWrite.ts` set it, the canvas menu may not): a discovery decides. Effect: a model edit plus any `R.navigate` reloads without asking and loses the work; unlike the "Stay" case it needs no wrong answer from the user. Wanted: the warning armed while the project page is mounted and the project modified, whatever tab is active.
**Priority**: high
**Found in**: P-2026-09-25-1905 (visual check), chat C-2026-09-25-1353
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§1 "Who can meet the prompt")

## 2026-09-26 — ticket: a saved description keeps its old text in the blob's idlookup
**Ticket**: After an edit of the project description and Cmd+S, with no navigation, the saved record's `lastModified` advances and the blob carries the edited text, while `idlookup[A].description` in the blob keeps the old one. Measured by hand by Alfonso on 2026-09-26 (3003, `982581260`, Chrome, no navigation): description set to `a`, Cmd+S, Cmd+R, and the page shows the text of a previous save; the same after a "Stay" round (steps 3-8 of the Phase 2 check). User-facing: a saved description does not survive a reload; raised from low to medium on 2026-09-26 (chat C-2026-09-25-1353). Read, not verified: `U.compressedState` writes `state.idlookup[id] = {...dproject, state: ''}` (`U.tsx`) from the caller's `dproject`, which the VER1 note in `projects.ts` describes as detached. A discovery of its own.
**Priority**: medium
**Found in**: P-2026-09-25-1905
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§0 the save check, §4 F6)

## 2026-09-26 — ticket: confirm first, then reset or log out (user-menu Dashboard, Sign-out)
**Ticket**: Two callers of `R.navigate` act before the unload prompt can be answered. The user menu's Dashboard throws offline at `Navbar.tsx:1999` (`Collaborative.client` undefined) and, online, calls `U.resetState()` before `R.navigate`: since `982581260` a "Stay" there reloads A from storage and the unsaved edit is lost (was: frozen tab). Sign-out asks twice (the in-app confirm, then the browser prompt) and logs out first: since `982581260` a "Stay" leaves a working, logged-out tab whose Cmd+S persists nothing and clears the dirty flag (was: frozen tab). Wanted: confirm first, then reset or log out; the Sign-out paths disable the unload warning after the in-app confirm, as `CloseProject` does at `Navbar.tsx:498`, so the browser prompt cannot be reached from Sign-out. Where the disable lives (`AuthApi.logout` or the three call sites) is this ticket's discovery.
**Priority**: medium
**Found in**: P-2026-09-25-1905
**Detail**: docs/discovery/discovery_2026-09-25_navigate_cancel.md (§3.3, §4 F4 F5)

## 2026-09-26 — fix(nav): a cancelled reload keeps the tab alive (P-2026-09-25-1905)
**Prompt**: `claude_2026-09-25_1905_fase2_navigate_cancel.md`, Phase 2 of `P-2026-09-25-1905`, `Lane: fast`, from the high ticket of P-2026-09-25-1440 (the frozen reducer after "Stay on page"). Phase 1 report `8d6febf5f` (`docs/discovery/discovery_2026-09-25_navigate_cancel.md`), candidate §8 as it stands; Q1-Q6 ratified in the prompt. The branch was rebased from chat onto `5433451fd` before this phase.
**Files touched**: code `982581260`: `frontend/src/common/navigateReload.ts` (new), `frontend/src/common/__tests__/navigateReload.test.ts` (new), `frontend/src/common/U.tsx` (`R.navigate`: three lines become one `hashReload` call, plus the import). Docs: the report `8d6febf5f`; this commit: this entry, the Status lines of the Phase 1 and Phase 2 prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `982581260`: `npm run typecheck` exit 2, 14 errors, the §17 set (sorted diff with the baseline empty); `npx vitest run` 4772 passed (4767 + 5, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4. Red first: the new test failed at import. Probes on 3003: P1 Stay (logo, project → project) keeps the tab on A with the flag down, a second edit applied and saved; P2 Leave and P3 the LeftBar control as before.
**Out-of-scope changes**: no — the three files of the prompt's DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required (not owed: no `CLAUDE.md` §3.2 file touched)
**Smoke visivo**: passato 2026-09-26, Alfonso by hand on 3003 (`982581260`, Chrome): after "Stay on page" the tab is alive, a second edit of the description is taken, Cmd+S saves. The reload oracle of the prompt (step 8) is spoiled by F6: the page shows the text of a previous save (ticket below, raised to medium). The same round with a class added in the canvas showed no browser prompt at all (new ticket below, high).
**Notes**: Chromium-only coverage (Q4): Firefox and Safari read, not measured; without the Navigation API, or without the abort, the behavior is today's. Mutation bench 8/8, table in `982581260`; M6 dies by V4 and by V5's exact call list, not by V4 alone as declared. P5: after a Stay the history holds A twice and one Back stays on A, no reset (ticket below). The temporary symlink `frontend/node_modules` and the 3003 server are removed by the session at the ACK that follows this flip.
**Prompt document name**: 2026-09-25 19:05

## 2026-09-26 — fix: else on Petri transitions, panel lines above the buttons (P-2026-09-26-1535)
**Prompt**: `claude_2026-09-26_1535_prompt_sim_petri_else_panel_lines.md`, full lane on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-64 and R-SIM-65 (`470c07ee7`), then R-SIM-66, ratified by Alfonso at the hard stop (amends R-SIM-65; block added by this commit). Closes both Ticket paragraphs of the `P-2026-09-26-1315` entry: `else` on Petri transitions, and a line that appears moving the buttons.
**Files touched**: code `b76d75cc9`: `frontend/src/model/simulation/netCompile.ts`, `model/simulation/__tests__/netCompile.test.ts`, `components/editor-v2/sim/SimulationPanel.tsx`; code `f58456c63`: `SimulationPanel.tsx`. Docs, this commit: this entry, the Status of the prompt file, R-SIM-66 in `docs/decisions.md`.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 13:15 (`claude_2026-09-26_1315_fase2_sim_guard_outcomes.md`: its one-line clamp left the lines that appear moving the buttons)
**Causa**: (a)
**Regressions**: yes — transient: `b76d75cc9` made the interruption move Step 24.5 px down (it did not move before), measured at the hard stop and fixed by `f58456c63` (R-SIM-66). On `f58456c63`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4832 passed (4828 + 4), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Mutation bench 5/5 killed.
**Out-of-scope changes**: no — the files of DOVE; `simulation-panel.scss` needed no change; the second commit on `SimulationPanel.tsx` was asked for by the chat at the hard stop.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, 2026-09-26 on 3002, steps 1, 2, 3, 4 and 6: `pelse` fires `te`; defects and halt lines above the buttons; the interruption replaces «Last step»; Step never moves; `flow` Terminated. Step 5 (a refused Reset after a run) verified by the session only (measurement and `shots_1535r` screenshots).
**Notes**: One helper, `resolveElse`, serves both shapes, so `else-twice` is written once; the Petri message reads «two else transitions share a preset». The end-to-end cases sit in `netCompile.test.ts` with an inline oracle, not in `netStep.test.ts`. Second cause (c): the 3a compiler read R-SIM-31's `else` on control-flow edges only. The session was not fresh: the same as `P-2026-09-26-1315`. The first Reset of a run still makes the slot appear once (R-SIM-66).
**Prompt document name**: 2026-09-26 15:35
**Ticket** (priority low, opened here, not fixed). An `else` on an edge of a fused fork/join in control flow gets `elseOf: null`: `compileControlFlow` builds the fused transitions after `resolveElse` has run on the plain edges (`netCompile.ts`), so the text `else` stays a guard site and, from the Petri probe of `P-2026-09-26-1315` on the same parser, is a `parse-error` defect («1:1 Expected expression»). Read, not measured on a fused fixture.
## 2026-09-26 — feat: the panel says why an input has no candidate (P-2026-09-26-1315)
**Prompt**: `claude_2026-09-26_1315_fase2_sim_guard_outcomes.md`, Phase 2 of `P-2026-09-26-1315` on `simulation-engine` in `~/jjodel-sim`, full lane, bound by R-SIM-57..63 (`5fdd3da6a`). Phase 1 report `7abb57eaa` (`docs/discovery/discovery_2026-09-26_sim_guard_outcomes.md`). Options C1 and A plus the discard wording and the one-line clamp; `model/simulation/` untouched. Closes the B2 ticket «the panel shows no guard outcome, false and defect alike».
**Files touched**: code `fa56c14de`: `frontend/src/components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `simulation-panel.scss`, test `sim/__tests__/simBridge.test.ts`. Docs: the report `7abb57eaa`; this commit: this entry, the Status lines of the two `P-2026-09-26-1315` prompt files.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 11:03 (`claude_2026-09-25_1103_fase2_sim_step3b_panel.md`: its discard text says no transition accepted the input when a guard was false)
**Causa**: (c)
**Regressions**: no. On `fa56c14de`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4828 passed (4818 + 10, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: 10 new tests and the reworded defects line. Mutation bench 11/11 killed.
**Out-of-scope changes**: no — the four files of DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, 2026-09-26 on 3002, steps 1-6: the Deadlock reason and its list, the defects line for `a b` and `node.[x] > 0`, `p2.[visits]` named, the turnstile title and discard, a long «Last step» on one row, `flow` Terminated with no reason.
**Notes**: The prompt's ruling «no text changes the panel's height» was stronger than R-SIM-63 and is met only for wrapping (second ticket). Interpretations under test: the error class stripped in the title too; within an input «;», between inputs «·», the inputs that say why before «nothing enabled». One closure commit with the entry and both Status flips (RC-17), not the inbox alone as the log-entry skill says. Probe files gitignored and removed.
**Prompt document name**: 2026-09-26 13:15
**Ticket** (priority medium, opened here, docs only). `else` on a Petri transition is compiled as an ordinary guard expression: `netCompile.ts:228` recognises it on control-flow edges only and `compilePetri` sets `elseOf: null`, while R-SIM-25 and R-SIM-31 define it as the complement of its siblings. Probe on the pure core (not committed): p (1 token) with `tf` (p → a, guard `false`) and `te` (p → b, guard `else`): `te` has `elseOf: null`, its guard is a `parse-error` defect («1:1 Expected expression») listed in `compileDefects`, no candidate, status `Deadlock`; with the complement `te` would fire. The panel now says `ε: tf false; te defect, parse error 1:1 Expected expression`.
**Ticket** (priority medium, opened here; the chat decides the layout). A line that appears for the first time (the defects line at Reset, the halt, error and interruption lines) still moves the action buttons, measured 24.5 px at Reset (b2net with `a b`: Step 854.5 → 830), because the panel is anchored at the bottom and those lines sit below the actions row; the one-line clamp of R-SIM-63 prevents wrapping, not appearing. Candidate fix: place the variable lines above the actions row, so the panel grows upward without moving the buttons.

## 2026-09-26 — ticket: the panel shows no guard outcome, false and defect alike
**Ticket**: The Simulation panel never renders `NetLabel.evaluated` nor a guard's defect detail: no UI reads them (`lastStepText` in `simBridge.ts` prints fired, halted, discard, quiescence, inadmissible; `defectsLine` covers net compile defects only). A guard that is `false`, one that does not parse, `node.[x] > 0` (E-NODE) and `p.[visits] > 0` (undeclared) all show the same `Deadlock` with the buttons off (R-SIM-29). Show the evaluated guards of the last step, or at least the guard defects after Reset. To be scheduled before lane C: actions multiply the run-time defects the panel cannot show.
**Priority**: medium
**Found in**: P-2026-09-26-1105

## 2026-09-26 — feat: guards read state, pure action evaluator, wave B2 (P-2026-09-26-1105)
**Prompt**: `claude_2026-09-26_1105_fase2_state_operator_b2.md`, wave B2 of the `.[x]` operator (report §7.3) on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-17, R-SIM-18, R-SIM-30, R-SIM-39..43. Guards read σ through an adapter of `SimStateAccess` (`marked`, `tokens`), parsed strictly; a pure action evaluator, tested end to end on the core with `decls`, not wired (`NO_SIM_ACTIONS` until lane C).
**Files touched**: code `81373fab0`: `frontend/src/model/simulation/guardContext.ts`, `guardEvaluator.ts`, `actionEvaluator.ts` (new), `components/editor-v2/sim/simBridge.ts`; tests `model/simulation/__tests__/guardContext.test.ts`, `guardEvaluator.test.ts`, `actionEvaluator.test.ts` (new), `sim/__tests__/simBridge.test.ts`. Docs, this commit: this entry, the ticket below, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `81373fab0`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4818 passed (4772 + 46, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: 16 tests and one file at collection before the code. Mutation bench 12/12 killed.
**Out-of-scope changes**: no — 8 files, above the Rule 19 five, every one in the prompt's DOVE list, which authorized them; `git diff --stat` of every other path empty.
**Layer Impact Report**: produced
**Smoke visivo**: passato — Alfonso, 2026-09-26 on 3002, steps 1-6: b2net Deadlock after two steps with p1 still marked; `p2.[marked]` fires only with p2.tokens = 1; `node.[x]` and `p2.[visits]` end in Deadlock, outcome read from the console snippet; flow unchanged to Terminated.
**Notes**: Prompt error, not a lane deviation: step 7 expected the guard outcome in the label or candidate line and the inputs enabled in Deadlock; the panel never shows `evaluated` and R-SIM-29 turns every input off, so items 2 and 4 were confirmed via the console snippet. Interpretation under test: `marked`/`tokens` only on places of the net. §8 B2 draft holds, plus the strict parse. Console error `failed to get project {project: null}` at load, not investigated. One closure commit (RC-17).
**Prompt document name**: 2026-09-26 11:05

## 2026-09-26 — merge: bypass gates and Opus 5.5 pin into the trunk (P-2026-09-26-2245)
**Prompt**: `claude_2026-09-26_2245_prompt_merge_harness_bypass.md`, `Lane: full (merge, harness settings and hooks)`, single phase on the trunk in `~/jjodel-release`, hard stop before `~/jjodel-sim`. Merge `f3a014e4d` (`harness-bypass`, P-2026-09-25-1022) with `--no-ff`. Closes on the trunk the BLOCKING ticket `merge P-2026-09-25-1022 before the first orchestrated launch` (found in P-2026-09-26-1640) with the merge `9cd3e632b`.
**Files touched**: merge `9cd3e632b`: the ten files of `afaea8756..f3a014e4d` (`.claude/settings.json`, `.claude/skills/status-flip/SKILL.md`, `docs/HARNESS-DOCS.md`, the 1022 report and prompt, `docs/log-inbox/harness.md`, `bash-guard.mjs`, `critical-zone.mjs` and their two tests); one hand edit, the inbox as a union (trunk's 71 lines, then the 1022 entry, 15 lines added). This commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `9cd3e632b`: typecheck 14, the §17 set; typecheck:scripts 0; hook tests 250 passed (220 + 30, stated before), `laneRun.test.ts` 17; vitest 4884 passed (4854 + 30, stated before), 0 failed, the same 9 red at import; build 0; `check:docs` 4/4, 5 warnings; `check:agents` green; `check:scripts` 27 files, 0 probes. Probes: push denied in bypass, silent in default; critical zone denied in bypass, ask in default; skill extractions byte-identical to HEAD's.
**Out-of-scope changes**: no — ten files in the merge, the ten named in step 2 of the prompt; the one hand edit is the inbox union the prompt allows.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Step 5 named `editor-v2/sync/useJjomSync.ts`, which does not exist; probed `editor-v2/hooks/useJjomSync.ts`, the 3.2 file (the literal path: no output, correctly). The range `afaea8756..b8dc0edae^` omits `b8dc0edae`; the merge body lists 121 commits. log-entry rule 6 not followed: P13 and the prompt put this entry with the Status line. The `simulation-engine` half of the ticket is step 9, after Alfonso's OK.
**Prompt document name**: 2026-09-26 22:45
## 2026-09-26 — ticket: CLAUDE.md still cites P1..P15
**Ticket**: `CLAUDE.md:14` and `CLAUDE.md:108` say `P1..P15`, while `docs/PROTOCOL.md` 1.6 has P16. Outside the perimeter of P-2026-09-26-1640 (a fix regenerates `AGENTS.md`). Update both to `P1..P16`, then `npm run gen:agents` and `npm run check:agents`.
**Priority**: low
**Found in**: P-2026-09-26-1640
**Detail**: docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md (§4)

## 2026-09-26 — ticket: merge P-2026-09-25-1022 before the first orchestrated launch
**Ticket**: BLOCKING for the first orchestrated launch: no `claude -p` session in bypassPermissions runs on a branch that does not carry the push deny. `harness-bypass` (`cd5eb9eb5`, closure `f3a014e4d`) holds the push deny under bypass in `bash-guard.mjs` and the `claude-opus-5-5` pin (RC-16, RC-19). Neither `alfonso-frontend-jjtl` nor `simulation-engine` has it; both pin `claude-opus-5`. Measured 2026-09-26: under `-p` in bypass mode the settings `ask` on `git commit*` did not hold, so the one on `git push*` would not either (inferred, no push attempted). Merge it into the trunk and the simulator branch first.
**Priority**: high
**Found in**: P-2026-09-26-1640
**Detail**: docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md (§7)

## 2026-09-26 — feat(harness): P16 orchestrated lanes and the lane-run launcher (P-2026-09-26-1640)
**Prompt**: `claude_2026-09-26_1640_prompt_harness_orchestrated_lanes.md`, full lane (more than 3 files), two phases on the trunk in `~/jjodel-release`. RC-20..24 turned into normative text (P16; P8 and P13 amended; HARNESS-DOCS §4.1 and §7) and into `frontend/scripts/lane-run.mjs`, the chat's launcher (start, resume, status).
**Files touched**: report `9878f7cc6`: `docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md` (new). Docs `f6ad47d46`: `docs/PROTOCOL.md` (1.6), `docs/HARNESS-DOCS.md` (1.5). Code `e00392612`: `frontend/scripts/lane-run.mjs` (new), `frontend/scripts/hooks/__tests__/laneRun.test.ts` (new, 17 cases). Docs, this commit: this entry, two tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Hook tests 220 passed, 0 failed (baseline 203); `check:docs` 4/4 with 5 warnings, as the baseline; `check:scripts` PASS on 27 files (baseline 25); the `status-flip` and `discovery-report` extractions byte-identical to HEAD's; Check A untouched. Mutation bench on `lane-run.mjs`: 24 of 25 at round 1 (M12, weak fixture), 25 of 25 at round 2; the table is in the body of `e00392612`.
**Out-of-scope changes**: no. Six files, all in DOVE, listed at the GO (RC-11). The entry goes to this inbox, not to `docs/claude-code-log.md` as the prompt wrote: ratified answer 1 (the active log sits at 40 entries).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Precondition: HEAD was 80a9eb9fd, not the prompt commit d0f040002 (two svg-only commits after it); the merge P-2026-09-26-1615 then ran with commits paused, and Phase 1 started on df9d7a5e0 at Alfonso's word. Eleven Phase 1 answers ratified as recommended (RC-21, report §12), a twelfth on the M12 survivor. Commit type feat(harness) chosen: the prompt named none. The BPMN figure labels two Status flips; P13 and §7 keep the one of RC-17.
**Prompt document name**: 2026-09-26 16:40

## 2026-09-26 — chore(dev): allow the shared node_modules in the Vite serving list (P-2026-09-26-1335)
**Prompt**: `claude_2026-09-26_1335_prompt_bootstrap_icons_font.md`, fast lane, single phase on `icons-font` in `~/jjodel-icons`, one hard stop (Alfonso's check on 3005). On every worktree dev server the Bootstrap Icons font returned 403 and the icons rendered as empty squares: the P14 `node_modules` symlink makes Vite serve the font from its real path under `~/jjodel`, outside the default `server.fs.allow`.
**Files touched**: report `ad64eaa34`: `docs/discovery/discovery_2026-09-26_bootstrap_icons_font_403.md` (new). Code `b1ba29157`: `frontend/vite.config.ts` (`server.fs.allow` = `searchForWorkspaceRoot(__dirname)` + the real `node_modules`, guarded `realpathSync`). Docs, this commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 11:00 (observation of chat C-2026-09-26-1100: Bootstrap icons as empty squares on 3001, font 403 there, 200 on 3000)
**Causa**: (g)
**Regressions**: no. On 3005 the font went from 403 to 200 `font/woff2`; the controls `/@fs/.../jjodel/frontend/package.json` and `/@fs/etc/hosts` stayed 403. Gates on `b1ba29157`: typecheck 14, the §17 set; typecheck:scripts exit 0; build exit 0, same 51 warning lines, `dist/` md5-identical to a HEAD-config build (3494 files); vitest 4818 passed, 0 failed, the same 9 red at import; `check:docs` 4/4.
**Out-of-scope changes**: no — one config file as declared. Report and config in two commits instead of one, per P13.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso on 3005, private window, 2026-09-26: the Bootstrap icons render)
**Notes**: Mechanism: Vite realpaths resolved modules but not the allow entries; the CSS passes via safeModulePaths, its url() font does not. ~/jjodel unaffected: its real node_modules is inside its root. Code commit first made as 5a890a0df and amended at the ACK to add the name check to its body; tree identical. Vitest 4818 measured on 9290c17be. Temporary symlink frontend/node_modules created and removed. Detail: the report, §2-§4.
**Prompt document name**: 2026-09-26 13:35
**Ticket** (priority low, not a slot). `frontend/vite.config.ts` is type-checked by no gate (`tsconfig.json` includes `src` only). A manual `tsc` on it reports one TS2769, `css.preprocessorOptions.scss` (`api`, `includePaths`) not assignable to `SassPreprocessorOptions`, identical on the HEAD config and after this fix (report §4).

## 2026-09-26 — ticket: bash-guard reads the merge state from the payload cwd only
**Ticket**: `bash-guard.mjs` takes the merge state (`MERGE_HEAD`) and the pathspec root only from the hook payload's `cwd` (lines 87 and 335 at `5c542b039`), never from a `cd` or `git -C` target, so a `git commit` that concludes a merge in another worktree from the chat's session is always denied. Measured in P-2026-09-26-2245 step 9, where the sim merge had to be redone with `-F` in one command.
**Priority**: low
**Found in**: P-2026-09-26-2245
**Detail**: frontend/scripts/hooks/bash-guard.mjs (at `5c542b039`: `gitCall` skips `-C` and its value at 87; `makeContext` at 335 feeds `operationInProgress`, 166, and `--show-toplevel` from the payload `cwd`)

## 2026-09-25 — fix: profile closure separates shape and genre (P-2026-09-25-1840)
**Prompt**: `claude_2026-09-25_1840_prompt_sim_profiles_genre_fix.md`, fast lane on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-56 (`fcc012cc8`) with R-SIM-28, R-SIM-48, R-SIM-54, R-SIM-55. Fixes the pure profiles module of `P-2026-09-25-1805`: the control-flow closure takes Initial or Initial marking, Initial marking is derived from Initial in the system profiles, a derived role with a source binds only when its source does, and Custom reads `simBound` and `simInitialMarking` in control flow. Nothing wired.
**Files touched**: code `a27e46e8d`: `frontend/src/model/simulation/simProfiles.ts`, `profileCodec.ts`, tests `__tests__/simProfiles.test.ts`, `__tests__/profileCodec.test.ts`. Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 18:05 (`claude_2026-09-25_1805_prompt_sim_role_catalog_profiles.md`: its closure followed R-SIM-48, amended by R-SIM-56)
**Causa**: (a)
**Regressions**: no. On `a27e46e8d`: `npm run typecheck` exit 2, 14 errors, set identical to the baseline; `npx vitest run` 4772 passed (4767 + 5, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline. Red first: 19 tests in the two files before the code. Mutation bench 14/14 killed, table in `a27e46e8d`.
**Out-of-scope changes**: no — the four files of DOVE; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Closes the Ticket paragraph of `a14c7dfa8` (the P-2026-09-25-1805 entry above): a control-flow bag with `simInitialMarking` and no `simInitial` is complete for its Custom profile, and `simBound` gives k. Interpretations, under test: a derived role without `from` still binds; a cycle of sources binds nothing and does not throw. One closure commit with the Status, per RC-17, not the inbox alone as the log-entry skill says.
**Prompt document name**: 2026-09-25 18:40
**Ticket** (for the wiring lane, docs only). `validateProfile` accepts a derived role whose `from` is off: a user profile with Initial off and Initial marking derived from Initial validates, since the derived side meets the either-item, yet it can never be checkable. The catalog does not list Initial among the dependencies of Initial marking, so `dependencyOff` does not catch it. Candidate fix in `simProfiles.ts`: a derived `from` that is off is a defect.

## 2026-09-25 — feat(harness): hook gates off ask under bypass, Opus 5.5 pin (P-2026-09-25-1022)
**Prompt**: `claude_2026-09-25_1022_prompt_harness_bypass_gates.md`, two-phase, on `harness-bypass` in `~/jjodel-gate`. Phase 1 report `ddee7a09e` (`docs/discovery/discovery_2026-09-25_harness_bypass_gates.md`). GO with four rulings: `docs/HARNESS-DOCS.md` rows 381-382 join the closure commit; `status-flip` loses the lone-commit path; the bypass deny covers the whole 3.2 trigger, with one test for a creator outside the six and one for `SetFieldAction` in `sync/`; `settings.local.json` of this worktree deleted after the gates. `bubble` stays `ask`.
**Files touched**: code `cd5eb9eb5`: `.claude/settings.json`, `.claude/skills/status-flip/SKILL.md`, `frontend/scripts/hooks/critical-zone.mjs`, `bash-guard.mjs`, `__tests__/criticalZone.test.ts`, `__tests__/bashGuard.test.ts`. Docs: the Phase 1 report `ddee7a09e`; this closure commit: `docs/HARNESS-DOCS.md`, the prompt file (Status), this inbox. Untracked, no commit: `.claude/settings.local.json` deleted.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `cd5eb9eb5`: `npx vitest run scripts/hooks` 233 passed (203 + 30), the 203 old tests unchanged; `check:docs` 4/4; `check:agents` green; `typecheck:scripts` exit 0; `check:scripts` pass. Mutation bench through `HOOKS_DIR`: 18 of 18 killed, listed in the body of `cd5eb9eb5`; control, an unmutated copy through the same path, 233 passed.
**Out-of-scope changes**: yes — `docs/HARNESS-DOCS.md` was outside the prompt's DOVE and joined by the GO, as DOVE provides; 10 files over the lane (6 code, 4 docs), above the P6 five, all declared in the prompt, the report or the GO. Nothing else.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — harness lane, nothing reaches the UI.
**Notes**: The `bypassPermissions` value on a hook's stdin is read from the docs and the 2.1.282 binary, not captured: capturing it needs a logging hook, which the prompt forbids (report §1.5). Gates ran through a temporary `node_modules` symlink (P14), removed at the end. The deny list refused an `rm -rf` of a bench copy, as designed; the copy stayed in the scratchpad.
**Prompt document name**: 2026-09-25 10:22

**Ticket** (opened, not fixed here). The `log-entry` skill, rule 6, says to commit the inbox alone; RC-17 and P13 put the inbox entry in the lane's closure commit with the Status line. This lane followed the GO and P13. `.claude/skills/log-entry/SKILL.md` needs the same change `status-flip` got here, in a lane that holds it.

## 2026-09-25 — ticket: narrow optimizeDeps.entries to index.html and clean up public/
**Ticket**: The Vite dependency scan uses the default entries glob and reads `test.html`, `public/index.html` and 17 ace demo pages under `public/webjars/ace/1.3.3/`. Narrow `optimizeDeps.entries` to `index.html`, together with a cleanup of those 17 ace demo pages from `public/`.
**Priority**: low
**Found in**: P-2026-09-25-1820
**Detail**: docs/discovery/discovery_2026-09-25_vite_dep_scan.md (§1, §6)

## 2026-09-25 — ticket: re-check the Vite scan override at the next esbuild upgrade
**Ticket**: `frontend/vite.config.ts` turns `experimentalDecorators` off for the dependency scan (`optimizeDeps.esbuildOptions.tsconfigRaw`) to dodge an esbuild 0.27.7 bug. At the next esbuild upgrade, run the three-ingredient minimal repro (legacy decorators; `@dec export class A { static f(s){ eval(s); return A; } }`; transform emits `export { _A }` instead of `export { A }`) and drop the override if it now emits `export { A }`.
**Priority**: low
**Found in**: P-2026-09-25-1820
**Detail**: docs/discovery/discovery_2026-09-25_vite_dep_scan.md (§2.2)

## 2026-09-25 — chore(dev): let the Vite dependency scan parse decorators (P-2026-09-25-1820)
**Prompt**: `claude_2026-09-25_1820_prompt_vite_dep_scan.md`, fast lane, single phase on `vite-dep-scan` in `~/jjodel-vite`, one hard stop (Alfonso's check on 3005). The ticket of P-2026-09-25-1500: on a cold start the dependency scan fails on `MTM.tsx:27` importing `Nearley`, nothing is pre-bundled and the first page load reloads once.
**Files touched**: report `59701d5f0`: `docs/discovery/discovery_2026-09-25_vite_dep_scan.md` (new). Code `8a4335402`: `frontend/vite.config.ts` (`optimizeDeps.esbuildOptions.tsconfigRaw`; `optimizeDeps.include` + `util` and three nodePolyfills shims). Docs, this commit: this entry, two tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 15:00 (ticket: the Vite dependency scan fails on every cold start)
**Causa**: (g)
**Regressions**: no. Cold start before: scan error, 58 deps found at runtime, `reloading`, 3 navigations; after: no scan error, 64 pre-bundled at startup, 0 discovered, no reload, one document load; warm restart: no rescan, `_metadata.json` byte-identical. Gates on `8a4335402`: typecheck 14, the §17 set; build exit 0, `dist/` md5-identical to a HEAD-config build (3494 files); vitest 4629 passed, 0 failed, the same 9 red at import; `check:docs` 4/4.
**Out-of-scope changes**: no — one config file as declared; the `include` ids go beyond the prompt's candidates but stay in it, accepted at the hard stop. Report and config in two commits instead of one, per P13, accepted.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso on 3005, private window: a healthy project opens, one page load, no automatic reload, app as on 3001)
**Notes**: Cause: an esbuild 0.27.7 bug, not missing decorators: legacy decorators + `@dec export class X` naming `X` + a direct eval emit `export { _X }` with no alias. `U.tsx` has the same broken export, but only in the scan, which no longer uses legacy decorators, so this fix covers it: no ticket. Temporary symlink `frontend/node_modules` created and removed. Detail: the report, §2-§4.
**Prompt document name**: 2026-09-25 18:20

## 2026-09-25 — fix(project): a change of project id in the URL opens that project (P-2026-09-25-1440)
**Prompt**: `claude_2026-09-25_1440_prompt_hash_change_open_discovery.md`, two-phase, from the high ticket of P-2026-09-25-0030. Phase 1 report `dc383a8b8` (`docs/discovery/discovery_2026-09-25_hash_change_open.md`). GO Phase 2, `Lane: full (more than 3 files)`, Q1-Q6 ratified as recommended, plus one addition: pin that after the race "A slower than B" a save never writes A's content into B's record. Closing ACK: visual check passed, the save rule read as the invariant below.
**Files touched**: code `5c47e40ec`: `frontend/src/components/pathChecker/PathChecker.tsx`, `frontend/src/components/pathChecker/openKey.ts` (new), `frontend/src/components/pathChecker/__tests__/openKey.test.ts` (new), `frontend/src/pages/Project.tsx`, `frontend/src/redux/reducer/reducer.ts`. Docs: the report `dc383a8b8`; this commit: this entry, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 00:30 (`claude_2026-09-25_0030_prompt_project_open_path.md`: its `openRun` counter guards the loading flag, not the LOAD; addendum A4 called a superseded LOAD harmless after measuring only the order where the newer open is slower)
**Causa**: (c)
**Regressions**: no. On `5c47e40ec`: `npm run typecheck` exit 2, 14 errors, the baseline set; `npx vitest run` 4625 passed (4620 + 5, stated before the run), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4; `check:scripts` pass. Probes P1-P7 on 3003, controls included (list, in-page, A4 form, dashboard filter). Mutation bench 8 of 8 killed, table in the commit body.
**Out-of-scope changes**: no — the five files of the report's candidate, named by the GO; Rule 19 not triggered.
**Layer Impact Report**: produced
**Smoke visivo**: passato (Alfonso su 3003: apertura sana dalla dashboard, hash da A a B, back/forward, race con A lento: B resta dopo 5 s e il save scrive solo B)
**Notes**: M4-M8 are held by probes on 3003, not vitest: the bench is node, without DOM or router, and stateInitializer and Project.tsx do not import there (window, joiner barrel). Save invariant: A's content never reaches B's record; M4 leaves the save writing nothing (A in the store under B's URL), M8 puts A's id in B's saved blob. Residual (Q5): a hash change before PathChecker mounts at page load is not seen. Correction to Phase 1: open-hash was created in this lane at 14:42:02 (reflog), not found.
**Prompt document name**: 2026-09-25 14:40
**Ticket** (priority high, opened here, a lane of its own). After `R.navigate` whose reload the user cancels with "Stay on page" (unsaved changes; the prompt is enabled by `ProjectEditor.tsx:409`), `U.navigating` stays `true` (`U.tsx:138`) and `reducer.ts:611` drops every action for the rest of the tab's life: edits are silently lost, and under the new URL the project cannot be saved. Measured on 3003 (report §2 (f), F5). With this fix the open of the new id starts but its LOAD is dropped: loading screen forever (report §5, risk 2).
**Ticket** (cited, not a new slot: the medium ticket `pointedBy entries grow with each in-page reopen and save`, found in P-2026-09-25-0030, stays open and medium). Measured here: the growth needs an in-page open from the dashboard's state (12 pending `pointedBy` paths); a change of project id adds none (3/3, 0 pending); a synchronous empty LOAD in `U.resetState` removes it (report §3.4; Q3: a lane of its own).
## 2026-09-25 — ticket: a bag saved before R-SIM-38 can change its event class silently
**Ticket**: R-SIM-38 derives the event metaclass from the type of the Trigger reference and ignores a stored `simEvent` without migration. A metamodel configured before it, whose `simTrigger` points to a reference of another type, changes meaning with no notice. Measured on PEST SM at 3001 during the visual check of the 1835 merge (bag read from `localStorage`, read-only): `simTrigger` and `simNextState` both pointed to `Transition.nextState` (typed State) while the stored `simEvent` was Event; the derived event class became State, the M1 panel refused the run with "Roles overlap: State matches the node and event roles" and offered `State_0` and `Initial_0` as events. Setting Trigger to `Transition.event` fixed it. Wanted: a warning on the M2 face when a stored `simEvent` differs from the derived class, naming both, until the user sets Trigger or clears the old key.
**Priority**: medium
**Found in**: P-2026-09-25-1835 (visual check), chat C-2026-09-25-1353
**Detail**: R-SIM-38 in `docs/decisions.md`; the bag keys above
## 2026-09-25 — feat: role catalog and simulation profiles (P-2026-09-25-1805)
**Prompt**: `claude_2026-09-25_1805_prompt_sim_role_catalog_profiles.md`, full lane (more than 3 files) on `simulation-engine` in `~/jjodel-sim`, bound by R-SIM-47..55 and R-SIM-38 read from the trunk (`b5e977907`). A pure module, only new files under `frontend/src/model/simulation/`: role catalog, eight system profiles, required set and checkability, `simProfile` codec and the «Custom» profile. Nothing wired or persisted.
**Files touched**: code `0834329e4`: `frontend/src/model/simulation/roleCatalog.ts`, `simProfiles.ts`, `profileCodec.ts` (new), tests `__tests__/roleCatalog.test.ts`, `__tests__/simProfiles.test.ts`, `__tests__/profileCodec.test.ts` (new). Docs, this commit: this entry, the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `0834329e4`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the baseline empty); `npx vitest run` 4758 passed (4694 + 64, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Red first: the 3 test files failed at collection. Name check empty (exit 1), positive control 5 lines.
**Out-of-scope changes**: no — 6 files, above the Rule 19 five, all new and all named by the prompt's DOVE list; `git diff --stat` of every other path empty.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Hard stop answered by Alfonso: the prompt table wins over the memo on singleToken (six profiles) and eventIdentifier (edit wherever trigger is). Interpretations, under test: active = not off; the either-item is met by one side; an off role never binds; Custom follows its shape's system profile (event from trigger, Petri initial off, unread keys in ignoredKeys). One closure commit with Status, per RC-17, not the inbox alone. Mutation bench 32/32, in `0834329e4`.
**Prompt document name**: 2026-09-25 18:05
**Ticket** (for the wiring lane, docs only). Today `netStcFromRoles` runs a control-flow bag with `simInitialMarking` and no `simInitial`, and reads `simBound` in control flow. R-SIM-48 and R-SIM-54 require Initial and derive k = 1 there, so `inferCustomProfile` of such a bag lists both keys as ignored and reports Initial missing. The lane that wires the profiles decides whether such bags become not checkable.

## 2026-09-25 — feat: the Expression and Action primitive types, wave A (P-2026-09-25-1445)
**Prompt**: `claude_2026-09-25_1445_fase2_state_operator_a.md`, wave A of `P-2026-09-25-1445` on `simulation-engine`, bound by R-SIM-44, R-SIM-45, R-SIM-46 (series renumbered in `8f97d4f6f`). Layer Impact Report posted before `VersionFixer.tsx`; OK with one condition, the seed as the oracle of the migrated records, plus CHECK 3 keyed on ids and an EDouble-field mutant.
**Files touched**: A1 `b14294906`: `frontend/src/common/U.tsx`, `common/Defaults.ts`, `redux/VersionFixer.tsx`, `model/logicWrapper/LModelElement.tsx`, `common/Dummy.ts`, `model/conformance/ConformanceValidator.ts`, `jjscript/executor/commands/create.ts`, `joiner/classes.ts`, `services/export/EcoreService.ts`, `services/export/JsonModelService.ts`; tests `redux/__tests__/versionfixer_2229_migration.test.ts` (new), `ConformanceValidator.test.ts`, `joiner/__tests__/dTypedElement.test.ts`, `services/export/__tests__/ecore-io.test.ts`. A2 `066383e24`: `EcoreService.ts`, `api/data.ts`, `components/editor-v2/types.ts`, `ecore-io.test.ts`. Docs, this commit: this entry, the Status of the wave A prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `b14294906` and `066383e24`: `npm run typecheck` exit 2, 14, the §17 set; `npx vitest run` 4686 then 4694 passed (4654 + 32 + 8, each stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` the known `_tmp_sim1_verify.ts:186`. Mutation bench 15/15 (A1) and 7/7 (A2), tables in the commit bodies.
**Out-of-scope changes**: no — 14 files in A1 and 4 in A2, above the Rule 19 five, every one in the prompt's list, which authorized them. The JjScript alias test sits in `dTypedElement.test.ts`: `create.ts` does not load under vitest, even with a stub joiner.
**Layer Impact Report**: produced
**Smoke visivo**: passato — Alfonso, 2026-09-25 on 3002, items 1-5: both type selects, CHECK 3 on `a +`, `self.x > 0` and `else`, an old project, the .ecore round trip, the smoke.
**Notes**: Deviation: A1's non-VersionFixer code preceded its tests; with those nine files at HEAD, 13 new tests failed. The step writes the seeded record (captured on 3002), not an EDouble copy (6 fields differed on the 7 examples). CHECK 3 moved from type names to ids after the OK. Held only by this visual check, because their files do not load under vitest (window): get_values and the set_type aliases (LModelElement.tsx), Dummy.ts, the data.ts import.
**Prompt document name**: 2026-09-25 14:45
## 2026-09-25 — ticket: the Vite dependency scan fails on every cold start
**Ticket**: Vite dependency scan fails on every cold start: esbuild rejects MTM.tsx:27 importing Nearley from DSL/nearley/nearley.tsx:34 (suggests _Nearley); pre-bundling is skipped, all deps are discovered at runtime and the page reloads once. Pre-existing since 0787639fd, silent on 3001, printed on a fresh worktree. Medium because worktree lanes cold-start by design.
**Priority**: medium
**Found in**: P-2026-09-25-1500

## 2026-09-25 — ticket: eventRoleWarning and roleWriteVerdict are dead since R-SIM-38
**Ticket**: Since `P-2026-09-25-1500`, `eventRoleWarning` (`components/editor-v2/sim/simRoleStatus.ts`) has no caller, and `roleWriteVerdict` (`model/simulation/stcFromRoles.ts`) is called by tests only: `writeRole` derives the event class after the write and calls `overlapVerdict`. Remove both, with their tests, in the SimModelView cleanup lane (the R-SIM-37 ticket).
**Priority**: low
**Found in**: P-2026-09-25-1500

## 2026-09-25 — ticket: the Trigger select offers every reference of the metamodel
**Ticket**: The Trigger select of the Events group lists every plain reference of the metamodel, not only those of the arc/transition class. Since R-SIM-38 the Trigger also fixes the event class, so a reference of an unrelated class silently changes the event alphabet (the overlap check only catches node/arc/transition types). Restrict the options to the references of the arc/transition class.
**Priority**: medium
**Found in**: P-2026-09-25-1500

## 2026-09-25 — feat: the event class derived from the Trigger reference (P-2026-09-25-1500)
**Prompt**: `claude_2026-09-25_1500_prompt_sim_event_from_trigger.md`, single phase, fast lane, on `sim-event-trigger` in `~/jjodel-events` (worktree made by the project chat at `79175e94c`). R-SIM-38: Trigger alone configures the event role; `simEvent` is derived at every read of the bag and never written. One mid-lane stop (the netParity fixture, authorised), the hard stop of step 7, then a GO with two items: the cleanup marker dropped, the Vite scan error classified as pre-existing (a ticket).
**Files touched**: report `623b330d4`: `docs/discovery/discovery_2026-09-25_sim_event_from_trigger.md` (new). Code `332f8d03c`: `frontend/src/model/simulation/netCompile.ts`, `components/editor-v2/sim/simBridge.ts`, `SimulationPanel.tsx`, `simRoleStatus.ts`; tests `model/simulation/__tests__/netCompile.test.ts`, `netParity.test.ts`, `sim/__tests__/simBridge.test.ts`, `simRoleStatus.test.ts`. Code `470149a51`: `simRoleStatus.ts` (the marker dropped). Docs, this commit: this entry, three tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `332f8d03c`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the trunk run empty); `npx vitest run` 4624 passed (4620 − 5 + 2 + 5 + 2, stated before the run), the same 9 files red at import; `npm run build` exit 0, pre-existing warnings only; `check:docs` 4/4. Mutation bench 10/10 killed (commit body). On `470149a51`: typecheck 14, the same set; the 43 sim tests pass.
**Out-of-scope changes**: yes — `frontend/src/model/simulation/__tests__/netParity.test.ts`, not in DOVE: one fixture line (the typed `R_trigger` DReference), no assertion changed, authorised in chat at the stop (RC-11). Nine files over the lane, above the Rule 19 threshold: the eight of DOVE (four code, three tests, the report) plus that one.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso on 3004, items (a)-(d) of step 7, plus a Trigger typed to a node/arc class refused as an overlap.
**Notes**: Decisions: withDerivedEventRole in netCompile.ts; simEvent kept in ROLE_SPECS (mapStateToProps copies ROLE_KEYS) and hidden via ROLE_GROUPS; a primitive-typed Trigger (EString is a DClass with isPrimitive) gives no event role; the class name reaches the row as a primitive prop. Mid-lane stop: (c), netParity.test.ts drives startRun and was missed at step 2. The panel does not load under the bench: its edits are covered by the visual check only. Detail: report §8.
**Prompt document name**: 2026-09-25 15:00

## 2026-09-25 — feat: .[x] state access and strict parse, wave B1 (P-2026-09-25-1445)
**Prompt**: `claude_2026-09-25_1445_fase2_state_operator_b1.md`, Phase 2 wave B1 of `P-2026-09-25-1445` on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `ec68ddb9b` (`docs/discovery/discovery_2026-09-25_state_operator_core_types.md`); its eighteen answers ratified as recommended, R-SIM-38..45 (`86f36a205`), B1 bound by R-SIM-38..42. Pure code: grammar, AST, strict parse, evaluator hook, single reserved list, checker case; nothing wired, persisted or typed.
**Files touched**: code `1c7a9be76`: `frontend/src/jjel/types/tokens.ts`, `jjel/lexer/lexer.ts`, `jjel/types/ast.ts`, `jjel/parser/parser.ts`, `jjel/parser/index.ts`, `jjel/evaluator/context.ts`, `jjel/evaluator/evaluator.ts`, `jjel/stateReserved.ts` (new), `jjel/autocomplete/providers/identifier.ts`, `jjel/SPEC.md`, `model/simulation/subsetChecker.ts`, tests `jjel/__tests__/parser.test.ts`, `jjel/__tests__/evaluator.test.ts`, `model/simulation/__tests__/subsetChecker.test.ts`. Docs, this commit: this entry, the Status lines of the two `P-2026-09-25-1445` prompt files.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `1c7a9be76`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the baseline empty); `npx vitest run` 4654 passed (4620 + 34, stated before the run), the same 9 files red at import; `npm run build` exit 0, 51 warning lines as the baseline; `check:docs` 4/4; `check:scripts` 1 finding, the known `_tmp_sim1_verify.ts:186`. Red first: 2 test files failing at collection and 11 evaluator tests before the code. Mutation bench 15/15 killed.
**Out-of-scope changes**: no — 14 files, above the Rule 19 five, every one named by the prompt's DOVE list, which authorized them; no file outside it changed.
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Deviations: the reserved list was written before the parser, which reads it; one closure commit carries this entry and both Status flips, as the prompt and P13 ask, not the inbox alone as the log-entry skill says. The B1 draft of report §8 holds, one correction: `.[x]` parses everywhere and throws only at evaluation without the hook; `?.[` and `:=` stay lexer errors with new messages. Mutant table in the body of `1c7a9be76`.
**Prompt document name**: 2026-09-25 14:45
**Ticket** (R-SIM-45 tickets, in `docs/decisions.md`; cited, not duplicated): the global trailing-token fix of `parseExpression`; `Pointer_EOBJECT` missing from older saved projects.
**Ticket** (opened here, docs only). The trunk has its own R-SIM-38 (`79175e94c`, the event class derived from the trigger, chat `C-2026-09-25-1500`), while this branch carries R-SIM-38..45 (`86f36a205`): merging `simulation-engine` into the trunk would put two R-SIM-38 in `docs/decisions.md`. One series needs renumbering before that merge.

## 2026-09-25 — chore(harness): one Vite cache per worktree, P14 names the permanent symlinks (P-2026-09-25-1353)
**Prompt**: `claude_2026-09-25_1353_prompt_harness_worktree_isolation.md`, fast lane, one hard stop (Alfonso's check on 3001). Two defects of the worktree setup, measured when 3001 went blank during the open-path merge: P14 called `~/jjodel-release` a tree without `node_modules` and told a lane to remove the gate symlink; with no `cacheDir`, every tree wrote the Vite cache in `~/jjodel/frontend/node_modules/.vite` through the shared symlink.
**Files touched**: code `465605cd7`: `frontend/vite.config.ts` (`cacheDir` = `frontend/.vite-cache`), `.gitignore` (`/frontend/.vite-cache/`). Docs, this commit: `docs/PROTOCOL.md` (P14: two bullets replace the `node_modules` one, permanent symlinks and one Vite cache per tree), this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 11:15 (the open-path merge, whose gates removed the `node_modules` symlink 3001 needed; the merge has no log entry by precedent)
**Causa**: (g)
**Regressions**: no. `cacheDir` resolved to `frontend/node_modules/.vite` (realpath in `~/jjodel`) before, `frontend/.vite-cache` after. 3001 restarted from `~/jjodel-release/frontend` (pid 49582 stopped, cwd checked; pid 61660): its own cache got 2300 deps files at 14:00:05, the shared deps kept 13:19:28 with 0 files newer than the restart (control: 2301 in the own cache). Gates: `npm run typecheck` 14 errors, the §17 set; `npm run build` exit 0; `check:docs` 4/4; vitest 4620 passed, unchanged, the same 9 files red at import.
**Out-of-scope changes**: yes — the P14 amendment in `docs/PROTOCOL.md` moved from the code commit, where the prompt put it, to this closure commit, per P13 (docs and code never in one commit; `bash-guard` denies the mixed pathspec). The code commit's subject drops "P14 names the permanent symlinks" to match its content. No file outside the prompt's three plus the closure pair.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso, 3001 after a hard refresh: a healthy project opens, the page is not blank)
**Notes**: Second cause (a): the P14 text. Measured in P-2026-09-25-1115: at 12:5x `ls` found no `~/jjodel-release/frontend/node_modules`; that lane created a link and removed its own, so who removed the permanent one earlier is not measured. The body of `465605cd7` says the split was "ruled in chat": inaccurate, it was the lane's proposal under P13, accepted in session; not rewritten. The name check's only `.vite-cache` hits were the prompt's own text: accepted.
**Prompt document name**: 2026-09-25 13:53

**Ticket** (opened, not fixed here). The Vitest results cache is still shared by every tree: `frontend/vitest.config.ts` sets no `cacheDir`, so Vitest writes `node_modules/.vite/vitest/.../results.json`, which the symlink resolves into `~/jjodel`. Measured: this lane's `npx vitest run` from `~/jjodel-release` wrote `~/jjodel/frontend/node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` at 13:57:38. It only orders test files by past duration and failure, so no result is wrong; a `cacheDir` in `vitest.config.ts` is its own change.

**Ticket** (opened, not fixed here). Two stale Vite directories left in place, untracked: `~/jjodel-release/frontend/.vite/` (`deps/` of 2026-09-14 12:59) and `~/jjodel-sim/frontend/.vite/` (`deps/` of 2026-09-14 15:07). Nothing reads them after this lane (`cacheDir` is `.vite-cache`); `~/jjodel/frontend/node_modules/.vite` stays too, for Alfonso. Removing them is his call; no lane runs `rm -rf` on a cache.
## 2026-09-25 — ticket: pointedBy entries grow with each in-page reopen and save
**Ticket**: On an in-page open (history, hash edit) the reset's `[emptyLOAD + init]` batch applies to the empty state and leaves pending `pointedBy` paths, resolved at the next dispatch onto the loaded project: one more `{"source":"classs"}` on each primitive (two more on `Pointer_EOBJECT`) per in-page reopen + save, saved with the project. Deep link and list do not. Down from the old code, which also duplicated `classs` and the project's `viewpoints` each cycle; those are gone since `0609e9793`.
**Priority**: medium
**Found in**: P-2026-09-25-0030
**Detail**: docs/discovery/discovery_2026-09-25_project_open_path.md (addendum A5, the table)
## 2026-09-25 — ticket: an in-page hash change between two projects starts no open
**Ticket**: In an open tab, changing the hash from one project to another (`#/project?id=A` → `#/project?id=B`: address bar, history between two projects) starts no open: `PathChecker` calls `U.resetState` on pathname changes only (`PathChecker.tsx:7-14`), and both are `/project`. The store keeps A (or A's open completes) under B's URL; `LProject.getProject()` reads B from the URL, finds nothing, and `Project.tsx` throws on `project.type`, caught by `Try` with cascading page errors (measured on 3003, P4b first form). Pre-existing, not changed by P-2026-09-25-0030.
**Priority**: high
**Found in**: P-2026-09-25-0030
**Detail**: docs/discovery/discovery_2026-09-25_project_open_path.md (addendum A4)

## 2026-09-25 — fix(redux): a project that cannot be opened shows an error screen (P-2026-09-25-0030)
**Prompt**: `claude_2026-09-25_0030_prompt_project_open_path.md`, two-phase, from the first Ticket of P-2026-09-24-1610. Phase 1 report `d6918f467`. GO with Q1-Q7 ruled (error in the loading screen, no toast; stay on it; not-found included; in-page data-loss fix included), then two stops ruled in chat: the drain and P5 ×5 (P5 failed as ACKed), the re-render event and the save guard. Closing GO: entry in this inbox, visual check passed.
**Files touched**: code `0609e9793`: `frontend/src/redux/reducer/reducer.ts`, `frontend/src/components/topbar/SaveManager.ts`, `frontend/src/api/persistance/projects.ts`, `frontend/src/pages/Project.tsx`, `frontend/src/components/LoadingScreen/ProjectLoadingScreen.tsx`, `frontend/src/events/registry.ts`, `frontend/src/components/topbar/__tests__/saveManager_load.test.ts` (new). Docs, this commit: addendum A1-A5 to `docs/discovery/discovery_2026-09-25_project_open_path.md`, this entry, two tickets. The prompt's Status line is left to `/status-flip`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0609e9793`: `npm run typecheck` exit 2, 14 errors, the baseline set; `npx vitest run` 4452 passed (4449 + 3), the same 9 files red at import; `npm run build` exit 0 (chunk size, pre-existing `bordr`); `check:docs`, `check:agents`, `check:scripts` green. T2, T3 red before the fix. P5 ×5 per entry point: deep link and list equal to the old store modulo timestamp. 12 mutants, 12 killed (commit body).
**Out-of-scope changes**: yes — 7 code files, over the Rule 19 threshold, declared per RC-11: the five of report §8 plus `frontend/src/events/registry.ts` (`PROJECT_OPEN_CHANGED`) and the save guard in `projects.ts`, both ruled in chat; the drain and the `openRun` counter are beyond §8 as well, ruled.
**Layer Impact Report**: produced
**Smoke visivo**: passato (verifica visiva di Alfonso su 3003: R3A per deep link e per hash in-page, un progetto sano, not-found)
**Notes**: Beyond report §8, each held by a mutant (code commit body): a drain (COMMIT + one macrotask) before the now-synchronous LOAD keeps init before LOAD; PROJECT_OPEN_CHANGED re-renders the page; a save guard. Read, not measured: the drain's order assumes no 4 ms nesting clamp on the init timer alone. Literal P4b (failed A, healthy B) cannot kill M9; the rewritten one does. Residual, harmless: a superseded open's LOAD lands while the newer one loads. Mid-lane stops: (c). Detail: addendum A1-A5.
**Prompt document name**: 2026-09-25 00:30

## 2026-09-25 — feat: simulation step 3b, the panel and the run-state on the Petri core (P-2026-09-25-1103)
**Prompt**: `P-2026-09-25-1103`, two-phase, on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `b9fd3a1f7` (`docs/discovery/discovery_2026-09-25_sim_step3b_panel.md`); the sixteen answers ratified as recommended with two precisions, R-SIM-34..37 (`7a93968c5`); Phase 2 prompt `claude_2026-09-25_1103_fase2_sim_step3b_panel.md` (`3a2c76b83`). Precision A: the panel's lines never depend on the mark version. Precision B: `SimModelView` untouched, no TODO marker; its slimming and the `stcFromRoles.ts` rename as tickets.
**Files touched**: code `c400a5163` (feat): `components/editor-v2/sim/SimulationPanel.tsx`, `simRunState.ts`, `simRoleStatus.ts`, `simulation-panel.scss`, `simBridge.ts` (new), `__tests__/simRoleStatus.test.ts`, `__tests__/simBridge.test.ts` (new), `__tests__/simRunState.test.ts` (new); `model/simulation/netCompile.ts`, `stcFromRoles.ts`, `__tests__/events.test.ts`, `__tests__/netParity.test.ts`. Code `11de5af03` (refactor): `model/simulation/step.ts` and `__tests__/step.test.ts` deleted; `types.ts`, `stcFromRoles.ts`, `netCompile.ts`, `__tests__/events.test.ts`, `__tests__/netParity.test.ts`, `sim/simRoleStatus.ts`. Docs, this commit: this entry, the Status line of the Phase 2 prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On each code commit: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the Phase 1 run empty); `npx vitest run` 4670 passed after `c400a5163` and 4617 after `11de5af03`, each total stated before the run, the same 9 files red at import; `npm run build` exit 0, the same 5 warnings; `check:docs` 4/4; `check:scripts` 1 hit, the known `_tmp_sim1_verify.ts:186`. The not-touched files of report §11.1 byte-identical to `3a2c76b83`. Mutation bench 38/38 and 10/10 killed, tables in the commit bodies.
**Out-of-scope changes**: no — 15 files, the list of report §11.1 authorized by the GO (rule 19): 10 modified, 2 deleted, 3 new, all named above; the exported interfaces changed are those of report §11.2. Nothing else.
**Layer Impact Report**: produced
**Smoke visivo**: passato — Alfonso, 2026-09-25 on 3002, items 1-6 of report §11.5, light and dark. P8 smoke (item 7) GREEN, 12 passed and 3 skipped, from a scratchpad copy of `scripts/smoke` pointed at 3002 (`states.ts` hardcodes 3000), so its RUN VALIDITY block watched 0 files.
**Notes**: Deviations: the sort/refusal change of stcFromRoles.ts and its 3 tests in events.test.ts went in the feat commit, not the refactor one; the panel no longer calls useSimVersion (precision A, LIR corrected before the store edit); candidate and halt labels use DObject.name before objectLabel (the probe showed short ids otherwise); the Last step line reads "Reset" after a Reset. Evidence: the Phase 1 report and the two commit bodies.
**Prompt document name**: 2026-09-25 11:03
**Ticket** (precision B, R-SIM-37 ticket; opened, not implemented here). `SimModelView` (`model/simulation/types.ts`) keeps `outgoingTransitions`, `transitionTarget` and `transitionTriggers`, read only by the deleted boolean step; every `NetModelView` adapter stubs the first two (`sim/simBridge.ts` `makeNetModelView`, and the test views of `netCompile.test.ts`, `netStep.test.ts`, `events.test.ts`, `netParity.test.ts`). Slimming it is a lane of its own: a changed exported interface (rule 11) and those test files.
**Ticket** (precision B, R-SIM-37 ticket; opened, not implemented here). `model/simulation/stcFromRoles.ts` now holds only the overlap rules (`roleOverlaps`, `overlapVerdict`, `roleWriteVerdict`, `RoleOverlap`); the name no longer says what it holds. Rename in a lane of its own (rule 2 forbade it here); importers: `sim/SimulationPanel.tsx`, `__tests__/events.test.ts`.
**Ticket** (opened, not fixed here). Comments in files this lane had to leave byte-identical now describe the old state: `netStep.ts:22` and `netTypes.ts:5` ("not wired yet", `step.ts`), `netTypes.ts:72` (`stcFromRoles`), `isKindOf.ts:17` (the `classAncestry` parity lives in `events.test.ts` now, not `step.test.ts`), `guardEvaluator.ts:21` ("The step does not call this module yet"). A comment-only lane.
**Ticket** (opened, not fixed here). The gitignored step 1 probes assume the old store and statuses and will break or lie if rerun: `scripts/smoke/_tmp_sim0_verify.ts` (`simReset` with an array of ids), `_tmp_sim1_e2e.ts` and `_tmp_sim1005_e2e.ts` (old enablement and status rules), the first imported by Alfonso's `_tmp_sim1_verify.ts`, left untouched. The 3b probes live in this session's scratchpad. The Phase 1 prompt file `claude_2026-09-25_1103_prompt_sim_step3b_discovery.md` still reads `Status: da eseguire`.
## 2026-09-25 — feat: simulation step 3a, the Petri core, unwired (P-2026-09-25-0935)
**Prompt**: `P-2026-09-25-0935`, two-phase, on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `de21a2c93` (`docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md`); the thirteen answers ratified as recommended, R-SIM-27..33 (`e4506e78f`); Phase 2 prompt `claude_2026-09-25_0935_fase2_sim_step3a_core.md` (`f36fe1c2e`), wave 3a only: the pure core beside the old step, six new files, no modified file.
**Files touched**: code `79ee9fba3`, 6 new files under `frontend/src/model/simulation/`: `netTypes.ts`, `netCompile.ts`, `netStep.ts`, `__tests__/netCompile.test.ts`, `__tests__/netStep.test.ts`, `__tests__/netParity.test.ts`. Docs, this commit: this entry, the Status line of the Phase 2 prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `79ee9fba3`: `npm run typecheck` exit 2, 14 errors, the §17 set (diff with the Phase 1 run empty); `npx vitest run` 4623 passed (4530 + 93), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4; `check:scripts` 1 hit, the known `_tmp_sim1_verify.ts:186`. `git diff` on every existing file empty; `step.test.ts` and `events.test.ts` green unchanged. Mutation bench 36 of 36 killed, table in the commit body.
**Out-of-scope changes**: no — six files, all named by the prompt's DOVE, above the P6 five by the GO's rule 19 exception: `netTypes.ts`, `netCompile.ts`, `netStep.ts` and their three tests. No existing file modified.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — nothing imports the new core outside its tests; the panel still runs the old step.
**Notes**: Deviations from report §5.2: `StateAttributeDecl.metaclass` is `string | null` (globals, `model.[x]`); action sites are `ActionSite { element, role }`, since a plain string cannot tell exit(A) from entry(A); `CompiledNet` gains `declared` (element → attribute → declaration) for the domain check. `step.test.ts:167` is not a difference in the core (the §7 shim dropped unknown ids, the core keeps them): pinned for 3b under R-SIM-13.
**Prompt document name**: 2026-09-25 09:35
**Ticket** (for 3b, not a slot of its own). What 3b wires: a `GuardOracle` from `compileGuard` + `buildGuardContext` over a snapshot built with `targetMetamodelId` (R-SIM-33 ticket); an `ActionOracle` returning `[]` until the Action lane; the store holding `NetConfiguration`, the net and a `HaltReason` per started run; `stcFromRoles`/`ENGINE_ROLE_KEYS` made optional on Terminal together (R-SIM-28; `simRoleStatus.test.ts:48` pins their agreement); the old step, `applyStepLabel`, `simApplyStep` and their tests deleted, with `netParity.test.ts` rewritten against the new store. The Phase 1 prompt file still reads `Status: da eseguire`.

## 2026-09-24 — fix(redux): unversioned saves pass the 2.1 and 2.2 VersionFixer steps (P-2026-09-24-1610)
**Prompt**: `claude_2026-09-24_1610_prompt_versionfixer_old_states.md`, two-phase. Phase 1 report `5f17cf4e3` (`docs/discovery/discovery_2026-09-24_versionfixer_old_states.md`). GO with seven rulings: no toast in this lane; the examples stay in place as test data; guards on all seven loops of `'2.2 -> 2.201'`; fix 1 is `return s` only, no guard in the runner; one ticket joining Q1 and Q5, one on the examples; this new inbox; the console snippet reported here, not in code. The GO added a vitest test running the chain on the 7 distinct examples, red before the fix and green after. Conditional ACK on the Layer Impact Report, four conditions, all met.
**Files touched**: code `d1db82011`: `frontend/src/redux/VersionFixer.tsx`, `frontend/src/redux/__tests__/versionfixer_old_states.test.ts` (new). Docs: the Phase 1 report `5f17cf4e3`; this commit: this inbox (new), a dated addendum to the Phase 1 report, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d1db82011`: `npm run typecheck` exit 2, 14 errors, the baseline set (diff empty); `npx vitest run` 4273 passed (4248 + 25), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4, `check:agents` green. The new test: 24 failed and 1 passed before the fix, 25 passed after; mutation bench 18/18 killed (commit message). Regression on 3001 checked by Alfonso: a current project saved and reopened, no difference.
**Out-of-scope changes**: no — two code files, both declared in the report §8 and in the LIR; five files over the lane counting the docs.
**Layer Impact Report**: produced
**Smoke visivo**: fallito (A4 in all three states, the only new pattern is `403 (Forbidden)` on font files, 3x per state: environmental, the same as P-2026-09-24-1455, no asset in the diff. A1-A3 and A5 pass. Run from a scratchpad copy of `scripts/smoke` with `BASE_URL` on 3001, because `states.ts` hardcodes 3000, which serves `~/jjodel`; from the copy the RUN VALIDITY block watches 0 files.)
**Notes**: `Log.exDev` throws (`Log.ts:152`, `canthrow` true): Phase 1 §1 said it did not; dated addendum in the report. R-IRN-20, note only, rule unchanged: its premise that `VersionFixer.tsx` cannot be imported in vitest holds with the real joiner; under a joiner mock the real class imports and runs, so this test exercises the steps themselves. Probes on 3001 as predicted: chain 7/7 to 2.228, load dies at `reducer.ts:708`.
**Prompt document name**: 2026-09-24 16:10

**Console snippet** (ruling 7). Counts the projects in `localStorage['projects']` of the page it runs in, by the `version.n` of their saved state. Tested on 3001 with one current save, one unversioned blob and one never-saved project, output `{"2.228":1,"(no version)":1,"(never saved)":1}`.

```js
(async () => {
  const lz = await import('/node_modules/.vite/deps/async-lz-string.js');
  const decompress = lz.decompressFromUTF16 || lz.default.decompressFromUTF16;
  const projects = JSON.parse(localStorage.getItem('projects') || '[]');
  const byVersion = {};
  for (const p of projects) {
    let key;
    if (!p.state) key = '(never saved)';
    else {
      try {
        const s = JSON.parse(await decompress(p.state));
        key = !s.version ? '(no version)' : String(s.version.n);
      } catch (e) { key = '(unreadable)'; }
    }
    byVersion[key] = (byVersion[key] || 0) + 1;
  }
  console.table(byVersion);
  return byVersion;
})();
```

**Ticket** (opened, not implemented here). Failures along the whole open path, migration and reducer (Q1 and Q5 of the report, joined by the GO). A state that cannot be loaded leaves "Loading Project..." on screen forever: `ProjectsApi.isLoading` goes false only in `checkLoaded` (`reducer.ts:1529-1538`). A throw in `VersionFixer` lands in the `stateInitializer` catch and is logged as `Failed to fetch projects` (`reducer.ts:1578`), a false label; a throw inside the `LoadAction` dispatch (`reducer.ts:708`, `:776`, and at element level `:740`, `:852`, `:930`, report §4) is an uncaught page error that no catch sees. Wanted: catch both, show a message to the user, stop the infinite loading, correct the label. Two facts to carry: the snippet above sees only the `localStorage` of the dev-server origin it runs in (3000 and 3001 do not share it), not projects saved on the server; and it remains to be verified whether projects saved on the server between 2024-06-28 and 2024-08-27 exist, since they carry a `version` but lack `NODES_RECOMPILE_labels` and would die at `reducer.ts:776` (report §6, risk 3).

**Ticket** (opened, not implemented here). The examples of `frontend/src/examples/`: delete or regenerate. Eleven blob files (7 distinct, 4 duplicates under `examples/examples/`, 2 786 754 bytes), reachable from no UI path, none loading after this lane (they now fail in the reducer). Since `d1db82011` they are the fixtures of `versionfixer_old_states.test.ts`: deleting them means giving that test other old-shape fixtures first. Regenerating the teaching examples as current projects is a content task. Related: the Jodie `/examples` command parses to type `'EXAMPLES'`, which no executor handles (`JjodieCommandParser.ts:152`, `:828-840`).
## 2026-09-24 — feat: simulation step 2, guard context, evaluator, subset checker (P-2026-09-24-1520)
**Prompt**: `P-2026-09-24-1520`, two-phase, on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `d4d7b6320` (`docs/discovery/discovery_2026-09-24_sim_step2_eval_context.md`). GO with ten rulings: option (a) for eager `and`/`or`, the tri-state in `model/jjelTriState.ts`, two code commits, no bare feature names, all four roots reserved, `with … do` rejected, non-exportable constructs as not-verifiable warnings, the `model` placeholder, `if` without `else` an error; the 8-file list approved; a test that fails if the builder freezes an L proxy. Two code commits, then this docs commit.
**Files touched**: code `4bf12ebf9` (refactor): `model/jjelTriState.ts` (new), `model/validation/validationEvaluator.ts`. Code `e993d1b1a` (feat): `model/simulation/guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts`, `__tests__/guardContext.test.ts`, `__tests__/guardEvaluator.test.ts`, `__tests__/subsetChecker.test.ts`, all new. Docs, this commit: this entry, the prompt file (Status). On the ACK: code `80dab51b9` (test): `model/__tests__/jjelTriState.test.ts` (new); docs: this entry updated.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Validation suite 55/55 before and after A; `evaluateValidation` of HEAD and of A on 36 rules x 2 instances, reports byte-identical. On each code commit against the Phase 1 baseline: `npm run typecheck` exit 2, **14** errors, the same set; vitest 4240 after A, **4315** after B (+75), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4 and `check:agents` green. `step.ts`, `types.ts`, `step.test.ts` byte-identical.
**Out-of-scope changes**: yes — 8 code files, above the P6 five, and two outside `model/simulation/` (`model/jjelTriState.ts`, `model/validation/validationEvaluator.ts`); all declared in the report §13 and approved by the GO. Nothing else.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — nothing reaches the UI in this step; the step function does not call the new modules yet.
**Notes**: Beyond the report's text, declared in e993d1b1a: the snapshot also refuses a bound JjelFunction; W-TRUTHY also covers implies and the if condition. Mutation bench: A 5 of 8 killed by the validation suite (A4-A6 survive there), B 52 of 52 including A4-A6, listed in the bodies of 4bf12ebf9 and e993d1b1a. The L proxy is a stand-in JS Proxy with no freeze trap: joiner does not load under node. Probe 56/56 in the report.
**Prompt document name**: 2026-09-24 15:20
**Ticket** (opened, not fixed here). Validation treats `self.name.foo == null` as satisfied: a property read on a string, number or boolean is a silent `null` with no warning (`jjel/evaluator/evaluator.ts:548`), so none of the three entrances sees it. Measured in Phase 1 (`[3c]`, `[8f]` of the report) and pinned by a parity row in `guardEvaluator.test.ts`, where the guard answers `true` too. The subset checker cannot see it without receiver types.
**Ticket** (opened and closed in this lane). The validation suite does not kill three mutations of the tri-state (A4 only `JjelEvaluationError` caught, A5 `ambiguous-instance` as absence, A6 `property-not-found` ignored); the same on the inline code before `4bf12ebf9`. Closed by `80dab51b9`, see the follow-up below.
**Follow-up on the ACK** (2026-09-24). Test-only commit `80dab51b9`, six tests on `evaluateTriState` directly, each beside its control; no production file touched. Bench on the 8 mutants of `jjelTriState.ts` with `src/model/validation` plus the new file only: **8 of 8 killed**, A4, A5, A6 by one new test each. Path changed from the requested `src/model/jjelTriState.test.ts` to `src/model/__tests__/jjelTriState.test.ts`: vitest collects only `src/**/__tests__/**/*.test.ts` (`frontend/vitest.config.ts:16`), and at the requested path `vitest run` reports "No test files found", exit 1 (measured). Gates: typecheck 14 errors, the same set; vitest **4321** passed (4315 + 6), the same 9 files red at import; build exit 0; `check:docs` 4/4, `check:agents` green. Rulings on the ACK: the `?.` flag stays a warning; both additions of `e993d1b1a` accepted; the silent-null ticket stays a ticket, outside this lane.
**Ticket** (opened, not fixed here), for step 3. The impure bridge that calls `buildEvalContext` for a run must pass `targetMetamodelId` = the model's metamodel: without it `getTargetMetamodel` falls back to the active metamodel (`jjscript/executor/utils.ts:308-317`). Validation's `minimalExecutionContext` has the same gap (`validationContext.ts:108-115`).
## 2026-09-24 — fix: simulation panel, one face per active editor (P-2026-09-24-1005)
**Prompt**: `P-2026-09-24-1005`, two-phase, on `simulation-engine` in `~/jjodel-sim`. Phase 1 report `bd7a2e6b0` (`docs/discovery/discovery_2026-09-24_sim_panel_faces.md`). GO with eight rulings (`simTerminal` stays required; option (a), the panel inside the editor; frame `.editor-switch-container`; `simRoleStatus.ts` and its test; a warning line for a half-set event role on both faces; existing hint styles; two tickets; `fix:`). Stopped mid-Phase 2 on the Jodie button covering Reset; second GO: option 1, the panel moved right of the button, "Events disabled" wording, the extra pure functions approved. One code commit, then this docs commit.
**Files touched**: code `a8071f907`, 5 files: `components/editor-v2/EditorV2.tsx` (the mount only), `sim/SimulationPanel.tsx`, `sim/simulation-panel.scss`, `sim/simRoleStatus.ts` (new), `sim/__tests__/simRoleStatus.test.ts` (new). Docs, this commit: this entry, the prompt file (Status), the Phase 2 addendum of the discovery report.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the code commit against the Phase 1 baseline: `npm run typecheck` exit 2, **14** errors, the same set line for line; `npx vitest run` **4240 passed, 0 failed** (4228 + 12 new), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4 and `check:agents` green. Smoke on 3002 GREEN (12 passed, 3 skipped) before and after. Computed styles of every panel element identical before and after, light and dark, but for the new text. Turnstile e2e 27/27 with the corrected harness copy. Mutation bench 12 of 12 killed, in the body of `a8071f907`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Alfonso, 2026-09-24 on 3002, checks (i)-(vi), light and dark.
**Notes**: Mid-phase stop, cause (c): the Phase 1 stacking check missed `transform-style: preserve-3d` on `.pinnable-dock-root` and `#root` being fixed, so option (a) at the ratified spot put the Jodie button over Reset; corrected in the report addendum. Two side-by-side editors stay unverified (a split and a float both leave the second editor 0x0 in this build). Probes and the corrected e2e copy are gitignored `_tmp_*` files.
**Prompt document name**: 2026-09-24 10:05
**Visible change**. The chip and the panel moved. Mounted inside the editor (`position: absolute` against `.editor-switch-container`), at `left: calc(200px + 30px + 58px + 16px)`, 304px from the editor's left edge (was 216px from the viewport's), and `bottom: 16px` within the editor (was 48px from the viewport bottom). Reason: the minimized Jodie button (fixed, z-index 10000, `Jodie/JodieWindow.css:871-878`, `:918-923`) lies outside the dock, and `.pinnable-dock-root` has `transform-style: preserve-3d` (`components/dock/DockManagerStyles.scss:133`), a stacking context holding every editor: no z-index inside the editor lifts the panel over the button, which covered the Reset button at 216px.
**Known constraint**. Anything outside the dock with a positive z-index paints over the panel, whatever the panel's own z-index: the navbar, the Jodie button, the Properties rail, modals. Moving the Jodie geometry means moving the panel's `left` too (stated in `simulation-panel.scss`). Scan at 1600, 1280 and 1024 wide, both faces, chip closed and panel open: nothing fixed or absolute with z-index > 0 outside the dock intersects the panel today; control at `left: 216px` finds the Jodie button.
**Ticket** (opened, not fixed here), priority high. The 1850 e2e harness (`frontend/scripts/smoke/_tmp_sim1_verify.ts`, gitignored) prints `ALL GREEN` over failures: `failures += await e2e.run(...)` (line 186) reads `failures` before the await, and `_tmp_sim1_e2e.ts` returns 0, so every failure counted inside the e2e module is lost. Measured in this lane: one run printed ALL GREEN over 2 FAIL lines (harness lines reading only the first warning, which is now the new event line). The 1850 turnstile behaviour was re-verified 27/27 with a corrected copy (`_tmp_sim1005_verify.ts`, `_tmp_sim1005_e2e.ts`: the return value not added, every warning line read), so the 1850 evidence stands. Grep for the pattern, BSD `command grep -rnE '\+=[[:space:]]*await'` over this worktree, gitignored files included, `node_modules`, `.git`, `dist`, `build` excluded, control the known line found: one code hit, `frontend/scripts/smoke/_tmp_sim1_verify.ts:186`; the only other match is the prose of the discovery addendum. None fixed. `~/jjodel` and `~/jjodel-release` not searched.
**Ticket** (opened, not fixed here). PolymetricView: one `OPEN_POLYMETRIC` (`Navbar.tsx:1534`, no detail) opens one modal per mounted editor (`EditorV2.tsx:1023-1029`). Measured with a metamodel tab and a model tab open: two full-screen overlays in <body>, the model's on top; one backdrop click closes the top one only, one Escape closes both.
**Ticket** (opened, not fixed here). Context menu: `JjodelEvents.CHILD_CONTEXT_MENU` (`ClassNode.tsx:697`, `:759`, `:836`) becomes a menu in every mounted editor (`EditorV2.tsx:2836-2849`, no model filter). Measured: one right-click on an attribute row of the metamodel opens two menus in <body>, the hidden model editor's on top, so its handler would act on a child of another editor.
**Ticket** (opened, not fixed here). The standalone route `/editor-v2` (`App.tsx:151`) renders a blank page: `EditorV2` without `EditorSwitch` has no `ActiveEditorProvider`, and `useActiveEditor` throws (`EditorV2.tsx:634`, `ActiveEditorContext.tsx:64`). Pre-existing, measured on the unchanged code; the panel is gated on `modelid` and never mounts there.

## 2026-09-24 — feat: simulation step 1, events as M1 instances (P-2026-09-23-1850)
**Prompt**: `P-2026-09-23-1850`, two-phase, on `simulation-engine` in `~/jjodel-sim` after `git merge --ff-only alfonso-frontend-jjtl`. Phase 1 report `4e62f124c` (`docs/discovery/discovery_2026-09-23_sim_step1_events.md`). GO with seven rulings (option (a), ε enablement, no stability requirement, all-or-nothing event role, disjointness at save and run start, placement (i), key names `simEvent`/`simTrigger`/`simEventIdentifier`), rules 11 and 19 approved; two correction rounds (overlap warning without the event role and any-of on a multi-valued trigger; the save verdict judged after the save, as at run start). One code commit, then this docs commit.
**Files touched**: code `e6cb005a4`, 8 files: `model/simulation/types.ts`, `step.ts`, `stcFromRoles.ts`, `isKindOf.ts`, `objectSlots.ts` (new), `__tests__/events.test.ts` (new); `components/editor-v2/sim/SimulationPanel.tsx`, `simulation-panel.scss`. Docs, this commit: this entry, the prompt file (Status).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the code commit against the Phase 1 baseline (`293e7fec6`): `npm run typecheck` exit 2, **14** errors, the same set; `npx vitest run` **4228 passed, 0 failed** (4185 + 43 new), the same 9 files red at import; `npm run build` exit 0; `check:docs` and `check:agents` green. `step.test.ts` byte-identical (the parity oracle); slice 0 verifiers `after` and `after3` green on the new code.
**Out-of-scope changes**: yes — `objectSlots.ts` (new) was outside the prompt's DOVE and joined it by the report §6 and the GO; 8 code files, above the P6 five, all declared in the report and approved (rule 19). Nothing else.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — the smoke states through a gitignored copy pointed at 3002 (`states.ts` hardcodes 3000, which serves `~/jjodel`); turnstile e2e green; Alfonso's visual check passed 2026-09-24 on 3002 (3001 serves `~/jjodel-release`).
**Notes**: Known limits. The token split on a nondeterministic event is provisional until step 3 interleaving (R-SIM-7), pinned by two `provisional:` tests. A trigger edited mid-run is read at the next step until the R-SIM-13 interruption lands. Mutation bench: 39 of 39 killed, listed in the body of `e6cb005a4`. Probes: after HMR, a dynamic import of `simRunState.ts` reads a second, empty instance; restart the server before reading the store.
**Prompt document name**: 2026-09-23 18:50
**Ticket** (opened, not fixed here). `CLAUDE.md` §17 states a typecheck baseline of 33 errors; the count measured on this branch and on the trunk is 14 (the 19 casing errors are gone). The figure needs updating in a lane that holds `CLAUDE.md` (P15).
**Ticket** (opened, not fixed here). The run controls stay hidden until the Terminal role is set (`rolesComplete` over `ENGINE_ROLE_KEYS`, `SimulationPanel.tsx`), so a statechart without a final state needs a terminal metaclass with no instance to run; the turnstile of the visual check used one (`TFinal`).


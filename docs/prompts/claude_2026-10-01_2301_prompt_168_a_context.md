# Prompt: #168 A — Jodie sa cosa guarda il fruitore e vede solo ciò che vede lui (J1, J2)

Prompt-ID: P-2026-10-01-2301
Chat: sessione Claude Code di Juri (VS Code), 2026-10-01, orchestratore delle lane #168
Lane: full (more than 3 files)
Status: da eseguire
Limite: 90 minuti per fase

Worktree: `/Users/juridirocco/development/jjodel-168-context`, branch `168-context`, tagliato dal
trunk `feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un
symlink a quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree,
il branch è `168-context`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto;
altrimenti `Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto, `Outcome: hard-stop`; Fase 2 solo dopo un
messaggio `[P-2026-10-01-2301] GO`.

## Contesto

Issue #168: nello stand-alone di #157 (`#/project?id=X&profile=Y`) il fruitore lavora solo nel
Configurator (`frontend/src/components/environment/ConfiguratorTab.tsx`, `variant="page"`), il Dock
è montato ma nascosto e nessun editor si apre. Jodie (`frontend/src/components/Jodie/Jodie.tsx`,
montato in `App.tsx`) ricava l'artefatto attivo da `getActiveLevel` / `getActiveModel` /
`getActiveMetamodel` (`frontend/src/jjscript/executor/utils.ts`), che leggono la cache aggiornata da
`EDITOR_TYPE_CHANGE`, la tab attiva del Dock e `_lastSelected`: nello stand-alone il risultato può
essere vuoto, oppure una tab rimasta aperta sotto il Dock nascosto, metamodello compreso. Il contesto
(`JjodieContextService.getContextJSON`, `frontend/src/services/JjodieContext.ts`) non conosce il
profilo. Altre due lane girano in parallelo su branch propri (M0 misure, `P-2026-10-01-2300`;
B controllo dei permessi nell'esecutore, `P-2026-10-01-2302`): non toccare i loro file.

Decisione di Juri (2026-10-01): **Jodie non va stravolto.** Tutto quello che cambia sta dietro
`isConsumerMode()` (`frontend/src/components/environment/consumerMode.ts`); in modalità developer il
comportamento resta identico byte per byte.

### Criteri della issue

**J1. Jodie sa su cosa sto lavorando**
- Il Configurator pubblica la selezione corrente (tipo, istanza se c'è, modello dell'istanza) con un
  evento dichiarato in `frontend/src/events/registry.ts`, e Jodie la usa come artefatto attivo.
- In modalità consumer il livello è sempre M1. Una tab di metamodello rimasta sotto il Dock nascosto
  non diventa mai l'artefatto attivo.
- Quando la selezione cambia a conversazione aperta, Jodie lo dice in chat (esiste già un avviso
  simile per il cambio di editor).
- Il Configurator lista istanze di più modelli (`modelsForType`): il modello passato a Jodie è quello
  dell'istanza selezionata, oppure il primo modello del tipo se non c'è un'istanza selezionata.
- Logica di risoluzione in una funzione pura testata dal banco `node`.

**J2. Jodie vede solo quello che vedo io**
- In modalità consumer il contesto mandato al modello omette classi e istanze dei tipi `hidden` per
  il profilo, e segna come «sola lettura» quelli `read`.
- Il filtro è una funzione pura sul documento di contesto, testata: un tipo nascosto non compare in
  nessuna parte del JSON, riferimenti compresi.
- In modalità developer il contesto resta identico a oggi.
- È un filtro di coerenza, non di sicurezza (D1 di #157).

### Disegno deciso in chat (la Fase 1 lo verifica sul codice e riporta le deviazioni)

- **Evento.** Una costante nuova nel gruppo `EnvGenEvents` di `registry.ts` (per esempio
  `CONFIGURATOR_SELECTION_CHANGED`, stile dei nomi esistenti `envgen-configurator-...`), detail
  `{ typeId, instanceId, modelId }`, pubblicata da `ConfiguratorTab` quando cambiano tipo, istanza o
  modello risolto. Jodie può aprirsi dopo che la selezione è avvenuta: la Fase 1 sceglie come Jodie
  ottiene la selezione corrente (una richiesta che il Configurator ripubblica, oppure l'ultima
  selezione tenuta nel modulo puro, come `_activeArtifactCache`) e lo raccomanda.
- **Modulo puro** `frontend/src/components/environment/consumerJodieContext.ts`, importabile dal banco
  `node` (niente barrel `joiner`, come `frontend/src/joiner/environmentConfig.ts`):
  - `resolveConsumerArtifact(...)`: dalla selezione all'artefatto `{ id, name, level: 'M1',
    metamodelId }` o `undefined` (modello dell'istanza, altrimenti il primo modello del tipo).
  - `filterContextForProfile(...)`: dall'envelope di `getContextJSON` (forma di
    `JsonModelService.buildModelDocumentLight`, da leggere) a un envelope senza tipi `hidden` né le
    loro istanze in nessun punto (metamodello incorporato, oggetti, riferimenti, violazioni di
    conformità), con i tipi `read` segnati, più un blocco `environment`:
    `{ profile: <nome>, editableTypes: [...], readOnlyTypes: [...] }`. I permessi si leggono con
    `resolveTypePermission`, senza duplicarne la logica.
- **Jodie.tsx**, solo in consumer: l'artefatto viene dalla selezione, mai da `getActiveLevel` /
  `getActiveModel` / `getActiveMetamodel` né dalla cache di `EDITOR_TYPE_CHANGE`; il contesto passa
  dal filtro (`JSON.parse` dell'esito di `getContextJSON`, filtro, `JSON.stringify`, senza toccare
  `JjodieContext.ts`); lo scope si timbra come oggi (`level: 'M1'`, `metamodelId`, `modelId`).
  All'arrivo di una selezione diversa a conversazione aperta, una riga in chat senza gergo
  (niente M1, M2, metaclasse, istanza): per esempio «Now looking at: Scenario «Arco_0»». Il resto
  del linguaggio di Jodie è della lane J7, non di questa.
- Lo scope **non** porta il profilo: il controllo dei permessi della lane B legge il profilo
  dall'URL. Nessuna interfaccia condivisa con B (RC-22).

## Fase 1 — misura e verifica (sola lettura sul codice)

1. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` (P4, P8, P9, P13, P16), `docs/decisions.md`, le ultime entry di
   `docs/log-inbox/standalone-environment.md`, `frontend/scripts/smoke/README-probes.md`, i
   `CLAUDE.md` di sottocartella dei file che toccherai, e i file dei RIFERIMENTI.
2. **Passo 0 della issue**, con una sonda e un provider AI simulato (zero chiamate reali): una chiave
   finta nelle impostazioni AI, `page.route` sull'endpoint del provider che registra il corpo della
   richiesta e risponde con un testo fisso. Aprire un ambiente con `&profile=`, selezionare
   un'istanza nel Configurator, aprire Jodie, mandare un messaggio; registrare dal corpo intercettato
   il contesto (`currentlyEditing`, quale modello o metamodello, se compaiono tipi `hidden`) e dalla
   risposta lo scope timbrato. Ripetere con una tab di metamodello aperta da developer prima di
   passare a `&profile=`, senza ricarica e dopo una ricarica.
3. Verifica il disegno sul codice; elenca le deviazioni con il motivo.
4. Referto `docs/discovery/discovery_2026-10-01_168_a_context.md`: apre con `## 0. Answer in brief`
   (al massimo 40 righe: le misure del Passo 0, il disegno confermato o corretto, le domande ciascuna
   con la sua riga `Recommended:`). Committalo da solo:
   `docs(#168): discovery A, what Jodie sees in stand-alone (P-2026-10-01-2301)`.
5. `Outcome: hard-stop`.

## Fase 2 — implementazione (dopo `[P-2026-10-01-2301] GO`)

1. Implementa il disegno, con le correzioni approvate nel GO.
2. Test in `frontend/src/components/environment/__tests__/consumerJodieContext.test.ts`, tra cui: un
   tipo nascosto non compare nel JSON serializzato, né per nome né per id; il modello dell'istanza
   vince sul primo modello del tipo; i tipi `read` sono segnati; senza profilo l'envelope non cambia.
3. Banco di mutazione (CLAUDE.md §5): almeno togliere il filtro sui riferimenti, togliere la
   preferenza per il modello dell'istanza, togliere il segno `read`; ogni mutazione deve far fallire
   almeno un test. Il banco va nel corpo del commit.
4. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme della baseline
   (CLAUDE.md §17); `npm run build` exit 0; vitest sul test nuovo e su
   `src/joiner/__tests__/environmentConfig.test.ts`.
5. Sonda di nuovo (provider simulato): la selezione nel Configurator arriva nel contesto della
   richiesta, nessun nome né id di tipo nascosto nel corpo, il cambio di selezione produce la riga in
   chat; in modalità developer (senza `&profile=`) il corpo della richiesta dello stesso scenario è
   identico prima e dopo la modifica (confronto byte per byte).
6. Commit di codice:
   `feat(#168): Jodie follows the Configurator selection and the profile (P-2026-10-01-2301)`.
7. `Outcome: hard-stop` con una checklist visiva numerata per Juri (al massimo 6 voci, ognuna con
   cosa guardare e cosa ci si aspetta). La verifica visiva è umana su ogni lane fino al 2026-10-03
   (RC-23).
8. Dopo il GO visivo: un solo commit docs di chiusura con la entry in `docs/log-inbox/jodie-consumer.md`
   e la riga `Status: eseguito <data> · lane 168-context · <sha del codice> · verifica visiva passata <data>`.
   `Outcome: done`.

## DOVE

- `frontend/src/events/registry.ts` (una costante nel gruppo `EnvGenEvents`).
- `frontend/src/components/environment/ConfiguratorTab.tsx` (pubblica la selezione).
- `frontend/src/components/Jodie/Jodie.tsx` (ramo consumer).
- `frontend/src/components/environment/consumerJodieContext.ts` (nuovo, puro).
- `frontend/src/components/environment/__tests__/consumerJodieContext.test.ts` (nuovo).
- `docs/discovery/discovery_2026-10-01_168_a_context.md`, `docs/log-inbox/jodie-consumer.md`, la riga
  `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_a_*.ts`; porta **3042** soltanto.

Cinque file di codice, confermati da Juri in chat il 2026-10-01 (Rule 19). Un file fuori da questa
lista è una domanda (`Outcome: question`), non una deroga silenziosa.

Per le sonde: puoi partire, **in sola lettura**, da
`/Users/juridirocco/development/jjodel/frontend/scripts/smoke/_tmp_157_r5_verify.ts` e
`_tmp_157_158_globals.ts` (copiali nel tuo tree come `_tmp_168_a_*`). Eseguile contro il tuo codice con
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_a_<nome>.ts --port 3042 --id P-2026-10-01-2301`
(avvia il vite del tuo tree, `PROBE_URL` nell'ambiente, ferma solo quel vite; log in
`~/.jjodel-lanes/P-2026-10-01-2301/`). `npm run smoke` punta a 3000, il dev server di Juri: non è una
prova del tuo codice.

Baseline di `npm run check:docs` sul trunk (misurata 2026-10-01 a `98ebb132e`, identica con e senza i file di #168): exit 1 con **FAIL B** (4 errori `required field missing` su due entry del log attivo, `docs/claude-code-log.md:245` e `:267`) e **FAIL D** (74 entry nel log attivo, soglia 40). Non sono di questa lane e non si correggono qui: il gate è nessun FAIL nuovo e nessun errore sulle righe che scrivi tu.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling. Docs e codice mai nello stesso commit (P13).

Mai: i file della lane B (`frontend/src/jjscript/**`), `frontend/src/constants/defaultPrompts.ts`,
`frontend/src/types/jodie.ts`, `frontend/src/services/JjodieContext.ts`, `ChatMessages.tsx`; nessun
file della critical zone (§3.1); `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`,
`git checkout -- .`, `git clean`, `--no-verify`, push, scritture in un altro tree, porte diverse da
3042, chiamate reali a un provider AI.

## RIFERIMENTI

- Issue #168 e #157 (jjodel-modeling/jjodel-frontend); i criteri sono riportati sopra.
- `docs/discovery/discovery_2026-10-01_157_r5_consumer_landing.md` (shell consumer, eventi
  `CONFIGURATOR_SELECT_TYPE` / `CONFIGURATOR_TYPE_CHANGED`, sonda R5).
- `docs/discovery/discovery_2026-09-16_jjodie_scope_level_m1_on_metamodel.md` (perché il livello decide).
- `frontend/src/components/Jodie/Jodie.tsx` (`projectContextBundle`, listener `EDITOR_TYPE_CHANGE`),
  `frontend/src/jjscript/executor/utils.ts`, `frontend/src/jjscript/executor/activeArtifact.ts`,
  `frontend/src/services/JjodieContext.ts`, `frontend/src/services/export/JsonModelService.ts`,
  `frontend/src/joiner/environmentConfig.ts`, `frontend/src/components/environment/consumerMode.ts`.
- Gotcha delle sonde di #157: l'`instanceof` delle istanze arriva differito; l'overlay del
  Configurator sopravvive a `page.goto` via hash; per attendere un salvataggio leggere il
  `lastModified` in localStorage.

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-01-2301 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

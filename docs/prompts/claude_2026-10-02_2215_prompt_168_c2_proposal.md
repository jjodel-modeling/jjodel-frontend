# Prompt: #168 C2 — Jodie propone modifiche, il fruitore le vede e le conferma (J4)

Prompt-ID: P-2026-10-02-2215
Chat: sessione Claude Code di Juri (VS Code), 2026-10-02, orchestratore delle lane #168
Lane: full (more than 3 files)
Status: da eseguire
Limite: 90 minuti per fase

Worktree: `/Users/juridirocco/development/jjodel-168-proposal`, branch `168-proposal`, tagliato dal
trunk `feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un
symlink a quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree, il
branch è `168-proposal`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto;
altrimenti `Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto, `Outcome: hard-stop`; Fase 2 solo dopo un
messaggio `[P-2026-10-02-2215] GO`.

## Contesto

Issue #168: nello stand-alone di #157 (`#/project?id=X&profile=Y`) il fruitore chiede a Jodie di
creare, compilare o collegare elementi; Jodie risponde con uno script JjScript M1 in un blocco
`jjscript` (il «linguaggio di refactoring», decisione di Juri). Oggi quel blocco si mostra come al
developer: `CodeBlock` in `frontend/src/components/common/MarkdownRenderer.tsx` passa a `ScriptBlock`
(editor dello script con «Run»). Questa lane dà al fruitore una proposta leggibile, con «Apply» e
«Discard». **Jodie non va stravolto:** tutto dietro `isConsumerMode()`; per il developer niente cambia.

Già nel trunk: lane B (`executor/permissionGuard.ts`: in consumer l'esecuzione rifiuta per comando
ciò che il profilo non consente, codici `PROFILE_*` in `errors[0].code`); lane A (Jodie lavora
sull'elemento a fuoco nel Configurator, contesto filtrato per profilo, blocco `environment`
`{ profile, editableTypes, readOnlyTypes }`, `currentlyEditing.type` / `.instance`); i referti M0
(`docs/discovery/discovery_2026-10-01_168_m0_measures.md`) e R. In parallelo gira la lane C1
(`P-2026-10-02-1255`, branch `168-exec`): `set` sostituisce sui riferimenti singoli, nessuna scrittura
persa fra `set` consecutivi, `= null` svuota davvero, prompt di chat v5 con la sezione per il
fruitore. C1 si fonde prima di C2: non toccare i suoi file, e scrivi sonde che non dipendano dalla
sua correzione (un `set` per slot). In parallelo gira anche la lane D (J7, linguaggio di Jodie,
`P-2026-10-02-2216`): non toccare i suoi file.

### Criteri della issue (J4) e decisioni di Juri

- Jodie risponde con una proposta di modifiche M1 (`create instance of` / `set` / `delete instance` /
  `rename instance`).
- In consumer la proposta si presenta come elenco leggibile («Create Competency "teamwork"», «Set
  Title of s1 to …», «Link …», «Put c1 inside s1»), con lo script in un riquadro «Details» chiuso, e
  due pulsanti: «Apply» e «Discard». Interfaccia in inglese come il resto dell'app; niente M1, M2,
  metaclasse, istanza, JjScript nei testi.
- «Apply» esegue lo script nello scope della risposta (`jjodieScope`), non in quello attivo al clic:
  è già così con `onJjScriptExecute` di `ChatMessages.tsx` (`handleJjScriptExecute(commands, scope)`).
- Dopo «Apply»: «Unsaved» si accende (`U.isProjectModified = true`, M0 Q2: JjScript non lo fa);
  l'elenco del Configurator si aggiorna (già vero, M0 Q6); l'elemento creato o modificato risulta
  selezionato nel Configurator (M0 Q6: manca un evento; nuovo `EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE`).
- **Annullamento, decisione (a) di Juri:** «Apply» attiva la cronologia di annullamento
  (`U.userHasInteracted = true` prima di eseguire, M0 Q1: senza, Ctrl+Z non fa nulla in consumer) e si
  dichiara che Ctrl+Z annulla a passi, non in un colpo solo. Niente annullamento in un passo in v1.
- Se un comando fallisce, il fruitore vede quale modifica non è stata applicata e perché, in
  linguaggio non tecnico (i codici `PROFILE_*` di B, `INSTANCE_NOT_FOUND`, `AMBIGUOUS_INSTANCE`, …).
  Le modifiche già applicate restano visibili.
- **Contenimento, opzione (d) di Juri:** un tipo non creabile alla radice si crea alla radice e poi si
  sposta con il `set` del riferimento di contenimento del padre, nello stesso script. Prima di
  «Apply», un controllo puro sullo script intero: un `create` di un tipo non creabile alla radice non
  seguito dal suo `set` di contenimento rende la proposta non applicabile, con il motivo (M0 Q5: un
  figlio rimasto alla radice è invisibile al fruitore).
- Una risposta senza blocco `jjscript` non modifica mai il modello (J3, già vero).

## Fase 1 — verifica (sola lettura sul codice)

1. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` (P4, P8, P9, P13, P16), `docs/decisions.md`, il
   `CLAUDE.md` di `frontend/src/styles/` (token, Rule 27-28), `frontend/src/jjscript/CLAUDE.md`, i
   referti di M0, B, A e R nel trunk, `frontend/scripts/smoke/README-probes.md`, i file dei RIFERIMENTI.
2. Come `CodeBlock` decide di mostrare `ScriptBlock` (è un interruttore, `jjscriptMode`): dove inserire
   il ramo consumer senza cambiare il comportamento developer.
3. Cosa restituisce l'esecuzione per comando (`ScriptLineResult`: `success`, `message`, `errors`,
   `data`, `affectedElements`) e come ricavare l'elemento da selezionare dopo «Apply».
4. Come descrivere ogni comando in linguaggio semplice dall'AST del parser (`jjscript/parser`, che si
   carica nel banco `node`), distinguendo attributo, riferimento e contenimento: con quale fonte (il
   contesto della risposta, lo store) e dove passa il confine puro.
5. Come il Configurator seleziona un elemento da fuori: tipo di primo livello e riga, oppure, se
   l'elemento è annidato, la riga dell'antenato di primo livello e la navigazione fino a lui (lo
   stato `nav` di A).
6. Proponi il disegno e conferma la lista dei file (sotto). Referto
   `docs/discovery/discovery_2026-10-02_168_c2_proposal.md`: apre con `## 0. Answer in brief` (al
   massimo 40 righe, le domande ciascuna con la sua riga `Recommended:`). Committalo da solo:
   `docs(#168): discovery C2, the consumer proposal (P-2026-10-02-2215)`.
7. `Outcome: hard-stop`.

## Fase 2 — implementazione (dopo `[P-2026-10-02-2215] GO`)

1. Implementa il disegno approvato nel GO.
2. Test del modulo puro: descrizione di ogni comando, controllo del contenimento, messaggi di
   fallimento per codice. Banco di mutazione nel corpo del commit.
3. Sonda (porta 3047, provider AI simulato con `page.route`, zero chiamate reali, clic reali): in
   consumer, una risposta simulata con un blocco `jjscript` mostra l'elenco leggibile e non
   `ScriptBlock`; «Apply» su un tipo `edit` crea e collega, «Unsaved» acceso, Configurator aggiornato
   e con l'elemento selezionato, Ctrl+Z annulla; una proposta su un tipo `read` mostra il rifiuto in
   linguaggio semplice; uno script di contenimento valido si applica e uno senza il `set` di
   contenimento non si può applicare; «Discard» non scrive nulla; in modalità developer lo stesso
   blocco mostra ancora `ScriptBlock`.
4. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme della baseline;
   `npm run build` exit 0; vitest sul test nuovo e sui test che leggono i file toccati.
5. Commit di codice: `feat(#168): the consumer sees Jodie's proposal and applies it (P-2026-10-02-2215)`.
6. `Outcome: hard-stop` con una checklist visiva numerata per Juri (al massimo 7 voci, con la
   preparazione della fixture in una riga da incollare in console, come `_tmp_168_a_setup.js` della
   lane A). Dopo il GO visivo: un solo commit docs di chiusura con la entry in
   `docs/log-inbox/jodie-consumer.md` e la riga
   `Status: eseguito <data> · lane 168-proposal · <sha del codice> · verifica visiva passata <data>`.
   `Outcome: done`.

## DOVE

Lista candidata, da confermare in Fase 1 (Rule 19: sono più di 5 file; Juri la conferma al GO):

- `frontend/src/components/Jodie/ConsumerProposal.tsx` (nuovo) e `ConsumerProposal.scss` (nuovo,
  foglio accoppiato: solo token esistenti, nessuna variabile CSS definita qui, Rule 28).
- `frontend/src/components/Jodie/consumerProposal.ts` (nuovo, puro) e
  `frontend/src/components/Jodie/__tests__/consumerProposal.test.ts` (nuovo).
- `frontend/src/components/common/MarkdownRenderer.tsx` (il ramo consumer di `CodeBlock`).
- `frontend/src/events/registry.ts` (`EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE`).
- `frontend/src/components/environment/ConfiguratorTab.tsx` (ascolta l'evento e seleziona).
- `docs/discovery/discovery_2026-10-02_168_c2_proposal.md`, `docs/log-inbox/jodie-consumer.md`, la riga
  `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_c2_*.ts`; porta **3047** soltanto.

Un file fuori da questa lista è una domanda (`Outcome: question`), non una deroga silenziosa.

Per eseguire una sonda contro il tuo codice:
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_c2_<nome>.ts --port 3047 --id P-2026-10-02-2215`
(avvia il vite del tuo tree, `PROBE_URL` nell'ambiente, ferma solo quel vite). Fixture e provider
simulato: parti, in sola lettura, dalle sonde della lane A,
`/Users/juridirocco/development/jjodel-168-context/frontend/scripts/smoke/_tmp_168_a_verify.ts` e
`_tmp_168_a_setup.js`, e dalla fixture
`/private/tmp/claude-501/-Users-juridirocco-development-jjodel-168-context/473b3061-eb23-419d-bb4b-315b94042414/scratchpad/p0/`
(copiala nel tuo tree o nel tuo scratchpad). `states.ts` ha `BASE_URL` fisso su 3000: una sonda su
un'altra porta usa `PROBE_URL`. Se Vite muore con `write EPIPE`, controlla che la porta sia libera e
riprova una volta.

Baseline di `npm run check:docs` sul trunk: exit 1 con **FAIL B** (4 errori su
`docs/claude-code-log.md:245` e `:267`) e **FAIL D** (74 entry, soglia 40). Non sono di questa lane: il
gate è nessun FAIL nuovo e nessun errore sulle righe che scrivi tu.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling. Docs e codice mai nello stesso commit (P13).

Mai: i file della lane C1 (`frontend/src/jjscript/**`, `frontend/src/constants/defaultPrompts.ts`), i
file della lane D (`frontend/src/components/Jodie/Jodie.tsx`, `JodieWindow.tsx`, `JodieHeader.tsx`,
`ChatInput.tsx`, `ChatMessages.tsx`, `MarkdownMessage.tsx`, `frontend/src/components/NotificationWidget/**`),
`frontend/src/model/**`, la critical zone (§3.1); `git add .`, `-A`, `-u`, `git stash`,
`git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, scritture in un altro tree,
porte diverse da 3047, chiamate reali a un provider AI.

## RIFERIMENTI

- Referti nel trunk: `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (Q1, Q2, Q5, Q6),
  `..._168_b_guard.md`, `..._168_a_context.md`, `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`.
- `frontend/src/components/common/MarkdownRenderer.tsx`, `frontend/src/components/Jodie/ChatMessages.tsx`
  (`handleJjScriptExecute`, sola lettura), `frontend/src/jjscript/components/ScriptBlock.tsx` (sola
  lettura), `frontend/src/jjscript/parser/`, `frontend/src/jjscript/executor/permissionGuard.ts`,
  `frontend/src/components/environment/ConfiguratorTab.tsx`, `consumerJodieContext.ts`,
  `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (`drillInto`, `NavState`),
  `frontend/src/joiner/environmentConfig.ts` (`topLevelReason`), `frontend/src/common/U.tsx`
  (`userHasInteracted`, `isProjectModified`).

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-02-2215 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

# Prompt: #168 M0 — misure per J4 (annullamento, «Unsaved», riferimenti, contenimento)

Prompt-ID: P-2026-10-01-2300
Chat: sessione Claude Code di Juri (VS Code), 2026-10-01, orchestratore delle lane #168
Lane: discovery (read-only sul codice: scrive solo il referto in docs/ e sonde `_tmp_*` non tracciate)
Status: eseguito 2026-10-01 · lane 168-measures · 58adb6728
Limite: 90 minuti

Worktree: `/Users/juridirocco/development/jjodel-168-measures`, branch `168-measures`, tagliato dal
trunk `feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un
symlink a quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree,
il branch è `168-measures`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto;
altrimenti `Outcome: blocked`.

## Contesto

Issue #168: nello stand-alone di #157 (`#/project?id=X&profile=Y`, il fruitore lavora solo nel
Configurator) Jodie deve spiegare, completare e correggere il modello del fruitore, proponendo
modifiche che il fruitore vede e conferma («Applica» / «Scarta») e che non vanno mai oltre il suo
profilo. Questa lane misura, sul codice di oggi, ciò che la lane J4 (la proposta leggibile con
«Applica») dovrà promettere o correggere. Altre due lane girano in parallelo su branch propri
(A: contesto e selezione, `P-2026-10-01-2301`; B: controllo dei permessi nell'esecutore,
`P-2026-10-01-2302`); non toccare i loro file.

Decisioni prese in chat da Juri il 2026-10-01, che questa lane non rimette in discussione:

- Le proposte di Jodie restano script JjScript M1 (`create instance of`, `set`, `delete instance`,
  `rename instance`): è il «linguaggio di refactoring». In consumer si mostrano come elenco
  leggibile, lo script in un riquadro «Dettagli».
- `set` su un riferimento a valore singolo deve **sostituire** (G4), anche per il developer; la
  regola (b) del prompt di chat (`defaultPrompts.ts`, sezione M1 INSTANCE COMMANDS) sarà riscritta
  nella lane J4 insieme all'esecutore.
- Contenimento, ipotesi di Juri: JjScript non crea istanze dentro altre istanze, ma uno script può
  creare due elementi alla radice e poi impostare il riferimento di contenimento
  (`set padre.refContenimento = figlio`), che sposterebbe il figlio. Da misurare qui.
- Decisioni D1-D5 della issue: adottate le raccomandazioni. D5: «Applica» si annulla in un passo
  solo se si può fare senza toccare il livello di sincronizzazione; altrimenti si dichiara e si
  rimanda.

## COSA

Misurare nel browser reale (Playwright), con numeri letti da
`windoww.store.getState().idlookup` e mai da uno screenshot, e scrivere il referto. Nessuna modifica
a file tracciati sotto `frontend/`.

**Fixture**, costruita dalla sonda: un metamodello con almeno una classe radice `Scenario`
(creabile alla radice) con attributo stringa `title`; un riferimento di **contenimento** multiplo
`competencies: Competency[*]`; un riferimento **singolo** non contenitivo `lead: Person[0..1]`; un
riferimento **multiplo** non contenitivo `people: Person[*]`; una classe `Competency` composta (non
creabile alla radice) con un attributo stringa; una classe `Person` radice. Un modello conforme a
quel metamodello; per Q6 anche una configurazione d'ambiente con un profilo (vedi le sonde di #157).
I nomi sono liberi: registrali nel referto.

**Misure:**

- **Q1 Ctrl+Z.** Eseguire dal percorso di Jodie (`JjScriptService.execute(cmd, scope)` con uno scope
  legato M1, come fa `handleJjScriptExecute` in `frontend/src/components/Jodie/ChatMessages.tsx`)
  uno script di 4 righe: create Person, create Scenario, set `title`, set `lead`. Poi annullare con
  Ctrl+Z (trovare a cosa è legato e se funziona con il focus nel Configurator) finché lo stato torna
  a quello iniziale: quanti passi servono e quale stato intermedio lascia ciascuno. Dire se un passo
  solo è ottenibile senza una TRANSACTION esterna attorno ai creatori (Rule 12): elencare le
  opzioni con il loro costo, non implementarle.
- **Q2 «Unsaved».** Dopo l'esecuzione, `U.isProjectModified` e l'indicatore «Unsaved» della topbar si
  accendono? Se no, chi lo accende per le altre scritture e dove andrebbe acceso per JjScript.
- **Q3 Riferimento singolo.** `set s.lead = p1` poi `set s.lead = p2`: valori dello slot
  (`__raw.values`) e conformità (`validateConformance`). Confermare o falsificare G4 su questo codice.
  Lo stesso su `people` (multiplo), per fissare il comportamento da non cambiare.
- **Q4 Contenimento (ipotesi di Juri).** `create instance of Competency "c1"` (classe non creabile
  alla radice: registrare se JjScript la crea comunque e dove), poi `set s.competencies = c1`.
  Registrare: il `father` di c1 prima e dopo; se l'id di c1 resta in `idlookup[modelId].objects`;
  `LModel.objects` e `roots`; cosa elencano il Configurator (`instancesOfClass`) e il Data Manager;
  la conformità prima e dopo; se il canvas dell'editor del modello (developer) disegna c1 come
  vertice alla radice. Codice da leggere: `frontend/src/model/logicWrapper/LModelElement.tsx`,
  `get_setValueAtPosition` (ramo `isContainment`) e `set_values`. Solo osservare: niente modifiche
  al livello L né alla sincronizzazione.
- **Q5 Spostamento fallito.** Se il `set` di contenimento fallisce (per esempio un nome di padre
  sbagliato), cosa resta: c1 orfana alla radice? Come la vede il fruitore nel Configurator?
- **Q6 Configurator.** Con `&profile=` attivo, dopo una create via JjScript la lista del Configurator
  mostra l'istanza senza ricaricare? Esiste già un modo, da fuori, per spostare la selezione del
  Configurator sull'elemento creato (eventi in `frontend/src/events/registry.ts`, gruppo
  `EnvGenEvents`)?

Il referto chiude ogni domanda con una raccomandazione per la lane J4: cosa si può promettere, cosa
va corretto e in quale file, cosa va dichiarato e rimandato.

## DOVE

- `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (nuovo). Apre con `## 0. Answer in brief`,
  al massimo 40 righe: la risposta, le raccomandazioni, le domande aperte ciascuna con la sua riga
  `Recommended:` (P16). Il resto è appendice, con i numeri misurati.
- `docs/log-inbox/jodie-consumer.md`: una entry nel formato P9.
- La riga `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_m0_*.ts` (gitignored, mai committate).
- Porta **3041** soltanto.

## COME

1. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` (P4, P8, P9, P13, P16), `docs/decisions.md`, le ultime entry
   di `docs/log-inbox/standalone-environment.md`, `frontend/scripts/smoke/README-probes.md`,
   `frontend/src/jjscript/CLAUDE.md`, `frontend/src/model/CLAUDE.md` e i file dei RIFERIMENTI.
2. Sonde: puoi partire dalle sonde di #157 nel tree principale, **in sola lettura**:
   `/Users/juridirocco/development/jjodel/frontend/scripts/smoke/_tmp_157_r5_verify.ts`,
   `_tmp_157_158_globals.ts`, `_tmp_157_r3_measure.ts`. Copiale nel tuo tree come `_tmp_168_m0_*`.
   Non scrivere mai nel tree principale.
3. Per eseguire una sonda contro il codice del tuo worktree usa il lanciatore, che avvia il vite del
   tuo tree sulla porta, esegue la sonda (`PROBE_URL` nell'ambiente) e ferma solo quel vite:
   `node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_m0_<nome>.ts --port 3041 --id P-2026-10-01-2300`
   (il log va in `~/.jjodel-lanes/P-2026-10-01-2300/probe-<nome>.log`, con `EXIT=` in coda).
   `npm run smoke` punta a 3000 (`states.ts:15`), che è il dev server di Juri e non il tuo codice:
   non usarlo come prova di questa lane.
4. Scrivi il referto e committalo da solo:
   `docs(#168): discovery M0, measures for J4 (P-2026-10-01-2300)`.
5. Gate: `npm run check:docs` (da `frontend/`). Baseline di `npm run check:docs` sul trunk (misurata 2026-10-01 a `98ebb132e`, identica con e senza i file di #168): exit 1 con **FAIL B** (4 errori `required field missing` su due entry del log attivo, `docs/claude-code-log.md:245` e `:267`) e **FAIL D** (74 entry nel log attivo, soglia 40). Non sono di questa lane e non si correggono qui: il gate è nessun FAIL nuovo e nessun errore sulle righe che scrivi tu.
6. Commit di chiusura (uno solo, docs): la entry dell'inbox e la riga
   `Status: eseguito 2026-10-01 · lane 168-measures · <sha del referto>`. Lane senza verifica
   visiva: la chiusura segue subito il commit del referto (P13).
7. `Outcome: done` con gli sha. Se una misura non si può chiudere per una ragione tecnica, dillo nel
   referto come non chiusa (non come negativa) e prosegui con le altre.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling.

Mai: modificare file tracciati fuori dal DOVE, `git add .`, `-A`, `-u`, `git stash`,
`git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, scritture in un altro tree,
porte diverse da 3041, chiamate reali a un provider AI.

## RIFERIMENTI

- Issue #168 e #157 (jjodel-modeling/jjodel-frontend); il contesto essenziale è riassunto sopra.
- `docs/discovery/2026-06-12_jjscript_m1_coverage.md` (G4, G6, G7).
- `docs/discovery/discovery_2026-10-01_157_r3_rootable_types.md` (creazione forzata alla radice).
- `docs/discovery/discovery_2026-10-01_157_r5_consumer_landing.md` (shell consumer, sonda R5).
- `frontend/src/jjscript/executor/commands/instance.ts`, `frontend/src/jjscript/services/JjScriptService.ts`,
  `frontend/src/jjscript/executor/executor.ts`, `frontend/src/components/Jodie/ChatMessages.tsx`,
  `frontend/src/model/logicWrapper/LModelElement.tsx`, `frontend/src/components/environment/ConfiguratorTab.tsx`,
  `frontend/src/joiner/environmentConfig.ts`, `frontend/src/model/conformance/ConformanceValidator.ts`.
- Gotcha delle sonde di #157: l'`instanceof` delle istanze arriva differito (asserire la forma prima di
  collegare); l'overlay del Configurator sopravvive a `page.goto` via hash; per attendere un
  salvataggio leggere il `lastModified` in localStorage, non `U.isProjectModified`.

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-01-2300 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

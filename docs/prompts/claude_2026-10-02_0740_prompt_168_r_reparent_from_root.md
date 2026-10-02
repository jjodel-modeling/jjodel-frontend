# Prompt: #168 R — uno spostamento per contenimento toglie l'oggetto dalla radice del modello (core)

Prompt-ID: P-2026-10-02-0740
Chat: sessione Claude Code di Juri (VS Code), 2026-10-02, orchestratore delle lane #168
Lane: full (core change in the L-layer, Rule 5 approved by Juri 2026-10-02; Layer Impact Report)
Status: da eseguire
Limite: 90 minuti per fase

Worktree: `/Users/juridirocco/development/jjodel-168-reparent`, branch `168-reparent`, tagliato dal
trunk `feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un
symlink a quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree,
il branch è `168-reparent`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto;
altrimenti `Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto con il Layer Impact Report,
`Outcome: hard-stop`; Fase 2 solo dopo un messaggio `[P-2026-10-02-0740] GO`.

## Contesto

Issue #168, lane M0 (referto `docs/discovery/discovery_2026-10-01_168_m0_measures.md`, nel trunk,
§0 Q4 e il suo dettaglio): uno script JjScript `create instance of Competency "c1"` seguito da
`set s.competencies = c1` (riferimento di contenimento) **sposta** `c1`: il suo `father` diventa lo
slot (`DValue`). Ma l'id di `c1` **resta** in `idlookup[modelId].objects`, e quindi in
`LModel.objects` / `roots`: l'oggetto risulta sia alla radice sia dentro lo scenario.
`validateConformance` non lo vede.

Causa misurata da M0: il ramo `isContainment` di `get_setValueAtPosition`
(`frontend/src/model/logicWrapper/LModelElement.tsx`, circa righe 7905-7930) cambia il padre con un
`SetFieldAction.new(val, "father", c.data.id, ...)` diretto. Stacca l'oggetto dal vecchio contenitore
solo se quello era uno slot (`oldContainerValue`); se era il modello (`DModel`), nessuno lo toglie da
`objects`. Il percorso canonico, `set_father` della base (circa riga 754), fa invece
`SetFieldAction.new(oldD, oldCollection, val, '-=', true)` sulla collezione del vecchio padre
(`LPointerTargetable.getCollection(className, oldD.className)`).

Decisione di Juri (2026-10-02): **correggere il core**, non compensare nell'esecutore JjScript. La
correzione vale per ogni chiamante del ramo di contenimento (JjScript, Data Manager, form IR), non
solo per Jodie.

## COSA

Quando un oggetto viene scritto in uno slot di contenimento e il suo padre attuale è il modello,
toglierlo dalla collezione `objects` del modello, con lo stesso idioma di `set_father` e dentro la
stessa transazione delle altre azioni del ramo. Nessun altro comportamento cambia: spostamento fra
due slot, riferimenti non contenitivi, enum, primitivi, `addObject` (che crea già con padre lo slot).

## Fase 1 — verifica e Layer Impact Report (sola lettura sul codice)

1. Leggi `CLAUDE.md` (§3.2 Layer Impact Report, Rule 12, Rule 20), `docs/PROTOCOL.md` (P4, P5, P9,
   P13, P16), `docs/decisions.md`, `frontend/src/model/CLAUDE.md` (in particolare §3.6 e §9),
   `frontend/src/components/editor-v2/CLAUDE.md` (§3.3-3.5: come la sincronizzazione legge
   `model.objects`), il referto di M0 e i file dei RIFERIMENTI.
2. Riproduci il difetto sul codice di oggi con una sonda: parti dalla sonda di M0,
   `/Users/juridirocco/development/jjodel-168-measures/frontend/scripts/smoke/_tmp_168_m0_measures.ts`
   (sola lettura; copiala nel tuo tree come `_tmp_168_r_*`).
3. Elenca tutti i chiamanti del ramo di contenimento di `get_setValueAtPosition` / `set_values`
   (JjScript `instance.ts`, Data Manager, form IR, import, canvas) e, per ciascuno, se oggi può
   partire da un oggetto con padre il modello.
4. Verifica cosa fa la sincronizzazione del canvas (`useJjomSync`, Step 2bis, file in sola lettura)
   quando un oggetto lascia `model.objects`: lo stato prodotto dalla correzione è lo stesso che
   produce già `set_father`? Misuralo se serve, non dedurlo.
5. Proponi il diff minimo (testo, non applicato). Scrivi il referto
   `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`: apre con `## 0. Answer in brief`
   (al massimo 40 righe, le domande ciascuna con la sua riga `Recommended:`) e contiene il
   **Layer Impact Report** di CLAUDE.md §3.2, compilato. Committalo da solo:
   `docs(#168): discovery R, reparent from the model root (P-2026-10-02-0740)`.
6. `Outcome: hard-stop`.

## Fase 2 — implementazione (dopo `[P-2026-10-02-0740] GO`)

1. Applica il diff approvato nel GO, nel solo ramo di contenimento di `get_setValueAtPosition`.
   Nessun TRANSACTION esterno attorno a creatori (Rule 12).
2. Test: `LModelElement.tsx` non si importa nel banco `node` (barrel `joiner`, monaco). Non scrivere
   un test sul testo del sorgente (CLAUDE.md §5): la verifica è la sonda nel browser reale, e il gap
   va dichiarato nella entry di log.
3. Sonda (porta 3044), con numeri letti dallo store: dopo `set s.competencies = c1` l'id di `c1` non
   è più in `objects` del modello, `father` è lo slot, `LModel.objects` non lo contiene, la
   conformità è invariata, il Configurator e il Data Manager lo mostrano dentro lo scenario;
   Ctrl+Z (con `U.userHasInteracted` alzato, come misurato da M0) riporta `c1` alla radice e in
   `objects`; spostamento fra due slot, riferimento non contenitivo e `addObject` invariati rispetto
   alla Fase 1. Come appare `c1` nel canvas del developer dopo lo spostamento (vertice alla radice o
   no): misurato e riportato.
4. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme della baseline;
   `npm run build` exit 0; vitest completo (`npm run test`), con i 9 file noti che falliscono
   all'import e nessun altro rosso.
5. Commit di codice:
   `fix(#168): a containment move takes the object off the model root (P-2026-10-02-0740)`.
6. `Outcome: hard-stop` con una checklist visiva numerata per Juri (al massimo 5 voci, compreso il
   canvas del developer). Dopo il GO visivo: un solo commit docs di chiusura con la entry in
   `docs/log-inbox/jodie-consumer.md` e la riga
   `Status: eseguito <data> · lane 168-reparent · <sha del codice> · verifica visiva passata <data>`.
   `Outcome: done`.

## DOVE

- `frontend/src/model/logicWrapper/LModelElement.tsx` (solo il ramo di contenimento di
  `get_setValueAtPosition`).
- `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`, `docs/log-inbox/jodie-consumer.md`,
  la riga `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_r_*.ts`; porta **3044** soltanto.

Un file fuori da questa lista è una domanda (`Outcome: question`), non una deroga silenziosa.

Per eseguire una sonda contro il tuo codice:
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_r_<nome>.ts --port 3044 --id P-2026-10-02-0740`
(avvia il vite del tuo tree, `PROBE_URL` nell'ambiente, ferma solo quel vite; log in
`~/.jjodel-lanes/P-2026-10-02-0740/`). `npm run smoke` punta a 3000, il dev server di Juri, e
`states.ts` ha `BASE_URL` fisso su 3000: una sonda su un'altra porta usa `PROBE_URL` e non
`createProject` di `states.ts`. Se Vite muore con `write EPIPE` (macchina carica, più lane in
parallelo), controlla che la porta sia libera e riprova una volta.

Baseline di `npm run check:docs` sul trunk (misurata, invariata dalle lane #168): exit 1 con
**FAIL B** (4 errori `required field missing` su due entry del log attivo,
`docs/claude-code-log.md:245` e `:267`) e **FAIL D** (74 entry nel log attivo, soglia 40). Non sono
di questa lane e non si correggono qui: il gate è nessun FAIL nuovo e nessun errore sulle righe che
scrivi tu.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling. Docs e codice mai nello stesso commit (P13).

Mai: altri metodi di `LModelElement.tsx`, i file della critical zone (§3.1), i file della lane A
(`frontend/src/events/registry.ts`, `frontend/src/components/environment/**`,
`frontend/src/components/Jodie/**`), `frontend/src/jjscript/**`, `frontend/src/constants/defaultPrompts.ts`;
`git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`,
`--no-verify`, push, scritture in un altro tree, porte diverse da 3044, chiamate reali a un
provider AI.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (Q4, Q5, e il gate `U.userHasInteracted`
  di Q1).
- `docs/discovery/2026-06-12_jjscript_m1_coverage.md` (G7, contenimento e vertici).
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`set_father` base e di `LObject`,
  `get_setValueAtPosition`, `set_values`, `addObject`), `frontend/src/joiner/classes.ts`
  (`LPointerTargetable.getCollection`), `frontend/src/components/editor-v2/hooks/useJjomSync.ts`
  (sola lettura), `frontend/src/jjscript/executor/commands/instance.ts` (sola lettura).

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-02-0740 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

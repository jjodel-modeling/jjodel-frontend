# Prompt: #168 C1 — JjScript sostituisce sui riferimenti singoli e non perde scritture; il prompt di chat per il fruitore

Prompt-ID: P-2026-10-02-1255
Chat: sessione Claude Code di Juri (VS Code), 2026-10-02, orchestratore delle lane #168
Lane: full (more than 3 files; changes JjScript behaviour for developers too)
Status: eseguito 2026-10-02 · lane 168-exec · dc8b7f9b5
Limite: 90 minuti per fase

Worktree: `/Users/juridirocco/development/jjodel-168-exec`, branch `168-exec`, tagliato dal trunk
`feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un symlink a
quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree, il branch è
`168-exec`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto; altrimenti
`Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto, `Outcome: hard-stop`; Fase 2 solo dopo un
messaggio `[P-2026-10-02-1255] GO`.

## Contesto

Issue #168 (Jodie per il fruitore dello stand-alone di #157). Le proposte di modifica di Jodie
restano script JjScript M1 (`create instance of`, `set`, `delete instance`, `rename instance`): è il
«linguaggio di refactoring», deciso da Juri. Nel trunk ci sono già i referti delle lane M0
(`docs/discovery/discovery_2026-10-01_168_m0_measures.md`), B (`..._168_b_guard.md`, controllo dei
permessi in `executeAST`, codice in `executor/permissionGuard.ts`) e R
(`docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`). La lane A (contesto e selezione)
gira in parallelo su `168-context`: non toccare i suoi file. La proposta leggibile con «Applica» e
«Scarta» (C2) e il linguaggio dell'interfaccia di Jodie (J7, lane D) vengono dopo: non sono di questa
lane.

Misure di M0 (Q3) che questa lane chiude:

- **G4 confermato:** `set s.lead = p1` poi `set s.lead = p2` su un riferimento `0..1` lascia due
  valori; la conformità segnala `multiplicity_upper_exceeded` solo alla rivalidazione.
- **Scrittura persa, scoperta da M0:** due `set` consecutivi sullo stesso riferimento nello stesso
  script, senza pausa, possono perdere il primo valore. Ogni `set` legge `__raw.values` in modo
  sincrono e scrive con un dispatch differito (`setTimeout(0)`, `redux/action/action.ts:349`): è la
  race ENG1 che `frontend/scripts/smoke/README-probes.md` documenta per le sonde. Con 400 ms di pausa
  i due valori restano.

Decisioni di Juri (2026-10-01 e 2026-10-02):

- `set` su un riferimento a valore singolo (limite superiore 1) **sostituisce**, anche per il
  developer. Su un riferimento multiplo continua ad aggiungere, un `set` per bersaglio; `= null`
  svuota lo slot come oggi.
- Contenimento: opzione (d) dopo la lane R. Nessuna modifica al core; lo schema da insegnare è
  `create instance of Figlio "f"` alla radice seguito da `set padre.riferimentoDiContenimento = f`,
  che produce lo stesso stato dei gesti del canvas.
- Jodie non va stravolto: il prompt del developer cambia solo nelle regole corrette qui; le
  istruzioni per il fruitore valgono solo quando il contesto porta il blocco `environment` (lo
  aggiunge la lane A: `{ profile, editableTypes, readOnlyTypes }`).

## COSA

1. **Esecutore.** Nel ramo di collegamento di `executeSetInstance`
   (`frontend/src/jjscript/executor/commands/instance.ts`, oggi `refProxy.values = [...meaningful,
   targetInstance.id]`): sostituire quando il riferimento ha limite superiore 1; e non perdere un
   valore quando più `set` sullo stesso slot arrivano nello stesso script prima che lo store li
   rifletta (cursore che accumula le scritture in sospeso dello script, o un'altra soluzione che la
   Fase 1 misura e raccomanda). La logica di calcolo dei nuovi valori va in un modulo puro testabile
   dal banco `node` (per esempio `frontend/src/jjscript/executor/referenceWrite.ts`), perché
   `instance.ts` importa il barrel `joiner` e non si carica sotto vitest.
2. **Prompt di chat** (`frontend/src/constants/defaultPrompts.ts`, sezione M1 INSTANCE COMMANDS e
   seguenti):
   - riscrivere la regola (b): su un riferimento singolo un nuovo `set` sostituisce il bersaglio;
   - insegnare lo schema del contenimento (create alla radice, poi `set` del riferimento di
     contenimento del padre), e che un tipo non creabile alla radice va sempre seguito dal suo `set`
     di contenimento nello stesso script; la riga attuale «no containment/nesting at creation time»
     resta vera e va riformulata, non tolta;
   - una sezione per il fruitore, attiva solo quando il contesto contiene il blocco `environment`:
     interlocutore non developer, linguaggio semplice, niente M1, M2, metaclasse, istanza, JjScript;
     le domande ricevono risposte senza script; le richieste di modifica ricevono **un solo** blocco
     `jjscript` con soli comandi d'istanza, solo su tipi in `editableTypes`; mai su `readOnlyTypes`
     né su tipi assenti dal contesto; mai comandi di metamodello;
   - `DEFAULT_PROMPT_VERSIONS.chat` da 4 a 5 con la riga di changelog.

## Fase 1 — verifica (sola lettura sul codice)

1. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` (P4, P9, P13, P16), `docs/decisions.md`,
   `frontend/src/jjscript/CLAUDE.md`, `frontend/src/model/CLAUDE.md` (§9), i referti M0, B e R, e i
   file dei RIFERIMENTI.
2. Riproduci sul codice di oggi G4 e la scrittura persa, con una sonda (parti dalla sonda di M0,
   `/Users/juridirocco/development/jjodel-168-measures/frontend/scripts/smoke/_tmp_168_m0_measures.ts`,
   in sola lettura; copiala come `_tmp_168_c1_*`).
3. Dove si legge il limite superiore del riferimento; come si comporta il ramo di scollegamento
   (`= null`); se `remove`/`add` di JjScript hanno lo stesso problema a M1 (solo da riportare).
4. Proponi il disegno della correzione della scrittura persa con il suo costo, e verifica che non
   tocchi il livello di sincronizzazione (Rule 12: nessun TRANSACTION esterno attorno a creatori).
5. Bozza delle modifiche al prompt (testo, non applicato).
6. Referto `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md`: apre con
   `## 0. Answer in brief` (al massimo 40 righe, le domande ciascuna con la sua riga `Recommended:`).
   Committalo da solo: `docs(#168): discovery C1, reference writes and the chat prompt (P-2026-10-02-1255)`.
7. `Outcome: hard-stop`.

## Fase 2 — implementazione (dopo `[P-2026-10-02-1255] GO`)

1. Implementa il disegno approvato nel GO.
2. Test del modulo puro: singolo sostituisce, multiplo aggiunge, due scritture in sospeso sullo stesso
   slot restano entrambe, `null` svuota, duplicati come oggi. Banco di mutazione nel corpo del commit.
3. Sonda (porta 3046): le stesse misure di M0 Q3 dopo la correzione (singolo: un valore; multiplo
   senza pausa: due valori), più uno script di contenimento (create + set) che lascia il figlio nello
   slot.
4. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme della baseline;
   `npm run build` exit 0; vitest sul test nuovo e su `src/jjscript/` (i 9 file noti che falliscono
   all'import restano quelli).
5. Due commit di codice: `fix(#168): JjScript set replaces a single reference and keeps pending
   writes (P-2026-10-02-1255)` e `feat(#168): chat prompt v5, reference rule, containment and the
   consumer section (P-2026-10-02-1255)`.
6. Nessuna verifica visiva (nessuna interfaccia cambia): subito dopo, un solo commit docs di chiusura
   con la entry in `docs/log-inbox/jodie-consumer.md` e la riga
   `Status: eseguito <data> · lane 168-exec · <sha dell'ultimo commit di codice>`. `Outcome: done`.

## DOVE

- `frontend/src/jjscript/executor/commands/instance.ts` (solo il ramo di collegamento di
  `executeSetInstance`).
- `frontend/src/jjscript/executor/referenceWrite.ts` (nuovo, puro; nome da confermare in Fase 1).
- `frontend/src/jjscript/executor/__tests__/referenceWrite.test.ts` (nuovo).
- `frontend/src/constants/defaultPrompts.ts`.
- `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md`, `docs/log-inbox/jodie-consumer.md`,
  la riga `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_c1_*.ts`; porta **3046** soltanto.

Quattro file di codice. Un file fuori da questa lista è una domanda (`Outcome: question`), non una
deroga silenziosa.

Per eseguire una sonda contro il tuo codice:
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_c1_<nome>.ts --port 3046 --id P-2026-10-02-1255`
(avvia il vite del tuo tree, `PROBE_URL` nell'ambiente, ferma solo quel vite). `states.ts` ha
`BASE_URL` fisso su 3000: una sonda su un'altra porta usa `PROBE_URL` e non `createProject`. Se Vite
muore con `write EPIPE` (più lane in parallelo), controlla che la porta sia libera e riprova una volta.

Baseline di `npm run check:docs` sul trunk: exit 1 con **FAIL B** (4 errori su
`docs/claude-code-log.md:245` e `:267`) e **FAIL D** (74 entry, soglia 40). Non sono di questa lane: il
gate è nessun FAIL nuovo e nessun errore sulle righe che scrivi tu.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling. Docs e codice mai nello stesso commit (P13).

Mai: i file della lane A (`frontend/src/events/registry.ts`, `frontend/src/components/environment/**`,
`frontend/src/components/Jodie/**`), `frontend/src/jjscript/executor/executor.ts` e
`permissionGuard.ts` (lane B, già nel trunk), `frontend/src/model/**`, la critical zone (§3.1);
`git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`,
`--no-verify`, push, scritture in un altro tree, porte diverse da 3046, chiamate reali a un provider
AI.

## RIFERIMENTI

- `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (Q3, Q4), `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`,
  `docs/discovery/discovery_2026-10-01_168_b_guard.md`, `docs/discovery/2026-06-12_jjscript_m1_coverage.md` (G4).
- `frontend/src/jjscript/executor/commands/instance.ts`, `frontend/src/redux/action/action.ts` (~349),
  `frontend/src/model/logicWrapper/LModelElement.tsx` (`set_values`, `get_setValueAtPosition`, sola
  lettura), `frontend/src/constants/defaultPrompts.ts`, `frontend/src/services/JjodieContext.ts` e
  `frontend/src/services/export/JsonModelService.ts` (forma del contesto, `containment: true` sui
  riferimenti), `frontend/scripts/smoke/README-probes.md` (ENG1).

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-02-1255 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

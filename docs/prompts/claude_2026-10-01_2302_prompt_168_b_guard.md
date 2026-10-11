# Prompt: #168 B — il profilo vale anche quando Jodie esegue (J5)

Prompt-ID: P-2026-10-01-2302
Chat: sessione Claude Code di Juri (VS Code), 2026-10-01, orchestratore delle lane #168
Lane: full (more than 3 files; an exported interface, `ExecutionContext`, may gain an optional field)
Status: eseguito 2026-10-01 · lane 168-guard · b3b9fcb9d
Limite: 90 minuti per fase

Worktree: `/Users/juridirocco/development/jjodel-168-guard`, branch `168-guard`, tagliato dal trunk
`feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un symlink a
quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree, il branch è
`168-guard`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto; altrimenti
`Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto, `Outcome: hard-stop`; Fase 2 solo dopo un
messaggio `[P-2026-10-01-2302] GO`.

## Contesto

Issue #168: nello stand-alone di #157 (`#/project?id=X&profile=Y`) Jodie proporrà al fruitore
modifiche al modello come script JjScript M1 (`create instance of`, `set`, `delete instance`,
`rename instance`), eseguiti da «Applica» con lo scope della risposta. Oggi l'esecutore
(`frontend/src/jjscript/executor/executor.ts`, handler in `executor/commands/`) non legge i permessi
del profilo (`resolveTypePermission`, `frontend/src/joiner/environmentConfig.ts`): il prompt dice al
modello cosa non fare, ma niente lo impedisce. Questa lane mette la garanzia nell'esecuzione. Altre
due lane girano in parallelo su branch propri (M0 misure, `P-2026-10-01-2300`; A contesto e
selezione, `P-2026-10-01-2301`): non toccare i loro file.

Decisione di Juri (2026-10-01): **Jodie non va stravolto.** Il controllo agisce solo in modalità
consumer; in modalità developer l'esecuzione resta identica.

### Criteri della issue (J5)

- In modalità consumer l'esecuzione rifiuta: i comandi M2 (classi, attributi, riferimenti, ecc.), la
  creazione e la cancellazione di istanze di tipi non `edit`, i `set` su istanze di tipi non `edit`.
- Il rifiuto è per comando, con un messaggio comprensibile, e non interrompe in silenzio il resto
  dello script senza dirlo.
- Il controllo del permesso è una funzione pura testata (comando + profilo → consentito/rifiutato con
  motivo), che legge `resolveTypePermission` senza duplicarne la logica.
- La garanzia sta nell'esecuzione, non nel prompt (il prompt sarà aggiornato da un'altra lane).

### Disegno deciso in chat (la Fase 1 lo verifica sul codice e riporta le deviazioni)

- **Modulo puro** `frontend/src/jjscript/executor/permissionGuard.ts`, importabile dal banco `node`
  come `executor/scopeGuard.ts` (niente barrel `joiner`): riceve una descrizione del comando già
  risolta dal chiamante (tipo di comando e id delle classi coinvolte) e il profilo; restituisce
  `null` oppure un rifiuto `{ code, message, suggestion? }`. I permessi passano da
  `resolveTypePermission`, mai da una copia della sua logica. Il permesso è della classe esatta
  dell'istanza, come oggi nel Configurator.
- **Politica in consumer, chiusa per difetto:**
  - consentiti i comandi che non scrivono il modello (candidati: `list`, `show`, `help`, `eval`,
    `validate`; la Fase 1 verifica che ognuno sia davvero in sola lettura);
  - `create instance of X` solo se `X` è `edit`;
  - `set i.p = v`, `rename instance i`, `delete instance i` solo se la classe di `i` è `edit`; per un
    riferimento, anche il bersaglio non deve essere di un tipo `hidden`;
  - rifiutato tutto il resto: ogni comando M2 e ogni altro comando (`let`, `forall`, `undo`, `redo`,
    `clear`, `add`, `remove`, `move`, `copy`, `extends`, `abstract`, …); un comando sconosciuto è
    rifiutato.
  - Messaggi in inglese, come il resto dell'interfaccia, semplici, con il nome del tipo e senza
    gergo: per esempio «You can't change Competency elements in this environment.» e «This
    environment doesn't allow changing the language itself.» La formulazione finale è tua.
- **Dove agisce.** Prima del dispatch in `executeAST`, accanto a `checkBoundScope`, ogni volta che
  l'esecuzione avviene in modalità consumer. Il profilo viene dall'URL (`activeProfileId()` di
  `frontend/src/components/environment/consumerMode.ts`), eventualmente portato in un campo
  opzionale `ExecutionContext.profileId` impostato da `JjScriptService.execute`. La Fase 1 elenca
  **tutti** i punti d'ingresso nell'esecutore (`executeCommand`, `executeBatch`, `getExecutor`,
  `new JjScriptExecutor`, l'esecuzione di `ScriptBlock`, la console JjScript) e sceglie il punto che
  li copre tutti; lo raccomanda con il motivo.
- La risoluzione dei nomi in id (classe per nome nel metamodello legato, istanza per nome nel
  modello legato) sta nell'adattatore in `executor.ts`, riusando quello che i handler già usano
  (`findInstanceByName` / `resolveInstanceHandle` esportati da `executor/commands/instance.ts`,
  `executor/resolvers.ts`), non nel modulo puro. `instance.ts` non si modifica: lo cambierà la lane
  J4 (G4).
- Il rifiuto è un `ExecutionResult` del singolo comando, `success: false`, con il codice in
  `errors[0].code`. Il controllo non ferma gli altri comandi dello script; come l'interfaccia mostra
  i rifiuti è della lane J4.

## Fase 1 — verifica (sola lettura sul codice)

1. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` (P4, P9, P13, P16), `docs/decisions.md`,
   `frontend/src/jjscript/CLAUDE.md`, `frontend/scripts/smoke/README-probes.md` e i file dei
   RIFERIMENTI.
2. Classifica ogni ramo dello `switch` di `executeAST` come lettura o scrittura, con `file:riga`.
3. Elenca i punti d'ingresso nell'esecutore e raccomanda dove agganciare il controllo.
4. Verifica il disegno sul codice; elenca le deviazioni con il motivo.
5. Referto `docs/discovery/discovery_2026-10-01_168_b_guard.md`: apre con `## 0. Answer in brief`
   (al massimo 40 righe, le domande ciascuna con la sua riga `Recommended:`). Committalo da solo:
   `docs(#168): discovery B, the profile guard for JjScript (P-2026-10-01-2302)`.
6. `Outcome: hard-stop`.

## Fase 2 — implementazione (dopo `[P-2026-10-01-2302] GO`)

1. Implementa il disegno, con le correzioni approvate nel GO.
2. Test in `frontend/src/jjscript/executor/__tests__/permissionGuard.test.ts`: una tabella comando ×
   permesso (`edit`, `read`, `hidden`, nessun profilo) → consentito o rifiutato, con il codice.
3. Banco di mutazione (CLAUDE.md §5): almeno trattare `read` come `edit`, togliere il controllo su
   `set`, consentire i comandi sconosciuti, ignorare il bersaglio `hidden` di un riferimento; ogni
   mutazione deve far fallire almeno un test. Il banco va nel corpo del commit.
4. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme della baseline
   (CLAUDE.md §17); `npm run build` exit 0; vitest sul test nuovo e sui test esistenti di
   `src/jjscript/` (i 9 file noti che falliscono all'import restano quelli, CLAUDE.md §17).
5. Sonda nel browser reale (porta 3043): in consumer, con un profilo che ha un tipo `edit` e uno
   `read`, `JjScriptService.execute(cmd, scope)` con uno scope legato M1: una create sul tipo `edit`
   va a buon fine, una sul tipo `read` è rifiutata con il messaggio, un `create class` è rifiutato;
   gli stessi comandi senza `&profile=` si comportano come prima della modifica.
6. Commit di codice:
   `feat(#168): JjScript refuses what the profile does not allow (P-2026-10-01-2302)`.
7. Lane senza verifica visiva (nessuna interfaccia cambia): subito dopo, un solo commit docs di
   chiusura con la entry in `docs/log-inbox/jodie-consumer.md` e la riga
   `Status: eseguito <data> · lane 168-guard · <sha del codice>`. `Outcome: done`.

## DOVE

- `frontend/src/jjscript/executor/permissionGuard.ts` (nuovo, puro).
- `frontend/src/jjscript/executor/__tests__/permissionGuard.test.ts` (nuovo).
- `frontend/src/jjscript/executor/executor.ts` (aggancio prima del dispatch).
- `frontend/src/jjscript/types.ts` (solo un campo opzionale su `ExecutionContext`, se la Fase 1 lo
  sceglie; Rule 11).
- `frontend/src/jjscript/services/JjScriptService.ts` (porta il profilo nel contesto, se la Fase 1 lo
  sceglie).
- `docs/discovery/discovery_2026-10-01_168_b_guard.md`, `docs/log-inbox/jodie-consumer.md`, la riga
  `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_b_*.ts`; porta **3043** soltanto.

Cinque file di codice, confermati da Juri in chat il 2026-10-01 (Rule 19). Un file fuori da questa
lista è una domanda (`Outcome: question`), non una deroga silenziosa.

Per la sonda: puoi partire, **in sola lettura**, da
`/Users/juridirocco/development/jjodel/frontend/scripts/smoke/_tmp_157_r5_verify.ts` e
`_tmp_157_158_globals.ts` (copiali nel tuo tree come `_tmp_168_b_*`). Eseguila contro il tuo codice con
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_b_<nome>.ts --port 3043 --id P-2026-10-01-2302`
(avvia il vite del tuo tree, `PROBE_URL` nell'ambiente, ferma solo quel vite; log in
`~/.jjodel-lanes/P-2026-10-01-2302/`). `npm run smoke` punta a 3000, il dev server di Juri: non è una
prova del tuo codice.

Baseline di `npm run check:docs` sul trunk (misurata 2026-10-01 a `98ebb132e`, identica con e senza i file di #168): exit 1 con **FAIL B** (4 errori `required field missing` su due entry del log attivo, `docs/claude-code-log.md:245` e `:267`) e **FAIL D** (74 entry nel log attivo, soglia 40). Non sono di questa lane e non si correggono qui: il gate è nessun FAIL nuovo e nessun errore sulle righe che scrivi tu.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling. Docs e codice mai nello stesso commit (P13).

Mai: `frontend/src/jjscript/executor/commands/**` (in particolare `instance.ts`), i file della lane A
(`frontend/src/events/registry.ts`, `frontend/src/components/environment/**`,
`frontend/src/components/Jodie/**`), `frontend/src/constants/defaultPrompts.ts`,
`frontend/src/types/jodie.ts`; nessun file della critical zone (§3.1); `git add .`, `-A`, `-u`,
`git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, scritture in
un altro tree, porte diverse da 3043, chiamate reali a un provider AI.

## RIFERIMENTI

- Issue #168 e #157 (jjodel-modeling/jjodel-frontend); i criteri sono riportati sopra.
- `frontend/src/jjscript/executor/scopeGuard.ts` (il modello da seguire: puro, prima del dispatch) e
  `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md`.
- `frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/services/JjScriptService.ts`,
  `frontend/src/jjscript/types.ts`, `frontend/src/jjscript/executor/commands/{create,set,delete,rename,instance}.ts`,
  `frontend/src/components/Jodie/ChatMessages.tsx` (`handleJjScriptExecute`),
  `frontend/src/jjscript/components/ScriptBlock.tsx`, `frontend/src/joiner/environmentConfig.ts`,
  `frontend/src/components/environment/consumerMode.ts`.
- `docs/discovery/2026-06-12_jjscript_m1_coverage.md` (comandi M1 e loro lacune).

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-01-2302 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

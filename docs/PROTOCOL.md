# PROTOCOL.md — protocollo di esecuzione per Claude Code

Posizione: `docs/PROTOCOL.md` nel repo `jjodel-frontend`.
Versione: 1.2 (2026-09-09)

Questo file contiene le clausole che prima venivano ricopiate per esteso in ogni prompt. I prompt ora le citano per numero. Se una clausola cambia, cambia qui e vale ovunque da subito.

Riga da mettere in testa a ogni prompt Claude Code:

```
Protocollo: docs/PROTOCOL.md — clausole P1..P12 applicabili (tutte salvo deroga esplicita nel prompt).
```

Le deroghe si scrivono così: `Deroga: P4 non si applica (motivo: ...)`.

---

## P1 — CLAUDE.md è la fonte di verità

Leggi `CLAUDE.md` nella root all'inizio di ogni sessione e i `CLAUDE.md` di sottocartella pertinenti ai file che tocchi. Se un prompt contraddice `CLAUDE.md`, fermati e segnala il conflitto: non eseguire e non ignorare silenziosamente.

## P2 — Scope chiuso

Tocca solo i file elencati nel prompt, più quelli strettamente necessari (un import mancante). Un file non menzionato non si modifica: se serve, chiedi prima. Zero refactoring opportunistico: non rinominare variabili, non riordinare import, non migliorare codice adiacente. Mai rinominare identificatori esistenti (classi CSS/SCSS, variabili, funzioni, componenti, props) senza richiesta esplicita: le classi CSS sono API interne e le collisioni non danno errori di compilazione, danno bug visivi in componenti scorrelati.

Prima di introdurre un nuovo identificatore, verifica con ricerca globale (`grep -r`) che non sia già in uso.

## P3 — Leggere prima di scrivere

Prima di modificare un file, leggilo intero (o la sezione rilevante). Rispetta le convenzioni locali: naming, import, struttura, stile SCSS. Non rimuovere codice apparentemente inutilizzato. Non modificare interfacce TypeScript esistenti (aggiungere proprietà opzionali va bene; cambiare o rimuovere no) senza richiesta esplicita.

## P4 — Two-phase e discovery report

Fase 1 read-only, poi hard stop, poi Fase 2 solo dopo go-ahead.

Ogni fase esplorativa, anche breve, produce un report su file. L'output di terminale o di chat non conta.

- Path: `docs/discovery/`
- Naming: `discovery_<YYYY-MM-DD>_<descrizione_snake_case>.md`, suffisso `_N` per più report dello stesso giorno sullo stesso tema
- Contenuto minimo: ipotesi che la discovery sta falsificando, obiettivo, file letti con path completi, findings con `file:riga` e citazione verbatim, dipendenze e rischi, domande aperte
- Il report chiude la Fase 1: l'hard stop non è raggiunto finché non è scritto

Il report è un insieme di ipotesi con evidenze, non un riferimento definitivo. Chi lo usa a valle rilegge i file reali.

## P5 — Critical zone

L'elenco completo dei file in critical zone e il template obbligatorio del Layer Impact Report stanno in `CLAUDE.md` §3.1 e §3.2. Questa clausola non li duplica.

I file in critical zone richiedono go-ahead esplicito nel prompt più Layer Impact Report prima di qualunque modifica. Attenzione particolare, ovunque, a: custom DOM events, LModel proxy (trova per NOME, scrive con `$attr.value`), ID temporanei di `DObject.new()`.

## P6 — Commit

Si committa a ogni passo compiuto, anche prima della verifica visiva di Alfonso. La verifica non blocca il commit: blocca il merge. Ogni filone lavora sul proprio branch.

`git add` solo con path espliciti. Mai `git add .`. Se lo stato del working tree non corrisponde a quanto dichiara il prompt, fermati e segnalalo prima di toccare qualsiasi cosa.

Commit message: tipo convenzionale (`feat:`, `fix:`, `refactor:`, `docs:`), in inglese, una riga. Il tipo è indicato nel prompt: se manca, chiedilo, non sceglierlo.

Il corpo di ogni commit porta il trailer `Model: <vendor> <name> <version>` — per esempio `Model: Z.ai GLM 5.3` o `Model: Anthropic Claude Opus 5` — che nomina il modello che ha eseguito il task. Il valore è quello che il banner di sessione riporta, non quello che dichiarano `CLAUDE.md` §0 o `.claude/settings.json`: il trailer registra l'esecutore, non l'intenzione. Il trailer è additivo: la riga `Co-Authored-By`, dove il tooling la emette, resta, perché la serie storica è chiaviata su `Co-Authored-By` e rompere quella chiave costerebbe più della duplicazione.

Per modifiche che toccano più di 5 file: elenca prima tutti i file e cosa cambia in ciascuno, poi procedi.

Nel report di chiusura mostra sempre il diff dei file toccati. L'esposizione del diff non trattiene il commit.

## P7 — Build pulita

Dopo ogni modifica, `npm run build` (o il comando indicato nel prompt) deve completare senza errori. Riporta la baseline di `npx tsc --noEmit` prima e dopo: se il numero di errori sale, fermati.

## P8 — Smoke visivo

Prima dell'hard stop, esegui lo smoke visivo e riporta l'esito nel prompt log.

Dev server: **http://localhost:3000** (la porta 3001 può servire una build stale: non usarla per la verifica). Il server è in ascolto su `[::1]` soltanto: usare `http://localhost:3000`, non `http://127.0.0.1:3000`.

Lo smoke apre gli stati noti definiti in `frontend/scripts/smoke/states.ts` e verifica:

1. nessun errore in console
2. il canvas ha larghezza superiore alla soglia attesa (intercetta il canvas collassato)
3. il numero di nodi renderizzati è maggiore di zero (intercetta la schermata vuota)
4. nessun elemento in `position: fixed` interseca la status bar
5. nessun contenitore con overflow ha figli clippati oltre la tolleranza

I gate asserzionano **relazioni fra misure, non valori assoluti**. Un gate che dice
`bottom === 90` eredita il modello che ha prodotto quel 90 e fallisce senza spiegare;
`overlay.top === toolbar.bottom` fallisce dicendo cosa non combacia.

Se uno smoke fallisce, il commit resta ma l'hard stop riporta il fallimento in cima. Non tentare di aggiustare a occhio: segnala.

Lo smoke non sostituisce la verifica di Alfonso, che riguarda proporzioni, gerarchia visiva e comportamento percepito.

## P9 — Prompt log

Al termine di ogni task, aggiungi un'entry in testa a `docs/claude-code-log.md` (newest-first per giorno, R-RAIL-45). Leggi il log a inizio sessione per il contesto sulle modifiche recenti. Oltre le 40 entry, sposta le più vecchie in `docs/claude-code-log-archive.md`.

Formato:

```
## YYYY-MM-DD — type: short description
**Prompt**: summary of received prompt
**Files touched**: list of modified files
**Outcome**: ✅ completed | ⚠️ partial | ❌ problems
**Corregge**: <name of the prompt document this task corrects> | —
**Causa**: <letter from the §21.3 taxonomy> | —
**Regressions**: yes | no | unknown
**Out-of-scope changes**: yes | no
**Layer Impact Report**: produced | not-required | skipped
**Smoke visivo**: passato | fallito (dettaglio) | non applicabile
**Notes**: (optional, max 500 characters; longer reasoning goes in the cited document)
**Prompt document name**: YYYY-MM-DD HH:mm
```

La semantica dei campi di autovalutazione, incluse le regole di compilazione di `Corregge` e `Causa` e la tassonomia dei valori ammessi, è definita in `CLAUDE.md` §21.3. Questo file non la duplica. Il blocco di formato qui sopra è verificato byte a byte contro `CLAUDE.md` §21.2 da `npm run check:docs`.

Il log non sostituisce i commit message, e il discovery report non sostituisce il log: sono tre artefatti distinti.

A corsie parallele, `docs/claude-code-log.md` si tocca solo nella §6.1 di chiusura batch, da una sessione sola a repo fermo. Ogni corsia scrive la propria entry in `docs/log-inbox/<lane>.md`; chi chiude il batch le sposta nel log verbatim e cancella l'inbox.

RC-13-bis. Il ripristino di un file tracciato si fa **solo** con `git checkout HEAD -- <path>`. Nessun backup del working tree su disco, nessun file di appoggio in `/tmp` riusato fra sessioni, nessun `git stash`: sono i tre modi in cui il lavoro di un'altra corsia e' stato perso o sovrascritto, tre incidenti della stessa classe in due batch (uno `stash` incrociato, un `log-backup.md` stale, un `cp` da `/tmp` di job che ha sovrascritto il log con una copia pre-rotazione).

## P10 — Dove vivono i documenti

Il Project Knowledge tiene lo stato corrente, il repo tiene la storia. Sei documenti nel KB, per
nome: `contesto_progetto.md`, `sessione_CORRENTE.md`, `spec_attive.md`, `HARNESS-DOCS.md`,
`template-ir-authoring`, `template-task-visivi`.

Tutto il resto si salva in `docs/`: prompt in `docs/prompts/`, memo di ratifica in
`docs/ratifiche/`, checkpoint in `docs/sessioni/`, discovery in `docs/discovery/`, materiale di
lavoro in `docs/archivio/`, allegati non testuali in `docs/archivio/artefatti/`. Il prefisso e'
`claude_` ovunque tranne che per i discovery report, che seguono il naming di P4.

Archiviare non e' ripulire: la copia nel repo e la cancellazione dal KB sono due passi distinti, e
un documento lasciato in entrambi i posti continua a competere in retrieval con la propria versione
piu' recente. La mappa completa dei tipi documentali, con formati, gate e ciclo di vita, e' in
`docs/HARNESS-DOCS.md`; la storia della bonifica in `docs/archivio/triage_kb_2026-08-15.md`.

## P11 — La sonda esegue il soggetto

Una sonda o un test **esegue il soggetto**, non il layer sotto e non il suo sorgente. Chiamare la
funzione interna che il soggetto a sua volta chiama, o asserire su una stringa letta dal file,
produce **lo stesso output di un fix che non funziona**: un verde indistinguibile dal rosso che
avrebbe dovuto esserci. La verifica passa dalla via che passa l'utente — la funzione pubblica,
l'evento, il gesto — anche quando la via interna e' piu' comoda da chiamare.

Lo **stato di modulo** si azzera nel `beforeEach`. Un timestamp, una cache o un flag a livello di
modulo sopravvive fra i test dello stesso file: la seconda asserzione legge cio' che ha scritto la
prima, e un'asserzione vuota passa senza avere mai visto il soggetto.

Sull'interfaccia la stessa regola diventa: **quando lo stile e il pixel non vanno d'accordo, la
misura e' il pixel**. Che un elemento sia raggiungibile non si deduce dai valori di `z-index`
letti nei fogli di stile, perche' un contesto di impilamento creato da un antenato qualunque li
riordina senza che nessuno se ne accorga: si misura con `elementsFromPoint` sul pixel che l'utente
colpirebbe, e l'asserzione e' su chi c'e' in cima allo stack. Causa: lo Step 4 della validazione
(2026-09-08), dove il rail delle Properties dipingeva sopra il modale e ne rendeva inerte un
bottone mentre i numeri nel foglio di stile dicevano il contrario.

Il presidio di entrambi e' il **banco delle mutazioni**: si rompe il soggetto in un punto per volta
e si verifica che il test diventi rosso. Una mutazione che resta verde non e' un test debole, e' un
test che **non esiste**, e va dichiarata nel referto — non aggiustata in silenzio, perche' la
mutazione sopravvissuta e' il risultato, non un intoppo di percorso.

Causa: tre occorrenze misurate in due batch, tutte dichiarate dalle sessioni stesse. **VIEW1**
(`docs/discovery/discovery_2026-09-02_view1_create_manager_vertice.md`) — la prima sonda chiamava
`slot.addObject` diretto, scavalcando `createInstance`: con il fix gia' in albero la misura non si
muoveva, ed era la sonda a essere cieca. **SAVE2** (entry di log del 2026-09-02) — il test del
flush leggeva il sorgente invece di eseguirlo, e restava verde con il flush rimosso; e lo stato di
modulo di `lastSaved` sopravviveva fra i test, rendendo verde un'asserzione vuota.

## P12 — Il controllo positivo deve discriminare

Un controllo positivo vale solo se **fallirebbe** quando l'operazione che deve attestare non
avviene. Un segnavia che resta identico sia che l'operazione sia avvenuta sia che no non e' un
controllo: e' decorazione che fa passare la misura sbagliata con l'aria della misura verificata.

La forma tipica dell'errore e' scegliere come sentinella qualcosa che **non si muove**: una chiave
lasciata al suo posto, un valore che il percorso in esame non tocca, un file che esiste comunque.
La forma corretta e' una sentinella che l'operazione **deve** alterare, piantata dove l'operazione
passa.

Il criterio si applica anche al momento della lettura. Dove esiste un commit differito
(`U.UpdatingTimer`, 300 ms, CLAUDE.md §9.2 deferred attribute setting), leggere prima del commit
restituisce lo stato precedente **con tutte le chiavi al posto giusto**, cioe' esattamente
l'aspetto di un esito positivo. Una misura presa troppo presto non e' rumorosa, e' plausibile.

Causa: due occorrenze misurate il 2026-09-08 nella corsia della validazione, entrambe dichiarate
dalla sessione stessa. Nello Step 1 la prima stesura della sonda dichiarava **sei fallimenti** dei
tipi nuovi, tutti spiegati poi dal commit differito: il controllo positivo su un `DViewPoint`
creato accanto dava lo stesso identico esito, e senza quel confronto sei comportamenti del
framework sarebbero finiti a referto come difetti dei tipi nuovi. Nella verifica sulle cartelle di
stato la prima stesura leggeva prima del commit, otteneva lo stato vecchio con le chiavi al posto
giusto, e dava la risposta **opposta** a quella vera.

## P13 — Concorrenza tra lane

Piu' sessioni lavorano sullo **stesso working tree** nello stesso momento. Non e' un caso
limite: e' la condizione normale di questo repo, e ogni regola qui sotto nasce da un
incidente misurato, non da una preferenza. Iscritta come **RC-13** in `docs/decisions.md`.

- **Una corsia per giro.** Un giro chiude il perimetro che il suo prompt dichiara e nient'altro.
  Il lavoro di un'altra corsia che compare in albero a meta' sessione non e' un invito ad
  assorbirlo: si constata e si lascia dov'e'.
- **Docs e codice mai nello stesso commit.** La entry di log, il referto e le ratifiche
  viaggiano separati dal diff che descrivono. Un commit misto non si puo' revertire per meta'.
- **Lo staged e il WIP altrui sono intoccabili.** `git commit` committa **l'indice intero**,
  incluso quello che un'altra sessione ha messo in stage: si passa sempre il pathspec al commit
  stesso (`git commit -- <paths>`), o si confronta `git diff --cached --name-only` con la lista
  dichiarata prima di committare. `git add` solo con path espliciti, mai `git add .` / `-A`
  (regola 17).
- **NIENTE `git stash` su albero condiviso.** Uno `stash push -- <paths>` che includa un file
  **non tracciato** fallisce senza creare nulla, e il `pop` successivo apre lo stash sbagliato:
  misurato il 2026-09-01, 7 file riversati in albero da uno stash del 2026-07-28
  (`docs/discovery/discovery_2026-09-01_irf1_annotation_subscription.md` §14). E per la cosa che
  lo stash veniva usato a dimostrare — «questi rossi sono pre-esistenti» — **lo stash non serve**:
  si legge il diff non committato dei file rossi e si cerca l'implementazione che i loro nomi
  invocano. Se un confronto prima/dopo e' davvero necessario, si ripristinano i file **nominati**
  da `git show HEAD:<path>` e si rimettono a posto da una copia, senza toccare l'indice.
- **La rotazione del log e' una corsia esclusiva.** Nessun altro giro tocca
  `docs/claude-code-log.md` mentre e' in corso, e la rotazione non porta con se' altre modifiche.
  Criterio di spostamento: verbatim, nell'ordine del file attivo (RC-12).
- **Le deroghe a una regola numerata si flaggano nel giro, non si nascondono.** Chi supera una
  soglia lo dichiara — i file elencati con cosa cambia in ciascuno, e il campo
  `Out-of-scope changes` della entry che lo ripete — e prosegue; sanare o rifiutare e' del
  reviewer, a valle (RC-11).

- **Every prompt has an ID, and every message on it carries the ID.** A prompt in
  `docs/prompts/` states in its header `Prompt-ID: P-YYYY-MM-DD-HHmm`, the date and time of its
  file name. Every message pasted into a running session about that prompt (GO, ACK, answers to a
  hard stop, corrections) opens with `[P-YYYY-MM-DD-HHmm]`. Every reply of Claude Code on it
  (report, hard stop, question, closing summary) opens with `[P-YYYY-MM-DD-HHmm · session <id>]`,
  where `<id>` is the identifier the harness shows for the session; a session that cannot see it
  writes `session unknown` and never invents one. A session that receives a message with another
  Prompt-ID, or with none, does not act on it: it replies with its own ID and the one it received,
  and stops. A session does not relay messages to another session. Measured 2026-09-17: a Phase 2
  GO for `P-2026-09-17-1024` was pasted into the session running `P-2026-09-16-2327`, and a relayed
  message carried a scope change that nobody had written.

## P14 — Worktrees and cherry-picks

Code commits on `validation-skeleton` reach other branches (today `alfonso-frontend-jjtl`) by
`git cherry-pick -x` of explicit shas, never by range. A branch can be checked out in one worktree
only, and more than one worktree exists (`git worktree list`). Measured 2026-09-14: `git worktree
add` refused because `alfonso-frontend-jjtl` was already checked out in `/Users/alfonso/jjodel-release`,
and the cherry-pick loop then started in the wrong tree. It was aborted, no damage.

- Run `git worktree list` before any cherry-pick.
- Target branch checked out in a clean tree: run the cherry-pick in that tree. If that tree is not
  the current lane's, ask Alfonso for authorization first.
- Target branch checked out in a dirty tree: hard stop. Report and wait.
- Use a temporary worktree only when the target branch is not checked out anywhere. Remove it when
  done (`git worktree remove`, then `git worktree prune`).
- Never move a ref (`git update-ref`, `git branch -f`) while a worktree has it checked out.
- Never chain a `cd` that can fail in front of a destructive loop. Assert the branch with
  `git rev-parse --abbrev-ref HEAD` in the target tree before the first pick.
- A tree without `node_modules` (such as `/Users/alfonso/jjodel-release`) can run the gates through a
  temporary symlink to `~/jjodel/frontend/node_modules`, removed afterwards. `git status` in that
  tree must be empty before and after.
- Choose the positive control of a verify entry at the time of the entry, and measure its signal
  with the same command (§5). A file that differed between the two branches in an earlier entry
  may no longer differ, and a file an earlier entry called identical may differ. Do not inherit
  either claim from the log.

## P15 — Where the rules live

`CLAUDE.md` has ONE home, `alfonso-frontend-jjtl`. That a branch carrying its own copy carries its
own rules is a fact about this repo and not a preference: measured 2026-09-16, `master` has no
`CLAUDE.md` at all, `alfonso-frontend-jjtl` and `simulation-engine` have one of 1035 lines that
diverges from this branch's, and none of the three normative commits of the last two days —
`686a13712` (§6.5), `74d0f81db` (rule 1c and the source-text sub-rule of §5), `43e598404` (the
mutation sub-rule of §5) — is an ancestor of the trunk. So whoever works on the trunk or on the
simulator today is following a different set of rules from this branch's.

- **A rule is in force where it is written, not where it was learned.** It may be authored on the
  branch that learned it, and until it is on the trunk it binds that branch alone.
- **A commit that changes `CLAUDE.md` is owed to the trunk, and its log entry says so.** The entry
  names that commit as owed, and keeps naming it until the carry is recorded. The carry runs from
  the trunk's own worktree, by the lane that holds it or by Alfonso, never from a lane that does not
  have it; §6.5 has the mechanics.
- **Check that a rule number exists on the target branch before citing it.** A prompt or a commit
  written for work on another branch that cites a rule absent there is a false citation, and its
  reader has no way to tell.
- **`master` has no `CLAUDE.md`, and that is measured, not decided.** It is an open question for
  Alfonso. Do not create one there, and do not treat `master` as inside the development flow on
  your own authority.

---

## Nota di implementazione per P8

Lo smoke **esiste** e gira con `npm run smoke` (`frontend/package.json:102`). Vive in
`frontend/scripts/smoke/`: `states.ts` elenca gli stati da aprire, `run.ts` li apre ed esegue le
asserzioni, `assertions.ts` le contiene, `calibrate.ts` ritara le soglie, `console-baseline.json`
tiene i pattern di console gia' noti. Non serve piu' nessuna deroga: i prompt riportano l'esito, e
se una slice non e' verificabile dallo smoke lo dicono con il motivo.

**Quello che lo smoke non copre, e che va dichiarato invece che dato per coperto.** I tre stati di
`states.ts` (`empty-project`, `empty-metamodel-tab`, `advanced-mode`) partono tutti da un progetto
creato ex novo da `createProject` (`states.ts:177`), che lo crea e poi ci naviga sopra: **nessuno
apre un progetto salvato in precedenza**. Lo smoke quindi non esercita mai `SaveManager.load` su uno
stato persistito, e non vede niente di cio' che riguarda migrazioni di `VersionFixer`, seed delle
view di default e normalizzazione degli stati salvati. Per quel perimetro la verifica resta manuale
finche' `states.ts` non impara ad aprire uno stato salvato. Rilevato il 2026-08-18 dalla discovery
di Fase 1 su `2.227 -> 2.228`, §3.1.

# Prompt: #168 D — un Jodie per chi non è un developer (J7)

Prompt-ID: P-2026-10-02-2216
Chat: sessione Claude Code di Juri (VS Code), 2026-10-02, orchestratore delle lane #168
Lane: full (more than 3 files)
Status: eseguito 2026-10-03 · lane 168-voice · f4e2254e9 · verifica visiva passata 2026-10-03
Limite: 90 minuti per fase

Worktree: `/Users/juridirocco/development/jjodel-168-voice`, branch `168-voice`, tagliato dal trunk
`feat/168-jodie-consumer` al commit che aggiunge questo file; `frontend/node_modules` è un symlink a
quello del tree principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree, il branch è
`168-voice`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto; altrimenti
`Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto, `Outcome: hard-stop`; Fase 2 solo dopo un
messaggio `[P-2026-10-02-2216] GO`.

## Contesto

Issue #168: nello stand-alone di #157 (`#/project?id=X&profile=Y`) Jodie è ancora l'assistente del
developer: tre modalità di console (Jjodie, JjScript, JjEL) con il selettore e Cmd+J, la scheda «This
looks like a JjScript command» con «Run» quando l'input si legge come un comando, l'help che parla di
JjScript e JjEL, il saluto «metamodeling assistant», la testata che mostra «M2 · <metamodello>», i
«Quick tip» («Press Ctrl-J to switch mode within Jjodie»), e un pulsante «Source» sotto ogni riga
d'avviso formattata. Questa lane dà al fruitore un Jodie senza strumenti da programmatore.
**Jodie non va stravolto:** tutto dietro `isConsumerMode()`
(`frontend/src/components/environment/consumerMode.ts`); in modalità developer Jodie resta identico.

Già nel trunk: lane A (Jodie segue l'elemento a fuoco nel Configurator; la riga «Now looking at: …» in
corsivo; ticket per J7 sulla testata «M2 · <metamodello>» e sul pulsante «Source» sotto gli avvisi, in
`docs/log-inbox/jodie-consumer.md`; selezione leggibile da `getConsumerSelection()` /
`describeConsumerSelection()` di `consumerJodieContext.ts`). In parallelo girano la lane C1
(`P-2026-10-02-1255`: esecutore JjScript e prompt di chat, compresa la sezione per il fruitore) e la
lane C2 (`P-2026-10-02-2215`: la proposta leggibile con «Apply» e «Discard» in `MarkdownRenderer.tsx`,
`ConsumerProposal.tsx`, `ConfiguratorTab.tsx`, `registry.ts`). Non toccare i loro file.

### Criteri della issue (J7) e decisioni

- In modalità consumer Jodie mostra solo la modalità in linguaggio naturale: niente selettore
  JjScript/JjEL e niente Cmd+J (né Ctrl+.) che cicla tra le modalità; niente comandi `/js`, `/jjel`.
- Un input che si legge come comando JjScript non produce la scheda «Run» da developer: viene trattato
  come domanda e va al modello AI.
- Saluto e testi a schermo non usano M1, M2, metaclasse, istanza, JjScript, JjEL. Il saluto nomina
  l'ambiente o il profilo. L'help in consumer descrive cosa si può chiedere, non le modalità.
- La testata non mostra «M2 · <metamodello>» in consumer: mostra ciò che il fruitore sta guardando
  (tipo ed elemento a fuoco), o niente.
- Niente «Quick tip» di Jodie nello stand-alone (decisione D4 della issue: Jodie resta, si tolgono solo
  i Quick tip).
- Le righe d'avviso in consumer («Now looking at: …») senza il pulsante «Source».
- Provider AI, decisione D1: la chiave resta dell'utente; quando manca, Jodie mostra un invito a
  configurare il provider che porta alle impostazioni dei provider, anche in consumer (i menu che ci
  portavano sono nascosti nello stand-alone).
- In modalità developer Jodie resta identico a oggi, testi compresi.

## Fase 1 — verifica (sola lettura sul codice)

1. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` (P4, P8, P9, P13, P16), `docs/decisions.md`, il
   `CLAUDE.md` di `frontend/src/styles/`, i referti di A e M0 nel trunk, i ticket di A in
   `docs/log-inbox/jodie-consumer.md`, `frontend/scripts/smoke/README-probes.md`, i file dei
   RIFERIMENTI.
2. Elenca ogni punto dell'interfaccia di Jodie che il fruitore vede, con `file:riga`, e cosa diventa in
   consumer: selettore delle modalità, scorciatoie, comandi con la barra, scheda dell'offerta, help,
   saluto e benvenuto (`ChatMessages.tsx` ~471, `JjodieWelcome.tsx`, `JjodieGreeting.tsx`), testata
   (`JodieHeader.tsx`), segnaposto dell'input (`jjodie>`), Quick tip (`NotificationWidget.tsx`),
   pulsante «Source» (`MarkdownMessage.tsx`), invito al provider.
3. Per la riga d'avviso senza «Source»: proponi il modo meno invasivo (per esempio un segno sul
   messaggio che `ChatMessages`/`MarkdownMessage` usano per non mostrare l'interruttore), senza
   cambiare il ramo developer.
4. Proponi il disegno e la lista dei file. Se supera 5 file di codice, elencali con cosa cambia in
   ciascuno: Juri la conferma al GO (Rule 19). Referto
   `docs/discovery/discovery_2026-10-02_168_d_voice.md`: apre con `## 0. Answer in brief` (al massimo
   40 righe, le domande ciascuna con la sua riga `Recommended:`). Committalo da solo:
   `docs(#168): discovery D, Jodie for the consumer (P-2026-10-02-2216)`.
5. `Outcome: hard-stop`.

## Fase 2 — implementazione (dopo `[P-2026-10-02-2216] GO`)

1. Implementa il disegno approvato nel GO.
2. Le decisioni non banali (cosa mostra la testata, il testo dell'help e del saluto) in funzioni pure
   testate dal banco `node`, con banco di mutazione nel corpo del commit; le parti solo di
   presentazione si verificano con la sonda.
3. Sonda (porta 3048, provider AI simulato con `page.route`, zero chiamate reali, clic reali): in
   consumer niente selettore, Cmd+J inerte, un input come `create class X` va al modello AI e non
   produce la scheda «Run», saluto e help senza gergo, testata senza «M2 ·», nessun Quick tip, riga
   «Now looking at» senza «Source», invito al provider senza chiave; in developer tutto identico a
   prima (stessi testi, stesso selettore, stessa scheda).
4. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme della baseline;
   `npm run build` exit 0; vitest sui test nuovi e sui test che leggono i file toccati.
5. Commit di codice: `feat(#168): Jodie speaks to the consumer without developer tools (P-2026-10-02-2216)`.
6. `Outcome: hard-stop` con una checklist visiva numerata per Juri (al massimo 7 voci, preparazione
   della fixture in una riga da incollare in console, come `_tmp_168_a_setup.js` della lane A). Dopo il
   GO visivo: un solo commit docs di chiusura con la entry in `docs/log-inbox/jodie-consumer.md` e la
   riga `Status: eseguito <data> · lane 168-voice · <sha del codice> · verifica visiva passata <data>`.
   `Outcome: done`.

## DOVE

Lista candidata, da confermare in Fase 1:

- `frontend/src/components/Jodie/Jodie.tsx`, `JodieWindow.tsx`, `JodieHeader.tsx`, `ChatInput.tsx`,
  `ChatMessages.tsx`, `MarkdownMessage.tsx`, `JjodieWelcome.tsx` / `JjodieGreeting.tsx` se il fruitore
  li vede, `frontend/src/components/NotificationWidget/NotificationWidget.tsx`.
- Un modulo puro nuovo per le decisioni di testo (per esempio
  `frontend/src/components/Jodie/consumerVoice.ts`) e il suo test in `__tests__/`.
- `frontend/src/types/jodie.ts` solo per aggiungere una proprietà opzionale a un'interfaccia esistente,
  se il disegno lo richiede (Rule 11).
- `docs/discovery/discovery_2026-10-02_168_d_voice.md`, `docs/log-inbox/jodie-consumer.md`, la riga
  `Status` di questo prompt.
- Sonde non tracciate `frontend/scripts/smoke/_tmp_168_d_*.ts`; porta **3048** soltanto.

Un file fuori da questa lista è una domanda (`Outcome: question`), non una deroga silenziosa.

Per eseguire una sonda contro il tuo codice:
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_168_d_<nome>.ts --port 3048 --id P-2026-10-02-2216`
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
file della lane C2 (`frontend/src/components/common/MarkdownRenderer.tsx`,
`frontend/src/components/Jodie/ConsumerProposal.*`, `consumerProposal.ts`,
`frontend/src/components/environment/**`, `frontend/src/events/registry.ts`), `frontend/src/model/**`,
la critical zone (§3.1); `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`,
`git clean`, `--no-verify`, push, scritture in un altro tree, porte diverse da 3048, chiamate reali a
un provider AI.

## RIFERIMENTI

- Referti nel trunk: `docs/discovery/discovery_2026-10-01_168_a_context.md`,
  `docs/discovery/discovery_2026-10-01_168_m0_measures.md`; i ticket J7 in `docs/log-inbox/jodie-consumer.md`.
- `frontend/src/components/Jodie/` (Jodie, JodieWindow, JodieHeader, ChatInput, ChatMessages,
  MarkdownMessage, JjodieWelcome, JjodieGreeting, `console/languageRegistry.ts`),
  `frontend/src/components/NotificationWidget/NotificationWidget.tsx`,
  `frontend/src/components/environment/consumerMode.ts`, `consumerJodieContext.ts` (sola lettura),
  `frontend/src/contexts/SettingsModalContext` (apertura delle impostazioni dei provider).

## Disciplina di lane

Ogni risposta apre con `[P-2026-10-02-2216 · session <id>]` (`session unknown` se non lo vedi, mai
inventato). Il messaggio finale chiude con una riga `Outcome: done | hard-stop | question | blocked`;
ogni domanda che ha una raccomandazione porta una riga `Recommended: <una riga>`. Un messaggio con un
altro Prompt-ID, o senza, non si esegue (P13).

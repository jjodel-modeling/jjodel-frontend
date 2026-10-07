# Prompt: #174, un elemento annidato ha due forme nello store (core, critical zone)

Prompt-ID: P-2026-10-07-0950
Chat: C-2026-10-07-0948
Lane: full (critical zone e core: D-layer, L-layer, sync del canvas; migrazione possibile; più di 3 file)
Depends: none
Status: da eseguire
Limite: 120 minuti per la Fase 1, 90 minuti per ogni passo della Fase 2

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Direttore di questa lane: **Juri**. Dove `docs/PROTOCOL.md` e `docs/decisions.md` dicono «Alfonso» (GO,
lista di RC-26, GO visivo), per questa lane decide Juri.

Worktree: `/Users/juridirocco/development/jjodel-174`, branch `fix/174-nesting-forms`, tagliato da
`staging` al commit che aggiunge questo file; `frontend/node_modules` è un symlink a quello del tree
principale (P14: non rimuoverlo). Prima di tutto: `pwd` è quel worktree, il branch è
`fix/174-nesting-forms`, `git log -1` è il commit che aggiunge questo file, `git status` è vuoto;
altrimenti `Outcome: blocked`.

Due fasi (P4): Fase 1 in sola lettura sul codice, referto, `Outcome: hard-stop`; Fase 2 solo dopo un
messaggio `[P-2026-10-07-0950] GO` che porta le decisioni, la lista dei file e, per i file di critical
zone, il go-ahead di RC-30.

## Lane discipline

Every reply of this session opens with `[P-2026-10-07-0950 · session <id>]` (`session unknown` if you
cannot see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it
in one line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on
(P13).

## Contesto (non rifare l'analisi, ma rimisura dove un numero conta: CLAUDE.md §5)

**Issue #174** (`gh issue view 174`): lo stesso annidamento, un elemento dentro uno slot di
composizione, produce due stati nello store.
- **Forma `set`**: `LValue.get_setValueAtPosition`, ramo di contenimento, mette `father` = slot e lascia
  il figlio in `model.objects`. Ci passano JjScript `set`, i gesti connect e add-child del canvas
  developer (`syncCreateCompositionLink`), il picker a riferimento singolo del form IR, il pannello
  Properties classico, l'output JjTL.
- **Forma `addObject`**: «Add» del Configurator e del Data Manager, e da R-JS-9 JjScript
  `create instance … in P.ref`: `father` = slot e figlio **fuori** da `model.objects` (è il costruttore
  di `DObject`, `joiner/classes.ts` circa :786-792).
- Due difetti vicini: **espulsione** (`_clearValueAtPosition` ri-padra al modello senza rimettere in
  `objects`: un figlio di forma `addObject` espulso diventa orfano) e **aggregazione**
  (`LReference.get_containment` = `composition || aggregation`, quindi un riferimento di aggregazione
  ri-padra come una composizione).
- **Da decidere** nella issue: (1) forma canonica, (a) il figlio esce sempre da `objects` e i
  consumatori leggono l'albero, oppure (b) il figlio resta sempre in `objects`; (2) se un'aggregazione
  debba ri-padrare; (3) se i progetti salvati, che contengono entrambe le forme, vogliono una
  migrazione `VersionFixer`.

**Referto della lane R** (`docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md`, misure su
`a78d614b7`, il 2026-10-02): leggilo per intero. Fatti da riverificare sul codice di oggi:
- il `set_father` della base non mantiene nessuna collezione (`getCollection` su nomi di classe dà
  `''`) e userebbe l'id sbagliato (§5.2);
- lo stato corretto della forma `set` coincide con la forma `addObject` (§5.3);
- `useM1ReferenceEdges.ts:131` e `m1EdgeSweep.ts:81` prendono le sorgenti da `rawModel.objects`: un
  figlio fuori da `objects` perde i propri archi uscenti al reconcile (CV2, §5.4), e React Flow ha
  continuato a dipingere un arco senza D-edge;
- la conformità visita `model.objects` (`ConformanceValidator.ts:35`), e quel perimetro è dichiarato
  «ratified, CRUD3 F2» nel commento a `:565`: cambiarlo è un emendamento, va detto;
- i lettori documentano già l'invariante «`objects` = sole radici»: `TreeViewContent.tsx` circa
  :2853-2858, `ConformanceValidator.ts:556`, `instanceManagerModel.ts:50`;
- diff proposto e mai applicato nel §6 del referto; Layer Impact Report nel §7.
La sonda di R (`_tmp_168_r_baseline.ts`) è andata persa con il suo worktree: si riscrive.

**Cosa è cambiato da R, tutto su `staging`** (verifica ciascun punto nel codice):
- **R-JS-9** (`9916cefce`): `create instance … in P.ref` nasce dentro lo slot (forma `addObject`).
- **R-JS-10** (`9916cefce`): `findInstanceByName` (`jjscript/executor/commands/instance.ts:130`) legge
  le radici e gli slot di contenimento, ciascuno una volta: il consumatore «ricerca per nome» della
  issue potrebbe essere già chiuso. Misuralo, non dedurlo.
- **R-JS-12** (#175, `cb02e6a2b`): a M1 `-=` e `remove` rifiutano con `WOULD_ORPHAN` un figlio nato
  nello slot e assente dalle radici, proprio per l'orfano dell'espulsione di #174; un figlio nato alla
  radice torna alla radice. R-JS-12 è provvisoria: se l'espulsione si corregge, il rifiuto può perdere
  la sua ragione.
- **#171** (`474d445ec`, merge `c9b20cd05`): `delete instance` di JjScript usa il piano di
  cancellazione del Configurator (`deleteAdapter`, `deleteDraw.descendantsOf`, che segue la sola
  composizione). Il **punto (b) di #171 passa a questa lane**: nel core, `LValue` restituisce come figli
  i valori di uno slot di contenimento, come dice il commento in `frontend/src/common/Dummy.ts` circa
  :84 (il ciclo `for (let child of lDeleted.children) child?.delete()`), così `.delete()` cancella anche
  gli elementi contenuti per ogni chiamante, canvas compreso. OK di Juri del 2026-10-04 «con le
  relazioni di contenimento». Punto aperto: il guard del profilo (`permissionGuard.containedTypes`)
  tratta come contenimento `composition || aggregation`, `descendantsOf` solo `composition`; la scelta
  sull'aggregazione decide anche quale relazione segue la cascata.

## COSA

Una Fase 1 che trasforma le tre decisioni di #174, più l'espulsione e il punto (b) di #171, in una
scelta misurata e in un piano di Fase 2 a passi. Il risultato atteso a fine lane: **una sola forma di
annidamento nello store**, consumatori che la leggono tutti allo stesso modo, nessun orfano da
espulsione, una cascata di cancellazione coerente con la relazione di contenimento scelta, e i progetti
salvati trattati come la decisione 3 stabilisce. Nessun comportamento consegnato peggiora (regola 3).

## Fase 1: discovery (sola lettura sul codice)

1. Leggi `CLAUDE.md` (regole 3, 5, 12-14, 19, 20; §3.2; §5), `docs/PROTOCOL.md` (P4, P5, P8, P9, P11,
   P12, P13, P16), `docs/decisions.md` (serie RC, R-JS-9..15, e cerca CRUD3), `frontend/src/model/CLAUDE.md`,
   `frontend/src/components/editor-v2/CLAUDE.md`, `frontend/src/redux/CLAUDE.md`, le ultime 10 entry di
   `docs/claude-code-log.md`, il referto di R e quello di #175
   (`docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md`).
2. **Rimisura sul codice di oggi** con una sonda nel browser reale (P11: la sonda passa dalla via
   dell'utente, gesti e funzioni pubbliche), per ciascun creatore della issue e per `create … in`:
   `father`, presenza in `model.objects`, presenza nei `values` dello slot. Più: espulsione nelle due
   forme (`formWrite.clearValue`, JjScript `-=`), aggregazione, spostamento slot → slot di un figlio
   nato alla radice (lo stato doppio di R A4b), Ctrl+Z di ciascun gesto (con `U.userHasInteracted`).
   Modelli di sonda da leggere, senza modificarli: `/Users/juridirocco/development/jjodel/frontend/scripts/smoke/_tmp_175_measure.ts`
   e `_tmp_171_verify.ts` nella stessa cartella (non tracciati: copiali nel tuo tree come
   `_tmp_174_*`), e `frontend/scripts/smoke/README-probes.md`.
3. **Censimento dei lettori delle radici** sotto `frontend/src`: `model.objects`, `LModel.objects`,
   `roots`, `root`, `DModel.objects`, `rawModel.objects`, `idlookup[…].objects`. Usa `command grep`
   (CLAUDE.md §5, il `grep` interattivo salta i percorsi ignorati e non filtra `--include`), con un
   controllo positivo e l'exit status. Per ogni lettore: `file:riga`, citazione, classe
   **(R)** vuole le sole radici, **(T)** vuole ogni istanza e oggi legge solo le radici, **(D)**
   visiterebbe due volte un elemento nello stato doppio; e cosa cambia sotto (a) e sotto (b).
4. **Decisione 1, (a) contro (b).** Per ciascuna: file da toccare (quanti in critical zone),
   interfacce esportate, lettori che cambiano comportamento, Ctrl+Z, progetti salvati, e cosa
   significa per l'invariante documentato e per il perimetro CRUD3 F2. Raccomandazione.
5. **Decisione 2, aggregazione.** Chi scrive `aggregation` (import Ecore, editor M2, JjScript M2), che
   cosa ne dice Ecore, ogni lettore di `containment`/`isContainment` che include l'aggregazione
   (`get_containment` :4202 e :7448, `permissionGuard.containedTypes`, `deleteDraw.descendantsOf`, gli
   altri che trovi). Raccomandazione, valida anche per la relazione che segue la cascata del punto 7.
6. **Decisione 3, progetti salvati.** Misura lo stato doppio dopo save → reload (`SaveManager.load`; lo
   smoke non apre progetti salvati, PROTOCOL «Nota di implementazione per P8»). Serve una migrazione
   sotto l'opzione raccomandata? Se sì: versione corrente, testo della migrazione, idempotenza, cosa fa
   su uno stato già coerente. Raccomandazione.
7. **Espulsione e #171 (b).** Correzione proposta per `_clearValueAtPosition` e suo effetto su
   `WOULD_ORPHAN` di R-JS-12. Per i figli di `LValue`: censimento dei chiamanti di `.delete()` su
   oggetti, slot e modelli (canvas, Configurator, Data Manager, JjScript, albero, menu contestuale,
   undo) e cosa vede ciascuno dopo; doppia cancellazione con il piano di `deleteAdapter`; cosa succede
   agli archi del canvas dei figli cancellati.
8. **Piano di Fase 2 a passi**, nell'ordine in cui vanno fatti perché nessun passo intermedio lasci un
   comportamento peggiore di oggi (R raccomandava: prima i consumatori leggono l'albero, poi il core).
   Per ogni passo: file (Regola 19: elenco con cosa cambia in ciascuno), test con banco delle mutazioni,
   sonda, gate, voci di checklist visiva. Diff in testo, **non applicato**, per i passi del core.
9. Scrivi il referto `docs/discovery/discovery_2026-10-07_174_nesting_forms.md`: apre con
   `## 0. Answer in brief` (al massimo 40 righe: risposta, raccomandazione, decisioni in attesa di
   Juri, domande ciascuna con la sua riga `Recommended:`), contiene il **Layer Impact Report** di
   CLAUDE.md §3.2 compilato, e chiude con «Decisions taken (unattended)» e «Decisions awaiting Juri»
   (le sole voci della lista di RC-26). La scelta fra (a) e (b) è una scelta fra modelli di dati: per
   RC-27 scrivi anche, in una riga, che cosa falsificherebbe la raccomandazione, perché la chat la
   faccia verificare da un secondo agente.
10. Committa il referto da solo:
    `docs(#174): Phase 1 report on the two nesting forms (P-2026-10-07-0950)`. `Outcome: hard-stop`.

## Fase 2: implementazione (dopo `[P-2026-10-07-0950] GO`)

Il GO porta le decisioni, i passi approvati, la lista dei file confermata e, se un passo tocca un file
di critical zone, il go-ahead di RC-30. Per ogni passo:
1. Baseline dei gate sul tuo tree prima del primo diff (typecheck, vitest, `check:docs`).
2. Passo che tocca la critical zone: il Layer Impact Report in `docs/lir/lir_2026-10-07_174_<passo>.md`
   prima del diff (RC-30). Nessun TRANSACTION esterno attorno a creatori (regola 12).
3. Test prima del codice dove il soggetto si importa nel banco `node`; dove non si importa
   (`LModelElement.tsx` passa dal barrel `joiner` e da monaco), niente test sul testo del sorgente
   (CLAUDE.md §5): la verifica è la sonda, e il gap si dichiara nella entry. Banco delle mutazioni sui
   test che scrivi.
4. Sonda sulla porta 3052 con numeri letti dallo store e dal DOM, comprese le voci della Fase 1 che il
   passo cambia.
5. Gate: `npx tsc --noEmit` con output completo, **14** errori, lo stesso insieme di CLAUDE.md §17;
   `npm run build` exit 0; `npm run test` completo, con i 9 file noti che falliscono all'import e
   nessun altro rosso; `npm run check:docs` verde.
6. Commit di codice per passo: `fix(#174): <passo> (P-2026-10-07-0950)`.
7. `Outcome: hard-stop` con una checklist visiva numerata per Juri (canvas developer compreso: lane di
   critical zone, il GO di Juri è obbligatorio, RC-23). Dopo il GO visivo dell'ultimo passo: un solo
   commit docs di chiusura con la entry nella nuova inbox `docs/log-inbox/core-nesting-forms.md`
   (intestazione come `docs/log-inbox/lane-hygiene.md`), i ticket che restano aperti, e la riga
   `Status: eseguito <data> · lane fix/174-nesting-forms · <sha dell'ultimo codice> · verifica visiva passata <data>`.
   `Outcome: done`.

## DOVE

Fase 1:
- `docs/discovery/discovery_2026-10-07_174_nesting_forms.md`
- sonde non tracciate `frontend/scripts/smoke/_tmp_174_*.ts`; porta **3052** soltanto.

Fase 2, candidati che il GO conferma o restringe (un file fuori dalla lista confermata è una domanda):
- `frontend/src/model/logicWrapper/LModelElement.tsx`
- `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` (critical zone)
- `frontend/src/components/editor-v2/sync/m1EdgeSweep.ts`
- `frontend/src/model/conformance/ConformanceValidator.ts`
- `frontend/src/redux/VersionFixer.tsx` (critical zone, solo se la decisione 3 la chiede)
- `frontend/src/common/Dummy.ts`
- `frontend/src/jjscript/executor/commands/instance.ts` (solo se R-JS-12 cambia)
- test accanto ai file toccati; `docs/lir/lir_2026-10-07_174_*.md`; `docs/log-inbox/core-nesting-forms.md`;
  la riga `Status` di questo prompt.

Per eseguire una sonda contro il tuo codice:
`node frontend/scripts/lane-run.mjs probe "$PWD" frontend/scripts/smoke/_tmp_174_<nome>.ts --port 3052 --id P-2026-10-07-0950`
(avvia il vite del tuo tree, `PROBE_URL` nell'ambiente, ferma solo quel vite; log in
`~/.jjodel-lanes/P-2026-10-07-0950/`). `npm run smoke` punta a 3000 e `states.ts` ha `BASE_URL` fisso su
3000: una sonda su un'altra porta usa `PROBE_URL` e non `createProject` di `states.ts`.

Commit con pathspec esplicito (`git commit -- <paths>`), trailer `Model:` (P6) e la riga
`Co-Authored-By` del tooling; il soggetto entro 72 caratteri senza il suffisso `(P-…)`. Docs e codice
mai nello stesso commit (P13).

## HARD STOP

- Fine della Fase 1: referto committato, `Outcome: hard-stop`.
- Una misura della Fase 1 che contraddice la issue o il referto di R in un punto che cambia la
  raccomandazione: si scrive nel referto, non si aggira.
- In Fase 2: un passo che peggiora un comportamento misurato in Fase 1, un gate rosso nuovo, un file
  fuori dalla lista confermata: `Outcome: question`.

## NON FARE

- In Fase 1 nessuna modifica a file tracciati sotto `frontend/`.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, rotazione o ripiegamento del log, scritture in un altro tree (il
  tree principale si legge soltanto), porte diverse da 3052, chiamate reali a un provider AI.
- Non toccare `docs/discovery/andrea.json` del tree principale (non è nostro).
- Non riscrivere il referto di R né quello di #175: si citano.

## RIFERIMENTI

- Issue #174, e i commenti di #171 (punto b) e #175.
- `docs/discovery/discovery_2026-10-02_168_r_reparent_from_root.md` (§0, §4, §5, §6, §7, §9).
- `docs/discovery/discovery_2026-10-07_175_jjscript_m1_operators.md` (R-JS-12, `WOULD_ORPHAN`).
- `docs/log-inbox/jodie-consumer.md`: i tre ticket del 2026-10-02 sul core (due forme, espulsione,
  aggregazione) e quello del 2026-10-01 su delete a cascata e link di contenimento.
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`get_containment`, `_clearValueAtPosition`,
  `get_setValueAtPosition`, `set_values`, `get_addObject`, `LModel` `objects`/`roots`, figli di `LValue`),
  `frontend/src/joiner/classes.ts` (costruttore di `DObject`, `getCollection`),
  `frontend/src/common/Dummy.ts` (`get_delete`), `frontend/src/redux/reducer/reducer.ts` (`+=`/`-=`).

# Sessione 2026-08-16 — I due viewpoint di sistema

Sessione Cowork diretta sul repo montato via bridge. Aperta da una domanda di Alfonso
(«ha ancora senso portarci dietro i viewpoint Default e Default validation?») e chiusa con il
seed del viewpoint di validazione rimosso e la sua unica regola superstite ri-ospitata nel
validatore di conformità.

## Stato a fine sessione

Branch `alfonso-frontend-jjtl`. Working tree: solo `useContentSize.ts` modificato da Alfonso,
mai toccato in questa sessione. Untracked deliberati: `.claude/settings.local.json`, `_to_delete/`.

| Commit | Cosa | Gate | Verificato |
|--------|------|------|-----------|
| `34304934e` | discovery Fase 1 sui due viewpoint | `check:docs` invariato | n/a (docs) |
| `f05f4bacb` | CHECK 12, forma lessicale del nome nel `ConformanceValidator` | tsc 14 identico, vitest 1274/0, build 0 | **gate verdi, smoke visivo NON dato** |
| `d68c4bbc8` | `MegamodelView` esclude i viewpoint di sistema per puntatore | idem sopra | **gate verdi, smoke visivo NON dato** |
| `ffe534f11` | discovery (2) sulle 23 view di default | — | n/a (docs) |
| `14bbede4d` | rimozione del seed di `Default Validation` | tsc 14 identico, vitest 1274/0, build 0 | **gate verdi, smoke visivo NON dato** |
| `2f9a45e24` | R-IRN-7 e R-IRN-8 a registro | `check:docs` invariato | n/a (docs) |

Nulla è pushato. `check:docs` resta rosso sugli **stessi 8 errori preesistenti** delle entry del
14/8, non toccati.

**Baseline misurate in questa sessione, nel container, sull'albero pulito**: typecheck 14 (Linux),
vitest 1241 passed / 0 failed con 9 suite `window is not defined` note. Dopo le modifiche: 1274
passed (1241 + 33 nuovi), stesso insieme di 9 suite fallite.

## Decisioni prese

- **R-IRN-7** (a registro): il canvas v1 non è raggiungibile dall'utente e la migrazione a v2 è
  decisa. Dichiarato da Alfonso il 16/8; finora la «decisione B del 2026-07-17» viveva solo nei
  commenti del codice e non era iscritta. Conseguenza: una view senza `ir` non ha interprete,
  quindi toccare le view di default non produce regressioni visive.
- **R-IRN-8** (a registro): `Default Validation` non si semina più; la regola lessicale del nome
  è stata prima ri-ospitata come CHECK 12, poi il seed è stato rimosso; le quattro costanti
  `Pointer_*` restano in `Defaults.ts` perché sono gli id che la migrazione dovrà cercare.
- **Severità `warning` e non `error`** per CHECK 12: non è una violazione contro il metamodello, e
  un modello altrimenti conforme non deve diventare `errors` per una regola finora dormiente.
- **CHECK 12 gira prima di CHECK 1**: la forma del nome non dipende dalla metaclasse, quindi anche
  un oggetto orfano viene avvisato. Pinnato da un test.
- **Restringimento dichiarato**: CHECK 12 copre i nomi M1, perché `validateConformance` itera
  `model.objects`. La view morta si applicava a qualunque elemento con un nome, M2 compreso.
- **Le 20 view inerti del viewpoint `Default` sono una fetta a sé**, non aperta (Alfonso, 16/8).

## Bug risolti

**`MegamodelView` escludeva i viewpoint di sistema per nome.** Root cause: `MegamodelView.tsx:143`
confrontava `vp.name` con tre varianti storiche (`'Default'`, `'Validation default'`,
`'Default Validation'`), traccia di rinomine mai riallineate. Un viewpoint utente chiamato
«Default» spariva dal megamodel senza errore. Fix: confronto su `Defaults.viewpoints` (puntatori),
in un solo punto, con la costante come sorgente di verità.

## Bug nuovi e todo

**Alta**

1. **La migrazione dei salvataggi non è scritta.** Dopo `14bbede4d`, i progetti già salvati
   conservano i 4 record inerti e, non essendo più in `Defaults.check`, il loro viewpoint diventa
   **cancellabile ed editabile** dall'utente (`view.tsx:543`). Stato intermedio accettato,
   da chiudere. Vedi «Prossimi passi».
2. **Smoke visivo mai eseguito** su tutte e tre le fette di codice. L'entry in
   `docs/claude-code-log.md` è **dovuta e non scritta**, per la convenzione che il log si compila
   dopo la conferma visiva.

**Media**

3. **I nomi M2 non sono validati da nessuno** (né dalla view morta, che era inerte, né da CHECK 12,
   che itera `model.objects`). Buco preesistente, ora esplicito.
4. **Le 20 view di default del viewpoint `Default` sono inerti** e sono l'unica cosa che si vede
   aprendo quel viewpoint. Fetta a sé, tre strade: archeologia leggibile, insieme minimo, oppure
   view IR vere.
5. **La cascata `viewScores`/`stackViews` non ha consumatori a schermo.** Superficie ampia
   (`selectors.ts`, `classes.ts`, `GraphDataElements.tsx`, `view.tsx`, `Console.tsx`). Fronte
   separato e grosso.
6. **`Console.tsx` è vivo?** È l'unico consumatore di `viewScores` fuori dal giro classico.
7. **`redux/defaults/views.ts:23` importa `vi` da `vitest`** in un file di produzione. Segnalato,
   non toccato.
8. **Rotazione del log**: 45 entry attive, soglia 20. Rinviata come nelle sessioni precedenti.

**Debito operativo**

9. `_to_delete/transfer/base_2026-08-16_vp.tar`, 81 MB, tar di trasferimento per i gate.
10. `_to_delete/git-locks-2026-08-16/`, undici `index.lock`/`HEAD.lock` a zero byte spostati lì.

## Documenti aggiornati

- `docs/discovery/discovery_2026-08-16_viewpoint_default_e_validation.md` (nuovo)
- `docs/discovery/discovery_2026-08-16_2_le_23_view_di_default.md` (nuovo)
- `docs/decisions.md` (R-IRN-7, R-IRN-8)
- `docs/claude-code-log.md` (una entry, quella della discovery; le entry di codice sono dovute)

## Prompt generati per Claude Code

Nessuno. La sessione ha lavorato direttamente sul repo montato, non ha prodotto prompt.

## Prossimi passi, in ordine

1. **Smoke visivo** su `http://localhost:3001/` con hard-refresh. Criteri: (a) oggetto rinominato
   a vuoto, o `1x`, o `a-b`, accende l'indicatore sul nodo e compare nella pill con
   `missing_name` / `invalid_name_format`; (b) nome valido non accende niente e un modello prima
   conforme resta conforme; (c) il megamodel mostra gli stessi nodi di prima; (d) un viewpoint
   utente chiamato «Default», se esiste, ora compare; (e) un progetto **nuovo** non ha più il
   viewpoint `Default Validation`; (f) un progetto **vecchio** lo ha ancora, e le sue tre view
   sono ora editabili (comportamento atteso finché non c'è la migrazione).
2. **Entry in `docs/claude-code-log.md`** per i tre commit di codice, dopo il GO.
3. **Migrazione condizionata** dei salvataggi. Zona critica: richiede go-ahead esplicito e Layer
   Impact Report prima del diff. Bozza del LIR in coda a questo documento.
4. **Riclassificazione di `Default` a layer di sistema**: perimetro da definire con una discovery
   breve sulle liste utente dei viewpoint (rail, `ProjectEditor`, `lastViewpoint.ts`).

## Info strutturali scoperte

- **`getIRIndex` scarta le view senza `ir`** (`irResolveCore.ts:117-137`): è la ragione per cui le
  23 default non entrano mai nella risoluzione di EditorV2.
- **Il fallback che gira non è `Fallback`**: `Pointer_ViewFallback` ha 4 occorrenze in tutto, tutte
  di dichiarazione o creazione. Il segnaposto reale è il ramo nativo di `ObjectNode.tsx:448`.
- **`components/editor-v2/` non contiene `stackViews`, `viewScores` né `Pointer_View`.** Controllo
  positivo sulla stessa cartella: `useJjomSync` compare in 12 file.
- **`registry.ts:39` tipizza `violationType` come `string`** e `NodeProblemOverlay.tsx:218` lo rende
  grezzo: aggiungere valori è puramente additivo, non c'è nessuno switch esaustivo da aggiornare.
- **Il gate `check:docs` gira sul device**, è puro JS. Vite, vitest e build no: `frontend/node_modules`
  porta binari darwin-arm64 e la VM del bridge è Linux aarch64.
- **Procedura gate consolidata**: `git archive HEAD frontend` sul device, `device_stage_files` nel
  container, overlay dei soli file modificati, confronto sha256 device/container, `npm install`
  (16 s), poi tsc, vitest e build. Baseline misurata sullo stesso albero, mai citata.
- **Il bridge non può fare unlink**: ogni comando git lascia un `index.lock` a zero byte che blocca
  il comando successivo. Rimedio: spostarlo in `_to_delete/`, e usare `git --no-optional-locks`
  per le letture. Ha già fatto fallire silenziosamente un commit in questa sessione.

## Layer Impact Report, bozza per la migrazione (passo 3)

Da rileggere e completare prima del diff, non è un go-ahead.

- **File di §3.2 toccati**: `redux/VersionFixer.tsx` (zona critica). Nessun altro.
- **Scrittura**: una nuova migration `2.2NN -> 2.2NN+1` che rimuove da `idlookup` i 4 record
  (`Pointer_ViewPointValidation`, `Pointer_ViewCheckName`, `Pointer_ViewOverlay`,
  `Pointer_ViewLowerbound`) **solo se identici al seed**, e ripulisce i riferimenti nelle liste
  radice `viewpoints`/`viewelements` e negli eventuali `subViews`.
- **Criterio di identità da decidere**: confronto sui campi che il seed scriveva (`jsxString`,
  `usageDeclarations`, `onDataUpdate`, `jsCondition`, `css`) oppure marker più stretto. Serve una
  misura sul corpus prima di scegliere, altrimenti si purga il lavoro di qualcuno.
- **Rischio noto**: `updateDefaultView` (`view.tsx:1861`) non rigenera più questi record, quindi
  ciò che si trova nel salvataggio è la versione storica, non quella corrente. Il confronto va
  fatto contro **tutte** le versioni storiche del seed, non contro l'ultima.
- **Nessuna scrittura** verso React Flow, D-layer a runtime, o `useJjomSync`.

## Cronologia

Alfonso chiede se i due viewpoint di sistema abbiano ancora senso. Prima analisi in chat sul repo
pubblico, che conclude (sbagliando su un punto) che entrambi i controlli del viewpoint di
validazione sono coperti dal validatore di conformità. Alfonso condivide la cartella locale e dà
mandato autonomo. La discovery Fase 1 sull'albero reale conferma il quadro ma **smentisce quel
punto**: la forma lessicale del nome non aveva sostituto. Hard stop, quattro decisioni prese da
Alfonso, tutte sulla raccomandazione. Seguono tre fette di codice con gate pieni. Alla domanda
successiva («a cosa servono le 23 view di default») una seconda discovery stabilisce che nessuno
le rende, e che il «pavimento della risoluzione» attribuito a `VP_Default` nella prima discovery
vale per il codice classico e non per il canvas: affermazione ridimensionata a registro. Alfonso
conferma che v1 non è raggiungibile, il che toglie il vincolo di sequenza che aveva imposto di
fare CHECK 12 prima della rimozione, e il seed viene rimosso nella stessa sessione.

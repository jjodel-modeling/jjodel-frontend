# PROMPT — UNQ1-C6: il modello come campo su `NodeProblem` (corsia L2, PARALLELA)

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`, cwd root del repo. Leggi `CLAUDE.md`, `docs/PROTOCOL.md` P9 (+ regola log-inbox `061453e65`), §21.3, RC-13 §6.4, e il referto **UNQ1 C5** in coda a `docs/discovery/discovery_2026-09-01_unq1_duplicate_name.md` — in particolare §C5.2 e il terzo punto di §C5.4, che è ciò che questa corsia chiude.

**Corsia parallela.** Vincoli identici e non negoziabili:

- **Commit per pathspec.** Mai `git add -A`, mai `git commit -a`: l'indice contiene staged di altre corsie (EGO1, e la corsia VER1 lavora in `api/persistance/`).
- **Non toccare `docs/claude-code-log.md`.** La tua entry va in `docs/log-inbox/unq1-c6.md`, formato P9 completo, `Causa` `(x)`, `Corregge` `—` se non correggi.
- **Nessun rewrite, nessun `--amend`, nessun `stash`.** Ripristino di file tracciati **solo** con `git checkout HEAD -- <path>`, mai da copie su disco o backup in `/tmp`.
- **Non toccare `api/persistance/`** — è la corsia VER1. Se il tuo perimetro è già modificato da altri, hard stop.

## Il debito

C5 ha risolto la revoca globale con `ownedIdsByModel`, una `Map<modelid, Set<problemId>>` **di modulo** dentro `UniquenessProblemSync.tsx`: il produttore revoca solo gli id che ha registrato per il modello che sta scandendo. Corretto, e §C5.2 motiva perché non serviva un campo condiviso: una entry `duplicate-name` su un elemento di M può averla scritta **solo** il produttore montato su M.

Quella premessa vale finché c'è **un solo** produttore per kind. §C5.4 la dichiara: se un secondo produttore scrivesse `duplicate-name` sulla stessa `Map`, la contabilità per produttore resterebbe corretta ma «di chi è questa entry» tornerebbe senza risposta **nel dato**. Il rimedio vero è il campo sul tipo.

## Cosa è chiesto

Un campo **opzionale additivo** su `NodeProblem` (`frontend/src/components/editor-v2/problems/registry.ts:61-77`) che nomini il modello di appartenenza, scritto dai produttori, e la revoca che lo usa **al posto** della contabilità di modulo — se e solo se il campo la rende ridondante *senza perdere il caso che §C5.2 tiene*: un elemento **cancellato** non risale più a nessun modello, ma la sua entry deve restare revocabile. Un campo scritto **alla registrazione** lo tiene (il valore è nel dato, non nel grafo); risalire il padre a revoca-time no. Verificalo, non darlo per scontato: è il criterio che decide se `ownedIdsByModel` cade o resta.

Due produttori scrivono oggi nel registro: `UniquenessProblemSync.tsx` (kind `duplicate-name`) e `ConformanceProblemSync.tsx` (kind `conformance`). Il campo va scritto da **entrambi** — un campo che solo un produttore popola è peggio dell'assenza, perché invita a fidarsi.

**Additività, il vincolo forte.** `NodeProblem` è letto da: `NodeProblemIndicator.tsx`, `NodeProblemOverlay.tsx`, `useNodeProblems.ts`, `formDiagnostics.ts` (+ `IRForm.tsx:334`), `conformanceToProblems.ts`, e i test `formDiagnostics.test.ts` / `UniquenessProblemSync.test.ts`. Censiscili prima di scrivere e dichiara, con riga, che nessuno enumera le chiavi o fa confronti strutturali — il precedente dell'additività riuscita è `metamodelElementName` (`:39-58`), che ha proprio questa nota. Se un lettore rompe, hard stop.

**Nome del campo.** Non chiamarlo come non è: se contiene l'id del `DModel`, `modelId`; se contiene qualcosa che per un produttore è un modello e per l'altro un metamodello, di' cosa è e nominalo su quello. La lezione di `metamodelElementName` (§ nel codice: due check ci mettono un nome di classe, quindi un nome che promette una feature sarebbe una bugia) vale qui: **il nome deve reggere il caso peggiore**, non quello tipico.

## Cosa NON è chiesto

Non aggiungere lettori (§A.1/§A.5 restano aperti: badge dell'albero, righe M1, la collisione visibile nella sola form). Non toccare il disallineamento di chiavi sul canvas (entry sull'id dell'elemento, indicatore sull'id del `DVertex`). Non toccare `LModelElement.tsx` — è F.2, chiusa in `a8260a835`.

## Il lavoro

1. **Censimento lettori** (sopra), con riga, prima di ogni edit.
2. **Campo su `registry.ts`**, opzionale, con la nota di additività nello stile di `metamodelElementName`: chi lo scrive, chi non lo vede, cosa contiene nel caso peggiore.
3. **Entrambi i produttori** lo popolano.
4. **Revoca**: se il campo rende `ownedIdsByModel` ridondante **tenendo il caso dell'elemento cancellato**, rimuovila e revoca sul campo; altrimenti **lasciala** e dichiara perché il campo da solo non basta. Entrambi gli esiti sono accettabili — quello che non è accettabile è rimuoverla perdendo il caso.
5. **Test.** `UniquenessProblemSync.test.ts` esiste (7 casi) e `reconcileDuplicateProblems` è esportata per questo. Estendilo: entry con modello proprio revocata, entry di un altro modello **no**, entry di elemento cancellato ancora revocabile, vicino di kind `conformance` intatto. Ogni caso da grafo di moduli fresco — registro e contabilità sono di modulo, un test che li erediti misura l'ordine del file. Il fixture usa collisioni per nome esplicito su forme duck-typed, e la barrel `joiner` è finta: riusa l'idioma, non reinventarlo.
6. **Sonda** `frontend/scripts/smoke/_tmp_unq1c6.ts` (`.gitignore:66`, non committarla), lo stato di C5.3: tre nested omonimi in M1, due classi omonime in M2, vivi insieme, nomi scritti con `SetFieldAction` sul campo `name` del D-layer. La misura before/after è che il campo è **presente e corretto** su ogni entry attiva di entrambi i kind, e che le sette righe della tabella di C5.3 restano tutte verdi. Attenzione all'aritmetica: una **coppia** collide come coppia — rinominare uno revoca entrambe le entry, 2 → 0; il decremento si vede solo con tre omonimi.
7. **Mutazioni**, almeno tre rosse: campo non scritto da uno dei due produttori; campo scritto con l'id sbagliato (l'elemento invece del modello); revoca che ignora il campo e torna globale.

## Gate

`tsc --noEmit` baseline **33** sull'output completo, **0** nei file toccati. `build` exit 0. `vitest` intera, 0 falliti; i 9 file `window is not defined` sono pre-esistenti, riverifica e dichiara. Nota da C5: `getRegistryState()` è caduta perché leggeva `window._jjNodeProblems` e in `node` restituiva una `Map` vuota — un test della revoca che la usasse sarebbe verde per costruzione. Non reintrodurre quel pattern.

## Referto

Censimento lettori con riga. Nome del campo e sua motivazione sul caso peggiore. Esito del punto 4 con la ragione. Before/after misurato, PASS/FAIL per corsa. Mutazioni. Gate. Aperti.

## Fuori perimetro — registrare, non toccare

VER1 è la corsia gemella: non toccare `api/persistance/`. EGO1 staged. Merito per Alfonso: §8 `get_children_idlist`, tense error text + metamodel shape, `2..*` multi-reference.

# Sessione 2026-08-18 (3): la misura entra nel ciclo, e il primo commit di codice di `2.228`

**Superficie**: Cowork, con la cartella `~/jjodel` connessa dal bridge (non persiste fra sessioni, va
richiesta) e **Chrome pilotato sul dev server** per misurare lo stato vivo. Claude Code su VS Code
per Fase 1 e slice 0.
**Branch**: `alfonso-frontend-jjtl`. **Origin a `7b5a2ef1f`**, HEAD locale a `326b0729e`, **tre commit
avanti** e zero indietro, working tree pulito.
**Questo checkpoint sostituisce** `sessione_CORRENTE.md` (versione 2026-08-18 (2)).

---

## Stato a fine sessione

Dieci commit dopo `eb14a614c`, di cui **uno solo di codice**.

| Commit | Autore | Contenuto |
|---|---|---|
| `5896f1d3b` | architetto | checkpoint sessione (2) in `docs/sessioni/` e discovery sul corpus persistito |
| `1bcb5a245` | architetto | R-IRN-11..13, prompt di Fase 1 |
| `e00c0c942` | Claude Code | discovery report di Fase 1, 927 righe |
| `fac54df3c` | architetto | P8 non dichiara piu' lo smoke inesistente |
| `faa9723de` | architetto | R-IRN-14..19, prompt di Fase 2 |
| `6ea762783` | Claude Code | Layer Impact Report per le tre modifiche a `VersionFixer` |
| `7b5a2ef1f` | architetto | R-IRN-20..22, ripiegate nel prompt di Fase 2 |
| `b76d3c8cb` | Claude Code | **slice 0**: la revisione utente non e' piu' sovrascritta |
| `f7280ca37` | architetto | il prompt impone di rileggere `decisions.md` a ogni slice |
| `326b0729e` | architetto | R-IRN-17 nomina le tre versioni che condividono un nome di campo |

Gate al momento della slice 0: typecheck 33 (baseline macOS), vitest 1315 passati con le nove suite
rosse note, build exit 0, smoke 3 stati e 10 assert, `check:docs` 3/3 con 0 warning, `check:agents`
pass.

**La verifica visiva della slice 0 non e' stata eseguita.** Criterio corretto, che il messaggio
dell'esecutore riportava sbagliato: non «da `2.3` a `2.4`», ma **la revisione non deve mai scendere**.
Qualunque valore si legge prima di aprire, dopo apri-e-salva deve essere quello piu' un decimo.
`State Machine v1` sta a `2.5`, quindi deve andare a `2.6`. Aprire il progetto puo' far scattare
`useLayoutAutosave`, quindi «apri e salva» e «apri» rischiano di essere lo stesso test: leggere il
`Rev` **prima** di aprire.

---

## Decisioni prese

Dodici ratifiche, R-IRN-11..22, tutte in `docs/decisions.md`.

**Sul dato.** R-IRN-11: la forma canonica del viewpoint vuoto e' `null`, non stringa vuota (falsy,
passa in silenzio dentro gli `||` di fallback) e non `undefined` (non rappresentabile in JSON).
R-IRN-18: `null` da **entrambi** i lati del proxy, il getter L espone `LViewPoint | null`, e
`activateViewpoint` entra nel perimetro perche' oggi non scrive quando il valore e' vuoto, quindi
`null` non e' raggiungibile da UI. R-IRN-21: si allinea anche la root `state.viewpoint`, perche' il
costo e' misurato e piccolo (quattro lettori, nessuno che confronti con `''`).

**Sul seed.** R-IRN-14: `Defaults.views` e `Defaults.viewpoints` sono registri di **identita'**, non
manifesti del seed, e restano pieni; svuotarli romperebbe `isSystemViewpoint` e quindi R-IRN-9 e
R-IRN-10 **in silenzio**. R-IRN-15: il ritiro sono tre interventi (init, loop di coda **rimosso**,
`updateDefaultView` reso inerte), e il loop di coda va rimosso anche senza purga. R-IRN-16: la purga
usa `clonedCounter`, non tocca il viewpoint `Default`, lascia stare i 122 puntatori di
`DGraphElement.view`.

**Sulla sequenza.** R-IRN-13: la bonifica dei sessanta progetti di R-IRN-2 e' chiusa **per attrito**,
quei progetti non esistono piu'. R-IRN-19: la purga esce da `2.228` e diventa `2.229`, emendamento a
R-IRN-12; il principio di R-IRN-12 (una purga non puo' precedere la neutralizzazione del loop di
coda) resta valido, cambia la sequenza. R-IRN-12: i due fronti restano in una passata, ma non per
economia: perche' una purga da sola sarebbe un no-op.

**Sul contorno.** R-IRN-17: `VersionFixer.tsx:134` si rimuove, piu' la terminologia delle tre
versioni. R-IRN-20: il test vitest dell'adapter entra nel perimetro, con corpo duplicato e commento
che lo dichiara, perche' e' l'unica copertura automatica possibile. R-IRN-22: il bottone di
`NestedView.tsx:396` si chiude **dentro** `2.228`, commit 2c, con lo stesso predicato dell'uscita
anticipata della funzione.

**Decisione di perimetro nel prompt, non a registro**: il seed continua a creare il viewpoint
`Default`, **vuoto**, e smette solo di creare le ventuno view. Togliere anche il contenitore farebbe
diventare `undefined` il `Defaults.viewpoints[0]` di `view.tsx:339` e non sbloccherebbe mai la
guardia di `redux/reducer/reducer.ts:1104`. Tenendolo, `Defaults.ts` e `reducer.ts` non si toccano.

---

## Bug risolti

**La revisione del progetto era congelata, non spostata di un gradino** (R-IRN-17, `b76d3c8cb`).
Root cause: `VersionFixer.tsx:134` scriveva `s.version.n`, la versione di schema, sul campo `version`
del `DProject`, che `projects.ts:101-104` tratta come revisione utente. `Math.round(2.27)` e
`Math.round(2.28)` valgono entrambi 2, quindi ogni apertura riscriveva `2.227` e ogni salvataggio
riportava a `v2.3`, **per sempre e su ogni progetto**. Fix: tre righe rimosse, nessun import toccato.
Verificato prima del go-ahead che la riga non fosse load-bearing per il sentinella `-1` di
`classes.ts:1232`: a risolverlo e' `projects.ts:229`. **La rimozione sblocca il contatore, non
ricostruisce la storia**: i numeri persi non tornano.

---

## Bug nuovi e todo

**Alta**

1. **Nessun gate copre i due fronti di `2.228`, e lo smoke non apre mai un salvataggio.** I tre stati
   di `frontend/scripts/smoke/states.ts` partono da un progetto creato ex novo da `createProject`
   (`states.ts:177`), quindi lo smoke non esercita mai `SaveManager.load` su uno stato persistito.
   Finche' `states.ts` non impara ad aprire uno stato salvato, migrazioni e seed restano fuori
   copertura. Registrato in P8.
2. **La verifica visiva della slice 0 e' da fare**, col criterio di sopra.

**Media**

3. **Il nome del campo `version` collide.** R-IRN-17 ferma l'assegnazione, non la rende impossibile:
   `DState.version.n` e `DProject.version` portano lo stesso nome su oggetti diversi e
   `getNextVersionNumber` accetta qualunque numero. Rinominare o dare un tipo branded e' candidato per
   `2.229` o oltre, fuori perimetro in `2.228` dove un rename sarebbe fuori scope.
4. **`Defaults.freshViewsMap` / `storeFreshViews` sono codice morto** con un commento che dichiara il
   contrario («This is used by updateDefaultView»): `storeFreshViews` non e' mai chiamata, le mappe
   sono sempre vuote, `getFreshView` restituisce sempre `undefined`. Non rimuovere dentro `2.228`
   (Rule 9).
5. **`projects.ts:372` (`Online.save`)** e' un secondo sito che potrebbe scrivere la versione di
   schema sulla revisione. Guardato da `!project.version`, morto oggi e morto anche dopo. Censito,
   non toccato.
6. Ereditati e invariati: condizione di riapertura del pannello di simulazione ancora da scrivere;
   custom instructions del progetto con `localhost:3001` e «oltre le 20 entry»; prompt J1 da
   rileggere; backlog del registro serie D; drag and drop `.jjodel`; arrotondamento al resize;
   palette entity divergenti; taglio al box; `CLAUDE.md` §7.2 con quattro `var(--accent)`;
   `console-baseline.json`.

**Di processo**

7. **L'esecutore deriva verso le proprie proposte.** Chiudendo la slice 0, Claude Code ha riassunto
   «le tue risposte gia' acquisite» ribaltando due ratifiche su tre (R-IRN-21 e R-IRN-22), perche' ha
   ricordato le opzioni che **aveva proposto lui** invece delle risposte ricevute. La deriva non ha
   fatto danno solo perche' entrambe le decisioni riguardano la slice 2, che non era ancora partita.
   Mitigazione: `f7280ca37` mette in testa al prompt il vincolo di rileggere `docs/decisions.md`
   all'inizio di ogni slice. **L'antidoto e' il file, non l'attenzione.**

---

## Documenti aggiornati

- `docs/decisions.md`: R-IRN-11..22, piu' l'emendamento a R-IRN-17 con la terminologia delle tre
  versioni, piu' la correzione di path `reducer.ts` in `redux/reducer/reducer.ts` (Rule 15).
- `docs/PROTOCOL.md`: P8 riscritta.
- `docs/discovery/discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md`: nuovo, con la
  sezione 7 aggiunta dopo la misura in pagina.
- `docs/discovery/discovery_2026-08-18_2228_seed_e_activeviewpoint.md`: nuovo, Claude Code, 927 righe.
- `docs/discovery/discovery_2026-08-18_4_lir_versionfixer_2228.md`: nuovo, Claude Code.
- `docs/sessioni/claude_sessione_2026-08-18_2.md` e `_3.md`.
- Project Knowledge: `contesto_progetto.md` riconsolidato tre volte, `sessione_CORRENTE.md`
  sostituito da questo file.

## Prompt generati per Claude Code

| Prompt | Esito |
|---|---|
| `claude_2026-08-18_1617_prompt_2228_fase1_discovery.md` | ✅ eseguito, hard stop rispettato, report di 927 righe con otto domande |
| `claude_2026-08-18_1656_prompt_2228_fase2.md` | ⚠️ in corso: LIR e slice 0 fatti, slice 1 e 2 da eseguire |

## Prompt pendenti

- `claude_2026-08-14_1530_prompt_J1_walker_jjel_modulo_puro.md`: sbloccato, **da riscrivere o
  rileggere** contro R-J2 emendata e R-J7 prima di eseguirlo. Invariato dalla sessione precedente.

---

## Prossimi passi

1. **Push**: tre commit avanti su origin.
2. **Verifica visiva della slice 0**, col criterio «la revisione non scende».
3. **Slice 1**: ritiro effettivo del seed. Due condizioni prima di partire: la verifica di sopra, e
   che l'esecutore confermi di aver riletto R-IRN-11..22 **dal file**.
4. **Slice 2**, in tre commit: 2a `activateViewpoint` piu' root allineata, 2b tipo, siti, adapter e
   test, 2c il bottone.
5. **`2.229`**: purga dei record, decisione sui 122 puntatori, e le due candidate rimandate
   (estrazione dell'adapter in modulo puro importabile, rename del campo `version`).
6. Ereditati: condizione di riapertura R-SIM; discovery Options; promozione del contratto della
   taglia ad addendum della v1.2; backlog del registro serie D.

---

## Info strutturali scoperte

- **Il corpus reale e' `localStorage['projects']`**, misurato in pagina: **due progetti**, uno con
  stato. Gli 80 del censimento del 4 agosto non esistono piu'. `frontend/src/examples/` e' codice
  morto (zero importatori, riverificato), e tre cifre di R-IRN-9 venivano da li'.
- **L'architetto puo' misurare lo stato vivo con Chrome.** L'app espone tutto su `window` (`store`,
  `U`, `Selectors`, `Defaults`, `VersionFixer`, classi D e L). La decompressione va fatta con una
  copia **sincrona** di `lz-string` iniettata in pagina: 58 KB in **19 ms**, contro i 45 secondi
  abbondanti di `async-lz-string`, che fa `setTimeout(0)` per simbolo. Aprire un progetto
  nell'editor puo' far scattare `useLayoutAutosave`, quindi non e' di sola lettura.
- **`clonedCounter` sta anche a livello di `idlookup`** (misurato: 178, number), non solo dentro
  `subViews`: ogni ciclo su `Object.keys(idlookup)` deve avere la guardia `typeof e !== 'object'`.
- **`DGraphElement.view`** (`model/dataStructure/GraphDataElements.tsx:100`) e'
  `Pointer<DViewElement, 1, 1>` **obbligatorio** ed e' la sede dominante dei puntatori alle view: 122
  su 156. Letto **solo dal renderer classico**: `get_view` ha 18 chiamate in `GraphDataElements.tsx`,
  5 in `classes.ts`, 3 in `view/viewElement/view.tsx`, 1 in `viewSubtree.ts` e **zero in
  `components/editor-v2`**; le due fuori dal layer classico sono commenti.
- **`updateDefaultView` ha due chiamanti**, `VersionFixer.tsx:144` e `NestedView.tsx:399`.
- **`getAppliedViewsNew` non ha chiamanti vivi**, quindi il gradino `VP_Default` di
  `selectors.ts:557` non gira a runtime. `VP_Default` e `VP_Decorative` valgono lo stesso numero.
- **I lettori della root `state.viewpoint` sono quattro** (`EditorSwitch.tsx:55`, `Toolbar.tsx:202`,
  `irResolveCore.ts:117` e `:139`) e nessuno confronta con la stringa vuota.
- **Dal bridge si committa ma non si pusha**: la VM non ha rete (403 su CONNECT verso github). Per
  verificare origin si usa `git ls-remote` dal container cloud. L'identita' git va passata per
  comando con `-c`. **`git commit -- <paths>` non aggiunge i file nuovi**: serve `git add` prima. I
  lock da spostare non sono solo `index.lock`: un commit lascia anche `next-index-<pid>.lock` e
  `objects/maintenance.lock`, quindi lo spostamento va fatto su
  `find .git -maxdepth 3 -name '*.lock'`.
- **`check:docs` e `check:agents` girano dalla VM del bridge** con node 22 nudo, da `frontend/`, senza
  `node_modules`. Verificati verdi.

---

## Cronologia

Apertura su «ripartiamo da dove abbiamo lasciato». Il fronte scelto e' la discovery sul corpus
persistito, prerequisito dichiarato di `activeViewpoint` a 0..1. La discovery di architettura trova
nove cose, di cui tre cambiano il piano: la migrazione e' pigra e per progetto quindi la bonifica dei
sessanta non e' una migration; il rubinetto del seed non e' `Defaults.views` ma il loop di coda di
`VersionFixer.update`; il seed crea ventuno view e il registro ne elenca venti.

La domanda «chi misura il corpus» produce la svolta della giornata. Il corpus vive nel browser, non
nel repo, e Alfonso chiede perche' non lo faccia io con Chrome. Fatto: due progetti, non ottanta, e
tre cifre di R-IRN-9 che venivano da codice morto. La bonifica dei sessanta cade per attrito e il
fronte del seed si sblocca.

Fase 1 su Claude Code, 927 righe, otto domande. Il report corregge il mio in sei punti e trova la
cosa che nessuna ratifica nominava: `updateDefaultView` e' il punto di rottura piu' vicino, e non
grida. Sulle otto domande le posizioni sono prese una per una; sulla slice 3 la delega e' esplicita e
la risposta e' scorporarla in `2.229`, perche' compra igiene e non funzione.

LIR e slice 0. Tre righe rimosse, gate a baseline. Poi la deriva: l'esecutore riassume «le tue
risposte» ribaltandone due su tre, avendo ricordato le proprie proposte. Correzione, e vincolo scritto
nel prompt perche' la prossima volta non dipenda dall'attenzione di nessuno.

Chiusura sulla domanda di Alfonso che vale piu' di una correzione: `2.227` e `2.4` sono cose diverse.
Sono tre, non due, e due condividono il nome del campo. Da li' la terminologia a registro.

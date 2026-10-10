# log-inbox — lane «core-nesting-forms» (#174)

Entries written by the #174 lane (one nesting form in the core: every instance listed by its model, the
eviction without orphans, the delete cascade of #171 (b), migration `2.229 -> 2.230`) on branch
`fix/174-nesting-forms`, worktree `jjodel-174`. Whoever closes the batch moves them into
`docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The active log is
not touched by this lane.

---

## 2026-10-10 — fix(#174): una sola forma di annidamento, espulsione senza orfani, cascata (b) di #171, migrazione 2.230, vertici fantasma
**Prompt**: `claude_2026-10-07_0950_prompt_174_nesting_forms.md`, Fase 1 (referto) e Fase 2 in quattro passi sul GO di Juri (R-NEST-1..6, chat `C-2026-10-07-0948`), poi un rework dopo la verifica visiva fallita (R-NEST-7, R-NEST-8): un elemento cancellato lascia i grafi, e ogni caricamento toglie gli elementi grafici che non rappresentano nulla.
**Files touched**: referto `5bdb45e89`, addendum `57522986b` e `4e6c32675`: `docs/discovery/discovery_2026-10-07_174_nesting_forms.md`. Passo 1 `b9291259f`: `model/logicWrapper/LModelElement.tsx`, `model/conformance/ConformanceValidator.ts`. Passo 2 `5995167ba`: `LModelElement.tsx`, `services/export/XMIService.ts`. Passo 3 `0aff0d6df`: `LModelElement.tsx`, `common/Dummy.ts`, `editor-v2/hooks/deleteDraw.ts`, `hooks/__tests__/deleteDraw.test.ts`, `model/__tests__/unq1AutoNameShadow.test.ts`. LIR `f0ce63451`: `docs/lir/lir_2026-10-07_174_migration.md`. Passo 4 `352758aa2`: `redux/VersionFixer.tsx`, `redux/__tests__/versionfixer_2230_migration.test.ts` (nuovo), `redux/__tests__/versionfixer_2229_migration.test.ts`. Rework: `bff8ce497` `common/Dummy.ts`; LIR `9cbd94af9` `docs/lir/lir_2026-10-10_174_load_purge.md`; `948ea2884` `redux/VersionFixer.tsx`, `redux/__tests__/versionfixer_load_purge.test.ts` (nuovo). Docs: questa inbox, la riga Status del prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: (d)
**Regressions**: yes — la cascata del passo 3 lasciava dipinti sul canvas i vertici dei figli cancellati (voci 6 e 11 della verifica visiva del 2026-10-08); corretta dal rework, sonda dei fantasmi a 0 su M1, M2, M3.
**Out-of-scope changes**: no — 11 file di codice e test su sei commit, oltre i cinque della regola 19: i sette del GO più `XMIService.ts`, `unq1AutoNameShadow.test.ts`, `versionfixer_2229_migration.test.ts` e `versionfixer_load_purge.test.ts`, ciascuno entrato nella lista per risposta di Juri prima di essere toccato. Non toccati: `useM1ReferenceEdges.ts`, `m1EdgeSweep.ts`, `instance.ts`, `reducer.ts`, `U.tsx`.
**Layer Impact Report**: produced (referto §11; `docs/lir/lir_2026-10-07_174_migration.md` `f0ce63451` e `docs/lir/lir_2026-10-10_174_load_purge.md` `9cbd94af9`, ciascuno prima del suo diff)
**Smoke visivo**: passato il 2026-10-10 — GO di Juri dopo la sua esecuzione della checklist nel proprio browser sul vite della lane (:3052); la chat `C-2026-10-07-0948` ha misurato con gesti reali su `948ea2884` (clic sul nodo, Delete dopo 1200 ms, Cmd+Z) le voci 6 e 11 e il `delete instance S2` di JjScript: 0 vertici fantasma, 0 nodi dipinti, una Cmd+Z ripristina S3 e P1 con i loro nodi, la cancellazione ripetuta dopo l'undo funziona, 0 errori di pagina, nessun padre pendente; voci 3, 4, 5, 9 e 11 lette dagli output di Juri l'8 ottobre. La prima verifica, il 2026-10-08, era fallita sulle voci 6 e 11 (nodi degli elementi cancellati ancora dipinti), seguita dal rework R-NEST-7 e R-NEST-8; la voce 5 della prima checklist era sbagliata (nessuna «x» per i figli di composizione nel Data Manager) ed è stata corretta. Sonde sul :3052: `_tmp_174_ghost.ts` 15/15, `_tmp_174_p2.ts` 33/33, `_tmp_174_xmi.ts`, `_tmp_174_migc.ts`, `_tmp_174_clv.ts` verdi, zero errori di pagina.
**Notes**: Il rework stacca vertice e archi da `subElements` invece di cancellarne i record: cancellarli cambia le liste radice `vertexs`/`edges`, che il reducer fonde nella voce di cronologia precedente perdendone i record, e la Ctrl+Z non ripristina nulla (addendum A.7). I record staccati li toglie la pulizia a ogni caricamento. Gap: cascata e stacco non girano nel banco node, la verifica è la sonda. Banchi: deleteDraw 4/4, UNQ1 2/2, migrazione 7/8 (un mutante equivalente, dichiarato), pulizia 16/16.
**Prompt document name**: 2026-10-07 09:50

**Ticket** (low, nessuna voce propria): `api/data.ts:612-616` (`EcoreParser.parseDObject`, import M1 JSON/Ecore) crea i figli annidati con il modello ancora pendente, quindi `DObject.listInModel` li salta e restano fuori da `objects` fino al prossimo caricamento (la migrazione li elenca); vitalità del percorso non misurata. `LReference.containment` (`composition || aggregation`, `LModelElement.tsx:4202`) resta la parola di circa 30 lettori di presentazione mentre la cascata segue la proprietà (R-NEST-2): una parola, due significati. I padri pendenti lasciati dalle cancellazioni di prima di #174 restano nei progetti salvati (la migrazione non li tocca). In una sequenza della sonda un figlio «Add» manca delle voci `pointedBy` di `values` e `instances` scritte dal costruttore (A7, precede #174). `syncChildToFlow` ha creato il vertice ma non l'arco di composizione nella prima sonda della Fase 1 (non indagato). La pulizia al caricamento lascia, dichiarati nel LIR: i record `DVoidVertex`, `DGraphVertex`, `DEdgePoint` e `DGraphElement` che nessun contenitore elenca o con un modello morto sotto un vertice vivo (uno in `statechartplus.ts`), e gli id già morti nelle liste radice (`edges` di `statechartplus.ts`: 83 id per 44 record). Commenti diventati falsi con R-NEST-1/5/7, non toccati (regola 8): `TreeViewContent.tsx:2871`, `instanceManagerModel.ts:50`, `createAdapter.ts:376-378` e `:545`, `irContainment.ts:78-83` e `:212-214`, `IRNodeContent.tsx:412`, `consumerProposalModel.ts:26` e `:63`, `outlineDraw.ts:19`, `LModelElement.tsx:7384`, `canvasToJjom.ts:463-470` («every DVertex across graphs (nodes)»), l'intestazione CHECK 6 di `ConformanceValidator.test.ts`, il titolo del describe «C1 non e' stata presa» di `unq1AutoNameShadow.test.ts` e quello «2.229 is the highest version» di `versionfixer_2229_migration.test.ts`.

## 2026-10-10 — ticket: la fusione della cronologia nel reducer perde i record di ciò che fonde
**Ticket**: `reducer.ts:1216` fonde nella voce di cronologia precedente ogni cambio di stato che tocca una lista radice del grafo (`vertexs`, `edges`, `graphs`, …), e `:1284` ogni cambio che arriva entro 450 ms dalla voce precedente. La fusione è `U.objectMergeInPlace(pastDelta, delta)` (`:1256`), superficiale e senza sovrascrittura (`U.tsx:903`, `out[key] ?? (out[key] = o[key])`): poiché entrambe le delta hanno la chiave `idlookup`, quella della delta fusa si perde per intero, e con lei i record che una Ctrl+Z dovrebbe ripristinare. Misurato (addendum A.7 del referto di #174): cancellare un record di vertice dentro la cancellazione di un elemento fonde tutto nella voce di selezione del clic, e la Ctrl+Z non ripristina nulla, con errore di pagina in `reducer.ts:1115`; un Delete premuto entro 450 ms dal clic fa lo stesso anche senza vertici. Spiega due ticket di questa inbox: la Ctrl+Z dopo il connect del canvas e l'errore di pagina sull'annullamento di un riferimento M2. Finché resta così, R-NEST-7 stacca i vertici invece di cancellarli. Va in una lane sua: tocca ogni voce di cronologia fusa.
**Priority**: high
**Found in**: P-2026-10-07-0950
**Detail**: docs/discovery/discovery_2026-10-07_174_nesting_forms.md

## 2026-10-08 — ticket: lane-run status riporta l'Outcome di una run precedente quando la run ripresa muore sul limite d'uso
**Ticket**: Dopo un `lane-run resume`, se la nuova run della sessione si interrompe sul limite d'uso dell'account («You've hit your session limit») senza scrivere un `Outcome`, `lane-run status <Prompt-ID>` riporta l'`Outcome` dell'ultima run che ne aveva scritto uno (qui `question` della domanda precedente) invece di uno stato che dica che la run è morta. La chat ha dovuto ricostruire lo stato dal worktree. Lo status dovrebbe leggere l'esito della run più recente e dire `blocked`/`unparsed` quando quella run non ha una riga `Outcome`.
**Priority**: medium
**Found in**: P-2026-10-07-0950

## 2026-10-08 — ticket: una Ctrl+Z dopo il connect del canvas lascia il figlio padrato da uno slot che non lo elenca
**Ticket**: Misurato in Fase 1 (referto §4.3, U4): `syncCreateCompositionLink(S4, u4)` non aggiunge una voce alla cronologia (1 → 1), e una Ctrl+Z dopo riporta 1 → 0 lasciando `u4` con `father` = `S4.pathway` e lo slot che non lo elenca più; lo stato si salva così. Causa: la fusione della cronologia nel reducer (ticket del 2026-10-10 in questa inbox): la creazione di un `DVoidEdge` cambia la lista radice `edges`. Prima di #174, indipendente dalla lane.
**Priority**: medium
**Found in**: P-2026-10-07-0950
**Detail**: docs/discovery/discovery_2026-10-07_174_nesting_forms.md

## 2026-10-08 — ticket: errore di pagina in reducer.ts:1115 quando una Ctrl+Z annulla la cancellazione di un riferimento M2
**Ticket**: In due sonde su tre (passo 1) una Ctrl+Z che ha annullato `syncDeleteReferenceById` (cancellazione di un riferimento M2 con slot M1) ha dato «Cannot read properties of undefined (reading 'includes')» in `unsafereducer`, ramo dell'inizializzazione di `defaultViewPointsMap` (`reducer.ts:1110-1117`), su una voce di `idlookup` senza `className` (il delta portava una voce con il solo `pointedBy`). Causa: la fusione della cronologia nel reducer (ticket del 2026-10-10 in questa inbox). Non legato al codice della lane; visto solo via automazione (RC-8).
**Priority**: medium
**Found in**: P-2026-10-07-0950

## 2026-10-08 — ticket: «New … & link» su una composizione lascia una radice che lo slot elenca
**Ticket**: `formWrite.appendValue` (Data Manager «New … & link», link del Configurator) su un riferimento di composizione aggiunge il puntatore senza ri-padrare: il bersaglio resta radice (`father` = modello) ma lo slot lo elenca come contenuto, e la cascata (piano e core) lo cancella con il contenitore (referto A8, D2). Andrebbe instradato da `setValueAtPosition` quando il riferimento è una composizione.
**Priority**: low
**Found in**: P-2026-10-07-0950
**Detail**: docs/discovery/discovery_2026-10-07_174_nesting_forms.md

# Sessione 2026-09-03 — Ricostruzione dello stato dal repo (28/8 → 2/9)

Branch `alfonso-frontend-jjtl`. Chat Cowork con bridge su `~/jjodel`. Questa sessione non ha
prodotto codice: ha ricostruito dal repo i sei giorni che il Project Knowledge non copriva
(l'ultimo checkpoint era `sessione_2026-08-28` pomeriggio, HEAD `758aded1b`). Fonti: `git log`,
`docs/decisions.md` 1940..2826, `docs/claude-code-log.md`, `docs/claude-code-log-archive.md`
(155 heading nell'intervallo), `docs/log-inbox/`, i due bundle in `docs/design/`, le quattro
sessioni del 28/8, i referti del 29/8 e del 2/9, `docs/PROTOCOL.md`. Dove un fatto è dedotto
dal log e non dichiarato a voce, è scritto.

## Stato a fine sessione

**HEAD `9a1090a82`** (2026-09-02 17:02, «docs(log-inbox): le tre entry di DOC2»), allineato a
origin, working tree pulito e **indice vuoto**. (Rettifica del 3/9 pomeriggio: la prima stesura
riportava un revert staged della corsia EGO1, -295 righe, citato dalla entry di chiusura VER1/C6
del 2/9; il gate di questa stessa sessione aveva già misurato `git status --porcelain` vuoto, e
la §6.1 del 3/9 lo ha confermato. Il file
`docs/discovery/discovery_2026-09-01_ego1_centraggio_respiro.md` è intatto a HEAD, 192 righe,
ultimo tocco `76632dc76`: nulla è andato perso; chi ha svuotato l'indice fra il 2/9 sera e il 3/9
mattina non risulta dal reflog di HEAD, perché un unstage non lo muove.) **332 commit dal 28/8**: 25 il 28, 26 il
29, 111 il 30, 52 il 31, 76 l'1/9, 42 il 2/9. Diff `758aded1b..HEAD`: 416 file, +81619 / -5662.

Il lavoro è arrivato per due canali distinti, e il Project Knowledge non ne ha visto nessuno:

1. **Claude Design**, due bundle in `docs/design/` con artboard `.dc.html` (prototipi, non
   codice), README di handoff ad alta fedeltà e prompt derivati:
   `design_handoff_instance_node/` (Turni 2, 3, 4, 5, 7 del proposal; poi `CRUD Manager
   Simulation.dc.html`, `form-engine-contract.md`, Turni 10b/10c/13 arrivati con `e70265529`
   il 30/8) e `design_handoff_jjodel_form_views/` (artboard 1a..7a, `form-autolayout-spec.md`).
2. **Corsie Claude Code parallele sullo stesso tree**, con sigle (10b..10k, FL1..FL10, S1..S5,
   UNQ1, CRUD2/3, SAVE1/2, DIRTY1, VER1/2, BOOT1, VIEW1, DOC2, ENG1/2, NAV1/2, STYLE1/2, DS1/DS3,
   TXT1, AUTO1, IRF1, EGO1, RSTR6/7, 13a). I prompt dopo il 29/8 non stanno in `docs/prompts/`:
   la traccia è nei discovery report (`docs/discovery/discovery_2026-08-3*` e `_09-0*`) e nel
   log. Dedotto dall'assenza dei file, non dichiarato.

### Fronti a codice, in ordine di livello

**Livello 3, Row view library** (28/8 sera, `f24538ba6`): nove renderer in `valueRenderer.ts`
(da 5 a 12 kind più `traceLadder`), `RowValue.tsx` con `variant: 'node' | 'row'`,
`RendererInspector.tsx` (ladder a quattro gradini, Alt+click o `bi-sliders`), annotazioni
codificate in `DAnnotation.source = "jjodel/<chiave>=<valore>"` per `renderer`, `unit`, `min`,
`max`, poi `multiline` (TXT1, R-CR2-2). Singleton pill (`ee0eb3bdb`, `eb9645761`, `Color::Red`).
Costo dichiarato: il round trip `.ecore` perde le annotazioni `jjodel/*`.

**Livello 2, tab Structure** (29/8, `25a707036`): gruppi Name, Accent, Compartment sopra
`FieldCompartmentListEditor`; `structure` chiave annidata su `VertexViewIR` (R-STR-1);
capability per Symbol in `viewpoint/ir/structureCapabilities.ts` (R-STR-2), opzione non
supportata assente e dichiarata. R-STR-7 sciolta lo stesso giorno (`3e7eb02db`: il gradino 0
della ladder montato anche sul ramo IR). R-STR-6 sciolta il 30/8 via (A) + (B):
`SlotShape.viewRenderer` come gradino 0 di `detectValueRenderer`, il segmento `value` di
`IRNodeContent` passa per la ladder completa; R-STR-5 superata nella delimitazione.
Stile 7a promosso a sistema di tutti i tab (`bfbf1e9a3`, `8316e9791`, perimetro reale 11 file).

**Form views, authoring**: Slice 2a (`d3edb52b3`) e **2b** (`99a6eb0b2`: `basic`, link
cross-tab `Edit compartments` via `JjodelEvents.IR_AUTHORING_TAB`, titolo dei compartimenti).
Slice 2b era il «prossimo passo 2» del checkpoint precedente: fatta la sera stessa.

**Instance manager («Data Manager»)**, il fronte nuovo più grosso. Terzo tipo di tab di
progetto (R-FORM-1), si apre da `LeftBar.tsx:380` → `DockManager.openManager`, id
`mgr_${model.id}` (Q2), rail destro nascosto con `body[data-active-tab="manager"]` (Q1).
Motore form puro in **`frontend/src/jjform/`** (R-FORM-4, invariante zero import):
`shape.ts` (`metamodelShape`), `create.ts`, `delete.ts`, `multi.ts`, `nav.ts`
(`INLINE_DEPTH_LIMIT = 1`), `writeCtx.ts` (R-WCX-1..5, sei primitive per `(id, chiave,
indice)`, `setName` a sé per §3.12, `validTargets` sul contratto), `layout.ts` (auto-layout).
Adapter in `editor-v2/hooks/`: `shapeAdapter.ts` + `shapeDraw.ts` (R-FORM-5, il barrel del
joiner raggiunge monaco), `createAdapter`/`createDraw`, `deleteAdapter`/`deleteDraw`,
`multiAdapter`/`multiDraw`, `writeCtxLproxy.ts`. Slice: 2a tab e lista (`9ab7560d0`), 2b
ShapeCtx e tabella (`a348a8daf`, `0d560e9b2`), 2c create transazionale (`89f240705`), 12d
delete con preflight e cascata (`19ae922ba`, R-FORM-9..12), 12b/12c multi-selezione e drill-in
(`8fb085d9e`). Portabilità provata da `jjform/__tests__/writeCtx.test.ts` su host JSON.

**Form auto-layout e temi** (FL1..FL10, 31/8 e 1/9), spec normativa
`docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md` (il board
`Form Auto Layout.dc.html` non è nel repo e vale come esempio, non come fonte). Griglia 12
colonne per tipo, packing greedy in ordine di dichiarazione, quattro preset (Comfortable,
Compact, Sectioned, Dense) su tre campi `labelPlacement`/`density`/`sectionStyle`, attaccati al
viewpoint. Emendamenti A1 (read-only e derived non stretchano), A2 (literal legacy `FormTheme`
mappati in `viewpoint/ir/formAutoLayout.ts`), A3 (`STRETCH_MAX` a metà riga, `jjodel/multiline`
resta span 12).

**Design system del manager** (10b..10k, 31/8 e 1/9): outline di containment accanto al
catalogo (10b), rail/testata/footer (10c), badge lettera generico «C» (10f), un nodo per
istanza (10g), pannello Columns, Export e New in testata, form sotto la tabella con riga
espandibile e **ego-diagramma 1-hop** (FL5/FL6/EGO1, `76632dc76`); R-CR2-5 chiude le slice
13a/1b come coperte. DS1 coppia model ambra (`f4aa22df1`), DS3 quinto eyebrow.

**Uniqueness dei nomi**: M1 (S1, R-S1-1..5): namespace = fratelli dello stesso padre, verdetto
unico `nameUniqueness.checkNameUniqueness` all'ingresso `LValue.get_addObject`; scope globale
respinto; i consumatori dichiarano l'ambiguità (`findInstanceByName` torna la lista). M2
(S1-M2, R-M2U-1..6, `e6239176f`): case-sensitive con warning sul quasi-omonimo, pool
metamodello intero, `DDataType` namespace separato, feature ereditate senza shadowing, badge
via `detectM2DuplicateNames`. UNQ1 F1/F2/C5/C6 (1-2/9) hanno chiuso le code: auto-nome che non
ombreggia il nome vero (`a8260a835`), revoca scopata al modello scandito (`4bde43595`),
`ownerModelId` come campo su `NodeProblem` (`bc939442b`).

**Core, micro fix ratificati** (R-GT-1, R-GT-2, R-M2-2, 30/8): `get_type` gradino 3 dà
`Pointer_EOBJECT` a una `DReference` senza tipo; `EcoreParser.parse` abbassa
`Constructors.paused` in `finally`; `_impl_getByName` cerca `"$" + nome`. ENG1 (`b7d9c4c10`)
`set_containment` dice il vero; R-CR2-4 l'`aggregation` pura non sfratta più. R-DEL-4
`get_delete` scandisce `idlookup` per i `DObject` morenti. `syncDeleteObject` rimossa
(`b9be0674e`, morta da aprile, con Layer Impact Report). NestedView rimossa (`0494a9cad`) con
potatura degli SCSS orfani. Import Ecore da UI vivo (`21a784583`).

**Salvataggio** (SAVE1, DIRTY1, SAVE1-bis, VER1, VER2, SAVE2, 1-2/9): «Save project» in
testata con un salvataggio per tre chiamanti (`47d168816`, `saveProjectWithFeedback`); il dirty
flag non lo azzera l'autosave silenzioso (`4400a510f`); `save` riallinea `project.__raw` dopo
il bump (`1ac3b1863`) ma **non sull'oggetto vivo dello store** (`12e06b2ba`: l'app sta
stabilmente in una transazione aperta, `reducer.ts:1443`, `U.UpdatingTimer = 300ms`, quindi
`project.__raw` era `idlookup[id]`); autosave diradato a 15 s idle con tetto 120 s e senza
toast (`4bc765e85`); «Saved just now» in topbar (`defb3a112`). VF1 `highestVersion` non più
azzerato dall'ordine statico (`2bba8d1d8`).

**Sync, fix del 2/9**: VIEW1 (`783a8245d`) la create dal manager instanzia vertice e arco via
`createAdapter.ts` (`useJjomSync` Step 2 itera `rawModel.objects`, un figlio contenuto non ci
sta per costruzione). BOOT1 (`4100d3d02`, critical zone, LIR prodotto) gate dello Step 4
estratto in `sync/m1EdgeGate.ts`: distingue «non ha un vertice» da «non ce l'ha ancora».

## Decisioni prese (serie nuove a registro)

`docs/decisions.md` ha ora, oltre alle serie note: **R-STR** 1..7 (29-30/8), **R-FORM** 1..15 e
**R-WCX** 1..5 e **R-DEL-4** (29-30/8), **R-S1** 1..5, **R-GT** 1..2, **R-M2** 2, **R-M2U**
1..6 (30-31/8), **R-CR2** 1..5 con 2-bis (1/9). Superata: D3 (routing v1) da E-route.
Le motivazioni con sigla stanno nel registro; qui solo le tre che cambiano il modo di lavorare:

- **La precedenza view/metamodello la fa il motore, non l'adapter** (R-FORM-6), perché
  `valueRenderer.ts` e `irReadCtx.ts` hanno zero import. Contraddice l'ipotesi del contratto.
- **Un'opzione non supportata dal Symbol è assente, non disabilitata**, e ogni assenza è
  dichiarata (R-STR-2); un valore persistito non più ammesso resta nell'IR, mai riscritto.
- **Il metamodello decide il layout della form**: nessuna larghezza per campo, mai; le
  correzioni promuovono al metamodello come annotazioni, stessa ladder dei renderer.

## Regole di processo nuove

- **Log-inbox** (P9, `061453e65`): a corsie parallele il log attivo si tocca solo nella §6.1
  di chiusura batch, da una sessione sola a repo fermo; ogni corsia scrive in
  `docs/log-inbox/<lane>.md`, chi chiude sposta verbatim e cancella la inbox.
- **RC-13** (CLAUDE.md §6.4): una corsia per giro; docs e codice mai nello stesso commit;
  staged e WIP altrui intoccabili; **niente `git stash` su albero condiviso** (7 file riversati
  da uno stash del 28/7, misurato l'1/9); la rotazione del log è corsia esclusiva.
- **RC-13-bis** (P9, `7b930bd07`): il ripristino di un file tracciato si fa solo con
  `git checkout HEAD -- <path>`; niente backup su disco né file in `/tmp` fra sessioni (tre
  incidenti della stessa classe in due batch). **`CLAUDE.md` §6.1 è in contrasto** (propone
  ancora `cp` in `/tmp`): da allineare.
- **P11** (`29322514d`): una sonda esegue il soggetto per la via dell'utente, non il layer
  sotto; stato di modulo azzerato nel `beforeEach`; banco delle mutazioni, mutazione verde
  dichiarata nel referto. Nata da VIEW1 e SAVE2.
- **Rotazioni**: soglia 40, taglio per posizione, verbatim (RC-12); cinque rotazioni in sei
  giorni, archivio a 1069 entry. Check B accetta solo la forma `(x)` per `Causa`.
- **Trattamento delle deroghe** (RC-11): chi supera una soglia lo dichiara e prosegue;
  sanare o rifiutare è del reviewer a valle.

## Bug risolti (root cause, in una riga)

Slot enum non resi dal nodo istanza: CHECK 10 confrontava per nome su `__raw.values` mentre gli
editor scrivono il pointer (`fe1d5a0bd`, `962122469`). Gradino 0 irraggiungibile sul canvas:
mancava il punto d'ingresso, non `viewWidget` (R-STR-7). Create dal manager senza vertice:
Step 2 non vede i figli contenuti (VIEW1). Tre nodi e zero archi al riapri del canvas: gate
dello Step 4 calcolato prima dello Step 2bis (BOOT1). Bump di versione fuori da undo e delta:
`save` scriveva sull'oggetto vivo (VER2). Dirty flag azzerato dall'autosave (DIRTY1).
`highestVersion` azzerato dall'ordine statico dei metodi (VF1). Contagio `pendingCreation`
dopo un parse fallito: `Constructors.paused` mai abbassato (R-GT-2). `TXT1 §6.1` diagnosi
sbagliata, il difetto era la sottoscrizione fino a `DAnnotation.source` (IRF1, R-CR2-2-bis).

## Esiti non pieni da conoscere

Nessun ❌. Le ⚠️ sono quasi tutte Causa (a), specifica del prompt smentita dalla misura: Row
view library (tre file fuori elenco, smoke non eseguito), sporgenza 24px (nasce a valle in
`avoidNodeRects`), footer dell'inspector (fix revocato), stile 7a (perimetro 11 file), R-STR-6
misura, S1 e S1b, FL1 (tre divergenze board/regole), FL5, STYLE1, CRUD2 F1/F2.
**Regressioni dichiarate**: 10k-chiusura (`4180819c3`, Causa f) andato in HEAD con tre test
rossi, chiusi in `f18c03d9e`; VER2 (Causa c): due save entro 300 ms condividono un numero di
versione, deroga RC-11 aperta. S2 con Layer Impact Report `skipped`. Sanatoria nel log per tre
commit con contenuto diverso dal messaggio (`50de03252`, `f278cf4fb`, `ed5c80daa`).

## Bug nuovi / Todo

**Alta**
1. **§6.1**: chiusa il 3/9 (`c1118d86c`, `d9e2480cb`, `c6f1f3c37`); il log attivo aveva 10
   entry, non 9, e ne ha ora 19. EGO1: nessun revert in indice, vedi la rettifica in testa.
2. **Finestra 300 ms sui save** (VER2): chiusura via (e), `COMMIT` forzato, è modifica core e
   richiede go-ahead. Il regime della transazione sempre aperta merita una corsia sua.
3. **Figlio creato senza canvas aperto resta invisibile** (VIEW1/BOOT1): chiuderlo esce dal
   perimetro `model.objects` ratificato da CRUD3 F2. Con esso: vertice a `(0, 0)`,
   `childVertexId: null`, id duplicati in `state.graphs`, disallineamento chiavi
   conformance/`DVertex`.
4. **Numeri stantii** (DOC2): `1000ms` in `projects.ts:105`; `P1..P9` in `CLAUDE.md:14` e
   `:102` contro P11; totale vitest 3147 nei referti contro 3207 misurati; `CLAUDE.md` §6.1
   contro RC-13-bis. Perimetro DOC1, non ancora fatto.
5. **Round trip `.ecore` perde le annotazioni `jjodel/*`** (renderer, unit, min, max,
   multiline): `parseDAnnotation` non è più stub (`04a42079c`) ma il costo resta dichiarato.
6. **La voce di uniqueness M2 non si vede sul canvas** (registro per id elemento, indicatore
   per id `DVertex`, R-M2U limite aperto).

**Media**
7. R-S1 pendente: auto-nome (`defaultname`) e il tick-fix arrivato per altra via (`e1c885d4c`).
8. `form-engine-contract.md` §5.0 cita ancora la uniqueness per cls+owner (12a) che R-S1-3 ha
   emendato; `.inode-inspector__result-scope` orfano in `rendererInspector.scss` (Regola 9);
   terza copia della classificazione in `useFormWidgets.ts`; quarta copia di `CHIP`.
9. Inversioni rimandate del contratto: `multiAdapter.applyBulk`, `createAdapter.applyCreate`.
10. Not yet designed (README instance node): overflow oltre 4 chip, nomi lunghi, zoom-out,
    compartimento operazioni, dark mode.
11. Pendenti invariati dal 28/8: R4 `api/data.ts:355-370`; select classica vuota su nome
    legacy; literal enum non cancellabile; `removeByIndex` duplica; guard derived
    `joiner/classes.ts:4160`; `DObject.name` non allineato all'import; `CLAUDE.md:909`;
    porta 3001 nelle custom instructions (solo Alfonso può).

**Documentale**
12. `contesto_progetto.md` fermo al 19/8: descrive `2.228` come fronte caldo e non conosce
    manager, jjform, auto-layout, uniqueness. Va riscritto, non emendato.
13. `claude/spec_attive.md` e `HARNESS-DOCS.md` nel KB: da verificare contro i quattro
    documenti normativi nuovi (`form-engine-contract.md`, `form-autolayout-spec.md`, i due
    README di handoff, `claude_spec_2026-08-28_ir_formspec_addendum.md`).

## Prompt generati per Claude Code

Nessuno in questa sessione. Gli ultimi col naming `claude_<data>_<ora>_` in `docs/prompts/` sono del 29/8 (`..._1900_prompt_structure_7a_style.md`). I prompt derivati dai bundle stanno in `docs/design/design_handoff_instance_node/PROMPT_*.md` (row view library, singleton pill, structure tab). I prompt dal 30/8 in poi sono stati consegnati in chat e messi a terra a posteriori con `8c600cb92` (1/9, RC-9): diciannove file `docs/prompts/PROMPT_<sigla>.md` senza data né ora nel nome (10j, 12bc, 12d, 2c, DS3, ENG1, FL8, STYLE1, STYLE2, brokenref, nestedview ×2, rstr6b, scss ×2, seed_dreference, structure_tab, più `form-engine-contract.md` e `handoff-README.md` duplicati da `docs/design/`). Le corsie dell'1-2/9 (10k, NAV, SAVE, UNQ1, CRUD, VER, BOOT1, VIEW1, DOC2) non hanno un file prompt: la traccia è il discovery report e la entry di log. Il naming con timestamp non è stato rispettato: da riallineare o da ratificare come deroga.

## Prossimi passi

1. ~~Chiusura §6.1~~ fatta il 3/9. Push dal Mac dei tre commit docs.
2. Riscrivere `contesto_progetto.md` a partire da questo file (indice, non duplicato).
3. Decidere la via (e) per VER2 e la corsia sulla transazione sempre aperta.
4. DOC1: i numeri stantii e `CLAUDE.md` §6.1 / `P1..P9`.
5. Il figlio senza canvas (VIEW1/BOOT1), con la decisione sul perimetro `model.objects`.

## Info strutturali scoperte

- L'app sta **stabilmente in una transazione aperta** (`reducer.ts:1443`, `COMMIT` che riapre
  con `BEGIN()`, `U.UpdatingTimer = 300ms`): ogni `SetFieldAction` va in `pendingActions`, e
  `project.__raw` è `idlookup[id]`, l'oggetto vivo. Qualunque «riallineamento» sul `__raw`
  scrive nello store.
- `useJjomSync` Step 2 itera `rawModel.objects`: un figlio contenuto non ci sta mai
  (`joiner/classes.ts:774-784`); i vertici dei figli li crea chi crea l'oggetto
  (`ContextMenu.tsx:347-373` era il precedente).
- Il barrel del joiner raggiunge monaco: un modulo che lo importa uccide la suite unitaria.
  Da qui il pattern `*Draw.ts` (puro) / `*Adapter.ts` (impuro) per ogni adapter di `jjform`.
- `valueRenderer.ts`, `irReadCtx.ts`, `slotValues.ts` hanno zero import: sono già motore.
- I tab del progetto sono rc-dock con `data-type` sul DOM e non sono persistiti.
- L'interactive `grep` è `ugrep --ignore-files`: `--include` non filtra e gli ignorati non si
  vedono; `command grep` per i flag con significato (CLAUDE.md §5).

## Cronologia

Sessione di sola lettura. Alfonso ha chiesto se la chat fosse al corrente del lavoro fatto in
Claude Design e nei prompt a Claude Code; la risposta era no: il KB si fermava al 28/8
pomeriggio e non nominava nessuno dei due bundle di design. Connessa la cartella, il `git log`
ha mostrato 332 commit in sei giorni. Tre analisi parallele (decisioni, cronologia del log,
handoff di design) hanno prodotto la ricostruzione sopra; nessun file del repo è stato
modificato tranne `_to_delete/catchup/` (untracked, deliberato) e lo spostamento di
`objects/maintenance.lock` in `_to_delete/git-locks/`.

# Discovery — Instance manager (form CRUD), Fase 1

**Data**: 2026-08-29
**Branch**: `alfonso-frontend-jjtl` · HEAD `e80c3f308`
**Corsia**: completa (RC-3). **Zero scritture di sorgente.**
**Tipo**: censimento read-only. Nessuna sonda `_tmp_*` eseguita: tutte le asserzioni di
questo report sono statiche (lettura di sorgente e `command grep`), e sono dichiarate come
tali. Dove serviva una misura a runtime l'ho scritto come domanda aperta, non come fatto.

**Stato dell'albero all'inizio**: cinque file di `editor-v2/utils/` modificati e non
committati (lavoro sugli archi, `git diff --stat` 491+/64-) piu' due prompt document e
`frontend/scripts/smoke/scripts/` non tracciati. Nessuno di essi e' nel perimetro qui
censito; nessun file e' stato toccato da questa sessione.

---

## 0. Documenti citati dal prompt e non presenti nel repo (RC-10)

Il prompt cita due referenze di design:

- **`CRUD Manager Simulation.dc.html`** — non esiste. `find . -iname "*.dc.html"` (fuori
  `node_modules`) restituisce sei file, in `docs/redesign/rail/` e nei due bundle
  `docs/design/design_handoff_instance_node/` e
  `docs/design/design_handoff_jjodel_form_views/`. Nessuno e' quel file.
- **«Turni 10–13 del proposal»** — `Instance Node Proposal.dc.html` contiene i Turni
  **2, 3, 4, 5, 7** e nient'altro (`command grep -o "Turn[oi]* [0-9]*"`, ordinato e
  deduplicato). `Jjodel Form Views.dc.html` non contiene la parola «Turno».

Applico RC-10: lo dichiaro e procedo sul resto. **Conseguenza operativa da leggere**: il
contratto META della simulazione e' la sola cosa che il prompt indica come *prototipo del
contratto del motore*, quindi il §5 di questo report (collocazione e forma del motore)
propone una forma **derivata dal codice esistente**, non dal prototipo. Quando il bundle
atterra nel repo (RC-9), il §5 va confrontato con il contratto META e, se divergono,
rifatto — non riconciliato a posteriori.

Nessun report esiste al path di questo documento: **R-E/E-1 non si applica**.

---

## 1. Tab di progetto — dove vive il routing, che contratto ha un tab, cosa costa il terzo tipo

### 1.1 Sede e contratto

I tab di progetto sono **rc-dock**, non un componente di casa.

| Cosa | Dove |
|---|---|
| Costruzione del layout | `components/abstract/Dock.tsx:319-336` |
| Gruppi | `Dock.tsx:267-271` — `models` (floatable, non maximizable) e `editors` (orfano dopo F2) |
| Fabbrica dei `TabData` | `components/abstract/tabs/TabDataMaker.tsx` (55 righe, tre metodi statici) |
| Apertura / attivazione / chiusura | `components/abstract/DockManager.tsx` (`open`, `open2`, `closeTab`, `closeTabsForEntity`) |
| Reazione al cambio tab | `Dock.tsx:341-380` (`handleLayoutChange`) |

Il contratto di un tab e' il `TabData` di rc-dock: `{ id, title: ReactNode, group, closable,
content: ReactNode }`. Non c'e' nessun registry, nessuna discriminated union, nessun tipo di
progetto: **il «tipo» di tab e' oggi un attributo DOM sul titolo**, `data-type`, letto da
`handleLayoutChange` a `Dock.tsx:352` per emettere `ACTIVE_TAB` e `EDITOR_TYPE_CHANGE`.
Valori in uso: `metamodel`, `model`, `documentation`.

I due tipi esistenti sono `TabDataMaker.metamodel()` e `.model()`; entrambi montano
`MetamodelTab` / `ModelTab`, che a loro volta montano `EditorSwitch` → `EditorV2`
(`ModelTab.tsx:41-42`). Un terzo tipo non deve passare da li': **`EditorV2` prende un solo
prop di soggetto, `modelid`** (`EditorV2.tsx:347-360`).

### 1.2 Persistenza: non c'e'

**I tab aperti non sono persistiti.** Il layout e' ricostruito a ogni mount da
`defaultLayout` (`Dock.tsx:387`), che contiene **solo** `project_summary`
(`Dock.tsx:275`, `:329`). Cio' che sopravvive al reload e' un'altra cosa: la **modalita' di
layout** e i rapporti dei pannelli, in `localStorage` (`jjodel_layout_mode`,
`jjodel_dock_ratio_<mode>`, `Dock.tsx:33-92`), e le preferenze **per modello** in
`readEditorPrefs`/`writeEditorPrefs` (viewpoint attivo e modalita' editor,
`EditorSwitch.tsx:64-111`). Il tab in se' no.
Controllo: `command grep -rn "saveLayout\|loadLayout\|jjodel_layout\|dock_layout"` su
`src` — 0 occorrenze di salvataggio del layout dei tab; `loadLayout` appare solo nel
resize di `Dock.tsx:190`, che ricarica il layout *corrente* in memoria.

All'apertura del progetto viene aperto d'ufficio il primo metamodello, ma solo come effetto
collaterale di `DockManager.openViewpoint` quando nessun editor e' attivo
(`DockManager.tsx:255`).

### 1.3 Costo reale di un terzo tipo — quattro voci, tutte piccole, una insidiosa

1. **Collisione di id.** `TabDataMaker.metamodel/model` usano `id: model.id`
   (`TabDataMaker.tsx:17`, `:28`), e `DockManager.open` a `:92-98` attiva il tab esistente
   se l'id c'e' gia'. Un manager sullo **stesso** modello con lo stesso id non aprirebbe
   nulla: attiverebbe il canvas. Serve un id **prefissato**, com'e' gia' per
   `doc_${id}`, `jjtl_${id}`, `vp_${id}`. Costo: una riga nella fabbrica.
2. **Chiusura per entita'.** `closeTabsForEntity` (`DockManager.tsx:59-88`) enumera i
   prefissi a mano: il nuovo prefisso va aggiunto li', o cancellare un M1 lascia il suo
   manager aperto su un modello morto. Costo: una riga.
3. **`data-type` e `EDITOR_TYPE_CHANGE`** — *questa e' l'insidiosa*. Con un id prefissato,
   `handleLayoutChange` non trova `idlookup[activeId]` (`Dock.tsx:360-369`), quindi
   `resolvedEditorType` resta `null` e **nessun `EDITOR_TYPE_CHANGE` viene emesso**:
   `body[data-editor-type]` conserva il valore del tab precedente. Non e' cosmetico:
   quell'attributo governa via CSS la visibilita' del rail destro
   (`PropertiesWithTreeView.tsx:736`, `abstract/style.scss:1116/1142/1167`) e
   `DockManager.activateProjectSummary` lo legge (`:239`). Il tab Documentation risolve lo
   stesso problema con un attributo proprio, `data-active-tab` (`Dock.tsx:375-379`). Il
   manager deve fare una scelta esplicita: **che cosa deve mostrare il rail destro quando
   il manager e' il tab attivo?** → **Q1** in §7.
4. **Nessun altro accoppiamento.** `StatusBar` e `Dashboard` ascoltano `ACTIVE_TAB` /
   `EDITOR_TYPE_CHANGE`, che continuano a essere emessi (il primo sempre). Il gruppo
   `models` e' `floatable: true`, quindi il manager sarebbe trascinabile e sganciabile
   come gli altri: coerente con «superficie sorella del canvas» (R-FORM-1).

**Perimetro stimato voce 1**: `TabDataMaker.tsx` (+1 metodo), `DockManager.tsx` (+1 prefisso,
eventualmente +1 `openManager`), `Dock.tsx` (il ramo di `data-type`), piu' il componente
nuovo. **Quattro file**, sotto la soglia di Regola 19.

---

## 2. Derivazione della shape — quanto c'e' gia', e i tre buchi

### 2.1 Il pezzo grosso esiste: `MetaclassInfo`

`components/editor-v2/hooks/useEditorMode.ts:43-79` dichiara una struttura **gia'
serializzabile** (oggetti piatti, nessun proxy, nessun React) e
`getMetaclassInfo(modelId, knownMetamodelId?)` a `:239` e' l'**accessore non-hook** che la
produce senza passare dal renderer. E' esattamente il «senza passare dal renderer» del
prompt, e ha gia' quattro consumatori di authoring (`EdgeAuthoringPanel`,
`RowAuthoringPanel`, `metaclassPin`, `irCreationSeed`).

Copre:

- classe: `id`, `name`, `isAbstract`, `isSingleton`, `concreteSubclasses` (ricorsivo,
  cycle-safe, `:467-490`);
- attributi: `id`, `name`, `type` (**nome**), `lowerBound`, `upperBound`, `isEnum`;
  `attributes` (propri) e `allAttributes` (piegati sulla catena `extends`);
- reference: `id`, `name`, `targetClassId`, `targetClassName`, `containment`,
  `aggregation`, `lowerBound`, `upperBound`. Attenzione: la lista **e' gia' piegata**
  sull'ereditarieta' (`cls.allReferences ?? cls.references`, `:410`) — asimmetrica rispetto
  agli attributi, dove le due liste sono separate;
- `rootableClasses`: concrete, non singleton, non bersaglio di composizione (`:496-520`).

Contenimento e cardinalita' ci sono. Enum c'e' come **flag**, non come dominio.

### 2.2 I tre buchi

1. **Letterali di enum assenti.** `MetaclassAttribute` porta `type` come **nome** e
   `isEnum`, ma **non l'id del tipo**: dai soli `MetaclassInfo` non si arriva ai letterali.
   Oggi il dominio di una enum lo fornisce `slot.validTargetOptions`
   (`useFormWidgets.ts:148`), cioe' **`LValue.get_validTargets`**
   (`model/logicWrapper/LModelElement.tsx:7853-7900`), che **richiede uno slot vivo di
   un'istanza**. Un manager che deve disegnare la colonna di una enum su una tabella
   **vuota**, o offrire il dominio nel form di creazione, non ha nessuno slot da
   interrogare. Il buco e' reale ma stretto: `get_validTargets` deriva tutto da `meta`
   (la `LAttribute`/`LReference`) piu' il modello M1, quindi l'equivalente a livello di
   metaclasse e' un'**estrazione**, non una riscrittura.
2. **`derived` / `changeable` assenti** da `MetaclassInfo`. `describeSlot` li legge dal
   proxy della metafeature (`useFormWidgets.ts:236-237`) per decidere `isReadOnly`. Una
   colonna read-only non e' derivabile senza istanza.
3. **Reference entranti**: nessun indice per-metaclasse. `ClassPointers.referencedBy`
   esiste nel D-layer (`model/logicWrapper/PointerDefinitions.ts:109`) ma non e' esposto in
   `MetaclassInfo`. Vedi §3.4, dove il problema si risolve meglio a livello di **istanza**.

### 2.3 Impurita' da conoscere

`getMetaclassInfo` **non e' puro**: chiama `store.getState()` e `LPointerTargetable.fromPointer`
(strategia 1 su `idlookup` grezzo, strategia 2 di fallback su proxy, `:281-365`). Il suo
**output** e' portabile; il suo **corpo** e' l'adapter. Per R-FORM-2 questa e' la divisione
giusta: `MetaclassInfo` (o un suo successore) e' il tipo di contratto, `resolveM1Info` e' la
prima meta' dell'adapter D-graph.

---

## 3. Write path fuori-canvas — c'e' quasi tutto, e non e' il tree-view

### 3.0 Rettifica alla premessa del prompt

Il prompt ipotizza che il tree-view sia «il precedente piu' vicino». **Non lo e'**: in
`components/TreeViewSidebar/TreeViewContent.tsx` (2657 righe) gli unici `delete()` sono su
**view** (`:1422`, `:1824`, `:1835`) e non esiste nessuna affordance di creazione o
cancellazione di istanze. Lo aveva gia' misurato il report del 2026-07-16 (riga (b) della
sua tabella §1), e la misura regge a oggi.

**Il precedente vicino e' un altro, ed e' migliore**: `formWrite.ts` + `LValue/LModel.addObject`
+ il cascade canonico `.delete()`.

### 3.1 Update (valori) — chiuso, e gia' fuori-canvas per costruzione

`components/editor-v2/viewpoint/ir/formWrite.ts` (195 righe) e' **il** write path del form:
`setSlotValue`, `clearSlotValue`, `addSlotValue`, `appendSlotValue`, `setObjectName`.
Il suo header dichiara esplicitamente perche' NON usa `syncUpdateFeatureValue`: quello e'
chiavato sul **DVertex**, scrive solo la posizione 0, e non ha append ne' clear. Il manager
ha esattamente lo stesso problema e la stessa soluzione. **Zero lavoro nuovo per l'update
scalare e per la lista.**

Due semantiche da riportare in UI e non «riparare»:
- `clearSlotValue` lascia un **buco**, non accorcia l'array (motivazione misurata nel
  docstring, `formWrite.ts:73-100`; l'alternativa `removeByIndex` e' rotta e a registro in
  `docs/TECH-DEBT.md`);
- `setObjectName` passa dal setter L, perche' il nome e' `DObject.name` piu' lo slot
  `name` (CLAUDE.md §3.12).

### 3.2 Create — esiste, in due sapori, e nessuno dei due chiede un canvas

| Caso | API | Note |
|---|---|---|
| Istanza radice | `LModel.addObject(json, metaclass)` | `EditorV2.tsx:2372` (`lModel.addObject({}, lClass)`) |
| Figlio contenuto | `LValue.addObject(json, metaclass)` | `ContextMenu.tsx:381`; il father containment auto-appende al `values` del padre (commento a `canvasToJjom.ts:1418-1421`) |

Entrambi sono lo **stesso getter**, `get_addObject`, che discrimina sul contesto
(`LModelElement.tsx:7035-7180`). Rifiuta di istanziare un singleton (`:7101`).
`syncCreateObject` (`canvasToJjom.ts:1371`) **non serve al manager**: e' `DObject.new` +
`createVertexForObject`, cioe' crea anche il vertice. Il manager crea oggetti **senza**
vertice, che e' il caso che `useIRFormView` gia' contempla («l'oggetto puo' essere
off-canvas», docstring `:5-8`).

**Domanda che il codice non chiude**: `get_addObject` apre una `TRANSACTION`
(`:7134`) che contiene `DObject.new3`, cioe' un creatore annidato, piu' un
`setTimeout` per l'inizializzazione dei valori (`:7153`). E' il pattern che CLAUDE.md §3.3
proibisce **vicino al sync layer** e che §9.2 descrive come idioma noto per gli attributi
differiti. E' codice committato e usato dal ContextMenu, quindi verificato; ma va provato a
runtime sotto il manager, dove la creazione avviene senza grafo aperto → **Q3** in §7.

### 3.3 Delete — chiuso, con una macchina che ha gia' pagato i suoi debiti

Il cascade canonico e' `Dummy.get_delete` (`common/Dummy.ts:50-270`). Per un `DObject` fa,
in ordine: figli (le `DValue`, e per una `DValue` di **containment** anche il target
contenuto), rete di sicurezza sulla collezione del father, **pulizia delle reference
entranti via `pointedBy`**, i `DVertex` in **tutti** i grafi, poi `DeleteElementAction`.
Tutto dentro la sua `TRANSACTION` — quindi **niente wrapper esterno**.

La cascata di containment **e' quella del cascade**, non del manager: cancellare un oggetto
cancella i suoi contenuti. Risposta alla domanda del prompt: **si', a cascata**, e non e'
una scelta da rifare.

Il routing e' gia' corretto: `syncDeleteVertex` instrada `DObject` su `.delete()`
(`canvasToJjom.ts:455-462`), fix del report 2026-07-16 ormai landato. Ma quella funzione e'
chiavata sul **vertice**: il manager deve chiamare `lObject.delete()` direttamente. E' la
stessa chiamata, un livello sopra.

**Resta un residuo dichiarato, non risolto**: `syncDeleteObject`
(`canvasToJjom.ts:1829-1863`) e' la vecchia via **raw** — `DeleteElementAction` diretta,
senza cascade. `command grep -rn "syncDeleteObject"` su `src` trova **una sola riga: la sua
propria dichiarazione**. E' esportata e morta. Non e' del perimetro di questa fase, ma chi
scrivera' il delete del manager deve sapere che esiste, per non chiamarla per assonanza.

### 3.4 Reference entranti (12d) — l'indice c'e', si chiama `pointedBy`

`pointedBy` e' popolato per i valori di reference M1 e mantenuto **incondizionatamente** dal
reducer (`reducer.ts:395`, misurato nel report 2026-07-16 §2). E' il canale che il cascade
usa per ripulire i puntatori entranti. Per **enumerare** le reference entranti di
un'istanza (la lista «chi mi punta» che 12d chiede) la fonte e' `idlookup[objId].pointedBy`,
gia' presente, senza scansione globale.

Costo: la voce di `pointedBy` e' un `PointedBy { source: <path nello store>, casee }`
(`joiner/classes.ts:1382`, `:1799-1809`), cioe' un **path**, non un id di oggetto. Renderlo
come «istanza X, feature f» richiede di risalire dalla `DValue` al suo father e alla sua
metafeature — la stessa risalita che `findFeatureRaw` fa in direzione opposta
(`irReadCtx.ts:50-64`). Piccolo, ma da scrivere.

---

## 4. La precedenza come modulo — **e' gia' portabile**, ed e' il reperto migliore del giro

Misura, con controllo positivo (`command grep -c "^import"`, BSD grep):

| Modulo | `^import` | Cosa importa |
|---|---|---|
| `nodes/valueRenderer.ts` (683 righe) | **0** | — |
| `ir/irReadCtx.ts` (190) | **0** | — |
| `ir/slotValues.ts` (69) | **0** | — |
| `ir/widgetRenderer.ts` (147) | 2 | **solo tipi** + `valueRenderer` |
| `ir/formSections.ts` (110) | 2 | **solo tipi** (`import type`) |
| `ir/useFormWidgets.ts` (341) | 3 | `react` (solo per il wrapper `useMemo`), tipi, `slotValues` |
| *controllo positivo* `ir/IRForm.tsx` | **15** | react, joiner, scss… |

Quindi:

- **Il vocabolario dei renderer e la ladder sono gia' un modulo puro.** `valueRenderer.ts`
  espone `SlotShape` (`:324-355`), un tipo **strutturale** — value/values/isReference/
  isMany/typeName/enumLiteralNames/featureName/rendererOverride/unit/min/max/isBroken — e
  `traceLadder`, `metamodelRenderer`, `detectValueRenderer` sopra di esso. Nessun proxy,
  nessun React, nessun Redux.
- **La precedenza view-vs-metamodello e' gia' un modulo puro**: `widgetRenderer.ts`, che il
  suo stesso header dichiara tale, e che implementa R-STR-3/R-STR-4.
- **`describeSlot` e' strutturalmente puro ma duck-typed sul proxy**: legge
  `slot.instanceof.__raw.lowerBound`, `slot.instanceof.type.name`, `slot.validTargetOptions`,
  `slot.id`, `slot.name`. Non e' un'API dichiarata: e' la **forma** di un `LValue`. La prova
  che sia estraibile e' gia' in repo: `__tests__/useFormWidgets.test.ts` lo pilota su
  **oggetti semplici** (`:50` costruisce `validTargetOptions: o.options` a mano).

**Risposta secca alla voce 4 del prompt**: si', la precedenza e' consumabile fuori dal
contesto nodo. Il costo non e' un refactor, e' **dichiarare la forma dello slot** (oggi
implicita nel proxy, gia' esercitata dai test) e portare fuori la sola cosa che oggi
richiede un'istanza viva, il dominio delle enum e delle reference (§2.2, punto 1).

E l'host esiste gia': `IRForm` prende **un solo prop di soggetto, `objectId`**
(`IRForm.tsx:39-44`), e `useIRFormView` e' nato esplicitamente per soggetti **senza
vertice** (docstring `:4-9`). Oggi ha un solo sito di mount, il rail
(`PropertiesWithTreeView.tsx:1110`). Il manager e' un secondo host, non un secondo form.

**Debito di duplicazione a registro, da non aggravare**: `useFormWidgets.ts:9-15` dichiara
che la classificazione attributo/enum/reference/composizione e' **copiata** da `Info.value`
e non estratta, e chiede che se compare una terza copia si estragga. **Il manager sarebbe la
terza copia se la riscrivesse.** Non deve.

---

## 5. Collocazione del motore

### 5.1 Il precedente in repo e' netto

`frontend/src/jjel/` e' un modulo TS puro: `command grep -rn "from '../../joiner'\|from
'react'\|redux"` su `jjel/` (esclusi i test) → **0 righe**, con controllo positivo
`^import` su `jjel/evaluator/evaluator.ts` → 4. Ha il suo `index.ts` come superficie
pubblica, il suo `SPEC.md`, i suoi `__tests__`. `jjtl/` ha in piu' un `CLAUDE.md` proprio
che si carica lavorando sotto quella directory.

**Proposta**: il motore form vive in `frontend/src/jjform/` (nome da ratificare), pari
grado di `jjel/`, `jjtl/`, `jjscript/`, con `index.ts` + `SPEC.md`, e con l'invariante
dichiarata nel SPEC: **zero import da `joiner/`, `redux/`, `react`, `components/`**.
L'adapter D-graph NON vive li' dentro: sta in `components/editor-v2/` (o in un
`jjform-adapter-jjodel/` accanto), che e' dove sta gia' oggi il suo omologo.

### 5.2 Il precedente di forma dell'adapter e' gia' scritto, e va imitato

La coppia `irReadCtx.ts` (0 import, definisce l'interfaccia `ReadCtx` + un backend `draw`) /
`irReadCtxLproxy.ts` (64 righe, importa il joiner, sceglie il backend, **inietta** la
dipendenza impura) e' esattamente il taglio che R-FORM-2 chiede, gia' realizzato per la
lettura. `irReadCtx.ts:34-42` documenta anche perche' `isMarked` e' **iniettata** e non
importata: per non dare a quel modulo il suo primo import. E' la disciplina da estendere.

**Ma `ReadCtx` non basta per il manager**, e va detto chiaramente:

| Serve al manager | `ReadCtx` lo copre? |
|---|---|
| valori di istanza | **si'** (`getValue`, `getValues`, `getRef`) |
| identita' / metaclasse | **si'** (`getName`, `getMetaclassName`, `isKindOf`) |
| shape del metamodello (cardinalita', enum, containment) | **no** |
| enumerare le istanze di una metaclasse | **no** |
| scrittura (create / update / delete) | **no** |

Quindi il contratto del motore e' `ReadCtx` **+ due porte nuove**: una `ShapeCtx`
(metamodelShape: la §2, con i tre buchi chiusi) e una `WriteCtx` (create/update/delete +
append/clear, cioe' la superficie di `formWrite.ts` piu' `addObject` e `delete`). La terza
gamba del prompt, `formSpec`, e' **gia'** un tipo puro e serializzabile
(`irTypes.ts:246-266`, quattro chiavi tutte opzionali) e non richiede nulla.

Nota di rischio dichiarata: `useIRFormView` importa `sim/simRunState` (`:25`) e
`irCrossDeps` — cioe' la reattivita' del form oggi e' accoppiata alla simulazione e al
registro delle dipendenze cross-oggetto di editor-v2. Se il manager riusa `IRForm`
tale e quale (ed e' quello che consiglio per la Fase 2), **eredita quell'accoppiamento**: e'
accettabile dentro jjodel, e' esattamente cio' che l'estrazione futura dovra' tagliare.

---

## 6. Canvas scopabile (per R-FORM-3) — **non esiste**, e `NestedView` non e' quello

Il prompt sospetta che `NestedView` sia «esattamente questo, abbandonato». **Non lo e'.**
`components/editors/views/NestedView.tsx` e' l'editor **delle view e dei viewpoint** in
versione annidata (albero + `ViewData`), non un diagramma. Che sia irraggiungibile e' gia'
misurato e a registro: `discovery_2026-08-23_nestedview_ui_morta.md` (nessun sito lo
renderizza; le uniche occorrenze sono la sua definizione, l'export in
`editors/index.ts:8`, un import **commentato** in `Dock.tsx:21` e due commenti). Il reperto
e' confermato — ma e' un reperto su un'altra cosa.

Il vero stato dell'arte:

- **`EditorV2` non e' scopabile.** `EditorV2Props` (`:347-360`) ha `modelid`,
  `onSwitchEditor`, `classicSlot`, `editorMode`, `hasViewpoint`, `onEditorModeChange`.
  Nessun `graphId`, nessuna radice di sottoalbero, nessun filtro di palette.
  `ModelTab.tsx:56-58` sceglie il grafo per **modello**, non per sottoalbero.
- Il piu' vicino che c'e' e' il rendering **per contenimento** dentro il nodo IR
  (`viewpoint/ir/useIRContainment.ts`, `IRContainmentHulls.tsx`): sa che cos'e' un
  sottoalbero di composizione, ma rende **dentro un nodo**, non come diagramma autonomo.

**Verdetto per la decisione che il prompt chiede**: l'ibrido 13a (diagramma embedded scopato
al sottoalbero) **non e' Fase 1**, e non e' nemmeno un riuso: e' superficie nuova sul canvas,
con un prop di scoping che oggi non esiste e una palette ristretta che oggi non esiste.
Va a **Fase 3 o oltre**, e la Fase 2 deve rendere `surface: 'diagram'` **degradabile a
form** — che e' esattamente cio' che R-FORM-3 gia' prescrive per fuori-jjodel, applicato
qui anche dentro, come stato transitorio dichiarato.

---

## 7. Punti aperti per la ratifica

- **Q1 — Rail destro sotto il manager.** Il manager attivo lascerebbe `body[data-editor-type]`
  al valore del tab precedente (§1.3, punto 3). Tre versi possibili: (a) il rail resta
  visibile e mostra la selezione del manager; (b) il rail e' nascosto, come per il tab
  Documentation, con un attributo proprio; (c) il manager emette `EDITOR_TYPE_CHANGE` con un
  quarto valore e si aggiunge una regola CSS. Nessuna e' derivabile dal codice: e' una
  decisione di prodotto.
- **Q2 — Soggetto del tab.** Un manager **per modello M1** (un tab per M1, tutte le
  metaclassi dentro) o **per metaclasse** (un tab per metaclasse)? Cambia l'id del tab, il
  titolo, e se `closeTabsForEntity` deve chiudere N tab o 1. Consiglio: per modello — e' il
  soggetto che il canvas ha gia', e tenere la parita' di soggetto fra le due superfici
  sorelle e' cio' che rende R-FORM-1 vero e non solo dichiarato.
- **Q3 — `addObject` senza grafo aperto.** `get_addObject` apre una `TRANSACTION` con un
  creatore annidato e un `setTimeout` per i valori (§3.2). Provato dal ContextMenu **con** un
  grafo aperto. Va misurato a runtime nel manager prima di dichiararlo il write path della
  create, oppure si sceglie la via bassa (`DObject.new` nudo, come `syncCreateObject`, meno
  il vertice). Non decidibile staticamente.
- **Q4 — Dominio delle enum e delle reference senza istanza** (§2.2). Estrarre un
  `validTargetsFor(feature, modelId)` da `LValue.get_validTargets` e' l'unica via che non
  duplica; ma tocca `LModelElement.tsx`, che e' core (Regola 5). Serve go-ahead esplicito.
  Alternativa senza toccare il core: risolvere i letterali via `idlookup` nell'adapter,
  accettando che il filtro di containment-loop (che e' per-istanza, `:7871-7873`) non sia
  disponibile in creazione.
- **Q5 — `surface` di R-FORM-3: dove si dichiara.** La view lo dichiara per metaclasse. Il
  posto naturale e' una chiave nuova su `VertexViewIR` accanto a `form` e `structure`
  (`irTypes.ts:351`, `:379`, `:469`), additiva-opzionale, senza bump di `irVersion` — il
  precedente e' R-STR-1 alla lettera. Da confermare che sia **quella** la sede e non
  `FormSpec`.
- **Q6 — Nome e sede del motore** (§5.1): `frontend/src/jjform/` va bene? Il nome entra in
  un `index.ts` pubblico e in un `SPEC.md`, quindi e' costoso cambiarlo dopo.
- **Q7 — `syncDeleteObject` morta** (§3.3): si cancella in un `chore` a parte, o si lascia?
  Registrata, non chiusa qui (Regola 9: `// TODO: cleanup`).

---

## 8. Proposta di slice minima per la Fase 2

La misura consiglia una slice **piu' larga** di «tab + shape + tabella read-only», perche'
lo strato di lettura e' quasi tutto gia' scritto e una slice che si ferma prima del write
non prova nulla che non sia gia' provato dal rail. Ma consiglia anche di **non** far
coincidere la prima slice con l'estrazione del motore, che e' il pezzo dove il contratto
META mancante (§0) morde davvero.

**Slice 2a — il tab e la lista, senza motore nuovo, senza write.**

1. `TabDataMaker.instanceManager(model)` con id prefissato `mgr_${model.id}` e
   `data-type="manager"`; `DockManager.openManager`; prefisso in `closeTabsForEntity`; il
   ramo di Q1 in `Dock.tsx`. **4 file.**
2. Il componente del manager consuma `getMetaclassInfo(modelId)` **cosi' com'e'**: colonna
   sinistra = metaclassi (con `isAbstract`/`isSingleton` gia' disponibili), pannello destro =
   elenco delle istanze della metaclasse selezionata, lette dal `LModel.objects` filtrato per
   `instanceof`. Read-only. Nessuna tabella per-attributo ancora: **una riga per istanza, nome
   e metaclasse**. Questo mette a terra il tab e prova Q1/Q2 a schermo con costo minimo.
3. Cliccare una riga monta **`IRForm objectId={...}`** — che gia' esiste, gia' scrive, gia'
   risolve la view attiva e la precedenza. Zero codice di form nuovo.

Con la 3 la slice **non e' read-only**: eredita l'update completo. Ed e' il punto — l'update
non va riscritto, va **ospitato**. Se si vuole davvero una prima slice senza scritture, si
monta `IRForm` alla slice 2b e la 2a resta la sola lista.

**Slice 2b — le colonne, cioe' il primo pezzo di motore.** La tabella per-attributo obbliga
a chiudere i tre buchi di §2.2 (letterali di enum, `derived`/`changeable`, e la risalita di
`pointedBy` se si vuole la colonna «referenziato da»). E' li' che nasce `ShapeCtx`, ed e' li'
che serve la risposta a Q4. **Non prima.**

**Slice 2c — create e delete.** `addObject` (Q3) e `lObject.delete()`, con la conferma di
cascata containment che il cascade gia' fa (§3.3) resa **esplicita in UI**: l'utente deve
vedere quanti oggetti contenuti sparisce prima di confermare, perche' il cascade non chiede.

**Fuori dalla Fase 2**: l'estrazione del motore in `jjform/` (aspetta il contratto META,
§0) e il diagramma embedded scopato (§6).

---

## Addendum (2026-08-30) — il bundle e' atterrato, e §0 va letto con questa data accanto

Il §0 di questo report dichiarava assenti `CRUD Manager Simulation.dc.html` e i «Turni
10-13» del proposal. **Era vero quando e' stato misurato** (29/08, e riconfermato il 30/08
all'inizio della slice 2a, entrambe le volte con controllo positivo). Il bundle e' arrivato
**a meta' della slice 2a**, nel commit `e70265529` da un'altra sessione, insieme a un terzo
documento che il §0 non poteva nominare perche' non era stato ancora citato:
`docs/design/design_handoff_instance_node/form-engine-contract.md`.

Il §0 non si riscrive (e' la misura di quel momento, ed e' il precedente di R-E/E-1
applicato a se stessi). Questo addendum dice che cosa cambia e che cosa no.

**Non cambia niente di §1-§6.** Letti i tre documenti: nessuna misura di questo report e'
smentita. Il contratto v0 chiede esattamente il taglio che §5.2 descrive — un modulo puro
`(metamodelShape, instanceData, formSpec) -> formModel` piu' eventi astratti — e le sue
**cinque domande aperte** sono, una per una, le voci del censimento. Le risposte sono a
registro in `docs/decisions.md`, serie R-FORM, sezione «Le cinque domande aperte di
form-engine-contract.md». La piu' rilevante: alla domanda 2 la misura risponde **contro**
l'ipotesi del contratto — la precedenza la fa il **motore**, non l'adapter, perche'
`valueRenderer.ts` e `widgetRenderer.ts` sono gia' puri (§4), e lasciarla all'adapter
terrebbe fuori dal motore l'unica parte gia' portabile.

**Cambia la §8, in un punto.** La proposta di slice diceva «colonna sinistra = metaclassi»,
ed e' quella che il prompt della 2a ha ratificato e che e' stata consegnata. Il **Turno
10b** descrive invece la colonna sinistra come **outline di containment del modello dai
root**, con la creazione appesa all'albero. Sono due navigazioni diverse — estensione per
tipo contro struttura del modello — e solo la seconda ha un posto naturale per la create
della slice 2c. Registrata come **Q8**, aperta.

**Resta vero il §6**: il Turno 13 (ibrido form + diagramma) e il 10c (`Form` come symbol
accanto a Rectangle/Circle, per-metaclasse) sono la superficie che `EditorV2` oggi non sa
scopare. Il 10c e' R-FORM-3 alla lettera e conferma Q5: la `surface` e' una scelta della
view, per metaclasse.

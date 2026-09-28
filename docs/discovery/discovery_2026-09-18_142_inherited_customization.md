# Discovery / Piano — #142 Inherited customization per "Views" e "Data Manager"

**Data**: 2026-09-18
**Branch**: `feat/142-inherited-customization-views`
**Stato**: Fase A **implementata** (Data Manager) e Fase B/B1 **implementata** (canvas rail),
entrambe 2026-09-18. La Fase B è risultata **diversa dal piano iniziale** (§6, riscritto):
NON nella critical zone/sync, ma nel pannello classico `Info.tsx`. Aperto: la creazione di figli
**containment** dal rail del canvas (es. «New Assessment») — è la «create-and-link»/«Add contained»
di Fase A portata sul rail, tocca il percorso di create, step separato (§6). Gate (entrambe le fasi):
`typecheck` 14 pre-esistenti (0 nei file toccati), `build` exit 0; Fase A `npx vitest` area toccata
519/519. Smoke confermato dall'utente via screenshot: Fase A (Data Manager) e Fase B/B1 (canvas rail,
sezione unica REFERENCES con select+drill-in+delete). File toccati: Fase A `InstanceManagerTab.tsx`,
`instanceManagerTab.scss`; Fase B `components/editors/Info.tsx`, `components/editors/info-improvements.scss`.
**Issue**: [FEATURE] Inherited customization for "Views" and "Data Manager" (#142, autore @tmaog).

---

## 1. La richiesta, riformulata come specifica

Dato un elemento che referenzia un'altra classe via associazione o composizione
(esempio della issue: `Phase` → `iSQD_Profile` tramite l'associazione `learners`, `1..*`):

1. **Editing inline del referenziato** — aprire/editare `iSQD_Profile` direttamente dalla
   schermata di `Phase`, senza navigare alla lista dei profili.
2. **Gestione della relazione senza il workflow "edge"** — creare/aggiungere un `learner`
   dalla schermata di `Phase`, senza essere costretti a passare dalla creazione manuale
   dell'edge.
3. **Ereditarietà della customization** — l'editor inline riusa la customization già
   definita per `iSQD_Profile`, invece di ricadere su una vista generica.

Gli screenshot allegati sono del **Data Manager**. Il titolo cita anche "Views" (il canvas),
che è un caso distinto e più grande (§6).

Criterio di accettazione (Fase A, Data Manager): selezionata un'istanza di `Phase`, per ogni
slot reference non-containment è possibile (a) aprire il form del target — reso con la vista IR
della metaclasse del target — e (b) creare un nuovo target collegandolo allo slot in un solo
gesto, il tutto senza aprire il canvas né disegnare un edge.

---

## 2. Stato del codice (accertato)

### 2.1 Il Data Manager
`frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (3208 righe). Tre pannelli:
metaclassi · tabella istanze · drawer form. Il drawer monta
`frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` con `host="manager"`.

### 2.2 La customization è già ereditata dal tipo del soggetto — punto 3 quasi gratis
`IRForm` risolve la vista in base alla **metaclasse dell'oggetto passato**, via
`useIRFormView(objectId, DATA_MANAGER_VIEWPOINT_ID)`
(`frontend/src/components/editor-v2/viewpoint/ir/useIRFormView.ts`). Quindi montare
`<IRForm objectId={targetId} host="manager" />` rende il target **con la sua** customization.
Nessun lavoro nuovo per il punto 3: è una conseguenza dell'architettura già presente.

### 2.3 Il meccanismo inline esiste già — ma solo per il containment
- `frontend/src/jjform/nav.ts`: `NavState`, `drillInto` (tronca sui cicli), `truncateTo`,
  `breadcrumbOf`, `rendersInline(depth)` con `INLINE_DEPTH_LIMIT = 1` (inline al depth 0,
  drill-in oltre).
- `InstanceManagerTab.tsx`:
  - `inlineChildren` (≈:1796) scorre **`shape.children`** (slot di containment) e legge gli id
    dei figli con `childrenIn(idlookup, formSubjectId, c.key)`.
  - Il render inline (≈:3050-3087) monta un `IRForm` annidato per ogni figlio quando
    `rendersInline(formDepth)`, altrimenti un link di drill-in. Navigazione via `drillTo` +
    `NavState` + breadcrumb (≈:2961).
  - La barra "Add contained" (≈:3124) crea figli di containment: `openCreate(child.of,
    subjectId, child.key)`.

### 2.4 Le reference (associazioni) oggi
`ClassShape` (in `frontend/src/jjform/shape.ts`) separa:
- `children: RefShape[]` — reference di **containment** ("containment creates");
- `refs: RefShape[]` — reference **non-containment** ("reference selects"); `RefShape.composition`
  è il flag che distingue.

Nel form, uno slot reference è reso da `ReferenceWidget`/`ListWidget`/`ChipsWidget`
(`IRFormField.tsx:341-386`): permette di **scegliere** un target esistente
(`ReferencePicker`), ma **non** di editarlo inline né di crearne uno nuovo. La `ListWidget`
Add è un picker su elementi esistenti — la creazione di un nuovo target richiede oggi di
navigare alla sua lista. È esattamente la lamentela della issue.

### 2.5 Il write path del Data Manager NON è il sync layer
- Le scritture di valore passano da `formWrite.ts` (`appendValue(objectId, key, value, isPtr)`).
  Aggiungere un pointer a uno slot reference è `appendValue(..., true)`.
- La create passa da `createAdapter.applyCreate(modelId, shape, draft)`, che **ritorna l'id
  creato** (`InstanceManagerTab.tsx:2185`) — quindi "crea nuovo target, poi collega" è fattibile
  concatenando `applyCreate` + `appendValue`.
- Nessuno di questi percorsi crea edge di canvas (`DVoidEdge.new2/new3`) né apre una TRANSACTION
  attorno ai creator. **Fase A resta fuori dalla critical zone (§3 CLAUDE.md).**

---

## 3. Fase A — Data Manager (perimetro raccomandato per primo)

### A0. Modello di navigazione — decisione UX ratificata
Riusare **la stessa** macchina di navigazione del containment (`NavState`/`drillInto`/
`breadcrumbOf`/`rendersInline`): un solo modello di navigazione per containment e reference,
la scelta più omogenea. Dove containment e reference devono divergere, preferire il **drill-in**
(scelta utente 2026-09-18): le reference hanno fan-out molto maggiore (un `1..*` può puntare a
molti target), quindi la presentazione primaria delle reference è il **link di drill-in** con lo
stesso breadcrumb, non l'inline sempre-aperto. L'inline-al-depth-0 resta possibile e coerente col
containment, ma non è il default per gli slot reference multivalued.

Nota da fissare in implementazione: il breadcrumb del containment è un albero; con le reference il
grafo ha cicli e nodi condivisi. `drillInto` già tronca sui cicli. Serve un `NavStep.kind`
(`'containment' | 'reference'`) o equivalente per (a) etichettare il segmento e (b) segnalare che
il target è **condiviso** (editarlo inline edita l'istanza referenziata da tutti). Questo è
l'unico ritocco eventuale a `nav.ts`.

### A1. Editing inline / drill-in delle reference
- Nuovo memo `inlineRefs`, speculare a `inlineChildren`, che scorre **`shape.refs`** invece di
  `shape.children` e legge i target degli slot reference del soggetto corrente.
- Nuova sezione "References" nel drawer che, per ogni slot, presenta i target come link di
  drill-in (default) che aprono `<IRForm objectId={targetId} host="manager" />` — eredita la
  customization (§2.2). Riusa `drillTo`/`NavState`/breadcrumb esistenti.
- Cue UI: il target è condiviso; renderlo esplicito (badge/tooltip) perché l'edit non è locale a
  `Phase`.

### A2. Crea-e-collega senza edge
- Barra speculare a "Add contained" (≈:3124) per gli slot **reference** non saturi (rispetto
  all'`upper`), con due gesti:
  - **Link existing** — riusa il picker su target esistenti (`appendValue(sourceId, refKey, id,
    true)`).
  - **Create new** — apre `DraftDialog` sulla metaclasse target come **root create**
    (`openCreate(targetCls, null, null)`); al commit, dopo `applyCreate` che ritorna `createdId`,
    esegue `appendValue(sourceId, refKey, createdId, true)`. Serve un piccolo stato "link-back"
    (`{ sourceId, refKey }`) ricordato durante il draft e consumato in `commitDraft`.

### A3. Write path e conformità alle regole
- Tutto via `formWrite`/`applyCreate` esistenti.
- **Nessun** TRANSACTION attorno ai creator (§3.3). **Nessun** edge di canvas → guardie §3.4 non
  toccate. Nessun Layer Impact Report richiesto (§3.2: non tocca sync/D-L).
- Design system: nuove sezioni riusano i token e le classi `instance-manager__*` esistenti;
  nessun nuovo CSS var fuori da `styles/tokens/` (§7.2). Bootstrap Icons (§7.1).

### A4. File previsti (Fase A) e nota Regola 19
1. `components/abstract/tabs/InstanceManagerTab.tsx` — `inlineRefs`, sezione References,
   barra create-and-link, link-back in `commitDraft`.
2. `components/abstract/tabs/instanceManagerTab.scss` — stili delle nuove sezioni (unità logica
   accoppiata al componente, cfr. RC-11).
3. `frontend/src/jjform/nav.ts` — solo se si aggiunge `NavStep.kind` per distinguere
   reference/containment nel breadcrumb.
4. `frontend/src/jjform/__tests__/nav.test.ts` — copertura del nuovo campo/regola, se introdotto.
5. Eventuale test del tab in `components/abstract/tabs/__tests__/`.

Sono ~4–5 file, alla soglia della **Regola 19** (5 file → pausa e conferma). Da dichiarare in
testa al prompt di implementazione. Nessuna interfaccia esportata modificata salvo eventuale
aggiunta di un campo **opzionale** a `NavStep` (§11 delle regole: consentito).

### A5. Gate di verifica (Fase A)
- `npm run typecheck` senza nuovi errori (baseline 33).
- `npm run build` verde.
- `npm run test` sui file toccati (`jjform/__tests__/nav.test.ts`, eventuali test del tab).
- Smoke visivo: importare/aprire un modello con un'associazione `1..*` (tipo `Phase`→`learners`
  →`iSQD_Profile`), selezionare un `Phase`, verificare (a) drill-in sul target con la sua
  customization, (b) create-and-link di un nuovo profilo.

---

## 4. Cosa NON fare in Fase A
- Non toccare `IRForm`/`IRFormField`/`ListWidget` per iniettare il comportamento inline: il tab
  ospita questi tre componenti invariati (li monta anche il rail del canvas). Il nesting si fa
  **nel tab**, come già per il containment (motivazione ai commenti :3044-3049 e :3096-3102).
- Non introdurre creazione di edge di canvas.
- Non wrappare i creator in TRANSACTION (§3.3).

---

## 5. Rischi e punti aperti (Fase A)
- **Fan-out**: un `1..*` con molti target può allungare il drawer → default drill-in mitiga
  (A0), da confermare visivamente.
- **Target condiviso**: editare inline il referenziato edita l'istanza condivisa; è la semantica
  voluta ma va comunicata (cue UI, A1).
- **Cicli nel grafo delle reference**: coperti da `drillInto` (troncamento), da verificare con un
  modello che ha reference cicliche.
- **`NavStep.kind`**: se aggiunto, è un campo opzionale su un'interfaccia esportata (consentito
  §11); tenerlo opzionale per non rompere i call site.

---

## 6. Fase B — "Views" / canvas (IMPLEMENTATA come B1; l'ipotesi iniziale era errata)

**Ipotesi iniziale (superata):** si pensava toccasse la critical zone (`useJjomSync.ts`,
`useM1ReferenceEdges.ts`, `portDistribution.ts`, `canvasToJjom.ts`, guardie `DVoidEdge`).
La discovery l'ha **smentita**:

- Il rail Properties del canvas rende `Info.tsx` (**pannello classico**, `Info.object`), **non**
  `IRForm` — `IRForm` è montato solo nel Data Manager (host `manager`). Quindi il meccanismo di
  Fase A non si trapianta.
- **Creare una reference via slot-write RENDE GIÀ l'edge** sul canvas: `useM1ReferenceEdges`
  (§3.5) crea reattivamente il `DVoidEdge` per un `SetFieldAction` su `DValue.values`, add-only,
  guardia pair-key (§3.4). Quindi «associazione senza workflow edge» è **già supportata a livello
  dati** — il sync **non va toccato**.

**Scelta utente (2026-09-18):** perimetro **B1** (drill-in), UX «sezione References nel pannello
classico». Poi, su feedback («learners due volte» + «× non funziona»), pivot all'**opzione Y**:

- Le reference non-containment vivono in **una sola sezione REFERENCES** (`Info.references`),
  tolte dagli SLOTS (niente doppione).
- Ogni reference: **select** (cambia/aggiungi target, riusa `LValue.validTargetsJSX`),
  **drill-in** (scrive `_lastSelected` → il rail segue e rende il target con la sua customization,
  idioma di `MetamodelContents.handleSelect`), **×** (clear). La sezione **filtra i buchi**, quindi
  la × fa **sparire la riga** invece di lasciare «-----» (il renderer classico tiene i buchi).
- Tutte le scritture via `setValueAtPosition` esistente — **nessun cambio core/sync**.

**Diagnosi del «× non funziona» (pre-esistente, non regressione):** il clear scrive
`values[i]=undefined` (buco), convenzione di tutta l'app; il Data Manager nasconde i buchi, il
renderer classico degli SLOTS (`keepempties`) li mostra come «-----». L'opzione Y li nasconde
nella sezione REFERENCES. Il fix «alla radice» (buco che sparisce dall'array) resterebbe un cambio
core L-layer (Rule 5), non fatto.

**File Fase B (2):** `frontend/src/components/editors/Info.tsx`,
`frontend/src/components/editors/info-improvements.scss`. Commit `9625d1372`.

**Aperto (step separato):** creazione di figli **containment** dal rail del canvas (es. «New
Assessment»): il pannello classico lega solo oggetti esistenti (select su `validTargets`), non crea.
È la «Add contained»/«create-and-link» di Fase A portata sul rail — tocca il percorso di create
(D-layer), fuori da B1.

---

## 7. Riepilogo esecutivo
- Punto 3 (ereditarietà) è già fornito da `IRForm` + `useIRFormView`.
- Punti 1 e 2, per il Data Manager, sono un'**estensione** del meccanismo inline/drill-in
  esistente da `shape.children` a `shape.refs`, più una barra create-and-link che concatena
  `applyCreate` + `appendValue`. Fuori dalla critical zone, ~4–5 file.
- Il caso canvas ("Views") è la Fase B, nella critical zone, da fare separatamente.

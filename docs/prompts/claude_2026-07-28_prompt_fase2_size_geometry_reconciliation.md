# Fase 2 — Riconciliazione size ↔ geometria degli object node IR (fix edge-gap + fix collapse)

> **Nome del documento prompt**: 2026-07-28 15:39
> Esecuzione **single-phase autorizzata**, ma con **Passo 0 read-only obbligatorio + HARD STOP se le
> assunzioni si rompono**, e **HARD STOP dopo la build (nessun commit prima della conferma visiva di
> Alfonso)**. Due commit tematici con verifica visiva in mezzo.

Leggi `CLAUDE.md` prima di iniziare. Se un punto contraddice `CLAUDE.md`, segnala il conflitto invece
di eseguirlo. Leggi `docs/claude-code-log.md` per il contesto recente.

Branch di lavoro: `alfonso-frontend-jjtl`.

Base del task: `docs/discovery/discovery_2026-07-28_size_geometry_reconciliation.md` (Fase 1, già
eseguita). I `file:riga` sotto vengono dal report; la working tree è ahead of origin, **possono essere
shiftati: conferma leggendo i file reali prima di ogni edit.**

## Contesto e RCA (già stabilita, NON reimplementare la diagnosi)

Due anomalie sulla view IR di uno State (`rounded`, pill "S1"/"S2"), **stessa radice**: l'object node
IR non ha una size definita sul box che React Flow misura.

- **Anomalia A — collapse all'attivazione del Resizable.** Con `resizable:true`, `ObjectNode` emette
  il marker `ir-resizable` sul `.mm-node`; la regola `.mm-node.ir-resizable { min-width:0;
  min-height:0; width:100%; height:100% }` azzera il floor 140×40 e impone `100%`. Ma il nodo RF non
  ha width/height esplicite (il transformer non le emette e non c'è stato resize) → `100%` contro un
  contenitore senza dimensione + `min:0` → collasso a min-content (la pill minuscola).
- **Anomalia B — edge che non toccano il bordo (content-hug).** Gli handle sono posizionati sul
  bounding box **misurato** del `.mm-node` (`DynamicHandles` legge `getBoundingClientRect`), non da
  `raw.w/h`. In content-hug `.mm-node` è floorato a 40px, ma `.ir-node-content` (il bordo visibile)
  ha `height:100%` che **non si risolve** contro l'altezza indefinita del `.mm-node` → resta a
  content-hug (~24px). Risultato: handle sul box da 40px, bordo visibile più corto → gap verticale.
  Il gap è un **artefatto del floor**: appare solo quando il contenuto è più piccolo del floor (con
  contenuto ≥ floor, `.mm-node` e `.ir-node-content` coincidono già).

## Decisioni di design ratificate (NON rimetterle in discussione)

- **Fix A — marker `ir-sized` (niente seed, niente stato).** Il neutralizer che fa collassare va
  applicato **solo quando esiste una size esplicita** (RF top-level `width/height`, settate da resize
  manuale/propagazione), non quando è semplicemente `resizable`. Si introduce un marker CSS nuovo
  `ir-sized`, emesso da `ObjectNode` quando il nodo ha una size esplicita, e la regola neutralizer
  passa da `.mm-node.ir-resizable` a `.mm-node.ir-sized`. Effetto: abilitare Resizable mantiene il
  content-hug (nessun collasso), le maniglie compaiono, il primo drag setta la size → `ir-sized` →
  il box riempie la dimensione. Sopravvive al reload. **Nessun `view.ir.size`, nessun campo schema
  nuovo in questa fetta** (il default-lock durevole è una fetta separata futura).
- **Fix B — reconcile box-model.** Far sì che, in content-hug, il bordo visibile (`.ir-node-content`)
  raggiunga il box misurato (`.mm-node`) quando il floor è vincolante, così handle e bordo
  coincidono. Meccanismo esatto scelto al Passo 0 (vedi COSA Commit 1). Preserva il content-hug: il
  nodo resta ≥ floor, cambia solo che l'interno lo riempie.
- **Read-back FUORI SCOPE.** Non far rileggere `DVertex.w/h` al transformer. Con `ir-sized` il
  collapse è risolto anche al reload senza toccare la critical zone. La persistenza al reload del
  resize per-istanza resta il gap noto già accettato (fetta separata futura, con LIR).
- **Tutto render-side, fuori critical zone.** Non si scrive D-layer, non si emette `style` dal
  transformer, non si tocca il gate `sizeChanged`. **Niente LIR.**

## Passo 0 — Orientamento read-only (OBBLIGATORIO, HARD STOP se diverso dalle assunzioni)

Leggi i file reali e **conferma o smentisci** ognuno di questi punti. Se un punto è materialmente
diverso da come descritto qui, **FERMATI e segnalalo** prima di editare: adatto il piano.

1. **CSS `.mm-node` / `.ir-node-content`** (`viewpoint/ir/irStyle.ts` + `EditorV2.scss`): il
   `display`/contesto flex del `.mm-node` degli IR node; dove vive il floor 140×40 (report:
   `EditorV2.scss:~1208` `.mm-node { min-width:140px; min-height:40px }`); come `.ir-node-content`
   dimensiona (report: `irStyle.ts:~18` `width:100%; height:100%`). **Questo decide il meccanismo del
   Commit 1** (vedi sotto).
2. **Perché ellipse/circle/diamond NON collassano già** (hanno `canResize=true` di default, quindi
   oggi montano `ir-resizable` + neutralizer come il rect). Se collassano anche loro, `ir-sized` li
   sistema (bene). Se **non** collassano, trova il perché (una regola `ir-shape--ellipse/circle/diamond`
   che impone una min-size in `irStyle.ts`?) per **non regredirli** col passaggio a `ir-sized`.
   Riporta le regole shape rilevanti.
3. **Segnale "size esplicita" leggibile in `ObjectNode`**: `NodeProps` espone `width`/`height`
   top-level (assenti in content-hug, presenti dopo resize/propagazione), oppure quei campi
   riflettono il **measured** (sempre presenti)? Se `NodeProps.width/height` riflettono il measured,
   il discriminante va letto dallo store RF: `useStore(s => { const n = s.nodeLookup.get(id); return
   n?.width != null && n?.height != null; })` (la size **esplicita**, non `measured`). Conferma quale
   dei due riflette la size esplicita settata da `NodeResizer`/propagazione (`EditorV2.tsx:~993-995`
   setta `n.width/n.height`; `resetNodeSize:~2316` le rimuove). **Questo decide come si calcola
   `hasExplicitSize` nel Commit 2.**
4. **Usi residui della classe `ir-resizable`**: `grep -rn "ir-resizable"` in tutto il frontend. È
   usata **solo** dalla regola neutralizer, o anche altrove (cursor/handle/altro stile, o logica JS)?
   Se è usata solo dal neutralizer, dopo aver spostato la regola su `ir-sized` la classe
   `ir-resizable` resterebbe emessa ma inerte: **non rimuoverla in questa fetta** (segnalala nel log
   per una decisione separata di Alfonso; niente rimozione di codice "apparentemente inutilizzato").
5. **Marker element e composizione className in `ObjectNode`**: conferma la riga (report:
   `ObjectNode.tsx:~384`) `className={\`mm-node ... ${canResize ? ' ir-resizable' : ''}\`}` e che il
   marker è sul `.mm-node` (non su `.ir-node-content`). Conferma che `id` è disponibile in `ObjectNode`
   (serve per lo store se punto 3 richiede `useStore`).
6. **Grep di collisione** per la classe nuova: `grep -rn "ir-sized"` — deve dare **zero** risultati
   (nome libero). Se esiste già, **fermati**: scegliamo un altro nome.

Riporta i 6 punti in chat/log con `file:riga`. Se i punti 1/2/3 confermano le assunzioni, procedi
single-phase ai commit. Se divergono, HARD STOP.

## Ambito file (nessun altro). Render-side, fuori critical zone.

- EDIT: `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (Commit 1: reconcile box-model;
  Commit 2: sposta il neutralizer su `.mm-node.ir-sized` + azzera eventuali floor sotto `ir-sized`)
- EDIT: `frontend/src/components/editor-v2/EditorV2.scss` (**solo se** il Passo 0 stabilisce che il
  fix B va fatto qui, es. il floor del `.mm-node`; altrimenti non toccarlo)
- EDIT: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (Commit 2: calcolo `hasExplicitSize`
  + emissione marker `ir-sized`)
- EDIT: `docs/claude-code-log.md` (due entry, una per commit)

**Fuori perimetro, NON toccare**: `hooks/useJjomSync.ts`, `utils/portDistribution.ts`,
`sync/canvasToJjom.ts` (critical zone); `utils/jjomTransformers.ts` (**niente read-back**,
`objectVertexToRFNode` invariato); `viewpoint/ir/irTypes.ts` (**niente campo `size`/schema**);
`irCompile.ts`/`irValidate.ts`; il memo feature-picker in `VertexAuthoringPanel.tsx`; l'editor
classico; `GraphVertexViewIR`; il mount/props del `<NodeResizer>` (gate `isNodeResizable(canResize)`
invariato: le maniglie continuano a comparire in base a `canResize`, non a `ir-sized`).

## COSA

### Commit 1 — Fix B (reconcile box-model, solo CSS)

**Obiettivo**: in content-hug, quando il floor è vincolante, il bordo visibile (`.ir-node-content`)
raggiunge il box misurato (`.mm-node`), così handle e bordo coincidono. Preservare il content-hug (il
nodo resta ≥ floor).

Scegli il meccanismo **in base al Passo 0 punto 1**:

- **Se `.mm-node` è un flex column** (`display:flex; flex-direction:column`): fai **stretchare**
  `.ir-node-content` sull'asse principale così riempie il `.mm-node` floorato. Edit minimo su
  `.ir-node-content` (es. `flex: 1 1 auto;` — conferma che l'asse trasversale già stretcha, la width
  è ok). Questo copre **sia** il content-hug floorato **sia** la size esplicita (ir-sized) con una
  sola regola, senza toccare il floor.
- **Se `.mm-node` è block (o non-flex)**: floora il **bordo visibile** replicando il floor del
  `.mm-node` su `.ir-node-content` (es. `min-width:140px; min-height:40px`, **usa i valori reali
  trovati al Passo 0**). Così `.ir-node-content` raggiunge il floor e il `.mm-node` (che hugga il
  contenuto) coincide. **Attenzione**: questo min va **azzerato sotto `ir-sized`** nel Commit 2 (per
  permettere il resize sotto 40px); annotalo e fallo nel Commit 2.

`.ir-node-content` è IR-specifico (solo gli IR node ce l'hanno) → la regola è **già scopata** agli IR
node; **non** aggiungere `:has()` né toccare le regole di `.mm-node` condivise con class/package/enum
node. Non toccare le regole shape (`ir-shape--*`).

Riporta nel log **quale meccanismo** hai scelto e perché (dal Passo 0 punto 1).

**Verifica build** (`npm run build` pulito) → **HARD STOP**. Aggiorna `docs/claude-code-log.md`
(entry Commit 1). Nessun commit prima della conferma visiva di Alfonso. Dopo il suo OK: `git add` dei
**soli** file del Commit 1, messaggio una riga inglese:
`fix: IR object node content fills the node box so edges meet the visible border`

### Commit 2 — Fix A (marker `ir-sized`)

Solo dopo la verifica visiva del Commit 1.

1. **`ObjectNode.tsx`** — calcola `hasExplicitSize` col segnale confermato al Passo 0 punto 3
   (o `NodeProps.width/height` top-level, o `useStore` sulla size esplicita del `nodeLookup`,
   **non** `measured`). Emetti `ir-sized` sul `.mm-node` **in modo additivo**, accanto all'emissione
   esistente di `ir-resizable` (che **resta invariata**):

   ```tsx
   // esempio, adatta ai nomi reali
   const hasExplicitSize = /* Passo 0 punto 3: width/height esplicite presenti */;
   // className del .mm-node, additivo:
   `mm-node ... ${canResize ? ' ir-resizable' : ''}${hasExplicitSize ? ' ir-sized' : ''}`
   ```

   Nessun'altra modifica a `ObjectNode` (non toccare il ramo nativo, il `<NodeResizer>`, `canResize`,
   `hasGeometricShape`).

2. **`irStyle.ts`** — **sposta** la regola neutralizer da `.mm-node.ir-resizable` a
   `.mm-node.ir-sized` (stesso corpo `min-width:0; min-height:0; width:100%; height:100%`). Se al
   Commit 1 hai floorato `.ir-node-content` (variante block), aggiungi qui l'azzeramento sotto
   `ir-sized`:

   ```css
   .mm-node.ir-sized { min-width: 0; min-height: 0; width: 100%; height: 100%; }
   .mm-node.ir-sized .ir-node-content { min-width: 0; min-height: 0; }  /* solo se Commit 1 variante block */
   ```

   Non lasciare la vecchia regola `.mm-node.ir-resizable` col neutralizer (la sposti, non la
   duplichi). Non toccare le regole shape.

**Interazione da verificare a mano** (la descrive la sezione Verifica): con `ir-sized` legato alla
size esplicita, il resize manuale di ellipse/circle/diamond e di rect/rounded deve continuare a
funzionare (al primo delta di drag la size esplicita compare → `ir-sized` → il box riempie).

**Verifica build** (`npm run build` pulito) → **HARD STOP**. Aggiorna `docs/claude-code-log.md`
(entry Commit 2, includendo l'esito del Passo 0 punto 4 su `ir-resizable`). Nessun commit prima della
conferma visiva. Dopo l'OK: `git add` dei **soli** file del Commit 2, messaggio una riga inglese:
`fix: gate IR node fill-neutralizer on explicit size so enabling resize no longer collapses the node`

## COME

- Passo 0 prima di tutto; leggi per intero ogni file prima di editarlo.
- Edit puntuali (`str_replace`), non riscritture. **Zero refactoring opportunistico**, nessun
  rinomino di identificatori/classi esistenti. L'unica classe nuova è `ir-sized` (grep di collisione
  al Passo 0 punto 6).
- Non modificare interfacce TS esistenti; non rimuovere `ir-resizable` (Passo 0 punto 4).
- `npm run build` pulito dopo **ogni** commit. **HARD STOP dopo ogni build**, nessun `git add`/commit
  prima della conferma visiva di Alfonso. Ordine tassativo: prima Commit 1 (B), verifica visiva, poi
  Commit 2 (A).
- `git add` dei **soli** file dichiarati per ciascun commit (mai `git add .`, mai `git commit -a`).
  Nessun push.

## Verifica manuale (Alfonso, http://localhost:3001, hard-refresh tra i passi)

**Dopo Commit 1 (fix B):**
1. Su una view State content-hug (resizable off), gli edge/transizioni **toccano il bordo** dello
   State (gap chiuso), sia in ingresso che in uscita.
2. Nessuna regressione sui box a compartimenti (class diagram) né su package/enum: dimensioni e
   content-hug invariati.
3. Una view con contenuto **più alto del floor** (label lunga/multi-riga) resta invariata (già
   coincideva).

**Dopo Commit 2 (fix A):**
4. Spuntando "Resizable" su una view rounded/rect mai ridimensionata, il box **NON collassa**: resta
   alla dimensione content-hug, le maniglie compaiono.
5. Trascinando una maniglia il box si ridimensiona correttamente e riempie la nuova dimensione; si
   può scendere fino a ~24px.
6. Deselezionando "Resizable" (torna content-hug) il box resta coerente (nessun collasso, nessun
   rimbalzo anomalo).
7. **Reload del progetto** con una view resizable mai ridimensionata: nessun collasso (resta
   content-hug). Un resize per-istanza può tornare al default dopo reload: **atteso** (read-back fuori
   scope).
8. Ellipse/circle/diamond: comparsa maniglie e resize invariati rispetto a prima; nessun collasso
   nuovo.
9. Build pulita, nessun errore console sui nodi.

## RIFERIMENTI (hint, numeri da confermare)

- Report Fase 1: `docs/discovery/discovery_2026-07-28_size_geometry_reconciliation.md`.
- Marker/neutralizer/collapse: `nodes/ObjectNode.tsx` (ramo IR, className `.mm-node` ~:384,
  `canResize`/`hasGeometricShape` ~:378-395, `<NodeResizer>`), `viewpoint/ir/irStyle.ts`
  (`.mm-node.ir-resizable` ~:80, `.ir-node-content` ~:18, regole `ir-shape--*`), `EditorV2.scss`
  (floor `.mm-node` ~:1208-1213).
- Segnale size esplicita: `EditorV2.tsx` (propagazione setta `n.width/height` ~:993-995,
  `resetNodeSize` ~:2316), `DynamicHandles.tsx` (handle dal `getBoundingClientRect` del `.mm-node`
  ~:127-131).
- Fuori scope (critical zone / read-back): `hooks/useJjomSync.ts` (gate `sizeChanged` ~:1356-1377),
  `utils/portDistribution.ts`, `utils/jjomTransformers.ts` (`objectVertexToRFNode`).
- Sizing: `nodes/nodeSizing.ts` (`isNodeResizable`, `NODE_SIZING_DEFAULTS.objectNode`,
  `SHAPE_MIN_SIZE=24`, `defaultResizableForForm`).

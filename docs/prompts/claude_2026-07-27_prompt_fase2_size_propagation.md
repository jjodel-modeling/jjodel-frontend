# Fase 2 — Propagazione della size a tutte le istanze di una view (con Layer Impact Report)

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.
Se un punto contraddice `CLAUDE.md`, segnala il conflitto invece di eseguirlo.

Branch di lavoro: `alfonso-frontend-jjtl`.

**CRITICAL ZONE + LIR OBBLIGATORIO.** Questa feature scrive nel D-layer (`DVertex.w/h`) e tocca
`sync/canvasToJjom.ts` (critical zone). Il flusso e' a due hard-stop:
1. **Passo 0 + Layer Impact Report → HARD STOP**: nessun edit al codice di feature finche' Alfonso
   non da' go-ahead sull'LIR.
2. Dopo il go-ahead: implementazione scoped → **HARD STOP dopo la build, nessun commit** fino alla
   conferma visiva di Alfonso.

Base del task: `docs/discovery/discovery_2026-07-27_size_propagation.md` (Fase 1, gia' eseguita). I
`file:riga` sotto vengono da quel report; possono essere shiftati: **conferma leggendo il file**.

## Contesto

Accanto alla checkbox "Resizable" nel `VertexAuthoringPanel` (appena aggiunta), un **pulsante** che
prende la dimensione dell'istanza sorgente (il nodo appena ridimensionato con le maniglie) e la
propaga **uguale a tutte le istanze rese da quella view nel viewpoint corrente**.

Finding chiave della discovery (Q1), da NON dimenticare: per gli object node la size scritta su
`DVertex.w/h` **non viene riletta** (`objectVertexToRFNode` legge solo x/y). Quindi il render della
size deve passare da **`setNodes`** (width/height top-level sul nodo RF, come fa il `NodeResizer`);
la scrittura D-layer serve per la geometria degli edge e per coerenza col resize manuale, ma da sola
e' inerte sul box.

## Decisioni ratificate da Alfonso (NON rimetterle in discussione)

- **Bersaglio**: tutte le istanze che risolvono a QUESTA view nel viewpoint corrente
  (`compiled.viewId === view.id`). La sorgente e' inclusa (no-op su di lei).
- **Durabilita' (in-sessione ora)**: propagazione via `setNodes` + scrittura D-layer. **La
  sopravvivenza al reload e' FUORI SCOPE**: e' un gap pre-esistente del read-back
  (`objectVertexToRFNode` non rilegge w/h), che sara' una fetta separata. **NON toccare
  `jjomTransformers.ts` / `objectVertexToRFNode`**. La size propagata regge in sessione e si perde al
  reload, esattamente come il resize manuale di oggi. Comportamento atteso, non un bug di questa fetta.
- **Sorgente**: **esattamente un** object node **selezionato** che risolve alla view. Se 0 o >1 →
  **no-op con avviso** (non agire). Non "primo selezionato".
- **Scrittura bulk**: **batch, una sola `TRANSACTION`**. Nuova `syncSizeBatchToJjom` in
  `canvasToJjom.ts`, gemella di `syncPositionBatchToJjom`. NON usare un loop di `syncSizeToJjom`.
- **Wiring**: **CustomEvent** pannello → EditorV2, sul modello di `SELECT_NODE`. Il pannello ha
  `view.id`, non conosce il canvas: la sorgente e i target li risolve EditorV2.
- **Gate del bottone**: disabilitato quando la view non e' resizable (`canResize` falso).

## Passo 0 — Orientamento read-only + Layer Impact Report (OBBLIGATORIO, HARD STOP)

Leggi i file reali e conferma i punti d'innesto. Poi **scrivi un Layer Impact Report** e **FERMATI**:
nessun edit al codice, aspetta il go-ahead di Alfonso.

Conferma con `file:riga`:
1. `canvasToJjom.ts`: forma esatta di `syncPositionBatchToJjom` (~:54-63) e di `syncSizeToJjom`
   (~:72-78), per specchiare marker anti-bounce (`markCanvasUpdated`) + label `TRANSACTION`.
2. `EditorV2.tsx`: il pattern del listener `SELECT_NODE` (`handleSelectNode` ~:893-910), come si
   registra/deregistra, e le deps. Conferma che `getNodes`/`setNodes`, `store`, `getIRIndex`,
   `computeIRSignature`, `resolveIRView`, `makeReadCtx`, `scheduleLayoutSave` sono in scope (o gli
   import da aggiungere). Conferma il pattern `resetNodeSize` (~:2258-2263) per il reset di `measured`.
3. `VertexAuthoringPanel.tsx`: la riga della checkbox Resizable (~:258-265), la variabile `canResize`
   gia' calcolata (~:260), e gli import UI (`Button` gia' presente?).
4. `events/registry.ts`: il gruppo Canvas e la posizione di `SELECT_NODE` (~:19). **Grep** che la
   stringa `jjodel:propagate-view-size` e la chiave `PROPAGATE_VIEW_SIZE` non esistano gia'.
5. Come un object node RF espone la view risolta e l'oggetto: `data.instanceOfClassId`
   (`ObjectNode.tsx:50`), `lookup[nodeId].model` = DObject id, `resolveIRView(objectId, classId,
   index, readCtx, lookup).viewId`.

**Layer Impact Report** (salvalo in `docs/discovery/lir_2026-07-27_size_propagation.md`; se il
progetto ha un'altra sede per gli LIR, usala e dillo). Contenuto minimo:
- **Campi/azioni D-layer scritti**: `DVertex.w` e `DVertex.h` via `SetFieldAction.new(vertexId,
  'w'/'h', value, undefined, false)` dentro UNA `TRANSACTION` (nuova `syncSizeBatchToJjom`).
- **Reconcile/sync che potrebbero scattare**: `useJjomSync` gate `sizeChanged` su
  `style.width/height` → gli object node non emettono `style` → **non ripatcha** (nessun conflitto);
  `markCanvasUpdated` anti-bounce; `portDistribution` NON coinvolto; geometria edge
  (`computeOptimalHandles` legge `raw.w/raw.h`) resta coerente.
- **Blast radius**: solo gli object node che risolvono alla view; nessun altro tipo di nodo, nessun
  altro viewpoint.
- **Rollback**: snapshot RF (undo esistente) per il `setNodes`; la scrittura D-layer e' una singola
  `TRANSACTION` = un solo passo di undo.
- **Cosa NON si tocca**: `objectVertexToRFNode`/transformer (read-back fuori scope), `useJjomSync.ts`,
  `portDistribution.ts`, `syncPositionToJjom`/`syncSizeToJjom` esistenti.

**HARD STOP.** Restituisci in chat il riassunto dell'LIR e la lista file. Aspetta il go-ahead.

## Ambito file (5 in scrittura; nessun altro). Solo dopo go-ahead.

- EDIT: `frontend/src/events/registry.ts` (+1 costante evento)
- EDIT: `frontend/src/components/editor-v2/sync/canvasToJjom.ts` (**critical zone**: SOLO aggiunta di
  `syncSizeBatchToJjom`, nient'altro)
- EDIT: `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (bottone)
- EDIT: `frontend/src/components/editor-v2/EditorV2.tsx` (listener + logica)
- EDIT: `docs/claude-code-log.md` (entry finale)

Fuori perimetro, non toccare: `jjomTransformers.ts`/`objectVertexToRFNode`, `useJjomSync.ts`,
`portDistribution.ts`, `syncPositionToJjom`, `syncSizeToJjom`, il memo `featureInfo` del pannello.

## COSA (dopo go-ahead)

### 1. Evento — `events/registry.ts`
Nel gruppo Canvas, dopo `SELECT_NODE`, aggiungi la costante (grep di collisione gia' fatto al passo 0):

```ts
PROPAGATE_VIEW_SIZE: 'jjodel:propagate-view-size',
```

### 2. Primitiva batch — `canvasToJjom.ts` (critical zone: SOLA aggiunta)
Specchio esatto di `syncPositionBatchToJjom` (~:54-63). Non modificare nessun'altra funzione.

```ts
export function syncSizeBatchToJjom(sizes: { vertexId: string; w: number; h: number }[]): void {
    if (!sizes.length) return;
    for (const s of sizes) markCanvasUpdated(s.vertexId);
    TRANSACTION('EditorV2 propagate size', () => {
        for (const s of sizes) {
            SetFieldAction.new(s.vertexId as any, 'w' as any, s.w, undefined, false);
            SetFieldAction.new(s.vertexId as any, 'h' as any, s.h, undefined, false);
        }
    });
}
```

Adatta la firma/lo stile ESATTAMENTE al gemello reale (nomi campo, `markCanvasUpdated`, label). Mai
wrappare `.new()` di creazione: qui sono `SetFieldAction` su campi esistenti, safe in `TRANSACTION`.

### 3. Bottone — `VertexAuthoringPanel.tsx`
Accanto alla checkbox "Resizable" (~:258-265), un `Button` del design system (gia' importato) che
dispatcha l'evento con `view.id`. Disabilitato quando non resizable (riusa `canResize` gia'
calcolato a ~:260). Import di `JjodelEvents` da `events/registry`.

```tsx
<Button
    variant="secondary"
    disabled={!canResize}
    title="Applica questa dimensione a tutte le istanze della view"
    onClick={() => window.dispatchEvent(
        new CustomEvent(JjodelEvents.PROPAGATE_VIEW_SIZE, { detail: { viewId: view.id } })
    )}
>
    Propaga dimensione
</Button>
```

Icona Bootstrap opzionale (unica libreria consentita), es. `bi-arrows-fullscreen`. Nessun tocco al
memo `featureInfo` ne' ai suoi deps. Il bottone e' top-level nel tab Basic, non entra in nessun
`useMemo`.

### 4. Listener + logica — `EditorV2.tsx`
Nuovo `useEffect` con `addEventListener(JjodelEvents.PROPAGATE_VIEW_SIZE, handler)` /
`removeEventListener` nel cleanup, sul modello esatto di `handleSelectNode` (~:893-910). Il handler:

1. `const { viewId } = (e as CustomEvent).detail ?? {}; if (!viewId) return;`
2. Costruisci il contesto resolver una volta:
   `const state = store.getState(); const lookup = state.idlookup;`
   `const index = getIRIndex(state, computeIRSignature(state)); if (!index) return;`
   `const readCtx = makeReadCtx(lookup);`
   Helper locale:
   ```ts
   const resolvesToView = (n) => {
       if (n.type !== 'objectNode') return false;
       const objectId = lookup?.[n.id]?.model;
       const classId = (n.data as any).instanceOfClassId;
       if (typeof objectId !== 'string' || !classId) return false;
       return resolveIRView(objectId, classId, index, readCtx, lookup)?.viewId === viewId;
   };
   ```
   (Conferma le firme reali di `resolveIRView`/`getIRIndex`/`makeReadCtx` dal report / dai file.)
3. **Sorgente** = object node selezionato che risolve alla view:
   `const sources = getNodes().filter(n => n.selected && resolvesToView(n));`
   `if (sources.length !== 1) { <avviso> ; return; }` (no-op con avviso: usa il meccanismo di
   notifica gia' in uso in EditorV2 — Log/toast; **conferma quale** al passo 0, non introdurne uno nuovo).
4. **Size sorgente**: `const src = sources[0]; const w = src.measured?.width ?? (src as any).width;`
   `const h = src.measured?.height ?? (src as any).height; if (w == null || h == null) return;`
5. **Target**: `const targetIds = new Set(getNodes().filter(resolvesToView).map(n => n.id));`
6. **Render (in-sessione)**: `setNodes(nds => nds.map(n => targetIds.has(n.id) ? { ...n, width: w,
   height: h, measured: undefined } : n));` (allinea il reset di `measured` al pattern
   `resetNodeSize` ~:2258-2263).
7. **Persistenza D-layer (batch)**: `syncSizeBatchToJjom([...targetIds].map(id => ({ vertexId: id,
   w, h })));`
8. `scheduleLayoutSave();`

Deps dell'`useEffect`: allineale a quelle di `handleSelectNode` (probabilmente stabili: `getNodes`,
`setNodes`, ecc. da RF sono stabili; il resolver legge da `store.getState()` a runtime, quindi non
serve metterlo in deps). Conferma al passo 0.

## COME
- Passo 0 + LIR + HARD STOP prima di ogni edit. Nessun codice di feature prima del go-ahead.
- Edit puntuali (str_replace). Zero refactoring opportunistico. Nessun rinomino di identificatori.
- Grep di collisione gia' fatto al passo 0 per `PROPAGATE_VIEW_SIZE`, `jjodel:propagate-view-size`,
  `syncSizeBatchToJjom`.
- `npm run build` deve passare pulito.
- **HARD STOP dopo la build.** Niente commit, niente `git add`. Aggiorna `docs/claude-code-log.md`
  (data 2026-07-27 + ora, tipo `feat`, prompt in una riga, file toccati, esito, meccanismo di avviso
  usato al punto 3).
- Commit SOLO dopo conferma visiva di Alfonso. `git add` dei **soli** 5 file (mai `git add .`).
  Messaggio previsto, una riga inglese:
  `feat: propagate resized dimensions to all instances of an IR view`

## Verifica manuale (Alfonso, http://localhost:3001, hard-refresh tra i passi)
1. Seleziona un'istanza di una view resizable, ridimensionala con le maniglie, apri il tab IR e
   clicca "Propaga dimensione": tutte le istanze di quella view prendono la stessa w/h.
2. Il bottone e' disabilitato su una view non resizable.
3. Sorgente ambigua: con 0 o >1 nodi selezionati che risolvono alla view, il bottone non fa nulla e
   avvisa (nessuna scrittura).
4. Gli edge restano agganciati correttamente ai nodi ridimensionati (geometria handle coerente).
5. Nessuna regressione su altri tipi di nodo / altri viewpoint. Build pulita, nessun errore console.
6. **Nota attesa (non un difetto di questa fetta)**: dopo un reload completo la size propagata puo'
   tornare al default, come il resize manuale di oggi. E' il read-back, fetta separata gia' schedulata.

## RIFERIMENTI
- Discovery: `docs/discovery/discovery_2026-07-27_size_propagation.md` (Q1..Q6, verdetto
  critical-zone, write-path proposto, file proposti).
- Write geometria: `sync/canvasToJjom.ts` (`syncPositionBatchToJjom` ~:54-63, `syncSizeToJjom`
  ~:72-78, `markCanvasUpdated`).
- Listener modello: `EditorV2.tsx` (`handleSelectNode` ~:893-910), `resetNodeSize` (~:2258-2263).
- Resolver: `viewpoint/ir/irResolveCore.ts` (`resolveIRView`, `getIRIndex`, `computeIRSignature`),
  `irReadCtxLproxy.ts` (`makeReadCtx`), ri-esportati da `viewpoint/ir/irResolve.ts`.
- Pannello: `viewpoint/authoring/VertexAuthoringPanel.tsx` (checkbox Resizable ~:258-265, `canResize`
  ~:260). Eventi: `events/registry.ts` (gruppo Canvas, `SELECT_NODE` ~:19).
- Read-back fuori scope (fetta futura): `objectVertexToRFNode` in `utils/jjomTransformers.ts`.

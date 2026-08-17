# Discovery 2026-08-17 — Endpoint «container» per l'irKind Edge

**Tipo**: discovery read-only (Fase 1, P4). Nessuna modifica al codice applicativo.
**Base**: branch `alfonso-frontend-jjtl`, HEAD `f6794dc81`, working tree pulito all'avvio (solo il
documento prompt untracked).
**Corsia**: completa (critical zone `viewpoint/ir/`, `viewpoint/authoring/`).
**Governanti dichiarate dal prompt**: serie R-B (R-B9, R-B9-bis, R-B10, R-B12), spec IR v1.2.

## Ipotesi in falsificazione

Il prompt dichiara un'ipotesi di design; questa discovery prova a romperla, non a confermarla.

- **H1** — «il vocabolo `container` è libero per costruzione, perché `parsePathExpr` lo rifiuta».
- **H2** — «token riservato come espressione endpoint intera, persistito nel campo stringa
  esistente»: il campo regge un valore che non è un PathExpr senza che nessun consumatore lo
  interpreti male.
- **H3** — «validazione in `validateIR` (R-B9-bis), render permissivo»: gli endpoint hanno oggi un
  punto di validazione dove innestare la regola.
- **H4** (implicita, la più esposta) — un endpoint `container` **renderizza**: il parent di
  contenimento è raggiungibile al punto di risoluzione e la reattività esiste.

**Esito**: H1 confermata per esecuzione, H2 confermata con due eccezioni misurabili, H3 confermata
ma il punto di validazione è indiretto, **H4 falsificata in un caso su due** — vedi R1 (la forma
«oggetto annidato» non ha nemmeno un nodo su cui appendere l'edge) e R2 (la reattività al re-parent
esiste, ma per un canale non progettato per questo).

## Obiettivo

Rispondere alle sette domande del prompt con citazione `file:riga`, senza proporre diff.

---

## Sintesi in otto righe

1. **Chi risolve gli endpoint**: `synthesizeObjectAsEdges` (`irEdgeViews.ts:165`), chiamata dal memo
   di `useIRContainment` (`:158`), a **render time**. Produce un **edge ReactFlow sintetico**
   (`id: irobj_<objectId>`), mai un DEdge, mai persistito.
2. **Un oggetto con view edge e un solo endpoint resta un NODO**, e la view diventa silenziosamente
   una view reference-as-edge (`irResolveCore.ts:149-165`). Il pannello, per suo conto, si rifiuta
   di persistere un endpoint singolo (`edgeEndpoints.ts:72`).
3. **Il parent di contenimento ha due forme diverse nello stesso progetto**, e la differenza decide
   tutto: gli oggetti creati dal canvas hanno `father = DModel` e il contenimento vive **solo** nel
   pointer dello slot (`canvasToJjom.ts:1337-1343`, «fatherType — MUST be DModel»); quelli creati
   dall'API classica hanno `father = il DValue` di contenimento (`LModelElement.tsx:6964`).
4. **Nella seconda forma l'oggetto non ha un DVertex**: `useJjomSync` crea vertici solo per
   `rawModel.objects` (`:666,759,773`), e un oggetto annidato non è lì (`classes.ts:773-784`,
   commento verbatim: «object containing object is not in any direct child collection»). Senza nodo
   non arriva a `synthesizeObjectAsEdges`, che itera `nodes`.
5. **Esiste già una mappa child→container**: `ContainmentModel.parentOf`
   (`irContainment.ts:40,177-180`), ma è popolata **solo** per i container la cui view risolta è un
   `graphVertex` con `containment` (`:170`). Non è un eContainer generale.
6. **`ReadCtx` non ha alcun accessor di parent** (`irReadCtx.ts:17-32`, sei metodi): il token va
   risolto fuori dagli accessor compilati, oppure il contratto si allarga.
7. **`container` nudo è rifiutato oggi, misurato eseguendo il parser**, non leggendo la regex; e
   `$container.value` (una feature che si chiama davvero `container`) continua a passare: le due
   grafie non collidono.
8. **Reattività al re-parent: c'è, ma incidentale.** Il segnale progettato dell'IR (`oaeSlotsSig`)
   non lo vede; lo vedono due canali generici del sync (`useM1ReferenceEdges` e l'hash per-vertice
   di `useJjomSync`). È il rischio principale della Fase 2 e va deciso, non ereditato.

---

## Metodo

- Ricerche con `command grep` (BSD grep) per bypassare il wrapper `ugrep --ignore-files`
  (CLAUDE.md §5). Ogni asserzione di assenza porta il proprio controllo positivo, dichiarato in
  linea.
- **Due asserzioni di assenza sono state riscritte dopo che il controllo ha rivelato la ricerca
  rotta**: (a) `grep --include=*.ts` non quotato è stato mangiato da zsh («no matches found»: il
  comando non è mai partito); (b) un controllo positivo su `instanceRef` dentro `useJjomSync.ts` ha
  dato 0 — il token non è in quel file, quindi il controllo non aveva segnale e la conclusione che
  stava validando è stata rifatta con un token presente.
- **Il rifiuto di `container` è stato eseguito, non dedotto**: `pathExpr.ts` è puro per contratto
  (l'unico import è un tipo, cancellato al build), quindi è stato caricato con
  `node --experimental-strip-types` e chiamato su sette input, tre dei quali controlli positivi.

### Esecuzione del parser (Q4, evidenza primaria)

```
container                STEP_RE(token)=false  parse=THROW "[ir] invalid PathExpr step "container" in container"
container.value          STEP_RE(token)=false  parse=THROW "[ir] invalid PathExpr step "container" in container.value"
$container.value         parse=OK [{"feature":"container","take":"value"}]     singleHopOf={"feature":"container","take":"value"}
eContainer               parse=THROW "[ir] invalid PathExpr step "eContainer" in eContainer"
$next.value              parse=OK [{"feature":"next","take":"value"}]          <- controllo positivo
$transitions.values      parse=OK [{"feature":"transitions","take":"values"}]   <- controllo positivo
$next.value.$name.value  parse=OK [2 step]                                      <- controllo positivo (multi-hop)
```

I tre controlli passano, quindi i due `THROW` sono un risultato e non un parser rotto.

## File letti (path completi)

Interprete IR:
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — :216-258 (`EdgeViewIR`), :284-326
  (`CompiledPathStep`, `CompiledCrossPath`, `CompiledEdgeView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` — :50-123 (`compilePath`,
  `compileOperand`), :342-416 (`compileTextSource`, `compileEdgeView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` — intero (257 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/edgeEndpoints.ts` — intero (146 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` — :75-78, :120-169, :309-337
- `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts` — :1-17 (intestazione), :28-101,
  :145-217
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` — :55-186
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` — intero (166 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` — intero (85 righe), più esecuzione
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` — intero (52 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irInteraction.ts` — :40-89, :134-138
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` — :175-179, :603-626,
  :662-790 (mondo edge-view di riferimento)

Authoring:
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` — :126-266,
  :274-337, :590-663
- `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` — intero (148 righe)
- `frontend/src/components/ui/PathBuilder/pathExpr.ts` — intero (27 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx` — :88-108

Sync e D-layer (sola lettura):
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — :636-704 (conteggio vertici mancanti),
  :759-773 (`DVertex.new` per oggetti), :1081-1163 (`elementSnapshots` + hash `ch:`), :1330-1410
  (update incrementale)
- `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` — :30-119
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — :1316-1375
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` — :462-506
- `frontend/src/components/editor-v2/EditorV2.tsx` — :1323, :1861-1900 (`handleReconnect`),
  :3809-3863
- `frontend/src/model/logicWrapper/LModelElement.tsx` — :5796-5817 (`DObject`), :6457-6480
  (`DValue`), :6928-6990 (`LValue.get_addObject`)
- `frontend/src/joiner/classes.ts` — :773-784 (`Constructors.DObject`)
- `frontend/src/redux/store.tsx` — :148-149 (root `objects`/`values`)
- `frontend/src/redux/reducer/reducer.ts` — :464-467 (registrazione generica nella cartella di stato)

Governance e spec:
- `docs/decisions.md` — :125-152 (serie R-B ed E-route)
- `docs/PROTOCOL.md` — :32-45 (P4)
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` — indice completo, §3 (:38-44), §6 (:89-116),
  §7 (:116-146), §9-§10 (:163-182)
- `docs/spec/spec_2026-06-08_ir_schema_v1_1.md` — §3.1 (:51-63), :294-295

---

## Q1 — Pipeline object-as-edge, oggi

### Chi risolve, quando, e che cosa produce

Un solo punto di risoluzione, a **render time**, dentro un `useMemo`:

```
EditorV2.tsx:1323          const irContainment = useIRContainment(stableNodes, stableEdges);
useIRContainment.ts:158    const oae = synthesizeObjectAsEdges(
                               outNodes, outEdges, model.objByVertex, model.vertexByObj,
                               index, readCtx, state.idlookup, overrides);
EditorV2.tsx:3809-3810     nodes={irContainment.nodes}  edges={irContainment.edges}
```

Gli accessor compilati sono invocati qui e solo qui:

```typescript
irEdgeViews.ts:187-191
        let srcTarget: unknown, tgtTarget: unknown;
        try {
            srcTarget = cv.sourceExpr(readCtx, objectId);
            tgtTarget = cv.targetExpr(readCtx, objectId);
        } catch { continue; }
```

**Il prodotto è un edge ReactFlow sintetico, non un DEdge**: costruito a `:205-217` con
`id: \`irobj_${objectId}\``, `type: 'instanceRef'`, `data.irObjectAsEdge = true`; il nodo
dell'oggetto viene nascosto (`:227`, `hidden: true`, mai rimosso) e gli edge reference propri
dell'oggetto vengono filtrati via (`:229`). Niente di questo entra in Redux: è decorazione degli
array RF passati a ReactFlow.

Il valore risolto viene normalizzato ad un id e poi tradotto in **vertice**:

```typescript
irEdgeViews.ts:195-202
        const toId = (x: unknown): string | null =>
            typeof x === 'string' ? x
            : (x && typeof x === 'object' && typeof (x as any).id === 'string' ? (x as any).id : null);
        const srcId = toId(srcTarget);
        const tgtId = toId(tgtTarget);
        const srcVertex = srcId ? vertexByObj.get(srcId) : undefined;
        const tgtVertex = tgtId ? vertexByObj.get(tgtId) : undefined;
        if (!srcVertex || !tgtVertex) continue; // fallback: keep the node rendered
```

**Conseguenza vincolante per il token `container`**: non basta risolvere l'id del parent; il parent
deve avere un **vertice** in `vertexByObj`, cioè essere renderizzato come nodo. Vedi R1.

### Un oggetto con view edge e un solo endpoint: un nodo

Tre livelli concordano, e nessuno dei tre produce un errore visibile:

1. **Compile**: `isObjectAsEdge: !!(sourceExpr && targetExpr)` (`irCompile.ts:396`).
2. **Indice**: con `isObjectAsEdge` falso la entry finisce nei bucket **reference-as-edge**, cioè la
   view resta viva ma cambia mestiere (`irResolveCore.ts:149-165`):
   ```typescript
   if (compiledE.isObjectAsEdge) { ...objectAsEdgeByMetaclass... }
   else if (ir.metaclasses === '*') { edgeWildcard.push(entry); }
   else { ...edgeByMetaclass... }
   ```
   L'oggetto non è mai in `objectAsEdgeByMetaclass`, quindi non è mai nascosto: **renderizza come
   nodo** con la sua view vertex (o col rendering astratto di EditorV2 se nessuna si applica).
3. **Authoring**: il pannello non permette nemmeno di arrivarci, perché non persiste una coppia
   incompleta (`edgeEndpoints.ts:72`, `nextEdgeForEndpoints` → `null`). Lo stato «un endpoint
   scritto» è raggiungibile solo con IR scritto a mano o importato.

Il commento di `edgeEndpoints.ts:57-58` nomina esattamente questo stato: *«A draft carrying a single
endpoint compiles to isObjectAsEdge=false, i.e. a live reference-as-edge view whose PathExpr is inert
and unreported: a state the UI must never produce.»*

### `isUsableEndpointExpr`: semantica esatta

La definizione è a `edgeEndpoints.ts:42-45` (il `:136` citato dal prompt è un **sito di chiamata**,
dentro `endpointDraftState`):

```typescript
export function isUsableEndpointExpr(expr: string | undefined): boolean {
    if (!expr) return false;
    return !/\.values$/.test(expr);
}
```

Due sole condizioni: non vuota, e non termina in `.values`. Il perché è la normalizzazione di
`irEdgeViews` (`:195-197`): un array non è né stringa né oggetto con `id`, quindi `toId` dà `null`,
l'endpoint non risolve e l'oggetto resta un nodo **senza diagnostica**. La forma indicizzata
`$ref.values[0]` è ammessa.

**Rilevante per il token**: `isUsableEndpointExpr('container')` ritorna **true** — la funzione non
sa nulla di grammatica, filtra solo il vuoto e l'array. Quindi il pannello considererebbe
`container` un endpoint usabile già oggi, e `nextEdgeForEndpoints` lo scriverebbe. È il primo punto
in cui H2 regge per caso e non per progetto.

---

## Q2 — Punto di risoluzione del parent

### Il fatto che decide tutto: due forme di contenimento, non una

```typescript
canvasToJjom.ts:1337-1343
        const dObject = (DObject as any).new(
            metaclassId,            // which class to instantiate
            modelId,                // parent model
            DModel,                 // fatherType — MUST be DModel
            objectName || undefined,
            true
        );
```

```
LModelElement.tsx:6964 (in LValue.get_addObject)
            father = isContainment ? c.data.id : this.get_model(c).id;
```

Quindi, per lo stesso metamodello, un `Transition` «dentro» uno `State` può avere due forme:

| Forma | Creato da | `DObject.father` | In `DModel.objects` | Contenimento leggibile da |
|---|---|---|---|---|
| **(a) piatta** | canvas editor-v2 (`syncCreateObject`) | il **DModel** | sì | **solo** il pointer nello slot di composizione |
| **(b) annidata** | API classica (`LValue.addObject` su slot containment) | il **DValue** | **no** | `father` (2 hop) e lo slot |

La forma (a) è quella che l'IR assume: `irContainment.ts:4-6` la dichiara,
*«children keep absolute canvas coordinates and top-level RF nodes; the container is visualized as a
hull drawn around its children»*.

**Conseguenza sulla domanda «father o DValue? entrambi?»**: nella forma (a) `father` è **inservibile**
(punta al DModel, non al container), e l'unica lettura valida è il walk in avanti sugli slot di
composizione. Questo **inverte** l'euristica di CLAUDE.md §3.6 (father eager, forward-link stale):
qui il backward link non porta l'informazione, e il forward link è l'unica fonte. Nella forma (b)
funzionano entrambi, con `father` più fresco.

### Le tre letture disponibili al punto di risoluzione

1. **Walk in avanti, già scritto**: `containmentChildren` (`irContainment.ts:48-64`) itera le feature
   dell'oggetto e tiene i DValue il cui `instanceof` è una `DReference` con `composition` vera. È
   top-down: dà i figli, non il padre.
2. **Mappa child→container, già costruita**: `ContainmentModel.parentOf`
   (`irContainment.ts:40` — *«child objectId → container objectId»*), popolata a `:177-180`. **Ma
   con un filtro che la rende parziale**:
   ```typescript
   irContainment.ts:169-170
           const cv = resolveIRView(objectId, metaclassId, index, readCtx, idlookup);
           if (!cv || cv.kind !== 'graphVertex' || !cv.containment) continue;
   ```
   `parentOf` contiene solo i figli di container che risolvono una view **graphVertex con
   containment**. Un `State` reso da una view `vertex` normale non compare: il suo `Transition` non
   avrebbe parent. Riusarla così legherebbe l'endpoint `container` alla presenza di una view
   graphVertex sul padre — un accoppiamento che nessuno ha chiesto.
3. **Walk indietro 2 hop, non scritto da nessuna parte**: `idlookup[obj].father` → se è un `DValue`,
   `idlookup[dValue.father]` è il DObject contenitore. I tipi lo garantiscono:
   `DObject.father!: Pointer<DModel> | Pointer<DValue>` (`LModelElement.tsx:5804`),
   `DValue.father!: Pointer<DObject>` (`:6467`). Vale solo nella forma (b).

### Dove si leggerebbe

Il punto naturale è `synthesizeObjectAsEdges` (`irEdgeViews.ts:180-202`), che è **già** dentro il
ciclo sui nodi e ha `idlookup`. Ma il modulo è puro e il parent non è un accessor compilato: oggi
`ReadCtx` non espone nulla di simile — l'interfaccia ha sei metodi e nessuno risale
(`irReadCtx.ts:17-32`), e la sua intestazione fissa il vocabolario: *«Element ids passed to ReadCtx
are DObject ids (model layer), NOT vertex ids»* (`:12`). Le opzioni sono tre e la Fase 2 deve
scegliere: settimo metodo su `ReadCtx`; risoluzione fuori dagli accessor con `cv.ir.edge.source ===
'container'` letto direttamente in `synthesizeObjectAsEdges`; oppure passaggio di
`model.parentOf` alla funzione (che oggi riceve solo `objByVertex`/`vertexByObj`, `:158-159`).

---

## Q3 — Reattività degli endpoint, e il re-parent

### Il segnale progettato dell'IR non copre il container

Le dipendenze del memo sono cinque (`useIRContainment.ts:185`):
`[nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig]`.

`oaeSlotsSig` (`:80-111`) è il segnale scritto **per** gli endpoint object-as-edge. Osserva:

```typescript
useIRContainment.ts:85-102
        const featNames = new Set<string>();
        for (const entries of index.objectAsEdgeByMetaclass.values()) {
            for (const e of entries) e.compiled.dependencySet.forEach(f => featNames.add(f));
        }
        ...
        for (const oid of state.objects ?? []) {
            ...
            if (!mc || !index.objectAsEdgeByMetaclass.has(mc.name)) continue;
            for (const fid of o.features ?? []) { ... if (f && featNames.has(f.name) ...) }
```

Due limiti che il token `container` colpisce entrambi:

- osserva **solo gli oggetti la cui metaclasse ha una view object-as-edge** (il `Transition`), e
  **solo le loro feature**. Lo slot di contenimento `transitions` appartiene allo `State`: fuori
  perimetro;
- filtra per `dependencySet`, che è derivato dai `featureNames` dei PathExpr
  (`irCompile.ts:382-384`). Un token `container` non è una feature: **non aggiunge nulla al
  dependency set**, quindi non allarga l'osservazione.

Nota positiva su `state.objects`: è la cartella di stato **globale**, popolata genericamente alla
creazione di qualunque elemento (`reducer.ts:464-467`,
`statefoldername = elem.className.substring(1).toLowerCase() + 's'`), quindi include anche gli
oggetti annidati — a differenza di `DModel.objects`. Il perimetro di `oaeSlotsSig` è ristretto dal
filtro sulla metaclasse, non dalla lista.

### Al re-parent arriva comunque un segnale, per due canali generici

**Non è il vuoto**, ed è giusto dirlo con precisione: due meccanismi del sync osservano i valori
degli slot di *tutti* gli oggetti, contenimento compreso.

1. `useM1ReferenceEdges.m1RefValuesSig` (`:63-85`): itera `rawModel.objects` → feature → **ogni**
   DValue il cui meta è una `DReference` (`:76`, nessun filtro su `composition`) → tuple
   `objId:refMetaId:tgtId`. Lo slot `transitions` di uno `State` **è** in questa firma. Limite: la
   lista è `rawModel.objects`, cioè i soli oggetti radice.
2. L'hash per-vertice di `useJjomSync` (`:1098-1127`): scorre
   `['attributes','references','operations','literals','features']` del model element e per ogni
   figlio hasha `child.values` (`:1119-1127`, commento: *«Include feature values (DValue.values) for
   M1 instance nodes»*). Un cambio nello slot di contenimento cambia `ch:<id>` dello **State**, il
   che rende `elementSnapshots` diseguale (`:1163`, `mapReferenceEqual`) e fa girare l'update
   incrementale (`:1339-1400`) → nuovi `nodes` → il memo dell'IR ricalcola perché `nodes` è la sua
   prima dipendenza.

**Dichiarazione onesta di grado di certezza**: questo è un percorso **tracciato leggendo il codice,
non misurato a runtime**. Non ho eseguito un re-parent: non ho trovato un gesto di re-parent nel
canvas IR, e la ragione è dichiarata nel modulo — *«True RF reparenting (parentId + relative
coordinates) is deferred: it changes the coordinate semantics of the canvas→JjOM write-back»*
(`irContainment.ts:6-9`). Nella forma (a) un re-parent è quindi oggi una scrittura di slot
(Properties panel, JjScript, API), non un trascinamento. La misura va fatta in Fase 2 prima di
appoggiarci una decisione (vedi domanda aperta 3).

### Nota di merito

La reattività ci sarebbe **per effetto collaterale di due hash generici del sync**, non per il
dependency set dell'IR. Rispetto alla spec §9 — *«L'interprete DEVE invalidare il render di un
elemento quando cambia una feature nel suo dependency set, e NON DEVE re-renderizzare per feature
fuori dal set»* — un endpoint `container` sarebbe un elemento **fuori dal contratto**: rendered
correttamente, ma invalidato da un canale che la spec non nomina. Va emendata la §9 o va esteso il
dependency set con la nozione di «dipendenza dal contenitore».

---

## Q4 — Grammatica e validazione

### Il vocabolo è libero, per costruzione e per esecuzione

`STEP_RE` ammette quattro forme di token e nient'altro:

```typescript
pathExpr.ts:22-23
/** One step: $feature | value | values | values[N] */
export const STEP_RE = /^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/;
```

`parsePathExpr` spezza su `.` e rifiuta ogni token fuori regex (`:40`,
`throw new Error(\`[ir] invalid PathExpr step "${tok}" in ${expr}\`)`). L'esecuzione riportata nel
§Metodo lo conferma su `container`, `container.value` e `eContainer`, con tre controlli positivi che
passano. **H1 confermata.**

Dettaglio non ovvio e utile: `$container.value` **parsa** e produce `{feature:'container'}`. Un
metamodello che avesse davvero una feature di nome `container` continuerebbe a funzionare: le due
grafie (`container` nudo vs `$container.value`) non collidono. Il token riservato non ruba un nome
allo spazio delle feature.

### Percorso di render: rifiuta, e non silenziosamente

`compileEdgeView` → `compileExpr` (`irCompile.ts:380-385`) → `compilePath` → `parsePathExpr`: il
throw sale. Chi compila l'indice lo cattura e **scarta la view con un warning**:

```typescript
irResolveCore.ts:142-147
            try { compiledE = compileEdgeView(vid, ir as EdgeViewIR); }
            catch (e) { console.warn('[ir] edge compile failed for view', vid, e); continue; }
```

Quindi oggi un IR con `edge.source: 'container'` scritto a mano **perde tutta la view** (non solo
l'endpoint): l'oggetto cade sulla view successiva o sul rendering astratto. Coerente con spec §10,
ma è la ragione per cui il render deve diventare permissivo **prima** che il token sia autorabile,
non dopo.

### Percorso di authoring: rifiuta, con l'errore in faccia all'autore

`validateIR` (`irValidate.ts:28`) ha **una** regola esplicita — il vocabolario di `edge.routing`
(`:33-41`, R-B9/R-B9-bis) — e per tutto il resto **guida il compilatore come validatore** (`:44`,
`if (ir.kind === 'edge') compileEdgeView(viewId, ir as EdgeViewIR);`), restituendo `e.message`
(`:49`). Il messaggio del parser è quindi già user-facing, come dichiara `pathExpr.ts:10-12`.

**Non esiste una regola di validazione specifica per gli endpoint**: la validazione degli endpoint è
oggi *esattamente* «ciò che il parser accetta». Due conseguenze misurate:

- la regola `.values` (`isUsableEndpointExpr`) **non è in `validateIR`**: vive in `edgeEndpoints.ts`
  ed è consumata solo dal pannello (`EdgeAuthoringPanel.tsx:633,645`, più `endpointDraftState`).
  Un IR con `source: '$ref.values'` **passa** `validateIR`;
- di conseguenza il posto dove innestare la regola del token, per R-B9-bis, è `validateIR` — ed è un
  posto dove la regola sugli endpoint sarebbe **la prima**. **H3 confermata, con il caveat che il
  punto di innesto oggi è indiretto.**

### Vocabolario di valori speciali per gli endpoint: non esiste

Cercato `'self'` in `viewpoint/ir/*.ts`: **0 occorrenze**; controllo positivo con la stessa forma di
ricerca nella stessa directory, `=== '*'` → **3**. Gli unici valori speciali dello schema sono il
wildcard `metaclasses: '*'` e gli enum chiusi (`routing`, `EdgeTermination`,
`labels.placement`). `container` sarebbe il primo valore riservato in un campo che oggi è
tipizzato `PathExpr` (`irTypes.ts:238-239`).

---

## Q5 — Authoring

### Come si editano oggi gli endpoint: nessun testo libero

Non è un campo di testo: è **`PathBuilder`**, due select più un indice
(`EdgeAuthoringPanel.tsx:625-648`), e il componente dichiara il proprio contratto:

```
PathBuilder.tsx:44-46
 * PathBuilder — grammar-constrained single-hop PathExpr authoring control.
 * Emits only strings the IR compiler accepts; there is no free-text entry.
```

Le opzioni della prima select vengono **solo** dalle reference della metaclasse, per scelta
esplicita:

```typescript
EdgeAuthoringPanel.tsx:330-336
    // Endpoint pickers see the REFERENCES only: an endpoint must navigate to another
    // object, and an attribute path would compile and then resolve to nothing (silent
    // fallback, the object stays a node).
    const endpointFeatures = useMemo<PathBuilderFeatures | null>(
        () => (features ? { attributes: [], references: features.references } : null),
        [features],
    );
```

La stringa è emessa da `pathExprFromSelection` (`ui/PathBuilder/pathExpr.ts:18-26`), che prefissa
sempre `'$' + sel.feature`. **Oggi il token `container` non è autorabile in nessun modo dalla UI.**

### Dove si innesterebbe «Containing element»

Tre innesti, in ordine di superficie crescente:

1. **`endpointFeatures` / opzioni della select** (`:334-337`): aggiungere una voce sentinella in
   testa alla lista di `PathBuilder`. Costa poco ma sporca un componente del design system con un
   valore che non è una feature — e `PathBuilder` è condiviso con `PredicateBuilder` e
   `ConditionalEditor`, dove `container` non ha senso.
2. **Un controllo dedicato accanto al `PathBuilder`** dentro il blocco `Endpoints`
   (`:623-660`): un `Select` a due voci («Reference path» / «Containing element») che, sulla seconda,
   sostituisce il `PathBuilder` con una riga statica e scrive `container` via `applyEndpoints`.
   Nessun componente condiviso toccato; simmetrico su source e target come chiede il prompt.
3. `applyEndpoints` / `nextEdgeForEndpoints` (`:232-238`, `edgeEndpoints.ts:67-78`): non serve
   toccarli per **scrivere** (`isUsableEndpointExpr('container')` è già true, §Q1), ma la Fase 2
   deve decidere se `natureOf` (`edgeEndpoints.ts:32-34`) resta corretta — lo è: guarda la presenza
   delle due chiavi, non il loro contenuto.

### Il difetto di round-trip che la Fase 2 deve gestire

`PathBuilder` legge il valore con `singleHopOf` (`PathBuilder.tsx:37`), che su `container` ritorna
`null` (misurato, §Metodo) e fa cadere il widget sullo stato neutro
`{ feature: '', take: 'value' }` (`:38`). Quindi **un endpoint `container` già persistito si
mostrerebbe come "— pick a feature —"**: l'autore vedrebbe un endpoint vuoto dove l'IR ne ha uno.
Il valore non si perde subito (`sourceExpr` è inizializzato dall'IR,
`EdgeAuthoringPanel.tsx:140,152`, e `applyEndpoints` scrive entrambe le chiavi dai due stati
locali), ma la prima interazione con **quel** picker lo sovrascrive. È un difetto di
visualizzazione, non di persistenza, e va chiuso nello stesso passo in cui il token diventa
autorabile.

Precedente utile a un metro di distanza: il seed del pannello **sanifica** un valore fuori
vocabolario già persistito (`:132`, `dropInvalidRouting(clone(...))`). Un `container` non
supportato dalla UI merita la stessa disciplina, in senso opposto: preservarlo, non azzerarlo.

---

## Q6 — Spec e decisioni

### Sezioni da emendare

| Documento | Sezione | Perché |
|---|---|---|
| `spec_2026-06-08_ir_schema_v1_1.md` | **§3.1 PathExpr** (:51-63) | La grammatica normativa dice *«inizia con "$" + nome feature»*. `container` la viola. **Da NON emendare**, se si segue l'ipotesi del prompt: vedi sotto. |
| `claude_spec_2026-07-18_ir_schema_v1_2.md` | **§3 Primitive** (:38-44) | Rimanda a v1.1 §3 per `PathExpr`; se il tipo degli endpoint cambia, la precisazione va qui. |
| idem | **§7 Edge** (:116-146) | Dichiara `source?: PathExpr; target?: PathExpr`. È **la** riga da emendare: il tipo dell'endpoint diventa un'unione. |
| idem | **§9 Dependency set** (:163-171) | Il set è *«derivato staticamente dai PathExpr»* e l'interprete *«NON DEVE re-renderizzare per feature fuori dal set»*. Un endpoint non-feature richiede una clausola propria (dipendenza dal contenitore). |
| idem | **§10 Fallback** (:172-181) | *«espressione endpoint che non risolve → card di fallback esplicita, MAI sparizione silenziosa»*: copre già l'oggetto radice senza container, ma va detto che è quel caso. |
| idem | **§6 Interaction** (:89-115) | *«Assente = derivato: object-as-edge da edge.source/target»*: con un endpoint `container` la connect rule non è derivabile (vedi R3). |

**Raccomandazione di merito** (non implementazione): tenere `container` **fuori** da `PathExpr` e
introdurre in §7 un tipo di endpoint distinto (`EndpointExpr = PathExpr | 'container'`) è
strettamente migliore che allargare §3.1. `PathExpr` è condiviso da predicati, label, conditional,
`TextSource`, `childFilter`: allargare la grammatica là dentro creerebbe un vocabolo legale in
dieci posti dove non significa niente. Coerente anche con l'ipotesi del prompt («espressione
endpoint **intera**, non componibile in catene»).

### Righe R-B che vincolano

- **R-B9** (`decisions.md:131-134`) — *«identificatori persistiti … mai rinominati (le view IR
  salvate non hanno VersionFixer)»*. Vincola: `container` è persistito in un campo senza
  migrazione, quindi la grafia scelta è definitiva. Nessun conflitto, un obbligo.
- **R-B9-bis** (`:135-144`) — colloca le regole di validazione **nell'authoring** e impone il render
  permissivo, con l'istruzione esplicita di *«collocare ogni nuova regola giudicando il caso …, non
  per analogia col primo pattern incontrato»*. Qui il giudizio dà: regola in `validateIR`
  (authoring) **e** tolleranza nel render — ma attenzione, oggi il render **non** è permissivo verso
  un token ignoto: lo scarta con la view intera (§Q4). Il render va reso permissivo *prima*.
- **R-B10** e **R-B12** (`:145-152`) — riguardano waypoint e registry del routing: nessun contatto
  con gli endpoint. Nessun conflitto.
- **R-SIM-4** (`:685`) — l'estensione del namespace `state` nelle espressioni IR è dichiarata come
  lavoro futuro che tocca `pathExpr.ts` + `irReadCtx.ts` + `irCrossDeps.ts` +
  `IRNodeContent.tsx`. **Un settimo metodo su `ReadCtx` per il container atterra sulla stessa
  superficie**: le due estensioni vanno sequenziate o unificate, non fatte in parallelo da due
  prompt diversi.

---

## Q7 — Criterio di accettazione dal caso d'uso

### Avvertenza di misura

**Non ho letto il progetto di test**: vive nello storage locale/backend di Alfonso, non nel repo. Il
grep per un fixture State/Transition con containment dà solo il mondo dei test unitari
(`ir.test.ts:603-626`), che usa il pattern **a reference** (`$src.value` / `$tgt.value`,
`:780`), non quello a containment. Quanto segue è quindi derivato dal codice, non osservato a
schermo, e va confermato con uno sguardo.

### Come rendono oggi le istanze di `Transition`

Metamodello dichiarato: `State` con containment `transitions`, `Transition` con reference `next` →
`State`. `Transition` non ha reference verso il proprio `State`.

1. L'autore può esprimere **solo** il target (`$next.value`). Il pannello **non scrive una coppia
   incompleta** (`edgeEndpoints.ts:72`), quindi la view edge di `Transition` finisce persistita
   **senza endpoint**.
2. Senza endpoint la view è una view **reference-as-edge** su `Transition`
   (`irResolveCore.ts:157-164`): decora gli edge RF il cui oggetto **sorgente** è un `Transition`,
   cioè l'edge `next` (`decorateReferenceEdges`, `irEdgeViews.ts:124-138`).
3. Ogni `Transition` resta **un nodo** sul canvas.
4. Attorno a quel nodo ci sono due edge reali: la composizione `State → Transition`
   (`jjomTransformers.ts:477-490`, `type: 'composition'`, label = nome della reference) e la
   reference `Transition → State` (`:493-505`, `type: 'instanceRef'`).

Resa attuale, in una riga: **tre elementi (nodo Transition + 2 edge) per ogni transizione, con la
freccia stilizzata dalla view che parte dal box della transizione e non dallo stato.**

### Criterio di accettazione, una riga verificabile

> Con `edge.source = 'container'` e `edge.target = '$next.value'` sulla view edge di `Transition`,
> per ogni istanza di `Transition` il canvas non mostra più né il suo nodo né i suoi due edge, e
> mostra **una sola** linea dallo `State` che la contiene allo `State` in `next`, con lo stile, le
> terminazioni e la label center dichiarati dalla view.

Verificabile meccanicamente: `document.querySelectorAll('[data-id^="irobj_"]').length` uguale al
numero di istanze di `Transition`, e zero nodi visibili di metaclasse `Transition`.

**Precondizione da verificare prima di prendere il criterio per buono**: che le istanze di
`Transition` del progetto di test siano nella forma (a) — create dal canvas, quindi con un vertice.
Nella forma (b) il criterio è irraggiungibile per la ragione in R1, e non per colpa dell'endpoint.

---

## Dipendenze e rischi

- **R1 — Un oggetto annidato (forma b) non ha un nodo, quindi non può diventare un edge.**
  `useJjomSync` crea i DVertex solo per `rawModel.objects` (`:666,759,773`), e
  `Constructors.DObject` mette in `objects` solo chi ha `fatherType === "DModel"`, con il commento
  che chiude il caso: *«object containing object is not in any direct child collection. access
  through values»* (`classes.ts:773-784`). `synthesizeObjectAsEdges` itera `nodes`
  (`irEdgeViews.ts:180`): niente nodo, niente edge sintetico, e nemmeno un fallback — l'oggetto
  semplicemente non è sul canvas già oggi. **Questo è il rischio massimo del tema, precede il token
  e non si risolve con il token.** Da chiarire in Fase 2 quale forma hanno gli oggetti del progetto
  di test.
- **R2 — La reattività al re-parent esiste ma passa da due hash generici del sync**
  (`useM1ReferenceEdges.ts:63-85`, `useJjomSync.ts:1098-1127`), non dal dependency set dell'IR, che
  per costruzione non vede il token (§Q3). Rischio doppio: (i) è fuori contratto rispetto a spec §9;
  (ii) è fragile a un'ottimizzazione futura di quei due hash, che nessuno collegherebbe agli
  endpoint edge. Il percorso è **tracciato, non misurato**.
- **R3 — La connect rule si spegne su quell'estremo.** `firstFeatureOf` (duplicata in
  `irEdgeViews.ts:159-163` e `irInteraction.ts:47-51`, stessa regex `^\$([A-Za-z_]...)`) ritorna
  `null` su `container`, e `matchConnectRules` scarta le regole incomplete
  (`irInteraction.ts:134`, `if (!rule.sourceFeature || !rule.targetFeature) continue;`). Il gesto di
  connessione non potrà creare una `Transition`: semanticamente corretto (creare il padre non è
  «connettere»), ma è una regressione di editabilità da dichiarare, non da scoprire.
- **R4 — Il reconnect di quell'estremo aborta l'intero gesto, override compresi.**
  `EditorV2.tsx:1877-1880` legge `irSourceFeature`/`irTargetFeature` e fa
  `if (!featName) return;` **prima** di `setIREdgeAnchorOverride` (`:1891`): trascinare il capo
  `container` non solo non riparenta (giusto), ma perde anche il pin di lato del gesto (non
  voluto).
- **R5 — Round-trip di authoring**: un `container` persistito si mostra come endpoint vuoto in
  `PathBuilder` (§Q5), e la prima interazione con quel picker lo sovrascrive.
- **R6 — Il render oggi non è permissivo**: un token ignoto fa scartare l'**intera** view
  (`irResolveCore.ts:142-147`), non il solo endpoint. L'ordine di implementazione conta: tolleranza
  nel compile prima dell'autorabilità nella UI, altrimenti chi ha già scritto `container` a mano
  perde la view.
- **R7 — `parentOf` è parziale** (`irContainment.ts:169-170`): riusarla legherebbe l'endpoint
  `container` alla presenza di una view graphVertex con containment sul padre.
- **R8 — `ReadCtx` è una superficie condivisa con R-SIM-4**: un settimo metodo tocca lo stesso
  gruppo di file che la ratifica R-SIM-4 assegna all'estensione del namespace `state`. Sequenziare.
- **D1 — `isUsableEndpointExpr` accetta già `container`** (§Q1): la Fase 2 può contare su questo per
  la scrittura, ma deve decidere se la funzione resta ignara della grammatica o diventa il posto
  dove il vocabolario è dichiarato.
- **D2 — Simmetria source/target**: nulla nel codice impedisce `container` su entrambi gli endpoint
  contemporaneamente; il risultato sarebbe un self-loop sul contenitore. Non è un errore di
  grammatica: se va vietato, va vietato in `validateIR`.

## Domande aperte per Alfonso

1. **Forma degli oggetti nel progetto di test**: le `Transition` sono state create dal canvas
   (forma a, con vertice) o dall'API/menu classico (forma b, senza vertice)? È la domanda che decide
   se il tema è «aggiungere un token» o «aggiungere un token **e** dare un vertice agli oggetti
   annidati» (R1). Verificabile in un minuto su `windoww.store.getState().idlookup`: il `father` di
   una `Transition` è il DModel o un DValue?
2. **Dove vive la risoluzione del parent**: settimo metodo su `ReadCtx` (contratto pulito, ma tocca
   la superficie di R-SIM-4), risoluzione speciale dentro `synthesizeObjectAsEdges` (zero contratto
   nuovo, ma il token diventa un caso hard-coded nel modulo puro), o `parentOf` passato alla
   funzione (riuso, ma parziale per R7)?
3. **Reattività**: ci si accontenta del segnale incidentale di R2 per la v1 — dichiarandolo nella
   spec — o il dependency set acquisisce una nozione esplicita di «dipendenza dal contenitore»?
   Prima di decidere propongo **una misura**: scrivere lo slot di contenimento da console e contare
   i ricalcoli del memo. Un'ora, e chiude il rischio principale con un numero invece che con una
   traccia di lettura.
4. **Grammatica**: confermi di tenere `container` fuori da `PathExpr` (unione di tipo sul solo
   endpoint, §Q6)? È la scelta che non allarga il vocabolo a predicati, label e conditional.
5. **Superficie di authoring**: controllo dedicato accanto al `PathBuilder` (opzione 2 del §Q5,
   nessun componente condiviso toccato) o voce sentinella nella select (opzione 1, più economica ma
   sporca il design system)?
6. **`container` su entrambi gli endpoint** (D2): vietato in `validateIR` o lasciato passare come
   self-loop legittimo?
7. **R3/R4 sono accettabili per la v1?** Con un endpoint `container` la metaclasse esce dal gesto di
   connect e quell'estremo non è più trascinabile. Se non lo sono, il perimetro della Fase 2 cresce
   di due punti nel percorso di interazione.

---

**Hard stop**: nessuna riga di codice applicativo modificata in questa sessione; nessun diff
proposto. `STEP_RE` non è stata toccata. Le uniche esecuzioni sono state letture: il parser caricato
in un processo node fuori dal repo, senza scritture.

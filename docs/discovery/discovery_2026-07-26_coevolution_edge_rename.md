# Discovery READ-ONLY — co-evoluzione M2→M1: il connect edge fallisce dopo il rename di una reference

**Data**: 2026-07-26. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD `420657f98`. Nessun file sorgente modificato. Uniche scritture: questo report + l'entry in `docs/claude-code-log.md`.

**Repro da spiegare (Alfonso)**: dopo il rename di una reference a M2 (metamodello editato live), a M1 il drag-connect sorgente→target disegna l'edge, la label della reference lampeggia, poi l'edge scompare e il valore di reference **non esiste** a M1. Nessun errore visibile.

---

## VERDETTO

> **H1 (scrittura che non atterra) è il meccanismo osservabile diretto; la RADICE è H3 (una struttura derivata non invalidata al rename). H2 è ESCLUSA.**
>
> Il connect a M1 identifica la reference da scrivere **per NOME**, e il nome che riceve è **stale** (il vecchio nome pre-rename), perché la cache derivata `modeInfo.allClasses` **non viene invalidata** quando si rinomina una reference a M2. Con un nome stale entrambe le risoluzioni by-name del write path mancano in silenzio → il valore di reference non viene mai scritto → l'edge resta senza backing.

Catena causale in 5 righe (evidenza `file:riga` sotto):

1. `metamodelClassSignature` (`useEditorMode.ts:161`) firma ogni classe come `${id}:${name}:${abstract}:${refCount}` — **conta** le reference ma **non ne include i nomi**. Un rename (id e count invariati) NON cambia la firma → il `useMemo` di `modeInfo` (`:205`) non ricalcola → `modeInfo.allClasses[].references[].name` resta al **vecchio** nome. **(H3, radice)**
2. Il connect (`EditorV2.tsx:1364-1402`) prende `metaRef` da `getCompatibleReferences(sourceMetaclass, …)` (`compositionCompat.ts:100-126`) che legge `sourceMetaclass.references` = il `modeInfo` stale → `metaRef.name = VECCHIO`.
3. `syncCreateReferenceLink(edgeSource, edgeTarget, metaRef.name=VECCHIO)` (`EditorV2.tsx:1623` → `canvasToJjom.ts:1491`):
   - `resolveReferenceIdByName(sourceObject, VECCHIO)` (`:1515`→`:602`) cammina la M2 **live** (nuovo nome) → nessun match → `refDefId = undefined` (warn "cannot resolve DReference id").
   - Value write `sourceObject['$'+VECCHIO].values = […]` (`:1524`): l'accessor `$` risolve lo slot confrontando il **nome vivo** di ogni slot (`LModelElement._defaultGetter:232`, e `LValue.get_name:7057` restituisce il nome M2 **live** della feature) col nome richiesto VECCHIO → nessuno slot combacia → `refProxy` falsy → **write saltata in silenzio**. **(H1)**
4. Viene comunque creato un `DVoidEdge.new2(refDefId=undefined, …)` (orphan, senza `model`) e aggiunto un edge ottimistico a RF con `label: metaRef.name` VECCHIO (`EditorV2.tsx:1633-1649`) → la label lampeggia col **vecchio** nome.
5. Il valore non è mai atterrato: lato dati la reference **non esiste** a M1 (H1). Lato canvas la label si svuota/l'edge resta orfano (dettaglio in Area 5 — è l'unico punto non deterministico dal solo codice, coperto dalla probe).

**Perché NON H2**: la rigenerazione dell'edge dal valore è tutta **by-id / by-value**, quindi robusta al rename:
- `jjomEdgeToRFEdge` legge nome/tipo da `edge.model` (l'oggetto DReference, by-id) e restituisce il nome **live** (`jjomTransformers.ts:449-452`) — non risolve per nome.
- Il reconcile/reap M1 (`useM1ReferenceEdges.ts:129-158`) costruisce `validPairs` dai **valori** reali degli slot (`dFeat.values`), non dai nomi.
Quindi se il valore atterrasse, l'edge si rigenererebbe correttamente. Il solo anello name-dependent e fragile è la **scrittura**, ed è quello che fallisce.

**Classe di bug**: identica a `4f1ff6aa6` (picker che risolveva la metaclasse per nome e prendeva quella stale). Qui la risoluzione by-name fallisce perché **alimentata da un nome stale**; e il write path la aggrava risolvendo *anche* lo slot per nome.

---

## File letti (per intero o nelle sezioni pertinenti)

- **Connect gesture M1**: `components/editor-v2/EditorV2.tsx:1329-1415` (`onConnect`/`onConnectEnd`), `:1584-1674` (`handleM1ReferenceSelected`), `:1682-1754` (`handleObjectEdgeSelected`, object-as-edge), `:1792-1866` (`handleReconnect`).
- **Compatibilità reference**: `components/editor-v2/utils/compositionCompat.ts:100-179`.
- **Reattività modeInfo**: `components/editor-v2/hooks/useEditorMode.ts:88-205` (i due `useSelector` + il `useMemo`), `:348-495` (build di `allClasses`/`references`).
- **Write path (critical zone, sola lettura)**: `components/editor-v2/sync/canvasToJjom.ts:1491-1552` (`syncCreateReferenceLink`), `:1400-1484` (`syncCreateCompositionLink`), `:602-616` (`resolveReferenceIdByName`), `:386-463` (`syncDeleteReferenceById` + sweep), `:340-384` (delete vertex/class + sweep).
- **Accessor `$feature` + nome slot**: `model/logicWrapper/LModelElement.tsx:217-236` (`LModelElement._defaultGetter`), `:7057` (`LValue.get_name`), `:5000-5051` (`LModel._defaultGetterM1`, distinto — è `model.$name`), `:6955-7010` (creazione eager degli slot su `addObject`). `joiner/proxy.ts:276-449` (get trap, `_defaultGetter`/`_defaultSetter`). `joiner/classes.ts:2144-2163` (`set_name` base, id-preserving).
- **Rigenerazione**: `components/editor-v2/utils/jjomTransformers.ts:426-574` (`jjomEdgeToRFEdge`; M1 `:447-482`, M2 `:487-538`).
- **Reap / reconcile (critical zone, sola lettura)**: `components/editor-v2/hooks/useM1ReferenceEdges.ts` (intero), `components/editor-v2/sync/m1EdgeSweep.ts:39-118`, `components/editor-v2/utils/refEdgeReconcile.ts:1-60`.
- **Sync (critical zone, sola lettura)**: `components/editor-v2/hooks/useJjomSync.ts:1188-1241` (full rebuild), `:1243-1332` (add path), `:1333-1400` (property-change patch), `:498-936` (Step 3 M2 reconcile).

---

## Findings per area (mappa richiesta dal prompt)

### Area 1 — Connect gesture M1: cosa identifica la reference, e da dove/quando viene il dato

- L'orchestratore è `onConnectEnd` (`EditorV2.tsx:1337-1415`). In modalità `model` (M1) e con due `objectNode`, calcola:
  - `sourceMetaclass = mi.allClasses.find(c => c.id === sourceData.instanceOfClassId)` (`:1361`) — `mi = modeInfoRef.current` (`:1352`).
  - `compatibleRefs = getCompatibleReferences(sourceMetaclass, targetData.instanceOfClassId, mi.allClasses)` (`:1365`).
- **Cosa identifica la reference**: un `metaRef: MetaclassReference` con `{id, name, targetClassId, containment}` (`useEditorMode.ts:58-70`). Il connect passa a valle **il NOME** (`metaRef.name`), non l'id:
  - `EditorV2.tsx:1621-1623`: `syncCreateCompositionLink(…, metaRef.name)` / `syncCreateReferenceLink(…, metaRef.name)`. L'`id` (`metaRef.id`) finisce solo nel `data.referenceId` dell'edge ottimistico (`:1643`) e **non è usato per scrivere**.
- **Da dove/quando viene il dato**: da `modeInfo.allClasses`, un oggetto **memoizzato** (`useEditorMode.ts:166-205`), catturato via `modeInfoRef.current` (`EditorV2.tsx:519-523`). Il nome della reference è fissato al momento in cui il memo ha (ri)calcolato — **non** al momento del gesto. Vedi Area 3 per la staleness.
- **Object-as-edge** (`handleObjectEdgeSelected`, `:1682-1754`): via diversa e non affetta allo stesso modo — scrive gli slot dei due capi via `lObject['$'+match.sourceRef.name]` / `['$'+match.targetRef.name]` (`:1726-1734`). `match` viene da `matchConnectRules(irPlanRef.current, …)` (IR plan): stesso rischio *se* l'IR plan portasse nomi stale, ma è un altro carrier (fuori dal repro reference-as-edge di Alfonso). Segnalato per completezza.

### Area 2 — Write path: quale azione scrive, come risolve la feature, cosa fa in caso di fallimento

- `syncCreateReferenceLink` (`canvasToJjom.ts:1491-1552`) e il gemello `syncCreateCompositionLink` (`:1400-1484`). Due risoluzioni, **entrambe per nome**:
  1. **Id della DReference**: `resolveReferenceIdByName(sourceObject, referenceName)` (`:1515` / `:1444` → `:602-616`) — cammina `klass.allReferences ?? klass.references` e fa match su `lr.name === referenceName` (M2 **live**). In fallimento ritorna `undefined` e si limita a un `console.warn` "cannot resolve DReference id" (`:1517-1519`), **poi prosegue** creando il `DVoidEdge` con `model = undefined`.
  2. **Slot del valore**: `const refProxy = (sourceObject as any)['$' + referenceName]` (`:1524` / `:1456`); scrive solo dentro `if (refProxy) { refProxy.values = [...meaningful, targetObject.id] }`. Se `refProxy` è falsy → **no-op silenzioso** (nessun warn, nessun throw). La *shape* della scrittura (`.values = [...]`, non `.value =`) è corretta anche per slot vuoti (nota `EditorV2.tsx:1714-1716`): il problema **non** è la shape, è che lo slot non viene trovato.
- **Comportamento in fallimento**: il valore non atterra **silenziosamente** (il silenzio è parte del bug, come da ipotesi). L'unico segnale è il warn del punto (1), che c'è solo se anche l'id fallisce.
- **Perché lo slot non si trova con nome stale**: l'accessor `$X` su un `LObject` passa da `LModelElement._defaultGetter` (`LModelElement.tsx:217-236`): strappa il `$` (`:228`) e cerca fra i figli quello con `lc.name.toLowerCase() === pk.toLowerCase()` (`:230-232`). Per uno slot M1, `lc.name` è `LValue.get_name` = **nome M2 live** della feature (`:7057`: `c.data.instanceof ? get_fromlfeature(instanceof,'name') : data.name`). Dopo il rename tutti gli slot riportano il **nuovo** nome; una query col **vecchio** nome non combacia → `refProxy = undefined`.
  - Corollario: l'accessor `$` è **rename-robusto se interrogato col nome corrente**. Il difetto non è l'accessor: è che gli viene passato un nome stale.

### Area 3 — Rigenerazione: risolve per id o per nome? (H2)

- `jjomEdgeToRFEdge` (`jjomTransformers.ts:426-574`). Per gli edge M1 (`sourceClassName === 'DObject'`, `:447`) legge tutto da `edge.model` (l'oggetto DReference, **by-id**): `refModel.composition`, `refModel.name`, `refModel.id` (`:449-452`). Nessuna risoluzione per nome; il nome mostrato è quello **live** del `model`.
- `data.referenceName`/`referenceId` vengono ricomputati **a ogni pass** da `edge.model` (`:463-466`, `:478-481`) — non memorizzati.
- **Conseguenza**: la rigenerazione è immune al rename. **H2 esclusa.** Se il valore atterrasse, l'edge M1 apparirebbe con la reference giusta. (Nota: con `refDefId=undefined`, l'orphan edge cade nel ramo M1 con `refName=''` — renderizza comunque, senza label; vedi Area 5.)

### Area 4 — Rename a M2 nel D-layer: stesso id o entità nuova? chi resta stale

- Il rename è **id-preserving**: `set_name` base (`joiner/classes.ts:2144-2163`) opera su `c.data` (guardia `c.data.name === name`, collisione su `child.id !== c.data.id`) e scrive via `SetFieldAction` sul **medesimo** `DReference`. Nessuna entità nuova, nessun cambio di id, nessuno slot rinominato. (Override `LModelElement.tsx:3060/4246/5365/6065` — stessa semantica su `.name`.)
- **Chi reagisce correttamente** (by-id/by-value): la M2 live (`allReferences`/`references`), `LValue.get_name` (nome slot via `instanceof`), `jjomEdgeToRFEdge`, `useM1ReferenceEdges`, `refEdgeReconcile`, la sweep.
- **Chi resta stale** (by-name): **`modeInfo.allClasses[].references[].name`** — l'unico. Non si invalida perché la firma di reattività ignora i nomi:
  - `metamodelClassSignature` (`useEditorMode.ts:111-164`) emette `parts.push(\`${id}:${cls.name}:${cls.abstract}:${refCount}\`)` (`:161`). Un rename di reference lascia `id`, `cls.name`, `cls.abstract`, `refCount` invariati → firma identica → `useSelector` non notifica → `useMemo` (`:205`, dep `[modelId, explicitMode, metamodelRefFromStore, metamodelClassSignature]`) non ricalcola → `modeInfo` restituito dalla cache col **vecchio** nome. Anche eventuali re-render da altre subscription NON aiutano: il memo torna cached finché i dep non cambiano.
- **Siti del percorso connect/write che usano il NOME** (ognuno un sospetto, tutti alimentati dallo stesso nome stale):
  1. `EditorV2.tsx:1621-1623` (passa `metaRef.name`).
  2. `canvasToJjom.ts:602-616` `resolveReferenceIdByName` (match by-name).
  3. `canvasToJjom.ts:1524` / `:1456` accessor `$'+referenceName` (match by-name via `_defaultGetter`).
  4. `EditorV2.tsx:1642` (`data.referenceName = metaRef.name` sull'edge ottimistico → la label stale).

### Area 5 — Ordine degli eventi UI: la label che appare e scompare

Sequenza (con `metaRef.name = VECCHIO`):
1. `handleM1ReferenceSelected`: `takeSnapshot()`, poi crea l'edge in JjOM via `syncCreateReferenceLink` (write valore **fallita**; `DVoidEdge` orphan creato con `model=undefined`), poi `markDropCreated(edgeId)` (`EditorV2.tsx:1631`), poi edge ottimistico `setEdges([...eds, newEdge])` con `label: VECCHIO` (`:1633-1649`) → **la label col vecchio nome appare**.
2. `useJjomSync` incrementale vede il nuovo `DVoidEdge` in `subElements`. Nel ramo add (`useJjomSync.ts:1287-1319`) l'unico filtro è l'esistenza dei capi (`currentIds.has(source/target)`, `:1297`) — **nessun filtro sul valore di backing**. Con `isDropCreated` consumato (`:1266`, true) l'edge NON viene ri-aggiunto (evita il doppione) ma viene messo in `rfEdgeCache` con la versione derivata da JjOM (`label=''`, perché `model=undefined`).
3. Nessun pass **cancella** l'orphan sul solo connect:
   - `useJjomSync` Step 3 (M2 reconcile) esclude gli edge M1 (`isM2ReferenceEdge` false).
   - `sweepAllM1ReferenceGraphs` è invocata **solo** dai path di delete (`canvasToJjom.ts:361` class-delete, `:459` reference-delete), **non** dal connect.
   - `useM1ReferenceEdges` reap (`:155-197`) elimina gli edge M1 senza tupla di backing viva — **ma** il suo effetto si rifà solo quando cambia `m1RefValuesSig` (dep `:198`), che è una firma dei **valori** degli slot. Con la write fallita nessun valore cambia → la firma resta identica → **l'effetto non si rifà sul connect**. Quindi, dal solo codice, sul connect l'orphan **non** viene reaped.
4. **Punto non deterministico dal solo statico** (§5.1 "non fidarsi delle fixture, riprodurre sullo stato corrente"): ciò che il codice garantisce è (a) valore assente (H1, **certo**) e (b) label iniziale col vecchio nome; **come** la label/edge scompaia visivamente ha due spiegazioni sourceabili e la probe le distingue:
   - **(b1) label svuotata**: al primo pass in cui l'id entra nel loop property-change (`:1333-1400`), `jjomEdgeToRFEdge` → `label=''` → `patchedEdges` → la label sparisce (linea orfana eventualmente residua; per gli edge M1 la label è comunque nascosta di default salvo hover — quindi "la reference sparisce").
   - **(b2) reap differito**: un qualunque evento successivo che cambi `m1RefValuesSig` (un altro edit di slot, un remount del canvas M1) fa girare `useM1ReferenceEdges` che, non trovando la tupla, cancella il `DVoidEdge` orphan (`:158,190-197`) e l'edge scompare per intero.
   In entrambi i casi il **valore non esiste** a M1: è l'invariante da verificare, e la probe lo fa direttamente.

### Area 6 — Caso di controllo: il connect funziona su una reference MAI rinominata?

**Sì.** Per una reference mai rinominata `metaRef.name` è corretto (il `modeInfo` è stato costruito al load con i nomi giusti). Allora:
- `resolveReferenceIdByName(nomeCorretto)` combacia → `refDefId` valido.
- `$nomeCorretto` combacia lo slot (esistente ed eager — gli slot dei feature sono creati alla creazione dell'oggetto, `LModelElement.tsx:6955-7010`) → `refProxy` valido → **valore atterra**.
- `m1RefValuesSig` cambia → `useM1ReferenceEdges` conferma la coppia in `validPairs` → edge **mantenuto**.

Il caso base **non** è fragile: il rename è un **innesco**, non un amplificatore di una debolezza pre-esistente. Test manuale di controllo consigliato ad Alfonso: connettere una reference **mai rinominata** fra due istanze compatibili → deve restare e comparire nel pannello Slots; poi rinominare *quella* reference a M2, riaprire/riusare il canvas M1 e riprovare il connect → deve fallire (riproduce il bug). Se anche il caso mai-rinominato fallisse, la diagnosi va rivista (probe qui sotto lo cattura comunque).

### Area 7 — Confine con la critical zone (quali siti dentro / quali fuori)

- **FUORI critical zone** (§3.1 non li elenca):
  - `useEditorMode.ts` — **la radice (H3)**. La correzione minima (invalidare il memo) è **interamente fuori** dalla critical zone.
  - `EditorV2.tsx` (il chiamante che passa `metaRef.name`) — fuori §3.1.
  - `jjomTransformers.ts` — sotto `utils/`, fuori §3.1 (e comunque già by-id).
- **DENTRO critical zone** (§3.1):
  - `canvasToJjom.ts` — `syncCreateReferenceLink`/`syncCreateCompositionLink` (le due risoluzioni by-name). Una correzione qui (resolve by-id) richiede **go-ahead + Layer Impact Report**.
  - `useM1ReferenceEdges.ts` — il reap. **NON va toccato**: è corretto (reap by-value di edge genuinamente orfani). La cura è a monte (far atterrare il valore), non nel reaper.
  - `useJjomSync.ts` — solo lettura in questa diagnosi; il fix non ha bisogno di toccarlo.

---

## Probe console (da incollare dopo il gesto, discrimina H1 vs H2)

Eseguire in DevTools **subito dopo** il drag-connect fallito. Sostituire i tre valori in testa. Usa `windoww.store` (doppia w, §15.4). Non muta nulla.

```js
(() => {
  // === PARAMETRI (adatta ai tuoi nomi) ===
  const SRC_NAME  = 'Sorgente1';     // nome dell'istanza M1 sorgente (nodo da cui hai trascinato)
  const TGT_NAME  = 'Target1';       // nome dell'istanza M1 target
  const REF_NEW   = 'nuovoNome';     // nuovo nome della reference (post-rename, a M2)
  const REF_OLD   = 'vecchioNome';   // vecchio nome (pre-rename) — opzionale, per il controllo

  const S = windoww.store.getState();
  const L = S.idlookup;
  const asObj = (id) => (typeof id === 'string' ? L[id] : id);

  // Trova il/i DModel M1 (className DModel con instanceof/metamodel) e le sue objects
  const models = Object.values(L).filter(e => e && e.className === 'DModel');
  let src, tgt;
  for (const m of models) for (const oid of (m.objects ?? [])) {
    const o = L[oid];
    if (o?.className !== 'DObject') continue;
    // il name M1 è overridato dallo slot identità; usiamo data.name come euristica
    if (o.name === SRC_NAME) src = o;
    if (o.name === TGT_NAME) tgt = o;
  }
  console.log('%c[probe] src/tgt', 'font-weight:bold', {src: src?.id, tgt: tgt?.id});
  if (!src) return console.warn('sorgente non trovata: correggi SRC_NAME');

  // 1) DUMP degli slot dell'oggetto sorgente: nome LIVE della feature + values
  const slots = (src.features ?? []).map(fid => {
    const f = L[fid];                       // DValue
    const meta = f ? L[f.instanceof] : null;// DAttribute | DReference (by-id)
    return {
      slotId: fid,
      featureId: f?.instanceof,             // id della feature M2 (stabile al rename)
      liveName: meta?.name,                 // nome M2 LIVE (nuovo dopo il rename)
      kind: meta?.className,
      values: f?.values ?? [],
    };
  });
  console.table(slots);

  // 2) Lo slot della reference rinominata contiene il target?  (H2) oppure è vuoto? (H1)
  const refSlot = slots.find(s => s.kind === 'DReference' && s.liveName === REF_NEW);
  const landed  = !!refSlot && (refSlot.values || []).includes(tgt?.id);
  console.log('%c[probe] valore atterrato?', 'font-weight:bold',
    { refSlotTrovato: !!refSlot, values: refSlot?.values, target: tgt?.id, landed });
  console.log(landed
    ? '=> H2 (valore c\'è, problema a valle nella rigenerazione)'
    : '=> H1 CONFERMATA (il valore NON è mai atterrato: write by-name fallita)');

  // 3) La DReference rinominata: stesso id di prima, nuovo nome?  (Area 4)
  const srcMeta = asObj(src.instanceof);    // DClass della sorgente
  const refIds  = (srcMeta?.references ?? srcMeta?.allReferences ?? []);
  const refs = refIds.map(asObj).filter(Boolean)
    .map(r => ({ id: r.id, name: r.name, targetType: r.type }));
  console.log('%c[probe] references M2 della metaclasse sorgente (LIVE)', 'font-weight:bold');
  console.table(refs);
  console.log('=> attesa: la ref esiste col nome NUOVO ("'+REF_NEW+'") e con lo stesso id; il vecchio nome "'+REF_OLD+'" NON esiste più (rename id-preserving).');

  // 4) Il DVoidEdge appena creato (orphan): che model ha?  undefined => resolveReferenceIdByName ha fallito
  const graphs = Object.values(L).filter(e => e && String(e.className).includes('Graph') && Array.isArray(e.subElements));
  const vtxByObj = {};
  for (const g of graphs) for (const seId of g.subElements) {
    const se = L[seId];
    if (se && String(se.className).includes('Vertex') && se.model) vtxByObj[se.model] = seId;
  }
  const sV = vtxByObj[src.id], tV = vtxByObj[tgt?.id];
  const orphanEdges = [];
  for (const g of graphs) for (const seId of g.subElements) {
    const se = L[seId];
    if (se && String(se.className).includes('Edge') && se.start === sV && se.end === tV) {
      orphanEdges.push({ id: seId, model: se.model, modelName: se.model ? L[se.model]?.name : '(undefined)', isReference: se.isReference });
    }
  }
  console.log('%c[probe] edge JjOM tra i due vertici', 'font-weight:bold');
  console.table(orphanEdges);
  console.log('=> se model="(undefined)": anche resolveReferenceIdByName ha fallito (nome stale). Se l\'edge scompare a una successiva ri-esecuzione della probe: reap by-value (Area 5 b2).');
})();
```

Lettura attesa se il verdetto è corretto: (1) lo slot `DReference` con `liveName === REF_NEW` ha `values` **vuoto** (o senza il target); (2) `landed=false` → **H1**; (3) la ref M2 esiste col nome nuovo e stesso id; (4) l'orphan edge ha `model=(undefined)`. Per esporre la staleness di `modeInfo`, aggiungere in una seconda esecuzione un confronto fra `metaRef.name` (quello che il connect userebbe — la label lampeggiata mostra il vecchio nome) e il `liveName` della probe: se differiscono, **H3 confermata**.

---

## Proposta di fix (proposta, NON decisione — HARD STOP dopo questo report)

Due livelli, non alternativi: il primo cura la radice, il secondo mette in sicurezza il write path.

**Fase 1 — invalidare la cache derivata (radice H3, FUORI critical zone).**
In `useEditorMode.ts:161`, includere nella firma i **nomi** delle reference (e, per igiene, degli attributi), così un rename ricalcola `modeInfo` e il connect riceve il nome corretto. Esempio di direzione (da rifinire): `parts.push(\`${id}:${cls.name}:${cls.abstract}:${refCount}:${refs.map(r=>L[r]?.name).join(',')}\`)`. Effetto: con `modeInfo` fresco, il write by-name esistente combacia sia in `resolveReferenceIdByName` sia in `$name`, il valore atterra, il reap lo mantiene. **Nessun file §3.1 toccato** → niente Layer Impact Report. È la correzione più piccola e chiude il repro. Costo: la firma cresce (ricalcolo del memo anche su rename di attributi — accettabile).

**Fase 2 — write path by-id (difesa in profondità, DENTRO critical zone → go-ahead + LIR).**
Rendere `syncCreateReferenceLink`/`syncCreateCompositionLink` (`canvasToJjom.ts`) indipendenti dal nome:
- risolvere lo slot per **feature id** (trovare il `DValue` con `instanceof === metaRef.id`) invece che via `$name`;
- passare `metaRef.id` come `refDefId` (già disponibile, `EditorV2.tsx:1643`) invece di ri-risolverlo per nome.
Questo elimina la possibilità di no-op silenzioso anche se un domani un altro carrier fornisse un nome stale (mirror di `4f1ff6aa6`). Tocca `canvasToJjom.ts` (§3.1) → **Layer Impact Report obbligatorio** + go-ahead. La firma pubblica passerebbe da `referenceName: string` a un id (o entrambi con preferenza id) — modifica interna alle due funzioni + i loro chiamanti (`EditorV2.tsx:1621-1623`).

**Bonifica sistematica (opzionale, stessa Fase 2)**: censire tutti i siti connect/write che risolvono feature per nome e uniformarli by-id — inclusi i gemelli containment (`:1353`, `:1444`) e l'object-as-edge (`EditorV2.tsx:1726-1734`, `$'+match.*.name`). Da valutare in chat: se la Fase 1 chiude il repro, la Fase 2 è indurimento e può essere fasizzata a parte.

**Raccomandazione**: Fase 1 subito (piccola, fuori critical zone, chiude il repro osservato); Fase 2 come indurimento pianificato con LIR. Il reaper (`useM1ReferenceEdges`) resta invariato: è corretto.

---

## Domande aperte per Alfonso

- **OQ-1 (scelta di fase)**: procediamo con la sola Fase 1 (invalidazione `modeInfo`, fuori critical zone) per chiudere il repro, o vogliamo subito anche la Fase 2 by-id nel write path (critical zone → LIR)?
- **OQ-2 (granularità firma)**: nella Fase 1 includiamo nella firma solo i nomi delle reference, o anche attributi/bounds/type? Più campi = memo più reattivo ma ricalcoli più frequenti. Serve un minimo che copra il rename senza thrash.
- **OQ-3 (contratto write path)**: in Fase 2 le due `syncCreate*Link` cambiano firma da `referenceName` a `referenceId` (rule 11: le due funzioni sono interne a editor-v2, ma vanno verificati tutti i chiamanti). Preferisci id-puro o id-con-fallback-nome (retro-compatibile)?
- **OQ-4 (verifica visiva Area 5)**: quando eseguirai la probe, confermi *quale* dei due esiti visivi vedi (label svuotata con linea residua, oppure edge interamente rimosso)? Serve a decidere se il fix debba anche forzare un refresh dell'edge dopo il write.
- **OQ-5 (object-as-edge)**: il repro riguarda reference-as-edge. Vuoi che estenda la Fase 2 anche al carrier object-as-edge (`match.*.name` da IR plan), o lo teniamo come filone separato finché non emerge un repro lì?

---

## Riferimenti

- Prior art by-name: commit `4f1ff6aa6` (picker risolve la metaclasse per id + warning dup-metamodello).
- Substrato edge: `docs/discovery/discovery_2026-07-26_edge_authoring_substrate.md` (Area 1 transformer `:88-112`, Q2 provenienza).
- Feature picker stale: `docs/discovery/discovery_2026-07-23_ir_feature_picker_stale.md` (stessa classe: memo con firma che ignora la feature-signature).
- Identità slot↔nome (perché `LValue.get_name` è by-instanceof live): CLAUDE.md §3.12–3.13; `docs/discovery/2026-06-17_name_slot_sync.md`.
- Siti chiave: `useEditorMode.ts:111-164,205`; `EditorV2.tsx:1337-1415,1584-1674`; `canvasToJjom.ts:602-616,1491-1552,1400-1484`; `LModelElement.tsx:217-236,7057`; `jjomTransformers.ts:447-482`; `useM1ReferenceEdges.ts:129-198`; `m1EdgeSweep.ts:39-118`; `useJjomSync.ts:1208-1214,1287-1319`.

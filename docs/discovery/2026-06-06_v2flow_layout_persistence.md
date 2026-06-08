# Discovery — Persistenza layout v2-flow al chiudi/riapri del metamodello

**Data:** 2026-06-06
**Branch:** `alfonso-frontend-jjtl`
**Tipo:** discovery read-only (nessun edit, nessun build, nessun commit)
**Prompt:** `2026-06-06 — discovery v2-flow layout persistence`

> ⚠️ Metodo (CLAUDE.md §5.1). I verdetti qui sotto sono ancorati al **codice letto in questa
> sessione** (`file:riga`). Le "evidenze runtime già raccolte" del prompt sono trattate come
> *ipotesi su uno stato passato*, non come fatti sul codice corrente, e sono usate solo per
> orientare la lettura. Dove una conclusione dipende da uno stato che non ho potuto riprodurre,
> è etichettata esplicitamente come **da riprodurre**.

---

## Verdetti in una riga (D1–D6)

- **D1 — Riuso vs ricreazione.** Entrambi i percorsi esistono. Nello scenario osservato (riapertura
  via Close Project) il grafo v2-flow viene **ricreato ex novo** in `useJjomSync.ts:630`
  (`DGraph.new(0, modelid)`), perché il match del grafo esistente fallisce (vedi D3).
- **D2 — Origine delle coordinate.** Vertici **ricreati** → griglia di default
  `x = 50 + col*420`, `y = 50 + row*300` (`useJjomSync.ts:650-651`). Vertici **riusati** →
  lette da `__raw.x/__raw.y` in `jjomTransformers.ts:151-153` lungo il read-path
  `useJjomSync.ts:1059-1108`. **Nessun** `fitView`/auto-layout sovrascrive `node.position`
  (fitView agisce solo sul viewport).
- **D3 — Match del DGraph esistente.** Sì, esiste: selettore `graphInfo` in
  `useJjomSync.ts:277-297`, chiave di match `g.model === modelid && g.graphStyle === 'v2-flow'`
  (`:281`). Fallisce quando lo stato caricato **non contiene** un grafo `graphStyle==='v2-flow'`
  per quel modello — cioè quando il grafo v2-flow non è stato persistito (vedi D5). La numerazione
  `_graph1.._graphN` **non** è di per sé sintomo di match fallito: nasce dal contatore globale
  `Constructors.DGraph_maxID++` (`classes.ts:1293`).
- **D4 — Sorte dei DVertex vecchi.** Non vengono cancellati né dal read-path né dall'auto-populate.
  Vengono spazzati **in blocco** dal Close Project (`resetState` → `LoadAction(DState.new())`,
  `U.tsx:446-448`); i log `tn deleted` (`reducer.ts:704`) sono quella cancellazione di massa.
- **D5 — Persistenza su disco.** `DVertex.x/y`, l'esistenza di `DGraph`/`DVertex` e `graphStyle`
  **sono** serializzabili: `compressedState` serializza l'**intero** `idlookup`
  (`U.tsx:427-441`) e il load lo ripristina con `SaveManager.load → LoadAction`
  (`SaveManager.ts:41-57`). MA il salvataggio avviene **solo** su `ProjectsApi.save` esplicito
  (`projects.ts:94`), invocato da Navbar/LeftBar (Ctrl+S). **Non c'è autosave sul drag.**
- **D6 — Tab vs Close Project.** Percorsi **diversi**. Chiusura tab = unmount di `EditorV2`, il cui
  cleanup (`EditorV2.tsx:1068-1072`) annulla solo timer/RAF e **non tocca `idlookup`** → il grafo
  v2-flow e le `x/y` spostate sopravvivono in runtime → alla riapertura il match riesce e le
  posizioni sono preservate **in-sessione**. Close Project = `resetState` che azzera il runtime e
  ricarica da disco. La perdita di layout è quindi un fenomeno di **reload (Close Project)**; il
  caso "solo tab" è **da riprodurre** (vedi nota D6).

---

## D1 — Riuso vs ricreazione del grafo

**Punto di creazione del grafo v2-flow** (auto-populate, effetto `useJjomSync.ts:393-942`):

```ts
// useJjomSync.ts:629-635
if (needsNewGraph) {
    const dGraph = DGraph.new(0, modelid);
    graphId = dGraph.id;
    TRANSACTION('Tag v2-flow graph', () => {
        SetFieldAction.new(graphId, 'graphStyle', 'v2-flow', '', false);
        SetRootFieldAction.new('graphs', graphId, '+=', true);
    });
}
```

Il gate è `needsNewGraph = !hasGraph` (`:401`), con `hasGraph = graphInfo !== null` (`:299`).
`graphInfo` è il risultato del selettore di match (D3). Quindi:

- se `graphInfo` trova un grafo v2-flow → `needsNewGraph=false` → **riuso** (legge `graphInfo.graphId`, `:410`);
- se non lo trova → `needsNewGraph=true` → **ricreazione** (nuovo `DGraph` + nuovi `DVertex`).

L'effetto è dichiaratamente **idempotente** e crea solo ciò che manca (`:404-408`), ma l'idempotenza
si basa interamente sul fatto che `graphInfo` riconosca il grafo già presente. Quando il grafo non è
nello stato (perché non persistito, D5), ogni mount lo ricrea.

> La controprova dell'ipotesi runtime "id dei DVertex diversi a ogni riapertura": se lo stato salvato
> contenesse i vertici v2-flow, `SaveManager.load` li ripristinerebbe con i **loro id originari**
> (`LoadAction(save)`, `SaveManager.ts:57`) e `graphInfo` farebbe match → nessun vertice nuovo.
> Osservare id **freschi** alla riapertura è coerente con uno stato su disco **privo** del grafo
> v2-flow per quel modello → ricreazione in `:630`/`:654`.

---

## D2 — Origine delle coordinate al mount

**Vertici ricreati → griglia di default** (`useJjomSync.ts:639-658`, costanti `:79-81`):

```ts
const COLS = layout.cols;       // 3
const COL_W = layout.colWidth;  // 420
const ROW_H = layout.rowHeight; // 300
...
const col = globalIdx % COLS;
const row = Math.floor(globalIdx / COLS);
const x = 50 + col * COL_W;     // :650
const y = 50 + row * ROW_H;     // :651
const size = new GraphSize(x, y, 200, 120);
const dv = DVertex.new(0, entry.id, graphId, graphId, undefined, size);
```

Stessa formula per i DVertex M1 (`:679-686`). Non c'è alcun algoritmo di auto-layout (es. `elkLayout.ts`)
su questo path: è una **griglia fissa**. Queste sono le "posizioni di default" osservate.

**Vertici riusati → lette dalla persistenza** (read-path `useJjomSync.ts:1059-1108`):

```ts
// useJjomSync.ts:1061-1073
const lGraph: any = LGraph.fromPointer(graphInfo!.graphId);
const vertices: any[] = lGraph.nodes ?? [];
for (const v of vertices) {
    const rfNode = jjomVertexToRFNode(v);   // → classVertexToRFNode
    ...
}
```

```ts
// jjomTransformers.ts:149-162  (classVertexToRFNode)
const raw = vertex.__raw ?? vertex;
const x = typeof raw.x === 'number' ? raw.x : 0;
const y = typeof raw.y === 'number' ? raw.y : 0;
return { id: vertex.id, type: 'classNode', position: { x, y }, data: { ... } };
```

Le coordinate salvate (`DVertex.x/y` → `__raw.x/y`) sono quindi **onorate** quando il vertice è
riusato. Nessun override successivo: `onInitialized` (`:1102-1104`) lancia al più un `fitView`, che
cambia zoom/pan del canvas, non `node.position`.

---

## D3 — Match del DGraph esistente

**Esiste** un meccanismo di match (selettore `graphInfo`):

```ts
// useJjomSync.ts:277-297
const graphInfo = useSelector((state: DState) => {
    if (!modelid) return null;
    const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
    const matching = dGraphs.find(g => g?.model === modelid && (g as any).graphStyle === 'v2-flow');  // :281
    if (!matching) return null;
    const freshGraph = state.idlookup[matching.id] as any;
    return { graphId: matching.id, subElements: (freshGraph?.subElements ?? EMPTY_ARRAY) as string[] };
}, ...);
```

**Chiave di match:** la coppia `(model, graphStyle)`, **non** l'id. Quindi l'instabilità dell'id
(sotto) non rompe di per sé il match. Il match fallisce (`matching === undefined`) quando nello
`state.graphs` non c'è alcun grafo con `graphStyle === 'v2-flow'` per quel `modelid` — situazione
prodotta dal reload di uno stato che non contiene quel grafo (D5).

**Origine della numerazione `_graphN`** (non è duplicazione da match fallito):

```ts
// joiner/classes.ts:1290-1294
static DGraph_maxID: number = 0;
public static DGraph_makeID(modelid: DGraph["model"]): Pointer<...> {
    if (!modelid) modelid = "shapeless";
    return modelid + '_graph' + Constructors.DGraph_maxID++;
}
```

`DGraph_maxID` è un contatore **globale monotòno** che riparte da 0 a ogni `DState.new()` / reload.
Ogni `DGraph.new` (di qualunque modello) lo incrementa. I prefissi osservati `_USER_185_graph1`,
`_USER_234_graph4`, `_USER_243_graph7` sono **modelli diversi**, ciascuno con ~2 grafi: quello
**classico** (creato da `MetamodelTab.tsx:163`, `graphStyle===''`) e quello **v2-flow** (creato da
`useJjomSync.ts:630`, `graphStyle==='v2-flow'`). Due grafi per modello × più modelli ⇒ `graph1..graph8`.
Questa è allocazione di id, non necessariamente accumulo di duplicati dello stesso grafo.

> ⚠️ **Causa secondaria possibile (race), da riprodurre.** L'auto-populate protegge la creazione con
> `creatingGraphRef.current` (`:390-394`, `:624`) ma `graphInfo` è un selettore asincrono: se
> l'effetto rifà partire prima che il selettore rifletta il grafo appena creato, in teoria si
> potrebbero creare **due** grafi v2-flow per lo stesso modello. In quel caso `graphInfo.find`
> restituisce il **primo** (`:281`), e un eventuale write (drag) potrebbe finire su un vertice di un
> grafo diverso da quello letto al remount. È coerente con "18 DVertex", ma **non l'ho potuto
> riprodurre** dal solo codice; la spiegazione dominante resta D5.
>
> Nota collaterale: `MetamodelTab.tsx:161-163` chiama `Constructors.DGraph_makeID(model.id)` per
> costruire la chiave di `pendingCreation` **e poi** `DGraph.new(0, model.id)` (che richiama
> `makeID` internamente): due incrementi del contatore per ogni creazione del grafo classico. È un
> dettaglio dell'allocazione id, non la causa della perdita di layout.

---

## D4 — Sorte dei DVertex vecchi

**Né il read-path né l'auto-populate cancellano i DVertex preesistenti.** L'auto-populate è
puramente additivo: calcola `missingClassifiers`/`missingObjects` e crea solo i mancanti
(`useJjomSync.ts:526-527`, `:638-692`); il read-path costruisce i nodi RF dal grafo corrente
(`:1070-1084`) senza GC sul D-layer.

La cancellazione di massa avviene al **Close Project**:

```ts
// U.tsx:446-449
static resetState(): void {
    LoadAction.new({...DState.new(), 'isLoading':true});
    stateInitializer().then(() => SetRootFieldAction.new('isLoading', false));
}
```

`LoadAction` con un `DState.new()` sostituisce l'intero stato; i `console.warn('tn deleted', ...)`
(`reducer.ts:704`, e `'tn deleted 2'` `:713`) sono la pulizia delle `transientProperties.node` per
gli elementi che escono dall'`idlookup`. Quindi gli orfani (e i due grafi per modello) si accumulano
**dentro una sessione** e vengono azzerati in blocco al Close Project. Il conteggio "18 DVertex"
è coerente con **vertici del grafo classico + vertici del grafo v2-flow** per le stesse classi
(due rappresentazioni) ± eventuali orfani di rigenerazione in-sessione.

---

## D5 — Persistenza su disco

**Serializzazione (salvataggio):** `compressedState` serializza l'**intero** `store.getState()`,
incluso tutto l'`idlookup` (quindi `DGraph` con `graphStyle`/`x/y` e `DVertex` con `x/y`), filtrando
solo gli **altri** progetti:

```ts
// U.tsx:427-440
static async compressedState(dproject: DProject): Promise<string> {
    const state = {...store.getState()};
    const idlookup: Record<Pointer, DPointerTargetable> = {};
    for (const [pointer, object] of Object.entries(state.idlookup) ...) {
        if (object.className === DProject.name && pointer !== id) continue;  // scarta SOLO altri progetti
        idlookup[pointer] = object;
    }
    state.idlookup = idlookup;
    ...
    let str = JSON.stringify(state);
    return await compressToUTF16(str);
}
```

`ProjectsApi.save` mette questo blob in `dProject.state` (`projects.ts:107-108`).

**Deserializzazione (caricamento):** `stateInitializer` decomprime `project.state` e lo passa a
`SaveManager.load`, che fa `LoadAction.new(save)` ripristinando l'intero idlookup con gli id
originari:

```ts
// reducer.ts:1546-1552
else state = JSON.parse(await U.decompressState(project.state));
...
SaveManager.load(state, project);
// SaveManager.ts:56-57 → save = VersionFixer.update(save); LoadAction.new(save);
```

**Quindi:** `DGraph`/`DVertex`/`x`/`y`/`graphStyle` rientrano nel payload persistito **se presenti
nell'idlookup al momento del salvataggio**. Ma:

```text
ProjectsApi.save è invocato SOLO da azioni esplicite:
  Navbar.tsx:511, :1058, :1346, :1358 ; LeftBar.tsx:198, :243 ; SaveManager.save (Ctrl+S)
```

**Non esiste autosave sul drag.** Il drag scrive `DVertex.x/y` nel runtime (`syncPositionToJjom` /
`canvasToJjom`, write-path già escluso dal prompt) ma non chiama `ProjectsApi.save`. Le coordinate
spostate sopravvivono a un reopen **solo se l'utente salva esplicitamente** dopo lo spostamento.
`autosaveLayout` (`classes.ts:1283`, default `true`) è un flag sul DProject/DUser ma **non** risulta
collegato ad alcun trigger di `ProjectsApi.save` sul drag in questo path (nessun consumer trovato che
lo leghi al salvataggio runtime).

---

## D6 — Differenza tab vs Close Project

**Chiusura tab (unmount `EditorV2`)** — cleanup non distruttivo:

```ts
// EditorV2.tsx:1068-1072
return () => {
    // Cleanup on unmount or before next effect execution
    pendingMeasureCleanupRef.current?.();
    pendingMeasureCleanupRef.current = null;
};
```

Solo timer/RAF. `idlookup` (e quindi il `DGraph` v2-flow + le `x/y` spostate) resta in runtime. Alla
riapertura del tab `useJjomSync` ri-monta, `graphInfo` matcha il grafo ancora presente, il read-path
legge le `__raw.x/y` aggiornate → **posizioni preservate in-sessione**.

**Close Project** — `resetState` (`U.tsx:446-448`) azzera il runtime con `LoadAction(DState.new())` e
`stateInitializer` ricarica `project.state` dal disco. Se lo stato salvato non contiene le posizioni
spostate (perché non salvate, D5) o non contiene affatto il grafo v2-flow, l'auto-populate rigenera
alla griglia di default. Chiamanti di `resetState`: `Navbar.tsx:493`, `Navbar.tsx:1943`,
`PathChecker.tsx:12`.

**Conclusione D6:** sono due percorsi distinti. Il reset di layout è spiegato per il **Close Project**
(reload). Il caso "solo chiusura tab del MM", se reale, **non** è spiegato dai path letti (il runtime
non viene azzerato) e va **riprodotto** prima di trattarlo come bug: potrebbe essere (a) la race
duplicati di D3, (b) una percezione conflata con il Close Project, oppure (c) un path di chiusura tab
non coperto da questa lettura.

---

## Catena causale ricostruita (scenario Close Project, spiegazione dominante)

1. **Apertura progetto.** `stateInitializer` carica `project.state`; lo stato su disco **non**
   contiene un `DGraph` `graphStyle==='v2-flow'` per il modello (mai salvato dopo la sua creazione
   runtime). `graphInfo` → `null` (`useJjomSync.ts:281-282`).
2. **Auto-populate al mount.** `needsNewGraph = !hasGraph = true` (`:401`) → `DGraph.new(0, modelid)`
   (`:630`) + tag `graphStyle='v2-flow'` (`:633`) + `DVertex.new` su **griglia di default**
   `x=50+col*420, y=50+row*300` (`:650-651`). Id dei vertici **freschi** (timestamp "ora").
3. **L'utente sposta i nodi.** Il drag aggiorna `DVertex.x/y` nel **runtime** idlookup
   (write-path OK, già escluso). Nessun `ProjectsApi.save` parte automaticamente (D5).
4. **Close Project.** `resetState` → `LoadAction(DState.new())` (`U.tsx:447`) azzera il runtime;
   i `tn deleted` (`reducer.ts:704`) cancellano in blocco grafi v2-flow + classici + vertici
   (orfani inclusi). Le `x/y` spostate, mai persistite, sono perse.
5. **Riapertura.** Si torna al passo 1: stato su disco invariato (senza grafo v2-flow / senza le
   posizioni) → l'auto-populate **rigenera** alla stessa griglia di default. Layout "tornato ai
   default".

Punto in cui le coordinate salvate vengono **ignorate**: non sono mai scritte su disco (manca il
salvataggio del passo 3), quindi al passo 1 non esistono da leggere; l'auto-populate del passo 2 non
ha nulla da riusare e applica la griglia. Dove finiscono i vecchi `DVertex`: cancellati in blocco al
passo 4 dal `resetState`.

---

## Punti candidati per il fix (solo inquadramento — nessuna proposta)

File/funzioni che il successivo prompt di implementazione dovrà valutare (in critical-zone: sola
lettura finché non autorizzato):

- **Persistenza del layout / autosave** — `frontend/src/api/persistance/projects.ts:94`
  (`ProjectsApi.save`), `frontend/src/components/topbar/SaveManager.ts:31-39` (`save`),
  trigger in `Navbar.tsx`/`LeftBar.tsx`, e il flag inerte `autosaveLayout`
  (`joiner/classes.ts:1283`, `:2807-2813`). Tema: se/quando persistere `DVertex.x/y` (e il grafo
  v2-flow) senza salvataggio esplicito.
- **Stabilità del grafo v2-flow attraverso il reload** — selettore di match
  `useJjomSync.ts:277-297` e gate `needsNewGraph` `:401`; creazione `:629-635`. Tema: garantire che
  un grafo v2-flow esistente (o le sue posizioni) sopravviva/sia ritrovato dopo il reload.
- **Allocazione id non deterministica** — `joiner/classes.ts:1290-1294` (`DGraph_makeID`,
  contatore globale) e il doppio incremento in `MetamodelTab.tsx:161-163`. Tema: id grafo non
  stabili per modello, accumulo `_graphN`.
- **Race creazione duplicati (da riprodurre prima)** — `useJjomSync.ts:390-394`, `:624`
  (`creatingGraphRef`) vs selettore asincrono `graphInfo`.
- **Read-path coordinate** — `jjomTransformers.ts:149-162` (lettura `__raw.x/y`) e
  `useJjomSync.ts:1059-1108` (init). Nessun bug rilevato qui: legge correttamente le coordinate
  quando il vertice è riusato.

---

## Correzioni ai riferimenti del prompt

- `resetState`: il prompt indicava `U.tsx ~:341`; reale **`U.tsx:446-449`** (a `:341` c'è
  `extractTopics`).
- `tn deleted`: prompt `reducer.ts ~:543`; reale **`reducer.ts:704`** (`'tn deleted 2'` a `:713`).
- `stateInitializer`: prompt `reducer.ts ~:1168`; reale **`reducer.ts:1460`**.
- `CloseProject`/`resetState` in Navbar: prompt `~:645-647`; reale call a **`Navbar.tsx:493`**
  (e `:1943`).
- Costruzione array `nodes` da `lGraph.nodes`: prompt `useJjomSync ~:1064-1094`; reale
  **`useJjomSync.ts:1064-1097`** (sostanzialmente corretto).
- Lettura `vertex.x/y` per la `position` RF: in `jjomTransformers.ts:151-162` (e `:196-203` per gli
  enum), non in un generico `classVertexToRFNode` esterno — la funzione è
  `classVertexToRFNode` a **`jjomTransformers.ts:40`**.
- `MetamodelTab` usa il grafo **classico** (`graphStyle !== 'v2-flow'`, `MetamodelTab.tsx:222`); il
  grafo v2-flow è dominio di `EditorV2`/`useJjomSync`.

---

**HARD STOP.** Nessuna modifica al codice proposta o applicata. In attesa del prompt di
implementazione.

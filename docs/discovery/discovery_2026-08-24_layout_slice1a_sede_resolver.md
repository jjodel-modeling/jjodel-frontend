# Discovery 2026-08-24 — layout per viewpoint, slice 1a, Fase 1: sede del resolver

**Corsia**: RC-3 (completa), Fase 1 di un two-phase. **Read-only**: nessun sorgente modificato.
**Effort**: xhigh. **Prompt**: «Layout per viewpoint, slice 1a, Fase 1 (discovery read-only)»,
2026-08-24.

## 0. Obiettivo

Rispondere a D1..D7 con citazione `file:riga`, per preparare la Fase 2 della slice 1a
(campo opzionale `layoutByViewpoint` su `DVertex` + modulo puro `writeVertexLayout` /
`readVertexLayout`, R-LAY-14..17). Nessuna proposta di diff.

## 0.1 In sintesi — cosa cambia rispetto alle attese del prompt

Cinque attese del prompt o delle righe ratificate risultano **da correggere a codice letto**.
Nessuna tocca l'impianto; tutte toccano il testo che la Fase 2 dovrebbe eseguire alla lettera.

| # | Attesa | Misura |
|---|---|---|
| A | «Il tipo di record è il `GraphSize` di `Geom.ts:677` più `isResized`» (R-LAY-13, R-LAY-14) | **Falsa come tipo.** `GraphSize` è una classe con membro `private` e ~56 membri: un record piatto non le è assegnabile (prova eseguita, §2.3). Il tipo va dichiarato strutturalmente. |
| B | «Il predicato di esclusività … è quello che `irResolveCore.ts:139` già usa» (R-LAY-16) | **Metà falsa.** Alla 139 c'è la sorgente dell'attivazione (`state.viewpoint`), non il predicato: `irResolveCore.ts` non nomina mai `isExclusiveView` (§5.2, con controllo positivo). Il predicato va preso altrove. |
| C | «Nessuna migrazione» (R-LAY-14) | **Confermata, e con un argomento più forte del previsto**: un bump gratuito ha un effetto collaterale reale su `updateDefaultView` (§3.3). I due precedenti sono discordi (§3.2). |
| D | Sede: «esiste già un import dal classico verso `editor-v2/**`?» | **Sì, e verso `viewpoint/ir/` in particolare**, incluso un import di *valore* da `utils/` (§1.2). Il verso è già aperto e portante. |
| E | `layoutByViewpoint` atteso 0 in `frontend/src` | **Confermato 0**, ma solo dopo che il controllo positivo ha smascherato una prima ricerca rotta (§7). |

---

## 1. D1 — Sede del modulo resolver

### 1.1 I consumatori attesi

- editor-v2 (slice 1b): `components/editor-v2/sync/canvasToJjom.ts`,
  `components/editor-v2/utils/jjomTransformers.ts`.
- Classico: `components/abstract/tabs/MetamodelTab.tsx:138-139` — verificate, sono le due
  `SetFieldAction` su `'x'` e `'y'` dentro `TRANSACTION('Set drop position', …)`, cioè il
  «drop» citato da R-LAY-16.
- Override del proxy L: `model/dataStructure/GraphDataElements.tsx:1402-1425` — verificate,
  sono `get_x/set_x`, `get_y/set_y`, `get_w/set_w`, `get_h/set_h`. La classe che le racchiude è
  **`LVoidVertex`** (dichiarata a `GraphDataElements.tsx:1356`), non `LVertex`.

### 1.2 Misura: il verso classico → `editor-v2/**` è già aperto

Ricerca su tutto `frontend/src` escluso `components/editor-v2/` stesso:

```
components/abstract/tabs/EditorSwitch.tsx:3    import { EditorV2 } from '../../editor-v2/EditorV2';
components/abstract/tabs/EditorSwitch.tsx:4    import { ActiveEditorProvider } from '../../editor-v2/ActiveEditorContext';
components/ui/ConditionalEditor/conditional.ts:11      import type { Predicate } from '../../editor-v2/viewpoint/ir/irTypes';
components/ui/ConditionalEditor/ConditionalEditor.tsx:7 import type { Conditional, Predicate } from '../../editor-v2/viewpoint/ir/irTypes';
components/ui/PredicateBuilder/PredicateBuilder.tsx:7   import { singleHopOf } from '../../editor-v2/viewpoint/ir/pathExpr';
components/ui/PredicateBuilder/PredicateBuilder.tsx:16  import type { Predicate, Literal, PathExpr } from '../../editor-v2/viewpoint/ir/irTypes';
components/ui/PredicateBuilder/predicateDefaults.ts:14  import type { Predicate, Literal, PathExpr } from '../../editor-v2/viewpoint/ir/irTypes';
components/ui/PathBuilder/PathBuilder.tsx:5             import { singleHopOf } from '../../editor-v2/viewpoint/ir/pathExpr';
components/contextMenu/ContextMenu.tsx:55      import { createVertexForObject, createCompositionEdgeForObjects } from '../editor-v2/sync/canvasToJjom';
components/TreeViewSidebar/TreeViewContent.tsx:27       import { useNodeProblems } from '../editor-v2/problems/useNodeProblems';
components/TreeViewSidebar/TreeViewContent.tsx:29       import type { NodeProblem } from '../editor-v2/problems/registry';
utils/lastViewpoint.ts:12                       import { computeCreationSeed } from '../components/editor-v2/viewpoint/ir/irCreationSeed';
utils/lastViewpoint.ts:13                       import type { AnyViewIR } from '../components/editor-v2/viewpoint/ir/irTypes';
```

Tre letture, tutte pertinenti:

1. **La domanda del prompt ha risposta affermativa.** Non solo esiste un import dal classico
   verso `editor-v2/**`: `ContextMenu.tsx:55` importa **valori** (`createVertexForObject`,
   `createCompositionEdgeForObjects`) da `editor-v2/sync/canvasToJjom`, e `ContextMenu` è
   montato dal classico (`MetamodelTab.tsx:171`, `ModelTab.tsx:42`, per R-LAY-12). Il verso è
   già portante, non teorico.
2. **Il verso è già aperto verso `viewpoint/ir/` in particolare**, e non solo per i tipi:
   `PredicateBuilder.tsx:7` e `PathBuilder.tsx:5` importano il valore `singleHopOf` da
   `viewpoint/ir/pathExpr`; `utils/lastViewpoint.ts:12` importa il valore `computeCreationSeed`
   da `viewpoint/ir/irCreationSeed`. Quest'ultimo è il precedente più vicino: un modulo di
   `utils/` che consuma un modulo puro di `viewpoint/ir/`.
3. **`viewpoint/ir/` è quasi joiner-free**, cioè compatibile con il vincolo R-LAY-16. Su tutti i
   `*.ts` della cartella solo 4 file importano dal joiner —
   `irDemoFixture.ts:18`, `irReadCtxLproxy.ts:8`, `irResolve.ts:13`, `useIRContainment.ts:14` —
   e sono i quattro moduli *impuri* per costruzione (fixture, lettura L-proxy, risoluzione con
   store, hook). Controllo positivo: la stessa ricerca su `editor-v2/sync/*.ts` restituisce 2
   occorrenze, quindi la ricerca ha segnale.

### 1.3 Conclusione D1

**`components/editor-v2/viewpoint/ir/` è la sede indicata**, e non apre alcun verso di
dipendenza nuovo: il verso classico → `viewpoint/ir/` esiste già, con import di valore, in tre
punti (`PredicateBuilder`, `PathBuilder`, `lastViewpoint`). La sede neutra (`joiner/`, `common/`)
non compra nulla che questa non abbia, e ha un costo misurato: `common/Geom.ts:1-18` importa il
barrel `../joiner` a runtime, ed è esattamente il motivo per cui un modulo in `common/` non è
testabile senza DOM (§2.2). `joiner/` è a maggior ragione escluso da R-LAY-16 («nessuna
dipendenza dal joiner»): metterci dentro un modulo che non deve dipendere dal joiner è una
contraddizione di sede.

Nota di merito, non bloccante: il nome `viewpoint/ir/` è dell'IR, e il resolver di layout non è
IR. Se si vuole tenere il confine semantico pulito, una sottocartella sorella
`components/editor-v2/viewpoint/layout/` sta nello stesso perimetro di dipendenza, con lo stesso
costo di import, e non prende in prestito un nome che non le appartiene. È una scelta di Alfonso,
non un finding: entrambe soddisfano D1 e R-LAY-16.

---

## 2. D2 — Import-safety del modulo e del suo test

### 2.1 Dove vive davvero `GraphSize`

Il prompt e R-LAY-13 citano `Geom.ts:677`. Il file è **`frontend/src/common/Geom.ts`** (1278
righe), non `joiner/types/Geom.ts`. Alla riga 676-677:

```
common/Geom.ts:676   @RuntimeAccessible('GraphSize')
common/Geom.ts:677   export class GraphSize extends ISize<GraphPoint> {
common/Geom.ts:678       private dontMixWithSize: any;
```

### 2.2 Perché un import a runtime muore (prova eseguita)

`common/Geom.ts:1-18` importa il barrel `../joiner` per valori (`Temporary`, `TLCoord`,
`DPointerTargetable`, `RuntimeAccessible`, `windoww`, `Log`, `RuntimeAccessibleClass`, `U`) e
`React` alla riga 18.

**Prova C**, eseguita: un file di test in
`components/editor-v2/viewpoint/ir/__tests__/` con `import { GraphSize } from '…/common/Geom'`
(import di **valore**):

```
ReferenceError: window is not defined
 ❯ node_modules/monaco-editor/esm/vs/base/browser/window.js:14:27
 Test Files  1 failed (1)
      Tests  no tests
```

Conferma la Fase 1b: il barrel trascina `monaco-editor`. Il file di prova è stato rimosso;
`git status --porcelain` vuoto dopo la rimozione.

### 2.3 Il type-only import è verde, ma `GraphSize` non è il tipo giusto

**Prova A**, eseguita: stesso percorso, `import type { GraphSize } from '…/common/Geom'` con
`type VertexLayoutA = Pick<GraphSize, 'x'|'y'|'w'|'h'> & { isResized: boolean }`:

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  108ms
```

Il type-only import è **erased** e non trascina nulla. Ma `GraphSize` per intero non è
utilizzabile come tipo del record.

**Prova B**, eseguita (`npx tsc --noEmit` su un modulo di prova che assegna un literal piatto):

```
src/components/editor-v2/viewpoint/ir/zzprobeB.ts(3,14): error TS2740:
  Type '{ x: number; y: number; w: number; h: number; }' is missing the following properties
  from type 'GraphSize': dontMixWithSize, new, makePoint, closestPoint, and 52 more.
```

`GraphSize` è una classe con un membro `private` (`dontMixWithSize`, riga 678) e ~56 membri
totali. Il `private` la rende **nominale**: nessun oggetto letterale le è assegnabile, nemmeno
uno con tutti i campi pubblici giusti. Un record persistito in Redux — che è un POJO, non
un'istanza di classe — non può essere tipato `GraphSize`.

### 2.4 Conclusione D2

Il modulo può usare `import type` senza rompere i test, ma **`VertexLayout` non può essere
`GraphSize & {isResized}`**. Due forme praticabili, entrambe misurate compatibili:

- `type VertexLayout = Pick<GraphSize, 'x'|'y'|'w'|'h'> & { isResized: boolean }` — con
  `import type` da `common/Geom`. Verde alla Prova A. Tiene un aggancio nominale alla fonte.
- `interface VertexLayout { x: number; y: number; w: number; h: number; isResized: boolean }` —
  zero import, zero accoppiamento.

Raccomandazione per la Fase 2: la seconda. Il vincolo R-LAY-16 è «modulo puro, nessuna dipendenza
dal joiner»; un `import type` verso un file che importa il joiner è erased al compile ma resta un
arco nel grafo delle dipendenze dichiarate, e la Prova B mostra che l'aggancio a `GraphSize` non
compra type-safety reale (i quattro campi sono `number`, li si riscrive in una riga). Ma è una
decisione da ratificare, perché R-LAY-13 e R-LAY-14 dicono «il `GraphSize` di `Geom.ts:677`»: la
riga va emendata in un modo o nell'altro. **Domanda aperta 1.**

---

## 3. D3 — Idioma di dichiarazione del campo su `DVertex`

### 3.1 Come sono dichiarati i campi (nessun decoratore, nessun default)

La classe è `DVertex` a `model/dataStructure/GraphDataElements.tsx:1662`
(`@RuntimeAccessible('DVertex')` alla 1661). I campi:

```
GraphDataElements.tsx:1670   isSelected!: Dictionary<DocString<Pointer<DUser>>, boolean>;
GraphDataElements.tsx:1674   x!: number;
GraphDataElements.tsx:1675   y!: number;
GraphDataElements.tsx:1676   w!: number;
GraphDataElements.tsx:1677   h!: number;
GraphDataElements.tsx:1678   isResized!: boolean;
GraphDataElements.tsx:1679   snap?: GraphPoint;
GraphDataElements.tsx:1681   ghostOffsets?: { [refId: string]: { dx: number; dy: number } };
GraphDataElements.tsx:1683   ghostParentOffsets?: { [classId: string]: { dx: number; dy: number } };
GraphDataElements.tsx:1686   irEdgeLayout?: { sourceSide?: …; targetSide?: …; waypoints?: … };
GraphDataElements.tsx:1692   irCollapsed?: boolean;
```

**Nessun decoratore per campo, nessuna macchineria per campo.** Sono dichiarazioni TypeScript
nude: `!` per i campi che il costruttore popola, `?` per gli opzionali. Il solo decoratore è
`@RuntimeAccessible('DVertex')` sulla classe.

I precedenti a dizionario opzionale sono **quattro**, non due: oltre a `ghostOffsets` e
`ghostParentOffsets` citati da R-LAY-14, ci sono `irEdgeLayout` e `irCollapsed`, entrambi già
record annidati opzionali sullo stesso `DVertex`. `layoutByViewpoint` sarebbe il quinto della
stessa famiglia, non un'eccezione.

### 3.2 Default in `classes.ts`: nessuno per gli opzionali

`joiner/classes.ts:1000` è `DVertex(): this {` (il costruttore incrementale), `:1281` è
`DVoidVertex(defaultVSize?: InitialVertexSize)`. Il solo campo a dizionario inizializzato è:

```
joiner/classes.ts:1050   thiss.isSelected = {};
```

`ghostOffsets`, `ghostParentOffsets`, `irEdgeLayout`, `irCollapsed` **non compaiono in
`classes.ts`** (ricerca su `ghostOffsets` in `joiner/classes.ts`: 0 occorrenze; controllo
positivo `isSelected`: 1, riga 1050). Nascono `undefined` e i consumatori usano `?? {}`.
`layoutByViewpoint` seguirebbe questi quattro, non `isSelected`.

### 3.3 Serializzazione: nessuna allowlist, nessun adapter

La persistenza serializza l'oggetto D **intero**, non un elenco di campi:

```
components/project/ProjectEditor.tsx:563   project: (project as any).__raw || project
components/project/ProjectEditor.tsx:565   const jsonString = JSON.stringify(projectData, null, 2);
```

Nessuna allowlist di campi, nessun adapter di serializzazione da estendere. Un campo nuovo sul
D-object è persistito per il solo fatto di esistere, e un campo `undefined` è omesso da
`JSON.stringify` — che è precisamente la semantica «il dizionario nasce assente» di R-LAY-14.

### 3.4 Migrazione: l'attesa di R-LAY-14 è confermata, con un argomento nuovo

I due precedenti sono **discordi**, e il prompt non lo sapeva:

- `ghostOffsets` e `ghostParentOffsets` **hanno** una migrazione, ma è un no-op dichiarativo:
  ```
  VersionFixer.tsx:826-829   // 2.218 → 2.219: introduce optional DVertex.ghostOffsets …
                             // Default-absent (undefined → {} consumer-side), so no
                             // per-instance seeding is needed — bump only.
                             private ['2.218 -> 2.219'](s: DState): DState { return s; }
  VersionFixer.tsx:831-834   // 2.219 → 2.220: … ghostParentOffsets … bump only.
                             private ['2.219 -> 2.220'](s: DState): DState { return s; }
  ```
- `irEdgeLayout` e `irCollapsed` **non ne hanno nessuna**: ricerca in `VersionFixer.tsx` →
  `irEdgeLayout` 0, `irCollapsed` 0; controllo positivo `ghostOffsets` → 1.

Il bump gratuito **non è neutro**. `VersionFixer.update` esegue, dopo il ciclo delle migrazioni:

```
VersionFixer.tsx:133-143
  for (let k in s.idlookup) { …
      if (cn !== 'DViewElement' && cn !== 'DViewPoint') continue;
      if (v.className.includes("View") && v.version !== VersionFixer.highestVersion && !v.clonedCounter){
          LViewElement.updateDefaultView(v, s);
      }
  }
```

Ogni bump di `highestVersion` **rigenera in blocco tutte le default view non toccate**
(`clonedCounter` undefined). È un effetto collaterale reale e già documentato nel commento di
`VersionFixer.tsx:2.220 -> 2.221` («untouched default views are also regenerated wholesale by
updateDefaultView via the version bump»). Un bump aggiunto solo per documentare un campo
opzionale paga quell'effetto senza contropartita.

### 3.5 Conclusione D3

**L'attesa di R-LAY-14 è confermata a codice letto, e rafforzata.** Un campo persistito nuovo
richiede di toccare **un solo file**: la riga di dichiarazione in `GraphDataElements.tsx`.
Nessun default in `classes.ts` (i quattro opzionali precedenti non ce l'hanno), nessuna
allowlist di serializzazione (si serializza l'oggetto intero), nessun adapter. La migrazione non
serve tecnicamente, e il precedente `irEdgeLayout`/`irCollapsed` mostra che il codebase l'ha già
omessa due volte per campi della stessa forma. Il no-op di `ghostOffsets` era documentazione
pagata con una rigenerazione delle default view.

---

## 4. D4 — Forma della scrittura sul dizionario

### 4.1 I due idiomi esistenti

**`isSelected` — merge parziale in una action, con l'inverso:**
```
GraphDataElements.tsx:955-956
  TRANSACTION(this.get_name(c)+'.select('+ duser.name+')', ()=>{
      SetFieldAction.new(c.data.id, "isSelected", map, '+=', false);
GraphDataElements.tsx:971-973
  TRANSACTION(… '.deselect(' …), ()=>{
      SetFieldAction.new(c.data.id, "isSelected", map as any, '-=', false);
```

**`ghostOffsets` — sostituzione dell'intero dizionario:**
```
components/editor-v2/nodes/ClassNode.tsx:99
  TRANSACTION('persist ghost offset', () => {
      SetFieldAction.new(id as any, 'ghostOffsets' as any, map, undefined, false); });
```
Il commento alla riga 92-93 dichiara la parentela: «Mirrors syncPositionToJjom
(canvasToJjom.ts): TRANSACTION + SetFieldAction». La rimozione di una chiave passa dallo stesso
whole-write con la chiave cancellata dalla copia (`ClassNode.tsx:137-142`, `onGhostReset`).

### 4.2 Semantica di `'+='` su un oggetto (reducer)

`redux/reducer/reducer.ts`, ramo `case '+=':` alla riga 177:

```
reducer.ts:179-193
  oldValue = current[key];
  …
  switch (typeof oldValue){
      case 'object':
          if (Array.isArray(oldValue)) isArrayAppend = true;
          else isObjectMerge = true;
          break;
      default:
          if (oldValue === undefined || oldValue === null) break; // keep newVal unchanged, act as '='
```

e l'applicazione:

```
reducer.ts:240-252
  if (isObjectMerge) {
      if (typeof newVal === 'string') { let tmp: any = {}; tmp[newVal] = true; newVal = tmp; }
      oldValue = {...current[key]};
      current[key] = {...current[key]};
      for (let subkey in newVal) {
          if (current[key][subkey] === newVal[subkey]) continue;
          let subval = current[key][subkey] = newVal[subkey];
          gotChanged = true;
```

Due proprietà decisive:

1. **`'+='` su un oggetto è un merge superficiale per chiave di primo livello.** Scrivere
   `{ [vpId]: record }` sostituisce il record di `vpId` e **lascia intatti i record degli altri
   viewpoint**. È esattamente la semantica che serve.
2. **Il caso «dizionario assente» è già gestito.** Se `layoutByViewpoint` è `undefined` (il caso
   normale al primo gesto, §3.3), il ramo `default:` fa `break` e l'action «agisce come `'='`»:
   il campo viene creato con il valore passato. **Nessun seeding, nessuna action preparatoria.**

### 4.3 Il path annidato è esprimibile, ma non serve

`redux/action/action.ts:364` costruisce `ret.pathArray = ret.path.split('.')`, quindi un path
`layoutByViewpoint.<vpId>` è formalmente esprimibile — **a condizione che `vpId` non contenga
punti**. Gli id di viewpoint osservati non ne contengono (`Pointer_DefaultViewPoint`,
`1696213915306_Pointer1696212980601_3761799`), ma la garanzia è implicita e non dichiarata da
nessuna parte: è un vincolo che la Fase 2 erediterebbe senza che nessuno l'abbia scritto.

L'idioma `'+='` non ha questo problema: la chiave passa come chiave di oggetto, non come
segmento di path, e i punti sarebbero innocui.

### 4.4 Risposta alla domanda di R-LAY-15: sì, in una sola action

```
SetFieldAction.new(vertexId, 'layoutByViewpoint', { [vpId]: fullRecord }, '+=', false)
```

**Una** action. Materializza il record completo sotto la chiave, non produce stati intermedi
parziali, preserva gli altri viewpoint, e funziona anche quando il dizionario non esiste ancora.
La clausola di R-LAY-15 («materializza il record completo dai valori efficaci in lettura e poi
applica la patch») si traduce quindi in: il resolver **calcola** il record completo (merge di
lettura + patch) in memoria, e lo scrive con una sola action. Il «poi applica la patch» è un
ordine di calcolo, non due scritture. Vale la pena scriverlo così nella Fase 2, perché una
lettura letterale della riga suggerirebbe due action e quindi uno stato intermedio parziale —
esattamente ciò che l'emendamento voleva vietare.

### 4.5 Undo

Il reducer cattura `oldValue = {...current[key]}` (`reducer.ts:242`) **prima** del merge: è una
copia superficiale del dizionario intero pre-scrittura. La storia è tenuta in
`statehistory[forUser].undoable` e riapplicata da `doUndoRedo` (`reducer.ts:1127-1135`,
`case UndoAction.type` alla riga 1157). L'undo di un `'+='` su dizionario **ripristina quindi il
dizionario intero**, non solo la chiave toccata: è la granularità giusta per il layout (un undo
riporta il vertice al layout precedente sotto quel viewpoint) e coincide con quella di
`isSelected`, che usa lo stesso ramo da sempre.

**Limite dichiarato**: non ho eseguito un undo end-to-end su un `'+='` di dizionario. La lettura
è statica sul reducer. Se la Fase 2 vuole una garanzia forte sull'undo, serve un test sul
reducer, che è fuori dal perimetro della slice 1a (il modulo resolver è puro e non tocca lo
store). **Domanda aperta 2.**

---

## 5. D5 — Viewpoint attivo ed esclusività

### 5.1 La sorgente dell'attivazione

```
components/editor-v2/viewpoint/ir/irResolveCore.ts:139   const vp = state.viewpoint as string;
```
dentro `getIRIndex(state, signature)` (dichiarata alla 134). Il filtro che ne segue:
```
irResolveCore.ts:143-145   const d = lookup?.[vid];
                           if (!d || d.viewpoint !== vp) continue;
```
La stessa lettura compare una seconda volta nello stesso file:
```
irResolveCore.ts:117   const vp = state.viewpoint;
```

La sorgente è dunque la **root** `state.viewpoint`, non `project.activeViewpoint`. Le due sono
tenute allineate dall'unico scrittore vivo, `activateViewpoint` (`utils/lastViewpoint.ts:49`),
che le scrive entrambe alle righe 60 e 69 — e il commento alle righe 64-68 enumera i quattro
lettori della root: «EditorSwitch.tsx:55, Toolbar.tsx:202, irResolveCore.ts:117,139». Coerente
con R-LAY-11.

### 5.2 Il predicato di esclusività **non è lì** (finding)

R-LAY-16 scrive: «Il predicato di esclusività e la sorgente del viewpoint attivo sono quelli che
`irResolveCore.ts:139` già usa». **La seconda metà è vera, la prima no.**

Ricerca di `isExclusiveView` su `components/`, `joiner/`, `model/`, `redux/`, `common/`,
`utils/`: 25 occorrenze, **nessuna in `irResolveCore.ts`** né altrove sotto
`components/editor-v2/`. Controllo positivo: la stessa ricerca trova `selectors.ts:558`,
`joiner/classes.ts:1116` e `:4068`, `utils/lastViewpoint.ts:96` — ha segnale.

`irResolveCore` non filtra per esclusività perché non ne ha bisogno: indicizza le view il cui
`d.viewpoint === vp`, e `vp` è già il viewpoint che l'utente ha attivato. La distinzione
esclusivo/decorativo vive altrove:

```
joiner/classes.ts:1116        thiss.isExclusiveView = true;          (default del costruttore DViewPoint)
redux/selectors/selectors.ts:558   else if (!dvp.isExclusiveView) tnv.viewPointMatch = ViewEClassMatch.VP_Decorative;
utils/lastViewpoint.ts:96          isExclusiveView: !!d.isExclusiveView,
```

Non esiste una funzione-predicato riusabile: è ovunque una lettura diretta del campo
`isExclusiveView` sul D-object del viewpoint.

### 5.3 Dove deve vivere l'adapter impuro — e il precedente esatto

Il precedente da copiare è nello stesso file che possiede l'attivazione,
`utils/lastViewpoint.ts:79-102`, con il commento che dichiara il pattern:

```
utils/lastViewpoint.ts:79-84
  /**
   * Builds the audit input from the current store. Lives here, at the choke point, so
   * `globalCssAudit` stays a pure module with no store dependency.
   */
  function collectViewCssDescriptors(activeViewpointId: string | null): ViewCssDescriptor[] {
      const idlookup: any = store.getState()?.idlookup ?? {};
```
e alla riga 96 legge proprio `isExclusiveView: !!d.isExclusiveView`.

È la forma esatta che D5 cerca: **un adapter impuro al choke point, che tiene puro il modulo a
valle**. La funzione che calcola `activeExclusiveVpId` farebbe la stessa cosa, in tre righe:
leggere `state.viewpoint`, risolvere `idlookup[vp]`, restituire `vp` se
`!!d.isExclusiveView` e `null` altrimenti.

**Non esiste già** una utility che faccia questo lavoro: nessuna delle 25 occorrenze di
`isExclusiveView` combina la lettura dell'attivazione con il predicato. Va scritta.

**Sede dell'adapter** — due candidati, entrambi «un punto solo» per R-LAY-11:

- `utils/lastViewpoint.ts`, accanto ad `activateViewpoint` e a `collectViewCssDescriptors`: è il
  choke point dell'attivazione, ed è dove il precedente vive. Costo: il file importa il joiner
  (riga 7), quindi l'adapter sarebbe non testabile senza DOM — ma è impuro per definizione, non
  è il modulo che R-LAY-16 vuole puro.
- accanto al resolver, in un file separato dal modulo puro (es. `layoutResolverAdapter.ts` di
  fianco a `layoutResolver.ts`), sul modello `irResolve.ts` (impuro, importa `store` alla riga
  13) di fianco a `irResolveCore.ts` (puro). È il pattern che `viewpoint/ir/` usa già.

Il secondo tiene i due pezzi della slice insieme e replica una separazione già in uso a tre file
di distanza. **Domanda aperta 3.**

### 5.4 Nota su `set_size`

R-LAY-16 cita «`set_size` del proxy L (`GraphDataElements.tsx:668-685`)». Righe verificate: è
`set_size(size0, c, isAutosize)`, con le quattro `SetFieldAction` su `x/y/w/h` alle righe
677-680. La classe che la racchiude è però **`LGraphElement`** (dichiarata a
`GraphDataElements.tsx:135`), non `LVoidVertex`: serve quindi anche gli edge point, non solo i
vertici. Il «dichiarato, non instradato» di R-LAY-16 resta valido; la nota serve alla Fase 1b,
perché instradarla in futuro toccherebbe più del vertice.

---

## 6. D6 — Precedente di test senza DOM, e baseline

### 6.1 Il precedente

Tutti i test di `components/editor-v2/viewpoint/ir/__tests__/` (12 file) sono verdi. I due più
vicini per forma:

- `irValidate.test.ts:1-10` — l'intestazione dichiara il contratto cercato: «Pure: no store, no
  React — irValidate -> irCompile is joiner-free».
- `irCreationSeed.test.ts:1-12` — «Il modulo è puro: i test lo esercitano direttamente, senza
  store e senza mock»; e il modulo sotto test è quello importato da `utils/lastViewpoint.ts:12`,
  cioè il precedente di sede del §1.2.

Un terzo, fuori da `viewpoint/ir/`, è il precedente **di architettura** più stretto:
`utils/__tests__/globalCssAudit.test.ts`, che testa il modulo puro la cui parte impura vive nel
choke point (§5.3).

Raccomandazione Fase 2: `irCreationSeed.test.ts` come modello di forma, `globalCssAudit` come
modello della separazione puro/adapter.

### 6.2 Baseline riprodotte

**`npx tsc --noEmit`** — exit 2, **33 errori**, identica alla baseline dichiarata in
CLAUDE.md §17. Distribuzione: 12 × TS1261 + 7 × TS1149 (casing `Settings/` vs `settings/`, = 19),
più 14 sparsi (4 × TS7053, 2 × TS2304, 2 × TS2322, 2 × TS2339, 1 × TS2307, 1 × TS2345,
1 × TS2552, 1 × TS2769). Conteggio preso sull'output **completo** (`grep -c 'error TS'` sul file
intero, non su una coda), per la regola di §5 di CLAUDE.md.

**`npx vitest run`** — exit 0, **9 suite fallite / 51 passate (60)**, **1323 test passati**.
L'attesa del prompt («1315+ passed, 9 suite rosse») è confermata. Le 9 rosse, enumerate:

```
src/jjscript/__tests__/context-binding.test.ts
src/jjtl/__tests__/abstract-target.test.ts
src/jjtl/__tests__/ai-prompt-sanitization.test.ts
src/jjtl/__tests__/circular-refs.test.ts
src/jjtl/__tests__/executor-bridge.test.ts
src/jjtl/__tests__/executor-llayer.test.ts
src/jjtl/__tests__/forall-mapping.test.ts
src/jjtl/__tests__/source-alias.test.ts
src/utils/__tests__/UDComparator.test.ts
```

Due cause distinte, non una: `monaco-editor/esm/vs/base/browser/window.js:14` (via il barrel
joiner) e `src/utils/PerformanceMetrics.ts:220` (`(window as any).PerformanceMetrics = …`).
**Nessuna delle 9 è sotto `components/editor-v2/`**: la sede scelta al §1.3 non è contaminata.

Nota metodologica: la prima enumerazione, presa dalla coda dell'output, ne mostrava 3 su 9 —
la vista terminale di vitest riscrive le righe. Le 9 sopra vengono da una ri-esecuzione con
l'output completo catturato su file. È la stessa trappola del conteggio `tail -60` documentata
in CLAUDE.md §5.

---

## 7. D7 — Grep di collisione

Su `frontend/src`, `--include="*.ts" --include="*.tsx"`, con `command grep` (BSD) per avere
`--include` funzionante — il `grep` interattivo è un wrapper `ugrep` che lo ignora (CLAUDE.md §5):

| Nome | Occorrenze in `frontend/src` |
|---|---|
| `layoutByViewpoint` | **0** |
| `VertexLayout` | **0** |
| `writeVertexLayout` | **0** |
| `readVertexLayout` | **0** |
| `ghostOffsets` (controllo positivo) | **18** |

Le 18 del controllo positivo si distribuiscono su `ClassNode.tsx` (11), `jjomTransformers.ts` (2),
`EditorV2.tsx` (1), `canvasToJjom.ts` (1), `GraphDataElements.tsx:1685` (1),
`VersionFixer.tsx:826` (1) — quindi la ricerca raggiunge sia i consumatori sia la dichiarazione
sia la migrazione: ha segnale su tutte le categorie di sito che interessano.

**Il controllo positivo ha lavorato.** La prima esecuzione, con i glob non quotati, è stata
mangiata da zsh:
```
(eval):1: no matches found: --include=*.ts
--- ghostOffsets ---  (count: 0)
```
Un `0` su `ghostOffsets` è impossibile, e ha rivelato che tutti i quattro `0` precedenti erano
il silenzio di un comando mai eseguito, non un risultato negativo. I numeri della tabella sono
quelli della seconda esecuzione, con i glob quotati.

`docs/**` è fuori scope, come da prompt: `layoutByViewpoint` vi compare nelle righe R-LAY-14..17
di `docs/decisions.md` e nei memo del 2026-08-24. Nessuna collisione di codice.

---

## 8. File letti

```
frontend/src/model/dataStructure/GraphDataElements.tsx   (78, 135, 666-688, 940-1001, 1319, 1356, 1400-1428, 1661-1707)
frontend/src/joiner/classes.ts                            (1000, 1050, 1116, 1281, 4068)
frontend/src/common/Geom.ts                               (1-25, 670-700; wc = 1278)
frontend/src/redux/VersionFixer.tsx                       (34, 82-105, 110-145, 764-1188)
frontend/src/redux/reducer/reducer.ts                     (100-330, 1127-1200)
frontend/src/redux/action/action.ts                       (364, 481-540, 673-700, 799)
frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts        (117, 125-155)
frontend/src/components/editor-v2/viewpoint/ir/__tests__/irValidate.test.ts       (1-12)
frontend/src/components/editor-v2/viewpoint/ir/__tests__/irCreationSeed.test.ts   (1-13)
frontend/src/components/editor-v2/viewpoint/ir/__tests__/pathExpr.test.ts         (1-12)
frontend/src/components/editor-v2/nodes/ClassNode.tsx     (75-150, 551)
frontend/src/components/abstract/tabs/MetamodelTab.tsx    (130-145)
frontend/src/components/project/ProjectEditor.tsx         (555-575)
frontend/src/utils/lastViewpoint.ts                       (1-125)
frontend/src/utils/__tests__/globalCssAudit.test.ts       (1-15)
frontend/src/redux/selectors/selectors.ts                 (558)
docs/decisions.md                                         (11, 20, 31-39, 1703-1755)
docs/ratifiche/claude_2026-08-24_memo_ratifica_layout_slice1.md   (intero)
```

Tre file di prova sono stati creati ed eliminati nella stessa esecuzione (§2.2-2.3);
`git status --porcelain` verificato vuoto dopo ciascuna rimozione.

## 9. Dipendenze e rischi per la Fase 2

1. **`GraphSize` non è utilizzabile come tipo del record** (§2.3, prova tsc). Se la Fase 2
   esegue R-LAY-14 alla lettera, non compila. Va deciso `Pick<…>` o interfaccia propria.
2. **Il predicato di esclusività va scritto**, non riusato (§5.2). R-LAY-16 lascia intendere che
   esista già a `irResolveCore.ts:139`; non c'è.
3. **`'+='` su dizionario assente agisce come `'='`** (§4.2). È una proprietà del reducer, non
   documentata altrove: se cambiasse, il resolver perderebbe l'auto-inizializzazione senza
   errore visibile. Vale un commento sul sito di scrittura che cita `reducer.ts:186-188`.
4. **Undo su `'+='` di dizionario non verificato a runtime** (§4.5). Rischio basso (stesso ramo
   di `isSelected` da sempre), ma dichiarato.
5. **Nessuna migrazione, e nessun bump** (§3.4-3.5). Se la Fase 2 aggiungesse un no-op per
   simmetria con `ghostOffsets`, pagherebbe una rigenerazione in blocco delle default view non
   toccate (`VersionFixer.tsx:133-143`).

## 10. Domande aperte per Alfonso

1. **Tipo del record.** `Pick<GraphSize,'x'|'y'|'w'|'h'> & {isResized: boolean}` con `import
   type`, o interfaccia autonoma senza alcun import? Entrambe misurate verdi; la seconda è più
   fedele a «modulo puro» di R-LAY-16. In ogni caso R-LAY-13/R-LAY-14 vanno emendate: «il
   `GraphSize` di `Geom.ts:677`» non è eseguibile come scritto (§2.3).
2. **Undo.** Serve un test sul reducer per l'undo del `'+='` su dizionario, o basta la lettura
   statica del §4.5? Un test del genere è fuori dal perimetro puro della slice 1a.
3. **Sede dell'adapter impuro.** Accanto ad `activateViewpoint` (`utils/lastViewpoint.ts`, dove
   il precedente `collectViewCssDescriptors` vive), o accanto al resolver sul modello
   `irResolve.ts` / `irResolveCore.ts`? (§5.3)
4. **Nome della sede.** `components/editor-v2/viewpoint/ir/` come da prompt, o una sorella
   `viewpoint/layout/`? Stesso perimetro di dipendenza, stesso costo; la seconda non presta al
   layout un nome che è dell'IR. (§1.3)
5. **R-LAY-16, seconda metà della clausola sul predicato.** Va emendata come «la sorgente
   dell'attivazione è quella di `irResolveCore.ts:139`; il predicato di esclusività è la lettura
   diretta di `isExclusiveView` sul D-object del viewpoint, come a `utils/lastViewpoint.ts:96`»?
   (§5.2)

---

## 11. Addendum 2026-08-24 (Fase A della slice 1b) — il censimento dei siti va corretto

Aggiunto in coda a questo report e non in un report nuovo, per R-E/E-1. Misure prese a
`474809b55`, materiale completo in `docs/reports/2026-08-24-lir-layout-slice1b.md`.

**1. Le letture di `jjomTransformers.ts` sono sette, non quattro.** Il censimento di
`discovery_2026-08-24_layout_d1_d8_d10.md` §4 e la tabella del memo di proposta §4 elencano
«`manualSizeOf` (`:50-57`) e tre coppie di posizione (`:173-174`, `:219-220`, `:241-242`)».
A codice letto mancano tre siti:

- `objectVertexToRFNode` — posizione a **`:346-348`**. È il transformer dei nodi **M1**: senza
  questo, su un *modello* (l'unico contesto dove il selettore di viewpoint è reso) il layout per
  viewpoint non sarebbe visibile.
- `packageVertexToRFNode` — taglia a **`:243-244`**, con default 400/300, che **non** passa da
  `manualSizeOf` e finisce in `style.width/height`.
- `computeOptimalHandles` — geometria di sorgente e destinazione a **`:404-413`**, con default
  180/80. Sceglie gli handle: se legge gli scalari mentre i nodi sono posizionati sul record del
  viewpoint, gli archi si ancorano dal lato sbagliato.

**2. `LVoidVertex`: il blocco è `:1398-1425`, non `:1403-1425`** (`:1398-1401` commento, `:1402`
`get_x`, `:1403` `set_x`). E i suoi consumatori **non sono censibili per grep**: le otto funzioni
sono raggiunte dal proxy come accesso a proprietà (`lvertex.x`), non chiamate per nome — la
ricerca di `get_x(` su `components/`, `model/`, `view/`, `common/` non trova un solo call-site
fuori da `GraphDataElements.tsx`.

**3. Le scritture di `canvasToJjom.ts` e il drop di `MetamodelTab.tsx` sono confermati riga per
riga** (`:46-47`, `:59-60`, `:78-80`, `:92`, `:105-107`; `:138-139`). Nota operativa: le cinque
funzioni di `canvasToJjom` ricevono un `vertexId`, non il D-object, quindi la materializzazione
del record richiede una lettura dallo store (idioma già in uso nello stesso file, 9 occorrenze);
`MetamodelTab` invece passa già `tm.node!.__raw`.

**4. Fatto nuovo, che nessuna riga a registro copriva.** Un cambio di viewpoint **non
ri-trasforma** i nodi: `useJjomSync.ts` non nomina mai `viewpoint` (0 occorrenze, controllo
positivo `modelid` = 27) e la ri-trasformazione integrale è armata solo dal cambio di `modelid`,
dall'uscita da JjOM mode e dall'unmount (`:1168-1188`, `:1538-1548`); il ramo incrementale salta
l'elemento quando il riferimento al D-object è invariato (`:1349`). Conseguenza: la slice 1b, come
specificata, produce **persistenza corretta senza resa reattiva** — il read-through è osservabile
dopo un reload o una mutazione del vertice, non all'attivazione di un altro viewpoint. Le opzioni
sono al §4.3 del LIR; la decisione è di Alfonso.

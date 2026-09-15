# Discovery — E-route: re-ancoraggio a HEAD (Fase 0)

**Data**: 2026-08-06
**Prompt**: "2026-08-06 02:33 E-route routing autorabile degli edge IR (Manhattan / Direct / Bezier)"
**Branch**: `alfonso-frontend-jjtl`
**HEAD**: `2f67ad8be chore(docs): sync CLAUDE.md with codebase reality`
**Tipo**: re-ancoraggio read-only, nessun file di codice toccato.

---

## Obiettivo

Ri-verificare a HEAD le assunzioni del prompt E-route, i cui `file:riga` provengono
da una discovery di inizio agosto su un ramo poi avanzato di ~20 commit. Il report
chiude i punti (a)..(h) della Fase 0 e valuta le quattro regole di uscita.

**Esito complessivo: nessuna regola di uscita scatta. Via libera alla Fase 1.**

---

## 0. Fotografia del working tree

`git log --oneline` dal 2026-08-04 a HEAD (20 commit, dal piu` recente):

```
2f67ad8be chore(docs): sync CLAUDE.md with codebase reality
f15a22bd2 fix: anchor CLAUDE.md gitignore rule to repo root and land jjtl CLAUDE.md
d8159c2f0 fix: declare unsaved single-endpoint state and correct divergence messaging
59dfb096d refactor: extract edge endpoint helpers into a pure module
9518cb614 docs: land slice 0 log entry and discovery reports
e53a05cb6 chore(docs): rotate the prompt log, third batch
3e46ee608 fix(ir): exclude the authoring pin from the delegation comparison
6c75070a5 fix(styles): stop native checkboxes from swallowing their own click
383170dc0 fix(editor): open the Template tab read-only on legacy views without IR
1d5b55aed fix(migration): recognise tool-generated default views in isKnownDefault
85fc8aa3e feat: pin the authoring metaclass by identity in the IR
49c32c134 fix: keep committed edge endpoints while the pair is being edited
a80d282a5 docs: discovery on authoring panel state lifting for the tab partition
f83252d06 docs: discovery on lifting panel UI state for the tab partition
709004102 docs: close Q1 by measurement, correct the Style override channel
e28ab99bd docs: add legacy viewpoint census discovery report
79a0d90c2 docs: discovery on tab authority for IR-authored views
c43a296a3 docs: rehydration discovery, log rotation, mandatory report commits
fc0af70d2 refactor: extract PathExpr parser into a pure module shared by authoring widgets
2b5982951 fix: mark project dirty on IR inline edits
```

`git status`:

```
On branch alfonso-frontend-jjtl
Your branch is ahead of 'origin/alfonso-frontend-jjtl' by 8 commits.

Changes not staged for commit:
	modified:   docs/claude-code-log.md

Untracked files:
	CLAUDE-BAK-NOT-TO-USE.md
```

**Lettura**: la coda arco A ha gia` fatto atterrare `59dfb096d` (estrazione di
`edgeEndpoints.ts`, che tocca `EdgeAuthoringPanel.tsx`) e `d8159c2f0`. Il working
tree e` sporco **solo** su `docs/claude-code-log.md` e su un file di backup
untracked. **Nessun file bersaglio della Fase 1 e` sporco.**

### Rettifica di path nel prompt

Il prompt cita `docs/discovery/discovery_2026-08-03_edge_expressiveness_v2.md`.
**Quel path non esiste.** Il documento reale e`
`docs/discovery/discovery_2026-08-02_edge_expressiveness_v2.md` (80 KB, mtime
3 ago 16:31): contiene Area C con OQ-14/OQ-15/OQ-16 (`:396-459`) e la sezione
"Dipendenze e rischi" (`:463-497`). Contenuto univocamente corrispondente a
quello citato; discrepanza di sola data nel nome file. Letto quello.

`docs/decisions.md` **non esiste** (segnalato come previsto dal punto 3 del
prompt; la sua creazione appartiene alla coda arco A).

---

## File letti

- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (822 righe, integrale)
- `frontend/src/components/editor-v2/edges/SegmentHandles.tsx` (169 righe, integrale)
- `frontend/src/components/editor-v2/utils/edgeUtils.ts` (1623 righe; letti `:20-40`, `:725-880`, `:1290-1410`)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (righe routing + contesto)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`:401`)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (25 righe, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (255 righe, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (`defaultEdgeViewIR`)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (651 righe; letti `:1-200`, `:340-465`, `:555-651`)
- `frontend/src/components/ui/Select/Select.tsx`
- `frontend/package.json`
- `node_modules/@xyflow/react/dist/esm/index.d.ts`, `node_modules/@xyflow/system/dist/esm/utils/edges/*.d.ts`
- `docs/discovery/discovery_2026-08-02_edge_expressiveness_v2.md` (Area C + rischi)

---

## (a) Il tipo e la compilazione di `edge.routing`

**Confermato, con drift di riga rispetto alla discovery.**

| Cosa | Sito a HEAD | Sito nella discovery 08-02 |
|---|---|---|
| Tipo autorato (`EdgeViewIR['edge']`) | `irTypes.ts:228` | `:206` |
| Tipo compilato (`CompiledEdgeView`) | `irTypes.ts:300` | non citato |
| Compilazione | `irCompile.ts:401` | `:440` |

```typescript
// irTypes.ts:227-228 — autorato
/** Routing hint; the flow substrate renders Manhattan (UnifiedEdge) — hint recorded in data. */
routing?: 'orthogonal' | 'straight' | 'curved';

// irTypes.ts:300 — compilato
routing: 'orthogonal' | 'straight' | 'curved' | null;

// irCompile.ts:401
routing: e.routing ?? null,
```

Il vocabolario e` **esattamente** `'orthogonal' | 'straight' | 'curved'`, in
entrambi i tipi. R-B9 e` applicabile alla lettera. `defaultEdgeViewIR()`
(`irDefaults.ts:79-86`) restituisce `edge: {}` — nessun seed di `routing`,
quindi il default e` genuinamente l'assenza della chiave.

**Nessuna estensione di schema necessaria. `irVersion` resta `'ir-1.2'`.**

## (b) Dead write: confermato. `irValidate` non entra in gioco

Grep globale di `irRoutingHint` su tutto `frontend/src` (esclusi `node_modules`):
**due occorrenze, entrambe nello stesso punto di scrittura.**

```
irEdgeViews.ts:52:  // (D3, Manhattan frozen): irRoutingHint recorded but not consumed.
irEdgeViews.ts:56:  irRoutingHint: cv.routing ?? undefined,
```

`applyEdgeStyle` (`irEdgeViews.ts:35-67`) deposita `irRoutingHint` su `e.data`
insieme agli altri `ir*`. **Zero lettori a valle** — `UnifiedEdge.tsx` legge
`irStroke`, `irStrokeWidth`, `irStrokeDasharray`, `irSourceTermination`,
`irTargetTermination`, `irLabelAlwaysVisible` (`:99-104`) e **mai**
`irRoutingHint`. Dead write confermato, e il carrier fino a `e.data` esiste gia`:
la Fase 1 deve solo leggerlo.

`irValidate.ts` e` un wrapper di 25 righe che delega a `compileEdgeView` dentro
un `try/catch` e non ispeziona alcun campo. **Non accetta ne` rifiuta `routing`
esplicitamente**: qualunque dei tre valori passa perche` nessun cross-check
esiste. Coerente con il rischio 9 della discovery. La regola di uscita 3 non
scatta (nessun rifiuto).

## (c) Costruzione del path e indipendenza dagli handle — LA CONDIZIONE CHIAVE

**Confermata: la scelta dei lati e` a monte e disaccoppiata dal disegno del path.**

```typescript
// UnifiedEdge.tsx:153-154 — i lati arrivano dagli id degli handle, gia` decisi
const sourceSide = getSideFromHandle(sourceHandleId);
const targetSide = getSideFromHandle(targetHandleId);

// UnifiedEdge.tsx:172-176 — il router e` una funzione pura di (x, y, side) x 2
const rawPath = useMemo(
    () => computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide),
    [sourceX, sourceY, sourceSide, targetX, targetY, targetSide]
);
```

Nome reale del router confermato: **`computeManhattanPath`**, in
`utils/edgeUtils.ts`. `getSideFromHandle` (`edgeUtils.ts:25-31`) fa
`handleId.split('-')[0]` e restituisce il tipo `Side = 'top' | 'right' |
'bottom' | 'left'` (`edgeUtils.ts:20`).

Gli handle sono assegnati da due meccanismi entrambi **a monte del renderer**:
`EditorV2.applyDistribution` per gli edge reali, `assignGeometricHandles`
(`irEdgeViews.ts:88-111`) per i sintetici object-as-edge. Nessuno dei due sa
nulla del router, e il router non sa nulla di loro.

⇒ **`straight` e `curved` riusano gli stessi handle cambiando solo la `d`.
La regola di uscita 2 NON scatta. `portDistribution.ts` non viene toccato,
la slice resta fuori dalla critical zone, nessun Layer Impact Report dovuto.**

### Fatto strutturale rilevato in piu`: ogni edge IR e` M1

- Edge decorati: il filtro di `decorateReferenceEdges` e`
  `if (e.type !== 'instanceRef' && e.type !== 'composition') return e;`
  (`irEdgeViews.ts:124`).
- Edge sintetici object-as-edge: `type: 'instanceRef'` (`irEdgeViews.ts:208`).

Quindi per ogni edge IR: `isM1Edge === true` (`UnifiedEdge.tsx:82`) ⇒
`isInheritance === false` (`:84`). Conseguenze che **riducono la superficie della
slice** rispetto a quanto temuto dalla discovery:

- CASE 1 e CASE 2 (tree layout inheritance, `:387`, `:487`) sono **irraggiungibili** da un edge IR;
- la cardinalita` e` **sempre nascosta** (`showCardinality` richiede `!isM1Edge`, `:353`);
- la label ISA e` **irraggiungibile** (richiede `isInheritance`, `:574`).

Tutto il lavoro sta quindi in CASE 3, il ramo standard.

## (d) `SegmentHandles`: sito di mount e gesture di creazione

Mount unico, in CASE 3:

```typescript
// UnifiedEdge.tsx:734-742
{/* Segment handles for manual edge customization */}
{!isSelfLoop && (
    <SegmentHandles
        edgeId={id}
        adjustedPath={adjustedPath}
        waypoints={waypoints}
        selected={!!selected}
    />
)}
```

Condizione attuale: **solo `!isSelfLoop`**. Gating interno al componente:
`SegmentHandles.tsx:35` — `if (!selected || internalSegments.length === 0) return null;`
(serve almeno 3 segmenti, `:30-33`).

**La gesture di creazione dei waypoint vive interamente dentro questo componente**:
`DraggableHandle.handleMouseDown` (`SegmentHandles.tsx:66-145`) e` l'unico
produttore di nuovi waypoint (`:120`, `newWaypoints = [...currentWaypoints,
{ segmentIndex, offset }]`, persistito via `editorCtx.onEdgeDataChange` a `:127-130`).

⇒ **Il punto 3 del COSA e` una sola condizione**: non montare `SegmentHandles`
spegne insieme le maniglie e la creazione. Nessun secondo sito da gatare.
`DVertex.irEdgeLayout` non viene ne` letto ne` scritto (R-B10 rispettata per
costruzione).

## (e) `registerEdgePath`: il registry ASSUME l'ortogonalita`

**Questo e` il punto che decide il ramo del COSA punto 4. L'esito e` il secondo ramo.**

Call site rilevanti:

| Sito | Cosa registra |
|---|---|
| `UnifiedEdge.tsx:217` | `registerEdgePath(id, spreadPoints, source, target, treeGroupId)` — la polilinea di questo edge |
| `useTreeLayout.ts:175`, `:184` | trunk e segmenti dell'albero di ereditarieta` — **mai un edge IR** (vedi (c)) |

Registry: `const edgePathRegistry = new Map<string, EdgePathEntry>()`,
module-level, condiviso da **tutti** i canvas (`edgeUtils.ts:1300`), filtrato
per canvas attivo solo in lettura (`:1366`).

**Il consumatore assume segmenti assiali, in entrambi i ruoli.** In
`getEdgeCrossings` (`edgeUtils.ts:1334`):

```typescript
// :1382-1383 — dei MIEI segmenti considera solo quelli esattamente orizzontali
// Only process horizontal segments of this edge
if (Math.abs(myP2.y - myP1.y) >= 1) continue;

// :1393-1394 — degli ALTRUI solo quelli esattamente verticali
// Only crosses with vertical segments of the other edge
if (Math.abs(oP2.x - oP1.x) >= 1) continue;
```

Un segmento diagonale e` **fuori contratto in entrambi i ruoli**: viene scartato
come "mio" e scartato come "altrui", salvo cadere per caso entro 1px dall'asse —
nel qual caso produrrebbe un incrocio *inventato* contro un altro edge, che
disegnerebbe un archetto su una geometria che non ha davvero attraversato. Su una
bezier campionata questo e` concreto: vicino agli estremi la tangente e`
perpendicolare al lato, quindi alcuni segmenti campionati sono quasi esattamente
verticali.

⇒ **Si applica il secondo ramo del COSA punto 4: per gli edge IR non ortogonali
non si registra nulla, e non si calcolano i loro incroci**, con un commento breve
in `UnifiedEdge.tsx` che dichiara l'esclusione dal crossing detection. Il modulo
del registry non si tocca. La polilinea ortogonale fantasma non viene mai
registrata (R-B12 rispettata), e il rischio 3 della discovery e` neutralizzato
alla radice invece che mitigato.

## (f) Superficie completa dei consumatori della polilinea

Enumerazione esaustiva per un edge IR in CASE 3 (il solo ramo raggiungibile):

| # | Consumatore | Sito | Assume ortogonalita`? | Trattamento in Fase 1 |
|---|---|---|---|---|
| 1 | `parsePathPoints(rawPath)` → `rawPoints` | `:179` | si` | bypassato: il ramo routing sostituisce la `d` |
| 2 | `applyWaypoints` | `:180-183` | si` | bypassato (R-B10) |
| 3 | `adjustedPath` → `SegmentHandles` | `:184`, `:736-741` | si` | non montato (punto 3) |
| 4 | `applyBundleSpread` | `:204-207` | si` | bypassato |
| 5 | `registerEdgePath(id, spreadPoints, …)` | `:217` | **si`, vedi (e)** | non registrato (punto 4) |
| 6 | `getEdgeCrossings(id, spreadPoints, …)` | `:227-231` | **si`, vedi (e)** | saltato ⇒ `crossings = []` |
| 7 | `buildFinalPath` / `roundManhattanPath` | `:264-272` | si` | bypassati |
| 8 | `computeLabelPosition(spreadPath, roleArcShift)` | `:279-285` | si` (`:804` ⇒ `{x:0,y:0}`) | sostituito da `labelX`/`labelY` di RF (punto 2) |
| 9 | `labelPos.isHorizontal` → `labelOffset` | `:288-291` | si` (derivato da 8) | derivato dal delta fra i capi: `\|dx\| > \|dy\|` |
| 10 | `computeCardinalityPosition` / `computeCardinalityAnchor` | `:294-301` | si` (solo self-loop) | **irraggiungibile su IR**: `showCardinality` richiede `!isM1Edge` |
| 11 | `midPoint` = `parsePathPoints(spreadPath)` (label ISA) | `:304-311` | si` | **irraggiungibile su IR**: richiede `isInheritance` |
| 12 | `EndpointHandles` | `:745-756` | **no** — prende `sourceX/Y`, `targetX/Y` | invariato |
| 13 | hit-test path invisibile | `:713-722` | no — usa la stessa `d` visibile | segue automaticamente la nuova `d` |

Nessun consumatore resta scoperto. I soli due che richiedono lavoro attivo oltre
al bypass sono **8** (la label, R-B11) e **9** (l'orientamento della nudge), gia`
previsti dal COSA ai punti 2 e 5.

## (g) React Flow: helper disponibili, e restituiscono la posizione della label

`package.json:27` → `"@xyflow/react": "^12.10.0"`.

`node_modules/@xyflow/react/dist/esm/index.d.ts:40` ri-esporta da
`@xyflow/system`: `getBezierPath`, `getStraightPath`, `getSmoothStepPath`,
`getBezierEdgeCenter`, `getEdgeCenter`.

Firme (da `@xyflow/system/dist/esm/utils/edges/{straight,bezier}-edge.d.ts`):

```typescript
getStraightPath({ sourceX, sourceY, targetX, targetY }):
    [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]

getBezierPath({ sourceX, sourceY, sourcePosition?, targetX, targetY, targetPosition?, curvature? }):
    [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]
```

Due conseguenze operative:

1. **R-B11 si risolve senza matematica a mano.** Entrambi gli helper restituiscono
   `labelX`/`labelY` gia` calcolati (centro del path; per la bezier via
   `getBezierEdgeCenter`). Il fallback previsto dal prompt — valutazione della
   cubica a t=0.5 in formula chiusa — **non serve**. Nessun `getPointAtLength` dal DOM.
2. **Il tipo dei lati combacia.** `getBezierPath` vuole `Position`, string enum
   con valori `"left" | "top" | "right" | "bottom"`
   (`@xyflow/system/dist/esm/types/utils.d.ts:8-13`), **identici** ai valori del
   tipo `Side` del codebase (`edgeUtils.ts:20`). La conversione e` una mappa
   diretta, senza normalizzazioni.

Uso attuale nel progetto: **zero** (le uniche occorrenze storiche stanno in
`edges/ManhattanEdge-toDelete.tsx`, file non registrato in alcun `edgeTypes`).
Nessuna dipendenza nuova: regola 4 rispettata.

## (h) Stato git dei file bersaglio

```
$ git status --porcelain \
    frontend/src/components/editor-v2/edges/UnifiedEdge.tsx \
    frontend/src/components/editor-v2/utils/edgeUtils.ts \
    frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx \
    frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts \
    frontend/src/components/editor-v2/edges/SegmentHandles.tsx
(nessun output)
```

**Tutti puliti.** In particolare `EdgeAuthoringPanel.tsx` — quello segnalato dal
prompt come storicamente a rischio di WIP dell'arco tab IR — e` pulito: il suo
ultimo movimento e` `59dfb096d`, gia` committato. **La regola di uscita 1 non
scatta**: nessun `git add` di questa slice puo` trascinare WIP altrui.

---

## Regole di uscita — valutazione

| # | Regola | Esito |
|---|---|---|
| 1 | File bersaglio sporco con WIP altrui | **NO** — tutti puliti, vedi (h) |
| 2 | Handle accoppiati al routing ⇒ critical zone | **NO** — disaccoppiamento verificato, vedi (c) |
| 3 | `routing` gia` consumato / vocabolario diverso / rifiutato da `irValidate` | **NO** — dead write, vocabolario esatto, nessun check, vedi (a)(b) |
| 4 | Altra assunzione del CONTESTO che non regge | **NO** — vedi sotto |

Verifica puntuale delle assunzioni del CONTESTO:

- "il campo esiste in `EdgeViewIR` ed e` compilato con default `null`" → vero, (a);
- "e` un dead write, nessuno lo consuma" → vero, (b);
- "pannello e renderer sono condivisi fra le due nature" → vero: `EdgeAuthoringPanel`
  non ha gate di natura sulla sezione Linea (`:558-601`), e `applyEdgeStyle`
  (`irEdgeViews.ts:35`) e` chiamata sia dal ramo reference (`:136`) sia dal ramo
  object (`:217`);
- "nessun VersionFixer per le view IR salvate" → coerente: `irVersion` resta
  `'ir-1.2'`, nessuna estensione di schema, il carrier esisteva gia`;
- "gli edge classic e M2 sono fuori dal path IR" → vero: tutto passa dal gate
  `isIREdge = !!irData.irEdgeViewId` (`:98`), e nessun edge M2 e` mai decorato
  (il filtro di `decorateReferenceEdges` ammette solo `instanceRef`/`composition`).

⇒ **Fase 0 verde. Si procede alla Fase 1.**

---

## Decisioni prese in Fase 0 (da confermare o correggere in review)

Tre punti che il prompt non copre esplicitamente e che vengono risolti cosi`,
sempre nella direzione conservativa:

1. **I self-loop restano sulla loro geometria attuale, qualunque sia il routing.**
   Un edge IR con `source === target` prende il ricciolo d'angolo dedicato
   (`computeSelfLoopCornerPath`, `UnifiedEdge.tsx:236-261`, `:265-267`). Una
   retta o una bezier fra un nodo e se stesso degenererebbe in un punto: non
   esiste una resa sensata. Il ramo routing viene quindi gatato anche su
   `!isSelfLoop`, e i self-loop IR restano identici a oggi.

2. **Selezionare esplicitamente "Manhattan" cancella la chiave `routing`** invece
   di scrivere `'orthogonal'`. E` la convenzione gia` in vigore in questo stesso
   pannello — `setHasPredicate` (`:344-348`) e `setHasCenterLabel` (`:369-380`)
   commentano entrambi "Drop the KEY … keeps the ir byte-identical to a view
   authored without …". Conserva l'equivalenza assente ≡ `'orthogonal'` a livello
   di byte dell'IR e rende il ritorno al default indistinguibile dal mai-autorato.

3. **`curvature` resta il default di React Flow (0.25).** Nessun parametro nuovo
   esposto in UI: non e` nel mandato della slice.

## Domande aperte per Alfonso

Nessuna bloccante. Due segnalazioni:

1. **§3.1 vs §3.2 di CLAUDE.md.** La tabella §3.1 ("Files in the critical zone")
   elenca la directory `components/editor-v2/viewpoint/authoring/`, di cui
   `EdgeAuthoringPanel.tsx` fa parte. La lista di trigger §3.2 ("Layer Impact
   Report — mandatory") e` invece un'enumerazione esplicita di file
   (`useJjomSync.ts`, `syncState.ts`, `canvasToJjom.ts`, `portDistribution.ts`,
   `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, write path D-layer) che **non**
   include quella directory. Nessuno dei file di §3.2 viene toccato, e la
   discovery classifica E-route come fuori critical zone (OQ-15). Il Layer Impact
   Report viene quindi marcato `not-required`. Se preferisci la lettura larga di
   §3.1, dillo e lo produco prima del diff.

2. **La coda arco A ha gia` toccato `EdgeAuthoringPanel.tsx`** con `59dfb096d`
   (estrazione di `edgeEndpoints.ts`). Il file e` pulito ora, ma se la coda A
   dovesse rientrarci mentre questa slice e` aperta, il rischio 1 della discovery
   (due slice contemporanee sullo stesso file) si materializza — non su
   `UnifiedEdge.tsx`, che la coda A non tocca, ma sul pannello.

---

## Riferimenti

- `docs/discovery/discovery_2026-08-02_edge_expressiveness_v2.md` — Area C (`:396-459`), rischi (`:463-497`)
- `CLAUDE.md` §3.1, §3.2, §5, regole NON-NEGOTIABLE 1, 4, 15, 17, 18
- `docs/PROTOCOL.md` P4 (report committato nel task che lo produce)

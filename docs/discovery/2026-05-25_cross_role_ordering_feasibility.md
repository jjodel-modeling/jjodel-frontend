# Discovery: Cross-Role Global Ordering — Feasibility

**Data**: 2026-05-25
**Branch**: alfonso-frontend-jjtl
**Commit HEAD**: `0848fa117`
**Modalità**: READ-ONLY (l'unico file scritto è questo + entry in `docs/claude-code-log.md`)
**Versioni libreria**: `@xyflow/react` 12.10.2, `@xyflow/system` 0.0.76

## TL;DR

**Patch (a) è praticabile, effort S/M.** ReactFlow indicizza gli handle per **(id, type)**,
non per id soltanto (`getEdgePosition` cerca `sourceHandle` solo tra gli handle `.source`
e `targetHandle` solo tra i `.target`), e la posizione fisica è indipendente dal matching.
Quindi si può lasciare intatto lo schema handleId-per-ruolo (bucket `:source`/`:target`,
capienza 8 = 4+4 per lato) e cambiare **solo la posizione fisica** ordinando globalmente
tutti gli endpoint del lato. Tocca 3 file editor-v2 (`handlePosition.ts` + 2 chiamanti),
**nessun** cambio a `portDistribution`, **nessuna** migration `VersionFixer` (gli handleId
sono effimeri: ricalcolati a ogni `setEdges`, mai persistiti; gli anchor salvano solo
`side`). Refactor (b) è LARGE, smonta il cluster coordinato `89e67dc65`/`cdcef4456`/
`db7be7a25`/`c8910167a`, richiede bump `MAX_HANDLES_PER_SIDE` 4→8 e rischia Inv3, senza
beneficio compensativo. **Raccomandazione: A — procedere con (a)**, decidendo con Alfonso
l'unica scelta di design aperta (inheritance-al-centro è una *regola esplicita*, non
emergente dall'equidistribuzione).

---

## Obiettivo 1 — ReactFlow handleId semantics

Fonte: `frontend/node_modules/@xyflow/system/dist/esm/index.mjs` (codice libreria, non
documentazione esterna).

### 1.1 Stessi id, type diverso → distinti? **SÌ.**

`toHandleBounds` (`index.mjs:1399-1419`) partiziona gli handle di un nodo in **due array
separati** `source`/`target` in base a `handle.type` (`:1408-1413`):
```js
if (handle.type === 'source') source.push(handle);
else if (handle.type === 'target') target.push(handle);
```
Quindi un nodo può avere `top-0`/source e `top-0`/target come entità **distinte**, ognuna
nel proprio array. È esattamente ciò che fa oggi `DynamicHandles.tsx:283-302`: per ogni
`handleId` renderizza **due** `<Handle>`, uno `type="target"` (`:285-292`) e uno
`type="source"` (`:293-300`), **con lo stesso `id={handleId}`** (`:288`, `:296`).

### 1.2 Il matching `sourceHandle`/`targetHandle` include il type? **SÌ.**

`getEdgePosition` (`index.mjs:1365-1398`):
```js
const sourceHandle = getHandle$1(sourceHandleBounds?.source ?? [], params.sourceHandle); // :1372
const targetHandle = getHandle$1(
    params.connectionMode === ConnectionMode.Strict
        ? targetHandleBounds?.target ?? []                                  // :1376
        : (targetHandleBounds?.target ?? []).concat(targetHandleBounds?.source ?? []),
    params.targetHandle);
```
`getHandle$1` (`:1439-1444`) cerca per `d.id === handleId` **dentro l'array passato**. Per
`sourceHandle` l'array è `bounds.source`; per `targetHandle` (modalità Strict, il default)
è `bounds.target`. Quindi un edge con `sourceHandle:'top-0'` si aggancia all'handle
`{id:'top-0', type:'source'}`, **mai** a `{id:'top-0', type:'target'}`. Il `type` è parte
effettiva della chiave di matching.

### 1.3 Posizioni fisiche diverse, stesso id, type diverso → ammesse? **SÌ.**

La posizione di un handle è calcolata da `getHandlePosition` (`index.mjs:1420-1437`) a
partire da `handle.x/y`, cioè dai bounds DOM **misurati** del singolo `<Handle>`. I due
`<Handle>` con stesso id e type diverso hanno CSS diversi (`sourceConnectedStyle` vs
`targetConnectedStyle`, `DynamicHandles.tsx:263-264`) → misurano x/y diversi → posizioni
fisiche diverse. **È il comportamento attuale verificato** (6.25% source vs 56.25% target).

**Conseguenza per (a)**: cambiare la posizione fisica di un handle (es. spostare
`top-0`/source dal 6.25% al 18% per effetto di un ordinamento globale) **non** rompe il
matching ReactFlow: l'edge resta agganciato a `top-0`/source qualunque sia la sua
posizione. Nessun vincolo strutturale RF osta a (a). **Hard stop non innescato.**

---

## Obiettivo 2 — Isolamento della formula di posizione

Fonte: `frontend/src/components/editor-v2/utils/handlePosition.ts`.

1. **`computeHandlePercent` (`:62-79`)** riceve `{ handleId, role, hasBothRoles, roleRank,
   roleCount }`. Per l'ordinamento globale basterebbe cambiarne la firma in qualcosa come
   `{ globalIndex, globalCount }` (e.g. `(globalIndex+1)/(globalCount+1)`), aggiornando i
   chiamanti perché passino l'indice globale invece del rank per-ruolo. **Sì, è la leva
   giusta.**
2. **La patch (a) NON è realizzabile *solo* in `handlePosition.ts`**: i due chiamanti
   devono calcolare l'indice globale dell'endpoint. Ma il calcolo dell'indice globale può
   essere **centralizzato** in `handlePosition.ts` (una funzione che prende l'insieme
   edge del lato + `(handleId, role)` e ritorna la posizione), così entrambi i chiamanti
   la invocano. I chiamanti hanno già i dati:
   - `DynamicHandles.tsx:191-202` deriva `sourceHandlesOnSide`/`targetHandlesOnSide` per
     lato (da `activeHandles`+`handleRoles`).
   - `useTreeLayout.ts:123` usa `computeSideRoleHandles(allEdges, edge.source, childSide)`
     (`handlePosition.ts:36-58`) che ritorna gli stessi due array.
3. **File da toccare oltre `handlePosition.ts`**: `DynamicHandles.tsx` (le due chiamate a
   `computeHandlePercent`, `:232-239`) e `useTreeLayout.ts` (via
   `computeHandlePositionForNode`, `:124-134`). **`portDistribution.ts` NON va toccato**
   (assegna gli id; la posizione è indipendente — vedi Ob.1).

**Vincolo di correttezza (da rispettare nel fix)**: l'ordinamento globale deve essere
**identico** nei due chiamanti, altrimenti il ramo del tree connector atterra in un punto
diverso da dove `DynamicHandles` disegna l'handle. Oggi la coerenza è garantita dalla
formula condivisa; per l'ordinamento globale va centralizzata anche la **regola di
ordinamento** (non solo la formula).

---

## Obiettivo 3 — Strategia (a) Patch

### 3.1 File toccati

- `frontend/src/components/editor-v2/utils/handlePosition.ts` — nuova funzione di
  ordinamento globale + formula `(i+1)/(N+1)`; adattare `computeHandlePositionForNode`.
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` — sostituire le due
  chiamate `computeHandlePercent` (`:232-239`) con la versione global-index.
- `frontend/src/components/editor-v2/hooks/useTreeLayout.ts` — `computeHandlePositionForNode`
  (`:124-134`) usa l'indice globale dell'endpoint inheritance lato figlio.

3 file, tutti in `editor-v2`. Nessun cambio a `portDistribution.ts`, `jjomTransformers.ts`,
`useJjomSync.ts`, `VersionFixer.tsx`.

### 3.2 Regola di ordinamento globale + inheritance-al-centro

L'ordinamento deve essere **deterministico e stabile** (stesso endpoint → stesso indice
tra render). Gli handleId codificano già lo **spatial sort** anti-crossing di
`portDistribution` STEP 2 (`:142-157`, ordina i gruppi per posizione del nodo vicino prima
di assegnare l'indice). Quindi conviene usare l'indice handle come chiave primaria
dell'ordinamento, per non disfare la minimizzazione dei crossing.

**Punto critico onesto**: l'**equidistribuzione pura `(i+1)/(N+1)` NON produce
inheritance-al-centro come proprietà emergente**. L'inheritance cade al 50% solo se il suo
indice globale è quello mediano. Per garantire il centro servono due varianti:

- **(a1) Equidistante puro**: ordina tutti gli endpoint (regola fissa, es. per indice
  handle, source prima di target a parità) e distribuisci `(i+1)/(N+1)`. L'inheritance
  cade dove capita. S1 → 33%/67%. Semplice; **inheritance NON centrata**.
- **(a2) Inheritance-pinned-center**: l'endpoint inheritance è fissato a 0.5 e i
  reference sono distribuiti simmetricamente nello spazio rimanente. S1 → inh 50%,
  ref 25%/75%. Richiede a `DynamicHandles` di sapere **quale handle è inheritance** (oggi
  `handleRoles` traccia solo source/target, **non** il tipo edge): piccola aggiunta che
  deriva il tipo da `edges` filtrando `type==='inheritance'`. `useTreeLayout` già sa di
  essere inheritance.

Alfonso ha citato **entrambi** gli output per S1 ("33%/67%" e "50% + 25%/75%") → la scelta
a1/a2 è una **decisione di design da confermare**, non un dato tecnico. Entrambe sono
realizzabili in (a) con effort simile.

### 3.3 Compatibilità con N→1 stesso target

**Compatibile.** Il fan-in inheritance collassa gli N edge in **un solo** `PortGroup`
target sul parent (`portDistribution.ts:115-130`) → **un solo** endpoint
inheritance-target su `bottom` del parent (tipicamente `bottom-0`). L'ordinamento globale
sul lato `bottom` del parent conta quell'unico endpoint (+ eventuali reference): se è solo
l'inheritance, 1 endpoint → 50% → trunk centrato. Gli N endpoint inheritance-**source**
stanno sui lati `top` dei **nodi figli** (nodi distinti), ordinati indipendentemente, e
`useTreeLayout` legge la posizione di ciascuno via `computeHandlePositionForNode`. Lo
sharing dell'anchor sul parent resta intatto perché `portDistribution` non viene toccato.

### 3.4 Stima effort

**S/M.** Logica contenuta in 3 file editor-v2, nessun ripple su persistence/sync/RF. Il
grosso del lavoro è la decisione a1/a2 e garantire l'identità dell'ordinamento tra i due
chiamanti (Ob.2 vincolo).

---

## Obiettivo 4 — Strategia (b) Refactor

### 4.1 File toccati

- `frontend/src/components/editor-v2/utils/portDistribution.ts` — riscrivere STEP 1
  bucketing (bucket **unico** per `(nodeId, side)`, **rimuovendo** il suffisso
  `:source`/`:target` introdotto da `89e67dc65`, `:78`/`:111`), STEP 3 assegnazione indice
  globale (`:162-178`), `getNextFreeHandleIndex` per-lato anziché per-ruolo (`:267-294`).
- `MAX_HANDLES_PER_SIDE` (`portDistribution.ts:258`) — **bump 4→8** (vedi 4.2).
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` — posizione per indice
  globale; gestione pool/ghost (vedi 4.2).
- `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` — consuma `MAX_HANDLES_PER_SIDE`
  per lo spread label (`:270`, `:291`): il bump cambia l'offset, va rivisto.
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` — `computeOptimalHandles`
  (`:353-372`) ritorna id `top-0`/`bottom-0`: restano validi come id ma cambia la semantica
  (id ora globalmente unico per lato). Minore.

**`useJjomSync.ts` Step 3 NON va toccato** (ipotesi del prompt **smentita**): `DVoidEdge.new2`
crea edge **senza** handleId (`:631-635`, `:661-665`); l'allocazione avviene a runtime in
`applyDistribution`.

→ **4-5 file di logica core con forti interdipendenze** (il cluster role-aware coordinato).

### 4.2 Punti rotti / da rivedere

- **Capienza per lato**: oggi 4 source + 4 target = **8** endpoint (bucket separati, ognuno
  0..3). Con spazio id **unico** e `MAX=4` → solo **4** endpoint per lato → `Member.left`
  4+4 **va in overflow**. Serve bump `MAX_HANDLES_PER_SIDE` a **8**, con ripple su pool
  rendering, `getNextFreeHandleIndex`, label spread (`UnifiedEdge.tsx:270,291`).
- **Pool/ghost type-ambiguity**: oggi il pool renderizza source+target per ogni id così che
  una nuova connessione (ghost) possa attaccarsi in qualunque ruolo (`DynamicHandles.tsx:
  283-302`). Con spazio id unico, un id attivo ha un solo ruolo, ma il pool per le **nuove**
  connessioni deve comunque offrire entrambi i ruoli → il doppio `<Handle>` non sparisce del
  tutto; (b) sposta solo l'**assegnazione** dell'indice, non elimina il doppio rendering.
- **Reverte un cluster coordinato**: `89e67dc65` (bucket per ruolo), `cdcef4456`,
  `db7be7a25`, `c8910167a` sono stati scritti insieme proprio per permettere a `top-0` di
  essere source per un edge e target per un altro. Smontarlo rischia di regredire i casi che
  quei 4 commit hanno chiuso.

### 4.3 VersionFixer bump richiesto? **NO** (per entrambe le strategie)

Gli handleId **non sono persistiti**:
- `applyDistribution` (`EditorV2.tsx:785-805`) li ricalcola a ogni `setEdges` da edge+
  posizioni nodi.
- `canvasToJjom.ts` non scrive alcun campo handle (grep `sourceHandle`/`targetHandle`
  vuoto).
- `useJjomSync` Step 3 crea edge senza handle.
- Gli **anchor** persistiti in `.data` hanno tipo `AnchorConfig = { mode, side }`
  (`types.ts:107-112`): **nessun handleId/index**, solo il lato. Cambiare lo schema
  handleId non li tocca.

Quindi né (a) né (b) richiedono migration `VersionFixer` (ultima migration corrente
2.216→2.217). Questo **neutralizza** il costo jsxString-bump tipico — non è un fattore
discriminante tra le due strategie.

### 4.4 Stima effort

**L.** Riscrittura di `portDistribution` (cuore del sistema), bump `MAX` con ripple multipli,
gestione pool/ghost, e reversione di un cluster a 4 commit. Alto rischio di regressione su
Inv1/Inv3 durante il refactor.

---

## Obiettivo 5 — Invarianti

|       | Strategia (a) Patch | Strategia (b) Refactor |
|-------|---------------------|------------------------|
| **Inv1** (S4 Member.left 4+4 = 8 endpoint, no collisione) | ✅ — id role-tagged restano (4+4), capienza 8 invariata; ordinamento globale → 8 posizioni distinte (~11%..89%); RF matcha per (id,type) | ✅ **solo se** `MAX` bumpato a 8; con `MAX=4` ❌ overflow (4 slot per spazio unico) |
| **Inv2** (S1 Full Professor bilanciato, no 6.25/56.25) | ✅ — equidistribuzione globale (a1: 33/67; a2: 50 + 25/75) | ✅ — stesso esito via indice globale |
| **Inv3** (N→1 inheritance stesso target, anchor singolo condiviso) | ✅ — `portDistribution` non toccato, fan-in `:115-130` intatto → bottom-0 singolo, trunk centrato | ⚠️ condizionato — il collasso fan-in va **riprodotto** nel `portDistribution` riscritto; rischio di romperlo durante il refactor del bucketing |

---

## Raccomandazione

**A. Patch (a) è praticabile, effort S/M. Procedere con prompt di fix.**

Motivazione:
- **Nessun vincolo ReactFlow** osta (Ob.1: matching per (id,type), posizione indipendente).
- **3 file editor-v2**, nessun cambio a `portDistribution`/sync/persistence; **nessuna
  migration** (handleId effimeri, anchor con solo `side`).
- **Preserva** il cluster coordinato `c8910167a` & co. e la capienza 8 per lato.
- (b) non offre vantaggi compensativi: stesso esito visivo, ma effort L, reversione di 4
  commit coordinati, bump `MAX` con ripple, e rischio su Inv3 — il tutto **senza** il
  risparmio di una migration (che non serve nemmeno ad (a)).

**Unica decisione di design da chiudere con Alfonso prima del fix**: a1 (equidistante puro,
inheritance dove capita, S1→33/67) vs **a2** (inheritance pinned a 50%, reference
simmetriche, S1→50+25/75). a2 è più vicino alla regola enunciata ("inheritance
preferenzialmente al centro") ma richiede a `DynamicHandles` di tracciare il tipo edge
(inheritance) oltre al ruolo — piccola aggiunta. **Inheritance-al-centro è una regola
esplicita, non una proprietà emergente dell'equidistribuzione.**

Secondaria (non bloccante): la regola di interleaving source/target nello stream globale
(concatenazione vs alternanza per indice) influenza i crossing; va scelta preservando lo
spatial sort già codificato negli indici (`portDistribution` STEP 2).

---

## File chiave per fix successivo (strategia a)

- `frontend/src/components/editor-v2/utils/handlePosition.ts` — formula + (nuova) regola di
  ordinamento globale; `computeHandlePercent` (`:62-79`), `computeHandlePositionForNode`
  (`:88-117`), `computeSideRoleHandles` (`:36-58`).
- `frontend/src/components/editor-v2/components/DynamicHandles.tsx` — chiamate posizione
  (`:230-239`), derivazione per-lato (`:191-202`); per a2, aggiungere tracciamento tipo
  inheritance.
- `frontend/src/components/editor-v2/hooks/useTreeLayout.ts` — landing ramo figlio
  (`:121-136`).
- `frontend/src/components/editor-v2/utils/portDistribution.ts` — **solo lettura** in (a):
  capire lo spatial sort (`:142-157`) e il fan-in inheritance (`:115-130`) da preservare.
- `frontend/node_modules/@xyflow/system/dist/esm/index.mjs` — riferimento semantica handle
  (`getEdgePosition:1365`, `toHandleBounds:1399`, `getHandle$1:1439`).

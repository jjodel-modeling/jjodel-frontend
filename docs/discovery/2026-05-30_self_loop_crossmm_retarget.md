# Discovery — self-loop stale dopo retarget cross-MM di una DReference (READ-ONLY)

**Tipo:** Fase 1 — discovery read-only (critical-zone: `useJjomSync.ts`)
**Branch:** `alfonso-frontend-jjtl`
**Data:** 2026-05-30 20:30
**Punto di partenza:** `docs/discovery/2026-05-30_ghost_target_edge_origin_discovery.md`
**Stato:** report pronto per review. Nessun file sorgente modificato, nessun commit.

> ⚠️ **STOP ANTICIPATO ATTIVATO (condizione #1).** La rappresentazione cross-MM
> **NON usa un DVoidEdge**: è l'overlay in-node `ghostTargets` (chip tratteggiata +
> arco), calcolato a transform-time da `lClass.references`. Quindi la dicotomia del
> punto 2 si risolve in **"cancella il self-loop stale"**, NON "retarget `end` verso
> un vertice proxy" (che non esiste). Vedi §2 e la chiusura. La forma del fix va
> decisa in chat prima di toccare `useJjomSync.ts`.

> 🔎 **NB working tree.** I file `jjomTransformers.ts`, `ClassNode.tsx`, `types.ts`,
> `EditorV2.tsx`, `EditorV2.scss` risultano **modificati e non committati** (feature
> "Add reference" + ghost-target stub, sessioni precedenti). I findings qui sotto
> descrivono lo stato del **working tree corrente**, non di `HEAD`.

---

## 1. Nascita del proxy esterno sul retarget cross-MM

**Risposta sintetica.** Non nasce alcun DVertex proxy né nodo RF speciale. Il
"blocco tratteggiato `Author / metamodel_1`" è un **overlay in-node** (`ghostTargets`),
calcolato a transform-time e renderizzato **dentro** il `ClassNode` sorgente — stesso
pattern di `ghostParents` (extends cross-MM). Nessun edge, nessun nodo, nessuna
scrittura nel D-layer.

**Calcolo (transform-time)** — `frontend/src/components/editor-v2/utils/jjomTransformers.ts:123-142`:
```typescript
// Cross-metamodel reference targets ... Rendered as an in-node "ghost target"
// stub by ClassNode — no real edge (the leftover self-loop edge is suppressed
// in jjomEdgeToRFEdge).
const ghostTargets: GhostTargetInfo[] = [];
try {
    for (const ref of (lClass?.references ?? [])) {
        const t = ref?.type;
        if (t?.model && t.model.id !== lClass.model.id) {     // ← discriminatore cross-MM
            ghostTargets.push({
                refName: ref.name ?? '',
                targetName: t.name,
                targetMetamodel: t.model.name,
                cardinality: `${lower}..${upper === -1 ? '*' : upper}`,
                targetFullname: t.fullname,
            });
        }
    }
} catch { /* proxy access can throw if data is stale */ }
```
Iniettato in `data.ghostTargets` (`jjomTransformers.ts:166`).

**Rendering** — `frontend/src/components/editor-v2/nodes/ClassNode.tsx:34` (`const ghostTargets = data.ghostTargets ?? [];`),
overlay a `:290-...` (chip tratteggiata + arco associazione sul lato destro, fratello di `.ghost-parent-stub`).
Tipo: `GhostTargetInfo` (`frontend/src/components/editor-v2/types.ts:71-78`), campo opzionale
`ghostTargets?` su `ClassNodeData` (`types.ts:90`).

**Marcatura del tratteggiato:** puro styling CSS (`.ghost-target-stub` ecc.,
`EditorV2.scss:~1397-1450`, `border: 1px dashed var(--color-canvas-accent)`), **non**
un campo su DVertex né un flag `isProxy`/`isExternal` sul D-layer. La "proxy-ness" non
esiste come dato: è solo un overlay derivato da `ref.type` cross-MM.

→ **Conferma stop #1:** non c'è alcun vertice/edge proxy nel modello.

---

## 2. Stato degli edge dopo il retarget (domanda che decide la forma del fix)

**Risposta sintetica.** Dopo il retarget cross-MM esiste **UN SOLO** `DVoidEdge` per
quel `refId`: il **self-loop stale** (`start === end ===` vertice di A, `model === refId`).
La rappresentazione cross-MM **non è un secondo DVoidEdge** — è l'overlay `ghostTargets`
(punto 1). Quindi il fix è **"cancella il self-loop stale"**, NON "retarget `end` verso
il vertice proxy".

**Evidenza — perché non nasce un secondo edge.** Nel branch References (Step 3),
`useJjomSync.ts:733-737`:
```typescript
const targetId = typeof refObj.type === 'string' ? refObj.type : null; // ora = id classe cross
if (!targetId) continue;
const srcVertex = vertexIdByModelId.get(entry.id);
const tgtVertex = vertexIdByModelId.get(targetId);   // ← cross-MM off-canvas → undefined
if (!srcVertex || !tgtVertex) continue;              // :737  ← ESCE QUI, niente create/reconcile
```
Per un target cross-MM, `vertexIdByModelId.get(targetId)` è `undefined` → `tgtVertex`
undefined → `continue`. Non si arriva né al ramo `create` (`:743`, niente secondo edge)
né al ramo `reconcile` (`:759`, lo stale non viene toccato).

**Evidenza — il self-loop stale ha `end` → vertice A e `model` → refId.** È il
`DVoidEdge` creato quando la reference era self/on-canvas, raccolto nel pool reconcile
(`useJjomSync.ts:483-497`, via `isM2ReferenceEdge`): `endVertexId = se.end` (vertice A),
`endClassId = idlookup[se.end].model` (classe A), chiave `se.model` (= refId). Conferma
struttura: `DVoidEdge` con `model → DReference.id`, `start/end → DVertex.id`, `end`
cachato (`refEdgeReconcile.ts:6-21`).

**Rendering del self-loop stale.** `jjomEdgeToRFEdge` (`jjomTransformers.ts`, branch
`edge.isReference`) deriva `source/target` da `edge.start`/`edge.end` (entrambi = vertice
A) → `source === target` → self-loop ("riccio"). **MA** lo stesso branch ha già la
**soppressione cross-MM** (vedi §3): se `refModel.type.model.id !== sourceModel.model.id`
→ `return null`. Quindi su **full-rebuild/reload** il self-loop stale **non viene
renderizzato**; resta visibile solo **live** finché non c'è un rebuild (gap di reattività,
§3).

→ **Conclusione punto 2:** un solo DVoidEdge (self-loop stale). La forma del fix è la
**cancellazione** del DVoidEdge stale (o, equivalentemente, far sì che la sua esistenza
nel D-layer non sopravviva al retarget). **Non** esiste un vertice proxy verso cui fare
retarget di `end`. → **conferma stop #1.**

---

## 3. Perché il reconcile β' non aggancia il self-loop stale nel caso cross-MM

**Risposta sintetica.** Il reconcile β' (estratto in `refEdgeReconcile.ts`,
`classifyRefEdgeReconcile`) **non viene mai chiamato** per il retarget cross-MM: il
loop esce **prima**, all'early-`continue` di `useJjomSync.ts:737` (`tgtVertex` undefined).
Il selettore `modelRefTypeSig` **fa ri-scattare** l'effect (il `type` è cambiato), ma
dentro il loop il refId cross-MM viene saltato → lo stale non è né riconciliato né
cancellato.

**Punto per punto:**

**(a) `modelRefTypeSig` fira sul retarget cross-MM? → SÌ.**
`useJjomSync.ts:358-387` hasha tutte le coppie `(refId, type)` leggendo `ref.type` come
stringa (`:376-381`). Il retarget cambia `type` da A (self) alla classe cross → l'hash
cambia → l'effect si rilancia (`modelRefTypeSig` è in deps, `:879`). **Quindi l'effect
gira; il problema non è il mancato trigger.**

**(b) Il check di coerenza fallisce perché il target non ha vertice on-canvas? → SÌ, ma
ancora prima: `classifyRefEdgeReconcile` non viene mai invocato.**
La keep-selection `existing.find(e => e.endClassId === targetClassId) ?? existing[0]`
(`refEdgeReconcile.ts:180`) e la decisione reconcile/delete (`:182-190`) sono raggiunte
solo **dopo** la guardia `:737`. Per il cross-MM si esce a `:737` → `classifyRefEdgeReconcile`
**(`useJjomSync.ts:740`) non è mai chiamato** → nessuna `deleteEdgeIds`, nessun retarget.

**Punto esatto dove esce senza toccare lo stale:** `useJjomSync.ts:737`
```typescript
if (!srcVertex || !tgtVertex) continue;   // ← cross-MM: tgtVertex undefined → continue
```
Conseguenza: il `DVoidEdge` stale resta nel D-layer con `end` = vertice A. La
soppressione a valle è **solo di rendering**, in `jjomEdgeToRFEdge` (branch `edge.isReference`):
```typescript
const refTypeModelId = refModel?.type?.model?.id;   // metamodello del type CORRENTE (cross)
const srcModelId = sourceModel?.model?.id;
if (refTypeModelId && srcModelId && refTypeModelId !== srcModelId) {
    return null;                                     // non disegna il self-loop stale
}
```
(`jjomTransformers.ts`, ~:490-496). Questa soppressione **esiste già** (fuori critical-zone)
e nasconde il self-loop **su full-rebuild**; ma il dato resta nel D-layer e, **live**, il
riccio già a schermo non si rimuove (il patch path non ri-elabora l'edge il cui snapshot
non è cambiato, e non rimuove su `null` — vedi ghost-target discovery G3, `:1140-1201`).

→ **Quindi il bug "due rappresentazioni" è lo stato LIVE / dead-data:** ghostTargets
(nuovo) + self-loop stale (vecchio, sopravvive finché non c'è reload). Il fix-at-valle
vuole eliminare il **dato** stale nel D-layer (cancellazione del DVoidEdge), che chiude sia
il dead-data sia la reattività live.

---

## 4. Discriminatore cross-MM a runtime

**Risposta sintetica.** Pattern affidabile già nel codebase: confrontare
`target.model.id !== source.model.id` via L-proxy (`.model` = `get_model`, il metamodello
owner). Indipendente dal toggle `allowCrossReference`.

**Precedenti in uso:**
- `jjomTransformers.ts:130` (ghostTargets): `t.model && t.model.id !== lClass.model.id`.
- `jjomTransformers.ts:112` (ghostParents): `p.model.id !== lClass.model.id`.
- `jjomEdgeToRFEdge` (soppressione): `refModel.type.model.id !== sourceModel.model.id`.

`.model` su un classifier risolve il metamodello owner (`get_model`, `LModelElement.tsx`
~:6013 secondo la ghost-parent discovery; risale la catena father→package→model). È più
robusto del getter `hasCrossReference`/`crossReferences` (`LModelElement.tsx:1253-1259`),
che dipende dal flag `allowCrossReference`.

**Nota per il reconcile (raw-level).** Step 3 lavora su snapshot raw (`entry.id` = classe
sorgente raw, `targetId` = classe target raw). Per discriminare cross-MM lì servirebbe
risolvere i model owner — o via L-proxy
(`LPointerTargetable.fromPointer(targetId)?.model?.id !== LPointerTargetable.fromPointer(entry.id)?.model?.id`),
o, più a buon mercato, sfruttare il segnale **già disponibile**: `targetId` esiste in
`idlookup` (è una classe valida) **ma** `vertexIdByModelId.get(targetId)` è `undefined`
(nessun vertice in QUESTO grafo). Attenzione: "nessun vertice nel grafo" ≠ "cross-MM" in
senso stretto (potrebbe essere una classe same-MM non ancora on-canvas); per il caso del
bug le due cose coincidono, ma una condizione *corretta* dovrebbe usare il confronto
`model.id` esplicito, non solo `!tgtVertex`.

---

## 5. Origine del self-target iniziale in `addReference`

**Risposta sintetica.** La voce "Add reference" del menu nodo v2-flow chiama
`addReference(uniqueName)` **senza type**; `DReference.new` riceve `type === undefined`;
il getter `get_type` ripiega su `father` (la classe contenitore) → self. Da qui il
self-loop iniziale.

**Catena verificata:**
- `EditorV2.tsx:2316` — `const lRef: any = lClass.addReference(uniqueName);` (un solo
  argomento: nessun type).
- `LModelElement.tsx:3107-3108` — `get_addReference` →
  `DReference.new(name, type /* undefined */, context.data.id, true)`.
- `LModelElement.tsx:1372-1404` — `get_type`: se `c.data.type` è assente/non risolvibile,
  fallback `:1404`
  ```typescript
  return LPointerTargetable.fromPointer(c.data.className === 'DReference' ? c.data.father : 'Pointer_ESTRING');
  ```
  → per una `DReference` typeless ritorna **`father`** (la classe contenitore) = self.

**Caveat di onestà (§5.1).** In questa sessione **non ho ri-tracciato end-to-end** il
momento esatto in cui il `DVoidEdge` self-loop viene materializzato (cioè quando il
**raw** `refObj.type` — letto da Step 3 a `:733` come stringa — diventa l'id di A). Il
`get_type` fallback restituisce A a livello L-proxy, ma il write-back raw
(`set_type` a `:1399`) scatta solo nel ramo "rawType è una stringa risolvibile", non per
`undefined`. La creazione del DVoidEdge a `useJjomSync.ts:751` è stabilita dalla
**ghost-target discovery G1** (stesso working tree, stessa sessione-famiglia) e dal
sintomo osservato; la riporto come finding **ereditato, non ri-verificato qui**. Se la
fase 2 dovesse intervenire a monte (default target), questo punto va riprodotto a runtime
prima (capture del raw `type` subito dopo `addReference`).

**Implicazione decisionale.** Intervenire a monte (dare a `addReference` un default
"nessun edge" / type esplicito non-self) eviterebbe il self-loop iniziale, ma è un cambio
di UX su una feature non committata; ortogonale al reconcile. Decisione separata.

---

## 6. Layer Impact preliminare

**Premessa (per lo stop #1).** Data la §2 (un solo DVoidEdge stale, cross-MM = overlay),
il fix candidato è **cancellare il `DVoidEdge` self-loop stale** quando il `type` passa a
cross-MM. Questo vive **dentro `useJjomSync.ts`** (critical-zone) → Layer Impact Report
obbligatorio in fase 2.

**Punti di scrittura candidati (`useJjomSync.ts`, Step 3 References):**
- `:733-737` — la guardia early-`continue`. Il fix deve intercettare il caso
  "`targetId` valido ma `tgtVertex` assente **e** target cross-MM" **prima** del `continue`,
  e, se esistono edge stale per quel `refId` (`existingRefEdgesByRefId.get(refId)`),
  cancellarli (`DeleteElementAction.new(rawEdge)`).
- `:739-740` — riuso di `existingRefEdgesByRefId` e/o estensione di
  `classifyRefEdgeReconcile` (`refEdgeReconcile.ts`) con un esito nuovo tipo
  `'delete-all'` / `targetOffCanvas`, così la logica pura resta unit-testata
  (`refEdgeReconcile.test.ts`) e il diff in critical-zone è minimale.
- Eventuale discriminatore cross-MM (§4) da calcolare qui (L-proxy `model.id`).

**Util collegata (fuori critical-zone):** `refEdgeReconcile.ts` —
`classifyRefEdgeReconcile`/`ReconcileDecision` (pure, testabili). Estendere qui è
preferibile a logica inline in `useJjomSync`.

**Invarianti del sync layer da NON violare (§3 CLAUDE.md):**
1. **TRANSACTION solo attorno a write non-creator.** La cancellazione è
   `DeleteElementAction.new` (+ eventuali `SetFieldAction` reciproci `edgesIn`) — può
   stare in un `TRANSACTION` come il reconcile esistente (`:789-807`), che è sicuro
   perché **non contiene `.new()` creator** (§3.3). **Mai** wrappare `DVoidEdge.new2`/
   `DVertex.new` in TRANSACTION (coordinate-loss).
2. **Reciproci `edgesIn`/`edgesOut` non auto-mantenuti.** Se si cancella il DVoidEdge,
   `DeleteElementAction` fa cascade via `pointedBy` (include edgesIn/edgesOut,
   `refEdgeReconcile.ts:42-43` cita `classes.ts:1017-1018`/`1827-1830`). Verificare che
   la cancellazione pulisca i reciproci come fa oggi `syncDeleteEdge`
   (`canvasToJjom.ts:333-341`) — non lasciare puntatori orfani.
3. **Idempotenza / early-exit.** Dopo la cancellazione, una seconda esecuzione
   dell'effect non deve ridispatchare (lo stale non sarà più nel pool). Mantenere il
   pattern `existingEdgeKeys`/`existingRefEdgesByRefId` coerente; non introdurre un
   `decision.action` che ri-cancella all'infinito.
4. **Keying dedup per `refId`.** Il pool è già per-`refId` (`:488-496`); preservarlo —
   non collassare reference sorelle tra la stessa coppia (chiave composita
   `${refId}:${start}→${end}`, `:465`).
5. **Deps dell'effect.** `modelRefTypeSig` è già in deps (`:879`) e fira sul retarget →
   **non aggiungere** counter M1/`DValue` (§3.5). Il fix sfrutta il trigger esistente.
6. **Step 4 / M1 intoccati.** Il filtro `isM2ReferenceEdge` (`refEdgeReconcile.ts:135-150`)
   tiene il pool sulle sole M2; il fix non deve toccare gli edge M1 (Step 4 /
   `useM1ReferenceEdges`).

**Side-effect cross-layer da considerare:**
- Cancellare il DVoidEdge stale chiude anche la **reattività live** (oggi il riccio
  sparisce solo a reload): la rimozione del dato D-layer si propaga al rendering al
  prossimo transform/patch. Da confermare a runtime (la rimozione live di un edge via
  patch path è il punto aperto G3 della ghost-target discovery).
- La soppressione a valle in `jjomEdgeToRFEdge` (rendering) **resta utile** come rete di
  sicurezza per i frame intermedi e per progetti già salvati con lo stale; il fix D-layer
  e quello di rendering sono complementari, non alternativi.

---

## Stop anticipato — esito

- **Condizione #1 (cross-MM senza DVoidEdge): ATTIVATA.** Il target cross-MM è l'overlay
  `ghostTargets`, non un edge. → il fix è **cancellazione del self-loop stale**, non
  retarget verso un proxy. Forma del fix da confermare in chat.
- **Condizione #2 (stale già cancellato dal reconcile β'): NON attivata.** Lo stale
  **sopravvive** (early-`continue` `:737`); il reconcile non lo tocca. Il ghost non nasce
  da un secondo creatore non riconciliato — è proprio il DVoidEdge self-loop originario.
- **Condizione #3 (servirebbe modificare per rispondere): NON attivata.** Tutto risposto
  in sola lettura. Unico finding ereditato-non-riverificato: il momento esatto di
  materializzazione del DVoidEdge self-loop iniziale (§5, caveat §5.1).

---

## Riferimenti rapidi (file:riga)

- `jjomTransformers.ts:123-142` — calcolo `ghostTargets` (cross-MM, no edge)
- `jjomTransformers.ts:166` — iniezione `data.ghostTargets`
- `jjomTransformers.ts:~490-496` — soppressione cross-MM in `jjomEdgeToRFEdge` (`return null`)
- `types.ts:71-78,90` — `GhostTargetInfo`, campo `ghostTargets?`
- `ClassNode.tsx:34,290` — rendering overlay ghost-target
- `useJjomSync.ts:358-387` — `modelRefTypeSig` (fira sul retarget)
- `useJjomSync.ts:483-497` — pool reconcile per-refId (`isM2ReferenceEdge`)
- `useJjomSync.ts:733-737` — early-`continue`: cross-MM esce qui ⇐ punto chiave
- `useJjomSync.ts:740` — `classifyRefEdgeReconcile` (non raggiunto nel cross-MM)
- `useJjomSync.ts:759-808` — ramo reconcile (retarget + delete, in TRANSACTION)
- `useJjomSync.ts:879` — deps effect (include `modelRefTypeSig`)
- `refEdgeReconcile.ts:135-191` — `isM2ReferenceEdge` + `classifyRefEdgeReconcile`
- `EditorV2.tsx:2316` — `addReference(uniqueName)` (no type → self)
- `LModelElement.tsx:3107-3108` — `get_addReference` → `DReference.new(name, undefined, ...)`
- `LModelElement.tsx:1372-1404` — `get_type` fallback su `father` (self)

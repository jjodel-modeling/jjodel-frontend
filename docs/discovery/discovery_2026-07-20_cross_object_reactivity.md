# Discovery: reattività cross-oggetto del viewpoint IR (dependency set multi-hop)

Data: 2026-07-20. Sessione read-only su `/home/claude/jjodel-frontend`, branch `alfonso-frontend-jjtl` @ `56d7b20`. Nessun file sorgente modificato, nessun commit.

## Obiettivo

Chiudere il limite dichiarato in spec v1.2 sez. 9 (`docs/specs/spec_2026-07-18_ir_schema_v1_2.md:163-170`): i PathExpr multi-hop leggono eager l'oggetto navigato ma non invalidano il render dell'osservatore quando una feature del target cambia. Serve: (1) anatomia esatta della perdita di invalidazione, (2) come estrarre un dependency set multi-hop dal compile, (3) confronto dei meccanismi di invalidazione con costi, (4) perimetro file, (5) strategia test, (6) casi limite. Vincolo perf: la soluzione non deve reintrodurre lavoro per-store-change pesante (il conteggio commit React è appena stato ottimizzato, vedi `docs/discovery/discovery_2026-07-20_edge_settle_trickle.md`).

## File letti

- `/home/claude/jjodel-frontend/CLAUDE.md` (regole non negoziabili; §3.1 critical zone :108-121; §3.5 Step 4 deps :209-223; §5 discovery :374-416)
- `/home/claude/jjodel-frontend/docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (sez. 3 :41, sez. 4-5 :43-88, sez. 7 :115-144, sez. 9 :163-170, sez. 10 :172-180)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` e `irReadCtxLproxy.ts` (integrali)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRContainment.ts` (integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` e `irResolveCore.ts` (integrali)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irCollapseState.ts`, `irEdgeInteraction.ts` (pattern version-hook)
- `frontend/src/components/editor-v2/EditorV2.tsx` (:1195-1335, stabilizzatori e wiring IR)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (:30-70, :375-400)
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (:1380-1470, patch incrementale node data)
- `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (:243-300, objectVertexToRFNode)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (fixture idlookup)
- `docs/discovery/discovery_2026-07-20_edge_settle_trickle.md` (integrale)
- `/home/claude/e2e/wiring_e2e.mjs` (bootstrap harness)

## Findings

### F1. Dove si perde l'informazione dei hop: nel valore di ritorno di compilePath

`parsePathExpr` (`irCompile.ts:40-67`) conserva la struttura completa dei hop: `steps: { feature?, take }[]` distingue hop intermedi e passo terminale. Ma `compilePath` (`irCompile.ts:75-96`) ritorna solo `{ fn, featureNames }` con `featureNames` PIATTO: `dependencySet` di una view con path `$assignee.value.$name.value` è `['assignee','name']`, indistinguibile da due feature di self. La struttura (quale feature è hop, quale terminale, su quale oggetto) esiste solo dentro la closure e viene buttata all'uscita di `compilePath`. Unico punto di perdita: tutto il resto del pipeline consuma il set piatto.

### F2. Cosa fa il ReadCtx su un hop di reference: pointer string (draw) o proxy (lproxy)

L'accessor compilato (`irCompile.ts:77-94`) risolve gli hop a runtime: `ctx.getValue(currentId, feature)` e, se non è l'ultimo passo, pretende una stringa pointer (`:89`). Backend draw: `findFeatureRaw` (`irReadCtx.ts:33-46`) matcha per NOME e ritorna `values[0]` (pointer string). Backend lproxy: `lObj['$'+feature].value` può ritornare un PROXY (non stringa) → il check `typeof out !== 'string'` fa fallire l'hop (aggirato in `irEdgeViews.ts:191-193` con `toId()` solo per gli endpoint). La concretizzazione dei dep pair conviene farla con semantica draw (pointer string, nessuna coercizione a upperBound).

### F3. Reattività self: subscription per-nodo già esistente e non filtrata

`useIRView` (`irResolve.ts:37-57`) è la subscription di ogni ObjectNode: firma con irSig + snapshot NON filtrato di TUTTI gli slot DValue di self. Cambia uno slot di self → firma cambia → re-render → `IRNodeContent` rilegge tutto a render-time. La macchina per-nodo "selector che produce una stringa → re-render mirato" esiste già e gira su ogni store-change per ogni nodo; estenderla di O(#dep cross) per nodo è marginale.

### F4. Reattività edge: oaeSlotsSig osserva solo gli slot DEGLI oggetti-edge, non dei target navigati

`oaeSlotsSig` (`useIRContainment.ts:69-93`): osserva `source`/`target`/`name` DELLA Transition, mai gli slot dello State navigato. Costo per store-change: O(#oggetti × #feature) con scan completo di `state.objects`; la firma entra nel useMemo che ricalcola l'INTERA decoration (invalidazione globale, non mirata).

### F5. Anatomia del caso rotto (vertex) e del caso "incidentalmente coperto" (edge)

Scenario: O (Task) ha view vertex con label `$assignee.value.$name.value`; slot `assignee` punta a B (Person). Muta `B.name`:
1. Redux rimpiazza la DValue di B in idlookup.
2. `useIRView(B)` vede la firma self di B cambiata → B si ri-renderizza.
3. `useIRView(O)`: la firma copre solo gli slot di O, invariati → NESSUN re-render di O. La label di O resta stale. Caso pulito del bug.
4. Lato edge: il sync incrementale di `useJjomSync` ricalcola il node data di B → `stableNodes` cambia → il useMemo di `useIRContainment` ri-esegue → le label multi-hop degli edge si aggiornano "per caso". Accoppiamento fragile, costoso (ricalcolo O(model) per qualunque churn di node data), non copre il caso vertex.

### F6. Dove agganciare: indice, cache e pattern esistenti

- `irResolveCore.ts`: `computeIRSignature` + `indexCache` per signature danno il punto di aggancio compile-time.
- L'indice inverso runtime (target → osservatori) NON può vivere nell'indexCache (statico per signature). Pattern giusto: singleton con version-hook (`irCollapseState.ts`, `irEdgeInteraction.ts`). Un nuovo `irCrossDeps.ts` con registry passivo segue la convenzione.
- Concretizzazione (objectId, featureName) → fid via `findFeatureRaw`: osservare il fid permette il check più economico (confronto di REFERENCE su `idlookup[fid]`).

### F7. Vincolo perf dal trickle report

Lezioni: (a) niente lavoro O(model) o DOM per store-change; (b) niente nuovi cicli rAF o `updateNodeInternals`; (c) la soluzione non deve aggiungere commit se non quelli strettamente necessari.

## Q2: estrazione del dep set multi-hop

Compile-time: in `compilePath`, per ogni path con `steps.length > 1` esporre `{ hops: {feature, take}[], terminal: {feature, take} }`. `CompiledView`/`CompiledEdgeView` guadagnano un campo additivo `crossPaths: CompiledCrossPath[]`. `dependencySet` piatto resta invariato.

Runtime: funzione pura `resolveCrossDeps(idlookup, objectId, crossPaths)` che cammina i prefissi con semantica draw, emette coppie (t_i, feature_{i+1}) per ogni livello (la coppia self a livello 0 è già coperta), risolve subito a fid via findFeatureRaw. Il set si ricalcola al render dell'osservatore: non serve manutenzione incrementale.

## Q3: opzioni di invalidazione

- (a) Estensione oaeSlotsSig con firma globale: O(N×feature) per dispatch, invalidazione non mirata. Bocciata come soluzione generale.
- (b) Indice inverso con `store.subscribe`: minimo per store-change ma introduce una seconda infrastruttura di subscription parallela a react-redux, con edge case di timing. Fallback.
- (c) Subscription per-nodo estesa (two-phase: render pubblica, selector consuma): O(#dep) per nodo dentro selector già attivi, invalidazione mirata, nessuna nuova macchina. Copre i vertex.
- (d) IBRIDO RACCOMANDATO: (c) per i vertex + registry passivo di coppie per gli edge, senza store.subscribe. Costo O(#dep) dentro selector esistenti, zero nuovi commit oltre al re-render dell'osservatore colpito, nessun file di critical zone.

## Q4: perimetro file e critical zone

| File | Modifica |
|------|----------|
| `viewpoint/ir/irCompile.ts` | emissione `crossPaths` (additiva) |
| `viewpoint/ir/irTypes.ts` | tipi `CompiledCrossPath`/`CompiledPathStep` + campo additivo |
| `viewpoint/ir/irReadCtx.ts` | export di `findFeatureRaw` (additivo) |
| `viewpoint/ir/irCrossDeps.ts` | NUOVO: resolveCrossDeps + registry passivo |
| `viewpoint/ir/irResolve.ts` | selector di useIRView esteso + pubblicazione dep |
| `viewpoint/ir/irEdgeViews.ts` | `edgeObjectDeps` additivo nel return di synthesizeObjectAsEdges |
| `viewpoint/ir/useIRContainment.ts` | firma edge sulle coppie registrate + reset epoch |
| `viewpoint/ir/__tests__/irCrossDeps.test.ts` | NUOVO test |

Nessun file critical zone (§3.1). Solo letture del D-layer: Layer Impact Report `not-required`.

## Q5: strategia di test

Vitest puro (fixture idlookup): estrazione crossPaths (2/3 hop, single-hop, values[N], dedup, predicato), concretizzazione (terminale + intermedio, feature assente → unresolved, reference vuota, ciclo), firma (value change, gone-fid marker, epoch reset). E2E discriminante (caso vertex, oggi ROSSO): view vertex con label multi-hop che legge una feature di un ALTRO oggetto, editata sul target; assert sul DOM del nodo osservatore senza toccarlo.

## Q6: casi limite

1. Catene 3+ hop: coppie a ogni livello.
2. Reference multivalore: cap 100 target/path con warn (dormiente in v1: l'accessor non naviga array intermedi).
3. Cicli: la camminata è lineare (un passo per hop), termina sempre; dedup delle coppie.
4. Target cancellato: fid sparito → marker distinto nella firma → re-render → set ridotto.
5. Cambio del valore dell'hop: il primo hop è self → firma self scatta → re-registrazione.
6. Rename di feature M2: la concretizzazione risolve nome→fid a ogni registrazione; coppia non risolvibile = segnale, warn one-shot per (viewId, featureName).

## Raccomandazione

Opzione (d): `crossPaths` strutturati dal compile + registry passivo di coppie (objectId, feature)→fid + estensione dei selector esistenti. Invalidazione mirata per-nodo, costo O(#dep) dentro infrastruttura già attiva, zero nuove subscription fuori React, nessun file di critical zone.

Rischi: (1) il two-phase introduce una dipendenza d'ordine da documentare; (2) coerenza draw/lproxy: usare semantica draw con normalizzazione toId; (3) leak del registry su unmount/cambio viewpoint: cleanup su unmount + reset epoch su cambio irSig.

## Ratifiche di Alfonso (2026-07-20)

1. Semantica draw per la concretizzazione, con normalizzazione toId, anche con backend lproxy attivo: SÌ.
2. Cap fan-out 100 target/path con console.warn: SÌ.
3. Rename M2: console.warn one-shot per (viewId, featureName) in v1; nessuna osservazione dei ref delle feature M2. Problems panel + validazione PathExpr al rename → sessione design authoring.
4. Decoration edge monolitica per il Blocco 1: SÌ (granularità per-edge rimandata).
5. Percorso incidentale F5.4: resta come rete di sicurezza in questo cantiere, si stringe in un giro successivo con benchmark.

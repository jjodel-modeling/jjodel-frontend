# IR Schema Addendum: row view dispatch (estensione della v1.2)

**Data**: 2026-07-25
**Stato**: ratificato da Alfonso (OQ-1..OQ-8 del discovery report + policy P1/P2/P3 della chat di progetto).
**Fonti**: `docs/discovery/discovery_2026-07-25_row_view_dispatch.md` (repo, commit dei findings con file:riga) + analisi in chat del 2026-07-25.
**Rapporto con la v1.2**: addendum additivo. Nessuna modifica ai kind esistenti (`vertex`, `graphVertex`, `edge`), nessun bump di `irVersion`.

## 1. Motivazione

I `fieldCompartments` hanno due modi legittimi di produrre righe, e lo schema ne copriva uno solo.

**Slot-iteration** (esistente): `from:'attributes'` / `from:'references'` iterano gli slot del self. Giusto per i metamodelli dove le feature sono slot (es. `State.isFinal`). Resta invariato.

**Dispatch polimorfico** (nuovo): per i metamodelli che reificano le feature come oggetti (es. `Class --ownedFeatures (composizione)--> Feature` astratta, con `Attribute` e in futuro `Operation` sottotipi concreti). Il compartment dichiara solo su quali containment children iterare (filtro); ogni child è reso dalla **row view** risolta per la SUA metaclasse concreta, con lo stesso matching dei vertici (priority > specificità esatta > ereditata > wildcard > declaration order), in un contesto di rendering distinto. Proprietà: open/closed (aggiungere `Operation` = aggiungere una view, il compartment non cambia), fallback per ereditarietà già dato dal matching, reattività per-riga con lo stesso principio dei nodi.

I due modi convivono nello stesso schema di compartment.

## 2. Schema (additivo)

```typescript
// Nuovo kind di view IR. Additivo: non entra in NodeViewIR.
interface RowViewIR {
  irVersion: string;                 // 'ir-1.0': nessun bump, vedi forward-compat sotto
  kind: 'row';
  metaclasses: string[] | '*';
  predicate?: Predicate;
  priority?: number;
  label?: string;                    // nome della view in authoring
  template: TextSource[];            // segmenti radicati sull'oggetto della riga
  visible?: Conditional<boolean>;
}

// Compiled separato (OQ-2), speculare a CompiledEdgeView.
// Niente shape/labels/badges/fieldCompartments/containment: il type system fa da guardia
// e nessun consumer esistente di CompiledView cambia.
interface CompiledRowView {
  kind: 'row';
  // struttura speculare ai compiled esistenti: template compilato via compileTextSource,
  // visible compilata via il conditional compiler esistente. Firme esatte: dai pattern
  // reali di irCompile.ts, non da questo documento.
}

// Sorgente di compartment estesa (entra in R2, INSIEME al renderer che la interpreta):
type RowSource =
  | { from: 'attributes' }
  | { from: 'references' }
  | { from: 'children'; filter?: Predicate };   // dispatch polimorfico sui containment children
```

**Forward-compat senza bump**: il gate del resolver (`irResolveCore.ts:120`) scarta silenziosamente i kind sconosciuti. Una build precedente che apre un progetto con row view semplicemente non le rende, senza crash: comportamento accettato per costruzione.

**Perché `from:'children'` non entra in R1**: lo schema di una sorgente e il renderer che la interpreta viaggiano nella stessa fetta (R2). Mai uno stato intermedio in cui lo schema promette una sorgente che il renderer ignora in silenzio.

## 3. Risoluzione (OQ-1)

- **Bucket dedicati** nell'`IRViewpointIndex`: `rowByMetaclass` / `rowWildcard`, accanto ai bucket vertex e edge esistenti. Garanzia strutturale: una vertex view non è mai candidata come riga e viceversa, nemmeno per errore.
- **Comparatore condiviso**: l'ordinamento (priority > specificità > declaration order) è oggi duplicato inline 3 volte nei resolver esistenti. Si estrae in un helper condiviso e lo adottano tutti e quattro i resolver (i tre esistenti + `resolveRowView`). Richiesta esplicita, non refactoring opportunistico.
- **Gate kind** (`irResolveCore.ts:120`): `row` instrada nei bucket row; ogni altro kind sconosciuto continua a essere scartato come oggi. Questo è il punto singolo più rischioso dell'intera estensione: test di regressione obbligatorio.
- **Cascata di fallback (P1 + OQ-5)**: row view esatta sul sottotipo > ereditata da superclasse > wildcard row > `defaultRowViewIR()` built-in. Il built-in è un valore **runtime** in `irDefaults.ts` (template = intrinsic name), compilato al volo, **mai persistito** come DViewElement (a differenza del `Pointer_ViewFallback` classic). Conseguenza: VersionFixer non coinvolto.

## 4. Rendering (OQ-3, P2)

- **Un componente per riga** (`IRRow`), legato al child: subscription propria keyed sul `childObjectId` (pattern `useIRView` radicato sul child). Il componente risolve anche il vincolo React dei hook nel loop.
- **crossDeps** resta il meccanismo per i multi-hop DENTRO il template della riga (es. un path che naviga dal child), radicato sul child. I due meccanismi si compongono, non si escludono.
- **Costo**: le N subscription non sono un costo nuovo ma spostato: gli stessi N oggetti oggi sono nodi top-level con subscription proprie. Ottimizzazioni solo se il dogfooding le richiede.
- **P2, righe read-only in v1**: niente selezione né edit inline; l'editing del child passa da treeview/Properties. L'editable inline sulle righe è una slice futura con superficie propria.

## 5. Totalità del dispatch (P1)

Il compartment `from:'children'` rende come riga **tutti** i children che passano il filtro; chi non ha row view usa il built-in. Il filtro decide CHI è riga; la view risolta decide COME si rende; il fallback garantisce che "riga" non fallisca mai. Nessuno stato misto metà righe metà nodi. Coerente con la filosofia "malformed ir non fa cadere il canvas".

## 6. Soppressione top-level (OQ-4, P3)

- **Meccanismo**: `hidden:true` nel pass di presentazione (`useIRContainment`), a valle del sync. **Mai removal** dall'array nodi: edge lifting, hull sizing e persistenza posizione (`portDistribution`/`canvasToJjom`) indicizzano per id. Il DVertex del child resta, nascosto. Fuori critical zone per costruzione: `useJjomSync.ts` e `portDistribution.ts` non si toccano.
- **Edge del child**: stessa via del collapse (`decorateEdges`, lift-to-ancestor / suppress). Un child nascosto-perché-riga si tratta come un child nascosto-perché-collassato: zero semantica nuova per gli edge. I set hidden (collapse + righe) si uniscono senza conflitto.
- **P3, single source of truth**: il pass di presentazione (che nasconde) e il renderer (che itera) calcolano lo stesso set con la **stessa funzione pura** condivisa, `rowRenderedChildren(compiledView, readCtx, selfId)`. Due calcoli paralleli divergerebbero: nodo nascosto ma non reso, o doppione visibile.
- Il set deriva dalle view **effettivamente applicate**: se la view dell'host non matcha o l'host non è sul canvas, i child tornano nodi normali senza logica aggiuntiva.

## 7. Persistenza (OQ-7)

Le row view vivono nel campo `ir` del DViewElement come ogni view IR; nessun jsxString; nessuna default view seedata con row; fallback runtime. VersionFixer (§3.9) non entra.

## 8. Fuori scope (slice future dichiarate)

- Navigazione di reference **non-containment** (cicli possibili: richiederà guardia di profondità).
- Parametri di `Operation` (join annidato o dispatch ricorsivo dentro una riga).
- **Filtro per-reference** (OQ-8): `containmentChildren` appiattisce le composizioni senza tag di provenienza. Quando servirà, sarà una funzione additiva nuova, non un cambio di firma dell'esistente. Non si predispone ora.
- Editing inline e selezione della riga (P2).

## 9. Piano di implementazione (tre fette)

- **R1, schema + resolver + guard**: `RowViewIR`/`CompiledRowView`, `compileRowView`, bucket + gate + `resolveRowView` + estrazione comparatore, routing `irValidate`, guard anti-riseed in `ViewData.tsx`/`EnableIRPanel.tsx`, test (gate incluso). Nessun cambiamento visivo atteso; verifica = build + test + smoke.
- **R2, dispatch + soppressione** (insieme: senza soppressione il dispatch mostra doppioni e la verifica visiva non ha senso): `from:'children'`, `IRRow`, `defaultRowViewIR`, `rowRenderedChildren` condivisa, step hidden + edge lift. Verifica visiva sul class diagram: `Person` con `name`/`surname` come righe `name : type`, nodi Attribute spariti, edit via treeview riflesso live.
- **R3, authoring**: `RowAuthoringPanel` nuovo e snello (OQ-6: non estensione di `VertexAuthoringPanel`), tab IR per kind row, opzione `children` nel `FieldCompartmentListEditor`. Fino a R3 le row view si creano via snippet console, come già fatto col testbed IR.

## Riferimenti

- Discovery: `docs/discovery/discovery_2026-07-25_row_view_dispatch.md` (repo).
- Siti chiave: `irResolveCore.ts:120` (gate), `irContainment.ts:47-63` (containmentChildren), `IRNodeContent.tsx:44-65,179-231` (renderer self-only), `useIRContainment.ts:112-137` (innesto soppressione), `ViewData.tsx:53,81-83` + `EnableIRPanel.tsx:55-59` (guard).
- Spec precedenti: `spec_2026-06-08_ir_schema_v1_1.md`, `spec_2026-07-18_ir_schema_v1_2.md` (KB di progetto).

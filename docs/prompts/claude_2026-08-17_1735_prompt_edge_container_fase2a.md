# Endpoint `container` — Fase 2, slice 2a: compile permissivo, containerOf, sintesi estesa, misura

> **Nome del documento prompt**: 2026-08-17 17:35

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili.
Corsia: **completa** (critical zone `viewpoint/ir/`). Nessun file della lista §3.2 viene
modificato (sync in sola lettura): Layer Impact Report not-required, ma se durante il lavoro
emerge una propagazione verso sync o D-layer, STOP e segnala (Rule 20).

Leggi `CLAUDE.md` e `docs/decisions.md`. Branch: `alfonso-frontend-jjtl`.
Vincoli ratificati: **R-B13..R-B16** (nuove), R-B9, R-B9-bis. Memo:
`docs/ratifiche/claude_2026-08-17_memo_ratifica_edge_endpoint_container.md`. Report:
`docs/discovery/discovery_2026-08-17_edge_source_container.md` **incluso l'addendum in coda**
(misura: le Transition del progetto di test sono in forma (b), `father = DValue`, senza
vertice). Se questo prompt contraddice memo o righe, segnala e fermati.

## Contesto (non rifare la discovery)

Fatti già stabiliti, con evidenza nel report: il vocabolo `container` è libero (parser eseguito);
la risoluzione endpoint vive solo in `synthesizeObjectAsEdges` (`irEdgeViews.ts:180-230`), che
oggi itera `nodes` e quindi non vede gli oggetti in forma (b); `parentOf` è parziale per il
filtro graphVertex (`irContainment.ts:169-170`) e non si riusa; un token ignoto oggi fa
scartare l'intera view (`irResolveCore.ts:142-147`) — la permissività del compile è il primo
passo obbligato (R-B15). La UI, `validateIR`, il guard R4 e gli emendamenti spec sono della
slice 2b: qui NON si toccano.

## COSA

Quattro file di codice più il file di test. In quest'ordine.

1. **`viewpoint/ir/irTypes.ts`** — costante esportata del vocabolario endpoint (precedente
   `VALID_ROUTING_VALUES`): `export const CONTAINER_ENDPOINT = 'container' as const;`. Su
   `CompiledEdgeView` SOLO aggiunte opzionali (Rule 11): `sourceIsContainer?: boolean;
   targetIsContainer?: boolean`. Commento doc sul tipo endpoint: unione concettuale
   `PathExpr | 'container'` (l'emendamento formale della spec è in 2b).
2. **`viewpoint/ir/irCompile.ts`** — `compileEdgeView`: se `e.source === CONTAINER_ENDPOINT`,
   non passare da `compileExpr`/`parsePathExpr`: `sourceExpr` resta `null` e
   `sourceIsContainer = true` (simmetrico per target). `isObjectAsEdge` diventa vero quando
   ciascun endpoint è o un accessor compilato o un container-flag (coppia completa in ogni
   combinazione, doppio `container` incluso, R-B13). Il token NON aggiunge nulla al
   `dependencySet` (è un non-feature, report §Q3). Nessun throw per il token: è questa la
   permissività di R-B15; ogni altro input invalido continua a lanciare come oggi.
3. **`viewpoint/ir/irContainment.ts`** — in `ContainmentModel` una seconda mappa
   **`containerOf: Map<string, string>`** (child objectId → container objectId) e un insieme
   **`walkedObjects: Set<string>`** (tutti gli oggetti incontrati), costruiti dal walk di
   composizione dalle radici del modello (riusa la logica di `containmentChildren`,
   `:48-64`), SENZA il filtro di view di `:169-170`. `parentOf` resta byte-identica nel
   comportamento. Il walk copre entrambe le forme: il pointer nello slot c'è sempre; `father`
   non si usa (inservibile in forma (a), corollario del report §Q2).
4. **`viewpoint/ir/useIRContainment.ts`** + **`viewpoint/ir/irEdgeViews.ts`** —
   `synthesizeObjectAsEdges` riceve `containerOf` e i candidati e **itera i candidati, non i
   nodi** (R-B14): l'unione degli oggetti-con-vertice attuali e dei `walkedObjects` senza
   vertice la cui metaclasse ha una view object-as-edge (`index.objectAsEdgeByMetaclass`).
   Risoluzione endpoint: container-flag → `containerOf.get(objectId)`; altrimenti accessor
   come oggi. Vertice richiesto **solo agli endpoint** (`vertexByObj`). Forma (a): hide del
   nodo e filtro degli edge propri, invariati. Forma (b): nessun hide, nessun filtro (non c'è
   nulla sul canvas). `data.irSourceFeature`/`irTargetFeature` restano `firstFeatureOf(...)`
   (che su `container` dà `null`: comportamento dichiarato da R-B16, non correggerlo qui).
   Endpoint irrisolvibile su oggetto senza vertice: `continue`, invisibile come oggi (deroga
   §10 ratificata).
5. **`viewpoint/ir/__tests__/ir.test.ts`** — estendere il mondo edge esistente (`:662-790`)
   con: (i) compile di una view con `source: 'container'` + `target: '$next.value'` →
   `isObjectAsEdge` vero, nessun throw, flag corretti; (ii) sintesi su fixture in forma (b)
   (oggetto annidato senza vertice, container e target con vertice) → un edge sintetico
   `irobj_*` con gli endpoint giusti; (iii) doppio `container` → self-loop sul vertice del
   contenitore; (iv) endpoint irrisolvibile su oggetto senza vertice → nessun edge, nessun
   throw; (v) la view con token su un solo endpoint e l'altro assente resta non-object-as-edge
   (bucket reference-as-edge, comportamento attuale).

## HARD STOP — misura di reattività inclusa

Prima del commit, in chat: diff completa; grep di collisione su `CONTAINER_ENDPOINT`,
`containerOf`, `walkedObjects`, `sourceIsContainer`, `targetIsContainer` con controllo
positivo; gate `npm run typecheck` (baseline invariata), `npm run build`,
`npx vitest run src/components/editor-v2` (baseline dichiarata nel log del task pannello).

Poi la **misura** (R-B16), sul progetto di test di Alfonso con hard-refresh:

1. Scrivere a mano nell'IR della view edge di `Transition` (tab Source, advanced):
   `edge.source: 'container'`, `edge.target: '$next.value'`.
2. Atteso: 5 edge sintetici (`document.querySelectorAll('[data-id^="irobj_"]').length === 5`),
   zero elementi visibili di metaclasse `Transition` (oggi già zero: nessuna regressione).
3. Da console, spostare una `Transition` dallo slot `transitions` di uno `State` a un altro
   (scrittura proxy sullo slot). Atteso: l'edge sintetico si riaggancia al nuovo contenitore
   senza reload. Riportare l'esito con i numeri (edge prima/dopo, eventuale conteggio dei
   ricalcoli se l'esito è ambiguo).
4. Se la misura FALLISCE: hard stop vero — niente commit di rimedio improvvisato; si riporta
   in chat e la decisione su come estendere il segnale torna all'architetto (R-B16 prevede
   questo esito).

Commit solo dopo go-ahead di Alfonso sulla misura, `git add` dei soli file dichiarati. Entry
di log §21.2 con la misura nei Notes.

## NON FARE

- Niente `validateIR`, niente `EdgeAuthoringPanel`/`PathBuilder`, niente `handleReconnect`,
  niente emendamenti spec: sono la slice 2b.
- Niente modifiche a `parentOf`, `ReadCtx` (superficie R-SIM-4), `pathExpr.ts`/`STEP_RE`,
  `oaeSlotsSig`, file del sync (`useJjomSync`, `useM1ReferenceEdges`: sola lettura).
- Nessun campo obbligatorio nuovo su interfacce esportate; solo opzionali (Rule 11).
- Non "sistemare" R4 o la connect rule di passaggio: dichiarati, non bug (R-B16).

## RIFERIMENTI

Report §Q1/§Q2/§Q3 e R1..R8; memo di ratifica; righe R-B13..R-B16; `irEdgeViews.ts:180-230`,
`irCompile.ts:370-400`, `irContainment.ts:28-101,145-217`, `useIRContainment.ts:80-111,145-186`,
`irResolveCore.ts:120-169`, `edgeEndpoints.ts:42-45` (non toccarlo: già accetta il token),
`ir.test.ts:662-790`.

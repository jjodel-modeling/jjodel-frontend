# Discovery S4b — perché il recalc di Step B non agisce sul flusso trasformazione + auto-layout

**Data**: 2026-07-07 17:30
**Tipo**: discovery mirata, **READ-ONLY** (nessuna modifica a sorgente; strumentazione preparata ma NON applicata/committata)
**Contesto**: Fase 2 S4 committata (`b7f67e2a0` Step B recalc post-ELK, `6a943c76e` Step C gate U). Gate visivo di Alfonso **FALLITO** sul caso A: output diretto di trasformazione Families + auto-layout, **nessun drag**, ma `father`/`mother` con source sul lato sbagliato di Pierantonio (pattern: sembrano scambiati, wrap-around = firma grid-freeze del caso A).
**Metodo**: trace statico con `file:funzione:riga` (letto `ProjectEditor.tsx`, `EditorV2.tsx`, `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `elkLayout.ts`) + 1 Explore agent per il flusso ProjectEditor→layout. Nessuna esecuzione in-app disponibile in questa sessione → dove il verdetto dipende dall'interleaving async runtime, lo dichiaro e fornisco lo snippet `[S4B]` che Alfonso esegue per la conferma.
**HARD STOP**: al termine. Nessun fix senza go-ahead (prompt separato).

---

## 0. TL;DR — verdetto

| Ipotesi | Verdetto | Sintesi |
|---------|----------|---------|
| **H1** — percorso diverso (il flusso non passa da `handleAutoLayout`) | **REFUTATA** (con correzione) | ProjectEditor NON chiama ELK e dispone i nodi a **griglia**, ma `handleAutoLayout` **viene comunque innescato** dall'onInit di `useJjomSync`: al mount le reference `father`/`mother` sono già nello store (tab aperto a +2000ms, reference scritte a +1000ms) → `missingM1EdgeCount>0` → `justCreatedGraphRef=true` (`useJjomSync.ts:625`) → onInit lancia `handleAutoLayout`. Quindi l'ELK **c'è**, ma è un unico entry-point condizionato. |
| **H2** — timing degli edge M1 | **CONFERMATA come causa primaria** (conferma runtime richiesta) | Gli edge `father`/`mother` sono creati **async** (Step 4 `DVoidEdge.new2`, commit differito) e si materializzano nello stato RF **attraverso la sync incrementale**, non nel full build. `handleAutoLayout` parte a **soli 50 ms** dall'onInit (`EditorV2.tsx:340`). Il **full build gira SENZA gli edge M1** (li dispatcha l'effetto precedente, ma il commit è differito → `lGraph.edges` non li vede ancora); quindi l'ELK e il recalc di Step B operano su un set edge **privo di `father`/`mother`** (o al più materializzato al limite dei 50 ms). Risultato: ELK non ha struttura → nodi ~griglia; il recalc **non ha gli edge da ri-lateralizzare**; gli edge arrivano dopo, via sync incrementale, sulle **posizioni-griglia** → lati grid-frozen. |
| **H3** — sovrascrittura da `rfEdgeCache` | **MECCANISMO NON REGGE come formulato** (correzione all'inventario S4) | Il preserve `:1259-1260` scrive l'handle **cache** sul fresh `rfEdge`, **ma** l'applicazione della patch a `:1353-1354` **ri-preferisce l'handle LIVE di RF** (`e.sourceHandle`) e lo **riscrive in cache** (`:1383`). Quindi la sync incrementale **non ripristina** un recalc corretto già presente nello stato RF: conserva ciò che è live. Un revert persistente richiederebbe che il flush giri mentre l'handle live è ancora grid — non è il "la cache vince sempre" ipotizzato. |

**Verdetto operativo**: la causa del fallimento è **H2** (l'auto-layout gira troppo presto rispetto alla materializzazione async degli edge M1). **H1 è refutata** (l'ELK è raggiunto) e **H3 è un'assunzione errata** dell'inventario precedente da correggere. Il fix S4b deve **ri-eseguire la scelta-lato quando gli edge M1 sono effettivamente presenti nello stato RF a valle del layout** — non affidarsi alla finestra di 50 ms.

> Nota §5.1: il verdetto H1 è provato staticamente (timeline + righe). Il verdetto H2 è provato per **costruzione** (il full build non può contenere edge il cui commit è differito) fino al confine dei 50 ms; l'esito esatto entro quella finestra è **timing-dipendente** e va confermato in-app con lo snippet `[S4B]` (§4). Non ho potuto riprodurre in-app in questa sessione.

---

## 1. Timeline ricostruita del flusso "trasformazione Families → auto-layout"

Origine temporale `T0` = fine della TRANSACTION di creazione in `ProjectEditor.handleExecuteTransformation` (`ProjectEditor.tsx:1259`, TRANSACTION a `:1524`).

| t (≈) | Evento | file:funzione:riga | Effetto sullo stato |
|-------|--------|--------------------|---------------------|
| T0 | TRANSACTION: crea `DModel`, `DGraph` (graphStyle `v2-flow`), `DObject` (Pierantonio, Member_0, Member_1). Posizioni **griglia** in `pendingVertices`. **Nessun edge.** | `ProjectEditor.tsx:1524-1632` | DObject presenti; nessun DVertex; nessuna reference; nessun edge |
| T0 + ~1 frame | rAF, poi **STEP 6b**: crea i `DVertex` alle coord griglia (`GraphSize(posX,posY,200,80)`) FUORI transazione | `ProjectEditor.tsx:1710-1735` (`DVertex.new` `:1728`) | DVertex a **griglia** |
| T0 + **1000 ms** | **STEP 8/8b** (`setTimeout(…,1000)`): scrive attributi e **reference** `father`/`mother` via `feature.setValueAtPosition(ri, targetId, {isPtr:true})` | `ProjectEditor.tsx:1743` (delay `:1844`), STEP 8b `:1785-1832` | `dFeat.values` delle reference **popolati** (commit differito, ma settला entro pochi ms) |
| T0 + **2000 ms** | **STEP 7** (`setTimeout(…,2000)`): apre il tab → **mount di EditorV2** | `ProjectEditor.tsx:1692-1702` (`DockManager.open2`) | EditorV2 monta con reference **già presenti** (2000 > 1000) |
| mount | `useJjomSync` **effetto create-missing-elements**: `needsNewGraph=false`, `missingClassifiers=0`, `missingObjectsCount=0` (vertici già creati), **`missingM1EdgeCount>0`** (reference presenti, edge assenti) → NON early-exit (`:615`) → **`justCreatedGraphRef.current=true`** (`:625`) → **Step 4** crea `father`/`mother` `DVoidEdge.new2` (dispatch, **commit differito**) | `useJjomSync.ts:573-618`, `:625`, Step 4 `:883-926` | edge M1 **dispatchati** (non ancora nello store) |
| mount (stessa commit, effetto successivo) | `useJjomSync` **full build** (one-shot, guardato da `initializedRef` `:1057`): legge `lGraph.edges` **SINCRONO** → il commit degli edge M1 è differito → **edge M1 NON presenti** → `edgeCache`/`setEdges` **senza** `father`/`mother`. Poi `onInitialized()` via rAF (`:1102`) | `useJjomSync.ts:1034-1108` | RF edges = **senza edge M1**; `rfEdgeCache` = senza edge M1 |
| mount + rAF + **50 ms** | `EditorV2` onInit callback: `justCreatedGraphRef.current` è true → **`handleAutoLayout()`** | `EditorV2.tsx:340-346` (delay 50 ms `:340`) | parte l'unico ELK |
| dentro `handleAutoLayout` | `getEdges()` = stato RF **al momento** → se gli edge M1 non sono ancora materializzati (vedi sotto), ELK gira **senza edge** → nessuna gerarchia → nodi ~griglia; il recalc di Step B **non ha `father`/`mother`** da ri-lateralizzare | `EditorV2.tsx:2818-2836` (recalc Step B `:2836-...`) | nodi → layout ELK (povero se senza edge); edge M1 non toccati |
| T0+~0..50 ms (interleaved) | commit differito degli `DVoidEdge` settla → `subElementIds`/`elementSnapshots` cambiano → **sync incrementale** aggiunge `father`/`mother` come `addedEdges` via `jjomEdgeToRFEdge` sulle posizioni **correnti** | `useJjomSync.ts:1154-1186` (`jjomEdgeToRFEdge` `:1162`, push `:1184`) | edge M1 materializzati con lati calcolati sulle posizioni **del momento** |

**Punto critico**: il full build **non può** contenere gli edge M1 (dispatch nell'effetto precedente, commit differito → store non aggiornato alla lettura sincrona di `lGraph.edges`). Quindi `handleAutoLayout` è innescato da un full build **senza edge M1**, e parte 50 ms dopo. Se gli edge M1 non rientrano nello stato RF entro quei 50 ms (catena async: `setTimeout(0)` commit → Redux → `useSelector` → effetto sync → `scheduleFlush` rAF → `setEdges`; facilmente 2–3 frame ≈ 32–50 ms), **l'ELK e il recalc girano senza di essi**.

---

## 2. Verdetto per ipotesi (evidenza)

### H1 — "il flusso non passa da handleAutoLayout" → **REFUTATA (con correzione)**

- **ProjectEditor NON lancia ELK/auto-layout** e non crea edge: dispone i nodi a **griglia** (`ProjectEditor.tsx:1595-1632`, `:1717-1735`); nessun `computeElkLayout`/`handleAutoLayout`/`justCreatedGraphRef`/`DVoidEdge` nel file (Explore agent: grep vuoto). L'unico caller di `computeElkLayout` è `handleAutoLayout` (`EditorV2.tsx:2823`); l'unico caller di `elkLayout.computeElkLayout` è quello (`elkLayout.ts:50`).
- **Ma** `handleAutoLayout` **è raggiunto**: al mount (T0+2000ms) le reference sono già nello store (scritte a T0+1000ms) → `missingM1EdgeCount>0` (`useJjomSync.ts:573-598`) → guardia `:615` non early-exit → `justCreatedGraphRef.current=true` (`:625`); l'onInit di EditorV2 (`:342`) legge il flag true → `await autoLayoutRef.current()` (=`handleAutoLayout`, `:345`).
- **Conclusione**: l'ELK/recalc **c'è nel flusso**. La premessa H1 ("percorso diverso, nessun ELK") è **falsa** per questo timeline. **Correzione all'inventario §3** della discovery `2026-07-07-m1-side-selection.md`: la riga "ELK auto-layout → `applyDistribution` → No (solo re-index)" è **superata** da Step B — ora `handleAutoLayout` **ricalcola i lati** (commit `b7f67e2a0`); il difetto non è "nessun recalc", è "recalc su un set edge incompleto" (H2).

### H2 — "timing degli edge M1" → **CONFERMATA (causa primaria; conferma runtime richiesta)**

- Gli edge `father`/`mother` sono creati da **Step 4** (`useJjomSync.ts:883-926`, `DVoidEdge.new2`) con **commit differito** (CompositeAction, cfr. discovery `2026-07-07-identity-name-decoupling` §root-cause-race: commit a `setTimeout(0)`).
- Il **full build** (`:1034-1108`, one-shot) legge `lGraph.edges` **sincrono** subito dopo → **non vede** gli edge appena dispatchati → `setEdges` iniziale **senza** `father`/`mother`; `rfEdgeCache` idem.
- `handleAutoLayout` è schedulato **50 ms** dopo l'onInit (`EditorV2.tsx:340`), che a sua volta è un rAF dopo il full build. `handleAutoLayout` usa `getEdges()` (`EditorV2.tsx:2820`) = stato RF al momento. Se gli edge M1 non sono ancora materializzati (catena async ≈ 2–3 frame), **ELK gira senza edge** (nessuna gerarchia → nodi restano ~griglia, cfr. `elkLayout.ts` layered senza `elkEdges`) e il **recalc di Step B non ha `father`/`mother`** da correggere.
- Gli edge M1 arrivano **dopo**, come `addedEdges` della sync incrementale (`:1154-1186`), con `jjomEdgeToRFEdge` → `computeOptimalHandles` sulle **posizioni correnti**. Se l'ELK non ha spostato i nodi (perché senza edge) → posizioni ~griglia → **lati grid-frozen** = firma osservata (Family a griglia, ordine `rawModel.objects` → wrap-around).
- **Perché è la causa primaria e non H3**: anche se un recalc corretto girasse, la sync incrementale lo **preserverebbe** (§H3). Il difetto è che il recalc **non vede mai** gli edge giusti al momento giusto.
- **Da confermare in-app** (§4): che a `handleAutoLayout` entry `getEdges()` **non contenga** `father`/`mother` (o li contenga ma su posizioni ~griglia perché ELK non li ha usati).

### H3 — "sovrascrittura da rfEdgeCache" → **MECCANISMO NON REGGE (correzione)**

- Il preserve invocato dal prompt è `useJjomSync.ts:1257-1261`: per un edge esistente in cache, `rfEdge.sourceHandle = existing.sourceHandle` (cache). **Ma** questo `rfEdge` finisce in `patchedEdges` (`:1263`), e l'**applicazione** della patch (`:1348-1385`) fa, per ogni edge:
  ```
  const merged = { ...newEdge };                 // handle = cache
  if (e.sourceHandle) merged.sourceHandle = e.sourceHandle;  // ← ri-prende l'handle LIVE di RF
  if (e.targetHandle) merged.targetHandle = e.targetHandle;
  ...
  rfEdgeCache.current.set(e.id, merged);         // ← riscrive la cache con l'handle LIVE
  ```
  (`:1352-1354`, `:1383`). Quindi **l'handle live di RF vince** sul cache, e viene **ripromosso in cache**. Un recalc corretto già scritto nello stato RF (da `handleAutoLayout`) **non viene ripristinato a grid**: viene conservato.
- Un revert persistente richiederebbe che il flush della sync giri **mentre** l'handle live è ancora grid (cioè prima che il `setEdges` del recalc abbia effetto). Data l'ordinazione (recalc = `setEdges` diretto dentro `handleAutoLayout`; sync = `scheduleFlush` rAF successivo), il caso normale è: recalc scrive live-correct → flush conserva → cache aggiornata a corretto. Non è il "cache vince sempre" ipotizzato.
- **Correzione all'inventario §3** della discovery `m1-side-selection`: la riga "Sync incrementale (edge esistente) → preserva handle da cache → No (congela)" è **incompleta/fuorviante**: il preserve `:1259-1260` è annullato a valle da `:1353-1354`. Il "congelamento a grid" osservato **non** viene da questo ramo, ma dal fatto che **grid è l'unico lato mai calcolato** (H2): non esiste un handle corretto concorrente da preservare.

---

## 3. Inventario trigger scelta-lato — aggiornamento post-Step B (correzione §3 di m1-side-selection)

| Percorso | Funzione | file:line | Ri-sceglie il lato? | Nota S4b |
|----------|----------|-----------|---------------------|----------|
| Full build (mount) | `jjomEdgeToRFEdge`→`computeOptimalHandles` | `useJjomSync.ts:1076` | Sì, su posizioni correnti | **Ma NON contiene gli edge M1** (commit differito) nel flusso trasformazione |
| Sync incrementale (edge **nuovo**) | `jjomEdgeToRFEdge` (`addedEdges`) | `useJjomSync.ts:1162-1184` | Sì, su posizioni **del momento** | Qui nascono `father`/`mother`; se ELK non ha ancora mosso i nodi → grid |
| Sync incrementale (edge **esistente**) | `jjomEdgeToRFEdge` + preserve | `useJjomSync.ts:1254-1263` → patch `:1348-1385` | **Preferisce l'handle LIVE di RF** (`:1353`), non la cache | ⚠️ **correzione H3**: NON congela un recalc corretto |
| onInit (justCreated) | **`handleAutoLayout`** (recalc Step B + `applyDistribution`) | `EditorV2.tsx:342-346` → `handleAutoLayout` `:2818` | **Sì (recalc Step B)** | ⚠️ ma su `getEdges()` **senza edge M1** se questi arrivano >50 ms dopo (H2) |
| onInit (non-justCreated) | `applyDistribution` | `EditorV2.tsx:354` | No (re-index) | invariato |
| Drag nodo / segmento | `computeAnchorsWithHysteresis` | `EditorV2.tsx:2995` / `:3164` | Sì | il :498 self-match (edge `instanceRef`) resta pendente per il drag (prompt separato) |

---

## 4. Snippet `[S4B]` per la conferma in-app (NON applicato al sorgente)

Da incollare temporaneamente (rimuovere prima di qualsiasi commit). Obiettivo: disambiguare H2 e confermare la refutazione di H1, misurando **cosa vede `handleAutoLayout` e quando arrivano gli edge M1**.

**(a) EditorV2 — ingresso di `handleAutoLayout`** (`EditorV2.tsx`, prima riga di `handleAutoLayout`, ~:2819):
```ts
const _e = getEdges();
console.log('[S4B] handleAutoLayout ENTRY', performance.now().toFixed(0),
  'nodes', getNodes().length, 'edges', _e.length,
  'M1ids', _e.filter(e => e.type === 'instanceRef' || e.type === 'composition').map(e => e.id),
  'father/mother sides', _e.filter(e => /father|mother/i.test(String(e.data?.referenceName ?? e.label ?? '')))
      .map(e => `${e.id}:${e.sourceHandle}->${e.targetHandle}`));
```
**(b) EditorV2 — subito dopo il recalc** (dentro `handleAutoLayout`, dopo `applyDistribution(recomputed)` nel `setEdges`): logga gli stessi id `father`/`mother` con i lati post-recalc + `performance.now()`.

**(c) useJjomSync — full build** (`:1097`, prima di `setEdges(rfEdgesToSet)`): `console.debug('[S4B] fullBuild', performance.now().toFixed(0), 'edges', rfEdgesToSet.length, 'M1', rfEdgesToSet.filter(e=>e.type==='instanceRef'||e.type==='composition').map(e=>e.id));`

**(d) useJjomSync — sync incrementale, edge aggiunto** (`:1184`, prima di `addedEdges.push(rfEdge)`): `console.debug('[S4B] addEdge', performance.now().toFixed(0), rfEdge.id, rfEdge.type, rfEdge.sourceHandle, '->', rfEdge.targetHandle);`

**(e) useM1ReferenceEdges — creazione** (`:167`, dentro il `for` di `toCreate`): `console.debug('[S4B] M1RefEdge.create', performance.now().toFixed(0), srcV, '->', tgtV);`

**Lettura del risultato:**
- Se in (a) `edges`/`M1ids` **non contiene** gli edge `father`/`mother`, o (d) `addEdge` per `father`/`mother` ha timestamp **> (a)** → **H2 confermata** (il layout gira prima degli edge M1).
- Se (a) li contiene con lati grid, (b) li mostra corretti, ma a render stabilizzato tornano grid → riaprire H3 e loggare (c/d) i flush successivi (il ramo `:1353` dovrebbe però preservare il live).
- (c/d/e) sono in critical-zone → `console.debug` temporanei, rimossi prima di ogni commit (§3.3/§3.1). (a/b) sono in EditorV2 (fuori critical-zone).

> Test d'integrazione automatico **non praticabile** qui: la pipeline richiede jsdom+RF+Redux+timer reali; l'ambiente vitest è `node` senza jsdom e l'import di questi file lancia `window is not defined`. La conferma è in-app.

---

## 5. Punti d'aggancio per il fix S4b (con invasività e critical-zone)

Il fix deve garantire che la **scelta-lato giri quando gli edge M1 sono presenti nello stato RF a valle del layout**, non entro la finestra fragile di 50 ms.

| # | Leva | Dove | Critical-zone / LIR | Invasività | Rischi |
|---|------|------|---------------------|-----------|--------|
| **1 (raccomandata)** | **Recalc reattivo agli edge M1**: in `EditorV2`, quando compaiono nuovi edge non-pinnati dopo il layout (osservando la crescita di `getEdges()` / un segnale da `useM1ReferenceEdges`), ri-eseguire `computeGeometricAnchorsForAllEdges` sulle posizioni correnti (stesso helper di Step B) e `applyDistribution`. Idempotente (se i lati sono già corretti, no-op). | `EditorV2.tsx` (+ eventuale segnale da `useM1ReferenceEdges`) | **No** se resta in EditorV2 (osservare edge count / evento) → LIR not-required; **Sì** se si legge/scrive `rfEdgeCache` → LIR obbligatorio | media | loop di re-render (debounce/guard su "già corretto"); non ri-lateralizzare edge pinnati o inheritance; R2 waypoint |
| **2** | **Ritardare/re-innescare `handleAutoLayout`** finché gli edge M1 non sono materializzati (invece dei 50 ms fissi): attendere che `getEdges()` contenga gli edge attesi (o un tick dopo `useM1ReferenceEdges`). | `EditorV2.tsx:340-346` | **No** (EditorV2) → LIR not-required | bassa/media | rischio che l'attesa non termini se nessun edge M1 esiste (serve timeout di fallback); doppio ELK se re-innescato |
| **3 (sconsigliata)** | Far sì che il full build **non** parta prima del commit degli edge M1, o che la sync incrementale calcoli i lati sulle posizioni ELK e li **scriva in `rfEdgeCache`**. | `useJjomSync.ts` (`:1034-1108`, `:1154-1186`, `rfEdgeCache`) | **Sì** → **LIR obbligatorio in Fase 2**; **niente TRANSACTION vicino al sync** (§3.3) | alta | R1 re-render cascade; ordinamento effetti; congelamento cache |

**Raccomandazione**: **Leva 1** (recalc reattivo in EditorV2, fuori critical-zone), riusando `computeGeometricAnchorsForAllEdges` già introdotto in Step B — è l'estensione naturale di Step B dal solo `handleAutoLayout` al momento in cui gli edge M1 arrivano. Se l'implementazione dovesse toccare `rfEdgeCache` o la sync (per far "aderire" i lati alla cache), si entra in critical-zone §3.1 → LIR obbligatorio e nessuna TRANSACTION sync-adjacent.

---

## 6. Onestà intellettuale / limiti

- **H1 refutata** e **H3 corretta**: provate staticamente su righe citate (timeline ProjectEditor + `useJjomSync:615/625/1257-1263/1348-1385` + `EditorV2:340-346`).
- **H2 confermata per costruzione** fino al confine dei 50 ms (il full build non può contenere edge a commit differito); l'esito **entro** quella finestra è timing-dipendente → conferma in-app con lo snippet `[S4B]` (§4). Non riprodotto in-app in questa sessione (nessun runtime disponibile; integration test non praticabile — vitest `node`/no-jsdom).
- Assunzione da confermare: che il commit di `DVoidEdge.new2`/`setValueAtPosition` sia differito (`setTimeout(0)`), come da discovery `2026-07-07-identity-name-decoupling`. Se fosse sincrono, il full build vedrebbe gli edge M1 e H2 si sposterebbe sul solo confine dei 50 ms — comunque una race, stesso fix.
- Nessun sorgente modificato; nessuna strumentazione applicata/committata (snippet `[S4B]` fornito come testo).

## HARD STOP

Fine del documento. Nessuna modifica a sorgente. Il fix S4b (Leva 1 raccomandata) parte **solo** dopo go-ahead esplicito con prompt separato; se toccherà `rfEdgeCache`/sync → LIR obbligatorio.

## Riferimenti

- `docs/discovery/2026-07-07-m1-side-selection.md` (§3 inventario trigger: **corretto qui** — righe onInit/ELK e sync-incrementale-esistente)
- `docs/discovery/2026-07-07-identity-name-decoupling.md` (commit differito CompositeAction `setTimeout(0)`)
- `docs/discovery/2026-07-06-anchor-ordering-manhattan.md` (rischi R1–R6; R1 re-render cascade)
- CLAUDE.md §3.1 (critical-zone), §3.3 (no TRANSACTION sync-adjacent), §3.5 (Step 4 / `useM1ReferenceEdges`), §5.1 (riprodurre prima; consumatori load-bearing)
- Fuori scope: fix `:498` self-match (percorso drag, prompt separato), S6, S2, commit generale

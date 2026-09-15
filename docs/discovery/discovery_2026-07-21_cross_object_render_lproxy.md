# Discovery: render multi-hop cross-oggetto vuoto sotto backend lproxy (Fase 1 read-only)

Data: 2026-07-21. Sessione read-only su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl` @ `ba47ae7bc`. Nessun file sorgente modificato, nessun commit. HARD STOP a report scritto.

## Obiettivo

Il finding smoke in-app 2026-07-21 (spec v1.2 sez. 9, primo test discriminante del cross-oggetto) mostra che **nessuna** label multi-hop `$ref.value.$attr.value` rende: solo il terminale `$ref.value` rende, e rende il **nome intrinseco** del target, non l'attributo. La reattività cross-oggetto (opzione d) è GIA' committata (`d4d451676`, `irCrossDeps.ts`), ma non è osservabile perché non c'è alcun valore reso da invalidare. Il cantiere si riapre sul **render**.

Serve: (1) sito esatto e meccanismo della perdita, (2) l'asimmetria render/reattività che la causa, (3) superficie dei consumatori per dimensionare il fix, (4) opzioni di fix con perimetro e critical-zone, (5) strategia test + criterio di accettazione, (6) domande aperte per la ratifica prima della Fase 2.

## File letti (integrali salvo dove indicato)

- `CLAUDE.md` (NON-NEGOZIABLE; §3.1 critical zone; §5 discovery; §5.1 sub-rule "verify consumers" e "do not trust fixtures from memory")
- `docs/discovery/discovery_2026-07-20_cross_object_reactivity.md` (F2 aveva già annotato la limitazione lproxy come nota per il fix)
- `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (sez. 9 reattività/dependency set; sez. 12 nota ReadCtx dual backend, default lproxy)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (integrale — `parsePathExpr`, `compilePath` + accessor, emissione crossPaths, `compileOperand`/`compilePredicate`)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` (integrale — interfaccia `ReadCtx`, `findFeatureRaw`, `makeDrawReadCtx`)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtxLproxy.ts` (integrale — `makeLproxyReadCtx`, `makeReadCtx`, `IR_READ_BACKEND`)
- `frontend/src/components/editor-v2/viewpoint/ir/irCrossDeps.ts` (integrale — `resolveCrossDeps`, registry passivo)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (:172-204, workaround `toId` sugli endpoint object-as-edge)
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` (:405-431, test che simula il backend lproxy sugli endpoint edge)
- Grep di superficie: costruzione `ReadCtx`, impl di `ReadCtx`, consumatori `getValue`/`getValues` (risultati in F3)

## Findings

### F1. Sito esatto e meccanismo: accessor di `compilePath`, ramo hop di navigazione

L'unico consumatore che tratta un valore letto come **puntatore di navigazione** è l'accessor compilato in `compilePath` (`irCompile.ts:107-124`), ramo hop non-terminale (`:116-121`):

```ts
if (step.take === 'values') out = ctx.getValues(currentId, step.feature);      // :113
else if (typeof step.take === 'number') out = ctx.getValues(...)[step.take];   // :114
else out = ctx.getValue(currentId, step.feature);                             // :115
const isLast = i === steps.length - 1;
if (!isLast) {                                                                // navigation hop
    if (typeof out !== 'string') return undefined;                           // :119
    currentId = out;                                                         // :120
}
```

`out` è letto attraverso `ctx`, che a render-time è il backend **attivo**. Il default è `lproxy` (`irReadCtx.ts:15`, `IR_READ_BACKEND = 'lproxy'`; il render costruisce sempre `makeReadCtx` → lproxy: `irResolve.ts:83`, `useIRContainment.ts:122`, `EditorV2.tsx:164`).

Sotto lproxy, `getValue(transitionId, 'src')` esegue `lObj.$src.value` (`irReadCtxLproxy.ts:22-31`). Per uno slot **reference**, `.value` restituisce il **nome/proxy del target** (`"State_0"` nello smoke), **non** il pointer id. Traccia sul caso rotto `$src.value.$isInitial.value` (Transition → State):

1. hop 0 (`src`, non-terminale): `out = "State_0"` (nome, non id). Il check `typeof out !== 'string'` **passa** (è una stringa), quindi `currentId = "State_0"`.
2. hop 1 (`isInitial`, terminale): `getValue("State_0", 'isInitial')` → `LPointerTargetable.fromPointer("State_0")` fallisce (non è un id) → catch → `draw.getValue("State_0", ...)` → `idlookup["State_0"]` è `undefined` → `undefined`.
3. Label vuota. Coerente con TUTTE le forme multi-hop dello smoke (vuote).

Il terminale single-hop `$src.value` rende `"State_0"` perché `steps.length === 1`: `isLast` è vero al passo 0, il ramo di navigazione (`:117-121`) **non** viene mai raggiunto, e `out` (il nome/proxy) è reso direttamente come testo. Nessun bug nel single-hop; il bug è **solo** la navigazione inter-hop.

Sotto backend `draw`, `getValue` → `findFeatureRaw` → `values[0]` = **pointer id** (`irReadCtx.ts:78-82`): al passo 1 `currentId` è un id valido e la catena naviga. **Il fix diagnostico del finding (settare `IR_READ_BACKEND='draw'` e ri-probe) è quindi confermato per costruzione** — draw renderebbe. Resta utile come sanity check live, ma non è un blocco.

### F2. L'asimmetria che causa tutto: reattività naviga per id, render naviga per backend

La concretizzazione dei dep cross (reattività, già committata) e il render accessor navigano lo **stesso** chain di hop ma con semantica **diversa**:

| | Navigazione hop | Semantica | Risultato hop |
|---|---|---|---|
| **Reattività** `resolveCrossDeps` (`irCrossDeps.ts:89,96-97`) | `findFeatureRaw(idlookup, cur, feature)` → `toId(dv.values[N])` | **draw** (id per costruzione, indipendente dal backend) | pointer id corretto |
| **Render** `compilePath.fn` (`irCompile.ts:115,119-120`) | `ctx.getValue(currentId, feature)` | **backend attivo** (lproxy = nome/proxy) | nome/proxy, non id |

Il commento di `resolveCrossDeps` (`irCrossDeps.ts:60-64`) dichiara di "mirror the compiled accessor exactly" — **non è vero**: mirror-a la *forma* del walk (value→values[0], values[N], dead-end su whole-array), ma usa draw dove l'accessor usa il backend. La reattività fa la cosa giusta (id), il render no. Chiudere questa asimmetria È il fix. È anche la ragione strutturale per cui vale la pena estrarre la navigazione in un helper unico condiviso (Opzione A+ in §Fix), così render e reattività non possono più divergere.

Precedente identico già in codebase: il workaround `toId` di `irEdgeViews.ts:193-202` esiste esattamente perché lo stesso valore lproxy non è un id — ma copre solo il **risultato terminale** degli endpoint object-as-edge, non gli **hop intermedi** di `compilePath`.

### F3. Superficie dei consumatori: il fix ha un unico consumatore e due sole impl di ReadCtx

- **`ReadCtx` è prodotta solo da due factory**: `makeDrawReadCtx` (`irReadCtx.ts:77`) e `makeLproxyReadCtx` (`irReadCtxLproxy.ts:19`). Tutte le altre occorrenze `: ReadCtx` sono **parametri** di funzione (irEdgeViews, irResolveCore, irContainment, IRNodeContent, i tipi `CompiledAccessor`/`CompiledPredicate`/`CompiledConditional` in `irTypes.ts:258-260`) che *ricevono* una ReadCtx. Aggiungere un metodo all'interfaccia richiede impl solo nelle due factory.
- **Precedente di delega**: `makeLproxyReadCtx` già delega a draw per `getName`/`getMetaclassName`/`isKindOf` (`irReadCtxLproxy.ts:43-45`) — "identity and metaclass are structural, not value-coerced: the draw path is canonical". La risoluzione di una reference a id È strutturale nello stesso senso: lo stesso pattern di delega si applica pulito.
- **Unico consumatore di navigazione**: il grep dei `getValue`/`getValues` che vengono usati come pointer di hop dà **solo** `irCompile.ts:113-115`. Nessun altro sito naviga. Il fix ha blast radius 1.

### F4. Blast radius del render: solo multi-hop; single-hop e terminale invariati

- **Single-hop** (`steps.length === 1`): non entra mai nel ramo `:117-121`. Rendering byte-identico. È il caso comune (la stragrande maggioranza delle label default/custom).
- **Terminale** di un multi-hop: continua a usare `getValue`/`getValues` col backend attivo → rendering del valore attributo invariato (lproxy coercion su upperBound preservata dove oggi c'è).
- **Predicati e text-source multi-hop** (`compileOperand`/`compilePredicate` → stesso `fn`): oggi tutti degradano a `undefined` per lo stesso motivo. Il fix li rende funzionanti: è un cambio di comportamento **da sempre-undefined a valore reale** per qualunque viewpoint con predicato/testo multi-hop. Nessun progetto può oggi dipendere dal comportamento rotto (non ha mai reso nulla), ma va dichiarato.
- **Endpoint edge multi-hop** (raro): `cv.sourceExpr`/`targetExpr` sono accessor compilati → beneficiano dello stesso fix. Il `toId` terminale di `irEdgeViews:199` resta e resta corretto per il caso single-hop reference.

### F5. Domanda empirica aperta (§5.1 "do not trust fixtures from memory"): cosa restituisce davvero lproxy `.value` su una reference

Lo smoke mostra il terminale `$src.value` rendere `"State_0"` (una **stringa nome**). Il test `ir.test.ts:407-431` invece **simula** lproxy restituendo un **oggetto proxy** `{ id: v, __mockProxy: true }` (`:416-421`) — e `toId` ne estrae `.id`. Le due ipotesi (nome-stringa vs proxy-oggetto-con-id) sono in tensione e **non risolte empiricamente** in questa sessione read-only:

- Se `.value` = **stringa nome**: il render terminale mostra `"State_0"` (coerente con lo smoke), ma allora il `toId("State_0")` di `irEdgeViews:199` restituirebbe `"State_0"` (ramo stringa) e `vertexByObj.get("State_0")` fallirebbe → gli endpoint edge single-hop sotto lproxy **non** risolverebbero. Da verificare che gli edge object-as-edge rendano davvero sotto lproxy in un bed reale (lo smoke ha reso la Transition come *vertex*, non ha testato l'endpoint edge sotto lproxy).
- Se `.value` = **proxy con `.id`**: `toId` funziona per gli edge, ma il render terminale di un proxy come testo dovrebbe mostrare il nome solo se il proxy stringifica al nome. Il mock del test rifletterebbe la realtà.

**Il fix proposto è robusto a entrambe** (bypassa il valore lproxy e risolve per id via `findFeatureRaw`), quindi non è un blocco per la Fase 2. MA la risposta serve per: (a) scrivere un unit test lproxy **fedele** (il mock `{id,__mockProxy}` è un'ipotesi, non un fatto), e (b) capire se il workaround `toId` degli endpoint edge single-hop è oggi realmente esercitato/corretto. **Va pinnata in-app all'inizio della Fase 2** (loggare `typeof lObj.$src.value` e il valore su una reference reale).

## Opzioni di fix

Tutte additive, tutte nel modulo `ir/`, **nessuna** nella critical zone §3.1.

### Opzione A — metodo additivo `getRef` su ReadCtx (draw semantics), consumato solo dall'hop di navigazione (RACCOMANDATA base)

- `ReadCtx` guadagna `getRef(elementId, featureName, take): string | null` (o coppia `getRef`/`getRefs`) che risolve una reference a un **pointer id del target** con semantica draw, onorando `take`:
  - `'value'` → `toId(values[0])`
  - numero `N` → `toId(values[N])`
  - `'values'` (whole-array) su hop intermedio → dead-end (`null`), identico ad oggi e a `resolveCrossDeps` (`irCrossDeps.ts:95-98`).
- `makeDrawReadCtx` implementa via `findFeatureRaw` + `toId`.
- `makeLproxyReadCtx` **delega a draw** (`draw.getRef`), esattamente come già fa per `getName`/`getMetaclassName`/`isKindOf` (`irReadCtxLproxy.ts:43-45`).
- `compilePath` ramo `:117-120`: per l'hop non-terminale usa `currentId = ctx.getRef(currentId, step.feature, step.take)`; se `null` → `return undefined`. Il passo terminale resta invariato (getValue/getValues col backend attivo).
- Pro: minimo, backend-indipendente, un solo consumatore, mantiene l'accessor puro su `ReadCtx` (nessun threading di idlookup), riusa il pattern di delega esistente. Contro: allarga l'interfaccia (additivo; il `proxyCtx` del test fa `...base` e eredita il metodo gratis — nessuna rottura là).

### Opzione A+ — helper di navigazione unico condiviso da render e reattività (RACCOMANDATA se lo scope lo consente)

Come A, ma la logica del walk-hop è estratta in una funzione pura unica in `irReadCtx.ts` (es. `navigateRefHop(idlookup, currentId, feature, take): string | null`) usata **sia** da `getRef` (nuovo, render) **sia** da `resolveCrossDeps` (refactor additivo, behavior-preserving della reattività). Chiude strutturalmente l'asimmetria F2: render e reattività non possono più divergere sulla semantica di navigazione. Costo: tocca anche `irCrossDeps.ts` (estrazione, nessun cambio di comportamento). È una scelta di scope da ratificare (vale il file extra?).

### Opzione B — threading di `idlookup` nell'accessor (SCARTATA)

Passare `idlookup` all'accessor e chiamare `findFeatureRaw` direttamente (come `resolveCrossDeps`). Cambia la firma `CompiledAccessor`/`CompiledPredicate`/`CompiledConditional` (`irTypes.ts:258-260`) e ogni call-site. Blast radius molto più largo. Scartata.

## Perimetro (Opzione A / A+)

| File | Modifica | Critical zone |
|------|----------|---------------|
| `viewpoint/ir/irReadCtx.ts` | interfaccia `ReadCtx` + `getRef` (additivi); impl in `makeDrawReadCtx`; [A+] `navigateRefHop` estratto | no (modulo ir, solo letture D-layer) |
| `viewpoint/ir/irReadCtxLproxy.ts` | `makeLproxyReadCtx` delega `getRef` a draw | no |
| `viewpoint/ir/irCompile.ts` | ramo hop non-terminale usa `ctx.getRef` | no |
| `viewpoint/ir/irCrossDeps.ts` | **solo [A+]**: `resolveCrossDeps` chiama `navigateRefHop` (behavior-preserving) | no |
| `viewpoint/ir/__tests__/ir.test.ts` | test lproxy-simulante + test `getRef` su entrambi i backend | no |
| `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` | emendamento sez. 9/12: la navigazione hop è draw-semantic su entrambi i backend | doc |

Layer Impact Report: **not-required** (nessun file §3.1; solo letture del D-layer via `findFeatureRaw`; canvasToJjom/useJjomSync/portDistribution/VersionFixer non toccati).

## Strategia di test

**Attenzione (§5.1 "do not validate sorts by reading the comparator", analogo qui):** i test IR esistenti usano `makeDrawReadCtx` (`ir.test.ts:50,183,...`), sotto cui il multi-hop **già funziona oggi**. Un test draw NON cattura questo bug (passerebbe già ora). Il test deve esercitare la semantica lproxy o `getRef` direttamente:

1. **Test discriminante lproxy-simulante**: costruire un `proxyCtx` che, per uno slot reference, restituisce ciò che lproxy restituisce davvero (nome-stringa **e/o** proxy-oggetto — vedi F5, da pinnare in-app), e asserire che l'accessor multi-hop `$ref.value.$attr.value` naviga e rende l'attributo del target (oggi: `undefined`; post-fix: valore).
2. **Test diretto di `getRef`** su entrambi i backend: draw restituisce il pointer id; lproxy delega a draw → stesso pointer id (NON il nome). Casi: `'value'`, `values[N]`, feature assente → `null`, reference vuota → `null`, whole-array `'values'` hop → `null`.
3. **Non-regressione single-hop**: asserire che una label single-hop rende identica pre/post (nessun ingresso nel ramo di navigazione).

**Criterio di accettazione in-app (spec sez. 9, smoke discriminante del finding):**
- Transition resa come vertex con label `$src.value.$isInitial.value` → **rende** `isInitial` del target State (oggi vuota). Acceptance: la label mostra `true`/`false`, non vuoto.
- Editando `isInitial` sul target State (senza toccare l'osservatore) → la label si aggiorna. Questo esercita la reattività già committata, ora **osservabile** per la prima volta. Acceptance: cambio visibile senza re-selezione/re-mount dell'osservatore.

## Domande aperte per la ratifica (pre-Fase 2)

- **OQ-1 (scope A vs A+)**: estrarre `navigateRefHop` condiviso con `resolveCrossDeps` (A+, +1 file toccato, chiude l'asimmetria alla radice) oppure lasciare `resolveCrossDeps` invariato e solo aggiungere `getRef` (A, minimo)? Raccomando A+ salvo vincolo di minimalità.
- **OQ-2 (forma del metodo)**: singolo `getRef(elementId, feature, take)` con arg `take` (mirror di `resolveCrossDeps`) vs coppia `getRef`/`getRefAt(n)`? Raccomando il singolo con `take`.
- **OQ-3 (F5)**: pinnare in-app cosa restituisce lproxy `.value` su una reference (nome-stringa vs proxy) prima di scrivere il test lproxy-simulante. Blocca la *fedeltà del test*, non il fix.
- **OQ-4 (emendamento spec)**: sez. 9 o sez. 12 per il paragrafo "la navigazione hop è draw-semantic su entrambi i backend"? Propongo sez. 12 (nota ReadCtx), verbatim in Fase 2.
- **OQ-5 (multivalore intermedio)**: confermare che l'hop intermedio multivalore resta dormiente (dead-end su whole-array `'values'`), coerente con reattività Q6.2. Nessuna navigazione di array intermedi in v1.

## Riferimenti

- `docs/discovery/discovery_2026-07-20_cross_object_reactivity.md` (F2 — la limitazione lproxy era annotata come nota per il fix; opzione d committata in `d4d451676`)
- `docs/specs/spec_2026-07-18_ir_schema_v1_2.md` (sez. 9, sez. 12)
- Finding smoke in-app 2026-07-21 (materiale chat: probe Transition-vertex, tabella PathExpr→render)
- Siti codice: `irCompile.ts:107-124` (accessor, sito), `irReadCtxLproxy.ts:22-31,43-45` (lproxy + delega), `irReadCtx.ts:35-48,77-109` (findFeatureRaw, draw), `irCrossDeps.ts:66-108` (reattività, asimmetria), `irEdgeViews.ts:193-202` (toId precedente)

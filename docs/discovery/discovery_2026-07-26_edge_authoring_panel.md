# Discovery READ-ONLY — authoring panel per edge (verso E-ref)

**Data**: 2026-07-26
**Tipo**: discovery (Fase 1 del two-phase; READ-ONLY sul codice)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl`
**HEAD**: `420657f98` (E0 committato)
**Prerequisito working-tree pulito**: NON soddisfatto (WIP lane-separation + 2 report discovery pre-esistenti, estranei a E-ref). Alfonso ha autorizzato a procedere: la discovery è READ-ONLY, scrive solo questo report + l'entry di log.

## Obiettivo

Mappare la superficie di authoring IR esistente per progettare `EdgeAuthoringPanel` (natura reference-as-edge, E-ref) in chat, usando `RowAuthoringPanel` (R3) come template. Nessuna decisione: solo censimento con `file:riga`. Vincoli a valle già ratificati (addendum D5/D8): panel nuovo e snello, entry-point kind `edge` in `EnableIRPanel` con toggle di natura, `showIRTab` esteso a `edge`, matching reference = metaclasse sorgente + refName con target opzionale via `predicate`.

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx`
- `frontend/src/components/editors/views/ViewData.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (EdgeViewIR :163-191, RowViewIR :201-210, EdgeTermination :145-151, CompiledEdgeView :236-249)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`resolveEdgeView` :256-290)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (`decorateReferenceEdges` :113-139)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`compileEdgeView` :382-420)
- `frontend/src/components/ui/index.ts` (barrel export), `frontend/src/components/ui/ColorPicker/ColorPicker.tsx`

---

## Area 1 — `RowAuthoringPanel` come template

`RowAuthoringPanel.tsx` è il modello più vicino per `EdgeAuthoringPanel`: panel snello, un solo file, nessuna estensione di Vertex.

- **Props**: `{ view: LViewElement }` — solo la view selezionata (`RowAuthoringPanel.tsx:23-25`). Nessun `readonly`, nessun id sciolto.
- **Draft & clone**: seed via `clone((view as any).ir ?? defaultRowViewIR())` con `clone = JSON.parse(JSON.stringify(x))` (`:31`, `:52`). Draft in `useState<RowViewIR>` (`:54`), `error` in `useState`, `dirtyRef` in `useRef(false)` (`:55-56`).
- **Reset su cambio view**: `useEffect([view.id])` azzera `dirtyRef`, ri-seed, pulisce error, **senza** commit (`:59-64`).
- **Validate + commit debounced**: `useEffect([draft, view.id])` — se `!dirtyRef.current` ritorna; `validateIR(view.id, draft)` eager con `ErrorText` inline; se valido, `setTimeout(() => (view as any).ir = draft, COMMIT_DEBOUNCE_MS)` con `COMMIT_DEBOUNCE_MS = 300` (`:27`, `:67-77`). Il commit è un **whole-object replace** via il setter L-proxy `view.ir = draft` (→ SetFieldAction → dispatch → recompile → live preview). `patch(next)` setta `dirtyRef.current = true` e `setDraft` (`:79-82`).
- **Matching inline (NON `MatchingSection`)**: il row autora metaclassi/predicate/priorità direttamente (`:159-288`), perché `MatchingSection` è tipizzata `VertexViewIR` e porta `exclusive` (assente su `RowViewIR`). Vedi il commento esplicito `:47-50`.
  - metaclassi: checkbox wildcard `*` + lista con rimozione + `Select` "Aggiungi metaclasse…" (`:160-254`);
  - predicate: checkbox "Applica solo se" che semina `forPredicateKind('literal')` e, se disattivato, **droppa la KEY** (`const { predicate, ...rest } = draft`) per restare byte-identico a una view senza predicate (`:171-182`);
  - priorità: `NumberInput` (`:281-288`).
- **Feature resolution per PathBuilder**: `featureInfo` risolve la prima metaclasse **per identità** (pin del class-pointer da `appliableToClasses`, non per nome) e conta i metamodelli che dichiarano quel nome per segnalare ambiguità (`:89-140`). `classNames` (tutti i nomi classe del progetto) calcolato una volta per il selettore `isKind` del PredicateBuilder (`:147-157`).
- **Template**: `ListEditor<TextSource>` con add/remove/move/replace di segmenti, ciascuno reso da `TextSourceEditor` (`:184-308`).

**Per E-ref**: la struttura (seed→draft→patch→validate→debounce-commit) è riusabile 1:1. Il matching cambia: reference-as-edge aggiunge il campo `reference?: string` (assente su Vertex/Row). Il template diventa `edge.labels.center` (singolo `TextSource`, non lista). Lo stile diventa `edge.line` + `edge.terminations`.

---

## Area 2 — Entry-point (`EnableIRPanel` + `ViewData`)

### `EnableIRPanel.tsx`

- **`KIND_OPTIONS`** (`:8-11`): oggi solo `vertex` e `row`. Aggiungere un kind = aggiungere una option + estendere lo stato `kind` (oggi `useState<'vertex' | 'row'>('vertex')`, `:59`) + un ramo di seed in `enable()` (`:77-98`).
- **Seed**: `enable()` costruisce `rowSeed` (minimale: `metaclasses: []`, un segmento intrinsic-name) o `vertexSeed` (da `defaultObjectViewIR()` + metaclassi risolte da `appliableToClasses` con fallback `'*'`), valida con `validateIR`, poi scrive `(view as any).ir = seed` (`:80-98`).
- **`D_LEVEL_TYPES`** (`:21-24`): set di nomi D-level scartati da `resolveMetaclassNames` (`:33-45`) — solo i pointer M2 (DClass con nome) diventano `ir.metaclasses`. Per la natura reference l'entry-point deve risolvere la **metaclasse sorgente** allo stesso modo (riuso di `resolveMetaclassNames`), più — se la UI lo offre — il nome della reference.
- **Guard anti-reseed già presente** (`:61-73`): se `view.ir` esiste, il panel mostra un placeholder read-only e **non** ri-semina. Questo è il guard che impedisce di sovrascrivere un ir `edge` con un vertex-default. Estendendo il panel a `edge`, il guard continua a proteggere: appena `view.ir.kind === 'edge'` è scritto, EnableIRPanel non semina più.

### `ViewData.tsx`

- **`showIRTab`** (`:58`):
  ```ts
  const showIRTab = (ir?.kind === 'vertex') || (ir?.kind === 'row') || (isV && !ir && view.isEdge !== true);
  ```
  Nota critica sulla natura: l'authoring reference-as-edge **NON** vive su una DViewElement con `isEdge === true`. Il flag `view.isEdge` è il marker classico della *edge-view* jsxString; l'IR edge (`ir.kind === 'edge'`) si autora su una view normale (non-edge), esattamente come vertex/row. Il ramo `(isV && !ir && view.isEdge !== true)` che mostra `EnableIRPanel` copre già le view normali; per abilitare l'authoring edge basta aggiungere `(ir?.kind === 'edge')` alla disgiunzione, **senza toccare** la clausola `view.isEdge !== true`. (Confusione da evitare: `view.isEdge` ≠ `ir.kind === 'edge'`.)
- **Routing del tab IR** (`:81-100`): oggi `ir?.kind === 'vertex' → VertexAuthoringPanel`, `'row' → RowAuthoringPanel`, altro-ir → placeholder read-only, nessun-ir → `EnableIRPanel`. Per E-ref: aggiungere il ramo `ir?.kind === 'edge' → <EdgeAuthoringPanel view={view} />` **prima** del placeholder. Il placeholder `:90-96` cattura oggi anche `edge`: va anticipato il ramo dedicato.
- Il default `D_LEVEL_TYPES` e `resolveMetaclassNames` sono duplicati anche nel `featureInfo` dei panel (identity-pinning), non solo in `EnableIRPanel` — nessuna estrazione condivisa oggi; non è un rischio, solo ridondanza nota.

**Rischio "D_LEVEL_TYPES duplicato"**: `D_LEVEL_TYPES` è definito una sola volta (`EnableIRPanel.tsx:21`). Non c'è duplicazione da bonificare; l'unica ridondanza è la logica di identity-pinning replicata tra i due panel (accettabile, fuori scope).

---

## Area 3 — `MatchingSection`

- **Props/tipo** (`MatchingSection.tsx:14-20`): `{ draft: VertexViewIR; patch: (next: VertexViewIR) => void; features; featuresHint; classNames }`. Autora **metaclassi / predicate / priorità / `exclusive`** (`:78-158`).
- `exclusive` è specifico di `VertexViewIR`/`GraphVertexViewIR`; **anche `EdgeViewIR` ha `exclusive?`** (`irTypes.ts:170`), ma la nota UI `:157` avverte che le view decorative (`exclusive` off) non sono supportate dal resolver — semantica pensata per i nodi.
- `EdgeViewIR` (`irTypes.ts:163-191`) condivide con Vertex i campi `metaclasses / predicate / priority / exclusive`, **ma aggiunge `reference?: string`** (`:167`) che `MatchingSection` non conosce.

**Valutazione (censimento, non decisione)**: per il ramo **reference** conviene il **matching inline** come nel row (metaclasse sorgente + `reference` + predicate + priorità), perché il campo `reference` è estraneo a `MatchingSection` e la sua UI (picker della reference sulla metaclasse sorgente) non ha equivalente nel Vertex. Allargare `MatchingSection` a `EdgeViewIR` (via generics o union `VertexViewIR | EdgeViewIR`) sarebbe possibile per i 4 campi comuni ma non copre `reference`; resta un'opzione per il futuro ramo **object-as-edge** (che non ha `reference` e riusa 1:1 i 4 campi). Raccomandazione allineata a D5/D8: inline per reference ora; widening di `MatchingSection` valutabile per object dopo.

---

## Area 4 — Widget condivisi per il form di stile

Censimento in `components/ui/index.ts` (barrel):

- **`TextSourceEditor`** (`authoring/TextSourceEditor.tsx:5-12`): props `{ source: TextSource; onChange; features: PathBuilderFeatures | null; disabled?; disabledHint? }`. Gestisce i 3 rami `intrinsic | path | literal` con `Select` + (Input | PathBuilder). **Direttamente riusabile per `edge.labels.center`** (un solo `TextSource`, non lista): niente `ListEditor`, si passa `source={draft.edge.labels?.center ?? default}` e `onChange`.
- **`ColorPicker`** (`ui/ColorPicker/ColorPicker.tsx:4-18`): props `{ value: string (hex); onChange: (hex) => void; label?; disabled?; id? }`. Swatch nativo + campo hex sincronizzato. **Riusabile per `edge.line.color`** (scalare; per `Conditional<string>` si annida in `ConditionalEditor` come fa il Vertex per `fill`/`border`, `VertexAuthoringPanel.tsx:236-244`).
- **`Select`** (`ui/Select`): riusabile per `edge.line.style` (`solid|dashed|dotted` — stesse `BORDER_STYLE_OPTIONS` del Vertex, `VertexAuthoringPanel.tsx:24-28`) e per i **picker di terminazione** (vedi sotto).
- **`NumberInput`** (`ui/NumberInput`): riusabile per `edge.line.width` (scalare) e `priority`.
- **`ConditionalEditor`** (`ui/ConditionalEditor`): wrappa un valore scalare in when/then/else con PathBuilder — il pattern con cui Vertex autora `fill`/`form` condizionali (`VertexAuthoringPanel.tsx:222-245`). `edge.line.color/width/style` sono `Conditional<...>` (`irTypes.ts:175-179`), quindi lo stesso wrapping è appropriato.

**Picker di terminazione/marker — NON esiste** (grep in `authoring/` per `termination|Termination|EdgeTermination` → 0 risultati). Le 6 terminazioni `EdgeTermination` (`irTypes.ts:145-151`: `none | openArrow | closedArrow | hollowTriangle | filledDiamond | hollowDiamond`) non hanno oggi un widget dedicato. Il modo minimale è un `Select` con 6 option per `sourceEnd` e uno per `targetEnd` (nessun nuovo componente, nessuna dipendenza). Un picker grafico (anteprima marker) è possibile ma è scope decorativo, non necessario per E-ref.

---

## Area 5 — Resolver/predicate reference-as-edge (contesto di valutazione)

**Domanda chiave (D5): il predicate di una reference-as-edge vede l'oggetto TARGET del link?**
**Risposta: NO — il predicate è valutato sull'oggetto SORGENTE.**

Traccia end-to-end:
- `decorateReferenceEdges` (`irEdgeViews.ts:113-139`) calcola `srcObj = (e.data).irSourceObjectId ?? objByVertex.get(e.source)` (`:128`), ne legge `metaclassId = idlookup[srcObj].instanceof` (`:130`) e `refName = (e.data).referenceName ?? ''` (`:132`), poi chiama `resolveEdgeView(srcObj, metaclassId, refName, ...)` (`:133`). L'`evalId` passato a `applyEdgeStyle` è `srcObj` (`:136`).
- `resolveEdgeView` (`irResolveCore.ts:256-290`) valuta il predicate con **root = `sourceObjectId`**: `c.entry.compiled.predicate(readCtx, sourceObjectId)` (`:286`). Il primo argomento è l'oggetto sorgente del link.

**Conseguenza per il design D5 "target opzionale via predicate"**: il predicate radica sull'oggetto SORGENTE, non sul target. Per vincolare il target, l'autore deve scrivere un predicate che **naviga la reference dal sorgente** (path che attraversa `reference` fino al target), non un predicate che "vede" direttamente il target. Se la grammatica Predicate/PathExpr consente di navigare la reference nominata e leggere feature del target, allora "target via predicate" è realizzabile come *navigazione dal sorgente*; se non lo consente, D5 va rivisto. → **Domanda aperta #1**.

**Score della reference (+0.5)** (`irResolveCore.ts:269-281`):
```ts
const ref = e.compiled.reference;                 // :273
if (ref !== null && ref !== referenceName) continue;   // :274  filtro esatto sul nome reference
candidates.push({ entry: e, specificity: spec + (ref !== null ? 0.5 : 0) }); // :276
```
- Un edge view con `reference` valorizzato matcha **solo** quella reference (`ref === referenceName`) e guadagna **+0.5** di specificità sulle view senza `reference` (che matchano qualsiasi reference) nello stesso tier (`spec` = 2 esatto / 1 ereditato / 0 wildcard, `:279-281`).
- Il campo `reference` compilato viene da `compileEdgeView` (`irCompile.ts`) a partire da `ir.reference` (`irTypes.ts:167`).

**Per il panel**: autora `ir.reference` come **stringa = nome della reference** sulla metaclasse sorgente (assente/undefined = matcha qualsiasi reference, priorità minore). Il picker naturale è un `Select` popolato dalle `references` della metaclasse sorgente (le stesse `PathBuilderFeatures.references` già risolte dal `featureInfo`, `RowAuthoringPanel.tsx:132-134`).

---

## Area 6 — Seed / default

- **`defaultEdgeViewIR` NON esiste** (grep globale: solo `defaultObjectViewIR` e `defaultRowViewIR`, entrambi in `irDefaults.ts:30-69`). Va creato per seminare una edge view dal panel.
- **Come lo fa il row** (`irDefaults.ts:62-69`): `defaultRowViewIR()` ritorna `{ irVersion: 'ir-1.0', kind: 'row', metaclasses: '*', template: [{ from: 'intrinsic', prop: 'name' }] }`. Il seed dell'`EnableIRPanel` per row è ancora più minimale (`metaclasses: []`, `EnableIRPanel.tsx:80-85`).
- **Cosa servirebbe per edge** (natura reference, minimale coerente col compile-default): un `EdgeViewIR` con
  - `irVersion` (allineato alla versione usata dal compile; `defaultObjectViewIR` usa `'ir-1.2'`, `irDefaults.ts:32` — l'EdgeViewIR è sez. 7 v1.2 → `'ir-1.2'`),
  - `kind: 'edge'`,
  - `metaclasses: []` (l'autore imposta la metaclasse sorgente subito dopo, come il row),
  - `edge: {}` — con i default già applicati da `compileEdgeView`: `terminations.sourceEnd = 'none'`, `targetEnd = 'openArrow'` (`irCompile.ts:415-416`), `labelPlacement = 'auto'` (`:420`). Quindi il seed può lasciare `edge` vuoto e lasciare che il compile applichi i default; il panel poi popola `line`/`terminations`/`labels.center`.
  - **`reference` assente** nel seed (matcha qualsiasi reference finché l'autore non la restringe).
- **Nota validazione**: qualunque seed deve passare `validateIR(view.id, seed)` (come row/vertex, `EnableIRPanel.tsx:92-93`). Verificare che `irValidate` accetti già `kind: 'edge'` (fuori dai file letti in questa discovery → **Domanda aperta #2**).

---

## Proposta di fasizzazione E-ref (reference-as-edge)

Ordine suggerito, ogni fase piccola e verificabile, sul modello R1→R3:

- **E-ref/1 — scaffold `EdgeAuthoringPanel` (solo reference)**: nuovo file `authoring/EdgeAuthoringPanel.tsx`, props `{ view }`, ciclo seed→draft→patch→validate→debounce-commit copiato da `RowAuthoringPanel`. Sezioni: matching inline (metaclasse sorgente + `Select` reference + predicate + priorità), stile linea (`ColorPicker`+`NumberInput`+`Select` via `ConditionalEditor`), terminazioni (2 × `Select` su `EdgeTermination`), label center (`TextSourceEditor` singolo). Nessuna modifica ai file esistenti in questa fase (panel isolato, non ancora instradato).
- **E-ref/2 — `defaultEdgeViewIR` + entry-point**: aggiungere `defaultEdgeViewIR()` in `irDefaults.ts`; aggiungere kind `edge` a `KIND_OPTIONS` + toggle natura (object/reference, ma object stub) + ramo seed in `EnableIRPanel.enable()`; estendere `ViewData.showIRTab` con `(ir?.kind === 'edge')` e il routing `ir?.kind === 'edge' → EdgeAuthoringPanel` (prima del placeholder). Verificare `validateIR` su `kind: 'edge'`.
- **E-ref/3 — collaudo end-to-end**: snippet che semina una edge view su una metaclasse sorgente reale, imposta colore/terminazione/reference, e verifica che `decorateReferenceEdges` → `applyEdgeStyle` → UnifiedEdge (gated branch E0) rendano stroke/marker/label. HARD STOP visivo.
- **(Futuro) E-obj**: natura object-as-edge (source/target PathExpr, hiding del nodo) — riusa il panel con sezione endpoint; qui `MatchingSection` widening diventa valutabile (niente `reference`).

## Domande aperte per Alfonso

1. **Target via predicate (D5)**: il predicate reference-as-edge radica sul SORGENTE (`irResolveCore.ts:286`), non sul target. Vuoi che il vincolo sul target sia espresso come *navigazione della reference dal sorgente* nel predicate (se la grammatica PathExpr lo consente attraverso la reference nominata), oppure serve un meccanismo dedicato "predicate sul target"? La risposta decide la UI della sezione matching.
2. **`validateIR` su `kind: 'edge'`**: va confermato (file non letto in questa discovery) che il validator accetti già un `EdgeViewIR` seminato, altrimenti E-ref/2 include un tocco a `irValidate`.
3. **Terminazioni — `Select` vs picker grafico**: per E-ref/1 basta un `Select` a 6 voci per end (nessun nuovo componente), oppure vuoi un picker con anteprima del marker (scope decorativo aggiuntivo)?
4. **`exclusive` sugli edge**: `EdgeViewIR` ha `exclusive?` ma la semantica "decorativa" non è supportata dal resolver (nota `MatchingSection.tsx:157`). Lo esponiamo nel panel edge (coerenza col Vertex) o lo omettiamo finché non ha effetto?

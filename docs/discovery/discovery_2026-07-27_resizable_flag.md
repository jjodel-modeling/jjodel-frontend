# Discovery 2026-07-27 — flag `resizable` sulle vertex view IR + gate rect/rounded

> **Fase 1 di un two-phase. Read-only.** Nessun edit al codice di feature, nessun commit.
> Questo report mappa i punti d'innesto reali e valuta il rischio di persistenza (Q5) del
> nuovo campo opzionale `resizable?: boolean` su `VertexViewIR`. L'implementazione e' Fase 2.

## Obiettivo

1. Confermare la root cause del punto 1 (rect/rounded senza maniglie di resize) sui `file:riga`
   reali del branch `alfonso-frontend-jjtl`.
2. Mappare i punti d'innesto per un campo **opzionale** `resizable?: boolean` su `VertexViewIR`:
   read path (Q1), schema (Q2), compile (Q3), validate (Q4), persistenza/round-trip (Q5),
   pannello authoring (Q6), parametri resizer + CSS floor (Q7).
3. Verdetto sul rischio Q5: il campo sopravvive al ciclo compile / validate / save / reload?

## File letti / analizzati

- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR, gate resize)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (`isNodeResizable`, `NODE_SIZING_DEFAULTS`, `SHAPE_MIN_SIZE`)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`VertexViewIR`, `ShapeForm`, `ShapeSpec`, `CompiledView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`compileView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (`validateIR`)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolve.ts` (`IRViewResolution`, `useIRView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (`defaultObjectViewIR`, `isMigratedDefaultView`)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (regole `ir-shape--*`)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (write path, memo feature-picker)
- `frontend/src/view/viewElement/view.tsx` (`get_ir`/`set_ir`, `updateDefaultView` carry-over)
- `frontend/src/components/editor-v2/EditorV2.scss` (floor `.mm-node` / `.mm-object`)

---

## RCA confermata (punto 1: rect/rounded senza resize)

`ObjectNode.tsx` ramo IR, verbatim (`:373-374`):

```ts
const shapeForm = irResolution.compiled.form(irResolution.readCtx, irResolution.objectId);
const hasGeometricShape = shapeForm === 'ellipse' || shapeForm === 'circle' || shapeForm === 'diamond';
```

Gate (`ObjectNode.tsx:380`):

```ts
{isNodeResizable('objectNode', hasGeometricShape) && (
    <NodeResizer ... />
)}
```

`hasGeometricShape` enumera solo `ellipse`/`circle`/`diamond`; `rect` e `rounded` cadono a `false`.
`isNodeResizable('objectNode', false)` (`nodeSizing.ts:22-27`) ritorna `false` perche'
`NODE_SIZING_DEFAULTS.objectNode = { adaptWidth: true, adaptHeight: true }` (`nodeSizing.ts:9`):
`!adaptWidth || !adaptHeight` = `false`. Quindi il `NodeResizer` non viene montato. **Confermato: non e' CSS, e' il gate.**

`shape.form` default a `'rect'` in compile (`irCompile.ts:262`), quindi ogni box a compartimenti ha
`form='rect'`: aggiungere rect/rounded a `hasGeometricShape` rimonterebbe il resizer su tutti i box
content-hug. Serve il segnale esplicito `resizable`. Confermata la premessa del prompt.

---

## Q1 — Accesso alla view risolta in ObjectNode

`irResolution` ha tipo **`IRViewResolution`** (`irResolve.ts:32-36`), verbatim:

```ts
export interface IRViewResolution {
    compiled: CompiledView;
    objectId: string;
    readCtx: ReadCtx;
}
```

Costruito da `useIRView` (`irResolve.ts:47`, chiamato in `ObjectNode.tsx:49`):
`return { compiled, objectId, readCtx };` (`irResolve.ts:94`).

**Non** espone un campo top-level con la view grezza. MA `CompiledView.ir` **e' la `VertexViewIR`
grezza risolta**, memorizzata verbatim dal compile:

- `irTypes.ts:281`: `ir: AnyViewIR;` (campo dell'interfaccia `CompiledView`).
- `irCompile.ts:334-349`: l'oggetto `compiled` include `ir,` (`:335`) — cioe' **lo stesso oggetto
  `ir` passato a `compileView`, non una copia filtrata**.

Quindi la view grezza (con eventuale `.resizable`) e' raggiungibile in Fase 2 come:

```ts
irResolution.compiled.ir            // tipo AnyViewIR; per una vertex e' VertexViewIR
```

**Nome esatto del campo da usare in Fase 2**: `irResolution.compiled.ir`.
`compiled.ir` e' tipato `AnyViewIR` (union): per leggere `.resizable` (che vive su `VertexViewIR`)
serve un cast/narrowing, es. `(irResolution.compiled.ir as VertexViewIR).resizable`.

**Conseguenza importante per Q3**: poiche' `compiled.ir` conserva l'oggetto grezzo intatto, il read
path NON dipende dal compile. Un nuovo campo `resizable` sopravvive su `compiled.ir` anche se il
compile non lo whitelista. Q3 quindi **non e' un blocco** (dettaglio sotto).

Due opzioni per il read path in Fase 2:
- **Opzione A (minima, nessuna modifica al compile)**: `(irResolution.compiled.ir as VertexViewIR).resizable`.
- **Opzione B (piu' pulita, tipizzata)**: aggiungere `resizable?: boolean` a `CompiledView`
  (`irTypes.ts:280`) e valorizzarlo in `compileView` (`irCompile.ts:334`); leggere
  `irResolution.compiled.resizable`. Costo: tocca `irTypes.ts` + `irCompile.ts` in piu'.

Raccomandazione: **Opzione A** (rispetta lo scope minimale; il campo e' un boolean semplice, non
un `Conditional`, quindi non c'e' guadagno reale nel comporlo in compile).

---

## Q2 — Schema `VertexViewIR`

`irTypes.ts:100-111`, verbatim:

```ts
export interface VertexViewIR {
    irVersion: string;               // "ir-1.0" | "ir-1.2"
    kind: 'vertex';
    /** Metamodel metaclass names, or '*' (default-view wildcard: minimum specificity). */
    metaclasses: string[] | '*';
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;             // spike: only exclusive views are rendered; decorative ones are ignored
    label?: string;
    shape: ShapeSpec;
    fieldCompartments?: FieldCompartmentSpec[];
}
```

`ShapeForm` (`irTypes.ts:38`), verbatim: **conferma `circle` e `diamond` inclusi**:

```ts
export type ShapeForm = 'rect' | 'rounded' | 'ellipse' | 'circle' | 'diamond';
```

**Nessun campo `resizable`/`resize`/`sizing`/`size`/`width`/`height` pre-esistente** su `VertexViewIR`.
Grep `resizable` sull'intero `viewpoint/`: **zero occorrenze**. Gli unici match `width`/`height` in
`irTypes.ts` sono `border.width` (`:95`, `:297`) e `edge.line.width` (`:177`) — semanticamente
distinti, nessuna collisione. `resizable` e' un nome nuovo e sicuro (verificato §4.3 CLAUDE.md).

**Punto esatto dove aggiungere** `resizable?: boolean` in Fase 2: dopo `exclusive?`/`label?`
(`irTypes.ts:107-108`), come proprieta' top-level opzionale (consentito da CLAUDE.md — aggiunta di
proprieta' opzionale). Coerente col design ratificato (boolean semplice, non `Conditional`).

**Riuso del tipo**: `VertexViewIR` compare in `NodeViewIR = VertexViewIR | GraphVertexViewIR`
(`irTypes.ts:212`) e `AnyViewIR` (`:213`). `GraphVertexViewIR` (`:121-143`) e' un'interfaccia
separata e **non** erediterebbe `resizable`. Nota di scope (vedi Q6/Domande aperte): i graphVertex
renderizzano attraverso lo stesso ramo IR di `ObjectNode` (`compiled.kind === 'graphVertex'`); con
`resizable` solo su `VertexViewIR`, un graphVertex legge `undefined` → fallback a `hasGeometricShape`
(comportamento di oggi, backward-compatible). Decisione se estenderlo a graphVertex: aperta.

---

## Q3 — Compile (`irCompile.compileView`)

`compileView(viewId, ir)` (`irCompile.ts:253`) costruisce `CompiledView` da una **whitelist** di
campi (NON passthrough dei campi ignoti). L'oggetto risultante (`irCompile.ts:334-349`) elenca
esplicitamente `viewId, ir, kind, containment, priority, predicate, dependencySet, crossPaths, form,
fill, border, labels, badges, fieldCompartments`. Un nuovo campo top-level di `VertexViewIR` **non**
diventa automaticamente una proprieta' top-level di `CompiledView`.

**MA** l'oggetto grezzo e' conservato intatto: `irCompile.ts:335` include `ir,` — cioe'
`compiled.ir === ir` (referenza allo stesso oggetto passato). Quindi `resizable` **e' comunque
leggibile via `compiled.ir.resizable`** anche senza toccare il compile. → **Q3 non e' un blocco.**

Pattern di default del `form` (per replica, se si scegliesse l'Opzione B) — `irCompile.ts:262`:

```ts
const form = compileConditional(ir.shape.form, 'rect' as const, deps);
```

`form` e' un `Conditional<ShapeForm>` compilato con fallback `'rect'`. `resizable` invece e' un
boolean piano: **NON** userebbe `compileConditional`. Se si sceglie l'Opzione B, il punto esatto e'
il literal `compiled` (`irCompile.ts:334`), aggiungendo p.es.:
`resizable: (ir as VertexViewIR).resizable`. La cache e' su `(viewId, irHash(ir))` (`:254`, `:247`):
poiche' `resizable` fa parte dell'`ir` serializzato da `irHash` (`JSON.stringify`, `:245`), una
modifica al flag invalida correttamente la cache (nuovo hash → ricompilazione).

**Verdetto Q3**: con l'Opzione A (read via `compiled.ir`), il compile **non va toccato**.

---

## Q4 — Validazione (`irValidate.validateIR`)

`validateIR` (`irValidate.ts:16-25`), verbatim:

```ts
export function validateIR(viewId: string, ir: AnyViewIR): { ok: true } | { ok: false; error: string } {
    try {
        if (ir.kind === 'edge') compileEdgeView(viewId, ir as EdgeViewIR);
        else if (ir.kind === 'row') compileRowView(viewId, ir as RowViewIR);
        else compileView(viewId, ir);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}
```

Non c'e' schema/whitelist che **rifiuta** campi non previsti: `validateIR` si limita a invocare il
compile e cattura le eccezioni. `compileView` legge solo i campi noti e **ignora** i campi ignoti
(non li valida ne' li rigetta). Quindi `resizable?: boolean` **passa la validazione senza errori**
e **non** serve un ramo esplicito per `resizable`. (Anche un valore non-boolean non lancerebbe: non
viene mai letto dal compile — se in Fase 2 si vuole rigore, la validazione del tipo va aggiunta
esplicitamente, ma non e' richiesta dal design.)

---

## Q5 — Round-trip / persistenza / preserve-verbatim (il punto critico)

**Verdetto: SI', il campo sopravvive al giro save → reload (condizionato a una nota di rendering,
non di perdita dati).** Catena di prove:

1. **Seed del draft dal `view.ir` intero** — `VertexAuthoringPanel.tsx:48`:
   ```ts
   const seed = (): VertexViewIR => clone((view as any).ir ?? defaultObjectViewIR());
   ```
   `clone` (`:35`) e' `JSON.parse(JSON.stringify(x))` — lossless su JSON puro. Se `resizable` e'
   presente nel `view.ir` persistito, viene preservato nel draft.

2. **Commit dell'intero draft** — `VertexAuthoringPanel.tsx:70-74`:
   ```ts
   const t = setTimeout(() => {
       (view as any).ir = draft;   // whole-object replace via set_ir
   }, COMMIT_DEBOUNCE_MS);
   ```
   Docstring del pannello (`:44-46`), verbatim: *"Fields not edited here (extra labels, compartments,
   badges, any Conditional) round-trip verbatim because the whole cloned ir is written back."*

3. **`set_ir` scrive l'oggetto intero** — `view/viewElement/view.tsx:483-484`, verbatim:
   ```ts
   get_ir(c: Context): this["ir"] { return c.data.ir; }
   set_ir(val: this["ir"], c: Context): boolean { return SetFieldAction.new(c.data, "ir", val as any, '', false); }
   ```
   `SetFieldAction.new(c.data, "ir", val, '', false)` → sostituzione **whole-object** del campo
   D-layer `ir`. Nessuna whitelist, nessuna ricostruzione da sottoinsieme.

4. **`ir` e' un campo oggetto puro, non un `jsxString`** — `view.tsx:481-482`, verbatim:
   ```ts
   ir?: GObject;
   __info_of__ir: Info = {type: 'GObject | undefined', txt: <div>ViewpointIR of the view (EditorV2 interpreter contract). Undefined for classic views.</div>};
   ```
   Non passa dal meccanismo `jsxString` (CLAUDE.md §3.9, che riguarda i template classici). E' un
   oggetto in `data.ir`, serializzato in JSON con il resto dello stato Redux al save. Un boolean
   piano `resizable` fa parte del JSON e viene ripristinato al reload.

5. **Carry-over su version-bump / rigenerazione default-view** — `view.tsx:1759-1762`, verbatim:
   ```ts
   // Preserve the IR contract fields across default-view regeneration
   // (VersionFixer 2.225 -> 2.226 inverse migration; spec v1.2 sez. 11):
   // without this carry-over the version bump would wipe the migrated `ir`.
   if ((v as any).ir !== undefined) (newView as any).ir = (v as any).ir;
   ```
   `updateDefaultView` (`view.tsx:1751`) riporta l'**intero** `ir` sulla view rigenerata: `resizable`
   sopravvive anche ai bump di versione. Non esiste nessuna migrazione che rigenera l'`ir` da un
   sottoinsieme di campi noti (verificato: il solo punto di ricostruzione lo copia whole).

**Nota di rendering (non e' perdita dati) — interazione con la delega default-view.**
`isMigratedDefaultView` (`irDefaults.ts:128-143`) decide se una view renderizza attraverso il ramo
nativo di `ObjectNode` invece dell'interprete IR. Confronto strutturale (`:136-139`), verbatim:

```ts
const structural: Record<string, unknown> = { ...ir };
delete structural.migratedFrom;
if (factoryHash === null) factoryHash = irHash(canonicalize(defaultObjectViewIR()) as VertexViewIR);
delegated = irHash(canonicalize(structural) as VertexViewIR) === factoryHash;
```

Se si imposta `resizable` su una view **migrated-default**, l'hash strutturale differisce dalla
factory → `delegated = false` → la view smette di delegare al ramo nativo e **torna all'interprete
IR** (dove vive il gate del resize). ObjectNode: `irDelegated = ... isMigratedDefaultView(...)`
(`:54`) e ramo `if (irResolution && !irDelegated)` (`:366`). Questo e' il comportamento **desiderato**
(il resize funziona solo nel ramo IR) e coincide con come qualunque edit a una default view si
comporta gia' oggi (label/shape/border ecc.). **Il campo `resizable` NON viene perso**; cambia solo
il path di rendering, come per ogni altra modifica. Da segnalare ad Alfonso, non e' un rischio Q5.

**Verdetto Q5: SI' — il campo sopravvive.** Nessun prerequisito bloccante di persistenza per Fase 2.

---

## Q6 — `VertexAuthoringPanel`: write pattern + hard-stop feature-picker

**Write pattern di un campo top-level** (modello: `label`, che e' top-level come lo sarebbe
`resizable`) — `VertexAuthoringPanel.tsx:216`:

```tsx
<Input value={draft.label ?? ''} onChange={(e) => patch({ ...draft, label: e.target.value })} />
```

`patch` (`:79-82`):
```ts
const patch = (next: VertexViewIR) => {
    dirtyRef.current = true;
    setDraft(next);
};
```

Commit: effetto debounced (`:65-77`) che valida (`validateIR`) e, se ok, dopo `COMMIT_DEBOUNCE_MS`
(300ms, `:31`) scrive `(view as any).ir = draft`. Quindi in Fase 2 il checkbox fa:
`onChange={(checked) => patch({ ...draft, resizable: checked })}` — top-level, esattamente come
`label`. (`shape.form` invece muta via `patchShape` (`:182`) perche' e' annidato in `shape`;
`resizable` e' top-level → usa `patch({ ...draft, ... })`, come `label`.)

**Memo feature-picker (hard-stop)**: e' il `useMemo` `featureInfo` (`:95-153`), che risolve le
feature **per identita'** (discovery 2026-07-23 §9, `ir_feature_picker_stale`) e la cui logica non va
disturbata. Deps del memo (`:153`), verbatim:

```ts
}, [JSON.stringify(draft.metaclasses), JSON.stringify((view as any).appliableToClasses ?? []), view.id]);
```

Un campo top-level boolean `resizable` **non** tocca `draft.metaclasses` ne' `appliableToClasses`:
patcharlo **non** invalida `featureInfo` (ne' il memo `classNames` a `:161-171`, deps `[]`). Il
checkbox e' quindi naturalmente lontano dal picker, come lo e' stato `FORM_OPTIONS` (il `Select`
Shape a `:222-230`, che usa `ConditionalEditor` e non muta i deps del memo).

**Collocazione del checkbox nel JSX** (senza toccare il memo): nel tab Basic, come nuovo `jj-field`
top-level accanto a Shape/Border (blocco `:219-253`), p.es. subito dopo il campo Label (`:214-217`)
o dopo Border (`:248-253`). Zona sicura, lontana dai due `useMemo`.

**Dettaglio Fase 2 (non bloccante)**: gli import UI attuali (`:3`) sono `Input, Select, NumberInput,
ColorPicker, ErrorText, Button, HelpText, ConditionalEditor`. **Manca un controllo checkbox**: Fase 2
dovra' verificare/importare un componente `Checkbox`/`Switch` da `../../../ui` (design-system §7.1:
toggle orizzontale 36×20, slate `#334155`) oppure usare un `<input type="checkbox">` con classi del
design system.

---

## Q7 — Parametri resizer, floor, e CSS shrink rect/rounded

**`SHAPE_MIN_SIZE`** (`nodeSizing.ts:16`): `export const SHAPE_MIN_SIZE = 24;` — **confermato 24**.

**Props attuali del `<NodeResizer>`** (`ObjectNode.tsx:380-389`), verbatim:

```tsx
{isNodeResizable('objectNode', hasGeometricShape) && (
    <NodeResizer
        isVisible={selected}
        minWidth={SHAPE_MIN_SIZE}
        minHeight={SHAPE_MIN_SIZE}
        keepAspectRatio={shapeForm === 'circle'}
        lineClassName="node-resize-line"
        handleClassName="node-resize-handle"
    />
)}
```

`keepAspectRatio={shapeForm === 'circle'}` — confermato: aspect-lock **solo** per circle. Il design
Fase 2 (aspect libero su rect/rounded) e' gia' soddisfatto: `shapeForm === 'circle'` e' `false` per
rect/rounded → nessun aspect-lock. **Non serve altro sul resizer** oltre a comporre il gate.

**CSS shrink rect/rounded — QUI c'e' una dipendenza reale per Fase 2.**

Regole shape (`irStyle.ts`):
- `.ir-node-content` base (`:44`): `box-sizing: border-box; ... border-radius: 4px; ... overflow: hidden;`
  — **nessun `min-width`/`min-height` esplicito, nessun padding** sul box (il padding e' su
  `.ir-compartment` `:29` e `.ir-label--inside` `:22`).
- `.ir-node-content.ir-shape--rounded` (`:45`): **solo** `border-radius: 10px;`.
- **Non esiste una regola `.ir-shape--rect`**: rect usa il base `.ir-node-content` (radius 4px).
- ellipse/circle/diamond neutralizzano i floor sia sul box sia sul **wrapper** via `:has`
  (`irStyle.ts:57-58`, `:61-62`, `:69-72`), es. `:58`:
  ```css
  .mm-node:has(> .ir-node-content.ir-shape--ellipse) { min-width: 0; min-height: 0; width: 100%; height: 100%; }
  ```

Floor del wrapper (`EditorV2.scss`):
- `.mm-node` (`:1208`): `min-width: 140px;` (`:1212`), `min-height: 40px;` (`:1213`).
- `.mm-object` (`:1654`): `min-width: 140px;` (`:1655`).

**rect e rounded NON hanno il neutralizer `:has` sul wrapper** che invece ellipse/circle/diamond
hanno. Quindi il floor `140×40` del wrapper **si applica ancora** a rect/rounded. Conseguenza:
montare il `NodeResizer` su rect/rounded con `minWidth/minHeight = SHAPE_MIN_SIZE (24)` **monta il
resizer**, ma lo shrink visivo si ferma a **140×40**, non a 24 — il floor CSS del wrapper blocca la
riduzione (e senza `width/height: 100%` sul wrapper la larghezza resta ancorata al content-hug della
label nowrap, come spiega il commento ellipse `irStyle.ts:52-56`).

**Verdetto Q7**: il solo gate **non basta** per far scendere rect/rounded a `SHAPE_MIN_SIZE`. Fase 2
deve **anche** aggiungere in `irStyle.ts` i neutralizer `:has` per rect/rounded (specchio di `:58`),
p.es.:
```css
.mm-node:has(> .ir-node-content.ir-shape--rect),
.mm-node:has(> .ir-node-content.ir-shape--rounded) { min-width: 0; min-height: 0; width: 100%; height: 100%; }
```
**Attenzione (decisione di design Fase 2)**: rect e' la forma di default di *ogni* box a
compartimenti; un neutralizer non condizionato cambierebbe il content-hug di **tutti** i rect/rounded
(anche i non-resizable). Va quindi o (a) scopato al caso resizable (es. una classe aggiuntiva
`ir-resizable` sul wrapper, emessa quando `resizable:true`), o (b) accettato il floor `140×40` come
minimo per i box e non forzare fino a 24. Inoltre `.ir-node-content` ha `overflow: hidden` (`:44`):
un box con compartimento ridotto verso il floor **clippa** il contenuto (accettabile per il design
"aspect libero", ma il risultato visivo differisce dalle shape geometriche, che non hanno
compartimenti). **Questa e' la principale dipendenza tecnica di Fase 2 oltre al gate.**

---

## Gate previsto (Fase 2, per riferimento — NON implementato qui)

```ts
// ObjectNode.tsx, ramo IR:
const resolvedResizable = (irResolution.compiled.ir as VertexViewIR).resizable; // Opzione A
const canResize = resolvedResizable ?? hasGeometricShape;
// isNodeResizable('objectNode', canResize)
// keepAspectRatio={shapeForm === 'circle'}  (invariato)
```

- `resizable` assente → `undefined ?? hasGeometricShape` = euristica di oggi (backward-compatible).
- `resizable:true` su rect/rounded → resizer montato (ma vedi Q7 per il floor CSS).
- `resizable:false` su qualunque shape → `false ?? hasGeometricShape` = `false` (`??` fa vincere il
  false esplicito, perche' `false` non e' nullish) → resizer rimosso. Corretto per il "blocco".

---

## Verdetto sintetico Q5

**Il campo `resizable?: boolean` sopravvive al round-trip save → reload: SI'.** Nessun prerequisito
di persistenza bloccante. Motivi: `view.ir` e' un oggetto puro (`GObject`) scritto/letto whole via
`set_ir`/`get_ir`, il pannello committa il draft intero (preserve-verbatim R3), e il carry-over
version-bump copia l'`ir` per intero. Unica nota (non perdita dati): impostarlo su una view
migrated-default la fa passare dal ramo nativo all'interprete IR — comportamento voluto e gia'
esistente per ogni edit di default view.

## Dipendenze e rischi per Fase 2

1. **CSS (rischio principale)**: `irStyle.ts` — senza neutralizer `:has` per rect/rounded lo shrink
   si ferma al floor `140×40` (EditorV2.scss:1212-1213/1655), non a `SHAPE_MIN_SIZE`. Serve scelta
   di design (scoping al caso resizable vs floor 140×40 accettato).
2. **UI**: `VertexAuthoringPanel` non importa un checkbox; verificare/aggiungere il controllo dal
   design-system.
3. **Read path union**: `compiled.ir` e' `AnyViewIR`; leggere `.resizable` richiede cast a
   `VertexViewIR` (Opzione A) o campo compilato dedicato (Opzione B).
4. **Delega default-view**: `resizable` su una migrated-default cambia il path di rendering
   (nativo → IR). Confermare con Alfonso che il rendering IR di `defaultObjectViewIR()` e' l'atteso
   (invariante gia' presente per ogni edit; nessun codice nuovo richiesto).

## Domande aperte per Alfonso

- **graphVertex**: `resizable` solo su `VertexViewIR` (scope dichiarato) o anche su
  `GraphVertexViewIR`? Con solo VertexViewIR, i graphVertex restano al comportamento odierno
  (fallback `hasGeometricShape`) — backward-compatible, ma non bloccabili/abilitabili via flag.
- **Floor rect/rounded**: shrink fino a `SHAPE_MIN_SIZE` (24) come le shape geometriche (richiede
  neutralizer CSS scopato), oppure floor `140×40` accettato per i box? Determina l'entita' del lavoro
  CSS in Fase 2.
- **Read path**: Opzione A (cast su `compiled.ir`, zero modifiche al compile) o Opzione B (campo
  `resizable` su `CompiledView`, tocca irTypes.ts + irCompile.ts)?

## File che Fase 2 dovra' toccare (proposta)

| File | Modifica |
|------|----------|
| `viewpoint/ir/irTypes.ts` | `+ resizable?: boolean` su `VertexViewIR` (`:108`). (Opz. B: anche `CompiledView`.) |
| `nodes/ObjectNode.tsx` | Gate: `canResize = resolvedResizable ?? hasGeometricShape` (`:374`, `:380`). |
| `viewpoint/authoring/VertexAuthoringPanel.tsx` | Checkbox "Resizable" in Basic + `patch({ ...draft, resizable })`. |
| `viewpoint/ir/irStyle.ts` | Neutralizer `:has` per rect/rounded (o variante scopata) — vedi Q7. |
| `viewpoint/ir/irCompile.ts` | **Solo se Opzione B** (campo compilato). Altrimenti non toccato. |
| (UI) `components/ui` | Verificare esistenza di un `Checkbox`; nessuna modifica se gia' presente. |

`nodeSizing.ts` **non** va modificato: `isNodeResizable(type, boolean)` accetta gia' il boolean; la
composizione del gate avviene in `ObjectNode.tsx`.

# Discovery — Feasibility of a runtime IR interpreter + JS-predicate view selection

**Date**: 2026-06-08
**Type**: discovery, read-only (no source/runtime files modified)
**Branch**: `alfonso-frontend-jjtl`
**Scope**: confirm whether the classic editor supports two simplifications for the AI viewpoint generator:
 1. **One runtime interpreter** (`IRView`) registered once, reached from a one-line `jsxString` stub, instead of per-view template synthesis.
 2. **JS predicates** (`jsCondition`) as the sole applicability predicate, leaving `oclCondition` empty for v1.

> All load-bearing claims (the `new Function` scope, the component-registration path, the `jsCondition` AND-gate, the metaclass-id form) were read directly in source, not inferred. Companion doc: `docs/discovery/discovery_2026-06-08_ir_generator.md` (which evaluated the *generator/schema* under an **OCL-primary** framing). This report deliberately re-examines the **JS-primary + single-interpreter** path and, where it diverges from that companion, says so.

---

## 0. Executive verdicts

| Gate | Question | Verdict |
|---|---|---|
| **A** | One registered `IRView` reachable from a stub `jsxString`? | **FEASIBLE** |
| **B** | Does view selection honor `jsCondition` (OCL left empty)? | **FEASIBLE** |
| **C** | Metaclass-identity check + identifier form for the JS selector? | **FEASIBLE WITH CAVEAT** (id is opaque/minted — must be resolved at generation time, not derived from the name) |

**Overall: GO** for the simplified architecture. No blocking caveat. The two simplifications are not just possible — the current `DEFAULT_VIEW_JSX_STRING` is *already* a hand-written generic interpreter embedded in a `jsxString`; `IRView` is a faithful refactor of it into a registered component, and `jsCondition`-only selection is a first-class, fully-wired path. Open questions (all non-blocking) are listed in §8.

---

## Gate A — A single registered component reachable from a generated `jsxString` stub

### A1. How a view's `jsxString` becomes rendered output, and what is in scope

Pipeline (compile-time, once per view, in the reducer):

```
dv.jsxString
  → DSL.parser(...)            // DSL.ts:2-5  — only rewrites <Children/> sugar; passes everything else through
  → UX.parseAndInject(...)     // UX.tsx:438-443 — injects props, then JSXT.fromString
      → JSXT.fromString(s, {factory:'React.createElement'})   // joiner/index.ts:217-225
  → body = 'return (' + <compiled> + ')'
  → tv.JSXFunction = new Function(paramStr, body)             // reducer.ts:991-995
```

- The compiled body is plain JS calling `React.createElement(...)`. `JSXT.fromString` with `factory:'React.createElement'` lowers an **uppercase** tag `<IRView .../>` to `React.createElement(IRView, {...})` — i.e. `IRView` is emitted as a **bare identifier reference**, resolved from the function's scope at call time. (Lowercase tags become string literals like `'div'`.)
- `paramStr` (reducer.ts:991): `'{' + Object.keys(allContextKeys).join(',') + '}'` — a single destructuring parameter. `allContextKeys = contextFixedKeys ∪ view.constantsList ∪ view.UDList`.
- **`contextFixedKeys`** (sharedTypes.tsx:220-239) is seeded from the *constructors* of `EdgeOwnProps`, `EdgeStateProps`, `VertexOwnProps`, `VertexStateProps` (so every declared field, even `undefined`, becomes a key) plus a literal of engine keys. The field declarations are in sharedTypes.tsx:36-217. The in-scope identifiers therefore include, among others:
  `data`, `node`, `view`, `views`, `decorators`, `children`, `className`, `style`, `nodeid`, `graphid`, `parentViewId`, `htmlindex`, `start`, `end`, `label`, `labels`, `constants`, `usageDeclarations`, `component`, `state`, `props`, `otherViews`, `isEdge`, `isVertex`, `isGraph`, … (`class` is explicitly deleted, sharedTypes.tsx:237).
- Invocation (graphElement.tsx:731): `tv.JSXFunction.call(context, context)` — `this = context` and the single arg = `context`, which is destructured into the params above.
- `new Function` bodies execute in **global scope**, so any identifier *not* destructured from `paramStr` (e.g. `React`, `IRView`, `View`, `Input`, `windoww`) is resolved against `window`.

So the template body can freely reference: (a) the **data/view/node** family via `paramStr`, and (b) any **registered component** + `React` + `windoww` via the global object.

### A2. How components are made available to that scope

`joiner/ExecuteOnRead.ts:94-121` is the registry assembler:
- `import * as Componentss from '../joiner/components'` (ExecuteOnRead.ts:15) pulls the whole barrel.
- builds `wComponents = {...Components}` and adds suffix-stripped aliases (`DefaultNodeComponent` → also `DefaultNode`), ExecuteOnRead.ts:102-110.
- `windoww.React = React` (ExecuteOnRead.ts:111).
- **`for (let k in wComponents) windoww[k] = wComponents[k]`** (ExecuteOnRead.ts:114-121) — every barrel export is assigned onto the **global object**, with only a console *warning* on name collision (no hard rejection).

The currently usable component identifiers inside a `jsxString` are exactly the `joiner/components.tsx` exports — e.g.:
`GraphElement, Graph, Vertex, VoidVertex, GraphVertex, Field, EdgePoint, DefaultNode, GraphsContainer, Edge, GenericInput, Input, Edit, TextArea, Select, Selector, View, Try, Grid, ContextMenu, ContextualEntry, CountryPicker, Overlap, ControlPanel, Control, Slider, Toggle, Zoom, Panel, MetaElementPicker, Measurable/Scrollable/Draggable/Resizable/…, Polygon/Circle/Rectangle/…shapes`, plus icon namespaces `Tb`, `Fa` (components.tsx:6-99).

Proof the mechanism is the live one: `DEFAULT_VIEW_JSX_STRING` (defaultViewTemplate.ts:101,105) renders `<View>` and `<Input>` — both reach the scope solely through this barrel→`window` path.

### A3. Adding a new component once

Mechanism: **export `IRView` from its source module and add it to the `joiner/components.tsx` barrel** (the same way `View`/`DefaultNode` are exported). `ExecuteOnRead.ts:114-121` then assigns `windoww.IRView = IRView` automatically at module load, making `<IRView/>` resolvable in every compiled `jsxString`. Registration is **necessary and sufficient**: there is no separate allowlist that must also be updated — an unregistered uppercase tag simply throws `ReferenceError` at render (caught → `displayError`, reducer.ts:1005). (One caveat: avoid a name collision with a pre-existing `window`/barrel key, ExecuteOnRead.ts:115-118; `IRView` does not currently exist — verified by grep.)

### A4. What a template receives about its element

`context` (graphElement.tsx:647-662) = `{...this.props, ...tv.constants, ...tnv.usageDeclarations, component, otherViews, constants, usageDeclarations, props}`. `this.props.data` is the **L-proxy** of the model element (`LModelElement`/`LObject`), `node` is the `LGraphElement`, `view` is the `LViewElement`.

The L-proxy exposes everything a generic interpreter needs — and the existing default template already exercises exactly these accessors (defaultViewTemplate.ts:93-133):
- `data.name` (rendered via `<Input data={data} field={'name'}/>`, :105),
- `data.instanceof` → the metaclass `LClass`, with `.name` (:108-109), `.references` (:122), and `.id`,
- M1 slot access `data['$' + featureName].value` (:125-128),
- containment children via `data.children` → `get_subElements` (recursive rendering `data.children.map(c => <DefaultNode data={c}/>)`, used by the `<Children/>` DSL sugar, DSL.ts:23-29 and confirmed live in companion doc §3),
- `decorators` (the injected decorator nodes, :132).

This is sufficient for `IRView` to read name, type badge, attributes/slots, references, and contained children generically.

### Verdict A — **FEASIBLE**

We can write one `IRView` component, register it once via `joiner/components.tsx`, and have generated stub `jsxString`s render through it. The concrete stub that works, using the **real** in-scope variables (all confirmed destructured from `paramStr`):

```jsx
<IRView data={data} node={node} view={view} />
```

`IRView` then reads the IR master from the view. Two equivalent ways to hand it the IR:
- **Recommended (zero L-layer work):** `IRView` reads `(view.__raw || view).ir` internally — `__raw` is the D object, where the new optional `ir` field lives; no L getter required.
- Or inline it: `<IRView ir={view.ir} data={data} node={node} view={view} />` — requires an L passthrough getter for `view.ir` (trivial, additive; see S1).

The stub contains no `<Children/>` sugar, so `DSL.parser` passes it through untouched and `JSXT.fromString` compiles it cleanly to `React.createElement(IRView, {data, node, view})`.

**Caveat (non-blocking):** the stub is still a persisted `jsxString`. Its *form* (which scope vars it passes, the component name) is frozen into every saved project at generation time. Changing the stub form later requires a `VersionFixer` migration (see S4). Changing `IRView`'s *internals* does not.

---

## Gate B — Does view selection honor `jsCondition`?

### B1. Where selection happens

- Metaclass gate: `Selectors.matchesMetaClassTarget` (selectors.ts:356-373) — matches `view.appliableToClasses` against the element's `className` (`EXACT`/`INHERITANCE`/`IMPLICIT` = empty array wildcard).
- Score assembly: `Selectors.getFinalScore` (selectors.ts:417-437).
- Winner selection: `NodeTransientProperties.sort` (classes.ts:4064-4088) — splits views by `isExclusiveView` into main vs decorative, sorts each by score desc, `tn.mainView = mainViews[0]` (classes.ts:4084).
- Fields consumed: `appliableToClasses`/`appliableTo` (selectors.ts:358,361-371), `jsCondition` (selectors.ts:718-749), `oclCondition` (selectors.ts:596 → `OCL.test`), `isExclusiveView` (classes.ts:4076), `explicitApplicationPriority` (selectors.ts:424-429).

### B2. Is `jsCondition` actually evaluated, and over what scope?

Yes. Compiled and invoked:
- **Compile** (reducer.ts:950-977): `tv.jsCondition = new Function(paramStr, body)` (reducer.ts:972). The body is the raw `dv.jsCondition` source with the last line auto-wrapped in `return (...)` if it lacks `return` (reducer.ts:960-962). It is **full, modern JS** (`?.`, `??`, `let`/`const`, arrows) — the constrained "template dialect" applies only to `jsxString`, not to `jsCondition`.
- **Invoke** (selectors.ts:725-728): `tnv.jsScore = tv.jsCondition({data, node, view, constants})`.
  - **`self` is not bound** — the evaluated element is **`data`** (the L-proxy `LModelElement`). The function is called as `tv.jsCondition({...})` (plain call, no `.call(self)`), so `this` is not the element. *Predicates must use `data`, not `self`.* (This is the key divergence from the OCL path, where the element is `self`.)
  - Return contract (selectors.ts:730-746): `true` → match (priority falls back to `explicitApplicationPriority`/heuristic); a **number > 0** → match **and that number becomes the priority** (overrides `explicitApplicationPriority`, see getFinalScore B4); `false`/`NaN`/`≤0`/non-bool-non-number/throw → `MISMATCH_JS`; **missing `jsCondition` → `jsScore = true`** (selectors.ts:746).

### B3. Interaction of `oclCondition` and `jsCondition` when only JS is set

They are **AND-ed**, and an empty `oclCondition` is a clean no-op:
- `getFinalScore` (selectors.ts:420): if **either** `jsScore === MISMATCH_JS` **or** `OCLScore === MISMATCH_JS` → final = `MISMATCH`. Both must pass.
- `OCL.test` with empty condition (ocl.tsx:127-130): **`if (!condition) return true;`** — an empty `oclCondition` returns a match, never `MISMATCH_OCL`.
- Therefore: **`jsCondition` set + `oclCondition` empty → selection driven entirely by JS.** Neither is "preferred"; the empty one is neutral.

### B4. `isExclusiveView` + `explicitApplicationPriority` — one winner per element

- `sort` (classes.ts:4076): `(dview.isExclusiveView ? mainViews : decorativeViews).push({...score...})`. Only views with `finalScore > 0` are kept (classes.ts:4075).
- `mainViews.sort((a,b)=>b.score-a.score)` then `tn.mainView = mainViews[0]?.view` (classes.ts:4079,4084) — **exactly one** exclusive view wins per node; the rest of the exclusive set is dropped from rendering. Decorative views (`isExclusiveView=false`) stack on top (`tn.stackViews`, classes.ts:4086).
- Priority within the exclusive set: `finalScore = viewPointMatch * metaclassScore * pvScore * explicitprio + defaultViewMalus` (selectors.ts:434), where `explicitprio` = the **number returned by jsCondition** if numeric (selectors.ts:424-425), else `explicitApplicationPriority` (selectors.ts:429), else heuristic `(jsCondition.length||1)+(oclCondition.length||1)` (selectors.ts:428).
- Defaults: `isExclusiveView` defaults to **`true`** (classes.ts:1107); `explicitApplicationPriority` defaults to **`undefined`** → heuristic (classes.ts:1106).

### Verdict B — **FEASIBLE**

We can lower every predicate to `jsCondition` and leave `oclCondition` empty for v1; selection works. The exact field set the generator must write for an applicability filter to take effect:

- `appliableToClasses` = the **jjodel level** (`['DObject']` for M1-instance views; `['DModel']` for the model-root view; empty array = wildcard match). *Not* the user metaclass.
- `jsCondition` = a JS body returning `true`/`number>0` for a match (uses **`data`**). The user-metaclass discrimination lives here (Gate C).
- `oclCondition` = `''` (empty → neutral).
- `isExclusiveView` = `true` for the single main node view; `false` for decorative overlays.
- `explicitApplicationPriority` = a number to break ties among competing exclusive views (or return a number from `jsCondition` to the same effect).

**Caveats (non-blocking):**
1. `jsCondition` is re-evaluated on essentially every model/node/view change (selectors.ts:581-583 comment: "called … everytime", deemed cheap), whereas OCL re-evaluates only on data change. Predicates should be pure and cheap.
2. If `jsCondition` returns a *number*, it silently overrides `explicitApplicationPriority`. Pick one channel for priority; don't mix.

---

## Gate C — Metaclass-identity check and identifier form

### C1. Testing "is an instance of metaclass X" at runtime

For an M1 instance (`LObject`), the metaclass is reached via `data.instanceof` → the `LClass` proxy (`get_instanceof`, LModelElement.tsx:6200-6203: returns `LPointerTargetable.from(context.data.instanceof)`). The identity property is `data.instanceof.id` (the pointer of the `DClass`). In a `jsCondition` the JS equivalent of OCL's `self.instanceof.id` is therefore:

```js
return data?.instanceof?.id === '<DClass pointer>';
```

(Real precedent for `instanceof`-based JS predicates: `return data?.instanceof?.isSingleton`, companion doc / `redux/defaults/views.ts:640`.)

### C2. Form of the identifier

User-created class pointers are **opaque minted ids**, not name-derived. `DPointerTargetable.getDefaultId` (joiner/classes.ts:588):

```js
return "Pointer" + new Date().getTime() + "_" + (isUser ? DUser.current : 'USER') + "_" + (DPointerTargetable.maxID++);
```

→ concrete shape like `Pointer1717848291043_USER_42`. The readable `Pointer_<NAME>` form (e.g. `Pointer_ESTRING`, `Pointer_EINT`) is **reserved for primitive/static types only** (classes.ts:1568-1569, prefix logic). The `Pointer_state` strings seen in `examples/StateMachine/views/index.ts` are a hardcoded *fixture* convention (`ptr+name`), **not** the runtime form a freshly-imported metamodel produces.

### C3. Resolving identifier from a metaclass NAME

Canonical by-name lookup is in `set_instanceof` (LModelElement.tsx:6207-6213):

```js
metaptr = model.classes.filter(c => c.name === val)[0]?.id;
if (!metaptr) metaptr = model.crossClasses.filter(c => c.name === val)[0]?.id;  // cross-metamodel fallback
```

So name → id = `lModel.classes.find(c => c.name === Name)?.id` (with `crossClasses` as the cross-MM fallback). Non-unique names are resolved by **first match** (`filter(...)[0]`) — an ambiguity the generator inherits if two classes share a name.

### Verdict C — **FEASIBLE WITH CAVEAT**

The exact JS expression the generator emits to select by metaclass:

```js
return data?.instanceof?.id === '<resolved-DClass-id>';
```

…where `<resolved-DClass-id>` is obtained **at generation time** by resolving the domain name against the live metamodel (`lModel.classes.find(c => c.name === Name)?.id`, + `crossClasses`).

**Caveat (the reason this is not plain FEASIBLE):** the id is opaque and per-instance-minted; the generator must **not** synthesize it from the name (`Pointer_<Name>` would be wrong for user classes). It must read the actual `lClass.id` at gen time and bake the literal into the `jsCondition`. Two consequences: (a) if the metamodel is regenerated/re-imported, ids change and baked predicates go stale; consider an indirection (resolve by name at predicate eval time, e.g. `data?.instanceof?.name === 'State'`) where stability across re-imports matters — at the cost of name-collision ambiguity. (b) duplicate class names need package qualification to disambiguate.

---

## Supporting context (no verdict)

### S1. `DViewElement` D-layer field set + the optional `ir` field

All fields named in the task are declared in `view/viewElement/view.tsx` (D-layer):
`isExclusiveView` :193, `appliableToClasses` :215, `appliableTo` :216, `oclCondition` :218, `jsCondition` :219, `explicitApplicationPriority` :224, `isEdge` :276, `edgeSource` :277, `edgeTarget` :278, `edgeRouting` :279, plus the classic-edge fields `palette` :261, `bendingMode` :246, `edgeHeadSize` :259, `edgeTailSize` :260. Construction defaults in `joiner/classes.ts` `Constructors.DViewElement` (`isExclusiveView=true` :1107, `explicitApplicationPriority=undefined` :1106).

Adding an optional `ir?` is **purely additive**: persistence is generic — `U.compressedState()` (common/U.tsx:427-441) `JSON.stringify`s the entire `idlookup` with no per-field allowlist, written by `ProjectsApi.save` (api/persistance/projects.ts:94-116). A new optional D field rides along automatically. No existing exported interface property is changed (CLAUDE.md §2 allows adding optional properties). **No `VersionFixer` migration is needed for an `undefined` optional.** (Confirmed consistent with companion doc §4.)

### S2. `DEFAULT_VIEW_JSX_STRING` — the starting point for `IRView`

Lives at `utils/defaultViewTemplate.ts:93-133`. Structure: an IIFE head (`:93-100`) that suppresses the card when the view is an edge with resolvable endpoints, then a `<View className='root jjodel-default-view…'>` containing: a header with the name (`<Input field='name'>`, :105) and a type badge (`data.instanceof.name`, :108-109), an edge-preview line (`src → tgt`, :112-130), a hint, and `{decorators}` (:132). Detection markers for migrations: `LEGACY_PLACEHOLDER_MARKER` (:143) and `V2_2_TO_V2_3_DETECT_MARKER = 'Customize this view'` (:155). **This template is effectively a small generic interpreter already** — `IRView` generalizes it (shape, labels, badges, field compartments, conditionals, recursive children) and reads its directives from `view.ir` instead of from hardcoded JSX.

### S3. Edge pipeline — which substrate is live

Three edge renderers coexist (detailed in companion doc §2). What is **live** today in the classic M1 model canvas:
- **object-as-edge via `EdgeOverlay`** is mounted: `components/abstract/tabs/ModelTab.tsx:47` → `<EdgeOverlay graphid={graphid} />`. For an M1 instance to render as an edge, set on its `DViewElement`: `isEdge=true` + `edgeSource` + `edgeTarget` (path expressions evaluated via `windoww.evalEdgeExpression`). View selection there is by `findApplicableEdgeView` (EdgeOverlay.tsx:488-518), which matches by `clsId`/`clsName`/`'DObject'` wildcard. Capabilities are **reduced**: one center label, 6 semantic stroke colors, width 0.5–10, `straight|manhattan-rounded|bezier`, **no terminations**.
- **reference-as-edge via `DV.tsx` `palette`/`bendingMode`** is the full UML edge (arrows/diamonds, arbitrary stroke, 3 labels) but drives the classic reference/inheritance edges, not arbitrary M1-instance edges.

**Key implication for the IRView plan:** edges do **not** flow through `jsxString`/`IRView` at all — `EdgeOverlay` reads the `edge*` view fields directly. So the runtime interpreter governs **nodes**; edges remain a parallel, field-driven path. The generator must emit the `edge*` fields (and accept the reduced `EdgeOverlay` capability set) rather than expecting `IRView` to render connectors.

### S4. `jsxString` persistence for freshly generated views

Newly generated views are written **fresh**: the generator creates each `DViewElement` with its own `jsxString` at construction, persisted by the generic serialization above. `VersionFixer` (`redux/VersionFixer.tsx`) only **rewrites already-saved** default-view `jsxString`s (CLAUDE.md §3.9). So the well-known "edits to `DV.tsx`/`defaultViewTemplate.ts` don't propagate to saved projects" hazard does **not** apply to a view at its creation moment.

Better still — and this is a structural *advantage* of the single-interpreter design — because the per-view stub `jsxString` is constant and the rendering logic lives in the runtime `IRView` component (resolved from `window` at render), **improvements to `IRView` propagate to every existing saved project with no migration.** That inverts the usual §3.9 pain. Two residual `VersionFixer` interactions to keep in mind:
1. If the **stub form** ever changes (new scope var passed, component renamed), every saved stub must be rewritten by a migration — same discipline as today's default views (CLAUDE.md Rule 6 / §3.9).
2. **IR schema evolution** is data, carried inside the persisted `ir` master; it must be handled by versioning the IR and reading it defensively *inside* `IRView`, not by `VersionFixer`.

---

## Recommendation — **GO**

The simplified architecture is supported by the current classic editor on both load-bearing axes:

- **Gate A (single interpreter): FEASIBLE.** Register `IRView` once in `joiner/components.tsx`; the existing barrel→`window` path (ExecuteOnRead.ts:114-121) exposes it to every compiled `jsxString`. The working stub is `<IRView data={data} node={node} view={view} />` with the IR read from `view.__raw.ir`. The existing `DEFAULT_VIEW_JSX_STRING` proves the mechanism end-to-end.
- **Gate B (JS-only predicate): FEASIBLE.** `jsCondition` is fully wired; empty `oclCondition` is neutral (ocl.tsx:130); both predicates AND together (selectors.ts:420). The element is bound as **`data`** (not `self`). Required write set: `appliableToClasses=['DObject']` + `jsCondition` (+ `isExclusiveView`, optional `explicitApplicationPriority`).
- **Gate C (metaclass identity): FEASIBLE WITH CAVEAT.** `data?.instanceof?.id === '<id>'`, but `<id>` is an opaque minted pointer (`Pointer<ts>_<user>_<n>`, classes.ts:588) that must be resolved from the live metamodel at generation time — never synthesized as `Pointer_<name>`.

**Blocking caveats: none.**

**Non-blocking caveats / decisions for the spec:**
1. **Metaclass selector stability (Gate C).** Choose `instanceof.id` (precise, but stale on re-import) vs `instanceof.name` (re-import-stable, but ambiguous on duplicate names). Recommend `.id` resolved at gen time for v1; document the re-import limitation.
2. **`self` vs `data` (Gate B).** The JS predicate uses `data`, not `self`. Any predicate grammar lowering must target `data`.
3. **Priority channel (Gate B).** Don't both return a number from `jsCondition` *and* set `explicitApplicationPriority` — the number wins. Pick one.
4. **Edges bypass IRView (S3).** Connectors render via `EdgeOverlay` (live in `ModelTab.tsx:47`) from `isEdge`/`edgeSource`/`edgeTarget`, with reduced capability (no terminations, 1 label, 6 colors). The generator emits those fields; `IRView` covers nodes only. If full UML edges are required, that targets the `DV.tsx` `palette` path instead — a separate substrate.
5. **Stub-form freeze (A/S4).** The constant stub `jsxString` is persisted per view; changing its *form* later needs a `VersionFixer` migration, while `IRView` internal changes do not.

**Open questions to confirm against the local tree before building Phase 2:**
- **Q1.** The IR master can be large. Confirm whether to read it via `view.__raw.ir` (no L work) or add an L passthrough getter `view.ir` (so the stub may inline `ir={view.ir}`). Both are additive; pick one convention.
- **Q2.** Confirm the target editor for generated viewpoints. This report covers the **classic** editor (where `jsxString`/`IRView` and `EdgeOverlay` are live). In **flow-v2**, `UnifiedEdge` ignores `view.*` and the node renderer is not `jsxString`-driven — `IRView` would not be reached there (companion doc §2c). If flow-v2 is a target, that is a separate, larger feasibility question.
- **Q3.** Confirm a `DObject` instance-view with an empty `oclCondition` and a `jsCondition` returning `true` actually beats the framework fallback view in `sort` (classes.ts:4064-4088) for a real imported metamodel — reproduce on the current code rather than trusting this static trace (CLAUDE.md §5.1).

---

## Key files (for Phase 2)

| Area | File:position |
|---|---|
| `jsxString` compile (scope + `new Function`) | `redux/reducer/reducer.ts:981-1020` (paramStr :991, body :993, `new Function` :995) |
| JSX→JS lowering | `common/UX.tsx:438-443` (`parseAndInject`), `joiner/index.ts:217-225` (`JSXT.fromString`), `DSL/DSL.ts:2-31` (`<Children/>` sugar) |
| In-scope identifiers | `graph/graphElement/sharedTypes/sharedTypes.tsx:220-239` (`contextFixedKeys`), seeded from :36-217 (OwnProps/StateProps) |
| Component registry → global | `joiner/ExecuteOnRead.ts:94-121`; barrel `joiner/components.tsx:1-99` |
| Template invocation + context | `graph/graphElement/graphElement.tsx:647-662` (context build), `:731` (`JSXFunction.call`) |
| Metaclass gate | `redux/selectors/selectors.ts:356-373` |
| JS predicate eval | `redux/selectors/selectors.ts:718-749`; compile `redux/reducer/reducer.ts:950-977` |
| OCL eval (+ empty short-circuit) | `ocl/ocl.tsx:127-144` (empty → `true` :130) |
| Final score (AND-gate + priority) | `redux/selectors/selectors.ts:417-437` |
| Winner selection (exclusive/decorative) | `joiner/classes.ts:4064-4088` |
| `instanceof` accessor | `model/logicWrapper/LModelElement.tsx:6200-6203` |
| Pointer id minting | `joiner/classes.ts:588` (user), `:1568-1569` (primitive `Pointer_<NAME>`) |
| Name→id resolution | `model/logicWrapper/LModelElement.tsx:6207-6213` (`set_instanceof`) |
| `DViewElement` fields + defaults | `view/viewElement/view.tsx:185-286`; `joiner/classes.ts:1077-1238` (defaults :1106-1107) |
| Default template (IRView seed) | `utils/defaultViewTemplate.ts:93-133`; markers :143,:155 |
| Edge overlay (live mount) | `components/abstract/tabs/ModelTab.tsx:47`; selection `components/edgeOverlay/EdgeOverlay.tsx:488-518` |
| Persistence (generic) | `api/persistance/projects.ts:94-116`, `common/U.tsx:427-441` |
| VersionFixer | `redux/VersionFixer.tsx` |

---

*Discovery read-only. No source/runtime file modified. Companion: `discovery_2026-06-08_ir_generator.md` (OCL-primary framing). This report establishes the JS-primary, single-interpreter path is GO; next step is to close Q1–Q3 (read-only) and then build `IRView` + the generator.*

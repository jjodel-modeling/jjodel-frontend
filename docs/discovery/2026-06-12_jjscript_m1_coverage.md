# Discovery — JjScript M1 instance coverage + Jjodie M1 context pipeline

**Date**: 2026-06-12
**Type**: read-only discovery (no code modified)
**Goal**: Map exactly what the current JjScript M1 implementation covers (parser / executor / editor sync) and how the Jjodie prompt+context pipeline feeds M1, to assess feasibility of: *open an M1 model → derive its metamodel → generate JjScript that builds instances (e.g. "a state machine for a microwave") → execute it*.

All file:line citations are against the working tree at the time of writing (branch `alfonso-frontend-jjtl`). Where a question cannot be settled statically, it is flagged and a runtime experiment is proposed.

---

## 1. Coverage matrix

Legend: ✅ covered · ⚠️ partial / caveated · ❌ missing · — n/a

| Command (M1) | Parser | Executor (D-layer write) | Classic sync (proxy `$feature`) | Flow sync (v2-flow edges/nodes) |
|---|---|---|---|---|
| `create instance of <Class> ["name"]` | ✅ `of` mandatory | ✅ `DObject.new(metaclass, model, DModel, name, true)` | ✅ writes via DObject | ✅ vertex via `useJjomSync` Step 2bis / Step 4 init |
| `create instance of <Class> in <X>` (containment slot) | ⚠️ `in` parsed | ❌ `args.parent` **ignored** — always father=model | — | — (root vertex only) |
| `set <inst>.<attr> = <literal>` | ✅ | ⚠️ writes raw primitive, **no type coercion/validation**; enum-by-name ❌ | ✅ `$attr.value =` | — |
| `set <inst>.<ref> = <inst>` | ✅ | ⚠️ **always appends** (ignores mono/multi + `+=`/`-=`) | ✅ `$ref.values =` | ✅ edge via `useM1ReferenceEdges` / Step 4 |
| `set <inst>.<ref> = null` (unlink) | ✅ | ⚠️ clears **all** values (no single-element remove) | ✅ | ⚠️ orphan edge cleanup is "separate workstream" |
| `delete instance <name>` / `delete <name>` (M1 ctx) | ✅ | ✅ `DeleteElementAction.new(obj)` | ✅ | ❌ no `syncDeleteVertex` call → orphan DVertex (prior finding) |
| `rename instance <name> to <new>` / `rename <name> to <new>` | ✅ | ✅ `SetFieldAction(obj,'name')` + conflict check | ✅ | — |
| `let $x = … in <body>` over M1 body | ✅ | ⚠️ body dispatched, but var-substitution only for `set.value`/`rename.newName`; RHS is JjEL, **not** a command | depends on body | depends on body |
| `forall x in S do <body>` over M1 body | ✅ | ✅ dispatches body per element | depends on body | depends on body |

**Routing fact that gates the whole table (Q8):** the M1 branch in every handler is `if (context.level !== 'M1') return WRONG_LEVEL`. `context.level` is only ever set to `'M1'` by **`JjScriptService.execute()`** (`jjscript/services/JjScriptService.ts:74-90`). The **chat "Run" button path does not go through that service** — see Q8. So the table's "Executor" column is only reachable when the executor singleton already holds `level:'M1'`.

---

## 2. Per-question findings

### Q1 — M1 grammar inventory ✅ (with one parse-but-ignore)

M1-targeting commands the parser accepts:

- **`create instance of <ClassName> ["<instanceName>"]`** — `of` is **mandatory**. `parser.ts:254-263` throws *"Expected 'of' after 'create instance'"* when omitted. Class name parsed as `args.name`; optional quoted instance name parked in `options.defaultValue` (`parser.ts:330-337`). Cross-checked by `__tests__/parser.test.ts:152-174` (rejects without `of`; `elementType==='instance'`, `name==='Person'`, `defaultValue={kind:'string',value:'alice'}`).
- **`delete instance <name>`** and bare **`delete <name>`** — `parseDeleteCommand` accepts optional element type incl. `'instance'` (`parser.ts:449-453`); routing also triggers on `context.level==='M1'` (`delete.ts:45`).
- **`rename instance <name> to <new>`** / bare `rename <name> to <new>` — `parseRenameCommand` accepts `'instance'` (`parser.ts:487-491`).
- **`set <inst>.<prop> = <value>`** — `parseSetCommand` (`parser.ts:529-561`). M1-routed via `set.ts:47`.
- `create instance … **in** <X>` parses (the generic `in <parent>` clause, `parser.ts:270-272`) but the value is **discarded** by the executor (see Q3).

There is **no** dedicated M1 keyword set beyond `instance` + `of`; M1 vs M2 is decided by `context.level`, not by distinct grammar.

**RHS literal forms accepted on `set`** (`parseValueOrQualified` `parser.ts:1197-1223`, `parseLiteralValueToken` `:1171-1195`):

| Form | Token | Parsed as |
|---|---|---|
| `"alice"` / `'alice'` | STRING | `{kind:'string'}` |
| `30`, `3.14`, `-5` | NUMBER | `{kind:'number'}` |
| `true` / `false` | BOOLEAN / keyword | `{kind:'boolean'}` |
| `null` | keyword | `{kind:'null'}` |
| `$var` | `$`+IDENT | `QualifiedName{raw:'$var'}` (resolved by `let`) |
| bare `State2` / `Enum.LIT` | IDENTIFIER / QUALIFIED_NAME | `QualifiedName` |

There is **no parser path that produces `EnumLiteralRef`** for a `set` value, and **no `Date` literal**. Enum literal and date values can therefore only arrive as quoted strings (with consequences in Q2a).

### Q2 — `set` semantics on M1

Handler: `executeSetInstance` (`instance.ts:414-637`). Property kind decided by `classifyMetaclassProperty` walking `allAttributes`/`allReferences` (`instance.ts:127-135`).

**(a) Attributes — ⚠️ partial.**
- Primitive conversion is `literalToPrimitive` (`instance.ts:140-148`): `string→string`, `number→number`, `boolean→boolean`, `null→null`. Everything else (`array`, `enumLiteral`) → `null`. The value is written verbatim: `(lObject)['$'+prop].value = primitive` (`instance.ts:494-504`).
- **No type coercion and no type-mismatch check.** `set p.age = "30"` writes the string `"30"` into an int slot; `set p.age = 30` writes number `30`. The only validation is "must be a literal, not a name" (`instance.ts:478-488`, error `TYPE_MISMATCH` *"Cannot assign a name … to an attribute"*).
- **Enum-typed attribute by literal name — ❌.** A bare `RED` parses to a `QualifiedName`, so the attribute branch rejects it as a name. `EnumName.RED` likewise parses to a QualifiedName → rejected. Only `set inst.color = "RED"` works, writing the raw string with no enum-membership validation. (Note: the dead M1 prompt — Q7 — *instructs the LLM to emit `EnumName.LITERAL`*, which would fail here.)

**(b) References — ⚠️ partial.** (`instance.ts:531-636`)
- The branch is taken for **both** plain references and containment references (containments are in `allReferences`).
- **Always appends**: `refProxy.values = [...meaningful, targetInstance.id]` (`instance.ts:610-612`). `args.operator` (`=`/`+=`/`-=`, parsed at `parser.ts:546-555`) is **ignored**. Consequence: there is **no replace semantics** — re-`set`-ting a mono-valued reference accumulates a second target rather than replacing; setting the same target twice duplicates the id (no dedup).
- **No append/remove-single syntax.** The only removal is `set inst.ref = null` → `refProxy.values = []` (`instance.ts:536-561`), which clears the **entire** slot.
- **RHS resolution**: `findInstanceByName(targetModel, name)` (`instance.ts:101-104`) scans **`model.objects` only** — model-scoped, **not** global `idlookup`. Accepts either a quoted string name (`instance.ts:566-579`) or a bare `QualifiedName.raw` (`instance.ts:581`). Target not found → `INSTANCE_NOT_FOUND`.
- Containment caveat: a containment `set` only **appends the pointer to the slot's `values`**; it does **not** reparent the child (`child.father` stays the model). So JjScript "containment" at M1 is a logical link, not true nesting (relevant to Ecore/XMI export fidelity, not to edge rendering).

**(c) Ordering — strictly sequential, forward-refs fail.** Each line is dispatched independently (`executor.ts:executeBatch/executeScript`; the chat runner `ScriptBlock` calls `onExecute([commands[i]])` one line at a time). A `set X.ref = Y` where `Y` is created *later* fails at that statement (`INSTANCE_NOT_FOUND`) because `findInstanceByName` scans current `model.objects`. There is a pre-execute `waitForDependencies` (`executor.ts:96-106`) but it is best-effort and built for M2 dependency names, not M1 instance ordering. Generators must therefore emit *create-all-then-link* order (which the examples do).

### Q3 — Containment at M1 ❌ (root-only instances)

- **No executor support for creating an instance inside a containment slot.** `executeCreateInstance` (`instance.ts:154-265`) always calls `DObject.new(metaclass.id, targetModel.id, DModel, name, true)` — **father is always the model**. It reads only `args.name` and `args.options.defaultValue`; **`args.parent` is never consulted**, so `create instance of State in sm` parses but the `in sm` is dropped. **JjScript can only create root-level instances today.**
- Containment can be *approximated* post-hoc by `set sm.states = state1` (a reference-slot append, Q2b), but that does not move the child under a `DValue` father.
- **Nested DObjects (father = `DValue`) and v2-flow vertices:** `useJjomSync` Step 2bis (`useJjomSync.ts:661-692`) and Step 4 (`:899-928`) and `useM1ReferenceEdges` (`useM1ReferenceEdges.ts:42-58, 90-111`) **all iterate `rawModel.objects` only**. A DObject that exists solely under `parentDValue.values` and is **not** present in `model.objects` would receive **no DVertex**. Whether the framework's containment-add path also registers the child in `model.objects` is **not determinable statically here** (it depends on `LModelElement.addObject`/`set_instanceof`, `LModelElement.tsx:5141-5351`). → **Runtime experiment** (OQ-1). For the *Jjodie-generated* use case this is moot, since JjScript cannot produce nested objects anyway.

### Q4 — `delete instance` cleanup ⚠️

`executeDeleteInstance` (`instance.ts:271-331`): resolves the instance via `findInstanceByName`, then inside a `TRANSACTION` calls `DeleteElementAction.new((lObject).__raw ?? lObject)` (`instance.ts:311-312`).

- **(a) Removes the DObject** — ✅ `DeleteElementAction` on the object.
- **(b) Orphan DVertex** — ⚠️/❌ likely. The delete path does **not** call `syncDeleteVertex` (`canvasToJjom.ts:259`), which is the canvas-side routine that removes the vertex *and* its incident edges. Whether `DeleteElementAction` cascades to the DVertex (which points to the object via its `model` field) depends on `pointedBy` cascade semantics. Prior session (2026-05-xx) reported an **orphan DVertex remaining**. → **Runtime experiment** (OQ-2).
- **(c) Dangling pointers in other instances' `DValue.values`** — ⚠️ likely dangling. `DValue.values` is a *named stored array* of string ids. `useJjomSync.ts:833-835` documents that the reducer's generic pointer path maintains only `pointedBy`, **not** named stored arrays like `edgesIn`/`edgesOut` — by the same logic, a deleted object's id is unlikely to be auto-stripped from other instances' `values` arrays. → confirm in the same runtime experiment (OQ-2).

### Q5 — M1 reference edge sync in v2-flow ✅ (a hook exists)

**Yes, `useM1ReferenceEdges` exists** (`components/editor-v2/hooks/useM1ReferenceEdges.ts`) and is **wired**: `EditorV2.tsx:48` import, `EditorV2.tsx:357` call `useM1ReferenceEdges(modelid, graphId)`.

- It maintains a **reactive selector keyed on the actual slot values** — a sorted hash of `(srcObjId, refMetaId, tgtObjId)` tuples read from `dFeat.values` (`useM1ReferenceEdges.ts:36-58`). **This is precisely what re-fires on a `SetFieldAction` over `DValue.values`** — closing the gap that `useJjomSync` Step 4 leaves.
- On change it creates missing `DVoidEdge.new2(refMetaId, graph, graph, undefined, srcV, tgtV, d=>d.isReference=true)` (`:120-131`), guarded by `existingKeys` **and** `hasCanvasEdgePair(ek)` (`:106`), and calls `markCanvasEdgePair(srcV,tgtV)` after (`:130`) — mirroring CLAUDE.md §3.4. No outer `TRANSACTION` (comment `:85-88`).
- **`useJjomSync` Step 4 deps** (`useJjomSync.ts:942`) are `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelRefTypeSig, modelObjectCount]`. `modelObjectCount` = `rawModel.objects.length` (`:305-309`); `modelRefCount` = **M2** DReference count (`:328-343`). **None is a signature over `DValue.values`**, so Step 4 alone does **not** re-fire when only a reference is linked between two pre-existing objects. Step 4 *does* re-fire when an object is created (count changes) and runs at mount for `missingM1EdgeCount > 0` (`:883-928`). So at **editor (re)open**, Step 4 backfills edges; **live during a session**, `useM1ReferenceEdges` is what creates them.
- **Both endpoints must already have vertices** (`vertexByModel.get(objId)`/`get(tgtId)`, `:93,103`). JjScript-created instances are root objects → they get vertices from Step 2bis (`useJjomSync.ts:665-692`).

**Verdict (Q5):** If Jjodie generates `create instance` + `set <ref>` for a state machine **and the v2-flow editor for that M1 model is mounted**, the transition reference edges **do appear without manual interaction** (via `useM1ReferenceEdges`). If the script runs while that editor is closed, the edges appear on next open (Step 4 init). The standard `hasCanvasEdgePair` guard is already applied; no new guard is needed for the JjScript path. **The blocking issue is not edge sync — it is whether the script executes at M1 at all (Q8).**

### Q6 — Jjodie M1 context pipeline

The M1 context string is built by **`JjodieContextService.getContextString(project, activeArtifact)`** (`services/JjodieContext.ts:316-319`), invoked from `Jodie.tsx:109-134` (memo `projectContext`). `JodieHeader.getMetamodelContext()` (`JodieHeader.tsx:53-102`) is **only the UI badge** (`{projectName, metamodelName, level}`) and is **not** sent to the LLM.

**(a) Serialization content — instances are NOT serialized.** For `activeArtifact.level==='M1'`, `resolveMetamodelScope` (`JjodieContext.ts:85-112`) resolves the **conformity metamodel** (via `activeArtifact.metamodelId`, else the model's `instanceof`), and `extractFromProject` walks **that metamodel's `classes`/`enumerations`/`packages`** (`:124-135`). The output (`buildContextString` `:242-309`) is a "Currently editing: <model> (M1 model)" header followed by the **metaclass structure**. It contains **no instances, no instance attribute values, no instance reference slots** — only M2 structure.

**(b) Metamodel structure IS included.** Per metaclass: name, `(abstract)` flag, `extends`, attributes (`name: type [mult]`), references (`name: target [mult]` with `→`/`◆→`/`△→` icon for association/composition/inheritance), plus enums (`name: LIT | LIT`) and packages (`JjodieContext.ts:258-306`). Multiplicities via `getMultiplicity` (`:365-380`). **The model→metamodel link field is `instanceof`**: `LModel.instanceof?: LModel` / `DModel.instanceof?: Pointer<DModel>` (`model/logicWrapper/LModelElement.tsx:4845, 4707`); `Jodie.tsx:116` reads `(activeModel).instanceof ?? (activeModel).metamodel`, and `JjScriptService.ts:80` reads `(activeModel).instanceof`. **This is exactly the metamodel context a generator needs** — classes/refs/multiplicities are present.

**(c) Context size — bounded by metamodel size, not instance count.** Because instances are not serialized, the context length is **O(#metaclasses + #refs + #enums)** and is **independent of N instances**. Generating a 200-instance state machine does not grow the context. (RAG augmentation in `ChatMessages`/`Jodie.tsx:501-514` may add more, but the structural part is bounded.)

> Implication for the target use case: the metamodel *structure* is available to the LLM, which is sufficient to generate a conformant instance script. What is **missing** is any view of the *existing* instances — Jjodie cannot "see" or reference instances already present in the model when generating.

### Q7 — Prompt sources and composition

There are two prompt artifacts; **only one reaches the LLM on a chat turn.**

1. **`constants/defaultPrompts.ts` → `CHAT_PROMPT`** (the user-editable system prompt). It is **M2-only**: it teaches `create class / attribute / reference / containment / enum / literal / delete class / rename class`. It has **no `### M1 INSTANCE COMMANDS` section**. It contains the `{{#if projectContext}} … {{projectContext}} … {{/if}}` block (`defaultPrompts.ts:171-179`).
2. **`jjodie-integration/jjscriptGenerationPrompt.ts` → `JJSCRIPT_GENERATION_PROMPT` / `buildSystemPromptWithJjScript`**. This is the **only** place that documents M1 commands (`### M1 INSTANCE COMMANDS`, `:67-115`). **It is dead code on the chat path**: a repo-wide grep finds it referenced only by the re-export in `jjodie-integration/index.ts:24` — **no runtime consumer** calls `buildSystemPromptWithJjScript` or concatenates `JJSCRIPT_GENERATION_PROMPT`.

**What is actually sent on a chat turn:** `ChatMessages`/`Jodie.tsx:519` → `AIProviderService.chat(content, provider, history, augmentedContext, …)` → `context = { customVariables: { projectContext: augmentedContext } }` → **`systemPrompt = PromptService.getRendered('chat', context)`** (`AIProviderService.ts:64-67`). So the system prompt is `CHAT_PROMPT` (or the user's override) with `{{projectContext}}` interpolated. `{{projectContext}}` is interpolated **only into the `'chat'` prompt** (`defaultPrompts.ts:176`), and `projectContext` is the **metamodel structure** from Q6.

**Conclusion (Q7):** On every chat turn the LLM receives the M2-only `CHAT_PROMPT` + the metamodel-structure `projectContext`. **The M1 command documentation never reaches the model.** Without it, Jjodie has no instruction to emit `create instance of …` / M1 `set …` and is in fact steered toward M2 (`"JjScript is the ONLY way to create metamodel elements"`, `defaultPrompts.ts:40-44`).

### Q8 — Execution path from chat ⚠️ (level not resolved on the Run path)

A generated ```jjscript``` block renders via `MessageBubble` → `MarkdownMessage` → **`ScriptBlock`** (`jjscript/components/ScriptBlock.tsx`), which has a **Run** button that drives execution **line-by-line**, calling `onExecute([commands[i]], resolvedTarget?.id)` (`ScriptBlock.tsx:320, 530, …`). `onExecute` is `ChatMessages.handleJjScriptExecute` (`ChatMessages.tsx:388`).

- **`handleJjScriptExecute`** (`ChatMessages.tsx:316-361`) guards on project/metamodel presence (`getProjectContext` `:258-289`) and then calls **`executeCommand(command)`** with **no `projectId`/`modelId`/`targetMetamodelId`/`level`** (`ChatMessages.tsx:339`). It also **ignores** the `targetId` ScriptBlock passes.
- **`executeCommand(command)` bare** → `getExecutor(undefined,undefined,undefined,undefined)` (`executor.ts:322-331`). With all args `undefined`, `needsNew` reduces to `!executorInstance` (`executor.ts:307-311`): it **reuses whatever singleton already exists, with its existing `level`**, or creates one with `level=undefined`.
- **Only `JjScriptService.execute()` sets `level:'M1'`** — it derives `level = getActiveLevel()` + `modelId`/`targetMetamodelId` from `_activeArtifactCache`/active tab (`JjScriptService.ts:74-90`) and is used for **directly-typed** chat commands (`Jodie.tsx:390`). The **Run-button path bypasses it.** `JjScriptConsole.tsx:51` calls `executeCommand(command, projectId, modelId)` — also **without `level`**. A grep confirms no other caller passes `level`, and **nothing seeds the singleton with M1 on tab change.**

**The T1/T2 context guard exists** but lives in the handlers: `executeCreateInstance` (`instance.ts:159-169`) and the others reject when `context.level !== 'M1'`; `executeCreate` rejects non-`instance` types when `level==='M1'` (`create.ts:166-176`). These guards depend entirely on `context.level`.

**Verdict (Q8):** When the user clicks **Run** on a Jjodie-generated `create instance …` block, the executor singleton typically has `level=undefined` (or a stale `'M2'`), so **`executeCreateInstance` returns `WRONG_LEVEL` and the instance is not created** — *unless* the user had previously typed an M1 JjScript command in the chat input (which routes through `JjScriptService.execute` and sets the singleton to M1). The bare path does **not** resolve the active model via `getActiveModel()`/`_activeArtifactCache`. **This is the single biggest blocker for the target use case**, independent of the prompt gap in Q7.

---

## 3. Gap list (ranked by impact on "generate a state machine model from a prompt")

| # | Gap | Evidence | Fix touches | Critical-zone? |
|---|---|---|---|---|
| **G1** | **Run-button execution does not set `level:'M1'`.** Generated `create instance` blocks fail `WRONG_LEVEL` unless the singleton was previously M1-initialized. | `ChatMessages.tsx:339` (bare `executeCommand`); `executor.ts:307-311`; `JjScriptService.ts:74-90` | `ChatMessages.tsx` (route through `JjScriptService.execute`, or pass `getActiveLevel()`+model+metamodel) | No |
| **G2** | **M1 command docs never reach the LLM.** `JJSCRIPT_GENERATION_PROMPT`'s `### M1 INSTANCE COMMANDS` is dead code; `CHAT_PROMPT` is M2-only and actively steers toward metamodel edits. | `defaultPrompts.ts:38-179`; `jjscriptGenerationPrompt.ts:67-115` (no consumer); `AIProviderService.ts:64-67` | `defaultPrompts.ts` (add an M1 section, ideally gated on level) or wire a level-aware prompt selector | No |
| **G3** | **Context lacks existing-instance view.** `projectContext` for M1 serializes only the metamodel; Jjodie cannot see/extend instances already in the model. | `JjodieContext.ts:124-135, 242-309` | `JjodieContext.ts` (add optional M1 instance serialization, size-bounded) | No |
| **G4** | **`set` on references always appends; no replace / single-remove; ignores `+=`/`-=`.** Mono-valued refs accumulate duplicates; the LLM cannot express "replace target". | `instance.ts:610-612` (operator unused) | `instance.ts` | No |
| **G5** | **Enum-typed attributes not settable by literal name** (only as a quoted string, no validation). The dead M1 prompt even tells the LLM to use `Enum.LITERAL`, which fails. | `instance.ts:140-148, 478-488`; `parser.ts:1197-1223` | `instance.ts` (+ parser if `Enum::LIT` value form is wanted) | No |
| **G6** | **`delete instance` likely leaves an orphan DVertex** (and dangling pointers in other slots) — no `syncDeleteVertex`. | `instance.ts:311-312`; `canvasToJjom.ts:259`; `useJjomSync.ts:833-835` | `instance.ts` (call a vertex-cleanup) — would touch sync-adjacent code | **Yes** (vertex/edge removal) — needs Layer Impact Report |
| **G7** | **No containment instance creation** (`create instance … in <parent>` parsed but ignored); JjScript builds only flat root instances. | `instance.ts:154-265` (`args.parent` unused); `parser.ts:270-272` | `instance.ts` (+ a containment grammar decision) — would touch D-layer father=DValue + Step 2bis vertex coverage | **Yes** if vertices for nested objects are required |
| **G8** | **`let $x = create instance …` cannot bind a command result.** `let` RHS is JjEL only; body var-substitution covers only `set.value`/`rename.newName`. | `let.ts:79-97, 143-205` | `let.ts` | No |

**Lowest-effort path to a working demo** = **G1 + G2** (route the Run button through M1 context, and put M1 command docs into the chat prompt). With those two, edge rendering (Q5) already works via `useM1ReferenceEdges`, and the metamodel context (Q6) is already sufficient. G3-G5 raise quality; G6-G7 are the only items that touch the critical zone.

---

## 4. Open questions requiring a runtime experiment (for Alfonso, not run here)

- **OQ-1 (nested objects → vertices).** Create a containment instance via the *visual* editor (or `addObject` into a containment slot) so a DObject has `father = DValue`. Inspect `windoww.store.getState().idlookup[modelId].objects` — is the nested child present? Then check whether it received a DVertex (`useJjomSync` Step 2bis iterates `model.objects` only). Settles whether Step 2bis/2.5 covers nested DObjects (2026-05-14 Open Q6).
- **OQ-2 (`delete instance` cleanup).** In an M1 model: create `a`, `b`; `set a.ref = b`; `delete instance b`. Inspect: (i) is `b`'s DVertex still in `graph.subElements`? (ii) does `a`'s `$ref.__raw.values` still contain `b.id` (dangling pointer)? (iii) is the DVoidEdge `a→b` orphaned? Confirms G6 severity and whether `DeleteElementAction` cascades to the vertex/edge.
- **OQ-3 (singleton level leakage).** Open an M1 model, type a valid M1 command in the chat input (e.g. `create instance of Foo "x"`) so `JjScriptService.execute` sets the singleton to M1; **then** click Run on a generated `create instance` block. Verify the block now succeeds — confirming that G1's only "accidental" success path is prior `JjScriptService.execute` use, and that a fresh session fails.
- **OQ-4 (end-to-end edge appearance).** With G1 worked around (via OQ-3 priming), run a small generated script: two `create instance of State` + one `create instance of Transition` + `set t.source = s1` + `set t.target = s2`, with the v2-flow editor open. Confirm two DVoidEdges appear live (via `useM1ReferenceEdges`; enable `window.__m1RefEdgesDebug` to log, `useM1ReferenceEdges.ts:115`).

---

## 5. One-paragraph synthesis

The **engine substrate for M1 generation already exists and is more complete than prior notes suggested**: the parser accepts `create instance of`, `set` (attributes + reference links), `delete`/`rename` instance; the executor writes through the documented `DObject.new` / `$feature` patterns; and v2-flow edge sync for M1 references is solved by the wired `useM1ReferenceEdges` hook (plus Step 4 at init), with the metamodel structure already serialized into Jjodie's context. The feasibility blockers are **not** in the rendering/sync layer — they are two wiring gaps: **(G1)** the chat Run button executes JjScript without an `'M1'` context level, so generated instance commands are rejected by the T1 guard; and **(G2)** the M1 command documentation is dead code that never reaches the LLM, whose live prompt is M2-only. Fixing those two (both outside the critical zone) is sufficient for a first working "generate a state machine" demo; the remaining gaps (reference replace-semantics, enum-by-name, `delete` vertex cleanup, true containment) are quality/robustness items, of which only the last two touch the sync critical zone.

# Discovery 2026-10-31 — plugin mechanism: census of the extension points and sandbox probe

- Prompt-ID: P-2026-10-31-1800 (`docs/prompts/claude_2026-10-31_1800_prompt_plugin_mechanism_discovery.md`)
- Chat: C-2026-10-31-1743 · Front: plugins · Session: 05a4e6d9-c94a-4d33-8c90-bb90a6495765
- Tree: `~/jjodel-w-plugins`, branch `plugin-discovery`, HEAD `de519893f` (from `alfonso-frontend-jjtl` 9654de9b6)
- Executor: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Downstream readers re-read the real files.
- Tags: **[measured]** = run in this phase (Chromium 151.0.7922.34, Playwright, this tree); **[read]** = read in a file
  at HEAD `de519893f`, not executed.

## 0. Answer in brief

- **H1 partly holds.** Six mechanisms keep a data artifact read by a host interpreter (IR views, validation rules,
  STC roles, `ontoBindings`, generators, Refactorings). Only STC, `ontoBindings` and codegen bind abstract roles. Shapes,
  problem kinds, builtins, menus, panels and I/O are closed code, not extension points. Classic view fields persist code.
- **H2 holds in the worker, not on the iframe main thread** [measured, Chromium 151 only]. Blob worker under a header or
  meta CSP: 0 egress over 15 vectors, 0 storage reads, round trip intact (1.2 MB: ~5 ms as a string, ~61 ms as an object).
  The iframe main thread still leaks via WebRTC, self-navigation and `<meta refresh>`, with no CSP directive for any of them.
  A same-server worker URL cannot start from an opaque origin; blob only. Bootstrap must be hash-pinned, not nonce-pinned.
- **H3 partly holds.** One choke point (`Action.fire`) and one undo group exist, but writes are not an action list; the
  validation point is the JjScript command (guard, planner, preview, `applyAsOneStep`).
- **Main risk** [read]: opening a project runs stored view code with `new Function` in the host (`reducer.ts:542 → 862`).
- **Recommendation**: first slice = re-host instance-of semantics (`bindingReader`/`bindingCheck`) as a worker plugin,
  bound through `ontoBindings v1`, writing `set` lines through `applyAsOneStep`; not the JS generator.

Decisions awaiting Alfonso and questions (details in §11):
1. Stop classic view code from running on open without consent?
   Recommended: yes, before any plugin work.
2. Plugin UI: host-rendered declarative description, or plugin DOM on the iframe main thread?
   Recommended: host-rendered description; plugin DOM reopens the three leaks.
3. Action channel: JjScript lines or a new typed command list?
   Recommended: JjScript lines through the existing planner, preview and undo group.
4. Should Script Run and chat Run open an undo group too?
   Recommended: yes, so the plugin channel shares one undo rule.
5. Separate sandbox origin for plugin frames in the first slice?
   Recommended: no for the slice, yes before any third-party plugin.
6. One shared role-catalog format for STC, `ontoBindings` and codegen?
   Recommended: yes, `ontoBindings` first, STC last (runSignature hazard).
7. First slice: instance-of semantics or the JS generator?
   Recommended: instance-of semantics.

## 0b. Verdicts with evidence

| Hypothesis | Verdict | One-line evidence |
|---|---|---|
| **H1** every extension point = persisted artifact + binding to abstract roles (possibly empty) + host interpreter | **Partly holds** | Holds for the six data-shaped mechanisms (IR views, validation rules, STC roles, `ontoBindings`, generators, Refactoring artifacts). Falsified for two groups: the host-code tables (shape registry, problem kinds, JjEL builtins, console languages, I/O, menus, panels) are closed code rather than extension points, and the classic view fields persist **code**, which the reducer executes (§3, row 13). |
| **H2** sandboxed iframe (no `allow-same-origin`) + egress-forbidding CSP + Web Worker blocks every egress and every host-storage read, with postMessage still working | **Holds for the worker; falsified for the iframe's main thread** [measured] | Blob worker: 0 egress over 15 vectors in both the header and meta CSP modes, 0 storage reads, and the round trip is intact. The iframe main thread still leaks under any CSP through WebRTC (UDP to STUN), self-navigation and `<meta refresh>`. CSP has no shipped directive for any of the three. In run 1 a nonce-allowed bootstrap also leaked dynamic `import()`; a hash closes that (run 2). |
| **H3** one place where L-layer writes are applied, where a host can validate a plugin's action list and apply it as one undo group | **Partly holds** | One choke point exists: `Action.fire` → `store.dispatch` (`action.ts:319`, `:349`), and one undo-group primitive (`reducer.ts:1136-1158`). The writes are not an action list, though: JjScript commands call D constructors directly, interleaved with awaits and settles, and the undo group is a time window that folds **every** delta of the user. The natural validation point is the command (JjScript line), not the action. |

## 1. Objective

Test whether the code base can carry the six unratified principles of the plugin front (see the prompt's Contesto):
a census of the de facto extension points, a role-catalog comparison, the write paths, the evaluation budgets, and a
browser probe of the sandbox. No product code was changed.

## 2. Files read (full paths, all under `/Users/alfonso/jjodel-w-plugins/`)

`frontend/src/model/simulation/stcFromRoles.ts` (whole), `frontend/src/model/simulation/roleCatalog.ts` (1-100 + grep),
`frontend/src/model/ontological/bindingCodec.ts` (whole), `frontend/src/model/ontological/bindingReader.ts` (1-25),
`frontend/src/codegen/stcAccess.ts` (1-40), `frontend/src/codegen/engine/generatorCodec.ts` (1-40),
`frontend/src/codegen/engine/templateCodec.ts` (grep), `frontend/src/codegen/engine/templates.ts` (1-30, 75, 224),
`frontend/src/codegen/engine/generate.ts` (grep), `frontend/src/codegen/runner/runner.worker.ts` (1-40 + grep),
`frontend/src/codegen/runner/protocol.ts` (1-40), `frontend/src/jjel/evaluator/evaluator.ts` (87-93, 112-132, 255-270),
`frontend/src/jjel/evaluator/context.ts` (385-400), `frontend/src/components/Jodie/jodieJjelContext.ts` (grep 62-98),
`frontend/src/jjscript/executor/runPasses.ts`, `elementWaiter.ts`, `commands/eval.ts`, `commands/create.ts` (grep),
`frontend/src/jjscript/executor/permissionGuard.ts` (1-25), `frontend/src/jjscript/components/ScriptBlock.tsx` (600-612),
`frontend/src/components/editor-v2/preview/PreviewBar.tsx` (1-110), `frontend/src/components/abstract/tabs/ScriptTab.tsx` (grep),
`frontend/src/components/Jodie/ChatMessages.tsx` (grep 534-540), `frontend/src/components/Jodie/console/languageRegistry.ts` (1-40),
`frontend/src/redux/action/action.ts` (95-175 grep, 315-354), `frontend/src/redux/reducer/reducer.ts` (526-546, 691-743,
828-887, 908-997 grep, 1126-1180), `frontend/src/redux/VersionFixer.tsx` (grep 1087-1131),
`frontend/src/components/editor-v2/problems/registry.ts` (1-55 + exports), `frontend/src/model/validation/validationTypes.ts`
(1-40, 116-170), `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (1-30), `irTypes.ts` (65-70, 980-995),
`shapeRegistry.ts` (1-30, 101-160, 335), `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx` (1-30),
`frontend/src/components/editor-v2/nodes/ClassNode.tsx` (418-440), `frontend/src/view/viewElement/view.tsx` (1030-1056,
1577-1588), `frontend/src/common/U.tsx` (grep), `frontend/src/components/scripts/scriptFiles.ts` (1-25),
`frontend/src/pages/components/Navbar.tsx` (grep 1416-1422), `frontend/src/components/abstract/DockManager.tsx` (grep),
`frontend/src/services/export/index.ts` (grep), `frontend/src/model/simulation/bvToSmv.ts` (1-20),
`frontend/src/joiner/classes.ts` (grep 1478, 2340-2351), `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` (192-227),
`docs/decisions.md` (R-RFB rows 6867-6888, R-JJD-6 6791), `frontend/scripts/probe/codegen-runner.ts` (1-40).

Not read (time budget): the three other specs in RIFERIMENTI beyond the decisions rows; `netCompile.ts`, `profileBinder.ts`,
`validationEvaluator.ts`, `EcoreService.ts`/`XMIService.ts` bodies. Claims about them are limited to their headers and exports.

## 3. Census of the extension points [read]

Searches used (all through `command grep` = BSD grep, which honours `--include`):
`grep -rn -E "simNode|ROLE_CATALOG|roleOfKey"`, `grep -rn "beginUndoGroup|endUndoGroup"`, `grep -rn -E "new Function\(|eval\("`,
`grep -rn -E "VIEWS_RECOMPILE_(all|constants)"`, `grep -rln -E "plugin.*(registry|manifest)"` (empty),
`grep -rln -E "sandbox=|\.sandbox"` (empty), `grep -rl "Content-Security-Policy" .. --exclude-dir=node_modules` (empty;
positive control on the same command: `"<html"` finds `frontend/index.html`, `test.html`, `public/index.html`),
`grep -rn -E "new Worker\("` (Monaco workers in `index.tsx:49-72` and the codegen runner only).
So: no plugin registry, no manifest, no sandboxed iframe, and no CSP exist in the frontend today.

| # | Mechanism | Registered / discovered | Reads | Writes (layer) | Persists, travels with | Data / code | Versioned / migrated | Missing or broken |
|---|---|---|---|---|---|---|---|---|
| 1 | IR viewpoints + interpreter | `DViewElement.ir` (`irTypes.ts:988` `ir: AnyViewIR`), compiled once per view by `irCompile.ts:1-8` | M1/M2 via `ReadCtx` (spec §12) | none at render; authoring via view setters (L) | project `idlookup`; viewpoint travels with project | **data** (JSON IR, JjEL-free path exprs) | `irVersion: 'ir-1.x'` per view; VersionFixer `2.225 → 2.226` (`VersionFixer.tsx:1087-1131`) | spec §10: «view in errore di compilazione → la view è esclusa dall'indice con warning in console; l'elemento cade … sul rendering astratto»; R-IRN-3: Template tab read-only, keyed on `irLegacyClassic` |
| 2 | User-defined validation (R-VAL) | `DValidationViewpoint` singleton `VALIDATION_VIEWPOINT_ID = 'Pointer_ValidationViewpointDefault'` (`validationTypes.ts:116-123`) | M1 via JjEL (`validationEvaluator.ts`, not read) | problems registry only (session) | `idlookup`; R-VAL-10 says it follows the metamodel on import | **data**: `DValidationRule {context: Pointer<DClass>, body: string, message, enabled}` (`:163-170`) | «nessuna migrazione e nessun bump di versione» (`:26-36`) | not read |
| 3 | Problems registry + kinds | module-level Map (`registry.ts:1-10` «session-local … immune to undo/redo and not persisted») | producers | none in store | not persisted | **code**: closed union `NodeProblemKind = 'duplicate-name' \| 'conformance' \| 'validation' \| 'classifier-kind' \| 'simulation' \| 'containment'` (`:55`); adding a kind «NON e' "aggiungere una proprieta' opzionale"» (`:30-31`) | n/a | n/a |
| 4 | Simulation STC roles | flat `sim*` keys of the metamodel `_state` bag; catalog `ROLE_CATALOG` (`roleCatalog.ts:182`), «The one catalog of the simulation roles (R-SIM-47)» (`:2`) | M2 ids in the bag | bag via `state` setter (L, one SetFieldAction) | metamodel `_state`; dropped by `.ecore` (`bindingCodec.ts:17` says the same of the Simulation roles) | **data** | no `v`; profile codec `profileCodec.ts` (not read) | `overlapVerdict` refuses or warns (`stcFromRoles.ts:78-86`) |
| 5 | Instance-of `ontoBindings` | bag key `ONTO_BINDINGS_KEY = 'ontoBindings'` (`bindingCodec.ts:21`) | M2 ids | bag (L) | metamodel `_state`, «The `.ecore` export drops the whole bag» (`:17`) | **data** `{"v":1,"bindings":[…]}` (`:5-6`) | `v:1`, unknown keys preserved, «an unknown `v` is refused, never guessed at. No VersionFixer step» (`:13-15`) | decode returns `{ok:false, errors}`. Today there is no consumer outside `model/ontological/` (search `bindingReader\|bindingCheck\|decodeOntoBindings` → only the three files themselves) |
| 6 | Code generators (R-GEN) | bag keys `genTemplates`, `genGenerators` (`generatorCodec.ts:38`, `templateCodec.ts:35`) | M1 through JjEL handles + STC through `stcAccess.ts` | bag (L): «one `set_state`, one undo step per Save» (`generatorCodec.ts:27`); generated code runs in a module worker (`runner.ts:41`) | metamodel `_state` | **data** (templates = JjEL, `templates.ts:5`) → **code** generated, executed in the worker | `v:1`, tolerant decoding, «no migration, no write on open» (`generatorCodec.ts:17`) | per-template problems; a broken template is not evaluated (`templates.ts:13-17`) |
| 7 | Refactoring artifacts (R-JJD-14) | `DProject.scripts` (`scriptFiles.ts:4` «The list lives on `DProject.scripts` and is written back whole with one `SetFieldAction`») | JjScript text | through the JjScript executor (D constructors + SetFieldAction, see §5) | **project**, not the metamodel | **data** (JjScript text, confined language) | none seen | not read |
| 8 | Jjodie Tools menu | hard-coded `MenuEntry` in `Navbar.tsx:1416-1422` (`tools_run_refactoring`) | the active artifact + its Refactorings | via 7 | n/a | **code** | n/a | entry disabled when not applicable (R-JJD-17) |
| 9 | Shape registry | `SHAPE_REGISTRY: Readonly<Record<ShapeForm, ShapeDescriptor>>` (`shapeRegistry.ts:335`), closed union `ShapeForm` (`irTypes.ts:65-66`) | IR shape | none | n/a (form name persisted in IR) | **code table**: «Modulo puro: nessun React…» (`shapeRegistry.ts:16`) | IR version | — |
| 10 | Importers / exporters | `services/export/index.ts:6-7` exports `EcoreService`, `XMIService` (+ `JsonModelService`); no registry | files | D-layer (not traced) | n/a | **code** | — | `.smv`: «There is no `.smv` exporter: this is what its lane consumes» (`bvToSmv.ts:13`) |
| 11 | JjEL builtins + evaluation context | per context, `registerBuiltin` (`templates.ts:224`), `createFunction` (`jjtl/executor/executor.ts:1035-1064`) | JjEL values | none (pure) | n/a | **code** | — | evaluation error |
| 12 | Console languages, panels, commands | `consoleLanguageRegistry` with 3 providers registered at module load (`languageRegistry.ts:36-40`); `DockManager` static openers + `TabDataMaker` factories (`DockManager.tsx:153-266`); the command palette has a local `CommandSuggestion` type (`CommandPalette.tsx:10`) | — | — | — | **code**, closed | — | — |
| 13 | **Classic view code fields** (found, not in the prompt's list) | `DViewElement.constants`, `usageDeclarations`, `jsCondition`, events, `jsxString` | anything in `window` | anything | **project file** | **code**, compiled with `new Function` in the reducer | `jsxString` migrations (rule 14) | `console.error('error constants parse', …)` (`reducer.ts:865`) |

Row 13 in detail, because it bears on principles 1 and 4. On `LoadAction` (`reducer.ts:526`) the reducer sets
`newState.VIEWS_RECOMPILE_all = true;` (`:542`, comment: «Force recompilation of all view CSS after project load»).
That becomes every id of `idlookup` (`:691`), and every `VIEWS_RECOMPILE_*` list gets each view (`:713`). Then for
`constants`: «compiled in func, and executed, result does not vary between nodes» (`:846`), with
`new Function(paramStr, 'return ('+dv.constants+')(ret)')` followed by `constantsFunction(context, constantsOutput);`
(`:862-863`), in the host realm («the scope of new Function() is "window"», `:861`). `usageDeclarations`, events and
`jsCondition` are compiled the same way (`:908`, `:958`, `:997`). So today **opening a project runs code stored in that
project, with the app's full privileges and no consent**. The spec acknowledges that legacy views have no sandbox: «nessun
sandbox (escape hatch rinviato)» (`ir_schema_v1_2.md:213`). Evidence is read, not run: no crafted project was opened in
this phase. `ViewpointRenderer.tsx:17` (`new Function('React', 'data', …)`) runs from `ClassNode.tsx:424` only when
`data.jsxString` is set; a search for `data\.jsxString|jsxString *:` found no producer, so this path is probably dead.

**H1 reading.** The six data rows (1, 2, 4, 5, 6, 7) fit «artifact as data + binding + host interpreter». Only 4, 5 and 6
(through `stcAccess`) bind to **abstract roles**. Views (1) bind to concrete metaclass lists, rules (2) to one concrete
`context` class, and Refactorings (7) bind to nothing: these are «possibly empty» bindings. Rows 3 and 8-12 are closed host code
(unions, hard-coded menus, module-load registration), so they are **not** extension points today. A plugin that adds a
shape, a problem kind, a panel or an importer needs a registry that does not exist. Row 13 breaks the pattern: its
artifact is executable code.

## 4. Role-catalog comparison [read]

| | STC roles | `ontoBindings` | codegen's view of the STC |
|---|---|---|---|
| Binding shape | flat bag keys `simNode`, `simTransition`, … → M2 id; some `multi` (JSON array string, `roleCatalog.ts:16-19`); `int`/`derived`/`declarations` kinds (`:42-51`) | one key, list of named records `{name, typeReference, featureContainer?, generalization?, slotContainer?, …, valueKinds?}` (`bindingCodec.ts:39-57`) | none of its own: reads the STC through `netStcFromRoles` + profile (`stcAccess.ts:5-10`) |
| Abstract metamodel | implicit in `ROLE_CATALOG`: id, group, key, kind, `dependsOn`, label, description (`roleCatalog.ts:53-64`), and a profile picks a mode per role (`:7`) | implicit in the TS interface; a second record means a second application of the relation (`:7-8`) | the catalog of 4 (it imports `ROLE_CATALOG`, `stcAccess.ts:32`) |
| Codec | ad hoc per key; `roleValues`/`encodeRoleValues` (`:211-232`); profile codec | `decodeOntoBindings`/`encodeOntoBindings`, `v:1`, unknown keys kept | `generatorCodec`/`templateCodec` `v:1` for templates, not for the binding |
| Validation | `roleOverlaps`, `overlapVerdict` (disjointness, R-SIM-16), `dependentsOf`, `bindingCompat.ts` | shape in the codec, rules in `bindingCheck.ts` (`:11-12` of the codec) | template problems (`templates.ts:13-24`) |
| UI | Simulation panel role rows (`SimulationPanel.tsx:109-146`, `simRoleStatus.ts:74`) | none yet | Code panel / template editor |
| Interpreter | `netCompile.ts` (`netStcFromRoles`) | `bindingReader.ts` (pure, over `OntoReadView`, «nothing writes», `:5-6`) | JjEL evaluator + worker runner |

A fourth consumer turned up: `viewpointDerivation.ts:89,143` maps role keys to element ids to derive viewpoints
(`{ role: 'node', key: 'simNode' }`). So the STC catalog already has three readers (simulator, codegen, derivation) and
one writer (panel). `ontoBindings` has none outside its module.

**Could one abstraction describe all three?** Yes, as a *catalog* (role id, kind ∈ {class, reference, attribute, value,
derived, record-list}, cardinality, `dependsOn`, constraint hooks) + a *binding codec* (`v`, unknown-key preservation) +
an *interpreter* that reads through a narrow view. Gains: one manifest format for plugins, one binding UI, one
validation pass (existence of ids, kinds, `dependsOn`), and codegen templates able to read any catalog, not only the STC.
Losses: the STC's flat-key storage would have to become a versioned record or carry an adapter. `runSignature` folds every
`sim*` key, so a move would interrupt runs (`bindingCodec.ts:8-9` names this exact hazard as the reason `ontoBindings`
is not a `sim*` key). Constraints that span roles (R-SIM-16 disjointness under `isKindOf`, the event role derived from Trigger)
stay host or plugin code, not catalog data. `ontoBindings`' multi-record shape («a second application of the relation…
is a second record») has no STC counterpart, so the catalog needs an «instances of this record» cardinality. Codegen gains
the most and loses nothing.

## 5. Write paths (H3) [read]

| Path | Entry | Undo group | Down to the store |
|---|---|---|---|
| Script editor Run / Jodie code block Run | `ScriptBlock.tsx:606` `runPasses(commands, executeLine, …)` | **none** (`beginUndoGroup` is called only in `PreviewBar.tsx:61`; search over `src`) | `JjScriptService.execute` per line |
| Jodie chat command / console | `ChatMessages.tsx:540`, `jjscriptProvider.ts:21` `JjScriptService.execute(…)` | none | same |
| Jodie Apply (ghost preview) and Refactoring tab Apply | `applyAsOneStep` (`PreviewBar.tsx:60-70`; `ScriptTab.tsx:305`) | `beginUndoGroup()` … flush COMMIT, `sleep(SETTLE_MS)`, flush, `endUndoGroup()` | `runPasses` → `JjScriptService.execute(commands[i], scope)` (`:87-95`) |
| Refactoring operations (R-RFB) | the same Apply; «one TRANSACTION each with a settle, inside one R-JJD-6 undo group; never a single TRANSACTION» (R-RFB-3, `decisions.md:6872`) | yes | same |
| JjScript command handlers | e.g. `create.ts:510` `DClass.new(…)`, `:524` `SetFieldAction.new(newClass, 'extends', …)` | — | D constructors and actions, **not** L-proxy setters |
| All of the above | `Action.fire` (`action.ts:319`): inside a BEGIN it pushes to `pendingActions` (`:329-330`), else `setTimeout(()=>storee.dispatch({...this}), 0)` (`:349`) | — | reducer |

They converge at two levels. At the **command** level, every path goes through `JjScriptService.execute`, which already
runs `permissionGuard` («It runs once per command, before dispatch», `permissionGuard.ts:7-9`) and `checkBoundScope`.
At the **action** level, `Action.fire` is the one way into `store.dispatch`. The action level is the wrong place to
validate a plugin's list: creators return temporary ids (`model/CLAUDE.md` §9.1), handlers wait on the store
(`elementWaiter.ts:19` `MAX_WAIT_MS = 500`), and retries run in passes (`runPasses.ts:68` `MAX_RETRY_PASSES = 3`). So
the action list does not exist ahead of time. The command level is a good place: a plugin proposes JjScript lines,
and the host already has a planner (`effectsPlanner.ts:986`), a ghost preview, a permission guard and the undo group.

The undo group is a **time window**: «the deltas a user pushes between `beginUndoGroup` and `endUndoGroup` become one
undo entry» (`reducer.ts:1127-1128`), keyed on the user, and it «flushes the pending 300 ms COMMIT before calling end»
(`:1132`). It also folds any unrelated write the same user makes during the window (sync layer included, by design).
A plugin channel has to keep the window closed to other gestures while it applies, as `PreviewBar` does with `busy`.

R-RFB-12 does not exist (`npm run decisions` reported «not found: R-RFB-12»; `decisions.md` has R-RFB-1..8). The
mechanism the prompt means is R-RFB-3 + R-JJD-6. `decisions.md:6887-6888` leaves open «whether Jjodie's Run and the
script editor's Run open an undo group too», and the code says they do not.

Writes outside the L-layer: the JjScript handlers write through D constructors and `SetFieldAction` (above). The
reducer executes stored view code (§3 row 13). Critical-zone files were read only.

## 6. Evaluation budgets [read]

| Engine | Bound | Where |
|---|---|---|
| JjEL | optional wall-clock `deadline`, checked at the entry of every `evaluate` node: `if (evalCtx.deadline !== undefined && Date.now() > evalCtx.deadline) throw new JjelTimeoutError` (`evaluator.ts:264-266`), inherited by children (`context.ts:392-397`) | set only by Jodie: `JJEL_LIVE_DEADLINE_MS = 500`, `JJEL_CONVERSATION_DEADLINE_MS = 2000` (`jodieJjelContext.ts:93,96`); `range()` capped at `RANGE_MAX_LENGTH = 1_000_000` (`evaluator.ts:112`) |
| JjEL in codegen | `MAX_TEMPLATE_DEPTH = 64` nested template calls (`templates.ts:75`); no deadline | main thread |
| Generated code | `DEFAULT_TIMEOUT_MS = 2000` from `ready`, `STARTUP_TIMEOUT_MS = 30000`, worker terminated (`protocol.ts:18,26`) | the only **preemptive** bound in the code base |
| JjScript | retry passes 3, containment path depth 32 (`commands/eval.ts:854`), element wait 500 ms; **no time or step budget** | main thread |
| JjTL | none found (the same `MAX_…\|maxDepth\|deadline` search that hit jjel and jjscript returned nothing under `jjtl`) | main thread |

The JjEL deadline is cooperative. A builtin that loops natively, such as a sort over a million-element range, is not
interrupted until it returns. On the main thread there is no recursion bound except the JS stack. For plugins, the
budget belongs to the host side of the worker: a wall-clock timeout plus `terminate()`, as `runner.ts` does. The
JjEL `deadline` stays inside the worker to give a clean error before the kill.

## 7. Sandbox probe (H2) [measured]

Harness: `docs/discovery/harness/plugin-sandbox/` (`server.mjs`, `host.html`, `plugin-boot.js`, `worker.js`). Probe:
`frontend/scripts/probe/plugin-sandbox-probe.ts`, run with `node --experimental-strip-types` under `run-quiet`. The
server listens on 3061 (main), 3062 (the «external» origin) and UDP 3063 (the «STUN» server). A vector **leaks** when its
`/hit/<tag>` request reached a server, a UDP packet arrived (WebRTC), the host's top URL changed, a popup opened, or a
storage read returned a host secret. The verdict is taken where the request lands, not from what the plugin's JS saw.
Iframe: `<iframe sandbox="allow-scripts">`, served by the same server as the host (the realistic case: same origin as
the app, made opaque by the sandbox). Modes: `none` (positive control), `header`, `meta`. Chromium 151 only: WebKit and
Firefox are not installed under `~/Library/Caches/ms-playwright` and none was installed.

Policy (run 2): `default-src 'none'; script-src 'sha256-<bootstrap>' blob:; worker-src 'self' blob:; connect-src 'none';
img-src 'none'; style-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; child-src
'none'; manifest-src 'none'; form-action 'none'; base-uri 'none'`.

Logs: run 1 `.agent-logs/plugin-sandbox-20261031-180458.log`, run 2 `.agent-logs/plugin-sandbox-run2-20261031-180605.log`
(both exit 0, `ALL GREEN` on the checks below; the logs are not committed).

**Controls.** In `none` mode the main thread leaked 15 vectors (fetchSelf, fetchExt, xhr, websocket, eventsource,
beacon, importExt, img, linkCss, linkPrefetch, script, nestedIframe, webrtc, selfNav, metaRefresh) and the blob worker 7.
The probe therefore has signal. Storage was unreadable even in `none` mode: that protection comes from the sandbox
(opaque origin), not from the CSP.

**Worker start.** A blob: worker starts from the opaque origin in all modes (`origin: "null"`). A same-server URL worker
does **not** start: `threw:SecurityError` in all three modes. A nested worker from inside the worker fails the same way. Plugin
code sent as text by postMessage and loaded with `importScripts(blob:)` runs (`loaded:42`) under the CSP. So the
delivery channel is «host sends text → worker imports a blob».

Results, run 2, `header` mode (`meta` mode is identical for every row):

| Vector | iframe main thread | worker (blob) | Blocked by |
|---|---|---|---|
| fetch, same server | blocked | blocked | `connect-src` |
| fetch, external | blocked | blocked | `connect-src` |
| XMLHttpRequest | blocked | blocked | `connect-src` |
| WebSocket | blocked | blocked | `connect-src` |
| EventSource | blocked | blocked | `connect-src` |
| `navigator.sendBeacon` | blocked (JS saw `queued`) | absent in workers | `connect-src` |
| `importScripts` external | n/a | blocked (`NetworkError`) | `script-src` (reported `script-src-elem`) |
| dynamic `import()` external | blocked in run 2; **LEAK in run 1** | blocked | `script-src`; run 1 leaked through nonce propagation |
| `<img>` | blocked | n/a | `img-src` |
| `<link rel=stylesheet>` | blocked | n/a | `style-src` (`style-src-elem`) |
| `<link rel=prefetch>` | blocked | n/a | `default-src` |
| `<script src>` external | blocked | n/a | `script-src` |
| nested `<iframe>` | blocked (JS saw `load`) | n/a | `frame-src` (no violation event recorded; server saw no hit) |
| nested Worker | n/a | blocked (`SecurityError`) | opaque origin |
| **WebRTC (STUN)** | **LEAK** (3 UDP packets) | absent (`RTCPeerConnection` undefined) | **no CSP directive in Chromium** |
| `window.open` | blocked (`null`, 0 popups) | n/a | sandbox: no `allow-popups` |
| top navigation | blocked (`SecurityError`, host URL unchanged) | n/a | sandbox: no `allow-top-navigation` |
| **self-navigation** (`location.href = ext`) | **LEAK** | blocked (worker `location` is read-only; the assignment is ignored) | **no CSP directive** (`navigate-to` never shipped) |
| **`<meta http-equiv=refresh>`** | **LEAK** | n/a | **none** |
| form submit | blocked | n/a | sandbox: no `allow-forms` (and `form-action`) |
| `parent.localStorage`, `parent.document` | blocked (`SecurityError`) | n/a | sandbox (opaque origin) |
| own `localStorage`, `indexedDB`, `document.cookie` | blocked (`SecurityError`) | `indexedDB` `SecurityError`, `caches` undefined, `localStorage` absent | sandbox (opaque origin) |

**Run 1 leak and its fix.** Run 1 admitted the bootstrap by a nonce (`<script nonce src=/plugin-boot.js>`). A dynamic
`import()` issued by that script reached the external server in both CSP modes, because the module fetch inherits the
referrer script's nonce. Run 2 inlines the bootstrap and admits it by its sha256 hash: the same `import()` is blocked
by `script-src`. Closing directive: **allow the bootstrap by hash, never by nonce or `'self'`**.

**Leaks with no closing directive or attribute.** WebRTC, self-navigation and meta refresh are reachable only from the
iframe's main thread. They cannot be closed by CSP or by the sandbox attribute in Chromium 151. They are closed
architecturally if plugin code **never runs on the iframe's main thread**. The main thread holds only the host-written,
hash-pinned bootstrap that relays messages and exposes no «navigate» or «create element» verb. The rerun confirms that
the worker reaches none of the three.

**Round trip** host → iframe → worker → iframe → host, 1,200,019 bytes of synthetic `idlookup`-shaped JSON, 10 timed
runs after one warm-up, payload byte-identical on return:
- as an object (structured clone at every hop): median 61.1 ms, p90 64.2 ms (run 1: 61.2 / 69.7);
- as a JSON string: median 5.5 ms, p90 7.5 ms (run 1: 3.2 / 3.8).
Strings are about 10x cheaper: the channel should carry serialized JSON and parse once in the worker.

**H2 verdict.** Holds for code that runs in the worker, in both header and meta delivery. A meta-tag policy covers a
blob worker, which inherits its creator's policy, so no server header is needed. It is falsified for code that runs on
the iframe's main thread (3 vectors). The design consequence is that a plugin cannot own DOM: its UI must be a
declarative description that the host renders, or principle 2 is not met.

## 8. The six principles against the code

1. **Untrusted by default.** *Contradicted today* for one artifact class: classic view fields are trusted and run on load
   (§3 row 13, `reducer.ts:542 → 862`). The rest of the user-authored artifacts are confined languages (JjEL, JjScript,
   IR JSON) or run in a worker (generated code), so they fit. *Supportable with a named change*: the classic view code
   fields get the plugin treatment, either compiled only after consent or migrated to IR, as §11 of the IR spec already plans.
2. **One sandbox for every plugin.** *Supportable, measured*: sandboxed iframe (no `allow-same-origin`) + hash-pinned
   bootstrap + CSP (header or meta) + blob worker. It needs a named constraint: plugin code runs only in the worker,
   because the iframe main thread leaks through WebRTC and navigation (§7). Not measured: WebKit, Firefox, and process
   isolation. The iframe is same-site with the host, so without site isolation it may share a process (Spectre-class
   risk); a separate sandbox domain closes that.
3. **Writes only through host-validated actions in one undo group.** *Supportable with a named change*. The host
   primitives exist (`applyAsOneStep`, `beginUndoGroup`/`endUndoGroup`, `permissionGuard`, the planner and the ghost
   preview), but they validate **commands**, not actions (§5). Named change: the action channel carries JjScript lines
   (or a typed command list that compiles to them), applied through `applyAsOneStep` with the window held exclusive. A
   raw action list is contradicted by how the writes are built: temporary ids, settles, retry passes.
4. **No plugin code on open without consent; explicit degradation.** *Contradicted* for classic view code (as in 1).
   *Supported* in pattern for missing data artifacts: the IR §10 fallbacks, R-IRN-3, and codecs that keep unknown keys
   and refuse an unknown `v` (`bindingCodec.ts:13-15`, `generatorCodec.ts:17-24`). A missing plugin then reads as an
   unknown artifact or kind that is kept and shown, never dropped.
5. **Certification bound to a version hash; no privilege but declared capabilities.** *Supportable*; nothing exists
   yet. A capability like network maps onto a per-plugin policy, since the CSP belongs to each iframe document (e.g.
   `connect-src https://declared.host`). The hash pin of the bootstrap (§7) is the same mechanism a certification would use.
6. **Public, versioned API with the weight of an IR schema bump.** *Supportable*, with precedents: `irVersion` per view
   with VersionFixer steps, `v:1` codecs with unknown-key preservation. No public API surface exists. The candidates are
   the narrow read interfaces already written for purity: `OntoReadView` (`bindingReader.ts:5`), `NetModelView`, the
   `stcAccess` frozen view, and `ReadCtx`.

## 9. Proposed first slice (no code in this lane)

**Re-host the semantic part of instance-of (`bindingReader` + `bindingCheck`) as the first plugin. Do not start with the
JavaScript generator.**
- *Sandbox*: the reader is pure over `OntoReadView` («nothing here imports the store, the joiner or React, and nothing
  writes», `bindingReader.ts:5-6`). It serializes into the worker as one JSON string (§7: about 5 ms per 1.2 MB round trip).
- *Role catalog*: `ontoBindings` is already a versioned, unknown-key-preserving binding (`v:1`) with no UI and no consumer,
  so declaring it as the plugin's catalog in a manifest changes no committed behaviour.
- *Action channel*: one small write, «fill each empty slot with its `defaultValue` role», proposed as JjScript `set`
  lines. That path takes no creators, which keeps it clear of rule 12. It is applied through `applyAsOneStep` and the
  ghost preview: one undo.
- *Why not the JS generator*: it already has its own worker and a shipped UI (R-GEN), so re-hosting it puts committed
  behaviour at risk. It also has no write path, so it would not exercise the action channel. Its templates run JjEL on
  the main thread (`generate.ts:106`), which makes it a bigger move than it looks.
- Minimum end to end: manifest (id, version, hash, catalog = `ontoBindings v1`, capabilities = none) → consent on first
  use → sandbox (§7 shape) → plugin reads the view, returns diagnostics (rendered by the host through the problems
  registry, which needs a plugin-owned kind or a generic `'plugin'` kind) and one proposed script → preview → Apply.

## 10. Risks

- Classic view code executes on project open in the host realm (read, not run). It is the largest gap between the
  principles and the code, and it exists without plugins.
- Only Chromium was measured. The WebRTC and navigation leaks may differ on WebKit and Firefox.
- Same-site iframe: process sharing without a separate sandbox domain (not measured).
- The undo group is a per-user time window. A concurrent gesture during a plugin Apply lands in the plugin's undo step.
- Script Run and chat Run open no undo group (open question in `decisions.md:6887`). A plugin channel built on them would
  inherit that.
- Closed unions (`NodeProblemKind`, `ShapeForm`): extending them for plugins is not «adding an optional property»
  (rule 11 in `registry.ts:30-31`), so each is a contract change.
- `ontoBindings` has no consumer. Choosing it for dogfooding means the plugin defines its first behaviour, so there is
  no parity oracle.

## 11. Open questions for Alfonso

1. Should the classic view code fields (`constants`, `usageDeclarations`, `jsCondition`, events) stop executing on open
   without consent, which is principle 4 applied to the legacy realm, before any plugin work?
2. Plugin UI: a declarative description rendered by the host (keeps principle 2), or plugin DOM on the iframe main thread
   (accepts the WebRTC and navigation exfiltration channels)?
3. Action channel: JjScript lines through the existing planner, preview and undo group, or a new typed command list?
4. Should Script Run and chat Run also open an undo group (the R-RFB open question), since the plugin channel would share them?
5. A separate sandbox origin (domain) for plugin frames, against same-site process sharing: in scope for the first slice?
6. Should the role catalog become one data format (catalog + codec) shared by STC, `ontoBindings` and codegen, and in which order?
7. First slice: instance-of semantics (recommended) or the JS generator?

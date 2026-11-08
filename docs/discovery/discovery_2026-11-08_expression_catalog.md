# Discovery — the «expression» role catalog as the first plugin, with textual projection of expression subtrees

- Prompt-ID: P-2026-11-08-2310 (chat C-2026-11-01-1434), front `plugins`
- Prompt file: `docs/prompts/claude_2026-11-08_2310_prompt_expression_catalog_discovery.md`
- Session: a7dc82b6-f3a6-4a95-9182-b6c9b40dcd99
- Tree: `~/jjodel-w-exprcat`, branch `expression-catalog`, HEAD `2b7ba21b7` (the trunk `b23eae219` plus the prompt commit)
- Executor model: Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the files.

**Tags.** **[M]** measured in this session. **[R]** read by this session in the file. **[A]** read by a subagent of this
session and quoted from its report: the batch that would have re-checked these lines was denied by the RC-51 soft
ceiling (`context-ceiling`, 203,211 tokens), so an [A] quote has not been confirmed in the main session. The report was
finished past the soft ceiling as the step in progress; see the handoff in the lane folder.

## 0. Result in short

1. The problem is real but is not a freeze. The DDR4 model opens and settles in about 16 to 19 s **[M]**, and what makes
   it unusable is 4269 nodes in one column 426,720 px tall (§4).
2. A slot-based fold leaves **249 nodes and 248 edges** instead of 4269 and 4268, folding 4020 objects under 246
   roots **[M]**; 166 nodes if parameters and properties become rows.
3. A role table reproduces the kernel's printing **byte for byte on all 246 slots** **[M]**, with `parens: always` and one
   per-row override. Minimal parentheses, which decision 2 asks for, give **different text** from the kernel view that
   decision 4 asks to match: the two decisions conflict for the Brief (Q4).
4. Render needs the text synchronously; R-PLG-2 puts plugin code in a worker with an asynchronous channel. A plugin that
   is **data interpreted by the host** resolves it (Q1, Q2).
5. Part of this exists already: `printer.ts` does precedence climbing, `annotations.ts` declares operators, and the IR
   `visible` flag hides a node. R-VAL-10 and the plugin runtime, by contrast, have no code.

## 1. Hypotheses

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Without a viewpoint every subexpression is a canvas node | **Holds** [M]: 4269 DVertex, 4268 DEdge |
| H2 | ...and the editor is unusable because of it | **Partly** [M]: it opens and settles in under 20 s; it is unusable by size (§4), not frozen. Cost with every node mounted not measured |
| H3 | Plain roles cover the kernel's printed forms, with a template for the rest | **Holds** [M]: 246/246, with the caveat at the end of §3 |
| H4 | The kernel view has one printed syntax to match | **Falsified** [R]: `brief_view.py` and `syncrtl-text.md` differ (§3) |
| H5 | «Decision 34» and its JjGen template can be located | **Falsified** [M]: cited once, no record, no template for the kernel Brief (§3) |
| H6 | A plugin can compute the text at render time | **Falsified for worker code** [A, inference]; holds for host-interpreted data |
| H7 | R-VAL-10 gives a working precedent for travel with the metamodel | **Falsified** [A]: decided, not implemented (§2.4) |
| H8 | Metaclass alone decides what folds | **Falsified** [M]: `ForEach` appears both as a design element and inside expressions |

## 2. Inventory

### 2.1 Plugin mechanism (R-PLG)

- `docs/decisions.md:6945` [R]: «**One role-catalog format** shared by `ontoBindings`, the codegen role reads and the STC»;
  `:6946` «adopted in that order, the STC last». No schema is ratified. The only sketch,
  `docs/discovery/discovery_2026-10-31_plugin_mechanism.md:144-147` [R]: «as a *catalog* (role id, kind ∈ {class, reference,
  attribute, value, derived, record-list}, cardinality, `dependsOn`, constraint hooks) + a *binding codec* (`v`, unknown-key
  preservation) + an *interpreter* that reads through a narrow view».
- `docs/decisions.md:6947` [R]: «**The first slice re-hosts the instance-of semantics** (`bindingReader`, `bindingCheck`)». Decision 3
  of the prompt makes the expression catalog the first case: an amendment (Q1).
- `:6923-6928` [R] R-PLG-2: «Plugin code runs only in a Web Worker». Data reaches it as text, discovery `:311` [R]: «It serializes into
  the worker as one JSON string». A synchronous read from render is not addressed by the discovery [A]; inference: not possible.
- `:6936-6938` [R] R-PLG-6: «Opening a project never runs code stored in it without the user's consent... fixed before any plugin
  work». Its lane `docs/prompts/claude_2026-10-31_2240_prompt_project_open_code_consent.md:6` [R]: «Status: da eseguire».
- No plugin runtime in `frontend/src` [A]: searches for `*plugin*`, `*manifest*`, `*sandbox*` and `pluginHost|PluginManifest|allow-scripts`
  empty; control on the same tool, `registerBuiltin`, 4 hits.

### 2.2 Role catalogs and bindings

| Precedent | Catalog | Binding | Storage | Evaluation |
|---|---|---|---|---|
| STC (R-SIM) | `RoleDescriptor` list, `frontend/src/model/simulation/roleCatalog.ts:64-75` [R] | flat `sim*` keys [A] | M2 `_state` [A] | sync, main thread [A] |
| `ontoBindings` (R-OI) | implicit in the interface | `{v:1, bindings:[...]}`, `model/ontological/bindingCodec.ts:69-73` [R] | M2 `_state`, `:5` [R] | pure, sync [A] |
| Codegen role reads (R-GEN-7) | reuses the STC [A] | frozen `StcView` [A] | none | main thread [A] |
| `textSyntax` (R-TXT) | `OperatorAnnotation`, `codegen/textual/annotations.ts:16-22` [R] | per class | M2 `_state`, key `textSyntax` [A] | pure, sync [A] |

The binding direction differs from STC and `ontoBindings`, which bind one role to one M2 element: here many metaclasses share a
role, each with its own parameters. That is a per-metaclass record list, the `record-list` kind of the sketch and the shape of
`ontoBindings`; it fits R-PLG-10 without a new form.

`bindingCodec.ts:15` [R]: «`encode` writes it back; an unknown `v` is refused, never guessed at.» `:18` [R]: «The `.ecore` export drops
the whole bag, as it drops the Simulation roles.»

### 2.3 Rendering, folding, codegen

**Label text.** `viewpoint/ir/irTypes.ts:96-99` [R]: `TextSource` is `path`, `literal` or `intrinsic`. No JjEL in labels [A]:
`pathExpr.ts:25` `export const FORBIDDEN_PATH = /\?\.|\?\?|[?:()]/;`. Evaluated in render [A]: `IRNodeContent.tsx:733`
`const raw = l.text(readCtx, objectId);`. The memo signature covers the object's own slots plus fixed-hop cross-deps capped at 100 [A]
(`irResolveCore.ts:157-175`, `irCrossDeps.ts:37`), so a label that reads a subtree goes stale without a new dependency.

**Hide exists.** `irTypes.ts:571` [R] `visible?: Conditional<boolean>;`, «Additive optional field: no irVersion bump» (`:569`) [R].
`irContainment.ts:519` [R] `return { ...n, hidden: shouldHide };`: a hide, the node stays in the React Flow array and mounts nothing [A].
Edges to a hidden node are lifted or suppressed [A] (`irContainment.ts:477-487`). ELK ignores hidden nodes [A] (`elkLayout.ts:406`).
The DVertex and DEdge stay. Removal exists only for `isSingleton` [A] (`EditorV2.tsx:1085-1086`). Vertices are created per object [A]:
`useJjomSync.ts:854` `for (const objId of (rawModel.objects ?? [])) {`.

**Auto-layout counts hidden objects.** `editor-v2/utils/autoLayoutOnOpen.ts:73` [R]
`const nodes = Math.max(size?.nodes ?? 0, graphId ? graphModelObjectCount(graphId, idlookup) : 0);`, cap `:51` [R] 500.

**Culling.** `editor-v2/onlyRenderVisible.ts:8` [R]: «So the prop is on with no IR viewpoint».

**Validation and selection.** No ancestor fallback in `problems/` [A]: search `ancestor|parentOf|containerOf|liftEndpoint|nearest`, one
message-text hit; control `resolveVertex`, 5 files. A hidden node mounts nothing, so its indicator is not drawn [A]. `SELECT_NODE` with no
match deselects and reveals nothing [A] (`EditorV2.tsx:1224-1243`).

**JjGen at render time.** `codegen/engine/generate.ts:80-89` is synchronous and pure, but builds handles for the whole model and re-parses
every template per call (`:107`) [A]: not per-node. A batch over all fold roots in one call is viable; no timing exists [A]. Dispatch by
metaclass, `templates.ts:183`, typed names `name:Type` [A]. A plain string is `GenerateResult.code` (`:128-129`) [A].

**A generic printer exists.** `codegen/textual/printer.ts:491-496` [R] has the call form and `parens` for minimal parentheses; `ExprOperator`
`concreteGrammar.ts:29-38` [R] has `precedence`, `assoc`, `fixity`. `annotations.ts:186-189` [R] reads fixity off the features, and refuses a
class with an attribute: `IntDiv` (attribute `ceil`) cannot be an operator there. `docs/discovery/discovery_2026-11-04_textual_step_c.md` F1 [R]:
«The Briefs print expressions as pyramids». It does not offer `always` parentheses, templates or named subexpressions, and its adapter
`textInputOf` lives in a file importing monaco [A]. R-TXT-14, `decisions.md:6999` [R]: «The JjGen generator is the reference implementation of
R-TXT, not the final mechanism».

**Viewpoint derivation.** `viewpoint/derive/viewpointDerivation.ts:226` `deriveViewpointIRs`, row fold one level deep `:538-544` [A]. Binder protocol
bound / candidates / none, never choosing among candidates, `model/simulation/profileBinder.ts` [A].

### 2.4 Travel with the metamodel (R-VAL-10)

`docs/decisions.md:5454-5457`, R-VAL-10 as injected in the prompt. Not implemented: `docs/discovery/discovery_2026-10-23_codegen_generator_viewpoint.md:174-175` [R]:
«No import or export path is among them, so R-VAL-10 («follows the metamodel in the import») is not implemented beyond the whole-project file.»
Re-checked [A]: no `DValidation*` reference under `api/`, `services/`, `components/import`, `components/project`, `pages/`; control `parseM2Model`
finds `api/data.ts`. A binding in the M2 `_state` travels in the project file [A]; `.ecore` drops it [R, `bindingCodec.ts:18`]; no cross-project copy path
exists [A]. The one role-like datum surviving Ecore is the `jjodel` type annotation, `services/export/EcoreService.ts:328-330` [R].

## 3. The reference syntax

Sources read in full [R]: `~/Downloads/micron-proto/docs/brief-text.md`, `docs/syncrtl-text.md`, `tools/kernel/brief_view.py`, `tools/kernel/build_ecore.py`, `tools/kernel/kxmi.py`.

**Printed form per metaclass (`brief_view.py`), fit, and count in `ddr4_closed_v` [M].**

| Metaclass | Printed | Binding | Count |
|---|---|---|---:|
| `IntLit` | `4` | literal `value` | 345 |
| `IntParam`, `Ref` | `name` | reference by attribute `name` | 1141, 424 |
| `Arg` | `@name` | reference, prefix `@` | 18 |
| `IntAdd`, `IntSub`, `IntMul` | `(a + b)` | infix, left | 239, 38, 0 |
| `Add`, `Sub` | `(a + b)` | infix, left | 17, 2 |
| `Eq`, `Le` | `(a == b)` | infix, none | 106, 51 |
| `Implies` | `(a -> b)` | infix, right | 31 |
| `BitAnd`, `BitOr`, `BitXor`, `Shl`, `Shr`, `Sra` | `(a & b)`, ... | infix | 0 |
| `CondLt` | `a < b` | infix with `parens: never` | 10 |
| `Conj`, `Disj` | `(a & b & c)`, bare when one operand, `()` when none | n-ary | 93, 29 |
| `Neg` | `!x` | unary | 34 |
| `Ite` | `(c ? a : b)` | conditional | 60 |
| `IntMax`, `IntLog2`, `IntCount` | `max(a, b)`, `log2(a)`, `count()` | call | 400, 0, 0 |
| `Concat` | `{a, b}` | bracket | 3 |
| `IntDiv` | `ceil(a / b)`, `floor(a / b)` by `ceil` | pattern with a choice on an attribute | 298 |
| `IntProp` | `item.key` | pattern | 31 |
| `Const` | `4`; `true`, `false`, `bool(x)` when `type` is `Bool` | literal with a boolean form | 257 |
| `Bool`, `Word`, `Array` | `bool`, `word<w>`, `e[n]` | pattern | 89, 256, 0 |
| `Slice`, `Extend` | `x[h:l]`, `sext(x, w)` by `sign` | pattern | 4, 1 |
| `Arm`, `Use` | `c: v`, `use n` | pattern | 25, 0 |
| `Case` | multi-line `case {` ... `else: x }`, arms may be `ForEach` | **template** (or a `case` role) | 7 |
| `ForEach` | once-if `(if w: b)`, `for v over ...: [b]`, three ranges | **template** | 12 |
| `Index`, `Update`, `Globally`, `Next`, `Prev`, `CondLe`, `CondEq`, `CondSame`, `CondNot`, `CondAnd`, `CondOr` | unhandled by the kernel: `<Index>` or the class name | no reference form | 0 |

Name patterns such as `{req}` and `{c}` are plain attribute text and print as they are. `IntCount` reads a `set` the metaclass does not have
(`brief_view.py:49-50`, `build_ecore.py:77`).

**Repeated subexpressions** (`brief_view.py:147-166`): integer expressions, printed length above 60, met more than twice, outermost only, named `D1`, `D2`
by descending length, listed under `derived`. A whole-model pass, not a property of a node. On `ddr4_closed_v`: one, `D1`, 373 characters, used 30 times [M].

**The kernel view is not the SyncRTL text.** The docstring of `brief_view.py:3-4` says «in the infix notation of the SyncRTL text view». They differ [R]:

| Construct | `brief_view.py` | `syncrtl-text.md` |
|---|---|---|
| Binary | always parenthesised | minimal (`:69-71`) |
| Bitwise, shifts | `(a & b)`, `(a << b)` | `bitand(a, b)`, `shl(a, b)` (`:54-55`) |
| Arity 0 and 1 | `()`, bare operand | `and()`, `or(x)` (`:57`) |
| `Case` | multi-line | `case { c: v; else: x }` (`:60`) |
| `G`, `X`, `Y`, index, update | unhandled | defined (`:49`, `:58-59`) |

**«Decision 34».** Cited only at `brief_view.py:6`: `command grep -rl 'decision 34'` over `*.md`, `*.py`, `*.txt` of `~/Downloads/micron-proto` returns that file alone;
control `decision 36`, 6 files [M]. `brief-kernel.md:3` says «decision 36 of STATE.md»; no `STATE.md` in that tree, and the two under `~/Downloads` date from 2026-10-29 with
8 numbered decisions [M]. No JjGen template for the kernel Brief: `grep -l IntParam templates/*` empty, control `arbiter` 4 files [M]. `templates/build_brief_templates.py` serves
CoreSpec and ArbiterSpec, as `brief-text.md:3-4` says [R]. `Brief2SyncRTL.jjtl` knows `IntParam` but is the transformation, not a view.

**Measured on the role table** [M] (`/tmp/exprcat-probe/proto.py`, copied to the lane folder; the kernel code imported from copies, Python `-I`).
Positive control: `brief_view.view` on the model equals `out/dram/views/ddr4_closed_v.brief.txt`, 14,967 bytes, identical. The role table then matches the kernel on **246 of 246** slots.
The first run gave 240: all 6 differences were `CondLt` under `where`, which the kernel prints without parentheses, fixed by a per-row `parens: never`. Caveat: 12 metaclasses were
hand-coded in Python as stand-ins for `pattern`/template, so the result proves the role *table*, not that the declarative pattern form suffices.

## 4. Measure on the trunk build

Dev server of this worktree on port 3098 through `lane-run probe`, headless Chromium, 1440×900, fresh project, `Brief.ecore` then `ddr4_closed_v.xmi` through the project page's inputs, `activeViewpoint: null`. Probe:
`frontend/scripts/smoke/_tmp_expr_ddr4.ts` (gitignored). Output: `~/.jjodel-lanes/P-2026-11-08-2310/probe_ddr4_run1.json`, `probe_ddr4.json`, `ddr4_open*.png`. Load gate: 14.99 at the start of run 1 and 9.11 about a minute before run 2, both within 16.

| [M] | Run 1 | Run 2 |
|---|---:|---:|
| Ecore import | 1.6 s | 1.5 s |
| XMI import | 16.0 s | 21.7 s |
| First `.react-flow__node` after open | 14.0 s | 17.3 s |
| Last DOM change after open | 16.1 s | 19.1 s |
| Main thread blocked (gaps > 1 s), total | 18.2 s | 21.5 s |
| Longest single block | 4.5 s | 5.7 s |
| Page and console errors | 0, 0 | 0, 0 |
| Settled (no change, no gap for 30 s) | yes | yes |

Both runs [M]: 4269 DVertex, 4268 DEdge, 2 DGraph; `idlookup` from 11,475 to 20,014 entries; **15 nodes and 71 edges mounted** (culling, §2.3); vertices span x 50 to 1090, **y 50 to 426,770**, about 275 viewport heights at the default 50% zoom, the initial view at y ≈ 212,600, mid-model.

**Not measured.** The zoom-out step of run 2 was a no-op (`scale(0.5)` unchanged after 12 wheel events), so the cost with every node mounted is unknown; left to the ticket, as the prompt says. Ticket #452 could not be found [A]: `#452` occurs only in the prompt; `gh issue view 452` fails; control `#656` greps. Nearest material: `docs/discovery/discovery_2026-11-04_elk_open_freeze.md`.

**What the projection leaves** [M] (`fold.py`). Fold slots: `Register.{type,reset,next}`, `Wire.{type,expr}`, `Port.{type,driver}`, `Property.expr`, `Actual.expr`, `ForEach.{where,start,stop}`.

- Kept **249**: Register 44, Prop 38, Property 24, Param 23, Pattern 23, Port 23, Requirement 21, Wire 21, Actual 16, Pick 6, Item 6, Brief, Library, Template, one design-level ForEach. Kept edges: 248 (the fold is downward closed and Brief has containments only, `build_ecore.py:13`).
- Folded **4020** under **246 roots**; subtree size p50 3, p90 43, max 214.
- With Param, Pick, Prop, Actual as rows (existing `children` compartments): **166 nodes**, 165 edges.
- Prompt's 3910 against 4009 by class here: the difference of 99 equals Bool 89 + CondLt 10 (arithmetic, an inference). 4020 adds the 11 in-expression `ForEach`.
- Printed length [M], 158 non-type slots: p50 22.5, p90 117; longest **522 characters over 12 lines** (`Register st.next`, a `Case`, 214 objects); longest single-line formula 268 (a `Property`); longest line of the view 380 (the `D1` definition). 7 slots are multi-line. Minimal parentheses shorten the total by 9.5 % (7666 to 6934) and the longest to 450: the parentheses are not what makes the text long.

## 5. Design proposal

### 5.1 The catalog as a plugin

A manifest (id, version, catalog) whose body is **data**: the role list, and one binding per metamodel. The host interprets it, so no plugin code runs and R-PLG-2 is not engaged; the first plugin exercises manifest, catalog format (R-PLG-10), binding codec and R-PLG-7 degradation. A worker variant adds nothing here, and would have to precompute text anyway.

Roles: `infix` {symbol, precedence, assoc, operands}; `nary` {symbol, precedence, operands, zero?, one?}; `unary` {symbol, operand}; `literal` {attribute, booleanWhen?}; `reference` {attribute | feature, prefix?}; `call` {name, args}; `conditional` {cond, then, else}; `case` {arms, cond, value, otherwise}; `bracket` {open, close, separator, items}; `pattern` {text with holes, choice on an attribute}; `template` (the hatch).

Binding, in the M2 `_state`, key `exprBinding`, as `ontoBindings`:

```json
{"v":1,"parens":"always","slots":[{"class":"<id>","feature":"<id>"}],
 "roles":[{"class":"<id>","role":"infix","symbol":"+","precedence":6,"assoc":"left","operands":["<id>","<id>"]}],
 "templates":[{"class":"<id>","body":"..."}],
 "sharing":{"classes":["<id>"],"minLength":60,"minCount":3,"prefix":"D"}}
```

Unknown `v` refused, unknown keys preserved. The metamodel owns the binding; **a viewpoint only activates the fold** (additive optional field). That is R-VAL-10's intent without its missing copy path, as the bag travels with the D element, ids included since project import renews ids by text replacement (`out/dram/jjodel/README.md:18` [R]). It departs from the wording of decision 2 (Q3). `.ecore` loses it, as for `ontoBindings`.

### 5.2 Printer

Pure module, no imports from `joiner` or monaco, reading through `ReadCtx`-like accessors. Precedence climbing as `syncrtl-text.md:69-71`; `parens` is `minimal` or `always` on the binding, with a per-row override (`CondLt`). A pre-pass over the model computes `sharing` names. **All fold roots are printed in one batch**, memoised on D-record identity; render reads a map. Templates are JjGen records, one per metaclass, typed dispatch (R-TXT-8), with the printer exposed as a builtin for recursion; the batch avoids the per-call cost of §2.3. `printer.ts` stays untouched: it is built for exact round trip and is in active development; its operator annotations seed the auto-binding, and the two converge when editing arrives through R-TXT (Q8).

### 5.3 Canvas

- Folds: an object is folded iff it is under a declared slot, or below a folded one. **Slots, not metaclasses** (H8): `Pattern.wires` and `Register.next` are both typed `Node`.
- Hide first, through the path of §2.3: the folded set feeds `decorateNodes`. Expansion is then a flip of that set.
- Owner text: a new `TextSource` kind `{from:'expression', slot}` in labels and rows. Compile-time exhaustiveness at `irValidate.ts:165` [A] forces the handlers. A union member is not an optional property: rule 11 needs approval (Q7).
- Long text: monospace, wrapped, clamped with «show all»; the 12-line `Case` does not fit a fixed row.
- Expand/collapse: a per-session set as `irCollapseState.ts` [A]. Revealed nodes need local layout: their vertices sit at grid positions hundreds of thousands of pixels away.
- Selection and problems: a folded object resolves to its owner through a `father` walk in `vertexResolver.ts`, the message prefixed with the slot (`Register.next:`); a tree click selects the owner.

### 5.4 Automatic binding

Protocol of `profileBinder`: bound, candidates, none, never choosing. By `build_ecore.py` [R]: two single containments and no attribute gives `infix`, but `IntMax` is a call and `Arm` a pattern; one single containment gives `unary`, but `IntLog2` is a call; one many-valued gives `nary`; no containment and one attribute gives `literal` or `reference`. `IntDiv` escapes by its attribute. Structure yields the shape; **symbol, precedence and infix-versus-call are left to a name table, the user or Jodie**. Slots cannot be told from the metamodel when one abstract type covers both (`Node`): the proposal uses the model, a slot being a candidate when all its observed values are role-bound (246 here). Existing `textSyntax` operators pre-fill.

### 5.5 Binding of the Brief metamodel

`parens: always`. Slots as §4. Roles as the table of §3, precedence from `syncrtl-text.md:69-71` for a later `minimal` (`?:` 1, `->` 2, `|` 3, `&` 4, `==` `<=` `<` 5, `+` `-` 6, `*` 7, `!` 8). `sharing`: classes `Int*` except `IntLit`, `IntParam`, `IntProp`; 60, 3, `D`. Owner rows follow `brief_view.py:128-144`: `reg n: type reset r` and `next = e`; `wire n: type = e`; `in|out n: type = d`; `invar|assume n = e`.

### 5.6 Critical zone, interfaces, dependencies

- S1 and S2 touch `viewpoint/ir/` and `problems/`, both in the §3.1 table, and no §3.2 trigger: no sync write, D-layer or VersionFixer change. S4 touches `useJjomSync.ts`: Layer Impact Report and rules 12-13.
- Rule 14 is not engaged (no default-view source). Rule 11: §5.3. Rule 19: S1 will exceed 5 files, list first.
- No new dependency.
- Risks: staleness of subtree text (§2.3); `resolveIRView` once per node on 4269 nodes, unmeasured; hide keeps 8,539 records and the 14-17 s open; R-PLG-6 if templates count as stored code (Q2); problems on folded objects disappear from the canvas until S2.

### 5.7 Slices

1. **S1: DDR4 readable.** Binding codec, printer, batch memo, slot fold by hide, `TextSource` kind, a viewpoint derived from the binding, JSON import of a binding. Golden test: 246 slots of `ddr4_closed_v` equal to the kernel view. Check: 249 nodes after Auto layout, the printed formula in each owner, editing a constant in the tree updates the text, open time recorded against §4.
2. **S2: Folded elements reachable.** Problems and selection map to the owner.
3. **S3: Expand and collapse** with local layout.
4. **S4: Removal**, only if S1's measure asks for it: no vertices for folded objects, auto-layout counts visible objects. Critical zone.
5. **S5: Rows** for parameters and properties (166 nodes). **S6: Auto-binding** and declarative binding panel (R-PLG-3). **S7: Editing** through R-TXT.

## 6. Draft decision rows (not in `docs/decisions.md`, for ratification)

- **R-EXP-1.** The expression catalog is a plugin made of data, interpreted by the host; it runs no plugin code and does not engage the R-PLG-2 worker.
- **R-EXP-2.** Roles: infix, n-ary, unary, literal, reference, call, conditional, case, bracket, pattern; a per-metaclass template is the escape hatch.
- **R-EXP-3.** The binding is a versioned record list in the metamodel's `_state`, key `exprBinding`; an unknown version is refused.
- **R-EXP-4.** A viewpoint activates the fold; it does not own the binding.
- **R-EXP-5.** The unit of folding is a slot, closed downward; a metaclass alone does not decide.
- **R-EXP-6.** The printer takes `parens: minimal | always` on the binding with a per-row override, and a sharing pass for repeated subexpressions.
- **R-EXP-7.** Text is computed in a batch and memoised; render reads it and never calls a template per node.
- **R-EXP-8.** For the Brief metamodel the reference is `brief_view.py`, held by a golden test on `ddr4_closed_v`.
- **R-EXP-9.** A problem or selection on a folded object maps to its owner, with the slot named.
- **R-EXP-10.** The first slice hides folded nodes; removal comes later, on a measure, under the Layer Impact Report.
- **R-EXP-11.** Automatic binding proposes and never chooses among candidates.
- **R-EXP-12.** A missing or invalid binding degrades explicitly (R-PLG-7): the objects remain nodes and authoring says why.

## 7. Files read

Micron prototype, in full: `docs/brief-text.md`, `docs/syncrtl-text.md`, `tools/kernel/{brief_view,kxmi,build_ecore}.py`, `tools/kernel/make_models.sh`, `out/dram/jjodel/README.md`; windows of `out/dram/views/ddr4_closed_v.brief.txt` (lines 1-60), `docs/brief-kernel.md` (grep only).
Jjodel, windows only: `docs/decisions.md`, `docs/discovery/discovery_2026-10-31_plugin_mechanism.md`, `discovery_2026-10-23_codegen_generator_viewpoint.md`, `discovery_2026-11-04_textual_step_c.md`, `discovery_2026-11-01_textual_viewpoint.md` (header), `frontend/src/model/simulation/roleCatalog.ts`, `model/ontological/bindingCodec.ts`, `services/export/EcoreService.ts`, `codegen/textual/{annotations,concreteGrammar,printer}.ts`, `components/editor-v2/viewpoint/ir/{irTypes,irContainment}.ts`, `components/editor-v2/utils/autoLayoutOnOpen.ts`, `components/editor-v2/onlyRenderVisible.ts`, `frontend/scripts/lane-run.mjs` (probe). The [A] items were read by two `explorer` subagents.

## 8. Questions for Alfonso

1. Does the expression catalog replace instance-of as the first plugin of R-PLG-11? Recommended: yes, as an amendment; instance-of follows on the same format.
2. Is a data-only plugin outside R-PLG-2, and does R-PLG-6 (lane not yet run) block it given stored JjGen templates? Recommended: outside R-PLG-2, not blocking, templates being JjEL under a budget and not `new Function`.
3. Binding on the metamodel with the viewpoint only activating, against decision 2's «a viewpoint binds»? Recommended: on the metamodel.
4. For the Brief, byte-identical to the kernel view (always parenthesised) or the minimal parentheses of decision 2? Recommended: `always`, kernel parity first; flip the binding if the kernel view changes.
5. For Brief expressions the reference is `brief_view.py`, not `syncrtl-text.md`? Recommended: yes; `syncrtl-text.md` becomes the separate binding of the SyncRTL metamodel.
6. Where is «decision 34» recorded, and does it add anything beyond `brief_view.py`? Recommended: treat `brief_view.py` as normative unless a record says otherwise.
7. May `TextSource` gain a union member (rule 11)? Recommended: yes, additive and checked by the compiler.
8. Separate small printer now, converging with R-TXT's `printer.ts` and `textSyntax` when editing arrives? Recommended: yes.
9. First slice by hide, keeping the DVertex records, with removal only on a measure? Recommended: yes.
10. Which ticket is #452? Recommended: name it or open one; the full-mount cost left unmeasured here belongs to it.
11. Should parameters and properties become rows in the first slice (166 nodes against 249)? Recommended: no, S5, to keep S1 to the expression work.
12. Is an Ecore mirror of the binding needed? Recommended: not yet, as R-OI-6 deferred its own; the Brief binding ships as a JSON import.

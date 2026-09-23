# Discovery — JjScript class name resolution (Phase 1, read-only)

Prompt-ID: P-2026-09-23-1600 · session 2a2c8148-b9bb-4734-8afe-a505da854491 · 2026-09-23
Branch `validation-skeleton` at `edaacff44`. Model: Anthropic Claude Opus 5.5 (1M context).
No source file was modified. The probes lived in the session scratchpad and are not in the repo.

---

## 0. Outcome in one table

The four observed defects were run again on the current code. The dev server on :3000 serves
this tree (its cwd is `/Users/alfonso/jjodel/frontend`). Each run used a fresh project built
through the app's own `createM2`: `metamodel_1` holds `Book`, and `metamodel_2` is the target.

| # | Observation (Alfonso) | Current code, fresh project | Producer on current code |
|---|---|---|---|
| 1 | Dialog title "line 7" for the command on source line 14 | **Not measured live** (ScriptBlock was not mounted, §6). By static reading the title uses `scriptLine = getScriptLine(i)`, which maps command 7 of the quoted script to line **14**. | `ExecutionErrorDialog.tsx:93`, `ScriptBlock.tsx:259-287`, `:490` |
| 2 | `Ambiguous 'Book': metamodel_2::Book, metamodel_2::Book` | **Not reproduced.** Each candidate is spelled with its own `element.model.name`. Measured: `["metamodel_1::Book","metamodel_2::Book"]`. | `resolvers.ts:217-226`, `:282`; `create.ts:324-336` |
| 3 | `type metamodel_2::BookCopy` → Unknown type | **Not reproduced.** The type clause splits on `::` and resolves in all three modes measured (V3a, V3b, V3c, §A). | `grammar.ts:203-243`, `create.ts:680-684`, `resolvers.ts:905-918` |
| 4 | `type BookCopy` succeeds | Reproduced (V4a, V7b, V7c) | same |

Two defects that the prompt did not list were measured, and they are live on the current code:

- **F-A, silent misplacement.** An unbound run writes `title` and `isbnCode` into
  **`metamodel_1::Book`** and reports success. At 20 ms between commands both attributes landed
  in the wrong class; at 150 ms one did.
- **F-B, bound refusal.** The Jjodie-reply path (the only path that opens the dialog) stops at
  command **2** with `OUT_OF_SCOPE: 'Book' is not in 'metamodel_2'; qualify as
  metamodel_1::Book`, both at 20 ms and at 150 ms.

Both have the same cause. A class created by the run becomes visible to the resolvers 65 to
268 ms after `create class` returns (measured, §Q5). The dependency waiter treats the wait as
satisfied when the homonym in the other metamodel resolves (§Q5).

The prompt's working hypothesis, checked against the code:

- "Container lookup has no preference for the target metamodel": **refuted**. Target-scoped
  lookup runs first (`create.ts:282-291`).
- "Type lookup does not parse `::`": **refuted** since `2a1619653` (2026-09-14 18:37). Measured
  in V3a, V3b and V3c.
- "Ambiguity prefix taken from a shared value": **refuted**. The prefix is read per candidate
  (`resolvers.ts:221-223`, `scopeGuard.ts:96`).
- "Two distinct resolvers": **partly right**. There is one resolver module with two scopes. The
  call sites compose them in five different ways (§Q1).

Observations 1 to 3 cannot be matched to the current code on a fresh project. What would match
them is in §Q3 and §9. That is the stop-and-ask condition of the prompt, raised in §9.

---

## 1. Objective and hypothesis under test

The objective is to establish how JjScript resolves a class name from a string (entry points,
scope, `::` handling, ambiguity spelling), and where the dialog's line number and error box come
from. This report is the base for a design decision about a single resolver.

Hypothesis under test, verbatim from the prompt: *two resolvers; `in X` parses `::` but has no
target preference; `type X` is reachability-scoped but does not parse `::`; the ambiguity
prefix comes from a shared value.*

## 2. Method

- Static reading of every function body cited below. Paths were found by a global
  `command grep` on the four literal messages. All four were found, with exit status 0.
- A live probe (Playwright + tsx) against `http://localhost:3000`, calling the app's own
  modules through `import('/src/...')`.
  - **Positive control:** the imported `joiner.store === windoww.store` returned `true`, so the
    probe shares the app's module graph and live store.
  - The commands went through `JjScriptService.execute(cmd, scope?)`, which is the exact call
    `ChatMessages.tsx:437` makes, in the same loop shape as `ScriptBlock.handleExecute`: one
    command, then `BATCH_DELAY_MS`. Two modes were run:
    - **bound**: `scope = {level:'M2', metamodelId: metamodel_2}`, the Jjodie-reply path.
    - **unbound**: no scope, the target is the active metamodel. The typed-command path.
  - **Setup was asserted, not awaited:** exactly one `Book`, in `metamodel_1`, before each run.
- Every absence claim below carries a positive control from the same invocation (§8).

## 3. Files read (full paths)

```
frontend/src/jjscript/executor/resolvers.ts                (whole file, 918 lines)
frontend/src/jjscript/executor/commands/create.ts          (whole file, 1176 lines)
frontend/src/jjscript/executor/utils.ts                    (whole file)
frontend/src/jjscript/executor/executor.ts                 (whole file)
frontend/src/jjscript/executor/elementWaiter.ts            (whole file)
frontend/src/jjscript/executor/dependencies.ts             (whole file)
frontend/src/jjscript/executor/scopeGuard.ts               (whole file)
frontend/src/jjscript/executor/activeArtifact.ts           (whole file)
frontend/src/jjscript/executor/superclassResolution.ts     (resolveSuperclasses 80-104)
frontend/src/jjscript/executor/scriptValidator.ts          (collectClassifierNames 189-216)
frontend/src/jjscript/executor/errors.ts                   (errorFromResult 427-459, parseError 363-390, ExecutionErrorInfo 464-478)
frontend/src/jjscript/executor/commands/set.ts             (resolveSetType 325-395, convertValue 397-411)
frontend/src/jjscript/executor/commands/extends.ts         (30-100)
frontend/src/jjscript/executor/commands/abstract.ts        (35-60)
frontend/src/jjscript/executor/commands/instance.ts        (resolveTargetModel 60-65, findMetaclassByName 81-103, 280-300)
frontend/src/jjscript/parser/parser.ts                     (parseCreateCommand 262-293, parseCreateOptions 336-410, 1184-1300)
frontend/src/jjscript/parser/grammar.ts                    (parseQualifiedName 28-56, qualifiedNameToString 62-68, parseTypeReference 203-243)
frontend/src/jjscript/types.ts                             (ExecutionContext 488-516)
frontend/src/jjscript/services/JjScriptService.ts          (execute 27-70, formatErrorResult 366-381)
frontend/src/jjscript/components/ScriptBlock.tsx           (1-620, pause writers 740-800, 925-970, 1065-1100, 1150-1160)
frontend/src/jjscript/components/ScriptExecutionWindow.tsx (1-460)
frontend/src/jjscript/components/ExecutionErrorDialog.tsx  (whole file)
frontend/src/jjscript/components/ExecutionErrorDialog.scss (50-65, 125-215, 280-295, 385-490, 580-600)
frontend/src/components/Jodie/ChatMessages.tsx             (58-80, 397-462)
frontend/src/components/Jodie/Jodie.tsx                    (560-660)
frontend/src/components/Jodie/JodieWindow.css              (23-60, 570-582; nowrap selectors 326, 1304, 2140, 2318, 2795)
frontend/src/components/common/MarkdownRenderer.tsx        (60-140)
frontend/src/components/common/MarkdownRenderer.scss       (214-232, 300-305)
frontend/src/model/logicWrapper/LModelElement.tsx          (get_until_parent 617-626, get_model 731-733, get_classifiers 2037-2043, get_packages 5687-5693, get_classes 5729-5740, _getallSub 5814-5842)
frontend/src/joiner/classes.ts                             (LProject.get_metamodels 3382-3391, get_packages 3509-3512, get_classes 3513-3516)
frontend/src/redux/selectors/selectors.ts                  (getAll 264-289)
frontend/src/pages/components/Navbar.tsx                   (createM2 73-96)
frontend/src/jjodie-integration/useMetamodelGeneration.ts  (61-100, 245-262)
```

---

## Q1. How many class-name resolvers, and what each one searches

There is **one resolver engine** (`executor/resolvers.ts`) with **two scopes**. On top of it sit
**three pre-dispatch passes** and **one M1-only lookup**.

**The engine.** Every leg ends in `selectTarget` (`resolvers.ts:237-301`):
- exact case wins;
- more than one exact candidate is an ambiguity;
- otherwise a single case-insensitive candidate wins, and more than one is an ambiguity;
- `kinds` filters the candidates;
- duplicates are dropped by `element.id` (`:271-275`).

| # | Entry point | Scope searched | `Metamodel::Name` |
|---|---|---|---|
| E1 | `resolveTargetInMetamodel(qn, mm, kinds?)` `:355-374` (shorthand `resolveElementInMetamodel` `:345-349`) | One metamodel. `resolveByPathInMetamodel` `:442-474` walks `METAMODEL_COLLECTIONS` (`:132-136`, `packages` first). A single-segment name falls back to `resolveByNameInMetamodel` `:479-507`, a recursive descent. | Yes. The first segment matches a **package** named `metamodel_2` first (`packages` leads the list). If nothing matches, the walk "stays on `current`" when `current.name` equals the segment (`:467-468`). |
| E2 | `resolveTargetInProject(qn, project, kinds?)` `:540-565` (shorthand `resolveElement` `:530-534`) | Whole project: `resolveByPath` `:587-620` over `PROJECT_COLLECTIONS` (`:138-142`, `metamodels` first), then `resolveByName` `:625-653`, then `resolvePartialPath` `:658-690`. | Yes: `metamodels` is the first collection. `LProject.packages` covers every metamodel's packages (`classes.ts:3509-3512`), and `LProject.classes` covers every class (`:3513-3516`). |
| E3 | `resolveTypeTarget(qn, mm, project, kinds)` `:905-918` | E1, then E2. E2 runs only if E1 is inconclusive. | Yes, through E1 and E2. |
| — | `findClassInMetamodel` `:385-406`, `resolveParent` `:570-575`, `findElements` `:770-809`, `resolveEnumTypeTarget` `:880-886` | — | **No call sites** outside the module. `resolveParent` and `findElements` are only re-exported from `jjscript/index.ts:58-59`. The `findClassInMetamodel` called in `jjtl/executor/jjodelConverter.ts:388` is that file's own local function (`:420`). |

**How the call sites compose the engine:**

| Caller | Composition | Kinds |
|---|---|---|
| `create … in X` parent, `create.ts:280-304` | E1 on the target. If `!element && !ambiguousWith`, then E2. For class/enum/package only, an unrestricted E1, then an unrestricted E2 (`:299-304`). | `PARENT_KINDS_BY_ELEMENT_TYPE` `:126-140` |
| `type X` / `returns X` on create, `create.ts:652-713` → E3 | E1, then E2 | `TYPE_CLAUSE_RULES` `:590-623` (reference `['class']`) |
| `set … type`, `set.ts:325-395` → E3 | E1, then E2 | per rule |
| `extends` / `abstract` / superclasses, `extends.ts:45-50`, `:79-84`, `abstract.ts:45-50`, `create.ts:491-498` | unrestricted E1, then unrestricted E2 | none |
| `rename`, `delete`, `list … in`, `rename.ts:67`, `delete.ts:56`, `list.ts:46` | **E2 only** | per element type |
| `set` target, `move`, `copy`, `remove`, `show`, `validate`, `set.ts:54`, `move.ts:44,57`, `copy.ts:53,66`, `remove.ts:49,62,143`, `show.ts:48`, `validate.ts:47` | **E2 only**, unrestricted | none |
| `convertValue` (`set` value), `set.ts:397-411` | E2. When nothing is found it writes the **name** as the value. | none |

**Pre-dispatch passes (they decide whether and when a handler runs):**

- **P1 waiter.** `elementWaiter.ts:103-135` polls **required** dependencies for up to 500 ms
  (`:17-18`), with an unrestricted E1 and then an unrestricted E2.
  - `type X` is **never waited for** (`dependencies.ts:205-214`: `required: false`).
  - An `in X` parent is required only for nested elements (`:151-158`).
- **P2 bound-scope guard.** `scopeGuard.ts:44-106` runs only when `scopeBound`
  (`executor.ts:123-137`), and only on single-segment names (`:65`). It uses unrestricted E1 per
  metamodel and refuses a bare name that another metamodel holds and the bound one does not.
- **P3 forward-reference pass.** `scriptValidator.ts:189-216` collects classifier names across
  **every** metamodel of the project before command 1 (`ScriptBlock.tsx:375`). It is name-only,
  with no qualifier and no metamodel.

**M1 lookup.** `instance.ts:81-103` (`findMetaclassByName`) takes a bare string, matches exact
case, searches only the metamodel of conformity, and has no project fallback.

## Q2. What "this metamodel" is in the reachability message, and what the reachability set is

It is **a fixed sentence, not a computed scope**. `create.ts:603` defines `neither: 'is not a
class reachable from this metamodel'`, and `set.ts:383` has the same wording. No reachability
set exists. There is no import or dependency closure: `LModel.dependencies` and the `cross*`
getters (`LModelElement.tsx:5728-5740`) are never read by `resolvers.ts`. What was actually
searched when that sentence prints is:

1. the target metamodel (E1), and then
2. **the whole project** (E2, `resolvers.ts:915`).

So the message understates the search: "not reachable from this metamodel" really means "not
found anywhere in the project".

Classes created earlier in the same run are included **only once they appear in the store's
per-class index**. `LModel.classes` → `_getallSub` → `Selectors.getAll(DClass)` reads
`state.classs` (or a variant), not `idlookup` (`selectors.ts:264-289`), and keeps the classes
whose `l.model.id` is the metamodel (`LModelElement.tsx:5814-5842`). Measured latency: §Q5. No
run-local record of created classes exists (§8, A3).

## Q3. Where the `Metamodel::` prefix comes from

There are two spellers, and both read **each candidate's own owner**:

- `qualifiedSpelling(element)` (`resolvers.ts:217-226`) returns `element.model.name + '::' + name`.
  `element.model` is `get_model` → `get_until_parent(…, DModel)` (`LModelElement.tsx:731-733`,
  `617-626`): it walks `father` up to the first `DModel`. It is used at `:282`, `:289`, `:293`
  and `:297`.
- `checkName` in the scope guard (`scopeGuard.ts:96`) returns
  `${e.metamodel?.name}::${asked}`, where `e.metamodel` is the metamodel iterated in
  `:79-83`, one per candidate.

**No expression on the current code yields `metamodel_2` for a `metamodel_1` candidate.**
Measured with E2 on `Book`: `ambiguousWith = ["metamodel_1::Book","metamodel_2::Book"]` in every
run. `metamodel_2::Book, metamodel_2::Book` needs one of these states:

- **(a)** two distinct classes named `Book` whose `father` chains both reach `metamodel_2`, found
  by the E1 walk at command 7. Example: two `Book`s in two packages of `metamodel_2`, which
  per-namespace uniqueness allows. Another example: a build older than `09ce4b60c` (2026-09-17
  12:24), where `create class Book` on a metamodel that already held one made a second one
  (`create.ts:357-360` states it: "from then on every script naming X stopped on the ambiguity
  message").
- **(b)** a `metamodel_1` class whose `father` chain reaches `metamodel_2` first, which is a
  structural anomaly.
- **(c)** in the scope guard, two *other* metamodels both named `metamodel_2`.

None of these arises in a fresh project. See §9, Q-A1.

Also measured: a retry of the whole script on the current code is refused at command 1 with
`DUPLICATE_NAME` in both modes, so a retry does not create a second `Book`.

## Q4. Is the target metamodel available at resolution time?

**Yes.** The chain is:

- `JjScriptService.execute` sets `targetMetamodelId` from `scope.metamodelId` (bound), or from
  `getActiveMetamodel()` or the M1 model's `instanceof` (unbound) (`JjScriptService.ts:44-60`).
- `JjScriptExecutor` stores it in `context.targetMetamodelId` (`executor.ts:53-63`). The
  singleton is renewed when that value changes (`:340-359`).
- Every handler calls `getTargetMetamodel(context, project)` (`utils.ts:295-318`). The rule:
  - an explicit id wins;
  - a bound run with no match returns `null`;
  - otherwise the active metamodel, then `metamodels[0]`.
- `create.ts:272` passes it to parent resolution and, through the creators, to
  `resolveTypeClause` (`:852`).

The waiter (`elementWaiter.ts:64`) and `getDefaultParent` (`utils.ts:250-275`) compute the same
value independently.

Measured: the typed path follows the **active tab**. With `metamodel_1` active (after
`DockManager.open2`), `create containment copiesF in Book type BookCopy` succeeded:
- `in Book` resolved in E1 to **`metamodel_1::Book`**;
- `type BookCopy` fell through to E2 and resolved to **`metamodel_2::BookCopy`**.

The result is a cross-metamodel reference created with no warning (§A, V7c).

## Q5. IDs of classes created in the run: seen twice, or missed?

**IDs.** The id that `create class` returns (`create.ts:533`, `newClass.id`) **equals** the
`idlookup` id in every run: 3 of 3 runs, `Pointer…_USER_25` and `…_USER_28` for example. No
temporary-vs-persisted split was observed for `DClass.new(…, persist=true)`. (The CLAUDE.md §9.1
temporary-id invariant is stated for `DObject.new()`. It was not re-measured here for DObject.)

**Seen twice: no.** E2 reaches a class through several collections (`metamodels` → `packages` →
`classes`, and also `LProject.packages` and `LProject.classes`). `selectTarget` deduplicates
by `element.id` (`resolvers.ts:273-275`). Measured: no doubled candidate in any run.

**Missed: yes, measured.** Visibility latency of a class created by `create class`
(unbound mode, polled every 5 ms):

| class | returned at | in `idlookup` | `father` set | in `metamodel_2.classes` = E1 resolves it |
|---|---|---|---|---|
| Book | 3 ms | 3 ms | 3 ms | **268 ms** |
| Lat1 | 1 ms | 1 ms | 1 ms | **167 ms** |
| Lat2 | 1 ms | 1 ms | 1 ms | **65 ms** |

Within that window:

- **Unbound.** E1 misses `metamodel_2::Book`, so `create.ts:285-291` falls back to E2, which
  finds only `metamodel_1::Book` and writes the attribute there. The console shows
  `[JjScript] Parent 'Book' not found in target metamodel, trying project-wide search`.

  | gap | `title` → | `isbnCode` → | fallback warnings |
  |---|---|---|---|
  | 20 ms | **metamodel_1::Book** | **metamodel_1::Book** | 2 |
  | 150 ms | **metamodel_1::Book** | metamodel_2::Book | 1 |
  | 600 ms | metamodel_2::Book | metamodel_2::Book | 0 |

  Every command reported `success: true`.
- **Bound.** The scope guard sees `Book` only in `metamodel_1` and refuses command 2 with
  `OUT_OF_SCOPE`, at 20 ms and at 150 ms.

**Why the waiter does not cover it.** `findUnresolved` (`elementWaiter.ts:127-133`) counts the
dependency as resolved when E1 **or E2** finds anything. `metamodel_1::Book` is the only visible
`Book`, so E2 returns it and the waiter exits on its first poll. Command 5 (`in BookCopy`, which
has no homonym) did wait: 177 ms measured.

## Q6. Where the dialog's line number comes from

- `ScriptBlock` builds `commands` by dropping blank lines, `//` and `#` comments, and `target`
  lines (`ScriptBlock.tsx:259-264`).
- `lineToCommandIndex` (`:270-280`) and `getScriptLine` (`:284-287`) map a command index back to
  the 1-based **editor line**, using the same predicate.
- Every pause writer stores both `lineNumber: i + 1` (the command index, which Skip and recovery
  use as an index) and `scriptLine: getScriptLine(i)`: `:489-490`, `:555-556`, `:743-744`,
  `:796-797`, `:930-931`, `:964-965`, `:1071-1072`, `:1096-1097`, `:1157-1158`, plus `:384-385`
  for the validator path. Count: 5 `setPauseInfo({` object literals and 10 `scriptLine:`
  writers.
- The title prints `scriptLine ?? lineNumber` (`ExecutionErrorDialog.tsx:93`).
- The field is documented in `errors.ts:466-472`, and was introduced by `fad85bae5`
  (2026-09-17 10:21). `139350eea` (2026-09-18) aligned the skipped-lines summary.

The source line **is already tracked**, by this mapping. The parser does not provide it: each
command is parsed alone (`ScriptBlock` calls `onExecute([commands[i]])`, `:467`), so
`CommandNode.position` (`parser.ts:127`) is relative to that one string.

For the quoted script, command 7 maps to line 14. Seeing **7** therefore needs one of these:

- a code block whose text has none of the comment or blank lines, so `getScriptLine(6) = 7`;
- a bundle older than `fad85bae5`, where only `lineNumber` existed and 7 is what it prints.

No other writer of the title exists: `"Execution stopped at line"` occurs only at `:93`, and
`ScriptExecutionWindow` is never mounted (§8, A1). This was **not executed live**, because the
probe could not mount a Jjodie reply without an LLM provider (§6).

## Q7. Error box overflow

- `.exec-error-message p` (`ExecutionErrorDialog.scss:190-205`) sets **no** `white-space`,
  `overflow-wrap` or `word-break`. It wraps only at spaces and inherits `white-space`.
- The neighbours do set wrapping:
  - `.exec-error-command code` has `word-break: break-all; white-space: pre-wrap` (`:174-187`);
  - `.exec-error-list-message` has `word-break: break-word` (`:286-291`).
- The box itself has no overflow rule. `.exec-error-dialog` has `max-width: 480px; overflow:
  hidden` (`:54-62`).
- The dialog renders **inside** the ScriptBlock DOM (`ScriptBlock.tsx:1563`), inside the Jodie
  window. `.jodie-window--visible { transform: translateY(0) }` (`JodieWindow.css:53-56`)
  creates a containing block, so the `position: fixed` overlay (`.scss:38-48`) is laid out
  against the **Jodie window**, not the viewport.
- The five `white-space: nowrap` selectors in `JodieWindow.css` (`326`, `1304`, `2140`, `2318`,
  `2795`) and the one in `MarkdownRenderer.scss:303-304` are on elements that are not ancestors
  of `.md-jjscript-wrapper`. `.jodie-message-text` is `pre-wrap` (`:579-580`).

**Not settled.** None of the tokens in the two quoted messages is long enough to overflow
~400 px by itself. Per §5, the pixel is the measurement, and it was not taken. It needs these
values on the live dialog: the computed `white-space` and `overflow-wrap` of the `p`, and
`scrollWidth` versus `clientWidth` of `.exec-error-message`.

---

## A. Probe runs (measured, 2026-09-23, localhost:3000 serving this tree)

- **Setup, every run:** project `NR_*`; `metamodel_1` (package `metamodel_1`) with `Book`;
  `metamodel_2` (package `metamodel_2`) empty. Active artefact after setup: `metamodel_2`, M2.
  - Note: `createM2` sets `lPackage.name = 'default'` (`Navbar.tsx:81-83`), yet the root package
    reads the metamodel's name.
- **Runs:**

  | run | result |
  |---|---|
  | bound, 20 ms and 150 ms | cmd 1 ok; cmd 2 `OUT_OF_SCOPE` |
  | unbound, 20 ms | 7/7 "success"; `title` and `isbnCode` on `metamodel_1::Book`; `copies` on `metamodel_2::Book` |
  | unbound, 150 ms | 7/7 "success"; `title` on `metamodel_1::Book`, `isbnCode` on `metamodel_2::Book` |
  | retry (bound → bound → unbound) | runs 2 and 3 refused at cmd 1, `DUPLICATE_NAME` |

- **Typed variants,** after commands 1 to 6 at a 600 ms gap (all in `metamodel_2`). Each variant
  used a distinct reference name:

  | id | mode, active | command | result |
  |---|---|---|---|
  | V3a | unbound, mm2 | `in metamodel_2::Book type metamodel_2::BookCopy` | ok |
  | V4a | unbound, mm2 | `in metamodel_2::Book type BookCopy` | ok |
  | V3b | bound | qualified parent and qualified type | ok |
  | V7b | bound | `in Book type BookCopy` | ok |
  | V3c | unbound, **mm1 active** | qualified parent and qualified type | ok, on `metamodel_2::Book` |
  | V7c | unbound, **mm1 active** | `in Book type BookCopy` | ok, on **`metamodel_1::Book` → `metamodel_2::BookCopy`** |

- **Controls:** 0 page errors in every run; 0 setup or control failures.
- **Declared probe defect:** the latency probe read `package.__raw.classifiers`, but the D-field
  is `classes` (`LModelElement.tsx:2033-2043`), so its "package has it" column read −1 and is
  discarded.

## 5. Tests that cover name resolution today

| file | what it covers |
|---|---|
| `jjscript/executor/__tests__/resolvers.test.ts` | 66 cases: kinds, exact vs case-only, ambiguity, member backtracking, `resolveEnumTypeTarget`, "A1 — two metamodels, one spelling" (`:504`), `resolveTypeTarget` (`:670`) |
| `jjscript/executor/__tests__/scopeGuard.test.ts` | 17 cases |
| `jjscript/__tests__/elementWaiter.test.ts` | M1 instance polling, and "M2 path unchanged" (`:97-111`) |
| `jjscript/__tests__/dependencies.test.ts` | 8 cases |
| `jjscript/__tests__/errorFromResult.test.ts` | the dialog's text for the reported "Unknown type" case |
| `jjscript/__tests__/summaryLines.test.ts` | 4 cases, the editor numbering of skipped lines |
| `jjscript/executor/__tests__/{activeArtifact,m2CreateGuard,superclassResolution}.test.ts` | adjacent |

All of them run on plain fake objects. **None exercises the propagation window**, and none
covers "a homonym in another metamodel satisfies the waiter", which are the F-A and F-B paths.
The line mapping is inside a component and is not executed by any test (`summaryLines.ts` is the
pure extract for the skipped lines only).

## 6. Gaps, declared

- **ScriptBlock and the dialog were not mounted.** A Jjodie reply needs an LLM provider, so Q6
  and Q7 rest on static reading only.
- **Probe environment.**
  - Boot count was not wired (`README-probes.md` §boot).
  - Timings come from one machine with 3 samples, and another session may be editing
    `frontend/src` at the same time.
  - The runs used a fresh project, not Alfonso's.
- **`TEMP-DISCOVERY` logs are committed** in `executor.ts` and `ScriptBlock.tsx` (16 lines).
  Stated only; not this lane's.

## 7. Dependencies and risks

- **Critical zone.** The resolution path does **not** touch any critical-zone file listed in
  the prompt:
  - it reads L-proxies and `Selectors.getAll`;
  - it writes through `D*.new` and `SetFieldAction` in `create.ts`.
- **Latency is the load-bearing fact.** Any rule that says "the target metamodel first, including
  classes created in this run" cannot be implemented by reading `LModel.classes`, which lags
  65–268 ms. It needs one of:
  - **(i)** a run-local registry fed by the ids that `create` returns (`idlookup` has them at
    +1–3 ms);
  - **(ii)** an `idlookup` + `father`-chain scan (the §3.6 idiom of `model/CLAUDE.md`);
  - **(iii)** a waiter that waits on the **target** metamodel and does not accept a project-wide
    answer.
- **The walk captures package names.** E1 matches the qualifier against **package** names before
  the metamodel's own name. `METAMODEL_COLLECTIONS` begins with `packages`, and root packages are
  named after their metamodel (measured). A package named like another metamodel would capture
  a `Metamodel::Name` walk.
- **Composition is not uniform.** Twelve call sites use E2 only (§Q1), so any "target first"
  rule applied to `create` alone leaves `set`, `move`, `copy`, `remove`, `rename`, `delete`,
  `list` and `show` on project-first.

## 8. Absence claims, each with its positive control (same invocation, `command grep`)

- **A1.** `<ScriptExecutionWindow` has no JSX mount. The only match is the type parameter at
  `ScriptExecutionWindow.tsx:74`. Control: `<ExecutionErrorDialog` gives 3 matches (2 mounts +
  1 type parameter).
- **A2.** `useMetamodelGeneration(` has no call site. The only match is its definition at
  `useMetamodelGeneration.ts:100`, which is the control that the search reached the file.
- **A3.** No run-local registry: `createdIn|createdClasses|runCreated` returns 0 lines in
  `jjscript` (non-test). Control: `ExecutionContext.variables` is found at `types.ts:515`.
- **A4.** The normalizer is not called on the chat or typed path. Calls to `normalize(`,
  `normalizeLine(` and `normalizeWithDetails(` in `components/Jodie`, `jjscript/services`,
  `jjscript/components` and `jjscript/executor`: exit 1. Control: `normalize,` is exported at
  `jjscript/index.ts:89`, 1 match.
- **A5.** No call sites for `findClassInMetamodel` (resolvers), `resolveParent`, `findElements`
  or `resolveEnumTypeTarget` outside `resolvers.ts`. Control: `jjscript/index.ts:58-59`
  re-exports two of them and is found.

## 9. Open questions for Alfonso (stop-and-ask: observations 1–3 do not match the current code)

- **Q-A1. Which build and which state?**
  - Was the tab loaded before 2026-09-17 10:21 (`fad85bae5`) and never reloaded? That bundle
    would print "line 7" and would still allow the duplicate `create class` (fixed in
    `09ce4b60c`, 12:24).
  - Had the script (or part of it) already run on `metamodel_2`?
  - Could you share the project export? Observation 2 needs two `Book`s under `metamodel_2`
    (§Q3 a/b).
- **Q-A2. Which surface ran defects 3 and 4?** The quoted text ("…Expected a class.
  'metamodel_2::BookCopy' is not a class reachable…") is the typed-command chat format,
  `message` followed by `> errors[0].message` (`JjScriptService.ts:366-381`). The dialog shows
  `message` and the **suggestion** instead (`errors.ts:440-459`). If they were typed, they ran
  **unbound**, and their target was the active tab. Which metamodel was on screen?
- **Q-A3.** Is F-A in scope? Attributes are written into the homonym in the other metamodel with
  `success: true`. It is live now, reproduced 2/2 at 20 ms.
- **Q-A4.** Is F-B in scope? The Jjodie-reply path refuses command 2 of any script that re-creates
  a name held by another metamodel.
- **Q-A5. Q7.** May the next lane mount the dialog in a probe (a canned Jjodie reply through
  `page.route` on the provider endpoint) to take the pixel measurement?

## 10. Options (description only; the design decision stays with Alfonso)

A single resolver with the rule *target metamodel first (including classes created in this
run), then other metamodels, ambiguity only among non-target candidates, `::` honoured
everywhere* would plug in as follows:

- **One function** replacing E3 and the ad-hoc compositions: a `resolveInScope(qn, kinds,
  context)` in `resolvers.ts` beside E1 and E2. Every call site in the §Q1 composition table
  moves to it:
  - `create.ts` parent (`:280-304`) and type (`:682`);
  - `set.ts:358`, `extends.ts`, `abstract.ts`, `create.ts:491-498`;
  - and, if the rule is meant to be global, the twelve E2-only sites.
- **"Created in this run"** needs a source that does not lag (§7):
  - a registry on `ExecutionContext` (optional field, allowed by rule 11), filled from
    `result.data.id` by `create` and read by the resolver;
  - or an `idlookup` scan of the `father` chain.

  The same source must feed the **waiter** (`elementWaiter.ts:127-133`) and the **scope guard**
  (`scopeGuard.ts:86`), or they keep answering from the lagging view.
- **"Ambiguity only among non-target candidates"** changes `selectTarget`'s contract, which is
  one list with one verdict. The resolver would call it twice: once on the target's candidates,
  then on the rest.
- **The waiter** would stop accepting a project-wide homonym for a bare name while the target
  lacks it. That addresses F-A and F-B at their source.
- **Q6 and Q7 are independent** of the resolver: Q6 already has a mapping, and Q7 is style only.
- **Touches:** `resolvers.ts`, `create.ts`, `set.ts`, `extends.ts`, `abstract.ts`,
  `elementWaiter.ts`, `scopeGuard.ts`, `types.ts` (an optional field), and the tests in §5. That
  is more than 5 files (rule 19): no critical-zone file, but a two-phase lane.

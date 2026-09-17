# JjScript: two silent defects (duplicate names, lost inheritance) and the skipped-line display

Phase 1, read-only. Prompt:
`docs/prompts/claude_2026-09-17_1024_prompt_jjscript_silent_defects_duplicates_extends_skipped.md`.
Branch `validation-skeleton`, worktree `/Users/alfonso/jjodel`, HEAD `f88026423`.

## Objective

Answer D1-D7 with measurements, so that the GO can fix the scope of three lanes:

- **L1** — a JjScript M2 `create` consults `checkM2NameUniqueness` before writing, instead of
  calling `D*.new` unconditionally.
- **L2** — `create class A extends B` resolves every superclass BEFORE `DClass.new`, and creates
  nothing when one is missing.
- **L3** — the run summary shows the skipped line in editor numbering.

## Files read (full paths)

Rules and decisions
- `CLAUDE.md` (the NON-NEGOTIABLE block, §3.3, §3.6, §3.13, §6, §17, §21)
- `docs/PROTOCOL.md` (P9, P11, P12)
- `docs/decisions.md` — series R-M2U-1..6 (from `:2716`)
- `docs/claude-code-log.md` — head, entries of 2026-09-17 and 2026-09-16
- `docs/discovery/discovery_2026-09-16_jjscript_forward_refs_structured_errors.md` §6

The verdict and its consumers
- `frontend/src/model/logicWrapper/nameUniqueness.ts` (596 lines, whole file)
- `frontend/src/model/logicWrapper/LModelElement.tsx` — `m2CreateRefused:133-149` and its eleven
  call sites (`:1940`, `:1952`, `:1963`, `:2468`, `:3262`, `:3281`, `:3289`, `:4154`, `:4562`,
  `:4860`, `:5182`)
- `frontend/src/joiner/classes.ts:2200-2260` (`LPointerTargetable.set_name`), `:1419`, `:1460-1485`
  (`defaultname` and the pending half), `:560-600` and `:650-700` (`Constructors` / `persist` / `end`)
- `frontend/src/model/__tests__/m2NameUniqueness.test.ts` (whole file, 39 tests)

JjScript
- `frontend/src/jjscript/executor/commands/create.ts` (1135 lines, whole file)
- `frontend/src/jjscript/executor/commands/extends.ts` (209 lines, whole file)
- `frontend/src/jjscript/executor/commands/rename.ts:90-188`
- `frontend/src/jjscript/executor/commands/instance.ts` (the two `already exists` sites)
- `frontend/src/jjscript/executor/errors.ts:60-260`, `:360-502`
- `frontend/src/jjscript/executor/executor.ts:60-140`, `:225-280`, `:380-425`
- `frontend/src/jjscript/executor/elementWaiter.ts` (whole file)
- `frontend/src/jjscript/executor/dependencies.ts` (the `extractDependencies` roles)
- `frontend/src/jjscript/executor/scopeGuard.ts:44-90`
- `frontend/src/jjscript/executor/resolvers.ts:340-520`
- `frontend/src/jjscript/executor/utils.ts` (whole file)
- `frontend/src/jjscript/executor/scriptValidator.ts:1-90`
- `frontend/src/jjscript/components/ScriptBlock.tsx:60-90`, `:135-140`, `:265-310`, `:410-600`,
  `:800-1100`, `:1150-1270`, `:1500-1532`
- `frontend/src/jjscript/components/ExecutionErrorDialog.tsx:190-330`
- `frontend/src/jjscript/services/JjScriptService.ts:170-200`
- `frontend/src/jjscript/recovery/rules.ts` (the single registered rule)
- `frontend/src/jjscript/types.ts:130-150`, `:440-500`
- `frontend/src/jjscript/parser/parser.ts:355-365`
- `frontend/src/jjscript/__tests__/scriptValidator.test.ts` (whole file)
- `frontend/src/components/Jodie/ChatMessages.tsx:238-270`, `:425-455`
- `frontend/src/services/JjodieRagService.ts` (the four JjScript example blocks)

Redux
- `frontend/src/redux/action/action.ts:90-230`, `:300-355`
- `frontend/src/redux/reducer/reducer.ts:430-460`, `:639`

## Measurements taken

| what | command | result |
|---|---|---|
| typecheck baseline | `npm run typecheck`, **full output** counted | **33** `error TS` — the §17 baseline |
| the M2 verdict bench | `npx vitest run src/model/__tests__/m2NameUniqueness.test.ts` | **39 passed, 0 failed** |
| node-importability of the verdict | `npx tsx` on a two-line file importing `nameUniqueness.ts` | **fails**: `ERR_UNKNOWN_FILE_EXTENSION ".css"` from `monaco-editor/esm/vs/editor/standalone/browser/standalone-tokens.css`, reached through the `joiner` barrel |
| line numbers cited by the prompt | `command grep -n "D[A-Za-z]*\.new(" create.ts` | 439 / 1023 / 1060 all confirmed; the extends block is 452-467 and 469-482 |

`command grep` throughout, never the interactive wrapper (CLAUDE.md §5).

---

## D1 — every `create` path that writes an M2 named element

Every one of the nine writes below calls `D*.new` directly. **JjScript bypasses the gate on all of
them**; the L layer gates the equivalent primitive on all of them but one (`datatype`, which has no
L primitive and no JjScript command either).

| `elementType` | creator (`create.ts`) | the write | `M2NamespaceKind` | prospective `father` | L primitive that gates it |
|---|---|---|---|---|---|
| `class`, `abstract class`, `interface` | `createClass:423` | `DClass.new` **:439** | `classifier` | `parentElement` — LPackage, or the LModel when the metamodel has no package | `LPackage.addClass` (`LModelElement.tsx:1952`) |
| `enum`, `enumeration` | `createEnumerator:1050` | `DEnumerator.new` **:1060** | `classifier` | same as above | `LPackage.addEnumerator` (`:1963`) |
| `package` | `createPackage:1013` | `DPackage.new` **:1023** | `package` | same as above | `LPackage.addPackage` (`:1940`), `LModel.addPackage` (`:5182`) |
| `attribute` | `createAttribute:708` | `DAttribute.new` **:750** | `feature` | the parent **LClass** (`isClass` guard at `:725`) | `LClass.addAttribute` (`:3262`) |
| `reference` | `createReference:771` | `DReference.new` **:820** | `feature` | the parent LClass (`:788`) | `LClass.addReference` (`:3281`) |
| `containment`, `composition` | `createReference:771` (same fn, `isContainment=true`) | `DReference.new` **:820** | `feature` | the parent LClass | `LClass.addReference` (`:3281`) |
| `operation` | `createOperation:878` | `DOperation.new` **:925** | `feature` | the parent LClass (`:895`) | `LClass.addOperation` (`:3289`) |
| `parameter` | `createParameter:946` | `DParameter.new` **:992** | `parameter` | the parent **LOperation** (`isOperation` guard at `:961`) | `LOperation.addParameter` (`:2468`) |
| `literal` | `createEnumLiteral:1081` | `DEnumLiteral.new` **:1115** | `literal` | the parent **LEnumerator** (`isEnum` guard at `:1098`) | `LEnumerator.addLiteral` (`:4860`) |

Three notes on the table.

- **`datatype` has no JjScript command.** `PARENT_KINDS_BY_ELEMENT_TYPE` (`create.ts:123-137`) has
  no entry and the `switch` at `:349-411` has no case, so `create datatype X` falls to
  `UNSUPPORTED_TYPE`. The `datatype` namespace of R-M2U-3 is therefore out of L1's reach by
  construction, not by decision.
- **`instance` leaves at `:232`** for `executeCreateInstance`. That is M1, governed by R-S1-*, not
  by R-M2U-*, and it is outside the prompt's «JjScript M2 creates». For the record it has **no**
  duplicate check either: the two `already exists` sentences in `instance.ts` are the singleton
  message (`:328`) and the M1 **rename** (`:578`). Declared, not touched.
- **The father is always an L proxy, never a bare id.** `getDefaultParent` returns
  `targetMetamodel.packages[0]` or the LModel (`utils.ts:268-273`); the resolvers walk L collections
  (`resolvers.ts:479-507`) and return the L element. So `checkM2NameUniqueness({father: parentElement, …})`
  gets exactly the shape it reads. The creators then take `parent?.id || parent` for `D*.new`, which
  is the only place the id is needed.

**One fail-open case to declare, not to fix.** When the metamodel has no package at all,
`getDefaultParent` returns the LModel itself (`utils.ts:273`). For `kind: 'classifier'`,
`getM2NamespaceOf` builds its holder set from `packagesOfMetamodel(father)`, which is empty, so the
pool is empty and the verdict accepts. The same is true of the committed L path today
(`LPackage.addClass` is never reached in that state), so L1 does not make it worse. A metamodel
without a root package is not a state the UI produces.

---

## D2 — two creates in a row: is the first one visible to the verdict?

**Yes, in both of the two states that can obtain, and there is no window in between.** The two
halves of `getM2NamespaceOf` cover one state each, and the store moves from one to the other in a
single reducer pass.

### What `pendingChildrenOf` covers

`pendingChildrenOf(fatherIds)` (`nameUniqueness.ts:135-155`) reads
`DPointerTargetable.pendingCreation`, the dictionary the `Constructors` constructor writes at
`classes.ts:580` — before any action is fired. It returns the raw D-objects whose `father` is one of
`fatherIds`, and `getM2NamespaceOf` filters them by `m2KindOf(className) === kind`, so a pending
element joins exactly the namespace a committed one of the same className would. `includePending`
defaults to **true** for a prospective verdict (`nameUniqueness.ts:108-125`), which is the shape both
`m2CreateRefused` and `rename.ts` use.

The holder set matches the JjScript father in every row of D1: for `classifier` and `datatype` it is
every package of the metamodel, for `feature` the class plus its `allExtends`, for
`package`/`literal`/`parameter` the father itself. A pending `DClass` created under package `pA` has
`father === 'pA'` (set by `Constructors.setPtr("father", …)`, `classes.ts:588`), so it is found.

Measured, and already green on this branch: `m2NameUniqueness.test.ts` runs the **real** module with
only the `joiner` barrel mocked, and its last `describe` asserts each of these — a pending class
refuses its homonym, `includePending:false` on the same state accepts (the contrast control), the
pending element's kind decides its namespace, a pending class in a sibling package of the same
metamodel collides, one in another metamodel does not, a pending feature on the superclass shadows.
**39/39 passed.**

### What the committed half covers, and why there is no hole

`Action.fire()` buffers into `t.pendingActions` while a transaction is open (`action.ts:328-330`);
`FINAL_END` wraps the whole buffer into **one** `CompositeAction` (`action.ts:163-164`). The reducer
then, in a single pass, deletes `pendingCreation[elem.id]` on the `CreateElementAction`
(`reducer.ts:449`) and applies the `SetFieldAction` that puts the new element into
`pkg.classes` / `cls.ownAttributes` / `father.children`. The element leaves the pending dictionary
and enters the collection in the same tick: the two halves of the namespace hand over atomically.

**The dispatch is asynchronous**, by design: `action.ts:349` is
`setTimeout(()=>storee.dispatch({...this}), 0)`. So which of the two halves answers depends only on
whether a macrotask has elapsed since the previous create, and both answer the same:

- **ScriptBlock** (`ScriptBlock.tsx:496`, `:916`) sleeps `BATCH_DELAY_MS = 20` between commands, so
  the previous create is **committed**: the committed half answers.
- **`executeBatch`** (`executor.ts:393-399`) and **`executeBlock`** (`executor.ts:248-249`) only
  `await` the handler, which resolves in microtasks. The previous create may still be **pending**:
  the pending half answers.

### What `elementWaiter` guarantees — and why it is irrelevant here

`waitForDependencies` filters to `d.required` (`elementWaiter.ts:51`) and polls the **resolvers**
(not the namespace) for up to 500 ms. It guarantees that a required dependency — the `parent` of a
nested element, a `target` — is resolvable before the handler runs. It says nothing about
duplicates: a name that already exists is not a dependency, and an element that must NOT exist is
not something a waiter can wait for. It also never waits for a superclass: `dependencies.ts:169-175`
marks every `superclass` role of a `create` as `required: false`.

### Is a probe needed?

**No, and a node probe is not possible.** Measured: `nameUniqueness.ts` cannot be imported under
`tsx` — the `joiner` barrel pulls `monaco-editor`, and node refuses its `.css`
(`ERR_UNKNOWN_FILE_EXTENSION`). The bench that CAN execute the subject is the existing vitest file
with the barrel mock, and it already covers both halves. L1's own tests belong there and in a
`create.ts`-side pure-function bench (see D3).

---

## D3 — route through the L primitives, or consult the verdict in `create.ts`?

**Recommendation: consult the verdict in `create.ts`, before `D*.new`. Do not route through the L
primitives.** Three reasons, in order of weight.

1. **Toasts.** Every L creator refuses through `m2CreateRefused` (`LModelElement.tsx:133-149`), whose
   only channel is `toast.error(verdict.reason)` — and `toast.warning` for the near-homonym. The
   prompt forbids a toast in a script run. Suppressing it would mean a flag on `m2CreateRefused`,
   i.e. changing the L layer for JjScript's benefit — out of scope and a core change (rule 5).
2. **The refusal carries no reason.** `addClass`/`addAttribute`/… return `undefined as any` on
   refusal. The handler could tell that something failed but not **what**, so it could not build the
   message the prompt asks for («names the existing element and the metamodel»). It would have to
   call `checkM2NameUniqueness` anyway to get the sentence — and then the verdict would run twice.
3. **The L creators do not accept what the handlers pass.** `addClass(name, isInterface, isAbstract,
   isPrimitive, isPartial, partialDefaultName)` has no `id`; `DPackage.new` takes `uri`/`prefix`
   which `addPackage` forwards but `DEnumLiteral.new`'s `value` reaches `addLiteral` in a different
   position; `addAttribute` additionally runs **creation-time type inference**
   (`LModelElement.tsx:3264-3272`) which `createAttribute` deliberately replaced with
   `resolveAttributeType` (2026-09-11). Routing through it would silently reinstate the inference the
   attribute lane removed.

Side effects each brings:

| | route through L primitives | consult the verdict in `create.ts` |
|---|---|---|
| toasts | **yes**, two kinds | none |
| `ClassNameChanged.<id>` | unchanged either way — it is `set_name`'s, not the creators' |
| transactions | `D*.new` still opens its own; no outer TRANSACTION is added either way, so CLAUDE.md §3.3 is satisfied by both | idem |
| type inference on attributes | **reinstated**, a regression | none |
| the refusal sentence | lost | `verdict.reason`, verbatim |
| precedent | none | `rename.ts:119-140` — consult the verdict, then write; the file already imports the module |

`D*.new` stays ungated, as R-M2U-4 requires: the loading door reproduces a state, the gate lives
where the user gesture arrives. A JjScript `create` is a user gesture, and after L1 the gate sits in
its handler.

**Testability, which decides where the code goes inside `create.ts`.** `create.ts` does not import
under node either (same barrel). So L1's check must be extracted into a **pure function** taking the
verdict-shaped inputs — e.g. `(father, kind, name) -> ExecutionResult | null` with the verdict
injected or the module imported — so the bench can execute it (P11, and the lane A/B precedent of
2026-09-16: `errorFromResult.test.ts` tests `errors.ts`, which does import). A source-text test is
not acceptable here (CLAUDE.md §5).

---

## D4 — error codes, and where the warning goes

**L1: `DUPLICATE_NAME`.** It is in `KNOWN_ERROR_CODES` (`errors.ts:420`), so `errorFromResult` keeps
it instead of collapsing it to `OPERATION_FAILED`. Its table entry (`errors.ts:186-191`) is
`skippable: true` — Skip Line is offered (`ScriptBlock.tsx:1521`, `ExecutionErrorDialog.tsx:198`) —
and its suggestion is *«Use a different name or delete the existing element first.»*, which fits. The
handler's own `message` wins over the table's (`errorFromResult` spreads `base` then overrides
`message`), so the sentence the user reads is the one L1 writes.

**L2: `PARENT_NOT_FOUND`**, matching D5. Also in `KNOWN_ERROR_CODES`, also `skippable: true`
(`errors.ts:179-184`), suggestion *«Make sure the parent was created earlier in the script.»* — the
right advice for a forward superclass. The code is overloaded inside `create.ts`, where the
*container* not-found also uses it (`:333`), but nothing reads the code to tell them apart: the
dialog renders message and suggestion only (`ExecutionErrorDialog.tsx:225-256`), and the single
recovery rule matches on the command text plus the literal sentence *«Literals can only be added to
enums»* (`recovery/rules.ts:89-94`), never on a code. L1's and L2's messages must simply not contain
that sentence.

**The near-homonym warning: `ExecutionResult.warnings`** (`types.ts:454`). Where it is rendered:

- **Rendered** on the typed-command surface: `JjScriptService.formatResult` emits `⚠ <warning>`
  (`JjScriptService.ts:190-196`).
- **NOT rendered** on the ScriptBlock surface. `ScriptLineResult.warnings` is declared
  (`ScriptBlock.tsx:64`) and filled by Jodie (`ChatMessages.tsx:442`), but `warnings` appears
  **nowhere else** in `ScriptBlock.tsx` — `command grep -n "warnings" ScriptBlock.tsx` returns the
  single line 64. Positive control: the same grep for `errors` in that file returns the five sites
  lane B wired on 2026-09-16, so the search has signal.

So a near-homonym create inside a script block succeeds silently today, and will keep doing so after
L1 unless the render is added. **That is a display gap, and it is the same family as L3.** It is not
in the prompt's DOVE. Flagged for the GO: either accept it (the warning is carried, and the typed
surface shows it) or add the render to L3's scope explicitly.

---

## D5 — the standalone `A extends B` with a missing `B`

**Confirmed: it already fails hard, and it already uses the code L2 should use.**
`executeExtends` (`extends.ts:23`) resolves the child (`:45-50`), guards its kind (`:65-76`),
resolves the parent (`:79-84`) and, when it is missing, returns

```
success: false
message: `Parent class not found: ${qualifiedNameToString(parentClass)}`
errors: [{ code: 'PARENT_NOT_FOUND', message: `Could not find class '…'` }]
```

(`extends.ts:86-96`). Nothing is written before that point: the single `SetFieldAction` is at `:143`,
after every guard. It also refuses a parent that is not a class (`:100-110`) and a cycle (`:113-123`).

**The message and the code should match L2**, and `PARENT_NOT_FOUND` already does. The two sentences
will differ in wording because the commands differ (`Parent class not found: B` versus something
naming the class being created), and that is right: what must agree is the code and the fact of
refusing, not the string.

---

## D6 — L3: the render site, and the inverse mapping

**Render site — exactly one.** `ExecutionErrorDialog.tsx:281-287`:

```tsx
{skippedLines.length > 0 && (
    <div className="exec-error-section">
        <label className="exec-error-label">Skipped lines:</label>
        <div className="exec-error-skipped-lines">{skippedLines.join(', ')}</div>
    </div>
)}
```

Nothing else reads the field: `command grep -rn "skippedLines" frontend/src` returns only
`ScriptBlock.tsx`, this component and the `ExecutionSummary` declaration (`errors.ts:495`).

**The space it is in.** `skippedLinesSet` holds `i + 1`, a **command index**, at all five writers:
`:832` (`handleSkipAndContinue`), `:951` and `:844` (the two completion summaries of that handler),
`:1087` (`runCommandsFromIndex`), `:1170-1178` and `:1200` (`skipMatchingCreateLiteral`), plus
`:1236` (`handleCloseErrorDialog`). The `errors` list beside it in the same dialog is already in
**editor** space — every writer passes `getScriptLine(i)` (`:472`, `:538`, `:895`, `:922`, `:1037`,
`:1056`). So the dialog currently prints two different numberings side by side.

**The inverse mapping.** `getScriptLine(commandIndex)` (`ScriptBlock.tsx:283-286`) is a `useCallback`
over `lineToCommandIndex` (`:269-278`), the per-editor-line array that is `null` for a blank line, a
`//`/`#` comment or a `target ` directive, and the running command index otherwise. It returns the
**1-based editor line**, falling back to `commandIndex + 1`.

**Where the mapping goes.** At the single call site
`<ExecutionErrorDialog summary={executionSummary || undefined} …>` (`ScriptBlock.tsx:1516-1523`) —
a `useMemo` mapping `executionSummary.skippedLines` through `getScriptLine(n - 1)`. This is display
only: `skippedLinesSet`, `runCommandsFromIndex`, `handleSkipAndContinue` and the `EXECUTION_PAUSED`
detail all keep the command index, as the prompt requires, and `ExecutionErrorDialog.tsx` — which is
**not** in DOVE — is not touched.

---

## D7 — Jjodie scripts re-run on a metamodel that already holds their classes

**Confirmed.** A Jjodie-generated script opens with `create class …` or `create package …`. Today
that creates a second homonym silently; after L1 the first such line returns `success: false` with
`DUPLICATE_NAME`, which is `skippable`, so the run pauses on line 1 with the Skip Line button
offered and, if the user skips, every subsequent `create` of an already-present name pauses again.
That is the intended trade: the alternative is the metamodel this defect produces, where every later
script that names `X` stops on the A1 ambiguity message.

**No test or flow relies on duplicate creation succeeding.** Measured:

- `command grep -rn "create class" frontend/src` returns 40+ hits, **all** in
  `jjscript/__tests__/scriptValidator.test.ts` (a pure parser/validator bench that executes nothing),
  one in `jjscript/autocomplete/types.ts:215` (an example string), and the RAG documents below.
  Positive control: the same grep over `frontend/src/jjscript/executor/` returns 0, and a grep for
  `success` in `create.ts` returns 37 — the tree was searched.
- The one validator test that *contains* a repeated name,
  `scriptValidator.test.ts:162-170` («accepts a name declared both before and after the reference»),
  asserts only `validateScriptIntegrity(...).valid === true`. It never executes the script, so L1
  cannot turn it red.
- The Jjodie RAG corpus is `frontend/src/services/JjodieRagService.ts`: four JjScript example blocks
  (`:549`, `:611-619`, `:966-996`, `:1056-1111`). **None of them creates the same name twice.** They
  are prompt material for the LLM, not executed scripts.

---

## Out of scope, as the prompt asks: does L1 make the old soundness rule's second branch true?

`scriptValidator.ts:35-44` states the rule and why its naive form is unavailable: *«"if X did exist,
the later declaration would fail as a duplicate" is NOT available here: `create class|enum|package`
performs no duplicate check at all»*.

**After L1 that branch becomes true for the kinds L1 gates, and only for those.** Concretely it
becomes true for `class`, `abstract class`, `interface`, `enum`, `enumeration` and `package` — which
is precisely the CLASSIFIER + `package` set the forward-reference pass already restricts both sides
of its comparison to (`scriptValidator.ts:54-57`). It stays false for nothing that pass looks at.

Not acted on. Widening the pass, or dropping `existingClassifierNames`, is a lane of its own.

---

## Risks

1. **L2 changes a script that "works" today into one that stops.** `create class ALU extends
   FunctionalUnit` followed by `create class FunctionalUnit` currently produces `ALU` with no
   generalization and reports success; after L2 it creates nothing and pauses. The validator accepts
   that script (`scriptValidator.test.ts:152-160`, and the header excludes `create class A extends B`
   from the forward-reference pass at `:52-54`), so the refusal surfaces at run time, not before. This
   is the decision already taken in the prompt («a command either does what it says or nothing»), but
   it is a change of committed behaviour and belongs in the log entry's `Regressions` reasoning.
2. **L1 refuses scripts users are used to re-running.** D7. Expected, and the reason for the lane.
3. **The near-homonym warning is invisible on the script surface.** D4. If L1 emits it into
   `warnings`, nothing in `ScriptBlock` renders it. Decide at the GO.
4. **`create class A extends B` does not check that `B` is a class.** `resolveElement` is
   unrestricted on kinds at `create.ts:455-462` and `:473-479`, so an enum named `B` can end up in
   `extends`. `executeExtends` **does** guard this (`extends.ts:100-110`). L2 as specified changes
   only *when* resolution happens and what failure does, not the kinds — so the asymmetry survives.
   Flagged, not proposed.
5. **`create class` with no name.** The grammar requires one (`validateScriptIntegrity('create class')`
   is refused, `scriptValidator.test.ts:28`), and `checkM2NameUniqueness` returns `ok` for
   `undefined`/`null` by design, so the auto-name path is untouched. No risk, recorded so the lane
   does not add a guard that would break it.

## Open questions for the GO

- **Q1 — the scope of kinds for L1.** All nine rows of D1, or only the three the prompt's background
  names (`class`, `package`, `enum`)? The remaining six (`attribute`, `reference`,
  `containment`/`composition`, `operation`, `parameter`, `literal`) have the same bypass and the same
  L-layer gate, and the same check covers them with one more argument. Recommendation: **all nine**,
  since a partial gate leaves the same defect under a different command.
- **Q2 — the near-homonym warning.** Emit into `warnings` and accept that ScriptBlock does not show
  it, or extend L3 to render it? (D4.)
- **Q3 — L1's message shape.** The prompt says it must name «the existing element and the
  metamodel». `verdict.reason` names the element (`Name "X" already used by Class "X"`) but not the
  metamodel; the metamodel name is available from `targetMetamodel?.name`. Confirm the sentence, e.g.
  `Name "X" already used by Class "X" in metamodel 'MM'.` — appended, so the shared `refusalReason`
  stays the prefix and `nameUniqueness.ts` is not touched.
- **Q4 — L2's sentence.** Confirm the wording, given that the code is `PARENT_NOT_FOUND` and the
  standalone command says `Parent class not found: B`.

## HARD STOP

Phase 1 ends here. No file under `frontend/` was modified; `docs/mde-intelligence-2026/` and the
files of other lanes were not touched.

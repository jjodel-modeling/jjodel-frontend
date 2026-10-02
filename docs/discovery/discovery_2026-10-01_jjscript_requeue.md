# Discovery: JjScript Run, scoped wait, deferred re-execution, one summary modal

Prompt-ID: P-2026-10-01-1725 · prompt `docs/prompts/` (committed at `465fbc09f`) · session unknown
Tree: `~/jjodel-w-jjsrequeue`, branch `jjscript-requeue`, HEAD `465fbc09f` · executor: Anthropic Claude Opus 5.5
Phase 1, read-only except for one uncommitted repro test (§3.1). This report is a set of hypotheses with evidence; whoever uses it downstream rereads the real files.

## 0. Answer in brief

1. **Root cause confirmed, measured.** A vitest repro under the node environment, with the real resolvers, parser, dependency extraction and scope guard, reproduces the exact message of 2026-10-01. `waitForDependencies` returns at the first poll because `FlowChart::Node` satisfies the project-wide fallback (`elementWaiter.ts:131-133`). Then `checkBoundScope` refuses with `'Node' is not in 'metamodel_1'; qualify as FlowChart::Node to target another metamodel.` The positive control (no homonym) waits until `Node` arrives and the guard accepts it. A third control shows it is a race, not a scope error: once `metamodel_1::Node` is visible, the guard accepts.
2. **R-JS-2 holds as written.** The fix fits in `findUnresolved`: in a bound M2 run, a bare name stops falling back project-wide. Qualified names, unbound runs and M1 are unchanged. `executor.ts` does not change.
3. **R-JS-3 is sound because every deferrable failure writes nothing.** Exact list (§3.2), all checked "nothing written before the failure":
   - Codes: `PARENT_NOT_FOUND`, `CHILD_NOT_FOUND`, `MEMBER_NOT_FOUND`, `NO_PARENT`, `ELEMENT_NOT_FOUND`, `UNKNOWN_ATTRIBUTE_TYPE`, `UNKNOWN_REFERENCE_TYPE`, `UNKNOWN_OPERATION_TYPE`, `UNKNOWN_PARAMETER_TYPE`, `UNKNOWN_TYPE`, `OUT_OF_SCOPE`, `AMBIGUOUS_OUT_OF_SCOPE`.
   - Verbs: `create`, `add`, `set`, standalone `extends`.
   - `TARGET_NOT_FOUND` is dropped: no handler emits it.
   - The code is read from `result.errors[0].code`, never from `errorFromResult`, which maps `OUT_OF_SCOPE` to `OPERATION_FAILED` (`errors.ts:449-451`).
4. **R-JS-4 is a one-argument change.** `ScriptBlock.tsx:375` is the only caller that passes the name set. Without it the forward pass stands down (`scriptValidator.ts:441-445`). `scriptValidator.ts` itself does not change.
5. **R-JS-5/6, three surprises:**
   - (a) Run has no success toast. `JjScriptSuccessNotification` is rendered only by `JjScriptOutput` inside `JjScriptConsole`, which nothing mounts. Run's success surface is the inline strip `N commands applied` (`ScriptBlock.tsx:1526-1531`).
   - (b) `ScriptExecutionWindow` runs multi-line scripts but nothing mounts it either (no `<ScriptExecutionWindow`, and no host passes `onOpenExecutionWindow`). Ticket, no adoption.
   - (c) The only recovery rule never fires in the live host. `ScriptBlock`'s only host (Jjodie, through `MarkdownRenderer.tsx:103-108`) passes no `availableTargets`, so the rule receives `metamodel: null` (`ScriptBlock.tsx:1019-1021`) and returns at its step 3 (`rules.ts:97`). Ticket.
6. **`ScriptBlock` cannot know the scope** (it lives in a `MessageBubble` closure, `ChatMessages.tsx:71-74`). So the figures snapshot every model of the project and show the ones that changed. "After" is read live in the dialog, through `useSelector`, so the propagation race cannot under-count the last command.
7. **Is a Run one undo step today? No.** Each command is a separate awaited call with a 20 ms sleep between commands (`ScriptBlock.tsx:467`, `:526`). Each fired action pushes its own undo delta when relevant (`reducer.ts:1259-1262`). `TRANSACTION` cannot span the awaits, and Rule 12 forbids wrapping the creators.
8. **Phase 2 DOVE, amended.** It is 9 code files plus closure (Rule 19, listed in §6):
   - `elementWaiter.ts`, with a new test file `executor/__tests__/elementWaiterScope.test.ts`, because the existing waiter test mocks the resolvers.
   - `runPasses.ts`, with its test.
   - A new pure `components/runFigures.ts`, with its test.
   - `scriptValidator.test.ts`.
   - `ScriptBlock.tsx`.
   - A new `RunSummaryDialog.tsx` and `.scss`. `ExecutionErrorDialog` is untouched.
   - Inbox: a new `docs/log-inbox/jjscript.md` (`rotate-log.ts:50` folds every `*.md`).
9. **Gates measured at HEAD:**
   - typecheck: 14 errors, the known set, with the repro on disk.
   - vitest `src/jjscript`: 16 of 17 files, 454 tests passed. 1 file is red at import (`context-binding.test.ts`, `window is not defined`, known).
10. **Decisions taken (unattended):** 16, in §7. **Decisions awaiting Alfonso:** none. Nothing here is on the RC-26 list.

No questions. Phase 2 can start from §6 and §7 as written.

## 1. Objective and hypotheses under test

Objective: confirm or refute the chat's root cause. Then measure what R-JS-2..6 need: the wait predicate, the error codes and their write order, the three Run loops of `ScriptBlock.tsx`, the figures, and undo.

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A homonym in another metamodel satisfies the waiter's project-wide fallback, so the wait ends before the bound metamodel's element is visible, and the guard then refuses | **Holds**, measured (§3.1) |
| H2 | The wait predicate and the guard's acceptance predicate disagree for bound bare names | **Holds**, read: waiter `elementWaiter.ts:127-133` vs guard `scopeGuard.ts:84-105` |
| H3 | Every unresolved-name failure of a constructive verb writes nothing before failing | **Holds** for the twelve codes of §3.2. **Falsified** for exception codes (`CREATE_CLASS_ERROR`, `CREATE_REFERENCE_ERROR`, `DELETE_ERROR`), which stay final |
| H4 | `validateScriptIntegrity`'s forward pass has callers other than Run | **Falsified**: one caller, `ScriptBlock.tsx:375` |
| H5 | Run from `ScriptBlock` shows `JjScriptSuccessNotification` | **Falsified** (§3.4) |
| H6 | `ScriptExecutionWindow` runs multi-line scripts in the live app | **Partly**: it runs them (`ScriptExecutionWindow.tsx:323`), but nothing mounts it |

## 2. Files read (full paths under `/Users/alfonso/jjodel-w-jjsrequeue/`)

- Rules:
  - `CLAUDE.md` (in full).
  - `docs/PROTOCOL.md` (in full).
  - `docs/decisions.md`: lines 140-235 (RC-20..29) and 4955-4994 (Serie R-JS); grep `forward`, `jjscript`.
  - `frontend/src/jjscript/CLAUDE.md`.
  - `docs/claude-code-log.md`: head, lines 1-40.
- Prior reports:
  - `docs/discovery/discovery_2026-09-17_superclass_same_script_race.md` (in full).
  - `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md` (in full).
- Commit messages: `2b357af17`, `de77f22af`, `9345a4046`, `fad85bae5`, `139350eea`, `09ce4b60c`.
- Executor:
  - `frontend/src/jjscript/executor/elementWaiter.ts`, `scopeGuard.ts`, `executor.ts`, `dependencies.ts`, `scriptValidator.ts` (in full).
  - `utils.ts` (in full).
  - `resolvers.ts` (1-160, 230-580).
  - `errors.ts` (1-110, 270-295, 417-502).
  - `superclassResolution.ts` (60-72).
  - `commands/create.ts` (340-356, 596-626, 700-716, 818-830).
  - `commands/set.ts` (50-145).
  - `commands/abstract.ts` (76-98).
- Components:
  - `frontend/src/jjscript/components/ScriptBlock.tsx` (in full).
  - `ExecutionErrorDialog.tsx` (in full).
  - `ScriptExecutionWindow.tsx` (grep).
- Recovery: `frontend/src/jjscript/recovery/rules.ts`, `types.ts` (in full).
- Tests:
  - `frontend/src/jjscript/__tests__/elementWaiter.test.ts` (in full).
  - `scriptValidator.test.ts` (test titles).
  - `frontend/src/jjscript/executor/__tests__/scopeGuard.test.ts` (1-80).
- Jodie and services:
  - `frontend/src/jjscript/services/JjScriptService.ts` (1-90).
  - `frontend/src/components/Jodie/ChatMessages.tsx` (grep, 397-462).
  - `frontend/src/components/common/MarkdownRenderer.tsx` (85-125).
  - `frontend/src/components/Jodie/JodieWindow.tsx` (180-200).
  - `frontend/src/contexts/TreeViewPanelContext.tsx` (307-378).
- Figures and model layer:
  - `frontend/src/components/StatusBar.tsx` (140-180, 325-345).
  - `frontend/src/model/logicWrapper/LModelElement.tsx` (5720-5810, 4895-4910, grep of getters).
- Redux and harness:
  - `frontend/src/redux/action/action.ts` (95-240).
  - `frontend/src/redux/reducer/reducer.ts` (1196-1268).
  - `frontend/scripts/gates/rotate-log.ts` (40-60).

The per-code write analysis of §3.2 was produced by a read-only subagent over the ten M2 handlers. Its load-bearing lines were rechecked by hand: `create.ts:340-356`, `:596-626`, `:700-716`, `:818-830`, `superclassResolution.ts:60-72`, `set.ts:50-145`, `abstract.ts:76-98`.

Searches use `git grep` or `command grep` with the exit status read. Every claim of absence below names its control.

## 3. Findings

### 3.1 Root cause, measured

The repro file is `frontend/src/jjscript/executor/__tests__/_tmp_requeue_repro.test.ts`. It is uncommitted and untracked. It is not gitignored: `git check-ignore` exits 1, and `.gitignore:68,71` cover only `scripts/smoke/` and `docs/discovery/harness/`. It stays for Phase 2, which turns it into `elementWaiterScope.test.ts` and deletes it.

What it runs:
- `parse('create attribute name in Node type String')`, then `extractDependencies`, giving `['Node:parent:true']`.
- Then `waitForDependencies(deps, {level:'M2', scopeBound:true, targetMetamodelId: metamodel_1})`, then `checkBoundScope(deps, metamodel_1, project)`. This is the order of `executor.ts:106-127`.
- `metamodel_1`'s `Node` is pushed into its `classes` 90 ms later, to stand in for Redux propagation.
- Stubs: `utils` (`getProject`, `getTargetMetamodel` as `utils.ts:295-306` for a bound context) and `joiner` (`{}`). Everything else is real.

Results on HEAD `465fbc09f`: `npx vitest run src/jjscript/executor/__tests__/_tmp_requeue_repro.test.ts` gives `Tests 3 passed (3)`, EXIT=0.

- **BUG**, with the homonym in FlowChart:
  - `wait.allResolved === true` with `waitedMs < 30`, while `metamodel_1.classes` is still empty.
  - Then `refusal.code === 'OUT_OF_SCOPE'` with the exact message of the screenshot.
- **CONTROL 1**, no homonym: `waitedMs >= 60`, `metamodel_1.classes.length === 1`, `refusal === null`. This control discriminates: it fails if the waiter does not wait.
- **CONTROL 2**, homonym present and `metamodel_1::Node` already visible: `refusal === null`. The defect is the timing, not the guard's rule.

The mechanism, as read:

```
elementWaiter.ts:127-133
        if (targetMetamodel) {
            const found = resolveElementInMetamodel(dep.name, targetMetamodel);
            if (found) return false; // resolved
        }
        // Fallback to project-wide
        const found = resolveElement(dep.name, project);
        return !found; // true = still unresolved
```

`resolveElement` returns the single project-wide match (`resolvers.ts:530-534`, `.element` of `resolveTargetInProject`). `FlowChart::Node` is the only `Node` until `metamodel_1`'s arrives, so it resolves.

The guard runs after the wait (`executor.ts:123-127`) and refuses a bare name held only elsewhere:

```
scopeGuard.ts:100-104
    const scopeName = (scope as any).name ?? '';
    return {
        code: 'OUT_OF_SCOPE',
        message: `'${asked}' is not in '${scopeName}'; qualify as ${spellings[0]} to target another metamodel.`,
```

Before `de77f22af` there was no guard, and the same race wrote into `FlowChart::Node` (V3 of the 2026-09-14 report, its probe P4).

### 3.2 Error codes of the M2 handlers and their write order

Legend: NW = nothing written before the failure, read from the handler body. Deferrable is the R-JS-3 verdict: verb constructive, unresolved-name class, and NW.

| Code | Emitted by (constructive verbs only unless noted) | Site | NW? | Deferrable |
|---|---|---|---|---|
| `PARENT_NOT_FOUND` | create/add attribute, reference, operation, parameter, literal (`in P` unresolved) | `create.ts:340-355` | yes | **yes** |
| `PARENT_NOT_FOUND` | create/add class, abstract class, interface `extends B` | `superclassResolution.ts:61-73`, called before `DClass.new` (`create.ts:493-510`) | yes | **yes** |
| `PARENT_NOT_FOUND` | standalone `A extends B`, B missing | `extends.ts:86-96` | yes | **yes** |
| `CHILD_NOT_FOUND` | standalone `A extends B`, A missing | `extends.ts:52-62` | yes | **yes** |
| `MEMBER_NOT_FOUND` | create/add with parent `X.m` (parameter in `Shape.draw`) | `create.ts:311-324` | yes | **yes** (create); no for delete and rename |
| `NO_PARENT` | create/add containment, composition (not in `needsParent`, `utils.ts:284`) | `create.ts:822-829` | yes | **yes** |
| `ELEMENT_NOT_FOUND` | set target (project-wide) | `set.ts:54-65` | yes | **yes** (set). No for abstract, move, copy, remove, delete, rename |
| `UNKNOWN_ATTRIBUTE_TYPE`, `UNKNOWN_REFERENCE_TYPE`, `UNKNOWN_OPERATION_TYPE`, `UNKNOWN_PARAMETER_TYPE` | create/add with `type`/`returns T` | `create.ts:700-714` (codes at `:596-626`), each before its `.new` | yes | **yes** |
| `UNKNOWN_TYPE` | `set <el>.type = T` | `set.ts:375-386`, called at `:90`, before the `TRANSACTION` at `:112` | yes | **yes** |
| `OUT_OF_SCOPE`, `AMBIGUOUS_OUT_OF_SCOPE` | any verb, bound run, before dispatch | `scopeGuard.ts:97-105` via `executor.ts:123-135` | yes | **yes** (constructive verbs) |
| `TARGET_NOT_FOUND` | none: `git grep -n TARGET_NOT_FOUND -- frontend/src/jjscript` finds `errors.ts:34/227/422` only. Control: the same command finds `PARENT_NOT_FOUND` at `create.ts:349` | — | — | dropped from the list |
| `AMBIGUOUS_PARENT`, `AMBIGUOUS_TYPE` | create/add, set | `create.ts:326-338`, `:688-699`; `set.ts:358-372` | yes | no: ambiguity inside the scope, and waiting cannot settle it |
| `DUPLICATE_NAME` | create/add | `m2CreateGuard.ts:96-104` via `create.ts:371-378` | yes | no |
| `SCOPE_NOT_FOUND`, `WRONG_LEVEL`, `NO_PROJECT`, `UNKNOWN_PROPERTY`, `NOT_A_CLASS`, `CIRCULAR_INHERITANCE`, `INVALID_PARENT_TYPE`, `UNSUPPORTED_TYPE`, `UNKNOWN_PRIMITIVE_POINTER`, `PARSE_ERROR`, `UNKNOWN_COMMAND` | various | `scopeGuard.ts:49-55`; `create.ts:260-268`, `:224-231`; `set.ts:68-82`; `extends.ts:66-76`, `:113-123`; `create.ts:832-845`, `:425-431`, `:669-676`; `executor.ts:76-86`, `:206-212` | yes | no |
| `CREATE_CLASS_ERROR`, `CREATE_REFERENCE_ERROR`, `CREATE_*_ERROR`, `CREATE_ERROR`, `SET_ERROR`, `EXTENDS_ERROR`, `ABSTRACT_ERROR`, `EXECUTION_ERROR` | exceptions | `create.ts:543-549` (after `DClass.new` at `:510` and `SetFieldAction extends` at `:523-525`, no TRANSACTION); `create.ts:910-917` (after `DReference.new` at `:863`); `executor.ts:225-233` | **no** (writes possible) | no |
| `DELETE_ERROR` | delete (destructive anyway) | `delete.ts:158-175`, after `deleteCanvasVerticesForModel` at `:148` | **no** | no |

Four more points bear on Phase 2:
- **The code to test is the executor's own.** `errorFromResult` maps every code outside `KNOWN_ERROR_CODES` to `OPERATION_FAILED` (`errors.ts:449-451`: `const code: JjScriptErrorCode = KNOWN_ERROR_CODES.has(first.code) ? ... : 'OPERATION_FAILED';`). `OUT_OF_SCOPE`, `UNKNOWN_*_TYPE`, `CHILD_NOT_FOUND`, `MEMBER_NOT_FOUND` and `NO_PARENT` are not known codes. So `isDeferrable` reads `result.errors?.[0]?.code` from the `ScriptLineResult`. ChatMessages passes it through (`ChatMessages.tsx:443-445`, `errors: result.errors`). A thrown command carries no `errors` (`ChatMessages.tsx:447-452`), so it is final.
- **`abstract X` is excluded.** It toggles (`abstract.ts:79-84`: `const newValue = !currentValue; ... SetFieldAction.new(element, 'abstract', newValue);`), so a late success can invert a later line's toggle. The prompt's verb list already leaves it out.
- **Each command succeeds at most once.** Every deferrable failure is NW, and only failed commands are re-run. So a `+=` set cannot append twice, and a class cannot be created twice.
- **Type references are not waited for, but they are deferred.** `type-reference` stays `required: false` (`dependencies.ts:205-235`), so a type created by an earlier line can still race. Under R-JS-3 it fails with `UNKNOWN_*_TYPE`, or `OUT_OF_SCOPE` with a homonym, and succeeds on pass 2. This closes the race R-JS-1 left noted, without making the role required.

### 3.3 `ScriptBlock.tsx`, the map

| Item | Where |
|---|---|
| States `'idle' \| 'running' \| 'stepping' \| 'paused' \| 'completed' \| 'error'` | `:77` |
| Line mapping: `commands` filter, `lineToCommandIndex`, `getScriptLine` | `:259-264`, `:270-280`, `:284-287` |
| Integrity guard, forward pass enabled by `projectClassifierNames()` | `:375` (`validateScriptIntegrity(code, projectClassifierNames())`), refusal branch `:376-404` |
| **Loop 1, Run** (`handleExecute`) | `:360-619`. Resume from Step at `:431-433`; loop `:453-587`; pause on failure `:480-522` and `:531-586`; completion `:589-618` |
| **Step** (`handleStep`) | `:622-826`. An error sets `'error'` plus the strip only (`:739-774`), never `pauseInfo` and never the dialog |
| **Loop 2** (`handleSkipAndContinue`) | `:845-1003`, reachable only through `onSkip` on the paused dialog (`:1568`) |
| Recovery: effect over `pauseInfo` | `:1010-1030` |
| **Loop 3** (`runCommandsFromIndex`) | `:1037-1124` |
| Recovery dispatcher | `:1131-1250` |
| `errorsList` writers | `:427 502 568 656 925 952 1068 1087 1258` |
| `executionStats` writers | `:394 599 672 721 761 812` |
| `outcome` writers | `:331 402 420 507 571 602 649 674 724 763 814 833 850 1040` |
| `pauseInfo` writers | `:424 499 565 653 866 929 963 1070 1095 1141 1156 1213 1278` |
| Strip | `:1526-1543` |
| Dialog mount | `:1563-1571` |
| `TEMP-DISCOVERY` lines (not this lane's) | `ScriptBlock.tsx:456`, `:529-530`; `executor.ts:69-73`, `:100-110`, `:141`, `:215-222` |
| Events fired by Run | `EXECUTION_START` `:407`, `EXECUTION_PAUSED` `:514`, `:578`, `METAMODEL_CREATED` `:606`, `EXECUTION_END` `:612` |

What becomes a `runPasses` call:
- Loop 1's body, as pass 1 plus the retries.
- Loop 3, as the rerun of the final failures after a recovery fix.

Loop 2 has no caller left once Run never pauses (R-JS-5), so it is removed, with its `onSkip` wiring.

`EXECUTION_START` must stay once per Run: `handleRegistry.ts:80` clears the M1 instance handles on it, so a pass 2 that re-fired it would break handle references. The listeners of `EXECUTION_END` read nothing but its arrival (`JodieWindow.tsx:190-192`, `TreeViewPanelContext.tsx:307-314`).

### 3.4 Success toast, `ScriptExecutionWindow`, recovery in the live host

- **`JjScriptSuccessNotification`**:
  - Rendered at `JjScriptOutput.tsx:51` and `:184` only. `JjScriptOutput` is rendered only by `JjScriptConsole.tsx:129`.
  - `JjScriptConsole` has no JSX consumer: `git grep -n "JjScriptConsole\b" -- frontend/src` gives the two export lines `components/index.ts:7` and `jjscript/index.ts:118` only. Control: the same command shape finds `<ScriptBlock` at `MarkdownRenderer.tsx:103`.
  - Run's success surface is the strip (`:1526-1531`). It replaced a former completion modal in `6a6cfade9` (2026-07-13).
- **`ScriptExecutionWindow`** runs multi-line scripts (`ScriptExecutionWindow.tsx:105-111`, `:323`). But:
  - `git grep -n "<ScriptExecutionWindow"` finds no line.
  - The only `onOpenExecutionWindow` reads are inside `ScriptBlock.tsx` (`:56`, `:179`, `:354-357`, `:1426`).
  - Its only host passes no such prop (`MarkdownRenderer.tsx:103-108`).
  - Not adopted: ticket T1.
- **Recovery**: `findRecoveryActions` receives `metamodel` from `resolvedTarget?.id` (`ScriptBlock.tsx:1019-1021`).
  - Jjodie passes no `availableTargets`, so `resolvedTarget` is `null`. With a `target X` line it is `{ id: '' }` (`:237-251`).
  - `literalInAttributeRule` therefore returns `null` at `rules.ts:97` (`if (!hasAttributeNamed(ctx.metamodel, targetName)) return null;`).
  - Read, not measured in the app: ticket T2.

### 3.5 Figures

`StatusBar.tsx:160-171` reads `lModel.classes`, `lModel.enumerators`, and, per class, `cls.attributes`, `cls.operations` and `cls.references`.

For the rest:
- Literals: `LEnumerator.literals` (`LModelElement.tsx:4901`).
- Abstract flag: `LClass.abstract` (`:3308`).
- Packages: `LModel.packages` (`:5724`, top-level, `context.data.packages`), then `subpackages` per package (`:2090`).
- `LModel.classes` and `LModel.enumerators` go through `_getallSub` (`:5766-5777`, `:5799-5810`), so they include subpackages.
- M1 models: `objects.length` (`StatusBar.tsx:173`).

`ScriptBlock` cannot name the target metamodel:
- The scope is bound inside `MessageBubble` (`ChatMessages.tsx:71-74`).
- `onExecute` receives `(commands)` only.
- `ScriptLineResult` carries no model id.

Passing it would touch `ChatMessages`, `MarkdownMessage` and `MarkdownRenderer`, all outside DOVE. So the snapshot covers every model of the project and the modal shows the models whose figures changed. This is also right for a qualified write into another metamodel.

The propagation race the waiter exists for (R-JS-1) applies to an "after" snapshot taken right after the last command. The dialog therefore reads "after" live, with `useSelector` (the store `Provider` wraps `App` at `index.tsx:89`), and "before" is a plain snapshot at Run start.

### 3.6 Undo (question only)

A Run is **not** one undo step.
- `TRANSACTION` cannot be async across commands: `action.ts:207`, "NB: cannot be async, it changes execution order...".
- Each Run command is a separate `await onExecute(...)` with `await sleep(BATCH_DELAY_MS)` between commands (`ScriptBlock.tsx:467`, `:525-527`).
- Each relevant delta is pushed on its own (`reducer.ts:1259-1262`: `statehistory[user].undoable.push(delta);`). Only non-relevant or graph-only deltas merge into the previous one (`:1207-1212`).
- Making a Run one step would mean an outer `TRANSACTION` around `DVertex.new`/creators, which Rule 12 forbids near the sync layer.

## 4. Gates at HEAD (measured, for the before/after of Phase 2)

- `npm run typecheck`: EXIT=2, **14** errors, all in the known set of `CLAUDE.md` §17. Measured with the repro on disk, after typing its fixture helper; the first run gave 16, the 2 extra being the repro's own TS2339.
- `npx vitest run src/jjscript --exclude '**/_tmp_*'`: `Test Files 1 failed | 16 passed (17)`, `Tests 454 passed (454)`. The failure is `context-binding.test.ts`, `ReferenceError: window is not defined`, known.
- Not run: build, `check:docs`. Phase 1 changed no code and no governance doc.

## 5. Risks

- **R1: a deferred `set` can overwrite a later one.** `set N.p = "a"` on line 3, with N created on line 5 and `set N.p = "b"` on line 6, ends with "a" after pass 2. Accepted under R-JS-3 as written; it is decision D15.
- **R2: a deferred `create` can resurrect what a later `delete` meant to remove.** The `delete` fails first, as final, because N does not exist yet. Rare in generated scripts.
- **R3: a forward reference with a required dependency costs up to 500 ms per pass in which it is still missing.** The waiter polls before the handler fails. Up to 4 passes.
- **R4: a handler whose `TRANSACTION` callback throws never resolves**, because the inner catches are dead: `set.ts:137-144` and the same shape in move, copy and remove. A Run would hang there, today and after. Ticket T3.
- **R5: silent successes produce no code, so no deferral.** `create reference … opposite X` drops `opposite`. `set r.opposite = X` writes the string `'X'` (`set.ts:406-409`). `create class N in P` with P unresolved gets a null father. Ticket T4.
- **R6: the wiring in `ScriptBlock.tsx` has no executing test**, because the file does not import under vitest (the `joiner` barrel). The pure halves (`runPasses`, `runFigures`, the waiter predicate, the validator call form) are tested. The wiring is declared as a gap and is covered by the chat's visual check.

## 6. Phase 2 DOVE, confirmed or amended

Code (9 files, so Rule 19 applies; the GO is the confirmation):
1. `frontend/src/jjscript/executor/elementWaiter.ts`: `findUnresolved` takes a `boundM2` flag. A bare name in a bound M2 run, with the bound metamodel present, is resolved only by `resolveElementInMetamodel`.
2. `frontend/src/jjscript/executor/__tests__/elementWaiterScope.test.ts` (**new**; amends "its test"). The existing `__tests__/elementWaiter.test.ts` mocks `resolvers` for the whole file (`:33-36`) and cannot host real-resolver tests. It takes over the repro, inverted. The `_tmp_` file is deleted.
3. `frontend/src/jjscript/executor/runPasses.ts` (**new**; name checked with `git grep`, exit 1; control `errorFromResult`, 30 hits):
   - `runPasses(commands, execOne, isDeferrable, { indices?, maxRetryPasses = 3, shouldStop? })`, returning per-index final result, attempts and the pass of success, ordered by index.
   - Plus the exported default `isDeferrable` (parse for the verb, code from `errors[0]`).
4. `frontend/src/jjscript/executor/__tests__/runPasses.test.ts` (**new**): the seven cases of step 8, plus the code and verb tables.
5. `frontend/src/jjscript/components/runFigures.ts` (**new**, an addition to DOVE): figures of a model-like object, a project snapshot, the changed-model delta, and equality for `useSelector`. Pure over plain objects.
6. `frontend/src/jjscript/__tests__/runFigures.test.ts` (**new**).
7. `frontend/src/jjscript/__tests__/scriptValidator.test.ts`: the call form Run makes (`validateScriptIntegrity(script)`) accepts a forward reference and refuses a syntax error. `scriptValidator.ts` is unchanged.
8. `frontend/src/jjscript/components/ScriptBlock.tsx`:
   - Run goes through `runPasses`, with no pause.
   - Loops 2 and 3 are removed.
   - The integrity call loses its name set.
   - The summary dialog replaces the `ExecutionErrorDialog` mount.
   - `projectClassifierNames` is marked `// TODO: cleanup`.
   - The two `TEMP-DISCOVERY` lines move verbatim into `execOne`.
9. `frontend/src/jjscript/components/RunSummaryDialog.tsx` and `RunSummaryDialog.scss` (**new**). By size: the dialog is 330 lines and its completed mode about 60, while the summary needs about 200 more and a different header logic. So it is a new component that reuses the `exec-error-*` shell classes by importing `ExecutionErrorDialog.scss`. Light theme, Bootstrap Icons, English strings.

Not touched: `executor.ts`, `scopeGuard.ts`, `scriptValidator.ts`, `ExecutionErrorDialog.tsx/.scss`, `JjScriptSuccessNotification.tsx`, `ScriptExecutionWindow.tsx`, `recovery/*`, `errors.ts`, any critical-zone file.

Closure: `docs/decisions.md` (R-JS-2..6, `provisional, unattended`), a new `docs/log-inbox/jjscript.md` with the entry and tickets T1-T5, and the prompt's Status line.

## 7. Decisions taken (unattended)

- **D1: R-JS-2 predicate.** In a bound M2 run (`scopeBound && level !== 'M1'`, the guard's own condition at `executor.ts:123`), a one-segment name, member forms included as in the guard (`scopeGuard.ts:65`), counts as resolved only when `resolveElementInMetamodel(name, bound)` finds it.
  - Qualified names, unbound runs and M1 keep the fallback.
  - So does a bound run whose metamodel is gone, so that `SCOPE_NOT_FOUND` stays immediate.
  - An ambiguity inside the scope keeps waiting the 500 ms it waits today.
- **D2: the deferrable codes and verbs** are those of §0.3 and §3.2.
- **D3: R-JS-4 at the call site.** `validateScriptIntegrity(code)` with no name set; `scriptValidator.ts` is untouched.
- **D4: a new `RunSummaryDialog`.** `ExecutionErrorDialog` stays for `ScriptExecutionWindow`.
- **D5: figures over every model, live after.** "Before" is snapshotted at Run start. "After" is read live by the dialog. Only models with a changed figure are shown, M1 models as instance counts. If none changed: `No change to the model`.
- **D6: the strip stays.** No toast to replace. The strip remains the persistent per-message record, and with errors it reads the first final error plus `(+n more)`.
- **D7: recovery actions per final row.**
  - `createEnumAndRetry` creates the enum, then reruns the final failures through `runPasses`; "before" is kept, so the delta covers the whole Run.
  - `skipMatchingCreateLiteral` is not offered: under R-JS-5, Run already continues past those lines, which was its whole effect. `rules.ts` is unchanged.
- **D8: refusal title.** A parse or syntax refusal uses the error state, titled `Script not executed: 1 error`, because «Script executed with 1 error» would be false. Zero commands, no change.
- **D9: `ScriptExecutionWindow` is not adopted.** Ticket T1.
- **D10: Skip leaves Run.** `handleSkipAndContinue` and `runCommandsFromIndex` are removed, along with the `onSkip` wiring. Step is untouched.
- **D11: a stopped Run shows no modal.** `handleStop` already emits `EXECUTION_END` `cancelled`. Today the loop's completion code ran after a Stop and set `completed`.
- **D12: line states during passes.** A deferred line shows ✗ until its retry and ✓ if the retry succeeds. No new `LineState` status.
- **D13: `EXECUTION_START` once per Run.** `EXECUTION_END` once at the end, with status `completed` and an additive `errorCount`. `EXECUTION_PAUSED` is no longer fired by Run.
- **D14: inbox.** A new `docs/log-inbox/jjscript.md`; `rotate-log.ts:50` folds `*.md`.
- **D15: `set` stays deferrable**, with R1 declared.
- **D16: the repro stays untracked** for Phase 2, as stated in §3.1.

## 8. Decisions awaiting Alfonso

None. No item of RC-26 applies:
- No critical-zone file.
- No exported interface changes: `ScriptLineResult`, `ExecutionSummary` and `ScriptBlockProps` stay as they are.
- No ratified R- row is amended: R-JS-1 is kept, and its all-or-nothing rule is what makes deferral safe.
- No tracked file is deleted.
- MODELS demo, cost and push are untouched.

## 9. Tickets for the closure entry

- **T1:** `ScriptExecutionWindow` and `JjScriptConsole` are not mounted. Decide whether to adopt `runPasses` or retire them.
- **T2:** the recovery rule never fires under Jjodie, because `RecoveryContext.metamodel` is `null` (`ScriptBlock.tsx:1019-1021`).
- **T3:** the inner catches around `TRANSACTION` are dead, and a throwing callback never resolves its handler: `set.ts:137-144`, `move.ts:107-114`, `copy.ts:111-118`, `remove.ts:114-121`, `:207-214`.
- **T4:** silent successes. `opposite` is dropped on create, `set r.opposite = X` writes a string, and a class created under an unresolved package gets a null father.
- **T5:** the `TEMP-DISCOVERY` timing lines in `executor.ts` (`:69-73`, `:100-110`, `:141`, `:215-222`) and `ScriptBlock.tsx` (`:456`, `:529-530`) are still in the tree. Not this lane's.

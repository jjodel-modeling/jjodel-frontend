# Discovery: forward references before command 1, and the executor's own error in the dialog

Date: 2026-09-16 23:40 (Europe/Rome)
Prompt: `docs/prompts/claude_2026-09-16_2327_prompt_jjscript_forward_refs_and_structured_errors.md`
Branch: `validation-skeleton`, worktree `/Users/alfonso/jjodel`, HEAD `3e48caed8`
Phase: 1 (read only). No file under `frontend/src/` was modified. `git status` before and after
carries only the three pre-existing `docs/mde-intelligence-2026/` entries of the session start.

## 1. Objective

Answer A1 to A3 (lane A, forward references in `validateScriptIntegrity`) and B1 to B2 (lane B, the
structured error in the dialog) with measurements, and surface what the prompt could not know before
the code was read. One finding, §6, contradicts a premise the prompt states as settled, so it is
raised here rather than absorbed silently.

## 2. Files read

Full paths, all under `/Users/alfonso/jjodel/`:

- `frontend/src/jjscript/executor/scriptValidator.ts` (123 lines, read in full)
- `frontend/src/jjscript/__tests__/scriptValidator.test.ts` (78 lines, read in full)
- `frontend/src/jjscript/executor/dependencies.ts` (223 lines, read in full)
- `frontend/src/jjscript/executor/errors.ts` (438 lines, read in full)
- `frontend/src/jjscript/types.ts` (598 lines, read 1-464)
- `frontend/src/jjscript/parser/parser.ts` (1365 lines, read 125-215, 262-300, 336-400, 453-552,
  843-862, 1184-1200)
- `frontend/src/jjscript/parser/grammar.ts` (`parseQualifiedName`, 28-55)
- `frontend/src/jjscript/executor/commands/create.ts` (1135 lines, read 210-417, 423-509, 611-700,
  1013-1081, plus the grep of every `code:` literal)
- `frontend/src/jjscript/executor/commands/extends.ts` (209 lines, grep of failure sites)
- `frontend/src/jjscript/components/ScriptBlock.tsx` (read 1-120, 290-500, 800-1100, plus greps)
- `frontend/src/jjscript/components/ExecutionErrorDialog.tsx` (330 lines, read 190-262)
- `frontend/src/jjscript/components/ScriptExecutionWindow.tsx` (read 110-215, 330-440 by grep)
- `frontend/src/components/Jodie/ChatMessages.tsx` (read 58-80, 170-180, 385-460)
- `frontend/src/components/common/MarkdownRenderer.tsx` (read 95-115)
- `frontend/src/components/Jodie/MarkdownMessage.tsx` (grep of the prop chain)
- `frontend/src/jjscript/services/JjScriptService.ts` (read 40-70)
- `frontend/vitest.config.ts` (18 lines, read in full)
- `CLAUDE.md`, `docs/claude-code-log.md` (head, 120 lines), `docs/decisions.md` (head, 60 lines)

Measurement harness: one temporary vitest file,
`frontend/src/jjscript/__tests__/_tmp_probe_forwardrefs.test.ts`, which parsed 28 representative
lines and dumped `ast.args` and `extractDependencies(ast)` for each. It was run
(`npx vitest run <file>`, 1 passed) and then deleted; its output is transcribed in §4 and kept at
`<scratchpad>/probe_ast.txt`. Nothing of it was staged.

## 3. A1: can the validator import `extractDependencies` under vitest `environment: 'node'`?

**Yes, measured.** The temporary test above imported both `parse` (from `parser/parser`) and
`extractDependencies` (from `executor/dependencies`) and ran green under
`vitest.config.ts:14 environment: 'node'`.

The import graph is trivially pure: `dependencies.ts:6-19` imports only `../types`, and `types.ts`
has zero import statements (`command grep -c "import" types.ts` returns 2, both of them the string
`'import'` inside the `CommandType` union at `:56` and the command table at `:581`; positive control
on `dependencies.ts` returns 1 for its single real import). `scriptValidator.ts` already imports
`parser/parser`, which its own test exercises today, so the validator's dependency set grows by one
pure module and no new extraction is needed.

## 4. A2: what declares a name, what references one

Measured on the parse tree, not inferred from the grammar. `args` shapes below are verbatim from the
probe.

### 4.1 Declarations

| Form | AST | Declared name | file:line |
|---|---|---|---|
| `create class X` / `abstract class` / `interface` | `{elementType:'class'\|'abstract class'\|'interface', name:'X'}` | `args.name` (a plain string) | `parser/parser.ts:262-296` |
| `create enum X` / `enumeration` | `{elementType:'enum', name:'X'}` | `args.name` | same |
| `create package X` | `{elementType:'package', name:'X'}` | `args.name` | same |
| `create attribute a in C` | `{elementType:'attribute', name:'a', parent:C}` | `args.name`, in the FEATURE namespace of `C` | same |
| `create reference` / `containment` / `composition` / `operation` / `parameter` / `literal` | idem | `args.name`, feature namespace | same |
| `add class X to P` | `{command:'add', elementType:'class', name:'X', to:P}` | `args.name` | `parser/parser.ts:591-608` |
| `create instance of C "alice"` | `{elementType:'instance', name:'C', options.defaultValue:{kind:'string',value:'alice'}}` | the HANDLE is `options.defaultValue.value`, and `args.name` is the CLASS, not a declaration | `parser/parser.ts:266-286, 342-348` |
| `copy Foo to Bar` | `{command:'copy', target, to}` | creates an element at runtime; no static name | `parser/parser.ts:663-680` |
| `forall c in ... do create attribute id in c` | `{command:'forall', body:<CommandNode>}` | the body can declare names; `extractDependencies` returns `[]` for it | `parser/parser.ts:1095` |

Two traps in the declaration side, both measured:

- `create class P::Foo` yields `name:'Foo'` **and** `parent:{segments:['P','Foo'], raw:'P::Foo'}`
  (`parser.ts:290-293`: when the element name is qualified, the whole qualified name is moved into
  `parent`). A qualified declaration therefore looks like a simple declaration of `Foo` unless
  `args.parent` is inspected.
- `create instance of Person` has `name:'Person'`. A naive "every `create` declares `args.name`"
  rule would read it as a declaration of the class `Person`.

### 4.2 References

`extractDependencies` (`executor/dependencies.ts:46-137`) is the existing inventory. Measured output
per role, with what the executor actually does when the name does not resolve:

| Role | Emitted for | Executor behaviour when unresolved | file:line |
|---|---|---|---|
| `parent` | `create <t> ... in X`, for `t` in attribute, reference, containment, composition, operation, parameter, literal | **hard failure**, `PARENT_NOT_FOUND` | `create.ts:335-350` |
| `parent` | `create class\|enum\|package ... in X` | **no failure**: unrestricted fallback, then `getDefaultParent` | `create.ts:296-304` |
| `type-reference` | `type X` on attribute, reference, parameter; `returns X` on operation | **hard failure**, `UNKNOWN_<KIND>_TYPE` (the reported incident) | `create.ts:660-670` |
| `superclass` | `create class A extends B` (`options.superClass`) | **no failure**: `if (superClass) {...}` and nothing else, the class is created without the extends | `create.ts:452-467` |
| `target` + `superclass` | the standalone `A extends B` command | **hard failure** on both sides, `CHILD_NOT_FOUND` / `PARENT_NOT_FOUND` | `extends.ts:54-95` |
| `value-reference` | `opposite B.a` | not verified in this pass | `dependencies.ts:200-202` |
| `target` | `delete`, `rename`, `set`, `remove`, `abstract` (the last one emits nothing, see below) | excluded by the prompt's own rules for `delete`/`rename` | `dependencies.ts:65-85` |
| `source` / `destination` | `move`, `copy`, `remove ... from`, `add ... to` | not verified in this pass | `dependencies.ts:94-113` |

Not covered by `extractDependencies` at all (measured `deps=[]`): `abstract Person`
(`AbstractArgs.target`), `forall` (only the first command of a `block` is walked, `dependencies.ts:115-122`),
`eval`, and `create instance of C` (the class it instantiates is not a dependency).

Shape notes that the implementation will need:

- a simple name is `segments.length === 1`; a qualified name is `segments.length > 1`
  (`grammar.ts:49-50`);
- `Person.name` parses to `{segments:['Person'], member:'name'}`, so the classifier is `segments[0]`
  and the feature is `member` (`grammar.ts:36-47`);
- `set Person.abstract = true` keeps `raw:'Person.abstract'` but clears `member`
  (`parser.ts:554-560`), so `segments[0]` is still the classifier;
- `create class A extends B` emits the `superclass` dependency **twice**, because
  `parseCreateOptions` writes both `options.superClass` and `options.superClasses[0]`
  (`parser.ts:360-366`) and `extractOptionsDependencies` reads both (`dependencies.ts:169-176`).
  Pre-existing, harmless, but any issue built from the dep list must dedupe.

## 5. A3: what can make a later declaration NOT fail the earlier reference

The prompt lists three exclusions (delete/rename, qualified names, M1). All three are confirmed
necessary. Four more were found:

1. **`copy X to Y`** creates an element at runtime whose name is not statically visible, so a name
   can come into existence between two lines without any `create`. Same skip treatment as
   `delete`/`rename`.
2. **`forall ... do <command>`** executes its body once per element; the body can create names
   (`create attribute id in c`), and `extractDependencies` returns `[]` for the whole command. A
   name declared by a `forall` body earlier in the script would satisfy a reference we would
   otherwise call undeclared.
3. **`eval`** is the parser's fallback for any line that is not a known command
   (`parser.ts:183-186`): `this is not a command at all` parses successfully as
   `{command:'eval', expression:'...'}`. A JjEL expression can have side effects, and its text is
   opaque to us.
4. **`target <Metamodel>` directives** are skipped as non-executable (`scriptValidator.ts:93`,
   mirroring `ScriptBlock.tsx:228`), but a script with two different `target` lines writes into two
   different namespaces, so "declared later" and "referenced earlier" may not be about the same
   metamodel at all. Note `ScriptBlock.tsx:195-201` resolves ONE target for the whole run, so today
   a second directive does not actually switch anything; the exclusion is cheap insurance against
   that changing.

Also relevant, and not an exclusion but a scoping rule: **the two namespaces must not be mixed**. A
reference in the `parent` / `type` / `extends` roles resolves against classifiers (class, interface,
enum, package); `create attribute name in Person` declares `name` in the feature namespace of
`Person`. If features counted as declarations, then

```
create reference owner in Car type Person     <- Person is a pre-existing class
create attribute Person in Something          <- a feature, not a duplicate of the class
```

would be refused although it runs cleanly. Restricting both sides of the check to the classifier
namespace removes this whole family of false positives, and costs nothing on the reported incident,
whose forward name is a class.

## 6. The soundness rule the prompt asks to write is not true as stated

The prompt's rule: "if `X` does not exist before the run, the reference fails; if it does, the later
declaration fails as a duplicate."

**The second branch is false. `create` has no duplicate check.** Measured by reading every creator in
`create.ts`: `createClass` (`:439`) calls `DClass.new` unconditionally, `createPackage` (`:1023`)
calls `DPackage.new` unconditionally, `createEnumerator` (`:1059`) calls `DEnumerator.new`
unconditionally. None of them looks the name up first. A repo-wide grep for `already exist` inside
`frontend/src/jjscript/` returns hits only in `rename.ts:133`, `instance.ts:328,578` and the
`errors.ts` message table, never in `create.ts` (positive control: `grep -c "success" create.ts`
returns 37, so the file was searched).

So for a name `X` that already exists in the target metamodel, the script

```
create containment stages in Pipeline type PipelineStage
create class PipelineStage
```

runs to completion today: line 1 resolves `PipelineStage`, line 2 creates a **second** class with
the same name. Refusing it would break the module's stated no-false-positives guarantee, which is
load bearing: `scriptValidator.ts:13-17` claims it never rejects a script that would have executed
cleanly, and `ScriptBlock.tsx:303-307` repeats the claim at the call site.

The first branch is true, but only for the roles measured in §4.2 as hard failures: `parent` of a
nested element, `type` / `returns`, and the standalone `extends` command. It is **false** for
`create class A extends B` (the class is created without the inheritance, silently) and for the
`parent` of a class, enum or package.

Three ways out, for Alfonso to pick at the hard stop:

- **(a) Narrow and pure.** Flag only the hard-failure roles (`parent` of a nested element, `type` /
  `returns`, standalone `extends`), keep `validateScriptIntegrity(script)` pure, and write the
  guarantee honestly: the check has one measured exception, a name that already exists in the target
  metamodel and is created again later in the script. That script is refused although it would have
  run, producing a duplicate classifier. Cost: one sentence in the header admitting a false positive,
  in a module whose selling point is that it has none.
- **(b) Narrow and metamodel aware.** Same roles, plus an optional argument carrying the classifier
  names already in the target metamodel; flag only names absent from it. Then branch two is never
  needed and there are zero false positives. `ScriptBlock` can supply it: it already holds
  `resolvedTarget` and already resolves `LPointerTargetable.fromPointer(resolvedTarget.id) as LModel`
  at `:939-941`. When the set cannot be obtained, pass `undefined` and skip the pass (never pass an
  empty set, which would read as "nothing exists" and flag everything). Cost: a signature change, an
  L-layer read at click time, and a dependency on a forward-link collection (CLAUDE.md §3.6) which is
  safe here because we are not immediately post-parse, but is a new coupling.
- **(c) Flag `create class A extends B` too**, accepting that such a script "completes". It silently
  loses the inheritance, which is arguably worse than a refusal. This is a product decision, not a
  soundness one, and it is orthogonal to (a)/(b).

Recommendation: **(b) with (c) left out**. It is the only option that keeps the module's guarantee
literally true, and the plumbing is small. If the L-layer read is unwelcome, (a) is acceptable as
long as the header stops claiming the absolute.

## 7. B1: where `errors` is lost

Producer: `executeCommand` (`executor/executor.ts:364`) returns `ExecutionResult`
(`types.ts:448-457`), whose `errors?: ExecutionError[]` (`types.ts:459-464`) carries
`{code: string, message: string, position?, suggestion?}`. `JjScriptService.execute`
(`services/JjScriptService.ts:60-69`) returns it untouched.

The only mapping to `ScriptLineResult` is **`ChatMessages.tsx:438-443`**:

```
results.push({ command, success: result.success, message: result.message, warnings: result.warnings });
```

`errors` is dropped there, and `ScriptLineResult` (`ScriptBlock.tsx:59-64`) has no field to receive
it. The catch arm at `:445-449` builds a result from a thrown exception and legitimately has none.

From there the prop chain is: `ChatMessages.tsx:486` (`onJjScriptExecute={handleJjScriptExecute}`)
to `MessageBubble` at `:58`, which binds the scope at `:73`
(`(commands) => onJjScriptExecute!(commands, scope)`) and passes it at `:178` to `MarkdownMessage`
(`MarkdownMessage.tsx:60`), then to `MarkdownRenderer.tsx:103`, which is the **only** site rendering
`<ScriptBlock>` outside the module itself (`grep -rn "<ScriptBlock"`: two hits, the definition and
this one).

Inside `ScriptBlock`, `parseError` is called at **seven** sites, not four. The prompt names
`:411`, `:459`, `:846`, `:872`; the other three are `:986`, `:1004` (inside `runCommandsFromIndex`,
the recovery re-run loop) and `:1069` (the `createEnumAndRetry` recovery action, whose result also
comes from `onExecute`). Grouped by execution path:

| Site | Path | Source of the text |
|---|---|---|
| `:411` | `handleExecute`, failed result | `result.message` |
| `:459` | `handleExecute`, thrown | exception |
| `:846` | `handleSkipAndContinue`, failed result | `result.message` |
| `:872` | `handleSkipAndContinue`, thrown | exception |
| `:986` | `runCommandsFromIndex`, failed result | `result.message` |
| `:1004` | `runCommandsFromIndex`, thrown | exception |
| `:1069` | `handleRecoveryAction`, failed `create enum` | `createResult.message` |

`handleStep` (`:546`) sets `executionErrorInfo` at `:674` and `:725` without `parseError`; those two
were not read in this pass and must be checked before lane B is written, since the prompt says "both
execution paths".

The four result-shaped sites (`:411`, `:846`, `:986`, `:1069`) are the ones that can receive
`errors`; the three exception-shaped ones keep `parseError` by construction.

Rendering: `ExecutionErrorDialog.tsx:242-256` shows `error.message` (split on newlines) and
`error.suggestion` under a lightbulb. It never renders `error.code`. `skippable` gates the Skip
button (`ExecutionErrorDialog.tsx:198`, `ScriptBlock.tsx:1466`). So the user-visible payload is
exactly message plus suggestion, which is what lane B is about.

Other hosts, for completeness: `ScriptExecutionWindow.tsx:206` calls `parseError` on a raw string
from its own `executeCommand` loop (`:342`, `:435`); it never builds a `ScriptLineResult` and is out
of lane B's scope. `JjodieAPIImpl.ts:163` returns `{success, message}` and drops `errors` as well;
also out of scope.

## 8. B2: handler codes versus `JjScriptErrorCode`

`JjScriptErrorCode` (`errors.ts:10-43`) has 23 members. The handlers under
`executor/commands/*.ts` emit **82 distinct codes**. The intersection is **5**:

```
ELEMENT_NOT_FOUND, INVALID_MULTIPLICITY, INVALID_NAME, PARENT_NOT_FOUND, TYPE_MISMATCH
```

The 77 unknown to `errors.ts`, in full:

```
ABSTRACT_CLASS ABSTRACT_ERROR ABSTRACT_INTERFACE AMBIGUOUS_INSTANCE AMBIGUOUS_PARENT
AMBIGUOUS_SCOPE AMBIGUOUS_TARGET AMBIGUOUS_TYPE CHILD_NOT_FOUND CIRCULAR_INHERITANCE
CLASS_NOT_FOUND COPY_ERROR COPY_FAILED CREATE_ATTRIBUTE_ERROR CREATE_CLASS_ERROR CREATE_ENUM_ERROR
CREATE_ERROR CREATE_INSTANCE_ERROR CREATE_LITERAL_ERROR CREATE_OPERATION_ERROR CREATE_PACKAGE_ERROR
CREATE_PARAMETER_ERROR CREATE_REFERENCE_ERROR DELETE_ERROR DELETE_INSTANCE_ERROR EMPTY_CLASS
EMPTY_ENUM EMPTY_PACKAGE EMPTY_REDO_STACK EMPTY_UNDO_STACK EXTENDS_ERROR FORALL_ERROR
FORALL_TYPE_ERROR HANDLE_IN_USE HAS_DEPENDENCIES INSTANCE_NOT_FOUND INVALID_MOVE
INVALID_PARENT_TYPE JJEL_ERROR LET_ERROR LINK_ERROR LIST_ERROR MEMBER_NOT_FOUND MISSING_NAME
MISSING_TYPE MOVE_ERROR NAME_CONFLICT NAMING_CONVENTION NO_FEATURE_PROXY NO_METACLASS NO_METAMODEL
NO_MODEL NO_PARENT NO_PROJECT NOT_A_CLASS NOT_IN_COLLECTION REDO_ERROR REMOVE_ERROR
REMOVE_EXTENDS_ERROR RENAME_ERROR RENAME_INSTANCE_ERROR SET_ERROR SET_INSTANCE_ATTR_ERROR
SHOW_ERROR SINGLE_CONTAINMENT SINGLETON_CLASS SINGLETON_INSTANCE UNDEFINED_VARIABLE UNDO_ERROR
UNKNOWN_PRIMITIVE_POINTER UNKNOWN_PROPERTY UNKNOWN_TOPIC UNKNOWN_TYPE UNLINK_ERROR UNSUPPORTED_TYPE
VALIDATE_ERROR WRONG_LEVEL
```

All six codes the prompt names are in that list: `UNKNOWN_REFERENCE_TYPE`, `UNKNOWN_ATTRIBUTE_TYPE`,
`UNKNOWN_PARAMETER_TYPE` and `UNKNOWN_OPERATION_TYPE` do not appear literally as `code: '...'`
because they are table values (`create.ts:556,564,572,580`, field `unknownCode`, read at `:668`);
`AMBIGUOUS_TYPE` (`create.ts:652`, `set.ts:367`) and `WRONG_LEVEL` (`create.ts:260`, five sites) do.
Method: the literal grep above plus `create.ts:549-585` read directly, so the table indirection is
accounted for.

**A single generic code exists: `OPERATION_FAILED`.** It is already `parseError`'s own fallback
(`errors.ts:401`) and its `getErrorDetails` arm (`:261-265`) puts `ctx.details` straight into the
message with `skippable: true`. So no union widening and no cast are needed: keep the handler code
when it is one of the 5 known, use `OPERATION_FAILED` otherwise. Since the dialog never renders the
code (§7), nothing user visible is lost.

**`skippable` is preserved for free.** Every code `parseError` can produce today is `skippable: true`
except `TIMEOUT` (`errors.ts:277-281`), and all 5 known handler codes are `skippable: true` as well.
The single behavioural difference: a result whose `message` contains the word "timeout" **and** which
also carries `errors` would move from `TIMEOUT` (`skippable: false`) to `OPERATION_FAILED`
(`skippable: true`). No handler was found that produces both; the lane should assert this rather than
assume it.

**Where the pure function goes.** `ScriptBlock.tsx` cannot be imported under `environment: 'node'`
(React, `../../joiner`, `./ScriptBlock.scss`), so the "result to `JjScriptError`" choice has to live
in an importable module to be tested, as the prompt anticipates. `errors.ts` is the right home: it
has **zero imports**, it already exports `parseError` and `createError`, and it already owns
`ExecutionErrorInfo`. This is the "strictly necessary" case the prompt's DOVE clause allows. The
alternative, a new module, would duplicate the `createError` import graph for nothing.
`parseError`'s heuristics are not touched either way.

## 9. Risks

- **R1.** The forward-reference pass runs on every Run click, re-parsing every line a second time
  (the integrity pass already parses each line once). Scripts here reach ~230 lines; two passes of a
  hand written recursive descent parser over 230 short lines is negligible, but the pass should reuse
  the AST from the first loop instead of parsing twice. That is a restructuring of
  `validateScriptIntegrity`'s body (collect ASTs in pass 1, walk them in pass 2), not a new parse.
- **R2.** `ScriptBlock.tsx:308` is inside `handleExecute` only. `handleStep` (`:546`) does **not**
  call `validateScriptIntegrity`, so stepping through a forward-referencing script is not refused.
  The prompt does not ask to change that; worth confirming it is deliberate.
- **R3.** The discriminant added to `ScriptValidationIssue` changes a type that
  `ScriptBlock.tsx:310` destructures. Optional field, existing fields unchanged, so no other consumer
  breaks (`validateScriptIntegrity` has exactly two callers, `ScriptBlock.tsx:308` and the test).
- **R4.** Lane B changes what the dialog says for every failing command that carries `errors`, which
  is most of them. The messages are the handlers' own sentences and are generally better, but this is
  a broad user-visible change, not a narrow one. The visual check should look at two or three
  different failures, not only the `type NoSuchClass` case.
- **R5.** `let $n = "X" in create class $n` **fails to parse** (measured: `Expected element name,
  found '$'` at column 30), so `validateScriptIntegrity` already refuses any script using a `let`
  binding as an element name, today, before this task. Pre-existing, unrelated, not touched here, but
  it means `let` cannot be tested as an exclusion the way `delete` and `rename` can.

## 10. Open questions for the hard stop

1. **Soundness, §6.** Option (a), (b) or (c)? This decides the signature of
   `validateScriptIntegrity` and the wording of the module guarantee.
2. **Roles to flag.** The prompt says "parent, type, superclass, extends, and the other reference
   roles from A2". Measurement says `superclass` via `create class A extends B` does **not** fail the
   script, and that `delete`/`rename`/`move`/`copy`/`set` targets live partly in the feature and
   instance namespaces. Proposal: flag exactly the three hard-failure classifier roles of §4.2, and
   leave the rest out. Confirm, or ask for the wider set knowing the false positives it brings.
3. **Seven `parseError` sites, not four.** Should lane B convert all four result-shaped sites
   (`:411`, `:846`, `:986`, `:1069`), or only the two the prompt names? Proposal: all four, since
   `:986` and `:1069` are the same failure reaching the same dialog.
4. **`handleStep`'s two error sites** (`:674`, `:725`) were not read in this pass. In or out of lane B?
5. **`errors.ts` gains one exported function** (§8). The prompt allows it only if "strictly
   necessary"; the testability argument is above. Confirm.

# A superclass created earlier in the same script is not found

Date: 2026-09-17
Branch: `validation-skeleton`
Prompt: `claude_2026-09-17_1024_prompt_jjscript_silent_defects_duplicates_extends_skipped.md`,
lane L4 visual check 2, step 1 (read-only)
Session: 00207c

## 1. Objective

Confirm or refute one hypothesis: `create class A extends B` fails with the L2 refusal even when
`B` was created by an earlier line of the same script, because superclass dependencies are
declared `required: false` and the executor therefore does not wait for them.

Verdict: **confirmed**, structurally and with a corroborator inside the same file. The race
predates L2; L2 turned a silent drop into a visible refusal.

## 2. The two reproductions

Both run by Alfonso on http://localhost:3001/ after `4898aa60f` (L2), reported in the lane
message of 2026-09-17.

1. In `MM-B`: line 1 `create class FunctionalUnit` executes and the class appears on the canvas;
   line 2 `create class ALU extends FunctionalUnit` is refused with
   `Superclass 'FunctionalUnit' not found for class 'ALU': nothing was created`.
2. Same session: line 1 `create class Register` executes and is on the canvas; line 2
   `create class Cache extends Register` is refused with
   `Superclass 'Register' not found for class 'Cache'`. Run summary: 1 command executed, 31 ms.

The 31 ms is itself evidence: the command failed in less time than one poll of the waiter
(`POLL_INTERVAL_MS = 30`), so nothing waited for anything.

## 3. Files read

- `frontend/src/jjscript/executor/dependencies.ts` (`ElementDependency` :28-35,
  `extractCreateDependencies` :146-160, `extractOptionsDependencies` :165-197, the `extends`
  command case :89-90)
- `frontend/src/jjscript/executor/elementWaiter.ts` (`waitForDependencies` :46-94, constants
  :17-18, `findUnresolved` :103-)
- `frontend/src/jjscript/executor/executor.ts` (`executeAST` :97-137, the pre-check :105-118)
- `frontend/src/jjscript/executor/commands/create.ts` (`createClass`, the resolution block added
  by L2)
- `frontend/src/jjscript/executor/superclassResolution.ts` (`resolveSuperclasses`)

## 4. The mechanism, end to end

1. `executeAST` extracts the command's dependencies and awaits `waitForDependencies` before
   dispatching to the handler (`executor.ts:106-109`). This is the mechanism that makes a script
   line see what the previous line created.
2. `waitForDependencies` filters to the required ones and **returns immediately when none are
   required**: `const requiredDeps = dependencies.filter(d => d.required)` followed by
   `if (requiredDeps.length === 0) return { allResolved: true, unresolved: [], waitedMs: 0 }`
   (`elementWaiter.ts:51-56`).
3. `extractOptionsDependencies` pushes every superclass of a `create` with `required: false`
   (`dependencies.ts:169-176`).
4. So a `create class A extends B` whose only dependency is the superclass waits **zero**
   milliseconds, and `createClass` resolves `B` against L-layer proxies that Redux has not
   finished propagating from the previous command.

Step 4 is the documented behaviour of this codebase, not a guess: CLAUDE.md §9.2 records that
after a creating TRANSACTION the proxies are not immediately available and that the propagation
needs a turn of the event loop. The waiter is the JjScript-side answer to exactly that, and the
superclass role was left out of it.

## 5. The corroborator, in the same file

`dependencies.ts:89-90`, the **standalone** `A extends B` command:

```ts
deps.push({ name: args.childClass,  role: 'target',     required: true });
deps.push({ name: args.parentClass, role: 'superclass', required: true });
```

The same `'superclass'` role, at a different call site, is required. That is why the standalone
command resolves a class created on the previous line and the `create ... extends` clause does
not, and it is why the prompt's D5 could record that the standalone command "already fails hard".

The `parent` role shows the same contrast one function away: `extractCreateDependencies` marks
the parent `required` exactly for the nested element types (`dependencies.ts:150-155`), which is
why `create attribute a in Pipeline` immediately after `create class Pipeline` works. Every role
that needs to see the previous line is required; the superclass of a `create` is the one that
is not.

## 6. What else could explain it, and why not

- **Resolution scope (the class is created in the model root but looked up inside a package, or
  vice versa).** Refuted by the reproductions: the same name in the same metamodel resolves
  perfectly when the class was created by an earlier *run*, and the failing lookup is the same
  `resolveElementInMetamodel` / `resolveElement` pair the old code used. A scope error would fail
  in both cases, not only within one script.
- **L2 introduced the failure.** Refuted. L2 moved the resolution from after `DClass.new` to
  before it, a difference of microseconds inside the same command; it did not change which
  proxies are visible. The old code performed the same lookup, got the same nothing, and dropped
  the generalization in silence, which is the defect L2 was written to close. The prompt's own
  §Background says the superclass "was dropped silently"; that is this race, seen from before.
- **The L4 validator refusing it.** Not in play: L4 is uncommitted, refuses *before command 1*
  with `line N references 'X', which is created at line M`, and both reproductions executed one
  command and carry the executor's `PARENT_NOT_FOUND` sentence.
- **`checkBoundScope`.** Different code path, different message (`executor.ts:123-137`), and it
  refuses a name another metamodel holds, not one this metamodel just created.

## 7. The fix, and what it costs

Make the superclass dependencies of `create class|abstract class|interface` `required: true`
(`dependencies.ts:169-176`), so the waiter polls for them exactly as it does for a nested
element's parent and for the standalone `extends`.

Cost, to be stated rather than discovered later: a superclass that is genuinely absent now takes
up to `MAX_WAIT_MS = 500` ms to refuse, polled every 30 ms, instead of failing at once. That is
the cost the parent role and the standalone `extends` command already pay for the same guarantee.
The refusal itself does not change.

Second half of the fix: the L2 refusal currently inherits the generic `PARENT_NOT_FOUND`
suggestion ("Make sure the parent was created earlier in the script.", `errors.ts:183`), which is
actively misleading for this failure, since the user did create it earlier. It needs its own.

## 8. Open questions

- The `type-reference` role (`dependencies.ts:182-196`) is `required: false` too, so
  `create attribute a in X type Y` where `Y` is created earlier in the same script should race
  the same way. Not measured here, and out of this lane's scope. Worth its own reproduction.
- The value shown in the error dialog overflows its red box for a message this long. Cosmetic,
  recorded at Alfonso's instruction, not fixed here.

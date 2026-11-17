# Discovery: JjEL `==` between two references to the same model object

Prompt-ID: P-2026-11-17-2219. Branch `jjel-object-identity`, cut from `alfonso-frontend-jjtl` at `e30274962`.
Read and measured on 2026-11-17; the app was driven headless (Chromium, dev server on :3098, offline user) on a clone
of the gallery project «Families and Persons» (`families-persons@1`).

## 1. Objective

Alfonso's report of 2026-11-17 (MDE lecture, app.jjodel.io): with the Member «Jim» selected, in the console in JjEL mode
`self.parent.father.id` and `self.id` are the same pointer and `self.parent.father == self` is `false`; a Families2Persons
guard `parent.mother == self or parent.daughters.contains(self)` never holds, so every Member becomes Male. His hypothesis:
every navigation step returns a fresh proxy and `==` compares proxies by reference. Asked: confirm or correct by reading
the evaluator, find what changed since 27 and 28 October, when `==` on objects «worked».

## 2. Files read

- `frontend/src/jjel/evaluator/evaluator.ts`: `isEqual`, `getProperty`, `evaluateIdentifier`.
- `frontend/src/jjel/evaluator/builtins/collections.ts`: `contains`, `indexOf`, `deepEqual`, `keyOf`, `distinct`,
  `distinctBy`, `groupBy`.
- `frontend/src/jjscript/executor/commands/eval.ts`: `buildEvalContext`, `shallowObjectToJjelValue`,
  `fillInstanceSlots`, `resolveOrMaterialize`, `resolveParentHandle`, `wrapSelectedElement`.
- `frontend/src/components/Jodie/jodieJjelContext.ts`: `self` is `data`.
- `frontend/src/jjtl/executor/executor.ts`: `derefSourceRef`, `liftSourceRefs`, `bindSourceValue`, `sourceView`,
  `createInstanceContext`; the legacy expression evaluator at the end of the file is dead code.
- `frontend/src/components/project/ProjectEditor.tsx`: `serializeSourceObject`, `wrapIfRef`.
- `frontend/src/joiner/proxy.ts`: `TargetableProxyHandler.get`, `get0`, `ownKeys`.
- The same files at `73307b7ed` (3.0.0), `5fbfb68aa` (3.1.0) and `origin/dotnet-backend-integration` (`ec4f2543e`, 3.1.2).

## 3. Findings

### 3.1 The cause

The hypothesis is half right. `==` does compare by JavaScript reference first, but navigation does not return fresh
proxies: in the console it returns shared plain handles. The two operands of `self.parent.father == self` are two
different representations of the same Member.

`buildEvalContext` builds one plain handle per M1 object (`shallowObjectToJjelValue`) and indexes them by id
(`instanceById`). `instances`, `Class.instances`, every reference slot and `parent` resolve to that same handle, and the
comments say why: «instance identity for `==`». The selected element is the exception. `data`, and so `self`, is built by
`wrapSelectedElement`: a new record that copies the 86 keys of the L proxy, never looked up in `instanceById`.

Measured on Jim:

| | value |
|---|---|
| `self` is the pool handle of its id | no |
| `self.parent.father` is the pool handle | yes |
| keys of `self` / of the handle | 86 / 11 |

`isEqual` then falls to its last branch, key by key: 86 keys against 11, `false`. `contains` and `indexOf` use
`deepEqual` in `collections.ts`, a copy of the same rule, with the same answer.

In JjTL the operands differ in the same way. ProjectEditor serializes a reference value as `{ __ref: id }`; in a guard
`parent.mother` is that wrapper (on the trunk, its handle from `liftSourceRefs`, whose only enumerable key is `__ref`)
and `self` is the source object or its view. One key against many: `false`. Every JjTL expression goes through the
JjEL evaluator (`astBridge`), so there is one equality to fix.

### 3.2 It is not a regression

`isEqual`, `deepEqual` and `wrapSelectedElement` are the same at `73307b7ed`, `5fbfb68aa` and `ec4f2543e`. What differs
between the two observations is the left operand. Measured today, on the unfixed trunk, with Jim selected:

| expression | result |
|---|---|
| `(forall m in Member.instances such that m.parent.mother == m or m.parent.daughters.contains(m) : m.firstName).size` | 4 |
| `(forall m in Member.instances such that m.parent.father == m : m.firstName).size` | 2 |
| `self.parent.father == self` | false |
| `Member.instances.contains(self)` | false |
| `(forall m in Member.instances such that m == self : m.firstName).size` | 0 |
| `self.parent == self.parent.father.parent` | true |

A quantifier variable ranges over pool handles, so `m.parent.mother == m` compares a handle with itself. The October
checks used `m`; the November one used `self`. Any comparison with `self` on one side and a navigated object on the
other has always been false.

### 3.3 Two more defects of the same family

- `distinct`, `distinctBy` and `groupBy` key their elements with `JSON.stringify`. The handles form cycles
  (`member.parent.father` is the member): on handles it throws «Converting circular structure to JSON». On `self` it
  walks the L proxies copied into the record: `[self, self.parent.father].distinct()` did not return within 40 s and
  blocked the page.
- When both operands are raw L proxies (contexts that pass them through, such as the classic console's `data`), the
  key-by-key walk recurses through `father` and the children: `a == a'` on two proxies of one Family threw «Maximum call
  stack size exceeded» after 200 ms.

### 3.4 Which build the lecture ran

Not established. `origin/dotnet-backend-integration` and `origin/staging` are at 3.1.2 and do not contain `636d465c0`
(31 October, readable `{ __ref }` values). On that code the workaround of the report, `parent.mother.id == self.id`,
cannot work: `parent.mother.id` is null. It did work in the lecture, so the deployed build is newer than the two
branches as pushed. The fix does not depend on the answer (section 6).

## 4. The fix

`frontend/src/jjel/evaluator/identity.ts`, new: `modelIdentityOf(value)` returns the id of the model object a value
stands for, or `null`.

- An own string `__ref`: a reference value or its handle.
- Otherwise a non-empty string `id` on an object that owns a string `__type` or `className`. Every builder writes one:
  pool handles and `self` carry `__type`, JjTL source objects both, the D record behind an L proxy `className`.
- Never an object marked `__createdBy`: a target a JjTL rule is building, whose `id` is at most an attribute value.
- A record written in an expression has no marker, so `{ id: "x", n: 1 }` is still compared key by key.

`modelObjectsEqual(a, b)`: when either side is a model object, equal iff both are and the ids match; otherwise
`undefined` and the caller continues. Wired in three places: `isEqual` (`==`, `!=`, nested in arrays and records),
`deepEqual` (`contains`, `indexOf`), and the replacer of `keyOf` (`distinct`, `distinctBy`, `groupBy`), where a model
object becomes `{ "\u0000id": id }` at any depth and is not walked. Null, primitives, arrays, records and bit-vectors
keep their rules. No critical-zone file, no exported interface changed, `buildEvalContext` untouched.

Not chosen: making `self` the pool handle. It would fix the console only (not JjTL, not L proxies), and it would take
from `self` the 75 keys the handle does not have (`features`, `isRoot`, `node`-side reads), which expressions may use.

## 5. Evidence

- Tests first, `0de8bfa89`: `jjel/__tests__/object-identity.test.ts` (14) and
  `jjtl/executor/__tests__/source-object-identity.test.ts` (6, the guard of the report on the sample model's 2 families
  and 9 members, both parse paths). 12 of 20 red on the unfixed trunk; the JjTL case gives 0 Female and 9 Male.
- After `eb2dea24b`: 20 of 20. Mutation bench: no check in `isEqual` 8 red; none in `deepEqual` 5; none in `keyOf` 3;
  no `__ref` branch 1; no `__createdBy` exclusion 1; no marker test 3. One mutant survives: letting a model object
  compared with a non-model value fall through to the key walk. On plain records the two rules cannot differ (a record
  with the same keys would carry the marker); the early `false` is there for L proxies and cycles. Declared intent.
- In the app, same probe as section 3.2, after the fix: `self.parent.father == self` true, `!=` false,
  `self.parent.mother == self` false, `Member.instances.contains(self)` true, `indexOf` 0, the `m == self` quantifier 1,
  Brenda in `self.parent.daughters` at index 0, `[self, self.parent.father, self.parent.mother].distinct().size` 2,
  `Member.instances.distinctBy(m => m.parent).size` 2, the two quantifiers still 4 and 2. On raw L proxies: `a == b`
  true, `a == c` false, `[a, b, c].distinct().size` 2.
- Gates: typecheck 0 errors. Vitest 16344 passed, 20 failed in 6 files plus the 3 known files that fail at import. The
  same 6 files fail with the same 20 tests on `e30274962` in this environment (lane tooling under `scripts/hooks`, and two
  tests that need Playwright's Chromium): not caused by this branch. Build not run.

## 6. Risks and limits

- Two objects that both carry a marker and the same `id` are now equal whatever their other keys. That is the intent
  for `self` against a handle; it also makes `self == Member` true when the class Member is selected.
- A source class with an attribute named `id`: `serializeSourceObject` writes features after `id` and overwrites the
  pointer. Already wrong before this branch (`derefSourceRef` and `isSourceElement` read the same field); now equality
  reads it too. Not fixed here.
- `codegen/target/js/printer.ts` prints its own copy of `isEqual` into generated code. Generated code runs on its own
  objects, not on handles: not touched, not measured.
- `<`, `<=`, `>`, `>=` on model objects are unchanged (they compare `String(value)`).
- On 3.1.2 (`ec4f2543e`) the two commits cherry-pick clean: 18 of 20 green. The two red are the id workaround, which
  needs `636d465c0`, absent there.
- The JjTL case was run on the executor with the serializer's shape, not through the Transformation panel.

## 7. Open questions for Alfonso

1. Which build was on app.jjodel.io on 17 November (the version and hash in the status bar)? It decides where a patch
   release is cut from.
2. A patch release for the course, or the trunk and 3.2 only?
3. `self == Member` true on a selected class: wanted, or should a class and `self` stay distinct?

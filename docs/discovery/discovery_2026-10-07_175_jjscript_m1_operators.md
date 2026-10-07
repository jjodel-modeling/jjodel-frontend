# Discovery — #175, JjScript at M1: `-=`, wrong-type `set`, unquoted names, root-only lookup (Phase 1)

**Prompt-ID**: none — chat `C-2026-10-07-0910`, Juri's request in chat («pianificare la risoluzione della issue 175 e passare alla risoluzione per la chiusura»), no prompt file
**Issue**: MDEGroup/jjodel#175
**Session**: d387dd4b-050b-48e4-967f-597adb32ef13 (the session's scratchpad directory)
**Tree / HEAD**: `/Users/juridirocco/development/jjodel`, branch `staging`, `a279f8104` ("docs(#176): log entry for the read refusal (C-2026-10-06-1524)"); untracked `docs/discovery/andrea.json` (not ours, untouched)
**Executor**: Anthropic Claude Opus 5.5
**Stato**: Phase 1, read-only on the code. One probe, gitignored, not committed: `frontend/scripts/smoke/_tmp_175_measure.ts`, run with `SMOKE_URL=http://localhost:3000 npx tsx …` against the dev server of this tree (vite :3000, serving `a279f8104`), exit 0, zero page errors.

This report is a set of hypotheses with evidence, not a definitive reference. A reader acting on it rereads the real files and reruns the probe. MEAS = measured in this phase on `a279f8104` through `JjScriptService.execute` at M1 in developer mode (the path of the console, `ScriptBlock` and Jodie); READ = code reading only.

---

## 0. Answer in brief

- **Point 1 holds, measured.** `set Scenario_0.lead -= p1` answers «Linked» and leaves `[p1, p1]` (MEAS A2); the same on a containment (A8: `[pAdd, p2, p2]`) and for an element the slot does not hold (A5). `instance.ts` never reads `args.operator` (§2.1). `remove p2 from Scenario_0.lead` fails `ELEMENT_NOT_FOUND` (A3). `+=` appends on a multi-valued reference (A1) and REPLACES on a single-valued one (A4), both answered «Linked». `add p1 to Scenario_0.lead` is a bare `PARSE_ERROR` «Parse error» (A6). `add instance Phase to Scenario_0.pathway "pAdd"` already works since R-JS-9: born in the slot (A7).
- **Point 2 holds, measured, on plain references too.** `set Scenario_0.pathway = Antonio` (Learner into a Phase composition) and `set Scenario_0.lead = Antonio` (Phase plain) both succeed (B1, B2). The handler has no type check on the link branch; the check exists only for `create … in` (`resolveContainerSlot`, `instance.ts:410-417`).
- **Point 3 holds and is worse than the issue says.** `create instance of Phase nome1` creates `Phase` (C1); `create instance of Phase two words` creates `Phase3` (C7); and **`create instance of Phase nome4 in Scenario_0.pathway` loses the container too**: `Phase2` is born at the root (C6), because the unread name stops the parser before the R-JS-9 `in` (`parser.ts:294`). `rename nome1 to "nome2"` is a `PARSE_ERROR` (C3). Cause: `parse()` is non-strict, trailing tokens are dropped silently (`parser.ts:90`).
- **Point 4 is already resolved on staging** by R-JS-10 (`9916cefce`, Alfonso's lane `P-2026-10-04-0946`, on staging through the #178 sync): an element nested by `slot.addObject` (the «Add» form, father = slot, not in `model.objects`, D0) resolves by name as a link target (D1) and as a rename subject (D2).

**Recommendation for Phase 2** (§5): all in the JjScript executor and parser, no core change (rule 5), no critical-zone file (§3.1).
1. `-=` and `remove y from x.ref` at M1 remove `y` by value through the existing `removeLinked` (the `= null` path, measured by #168 C1 V1-V5); not in the slot → `NOT_LINKED`. `+=` adds when the slot has room, else `MULTIPLICITY_EXCEEDED` with the `=` hint. `+=`/`-=` on an attribute → refused with a code of its own (READ: the attribute branch ignores the operator too). `add <existing> to x.ref` → a parse error that names the `set … +=` form.
2. A `set` that links checks the target's class against the reference type (`isExtending`, the same test as `resolveContainerSlot`), after the queued writes land: `TYPE_MISMATCH`.
3. `create instance` accepts the name with or without quotes; any other leftover token is an error. `rename … to` accepts quotes; at M1 the name is free like `create`'s.
4. Point 4: nothing to change; the probe keeps D0-D2 as controls.

Decisions awaiting Juri (they change committed behaviour):
1. Point 1, containment: `-=` of a child born in the slot (not in `model.objects`) would leave it fathered to the model and out of `objects`, invisible (the #174 eviction orphan, which `= null` already produces today).
   Recommended: refuse that one case with its own code (`WOULD_ORPHAN`), execute every other `-=`.
2. Point 1, execute or refuse `-=` / `remove` at M1 (the issue's open question; the #168 ticket recommended refusal).
   Recommended: execute — refusing leaves no way to take one element out of a multi-valued reference (`= null` empties it all).
3. Point 2, where the type check lives.
   Recommended: the JjScript executor; the core's check is commented out (`LModelElement.tsx:7910`, jjscript inbox ticket of 2026-10-04) and the canvas gestures depend on it.
4. Rule 19: Phase 2 touches 8-9 files (§5.5).
   Recommended: confirm the list.

---

## 1. Hypotheses under test

| # | Hypothesis (from the issue body) | Verdict | Evidence |
|---|---|---|---|
| H1 | `-=` adds instead of removing; `+=` adds only by coincidence | **holds** | MEAS A2, A5, A8; READ §2.1 |
| H2 | `remove y from x.ref` and `add` at M1 fall into M2 resolution and fail `ELEMENT_NOT_FOUND` | **partly**: `remove` holds (A3); `add <existing>` fails as `PARSE_ERROR`, not `ELEMENT_NOT_FOUND` (A6); `add instance <Class> to x.ref` works since R-JS-9 (A7) | MEAS A3, A6, A7 |
| H3 | a containment `set` accepts an element of the wrong type | **holds, and wider**: plain references too | MEAS B1, B2 |
| H4 | an unquoted name in `create instance of X name` vanishes silently; `rename x to "y"` does not parse | **holds, and wider**: the `in` container is lost too | MEAS C1, C3, C6, C7 |
| H5 | `findInstanceByName` searches only `model.objects` | **falsified on `a279f8104`**: R-JS-10 made it model-wide | MEAS D0-D2; READ §2.4 |

## 2. Findings

### 2.1 The operator is parsed and ignored at M1 (point 1)

- READ `frontend/src/jjscript/parser/parser.ts:593-598`: `let operator: '=' | '+=' | '-=' = '=';` … `} else if (this.matchOperator('-=')) {` / `operator = '-=';`.
- READ `frontend/src/jjscript/executor/commands/instance.ts:1067-1071`, the only write of the link branch: `// Single-valued: the target replaces what the slot held. Multi-valued: appended.` / `const plan = planLink(linkedIds(refProxy.__raw?.values), targetInstance.id, isManyValued(meta?.upperBound));`.
- Absence: `command grep -n "operator" frontend/src/jjscript/executor/commands/instance.ts` exit 1; positive control, same command on `set.ts`: exit 0, `set.ts:34` `const { target, property, value, operator } = args;` (the M2 branch).
- The attribute branch ignores it as well (READ `instance.ts:942`: `featureProxy.value = primitive;`), so `set x.n += 1` would write `1`. Not measured: the fixture has no attribute.
- MEAS A1 `set Scenario_0.lead += p1` → «Linked Scenario_0.lead → p1», `[p1]`. A2 `-= p1` → «Linked», `[p1, p1]`. A4 `set Scenario_0.coach += Antonio` (0..1) → «Linked», `[Antonio]` (replace). A5 `-= p1` again → «Linked». A8 `set Scenario_0.pathway = p2` then `-= p2` → `[pAdd, p2, p2]`, p2 father `DValue`.

### 2.2 `remove` and `add` at M1 (point 1)

- READ `executor/commands/remove.ts:49`: `const targetElement = resolveElement(target, project);` — the M2 resolver, no M1 routing (unlike `set.ts:49-50`, `rename.ts:59-60`). MEAS A3: `remove p2 from Scenario_0.lead` → `ELEMENT_NOT_FOUND` «Target element not found: p2».
- READ `parser.ts:616`, `parseAddCommand`: `const name = this.expectIdentifier('element name');` after `parseElementType()`, so `add p1 to …` fails in `parseElementType` (`Expected element type …, found 'p1'`). MEAS A6: `PARSE_ERROR`, message «Parse error».
- READ `executor/commands/add.ts:26-34`: `add` becomes `executeCreate` with `parent: to`, so at M1 `add instance Phase to Scenario_0.pathway "pAdd"` takes the R-JS-9 path. MEAS A7: success, pAdd father `DValue`, not in `objects`. Its message names the class, not the instance: «Added instance 'Phase' to 'Scenario_0.pathway'» (cosmetic, `add.ts:38`).
- Profile guard, READ `executor/permissionGuard.ts:92`: `const LANGUAGE_COMMANDS: ReadonlySet<string> = new Set(['add', 'remove', 'move', 'copy', 'extends', 'abstract']);` — under a profile `remove` is refused as a language change before any handler. `set … -=` goes through the link description of `describeForGuard` (`executor.ts:422-429`: subject `edit`, target not `hidden`, `edit` on a containment), which fits a removal by value.

### 2.3 No type check on a link (point 2)

- READ `instance.ts:1026-1049`: the target is resolved (`resolveInstanceHandle`) and refused only when ambiguous or absent; nothing reads its class before the write.
- READ `instance.ts:410-417`, the check that exists for `create … in`: `const conforms = slotType && (typeof (metaclass as any).isExtending === 'function'` / `? (metaclass as any).isExtending(slotType)` … `return fail('TYPE_MISMATCH', …`.
- MEAS B1 `set Scenario_0.pathway = Antonio` → «Linked», pathway `[pAdd, p2, p2, Antonio]`. B2 `set Scenario_0.lead = Antonio` → «Linked». Controls: B3 `set Scenario_0.lead = s1` (Step extends Phase) succeeds; B4 `create instance of Phase "pNew"` then `set Scenario_0.lead = pNew`, no pause, both succeed. B5 (a Learner created then linked into `lead`) succeeds today: the case a fix must refuse without pausing.

### 2.4 Names (points 3 and 4)

- READ `parser.ts:368`: the instance name is read only as a STRING: `if (elementType === 'instance' && this.check('STRING') && !options.defaultValue) {`. Any other token ends the option loop (`break`), and `parser.ts:294` `if (!parent && this.matchKeyword('in')) {` then sees the name, not `in`.
- READ `parser.ts:90`: trailing input is an error only `if (opts?.strict)` (used by `detect()`); `JjScriptService.execute` parses non-strict, so the leftovers vanish.
- MEAS C1 `create instance of Phase nome1` → «Created instance 'Phase' of Phase», no `nome1`; C2 the following `set Scenario_0.lead = nome1` → `INSTANCE_NOT_FOUND`; C6 `create instance of Phase nome4 in Scenario_0.pathway` → «Created instance 'Phase2' of Phase», no « in …»; C7 `create instance of Phase two words` → `Phase3`.
- READ `parser.ts:567`: `const newName = this.expectIdentifier('new name');` and `parser.ts:1272-1278`: IDENTIFIER or KEYWORD only. MEAS C3 `rename nome1 to "nome2"` → `PARSE_ERROR`. Control C4 `rename quoted to quoted2` succeeds.
- READ `executor/commands/rename.ts:33-44`: `if (!isValidIdentifier(newName)) {` … `code: 'INVALID_NAME'` runs before the M1 routing at `:59-60`, so at M1 a quoted name with a space would still be refused, while `create` accepts it (C8: `create instance of Phase "Mario Rossi"` succeeds).
- MEAS C8: `rename "Mario Rossi" to "Maria Rossi"` → `PARSE_ERROR`: a name with a space cannot be the target of a command. Outside #175 (it is the subject, not the new name); ticket candidate.
- Point 4, READ `instance.ts:119-126`: `The scope is the whole model, roots and contained instances (R-JS-10, amending` … `export function findInstanceByName(model: LModel, instanceName: string): any[] {` / `return allModelInstances(model).filter(…)`, and `:134-154` walks `o.subObjects` (`LModelElement.tsx:6560-6568`, the containment slots). `git merge-base --is-ancestor 9916cefce staging` → true. MEAS D0 nested1 born by `slot.addObject({ name: 'nested1' }, Phase, true)` (the `createAdapter.ts:532` form): father `DValue`, not in `objects`; D1 `set Scenario_0.lead = nested1` succeeds; D2 `rename nested1 to nested2` succeeds.

### 2.5 Removal mechanics already in place

- READ `instance.ts:338-345`, `removeLinked`: `SetFieldAction.new(refProxy.id, 'values', id as any, '-=', true);` and, for a containment whose child's father is the slot, `SetFieldAction.new(id as any, 'father', modelId as any, undefined, true);` — no write to `model.objects`. Measured by #168 C1 (V1-V5, `discovery_2026-10-02_168_c1_executor_prompt.md` §6) for children that were still in `objects` (root-born, then linked). A child born in the slot is not in `objects`: after this write it is fathered to the model and listed nowhere — the eviction orphan of the 2026-10-02 inbox ticket (`docs/log-inbox/jodie-consumer.md`, carried to #174). Inferred from the code, not measured here.

## 3. Dependencies and risks

- **R-JS-3** (`runPasses`): «Two collection updates (`+=`, `-=`) compose and do not supersede each other» — compatible with executing `-=`. New refusal codes are final, not deferrable (they are not in `M1_DEFERRABLE_ERROR_CODES`), except that a `TYPE_MISMATCH` on a target that a later line retypes cannot happen (types do not change in a run).
- **Committed behaviour that changes** (rule 3, hence decisions 1-2): `-=` stops appending; `+=` on a full single-valued reference stops replacing; a wrong-type link stops succeeding; `create instance of X word` stops creating an auto-named element (it names it `word`); a leftover token becomes an error. The Jodie chat prompt v5 forbids `+=`/`-=`/`add`/`remove` at M1 (`frontend/src/constants/defaultPrompts.ts:236`, «at this level they do not do what they say»): after the fix the sentence is stale but the behaviour it asks for stays safe. Not touched in this lane; ticket.
- **Type check timing**: a target created by the previous line has its `instanceof` in the store only after the commit (~300 ms, R-JS-11). The check must run after `settlePendingWrites()` (`instance.ts:1052`), not before, or B4 turns red. Phase 2 measures B4/B5.
- **Profile guard**: unchanged. `remove` stays refused under a profile as a language command (`permissionGuard.ts:92`), a refusal on the safe side with a misleading sentence; the consumer path uses `set`.
- **Layers**: JjScript executor and parser only. D-layer writes only through the existing `removeLinked` (`'-='` by value, `father`) and `refProxy.values`; no creator inside a TRANSACTION (rule 12); no §3.1 file; no core file (`LModelElement.tsx` read only).

## 4. Files read

- In full: `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/jjscript/CLAUDE.md`, `frontend/src/jjscript/executor/commands/instance.ts`, `frontend/src/jjscript/executor/referenceWrite.ts`.
- By window: `docs/claude-code-log.md` 1-80; `docs/decisions.md` 277-288 and 5602-5748 (RC-35..42, R-JS-1..11); `docs/log-inbox/jodie-consumer.md` 80-110 and 200-275; `docs/log-inbox/jjscript.md` 1-160; `docs/discovery/discovery_2026-10-02_168_c1_executor_prompt.md` 1-60 plus a grep for `-=|remove|add|ELEMENT_NOT_FOUND`; `frontend/src/jjscript/parser/parser.ts` 60-260, 260-660, 1022-1075, 1272-1320; `frontend/src/jjscript/executor/executor.ts` 100-250, 340-445; `frontend/src/jjscript/executor/permissionGuard.ts` 80-140; `frontend/src/jjscript/executor/commands/set.ts` 30-70; `add.ts` 19-42; `remove.ts` 25-65; `create.ts` 220-260; `rename.ts` 25-65; `frontend/src/jjscript/types.ts` 128-230; `frontend/src/jjscript/executor/__tests__/m1Containment.test.ts` 1-120; `frontend/src/model/logicWrapper/LModelElement.tsx` 3775-3800, 6555-6585; `frontend/scripts/smoke/_tmp_176_verify.ts` (the fixture pattern); `frontend/src/constants/defaultPrompts.ts` grep for the M1 rule.
- Issue #175 body (`gh issue view 175 --json`), no comments.

## 5. Phase 2 design (proposed, awaiting the decisions)

### 5.1 Point 1 — operators

- Pure, in `referenceWrite.ts` (the bench can import it): `planAdd(current, targetId, upper)` → `{ write }` when there is room (`upper` -1/`*` or `current.length < upper`), `{ noop }` when a single-valued slot already holds the target, `{ full }` otherwise; `planRemove(current, targetId)` → `{ remove: [targetId] }` or `{ absent }`.
- `executeSetInstance`: `isUnlink` only for `=`; `+=`/`-=` with `null` → `TYPE_MISMATCH`. Link branch switches on `args.operator`: `=` as today; `+=` via `planAdd` (`MULTIPLICITY_EXCEEDED` «'coach' holds one Learner: use `set Scenario_0.coach = Antonio` to replace it»); `-=` via `planRemove` and `removeLinked` (`NOT_LINKED` when absent; decision 1 for a slot-born containment child). Message «Removed p1 from Scenario_0.lead». Attribute branch: `+=`/`-=` → `OPERATOR_NOT_SUPPORTED`.
- `remove.ts`: at M1, `remove y from x.ref` becomes the `-=` above (`from.member` required, else `REFERENCE_REQUIRED`); `remove extends from` stays M2.
- `parser.ts` `parseAddCommand`: a token that is not an element type → «To add an existing instance to a reference: set <Instance>.<reference> += <name>».

### 5.2 Point 2 — type check

In the link branch, after `await settlePendingWrites()` and before the TRANSACTION, for `=` and `+=`: reference type = `refProxy.instanceof.type`; target class re-read from the store (`LPointerTargetable.fromPointer(id).instanceof`); `isExtending(type)` false → `TYPE_MISMATCH` «'Antonio' is a Learner: Scenario.pathway holds Phase and its subclasses». No type on the reference → no check. Target class unresolved after the drain → `NO_METACLASS` (existing code).

### 5.3 Point 3 — names

- `parseCreateOptions`, instance: an IDENTIFIER (not a KEYWORD) is the name when none was read. After `create instance … [in P.ref]`, a token other than NEWLINE, EOF, `;`, `end` or a COMMAND → «Unexpected 'words' after the instance name: write a name with spaces in quotes, e.g. "two words"».
- `parseRenameCommand`: `newName` accepts a STRING.
- `rename.ts`: `isValidIdentifier` moves after the M1 routing (M2 unchanged); `executeRenameInstance` refuses only an empty name (`INVALID_NAME`).

### 5.4 Point 4

No code. Controls D0-D2 stay in the probe.

### 5.5 Files (rule 19: more than 5)

1. `frontend/src/jjscript/executor/referenceWrite.ts` — `planAdd`, `planRemove`.
2. `frontend/src/jjscript/executor/commands/instance.ts` — operators, type check, remove entry.
3. `frontend/src/jjscript/executor/commands/remove.ts` — M1 routing.
4. `frontend/src/jjscript/executor/commands/rename.ts` — identifier check after the M1 routing.
5. `frontend/src/jjscript/parser/parser.ts` — unquoted name, leftover error, quoted rename, `add` hint.
6. `frontend/src/jjscript/executor/__tests__/referenceWrite.test.ts` — the two plans.
7. `frontend/src/jjscript/__tests__/parser.test.ts` — the three parser forms.
8. `frontend/src/jjscript/executor/__tests__/m1Containment.test.ts` (or a new `m1Operators.test.ts`) — handlers on the in-memory model.
9. Docs, separate commits: `docs/decisions.md` (R-JS-12..14, the decisions), a lane inbox `docs/log-inbox/jjscript-m1-operators.md`, this report's addendum.

## 6. Open questions

1. Containment `-=` of a child born in the slot: refuse `WOULD_ORPHAN`, or execute like `= null` (orphan until #174)? Recommended: refuse.
2. `-=` / `remove` at M1: execute, or refuse with a code of their own? Recommended: execute.
3. Type check in the executor or in the core (`get_setValueAtPosition`)? Recommended: executor.
4. `+=` on a single-valued reference that already holds another element: refuse (`MULTIPLICITY_EXCEEDED`) or replace as today? Recommended: refuse, with the `=` hint.
5. The 8-9 files of §5.5 (rule 19): confirmed? Recommended: yes.
6. After the gates: branch `fix/175-jjscript-m1-operators`, fast-forward `staging`, push, closing comment on #175? Recommended: yes, as for #176.

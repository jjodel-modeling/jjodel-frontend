# Discovery — the event class derived from the Trigger reference (R-SIM-38)

**Prompt-ID**: `P-2026-09-25-1500` (chat `C-2026-09-25-1500`)
**Prompt file**: `docs/prompts/claude_2026-09-25_1500_prompt_sim_event_from_trigger.md`
**Session**: `03b93d9d-b5e0-4e2c-9020-83db64867da7`
**Tree**: `/Users/alfonso/jjodel-events`, branch `sim-event-trigger`, HEAD `79175e94c` (`docs: ratify R-SIM-38
and add prompt P-2026-09-25-1500`). `pwd`, branch, clean status and `git log -1` checked first.
**Executor**: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), as the session shows it.
**Type**: step 2 of a single-phase prompt, read-only. No source file modified when this was written.
This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream re-reads
the real files.
**Tags**: **[M]** measured in this phase on HEAD `79175e94c`, **[R]** read, **[D]** deduced.
**Environment**: `frontend/node_modules` did not exist at the start (`ls` → `No such file or directory`);
the temporary symlink `frontend/node_modules -> /Users/alfonso/jjodel/frontend/node_modules` was created
for the gates (P14). `git status` empty after it.

---

## 0. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A `DReference` stores its type as a single class pointer, readable raw from `idlookup` | **holds** in the steady state; two transient edge forms (§1.3) |
| H2 | Only the files of DOVE read `simEvent` or the `sim*` bag | **holds** (§2) |
| H3 | `runSignature` already changes when the Trigger's type changes in the metamodel | **holds** (§3) |
| H4 | `mapStateToProps` builds the roles by iterating `ROLE_KEYS` derived from `ROLE_SPECS` | **holds** (§4): `simEvent` stays in `ROLE_SPECS`, hidden from the panel |

## 1. How a `DReference` stores its type

### 1.1 The field [R]

`frontend/src/model/logicWrapper/LModelElement.tsx:3942`, the D-layer class:

> `type!: Pointer<DClass, 1, 1, LClass>;`

The field is `type`, a single pointer (a string id), typed to `DClass`.

### 1.2 How it is written [R]

- The constructor path, `frontend/src/joiner/classes.ts:982`: `this.setPtr("type", type);`, and
  `setPtr` stores the value as given, `frontend/src/joiner/classes.ts:603`:
  `(this.thiss as GObject)[property] = value;`. For a `DReference` the value is `dtype.id`, the id of the
  resolved `DClass` (`classes.ts:908-913`), and a requested enum or datatype is refused and replaced by
  `Defaults.Pointer_EOBJECT` (`classes.ts:967-969`).
- `DReference.new` substitutes the father when no type is given,
  `LModelElement.tsx:3973`: `if (!type) type = father // default type is self-reference`.
- The proxy setter normalises to an id and writes it raw, `LModelElement.tsx:1534`:
  `SetFieldAction.new(c.data, 'type', ptr, "", true);` (`ptr = Pointers.from(val)`, `:1476`).

So the raw `idlookup[refId].type` is a string id. The sync layer reads it the same way,
`frontend/src/components/editor-v2/hooks/useJjomSync.ts:620`:
`const targetId = typeof refObj.type === 'string' ? refObj.type : null;` **[R]**.

### 1.3 Proxied and inherited forms [R]

- **Proxied.** `LTypedElement.get_type` returns the `LClass` of the pointer
  (`LModelElement.tsx:1418`, `LPointerTargetable.from(c.data.type)`). Two raw forms read differently
  through the proxy: a class **name** string (not a live pointer) is resolved by name and
  auto-corrected into a pointer on the first proxy read (`:1449-1454`), and a **falsy** type reads back
  as `EObject` (`:1471`: `return LPointerTargetable.fromPointer(c.data.className === 'DReference' ?
  Defaults.Pointer_EOBJECT : 'Pointer_ESTRING');`). The comment above that line records that the Ecore
  parser never leaves the type falsy and that the in-tree census of callers reaching it is empty. The
  derivation reads raw: a name string or a falsy type does not resolve and removes the event role
  (the panel says `The Trigger reference has no class type.`) **[D]**.
- **Inherited.** A reference declared on a superclass is one `DReference`, owned by that superclass;
  subclasses do not copy it, and an instance's slot carries the id of the declaring feature
  (`frontend/src/model/simulation/objectSlots.ts:7-9`, measured in the step 1 discovery). The bag holds
  that one id, so its `type` is the same pointer for every subclass **[R]**.
- **Abstract type.** `collectMetaOptions` lists concrete classes only (`SimulationPanel.tsx:88`:
  `if (!dClass.abstract) classes.push(...)`), but the derivation does not go through that list: an
  abstract type is returned as is, and `isKindOf` (`isKindOf.ts:26`) matches the instances of its
  concrete subclasses **[R]**.
- **Primitive types are classes in the store.** `frontend/src/redux/store.tsx:334`:
  `dPrimitiveType = DClass.new(primitiveType, false, false, true, false, '', undefined, true, 'Pointer_' + primitiveType.toUpperCase());`
  (the fourth argument is `isPrimitive`, `LModelElement.tsx:2742`). A reference typed `EString` would
  point at a `DClass`; the derivation must refuse `isPrimitive` too, or R-SIM-38 (2) would not hold
  **[R]**.
- **`EObject`.** A Trigger typed `EObject` derives `Pointer_EOBJECT`, a real `DClass`; `isKindOf` then
  matches only objects whose metaclass chain reaches it through `extends` **[D]**, not every object.
  Not a case of this lane.

## 2. Every reader of `simEvent` and of the `sim*` bag [M]

Searches with `command grep -rn ... --exclude-dir=node_modules` from `frontend/src`, exit status recorded.

- `simEvent\b`: exit 0. Production hits: `SimulationPanel.tsx:147` (`ROLE_GROUPS`), `:215` (`eventRole`),
  `:618` (`eventSigOf`); `simRoleStatus.ts:33` (`RoleKey`), `:68` (`ROLE_SPECS`), `:137`, `:140`
  (`missingEventRoles`); `stcFromRoles.ts:27` (`ROLE_SORTS`), `:83` (`overlapVerdict`);
  `netCompile.ts:50` (`ROLE_KEYS`). Tests: `simRoleStatus.test.ts`, `simBridge.test.ts:46`,
  `netParity.test.ts`, `netStep.test.ts:461`, `events.test.ts`, `netCompile.test.ts`.
- `ROLE_KEYS`: exit 0. `SimulationPanel.tsx:50`: `const ROLE_KEYS: RoleKey[] = ROLE_SPECS.map(r => r.key);`,
  read at `:596`; `netCompile.ts:43` (a separate constant of the same name, `netStcFromRoles`).
- `netStcFromRoles`: exit 0. Production callers `simBridge.ts:165` (`startRun`) and
  `SimulationPanel.tsx:619` (`eventSigOf`).
- `_state` in `components/editor-v2/sim` and `model/simulation`: the bag reads are
  `SimulationPanel.tsx:594` (`mapStateToProps`), `simBridge.ts:164` (`startRun`), `simBridge.ts:211`
  (`runSignature`). The other 21 files holding `_state` outside those two directories were listed; none
  matches the next search. The same search also listed the test fixture `netParity.test.ts:95`
  (`_state: events ? { ...BAG_EV } : { ...BAG }`), which drives `startRun`; it was not recognised
  here as a reader of the bag and was found red at step 6 (§8).
- Any `sim*` role key as a string or member outside `components/editor-v2/sim/` and
  `model/simulation/`: exit 1, no hit. **Positive control**: the same regex without the path filter
  returns hits in 9 files, all under those two directories (e.g. 52 in `simRoleStatus.ts`, 9 in
  `netCompile.ts`). `state?.sim` / `state['sim` forms: one hit, the test `simBridge.test.ts:262`.

The roles reach `stcFromRoles.ts` (`overlapVerdict`, `roleWriteVerdict`) only as an argument, from
`SimulationPanel.tsx:227` and `:289`. So H2 holds: the bag is read in `simBridge.ts` (two functions) and
`SimulationPanel.tsx` (`mapStateToProps`), and everything else receives the roles those build.

## 3. `runSignature` and a retyped Trigger [R]

`frontend/src/components/editor-v2/sim/simBridge.ts:232-233` adds every `DReference` of the lookup:

> ``sig += `r${id}=${raw.name ?? ''},${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''};`;``

So a change of the Trigger reference's `type` already changes the signature and interrupts a run
(R-SIM-34), whatever the bag says. Reading the derived bag in `runSignature`, as DOVE asks, adds the
derived `simEvent` to the `sim*` part: redundant with the `r` line for a retype, and it drops a stale
`simEvent` from the signature, which the run no longer reads **[D]**. A test in `simBridge.test.ts`
retypes `R_trigger` and expects the signature to change.

## 4. `ROLE_SPECS` and the bag [R]

`mapStateToProps` copies only the keys of `ROLE_KEYS` (`SimulationPanel.tsx:595-599`):

> `for (const key of ROLE_KEYS) {` / `const value = bag[key];` / `if (typeof value === 'string' && value) roles[key] = value;`

and `ROLE_KEYS` is `ROLE_SPECS.map(r => r.key)` (`:50`). Removing the `simEvent` spec would drop the
derived value from `roles`, and with it `eventRole`, `eventSigOf` and the overlap check of the event sort.
Per the prompt's rule, the key stays in `ROLE_SPECS` (readable) and leaves `ROLE_GROUPS` (hidden, so never
written). `labelOf('simEvent')` has no other reader than `missingEventRoles` (`simRoleStatus.ts:140`).

## 5. Baselines on HEAD `79175e94c` [M]

- `npm run typecheck`: exit 2, **14** errors, the §17 set by file and code (`api/data.ts` TS2304 ×2 and
  TS2322; `common/Dummy.ts` TS2307; `EditorV2.tsx` TS2339; `Measurable.tsx` TS2345, TS2552, TS7053 ×4;
  `ChatMessages.tsx` TS2322; `ProjectEditor.tsx` TS2769; `Dashboard.tsx` TS2339). Counted on the full
  output saved in the scratchpad.
- `npx vitest run`: exit 1, **4620 passed** (4620), 196 files, the **9** files of §17 red at import.

## 6. Plan consequences and risks

- The derivation reads two raw entries (the Trigger `DReference`, its `type` `DClass`), cheap enough for
  `mapStateToProps` on every dispatch **[D]**.
- Checking `className === 'DReference'` on the Trigger id keeps R-SIM-38 (2) true even for a bag written
  by hand; the panel offers references only (`kind: 'reference'`) **[D]**.
- `writeRole` must derive after the write: with the derived roles before it, a Trigger change would be
  judged against the old event class. Doing so replaces the panel's only production call of
  `roleWriteVerdict` (`stcFromRoles.ts`, out of scope) with `overlapVerdict` on the derived bag;
  `roleWriteVerdict` keeps its tests in `events.test.ts` and no production caller **[D]**.
- `eventRoleWarning` (`simRoleStatus.ts:157`) loses both its callers with the half-set state; the prompt
  names only `missingEventRoles` for deletion **[D]**.
- The class name in the read-only row must reach the component as a primitive prop: an abstract class
  is not in `options.classes`, so renaming it would leave a label read at render stale **[D]**.

## 7. Open questions

1. `eventRoleWarning` becomes dead: kept under `// TODO: cleanup` (rule 9) with its test. Delete it in
   a later lane?
2. `roleWriteVerdict` loses its production caller: take it up in the `stcFromRoles.ts` rename lane?

## 8. Addendum, after the edits (same session) [M]

- **Stop at step 6.** `netParity.test.ts`, which is not in DOVE, went red on 7 golden-trace tests. Its
  `rawLookup` holds `simEvent` and `simTrigger` in the bag but no `R_trigger` `DReference`, so the derived
  bag had no event role. Alfonso authorised the proposed fix in chat: one fixture line,
  `lookup.R_trigger = { className: 'DReference', id: 'R_trigger', name: 'trigger', type: 'C_Event' };`,
  with no assertion changed. Cause: (c), a missed reader in §2.
- **Gates on the working tree** (before the code commit): `npm run typecheck` exit 2, 14 errors, the
  same set as §5 (diff empty); `npx vitest run` **4624 passed** (4620 − 5 `missingEventRoles` + 2 spec
  tests + 5 `withDerivedEventRole` + 2 bridge), stated before the run, with the same 9 files red at import
  (diff of the failing-file lists empty); `npm run build` exit 0, only the pre-existing warnings
  (`bordr`, four dynamic-import notes, chunk size); `npm run check:docs` 4/4.
- **Mutation bench**: 10 mutants, 10 killed (table in the code commit body). `SimulationPanel.tsx` does not
  load under the bench (it imports the joiner). Its four edits are untested there: `mapStateToProps`
  deriving, `writeRole` deriving after the write, `ROLE_GROUPS`, the Event class row. They go to the
  visual check of step 7. The panel-level test runs through `startRun`, the same
  `withDerivedEventRole` → `netStcFromRoles` → `eventAlphabet` chain that `eventSigOf` uses.

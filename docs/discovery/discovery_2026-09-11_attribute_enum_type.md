# Discovery — `create attribute ... type <Enum>` falls back to EString in silence

**Date**: 2026-09-11 (session ran past midnight; measurements taken 2026-09-12 on
`validation-skeleton` at `046809a9b`)
**Phase**: 1, READ-ONLY. **HARD STOP** at this report. No source modified.
**Prompt**: `docs/prompts/claude_2026-09-11_1800_prompt_jjscript_attribute_enum_type.md` (2026-09-11 18:00)
**Gate**: satisfied — the four manual cases passed on localhost, and `7bacbd63c` / `12a318b3a`
are on `alfonso-frontend-jjtl` as `9b9730ed4` / `11f42aada` (log entry of 2026-09-12).

---

## 1. Objective

Establish, by measurement, (a) what decides an attribute's type today, (b) how an enum-typed
attribute is represented in the model, (c) whether `createReference`'s resolution can be reused
with a kind restriction, and (d) which other commands take `type <Name>`.

**Answer in one line.** The bug is **two** silent fallbacks in a row, not one; the representation
already supports enums and needs no change (so the prompt's stop-and-report condition does **not**
trigger); the resolver from `7bacbd63c` resolves enums correctly with `kinds: ['enum']` and can be
reused as is; and `set ... type` is a **second** affected command with a **different** defect,
which by the prompt's own rule is reported and left for a follow-up.

---

## 2. Files read

Read in full: `frontend/src/jjscript/executor/commands/create.ts` (the type path),
`frontend/src/jjscript/executor/commands/set.ts` (`convertValue`).
Read in declared windows: `jjscript/parser/grammar.ts` 203-233 (`parseTypeReference`),
`jjscript/parser/parser.ts` 335-360 (`parseCreateOptions`),
`jjscript/executor/resolvers.ts` 190-256 (`selectTarget`), 301-320, 486-500,
`model/logicWrapper/LModelElement.tsx` 1318-1400 (`get_validTargets`), 1406-1408 (`get_enumType`),
1415-1530 (`get_type`/`set_type`), `components/editors/Info.tsx` 295-320 (`TypeSelect`),
`components/editor-v2/sync/canvasToJjom.ts` 653-680 (`syncUpdateAttribute`),
`services/export/EcoreService.ts` 290-300 and 697-734 (`mapToEcoreType`),
`redux/reducer/reducer.ts` 1392-1420 and 1477-1500 (`buildLSingletons`, `stateInitializer`).

---

## 3. The defect is two fallbacks, not one

### 3.1 Step one — `normalizeAttributeType` (`create.ts:45-74`)

```typescript
export function normalizeAttributeType(raw: string): string {
    const map: Record<string, string> = { 'estring': 'EString', 'string': 'EString', /* … */ };
    return map[raw.toLowerCase()] ?? 'EString';        // create.ts:73
}
```

One caller: `create.ts:506`. Measured (**T1**): `normalizeAttributeType('Mood')` → `'EString'`.
Positive control (**T2**), same import, same call: `'int'` → `'EInt'`, `'Boolean'` → `'EBoolean'`
— so T1 is the `??` branch firing, not a broken import.

### 3.2 Step two — the `Pointer_` lookup (`create.ts:510`)

```typescript
const shortType = rawType ? normalizeAttributeType(rawType) : 'EString';
const typePointer = (Defaults as any)['Pointer_' + shortType.toUpperCase()] ?? Defaults.Pointer_ESTRING;
const newAttr = DAttribute.new(name, typePointer, parentId, true);
```

Measured (**T3**): `Defaults['Pointer_MOOD']` is **`undefined`**, so even if step one were fixed to
return the raw name, this second `??` would still land on `Pointer_ESTRING`. Positive control:
`Defaults.Pointer_EINT` → `'Pointer_EINT'`, truthy.

**Both fallbacks must be removed for the fix to be observable.** Repairing only
`normalizeAttributeType` changes nothing.

### 3.3 What actually reaches `createAttribute`

Measured (**T4**), `parseTypeReference` (`grammar.ts:203`):

| input | result |
|---|---|
| `String` | `{kind:'primitive', type:'String'}` |
| `Mood` | `{kind:'class', name:{segments:['Mood'], raw:'Mood'}}` |
| `MM::Mood` | `{kind:'class', name:{segments:['MM','Mood'], raw:'MM::Mood'}}` |

So a non-primitive type name arrives as `kind: 'class'` with a **full `QualifiedName`** already
parsed — which is exactly what the resolver takes. The information the fix needs is already there;
`createAttribute` throws it away by calling `rawTypeName` (`create.ts:82-90`), which flattens the
QualifiedName back to a string.

Measured (**T5**): for `MM::Mood`, `rawTypeName` returns **`'MM::Mood'`** (it prefers `name.raw`
over the last segment), and `normalizeAttributeType('MM::Mood')` → `'EString'`. **The fix must pass
`options.type.name` (the QualifiedName) to the resolver, never the `rawTypeName` string** — the
qualified form is lost otherwise.

---

## 4. Representation of an enum-typed attribute — pointer, not string

**Decision: `DAttribute.type` holds a Pointer to the `DEnumerator`.** The fix writes an id, exactly
as the UI does. Evidence, four independent places:

1. **The UI write.** `components/editors/Info.tsx:316` — the Properties-panel type picker:
   ```typescript
   onChange={(opt: any) => { (data as any).type = opt ? opt.value : ''; }}
   ```
   and the header above it says it plainly: «write: `data['type'] = <classifierId>` (the same
   L-proxy setter the native select used)». `opt.value` is `object.id` (`LModelElement.tsx:1350`).
2. **The canvas write.** `components/editor-v2/sync/canvasToJjom.ts:674` resolves the chosen label
   to `pointerId` through `lAttr.validTargetOptions` and assigns `lAttr.type = pointerId || value`.
3. **The option pool.** `LModelElement.tsx:1341` — `case DAttribute.cname: addPrimitives = addEnums = true`
   — and the enum half (`:1386-1394`) reads
   ```typescript
   let m = this.get_model(c);
   let pkgs = isCrossRef ? m.allCrossSubPackages : m.allSubPackages;
   for (let pkg of pkgs) { let enums = pkg.enumerators; ... }
   ```
   i.e. **the attribute's own metamodel**. That is both the proof that enums are legal attribute
   types and the scope the fix should use.
4. **The reader and the exporter.** `LModelElement.tsx:1406-1408`
   `get_enumType` → `type.isEnum ? type as LEnumerator : undefined`; and
   `EcoreService.mapToEcoreType` (`:732-733`) returns `#//Mood` for a type whose id does not start
   with `Pointer_E`, i.e. it already emits enum-typed attributes.

**Consequence for the prompt's stop condition.** The scope constraint says «If the fix requires
changing how `DAttribute` stores its type, stop and report». It does **not**: the representation
already supports enums, is already written by two UI paths, and is already read by the exporter.
No core change, no interface change. Phase 2 can proceed.

### 4.1 What could NOT be measured, and why

The prompt asks the representation be confirmed on a live model. **It could not be, in this bench.**
Building `DModel → DPackage → DClass → DEnumerator → DAttribute` in a booted store fails at
`LPointerTargetable.wrap` with `[Dev Error]Trying to wrap class without singleton or logic mapped: DAttribute`
(`joiner/proxy.ts:246`). The D→L singletons are wired by `buildLSingletons`
(`redux/reducer/reducer.ts:1392`), reachable only through `stateInitializer` (`:1477`) — the app
bootstrap. Calling it directly fails with
`Cannot access '__vite_ssr_import_1__' before initialization`: the joiner barrel's import order is
load-bearing and only holds from the app's own entry point. The pairs table in
`joiner/ExecuteOnRead.ts:20-80` that looks like the wiring is **entirely commented out** and is a
decoy.

So §4 rests on four converging code sites plus the exporter's behaviour, not on a live read. The
end-to-end confirmation belongs to the manual check at the end of Phase 2, and the acceptance
criterion should be read on screen (the Properties panel showing `Mood` as `animalMood`'s type).

---

## 5. The resolver to reuse — measured, it already does the job

`createReference` (`create.ts:575-594`) is the model the prompt points at:

```typescript
if (options.type.kind === 'class' && options.type.name) {
    let targetClass = targetMetamodel
        ? resolveElementInMetamodel(options.type.name, targetMetamodel)
        : null;
    if (!targetClass) targetClass = resolveElement(options.type.name, project);
    if (targetClass) {
        SetFieldAction.new(newRef, 'type', targetClass.id, undefined, true);
        targetTypeName = targetClass.name;
    }
}
```

It passes **no `kinds`**, so today it would happily type a reference with an enum. With the
restriction it becomes correct for both. Measured on the post-`7bacbd63c` resolver:

| probe | call | measured |
|---|---|---|
| **R1** | `resolveTargetInMetamodel(qn('Mood'), mm, ['enum'])` | **`A.Mood`** — the enumerator |
| **R2** | same, where `Mood` is a **class** and there is no enum | **`null`** — the kind filter refuses it |
| **R3** | `resolveElement(qn(['MM','Mood']), project, ['enum'])` | **`A.Mood`** — the `::` qualified form works |
| **R4** | `resolveTargetInMetamodel(qn('Nope'), mm, ['enum'])` | **`null`**, `ambiguousWith` **null** |

R2 is the one that matters for correctness: the kind restriction is what stops
`create attribute x in Animal type Mood` from typing the attribute with a *class* called `Mood`.
R3 confirms the `::` decision needs no extra work here.

**R4 carries a trap for the error message.** Not-found and ambiguous both yield `element: null`.
`resolveElementInMetamodel` returns only `.element`, so the fix must call the
**`resolveTarget*`** variants and branch on `ambiguousWith` to tell «unknown type» from «ambiguous
type». Using the `resolveElement*` shorthand would collapse the two into one wrong message.

### 5.1 One signature change is unavoidable

```
create.ts:324   result = await createAttribute(name, parentElement, options);
create.ts:328   result = await createReference(name, parentElement, options, false, project, targetMetamodel);
create.ts:472   async function createAttribute(name: string, parent: any, options: CreateArgs['options'])
```

`createAttribute` receives neither `project` nor `targetMetamodel`. Phase 2 adds them as optional
trailing parameters — the same shape `createReference` already has — touching one signature and one
call site. Within the prompt's scope («only the attribute type path»).

---

## 6. Commands that take `type <Name>` for an attribute

`parseCreateOptions` (`parser.ts:335`, the option at `:351-352`) is the single parse site:

```typescript
if (this.matchKeyword('type') || this.matchOperator(':')) {
    options.type = parseTypeReference(this.expectIdentifierOrQualified('type name') as string);
}
```

Three executor consumers of `options.type`:

| site | command | today |
|---|---|---|
| `create.ts:505-510` | `create attribute` (and `add attribute`, which delegates via `add.ts:34`) | **the bug**: two silent fallbacks to EString |
| `create.ts:575-594` | `create reference` / `containment` / `composition` | resolves, but with **no kind restriction** |
| `create.ts:733` | `create parameter` | `options?.type?.kind === 'primitive' ? options.type.type : undefined` — a non-primitive parameter type is **silently dropped** |

**And a fourth path outside `create`, with a different defect.** `set <element> type <X>`:
`set.ts:164` lists `'type'` among `attributeProps`, and `convertValue` (`set.ts:253-274`) ends:

```typescript
const qn = value as QualifiedName;
const resolved = resolveElement(qn, project);
return resolved?.id || qualifiedNameToString(qn);
```

So `set` **does** resolve an enum — project-wide, with no `kinds`, and on failure it passes the
**string** on to the L-layer, where `set_type` (`LModelElement.tsx:1505-1510`) retries it through
`Selectors.getByName(DEnumerator, ptr, false, false)` over the **whole store** (inventory §4.1 of
`discovery_2026-09-11_name_resolution_scope.md`).

By the prompt's rule — «implementation covers them only if they share the same normalization path,
otherwise they are reported and left for a follow-up» — `set ... type` does **not** share the path
(it never touches `normalizeAttributeType`) and is **reported here, not fixed**. Same for
`create parameter`, which is a third shape again.

---

## 7. Risks

**K1 — repairing one fallback changes nothing.** §3.2. Any Phase 2 test that asserts only on
`normalizeAttributeType` can pass while the attribute is still EString. The assertion must be on
the resulting `type`, or on the new resolution helper end-to-end.

**K2 — the qualified form dies in `rawTypeName`.** §3.3, measured T5. Pass `options.type.name`,
not the flattened string.

**K3 — «unknown» and «ambiguous» are the same value.** §5, measured R4. Use `resolveTargetInMetamodel` /
`resolveTargetInProject` and read `ambiguousWith`, or the prompt's required error text will be
emitted for an ambiguous enum too.

**K4 — where the new helper lives decides whether it can be tested.** `create.ts` is **not**
importable under the repo's own `vitest.config.ts` (`environment: 'node'`): it reaches
`handleRegistry.ts:80` `window.addEventListener` and monaco. My probe imported it only by stubbing
browser globals in a throw-away config outside the repo — **not** something to add to the shared
bench. `resolvers.ts` imports cleanly under plain node. **Put the enum resolution in `resolvers.ts`**
and the Phase 2 tests go next to the existing 31 in `executor/__tests__/resolvers.test.ts`. This
also satisfies «reuse `selectTarget`; no new lookup code».

**K5 — the exporter's enum pointer is intra-document only.** `mapToEcoreType` (`EcoreService.ts:733`)
returns `#//${typeName}` with no package path, unlike `targetTypePointer` (`:752`) which delegates to
`crossPackagePointer`. An enum-typed attribute whose enum lives in **another package** will export a
wrong eType. Pre-existing, independent of this lane, **out of scope** — flagged because Phase 2's
manual check may well produce the first such model.

**K6 — scope of the kind restriction on `createReference`.** Adding `kinds: ['class']` there would
fix the mirror defect in one line, but the prompt scopes this lane to «the attribute type path».
Left alone; noted as the obvious neighbour.

**K7 — no critical-zone file** (CLAUDE.md §3.1) is in the perimeter. No Layer Impact Report due.
The write is `SetFieldAction` / `DAttribute.new` on a fresh element, not a sync path.

---

## 8. Probe

9 tests, 9 passed, under vitest 4.1.4 with the frontend's `node_modules` symlinked into the session
scratchpad. Nothing installed; no repo file created, modified or staged — `git status --short`
shows only the other lane's two `ValidationRulesModal.*` (RC-13). T1/T2/T5 required stubbing
`window.addEventListener` and the `__APP_VERSION__`/`__BUILD_COUNT__`/`__BUILD_SHA__` defines to get
`create.ts` to import at all, which is K4 stated as a measurement.

---

## 9. Open questions for Alfonso

1. **Where does the enum resolution live?** K4 argues `resolvers.ts` (importable, testable, next to
   the 31 existing tests) over a helper inside `create.ts` (untestable in the repo bench). Confirm,
   since it decides what Phase 2's step 2 can assert.
2. **`create parameter` and `create reference`** (§6, K6) have the same family of defect — a dropped
   non-primitive type and a missing kind restriction respectively. Fold either into this lane, or
   open a follow-up? The prompt's text covers neither explicitly.
3. **`set ... type`** (§6): reported, not fixed, per the prompt's own rule. Confirm it becomes its
   own prompt rather than growing this one.
4. **The acceptance criterion's last line.** The prompt's reproduction expects `create attribute
   broken in Animal type Nope` to fail with `Unknown type 'Nope' ...`. Today that line **succeeds**
   and creates an EString attribute. Turning it into an error is a behaviour change for any existing
   script that leaned on the silent fallback — including anything Jjodie has generated. Intended, and
   no migration/compat flag? (I read the prompt as yes, intended; flagging because it is the only
   part of the fix that can break a working script.)

---

**HARD STOP.** Phase 1 closed. No source modified. Phase 2 does not start without the go-ahead and
answers to §9.1.

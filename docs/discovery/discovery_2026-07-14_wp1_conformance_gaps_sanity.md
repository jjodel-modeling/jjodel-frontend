# WP1 Fase 0 — Sanity check before extending ConformanceValidator (Livello 0)

**Date**: 2026-07-14
**Type**: pre-implementation verification (read-only). Gate before writing any diff.
**Branch**: `alfonso-frontend-jjtl`
**Scope of edits (Fase 1+2, not this report)**: `frontend/src/model/conformance/ConformanceValidator.ts`, `ConformanceTypes.ts`, `__tests__/ConformanceValidator.test.ts` (new). Nothing else.
**Reference**: `docs/discovery/discovery_2026-07-13_validation_infrastructure.md` (Fase 1, Q1/Q7/Q8).

---

## Verification 1 — File structure current (ConformanceValidator.ts, ConformanceTypes.ts)

Both files read in full. The Fase-1 report's `file:line` anchors are still accurate on the current working tree.

`ConformanceValidator.ts` — single exported pure function `validateConformance(model: LModel, metamodel: LModel): ConformanceResult` (`:18-246`). All checks are inline blocks inside `for (const obj of objects)` (`:43`), under one outer `try/catch` (`:25-229`):

| Existing check | Lines | violationType | severity |
|---|---|---|---|
| CHECK 1 orphan (no metaclass / metaclass absent from MM) | `:51-60`, `:63-74` | `orphan_object` | error |
| CHECK 2 missing required attr (presence of value, `lowerBound>0`) | `:96-117` | `missing_required_attr` | error |
| CHECK 3 attribute primitive type | `:119-151` | `type_mismatch` (comment says `wrong_attr_type`) | warning |
| CHECK 4 reference upper bound | `:183-192` | `multiplicity_upper_exceeded` | error |
| CHECK 5 reference lower bound | `:195-204` | `multiplicity_below_min` | warning |
| CHECK 6 dangling reference | `:206-218` | `dangling_reference` | error |

Roll-up (`:231-245`): any `error`→`'errors'`; else any `warning`→`'warnings'`; else `'conformant'`; outer-catch exception→`'unknown'` with **empty** violations (`:221-229`).

ID-first metaclass lookup confirmed at `:63`: `mmClassById.get(metaClass.id) || mmClassByName.get(metaClass.name)`.

`ConformanceTypes.ts` — violation shape confirmed:
- `ConformanceViolation` (`:38-45`): `{ objectId, objectName?, violationType, severity, message, metamodelElementName? }`.
- `violationType` is a **closed inline union** at `:41`: `GuardViolationType | 'orphan_object' | 'missing_required_attr' | 'multiplicity_below_min' | 'dangling_reference'` (where `GuardViolationType` (`:5-8`) supplies `'multiplicity_upper_exceeded' | 'class_not_in_metamodel' | 'type_mismatch'`).
- `ViolationSeverity = 'error' | 'warning'` (`:36`) — only two levels, no `info`.

**Consequence for the additive change**: the 6 new violationType strings must be appended to the `ConformanceViolation.violationType` inline union at `ConformanceTypes.ts:41` — **not** to `GuardViolationType` (those belong to the preventive guards / `ConformanceGuard.ts`, which is out of scope and must not be touched). No existing value renamed. The `type_mismatch` vs `wrong_attr_type` comment/value mismatch is left as-is per WP1.

## Verification 2 — Inheritance-awareness

**The existing checks ARE inheritance-aware.** They iterate `classInMM.allAttributes` (`:77`) and `classInMM.allReferences` (`:78`), which are the inheritance-inclusive accessors:
- `LClass.get_allAttributes` (`LModelElement.tsx:2992`) = `arrayMergeInPlace(ownAttributes, inheritedAttributes)`.
- `LClass.get_allReferences` (`:2995`) = own + inherited.
- `get_inheritedAttributes` (`:2977`) / `get_inheritedReferences` (`:2981`) = `get_extendsChain(...).flatMap(sc => sc.ownAttributes / sc.ownReferences)`.
- `extendsChain` (`:2730`) = full super-class closure; backed by `get_superclasses` (`:3642`) which includes cycle handling (`allExtends`/`get_allExtends` `:3656-3657`).

⇒ New checks 7–11 will use the **same** `allAttributes`/`allReferences` for consistency, so they are inheritance-aware by construction. **No modification to the existing 6 checks is required or intended.** (If a change to them were ever needed → stop-and-ask, per WP1; not the case here.)

Inheritance APIs available for the new checks:
- **Kind-of (check 8)**: `LClass.extendsChain` (`:2730`) — a plain `LClass[]` property (super-class closure). Membership test `objMeta.id === target.id || (objMeta.extendsChain||[]).some(sc => sc?.id === target.id)` gives reflexive+transitive is-a. Diamond duplicates in `extendsChain` are irrelevant to a membership test (no dedup needed). NB: the proxy method `LClass.isExtending` (`:3597`, reflexive via `_isExtending` `orEqual=true` `:3424`) is the idiomatic runtime equivalent and is already used in the L-layer conformance path (`:6907`), but it is a proxy method unavailable on plain test fixtures — so `extendsChain` (WP1's prescribed approach) is used instead for testability.
- **Abstract (check 7)**: `LClass.abstract` — `get_abstract` (`:3136`) = `context.data.abstract`. Read from the resolved metamodel class `classInMM`.
- **Reference target type (check 8)**: `ref.type` — `LStructuralFeature.get_type` (`:1374`); `// target!: LClass[]; replaced by type` (`:3929`). Already used for attributes in CHECK 3 (`attr.type?.name`).
- **Enum literals (check 10)**: `attr.type.isEnum` (`LClassifier` `:1655`, `get_isEnum` `:1690`) gates; `LEnumerator.literals` (`:1816`, `get_literals` `:4606`) yields `LEnumLiteral[]` (`:4387`), each with `.name`. This mirrors the live stale-enum logic in `ObjectNode.tsx:401-403` (`!feature.enumLiterals.some(l => l.name === feature.value)`).
- **isID (check 11)**: `LAttribute.isID` — `get_isID` (`:4311`) = `context.data.isID`; D `:4169`, L `:4228`. Confirmed no id-value uniqueness check exists anywhere today (Fase-1 Q7a).

## Verification 3 — Test runner & fixture conventions

- Runner: **vitest**. `frontend/package.json`: `"test": "vitest run"`, `"build": "vite build"`, `"typecheck": "tsc --noEmit"`. No lint script (ESLint absent — do not run).
- Template tests: `frontend/src/model/__tests__/megamodel.test.ts` and `attributeTypeInference.test.ts`. Both are **pure-function tests using plain object literals** as fixtures, deliberately avoiding framework/barrel imports to keep the node-env suite green (`attributeTypeInference.test.ts:4-7` documents this).
- **Fixture strategy for `validateConformance`**: the function performs only property reads on its `LModel`/`LClass`/`LObject`/`LValue`/`LAttribute`/`LReference` arguments (`model.objects`, `metamodel.classes`, `cls.id/name`, `obj.instanceof`, `classInMM.allAttributes/allReferences/abstract`, `obj.features`, `feat.instanceof/value/values`, `attr.lowerBound/upperBound/type/isID`, `ref.lowerBound/upperBound/type/name`). ⇒ Tests can build **duck-typed plain objects cast `as any`** (or via a small typed builder) — no real proxies, no framework import. The new check accessors (`abstract`, `extendsChain`, `type.isEnum`, `type.literals`, `isID`) are likewise plain reads satisfiable by fixture objects.
- Test dir `frontend/src/model/conformance/__tests__/` does **not** exist yet → will be created for `ConformanceValidator.test.ts`.

## Verification 4 — violationType / identifier collision grep

Global `grep -rn` over `frontend/src/` for the 6 proposed new violationType strings returns **zero** hits:
`abstract_instantiation`, `reference_target_type_mismatch`, `attr_multiplicity_upper_exceeded`, `attr_multiplicity_below_min`, `invalid_enum_literal`, `duplicate_id_value` — all free. No collision with existing identifiers/CSS/events.

Scope isolation: `git status` shows `frontend/src/model/conformance/` **clean** (no pending changes); the untracked/modified `frontend/src/jjtl/...` files belong to another task and will not be touched or staged.

---

## Gate verdict: PROCEED

All four verifications **confirm** the prompt's assumptions:
1. File structure current; additive union extension lands at `ConformanceTypes.ts:41` (not `GuardViolationType`).
2. Existing checks are inheritance-aware via `allAttributes`/`allReferences`; the inheritance surface needed by the new checks (`extendsChain`, `abstract`, `type`, `isEnum`/`literals`, `isID`) is fully accessible — no change to the existing 6 checks needed.
3. Pure-function tests with plain duck-typed fixtures are the established convention and are sufficient.
4. No violationType collisions; conformance dir is clean.

No contradiction found → **no stop-and-ask**. Proceeding to Fase 1 (implementation) and Fase 2 (tests). Hard stop before commit remains in force (visual gate by Alfonso on http://localhost:3001/).

### Design notes carried into Fase 1
- New checks hang off the **resolved metaclass**; orphan objects (CHECK 1 `continue`) never reach checks 7–11 — no cascade noise.
- Each new check wrapped in its **own local `try/catch`** (console.warn + continue) so a single check's failure cannot reach the outer catch and zero out all violations (fail-visible; stronger than the current all-or-nothing outer catch).
- **Check 8**: resolve referenced object via a new `objectById` map (built alongside the existing `objectIds` set `:38-41`); skip when target is missing (dangling → CHECK 6) or target metaclass is missing (orphan target → its own CHECK 1) or `ref.type` is undefined (unvalidatable). Kind-of via `extendsChain` membership.
- **Check 9/9b**: new `allAttributes` pass; count **non-empty** values (`!= null/undefined/''`), bounds `ub = upperBound ?? 1` (`-1` unlimited), `lb = lowerBound ?? 0`; lower guarded by `valueCount > 0` so the 0-value case stays exclusively CHECK 2's (no double-report).
- **Check 10**: `attr.type.isEnum` → valid = value ∈ `literals.map(l => l.name)`; null/empty value skipped (CHECK 2 territory); literals read from the metamodel, not a cache.
- **Check 11**: accumulate `Map<attrId, Map<value, {objId,objName}[]>>` during the loop (grouping by `attr.id` scopes uniqueness to the declaring class + all subclasses that inherit the slot, exactly the required scope); null/empty values excluded; post-pass after the main loop emits **one `duplicate_id_value` per involved instance** (so future per-node badges work), each message naming the other colliding instances.

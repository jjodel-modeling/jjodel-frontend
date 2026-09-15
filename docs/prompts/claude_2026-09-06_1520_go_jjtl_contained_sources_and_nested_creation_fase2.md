# GO Phase 2: JjTL contained source instances and nested object creation

Follows the report `docs/discovery/discovery_2026-09-06_jjtl_contained_sources_nested_creation.md` (commit `985eb7608`). The report is the reference for line numbers; where it and the original prompt disagree, the report wins. Read `CLAUDE.md` and `frontend/src/jjtl/CLAUDE.md` first.

## Decisions (ratified by Alfonso, one per open question of §9)

**D1. Semantics of `-> feature { … }`.** `feature` is the name of a feature of the enclosing target class and is resolved against the target metamodel (composition or plain reference). Inside the wrapper two forms are legal: a single creation `-> Class { … }` (SPEC §3.3) and an iteration `forall v in expr [such that …] -> Class { … }`, which is the canonical multi-element form and the one the public reference in `jjodel-docs` documents. `forall` enters `SPEC.md`. A feature name is never validated as a class.

**D2. Rule-level forms without a feature.** `forall … -> Class { … }` directly in a rule body keeps working (nine tests depend on it), but the pluralization heuristic becomes a fallback: the executor first looks for a feature of the target class whose type is `Class` (or a supertype) and, when exactly one exists, uses it; otherwise it falls back to the heuristic and emits a warning naming the inferred feature. `-> Class { … }` directly in a rule body becomes a validation error (`Object creation must be nested in a feature: -> feature { -> Class { … } }`); the silent no-op ends. This closes §F4 of the 2026-09-04 report.

**D3. R2, reference collections.** Yes. Inside a `forall`, an element `{ __ref: id }` whose `id` names an object of the source array is dereferenced to that source object before the body runs, so `a.name` reads the attribute. Elements that do not resolve to a source object stay as they are (a warning per collection, not per element). The same dereference applies to `parent`. Nothing else changes in `resolveValue`: trace resolution (source to target) is untouched.

**D4. R1, enumeration.** Always. The set of instances a transformation sees must not depend on which rules are written. `ProjectEditor.tsx` builds the source array from `allSubObjects` (or `objects` plus a recursive walk of containment slots, whichever the discovery shows to be cheaper; compute it once per Execute). `bindings.source` and `bindings.data` are the full array, and this is stated in `SPEC.md` and in the internal known-limitations note as a behavioural change.

**D5. R3, write-back of contained objects.** Before writing the diff, verify `LValue.addObject` against §3.3 (does it open its own TRANSACTION?). If it does, nested creations are collected during STEP 6 and applied after its TRANSACTION, the way `DVertex.new` is deferred (`ProjectEditor.tsx:1855`); if it does not, they are applied inside. STEP 8 and 8b resolve names on the full object set, not on `lModel.objects`. Attributes of a nested object are passed to `addObject(json)` when the primitive accepts them, otherwise set in STEP 8 on the contained object. Nested objects carry the same marker as rule-level ones (`__createdBy`), and `stats.targetInstancesCreated` counts what the model receives.

**D6. Messages.** `Mapping skipped` disappears where nothing is skipped. Every path that today drops a value silently (whitelist on `allAttributes`, unresolved feature, unresolved `{__ref}`) reports a warning that names the rule, the feature and the reason.

**D7. Parser.** `forAllMapping` calls `skipNewlines` before `consume(ARROW)` (same defect class as `a4355b365`). `isValueMappingStart` and `findValueMappingColon` accept IDENTIFIER keys and values, so `type := a.type : String=VARCHAR, Integer=INTEGER, Boolean=BOOLEAN` parses; at execution an identifier key matches an enum literal by name on the source side and an identifier value resolves to a literal of the target attribute's enum, or stays a string when the target is not an enum. `name := a.name` inside a forall is already accepted: add the test that pins it.

## Waiver of rule 19 (declared)

Files to be touched, all listed here: `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/CLAUDE.md`, new tests under `frontend/src/jjtl/executor/__tests__/` and `frontend/src/jjtl/parser/__tests__/`, `docs/claude-code-log.md`. `LModelElement.tsx`, `useJjomSync.ts`, `jjodelConverter.ts` (dead import stays, rule 9) are out of scope. Anything beyond this list: stop and ask.

## Commits, in this order, each with `git add <specific files>` and a green `npm run build` plus the `src/jjtl` vitest suites

1. `fix(jjtl): enumerate contained source instances for transformation execution` (D4, plus the test that a rule on a contained class produces output and that `parent` still resolves).
2. `fix(jjtl): parser accepts newline before arrow in forall and identifier keys in value mappings` (D7, parser tests).
3. `feat(jjtl): nested object creation into target features, reference collections dereferenced in forall` (D1, D2, D3, D6, executor tests: `-> feature { -> Class }`, `-> feature { forall }`, rule-level forall with feature lookup and with heuristic fallback, rule-level `-> Class` rejected, `{__ref}` dereference).
4. `feat(jjtl): write back nested objects as contained DObjects` (D5, the ProjectEditor part; end-to-end check on the `ERDLanguage` project: 3 Table with 3, 2, 2 Column each, `isPrimaryKey` true on `id2` and `id3`, `type` mapped to `SqlType` literals, 2 ForeignKey resolved).
5. `docs(jjtl): SPEC and known limitations for forall, feature wrappers and contained sources` (D1, D4).

Hard stop after commit 4 for visual verification on http://localhost:3000 by Alfonso (Execute on `People`, open the generated model, tree and Data Manager show the columns under their tables); commit 5 and the log entry follow the confirmation.

## Out of scope, recorded

- The log entry of 2026-09-04 citing `1c567930d` stays as it is (add-only, §21); the correct SHA `a4355b365` is recorded in the discovery report.
- `convertResultToJjodel` stays imported and unused.
- Public documentation (`jjodel-docs`, `languages/jjtl.md`) is updated from the project chat after this work lands.

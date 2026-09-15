# JjTL executor: contained source instances and nested object creation

Two-phase task. Phase 1 is read-only discovery with a mandatory report; hard stop before Phase 2.
Read `CLAUDE.md` first. Touch only the files listed in "Perimetro"; no opportunistic refactoring, no renaming of existing identifiers.

## COSA (symptom, reproduced twice on beta.jjodel.io v3.0.0-beta, project `ERDLanguage`)

Source metamodel `ERD`: `Entity` (`ownedAttributes : Attribute [0..*]`, composition), `Attribute` (`type : Type`, `isKey : EBoolean`), `Relationship` (`left`, `right : Entity`, `cardinality`). Target metamodel `Relational`: `Table` (`columns : Column [0..*]`, composition), `Column` (`name`, `type : SqlType`, `isPrimaryKey`), `ForeignKey` (`source`, `target : Table`). Source model `People`: 3 Entity, 7 Attribute (contained), 2 Relationship.

1. A rule `Attribute -> Column { name := name }` produces nothing. Trace: `Source class 'Attribute' has no instances in the source model.` The seven Attribute instances exist (the canvas shows them); they are contained in the entities, not roots.
2. The documented nested creation

   ```jjtl
   Entity -> Table {
       name := name
       -> columns {
           forall a in ownedAttributes -> Column {
               -> name : a.name
               -> isPrimaryKey : a.isKey
           }
       }
   }
   ```

   validates with no problems but Trace reports `Target class 'columns' not found in target metamodel (object creation in Table). Mapping skipped.` Same warning without the `forall`. The variant `-> Column { name := "id" }` written directly in the Table body runs silently and creates no Column. `Entity -> Table` and `Relationship -> ForeignKey` (with `source := left`, `target := right` resolved through the trace) work correctly.

## DOVE (findings from a first read, to be confirmed in Phase 1)

- `frontend/src/components/project/ProjectEditor.tsx` ~1447-1460: the source data handed to the executor is built from `sourceModel.objects`. In `frontend/src/model/logicWrapper/LModelElement.tsx` ~5662 `get_objects` returns only `context.data.objects`, the root objects of the model; `get_allSubObjects` (~5793) returns every object including contained ones, and `LProject.get_objects` in `frontend/src/joiner/classes.ts` ~3512 already uses `allSubObjects`. This is the cause of symptom 1.
- `frontend/src/jjtl/executor/executor.ts`: `checkBody` (~566-584) validates `objectCreation.targetClass` against the target metamodel classes, so `-> columns {` (a feature name, per the JjTL Reference in the docs) is rejected as a class. The grammar (`objectCreation = '->' IDENT? '{' mappingBody '}'`) does not distinguish a feature name from a class name. `executeForAllMapping` (~1650-1720) attaches results to a property named after the target class lowercased plus `s` (`columns` for `Column`, by coincidence), with a comment saying the caller handles placement. `executeObjectCreation` (~1549) builds plain objects with `__type`/`className`; how they are turned into contained DObjects of the target model (`jjodelConverter.ts` `convertResultToJjodel`, ~354) is to be verified.
- Parser: inside a `forall` block, `name := a.name` fails with `Expected source attribute name`; only `-> name : a.name` parses; `->` must be on the same line as `forall … in …` (a newline before it gives `Expected '->' for object creation`); a value mapping after the conversion form (`-> type : a.type : String=VARCHAR, …`) does not parse. Locate these in `frontend/src/jjtl/parser/`.

## COME

### Phase 1: discovery (read-only)

1. Confirm the data path from `ProjectEditor.tsx` to `executor.execute` and whether `allSubObjects` (or `objects` plus recursive containment) is the right source; check that contained objects carry `_containerId`/`parent` so `parent` keeps working and cross-type resolution of contained sources works in Pass 2.
2. Trace how `-> feature { … }`, `-> Class { … }` and `forall … -> Class { … }` are parsed (AST node, `targetClass` field) and executed, and how nested results become DObjects placed in a containment feature of the target instance (`convertResultToJjodel`). State precisely which of the three forms is meant to work according to the code, and which the docs describe.
3. Check the parser limits listed above and whether they are known (search `docs/` and tests under `frontend/src/jjtl/**/__tests__`).
4. Write the report to `docs/discovery/discovery_2026-09-06_jjtl_contained_sources_nested_creation.md`: goal, files read (full paths), findings with line references, dependencies and risks (in particular: enumerating contained objects changes which instances every existing transformation sees; a rule on a contained class that was silently empty will now produce output), open questions. Hard stop: do not edit code before the go-ahead.

### Phase 2: implementation (only after go-ahead)

Expected shape, to be confirmed by the report:

- Source instances: enumerate all objects of the source model, contained ones included (`allSubObjects` or equivalent), in `ProjectEditor.tsx`. No change to `LModel.objects`.
- Nested creation: make `-> feature { forall … -> Class { … } }` and `-> feature { -> Class { … } }` place the created objects in `feature` of the enclosing target instance, and resolve the feature against the target metamodel (composition: create contained DObjects; plain reference: set the pointer). Do not validate a feature name as a class. Keep `-> Class { … }` at rule level as it is, or reject it with a clear message; no silent no-op.
- Parser: accept `name := a.name` inside a forall block, or document the conversion form only; accept the value mapping after the conversion form or give a parse error that names the limitation.
- Tests: one executor test per symptom (contained source instances; nested creation into a composition feature; forall into a composition feature), plus a parser test per accepted form.
- Update `docs/` JjTL reference and known limitations accordingly (in `jjodel-docs` this is `src/content/docs/languages/jjtl.md`; here only the internal docs).
- `npm run build` and the vitest suites for `src/jjtl` must pass. Commit per symptom, conventional messages in English, `git add <specific files>` only.

## Perimetro

`frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/executor/jjodelConverter.ts`, `frontend/src/jjtl/parser/**`, tests under `frontend/src/jjtl/**/__tests__`, `docs/discovery/`, `docs/claude-code-log.md`. Anything else requires asking first. `LModelElement.tsx` and `useJjomSync.ts` are out of scope.

## RIFERIMENTI

- Reproduction material and observed messages: `docs/prompts/` neighbour file `jjtl_repro_2026-09-06/` is not in the repo; the project `ERDLanguage` on beta.jjodel.io (account of Alfonso) holds metamodels, model and transformation `ER_to_Relational` ready for Execute.
- Documented syntax: jjodel-docs `src/content/docs/languages/jjtl.md`, sections "Object creation", "forall in mappings", "Known limitations".
- Log entry in `docs/claude-code-log.md` at the end of each phase.

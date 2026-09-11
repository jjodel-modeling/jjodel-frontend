# Discovery: name-based element resolution and its scope across the codebase

Date: 2026-09-11
Type: discovery (read-only, no source changes)
Depends on: the JjScript target-resolution fix (`7bacbd63c` and its follow-up on `validation-skeleton`); read `docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md` first, it already covers JjScript and must not be redone.

Read `CLAUDE.md` and `docs/claude-code-log.md` before starting.

## COSA (what)

Design question under evaluation: can a project hold two metamodels that each define a class (or enum, or package) with the same name, with every tool in the platform behaving correctly? The intended design is: names unique within a metamodel, free across metamodels; every name-based lookup receives an explicit scope (the current metamodel by default); an unqualified name resolves in the scope, a qualified name `Metamodel.Element` resolves anywhere; a project-wide lookup that finds more than one candidate fails with an ambiguity error listing the qualified names.

This discovery produces the inventory that makes the cost of that design measurable. It answers four questions:

1. Where does the codebase resolve a model element by name (as opposed to by pointer/id)?
2. What scope does each lookup use today: one metamodel, one package, the whole project, or none (first match across everything)?
3. Which consumer owns each lookup: JjScript, JjTL, JjEL, Jjodie prompts/parsers, UI components (ProjectEditor, panels, editors, viewpoints), validation (`nameUniqueness.ts` and any other rule), import/export (Ecore, JSON), tests.
4. What is the current uniqueness rule: does `nameUniqueness.ts` (and anything else) enforce unique names per metamodel or per project, for which element kinds, and as error or warning?

No code is changed. No file outside `docs/discovery/` is written.

## DOVE (where)

Whole `frontend/src` tree. Start from these entry points, then widen by grep:

- `LModelElement.tsx`: `_impl_getByName` (line ~5869 on the current branch) and every other `getByName`, `findByName`, `byName` style accessor; the flat collections on `LModel` (`attributes`, `classes`, `enumerators`, `references`, `packages`) and who reads them for name matching.
- `frontend/src/jjscript/executor/resolvers.ts`: already documented; list only its two public entry points with their current scope and cross-reference the existing report.
- `src/jjtl/`: how source and target metamodel elements are referenced in transformation rules, parser and executor; whether qualification by metamodel exists in the grammar.
- JjEL: how identifiers resolve to classes/attributes/references (parser, evaluator, completion provider if any).
- `src/ai/`: everywhere Jjodie serializes element names into prompts or parses them back from responses.
- UI: `ProjectEditor` and every component that calls a name-based accessor on `LModel` (the project notes state ProjectEditor "finds by NAME"); viewpoints/views matching elements by name; any `find(e => e.name === ...)` or `.name.toLowerCase()` comparison on model elements.
- Validation: `nameUniqueness.ts` (line ~513 on the current branch) and any other rule comparing names.
- Import/export: Ecore (EPackage nsURI/nsPrefix handling), JSON project serialization, anything that reconnects references by name on load.

Grep patterns to run at minimum (report the count per pattern before filtering): `getByName`, `findByName`, `byName`, `.name ===`, `.name.toLowerCase()`, `name.toLowerCase() ===`, `find(`+`name`, `nameUniqueness`, `nsURI`, `qualifiedName`, `fullName`.

## COME (how)

1. Run the greps, record raw counts, then read each hit in context. Discard hits that are not about model elements (UI labels, file names, user names) and say how many were discarded and why, in one line per category.
2. For each retained site, record one row in the inventory table:
   `file:line | consumer | element kinds looked up | scope today (metamodel / package / project / none) | match rule (exact / case-insensitive / first-match) | what happens on homonyms today (wrong element / error / undefined) | change needed under the intended design (none / pass scope / qualify name / ambiguity error) | risk (low / medium / high, with the reason)`.
3. Answer question 4 explicitly with the code excerpt of the uniqueness rule and its scope.
4. Check whether any existing test constructs two metamodels with homonymous elements. If none exists, say so.
5. Where feasible without side effects, run a read-only probe under the repo's own test runner (as done in the previous discovery): build a synthetic project with two metamodels each holding a class `Person`, and call the top five most-used name-based accessors from the inventory. Report what each returns. Do not commit probe code; restore the tree byte-identical and say so.
6. Write the report to `docs/discovery/discovery_2026-09-11_name_resolution_scope.md`. Sections: objective; grep counts raw and retained; inventory table; uniqueness rule with excerpt; probe results; existing tests; grouping of sites by consumer with a count per group; risks; a cost estimate expressed as number of sites per change type (not time); open questions for Alfonso. If the table exceeds 60 rows, keep the table complete and add a one-paragraph summary per consumer above it.

**HARD STOP.** No implementation. The analysis and the decision happen in chat after the report is read. Do not propose a refactoring plan in the report beyond the per-site "change needed" column.

### Constraints

- Read-only: no source file modified, no dependency added, no branch switched. The dirty `ValidationRulesModal.*` files belong to another lane; do not touch them.
- Do not redo the JjScript analysis; reference the existing report.
- Every claim about scope must cite file and line. "Probably project-wide" is not a finding.
- Append the log entry to `docs/claude-code-log.md` (type: discovery), with prompt document name `2026-09-11 11:30`.

## RIFERIMENTI (references)

- `docs/discovery/discovery_2026-09-11_jjscript_target_resolution.md`: previous discovery, §4 command-to-kind table, §9 probe method to reuse.
- Commits `7bacbd63c` (resolver fix) and its follow-up on `validation-skeleton`: the kind-aware `selectTarget` is the model for how a scoped, exact-first lookup should look; note in the report where the same pattern could be reused as is.
- Intended design (for the "change needed" column only): unique names per metamodel; qualified name syntax `Metamodel.Element`; unqualified names resolve in the current metamodel; project-wide lookups fail on ambiguity.

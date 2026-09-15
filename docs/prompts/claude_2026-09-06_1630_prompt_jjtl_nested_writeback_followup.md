# JjTL follow-up after visual verification: two-pass form works, nested path has defects

Visual verification of `f428e1470..3d6b16e14` on http://localhost:3000 (dev server, empty local backend; project `ERDLanguage` rebuilt: ERD, Relational, model `model_1` with Person{surname, age}, Role{id key, title}, Car{id key}, hasRole Person→Role). Two transformations were executed on the same source model. Read `CLAUDE.md` and `frontend/src/jjtl/CLAUDE.md` first.

## A. Reference form (two-pass, no nesting): correct

```jjtl
transformation ER_to_Relational

from ERD
to   Relational

Entity -> Table {
    name := name
    columns := ownedAttributes
}

Attribute -> Column {
    name := name
    isPrimaryKey := isKey
    type := translateType(type)
}

Relationship -> ForeignKey {
    name := name
    source := left
    target := right
}

helper translateType(t: Type) -> SqlType { if t == "String" then "VARCHAR" else if t == "Integer" then "INTEGER" else "BOOLEAN" }
```

Validate: no problems. Execute into `Schema3`: 9 instances. Tree and canvas: Person → surname (VARCHAR), age (INTEGER); Role → id (INTEGER, isPrimaryKey true), title (VARCHAR); Car → id (INTEGER, true); `columns` holds [2], [2], [1]; the Column instances created by the rule are reparented under their Table; the helper resolves strings to `SqlType` literals; no duplicate vertices. This is the form the public tutorial will document. It must stay green: add an executor test that pins it (rule on a contained class, `columns := ownedAttributes` resolved through the trace, helper returning an enum literal by name, one-element collection).

## B. Nested form (`-> columns { forall a in ownedAttributes -> Column { … } }`): defects

Same source model, rule with `-> name : a.name`, `-> type : a.type : String=VARCHAR, Integer=INTEGER, Boolean=BOOLEAN`, `-> isPrimaryKey : a.isKey`. Validate: no problems. Execute: 8 instances.

1. **Nested objects are created and placed, but their slots are empty.** Person → `surname`, `age`; Role → `id`, `title` appear under the right Table, with the right display name, but selecting Column `id` shows `name` empty, `type` `-----EEnum` (unset), `isPrimaryKey` `No values`. D5 asked for the attributes of a nested object to be passed to `addObject(json)` or set in STEP 8: neither happened. D7 (enum resolution) cannot be judged on this path until this works.
2. **A single-element reference collection is not iterated.** Car has one attribute; Trace: `ForAll collection is not an array: object`, Car Table gets `columns [0]`. The source conversion hands a one-element `ownedAttributes` as a scalar `{__ref}`. Multi-valued features must always reach the executor as arrays. Note that form A handles the same case correctly, so the defect is in the forall input path, not in the source data.
3. **Duplicate vertices on the target canvas.** `Car : Table` and `ForeignKey_3` appear twice on the canvas while the status bar counts 8 instances and the tree shows each once. Form A on the same project does not show duplicates, so the cause is in the deferred vertex creation of the nested write-back (STEP 6) plus the graph sync, not in the generic path.

## C. Seen on both forms

4. `ForeignKey.name`: the source `hasRole` has slot `name = Relationship_0` (display name `hasRole`); the target gets `name = ForeignKey_0`, which is the default name of the target instance, not the source value. The Table names are copied correctly by the same `name := name`. Probe (do not assume): does the rule write the slot and something later overwrites it with the default, or is the write skipped because the source value matches a `<Class>_<n>` pattern? Fix so that `name := name` copies whatever the source slot holds; the default name applies only when no mapping writes `name`.

## Ask

Phase 2 follow-up, same perimeter as the GO (`ProjectEditor.tsx`, `executor.ts`, `parser.ts`, tests, `SPEC.md`, `jjtl/CLAUDE.md`, log). Priority order: the test for A, then 4, then 1, 2, 3. The nested form is documented as an advanced variant, so 1 to 3 may go in a second commit; A and 4 go first.

- Test for A as described above.
- Fix 4 with a probe file under `docs/discovery/harness/` stating what was found, and an executor test on a rule-level instance whose source name slot looks like a default name.
- Fix 1 with an executor test that asserts the slot values of a nested object (string, enum literal, boolean) after write-back, not only its presence and container.
- Fix 2 in the forall input path (array for every multi-valued feature) with a test on a one-element collection.
- Fix 3 with vertex creation happening once per DObject.
- `SPEC.md`: state that `feature := <collection of source objects>` resolved through the trace is the canonical way to fill a containment feature, and that `-> feature { forall … }` is the alternative for targets that have no source counterpart.
- Re-run both forms on the dev server and report what the tree and the Column/ForeignKey properties show; hard stop for Alfonso's visual confirmation before the log entry.

## Out of scope here, to be opened as todos

- JjScript `create attribute x in C type <Enum> [1]` yields `EString [0..1]`: enum types are not resolved and the multiplicity is ignored for attributes (references honour `[1]`).
- JjScript `delete name force` typed in M1 context (bound to `model_1`) deleted the M2 attribute `NamedElement.name`.
- Data Manager draft on this build: `An element named «id» already exists here` when creating `Car.id` while `Role.id` exists (uniqueness across containers); on beta the same project holds `Role.id`, `Car.id` and `Department.id`. Tutorial 3 depends on the beta behaviour.
- Viewpoint menu → Data manager on a second model opens the Data Manager of the first model.

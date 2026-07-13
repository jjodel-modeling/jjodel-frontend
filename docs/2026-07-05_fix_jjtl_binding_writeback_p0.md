# Fix JjTL binding write-back (P0): inherited attributes, orphan references, duplicate names

Read `CLAUDE.md` first and follow it. If anything in this prompt conflicts with `CLAUDE.md`, stop and report the conflict.

## COSA

Three surgical fixes in the transformation write-back path. Root cause analysis is in `docs/discovery/2026-07-05_jjtl_binding_audit.md` (findings F1, F2, F5). Three atomic commits, one per fix.

1. **F1**: the attribute whitelist in STEP 6 uses `targetClass.attributes` (own attributes only). Bindings on attributes inherited from a superclass are silently dropped. Use `allAttributes` instead.
2. **F2**: STEP 8b (reference writing) is nested inside `if (pendingAttributeSets.length > 0 && createdModelId)`. A transformation producing only references never writes them. Make the block fire when there are pending references too.
3. **F5**: STEP 6 creates DObjects with `objectName = instanceData.name || ...` without deduplication; STEP 8/8b then look objects up by name. Duplicate bound names route attributes and references to the wrong object. Deduplicate `objectName` at creation time.

## DOVE

Single file: `frontend/src/components/project/ProjectEditor.tsx`, inside `handleExecuteTransformation` (roughly lines 1255-1830). Do not touch any other file. Do not touch the executor.

## COME

### Commit 1 (F1)

At ~line 1623:

```ts
const domainAttrNames = new Set(
    (targetClass.attributes || []).map((a: any) => a.name).filter(Boolean)
);
```

Replace `targetClass.attributes` with `targetClass.allAttributes`. `LClass.allAttributes` returns own + inherited attributes (see `get_allAttributes`, `model/logicWrapper/LModelElement.tsx:2991`). Keep the `|| []` guard.

Commit: `fix: include inherited attributes in transformation write-back whitelist`

### Commit 2 (F2)

At ~line 1722 the guard is:

```ts
if (pendingAttributeSets.length > 0 && createdModelId) {
    setTimeout(() => { ... STEP 8 ... STEP 8b ... }, 1000);
}
```

Change the guard to:

```ts
if ((pendingAttributeSets.length > 0 || pendingReferenceSets.length > 0) && createdModelId) {
```

Do NOT restructure the inner code: STEP 8 already iterates `pendingAttributeSets` (empty array is a no-op) and STEP 8b already has its own `if (pendingReferenceSets.length > 0)` check. The one-line guard change is sufficient and keeps the diff minimal.

Commit: `fix: write transformation references even when no attribute bindings exist`

### Commit 3 (F5)

In STEP 6 (~line 1599), `objectName` is derived from `instanceData.name` with no uniqueness guarantee. Add a local dedupe:

- Before the `result.targetModel.instances.forEach(...)` loop, create `const usedObjectNames = new Set<string>();`.
- Where `objectName` is computed, if the name is already in the set, append a numeric suffix (`_2`, `_3`, ...) until unique; log a `console.warn` mentioning the original name. Add the final name to the set.
- No other change: `DObject.new` receives the deduplicated name, `pendingAttributeSets`/`pendingReferenceSets`/`sourceIdToObjectName` already use `objectName` so they stay consistent automatically.

Note: the bound `name` ATTRIBUTE (if the target class has a domain attribute called `name`) is written in STEP 8 from `instanceData.name` via `pending.attributes` and will still hold the original duplicated value. That is intended: only the D-layer object name is deduplicated for lookup reliability. Be aware that `setValueAtPosition` has a side effect syncing a feature literally named `name` back to the D-layer name (see `LModelElement.tsx:7521`); this is acceptable because it happens after each object's own lookup, but verify in testing that attributes still land on both objects.

Commit: `fix: deduplicate DObject names in transformation output to keep name-based lookup reliable`

### Verification (before any commit)

1. `cd frontend && npm run build` must pass with no NEW errors (baseline: 26 pre-existing tsc errors).
2. Grep check: no new identifiers introduced except the local `usedObjectNames`; confirm with `grep -rn "usedObjectNames" frontend/src` that the name is not already in use.

### HARD STOP

After the three commits are prepared locally, STOP. Do not push. Alfonso runs the visual gate on http://localhost:3001/:

- Transformation with a binding on an inherited attribute: value must appear on the target object.
- Transformation with only reference bindings (no attribute bindings): edges must appear in the generated model.
- Transformation producing two objects with the same bound name: both objects must receive their own attributes.

After visual confirmation, update `docs/claude-code-log.md` with one entry per commit (type `fix:`), newest at top.

## RIFERIMENTI

- Audit: `docs/discovery/2026-07-05_jjtl_binding_audit.md` (F1, F2, F5, with line references).
- Whitelist: `ProjectEditor.tsx:1623`. Guard: `ProjectEditor.tsx:1722`. STEP 8b: `ProjectEditor.tsx:1777`. objectName: `ProjectEditor.tsx:1599`.
- `LClass.get_attributes` (own only): `model/logicWrapper/LModelElement.tsx:3281`. `get_allAttributes`: line 2991.
- `DObject.new` uses the explicit name as-is (no dedupe): `model/logicWrapper/LModelElement.tsx:5734`.
- Scope discipline: only `ProjectEditor.tsx`, minimal diffs, `git add frontend/src/components/project/ProjectEditor.tsx` (never `git add .`).

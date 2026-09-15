# Fix JjTL binding value fidelity (P1): enum literals, multi-valued attributes, partially resolved references

Read `CLAUDE.md` first and follow it. If anything in this prompt conflicts with `CLAUDE.md`, stop and report the conflict. Execute AFTER `2026-07-05_fix_jjtl_binding_writeback_p0.md` has been committed.

## COSA

Three surgical fixes on how binding VALUES survive the pipeline. Root cause analysis in `docs/discovery/2026-07-05_jjtl_binding_audit.md` (findings F3, F7, F8). Three atomic commits.

1. **F3**: enum attribute values stored as Pointers to `DEnumLiteral` get wrapped as `{ __ref }` on the read side, then fail-open to `null` in the executor (no rule matches an enum literal). Resolve them to the literal name string at read time.
2. **F7**: STEP 8 always writes `feature.value = attrValue`; an array value for a multi-valued attribute ends up stored inside `values[0]`. Route arrays to `feature.values`.
3. **F8**: in the executor, an array of references where at least one element resolves to `null` (target type without a rule) is never wrapped as `__ref_result`, so the whole reference is silently lost. Filter nulls with a warning before wrapping.

## DOVE

- F3, F7: `frontend/src/components/project/ProjectEditor.tsx` (`handleExecuteTransformation`).
- F8: `frontend/src/jjtl/executor/executor.ts` (`wrapIfTargetReference`).

No other files.

## COME

### Commit 1 (F3), ProjectEditor.tsx

The wrapper at ~line 1248:

```ts
const wrapIfRef = (val: any): any => {
    if (typeof val === 'string' && val.startsWith('Pointer')) return { __ref: val };
    return val;
};
```

Before wrapping, check whether the pointer targets a `DEnumLiteral`; if so, return the literal name instead of a ref wrapper:

```ts
const wrapIfRef = (val: any): any => {
    if (typeof val === 'string' && val.startsWith('Pointer')) {
        const target = (store.getState() as any).idlookup?.[val];
        if (target?.className === 'DEnumLiteral') return target.name;
        return { __ref: val };
    }
    return val;
};
```

Notes: `store` and the idlookup access pattern are already used in this file (see `_containerId` computation at ~line 1417, `freshState?.idlookup` at ~line 1456); reuse the same access style. Use the D-layer `name` (the write path resolves literal names via `lenum["@"+name]`, see `LModelElement.tsx:7216`). Do NOT try to handle ordinal-form enum values in this commit; that case is documented in the audit and left as-is.

Commit: `fix: resolve enum literal pointers to literal names when reading transformation source`

### Commit 2 (F7), ProjectEditor.tsx

In STEP 8 at ~line 1750:

```ts
const feature = (lObject as any)['$' + attrName];
if (feature) {
    feature.value = attrValue;
```

Change the assignment to:

```ts
if (Array.isArray(attrValue)) feature.values = attrValue;
else feature.value = attrValue;
```

`LValue.set_values` (`LModelElement.tsx:7534`) handles element-wise placement and trims excess positions.

Commit: `fix: write array binding values to feature.values instead of value`

### Commit 3 (F8), executor.ts

In `wrapIfTargetReference` (~line 2189), the array branch requires EVERY element to be a JjTL target:

```ts
if (value.length > 0 && value.every(el =>
    el && typeof el === 'object' && el.__createdBy === 'JjTL'
)) {
```

Before this check, split the array: keep elements that are JjTL targets, count elements that are `null` (fail-open leftovers from `resolveValue`). If there is at least one JjTL target and the remaining elements are only nulls, push a warning (`this.warnings.push(...)` naming the dropped count) and proceed to wrap the filtered array. If the array mixes JjTL targets with non-null non-target values, keep current behavior (return as-is). Arrays with no JjTL targets keep current behavior.

Keep the existing dedupe-by-`__sourceId` logic on the filtered array.

Commit: `fix: wrap partially resolved reference arrays instead of dropping them`

### Verification (before any commit)

1. `cd frontend && npm run build`: no NEW errors over the 26-error baseline.
2. Grep check before introducing any new identifier name.

### HARD STOP

After the three commits are prepared locally, STOP. Do not push. Visual gate for Alfonso on http://localhost:3001/:

- Source model with an enum attribute set via the Properties dropdown: enum value must appear on the target after transformation.
- Multi-valued attribute binding: values must appear as separate entries, not a nested array.
- Multi-valued reference where one target type has no rule: the resolvable references must survive, with a warning in the execution result.

After visual confirmation, update `docs/claude-code-log.md` (one entry per commit, newest at top).

## RIFERIMENTI

- Audit: `docs/discovery/2026-07-05_jjtl_binding_audit.md` (F3, F7, F8).
- `wrapIfRef`: `ProjectEditor.tsx:1248`. STEP 8 write: `ProjectEditor.tsx:1750`. `wrapIfTargetReference`: `executor.ts:2189`. `resolveValue` null push: `executor.ts:2252`.
- Enum literal resolution on read: `LModelElement.tsx:7216`. `LValue.set_values`: `LModelElement.tsx:7534`.
- Scope: `git add` only the two named files, never `git add .`.

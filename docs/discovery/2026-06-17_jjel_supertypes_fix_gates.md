# Discovery — Phase 1 gates for JjEL `superTypes`-as-objects fix (Option C)

**Date**: 2026-06-17 19:00
**Branch**: `alfonso-frontend-jjtl`
**Type**: discovery (read-only) — Phase 1 gate, zero code changes
**Parent**: implements decision in prompt "Fix — JjEL `superTypes` as shared class objects (Option C)". Root cause established in `docs/discovery/2026-06-17_jjel_supertypes_resolution.md`.
**Scope of Phase 2 (for reference)**: `frontend/src/jjscript/executor/commands/eval.ts` + `frontend/src/jjel/evaluator/evaluator.ts` only.

---

## Gate 1 — consumers of `.superTypes` (blast radius)

Full `src/` sweep for `.superTypes` reads. **Conclusion: changing the eval-shell `superTypes` from `string[]` to shell-object[] breaks no existing consumer.** The shell built by `shallowClassToJjelValue` is consumed only by the JjEL evaluator on the `classes` variable; it does not escape `buildEvalContext`. Every other `.superTypes` site is a *different* structure.

| file:line | reads what | assumes `string[]`? | impact |
|-----------|-----------|---------------------|--------|
| `jjel/evaluator/context.ts:84`, `:94` | `objTypeInfo.superTypes.includes(typeName)` where `objTypeInfo = TypeRegistry.types.get(name)` — a registered `TypeInfo` (`context.ts:53-57`, `superTypes?: string[]`) | yes (`.includes`) | **none** — `TypeRegistry` metadata, *not* the metamodel class shell. Independent object. Untouched by Phase 2. |
| `jjscript/executor/commands/show.ts:303` | `cls.superTypes?.map((s:any) => s.name || s)` where `cls` is the `show`-command element from `generateElementInfo` (an L-proxy / model element, not the eval shell) | no — defensive (`s.name \|\| s` handles both object and string) | **none** — separate command path; already object-safe. |
| `jjscript/executor/commands/show.ts:76` | `info.details.superTypes \|\| []` — the *output* of `show.ts:303` (already normalized) | consumes strings | **none** — downstream of the defensive map. |
| `jjscript/services/JjScriptService.ts:300-301` | `data.superTypes.length`, `data.superTypes.join(...)` where `data` is the `show` command *result* | yes | **none** — `data` is the `show` output (strings via `show.ts:303`), not the eval shell. |
| `jjscript/executor/commands/set.ts` (`:163`,`:197`), `remove.ts:236`, `help.ts:245`, `JjodieRagService.ts:743-744`, `parser.test.ts:245` | JjScript `set/remove` command grammar + help/RAG doc text | n/a | **none** — command-name strings / docs, not shell reads. |

**Forced migrations: none.** No internal consumer depends on the eval shell's `superTypes` being a name list. The `superTypeNames` parallel-field escape hatch is therefore unnecessary; default to the clean type change. (If desired for external/console ergonomics, a `superTypeNames` could be added cheaply, but no code requires it.)

---

## Gate 2 — shell build ordering (is it two-pass?)

Trace of `buildEvalContext` (`eval.ts:93-189`) and `shallowClassToJjelValue` (`:339-392`):

- `eval.ts:118` — `classes = metamodel.classes` (L-proxies).
- `eval.ts:119` — `classJjelValues = classes.map(cls => shallowClassToJjelValue(cls))`. **All shells are created here, in one pass.** Inside `shallowClassToJjelValue`, `superTypes` is filled *at creation* (`:354-362`) by reading `cls.extends` (resolved `LClass` proxies) and pushing `s.name` — it references only the L-proxy, never sibling shells.
- `eval.ts:120` — `variables['classes'] = classJjelValues` (the array the evaluator sees).
- `eval.ts:122-126` — `classByName: Map<string, shell>` built from `classes[i].name → classJjelValues[i]`. **These are the same shell instances** as in `classes` (identity holds; `classByName.get(name) === classJjelValues[i]`). Name is the key, matching how the shell stores `name` (`:365`).
- `eval.ts:128-189` — later passes build instances and (Pass 4, `:158-189`) mutate shells to populate `instances`/`allInstances`. Note Pass 4 already reads `cls.allSubclasses` from the **L-proxy** (`:169`) for subclass *names* — confirms the L closure works and is the precedent for deriving inheritance from the L side.

**Findings:**
1. All class shells exist before `classByName` is built (`:119` precedes `:122-126`), and `classByName` holds the identical instances. ✓
2. But `superTypes` is currently populated **inside** `shallowClassToJjelValue` at creation time (`:354-362`) — *before* `classByName` exists and before sibling shells are guaranteed built. **Eager object-linkage wiring at creation is therefore impossible**: it would need to resolve supertype names to shells that may not yet exist / a map not yet built.
3. **Clean seam for Phase 2**: a new linking pass inserted **after `eval.ts:126`** (after `classByName` is complete). For each `i`: read supertype names from the L-proxy `classes[i].extends` (`.map(s => s.name)`), resolve each via `classByName.get(name)`, and (a) set `classJjelValues[i].superTypes` to the resolved shells (skip unresolved names — never push `undefined`), (b) push `classJjelValues[i]` into each resolved supertype shell's `subTypes`. In `shallowClassToJjelValue`, initialize `superTypes: []` and add `subTypes: []` so every shell has the fields with stable shape before pass B runs.

So: the build is **multi-pass already**, but `superTypes` is filled in the creation pass. Phase 2 must **defer** `superTypes` population to a new post-`classByName` linking pass and add the inverse `subTypes` there.

---

## Gate 3 — closure dedup / cycle safety

`getAllSuperclasses` (`evaluator.ts:544-567`) and `getAllSubclasses` (`:572-590`).

- **`isJjelObject` accepts a shell**: `isJjelObject` (`context.ts:42-44`) = `value !== null && typeof === 'object' && !Array.isArray && !isJjelFunction`. A class shell is a plain non-array, non-function object (carries `className:'DClass'`, `__type:'Class'`). It passes. The recursion guard at `evaluator.ts:554` (`if (parent && isJjelObject(parent))`) admits shells. ✓
- **A `visited` set already exists**, but it is keyed unsafely for shells:
  ```js
  const parentId = (parent.id as string) ?? String(parent);   // :556 (sub: childId :584)
  if (!visited.has(parentId)) { visited.add(parentId); ... }
  ```
  **Critical**: the class shell has **no `id` field** (`shallowClassToJjelValue` returns `name, className, isAbstract, …, superTypes, instances, …, __type` — no `id`; grep confirms `id:` only on attribute shells `:404` and instance shells `:480`, never the class shell). So `parent.id` is `undefined` → the key falls back to `String(parent)` = `"[object Object]"` **for every shell**. All distinct supertypes collapse to a single visited key → after the first parent, every other parent (and every diamond re-entry) is wrongly treated as visited → the closure is truncated to a single branch.

  UML2 inheritance is a heavy diamond DAG (`NamedElement`, `Element` reached via many paths), so this would produce a badly incomplete `allSuperclasses` even once `superTypes` carries objects.

**Phase 2 requirement (Gate 3):** replace the `id`/`String(parent)` dedup key with **object identity** — e.g. a `Set<JjelValue>` (or `Set<object>`) keyed by the shell reference itself, `if (!visited.has(parent)) { visited.add(parent); … }`. Identity is robust because Gate 2's linking pass wires the *same shared shell instances* (so the same class is always the same object). Keying by `name` is an acceptable alternative (shells have unique names within a metamodel — `classByName` already assumes this), but identity is preferred and matches the prompt's "dedup by identity". Apply symmetrically to `getAllSubclasses` over `subTypes`.

---

## Additional Phase-2 observation (flagged, not a blocker)

The class switch (`evaluator.ts:472-498`) also has **direct** accessors `superclass`, `superclasses`, `subclass`, `subclasses` that read the *same dead fields* (`obj.extends ?? obj.father ?? obj.extendedBy` and `obj.subclasses ?? obj.children ?? obj.extendedBy`). After the fix these would remain broken (always `null`/`[]`) unless repointed to `superTypes` / `subTypes`. They are not in the verification battery, but they are in the same file and the same bug class. **Recommendation**: repoint them to `superTypes`/`subTypes` in Phase 2 for consistency (low risk, same file, no new surface). Flagging for Alfonso's call — say if these should stay out of scope.

---

## Readiness statement

**Eager object-linkage wiring is not safe** at shell-creation time (Gate 2: `classByName` and sibling shells do not yet exist when `superTypes` is currently filled). The fix must **defer** supertype/`subTypes` wiring to a new linking pass inserted after `eval.ts:126`, operating over the shared shell instances held by `classByName` (identity preserved). With that pass in place, the evaluator closures can read `obj.superTypes` / `obj.subTypes` directly — provided the dedup is switched to **object identity** (Gate 3: the current `id`-based key collapses all shells because class shells carry no `id`). **Gate 1 forces no consumer migrations** (the only `.includes`-style consumer is `TypeRegistry` metadata, an independent structure; the `show` path is already object-safe). Phase 2 is therefore well-bounded to the two named files, with three concrete edits: (eval.ts) defer + add linking pass for `superTypes`/`subTypes` over shared shells; (evaluator.ts) point `getAllSuperclasses`/`getAllSubclasses` at `superTypes`/`subTypes` with identity-based `visited`, add `extends` (and optionally `subTypes`) alias case, and — pending Alfonso's nod — repoint the `superclass(es)`/`subclass(es)` direct cases.

**HARD STOP** — awaiting go-ahead for Phase 2.
</content>

# model / L-layer — D-L proxy working rules

Loaded only when working under `frontend/src/model/`. Moved verbatim out of the root `CLAUDE.md`
(§3.6, §3.7, §3.8, §3.12, §3.13, and the whole of §9) on 2026-09-18 (P-2026-09-18-1930 Phase 1): D
and L layer semantics and L-proxy write patterns that only matter once work is already under this
directory. §3.1 (the critical-zone file table) and §3.2 (the Layer Impact Report template) stay in
the root `CLAUDE.md` — an agent must see them *before* deciding to act, and therefore before this
module could have loaded.

---

### 3.6 entity.father vs forward-link collections

`entity.father` (backward link) is eagerly set by the parser before reducers finish merging.

Forward-link collections (e.g., `pkg.classes`, `pkg.attributes`) may be **stale immediately after parse** due to Redux reducer batching lag.

**WRONG — race condition on counters and post-parse logic**
```typescript
const classCount = pkg.classes.length;  // may be 0 even after parse completes
```

**RIGHT — backward-link iteration via idlookup**
```typescript
function countDescendantsByFather(
    idlookup: GObject,
    className: string,
    fatherIds: Set<string>
): number {
    let count = 0;
    for (const id in idlookup) {
        const e = idlookup[id];
        if (e?.className === className && fatherIds.has(e.father)) count++;
    }
    return count;
}
```

Canonical implementation: `frontend/src/components/import/buildImportSummary.ts`.

### 3.7 pkg.__raw.uri vs pkg.uri

L-layer `pkg.uri` is computed as `data.uri + "." + data.name` (concatenation).
D-layer `pkg.__raw.uri` is the direct field as parsed.

For byte-identical nsURI, use `pkg.__raw.uri` — the Ecore round-trip discipline lives in §14. For user-facing display or JjScript queries, `pkg.uri` is fine.

Both patterns coexist by design. Do not "unify" them.

### 3.8 composition vs containment

`composition` is the canonical D-layer field. `containment` is supported for
backward compatibility — it is read by Ecore/XMI I/O services, written by
JjScript `copy` commands, and parsed as a first-class option by the JjScript
parser — but do not introduce `containment` in new code. Prefer `composition`
for all new writes.

### 3.12 Identity slot ↔ instance name — slot→name is always a direct SetFieldAction

The M1 identity binding links an instance's display name (`DObject.name`) to its
`name : EString` slot. The two directions are wired asymmetrically, and that asymmetry
is load-bearing:

- **name → slot**: `set_name` (`joiner/classes.ts` `LPointerTargetable.set_name`, override
  `LModelElement.tsx` `LObject.set_name`) writes both sides — `data.name` via
  `SetFieldAction`, and the slot via the proxy assignment `nameattribute.value = val`
  (which routes through `LValue.set_value` → `setValueAtPosition`).
- **slot → name**: `LValue.setValueAtPosition` (in `LModelElement.tsx`,
  look for the method handling slot propagation) propagates
  the slot value onto `data.name` with a **direct `SetFieldAction` on `'name'`** — it does
  **not** call `set_name`.

**Invariant — never violate**: slot → name propagation must always be a direct
`SetFieldAction` on `'name'`. It must **never** be routed through `set_name`. This is
exactly why no sync loop exists: the name-side write is terminal, so the cycle
`set_name → slot write → name write → set_name → …` cannot form. Any change that makes
slot → name go through `set_name` (instead of the direct field write) reintroduces the
loop. See `docs/discovery/2026-06-17_name_slot_sync.md` §10 for the full trace.

### 3.13 L-layer proxies report the D-layer className

An L-proxy's `.className` returns the **D-layer** class name (`'DValue'`, `'DObject'`,
`'DClass'`, …) — **never** the L-name (`'LValue'`, `'LObject'`). A guard like
`lproxy.className === 'LValue'` is therefore **always false** and silently disables whatever
it protects, with no compile error and no type warning.

```typescript
if (slot.className === 'DValue') { ... }   // correct
// NOT: slot.className === 'LValue'         // always false — silently dead
```

The convention is consistent across the codebase (e.g. `setValueAtPosition`'s
`oldTarget?.className === "DObject"` on an `LObject.fromPointer(...)` result;
`proxy.ts` returns the D-name). This typo cost the entire Direction-A identity-sync effort:
the name → slot write was gated on `=== 'LValue'` and never ran. Residual dead occurrences of
the same typo remain in the base `LPointerTargetable.set_name`/`get_name`
(`joiner/classes.ts`) — dead for instances (`LObject` overrides them), pending a
consistency cleanup.

---

## 9. Object persistence patterns

These behaviors are counter-intuitive and have already cost days of debugging. Do not infer them from reading the code.

### 9.1 DObject.new() returns temporary IDs

The returned ID does not correspond to the real ID in the framework. Objects are **not** accessible via `store.getState()[dObject.id]`.

**WRONG — temporary ID, lookup fails**
```typescript
const dObject = DObject.new(classId, modelId, DModel, name, true);
store.getState()[dObject.id]; // undefined

// Also wrong: SetFieldAction does not write proxy-readable values
SetFieldAction.new(featurePointer, 'values', [value], '', true);
```

**RIGHT — find by name via LModel proxy**
```typescript
const lModel = LPointerTargetable.fromD(modelId) as LModel;
const lObject = lModel.objects.find(o => o.name === objectName);

(lObject as any)['$' + attrName].value = attrValue;
```

### 9.2 Deferred attribute setting

After a TRANSACTION that creates objects, the proxies are not immediately available. Use `setTimeout` to let Redux propagation finish:

```typescript
const pending: Array<{ objectName: string; attributes: Record<string, any> }> = [];

TRANSACTION('Create Objects', () => {
    const dObject = DObject.new(classId, modelId, DModel, name, true);
    pending.push({ objectName: name, attributes: { label: 'value' } });
});

setTimeout(() => {
    const lModel = LPointerTargetable.fromD(modelId) as LModel;
    for (const { objectName, attributes } of pending) {
        const lObj = lModel.objects.find(o => o.name === objectName);
        if (!lObj) continue;
        for (const [attr, val] of Object.entries(attributes)) {
            (lObj as any)['$' + attr].value = val;
        }
    }
}, 1000);
```

Accumulate by **name**, not by ID, inside the TRANSACTION.

### 9.3 Attribute slots and reference slots are written differently — and the wrong way is silent

`['$' + name].value = v` is the form §9.1 and §9.2 use, and it is right **for attributes**. On a
**reference** slot the same assignment does nothing: it does not throw, does not warn, and leaves
the slot at `values: []`. Measured 2026-09-09 by running the four candidate forms in sequence
against a live slot:

| form | reference slot |
|---|---|
| `slot.value = <L object>` | no error, `values` stays `[]` |
| `slot.value = <id>` | no error, `values` stays `[]` |
| `slot.values = [<id>]` | **writes** |
| `slot.setValueAtPosition(<id>, 0)` | **writes** |

```typescript
// RIGHT — reference slot, single or multi valued alike
(lObject as any)['$ownedTransitions'].values = [targetId];
(lObject as any)['$nextState'].values = [targetId];

// RIGHT — attribute slot
(lObject as any)['$isInitial'].value = true;
```

**The aggravating part is the silence.** A caller that writes a reference the attribute way builds
a model whose references are all empty and gets no signal at all. A probe written that way then
measures a state it never created: it will report whatever an empty reference implies —
a vacuously satisfied constraint, an empty fan-out, a missing edge — as if the model said so.
Measured in that same round: a probe's own reader disagreed with the JjEL evaluator about whether
the transitions had targets, and the evaluator was right.

**Clearing is the same trap, one step further.** `slot.values = []` does **not** empty a reference
slot that already holds a value, and it does not throw: the slot keeps what it had. Measured
2026-09-09 while building a fixture for the book, where a transition whose `nextState` was
"cleared" that way still pointed at its target, and the conformance check was right while the
fixture was wrong. There is no measured form that clears an already-written reference slot from
the L proxy; when a test or a probe needs an unset reference, **construct it unset** — a freshly
created object has none — rather than writing one and taking it back.

Corollary for reading, same family, and it bites in two ways:

- `slot.values` **on the L proxy returns the wrapped L objects, not the ids** — the default getter
  resolves every pointer (`__shallowSolver`). Compare with `t.id ?? t`, or read `__raw.values` when
  ids are what you need (the `pkg.uri` / `pkg.__raw.uri` asymmetry of §3.7, in another place).
- A **single-valued reference that was never set reads back as `[null]`**, not as `[]`. So
  `slot.values.length` is **1** where there is no value at all, and a guard written as
  `values.length === 0` never fires. Measured 2026-09-09: on a `Transition` whose `nextState [1]`
  had never been written, the proxy reported length 1 while `__raw.values` was empty and the
  conformance engine reported `multiplicity_below_min`. Count on `__raw.values`, filtering out the
  falsy entries, whenever the question is «is there a value».

Full measurement: `docs/discovery/discovery_2026-09-09_semaforo_end_to_end.md` §2.1 and §9 for the
write forms; `docs/discovery/harness/probe_2026-09-09_book53_conformance.mts` for the two reading
measurements and the failed clear.

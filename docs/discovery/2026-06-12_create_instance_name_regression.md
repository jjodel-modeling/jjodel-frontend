# Discovery — `create instance of <Class> "<name>"` ignores the quoted name (P0 regression)

**Date**: 2026-06-12
**Type**: Phase 1 read-only diagnosis (no code modified). HARD STOP after this report.
**Symptom**: typed `create instance of Event "testEvt"` produces a DObject displayed as **`Event_6`** (auto default). The quoted name is shadowed; subsequent `set testEvt.<attr> = …` cannot find the instance.

**Verdict (one line)**: the name **is** stored in `data.name`, but the M1 identity-binding work made the `name:EString` identity slot fall back to `DObject.initialName` (always the auto default `<Class>_<N>`) **before** `data.name`, so `get_name` returns `Event_6`. The prime suspect `0f7a75ea` is **exonerated**; the regression is the identity-binding stream — **`84d75047fe` (2026-05-26)** on top of **`729c5ce073` (2026-05-25)**.

---

## Q1 — Where exactly is the quoted name lost?

It is **not** lost in the parser, service, or executor — it is **shadowed at read time** by the identity-slot getter. Full trace:

1. **Parser** — OK. `create instance of Event "testEvt"` parks the quoted name in `options.defaultValue` (`parser/parser.ts:330-337`); confirmed by `__tests__/parser.test.ts:168-173`.
2. **Executor** — OK. `executeCreateInstance` reads it and passes it as the `name` arg (`jjscript/executor/commands/instance.ts:172-175, 222, 227-233`):
   ```ts
   const explicitInstanceName = args.options?.defaultValue?.kind === 'string' ? args.options.defaultValue.value : undefined; // "testEvt"
   const instanceName = explicitInstanceName ?? generateInstanceName(className, targetModel);
   const dObject = DObject.new(metaclass.id, targetModel.id, DModel, instanceName, true); // 4th arg = name
   ```
   `instance.ts` was **created** on 2026-05-01 (`27291bb85`) and **never modified since** — so the break is downstream of it.
3. **`DObject.new`** (`model/logicWrapper/LModelElement.tsx:5729-5739`) — applies the name to `data.name` **but** unconditionally overwrites `initialName` with the auto default:
   ```ts
   const computedDefaultName = this.defaultname(meta => (meta?.name || "obj") + "_", father, instanceoff); // "Event_6"
   if (!name) name = computedDefaultName;                 // name="testEvt" kept
   let ret = …​.DNamedElement(name).DObject(instanceoff).end();   // data.name = "testEvt"
   ret.initialName = computedDefaultName;                 // initialName = "Event_6"  ← always the default
   ```
   So after creation: `data.name = "testEvt"`, `initialName = "Event_6"`.
4. **`LObject.get_name`** (`LModelElement.tsx:5799-5801`) resolves the **identity slot first**:
   ```ts
   return (context.proxyObject as GObject)['$name']?.value || context.data.name || context.proxyObject.instanceof?.name;
   ```
5. **The identity-slot value getter** (`LModelElement.tsx:7278-7293`) — the actual culprit. When the `name:EString` slot is empty it returns the owner's `initialName` **before** `data.name`:
   ```ts
   if (!ret[0] && (dmeta?.upperBound === 1 || (!dmeta && ret.length <= 1))
       && typestr === ShortAttribETypes.EString && context.data.name?.toLowerCase() === 'name') {
       let o = DObject.fromPointer(context.data.father);
       const fallback = o && (o.initialName || o.name);   // "Event_6" || "testEvt"  → "Event_6"
       if (fallback) ret[0] = fallback;
   }
   ```

**Resolution of `get_name` for `Event "testEvt"`** (Event declares a `name:EString` attribute → the slot exists, empty):
`$name.value` → slot empty → fallback `o.initialName || o.name` → **"Event_6"** (truthy `initialName` wins) → `get_name` returns **"Event_6"**.
The explicit name in `data.name` ("testEvt") is never reached. `findInstanceByName` matches on `o.name` (`instance.ts:101-104`), so it can never match "testEvt".

> **Scope**: the bug manifests **only for metaclasses that declare a `name:EString` attribute** (the fallback guard at `:7279`). For a metaclass without a `name` attribute, `$name` is `undefined`, `get_name` falls through to `data.name`, and the explicit name still works. Most domain classes (State, Event, Transition…) declare `name`, so the failure is broadly visible.

---

## Q2 — Which commit introduced it?

**Not `0f7a75ea`.** That commit ("property tab coherence enforced", 2026-06-12) bundled the JjEL ambiguous-instance stream (`jjel/evaluator/context.ts +37`, `evaluator.ts +19`, `eval.ts +167`) and my Part A (`ChatMessages.tsx`). It touched **no** object-creation or `LModelElement` code (`git show --stat 0f7a75ea`). The `+167` in `eval.ts` is the JjScript `eval` command, off the `create instance` path.

**Regression = the identity-binding stream, in two commits:**

- **`729c5ce073` — 2026-05-25 ("anchorpoint fixes", the §6.4 scope-violation commit)** — *foundation*. Added the `initialName` field and made `DObject.new` always stamp it with the default. `git show 729c5ce073 -- …/LModelElement.tsx`:
  ```diff
  - if (!name) name = this.defaultname(meta => (meta?.name||"obj")+"_", father, instanceoff);
  + const computedDefaultName = this.defaultname(meta => (meta?.name||"obj")+"_", father, instanceoff);
  + if (!name) name = computedDefaultName;
    let ret = …​.DNamedElement(name).DObject(instanceoff).end();
  + // initialName: always the auto-generated default, regardless of the explicit `name` parameter.
  + ret.initialName = computedDefaultName;
  ```
  (Also added VersionFixer `2.217 → 2.218` to backfill `initialName`.)

- **`84d75047fe` — 2026-05-26** — *the flip*. Added the identity-slot value fallback that surfaces `initialName` for an empty `name:EString` slot (`git blame -L 7278,7293`). Before this commit, an empty `$name` slot returned empty → `get_name` fell through to `data.name`, so `create instance … "alice"` worked (the A/B-verified 2026-05-01 baseline). After it, `$name.value` returns `initialName`, shadowing `data.name`.

Both land inside the 2026-05-01 → today window; **`84d75047fe` is the commit whose behavior change produces the observed symptom**, enabled by `729c5ce073`'s always-default `initialName`.

---

## Q3 — Source of the `Element '…' not found` message and the per-line delay

The misleading error is a **downstream symptom**, not the dependency waiter. `waitForDependencies` (called from `executor.ts:96-106`) is hard-capped at **`MAX_WAIT_MS = 500`** (`jjscript/executor/elementWaiter.ts:17`) and only emits a `console.warn` — it cannot produce a 15-17s stall or the user-facing string. For a `set`, `extractDependencies` marks the target instance `required` (`dependencies.ts:77-79`), so each `set <missing>.…` line burns the full ~500ms poll window (the instance never resolves because it is named `Event_6`, not `testEvt`); the surfaced "not found" then comes from the **set command handler** (`set.ts:57` "Element not found: …" on the M2 branch, or `executeSetInstance`'s "Instance '…' not found" on the M1 branch) — i.e. a consequence of the create mis-naming, with the reporter's "15-17s/command" being the aggregate of the per-line 500ms waits (the 500ms cap means no single line waits for 15s).

---

## Q4 — Proposed minimal fix (Phase 2 candidate)

**Approach (scoped to `jjscript/executor/commands/instance.ts`, no critical-zone files):** when an explicit instance name is supplied, set the new object's `initialName` to that name right after `DObject.new`, so the identity-slot fallback (`o.initialName || o.name`) surfaces the user's name:

```ts
const dObject = DObject.new(metaclass.id, targetModel.id, DModel, instanceName, true);
if (explicitInstanceName && dObject) {
    (dObject as any).initialName = explicitInstanceName;  // align identity fallback with the explicit name
}
```

Why this is correct and minimal:
- `get_name` for an empty `name` slot → fallback `initialName || data.name` → **"testEvt"**. `findInstanceByName("testEvt")` matches; the node label shows "testEvt".
- Keeps `data.name === initialName === "testEvt"`, the same invariant the canvas path relies on (`EditorV2.tsx:607, 2253`: "Pass undefined so DObject.new owns the name → data.name === initialName").
- It mirrors `DObject.new`'s own `ret.initialName = computedDefaultName` assignment, so the same persistence mechanism applies (to be confirmed by the gate — see risk note).
- Unnamed creates are untouched (the `if (explicitInstanceName)` guard), so auto-naming is unchanged.

**Confirmation it does not alter other creation paths**: the change lives only in `executeCreateInstance`, which is reached **only** by the JjScript `create instance` command. The other creation paths do not call it:
- **Canvas drag-drop** → `syncCreateObject` (`canvasToJjom`) → `DObject.new` with `name=undefined`. Unaffected.
- **JjTL** → `ProjectEditor` deferred-attribute path → `DObject.new`. Unaffected.
- **Ecore/XMI import** → service importers. Unaffected.

**Risk note / Phase-2 verification target**: the fix relies on a direct `dObject.initialName = …` assignment persisting to the store (exactly as `DObject.new:5737` does). If the gate shows it does **not** persist (temporary-id semantics, §9.1), the fallback is a deferred `SetFieldAction` on `initialName` after re-resolving the object, or writing the `name:EString` identity slot value directly (design-pure but heavier — the just-created proxy/slot is not reliably available synchronously, §9.1/§9.2).

**Deliberately NOT chosen (critical-zone)**: fixing this inside `DObject.new` (make `initialName` respect the explicit `name`) or inside the identity-slot fallback (`:7278-7293`, prefer `data.name` when set) would be more "central" but **both are shared by every creation path** (canvas, JjTL, Ecore). Per the task's guardrail, that route requires STOP-and-report rather than silent implementation; the `instance.ts`-scoped fix above avoids it entirely.

---

## HARD STOP

Phase 1 complete. Awaiting Alfonso's go-ahead before implementing the Phase 2 fix in `instance.ts`. No files staged; this report is the only artifact.

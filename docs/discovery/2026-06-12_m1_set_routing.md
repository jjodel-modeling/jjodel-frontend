# Discovery — M1 `set <inst>.<attr>` treats the whole dotted LHS as the instance name (P0b)

**Date**: 2026-06-12
**Type**: read-only diagnosis (no code modified). HARD STOP after this report.
**Symptom**: after the P0a create-name fix (instances correctly named `off`/`ready`/`cooking`), `set off.isInitial = true` fails — the instance lookup receives the **entire dotted LHS** (`off.isInitial`) as the instance name. Typed → `Instance 'off.isInitial' not found`; Run → `Element 'cooking.isFinal' not found` (~9 s/line).

**Verdict (one line)**: `executeSetInstance` reads `args.target.raw`, which `parseQualifiedName` reconstructs as `"<inst>.<attr>"` (segments **+** member); `parseSetCommand` strips `target.member` but **not** `target.raw`, so the instance lookup gets the full dotted string. This is a **pre-existing defect, present since the M1 instance feature was created (`27291bb85`, 2026-05-01)** — **not** a regression from the identity-binding or ambiguous-instance commits. It was **masked by the P0a create-name bug** (instances were misnamed, so every `set` failed at lookup anyway) and surfaced once P0a fixed naming.

---

## Q1 — Where should the split happen, and where does it break?

End-to-end trace of `set off.isInitial = true` (typed path):

**1. Lexer** (`jjscript/parser/lexer.ts:300-358`, `364-398`) — emits **one `QUALIFIED_NAME` token** `"off.isInitial"`. Member-access consumption (`:329-344`) runs for *any* identifier followed by `.<identifier>` (independent of `::`), and `classifyIdentifier` (`:393`) tags a value containing `.` as `QUALIFIED_NAME`. So `off.isInitial` (like `alice.age`) is a single token, not `off` + `.` + `isInitial`.

**2. `parseQualifiedName("off.isInitial")`** (`jjscript/parser/grammar.ts:28-57`) — splits member off but rebuilds `raw` **with** the member:
```ts
const lastDotIndex = raw.lastIndexOf('.');          // member = "isInitial", raw → "off"
…
return { segments, member, raw: member ? `${raw}.${member}` : raw };   // raw = "off.isInitial"  ← rebuilt WITH member
```
Result: `{ segments: ["off"], member: "isInitial", raw: "off.isInitial" }`.

**3. `parseSetCommand`** (`jjscript/parser/parser.ts:529-561`) — extracts the property from `member`, then clears **only** `member`:
```ts
const target = this.parseQualifiedNameToken();   // {segments:["off"], member:"isInitial", raw:"off.isInitial"}
if (target.member) {
    property = target.member;     // "isInitial"
    target.member = undefined;    // ← member cleared; raw and segments untouched
}
…
return { command:'set', target, property, value, operator };
// args.target = {segments:["off"], member:undefined, raw:"off.isInitial"}   property="isInitial"
```

**4. Routing** — `JjScriptService.execute` resolves `level='M1'` and calls `executeCommand(..., 'M1')`; `executeSet` (`set.ts:47-49`) routes to `executeSetInstance` when `context.level === 'M1'`. (Routing is correct.)

**5. `executeSetInstance`** (`jjscript/executor/commands/instance.ts:455`) — **the break**:
```ts
const instanceName = args.target.raw;                       // "off.isInitial"  ← BUG: uses raw (segments+member)
const lObject = findInstanceByName(targetModel, instanceName);  // findInstanceByName matches o.name === "off.isInitial" → null
// → "Instance 'off.isInitial' not found — No instance named 'off.isInitial' in 'model_1'"
```
`findInstanceByName` (`instance.ts:101-104`) compares `o?.name === instanceName`; no instance is named `"off.isInitial"`, so it returns null.

**Exact mismatch**: the parser correctly *separates* instance (`target.segments = ["off"]`) from property (`property = "isInitial"`), but it leaves the **combined string in `target.raw`**, and the M1 executor reads the instance name from `target.raw` instead of `target.segments`. The split *is* computed; the executor just consumes the wrong field. (`executeDeleteInstance:306` and `executeRenameInstance:372` also read `target.raw`, but their LHS has no `.member`, so `raw === segments[0]` and they are unaffected — only `set` carries the `<inst>.<attr>` form.)

---

## Q2 — Which commit changed it?

**None of the regression-window candidates touched the set path.** `git log --since=2026-05-01` for each file:

| File | Commits since 2026-05-01 |
|---|---|
| `parser/parser.ts` | only `27291bb85` (2026-05-01) |
| `parser/lexer.ts` | **none** |
| `parser/grammar.ts` | **none** |
| `executor/commands/set.ts` | only `27291bb85` |
| `executor/commands/instance.ts` | only `27291bb85` |

So `parseSetCommand`, the lexer, `parseQualifiedName`, the `set.ts` M1 routing, and `executeSetInstance` are **byte-identical to their 2026-05-01 state**. `27291bb85` is the commit that *created* `instance.ts` and *added* the M1 routing to `set.ts` (`git show 27291bb85 -- set.ts`):
```diff
+import { executeSetInstance } from './instance';
+        // M1 routing: in an M1 model editor, 'set' targets instance values …
+        if (context.level === 'M1') {
+            return executeSetInstance(args, context, project);
+        }
```
`executeSetInstance` read `args.target.raw` from its first line of existence. **The defect was born with the M1 feature in `27291bb85`** and has never resolved an `<inst>.<attr>` LHS correctly.

The named suspects are **exonerated** for this defect — they touch unrelated files:
- `729c5ce073` / `84d75047fe` (identity binding) → `LModelElement.tsx` (the P0a naming bug), not the set parser/handler.
- `0f7a75ea` (ambiguous-instance) → `jjel/evaluator/*` + `executor/commands/eval.ts` (the JjEL `eval` command), not `set` parsing/routing.

**Why it looked like a regression**: before P0a, `create instance of X "name"` produced an auto-named instance (`X_N`), so `findInstanceByName("name")` failed for *every* `set` regardless of the split — the two bugs produced the same "not found." P0a fixed naming, unmasking this latent split defect. The 2026-05-01 "`set alice.age = 30` A/B-verified" claim cannot be reproduced on the current (unchanged) code and is most likely a pre-`27291bb85` prototype or a memory/fixture artifact — cf. CLAUDE.md §5.1 "do not trust fixtures from memory across sessions."

---

## Q3 — Run vs typed divergence and the ~9 s/line

**Same root, same branch, two reporters — not two distinct branches.** Both paths reach `executeSetInstance` (M1) and get back `result.message = "Instance '<inst>.<attr>' not found"`. The wording differs only in how each UI renders that message:

- **Typed** (Jodie chat input) → `Jodie.tsx:390` `JjScriptService.execute` → `JjScriptService.formatResultForChat` surfaces the **raw** message → `Instance 'off.isInitial' not found`.
- **Run** (ScriptBlock) → `ScriptBlock.tsx:338` `parseError(result.message, commands[i])` (`executor/errors.ts`) **normalizes** it: the `not found` branch matches `/['"]([^'"]+)['"]\s*not found/i` → `element = "cooking.isFinal"` → `createError('ELEMENT_NOT_FOUND', …)` → renders the generic **`Element 'cooking.isFinal' not found`** template. The "M2-style" wording is a *reformatter*, not a sign that the M2 branch (`set.ts:57`) ran — indeed `set.ts:57` would print `qualifiedNameToString(target)` = `"cooking"` (member already stripped), never `"cooking.isFinal"`.

**~9 s/line is not the executor's dependency waiter.** `waitForDependencies` (`executor.ts:96-106` → `elementWaiter.ts`) is hard-capped at `MAX_WAIT_MS = 500`, and `extractDependencies` marks the `set` target required (`dependencies.ts:77-79`), so the unresolvable instance burns ~500 ms/line there — but that is the ceiling. The remaining seconds originate in the **ScriptBlock chat-runner's per-line failure orchestration**: on each error it transitions to `paused`, builds an error dialog, evaluates recovery rules, and stores error state (`ScriptBlock.tsx:336-365`). No single static constant equals 9 s (`BATCH_DELAY_MS = 20`), so the exact figure is the sum of the 500 ms waiter + React pause/error-dialog/recovery render cycles per line and **needs a runtime trace to attribute precisely** — it is a UX-latency symptom of the same lookup failure, not a separate defect.

---

## Q4 — Verdict + minimal fix proposal

**Fix (single line, M1-scoped, `jjscript/executor/commands/instance.ts`)**: in `executeSetInstance`, derive the instance name from `target.segments` instead of `target.raw`:
```ts
// instance.ts:455
- const instanceName = args.target.raw;                       // "off.isInitial"
+ const instanceName = args.target.segments.join('::') || args.target.raw;   // "off"
```
`target.segments` is `["off"]` (the member was split off in `parseQualifiedName`), so `segments.join('::')` = `"off"`; the `|| args.target.raw` keeps the no-dot case (`segments` already equals `[raw]`) and any defensive empty case intact. `property` is already correctly `"isInitial"`, so the attribute/reference write downstream is unchanged.

**Optional consistency** (same commit, low risk): apply the same `segments`-based derivation to `executeDeleteInstance:306` and `executeRenameInstance:372`. They are currently correct (their LHS has no member, so `raw === segments[0]`), but switching them keeps the three handlers uniform and guards against a future `delete a.b`-shaped input.

**Rejected alternative (higher blast radius)**: fixing it in `parseSetCommand` by resetting `target.raw = target.segments.join('::')` after the member strip. That changes the parser output for **every** `set`, including M2, where `set.ts` consumes `target` via `resolveElement`/`qualifiedNameToString`; touching the shared parser risks the M2 path. The M1-only executor fix avoids that entirely.

**Critical-zone check**: **none**. `instance.ts` is the JjScript executor; the fix touches no sync/D-L file (`useJjomSync`, `canvasToJjom`, `syncState`, `portDistribution`, `classes.ts`, `VersionFixer`).

**Blast radius on M2 `set`**: **zero**. The change is inside the `context.level === 'M1'` branch (`executeSetInstance`). The M2 `set` path (`set.ts:51-133`, `resolveElement(target, …)`) is not on this code path and is untouched — it keeps working exactly as today.

**Verification (for the eventual fix gate, not part of this read-only report)**: typed `set off.isInitial = true` succeeds immediately; `set off.next = ready` (reference) links; full microwave Run completes with attribute/reference `set`s applied and edges live.

---

## HARD STOP

Diagnosis complete. No files staged; this report is the only artifact. Awaiting Alfonso before any fix.

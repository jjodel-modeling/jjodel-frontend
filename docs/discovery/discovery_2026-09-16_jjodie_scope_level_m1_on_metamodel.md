# Discovery — a Jjodie reply on a metamodel is stamped M1 and `create enum` is refused

Date: 2026-09-16
Branch: `validation-skeleton` (`/Users/alfonso/jjodel`)
Prompt: `docs/prompts/claude_2026-09-16_2249_prompt_fix_jjodie_scope_level_m1_on_metamodel.md`
Step: 1 (read-only verification). No source file touched.

## 1. Objective

Confirm or refute points 2–4 of the prompt's root cause by reading the code, census every caller of
`getActiveModel` / `getActiveMetamodel`, and say whether the proposed fix changes any of them.

## 2. Files read (full paths)

- `frontend/src/jjscript/executor/utils.ts` (318 lines, read whole)
- `frontend/src/jjscript/executor/scopeGuard.ts` (106 lines, read whole)
- `frontend/src/jjscript/executor/commands/create.ts` lines 200–270
- `frontend/src/jjscript/executor/errors.ts` lines 1–120, 361–438
- `frontend/src/jjscript/types.ts` lines 488–523 (`ExecutionContext`)
- `frontend/src/jjscript/services/JjScriptService.ts` lines 1–110
- `frontend/src/jjscript/components/ExecutionErrorDialog.tsx` (330 lines, read whole)
- `frontend/src/jjscript/components/ScriptBlock.tsx` lines 40–70, 380–500, and the `pauseInfo` census
- `frontend/src/jjscript/components/ScriptExecutionWindow.tsx` (`pauseInfo` census only)
- `frontend/src/jjscript/executor/__tests__/scopeGuard.test.ts` lines 1–60
- `frontend/src/components/Jodie/Jodie.tsx` lines 1–250
- `frontend/src/components/Jodie/JodieHeader.tsx` lines 55–140
- `frontend/src/components/Jodie/ChatMessages.tsx` lines 330–450
- `frontend/src/services/JjodieContext.ts` (`resolveMetamodelScope`, lines 88–147)
- `frontend/src/jjodie-integration/JjodieAPIImpl.ts` lines 170–210
- `frontend/src/redux/selectors/selectors.ts` lines 55–95
- `frontend/src/components/abstract/DockManager.tsx` (the five `EDITOR_TYPE_CHANGE` dispatch sites)
- `frontend/src/components/abstract/Dock.tsx` lines 330–375
- `frontend/src/components/dock/MyRcDock.tsx` lines 560–605
- `frontend/src/pages/components/Dashboard.tsx` line 263

Search discipline (CLAUDE.md §5): every census below was run with `command grep` (BSD grep 2.6.0),
not the interactive `ugrep` wrapper, so `--include` is honoured and no gitignored path is silently
skipped. Positive control on the same command: `command grep -c "export function"
jjscript/executor/utils.ts` → **9**, and the resolver census returned EXIT=0 with 44 lines.

## 3. Verdict on the prompt's points 2–4

**Point 2 — CONFIRMED.** `Jodie.tsx:139-157`: the memo calls `getActiveModel()` first (`:139`) and
only builds an M2 artefact in the `else if (activeMetamodel)` branch (`:151`). The stamp is
`level: 'M1'` whenever `getActiveModel()` answers non-null, whatever is on screen.

**Point 3 — CONFIRMED, with the exact fall-through.** With `_activeArtifactCache =
{editorType:'metamodel', modelId:<MM>}`, `getActiveModel()` (`utils.ts:126-162`) runs:

| step | line | outcome with a metamodel tab focused |
|---|---|---|
| 0. cache | `:129` | `getCachedModel(false)` → `editorType !== 'model'` → **null** (`:44`) |
| 1. dock tab | `:133-144` | active tab resolves to the metamodel, `!model.isMetamodel` false → **falls through** |
| 2. `_lastSelected` | `:146-157` | `me.model` is the M1 model of the last click → **returns it** |

So yes: any element selected in an M1 model at any earlier time makes `getActiveModel()` answer M1
while a metamodel is on screen. The cache is consulted but not obeyed.

**Point 4 — CONFIRMED.** `getActiveLevel()` (`:171-176`) trusts the cache absolutely and answers
`'M2'` on the same state. The two resolvers disagree by construction.

**Point 1 — CONFIRMED, exact lines.** The refusal is `create.ts:233-245`, `if (context.level ===
'M1')`, message `'create ${elementType}' modifies the metamodel`, `errors[0].code = 'WRONG_LEVEL'`.

**Full chain, verified end to end:** `Jodie.tsx:162-167` builds `scope = {level:'M1',
metamodelId: shown.id, modelId: <M1 model>}` → `ChatMessages.tsx:437` passes it to
`JjScriptService.execute(command, scope)` → `JjScriptService.ts:44` takes `level = scope.level =
'M1'` (no UI re-read) → `:60` `executeCommand(..., level='M1', scopeBound=true)` → `create.ts:234`
refuses. 0 commands executed, `ExecutionErrorDialog` opens on line 1. Matches the symptom exactly.

The alternative path the prompt names (reply generated on an M1 tab, run after switching) is real
and by design (V2); it produces the same dialog with the same unhelpful text.

## 4. Census of the two resolvers — and what the fix does to each

`command grep -rn --include="*.ts" --include="*.tsx" -E "getActiveModel|getActiveMetamodel|getActiveLevel|setActiveArtifactCache" .` → 44 lines, EXIT=0.
`Selectors.getActiveModel` (`redux/selectors/selectors.ts:64`) is a **different function** and is not
touched; its call sites (`SaveManager.ts:61`, `ChatMessages.tsx:349`, `common/Geom.ts` comments) are
out of this fix.

| caller | today | after the fix |
|---|---|---|
| `utils.ts:175` `getActiveLevel` cold fallback | `getActiveModel()` with all fallbacks | unchanged — cold cache keeps the fallbacks |
| `utils.ts:235` `getDefaultParent` M1 branch | `getActiveModel()` | unchanged when the cache says `model` (it resolves the cached id); returns null instead of a stale M1 model when the cache says `metamodel` — which is the bug |
| `utils.ts:256` `getDefaultParent` M2 branch | `getActiveMetamodel()` | **unreachable change**: guarded by `context.level !== 'M1'`, and `??` short-circuits when `contextMetamodel` is set |
| `utils.ts:309` `getTargetMetamodel` | `getActiveMetamodel()` | reached only for a non-bound M2 run with no `targetMetamodelId`; if the cache says `model` it now yields null → `metamodels[0]` instead of a metamodel from a stale selection. Contradictory state (level would be M1), effectively unreachable |
| `JjScriptService.ts:44-56` | `getActiveLevel` / `getActiveModel` / `getActiveMetamodel` | the three now agree; `:45` and `:56` can no longer return an artefact from the other level |
| `Jodie.tsx:139-140` (the memo) | model-first | rewritten by fix B: level first, then the one resolver for that level |
| `Jodie.tsx:191,196` (mount seed) | cold cache, both fallbacks run | unchanged (cache is null at mount) |
| `Jodie.tsx:216-217` (tab-change notice) | model-first | now agrees with the cache just stamped at `:211`; the notice can no longer name an M1 model on a metamodel tab |
| `JodieHeader.tsx:70` | `getActiveModel() ?? Selectors.getActiveModel()` | **still disagrees — see §6** |
| `JjodieAPIImpl.ts:188` | `getActiveMetamodel()` for `self` binding | with an M1 tab focused, `self` becomes unbound (null) instead of binding a metamodel from a stale selection. The file's own comment (`:183-187`) declares unbound → "clean error" as the intended outcome, so this is a narrowing in the declared direction |

## 5. `editorType` is not two-valued — the fix must not treat it as such

`EDITOR_TYPE_CHANGE` is dispatched from eight sites with **six** `editorType` values: `'metamodel'`
and `'model'` (`DockManager.tsx:149`, `Dock.tsx:371`, `MyRcDock.tsx:596`), plus `'summary'`
(`DockManager.tsx:200,222`, `MyRcDock.tsx:590,597`, `Dashboard.tsx:263`), `'transformation'`
(`DockManager.tsx:416,441`, `MyRcDock.tsx:588`) and `'viewpoint'` (`MyRcDock.tsx:592`).
`Jodie.tsx:210` stamps the cache for **any** of them that carries a `modelId`, so a JjTL or a
viewpoint tab leaves the cache populated with a non-artefact type. (`Dashboard.tsx:263` sends no
`modelId`, and `setActiveArtifactCache` drops it at `:32`.)

A literal reading of "when the cache is populated, it decides" would therefore make both resolvers
return null on a JjTL tab, where today they fall back to the dock and `_lastSelected` — a behaviour
change well outside the symptom. **The rule implemented is narrower and exact**: the cache decides
only when it names an artefact level (`'model'` or `'metamodel'`); for every other value, and for a
cold cache, the existing fallback chain runs unchanged. This matches `getActiveLevel()`, which
already trusts only those two strings (`:172-173`).

## 6. `JodieHeader` — read only, and it still disagrees after the fix

`JodieHeader.tsx:70` is `getActiveModel() ?? Selectors.getActiveModel()`. After fix A, the first
call correctly returns null on a metamodel tab, and the `??` hands over to
`Selectors.getActiveModel()` (`selectors.ts:64`), which reads `_lastSelected.modelElement` **with no
cache and no level filter** — the very stale M1 model the fix removed from the other path. The
header then takes the `activeModel && !activeModel.isMetamodel` branch (`:79`) and renders
`level: 'M1'` (`:90`).

So the chip above the chat can still read M1 while a metamodel tab is focused. It is cosmetic — it
does not feed `projectContextBundle` and does not reach `ExecutionContext` — but it is the visible
disagreement Alfonso would notice next. **Reported, not fixed** (the prompt marks the file read-only).

## 7. Point C of the prompt is not reachable in `ExecutionErrorDialog.tsx`

`errors[0].message` never arrives at the dialog. It is dropped twice:

1. `ChatMessages.tsx:438-443` builds a `ScriptLineResult` from the executor's `ExecutionResult`,
   keeping only `command / success / message / warnings`. `ScriptLineResult`
   (`ScriptBlock.tsx:59-64`) **has no `errors` field at all**.
2. `ScriptBlock.tsx:411` then builds the dialog's payload as
   `parseError(result.message || 'Unknown error', commands[i])` — a `string`-only signature
   (`errors.ts:361`). For `'create enum' modifies the metamodel` no pattern matches, so it falls to
   `createError('OPERATION_FAILED', { details: rawMessage })` (`errors.ts:401`), whose message is
   `ctx.details` verbatim (`:261-265`) and whose `suggestion` is **undefined**.

`ExecutionErrorDialog` receives `pauseInfo.error: JjScriptError | string` and renders `message` plus
an optional `suggestion` (`:241-256`). There is no `errors` array in scope, and no prop through
which one could arrive. Showing `errors[0].message` would require changing `ScriptLineResult`,
`ChatMessages.tsx` and `ScriptBlock.tsx` — three files the prompt excludes ("No other file"), and
exactly the "threading new props" it tells us to avoid.

**What is done instead, entirely inside the one file the prompt does allow on this path.** The
actionable sentence is folded into the guard's `message` in `create.ts`, which is the field that
does reach the dialog. The user reads "Open a metamodel editor (M2)…" on the red line, with no new
prop anywhere. `errors[0]` keeps its `WRONG_LEVEL` code and its own text for programmatic callers
(`JjodieAPIImpl.ts:203` reads `result.errors?.[0]?.message`), so nothing regresses there.
`ExecutionErrorDialog.tsx` is consequently **not modified**; it is a file listed in the scope that
turns out to need no diff.

## 8. Naming the model in the `WRONG_LEVEL` message — feasible, no new props

`ExecutionContext` (`types.ts:488-516`) carries `modelId`, `targetMetamodelId`, `level` and
`scopeBound`, but **no name**. `executeCreate` already holds `project` (`create.ts:218`), so the
name is one lookup away: `(project as any).models.find(m => m.id === context.modelId)?.name`. No new
prop, no new field on the interface (Rule 11 respected). When `context.scopeBound` is false, or
`modelId` is absent, or the lookup misses, the message stays as it is today.

## 9. Risks

- **Low.** The pure function changes one decision (does a populated artefact-level cache admit the
  fallbacks) and every other leg is untouched.
- The `JjodieAPIImpl` `self`-binding narrowing of §4 is the only behaviour change outside the
  symptom's path. It moves a silent stale binding to the declared "clean error"; if that error is
  noisy in practice it is a follow-up, not a revert.
- `getActiveLevel()` is not modified: it already obeys the cache, and fix A only makes its cold
  fallback consistent with the other two resolvers.
- No D-layer or L-layer write path is touched → no Layer Impact Report required (§3.2).

## 10. Open questions

1. Should `JodieHeader.tsx:70` drop the `?? Selectors.getActiveModel()` leg so the chip agrees with
   the scope? It is a one-token change in a read-only file; left for Alfonso to schedule.
2. Should `Jodie.tsx:210` refuse to stamp the cache for `'summary' | 'transformation' | 'viewpoint'`,
   so the cache only ever holds an artefact? It would make §5's rule unnecessary. Out of scope here.
3. `ScriptLineResult` losing `errors` (§7) blinds every dialog to structured error codes, not just
   this one. A separate lane.
4. Who clears `_activeArtifactCache`? §11 shows nobody does. The honest repair is to invalidate it
   when the artefact it names is deleted and when the project changes; §11's softening only keeps
   the staleness from costing a scope. A separate lane, and the owner of `setActiveArtifactCache`
   should take it.

## 11. Stale cache: nothing ever clears it (asked at ACK)

`command grep -rn --include="*.ts" --include="*.tsx" -E "setActiveArtifactCache|_activeArtifactCache" .`
→ 17 lines, EXIT=0. **Every writer is in Jodie**: the mount seed (`Jodie.tsx:198,203`) and the
EDITOR_TYPE_CHANGE listener (`:216`). There is no `setActiveArtifactCache(null)`, no reset on tab
close, none on model deletion, none on project change. The cache is written and never invalidated.

Three consequences, each traced:

1. **Deleting the artefact whose tab is active leaves the cache naming it.**
   `MyRcDock.removeTab` (`:279-284`) is a stub: it deletes from its own `this.tabs` map and logs
   `"docking removeTab() todo"`; it never touches the dock layout. Nothing else closes a tab on
   deletion. So `activeId` does not change, `_detectActiveTabChange` returns at its
   `activeId === this._lastActiveId` guard (`:584`), no event fires, and the cache keeps a
   `modelId` that is gone from `idlookup`. `getCachedModel` then returns null at its
   `fromPointer` (`utils.ts:46-49`).
2. **`<Jodie/>` is mounted once per login** (`App.tsx:177`, `{user && …}`, outside the routes), so
   the mount seed runs once and a project change never reseeds the cache.
3. **Closing the last artefact tab does self-heal**, because `project_summary` is `closable: false`
   (`Dock.tsx:275`): `activeId` falls to it, `_detectActiveTabChange` sees a change and stamps
   `editorType: 'summary'`, which §5's rule treats as naming no level. The fallbacks resume.

**So the state is reachable and persistent, and the fix is softened accordingly.** When the cache
names the requested level but `resolveCached()` returns null, `resolveActiveArtifact` now falls
through to the chain; when it names the *other* level it still returns null with no fallback, which
is the bug fix and is untouched. Without the softening, deleting the active metamodel would leave
`getActiveMetamodel()` answering null forever after, where before this task it would have found the
dock's current tab: a regression the ACK caught before it shipped.

Two residuals, declared rather than fixed:

- `resolveActiveLevel` is **not** softened: it has no resolvability probe, and giving it one would
  mean calling `getActiveModel()` from inside the level rule, which is the circularity the fix
  removes. With a stale `'metamodel'` cache the level therefore reads M2 while
  `getActiveMetamodel()` may recover a different metamodel from the dock, or none. Degraded, not
  wrong, and it self-heals on the next tab switch.
- Clearing the cache at the source (on deletion, on project change) is the real repair. It belongs
  to whoever owns `setActiveArtifactCache`, not to this lane. Open question 4 below.

## 12. What step 2 shipped, and the bench that judges it

Four files: `jjscript/executor/activeArtifact.ts` (new, pure), its test
`jjscript/executor/__tests__/activeArtifact.test.ts` (new, 15 assertions),
`jjscript/executor/utils.ts` (the three resolvers now share one rule) and
`components/Jodie/Jodie.tsx` (level first, then the one resolver for that level), plus the message
change in `jjscript/executor/commands/create.ts`. `ExecutionErrorDialog.tsx` is **not** modified —
see §7.

Mutation bench (CLAUDE.md §5, "a test is judged by the mutations it kills"), three mutants run,
each reverted, the module verified byte-identical afterwards:

| mutant | what it restores | red |
|---|---|---|
| M1 | the pre-fix rule: a level mismatch falls through instead of returning null | **4**: the two bug repros, the level/artefact agreement test, and "the other level is still refused, stale id or not" |
| M2 | any populated cache decides the level (`cache.editorType !== 'model'`) | **4**: all four non-artefact-tab controls (`summary`, `transformation`, `viewpoint`, `''`) |
| M3 | the §11 softening removed: `return resolveCached();` on a level match | **1**: "falls through to the chain rather than answering null", and only that one |

`resolveActiveLevel` is untouched by M1, so "the level is M2" stays green under it; that test is
about the other half of the disagreement, and the agreement test is what pins the two together.
The cold-cache controls stay green under all three: their job is to prove the fallback chain is
still live, so the nulls asserted above come from the cache rule and not from a broken loop.

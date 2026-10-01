# log-inbox — lane «jjscript»

Entries written by the JjScript lane while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-01 — feat(jjscript): Run defers unresolved commands, one summary closes every Run (P-2026-10-01-1725)
**Prompt**: `claude_2026-10-01_1725_prompt_jjscript_requeue.md`, full lane on `~/jjodel-w-jjsrequeue`, branch `jjscript-requeue`. Petri net script of 2026-10-01: line 9 refused `'Node' is not in 'metamodel_1'` with no wait. R-JS-2 scoped wait, R-JS-3 passes with deferral, R-JS-4 forward refusal out of Run, R-JS-5 no pause, R-JS-6 one summary modal. GO amendment: a deferred `set` superseded by a later succeeded `set` of the same feature is final, not an error.
**Files touched**: report `96c8d4756`: `docs/discovery/discovery_2026-10-01_jjscript_requeue.md`. `5fa749339`: `frontend/src/jjscript/executor/elementWaiter.ts`, `executor/__tests__/elementWaiterScope.test.ts` (new). `daba6e27e`: `executor/runPasses.ts` (new), `executor/__tests__/runPasses.test.ts` (new), `__tests__/scriptValidator.test.ts`, `components/ScriptBlock.tsx`. `1315e15c4`: `components/runFigures.ts` (new), `__tests__/runFigures.test.ts` (new), `components/RunSummaryDialog.tsx` and `.scss` (new), `components/ScriptBlock.tsx`. Closure commit: `docs/decisions.md` (R-JS-2..6), this file (new), the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates green: typecheck 14, the known set, before and after. vitest `src/jjscript` went from 454 passed in 16 of 17 files to 496 passed in 19 of 20; `context-binding` is red at import (known). Build exit 0. The `ScriptBlock` wiring and the dialog have no executing test, because the file does not import under the bench, and the visual check is pending.
**Out-of-scope changes**: no. Nine code files, above Rule 19's five: listed in report §6 and confirmed by the GO. The two `runFigures` files, the `elementWaiterScope` test and `RunSummaryDialog` amend the prompt's DOVE in the report, and the GO adopted them.
**Layer Impact Report**: not-required
**Smoke visivo**: non eseguito — the chat runs the visual check on the Petri net script (step 12: no dev server, no probe in this lane)
**Notes**: Mutation benches, in-memory apply and restore: waiter 6/6 killed, `runPasses` 14/15 (R8 equivalent: the Map is filled in line order), `runFigures` 12/12. Repro of the root cause and all D-decisions: report §3.1 and §7. `skipMatchingCreateLiteral` is no longer offered by Run (D7). A stopped Run shows no summary (D11).
**Prompt document name**: 2026-10-01 17:25

**Ticket** (T1, low): `ScriptExecutionWindow` and `JjScriptConsole` are mounted nowhere. Both only appear as exports (`components/index.ts`, `jjscript/index.ts`). Decide whether to adopt `runPasses` and the summary there, or to retire them. Report §3.4.

**Ticket** (T2, medium): the only recovery rule never fires under Jjodie. `RecoveryContext.metamodel` comes from `resolvedTarget`, which is `null` for every Jjodie reply (`ScriptBlock.tsx`, `errorRowFor`), so `literalInAttributeRule` returns at `rules.ts:97`. Read, not measured in the app. Report §3.4.

**Ticket** (T3, medium): the inner `catch` around an `async` `TRANSACTION` is dead. Sites: `set.ts:137-144`, `move.ts:107-114`, `copy.ts:111-118`, `remove.ts:114-121` and `:207-214`. A callback that throws is aborted and never resolves its handler's Promise, so a Run would hang on that command, before and after this lane.

**Ticket** (T4, medium): three silent successes give a Run nothing to defer.
- `create reference … opposite X` drops `opposite`.
- `set r.opposite = X` writes the bare string (`set.ts:406-409`).
- `create class N in P` with P unresolved gets a null father.

**Ticket** (T5, low): `TEMP-DISCOVERY` timing lines are still in the tree and are not this lane's. Sites: `executor.ts:69-73`, `:100-110`, `:141`, `:215-222`. In `ScriptBlock.tsx` they moved verbatim into `executeLine`.

**Ticket** (T6, low): `skippedLinesAsEditorLines` (`components/summaryLines.ts`) has no production caller left, now that `ScriptBlock` no longer mounts the old dialog summary. It is kept under Rule 9, and its test still runs.

**Visual check** (chat, 3002, two scoped Jjodie scripts): passed except the summary dialog. It did not fit the Jodie window: 646 px tall in a 518 px overlay, title and Close clipped. Fixed in `b42924613`: the dialog is capped to its overlay, the content scrolls (`RunSummaryDialog.scss` only). Check of the fix: to the chat.

**Ticket** (T7, low): under R-JS-3 the `PARENT_NOT_FOUND` suggestion «Make sure the parent was created earlier in the script.» (`errors.ts:183`) is misleading, because a forward reference is retried. It still shows on every final `PARENT_NOT_FOUND` whose handler gives no suggestion of its own. Ticket only, no change (chat, 2026-10-01).

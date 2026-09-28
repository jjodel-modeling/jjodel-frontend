# Fix: a Jjodie reply on a metamodel is stamped M1 and `create enum` is refused

Date: 2026-09-16 22:49 (Europe/Rome)
Type: fix
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: NO, but step 1 is a read-only verification that MUST produce a discovery report. If the
report contradicts the root cause below, STOP after writing it and do not touch code.

## Symptom (observed by Alfonso on 2026-09-16)

Project `Micro`, metamodel tab `Micro MM v1` focused. Jjodie produces a JjScript whose first line is
`create enum StorageKind`. Run opens `ExecutionErrorDialog` with "Execution stopped at line 1",
error `'create enum' modifies the metamodel`, 0 commands executed. The green "Executing" badge is
only the script run state and is not related.

## Root cause (from reading the code, not yet reproduced)

1. The refusal is the M2 guard in `frontend/src/jjscript/executor/commands/create.ts:233-245`, taken
   because `context.level === 'M1'`.
2. Since de77f22af the level comes from the scope stamped on the reply, built in
   `frontend/src/components/Jodie/Jodie.tsx:139-157`. That code asks `getActiveModel()` FIRST and
   only falls to `getActiveMetamodel()` when it returns null.
3. `getActiveModel()` in `frontend/src/jjscript/executor/utils.ts` reads `_activeArtifactCache`; with
   `editorType === 'metamodel'` the cache step returns null, but the function then falls through to
   the dock tab and finally to `state._lastSelected.modelElement`. If the last selected element
   belongs to an M1 model (selected at any earlier time), it returns that model. Jjodie therefore
   stamps `level: 'M1'` while a metamodel is on screen.
4. `getActiveLevel()` in the same file gives the cache absolute precedence and would answer `M2`.
   The two resolvers disagree; the cache is supposed to be authoritative.

Alternative path to the same symptom, by design (V2): the reply was generated while an M1 tab was
focused and run after switching to the metamodel. That is correct behaviour; only the message is
poor.

## Step 1: verification (read-only)

Read `CLAUDE.md` and the last entries of `docs/claude-code-log.md`. Then confirm or refute points
2-4 by reading `utils.ts` (`getCachedModel`, `getActiveMetamodel`, `getActiveTabMetamodel`,
`getActiveModel`, `getActiveLevel`), `Jodie.tsx` (the `projectContextBundle` memo and the
`EDITOR_TYPE_CHANGE` listener that seeds the cache), `JodieHeader.tsx:80-95` (it computes the level
a third way), `JjScriptService.execute` and `ScriptBlock.tsx` around the `ExecutionErrorDialog`
usage. Check every other caller of `getActiveModel` / `getActiveMetamodel` (`grep -rn`) and say
whether the fix below changes its behaviour.

Save the report as `docs/discovery/discovery_2026-09-16_jjodie_scope_level_m1_on_metamodel.md`
(objective, files read with full paths, findings, callers affected, risks, open questions). The step
is not complete until the file exists.

## Step 2: fix

COSA

A. When `_activeArtifactCache` is populated, it decides. `getActiveModel()` returns null without
   fallbacks if the cache says `metamodel`; `getActiveMetamodel()` symmetrically returns null without
   fallbacks if the cache says `model`. The dock and `_lastSelected` fallbacks stay only for a cold
   cache. Extract the decision into a pure function (e.g. in a new small module next to
   `scopeGuard.ts`; grep the name first) so it can be tested without `store`, `DockManager` or
   monaco, and have both resolvers call it.
B. In `Jodie.tsx`, derive the artefact from `getActiveLevel()` first, then resolve the model or the
   metamodel for that level, so the stamp and the level can never disagree. Do not change the memo
   deps or the V1/V2/V3 semantics of de77f22af.
C. `ExecutionErrorDialog`: under the red message also show `errors[0].message` when it differs, so the
   user reads "Open a metamodel editor (M2)...". When the run is scope-bound at M1, extend the
   `WRONG_LEVEL` message in `create.ts` (and only there) to name the model the reply was generated
   for, if the context carries it; if it does not, say so in the report instead of threading new
   props.

DOVE

`frontend/src/jjscript/executor/utils.ts`, the new pure module and its test,
`frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/jjscript/components/ExecutionErrorDialog.tsx`,
`frontend/src/jjscript/executor/commands/create.ts`. No other file. `JodieHeader.tsx` is read only:
if its level can still disagree, report it, do not fix it here. Do not touch `set.ts`, `rename.ts`,
`delete.ts`, `instance.ts`: they share the guard but not the defect.

COME

Minimal diff, no renames, no opportunistic refactoring. Vitest runs with `environment: 'node'` and
cannot import the executor or handlers (see the header of
`src/jjscript/executor/__tests__/scopeGuard.test.ts`): test the pure function, including the case
that reproduces the bug (cache `metamodel`, last selection in an M1 model, expect no M1 model and
level M2), the symmetric case, and the cold-cache fallback. The test must fail on the current code
logic before the fix. `npm test` and `npm run build` in `frontend/` must pass.

Hard stop before committing: list the files touched and wait for Alfonso's visual check on
http://localhost:3001/ (select an element in an M1 model, switch to the metamodel tab, ask Jjodie
for an enum, Run: it must create it). Then commit with explicit paths (`git add <files>`, never
`git add .`), message `fix: Jjodie stamps the level of the editor on screen, not of the last selection`,
and add the entry to `docs/claude-code-log.md`.

## RIFERIMENTI

- de77f22af `fix: Jjodie writes into the scope shown to the model`
- `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md` (V1-V3)

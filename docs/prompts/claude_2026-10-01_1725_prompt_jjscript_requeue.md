# Prompt: JjScript Run, a scoped dependency wait, deferred re-execution of unresolved commands, one summary modal

Prompt-ID: P-2026-10-01-1725
Chat: C-2026-10-01-1725
Lane: full (two-phase: Phase 1 discovery on the waiter, the handlers' error codes and the three run loops of `ScriptBlock.tsx`; Phase 2 after the chat's GO, same session). Tier: heavy.
Status: eseguito 2026-10-01 · lane jjscript-requeue · 1315e15c4 · non fuso: hard-stop, verifica visiva alla chat (Petri net script)
Status note: 2026-10-01 · verifica visiva della chat su 3002 passata salvo il modale fuori dalla finestra Jodie · corretto in b42924613 · nuova verifica del modale alla chat

Worktree: `~/jjodel-w-jjsrequeue`, branch `jjscript-requeue` (cut by the chat from `alfonso-frontend-jjtl` at `4b018b82b`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-jjsrequeue`, branch `jjscript-requeue`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

### The defect

Observed 2026-10-01 by Alfonso, project "Notation Demo" (metamodels ER, FlowChart, metamodel_1), a script from a Jjodie reply that builds a Petri net in `metamodel_1`. Line 9, `create attribute name in Node type String`, fails with `'Node' is not in 'metamodel_1'; qualify as FlowChart::Node to target another metamodel.` The abstract class `Node` was created by the previous command in `metamodel_1` and is on the canvas. The dialog reports 3 commands executed in 542 ms: no wait happened.

Root cause as the chat reads it (confirm or refute in Phase 1, do not assume it): `waitForDependencies` (`frontend/src/jjscript/executor/elementWaiter.ts`, `findUnresolved`) counts a dependency as resolved when the scoped lookup fails but `resolveElement(dep.name, project)` finds it project-wide. FlowChart holds a `Node`, so the required `parent` dependency of line 9 is resolved on the first poll, before Redux has propagated `metamodel_1`'s `Node`. Then `checkBoundScope` (`executor/scopeGuard.ts`, called in `executeAST` after the wait) finds the name only in FlowChart and refuses. Before the scope guard (`de77f22af`) the same race wrote the attribute into `FlowChart::Node` without a word (V3 of `discovery_2026-09-14_jjodie_scope_fix_targets.md`). So any homonym in another metamodel switches off the wait that R-JS-1 relies on, and the wait predicate and the guard's acceptance predicate disagree.

### What Alfonso asked

Commands that fail are queued again at the end and re-executed; the errors are given all together at the end in a modal; a modal also reports a successful run, with figures (classes, attributes, and so on).

### Decisions (provisional, unattended, RC-25)

The chat took these; Phase 2 writes them as rows in `docs/decisions.md`, section "Serie R-JS", marked `provisional, unattended`. Grep `R-JS-` first and take the next free numbers if R-JS-2 is taken.

**R-JS-2, the wait accepts what the guard accepts.** In a scope-bound M2 run, a bare-name dependency is resolved for the waiter only when the bound metamodel resolves it (the scoped leg finds it and `checkBoundScope` would not refuse it). The project-wide fallback counts only for qualified names and for runs that are not scope-bound. The M1 path is unchanged. Accepted cost: a bare name that lives only in another metamodel waits 500 ms before the guard refuses it, as it would anyway.

**R-JS-3, Run executes in passes.** Pass 1 runs every command in script order and never pauses. A failed command is deferred when all three hold: (a) its verb is constructive (`create`, `set`, `add`, and the standalone `A extends B`), not `delete`, `rename`, `move`, `copy`, `remove` and not an opaque command (`forall`, block, `let`, `eval`); (b) its error code is an unresolved-name code (expected: `ELEMENT_NOT_FOUND`, `PARENT_NOT_FOUND`, `TARGET_NOT_FOUND`, `OUT_OF_SCOPE`, `AMBIGUOUS_OUT_OF_SCOPE`, plus whatever an unresolved type reference produces; Phase 1 gives the exact list); (c) Phase 1 has shown, reading the handler body, that nothing is written before that failure. Every other failure is final at once and the run continues. After pass 1 the deferred commands run again in script order; passes repeat while a pass resolves at least one command, at most 3 passes after the first. What still fails is final, with the error of its last attempt. A destructive verb is never deferred because a delete that succeeds late, against an element the script creates afterwards, changes the meaning of the script.

**R-JS-4, the forward-reference refusal leaves Run.** The second pass of `validateScriptIntegrity` (`2b357af17`) refuses a forward reference with zero commands executed. Under R-JS-3 such a script completes on pass 2, so Run no longer refuses it. Parse and syntax errors still refuse before command 1, and they are listed in the summary modal. No file is deleted; whether the function keeps other callers is a Phase 1 finding.

**R-JS-5, Run never pauses.** The interactive Skip dialog leaves Run. Step mode keeps its pause on error, unchanged: it is the debugging path. The recovery rules (`jjscript/recovery/rules.ts`, first match wins) are evaluated on each final error, and their actions appear on that error's row in the summary modal; an action applies its fix and reruns only the final failures, with R-JS-3 semantics.

**R-JS-6, one summary modal closes every Run.** Two states. Success: title `Script executed`; for the target metamodel, before and after with the delta, for classes (abstract ones shown inside the count), attributes, references, operations, enumerations, literals, packages; commands executed; `k resolved on retry (lines …)` when any deferred command succeeded; duration. With errors: title `Script executed with n errors`, the same figures (what was applied), then every final error with its editor line number, command, message, suggestion and recovery actions. The figures come from a snapshot of the target metamodel before and after the run, with the same accessors the status bar uses for `7 classes · 3 attributes · 7 references` (`StatusBar.tsx`), never from parsing the commands, so deletes and copies count right. For Run from `ScriptBlock`, the success toast `JjScriptSuccessNotification` is replaced by the modal; its other callers are untouched. Visual language of the existing `ExecutionErrorDialog` (extend it or add one component, Phase 1 decides by size), light theme only, Bootstrap Icons, no new dependency, English strings.

The pass loop is one pure module (proposed name `frontend/src/jjscript/executor/runPasses.ts`; grep it first) taking the commands, an `execOne(index)` and an `isDeferrable(command, result)`, returning per-line final results, attempts, and the pass where each succeeded. It runs under vitest's node environment. The three loops of `ScriptBlock.tsx` that serve Run (the main loop, `handleSkipAndContinue`, `runCommandsFromIndex`) are reduced to calls to it.

## DOVE

Phase 1 writes only its discovery report. Phase 2, provisional until the report confirms or amends it:

- `frontend/src/jjscript/executor/elementWaiter.ts` and its test (R-JS-2).
- `frontend/src/jjscript/executor/runPasses.ts` (new) and `executor/__tests__/runPasses.test.ts` (R-JS-3).
- `frontend/src/jjscript/executor/scriptValidator.ts` (or its Run call site) and `__tests__/scriptValidator.test.ts` (R-JS-4).
- `frontend/src/jjscript/components/ScriptBlock.tsx` (R-JS-5, R-JS-6 wiring).
- `frontend/src/jjscript/components/ExecutionErrorDialog.tsx` and `.scss`, or one new summary component next to them (R-JS-6); `components/summaryLines.ts` if the line mapping needs it.
- `frontend/src/jjscript/components/ScriptExecutionWindow.tsx` only if Phase 1 shows it runs multi-line scripts and the adoption is small (about 40 lines); otherwise a ticket in the report.
- Closure: `docs/decisions.md` (the R-JS rows), the discovery report, a log inbox entry (`docs/log-inbox/jjscript.md` if `rotate-log.ts` folds any inbox file it finds, otherwise the existing inbox Phase 1 names), this prompt's Status.

No critical-zone file. `executor.ts` is not expected to change (the guard stays as it is); if Phase 2 needs it, say why in the report first. The `TEMP-DISCOVERY` timing lines in `executor.ts` and `ScriptBlock.tsx` are not this lane's: leave them and list them as a ticket.

## COME

### Phase 1, read-only, ends at a hard stop

1. Read `CLAUDE.md` (§6, Rule 11, §17, §21.2), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-25, RC-26, the R-JS-1 row; the commit messages of `2b357af17`, `de77f22af`, `9345a4046`, `fad85bae5`, `139350eea`, `09ce4b60c`; `docs/discovery/discovery_2026-09-17_superclass_same_script_race.md` and `discovery_2026-09-14_jjodie_scope_fix_targets.md`. Grep every new name before proposing it.
2. Root cause: confirm or refute with a vitest repro under the node environment, no dev server. Two metamodels, A holding `Node`, B the bound scope; `Node` created in B but not yet visible to the resolvers at the first poll (a stub of the lookup or of the store, whichever the existing tests of `elementWaiter` and `scopeGuard` make possible). Positive control: the same run without the homonym in A must wait and succeed. If the store cannot be stubbed, argue from the code with file and line references and say so. The repro test file is kept for Phase 2, uncommitted (`_tmp_` prefix if gitignored) or committed with the report, your choice, stated.
3. A table of every error code the M2 handlers emit: commands that emit it, whether anything is written before the failure (from the body, file and line), deferrable under R-JS-3 yes or no.
4. A map of `ScriptBlock.tsx`: the three loops, the states (`idle`, `running`, `stepping`, `paused`, `completed`, `error`), where `errorsList`, `executionStats`, `outcome`, `pauseInfo` and the editor line mapping are set, the Step path, the recovery dispatcher, what becomes a `runPasses` call; the callers of `JjScriptSuccessNotification`; whether `ScriptExecutionWindow` runs multi-line scripts.
5. The figures: the accessors `StatusBar.tsx` uses for classes, attributes, references, and those for operations, enumerations, literals, packages.
6. Question only, no implementation: is a Run one undo step today?
7. Write the report `docs/discovery/discovery_2026-10-01_jjscript_requeue.md`: `## 0. Answer in brief` first, at most 40 lines; then objective, files read, findings, risks, the Phase 2 DOVE confirmed or amended, «Decisions taken (unattended)», «Decisions awaiting Alfonso». Commit it alone: `docs(jjscript): discovery for the Run requeue lane (P-2026-10-01-1725)`. Stop with `Outcome: hard-stop`.

### Phase 2, after `[P-2026-10-01-1725] GO` from the chat, same session

8. Tests first, red before and green after. `runPasses`: a forward reference resolved on pass 2; a chain of two forward references resolved on pass 3; a non-deferrable error final at once and the run continuing; a pass with no progress ends the loop; the cap; a failing `delete` never deferred; final results ordered by line. `elementWaiter`: in a scope-bound run a homonym in another metamodel no longer satisfies a bare dependency, a qualified name still does, a run that is not scope-bound is unchanged. `scriptValidator`: a forward reference no longer refuses Run, a syntax error still does.
9. Implement R-JS-2, `runPasses`, the `ScriptBlock` wiring, the modal.
10. Gates: `npm run typecheck` with the baseline of 14 in the known set (`CLAUDE.md` §17), before and after; vitest of `src/jjscript` green, counts before and after; `npm run check:docs`.
11. Commits, one per concern: `fix(jjscript): wait for a bare name in the bound metamodel only (P-2026-10-01-1725)`, `feat(jjscript): Run defers unresolved commands and reruns them (P-2026-10-01-1725)`, `feat(jjscript): one summary modal closes every Run (P-2026-10-01-1725)`; then one docs commit with the R-JS rows, the log inbox entry and this prompt's Status.
12. No merge, no dev server, no probe: the chat runs the visual check on the Petri net script. Stop with `Outcome: hard-stop`, the shas, the diff stat, the test counts.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work.

## RIFERIMENTI

- R-JS-1 in `docs/decisions.md` (the wait for required dependencies, and the note that `type-reference` is `required: false` and races).
- `executor/elementWaiter.ts` (`findUnresolved`), `executor/scopeGuard.ts` (`checkBoundScope`), `executor/executor.ts` (`executeAST`, wait then guard), `executor/dependencies.ts` (roles and `required`).
- `components/ScriptBlock.tsx`, `components/ExecutionErrorDialog.tsx`, `components/JjScriptSuccessNotification.tsx`, `recovery/rules.ts`, `executor/scriptValidator.ts`.
- Screenshots of 2026-10-01 in the chat C-2026-10-01-1725: «Execution stopped at line 9», and after Skip Line «Execution completed with warnings», 21 commands, 1 skipped, `Node` left without `name`.

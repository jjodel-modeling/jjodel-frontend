# [P-2026-10-10-1630] Phase 2 GO: event attributes, the Reset checks of R-SIM-144

Prompt-ID: P-2026-10-10-1630 (Phase 2, same lane and session as the discovery)
Chat: C-2026-10-10-1620
Request: https://claude.ai/code/session_01CjZSPxRbbXhjGTtAKkf96c
Lane: full (Phase 2; an additive change to exported types, no critical-zone file). Unattended: Alfonso said «vai in auto»; questions with a recommendation are answered as recommended (RC-21) and recorded.
Depends: none
Status: da eseguire

[P-2026-10-10-1630] GO for Phase 2. Alfonso ratified R-SIM-144 on 2026-10-10 17:23 («sì alle 5 raccomandazioni»): the
five recommendations of your report's §12, as written. Read R-SIM-144 in `docs/decisions.md` and the new row of spec §8
on the trunk; they are the contract, and where they differ from your §10 draft they win (in particular: an unset
attribute reads what the frozen M holds, a mandatory `EInt` 0 and a default its default, `null` only for an optional
one without default).

## First

In `~/jjodel-w-eventattrs`: `git status` clean, then `git merge --ff-only alfonso-frontend-jjtl`. If the fast-forward is
refused, stop with `Outcome: blocked` and the output.

## COSA

Your §10 slice plan, with these settled:

1. **P3** in `stcChecks.ts` (a function of its own, so `stcChecks.test.ts:77,104` keep their expectations), called from
   `guardDefectsOf` and from a pass in `actionDefectsOf`: any read of the identifier `event` (any form, `event == null`
   included, your open question 1 answered yes) in a guard or an action of a transition without a trigger, or in an
   entry or an exit action, is the defect with reason `'event'`. A site carried by several transitions is judged on each;
   a fused transition's trigger is its choice edge's.
2. **P4**: `event.a` where `a` is neither a feature of the trigger's declared type or its ancestors nor a handle key
   (`name`, `id`, `instanceOf`, `parent`) is the defect with reason `'event-feature'`. `startRun` passes `stc.event` into the
   scope (`StcScope.event?`, optional). The short text must not start with `undeclared '`, so `undeclaredGlobals` does
   not offer to declare it.
3. **Unset warning**: `RunStart.runWarnings?` (optional, additive), shown on the run warning line by
   `SimulationPanel.tsx`, one line with the full text in the `title` (R-SIM-63). Text, in English, in the style of the
   panel's lines: `Unset event attributes: coinX.amount` (several joined by `, `). It lists only attributes some guard or
   action reads, on trigger instances whose value in the frozen M is unset as the app reads it.
4. The two `CompileDefect.reason` literals and the `StcDefectReason` literals are additive (rule 11).
5. Nothing else changes: `guardEvaluator.ts`, `actionEvaluator.ts`, `guardContext.ts`, `netStep.ts`, `jjel/` stay as they
   are. The spec row is already written by the chat; do not touch `docs/spec/` or `docs/decisions.md`.

Your open question 2 (a trigger on a fork's out edge or a join's in edge, dropped silently) becomes a ticket in the log
entry, not code.

## Tests and gates

Tests first, red at the base, as your §10 lists them, each with the mutation it kills; a mutation bench on the two
checks and on the warning. The parity oracle: the simulation suite unchanged apart from the new tests (baseline
47 files, 1461 tests), and `compileDefects` and the Last step lines of the four demo scenes byte-identical before and
after (`sim-verif-bench.ts` paths, or your probe). Then typecheck (baseline 14), vitest, build, `check:docs`,
`check:addonly`.

## Visual contract

- Now: a guard reading `event` on an ε arc, or an entry reading it, is silent until it fails at run time; an unset event
  attribute is invisible.
- Then: the Reset defects line names the `event` defect; the run warning line lists the unset attribute; nothing moves
  (R-SIM-63, R-SIM-65).
- Probe on a port 3080-3099 (never 3000, 3001, 3003; check `lane-run ports`), lean, at most two retries: the vending
  machine of your probe in the app, Reset with an ε arc reading `event` (the defect in the line and in the problems
  registry) and with coinX unset (the warning line); Step's top unchanged against a model without them; the four demo
  scenes unchanged. Crops at 600 px in `~/.jjodel-lanes/P-2026-10-10-1630/crops/`: `defect_line_600.png`,
  `warning_line_600.png`, `problems_600.png`.

## DOVE

`frontend/src/model/simulation/stcChecks.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`,
`frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/model/simulation/__tests__/stcChecks.test.ts`,
`frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, the probe under `frontend/scripts/probe/`, one entry
in `docs/log-inbox/simulation.md`. Four or more code files: list them before editing (P6).

## COME

Commits: `test(sim):`, `feat(sim):`, `chore(probe):`, then, after the chat's GO, the closure docs commit with the log
entry. Explicit pathspec and the `Model:` trailer on every commit. No push, no merge, no `git stash`, no `git add .`.
Do not touch any `Status` line.

## HARD STOP

If a step needs a file of CLAUDE.md §3.2, `editor-v2/problems/` or `editor-v2/viewpoint/ir/`: stop before editing,
`Outcome: question`. After the code commits and the probe: `Outcome: hard-stop` (visual check due). The chat checks the
crops (RC-23) and sends the GO for the closure.

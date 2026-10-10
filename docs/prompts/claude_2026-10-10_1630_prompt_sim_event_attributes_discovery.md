# Event attributes read by guards and actions: discovery

Prompt-ID: P-2026-10-10-1630
Chat: C-2026-10-10-1620
Request: https://claude.ai/code/session_01CjZSPxRbbXhjGTtAKkf96c
Lane: full (Phase 1, read-only on sources; one node probe outside `frontend/src/`)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-eventattrs`, branch `sim-event-attrs`, created from the trunk commit that adds this file.
Before anything else, check four things. `pwd` is the worktree. The branch is `sim-event-attrs`. `git status` is clean.
`git log -1 --format=%H` equals
`git log -1 --format=%H -- docs/prompts/claude_2026-10-10_1630_prompt_sim_event_attributes_discovery.md`. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-10-1630 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.
Do not touch the `Status` line.

## Context (read by the owner chat on the trunk at `99bd030d9`; verify, do not assume)

The memo `docs/ratifiche/claude_2026-10-10_memo_proposta_event_attributes.md` (`99bd030d9`) proposes that guards and
actions read the attributes of the event instance that fired the step, as `event.amount`. Alfonso accepted it on the
merits. Its points P1..P8 and its three questions are the subject of this discovery. Read it first.

The owner chat found that the memo's premise («events carry no payload») is partly outdated. Each point below is a
reading, not a measurement:

- (a) `event` is already a root of the guard and action context: R-SIM-14, R-SIM-18, and the single reserved list of
  R-SIM-42.
- (b) `buildGuardContext` (`frontend/src/model/simulation/guardContext.ts`, about lines 159-176) binds `event` to the
  snapshot handle of the event instance (`snapshot.handleById.get(step.event)`), to `null` on an ε step, and returns
  `null` when the event has no handle.
- (c) The guard oracle (`frontend/src/components/editor-v2/sim/simBridge.ts`, about line 322) and the action oracle
  (`frontend/src/model/simulation/actionEvaluator.ts`, about line 235) both pass the step's event, so every action site,
  entry and exit included, appears to see `event`.
- (d) `event` is already refused in derived equations (R-SIM-75, `derivedEvaluator.ts`), board outputs
  (`boardOutputs.ts`, R-SIM-118) and watches (`watchEvaluator.ts`, R-SIM-137), and treated as step-dependent in
  `actionEvaluator.ts` (`dependsOnStep`) and `stcChecks.ts` (`folds`).
- (e) R-SIM-16 already ratified «the parameters of an event are frozen attributes of its instance; events with free
  parameters are out of scope», and R-SIM-121 (keypad, events mode) already assumes `event.digit`.

So the likely scope is not a new root. It is: what works today, the holes to close (P3 visibility, P4 static typing,
P5 assignment, the unset warning), the nuXmv row (P6), and the parity oracle. The report must say plainly where this
reading is wrong.

## COSA (Phase 1, read-only)

Write `docs/discovery/discovery_2026-10-10_sim_event_attributes.md` (P4), opening with `## 0. Answer in brief`.

1. **Measure today's behaviour.** Write `frontend/scripts/probe/sim-event-attrs.ts`, node only, in the form of
   `frontend/scripts/probe/sim-verif-bench.ts` (read it first: fixtures, the stand-in of `buildEvalContext`, `startRun`,
   `pressInput`, `pressStep`). Build a small vending machine on the Extended state machine profile: an event class
   `Coin` with `amount: EInt`, a boolean, an enumeration, a string, a reference, a multi-valued attribute; three
   instances `coin10`, `coin20`, `coin50`, and one instance whose `amount` is unset; a global `credit` with a range
   domain 0..200. Measure each cell and print it as a MEAS line:
   - reading `event.amount` in a guard, in an arc action's right-hand side, in an entry, in an exit;
   - the same read on an ε arc (no trigger), on a transition merged by `simFork`/`simJoin` whose choice arc has a
     trigger, and on a Petri transition with a trigger;
   - each attribute type above, and the unset instance;
   - `event.amount := 1` and `event.[x] := 1` as actions (parse, Reset defect, or halt);
   - a multi-valued trigger on all coins with one action `model.[credit] := model.[credit] + event.amount`: the
     credit after three presses.
   For each cell record the value read, or the Reset defect (code and reason), or the halt (`HaltReason`), or the
   exclusion from the candidates, with the panel's line. Then say whether the probe's stand-in context and the app's
   `buildEvalContext` read an event attribute the same way (read the code; an unset `EInt` may read `null`, `0` or
   `undefined`). If they may differ, add one browser check with `lane-run probe` on a port of your own (not 3000;
   check `lane-run` ports) and report it.
2. **Name resolution (memo question 1).** Where the reserved list lives (`file:line`) and what it holds; whether JjEL
   resolves a bare identifier against `self`; with a feature named `event` on the arc class, what `event` and
   `self.event` evaluate to in a guard; what autocomplete offers.
3. **What compile time knows (memo question 2).** Where the trigger reference and its declared type are derived
   (R-SIM-38, `file:line`); whether the guard compilation (`compileGuards`, `stcChecks.checkGuard`) and the action
   compilation (`compileActions`, `actionDefectsOf`) know the owning arc, its trigger, and the site kind (transition,
   entry, exit); for a merged transition, how its origins are recorded (R-SIM-31(3)) and whether «has a trigger» is
   decidable there. Propose where the P3 check (no `event` where no trigger is set, and in entry and exit) and the P4
   check (the attribute looked up on the trigger's declared type, no downcast) go, with their `CompileDefect.reason`
   literals (existing, or new and additive under rule 11).
4. **Core types (memo question 3).** Whether `Expression`, `Action`, the subset checker or autocomplete need anything
   for `event.f`, or only the checks of item 3.
5. **Unset attributes (memo open choice 3).** From item 1, what a guard and an action do today with an unset
   attribute. Where a Reset warning listing the trigger instances whose read attributes are unset would live: R-SIM-61
   lists defects only, so name the channel (the run warning line of R-SIM-37 and R-SIM-65, or another) and draft the
   text.
6. **Usage census.** Every use of `event` as a JjEL identifier in guards, actions, entries and exits: the four demo
   scenes (`frontend/scripts/probe/fixtures/scene_*.jjodel`), every other fixture under `frontend/scripts/probe/fixtures`,
   the test fixtures under `frontend/src/model/simulation` and `frontend/src/components/editor-v2/sim`,
   `docs/demo/models_2026_simulator_demo.md`, and any other model shipped in the repo. This measures what P3 would
   break if entry and exit stop seeing `event`.
7. **nuXmv row (P6).** Spec §8 of `docs/spec/claude_spec_2026-09-13_computational_model.md` has no row for event
   attributes: draft it, with the `DEFINE` by cases over the event `IVAR`. Say whether the code generation branches
   (`codegen-stc`, `codegen-engine`, `codegen-runner`, `codegen-jjel-template`; rows R-GEN-1..15) read guards, actions
   or `event`, so that a Phase 2 here stays disjoint from them.
8. **Grammar fragment for the formal semantics chat.** The exact productions the parser uses for `event.f` (the
   identifier, then member access), with `file:line`, and what the evaluator does on `null.f` (an ε step). This text
   is forwarded verbatim by the owner chat, so quote the code.
9. **Guard errors, impact map only.** A parallel chat proposes that a guard evaluation error halts the run, where
   today the transition leaves the candidates (R-SIM-17, spec §5.2). Do not design it. Map it: where a guard outcome
   `defect` is produced and where it is consumed (`netStep.ts` candidates and `else`, the explanation and deadlock
   lines of R-SIM-57..63 and R-SIM-96, Play's stops of R-SIM-101, watches, scenario replay and divergence, coverage, the
   board's `clockEnables`); separate static defects (parse, subset, compile) from dynamic ones (an evaluation that
   fails on a configuration); count the guards of the four demo scenes and of the test fixtures that can fail
   dynamically, and say which readings of the scenes would change.
10. **Slice plan.** Files, tests written red first, the parity oracle (a model whose guards and actions never read
    `event` behaves as today: the four demo scenes and the simulation test suite unchanged), and a draft row
    R-SIM-144 in the style of the series.

Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». The second list holds at least the three
open choices of the memo, each with `Recommended:`, and the P3 break if item 6 finds any use.

## DOVE

The report, its assets under `docs/discovery/assets/sim-event-attrs/`, the probe
`frontend/scripts/probe/sim-event-attrs.ts` (and a browser probe beside it only if item 1 needs one), and one entry in
`docs/log-inbox/simulation.md`. No file under `frontend/src/`.

## COME

Commits: one `chore(probe)` for the probe, one `docs(discovery)` for the report, its assets and the inbox entry
(`log-entry` skill). Explicit pathspec and the `Model:` trailer on every commit. Run the probe from `frontend/` with
`npx --no-install tsx`.

## NON FARE

- No edit to any file under `frontend/src/`, `docs/decisions.md` or `docs/spec/`.
- No R-SIM row written in `docs/decisions.md`: the draft of R-SIM-144 stays in the report.
- No `git stash`, no `git add .`, no push. Do not touch the `Status` line.

## HARD STOP

After the commits, stop with `Outcome: hard-stop`. The owner chat reads the report and settles the choices with
Alfonso before any Phase 2.

## RIFERIMENTI

`CLAUDE.md` §3 and §21. `docs/PROTOCOL.md` P4, P13, P16. In `docs/decisions.md`: R-SIM-14, R-SIM-16, R-SIM-17,
R-SIM-18, R-SIM-29, R-SIM-31, R-SIM-38, R-SIM-40..44, R-SIM-57..63, R-SIM-70, R-SIM-75, R-SIM-96, R-SIM-118, R-SIM-121,
R-SIM-137..139. The spec `docs/spec/claude_spec_2026-09-13_computational_model.md` §4, §5, §8. The memo above.

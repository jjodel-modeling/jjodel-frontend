# JjEL: a multi-valued feature navigates to its first value instead of a collection

Prompt-ID: P-2026-10-12-0120
Chat: C-2026-10-12-0120
Front: maintenance
Lane: full (shared JjEL read path used by views, simulator, validation, JjTL and codegen; two phases in one session). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead. Unattended (lane auto): adopt your own `Recommended:` answers inside this perimeter and continue.
Depends: none
Request: none (Alfonso, 2026-10-12 01:11, asked for a discovery and then the fix in lane auto before going to sleep; his words are in the lane folder)
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).
Deroga: the Phase 1 hard stop is a checkpoint, not a session boundary. Once the report is committed, Phase 2 follows in the same session unless a stop condition below holds (Alfonso, lane auto, 2026-10-12 01:11).
Time limit: 120 minutes.

Worktree: `~/jjodel-w-jjelmulti`, branch `jjel-multivalued`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-12-0120 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured in the chat, do not redo)

Model: an M1 instance of a statechart metamodel. `StateMachine_0.regions = [Region_0]`;
`Region_0.subVertices = [InitialState_0, State_0]`; `Region_0.subTransitions = [Transition_0]`. The canvas shows the
counters `subVertices [2]` and `subTransitions [1]`. JjEL console with `self` = Region_0:

| Expression | Result |
|---|---|
| `self.name` | `"Region_0"` |
| `self.subVertices` | `InitialState_0`, one expandable object, not a list |
| `self.subVertices.size` | `null`, warning «Property size not found on object.» |
| `self.subTransitions` | `Transition_0`, one object |
| `(forall s in self.subTransitions such that true)` | `[]` |
| `(forall s in [1, 2, 3] such that true)` | `[1, 2, 3]` |

So a multi-valued reference reaches the evaluator as its first value. Read by the chat in
`frontend/src/jjel/evaluator/evaluator.ts`: `getProperty` returns `obj[property]` as the host object gives it
(about `:528-532`), so the collapse happens before the evaluator, where the host object (`self`) is built.
`evaluateForAll` returns `[]` on a non-array (about `:936-938`) and `evaluateExists` returns `false` (about `:950`):
that silence hid the bug. A `forall ... such that` returning a list is by design (`src/jjel/SPEC.md`: `forall`
selects and projects) and is not a defect.

## COSA

### Phase 1, read-only discovery

1. Find where the collapse happens. Trace `self` from the JjEL console component to the evaluator, through the
   construction of the host object (proxy, LObject/DObject bridge, `__isProxy`, `.value` against `.values`, an
   upper-bound test). Quote `file:line` verbatim. A function name is not its body: read the body.
2. List the readers that share that path: the console, view expressions (IR PathExpr and Conditional evaluation,
   jsx templates), `model/simulation/guardEvaluator.ts`, `actionEvaluator.ts`, `derivedEvaluator.ts`,
   `model/validation/validationEvaluator.ts`, `jjtl/executor/executor.ts`, `codegen/`. For each, say whether it
   collapses too, measured with a test or a probe, not inferred.
3. Scope: multi-valued references and attributes, containment and non-containment, M1 and M2 navigation (for
   example a class's `attributes`), a multi-valued feature with 0, 1 and 2 values, a single-valued feature with 0
   and 1 value. Say how multiplicity is decided today (declared upper bound or number of values) and what the
   canvas `[n]` counter reads.
4. History: `git log -S` and blame on the collapsing line. Since when, and whether it was intended: search
   `docs/decisions.md`, `docs/ratifiche/`, `docs/discovery/`, `src/jjel/SPEC.md`, `docs/spec/concern_languages.md`.
   Every assertion of absence states the search and a positive control (quoted globs).
5. Census of shipped expressions whose result could change after the fix: default views, seeds, examples,
   simulator scene STCs, codegen templates, tests. In particular expressions that iterate a value that is not a
   collection, and expressions that rely on a multi-valued feature reading as one object.

Report: `docs/discovery/discovery_2026-10-12_jjel_multivalued_navigation.md` (P4), closing with «Decisions taken
(unattended)» and «Decisions awaiting Alfonso». Commit it. Then continue with Phase 2 in the same session, unless a
stop condition holds.

### Phase 2, the fix

Target behaviour:

- A feature declared multi-valued (upper bound -1 or above 1) navigates to an array of its values, in slot order,
  resolved to objects for references; an empty array when it has no values. A single-valued feature navigates to
  its value or `null`. The declared multiplicity decides, never the number of values.
- Fix it once, at the layer where the collapse happens, so every reader that shares it gets the same answer. Do
  not patch each reader.
- The evaluator's read observation (`ctx.readObserver`, the dependency sets of IR v1.2 §9) keeps firing on the
  same reads.
- `forall` and `exists` on a non-null value that is not a collection raise a `JjelEvaluationError` naming the type
  received, instead of returning `[]` and `false` (R-VAL-13: the evaluator converts nothing). `null` keeps giving
  `[]` and `false`. If the census of point 5 finds a shipped expression that iterates a non-collection, leave this
  point out, describe the cases in the report and ask (`Outcome: question`) after landing the navigation fix.

Tests first, failing on the trunk: a fixture metamodel with a multi-valued reference, a single-valued reference
and a multi-valued attribute, and an M1 instance with 0, 1 and 2 values; assertions on navigation, `.size`,
`forall`, `exists` and the error above. One test for each reader of point 2 that collapsed. Mutation bench: show
the tests fail when each line of the fix is reverted.

Browser probe: the dev server of this tree on port 3147, the statechart reproduction above (built in the UI or
loaded from a fixture), the six expressions of the table in the JjEL console. Put the table of results in the
report and one crop of the console in the lane folder (`~/.jjodel-lanes/P-2026-10-12-0120/`).

Gates: typecheck (baseline 14), vitest, build, `check:docs`. Log entry in `docs/log-inbox/jjel-multivalued.md`.
Commit the code (pathspec, P13), then stop with `Outcome: hard-stop` (visual check due: the chat reads the crop).

## HARD STOP (stop with `Outcome: question` and a `Recommended:` line)

- The fix needs a §3.2 critical-zone file or `VersionFixer.tsx`.
- The fix changes an exported interface used outside the files of the fix.
- A shipped expression of the census changes its result in a way a user would see in a default view or a demo
  scene.
- The collapse turns out to be intended by a ratified decision (an R- row or `SPEC.md`).

## NON FARE

No push, no tag, no merge. No change to the JjEL grammar or to the meaning of `forall`. No refactoring of the
evaluator beyond the two `forall`/`exists` guards. No change under `src/jjodie/` or `src/jjscript/`.

## RIFERIMENTI

CLAUDE.md §2, §3, §17; PROTOCOL P4, P9, P13, P14, P16; `frontend/src/jjel/SPEC.md`;
`docs/spec/concern_languages.md`; `docs/decisions.md` R-VAL-13.

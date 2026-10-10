# Model-to-text code generation, the pilot: Phase 1 discovery

Prompt-ID: P-2026-10-10-0815
Chat: C-2026-10-10-0046
Lane: full (new subsystem; Phase 2 spans more than three files and adds persisted data)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-codegen`, branch `codegen-pilot`, created from the trunk commit that adds this
file. Before anything else: `pwd` is the worktree, the branch is `codegen-pilot`, `git status` is clean,
and `git log -1 --format=%H` equals `git log -1 --format=%H -- docs/prompts/claude_2026-10-10_0815_prompt_codegen_pilot_discovery.md`.
Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-0815 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the project chat flips it.

## Context (do not redo the analysis)

Jjodel gets model-to-text (M2T) code generation. Alfonso ratified the pilot on 2026-10-10 as
R-GEN-1..R-GEN-9 (`docs/decisions.md`), written as `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`.
Read the spec first: it is the contract of this discovery. In short: templates are JjEL functions with
string interpolation returning Text (fragments with origin, block indentation); every fragment copied
from the model records (element id, feature, transformation); one runnable target, JavaScript in an
isolated Web Worker; templates read the concrete metamodel and the roles of its simulation STC, never
write; a user-level experimental setting, off by default, with no generator module loaded when off;
additive persistence, no migration. The pilot must be live in 3.2 by 2026-10-26 for a lecture of the
MDE course at the end of October: the Phase 2 plan has to fit three weeks.

The chat's working hypothesis, which this discovery must try to **falsify**:

> The pilot needs no change in the critical zone and no change to the model layer. (1) A template can be
> hosted by the JjEL evaluator with at most a small, additive extension (string interpolation, or a
> builtin that builds Text). (2) The origin triple can be recorded by instrumenting the evaluator's
> feature reads, without touching `LModel` or `DObject`. (3) Templates can persist additively next to
> the simulator's per-metamodel keys (`sim*`, `simProfile`, `runScenarios`, `runWatches`). (4) The STC
> role binding of a metamodel is reachable as pure data from a module outside React. (5) A lazy chunk
> behind a user setting keeps the 3.2 bundle, with the setting off, equivalent to a build without the
> generator.

## COSA

A read-only discovery. Produce one report, nothing else. Sections A to I below are the report's
skeleton; every finding carries `file:line` and a verbatim quote.

**A. JjEL as a template host.** Lexer, parser and evaluator (`frontend/src/jjel/`, start from
`evaluator/evaluator.ts`, `evaluator/context.ts`, `evaluator/modelContext.ts`, `evaluator/builtins/`).
Is there string interpolation or a template literal form today? String concatenation, `map`, `join`,
lambdas, user-defined named functions: which exist and how they are written. Behaviour on an absent
value (the R-VAL invariant says JjEL throws on the absent; confirm and say what a template should do).
The reserved names issue (`true`, `false`, `null`, R-VAL prerequisite) and whether it touches templates.
If interpolation is missing, the smallest additive extension: grammar lines, AST node, evaluator case,
and which other consumers of the grammar (IR, validation, simulator guards, Jjodie console provider)
would see it.

**B. Origin.** Where the evaluator reads a feature from a model element (proxy, `objectSlots.ts`, the
`.[x]` operator for state). Can a read be intercepted to return the value together with (element id,
feature)? How a value flows through `map`, `join`, string operations and builtins in `builtins/strings.ts`,
and where an origin would be lost. Cost of a parallel Text value type that carries fragments versus
tagging strings. Which builtins are invertible (identity, case changes, trims) and which are opaque.

**C. Persistence.** How the simulator's per-metamodel configuration is stored today (`sim*` keys,
`simProfile`, `runScenarios` of R-SIM-139, `runWatches` of R-SIM-137): annotations of the form
`DAnnotation.source = "jjodel/<key>=<value>"` or otherwise, encoding of multi-line text, size limits.
What happens on save to a key the running code does not know. The `.ecore` export and import of
`jjodel/*` annotations (known loss). The alternative of a project-level resource. Recommend one, with
the reason.

**D. STC roles.** `frontend/src/model/simulation/stcFromRoles.ts` and the profile machinery: how to get,
for a metamodel, its role binding as pure data; how `isKindOf` resolves instances of a role; what a
read-only accessor for templates would look like (for example the instances bound to `State`, the
`Trigger` of a transition). Whether the binding is valid without an open simulation panel.

**E. Experimental setting and lazy loading.** Any existing feature flag or experimental setting (search,
with a positive control in the same invocation, quoted globs). Where user settings are stored and
rendered. Vite dynamic `import()` precedents in the codebase and how chunks are named. A way to prove in
a test that no generator module is in the initial chunk or reachable from the eager import graph.

**F. JavaScript runner.** Existing Web Worker usage in the frontend and the Vite worker syntax in use.
Anything in the repo that sets headers or a content security policy for the deployed app (deployment
config, nginx, ASP.NET backend static files) that would block `new Worker` from a module or a blob.
Timeout and termination. No prototype: findings only.

**G. Oracle and expression printer.** `frontend/src/model/simulation/scenarioCodec.ts`,
`frontend/src/components/editor-v2/sim/simScenarios.ts` and the run state: the shape of a scenario, of
a trace and of `expect`. What a generated program must expose (initial state, a step on an event,
observable state and outputs) so that its trace is comparable with the simulator's. Where the
translatable JjEL subset of the computational model spec (§8, nuXmv vocabulary) is defined in code, and
whether it can drive a JavaScript expression printer.

**H. Prior art in the repo.** Any existing model-to-text code: export functions, JjTL serialization,
Jjodie generating code (`frontend/src/ai/`, `frontend/src/components/Jodie/`), `.ecore` writer. Each
claim of absence with its search and a positive control.

**I. Phase 2 plan.** Slices in order, each with its file set and the week it belongs to (spec §11: engine
module by 2026-10-17, runner, code panel, roles and setting by 2026-10-24, oracle by 2026-10-30). Say
which slices can run in parallel (disjoint file sets, RC-22) and whether any touches the critical zone
(the chat expects none; confirm or refute). The test strategy, mutation bench included. For the code
panel, the three points of `template-task-visivi` (what is seen now, with numbers; what it must become;
one mechanical acceptance criterion). For each of the five points of the hypothesis: confirmed, refuted
or reshaped, with the evidence. Close with the two lists of RC-26: «Decisions taken (unattended)», each
with its recommendation and reason, and «Decisions awaiting Alfonso».

## Report

Path and name, mandatory: `docs/discovery/discovery_2026-10-10_code_generation_pilot.md`. Content per
P4: the hypothesis being falsified, the objective, the files read with full paths, findings with
`file:line` and verbatim quotes, dependencies and risks, open questions. The hard stop is not reached
until the file is written; if a report already exists at that path, follow R-E/E-1 (read it, append an
addendum).

Write the log entry with the `log-entry` skill into `docs/log-inbox/codegen.md`. Commit the report and
the inbox entry together, docs only, with an explicit pathspec, conventional subject
`docs(discovery): code generation pilot`, and the `Model:` trailer (P6).

## HARD STOP

After the docs commit, stop and exit with `Outcome: hard-stop`. Phase 2 comes as a new message in this
same session after the chat has read the report.

## NON FARE

- No edit to any source file, test, spec, `docs/decisions.md` or `CLAUDE.md`. The only files written are
  the report and the inbox entry.
- No prototype of the template engine, the runner or the setting; designs live in the report.
- No assertion of absence without the search that supports it and a positive control in the same
  invocation, with quoted globs (R-RAIL-28, R-RAIL-31).
- No `git stash`, no `git add .`, no push.
- Do not touch the `Status` line of this prompt.

## RIFERIMENTI

- `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md` and R-GEN-1..R-GEN-9 in `docs/decisions.md`.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` (§8 vocabulary, translatable subset).
- `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` (tri-state at the rule boundary, JjEL on
  the absent).
- `docs/spec/concern_languages.md` (JjEL identity, known bugs).
- `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` §5 (editability, the criterion round-trip will
  reuse) and `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (additive persistence precedent).
- R-SIM-137..R-SIM-142 in `docs/decisions.md` (watches, scenarios, step back, coverage, timeline).
- `CLAUDE.md` §3 (critical zone), §21 (log entry); `docs/PROTOCOL.md` P4, P13, P16.

# JjScript at M1: deferred retries and creation inside a container

Prompt-ID: P-2026-10-04-0946
Chat: C-2026-10-04-0946
Lane: full (grammar change, executor and parser, more than three files)
Status: eseguito 2026-10-04 · lane jjscript-m1 · 602f64413, 9916cefce, 9163f0b28 · non fuso: hard-stop, probe after 3096 all PASS (microwave with `in`: 0 errors, every Transition in its State, not in model.objects), mutation bench 28/28, crops in ~/.jjodel-lanes/P-2026-10-04-0946/crops/, verifica visiva alla chat

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjsm1`, branch `jjscript-m1`, created from trunk `d6bd5c5f6`. Before anything else: `pwd`,
branch, `git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-04-0946 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

The M2 executor was fixed by P-2026-10-01-1725 and P-2026-10-01-2136 (R-JS-2..R-JS-7): Run in passes,
constructive commands failing on an unresolved name deferred and retried, retry passes waiting for every
dependency. At M1 the same script shape fails. Alfonso ran a generated microwave state machine (ESM
metamodel: `State.transitions` composition `0..*` of `Transition`, `Transition.nextState 0..1 State`,
`Transition.event 0..1 Event`) and got four `Transition` instances at the model root instead of inside
their source `State`, plus references to instances not yet created.

Read on the trunk at `95c38845d` by the chat, to be confirmed:

1. `executor/runPasses.ts:94`, `DEFERRABLE_ERROR_CODES` holds only M2 codes. The M1 handlers in
   `executor/commands/instance.ts` emit `INSTANCE_NOT_FOUND` (reference branch of `set`, around line 820),
   which is not deferrable, so a forward reference at M1 fails for good.
2. `instance.ts:361-367`: `create instance` always calls `DObject.new(metaclass.id, targetModel.id, DModel,
   name, true)`. The father is always the model. `parser/parser.ts:266` has no form for a container. An
   instance becomes a child only through a later `set <Parent>.<compositionRef> += <child>`; if that line
   fails, the create has already succeeded and the instance stays at the root silently (ticket T4 «null
   father» in `docs/log-inbox/jjscript.md` is a sibling).
3. `executor/elementWaiter.ts:70-133` already has an M1 branch (`findInstanceByName`, `resolveTargetModel`),
   older than R-JS-3; it waits within its timeout only.

Decisions taken in chat with Alfonso (2026-10-04), the lane implements both:

- (a) R-JS-3 extends to M1: an M1 constructive command failing on an unresolved instance name is deferred
  and retried with the same rules as M2 (destructive verbs never deferred, superseded `set` not retried,
  at most 3 retry passes, R-JS-7 wait).
- (b) `create instance` accepts a container, so an instance is born inside its parent and never passes
  through the root. Working syntax, to be confirmed or amended by the discovery with a recommendation:
  `create instance of <Class> ["<name>"] in <ParentInstance>.<compositionRef>`.

## COSA

### Phase 1, read-only discovery

Write the report to `docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md` (P4: hypothesis being
falsified, goal, files read with full paths, findings with `file:line` and verbatim quotes, risks, open
questions each with `Recommended:`). Commit it before the hard stop. Answer:

- Q1. Every code the M1 handlers emit for a name that does not resolve, and for each whether it is emitted
  before anything is written (R-JS-3 requires it). Which ones join `DEFERRABLE_ERROR_CODES`, and whether a
  separate M1 set is cleaner than mixing.
- Q2. What `set <Parent>.<compositionRef> += <child>` does today on a child already at the root: move
  (reparent), duplicate, or refuse. Measure it on a fixture, do not infer it.
- Q3. The grammar of (b): parser, AST field, executor path (`DObject.new` with a DObject father and its
  father type), and the checks before any write: the reference exists on the parent's metaclass, is a
  containment, the class conforms to its type (`isKindOf`), the upper bound is not exceeded. A missing
  parent must emit a deferrable code before any write.
- Q4. Interaction with `handleRegistry.ts` (deferred store commit, `objects` lagging) for a child created
  inside a parent created earlier in the same pass.
- Q5. The Jjodie generation prompts (`defaultPrompts.ts` M1 section, `jjscriptGenerationPrompt.ts`):
  where they tell the model to attach children, and the change that makes them use (b).
- Q6. Whether the Run summary (R-JS-6) can report an instance left at the root when its class is reachable
  in the metamodel only through a composition. Recommendation only; no inference of the parent.
- Q7. A reproduction: the ESM metamodel and a microwave script with forward references and late
  containment lines. Before the fix: instances at the root, failed lines. Keep it as the fixture.

Then stop: `Outcome: hard-stop`.

### Phase 2, after the GO

Tests first (red before the fix), then (a), then (b), then the Jjodie prompts. Mutation bench on the new
logic. Gates at baseline: typecheck 14 (`CLAUDE.md` §17), vitest, build, `npm run check:docs`. M2 behaviour
unchanged: every existing jjscript test green. Probe on a free port via `lane-run probe`: the Q7 script run
in a model of the ESM metamodel; the tree shows every `Transition` under its source `State`, zero failed
lines; crops of the tree and of the canvas at 600 px for the chat's visual check (RC-23).

Decision rows in `docs/decisions.md`, series R-JS, provisional (next free numbers). Log entry in
`docs/log-inbox/jjscript.md`, Status flip per P13 and RC-17.

## HARD STOP

End of Phase 1. Any need to touch `useJjomSync.ts`, `canvasToJjom.ts`, `portDistribution.ts` or
`viewpoint/ir/`: stop and ask. Any change of behaviour at M2.

## NON FARE

No change to the canvas or to the edge views: a separate defect (a contained `Transition` drawn as a node
after a reparent) has its own lane. No migration of existing models. No push. No inference of a parent for
a `create instance` without `in`: it stays at the root as today.

## RIFERIMENTI

`docs/decisions.md` R-JS-2..R-JS-7; prompts P-2026-10-01-1725 and P-2026-10-01-2136; tickets T2, T3, T4 in
`docs/log-inbox/jjscript.md`; `frontend/src/jjscript/executor/{runPasses,elementWaiter,handleRegistry}.ts`;
`frontend/src/jjscript/executor/commands/instance.ts`; `frontend/src/jjscript/parser/parser.ts`.

# Proposal: event attributes readable from guards and actions

From: chat C-2026-10-10 (project chat, not the simulator owner)
To: the simulator owner chat
Date: 2026-10-10
Status: proposal, accepted on the merits by Alfonso ("vai"); numbering, ratification and lane are the owner chat's

## Problem

Events carry no payload. An event is an M1 instance of the class bound to the Event role (R-SIM-16), the arc recognises it by identity (any-of when the trigger is multivalued, R-SIM-38), and the step receives it as an id (`SimConfiguration.event: string | null`). Guards and actions read the state with `.[x]` but cannot see which event fired the step.

A vending machine with `insert_coin(amount)` must today be written with one instance per coin and one arc per instance, each with its own action (`self.[credit] := self.[credit] + 50`). It works, but it multiplies arcs and repeats the action.

Free input values (an amount typed at run time) were deferred to after Málaga on 2026-09-28. This proposal does not reopen them.

## Proposal

**P1. A parameter is an attribute of the event instance.** If the event class of the concrete metamodel declares `amount`, each instance carries its value (`coin50.amount = 50`). No new STC role, no new key, no change to how events are declared. The domain is finite by construction: it is the set of values on the event instances in the model.

**P2. A reserved root `event` in the guard and action context.** It is bound, for the step being taken, to the M1 instance that fired it. Read-only. `event.amount` reads the attribute with the plain dot, like any model attribute (state stays behind `.[x]`, R-SIM-18). The read goes through `objectSlots.ts` (stored data by pointer), as the other value reads do. With it, the vending machine needs one arc, a multivalued trigger on all coins, and one action:

```
self.[credit] := self.[credit] + event.amount
```

**P3. Where `event` is visible.** In the guard and in the action of an arc whose trigger is set. Not on an arc without trigger (ε), and not in node entry and exit actions, so that what a node does on entry does not depend on the path that reached it. A read of `event` outside those places is a compile defect of the guard or action, reported where guard defects already go (R-SIM-57..63), never in the problems registry. For a transition merged by `simFork`/`simJoin` (R-SIM-22, R-SIM-31), `event` is visible only if the merged transition has a trigger.

**P4. Static typing on the trigger's declared type.** The attribute is looked up on the type of the trigger reference (R-SIM-38), not on the individual instances. An attribute declared only on a subclass of that type is a compile defect: no downcast. An instance whose attribute is unset yields an absent value, which JjEL turns into a guard or action defect at the step that fires it; the run halts with that reason (R-SIM-29). A warning at run start, listing the trigger instances with unset attributes read by some guard or action, is recommended.

**P5. Event attributes are frozen for the run.** They belong to M, captured by the per-run snapshot (R-SIM-14); editing an event instance during a run interrupts it as any model edit does. Assigning to `event.x` is a compile defect (double meaning with state, and effects never go to the model).

**P6. nuXmv mapping, no new variables.** The event is already an `IVAR` over the finite set of event instances. `event.a` compiles to a `DEFINE` by cases on that `IVAR`, with constants taken from the frozen model:

```
DEFINE event_amount := case event = coin10 : 10; event = coin20 : 20; event = coin50 : 50; esac;
```

The state space does not grow. Integer, boolean and enum attributes map directly; string attributes as symbolic constants; real-valued attributes stay out of the first slice.

**P7. No change to board, scenarios, trace.** Each instance is still one button on the I/O board. Scenarios (R-SIM-139) still record instance ids, and the values follow from the model. The trace row may show the read attributes next to the event name; optional, not part of the first slice.

**P8. Forward compatibility with free inputs.** When free input values arrive, a free parameter can be declared in the STC with a finite domain (`IVAR amount : 0..k`, like `simBound` for the marking) and read with the same `event.amount`. Models written with P1..P7 stay valid unchanged.

## Parity oracle

A model whose guards and actions never read `event` behaves exactly as today: same candidates, same steps, same trace, same export. This is the acceptance oracle of the slice, as for R-SIM-16.

## Questions for discovery

1. Is `event` free as a root name in the JjEL guard context today, and does JjEL resolve bare identifiers against `self`? If it does, a metamodel feature named `event` would shadow or be shadowed; the root has to win, and `event` goes into the reserved names list (see the R-VAL prerequisite on a single list imported by both lexers).
2. Where the trigger type is checked at compile time today, and whether the guard compiler already knows the owning arc (needed for P3 and P4).
3. Whether the Expression/Action types of R-SIM-38..45 need an extension for a context root, or only the evaluator context does.

## Open choices for Alfonso (recommendation in brackets)

1. Name of the root: `event` or `trigger`. (`event`: it names the thing, `trigger` names the arc feature.)
2. Entry and exit actions see `event`. (No, as in P3.)
3. Unset attribute on a trigger instance: warning at run start plus halt when fired, or refusal to start the run. (Warning plus halt.)

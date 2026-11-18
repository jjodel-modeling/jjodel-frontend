# Fix: JjEL equality of model objects decides by identity

Prompt-ID: P-2026-11-17-2219
Chat: C-2026-11-17-2219
Front: maintenance
Lane: fast (JjEL evaluator and its collection builtins; no critical-zone file, no exported interface)
Status: eseguito 2026-11-17 · lane fast · 29aab5059 · verifica visiva: passata 2026-11-18 (Alfonso on :3002, Families2Persons 4 Female and 5 Male)
Request: https://claude.ai/code/session_01DQt9R36yJbBZaWZvGKroUc (Alfonso, 2026-11-17 22:19, after the MDE lecture: two references to the same model object compare as different in JjEL)
Depends: none
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Executed by the chat itself in a cloud checkout, not by a lane on the Mac: no `lane-run` state exists for this ID.
Branch `jjel-object-identity`, cut from `alfonso-frontend-jjtl` at `e30274962`. Not pushed, not merged.

## COSA

1. `==` and `!=` between two model objects decide by the identity of the underlying object (same pointer id), whatever
   path produced each reference. Null and primitive comparisons keep their behaviour.
2. Every operation that relies on equality agrees: `contains`, `indexOf`, `distinct`, `distinctBy`, `groupBy`.
3. Before changing anything, confirm or correct the hypothesis (a fresh proxy per navigation step, compared by
   reference) by reading the evaluator, and find what changed since the builds of 27 and 28 October.

## DOVE

- `frontend/src/jjel/evaluator/identity.ts` (new)
- `frontend/src/jjel/evaluator/evaluator.ts` (`isEqual`)
- `frontend/src/jjel/evaluator/builtins/collections.ts` (`deepEqual`, `keyOf`)
- `frontend/src/jjel/__tests__/object-identity.test.ts` (new)
- `frontend/src/jjtl/executor/__tests__/source-object-identity.test.ts` (new)
- `frontend/src/jjel/SPEC.md` (6.3 and the collection methods)

## COME

Tests first, red on the unfixed trunk, then the fix, then the SPEC. Discovery report in
`docs/discovery/discovery_2026-11-17_jjel_object_equality.md`: cause, why it is not a regression, the fix, evidence,
limits, open questions.

## RIFERIMENTI

- `frontend/src/jjscript/executor/commands/eval.ts`: `buildEvalContext` (pool handles) and `wrapSelectedElement` (`self`).
- `frontend/src/jjtl/executor/executor.ts`: `liftSourceRefs`, `createInstanceContext`.

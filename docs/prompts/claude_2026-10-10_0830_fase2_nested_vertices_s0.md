[P-2026-10-10-0830] Phase 2 GO: slice S0 only (the read-only probe). Hard stop after S0.

Prompt-ID: P-2026-10-10-0830
Chat: C-2026-10-10-0057
Lane: full (probe only; no source change)

## Accepted

Your report (`6b13fbd8c`) is accepted:

- the verdict «reshaped»;
- the three D-layer shapes;
- the five-slice plan in the order S0 → S1 → S2 → S3 → S4;
- your unattended decisions: the walk reads slots and is not imported from `viewpoint/ir/`, §3.5 stands, nested objects are placed next to their container, and conformance stays as it is.

D1 (automatic or opt-in appearance for existing projects) and D2 (the XMI hybrid) are with Alfonso. S0 does not depend on them. Your two questions get your recommended answers: S0 runs before any code slice, and a single creator works behind a pending mark in `syncState.ts`. The second answer is recorded for S3.

## COSA

S0 exactly as in your §G table. Write `frontend/scripts/probe/nested-vertices.ts` and run it with `lane-run probe` on a dev server port of your own (check `lane-run` ports; not 3000; a parallel lane, P-2026-10-10-0105, is running a probe too). It measures three things:

1. The A2 claim. On a fresh project, import `sample-StateMachine.xmi` with its `.ecore`. Count the `.react-flow__node` elements against the DObject count. For each DObject, print the `father` class and whether it is in `objects`.
2. `create … in` on the canvas: the node count before and after.
3. D3. Reopen a saved project with one vertex-less nested object and print every pre-existing node's position before and after the open.

Turn each [R]/[R, inferred] claim the probe touches into [M], confirmed or refuted. Append the results to `docs/discovery/discovery_2026-10-10_nested_object_vertices.md` as an addendum (R-E/E-1), with the raw output saved under `docs/discovery/assets/nested-vertices-s0/`.

## DOVE

`frontend/scripts/probe/nested-vertices.ts` (new), the report addendum and its assets, and `docs/log-inbox/nested-vertices.md`. Nothing else.

## COME

Make one commit with an explicit pathspec and the `Model:` trailer: `chore(probe)` plus `docs(discovery)`, or two commits. Add one inbox entry with `log-entry`. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Update D1/D2 if the measures change their recommendation.

## NON FARE

- No source change outside the probe.
- No `useJjomSync.ts`, `m1EdgeGate.ts`, `useM1ReferenceEdges.ts` or `m1EdgeSweep.ts` edit (S1 to S3).
- Do not touch the `Status` line.

## HARD STOP

After the commit, stop with `Outcome: hard-stop`.

# DCN slice 5 discovery: run-time rendering on the object diagram, snapshot, coherence watches

Prompt-ID: P-2026-11-08-1742
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane discovery · report completed by the chat from the handoff
Lane: discovery (read-only; no code)
Depends: R-DCN-25..28 (trunk 2df3c9a32); branch dcn-l47 (L4.6 and L4.7, not yet on the trunk)
Worktree: ~/jjodel-w-dcn-s5d, branch dcn-s5d, created from dcn-l47, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 16:24, R-DCN-25..28)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. Read-only: no edit under frontend/, no probe run, no server. The only files written are the discovery report and the Status flip of this prompt. No subagents, no background tasks. Every reply opens with [P-2026-11-08-1742 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Context discipline from the first line: grep first, then read about 60 lines around each hit; never read a whole file over 400 lines; never cat a log. Write the report incrementally (one section at a time, saved after each), so a context stop leaves a usable report.

## COSA

Write `docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md` (objective, files read with paths and line ranges, findings, insertion points, risks, open questions each with `Recommended: <one line>`) answering:

**A. Overlay on the instance node (R-DCN-25, R-DCN-26).** During a DCN run, where can the object-diagram node of an `InstanceSpecification` read run state (the live `SimRun` for its model: classification per viewpoint, slot values of σ, which monitors run) and render (1) one compartment per viewpoint with the dynamic classes as pills, active ones highlighted, (2) slots of inactive classes greyed with their kept value, (3) a monitor icon on an active class with running monitors, without writing the model (R-SIM: the run never writes the model). Look at how the Petri run highlights the canvas today (marking on places, enabled transitions: grep `getSimRun`, `simRunState`, sim overlay or highlight in `editor-v2`), how the instance node renders its slot rows (R-OI ghost and orphan rows, `ObjectNode.tsx`, the UML client's instance view), and whether the overlay can be a view-level or node-level addition fed by a selector. Name every CLAUDE.md §3.1 critical-zone file the path would touch (`useJjomSync.ts`, `portDistribution.ts`, D-L proxy writes, ...) and say whether a path exists that touches none. Node sizing: say how a compartment that appears only during a run interacts with node size (grow-only, R-OI-16) and layout shifts.

**B. Snapshot (R-DCN-27).** «Save snapshot as object diagram»: a new M1 model beside the original, named «<model> (snapshot step N)», copying instances, links and slot values of σ in one undo group. Which existing surfaces create an M1 model and instances (R-OI S2 `instantiate`, model creation in the project, duplicate-name suffix), how links are created, how an undo group is opened, and where the gesture sits (panel button, its enabled state).

**C. Coherence watches (R-DCN-28).** How watches work today (R-SIM-137: grep `watch`, `WatchHit` in `sim/`), and how φ (a state invariant) and BoundedPersistence/BoundedResponse (counter automaton per instance, bound k) plug in for a DCN run: where `CoherenceConstraint` lives in the drone metamodel (or that it is absent and must be added to the fixture), which role or binding reads it, evaluation context (the DCN guard context), and how a hit is shown.

**D. Slice plan.** Propose lanes (one numbered item per commit, each small enough not to hit the context ceiling: the L4.5 lanes did), their files, which need the critical-zone go-ahead and a Layer Impact Report, the probe and crops each needs, and the order. Fold in the open tickets: bare-argument read `rate` in `dcnStep.ts`; title of a multi-valued non-link attribute; no render test for the Simulation panel.

Then commit the report and the Status flip (`docs(dcn): slice 5 discovery (P-2026-11-08-1742)`), `git add` only those two files. No push, no merge. Final message: the answer to each of A-D in a few lines, the open questions with their Recommended, then the Outcome (done, or question if a question blocks the plan).

## DOVE

Read anything under frontend/src and docs; write only the report and this prompt's Status.

## RIFERIMENTI

docs/decisions.md R-DCN-25..28, R-DCN-3, R-DCN-8, R-OI-13..16, R-SIM-137; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §3 (CoherenceConstraint), §7; docs/discovery/discovery_2026-11-08_dcn_l45_run_wiring.md; CLAUDE.md §3.

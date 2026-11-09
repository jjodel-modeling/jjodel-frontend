# Discovery: a containment write from syncCreateCompositionLink is sometimes lost

Prompt-ID: P-2026-11-09-1020
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: discovery (read-only; no code)
Depends: ticket (high) in docs/log-inbox/dcn.md, entry of P-2026-11-08-1939
Worktree: ~/jjodel-w-lostlink, branch lost-link-discovery, from the trunk, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-09 10:18, «ok» to the recommended discovery)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. Read-only on frontend/src: no edit anywhere under frontend/src. A probe may be written under frontend/scripts/probe/ to measure, and committed. The critical-zone files (`canvasToJjom.ts`, `useJjomSync.ts`, the D-L proxy, `EditorV2.tsx` sync paths) are read, never changed. No subagents, no background tasks. Every reply opens with [P-2026-11-09-1020 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Context discipline: grep first, about 60 lines around each hit; never read a whole file over 400 lines; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep only MEAS, FAIL, DONE; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Write the report incrementally, section by section, saved after each.

## COSA

Write `docs/discovery/discovery_2026-11-09_lost_containment_write.md` (objective, files read with paths and line ranges, measures, hypotheses with evidence for and against, root cause or the narrowest remaining candidates, fix options each with its layer impact, open questions with `Recommended: <one line>`):

(1) **The symptom.** In `frontend/scripts/probe/dcn-drone-fixture.ts`, `buildLinks` (via the BPMN lanes fixture helper) writes containment links with `syncCreateCompositionLink` (`sync/canvasToJjom.ts`, called from `EditorV2.tsx` about 2261 and 3429); on 2026-11-08 one link per build was missing afterwards, 5 runs of 5, a different link each time, also on unmodified HEAD; a run with a settle after `buildLinks` lost none. The fixture now repairs losses and counts them (L-1). Read that entry in docs/log-inbox/dcn.md.

(2) **Measure.** A probe (copy the fixture's build path, not the whole fixture) that issues the same sequence of containment writes with no settle and reads the slots after each write and after a final settle, ten runs: which write is lost (first, last, a burst neighbour), whether it is lost in the D-layer, the L-layer or only in the read (re-read after a longer settle), and whether two writes to the same container in the same tick are the condition. MEAS per run.

(3) **Trace** the write path from `syncCreateCompositionLink` to the store (the action dispatched, any batching, `values` read-modify-write on the parent's reference, timers): look for a read-modify-write of the container's `values` that two concurrent writes can interleave, the timer-based store send the snapshot lane noted (`reducer.ts` about 1148-1169), and the uniqueness gate of `addObject` (lane P-2026-11-08-2157 handoff). Say whether users can hit it (two quick drops into the same container, paste of several children, JjScript creates) or only scripted bursts.

(4) Commit the report and the probe (`docs(dcn): lost containment write discovery (P-2026-11-09-1020)`, `test(dcn): ...`), Status flip of this prompt. `git add` only named files. No push, no merge. Final message: the cause (or the candidates), how it was measured, who can hit it, fix options with their layers, open questions with Recommended, then the Outcome.

## DOVE

Read anything; write docs/discovery/discovery_2026-11-09_lost_containment_write.md, one probe under frontend/scripts/probe/, this prompt's Status. Nothing else.

## RIFERIMENTI

docs/log-inbox/dcn.md (entry of P-2026-11-08-1939, ticket paragraph); frontend/scripts/probe/dcn-drone-fixture.ts (`repairContainment`, `buildLinks`); CLAUDE.md §3; frontend/src/model/CLAUDE.md §9.3.

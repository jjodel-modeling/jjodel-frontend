# DCN slice 5, lane 0: the drone gets the UML object viewpoint

Prompt-ID: P-2026-11-08-1939
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (probe fixture and exports only; no frontend/src)
Depends: R-DCN-29 (the drone fixture gains the UML object viewpoint); discovery docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A (H2 falsified) and §D lane 0
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No edit under frontend/src. No subagents, no background tasks. Every reply opens with [P-2026-11-08-1939 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: never read a fixture or probe whole (grep, then about 60 lines around); summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep only MEAS, FAIL and DONE lines; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Commit as soon as an item is green.

## COSA

(1) In `frontend/scripts/probe/dcn-drone-fixture.ts`, give the drone's object level the UML object diagram viewpoint used by `frontend/scripts/probe/uml-class-object-fixture.ts` (about lines 445-453: the object views, `OBJECT_VIEWS` or equivalent). Copy the view definitions into the drone fixture; do not import the UML fixture (importing it sets GV_OUT, discovery §D). The instance nodes then draw their slots as rows (`IRRow`), not as separate Slot nodes. Keep the class-level views as they are.

(2) Regenerate both exports in `~/jjodel-demo-exports/dcn/` and the screenshots and `dcn-drone.json` in `docs/discovery/assets/dcn-drone/`. The fixture checks stay green (26/26 or the current count): zero dcn and instantiation problems, conformance clean. Add a check that the object diagram of the export uses the UML object viewpoint (counts the instance nodes drawn with it). Save the previous exports under `~/.jjodel-lanes/P-2026-11-08-1939/prev/`.

(3) Re-run `frontend/scripts/probe/dcn-drone-run.ts` once on the new export: all its checks green (Reset Charging/Safe, Ready by Tick 20, takeOff admissible only in Ready, no defects line). Adapt only selectors that the view change broke, and say which.

(4) Look at the regenerated object-level screenshot and say what it shows: the six instances with slot rows, readable, no overlap. If nodes overlap, adjust only the object-level grid in the fixture and retake it.

(5) Docs: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: screenshot read by the lane, chat to read it). Status flip of this prompt. Commits: fixture and assets, run probe (if changed), docs. `git add` only named files. Remove any temporary node_modules symlink. No push, no merge. Final message: what changed, MEAS, screenshot description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/scripts/probe/dcn-drone-fixture.ts, frontend/scripts/probe/dcn-drone-run.ts, docs/discovery/assets/dcn-drone/, docs/log-inbox/dcn.md, this prompt; the exports in ~/jjodel-demo-exports/dcn/. Nothing in frontend/src. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-08_dcn_slice5_rendering.md §A, §D; frontend/scripts/probe/uml-class-object-fixture.ts; docs/decisions.md R-DCN-29, R-OI-15, R-OI-16.

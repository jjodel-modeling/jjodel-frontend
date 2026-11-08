# DCN L4.7: fill the drone's empty slots, regenerate the exports

Prompt-ID: P-2026-11-08-1652
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-08 · lane full · 11f6f1c0b · crop letto dalla lane, verifica visiva della chat da fare
Lane: full (probe fixture and exports only; no frontend/src)
Depends: P-2026-11-08-1606 (branch dcn-l46, tip 956990177, not yet on the trunk)
Worktree: ~/jjodel-w-dcn-l47, branch dcn-l47, created from dcn-l46, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 16:04, «via, ok con l'ordine»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No edit under frontend/src. No subagents, no background tasks. Every reply opens with [P-2026-11-08-1652 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline from the first line: never read the fixture or the probes whole (grep the instance and slot names, read about 60 lines around); summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep only MEAS, FAIL and DONE lines; one probe run per tool call; before a probe run wait while the 1-minute load is above 20. Commit as soon as an item is green.

## COSA

(1) **Values.** In `frontend/scripts/probe/dcn-drone-fixture.ts` give a value to every slot that is empty today: `dji.power`, `dji.vmax`, and every slot of the four sensors (`value`, `unit`, `status`, `speed`, `relative`, `intensity`, `presence`, as the fixture names them). Choose values consistent with the invariants of the drone's viewpoints so that the initial state stays `dji.Mode = Charging` and `wau1.Alert = Safe` (read the invariants by grep, do not change them). Where an attribute has a default in the class level, prefer setting the default on the attribute to writing the slot; say which you did for each.

(2) **Regenerate** both exports through the fixture probe: `~/jjodel-demo-exports/dcn/dcn-drone.jjodel` and `dcn-drone-objects.jjodel`, the class-level and object-level screenshots in `docs/discovery/assets/dcn-drone/`, and `dcn-drone.json`. The existing checks of the fixture stay green (25/25 or its current count); report the MEAS lines on dcn and instantiation problems (still zero).

(3) **Run probe.** Re-run `frontend/scripts/probe/dcn-drone-run.ts` once on the new export: the panel shows no defects line (add a check: no element matching the panel's compile-defects line), `dji` still reaches `Mode = Ready` within 20 Ticks, `takeOff` behaves as before. If Ready now needs more than 20 Ticks or is never reached, report the classification per Tick and stop with Outcome: question. Crop `1-reset` into `~/.jjodel-lanes/P-2026-11-08-1652/crops/`.

(4) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters measured with `wc -m`; Corregge: the empty-slot finding of P-2026-11-08-0329; Causa the dash; Layer Impact Report not-required; Smoke visivo: crop read by the lane, chat to read it). Status flip of this prompt. Commits: fixture and assets (`test(dcn): ...`), run probe (`test(dcn): ...`), docs. `git add` only named files. Remove any temporary node_modules symlink. No push, no merge. Final message: values chosen, MEAS, crop description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/scripts/probe/dcn-drone-fixture.ts, frontend/scripts/probe/dcn-drone-run.ts, docs/discovery/assets/dcn-drone/, docs/log-inbox/dcn.md, this prompt; the exports in ~/jjodel-demo-exports/dcn/. Nothing in frontend/src. Nothing else; ask first.

## RIFERIMENTI

docs/log-inbox/dcn.md (entries of P-2026-11-08-0011/0057 and 0329); docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §5 (the drone's W5 gaps); docs/decisions.md R-DCN-3, R-DCN-20.

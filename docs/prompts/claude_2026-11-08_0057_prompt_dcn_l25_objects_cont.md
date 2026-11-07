# DCN L2.5 continuation: rerun the probe, view the screenshot, commit

Prompt-ID: P-2026-11-08-0057
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (continuation of P-2026-11-08-0011, stopped at the context ceiling; probe fixture and measures only, no frontend/src)
Corregge: 2026-11-08 00:42 (P-2026-11-08-0011 stopped at the context ceiling, AM-8, with the fixture rewritten and uncommitted)
Worktree: ~/jjodel-w-dcn-l25, branch dcn-l25, at the commit that adds this prompt on top of 2a433667e
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the uncommitted changes are exactly `frontend/scripts/probe/dcn-drone-fixture.ts`, `docs/discovery/assets/dcn-drone/dcn-drone.json` and `docs/discovery/assets/dcn-drone/dcn-drone-class-level-light.png` (modified), plus the gitignored node_modules symlink; otherwise stop with Outcome: blocked. Do not discard that work: continue it. No subagents, no background tasks. Every reply opens with [P-2026-11-08-0057 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a probe log, grep only MEAS and FAIL lines. Before each browser probe run check uptime: wait while the 1-minute load is above 20.

## Contesto (non rifare l'analisi)

Read only ~/.jjodel-lanes/P-2026-11-08-0011/handoff.md and the prompt claude_2026-11-08_0011_prompt_*.md, whose COSA, HARD STOP and NON FARE stand. Run 2 passed all 25 checks; run 3 failed O-2 and O-4 with "the host created no instance" on one value/link write, with the same write code. The deviation of four sensors instead of two is accepted by the chat (the Alert invariants read all four).

## COSA

(1) **Run 3 failure.** Rerun the probe once with load below 20. If it passes all checks, record it as a load flake and say so. If it fails again on the same write, find the cause in the fixture (a write issued before the host has the instance: wait on the instance id the way the passing writes do) and fix it in the fixture only; rerun until two consecutive runs pass. If the cause is in frontend/src, stop with Outcome: question.

(2) **Screenshot.** View `crops/dcn-drone-objects-light.png` (the path the handoff names) and say what it shows: the six instances, the links, the slot values of `dji` including chargeRate. If nodes overlap so that slots cannot be read, adjust only the object-level grid in the fixture and retake it. Copy the final screenshot to `docs/discovery/assets/dcn-drone/dcn-drone-objects-light.png`.

(3) **Exports.** Check that `~/jjodel-demo-exports/dcn/dcn-drone.jjodel` and `dcn-drone-objects.jjodel` exist and were written by the passing run (mtime). Say whether the dcn roles are bound in the exported metamodel bag.

(4) **Conformance warnings.** The 16 `type_mismatch` warnings on DCN action bodies are fixed on the trunk by P-2026-11-08-0010 (merge 23b47e83c), not on this branch. Do not merge the trunk here; list them as expected in the log entry.

(5) **Commits and docs.** Remove the node_modules symlink. One commit for the fixture and the assets (`test(dcn): drone object diagram on R-OI instantiation (P-2026-11-08-0011)`), one docs commit with one log entry in docs/log-inbox/dcn.md via the log-entry skill covering 0011 and this continuation (Notes under 500 characters: MEAS summary, run-3 verdict, four sensors, the exports; Corregge and Causa the dash; Layer Impact Report not-required; Smoke visivo: screenshot read by the lane, chat to read it), and the Status flip of both prompt files. `git add` only named files. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/scripts/probe/dcn-drone-fixture.ts; docs/discovery/assets/dcn-drone/; docs/log-inbox/dcn.md; the two prompt files. Nothing in frontend/src. Nothing else; ask first.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0011/handoff.md, handoff.diff; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §4; docs/decisions.md R-DCN-3, R-DCN-20, R-DCN-24.

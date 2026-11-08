# DCN slice 5, ticket lane: bare invocation arguments; panel chips follow the shown step

Prompt-ID: P-2026-11-09-0055
Chat: C-2026-11-06-2159
Front: dcn
Status: da eseguire
Lane: full (two small fixes, one commit each; probe check)
Depends: tickets of P-2026-11-08-1606 (bare argument `rate` halts in an action) and P-2026-11-08-2042 (Classification chips stay on the live step at step back, R-SIM-106), both in docs/log-inbox/dcn.md
Worktree: ~/jjodel-w-dcn-s5, branch dcn-s5, at the commit that adds this prompt
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-08 18:21, «Go su tutto»)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is the commit that adds this prompt and the tree is clean; otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 file. No subagents, no background tasks. Every reply opens with [P-2026-11-09-0055 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question carries `Recommended: <one line>`. Context discipline: grep first, about 60 lines around; never read a whole file over 400 lines; summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test, build or probe log; one probe run per tool call; before a probe run wait while the 1-minute load is above 20.

## COSA

(1) **Bare arguments.** In a DCN action body, an invocation argument read by its bare name (`self.chargeRate := rate`) halts today with `'rate' does not exist`, because the actions context built in `model/simulation/dcn/dcnStep.ts` (about line 291) does not bind the event's inputs by name; only `self.[rate]` (R-SIM-88) works. Bind each declared input of the invoked operation as a name in the actions context, and in the guard context of its precondition if the same gap exists there; a parameter shadowed by a slot of the same name keeps the slot (say which way the existing `self.[name]` form resolves and keep it consistent). Red test first in `dcn/__tests__/dcnStep.test.ts`: `charge(rate = 5)` with body `self.chargeRate := rate` sets chargeRate to 5. Commit.

(2) **Chips at step back.** The panel's Classification chips (`markingChips` for a DCN run, through `simBridge.ts`) read the live state, while the run card and the classification line follow the shown step (R-SIM-106). Make the chips read the shown step's configuration the same way the marking line does for Petri. Red test first in `sim/__tests__/simBridge.test.ts` (step forward, move the view back, chips show the earlier classification). Commit.

(3) **Probe**: one run of `frontend/scripts/probe/dcn-drone-run.ts` with one added check: after takeOff and three Ticks, move the slider to step 0 and the chips read `dji.Mode = Charging`. If `charge` is reachable in the drone (Charging, with its argument asked by the panel), add a check that `dji.charge(rate = 3)` sets chargeRate 3 on the card; otherwise say why not. Crop `1-stepback-chips` into `~/.jjodel-lanes/P-2026-11-09-0055/crops/`.

(4) **Gates**: typecheck, full vitest (baseline 3 known import reds; load reds rerun alone and named), build, check:docs. Mutation bench on both fixes (at least 6 mutants).

(5) **Docs**: one log entry in docs/log-inbox/dcn.md via the log-entry skill (Notes at most 480 characters by `wc -m`; Corregge: the two tickets; Causa one line each; Layer Impact Report not-required; Smoke visivo: crop read by the lane, chat to read it). Status flip of this prompt. `git add` only named files. Remove any temporary node_modules link. No push, no merge. Final message: files and commits, gate table, mutants, probe MEAS, crop description, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/model/simulation/dcn/dcnStep.ts and its test; frontend/src/components/editor-v2/sim/simBridge.ts and its test; sim/SimulationPanel.tsx only if the chips are computed there; frontend/scripts/probe/dcn-drone-run.ts; docs/log-inbox/dcn.md; this prompt. Nothing else; ask first.

## RIFERIMENTI

docs/log-inbox/dcn.md (ticket paragraphs of P-2026-11-08-1606 and P-2026-11-08-2042); docs/decisions.md R-SIM-88, R-SIM-106, R-DCN-22.

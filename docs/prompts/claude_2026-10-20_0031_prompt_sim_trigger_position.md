# Simulator: compile defect `trigger-position` for a trigger that fork or join fusion drops

Prompt-ID: P-2026-10-20-0031
Chat: C-2026-10-20-0003
Front: maintenance
Lane: full (stcChecks, simBridge, their tests, decisions row)
Status: da eseguire
Request: https://claude.ai/code/session_01Mk7LmH7N6YcSQiKx7oNZP5 (Alfonso, 2026-10-20 00:03: «chiudi tutto quello che puoi chiudere, compresi i ticket, vai in /lane auto»; ticket from P-2026-10-10-1630, discovery §11 item 2, next step 2 of the simulator front in the 2026-10-10 session)
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-trigpos`, branch `sim-trigger-position`, created by the chat from the trunk; the commit that adds this prompt is on the branch. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-20-0031 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. Node: `~/.local/bin/node`. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context (measured, do not redo)

`docs/discovery/discovery_2026-10-10_sim_event_attributes.md` §11 item 2: a trigger on an out edge of a fork, or on an in edge of a join, is silently dropped (the run reads only the trigger of the choice edge of a fused transition, R-SIM-31(3); the dropping site is cited there as `run:36-38`). The P3 and P4 defects of R-SIM-144 (`event`, `event-feature`) show the pattern for a Reset-time compile defect that also lands in the problems registry (R-SIM-61, R-SIM-70): `frontend/src/model/simulation/stcChecks.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts` and their tests.

## COSA

1. Tests first (red): a statechart where a fork has a triggered out edge, and one where a join has a triggered in edge, each gives at Reset one defect `trigger-position` naming the edge and the fork or join; a trigger on the choice edge of the fused transition gives none; a net without forks and joins is unchanged (parity: existing simulation tests stay green).
2. Add the defect beside `event` and `event-feature`, with the same severity class and the same registry path. Message in English, short, naming the edge and why: its trigger is ignored because fusion takes the trigger of the choice edge.
3. A decision row `R-SIM-147` in `docs/decisions.md`, marked provisional/unattended (RC-25), one paragraph, in the style of R-SIM-144. If 147 is taken, use the next free number (R-SIM-145 is reserved, never use it).
4. Gates: typecheck at baseline (CLAUDE.md §17), vitest on `src/model/simulation` and `src/components/editor-v2/sim`, `npm run build` exit 0.
5. Commits (`git add` named files only): `test(sim): trigger-position defect (P-2026-10-20-0031)`, `feat(sim): compile defect trigger-position for triggers dropped by fork or join fusion (P-2026-10-20-0031)` with trailer `Model:` (P6); then `docs: R-SIM row, Status flip and log entry (P-2026-10-20-0031)`. `check:docs` from `frontend/`.

## DOVE

`frontend/src/model/simulation/stcChecks.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts` only if the registry wiring needs it, their tests, `docs/decisions.md` (one row), the log inbox of the simulator front (or `docs/log-inbox/maintenance.md` if none), this prompt.

## NON FARE

No change to the run semantics: the trigger stays ignored, only reported. No change to the nuXmv spec. No UI file. No critical-zone file. No push, no merge.

## HARD STOP

None planned (no visual change: the defect appears in the existing problems list). `question` if the defect cannot be raised without touching the run or the spec.

## RIFERIMENTI

R-SIM-31, R-SIM-61, R-SIM-70, R-SIM-144 in `docs/decisions.md`; the discovery report above; `docs/claude-code-log.md` entry of P-2026-10-10-1630.

# Tack S1: adapter boundary around the lane-run collector

Prompt-ID: P-2026-10-21-1210
Chat: C-2026-10-19-1748
Front: tack
Lane: full (moves a collector behind an interface; one stale store column removed)
Status: da eseguire
Corregge: —
Request: Alfonso, 2026-10-21 10:19, in the project chat: «via sulle raccomandazioni della nota di design (fetta S1)»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the analysis is `tack/docs/design-monitor-vs-spec.md`, merged in P-2026-10-20-1023). P8 replaced as in the earlier Tack slices: the chat checks the board after exit (RC-23).

Worktree: `~/jjodel-w-tack-s1a`, branch `tack-s1a`, created by `lane-run start` from the trunk. Before anything else: `pwd`, branch, `git log -1` and `git status --short` are as `lane-run` set them; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-21-1210 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

**Context budget.** Read §1 and §7 of `tack/docs/design-monitor-vs-spec.md`, not the whole note. Open a Tack file only to change it or to find its callers. Run tests with `--test-reporter=dot` and print only failures. Write a handoff at 150k.

## COSA
1. **Adapter boundary** (design note §7 item 1). Define an adapter interface in `tack/src/collectors/` (name it after a grep: no collision) with what the core needs from a trace source: discover units, read a unit, liveness, last outcome. Put the existing `collectors/lane-run/` behind it. Move the Prompt-ID pattern out of `tack/contract/` into the adapter's configuration, so `contract/` names no Jjodel convention. The two core violations listed in §1 of the note go. **No behaviour change**: `tack parity jjodel` output byte-identical before and after (save both and `cmp` them), all existing tests green unchanged.
2. **Two-run test.** A fixture lane folder whose log holds a first run closed (`exit.txt` of run 1 present, outcome `done`) and a second run still going (no exit for run 2, pid alive in the fixture): the lane is `running`, never `done`. If it already passes, keep it as a guard; if it fails, stop with `Outcome: question` before fixing (that is a behaviour change).
3. **Stale `lanes.outcome`.** The column filled by `laneOutcome` in `collect.mjs` (around lines 95-109) is no longer read for state (liveness plus `last_outcome` is). Find every reader with a grep. If none outside the collector and the API, drop the writer, the API field and the column (additive migration rule: a new schema step that rebuilds or ignores it, as the store's own convention dictates; read `tack/src/store/open.mjs` first). Separate commit after item 1; `parity jjodel` then differs only by that field, and the lane says so with the diff.

Out of scope: X14 (closure on `done` against the spec's `eseguito`) is the closure domain, slice S5; do not touch the closure rule.

## DOVE
`tack/**`, `docs/log-inbox/tack.md` (one entry), this prompt's `Status:` line. Nothing else.

## NON FARE
No new dependency. No change to `frontend/**`, `lane-run.mjs`, `.claude/`, `~/.claude/`. No change to the closure rule or to the views. No push.

## HARD STOP
None planned: close with `Outcome: done`, or `Outcome: question` for item 2 failing or an RC-26 item.

## Gates
`node --test` on `tack/test` all green with the new test; `tack check` green on the fixtures; `cmp` of the two `parity jjodel` outputs for the item 1 commit; `npm run check:docs` from `frontend/`. Board on port 4710 restarted from this worktree with `TACK_NOTIFY=off` and the store copy `/tmp/tack-s8/real.db` (stop the running one first, after checking it is a `tack` node process), left running.

## RIFERIMENTI
- `tack/docs/design-monitor-vs-spec.md` §1, §7
- `docs/decisions.md` R-TACK-7

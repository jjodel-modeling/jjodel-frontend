# Ontological instantiation, S3a continuation 2: acceptance probe, regression, assets, closing entry

Prompt-ID: P-2026-10-21-1636
Chat: C-2026-10-21-1405
Front: instance-of
Lane: full (problems/ is in the critical-zone table of CLAUDE.md 3.1; Layer Impact Report in the discovery and restated by P-2026-10-21-1600)
Status: eseguito 2026-10-21 · lane oi-s3a · probe bb99637b4 (8/8, M4 red), closing 329bda77e · undo-inline-edit 33/33, onto-s2-instantiate 21/21 · visual check by the chat on the crops passed, Alfonso GO pending
Request: none (the chat has no shareable URL; Alfonso's words are kept with --request)
Depends: P-2026-10-21-1635
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-s3a`, branch `oi-s3a`, clean, its tip the `feat(onto)` commit of P-2026-10-21-1635. Check
`pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome: blocked`. Model and tier:
heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1636 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Time limit 90 minutes.

- **No subagent, no task in background.** Dev server and probes in the foreground (P16).
- **Commit each step as soon as its gate is green.**
- **One probe run per tool call.** Record the load average (`uptime`) beside every probe result.
- **Context economy**: read `~/.jjodel-lanes/P-2026-10-21-1600/handoff.md` first; read `onto-s2-instantiate.ts` only
  in the windows the handoff names (import 189-208, binding 231-255); never read `EditorV2.tsx` or `instantiate.ts`
  whole; short tool output; never a whole diff. Probe output: the check lines only.
- No push, no merge. Do not touch `Status`. No product code: a probe failure that needs a product fix stops the lane
  with `Outcome: question` and the evidence.

## COSA

Items 4 to 8 of the handoff's «Remaining checks»:

1. The probe `frontend/scripts/probe/onto-s3a-slot-problems.ts` (new), checks S3-0..S3-7 of the report's oracle; S3-1
   deletes isbn through `L(id).delete()` (R1: the row is not a flow node). M4 on it (drop the `run` branch in
   `onAction`, S3-3 red, reverted). `chore(probe)` commit.
2. Regression: `undo-inline-edit.ts` 33/33 as at `53834b0b2`; `onto-s2-instantiate.ts` all checks pass, file unchanged.
3. Assets in `docs/discovery/assets/onto-s3a/`: dune's node with the badge after S3-2; the overlay open on the
   missing-slot problem with «Sync slots»; dune's node with five rows after the sync. Element crops.
4. Closing entry in `docs/log-inbox/instance-of.md`: shas, gates, probe results with load average, the bench counts
   from `~/.jjodel-lanes/P-2026-10-21-1635/bench.txt` plus M4, the `valueKindFor` deviation, the ceiling stop of
   P-2026-10-21-1600 (Causa (g)), defects found as proposed tickets. One `docs:` commit with the assets.
5. Delete the gitignored throwaways `frontend/scripts/smoke/_tmp_s3a_r1.ts` and `_tmp_lane_vite_3088.config.ts`.

## DOVE

`frontend/scripts/probe/onto-s3a-slot-problems.ts`, `docs/discovery/assets/onto-s3a/`, `docs/log-inbox/instance-of.md`.

## HARD STOP

After the docs commit, with `Outcome: done`.

## RIFERIMENTI

`~/.jjodel-lanes/P-2026-10-21-1600/handoff.md`; `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`
(oracle); `frontend/scripts/probe/onto-s2-instantiate.ts`.

# A3 (R-VP-60) back on the current trunk: bring the trunk in, re-measure, visual check

Prompt-ID: P-2026-10-21-1925
Chat: C-2026-10-20-0003
Front: maintenance
Lane: full (merge of a branch 1416 commits behind into a trunk copy, LIR, probes)
Status: da eseguire
Request: https://claude.ai/code/session_01Mk7LmH7N6YcSQiKx7oNZP5 (Alfonso, 2026-10-21 19:15: «ok alle raccomandazioni procedi in modalita lane auto»: R-VP-60 ratified, merge of elk-handles-a3)
Corregge: —
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-a3trunk`, branch `a3-on-trunk`, created by the chat from the trunk; the commit that adds this prompt is on the branch. The A3 work is on branch `elk-handles-a3` (tip 5c578ba53, worktree `~/jjodel-w-elkhandles`, do not edit there). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-21-1925 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole. If you approach the context ceiling, write `~/.jjodel-lanes/P-2026-10-21-1925/handoff.md` and stop with `Outcome: hard-stop`.

## Context (measured, do not redo)

A3 (D-B): handles of an ELK-routed edge pinned to its drawn ends. Withdrawn before MODELS (04c13e039), reinstated on this branch by P-2026-10-10-0915: LIR `docs/lir/lir_2026-10-10_elk_handles_a3.md`, code in `irEdgeViews.ts`, `DynamicHandles.tsx`, `handlePosition.ts`, tests `irElkPorts.test.ts`, probes `elk-handles-loop.ts` and the A3 assertions in `petri-ink-ports.ts`. Measured then: handles more than 1 px off from 33 of 68 to 2 of 68, wrong side 5 to 0, extra bends 0, default views identical; RC-23 passed. R-VP-60 is now ratified by Alfonso (2026-10-21). The Petri classic drag loop the branch was waiting on is fixed on the trunk (Fix A, a69fef5d9, probe 0 crashes).

## COSA

1. `git merge --no-ff elk-handles-a3` into this branch (it starts at the trunk tip). Resolve conflicts keeping the trunk's behaviour everywhere except the A3 hunks; for `petri-ink-ports.ts` and `petri-drag-loop.ts` keep the trunk's file and re-apply only the A3 assertions. List every conflict and how you resolved it in the LIR addendum.
2. Gates: typecheck at baseline (CLAUDE.md §17), vitest on `viewpoint/ir`, `editor-v2/components`, `editor-v2/utils` and every test that imports the three code files, `npm run build`, `npm run smoke`.
3. Re-run the A3 probes on this tip and on the trunk (same pages): handles more than 1 px off, wrong side, extra bends, default views identical, update-depth loop check (`petri-drag-loop.ts`: 0 crashes required). Numbers before and after in the LIR addendum.
4. Commit: the merge commit, then `docs(lir): A3 on the 2026-10-21 trunk, addendum (P-2026-10-21-1925)` with the LIR addendum, the R-VP-60 row updated from provisional to ratified by Alfonso 2026-10-21, the views log-inbox entry and this prompt's `Status:`, uncommitted until the GO (RC-17) except the LIR addendum.
5. Start a dev server on port 3022 from this worktree (detached, PID in `~/.jjodel-lanes/P-2026-10-21-1925/dev.pid`), save crops of the A3 scenes the 0915 lane used (Petri classic, Statechart, one ELK-routed class diagram) under `~/.jjodel-lanes/P-2026-10-21-1925/crops/`, and stop with `Outcome: hard-stop` for the visual check. On the GO: the docs commit, stop the dev server, `check:docs`, `Outcome: done`.

## DOVE

Conflict files of the merge; `docs/lir/lir_2026-10-10_elk_handles_a3.md`; `docs/decisions.md` (R-VP-60 row only); `docs/log-inbox/views.md`; the two probes; this prompt.

## NON FARE

No change beyond conflict resolution and the A3 hunks. No critical-zone file unless a conflict sits there (then stop with `question`). No dev server on 3000, 3001 or 3003. No push, no merge into the trunk.

## RIFERIMENTI

LIR above; R-VP-60 and D-B in `docs/decisions.md`; `docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md` (branch petri-loop-disc); `docs/log-inbox/release-3-1-drag.md` (Fix A).

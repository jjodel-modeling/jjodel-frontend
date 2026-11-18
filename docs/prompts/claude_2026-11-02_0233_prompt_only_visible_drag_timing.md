# Probe: drag timing with no viewpoint, trunk against only-visible-conditional

Prompt-ID: P-2026-11-02-0233
Chat: C-2026-11-01-1434
Front: maintenance
Lane: fast (probe only; no product change)
Status: eseguito 2026-11-02 · lane fast · 604f578ed · drag timing no viewpoint · verifica visiva passata 2026-11-02
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-02-0225

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-onlyviscond`, branch `only-visible-conditional`, HEAD at the commit that adds this prompt, on top
of the code commit of P-2026-11-02-0225. Clean tree, except the uncommitted log entry and Status flips of 0020 and 0225
in `docs/` (leave them alone). Model and tier as pinned, effort as default.

## Lane discipline

Every reply opens with `[P-2026-11-02-0233 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 45 minutes. Grep summary lines only, never cat a
probe log. Load gate before each timing run: `uptime`, 1-minute load ≤ 16. No push, no merge.

## Contesto

P-2026-11-02-0020 could not time the drag with no viewpoint: on both builds the harness model
(`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`) opens on an empty area of the canvas
(ticket #419), so `frontend/scripts/probe/large-model-click-profile.ts` with `CLICK_VP=-` finds no visible node and never
clicks or drags. Open times were measured: trunk 17735 ms, branch 6009 ms (median of three).

## COSA

1. In `large-model-click-profile.ts` only, add an opt-in switch (name it after checking it is free, e.g. `CLICK_FIT=1`)
   that, after the model settles and before picking a node, brings nodes into view in a deterministic way (React Flow
   fitView through the instance, or a fixed viewport over the node bounding box), and records the viewport it used.
   Default behaviour unchanged.
2. Timing, `CLICK_PROD`, `CLICK_VP=-`, `CLICK_FIT=1`: trunk (temporary worktree from `alfonso-frontend-jjtl` at the merge
   base of this branch) against this branch, median of three, load recorded: open, drag, and the drag hitch if the probe
   reports it. Same viewport on both builds.
3. Commit the probe change with explicit pathspec. Append the timing table to the log entry of P-2026-11-02-0225 in
   `docs/log-inbox/maintenance.md` (uncommitted, it is part of the closure docs), and flip the Status of this prompt,
   uncommitted. Remove the temporary worktree and stop every server you started. Exit `Outcome: hard-stop (visual check due)`.

## HARD STOP

If the branch drag is slower than trunk, or the switch cannot bring nodes into view the same way on both builds: stop
with the numbers and one `Recommended:` line. Do not touch product code.

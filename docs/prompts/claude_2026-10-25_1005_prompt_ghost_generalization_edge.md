# Ghost generalization edges: same routing as real edges, no curve under the class

Prompt-ID: P-2026-10-25-1005
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: fast (rendering of ghost edges in the M2 preview)
Depends: P-2026-10-25-0110
Status: da eseguire
Corregge: 2026-10-25 01:10
Request: Alfonso, 2026-10-25 ~10:00 («Procedi», on the curve of the dashed generalization edge of a ghost class)
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by the measures in the log entry. No core change. Critical zone: `portDistribution.ts`, `handlePosition.ts` and `viewpoint/ir/` are not to be edited; reuse their output read-only if needed, or compute the ghost route locally.

Worktree: `~/jjodel-w-jjp-gen`, branch `jjp-gen`, cut from the trunk at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-1005 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. No subagents, no background tasks. Commit as soon as the gates are green. Never read a file over 200 lines whole; outputs through `tail -20` or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-gen.md`. Nothing merges anywhere: the chat merges.

## COSA

On the crop `~/.jjodel-lanes/P-2026-10-25-0110/gin_previewing.png` the dashed generalization edge from the ghost class `RsbNew` to `State` leaves the ghost on its right side, swings in a wide curve under the ghost and enters `State` from the top, crossing the area below the ghost. Real generalization edges on the same canvas are orthogonal.

1. Ghost edges (generalization and reference) use the same path type as real edges of the same kind on that canvas (orthogonal for generalization in the default theme), dashed cyan, with the hollow triangle for generalization.
2. Endpoints on the facing sides of the two boxes (the ghost's side that faces the target and the target's side that faces the ghost); the route must not cross the ghost box or the target box, and should not cross other nodes when a free orthogonal route with at most two bends exists.
3. When the ghost is placed by `previewPlacement.ts`, prefer a placement where the facing sides allow a straight or one-bend route (tie-break only; do not change the clearance rules of P-2026-10-25-0110).

Tests first for the pure route (facing sides, no crossing of the two boxes, bends ≤ 2 when free). Measures in the log: for the probe scene, the path's bends, whether any segment intersects the ghost or `State` rect, the endpoint sides. Re-run `refactoring-side-by-side.ts` and `jjodie-m2-preview.ts`. Crop `gen_previewing.png` into `~/.jjodel-lanes/P-2026-10-25-1005/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build.

## DOVE

`frontend/src/components/editor-v2/preview/previewElements.ts`, `previewPlacement.ts` and their tests, a new pure route helper beside them if needed, the probes if a selector changes, `docs/log-inbox/jjodie-ui-gen.md`, Status of this prompt.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`.

## NON FARE

No critical-zone file, no `reducer.ts`, no planner change, no change to real edges. No merge, no push.

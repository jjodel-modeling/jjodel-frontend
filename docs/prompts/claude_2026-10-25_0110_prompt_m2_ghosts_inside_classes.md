# M2 ghost preview: features inside their class, new classes in free space, no palette beside

Prompt-ID: P-2026-10-25-0110
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: fast (rendering of the M2 ghost preview on the real canvas)
Depends: P-2026-10-25-0040
Status: da eseguire
Corregge: 2026-10-24 16:00
Request: Alfonso, 2026-10-25 ~01:10 («procedi con la lane veloce in /lane auto»), after the crop `~/.jjodel-lanes/P-2026-10-25-0040/sbs_previewing.png`
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by the measures in the log entry. No core change. Critical zone: `frontend/src/components/editor-v2/viewpoint/ir/` and `viewpoint/authoring/` are critical zone (CLAUDE.md §3.1); if drawing a feature inside a class node needs a file there, do not edit it: use the fallback of point 1 and say so in the log.

Worktree: `~/jjodel-w-jjp-gin`, branch `jjp-gin`, cut from the trunk at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-0110 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. No subagents, no background tasks. Commit as soon as the gates are green. Never read a file over 200 lines whole; outputs through `tail -20` or `grep`. If the context passes about 140k, commit what is green, write a handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-gin.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

`frontend/src/components/editor-v2/preview/previewElements.ts` (by ranges: the M2 part added by jjp-m2), `scriptPreviewStore.ts`, the log entries `docs/log-inbox/jjodie-ui-m2.md` and `jjodie-ui-sbs.md`, the crop above.

## COSA

On the real metamodel canvas the M2 ghosts read badly (crop above): an added attribute (`+ rsbExtra`) is a separate box beside its class, cut at the canvas edge; a removed attribute (`rsbLabel`) is a red floating box over an edge label while the class still shows it unmarked; a new class (`RsbNew`) sits on top of the generalization edges.

1. **Features inside their class.** An added attribute, reference or literal appears as a row inside its owner class, after the existing rows, dashed cyan; a removed one stays in its row, struck through in red. Prefer a decoration that the class node already supports from outside the critical zone (a preview prop or context read by the node, a CSS class on the row by feature id). If that is impossible without a critical-zone file, fallback: one ghost compartment snapped flush under the owner node (same x and width, top = node bottom, no gap), holding the added rows, and a red strike overlay positioned exactly on the removed row (measured from the DOM row's rect); never a box floating elsewhere.
2. **New classes in free space.** A new class is placed next to the class it extends or references (right, then below, then left), at the first position whose rect does not intersect any node, edge label or other ghost, with 24 px clearance; edges from the ghost route as today. Inside the viewport if the related class is visible.
3. **No palette while previewing beside.** When the Refactoring tab is beside its target (R-JJD-16), the target canvas's Structure palette is collapsed while a preview is active and restored after Apply or Discard; outside the beside layout nothing changes.

Tests first for the pure placement (free-rect search with clearance, deterministic) and the row mapping. Measures in the log: for the probe scene, the ghost row's rect inside the owner's rect, the strike on the removed row (y within the row ± 2 px), the new class rect intersecting nothing, palette width while previewing and after Discard. Re-run `refactoring-side-by-side.ts` and `jjodie-m2-preview.ts`. Crop `gin_previewing.png` into `~/.jjodel-lanes/P-2026-10-25-0110/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build.

## DOVE

`frontend/src/components/editor-v2/preview/previewElements.ts`, a new pure placement module beside it with its test, `scriptPreviewStore.ts` if the row mapping needs it, the class node's CSS or a non-critical wrapper if point 1 allows it, the palette's collapse hook, the two probes, `docs/log-inbox/jjodie-ui-gin.md`, Status of this prompt. List every source file in the log.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`.

## NON FARE

No critical-zone file, no `reducer.ts`, no planner change. No merge, no push.

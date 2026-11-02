# Canvas: a large model opens on an empty area of the canvas (ticket #419)

Prompt-ID: P-2026-11-02-0646
Chat: C-2026-11-01-1434
Front: maintenance
Lane: full (cause unknown: Phase 1 read-only with report, Phase 2 on the chat's GO)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-openvp`, branch `open-viewport-empty`, cut from `alfonso-frontend-jjtl` at `aa68ad049`, HEAD at the
commit that adds this prompt. Clean tree. Model and tier as pinned, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-02-0646 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 60 minutes per phase. Gates through
`node scripts/run-quiet.mjs`. Context discipline (six lanes in a row stopped at AM-8 on this canvas): grep summary
lines, never cat a probe log or a whole file; write the report before the soft ceiling (RC-51). No push, no merge.

## Contesto (ticket #419, found by P-2026-11-02-0020)

Opening the harness model (`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, 407 nodes)
with no viewpoint lands the canvas on an empty area: `translate(~-1224, -9802) scale(0.5)` in most runs,
`(-1197, -1107)` in others, on trunk and branch alike; no node in view, the user must zoom out or fit by hand. The
`CLICK_FIT` switch of `frontend/scripts/probe/large-model-click-profile.ts` (on branch `only-visible-conditional`,
`604f578ed`, not yet on the trunk) shows that with `minZoom` 0.5 a fit over the node bounding box is clamped and its
centre is that same empty area: the model is larger than the view at minimum zoom, and its centre has no nodes. The
toolbar "fit" button resets zoom to 100% (`Toolbar.tsx:1192-1194`), it does not fit.

## COSA

### Phase 1 (read-only)

1. Find where the viewport at model open is decided (saved viewport, `fitView`/`fitViewOptions`, `useFitViewOptions`,
   a restore from the layout submodel or localStorage), with `file:line` and a verbatim quote, and why it is
   nondeterministic across runs.
2. Say what the user sees and why, in numbers: bounding box of the nodes, viewport size, `minZoom`, resulting transform.
3. Propose the smallest fix that guarantees at least one node in view at open, deterministically for the same file
   (for example: when the clamped fit centre shows no node, centre on the node nearest the bounding-box centre, or on the
   first root node; or lower `minZoom` only for the open fit). Alternatives with the reason each is discarded. Say
   whether it touches `CLAUDE.md` §3 critical zone files.
4. Report in `docs/discovery/discovery_2026-11-02_open_viewport_empty.md` (sections per P4), committed. Exit
   `Outcome: hard-stop`.

### Phase 2 (only after the chat's GO, same session)

5. The fix, tests first where a seam exists. Gates: typecheck, vitest (baseline), build, smoke, `bpmn-lanes` probe 12/12.
   DOM check on the harness fixture: after open with no viewpoint and under BPMN, at least one node is in view, and the
   transform is the same over three opens. Code commit with pathspec; log entry in `docs/log-inbox/maintenance.md`
   closing ticket #419; Status flip, uncommitted (RC-17). Exit `Outcome: hard-stop (visual check due)`.

## HARD STOP

End of Phase 1. In Phase 2, a fix that needs a critical zone file or changes an exported interface: stop, `Recommended:`.

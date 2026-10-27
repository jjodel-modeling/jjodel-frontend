# Prompt: release 3.1, L2, drag-loop hardening (Fix A)

Prompt-ID: P-2026-10-12-0011
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (render path of EditorV2 auto anchors; optional for 3.1)
Depends: P-2026-10-11-1812
Request: none (Alfonso, 2026-10-12 00:06, "ok alle raccomandazioni"; D6 of the 1812 report)
Status: eseguito 2026-10-12 · lane rel31-drag · a69fef5d9 · hard-stop, probe 0 of 66 crashes, control fixed; merged 07bfa0673 (visual GO pending)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-rel31-drag`, branch `rel31-drag`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-12-0011 · session <id>]` and ends with an `Outcome:` line (P16). Gates run in the foreground.

## COSA

Read first: `docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md` (Fix A, guard B) and `docs/discovery/discovery_2026-10-11_release_3_1_scope.md` §5.1. The loop no longer reproduces on the trunk (0 of 72 drags); this lane removes the amplifier so it cannot come back.

1. In `frontend/src/components/editor-v2/hooks/useAutoAnchor.ts` (around 540-630): replace the `useNodes()` subscription (line ~568) with reading `useStoreApi().getState().nodes` at call time, as Fix A describes. No other behaviour change.
2. A unit test that pins it (the hook no longer re-renders on a node position change).
3. Bring the probe of the drag-loop discovery (`scripts/probe/petri-drag-loop.ts` and its fixture, from branch `petri-loop-disc` if not on the trunk) into the tree as this lane's gate. Run it on a dev server of this tree on port 3142: report drags and crashes, with the control `164f846fc` re-run in a `git archive` copy only if time allows.
4. Gates: typecheck 14, vitest, build, smoke on 3142, check:docs.

Report: `docs/discovery/discovery_2026-10-12_rel31_drag_hardening.md` with the diff summary, probe numbers and gates, «Decisions taken (unattended)», «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1-drag.md`. Commit, stop with `Outcome: hard-stop`.

## NON FARE

No push, no merge, no tag. Touch only `useAutoAnchor.ts`, its test, the probe and its fixture, the report and the inbox. Do not implement guard B unless Fix A alone leaves a crash; if so, stop with `Outcome: question`. No critical-zone file (CLAUDE.md §3).

## RIFERIMENTI

CLAUDE.md §3, §17; PROTOCOL P4, P9, P14, P16.

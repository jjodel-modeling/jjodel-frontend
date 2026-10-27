# Canvas: batch the intrinsic measure, take the inset read out of the render, re-measure the MiniMap (fixes 1-3 of round 3)

Prompt-ID: P-2026-10-21-1010
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `viewpoint/ir/useContentSize.ts`, CLAUDE.md §3.1 table; Phase 1 is the round 3 report)
Status: non completato 2026-10-21 · lane perf-round3 · LIR 2c4331c68; code and tests complete but uncommitted at the context ceiling · continued by P-2026-10-21-1115
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-0905
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 10:07, «procedi», on the chat's proposal after the report
`docs/discovery/discovery_2026-10-21_large_model_round3.md` (§5 fixes 1-3, §7 questions 1-2; branch `perf-round3`,
commit `79868633b`). The chat's choices he approved: fix 1 as a batched read/write coordinator (not a content-keyed
cache); fix 3 in the same lane; the MiniMap re-measured once on a quiet machine, then memoised (no visible change) if
the saving is confirmed, otherwise left alone. The lane is started with `--critical-zone-goahead P-2026-10-21-1010`.
A Layer Impact Report is the first step (RC-30).

Worktree: `~/jjodel-w-perfround3`, branch `perf-round3` (same as P-2026-10-21-0905). Model and tier: heavy, as
pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1010 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Every gate runs in the foreground (P16). No
push, no merge. Keep the context lean: read the report's §3.4, §4, §5 and the probe's `lat` step, not the whole
report; short probe logs. Write the handoff before the AM-8 soft ceiling (RC-51). Check the machine load
(`uptime`) before every measurement run and record it; wait while the 1-minute load is above 16.

## COSA

1. `measureIntrinsic` (`frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`): today each IR node, in
   a `useLayoutEffect` with no deps, writes `max-content` styles, reads `offsetWidth/offsetHeight` and restores,
   one forced layout per node per commit, invalidated by the next node's writes. Replace it with a coordinator
   that batches across nodes: the hooks register their element and callback; one scheduled pass (a
   `useLayoutEffect` at the canvas level, or a microtask after the commit) applies every write, then reads every
   size in one layout, then restores. Same measured values as today, same re-measure triggers (`fonts.ready`,
   content change, the existing deps), same handling of unmounts in the middle of a pass. No cache keyed on content:
   the pass runs whenever today's effect would run.
2. `getCanvasRightInset` (`frontend/src/components/editor-v2/viewportInset.ts`) is called inside the
   `EditorV2Inner` render through `fitViewOptions={{ padding: fitPadding() }}` (`EditorV2.tsx:4773`), a
   `getComputedStyle` on the body per render. Take it out of the render: compute it in a ref updated by the inset's
   publisher (or once on mount if React Flow reads `fitViewOptions` only for the initial `fitView`: verify in the
   React Flow source and state which).
3. MiniMap: one re-measurement with `CLICK_ABLATE=minimap`, production build, on a quiet machine (load ≤ 8). If the
   drag saving is ≥ 0.4 s of long tasks against a baseline run of the same session, memoise it in `EditorV2.tsx`:
   `nodeColor` and `style` hoisted out of the render, the node subscription narrowed so a store commit that changes
   no node position or size does not re-render the MiniMap nodes. No change to what is shown. If the saving is not
   confirmed, do nothing and record the two runs.

## DOVE

1. `docs/lir/lir_2026-10-21_intrinsic_batch_inset.md` (LIR, docs commit first).
2. `frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts` and, if the coordinator needs a home, one new
   module beside it (`frontend/src/components/editor-v2/viewpoint/ir/intrinsicMeasureBatch.ts`; grep the name).
3. `frontend/src/components/editor-v2/viewportInset.ts` and the `fitPadding` call site in
   `frontend/src/components/editor-v2/EditorV2.tsx`.
4. `frontend/src/components/editor-v2/EditorV2.tsx`, the MiniMap props only, if item 3 is confirmed.
5. Tests beside the existing ones of these modules (grep first); the probe
   `frontend/scripts/probe/large-model-click-profile.ts` only for an opt-in counter of layout passes per commit, if
   needed for the bench.
6. Closure: `docs/log-inbox/maintenance.md`, the Status lines of P-2026-10-21-0905 and of this prompt.

Nothing else. No change to the IR, the sync layer, the D-layer or persistence.

## COME

1. LIR (layers: canvas v2-flow and IR rendering; no sync, D-layer, JjOM or persistence change). Docs commit.
2. Baseline gates: `npm run typecheck` (0, RC-48), the full vitest count, `npm run build`, through
   `node scripts/run-quiet.mjs` from `frontend/`. Recreate the temporary `frontend/node_modules` symlink for the
   gates (P14) and remove it before the closure.
3. Tests red first, executing the code (P11): the coordinator applies all writes before the first read (a fake
   element records the order of style writes and size reads: no read between two writes); every registered node
   gets its size; an unmount during a pass is skipped without error; the inset function is not called during a
   render (a render-count spy). Mutation bench: (m1) read inside the write loop, (m2) skip the restore, (m3) the
   inset read back in the render; each killed by a named test.
4. Probe acceptance, production build, three runs on a quiet machine, `CLICK_STEPS=open,lat,drag,commit,vp` on
   `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`: ring p50 ≤ 85 ms, move p95
   ≤ 100 ms, drag long tasks ≤ 400 ms (median), click and open not worse than `prod-r3b-1` (open 3345, click 441/367);
   layout passes per commit = 1; BPMN viewpoint 48 nodes and 42 edges, sizes of three nodes equal before and after
   (read `offsetWidth/offsetHeight` of the same three nodes in both builds).
5. One `fix(editor-v2):` commit (code and tests; the MiniMap change in the same commit if confirmed, with its two
   runs in the body), measurements and mutation table in the body, `git add` by path, `Model:` trailer. Closure in
   one docs commit (RC-17). `Outcome: done`. The visual check is the chat's after the merge.

## Rollback

`pre-intrinsic-batch-2026-10-21` on the trunk before this prompt; `lane-run merge` tags again before the merge; undo
with `git revert -m 1 <merge sha>`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_large_model_round3.md` §3.3, §3.4, §4, §5; CLAUDE.md §3.1, §3.2, §5;
`useContentSize.ts:54,97,187`, `viewportInset.ts:14`, `EditorV2.tsx:776,4773`.

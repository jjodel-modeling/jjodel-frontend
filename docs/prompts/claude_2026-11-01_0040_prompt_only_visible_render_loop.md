# Canvas: the render loop of onlyRenderVisibleElements on container viewpoints, then the prop on the trunk

Prompt-ID: P-2026-11-01-0040
Chat: C-2026-10-31-2310
Front: maintenance
Lane: full (the loop may sit in the containment or sizing hooks; Phase 1 read-only, then Phase 2 on the chat's GO)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R4anfHNZ773YAPzu2q
Depends: P-2026-10-31-2335
Corregge: 2026-10-31 23:35

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-onlyvisloop`, branch `only-visible-loop`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Model and tier as pinned (RC-16), effort `xhigh`. Before anything else: `pwd`, branch, `git log -1` and
`git status` are as stated here. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-11-01-0040 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one line:
`Recommended: <one line>`. Time limit 90 minutes per phase. Gates in the foreground through
`node scripts/run-quiet.mjs`. Context discipline (five perf lanes stopped at the AM-8 ceiling): never cat a probe log,
a CPU profile or a render trace, grep the summary lines only; write the report before the soft ceiling (RC-51). Load
gate before each measurement: `uptime`, run only with the 1-minute load ≤ 16 (wait up to 15 minutes, then run and record
the load). No push, no merge.

## Contesto (non rifare l'analisi)

P-2026-10-31-2335 added `onlyRenderVisibleElements` to `<ReactFlow>` in
`frontend/src/components/editor-v2/EditorV2.tsx` (right after `connectionRadius={40}`). On Alfonso's large models
without containers it turns an unusable editor into a normal one (measured by hand on 2026-10-31: same page, prop off
unusable, prop on fluid). On the harness fixture
(`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`), default BPMN viewpoint, model open
never settles: 25,124 React commits against 1 store dispatch, long tasks growing 0.9, 2.2, 3.6 … 19.9 s; trunk opens in
5.1 s. With no viewpoint (`CLICK_VP=-`) the branch settles. The loop lives in React component state, not in the store,
and needs graphVertex containers (BPMN pools and lanes, R-GV). Hypothesis of that lane, not verified: a container hook
(`useIRContainment`, container sizing, `useContentSize`, or the visible-node set fed back into `flowElements`) reacts
to React Flow unmounting a child out of view, changes the nodes, and the change mounts or unmounts other children.
Probe logs of that lane: `/tmp/p2335/`. Its uncommitted diff and log entry stay in `~/jjodel-w-onlyvis`; do not touch it.

## DOVE

`frontend/src/components/editor-v2/EditorV2.tsx` and the hooks the discovery names. Probe:
`frontend/scripts/probe/large-model-click-profile.ts` (dev build for the render counts, `CLICK_PROD` for the timings).

## COSA

### Phase 1 (read-only on product code; probe instrumentation allowed in the probe script only)

1. Reproduce the loop on a dev build with the prop on, harness fixture, BPMN viewpoint, and identify the cycle: which
   components re-render on every round (React Profiler or a render counter injected by the probe, not by product code),
   which state or effect sets the value that closes the loop, with `file:line` and a verbatim quote.
2. Say whether the cycle touches a file of `CLAUDE.md` §3.2 (critical zone) or the D-layer write paths.
3. Propose the fix: the smallest change that breaks the cycle while keeping container sizing and the R-GV-18 edge
   suppression correct for children out of view. Alternatives with the reason each is discarded. A fix that disables
   virtualization on container viewpoints is a fallback, never the recommendation.
4. Write the discovery report at `docs/discovery/discovery_2026-11-01_only_visible_render_loop.md` (P4: hypothesis,
   files read with full paths, findings with `file:line` and verbatim quotes, risks, open questions), commit it with its
   pathspec, then HARD STOP with `Outcome: hard-stop`. The hard stop is not reached until the report is committed.

### Phase 2 (only after the chat's GO, in the same session)

5. Fix and prop, tests first where a unit seam exists. If the fix is in the critical zone, write the Layer Impact Report
   (`docs/discovery/lir_2026-11-01_only_visible_render_loop.md`) before the code.
6. Measure trunk against branch on the harness fixture, `CLICK_PROD`, default passes, BPMN viewpoint and `CLICK_VP=-`:
   model open, drag, viewpoint switch, median of three runs, with the load recorded.
7. Correctness from the DOM, never screenshots: (a) an edge with both endpoints out of the viewport whose path crosses it
   is rendered; (b) after a pan that moves a node out and back, its handle offsets relative to the node are equal within
   1 px; (c) a lane or pool whose children are partly out of view keeps its size, within 1 px, before and after a pan;
   (d) R-GV-18: the edges enclosed by a container with `edges:'hide'` stay hidden after a pan; (e) the minimap shows all
   nodes; (f) no new console errors or warnings.
8. Gates against their baselines: `npm run typecheck`, `npx vitest run`, `npm run build`, `npm run smoke`, the
   `bpmn-lanes` probe. Code commit with pathspec, then the log entry in `docs/log-inbox/maintenance.md` and the Status
   flip, uncommitted: a visual check is due (RC-17). Exit with `Outcome: hard-stop (visual check due)`.

## HARD STOP

End of Phase 1. In Phase 2: if any check of step 7 fails, or the open on the BPMN viewpoint is slower than on trunk,
stop before the code commit with the numbers and one `Recommended:` line.

## NON FARE

Do not edit product code in Phase 1. Do not touch `~/jjodel-w-onlyvis`. Do not change `MiniMap` props. No new
dependencies. No refactoring of the hooks beyond the cycle.

## RIFERIMENTI

`docs/prompts/claude_2026-10-31_2335_prompt_canvas_only_visible_elements.md` and its log entry (uncommitted in
`~/jjodel-w-onlyvis/docs/log-inbox/maintenance.md`); R-GV-18 in `docs/decisions.md`; `docs/discovery/discovery_2026-10-21_large_model_round3.md`
and `lir_2026-10-21_intrinsic_cache.md` for the intrinsic-measure cache.

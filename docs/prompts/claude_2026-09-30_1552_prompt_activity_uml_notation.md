# Prompt: Phase 1 and 2 in cascade, the «Activity (UML)» notation for the derived viewpoints

Prompt-ID: P-2026-09-30-1552
Chat: C-2026-09-30-1458
Lane: Phase 1 then Phase 2 in cascade (critical zone possible: `irTypes.ts`, `irCompile`, `irEdgeViews.ts`, `UnifiedEdge.tsx`; Layer Impact Report required). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of the A2 lane (P-2026-09-30-1521, Petri classic and open arrowheads) and its Status flip, not merged, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt, and `git log --oneline -8` contains the A2 lane's commits; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-09-30, on DemoFlowB derived with today's notation: «la notazione non è per niente conforme alla notazione comunemente nota, ad esempio il decision node è tipicamente un diamond, molto bene invece le condizioni sugli edge in uscita, i join sono quelli delle reti di petri e inizio e fine inusuali sia nell'aspetto che nelle dimensioni»; on the mockup: «il nuovo mockup UML activity è ottimo». Target: the boards «A · UML activity, top-down» and «B · UML activity, left to right» of the design canvas `https://claude.ai/artifact/2zcZ84EkYUUq7ZhMqVJFKg` (row «DemoFlowB · UML activity»). DemoFlowB's metaclasses are UML's own: `InitialNode`, `Activity`, `Decision`, `Fork`, `Join`, `FinalNode`, `ControlFlow`.

A **new notation «Activity (UML)»** in the dialog, beside the others, nothing existing changes (as R-VP-22..24):

1. Initial node: a filled circle, 20 px, ink fill, no name.
2. Action (the role bound to `Activity`, or any node that is not one of the others): a rounded rectangle, radius 14, height 44, the name centred, 13 px weight 500.
3. Decision and merge: a hollow diamond 36×36, no name drawn inside or beside.
4. Fork and join: a filled bar 5 px thick, perpendicular to the flow and long enough to span its branches (at least 120 px). If the IR cannot orient or size the bar from the edges, a fixed bar in the orientation the report recommends, and say so.
5. Activity final: a bullseye, outer 24 px hollow, inner 14 px filled; no name.
6. Control flow: open arrowhead (R-VP-25), a guard on an edge leaving a decision drawn as `[` + the guard expression verbatim + `]` (the C2 label template and halo), no other edge label.
7. Reuse what A1 (Statechart), A3 (ISO diamond) and A2 (bar) already built; new optional IR keys only if unavoidable, each reported (R-B9).
8. **DemoFlowB preselects «Activity (UML)»** and **DemoPEST preselects «Statechart (UML)»** (Alfonso accepted on 2026-09-30 the recommendation that the demos use the new notations; the A2 report found that DemoPEST and DemoFlowB still open on State machine and Flowchart); DemoPetri keeps «Petri net (classic)», DemoESM keeps its own. Binding: prefilled from the flowchart/activity simulation profile and the name signals (`initial|start`, `final|end`, `decision|choice|branch`, `fork`, `join`), editable in the dialog table.

Out of scope: the size leak the A2 probe found (a node keeps the derived size back in the default viewpoint), fixed by lane P-2026-09-30-1625 on the trunk. Layout is out of scope too: the derived view keeps the model's positions (the layout lane comes after the freeze).

Row in `docs/decisions.md`: **R-VP-26**, ratified by Alfonso 2026-09-30, «Activity (UML)» beside R-VP-22's notations, DemoFlowB preselects it (amends R-VP-22: the demos open on the new notations, DemoFlowB on Activity (UML), DemoPEST on Statechart (UML)), IR keys if any.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_activity_uml_notation.md`, Layer Impact Report first, what A1, A2 and A3 give for free, the bar orientation question, questions with `Recommended:`. Commit it (`docs:`), then Phase 2 in cascade unless a question has no single recommendation or leaves the files below.

Phase 2: `derive/notations.ts`, `viewpointDerivation.ts`, `DeriveViewpointDialog.tsx` (the entry and the DemoFlowB preselection only), `irTypes.ts`, `irCompile`, `irValidate`, `irEdgeViews.ts`, `UnifiedEdge.tsx` only if an IR key is unavoidable, their tests; `docs/decisions.md` (R-VP-26), a log entry in `docs/log-inbox/views.md`, this prompt's Status. Anything else (`portDistribution.ts`, `useJjomSync.ts`, `canvasToJjom.ts` above all): stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, R-VP-15..25, the A1, A3 and A2 reports.
2. Phase 1 report, committed.
3. Tests first: every other notation's output byte-identical to the A2 tip; the Activity (UML) views on DemoFlowB (initial, actions, diamond, bars, final, bracketed guards, open arrowheads); the prefill on the four demos; `irValidate` for any new key. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: DemoFlowB derived as «Activity (UML)» and as Flowchart (ISO 5807); crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_actuml_crops/`; the four demo scenes in the default viewpoint 0 px from the A2 tip, same exclusions as A4.
6. Commits: `feat:` code and tests, `docs:` report, R-VP-26, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the measures, the mutation score, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, renaming or removing an existing IR property, changing the output of an existing notation or of the default viewpoint.

## RIFERIMENTI

Design canvas row «DemoFlowB · UML activity»; R-VP-15..25; the A1, A2, A3 reports in `docs/discovery/`; `scene_4_DemoFlowB` (metaclasses above).

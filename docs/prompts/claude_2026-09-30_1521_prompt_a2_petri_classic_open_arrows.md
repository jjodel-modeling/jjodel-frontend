# Prompt: Phase 1 and 2 in cascade, slice A2 «Petri net (classic)» and open arrowheads in the derived notations

Prompt-ID: P-2026-09-30-1521
Chat: C-2026-09-30-1458
Lane: Phase 1 then Phase 2 in cascade (critical zone: `irTypes.ts`, `irCompile`, `irEdgeViews.ts`, `UnifiedEdge.tsx`; Layer Impact Report required). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of C1, C2, D, A1+A3, A4 and the checkpoint `43473dd89`, not merged, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso's review of 2026-09-30 on the crops of C1, C2, D, A1+A3, A4 (verbatim): «Q1: Mockup A; Q2: ratificato ma con frecce aperte; Q3a: ok; Q3b: ok; Q3c: ok; the rest is ok». So R-VP-19..23 stand, R-VP-21 is ratified, the demos use Statechart (UML) and Flowchart (ISO 5807), and two changes remain before the merge of `viewpoint-notations`:

1. **Petri A.** Slice A2 of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §5 (row «A2 Petri classic»), target `docs/mockups/derived-viewpoints/petri-A.svg`. As for A1, A3 and A4 (R-VP-22, R-VP-23), it is a **new notation «Petri net (classic)»** in the dialog, beside the ratified Petri notation of R-VP-16, which stays as it is. What the mockup shows: the initial marking as token dots inside the place (the `dots-2..4` markers already in the registry, a number from 5); the place name outside the circle (below by default, the existing `LabelPosition 'outside'` of lane `label-outside-pos` if it serves, else say so); the transition as a thin bar 10×44 (the existing `ShapeForm 'bar'` if its size can follow the bar's orientation, else a fixed vertical bar and say so); arcs curved (`edge.curve: 'arc'` of R-VP-22); arc weight > 1 as a label on the arc; the inhibitor arc ending in a hollow circle (new `EdgeTermination 'hollowCircle'`, the name ratified in R-VP-15 (1)). Ink stays the ratified `var(--color-inode-name)` at 1 px (Alfonso: «ratificato»). **DemoPetri preselects «Petri net (classic)»** in the dialog, as DemoPEST and DemoFlowB preselect theirs.
2. **Open arrowheads.** Every derived notation that draws an arrowhead (Generic, State machine, Statechart (UML), Flowchart, Flowchart (ISO 5807), Petri of R-VP-16 and the new classic one) uses `EdgeTermination 'openArrow'` (already in the union, `irTypes.ts:609`) where it uses `'closedArrow'` today. Chen lines keep no arrowhead; the default viewpoint (M2 and M1 native views) is not touched: its generalization triangle and UML ends stay.

Decisions of the chat: the notation's internal id `petriClassic` (grep first); a question inside this perimeter with a single `Recommended:` answer is adopted (RC-21) and written in the report.

Rows in `docs/decisions.md` (format of R-VP-15..23): **R-VP-24**, ratified by Alfonso 2026-09-30, «Petri net (classic)» after mockup A beside R-VP-16, `hollowCircle` persisted (R-B9), DemoPetri preselects it; **R-VP-25**, ratified by Alfonso 2026-09-30, open arrowheads in every derived notation, amends the «filled arrowhead» kept by R-VP-16 and the arrowheads of R-VP-17, R-VP-19 and R-VP-22; and one line under R-VP-21 recording its ratification by Alfonso on 2026-09-30 (the row text itself unchanged).

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-09-30_a2_petri_classic_open_arrows.md` with the Layer Impact Report first, the files and lines each change needs, what the existing `bar`, `outside` label and `dots-*` markers can and cannot do for the mockup, and the questions with `Recommended:`. Commit it (`docs:`), then go on to Phase 2 in cascade without stopping, unless a question has no single recommendation or leaves the files below.

Phase 2: `irTypes.ts`, `irCompile`, `irValidate`, `irEdgeViews.ts`, `UnifiedEdge.tsx`, `EdgeAuthoringPanel` only if the new termination must be listed there, `derive/notations.ts`, `viewpointDerivation.ts`, `DeriveViewpointDialog.tsx` only for the new entry and the DemoPetri preselection, their tests; `docs/decisions.md` (R-VP-24, R-VP-25, the R-VP-21 line), a log entry in `docs/log-inbox/views.md`, this prompt's Status. Any other file (`portDistribution.ts`, `useJjomSync.ts`, `canvasToJjom.ts` above all): stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the discovery §1, §4, §5, R-VP-15..23.
2. Phase 1 report as above, committed.
3. Tests first: every existing fixture hash unchanged except the arrowhead termination of derived views (list which fixtures move and why); `irValidate` for `hollowCircle`; the classic Petri views (dots, outside names, bar, arcs, weight label, inhibitor); the open arrowhead in each derived notation; the R-VP-16 Petri notation unchanged except its arrowhead. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: DemoPetri derived as «Petri net (classic)» and as the R-VP-16 Petri; DemoPEST as Statechart (UML); DemoFlowB as Flowchart (ISO 5807); one Generic; crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_a2_crops/`; the four demo scenes in the default viewpoint 0 px from `43473dd89`, same procedure and exclusions as A4 (the right rail, the Jjodie launcher pulse, the binding written by the probe).
6. Commits: `feat:` code and tests, `docs:` report, rows, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the measures, the mutation score, the questions adopted.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, renaming or removing an existing IR property, changing the output of the default viewpoint.

## RIFERIMENTI

Discovery `ee7206d0c` §1, §4, §5 (row A2); R-VP-15..23; mockup `petri-A.svg`; `irTypes.ts:609` (`EdgeTermination`); crops of the review in `frontend/scripts/smoke/_tmp_review_3_1.html` (gitignored).

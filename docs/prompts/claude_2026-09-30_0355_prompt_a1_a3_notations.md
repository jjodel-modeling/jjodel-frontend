# Prompt: Phase 2, slices A1 and A3, the Statechart (UML) and Flowchart (ISO 5807) notations

Prompt-ID: P-2026-09-30-0355
Chat: C-2026-09-29-2230
Lane: Phase 2 (critical zone: `irTypes.ts`, `irCompile`, `irEdgeViews.ts`, `IRNodeContent.tsx`, `irStyle`; Layer Impact Report required). Tier: heavy.
Status: eseguito 2026-09-30 · lane viewpoint-notations · 74995f429 · non fuso: hard-stop, lane probe on 3076 (light) 15/23 (8 read in the report §2: rail content, the bag, a 0.01 px tip), crops in frontend/scripts/smoke/_tmp_a1a3_crops/ (gitignored), mutation bench 46/46, R-VP-22 nel commit docs, verifica visiva alla chat
Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations`, on top of C1, C2 and D (`64ea9f216`, `4c6b4f315`), not merged, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Slices A1 and A3 of `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` §5. Targets: `docs/mockups/derived-viewpoints/statechart-A.svg` and `flowchart-A-iso5807.svg`, element by element.

The chat's decision (Alfonso's delegation of 2026-09-29 evening): both are **new notations added to the dialog of slice D**, beside the existing ones, not replacements. «State machine» (R-VP-17, solid Initial disc) and «Flowchart» (R-VP-17 activity style) stay exactly as they are; «Statechart (UML)» and «Flowchart (ISO 5807)» are new entries. No ratified row is amended; Alfonso chooses in the morning which one the demo uses.

**A1, Statechart (UML)**, same profile and prefill as State machine (`stateMachine`):

1. States: rounded boxes sized from the content, name centred 14 px weight 600, 1 px border in the ratified ink `var(--color-inode-name)`, white fill. Initial is a state box like the others plus an entry mark: a small filled dot outside the box with a short arrow into it. Terminal: the same box with the `double` border (as R-VP-17). No solid disc.
2. New optional IR keys (absent = today, every existing hash unchanged): `ShapeSpec.entry?: 'dot' | 'arrow'` (the mark drawn outside the box, left side; `'arrow'` is the arrow without the dot, for the Automaton notation later); `edge.curve?: 'arc'`. With `curve: 'arc'`: a pair of opposite edges between the same two nodes bows apart as two quadratic arcs, each label at its apex; a single edge stays straight; a self-loop is a cubic loop above the node, entering and leaving the top edge, label above it.
3. Fix, only for edges with `curve: 'arc'`, the three causes found by C3 (`docs/discovery/discovery_2026-09-29_ir_edge_ports.md`, branch `ir-edge-ports`, read with `git show fb8944688:docs/discovery/discovery_2026-09-29_ir_edge_ports.md`): the self-loop drawn on the bounding-box corner (`UnifiedEdge.tsx:374`), the unused self-loop handles taking slots, the snap of nearly level edges moving the tip off the anchor (`edgeUtils.ts:150`, `:222`). Edges without the key keep today's behaviour byte for byte.
4. Transition labels: the event, else the guard, as R-VP-17 (2), with the C2 label style (12 px, weight 500, quiet ink, halo).

**A3, Flowchart (ISO 5807)**, same profile and prefill as Flowchart (`flowchart`), data only in `notations.ts` and the derivation:

5. Node forms by role and then by name signals of the class: start/end/initial/final/terminal → stadium (existing form); input/output/read/write/print/io → parallelogram; decision/choice/if/branch (and the Decision role) → diamond; anything else → rectangle with radius 4. Names centred, 13 px weight 500, ink 1 px. Flows orthogonal (today's router), their guard as the label via the C2 template, `yes`/`no` when the guard is a literal true/false.

6. **Row:** write `R-VP-22` in `docs/decisions.md` (format of R-VP-15..21, «ratified by the chat on Alfonso's delegation of 2026-09-29 evening»): the two new notations, the two new IR keys (persisted names, R-B9), the scope of the three edge fixes, and that no earlier row is amended.

Adopted from D's questions (RC-21): both Recommended answers stand; in A1 the drawing follows the notation picked, not the presence of a Trigger.

## DOVE

`irTypes.ts`, `irCompile`, `irValidate`, `irEdgeViews.ts`, `IRNodeContent.tsx`, `irStyle`, `UnifiedEdge.tsx`, `edgeUtils.ts`, `derive/notations.ts`, `viewpointDerivation.ts`, the dialog of D only to list the two new entries, their tests; a report `docs/discovery/discovery_2026-09-30_a1_a3_notations.md` (Layer Impact Report first, measures), `docs/decisions.md` (R-VP-22), a log entry in `docs/log-inbox/views.md`, this prompt's Status. Any other file (`portDistribution.ts` above all): stop and ask.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, the discovery §1 rows 1, 2, 7, 19, 20, the C3 report, R-VP-15..21.
2. Layer Impact Report in the report before any code.
3. Tests first: every existing fixture hash unchanged; `irValidate` for the two keys; the arc geometry (opposite pair bowed apart, labels at the apex, self-loop above the node, arrow tips on the outline within 1 px); the entry mark outside the box; the A3 name-to-form table on the DemoFlowB metamodel and on a small fixture with each signal; «State machine» and «Flowchart» outputs byte-identical to the D tip. Mutation bench; report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003), light theme: DemoPEST (the turnstile) derived as Statechart (UML) and as State machine, DemoFlowB as Flowchart (ISO 5807) and as Flowchart, crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_a1a3_crops/`; measure on the turnstile that no two line ends on `locked` are within 6 px and each arrow tip is within 1 px of its node's outline; the four demo scenes in the default viewpoint identical to the D tip (the Jjodie launcher pulse is known noise).
6. Commits: `feat:` code and tests, `docs:` report, R-VP-22, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the crops' paths, the measures, the mutation score, any question with a `Recommended:` answer.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a call to an AI model, renaming or removing an existing IR property, changing the behaviour of an edge without `curve: 'arc'`.

## RIFERIMENTI

Discovery `ee7206d0c` §1, §5 A1, A3; C3 report `fb8944688`; R-VP-15..21; mockups `statechart-A.svg`, `flowchart-A-iso5807.svg`.

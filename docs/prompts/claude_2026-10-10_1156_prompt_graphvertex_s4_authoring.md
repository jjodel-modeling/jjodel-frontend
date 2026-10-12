# graphVertex S4: authoring panel and seed

Prompt-ID: P-2026-10-10-1156
Chat: C-2026-10-10-0057
Lane: full (§3.1 zone `viewpoint/authoring/` and `viewpoint/ir/`, go-ahead granted 2026-10-10)
Depends: P-2026-10-10-0105
Status: eseguito 2026-10-10 · lane ir-graphvertex-s4 · f1adba8ac, 6dfb762c1, 55aa06faf, ab8f512c3 · flip 2026-10-10 dalla chat

Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gvauthor`, branch `ir-graphvertex-s4`. The chat creates it from the tip of `ir-graphvertex`, which
contains S0-S2 of P-2026-10-10-0105, and copies this prompt in. This prompt is committed on the trunk, not on this
branch. So, before anything else, check three things. `pwd` is the worktree. The branch is `ir-graphvertex-s4`. `git log -1 --format=%h`
is `7d334c817`, or a later commit of `ir-graphvertex` named by the chat. Otherwise stop.

## Lane discipline
Every reply opens with `[P-2026-10-10-1156 · session <id>]`. Every final message ends with
`Outcome: done | hard-stop | question | blocked`. Every question with a recommendation carries `Recommended: <one line>`.

## Context (do not redo)

- The graphVertex front is P-2026-10-10-0105 on `ir-graphvertex`. Read three things on this branch:
  - the Phase 1 report `docs/discovery/discovery_2026-10-10_graphvertex_bpmn_lanes.md` (§G2 IR, §G3 keys, §I);
  - the spec addendum `docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md`;
  - the R-GV rows in `docs/decisions.md`.
- Alfonso ratified on 2026-10-10 that graphVertex becomes authorable. That amends R-6 (2026-08-04) and R-IRN-4, as
  the R-GV rows record. It is effective now that S1 has landed.
- Decisions D-a and decision 8 apply. Seed: `form: 'rect'`, a `top` intrinsic-name label, `containment: {}`.
  `containment.edges` defaults to `show`. It becomes `hide` when the author picks a non-composition children channel,
  and the author can still change it.
- S2 rendered partitions, header bands and channel-edge suppression (`6e22f4a9b`). The BPMN fixture is
  `frontend/scripts/probe/bpmn-lanes-fixture.ts` (`b7e061436`).

## COSA

1. **Panel.** A `GraphVertexAuthoringPanel` built the way the vertex panel is built.
   - Reuse the vertex sections: General, Shape, Fill, Border, Labels (now offering `header` and `orientation`),
     Matching, plus `visible`, `resizable` and `defaultSize`.
   - Add one new **Containment** section with these fields:
     - the children channel: a PathExpr field with the same picker pattern the existing PathExpr fields use;
     - `childFilter`, with the isKind chip pattern;
     - `layout`: mode `free | partitions`, axis, header side and size, padding;
     - `membership`: mode, plus `create.ownerKind/feature` shown only for `reference`;
     - `edges`: show or hide;
     - `collapsible` and the collapsed representation (existing keys).
   - The metamodel checks live in the panel: whether the last hop is containment, and which modes that admits.
     Show them as inline help, not as a modal.
   - Follow progressive disclosure: Basic shows channel, layout mode and edges; Advanced shows the rest.
2. **Tab and seed.** `irTabs.tsx` opens a tab for graphVertex. `irCreationSeed.ts` offers graphVertex with the D-a seed.
   `irKindConvert.ts` converts vertex ↔ graphVertex, keeping shared keys and dropping `containment` on the way back.
3. **Spec.** One-sentence amendment to the addendum §5. Channel edges hide for every claim, including a claim the container
   lost. This was S2's unattended decision 1.

## DOVE

`frontend/src/components/editor-v2/viewpoint/authoring/` (the new panel, `irTabs.tsx`, shared section components
if they need a prop), `viewpoint/ir/irCreationSeed.ts`, `viewpoint/ir/irKindConvert.ts`, their tests, and the
addendum (one sentence). Nothing in the render files, `EditorV2.tsx`, `sync/` or `hooks/`.

## COME

- Acceptance criteria:
  - **Leaf Lane.** On the fixture, create a view on `Lane`, pick graphVertex, and fill the panel. The IR the panel writes
    is deep-equal to the §G2 leaf Lane JSON. Write a test that drives the panel's state functions; add a DOM test
    if the panel exposes testids.
  - **Pool.** The same for the Pool with lanes.
  - **Existing panels.** Vertex, edge and row panels are unchanged. Use their existing tests plus a snapshot of each
    panel's section list.
- **Visual.** On a dev server port of your own (not 3000), in the light theme, take screenshots of the panel with Basic and
  Advanced open for the leaf Lane. Measure first: label size 11px, 8px grid, Bootstrap Icons only. Save them under
  `docs/discovery/assets/graphvertex-s4/`.
- **Gates.** `npx tsc --noEmit` (no new error beyond the baseline), the authoring and `viewpoint/ir` suites, the full
  suite, `npm run build`. Run a mutation bench on the panel → IR write functions.
- **Commits.** Use an explicit pathspec and the `Model:` trailer: `feat(authoring)`, then `docs(spec)` for the sentence.
  Add one inbox entry in `docs/log-inbox/ir-graphvertex-s4.md`. Close with «Decisions taken (unattended)» and
  «Decisions awaiting Alfonso».

## NON FARE

- Do not change rendering or gestures (S3 runs later in P-2026-10-10-0105).
- Do not bump `irVersion` and do not touch VersionFixer.
- Do not rename existing section components or CSS classes.
- No `git stash`, no `git add .`, no push.

## HARD STOP

After the commits, with green gates and the screenshots saved, stop with `Outcome: hard-stop`.

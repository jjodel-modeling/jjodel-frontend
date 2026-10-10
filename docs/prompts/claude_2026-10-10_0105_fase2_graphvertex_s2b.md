[P-2026-10-10-0105] Phase 2 GO: slice S2b (self-framing containers and hierarchical state machines). Visual. Hard stop after S2b.

Prompt-ID: P-2026-10-10-0105
Chat: C-2026-10-10-0057
Lane: full (§3.1 zone `viewpoint/ir/` and `nodes/`, go-ahead granted 2026-10-10)
Depends: S3 of this lane

## Why

On 2026-10-10 at 13:25 Alfonso decided that graphVertex must also carry **hierarchical UML state machines**, not only BPMN pools and lanes. A statechart therefore becomes the second fixture of the graphVertex front.

The two fixtures stress different things. BPMN stresses the reference channel and partitions. The statechart stresses a container that is its own frame, and depth.

In UML the visual containment coincides with the model containment (`State.regions`, `Region.subvertex`), so the default composition channel suffices. The gap is visual. In free layout a container is still a small node with the hull drawn around it and its children. A composite state must instead *be* the rounded rectangle that holds its substates and grows with them.

## COSA

1. **Self-framing free container.** Add `containment.layout.frame?: 'hull' | 'self'` (absent = `'hull'`, today's behaviour; partitions are always self-framed, as S2 decision 4 established).
   - With `frame: 'self'`, the presentation pass sizes the container's node to the bounding box of its visible children, plus padding and its header label. The pure geometry lives next to `irPartitions.ts`, in that file or in a sibling `irFrame.ts`.
   - No hull is drawn.
   - An `isResized` container keeps its stored size, but never below the children's box.
   - A collapsed self-framed container draws at its collapsed size with the badge.
   - Dragging a self-framed container moves its descendants by the same delta, through the same mechanism S3 uses for pools.
2. **Region separators.** Add `containment.layout.separator?: 'solid' | 'dashed'` (absent = `'solid'`) for partitions. UML orthogonal regions use `dashed`, and need no header band.
3. **Statechart fixture.** Write `frontend/scripts/probe/statechart-fixture.ts`, runnable with `lane-run probe`. Build a UML-faithful fragment:

   | Metaclass | Features |
   |---|---|
   | `StateMachine` | `regions` (containment) |
   | `Region` | `subvertex` and `transitions` (containment) |
   | `Vertex` | abstract |
   | `State` | `name`, `regions` (containment, 0..*) |
   | `Pseudostate` | `kind`: initial, shallowHistory, deepHistory, junction, choice |
   | `FinalState` | |
   | `Transition` | `source`, `target` (non-containment), `trigger` and `guard` strings |

   The model has:
   - a composite `Active` with two orthogonal regions, each with its own initial pseudostate;
   - a composite `Running` with a single region, nested inside one of `Active`'s regions (depth 3);
   - transitions crossing boundaries: from a nested substate to an outer state, and from the border of `Active` to an outer state.

   The viewpoint follows D-b:
   - one `State` view for «exactly one region», with channel `$regions.values[0].$subvertex.values` and `frame: 'self'`;
   - one view for «two or more regions», with partitions, `axis` stacked and `separator: 'dashed'`;
   - one view for simple states (no region);
   - `Region` as the partition child;
   - transitions as object-as-edge with the label `trigger [guard]`, as ratified for derived statecharts on 2026-10-03.
4. **Spec and registry.** Add a dated section to the addendum (the S4 lane edits the addendum §5 in parallel on `ir-graphvertex-s4`, so add a **new** section, do not touch §5). Add an R-GV row in `docs/decisions.md` recording that statecharts are a target, that `frame` and `separator` exist, and that bordered nodes are deferred.

Bordered nodes (entry and exit points, history on the border) stay out of scope, like BPMN boundary events. Record them in the R-GV row as the next capability to open if statecharts are pursued in full.

## COME

- **Acceptance criteria**, measured from the DOM on a port of your own (not 3000), in the light theme:
  - `Running`'s box contains every substate box with at least the declared padding, and its header label sits inside the box, at the top.
  - `Active`'s two regions fill its inner width and share a dashed border.
  - No hull element exists for self-framed containers.
  - Dragging `Active` moves every descendant by exactly its Δ.
  - Collapsing `Running` lifts the crossing transitions to `Running` and shows the badge.
  - The BPMN fixture still meets every S2 and S3 criterion.
  - The S1 hull scenes are byte-identical.
- **Measurements.** Save the JSON and screenshots under `docs/discovery/assets/graphvertex-s2b/`.
- **Gates.** `npx tsc --noEmit` (baseline only), the `viewpoint/ir`, `nodes` and editor-v2 suites, the full suite, and `npm run build`. Then a mutation bench on the frame geometry.
- **Commits.** Explicit pathspec, `Model:` trailer. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

## DOVE

- `viewpoint/ir/`: `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irPartitions.ts` or a new `irFrame.ts`, `useIRContainment.ts`, `IRContainmentHulls.tsx`, `IRNodeContent.tsx`, `irStyle.ts`.
- `nodes/ObjectNode.tsx`.
- `EditorV2.tsx`, only the container-drag path S3 introduced, and only if needed.
- The new fixture, the addendum (new section), one R-GV row, the assets, the inbox entry, and tests.

## NON FARE

- No §3.2 file. If one becomes necessary, stop with `Outcome: question`.
- No bordered nodes.
- No change to «Derive viewpoint» (`viewpoint/derive/`). Emitting graphVertex for derived statecharts is a later slice.
- No simulator change.
- Do not touch the authoring panel files (S4 lane).
- No `irVersion` bump, no VersionFixer.

## HARD STOP

After the commits, with green gates and the measurements saved, stop with `Outcome: hard-stop`.

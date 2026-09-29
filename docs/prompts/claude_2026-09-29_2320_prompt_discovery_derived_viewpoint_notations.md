# Prompt: discovery, notation catalogue for derived viewpoints (generic C, formalism-specific A and B)

Prompt-ID: P-2026-09-29-2320
Chat: C-2026-09-29-2230
Lane: discovery (read-only; the view IR, the renderer of vertices and edges, the derivation, the notation catalogue, the role binding). Tier: heavy.
Status: da eseguire
Worktree: `~/jjodel-w-notations`, branch `viewpoint-notations` (cut by the chat from `alfonso-frontend-jjtl` at `62f4ac3fc`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-notations`, branch `viewpoint-notations`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29 evening: the viewpoints produced by «Derive viewpoint» (merged `5aea64657`, `91257e719`) have no visual quality. Measured on a DeoPEST turnstile: the Initial state drawn as a solid `#334155` circle with the name squeezed at the bottom (the UML pseudostate form, while the metamodel says Initial is a State), rectangles about 370 px wide for six-letter names, two opposite transitions running parallel a few px apart with an ambiguous `push` label, three arrowheads landing on one point, a grey port dot left visible at an edge end.

The chat and Alfonso designed fifteen mockups, five formalisms times three variants. They are in this worktree as SVG under `docs/mockups/derived-viewpoints/` (committed with this prompt): `statechart-{A,B-automaton,C-generic}`, `petri-{A,B-boxes,C-generic}`, `flowchart-{A-iso5807,B-bpmn,C-generic}`, `er-{A-chen,B-italian,C-generic}`, `uml-{A-standard,B-compact,C-generic}`. Read their geometry and styles directly: they are the target, element by element.

Ratified by Alfonso on 2026-09-29 (the chat writes the R-rows in Phase 2):

1. Variant C (generic, structural) is the default and always available. Its rules: an object with two single-valued non-containment references into node classes becomes an edge (Eobj); contained objects become rows of the container (row views), each row `name : Type` in IBM Plex Mono 11 px; the metaclass name heads every symbol as an eyebrow (10 px, weight 600, uppercase, letter-spacing 0.08em, `#64748b`); the size comes from the content (the `boxForContent` contract); a subclass symbol refines the superclass symbol (same form, one added mark), never replaces it; generic symbols are white, 1 px `#cbd5e1` border, radius 10; an edge whose class is not recognised is labelled with its own metaclass (`«InhibitorArc» weight = 3`).
2. A catalogue of notations, each a set of roles plus their symbols: Statechart (A) and Automaton (B); Petri classic (A, bars and token dots) and Petri boxes (B, transitions as boxes, marking as a number); Flowchart ISO 5807 (A) and BPMN-like (B); ER Chen (A) and ER Italian (B, lollipop attributes, filled for the identifier, (min,max) cardinalities); UML standard (A, three compartments, italic abstract name, composition diamond, generalization triangle, navigable open arrow, multiplicities and role names at the ends) and UML compact (B, name, class badge, counters).
3. A notation applies only through an explicit binding metaclass → role, chosen in a dialog opened by «Derive viewpoint»: notation select (default Generic) and a table metaclass → role prefilled from structural signals and names, always editable. Reuse the simulation role machinery (`roleCatalog.ts`, `profileBinder.ts`, ancestry as R-SIM-8) where it fits.
4. Deterministic, no Jjodie, no call to an AI model.
5. The binding is stored with the derived viewpoint, decided together with the provenance key parked on 2026-09-29 (the `generated` key, the `migratedFrom` precedent).

Common look for A and B, from the mockups: stroke `#334155` 1.5 px, names 14 px weight 600 `#0f172a`, edge labels 12 px weight 500 `#475569` with a 4 px white halo, filled arrowheads, state machine and Petri arcs curved (quadratic, opposite pairs bowed apart, self-loops as cubic loops above the node), flowchart, ER and UML edges orthogonal. Light theme only (the dark theme is out of scope, 2026-09-28).

Priority if time is short (Alfonso): all of C first, then the A variant of every formalism, the B variants last. Deadline for merges on the trunk: Wednesday 2026-10-07, for the MODELS demo in Málaga.

Goal of this lane: the facts and the plan to build all of this in Phase 2 slices.

## DOVE (read-only)

- The derivation: `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` and its tests, `frontend/src/utils/deriveViewpoint.ts`, the entry in `TreeViewContent.tsx`; the report `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md`.
- The view IR: `irTypes.ts`, `validateIR`, `irResolveCore.ts`, `irDefaults.ts`, the spec `docs/spec/claude_spec_2026-07-18_ir_schema_v1_2.md` with its addenda (row dispatch, edge authoring, TextStyle, FormSpec) and R-IRN-37 (flat collapsed fields).
- The vertex renderer: `shapeRegistry.ts` (forms, `contentRect`, `boxForContent`), `useContentSize.ts`, the border per axis, `cornerRadius`, `roundedPolygonPath`, `notationCatalog.ts` and its presets.
- The edge renderer: routing (Manhattan, Eroute), terminations, label placement, the port or handle dot visible at an edge end.
- The role binding: `roleCatalog.ts`, `profileBinder.ts`, `bindProfile`, `sketchOfMetamodel`.
- Report: `docs/discovery/discovery_2026-09-29_derived_viewpoint_notations.md` (naming per `CLAUDE.md`), opening with `## 0. Answer in brief`, at most 90 lines. The only file this lane writes, plus this prompt's Status and a log entry in `docs/log-inbox/` (the inbox that fits; say which).

## COME

1. Read `CLAUDE.md` (§3.1 critical zone, §6 discovery rules), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, and the R-IRN, R-MCID and Symbol Editor rows in `docs/decisions.md`.
2. The inventory, the core of the report: one table with one row per visual element of the fifteen mockups (for example: curved edge with quadratic bow; cubic self-loop above the node; composition diamond termination; hollow generalization triangle with a shared tree; inhibitor circle termination; open navigable arrowhead; double border; stadium; parallelogram; diamond node; small filled dot as initial marker with its arrow; filled bar transition, vertical and horizontal; token dots from the marking; marking as a number; lollipop attribute, filled or hollow; underlined key attribute in an ellipse; eyebrow text; mono rows; class badge; counters `2 attr · 1 op`; multiplicities and role names at the two ends of an edge; label with white halo; label bound to its own segment; distinct ports for opposite edges). For each: the verdict **exists** (file:line), **exists but not reachable from the derivation** (what is missing), or **missing**; for missing ones, the smallest additive IR extension (optional keys only, no existing property changed or removed) or a renderer-only change, and the files it touches, marked §3.1 or not.
3. For every extension that touches a §3.1 file: a Layer Impact Report section (what changes in each layer, which invariants of `docs/…/architecture-invariants` or `CLAUDE.md` are at stake, how it is tested). Alfonso delegated the decision on additive and optional IR keys to the chat; say explicitly if anything is not additive.
4. The binding: where the chosen notation and the table live (inside the derived viewpoint, keyed with the provenance), how the dialog reuses `bindProfile`, the structural and name signals that prefill each notation's roles, and what happens on regeneration.
5. Measure, with gitignored `_tmp_*` scripts under `npx tsx` (no dev server): the variant C derivation on the four demo metamodels (`/Users/alfonso/jjodel-demo-exports/*.json`, read only) plus the three ERD exports found on 2026-09-29, validated against `validateIR`, and count the rows, edges and eyebrows produced. If no UML-like metamodel is available among the exports, say so and propose a fixture.
6. The plan: Phase 2 slices in the priority order above (C first, then each A, then each B), each with its file list, its §3.1 exposure, a size estimate in files and lines, its tests, and the crops the chat needs for the visual check (light theme, `sips -Z 600`). `Recommended:` on what fits before 2026-10-07 with parity of the four demo scenes before every merge.
7. Name every point that is Alfonso's decision (a non-additive IR change, amending an R-row he ratified, anything that changes what the four demo scenes show).
8. Do not write product code. One docs commit (report, log entry, Status). Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, a call to an AI model.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md` (the previous derivation discovery, its §0 decisions).
- `docs/mockups/derived-viewpoints/*.svg` (the fifteen targets).
- `docs/decisions.md`: R-IRN-29..37, R-MCID-1, R-MCID-2, the Symbol Editor 1b rows, R-SIM-8, R-SIM-89, R-SIM-90.

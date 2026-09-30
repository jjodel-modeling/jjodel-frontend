# Prompt: Phase 1 and 2 in cascade, clicking an edge shows its reference or its object-as-edge in the Properties panel

Prompt-ID: P-2026-09-30-1940
Chat: C-2026-09-30-1940
Lane: full (selection path of editor-v2, root cause not yet known, Phase 1 then Phase 2 in cascade; critical zone only if the report proves it necessary, Layer Impact Report first, go-ahead RC-30 given at launch). Tier: heavy.
Status: eseguito 2026-09-30 · lane edge-click-properties · bb0fd90c9 · non fuso: hard-stop, lane probe on 3097 (light) 50/51 (the red: no clickable point on t1's visible line, as in the before run), four demo scenes 0 px, mutation bench 12/12, crops in frontend/scripts/smoke/_tmp_edgesel_crops/ (gitignored), verifica visiva alla chat
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-edgesel`, branch `edge-click-properties`, created from the trunk `alfonso-frontend-jjtl` at `45ff6c290`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-edgesel`, branch `edge-click-properties`, `git log -1` is the docs commit that added this prompt, `git status` clean; if any differs, stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-09-30-1940 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Alfonso is away (lane auto): questions inside this lane's perimeter are answered by the chat as recommended (RC-21, RC-25); write your recommendation so it can be adopted verbatim.

## Contesto (non rifare l'analisi)

Alfonso's request (2026-09-30): when he clicks an edge on the editor-v2 canvas, the Properties panel must show the model element the edge represents, whatever kind of edge it is:

- an edge that draws a **reference** (M2: the `EReference`/`DReference` feature; M1: the reference slot, i.e. the `DValue` of the reference feature on the source object, or the feature itself if the panel has no slot view; the report decides which and why);
- an **object-as-edge** (an M1 object, or M2 class, rendered as an edge by its viewpoint): the Properties panel shows that object exactly as if its node had been clicked.

Today the edge click goes through `useJjomSelection.onEdgeClick` (`frontend/src/components/editor-v2/hooks/useJjomSelection.ts:211`), which calls `selectElement(edge.id, modelid)`: `LPointerTargetable.fromPointer(edge.id)` then `_lastSelected.modelElement = lElement.model`. The chat suspects that for at least one of the two kinds the React Flow edge id is not a D-object id (a synthetic key) or its `.model` is not the represented element, so the panel shows nothing, the model, or the wrong element. This is a hypothesis: Phase 1 measures it before any fix.

Decisions taken by the chat (provisional, unattended, RC-25; write them as rows `provisional, unattended` in `docs/decisions.md`, in the section that holds editor-v2 selection rows if one exists, otherwise the next free R- row the report names):

1. **Mapping.** A single pure resolver, for example `resolveEdgeSelectionTarget(edge): { viewId?: string; modelElementId: string } | null` (grep the name first), that reads what the edge carries (edge `data`, the D-edge, its start/end vertices) and returns the element to show. Unknown edge kinds return `null`, and the click keeps today's behaviour exactly (no regression for edges the resolver does not know).
2. **Selection ring.** The clicked edge stays the visibly selected canvas element (whatever today's edge selection style is); only `_lastSelected.modelElement` changes to the represented element. For an object-as-edge, if the object has no node on the canvas nothing else is selected.
3. **Same path for both.** Native edge click and the mirrored path at `EditorV2.tsx:2828-2843` go through the same resolver, so the two are identical.
4. **Highlight mode** unchanged: when highlight is active the click assigns the color and does not select (line 215).
5. **Pane click, node click** unchanged.

Concurrent lanes on branches from recent trunk shas: `edge-ends` (P-2026-09-30-1810, running: `irTypes.ts`, `irValidate.ts`, `irCompile.ts`, `irEdgeViews.ts`, `UnifiedEdge.tsx`, `edgeUtils.ts`, `EdgeAuthoringPanel.tsx`) and `viewpoint-metaclass-colors` (P-2026-09-30-1815: `ViewpointProperties.tsx`, `properties.scss`, node render paths). Keep out of all those files. If the edge's represented element can only be read by changing one of them (for example `UnifiedEdge.tsx` does not put the needed id in `edge.data`), stop with `Outcome: question` and a recommendation; do not edit them. Keep the hunk in `EditorV2.tsx` minimal.

## COSA

Edge click → Properties panel shows the reference (or reference slot) or the object-as-edge the edge represents, on M2 and M1 models, native and IR-rendered views.

## DOVE

Phase 1 (read-only): report `docs/discovery/discovery_2026-09-30_edge_click_properties.md` (naming `discovery_<date>_<description>.md`). Content: how React Flow edge ids are built for (a) M2 reference edges, (b) M1 reference edges, (c) object-as-edge on M1 and M2 if both exist, (d) any other edge kind (containment, inheritance, extends): file:line, verbatim; what `edge.data` carries; what `LPointerTargetable.fromPointer(edge.id)` and `.model` return for each kind, **measured** with a probe on a free port (not 3000, 3001, 3003) on DemoFlowB and one M2 metamodel with references and generalizations; what the Properties panel shows today for each (screenshot crops `sips -Z 600`); how the Properties panel resolves `_lastSelected` (file:line) and whether it can show a `DReference`, a `DValue` slot, an `DObject`; the exact Phase 2 file list with size; critical-zone involvement (Layer Impact Report if any); questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade unless a question has no single recommendation, the file list exceeds five source files, or it touches a file excluded above.

Phase 2: `useJjomSelection.ts`, the new resolver module and its tests, the minimal `EditorV2.tsx` hunk if the mirrored path needs it, the Properties-side file only if the report proves the panel cannot display the resolved element today; a log entry in `docs/log-inbox/` (the file the report names for editor-v2); the decision rows; this prompt's Status.

Out of scope: the edge files and viewpoint files listed above, edge styling, every demo project, `docs/CHANGELOG.md` (the merge adds the line), jjodel-docs.

## COME

1. Read `CLAUDE.md` (§3.1, §3.2, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34, `docs/architecture-invariants` material cited by CLAUDE.md on TRANSACTION and sync-adjacent code (the selection TRANSACTION already exists; do not add new TRANSACTION nesting).
2. Phase 1 report, committed. Before introducing any new identifier or module name, grep the codebase and prove it is unused. Every assertion of absence carries a positive control in the same invocation.
3. Tests first: the resolver on each edge kind of the report (reference M2, reference M1, object-as-edge, unknown → `null`), built from fixtures that mirror the measured `edge` shapes.
4. Implement. Gates: typecheck (the known baseline only), full vitest (the known reds at import only), build exit 0, `check:docs`, `check:addonly`. Mutation bench on the resolver; report the score.
5. Visual: `lane-run probe` on a free port, light theme, isolated profile. For each edge kind: click the edge, measure from the DOM the Properties panel header (element name and kind) and `_lastSelected` from the store; crops before and after under `frontend/scripts/smoke/_tmp_edgesel_crops/` (gitignored; check). Node click and pane click regression: same measures, unchanged. The four demo scenes 0 px from `45ff6c290`.
6. Commits: `feat:` or `fix:` code and tests, `docs:` report, decision rows, log entry, Status (RC-17); stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, the decisions taken (unattended) and the decisions awaiting Alfonso.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, Alfonso's browser or ports 3000/3001/3003, a call to an AI model.

## HARD STOP

After the Phase 2 commits and the visual measures: `Outcome: hard-stop` (visual check due). Earlier: `Outcome: question` per the DOVE conditions.

## NON FARE

No change to node click, pane click, highlight mode, drag or edge styling. No new dependency. No renaming of existing identifiers. No new TRANSACTION around sync-adjacent writes.

## RIFERIMENTI

`frontend/src/components/editor-v2/hooks/useJjomSelection.ts`, `frontend/src/components/editor-v2/EditorV2.tsx:2806-2843`, `frontend/src/components/editor-v2/components/M1ReferencePopup.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irEdgeInteraction.ts` (read only), `frontend/src/components/editor-v2/viewpoint/ir/edgeEndpoints.ts` (read only).

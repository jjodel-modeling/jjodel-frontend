# Prompt: discovery, page freezes while authoring IR viewpoints, plus two IR rendering gaps (collapsed shape, StructureSpec)
Prompt-ID: P-2026-09-29-1935
Chat: C-2026-09-29-1840
Lane: discovery (read-only; viewpoint authoring, IR resolver and interpreter, project save). Tier: heavy.
Status: eseguito 2026-09-29 · lane discovery ir-freeze-disc · measured on 9b08350d0; the report is in the commit that carries this line (a commit cannot name its own sha) · Outcome: hard-stop
Worktree: `~/jjodel-w-irfreeze`, branch `ir-freeze-disc` (cut by the chat from `alfonso-frontend-jjtl` at `f7c5fd910`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-irfreeze`, branch `ir-freeze-disc`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

On 2026-09-29 the chat authored four IR viewpoints on a small metamodel (abstract `element` with `name: EString`; `A1`, `A2`, `A3` extend it; `B` has containment `newComposition: element [0..*]`) in a project on 3001, driving the UI from Chrome and writing each view's IR through the L-proxy (`view.ir = draft`, the `set_ir` path the authoring panels use). Views were created with the viewpoint `+` in the right tree (New view dialog, class left at its default, then the IR rewritten with the right `metaclasses` and `authoringMetaclassPins`). The four viewpoints: shapes and markers (ellipse, diamond with marker `x`, hexagon with marker `gear`, `B` as `graphVertex` collapsible), rules (`Conditional` rules on `isKind` and `empty`, a priority-10 view with an `eq` predicate), reference-as-edge (`reference: 'newComposition'`, dashed, curved, `filledDiamond`/`openArrow`, center label), rows (`B` with a `children` compartment, `row` views on `element` and on `A2`). All four render correctly once loaded.

Three problems observed, to explain with evidence:

1. **The whole tab froze four times** (renderer at 100%, no screenshot for more than 60 s, tab had to be closed; unsaved work lost). Not reproduced deterministically. Circumstances: (a) model tab open with a viewpoint active, New view dialog, class picked in the `<select>` by a programmatic change event, then `Create View`; (b) metamodel tab, three views created in a row on the first viewpoint, then `Cmd+S`; (c) project page, model card clicked right after a save, then the viewpoint selector opened; (d) `Cmd+S` on the metamodel tab, then a click on the model's top tab while the save spinner could still be running. Ruled out by the chat: mounting or remounting the model canvas with a `graphVertex` view active (tried live and after a tab round trip, no freeze); a save alone with any of the four viewpoints (each saved fine in isolation). Every save also raised a toast «Request timed out», yet the data persisted.
2. **Collapsed `graphVertex`**: `containment.collapsed.form: 'cylinder'` and `collapsed.badge` are ignored; the collapsed node keeps the expanded form and shows a count chip.
3. **`StructureSpec` without visible effect** on a `vertex` view: `name.position: 'header-band'`, `accentPlacement: 'top'` with `accent`, and the compartment `title` render nothing different from their absence.

Two side findings to confirm or refute: a viewpoint created through the project page's `+ New` can end up in the store and in the canvas viewpoint selector but not in `project.viewpoints` (seen once, after a freeze); viewpoint cards on the project page report «0 views» for viewpoints that have IR views.

Goal: root cause (or the best-supported hypotheses, ranked) for the freeze, and a Phase 2 plan for all points.

## DOVE (read-only)

- Viewpoint creation: `NewViewDialog.tsx`, `utils/lastViewpoint.ts` (`createViewInWorkbench`, `activateViewpoint`), `TreeViewContent.tsx` (the `+`), the IR seed (`irCreationSeed.ts`).
- The IR write path: `view.tsx` `set_ir`, `irKindConvert.ts`, the TRANSACTION it opens; what subscribes to `ir` (resolver index build in `irResolve*.ts`, `useIRView`, `useIRContainment`, `useContentSize`, the canvas sync). Look for render loops, effects that write back during render, subscriptions that re-trigger themselves, and the content-size iteration (the contract says measurement at intrinsic size, never in pose: check it holds for ellipse, diamond, hexagon, circle).
- The save path behind `Cmd+S` and the «Project Saved» / «Request timed out» toasts: what is serialized, synchronously or not, and what it does with a large `idlookup`.
- `IRContainmentHulls.tsx`, `irCollapseState.ts`, `irContainment.ts` for point 2; the `structure` field's readers (`structureCapabilities.ts`, the node renderer) for point 3.
- Critical zone (`useJjomSync.ts`, `portDistribution.ts`): read only if the evidence leads there, and say so; never edit.
- Report: `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md`, opening with `## 0. Answer in brief`, at most 60 lines; plus this prompt's Status and a log entry in the appropriate `docs/log-inbox/` file.

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, the critical zone), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, and the IR spec v1.2 with its addenda (row dispatch, edge authoring).
2. Rebuild the scenario without Alfonso's browser data: a gitignored `_tmp_*` fixture that creates the metamodel, a model with one `B` and four children (one `A1` named `root`), and the four viewpoints with the IR given in the appendix below. Measure with `npx tsx` where the code is pure; for the freeze use a lane probe (`lane-run probe`, port 3056, never 3001) and replay (a) to (d), capturing a CPU profile or at least the stack of the looping frame (`Runtime.evaluate` with a timeout, or the Performance domain). Say how many replays of each circumstance froze.
3. Answer with [M]/[R] evidence and file:line: the freeze's cause, or ranked hypotheses with what would discriminate them; whether the «Request timed out» toast is related; points 2 and 3 (missing implementation, or a reader that drops the field); the two side findings.
4. `Recommended:` the Phase 2 lanes, each with its file list, the fix, the tests (a regression test that fails today for each confirmed cause), and whether any touches the critical zone.
5. One docs commit. Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, product code.

## Appendix: the IR used (all `irVersion: 'ir-1.2'`, `exclusive: true`, pins set to the class ids)

- Shapes: `A1` vertex `form: 'ellipse'`, labels center `$name.value` (editable) and bottom `metaclassName`; `A2` vertex `form: 'diamond'`, `marker: 'x'`; `A3` vertex `form: 'hexagon'`, `marker: 'gear'`; `B` `graphVertex`, `form: 'rounded'`, border dashed, label top intrinsic `name`, `containment: { collapsible: true, collapsed: { form: 'cylinder', fill: '#e2e8f0', badge: { icon: 'bi-box-seam', position: 'tr', visible: true } } }`.
- Rules: `element` vertex with `form: { rules: [isKind A1 → 'rounded', isKind A2 → 'parallelogram', isKind A3 → 'cloud'], default: 'rect' }`, `fill` rules led by `{ op: 'empty', path: '$name.value' }`, border color and style as `{ when, then, else }`, a bottom label and a `bi-exclamation-triangle-fill` badge visible only when the name is empty; `A1` vertex, `priority: 10`, `predicate: { op: 'eq', left: '$name.value', right: { kind: 'string', value: 'root' } }`, `form: 'circle'`, border `double`; `B` plain rect.
- Edges: `B` rect, `element` `stadium`, and an edge view `{ kind: 'edge', metaclasses: ['B'], reference: 'newComposition', edge: { line: { color: '#0ea5e9', width: 2, style: 'dashed' }, terminations: { sourceEnd: 'filledDiamond', targetEnd: 'openArrow' }, routing: 'curved', labels: { center: { from: 'literal', text: 'contains' }, placement: 'above' } } }`.
- Rows: `B` vertex with `structure: { name: { position: 'header-band', typeDisplay: 'chip' }, accentPlacement: 'top', accent: '#0ea5e9', emptyBehavior: 'dash' }` and `fieldCompartments: [{ id: 'elements', title: 'elements', source: { from: 'children' }, rowFormat: { segments: [{ kind: 'name' }] }, separator: true }]`; `row` on `element` with template `[metaclassName, ' · ', $name.value]`, mono; `row` on `A2` with template `['◆ ', $name.value, ' (gateway)']`, bold green.

## RIFERIMENTI

- IR spec v1.2 and addenda in `docs/spec/`; R-IRN rows in `docs/decisions.md`; the chat's report of 2026-09-29 (above).

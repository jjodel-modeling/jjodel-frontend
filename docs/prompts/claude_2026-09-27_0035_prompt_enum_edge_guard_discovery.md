# Prompt: discovery, an edge between a class and an enumeration must be refused on the canvas

Prompt-ID: P-2026-09-27-0035
Chat: C-2026-09-26-1702
Lane: full (Phase 1 discovery, read-only; Phase 2 may touch a critical-zone file, to be decided)
Status: da eseguire

Worktree: `~/jjodel-open`, branch `enum-edge-guard` (from the trunk `alfonso-frontend-jjtl` at `da84b10e5`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `enum-edge-guard`, `git log -1` is the commit that adds this file (subject `docs: add prompt P-2026-09-27-0035, enum edge guard discovery`), its parent is `da84b10e5`, `git status` empty. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0035 · session <id>]` and ends with an `Outcome:` line (P16).

**Phase 1 only: read-only.** No source file is edited, no dependency installed, no commit except the report (step 6). A dev server on 3003 from this tree is allowed for the measurements (port free first; your scratch Vite config for the symlinked `node_modules` is allowed, not committed); stop it at the end.

## COSA

Measured by Alfonso on 2026-09-27 (screenshot in chat): on the editor-v2 canvas of a metamodel, dragging a connection from the class `Person` to the enumeration `NewEnum` creates an edge labelled `newAssocia` with multiplicity `0..*`, that is a reference whose type is an enumeration. In Ecore an `EReference` types only an `EClass`; an enumeration is an `EDataType` and can type an attribute only. The same holds in the other direction (an enumeration has no references) and for a generalization between a class and an enumeration. The editor must refuse these connections, and the model layer must not accept them either. Map where the connection is decided and what the model does with it today, so that the chat can ratify one design.

## DOVE (read)

- `frontend/src/components/editor-v2/EditorV2.tsx`: `onConnect`, `isValidConnection` and whatever else decides a drop between two nodes; how the node kind (class, enumeration, package, other) is known at that moment.
- The write path of a canvas edge into the model: `frontend/src/components/editor-v2/hooks/useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts` (critical zone: read only, name lines, never edit); `DVoidEdge.new2`, the edge pair guard of `syncState.ts` (report the `hasCanvasEdgePair` rule as it stands).
- The model layer: how a reference's `type` is set and whether anything checks that it is a class (`LModelElement.tsx`, the `DReference`/`LReference` code, `set_type` or equivalent); the same for `extends`.
- `frontend/src/model/conformance/ConformanceValidator.ts` and the problems registry: whether a reference typed by an enumeration is reported today.
- `frontend/src/services/export/EcoreService.ts` and `frontend/src/api/data.ts` (import): what a reference to an enumeration becomes in `.ecore`, and what an imported `.ecore` cannot contain.
- `frontend/src/redux/VersionFixer.tsx` (read only): whether any migration would be needed for saved projects that already hold such an edge (they exist if the canvas allowed it).
- `docs/decisions.md`: the R-A and R-RAIL rows on canvas edges and endpoints, if they touch connection validity; `CLAUDE.md` §3 (critical zone).

## COME

1. **What exists [R].** Where a drop between two nodes is accepted; what data about the two ends is available there; where the reference is created and typed; whether any layer refuses an enumeration as a reference type or as an `extends` target; what the validator and the Ecore export do with it. File and line for each.
2. **Measure [M].** On 3003, in a fresh metamodel: class → enumeration (the case of the screenshot), enumeration → class, enumeration → enumeration, and a generalization class → enumeration if the canvas offers it. For each: what is created in the model (the `DReference` or `DClass.extends` entry, its `type`), what the problems registry shows, what `Export to Ecore` produces (the XML fragment) and whether that file re-imports. Also: whether an attribute typed with the enumeration can be created from the same gesture or only from the class panel.
3. **Options**, each with the files it touches, whether a critical-zone file is among them, the exported interfaces it changes, and the tests it needs:
   - A: refuse at the canvas (`isValidConnection` or the drop handler): the connection does not start or does not complete, with the standard invalid-connection feedback of the editor;
   - B: refuse in the model layer (the reference type setter and the `extends` setter reject a non-class), so that no path, canvas or JjScript or import, creates it;
   - C: A plus B, with the canvas as the user-facing guard and the model as the invariant;
   - D: any of the above plus a conversion: a drop from a class onto an enumeration creates an attribute of that enumeration type on the class instead of a reference (say what the panel would show and whether the gesture is discoverable).
   Say which option keeps the critical-zone files untouched, and which one covers saved projects that already contain such an edge (a validator rule, a migration, or nothing).
4. **Risks.** The edge pair guard and the `useJjomSync` step 4 auto-populate (architecture invariants: never a TRANSACTION around sync-adjacent writes); a refusal that leaves an orphan `DVoidEdge`; an M1 model whose metamodel already has such a reference; the classic editor, if it shares the model path.
5. **Decisions.** End the report with two sections, per RC-26: «Decisions taken (unattended)», each with the recommended answer, and «Decisions awaiting Alfonso», containing only items of the RC-26 list (a critical-zone edit, an exported interface that breaks a consumer outside the lane, a migration). Recommend one option in two lines.
6. **Report, mandatory.** Save it as `docs/discovery/discovery_2026-09-27_enum_edge_guard.md` (objective, files read with full paths, findings marked [R] read or [M] measured, options, risks, decisions). Commit it alone, pathspec after `--`, subject `docs: discovery of the enum edge guard on the canvas (P-2026-09-27-0035)`, `Model:` trailer. No log entry and no Status flip in Phase 1 (P13).
7. **Hard stop.** Closing report opening with `[P-2026-09-27-0035 · session <id>]`: the report sha, the recommended option in two lines, the decisions awaiting Alfonso if any. Stop the dev server. Then `Outcome: hard-stop`.

Never: an edit to a source file, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- Architecture invariants of the project chat: the `useJjomSync` TRANSACTION prohibition, the canvas edge pair guard, the auto-populate deps.
- `docs/PROTOCOL.md` P5 (Layer Impact Report), P13, P16; RC-25..29.

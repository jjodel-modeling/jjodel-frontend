# Prompt: Phase 2, step C1 of the enum edge guard: the canvas refuses a connection whose ends are not both classes

Prompt-ID: P-2026-09-27-0120
Chat: C-2026-09-26-1702
Lane: full (three files, a new pure module, browser probe; no critical zone)
Status: eseguito 2026-09-27 · lane enum-edge-guard · 5dc09a4ce · verifica visiva passata 2026-09-27 (chat, unattended, 51/51; Alfonso in the morning digest)

Worktree: `~/jjodel-open`, branch `enum-edge-guard`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-open`, branch `enum-edge-guard`, `git log -1` is the commit that adds this file (subject `docs: add Phase 2 of the enum edge guard, canvas step (P-2026-09-27-0120)`), its parent is `90722c375` (the merge of the trunk into this branch, above the discovery `4e5dff7ad`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*` files. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0120 · session <id>]` and ends with an `Outcome:` line (P16).

## COSA

Implement option A of `docs/discovery/discovery_2026-09-27_enum_edge_guard.md` (§4 A, §8 decisions 1-3, adopted by the chat under RC-25 as R-EDGE-1..3 in `docs/decisions.md`): in a metamodel, a canvas connection is valid only when both ends are class nodes. A class → enumeration, enumeration → class, enumeration → enumeration or class → package gesture does not complete: no popup, no reference, no `extends`, no `DVoidEdge`. In a model the predicate returns `true` and nothing changes. Step C2 (the model-layer invariant and the Ecore import) is a later lane with its own check of the load and replay paths, not this one.

## DOVE

- `frontend/src/components/editor-v2/utils/connectionValidity.ts` (new; name check first): a pure predicate, for example `isMetamodelConnectionValid(mode, sourceNodeType, targetNodeType): boolean`, true in model mode, true in a metamodel iff both node types are the class node type, false otherwise; node type strings taken from the editor's node type registry, not re-typed as literals.
- `frontend/src/components/editor-v2/utils/__tests__/connectionValidity.test.ts` (new): the matrix class/enum/package/object × metamodel/model, both directions, plus a mutation bench.
- `frontend/src/components/editor-v2/EditorV2.tsx`: `isValidConnection` on `<ReactFlow>` (report §2.1, `EditorV2.tsx:4141-4157`) calls the predicate with the editor mode from `modeInfoRef.current` and the node types resolved through `getNode` of `useReactFlow` (O(1), it runs on every pointer move); no other change.
- `frontend/src/components/editor-v2/EditorV2.scss`: one rule for xyflow's `.react-flow__connection` invalid state, with its colour token from `styles/tokens/` if one fits (Rules 27-28); no new class name without a name check.

Four files. Out of scope: `canvasToJjom.ts`, `useJjomSync.ts`, `syncState.ts` (critical zone, untouched), `LModelElement.tsx`, `joiner/classes.ts`, `api/data.ts`, `EcoreService.ts`, `EdgeTypePopup.tsx`, the validator and the problems registry, any migration.

## COME

### Rulings for this lane

- **Direction-free.** The predicate looks at both ends symmetrically (report risk 5: the inheritance swap decides direction by geometry, so a "source is the child" reading would be wrong).
- **Mode first.** In model mode the predicate is `true` whatever the node types (report risk 6: reconnect and the IR object-as-edge reconnect must keep working); the mode is read from the editor, never inferred from node types.
- **Legal gestures untouched.** Self-reference on a class, composition and reference between two classes, inheritance class → class, and a reference between classes of two packages when both are drawn as class nodes, all still open the popup. If the canvas has any handle that is not on a class node in a metamodel (a feature row, a package proxy), say so in the report with the file and line: the predicate must key on the classifier that owns the handle, and if that is not the node, stop with `Outcome: question`.
- **Feedback.** xyflow's own invalid state (the line does not snap, class on `.react-flow__connection`) plus the one SCSS rule; no toast, no popup.

### Steps

1. Baseline on this commit: `npm run typecheck` (exit 2, the §17 set), `npx vitest run` (state the expected count from the last closure on the trunk, then measure; 0 failed, the same red-at-import files), `npm run build` (exit 0), `check:docs` 4/4, `check:scripts` as the baseline.
2. Tests first, red: the matrix; the predicate is symmetric (swapping the ends gives the same answer); model mode is always true; an unknown node type in a metamodel is false.
3. Implement: the module, the wiring, the SCSS. Minimal diffs, no refactor, no rename.
4. Mutation bench, table in the commit body, a survivor is a stop: (1) model mode returns false for an enum end; (2) only the source end is checked; (3) only the target end is checked; (4) an unknown node type passes; (5) the predicate is not wired (`isValidConnection` absent or always true); (6) the mode is read from node types instead of the editor.
5. Gates on the code commit, as step 1 plus the new tests; `git diff --stat` outside DOVE empty. Commit, pathspec after `--`, subject `feat(editor-v2): the metamodel canvas refuses connections to non-class nodes (P-2026-09-27-0120)` (within §6.2 without the suffix), body with baseline, gates, mutant table, `Model:` trailer.
6. **Browser probe, then hard stop (RC-23).** A dev server from this tree on a free port (3003 is held by a server this tree did not start: leave it; the discovery used 3004 with `frontend/scripts/smoke/_tmp_vite_enum_3004.config.ts`). Reuse the discovery's probe (`frontend/scripts/smoke/_tmp_enum_edge_probe.mts`) or extend it: S1 class → enum, S1b enum → class, S2 enum → enum, S4 class → enum inheritance, S5b enum → class inheritance, S6 class → package: none completes, no `DReference`, no `extends`, no `DVoidEdge`, no popup; then the legal set: class → class reference and composition, class → class inheritance, self-reference, and in a model an object → object reference and a reconnect: all still complete. Record, per case, the counts of `DReference`, `DVoidEdge` and `DEnumerator.extends` before and after, and the popup's presence. Screenshots of one refused and one accepted gesture, light and dark. Stop the server. Then `Outcome: hard-stop` with the sha, the gates, the probe table: the chat runs its own checklist in the built-in browser and Alfonso confirms (RC-23, until 2026-10-03).
7. After the GO (a resume from the chat), one closure commit (P13, RC-17): the entry in `docs/log-inbox/versionfixer.md` is not the right inbox; use `docs/log-inbox/views.md` (canvas front) with `Smoke visivo:` as recorded, the Status of this file and of the Phase 1 file flipped (`eseguito 2026-09-27 · lane enum-edge-guard · <sha>`, the Phase 1 one with `4e5dff7ad`), and the ticket of report §4 «which covers saved projects» (the three shapes S1, S5b, S6 that saved projects may hold; the two options; a date for the validator producer decision), plus a ticket for step C2 naming report §4 B, the import check, and the review's warning that a guard in `set_type` must not run on load, undo/redo or VersionFixer replay. Then `Outcome: done`. The merge toward the trunk gets its own prompt.

Stop with `Outcome: question` and a `Recommended:` line if: a handle in a metamodel is not on a class node; `isValidConnection` cannot reach the editor mode; the predicate would need `canvasToJjom.ts` or any critical-zone file; the SCSS rule needs a new token.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a critical-zone edit, push, any tree or server you did not start.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-27_enum_edge_guard.md` (`4e5dff7ad`): §2.1, §3 S1-S6, §4 A, §5, §6b, §8.
- R-EDGE-1..3 in `docs/decisions.md`; architecture invariants (TRANSACTION prohibition in the sync layer, edge pair guard).
- `docs/PROTOCOL.md` P13, P16; RC-17, RC-23, RC-25..30.

# Prompt: an object-as-edge (M1 Transition) cannot be deleted from its context menu

Prompt-ID: P-2026-10-04-0130
Chat: C-2026-10-04-0125
Lane: full (critical zone possible: `canvasToJjom.ts`; bug fix with discovery, tests first, probe). Tier: heavy (RC-32). Model: the default of `.claude/settings.json`, no deviation. Critical-zone go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-04-0130`) on Alfonso's request «fixa il problema con una lane auto» (2026-10-04 01:20); the Layer Impact Report stays the first step before any edit of a §3.2 file.
Status: eseguito 2026-10-04 · lane object-edge-delete · fix 5557a714b, test 5d4e8b0b6, probe 04acc1815, dc489a6b3 · report 86d15831b docs/discovery/discovery_2026-10-04_object_edge_delete.md (§10 D2 revised by measurement, R-B17 provisional) · gates: typecheck 14 (the §17 set), vitest 7289 passed (the §17 nine at import, criticalZone.test.ts green with the go-ahead variable unset), build exit 0 · probe on 3084 17/17 after, 10/10 before (the bug measured), the four default panes identical to the trunk-code run 4/4 · mutation bench 15/15 canvasToJjom.ts, 4/4 EditorV2.tsx · crops in ~/.jjodel-lanes/P-2026-10-04-0130/crops/ · non fuso: hard-stop, verifica visiva alla chat e GO di Alfonso (critical zone)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-objedgedel`, branch `object-edge-delete` at `43685438b` plus the docs commit that added this prompt; `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-04-0130 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
This lane runs unattended (RC-21, RC-25): decide your own design questions as recommended, write them as provisional, and stop only on the RC-26 list.

## Contesto (non rifare l'analisi)

Alfonso, 3001, the DemoESM microwave statechart on an M1 model (states Idle, DoorOpen, TimeAdded; transitions labelled Open, Close, Cancel, Reset, Time Increase). Transitions are M1 objects rendered as edges (object-as-edge, R-B series: the canvas edge is synthetic, `edge.data.irObjectAsEdge === true`, `edge.data.irObjectId` is the DObject). Right-click on a transition shows the generic M2 edge menu of `EditorV2.tsx` («Edge context menu», about line 3410 on `43685438b`): «Convert to Inheritance» and «Delete reference». «Delete reference» calls `deleteEdge` → `syncDeleteEdge(edgeId, false)` in `sync/canvasToJjom.ts`. Read by the chat, not measured: for a synthetic edge `deleteM1Link` finds no DEdge in `idlookup` and returns false, the reference cascade finds no `model`, the edge leaves React Flow state only, and the next sync redraws it from the still-living DObject. «Convert to Inheritance» makes no sense on an M1 object either. Verify all of this before fixing.

## COSA

1. Discovery inline (Phase 1, no hard stop: this lane goes straight to Phase 2): reproduce on the DemoESM export `~/jjodel-demo-exports/scene_3_DemoESM.jjodel` (or the M1 model with object-as-edge transitions in the four demo scenes) and record what the right-click menu offers, what «Delete reference» does to the DObject, the canvas and the problems registry, and what the Delete/Backspace key does with a selected object-as-edge (`deleteKeyCode={null}`: find the custom handler). Also check the M1 link popup `components/M1ReferencePopup.tsx` and `useJjomSelection.onObjectAsEdgeClick` for another delete entry point. Report: `docs/discovery/discovery_2026-10-04_object_edge_delete.md` (P4 content, with «Decisions taken (unattended)» and «Decisions awaiting Alfonso»), committed before any code.
2. Fix: an object-as-edge gets its own context menu. Recommended content, adopt unless the discovery proves it wrong: «Delete <MetaclassName>» (danger, trash icon) that deletes the edge-object DObject through the same canonical path the canvas uses to delete an M1 object node (find it; one TRANSACTION, the object leaves its container/model, every slot pointing to it is cleared as the node delete already does), plus «Reset routing» when it has waypoints. No «Convert to Inheritance», no «Delete reference», no «Create edge view» (an object-as-edge already has its view). The Delete/Backspace key on a selected object-as-edge does the same delete. Undo (Cmd+Z) restores the transition with its endpoints and label: measure it.
3. Ordinary M2 references and inheritance edges, and ordinary M1 links (`deleteM1Link`, P-2026-09-30-1542), keep their exact current behaviour.

## DOVE

`frontend/src/components/editor-v2/EditorV2.tsx` (edge context menu, `deleteEdge`, the key handler); `frontend/src/components/editor-v2/sync/canvasToJjom.ts` only if the delete path needs a helper there (critical zone: Layer Impact Report first, in the discovery report); tests next to the code you change (`__tests__/`); a probe under `frontend/scripts/probe/object-edge-delete.ts`; closure docs: this prompt's Status, `docs/log-inbox/views.md`, the discovery report, one R- row in `docs/decisions.md` only if a design choice needs it (next free R-B or R-VP number, provisional unattended, never renumber). A file outside this list: stop with `Outcome: question`.

## COME

1. Read `CLAUDE.md` (§3, §5, §6, §17, §21.2), RC-14, RC-21, RC-25, RC-26, RC-30, the log-inbox `views.md` and `versionfixer.md` entries of 2026-09-30 about reference delete, and `discovery_2026-09-30_reference_delete.md`.
2. Baseline gates first: `npm run typecheck` (the 14 of §17), full vitest (the 9 known red at import; `criticalZone.test.ts` with the go-ahead variable unset, or report it as the known ticket), `npm run build`.
3. Tests first (red before the fix): menu items for an object-as-edge vs a reference vs an inheritance edge; the delete removes the DObject and its edge does not come back after a sync; an M1 link and an M2 reference delete unchanged.
4. Implement, then gates again, then a mutation bench on the new branches of the menu and the delete (report killed/total).
5. Probe through `lane-run probe ~/jjodel-w-objedgedel frontend/scripts/probe/object-edge-delete.ts --port 3084` (never 3000, 3001, 3003), 1600x1000, light: open DemoESM M1, right-click a transition (menu labels from the DOM), delete it, count edges and DObjects of that metaclass before/after, wait two syncs and recount, Cmd+Z and recount, select another transition and press Delete, recount; then the four demo scenes' default panes identical to the trunk (`43685438b`) before any action. Console errors listed. Crops of the menu before and after the fix in `~/.jjodel-lanes/P-2026-10-04-0130/crops/`.
6. Commits: discovery (`docs:`), tests and fix (`fix:` and `test:`, code and docs never in the same commit), probe (`probe:`), closure (`docs:`: Status flip with lane, shas, gates, probe outcome; inbox entry). Stage by explicit path. Stop with `Outcome: hard-stop` (visual check due). Do not merge.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree and `~/.jjodel-lanes/P-2026-10-04-0130/` (no `/tmp`: scratch under the gitignored `frontend/scripts/smoke/_tmp_*` or the lane directory), a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

P-2026-09-30-1542 (M1 link delete, `deleteM1Link`, merge `6ecf05100`); R-B13, R-B16 (object-as-edge endpoints); `handleReconnect` in `EditorV2.tsx` (the `irObjectAsEdge` branch, model of how the synthetic edge maps to its DObject); `edgeSelectionTarget.ts`; `useJjomSelection.ts`.

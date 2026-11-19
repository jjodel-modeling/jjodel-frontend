# Multi-tab L4c: sync registries keyed by model (critical zone)

Prompt-ID: P-2026-11-19-1530
Chat: C-2026-11-18-2337
Front: multi-tab
Status: eseguito 2026-11-19 · lane full · 2837e117d, dfef10a39 · verifica visiva non applicabile (no visual change; chat check 2026-11-19 15:57 on the probe numbers: S1 5 registered edges kept, S2 Families 8 edges stable, S3 drag kept, S4 drop one node no duplicate edge, S5 save/reload identical; gates green)
Lane: full (implementation, critical zone, standing go-ahead R-MT-26 (4); Alfonso's GO 2026-11-19 15:28 «via fino alla fine con /lane auto» on the recommendations of the editor groups discovery)
Depends: P-2026-11-19-1330 and P-2026-11-19-1350 (editor groups discovery, Q7: L4c first; Layer Impact Report in §4.4)
Worktree: ~/jjodel-w-mtl4c, branch multi-tab-l4c, created from the trunk `alfonso-frontend-jjtl` at 2f9277a66, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (words in `~/.jjodel-lanes/P-2026-11-19-1530/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. A dev server is allowed on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3790, 4700), stopped before exit unless the hard stop needs it. Every reply opens with [P-2026-11-19-1530 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: four lanes on this front hit it. Keep reads to regions; if you get near it, commit what is green and write the handoff before anything else.

## COSA

Make the sync registries of `syncState.ts` keyed by model, so that unmounting the last canvas of model A no longer clears the entries of model B. The hazard is measured: Apartment in one group, its metamodel SmartBuilding in another; closing Apartment's last tab took SmartBuilding's registered edges from 5 to 0, and they stayed 0.

The design is the Layer Impact Report of §4.4 of `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md`, which this prompt's commit copies onto this branch from `multi-tab-groups` at 5fa416d90 (it is the same file, verbatim). Follow it:

- each registry entry records the model that wrote it; the unmount clear releases only the model being released;
- readers (`isCanvasUpdated`, `hasCanvasEdgePair`, `getEdgeRefId`, `consumeDropCreated`) keep their signatures and look across models;
- writers get an optional trailing `modelId`; a call without it files under a shared bucket cleared as today;
- unchanged: populate ownership (L4, R-MT-17), `BOUNCE_WINDOW_MS`, key formats (Rule 13), Step 4 deps, every TRANSACTION.

The file list of §4.4 is approved (Rule 19 satisfied by this prompt): `syncState.ts`, `useJjomSync.ts`, `canvasToJjom.ts`, `useM1ReferenceEdges.ts` (critical zone), `m1EdgeSweep.ts`, `jjomTransformers.ts`, `useJjomSelection.ts`, `EditorV2.tsx`, a test of `syncState.ts`, the probe. A file outside it needs a question. Re-read every writer call site before editing (the LIR asks for it) and list them in the report addendum.

## COME

1. Tests first on `syncState.ts`: two models, release one, the other's entries survive; shared bucket behaves as today; readers see entries of every model.
2. Implement, then thread the model id through the writers.
3. Gates: typecheck at baseline, vitest green (known import failures excepted), build ok, `npm run check:docs` from `frontend/`.
4. Probe on the dev server, the smoke scenarios of §4.4: the inverted measurement (after A's last tab closes, B keeps its 5 registered edges, re-read after 6 s); Families.ecore 8 edges stable across opening and closing an M1 tab; drop on a canvas while another model's tab closes gives one node and no duplicate edge; a drag on B while A's last tab closes keeps its position; save, reopen, identical state. Two groups on the trunk are made as the parent discovery did (the dock-level split of L6c/L6d); say how.
5. Commits: code (pathspec), then docs: an addendum section `## 11. L4c as implemented` in the report (writers re-read, numbers of the probe), a decision row R-MT-29 (L4c, registries keyed by model), the log entry left for after the GO.

HARD STOP with the probe numbers, ready for the merge into the trunk.

# Prompt: Petri net (classic), transition name clear of the arcs, outside vertex labels reserved in ELK

Prompt-ID: P-2026-10-03-1415
Chat: C-2026-10-01-2215
Lane: full (short discovery with a saved report, then implementation in the same session, hard stop before any merge). Tier: heavy (touches `elkLayout.ts` and the derive folder; stop before any file under `viewpoint/ir/` or the critical zone). Model: the default of `.claude/settings.json`, no deviation.
Status: da eseguire

Worktree: `~/jjodel-w-petriname`, branch `petri-transition-name`, created from the trunk `alfonso-frontend-jjtl` after the merges of `derived-notations-polish` (P-2026-10-03-1405) and of the lane P-2026-10-03-1304 (derived notations, edges, anchors and layout) if it has merged. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this file); if any differs, stop with `Outcome: blocked`.

## Decision (Alfonso, 2026-10-03, «si»)

In Petri net (classic) the transition name no longer sits on the side where the arcs leave the bar: after a toolbar auto-layout, Phase 2 of the ELK lane measured 2 transition names (`t1`, `t2`) crossed by their outgoing arc (report of P-2026-10-01-2215, question 1). The name moves to a side the arcs do not use: above the bar when the bar is vertical (arcs left and right), beside it when the bar is horizontal (arcs above and below). This amends R-VP-24, ratified by Alfonso: record it as a new R-VP row (next free number, grep first; the trunk had R-VP-52 as the highest on 2026-10-03 morning), ratified by Alfonso 2026-10-03, amending R-VP-24 by reference without rewriting it.

Same decision: the outside labels of vertices (the classic transition name, the place name below the circle, and any other `position: 'outside'` label of a derived notation) are reserved in the ELK input, so that the toolbar auto-layout spaces nodes knowing where their names go.

## COSA

1. **Discovery first (short, read-only).** Read the trunk state of the classic Petri branch of `viewpointDerivation.ts` (on 2026-10-03 the transition label was `{ position: 'outside', anchor: 'e', … }`, about line 971) and what the lanes P-2026-10-03-1300 and P-2026-10-03-1304 changed there and in `elkLayout.ts`: bar size, bar orientation (1304 evaluated an automatic rotation of bars by the direction of their neighbours), anchors, layout profile. Find where outside vertex labels are measured and how `elkLayout.ts` gets edge labels today (`labelsOf`, about line 308), and confirm in `node_modules/elkjs` the option names for node labels placed outside (for example `elk.nodeLabels.placement` with `OUTSIDE V_TOP H_CENTER`, `elk.nodeSize.constraints` with `NODE_LABELS`); cite only names you found. Save the report as `docs/discovery/discovery_2026-10-03_petri_transition_name.md` (objective, files read with full paths, findings with file and line, risks, questions) and commit it (`docs:`) before editing any code.
2. **Transition name.** In the classic Petri derivation, place the name on the side the arcs do not use. If bars have a fixed orientation on the trunk, a fixed anchor is enough (vertical bar under the RIGHT flow: anchor `'n'`). If 1304 landed an automatic rotation, the anchor follows the orientation with the same rule, computed where the orientation is computed, never persisted. If this needs a file under `viewpoint/ir/` or a critical-zone file, stop with `Outcome: question` and a Layer Impact Report.
3. **ELK input.** In `elkLayout.ts`, pass each vertex's outside labels to ELK as node labels with their measured width and height, placed outside on the side of their anchor, so ELK reserves the room. Positions mapped back stay the node's own box (the label is not part of the node). Only the toolbar auto-layout path changes; opening a project or a viewpoint still uses today's path.

Behaviour that must not change: dragging, manual waypoints, pinned anchors, the persisted model, every notation other than Petri net (classic) at rest (0 px on the four demo scenes and on DemoFlowB's derived viewpoints before any auto-layout). Expected change at rest: only the position of the classic Petri transition names on DemoPetri.

## DOVE

`frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` (classic Petri branch) and its tests; `frontend/src/components/editor-v2/utils/elkLayout.ts` and `elkLayout.test.ts`; the discovery report; `docs/decisions.md`; a log entry in `docs/log-inbox/views.md`; this file's Status line. Anything else: stop and ask. Never: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`, files under `viewpoint/ir/`.

## COME

1. Read `CLAUDE.md` (sections 3, 5, 6, 17, 21.2), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16 and RC-20..RC-34, the ELK discovery report `docs/discovery/discovery_2026-10-01_elk_layout_quality.md` and its Phase 2 addendum, R-VP-24 and R-VP-40..52 in `docs/decisions.md`.
2. Discovery and report (COSA 1), committed.
3. Tests first: the classic transition label's anchor (and its rule if orientation is dynamic); the ELK input carries outside vertex labels with their sizes and placement; the mapped positions are the node boxes. Red before, green after.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`. Mutation bench on the new input-builder code and on the anchor rule; report the score.
5. Measure with the probe of the ELK lane on a free port (not 3000, 3001, 3003): after a real toolbar auto-layout, per scene, node overlaps, edge-node intersections, label collisions (vertex outside labels included) and crossings, next to the Phase 2 numbers (Petri 2 label collisions, every other scene 0). Target: 0 everywhere, no other scene worse. Rest check as above. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_petriname_crops/` (gitignored): DemoPetri at rest and after auto-layout, before and after.
6. Commits: `feat:` code and tests, `docs:` decision, log entry and Status flip; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the metrics table, the mutation score, the decisions taken and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, critical-zone files, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

R-VP-24 (Petri net (classic), ratified); R-VP-40..52 (ELK auto-layout, merge `788570c06`); question 1 of P-2026-10-01-2215 Phase 2; lanes P-2026-10-03-1300 (derived notations polish, merge P-2026-10-03-1405) and P-2026-10-03-1304 (edges, anchors and layout, bar rotation); the ticket on Petri classic bars nearly invisible in dark mode (out of scope).

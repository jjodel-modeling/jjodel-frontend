# Prompt: Phase 2, ELK auto-layout used in full (input, routes, per-notation profile, 8 px snap)

Prompt-ID: P-2026-10-01-2215
Chat: C-2026-10-01-2215
Lane: Phase 2 of the ELK layout discovery, same session. No critical-zone go-ahead (RC-30 not given). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-elklayout`, branch `elk-layout-disc`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this file); if any differs, stop with `Outcome: blocked`.

## Decisions (Alfonso, 2026-10-02, «ok alle raccomandazioni»)

Ratified by Alfonso: Q1 (one lane, scope below, merged on the trunk before the 2026-10-07 freeze; it may change what the MODELS demo scenes show after an auto-layout); D-B (aligning React Flow handles with ELK port positions waits for a later critical-zone lane); Q7 / D-C (Activity (UML) fork/join bars follow the layout direction: horizontal 120 x 5 when the flow runs down; this amends R-VP-26 (2)).
Adopted by the chat, provisional unattended (RC-25): Q2 (optional `layout` key on `DerivedNotation` in `notations.ts`, copied into the derived viewpoint's `_state`), Q3 (ELK routes are drawn, not persisted), Q4 (auto-layout snaps to 8 px, the 16 px drag snap is unchanged), Q5 (no fixed-side ports; each edge's sides come from its ELK route), Q6 (ER (Chen): stress with an overlap-removal pass and straight lines).

Record them in `docs/decisions.md` as new R-VP rows (next free numbers, grep first): the three ratified ones as ratified 2026-10-02 (R-VP-26 (2) amended by reference, not rewritten), the five others as `provisional, unattended`.

## COSA

Make the toolbar auto-layout produce what your report measured as the best variant per scene, without touching the critical zone.

1. Sync first: merge the current trunk tip `alfonso-frontend-jjtl` into this branch (`git merge --no-ff`, record the sha). Conflicts outside `docs/` mean stop with `Outcome: question`.
2. ELK input (`elkLayout.ts`): real node sizes (measured, falling back to the IR-declared size); hidden nodes of object-edges (ControlFlow, Arc, Transition) removed, their edges passed as edges; edge labels passed with measured width and height; `considerModelOrder` off; the profile read from the notation (point 4).
3. ELK routes drawn: the edge renderer draws the ELK route (start, bend points, end) when one is present and still valid; a route lives in session only (a transient field, name grepped first, never written to JjOM or to the persisted model) and is dropped as soon as either end node moves or resizes, falling back to today's router. Edge sides come from the route. If drawing the route or setting the sides needs `portDistribution.ts`, `handlePosition.ts`, `useJjomSync.ts`, `canvasToJjom.ts` or `jjomTransformers.ts`, stop with `Outcome: question` and the Layer Impact Report: no go-ahead was given.
4. Per-notation profile as data: optional `layout` on `DerivedNotation` (direction, algorithm, layer constraints by role, node placement, spacing), copied into the derived viewpoint's `_state` at derivation; values from your report's best variants (Flowchart and Activity (UML) DOWN, Petri net (classic) RIGHT, Statechart (UML) as V4, ER (Chen) stress plus overlap removal with straight lines, default class view unchanged unless V4 measured better). A viewpoint without a profile keeps today's strategy.
5. Snap: auto-layout positions on the 8 px grid.
6. Activity (UML) fork/join: the bar follows the layout direction (Q7).

Behaviour that must not change: opening any project or viewpoint without pressing auto-layout (0 px on the four demo scenes and on DemoFlowB's derived viewpoints at rest); dragging, manual waypoints, pinned anchors; the persisted model.

## DOVE

`frontend/src/components/editor-v2/utils/elkLayout.ts` and its tests; `handleAutoLayout` in `EditorV2.tsx`; the edge renderer that draws the route (name it in the report before editing); `viewpoint/derive/notations.ts`, `viewpoint/derive/viewpointDerivation.ts` (profile copy and Q7); `docs/decisions.md`; a log entry in `docs/log-inbox/views.md`; this file's Status line. Anything else: stop and ask. Critical-zone files: never.

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, your Phase 1 report and `_picks.json`.
2. Tests first: unit tests on the ELK input builder (real sizes, no hidden nodes, labels present, model order off, profile honoured, 8 px snap) and on route invalidation; red on the current branch, green after.
3. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`. Mutation bench on the input builder and on route invalidation; report the score.
4. Measure with the Phase 1 probe on a free port (not 3000, 3001, 3003): the same metrics per scene after a real toolbar auto-layout in the app, next to V0 and to the Phase 1 best variant. Target: 0 node overlaps, 0 edge-node intersections, 0 label collisions in every scene; crossings and bends no worse than the best variant. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_elk_crops/after_*` (gitignored). Rest checks: the four demo scenes and DemoFlowB's derived viewpoints 0 px before any auto-layout.
5. Commits: `feat:` code and tests, `docs:` decisions, log entry and Status flip; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the metrics table (V0, Phase 1 best, after), the mutation score, the decisions taken.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, critical-zone files, Alfonso's browser, a call to an AI model.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-01_elk_layout_quality.md` (`e83a16d41`), its questions Q1..Q7 and D-A..D-C; R-VP-26; the ticket on hidden object-edge nodes (`a2b4e8168`); the open ticket on guard labels overlapping on DemoFlowB.

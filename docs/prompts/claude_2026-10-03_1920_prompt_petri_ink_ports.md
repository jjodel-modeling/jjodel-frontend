# Prompt: Petri classic bar ink in dark, place label off the arrowhead, handles on ELK ports (D-B)

Prompt-ID: P-2026-10-03-1920
Chat: C-2026-10-03-1610
Lane: full (two-phase: Phase 1 re-measure and Layer Impact Report, hard stop; Phase 2 after the chat's GO in the same session). Tier: heavy (RC-32: critical zone). Model: the default of `.claude/settings.json`, no deviation. Critical-zone go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-03-1920`), Alfonso's «esegui tutto adesso in lane auto» of 2026-10-03; the Layer Impact Report stays the first step of Phase 2.
Status: da eseguire

Worktree: `~/jjodel-w-petriports`, branch `petri-ink-ports`, cut by the chat from `alfonso-frontend-jjtl` at `106aae181` (right after the merge of `derived-notations-edges`, P-2026-10-03-1304/1901), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

Three defects of the derived notations, found on 2026-10-01/02, left out of earlier lanes because they share the edge-end and handle code that P-2026-10-03-1304 has just changed. That lane is now on the trunk: read its report `docs/discovery/discovery_2026-10-03_derived_notations_edges.md` and its diff (`git diff 7a249ef87..106aae181`) first. It changed, among others: classic Petri arcs from `curve: 'arc'` to the orthogonal router, bars attached on their long sides only (`assignGeometricHandles`, `irEdgeViews.ts`), diamond ends, the ELK `fixedAlignment`. Some of the three items may be gone or changed after it; measure before fixing.

1. **Petri classic transition bars nearly invisible in dark.** The bar fill is `#334155` on the dark canvas `#1e293b` (seen 2026-10-02, pre-existing). Since R-VP-51 (P-2026-10-02-2356) outside marks use the token `--color-canvas-ink` (light rgb(15,23,42), dark rgba(255,255,255,0.92)); R-VP-50 keeps glyph classes out of «Color by metaclass». Expected: the bar (and every notation glyph that draws a solid ink fill: fork/join bars, initial dot, final bull's-eye) reads in both themes, with a contrast measured against the canvas background, and «Color by metaclass» keeps excluding them.
2. **Place label on the arrowhead.** Petri classic, a place with incoming or outgoing arcs on the side where its outside name is drawn: the name sits on the arrowhead (seen 2026-10-02 with vertical arcs). Expected: the outside name takes a side with no edge end, or is offset clear of the arrow; measure on DemoPetri at rest and after one toolbar Auto layout, in both directions of the classic profile.
3. **D-B: React Flow handles on ELK ports.** From the ELK discovery (P-2026-10-01-2215, report `docs/discovery/discovery_2026-10-01_elk_layout_quality.md`, decision D-B, Alfonso: «not urgent», then authorised now): after Auto layout ELK computes port positions and routes, but the handles the edges attach to come from `portDistribution.ts` / `handlePosition.ts`, so the drawn ends can sit off ELK's ports and the route gets an extra elbow. Expected: after an Auto layout the edge ends sit on ELK's port points (or within 1 px), with no extra elbow, and without persisting ELK routes in the first cut (R-VP-52 Q3). Say what P-2026-10-03-1304's `fitRouteToEnds` and side rule already cover and what is left.

## DOVE

Phase 1: read-only on the app. You may add a probe under `frontend/scripts/probe/` (grep the name first; the probe of P-2026-10-03-1304 `derived-notations-edges.ts` and the ELK probes archived in `~/.jjodel-lanes/archive/elk-layout-disc-probes-2026-10-03/` are the models) and use fixtures from `/Users/alfonso/jjodel-demo-exports/` (read only). Write `docs/discovery/discovery_2026-10-03_petri_ink_ports.md` (§0 «Answer in brief» first, at most 40 lines, «Decisions taken (unattended)» and «Decisions awaiting Alfonso») and the Layer Impact Report under `docs/lir/`.

Phase 2: only the files the report names and the GO approves. Expected: `viewpoint/derive/notations.ts` or `viewpointDerivation.ts` and the IR glyph drawing (`viewpoint/ir/IRNodeContent.tsx`, critical since 2026-10-03) for 1; `viewpoint/ir/irEdgeViews.ts` or the outside-label placement for 2; `portDistribution.ts`, `handlePosition.ts`, `edgeUtils.ts`, `UnifiedEdge.tsx`, `elkLayout.ts` for 3; plus their tests. Not in this lane: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `DV.tsx`, `VersionFixer.tsx` (stop with `Outcome: question` if a fix needs one). Lane P-2026-10-03-1845 (I/O board) works under `editor-v2/sim/` and `model/simulation/`: never touch those.

## COME

### Phase 1, ends at a hard stop

1. Read `CLAUDE.md` (sections 3, 5, 6, 17, 21.2), `docs/PROTOCOL.md` P16, RC-14, RC-21, RC-25, RC-26, RC-30, R-VP-24..26, R-VP-36, R-VP-50..53, the two discovery reports named above and the files of DOVE.
2. Probe through `lane-run probe <worktree> <probe.ts> --port 3080` (never 3000, 3001 or 3003), at 1600×1000, light and dark, on DemoPetri (classic), DemoFlowB (Activity), DemoPEST and DemoESM (Statechart): contrast of each solid glyph against the canvas background in both themes; for every place label, the distance from its box to the nearest arrowhead, at rest and after Auto layout; for every edge end after Auto layout, the distance between the drawn end and ELK's port point, and the number of bends against ELK's route. Numbers, not impressions.
3. For each of the three items: cause with file and line, smallest fix, layer impact, what the four demo scenes will show differently. Commit probe and report (`probe:`, `docs:`), stop with `Outcome: hard-stop`, the report's path and its two decision lists.

### Phase 2, after the chat's GO

4. Layer Impact Report committed before the first edit. Tests red first for each fix.
5. Implement. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the full vitest suite, `npm run build` exit 0; mutation bench on each fix. Rerun the probe of step 2: contrast at least 3:1 for each glyph in both themes, no place label within 4 px of an arrowhead, every end within 1 px of its ELK port after Auto layout.
6. Crops in `~/.jjodel-lanes/P-2026-10-03-1920/` (before and after, light and dark, each scene). Default views without an Auto layout: byte-identical to `106aae181` unless the report says why.
7. Take the trunk if it moved (RC-14), rerun gates and probe. Commits `fix:` code and tests, then the closure docs commit (Status flip with lane, shas, gates and probe outcome; `docs/log-inbox/views.md` entry); stage by explicit path. Stop with `Outcome: hard-stop` for the chat's visual check. Do not merge.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

P-2026-10-01-2215 (ELK discovery, D-B), P-2026-10-03-1304/1901 (derived notations edges, merged `106aae181`), R-VP-50 and R-VP-51 (glyph ink), R-VP-52 (ELK auto-layout); walks of 2026-10-02 (`sessione_CORRENTE.md`, section of chat C-2026-10-01-2220).

# Prompt: A3 back, handles of an ELK-routed edge on its drawn ends (D-B, R-VP-60)

Prompt-ID: P-2026-10-10-0915
Chat: C-2026-10-03-1610
Lane: full (A3 restored from history, measured, hard stop before any merge). Tier: heavy (RC-32: critical zone). Model: the default of `.claude/settings.json`, no deviation. Critical-zone go-ahead: RC-30, given by the chat at launch (`--critical-zone-goahead P-2026-10-10-0915`) on Alfonso's yes of 2026-10-10; the Layer Impact Report is still the first commit, before any code change.
Status: eseguito 2026-10-10 · lane elk-handles-a3 · LIR 10f92eea9 (docs/lir/lir_2026-10-10_elk_handles_a3.md), revert of 04c13e039 dd21d2e45, probe a57bd4d53 · non fuso: hard-stop · R-VP-60 reinstated provisional, awaits Alfonso · gates: typecheck 14 (the §17 set), vitest 7676 passed with the §17 nine red at import (criticalZone.test.ts green, variable unset), build exit 0 · probe petri-ink-ports on 3081 73/73 (trunk code 63/73, the 10 A3 checks red as their control): handles off the drawn end after Auto layout 33 of 68 → 2 (work->d1, 6 px), on another side 5 → 0, extra bends 0, A1 16.3:1 and A2 distances as the trunk, the four default panes identical to the trunk run · loop check on 3080: Flowchart, Activity (UML), Statechart (PEST) 60 drags and 20 edge selections each, 0 crashes, nested depth ≤ 3, DynamicHandles renders per drag 12.4, 7.9, 12.9 (trunk 12.2, 14.3, 12.7); Petri net (classic) crashes («Maximum update depth», StoreUpdater) on 5 of 5 fresh pages on the branch and on the trunk alike, 3/3 without instrumentation, 3/3 at rest (ticket) · DemoESM ten presses, events hidden: panel lines equal to the trunk's in the default viewpoint and the derived Statechart, 0 page errors, pins and handles unmoved by the run and by Stop

Worktree: `~/jjodel-w-elkhandles`, branch `elk-handles-a3`, cut by the chat from `alfonso-frontend-jjtl` at the tip of 2026-10-10, `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run`. Before anything else: `pwd`, branch and `git log -1` (the docs commit that added this prompt); if any differs, stop with `Outcome: blocked`.

## COSA

A3 was built and measured by P-2026-10-03-1920 (`6756eddd2`, row R-VP-60) and withdrawn before the MODELS demo by P-2026-10-04-0010 (`04c13e039`, R-VP-60 «withdrawn 2026-10-04, after Málaga»). Alfonso asked to resume it after Málaga. After an Auto layout, the React Flow handles of an edge routed by ELK sit at their uniform slots instead of the route's drawn ends: 34 of 68 ends more than 1 px off, 5 on another side. With A3 the probe measured 2 of 68 and 0, with 0 extra bends and the default views byte-identical.

Restore A3 as it was measured, keep A1 and A2 (R-VP-58, R-VP-59) as they are on the trunk, and prove that A3 does not bring back the «Maximum update depth» loop of 2026-10-01: `DynamicHandles` keys were part of that cascade (P-2026-10-01-1655, P-2026-10-01-2136), and A3 adds the pins to `edgeKey` and `edgeTopologyKey`.

Since `04c13e039` the only change to the files A3 touches or reads is `UnifiedEdge.tsx` (P-2026-10-04-0935, `occupiesCanvas` for event nodes hidden during a run); check that a node the run hides keeps its pinned handles coherent.

Not in this lane, report only: the known residues of A3 (DemoFlowB `work→d1` ends 6 px off because the renderer slides that leg onto the diamond corner; Activity junction ends; handles on circles 1.1 to 2.7 px from the bounding-box end; edges outside derived notations).

## DOVE

`git revert 04c13e039` on the branch (one revert commit). It restores `handlePosition.ts`, `DynamicHandles.tsx`, the A3 hunks of `viewpoint/ir/irEdgeViews.ts` and `viewpoint/ir/__tests__/irElkPorts.test.ts`, and the 11th argument `() => undefined` at `viewpoint/ir/__tests__/irLabelAnchors.test.ts:77`. Keep every A2 hunk. `frontend/scripts/probe/petri-ink-ports.ts`: re-enable its A3 assertions (handles within 1 px, no handle on another side). You may add one probe for the loop check under `frontend/scripts/probe/` (grep the name first). `docs/decisions.md`: R-VP-60 gets one added line, «reinstated provisional 2026-10-10, P-2026-10-10-0915, awaits Alfonso's ratification»; never renumber. Layer Impact Report under `docs/lir/`. Closure docs: this prompt's Status and `docs/log-inbox/views.md`. A fix that needs any other file under `frontend/src/`: stop with `Outcome: question`. Not in this lane: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `DV.tsx`, `VersionFixer.tsx`, `portDistribution.ts`.

## COME

1. Read `CLAUDE.md` (sections 3, 5, 6, 17, 21.2), `docs/PROTOCOL.md` P16, RC-14, RC-21, RC-25, RC-26, RC-30, D-UI-15 (light theme only), R-VP-49, R-VP-53, R-VP-58..60, the report `docs/discovery/discovery_2026-10-03_petri_ink_ports.md` (§0, §9, §10), the commits `6756eddd2` and `04c13e039`, and the «Maximum update depth» report of P-2026-10-01-1655 (§3.4, §9).
2. Commit the Layer Impact Report (`docs:`), then the revert. Tests: `irElkPorts.test.ts` and the A1 and A2 test files green; typecheck at the §17 baseline of 14.
3. Gates in the foreground: `npm run typecheck`, the full vitest suite (go-ahead variable unset for `criticalZone.test.ts`, or report it as the known ticket), `npm run build` exit 0.
4. Probe through `lane-run probe <worktree> <probe.ts> --port 3080` (never 3000, 3001 or 3003), 1600×1000, light theme, the four demo scenes:
   - `petri-ink-ports.ts`: handles more than 1 px off after Auto layout (expected 2 of 68), handles on another side (expected 0), extra bends (0), A1 contrast and A2 label distances unchanged, default views byte-identical to the trunk.
   - Loop check: on the four derived viewpoints, after one Auto layout, 60 drags each (node drags and edge selections, as P-2026-10-01-1655 did), fresh pages: 0 «Maximum update depth», 0 `CanvasErrorBoundary` fallbacks, nested render depth at most 3. Count `DynamicHandles` renders per drag before and after the revert and report both.
   - DemoESM Simulation: run the demo script's ten presses with events hidden (P-2026-10-04-0935): 0 page errors, the panel lines equal to the trunk's.
   Crops in `~/.jjodel-lanes/P-2026-10-10-0915/` (Petri classic, Flowchart and Activity after Auto layout, trunk and branch side by side).
5. Commits: `revert:` (subject naming A3 and R-VP-60), `probe:`, then the closure docs (`docs:`, Status flip with lane, shas, gates and probe outcome; inbox entry); stage by explicit path. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (R-VP-60 ratification, merge). Stop with `Outcome: hard-stop`. Do not merge.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree and `~/.jjodel-lanes/P-2026-10-10-0915/` (no `/tmp`: scratch under the worktree's gitignored `frontend/scripts/smoke/_tmp_*` or the lane directory), a file outside DOVE, removing the `frontend/node_modules` link.

## RIFERIMENTI

P-2026-10-01-2215 (ELK discovery, D-B); P-2026-10-03-1920 (A3 `6756eddd2`, probe `dc893ce3c`, closure `17969f5d7`); P-2026-10-04-0010 (revert `04c13e039`, R-VP-60 withdrawn); P-2026-10-04-0044 (merge `544fbd19f`); P-2026-10-01-1655 and P-2026-10-01-2136 (the update-depth loop and `DynamicHandles` memo); P-2026-10-04-0935 (events hidden during a run); Alfonso's request of 2026-10-04 to resume A3 after Málaga.

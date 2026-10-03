# Prompt: measure that the tree-connector crossings follow the edge path registry
Prompt-ID: P-2026-10-03-1002
Chat: C-2026-10-01-1725
Lane: full (two-phase: Phase 1 finds or builds a scene where an edge crosses a tree connector and writes the report, Phase 2 after the chat's GO, same session). Tier: heavy (RC-32 forces it on a full lane; probe and fixture only, no app code unless the report shows a defect and the GO names it). Model: the default of .claude/settings.json.
Status: da eseguire
Worktree: `~/jjodel-w-treecross`, branch `tree-crossing-scene`, cut from the trunk at `fba1549ee` (`frontend/node_modules` symlinked, P14).

## COSA
Lane P-2026-10-02-1450 (merged as `cd348df03`) added a version counter to the edge path registry (`frontend/src/components/editor-v2/utils/edgeUtils.ts`: `getEdgePathsVersion`, `subscribeEdgePaths`). `UnifiedEdge.tsx` and `hooks/useTreeLayout.ts` read it through `useSyncExternalStore` and add it to their crossings memos, so line jumps follow the registry now that the editors no longer re-render every frame. The `UnifiedEdge` side is measured (two arcs checked on the demo scenes). The `useTreeLayout` side is wired but unmeasured: no demo scene has an edge that crosses a tree connector, so nothing shows whether its two crossings memos (`useTreeLayout.ts` around lines 203-217 and 219-242) recompute when an edge moves.
Wanted: a scene and a probe that exercise it, and a verdict: does the tree-connector crossing set follow an edge that is dragged across a tree connector, with the editors idle between actions, yes or no, with numbers.

## DOVE
Phase 1: read-only on the app; it may add a probe under `frontend/scripts/probe/` (name grepped first, for example `tree-crossing.ts`) and a fixture under `frontend/scripts/probe/fixtures/` or in `_tmp_` files (gitignored) if no fixture folder exists; plus the discovery report. Phase 2: only the files the report names; app code (`useTreeLayout.ts`, `edgeUtils.ts`, `UnifiedEdge.tsx`) only if the report shows a defect and the GO names the fix. The critical-zone files listed in CLAUDE.md section 21.2 stay untouched.

## COME
### Phase 1, read-only, ends at a hard stop
1. Read `CLAUDE.md` (§3, §6, §17, §21.2), `docs/PROTOCOL.md` P16 and RC-20/21/25/26/30, `docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md` (the Phase 2 addenda on the registry version and line jumps), `edgeUtils.ts`, `useTreeLayout.ts` whole, the crossings code in `UnifiedEdge.tsx`, and `frontend/scripts/probe/hidden-tab-loop.ts` (the `interact` and `compare` modes are the model for how to drive and dump a pane).
2. Find what a tree connector is in this code (which relation or layout produces tree segments, what registers them, what the crossings memos compare), and build the smallest project, as a `.jjodel` export or seeded through the probe, in which one edge crosses a tree connector. Read-only means the demo exports in `/Users/alfonso/jjodel-demo-exports/` are not modified.
3. Probe through `lane-run probe` on a free port other than 3001 (for example 3017): open the scene, sample renders per second at rest (expected 0 after fix B), record the crossing arcs or the crossings set that `useTreeLayout` computes (by DOM or by a debug read that does not change app code), then drag a node so the edge moves across the connector and record again, then drag back. Expected if wired right: the set changes with the edge, with no extra render at rest.
4. If the crossing set does not follow the edge, find the reason with file and line before proposing anything; do not fix in Phase 1.
5. Write `docs/discovery/discovery_2026-10-03_tree_crossing_scene.md`: `## 0. Answer in brief` first (at most 25 lines: the scene, the numbers, the verdict, what Phase 2 would add), then files read with full paths, findings, risks, open questions for Alfonso. Commit the probe, the fixture and the report with `(P-2026-10-03-1002)`. Hard stop: report in chat and wait for `[P-2026-10-03-1002] GO`.

### Phase 2, after the GO
6. The GO says either: keep the probe and fixture as the acceptance measure and close (most likely if the verdict is yes), or fix the named defect with a test first. Gates: `npm run typecheck` (baseline 14, known set), `npm run typecheck:scripts`, vitest of the touched folders with counts before and after, `npm run build`, `npm run check:docs`, `npm run check:scripts`, and the four demo scenes unchanged (dumps identical to the trunk).
7. Commits per concern with `(P-2026-10-03-1002)` in the subject, then one docs commit with the log entry and this prompt's Status. No merge.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, port 3001, writes in any other tree, dark-theme work.

## RIFERIMENTI
- `docs/discovery/discovery_2026-10-02_hidden_tab_render_loop.md` (lines about `334a7e444`, `useTreeLayout` crossings memos at `:203-217` and `:219-242`, segments registered in the effect at `:170-194`).
- `frontend/scripts/probe/hidden-tab-loop.ts` (modes `interact` and `compare`; PROBE_URL refuses 3001).
- `frontend/src/components/editor-v2/utils/edgeUtils.ts`, `hooks/useTreeLayout.ts`, `edges/UnifiedEdge.tsx`.

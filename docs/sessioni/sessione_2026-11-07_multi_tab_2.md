# Section: chat C-2026-11-07-0425 (front multi-tab, /lane auto from 04:25 to about 09:15)

Written 2026-11-07 at about 09:15 (Rome). Takes the front over from C-2026-11-06-2333 (`fronts.json` owner since 753122b0b). Replaces only this front's section of `sessione_CORRENTE.md`.

## State

- On the trunk and pushed (up to 306baa1a5): the layout-key fix R-MT-19 (merge da2af3bf7). The incremental sync of `useJjomSync.ts` now has the layout key in each vertex snapshot (03a093081), and a vertex whose only change is the key skips the transformer and re-reads its position and size under the new key (8328662df, `rekeyedNode` and `layoutKeyOnlyChange` in `vertexSnapshot.ts`). Probes on the 3-node fixture: 3/3 at every step (A, B, A, reload on B, B to A, rename); container scene unchanged.
- On the trunk and pushed: L4b (merge ee9d7dbba, closure bdd976d3e, P-2026-11-07-0853). `acquireProducerMount` in `problems/registry.ts`: Conformance, SimCheck and ValidationFreshness clear a model's problems only when their last instance for that model unmounts; one count per producer per model. Uniqueness has no unmount cleanup and is unchanged.
- Ready, not merged: L2 on branch `multi-tab-l2` (worktree `~/jjodel-w-mtl2`, code a99ea2482, closure e0a19596d). Per-tab viewpoint plumbing, `getLayoutKeyFor`, optional `viewpointId` on `EditorContext`, R-MT-18. App check 0457: V1 3/3, V2 3/3, R-MT-18 3/3, one tab 52 positions equal to the parent. Waits on Alfonso (questions 2 and 3).
- Ready, not pushed, not tagged: branch `fix/layout-key-switch` (worktree `~/jjodel-w-mtpatch`) from `origin/staging` 8a9b3c916, four `cherry-pick -x` of the fix and its tests (e24e724d6, 37e3fa9c3, 55b850dbc, 22f72ad5f). On the staging base: tsc 0 errors, 19/19 tests, build ok; no app probe. Waits on Alfonso (question 1).
- No lane of this chat running, no scheduled check of this chat pending.
- Worktrees to retire with Alfonso's yes: `~/jjodel-w-mtlk` (multi-tab-layout-key, merged), `~/jjodel-w-mtl4b` (multi-tab-l4b, merged), plus the three of the previous chat (`~/jjodel-w-multitab`, `~/jjodel-w-mtl1`, `~/jjodel-w-mtl0b`).

## Decisions taken unattended (veto window)

1. The layout-key fix was split into code-and-gates (0430) and app check (0431); 0431 measured +723 ms per switch on the 407-instance harness model and recommended a cheaper path, adopted (RC-21) as P-2026-11-07-0555, continued as 0628 after the context ceiling.
2. Merged on the median of the cost pairs (+53 ms, pairs −258, +1625, +53) though the mean is +474 ms, above the 300 ms gate the chat itself had set. The remaining cost is React Flow re-rendering and `DynamicHandles` re-measuring the nodes that really move; the parent is faster only because it leaves them at the wrong positions. Rollback: the merge lane's pre-merge tag.
3. Smoke of the fix merge given from the 0628 probes plus the chat's RC-23 on `crop_2_B`, not from a session on 3001.
4. L4b launched while L2 waited, since it does not depend on L2 (§7 of the discovery).

## Questions for Alfonso

1. The 3.2.x patch. 3.2.0 is not tagged; 3.1.1 was cut on `staging` (fixes merged into staging, release commit with version, CHANGELOG and WelcomeModal, PR to main, tag by you). Recommended: ship the fix as 3.1.2 on that path, from `fix/layout-key-switch`, after one app probe on its base.
2. L2, V3: focusing a tab whose viewpoint differs from the root calls `activateViewpoint`, which adds one undo entry per focus (two for B then back to A). Recommended: the focus write goes without an undo entry; a short lane on L2 before its merge.
3. L2, R-MT-18: a `''` saved before L1 cannot be told apart from one saved after (localStorage `jjodel.editorPrefs.<modelid>`, no version); models that carry one will open in abstract syntax. Recommended: accept it.
4. The remaining cost of a layout switch on the large model (about +0.5 s mean). Recommended: accept it; a lane on `DynamicHandles` only if it shows in use.

## Next lanes

After questions 2 and 3: the V3 fix on `multi-tab-l2`, then the L2 merge; then L3 (critical zone, standing go-ahead), L5, L4 (critical zone), L6 (gesture R-MT-9), L7. L3 builds on the layout-key fix now on the trunk.

## Lessons

- Two implementation lanes hit the context ceiling again (0555): the continuation prompt that points to the handoff, no code, measurement and closure only, worked in one run.
- `lane-run merge` takes the current minute as Prompt-ID and fails on a collision with another chat's lane: wait for the next minute.
- Timing tests red under load in full runs now also include `irCollapsedRender`, `irSelectionRing` (Chromium close timeout) and `traceMonitor`; all pass alone.
- Cost probes on this machine drift with the load of other chats: interleave pairs and judge within one load band.

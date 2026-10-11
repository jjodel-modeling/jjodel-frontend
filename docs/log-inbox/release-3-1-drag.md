# Log inbox — release 3.1, drag hardening

Entries for the release 3.1 L2 lane (front `release-3-2`, branch `rel31-drag`), kept out of the active
`docs/claude-code-log.md` while parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-12 — fix: useAutoAnchor reads the nodes at call time, drag-loop Fix A (P-2026-10-12-0011)
**Prompt**: `claude_2026-10-12_0011_prompt_release_3_1_drag_hardening.md`, release 3.1 L2, optional: Fix A of the 2026-10-10 drag-loop discovery (`useStoreApi().getState().nodes` at call time instead of `useNodes()` in `useAutoAnchor.ts`), a unit that pins it, the probe `petri-drag-loop.ts` carried to the trunk as the gate, run on 3142 with the `164f846fc` control; guard B only if Fix A leaves a crash.
**Files touched**: code `a69fef5d9`: `frontend/src/components/editor-v2/hooks/useAutoAnchor.ts`, `frontend/src/components/editor-v2/hooks/__tests__/useAutoAnchorSubscription.test.ts` (new), `frontend/scripts/probe/petri-drag-loop.ts` (new on the trunk). Report `e699bb50a`: `docs/discovery/discovery_2026-10-12_rel31_drag_hardening.md`. This commit: `docs/log-inbox/release-3-1-drag.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates: typecheck 14, the §17 set before and after; vitest 8714/8714 tests, the 9 known import reds; build exit 0; check:scripts PASS 87 files; check:docs PASS. Unit red first (2 of 3), mutation bench 4/4 killed. Probe on 3142: 0 crashes in 66 drags on 22 fresh pages, depth max 3.
**Out-of-scope changes**: no. The fixture named in the prompt was already on the trunk, identical, so it is not re-added. Five files over three commits: the three code files, the report and the inbox, each named in the prompt; `git status` clean of any other path.
**Layer Impact Report**: not-required (`useAutoAnchor.ts` is not in the §3.1 table nor in `critical-zone.mjs`)
**Smoke visivo**: passato — `npm run smoke` GREEN on 3142, 12 passed, 0 failed, 3 skipped; probe 22/22 pages without the canvas fallback
**Notes**: Control 164f846fc in a git archive copy: 4 crashes in 16 drags on 7 pages (depth 51, StoreUpdater); the same copy plus this diff: 0 in 21 on 7 pages. The trunk read 0 of 72 without Fix A, so the probe there shows no regression; the control shows the fix acting. 7 hot-updated control pages failed set-up (HMR, g), excluded. Guard B not needed. Left: /tmp/r31drag-ctrl.WLZ2. Report: docs/discovery/discovery_2026-10-12_rel31_drag_hardening.md.
**Prompt document name**: 2026-10-12 00:11

# Log inbox — release 3.1, L4 version 3.1.0

Entries for the release 3.1 lane L4 (front `release-3-2`, P-2026-10-12-0115), kept out of the active
`docs/claude-code-log.md` while parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-12 — chore(release): 3.1.0, CHANGELOG, R-REL-1 and RC-23 crops (P-2026-10-12-0115)
**Prompt**: `claude_2026-10-12_0115_prompt_release_3_1_version.md`, release 3.1 L4: gates on the trunk with L1-L3 merged, version 3.1.0, a `[3.1.0]` CHANGELOG section, decision row D4, RC-23 crops on the release build.
**Files touched**: code `4c681e535`: `frontend/package.json`, `frontend/package-lock.json`, `frontend/src/pages/components/about/AboutDialog.tsx`, `CHANGELOG.md`. Docs `4f8d50118`: `docs/decisions.md`, `docs/discovery/discovery_2026-10-12_rel31_version.md`. This entry: `docs/log-inbox/release-3-1-version.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — `npm run smoke` GREEN 12/12 on 3144 at run 1; 15 RC-23 crops on the release build (vite preview 3144), described not judged, Alfonso's GO pending
**Notes**: Gates at baseline before any edit: tsc 14, vitest 9026/9026 (9 import reds), build 0, check:docs 5/5, codegen-lazy both modes. Crop D-A1 shows: after «Add LaneSet» under lane Sales, edges enter from outside the frame and Auto layout moves Sales' nodes out of the lane; the control without the Add keeps them in (DA-1). Release commit amended once for the notation list (fb8af485c -> 4c681e535). Row id R-REL-1, before «Superate».
**Prompt document name**: 2026-10-12 01:15

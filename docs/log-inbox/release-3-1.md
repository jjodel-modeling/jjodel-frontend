# Log inbox — release 3.1

Entries for the release 3.1 lanes (front `release-3-2`), kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-12 — merge: origin/staging into rel31-staging, format 2.230 (P-2026-10-12-0010)
**Prompt**: `claude_2026-10-12_0010_prompt_release_3_1_absorb_staging.md`, L1 of release 3.1, critical zone (RC-30 go-ahead): `git merge --no-ff origin/staging` (`cb5952876`) into `rel31-staging`, LIR first, three text conflicts, gates, a probe opening a 2.229 and a 2.230 save.
**Files touched**: LIR `53b398970`: `docs/discovery/discovery_2026-10-12_rel31_staging_lir.md`. Merge `c36e49d87`: staging's 112 files; resolved `Jodie.tsx`, `defaultPrompts.ts`, `docs/decisions.md`; merge artefact `Jodie/__tests__/reservedIdentifierGate.test.ts`. This commit: `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md`, this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck 14, same set; vitest 9022 tests, 9018 passed, 4 failed (criticalZone env leak, 70/70 unset), 10 failed files as before the merge (8711 tests); build exit 0; smoke GREEN 12/12 (run 2; run 1 cold-server timeout); check:codegen-lazy 3/3; check:docs exit 0; probe 16/16.
**Out-of-scope changes**: yes — `reservedIdentifierGate.test.ts` pinned the chat prompt version 6; the union is 7 (report §2.2). Not in the prompt's conflict list; declared as a merge artefact.
**Layer Impact Report**: produced
**Smoke visivo**: passato — npm run smoke GREEN on 3141; probe 16/16, 2.229 and 2.230 crops byte-identical in `~/.jjodel-lanes/P-2026-10-12-0010/probe/`; Alfonso's visual GO pending (critical zone)
**Notes**: Both saves open, no load error, version 2.23 after load. Bench on 8 tracked saves: purge removes 0, 2.230 lists 0, control positive. Risk awaiting Alfonso: «Add» children under a graphVertex container gain a top-level vertex after 2.230 (LIR §3 A1, not run). Prompt Status not flipped. Report: `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md`.
**Prompt document name**: 2026-10-12 00:10

## 2026-10-12 — ticket: the R-IRN-19 reserved VersionFixer step is now 2.231
**Ticket**: `frontend/src/redux/VersionFixer.tsx:1193-1194` reserves «the first free number after 2.229» for the purge of the default records (R-IRN-19, amended by R-SIM-46). With `origin/staging` merged into the 3.1 line (`c36e49d87`), 2.230 is taken by the #174 step (R-NEST-6), so the reserved step is `2.230 -> 2.231`, or later if PR #184 rewrites the chain first. The comment is not edited.
**Priority**: low
**Found in**: P-2026-10-12-0010
**Detail**: docs/discovery/discovery_2026-10-12_rel31_staging_merge.md (§0, Decisions awaiting Alfonso)

## 2026-10-11 — discovery: release 3.1 scope and readiness (P-2026-10-11-1812)
**Prompt**: `claude_2026-10-11_1812_prompt_release_3_1_scope_discovery.md`, Phase 1 read-only on `c7575bcf7`: inventory since 3.0.0, codegen gate, persistence and migrations, dark theme reachability, blockers, release mechanics, gates, the cut and its lanes.
**Files touched**: report `cc9e3e4df`: `docs/discovery/discovery_2026-10-11_release_3_1_scope.md`. This commit: `docs/log-inbox/release-3-1.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no source touched. Gates on `c7575bcf7`: typecheck 14, the §17 set; vitest 8692/8692, the 9 known import reds; build exit 0; check:docs 5/5; check:codegen-lazy 3/3.
**Out-of-scope changes**: no — the report and this entry; the entry is in the lane inbox, not in the active log the prompt names (P9), declared in the report.
**Layer Impact Report**: not-required (read-only; no §3.1 file touched)
**Smoke visivo**: passato — `npm run smoke` GREEN, 12 passed, 0 failed, 3 skipped, dev server of this tree on 3131; no UI change in this lane
**Notes**: Blocker found: staging writes format 2.230, the trunk has no adapter, so a trunk-only 3.1 cannot open beta saves; L1 must absorb origin/staging. The drag loop no longer reproduces: 0 of 72 drags on the start sha, while the same probe crashes 164f846fc 3/3 and 361a11224 2/3. Codegen gate green, toggle visible. Dark theme already removed. Status line not flipped (NON FARE). Report §0, §8.
**Prompt document name**: 2026-10-11 18:12

## 2026-10-11 — ticket: a trunk build cannot open a project saved on beta (format 2.230)
**Ticket**: `origin/staging` adds VersionFixer step `2.229 -> 2.230` (#174, `352758aa2`), deployed on beta since 2026-10-10 09:47Z; the trunk stops at 2.229, and `VersionFixer.update` throws «missing version adapter» on a 2.230 save, so the open ends `unreadable`. Beta and app share one persistence backend, so production (2.229) is in the same position today (inferred). Open PR #184 rewrites the chain on staging (2.229 -> 2.2291 .. -> 2.230). Read, not run in a browser.
**Priority**: high
**Found in**: P-2026-10-11-1812
**Detail**: docs/discovery/discovery_2026-10-11_release_3_1_scope.md (§3.5)

# Log inbox — release 3.1, L5 fixture

Entries for the release 3.1 lane L5 (front `release-3-2`, P-2026-10-12-0116), kept out of the active
`docs/claude-code-log.md` while parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-12 — test: a 3.0.0 save pinned through the VersionFixer chain (P-2026-10-12-0116)
**Prompt**: `claude_2026-10-12_0116_prompt_release_3_1_fixture.md`, release 3.1 L5: a project exported by a 3.0.0 build (format 2.228) as a fixture; a VersionFixer test from 2.228 to the highest version (primitives after EDouble, the migrated default view kept, counts unchanged) and a chain without the 2.229 → 2.230 step throwing on a 2.230 save; one mutation of the 2.228 → 2.229 step shown; the fixture opened on 3146.
**Files touched**: code `adfb2241b`: `frontend/src/redux/__tests__/versionfixer_3_0_0_save.test.ts` (new), `frontend/src/redux/__tests__/fixtures/save_3_0_0.jjodel` (new). Report `7e3407f0b`: `docs/discovery/discovery_2026-10-12_rel31_fixture.md`. This entry: `docs/log-inbox/release-3-1-fixture.md` (new).
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. Gates: typecheck 14, the §17 set; vitest 9036/9036 tests, the 9 known import reds; build exit 0; check:scripts PASS 89 files; check:docs PASS. New test 10/10; mutation bench 8/8 killed, three of them on the 2.228 → 2.229 step.
**Out-of-scope changes**: no. The four paths the prompt names, over three commits. The bench mutated `VersionFixer.tsx` transiently and restored it (`git diff HEAD` empty); the `_tmp_` probes are gitignored.
**Layer Impact Report**: not-required (`VersionFixer.tsx` read and exercised by the test, never changed in a commit)
**Smoke visivo**: passato — lane probe on 3146, 9/9: Import Project, open, `loadError` null, store 2.23 via [2.228, 2.229], model_1 drawn with 2 nodes and the `home` edge; crop `~/.jjodel-lanes/P-2026-10-12-0116/fixture_3_0_0_on_3146.png`
**Notes**: Partial on one clause only: a 3.0.0 save stores no DViewElement (this fixture and the six 2.229 probe saves), so there is no migrated default view to keep and `isMigratedDefaultView` has nothing to answer for. The test pins no view stored or written and the tail visiting the default viewpoint alone. A save with a kept view needs a pre-2.226 project saved by 3.0.0 (D1). Report: docs/discovery/discovery_2026-10-12_rel31_fixture.md.
**Prompt document name**: 2026-10-12 01:16

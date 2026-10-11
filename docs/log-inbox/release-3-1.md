# Log inbox — release 3.1

Entries for the release 3.1 lanes (front `release-3-2`), kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

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

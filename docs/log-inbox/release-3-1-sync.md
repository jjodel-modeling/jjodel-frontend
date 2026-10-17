# Log inbox — release 3.1, sync with origin trunk and staging

Entries for the release 3.1 sync lane (front `release-3-2`, P-2026-10-16-1000), kept out of the active
`docs/claude-code-log.md` while parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-16 — merge: origin trunk, da1-disc and staging into rel31-sync, D-A1 fixed (P-2026-10-16-1000)
**Prompt**: `claude_2026-10-16_1000_prompt_rel31_sync.md`, full lane (critical zone, RC-30): LIR, `--no-ff` merges of origin/alfonso-frontend-jjtl `38f0add16`, da1-disc `e45998ecd`, origin/staging `e8fd99c58`; the D-A1 fixture line and demo re-export; Check E; gates; load probes; RC-23 crops.
**Files touched**: LIR `bd0dfe614`; merges `38c60c0e1`, `7900e46e6`, `f8da990c7` (resolved `Jodie.tsx`, `reservedIdentifierGate.test.ts`, `defaultPrompts.ts`, `docs/decisions.md`, `docs/log-inbox/harness.md`); fix `0c5a0de42` `frontend/scripts/probe/bpmn-lanes-fixture.ts`; `eccd63cb0` and `f8594bfc4` (two prompt headers); this commit: the report and this inbox.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 0, 0 errors; vitest 9130/9134, 10 red files = 9 import reds + criticalZone env leak (70/70 unset); build exit 0; smoke GREEN 12/12 (run 2, run 1 cold timeout); check:docs 5/5; check:codegen-lazy ALL GREEN; check:agents PASS; versionfixer_3_0_0_save 10/10; load probe 23/23 (2.228, 2.229, 2.230).
**Out-of-scope changes**: yes — `f8594bfc4`, `Front: harness` on the P-2026-10-15-1725 ACK, a second Check E red the prompt did not name; one line, its own commit.
**Layer Impact Report**: produced
**Smoke visivo**: passato — npm run smoke GREEN on 3161; 22 RC-23 crops in `~/.jjodel-lanes/P-2026-10-16-1000/crops/`, described, not judged; Alfonso's visual GO pending (critical zone)
**Notes**: CLAUDE.md/AGENTS.md arrive with staging (RC-48, baseline 0), unedited. check:addonly flags `38c60c0e1`: 324 entries, all verbatim in the archive (origin fold + rotation). Findings: JjScript-nested children drawn outside a free graphVertex container until Auto layout; «Pool with lanes» has D-A1's flaw (measured); Petri p1 static dots vs Marking. Status not flipped. Report: `docs/discovery/discovery_2026-10-16_rel31_sync.md`.
**Prompt document name**: 2026-10-16 10:00

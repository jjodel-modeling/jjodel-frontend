# Log inbox — release 3.1, D-A1

Entries for the D-A1 lane (front `release-3-2`), kept out of the active `docs/claude-code-log.md` while parallel lanes
are running (P9). To be merged into the active log by whoever rotates it.

---

## 2026-10-15 — discovery: D-A1, «Add» under a graphVertex container (P-2026-10-15-1710)
**Prompt**: `claude_2026-10-15_1710_prompt_da1_graphvertex_add_discovery.md`, Phase 1 read-only: replay «Add LaneSet (childLaneSet)» on lane Sales of `gv-bpmn.jjodel`, say rendering or structure (CSS?), regression or pre-existing (07bfa0673 vs d7b24c83b), mechanism and smallest fix.
**Files touched**: report `71c07b6fd`: `docs/discovery/discovery_2026-10-15_da1_graphvertex_add.md`. This commit: `docs/log-inbox/release-3-1-da1.md` (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no source touched; probes only, on archive copies and this tree's dev server (3151).
**Out-of-scope changes**: no — the report and this inbox, both named by the prompt. Declared in the report: three extra archive copies (6e22f4a9b, 38e7a6006, b7d131729) on ports 3154-3156 to date the defect.
**Layer Impact Report**: not-required (read-only; no §3.1 file touched)
**Smoke visivo**: non applicabile — no UI change; 37 probe crops in `~/.jjodel-lanes/P-2026-10-15-1710/crops/`
**Notes**: Not CSS, not 2.230: the empty LaneSet makes the demo view «Lane with sub-lanes» (`exists $childLaneSet.value`) win, so Sales claims nothing and its 3 flow nodes go unclaimed. Same on HEAD, 07bfa0673 and d7b24c83b; born 2026-10-10 (6e22f4a9b). Fix: predicate at `bpmn-lanes-fixture.ts:80`, measured in browser. Not a 3.1 blocker. Report §0.
**Prompt document name**: 2026-10-15 17:10

**Ticket** (pre-existing, not touched): `npm run check:docs` Check E is red on the base `d2c42dcb1`: `docs/prompts/claude_2026-10-13_1930_prompt_token_economy_harness.md` (P-2026-10-13-1930, added by `7ad24c38e`) has no `Front:` line. Checks A-D pass with this entry; the inbox gets only the expected fold warning.

# Log inbox — merge gate (P-2026-09-19-1622)

Entries for the merge-gate lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

## 2026-09-19 — docs: ratify R-IRN-35, R-IRN-36 and RC-14 from the merge gate (P-2026-09-19-1735)
**Prompt**: `claude_2026-09-19_1735_prompt_ratify_merge_gate_decisions.md`. Write into the normative documents the three decisions of 2026-09-19 on questions 1, 2 and 4 of section 10 of the gate report: R-IRN-35 and R-IRN-36 after R-IRN-34, RC-14 after RC-13 in `docs/decisions.md`, and the paragraph "Reintegration of a branch" at the end of P14 with the header bump 1.3 to 1.4. Measured the effect on the merge before writing, hard stop on the count, GO on option 1 (commit as written, trunk side at the merge).
**Files touched**: `ca23ae72a`, 2 files: `docs/decisions.md` (+34), `docs/PROTOCOL.md` (+20, -1). This entry in its own commit. The prompt file was already tracked on the trunk (`9c173dfce`). No file under `frontend/`, no change to `CLAUDE.md` or `docs/handoff/decisions-symbol-editor-1b.md`.
**Outcome**: ✅ completed — two commits, no push. `git merge-file -p <trunk> <merge-base 4275c5850> <validation-skeleton>`, conflict markers on complete output:

| File | Before | After |
|---|---|---|
| `docs/decisions.md` | 1 | 1 (the pre-existing hunk at the end of the file, merged line 3304 to 3338) |
| `docs/PROTOCOL.md` | 0 | 2 |

The two new `PROTOCOL.md` hunks are expected at the merge and resolve trunk side: the version line (1.4 against 1.3) and the reintegration paragraph inside P14. The prompt's "your edit must not add a hunk" could not hold: the base has no P12 to P15, both sides added that block identically, so any edit inside it conflicts wherever it sits. Line 91 differs on the branch only and merges clean. The gate report's premise that P14 sits outside the conflict hunks was true only until this edit. `npm run check:docs` through the P14 symlink: 3/3 pass (the trunk has no Check D), symlink removed, `git status --short` empty before and after.
**Deviation from the prompt**: RC-13-bis is in `docs/PROTOCOL.md:118`, not in `docs/decisions.md`; RC-14 went after RC-13, the last Processo entry. Each of the three `decisions.md` entries closes with a sentence naming the section-10 question that ratified it, kept by decision.
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only; `check:docs` 3/3.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: The three new decisions.md entries are in English inside a register that is Italian; to be brought in line in a docs lane after the merge. The merge lane (P-2026-09-19-1740) must name the two PROTOCOL.md hunks and resolve them per hunk, trunk side, not by taking the whole file.
**Prompt document name**: 2026-09-19 17:35

## 2026-09-19 — docs: gate report for validation-skeleton into the trunk, Phase 1 (P-2026-09-19-1622)
**Prompt**: `claude_2026-09-19_1622_prompt_merge_gate_validation_skeleton.md`, Phase 1, read-only, hard stop on the report. Re-measure every figure the chat gave, classify the 41 duplicates and the 220 non-duplicates, map the conflicts to lanes, answer the edge-view question, and frame the merge mechanism as options with numbers, without choosing.
**Files touched**: `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (new), `docs/log-inbox/merge-gate.md` (new). The prompt file was already tracked on the trunk (`2da08a722`). No file under `frontend/`, no change to `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`.
**Outcome**: ✅ completed — Phase 1 only. Nothing merged, picked, checked out, stashed or pushed; Phase 2 not started.
**Corregge**: —
**Causa**: —
**Regressions**: no — docs only, nothing built or run.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Prompt figures were stale: the trunk merged origin/staging at 16:29, conflicts 7 to 10. Blocking finding: ShapeSpec.cornerRadius declared twice (R-IRN-31 vs D5), plus border. Session opened in ~/jjodel, where the prompt file is absent; worked in ~/jjodel-release as the prompt says. No build: no node_modules there (P14).
**Prompt document name**: 2026-09-19 16:22

# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-18 — chore: CLAUDE.md split, Phase 0 measurements (P-2026-09-18-1930)
**Prompt**: GO for Phase 0 only of the CLAUDE.md split — measure whether the 40k-char limit
truncates or only reports, and whether a nested CLAUDE.md under `editor-v2/` actually loads for
work under that directory. Hard stop after reporting; Phases 1-3 not started.
**Files touched**: `frontend/src/components/editor-v2/CLAUDE.md` (new probe), `frontend/src/components/editor-v2/AGENTS.md` (generated sibling)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: M1 inconclusive via debug log (no truncation string in 4 `--debug` runs,
positive-controlled); settled directly — this session's own CLAUDE.md matches disk byte-for-byte,
untruncated. M2 conclusive: token auto-injected (no explicit Read) for editor-v2 work, absent
elsewhere. Full account: `docs/discovery/discovery_2026-09-18_claude_md_split_phase0_nested_load.md`.
**Prompt document name**: 2026-09-18 19:30

---


## 2026-09-19 — docs: the trunk's CLAUDE.md split brought into the branch (P-2026-09-18-2110, step 4)
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, step 4, after point 0 on the trunk
(`aae7401c1`: PROTOCOL.md 1.2 -> 1.3, one line in P10 for `docs/CODEBASE-MAP.md`). Files read with `git show`
from that fixed sha, then `gen:agents` run on the branch.
**Files touched**: commit `9b3d74857`, 20 files: `CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`,
`docs/CODEBASE-MAP.md`, and for the eight modules (`editor-v2`, `model`, `redux`, `styles`, `jjel`,
`jjscript`, `jjtl`, `services/export`) their `CLAUDE.md` and `AGENTS.md`.
**Outcome**: ⚠️ partial — the carry is exact: md5 of all 19 files other than PROTOCOL.md identical to the trunk
at `aae7401c1`; PROTOCOL.md differs by one sentence, the P9 rotation sentence citing `npm run log:rotate`,
re-added verbatim (it describes a script that exists here and not on the trunk). `check:agents` exit 0.
`check:docs` exit 1, and it was exit 1 before any change: Check D, 41 active entries against the threshold of
40; A, B and C pass. Not fixed here: rotation is an exclusive lane (RC-12).
**Corregge**: —
**Causa**: (g) — the red gate is the active-log threshold, not the split.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: declared delta: the P9 rotation sentence exists on the branch only, and does not take a version number. Open: two `docs/discovery/` files cited by root §5 exist on the trunk only; `docs/decisions.md` RC-13 cites P13 on the trunk only.
**Prompt document name**: 2026-09-18 21:10

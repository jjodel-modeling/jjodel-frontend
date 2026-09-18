# Log inbox — CLAUDE.md split (P-2026-09-18-1930 / P-2026-09-18-2110)

Entries for the CLAUDE.md-split lane, kept out of the active `docs/claude-code-log.md` while
parallel lanes are running (P9). To be merged into the active log by whoever rotates it.

## 2026-09-18 — docs: split critical-zone D-L/M1-M2 rules into nested CLAUDE.md modules
**Prompt**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` Phase 1 — move §3
(sync layer / D-L proxy critical zone) out of root CLAUDE.md into three nested, directory-scoped
CLAUDE.md modules (`frontend/src/redux/`, `frontend/src/model/`, `frontend/src/components/editor-v2/`),
verbatim, leaving one-line pointers in root §3. Run on the trunk (`alfonso-frontend-jjtl`,
`/Users/alfonso/jjodel-release`) per §6.6/P15.
**Files touched**: `AGENTS.md`, `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/redux/CLAUDE.md` +
`AGENTS.md`, `frontend/src/model/CLAUDE.md` + `AGENTS.md`, `frontend/src/components/editor-v2/CLAUDE.md`
+ `AGENTS.md`. Commit `4355a148c`.
**Outcome**: ✅ completed — root CLAUDE.md 63444 -> 50910 bytes. All three gates green
(`gen:agents`, `check:agents`, `check:docs`).
**Corregge**: —
**Causa**: —
**Regressions**: no.
**Out-of-scope changes**: yes — `frontend/src/redux/CLAUDE.md` carries one paragraph noting a
DV.tsx-runtime gap that is new prose, not a verbatim move of §3.9. Flagged to Alfonso in the
Step 4 hard-stop report, not yet ratified.
**Layer Impact Report**: not-required — docs-only, no D-L/sync code touched.
**Smoke visivo**: non applicabile.
**Notes**: see also Step 1 (`32dbe1ef8`, probe removal + §9.3 transport) and the individual
normative commits under this Phase (`686a13712`, `74d0f81db`, `43e598404`, `7bc6c7365`,
`00b32f5e7`, `8f6122427`, `cccabe385`, `4db186124`) already present on trunk before Phase 1 proper.
**Prompt document name**: 2026-09-18 19:30

## 2026-09-18 — docs: CLAUDE.md split Phase 2 — §5 compression, §6.4-6.6 to PROTOCOL.md
**Prompt**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` Phase 2 — compress
the 4 named §5 worked examples (ugrep 2026-08-11, typecheck window 2026-08-13, tree glyph
2026-08-12, symbolRecognition mutation bench 2026-09-16) to one sentence + pointer each, creating
the two missing discovery docs; move §6.4/6.5/6.6 verbatim to `docs/PROTOCOL.md` as P13/P14/P15,
leaving pointers in §6; update RC-13 in `docs/decisions.md` to cite P13.
**Files touched**: `AGENTS.md`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`,
`docs/discovery/discovery_2026-08-11_ugrep_wrapper_ignore_files.md` (new),
`docs/discovery/discovery_2026-09-16_symbolrecognition_scalarof_mutation_bench.md` (new).
Commit `da07e3169`.
**Outcome**: ✅ completed — root CLAUDE.md 50910 -> 44726 bytes. All three gates green; Check A
(§21.2/P9 byte-identity) re-confirmed passing after the edit.
**Corregge**: —
**Causa**: —
**Regressions**: no.
**Out-of-scope changes**: yes, minor — the `docs/PROTOCOL.md` header line ("clausole P1..P12
applicabili") was left unupdated after adding P13-P15; a stale self-count, not corrected in this
lane (not named in Phase 2's instructions). Flagged to Alfonso in the Step 4 hard-stop report.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: other lane's concurrent WIP in `frontend/src/components/editor-v2/viewpoint/ir/*` and
two new IR-related discovery/probe files was present in the shared tree throughout; left
untouched per §6.4/P13 (RC-13).
**Prompt document name**: 2026-09-18 19:30

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

## 2026-09-19 — docs: CLAUDE.md split Phase 3 — design system + language sections to nested modules
**Prompt**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md` Phase 3 — move §7
(Design system), §11 (JjEL), §13 (JjScript), §14 (Ecore/XMI I/O) verbatim to new nested,
directory-scoped CLAUDE.md files; merge root §12's non-table content (Full reference, Roadmap)
into the pre-existing `frontend/src/jjtl/CLAUDE.md`, keeping §12.6 (cross-language symbol table)
in root since it governs JjEL and JjScript too. Rules 26-28 stay in the non-negotiable block as
the one-line design-system versions. Run on the trunk per §6.6/P15.
**Files touched**: `AGENTS.md`, `CLAUDE.md`, `frontend/src/jjel/CLAUDE.md` + `AGENTS.md` (new),
`frontend/src/jjscript/CLAUDE.md` + `AGENTS.md` (new), `frontend/src/services/export/CLAUDE.md` +
`AGENTS.md` (new), `frontend/src/styles/CLAUDE.md` + `AGENTS.md` (new), `frontend/src/jjtl/CLAUDE.md`
+ `AGENTS.md` (merged in). Commit `62d139fa1`.
**Outcome**: ⚠️ partial — every named block moved verbatim, all three gates green (`gen:agents`,
`check:agents`, `check:docs`), `## 0.` heading intact. Root CLAUDE.md 44726 -> 41386 bytes:
under the Phase 1/2 combined reduction trend but still above the prompt's stated "<40000,
expected around 21000-25000" target. No further sections were moved to close the gap — none of
§9, §16-21, the non-negotiable block, §2.5, §4, §6, §15 were named in Phase 3's scope, and closing
the gap further would mean moving un-named sections, which Rule 1 does not authorize on this
lane's own initiative.
**Corregge**: —
**Causa**: (a) — the prompt states the byte target as "expected around", not as one of its own
four enumerated acceptance items (verbatim moves, gates green, `## 0.` heading, phase 0 measurement
shown); the phase satisfies all four but undershoots the numeric expectation. Flagged for Alfonso
in the Step 4 hard-stop report rather than resolved unilaterally.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: other lane's concurrent WIP in `frontend/src/components/editor-v2/viewpoint/ir/*` and
three IR-related discovery/probe files (one new since Phase 2) present in the shared tree
throughout; left untouched per §6.4/P13 (RC-13).
**Prompt document name**: 2026-09-18 19:30

## 2026-09-19 — docs: verbatim audit of the CLAUDE.md split (Phases 1-3) and check of §5
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, handover turn: (1) read-only
verbatim audit of the moved blocks against `084d99b3b`, (2) complete Phase 2 §5. Lane taken over
from the session that ran steps 1-3 and whose closing report never arrived.
**Files touched**: `docs/discovery/discovery_2026-09-19_claude_md_split_audit_verbatim.md` and two
probes under `docs/discovery/harness/`. Commit `c8cdc8efe`. No normative file touched.
**Outcome**: ⚠️ partial — audit done: 850 of 856 baseline lines verbatim, the other 6 accounted
for; three non-move findings (jjtl module reflow, §12.7 deleted while the note says moved, clause
range P1..P12 stale against P1..P15). §5: no edit, the four examples were already compressed by
`da07e3169` (-308 chars) with the accounts present in the cited files. Root is 40,551 chars: 551
over the limit, and §5 has no further worked example to move without cutting a rule.
**Corregge**: —
**Causa**: (a) — the numeric target cannot be reached inside the scope the prompt names. Second: the
handover premise "§5 compression not done" was wrong, because the previous report did not arrive.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: the three gates were not run, no gated file was touched. Step 4 stays suspended. Trunk
worktree carries another lane's WIP in `viewpoint/ir/*`, left untouched (RC-13). Entry is not
part of the audit commit (docs and record travel apart).
**Prompt document name**: 2026-09-18 21:10

## 2026-09-19 — docs: split audit findings closed, gates measured in the trunk worktree, §18/§19 moved
**Prompt**: `claude_2026-09-18_2110_prompt_claude_md_split_sul_tronco.md`, second handover turn:
(1) gates in the trunk worktree, (2) findings A and B in `jjtl/CLAUDE.md`, (3) clause range,
(4) close the 551-character gap by moving §18 and §19. Step 4 (bring the split back into the branch) not run.
**Files touched**: commits `34ddaf0c7` (audit report §7), `19112458f` (`frontend/src/jjtl/CLAUDE.md` + `AGENTS.md`),
`717b29a64` (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`), `068d59367` (`CLAUDE.md`, `AGENTS.md`, new `docs/CODEBASE-MAP.md`).
**Outcome**: ✅ completed — root `CLAUDE.md` 40551 -> 37756 characters (2244 of headroom). Gates
`gen:agents`, `check:agents`, `check:docs` all exit 0 after each commit, run in the trunk worktree.
A restored verbatim (9 lines added, 0 removed against the baseline); B resolved by correcting the
note; range now P1..P15.
**Corregge**: `claude_2026-09-18_1930_prompt_claude_md_split_oltre_limite.md`
**Causa**: (a) — the 21-25k estimate of that prompt is falsified and stands declared as such; the
acceptance is "under 40,000 with headroom", not the estimate.
**Regressions**: no.
**Out-of-scope changes**: no.
**Layer Impact Report**: not-required — docs-only.
**Smoke visivo**: non applicabile.
**Notes**: second cause (c): Phase 3 merged two pre-existing jjtl lines and wrote "moved verbatim" over a deletion. Gates import only `node:` built-ins, so they need no `node_modules`; the symlink in the release tree is another lane's under a live vite, hence no `npm ci`. Supersedes the "gates not run" note of the entry above.
**Prompt document name**: 2026-09-18 21:10

## 2026-09-19 — ticket: check:docs should assert the clause range against PROTOCOL.md
**Ticket** (opened, not implemented here). `frontend/scripts/gates/check-docs.ts` should add a check D:
the highest `## P<n>` heading of `docs/PROTOCOL.md` equals the `<n>` cited as `P1..P<n>` in the three
places that state the range: `CLAUDE.md` (the pointer under the non-negotiable block and the one in §1)
and the `Protocollo:` line of `docs/PROTOCOL.md`.
**Why**: the range was wrong twice in one day. It said P1..P11 while P12 existed (corrected 2026-09-18),
then P1..P12 while Phase 2 had added P13 to P15 (corrected 2026-09-19, `717b29a64`). Both were found by reading,
not by a gate.
**Notes for whoever picks it up**: three citation sites today (`CLAUDE.md:14`, `CLAUDE.md:108`,
`docs/PROTOCOL.md:11`); the check must fail on a mismatch in either direction. It touches a gate script and
`CLAUDE.md` §17, so it is a lane of its own.

## 2026-09-19 — ticket extension: the clause-range check also covers docs/HARNESS-DOCS.md
**Extends** the ticket "check:docs should assert the clause range against PROTOCOL.md" above (add-only: the
original text stands). The check D proposed there compares the highest `## P<n>` of `docs/PROTOCOL.md` with the
range cited in three places. `docs/HARNESS-DOCS.md` cites the range too, and all three of its citations are stale:
`P1..P10` at lines 122, 344 and 358, against P1..P15 in force. The gate should cover it, which makes six citation
sites instead of three.
**Not done here**: no edit to `docs/HARNESS-DOCS.md` (its own rule asks for a version bump, and it already
differs between the trunk and `validation-skeleton`). Line 122 is inside an example prompt header and may be
meant as a historical example: whoever implements the gate decides whether it is in scope.

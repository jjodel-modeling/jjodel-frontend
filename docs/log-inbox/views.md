# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-21 — merge: elk-handles-a3 onto the 2026-10-21 trunk, A3 re-measured (P-2026-10-21-1925)
**Prompt**: `claude_2026-10-21_1925_prompt_a3_refresh_on_trunk.md`, full lane on `~/jjodel-w-a3trunk` (branch `a3-on-trunk`): merge `elk-handles-a3` (A3, R-VP-60, ratified by Alfonso 2026-10-21) into a trunk copy, gates, the A3 probes on tip and trunk, crops for the visual GO. No push, no merge into the trunk.
**Files touched**: merge `7ae59d306`: the 11 files of the branch (`irEdgeViews.ts`, `handlePosition.ts`, `DynamicHandles.tsx`, `irElkPorts.test.ts`, `irLabelAnchors.test.ts`, `petri-ink-ports.ts`, `elk-handles-loop.ts`, its LIR, prompt, `docs/decisions.md`, `docs/log-inbox/views.md`); `2c2a20895` the LIR addendum §3; this commit: `docs/decisions.md` (R-VP-60 ratified), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 0; vitest 77 files, 1673 tests green on the three code files' tests; build built; smoke GREEN 12/0/3. Probes trunk -> tip: petri-ink-ports 63/73 -> 73/73; handles over 1 px off along the side 33/68 -> 2/68, other side 5 -> 0, extra bends 0, default panes 4/4; petri-drag-loop 0 crashes both sides; elk-handles-loop 33/33 both sides.
**Out-of-scope changes**: no — one conflict (the views inbox, union); the other files as the branch measured them. Rule 19: 11 files, all the branch's, in the prompt's scope.
**Layer Impact Report**: produced (LIR of P-2026-10-10-0915, addendum §3)
**Smoke visivo**: passato — chat, on crops `~/.jjodel-lanes/P-2026-10-21-1925/crops/sbs_*_trunk_vs_tip.png` (Petri classic, Statechart DemoESM, Activity UML and Flowchart DemoFlowB): routes identical to the trunk, handles on the drawn ends, no stray bends; Petri classic `lock` label below the place as in the 0915 crop, accepted; DemoFlowB's loop-back into d1 the same on both sides
**Notes**: The Petri classic loop ticket of P-2026-10-10-0915 closes on this trunk: 0 crashes with and without A3 (Fix A, a69fef5d9). The merge commit has no Model trailer (hook exemption; amend refused by the pathspec rule). Numbers in the LIR addendum.
**Prompt document name**: 2026-10-21 19:25

## 2026-10-10 — revert(editor-v2): A3 back, handles of an ELK-routed edge on its drawn ends (P-2026-10-10-0915)
**Prompt**: `claude_2026-10-10_0915_prompt_elk_handles_a3.md`, full lane, heavy, RC-30 go-ahead, on `~/jjodel-w-elkhandles` (branch `elk-handles-a3`): `git revert 04c13e039` to restore A3 of P-2026-10-03-1920 (R-VP-60) as measured, A1 and A2 kept; prove the «Maximum update depth» loop of 2026-10-01 does not come back; DemoESM with the run's events hidden; hard stop, no merge.
**Files touched**: `10f92eea9` `docs/lir/lir_2026-10-10_elk_handles_a3.md`; `dd21d2e45` `irEdgeViews.ts`, `handlePosition.ts`, `DynamicHandles.tsx`, `irElkPorts.test.ts`, `irLabelAnchors.test.ts`; `a57bd4d53` `frontend/scripts/probe/petri-ink-ports.ts`, `frontend/scripts/probe/elk-handles-loop.ts` (new); this commit: `docs/decisions.md` (one R-VP-60 line), the LIR's test count, this entry and a ticket, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no — A3 adds none: the Petri classic loop below is on the trunk's code too. Typecheck 14, the §17 set by file and code; vitest 7676 passed, red only the §17 nine at import, `criticalZone.test.ts` green with the go-ahead variable unset; `irElkPorts` and `irLabelAnchors` 17/17; build exit 0; check:scripts PASS.
**Out-of-scope changes**: yes — `petri-ink-ports.ts` beyond the A3 assertions: themes default to light (D-UI-15) and the compare reads the themes measured. Eleven files over four commits, above five (rule 19), each in the prompt's DOVE.
**Layer Impact Report**: produced
**Smoke visivo**: passato — lane probe on 3080 and 3081, unattended, light, 1600×1000: petri-ink-ports 73/73 (trunk 63/73, the A3 checks red as control); ends off their handle after Auto layout 33 of 68 → 2, other side 5 → 0, extra bends 0; default panes identical 4/4; crops `~/.jjodel-lanes/P-2026-10-10-0915/crops/sbs_*`; Alfonso's GO due (critical zone)
**Notes**: Partial on the loop check: Petri net (classic) crashes on 5/5 fresh pages with and without A3 (ticket). Flowchart, Activity, Statechart: 60 drags and 20 edge selections each, 0 crashes, depth ≤ 3; DynamicHandles renders per drag 12.4, 7.9, 12.9 against the trunk's 12.2, 14.3, 12.7. DemoESM panel lines equal to the trunk's; pins unmoved by the run. Logs and JSON in the lane folder.
**Prompt document name**: 2026-10-10 09:15

## 2026-10-10 — ticket: a Petri net (classic) derived viewpoint loops on a node drag («Maximum update depth»)
**Ticket**: Trunk code `c14082de9` (A3 absent), DemoPetri derived as Petri net (classic): dragging a node ends in «Maximum update depth exceeded» in `<StoreUpdater>`, the CanvasErrorBoundary fallback, React's nested count 51. Measured with `frontend/scripts/probe/elk-handles-loop.ts`: 5 of 5 fresh pages after Auto layout (after 1 to 10 drags), 3 of 3 with `EHL_NOPATCH=1` (no instrumentation), 3 of 3 at rest (`EHL_NOLAYOUT=1`, the first drag). Same on the branch with A3. Flowchart, Activity (UML) and Statechart (PEST): 0 in 60 drags each. Of the four, only the classic Petri viewpoint has outside labels: A2's `irLabelAnchors` (R-VP-59) is a candidate, read and not measured. P-2026-10-01-1655's ticket on the unconfirmed trigger stands.
**Priority**: high
**Found in**: P-2026-10-10-0915

# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

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

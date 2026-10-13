# log-inbox — lane «data-manager-ux» (#158)

Entries written by the #158 Data Manager UX lane while sessions share this tree (P9, parallel
lanes). Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this
order** (RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-13 — fix(#172): a reference row shows Open once
**Prompt**: `claude_2026-10-13_1300_prompt_172_open_once.md`, fast lane, director Juri (chat `C-2026-10-13-1256`): #172 reopened by @tmaog on 2026-10-13, on a row of a reference section «Open» is on screen twice, as the glyph of the card and as the first item of the row's menu. The second of his two proposals, R-REF-7: the card draws the glyph only on a row that has no menu.
**Files touched**: `6036179cf`: `docs/decisions.md` (the row R-REF-7). `4288e509c`: `frontend/src/components/abstract/tabs/InstanceDetail.tsx` (`RefSlotsSection`, the line of the card's glyph and its comment, +3 −1). Docs: this inbox, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 15:45
**Causa**: (d)
**Regressions**: no — measured: the probe of the corrected lane, `_tmp_172_probe.ts` `MODE=after STEP=3`, 92/92 and no page error, its 271 output lines and its gesture table identical to the run of 2026-10-12 once the pointer ids are masked (both hosts, subject and inline child, a profile, an authored view); `scripts/smoke/run.ts` 12 passed, 0 failed, 3 skipped; typecheck exit 0, no `error TS`; vitest 9037 passed in 361 files, the nine known files red at import and nothing else; build exit 0; check:docs 5/5, check:addonly and check:scripts green. Not measured: the criterion on the stand-alone page under a profile (a row the profile locks has no menu and keeps the glyph by the same expression: read, not run).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — Juri's visual GO of 2026-10-13 in chat `C-2026-10-13-1256`, given after he looked at this tree's dev server (port 3172) himself. Before it the chat's independent probe (`172b_independent.mts`, its own assertions, real gestures, fixture MM172), as the GO reports it: BEFORE on staging `7e774497c` 9/9, glyph + menu button = 2 on the 7 rows that have a menu and 1 on the read-only row, Data Manager and Configurator; AFTER on `4288e509c` 12/12, 1 on all 8 rows of the subject, on the 2 of the inline child and on the 8 of the Configurator, no icon at all in a card whose row has a menu, the read-only row keeps one painted arrow, a click and Enter on the card and the menu's Open still open the target, card 25 px tall and name at +9 before and after, no page error. The lane's own probe, `_tmp_172b_probe.ts` on this tree's dev server (port 3172), fixture MM172, read from the DOM. BEFORE on `7e774497c`, 13/13: glyphs in the card + menu buttons = 2 on every row that has a menu (Data Manager, 7 of the 8 rows of the subject and the 2 of the inline child `Phase_0`; Configurator, 9 of 10), 1 on the read-only row `frozen`. AFTER on `4288e509c`, 21/21: 1 on every row (8, 2 and 10 rows), 0 glyphs on the rows of `goal`, `teacher`, `learners`, `rooms`; `frozen` keeps its glyph and has no menu button; a click on the card of `goal` opens `G1` and Back returns; its menu lists «Open» first and the item opens `G1`; the card of `goal` is 25 px tall and its name starts at x=798 before and after, so no style rule; one console error (`init_dash`, at the fixture) in both runs, no page error.
**Notes**: Decision R-REF-7 (provisional, RC-25). No unit test and no source-text test: the section does not import under node (declared by P-2026-10-10-1545); the probe is the measure (P11). The doubling passed the corrected lane because none of its 92 probe arms reads the card's glyph (second cause: (a), R-REF-3 did not say what becomes of the glyph once Open is in the menu). Probe logs and the BEFORE table: `~/.jjodel-lanes/P-2026-10-13-1300/`.
**Prompt document name**: 2026-10-13 13:00


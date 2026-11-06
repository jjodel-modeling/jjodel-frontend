# log-inbox — lane «jjodie-ui-s2»

Entries written by the Jjodie S2 lane (front jjodie-ui, branch `jjp-s2`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: jjodie S2, collapsed script card with planned effects
**Prompt**: P-2026-10-24-0310, slice S2 under R-JJD-2: a JjScript block in a Jjodie reply as a collapsed card (status, name and line count, planner chips, amber warning line, Fix warnings, Edit script and Open as file disabled), driving the ghost preview through SCRIPT_PREVIEW_REQUEST, Show script disclosure, Run gone for card blocks; probe and crops.
**Files touched**: frontend/src/components/Jodie/ScriptCard.tsx, ScriptCard.scss, scriptCardModel.ts, __tests__/scriptCardModel.test.ts, ChatMessages.tsx, frontend/src/components/common/MarkdownRenderer.tsx, frontend/scripts/probe/jjodie-s2-script-card.ts (4f32c8433); docs/log-inbox/jjodie-ui-s2.md, docs/prompts/claude_2026-10-24_0310_prompt_jjodie_s2_script_card.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Out of scope: scriptCardModel.ts and its test (pure module for the bench). 7 files, rule 19 adopted unattended. Probe on 3015: 26/26, after one fix it found (nowrap text widened the reply past the panel; `contain: inline-size` on the card's one-line texts). Not exercised: Apply (the `applied` status) and a Fix warnings send (calls the LLM). Gates: typecheck 0; vitest 11839 pass + the 9 known import failures; build ok.
**Prompt document name**: 2026-10-24 03:10

**Ticket** (unattended decisions, `ratified as recommended, unattended`, RC-21/RC-25, for the digest): (1) a block becomes a card only in a reply scoped to an M1 model (`jjodieScope.level === 'M1'` with a `modelId`): the planner is M1-only, so M2 and unscoped replies, and every other Markdown host, keep the open block and Run; (2) Fix warnings reuses the chat's one-shot `askJjodie` (`onAskFromError`, no mode change), whose request does not appear as a user bubble; it sends the warnings and the script; (3) the newest card is the last reply with an M1 scope and a card block; its automatic preview fires once per session per (message, model, script), and a reply with two cards previews the last; (4) reference chips count `=` and `+=` with a target, per feature; removals, clears, renames and deletes have no chip; (5) while the card's script is the canvas preview its chips read that preview's plan, otherwise the card's own plan, made once on mount; (6) Fix warnings is disabled with no warnings (`No warnings to fix`); (7) the card's upper area is one button that previews, for any card; (8) a card-only reply drops the bubble box, as a code-only reply does (rule in ScriptCard.scss). Measures: card 351 px inside bubble 1161-1538 in window 1140-1600; warning text 308 of 554 px, ellipsis, rgb(180, 83, 9), icon rgb(245, 158, 11); chips `+2 State`, `+1 Initial` = planner; bar `+3 objects`, `1 warning`, 3 ghost nodes; one preview request. Crops: `~/.jjodel-lanes/P-2026-10-24-0310/s2-card.png`, `s2-canvas-preview.png`, `s2-card-open.png`.

## 2026-10-24 — ticket: preview bar Discard fails Playwright's actionability wait
**Ticket**: In the S2 probe a Playwright click on the preview bar's Discard times out at «waiting for element to be visible, enabled and stable», though the bar's rect is unchanged over six samples 120 ms apart and the card sent one request; a DOM `click()` clears the preview. Not measured why (overlap or hit-test at top 98 px of the pane). Owed to the S4b probe lane.
**Priority**: low
**Found in**: P-2026-10-24-0310

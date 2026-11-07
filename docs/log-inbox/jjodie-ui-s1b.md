# log-inbox — lane «jjodie-ui-s1b»

Entries written by the Jjodie S1b lane (front jjodie-ui, branch `jjp-s1b`, merged by the chat into `jjodie-panel`).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: jjodie S1b, header, in-input mode selector, code block wrap
**Prompt**: P-2026-10-24-0211, slice S1b under R-JJD-1: header (avatar, name, dot, chip, New conversation, overflow with Reset, close), mode switch as a selector inside the input, model selector and disclaimer on one 11.5 px line under it, code blocks without nested card padding and with a 4ch hanging indent; probe and two crops.
**Files touched**: frontend/src/components/Jodie/ChatInput.tsx, ChatInput.scss, JodieHeader.tsx, JodieWindow.tsx, JodieWindow.css, MarkdownMessage.css, frontend/src/components/common/MarkdownRenderer.tsx (acaf3ab7f); MarkdownMessage.css, frontend/scripts/probe/jjodie-s1b-header-composer.ts (28c4d2058); docs/log-inbox/jjodie-ui-s1b.md, docs/prompts/claude_2026-10-24_0211_prompt_jjodie_s1b_header_composer.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 8 files, above rule 19's five, pause not taken (unattended). JodieWindow.tsx: only the bottom AIDisclaimer removed (moved under the input), no dock code; Jodie.tsx untouched. Gates: typecheck 0; vitest 411 pass, the 9 known window-import failures, 11800 tests pass; build ok. Probe on 3013: 33/33 PASS after the numbered-indent fix it found. Regressions unknown: wrapLines on the shared MarkdownRenderer reaches other hosts unprobed. RC-23 run is the chat's.
**Prompt document name**: 2026-10-24 02:11

**Ticket** (unattended decisions, `ratified as recommended, unattended`, RC-21/RC-25, for the digest): (1) the in-input selector is a native `<select>` laid transparently over the `<mode>>` glyph, switch source `'pill'`, so the existing `.jodie-code-prompt` probes still read it; (2) the JjEL scope hint sits right above the input, not in the meta line, which is too narrow at 460 px; (3) the disclaimer truncates with an ellipsis in that line, the full sentence in its tooltip; (4) New conversation is an icon button (`bi-pencil-square`) with that aria-label and title, no visible text; the overflow item reads «Reset panel width»; (5) «no nested card padding» read as: next to prose the code block bleeds to the bubble edges (radius 0, no side borders); a code-only bubble keeps its single frame; (6) the model popover opens upwards from the meta line; (7) `MarkdownRenderer` now emits one `.md-code-line` per line everywhere; only Jjodie bubbles style them. Measures: selector box (1012,791)-(1090.6,826.9) inside composer (997,783.9)-(1424,833.9); meta line 11.5 px, one line, 20.1 px high, 6 px under the composer; hanging indent 31.2 px = 4ch with and without line numbers; prose block flush with the bubble (1 px, its border). Crops: `~/.jjodel-lanes/P-2026-10-24-0211/s1b-header.png`, `s1b-composer-code.png`.

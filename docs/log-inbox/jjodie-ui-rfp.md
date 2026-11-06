# log-inbox — lane «jjodie-ui-rfp»

Entries written by the Refactoring-page polish lane (front jjodie-ui, branch `jjp-rfp`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-25 — fix: refactoring page, one Preview label, full-width editor, Jjodie in header
**Prompt**: P-2026-10-25-0005: three visual fixes on the Refactoring tab seen on the crops of P-2026-10-24-2340: the pane's second «Preview», the empty column right of the editor with a full-height blue focus line, the floating Jjodie launcher over the preview pane
**Files touched**: frontend/src/components/abstract/tabs/ScriptTab.tsx, ScriptTab.scss, frontend/src/components/scripts/RefactoringPreviewPane.tsx, RefactoringPreviewPane.scss, frontend/src/components/Jodie/JodieWindow.css, frontend/scripts/probe/refactoring-split-preview.ts (faeaf255b); docs/log-inbox/jjodie-ui-rfp.md (new), the prompt's Status
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 23:40
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Gates on faeaf255b: typecheck exit 0, vitest 12022/12022 with the 9 known window-is-not-defined files, build green. Probe refactoring-split-preview 36/36 (exit 0), port 3010 stopped by lane-run. Six source files, all in the DOVE (Rule 19 read as pre-confirmed by it). Measures and decisions below.
**Prompt document name**: 2026-10-25 00:05

**Measures** (viewport 1600x1000, the probe's log `~/.jjodel-lanes/P-2026-10-25-0005/probe-refactoring-split-preview.log`). (1) Pane title, read by its spans: idle `metamodel_1` (no mode span); previewing `metamodel_1 · preview`, the mode span `rgb(148, 163, 184)` (muted); one element with text «Preview» in the tab. (2) Before: split handle x 841, `.editor-scrollable` 271..786 (515 wide), ruler 772..786, Monaco layout contentLeft 85 contentWidth 515; `.monaco-editor` focused outline `solid 1px rgb(0, 144, 241)` offset -1px over the full 600 px box. Cause: the unscoped rules of `components/editors/skeleton.scss:90-104` (`.margin` 30px, `.monaco-scrollable-element` left 30px, both !important) move the content to x+30 while Monaco sizes it from its own 85 px margin, so it ends 55 px short, plus the 14 px ruler. After: contentLeft 30 (glyph margin 20 + lineDecorationsWidth 10, lineNumbers off, folding off), scrollable 271..841, ruler 827..841, right edge = handle x (0 px); focused outline `none` on `.monaco-editor` and on `.script-tab__editor`. (3) Launcher on the project tab before the Refactoring tab: x 270 y 842 w 58 display flex; on the Refactoring tab display none, width 0; on another dock tab afterwards x 270 y 842 w 58 (unchanged). Header button `aria-label="Open Jjodie"` 28x28 at x 1561, after Preview (1490..1553), 10 px from the toolbar's right end; click: `.jodie-window` 0 → 1, `.jodie-dock-slot` present, panel x 1140 width 460 (flush right).

**Decisions taken (unattended)**, ratified as recommended, unattended (RC-21, RC-25), not yet rows of `docs/decisions.md`: (1) skeleton.scss is not in the DOVE and its rules hold every Monaco editor of the app, so the tab adapts its Monaco options to the 30 px margin rather than overriding those rules; line numbers go off, which changes no pixel because that margin already clipped them (none drawn on the crop of 2340). (2) Monaco's focus outline is turned off inside `.script-tab__editor` only; caret and current-line highlight mark the focus. (3) The header button dispatches `JjodieEvents.OPEN`, which `Jodie.tsx` handles like the launcher's click (`isOpen: true`, unread cleared). (4) The 2340 launcher rule (right 16px, 48px) is replaced by `display: none` on the same selector, amending R-JJD-15's launcher clause as the prompt says. (5) The probe's «launcher on the window side» check becomes «no floating launcher on the Refactoring tab» plus the header-button and dock checks; the other-tab check now compares against the position measured before the Refactoring tab opened.

**Crops**: `~/.jjodel-lanes/P-2026-10-25-0005/` `rfp_idle.png` (after the probe's 700 px resize), `rfp_previewing.png`; also `rfa_tab.png`, `rfa_preview_pane.png`, `rfa_editor_diagnostics.png`, `rfa_problem_list.png`, `rfa_other_tab_launcher.png`.

# Jjodie S1a: docked, resizable panel (code and gates)

Prompt-ID: P-2026-10-24-0135
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S1a, code and gates)
Depends: P-2026-10-24-0115
Status: eseguito 2026-10-24 · lane jjodie-ui · 467e3ec98 · verifica visiva fallita 2026-10-24 (probe P-2026-10-24-0210, 34/35: header close button past the edge at 460, fixed in 785e65d19; Quick tip toast over the dock, open, outside S1a)
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run; S6 and one-step Apply approved)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`). P8: the visual check runs in the
next lane (S1a probe); this lane runs the gates only.

Worktree: `~/jjodel-w-jjp-s1a`, branch `jjp-s1a`, cut from `jjodie-panel` at `9dc2f3c6e` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules`
symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0135 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files (CLAUDE.md §3.2) are not authorised: if
one is needed, stop. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates are green.
Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat` a whole large file or log;
`Jodie.tsx` and `JodieWindow.tsx` are read by line ranges; test and build output is read through `tail` or `grep` of
the summary lines. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Close with the
log-inbox entry (skill `log-entry`) and the Status flip in one docs-only commit. Nothing merges anywhere: the chat
merges `jjp-s1a` into `jjodie-panel`.

## Read first, and only this

The report: Q1 and its addendum, Q7 (row S1a), «Decisions taken». The rows R-JJD-1..6 in `docs/decisions.md`
(section «R-JJD»). From `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md` its S1 only.

## COSA

Slice S1a under R-JJD-1:

1. Jjodie docks as a grid column of `.dashboard-container` in `ProjectDashboard` (portal target), to the right of the
   editor, so the editor shrinks. A vertical drag handle on its left edge resizes it: min 420, max 760, default 460 px.
2. The width persists as an optional `dockWidth` on `JodieConfig` (`types/jodie.ts`), written on pointer-up through
   the existing `save()`, never per drag frame. `position` and `size` stay readable and unused.
3. Floating and maximized modes go away: no fullscreen button, no 8-way resize, no free positioning. The minimized FAB
   (closed state) stays. No other Jjodie feature is removed.
4. The Properties rail (`.properties-tree-overlay`, `right: 0`) moves left by the dock width through a new body
   variable declared in `styles/tokens/` (default `0px`), written by the dock while it is open and reset to `0px` when
   it closes or unmounts. `--jj-canvas-right-inset` is not touched. Check the name is free with a global grep first.
5. Header, composer and code blocks are NOT in this slice (S1b).

Gates: `npm run typecheck` at the baseline of CLAUDE.md §17, `npx vitest run` (summary lines only), `npm run build`.
One code commit (`feat(jjodie): dock the panel with a resize handle`).

## HARD STOP

After the code commit and the closing docs commit: `Outcome: hard-stop` (visual check due in the probe lane).

## NON FARE

No edit to `JodieHeader.tsx`, `ChatInput.tsx`, `MarkdownRenderer.tsx`. No critical-zone file. No merge, no push.

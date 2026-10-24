# Refactoring tab beside the real metamodel tab: preview on the real canvas

Prompt-ID: P-2026-10-25-0020
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (short discovery inside, then implementation)
Depends: P-2026-10-25-0005
Status: da eseguire
Corregge: 2026-10-24 23:20
Request: Alfonso, 2026-10-25 ~00:12 («vai con l'affiancamento in /lane auto»), after a screenshot of the refactoring tab on HwDesign judged «non mi pare bellissima» and the question «non sarebbe possibile visualizzare direttamente il metamodello originale?»
Model: claude-opus-5-5
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is replaced by section 1 (short discovery at the top of the log entry). This prompt supersedes two choices of R-JJD-15 (the class-box renderer as the main view, the tab-local preview state); the chat writes the new R- row. No core change, no critical-zone file: the real canvas is the one the user already opens, never a second instance; if the work needs `useJjomSync.ts` or another critical-zone file, stop with `Outcome: question`.

Worktree: `~/jjodel-w-jjp-sbs`, branch `jjp-sbs`, cut from the trunk at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-25-0020 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as each step is green. One probe run per tool call. Context discipline: two lanes of this front hit the ceiling; never read a file over 200 lines whole, use grep-found ranges; outputs through `tail -20` or `grep`. If the context passes about 140k, commit what is green, write a handoff and stop. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001, 3002 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-sbs.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

Rows R-JJD-2, R-JJD-6, R-JJD-15 in `docs/decisions.md`. `docs/log-inbox/jjodie-ui-rfa.md` and `jjodie-ui-rfp.md`. `frontend/src/components/dock/MyRcDock.tsx` around `addTab` and `dockMove` (lines ~240..280). The ghost preview of the canvas: `frontend/src/components/editor-v2/preview/scriptPreviewStore.ts`, `previewElements.ts` (M2 ghosts since jjp-m2), `PreviewBar.tsx` (`applyAsOneStep`).

## COSA

The refactoring tab's right pane draws its own class-box diagram on a fixed four-column grid. On a real metamodel (HwDesign, 15 classes) it ignores the user's layout, edges cut through classes, and most of the pane is empty. The user wants to see the original metamodel change.

1. Short discovery (top of the log entry, file:line, positive control for every absence): how a metamodel tab is opened programmatically and how to find an already open one; whether rc-dock can place a tab beside another (`dockMove(tab, targetPanel, 'right')` or equivalent) and keep the split when tabs are switched; how the canvas ghost preview is fed (`scriptPreviewStore`) and whether it can be driven from the refactoring tab for an M2 target; what happens on a narrow window.
2. Layout: the refactoring tab contains only the editor (with its diagnostics, header, Preview and the Jjodie header button). When the tab opens, or at the latest on Preview, the target metamodel's own tab is shown beside it, to the right, in a split of the dock: reuse the tab if it is open, open it otherwise; never a second instance of the same tab. The split ratio defaults to editor 40 / canvas 60 and is persisted.
3. Preview: drives the shared `scriptPreviewStore` so the ghosts (added classes and features dashed cyan, removed features struck through, dashed generalizations) are drawn on the real canvas with its layout, zoom and pan. The bar with effect chips, model impact, Discard and Apply stays in the refactoring tab; Apply goes through `applyAsOneStep` (R-JJD-6). Editing while previewing re-plans. Changing the target closes the preview and moves the beside tab to the new target. Placement of ghost classes: next to the class they extend or reference; else in the first free area right of the drawn classes (fix the stacking under the Properties rail reported by jjp-m2 if it shows).
4. The class-box renderer stays only as a fallback when the dock cannot show the two tabs side by side (window narrower than about 1100 px, or the target tab cannot be opened); in that case it keeps today's behaviour. Its fixed four-column grid is not improved here.
5. Closing the refactoring tab clears its preview; the metamodel tab stays open.

Tests first where the logic is pure (target tab lookup, split decision by width, preview ownership). Probe `frontend/scripts/probe/refactoring-side-by-side.ts`: a project with a metamodel of at least 8 classes laid out by hand and a model with values; open the refactoring file; measure that the metamodel tab is beside it (two visible panels, x ranges disjoint), ghosts present on the real canvas after Preview with the existing class positions unchanged, Apply and one Cmd+Z, target change moves the beside tab, a narrow window falls back to the renderer. Crops into `~/.jjodel-lanes/P-2026-10-25-0020/` (side by side idle, previewing).

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build, `npm run smoke` (re-run once on the same server on the known first-load timeout), the probes `refactoring-split-preview.ts`, `jjodie-m2-preview.ts`, `jjodie-s4c-apply-undo.ts`.

## DOVE

To be confirmed by step 1. Expected: `ScriptTab.tsx`/`.scss`, `RefactoringPreviewPane.tsx` (fallback only), `MyRcDock.tsx` (a helper to place a tab beside another, no change to existing behaviour), the preview store and elements if the M2 target needs a hook, the new probe, `docs/log-inbox/jjodie-ui-sbs.md`, Status of this prompt. List every source file in the log with its reason.

## HARD STOP

None unless a stop condition fires: close with the docs commit and `Outcome: done`, with the probe results.

## NON FARE

No critical-zone file, no `reducer.ts`, no planner change, no JjScript grammar change, no second canvas instance of the same metamodel. No merge, no push.

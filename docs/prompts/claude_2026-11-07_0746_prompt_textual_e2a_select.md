# Textual syntax, lane E2a: text to canvas selection

Prompt-ID: P-2026-11-07-0746
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-07 · lane full · ef8c76e3c · soft ceiling, continued by P-2026-11-07-0840 (item 2 committed there, 5ca6ac98a)
Lane: full (pure module, Text tab wiring, tests; app check)
Depends: E1a/E1b (merged, P-2026-11-07-0645), R-TXT-54
Worktree: ~/jjodel-w-texte2a, branch textual-e2a-select
Request: none (lane auto, «Procedi con E e poi F»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. Every reply opens with [P-2026-11-07-0746 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row E2a of docs/discovery/discovery_2026-11-06_textual_e_sync.md §9.1, designed in §4 (4.3), §6.1-6.4, §7.1 and decisions E2, E6, E7 of §9.2 / R-TXT-54.

(1) **`selectionSync.ts`, pure** (new): the innermost carried span at an offset; the last-id guard (no repeat for the same id); the filter that lets only user caret moves through (a click or an arrow key, not typing, not a programmatic `setValue` or a reprint, §6.1-6.2). Tests in `__tests__/selectionSync.test.ts` (new) cover each, plus objects without a span (§6.3).

(2) **Wiring in ui/TextualTab.tsx**: the cursor handler selects the caret's object on the canvas with `SELECT_NODE` through `pickOnCanvas` on the pane's ids (codegen/ui/codeOrigins.ts, read only); the outline click selects too (E7); the caret move writes `_lastSelected` as the tree view does (E2, `TreeViewContent.tsx:1216-1220`'s pattern), so the Properties panel follows. Do not reuse `useJjomSelection.selectElement` (it enters the critical zone, §7.1). Nodes only, no edges (E6). When the canvas is not on screen nothing happens (§6.4).

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness, timing or order-dependent reds rerun alone and are named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check** with real gestures as §8.2 lists for «Text selects canvas» and «Typing does not select» (a click on a line of `.textual-tab .view-lines`, then `ArrowDown` presses; a character typed inside a span with a listener counter for `SELECT_NODE`), plus the outline click and the Properties panel following. Reuse ~/.jjodel-lanes/P-2026-11-07-0510/{common.mjs,probe.mjs} (the canvas and the docked Text panel; the probe-only CSS rule stays in the probe, E3 owns the placement), copied into ~/.jjodel-lanes/P-2026-11-07-0746/. Crops, light theme, scale 1, of the split (text and canvas in one image): 1-caret-in-object (its node ringed), 2-after-arrowdown (the next object's node ringed), 3-typing (selection unchanged), 4-outline-click, 5-properties (the Properties panel on the caret's object). Stop your server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required, with a pointer to the §7.2 draft for `_lastSelected`), Status flip, both left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/selectionSync.ts (new), frontend/src/codegen/textual/__tests__/selectionSync.test.ts (new), frontend/src/codegen/textual/ui/TextualTab.tsx. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## COME

Reuse `pickOnCanvas`, the carried decorations of E1b and the existing outline. If a needed change falls outside DOVE, stop with Outcome: question.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_e_sync.md (§4, §6, §7, §8.2, §8.3, §9); docs/decisions.md R-TXT-54; E1b log entries in docs/log-inbox/codegen.md.

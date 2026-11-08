# Textual syntax, lane TABFIX: three Text tab candidate tickets

Prompt-ID: P-2026-11-08-0859
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-08 · lane full · 55ac2cc03, c53f1419d, eb6c08382 (red first, bench 19/19) · gates green (vitest: 3 baseline import reds) · probe 19/19, crops 1-reprint, 2-open-selected, 3-homonyms in ~/.jjodel-lanes/P-2026-11-08-0859/
Lane: full (three small fixes in the Text tab, tests, app check with crops)
Depends: F1c, F1e, E2b, T8c (all on the trunk)
Worktree: ~/jjodel-w-texttabfix, branch textual-tab-fixes (from trunk e1f06117c, own node_modules)
Request: none (lane auto, «Procedi con tutto in lane auto», 2026-11-08 07:36)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core, nothing outside frontend/src/codegen/textual/, no store write, no new dependency. Every reply opens with [P-2026-11-08-0859 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0859/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Three candidate tickets found by the chat while closing F1c, F1e, E2b and T8c. Read the F1c, F1e, E2b and T8c entries in docs/log-inbox/codegen.md first.

(1) **JjEL warnings survive a reprint**. Today any reprint of the text (a style switch included) calls setMarkers(null) or an equivalent clear on the model and the JjEL warnings of F1c and F1e (owner jjel) stay gone until the next edit. Fix: after a reprint the jjel markers are recomputed from the new text in the same place the textual markers are, through checkIslands. Find the exact call first and quote it in the report. Test: a unit or component test that reprints (and switches style) with a malformed guard and finds the jjel diagnostic again; if only the app can show it, the crop is the test and say so.

(2) **E2b highlight on open**. A Text tab opened while canvas nodes are already selected shows no highlight until the selection changes. Fix: on mount (and when the tab becomes visible, if it stays mounted) read the current canvas selection once, through the same read path E2b's CANVAS_SELECTION_CHANGED listener uses (no store write, no new event), and apply the same highlight; keep E2b's ping-pong guard of §6.1 of docs/discovery/discovery_2026-11-06_textual_e_sync.md. Test in __tests__/selectionSync.test.ts or the tab's test if the logic is pure; otherwise the crop.

(3) **Unnamed homonyms in the T8c confirm panel**. Two or more objects that would read the same, for example «Transition (unnamed)», get an index per class in that panel only when the label would otherwise repeat: «Transition (unnamed) 1», «Transition (unnamed) 2», in text order. A single one keeps its label as it is. Only the label in the confirm panel changes; no id, no matching, no threshold. Pure helper next to the panel's label code, tests for: no homonyms, two, three, two classes each with one, named objects untouched.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-0859/, reusing the probe of ~/.jjodel-lanes/P-2026-11-07-1736/ (F1e) and of ~/.jjodel-lanes/P-2026-11-07-1635/ (E2b), copy them and what they import, on its own port: 1-reprint (malformed guard, style switch, jjel warning still on the token, from Monaco's markers), 2-open-selected (select two nodes on the canvas, then open the Text tab: both spans highlighted, from the decoration elements), 3-homonyms (the confirm panel with two unnamed transitions reads 1 and 2, from the DOM). Measure from the DOM and Monaco's state, not from the screenshot.

(6) **Docs**: one log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome. If a fix needs a file outside frontend/src/codegen/textual/, stop that item with Outcome: question and a Recommended line, and finish the others.

## DOVE

frontend/src/codegen/textual/ui/TextualTab.tsx, the T8c confirm panel's file under frontend/src/codegen/textual/ui/ (find it from the T8c log entry), selectionSync.ts, jjelIslands.ts (read only unless needed), their tests under frontend/src/codegen/textual/__tests__/. Nothing else; ask first. Before a new identifier or CSS class, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§4.3); docs/discovery/discovery_2026-11-06_textual_e_sync.md (§5, §6); docs/decisions.md R-TXT-54, R-TXT-55; the F1c, F1e, E2b and T8c log entries in docs/log-inbox/codegen.md.

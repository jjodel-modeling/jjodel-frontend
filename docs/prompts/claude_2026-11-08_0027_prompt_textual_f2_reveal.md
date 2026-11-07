# Textual syntax, lane F2: from a generated line to the model line in the Text tab

Prompt-ID: P-2026-11-08-0027
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (one registry event, dispatch in the generator tab, listener and reveal in the Text tab; tests; app check with crops)
Depends: E2a, E2b (merged), F1a..F1e (merged), R-TXT-55 (F6, F7, F12)
Worktree: ~/jjodel-w-textf2, branch textual-f2-reveal (from trunk 819c700b5, own node_modules)
Request: Alfonso 2026-11-08 00:24 «decidi tu» (the chat chose to continue with F2)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no new dependency. The only file outside frontend/src/codegen/ is frontend/src/events/registry.ts, and there you only ADD one event (an exported addition; nothing renamed or removed). Every reply opens with [P-2026-11-08-0027 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call; never cat a whole probe or gate log, grep its summary lines. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0027/handoff.md (what is committed, what is left, the next command) before anything else.

## COSA

Row F2 of docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md §8.1, decisions F6, F7, F12 of §8.2 (R-TXT-55), designed in §5.3 route 2; risk R5 of §9.

(0) **Measure the ids first** (§5.3 «Ids»): on one model, is a generated span's `elementId` among the Text tab's carried span ids? Write the reading in your final message. If they differ, stop with Outcome: question and a Recommended line.

(1) **The event**: `JjodelEvents.TEXTUAL_REVEAL` in frontend/src/events/registry.ts with payload `{ modelId, elementId, featureName? }` (F12), following the registry's existing pattern (CLAUDE.md 8.6, 8.7; no bare string, rule 25). Grep the name first.

(2) **Dispatch** in `codegen/ui/GeneratorPane.tsx`: `onSpanClick` dispatches it next to `selectOnCanvas`, with the origin's element id and feature name. Nothing else in that file.

(3) **Listen and reveal** in `ui/TextualTab.tsx`: the Text tab of that model listens, finds the carried span of `elementId`, and inside it the item node whose `feature` is `featureName` (else the object's first line); reveals and highlights it with E2b's highlight collection, without moving the caret or taking focus. A closed Text tab does nothing (F7). An object with no carried span is silent. Decide R5 (the canvas route also highlights the same object) on the crops: dedup by id or let the direct event replace the canvas highlight, and say which in Decisions taken. The pure part (span plus feature to a line range) goes in `selectionSync.ts` with tests in `__tests__/selectionSync.test.ts`: feature found, feature missing (object line), no span (nothing), a span after a reprint.

(4) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 import reds are the baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(5) **App check** with crops in ~/.jjodel-lanes/P-2026-11-08-0027/, reusing the E2b probe in ~/.jjodel-lanes/P-2026-11-07-1635/ (copy it and what it imports) on its own port, with a generator and a Text tab open on the same model: 1-click-object (a click on a generated span of an object reveals and highlights that object in the Text tab), 2-click-feature (a span from a feature reveals that feature's line), 3-caret (the Text tab's caret did not move), 4-closed (with the Text tab closed a click does nothing new and logs no error). Measure from the DOM (decorations and their lines), Monaco's state and the console, not from the screenshot.

(6) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted (RC-17). Edit only your new entry's lines, never the file as a whole. No push, no merge. Final message: the id reading, what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/events/registry.ts (one added event), frontend/src/codegen/ui/GeneratorPane.tsx (the dispatch only), frontend/src/codegen/textual/ui/TextualTab.tsx, selectionSync.ts, __tests__/selectionSync.test.ts. Nothing else; ask first. Before a new identifier, grep the codebase for it.

## RIFERIMENTI

docs/discovery/discovery_2026-11-07_textual_f_jjel_tracing.md (§5, §8, §9 R5); docs/decisions.md R-TXT-55; the E2a, E2b and F1 log entries in docs/log-inbox/codegen.md.

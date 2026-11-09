# Textual syntax, lane D6b: the pinned card's shortcut on the Mac Italian layout

Prompt-ID: P-2026-11-09-0950
Chat: C-2026-11-08-1908
Front: codegen
Status: eseguito 2026-11-09 · lane textual-d6-pinned-hover · 5221842dd · verifica visiva passata 2026-11-09 by the chat on the lane DOM checks (12/12; keybinding and label only); crop 1-hover-chord.png for Alfonso (probe 12/12, crop 1-hover-chord.png)
Lane: fast (one keybinding and its label; app check with one crop)
Depends: D6 on this branch (code e536fc071, 0d9fd1fa9, 34a586c28; docs 8d2fa8843)
Worktree: ~/jjodel-w-textd6, branch textual-d6-pinned-hover
Corregge: P-2026-11-08-2330 (Alt+H chosen in its discovery §2; risk 2 of that report)
Request: Alfonso 2026-11-09 09:45: on his Mac with the Italian layout, Option+H in the Text tab types «∆» instead of pinning the card.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 critical-zone file is in scope.

## Lane discipline
Every reply of this session opens with `[P-2026-11-09-0950 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## COSA
1. Replace the Alt+H keybinding of the Pin action (`ui/PinnedHoverCard.tsx:102`) with the chord Cmd+K Cmd+P (Ctrl+K Ctrl+P off the Mac): `monaco.KeyMod.chord(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP)`. The discovery report (§2) found it free in Monaco's chords and in the app (the `GlobalSearch.tsx` Cmd+K listener is not mounted): re-check that grep in one command before changing code. Update the comment at line 3 and every place that shows or documents the shortcut (the hover's «Pin · ⌥H» label via `formatShortcut`, tests that assert it). If `formatShortcut` cannot print a chord, print it as the two strokes separated by a space, in the existing style of `utils/keyboardShortcuts.ts`, without changing that file unless it is the only place; ask first if it is.
2. Why Alt failed, in one line for the log: on macOS, Option with a letter produces a dead or composed character on most layouts (here «∆» on Italian), so no Option+letter shortcut is safe in a text editor.
3. Tests: if a test asserts the label or the keybinding, update it red first. Gates, one tool call each, from frontend/: typecheck; npx vitest run on frontend/src/codegen/textual (the full suite only if a file outside it changed); build; check:docs.
4. App check on a free port, reusing ~/.jjodel-lanes/P-2026-11-09-0020/probe.mjs and common.mjs: the chord pins the card at the caret; Option+H no longer pins anything; the hover's Pin label shows the new shortcut. One crop, 1-hover-chord.png, in ~/.jjodel-lanes/P-2026-11-09-0950/.
5. Docs: log entry in docs/log-inbox/codegen.md via the log-entry skill (Corregge P-2026-11-08-2330, Causa the matching letter of §21.3, Layer Impact Report not-required, Notes under 500 characters), Status flip; both uncommitted (RC-17). Stop with Outcome: hard-stop.

## NON FARE
No push, no merge, no new dependency, no other change to the card.

## RIFERIMENTI
docs/discovery/discovery_2026-11-08_textual_d6_pinned_hover.md §2 and risk 2; docs/decisions.md R-TXT-42.

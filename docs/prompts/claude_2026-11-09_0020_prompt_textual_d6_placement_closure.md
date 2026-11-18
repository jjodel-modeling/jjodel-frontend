# Textual syntax, lane D6 continuation: the pinned card's placement, then closure

Prompt-ID: P-2026-11-09-0020
Chat: C-2026-11-08-1908
Front: codegen
Status: eseguito 2026-11-09 · lane textual-d6-pinned-hover · e536fc071 · verifica visiva passata 2026-11-09 (crops of P-2026-11-09-0020, Alfonso «go» 09:45; Option+H types ∆ on the Italian layout, shortcut replaced by the next lane)
Lane: full (continuation of P-2026-11-08-2330, stopped at the context ceiling; visual fix and app check)
Depends: P-2026-11-08-2330, code e536fc071, report 53680294f
Worktree: ~/jjodel-w-textd6, branch textual-d6-pinned-hover
Corregge: 2026-11-08 23:30 (the card drawn left of the editor, found by its own app check)
Request: Alfonso 2026-11-08 22:25, «procedi con lane auto».

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 critical-zone file is in scope.

## Lane discipline
Every reply of this session opens with `[P-2026-11-09-0020 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Context discipline: read ~/.jjodel-lanes/P-2026-11-08-2330/handoff.md first, then only the ranges you need; never cat probe.out or a log whole, grep it. Commit code before the app check. At the ceiling write ~/.jjodel-lanes/P-2026-11-09-0020/handoff.md and stop.

## COSA
1. **Diagnose and fix the placement.** Measured by the previous session: the card's left edge sits 180 px left of the editor at 853 px editor width and 250 px left at 320 px. Measure first, in the app, with the DOM (the card's getBoundingClientRect against the editor's, the content widget's own position, the portal container's offset parent), and name the cause in one line before changing code. Fix inside the six files of the report (§6) only. If the pure `cardLimits` is wrong, its test goes red first.
2. **Fix the probe.** The «card fits inside» check must test both axes against the editor's rect; the 1-hover crop must frame the hover with the Pin link and its shortcut label.
3. **App check again**, free port, crops in ~/.jjodel-lanes/P-2026-11-09-0020/: 1-hover, 2-pinned, 3-link, 4-escape, 5-edit, 6-edge (pin near the right edge, card fully inside the editor), wheel inside a scrolling card, ebnf-return; add a text long enough to scroll so the line-out-of-view rule runs. Record the DOM numbers of the card and editor rects for 2-pinned and 6-edge in the result.
4. **Gates**, one tool call each from frontend/: typecheck, full vitest (load reds rerun alone and named), build, check:docs, mutation bench on hoverCard.ts.
5. **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill covering 2330 and 0020 (Corregge the dash for 2330's own work; Causa the dash; Layer Impact Report not-required; Notes under 500 characters, including that discovery §5.2 was wrong about React 18 portal listeners and the native listeners stay); Status flips of both prompts. Leave them uncommitted (RC-17). Stop with Outcome: hard-stop.

## NON FARE
No push, no merge, no new dependency, no Monaco internals, no file outside the six of the report without asking.

## RIFERIMENTI
~/.jjodel-lanes/P-2026-11-08-2330/handoff.md and handoff.diff; docs/discovery/discovery_2026-11-08_textual_d6_pinned_hover.md (§3.2 edges, §6 plan); docs/decisions.md R-TXT-42.

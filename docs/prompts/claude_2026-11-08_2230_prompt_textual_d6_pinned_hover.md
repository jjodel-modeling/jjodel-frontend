# Textual syntax, lane D6: the pinned hover card of R-TXT-42

Prompt-ID: P-2026-11-08-2230
Chat: C-2026-11-08-1908
Front: codegen
Status: da eseguire
Lane: full (new Monaco content widget in the Text tab, new UI, more than three files likely; app check with crops)
Depends: trunk 788bb6e71 (steps A..F merged, T8e merged 3589668e7)
Worktree: ~/jjodel-w-textd6, branch textual-d6-pinned-hover (from 788bb6e71)
Request: Alfonso 2026-11-08 22:25, «procedi con lane auto», on the gap found by the chat: R-TXT-42 says «implemented in step D», the step D report never planned it, no lane built it.

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md §3.1 critical-zone file is in scope; if the work turns out to need one, stop with Outcome: question.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2230 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Context discipline: never cat a whole log, a whole probe output or a whole file over 400 lines; grep and read ranges. If the context gets heavy, write `~/.jjodel-lanes/P-2026-11-08-2230/handoff.md` (done, next, uncommitted files) before stopping.

## Contesto (non rifare l'analisi)
R-TXT-42 (docs/decisions.md, Alfonso 2026-11-04 06:52) amends R-TXT-39 (3): Monaco's own hover cannot stay open through its public API (measured by P-2026-11-04-0005: `_sticky = false`). The hover keeps its command links («Go to definition», one per line that uses the reference, `textualMonaco.ts:262-288`). A card that stays open opens by an explicit action (a link in the hover or a shortcut) as a Monaco content widget with the tab's own close rules: ×, Escape, a click on the text, an edit, its line out of view. Not a forcing of Monaco. The step B2 discovery (docs/discovery, P-2026-11-04-0005) designed the hover card; read it first.

## COSA

**Phase 1, discovery, read only.** Write docs/discovery/discovery_2026-11-08_textual_d6_pinned_hover.md (objective, files read with full paths, findings with file:line, design, risks, open questions each with `Recommended:`), commit it alone on the branch, then STOP with Outcome: hard-stop. The report answers:
1. What the hover shows today (content per kind: object, reference, keyword, literal, JjEL island) and where it is built; what the pinned card must carry (at least the same content plus the command links, which must stay clickable).
2. The explicit action: a link inside the hover («Pin») and a shortcut; check that the shortcut collides with nothing in Monaco's default keymap, the Text tab's own bindings (Format, rename, quick fix) and the app's global shortcuts (grep the keyboard registry).
3. The widget: `IContentWidget` anchored at the hovered position, one card at a time, a second pin replaces it; positioning near the editor's edges; its styling from the Text tab's existing tokens (no new colours, light theme only, D-UI-15); no layout shift of the editor.
4. The five close rules of R-TXT-42 and how each is detected (keydown Escape, mouse down on the text, model content change, scroll that takes its line out of view); what happens on a reprint (E1), a tab switch, a style switch.
5. Accessibility: focus on open, Tab inside the card, Escape returns focus to the editor.
6. The lane plan for Phase 2: files, tests first (which pure part can be tested in node), the app check scenes.

**Phase 2, after the chat's GO** (same session, resumed). Implement the report's design. Tests red first, then code. Gates, one tool call each, from frontend/: npm run typecheck (baseline in CLAUDE.md §17); full npx vitest run (load reds rerun alone and named); npm run build; npm run check:docs. Mutation bench on the pure part if there is one. App check on a free port with crops in ~/.jjodel-lanes/P-2026-11-08-2230/, reusing the probe approach of ~/.jjodel-lanes/P-2026-11-07-1622/ (copy what it imports): 1-hover (the hover with its new Pin link), 2-pinned (the card open, a command link visible), 3-link (a command link in the card clicked: the cursor moved, card closed or kept as the report decided), 4-escape and 5-edit (the card gone), 6-edge (a pin near the right edge of the editor, card fully visible). Docs: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip; both left uncommitted until the visual check (RC-17). Stop with Outcome: hard-stop.

## HARD STOP
After the Phase 1 report. After the Phase 2 app check.

## NON FARE
No push, no merge. No new dependency. No forcing of Monaco internals (no `_sticky`, no private fields): R-TXT-42 forbids it. No change to the hover's existing content beyond adding the Pin link. No dark-theme variant.

## DOVE
Read: frontend/src/codegen/textual/ui/textualMonaco.ts, ui/TextualTab.tsx, ui/TextualTab.scss, frontend/src/codegen/textual/languageService.ts, the keyboard shortcut registry of the app (grep), the B2 discovery report. Write (Phase 2, to be confirmed by the report): ui/textualMonaco.ts, ui/TextualTab.tsx, ui/TextualTab.scss, a new pure module under frontend/src/codegen/textual/ if the report proposes one, its tests under __tests__/. Before a new identifier or CSS class, grep the codebase for it.

## RIFERIMENTI
docs/decisions.md R-TXT-39, R-TXT-42, D-UI-15; docs/sessioni/sessione_2026-11-03_textual_ide_plan.md; the B2 discovery report (P-2026-11-04-0005) and the B2 log entries in docs/log-inbox/codegen.md; CLAUDE.md §3.1, §17.

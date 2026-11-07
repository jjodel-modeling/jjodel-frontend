# Textual syntax, lane D4: safe rename in the Text tab

Prompt-ID: P-2026-11-07-0515
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (language service, the Monaco wiring, tests; app check)
Depends: D2c (CompletionItemProvider, merged), D3b (CodeActionProvider, merged), R-TXT-53
Worktree: ~/jjodel-w-textd4, branch textual-d4-rename
Request: none (lane auto, «Procedi con E e poi F»; D continues alongside)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file, no core outside frontend/src/codegen/textual/, no new dependency. Every reply opens with [P-2026-11-07-0515 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D4 of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8, designed in its §5 (text route, 5.2; refusals, 5.3) and decision D4 of R-TXT-53.

(1) **`renameEdits`, pure**, in languageService.ts: given the text, an offset and a new name, return the edits for the object's name token and every reference token naming it (`referencesAt(offset, true)`), or a refusal with its reason. The new name is written in the printer's form: an identifier that is not a reserved word bare, otherwise quoted; export the printer's `name`/`quote` helpers only if needed and say so (the same extraction as C3; if that means a file outside DOVE, stop with Outcome: question). Refusals: a parse that is not applicable (`isApplicableParse`); a nameless object («this object has no name: type one in the text»); the reparse check of §5.3 (the edited text, parsed with the same keep tokens, has an error the original did not, or some reference resolves to a different target than before, compared token by token after the shift). Paths and `@"id"` are never rewritten. Tests cover: a plain rename with references; a name needing quotes; a reserved word; a nameless object; a collision that makes a reference ambiguous or retarget; a broken text; the declaration-first order.

(2) **`RenameProvider`** in ui/textualMonaco.ts: `resolveRenameLocation` (the name token, or the refusal as `rejectReason`) and `provideRenameEdits` (one workspace edit, so one undo stop). The pause then applies the name change through the existing diff; no model write from the provider.

(3) **Gates**, one tool call each, from frontend/: npm run typecheck; full npx vitest run (the 3 files red at import are the baseline; harness, timing or order-dependent reds rerun alone and are named); npm run build; npm run check:docs; npm run check:codegen-lazy.

(4) **App check**, port corpus (copy ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed), crops in ~/.jjodel-lanes/P-2026-11-07-0515/, light theme, scale 1: the F2 rename box on an object referenced twice; the text after Enter with the declaration and both references renamed and the canvas showing the new name after the pause (identity kept: the same element, no confirm panel); the refusal message on a nameless object; the refusal on a colliding name. If the Text tab is hidden when docked beside the canvas, a probe-only CSS rule may show it (as P-2026-11-07-0346 did); no product change for that (lane E3). Stop the server.

(5) **Docs**: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash, Layer Impact Report not-required), Status flip, both left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/languageService.ts, ui/textualMonaco.ts, __tests__/languageService.test.ts, and printer.ts only for exporting `name`/`quote`. ui/TextualTab.tsx is not touched (another lane holds it). Nothing else; ask first. Before a new identifier, grep the codebase for it.

## COME

Reuse `referencesAt`, `isApplicableParse` and the parser's keep tokens; no metamodel code in the check. JjEL strings and validation rules naming objects by name are not rewritten (step F); say so in the log Notes.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md (§5, §8 D4 row, §9); docs/decisions.md R-TXT-45, R-TXT-53; D2c and D3b log entries in docs/log-inbox/codegen.md.

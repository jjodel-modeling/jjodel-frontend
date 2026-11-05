# Textual syntax, editable EBNF literals, lane L1b: the islands in the EBNF mode (UI)

Prompt-ID: P-2026-11-05-0921
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (UI of the textual layer)
Depends: P-2026-11-05-0906 (L1a merged, 4b858ee65), R-TXT-48, R-TXT-49
Worktree: ~/jjodel-w-ebnflit, branch textual-ebnf-literals, at 5fd33809e (the trunk tip)
Request: none (lane auto, Alfonso 07:38; visual merge after the chat's crop check)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 5fd33809e and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.2 critical-zone file, no core, no new dependency. Every reply opens with [P-2026-11-05-0921 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Read docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §2, §3 and the L1b row of §5.1 once, then code. Each item: test red first where a test can show it, its own commit (RC-51). Grep every new class name, export and event first.

## COSA

The L1b row of the report §5.1, per R-TXT-49 D2, D3, D6, D7:
(1) new ui/useSyntaxDraft.ts: the draft, base, storedChange, reading, gate and save lifted from SyntaxForm.tsx, owned by TextualTab; SyntaxForm takes one optional prop and keeps its own state without it (behaviour unchanged, its tests still green).
(2) The EBNF mode shows `draftPreview(...).ebnf` from the shared draft; the model stays read only; each element literal from `concreteGrammarEbnfSpans` is decorated as an island (style tokens, fixed tokens and enumeration literals not decorated in step 1); a click or Enter on an island opens a content widget with an input over the literal; Enter applies through `setLiteral` (L1a), Escape cancels; a refused value shows its reason in the widget and nothing changes; occurrences with the same origin are linked (highlighted together, all change); the findings of the draft mark their literal; a bar with «Unsaved changes», Discard and Save (the D1 gates of R-TXT-47) when the draft is dirty; Save writes once, one undo step; Cmd/Ctrl+Z in the EBNF editor goes to the app's undo only while the draft is clean (D6). Basic and Advanced alike (D7). Styles in ui/TextualTab.scss on the tab's existing tokens only, no layout shift (the bar's height reserved or the same as the form's).
(3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes.
(4) In the app, port corpus (copy the probe of ~/.jjodel-lanes/P-2026-11-05-0118/: banner and What's new 3.1 suppressed): open EBNF by a real click; hover and click the per-item keyword `input`, type `in`, Enter: both its occurrences change and the preview of Text shows `in` after switching to Text without saving (the shared draft); try an operator symbol with a space: refused with its reason; Save: the Text mode prints with `in`; one Undo restores; Discard on a second edit; the Syntax form shows the same draft. Crops of each step in ~/.jjodel-lanes/P-2026-11-05-0921/, light theme, scale 1. Stop the server.
(5) Docs: log entry (Notes under 500 characters; Corregge and Causa the dash), Status flip, left uncommitted (RC-17). No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/codegen/textual/ui/useSyntaxDraft.ts (new), ui/SyntaxForm.tsx, ui/TextualTab.tsx, ui/TextualTab.scss, ui/textualMonaco.ts only for a theme rule, __tests__/. Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md; docs/decisions.md R-TXT-47, R-TXT-48, R-TXT-49.

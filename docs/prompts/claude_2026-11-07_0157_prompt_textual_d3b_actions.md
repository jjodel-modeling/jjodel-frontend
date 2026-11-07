# Textual syntax, step D, lane D3b: quick fixes and conformance markers in the editor

Prompt-ID: P-2026-11-07-0157
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (Monaco providers, Text tab, a new pure module; tests; app check with crops)
Depends: P-2026-11-06-2328 (D3a, `fix` on TextParseError, on this branch), R-TXT-53 (D6, D8), D report §4 and §8 row D3b
Worktree: ~/jjodel-w-textd, branch textual-d-writing-aids (after taking the trunk)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-06 23:10, «d parti»)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No CLAUDE.md 3.1 critical-zone file changed; model/conformance/useConformance is imported read only. No new dependency. Every reply opens with [P-2026-11-07-0157 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; one probe run per tool call. Each item: test red first, its own commit (RC-51, code first).

## COSA

Row D3b of docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §8.
(1) A `CodeActionProvider` in ui/textualMonaco.ts that turns D3a's `fix` on each parse error marker into quick fixes (text edits only, D6), with a title naming the edit.
(2) Conformance violations as markers: a pure conformanceMarks.ts (new) maps the violations of model/conformance/useConformance (read only) to the carried spans of the object and feature, severity warning, source `conformance`, never blocking the apply (D8); ui/TextualTab.tsx sets them on the model and keeps them on the carried spans across typing.
(3) Tests: __tests__/conformanceMarks.test.ts (new) for the mapping (object span, feature span, missing span, no violations); a provider test for the code actions.
(4) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 baseline import reds; harness or order reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy.
(5) App check, port corpus (copy ~/.jjodel-lanes/P-2026-11-05-2220/probe.mjs, banner and What's new suppressed; real keystrokes), crops in ~/.jjodel-lanes/P-2026-11-07-0157/, light theme, scale 1: a missing token with its quick fix offered and applied; an unknown reference with near names offered; a conformance warning (for instance a missing mandatory feature) on its line, the text still applying. Stop the server.
(6) Log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Corregge and Causa the dash), Status flip, uncommitted (RC-17). No push, no merge.

## DOVE

frontend/src/codegen/textual/ui/textualMonaco.ts, ui/TextualTab.tsx, conformanceMarks.ts (new), __tests__/conformanceMarks.test.ts (new). Nothing else; ask first.

## RIFERIMENTI

docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md §4, §8; docs/decisions.md R-TXT-53; D3a's final message in ~/.jjodel-lanes/P-2026-11-06-2328/.

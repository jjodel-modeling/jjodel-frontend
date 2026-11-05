# Textual syntax: textual-ebnf-literals takes the trunk, with the TextualTab.tsx conflict resolved by hand

Prompt-ID: P-2026-11-05-1455
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (merge of the trunk into the branch; one code conflict)
Depends: P-2026-11-05-1415 (L1b closed on the branch, 6ef8fbd10), P-2026-11-05-1413 (C3b on the trunk, 45fcd7233)
Worktree: ~/jjodel-w-ebnflit, branch textual-ebnf-literals (the same tree)
Request: none (RC-14; lane auto)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 6ef8fbd10 and the tree is clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-05-1455 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. No CLAUDE.md 3.2 critical-zone file.

## COSA

`git merge --no-ff --no-commit alfonso-frontend-jjtl` (the trunk at 8565e3e84; measured: conflicts in docs/log-inbox/codegen.md and frontend/src/codegen/textual/ui/TextualTab.tsx; code files changed on both sides). Resolve docs/log-inbox/codegen.md by union (both blocks whole, the trunk's first, each heading once). Resolve TextualTab.tsx by keeping both features whole: from the trunk, C3b (the deletion guard strip and its pending state, the Indentation entry, `styleRefusal` and the picker's refusal alert, the `textual-tab__stale` reuse) and C2b; from the branch, L1b (the shared draft through `useSyntaxDraft`, the EBNF mode on the draft, the literal islands, the content widget, the linked occurrences, the findings in the island's hover, the bar with Discard and Save, Cmd/Ctrl+Z per R-TXT-49 D6). Where both touch the same lines (the picker and the mode bar), the picker keeps the trunk's refusal and writes through the shared draft's save only if R-TXT-50's gate passes. Read both sides of each hunk before editing; no behaviour of either side dropped. Any other conflict: stop with Outcome: question. Then the gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 files red at import are the baseline; harness or order-dependent reds rerun alone); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes; plus the probes of both sides on the merged tree, each run once on a free port: ~/.jjodel-lanes/P-2026-11-05-1415/probe.mjs (L1b, 23 checks) and ~/.jjodel-lanes/P-2026-11-05-0910/probe.mjs (picker refusal, 9 checks) and the guard checks of ~/.jjodel-lanes/P-2026-11-05-0843/probe.mjs; crops into ~/.jjodel-lanes/P-2026-11-05-1455/; stop the servers. Commit the merge with subject `merge: textual-ebnf-literals takes alfonso-frontend-jjtl (P-2026-11-05-1455)` and a body naming each hunk's resolution. Log entry and Status flip left uncommitted (RC-17). No push, no merge into the trunk. Final message: the resolutions, what was verified and how, then the Outcome.

## DOVE

The merge, docs/log-inbox/codegen.md, frontend/src/codegen/textual/ui/TextualTab.tsx; nothing else.

## RIFERIMENTI

docs/decisions.md R-TXT-47, R-TXT-49, R-TXT-50; the log entries of P-2026-11-05-1413 and the L1b entry of this branch.

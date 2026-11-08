# Ticket C2f, critical zone: unnamed targets in the IR reference widgets

Prompt-ID: P-2026-11-08-0843
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (critical zone, go-ahead by Alfonso 2026-11-08 08:33 «Si»; Layer Impact Report first, tests first, crops)
Depends: P-2026-11-08-0818 (its Outcome question names the site), C2e (namelessTargetLabel.ts)
Worktree: ~/jjodel-w-textc2f, branch textual-c2f-labels
Request: Alfonso 2026-11-08 08:33 «Si» to the recommendation of P-2026-11-08-0818

Before anything else run pwd, git branch --show-current, git log -2, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Effort xhigh. This lane edits files under frontend/src/components/editor-v2/viewpoint/ir/ (CLAUDE.md §3.1 critical zone): write the Layer Impact Report to docs/discovery/lir_2026-11-08_nameless_reference_labels.md before any code (CLAUDE.md §3.2), and commit it. Every reply opens with [P-2026-11-08-0843 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a whole log. Each item: test red first, its own commit (RC-51, code first). If you near the context ceiling, write ~/.jjodel-lanes/P-2026-11-08-0843/handoff.md before anything else.

## COSA

Fix the finding of P-2026-11-08-0818 (read its final message in ~/.jjodel-lanes/P-2026-11-08-0818/log.jsonl): `referenceName` in viewpoint/ir/widgets/ReferenceWidget.tsx:51-60 returns an empty string for an unnamed target, and ListWidget.tsx:89 falls back to the raw id.

(1) In editor-v2/utils/namelessTargetLabel.ts (C2e): the label of an unnamed target reads Class (unnamed), with an index (Class (unnamed) 2, ...) only when two unnamed targets of one class would read the same in the same list. Test in editor-v2/utils/__tests__/ (grep the existing test of that helper first): named target unchanged, one unnamed, two unnamed of one class, unnamed of two classes.
(2) `referenceName` falls back to that label; ListWidget.tsx:89 drops the raw-id fallback; ReferencePicker.tsx options use the same label (check it; change only if it shows the id).
(3) Gates, one tool call each, from frontend/: npm run typecheck; full npx vitest run (3 import reds baseline; load reds rerun alone and named); npm run build; npm run check:docs; npm run smoke if the critical-zone rules ask it.
(4) App check with crops in ~/.jjodel-lanes/P-2026-11-08-0843/, reusing the C2e probe (~/.jjodel-lanes/P-2026-11-06-2041/, copy it and what it imports) on its own port: 1-before (from the trunk tip or the measure taken before the edit), 2-field (an unnamed target's field shows Class (unnamed)), 3-list (the open list shows labels, no raw id). Measure from the DOM.
(5) Docs: log entry in docs/log-inbox/codegen.md via the log-entry skill (Notes under 500 characters, Layer Impact Report: produced, citing the file), Status flip of this prompt and of P-2026-11-08-0818 (eseguito, superseded by this lane); both uncommitted (RC-17); edit only your entry's lines. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), then the Outcome.

## DOVE

frontend/src/components/editor-v2/viewpoint/ir/widgets/ReferenceWidget.tsx, ListWidget.tsx, ReferencePicker.tsx; frontend/src/components/editor-v2/utils/namelessTargetLabel.ts and its test; the LIR file. Nothing else; ask first. Grep before any new identifier.

## RIFERIMENTI

~/.jjodel-lanes/P-2026-11-08-0818/ (final message); the C2e log entry in docs/log-inbox/codegen.md; CLAUDE.md §3.1, §3.2.

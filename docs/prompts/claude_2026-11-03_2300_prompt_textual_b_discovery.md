# Textual syntax, step B: language service and navigation in the Text tab, starting with a short discovery

Prompt-ID: P-2026-11-03-2300
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane full · 85abf3dc4 (report, Phase 1 only; Phase 2 ran as P-2026-11-03-2350, 0020, 0046, 0125, 0146) · verifica visiva non applicabile, chiusa dalla chat
Lane: full (Text tab UI and a new language service; design before the code)
Depends: P-2026-11-03-2245 (step A merged, 2daef6982)
Worktree: ~/jjodel-w-textb, branch textual-b-navigation
Request: none (R-TXT-34 step B, Alfonso 2026-11-03 13:53; EBNF highlighting asked 14:10)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch and contains 2daef6982, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-2300 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each green step. Near the context ceiling, commit and write a handoff in the lane folder.

## Context
Plan: docs/sessioni/sessione_2026-11-03_textual_ide_plan.md, step B. Decisions: R-TXT-34, R-TXT-36 (the tree and what steps B and D need from it, table in docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md), R-TXT-21 (8), R-TXT-22, R-TXT-23. Code: frontend/src/codegen/textual/ (parser.ts with its lossless tree and roles, printer.ts, textMatch.ts with displayMatch, ui/TextualTab.tsx, ui/TextualTab.scss). Design tokens: slate base, cyan accents, 11px secondary text, 8px grid; Bootstrap Icons only; no new dependency without a question.

## COSA

### Phase 1, short discovery (stop here)
Read how TextualTab.tsx wires Monaco today (model, decorations, markers, the EBNF tab) and what the tree and displayMatch give. Write docs/discovery/discovery_2026-11-03_textual_language_service.md: objective, files read with paths, findings with file:line, risks, and ONE recommended design for a single language service derived from grammar and metamodel, wired to the Monaco providers (semantic tokens, document symbols, folding ranges, definition, references, hover), with no code specific to a metamodel; where the service lives (a module beside the parser, not inside the React component), how it is invalidated per parse, the cost model against the 50 ms budget at 1,000 objects, how the outline sits inside the Text tab left of the text, collapsible, following the cursor, filterable, with an `unknown container` node for a broken root (R-TXT-36), the breadcrumb, and syntax highlighting of the EBNF tab too. Rejected alternatives with reasons. Also measure the finding of P-2026-11-03-2152: after deleting and pasting back a block, a comment-only edit stopped at «confirm below» with two unnamed Transitions paired by order; say whether the pasted region loses its span evidence and what fixes it, without fixing it here. Decisions taken (unattended), Decisions awaiting Alfonso. Commit the report and stop with Outcome: question.

### Phase 2 (only after the chat resumes with the answers)
Tests first for the service (per provider, on a non-hardware corpus), then the providers, then the UI: semantic highlighting (keywords, types, resolved and unresolved references, values), the EBNF tab highlighting, outline, breadcrumb, folding, go to definition, find references, hover with metaclass, multiplicity and documentation. Measured tests: highlighting and outline at 1,000 objects, figures at 6,000. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline: context-binding, ai-prompt-sanitization, UDComparator); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. In the app, on a free port, keystrokes in the Text tab on a non-hardware model, light and dark theme: every provider exercised, the outline following the cursor and filtered, a broken root with its `unknown container` node, the EBNF tab. Crops of every visible change, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-2300/; they go to Alfonso. Log entry in docs/log-inbox/codegen.md (Notes under 500 characters) and Status flip written and left uncommitted until the visual check (RC-17). Stop the probe server. Stop with Outcome: hard-stop.

## NON FARE
No push, no merge, no completion, quick fixes, rename or formatting (step D), no T10 or synced selection (step E), no expression notation (step C). Nothing recovered from a broken text is ever applied (R-TXT-21 (8)). The repo is public: name no partner company.

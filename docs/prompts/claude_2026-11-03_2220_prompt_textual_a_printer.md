# Textual syntax, step A, printer half: the printer builds the same tree; equality closes A

Prompt-ID: P-2026-11-03-2220
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (printer of the textual layer)
Depends: P-2026-11-03-2152 (hard-stop at the ceiling, code at b35e18146, handoff in its lane folder; crops checked by the chat, RC-23)
Worktree: ~/jjodel-w-texta, branch textual-a-tolerant-parser (the same tree)
Request: none (R-TXT-36 (6, 7), Alfonso 2026-11-03 21:16)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of b35e18146, and the only other change is the untracked probe docs/discovery/harness/probe_2026-11-03_2120_tolerant_recovery.test.ts, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-2220 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call. Commit after each numbered item is green, a test red first. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
(1) Close the parser half, from ~/.jjodel-lanes/P-2026-11-03-2152/handoff.md: commit the probe; npm run check:docs; log entry in docs/log-inbox/codegen.md and the Status flips of 1415, 2120 and 2152, with verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-2152). Commit these docs now: the chat has checked the crops.
(2) A test of equality first, red: for every case of __tests__/tolerantCorpus.ts, the tree of a printed text and the tree of parsing that text are equal, node for node, token for token, roles and trivia included. (3) The printer builds that tree, as the design in docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md says (item 8), with an optional `tree` on its report, keeping the existing API and output byte for byte. If two nodes differ on purpose, stop and report it: the test is not weakened to pass. (4) Linear resolution in the printer (printer.ts:205 in the report), with a measured test at 1,000 and 6,000 objects. (5) Mutation bench on the tree builder and on the equality test.

Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline: context-binding, ai-prompt-sanitization, UDComparator); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. RISC-V Briefs, read-only: print, parse, equal trees. Nothing changes on screen, so no crops: confirm in the app, on a free port, that a non-hardware model prints the same text as before and that an edit applies, with one Undo. Log entry and this prompt's Status flip written and left uncommitted (RC-17). Stop the probe server.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop, or a handoff if the ceiling comes first.

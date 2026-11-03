# Textual syntax, step A, parser half: lossless tree, recovery, diagnostics

Prompt-ID: P-2026-11-03-2120
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito 2026-11-03 · lane full · 722eb3cee, 93ec1bd92 · stopped at the context ceiling (RC-51), closed by P-2026-11-03-2152 · verifica visiva passata 2026-11-03 (chat, RC-23, crops of P-2026-11-03-2152)
Lane: full (parser core of the textual layer)
Depends: P-2026-11-03-1415
Worktree: ~/jjodel-w-texta, branch textual-a-tolerant-parser (the same tree)
Request: none (answers of Alfonso 2026-11-03 21:16 in chat C-2026-11-03-1037, R-TXT-36 on the trunk)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file, docs/decisions.md or the core; if the work needs one, stop with Outcome: question. Every reply opens with [P-2026-11-03-2120 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a gate or probe log: summary lines only, through node scripts/run-quiet.mjs LABEL -- CMD. One probe run per tool call; a probe result is valid only if its mtime follows the run. Commit after each numbered item is green, a test red first. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
Read the section Recommended design and the table of steps B and D in docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md. Do not repeat the discovery. Answers of Alfonso, final:
(1) Lossless tree with trivia on tokens. (2) Recovery: token insertion and deletion, and descent into skipped blocks. Inferring a class keyword is deferred: do not write it. (3) Optional `unclosed` flag next to `recovered`. (4) Reference errors after a syntax error are secondary warnings, listed after the syntax errors. (5) The match of R-TXT-22 also runs on a broken text, for outline and synced selection only, never for the diff. (6) Linear name resolution. (7) The printer's half of the tree is the next lane, not this one: leave the printer's tree alone, and do its linear resolution there. Sizes: order of 1,000 objects, no incremental parsing, budget 50 ms per keystroke at 1,000 objects.

Items: (i) Tokens with trivia; the concatenation of tokens and trivia equals the text byte for byte, tested on every mutant of the probe corpus in docs/discovery/harness/. (ii) Tree of the design, spans, ParsedRef and object list derived from it; TextParseResult keeps its API and gains an optional `tree`; error nodes for skipped tokens; comment association derived. (iii) Recovery (a) and (b), `unclosed`; rerun the probe and report the same tables as F2, F3, F4 before and after. (iv) Two-tier diagnostics. R-TXT-21 (8) stands: a text with a syntax error is never applied, with a test on every mutant of the corpus that the diff stays null. (v) Linear name resolution in the parser; a measured test at 1,000 objects against the 50 ms budget, and the figures at 6,000. (vi) An exported function for the match of R-TXT-22 on a broken parse, display only, used by no write path, with a test; the outline itself and its `unknown container` node belong to step B, so return what that node needs and draw nothing.

No regression: every existing test of src/codegen/textual stays green, and printing then parsing stays byte-identical. RISC-V Briefs, read-only: print and parse, figures. Mutation bench on recovery and on the never-applied rule. Gates, one tool call each, from frontend/: npx tsc --noEmit; full npx vitest run (3 files red at import are the baseline: context-binding, ai-prompt-sanitization, UDComparator); npm run build; npm run check:docs; npm run check:codegen-lazy in both modes. In the app, on a free port, keystrokes in the Text tab on a non-hardware model: delete a brace and a keyword, truncate the text; the markers show the syntax error first, the status does not read Applied, the model stays untouched; retype, and it applies. A comment typed in the text stays through an application. Crops of the Text tab, light theme, device scale 1, in ~/.jjodel-lanes/P-2026-11-03-2120/. Say which steps are keystrokes and which setup is a direct write. Log entry in docs/log-inbox/codegen.md and Status flip of 1415 and this prompt written and left uncommitted until the visual check (RC-17). Stop the probe server.

The repo is public: name no partner company. No push, no merge. Final message: what was verified and how, Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome: hard-stop, or a handoff if the ceiling comes first.

# Textual syntax, step A: tolerant parser with positions and T9, starting with a short discovery

Prompt-ID: P-2026-11-03-1415
Chat: C-2026-11-03-1037
Front: codegen
Status: da eseguire
Lane: full (parser core of the textual layer, design before the code)
Depends: the merge of branch textual-t7; Alfonso's hand test
Worktree: ~/jjodel-w-texta, branch textual-a-tolerant-parser
Request: none (decision of Alfonso in chat C-2026-11-03-1037, R-TXT-34)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: the tree is clean on the stated branch and contains the merge of textual-t7, otherwise stop with Outcome: blocked. Do not touch any CLAUDE.md 3.2 file. Every reply opens with [P-2026-11-03-1415 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. A question with a recommendation carries one line: Recommended: <one line>. No subagents, no background tasks. Never cat a gate or probe log. Commit after each green step. Near the context ceiling, commit and write a handoff in the lane folder.

## COSA
Read docs/sessioni/sessione_2026-11-03_textual_ide_plan.md, and R-TXT-20, R-TXT-21 (1, 8), R-TXT-22, R-TXT-26, R-TXT-34 in docs/decisions.md. Code: frontend/src/codegen/textual/.

Phase 1 only in this prompt: measure how frontend/src/codegen/textual/parser.ts holds up on incomplete text, on a non-hardware metamodel in every annotated form the tests already use. Build a corpus by truncating valid prints at every token and by deleting single tokens. Report, with figures: how often a parse stops at the first error, what objects and spans survive, how far the error position is from the real fault, and the time on a large text. Then read how spans, identity (R-TXT-22) and comments relate to a concrete syntax tree. Write docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md (objective, files read with paths, findings with file:line, risks, recommended design as one choice with rejected alternatives, what the language service of steps B and D needs from it, Decisions taken (unattended), Decisions awaiting Alfonso), commit it, and stop with Outcome: question. No production code.

The repo is public: name no partner company. No push, no merge.

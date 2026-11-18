# Generator import and export: docs-only closure

Prompt-ID: P-2026-10-30-1540
Chat: C-2026-10-30-1430
Front: codegen
Status: eseguito 2026-10-30 · lane gen-io · branch gen-io · the commit of this line
Lane: fast (docs only, closure of P-2026-10-30-1430 and P-2026-10-30-1515)
Depends: P-2026-10-30-1515 (feature commits 7fbedcc78, 03db53f3f, 9d844eca3)
Worktree: ~/jjodel-w-genio, branch gen-io
Request: none (closure)

No subagents, no background tasks, no code changes. Do not merge, do not push.

## COSA

Close the generator import/export work with one docs-only commit. Read
`~/.jjodel-lanes/P-2026-10-30-1515/handoff.md` and the last lines of `docs/claude-code-log.md`; nothing else is needed.

## DOVE

- `docs/claude-code-log.md`: one entry for P-2026-10-30-1430 + P-2026-10-30-1515 (discovery 26d27c5e9; feature
  commits 7fbedcc78, 03db53f3f, 9d844eca3; gates as reported in the 1515 handoff; acceptance fixtures 8a66dcde9;
  open items: visual check, byte comparison of the generated SMV and Verilog against the hand-entered generators,
  the SyncRTL model export without expression objects). Rotate the log if the protocol asks.
- `docs/discovery/discovery_2026-10-30_generator_import_export.md`: add `## 0. Answer in brief` at the top
  (five to eight lines: what the discovery found, notably that the base stores several generators per metamodel,
  and what Phase 2 did).
- The `Status` line of `docs/prompts/claude_2026-10-30_1430_prompt_generator_import_export.md`,
  `docs/prompts/claude_2026-10-30_1515_prompt_generator_import_export_phase2.md` and this prompt: replace it with
  date, lane, branch and sha as the protocol does.

## COME

`git add` those four files only, one commit `docs(codegen): log entry and Status flips for generator import/export (P-2026-10-30-1540)`.
End with `Outcome: done`.

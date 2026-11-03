# JjTL let and unique on called rules: close after the ceiling stop

Prompt-ID: P-2026-11-03-2325
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-03 · lane fast · 5f05b418c, 427c51d0c · SPEC and log closed, #515 commented (left open until merge), docs only (unattended)
Lane: fast (docs closure of P-2026-11-03-2111, code d8c281211 is done and gated)
Depends: P-2026-11-03-2111
Worktree: ~/jjodel-w-jjtllet, branch jjtl-let-unique-called
Request: none (Alfonso's ok of 2026-11-03 21:07, handed to this chat at 23:17)

Before anything else run pwd, git branch --show-current, git status --short: ~/jjodel-w-jjtllet on jjtl-let-unique-called, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-03-2325 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Never cat a gate log: summary lines through node scripts/run-quiet.mjs.

## COSA

Read ~/.jjodel-lanes/P-2026-11-03-2111/handoff.md, section Remaining checks, and do exactly those items:

1. frontend/src/jjtl/SPEC.md, the passages listed there.
2. Docs commit with named paths, then npm run check:docs. Check that R-JTG-15 and R-JTG-16 parse as active with npm run decisions.
3. Log entry in docs/log-inbox/hw-notation.md in P9 format (Notes under 500 characters) for the work of P-2026-11-03-2111, plus the #515 ticket paragraph; #517 stays open.
4. Update #515 on GitHub with the code commit and the fix.
5. Status line of both prompts (2111 and this one), commit.

No code change: if one seems needed, stop with Outcome: question. Do not merge. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

# JjTL language open points: close after the ceiling stop

Prompt-ID: P-2026-11-04-0043
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane fast · 1729e329a, e11159e0b · R-JTG-20 provisional split from R-JTG-18, log and tickets closed, docs only (unattended)
Lane: fast (docs closure of P-2026-11-04-0015, code 90ee317b5 is done and gated)
Depends: P-2026-11-04-0015
Worktree: ~/jjodel-w-jjtlopen, branch jjtl-language-open
Request: none (Alfonso's ok of 2026-11-03 21:07)

Before anything else run pwd, git branch --show-current, git status --short: ~/jjodel-w-jjtlopen on jjtl-language-open, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-0043 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Summary lines only, through node scripts/run-quiet.mjs.

## COSA

1. In docs/decisions.md, R-JTG-18 must not attribute to Alfonso what he did not decide. He ratified only the exemption of lazy from R-JTG-3 in pass 1. Keep that in R-JTG-18 and move the reach rule (lazyOrMatched: the type of the receiving feature decides, both fit or unknown is an error) to a new row, R-JTG-20, marked provisional, unattended, not ratified. Same check for R-JTG-17 and 19: anything beyond his words goes in provisional text. Check with parseRows through npm run decisions and npm run check:docs. SPEC.md says the reach rule is provisional.
2. Read ~/.jjodel-lanes/P-2026-11-04-0015/handoff.md if present and do its remaining items: log entry in docs/log-inbox/hw-notation.md in P9 format (Notes under 500 characters), the closure of the two tickets by their headings (no GitHub issue exists for them), Status line of both prompts.

No code change: if one seems needed, stop with Outcome: question. Do not merge. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

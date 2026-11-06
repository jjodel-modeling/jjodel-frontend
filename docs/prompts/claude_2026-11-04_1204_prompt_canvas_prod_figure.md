# Canvas: production figure of route A with the band fix

Prompt-ID: P-2026-11-04-1204
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane fast · no code change · prod b10_8 x3 at load 5.96-8.75: longest 1,385-1,451 ms, total 7,828-8,451 ms
Lane: fast (measure, no code)
Depends: P-2026-11-04-1153
Worktree: ~/jjodel-w-canvasprod, branch canvas-prod-figure
Request: none (Alfonso, 2026-11-04 08:57)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1204 · session <id>]. Final line Outcome: done | blocked. No subagents, no background tasks. One probe run per tool call. No code change. Do not merge.

## COSA

Build production in this tree. With the probe from ~/.jjodel-lanes/P-2026-11-04-1130/ copied to this lane's folder and pointed at this worktree, measure b10_8 three times: longest task, long-task total, nodes mounted. Record uptime before and after each run. A run that starts with a 1-minute load above 10 does not count: wait in a later tool call or say so. Compare with route A alone: longest 1,369 to 1,464 ms, total 6,854 to 7,397 ms at load 7, and with before route A: 2,055 to 2,148, 10,060. One log line in docs/log-inbox/hw-notation.md in P9 format, Status, docs commit with named paths. Report the table.

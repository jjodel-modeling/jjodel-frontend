# Remove the ELK open race: close after the ceiling stop

Prompt-ID: P-2026-11-04-1616
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: fast (closes P-2026-11-04-1500, code 2b3ca5dc0; critical zone go-ahead of 2026-11-04 14:41 stands, no further code expected)
Depends: P-2026-11-04-1500
Worktree: ~/jjodel-w-elkrace, branch elk-open-race
Request: none (Alfonso's ok of 2026-11-04 14:41)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1616 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime before each. Summary lines only. No code change: if one seems needed, stop with Outcome: question. Do not merge.

## COSA

Read ~/.jjodel-lanes/P-2026-11-04-1500/handoff.md and do what is left: four b10_8 runs, recording ELK calls, undo count, how many nodes React Flow holds when the open fit resolves, settled zoom and position, nodes on screen (this also answers whether the varying settled view is gone; a run starting above load 15 does not count for timing). A small demo opened on this branch and on the code before 470719b0d: crops read with the Read tool, saying what differs, since an open-time layout now runs where before it often ran on one node. List the demos whose first drawing changes. Then check:docs, log entry in P9 format, Status lines. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».

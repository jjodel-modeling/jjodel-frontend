# ELK open race: production figure of the settled view

Prompt-ID: P-2026-11-04-2131
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: fast (measure, no code)
Depends: P-2026-11-04-1616
Worktree: ~/jjodel-w-elkrace, branch elk-open-race
Request: none (Alfonso, riprendi, 2026-11-04 21:29)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-2131 · session <id>]. Final line Outcome: done | blocked. No subagents, no background tasks. One probe run per tool call. No code change. Do not merge.

## COSA

Build production in this tree. With the probe of ~/.jjodel-lanes/P-2026-11-04-1204/ plus the viewport watcher of ~/.jjodel-lanes/P-2026-11-04-1616/probe/, copied to this lane's folder: five b10_8 runs on production, recording uptime before each (a run starting above load 15 does not count, say so), nodes React Flow holds when the open fit resolves, settled zoom and position, nodes on screen, longest task, long-task total. Goal: is the settled view now stable in production (trunk run earlier: zoom 1 with 4 nodes in one of three). One log line, Status, docs commit with named paths. Report the table.

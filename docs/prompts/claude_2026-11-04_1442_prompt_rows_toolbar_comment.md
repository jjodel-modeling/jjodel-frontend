# R-JTG-21, 22 ratified, R-JTG-22 rewritten; Toolbar comment

Prompt-ID: P-2026-11-04-1442
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane fast · docs commit below · verifica visiva non applicabile (docs and comment only)
Lane: fast (Alfonso's ok of 2026-11-04 14:41)
Depends: none
Worktree: ~/jjodel-w-rowscomment, branch rows-toolbar-comment
Request: none (Alfonso's ok of 2026-11-04 14:41)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1442 · session <id>]. Final line Outcome: done | blocked. No subagents. Do not merge.

## COSA

1. docs/decisions.md: rewrite R-JTG-22 so that it states one rule without contradicting itself: inside a let body a missing class and an abstract class are errors, the shape of the creation stays unchecked. Mark R-JTG-21 and R-JTG-22 ratified by Alfonso 2026-11-04. Check through npm run decisions and check:docs.
2. frontend/src/components/.../Toolbar.tsx lines about 1250-1254: the comment says the percent button fits the view; it runs setZoom(1). Correct the comment only. Grep the file by name.
3. Log entry in docs/log-inbox/hw-notation.md in P9 format, Status line. Docs and comment in separate commits, named paths. Gates: tsc, check:docs.

# JjTL output tab: discovery on the React rendering of a large canvas (#475, #547)

Prompt-ID: P-2026-11-04-0256
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: discovery (read-only; hard stop before any code)
Depends: none
Worktree: ~/jjodel-w-jjtlrender, branch jjtl-canvas-render
Request: none (Alfonso's ok of 2026-11-04 02:50)

Before anything else run pwd, git branch --show-current, git status --short: ~/jjodel-w-jjtlrender on jjtl-canvas-render, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-0256 · session <id>]. Final line Outcome: question. No subagents, no background tasks. One probe run per tool call. Summary lines only. No source change.

## COSA

The longest task after the output tab mounts is React rendering of every canvas node (#547: b10_8 3,354 ms; DynamicHandles 575, store subscriptions 472, ObjectNode 377). Compare two routes on b10_8 and b11_9: rendering only the visible nodes, and cheaper per-node selectors. For each: what it would change in EditorV2.tsx, ObjectNode.tsx, DynamicHandles.tsx; what it risks for handles and edges of nodes not rendered (the handle pipeline in CLAUDE.md 3.1, port distribution, fit-to-view, selection, export); whether it needs the critical zone; expected gain, measured with a throwaway patch in the lane folder wherever possible, otherwise marked as estimated. Use the profile probe in ~/.jjodel-lanes/P-2026-11-03-2332/, with uptime recorded.

Save the report as docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md: goal, files read with full paths, findings, risks, open questions for Alfonso. Commit only the report and the Status line, then stop with one line Recommended: <one line>.

## DOVE

Read only, except the report and the Status line. Probes in ~/.jjodel-lanes/P-2026-11-04-0256/. The repo is public: name no partner company.

## COME

Dev server figures only, say so. A probe is not a hand run. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».

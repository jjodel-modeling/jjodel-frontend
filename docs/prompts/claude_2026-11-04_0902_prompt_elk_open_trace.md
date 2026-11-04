# Auto-layout on open: trace the main-thread freeze, read-only

Prompt-ID: P-2026-11-04-0902
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: discovery (read-only; Alfonso's delegation, 2026-11-04 08:57)
Depends: none
Worktree: ~/jjodel-w-elktrace, branch elk-open-trace
Request: none (Alfonso, 2026-11-04 08:57)

Before anything else run pwd, git branch --show-current, git status --short: the stated worktree and branch, clean, otherwise stop with Outcome: blocked. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime recorded before each timing run. Summary lines only, through node scripts/run-quiet.mjs. Commit each green step, before probes: lanes hit the context ceiling in 15 to 30 minutes. A question with one recommendation carries a line Recommended: <one line>. The repo is public: name no partner company. A probe is not a hand run. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso». Every reply opens with [P-2026-11-04-0902 · session <id>]. No source change, and no patch in the source tree: instrument from the probe. Time limit about 25 minutes.

## COSA

Section 5 of docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md: 1 of 9 b10_8 runs ran ELK on open 117,474 ms on the main thread (EditorV2.tsx:603); a b11_9 profiled run blocked over 7 minutes. Find why it is intermittent: read shouldAutoLayoutOnOpen, autoLayoutRef, armReLayoutRef, what decides ELK vs. the default placement and which inputs ELK gets in the slow case. Try to reproduce with the probe in ~/.jjodel-lanes/P-2026-11-03-2332/ under no more than 5 runs; a reproduction is not required. Compare the fixes: a node-count cap, a worker, removing the race. Save the report as docs/discovery/discovery_2026-11-04_elk_open_freeze.md: goal, files read with full paths, findings marked measured or read, risks, open questions. Commit only the report and the Status line, then stop with Outcome: question and one line Recommended.

## DOVE

Read only, except the report and the Status line. Probes in ~/.jjodel-lanes/P-2026-11-04-0902/.

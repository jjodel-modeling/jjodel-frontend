# Auto-layout on open: size cap

Prompt-ID: P-2026-11-04-0926
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: full (recommendation of P-2026-11-04-0902, adopted on Alfonso's delegation, 2026-11-04 08:57)
Depends: P-2026-11-04-0902
Worktree: ~/jjodel-w-elkcap, branch elk-open-cap (includes the discovery report)
Request: none (Alfonso, 2026-11-04 08:57)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-0926 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Summary lines only, through node scripts/run-quiet.mjs. Commit each green step. A question with one recommendation carries a line Recommended: <one line>. A probe is not a hand run. Do not merge. The repo is public: name no partner company.

## COSA

Read docs/discovery/discovery_2026-11-04_elk_open_freeze.md. Add to shouldAutoLayoutOnOpen (utils/autoLayoutOnOpen) a cap: above about 500 nodes or 500 edges, whichever the report shows drives the cost, no auto-layout on open; the vertices keep their default placement. The explicit layout command is not capped. The console says once why the layout was skipped. Removing the race is out: it is critical zone.

Before coding list the demo and fixture models above the cap, with counts. If a model the demos open relies on auto-layout on open, stop with Outcome: question. Also write the prompt-log entry owed by P-2026-11-04-0902.

## DOVE

The file of shouldAutoLayoutOnOpen and its test, the call site in EditorV2.tsx only if the counts must be passed in, docs/log-inbox/hw-notation.md, the Status line. No critical zone, no CLAUDE.md 3.2 file.

## COME

Tests first, red for the intended reason, including the value at the cap and above it. Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. One app probe on b10_8: no auto-layout on open, the tab opens. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».

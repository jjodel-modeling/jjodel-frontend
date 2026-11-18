# Remove the ELK open race: continue after the ceiling stop

Prompt-ID: P-2026-11-04-1500
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane elk-open-race · commits 470719b0d, 2b3ca5dc0 · open-time layout once the open settles, 10 s deadline · closed by P-2026-11-04-1616 · app probes, no hand run
Lane: full (critical zone, go-ahead by Alfonso of 2026-11-04 14:41, continues P-2026-11-04-1444)
Depends: P-2026-11-04-1444
Worktree: ~/jjodel-w-elkrace, branch elk-open-race
Request: none (Alfonso's ok of 2026-11-04 14:41)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1500 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime before timing runs. Summary lines only. Commit each green step, before probes. Do not merge.

## COSA

Read ~/.jjodel-lanes/P-2026-11-04-1444/handoff.md and lir_draft.md and do the remaining steps as prompt P-2026-11-04-1444 states them: LIR committed first, tests, the gate in useJjomSync.ts, the bench, the figures with ELK counted, crops read with the Read tool. Chosen: deadline 10 s unless the settle times the probe measures say otherwise, then say the value and why. The undo risk is a pass condition: read the undo count before and after each run; if the open-time layout becomes an undo step of its own, fix it inside this perimeter or stop with Outcome: question. Log entry, Status lines. Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».

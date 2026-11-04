# Auto-layout on open: remove the race in useJjomSync

Prompt-ID: P-2026-11-04-1444
Chat: C-2026-11-03-2317
Front: hw-notation
Status: eseguito 2026-11-04 · lane elk-open-race · commits 470719b0d, 2b3ca5dc0 · continued by P-2026-11-04-1500 and P-2026-11-04-1616 · app probes, no hand run
Lane: full (critical zone, go-ahead by Alfonso: ok of 2026-11-04 14:41 to question 3 of the report of 12:28)
Depends: none
Worktree: ~/jjodel-w-elkrace, branch elk-open-race
Request: none (Alfonso's ok of 2026-11-04 14:41)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1444 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime before timing runs. Summary lines only. Commit each green step, before probes. A question with one recommendation carries a line Recommended: <one line>. A probe is not a hand run. Do not merge. The repo is public: name no partner company.

## COSA

docs/discovery/discovery_2026-11-04_elk_open_freeze.md describes why the open-time ELK pass is intermittent and says removing the race touches useJjomSync.ts. The cap of 500 (b35f43b84) stays. Layer Impact Report docs/discovery/lir_2026-11-04_elk_open_race.md committed before any code: IR, canvas, layout, edges, undo group of R-JTG-14, route A. Then, tests first, make the open-time outcome repeatable under the cap: a model opened under the same conditions gets the same layout decision, nodes do not jump after the user has started working, and a user's edit is never overwritten by a late layout. Touch only useJjomSync.ts of the critical zone, not portDistribution.ts. Do not change EditorV2.tsx unless the call site needs it: lane P-2026-11-04-1443 works there; say if you do.

Figures: run five times a graph under the cap and b10_8, count ELK calls by wrapping elk.layout from the probe, before and after. Crops read with the Read tool. If the race cannot be removed within this perimeter, stop with Outcome: question and the figures.

## DOVE

frontend/src/components/editor-v2/hooks/useJjomSync.ts and its test, the LIR, docs/log-inbox/hw-notation.md, the Status line. No CLAUDE.md 3.2 file. Probes in ~/.jjodel-lanes/P-2026-11-04-1444/.

## COME

Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».

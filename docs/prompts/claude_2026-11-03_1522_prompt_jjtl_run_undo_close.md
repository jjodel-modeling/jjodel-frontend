# A JjTL run is one undo step: close

Prompt-ID: P-2026-11-03-1522
Chat: C-2026-11-03-1020
Front: hw-notation
Status: da eseguire
Lane: full (continues P-2026-11-03-1435 after its context ceiling)
Depends: P-2026-11-03-1435
Worktree: ~/jjodel-w-jjtlundo, branch jjtl-run-undo (the same tree, at the commit that adds this prompt)
Request: none (continuation; Alfonso's request of 2026-11-03 10:20)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlundo` on
`jjtl-run-undo`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1522 · session <id>]`.
No subagents, no background tasks. Commit each step. Print only summary lines. Read only `~/.jjodel-lanes/P-2026-11-03-1435/handoff.md`. No new app probes: they are done. Stop the Vite server whose pid is in `~/.jjodel-lanes/P-2026-11-03-1435/probe/vite.pid` if it still answers on 3241.

## COSA

1. Full vitest: the 3 files red at import must be `context-binding`, `ai-prompt-sanitization`, `UDComparator`. Build. Typecheck.
2. A further `feat:` commit if anything changes; do not rewrite history.
3. The row R-JTG-14 in `docs/decisions.md` (provisional, unattended, evidence the probe of P-2026-11-03-1435), checked against `parseRows` of `frontend/scripts/gates/docs-digest.ts`: a run is one undo step, group closed after 800 ms with no store writes, 180 s cap; the tab and its vertices are part of the step; Redo restores the model and does not reopen the tab.
4. Ticket, medium or higher by what it does, separate call: a rule whose target class does not exist (`-> Nope`) runs without error and writes a partial model, 4 nested objects of 10. Ticket, low: an edit made while a run is writing is undone with the run.
5. Log entry with the probe table, stating it is a probe and no hand run. `Status:` of both prompts. `check:docs`. Update #458.

## DOVE

`docs/decisions.md` (one row), `docs/log-inbox/hw-notation.md`, the `Status:` lines, the code files only if a gate fails. The repo is public: name no partner company.

## COME

Named paths. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.

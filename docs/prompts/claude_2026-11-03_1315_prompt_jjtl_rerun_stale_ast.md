# JjTL: a re-run in the same tab executes a stale AST (#446)

Prompt-ID: P-2026-11-03-1315
Chat: C-2026-11-03-1020
Front: hw-notation
Status: eseguito 2026-11-03 · lane full · jjtl-rerun-stale-ast · 0d0b00228 · trace, mapping count and output model read by the app probe, no manual look (unattended)
Lane: full (a wrong result with no signal)
Depends: none
Worktree: ~/jjodel-w-jjtlrerun, branch jjtl-rerun-stale-ast (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlrerun` on
`jjtl-rerun-stale-ast`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1315 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read ticket #446, `~/.jjodel-lanes/P-2026-11-02-1838/probe/a0-writeback.ts`, then what the cause leads to, starting at `JjtlDevelopmentEnv` and `useJjtlParser`.

## COSA

Reproduce #446 with that probe without its fresh-tab workaround: failing test or probe first, then the root cause, then the fix where the cause is. P-2026-11-03-1016 removed a parser path for collections, merged today: check whether both parse paths still exist before testing them.

Acceptance: change the source, Execute in the same tab, and the trace shows the new rules, on every parse path that exists. Probe in the running app on a free port, one fresh tab, the model read back.

If it does not reproduce, say so with the attempts made, leave the ticket open, and do not fix by guesswork.

## DOVE

`frontend/src/jjtl/` (the component or hook holding the cause and its test), `frontend/src/jjtl/SPEC.md` section 12 if a row changes, `docs/log-inbox/hw-notation.md`, the `Status:` line. Probes in `~/.jjodel-lanes/P-2026-11-03-1315/`. Not touched: `ProjectEditor.tsx` (another branch has it open), every CLAUDE.md 3.2 file. If the cause is there, stop with `Outcome: question` and one recommendation. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (9 files red at import are the known baseline), build, `check:docs`. Update #446, do not close it before the merge. A probe is not a hand run: say which was made. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.

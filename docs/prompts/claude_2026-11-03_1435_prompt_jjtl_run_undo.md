# JjTL: a run is one undo step (#458)

Prompt-ID: P-2026-11-03-1435
Chat: C-2026-11-03-1020
Front: hw-notation
Status: da eseguire
Lane: full (undo of a JjTL run in the app)
Depends: none
Worktree: ~/jjodel-w-jjtlundo, branch jjtl-run-undo (at the commit that adds this prompt)
Request: none (Alfonso's request of 2026-11-03 10:20, plan for the open JjTL points; words in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-jjtlundo` on
`jjtl-run-undo`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-03-1435 · session <id>]`.
No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green. Print only summary lines. Read ticket #458, R-RFB-12 and the row beside it in `docs/decisions.md`, how script runs close their undo step, STEP 6 to STEP 8b of `ProjectEditor.tsx`.

## COSA

Undo after a JjTL run does nothing today. As for script runs (R-RFB-12), one Undo removes everything a run wrote, including the output model and its tab (same behaviour as Create model); Redo brings it back. Adopted unless Alfonso vetoes.

The undo group closes after the last write, and the group must not add a TRANSACTION around creators (NN-12). If this conflicts with NN-12, or needs the reducer, `action.ts`, `joiner/classes.ts` or a CLAUDE.md 3.2 file, stop with `Outcome: question` and one recommendation, before any diff outside the DOVE.

Base: this branch has the trunk's write-back. Branch `jjtl-output-tab-late` (not merged, waiting for Alfonso) moves STEP 7 to the end of STEP 8. Keep your diff away from the STEP 7 lines, and say how the two compose: a tab opened after the write must fall inside the group.

Register one row in `docs/decisions.md` (provisional, unattended) and check it against `parseRows` of `frontend/scripts/gates/docs-digest.ts`.

## Acceptance

In the app, a probe on a free port, through the real Execute dialog: run, Undo, nothing left (no model, no tab, no vertices, no pointers); Redo, everything back with attributes and references; a second run after an Undo; a run that reports a failure; a large run (`b10_8`, probe in `~/.jjodel-lanes/P-2026-11-03-1033/probe/`), recording how long Undo blocks the page. What happens to an edit made while a run is writing: try it, report it, do not fix it. A probe is not a hand run.

## DOVE

`frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/components/project/nestedMaterialization.ts` and its test, `docs/decisions.md` (one row), `frontend/src/jjtl/SPEC.md` if a row changes, `docs/log-inbox/hw-notation.md`, the `Status:` line. Layer Impact Report first, `docs/discovery/lir_2026-11-03_jjtl_run_undo.md`. The repo is public: name no partner company.

## COME

Tests first. Named paths, code and docs in separate commits. Gates: `tsc`, full vitest (3 files red at import are the baseline now), build, `check:docs`. Update #458. If context runs short, commit what is green and write the handoff. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.

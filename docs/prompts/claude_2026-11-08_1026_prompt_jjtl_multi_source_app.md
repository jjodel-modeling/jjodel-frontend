# JjTL: several source models in the app's run dialog (S4)

Prompt-ID: P-2026-11-08-1026
Chat: C-2026-11-03-1202
Front: hw-notation
Status: da eseguire
Lane: full (unattended; discovery of the dialog first in this lane, then the change; more than five files)
Depends: P-2026-11-08-1025
Worktree: ~/jjodel-w-multisrcapp, branch jjtl-multi-source-app
Request: none (Alfonso's words are in request.md of this lane)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-multisrcapp` on `jjtl-multi-source-app`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1026 · session <id>]`. No subagents, no background tasks. One probe run per tool call. Print only summary lines. Commit as soon as the gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## COSA

R-JTG-26 (several models of one metamodel), R-JTG-27 (the run dialog keeps a primary model plus an «also include» list) and R-JTG-31 (the executor takes a list of models as an array of arrays, one trace model name), all ratified. Read the S4 section and its Layer Impact Report in `docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md`.

1. Read first, write a short section 0 in the lane's report before any code: where the dialog picks the source model today (`frontend/src/jjtl/components/ExecuteTransformationDialog.tsx`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx`), how the source is serialized for the executor, where a run is recorded for a re-run.
2. The dialog: the primary model as today; under it an «Also include» list of the other models conforming to the same metamodel, unchecked by default, hidden when there is none. Nothing changes when none is checked: same serialization, same output model name (from the primary), same record. Design tokens of the project (slate base, 11px secondary text, 8px grid, Bootstrap Icons only); no layout shift when the list appears.
3. The run: the primary first, then the included ones, passed as the list of R-JTG-31; the shared-id error of S3 is shown like any other run error. The record of a run keeps the included model ids, optional, read back by a re-run; an older record without them behaves as today.
4. Tests for the serialization and the record. A Playwright probe on a dev server of this tree (free port above 3010, never 3000, 3001 or 3003): a project with a metamodel and two models, the dialog with and without the list, a run with one included model whose objects a rule maps, the output model holding them; screenshots of the dialog (closed list, open list, a run error) into `~/.jjodel-lanes/P-2026-11-08-1026/crops/`, light theme only. Stop the server after.

Report: `docs/discovery/discovery_2026-11-08_jjtl_multi_source_app.md`, in English, beginning with `## 0. Answer in brief`.

Gates: typecheck, the FULL vitest suite, build, `check:docs`.

## DOVE

Written: the three files above and what they strictly need (state each extra file and why), their tests, `frontend/src/jjtl/SPEC.md` §9, the report, `docs/log-inbox/hw-notation.md`, the `Status:` line. Stop with `Outcome: question` for a critical-zone file, a change of the persisted project format beyond an optional field, or a renamed CSS class.

## COME

Atomic commits, named paths, docs and code never in one commit. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line.

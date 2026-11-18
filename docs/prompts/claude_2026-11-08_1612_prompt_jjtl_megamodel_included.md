# Megamodel: included source models are inputs of the run, with their own edges

Prompt-ID: P-2026-11-08-1612
Chat: C-2026-11-03-1202
Front: hw-notation
Status: eseguito 2026-11-08 · lane full · 295c5429b, 7c172384a · closed by P-2026-11-08-1720 after the context ceiling · crop viewed and accepted by the chat
Lane: full (unattended, Alfonso delegated the choice to the chat on 2026-11-08 16:04)
Depends: P-2026-11-08-1230 (merged on trunk as c06d9f6d)
Worktree: ~/jjodel-w-megainc, branch jjtl-megamodel-included (fresh from alfonso-frontend-jjtl)
Request: Alfonso, 2026-11-08 16:04, «decidi tu» on whether the megamodel draws edges for the models of «Also include».

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-megainc` on `jjtl-megamodel-included`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-08-1612 · session <id>]`. Read CLAUDE.md and the last entries of `docs/claude-code-log.md`. No subagents, no background tasks. One probe run per tool call. Print only summary lines of suites and probes. Commit as soon as each item's gates are green. The repo is public: name no partner company and no path outside this tree in anything committed.

## Decision of the chat (to register as R-JTG-35)

A run with included models has several inputs, and provenance must show all of them. The megamodel draws, for each included model, the same kind of edge it draws today for the primary source model of a run (the edge read today as `sourceOf` or `instanceInputOf`, whichever the code uses for the primary), from the included model to the generated model or to the run, with no new edge kind. The primary keeps its edge unchanged. `ModelArtifact.generatedBy` gains one optional field listing the included models' ids in run order (optional field only, no existing field changed or removed). Generated models from runs before this change have no such field and draw as today; no migration (consistent with the earlier choice of no migration of saved projects).

## COSA

Phase 1, discovery (short, read-only): find where `generatedBy` is written after a run (the run path of `ProjectEditor.tsx` and `ExecuteTransformationDialog.tsx` from P-2026-11-08-1026/1230), where the megamodel builds its edges from it, how the edge of the primary source is named and drawn, and whether `generatedBy` is serialised in saved projects. Save the report as `docs/discovery/discovery_2026-11-08_jjtl_megamodel_included.md` (English, `## 0. Answer in brief` first, each figure marked measured or read). No hard stop after it unless a stop condition below holds.

1. Add the optional field to `generatedBy`'s type, write it on every run with included models (empty or absent when none), and keep it through save and load if `generatedBy` is already serialised.
2. Draw one edge per included model in the megamodel, same kind and style as the primary's edge, distinguishable only by its source end. If the megamodel shows a label or tooltip on the primary's edge, give the included ones the same text plus «(included)».
3. Re-running from the dialog with a different included selection replaces the field of the newly generated model; it does not touch older generated models.
4. Tests: unit tests for writing the field, for save and load round trip if serialised, and for the edge builder (zero, one, three included models; a legacy `generatedBy` without the field). Mutation check on the edge builder: removing the new loop must fail a test.
5. Probe in the browser: run with two included models, open the megamodel, crop it as `1_megamodel_two_included.png` in `~/.jjodel-lanes/P-2026-11-08-1612/crops/`, and view it yourself before committing. The three source models and their three edges must be visible and not overlapping.
6. Register R-JTG-35 next to R-JTG-34, header format as R-JTG-33/34 (`decided by chat under Alfonso's delegation 2026-11-08 16:04, registered by P-2026-11-08-1612, evidence: …, verified: …, reversible: trunk`); SPEC §9; the rest of the report; the log entry; the `Status:` line of this prompt.
7. Gates: typecheck, the FULL vitest suite (not only `jjtl/`), build, `check:docs`.

Stop with `Outcome: question` if: the edge of the primary is built in a critical-zone file (`useJjomSync.ts`, `portDistribution.ts`); drawing the new edges needs a change to an existing interface beyond one optional field; the megamodel layout would need a new layout rule to keep three edges apart.

## DOVE

The type that declares `ModelArtifact.generatedBy`, the run path that writes it, the megamodel's edge builder and its view, their tests, `frontend/src/jjtl/SPEC.md`, the decisions file holding R-JTG-34, the report, the log. No renamed CSS class.

## COME

Atomic commits, named paths (`git add <files>`, never `git add .`), docs and code never in one commit, conventional messages in English. Do not merge. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso» and the `Outcome:` line. Context ceiling: write `handoff.md` and stop with `Outcome: hard-stop`.
